import PropTypes from 'prop-types';
import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StorageNotice from '../components/StorageNotice';
import UserRow from '../components/UserRow';
import {
  ACCENT_CLASSES,
  DEFAULT_ADMIN,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import { getSession } from '../utils/auth';
import {
  getUsers,
  normalizeUsername,
  saveUsers,
  STORAGE_STATUS_CODES,
} from '../utils/storage';

const DISPLAY_NAME_MAX_LENGTH = 100;
const USERNAME_MAX_LENGTH = 50;
const PASSWORD_MAX_LENGTH = 200;

export default function UserManagement({ session, onLogout }) {
  const navigate = useNavigate();
  const displayNameErrorId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const roleErrorId = useId();
  const formErrorId = useId();
  const passwordWarningId = useId();
  const displayNameRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const roleRef = useRef(null);
  const submissionPendingRef = useRef(false);
  const [users, setUsers] = useState([]);
  const [diagnostic, setDiagnostic] = useState(null);
  const [fields, setFields] = useState({
    displayName: '',
    username: '',
    password: '',
    role: '',
  });
  const [errors, setErrors] = useState({
    displayName: '',
    username: '',
    password: '',
    role: '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const usersResult = getUsers();

    setUsers(usersResult.value);
    setDiagnostic(usersResult.diagnostic);
  }, []);

  const permanentAdmin = {
    id: DEFAULT_ADMIN.userId,
    displayName: DEFAULT_ADMIN.displayName,
    username: DEFAULT_ADMIN.username,
    role: DEFAULT_ADMIN.role,
  };
  const displayedUsers = [permanentAdmin, ...users];
  const mutationPending =
    isSubmitting || deletingUserId !== null;

  function handleChange(event) {
    const { name, value } = event.target;

    setFields((currentFields) => ({
      ...currentFields,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }));
    setFormError('');
    setSuccessMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submissionPendingRef.current ||
      deletingUserId !== null
    ) {
      return;
    }

    const nextErrors = {
      displayName:
        fields.displayName.trim().length === 0
          ? MESSAGES.displayNameRequired
          : '',
      username:
        fields.username.trim().length === 0
          ? MESSAGES.usernameRequired
          : '',
      password:
        fields.password.trim().length === 0
          ? MESSAGES.passwordRequired
          : '',
      role:
        fields.role !== ROLES.ADMIN &&
        fields.role !== ROLES.USER
          ? MESSAGES.roleRequired
          : '',
    };

    setErrors(nextErrors);
    setFormError('');
    setSuccessMessage('');
    setDeleteError('');

    if (nextErrors.displayName) {
      displayNameRef.current?.focus();
      return;
    }

    if (nextErrors.username) {
      usernameRef.current?.focus();
      return;
    }

    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    if (nextErrors.role) {
      roleRef.current?.focus();
      return;
    }

    submissionPendingRef.current = true;
    setIsSubmitting(true);

    try {
      const sessionResult = getSession();

      if (sessionResult.degraded) {
        setFormError(
          sessionResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      if (sessionResult.value === null) {
        navigate(ROUTES.login, { replace: true });
        return;
      }

      if (sessionResult.value.role !== ROLES.ADMIN) {
        navigate(ROUTES.blogs, { replace: true });
        return;
      }

      const usersResult = getUsers();

      if (usersResult.degraded) {
        setDiagnostic(usersResult.diagnostic);
        setFormError(
          usersResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      const normalizedUsername = normalizeUsername(fields.username);
      const usernameIsInUse =
        normalizedUsername ===
          normalizeUsername(DEFAULT_ADMIN.username) ||
        usersResult.value.some(
          (user) =>
            normalizeUsername(user.username) === normalizedUsername,
        );

      if (usernameIsInUse) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          username: MESSAGES.usernameInUse,
        }));
        usernameRef.current?.focus();
        return;
      }

      const randomUUID = globalThis.crypto?.randomUUID;

      if (typeof randomUUID !== 'function') {
        setFormError(MESSAGES.unsupportedBrowser);
        return;
      }

      const newUser = {
        id: randomUUID.call(globalThis.crypto),
        displayName: fields.displayName.trim(),
        username: fields.username.trim(),
        password: fields.password,
        role: fields.role,
        createdAt: new Date().toISOString(),
      };
      const nextUsers = [...usersResult.value, newUser];
      const saveResult = await Promise.resolve(
        saveUsers(nextUsers),
      );

      if (!saveResult.ok) {
        setFormError(saveResult.message);
        return;
      }

      setUsers(nextUsers);
      setDiagnostic(null);
      setFields({
        displayName: '',
        username: '',
        password: '',
        role: '',
      });
      setErrors({
        displayName: '',
        username: '',
        password: '',
        role: '',
      });
      setSuccessMessage('Account created.');
    } catch {
      setFormError(MESSAGES.storageUnavailable);
    } finally {
      submissionPendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user) {
    const userId = user.id ?? user.userId ?? '';

    if (
      mutationPending ||
      userId.length === 0 ||
      userId === DEFAULT_ADMIN.userId ||
      userId === session.userId
    ) {
      return;
    }

    const confirmed = window.confirm(
      MESSAGES.deleteUserConfirmation,
    );

    if (!confirmed) {
      return;
    }

    setDeletingUserId(userId);
    setDeleteError('');
    setFormError('');
    setSuccessMessage('');

    try {
      const sessionResult = getSession();

      if (sessionResult.degraded) {
        setDeleteError(
          sessionResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      if (sessionResult.value === null) {
        navigate(ROUTES.login, { replace: true });
        return;
      }

      if (sessionResult.value.role !== ROLES.ADMIN) {
        navigate(ROUTES.blogs, { replace: true });
        return;
      }

      if (
        userId === DEFAULT_ADMIN.userId ||
        userId === sessionResult.value.userId
      ) {
        setDeleteError(
          userId === DEFAULT_ADMIN.userId
            ? 'The permanent Admin account cannot be deleted.'
            : 'You cannot delete your own account.',
        );
        return;
      }

      const usersResult = getUsers();

      if (usersResult.degraded) {
        setDiagnostic(usersResult.diagnostic);
        setDeleteError(
          usersResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      const matchingUser =
        usersResult.value.find(
          (storedUser) => storedUser.id === userId,
        ) ?? null;

      if (matchingUser === null) {
        setUsers(usersResult.value);
        return;
      }

      const nextUsers = usersResult.value.filter(
        (storedUser) => storedUser.id !== userId,
      );
      const saveResult = await Promise.resolve(
        saveUsers(nextUsers),
      );

      if (!saveResult.ok) {
        setDeleteError(saveResult.message);
        return;
      }

      setUsers(nextUsers);
      setDiagnostic(null);
      setSuccessMessage('Account deleted.');
    } catch {
      setDeleteError(MESSAGES.storageUnavailable);
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onLogout={onLogout} session={session} />

      <main className="flex-1">
        <section className="bg-gradient-to-r from-violet-700 to-indigo-700 text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-100">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              User Management
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-violet-100">
              Create and manage accounts stored in this browser.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <StorageNotice diagnostic={diagnostic} />

          {diagnostic?.code ===
          STORAGE_STATUS_CODES.invalidStoredData ? (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
              role="status"
            >
              <p className="font-semibold">
                Local user data could not be read
              </p>
              <p className="mt-1">{diagnostic.message}</p>
            </div>
          ) : null}

          <section aria-labelledby="create-user-heading">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-slate-900"
                id="create-user-heading"
              >
                Create an Account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add an Admin or user account to this browser-local
                space.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
                id={passwordWarningId}
              >
                <p className="font-semibold">Browser-local demo</p>
                <p className="mt-1 leading-6">
                  {MESSAGES.fakeInformationWarning}
                </p>
                <p className="mt-1 leading-6">
                  {MESSAGES.passwordWarning}
                </p>
              </div>

              <form
                className="mt-6"
                noValidate
                onSubmit={handleSubmit}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      className="block text-sm font-semibold text-slate-800"
                      htmlFor="user-display-name"
                    >
                      Display name
                    </label>
                    <input
                      aria-describedby={
                        errors.displayName
                          ? displayNameErrorId
                          : undefined
                      }
                      aria-invalid={
                        errors.displayName ? 'true' : undefined
                      }
                      autoComplete="off"
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      disabled={mutationPending}
                      id="user-display-name"
                      maxLength={DISPLAY_NAME_MAX_LENGTH}
                      name="displayName"
                      onChange={handleChange}
                      ref={displayNameRef}
                      type="text"
                      value={fields.displayName}
                    />
                    {errors.displayName ? (
                      <p
                        className="mt-2 text-sm text-red-700"
                        id={displayNameErrorId}
                      >
                        {errors.displayName}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-semibold text-slate-800"
                      htmlFor="user-username"
                    >
                      Username
                    </label>
                    <input
                      aria-describedby={
                        errors.username
                          ? usernameErrorId
                          : undefined
                      }
                      aria-invalid={
                        errors.username ? 'true' : undefined
                      }
                      autoCapitalize="none"
                      autoComplete="off"
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      disabled={mutationPending}
                      id="user-username"
                      maxLength={USERNAME_MAX_LENGTH}
                      name="username"
                      onChange={handleChange}
                      ref={usernameRef}
                      spellCheck="false"
                      type="text"
                      value={fields.username}
                    />
                    {errors.username ? (
                      <p
                        className="mt-2 text-sm text-red-700"
                        id={usernameErrorId}
                      >
                        {errors.username}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-semibold text-slate-800"
                      htmlFor="user-password"
                    >
                      Password
                    </label>
                    <input
                      aria-describedby={
                        errors.password
                          ? `${passwordWarningId} ${passwordErrorId}`
                          : passwordWarningId
                      }
                      aria-invalid={
                        errors.password ? 'true' : undefined
                      }
                      autoComplete="new-password"
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      disabled={mutationPending}
                      id="user-password"
                      maxLength={PASSWORD_MAX_LENGTH}
                      name="password"
                      onChange={handleChange}
                      ref={passwordRef}
                      type="password"
                      value={fields.password}
                    />
                    {errors.password ? (
                      <p
                        className="mt-2 text-sm text-red-700"
                        id={passwordErrorId}
                      >
                        {errors.password}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-semibold text-slate-800"
                      htmlFor="user-role"
                    >
                      Role
                    </label>
                    <select
                      aria-describedby={
                        errors.role ? roleErrorId : undefined
                      }
                      aria-invalid={
                        errors.role ? 'true' : undefined
                      }
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      disabled={mutationPending}
                      id="user-role"
                      name="role"
                      onChange={handleChange}
                      ref={roleRef}
                      value={fields.role}
                    >
                      <option value="">Select a role</option>
                      <option value={ROLES.USER}>User</option>
                      <option value={ROLES.ADMIN}>Admin</option>
                    </select>
                    {errors.role ? (
                      <p
                        className="mt-2 text-sm text-red-700"
                        id={roleErrorId}
                      >
                        {errors.role}
                      </p>
                    ) : null}
                  </div>
                </div>

                {formError ? (
                  <div
                    className={`mt-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.error}`}
                    id={formErrorId}
                    role="alert"
                  >
                    {formError}
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <button
                    aria-describedby={
                      formError ? formErrorId : undefined
                    }
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${ACCENT_CLASSES.primary}`}
                    disabled={mutationPending}
                    type="submit"
                  >
                    {isSubmitting
                      ? 'Creating account…'
                      : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section
            aria-labelledby="accounts-heading"
            className="mt-10"
          >
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-slate-900"
                id="accounts-heading"
              >
                Accounts
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {displayedUsers.length}{' '}
                {displayedUsers.length === 1
                  ? 'account is'
                  : 'accounts are'}{' '}
                available in this browser.
              </p>
            </div>

            {successMessage ? (
              <div
                className={`mt-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.info}`}
                role="status"
              >
                {successMessage}
              </div>
            ) : null}

            {deleteError ? (
              <div
                className={`mt-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.error}`}
                role="alert"
              >
                {deleteError}
              </div>
            ) : null}

            <div className="mt-6">
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-6 rounded-t-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 md:grid">
                <span>Account</span>
                <span>Role</span>
                <span>Created</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="grid gap-4 md:block md:overflow-hidden md:rounded-b-xl md:border-x md:border-b md:border-slate-200 md:bg-white md:shadow-sm">
                {displayedUsers.map((user) => (
                  <UserRow
                    isDeleting={deletingUserId === user.id}
                    key={user.id}
                    onDelete={handleDelete}
                    session={session}
                    user={user}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

UserManagement.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};