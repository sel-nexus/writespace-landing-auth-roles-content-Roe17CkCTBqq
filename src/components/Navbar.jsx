import PropTypes from 'prop-types';
import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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

function MenuIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      {open ? (
        <path
          d="m6 6 12 12M18 6 6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      ) : (
        <path
          d="M4.5 6.75h15m-15 5.25h15m-15 5.25h15"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      )}
    </svg>
  );
}

MenuIcon.propTypes = {
  open: PropTypes.bool.isRequired,
};

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m7.5 9.75 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M14.25 8.25V5.5A2.5 2.5 0 0 0 11.75 3h-5.5a2.5 2.5 0 0 0-2.5 2.5v13a2.5 2.5 0 0 0 2.5 2.5h5.5a2.5 2.5 0 0 0 2.5-2.5v-2.75M10.5 12h9.75m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function isRouteActive(pathname, route) {
  if (route === ROUTES.blogs) {
    return (
      pathname === ROUTES.blogs ||
      pathname.startsWith('/blog/')
    );
  }

  if (route === ROUTES.write) {
    return (
      pathname === ROUTES.write ||
      pathname.startsWith('/edit/')
    );
  }

  return pathname === route;
}

export default function Navbar({ session, onLogout }) {
  const { pathname } = useLocation();
  const mobileMenuId = useId();
  const accountMenuId = useId();
  const mobileButtonRef = useRef(null);
  const accountButtonRef = useRef(null);
  const mobileContainerRef = useRef(null);
  const accountContainerRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const isAdmin = session.role === ROLES.ADMIN;
  const homeRoute = isAdmin ? ROUTES.admin : ROUTES.blogs;
  const navigationItems = isAdmin
    ? [
        { label: 'Dashboard', route: ROUTES.admin },
        { label: 'Blogs', route: ROUTES.blogs },
        { label: 'Write', route: ROUTES.write },
        { label: 'Users', route: ROUTES.users },
      ]
    : [
        { label: 'My Blogs', route: ROUTES.blogs },
        { label: 'Write', route: ROUTES.write },
      ];

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        accountMenuOpen &&
        !accountContainerRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }

      if (
        mobileMenuOpen &&
        !mobileContainerRef.current?.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [accountMenuOpen, mobileMenuOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') {
        return;
      }

      if (accountMenuOpen) {
        event.preventDefault();
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
        return;
      }

      if (mobileMenuOpen) {
        event.preventDefault();
        setMobileMenuOpen(false);
        mobileButtonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen, mobileMenuOpen]);

  function closeNavigation() {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => !open);
    setAccountMenuOpen(false);
    setLogoutError('');
  }

  function toggleAccountMenu() {
    setAccountMenuOpen((open) => !open);
    setMobileMenuOpen(false);
    setLogoutError('');
  }

  async function handleLogout() {
    if (logoutPending) {
      return;
    }

    setLogoutPending(true);
    setLogoutError('');

    try {
      const result = await Promise.resolve(onLogout());

      if (result?.ok === false) {
        setLogoutError(
          typeof result.message === 'string' &&
            result.message.trim().length > 0
            ? result.message
            : 'Could not log out. Please try again.',
        );
        return;
      }

      setAccountMenuOpen(false);
      setMobileMenuOpen(false);
    } catch {
      setLogoutError('Could not log out. Please try again.');
    } finally {
      setLogoutPending(false);
    }
  }

  function renderNavigationLink(item, mobile = false) {
    const active = isRouteActive(pathname, item.route);

    return (
      <NavLink
        aria-current={active ? 'page' : undefined}
        className={
          mobile
            ? `flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? 'bg-sky-100 text-sky-800 focus-visible:outline-sky-600'
                  : 'text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-600'
              }`
            : `inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? 'bg-sky-100 text-sky-800 focus-visible:outline-sky-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-600'
              }`
        }
        key={`${mobile ? 'mobile' : 'desktop'}-${item.route}`}
        onClick={closeNavigation}
        to={item.route}
      >
        {item.label}
      </NavLink>
    );
  }

  return (
    <header className="relative z-20 border-b border-slate-200 bg-white">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8"
      >
        <Link
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md text-xl font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          onClick={closeNavigation}
          to={homeRoute}
        >
          <span className="text-sky-600">
            <BrandIcon />
          </span>
          <span className="hidden sm:inline">WriteSpace</span>
          <span className="sr-only sm:hidden">WriteSpace</span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navigationItems.map((item) =>
            renderNavigationLink(item),
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={accountContainerRef}>
            <button
              aria-controls={accountMenuId}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              aria-label={`${session.displayName} account menu`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 text-left text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:pr-3"
              onClick={toggleAccountMenu}
              ref={accountButtonRef}
              type="button"
            >
              <Avatar
                label={`${session.displayName}, ${
                  isAdmin ? 'Admin' : 'User'
                }`}
                labelled
                role={isAdmin ? ROLES.ADMIN : ROLES.USER}
              />
              <span className="hidden max-w-40 truncate text-sm font-semibold lg:block">
                {session.displayName}
              </span>
              <span className="hidden sm:block">
                <ChevronIcon />
              </span>
            </button>

            {accountMenuOpen ? (
              <div
                aria-label="Account menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                id={accountMenuId}
                role="menu"
              >
                <div className="border-b border-slate-200 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {session.displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    @{session.username}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {isAdmin ? 'Admin account' : 'User account'}
                  </p>
                </div>

                <button
                  className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={logoutPending}
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                >
                  <LogoutIcon />
                  {logoutPending ? 'Logging out…' : 'Log out'}
                </button>

                {logoutError ? (
                  <p
                    className={`mt-2 rounded-lg border px-3 py-2 text-sm ${ACCENT_CLASSES.error}`}
                    role="alert"
                  >
                    {logoutError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="md:hidden" ref={mobileContainerRef}>
            <button
              aria-controls={mobileMenuId}
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              onClick={toggleMobileMenu}
              ref={mobileButtonRef}
              type="button"
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>

            {mobileMenuOpen ? (
              <div
                className="absolute inset-x-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg"
                id={mobileMenuId}
              >
                <div className="mx-auto flex max-w-7xl flex-col gap-1">
                  {navigationItems.map((item) =>
                    renderNavigationLink(item, true),
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}

Navbar.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};