# OfTheDay.net — Claude Code Terminal Handoff

**Date:** 2026-06-16  
**Branch:** `main`  
**Deploy target:** Firebase Hosting + Cloud Functions (`oftheday-c6490`)

---

## What this project is

Morning meeting planner for K–12 teachers. Teachers open it, get a complete grade-appropriate routine (Greeting, Sharing, Group Activity, Morning Message) in seconds, and project it full-screen for their class. Freemium SaaS — free tier + Pro at $79/year via Stripe.

**Stack:** React 19 + Vite 8 + Firebase Auth + Firestore + Firebase Hosting + Cloud Functions (Node 20) + Mailgun email + Stripe payments.

---

## Current state — what's built and working

### Frontend (all committed to main, not yet deployed to live site)
- Full morning meeting routine generator with grade filtering
- Projector / DisplayMode full-screen overlay for smartboards
- Library with 60+ activities, Word of the Day, Do Now, On This Day history
- Routine builder (save, edit, load saved routines)
- Custom activities + custom vocab + custom Do Now problems
- Freemium gates (3 saved routines / 1 custom activity on Free)
- Stripe upgrade flow → `/upgrade` page
- Auth: email/password + Google sign-in (`src/AuthScreen.jsx`)

### Daily habit retention system (all implemented)
- **Streak counter** — reads/writes `ofd:streak` localStorage; shown in sidebar + topbar pill
- **Dynamic sidebar greeting** — time-aware + streak-aware ("Good morning" → "🔥 Day 7 in a row")
- **Streak milestone toasts** — fires once at 3/7/14/30 days; suppressed by `ofd:streakMilestones`
- **Sidebar content teasers** — Word of the Day + On This Day teasers with midnight countdown
- **Completion card** — shown after projecting; persisted via `ofd:projectedToday`
- **Friday preview card** — "Come back Monday, your routine is ready"
- **Returning teacher detection** — if projected yesterday, hero copy changes to "Welcome back!"
- **"New to you" badges** — teal NEW badge on activities never projected before (`ofd:seenActivities`)
- **New-count in routine header** — "· 3 new to you" in teal

### Email (code done, needs Mailgun credentials to go live)
- `onUserCreate` Cloud Function sends welcome email on signup
- `sendLeadMagnet` callable sends resource pack (10 activities) when landing page form submitted
- Provider: Mailgun (`mailgun.js` + `form-data` in `functions/`)
- **Blocked on:** `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` in `functions/.env` → then `firebase deploy --only functions`

### Code architecture
```
src/App.jsx          ~3,400 lines — MainApp + all screens
src/AuthScreen.jsx   — extracted, self-contained auth
src/DisplayMode.jsx  — extracted projector overlay
src/lib/catMeta.js   — CAT_META + MORNING_MEETING_CATS
src/lib/projector.js — all projector constants + helpers
functions/index.js   — 5 Cloud Functions
```

---

## What is NOT deployed to the live site yet

The live site at `oftheday.net` is **still pointing to Netlify** (old version). Firebase Hosting is at `oftheday-c6490.web.app`.

All code is on `main` and ready to deploy — it just requires the Mac deploy step:
```bash
cd "/Users/mikeradicone/Desktop/of the day"
git pull origin main
npm run build
firebase deploy --only hosting
```

---

## Pending work — in priority order

### 1. Firebase Console (blocks auth on live site)
- Authentication → Sign-in method → Enable **Email/Password** and **Google**
- Authentication → Settings → Authorized domains → Add `oftheday.net`

### 2. DNS cutover (connects real domain to Firebase)
- Firebase Console → Hosting → Add custom domain → `oftheday.net`
- Update Netlify DNS A records to Firebase IPs provided

### 3. Stripe go-live
- Switch `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` to live keys in `functions/.env`
- Register webhook in Stripe Dashboard for events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Deploy functions

### 4. Mailgun activation (email is coded, needs credentials)
- Add to `functions/.env` on the Mac:
  ```
  MAILGUN_API_KEY=key-...
  MAILGUN_DOMAIN=mg.oftheday.net
  ```
- `firebase deploy --only functions`
- **Note:** The previously shared API key (`1c20ae0...`) was exposed in chat and must be regenerated before use

### 5. Demo mode (biggest conversion lever not yet built)
- Let unauthenticated teachers browse a sample routine before signing up
- Currently the app redirects `/` → auth if not logged in
- Approach: detect no-auth state in `MainApp`, show a read-only preview with 4 sample activities

### 6. Activity pool expansion
- 60 activities total; some categories thin (Movement Break has 3, Teacher Note has 2)
- Repetition likely within 3–4 weeks of daily use
- Add via `scripts/activities-data.js` → `npm run seed`

### 7. Weekly activity history view
- Show teachers what they've used this week to help plan variety
- `ofd:usedToday` resets daily — need a `ofd:usedThisWeek` that resets on Monday

---

## Key env vars (never commit these)

| File | Var | Where to get it |
|------|-----|-----------------|
| `.env.local` | `VITE_FIREBASE_*` | Firebase Console → Project Settings → Web App |
| `functions/.env` | `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `functions/.env` | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → signing secret |
| `functions/.env` | `MAILGUN_API_KEY` | Mailgun → Settings → API Keys |
| `functions/.env` | `MAILGUN_DOMAIN` | Mailgun → Send → Domains |

---

## Critical technical gotchas

**Firestore Timestamps** — `trialStartedAt` is a Firestore `Timestamp` object. `Date.now() - timestamp` = `NaN`. Always use `tsToMs(ts)` in `App.jsx` or `toMs(ts)` in `usePlan.js`. Both have `if (typeof ts === 'number') return ts` as the first guard.

**Plan resolution** — `src/lib/usePlan.js` is the single source of truth. Priority: `tier:'pro'` → `plan:'pro'/'school'` → `plan:'trial'` within 14 days → Free. Do not add plan checks anywhere else.

**Email delivery is silent** — `getMailgun()` returns null if env vars not set. All email calls fail silently. This is intentional — never let email failure block auth or form submission.

**`ofd:projectedToday`** — stored as an ISO date string (e.g. `"2026-06-16"`). Set on projector exit. Used for completion card + returning teacher detection. Resets when the date changes.

**Logo** — always use `/assets/ofthedaylogi.png` (clean crop). Never use `oftheday-logo.png` (74% whitespace).

**App.jsx is intentionally large** — ~3,400 lines. Do not extract components unless they have (a) fully local state AND (b) need no callbacks up except event handlers. `BrowseScreen`, `FavoritesScreen`, `BuildScreen` stay in `App.jsx`.

---

## Commands

```bash
npm run dev        # local dev (Vite, localhost:5173)
npm run build      # production build → dist/
npm run seed       # seed Firestore activities (needs scripts/service-account.json)

# Deploy (run on Mac only):
firebase deploy --only hosting    # frontend
firebase deploy --only functions  # Cloud Functions
firebase deploy                   # everything
```

---

## File to read first

Start with `CLAUDE.md` — it's the full technical reference for this project.  
This document is the "where we are + what's next" brief.
