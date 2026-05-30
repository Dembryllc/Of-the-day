# 30/60/90 DAY ROADMAP — OfTheDay.net

**Date:** 2026-05-30
**Objective:** Move from functional MVP to commercially launchable SaaS product with paying users.

---

## Executive Summary

The product is functional but pre-commercial. The path to first paying users requires three parallel tracks: (1) fix the critical technical foundation (build pipeline, real auth), (2) build the commercial surface area (landing page, pricing), and (3) improve retention fundamentals (onboarding, content depth). These tracks have dependencies — the build pipeline is the master blocker that unblocks most of the others.

**Primary constraint:** The custom-bundled 1.59MB HTML file is the single largest blocker. Until it is replaced with a proper build pipeline, most technical improvements are difficult or impossible to ship cleanly.

**Secondary constraint:** Without real user accounts (Firebase Auth), Stripe integration is impossible, school licensing is impossible, and the product cannot be trusted as a paid tool.

---

## Phase 1: Days 1–30 — Fix the Foundation

**Theme:** Stabilize the product, remove critical blockers, establish commercial infrastructure prerequisites.

**Goal:** By Day 30, the app should load fast, have a landing page, have a working build pipeline, and have early error visibility.

---

### Week 1 (Days 1–7): Quick Wins and Immediate Fixes

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Add `[[redirects]]` SPA rule to `netlify.toml` | `netlify.toml` | 5 min | Direct URL access returns app, not 404 | None |
| Delete `of-the-day-netlify.html` | `of-the-day-netlify.html` | 5 min | File no longer exists or is publicly accessible | Verify no external links first |
| Add force-HTTPS redirect and HSTS header | `netlify.toml` | 15 min | HTTP requests redirect to HTTPS | None |
| Add Cache-Control headers for assets | `netlify.toml` | 30 min | `/assets/*` returns `max-age=31536000`; HTML returns `no-cache` | None |
| Add Sentry error tracking (free tier) | `index.html` / build | 4 hrs | Runtime errors visible in Sentry dashboard | Low |
| Expand On This Day fallback to full 365 days | `netlify/functions/on-this-day.js` | 3–5 days | On This Day panel shows content on any date, even if onthisday.com is down | Medium (data curation effort) |

**Dependencies:** None for week 1 items.

---

### Week 2–3 (Days 8–21): Build Pipeline Replacement

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Extract React JSX source from custom bundler | `index.html` | 2–3 days | Source files readable and editable in `src/` directory | High — custom bundler extraction is the riskiest step |
| Set up Vite + React project structure | `package.json`, `vite.config.js`, `src/` | 1 day | `npm run dev` runs local dev server with hot reload | Medium |
| Port all React components to Vite build | `src/` files | 2–3 days | `npm run build` produces working `dist/index.html` under 400KB | High |
| Update `netlify.toml` with `[build]` section | `netlify.toml` | 30 min | Netlify runs `npm run build`, serves `dist/` | Low |
| Verify Netlify Functions still work with new setup | `netlify/functions/` | 1 day | Both functions respond correctly via `/.netlify/functions/` | Medium |

**Dependencies:** None for build pipeline work except source extraction.

**Success Criteria for Week 2–3:** `npm run build` runs cleanly, Netlify deploys from `dist/`, app loads in under 2 seconds on a 10 Mbps connection.

**Risk:** Source extraction from the custom bundler is the highest-risk step in the entire roadmap. If the custom bundler is particularly opaque, this could take 5–7 days instead of 2–3.

---

### Week 4 (Days 22–30): Onboarding and Landing Page MVP

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Build landing page (static HTML or new React route) | New `landing.html` or `src/Landing.jsx` | 3–5 days | Page loads at `/`, has hero, features, pricing preview, CTA | Low |
| Add OG tags, meta description, schema markup | `index.html` / `landing.html` | 4 hrs | OG preview shows correctly when link is shared; schema validates | Low |
| Implement onboarding flow (first-run modal) | React source (`tutorialSeen` hook) | 2 days | New users see 4-step modal on first app open | Low |
| Grade level prompt in onboarding | React source | 4 hrs | Grade picker appears in step 1 of onboarding, selection persists | Low |

**Dependencies:** Build pipeline (BACKLOG-004) makes landing page SEO work correctly; landing page can be built as a static file in parallel.

**Phase 1 End State:**
- App loads in < 2 seconds
- Landing page exists at the root domain
- SPA 404s are fixed
- Error tracking is live
- Build pipeline is running
- On This Day has full 365-day fallback

---

## Phase 2: Days 31–60 — Real Auth and Monetization Infrastructure

**Theme:** Replace device-locked auth with real user accounts. Build the plumbing for Stripe. Begin Firebase migration.

**Goal:** By Day 60, teachers can create real cloud accounts, reset their passwords, and log in from any device. A pricing page exists. Stripe checkout works in test mode.

---

### Days 31–40: Firebase Hosting Migration

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Provision Firebase project (prod + staging) | Firebase Console | 4 hrs | Both projects exist, billing configured | Low |
| Create `firebase.json` with SPA rewrite + headers | `firebase.json` | 4 hrs | `firebase deploy` succeeds; app loads at Firebase URL | Medium |
| Create `.firebaserc` with project IDs | `.firebaserc` | 1 hr | `firebase use staging` switches correctly | Low |
| Deploy preview channel for testing | CLI | 1 hr | `firebase hosting:channel:deploy oftheday-migration` produces test URL | Low |
| DNS cutover from Netlify to Firebase | Domain registrar | 2 hrs + 48 hr propagation | `oftheday.net` serves from Firebase CDN | Medium |
| Keep Netlify as rollback for 7 days | Netlify dashboard | 0 | Netlify site remains live but DNS no longer points to it | None |

**Dependencies:** Requires build pipeline (Phase 1) complete.

---

### Days 41–50: Firebase Auth Implementation

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Implement Firebase Auth (email/password) | `src/` auth components | 3–4 days | Users can sign up, log in, log out with Firebase-managed sessions | Medium |
| Replace `localStorage["ofd:account"]` with Firebase Auth user | `src/` | 2 days | Account data tied to Firebase UID, not localStorage | High (migration) |
| Add email verification flow | `src/` auth components | 1 day | New users receive verification email; unverified users see prompt | Low |
| Add password reset flow | `src/` auth components | 1 day | "Forgot password?" sends email; user can reset | Low |
| Migrate existing localStorage users | Migration script | 2 days | Users with existing localStorage accounts can link to Firebase Auth | High |

**Success Criteria for Firebase Auth:** Any teacher can sign up on device A and log in on device B with the same account. Password reset works via email.

---

### Days 51–60: Firestore User Records + Stripe Checkout

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Set up Firestore `users` collection | Firestore console + rules | 1 day | User doc created on signup with plan: 'free' | Low |
| Replace Netlify Blobs sync with Firestore sync | Firebase Functions | 3 days | Cloud sync reads/writes from Firestore, not Netlify Blobs | Medium |
| Build pricing page component | `src/Pricing.jsx` | 2 days | Page at `/pricing` shows Free/Pro/School tiers | Low |
| Implement `createCheckoutSession` Firebase Function | `functions/src/` | 1 day | Function creates Stripe Checkout session (test mode) | Low |
| Implement `stripeWebhook` Firebase Function | `functions/src/` | 2 days | Webhook updates Firestore on subscription events | Medium |
| Add feature gates for Pro features | `src/` components | 2 days | Projector mode, cloud sync, unlimited routines gated behind `plan === 'pro'` | Medium |
| End-to-end Stripe test (test mode) | All | 1 day | Full checkout → webhook → Firestore update → feature unlock cycle works | Low |

**Phase 2 End State:**
- Teachers have real cloud accounts via Firebase Auth
- Firestore stores user records with subscription state
- Firebase Hosting serving the app
- Pricing page live
- Stripe checkout works in test mode
- Feature gates implemented for Free vs Pro

---

## Phase 3: Days 61–90 — Growth, Optimization, and Launch

**Theme:** Convert first paying users, expand content, optimize conversion, add SEO.

**Goal:** By Day 90, the product is live with Stripe in production mode, has paid users, and has a sustainable content and marketing motion.

---

### Days 61–70: Stripe Production + Content Expansion

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Flip Stripe from test to production mode | Env vars | 2 hrs | Real payments process; first teacher can pay | Low |
| Expand activity library to 50+ items | React source / data files | 3–5 days | POOL array has 50+ activities with full grade/energy metadata | Low |
| Add free trial (14 days Pro for new signups) | Firebase Functions + Firestore | 1 day | New users automatically get 14-day Pro trial via Stripe | Low |
| Fix projector cross-device limitation | Firebase Realtime Database + React | 3–5 days | Teacher can control projector from a different device using room code | High |
| Add empty states for My Activities, My Routines, Favorites | React components | 1 day | Empty views show illustration + CTA, not blank space | Low |

---

### Days 71–80: SEO, Analytics, and Conversion Optimization

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Add Plausible or PostHog analytics | `src/` | 4 hrs | Dashboard shows session count, feature usage, conversion funnel | Low |
| SEO optimization for landing page | `landing.html` | 2 days | Target keywords ranking improvement; sitemap submitted to Google Search Console | Low |
| Add testimonials to landing page | `landing.html` | 1 day | 3 teacher quotes with name/grade/school visible above CTA | Low |
| Add upgrade nudges at feature gate moments | React components | 1 day | User who hits Pro feature gate sees pricing modal with "Upgrade for $9/mo" | Low |
| Add "Manage Subscription" to Settings | React Settings component | 4 hrs | Link opens Stripe customer portal | Low |

---

### Days 81–90: Teacher Outreach and School Tier

| Task | Files | Effort | Success Criteria | Risk |
|---|---|---|---|---|
| Launch email list (ConvertKit or Resend) | External + landing page | 1 day | Email capture on landing page connected to welcome sequence | Low |
| Build teacher onboarding email sequence | Email platform | 2 days | New signups receive 5-email sequence over 14 days highlighting features | Low |
| Design School tier purchase flow | `src/Pricing.jsx` + Firebase Functions | 3–5 days | School can purchase 50-seat plan, teacher accounts can be added | High |
| Implement admin overview (basic) | React + Firestore | 3–5 days | School admin can see which teachers have accounts and plan status | Medium |
| Set up referral program (basic) | React + Firestore | 2 days | "Refer a teacher, get 1 month free" — tracked via Firestore referral codes | Low |

**Phase 3 End State:**
- Stripe live, first paying users
- 50+ activity library
- Full SEO surface area
- Analytics tracking conversion funnel
- Email list capturing teacher interest
- School tier available for purchase
- Projector mode works cross-device

---

## Milestone Summary

| Milestone | Target Date | Success Criteria |
|---|---|---|
| SPA fix + delete duplicate file | Day 1 | No 404s on direct URL access |
| Error tracking live | Day 3 | Sentry receiving events |
| Full On This Day fallback | Day 7 | Content shows on all 365 dates offline |
| Build pipeline running | Day 21 | `npm run build` → `dist/`, Netlify deploys from dist |
| Landing page MVP live | Day 28 | OfTheDay.net / shows product page, not login form |
| Firebase Hosting live | Day 40 | DNS points to Firebase CDN, preview channel tested |
| Firebase Auth live | Day 50 | Teachers can sign in from any device, reset passwords |
| Stripe checkout (test mode) | Day 58 | Full checkout → webhook → feature unlock cycle works |
| First paid user | Day 65 | Stripe in production mode, at least 1 paying subscriber |
| 50 activities + analytics | Day 70 | Product has sustainable content depth + visibility into usage |
| School tier available | Day 88 | First school can purchase multi-seat plan |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Source extraction from custom bundler fails | Medium | Critical | Allocate 5–7 days; have fallback plan (rewrite from scratch using browser devtools) |
| Firebase Auth migration loses existing localStorage users | Medium | High | Build migration script with export/import; communicate change to users in advance |
| Netlify Blobs → Firestore migration loses sync data | Low | Medium | One-time migration script with verification; keep Netlify Blobs as read fallback during transition |
| Stripe webhook fails in production | Low | High | Test extensively in test mode; add webhook retry handling; add monitoring |
| School year timing | High | Medium | US school year ends late May/June, begins August/September — target August launch for maximum teacher audience |
| Cross-device projector complexity exceeds estimate | Medium | Medium | Ship Firebase Realtime Database solution; room-code design is proven |
