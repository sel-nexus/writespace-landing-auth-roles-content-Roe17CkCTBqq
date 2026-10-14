import {
  MESSAGES,
  ROLE_VALUES,
  STORAGE_KEYS as WRITE_SPACE_STORAGE_KEYS,
} from '../constants';

export const STORAGE_KEYS = WRITE_SPACE_STORAGE_KEYS;

export const STORAGE_STATUS_CODES = Object.freeze({
  storageUnavailable: 'STORAGE_UNAVAILABLE',
  invalidStoredData: 'INVALID_STORED_DATA',
  validationFailed: 'VALIDATION_FAILED',
  writeFailed: 'WRITE_FAILED',
});

const POST_TITLE_MAX_LENGTH = 100;
const POST_CONTENT_MAX_LENGTH = 50000;
const DISPLAY_NAME_MAX_LENGTH = 100;
const USERNAME_MAX_LENGTH = 50;
const PASSWORD_MAX_LENGTH = 200;
const RESERVED_ADMIN_USERNAME = 'admin';

/**
 * Determines whether a value is a non-array object.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Determines whether a value is a non-blank string.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isNonBlankString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Determines whether a string is non-blank and within a maximum length.
 *
 * @param {unknown} value
 * @param {number} maximumLength
 * @returns {boolean}
 */
function isBoundedNonBlankString(value, maximumLength) {
  return (
    isNonBlankString(value) &&
    value.length <= maximumLength
  );
}

/**
 * Determines whether a value contains a parseable timestamp.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

/**
 * Returns the browser storage implementation without allowing access errors
 * to escape.
 *
 * @returns {Storage|null}
 */
function getLocalStorage() {
  try {
    if (
      typeof globalThis === 'undefined' ||
      !('localStorage' in globalThis)
    ) {
      return null;
    }

    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/**
 * Creates a non-sensitive storage error result.
 *
 * @param {string} code
 * @param {string} message
 * @returns {{ok: false, code: string, message: string, cause: null}}
 */
function createFailure(code, message) {
  return {
    ok: false,
    code,
    message,
    cause: null,
  };
}

/**
 * Creates a non-sensitive degraded-read diagnostic.
 *
 * @param {string} code
 * @param {string} message
 * @returns {{code: string, message: string}}
 */
function createDiagnostic(code, message) {
  return {
    code,
    message,
  };
}

/**
 * Reads and validates a JSON value from browser storage.
 *
 * @template T
 * @param {string} key
 * @param {() => T} createFallback
 * @param {(value: unknown) => boolean} validator
 * @returns {{
 *   ok: true,
 *   value: T,
 *   degraded: boolean,
 *   diagnostic: null|{code: string, message: string}
 * }}
 */
function safeRead(key, createFallback, validator) {
  const storage = getLocalStorage();

  if (storage === null) {
    return {
      ok: true,
      value: createFallback(),
      degraded: true,
      diagnostic: createDiagnostic(
        STORAGE_STATUS_CODES.storageUnavailable,
        MESSAGES.storageUnavailable,
      ),
    };
  }

  let serializedValue;

  try {
    serializedValue = storage.getItem(key);
  } catch {
    return {
      ok: true,
      value: createFallback(),
      degraded: true,
      diagnostic: createDiagnostic(
        STORAGE_STATUS_CODES.storageUnavailable,
        MESSAGES.storageUnavailable,
      ),
    };
  }

  if (serializedValue === null) {
    return {
      ok: true,
      value: createFallback(),
      degraded: false,
      diagnostic: null,
    };
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(serializedValue);
  } catch {
    return {
      ok: true,
      value: createFallback(),
      degraded: true,
      diagnostic: createDiagnostic(
        STORAGE_STATUS_CODES.invalidStoredData,
        MESSAGES.invalidStoredData,
      ),
    };
  }

  try {
    if (!validator(parsedValue)) {
      return {
        ok: true,
        value: createFallback(),
        degraded: true,
        diagnostic: createDiagnostic(
          STORAGE_STATUS_CODES.invalidStoredData,
          MESSAGES.invalidStoredData,
        ),
      };
    }
  } catch {
    return {
      ok: true,
      value: createFallback(),
      degraded: true,
      diagnostic: createDiagnostic(
        STORAGE_STATUS_CODES.invalidStoredData,
        MESSAGES.invalidStoredData,
      ),
    };
  }

  return {
    ok: true,
    value: parsedValue,
    degraded: false,
    diagnostic: null,
  };
}

/**
 * Validates, serializes, writes, and verifies a browser storage value.
 *
 * @param {string} key
 * @param {unknown} value
 * @param {(value: unknown) => boolean} validator
 * @returns {{
 *   ok: true
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   cause: null
 * }}
 */
function safeWrite(key, value, validator) {
  try {
    if (!validator(value)) {
      return createFailure(
        STORAGE_STATUS_CODES.validationFailed,
        MESSAGES.validationFailed,
      );
    }
  } catch {
    return createFailure(
      STORAGE_STATUS_CODES.validationFailed,
      MESSAGES.validationFailed,
    );
  }

  const storage = getLocalStorage();

  if (storage === null) {
    return createFailure(
      STORAGE_STATUS_CODES.storageUnavailable,
      MESSAGES.storageUnavailable,
    );
  }

  try {
    const serializedValue = JSON.stringify(value);

    storage.setItem(key, serializedValue);

    if (storage.getItem(key) !== serializedValue) {
      return createFailure(
        STORAGE_STATUS_CODES.writeFailed,
        MESSAGES.writeFailed,
      );
    }

    return { ok: true };
  } catch {
    return createFailure(
      STORAGE_STATUS_CODES.storageUnavailable,
      MESSAGES.storageUnavailable,
    );
  }
}

/**
 * Normalizes a username for case-insensitive comparisons.
 *
 * @param {string} username
 * @returns {string}
 */
export function normalizeUsername(username) {
  if (typeof username !== 'string') {
    return '';
  }

  return username.trim().toLocaleLowerCase('en-US');
}

/**
 * Validates a persisted post record.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPost(value) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonBlankString(value.id) &&
    isNonBlankString(value.title) &&
    value.title.trim().length <= POST_TITLE_MAX_LENGTH &&
    isNonBlankString(value.content) &&
    value.content.length <= POST_CONTENT_MAX_LENGTH &&
    isValidTimestamp(value.createdAt) &&
    isNonBlankString(value.authorId) &&
    isNonBlankString(value.authorName)
  );
}

/**
 * Validates a persisted local user record.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isUser(value) {
  if (!isRecord(value)) {
    return false;
  }

  const hasCanonicalDisplayName =
    isBoundedNonBlankString(value.displayName, DISPLAY_NAME_MAX_LENGTH) &&
    value.displayName === value.displayName.trim();
  const hasCanonicalUsername =
    isBoundedNonBlankString(value.username, USERNAME_MAX_LENGTH) &&
    value.username === value.username.trim();

  return (
    isNonBlankString(value.id) &&
    hasCanonicalDisplayName &&
    hasCanonicalUsername &&
    normalizeUsername(value.username) !== RESERVED_ADMIN_USERNAME &&
    isBoundedNonBlankString(value.password, PASSWORD_MAX_LENGTH) &&
    ROLE_VALUES.includes(value.role) &&
    isValidTimestamp(value.createdAt)
  );
}

/**
 * Validates a persisted signed-in session.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSession(value) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonBlankString(value.userId) &&
    isNonBlankString(value.username) &&
    isNonBlankString(value.displayName) &&
    ROLE_VALUES.includes(value.role)
  );
}

/**
 * Validates a post collection.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isPostCollection(value) {
  return Array.isArray(value) && value.every(isPost);
}

/**
 * Validates a user collection, including normalized username uniqueness.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isUserCollection(value) {
  if (!Array.isArray(value) || !value.every(isUser)) {
    return false;
  }

  const normalizedUsernames = new Set();

  for (const user of value) {
    const normalizedUsername = normalizeUsername(user.username);

    if (normalizedUsernames.has(normalizedUsername)) {
      return false;
    }

    normalizedUsernames.add(normalizedUsername);
  }

  return true;
}

/**
 * Creates a canonical post record for persistence.
 *
 * @param {object} post
 * @returns {object}
 */
function createCanonicalPost(post) {
  return {
    id: post.id,
    title: post.title.trim(),
    content: post.content,
    createdAt: post.createdAt,
    authorId: post.authorId,
    authorName: post.authorName,
  };
}

/**
 * Creates a canonical user record for persistence.
 *
 * @param {object} user
 * @returns {object}
 */
function createCanonicalUser(user) {
  return {
    id: user.id,
    displayName: user.displayName.trim(),
    username: user.username.trim(),
    password: user.password,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Creates a canonical session record for persistence.
 *
 * @param {object} session
 * @returns {object}
 */
function createCanonicalSession(session) {
  return {
    userId: session.userId,
    username: session.username,
    displayName: session.displayName,
    role: session.role,
  };
}

/**
 * Reads all persisted posts.
 *
 * @returns {{
 *   ok: true,
 *   value: Array<object>,
 *   degraded: boolean,
 *   diagnostic: null|{code: string, message: string}
 * }}
 */
export function getPosts() {
  return safeRead(STORAGE_KEYS.posts, () => [], isPostCollection);
}

/**
 * Validates and persists all posts.
 *
 * @param {Array<object>} posts
 * @returns {{
 *   ok: true
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   cause: null
 * }}
 */
export function savePosts(posts) {
  if (!isPostCollection(posts)) {
    return createFailure(
      STORAGE_STATUS_CODES.validationFailed,
      MESSAGES.validationFailed,
    );
  }

  const canonicalPosts = posts.map(createCanonicalPost);

  return safeWrite(
    STORAGE_KEYS.posts,
    canonicalPosts,
    isPostCollection,
  );
}

/**
 * Reads all persisted local users.
 *
 * @returns {{
 *   ok: true,
 *   value: Array<object>,
 *   degraded: boolean,
 *   diagnostic: null|{code: string, message: string}
 * }}
 */
export function getUsers() {
  return safeRead(STORAGE_KEYS.users, () => [], isUserCollection);
}

/**
 * Validates and persists all local users.
 *
 * @param {Array<object>} users
 * @returns {{
 *   ok: true
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   cause: null
 * }}
 */
export function saveUsers(users) {
  if (!isUserCollection(users)) {
    return createFailure(
      STORAGE_STATUS_CODES.validationFailed,
      MESSAGES.validationFailed,
    );
  }

  const canonicalUsers = users.map(createCanonicalUser);

  return safeWrite(
    STORAGE_KEYS.users,
    canonicalUsers,
    isUserCollection,
  );
}

/**
 * Reads the persisted session or safely returns a signed-out state.
 *
 * @returns {{
 *   ok: true,
 *   value: object|null,
 *   degraded: boolean,
 *   diagnostic: null|{code: string, message: string}
 * }}
 */
export function readSession() {
  return safeRead(STORAGE_KEYS.session, () => null, isSession);
}

/**
 * Validates and persists a signed-in session.
 *
 * @param {object} session
 * @returns {{
 *   ok: true
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   cause: null
 * }}
 */
export function writeSession(session) {
  if (!isSession(session)) {
    return createFailure(
      STORAGE_STATUS_CODES.validationFailed,
      MESSAGES.validationFailed,
    );
  }

  return safeWrite(
    STORAGE_KEYS.session,
    createCanonicalSession(session),
    isSession,
  );
}

/**
 * Removes and verifies removal of the persisted session.
 *
 * @returns {{
 *   ok: true
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   cause: null
 * }}
 */
export function removeSession() {
  const storage = getLocalStorage();

  if (storage === null) {
    return createFailure(
      STORAGE_STATUS_CODES.storageUnavailable,
      MESSAGES.storageUnavailable,
    );
  }

  try {
    storage.removeItem(STORAGE_KEYS.session);

    if (storage.getItem(STORAGE_KEYS.session) !== null) {
      return createFailure(
        STORAGE_STATUS_CODES.writeFailed,
        MESSAGES.writeFailed,
      );
    }

    return { ok: true };
  } catch {
    return createFailure(
      STORAGE_STATUS_CODES.storageUnavailable,
      MESSAGES.storageUnavailable,
    );
  }
}

/**
 * Checks whether browser-local storage can be accessed without exposing any
 * persisted values.
 *
 * @returns {{
 *   ok: true
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   cause: null
 * }}
 */
export function getStorageStatus() {
  const storage = getLocalStorage();

  if (storage === null) {
    return createFailure(
      STORAGE_STATUS_CODES.storageUnavailable,
      MESSAGES.storageUnavailable,
    );
  }

  try {
    storage.getItem(STORAGE_KEYS.session);
    return { ok: true };
  } catch {
    return createFailure(
      STORAGE_STATUS_CODES.storageUnavailable,
      MESSAGES.storageUnavailable,
    );
  }
}