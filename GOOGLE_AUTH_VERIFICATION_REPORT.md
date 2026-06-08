# GOOGLE_AUTH_VERIFICATION_REPORT.md
Date: 2026-06-08

Status: Code prepared and locally verified. Production Google Sign-In is not marked fixed until Firebase/Google Console settings are confirmed and the deployed app is tested.

## Files Changed

- `src/App.jsx`
- `src/lib/firebase.js`
- `src/landing.css`
- `GOOGLE_AUTH_FIX_PLAN.md`
- `GOOGLE_AUTH_VERIFICATION_REPORT.md`

The production build also regenerated `dist/`.

## What Changed

1. Restored a specific `auth/internal-error` message for Google Sign-In configuration failures.
2. Added `authDomain` to the Firebase config required-value guard.
3. Cleaned the stale Google redirect comment now that the app is using popup sign-in.
4. Adjusted the landing page nav logo treatment so the oversized PNG is cropped into a readable header mark instead of appearing tiny inside the full image canvas.

## Tests Run

### `npm run test`

Result: Passed.

This runs:

```bash
node -c functions/index.js
```

### `npm run build`

Result: Passed after rerunning with filesystem approval.

Initial sandboxed build failed because Vite could not clear `/dist/assets` on the Desktop path. The approved rerun completed successfully.

Built assets:

- `dist/index.html`
- `dist/assets/index-DXCsiN1G.css`
- `dist/assets/index-BGLJhEqP.js`

### Local Preview Smoke Test

Command:

```bash
npm run preview -- --host 127.0.0.1 --port 4188
```

Result: Passed after rerunning with localhost binding approval.

Verified:

- `http://127.0.0.1:4188/` returns HTTP 200
- `http://127.0.0.1:4188/login` serves the app shell
- built JS contains `auth/internal-error`
- built JS contains `Google sign-in is not fully configured`
- built CSS contains the updated `174px` by `52px` logo sizing

## Build Result

Passed.

Vite warning remains:

- JS chunk is larger than 500 kB after minification.

This is not related to Google Sign-In and is not a launch blocker for this fix.

## Local Auth Status

The login page loads locally from the built app.

Google OAuth completion was not verified locally because it still depends on Firebase/Google Console OAuth settings and an interactive browser sign-in.

## Deployed Auth Status

Not verified.

No deploy was performed.

Code has been prepared, but Google Sign-In is not verified in production until the Firebase/Google console settings are confirmed and the updated build is deployed and tested on `https://oftheday.net/login`.

## Console Settings Still Needed

Confirm in Firebase Console:

- Google provider enabled
- Google provider support email selected and saved
- `oftheday.net` authorized
- `www.oftheday.net` authorized if used
- `oftheday-c6490.firebaseapp.com` authorized
- `oftheday-c6490.web.app` authorized

Confirm in Google Cloud Console:

- OAuth consent screen app name set
- User support email set
- Developer contact email set
- App is in production, or signing-in account is added as a test user
- OAuth JavaScript origins include production and local origins
- OAuth redirect URI includes `https://oftheday-c6490.firebaseapp.com/__/auth/handler`

## Remaining Risks

1. Production may still fail if Firebase/Google Console configuration is incomplete.
2. Production currently must be redeployed before these code and logo changes are live.
3. The Git remote contains an embedded GitHub token and should be rotated/cleaned before launch.
4. The app still has a large single JS bundle; not part of this fix, but worth addressing later.

## Proof Required Before Marking Fixed

- Updated build deployed to Firebase Hosting.
- `https://oftheday.net/login` tested in a private/incognito browser.
- `Continue with Google` opens the Google account chooser.
- Google sign-in completes successfully.
- User lands on `/dashboard`.
- Firestore `users/{uid}` document is created or updated.
- Browser console shows no Firebase Auth errors.
