# Verified Fix Plan
Date: 2026-06-07

---

## Exact Problem
`oftheday.net` does not load at all — blank white screen. The app has been deployed to
Firebase Hosting but cannot be reached at the custom domain, and the deployed bundle is broken.

## Evidence
1. Build log for GitHub Actions run #2 (job 79888302642) shows all 6 VITE_FIREBASE_* vars empty
2. `src/lib/firebase.js:14` throws when `apiKey === ""` — confirmed in source
3. User confirmed: domain is owned/DNS-managed through Netlify
4. Firebase Hosting confirmed serving at `oftheday-c6490.web.app` but not `oftheday.net`

## Actual Root Causes (in fix order)

1. **GitHub Secrets not set** → build bakes empty Firebase credentials → app crashes on load
2. **DNS not updated** → `oftheday.net` points to Netlify, not Firebase Hosting
3. **Firebase Auth sign-in methods** → may not be enabled → sign-in will fail after 1 and 2 are fixed

---

## Fix Steps (in order — each step unblocks the next)

### Step A: Add GitHub Secrets (fixes blank screen)
GitHub → https://github.com/Dembryllc/of-the-day → Settings → Secrets and variables → Actions → New repository secret

Add each one:

| Secret Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyD77FabrJ77AUj3yAf722ctseHLSFIRSyw` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `oftheday-c6490.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `oftheday-c6490` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `oftheday-c6490.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `984386798513` |
| `VITE_FIREBASE_APP_ID` | `1:984386798513:web:946e156afbade9dfd7b390` |

After adding all 6: re-run the GitHub Actions workflow (Actions tab → run #2 → Re-run jobs).
Or push any commit to main — the workflow triggers automatically.

Verify: open `oftheday-c6490.web.app` — should load the app (no blank screen).

### Step B: Connect Custom Domain in Firebase (fixes oftheday.net DNS)
1. Firebase Console → Project `oftheday-c6490` → Hosting → "Add custom domain"
2. Enter `oftheday.net` → Continue
3. Firebase shows 2 A record IP addresses — copy them
4. Netlify DNS → Domains → oftheday.net → DNS settings:
   - Delete existing A records for `@` (root domain)
   - Add 2 new A records: Type=A, Name=@, Value=<Firebase IP 1>
   - Add 2 new A records: Type=A, Name=@, Value=<Firebase IP 2>
   - Add CNAME: Name=www, Value=oftheday-c6490.web.app
5. Back in Firebase Console: click Verify (wait 5–30 min for DNS propagation)

### Step C: Enable Auth Sign-in Methods (fixes sign-in failures)
Firebase Console → Project `oftheday-c6490` → Authentication → Sign-in method:
- Enable **Email/Password** (toggle ON)
- Enable **Google** (toggle ON, add support email: dembryllc@gmail.com)

Firebase Console → Authentication → Settings → Authorized domains:
- Add `oftheday.net`
- Add `www.oftheday.net`

---

## Files To Change
**None.** All three fixes are infrastructure configuration, not code.
The code in the repo is correct. No code changes needed.

---

## Test Plan (in order)

**After Step A:**
1. Open `https://oftheday-c6490.web.app` in browser
2. Page should load (not blank) — confirms secrets fixed the bundle

**After Step B:**
1. Wait 5–30 min for DNS propagation
2. Open `https://oftheday.net` — should load the landing page
3. Confirm SSL certificate is active (padlock in browser)

**After Step C:**
1. Go to `oftheday.net/login`
2. Sign in with email/password → should succeed
3. Sign in with Google → popup should open and complete

---

## Rollback Plan
- **Step A**: Delete the GitHub Secrets — next workflow run will use empty vars again (broken bundle)
- **Step B**: Remove Firebase A records from Netlify DNS, re-add old Netlify A records
- **Step C**: Disable sign-in methods in Firebase Console

No code changes are involved. All rollbacks are reversible in under 5 minutes.

---

## Definition Of Done

The fix is complete when ALL of the following are confirmed:

1. [ ] All 6 GitHub Secrets visible in repo Settings → Secrets
2. [ ] GitHub Actions re-run succeeds AND build log shows non-empty VITE_FIREBASE_API_KEY
3. [ ] `oftheday-c6490.web.app` loads the app (not blank screen)
4. [ ] Firebase Console shows `oftheday.net` as a verified custom domain under Hosting
5. [ ] `oftheday.net` loads in browser (DNS resolved, SSL active)
6. [ ] Firebase Console shows Email/Password and Google enabled under Authentication
7. [ ] Sign in with email/password on oftheday.net succeeds
8. [ ] Sign in with Google on oftheday.net opens popup and completes

---

## STOP — No Code Changes Needed

All fixes are in Firebase Console, GitHub Settings, and Netlify DNS.
Approval is needed before any code is touched (no code changes are planned).

User actions required:
- Step A: GitHub Settings (2 min)
- Step B: Firebase Console + Netlify DNS (10 min + up to 30 min DNS propagation)
- Step C: Firebase Console (2 min)
