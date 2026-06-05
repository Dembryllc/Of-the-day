# OfTheDay.net — Claude Code Context

## What this is
Morning meeting planner for K–12 teachers using Responsive Classroom. Teachers open it and get a complete, grade-appropriate routine (Greeting, Sharing, Group Activity, Morning Message) in seconds. Includes projector mode, Word of the Day, Do Now warm-ups, On This Day facts, and cloud sync.

## Tech stack
- **Frontend**: React 19, Vite 8, react-router-dom 7
- **Auth + DB**: Firebase Auth (email/password + Google) + Firestore (`oftheday-c6490`)
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
  App.jsx          — all app logic (4000+ lines); Auth, MainApp, AuthScreen, UpgradePage,
                     ProfileSheet, projector/DisplayMode, modals
  LandingPage.jsx  — marketing landing page (React component)
  landing.css      — landing page styles (scoped under .lp to avoid conflicts with app CSS)
  styles.css       — app styles (Outfit font, all component classes)
  main.jsx         — React entry, ErrorBoundary
  lib/
    firebase.js    — Firebase app init (throws if VITE_FIREBASE_* missing)
    firestore.js   — Firestore helpers: createUserDocument, saveDataSnapshot, fetchActivities,
                     updateUserGrade, updateUserProfile, etc.
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

.claude/
  settings.json    — Claude Code project config; PostToolUse hook auto-pushes to origin after every git commit

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
Full deploy command to give the user:
```bash
cd "/Users/mikeradicone/Desktop/of the day" && git pull origin claude/activity-of-day-app-2JlTT && npm run build && firebase deploy --only hosting
```

## Firestore schema
```
users/{uid}
  name, email, grade, plan, createdAt
  trialStartedAt          — set by onUserCreate on signup (or createUserDocument fallback)
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
- Success URL: `https://oftheday.net/dashboard?upgraded=true` → shows "Welcome to Pro!" banner

## Auth notes
- Email/password: `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`
- Google: `signInWithPopup(auth, new GoogleAuthProvider())` — first sign-in auto-creates user doc with trial plan via `resolveGoogleUser()` helper in `AuthScreen`
- `onUserCreate` Cloud Function (Gen 1) fires on every new Firebase Auth user regardless of provider
- `friendlyAuthError()` handles `auth/popup-closed-by-user` and `auth/cancelled-popup-request` silently (no error shown)

## CSS notes
- App CSS lives in `src/styles.css` — uses Outfit font (woff2 in `public/fonts/`)
- Landing page CSS in `src/landing.css` — all selectors scoped under `.lp` parent class
- `.app` is `display: flex; flex-direction: column; height: 100vh; overflow: hidden`
- `.app-shell` is the inner flex row containing `.sidebar` + `.main` — `flex: 1; overflow: hidden`
- Trial banner + pro success banner render in document flow (inside `.app`, above `.app-shell`) — NOT fixed position
- `body` has no overflow or background set globally — each route manages its own

### Color tokens
| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#1B2D5B` | Sidebar background, auth panel accents |
| Gold | `#F5A623` | Active nav accent, upgrade CTAs, projector nav |
| Sky Blue | `#4A90D9` | Secondary only |
| Background | `#F8F9FC` | App background |
| Teal | `#4DB896` (var --teal) | Primary action buttons |

## Sidebar
- Background: `#1B2D5B` (navy)
- Active nav accent: `#F5A623` (gold) via `border-left-color`
- Nav font: 15px, icons 16px (20px in collapsed mode)
- Collapse toggle: `sidebarCollapsed` state in `MainApp`, persisted to `localStorage('ofd:sidebarCollapsed')`
- Collapsed width: 60px — shows emoji icons only, hides text labels, trial card, upgrade btn, projector live card
- Profile row at bottom: gold avatar circle (initials) + name + plan label → opens `ProfileSheet`

## ProfileSheet
- Component in `App.jsx`, opened via sidebar profile row
- Editable: name, default grade
- Read-only: email, plan badge (Pro / Trial · X days / Free)
- Upgrade link shown for non-pro users
- Save → calls `updateUserProfile(uid, { name, grade })` in `firestore.js`, updates `displayName` local state + `handleGradeChange`
- Sign Out button inside the sheet

## Trial status UI
- `trialDaysLeft` useMemo in `MainApp`: null if paid/free, 0–14 for active trial
- Top banner: blue → amber (≤7 days) → red (≤3 days); dismissed per-session via `sessionStorage`
- Sidebar trial card: gold-bordered, shows countdown + "Upgrade to Pro →" link
- Paid users (`account.tier === 'pro'`): see neither banner nor trial card

## Library header
- Replaced the 6-card `.library-quick-grid` with a horizontal scrollable `.library-pill-row`
- Pills: Build a Routine (teal/filled), Word of the Day, Do Now, On This Day, My Activities, Favorites

## DisplayMode (projector)
The projector is a full-screen overlay component (`position: fixed; inset: 0; z-index: 300`).

### Teacher control bar
- Toggle button (top-right): "⚙ Controls" / "✕ Close"
- When open: horizontal panel with controls for:
  - **Theme**: Dark / Light / Warm / High Contrast (session-local color presets)
  - **Font Size**: Small / Medium / Large / XLarge
  - **Font Style**: Sans-Serif / Serif (Serif applies Georgia to prompt/starter/guidance)
  - **Instructions**: Show / Hide (controls `showStarter` display)
  - **Timer**: Show / Hide / Reset
  - **View**: Clean / Guided (replaces old `disp-view-switch`)
  - **End Projection** (red button)
- All controls use navy/gold palette, min 34px touch targets
- **Session-only** — changes do NOT mutate saved `projectorStyle`

### Layout structure
```
.display-mode (fixed, flex column)
  .disp-teacher-bar (absolute top-right, z-index 10)
  .disp-top (class name, category, timer)
  .disp-center (prompt, starter, guidance)
  .disp-bottom (← Previous | counter + dots | Next →)
```

### Bottom nav
- Previous ← (hidden via `visibility: hidden` when on first activity, not removed)
- Center: "Activity X of Y" label + dot indicators (gold active dot)
- Next → (navy background, gold border) / Done ✓ (gold tint) on last activity
- Min-height 50px for SMART board touch targets

### Timer
- Pause / ▶ Start toggle button
- ↺ Reset button (sets to full time, pauses)

## Static assets
Logo and images go in `public/assets/` — Vite copies everything in `public/` to `dist/` at build time. Reference them with an absolute path: `src="/assets/oftheday-logo.png"`. Never use a relative path (`assets/...`) — it breaks on any route other than `/`.

## Cloud Functions notes

### onthisday (Gen 2)
- URL: `https://onthisday-qznlc6fzoa-uc.a.run.app`
- Fetches today's events from onthisday.com, filters for classroom-safe content, supplements with a curated kid-fact bank
- Returns JSON: `{ date, source, sourceUrl, events[] }`

### onUserCreate (Gen 1)
- Fires on every new Firebase Auth user creation (email/password AND Google)
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

## Live site status
**oftheday.net is live and fully working as of 2026-06-05.**
- `/` → marketing landing page ✓
- `/login` → auth screen (sign in / create account / Google) ✓
- `/dashboard` → teacher app (protected) ✓
- `/upgrade` → Stripe pricing page (protected) ✓
- Landing page Pro CTA → `/upgrade` (not `/login`) ✓
- Firebase Auth (email + Google) and Firestore connected ✓
- `onUserCreate` function deployed — auto-sets `plan: 'trial'` on signup ✓
- `onthisday` function deployed as Gen 2 ✓
- `createCheckoutSession` + `stripeWebhook` deployed ✓
- Freemium gates active (activity library + saved routines + custom activities) ✓
- Tier unification: `usePlan` checks `account.tier` first — paid Stripe users clear all caps ✓
- Trial status UI: top banner (color-coded urgency) + sidebar countdown card ✓
- Profile section: sidebar profile row + ProfileSheet with editable name/grade ✓
- Sidebar collapse/expand toggle (icon-only mode) ✓
- Projector teacher control bar (theme, font, instructions, timer) ✓
- Library header pill row ✓
- Claude Code auto-push hook — every `git commit` auto-pushes to `origin claude/activity-of-day-app-2JlTT` ✓

## Pending work
1. **Stripe webhook secret** — register endpoint in Stripe Dashboard, add `STRIPE_WEBHOOK_SECRET` to `functions/.env`, redeploy functions
2. **Projector design section** — visual theme swatches + live preview in Settings Sheet (distinct from DisplayMode session controls)
3. **Component extraction** — App.jsx is 4000+ lines; ProfileSheet, DisplayMode, AuthScreen are candidates
4. **Merge to main** — active dev branch is `claude/activity-of-day-app-2JlTT`

## Git branch
Active development: `claude/activity-of-day-app-2JlTT`

## Claude Code settings
`.claude/settings.json` is committed to the repo. It configures:
- **PostToolUse hook (Bash)** — detects `git commit` commands and automatically runs `git push -u origin claude/activity-of-day-app-2JlTT` so every commit goes straight to GitHub
