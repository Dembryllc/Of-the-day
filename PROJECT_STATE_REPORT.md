# Project State Report — OfTheDay.net
Date: 2026-06-07
Analyst: CTO/Portfolio Review

---

## Purpose

Morning meeting planner for K–12 teachers practicing Responsive Classroom.
Generates a complete, grade-appropriate 4-part routine (Greeting, Sharing, Group Activity,
Morning Message) in under 30 seconds. Includes projector mode for SMART boards,
Word of the Day, Do Now warm-ups, On This Day facts, and cloud sync across devices.

Target job-to-be-done: Replace 15+ minutes of daily activity planning with a 30-second routine.

---

## Users

- **Primary**: K–12 classroom teachers (public school, charter, private)
- **Secondary**: School instructional coaches / curriculum coordinators
- **Tertiary**: School administrators (for school-wide license)
- **Platform fit**: Teachers who use Responsive Classroom framework (est. 25,000+ schools in the US)
- **Tech comfort**: Moderate — uses Chromebooks, SMARTboards, Google Classroom

---

## Buyers

- Individual teachers (self-serve, $9/mo or $79/yr)
- Schools / districts ($199/yr per school, "contact us" tier — not yet implemented in app)
- Potential grant purchasers (Title I, professional development budgets)

---

## Revenue Model

**Freemium SaaS**

| Tier | Price | What You Get |
|------|-------|-------------|
| Free | $0 | All morning meeting categories, 3 saved routines, 1 custom activity, projector mode |
| Pro | $9/mo or $79/yr | Unlimited routines, unlimited custom activities, brain teaser/SEL/movement/mindfulness categories unlocked |
| School | $199/yr | Landing page lists it; NOT implemented in backend |

**Stripe integration:** Built and wired. Currently in **test mode only** — no real money can be charged.
**Trial:** 14 days free pro on signup. No credit card required.

---

## Hosting

- **Platform**: Firebase Hosting (project: `oftheday-c6490`)
- **URL**: `oftheday-c6490.web.app` (functional) / `oftheday.net` (broken — DNS not updated)
- **Deploy**: GitHub Actions CI/CD on push to `main`
- **CDN**: Firebase global CDN
- **SSL**: Managed by Firebase (auto-provisioned for `*.firebaseapp.com`; custom domain pending)

---

## Architecture

```
Browser → Firebase Hosting (SPA) → React Router
                                  ↓
                  Firebase Auth (email/password + Google)
                  Firebase Firestore (user data, activities)
                  Firebase Cloud Functions (On This Day API, Stripe checkout, webhook)
                  Stripe (payment processing — test mode)
```

Single-page app. One JS bundle (~792 KB minified, ~235 KB gzipped).
All routing is client-side (React Router v7). All data is Firebase.
No other backend — no Express, no Node server, no database besides Firestore.

---

## Authentication

- **Email/Password**: Implemented. Signup requires 8+ char password. Friendly error messages.
- **Google OAuth**: Implemented via `signInWithPopup`. Popup blocked → clear message.
- **Password reset**: Implemented. Sends Firebase reset email.
- **Email verification**: Banner shown to unverified email users. Resend button. Dismissed per session.
- **Trial setup**: `onUserCreate` Cloud Function fires on every new user, writes `plan:'trial'` to Firestore.
- **Status**: Code complete. **Blocked by Firebase Console — sign-in methods not yet enabled.**

---

## Database

- **Firestore** (`oftheday-c6490`)
- **Schema**:
  - `users/{uid}` — profile, plan, tier, trialStartedAt, stripeCustomerId, subscriptionId
  - `users/{uid}/data/main` — favorites, customActivities, savedRoutines, customVocab, customDoNow, projectorStyle
  - `activities/{id}` — seeded activity pool (60 activities, read-only for clients)
  - `waitlist/{id}` — landing page email captures
- **Security rules**: Owner-only user docs, read-only activities for authed users, public waitlist writes
- **Status**: Rules correct. Schema populated (activities seeded). No known issues.

---

## Current Features

| Feature | Status |
|---------|--------|
| Daily routine generator (Today view) | Complete |
| Activity library browse + search | Complete |
| Grade filtering (K–2, 3–5, 6–8, 9–12) | Complete |
| Build-a-Routine (drag + save) | Complete |
| Word of the Day (daily + custom) | Complete |
| Do Now (Math + Writing warm-ups) | Complete |
| On This Day (Cloud Function + fallback) | Complete |
| My Activities (custom creation) | Complete |
| Favorites | Complete |
| Projector mode (DisplayMode) | Complete |
| — Timer, themes, font size/style | Complete |
| — Teacher control bar (session-only) | Complete |
| — Clean vs Guided view | Complete |
| Cloud sync (save/restore) | Complete |
| Freemium gating (usePlan hook) | Complete |
| Stripe checkout (createCheckoutSession) | Complete |
| Stripe webhook lifecycle handler | Complete |
| Trial period (14 days) | Complete |
| Profile sheet (name, grade, plan) | Complete |
| Sidebar collapse | Complete |
| Email verification banner | Complete |
| Trial countdown banner | Complete |
| Landing page (marketing) | Complete |
| Email waitlist capture | Complete |
| Firebase Hosting deploy | Complete |
| GitHub Actions CI/CD | Complete (with secret validation) |

---

## Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Live payments (Stripe prod mode) | P0 | Test mode only; no real charges possible |
| GitHub Secrets configured | P0 | App blank screen without these |
| oftheday.net DNS connected to Firebase | P0 | Domain unreachable via custom domain |
| Firebase Auth sign-in methods enabled | P0 | Sign-in blocked without Console config |
| School tier backend | P1 | Landing page lists it; no implementation |
| Subscription management UI | P1 | No cancel/upgrade/downgrade in app |
| Onboarding / first-run flow | P1 | Users dropped into Today view cold |
| Stripe production keys | P1 | Must be set in functions/.env before go-live |
| Functions in CI/CD | P2 | Functions deployed manually only |
| Error tracking (Sentry) | P2 | No runtime error visibility |
| Analytics (Mixpanel/Posthog) | P2 | No usage data |
| Rate limiting on Cloud Functions | P2 | onthisday + checkout unprotected |
| Real-time sync | P3 | Manual save/restore, not live listeners |
| Email notifications (trial ending) | P3 | No automated emails |
| Mobile app | P3 | Web-only |

---

## Known Issues

1. **Site not loading** — Blank screen due to empty GitHub Secrets (VITE_FIREBASE_API_KEY etc. not set)
2. **Custom domain broken** — oftheday.net DNS still points to Netlify, not Firebase Hosting
3. **Sign-in blocked** — Firebase Console sign-in methods not enabled (Email/Password + Google)
4. **Stripe in test mode** — No real revenue possible until production Stripe keys are configured
5. **Functions not in CI/CD** — Any function change requires manual deployment from developer Mac
6. **App.jsx 3,880 lines** — Everything in one file; hard to maintain, no component extraction

---

## Technical Debt

| Debt Item | Severity | Impact |
|-----------|----------|--------|
| App.jsx is 3,880 lines (monolith) | High | Every change risks breaking unrelated features |
| Stripe price IDs hardcoded in functions | Medium | Switching pricing requires code deploy |
| No staging Firebase project | Medium | All dev/prod use same Firestore |
| Manual function deployment | Medium | Functions can go stale vs. hosting code |
| `vite.config.mjs` unused secondary config | Low | Dead code, confusing |
| Planning docs in repo root | Low | Noise in codebase |
| Projector state via localStorage polling | Low | 1.2s interval; works but fragile |
| No E2E tests | Medium | Changes unverified beyond manual testing |
| `npm test` is just `node -c functions/index.js` | High | Not a real test suite |

---

## Deployment Status

| Item | Status |
|------|--------|
| Code on GitHub (main) | ✅ Current |
| GitHub Actions workflow | ✅ Configured (with secret validation) |
| GitHub Secrets (VITE_FIREBASE_*) | ❌ NOT SET — build deploys broken bundle |
| Firebase Hosting (oftheday-c6490.web.app) | ⚠️ Deployed but app crashes on load |
| Custom domain (oftheday.net) | ❌ DNS points to Netlify, not Firebase |
| Firebase Auth sign-in methods | ❌ Unknown — likely not enabled |
| Stripe webhook registered | ❌ Not registered in Stripe Dashboard |
| Functions deployed | ⚠️ Unknown — no CI/CD for functions |

---

## Monetization Status

| Item | Status |
|------|--------|
| Stripe account | Exists (test mode) |
| Checkout session creation | Code complete (test mode) |
| Subscription webhook | Code complete (test mode) |
| Stripe production keys | NOT configured |
| Stripe webhook secret | NOT configured in functions/.env |
| Price IDs (live) | NOT created in Stripe |
| First paying customer | $0 revenue — app can't be reached |

---

## Overall Health Score

**4 / 10**

**Why not lower:** The code quality is high. The architecture is sound. Feature set is complete for MVP.
The freemium model is wired end-to-end. The codebase is production-grade.

**Why not higher:** The app literally does not load. Zero users can access it today.
Three infrastructure blockers — all fixable in under 2 hours — prevent any value delivery.
Stripe is in test mode so no real revenue is possible even if the site loads.
The gap between code quality and production reality is the biggest risk.
