import PropTypes from 'prop-types';
import { useId, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import {
  ACCENT_CLASSES,
  DEFAULT_ADMIN,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import { roleHome, setSession } from '../utils/auth';
import {
  getUsers,
  normalizeUsername,
  saveUsers,
} from '../utils/storage';

const CONFIRM_PASSWORD_REQUIRED = 'Confirm password is required.';

export default function RegisterPage({
  session = null,
  onRegister = null,
}) {
  const navigate = useNavigate();
  const displayNameErrorId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const confirmPasswordErrorId = useId();
  const formErrorId = useId();
  const passwordWarningId = useId();
  const displayNameRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const submissionPendingRef = useRef(false);
  const [fields, setFields] = useState({
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated =
    session !== null && typeof session === 'object';

  function handleChange(event) {
    const { name, value } = event.target;

    setFields((currentFields) => ({
      ...currentFields,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
      ...(name === 'password'
        ? { confirmPassword: '' }
        : {}),
    }));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submissionPendingRef.current) {
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
      confirmPassword:
        fields.confirmPassword.trim().length === 0
          ? CONFIRM_PASSWORD_REQUIRED
          : fields.password !== fields.confirmPassword
            ? MESSAGES.passwordsDoNotMatch
            : '',
    };

    setErrors(nextErrors);
    setFormError('');

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

    if (nextErrors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      return;
    }

    submissionPendingRef.current = true;
    setIsSubmitting(true);
    let accountCreated = false;

    try {
      const usersResult = getUsers();

      if (usersResult.degraded) {
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

      const user = {
        id: randomUUID.call(globalThis.crypto),
        displayName: fields.displayName.trim(),
        username: fields.username.trim(),
        password: fields.password,
        role: ROLES.USER,
        createdAt: new Date().toISOString(),
      };
      const saveUsersResult = saveUsers([
        ...usersResult.value,
        user,
      ]);

      if (!saveUsersResult.ok) {
        setFormError(saveUsersResult.message);
        return;
      }

      accountCreated = true;

      const nextSession = {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      };
      const sessionResult = await Promise.resolve(
        onRegister === null
          ? setSession(nextSession)
          : onRegister(nextSession),
      );

      if (sessionResult?.ok === false) {
        setFormError(MESSAGES.registrationPartialSuccess);
        return;
      }

      navigate(ROUTES.blogs, { replace: true });
    } catch {
      setFormError(
        accountCreated
          ? MESSAGES.registrationPartialSuccess
          : MESSAGES.storageUnavailable,
      );
    } finally {
      submissionPendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate replace to={roleHome(session)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar />

      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                  Create your writing space
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Register for WriteSpace
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Create an account stored only in this browser.
                </p>
              </div>

              <div
                className={`mt-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
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
                className="mt-6 space-y-5"
                noValidate
                onSubmit={handleSubmit}
              >
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-800"
                    htmlFor="register-display-name"
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
                    autoComplete="name"
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSubmitting}
                    id="register-display-name"
                    maxLength={100}
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
                    htmlFor="register-username"
                  >
                    Username
                  </label>
                  <input
                    aria-describedby={
                      errors.username ? usernameErrorId : undefined
                    }
                    aria-invalid={
                      errors.username ? 'true' : undefined
                    }
                    autoCapitalize="none"
                    autoComplete="username"
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSubmitting}
                    id="register-username"
                    maxLength={50}
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
                    htmlFor="register-password"
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
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSubmitting}
                    id="register-password"
                    maxLength={200}
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
                    htmlFor="register-confirm-password"
                  >
                    Confirm password
                  </label>
                  <input
                    aria-describedby={
                      errors.confirmPassword
                        ? confirmPasswordErrorId
                        : undefined
                    }
                    aria-invalid={
                      errors.confirmPassword ? 'true' : undefined
                    }
                    autoComplete="new-password"
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSubmitting}
                    id="register-confirm-password"
                    maxLength={200}
                    name="confirmPassword"
                    onChange={handleChange}
                    ref={confirmPasswordRef}
                    type="password"
                    value={fields.confirmPassword}
                  />
                  {errors.confirmPassword ? (
                    <p
                      className="mt-2 text-sm text-red-700"
                      id={confirmPasswordErrorId}
                    >
                      {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>

                {formError ? (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.error}`}
                    id={formErrorId}
                    role="alert"
                  >
                    {formError}
                  </div>
                ) : null}

                <button
                  aria-describedby={
                    formError ? formErrorId : undefined
                  }
                  className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-3 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ACCENT_CLASSES.primary}`}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? 'Creating account…'
                    : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have a browser-local account?{' '}
                <Link
                  className="font-semibold text-sky-700 hover:text-sky-800 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  to={ROUTES.login}
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

RegisterPage.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
  onRegister: PropTypes.func,
};