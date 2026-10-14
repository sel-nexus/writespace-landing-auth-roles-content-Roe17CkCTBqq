# WriteSpace

WriteSpace is a responsive, browser-local blogging demonstration built with React and Vite. Visitors can discover the product, create local accounts, write and read posts, manage owned content, and use role-aware administration tools.

All application data remains in the current browser profile through `localStorage`. WriteSpace has no backend, database, remote authentication provider, or application-data API.

> **Demonstration only:** WriteSpace is not a production authentication or content-security system. Use fake information only. Never enter personal, sensitive, regulated, or business-critical information, and never reuse a real password.

## Demo Credentials

A permanent demonstration Admin account is compiled into the client:

- **Username:** `admin`
- **Password:** `admin`

These credentials are public demonstration constants, not secrets. The permanent Admin does not appear in `writespace_users` and cannot be deleted.

## Scope and Traceability

The project implements one release epic: **WriteSpace Browser-Local Blogging Demo**.

That epic contains exactly four user stories:

| Story | Scope | Primary implementation |
| --- | --- | --- |
| `SCRUM-2019` | Public Discovery and Local Account Access | Landing page, registration, login, session persistence, logout, public navigation, role-aware destinations |
| `SCRUM-2020` | Authenticated Blog Reading and Creation | Protected blog list, post reader, post editor, post creation, validation, excerpts, newest-first ordering |
| `SCRUM-2018` | Ownership-Based Content Management | Owner and Admin edit/delete controls, authorization rechecks, confirmation prompts, mutation failure handling |
| `SCRUM-2021` | Admin Dashboard and Local User Management | Admin statistics, recent-post management, account creation, role selection, account deletion protections |

### SCRUM-2019 — Public Discovery and Local Account Access

- Responsive public landing page
- Product feature overview and latest local post previews
- Browser-local registration and login
- Permanent Admin demonstration account
- Case-insensitive, trimmed username matching
- Duplicate and reserved username validation
- Role-aware navigation and login destinations
- Persistent browser-local session
- Verified logout
- Fake-information and password-reuse warnings

### SCRUM-2020 — Authenticated Blog Reading and Creation

- Protected blog list, reader, and editor routes
- Newest-first post ordering
- Post cards with excerpts, dates, and snapshotted author information
- Complete post reader with preserved whitespace
- Post creation with UUID identifiers and ISO timestamps
- Required-field validation and focus management
- Title and content length limits
- Empty, unavailable-storage, and post-not-found states

### SCRUM-2018 — Ownership-Based Content Management

- Edit and delete actions for post owners
- Admin access to manage every post
- Authorization checks when an action begins
- Fresh session and post authorization checks before persisted mutations
- Editing that preserves post ID, creation timestamp, and author snapshot
- Confirmation prompts before destructive actions
- Visible save and deletion failures without intentionally discarding content

### SCRUM-2021 — Admin Dashboard and Local User Management

- Role-protected Admin Dashboard
- Post, account, Admin, and user statistics
- Five newest posts with management actions
- Quick links to writing and user management
- Local user and Admin account creation
- Responsive account list with role and creation metadata
- Protection against deleting the permanent Admin
- Protection against deleting the currently signed-in account
- Account deletion that preserves previously authored posts

## Routes

React Router owns application routing in `src/App.jsx`.

| Route | Access | Behavior |
| --- | --- | --- |
| `/` | Public | Landing page, feature summary, local post previews, and browser-local warnings |
| `/login` | Guest | Login form and permanent Admin demo credentials |
| `/register` | Guest | Browser-local user registration |
| `/blogs` | Authenticated | Newest-first list of locally stored posts |
| `/blog/:id` | Authenticated | Complete post reader or post-not-found state |
| `/write` | Authenticated | Create a post |
| `/edit/:id` | Owner or Admin | Edit an existing post |
| `/admin` | Admin | Admin Dashboard |
| `/users` | Admin | Local account management |
| Any unmatched route | Public | Redirects to `/` |

Authenticated users who open `/login` or `/register` are redirected according to role:

- User: `/blogs`
- Admin: `/admin`

Guests opening protected routes are redirected to `/login`. Signed-in users without the Admin role are redirected from Admin routes to `/blogs`.

## Authorization Model

Authorization is implemented entirely in browser-side JavaScript:

- Users may edit and delete posts whose `authorId` matches their session `userId`.
- Admins may edit and delete any post.
- Only Admins may access `/admin` and `/users`.
- Protected mutations re-read the current session and stored data before writing.
- The permanent Admin and currently signed-in account cannot be deleted.

These controls demonstrate product behavior but do not provide a server-enforced security boundary. Anyone with access to the browser can inspect or modify client code and browser storage.

## Technology Stack

- JavaScript using ES modules
- React 18
- React DOM 18
- React Router DOM 6
- Vite 5
- Tailwind CSS 3
- PostCSS and Autoprefixer
- PropTypes
- Vitest
- jsdom
- React Testing Library
- `@testing-library/user-event`
- Vercel static hosting configuration
- GitHub Actions CI
- Node.js 20

No environment variables or secrets are required.

## Prerequisites

Install the following:

- Node.js 20
- npm with lockfile support
- A modern browser with:
  - JavaScript enabled
  - `localStorage`
  - `crypto.randomUUID()`

## Installation

Clone the repository and install the locked dependencies:

```sh
git clone <repository-url>
cd writespace-local-blog
npm ci
```

The included `.env.example` is intentionally empty. Do not add API keys, authentication secrets, database credentials, or private values.

## Development

Start the Vite development server:

```sh
npm run dev
```

Open the URL printed by Vite.

Development mode is intended for local implementation work. Use a production build and preview for release validation.

## Tests

Run the test suite in watch mode:

```sh
npm test
```

Run the complete suite once:

```sh
npm test -- --run
```

Tests cover:

- Public, protected, role-based, direct, and fallback routing
- Registration, login, session persistence, and logout
- Permanent Admin authentication
- Post creation, reading, editing, and deletion
- Ownership and Admin authorization behavior
- Admin statistics and account management
- Storage validation and canonical persistence
- Corrupt data and unavailable storage
- Failed writes, verification failures, and failed removals
- Formatting, sorting, excerpts, navigation, and keyboard behavior
- Accessible labels, errors, status messages, and focus management

Tests use jsdom and browser API mocks. They do not make real application-data network requests.

## Production Build

Create the production bundle:

```sh
npm run build
```

Vite writes the generated static site to:

```text
dist/
```

Do not deploy `src/` as the site root.

## Production Preview

Build and serve the generated output locally:

```sh
npm run build
npm run preview
```

The preview URL is normally:

```text
http://localhost:4173
```

To expose the preview to another device on the same trusted network:

```sh
npm run preview -- --host
```

`npm run preview` is a local validation tool and must not be used as a production server.

## Continuous Integration

The GitHub Actions workflow runs on pull requests and pushes to `main` using Node.js 20.

The required quality sequence is:

```sh
npm ci
npm test -- --run
npm run build
```

A deployment candidate must not be promoted if tests or the production build fail.

## Browser-Local Storage

WriteSpace uses exactly three application storage keys:

| Key | Value |
| --- | --- |
| `writespace_posts` | JSON array of canonical post records |
| `writespace_users` | JSON array of canonical local account records |
| `writespace_session` | Canonical session record or no stored value |

Stored data is scoped to the current browser origin and profile. Preview deployments, production deployments, different domains, browsers, devices, and profiles have separate data.

### Post Schema

`writespace_posts` contains an array of records shaped as follows:

```json
{
  "id": "generated-uuid",
  "title": "Post title",
  "content": "Complete post content",
  "createdAt": "2026-10-14T12:00:00.000Z",
  "authorId": "local-account-id",
  "authorName": "Snapshotted display name"
}
```

Validation rules include:

- Non-blank ID
- Non-blank title with a maximum length of 100 characters
- Non-blank content with a maximum length of 50,000 characters
- Parseable creation timestamp
- Non-blank author ID and author name

The author name is snapshotted when the post is created. Deleting an account therefore does not remove or rewrite that account's existing posts.

### User Schema

`writespace_users` contains an array of records shaped as follows:

```json
{
  "id": "generated-uuid",
  "displayName": "Demo User",
  "username": "demo_user",
  "password": "plain-text-demo-password",
  "role": "user",
  "createdAt": "2026-10-14T12:00:00.000Z"
}
```

The `role` value is either `user` or `admin`.

Validation rules include:

- Non-blank ID
- Trimmed display name with a maximum length of 100 characters
- Trimmed username with a maximum length of 50 characters
- Case-insensitive username uniqueness
- Reserved `admin` username protection
- Non-blank password with a maximum length of 200 characters
- Valid role
- Parseable creation timestamp

Passwords are deliberately stored as plain text for this browser-local demonstration. Do not use a real or reused password.

The permanent Admin is a compiled application constant and is not stored in `writespace_users`.

### Session Schema

`writespace_session` contains a record shaped as follows:

```json
{
  "userId": "local-account-id",
  "username": "demo_user",
  "displayName": "Demo User",
  "role": "user"
}
```

Logging out removes this key and verifies its removal.

### Storage Safety

Persisted posts, users, and sessions are validated before use. Writes are:

1. Validated
2. Converted to canonical records
3. Serialized
4. Written to `localStorage`
5. Read back for verification

Unknown fields are omitted from canonical output. Corrupt or incompatible values produce safe fallback states and non-sensitive diagnostics.

If `localStorage` is blocked, unavailable, over quota, or cannot verify a write, WriteSpace reports a visible error. If `crypto.randomUUID()` is unavailable, account and post creation report an unsupported-browser error.

## Reset Local Data

Resetting storage permanently removes local accounts, the active session, and posts for the current origin.

### Browser Settings

Use the browser's site-data or storage settings to clear data for the current WriteSpace origin.

### Developer Tools

Open Developer Tools on the WriteSpace origin and run:

```js
localStorage.removeItem('writespace_posts');
localStorage.removeItem('writespace_users');
localStorage.removeItem('writespace_session');
location.reload();
```

To clear all `localStorage` values for the current origin instead:

```js
localStorage.clear();
location.reload();
```

Only use `localStorage.clear()` when removing unrelated values from the same origin is acceptable. Cleared browser-local data cannot be recovered by WriteSpace.

The permanent Admin account remains available after a reset because it is compiled into the application.

## Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Avatar.jsx
│   │   ├── BlogCard.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── PublicNavbar.jsx
│   │   ├── StatCard.jsx
│   │   ├── StorageNotice.jsx
│   │   └── UserRow.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Home.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ReadBlog.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── UserManagement.jsx
│   │   └── WriteBlog.jsx
│   ├── test/
│   │   └── setup.js
│   ├── utils/
│   │   ├── auth.js
│   │   ├── formatters.js
│   │   └── storage.js
│   ├── App.jsx
│   ├── constants.js
│   ├── index.css
│   └── main.jsx
├── .env.example
├── CHANGELOG.md
├── DEPLOYMENT.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
└── vitest.config.js
```

Test files are colocated with the modules and flows they verify.

## Accessibility

WriteSpace includes:

- Semantic headings, landmarks, navigation, articles, forms, labels, and time elements
- Keyboard-operable navigation, account menus, forms, and management controls
- Escape-key menu dismissal with focus restoration
- Visible focus indicators
- Minimum interactive target sizing
- Accessible avatar, menu, post-action, and account-action names
- `aria-current` for active navigation
- `aria-expanded` and `aria-controls` for menus
- `aria-invalid` and `aria-describedby` for form errors
- Status and alert announcements
- Focus movement to the first invalid field
- Text-accessible Admin and user role distinctions
- Responsive mobile and desktop layouts

Automated checks supplement, but do not replace, keyboard testing and assistive-technology review.

## Performance

Performance validation must use a production build rather than the Vite development server.

Recommended repeatable validation includes:

- Lighthouse Navigation mode
- Mobile device profile
- Performance, Accessibility, Best Practices, and SEO categories
- Three runs per representative route
- Median score comparison under equivalent browser, fixture, and throttling conditions

Recommended release targets are:

- Lighthouse Performance: 90 or higher
- Lighthouse Accessibility: 90 or higher
- Lighthouse Best Practices: 90 or higher
- Lighthouse SEO: 90 or higher
- Largest Contentful Paint: 2.5 seconds or less
- Cumulative Layout Shift: 0.1 or less
- Total Blocking Time: 200 milliseconds or less

Representative checks should include the landing page, authentication pages, empty and populated blog lists, a long reader page, the editor, the Admin Dashboard, and User Management with representative accounts.

See the complete protocol in [DEPLOYMENT.md](./DEPLOYMENT.md#performance-validation-protocol).

## Vercel Deployment

WriteSpace is deployed as a static Vite application. The repository's `vercel.json` provides a catch-all rewrite to `/index.html` so React Router can handle direct requests and nested-route refreshes.

The rewrite is not a redirect and must not replace the visible URL with `/index.html`.

Vercel configuration:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none
- Functions, APIs, and middleware: none

For setup, direct-route smoke checks, release gates, rollback, performance validation, and operational guidance, see the [WriteSpace Deployment and Operations Guide](./DEPLOYMENT.md).

## Limitations

WriteSpace intentionally has the following limitations:

- Data exists only in the current browser origin and profile.
- Data does not synchronize across browsers, profiles, devices, domains, or deployments.
- Preview and production domains have separate storage.
- Clearing site data can permanently remove all local accounts, sessions, and posts.
- Private browsing data may disappear when the private session ends.
- Browser policy, privacy settings, or quota limits may block persistence.
- Passwords are stored in plain text.
- The permanent Admin credentials are public.
- Authentication, roles, ownership, and authorization execute entirely in client code.
- There is no server-enforced authorization.
- There is no backend, database, remote persistence, or centralized account store.
- There is no centralized backup, recovery, migration, or deletion capability.
- There is no password reset or account recovery.
- There is no server-side audit log.
- There is no confidentiality guarantee against someone with browser access.
- A static application rollback does not roll back or restore browser storage.
- The application does not provide durable storage or disaster recovery.
- `crypto.randomUUID()` is required to create accounts and posts.
- Account deletion intentionally preserves previously authored posts.

Do not use WriteSpace for real identities, personal information, sensitive content, regulated data, production authentication, or business-critical writing.

## License

WriteSpace is private and proprietary software.

Copyright © 2026. All rights reserved.

No permission is granted to use, copy, modify, distribute, sublicense, publish, or create derivative works from this software except under an explicit written agreement with the copyright holder.