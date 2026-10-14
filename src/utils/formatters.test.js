import {
  CARD_ACCENT_CLASSES,
  INVALID_DATE_LABEL,
  createExcerpt,
  formatDate,
  getAccentClass,
  getExcerpt,
  sortPostsNewestFirst,
} from './formatters';

describe('formatDate', () => {
  it('formats valid dates using the exact long en-US date shape', () => {
    const date = new Date(2026, 9, 14, 12, 0, 0);

    expect(formatDate(date)).toBe('October 14, 2026');
  });

  it('returns the invalid-date fallback for unsupported or invalid values', () => {
    expect(formatDate('not-a-date')).toBe(INVALID_DATE_LABEL);
    expect(formatDate(null)).toBe(INVALID_DATE_LABEL);
    expect(formatDate(Number.NaN)).toBe(INVALID_DATE_LABEL);
  });
});

describe('sortPostsNewestFirst', () => {
  it('sorts posts newest first without mutating the source array', () => {
    const oldestPost = {
      id: 'oldest',
      createdAt: '2026-01-01T12:00:00.000Z',
    };
    const newestPost = {
      id: 'newest',
      createdAt: '2026-10-14T12:00:00.000Z',
    };
    const middlePost = {
      id: 'middle',
      createdAt: '2026-06-01T12:00:00.000Z',
    };
    const posts = [oldestPost, newestPost, middlePost];
    const originalOrder = posts.slice();

    const sortedPosts = sortPostsNewestFirst(posts);

    expect(sortedPosts).toEqual([newestPost, middlePost, oldestPost]);
    expect(sortedPosts).not.toBe(posts);
    expect(posts).toEqual(originalOrder);
  });

  it('places invalid dates last and uses ids to order equal dates', () => {
    const posts = [
      { id: 'z-invalid', createdAt: 'invalid' },
      { id: 'b', createdAt: '2026-10-14T12:00:00.000Z' },
      { id: 'a', createdAt: '2026-10-14T12:00:00.000Z' },
      { id: 'a-invalid', createdAt: null },
    ];

    expect(sortPostsNewestFirst(posts).map((post) => post.id)).toEqual([
      'a',
      'b',
      'a-invalid',
      'z-invalid',
    ]);
    expect(sortPostsNewestFirst(null)).toEqual([]);
  });
});

describe('createExcerpt', () => {
  it('normalizes whitespace and truncates long content at a word boundary', () => {
    const content = '  The quick\n brown fox jumps over the lazy dog.  ';

    expect(createExcerpt(content, 20)).toBe('The quick brown…');
    expect(getExcerpt(content, 20)).toBe('The quick brown…');
  });

  it('returns complete short content and safely handles invalid inputs', () => {
    expect(createExcerpt('  A short\n\nexcerpt.  ', 50)).toBe(
      'A short excerpt.',
    );
    expect(createExcerpt(undefined)).toBe('');
    expect(createExcerpt('')).toBe('');
  });
});

describe('getAccentClass', () => {
  it('cycles through all four accent colors for numeric card indexes', () => {
    expect(CARD_ACCENT_CLASSES).toHaveLength(4);

    const accents = Array.from({ length: 8 }, (_, index) =>
      getAccentClass(index),
    );

    expect(accents).toEqual([
      'border-sky-500',
      'border-violet-500',
      'border-emerald-500',
      'border-amber-500',
      'border-sky-500',
      'border-violet-500',
      'border-emerald-500',
      'border-amber-500',
    ]);
  });

  it('wraps negative indexes and returns a stable accent for string keys', () => {
    expect(getAccentClass(-1)).toBe('border-amber-500');
    expect(getAccentClass('post-id')).toBe(getAccentClass('post-id'));
    expect(CARD_ACCENT_CLASSES).toContain(getAccentClass('post-id'));
  });
});