import PropTypes from 'prop-types';
import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import StorageNotice from '../components/StorageNotice';
import {
  ACCENT_CLASSES,
  DEFAULT_ADMIN,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import { canManagePost, getSession } from '../utils/auth';
import {
  formatDate,
  sortPostsNewestFirst,
} from '../utils/formatters';
import {
  getPosts,
  getUsers,
  savePosts,
  STORAGE_STATUS_CODES,
} from '../utils/storage';

function PostIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6.75 3.75h7.5l3 3v13.5H6.75V3.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M14.25 3.75v3h3M9.75 11.25h4.5m-4.5 3h4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M9.75 11.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM3.75 20.25v-1.5a6 6 0 0 1 12 0v1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M16.5 5.1a3.75 3.75 0 0 1 0 7.05m1.5 2.1a6 6 0 0 1 2.25 4.68v1.32"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m3.75 7.5 4.5 3 3.75-6 3.75 6 4.5-3-1.5 9.75H5.25L3.75 7.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M5.25 19.5h13.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function RecentPostRow({
  post,
  users,
  session,
  isDeleting,
  onDelete,
}) {
  const titleId = useId();
  const localAuthor = users.find(
    (user) => user.id === post.authorId,
  );
  const authorIsAdmin =
    post.authorId === DEFAULT_ADMIN.userId ||
    localAuthor?.role === ROLES.ADMIN;
  const canManage = canManagePost(session, post);

  return (
    <article
      aria-labelledby={titleId}
      className="grid gap-5 border-t border-slate-200 px-4 py-5 first:border-t-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
    >
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <Avatar
            label={`${post.authorName}, author`}
            labelled
            role={authorIsAdmin ? ROLES.ADMIN : ROLES.USER}
          />
          <div className="min-w-0">
            <h3
              className="break-words text-lg font-bold leading-6 text-slate-900"
              id={titleId}
            >
              <Link
                className="rounded-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                to={`/blog/${encodeURIComponent(post.id)}`}
              >
                {post.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              <span>{post.authorName}</span>
              <span aria-hidden="true"> · </span>
              <time dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
            </p>
          </div>
        </div>
      </div>

      {canManage ? (
        <div className="flex flex-wrap items-center gap-3 sm:pl-13 lg:pl-0">
          <Link
            aria-label={`Edit ${post.title}`}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ACCENT_CLASSES.secondary}`}
            to={`/edit/${encodeURIComponent(post.id)}`}
          >
            Edit
          </Link>
          <button
            aria-label={`Delete ${post.title}`}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ACCENT_CLASSES.danger}`}
            disabled={isDeleting}
            onClick={() => onDelete(post)}
            type="button"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ) : null}
    </article>
  );
}

RecentPostRow.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    authorId: PropTypes.string.isRequired,
    authorName: PropTypes.string.isRequired,
  }).isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
    }),
  ).isRequired,
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  isDeleting: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function AdminDashboard({ session, onLogout }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [postsDiagnostic, setPostsDiagnostic] = useState(null);
  const [usersDiagnostic, setUsersDiagnostic] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const postsResult = getPosts();
    const usersResult = getUsers();

    setPosts(postsResult.value);
    setUsers(usersResult.value);
    setPostsDiagnostic(postsResult.diagnostic);
    setUsersDiagnostic(usersResult.diagnostic);
  }, []);

  const recentPosts = sortPostsNewestFirst(posts).slice(0, 5);
  const totalAccounts = users.length + 1;
  const totalAdmins =
    users.filter((user) => user.role === ROLES.ADMIN).length + 1;
  const totalUsers = users.filter(
    (user) => user.role === ROLES.USER,
  ).length;
  const storageUnavailableDiagnostic =
    postsDiagnostic?.code ===
    STORAGE_STATUS_CODES.storageUnavailable
      ? postsDiagnostic
      : usersDiagnostic?.code ===
          STORAGE_STATUS_CODES.storageUnavailable
        ? usersDiagnostic
        : null;

  async function handleDelete(post) {
    if (
      deletingPostId !== null ||
      session.role !== ROLES.ADMIN ||
      !canManagePost(session, post)
    ) {
      return;
    }

    const confirmed = window.confirm(
      MESSAGES.deletePostConfirmation,
    );

    if (!confirmed) {
      return;
    }

    setDeletingPostId(post.id);
    setDeleteError('');

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

      const postsResult = getPosts();

      if (postsResult.degraded) {
        setPostsDiagnostic(postsResult.diagnostic);
        setDeleteError(
          postsResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      const freshPost =
        postsResult.value.find((item) => item.id === post.id) ?? null;

      if (freshPost === null) {
        setPosts(postsResult.value);
        return;
      }

      if (!canManagePost(sessionResult.value, freshPost)) {
        navigate(ROUTES.blogs, { replace: true });
        return;
      }

      const nextPosts = postsResult.value.filter(
        (item) => item.id !== freshPost.id,
      );
      const saveResult = await Promise.resolve(
        savePosts(nextPosts),
      );

      if (!saveResult.ok) {
        setDeleteError(saveResult.message);
        return;
      }

      setPosts(nextPosts);
      setPostsDiagnostic(null);
    } catch {
      setDeleteError(MESSAGES.storageUnavailable);
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onLogout={onLogout} session={session} />

      <main className="flex-1">
        <section className="bg-gradient-to-r from-violet-700 to-indigo-700 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-100">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-violet-100">
                Review browser-local activity, manage posts, and
                administer local accounts.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-violet-800 shadow-sm hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                to={ROUTES.write}
              >
                Write a Post
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                to={ROUTES.users}
              >
                Manage Users
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <StorageNotice diagnostic={storageUnavailableDiagnostic} />

          {postsDiagnostic?.code ===
          STORAGE_STATUS_CODES.invalidStoredData ? (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
              role="status"
            >
              <p className="font-semibold">
                Local post data could not be read
              </p>
              <p className="mt-1">{postsDiagnostic.message}</p>
            </div>
          ) : null}

          {usersDiagnostic?.code ===
          STORAGE_STATUS_CODES.invalidStoredData ? (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
              role="status"
            >
              <p className="font-semibold">
                Local user data could not be read
              </p>
              <p className="mt-1">{usersDiagnostic.message}</p>
            </div>
          ) : null}

          <section aria-labelledby="overview-heading">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-slate-900"
                id="overview-heading"
              >
                Overview
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Aggregate activity stored in this browser.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                accent="sky"
                icon={<PostIcon />}
                subtitle="All saved posts"
                title="Total Posts"
                value={posts.length}
              />
              <StatCard
                accent="violet"
                icon={<UsersIcon />}
                subtitle="All accounts"
                title="Total Users"
                value={totalAccounts}
              />
              <StatCard
                accent="amber"
                icon={<AdminIcon />}
                subtitle="Admin role"
                title="Total Admins"
                value={totalAdmins}
              />
              <StatCard
                accent="emerald"
                icon={<UsersIcon />}
                subtitle="User role"
                title="Total users"
                value={totalUsers}
              />
            </div>
          </section>

          <section
            aria-labelledby="recent-posts-heading"
            className="mt-10"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-2xl font-bold tracking-tight text-slate-900"
                  id="recent-posts-heading"
                >
                  Recent Posts
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The five newest posts saved in this browser.
                </p>
              </div>

              <Link
                className="inline-flex min-h-11 items-center justify-center self-start rounded-lg px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:self-auto"
                to={ROUTES.blogs}
              >
                View all posts
              </Link>
            </div>

            {deleteError ? (
              <div
                className={`mt-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.error}`}
                role="alert"
              >
                {deleteError}
              </div>
            ) : null}

            {recentPosts.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {recentPosts.map((post) => (
                  <RecentPostRow
                    isDeleting={deletingPostId === post.id}
                    key={post.id}
                    onDelete={handleDelete}
                    post={post}
                    session={session}
                    users={users}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  No posts yet.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Create the first post in this browser-local space.
                </p>
                <Link
                  className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ACCENT_CLASSES.primary}`}
                  to={ROUTES.write}
                >
                  Write a Post
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

AdminDashboard.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};