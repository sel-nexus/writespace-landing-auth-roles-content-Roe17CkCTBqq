import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ACCENT_CLASSES, ROLES, ROUTES } from '../constants';
import Avatar from './Avatar';

function BrandIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M3.75 5.25c3-.75 5.75 0 8.25 2.25v12c-2.5-2.25-5.25-3-8.25-2.25v-12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M20.25 5.25c-3-.75-5.75 0-8.25 2.25v12c2.5-2.25 5.25-3 8.25-2.25v-12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="m16.5 3 2.25 2.25-5.5 5.5-3 .75.75-3L16.5 3Z"
        fill="white"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function PublicNavbar({ session = null }) {
  const isAuthenticated =
    session !== null && typeof session === 'object';
  const isAdmin =
    isAuthenticated && session.role === ROLES.ADMIN;
  const dashboardRoute = isAdmin ? ROUTES.admin : ROUTES.blogs;
  const dashboardLabel = isAdmin ? 'Admin Dashboard' : 'My Blogs';

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-xl font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          to={ROUTES.landing}
        >
          <span className="text-sky-600">
            <BrandIcon />
          </span>
          <span>WriteSpace</span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Avatar
                label={`${session.displayName}, ${isAdmin ? 'Admin' : 'User'}`}
                labelled
                role={isAdmin ? ROLES.ADMIN : ROLES.USER}
              />
              <span className="hidden max-w-48 truncate text-sm font-medium text-slate-700 sm:block">
                {session.displayName}
              </span>
            </div>
            <Link
              className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 ${ACCENT_CLASSES.primary}`}
              to={dashboardRoute}
            >
              {dashboardLabel}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 sm:px-4"
              to={ROUTES.login}
            >
              Log in
            </Link>
            <Link
              className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 ${ACCENT_CLASSES.primary}`}
              to={ROUTES.register}
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

PublicNavbar.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
};