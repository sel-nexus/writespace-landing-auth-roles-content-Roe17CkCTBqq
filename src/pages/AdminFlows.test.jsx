import {
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  MESSAGES,
  ROLES,
  STORAGE_KEYS,
} from '../constants';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';

const CREATED_AT = '2026-10-14T12:00:00.000Z';
const GENERATED_USER_ID =
  '9c16929e-8e64-4ff0-b290-43f407781fa3';
const randomUUIDDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.crypto,
  'randomUUID',
);

function createAdminSession(overrides = {}) {
  return {
    userId: 'admin',
    username: 'admin',
    displayName: 'Admin',
    role: ROLES.ADMIN,
    ...overrides,
  };
}

function createUser(overrides = {}) {
  return {
    id: 'user-1',
    displayName: 'Demo User',
    username: 'demo_user',
    password: 'fake-password',
    role: ROLES.USER,
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function createPost(overrides = {}) {
  return {
    id: 'post-1',
    title: 'A demo post',
    content: 'This is the complete demo post content.',
    createdAt: CREATED_AT,
    authorId: 'user-1',
    authorName: 'Demo User',
    ...overrides,
  };
}

function persistUsers(users) {
  window.localStorage.setItem(
    STORAGE_KEYS.users,
    JSON.stringify(users),
  );
}

function persistPosts(posts) {
  window.localStorage.setItem(
    STORAGE_KEYS.posts,
    JSON.stringify(posts),
  );
}

function persistSession(session) {
  window.localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify(session),
  );
}

function renderDashboard({
  session = createAdminSession(),
  onLogout = vi.fn(() => ({ ok: true })),
} = {}) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboard onLogout={onLogout} session={session} />
    </MemoryRouter>,
  );
}

function renderUserManagement({
  session = createAdminSession(),
  onLogout = vi.fn(() => ({ ok: true })),
} = {}) {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <UserManagement onLogout={onLogout} session={session} />
    </MemoryRouter>,
  );
}

function mockRandomUUID(value = GENERATED_USER_ID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: vi.fn(() => value),
  });
}

async function completeAccountForm(
  user,
  {
    displayName = 'Local Manager',
    username = 'local_manager',
    password = 'fake-admin-password',
    role = ROLES.ADMIN,
  } = {},
) {
  await user.type(
    screen.getByRole('textbox', { name: 'Display name' }),
    displayName,
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Username' }),
    username,
  );
  await user.type(
    screen.getByLabelText('Password'),
    password,
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Role' }),
    role,
  );
}

function expectStatValue(title, value) {
  const heading = screen.getByRole('heading', {
    name: title,
  });
  const card = heading.closest('article');

  expect(card).not.toBeNull();
  expect(within(card).getByText(String(value))).toBeInTheDocument();
}

afterEach(() => {
  vi.restoreAllMocks();

  if (randomUUIDDescriptor) {
    Object.defineProperty(
      globalThis.crypto,
      'randomUUID',
      randomUUIDDescriptor,
    );
  } else {
    delete globalThis.crypto.randomUUID;
  }
});

describe('AdminDashboard', () => {
  it('includes the permanent Admin in all account aggregates and renders all four statistics', async () => {
    persistUsers([
      createUser(),
      createUser({
        id: 'user-2',
        displayName: 'Second User',
        username: 'second_user',
      }),
      createUser({
        id: 'local-admin',
        displayName: 'Local Admin',
        username: 'local_admin',
        role: ROLES.ADMIN,
      }),
    ]);
    persistPosts([
      createPost(),
      createPost({
        id: 'post-2',
        title: 'Second post',
      }),
    ]);

    renderDashboard();

    await screen.findByRole('heading', {
      name: 'Admin Dashboard',
    });

    expectStatValue('Total Posts', 2);
    expectStatValue('Total Users', 4);
    expectStatValue('Total Admins', 2);
    expectStatValue('Total users', 2);
  });

  it('shows only the newest five posts and exposes dashboard quick actions', async () => {
    persistPosts([
      createPost({
        id: 'post-1',
        title: 'Oldest post',
        createdAt: '2026-01-01T12:00:00.000Z',
      }),
      createPost({
        id: 'post-2',
        title: 'Second post',
        createdAt: '2026-02-01T12:00:00.000Z',
      }),
      createPost({
        id: 'post-3',
        title: 'Third post',
        createdAt: '2026-03-01T12:00:00.000Z',
      }),
      createPost({
        id: 'post-4',
        title: 'Fourth post',
        createdAt: '2026-04-01T12:00:00.000Z',
      }),
      createPost({
        id: 'post-5',
        title: 'Fifth post',
        createdAt: '2026-05-01T12:00:00.000Z',
      }),
      createPost({
        id: 'post-6',
        title: 'Newest post',
        createdAt: '2026-06-01T12:00:00.000Z',
      }),
    ]);

    renderDashboard();

    const recentHeadings = await screen.findAllByRole('heading', {
      level: 3,
    });

    expect(
      recentHeadings.map((heading) => heading.textContent),
    ).toEqual([
      'Newest post',
      'Fifth post',
      'Fourth post',
      'Third post',
      'Second post',
    ]);
    expect(screen.queryByText('Oldest post')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Write a Post' }),
    ).toHaveAttribute('href', '/write');
    expect(
      screen.getByRole('link', { name: 'Manage Users' }),
    ).toHaveAttribute('href', '/users');
    expect(
      screen.getByRole('link', { name: 'View all posts' }),
    ).toHaveAttribute('href', '/blogs');
  });

  it('reports a failed dashboard deletion and preserves the post', async () => {
    const user = userEvent.setup();
    const session = createAdminSession();
    const storedPost = createPost({
      title: 'Post that cannot be deleted',
    });

    persistSession(session);
    persistPosts([storedPost]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDashboard({ session });

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete Post that cannot be deleted',
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith(
      MESSAGES.deletePostConfirmation,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      MESSAGES.storageUnavailable,
    );
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.posts),
      ),
    ).toEqual([storedPost]);

    await waitFor(() => {
      expect(deleteButton).toBeEnabled();
    });
  });
});

describe('UserManagement', () => {
  it('validates every required account field and focuses the first invalid input', async () => {
    const user = userEvent.setup();

    renderUserManagement();

    await user.click(
      screen.getByRole('button', { name: 'Create Account' }),
    );

    const displayNameInput = screen.getByRole('textbox', {
      name: 'Display name',
    });

    expect(
      screen.getByText(MESSAGES.displayNameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.usernameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.passwordRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.roleRequired),
    ).toBeInTheDocument();
    expect(displayNameInput).toHaveFocus();
    expect(displayNameInput).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(
      window.localStorage.getItem(STORAGE_KEYS.users),
    ).toBeNull();
  });

  it('rejects usernames already in use after trimming and case normalization', async () => {
    const user = userEvent.setup();
    const existingUser = createUser({
      username: 'Demo_User',
    });

    persistUsers([existingUser]);
    renderUserManagement();

    await completeAccountForm(user, {
      username: '  DEMO_USER  ',
      role: ROLES.USER,
    });
    await user.click(
      screen.getByRole('button', { name: 'Create Account' }),
    );

    const usernameInput = screen.getByRole('textbox', {
      name: 'Username',
    });

    expect(
      screen.getByText(MESSAGES.usernameInUse),
    ).toBeInTheDocument();
    expect(usernameInput).toHaveFocus();
    expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.users),
      ),
    ).toEqual([existingUser]);
  });

  it('creates the selected role with a UUID and runtime timestamp', async () => {
    mockRandomUUID();
    const user = userEvent.setup();
    const session = createAdminSession();

    persistSession(session);
    const earliestTimestamp = Date.now();
    renderUserManagement({ session });

    await completeAccountForm(user, {
      displayName: '  Local Manager  ',
      username: '  local_manager  ',
      role: ROLES.ADMIN,
    });
    await user.click(
      screen.getByRole('button', { name: 'Create Account' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Account created.',
    );

    const persistedUsers = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.users),
    );
    const latestTimestamp = Date.now();

    expect(persistedUsers).toEqual([
      {
        id: GENERATED_USER_ID,
        displayName: 'Local Manager',
        username: 'local_manager',
        password: 'fake-admin-password',
        role: ROLES.ADMIN,
        createdAt: expect.any(String),
      },
    ]);
    expect(
      Date.parse(persistedUsers[0].createdAt),
    ).toBeGreaterThanOrEqual(earliestTimestamp);
    expect(
      Date.parse(persistedUsers[0].createdAt),
    ).toBeLessThanOrEqual(latestTimestamp);

    const accountName = screen.getByText('Local Manager');
    const accountRow = accountName.closest('article');

    expect(accountRow).not.toBeNull();
    expect(within(accountRow).getByText('Admin')).toBeInTheDocument();
    expect(
      within(accountRow).getByRole('button', {
        name: 'Delete Local Manager',
      }),
    ).toBeEnabled();
  });

  it('renders equivalent mobile labels and desktop column labels for every account', async () => {
    persistUsers([
      createUser({
        displayName: 'Responsive User',
        username: 'responsive_user',
      }),
    ]);

    renderUserManagement();

    await screen.findByText('Responsive User');

    expect(screen.getAllByText('Account')).toHaveLength(3);
    expect(screen.getAllByText('Role')).toHaveLength(3);
    expect(screen.getAllByText('Created')).toHaveLength(3);
    expect(screen.getAllByText('Actions')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Delete Admin' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Delete Responsive User',
      }),
    ).toBeInTheDocument();
  });

  it('prevents deletion of the permanent Admin and the signed-in account', async () => {
    const localAdmin = createUser({
      id: 'local-admin',
      displayName: 'Current Local Admin',
      username: 'current_admin',
      role: ROLES.ADMIN,
    });
    const session = createAdminSession({
      userId: localAdmin.id,
      username: localAdmin.username,
      displayName: localAdmin.displayName,
    });

    persistUsers([localAdmin]);
    persistSession(session);
    renderUserManagement({ session });

    const permanentAdminButton = await screen.findByRole('button', {
      name: 'Delete Admin',
    });
    const currentUserButton = screen.getByRole('button', {
      name: 'Delete Current Local Admin',
    });

    expect(permanentAdminButton).toBeDisabled();
    expect(currentUserButton).toBeDisabled();
    expect(
      screen.getByText(
        'The permanent Admin account cannot be deleted.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('You cannot delete your own account.'),
    ).toBeInTheDocument();
  });

  it('deletes a confirmed account while preserving posts authored by that account', async () => {
    const user = userEvent.setup();
    const session = createAdminSession();
    const account = createUser({
      id: 'departing-user',
      displayName: 'Departing Writer',
      username: 'departing_writer',
    });
    const authoredPost = createPost({
      id: 'authored-post',
      title: 'Preserved writing',
      authorId: account.id,
      authorName: account.displayName,
    });
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValue(true);

    persistSession(session);
    persistUsers([account]);
    persistPosts([authoredPost]);
    renderUserManagement({ session });

    await user.click(
      await screen.findByRole('button', {
        name: 'Delete Departing Writer',
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      MESSAGES.deleteUserConfirmation,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Account deleted.',
    );
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.users),
      ),
    ).toEqual([]);
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.posts),
      ),
    ).toEqual([authoredPost]);
    expect(
      screen.queryByText('Departing Writer'),
    ).not.toBeInTheDocument();
  });
});