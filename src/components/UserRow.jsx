import PropTypes from 'prop-types';
import { useId } from 'react';
import {
  ACCENT_CLASSES,
  DEFAULT_ADMIN,
  ROLES,
} from '../constants';
import { formatDate } from '../utils/formatters';
import Avatar from './Avatar';

export default function UserRow({
  user,
  session = null,
  currentUserId = null,
  onDelete,
  isDeleting = false,
}) {
  const deletionReasonId = useId();
  const userId = user.id ?? user.userId ?? '';
  const activeUserId = session?.userId ?? currentUserId;
  const isPermanentAdmin = userId === DEFAULT_ADMIN.userId;
  const isCurrentUser =
    typeof activeUserId === 'string' &&
    activeUserId.length > 0 &&
    userId === activeUserId;
  const deletionReason = isPermanentAdmin
    ? 'The permanent Admin account cannot be deleted.'
    : isCurrentUser
      ? 'You cannot delete your own account.'
      : '';
  const deletionDisabled =
    isPermanentAdmin || isCurrentUser || isDeleting;
  const isAdmin = user.role === ROLES.ADMIN;
  const createdAtIsValid =
    typeof user.createdAt === 'string' &&
    Number.isFinite(Date.parse(user.createdAt));

  function handleDelete() {
    if (deletionDisabled) {
      return;
    }

    onDelete(user);
  }

  return (
    <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.4fr)] md:items-center md:gap-6 md:rounded-none md:border-x-0 md:border-b-0 md:p-4 md:shadow-none">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar role={isAdmin ? ROLES.ADMIN : ROLES.USER} />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:sr-only">
            Account
          </p>
          <p className="truncate font-semibold text-slate-900">
            {user.displayName}
          </p>
          <p className="truncate text-sm text-slate-500">
            @{user.username}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:sr-only">
          Role
        </p>
        <span
          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset md:mt-0 ${
            isAdmin
              ? ACCENT_CLASSES.admin
              : ACCENT_CLASSES.user
          }`}
        >
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:sr-only">
          Created
        </p>
        <p className="mt-1 text-sm text-slate-600 md:mt-0">
          {createdAtIsValid ? (
            <time dateTime={user.createdAt}>
              {formatDate(user.createdAt)}
            </time>
          ) : (
            formatDate(user.createdAt)
          )}
        </p>
      </div>

      <div className="flex flex-col items-start md:items-end">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:sr-only">
          Actions
        </p>
        <button
          aria-describedby={
            deletionReason ? deletionReasonId : undefined
          }
          aria-label={`Delete ${user.displayName}`}
          className={`mt-1 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 md:mt-0 ${ACCENT_CLASSES.danger}`}
          disabled={deletionDisabled}
          onClick={handleDelete}
          type="button"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
        {deletionReason ? (
          <p
            className="mt-2 max-w-xs text-sm leading-5 text-slate-500 md:text-right"
            id={deletionReasonId}
          >
            {deletionReason}
          </p>
        ) : null}
      </div>
    </article>
  );
}

UserRow.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    userId: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
    createdAt: PropTypes.string,
  }).isRequired,
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
  currentUserId: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
};