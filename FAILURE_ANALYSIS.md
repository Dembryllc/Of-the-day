# Failure Analysis — OfTheDay.net
Date: 2026-06-07

---

## Failure 1: Site Does Not Load (Blank Screen)

**Classification**: Environment mismatch / missing environment variable

**What is failing?**
Every visitor to `oftheday-c6490.web.app` sees a blank white screen. React never mounts.

**Root Cause**
GitHub Actions built the production bundle with all 6 `VITE_FIREBASE_*` secrets set to empty
string because those secrets were never added to GitHub repository settings.
Vite baked empty strings into the JS bundle. At runtime, `src/lib/firebase.js:14` throws:
```js
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) { throw new Error(...) }
```
Empty string is falsy. Throw fires. App crashes before React renders anything.

**Evidence**
Build log (job 79888302642, timestamp 15:40:23.002x):
```
VITE_FIREBASE_API_KEY:
VITE_FIREBASE_AUTH_DOMAIN:
VITE_FIREBASE_PROJECT_ID:
[... all 6 empty]
```

**Business Impact**: CRITICAL — 100% of users see a broken site. Zero value delivered.

**User Impact**: Total — no one can use the app at all.

**Difficulty To Fix**: Easy — 2 minutes in GitHub Settings → add 6 secrets → re-run workflow.

---

## Failure 2: Custom Domain Not Resolving to Firebase

**Classification**: Hosting issue / DNS misconfiguration

**What is failing?**
`oftheday.net` does not reach Firebase Hosting. The domain resolves to Netlify's servers.

**Root Cause**
Domain was registered through Netlify. DNS A records for `@` (root) still point to Netlify's
IP addresses. Firebase Hosting has never been configured as a custom domain provider.
Firebase Console → Hosting → Custom domains has not been set up.

**Evidence**
- User confirmed: "I own the domain through Netlify"
- Firebase Hosting only serves at `oftheday-c6490.web.app`
- No Firebase custom domain found in project configuration
- Deploy logs confirm hosting target: `projects/984386798513/sites/oftheday-c6490`

**Business Impact**: CRITICAL — Users typing `oftheday.net` are either getting Netlify 404 or
reaching a stale/missing Netlify deployment. Brand trust degraded.

**User Impact**: Total for anyone using the branded URL.

**Difficulty To Fix**: Medium — 10 minutes in Firebase Console + Netlify DNS panel. DNS propagation
takes 5–30 minutes after changes.

---

## Failure 3: Firebase Auth Sign-in Methods Not Enabled

**Classification**: Firebase issue / authentication issue

**What is failing?**
Attempting to sign in returns an error (confirmed from previous session screenshots).
Specifically: email/password and/or Google sign-in providers not enabled in Firebase Console.

**Root Cause**
Firebase Auth requires explicit enablement of each sign-in method in Firebase Console →
Authentication → Sign-in method. This is not a code setting — it is a dashboard toggle.
The project was set up but the providers were never turned on.

**Evidence**
- Previous session screenshot showed "Something went wrong. Try again."
- `auth/operation-not-allowed` error is thrown when a provider is disabled
- Code now handles this case explicitly (commit 8830224) to show a clear message
- Firebase Console configuration cannot be confirmed from this environment

**Business Impact**: CRITICAL — even if the site loads, no user can create an account or sign in.

**User Impact**: Total — zero accounts possible.

**Difficulty To Fix**: Easy — 2 minutes in Firebase Console.

---

## Failure 4: Stripe Is in Test Mode — No Real Revenue Possible

**Classification**: Incomplete implementation / environment mismatch

**What is failing?**
Stripe checkout uses test-mode price IDs and test-mode API keys. Real credit cards are
rejected by test mode. No revenue can be collected even if checkout appears to work.

**Root Cause**
The Stripe integration was built and tested in test mode. The transition to production requires:
1. Creating live price IDs in Stripe Dashboard
2. Getting live secret key + publishable key
3. Setting them in `functions/.env`
4. Registering the webhook URL with the live Stripe account
5. Getting `STRIPE_WEBHOOK_SECRET` from the live webhook registration
6. Deploying functions

None of these steps have been completed.

**Evidence**
- Price IDs in functions/index.js: `price_1Te35JB2eRKsbhTp...` (test mode format: `price_1...`)
- functions/.env contains placeholder values (gitignored; content confirmed by user session context)
- No live Stripe webhook endpoint registered

**Business Impact**: HIGH — App cannot generate revenue even after all other fixes.

**User Impact**: Medium — checkout appears to work but payments fail with test cards.

**Difficulty To Fix**: Medium — 30 minutes in Stripe Dashboard + function redeploy.

---

## Failure 5: Cloud Functions Cannot Be Deployed via CI/CD

**Classification**: Deployment issue / incomplete implementation

**What is failing?**
Changes to `functions/index.js` cannot be deployed automatically. Every function update
requires the developer to run `firebase deploy --only functions` from their local Mac
with a valid service account.

**Root Cause**
The GitHub Actions workflow only deploys `hosting`. There is no workflow step for functions.
Functions require Firebase CLI credentials (`GOOGLE_APPLICATION_CREDENTIALS`) which are
different from the hosting service account in `secrets.oftheday`.

**Evidence**
- `.github/workflows/deploy.yml` only calls `action-hosting-deploy@v0`
- No `firebase deploy --only functions` step exists in any workflow
- CLAUDE.md documents: "Functions must be deployed manually"

**Business Impact**: MEDIUM — Function bugs and improvements are stuck until developer deploys
from Mac. Stripe webhook updates, onthisday improvements, new callable functions all blocked.

**User Impact**: Low (functions work once deployed; only breaks on updates).

**Difficulty To Fix**: Medium — Add a functions deploy step to the workflow, or use a separate
workflow. Requires the Firebase service account secret to have Functions permissions.

---

## Failure 6: No Observability (Errors Are Invisible)

**Classification**: Architecture issue / incomplete implementation

**What is failing?**
Runtime errors in the browser are not tracked. Cloud Function errors only visible in Firebase
Console logs. No alerts, no error rates, no user impact visibility.

**Root Cause**
No error tracking (Sentry, Datadog) or analytics (Mixpanel, Posthog) has been added.
The `main.jsx` ErrorBoundary catches React errors but only shows a generic message.

**Evidence**
- No Sentry, Datadog, or analytics SDK in package.json dependencies
- `main.jsx` ErrorBoundary has no reporting callback — errors are swallowed silently
- No analytics events in App.jsx

**Business Impact**: MEDIUM — Feature decisions made blind. Problems discovered by user complaints
rather than monitoring. Auth failures, payment failures, function errors all invisible.

**User Impact**: Low (users see error UI but not degraded silently).

**Difficulty To Fix**: Easy — add Sentry (2 lines of code) and basic analytics events.

---

## Failure 7: App.jsx Is a 3,880-Line Monolith

**Classification**: Architecture issue / technical debt

**What is failing?**
Not actively failing today, but creates high maintenance risk. Every change to any feature
requires navigating 3,880 lines. Risk of accidental regression is high. No component isolation.

**Root Cause**
App evolved from a simpler structure. Components were added incrementally to one file rather
than extracted.

**Evidence**
- `src/App.jsx` is 3,880 lines
- Contains: AuthScreen, MainApp, DisplayMode, ProfileSheet, UpgradePage, all modals, all views
- No component files in `src/components/`

**Business Impact**: LOW today — HIGH in 3 months when codebase grows.

**User Impact**: None directly.

**Difficulty To Fix**: Medium — requires careful extraction with no behavior change.

---

## Failure Priority Matrix

| # | Failure | Type | Business Impact | Difficulty | Fix Owner |
|---|---------|------|-----------------|------------|-----------|
| 1 | Blank screen (missing GitHub Secrets) | Environment | CRITICAL | Easy | User (2 min) |
| 2 | Custom domain not resolving | Hosting/DNS | CRITICAL | Medium | User (15 min) |
| 3 | Auth sign-in not enabled | Firebase | CRITICAL | Easy | User (2 min) |
| 4 | Stripe test mode only | Incomplete | HIGH | Medium | User (30 min) |
| 5 | Functions not in CI/CD | Deployment | MEDIUM | Medium | Code (1 hr) |
| 6 | No observability | Architecture | MEDIUM | Easy | Code (30 min) |
| 7 | App.jsx monolith | Architecture | LOW now | Medium | Code (2+ hrs) |
