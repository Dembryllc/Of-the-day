# Architecture State Report — OfTheDay.net

**Date:** 2026-05-30
**Status:** Functional monolith. No build pipeline. Non-standard bundler. High technical debt.

---

## System Overview

OfTheDay.net is a single-page React application delivered as a single self-contained HTML file. All source code, styles, and assets are compressed (gzip) and base64-encoded inside two custom `<script>` tags within the HTML. A custom JavaScript runtime in the HTML head unpacks and executes the app on load. There is no build step, no npm build command, no bundler CLI, and no separate JS/CSS output files.

---

## Component-by-Component Breakdown

### 1. Frontend Framework

| Property | Value |
|---|---|
| Framework | React (functional components, hooks) |
| JSX Compilation | Babel — in-browser, at runtime |
| Delivery | All code embedded in `index.html` (1.59MB) |
| Routing | Single-page, `activeNav` state variable (no React Router) |
| Status | **Working** |
| Risk | **High** |

**Evidence:** `index.html` contains `<script type="__bundler/manifest">` with base64-encoded gzip blobs and `<script type="__bundler/template">` with app shell JSON.

**Notes:** In-browser Babel transpilation is a significant performance liability. The JSX is compiled fresh in the browser on every page load, adding 200–800ms of parse/compile time before any React rendering begins. This is inappropriate for production use.

---

### 2. State Management

| Property | Value |
|---|---|
| Approach | React built-in (`useState`, `useMemo`, `useCallback`) |
| Persistence | `localStorage` only |
| Global state | Lifted to root component, passed as props |
| External store | None (no Redux, Zustand, Context API) |
| Status | **Working** |
| Risk | **Medium** |

**Evidence:** All user data keys use `ofd:` prefix in localStorage: `ofd:account`, `ofd:session`, `ofd:favorites`, `ofd:routines`, `ofd:customActivities`.

**Notes:** State management is appropriate for a single-page tool of this size. The risk is that all data lives in localStorage — browser cache clears, private browsing mode, or device changes wipe all user data.

---

### 3. Backend — Netlify Functions

| Property | Value |
|---|---|
| Runtime | Node.js (Netlify Functions v1) |
| Functions | 2 total |
| Status | **Working** (assumed — no automated tests) |
| Risk | **Medium** |

**Function 1: `netlify/functions/on-this-day.js`**
- Fetches historical facts from `https://www.onthisday.com` for the current date
- Applies a content filter to remove references to violence, war, politics, death
- Returns JSON array of filtered facts
- Falls back to hardcoded data if fetch fails
- **Critical gap:** Hardcoded fallback only covers 13 dates. Any fetch failure on an uncovered date returns empty content.

**Function 2: `netlify/functions/sync.js`**
- Handles GET and PUT requests for cloud sync
- Uses `@netlify/blobs` to store user data keyed by SHA-256(email:syncKey)
- Payload limit: 750KB
- No server-side auth validation beyond key matching
- **Security risk:** Knowledge of a user's email + syncKey grants full read/write access to their data.

---

### 4. Database

| Property | Value |
|---|---|
| Storage | Netlify Blobs (KV store) |
| Schema | Single blob per user, JSON payload up to 750KB |
| Auth | None — key is SHA-256(email:syncKey), no JWT, no session validation |
| Local fallback | `localStorage` |
| Status | **Working** |
| Risk | **High** |

**Notes:** Netlify Blobs is not a user database. It has no query capabilities, no user management, no admin interface, no audit logging. It is appropriate for simple cache or config storage, not for user account management in a commercial product.

---

### 5. Authentication

| Property | Value |
|---|---|
| Method | localStorage only |
| Password storage | Client-side SHA-256 hash stored in `localStorage["ofd:account"]` |
| Session | `localStorage["ofd:session"]` — token string |
| "Sign out" | Clears session only; account data remains in localStorage |
| Password reset | Not implemented |
| Status | **Working (but insecure)** |
| Risk | **Critical** |

**Security issues:**
- Password hash is readable by any JavaScript running on the page (XSS exposure)
- No server-side session validation — all auth is entirely client-side
- No email verification
- No account recovery mechanism
- Accounts are device-locked by design

---

### 6. API Integrations

| Integration | URL | Used For | Status | Risk |
|---|---|---|---|---|
| onthisday.com | `https://www.onthisday.com` | Historical facts | **Partial** | **High** |
| vocabularyninja.co.uk | Hardcoded URL | Word of the Day | **Working** | **High** |

Both are external third-party services with no API contracts, no SLAs, and no fallback parity. If either domain goes offline or changes its HTML structure, the corresponding features break silently.

---

### 7. Build System

| Property | Value |
|---|---|
| Build command | None |
| Package manager | npm (package.json exists) |
| Build output | None — `index.html` is the deliverable |
| Dependencies | `@netlify/blobs` only (for Netlify Functions) |
| Dev dependencies | None listed |
| Status | **None / Not applicable** |
| Risk | **High** |

**Evidence:** `package.json` contains only a `test` script. `netlify.toml` has no `[build]` section. Netlify serves the repository root as the publish directory by inference.

---

### 8. Deployment

| Property | Value |
|---|---|
| Host | Netlify |
| Publish directory | `/` (root, inferred) |
| Build command | None |
| Deploy method | Git push or manual drag-and-drop |
| Preview channels | Not configured |
| Environment variables | None referenced in code |
| Status | **Working** |
| Risk | **Medium** |

**Evidence:** `netlify.toml` contains only `[[headers]]` configuration — no `[build]` block, no `[[redirects]]` block.

---

### 9. Routing

| Property | Value |
|---|---|
| Router | None — state-based navigation (`activeNav`) |
| URL changes | None — app is always at `/` |
| Deep links | Not supported |
| SPA redirects | Not configured in netlify.toml |
| Status | **Partial** |
| Risk | **Medium** |

**Notes:** Because there are no `[[redirects]]` rules and no client-side URL routing, any direct URL beyond `/` will return a Netlify 404. This is currently low impact because the app has no routes, but it becomes a problem if routing is ever added.

---

### 10. Content Security Policy

The CSP header in `netlify.toml` allows `'unsafe-inline'` and `'unsafe-eval'`. This is required by Babel in-browser transpilation — Babel uses `eval()` to execute compiled JSX. This is a known and unavoidable consequence of the current architecture.

**Risk:** Medium. Cannot be tightened without first replacing in-browser Babel with a proper build step.

---

## Strengths

- The core React app is well-structured for its scope — functional components, hooks, clean separation of concerns.
- Responsive design with 24 media queries handles mobile, tablet, and classroom display well.
- Projector mode is a genuinely clever solution — using localStorage polling to sync a teacher-view and a display-view is low-tech but effective within its constraints.
- Netlify Functions are simple and correct for their current scope.
- The teal/dark visual theme is polished and appropriate for an education product.

---

## Weaknesses Summary

| Issue | Severity | Effort to Fix |
|---|---|---|
| 1.5MB HTML file | High | High (requires build pipeline) |
| In-browser Babel | High | High (requires build pipeline) |
| Custom opaque bundler | High | High (full rebuild) |
| localStorage-only auth | Critical | High (requires Firebase Auth) |
| Client-side password hash | Critical | High (requires real auth) |
| No build pipeline | High | Medium |
| Netlify Blobs as user DB | High | High (requires Firestore) |
| External content dependencies | Medium | Medium (build proper fallbacks) |
| Projector: same-device only | Medium | High (requires server sync) |
| No SPA redirect rules | Low | Low (one line in netlify.toml) |
| Duplicate index.html file | Low | Low (delete file) |
| On This Day: 13-date fallback | Medium | Medium (write 365-day dataset) |
