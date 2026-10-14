import PropTypes from 'prop-types';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import PublicNavbar from '../components/PublicNavbar';
import StorageNotice from '../components/StorageNotice';
import {
  ACCENT_CLASSES,
  DEFAULT_ADMIN,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import { roleHome } from '../utils/auth';
import {
  createExcerpt,
  formatDate,
  getAccentClass,
  sortPostsNewestFirst,
} from '../utils/formatters';
import {
  getPosts,
  STORAGE_STATUS_CODES,
} from '../utils/storage';

function PenIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m15.75 4.5 3.75 3.75M5.25 18.75l4.5-1.125L19.5 7.875a2.652 2.652 0 0 0-3.75-3.75L6 13.875l-.75 4.875Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M14.625 5.25 18.75 9.375M6 13.875l3.75 3.75"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function StorageIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
    >
      <ellipse
        cx="12"
        cy="5.25"
        rx="7.5"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.5 5.25v6c0 1.657 3.358 3 7.5 3s7.5-1.343 7.5-3v-6"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.5 11.25v6c0 1.657 3.358 3 7.5 3s7.5-1.343 7.5-3v-6"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3 5.25 5.625v5.625c0 4.294 2.77 8.09 6.75 9.75 3.98-1.66 6.75-5.456 6.75-9.75V5.625L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

const FEATURES = Object.freeze([
  Object.freeze({
    title: 'Write with ease',
    description:
      'Create, read, and manage distraction-free blog posts in a simple writing space.',
    icon: <PenIcon />,
    classes: 'bg-sky-100 text-sky-700',
  }),
  Object.freeze({
    title: 'Stored in your browser',
    description:
      'Your accounts, session, and posts stay in local browser storage without a server.',
    icon: <StorageIcon />,
    classes: 'bg-violet-100 text-violet-700',
  }),
  Object.freeze({
    title: 'Stay in control',
    description:
      'Ownership-aware tools help authors manage their posts while Admins oversee the demo.',
    icon: <ShieldIcon />,
    classes: 'bg-emerald-100 text-emerald-700',
  }),
]);

function PreviewCard({ post, index, session }) {
  const titleId = useId();
  const isAuthenticated =
    session !== null && typeof session === 'object';
  const destination = isAuthenticated
    ? `/blog/${encodeURIComponent(post.id)}`
    : ROUTES.login;
  const isAdminAuthor = post.authorId === DEFAULT_ADMIN.userId;

  return (
    <article
      aria-labelledby={titleId}
      className={`flex h-full flex-col rounded-xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm ${getAccentClass(index)}`}
    >
      <div className="flex items-center gap-3">
        <Avatar
          label={`${post.authorName}, author`}
          labelled
          role={isAdminAuthor ? ROLES.ADMIN : ROLES.USER}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {post.authorName}
          </p>
          <p className="text-xs text-slate-500">
            <time dateTime={post.createdAt}>
              {formatDate(post.createdAt)}
            </time>
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <h3
          className="text-xl font-bold leading-snug text-slate-900"
          id={titleId}
        >
          <Link
            className="rounded-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            to={destination}
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {createExcerpt(post.content, 120)}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Link
          aria-label={
            isAuthenticated
              ? `Read ${post.title}`
              : `Log in to read ${post.title}`
          }
          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          to={destination}
        >
          {isAuthenticated ? 'Read post' : 'Log in to read'}
        </Link>
      </div>
    </article>
  );
}

PreviewCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    authorId: PropTypes.string.isRequired,
    authorName: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
};

export default function LandingPage({ session = null }) {
  const [posts, setPosts] = useState([]);
  const [diagnostic, setDiagnostic] = useState(null);
  const isAuthenticated =
    session !== null && typeof session === 'object';
  const latestPosts = sortPostsNewestFirst(posts).slice(0, 3);
  const primaryRoute = isAuthenticated
    ? roleHome(session)
    : ROUTES.register;
  const primaryLabel = isAuthenticated
    ? session.role === ROLES.ADMIN
      ? 'Open Admin Dashboard'
      : 'Open My Blogs'
    : 'Get Started';
  const secondaryRoute = isAuthenticated
    ? ROUTES.write
    : ROUTES.login;
  const secondaryLabel = isAuthenticated
    ? 'Write a Post'
    : 'Log in';

  useEffect(() => {
    const result = getPosts();

    setPosts(result.value);
    setDiagnostic(result.diagnostic);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNavbar session={session} />

      <main className="flex-1">
        <section className="flex min-h-[calc(100vh-4rem)] items-center bg-gradient-to-br from-sky-50 via-white to-violet-100">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
                Your browser-local writing space
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Your stories, your space.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                WriteSpace is a private, local-first space for writing
                and managing your blog.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto ${ACCENT_CLASSES.primary}`}
                  to={primaryRoute}
                >
                  {primaryLabel}
                </Link>
                <Link
                  className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto ${ACCENT_CLASSES.secondary}`}
                  to={secondaryRoute}
                >
                  {secondaryLabel}
                </Link>
              </div>

              <p className="mx-auto mt-8 max-w-2xl text-sm leading-6 text-slate-600">
                {MESSAGES.fakeInformationWarning}
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="bg-white py-16 sm:py-20"
          id="features"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="text-3xl font-bold tracking-tight text-slate-900"
                id="features-heading"
              >
                A simple space for your words
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Everything you need for a small, browser-local blogging
                demo.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  key={feature.title}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.classes}`}
                  >
                    {feature.icon}
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="latest-posts-heading"
          className="bg-slate-50 py-16 sm:py-20"
          id="latest-posts"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-3xl font-bold tracking-tight text-slate-900"
                  id="latest-posts-heading"
                >
                  Latest posts
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Discover the newest writing saved in this browser.
                </p>
              </div>

              {isAuthenticated ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center self-start rounded-lg px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:self-auto"
                  to={ROUTES.blogs}
                >
                  View all posts
                </Link>
              ) : null}
            </div>

            <div className="mt-8">
              <StorageNotice diagnostic={diagnostic} />

              {diagnostic?.code ===
              STORAGE_STATUS_CODES.invalidStoredData ? (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
                  role="status"
                >
                  <p className="font-semibold">
                    Local post data could not be read
                  </p>
                  <p className="mt-1">{diagnostic.message}</p>
                </div>
              ) : null}
            </div>

            {latestPosts.length > 0 ? (
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post, index) => (
                  <PreviewCard
                    index={index}
                    key={post.id}
                    post={post}
                    session={session}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  No posts yet.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Be the first to write a post in this browser-local
                  space.
                </p>
                <Link
                  className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ACCENT_CLASSES.primary}`}
                  to={
                    isAuthenticated ? ROUTES.write : ROUTES.register
                  }
                >
                  {isAuthenticated ? 'Write a Post' : 'Get Started'}
                </Link>
              </div>
            )}
          </div>
        </section>

        <section
          aria-labelledby="demo-notice-heading"
          className="border-y border-amber-200 bg-amber-50"
        >
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2
              className="text-lg font-bold text-amber-950"
              id="demo-notice-heading"
            >
              Browser-local demo
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              <p>{MESSAGES.localSecurityWarning}</p>
              <p>{MESSAGES.passwordWarning}</p>
              <p>
                Data remains in this browser profile and may be removed
                by clearing site data or browser storage.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm">
            © {new Date().getFullYear()} WriteSpace. Browser-local demo.
          </p>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <li>
                <a
                  className="rounded-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  href="#features"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  className="rounded-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  href="#latest-posts"
                >
                  Latest posts
                </a>
              </li>
              <li>
                <Link
                  className="rounded-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  to={isAuthenticated ? roleHome(session) : ROUTES.login}
                >
                  {isAuthenticated ? 'My space' : 'Log in'}
                </Link>
              </li>
              {!isAuthenticated ? (
                <li>
                  <Link
                    className="rounded-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    to={ROUTES.register}
                  >
                    Register
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}

LandingPage.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
};