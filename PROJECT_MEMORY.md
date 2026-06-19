# OfTheDay.net — Project Memory

**Purpose:** Morning meeting planner for K–12 teachers (Responsive Classroom).  
**Live site:** oftheday.net (DNS → Netlify; Firebase Hosting URL: oftheday-c6490.web.app)  
**Firebase project:** `oftheday-c6490`  
**Repo:** dembryllc/of-the-day, default branch `main`  
**Last updated:** 2026-06-19

---

## Stack
| | |
|---|---|
| React 19 + Vite 8 | Frontend SPA |
| Firebase Auth | Email/password + Google sign-in |
| Firestore | User docs, activity pool |
| Firebase Hosting | Serves `dist/` |
| Firebase Functions (mixed gen) | onthisday, createCheckoutSession, stripeWebhook, sendLeadMagnet (Gen 2); onUserCreate (Gen 1) |
| Stripe (test mode) | Checkout sessions, subscription lifecycle |
| Mailgun | Welcome email + lead magnet resource pack |

---

## Key Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app (~3,400 lines) — MainApp, modals, BrowseScreen, BuildScreen, etc. |
| `src/AuthScreen.jsx` | Login/signup/Google/reset — fires `onAuthed` callback |
| `src/DisplayMode.jsx` | Projector overlay — receives routine + style props, fires `onExit` |
| `src/LandingPage.jsx` | Marketing page — email capture calls `sendLeadMagnet` CF |
| `src/DistrictPage.jsx` | /district — school/district sales page, inquiry form → Firestore |
| `src/lib/firebase.js` | Firebase init; exports `functions` singleton |
| `src/lib/firestore.js` | Firestore helpers (createUserDocument, saveDataSnapshot, etc.) |
| `src/lib/usePlan.js` | Plan resolution hook → 'pro' or 'free' |
| `src/lib/catMeta.js` | CAT_META (14 categories) + MORNING_MEETING_CATS |
| `src/lib/projector.js` | Projector constants, helpers, normalizers |
| `functions/index.js` | All six Cloud Functions |
| `scripts/activities-data.js` | Canonical activity pool (60 activities) |

---

## Routes
| Path | Component | Auth |
|------|-----------|------|
| `/` | LandingPage | Public |
| `/login` | AuthScreen | Public |
| `/dashboard` | MainApp | Protected |
| `/upgrade` | UpgradePage | Protected |
| `/district` | DistrictPage | Public |
| `/privacy` | PrivacyPage | Public |
| `/terms` | TermsPage | Public |
| `?projector=1` | ProjectorReceiver | Public |

---

## Freemium Gates
| Feature | Free | Pro |
|---------|------|-----|
| Morning meeting categories | All | All |
| Non-MM categories (Brain Teaser, SEL, Movement, Mindfulness) | First 3 | All |
| Saved routines | 3 | Unlimited |
| Custom activities | 1 | Unlimited |
| Projector mode | Full | Full |

**Plan resolution order (usePlan.js):**
1. `account.tier === 'pro'` → Pro (Stripe)
2. `account.plan === 'pro'` or `'school'` → Pro (manual override)
3. `account.plan === 'trial'` + `trialStartedAt` within 14 days → Pro
4. Everything else → Free

---

## Firestore Schema
```
users/{uid}
  name, email, grade, plan, createdAt, trialStartedAt,
  tier, stripeCustomerId, subscriptionId, currentPeriodEnd

users/{uid}/data/main
  favorites[], customActivities[], savedRoutines[],
  customVocab{}, customDoNow{}, projectorStyle{}

activities/{id}
  id, cat, title, meta, time, prompt, starter, directions, source, sourceUrl

waitlist/{id}
  email, name?, school?, district?, title?, seats?,
  source ('landing-page' | 'school-inquiry' | 'district-inquiry'), submittedAt
```

---

## Critical Gotchas
- **Timestamp arithmetic:** `trialStartedAt` is a Firestore Timestamp. Never use raw subtraction — always `tsToMs()` in App.jsx or `toMs()` in usePlan.js.
- **`toMs()` plain-number passthrough:** Both helpers have `if (typeof ts === 'number') return ts;` as first guard — do not remove.
- **Logo:** Use `ofthedaylogi.png` only. `oftheday-logo.png` has 74% whitespace — never use it in UI.
- **`functions` singleton:** Import from `src/lib/firebase.js`, not via `getFunctions()` directly.
- **`ProjectorReceiver` / `PROJECTOR_STATE_KEY`:** Defined in App.jsx — do not duplicate.
- **`projectorWindowUrl()`:** Defined at module scope in App.jsx — only one definition allowed.
- **Firebase Console (required before auth works):** Enable Email/Password + Google sign-in; add `oftheday.net` to Authorized Domains.

---

## localStorage Keys
| Key | Shape | Purpose |
|-----|-------|---------|
| `ofd:streak` | `{ count, lastDate }` | Usage streak |
| `ofd:usedToday` | `{ date, ids[] }` | Today's routine IDs (resets daily) |
| `ofd:seenActivities` | `[id, ...]` | All ever-projected activity IDs |
| `ofd:projectedToday` | ISO date string | Whether teacher projected today |
| `ofd:favorites` | `[id, ...]` | Favorited activity IDs |
| `ofd:savedRoutines` | `[{...}, ...]` | Saved routine objects |
| `ofd:sidebarCollapsed` | `'1'` or `'0'` | Sidebar collapse state |
| `ofd:welcomed:{uid}` | `'1'` | Welcome card dismissed (per account) |
| `ofd:projectorStyle` | `{...}` | Projector style settings |
| `ofd:projectorState` | `{...}` | Cross-window projector state bridge |

---

## Pending Work (priority order)
1. **Firebase Console** — Enable sign-in methods; add `oftheday.net` to Authorized Domains
2. **DNS** — Connect `oftheday.net` to Firebase Hosting (currently points to Netlify)
3. **Stripe go-live** — Swap test keys → live keys in `functions/.env`
4. **Mailgun** — Regenerate exposed API key; add to `functions/.env`; deploy functions
5. **Demo mode** — Let unauthenticated teachers browse sample activities (biggest conversion lever)
6. **Activity pool expansion** — Thin in some categories
7. **Weekly activity history view**
8. **Projector design section** — Visual theme swatches + live preview

---

## Deploy
```bash
# Frontend (auto via GitHub Actions on push to main)
npm run build && firebase deploy --only hosting

# Functions (manual)
firebase deploy --only functions

# Local dev
npm run dev
```
**Important:** Push to GitHub triggers auto-deploy to Firebase Hosting. `oftheday.net` DNS not yet pointed to Firebase (still Netlify).

---

## Stripe
- Test mode; price IDs in `UpgradePage`: monthly `price_1Te35JB2eRKsbhTpqJrBmNRE`, annual `price_1Te38IB2eRKsbhTp9GXJjxM0`
- Webhook URL: `https://us-central1-oftheday-c6490.cloudfunctions.net/stripeWebhook`
- `STRIPE_WEBHOOK_SECRET` **must** be set — webhook hard-rejects if missing
