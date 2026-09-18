# OfTheDay.net — Claude Code Rules

> **Source of truth:** This repo's commit history is authoritative. If anything in this file conflicts with actual code in the repo, the code wins. Verify HEAD before acting on any status claim.

## Stack
- Vite + React 19, react-router-dom 7
- Firebase Auth (email/password + Google) + Firestore + Firebase Hosting
- Cloud Functions (Node 22 — upgraded from 20 on 2026-06-23)
- Firebase project: `oftheday-c6490` — never confuse with Datability or Easy Annotate projects
- Stripe (LIVE — real charges; account `acct_1ArtSdB2eRKsbhTp`, shown in the dashboard as "Iepdata"/Dembry LLC and shared with other Dembry products, so always check you're on the right endpoint/product before changing anything), Mailgun (`mg.oftheday.net`), Anthropic Claude

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

## Stripe Live Webhook (registered 2026-08-25)
Before this, live keys were active but the only webhook endpoints registered were **test mode**, so `stripeWebhook` had never once been invoked — real payments would have charged the card and never set `tier:'pro'`.
- Live endpoint: **"OfTheDay production"**, `we_1U8VdEB2eRKsbhTpKzrx1k12` → `https://stripewebhook-qznlc6fzoa-uc.a.run.app` (that Cloud Run URL *is* this project's `stripeWebhook`; confirmed via the function's own audit log).
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. API version pinned to **2017-06-05** to match the old test endpoints — deliberate: newer versions moved `current_period_end` off the subscription onto its items, which would break the `sub.current_period_end` read in `stripeWebhook`.
- `STRIPE_WEBHOOK_SECRET` was updated to the new live endpoint's signing secret and redeployed. Each endpoint has its **own** secret — if you ever roll it or add another endpoint, update this secret and redeploy or every event 400s.
- **Proven end to end 2026-08-25** with a real live subscription: `checkout.session.completed` delivered → 200 `{received:true}` → Firestore `tier:'pro'` → app showed Pro. Live mode has no synthetic test events, so this took a real checkout (free at the time: `trial_period_days: 14` means $0 due today, so a test subscription costs nothing if cancelled inside the trial).
- That first real test immediately caught a **latent handler crash** — see below. Signature verification was never the problem; the handler was.

## `current_period_end` Is Not On The Subscription Anymore (fixed 2026-08-25)
The first real `checkout.session.completed` verified fine, then the handler threw `Cannot use "undefined" as a Firestore value (found in field "currentPeriodEnd")`, so the whole `set()` was discarded and the paying user never got `tier:'pro'` — a 500, which Stripe then retried.
- Cause: recent API versions moved `current_period_end` off the Subscription object onto its **items**. Pinning the webhook endpoint to 2017-06-05 preserves the old shape for **event payloads only** — `stripe.subscriptions.retrieve()` is a separate API call that uses the **SDK's** version (`stripe@^22`), where the top-level field is gone.
- Fix: `periodEndOf(sub)` reads `sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null`. The `?? null` is load-bearing — Firestore rejects `undefined` and throws away the entire write, so one missing field silently cost a subscriber their access.
- If you ever bump the endpoint's API version or the stripe package, re-check this.

## Billing Portal (added 2026-08-25, confirmed active 2026-09-18)
Cancellation/card updates go through the **Stripe-hosted billing portal**, opened from the Subscription section of the profile sheet and backed by the `createPortalSession` callable (verifies the caller owns the account before creating the session). Hidden in demo mode — no uid to bill.
- The commit that added this (`4dd092a`) warned the portal still needed one-time activation in the Stripe dashboard. **It does not** — configuration `bpc_1U8VPJB2eRKsbhTpsoquypgS` is live, active and `is_default`, with cancel-at-period-end, invoice history and payment-method update enabled. Do not re-open this as a blocker.
- A portal cancellation only syncs back to Firestore because the live webhook is registered (`customer.subscription.deleted`). If that endpoint is ever removed, cancelled users silently keep `tier:'pro'`.

## Routine Variety — Energy Is A Ranking Signal, Not A Filter (fixed 2026-09-18)
`pickRandom` used to exclude anything whose energy didn't match `filters.energy`. Against a 60-item library that starved the daily routine: at the default **Medium**, the whole app offered 2 Greetings, 5 Sharings, 2 Group Activities and **exactly 1 Morning Message** — that slot could never change, and Shuffle had nothing to shuffle. Measured total: 20 distinct routines, one slot deterministic.
- Energy now honours the setting **strictly only while it can still offer variety** (`onEnergy.length >= MIN_ENERGY_POOL`, currently 4); below that it widens to everything grade-appropriate and weights the requested energy up (`ENERGY_WEIGHT`, currently 3). Verified live over 30 shuffles: 8 / 15 / 4 / 4 distinct per category, 1,920 distinct routines.
- **Do not turn energy back into a hard `!==` exclusion.** It self-corrects as content grows — once a category has 4+ activities at a given energy it goes strict again on its own.
- The real fix is still content. Morning Message and Group Activity have 4 activities each; those are the thinnest categories in the app. Also consider collapsing the 4-way energy taxonomy (Calm / Low / Medium / Active) to 3 — nobody can distinguish Calm from Low, and four buckets shred a small library.

## `activityMatchesGrade` — Band Lookup Bug (fixed 2026-09-18)
`GRADE_RITUAL_ACTIVITY_IDS` is keyed by **band** ("K–2", "3–5", …), but the function looked it up with the raw `grade`. It computed `const band = gradeToBand(grade)` and then used `band` only in the `activity.grades` branch. So an individual grade ("3", set via the Profile picker) returned `undefined` and fell through to `return true` — **grade filtering was silently off entirely** for those users, while anyone who clicked a topbar band chip got filtered content. Two paths, two behaviours, no indication which you were on. Now falls back to the band.

## Navigation — Leaf Views Need A Way Back (fixed 2026-09-18)
Word of the Day, Do Now, On This Day, My Activities, Favorites and This Week (`LEAF_VIEWS`) are launched from Today's shortcut row **and** the Library tab row, but are not sidebar destinations. Before the fix: no back button, and `navActive` mapped them to the **Library** nav item — so arriving from Today, the app claimed you were in a section you'd never visited. "My Activities" was in both `libraryViews` and `buildViews` so two items lit at once; "This Week" was in neither so nothing lit.
- `leafOrigin` records the screen a leaf was entered from (a `useEffect` on `activeNav`, so it works from every entry point without touching each call site) and `BackToOrigin` renders a pill labelled with the destination — "← Today" or "← Library", never a bare "Back".
- Every view now belongs to exactly one nav group.
- **Structurally these should be sheets over Today, not nav destinations** — they're glanceable content (Word of the Day is one word), not places. This fix makes the current model honest; it doesn't make it right.

## Routine Builder — Pick / Arrange / Inspect (rebuilt 2026-09-18)
`RoutineBuilderScreen` used to have no way to add an activity from inside it: three separate "Browse Library" buttons all called `setActiveNav("Library")`, so a five-block routine cost ten full screen changes. It also showed no detail — blocks rendered `cat`/`title`/`prompt` with Up/Down/Copy/Remove and nothing was clickable, so you assembled a routine from titles alone.
- Three columns now: **picker** (search + category chips + `+ Add`, fed by `allActivities` via `routineProps`), **canvas** (the draft blocks, selectable), **detail**. Building never leaves the builder.
- `DetailContent` takes an optional **`actions`** prop that replaces its footer. That is how the builder reuses the whole detail body (directions, prompt, sentence starter, supports, source) without inheriting Today's buttons — "Replace" is meaningless mid-build. Don't fork the detail markup; pass `actions`.
- Block buttons call `e.stopPropagation()` because the block row is now itself a click target.
- `BuildScreen` stacks its two panels instead of placing them side by side, and they are named "Build a routine" / "Your custom activities" — the old "Activity Builder" / "Routine Builder" pair was indistinguishable, and the custom-activity panel (usually empty) held ~35% of the screen.
- **`.build-workspace--stacked` is `display: block`, not a one-column grid — deliberate.** `.routine-col` carries `overflow: hidden; min-height: 0`, which collapses its intrinsic contribution, so an auto grid track sized to 514px against a section 978px tall and (with `align-items: start`) the section painted straight over the row below it. Block boxes size to their content. The doubled class is also deliberate: `.build-workspace` is defined later in `styles.css`, so a single-class override loses on source order.
- The inner `.builder-workspace` grid must not declare its own height or `overflow` — `.build-workspace` is already the scroll container, and giving the inner grid one reintroduces the same overflow. Cap `.builder-picker-list` instead.

## Library — Browse + Inspect (rebuilt 2026-09-18)
`BrowseScreen` put Use Today / Add to Routine / Project on every card — 138 cards, 414 buttons — while the card itself was not clickable, so you chose an activity from its title and "3 min · Medium" with no way to read the prompt first.
- Cards are selectable and fill a **detail panel** (`.browse-detail`) built from `DetailContent` with a Library-specific `actions` footer. Cards keep one visible button (Use Today, or Replace in replacement mode); the other three actions moved into the panel. 414 buttons -> 138.
- Added a **category chip row** (same `.builder-cat-chip` styling as the routine builder) over what was a single flat list with ~6,700px of hidden scroll.
- Removed the banner that read *"Showing every library item. The grade picker updates Today, Word of the Day, and Do Now recommendations, but the Library stays complete"* — along with the grade chips in the Library topbar that it was apologising for. They mutated a global preference and did nothing to this screen. **If a grade filter is wanted here, make it filter; don't re-add a control that explains why it doesn't.**
- `.browse-scroll` stays the scroll container; `.browse-body` only splits the row beside it and must not take height/overflow of its own — see the routine-builder note above for what happens when an inner wrapper claims both.
- Card heights are equalised by grid row stretch plus `margin-top: auto` on `.browse-card-actions`, **not** a `min-height` — a fixed height just adds dead space now that each card carries a single button.

## Today Screen — The Routine Is The Screen (rebuilt 2026-09-18)
Today was laid out like a landing page: eyebrow, hero headline, subhead paragraph, feature rail, secondary nav, and only then the activities. Measured on `/demo`, the first activity card started at **492px** (landscape 1366x1024), **688px** (portrait 1024x1366) and **496px** (phone 375x812) — on phone only 2 of 4 cards were visible at once. After: **151 / 175 / 253px**, and 4 / 4 / 3 cards visible.
- **The hero card is gone.** Its headline, "Your daily classroom ritual is ready.", was the same sentence as the logged-out landing page, and its paragraph sold the product to someone who had already signed up. Onboarding belongs to the welcome card (`showWelcome`), which already covers grade -> routine -> project. The one part worth keeping — the return-visit nudge when `projectedYesterday && !projectedToday` — survives as `.today-nudge`, one line.
- **The STEP 1-4 rail is gone.** It was the activity cards with their content removed; the cards are already numbered and carry the same category labels.
- **The meeting is described once.** It used to be stated four times before you could see it: the topbar subtitle (hardcoded "Greeting, Sharing, Activity, Message"), the "Ready · N components · ~N min" line, the hero paragraph, and the rail. The topbar line now carries date, grade, activity count, minutes, new-to-you count and streak — the count being the part you can't see yet. "components" was product-speak; it says "activities".
- **Project Today and Shuffle live in the topbar** (`.topbar-actions`, deliberately outside `.grade-control-wrap` so the <=540px rule that gives the chip row its own scrolling row doesn't drag the buttons in with it). The primary action must never scroll away.
- **One routine control, not three.** The chip showing `time · energy` opens the same sheet that a separate "Adjust" chip and a mobile-only "Filters" button also opened; both are removed.
- **"More classroom tools" moved below the cards.** It is a browse action and was sitting between the teacher and the routine they opened the app for.
- The detail panel's project button says **"Project from here"** — both callers of `DetailContent`'s default footer project the routine *starting at* that activity, which is not what the topbar's "Project Today" does. Don't collapse the two labels back together.
- **Still not done:** the detail panel is permanently open and spends ~35% of landscape width on one activity. Opening it on tap would give the cards the full width. That is an interaction change, not a layout one, and was left alone.

## Slide Saves — Direct Firestore (Not Cloud Function)
Slide saves go directly to Firestore from the frontend. **Do not add a Cloud Function save path.** A function-based save path was tried and abandoned as unreliable.

## Lesson Slide Character Limits (updated 2026-06-25)
| Field | Limit |
|---|---|
| studentTask | 300 |
| discussionPrompt | 250 |
| exitTicket | 250 |

**These must stay in sync** between `src/LessonSlideCreator.jsx` LIMITS object AND `functions/index.js` SLIDE_SYSTEM_PROMPT. Both places, every time.

## Projector Slide Sizing (fixed 2026-08-27)
`src/LessonSlideDisplay.jsx` sizes projected lesson slides. The caps were originally tuned against a laptop preview, so body text bottomed out at ~18px on a 1080p smartboard with ~80% of each column empty.
- Sizes are **vmin-based clamps**, so a single number only means something at a stated resolution — don't grep for the figures below expecting literals. At 1920×1080 (vmin = 10.8) they render as: learning target **54px** (`clamp(24px, 5vmin, 76px)`), body **32px** (`clamp(15px, 3vmin, 44px)`), column header **22px**. Previously ~32 / 18 / 19px. vmin (not vw) keeps it height-bound so taller content still fits.
- **Column 3 is the constrained one** and must not be "simplified" back to a static clamp. It stacks three sections in the height columns 1–2 give to one, and `studentTask` allows 300 chars vs 250 for the others (see Character Limits above), so max-length lessons used to clip their last line — silently losing content mid-lesson. `useFitFontSize` now binary-searches (14 iterations, `scrollHeight <= clientHeight + 1`) for the largest size at which Student Task, Discussion Prompt and Exit Ticket all fit, between `min(22, max(11, 1.5·vmin))` and `min(36, max(13, 2.5·vmin))` — at 1080p roughly 16–27px. Typical lessons land at the 27px ceiling; worst case settles near 20px instead of truncating.
- It re-fits on `resize`, and its dep array includes the three text fields and the theme — if you add a fourth section to column 3, add its ref and field there too.
- If you raise any character limit, re-check the worst case here at 1920×1080 and 1366×768 before shipping.

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
2. ~~Stripe live webhook not registered~~ — **registered 2026-08-25**, see "Stripe Live Webhook" below.
3. ~~Mobile phone check~~ — done 2026-07-04 via Playwright at 375px. Found and fixed a real bug: see "Mobile Topbar Bug" below.
4. **hello@oftheday.net inbound mail** — nothing RECEIVES mail there yet. Mailgun on `mg.oftheday.net` is send-only; fix is a ~10-min DNS task at Netlify (the domain registrar) + ImprovMX forwarding — exact steps: `notes/2026-07-13-session.md`. **Interim state (2026-07-13, user-approved):** all site-visible contact references were swapped to `dembryllc@gmail.com`, and outgoing email sets `Reply-To: dembryllc@gmail.com` (`REPLY_TO` in `functions/index.js`). `EMAIL_FROM` must STAY `hello@oftheday.net` — a gmail.com From via Mailgun fails DMARC. Once forwarding is live, swap back: grep `dembryllc@gmail.com` across `src/`, `functions/index.js` (REPLY_TO), and `scripts/resource-pack/pack.html` (then regenerate the PDF).
5. **Two duplicate live subscriptions on the owner's own card** (found 2026-09-18) — `sub_1U8Qk1B2eRKsbhTpW6YWccxr` and `sub_1U8QklB2eRKsbhTptUiWmHFz`, both `cus_V8iApOF9EQQ61Q` / `dembryllc@gmail.com`, created 60 seconds apart during the 2026-08-25 go-live test. Both 14-day trials converted on 2026-09-08 and charged $79 each ($158 total, invoices `UI1IWEOS-0003`/`-0004`); both renew 2027-09-08. The monthly test sub from the same night was cancelled cleanly at $0. These are the ONLY subscriptions the live account has ever had — no real customer revenue is mixed in. Cancel + refund both; it also exercises `customer.subscription.deleted` in production for the first time. Detail: `notes/2026-09-18-session.md`.
   - **When live-testing checkout in future:** use one subscription, cancel it in the same session, and record the subscription ID in the session note — a forgotten trial converts silently two weeks later.

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

## Ownership — Sole, Not Co-founded (corrected 2026-09-18)
OfTheDay.net is **solely owned by Mike Radicone**. Co-founding was under consideration at one point; it did not happen, and that possibility is closed.

This file previously carried a "Co-founder Note" instructing sessions to coordinate on major product/business decisions before implementing. It reflected that open possibility rather than a fact, and it outlived it — at real cost: the 2026-07-04 session cited it as the reason for deferring Stripe go-live (`notes/2026-07-04-session.md`), and later sessions repeated the deferral. **Do not reintroduce it, and do not stall a product or business decision waiting on a second approver — there isn't one.** Mike is the only decision-maker; ask him directly.

Live-money and outward-facing actions still need his explicit go-ahead, as they would for any owner.
