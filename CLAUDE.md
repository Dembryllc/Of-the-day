# OfTheDay.net — Claude Code Context

## What this is
Morning meeting planner for K–12 teachers using Responsive Classroom. Teachers open it and get a complete, grade-appropriate routine (Greeting, Sharing, Group Activity, Morning Message) in seconds. Includes projector mode, Word of the Day, Do Now warm-ups, On This Day facts, and cloud sync.

## Tech stack
- **Frontend**: React 19, Vite 8, react-router-dom 7
- **Auth + DB**: Firebase Auth + Firestore (`oftheday-c6490`)
- **Hosting**: Firebase Hosting (serves `dist/`)
- **Functions**: Firebase Cloud Functions gen1 (`functions/index.js`)
- **Build output**: `dist/` (gitignored)

## Architecture
Single-page app. One `index.html` entry, one JS/CSS bundle, React Router handles all routes client-side. Firebase Hosting rewrites every non-asset request to `index.html`.

### Routes
| Path | Component | Auth |
|------|-----------|------|
| `/` | `LandingPage` | Public (redirects to `/dashboard` if authed) |
| `/login` | `AuthScreen` | Public (redirects to `/dashboard` if authed) |
| `/dashboard` | `MainApp` | Protected (redirects to `/login` if unauthed) |
| `?projector=1` | `ProjectorReceiver` | Public — checked before router |
| `*` | Redirect to `/` | — |

## Key files
```
src/
  App.jsx          — all app logic (3400+ lines); Auth, MainApp, AuthScreen, projector, modals
  LandingPage.jsx  — marketing landing page (React component)
  landing.css      — landing page styles (scoped under .lp to avoid conflicts with app CSS)
  styles.css       — app styles (Outfit font, all component classes)
  main.jsx         — React entry, ErrorBoundary
  lib/
    firebase.js    — Firebase app init (throws if VITE_FIREBASE_* missing)
    firestore.js   — Firestore helpers: createUserDocument, saveDataSnapshot, fetchActivities, etc.
  tweaks-panel.jsx — dev tweaks UI

functions/
  index.js         — onthisday Cloud Function (fetches from onthisday.com, filters for classrooms)

scripts/
  seed.js          — seeds Firestore activities collection (requires service-account.json)
  activities-data.js — canonical activity pool (59 activities)

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

## Firestore schema
```
users/{uid}
  name, email, grade, plan, createdAt

users/{uid}/data/main
  version, exportedAt, favorites[], customActivities[], savedRoutines[],
  customVocab{}, customDoNow{}, projectorStyle{}

activities/{id}
  id, cat, title, meta, time, prompt, starter, directions, source, sourceUrl
```

## CSS notes
- App CSS lives in `src/styles.css` — uses Outfit font (woff2 in `public/fonts/`)
- Landing page CSS in `src/landing.css` — all selectors scoped under `.lp` parent class to prevent conflicts with app class names (`.nav`, `.btn-primary`, etc. overlap)
- `.app` class owns `height: 100vh; overflow: hidden` for the dashboard layout
- `body` has no overflow or background set globally — each route manages its own via its root element or `useLayoutEffect`

## Known pending work
1. **Stripe integration** — Pro plan UI exists but payments not wired up
2. **Email capture form** — shows success but doesn't persist email anywhere (Netlify Forms removed)
3. **Seed script** — needs `scripts/service-account.json` from Firebase Console → Service Accounts
4. **Component extraction** — all app logic is in one 3400-line `App.jsx`
5. **Merge to main** — active dev branch is `claude/activity-of-day-app-2JlTT`

## Git branch
Active development: `claude/activity-of-day-app-2JlTT`
