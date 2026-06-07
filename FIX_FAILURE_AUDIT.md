# Fix Failure Audit
Date: 2026-06-07

---

## 1. Were the fixes actually made?
**YES.** Code changes (auth error messages, logo fix, email verification banner, workflow secret
name correction) are confirmed in git log:
- `f5172c5` Fix workflow: use correct secret name for Firebase service account
- `1bbdfb7` Fix landing page nav logo
- `8830224` Show actual Firebase error code in auth error messages
- `0067884` Update CLAUDE.md

## 2. Were they committed?
**YES.** `git status` → "nothing to commit, working tree clean"

## 3. Were they pushed?
**YES.** `git remote -v` and `git branch -a` confirm local main is in sync with `origin/main`.

## 4. Were they deployed?
**YES — BUT THE DEPLOYED BUILD IS BROKEN.**
GitHub Actions run #2 (ID: 27066538027) completed with `conclusion: "success"`.
Firebase Hosting received version `913ad0ea3a726a13`.
HOWEVER: the build ran with all 6 VITE_FIREBASE_* env vars set to empty string.

Evidence from build log (job 79888302642, timestamp 15:40:23):
```
VITE_FIREBASE_API_KEY:
VITE_FIREBASE_AUTH_DOMAIN:
VITE_FIREBASE_PROJECT_ID:
VITE_FIREBASE_STORAGE_BUCKET:
VITE_FIREBASE_MESSAGING_SENDER_ID:
VITE_FIREBASE_APP_ID:
```
All values: empty. Vite baked empty strings into the production bundle.

## 5. Is the deployed app running the latest code?
**THE LATEST CODE IS DEPLOYED BUT THE APP DOES NOT LOAD.**
When a browser loads the bundle, `src/lib/firebase.js` runs:
```js
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Firebase is not configured...')
}
```
`apiKey` and `projectId` are `""` (empty string, falsy). The throw fires.
The entire app crashes before React mounts → blank white screen.

## 6. Is the app pointing to the correct backend?
**IRRELEVANT — Firebase SDK never initializes.**
The throw in firebase.js prevents `initializeApp()` from ever being called.
No auth, no Firestore, no functions can be reached.

## 7. Did the fix target the actual root cause?
**NO.**
The workflow secret name fix (`${{ secrets.oftheday }}`) was correct for deploying.
But the 6 VITE_FIREBASE_* secrets (`VITE_FIREBASE_API_KEY`, etc.) were never added to GitHub.
GitHub silently substitutes empty string for missing secrets — no build error, no warning in the
workflow UI. The deploy "succeeds" but ships a broken bundle.

## 8. What evidence proves this?
- Build log lines show all 6 env vars as blank (lines 15:40:23.0026xxx)
- Build completed in 306ms — too fast for a real build; firebase.js crash happens at runtime not build time
- `src/lib/firebase.js:14` — confirmed throw when apiKey is falsy
- `.env.local` has the real values BUT `.env.local` is gitignored and not available in GitHub Actions

---

## Secondary Failure: DNS Not Pointing to Firebase

Even if the Firebase secrets were fixed and the app loaded, `oftheday.net` would still be unreachable
from Firebase because:
- Domain DNS is managed by Netlify
- Netlify DNS A records for `oftheday.net` point to Netlify's servers, not Firebase Hosting servers
- Firebase Hosting serves the app at `oftheday-c6490.web.app` (confirmed by deploy log)
- Custom domain `oftheday.net` has not been added in Firebase Console → Hosting
- Netlify DNS has not been updated with Firebase's IP addresses

These are two independent failures that must both be fixed.
