# OfTheDay.net — Claude Code Context

## What this is
Morning meeting planner for K–12 teachers using Responsive Classroom. Teachers open it and get a complete, grade-appropriate routine (Greeting, Sharing, Group Activity, Morning Message) in seconds. Includes projector mode, Word of the Day, Do Now warm-ups, On This Day facts, and cloud sync.

## Tech stack
- **Frontend**: React 19, Vite 8, react-router-dom 7
- **Auth + DB**: Firebase Auth + Firestore (`oftheday-c6490`)
- **Hosting**: Firebase Hosting (serves `dist/`)
- **Functions**: Firebase Cloud Functions mixed gen (`functions/index.js`) — `onthisday` + `createCheckoutSession` + `stripeWebhook` are Gen 2; `onUserCreate` is Gen 1
- **Payments**: Stripe (test mode) — checkout sessions, webhooks, subscription lifecycle
- **Build output**: `dist/` (gitignored)

## Architecture
Single-page app. One `index.html` entry, one JS/CSS bundle, React Router handles all routes client-side. Firebase Hosting rewrites every non-asset request to `index.html`.

### Routes
| Path | Component | Auth |
|------|-----------|------|
| `/` | `LandingPage` | Public (redirects to `/dashboard` if authed) |
| `/login` | `AuthScreen` | Public (redirects to `/dashboard` if authed) |
| `/dashboard` | `MainApp` | Protected (redirects to `/login` if unauthed) |
| `/upgrade` | `UpgradePage` | Protected (redirects to `/login` if unauthed) |
| `?projector=1` | `ProjectorReceiver` | Public — checked before router |
| `*` | Redirect to `/` | — |

## Key files
```
src/
  App.jsx          — all app logic (3500+ lines); Auth, MainApp, AuthScreen, UpgradePage, projector, modals
  LandingPage.jsx  — marketing landing page (React component)
  landing.css      — landing page styles (scoped under .lp to avoid conflicts with app CSS)
  styles.css       — app styles (Outfit font, all component classes)
  main.jsx         — React entry, ErrorBoundary
  lib/
    firebase.js    — Firebase app init (throws if VITE_FIREBASE_* missing)
    firestore.js   — Firestore helpers: createUserDocument, saveDataSnapshot, fetchActivities, etc.
    usePlan.js     — plan resolution hook: reads account.tier + account.plan + trialStartedAt → 'pro'|'free'
  tweaks-panel.jsx — dev tweaks UI

functions/
  index.js         — four Cloud Functions:
                     • onthisday (Gen 2, onRequest) — fetches from onthisday.com, filters for classrooms
                     • onUserCreate (Gen 1, auth.user().onCreate) — writes plan:'trial' to Firestore on signup
                     • createCheckoutSession (Gen 2, onCall) — creates Stripe customer + checkout session
                     • stripeWebhook (Gen 2, onRequest) — handles subscription lifecycle events

scripts/
  seed.js          — seeds Firestore activities collection (requires service-account.json)
  activities-data.js — canonical activity pool (60 activities)

index.html         — React shell with SEO meta tags
firebase.json      — hosting config, CSP headers, rewrites
firestore.rules    — owner-only user docs, read-only activities for authed users
vite.config.js     — single SPA entry (no MPA)
```

## Environment variables
Required in `.env.local` (gitignored — never commit):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=oftheday-c6490
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=   (optional)
```
See `.env.example` for reference. Get values from Firebase Console → Project Settings → Web App.

**Security rules — never break these:**
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-side only (Firebase Functions)
- `VITE_*` vars are safe for the frontend bundle
- `scripts/service-account.json` is gitignored — never commit it

## Development
```bash
npm run dev          # local dev server (Vite)
npm run build        # production build → dist/
npm run preview      # preview dist/ locally
npm run seed         # seed Firestore activities (needs scripts/service-account.json)
```

## Deploy
```bash
npm run build
firebase deploy --only hosting   # deploy frontend
firebase deploy --only functions  # deploy Cloud Function
firebase deploy                   # deploy everything
```
`.env.local` must exist with real Firebase values before building. The values are baked into the bundle at build time.

**Local machine path (Mac):** `/Users/mikeradicone/Desktop/of the day`
Full deploy command:
```bash
cd "/Users/mikeradicone/Desktop/of the day" && git pull origin main && npm run build && firebase deploy --only hosting,functions
```

## Firestore schema
```
users/{uid}
  name, email, grade, plan, createdAt
  trialStartedAt          — set by onUserCreate on signup
  tier                    — 'pro' | 'free'; written by stripeWebhook only
  stripeCustomerId        — set on first checkout attempt
  subscriptionId          — set by stripeWebhook on checkout.session.completed
  currentPeriodEnd        — Unix timestamp; updated by subscription lifecycle events

users/{uid}/data/main
  version, exportedAt, favorites[], customActivities[], savedRoutines[],
  customVocab{}, customDoNow{}, projectorStyle{}

activities/{id}
  id, cat, title, meta, time, prompt, starter, directions, source, sourceUrl
```

## Plan / tier resolution
`src/lib/usePlan.js` is the single source of truth. Priority order:
1. `account.tier === 'pro'` → Pro (Stripe subscriber)
2. `account.plan === 'pro'` or `'school'` → Pro (manual override)
3. `account.plan === 'trial'` + `trialStartedAt` within 14 days → Pro (trial)
4. Everything else → Free

`userTier` in `MainApp` is derived from `effectivePlan` (not a separate useState), so both activity gating and feature gating always agree.

## Freemium gates
| Feature | Free | Pro |
|---------|------|-----|
| Morning meeting activity categories | All | All |
| Non-MM activity categories (Brain Teaser, SEL, Movement, Mindfulness) | First 3 per category | All |
| Saved routines | 3 | Unlimited |
| Custom activities | 1 | Unlimited |
| Projector mode | Full access | Full access |

Locked browse cards show a gold "Pro" badge; Use Today / Add to Routine trigger the upgrade modal which links to `/upgrade`.

## Stripe notes
- Test mode keys in `functions/.env` (gitignored — never commit)
- `STRIPE_WEBHOOK_SECRET` must be added after registering the webhook endpoint in Stripe Dashboard
- Webhook URL: `https://us-central1-oftheday-c6490.cloudfunctions.net/stripeWebhook`
- Events to register: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Success URL: `https://oftheday.net/dashboard?upgraded=true` → shows 5-second "Welcome to Pro!" banner

## CSS notes
- App CSS lives in `src/styles.css` — uses Outfit font (woff2 in `public/fonts/`)
- Landing page CSS in `src/landing.css` — all selectors scoped under `.lp` parent class to prevent conflicts with app class names (`.nav`, `.btn-primary`, etc. overlap)
- `.app` class owns `height: 100vh; overflow: hidden` for the dashboard layout
- `body` has no overflow or background set globally — each route manages its own via its root element or `useLayoutEffect`

## Static assets
Logo and images go in `public/assets/` — Vite copies everything in `public/` to `dist/` at build time. Reference them with an absolute path: `src="/assets/oftheday-logo.png"`. Never use a relative path (`assets/...`) — it breaks on any route other than `/`.

## Cloud Functions notes

### onthisday (Gen 2)
- URL: `https://onthisday-qznlc6fzoa-uc.a.run.app`
- Fetches today's events from onthisday.com, filters for classroom-safe content, supplements with a curated kid-fact bank
- Returns JSON: `{ date, source, sourceUrl, events[] }`

### onUserCreate (Gen 1)
- Fires on every new Firebase Auth user creation
- Writes `{ email, plan: 'trial', trialStartedAt, createdAt }` to `users/{uid}` in Firestore
- Wrapped in try-catch — never blocks signup; client-side `createUserDocument` is the fallback
- **Why Gen 1:** `beforeUserCreated` (Gen 2 equivalent) requires Firebase Identity Platform (GCIP), which this project does not use

### createCheckoutSession (Gen 2, callable)
- Called from `UpgradePage` via `httpsCallable(getFunctions(), 'createCheckoutSession')`
- Params: `{ priceId, userId }`
- Creates Stripe customer if none exists, stores `stripeCustomerId` on user doc
- Returns `{ url }` — client redirects to Stripe-hosted checkout

### stripeWebhook (Gen 2, HTTP)
- Verifies Stripe signature when `STRIPE_WEBHOOK_SECRET` is set
- `checkout.session.completed` → sets `tier:'pro'`, `subscriptionId`, `currentPeriodEnd`
- `customer.subscription.updated` → updates `tier` and `currentPeriodEnd`
- `customer.subscription.deleted` → sets `tier:'free'`

## Trial banner

Shown at the top of the dashboard for all users with `plan: 'trial'` who haven't paid (`tier !== 'pro'`). Dismissible once per session via `sessionStorage`.

| Days left | Color |
|-----------|-------|
| 8–14 | Blue |
| 4–7 | Amber |
| 1–3 | Red |
| 0 | Red — "Your free trial has ended" |

CSS classes: `.trial-banner`, `.trial-banner--warning`, `.trial-banner--urgent`.

`trialDaysLeft` is computed in `MainApp` from `account.trialStartedAt` (14-day window). A sidebar trial card (`.sidebar-trial-card`) also shows days remaining with an upgrade link for trial users. Non-pro users see an **⭐ Go Pro** button (`.sidebar-upgrade-btn`) once the trial card is not shown.

## Live site status
**oftheday.net is live on `claude/activity-of-day-app-2JlTT` as of 2026-06-03.**
- `/` → marketing landing page ✓
- `/login` → auth screen ✓
- `/dashboard` → teacher app (protected) ✓
- `/upgrade` → Stripe pricing page (protected) ✓
- Firebase Auth + Firestore connected ✓
- Firestore `activities` collection seeded with 60 activities ✓
- `onUserCreate` auto-sets `plan: 'trial'` on signup ✓
- `onthisday`, `createCheckoutSession`, `stripeWebhook` deployed ✓
- Freemium gates active (activity library, saved routines, custom activities) ✓
- Tier unification complete — `usePlan` checks `account.tier` first ✓
- Trial countdown banner live ✓
- Go Pro sidebar button live ✓
- Sidebar navy rebrand + slim logo ✓
- Landing page Pro CTA links to `/upgrade` ✓
- Trial status UI: top banner + sidebar trial card with days remaining ✓
- Profile section: sidebar profile row (avatar initials, name, plan badge) + ProfileSheet (edit name/grade, sign out, upgrade link) ✓
- `updateUserProfile()` added to `firestore.js` ✓

## Pending work
1. **Switch Stripe to live mode** — swap test keys for live keys in `functions/.env`, redeploy functions
2. **Merge feature branch to main** — active deploys are from `claude/activity-of-day-app-2JlTT`; merge to `main` when stable
3. **Component extraction** — App.jsx is 3500+ lines

## Git branch
Active development: `main`
