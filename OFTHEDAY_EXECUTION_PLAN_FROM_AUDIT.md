# OFTHEDAY.NET — MASTER EXECUTION PLAN
**Source:** Consolidated from 10 audit files committed 2026-05-30
**Scope:** Planning only. No code is implemented in this document.
**Branch:** `claude/activity-of-day-app-2JlTT`

---

## Executive Summary

OfTheDay.net is a functional Responsive Classroom morning meeting planner with real classroom value and a polished visual design. It is not commercially ready. The gap is specific, bridgeable, and sequenced.

**The three facts that drive every decision in this plan:**

1. The app cannot be marketed today. There is no landing page. Cold traffic lands on a login form. Conversion rate is ~0%.
2. The app cannot be monetized today. Auth is localStorage-only and device-locked. Stripe requires server-verified identity. Adding payment before fixing auth is technically impossible.
3. The app cannot be easily improved today. The entire React source is locked inside a 1.59MB custom-bundled HTML file with in-browser Babel. No standard tooling can touch it.

**Estimated time to first paid users with focused execution:** 7–9 weeks.

---

## Current State

| Dimension | Score | Key Finding |
|---|---|---|
| Product functionality | 6/10 | Core loop works; content thin; projector device-locked |
| Commercial readiness | 2/10 | No landing page, no auth, no Stripe |
| Auth system | 1/10 | localStorage only; device-locked; no recovery |
| Build pipeline | 0/10 | Does not exist; source is inside opaque bundler |
| Firebase readiness | 2/10 | No build pipeline, no firebase.json, no Functions |
| Stripe readiness | 0/10 | No auth, no Firestore, no Functions |
| Landing page | 0/10 | Does not exist |
| UX/UI | 5/10 | Polished design; weak onboarding; zero conversion context |
| Error visibility | 0/10 | No Sentry, no logging |
| Analytics | 0/10 | None |

**Source files:** `ARCHITECTURE_STATE_REPORT.md`, `FOUNDER_STATE_REPORT.md`

---

## Consolidated Priority Findings from Audit

### Technical Blockers
- Custom bundler (opaque 1.59MB HTML) blocks all build-time improvements — `ARCHITECTURE_STATE_REPORT.md §2`
- No build pipeline means Firebase Hosting is impossible — `HOSTING_STATE_REPORT.md § Firebase Readiness Score`
- localhost auth (localStorage only) makes Stripe technically impossible — `STRIPE_READINESS_REPORT.md § Honest Assessment`
- No `[[redirects]]` rule means any future URL routing causes immediate 404s — `HOSTING_STATE_REPORT.md § Routing`

### UX Blockers
- Auth screen has zero product context — `UX_UI_STATE_REPORT.md Issue 2`
- No onboarding flow (`tutorialSeen` field exists but is unused) — `UX_UI_STATE_REPORT.md Issue 1`
- 1.5MB load time causes 3–5s blank screen on school networks — `UX_UI_STATE_REPORT.md Issue 3`
- Cloud sync "sync key" concept is confusing and rarely used — `UX_UI_STATE_REPORT.md Issue 9`

### Hosting Blockers
- No `[build]` section in `netlify.toml` — `HOSTING_STATE_REPORT.md § Build Configuration`
- Firebase Hosting requires a build output directory that does not exist — `FIREBASE_HOSTING_MIGRATION_PLAN.md`
- Netlify Functions are not portable to Firebase — must be rewritten — `HOSTING_STATE_REPORT.md`

### Monetization Blockers
- No user identity system that can be linked to a Stripe customer — `STRIPE_READINESS_REPORT.md`
- No pricing page, no pricing signal, no upgrade path — `PRODUCT_IDENTITY_REPORT.md`
- No landing page means zero cold traffic conversion — `LANDING_PAGE_AUDIT.md`
- No free/paid feature gates exist anywhere in the app — `STRIPE_READINESS_REPORT.md`

### Auth Blockers
- Password hash stored in localStorage (readable by any JS on the page) — `ARCHITECTURE_STATE_REPORT.md §4`
- No email verification, no password reset, no account recovery — `UX_UI_STATE_REPORT.md Issue 10`
- Multi-device access requires understanding of "sync key" — opaque to most users — `UX_UI_STATE_REPORT.md Issue 9`
- Account is permanently lost if localStorage is cleared — `PRODUCT_IDENTITY_REPORT.md § Biggest Product Risks`

### Landing Page Gaps
- No page exists — `LANDING_PAGE_AUDIT.md § Current State`
- No SEO surface area (React bundle is not crawlable) — `LANDING_PAGE_AUDIT.md § SEO Recommendations`
- No product screenshots, no tagline, no feature explanation visible before signup — `UX_UI_STATE_REPORT.md Issue 2`
- Teachers have no way to understand pricing before signing up — `PRODUCT_IDENTITY_REPORT.md § Missing Product Clarity`

---

## Recommended Order of Execution

### Why This Sequence

| Phase | Why It Comes Here | What Breaks If Skipped |
|---|---|---|
| Phase 0: Repo safety + quick wins | Zero-effort risk reduction; unblocks later work | None of these 5-minute fixes are blocked by anything else |
| Phase 1: Landing page | Independent of all tech; highest ROI commercial asset; can start Day 1 | All marketing spend returns ~0%; SEO impossible; referrals don't convert |
| Phase 2: Build pipeline | Master unlocker for Phases 3–5; source must be accessible before Firebase Auth or Firebase Hosting | Firebase Auth env var injection unsafe; Firebase Hosting impossible; CSP cannot be tightened |
| Phase 3: Firebase Auth | Prerequisite for Stripe; prerequisite for cross-device sync; prerequisite for school licensing | Stripe technically impossible; accounts remain device-locked; teachers won't pay |
| Phase 4: Firebase Hosting | Needed for Firebase Functions (required by Auth and Stripe); consolidates hosting on one platform | Netlify Functions and Firebase Functions cannot coexist cleanly long-term |
| Phase 5: Stripe | Everything before this must be stable; can't collect payment without verified identity or user database | No revenue; no paid tier distinction; no feature gates |

### ⚠️ Critical Dependency Note
`FOUNDER_STATE_REPORT.md` identifies the build pipeline as the "master unlocker." Firebase Auth can technically be wired via CDN into the existing custom-bundled app, but modifying the opaque bundler format carries high risk of breaking the working product. **The safe sequence is: build pipeline first, then Firebase Auth.** The landing page (Phase 1) is the only major phase that is fully independent — it can be built as a static HTML file before any other technical work begins.

---

## Phase 0 — Repo Safety + Quick Wins

**Goal:** Protect the working product. Fix five-minute items. Establish branch discipline before any significant changes.

**Why now:** These items have zero risk, take minutes, and prevent future breakage.

---

### Task P0-1: Add SPA Redirect Rule to netlify.toml

| Field | Detail |
|---|---|
| **Purpose** | Prevents Netlify 404 on any path other than `/`. Required before URL-based routing is ever added. |
| **Files involved** | `netlify.toml` |
| **Exact work** | Add `[[redirects]]` block: `from = "/*"`, `to = "/index.html"`, `status = 200` |
| **Risk** | LOW |
| **Business Impact** | MEDIUM — prevents future routing breakage; required for landing page route addition |
| **Dependencies** | None |
| **Success Criteria** | Navigating to `/about`, `/pricing`, or any non-root path returns the app, not a Netlify 404 |
| **Test Plan** | Deploy, visit `/anything` in browser, verify app loads |
| **Rollback** | Remove the `[[redirects]]` block |
| **Recommended Claude Product** | Claude Code |

---

### Task P0-2: Delete Duplicate `of-the-day-netlify.html`

| Field | Detail |
|---|---|
| **Purpose** | Remove bit-for-bit duplicate of `index.html` that serves no purpose and wastes 1.59MB of public bandwidth |
| **Files involved** | `of-the-day-netlify.html` |
| **Exact work** | Verify no external links point to it; delete the file; commit |
| **Risk** | LOW — verify no external inbound links first |
| **Business Impact** | LOW — reduces repo confusion; eliminates orphaned public file |
| **Dependencies** | Confirm no inbound links (check Netlify analytics or Google Search Console) |
| **Success Criteria** | File does not exist in repo; `index.html` still loads correctly |
| **Test Plan** | `git ls-files` confirms file is gone; production URL for `/of-the-day-netlify.html` returns 404 |
| **Rollback** | `git revert` the delete commit |
| **Recommended Claude Product** | Claude Code |

---

### Task P0-3: Add HTTPS Redirect + HSTS to netlify.toml

| Field | Detail |
|---|---|
| **Purpose** | Version-control the force-HTTPS behavior and HSTS header |
| **Files involved** | `netlify.toml` |
| **Exact work** | Add HTTP→HTTPS `[[redirects]]` rule; add `Strict-Transport-Security` and `Permissions-Policy` to `[[headers]]` |
| **Risk** | LOW |
| **Business Impact** | LOW (Netlify likely already enforces HTTPS via UI) — but version-controlling it matters for team trust |
| **Dependencies** | Custom domain must be configured in Netlify |
| **Success Criteria** | `http://oftheday.net` redirects to `https://oftheday.net` |
| **Test Plan** | `curl -I http://oftheday.net` returns `301` |
| **Rollback** | Remove the added redirect rule from `netlify.toml` |
| **Recommended Claude Product** | Claude Code |

---

### Task P0-4: Add Cache-Control Headers to netlify.toml

| Field | Detail |
|---|---|
| **Purpose** | Prevent repeated 1.59MB downloads on every visit. Set correct caching for assets. |
| **Files involved** | `netlify.toml` |
| **Exact work** | Add `[[headers]]` entry for `/assets/*` with `max-age=31536000, immutable`; add `no-cache, must-revalidate` for `/*.html` |
| **Risk** | LOW |
| **Business Impact** | MEDIUM — reduces load time for returning users on slow school networks |
| **Dependencies** | None |
| **Success Criteria** | `curl -I https://oftheday.net/assets/oftheday-logo.png` shows `Cache-Control: public, max-age=31536000` |
| **Test Plan** | Chrome DevTools Network tab shows `(disk cache)` on second visit for logo |
| **Rollback** | Remove the added `[[headers]]` block |
| **Recommended Claude Product** | Claude Code |

---

### Task P0-5: Create Feature Branches and Commit Strategy

| Field | Detail |
|---|---|
| **Purpose** | Prevent work-in-progress from breaking the live product |
| **Files involved** | Git config, branch strategy documentation |
| **Exact work** | Establish naming convention: `feat/landing-page`, `feat/build-pipeline`, `feat/firebase-auth`, `feat/firebase-hosting`, `feat/stripe`. Main branch (`main`) is always deployable. Each phase gets its own branch. PRs merge to main only when phase is verified working. |
| **Risk** | LOW |
| **Business Impact** | MEDIUM — prevents accidental deploy of broken changes |
| **Dependencies** | None |
| **Success Criteria** | Branch strategy documented; feature branches exist for each phase |
| **Test Plan** | `git branch -a` shows expected branches |
| **Rollback** | N/A — this is process, not code |
| **Recommended Claude Product** | Claude Code |

---

### Phase 0 Decision Gate

Before proceeding to Phase 1, confirm all of the following:
- [ ] `netlify.toml` has a working `[[redirects]]` SPA rule
- [ ] `of-the-day-netlify.html` is deleted and confirmed not externally linked
- [ ] HTTPS redirect is working and version-controlled
- [ ] Branch strategy is documented and active
- [ ] Current production site (`index.html`) still loads correctly after all `netlify.toml` changes

---

## Phase 1 — Landing Page

**Goal:** Create a commercial-facing homepage that converts cold traffic before any teacher reaches the auth wall.

**Why first:** The landing page is the only major phase that is 100% independent of all other technical work. It can be a static HTML file. It requires zero backend changes. Its impact is immediate: SEO surface area, cold traffic conversion, word-of-mouth support. Every week without it is a week where marketing is impossible.

**Source files:** `LANDING_PAGE_AUDIT.md`, `PRODUCT_IDENTITY_REPORT.md §Missing Product Clarity`, `UX_UI_STATE_REPORT.md Issue 2`

---

### Route Structure

The landing page lives at `/` (the root). The app moves to `/app`. This requires:
- A new `index.html` at the root that is the landing page (or a static `landing.html` initially with a redirect)
- The current app `index.html` moves to a subdirectory (e.g., `/app/index.html` or remains at root with routing disambiguation)
- A `[[redirects]]` rule sends `/app` and `/app/*` to the app entry point
- The current auth flow is unchanged — `/app` still shows the login/signup screen

**Recommended simple approach (no build pipeline needed):**
1. Rename current `index.html` → `app.html` (or create `/app/index.html`)
2. Create a new static `index.html` as the landing page
3. Add `[[redirects]]` in `netlify.toml`: `/app/*` → `/app.html` status 200

---

### Task LP-1: Create Static Landing Page HTML

| Field | Detail |
|---|---|
| **Purpose** | Build the marketing homepage that explains the product before the auth wall |
| **Files involved** | New `index.html` (landing page); current `index.html` renamed to `app.html`; `netlify.toml` updated for routing |
| **Exact work** | Build 11-section static HTML page per `LANDING_PAGE_AUDIT.md`: nav, hero, problem, solution, how it works, features (6), use cases (3), who it's for, pricing preview, FAQ, final CTA. Include OG tags, schema markup, SEO meta. |
| **Risk** | LOW |
| **Business Impact** | CRITICAL — enables all future marketing; first SEO surface area |
| **Dependencies** | Phase 0 complete (SPA redirect rules in place) |
| **Success Criteria** | Visiting `https://oftheday.net` shows landing page; "Try It Free" CTA routes to `/app` (the app) |
| **Test Plan** | Open in Chrome, verify all 11 sections render; test "Try It Free" → app loads; test "Sign In" link; verify on mobile (320px viewport); run Lighthouse on landing page (target: performance ≥ 80, SEO ≥ 90) |
| **Rollback** | Revert the HTML rename and netlify.toml routing changes; current app returns to root |
| **Recommended Claude Product** | Claude Code |

**Required landing page sections (from `LANDING_PAGE_AUDIT.md`):**
1. Navigation bar (Logo, Features, How It Works, Pricing, FAQ, "Try It Free" CTA, "Sign In")
2. Hero (tagline + sub-headline + hero CTA + product screenshot/mockup)
3. The Problem (teacher morning scramble empathy copy)
4. The Solution (automated routine explanation)
5. How It Works (3 steps: grade → today's meeting → projector)
6. Features (6 cards: Routine Builder, Projector Mode, Word of the Day, Do Now, On This Day, My Activities)
7. Use Cases (3 teacher personas)
8. Who It's For (grade levels, Responsive Classroom alignment)
9. Pricing Preview (Free / Pro $9/mo / School $199/yr table)
10. FAQ (7 questions from `LANDING_PAGE_AUDIT.md §FAQ`)
11. Final CTA

---

### Task LP-2: SEO Basics

| Field | Detail |
|---|---|
| **Purpose** | Make the landing page crawlable and indexable |
| **Files involved** | New `index.html`; new `sitemap.xml`; new `robots.txt` |
| **Exact work** | Add title tag, meta description, OG tags, Twitter card tags, JSON-LD schema markup per `LANDING_PAGE_AUDIT.md §SEO Recommendations`. Create `sitemap.xml` listing landing page and `/app`. Create `robots.txt` allowing landing page, disallowing `/app/*`. |
| **Risk** | LOW |
| **Business Impact** | HIGH — without this, the landing page contributes nothing to organic search |
| **Dependencies** | Task LP-1 complete |
| **Success Criteria** | Google Search Console can crawl and index the page; Lighthouse SEO score ≥ 90 |
| **Test Plan** | Paste URL into Google's Rich Results Test; verify schema markup is valid; verify OG tags via opengraph.xyz |
| **Rollback** | N/A — additive only |
| **Recommended Claude Product** | Claude Code |

---

### Task LP-3: Add Product Context to Auth Screen

| Field | Detail |
|---|---|
| **Purpose** | Stop the auth screen from being a cold brick wall for anyone who arrives directly at `/app` |
| **Files involved** | `app.html` (the React app) — the `AuthScreen` component inside the custom bundler |
| **Exact work** | Minimal intervention: add a logo + tagline above the login form; add a "← Back to home" link pointing to `/`. A full redesign of the auth screen is deferred to Phase 3 (Firebase Auth). |
| **Risk** | MEDIUM — requires modifying the custom-bundled HTML file |
| **Business Impact** | HIGH — prevents 0% conversion for anyone who lands on `/app` directly |
| **Dependencies** | Understanding the custom bundler format (established during Phase 2) — if done before Phase 2, it requires careful editing inside the bundle |
| **Success Criteria** | Auth screen shows product logo, tagline ("Morning Meeting Planner for Responsive Classroom Teachers"), and "← Home" link |
| **Test Plan** | Navigate to `/app` directly; verify tagline and home link are visible before signing in |
| **Rollback** | Revert the edit to `app.html` |
| **Recommended Claude Product** | Claude Code |

**Note:** This task touches the custom bundler, which carries risk. If Phase 2 (build pipeline) is ready before this task, do this task after Phase 2 using the extracted React source instead.

---

### Task LP-4: Email List Capture for Pre-Launch Waitlist

| Field | Detail |
|---|---|
| **Purpose** | Start collecting teacher emails immediately; build an audience for the paid launch |
| **Files involved** | Landing page `index.html` |
| **Exact work** | Add a ConvertKit or Mailchimp embed form to the Hero CTA area with text: "Join the waitlist — get free access at launch." Store emails in whichever service is used. |
| **Risk** | LOW |
| **Business Impact** | HIGH — a list of 200 interested teachers is worth more than 200 cold ad impressions on launch day |
| **Dependencies** | Task LP-1 (landing page exists) |
| **Success Criteria** | Form renders on landing page; submitting an email adds it to the list; confirmation message shown |
| **Test Plan** | Submit test email; verify it appears in the email provider dashboard |
| **Rollback** | Remove the form embed |
| **Recommended Claude Product** | Claude Code |

---

### Phase 1 Decision Gate

Before proceeding to Phase 2, confirm all of the following:
- [ ] Landing page live at `https://oftheday.net` root
- [ ] App accessible at `/app` or appropriate route
- [ ] All 11 sections rendering correctly on desktop and mobile
- [ ] "Try It Free" CTA routes to app correctly
- [ ] Lighthouse SEO score ≥ 90 on landing page
- [ ] Landing page passes Google Rich Results Test (schema valid)
- [ ] Pricing preview visible (Free / Pro / School)
- [ ] Email capture form working
- [ ] `sitemap.xml` and `robots.txt` present

---

## Phase 2 — Build Pipeline

**Goal:** Extract the React source from the custom bundler and establish a proper Vite build pipeline that outputs to a `dist/` directory.

**Why here:** This is the technical master unlocker. Without it, Firebase Auth (Phase 3) requires modifying the opaque custom bundler — high risk. Firebase Hosting (Phase 4) is impossible without a build output directory. Stripe env var injection is unsafe without a proper build step. This phase is the highest-risk and highest-effort work in the entire roadmap; it should not be rushed.

**Source files:** `ARCHITECTURE_STATE_REPORT.md §2 (Custom Bundler)`, `FOUNDER_STATE_REPORT.md §Biggest Technical Risk`

---

### Task BP-1: Extract React Source from Custom Bundler

| Field | Detail |
|---|---|
| **Purpose** | Get the actual React JSX source code out of the compressed bundle so it can be edited with standard tools |
| **Files involved** | `index.html` (or `app.html` after Phase 1 rename), Node.js extraction script |
| **Exact work** | Write a Node.js script that reads `app.html`, finds `<script type="__bundler/template">`, JSON.parse the content, and writes the extracted HTML template to individual files: `src/App.jsx` (React components), `src/styles.css`, `src/data/activities.js`, `src/data/vocab.js`, `src/data/doNow.js`. Verify the extracted source produces identical output. |
| **Risk** | HIGH — the custom bundler format is non-standard; source may not cleanly separate into files |
| **Business Impact** | CRITICAL — unblocks all subsequent technical work |
| **Dependencies** | Phase 1 complete (app.html renamed from index.html); Phase 0 complete |
| **Success Criteria** | All extracted `.jsx` and `.js` files are syntactically valid; the app produces identical output when built from extracted source vs. current bundle |
| **Test Plan** | Run `npm run dev` with Vite and verify every feature works: Today view, Library, Build, Projector mode, On This Day, Word of the Day, Do Now, cloud sync. Check all 14 category types. |
| **Rollback** | Keep `app.html` (original bundle) intact throughout extraction; do not delete it until Phase 2 is confirmed working |
| **Recommended Claude Product** | Claude Code |

---

### Task BP-2: Set Up Vite + React Build

| Field | Detail |
|---|---|
| **Purpose** | Replace the custom bundler with standard Vite tooling |
| **Files involved** | `package.json`, `vite.config.js`, `index.html` (Vite entry), `src/main.jsx` |
| **Exact work** | Install `vite`, `@vitejs/plugin-react`. Create `vite.config.js` with `build.outDir: 'dist'`. Create `src/main.jsx` as React entry point. Move extracted source to `src/` directory structure. Confirm `npm run build` produces a `dist/` directory. |
| **Risk** | MEDIUM |
| **Business Impact** | CRITICAL |
| **Dependencies** | Task BP-1 (extracted source) |
| **Success Criteria** | `npm run build` succeeds; `dist/` contains `index.html` and hashed JS/CSS bundles; bundle size under 400KB (from current 1.59MB) |
| **Test Plan** | `npm run preview` serves the built app locally; verify all features work from `dist/` |
| **Rollback** | Keep original `app.html` intact; revert `package.json` and remove `vite.config.js` |
| **Recommended Claude Product** | Claude Code |

---

### Task BP-3: Update netlify.toml with Build Configuration

| Field | Detail |
|---|---|
| **Purpose** | Tell Netlify to run the build command and serve from `dist/` |
| **Files involved** | `netlify.toml` |
| **Exact work** | Add `[build]` section: `command = "npm run build"`, `publish = "dist"`. Verify functions directory still points to `netlify/functions`. Verify `[[redirects]]` SPA rule still applies to `dist/`. |
| **Risk** | MEDIUM |
| **Business Impact** | HIGH |
| **Dependencies** | Task BP-2 (Vite build working) |
| **Success Criteria** | Netlify build log shows successful `vite build`; site served from `dist/`; all features working in Netlify deploy preview |
| **Test Plan** | Trigger a deploy preview on Netlify; walk through all 6 major features |
| **Rollback** | Remove `[build]` section from `netlify.toml`; Netlify falls back to serving repository root |
| **Recommended Claude Product** | Claude Code |

---

### Task BP-4: Add Environment Variable Infrastructure

| Field | Detail |
|---|---|
| **Purpose** | Establish env var patterns for Firebase and Stripe before they are needed |
| **Files involved** | `.env.example`, `vite.config.js`, `.gitignore` |
| **Exact work** | Create `.env.example` with all required future variables (see `STRIPE_READINESS_REPORT.md §Required Environment Variables`). Confirm `.env.local` is in `.gitignore`. Document env var injection pattern using `import.meta.env.VITE_*` for frontend variables. |
| **Risk** | LOW |
| **Business Impact** | HIGH — prevents accidental secret commits in Phases 3-5 |
| **Dependencies** | Task BP-2 |
| **Success Criteria** | `.env.example` committed; `.env.local` gitignored; README documents env var setup |
| **Test Plan** | Confirm `git ls-files .env*` does not include any real secrets |
| **Rollback** | N/A — additive only |
| **Recommended Claude Product** | Claude Code |

---

### Phase 2 Decision Gate

Before proceeding to Phase 3, confirm all of the following:
- [ ] React source fully extracted from custom bundler into `src/` directory
- [ ] `npm run build` succeeds and produces `dist/` output
- [ ] `npm run dev` runs locally with all features working
- [ ] Netlify deploy preview from `dist/` with all features verified
- [ ] Bundle size ≤ 400KB (from 1.59MB — measure with `npx vite-bundle-analyzer`)
- [ ] Original `app.html` (custom bundle) still exists as a rollback artifact
- [ ] `.env.example` committed; `.env.local` gitignored
- [ ] `netlify.toml` `[build]` section configured and tested

---

## Phase 3 — Firebase Auth

**Goal:** Replace the device-locked localStorage identity system with real Firebase Auth user accounts that work across devices.

**Why here:** Firebase Auth is the prerequisite for Stripe, multi-device sync, school licensing, and password reset. It cannot be safely added to the old custom-bundled app. The build pipeline (Phase 2) must be in place first so Firebase SDK can be installed as a proper npm package with env var injection.

**Source files:** `ARCHITECTURE_STATE_REPORT.md §4`, `STRIPE_READINESS_REPORT.md §Prerequisites`, `UX_UI_STATE_REPORT.md Issues 9 and 10`

---

### Auth Model

```
Firebase Auth (Email/Password provider)
  - Email verification: required before core features are accessible
  - Password reset: Firebase built-in reset email flow
  - Session: Firebase Auth token (auto-refreshed; survives browser close)
  - Multi-device: any device with the same Firebase Auth session works

Firestore: users collection
  - Document ID: Firebase Auth UID
  - Created on first signup
  - Populated from existing localStorage data during migration if present
```

**Required Firestore user document schema (from `STRIPE_READINESS_REPORT.md §Firestore Schema`):**
```
users/{uid}
  email: string
  displayName: string
  grade: string (K-2 | 3-5 | 6-8 | 9-12)
  createdAt: Timestamp
  plan: string (free | pro | school) — default "free"
  planStatus: string (active | past_due | canceled | trialing) — default "active"
  stripeCustomerId: string — empty until Stripe Phase 5
  stripeSubscriptionId: string — empty until Stripe Phase 5
  subscriptionCurrentPeriodEnd: Timestamp — null until Stripe Phase 5
  schoolId: string — null until School tier Phase P3-future
```

---

### Task FA-1: Provision Firebase Project

| Field | Detail |
|---|---|
| **Purpose** | Create the Firebase project that will host Auth, Firestore, Functions, and Hosting |
| **Files involved** | Firebase Console (web); `.firebaserc` (created here); `firebase.json` (skeleton) |
| **Exact work** | Create Firebase project in Firebase Console. Enable Authentication (Email/Password). Enable Firestore (production mode). Create `.firebaserc` with project ID. Create skeleton `firebase.json`. Add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` to `.env.example` and to Netlify environment variables in dashboard. |
| **Risk** | LOW |
| **Business Impact** | CRITICAL — first production Firebase infrastructure |
| **Dependencies** | Phase 2 complete (build pipeline with env var support) |
| **Success Criteria** | Firebase Console shows project with Auth and Firestore enabled; Firebase env vars present in Netlify env settings |
| **Test Plan** | `firebase projects:list` shows the project; `.firebaserc` committed to repo |
| **Rollback** | Remove Firebase project (no user data yet); revert `.firebaserc` |
| **Recommended Claude Product** | Claude Code |

---

### Task FA-2: Implement Firebase Auth in React App

| Field | Detail |
|---|---|
| **Purpose** | Replace localStorage auth with Firebase Auth SDK |
| **Files involved** | `src/firebase.js` (new), `src/auth/AuthScreen.jsx` (rewrite), `src/auth/useAuth.js` (new hook), `src/App.jsx` (root component update) |
| **Exact work** | Install `firebase` SDK. Initialize Firebase app in `src/firebase.js`. Rewrite `AuthScreen` component: signup with `createUserWithEmailAndPassword` → send verification email → create Firestore user doc. Login with `signInWithEmailAndPassword`. Add `sendPasswordResetEmail` link on login form. Remove all `localStorage["ofd:account"]` and `localStorage["ofd:session"]` auth logic. Replace with `onAuthStateChanged` observer. |
| **Risk** | HIGH — rewrites the entire auth system |
| **Business Impact** | CRITICAL |
| **Dependencies** | Task FA-1; Phase 2 complete |
| **Success Criteria** | User can sign up, verify email, sign in, reset password, sign out; same account accessible on two different devices |
| **Test Plan** | Sign up → check for verification email → verify → sign in → add a custom activity → sign out → sign in on a different browser → confirm activity is still there |
| **Rollback** | Revert to the old AuthScreen component; restore localStorage auth logic |
| **Recommended Claude Product** | Claude Code |

---

### Task FA-3: Migrate User Data from localStorage to Firestore

| Field | Detail |
|---|---|
| **Purpose** | Preserve existing user data (custom activities, saved routines, favorites) during auth migration |
| **Files involved** | `src/auth/migration.js` (new), `src/data/storage.js` (update) |
| **Exact work** | On first Firebase Auth sign-in for a teacher who has existing localStorage data (`ofd:favorites`, `ofd:customActivities`, `ofd:routines`), read the localStorage data and write it to Firestore under the new UID. Mark migration as complete with `ofd:migrated = true`. Do not delete localStorage data until migration is confirmed. |
| **Risk** | MEDIUM — data migration is irreversible if done wrong |
| **Business Impact** | HIGH — prevents existing users from losing their saved content |
| **Dependencies** | Task FA-2 |
| **Success Criteria** | After signing in with Firebase Auth, all previous custom activities and saved routines are present |
| **Test Plan** | Create data in old system → upgrade to Firebase Auth → verify all data present in Firestore and in the app UI |
| **Rollback** | localStorage data is preserved until `ofd:migrated` is set; revert Firestore writes if migration fails |
| **Recommended Claude Product** | Claude Code |

---

### Task FA-4: Replace Cloud Sync (Netlify Blobs → Firestore)

| Field | Detail |
|---|---|
| **Purpose** | Replace the opaque syncKey-based Netlify Blobs sync with Firestore sync tied to the Firebase Auth UID |
| **Files involved** | `netlify/functions/sync.js` (deprecated), `src/data/sync.js` (rewrite using Firestore SDK direct), `src/firebase.js` |
| **Exact work** | Remove all references to `/.netlify/functions/sync`. Replace with Firestore real-time listeners on `users/{uid}`. Sync favorites, customActivities, savedRoutines to subcollections under the user's Firestore document. Remove the sync key concept from the UI. |
| **Risk** | MEDIUM |
| **Business Impact** | HIGH — eliminates the confusing sync key UX; enables true cross-device sync |
| **Dependencies** | Task FA-2 (Firebase Auth); Task FA-3 (migration) |
| **Success Criteria** | Changes made on Device A appear on Device B within 2 seconds; "What is a sync key?" is no longer a question the UI raises |
| **Test Plan** | Add a custom activity on one device; within 5 seconds, verify it appears on a second browser session |
| **Rollback** | Restore `/.netlify/functions/sync` calls; Netlify Blobs are still functional as the old sync backend |
| **Recommended Claude Product** | Claude Code |

---

### Phase 3 Decision Gate

Before proceeding to Phase 4, confirm all of the following:
- [ ] User can sign up with email/password via Firebase Auth
- [ ] Email verification email is received and works
- [ ] Password reset flow works end-to-end
- [ ] User can sign in on two different devices and see the same data
- [ ] Firestore `users/{uid}` document created on signup
- [ ] localStorage auth data migration working for existing users
- [ ] Netlify Blobs sync fully replaced by Firestore sync
- [ ] `/.netlify/functions/sync` route still responds (for any old clients) but is deprecated
- [ ] `localStorage["ofd:account"]` no longer stores password hash
- [ ] No Firebase API keys committed to git (only in `.env.local` and Netlify env vars)

---

## Phase 4 — Firebase Hosting Migration

**Goal:** Move production hosting from Netlify to Firebase Hosting, consolidating on a single platform with Firebase Auth and Firestore.

**Why here:** Firebase Hosting requires the build pipeline (Phase 2) and Firebase Functions (replacing Netlify Functions). Firebase Auth (Phase 3) must be working before migrating the hosting so auth remains uninterrupted during the cutover. The Netlify Functions must be rewritten as Firebase Functions before Netlify can be retired.

**Source files:** `FIREBASE_HOSTING_MIGRATION_PLAN.md`, `HOSTING_STATE_REPORT.md § Firebase Hosting Readiness`

---

### Task FH-1: Create firebase.json and .firebaserc

| Field | Detail |
|---|---|
| **Purpose** | Configure Firebase Hosting with SPA rewrites, headers, and caching |
| **Files involved** | `firebase.json` (new), `.firebaserc` (update from FA-1 skeleton) |
| **Exact work** | Write `firebase.json` per `FIREBASE_HOSTING_MIGRATION_PLAN.md`. Include: `hosting.public: "dist"`, SPA rewrite (`source: "**"`, `destination: "/index.html"`), all security headers from current `netlify.toml` ported to Firebase format, `Cache-Control` headers for assets, Functions rewrites for `/on-this-day` and `/sync` endpoints. |
| **Risk** | LOW |
| **Business Impact** | MEDIUM — prerequisite for all Firebase Hosting tasks |
| **Dependencies** | Task FA-1 (Firebase project provisioned); Phase 2 (build pipeline outputting to `dist/`) |
| **Success Criteria** | `firebase hosting:channel:deploy oftheday-migration` deploys successfully to a preview channel |
| **Test Plan** | Open the preview channel URL; verify app loads; verify headers are correct with `curl -I <preview-url>` |
| **Rollback** | Netlify deployment is untouched; simply do not cut over DNS until preview is verified |
| **Recommended Claude Product** | Claude Code |

---

### Task FH-2: Rewrite Netlify Functions as Firebase Functions

| Field | Detail |
|---|---|
| **Purpose** | Replace the 2 Netlify Functions with Firebase Functions so the app has no Netlify dependencies |
| **Files involved** | `functions/index.js` (new Firebase Functions), `functions/package.json` (new), `netlify/functions/on-this-day.js` (to be deprecated), `netlify/functions/sync.js` (already deprecated in Phase 3) |
| **Exact work** | Create Firebase Function for `onThisDay` that replicates current `netlify/functions/on-this-day.js` logic. The `sync` function is already replaced by Firestore in Phase 3. Update frontend API calls from `/.netlify/functions/on-this-day` to the new Firebase Functions HTTPS endpoint. Add function rewrite to `firebase.json`. |
| **Risk** | MEDIUM |
| **Business Impact** | HIGH — required to fully retire Netlify |
| **Dependencies** | Task FH-1; Firebase project with Functions enabled |
| **Success Criteria** | On This Day panel loads in the app served from Firebase Hosting preview channel |
| **Test Plan** | Visit the preview channel URL on today's date; verify On This Day panel shows historical facts |
| **Rollback** | Revert frontend API call URL back to `/.netlify/functions/on-this-day`; Netlify deployment is still live |
| **Recommended Claude Product** | Claude Code |

---

### Task FH-3: Preview Channel Verification

| Field | Detail |
|---|---|
| **Purpose** | Fully verify the Firebase-hosted version before cutting over DNS |
| **Files involved** | Firebase Console, CI/deployment config |
| **Exact work** | Run: `firebase hosting:channel:deploy oftheday-migration`. Walk through every feature at the preview URL. Verify: auth, cloud sync, On This Day, Word of the Day, Do Now, projector mode (same device), routing (no 404s), mobile layout. |
| **Risk** | LOW — DNS not yet changed; Netlify still live |
| **Business Impact** | CRITICAL — confirms the migration is safe before any traffic is cut over |
| **Dependencies** | Tasks FH-1 and FH-2 |
| **Success Criteria** | All features work at the Firebase preview channel URL; no console errors; headers verified |
| **Test Plan** | Full regression test on the preview channel; test with a fresh account; test with a migrated account |
| **Rollback** | Simply do not proceed to FH-4 if any feature fails |
| **Recommended Claude Product** | Claude Code |

---

### Task FH-4: DNS Cutover to Firebase Hosting

| Field | Detail |
|---|---|
| **Purpose** | Point `oftheday.net` to Firebase Hosting instead of Netlify |
| **Files involved** | DNS provider settings; Firebase Hosting domain configuration |
| **Exact work** | Add custom domain in Firebase Hosting console; update DNS A/CNAME records to Firebase values. Wait for SSL provisioning. Verify `https://oftheday.net` now serves from Firebase. Keep Netlify site active for 2 weeks as rollback option. |
| **Risk** | MEDIUM — DNS changes are visible to all users |
| **Business Impact** | HIGH — consolidates on Firebase platform |
| **Dependencies** | Task FH-3 (preview channel fully verified) |
| **Success Criteria** | `https://oftheday.net` serves from Firebase; `curl -I` shows Firebase headers; all features work |
| **Test Plan** | Visit production URL from multiple browsers; verify no 404s; verify On This Day, auth, projector all work |
| **Rollback** | Revert DNS records back to Netlify values (Netlify deployment is untouched); DNS TTL-dependent (set TTL to 300 before the cutover for fast rollback) |
| **Recommended Claude Product** | Claude Code |

---

### Phase 4 Decision Gate

Before proceeding to Phase 5, confirm all of the following:
- [ ] `firebase hosting:channel:deploy oftheday-migration` succeeded
- [ ] All features verified at preview channel URL
- [ ] DNS cut over to Firebase; Netlify no longer serving production traffic
- [ ] Firebase Functions (`onThisDay`) working in production
- [ ] Netlify Functions deprecated and removable (Phase 3 already removed sync.js dependency)
- [ ] SSL valid for `oftheday.net` on Firebase Hosting
- [ ] Security headers verified with `curl -I`
- [ ] Netlify site kept active for minimum 2 weeks as emergency rollback

---

## Phase 5 — Stripe Payment Layer

**Goal:** Add paid subscriptions (Free and Pro Teacher tiers) using Stripe Checkout with Firebase Functions backend.

**Why last:** Stripe requires every previous phase to be complete. It requires server-verified identity (Firebase Auth), a user database (Firestore), server-side functions (Firebase Functions), and a build pipeline for env var injection. Attempting Stripe before any of these is impossible.

**Source files:** `STRIPE_READINESS_REPORT.md`, `PRODUCT_IDENTITY_REPORT.md §Monetization Potential`

---

### Stripe Architecture Decision

**Use Stripe Checkout (hosted page), not embedded payments.** Reasons:
- Hosted Checkout handles SCA/3DS compliance automatically
- No PCI scope for Firebase Functions
- Faster to implement than embedded form
- Mobile-optimized out of the box

**Required Stripe products (from `STRIPE_READINESS_REPORT.md`):**
```
Product: "OfTheDay Pro Teacher"
  Price 1: $9.00/month recurring
  Price 2: $79.00/year recurring

Product: "OfTheDay School"  (build after 100 Pro subscribers)
  Price 1: $199.00/year recurring
```

---

### Task ST-1: Create Stripe Account and Products

| Field | Detail |
|---|---|
| **Purpose** | Create the Stripe account, define products and prices, get API keys |
| **Files involved** | Stripe Dashboard (web); `.env.example` updated; Netlify/Firebase env vars updated |
| **Exact work** | Create Stripe account. Create Pro Teacher product with monthly and yearly prices. Enable test mode initially. Copy publishable key and secret key. Add to Firebase Functions env config (secret key) and Vite env (publishable key). |
| **Risk** | LOW |
| **Business Impact** | CRITICAL — no Stripe without this |
| **Dependencies** | Phase 4 complete; `.env.example` pattern established |
| **Success Criteria** | Stripe Dashboard shows products and prices; API keys in Firebase Functions config (NOT in git) |
| **Test Plan** | Verify keys are accessible in Firebase Functions emulator; verify keys are NOT in any committed file |
| **Rollback** | Delete Stripe products; remove env vars |
| **Recommended Claude Product** | Claude Code |

---

### Task ST-2: Implement Firebase Functions for Stripe

| Field | Detail |
|---|---|
| **Purpose** | Build the server-side Stripe API layer |
| **Files involved** | `functions/src/createCheckoutSession.js`, `functions/src/stripeWebhook.js`, `functions/src/createPortalSession.js` |
| **Exact work** | Implement 3 Firebase Functions per code samples in `STRIPE_READINESS_REPORT.md §Required Firebase Functions`: `createCheckoutSession` (creates Stripe Checkout session for authenticated user), `stripeWebhook` (handles Stripe events → updates Firestore `users/{uid}` plan field), `createPortalSession` (opens Stripe billing portal). Register webhook URL in Stripe Dashboard pointing to the `stripeWebhook` function endpoint. |
| **Risk** | MEDIUM |
| **Business Impact** | CRITICAL |
| **Dependencies** | Task ST-1; Phase 3 complete (Firestore `users` collection established) |
| **Success Criteria** | Calling `createCheckoutSession` in test mode returns a Stripe Checkout URL; completing test checkout updates `users/{uid}.plan` in Firestore |
| **Test Plan** | Use Stripe test cards (4242 4242 4242 4242) to complete full checkout flow; verify Firestore user doc updated to `plan: 'pro'`; verify webhook received in Stripe Dashboard |
| **Rollback** | Remove or disable Firebase Functions; remove webhook from Stripe Dashboard |
| **Recommended Claude Product** | Claude Code |

---

### Task ST-3: Build Pricing Page

| Field | Detail |
|---|---|
| **Purpose** | Create the page where teachers upgrade from Free to Pro |
| **Files involved** | `src/pages/Pricing.jsx` (new), `src/App.jsx` (route addition) |
| **Exact work** | Build a pricing page showing Free / Pro / School cards per `LANDING_PAGE_AUDIT.md §Pricing Preview` and `PRODUCT_IDENTITY_REPORT.md §Monetization`. "Start Pro" button calls `createCheckoutSession` with the selected price ID. School tier shows "Contact Us" link (non-functional). Add pricing page link to landing page nav and sidebar footer. |
| **Risk** | LOW |
| **Business Impact** | CRITICAL — this is where money enters the funnel |
| **Dependencies** | Task ST-2 (Checkout session function working); Firebase Auth (user must be signed in to initiate checkout) |
| **Success Criteria** | Pricing page renders; clicking "Start Pro Monthly" in test mode redirects to Stripe Checkout test page |
| **Test Plan** | Complete test checkout with Stripe test card; verify redirect back to `/app?checkout=success`; verify success message shown |
| **Rollback** | Remove route from App.jsx; pricing page is unreachable but harmless |
| **Recommended Claude Product** | Claude Code |

---

### Task ST-4: Implement Free/Pro Feature Gates

| Field | Detail |
|---|---|
| **Purpose** | Enforce the Free tier limits; surface upgrade prompts at the right moments |
| **Files involved** | `src/components/RequiresPro.jsx` (new), `src/hooks/usePlan.js` (new), gated feature components |
| **Exact work** | Create `usePlan()` hook that reads `users/{uid}.plan` from Firestore. Create `<RequiresPro>` wrapper component per code sample in `STRIPE_READINESS_REPORT.md §Frontend Changes`. Gate these features behind Pro: projector mode (highest-value), unlimited routines (>3 saved), unlimited custom activities (>1), cloud sync, Word of the Day, Do Now, On This Day. Free tier: Today view, basic library, 3 routines, 1 custom activity. |
| **Risk** | MEDIUM — feature gating can frustrate existing free users |
| **Business Impact** | HIGH — without gates, there is no reason to upgrade |
| **Dependencies** | Task ST-3 (pricing page exists); Firebase Auth; Firestore user docs |
| **Success Criteria** | Free user attempting projector mode sees `<UpgradePrompt>` component with link to pricing page; Pro user has unrestricted access to all features |
| **Test Plan** | Log in as free-tier user; verify projector mode blocked; click upgrade → pricing page → complete test checkout → verify projector mode now accessible |
| **Rollback** | Remove `<RequiresPro>` wrappers; all features revert to unrestricted access |
| **Recommended Claude Product** | Claude Code |

---

### Task ST-5: Test Mode Verification → Production Launch

| Field | Detail |
|---|---|
| **Purpose** | Verify the entire payment flow end-to-end in Stripe test mode before enabling real payments |
| **Files involved** | Stripe Dashboard; Firebase Console; `functions/` |
| **Exact work** | Run complete test scenarios: (1) Free user signs up, accesses free features, hits Pro gate, upgrades via Checkout, gains Pro access. (2) Pro user cancels subscription via Billing Portal, loses Pro access after period ends. (3) Webhook retry handling (simulate failed webhook delivery in Stripe Dashboard). Switch Stripe to live mode only after all scenarios pass. Update env vars with live keys. |
| **Risk** | HIGH — live Stripe keys mean real charges |
| **Business Impact** | CRITICAL |
| **Dependencies** | Tasks ST-1 through ST-4 |
| **Success Criteria** | All 3 test scenarios pass; webhook idempotency confirmed; no double-charges in test logs |
| **Test Plan** | See STRIPE_READINESS_REPORT.md §Implementation Phases — Phase 3 |
| **Rollback** | Stay in test mode; do not switch to live keys until all scenarios pass; Stripe test mode is safe |
| **Recommended Claude Product** | Claude Code |

---

### Phase 5 Decision Gate

Before declaring commercial launch:
- [ ] Stripe test checkout completes and updates Firestore `plan` field
- [ ] Pro features are gated and upgrade prompts are shown
- [ ] Cancellation flow tested (Stripe portal → plan reverts to free)
- [ ] Webhook signature validation confirmed
- [ ] Webhook idempotency confirmed (same event processed twice = no duplicate)
- [ ] Stripe secret key confirmed NOT in git history
- [ ] Live mode keys configured in Firebase Functions env (not in code)
- [ ] Pricing page live and linked from landing page
- [ ] Email capture list from Phase 1 notified of launch

---

## Full Task Breakdown Summary

| Task | Phase | Priority | Risk | Effort | Business Impact |
|---|---|---|---|---|---|
| P0-1: SPA redirect rule | Phase 0 | P0 | LOW | 5 min | MEDIUM |
| P0-2: Delete duplicate HTML | Phase 0 | P0 | LOW | 5 min | LOW |
| P0-3: HTTPS/HSTS headers | Phase 0 | P0 | LOW | 15 min | LOW |
| P0-4: Cache-Control headers | Phase 0 | P0 | LOW | 15 min | MEDIUM |
| P0-5: Branch strategy | Phase 0 | P0 | LOW | 1 hr | MEDIUM |
| LP-1: Static landing page | Phase 1 | P0 | LOW | 3–5 days | CRITICAL |
| LP-2: SEO basics | Phase 1 | P0 | LOW | 4 hrs | HIGH |
| LP-3: Auth screen context | Phase 1 | P1 | MEDIUM | 2–4 hrs | HIGH |
| LP-4: Email list capture | Phase 1 | P1 | LOW | 2 hrs | HIGH |
| BP-1: Extract React source | Phase 2 | P1 | HIGH | 3–5 days | CRITICAL |
| BP-2: Vite + React setup | Phase 2 | P1 | MEDIUM | 2–3 days | CRITICAL |
| BP-3: Update netlify.toml | Phase 2 | P1 | MEDIUM | 2 hrs | HIGH |
| BP-4: Env var infrastructure | Phase 2 | P1 | LOW | 2 hrs | HIGH |
| FA-1: Provision Firebase | Phase 3 | P2 | LOW | 2 hrs | CRITICAL |
| FA-2: Firebase Auth implementation | Phase 3 | P2 | HIGH | 5–8 days | CRITICAL |
| FA-3: User data migration | Phase 3 | P2 | MEDIUM | 2–3 days | HIGH |
| FA-4: Firestore sync replacement | Phase 3 | P2 | MEDIUM | 2–3 days | HIGH |
| FH-1: firebase.json/.firebaserc | Phase 4 | P2 | LOW | 4 hrs | MEDIUM |
| FH-2: Rewrite Netlify Functions | Phase 4 | P2 | MEDIUM | 2–3 days | HIGH |
| FH-3: Preview channel verification | Phase 4 | P2 | LOW | 4 hrs | CRITICAL |
| FH-4: DNS cutover | Phase 4 | P2 | MEDIUM | 2 hrs | HIGH |
| ST-1: Stripe account + products | Phase 5 | P2 | LOW | 2 hrs | CRITICAL |
| ST-2: Firebase Functions for Stripe | Phase 5 | P2 | MEDIUM | 3–4 days | CRITICAL |
| ST-3: Pricing page | Phase 5 | P2 | LOW | 1–2 days | CRITICAL |
| ST-4: Feature gates | Phase 5 | P2 | MEDIUM | 2–3 days | HIGH |
| ST-5: Test mode → live | Phase 5 | P2 | HIGH | 1 day | CRITICAL |

---

## Decision Gates Summary

### Gate 0 → 1: Before Landing Page
- [ ] `netlify.toml` SPA redirect working
- [ ] Duplicate `of-the-day-netlify.html` deleted
- [ ] HTTPS redirect version-controlled
- [ ] Feature branch strategy in place

### Gate 1 → 2: Before Build Pipeline
- [ ] Landing page live at `https://oftheday.net`
- [ ] App accessible at `/app`
- [ ] CTA flows correctly
- [ ] Mobile rendering verified (320px–1440px)
- [ ] Lighthouse SEO ≥ 90
- [ ] Email list capturing submissions

### Gate 2 → 3: Before Firebase Auth
- [ ] `npm run build` succeeds
- [ ] `dist/` output serves all features correctly
- [ ] Bundle size ≤ 400KB
- [ ] Netlify deploy preview from `dist/` verified
- [ ] `.env.example` committed; real secrets gitignored
- [ ] Original bundle preserved as rollback artifact

### Gate 3 → 4: Before Firebase Hosting
- [ ] Firebase Auth signup/login/reset works
- [ ] Email verification works
- [ ] Multi-device sync via Firestore confirmed
- [ ] Firestore `users/{uid}` document created on signup
- [ ] localStorage auth no longer stores password hash
- [ ] Data migration from localStorage working

### Gate 4 → 5: Before Stripe
- [ ] Firebase Hosting preview channel verified
- [ ] DNS cutover to Firebase complete
- [ ] Firebase Functions (`onThisDay`) working in production
- [ ] Netlify no longer serving production traffic
- [ ] All features working on Firebase production URL
- [ ] Firebase Functions deployed and callable

---

## Implementation Prompts

### Prompt for Phase 0

```
Implement Phase 0 of the OfTheDay.net execution plan.

Working branch: `claude/activity-of-day-app-2JlTT`
Files to touch: netlify.toml only (plus deleting of-the-day-netlify.html)

Tasks:
1. Add [[redirects]] SPA rule to netlify.toml: from "/*", to "/index.html", status 200
2. Add HTTP→HTTPS redirect rule to netlify.toml
3. Add Strict-Transport-Security and Permissions-Policy headers to netlify.toml [[headers]]
4. Add Cache-Control headers: /assets/* immutable long-lived; /*.html no-cache
5. Delete of-the-day-netlify.html (confirm it is bit-for-bit identical to index.html first)

Constraints:
- Do not touch index.html or any app code
- Do not deploy to production
- Do not change DNS
- Do not add any other changes

After completing:
- Run `node -c netlify/functions/on-this-day.js && node -c netlify/functions/sync.js` (the existing test command)
- Show a diff summary of every change made
- Confirm index.html is unchanged

Stop after Phase 0 is complete.
```

---

### Prompt for Phase 1

```
Implement Phase 1 of the OfTheDay.net execution plan: the landing page.

Working branch: `feat/landing-page` (branch from main after Phase 0 is merged)
Reference file: LANDING_PAGE_AUDIT.md (all copy direction and section structure is there)

Tasks:
1. Rename the existing index.html to app.html (the React app moves here)
2. Update netlify.toml [[redirects]]: /app → /app.html (status 200), /* → /index.html (status 200)
3. Create a new static index.html as the landing page with all 11 sections from LANDING_PAGE_AUDIT.md
4. Add all SEO tags from LANDING_PAGE_AUDIT.md §SEO Recommendations (title, meta, OG, Twitter, JSON-LD schema)
5. Create sitemap.xml listing / and /app
6. Create robots.txt allowing landing page, disallowing /app/*
7. Add a ConvertKit/Mailchimp email capture form placeholder in the hero CTA area

Constraints:
- Do not touch app.html (the React app) content
- Do not modify any netlify/functions files
- Do not deploy to production
- Landing page must be pure static HTML (no React, no build step required)
- All copy must come from LANDING_PAGE_AUDIT.md — do not invent copy

After completing:
- Verify all 11 sections present in index.html
- Verify /app route correctly serves app.html
- Show Lighthouse score estimate for the landing page
- Show full diff of every file changed

Stop after Phase 1 is complete.
```

---

### Prompt for Phase 2

```
Implement Phase 2 of the OfTheDay.net execution plan: the build pipeline.

Working branch: `feat/build-pipeline`
Reference files: ARCHITECTURE_STATE_REPORT.md, FOUNDER_STATE_REPORT.md

IMPORTANT: This phase starts with extracting the React source from the custom bundler.
The app source is locked inside index.html (or app.html after Phase 1) in a compressed bundle.
Read the file carefully before touching anything.

Tasks:
1. Write a Node.js extraction script (scripts/extract-bundle.js) that reads app.html,
   finds the <script type="__bundler/template"> tag, JSON.parses the content, and writes
   the extracted HTML to src/ as separate files: App.jsx, styles.css, data/activities.js, etc.
2. Verify extracted source is syntactically valid JSX
3. Set up Vite + @vitejs/plugin-react. Create vite.config.js with build.outDir: 'dist'
4. Create src/main.jsx as React entry point
5. Run npm run build — confirm dist/ is produced
6. Add [build] section to netlify.toml: command = "npm run build", publish = "dist"
7. Create .env.example with all future env var placeholders from STRIPE_READINESS_REPORT.md
8. Confirm .env.local is in .gitignore

Constraints:
- DO NOT delete app.html (original bundle) until this phase is 100% confirmed working
- DO NOT deploy until build is verified locally via npm run preview
- DO NOT modify netlify/functions files
- Bundle size target: under 400KB (measure with npx vite-bundle-analyzer)
- All existing features must work after the extraction

After completing:
- Show `npm run build` output including final bundle sizes
- Show feature verification checklist (Today view, Library, Build, Projector, On This Day, Word of the Day, Do Now, auth)
- Show full diff of every new/changed file

Stop after Phase 2 is complete and verified.
```

---

### Prompt for Phase 3

```
Implement Phase 3 of the OfTheDay.net execution plan: Firebase Auth.

Working branch: `feat/firebase-auth`
Reference files: ARCHITECTURE_STATE_REPORT.md §4, STRIPE_READINESS_REPORT.md §Firestore Schema

Prerequisites that must be true before starting:
- Phase 2 (build pipeline) is merged and working
- Firebase project exists with Auth (Email/Password) and Firestore enabled
- Firebase env vars are in .env.local and in deployment env settings

Tasks:
1. Install firebase SDK: npm install firebase
2. Create src/firebase.js — initialize Firebase app from VITE_ env vars
3. Create src/hooks/useAuth.js — onAuthStateChanged hook
4. Rewrite src/auth/AuthScreen.jsx:
   - Signup: createUserWithEmailAndPassword → sendEmailVerification → create Firestore users/{uid} doc
   - Login: signInWithEmailAndPassword
   - Password reset: sendPasswordResetEmail link on login form
   - Remove ALL localStorage["ofd:account"] and localStorage["ofd:session"] logic
5. Create src/auth/migration.js — on first Firebase sign-in, check for existing ofd:* localStorage keys, write them to Firestore, set localStorage["ofd:migrated"] = true
6. Replace Netlify Blobs sync (/.netlify/functions/sync calls) with Firestore real-time listeners
7. Firestore user document schema must match exactly: STRIPE_READINESS_REPORT.md §Firestore Schema

Constraints:
- Do not delete localStorage["ofd:favorites"] etc. until migration is confirmed
- Do not commit Firebase secret keys to git — use .env.local only
- Do not implement Stripe in this phase
- Do not implement feature gates in this phase — all features remain accessible to all users

After completing:
- Show signup → email verification → login → multi-device sync test results
- Show Firestore user document created in Firebase Console
- Show full diff of every file changed

Stop after Phase 3 is complete and verified.
```

---

### Prompt for Phase 4

```
Implement Phase 4 of the OfTheDay.net execution plan: Firebase Hosting migration.

Working branch: `feat/firebase-hosting`
Reference files: FIREBASE_HOSTING_MIGRATION_PLAN.md, HOSTING_STATE_REPORT.md

Prerequisites:
- Phase 2 (build pipeline) working — npm run build outputs to dist/
- Phase 3 (Firebase Auth) working — Firebase project exists
- firebase CLI installed: npm install -g firebase-tools

Tasks:
1. Create firebase.json:
   - hosting.public: "dist"
   - SPA rewrite: source "**", destination "/index.html"
   - Port all headers from netlify.toml to Firebase hosting format
   - Add Cache-Control headers for /assets/*
   - Add Functions rewrite for /on-this-day endpoint
2. Update .firebaserc with correct project ID
3. Rewrite netlify/functions/on-this-day.js as a Firebase Function in functions/index.js
   (sync.js was replaced in Phase 3 by Firestore)
4. Install functions/package.json with firebase-admin and firebase-functions
5. Run: firebase hosting:channel:deploy oftheday-migration
6. Verify ALL features at the preview channel URL
7. If all features pass, proceed with DNS cutover (add domain in Firebase Console, update DNS records)
8. Set DNS TTL to 300 BEFORE cutover for fast rollback capability

DO NOT:
- Do not delete Netlify site — keep as rollback for 2 weeks
- Do not change DNS until preview channel is fully verified
- Do not touch Stripe in this phase

After completing:
- Show firebase hosting:channel:deploy output
- Show feature verification checklist at preview channel URL
- Show curl -I output confirming security headers
- Show DNS change summary (what records changed and to what)

Stop after Phase 4 is complete and DNS is confirmed working.
```

---

### Prompt for Phase 5

```
Implement Phase 5 of the OfTheDay.net execution plan: Stripe payment layer.

Working branch: `feat/stripe`
Reference files: STRIPE_READINESS_REPORT.md (complete implementation guide)

Prerequisites — all must be true before starting:
- Firebase Auth working (users/{uid} docs in Firestore)
- Firebase Hosting serving production traffic
- Firebase Functions deployed
- Stripe account created, products created, API keys available
- STRIPE_SECRET_KEY in Firebase Functions environment (NOT in git)
- VITE_STRIPE_PUBLISHABLE_KEY in .env.local and deployment env settings

Tasks:
1. Install stripe: cd functions && npm install stripe
2. Implement functions/src/createCheckoutSession.js per STRIPE_READINESS_REPORT.md
3. Implement functions/src/stripeWebhook.js per STRIPE_READINESS_REPORT.md
   - Must verify webhook signature with stripe.webhooks.constructEvent
   - Must be idempotent (handle duplicate events gracefully)
   - Must update users/{uid}.plan and planStatus in Firestore on checkout.session.completed
4. Implement functions/src/createPortalSession.js per STRIPE_READINESS_REPORT.md
5. Register stripeWebhook function URL in Stripe Dashboard → Webhooks
6. Build src/pages/Pricing.jsx — Free / Pro / School cards, "Start Pro" calls createCheckoutSession
7. Handle ?checkout=success return URL — show success state
8. Create src/hooks/usePlan.js — reads users/{uid}.plan from Firestore
9. Create src/components/RequiresPro.jsx — wrapper component per STRIPE_READINESS_REPORT.md
10. Gate these features behind Pro: projector mode, routines >3, custom activities >1, cloud sync, Word of the Day, Do Now, On This Day
11. TEST WITH STRIPE TEST CARDS ONLY until all 3 scenarios pass:
    Scenario 1: Free → upgrade → Pro access granted
    Scenario 2: Pro → cancel → Free access after period ends
    Scenario 3: Webhook retry — same event twice = no duplicate plan change

ONLY switch to Stripe live mode after all 3 scenarios pass.

Constraints:
- NEVER commit STRIPE_SECRET_KEY to git
- NEVER call Stripe API from frontend — server-side only (Firebase Functions)
- Do not implement School tier yet — show "Contact Us" button only

After completing:
- Show all 3 test scenario results
- Confirm STRIPE_SECRET_KEY is not in git history (run: git log -p | grep sk_live)
- Show Firestore users/{uid} doc with plan: 'pro' after test checkout
- Show full diff of every file changed

Stop after Phase 5 test mode is verified. Do NOT switch to live mode in this session — report results first.
```

---

## 30-Day Execution Calendar

### Week 1 — Repo Safety + Landing Page (Days 1–7)

| Day | Task | Deliverable |
|---|---|---|
| Day 1 | Phase 0: netlify.toml quick wins | Updated netlify.toml committed; duplicate file deleted |
| Day 1 | Phase 0: Branch strategy | `feat/landing-page` branch created |
| Days 2–5 | Phase 1: Build landing page (all 11 sections) | Static `index.html` landing page live |
| Day 5 | Phase 1: SEO tags + sitemap.xml + robots.txt | Landing page indexable |
| Day 6 | Phase 1: Email list capture | Email collection live |
| Day 7 | Verify + merge landing page branch | Landing page on production |

**Week 1 Goals:** Live marketing asset at `oftheday.net`; email list capturing early adopters; all quick-win fixes deployed.

**Week 1 Risks:** Custom bundler edit (Task LP-3) may be riskier than estimated — defer if needed.

**Week 1 Success Criteria:**
- Lighthouse SEO ≥ 90 on landing page
- Email capture form accepting submissions
- Production site shows landing page at root

---

### Week 2 — Build Pipeline (Days 8–14)

| Day | Task | Deliverable |
|---|---|---|
| Days 8–9 | Phase 2: Extract React source from custom bundler | `src/` directory with valid JSX files |
| Days 10–11 | Phase 2: Vite setup + npm run build | `dist/` produced; all features work locally |
| Day 12 | Phase 2: Update netlify.toml [build] section | Netlify deploy preview from `dist/` |
| Day 12 | Phase 2: Env var infrastructure | `.env.example` committed |
| Days 13–14 | Phase 2: Regression testing | All 6 feature areas verified; bundle ≤ 400KB |

**Week 2 Goals:** Buildable app with standard tooling; source accessible for Firebase work.

**Week 2 Risks:** This is the highest-risk week. Source extraction from the custom bundler may reveal unexpected complexity. Buffer 2–3 extra days if needed. Do NOT rush this step.

**Week 2 Success Criteria:**
- `npm run build` succeeds
- Bundle size ≤ 400KB
- All features verified at Netlify deploy preview
- Original `app.html` preserved as rollback

---

### Week 3 — Firebase Auth (Days 15–21)

| Day | Task | Deliverable |
|---|---|---|
| Day 15 | Phase 3: Provision Firebase project | Firebase project with Auth + Firestore enabled |
| Days 15–16 | Phase 3: Implement Firebase Auth | Signup/login/password reset working |
| Days 17–18 | Phase 3: User data migration | localStorage data migrated to Firestore |
| Day 19 | Phase 3: Replace Netlify Blobs sync with Firestore | Multi-device sync working via Firestore |
| Days 20–21 | Phase 3: Regression testing + merge | All auth flows verified; branch merged |

**Week 3 Goals:** Real user accounts; multi-device sync; password reset; device-lock eliminated.

**Week 3 Risks:** Auth migration is technically complex and touches every part of the app. Budget extra time for edge cases (users who had localStorage data but never used cloud sync).

**Week 3 Success Criteria:**
- Same account accessible on two devices
- Email verification working
- Password reset working
- Firestore `users/{uid}` documents created
- No password hashes in localStorage

---

### Week 4 — Firebase Hosting + Stripe Test Mode (Days 22–30)

| Days | Task | Deliverable |
|---|---|---|
| Days 22–23 | Phase 4: firebase.json + Firebase Functions | `onThisDay` function deployed |
| Day 24 | Phase 4: Preview channel deploy | `oftheday-migration` preview URL verified |
| Day 25 | Phase 4: DNS cutover | `oftheday.net` on Firebase Hosting |
| Day 26 | Phase 5: Stripe account + products (test mode) | Stripe products created |
| Days 27–28 | Phase 5: Firebase Functions for Stripe | Checkout + webhook + portal implemented |
| Day 29 | Phase 5: Pricing page + feature gates | Pricing page live; Pro gates active |
| Day 30 | Phase 5: Test mode verification | All 3 payment scenarios pass |

**Week 4 Goals:** Firebase Hosting live; Stripe test mode fully functional.

**Week 4 Risks:** Do not rush DNS cutover without preview channel verification. Do not activate live Stripe keys until all test scenarios pass.

**Week 4 Success Criteria:**
- `oftheday.net` serves from Firebase
- Stripe test checkout completes and updates Firestore
- Pro feature gates working
- All 3 Stripe test scenarios pass

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Custom bundler extraction fails or produces invalid JSX | MEDIUM | CRITICAL | Budget 3 extra days; have Claude Code assist with extraction; keep original bundle as fallback |
| Firebase Auth migration breaks existing user data | MEDIUM | HIGH | Test migration script on a copy of localStorage data before running in production; preserve original localStorage until `ofd:migrated` flag is confirmed |
| Stripe webhook events missed or duplicated | LOW | MEDIUM | Implement idempotency checks using Stripe event ID; test with Stripe webhook replay tool |
| DNS cutover causes brief downtime | LOW | MEDIUM | Set TTL to 300 before cutover; keep Netlify site active for 2 weeks as rollback |
| Build pipeline increases bundle size beyond 400KB | LOW | MEDIUM | Use `npx vite-bundle-analyzer` to identify large dependencies; apply code splitting |
| Netlify Blobs data loss during migration | LOW | HIGH | Export all user sync data from Netlify Blobs before migrating; store as JSON backup files |
| Rate limiting from onthisday.com or vocabularyninja.co.uk | MEDIUM | MEDIUM | Expand fallback dataset to all 365 dates (BACKLOG-007); add retry logic; consider caching API responses in Firestore |
| School network blocks Firebase CDN | LOW | MEDIUM | Test on a school network before launch; Firebase Hosting CDN uses Google infrastructure which is generally allowed |

---

## Rollback Strategy

### Phase 0 Rollback
- Revert `netlify.toml` changes; all in version control, one `git revert`

### Phase 1 Rollback
- Rename `app.html` back to `index.html`; delete `landing.html` (or new `index.html`); revert `netlify.toml` routing changes

### Phase 2 Rollback
- Keep original `app.html` (custom bundle) intact throughout Phase 2
- Netlify `[build]` section can be removed to revert to serving original bundle
- All extracted source files are additive (new `src/` directory) — can be deleted without affecting original

### Phase 3 Rollback
- localStorage auth logic kept intact (just unused) until Phase 3 is confirmed working
- Firebase Auth can be disabled in the console
- Firestore user documents can be left in place harmlessly
- Revert `src/auth/AuthScreen.jsx` to previous version

### Phase 4 Rollback
- Netlify site is kept active for minimum 2 weeks after DNS cutover
- DNS records can be reverted to Netlify values within the TTL window (set to 300 before cutover)
- `firebase.json` and `.firebaserc` can be removed without affecting the app build

### Phase 5 Rollback
- Remove `<RequiresPro>` wrappers → all features revert to free for all users
- Disable Firebase Functions for Stripe
- Stripe subscription objects remain in Stripe; cancel all test subscriptions
- Never activate live Stripe keys until test mode is fully verified

---

## Final Recommendation

**Start Phase 0 today.** The quick wins (SPA redirect, duplicate file deletion, HTTPS headers) take under 30 minutes and have zero risk. There is no reason to delay them.

**Start Phase 1 tomorrow.** The landing page is independent of every other technical decision. A teacher who discovers OfTheDay.net today will leave without signing up because there is nothing to read. Every day without a landing page is a day where word-of-mouth and organic search produce zero conversions.

**The highest-risk phase is Phase 2 (build pipeline).** The custom bundler extraction is the hardest engineering task in this roadmap. Do not underestimate it. Do not rush it. Keep the original bundle intact until the new build is fully verified.

**The correct commercial order is:** Landing page → Build pipeline → Firebase Auth → Firebase Hosting → Stripe. Phases 1 and 2 can run in parallel (landing page as static HTML while build pipeline work is in progress).

**The fastest path to first paid users is 7–9 weeks** with focused execution. The biggest time risk is Phase 2 (build pipeline). The biggest business risk is skipping the landing page and running marketing before cold traffic has something to read.

**What should not be touched yet:** Stripe, Firebase Functions (beyond Phase 4 basics), school/district tier, analytics, AI features, PWA, native app. None of these have a clear return before first paid users are established.

**Next prompt to run:** Phase 0 — the `netlify.toml` quick wins. It is the correct starting point and takes under 30 minutes.
