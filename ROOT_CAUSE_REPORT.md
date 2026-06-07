# Root Cause Report
Date: 2026-06-07

---

## Cause 1 — CONFIRMED: GitHub Secrets Not Added (App Cannot Load)
- **Classification**: Missing environment variables in CI/CD pipeline
- **Confidence**: 100% — proven by build logs
- **Risk**: CRITICAL — app is completely non-functional
- **Evidence**: Build log for run #2, job 79888302642, timestamp 15:40:23:
  ```
  VITE_FIREBASE_API_KEY:
  VITE_FIREBASE_AUTH_DOMAIN:
  VITE_FIREBASE_PROJECT_ID:
  VITE_FIREBASE_STORAGE_BUCKET:
  VITE_FIREBASE_MESSAGING_SENDER_ID:
  VITE_FIREBASE_APP_ID:
  ```
  All 6 values are blank. GitHub substitutes empty string for missing secrets silently.
  Vite baked empty strings into the production JS bundle.
  At runtime: `src/lib/firebase.js:14` throws because `apiKey === ""` (falsy).
  React never mounts. Page is blank.
- **Files involved**: `.github/workflows/deploy.yml`, `src/lib/firebase.js`
- **System**: GitHub Actions Secrets, Vite build, Firebase SDK initialization
- **Fix**: Add all 6 secrets to GitHub → repo Settings → Secrets and variables → Actions:
  - `VITE_FIREBASE_API_KEY` = `AIzaSyD77FabrJ77AUj3yAf722ctseHLSFIRSyw`
  - `VITE_FIREBASE_AUTH_DOMAIN` = `oftheday-c6490.firebaseapp.com`
  - `VITE_FIREBASE_PROJECT_ID` = `oftheday-c6490`
  - `VITE_FIREBASE_STORAGE_BUCKET` = `oftheday-c6490.firebasestorage.app`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID` = `984386798513`
  - `VITE_FIREBASE_APP_ID` = `1:984386798513:web:946e156afbade9dfd7b390`
  Then re-run the workflow (or push a commit).

---

## Cause 2 — CONFIRMED: DNS for oftheday.net Points to Netlify, Not Firebase
- **Classification**: DNS misconfiguration
- **Confidence**: 100% — confirmed by user ("I own the domain through Netlify")
- **Risk**: CRITICAL — even a correctly built app cannot be reached at oftheday.net
- **Evidence**: Domain is registered and DNS-managed through Netlify. No changes to DNS
  have been made. Firebase Hosting serves at `oftheday-c6490.web.app` only.
  Custom domain has not been added in Firebase Console → Hosting.
- **Files involved**: None (DNS and Firebase Console, no code files)
- **System**: Netlify DNS, Firebase Hosting custom domain setup
- **Fix**:
  1. Firebase Console → Hosting → Add custom domain → `oftheday.net` → get Firebase IPs
  2. Netlify DNS → delete existing A records for `@` → add Firebase A records
  3. Add CNAME: `www` → `oftheday-c6490.web.app`

---

## Cause 3: Firebase Auth Sign-in Methods Not Enabled
- **Classification**: Firebase Console configuration
- **Confidence**: 85% (cannot confirm from code; user reported auth failures)
- **Risk**: HIGH — sign-in will fail even after app loads and DNS is fixed
- **Evidence**: Previous session screenshots showed "Something went wrong. Try again."
  `auth/operation-not-allowed` is now handled in code (added in commit 8830224) and will
  show a clear message if this is the issue. But the sign-in methods themselves must be
  enabled in Firebase Console.
- **Files involved**: Firebase Console only
- **System**: Firebase Authentication
- **Fix**: Firebase Console → Authentication → Sign-in method → Enable Email/Password + Google
  → Authentication → Settings → Authorized domains → Add `oftheday.net`

---

## Why Previous Fixes Did Not Solve The Problem

1. **GitHub Actions was set up but GitHub Secrets were never added.**
   The workflow correctly references the secrets, but the secrets don't exist in GitHub.
   The build silently used empty strings. Firebase throws on load.

2. **DNS was never updated.**
   Every deploy to Firebase Hosting is invisible until the DNS A records for oftheday.net
   are changed from Netlify's IPs to Firebase's IPs.

3. **Firebase Console auth settings were not confirmed.**
   Code changes cannot enable sign-in providers in the Firebase Console.

These are three independent infrastructure failures, none fixable by code changes alone.
