import PropTypes from 'prop-types';
import { ROLES } from '../constants';

const AVATAR_CONFIG = Object.freeze({
  [ROLES.ADMIN]: Object.freeze({
    label: 'Admin avatar',
    containerClasses: 'bg-violet-100 text-violet-700 ring-violet-600/20',
    icon: 'crown',
  }),
  [ROLES.USER]: Object.freeze({
    label: 'User avatar',
    containerClasses: 'bg-indigo-100 text-indigo-700 ring-indigo-600/20',
    icon: 'book',
  }),
});

function CrownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
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

function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3H12v16.5H6.75a2.25 2.25 0 0 0-2.25 2.25V5.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M19.5 5.25A2.25 2.25 0 0 0 17.25 3H12v16.5h5.25a2.25 2.25 0 0 1 2.25 2.25V5.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function Avatar({ role, labelled = false, label }) {
  const normalizedRole =
    role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;
  const config = AVATAR_CONFIG[normalizedRole];
  const accessibleLabel =
    typeof label === 'string' && label.trim().length > 0
      ? label.trim()
      : config.label;
  const accessibilityProps = labelled
    ? {
        role: 'img',
        'aria-label': accessibleLabel,
      }
    : {
        'aria-hidden': 'true',
      };

  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${config.containerClasses}`}
      {...accessibilityProps}
    >
      {config.icon === 'crown' ? <CrownIcon /> : <BookIcon />}
    </span>
  );
}

Avatar.propTypes = {
  role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  labelled: PropTypes.bool,
  label: PropTypes.string,
};

/**
 * Creates a role-distinct avatar element.
 *
 * @param {'admin'|'user'} role
 * @param {{labelled?: boolean, label?: string}} [options]
 * @returns {JSX.Element}
 */
export function getAvatar(role, options = {}) {
  const safeOptions =
    options !== null && typeof options === 'object' ? options : {};

  return (
    <Avatar
      label={safeOptions.label}
      labelled={safeOptions.labelled === true}
      role={role}
    />
  );
}

export default Avatar;