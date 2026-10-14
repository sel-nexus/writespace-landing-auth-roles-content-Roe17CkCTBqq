export const STORAGE_KEYS = Object.freeze({
  posts: 'writespace_posts',
  users: 'writespace_users',
  session: 'writespace_session',
});

export const ROLES = Object.freeze({
  admin: 'admin',
  user: 'user',
  ADMIN: 'admin',
  USER: 'user',
});

export const ROLE_VALUES = Object.freeze(['admin', 'user']);

export const DEFAULT_ADMIN = Object.freeze({
  userId: 'admin',
  username: 'admin',
  displayName: 'Admin',
  role: ROLES.ADMIN,
});

export const ADMIN_IDENTITY = DEFAULT_ADMIN;

export const ADMIN_CREDENTIALS = Object.freeze({
  username: 'admin',
  password: 'admin',
});

export const ROUTES = Object.freeze({
  landing: '/',
  login: '/login',
  register: '/register',
  blogs: '/blogs',
  blog: '/blog/:id',
  write: '/write',
  edit: '/edit/:id',
  admin: '/admin',
  users: '/users',
  LANDING: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BLOGS: '/blogs',
  BLOG: '/blog/:id',
  WRITE: '/write',
  EDIT: '/edit/:id',
  ADMIN: '/admin',
  USERS: '/users',
});

export const MESSAGES = Object.freeze({
  invalidCredentials: 'Invalid username or password.',
  usernameInUse: 'Username is already in use.',
  passwordsDoNotMatch: 'Passwords do not match.',
  displayNameRequired: 'Display name is required.',
  usernameRequired: 'Username is required.',
  passwordRequired: 'Password is required.',
  roleRequired: 'Role is required.',
  titleRequired: 'Title is required.',
  contentRequired: 'Content is required.',
  postNotFound: 'Post not found',
  deletePostConfirmation: 'Delete this post? This cannot be undone.',
  deleteUserConfirmation: 'Delete this account? This cannot be undone.',
  storageUnavailable: 'Browser-local persistence is unavailable.',
  invalidStoredData: 'Stored data is invalid.',
  validationFailed: 'Data could not be saved.',
  writeFailed: 'Browser-local save could not be verified.',
  registrationPartialSuccess:
    'Account was created, but the session could not be saved. Please log in.',
  unsupportedBrowser:
    'This browser cannot create unique identifiers. Please use a supported browser.',
  fakeInformationWarning: 'Use fake information only. Do not enter personal information.',
  passwordWarning:
    'Passwords are stored in plain text in this browser for demo purposes. Do not reuse a real password.',
  localSecurityWarning:
    'Local role checks and browser storage are for demonstration only and do not provide production security.',
});

export const ACCENT_CLASSES = Object.freeze({
  primary:
    'bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-600',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  admin:
    'bg-violet-100 text-violet-700 ring-violet-600/20',
  user:
    'bg-sky-100 text-sky-700 ring-sky-600/20',
  info:
    'border-sky-200 bg-sky-50 text-sky-800',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900',
  error:
    'border-red-200 bg-red-50 text-red-800',
});

export const STORY_LABELS = Object.freeze({
  'SCRUM-2019': 'Public Discovery and Local Account Access',
  'SCRUM-2020': 'Authenticated Blog Reading and Creation',
  'SCRUM-2018': 'Ownership-Based Content Management',
  'SCRUM-2021': 'Admin Dashboard and Local User Management',
});

export const EPIC_STORY_LABELS = STORY_LABELS;

export const STORIES = Object.freeze([
  Object.freeze({
    key: 'SCRUM-2019',
    label: STORY_LABELS['SCRUM-2019'],
  }),
  Object.freeze({
    key: 'SCRUM-2020',
    label: STORY_LABELS['SCRUM-2020'],
  }),
  Object.freeze({
    key: 'SCRUM-2018',
    label: STORY_LABELS['SCRUM-2018'],
  }),
  Object.freeze({
    key: 'SCRUM-2021',
    label: STORY_LABELS['SCRUM-2021'],
  }),
]);