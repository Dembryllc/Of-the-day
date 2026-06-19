# OfTheDay.net — Claude Code Context

## What this is
Morning meeting planner for K–12 teachers using Responsive Classroom. Teachers open it and get a complete, grade-appropriate routine (Greeting, Sharing, Group Activity, Morning Message) in seconds. Includes projector mode, Word of the Day, Do Now warm-ups, On This Day facts, and cloud sync.

## Tech stack
- **Frontend**: React 19, Vite 8, react-router-dom 7
- **Auth + DB**: Firebase Auth (email/password + Google) + Firestore (`oftheday-c6490`)
- **Hosting**: Firebase Hosting (serves `dist/`) — auto-deploys from `main` via GitHub Actions
- **Functions**: Firebase Cloud Functions mixed gen (`functions/index.js`) — `onthisday` + `createCheckoutSession` + `stripeWebhook` + `sendLeadMagnet` are Gen 2; `onUserCreate` is Gen 1
- **Payments**: Stripe (test mode) — checkout sessions, webhooks, subscription lifecycle
- **Email**: Mailgun (`functions/index.js`) — welcome email on signup, resource pack lead magnet delivery
- **Build output**: `dist/` (gitignored)

## Development & deploy
```bash
npm run dev          # local dev server (Vite)
npm run build        # production build → dist/
npm run preview      # preview dist/ locally
npm run seed         # seed Firestore activities (needs scripts/service-account.json)
```

Push to `main` → GitHub Actions auto-deploys to Firebase Hosting (`oftheday-c6490.web.app`).  
`oftheday.net` DNS still points to Netlify — custom domain not yet connected to Firebase Hosting.

**Security — never commit:**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` — server-side only (`functions/.env`)
- `VITE_*` vars — safe for frontend bundle (`.env.local`)
- `scripts/service-account.json` and `functions/.env` — gitignored

## Architecture
Single-page app. One `index.html` entry, one JS/CSS bundle, React Router handles all routes client-side. Firebase Hosting rewrites every non-asset request to `index.html`.

### Routes
| Path | Component | Auth |
|------|-----------|------|
| `/` | `LandingPage` | Public (redirects to `/dashboard` if authed) |
| `/login` | `AuthScreen` | Public (redirects to `/dashboard` if authed) |
| `/dashboard` | `MainApp` | Protected (redirects to `/login` if unauthed) |
| `/upgrade` | `UpgradePage` | Protected (redirects to `/login` if unauthed) |
| `/district` | `DistrictPage` | Public |
| `/privacy` | `PrivacyPage` | Public |
| `/terms` | `TermsPage` | Public |
| `?projector=1` | `ProjectorReceiver` | Public — checked before router |
| `*` | Redirect to `/` | — |

## Key files
```
src/
  App.jsx          — main app logic (~3,400 lines); MainApp, UpgradePage, ProfileSheet, modals,
                     ActivityCard, BrowseScreen, BuildScreen, FavoritesScreen, etc.
  AuthScreen.jsx   — extracted auth component (login/signup/Google/reset); fires onAuthed callback
  DisplayMode.jsx  — extracted projector overlay; receives routine/style props, fires onExit
  LandingPage.jsx  — marketing landing page; calls sendLeadMagnet Cloud Function on email capture
  DistrictPage.jsx — /district route; inquiry form → Firestore waitlist (source:'district-inquiry')
  landing.css      — landing page styles (scoped under .lp)
  styles.css       — app styles (Outfit font, all component classes)
  main.jsx         — React entry, ErrorBoundary
  lib/
    firebase.js    — Firebase app init + exports `functions` singleton (getFunctions(app))
    firestore.js   — Firestore helpers: createUserDocument, saveDataSnapshot, fetchActivities, etc.
    usePlan.js     — plan resolution hook → 'pro'|'free'; uses toMs() for Timestamp conversion
    catMeta.js     — CAT_META (14 category definitions) and MORNING_MEETING_CATS Set
    projector.js   — all projector constants and helpers

functions/
  index.js         — six Cloud Functions (onthisday, onUserCreate, createCheckoutSession,
                     stripeWebhook, sendLeadMagnet)

scripts/
  activities-data.js — canonical activity pool (60 activities)
```

## Critical rules — do not violate

**Timestamps:** `trialStartedAt` is a Firestore `Timestamp` object. `Date.now() - timestamp` = `NaN`. Always use `tsToMs(ts)` in `App.jsx` or `toMs(ts)` in `usePlan.js`. Both helpers have `if (typeof ts === 'number') return ts;` as the first guard — do not remove it.

**`functions` singleton:** Always import from `src/lib/firebase.js`. Never call `getFunctions()` directly in components — this crashes with "not initialized."

**`ProjectorReceiver` + `PROJECTOR_STATE_KEY` + `projectorWindowUrl()`:** All three live in `App.jsx` at module scope. Do not move or duplicate — duplicate function declarations crash the build.

**Logo:** Use `src="/assets/ofthedaylogi.png"` (absolute path, clean crop). Never use `oftheday-logo.png` — it has 74% transparent whitespace.

**Onboarding:** `TutorialModal` was removed. The welcome card (`ofd:welcomed:{uid}`) is the sole onboarding flow. Do not re-add a tutorial modal.

**Sidebar nav label:** "Routines" (not "Build"). Internal names (`BuildScreen`, `builderDraft`) were not changed.

**`favorites?.has()`:** Always use optional chaining — `undefined` favorites crashes ActivityCard and FavoritesScreen.

**Projector dots:** `key={item?.id ?? i}` — index-only keys break reconciliation on shuffle.

**Do not extract to reduce line count.** Extract only when a component has truly local state and no callbacks back up.

**Firebase Console (required before auth works on live site):**
- Authentication → Sign-in method → Enable Email/Password and Google
- Authentication → Settings → Authorized Domains → Add `oftheday.net`
- `auth/operation-not-allowed` error means sign-in method is disabled

## Firestore schema
```
users/{uid}
  name, email, grade, plan, createdAt
  trialStartedAt   — Firestore Timestamp; always convert with toMs()/tsToMs()
  tier             — 'pro' | 'free'; written by stripeWebhook only
  stripeCustomerId, subscriptionId, currentPeriodEnd

users/{uid}/data/main
  favorites[], customActivities[], savedRoutines[], customVocab{}, customDoNow{}, projectorStyle{}

activities/{id}
  id, cat, title, meta, time, prompt, starter, directions, source, sourceUrl

waitlist/{id}
  email, name?, school?, district?, title?, seats?,
  source ('landing-page' | 'school-inquiry' | 'district-inquiry'), submittedAt
```

## Plan / tier resolution
`src/lib/usePlan.js` is the single source of truth. Priority order:
1. `account.tier === 'pro'` → Pro (Stripe subscriber)
2. `account.plan === 'pro'` or `'school'` → Pro (manual override)
3. `account.plan === 'trial'` + `trialStartedAt` within 14 days → Pro (trial)
4. Everything else → Free

`userTier` in `MainApp` is derived from `effectivePlan` — not a separate `useState`.

## Freemium gates
| Feature | Free | Pro |
|---------|------|-----|
| Morning meeting categories | All | All |
| Non-MM categories (Brain Teaser, SEL, Movement, Mindfulness) | First 3 per category | All |
| Saved routines | 3 | Unlimited |
| Custom activities | 1 | Unlimited |
| Projector mode | Full access | Full access |

## Stripe
- Test mode; `STRIPE_WEBHOOK_SECRET` **must** be set — webhook hard-rejects if missing (returns 400)
- Webhook URL: `https://us-central1-oftheday-c6490.cloudfunctions.net/stripeWebhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Price IDs in `UpgradePage`: monthly `price_1Te35JB2eRKsbhTpqJrBmNRE`, annual `price_1Te38IB2eRKsbhTp9GXJjxM0` — swap for live IDs at go-live

## Email (Mailgun)
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` in `functions/.env` — server-side only
- `getMailgun()` returns null if keys missing — all sends fail silently (never throws)
- From: `OfTheDay <hello@oftheday.net>` (`EMAIL_FROM` in functions/index.js)
- Welcome email: triggered by `onUserCreate` after Firestore doc write
- Lead magnet: triggered by `sendLeadMagnet` callable from LandingPage

## Cloud Functions
| Function | Gen | Trigger | Purpose |
|----------|-----|---------|---------|
| `onthisday` | 2 | HTTP | Fetches onthisday.com, filters for classrooms |
| `onUserCreate` | 1 | auth.onCreate | Writes `plan:'trial'` + `trialStartedAt` to Firestore; sends welcome email |
| `createCheckoutSession` | 2 | callable | Creates Stripe customer + checkout session; returns `{ url }` |
| `stripeWebhook` | 2 | HTTP | Subscription lifecycle: sets `tier:'pro'`/`'free'` on Firestore |
| `sendLeadMagnet` | 2 | callable | Sends resource pack email via Mailgun |

`onUserCreate` is Gen 1 because `beforeUserCreated` (Gen 2 equivalent) requires Firebase Identity Platform, which this project doesn't use.

## CSS
- App: `src/styles.css` (Outfit font, all component classes)
- Landing/legal: `src/landing.css` (all selectors scoped under `.lp`)
- Color tokens: Navy `#1B2D5B`, Gold `#F5A623`, Teal `#4DB896` (`--teal`), Background `#F8F9FC`
- `.app`: `display:flex; flex-direction:column; height:100vh; overflow:hidden`
- Trial/verify/pro-success banners render in document flow inside `.app`, NOT fixed position

## Auth
- Google auth: `signInWithPopup` → `onAuthStateChanged` in App handles user doc creation for new Google users
- `onUserCreate` CF fires for all providers
- Unverified email/password users see dismissible amber banner with "Resend verification email"
- Avatar initials fallback: `displayName[0] → account.name[0] → account.email[0] → '?'`

## DisplayMode (projector)
`src/DisplayMode.jsx` — `position:fixed; inset:0; z-index:300`. Imports from `./lib/catMeta` and `./lib/projector`.

**On exit** (`onExit`): sets `ofd:projectedToday` localStorage → completion card; calls `markActivitiesSeen(ids)` → removes "New" badges.

Teacher control bar: session-only (Dark/Light/Warm/HC themes, font size/style, show/hide instructions, timer, clean/guided view). Changes do NOT mutate saved `projectorStyle`.

Bottom nav: Previous ← hidden via `visibility:hidden` (not removed) on first activity. Dots: `key={item?.id ?? i}`. Min 50px for SMART board touch.

## localStorage keys
| Key | Shape | Purpose |
|-----|-------|---------|
| `ofd:streak` | `{ count, lastDate }` | Usage streak |
| `ofd:streakMilestones` | `[3, 7, ...]` | Milestone toast suppression |
| `ofd:usedToday` | `{ date, ids[] }` | Today's routine IDs (resets daily) |
| `ofd:seenActivities` | `[id, ...]` | All ever-projected IDs (persistent) |
| `ofd:projectedToday` | ISO date string | Whether teacher projected today |
| `ofd:favorites` | `[id, ...]` | Favorited activity IDs |
| `ofd:savedRoutines` | `[{...}, ...]` | Saved routine objects |
| `ofd:sidebarCollapsed` | `'1'` or `'0'` | Sidebar collapse state |
| `ofd:welcomed:{uid}` | `'1'` | Welcome card dismissed (per account) |
| `ofd:projectorStyle` | `{...}` | Projector style settings |
| `ofd:projectorState` | `{...}` | Cross-window projector state bridge |
| `ofd:presentationView` | `'clean'` or `'guided'` | Last projector view mode |
| `ofd:cloudAutoSave` | `'true'` | Cloud auto-save preference |

## Pending work (priority order)
1. **Firebase Console** — Enable Email/Password + Google sign-in; add `oftheday.net` to Authorized Domains
2. **DNS** — Connect `oftheday.net` to Firebase Hosting; update Netlify DNS A records
3. **Stripe go-live** — Swap to live keys in `functions/.env`; register webhook; set `STRIPE_WEBHOOK_SECRET`
4. **Mailgun** — Regenerate exposed key; add to `functions/.env`; deploy functions
5. **Demo mode** — Unauthenticated activity browse (biggest conversion lever)
6. **Activity pool expansion** — Repetition possible within weeks
7. **Weekly activity history view**
8. **Projector design section** — Visual theme swatches + live preview
