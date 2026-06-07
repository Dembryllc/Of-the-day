# Master Backlog — OfTheDay.net
Date: 2026-06-07

Note: Datability Web and Easy-Annotate codebases are not accessible from this environment.
This backlog covers OfTheDay.net only.

---

## P0 — Critical (Blocks All Users)

| # | Issue | Files | Difficulty | Risk | Business Impact | Est. Time | Owner |
|---|-------|-------|-----------|------|-----------------|-----------|-------|
| P0-1 | Add 6 GitHub Secrets (VITE_FIREBASE_*) | GitHub Settings (no code) | Easy | Low | Site goes live | 2 min | User |
| P0-2 | Re-run GitHub Actions after secrets added | GitHub Actions tab | Easy | Low | Deploys working bundle | 1 min | User |
| P0-3 | Add oftheday.net custom domain in Firebase Console | Firebase Console | Easy | Low | Domain routes to Firebase | 5 min | User |
| P0-4 | Update Netlify DNS A records to Firebase IPs | Netlify DNS panel | Medium | Medium | Domain works | 10 min + propagation | User |
| P0-5 | Enable Email/Password in Firebase Auth | Firebase Console | Easy | None | Sign-in works | 2 min | User |
| P0-6 | Enable Google sign-in in Firebase Auth | Firebase Console | Easy | None | Google sign-in works | 2 min | User |
| P0-7 | Add oftheday.net to Firebase Authorized Domains | Firebase Console | Easy | None | Google popup works | 1 min | User |

---

## P1 — High (Blocks Revenue)

| # | Issue | Files | Difficulty | Risk | Business Impact | Est. Time | Owner |
|---|-------|-------|-----------|------|-----------------|-----------|-------|
| P1-1 | Create live Stripe price IDs (monthly + annual) | Stripe Dashboard | Easy | Low | Real payments possible | 15 min | User |
| P1-2 | Get Stripe live secret key + set in functions/.env | Stripe Dashboard + functions | Easy | Medium | Real payments possible | 10 min | User |
| P1-3 | Register Stripe webhook URL with live Stripe account | Stripe Dashboard | Easy | Low | Subscription updates work | 5 min | User |
| P1-4 | Add STRIPE_WEBHOOK_SECRET to functions/.env | functions/.env | Easy | Low | Webhook validates correctly | 5 min | User |
| P1-5 | Update price IDs in functions/index.js to live IDs | functions/index.js | Easy | Low | Checkout charges real cards | 5 min | Code |
| P1-6 | Deploy functions after Stripe keys are set | Terminal / CI | Easy | Medium | Functions go live with real Stripe | 10 min | User |
| P1-7 | Add functions deploy step to GitHub Actions CI/CD | .github/workflows/deploy.yml | Medium | Medium | Functions auto-deploy on push | 1 hr | Code |

---

## P2 — Medium (Important for Growth)

| # | Issue | Files | Difficulty | Risk | Business Impact | Est. Time | Owner |
|---|-------|-------|-----------|------|-----------------|-----------|-------|
| P2-1 | Add Sentry error tracking | main.jsx, package.json | Easy | Low | Runtime errors visible | 30 min | Code |
| P2-2 | Add basic analytics (Posthog/Mixpanel) | App.jsx key events | Medium | Low | Usage data for decisions | 2 hr | Code |
| P2-3 | Onboarding/first-run flow (guided tour) | App.jsx | Medium | Low | Reduces new-user churn | 3 hr | Code |
| P2-4 | Subscription management UI (cancel, view renewal) | App.jsx | Medium | Medium | Reduces support burden | 2 hr | Code |
| P2-5 | Trial ending email notification | Firebase Functions | Medium | Low | Conversion from trial → paid | 2 hr | Code |
| P2-6 | Extract components from App.jsx monolith | src/components/ | High | Medium | Maintainability | 4 hr | Code |
| P2-7 | Rate limiting on Cloud Functions | functions/index.js | Medium | Low | Prevent abuse | 2 hr | Code |
| P2-8 | Add www.oftheday.net redirect to bare domain | Firebase Console + Netlify DNS | Easy | Low | SEO + user experience | 15 min | User |

---

## P3 — Low (Nice to Have)

| # | Issue | Files | Difficulty | Risk | Business Impact | Est. Time | Owner |
|---|-------|-------|-----------|------|-----------------|-----------|-------|
| P3-1 | Real-time cloud sync (Firestore listeners) | src/lib/firestore.js, App.jsx | High | Medium | Better multi-device UX | 4 hr | Code |
| P3-2 | School tier backend implementation | functions/index.js, App.jsx | Very High | High | Opens $199/yr revenue | 1 week | Code |
| P3-3 | Remove unused vite.config.mjs + foundation.html | repo root | Easy | Low | Cleanliness | 5 min | Code |
| P3-4 | Remove planning docs from repo root | repo root | Easy | Low | Cleanliness | 5 min | Code |
| P3-5 | Real test suite (replace node -c with Jest/Vitest) | package.json, tests/ | High | Low | Confidence in changes | 4 hr | Code |
| P3-6 | Automated Firestore backups | Firebase Console | Easy | Low | Data protection | 15 min | User |
| P3-7 | Activity randomization improvements | App.jsx | Medium | Low | User delight | 2 hr | Code |
| P3-8 | WCAG 2.1 AA accessibility audit | src/App.jsx, styles.css | High | Low | District compliance | 4 hr | Code |
| P3-9 | Mobile-optimized layouts | src/styles.css | High | Low | Broader reach | 1 week | Code |

---

## Path to First Dollar (in order)

1. P0-1 → P0-2 → P0-3 → P0-4 (site loads at oftheday.net)
2. P0-5 → P0-6 → P0-7 (sign-in works)
3. P1-1 → P1-2 → P1-3 → P1-4 → P1-5 → P1-6 (Stripe live)
4. First user signs up, hits trial, upgrades → **First dollar**

Total time to first dollar: ~2 hours of user actions + 30 min of code changes.
The code is already written. Only configuration remains.
