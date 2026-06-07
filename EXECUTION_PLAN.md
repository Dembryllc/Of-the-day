# Execution Plan — Single Highest ROI Task
Date: 2026-06-07

---

## Decision: What Is the Single Highest ROI Code Task?

The three infrastructure blockers (GitHub Secrets, DNS, Firebase Auth) are user actions —
they cannot be done in code. They are also the highest ROI actions overall, but they require
the user to take them.

The highest ROI **code** task that can be done right now is:

**Add Firebase Functions deployment to the GitHub Actions CI/CD pipeline.**

### Why This Is the Highest ROI Code Task

1. Every Stripe configuration update (live keys, live price IDs) requires a function deploy.
2. Right now, deploying functions requires the user to run `firebase deploy --only functions`
   from their local Mac with Firebase CLI installed and authenticated.
3. If this breaks (laptop not available, CLI outdated, service account expired), functions
   go stale and payments stop working.
4. Adding this to CI/CD means every `git push` to main deploys both hosting AND functions
   automatically, reliably, from any machine.
5. This is the path-to-revenue enabler — the Stripe changes in P1-5 and P1-6 become
   a simple code commit + push instead of a manual multi-step process.

### Why Not Other Tasks?

| Task | Why Not #1 |
|------|-----------|
| Sentry error tracking | Value only after site is live; users can't reach it yet |
| Onboarding flow | Value only after sign-in works |
| Analytics | Value only after users exist |
| App.jsx extraction | No user value; pure maintenance |
| School tier | Month 3 work |

---

## Problem

GitHub Actions CI/CD deploys Firebase Hosting but not Firebase Cloud Functions.
Functions must be manually deployed with `firebase deploy --only functions` from a local
machine with Firebase CLI and a service account.

This creates a deployment gap: hosting is always current after every push, but functions
can be days or weeks behind.

---

## Root Cause

The existing workflow (`deploy.yml`) uses `FirebaseExtended/action-hosting-deploy@v0` which
only handles hosting. There is no step that calls `firebase deploy --only functions`.

---

## Files to Change

- `.github/workflows/deploy.yml` — add functions deploy step after hosting deploy

---

## Risk

**Low-Medium.**

- Adding functions deploy requires the Firebase service account (`secrets.oftheday`) to have
  Cloud Functions deploy permissions. The existing service account may need additional roles.
- If the service account lacks the `roles/cloudfunctions.developer` IAM role, the step will
  fail with a permissions error. This is recoverable — the deploy step can be skipped for
  functions or a new service account can be generated.
- Functions deploy is slower than hosting deploy (~2-3 min vs ~30 sec).
- No risk of data loss or user-facing breakage — a failed functions deploy leaves existing
  functions running unchanged.

---

## Rollback Plan

If the functions deploy step fails:
1. The hosting deploy already succeeded (functions step runs after hosting).
2. Remove the functions deploy step from the workflow, commit, push.
3. Functions continue running from their last manual deploy.
4. No user-facing regression.

---

## Definition of Done

1. `.github/workflows/deploy.yml` has a functions deploy step after hosting
2. Workflow triggers on push to main
3. Next workflow run deploys BOTH hosting and functions
4. Build log shows functions deploy success message
5. No regression in existing hosting deploy

---

## Implementation

The `FirebaseExtended/action-hosting-deploy@v0` action uses the service account in
`secrets.oftheday` to authenticate. Firebase CLI (installed by that action) can also
deploy functions using the same credentials.

We can add a step after the hosting deploy that runs:
```bash
npx firebase-tools@latest deploy --only functions --project oftheday-c6490
```

This uses the same Application Default Credentials set up by the hosting action.

The key insight: `FirebaseExtended/action-hosting-deploy@v0` sets up ADC (Application Default
Credentials) using the service account. Any subsequent step in the same job can use
`firebase` CLI commands with those credentials already active.

---

## STOP — Awaiting Approval

This plan changes the CI/CD pipeline. Before implementing:
- Confirm the `secrets.oftheday` service account has Firebase Functions deploy permissions
  (Firebase Console → Project Settings → Service Accounts → check roles)
- If unsure: implementing it will either work or produce a clear IAM error, which is
  harmless and easy to fix

Do you want me to implement this?
