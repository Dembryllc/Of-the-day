# OfTheDay.net — Claude Code Rules

> **Source of truth:** This repo's commit history is authoritative. If anything in this file conflicts with actual code in the repo, the code wins. Verify HEAD before acting on any status claim.

## Stack
- Vite + React 19, react-router-dom 7
- Firebase Auth (email/password + Google) + Firestore + Firebase Hosting
- Cloud Functions (Node 22 — upgraded from 20 on 2026-06-23)
- Firebase project: `oftheday-c6490` — never confuse with Datability or Easy Annotate projects
- Stripe (LIVE keys are active as of 2026-08-25 — checkout creates real `cs_live_` sessions — but the live webhook is NOT registered, see Pending Ops #2), Mailgun (`mg.oftheday.net`), Anthropic Claude

## Deployment
- GitHub Actions auto-deploys on push to `main`: hosting + functions + Firestore rules (~1 min hosting, ~3 min with functions)
- Auth SA stored in `secrets.oftheday`
- ANTHROPIC_API_KEY rotated 2026-06-21 (was exposed in chat) — confirm it's in GitHub Actions secrets, not hardcoded anywhere

### Deploy gate — required secrets (RESOLVED 2026-07-02)
`.github/workflows/deploy.yml` starts with a **"Verify required secrets are present"** step that hard-fails the ENTIRE deploy (`exit 1`, never builds) if any one of 15 GitHub Actions secrets is empty. The runner prints `MISSING: <NAME>` for each.
- All 15 secrets (6 `VITE_FIREBASE_*`, `ANTHROPIC_API_KEY`, Stripe ×6, Mailgun ×2) are present as of the 2026-07-02 deploy (run `28564996010`, commit `7830314`), which passed the secrets check and deployed hosting + functions + Firestore rules successfully. The 2026-06-26 → 2026-06-30 outage described in older notes is over — do not re-diagnose this unless a fresh deploy actually fails the gate again.
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
| `onUserCreate` | 1 | auth.onCreate | Welcome email only — see note below |
| `createCheckoutSession` | 2 | onCall | Stripe checkout |
| `stripeWebhook` | 2 | onRequest | Stripe lifecycle |
| `sendLeadMagnet` | 2 | onCall | Mailgun resource email |

## Trial Setup Is Client-Side, Not Server-Side (fixed 2026-08-25)
`onUserCreate` used to also write `plan:'trial'`+`trialStartedAt` via the Admin SDK, but that write failed `PERMISSION_DENIED` on every single signup — the Gen 1 auth-trigger service account lacks Firestore access, unlike Gen 2 functions (`createCheckoutSession` writes to Firestore fine). This did **not** actually break trials: `AuthScreen.jsx` (email signup) and `App.jsx`'s `onAuthStateChanged` handler (Google sign-in, comment: "New Google user — Cloud Function may not have run yet") both already write the same fields client-side under the user's own auth, which Firestore rules allow. The redundant, permanently-failing Admin SDK write was removed from `onUserCreate` — it only sends the welcome email now. If you ever want server-side trial setup back, the real fix is granting the App Engine default service account (`oftheday-c6490@appspot.gserviceaccount.com`) the Cloud Datastore User role — not re-adding this write as-is.

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

## Lead Magnet — Morning Meeting Resource Pack (added 2026-07-13)
- The landing-page capture form → Firestore `waitlist` doc + `sendLeadMagnet` callable → Mailgun email with 10 activities inline **plus** a download button for the printable PDF.
- The PDF is a real static file: `public/resources/morning-meeting-resource-pack.pdf` (3 pages, US Letter), served at `/resources/morning-meeting-resource-pack.pdf` (Firebase Hosting serves exact static files before the `**` SPA rewrite — no rewrite change needed).
- Regenerate it with `scripts/resource-pack/render.js` (see header comment; needs `playwright-core` + a Chromium). The 10 activities in `scripts/resource-pack/pack.html` must stay in sync with `RESOURCE_PACK_ACTIVITIES` in `functions/index.js`.
- The capture success state also links the PDF directly (`.capture-download`), so the pack is reachable even if email delivery fails.

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
1. ~~Add the 8 missing GitHub Actions secrets~~ — done, deploy gate cleared 2026-07-02 (see Deployment gate above).
2. **🔴 Stripe live webhook — NOT registered, checkout is live and broken end-to-end.** Confirmed 2026-08-25: live keys are already active (`createCheckoutSession` returns real `cs_live_...` sessions — 3 successful invocations in Cloud Functions logs), but `stripeWebhook` has **zero log entries ever**. That means anyone who completes a real payment right now gets charged and never gets flipped to `tier: 'pro'` — silent revenue with no product delivered. Fix: register the live-mode webhook endpoint (`stripeWebhook`'s Cloud Functions URL) in the Stripe Dashboard for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. This needs either dashboard access or a Stripe API key with write scope for the OfTheDay account — coordinate with co-founder, since going live was apparently already decided but the webhook step got missed.
3. ~~Mobile phone check~~ — done 2026-07-04 via Playwright at 375px. Found and fixed a real bug: see "Mobile Topbar Bug" below.
4. **hello@oftheday.net inbound mail** — nothing RECEIVES mail there yet. Mailgun on `mg.oftheday.net` is send-only; fix is a ~10-min DNS task at Netlify (the domain registrar) + ImprovMX forwarding — exact steps: `notes/2026-07-13-session.md`. **Interim state (2026-07-13, user-approved):** all site-visible contact references were swapped to `dembryllc@gmail.com`, and outgoing email sets `Reply-To: dembryllc@gmail.com` (`REPLY_TO` in `functions/index.js`). `EMAIL_FROM` must STAY `hello@oftheday.net` — a gmail.com From via Mailgun fails DMARC. Once forwarding is live, swap back: grep `dembryllc@gmail.com` across `src/`, `functions/index.js` (REPLY_TO), and `scripts/resource-pack/pack.html` (then regenerate the PDF).

## Mobile Topbar Bug — Fixed 2026-07-04
At ≤540px, `.topbar-right.grade-control-wrap` (grade chips + filter chips on the Today/Library/etc. topbars) is `flex-shrink: 0` and wider than the viewport. In a `justify-content: space-between` flex row, all the shrink pressure fell on `.topbar-left`, collapsing it to `width: 0` — its text (date/component summary) rendered one word per line instead of wrapping normally. Landing-page nav was fine (fixed 2026-07-02); this was a separate bug in the app shell itself, not caught by that fix.
- **Fix:** new `@media (max-width: 540px)` block in `src/styles.css` — `.topbar` wraps, `.topbar-left` and `.topbar-right.grade-control-wrap` each take a full-width row (`flex: 1 1 100%`), and the chip row scrolls horizontally instead of squeezing the text column.
- Verified with Playwright (375×812) on `/demo`: no horizontal page overflow, topbar text renders on its own line at full width, chip row scrolls.

## Landing Page (redesigned 2026-06-30)
Full redesign shipped to `main` (`src/LandingPage.jsx` + `src/landing.css`): hero showcases BOTH tools, "Two Tools" section, interactive AI-slide spotlight with a 4-theme CSS mockup + theme switcher, 11-card feature grid (incl. AI Lesson Slide Creator, PowerPoint/Slides export, Cloud Sync, FERPA "No Student Data"), lesson-slide FAQ + pricing. Reconciled with prior `main` polish (button glow, teal labels, hero dot-grid, animated FAQ) during merge. Still honor "Removed — Do Not Re-Add" below (no testimonials).

## Notes / Obsidian Vault Sync
- Session logs live in the repo at `notes/` (e.g. `notes/2026-06-30-session.md`), Obsidian-friendly frontmatter (date/project/tags).
- The user's Obsidian vault is **local, in iCloud**: `~/Library/Mobile Documents/com~apple~CloudDocs/obsidianvault` (Mac). Cloud/remote sessions CANNOT reach it — only local sessions can.
- Sync flow (run locally): `git pull origin main` → copy the note into the vault (`cp notes/<file>.md ~/Library/Mobile\ Documents/com~apple~CloudDocs/obsidianvault/`) OR run the user's local `/record-to-vault` skill.
- The `/record-to-vault` skill and the vault both exist only on the user's Mac — they are not available in cloud sessions.

## Co-founder Note
OfTheDay.net is co-founded. Coordinate on major product/business decisions before implementing.
