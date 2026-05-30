# HOSTING STATE REPORT — OfTheDay.net

**Date:** 2026-05-30
**Status:** Netlify, manually deployed, no build pipeline, no SPA redirect rules, no CI/CD.

---

## Current Hosting Provider

| Property | Value |
|---|---|
| Provider | Netlify |
| Plan | Unknown (assumed Starter/free tier based on absence of paid-tier configurations) |
| Custom Domain | OfTheDay.net (assumed — not confirmed in config files) |
| SSL | Netlify auto-provisions Let's Encrypt SSL for all custom domains |
| Functions Runtime | Netlify Functions v1 (Node.js) |

---

## Build Configuration

**Build Command:** None set.

The `netlify.toml` file in the repository root contains only `[[headers]]` configuration. There is no `[build]` block. This means Netlify uses its default behavior: no build command is executed, and the repository root is treated as the publish directory.

```toml
# netlify.toml — complete file contents
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' blob:; img-src 'self' blob: data:; font-src 'self' blob: data:; connect-src 'self' blob:;"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**What this means in practice:**
- Netlify serves `index.html` from the repository root for the `/` path
- The `netlify/functions/` directory is automatically detected and deployed as Netlify Functions
- No transformation, minification, or asset optimization is applied to any file
- The 1.59MB `index.html` is served exactly as committed, on every request

---

## Publish Directory

**Configured:** Not explicitly set. Netlify infers root `/` as the publish directory.

**Actual files publicly accessible:**

| File | Size | Notes |
|---|---|---|
| `index.html` | 1.59MB | Primary app entry point |
| `of-the-day-netlify.html` | 1.59MB | Identical copy of index.html — orphaned, should be deleted |
| `assets/oftheday-logo.png` | Unknown | Logo asset |
| `package.json` | Small | Publicly accessible — minor info disclosure |
| `netlify.toml` | Small | Publicly accessible — minor info disclosure |

**Concern:** `package.json` and `netlify.toml` are publicly accessible. This is low-risk but reveals dependency names and configuration details to any visitor. A proper build pipeline with an explicit publish directory (`/dist`) would confine only built artifacts to public access.

---

## Routing Configuration

**SPA Redirect Rules:** Not configured.

There are no `[[redirects]]` rules in `netlify.toml`. For the current app this is survivable because the app has no URL routes — it always loads at `/` using React state for navigation (`activeNav` variable). However:

- Any request to any path other than `/` or a real static file returns a **Netlify 404 page**
- If URL-based routing is ever added to the React app, all direct links, browser refreshes on sub-pages, and back-button navigation will 404
- Shared links or bookmarked sub-views would be completely broken

**Required fix** (one entry in `netlify.toml`):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This should be added immediately as preventive infrastructure, even though the app does not currently use URL routing.

---

## HTTPS / Force-HTTPS Configuration

**Configured:** Not set in `netlify.toml`.

Netlify auto-provisions SSL for custom domains, and Netlify's dashboard has a "Force HTTPS" toggle. However, this configuration is not version-controlled — it lives only in Netlify's UI. The `netlify.toml` is missing an explicit HTTPS redirect, which means:

- HTTP requests are not guaranteed to redirect to HTTPS unless the Netlify UI setting is enabled
- If the site is redeployed to a new Netlify site or team, the setting would need to be manually re-enabled

**Recommended addition to `netlify.toml`:**

```toml
[[redirects]]
  from = "http://oftheday.net/*"
  to = "https://oftheday.net/:splat"
  status = 301
  force = true
```

---

## Environment Variable Usage

**Currently used:** None.

No environment variables are referenced in either Netlify Function (`on-this-day.js`, `sync.js`) or in the frontend HTML. The Netlify Blobs store name is likely hardcoded or uses the default naming convention from `@netlify/blobs`. This is acceptable for a single-environment deployment but becomes a problem when staging/production environment parity is needed.

**Variables that will be needed once monetization is added:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID` / Firebase service account credentials
- `SENTRY_DSN` (error tracking)
- External API keys if vocabularyninja or onthisday require authentication

---

## Deployment Method

**Current method:** Git push to connected repository OR manual file upload via Netlify dashboard drag-and-drop.

**Problems with the current approach:**

| Problem | Impact | Severity |
|---|---|---|
| No CI/CD pipeline | No automated tests run before deploy; regressions ship silently | High |
| No staging environment | All changes go directly to production | High |
| No deploy preview channels | Feature branches cannot be tested at a live URL before merge | Medium |
| Rollback requires manual action | Must manually trigger a previous deploy from the Netlify dashboard | Medium |
| No build validation | A broken commit deploys successfully because there is nothing to break | High |

---

## Netlify Functions

Both functions are correctly deployed and auto-detected:

| Function | Path | URL Pattern | Dependency |
|---|---|---|---|
| `netlify/functions/on-this-day.js` | Repository root | `/.netlify/functions/on-this-day` | None |
| `netlify/functions/sync.js` | Repository root | `/.netlify/functions/sync` | `@netlify/blobs` |

Netlify automatically detects the `netlify/functions/` directory. The `@netlify/blobs` dependency in `package.json` is installed by Netlify during function bundling at deploy time.

**Function risks:**

| Risk | Severity | Notes |
|---|---|---|
| No automated tests | High | Neither function has a test file |
| No error logging | High | Failures are invisible without Netlify Function logs access |
| sync.js: no server-side auth | High | Any caller with email+syncKey can read/write any user's data |
| on-this-day.js: 13-date fallback | Medium | Fetch failures on 352 dates return empty content |

---

## Caching Configuration

**Configured:** None beyond the CSP header.

No `Cache-Control` headers are configured for any asset. This means:

- `index.html` (1.59MB) is downloaded fresh on every visit — no browser caching benefit
- The logo PNG has no caching headers
- Netlify's default CDN behavior may apply minimal caching, but it is not explicit

**Recommended caching additions:**

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "no-cache, must-revalidate"
```

---

## Missing Security Headers

The current CSP is necessary given in-browser Babel's use of `eval()`, but two security headers are absent:

```toml
# Should be added to [[headers]] block:
Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

## Deployment Risks Summary

| Risk | Severity | Fix Effort | Notes |
|---|---|---|---|
| No `[[redirects]]` SPA rule | Medium | Trivial | Add one entry to netlify.toml |
| No build pipeline | High | High | No minification, no optimization, no tree-shaking |
| Duplicate `of-the-day-netlify.html` | Low | Trivial | Delete the file |
| `package.json` publicly accessible | Low | Low | Fix with explicit publish dir in build pipeline |
| No deploy preview channels | Medium | Low | Enable in Netlify settings |
| No automated tests pre-deploy | High | High | Requires test infrastructure |
| No error monitoring | High | Low | Add Sentry free tier |
| No force-HTTPS rule in version control | Low | Trivial | Add redirect rule to netlify.toml |
| No `Cache-Control` headers | Medium | Low | Add header rules to netlify.toml |

---

## Firebase Hosting Readiness Score

**Score: 2 / 10**

**Rationale:**

The app is fundamentally incompatible with Firebase Hosting in its current form because Firebase Hosting requires a built artifact in a dedicated public directory. The current deliverable IS `index.html` — there is no build output directory, no `dist/`, no `public/`.

**What earns the 2 points:**
1. The app is a valid SPA that would work under Firebase Hosting's SPA rewrite model once a build pipeline exists
2. The security headers in `netlify.toml` are directly portable to Firebase Hosting's `headers` configuration in `firebase.json`

**What blocks migration:**

| Blocker | Current State | Required State |
|---|---|---|
| Build pipeline | None | Vite or equivalent outputting to `/dist` |
| Netlify Functions | 2 functions deployed | Must be rewritten as Firebase Functions |
| Netlify Blobs storage | Used by `sync.js` | Must be replaced with Firestore or Firebase Storage |
| `firebase.json` | Does not exist | Must be created with SPA rewrite + headers |
| `.firebaserc` | Does not exist | Must be created with project ID |
| Firebase project | Not created | Must be provisioned |

**Minimum required before Firebase Hosting migration is viable:**
1. Add a build pipeline (Vite recommended) that outputs to `/dist`
2. Rewrite `netlify/functions/on-this-day.js` as a Firebase Function
3. Rewrite `netlify/functions/sync.js` as a Firebase Function using Firestore
4. Create `firebase.json` with SPA rewrite and ported header config
5. Create `.firebaserc` with the Firebase project ID

None of these prerequisites are currently in place. Attempting Firebase Hosting migration before these are done will result in a broken deployment.
