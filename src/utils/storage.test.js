import {
  STORAGE_KEYS,
  STORAGE_STATUS_CODES,
  getPosts,
  getStorageStatus,
  getUsers,
  isPost,
  isSession,
  isUser,
  normalizeUsername,
  readSession,
  removeSession,
  savePosts,
  saveUsers,
  writeSession,
} from './storage';
import { MESSAGES } from '../constants';

const CREATED_AT = '2026-10-14T12:00:00.000Z';

function createPost(overrides = {}) {
  return {
    id: 'post-1',
    title: 'A valid post',
    content: 'Post content',
    createdAt: CREATED_AT,
    authorId: 'user-1',
    authorName: 'Demo User',
    ...overrides,
  };
}

function createUser(overrides = {}) {
  return {
    id: 'user-1',
    displayName: 'Demo User',
    username: 'demo_user',
    password: 'fake-password',
    role: 'user',
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function createSession(overrides = {}) {
  return {
    userId: 'user-1',
    username: 'demo_user',
    displayName: 'Demo User',
    role: 'user',
    ...overrides,
  };
}

describe('storage schema validation', () => {
  it('accepts valid post, user, and session records', () => {
    expect(isPost(createPost())).toBe(true);
    expect(isUser(createUser())).toBe(true);
    expect(isSession(createSession())).toBe(true);
  });

  it('rejects malformed records, invalid roles, and invalid timestamps', () => {
    expect(isPost(createPost({ title: '   ' }))).toBe(false);
    expect(isPost(createPost({ createdAt: 'not-a-date' }))).toBe(false);
    expect(isPost(null)).toBe(false);

    expect(isUser(createUser({ displayName: ' Demo User ' }))).toBe(false);
    expect(isUser(createUser({ username: 'admin' }))).toBe(false);
    expect(isUser(createUser({ role: 'owner' }))).toBe(false);
    expect(isUser([])).toBe(false);

    expect(isSession(createSession({ role: 'owner' }))).toBe(false);
    expect(isSession(createSession({ userId: '' }))).toBe(false);
    expect(isSession(undefined)).toBe(false);
  });

  it('enforces practical field length limits', () => {
    expect(isPost(createPost({ title: 'a'.repeat(101) }))).toBe(false);
    expect(isPost(createPost({ content: 'a'.repeat(50001) }))).toBe(false);
    expect(
      isUser(createUser({ displayName: 'a'.repeat(101) })),
    ).toBe(false);
    expect(isUser(createUser({ username: 'a'.repeat(51) }))).toBe(false);
    expect(isUser(createUser({ password: 'a'.repeat(201) }))).toBe(false);
  });
});

describe('storage reads', () => {
  it('returns explicit non-degraded fallbacks when keys are missing', () => {
    expect(getPosts()).toEqual({
      ok: true,
      value: [],
      degraded: false,
      diagnostic: null,
    });
    expect(getUsers()).toEqual({
      ok: true,
      value: [],
      degraded: false,
      diagnostic: null,
    });
    expect(readSession()).toEqual({
      ok: true,
      value: null,
      degraded: false,
      diagnostic: null,
    });
  });

  it('returns valid persisted posts, users, and sessions', () => {
    const post = createPost();
    const user = createUser();
    const session = createSession();

    window.localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify([post]));
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([user]));
    window.localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify(session),
    );

    expect(getPosts()).toEqual({
      ok: true,
      value: [post],
      degraded: false,
      diagnostic: null,
    });
    expect(getUsers()).toEqual({
      ok: true,
      value: [user],
      degraded: false,
      diagnostic: null,
    });
    expect(readSession()).toEqual({
      ok: true,
      value: session,
      degraded: false,
      diagnostic: null,
    });
  });

  it('uses a degraded safe fallback for corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEYS.posts, '{invalid-json');

    expect(getPosts()).toEqual({
      ok: true,
      value: [],
      degraded: true,
      diagnostic: {
        code: STORAGE_STATUS_CODES.invalidStoredData,
        message: MESSAGES.invalidStoredData,
      },
    });
  });

  it('uses degraded fallbacks for wrong root shapes and invalid collection records', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.posts,
      JSON.stringify({ posts: [] }),
    );
    window.localStorage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([
        createUser(),
        createUser({
          id: 'user-2',
          username: ' DEMO_USER ',
        }),
      ]),
    );
    window.localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify([]),
    );

    expect(getPosts()).toMatchObject({
      ok: true,
      value: [],
      degraded: true,
      diagnostic: {
        code: STORAGE_STATUS_CODES.invalidStoredData,
      },
    });
    expect(getUsers()).toMatchObject({
      ok: true,
      value: [],
      degraded: true,
      diagnostic: {
        code: STORAGE_STATUS_CODES.invalidStoredData,
      },
    });
    expect(readSession()).toMatchObject({
      ok: true,
      value: null,
      degraded: true,
      diagnostic: {
        code: STORAGE_STATUS_CODES.invalidStoredData,
      },
    });
  });

  it('returns a storage-unavailable fallback when storage getters throw', () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

    expect(getPosts()).toEqual({
      ok: true,
      value: [],
      degraded: true,
      diagnostic: {
        code: STORAGE_STATUS_CODES.storageUnavailable,
        message: MESSAGES.storageUnavailable,
      },
    });
    expect(getStorageStatus()).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
      cause: null,
    });

    getItemSpy.mockRestore();
  });

  it('handles a restricted localStorage property without throwing', () => {
    const storageDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage',
    );

    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
      });

      expect(readSession()).toEqual({
        ok: true,
        value: null,
        degraded: true,
        diagnostic: {
          code: STORAGE_STATUS_CODES.storageUnavailable,
          message: MESSAGES.storageUnavailable,
        },
      });
      expect(getStorageStatus()).toEqual({
        ok: false,
        code: STORAGE_STATUS_CODES.storageUnavailable,
        message: MESSAGES.storageUnavailable,
        cause: null,
      });
    } finally {
      if (storageDescriptor) {
        Object.defineProperty(
          globalThis,
          'localStorage',
          storageDescriptor,
        );
      } else {
        delete globalThis.localStorage;
      }
    }
  });
});

describe('storage writes', () => {
  it('persists valid records and filters unknown fields from canonical output', () => {
    const post = createPost({ ignoredPostField: 'remove me' });
    const user = createUser({ ignoredUserField: 'remove me' });
    const session = createSession({ ignoredSessionField: 'remove me' });

    expect(savePosts([post])).toEqual({ ok: true });
    expect(saveUsers([user])).toEqual({ ok: true });
    expect(writeSession(session)).toEqual({ ok: true });

    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual([createPost()]);
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.users)),
    ).toEqual([createUser()]);
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.session)),
    ).toEqual(createSession());
  });

  it('rejects invalid values without changing persisted data', () => {
    const existingPosts = [createPost()];
    window.localStorage.setItem(
      STORAGE_KEYS.posts,
      JSON.stringify(existingPosts),
    );

    expect(savePosts([createPost({ content: '' })])).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.validationFailed,
      message: MESSAGES.validationFailed,
      cause: null,
    });
    expect(saveUsers([createUser({ username: 'Admin' })])).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.validationFailed,
      message: MESSAGES.validationFailed,
      cause: null,
    });
    expect(writeSession(createSession({ role: 'invalid' }))).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.validationFailed,
      message: MESSAGES.validationFailed,
      cause: null,
    });
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts)),
    ).toEqual(existingPosts);
  });

  it('rejects duplicate usernames after case-insensitive normalization', () => {
    const users = [
      createUser({ id: 'user-1', username: 'Demo_User' }),
      createUser({ id: 'user-2', username: 'demo_user' }),
    ];

    expect(saveUsers(users)).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.validationFailed,
      message: MESSAGES.validationFailed,
      cause: null,
    });
    expect(window.localStorage.getItem(STORAGE_KEYS.users)).toBeNull();
  });

  it('returns storage unavailable when a quota or setter failure occurs', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

    expect(savePosts([createPost()])).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
      cause: null,
    });

    setItemSpy.mockRestore();
  });

  it('returns storage unavailable when serialization throws', () => {
    const stringifySpy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementation(() => {
        throw new TypeError('Serialization failed');
      });

    expect(writeSession(createSession())).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
      cause: null,
    });

    stringifySpy.mockRestore();
  });

  it('returns write failed when the persisted value cannot be verified', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {});
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockReturnValue(null);

    expect(saveUsers([createUser()])).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.writeFailed,
      message: MESSAGES.writeFailed,
      cause: null,
    });

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});

describe('session removal and storage status', () => {
  it('reports available storage and removes a persisted session', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify(createSession()),
    );

    expect(getStorageStatus()).toEqual({ ok: true });
    expect(removeSession()).toEqual({ ok: true });
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('returns storage unavailable when session removal throws', () => {
    const removeItemSpy = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

    expect(removeSession()).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.storageUnavailable,
      message: MESSAGES.storageUnavailable,
      cause: null,
    });

    removeItemSpy.mockRestore();
  });

  it('returns write failed when session removal cannot be verified', () => {
    const serializedSession = JSON.stringify(createSession());
    const removeItemSpy = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {});
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockReturnValue(serializedSession);

    expect(removeSession()).toEqual({
      ok: false,
      code: STORAGE_STATUS_CODES.writeFailed,
      message: MESSAGES.writeFailed,
      cause: null,
    });

    removeItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});

describe('normalizeUsername', () => {
  it('trims usernames and normalizes case for comparisons', () => {
    expect(normalizeUsername('  Demo_User  ')).toBe('demo_user');
    expect(normalizeUsername('ADMIN')).toBe('admin');
  });

  it('returns an empty string for non-string values', () => {
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(undefined)).toBe('');
    expect(normalizeUsername(123)).toBe('');
  });
});