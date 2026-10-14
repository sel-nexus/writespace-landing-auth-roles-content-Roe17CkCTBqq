import PropTypes from 'prop-types';
import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import Navbar from '../components/Navbar';
import StorageNotice from '../components/StorageNotice';
import {
  ACCENT_CLASSES,
  MESSAGES,
  ROLES,
  ROUTES,
} from '../constants';
import { canManagePost, getSession } from '../utils/auth';
import {
  getPosts,
  savePosts,
  STORAGE_STATUS_CODES,
} from '../utils/storage';

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 50000;

export default function WriteBlog({ session, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const titleErrorId = useId();
  const contentErrorId = useId();
  const contentCounterId = useId();
  const formErrorId = useId();
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const submissionPendingRef = useRef(false);
  const isEditing = typeof id === 'string';
  const [loadState, setLoadState] = useState('loading');
  const [diagnostic, setDiagnostic] = useState(null);
  const [fields, setFields] = useState({
    title: '',
    content: '',
  });
  const [errors, setErrors] = useState({
    title: '',
    content: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const postsResult = getPosts();

    setDiagnostic(postsResult.diagnostic);

    if (!isEditing) {
      setLoadState('ready');
      return;
    }

    if (postsResult.degraded) {
      setLoadState('unavailable');
      return;
    }

    const matchingPost =
      postsResult.value.find((post) => post.id === id) ?? null;

    if (matchingPost === null) {
      setLoadState('notFound');
      return;
    }

    if (!canManagePost(session, matchingPost)) {
      navigate(ROUTES.blogs, { replace: true });
      return;
    }

    setFields({
      title: matchingPost.title,
      content: matchingPost.content,
    });
    setLoadState('ready');
  }, [id, isEditing, navigate, session]);

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

    if (submissionPendingRef.current) {
      return;
    }

    const nextErrors = {
      title:
        fields.title.trim().length === 0
          ? MESSAGES.titleRequired
          : '',
      content:
        fields.content.trim().length === 0
          ? MESSAGES.contentRequired
          : '',
    };

    setErrors(nextErrors);
    setFormError('');

    if (nextErrors.title) {
      titleRef.current?.focus();
      return;
    }

    if (nextErrors.content) {
      contentRef.current?.focus();
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

      const postsResult = getPosts();

      if (postsResult.degraded) {
        setDiagnostic(postsResult.diagnostic);
        setFormError(
          postsResult.diagnostic?.message ??
            MESSAGES.storageUnavailable,
        );
        return;
      }

      let savedPost;
      let nextPosts;

      if (isEditing) {
        const existingPost =
          postsResult.value.find((post) => post.id === id) ?? null;

        if (existingPost === null) {
          setLoadState('notFound');
          return;
        }

        if (!canManagePost(sessionResult.value, existingPost)) {
          navigate(ROUTES.blogs, { replace: true });
          return;
        }

        savedPost = {
          ...existingPost,
          title: fields.title.trim(),
          content: fields.content,
        };
        nextPosts = postsResult.value.map((post) =>
          post.id === existingPost.id ? savedPost : post,
        );
      } else {
        const randomUUID = globalThis.crypto?.randomUUID;

        if (typeof randomUUID !== 'function') {
          setFormError(MESSAGES.unsupportedBrowser);
          return;
        }

        savedPost = {
          id: randomUUID.call(globalThis.crypto),
          title: fields.title.trim(),
          content: fields.content,
          createdAt: new Date().toISOString(),
          authorId: sessionResult.value.userId,
          authorName: sessionResult.value.displayName,
        };
        nextPosts = [...postsResult.value, savedPost];
      }

      const saveResult = await Promise.resolve(
        savePosts(nextPosts),
      );

      if (!saveResult.ok) {
        setFormError(saveResult.message);
        return;
      }

      navigate(
        `/blog/${encodeURIComponent(savedPost.id)}`,
        { replace: true },
      );
    } catch {
      setFormError(MESSAGES.storageUnavailable);
    } finally {
      submissionPendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar onLogout={onLogout} session={session} />

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm font-medium text-slate-600" role="status">
            {isEditing ? 'Loading post…' : 'Loading editor…'}
          </p>
        </main>
      </div>
    );
  }

  if (loadState === 'notFound') {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar onLogout={onLogout} session={session} />

        <main className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
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

  if (loadState === 'unavailable') {
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
                Post editor unavailable
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                The post cannot be safely edited until browser-local
                data is available and valid.
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

  const cancelRoute = isEditing
    ? `/blog/${encodeURIComponent(id)}`
    : ROUTES.blogs;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onLogout={onLogout} session={session} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
              {isEditing ? 'Manage your writing' : 'Create something new'}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {isEditing ? 'Edit Post' : 'Write a Post'}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {isEditing
                ? 'Update this post and save your changes in this browser.'
                : 'Share a new post in your browser-local writing space.'}
            </p>
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

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <form noValidate onSubmit={handleSubmit}>
              <div>
                <label
                  className="block text-sm font-semibold text-slate-800"
                  htmlFor="post-title"
                >
                  Title
                </label>
                <input
                  aria-describedby={
                    errors.title ? titleErrorId : undefined
                  }
                  aria-invalid={errors.title ? 'true' : undefined}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  disabled={isSubmitting}
                  id="post-title"
                  maxLength={TITLE_MAX_LENGTH}
                  name="title"
                  onChange={handleChange}
                  placeholder="Give your post a title"
                  ref={titleRef}
                  type="text"
                  value={fields.title}
                />
                {errors.title ? (
                  <p
                    className="mt-2 text-sm text-red-700"
                    id={titleErrorId}
                  >
                    {errors.title}
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <label
                    className="block text-sm font-semibold text-slate-800"
                    htmlFor="post-content"
                  >
                    Content
                  </label>
                  <p
                    className="text-xs text-slate-500"
                    id={contentCounterId}
                  >
                    {fields.content.length.toLocaleString('en-US')} /{' '}
                    {CONTENT_MAX_LENGTH.toLocaleString('en-US')} characters
                  </p>
                </div>
                <textarea
                  aria-describedby={
                    errors.content
                      ? `${contentCounterId} ${contentErrorId}`
                      : contentCounterId
                  }
                  aria-invalid={errors.content ? 'true' : undefined}
                  className="mt-2 min-h-64 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-base leading-7 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  disabled={isSubmitting}
                  id="post-content"
                  maxLength={CONTENT_MAX_LENGTH}
                  name="content"
                  onChange={handleChange}
                  placeholder="Write your post…"
                  ref={contentRef}
                  value={fields.content}
                />
                {errors.content ? (
                  <p
                    className="mt-2 text-sm text-red-700"
                    id={contentErrorId}
                  >
                    {errors.content}
                  </p>
                ) : null}
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

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                  to={cancelRoute}
                >
                  Cancel
                </Link>
                <button
                  aria-describedby={
                    formError ? formErrorId : undefined
                  }
                  className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ACCENT_CLASSES.primary}`}
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? 'Saving…'
                    : isEditing
                      ? 'Save Changes'
                      : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

WriteBlog.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};