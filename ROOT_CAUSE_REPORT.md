# Root Cause Report
Date: 2026-06-05

---

## Cause 1: Sign-in methods not enabled in Firebase Console
- **Classification**: Firebase Console configuration (not a code bug)
- **Confidence**: 90%
- **Risk**: CRITICAL — app is completely unusable without this
- **Evidence**: Screenshot shows "Something went wrong. Try again." which is the exact
  string returned by `friendlyAuthError()`'s default case. The only errors that trigger
  the default case are unhandled codes. `auth/operation-not-allowed` — thrown when a
  sign-in provider is disabled in Firebase Console — is not in the switch statement.
- **Files involved**: Firebase Console only (no code file)
- **System**: Firebase Authentication → Sign-in method settings
- **Fix location**: Firebase Console → Authentication → Sign-in method
  → Enable "Email/Password" AND "Google"

---

## Cause 2: oftheday.net not in Firebase Authorized Domains
- **Classification**: Firebase Console configuration
- **Confidence**: 75%
- **Risk**: HIGH — required for Google OAuth popup to complete
- **Evidence**: Google sign-in popup flow requires the calling domain to be whitelisted.
  Firebase auto-adds localhost and the Firebase default domain, but NOT custom domains.
  If oftheday.net is not listed, Google popup returns an error (likely `auth/unauthorized-domain`
  which also hits the default case → "Something went wrong. Try again.")
- **Files involved**: Firebase Console only
- **System**: Firebase Console → Authentication → Settings → Authorized domains
- **Fix location**: Add `oftheday.net` and `www.oftheday.net`

---

## Cause 3: Firebase Hosting deploy never ran (or ran an old build)
- **Classification**: Missing deployment step
- **Confidence**: 60%
- **Risk**: MEDIUM — code fixes exist in GitHub but may not be live
- **Evidence**: The deploy command (`firebase deploy`) must be run manually on the user's
  Mac. This server only pushes to GitHub. Previous responses said "pushed" but that only
  means GitHub was updated — NOT that Firebase Hosting was redeployed.
- **Files involved**: dist/ (build output), firebase.json
- **System**: Firebase Hosting
- **Fix**: User must run on their Mac:
  `cd "/Users/mikeradicone/Desktop/of the day" && git pull origin main && npm run build && firebase deploy --only hosting`

---

## Cause 4 (Secondary): auth/operation-not-allowed not in error handler
- **Classification**: Code gap — error message not user-friendly
- **Confidence**: 100% (confirmed in source)
- **Risk**: LOW on its own, but causes the misleading "Something went wrong" message
  that makes diagnosis harder
- **Evidence**: `grep "operation-not-allowed" src/App.jsx` → no results
- **Files involved**: src/App.jsx:754-768 (friendlyAuthError function)
- **Fix**: Add `case 'auth/operation-not-allowed'` with a clear message

---

## Why Previous Code Fixes Did Not Solve The Problem

Every fix in this session changed JavaScript code and pushed to GitHub. None of them
could fix the root cause because:

1. Firebase sign-in methods being disabled is a Firebase Console toggle — it cannot
   be changed by code
2. Authorized domains is a Firebase Console setting — it cannot be changed by code
3. The deploy to Firebase Hosting requires a manual step on the user's Mac — GitHub
   push alone does not update the live site

The code was correct. The infrastructure was not configured.
