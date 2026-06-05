# Fix Failure Audit
Date: 2026-06-05

## 1. Were the fixes actually made?
YES. All code changes exist in src/App.jsx, src/styles.css, functions/index.js.
Evidence: `git log` shows 45 commits on the dev branch, merged to main.

## 2. Were they committed?
YES. `git status` shows clean working tree. All changes are committed.
Evidence: `git status` → "nothing to commit, working tree clean"

## 3. Were they pushed?
YES. `origin/main` is up to date with local main.
Evidence: `git log origin/main..HEAD` → empty (no unpushed commits)

## 4. Were they deployed to Firebase Hosting?
UNKNOWN — CANNOT CONFIRM.
The deploy command runs on the user's Mac (`firebase deploy`), NOT in this environment.
The `dist/` folder on this server was built at 16:26 today and contains the latest code,
but whether the user ran `firebase deploy` from their machine is unverifiable from here.
Every previous session response that said "pushed" only confirmed GitHub push — not Firebase deploy.

## 5. Is the deployed app running the latest code?
CANNOT CONFIRM. See #4.
The live site at oftheday.net DOES show the new React UI, so a build was deployed at some point.
Which build (old or new) is unknown without checking live bundle hash or deploy timestamp.

## 6. Is the app pointing to the correct backend?
The built dist bundle contains: project ID `oftheday-c6490`, authDomain `oftheday-c6490.firebaseapp.com`
Evidence: `grep -o "oftheday-c6490[^\"']*" dist/assets/*.js` confirms correct config is baked in.

## 7. Did the fix target the actual root cause?
NO — and this is the core failure.

The screenshot shows "Something went wrong. Try again." This is the DEFAULT case
in `friendlyAuthError()`, triggered by any unhandled Firebase error code.

The unhandled code almost certainly firing here is:
  `auth/operation-not-allowed`

This error is thrown by Firebase when a sign-in method (Google, Email/Password) is
NOT ENABLED in Firebase Console → Authentication → Sign-in method.

This is a Firebase Console configuration issue, not a code issue.
All previous code changes (popup vs redirect, error messages, etc.) cannot fix this
because the fix must happen in the Firebase Console dashboard, not in the codebase.

## 8. What evidence proves this?
- `auth/operation-not-allowed` is NOT in the `friendlyAuthError` switch statement (confirmed in src/App.jsx:754-768)
- "Something went wrong. Try again." is the exact text returned by the default case
- The error appears on the email/password form, meaning email/password auth may also be disabled
- The Firebase Console Sign-in method settings cannot be confirmed from this environment
