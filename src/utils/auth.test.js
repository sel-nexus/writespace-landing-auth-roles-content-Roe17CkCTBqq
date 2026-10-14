import {
  AUTH_STATUS_CODES,
  authenticate,
  canManagePost,
  clearSession,
  getSession,
  roleHome,
  setSession,
} from './auth';
import {
  MESSAGES,
  ROLES,
  ROUTES,
  STORAGE_KEYS,
} from '../constants';
import { STORAGE_STATUS_CODES } from './storage';

const CREATED_AT = '2026-10-14T12:00:00.000Z';

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
    content: 'Post content',
    createdAt: CREATED_AT,
    authorId: 'user-1',
    authorName: 'Demo User',
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authenticate', () => {
  it('authenticates the permanent Admin using a normalized username', () => {
    const result = authenticate('  ADMIN  ', 'admin');

    expect(result).toEqual({
      ok: true,
      session: {
        userId: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: ROLES.ADMIN,
      },
    });
  });

  it('keeps permanent Admin authentication available when user data is corrupt', () => {
    window.localStorage.setItem(STORAGE_KEYS.users, '{invalid-json');

    expect(authenticate('admin', 'admin')).toEqual({
      ok: true,
      session: {
        userId: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: ROLES.ADMIN,
      },
    });
  });

  it('authenticates a local account using normalized username comparison', () => {
    const user = createUser({
      username: 'Demo_User',
      role: ROLES.ADMIN,
    });
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([user]),
    );

    expect(authenticate('  demo_USER  ', 'fake-password')).toEqual({
      ok: true,
      session: {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        role: ROLES.ADMIN,
      },
    });
  });

  it('returns the same generic error for unknown usernames and wrong passwords', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([createUser()]),
    );

    const unknownUsernameResult = authenticate(
      'unknown_user',
      'fake-password',
    );
    const wrongPasswordResult = authenticate(
      'demo_user',
      'wrong-password',
    );

    expect(unknownUsernameResult).toEqual({
      ok: false,
      code: AUTH_STATUS_CODES.invalidCredentials,
      message: MESSAGES.invalidCredentials,
    });
    expect(wrongPasswordResult).toEqual(unknownUsernameResult);
  });

  it('requires exact password equality for local accounts', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([createUser()]),
    );

    expect(authenticate('demo_user', 'FAKE-PASSWORD')).toEqual({
      ok: false,
      code: AUTH_STATUS_CODES.invalidCredentials,
      message: MESSAGES.invalidCredentials,
    });
  });

  it('rejects local authentication when stored user data is invalid', () => {
    window.localStorage.setItem(STORAGE_KEYS.users, '{invalid-json');

    expect(authenticate('demo_user', 'fake-password')).toEqual({
      ok: false,
      code: AUTH_STATUS_CODES.invalidStoredData,
      message: MESSAGES.invalidStoredData,
    });
  });

  it('rejects local authentication when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    expect(authenticate('demo_user', 'fake-password')).toEqual({
      ok: false,
      code: AUTH_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
    });
  });
});

describe('session helpers', () => {
  it('writes, reads, and clears a valid session', () => {
    const session = createSession();

    expect(setSession(session)).toEqual({ ok: true });
    expect(getSession()).toEqual({
      ok: true,
      value: session,
      degraded: false,
      diagnostic: null,
    });
    expect(clearSession()).toEqual({ ok: true });
    expect(getSession()).toEqual({
      ok: true,
      value: null,
      degraded: false,
      diagnostic: null,
    });
  });

  it('rejects an invalid session without persisting it', () => {
    const result = setSession(
      createSession({
        role: 'owner',
      }),
    );

    expect(result).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.validationFailed,
      message: MESSAGES.validationFailed,
      cause: null,
    });
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('returns a degraded signed-out state for an invalid stored session', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify({
        userId: '',
        username: 'demo_user',
        displayName: 'Demo User',
        role: ROLES.USER,
      }),
    );

    expect(getSession()).toEqual({
      ok: true,
      value: null,
      degraded: true,
      diagnostic: {
        code: STORAGE_STATUS_CODES.invalidStoredData,
        message: MESSAGES.invalidStoredData,
      },
    });
  });

  it('reports storage failures when a session cannot be written', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(setSession(createSession())).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
      cause: null,
    });
  });

  it('reports storage failures when a session cannot be cleared', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify(createSession()),
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    expect(clearSession()).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
      cause: null,
    });
  });
});

describe('canManagePost', () => {
  it('allows an Admin to manage any post', () => {
    const adminSession = createSession({
      userId: 'admin',
      username: 'admin',
      displayName: 'Admin',
      role: ROLES.ADMIN,
    });

    expect(
      canManagePost(
        adminSession,
        createPost({ authorId: 'another-user' }),
      ),
    ).toBe(true);
  });

  it('allows a user to manage a post they own', () => {
    expect(canManagePost(createSession(), createPost())).toBe(true);
  });

  it('prevents a user from managing another user post', () => {
    expect(
      canManagePost(
        createSession(),
        createPost({ authorId: 'user-2' }),
      ),
    ).toBe(false);
  });

  it('rejects missing or malformed sessions and posts', () => {
    expect(canManagePost(null, createPost())).toBe(false);
    expect(canManagePost(createSession(), null)).toBe(false);
    expect(canManagePost('invalid-session', createPost())).toBe(false);
    expect(canManagePost(createSession(), [])).toBe(false);
    expect(
      canManagePost(
        createSession({ userId: '' }),
        createPost({ authorId: '' }),
      ),
    ).toBe(false);
  });
});

describe('roleHome', () => {
  it('returns the Admin dashboard route for Admin sessions', () => {
    expect(
      roleHome(
        createSession({
          role: ROLES.ADMIN,
        }),
      ),
    ).toBe(ROUTES.admin);
  });

  it('returns the blogs route for users and absent sessions', () => {
    expect(roleHome(createSession())).toBe(ROUTES.blogs);
    expect(roleHome(null)).toBe(ROUTES.blogs);
    expect(roleHome(undefined)).toBe(ROUTES.blogs);
  });
});