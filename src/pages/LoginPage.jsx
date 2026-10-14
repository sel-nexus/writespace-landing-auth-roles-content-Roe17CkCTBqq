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
  ADMIN_CREDENTIALS,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import {
  authenticate,
  roleHome,
  setSession,
} from '../utils/auth';

export default function LoginPage({
  session = null,
  onLogin = null,
}) {
  const navigate = useNavigate();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [fields, setFields] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
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
    }));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = {
      username:
        fields.username.trim().length === 0
          ? MESSAGES.usernameRequired
          : '',
      password:
        fields.password.length === 0
          ? MESSAGES.passwordRequired
          : '',
    };

    setErrors(nextErrors);
    setFormError('');

    if (nextErrors.username) {
      usernameRef.current?.focus();
      return;
    }

    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticationResult = authenticate(
        fields.username,
        fields.password,
      );

      if (!authenticationResult.ok) {
        setFormError(authenticationResult.message);
        return;
      }

      const saveResult = await Promise.resolve(
        onLogin === null
          ? setSession(authenticationResult.session)
          : onLogin(authenticationResult.session),
      );

      if (saveResult?.ok === false) {
        setFormError(
          typeof saveResult.message === 'string' &&
            saveResult.message.trim().length > 0
            ? saveResult.message
            : MESSAGES.writeFailed,
        );
        return;
      }

      navigate(roleHome(authenticationResult.session), {
        replace: true,
      });
    } catch {
      setFormError(MESSAGES.storageUnavailable);
    } finally {
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
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                  Welcome back
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Log in to WriteSpace
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Access the accounts and posts stored in this browser.
                </p>
              </div>

              <div
                className={`mt-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
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
                    htmlFor="login-username"
                  >
                    Username
                  </label>
                  <input
                    aria-describedby={
                      errors.username ? usernameErrorId : undefined
                    }
                    aria-invalid={errors.username ? 'true' : undefined}
                    autoComplete="username"
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSubmitting}
                    id="login-username"
                    name="username"
                    onChange={handleChange}
                    ref={usernameRef}
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
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <input
                    aria-describedby={
                      errors.password ? passwordErrorId : undefined
                    }
                    aria-invalid={errors.password ? 'true' : undefined}
                    autoComplete="current-password"
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSubmitting}
                    id="login-password"
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
                  {isSubmitting ? 'Logging in…' : 'Log in'}
                </button>
              </form>

              <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">
                  Permanent Admin demo
                </p>
                <p className="mt-1">
                  Username: {ADMIN_CREDENTIALS.username}
                </p>
                <p>Password: {ADMIN_CREDENTIALS.password}</p>
              </div>

              <p className="mt-6 text-center text-sm text-slate-600">
                Need a browser-local account?{' '}
                <Link
                  className="font-semibold text-sky-700 hover:text-sky-800 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  to={ROUTES.register}
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

LoginPage.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
  onLogin: PropTypes.func,
};