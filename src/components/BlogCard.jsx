import PropTypes from 'prop-types';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_ADMIN, ROLES } from '../constants';
import { canManagePost } from '../utils/auth';
import {
  createExcerpt,
  formatDate,
  getAccentClass,
} from '../utils/formatters';
import Avatar from './Avatar';

export default function BlogCard({
  post,
  index,
  session = null,
  onEdit = null,
}) {
  const titleId = useId();
  const canEdit = canManagePost(session, post);
  const authorIsAdmin =
    post.authorId === DEFAULT_ADMIN.userId ||
    (session?.userId === post.authorId &&
      session.role === ROLES.ADMIN);
  const authorRole = authorIsAdmin ? ROLES.ADMIN : ROLES.USER;
  const formattedDate = formatDate(post.createdAt);
  const excerpt = createExcerpt(post.content, 120);

  function handleEdit(event) {
    if (onEdit === null) {
      return;
    }

    const result = onEdit(post);

    if (result === false) {
      event.preventDefault();
    }
  }

  return (
    <article
      aria-labelledby={titleId}
      className={`flex h-full flex-col rounded-xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm ${getAccentClass(index)}`}
    >
      <div className="flex items-center gap-3">
        <Avatar
          label={`${post.authorName}, author`}
          labelled
          role={authorRole}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {post.authorName}
          </p>
          <p className="text-xs text-slate-500">
            <time dateTime={post.createdAt}>{formattedDate}</time>
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <h2
          className="text-xl font-bold leading-snug text-slate-900"
          id={titleId}
        >
          <Link
            className="rounded-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            to={`/blog/${encodeURIComponent(post.id)}`}
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {excerpt}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <Link
          aria-label={`Read ${post.title}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          to={`/blog/${encodeURIComponent(post.id)}`}
        >
          Read post
        </Link>

        {canEdit ? (
          <Link
            aria-label={`Edit ${post.title}`}
            className="ml-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            onClick={handleEdit}
            to={`/edit/${encodeURIComponent(post.id)}`}
          >
            Edit
          </Link>
        ) : null}
      </div>
    </article>
  );
}

BlogCard.propTypes = {
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
  onEdit: PropTypes.func,
};