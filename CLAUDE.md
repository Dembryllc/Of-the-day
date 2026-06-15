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
| `/privacy` | `PrivacyPage` | Public |
| `/terms` | `TermsPage` | Public |
| `?projector=1` | `ProjectorReceiver` | Public — checked before router |
| `*` | Redirect to `/` | — |

## Key files
```
src/
  App.jsx          — all app logic (4000+ lines); Auth, MainApp, AuthScreen, UpgradePage,
                     ProfileSheet, projector/DisplayMode, modals
  LandingPage.jsx  — marketing landing page (React component)
  PrivacyPage.jsx  — /privacy route; full privacy policy with FERPA statement
  TermsPage.jsx    — /terms route; full terms of service
  landing.css      — landing page styles (scoped under .lp to avoid conflicts with app CSS)
  styles.css       — app styles (Outfit font, all component classes)
  main.jsx         — React entry, ErrorBoundary
  lib/
    firebase.js    — Firebase app init (throws if VITE_FIREBASE_* missing)
    firestore.js   — Firestore helpers: createUserDocument, saveDataSnapshot, fetchActivities,
                     updateUserGrade, updateUserProfile, etc.
    usePlan.js     — plan resolution hook: reads account.tier + account.plan + trialStartedAt → 'pro'|'free'
                     NOTE: uses toMs() helper to convert Firestore Timestamps — do not use raw arithmetic
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
firebase deploy --only functions  # deploy Cloud Functions
firebase deploy                   # deploy everything
```
`.env.local` must exist with real Firebase values before building. The values are baked into the bundle at build time.

**Local machine path (Mac):** `/Users/mikeradicone/Desktop/of the day`
Full deploy command (run on Mac, pulls from main):
```bash
cd "/Users/mikeradicone/Desktop/of the day" && git pull origin main && npm run build && firebase deploy --only hosting
```

**Important:** `git push` to GitHub does NOT deploy the live site. Firebase Hosting requires
running `firebase deploy` manually on the Mac. GitHub push and Firebase deploy are separate steps.

## Firebase Console — required configuration
These settings must be enabled in the Firebase Console or auth will not work:
1. **Authentication → Sign-in method** → Enable **Email/Password** and **Google**
2. **Authentication → Settings → Authorized domains** → Add `oftheday.net`
   (Firebase only auto-adds localhost and the Firebase default domain)

If sign-in shows "Something went wrong. Try again." → check these settings first.
That error is `auth/operation-not-allowed` — thrown when a sign-in method is disabled.

## Firestore schema
```
users/{uid}
  name, email, grade, plan, createdAt
  trialStartedAt          — Firestore Timestamp; set by onUserCreate (or createUserDocument fallback)
                            IMPORTANT: always convert with toMs() / tsToMs() — never use raw arithmetic
  tier                    — 'pro' | 'free'; written by stripeWebhook only
  stripeCustomerId        — set on first checkout attempt
  subscriptionId          — set by stripeWebhook on checkout.session.completed
  currentPeriodEnd        — Unix timestamp; updated by subscription lifecycle events

users/{uid}/data/main
  version, exportedAt, favorites[], customActivities[], savedRoutines[],
  customVocab{}, customDoNow{}, projectorStyle{}

activities/{id}
  id, cat, title, meta, time, prompt, starter, directions, source, sourceUrl

waitlist/{id}
  email, name?, school?, source ('landing-page' | 'school-inquiry'), submittedAt
```

## Plan / tier resolution
`src/lib/usePlan.js` is the single source of truth. Priority order:
1. `account.tier === 'pro'` → Pro (Stripe subscriber)
2. `account.plan === 'pro'` or `'school'` → Pro (manual override)
3. `account.plan === 'trial'` + `trialStartedAt` within 14 days → Pro (trial)
4. Everything else → Free

`userTier` in `MainApp` is derived from `effectivePlan` (not a separate useState), so both activity gating and feature gating always agree.

**Timestamp arithmetic warning:** `trialStartedAt` is a Firestore `Timestamp` object, not a number.
`Date.now() - timestamp` produces `NaN`. Always use `toMs(ts)` in `usePlan.js` or `tsToMs(ts)` in `App.jsx`.

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
- `STRIPE_WEBHOOK_SECRET` **must** be set — webhook handler now hard-rejects requests if missing
- Webhook URL: `https://us-central1-oftheday-c6490.cloudfunctions.net/stripeWebhook`
- Events to register: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Success URL: `https://oftheday.net/dashboard?upgraded=true` → shows "Welcome to Pro!" banner

## Auth notes
- Email/password: `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`
- Google: `signInWithPopup(auth, new GoogleAuthProvider())` — `onAuthStateChanged` in `App` handles
  user doc creation for new Google users (creates doc with `plan:'trial'` if none exists)
- `onUserCreate` Cloud Function (Gen 1) fires on every new Firebase Auth user regardless of provider
- `friendlyAuthError()` handles `auth/popup-closed-by-user` and `auth/cancelled-popup-request` silently;
  handles `auth/popup-blocked` with a clear message to allow popups; handles `auth/internal-error` with
  instructions to configure OAuth consent screen in Firebase Console
- New users: `emailVerified` tracked on account state; unverified email/password users see a dismissible
  amber banner with a "Resend verification email" button

## AuthScreen sign-up flow
- All "Try It Free" / "Get Started Free" links go to `/login?signup=1`
- `AuthScreen` reads `?signup=1` param and defaults to the Sign Up tab via `useSearchParams`
- Sign Up field order: Email → Name → Grade (chips) → Password
- Grade level uses pill chips (K–2, 3–5, 6–8, 9–12), not a `<select>` dropdown
- Password field has persistent helper text "At least 8 characters" (not just placeholder)
- Avatar initials fallback: `name → account.name → account.email[0] → '?'` (both sidebar and ProfileSheet)

## Topbar grade picker
- `GradePicker` component renders `.grade-chips-topbar` — four pill buttons, not a `<select>`
- Classes: `.grade-chip-topbar` (base) + `.active` (teal fill) — same K–2/3–5/6–8/9–12 set
- Default grade fallback in `TWEAK_DEFAULTS`: `account?.grade || "3–5"`

## Landing page structure (LandingPage.jsx)
Sections in order:
1. Nav — logo + links (Features, How It Works, Pricing, FAQ, Get Started Free) + Sign In / Try It Free buttons
2. Hero — headline, sub, CTAs, app mockup
3. Trust bar — "5,000+ teachers · 180 school days · 30s to a routine"
4. Problem — stats + teacher voice quote
5. How It Works — 3-step walkthrough
6. Features — 6 feature cards
7. Use Cases (Teacher Stories) — 3 testimonials
8. Who It's For — grade chips + checklist
9. Pricing — billing toggle (Monthly/Annual, defaults Annual) + 3 cards
   - Free: basic access
   - Pro: $79/year annual (default) / $9/month; "Start Annual Free Trial" CTA
   - School: inline inquiry form (name + school + email → Firestore `waitlist` with `source:'school-inquiry'`)
10. FAQ — 9 questions including "Does OfTheDay store student data?" and "Is a DPA available?"
11. Contact line — "Questions? Email us at hello@oftheday.net"
12. Email capture — lead magnet "Get a Free Morning Meeting Resource Pack" → Firestore `waitlist`
13. Final CTA
14. Footer — Features, Pricing, FAQ, Contact, Privacy Policy, Terms of Service, Sign In

## First-run welcome card
- Shows on first dashboard visit for each account (keyed by `localStorage('ofd:welcomed:{uid}')`)
- Navy card at top of Today view with 3 onboarding steps + embedded grade chips
- Selecting a grade chip calls `handleGradeChange` and dismisses the card permanently
- ✕ button dismisses without changing grade
- Never shows again after first dismissal (localStorage, not sessionStorage)
- **Only onboarding flow** — `TutorialModal` was removed; do not re-add it

## CSS notes
- App CSS lives in `src/styles.css` — uses Outfit font (woff2 in `public/fonts/`)
- Landing page CSS in `src/landing.css` — all selectors scoped under `.lp` parent class
- Legal pages (PrivacyPage, TermsPage) use `.lp-legal-page` class defined in `landing.css`
- `.app` is `display: flex; flex-direction: column; height: 100vh; overflow: hidden`
- `.app-shell` is the inner flex row containing `.sidebar` + `.main` — `flex: 1; overflow: hidden`
- Trial banner + verify banner + pro success banner render in document flow (inside `.app`, above `.app-shell`) — NOT fixed position
- `body` has no overflow or background set globally — each route manages its own

### Color tokens
| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#1B2D5B` | Sidebar background, auth panel accents, welcome card |
| Gold | `#F5A623` | Active nav accent, upgrade CTAs, projector nav, welcome card step numbers |
| Sky Blue | `#4A90D9` | Secondary only |
| Background | `#F8F9FC` | App background |
| Teal | `#4DB896` (var --teal) | Primary action buttons, active grade chips |

## Sidebar
- Background: `#1B2D5B` (navy)
- Active nav accent: `#F5A623` (gold) via `border-left-color`
- Nav font: 15px, icons 16px (20px in collapsed mode)
- Collapse toggle: `sidebarCollapsed` state in `MainApp`, persisted to `localStorage('ofd:sidebarCollapsed')`
- Collapsed width: 60px — shows emoji icons only, hides text labels, trial card, upgrade btn, projector live card
- Profile row at bottom: gold avatar circle (initials) + name + plan label → opens `ProfileSheet`
- Avatar initials fallback: `displayName[0] → account.name[0] → account.email[0] → '?'`

## ProfileSheet
- Component in `App.jsx`, opened via sidebar profile row
- Editable: name, default grade
- Read-only: email, plan badge (Pro / Trial · X days / Free)
- Upgrade link shown for non-pro users
- Save → calls `updateUserProfile(uid, { name, grade })` in `firestore.js`, updates `displayName` local state + `handleGradeChange`
- Sign Out button inside the sheet

## Trial status UI
- `trialDaysLeft` useMemo in `MainApp`: null if paid/free, 0–14 for active trial
- Uses `tsToMs(account?.trialStartedAt)` — Firestore Timestamp converted before arithmetic
- Top banner: blue → amber (≤7 days) → red (≤3 days); dismissed per-session via `sessionStorage`
- Sidebar trial card: gold-bordered, shows countdown + "Upgrade to Pro →" link
- Paid users (`account.tier === 'pro'`): see neither banner nor trial card

## Email verification banner
- Shows for email/password users where `account.emailVerified === false`
- Amber banner with email address + "Resend verification email" button
- Dismissed per-session via `sessionStorage`; `verifySent` state prevents double-sends
- Google users are always verified — banner never shows for them

## Library header
- Horizontal scrollable `.library-pill-row` inside `.library-pill-wrap` container
- Pills: Routines (teal/filled), Word of the Day, Do Now, On This Day, My Activities, Favorites
- `.library-pill-wrap::after` — right-edge fade gradient (52px, `transparent → var(--sand)`) signals more pills; `pointer-events: none`

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
  - **View**: Clean / Guided
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
- Center: "Activity X of Y" label + dot indicators (gold active dot); dots use `key={item?.id ?? i}`
- Next → (navy background, gold border) / Done ✓ (gold tint) on last activity
- Min-height 50px for SMART board touch targets

### Timer
- Pause / ▶ Start toggle button
- ↺ Reset button (sets to full time, pauses)

## Static assets
Logo files in `public/assets/`:
- `ofthedaylogi.png` — **active logo**, clean crop, no whitespace. Used in nav and all headers.
- `oftheday-logo.png` — legacy file with 74% transparent whitespace — do NOT use for display

Reference with absolute path: `src="/assets/ofthedaylogi.png"`. Never use relative paths.

## Cloud Functions notes

### onthisday (Gen 2)
- URL: `https://onthisday-qznlc6fzoa-uc.a.run.app`
- Fetches today's events from onthisday.com, filters for classroom-safe content, supplements with a curated kid-fact bank
- Returns JSON: `{ date, source, sourceUrl, events[] }`

### onUserCreate (Gen 1)
- Fires on every new Firebase Auth user creation (email/password AND Google)
- Writes `{ email, plan: 'trial', trialStartedAt: serverTimestamp(), createdAt: serverTimestamp() }` to `users/{uid}`
- Wrapped in try-catch — never blocks signup; client-side `createUserDocument` is the fallback
- **Why Gen 1:** `beforeUserCreated` (Gen 2 equivalent) requires Firebase Identity Platform (GCIP), which this project does not use

### createCheckoutSession (Gen 2, callable)
- Called from `UpgradePage` via `httpsCallable(getFunctions(), 'createCheckoutSession')`
- Params: `{ priceId, userId }`
- Creates Stripe customer if none exists, stores `stripeCustomerId` on user doc
- Returns `{ url }` — client redirects to Stripe-hosted checkout

### stripeWebhook (Gen 2, HTTP)
- **Hard-rejects** requests if `STRIPE_WEBHOOK_SECRET` is not set (returns 400)
- `checkout.session.completed` → sets `tier:'pro'`, `subscriptionId`, `currentPeriodEnd`
- `customer.subscription.updated` → updates `tier` and `currentPeriodEnd`
- `customer.subscription.deleted` → sets `tier:'free'`

## Known bugs fixed (do not reintroduce)
- **Timestamp arithmetic**: `trialStartedAt` is a Firestore Timestamp. `Date.now() - timestamp` = NaN.
  Fixed in both `App.jsx` (`tsToMs`) and `usePlan.js` (`toMs`). Never use raw subtraction.
- **`toMs()` plain-number passthrough (critical — trial never expired)**: `account.trialStartedAt` is
  pre-converted to plain ms by `tsToMs()` before being stored on the account object. Old `toMs()` in
  `usePlan.js` returned `null` for plain numbers → `null == null` → trial granted forever. Fix: both
  `toMs()` and `tsToMs()` now have `if (typeof ts === 'number') return ts;` as the first guard.
- **`favorites.has()` without guard**: `ActivityCard` and `FavoritesScreen` now use `favorites?.has()`.
  Passing undefined favorites crashes both components.
- **Projector dots `key={i}`**: Fixed to `key={item?.id ?? i}` — index keys break reconciliation on shuffle.
- **Avatar initials hardcoded `'T'` fallback**: Now falls back to email initial, then `'?'`.
- **UpgradeModal price wrong**: Was `$99/year`, now correctly shows `$79/year` matching Stripe + landing page.
- **Wrong default grade in TWEAK_DEFAULTS**: Was `"9–12"`, now `"3–5"` (the majority audience).
- **Duplicate onboarding flows**: `TutorialModal` (blocking modal, `ofd:tutorialSeen`) removed entirely.
  Welcome card (`ofd:welcomed:{uid}`, in-page, per-account) is the sole onboarding experience.
- **Logo whitespace**: `LOGO_SRC` now points to `ofthedaylogi.png` (clean crop). `oftheday-logo.png`
  (74% transparent whitespace) must never be used in the UI.

## Activity card discoverability
- Cards with `useNow={true}` render a `.card-chevron` (`›`) on the right edge
- Muted gray (`#C8C3BA`) at rest, teal on `.card:hover` and `.card.selected`
- Detail panel empty state shows a `←` icon + "Tap any activity to preview directions, the student prompt, and projector controls."

## Usage streak system
- Computed on `MainApp` mount via `useState` initializer — reads `localStorage('ofd:streak')` (`{ count, lastDate }`)
- Logic: if `lastDate` is today → return existing count; if yesterday → increment; if older → reset to 1
- `streakCount` state is read-only after mount (no setter exposed)
- Sidebar shows `🔥 N-day streak` when `streakCount >= 2` and sidebar is expanded; collapsed shows `🔥` emoji only
- Milestone labels appear at 7, 14, 30 days (`sidebar-streak-badge`, gold pill)
- CSS classes: `.sidebar-streak`, `.sidebar-streak--collapsed`, `.sidebar-streak-flame`, `.sidebar-streak-label`, `.sidebar-streak-badge`

## Activity history (used-today tracking)
- `readUsedToday()` / `recordUsedToday(ids)` helpers in App.jsx use `localStorage('ofd:usedToday')` (`{ date, ids[] }`)
- Object resets automatically when `date` !== today
- `usedToday` state in `MainApp` initialized from `readUsedToday()`
- `useEffect` on `[routine]` calls `recordUsedToday` + refreshes state whenever routine changes (load, swap, etc.)
- `BrowseScreen` receives `usedToday` prop; Library browse-cards show a teal `✓ Today` badge if `usedToday.has(a.id)`
- `ActivityCard` also accepts `usedToday` — shows `.card-used-badge` on the cat line when `usedNow && !useNow`
  (badge hidden on Today view cards since they're obviously in today's routine)

## Share with a colleague
- `ProfileSheet` has `handleShare` that copies a referral message to clipboard via `navigator.clipboard.writeText`
- Message: "I use OfTheDay.net for my morning meetings — a complete, grade-appropriate routine in seconds. Try it free: https://oftheday.net"
- Local `copied` state flips button label to "✓ Link copied — share it!" for 3 seconds, then resets
- Button: `.btn-secondary`, full-width, positioned between "Save Changes" and "Sign Out" in sheet footer

## Sidebar nav labels
The sidebar nav uses these exact string labels (referenced throughout App.jsx as `activeNav` values):
- "Today", "Library", **"Routines"** (was "Build" — renamed 2026-06-15), "Word of the Day",
  "Do Now", "On This Day", "My Activities", "Favorites"
- `buildViews` array: `["Routines", "My Routines", "My Activities"]`
- Internal component/state names (`BuildScreen`, `builderDraft`, `startBuilderWithActivity`) were NOT renamed — only the user-visible label changed

## Live site status
**Last updated: 2026-06-15**
- All code changes are on `main` and auto-deploy to Firebase Hosting via GitHub Actions
- Firebase Hosting URL: `oftheday-c6490.web.app` (all deploys land here)
- `oftheday.net` DNS still points to Netlify — custom domain not yet connected to Firebase Hosting
- Firebase Console sign-in methods need enabling before auth works on live site
- GitHub Actions secrets (VITE_FIREBASE_*) are set and confirmed working (runs show `***` not blank)

## Pending work — in priority order
1. **Firebase Console** — Enable Email/Password + Google sign-in methods; add `oftheday.net` to Authorized Domains; set Support Email on Google provider
2. **DNS** — Connect `oftheday.net` custom domain in Firebase Console → Hosting; update Netlify DNS A records to Firebase IPs
3. **Stripe go-live** — Switch to live keys in `functions/.env`, register webhook in Stripe Dashboard, set `STRIPE_WEBHOOK_SECRET`
4. **Email capture delivery** — "Get a Free Morning Meeting Resource Pack" form collects emails but delivers nothing; build delivery or update copy
5. **Demo mode** — Let unauthenticated teachers browse sample activities before signup; biggest conversion lever
6. **Activity pool expansion** — Thin in some categories; repetition possible within weeks of daily use
7. **Weekly activity history view** — Show teachers what they've used this week so they can plan variety
8. **Projector design section** — Visual theme swatches + live preview in Settings Sheet
9. **Component extraction** — App.jsx is 4000+ lines; see "Code architecture" section below

## Code architecture
`src/App.jsx` is a single-file component at 4000+ lines. This is intentional for now — all state lives in `MainApp` and flows down as props. The trade-off:

**Pros of current approach:**
- No prop-drilling through Context or Redux; state flow is traceable
- AI sessions can read the full component tree in one file
- No import/export wiring to manage

**When to extract (not yet):**
Extract a component when it: (a) has its own significant state that never needs to live in MainApp, AND (b) can receive everything it needs as props with no callbacks back up except event handlers.

**Current candidates (in order of readiness):**
1. `DisplayMode` (~400 lines) — most self-contained; receives `items`, `initialIdx`, `style`, fires `onDone`; no shared state with MainApp except `projectorStyle` which is already a prop
2. `AuthScreen` (~300 lines) — completely standalone; only fires `onAuth` callback
3. `ProfileSheet` (~70 lines) — self-contained; already well-isolated

**Do not extract yet:**
- `BrowseScreen`, `RoutineBuilderScreen`, `FavoritesScreen` — too many callbacks into MainApp state; extraction would require Context or significant refactor

**Rule:** Do not extract to reduce line count. Extract only when a component becomes independently testable and its state is truly local.

## Git branch
Active development: `main` (dev branch `claude/activity-of-day-app-2JlTT` merged)

## Claude Code settings
`.claude/settings.json` is committed to the repo. It configures:
- **PostToolUse hook (Bash)** — detects `git commit` commands and automatically runs `git push -u origin main` so every commit goes straight to GitHub
