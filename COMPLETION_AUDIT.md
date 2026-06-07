# Completion Audit — OfTheDay.net
Date: 2026-06-07

Status key: ✅ Complete | ⚠️ Partial | ❌ Broken | 🗑️ Legacy | 🚫 Abandoned | ❓ Unknown

---

## Authentication & Identity

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Email/password signup | ⚠️ Partial | High | Code complete; blocked by Firebase Console not enabling the provider | src/App.jsx (AuthScreen component) |
| Email/password login | ⚠️ Partial | High | Code complete; same Firebase Console blocker | src/App.jsx |
| Google OAuth (signInWithPopup) | ⚠️ Partial | High | Code complete; blocked by Firebase Console + oftheday.net not in Authorized Domains | src/App.jsx |
| Password reset email | ⚠️ Partial | High | Code complete; blocked by same Firebase Console issue | src/App.jsx |
| Friendly auth error messages | ✅ Complete | High | Handles popup-blocked, operation-not-allowed, unauthorized-domain, email-in-use, wrong-password, user-not-found; default shows error code | src/App.jsx friendlyAuthError() |
| Email verification banner | ✅ Complete | High | Amber banner for unverified email users, resend button, dismissed per session | src/App.jsx, src/styles.css |
| Sign-out | ✅ Complete | High | In ProfileSheet | src/App.jsx |
| onUserCreate Cloud Function | ❓ Unknown | Medium | Code written; unknown if deployed to Firebase | functions/index.js |
| User doc creation on auth | ✅ Complete | High | onAuthStateChanged creates doc if missing; fallback from onUserCreate | src/App.jsx, src/lib/firestore.js |
| Auth state persistence | ✅ Complete | High | Firebase Auth handles token refresh automatically | src/lib/firebase.js |

---

## Plan / Monetization / Stripe

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Trial plan (14-day) | ✅ Complete | High | trialStartedAt set on signup; usePlan checks within 14 days | src/lib/usePlan.js, functions/index.js |
| Trial countdown banner | ✅ Complete | High | Blue → amber → red based on days remaining; session-dismissible | src/App.jsx |
| Freemium tier enforcement | ✅ Complete | High | usePlan is single source of truth; 3 routines, 1 custom activity for free | src/lib/usePlan.js |
| Locked activity UI (Pro badge) | ✅ Complete | High | Gold badge on locked cards; Use Today / Add to Routine trigger upgrade modal | src/App.jsx |
| Upgrade modal | ✅ Complete | High | Opens on locked feature tap; links to /upgrade | src/App.jsx |
| UpgradePage (/upgrade) | ✅ Complete | High | Calls createCheckoutSession; displays pricing | src/App.jsx |
| Stripe checkout session creation | ⚠️ Partial | High | Code complete and tested; test mode only | functions/index.js |
| Stripe webhook handler | ⚠️ Partial | High | Code complete; NOT registered in Stripe Dashboard; STRIPE_WEBHOOK_SECRET not set | functions/index.js |
| Subscription lifecycle (checkout.completed) | ⚠️ Partial | High | Code complete; sets tier:'pro'; requires webhook to be live | functions/index.js |
| Subscription update handler | ⚠️ Partial | High | Code complete; updates tier + currentPeriodEnd | functions/index.js |
| Subscription cancellation handler | ⚠️ Partial | High | Code complete; sets tier:'free' | functions/index.js |
| Stripe production keys | ❌ Broken | High | test mode only; functions/.env has placeholder | functions/.env (gitignored) |
| School tier ($199/yr) | ❌ Broken | High | Landing page lists it; no backend logic; no admin dashboard; no seat management | src/LandingPage.jsx only |
| Subscription management UI | ❌ Broken | High | No cancel/manage button in app; requires Stripe Customer Portal | none |
| Manual plan override (plan:'pro') | ✅ Complete | High | Firestore field override works in usePlan | src/lib/usePlan.js |

---

## Core App Features

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Today view (daily routine) | ✅ Complete | High | Auto-selects 4 activities per grade; grade selector; refresh | src/App.jsx (MainApp) |
| Activity library / browse | ✅ Complete | High | All categories, search, filter by category/grade | src/App.jsx |
| Favorites | ✅ Complete | High | Heart icon on cards; favorites list in library | src/App.jsx |
| Build-a-Routine | ✅ Complete | High | Drag-to-reorder, save, load, 3 max (free) or unlimited (pro) | src/App.jsx |
| My Activities (custom create/edit/delete) | ✅ Complete | High | Full CRUD; 1 free, unlimited pro | src/App.jsx |
| Grade filtering | ✅ Complete | High | K–2, 3–5, 6–8, 9–12; saved to user profile | src/App.jsx |
| Word of the Day | ✅ Complete | High | Daily rotation by grade + custom word editor | src/App.jsx |
| Do Now (Math + Writing) | ✅ Complete | High | 4 problems/prompts per grade per type; custom editor | src/App.jsx |
| On This Day | ✅ Complete | High | Cloud Function + fallback facts; grade-appropriate | src/App.jsx, functions/index.js |
| Cloud sync (save snapshot) | ✅ Complete | High | Saves favorites, routines, custom content, projector style | src/lib/firestore.js |
| Cloud restore | ✅ Complete | High | Restores on login; localStorage migration | src/lib/firestore.js |
| Sidebar navigation | ✅ Complete | High | Today, Library, Build, My Activities, Settings, Profile | src/App.jsx |
| Sidebar collapse | ✅ Complete | High | 60px icon-only mode; persisted to localStorage | src/App.jsx |
| Profile sheet | ✅ Complete | High | Name, grade, plan badge, sign out; saves to Firestore | src/App.jsx |
| Settings sheet | ✅ Complete | High | Projector style, cloud sync, data export/import/reset | src/App.jsx |

---

## Projector Mode

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Full-screen projector overlay | ✅ Complete | High | Fixed position, inset 0, z-index 300 | src/App.jsx (DisplayMode) |
| Activity navigation (prev/next) | ✅ Complete | High | Bottom nav with dots | src/App.jsx |
| Timer (pause/reset) | ✅ Complete | High | Activity-time-aware; pause/resume/reset | src/App.jsx |
| Theme presets (Dark/Light/Warm/High Contrast) | ✅ Complete | High | Session-only; 4 presets | src/App.jsx |
| Font size (Small/Medium/Large/XLarge) | ✅ Complete | High | Session-only | src/App.jsx |
| Font style (Sans-Serif/Serif) | ✅ Complete | High | Session-only; Serif applies Georgia | src/App.jsx |
| Show/Hide instructions | ✅ Complete | High | Controls showStarter | src/App.jsx |
| Clean vs Guided view | ✅ Complete | High | Toggle via teacher control bar | src/App.jsx |
| Teacher control bar toggle | ✅ Complete | High | ⚙ Controls / ✕ Close | src/App.jsx |
| End Projection button | ✅ Complete | High | Red button; closes projector | src/App.jsx |
| Projector style persistence | ✅ Complete | High | Saved to users/{uid}/data/main.projectorStyle | src/lib/firestore.js |
| foundation.html (second projector window) | 🚫 Abandoned | Medium | vite.config.mjs references it; appears unused in prod | vite.config.mjs, foundation.html |

---

## Content & Data

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Activity seed pool (60 activities) | ✅ Complete | High | In scripts/activities-data.js; seeded to Firestore | scripts/activities-data.js |
| Seed script | ✅ Complete | High | Works; requires local service-account.json | scripts/seed.js |
| Vocabulary bank (per grade) | ✅ Complete | High | Daily rotation; multiple words per grade level | src/App.jsx |
| Do Now problem bank (per grade) | ✅ Complete | High | Math + Writing; per grade level | src/App.jsx |
| On This Day fallback facts | ✅ Complete | High | Hardcoded in Cloud Function as fallback | functions/index.js |
| onthisday.com scraper | ✅ Complete | High | Fetches, filters, classifies for kids | functions/index.js |

---

## Infrastructure / DevOps

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Firebase Hosting config | ✅ Complete | High | CSP headers, rewrites, cache control | firebase.json |
| Firestore security rules | ✅ Complete | High | Owner-only user docs; read-only activities | firestore.rules |
| GitHub Actions CI/CD (hosting) | ⚠️ Partial | High | Workflow exists; will fail until GitHub Secrets added | .github/workflows/deploy.yml |
| GitHub Secrets (VITE_FIREBASE_*) | ❌ Broken | Confirmed | Build logs show all 6 as empty | GitHub repo settings |
| GitHub Actions secret validation step | ✅ Complete | High | Added in commit d2de895; fails fast if secrets missing | .github/workflows/deploy.yml |
| Custom domain DNS (oftheday.net) | ❌ Broken | Confirmed | DNS points to Netlify; Firebase custom domain not configured | Netlify DNS panel |
| Functions CI/CD | ❌ Broken | High | No workflow for functions; manual deploy only | .github/workflows/ |
| Firebase Auth providers enabled | ❌ Broken | High | Sign-in methods not confirmed enabled in Console | Firebase Console |
| .firebaserc | ✅ Complete | High | default project: oftheday-c6490 | .firebaserc |
| .env.local (local dev) | ✅ Complete | High | All 6 VITE_FIREBASE_* values present | .env.local (gitignored) |

---

## Marketing / Growth

| Feature | Status | Confidence | Evidence | Files |
|---------|--------|-----------|---------|-------|
| Landing page | ✅ Complete | High | Full marketing page with hero, features, pricing, FAQ, testimonials | src/LandingPage.jsx, src/landing.css |
| Pricing table (Free/Pro/Annual) | ✅ Complete | High | In landing page | src/LandingPage.jsx |
| Email waitlist capture | ✅ Complete | High | Writes to Firestore waitlist collection | src/LandingPage.jsx |
| SEO meta tags | ✅ Complete | High | In index.html | index.html |
| robots.txt + sitemap.xml | ✅ Complete | High | In repo root | robots.txt, sitemap.xml |
| Privacy page | ✅ Complete | High | /privacy.html | privacy.html |
| Analytics (Mixpanel/Posthog) | ❌ Broken | High | Not implemented; no usage visibility | none |
| Error tracking (Sentry) | ❌ Broken | High | Not implemented | none |
| School/district outreach page | ❌ Broken | High | Not built; landing page has "contact us" link only | none |

---

## Summary Counts

| Status | Count |
|--------|-------|
| ✅ Complete | 48 |
| ⚠️ Partial (code done, infra blocked) | 9 |
| ❌ Broken / Not implemented | 17 |
| 🚫 Abandoned | 1 |
| ❓ Unknown | 1 |
| **Total** | **76** |

**Core app feature completion: ~90%**
**Infrastructure/deployment completion: ~40%**
**Monetization readiness (live): 0%** (test mode only)
