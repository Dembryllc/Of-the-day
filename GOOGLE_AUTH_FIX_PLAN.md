# GOOGLE_AUTH_FIX_PLAN.md
Date: 2026-06-08

Status: Diagnosis complete. No app code edited. No deployment performed.

---

## Repo State

- Repo path: `/Users/mikeradicone/Desktop/of the day`
- Git branch: `main`
- Tracking: `origin/main`
- Uncommitted changes: `GOOGLE_AUTH_FIX_PLAN.md` is untracked
- Recent auth-related commits include:
  - `8830224` Show actual Firebase error code in auth error messages
  - `0067884` Update CLAUDE.md: Firebase Console config warning, deploy process, current state
  - `12cd755` Add failure audit, root cause report, and verified fix plan
  - `db1765e` Revert Google auth to signInWithPopup
  - `5a41cab` Fix Google sign-in: switch from popup to redirect flow

Security note: the configured Git remote contains an embedded GitHub token. Do not paste it into tickets or docs. Rotate that token and replace the remote with a normal HTTPS remote plus credential manager before public launch.

## Current Branch

`main`

## Uncommitted Changes

Only this plan file is currently untracked.

## Framework

- Vite
- React 19
- React Router 7
- Firebase JS SDK 12
- Node/Firebase Functions for backend endpoints

## Hosting Setup

- Firebase Hosting is configured in `firebase.json`
- Firebase project: `oftheday-c6490`
- Hosting public folder: `dist`
- SPA fallback rewrite: all non-API routes serve `/index.html`
- API rewrite: `/api/on-this-day` routes to Cloud Function `onthisday`
- Netlify config/files still exist in the repo, but current app hosting is Firebase

## Firebase Files Found

- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `.env.example`
- `.env.local` exists locally, values not exposed
- `src/lib/firebase.js`
- `src/lib/firestore.js`
- `functions/index.js`
- `functions/package.json`

---

## Google Auth Code Map

### 1. Firebase app initialization

File: `src/lib/firebase.js`

Firebase initializes with Vite environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The local `.env.local` file has all required values present. Values were inspected for presence only; secrets were not printed.

### 2. Firebase Auth initialization

File: `src/lib/firebase.js`

`getAuth(app)` exports `auth`.

### 3. Google provider creation

File: `src/App.jsx`

`new GoogleAuthProvider()` is created inside `handleGoogleSignIn`.

### 4. Sign-in trigger

File: `src/App.jsx`

`handleGoogleSignIn` runs when the auth screen button labeled `Continue with Google` is clicked.

### 5. Popup or redirect

Current source uses:

```js
signInWithPopup(auth, new GoogleAuthProvider())
```

Current source does not use `signInWithRedirect` or `getRedirectResult`.

### 6. Error handling

File: `src/App.jsx`

`friendlyAuthError(code)` handles common Firebase errors:

- email/password errors
- popup blocked
- popup closed
- account exists with different credential
- operation not allowed
- unauthorized domain
- network error

Problem: current local source does not include a specific `auth/internal-error` case. The live bundle does contain an `auth/internal-error` case and displays: `Google sign-in is not fully configured.`

### 7. User record creation

Files:

- `src/App.jsx`
- `src/lib/firestore.js`
- `functions/index.js`

After Auth state changes, the app loads or creates `users/{uid}` in Firestore. The Cloud Function `onUserCreate` also creates a user document as a backup path.

### 8. Route after login

Files:

- `src/App.jsx`

Routes:

- `/login` redirects authenticated users to `/dashboard`
- `/dashboard` is protected and redirects unauthenticated users to `/login`
- `/upgrade` is protected

---

## Files Involved

| File | Role | Concern |
|---|---|---|
| `src/App.jsx` | Auth UI, Google sign-in trigger, user-facing auth errors | Missing local `auth/internal-error` case |
| `src/lib/firebase.js` | Firebase initialization | Required env vars present locally |
| `src/lib/firestore.js` | User document creation/update | Google users are created if missing |
| `functions/index.js` | Auth user creation function and API function | Backup user document creation |
| `.env.local` | Local Firebase config | Present; do not commit or expose |
| `.env.example` | Env template | Correct Vite env names |
| `firebase.json` | Firebase Hosting config | Correct Firebase Hosting shape |
| `.firebaserc` | Firebase project selection | Points at `oftheday-c6490` |
| `src/LandingPage.jsx` | Landing page logo markup | Uses `/assets/oftheday-logo.png` |
| `src/landing.css` | Landing page nav logo size | CSS height is large, but visible logo appears small because of asset/crop treatment |

---

## Active Login Flow

1. User opens `/login`
2. User clicks `Continue with Google`
3. App calls `signInWithPopup(auth, new GoogleAuthProvider())`
4. Firebase opens Google OAuth popup
5. On success, Firebase Auth state changes
6. `onAuthStateChanged` loads or creates the Firestore user doc
7. Authenticated route sends user to `/dashboard`

---

## Error Handling Problems

1. The local code currently lacks a specific `auth/internal-error` case.
2. Generic Firebase error output is useful for debugging but not polished for teachers.
3. The live site and local source appear out of sync.
4. There is no console-level proof yet that Google provider support email, OAuth consent screen, authorized domains, and OAuth client settings are all correct.

---

## Suspicious Code / Config

1. `src/App.jsx` contains a stale comment that says “returning from redirect,” but current code uses popup. This is harmless but confusing.
2. `src/lib/firebase.js` checks only `apiKey` and `projectId` before initializing. It should also validate `authDomain` for auth reliability.
3. The live site serves a different bundled asset name than local `dist`, which means production may be stale.
4. `netlify/` still exists even though the current hosting setup is Firebase. This is not necessarily breaking auth, but it can confuse deployment.
5. The Git remote includes an embedded token and should be cleaned up.

---

## Firebase Config Diagnosis

Confirmed from local config structure:

- `apiKey`: present locally, not exposed
- `authDomain`: present locally as Firebase Auth domain for project `oftheday-c6490`
- `projectId`: `oftheday-c6490`
- `storageBucket`: present locally
- `messagingSenderId`: present locally, not exposed
- `appId`: present locally
- `measurementId`: present in `.env.local`, not used by `src/lib/firebase.js`

The Vite variable prefix is correct: `VITE_FIREBASE_*`.

## Missing Values

No missing local `.env.local` values were found by presence check.

## Wrong Values

No wrong local values were proven from code inspection. Console settings still need verification.

## Environment Variable Issues

No local env naming issue found. The main risk is production using stale build output or old deployed environment values.

## Local vs Deployed Risk

High. The live site is serving asset `index-DKa3FRb8.js`, while local `dist` contains a different built asset. This suggests production and local source are not synchronized.

---

## Firebase Console Checklist

These settings cannot be fully verified from code. They must be checked in Firebase Console:

1. Open Firebase Console for project `oftheday-c6490`
2. Go to Authentication → Sign-in method
3. Confirm Email/Password is enabled
4. Confirm Google is enabled
5. Edit Google provider
6. Confirm Project support email is selected
7. Save the provider, even if it already appears enabled
8. Go to Authentication → Settings → Authorized domains
9. Confirm these domains:
   - `localhost`
   - `127.0.0.1` if local testing uses it
   - `oftheday.net`
   - `www.oftheday.net` if users may visit the www version
   - `oftheday-c6490.firebaseapp.com`
   - `oftheday-c6490.web.app`
   - any remaining Netlify/staging domain still used by testers

---

## Google Cloud Console Checklist

These settings cannot be fully verified from code. They must be checked in Google Cloud Console for project `oftheday-c6490`:

1. OAuth consent screen
2. App name is filled in
3. User support email is filled in
4. Developer contact email is filled in
5. Publishing status is either:
   - In production, or
   - Testing with the signing-in Google account added as a test user
6. OAuth client is the Firebase-created Web client
7. Authorized JavaScript origins include:
   - `https://oftheday.net`
   - `https://www.oftheday.net` if used
   - `https://oftheday-c6490.firebaseapp.com`
   - `https://oftheday-c6490.web.app`
   - `http://localhost:5173`
   - `http://localhost` if used
8. Authorized redirect URIs include:
   - `https://oftheday-c6490.firebaseapp.com/__/auth/handler`

---

## Required Domains

Minimum required for production:

- `oftheday.net`
- `oftheday-c6490.firebaseapp.com`
- `oftheday-c6490.web.app`

Recommended:

- `www.oftheday.net`
- `localhost`
- `127.0.0.1`
- Any Firebase preview channel domain used for testing

---

## Required Redirect URIs

Firebase popup auth uses the Firebase auth handler:

- `https://oftheday-c6490.firebaseapp.com/__/auth/handler`

If a custom auth domain is later configured, redirect URI requirements may change. Do not change this until the current Google flow is verified.

---

## Likely Error

Most likely observed code: `auth/internal-error`

## Evidence

1. The live production bundle contains the teacher-facing message: `Google sign-in is not fully configured.`
2. The live bundle includes `auth/internal-error`.
3. The live bundle includes Firebase project `oftheday-c6490`.
4. Local `.env.local` has required Firebase values present.
5. The error wording points to an OAuth/provider configuration problem rather than a missing frontend config problem.

## Most Likely Root Cause

Google Sign-In provider and/or Google Cloud OAuth consent is not fully configured for the Firebase project.

Most likely console-side causes:

1. Google provider enabled but support email not saved in Firebase Auth provider settings.
2. OAuth consent screen missing required support/developer email fields.
3. OAuth consent screen is in Testing mode and the signing-in account is not a test user.
4. Domain mismatch: `oftheday.net` or `www.oftheday.net` missing from Firebase Authorized Domains or OAuth JavaScript origins.

## Confirmation Steps

1. Open browser DevTools on `https://oftheday.net/login`
2. Click `Continue with Google`
3. Record the exact Firebase error code from the console or app message
4. Check Firebase Auth provider support email and authorized domains
5. Check Google Cloud OAuth consent screen and OAuth client domains
6. Try again in an incognito/private window

---

## Error Diagnosis Matrix

| Error | Meaning | Likely Cause | How To Confirm | Fix |
|---|---|---|---|---|
| `auth/internal-error` | Firebase OAuth configuration is incomplete or invalid | Provider support email/OAuth consent/test user problem | DevTools error code | Complete Firebase Google provider and Google Cloud OAuth consent |
| `auth/operation-not-allowed` | Provider not enabled | Google provider disabled in Firebase Auth | DevTools error code | Enable Google provider |
| `auth/unauthorized-domain` | Current host is not allowed | `oftheday.net` or `www.oftheday.net` missing | DevTools error code | Add domain in Firebase Auth authorized domains |
| `auth/invalid-api-key` | Bad or missing API key | Wrong build env | DevTools error code/network | Fix Vite env and rebuild |
| `auth/app-not-authorized` | App/domain mismatch | Wrong Firebase web app or domain | DevTools error code | Verify Firebase project and OAuth client |
| `auth/popup-blocked` | Browser blocked popup | Popup blocked in browser | UI error | Allow popups or use redirect flow if necessary |
| `auth/popup-closed-by-user` | User closed popup | User cancellation | Reproduce by closing popup | No user-facing error needed |
| `auth/network-request-failed` | Network blocked/failed | Network/CSP/adblock | Console/network tab | Confirm network and CSP |
| `redirect_uri_mismatch` | OAuth redirect URI missing | OAuth client missing Firebase handler URI | Google popup error | Add Firebase auth handler URI |

---

## Hosting Diagnosis

- Firebase Hosting is the configured production host.
- `firebase.json` serves `dist`.
- The app uses SPA fallback correctly.
- Live domain `https://oftheday.net/login` serves the app.
- Live bundle appears stale compared with local `dist`.

## Domain Mismatch Risks

1. `oftheday.net` may be authorized while `www.oftheday.net` is not, or vice versa.
2. Local testing may use `127.0.0.1`, which Firebase does not always include by default.
3. Firebase auth popup still depends on the Firebase auth handler domain.
4. Old Netlify/staging domains may still be used by testers and fail if not authorized.

## Deployment Config Risks

1. Production can lag local source because deployment is manual.
2. Firebase Hosting immutable asset cache means stale asset names can persist until a new deploy updates `index.html`.
3. Existing Netlify files can confuse the deployment mental model even if they are not active.

---

## Landing Page Logo Diagnosis

Issue reported: icon/logo on the landing page is too small.

Evidence:

- `src/LandingPage.jsx` uses `/assets/oftheday-logo.png`.
- `src/landing.css` sets `.nav-logo-img` to `height: 200px`.
- The actual asset is `1200 x 800`, which likely includes a lot of visual padding/background, so increasing CSS height does not necessarily make the visible wordmark feel larger.
- There is also `public/assets/ofthedaylogi.png` at `1536 x 1024`, which may be an alternate source asset.

Recommended fix after approval:

1. Create/use a cropped, transparent logo asset specifically for nav/auth/sidebar.
2. Set nav logo by visible width/height rather than forcing a huge full-image height.
3. Keep one readable brand treatment on the landing page.
4. Verify desktop and mobile header after the asset/CSS change.

This is separate from Google Auth and should not be used as evidence that auth is broken.

---

## Code Changes Needed

Smallest likely code changes after approval:

1. Add `auth/internal-error` handling back to `friendlyAuthError()`.
2. Optionally validate `authDomain` in `src/lib/firebase.js` before Firebase initializes.
3. Clean stale redirect wording comment in `src/App.jsx`.
4. Improve landing page logo asset/CSS so the visible logo is readable.

No auth rewrite is recommended right now.

---

## Environment Changes Needed

No local `.env.local` value changes are currently proven necessary.

Production deployment must be rebuilt after any code/logo change so Firebase Hosting serves the latest bundle.

Do not commit `.env.local`.

---

## Hosting / Domain Changes Needed

No `firebase.json` changes are proven necessary.

Manual console/domain checks are required before Google Sign-In can be marked fixed.

---

## Test Plan

### Before code edits

1. Confirm Firebase Auth Google provider support email is set and saved.
2. Confirm OAuth consent screen is complete.
3. Confirm authorized domains and OAuth origins/redirect URI.
4. Test `https://oftheday.net/login` in incognito.
5. Capture exact Firebase error code if it still fails.

### After approved code edits

1. Run `npm run test`
2. Run `npm run build`
3. Run local preview or dev server
4. Open `/login`
5. Confirm email/password form still renders
6. Confirm Google button still renders
7. Confirm landing page logo is readable on desktop
8. Confirm landing page logo is readable on mobile
9. Confirm no runtime console errors

### Production verification after approved deploy

1. Deploy hosting only after explicit approval.
2. Open `https://oftheday.net/login` in incognito.
3. Click `Continue with Google`.
4. Confirm Google account chooser opens.
5. Complete sign-in.
6. Confirm user lands on `/dashboard`.
7. Confirm Firestore user doc exists or updates.
8. Confirm browser console has no auth errors.

---

## Rollback Plan

- Code rollback: revert the specific commit and redeploy hosting.
- Console rollback: disable Google provider only if needed, but this is not recommended once fixed.
- Logo rollback: restore previous logo CSS/asset reference.
- No database migration is involved in the proposed code changes.

---

## Definition Of Done

Google Sign-In is not fixed until all are true:

- [ ] Firebase Console: Google provider enabled
- [ ] Firebase Console: Google provider support email selected and saved
- [ ] Firebase Console: `oftheday.net` authorized
- [ ] Firebase Console: `www.oftheday.net` authorized if used
- [ ] Google Cloud Console: OAuth consent screen complete
- [ ] Google Cloud Console: app is production or test user is added
- [ ] Google Cloud Console: required JavaScript origins present
- [ ] Google Cloud Console: Firebase auth handler redirect URI present
- [ ] Correct Firebase project `oftheday-c6490` confirmed
- [ ] Correct Vite env values confirmed locally and in deployed build
- [ ] Local app builds successfully
- [ ] Local login screen smoke test passes
- [ ] Deployed sign-in opens the Google popup
- [ ] Deployed sign-in completes successfully
- [ ] User document is created or updated correctly
- [ ] Login redirects to `/dashboard`
- [ ] Browser console errors checked
- [ ] Network errors checked
- [ ] Landing page logo is visually readable on desktop and mobile

---

## Approval Needed

No code has been edited.

Recommended next step:

1. You confirm the Firebase Console and Google Cloud Console checklist.
2. After that, approve code edits for:
   - `auth/internal-error` friendly error restoration
   - Firebase config validation hardening
   - landing page logo readability fix

Do not deploy until the code change is reviewed and explicitly approved.
