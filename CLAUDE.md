# OfTheDay.net — Claude Code Rules

> **Source of truth:** This repo's commit history is authoritative. If anything in this file conflicts with actual code in the repo, the code wins. Verify HEAD before acting on any status claim.

## Stack
- Vite + React 19, react-router-dom 7
- Firebase Auth (email/password + Google) + Firestore + Firebase Hosting
- Cloud Functions (Node 22 — upgraded from 20 on 2026-06-23)
- Firebase project: `oftheday-c6490` — never confuse with Datability or Easy Annotate projects
- Stripe (test mode — live keys pending), Mailgun (`mg.oftheday.net`), Anthropic Claude

## Deployment
- GitHub Actions auto-deploys on push to `main`: hosting + functions + Firestore rules (~1 min hosting, ~3 min with functions)
- Auth SA stored in `secrets.oftheday`
- ANTHROPIC_API_KEY rotated 2026-06-21 (was exposed in chat) — confirm it's in GitHub Actions secrets, not hardcoded anywhere

## Cloud Functions — Critical Architecture
`generateSlide` and `simplifySlide` are **`httpsV1.onRequest`** called via `fetch('/api/generate-slide')` with a Bearer token. Firebase Hosting rewrites `/api/generate-slide` → `generateSlide`.

**Do NOT change these to `onCall`.** They are intentionally Gen 1 onRequest.

| Function | Gen | Type | Note |
|---|---|---|---|
| `generateSlide` | 1 | `httpsV1.onRequest` | Bearer token — NOT onCall |
| `simplifySlide` | 1 | `httpsV1.onRequest` | Bearer token — NOT onCall |
| `onthisday` | 1 | `httpsV1.onRequest` | Wikipedia scraper |
| `onUserCreate` | 1 | auth.onCreate | Writes plan:'trial' + welcome email |
| `createCheckoutSession` | 2 | onCall | Stripe checkout |
| `stripeWebhook` | 2 | onRequest | Stripe lifecycle |
| `sendLeadMagnet` | 2 | onCall | Mailgun resource email |

## Slide Saves — Direct Firestore (Not Cloud Function)
Slide saves go directly to Firestore from the frontend. **Do not add a Cloud Function save path.** A function-based save path was tried and abandoned as unreliable.

## Lesson Slide Character Limits (updated 2026-06-25)
| Field | Limit |
|---|---|
| studentTask | 300 |
| discussionPrompt | 250 |
| exitTicket | 250 |

**These must stay in sync** between `src/LessonSlideCreator.jsx` LIMITS object AND `functions/index.js` SLIDE_SYSTEM_PROMPT. Both places, every time.

## Demo Mode
- Route: `/demo` — uses `DEMO_ACCOUNT = { uid: null, name: 'Guest Teacher', ... }`
- All cloud operations guarded by `if (!account?.uid) return`
- Guest clicking "Generate" in Lesson Slides → redirected to `/login?signup=1` (not upgrade modal)

## Firestore Rules
Firestore rules are now deployed via CI (this was NOT the case before 2026-06-22 — do not assume old behavior).

## Timestamp Arithmetic — Critical Bug Pattern
`trialStartedAt` is a Firestore `Timestamp` object. `Date.now() - timestamp` produces `NaN`.
Always use `toMs(ts)` in `usePlan.js` or `tsToMs(ts)` in `App.jsx`. Both functions have a `typeof ts === 'number'` guard — never remove it.

## Plan Resolution (usePlan.js — single source of truth)
Priority order:
1. `account.tier === 'pro'` → Pro
2. `account.plan === 'pro'` or `'school'` → Pro (manual override)
3. `account.plan === 'trial'` + `trialStartedAt` within 14 days → Pro
4. Everything else → Free

Never bypass `usePlan.js` for plan checks — don't add a second plan-resolution path.

## Logo
- Use `ofthedaylogi.png` (clean crop) — located at `public/assets/ofthedaylogi.png`
- Never use `oftheday-logo.png` — 74% transparent whitespace, breaks layouts

## Removed — Do Not Re-Add
- `TutorialModal` (blocking modal, `ofd:tutorialSeen`) — removed, sole onboarding is the welcome card
- Testimonials / Use Cases sections on landing page — removed, unattributed quotes hurt credibility
- Cloud Function save path for slides — abandoned, direct Firestore only

## Pending Ops (code complete — no code work needed)
1. **Stripe go-live** — swap test keys in GitHub secrets, register live webhook, update price IDs in `src/App.jsx` (monthly `price_1Te35JB2eRKsbhTpqJrBmNRE`, annual `price_1Te38IB2eRKsbhTp9GXJjxM0`)
2. **Mobile phone check** — manual test at 375px
3. **Mailgun** — confirm `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` in GitHub Actions secrets

## Co-founder Note
OfTheDay.net is co-founded. Coordinate on major product/business decisions before implementing.
