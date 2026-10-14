import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {
  MESSAGES,
  ROLES,
  STORAGE_KEYS,
} from '../constants';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const CREATED_AT = '2026-10-14T12:00:00.000Z';
const GENERATED_USER_ID = '9c16929e-8e64-4ff0-b290-43f407781fa3';
const randomUUIDDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.crypto,
  'randomUUID',
);

function createSession(overrides = {}) {
  return {
    userId: 'user-1',
    username: 'demo_user',
    displayName: 'Demo User',
    role: ROLES.USER,
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

function DestinationPage() {
  const location = useLocation();

  return (
    <h1>
      Destination: <span>{location.pathname}</span>
    </h1>
  );
}

function renderLogin({
  route = '/login',
  session = null,
  onLogin = null,
} = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          element={
            <LoginPage onLogin={onLogin} session={session} />
          }
          path="/login"
        />
        <Route element={<DestinationPage />} path="*" />
      </Routes>
    </MemoryRouter>,
  );
}

function renderRegister({
  route = '/register',
  session = null,
  onRegister = null,
} = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          element={
            <RegisterPage
              onRegister={onRegister}
              session={session}
            />
          }
          path="/register"
        />
        <Route element={<DestinationPage />} path="*" />
      </Routes>
    </MemoryRouter>,
  );
}

function mockRandomUUID(value = GENERATED_USER_ID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: vi.fn(() => value),
  });
}

async function completeRegistrationForm(
  user,
  {
    displayName = 'Demo Writer',
    username = 'demo_writer',
    password = 'fake-password',
    confirmPassword = password,
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
  await user.type(
    screen.getByLabelText('Confirm password'),
    confirmPassword,
  );
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

describe('LoginPage', () => {
  it('redirects an authenticated Admin to the Admin dashboard', () => {
    renderLogin({
      session: createSession({
        userId: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: ROLES.ADMIN,
      }),
    });

    expect(
      screen.getByRole('heading', {
        name: 'Destination: /admin',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Log in to WriteSpace',
      }),
    ).not.toBeInTheDocument();
  });

  it('redirects an authenticated user to the blogs page', () => {
    renderLogin({
      session: createSession(),
    });

    expect(
      screen.getByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
  });

  it('authenticates the permanent Admin with a normalized username and navigates to the Admin dashboard', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn(() => ({ ok: true }));
    renderLogin({ onLogin });

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      '  ADMIN  ',
    );
    await user.type(
      screen.getByLabelText('Password'),
      'admin',
    );
    await user.click(
      screen.getByRole('button', { name: 'Log in' }),
    );

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith({
      userId: 'admin',
      username: 'admin',
      displayName: 'Admin',
      role: ROLES.ADMIN,
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /admin',
      }),
    ).toBeInTheDocument();
  });

  it('authenticates a browser-local user and navigates to the blogs page', async () => {
    const user = userEvent.setup();
    const localUser = createUser();
    const onLogin = vi.fn(() => ({ ok: true }));

    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([localUser]),
    );
    renderLogin({ onLogin });

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      '  DEMO_USER ',
    );
    await user.type(
      screen.getByLabelText('Password'),
      localUser.password,
    );
    await user.click(
      screen.getByRole('button', { name: 'Log in' }),
    );

    expect(onLogin).toHaveBeenCalledWith({
      userId: localUser.id,
      username: localUser.username,
      displayName: localUser.displayName,
      role: ROLES.USER,
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
  });

  it('uses the local account role to select the successful login destination', async () => {
    const user = userEvent.setup();
    const localAdmin = createUser({
      id: 'local-admin',
      displayName: 'Local Admin',
      username: 'local_admin',
      password: 'admin-demo-password',
      role: ROLES.ADMIN,
    });

    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([localAdmin]),
    );
    renderLogin({
      onLogin: vi.fn(() => ({ ok: true })),
    });

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      localAdmin.username,
    );
    await user.type(
      screen.getByLabelText('Password'),
      localAdmin.password,
    );
    await user.click(
      screen.getByRole('button', { name: 'Log in' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /admin',
      }),
    ).toBeInTheDocument();
  });

  it('shows the exact generic error for invalid credentials without invoking the login callback', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    renderLogin({ onLogin });

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      'unknown_user',
    );
    await user.type(
      screen.getByLabelText('Password'),
      'wrong-password',
    );
    await user.click(
      screen.getByRole('button', { name: 'Log in' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /^Invalid username or password\.$/,
    );
    expect(onLogin).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', {
        name: 'Log in to WriteSpace',
      }),
    ).toBeInTheDocument();
  });

  it('renders the exact browser-local notices and masks the password input', () => {
    renderLogin();

    expect(
      screen.getByText(MESSAGES.fakeInformationWarning),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.passwordWarning),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('validates required credentials and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    renderLogin({ onLogin });

    await user.click(
      screen.getByRole('button', { name: 'Log in' }),
    );

    const usernameInput = screen.getByRole('textbox', {
      name: 'Username',
    });
    const passwordInput = screen.getByLabelText('Password');

    expect(
      screen.getByText(MESSAGES.usernameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.passwordRequired),
    ).toBeInTheDocument();
    expect(usernameInput).toHaveFocus();
    expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('keeps the login page visible when saving the session fails', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn(() => ({
      ok: false,
      message: 'Browser-local login could not be saved.',
    }));
    renderLogin({ onLogin });

    await user.type(
      screen.getByRole('textbox', { name: 'Username' }),
      'admin',
    );
    await user.type(
      screen.getByLabelText('Password'),
      'admin',
    );
    await user.click(
      screen.getByRole('button', { name: 'Log in' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Browser-local login could not be saved.',
    );
    expect(
      screen.getByRole('heading', {
        name: 'Log in to WriteSpace',
      }),
    ).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('redirects an authenticated Admin to the Admin dashboard', () => {
    renderRegister({
      session: createSession({
        userId: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: ROLES.ADMIN,
      }),
    });

    expect(
      screen.getByRole('heading', {
        name: 'Destination: /admin',
      }),
    ).toBeInTheDocument();
  });

  it('redirects an authenticated user to the blogs page', () => {
    renderRegister({
      session: createSession(),
    });

    expect(
      screen.getByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Register for WriteSpace',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the exact browser-local notices and masks both password inputs', () => {
    renderRegister();

    expect(
      screen.getByText(MESSAGES.fakeInformationWarning),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.passwordWarning),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    expect(
      screen.getByLabelText('Confirm password'),
    ).toHaveAttribute('type', 'password');
  });

  it('validates all required registration fields and focuses the display name', async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();
    renderRegister({ onRegister });

    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
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
      screen.getByText('Confirm password is required.'),
    ).toBeInTheDocument();
    expect(displayNameInput).toHaveFocus();
    expect(displayNameInput).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(onRegister).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords and focuses the confirmation field', async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();
    renderRegister({ onRegister });

    await completeRegistrationForm(user, {
      password: 'first-password',
      confirmPassword: 'different-password',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    const confirmPasswordInput =
      screen.getByLabelText('Confirm password');

    expect(
      screen.getByText(MESSAGES.passwordsDoNotMatch),
    ).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveFocus();
    expect(confirmPasswordInput).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(onRegister).not.toHaveBeenCalled();
    expect(
      window.localStorage.getItem(STORAGE_KEYS.users),
    ).toBeNull();
  });

  it('rejects a duplicate username after trimming and case normalization', async () => {
    const user = userEvent.setup();
    const existingUser = createUser({
      username: 'Demo_Writer',
    });

    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([existingUser]),
    );
    renderRegister({
      onRegister: vi.fn(() => ({ ok: true })),
    });

    await completeRegistrationForm(user, {
      username: '  DEMO_WRITER  ',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
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

  it('creates a canonical UUID and timestamp account before saving the session, then navigates to blogs', async () => {
    mockRandomUUID();
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderRegister();

    await completeRegistrationForm(user, {
      displayName: '  Demo Writer  ',
      username: '  Demo_Writer  ',
      password: 'fake-password',
    });
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();

    const persistedUsers = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.users),
    );
    const persistedSession = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.session),
    );

    expect(persistedUsers).toHaveLength(1);
    expect(persistedUsers[0]).toEqual({
      id: GENERATED_USER_ID,
      displayName: 'Demo Writer',
      username: 'Demo_Writer',
      password: 'fake-password',
      role: ROLES.USER,
      createdAt: expect.any(String),
    });
    expect(Number.isFinite(Date.parse(persistedUsers[0].createdAt))).toBe(
      true,
    );
    expect(Object.keys(persistedUsers[0])).toEqual([
      'id',
      'displayName',
      'username',
      'password',
      'role',
      'createdAt',
    ]);
    expect(persistedSession).toEqual({
      userId: GENERATED_USER_ID,
      username: 'Demo_Writer',
      displayName: 'Demo Writer',
      role: ROLES.USER,
    });

    const writtenKeys = setItemSpy.mock.calls.map(
      ([storageKey]) => storageKey,
    );

    expect(writtenKeys).toEqual([
      STORAGE_KEYS.users,
      STORAGE_KEYS.session,
    ]);
  });

  it('writes the account before invoking the registration session callback', async () => {
    mockRandomUUID();
    const user = userEvent.setup();
    let usersObservedByCallback = null;
    const onRegister = vi.fn(() => {
      usersObservedByCallback = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.users),
      );

      return { ok: true };
    });

    renderRegister({ onRegister });
    await completeRegistrationForm(user);
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    await waitFor(() => {
      expect(onRegister).toHaveBeenCalledTimes(1);
    });
    expect(usersObservedByCallback).toEqual([
      expect.objectContaining({
        id: GENERATED_USER_ID,
        displayName: 'Demo Writer',
        username: 'demo_writer',
        role: ROLES.USER,
      }),
    ]);
    expect(onRegister).toHaveBeenCalledWith({
      userId: GENERATED_USER_ID,
      username: 'demo_writer',
      displayName: 'Demo Writer',
      role: ROLES.USER,
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
  });

  it('retains the created account and reports partial success when session saving fails', async () => {
    mockRandomUUID();
    const user = userEvent.setup();
    const onRegister = vi.fn(() => ({
      ok: false,
      message: 'Session write failed.',
    }));

    renderRegister({ onRegister });
    await completeRegistrationForm(user);
    await user.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      MESSAGES.registrationPartialSuccess,
    );
    expect(onRegister).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.users),
      ),
    ).toEqual([
      expect.objectContaining({
        id: GENERATED_USER_ID,
        displayName: 'Demo Writer',
        username: 'demo_writer',
      }),
    ]);
    expect(
      window.localStorage.getItem(STORAGE_KEYS.session),
    ).toBeNull();
    expect(
      screen.getByRole('heading', {
        name: 'Register for WriteSpace',
      }),
    ).toBeInTheDocument();
  });
});