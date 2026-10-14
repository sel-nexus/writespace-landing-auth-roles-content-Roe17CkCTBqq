import {
  ADMIN_CREDENTIALS,
  DEFAULT_ADMIN,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import {
  getUsers,
  normalizeUsername,
  readSession,
  removeSession,
  writeSession,
} from './storage';

export const AUTH_STATUS_CODES = Object.freeze({
  invalidCredentials: 'INVALID_CREDENTIALS',
  storageUnavailable: 'STORAGE_UNAVAILABLE',
  invalidStoredData: 'INVALID_STORED_DATA',
});

/**
 * Reads the current browser-local session.
 *
 * @returns {{
 *   ok: true,
 *   value: object|null,
 *   degraded: boolean,
 *   diagnostic: null|{code: string, message: string}
 * }}
 */
export function getSession() {
  return readSession();
}

/**
 * Persists a browser-local session.
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
export function setSession(session) {
  return writeSession(session);
}

/**
 * Removes the current browser-local session.
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
export function clearSession() {
  return removeSession();
}

/**
 * Authenticates the permanent Admin or a browser-local user.
 *
 * @param {unknown} username
 * @param {unknown} password
 * @returns {{
 *   ok: true,
 *   session: {
 *     userId: string,
 *     username: string,
 *     displayName: string,
 *     role: string
 *   }
 * }|{
 *   ok: false,
 *   code: string,
 *   message: string
 * }}
 */
export function authenticate(username, password) {
  const normalizedUsername = normalizeUsername(username);

  if (
    normalizedUsername ===
      normalizeUsername(ADMIN_CREDENTIALS.username) &&
    password === ADMIN_CREDENTIALS.password
  ) {
    return {
      ok: true,
      session: {
        userId: DEFAULT_ADMIN.userId,
        username: DEFAULT_ADMIN.username,
        displayName: DEFAULT_ADMIN.displayName,
        role: DEFAULT_ADMIN.role,
      },
    };
  }

  const usersResult = getUsers();

  if (usersResult.degraded) {
    return {
      ok: false,
      code:
        usersResult.diagnostic?.code ??
        AUTH_STATUS_CODES.storageUnavailable,
      message:
        usersResult.diagnostic?.message ??
        MESSAGES.storageUnavailable,
    };
  }

  const matchingUser = usersResult.value.find(
    (user) =>
      normalizeUsername(user.username) === normalizedUsername &&
      user.password === password,
  );

  if (!matchingUser) {
    return {
      ok: false,
      code: AUTH_STATUS_CODES.invalidCredentials,
      message: MESSAGES.invalidCredentials,
    };
  }

  return {
    ok: true,
    session: {
      userId: matchingUser.id,
      username: matchingUser.username,
      displayName: matchingUser.displayName,
      role: matchingUser.role,
    },
  };
}

/**
 * Determines whether a session may edit or delete a post.
 *
 * @param {object|null|undefined} session
 * @param {object|null|undefined} post
 * @returns {boolean}
 */
export function canManagePost(session, post) {
  if (
    session === null ||
    typeof session !== 'object' ||
    post === null ||
    typeof post !== 'object'
  ) {
    return false;
  }

  if (session.role === ROLES.ADMIN) {
    return true;
  }

  return (
    typeof session.userId === 'string' &&
    session.userId.length > 0 &&
    typeof post.authorId === 'string' &&
    session.userId === post.authorId
  );
}

/**
 * Returns the appropriate signed-in landing route for a role.
 *
 * @param {object|null|undefined} session
 * @returns {'/admin'|'/blogs'}
 */
export function roleHome(session) {
  return session?.role === ROLES.ADMIN
    ? ROUTES.admin
    : ROUTES.blogs;
}