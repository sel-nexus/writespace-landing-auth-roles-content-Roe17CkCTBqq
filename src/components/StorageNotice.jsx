import PropTypes from 'prop-types';
import { ACCENT_CLASSES, MESSAGES } from '../constants';
import { STORAGE_STATUS_CODES } from '../utils/storage';

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 8.25v4.5m0 3h.008M10.06 4.69 2.82 17.25A1.5 1.5 0 0 0 4.12 19.5h15.76a1.5 1.5 0 0 0 1.3-2.25L13.94 4.69a1.5 1.5 0 0 0-2.6 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function StorageNotice({ diagnostic = null }) {
  if (
    diagnostic?.code !== STORAGE_STATUS_CODES.storageUnavailable
  ) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
      role="status"
    >
      <WarningIcon />
      <div>
        <p className="font-semibold">Local storage unavailable</p>
        <p className="mt-1">{MESSAGES.storageUnavailable}</p>
      </div>
    </div>
  );
}

StorageNotice.propTypes = {
  diagnostic: PropTypes.shape({
    code: PropTypes.string,
    message: PropTypes.string,
  }),
};

export default StorageNotice;