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
import Home from './Home';
import ReadBlog from './ReadBlog';
import WriteBlog from './WriteBlog';

const CREATED_AT = '2026-10-14T12:00:00.000Z';
const OLDER_CREATED_AT = '2026-01-10T12:00:00.000Z';
const NEWER_CREATED_AT = '2026-12-20T12:00:00.000Z';
const GENERATED_POST_ID =
  '9c16929e-8e64-4ff0-b290-43f407781fa3';
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

function DestinationPage() {
  const location = useLocation();

  return (
    <h1>
      Destination: <span>{location.pathname}</span>
    </h1>
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

function mockRandomUUID(value = GENERATED_POST_ID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: vi.fn(() => value),
  });
}

function renderHome({
  session = createSession(),
  onLogout = vi.fn(() => ({ ok: true })),
} = {}) {
  return render(
    <MemoryRouter initialEntries={['/blogs']}>
      <Home onLogout={onLogout} session={session} />
    </MemoryRouter>,
  );
}

function renderReader({
  route = '/blog/post-1',
  session = createSession(),
  onLogout = vi.fn(() => ({ ok: true })),
} = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          element={
            <ReadBlog onLogout={onLogout} session={session} />
          }
          path="/blog/:id"
        />
        <Route element={<DestinationPage />} path="*" />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditor({
  route = '/write',
  session = createSession(),
  onLogout = vi.fn(() => ({ ok: true })),
} = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          element={
            <WriteBlog onLogout={onLogout} session={session} />
          }
          path="/write"
        />
        <Route
          element={
            <WriteBlog onLogout={onLogout} session={session} />
          }
          path="/edit/:id"
        />
        <Route element={<DestinationPage />} path="*" />
      </Routes>
    </MemoryRouter>,
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

describe('authenticated blog list and reader flows', () => {
  it('renders post cards newest first with author metadata and reader links', async () => {
    persistPosts([
      createPost({
        id: 'oldest-post',
        title: 'Oldest post',
        createdAt: OLDER_CREATED_AT,
      }),
      createPost({
        id: 'newest-post',
        title: 'Newest post',
        content: 'The newest article content.',
        createdAt: NEWER_CREATED_AT,
        authorId: 'user-2',
        authorName: 'Newest Writer',
      }),
      createPost({
        id: 'middle-post',
        title: 'Middle post',
        createdAt: CREATED_AT,
      }),
    ]);

    renderHome();

    const cardHeadings = await screen.findAllByRole('heading', {
      level: 2,
    });

    expect(cardHeadings.map((heading) => heading.textContent)).toEqual([
      'Newest post',
      'Middle post',
      'Oldest post',
    ]);
    expect(screen.getByText('Newest Writer')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Newest Writer, author',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Read Newest post' }),
    ).toHaveAttribute('href', '/blog/newest-post');
  });

  it('renders the exact empty list state when no posts are stored', async () => {
    renderHome();

    expect(
      await screen.findByRole('heading', {
        name: 'No posts yet.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Be the first to write a post in this browser-local space.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Write a Post' }),
    ).toHaveLength(2);
  });

  it('renders a complete post with its snapshotted author and creation date', async () => {
    persistPosts([
      createPost({
        title: 'Reader example',
        content: 'First paragraph.\n\nSecond paragraph.',
        authorId: 'deleted-user',
        authorName: 'Former Writer',
      }),
    ]);

    renderReader();

    expect(
      await screen.findByRole('heading', {
        name: 'Reader example',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('First paragraph. Second paragraph.'),
    ).toHaveClass('whitespace-pre-wrap');
    expect(screen.getByText('Former Writer')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Former Writer, author',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('October 14, 2026'),
    ).toBeInTheDocument();
    expect(
      window.localStorage.getItem(STORAGE_KEYS.users),
    ).toBeNull();
  });

  it('renders the exact missing-post state and a route back to blogs', async () => {
    persistPosts([createPost()]);

    renderReader({ route: '/blog/missing-post' });

    expect(
      await screen.findByRole('heading', {
        name: MESSAGES.postNotFound,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This post does not exist or is no longer available in this browser.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to Blogs' }),
    ).toHaveAttribute('href', '/blogs');
  });

  it.each([
    {
      label: 'the post owner',
      session: createSession(),
    },
    {
      label: 'an Admin',
      session: createSession({
        userId: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: ROLES.ADMIN,
      }),
    },
  ])('shows edit and delete actions to $label', async ({ session }) => {
    persistPosts([createPost()]);

    renderReader({ session });

    expect(
      await screen.findByRole('link', {
        name: 'Edit A demo post',
      }),
    ).toHaveAttribute('href', '/edit/post-1');
    expect(
      screen.getByRole('button', {
        name: 'Delete A demo post',
      }),
    ).toBeInTheDocument();
  });

  it('hides management actions from another signed-in user', async () => {
    persistPosts([createPost()]);

    renderReader({
      session: createSession({
        userId: 'user-2',
        username: 'other_user',
        displayName: 'Other User',
      }),
    });

    expect(
      await screen.findByRole('heading', {
        name: 'A demo post',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: 'Edit A demo post',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Delete A demo post',
      }),
    ).not.toBeInTheDocument();
  });
});

describe('post creation and editing flows', () => {
  it('creates the canonical post schema and navigates to the new reader route', async () => {
    mockRandomUUID();
    const user = userEvent.setup();
    const session = createSession();

    persistSession(session);
    renderEditor({ session });

    await screen.findByRole('heading', { name: 'Write a Post' });
    await user.type(
      screen.getByRole('textbox', { name: 'Title' }),
      '  A new browser post  ',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Content' }),
      'New post content.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Publish Post' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: `Destination: /blog/${GENERATED_POST_ID}`,
      }),
    ).toBeInTheDocument();

    const persistedPosts = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.posts),
    );

    expect(persistedPosts).toEqual([
      {
        id: GENERATED_POST_ID,
        title: 'A new browser post',
        content: 'New post content.',
        createdAt: expect.any(String),
        authorId: session.userId,
        authorName: session.displayName,
      },
    ]);
    expect(
      Number.isFinite(Date.parse(persistedPosts[0].createdAt)),
    ).toBe(true);
    expect(Object.keys(persistedPosts[0])).toEqual([
      'id',
      'title',
      'content',
      'createdAt',
      'authorId',
      'authorName',
    ]);
  });

  it('focuses the first blank field and exposes accessible errors for both required fields', async () => {
    const user = userEvent.setup();
    const session = createSession();

    persistSession(session);
    renderEditor({ session });

    await screen.findByRole('heading', { name: 'Write a Post' });
    await user.click(
      screen.getByRole('button', { name: 'Publish Post' }),
    );

    const titleInput = screen.getByRole('textbox', {
      name: 'Title',
    });
    const contentInput = screen.getByRole('textbox', {
      name: 'Content',
    });

    expect(screen.getByText(MESSAGES.titleRequired)).toBeInTheDocument();
    expect(
      screen.getByText(MESSAGES.contentRequired),
    ).toBeInTheDocument();
    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(contentInput).toHaveAttribute('aria-invalid', 'true');
    expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();
  });

  it('edits mutable fields while preserving post identity and author metadata', async () => {
    const user = userEvent.setup();
    const session = createSession();
    const originalPost = createPost();

    persistSession(session);
    persistPosts([originalPost]);
    renderEditor({
      route: '/edit/post-1',
      session,
    });

    const titleInput = await screen.findByRole('textbox', {
      name: 'Title',
    });
    const contentInput = screen.getByRole('textbox', {
      name: 'Content',
    });

    expect(titleInput).toHaveValue(originalPost.title);
    expect(contentInput).toHaveValue(originalPost.content);

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated content.');
    await user.click(
      screen.getByRole('button', { name: 'Save Changes' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blog/post-1',
      }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.posts),
      ),
    ).toEqual([
      {
        ...originalPost,
        title: 'Updated title',
        content: 'Updated content.',
      },
    ]);
  });

  it('redirects an unauthorized direct edit without changing the post', async () => {
    const ownerPost = createPost();
    const otherSession = createSession({
      userId: 'user-2',
      username: 'other_user',
      displayName: 'Other User',
    });

    persistPosts([ownerPost]);
    persistSession(otherSession);
    renderEditor({
      route: '/edit/post-1',
      session: otherSession,
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Edit Post' }),
    ).not.toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.posts),
      ),
    ).toEqual([ownerPost]);
  });

  it('shows a storage error and remains in the editor when creation cannot be saved', async () => {
    mockRandomUUID();
    const user = userEvent.setup();
    const session = createSession();

    persistSession(session);
    renderEditor({ session });
    await screen.findByRole('heading', { name: 'Write a Post' });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.type(
      screen.getByRole('textbox', { name: 'Title' }),
      'Unsaved post',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Content' }),
      'This content cannot be persisted.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Publish Post' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      MESSAGES.storageUnavailable,
    );
    expect(
      screen.getByRole('heading', { name: 'Write a Post' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: `Destination: /blog/${GENERATED_POST_ID}`,
      }),
    ).not.toBeInTheDocument();
  });
});

describe('post deletion flows', () => {
  it('deletes a confirmed owned post and navigates to blogs', async () => {
    const user = userEvent.setup();
    const session = createSession();
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValue(true);

    persistSession(session);
    persistPosts([createPost()]);
    renderReader({ session });

    await user.click(
      await screen.findByRole('button', {
        name: 'Delete A demo post',
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      MESSAGES.deletePostConfirmation,
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.posts),
      ),
    ).toEqual([]);
  });

  it('rechecks authorization after confirmation and preserves the post when the active session changed', async () => {
    const user = userEvent.setup();
    const ownerSession = createSession();
    const storedPost = createPost();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    persistSession(ownerSession);
    persistPosts([storedPost]);
    renderReader({ session: ownerSession });

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete A demo post',
    });

    persistSession(
      createSession({
        userId: 'user-2',
        username: 'other_user',
        displayName: 'Other User',
      }),
    );
    await user.click(deleteButton);

    expect(
      await screen.findByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.posts),
      ),
    ).toEqual([storedPost]);
  });

  it('shows a visible error and keeps the reader open when deletion cannot be saved', async () => {
    const user = userEvent.setup();
    const session = createSession();
    const storedPost = createPost();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    persistSession(session);
    persistPosts([storedPost]);
    renderReader({ session });

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete A demo post',
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(deleteButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      MESSAGES.storageUnavailable,
    );
    expect(
      screen.getByRole('heading', { name: 'A demo post' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Destination: /blogs',
      }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(deleteButton).toBeEnabled();
    });
  });
});