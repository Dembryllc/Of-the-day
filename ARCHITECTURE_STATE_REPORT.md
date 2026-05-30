# ARCHITECTURE STATE REPORT — OfTheDay.net

**Date:** 2026-05-30
**Status:** Functional monolith. No build pipeline. Non-standard bundler. High technical debt.

---

## System Overview

OfTheDay.net is a single-page React application delivered as a single self-contained HTML file. All source code, styles, and assets are gzip-compressed and base64-encoded inside two custom `<script>` tags within `index.html`. A custom JavaScript runtime in the HTML `<head>` unpacks and executes the app on load using in-browser Babel for JSX transpilation. There is no build step, no npm build command, no Webpack/Vite/Rollup, and no separate JS or CSS output files.

The backend consists of exactly 2 Netlify Functions. The only npm dependency is `@netlify/blobs`. There is no Firebase, no Stripe, no analytics, no error tracking, and no real authentication service.

---

## Component-by-Component Breakdown

### 1. Frontend Framework

| Property | Value |
|---|---|
| Framework | React (functional components, hooks) |
| JSX Compilation | Babel — in-browser, at runtime on every page load |
| Delivery | All code embedded in `index.html` (1.59MB) |
| Routing | Single-page, `activeNav` React state variable — no React Router, no URL changes |
| Status | **Working** |
| Evidence | `index.html` — `<script type="__bundler/manifest">` and `<script type="__bundler/template">` tags |
| Risk | **High** |

**Detail:** In-browser Babel transpilation means the browser must download 1.59MB, decompress gzipped blobs, parse JSON, then compile JSX before any React rendering begins. This adds 200–800ms of compile time on top of download time. On a slow school network connection (5–10 Mbps with latency), the blank screen before app load can exceed 3–5 seconds. This is production-inappropriate.

---

### 2. Custom Bundler Format

| Property | Value |
|---|---|
| Type | Non-standard, project-specific |
| Format | gzip-compressed assets as base64 inside `<script type="__bundler/manifest">`, app template as JSON string inside `<script type="__bundler/template">` |
| Documentation | None |
| Modifiability | Requires understanding the unpacking runtime to make any source change |
| Status | **Working** |
| Evidence | `index.html` (1.59MB) — custom script tags at document top |
| Risk | **Critical** |

**Detail:** This is the single highest technical risk in the system. The entire React source is locked inside an opaque binary-encoded blob. No standard tooling can inspect, lint, type-check, or incrementally build it. Every code change requires a full re-encode through the custom bundler. This is a complete developer experience blocker.

---

### 3. State Management

| Property | Value |
|---|---|
| Approach | React built-in (`useState`, `useMemo`, `useCallback`) |
| Global state | Lifted to root component, passed as props |
| Persistence | `localStorage` only, using `ofd:` prefixed keys |
| External store | None (no Redux, Zustand, MobX, Context API) |
| Status | **Working** |
| Evidence | localStorage keys: `ofd:account`, `ofd:session`, `ofd:favorites`, `ofd:routines`, `ofd:customActivities` |
| Risk | **Medium** |

**Detail:** State architecture is appropriate for a single-page tool of this scope. The risk is that all persistence is localStorage-only — browser clears, private browsing, incognito mode, or device changes silently wipe all user data with no warning.

---

### 4. Authentication

| Property | Value |
|---|---|
| Method | localStorage only — no auth service |
| Password storage | Client-side SHA-256 hash stored in `localStorage["ofd:account"]` |
| Session | `localStorage["ofd:session"]` — token string |
| Sign out behavior | Clears session only; account data and password hash remain in localStorage |
| Password reset | Not implemented |
| Email verification | Not implemented |
| Multi-device | Not supported — account is bound to one browser's localStorage |
| Status | **Working (but fundamentally insecure)** |
| Evidence | `index.html` source — auth logic in React component |
| Risk | **Critical** |

**Security issues:**
- Password hash readable by any JavaScript on the page (XSS attack surface)
- No server-side session validation — all auth logic is entirely client-side
- No email verification, no account recovery, no password reset mechanism
- Knowledge of the localStorage contents grants full account access
- Accounts are device-locked by design — not a cloud identity system

---

### 5. Backend — Netlify Functions

| Property | Value |
|---|---|
| Runtime | Node.js (Netlify Functions v1) |
| Total functions | 2 |
| Status | **Working** (no automated tests exist) |
| Evidence | `netlify/functions/on-this-day.js`, `netlify/functions/sync.js` |
| Risk | **Medium** |

**Function 1: `netlify/functions/on-this-day.js`**
- Fetches historical facts from `https://www.onthisday.com` for the current date
- Applies content filter to remove violence, war, politics, and death references
- Returns a JSON array of filtered facts
- Falls back to hardcoded data on fetch failure
- **Critical gap:** Hardcoded fallback covers only 13 dates. Fetch failures on any of the other 352 dates return empty content with no user-visible error

**Function 2: `netlify/functions/sync.js`**
- Handles GET and PUT for cloud sync
- Uses `@netlify/blobs` to store per-user data keyed by SHA-256(email:syncKey)
- Payload limit: 750KB per user
- No server-side auth validation beyond key matching
- **Security risk:** Anyone who learns a user's email address and syncKey gets full read/write access to their sync data

---

### 6. Database / Persistence

| Property | Value |
|---|---|
| Primary storage | `localStorage` (client-side, device-locked) |
| Cloud storage | Netlify Blobs (KV store, optional sync only) |
| Schema | Single JSON blob per user, up to 750KB |
| Auth on cloud | None — key is SHA-256(email:syncKey), no JWT, no server-side session |
| Query capability | None (KV only) |
| Admin interface | None |
| Status | **Working** |
| Evidence | `netlify/functions/sync.js`, `@netlify/blobs` in `package.json` |
| Risk | **High** |

**Detail:** Netlify Blobs is not a user database. It has no query capabilities, no user management, no admin interface, and no audit logging. It is a simple KV cache. This is not viable for a commercial product with user accounts, subscription states, or multi-device support.

---

### 7. API Integrations

| Integration | URL | Purpose | Fallback | Status | Risk |
|---|---|---|---|---|---|
| onthisday.com | `https://www.onthisday.com` | Historical facts | Hardcoded 13 dates | **Partial** | **High** |
| vocabularyninja.co.uk | Hardcoded URL | Word of the Day | None | **Working** | **High** |

Both are external third-party services with no API contracts, no SLAs, and no notification of breaking changes. HTML scraping or undocumented API endpoints used by either could change without notice.

---

### 8. Build System

| Property | Value |
|---|---|
| Build command | None |
| Package manager | npm (`package.json` present) |
| Build output | None — `index.html` IS the deliverable |
| npm dependencies | `@netlify/blobs` only (for functions) |
| Dev dependencies | None listed |
| Scripts | Only `test` (no actual tests) |
| Status | **None — intentionally absent** |
| Evidence | `package.json`, `netlify.toml` (no `[build]` section) |
| Risk | **High** |

---

### 9. Deployment

| Property | Value |
|---|---|
| Host | Netlify |
| Publish directory | `/` (root, inferred — not configured) |
| Build command | None |
| Deploy trigger | Git push or manual dashboard upload |
| Preview channels | Not configured |
| Environment variables | None referenced in any file |
| CI/CD | None |
| Status | **Working** |
| Evidence | `netlify.toml` — no `[build]` block |
| Risk | **Medium** |

---

### 10. Routing

| Property | Value |
|---|---|
| Router | None — state-based navigation via `activeNav` React state |
| URL changes | None — app always loads at `/` |
| Deep links | Not supported |
| SPA redirect rules | Not configured in `netlify.toml` |
| Direct URL access | Returns Netlify 404 for any path other than `/` |
| Status | **Partial** |
| Risk | **Medium** |

---

### 11. Security Headers (netlify.toml)

The `netlify.toml` configures four headers for all routes:

- `Content-Security-Policy`: Allows `'unsafe-inline'` and `'unsafe-eval'` — required by in-browser Babel; cannot be tightened without replacing Babel with a build step
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage

**Missing headers:** `Strict-Transport-Security` (HSTS), `Permissions-Policy`. These should be added.

---

### 12. Duplicate Files

| File | Size | Status |
|---|---|---|
| `index.html` | 1.59MB | Primary entry point |
| `of-the-day-netlify.html` | 1.59MB | Identical copy — orphaned, serves no purpose |

`of-the-day-netlify.html` appears to be a historical deployment artifact. It is bit-for-bit identical to `index.html`. It is publicly accessible, wastes bandwidth, and creates confusion. It should be deleted.

---

## Strengths

- The core React app is well-structured for its scope — functional components, hooks, clean component separation
- Responsive design handles mobile, tablet, and classroom display well (24 media queries confirmed)
- Projector mode is a genuinely clever solution — localStorage polling to sync a teacher view and a display view is low-tech but effective within its constraints
- The two Netlify Functions are simple, focused, and correct for their current scope
- Teal/dark visual theme is polished and appropriate for an education product
- The activity category system (14 categories) is well-designed and extensible in concept

---

## Weaknesses Summary

| Issue | Severity | Effort to Fix | Dependency |
|---|---|---|---|
| 1.5MB HTML file / in-browser Babel | High | High | Requires full build pipeline replacement |
| Custom opaque bundler | Critical | High | Requires full source extraction and rebuild |
| localStorage-only auth | Critical | High | Requires Firebase Auth or equivalent |
| Client-side password hash | Critical | High | Blocked on real auth service |
| No build pipeline | High | Medium | Unblocks all other improvements |
| Netlify Blobs as user DB | High | High | Requires Firestore migration |
| External content dependencies | Medium | Medium | Write robust fallbacks, consider caching layer |
| Projector: same-device only | Medium | High | Requires server-side event relay |
| No SPA redirect rules | Low | Low | One `[[redirects]]` entry in netlify.toml |
| Duplicate `of-the-day-netlify.html` | Low | Trivial | Delete the file |
| On This Day: 13-date fallback | Medium | Medium | Write complete 365-date fallback dataset |
| No error tracking | High | Low | Add Sentry free tier |
| No analytics | Medium | Low | Add Plausible or PostHog |
| `unsafe-inline` / `unsafe-eval` in CSP | Medium | High | Blocked on build pipeline replacement |
