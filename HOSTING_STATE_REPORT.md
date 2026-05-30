# Hosting State Report — OfTheDay.net

**Date:** 2026-05-30
**Status:** Netlify, manually deployed, no build pipeline, no SPA redirect rules.

---

## Current Hosting Provider

**Provider:** Netlify
**Plan:** Unknown (assumed Starter/free tier based on absence of paid-tier configurations)
**Custom Domain:** OfTheDay.net (assumed — not confirmed in config files)
**SSL:** Netlify auto-provisions Let's Encrypt SSL for all custom domains

---

## Build Configuration

**Build Command:** None set.

The `netlify.toml` file contains only `[[headers]]` configuration. There is no `[build]` block. This means Netlify uses its default behavior: no build command is run, and the repository root is served as the publish directory.

```toml
# netlify.toml — full file contents
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self' blob: data: ..."
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**What this means in practice:**
- Netlify serves `index.html` from the repository root for the `/` path.
- The `netlify/functions/` directory is automatically detected and deployed as Netlify Functions.
- No transformation, minification, or optimization is applied to any files.
- The 1.59MB `index.html` is served exactly as committed.

---

## Publish Directory

**Configured:** Not set (inferred as root `/`)
**Actual published content:**
- `index.html` (1.59MB)
- `of-the-day-netlify.html` (1.59MB, identical to index.html — served but orphaned)
- `assets/oftheday-logo.png`
- `package.json` (exposed at `/package.json` — minor info disclosure)
- `netlify.toml` (exposed at `/netlify.toml` — minor info disclosure)
- `netlify/functions/` (handled by Netlify Functions runtime, not served as static files)

**Concern:** `package.json` and `netlify.toml` are publicly accessible at their paths. This is low-risk but untidy for a commercial product. A proper build pipeline with an explicit publish directory (`/dist` or `/public`) would prevent non-deliverable files from being served.

---

## Routing Configuration

**SPA Redirect Rules:** Not configured.

There are no `[[redirects]]` rules in `netlify.toml`. For the current app this is survivable because the app has no URL routes — it always loads at `/`. However:

- Any request to a path that doesn't match a static file returns a **Netlify 404 page**.
- If URL-based routing is ever added to the React app, all direct links and browser refreshes will 404.
- The standard fix is a single redirect rule:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This is a one-line fix. It should be added immediately.

---

## HTTPS / Force-HTTPS

**Configured:** Not set.

Netlify auto-provisions SSL but does not force HTTPS by default unless configured. The `netlify.toml` is missing a force-HTTPS configuration. While Netlify's UI has a "Force HTTPS" toggle, enforcing it in `netlify.toml` ensures it is version-controlled.

The recommended addition:

```toml
[build.environment]
  # (add when build command is configured)

[[redirects]]
  from = "http://oftheday.net/*"
  to = "https://oftheday.net/:splat"
  status = 301
  force = true
```

---

## Environment Variable Usage

**Currently used:** None.

No environment variables are referenced in either Netlify Function (`on-this-day.js`, `sync.js`). The Netlify Blobs store name is likely hardcoded or uses default naming. This is fine for a small single-environment app, but becomes a problem when staging/production environments are needed.

---

## Deployment Method

**Current method:** Git push to the connected repository or manual file drag-and-drop via Netlify dashboard.

**Problems with current approach:**
- No CI/CD pipeline — no automated tests run before deployment.
- No deploy previews for feature branches (not configured, though Netlify supports this).
- No staging environment — all changes go directly to production.
- Rollback requires manually triggering a previous deploy from the Netlify dashboard.

---

## Netlify Functions

Both functions are deployed correctly:
- `netlify/functions/on-this-day.js` → available at `/.netlify/functions/on-this-day`
- `netlify/functions/sync.js` → available at `/.netlify/functions/sync`

Netlify auto-detects the `netlify/functions/` directory. No additional configuration is required. The `@netlify/blobs` dependency in `package.json` is installed by Netlify during function bundling.

---

## Caching Configuration

**Configured:** None beyond the CSP header.

No `Cache-Control` headers are set for static assets. This means:
- `index.html` (1.59MB) is re-downloaded on every visit with no caching benefit.
- The logo PNG has no cache headers.

Recommended additions:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "no-cache"
```

---

## Deployment Risks

| Risk | Severity | Notes |
|---|---|---|
| No SPA redirect rules | Medium | Any added URL routes will 404 on direct access |
| No build pipeline | High | No minification, no tree-shaking, no asset optimization |
| Duplicate `of-the-day-netlify.html` | Low | Serves an orphaned 1.59MB file unnecessarily |
| `package.json` publicly accessible | Low | Minor info disclosure |
| No preview deploy channels | Medium | All changes go directly to production |
| No automated tests pre-deploy | High | Regressions ship silently |
| No error monitoring | High | No visibility into production failures |
| No force-HTTPS rule | Low | Netlify UI setting may cover this, but unverified |

---

## Firebase Hosting Readiness Score

**Score: 2 / 10**

**Rationale:**
- The app has no build step and no output directory. Firebase Hosting requires a `public` directory with a built artifact.
- The `firebase.json` rewrite rules (`"source": "**", "destination": "/index.html"`) require a built `index.html` in a known output directory.
- Netlify Functions must be replaced with Firebase Functions or Cloud Run — they are not portable.
- Netlify Blobs storage must be replaced with Firestore or Firebase Storage.
- The 2 points are awarded because: (1) the app is a valid SPA that would work under Firebase Hosting's rewrite model once a build pipeline exists, and (2) the security headers in `netlify.toml` are directly portable to `firebase.json` headers config.

**Minimum required before Firebase Hosting migration is viable:**
1. Add a build pipeline (Vite or Create React App) that outputs to `/dist`
2. Replace Netlify Functions with Firebase Functions
3. Replace Netlify Blobs with Firestore
4. Create `firebase.json` with SPA rewrite and header config
5. Create `.firebaserc` with project ID

None of these are currently in place.
