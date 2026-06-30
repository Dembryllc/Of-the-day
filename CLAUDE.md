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

### ⚠️ Deploy gate — required secrets (current blocker as of 2026-06-30)
`.github/workflows/deploy.yml` starts with a **"Verify required secrets are present"** step that hard-fails the ENTIRE deploy (`exit 1`, never builds) if any one of 15 GitHub Actions secrets is empty. The runner prints `MISSING: <NAME>` for each.
- **Present & verified:** all 6 `VITE_FIREBASE_*`, `ANTHROPIC_API_KEY`
- **MISSING (8) — these are why every deploy since 2026-06-26 fails:** `VITE_STRIPE_MONTHLY_PRICE_ID`, `VITE_STRIPE_ANNUAL_PRICE_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`
- **Fix (no code change):** add the 8 in GitHub → Settings → Secrets and variables → Actions. Price IDs: monthly `price_1Te35JB2eRKsbhTpqJrBmNRE`, annual `price_1Te38IB2eRKsbhTp9GXJjxM0` (used for BOTH the `VITE_` and non-`VITE_` copies). Test-mode Stripe keys are fine for now.
- CI writes `functions/.env` from these secrets at deploy time — there is no committed `functions/.env`. Local `firebase deploy` needs that file created by hand.
- **Never** paste secret values into chat/terminal — they belong only in the GitHub secret store.

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

## Slide Export — PowerPoint / Google Slides (added 2026-06-30)
- `src/lib/exportSlide.js` builds a `.pptx` via **pptxgenjs** (`^4.0.1`), **lazy-loaded** with `await import('pptxgenjs')` so it splits into its own chunk (~368 KB) and stays out of the main bundle. Do NOT convert to a static import.
- Two exports: `exportToPowerPoint(data)` (direct `.pptx` download) and `exportToGoogleSlides(data)` (downloads the same `.pptx` + opens Google Drive — Google Slides opens `.pptx` natively via File → Open). A full Drive-API/OAuth upload path was built then deliberately removed as overkill.
- Renders all 4 themes (focus/soft/blocks/depth) with a 16:9 instructional layout; detects new vs legacy slide format via `data.essentialQuestion !== undefined`.
- Wired into `src/LessonSlideCreator.jsx` (Create view + each saved-slide card).

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
1. **🔴 Add the 8 missing GitHub Actions secrets** (see Deployment gate above) — this is the #1 blocker; nothing deploys until done. User adds via GitHub web UI. Test-mode Stripe keys OK.
2. **Stripe go-live** — after #1, swap test → live keys, register live webhook for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Price IDs read from env (`import.meta.env.VITE_STRIPE_*` in `src/App.jsx`), not hardcoded.
3. **Mobile phone check** — manual test at 375px

## Landing Page (redesigned 2026-06-30)
Full redesign shipped to `main` (`src/LandingPage.jsx` + `src/landing.css`): hero showcases BOTH tools, "Two Tools" section, interactive AI-slide spotlight with a 4-theme CSS mockup + theme switcher, 11-card feature grid (incl. AI Lesson Slide Creator, PowerPoint/Slides export, Cloud Sync, FERPA "No Student Data"), lesson-slide FAQ + pricing. Reconciled with prior `main` polish (button glow, teal labels, hero dot-grid, animated FAQ) during merge. Still honor "Removed — Do Not Re-Add" below (no testimonials).

## Notes / Obsidian Vault Sync
- Session logs live in the repo at `notes/` (e.g. `notes/2026-06-30-session.md`), Obsidian-friendly frontmatter (date/project/tags).
- The user's Obsidian vault is **local, in iCloud**: `~/Library/Mobile Documents/com~apple~CloudDocs/obsidianvault` (Mac). Cloud/remote sessions CANNOT reach it — only local sessions can.
- Sync flow (run locally): `git pull origin main` → copy the note into the vault (`cp notes/<file>.md ~/Library/Mobile\ Documents/com~apple~CloudDocs/obsidianvault/`) OR run the user's local `/record-to-vault` skill.
- The `/record-to-vault` skill and the vault both exist only on the user's Mac — they are not available in cloud sessions.

## Co-founder Note
OfTheDay.net is co-founded. Coordinate on major product/business decisions before implementing.
