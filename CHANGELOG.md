# Changelog

All notable changes to WriteSpace are documented in this file.

## [1.0.0] - 2026-10-14

Initial release of the browser-local WriteSpace blogging demonstration.

### Added

#### SCRUM-2019 — Public Discovery and Local Account Access

- Responsive public landing page with product features and previews of the latest browser-local posts.
- Browser-local account registration and login.
- Permanent demonstration Admin account:
  - Username: `admin`
  - Password: `admin`
- Role-aware navigation for users and Admins.
- Session persistence and logout using `localStorage`.
- Case-insensitive, trimmed username matching.
- Duplicate and reserved username validation.
- Clear notices requiring fake information and warning against password reuse.

#### SCRUM-2020 — Authenticated Blog Reading and Creation

- Protected blog list, reader, and editor routes.
- Post creation with generated identifiers, timestamps, and snapshotted author information.
- Newest-first post ordering, excerpts, author metadata, and empty states.
- Complete post reader with preserved whitespace.
- Required-field validation, character limits, accessible errors, and focus management.
- Post-not-found and unavailable-storage states.

#### SCRUM-2018 — Ownership-Based Content Management

- Edit and delete actions for post owners.
- Admin management access to every post.
- Authorization checks when protected actions begin and immediately before persisted mutations.
- Editing that preserves post identity, creation date, and author metadata.
- Confirmation prompts for destructive actions.
- Visible failure states that preserve content when browser-local writes cannot be completed or verified.

#### SCRUM-2021 — Admin Dashboard and Local User Management

- Role-protected Admin Dashboard with post and account statistics.
- Recent-post management and quick links to writing and account administration.
- User Management page for creating local user or Admin accounts.
- Responsive account list with role and creation metadata.
- Protection against deleting the permanent Admin or currently signed-in account.
- Account deletion that intentionally preserves previously authored posts.

### Accessibility

- Semantic headings, landmarks, articles, navigation, forms, labels, and time elements.
- Keyboard-accessible navigation, account menus, forms, and management controls.
- Escape-key menu dismissal with focus restoration.
- Visible focus indicators and minimum interactive target sizing.
- Accessible names for avatars, post actions, account actions, and menu triggers.
- `aria-current`, `aria-expanded`, `aria-invalid`, `aria-describedby`, status, and alert states.
- Role-distinct visual treatment with text-accessible labels.
- Responsive mobile and desktop navigation and account-management layouts.

### Storage Safety

- All accounts, sessions, roles, and posts are stored only in the current browser using:
  - `writespace_posts`
  - `writespace_users`
  - `writespace_session`
- Persisted posts, users, and sessions are validated before use.
- Writes are validated, canonicalized, serialized, persisted, and read back for verification.
- Unknown persisted fields are removed from canonical output.
- Corrupt or incompatible stored values produce safe fallback states and diagnostics.
- Storage access, quota, serialization, removal, and verification failures return non-sensitive errors.
- Mutations re-read current session and application data before authorization and persistence.
- Missing `crypto.randomUUID()` support produces an explicit unsupported-browser error.
- No application-data API, database, remote persistence, or external authentication service is used.

### Testing and Build

- Added Vitest and jsdom test configuration.
- Added React Testing Library and user-event coverage for:
  - Public, protected, role-based, direct, and fallback routing.
  - Registration, login, session, and logout behavior.
  - Post creation, reading, editing, deletion, and ownership restrictions.
  - Admin statistics and account management.
  - Storage validation, degraded reads, failed writes, and failed removals.
  - Formatting, sorting, excerpts, navigation, keyboard behavior, and accessibility states.
- Added GitHub Actions CI on pull requests and pushes to `main`.
- CI uses Node.js 20 and runs:
  - `npm ci`
  - `npm test -- --run`
  - `npm run build`
- Added Vite 5 production build and preview scripts.
- Added Tailwind CSS 3 and Autoprefixer configuration.

### Deployment

- Added static Vercel deployment configuration.
- Added a catch-all rewrite to `/index.html` for React Router direct-route support.
- Added deployment, smoke-check, rollback, performance-validation, and operational guidance.
- Production output is generated in `dist/`.
- No environment variables, secrets, backend functions, middleware, or APIs are required.

### Security Boundary

- WriteSpace 1.0.0 is an explicitly browser-local demonstration, not a production authentication or content-security system.
- Passwords are stored as plain text in the browser.
- The permanent Admin credentials are compiled demonstration constants and are not secrets.
- Roles, sessions, ownership checks, and authorization decisions execute entirely in client-side code and can be modified by anyone with browser access.
- Data is scoped to a browser origin and profile and does not synchronize across browsers, devices, profiles, preview deployments, or domains.
- Clearing site data can permanently remove all local accounts, sessions, and posts.
- The application provides no centralized backup, recovery, password reset, audit log, durable storage, confidentiality guarantee, or server-enforced authorization.
- Users must enter only fake information and must not store sensitive, personal, regulated, business-critical, or reused credential data.