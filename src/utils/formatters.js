export const INVALID_DATE_LABEL = 'Unknown date';

export const CARD_ACCENT_CLASSES = Object.freeze([
  'border-sky-500',
  'border-violet-500',
  'border-emerald-500',
  'border-amber-500',
]);

const DEFAULT_EXCERPT_LENGTH = 160;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * Converts a date-like value to a finite timestamp.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
function getTimestamp(value) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return null;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * Formats a date for presentation without throwing for invalid input.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatDate(value) {
  const timestamp = getTimestamp(value);

  if (timestamp === null) {
    return INVALID_DATE_LABEL;
  }

  try {
    return dateFormatter.format(new Date(timestamp));
  } catch {
    return INVALID_DATE_LABEL;
  }
}

/**
 * Returns a new posts array sorted newest first. Invalid dates are placed last,
 * and equal dates are ordered by id for deterministic rendering.
 *
 * @template {{ createdAt?: unknown, id?: unknown }} T
 * @param {T[]|unknown} posts
 * @returns {T[]}
 */
export function sortPostsNewestFirst(posts) {
  if (!Array.isArray(posts)) {
    return [];
  }

  return posts.slice().sort((firstPost, secondPost) => {
    const firstTimestamp = getTimestamp(firstPost?.createdAt);
    const secondTimestamp = getTimestamp(secondPost?.createdAt);

    if (firstTimestamp !== null && secondTimestamp !== null) {
      const timestampDifference = secondTimestamp - firstTimestamp;

      if (timestampDifference !== 0) {
        return timestampDifference;
      }
    } else if (firstTimestamp !== null) {
      return -1;
    } else if (secondTimestamp !== null) {
      return 1;
    }

    const firstId =
      typeof firstPost?.id === 'string' ? firstPost.id : '';
    const secondId =
      typeof secondPost?.id === 'string' ? secondPost.id : '';

    return firstId.localeCompare(secondId);
  });
}

/**
 * Creates a compact plain-text excerpt from post content.
 *
 * @param {unknown} content
 * @param {number} [maxLength=160]
 * @returns {string}
 */
export function createExcerpt(
  content,
  maxLength = DEFAULT_EXCERPT_LENGTH,
) {
  if (typeof content !== 'string') {
    return '';
  }

  const normalizedContent = content.replace(/\s+/gu, ' ').trim();
  const safeMaximum =
    Number.isInteger(maxLength) && maxLength > 0
      ? maxLength
      : DEFAULT_EXCERPT_LENGTH;
  const characters = Array.from(normalizedContent);

  if (characters.length <= safeMaximum) {
    return normalizedContent;
  }

  const truncated = characters.slice(0, safeMaximum).join('').trimEnd();
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  const minimumWordBoundary = Math.floor(safeMaximum * 0.6);
  const excerpt =
    lastSpaceIndex >= minimumWordBoundary
      ? truncated.slice(0, lastSpaceIndex)
      : truncated;

  return `${excerpt}…`;
}

/**
 * Alias for createExcerpt using presentation-domain terminology.
 *
 * @param {unknown} content
 * @param {number} [maxLength=160]
 * @returns {string}
 */
export function getExcerpt(content, maxLength = DEFAULT_EXCERPT_LENGTH) {
  return createExcerpt(content, maxLength);
}

/**
 * Selects a card accent class from a stable numeric index or string key.
 *
 * @param {number|string} value
 * @returns {string}
 */
export function getAccentClass(value = 0) {
  let index = 0;

  if (typeof value === 'number' && Number.isFinite(value)) {
    index = Math.trunc(value);
  } else if (typeof value === 'string') {
    index = Array.from(value).reduce(
      (hash, character) => (hash * 31 + character.codePointAt(0)) | 0,
      0,
    );
  }

  const normalizedIndex =
    ((index % CARD_ACCENT_CLASSES.length) + CARD_ACCENT_CLASSES.length) %
    CARD_ACCENT_CLASSES.length;

  return CARD_ACCENT_CLASSES[normalizedIndex];
}