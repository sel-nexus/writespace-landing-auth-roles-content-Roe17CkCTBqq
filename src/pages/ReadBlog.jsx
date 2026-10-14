import PropTypes from 'prop-types';
import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import StorageNotice from '../components/StorageNotice';
import {
  ACCENT_CLASSES,
  DEFAULT_ADMIN,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import { canManagePost, getSession } from '../utils/auth';
import { formatDate } from '../utils/formatters';
import {
  getPosts,
  savePosts,
  STORAGE_STATUS_CODES,
} from '../utils/storage';

export default function ReadBlog({ session, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const titleId = useId();
  const [post, setPost] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const postsResult = getPosts();
    const matchingPost =
      typeof id === 'string'
        ? postsResult.value.find((item) => item.id === id) ?? null
        : null;

    setPost(matchingPost);
    setDiagnostic(postsResult.diagnostic);
    setIsLoading(false);
  }, [id]);

  function handleDelete() {
    if (
      post === null ||
      isDeleting ||
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

    setIsDeleting(true);
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

      const postsResult = getPosts();

      if (postsResult.degraded) {
        setDiagnostic(postsResult.diagnostic);
        setDeleteError(
          postsResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      const freshPost =
        postsResult.value.find((item) => item.id === post.id) ?? null;

      if (freshPost === null) {
        setPost(null);
        return;
      }

      if (!canManagePost(sessionResult.value, freshPost)) {
        navigate(ROUTES.blogs, { replace: true });
        return;
      }

      const saveResult = savePosts(
        postsResult.value.filter((item) => item.id !== freshPost.id),
      );

      if (!saveResult.ok) {
        setDeleteError(saveResult.message);
        return;
      }

      navigate(ROUTES.blogs, { replace: true });
    } catch {
      setDeleteError(MESSAGES.storageUnavailable);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar onLogout={onLogout} session={session} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm font-medium text-slate-600" role="status">
            Loading post…
          </p>
        </main>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar onLogout={onLogout} session={session} />

        <main className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <StorageNotice diagnostic={diagnostic} />

            {diagnostic?.code ===
            STORAGE_STATUS_CODES.invalidStoredData ? (
              <div
                className={`mb-6 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
                role="status"
              >
                <p className="font-semibold">
                  Local post data could not be read
                </p>
                <p className="mt-1">{diagnostic.message}</p>
              </div>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {MESSAGES.postNotFound}
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                This post does not exist or is no longer available in
                this browser.
              </p>
              <Link
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ACCENT_CLASSES.primary}`}
                to={ROUTES.blogs}
              >
                Back to Blogs
              </Link>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const canManage = canManagePost(session, post);
  const authorIsAdmin =
    post.authorId === DEFAULT_ADMIN.userId ||
    (session.userId === post.authorId &&
      session.role === ROLES.ADMIN);
  const authorRole = authorIsAdmin ? ROLES.ADMIN : ROLES.USER;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onLogout={onLogout} session={session} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            to={ROUTES.blogs}
          >
            ← Back to Blogs
          </Link>

          <div className="mt-4">
            <StorageNotice diagnostic={diagnostic} />
          </div>

          <article
            aria-labelledby={titleId}
            className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-12"
          >
            <header className="border-b border-slate-200 pb-8">
              <h1
                className="break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                id={titleId}
              >
                {post.title}
              </h1>

              <div className="mt-6 flex items-center gap-3">
                <Avatar
                  label={`${post.authorName}, author`}
                  labelled
                  role={authorRole}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {post.authorName}
                  </p>
                  <p className="text-sm text-slate-500">
                    <time dateTime={post.createdAt}>
                      {formatDate(post.createdAt)}
                    </time>
                  </p>
                </div>
              </div>
            </header>

            <div className="mx-auto mt-8 max-w-prose">
              <p className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700">
                {post.content}
              </p>
            </div>

            {canManage ? (
              <footer className="mt-10 border-t border-slate-200 pt-6">
                {deleteError ? (
                  <div
                    className={`mb-5 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.error}`}
                    role="alert"
                  >
                    {deleteError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link
                    aria-label={`Edit ${post.title}`}
                    className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ACCENT_CLASSES.secondary}`}
                    to={`/edit/${encodeURIComponent(post.id)}`}
                  >
                    Edit post
                  </Link>
                  <button
                    aria-label={`Delete ${post.title}`}
                    className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ACCENT_CLASSES.danger}`}
                    disabled={isDeleting}
                    onClick={handleDelete}
                    type="button"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete post'}
                  </button>
                </div>
              </footer>
            ) : null}
          </article>
        </div>
      </main>
    </div>
  );
}

ReadBlog.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};