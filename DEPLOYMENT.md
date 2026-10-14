# WriteSpace Deployment and Operations Guide

This guide covers deployment and operation of the WriteSpace browser-local React application for:

- SCRUM-2019 — Public Discovery and Local Account Access
- SCRUM-2020 — Authenticated Blog Reading and Creation
- SCRUM-2018 — Ownership-Based Content Management
- SCRUM-2021 — Admin Dashboard and Local User Management

## Runtime Architecture

WriteSpace is a static single-page application built with Vite and React.

The deployment consists only of:

- Static HTML
- Compiled JavaScript
- Compiled CSS
- Static assets

WriteSpace does not use:

- Environment variables or secrets
- Serverless or edge functions
- Backend APIs
- Databases
- Authentication providers
- Server-side rendering
- Application-data network requests

Accounts, sessions, posts, and role information are stored in the visitor's browser using `localStorage`.

The production storage keys are:

- `writespace_posts`
- `writespace_users`
- `writespace_session`

The browser still requests the deployed HTML, JavaScript, CSS, and static assets. The application does not send accounts, passwords, sessions, posts, or other application data to a server.

## Prerequisites

Use the following supported tooling:

- Node.js 20
- npm with lockfile support
- A modern browser with JavaScript, `localStorage`, and `crypto.randomUUID()`
- Git for source-controlled deployments
- A Vercel account for the documented hosted deployment

Run commands from the repository root.

## Clean Install, Test, and Build

Start from a clean dependency and build state:

```sh
rm -rf node_modules dist coverage
npm ci
npm test -- --run
npm run build
```

On Windows PowerShell, the equivalent cleanup is:

```powershell
Remove-Item -Recurse -Force node_modules, dist, coverage -ErrorAction SilentlyContinue
npm ci
npm test -- --run
npm run build
```

A successful production build is written to `dist/`.

Do not deploy `src/` as the site root. Deploy the generated `dist/` output.

## Local Development

Start the Vite development server:

```sh
npm run dev
```

Use the URL printed by Vite. Development mode is not a production validation substitute.

## Production Preview

Build and serve the production output locally:

```sh
npm run build
npm run preview
```

Use the URL printed by Vite, normally:

```text
http://localhost:4173
```

To make the preview available to another device on the same trusted network:

```sh
npm run preview -- --host
```

Do not expose the preview server as a production service. Vite preview is intended only for local verification.

## Required Local Smoke Checks

After starting the production preview, verify the following:

1. Open `/`.
2. Register a browser-local user with fake information.
3. Confirm successful navigation to `/blogs`.
4. Create a post at `/write`.
5. Confirm navigation to `/blog/<generated-post-id>`.
6. Edit the post at `/edit/<generated-post-id>`.
7. Confirm the post identity and author information remain unchanged.
8. Delete the post and confirm it is removed.
9. Log out and confirm protected routes redirect to `/login`.
10. Log in with the permanent Admin account:
    - Username: `admin`
    - Password: `admin`
11. Open `/admin`.
12. Open `/users`.
13. Create and delete a browser-local account.
14. Confirm the permanent Admin and currently signed-in account cannot be deleted.
15. Refresh each route and confirm it remains usable.

Use only fake information. Passwords are stored as plain text in the browser and must not be reused from a real account.

## Direct-Route Smoke Checks

Client-side navigation is not sufficient to verify SPA hosting. Each route must also be loaded directly by entering the complete URL in a new browser tab or refreshing the page.

Verify these direct requests against the deployed origin:

```text
/
 /login
 /register
 /blogs
 /write
 /admin
 /users
 /blog/<existing-post-id>
 /edit/<existing-post-id>
 /route-that-does-not-exist
```

Remove the leading spaces when constructing URLs. Example:

```text
https://example.vercel.app/login
https://example.vercel.app/blog/<existing-post-id>
```

Expected behavior:

| Route | Guest | User | Admin |
| --- | --- | --- | --- |
| `/` | Landing page | Landing page | Landing page |
| `/login` | Login page | Redirect to `/blogs` | Redirect to `/admin` |
| `/register` | Registration page | Redirect to `/blogs` | Redirect to `/admin` |
| `/blogs` | Redirect to `/login` | Blogs page | Blogs page |
| `/blog/<id>` | Redirect to `/login` | Reader or post-not-found state | Reader or post-not-found state |
| `/write` | Redirect to `/login` | Post editor | Post editor |
| `/edit/<id>` | Redirect to `/login` | Editor only for an owned post | Editor for any existing post |
| `/admin` | Redirect to `/login` | Redirect to `/blogs` | Admin Dashboard |
| `/users` | Redirect to `/login` | Redirect to `/blogs` | User Management |
| Unmatched route | Landing page | Landing page | Landing page |

An existing post ID must be created in the same browser profile before directly testing its reader and editor routes.

## SPA Rewrite Behavior

The repository contains this exact Vercel configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

The rule internally rewrites matching requests to `/index.html` while preserving the requested browser URL. React Router then evaluates the original pathname and renders or redirects to the appropriate client-side route.

This behavior is required for direct requests such as:

```text
/blogs
/blog/example-id
/edit/example-id
/admin
/users
```

The rewrite is not an HTTP redirect. The browser should not be redirected to `/index.html`, and `/index.html` should not replace the visible route.

The application-level wildcard route sends unknown client-side paths to `/`. Therefore, a direct request to an unknown route is first served the SPA shell and is then navigated to the landing page by React Router.

After deployment, verify that:

- Direct application routes return the SPA instead of a platform 404.
- The visible URL is not replaced with `/index.html`.
- Built JavaScript and CSS assets load successfully.
- `/favicon.svg` loads successfully.
- Refreshing a nested route does not produce an HTML response for a requested JavaScript or CSS asset.
- No redirect loop occurs.

Do not replace the rewrite with a redirect.

## Vercel Git Deployment

### Repository Setup

1. Push the repository, including `package-lock.json` and `vercel.json`, to the Git provider connected to Vercel.
2. Import the repository into Vercel.
3. Select the Vite framework preset if Vercel does not detect it automatically.
4. Keep the project root at the repository root.
5. Configure:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
6. Do not add environment variables.
7. Deploy.

Vercel should use `vercel.json` from the repository root. Do not recreate the catch-all behavior as a redirect in the dashboard.

### Git Deployment Flow

Recommended branch behavior:

- Pull requests create preview deployments only after repository CI succeeds.
- The `main` branch creates the production deployment.
- Production promotion must use a commit that passed the test and build gates.
- Preview deployments must receive the same direct-route smoke checks before production promotion.

A Vercel preview deployment has a different origin from production and therefore has a separate `localStorage` data set.

### Post-Deployment Verification

For every production deployment:

1. Record the deployed commit SHA and Vercel deployment URL.
2. Open the deployment in a clean browser profile.
3. Verify `/`, `/login`, and `/register`.
4. Verify direct loading of every protected route.
5. Register a temporary fake user.
6. Create, read, edit, and delete a temporary post.
7. Verify user ownership restrictions.
8. Log in as the permanent Admin.
9. Verify `/admin` and `/users`.
10. Verify Admin post management and local account management.
11. Refresh nested routes.
12. Inspect the browser console for uncaught errors.
13. Inspect the Network panel for failed static assets and unexpected application-data requests.
14. Clear the temporary browser-local data when validation is complete.

## CI/CD Gates

The repository CI workflow runs on:

- Pull requests
- Pushes to `main`

It uses Node.js 20 and performs these gates in order:

```sh
npm ci
npm test -- --run
npm run build
```

A deployment candidate must not be promoted when any gate fails.

Required branch protection should include the GitHub Actions check named:

```text
Test and build
```

The CI workflow has read-only repository content permissions and does not require secrets.

The current CI validates application tests and production compilation. It does not automatically perform hosted direct-route checks or browser performance audits. Those checks remain required deployment validation steps.

Do not bypass CI by:

- Deploying an untested local `dist/` directory
- Using `npm install` in place of `npm ci` in CI
- Ignoring a failed test
- Promoting a commit different from the tested commit
- disabling the production build command

## Environment and Secret Management

No environment variables are required.

The `.env.example` file intentionally contains no variables. Do not create production values for:

- API URLs
- Database URLs
- Authentication secrets
- Session secrets
- Encryption keys
- Admin credentials

The permanent Admin credentials are demonstration constants compiled into the client application. They are not secrets and must never be treated as production security.

Do not place private values in:

- `.env` files
- `VITE_*` variables
- Vercel project settings
- Client-side source files
- Build arguments

Any value included in a Vite client build can be inspected by visitors.

## Functions, APIs, and Network Policy

Do not configure or deploy:

- Vercel Functions
- Vercel Edge Functions
- API routes
- Middleware
- Database integrations
- External authentication services
- Analytics that capture post or account data
- Remote persistence
- Background jobs
- Webhooks for application content

No application API health check exists. Availability is validated by loading the static site and completing the browser smoke checks.

A network inspection of normal use should show only static deployment resources and any platform-level resources explicitly approved by the operator. Creating accounts, logging in, creating posts, editing posts, deleting posts, and managing users must not generate application-data API requests.

## Browser-Local Data Limitations

WriteSpace data belongs to a browser origin and profile, not to a Vercel deployment record or user identity.

Operational consequences:

- Data does not synchronize between browsers.
- Data does not synchronize between devices.
- Data does not synchronize between browser profiles.
- Preview and production domains have separate data.
- Changing the production domain creates a separate storage origin.
- Clearing site data permanently removes local accounts, sessions, and posts.
- Private browsing data may be removed when the private session ends.
- Browser policy, quota, or privacy settings may block persistence.
- Reinstalling or rolling back the static application does not restore browser data.
- Deleting a local account preserves posts already authored by that account.
- Passwords are stored in plain text in the browser.
- Client-side role and ownership checks do not provide production-grade security.
- The operator cannot centrally back up, inspect, recover, migrate, or delete visitor data.
- There is no server-side audit log.

Users must be told to use fake information and must not store sensitive, personal, regulated, or business-critical content.

Do not promise:

- Durable storage
- Disaster recovery
- Cross-device access
- Confidentiality against someone with browser access
- Server-enforced authorization
- Central account recovery
- Password reset
- Data export or restore unless separately implemented and tested

## Rollback

### Vercel Rollback Procedure

1. Identify the last known-good production deployment.
2. Confirm that its commit passed `npm ci`, `npm test -- --run`, and `npm run build`.
3. Use Vercel's deployment history to promote or roll back to that deployment.
4. Confirm the production alias points to the expected deployment.
5. Repeat all direct-route and role-based smoke checks.
6. Record:
   - Failed deployment URL
   - Failed commit SHA
   - Restored deployment URL
   - Restored commit SHA
   - Reason for rollback
   - Validation result

Alternatively, revert the faulty Git commit and deploy the revert through the normal CI/CD path.

### Rollback Data Behavior

A static rollback changes application files only. It does not roll back or restore `localStorage`.

If a release writes browser data that an older release cannot validate, rolling back the application may cause that data to be treated as invalid. The application will use safe fallback states, but the original stored value may remain inaccessible.

Before releasing a storage schema change:

1. Define backward compatibility requirements.
2. Add migration logic.
3. Add tests for old and new stored values.
4. Test forward deployment and rollback behavior.
5. Document whether rollback can read data written by the new release.

Do not manually mutate a user's browser storage as a general rollback strategy.

## Performance Validation Protocol

Performance validation must use a production build, not the Vite development server.

### Local Protocol

1. Run:

   ```sh
   npm ci
   npm test -- --run
   npm run build
   npm run preview
   ```

2. Open a clean Chromium browser profile or an Incognito window.
3. Disable browser extensions.
4. Keep the machine on stable power and close unrelated high-load applications.
5. Use browser DevTools Lighthouse with:
   - Mode: Navigation
   - Device: Mobile
   - Categories: Performance, Accessibility, Best Practices, SEO
6. Audit these representative states:
   - Guest landing page at `/`
   - Login page at `/login`
   - Empty authenticated blogs page at `/blogs`
   - Blogs page with at least nine representative posts
   - Reader page with a long post
   - Post editor at `/write`
   - Admin Dashboard at `/admin`
   - User Management with representative accounts at `/users`
7. Run each audit three times.
8. Record every result and use the median score for comparison.
9. Record the commit SHA, browser version, machine, date, route, fixture size, and whether throttling was enabled.
10. Investigate console errors, failed resources, layout shifts, unexpectedly large JavaScript, and slow main-thread tasks.

Recommended release targets under the same repeatable audit conditions are:

- Lighthouse Performance: 90 or higher
- Lighthouse Accessibility: 90 or higher
- Lighthouse Best Practices: 90 or higher
- Lighthouse SEO: 90 or higher
- Largest Contentful Paint: 2.5 seconds or less
- Cumulative Layout Shift: 0.1 or less
- Total Blocking Time: 200 milliseconds or less

A result below a target requires review and documentation before promotion. Compare results only when browser version, fixture data, throttling, and test environment are equivalent.

### Hosted Validation

Repeat representative Lighthouse runs against the Vercel preview deployment and, after promotion, the production deployment.

Also verify:

- Static assets are compressed by the hosting platform.
- Built assets use hashed filenames and cache successfully.
- `index.html` can receive updated deployment content.
- No source map or bundle unexpectedly exposes information considered secret.
- No unexpected third-party requests are present.
- Nested route refreshes have the same functional behavior as client-side navigation.

Performance results may vary by network and region. Record the test region and connection conditions.

## Operational Monitoring

There is no backend health endpoint, central log stream, account database, or content telemetry.

Operational monitoring should focus on:

- Vercel deployment status
- Static asset availability
- Direct-route availability
- Browser console errors
- Failed JavaScript or CSS requests
- Unexpected network requests
- Regressions in repeatable Lighthouse measurements
- CI test and build status

Platform logs must not be interpreted as a source of browser-local account or post data.

If optional hosting analytics are enabled, review their privacy impact first. They must not collect form values, passwords, post content, usernames, display names, or browser storage values.

## Prohibited Deployment Settings

Do not enable or configure any of the following without a separately reviewed architecture change:

- Serverless functions, edge functions, API routes, or middleware
- A backend database or remote object storage
- External authentication or session services
- Environment variables containing secrets
- A redirect from `/(.*)` to `/index.html`
- A rewrite that drops nested React Router paths
- A production output directory other than `dist`
- A project root that excludes `vercel.json`
- Server-side Basic Authentication presented as application authentication
- CDN or proxy rules that cache personalized HTML based on browser-local state
- HTML transformations that inject unreviewed scripts
- Third-party scripts that read form fields or `localStorage`
- Analytics session replay on login, registration, editor, or user-management pages
- Service workers or offline caching not implemented and tested by the project
- Automatic modification of browser-local schemas
- Cross-origin storage sharing assumptions
- Runtime replacement of the permanent Admin credentials
- Deployment of source files instead of the Vite production build
- Public use with real personal information or reused passwords
- Claims that client-side role checks provide production security
- Use of `npm run dev` or `npm run preview` as the production server
- Promotion when tests, build, direct-route checks, or role-based smoke checks fail

Any change requiring an API, secret, database, production authentication, encryption, centralized recovery, or durable storage is an architectural change and must not be introduced only through deployment configuration.