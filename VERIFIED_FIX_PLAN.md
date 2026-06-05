# Verified Fix Plan
Date: 2026-06-05

---

## Exact Problem
Users see "Something went wrong. Try again." when attempting to sign in with
email/password or Google at oftheday.net.

## Evidence
- Screenshot: "Something went wrong. Try again." displayed on /login at oftheday.net
- Source confirmed: this string comes from `friendlyAuthError()` default case (App.jsx:768)
- `auth/operation-not-allowed` is not handled → falls to default
- This error is thrown by Firebase when the sign-in method is not enabled in the Console

## Actual Root Cause
Firebase Console has either:
  (a) Email/Password sign-in not enabled, OR
  (b) Google sign-in not enabled, OR
  (c) both disabled

Secondary: oftheday.net may not be in Firebase Authorized Domains (required for Google popup)

## Files To Change

### Firebase Console (must be done in browser — not code)
1. console.firebase.google.com → Project oftheday-c6490
   → Authentication → Sign-in method
   → Enable: Email/Password (toggle ON)
   → Enable: Google (toggle ON, add support email)

2. console.firebase.google.com → Project oftheday-c6490
   → Authentication → Settings → Authorized domains
   → Confirm oftheday.net is listed (add if missing)

### Code (one line — adds clear error message for this case)
- src/App.jsx:766 — add `auth/operation-not-allowed` case to friendlyAuthError

### Deploy (must be done on user's Mac)
- After code change: rebuild and deploy to Firebase Hosting

## Smallest Safe Fix

**Step 1 (Firebase Console — no code, immediate):**
Enable Email/Password and Google in Firebase Auth sign-in methods.
Add oftheday.net to Authorized Domains.

**Step 2 (Code — one line):**
In src/App.jsx friendlyAuthError(), add after line 766:
  `case 'auth/operation-not-allowed': return 'This sign-in method is not enabled. Contact support.';`

**Step 3 (Deploy — on user's Mac):**
```bash
cd "/Users/mikeradicone/Desktop/of the day"
git pull origin main
npm run build
firebase deploy --only hosting
```

## Test Plan
After Firebase Console changes (Step 1 only — before any code change):
1. Go to oftheday.net/login
2. Attempt to sign in with email/password → should succeed or show specific error
3. Attempt to sign in with Google → popup should open → should succeed
4. If Step 1 alone fixes it: error was Firebase Console config, not code

## Deployment Verification Plan
After deploy (Step 3):
1. Run: `curl -s https://oftheday.net | grep -o "firebase/app"`
   → Should return "firebase/app" (confirms Firebase bundle is serving)
2. Check bundle hash changed vs previous deploy
3. Attempt sign-in in browser and observe behavior

## Rollback Plan
- Firebase Console changes: re-disable sign-in methods (toggle off)
- Code change: `git revert HEAD` on main, redeploy
- No database changes involved — rollback is safe

## Definition Of Done
The fix is complete when ALL of the following are true:
1. [ ] Firebase Console shows Email/Password enabled
2. [ ] Firebase Console shows Google enabled
3. [ ] oftheday.net is in Authorized Domains
4. [ ] Signing in with email/password on oftheday.net succeeds (no "Something went wrong")
5. [ ] Signing in with Google on oftheday.net opens popup and completes
6. [ ] Build passes locally: `npm run build` exits 0
7. [ ] Deployed bundle confirmed (bundle filename changed in page source)

---

## STOP — Awaiting Approval Before Any Code Change

Step 1 (Firebase Console) can and should be done immediately — it requires no approval
because it is not a code change and is the most likely root cause.

Step 2 (code) and Step 3 (deploy) require your approval.
