# EXECUTION BACKLOG — OfTheDay.net

**Date:** 2026-05-30
**Format:** Prioritized by urgency and business impact. Each item includes files involved, recommended fix, effort estimate, risk, business impact, and dependencies.

---

## Priority Legend

| Priority | Meaning |
|---|---|
| P0 — Fix Immediately | Blocking commercial viability or causing silent breakage right now |
| P1 — Fix This Week | High business impact, low-to-medium effort, unblocks other work |
| P2 — Fix This Month | Required for commercial launch; medium-to-high effort |
| P3 — Future | Important but not blocking launch |
| Ignore | Not worth the effort relative to impact |

---

## P0 — Fix Immediately

---

### BACKLOG-001: Missing SPA Redirect Rule (Netlify 404s)

| Field | Value |
|---|---|
| **Priority** | P0 |
| **Issue** | No `[[redirects]]` rule in `netlify.toml`. Any URL path other than `/` returns a Netlify 404. If URL routing is ever added, all direct links and browser refreshes break immediately. |
| **Files Involved** | `netlify.toml` |
| **Recommended Fix** | Add one redirect rule: `from = "/*"`, `to = "/index.html"`, `status = 200` |
| **Effort** | 5 minutes |
| **Risk** | Low |
| **Business Impact** | Prevents future routing breakage; enables any link-sharing of app sub-views |
| **Dependency** | None |

---

### BACKLOG-002: Delete Duplicate `of-the-day-netlify.html`

| Field | Value |
|---|---|
| **Priority** | P0 |
| **Issue** | `of-the-day-netlify.html` is bit-for-bit identical to `index.html` (confirmed same 1.59MB size). It is publicly accessible, serves no purpose, and creates confusion in the repository and for any developer who looks at the project. |
| **Files Involved** | `of-the-day-netlify.html` |
| **Recommended Fix** | Delete the file. Verify nothing links to it. |
| **Effort** | 5 minutes |
| **Risk** | Low (verify no external links before deleting) |
| **Business Impact** | Reduces repository confusion; removes orphaned 1.59MB public file |
| **Dependency** | None |

---

### BACKLOG-003: No Landing Page (Zero Conversion from Cold Traffic)

| Field | Value |
|---|---|
| **Priority** | P0 |
| **Issue** | OfTheDay.net has no landing page. All traffic lands on the auth screen with zero product context. Cold traffic conversion rate is effectively 0%. |
| **Files Involved** | None exist — new file must be created |
| **Recommended Fix** | Create a static `landing.html` (or React route at `/`) with hero, features, pricing preview, and CTA. See `LANDING_PAGE_AUDIT.md` for full copy direction. |
| **Effort** | 3–5 days |
| **Risk** | Low |
| **Business Impact** | Critical — no landing page means all marketing and SEO investment returns zero |
| **Dependency** | None (can be built independently of all other backlog items) |

---

## P1 — Fix This Week

---

### BACKLOG-004: Add Build Pipeline (Replace In-Browser Babel)

| Field | Value |
|---|---|
| **Priority** | P1 |
| **Issue** | The entire app is in a custom-bundled 1.59MB HTML file with in-browser Babel JSX compilation. There is no build step, no source file access, no npm build command. This blocks: performance improvements, Firebase migration, proper env vars, CSP tightening, analytics injection, and all other technical improvements. |
| **Files Involved** | `index.html`, `netlify.toml`, `package.json` |
| **Recommended Fix** | Extract JSX source from the custom bundler, set up Vite + React, configure `npm run build` to output to `dist/`, update `netlify.toml` with `[build]` section. |
| **Effort** | 5–8 days |
| **Risk** | High (source extraction from custom bundler is the hard part) |
| **Business Impact** | Unlocks every other technical improvement in this backlog |
| **Dependency** | None — but blocks BACKLOG-007, 008, 009, 010, 012, 013 |

---

### BACKLOG-005: Add Onboarding Flow

| Field | Value |
|---|---|
| **Priority** | P1 |
| **Issue** | `tutorialSeen` localStorage field exists but is never read or used. New users get no guidance on how to use the app. First-session abandonment is likely high. |
| **Files Involved** | `index.html` (React source) |
| **Recommended Fix** | Implement a 4-step first-run modal triggered by `tutorialSeen === false`: grade picker → today view tour → activity swap demo → projector mode intro. Set `tutorialSeen = true` on completion or skip. |
| **Effort** | 2–3 days |
| **Risk** | Low |
| **Business Impact** | High — reduces first-session abandonment, improves Day 7 retention |
| **Dependency** | Easier after BACKLOG-004 (build pipeline), but can be done within custom bundler if needed |

---

### BACKLOG-006: Fix Projector Cross-Device Limitation

| Field | Value |
|---|---|
| **Priority** | P1 |
| **Issue** | Projector sync uses localStorage polling (1.2s interval). Only works in same browser on same device. Breaks for teachers with a dedicated classroom display machine. |
| **Files Involved** | `index.html` (projector mode React components) |
| **Recommended Fix** | Replace localStorage polling with Firebase Realtime Database or server-sent events. Implement 4-digit "room code" system: teacher enters code on display device, controller device broadcasts activity changes. |
| **Effort** | 3–5 days |
| **Risk** | Medium |
| **Business Impact** | High — projector mode is a key differentiator; fixing cross-device support makes it usable for the majority of classroom setups |
| **Dependency** | Requires Firebase Realtime Database (part of Firebase migration) or a separate WebSocket/SSE endpoint |

---

### BACKLOG-007: Expand "On This Day" Fallback to All 365 Days

| Field | Value |
|---|---|
| **Priority** | P1 |
| **Issue** | `netlify/functions/on-this-day.js` fallback data covers only 13 dates. On any other date where the onthisday.com fetch fails, the On This Day panel returns empty content with no user-visible explanation. |
| **Files Involved** | `netlify/functions/on-this-day.js` |
| **Recommended Fix** | Write a comprehensive 365-day fallback dataset of classroom-appropriate historical facts. Store as a static JSON file imported by the function. Each date should have 3–5 facts. |
| **Effort** | 3–5 days (data curation, not engineering) |
| **Risk** | Low |
| **Business Impact** | Medium — prevents silent feature failure for 352 out of 365 days |
| **Dependency** | None |

---

### BACKLOG-008: Add Error States for External API Failures

| Field | Value |
|---|---|
| **Priority** | P1 |
| **Issue** | When the On This Day or Word of the Day external fetches fail, the user sees nothing or a blank panel. There are no friendly error messages, no retry buttons, and no degraded-mode indicators. |
| **Files Involved** | `index.html` (On This Day and Word of the Day React components), `netlify/functions/on-this-day.js` |
| **Recommended Fix** | Add explicit error state components with message ("Couldn't load today's facts — check your connection"), retry button, and offline fallback content. |
| **Effort** | 1–2 days |
| **Risk** | Low |
| **Business Impact** | Medium — prevents teachers from perceiving the product as broken during network issues |
| **Dependency** | Easier after BACKLOG-004 (build pipeline) |

---

## P2 — Fix This Month

---

### BACKLOG-009: Add Landing Page (Full Implementation)

| Field | Value |
|---|---|
| **Priority** | P2 (implementation) — P0 (strategic priority) |
| **Issue** | The quick landing page created in P0 needs a full implementation with proper SEO, responsive design, copy testing infrastructure, and analytics. |
| **Files Involved** | New `landing.html` or React route; `netlify.toml` for routing |
| **Recommended Fix** | Full implementation per `LANDING_PAGE_AUDIT.md`. Add OG tags, schema markup, sitemap.xml, robots.txt. A/B test hero taglines. |
| **Effort** | 3–5 days |
| **Risk** | Low |
| **Business Impact** | Critical — this is the top of the conversion funnel for all paid growth |
| **Dependency** | BACKLOG-004 (build pipeline) for proper SEO and asset optimization |

---

### BACKLOG-010: Replace localStorage Auth with Firebase Auth

| Field | Value |
|---|---|
| **Priority** | P2 |
| **Issue** | Auth is entirely localStorage-based. Password hash is stored client-side. No email verification. No password reset. No multi-device support. Accounts are irrecoverable if localStorage is cleared. This is the foundational blocker for monetization. |
| **Files Involved** | `index.html` (entire auth system), `netlify/functions/sync.js` |
| **Recommended Fix** | Implement Firebase Auth (email/password). Replace `localStorage["ofd:account"]` with Firebase Auth user. Replace `localStorage["ofd:session"]` with Firebase Auth session token. Add email verification, password reset flows. |
| **Effort** | 5–8 days |
| **Risk** | High (requires migrating existing users from localStorage to Firebase accounts) |
| **Business Impact** | Critical — without real auth, Stripe is impossible, multi-device is impossible, school licensing is impossible |
| **Dependency** | BACKLOG-004 (build pipeline), Firebase project provisioned |

---

### BACKLOG-011: Add Firestore User Records

| Field | Value |
|---|---|
| **Priority** | P2 |
| **Issue** | No server-side user records exist. Netlify Blobs is a KV cache, not a user database. There is no place to store subscription state, plan tier, or user metadata that can be queried from the server. |
| **Files Involved** | `netlify/functions/sync.js` → replace with Firebase Function |
| **Recommended Fix** | Create Firestore `users` collection per schema in `STRIPE_READINESS_REPORT.md`. Migrate sync.js to Firebase Functions using Firestore. |
| **Effort** | 3–5 days |
| **Risk** | Medium |
| **Business Impact** | Critical for Stripe integration, school licensing, admin features |
| **Dependency** | BACKLOG-010 (Firebase Auth), BACKLOG-004 (build pipeline) |

---

### BACKLOG-012: Add Pricing Page Skeleton

| Field | Value |
|---|---|
| **Priority** | P2 |
| **Issue** | There is no pricing page, no pricing signal anywhere in the app, and no infrastructure for free/paid distinction. Teachers cannot upgrade even if they want to. |
| **Files Involved** | New React component; requires landing page route |
| **Recommended Fix** | Build a pricing page with Free/Pro/School tiers. Add "Upgrade" CTA buttons. These can be non-functional initially (collect email for waitlist) while Stripe is being built. |
| **Effort** | 1–2 days (static) or 5–8 days (with Stripe integration) |
| **Risk** | Low (static) / Medium (with Stripe) |
| **Business Impact** | High — a visible pricing page signals commercial intent and collects upgrade intent data |
| **Dependency** | Landing page; Stripe integration if making it functional |

---

### BACKLOG-013: Expand Activity Library to 50+ Activities

| Field | Value |
|---|---|
| **Priority** | P2 |
| **Issue** | 18 base activities is too thin for daily use across a 180-day school year. Teachers will exhaust the novelty within 2–4 weeks and churn. |
| **Files Involved** | `index.html` (POOL array in React source) |
| **Recommended Fix** | Curate 50+ base activities across the 14 categories, with proper grade-level tagging and energy level metadata. Add grade-specific content packs for K-2, 3-5, 6-8, 9-12. |
| **Effort** | 3–5 days (content curation) |
| **Risk** | Low |
| **Business Impact** | High — content depth drives retention; thin libraries drive churn |
| **Dependency** | Easier after BACKLOG-004 (build pipeline) for data file management |

---

## P3 — Future

---

### BACKLOG-014: Add Analytics

| Field | Value |
|---|---|
| **Priority** | P3 |
| **Issue** | No analytics platform is integrated. There is zero visibility into user behavior, feature adoption, session duration, or conversion funnels. |
| **Recommended Fix** | Add Plausible Analytics (privacy-friendly, FERPA-appropriate for education) or PostHog (product analytics + feature flags). |
| **Effort** | 4 hours |
| **Dependency** | BACKLOG-004 (build pipeline for clean script injection) |

---

### BACKLOG-015: Add Error Tracking (Sentry)

| Field | Value |
|---|---|
| **Priority** | P3 |
| **Issue** | No error tracking. Runtime errors are invisible. Production bugs are discovered by users, not developers. |
| **Recommended Fix** | Add Sentry free tier. Initialize in app root. Capture unhandled errors and rejected promises. Add to Netlify Functions as well. |
| **Effort** | 4 hours |
| **Dependency** | BACKLOG-004 (build pipeline) |

---

### BACKLOG-016: Add Stripe Monetization

| Field | Value |
|---|---|
| **Priority** | P3 |
| **Issue** | No payment infrastructure exists. Cannot monetize the product. |
| **Recommended Fix** | Per `STRIPE_READINESS_REPORT.md`. Requires Firebase Auth + Firestore + Firebase Functions + build pipeline first. |
| **Effort** | 4–5 days (after all prerequisites are complete) |
| **Dependency** | BACKLOG-004, 010, 011 all must be complete first |

---

### BACKLOG-017: Add School/District Tier and Admin Dashboard

| Field | Value |
|---|---|
| **Priority** | P3 |
| **Issue** | No multi-seat licensing, no admin interface, no school-level feature management. |
| **Recommended Fix** | Design school admin dashboard: teacher roster, seat management, usage overview. Implement `schools` Firestore collection, school-level routing for Pro features. |
| **Effort** | 2–3 weeks |
| **Dependency** | BACKLOG-010, 011, 016 |

---

### BACKLOG-018: Add HTTPS Force Redirect and HSTS to netlify.toml

| Field | Value |
|---|---|
| **Priority** | P3 |
| **Issue** | Force-HTTPS and HSTS are not version-controlled in netlify.toml. |
| **Recommended Fix** | Add HTTP → HTTPS redirect rule and `Strict-Transport-Security` header to `netlify.toml`. |
| **Effort** | 15 minutes |
| **Dependency** | None |

---

## Ignore For Now

| Item | Reason to Ignore |
|---|---|
| PWA / Service Worker | Adds complexity; offline use is not the core value proposition; revisit after launch |
| Native iOS/Android app | No evidence of demand; web app is sufficient for classroom use; very high dev cost |
| AI activity generation | Fun idea but distraction before core product is monetized; revisit at 1000+ users |
| Social sharing of routines | Low-priority feature; no evidence teachers want this from initial research |
| Student-facing features | Completely different product; not a logical extension of current scope |
| Real-time collaboration | Very high complexity; no identified buyer demand at this stage |
