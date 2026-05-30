# FIREBASE HOSTING MIGRATION PLAN — OfTheDay.net

**Date:** 2026-05-30
**Status:** Not ready to execute. Blocked on build pipeline prerequisite.

---

## Feasibility Summary

Migrating OfTheDay.net from Netlify to Firebase Hosting is feasible but represents significant work across multiple systems. The migration cannot be performed in isolation — it is entangled with a required build pipeline upgrade, Netlify Function replacement, and Netlify Blobs replacement. Attempting Firebase Hosting deployment without these prerequisites will produce a broken, undeployable application.

**Estimated effort:** 5–10 engineering days across a 2–3 week window.

**Blockers that must be resolved first:**

| Blocker | Why It Blocks |
|---|---|
| No build pipeline | Firebase Hosting requires a `public` directory with a built artifact. The current repo has no build output. |
| Netlify Functions | Firebase Hosting does not execute Netlify Functions. Both functions must be rewritten as Firebase Functions (Node.js). |
| Netlify Blobs | `sync.js` uses `@netlify/blobs`. Firebase has no equivalent. Must migrate to Firestore. |
| No Firebase project | Firebase project must be provisioned before any config can be written. |

---

## Prerequisites (Must Complete Before Migration)

### Step 1: Add a Build Pipeline

Replace in-browser Babel with a proper build step. Recommended toolchain: **Vite + React**.

```bash
# Install Vite and React dependencies
npm create vite@latest oftheday-app -- --template react
# Extract JSX source from the custom bundler
# Move source files into src/
# Configure vite.config.js
# Output directory: dist/
npm run build
```

The build output at `dist/` becomes the Firebase Hosting public directory.

### Step 2: Replace Netlify Functions with Firebase Functions

```bash
npm install -g firebase-tools
firebase init functions
# Select Node.js runtime
# Rewrite on-this-day.js and sync.js as Firebase HTTP Functions
```

### Step 3: Replace Netlify Blobs with Firestore

The `sync.js` function's KV storage behavior maps directly to a Firestore document:

```
Collection: userSync
Document ID: SHA-256(email:syncKey)
Fields: { payload: <JSON string>, updatedAt: Timestamp }
```

---

## Required `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net;"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=63072000; includeSubDomains; preload"
          }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, must-revalidate"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

**Notes on CSP improvement:** Once in-browser Babel is replaced by a proper build step, `'unsafe-inline'` and `'unsafe-eval'` can be removed from the CSP. This is a significant security improvement that the build pipeline migration unlocks.

---

## Required `.firebaserc`

```json
{
  "projects": {
    "default": "oftheday-prod",
    "staging": "oftheday-staging"
  },
  "targets": {
    "oftheday-prod": {
      "hosting": {
        "production": ["oftheday-prod"]
      }
    }
  }
}
```

Replace `oftheday-prod` and `oftheday-staging` with the actual Firebase project IDs once provisioned.

---

## SPA Rewrite Rules

The `firebase.json` above includes the SPA rewrite as the last (catch-all) rule:

```json
{
  "source": "**",
  "destination": "/index.html"
}
```

This ensures that any path request — whether from a browser refresh, direct link, or future URL-based route — serves `index.html` from the `dist/` directory instead of returning a 404. This is functionally equivalent to Netlify's `[[redirects]] from = "/*"` rule.

---

## Preview Channel Plan

Firebase Hosting preview channels allow deploying a staging version to a temporary URL before promoting to production.

**Deploy to preview channel:**

```bash
firebase hosting:channel:deploy oftheday-migration
```

This creates a temporary URL like `https://oftheday-prod--oftheday-migration-HASH.web.app` that can be shared for review and testing without affecting the production deployment.

**List active channels:**

```bash
firebase hosting:channel:list
```

**Promote preview to production after approval:**

```bash
firebase hosting:clone oftheday-prod:oftheday-migration oftheday-prod:live
```

---

## Production Deploy Plan

Once all prerequisites are met and the preview channel is validated:

```bash
# 1. Build the app
npm run build

# 2. Deploy functions first (to ensure API is live before frontend)
firebase deploy --only functions

# 3. Deploy Firestore rules
firebase deploy --only firestore:rules

# 4. Deploy hosting
firebase deploy --only hosting

# 5. Verify deployment
firebase open hosting:site
```

Or deploy everything at once:

```bash
firebase deploy
```

---

## DNS / Domain Cutover Notes

When migrating from Netlify to Firebase Hosting for the `oftheday.net` domain:

1. **Before cutover:** Deploy to Firebase Hosting and verify the app works at the Firebase-assigned URL (`oftheday-prod.web.app`)
2. **Add custom domain in Firebase Console:** Firebase → Hosting → Add custom domain → `oftheday.net`
3. **Firebase provides DNS records** (A records or CNAME, depending on registrar): Add these to the domain registrar
4. **Do NOT remove Netlify DNS records until Firebase DNS is propagated** — maintain both for 24–48 hours during propagation
5. **TTL warning:** Lower the DNS TTL to 300 seconds (5 minutes) at least 48 hours before cutover to enable fast rollback if needed
6. **Firebase auto-provisions SSL** for custom domains via Google-managed certificates

---

## Rollback Plan

If the production Firebase deployment has issues:

**Option A: Rollback Firebase to previous release**
```bash
# List previous releases
firebase hosting:releases:list

# Rollback to a specific release
firebase hosting:rollback
```

**Option B: Repoint DNS to Netlify**
- Change DNS records at registrar back to Netlify's IP addresses/CNAME
- Netlify site should remain deployed and live during the migration window as a safety net
- DNS propagation takes 5 minutes (with lowered TTL) to 48 hours

**Recommended:** Keep the Netlify deployment live and unmodified for 7 days after Firebase cutover, serving as a hot rollback target.

---

## Migration Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Netlify Functions → Firebase Functions rewrite introduces bugs | High | Full functional testing on preview channel before cutover |
| Netlify Blobs → Firestore schema mismatch | High | Export/import script for existing user sync data |
| Build pipeline extraction breaks app | Critical | The JSX source must be carefully extracted from the custom bundler format |
| CSP tightening breaks something | Medium | Test on preview channel with browser console open |
| DNS propagation gap | Low | Keep Netlify live during cutover window |
| Firebase free tier limits | Low | Verify function invocation counts against Spark plan limits; upgrade to Blaze if needed |
| Auth migration | High | localStorage auth is not migrated by this plan — Firebase Auth migration is a separate workstream |

---

## Exact Command Sequence (End-to-End)

```bash
# === PHASE 1: Setup ===
npm install -g firebase-tools
firebase login
firebase init
# Select: Hosting, Functions, Firestore

# === PHASE 2: Build pipeline ===
npm run build
# Verify dist/ directory exists with index.html and assets

# === PHASE 3: Preview channel deploy ===
firebase hosting:channel:deploy oftheday-migration
# Test at preview URL

# === PHASE 4: Functions deploy (staging) ===
firebase use staging
firebase deploy --only functions
# Test API endpoints

# === PHASE 5: Production deploy ===
firebase use default
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting

# === PHASE 6: DNS cutover ===
# Update domain registrar DNS records per Firebase Console instructions

# === PHASE 7: Verify ===
curl -I https://oftheday.net
# Check: HTTP 200, correct CSP headers, HSTS present
```

---

## Migration Risks for Netlify Blobs → Firestore

Existing users who have data in Netlify Blobs need their data migrated to Firestore. Because there is no admin interface for Netlify Blobs, this requires:

1. A one-time migration script that reads all blobs from the Netlify Blobs store using the admin API
2. Writes each blob as a Firestore document using the same SHA-256(email:syncKey) key
3. A grace period where `sync.js` checks both Firestore (primary) and Netlify Blobs (fallback) before the Netlify Blobs store is decommissioned

This migration script does not currently exist and must be written as part of the migration workstream.
