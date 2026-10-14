import { render, screen } from '@testing-library/react';
import {
  ROLES,
  STORAGE_KEYS,
} from './constants';

const routerState = vi.hoisted(() => ({
  route: '/',
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  const { createElement } = await import('react');

  function BrowserRouter({ children }) {
    return createElement(
      actual.MemoryRouter,
      {
        initialEntries: [routerState.route],
      },
      children,
    );
  }

  return {
    ...actual,
    BrowserRouter,
  };
});

import App from './App';

const CREATED_AT = '2026-10-14T12:00:00.000Z';

function createUserSession(overrides = {}) {
  return {
    userId: 'user-1',
    username: 'demo_user',
    displayName: 'Demo User',
    role: ROLES.USER,
    ...overrides,
  };
}

function createAdminSession(overrides = {}) {
  return {
    userId: 'admin',
    username: 'admin',
    displayName: 'Admin',
    role: ROLES.ADMIN,
    ...overrides,
  };
}

function createPost(overrides = {}) {
  return {
    id: 'post-1',
    title: 'A routed post',
    content: 'Content rendered through the application router.',
    createdAt: CREATED_AT,
    authorId: 'user-1',
    authorName: 'Demo User',
    ...overrides,
  };
}

function persistSession(session) {
  window.localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify(session),
  );
}

function persistPosts(posts) {
  window.localStorage.setItem(
    STORAGE_KEYS.posts,
    JSON.stringify(posts),
  );
}

function renderAppAt(
  route,
  {
    session = null,
    posts = [],
  } = {},
) {
  window.localStorage.clear();
  routerState.route = route;

  if (session !== null) {
    persistSession(session);
  }

  if (posts.length > 0) {
    persistPosts(posts);
  }

  return render(<App />);
}

async function expectPageHeading(name) {
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name,
    }),
  ).toBeInTheDocument();
}

afterEach(() => {
  routerState.route = '/';
  vi.restoreAllMocks();
});

describe('App guest route access', () => {
  it.each([
    {
      route: '/',
      heading: 'Your stories, your space.',
    },
    {
      route: '/login',
      heading: 'Log in to WriteSpace',
    },
    {
      route: '/register',
      heading: 'Register for WriteSpace',
    },
  ])(
    'renders the public $route route for a guest',
    async ({ route, heading }) => {
      renderAppAt(route);

      await expectPageHeading(heading);
    },
  );

  it.each([
    '/blogs',
    '/blog/post-1',
    '/write',
    '/edit/post-1',
    '/admin',
    '/users',
  ])(
    'redirects a guest from protected route %s to login',
    async (route) => {
      renderAppAt(route);

      await expectPageHeading('Log in to WriteSpace');
    },
  );
});

describe('App user route access', () => {
  it.each([
    {
      route: '/',
      heading: 'Your stories, your space.',
    },
    {
      route: '/login',
      heading: 'Blogs',
    },
    {
      route: '/register',
      heading: 'Blogs',
    },
    {
      route: '/blogs',
      heading: 'Blogs',
    },
    {
      route: '/blog/post-1',
      heading: 'A routed post',
    },
    {
      route: '/write',
      heading: 'Write a Post',
    },
    {
      route: '/edit/post-1',
      heading: 'Edit Post',
    },
    {
      route: '/admin',
      heading: 'Blogs',
    },
    {
      route: '/users',
      heading: 'Blogs',
    },
  ])(
    'renders or redirects user route $route to $heading',
    async ({ route, heading }) => {
      renderAppAt(route, {
        session: createUserSession(),
        posts: [createPost()],
      });

      await expectPageHeading(heading);
    },
  );
});

describe('App Admin route access', () => {
  it.each([
    {
      route: '/',
      heading: 'Your stories, your space.',
    },
    {
      route: '/login',
      heading: 'Admin Dashboard',
    },
    {
      route: '/register',
      heading: 'Admin Dashboard',
    },
    {
      route: '/blogs',
      heading: 'Blogs',
    },
    {
      route: '/blog/post-1',
      heading: 'A routed post',
    },
    {
      route: '/write',
      heading: 'Write a Post',
    },
    {
      route: '/edit/post-1',
      heading: 'Edit Post',
    },
    {
      route: '/admin',
      heading: 'Admin Dashboard',
    },
    {
      route: '/users',
      heading: 'User Management',
    },
  ])(
    'renders or redirects Admin route $route to $heading',
    async ({ route, heading }) => {
      renderAppAt(route, {
        session: createAdminSession(),
        posts: [createPost()],
      });

      await expectPageHeading(heading);
    },
  );
});

describe('App fallback routing and local-only rendering', () => {
  it('renders the landing page for an unmatched route', async () => {
    renderAppAt('/route-that-does-not-exist');

    await expectPageHeading('Your stories, your space.');
  });

  it('renders a direct in-memory reader route without making application-data network calls', async () => {
    const fetchSpy =
      typeof globalThis.fetch === 'function'
        ? vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue({ ok: true })
        : null;
    const xhrOpenSpy =
      typeof globalThis.XMLHttpRequest === 'function'
        ? vi
            .spyOn(globalThis.XMLHttpRequest.prototype, 'open')
            .mockImplementation(() => {})
        : null;

    renderAppAt('/blog/post-1', {
      session: createUserSession(),
      posts: [createPost()],
    });

    await expectPageHeading('A routed post');

    if (fetchSpy !== null) {
      expect(fetchSpy).not.toHaveBeenCalled();
    }

    if (xhrOpenSpy !== null) {
      expect(xhrOpenSpy).not.toHaveBeenCalled();
    }
  });
});