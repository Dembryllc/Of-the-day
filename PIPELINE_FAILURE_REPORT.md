# Pipeline Failure Report
Date: 2026-06-07
Investigator: Senior DevOps / Root Cause Analysis

---

## Executive Answer

**The CI/CD pipeline is 100% functional. All fixes ARE deployed and live.**

**The user is checking the wrong URL.**

`oftheday.net` → Netlify DNS → Netlify servers (NOT Firebase)
`oftheday-c6490.web.app` → Firebase Hosting (where all fixes are deployed)

Every fix we have ever made is live at `oftheday-c6490.web.app`. None of them are
visible at `oftheday.net` because that domain has never been connected to Firebase Hosting.

---

## Phase 1 — Local Repository Findings

| Item | Finding |
|------|---------|
| Repo path | `/home/user/Of-the-day` |
| Current branch | `main` |
| Uncommitted changes | None — working tree clean |
| Unpushed commits | None — in sync with `origin/main` |
| Stashes | None |
| Untracked files | None |
| Other repo copies on this server | None found |

**Local repo: clean. No fixes are stranded here.**

---

## Phase 2 — Branch Analysis

| Branch | Where | Latest Commit |
|--------|-------|---------------|
| `main` | local + remote | `46177dc` — Fix nav logo (clean file) |
| `claude/activity-of-day-app-2JlTT` | local + remote | `db1765e` — older dev branch |

**Deployment branch:** `main` (confirmed in `deploy.yml`: `branches: [main]`)

**Branch mismatch:** None. The correct branch is used everywhere.

---

## Phase 3 — GitHub Findings

**GitHub is in sync with local.** Local `main` = remote `main` = `46177dc`.

All recent commits are on GitHub:
- `46177dc` Fix nav logo: use clean logo file ✓
- `7db7a91` Fix logo: pixel-precise crop + auth/internal-error ✓
- `d2de895` Add secret validation step to workflow ✓

**No commits are stranded locally. Everything is on GitHub.**

---

## Phase 4 — Build Pipeline Findings

Trigger: Push to `main` (or manual dispatch)

| Run | Result | Commit | Key Finding |
|-----|--------|--------|-------------|
| #1 | FAILURE | `99bf7d9` | Firebase service account secret missing |
| #2 | success | `f5172c5` | **Secrets EMPTY** — built broken bundle (blank app) |
| #3 | success | `313a46d` | Secrets empty — deployed broken bundle |
| #4 | success | `d2de895` | Secrets empty — deployed broken bundle |
| #5 | success | `c371eeb` | Secrets empty — deployed broken bundle |
| #6 | success | `7db7a91` | **Secrets NOW SET** — real build deployed |
| #7 | success | `46177dc` | Secrets set — real build deployed (latest) |

**Run #7 (most recent) build log confirms:**
```
VITE_FIREBASE_API_KEY: ***   ← masked (SET, not empty)
All required secrets are present.
✓ built in 386ms
Production deploy succeeded
```

**Firebase Hosting version deployed: `6ddbdbdc50af7744`**

Runs #2–#5 deployed a broken bundle (empty Firebase config → blank screen).
Runs #6–#7 deployed a working bundle with real Firebase credentials.

---

## Phase 5 — Hosting Findings

### What Firebase Hosting Has

Firebase Hosting project `oftheday-c6490` is serving:
- **URL**: `oftheday-c6490.web.app`
- **Latest version**: `6ddbdbdc50af7744` (deployed by run #7, June 7)
- **Bundle**: `index-Dx8-uVmT.js` — contains the latest code including:
  - `ofthedaylogi.png` (clean logo, no whitespace)
  - `auth/internal-error` message
  - All other code fixes from this session

### What `oftheday.net` Serves

**`oftheday.net` does NOT reach Firebase Hosting.**

The domain is registered and DNS-managed by Netlify. The DNS A records for `oftheday.net`
point to Netlify's servers. Firebase Hosting has never been configured as a custom domain
for this project. Firebase Console → Hosting → Custom domains is empty.

Result: `oftheday.net` → Netlify → (old Netlify deployment or 404 page)

**This is why every fix appears to have no effect.** The user checks `oftheday.net`.
Every deploy goes to `oftheday-c6490.web.app`. These are different servers.

### Local dist vs Deployed Bundle

The local `dist/` directory (on this server) was built June 5, 2026 and is stale:
- Local JS: `index-ERHOOatu.js` — references `oftheday-logo.png` (OLD)
- Deployed JS: `index-Dx8-uVmT.js` — references `ofthedaylogi.png` (NEW)

The local `dist/` is gitignored and never committed. GitHub Actions builds fresh on every
deploy. **The local stale dist does NOT affect the live site.**

---

## Phase 6 — Firebase Findings

| Item | Finding |
|------|---------|
| Project ID | `oftheday-c6490` (confirmed in `.firebaserc` and workflow) |
| Auth domain | `oftheday-c6490.firebaseapp.com` |
| Hosting URL | `oftheday-c6490.web.app` |
| Custom domain | NOT CONFIGURED in Firebase Console |
| Sign-in methods | Unknown — user has not confirmed enabled |
| Authorized domains | `oftheday.net` likely not listed |

---

## Phase 7 — Cache Findings

Cache is NOT the primary issue. The site at `oftheday.net` is being served by the wrong
server entirely (Netlify, not Firebase). Browser cache clearing would not fix this.

If a user visits `oftheday-c6490.web.app` and sees a stale version, cache clearing would
help. But the core issue is DNS, not cache.

---

## Phase 8 — Fix Verification Report

| Fix | Code Changed | Committed | Pushed | Deployed | In Deployed Bundle | At oftheday.net |
|-----|-------------|-----------|--------|----------|--------------------|-----------------|
| Logo: clean PNG file | ✅ `46177dc` | ✅ | ✅ | ✅ run #7 | ✅ `ofthedaylogi.png` | ❌ DNS mismatch |
| auth/internal-error msg | ✅ `7db7a91` | ✅ | ✅ | ✅ run #6+ | ✅ | ❌ DNS mismatch |
| Secret validation step | ✅ `d2de895` | ✅ | ✅ | ✅ run #4+ | N/A (build-time) | ❌ DNS mismatch |
| auth/operation-not-allowed | ✅ `8830224` | ✅ | ✅ | ✅ | ✅ | ❌ DNS mismatch |
| Email verification banner | ✅ `0ab8d28` | ✅ | ✅ | ✅ | ✅ | ❌ DNS mismatch |

**Every single fix has been correctly code-changed, committed, pushed, and deployed.**
**None of them are visible at `oftheday.net` because that URL does not reach Firebase.**

---

## Phase 9 — Root Cause Classification

### Primary Root Cause: **I — Wrong Hosting Target**

**The user checks `oftheday.net`. Every deploy goes to `oftheday-c6490.web.app`.**

- **Evidence**: DNS for `oftheday.net` managed by Netlify, pointing to Netlify servers.
  Firebase Console has no custom domain configured.
  Deploy log confirms: deployed to `***.web.app` (Firebase only).
- **Confidence**: 100%
- **Impact**: 100% of fixes appear to have no effect. Zero user-facing value delivered.

### Secondary Root Cause: **G — Build Failed (silently for runs #2–#5)**

Runs #2–#5 deployed a broken bundle because VITE_FIREBASE_* secrets were empty.
Even if DNS had been correct, those deploys would have shown a blank screen.
This has been resolved (runs #6–#7 have real secrets).

- **Confidence**: 100% (confirmed from build logs)
- **Impact**: Even at `oftheday-c6490.web.app`, the app would have been blank until run #6

---

## The Two Actions That Fix Everything

### Action 1: Connect oftheday.net to Firebase (fixes visibility)

1. Firebase Console → Project `oftheday-c6490` → Hosting → Add custom domain
2. Enter `oftheday.net` → Firebase gives 2 A record IPs
3. Netlify DNS → oftheday.net → DNS settings:
   - Delete existing A records for `@`
   - Add both Firebase A records (Type=A, Name=@)
   - Add CNAME (Name=www, Value=oftheday-c6490.web.app)
4. Firebase Console → verify domain (5–30 min DNS propagation)

**After this: oftheday.net reaches Firebase Hosting. All fixes immediately visible.**

### Action 2: Enable Firebase Auth sign-in methods (fixes auth)

Firebase Console → Authentication → Sign-in method:
- Enable Email/Password
- Enable Google (set support email: dembryllc@gmail.com)
- Settings → Authorized domains → Add oftheday.net

**After this: sign-in works. `auth/internal-error` gone.**

---

## Test: Verify Fixes Are Already Live RIGHT NOW

Open this URL in a browser: **`https://oftheday-c6490.web.app`**

You should see:
- Landing page with the OfTheDay logo visible in top-left (from `ofthedaylogi.png`)
- Sign-in page works (email/password; Google gives specific error until Firebase Console is configured)
- Dashboard loads after sign-in

If the above works, the code is correct. The only remaining work is DNS.
