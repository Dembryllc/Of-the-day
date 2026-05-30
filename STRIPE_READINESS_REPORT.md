# STRIPE READINESS REPORT — OfTheDay.net

**Date:** 2026-05-30
**Status:** NOT READY. Score: 0 / 10.

---

## Honest Assessment

OfTheDay.net currently has **zero infrastructure for payment processing**. The word "stripe" appears exactly once in the codebase — as a CSS class name `.card-stripe` that applies a decorative border to a UI card. There is no Stripe SDK, no checkout session, no webhook handler, no subscription state, no paid/free feature gate, no pricing page, and no user account system that could be linked to a payment provider.

Adding Stripe to the product in its current state is technically impossible. Stripe requires a real user identity system (email, account record in a database), server-side backend functions to create checkout sessions and handle webhooks, and a persistent subscription state that the frontend can query. The current app has none of these.

**Before Stripe can be added, the following must exist:**
1. Firebase Auth (real user accounts with server-verified identity)
2. Firestore (user records where subscription state can be stored)
3. Firebase Functions (server-side logic for Stripe API calls)
4. A build pipeline (so environment variables like Stripe keys can be injected safely)
5. A landing page with pricing section (so users know a paid tier exists)

---

## Current State: Stripe Readiness Checklist

| Requirement | Status | Notes |
|---|---|---|
| Real user accounts (server-side) | NO | Auth is localStorage only |
| Email-verified user identity | NO | No email verification exists |
| Backend function capability | Partial | 2 Netlify Functions exist, but no auth/payment logic |
| Database for user records | NO | Netlify Blobs is a KV cache, not a user DB |
| Subscription state field | NO | No such field anywhere |
| Free/paid feature gates in frontend | NO | All features accessible to all users |
| Pricing page | NO | Does not exist |
| Stripe Checkout session creator | NO | Function does not exist |
| Stripe webhook handler | NO | Function does not exist |
| Stripe SDK installed | NO | Not in package.json |
| STRIPE_SECRET_KEY env var | NO | Not configured anywhere |
| STRIPE_WEBHOOK_SECRET env var | NO | Not configured anywhere |
| Stripe Products created | NO | No Stripe dashboard configured |
| Payment success/failure UI | NO | Does not exist |
| Subscription management UI | NO | Does not exist |
| Trial/free tier enforcement | NO | No tier distinction exists |

---

## Recommended Pricing Model

Based on the product feature set and the K-12 teacher market:

| Tier | Price | Features | Stripe Product |
|---|---|---|---|
| Free | $0/forever | Today view, basic activity library (18 activities), 3 saved routines, 1 custom activity, no cloud sync | No charge |
| Pro Teacher | $9/month or $79/year | Unlimited routines and custom activities, full activity library, all content tools (Word of the Day, Do Now, On This Day), projector mode, cloud sync, priority support | `prod_ProTeacher` |
| School | $199/year | All Pro features for up to 50 teacher accounts, admin roster management, school-branded routine templates (future) | `prod_School` |
| District | Custom / annual contract | All School features, SSO integration, usage reporting, dedicated onboarding | Direct sales |

**Recommended launch sequence:** Free tier + Pro Teacher only. Do not build School tier until 100+ Pro subscribers validate the product.

---

## Required Stripe Products and Prices

```
Stripe Dashboard → Products:

Product: "OfTheDay Pro Teacher"
  Price 1: $9.00/month recurring (price_ProTeacherMonthly)
  Price 2: $79.00/year recurring (price_ProTeacherYearly)

Product: "OfTheDay School"
  Price 1: $199.00/year recurring (price_School)
```

---

## Required Firebase Functions

### Function 1: `createCheckoutSession`

Creates a Stripe Checkout session for the selected plan.

```javascript
// functions/src/createCheckoutSession.js
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  
  const { priceId } = data;
  const uid = context.auth.uid;
  const email = context.auth.token.email;

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: 'https://oftheday.net/app?checkout=success',
    cancel_url: 'https://oftheday.net/pricing',
    metadata: { uid },
  });

  return { url: session.url };
});
```

### Function 2: `stripeWebhook`

Handles Stripe webhook events to update subscription state in Firestore.

```javascript
// functions/src/stripeWebhook.js
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Write subscription record to Firestore
      break;
    case 'customer.subscription.updated':
      // Update plan/status in Firestore
      break;
    case 'customer.subscription.deleted':
      // Downgrade to free tier in Firestore
      break;
  }

  res.json({ received: true });
});
```

### Function 3: `createPortalSession`

Sends the user to the Stripe customer portal for subscription management.

```javascript
// functions/src/createPortalSession.js
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const customerId = userDoc.data().stripeCustomerId;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: 'https://oftheday.net/app',
  });

  return { url: session.url };
});
```

---

## Required Firestore Schema

```
Collection: users
  Document ID: Firebase Auth UID
  Fields:
    email: string
    displayName: string
    grade: string (K-2 | 3-5 | 6-8 | 9-12)
    createdAt: Timestamp
    plan: string (free | pro | school)
    planStatus: string (active | past_due | canceled | trialing)
    stripeCustomerId: string
    stripeSubscriptionId: string
    subscriptionCurrentPeriodEnd: Timestamp
    schoolId: string (optional, for school tier)
```

---

## Required Frontend Changes

1. **Feature gate wrapper component:** A React component that checks `user.plan` and renders either the gated content or an upgrade prompt.

```jsx
function RequiresPro({ children }) {
  const { user } = useAuth();
  if (user.plan === 'free') return <UpgradePrompt feature="projector mode" />;
  return children;
}
```

2. **Pricing page component:** A standalone route/view showing the Free / Pro / School tiers with Stripe Checkout buttons.

3. **Checkout redirect handler:** Detects `?checkout=success` on return from Stripe and shows a success state.

4. **Subscription management UI:** A "Manage Subscription" button in Settings that triggers `createPortalSession`.

5. **Plan badge in Settings:** Shows current tier (Free / Pro / School) and renewal date.

---

## Required Environment Variables

```bash
# Firebase Functions runtime config or .env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_ProTeacherMonthly
STRIPE_PRO_YEARLY_PRICE_ID=price_ProTeacherYearly
STRIPE_SCHOOL_PRICE_ID=price_School

# Frontend (injected at build time via Vite)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Security note:** The Stripe secret key must NEVER appear in frontend code or be committed to git. It belongs only in Firebase Functions runtime environment or a secrets manager.

---

## Webhook Plan

| Event | Action |
|---|---|
| `checkout.session.completed` | Create/update user doc with `plan: 'pro'`, store `stripeCustomerId` and `stripeSubscriptionId` |
| `customer.subscription.updated` | Update `planStatus`, `subscriptionCurrentPeriodEnd` |
| `customer.subscription.deleted` | Set `plan: 'free'`, clear subscription fields |
| `invoice.payment_failed` | Set `planStatus: 'past_due'`, send warning email (future) |
| `customer.subscription.trial_will_end` | Send conversion email 3 days before trial end (future) |

All webhook events should be logged to Firestore for audit purposes.

---

## Security Risks

1. **Never call Stripe API from frontend.** All Stripe API calls (session creation, webhook handling) must occur in Firebase Functions with the secret key. The publishable key is safe for frontend use; the secret key is not.
2. **Always verify webhook signatures.** Use `stripe.webhooks.constructEvent()` with the webhook secret to validate that events actually came from Stripe, not from spoofed POST requests.
3. **Idempotency.** Webhook handlers must be idempotent — Stripe may send the same event multiple times. Use the event ID to detect and skip duplicate processing.
4. **Subscription state source of truth is Firestore, not frontend.** Never trust a client-side claim about subscription status. Always read from Firestore in Firebase Functions and in Firestore security rules.

---

## Implementation Phases

**Phase 0 — Prerequisites (must complete first):**
- Firebase Auth (real user accounts)
- Firestore (user records)
- Firebase Functions (server-side capability)
- Build pipeline (Vite — for safe env var injection)

**Phase 1 — Stripe Infrastructure:**
- Create Stripe account and products
- Implement `createCheckoutSession` Firebase Function
- Implement `stripeWebhook` Firebase Function
- Configure webhook endpoint in Stripe Dashboard

**Phase 2 — Frontend Integration:**
- Build pricing page
- Implement feature gates for Pro features (projector mode, cloud sync, unlimited routines)
- Add checkout flow (redirect to Stripe Checkout, handle return)
- Add subscription management (Stripe portal link)

**Phase 3 — Conversion Optimization:**
- Add trial period (14 days Pro for new signups)
- Add upgrade nudges at feature gate moments
- Add email sequences for trial expiry (requires email service like Resend or SendGrid)
- Add school/district tier and admin dashboard

---

## Estimated Timeline to Stripe-Ready

Assuming Firebase Auth + Firestore + Functions are already complete:

| Task | Effort |
|---|---|
| Stripe account setup + products | 2 hours |
| `createCheckoutSession` function | 4 hours |
| `stripeWebhook` function | 6 hours |
| `createPortalSession` function | 2 hours |
| Frontend pricing page | 1 day |
| Frontend feature gates | 1 day |
| Frontend checkout flow | 4 hours |
| Testing (test mode) | 1 day |
| **Total** | **~4–5 engineering days** |

This estimate assumes Firebase Auth, Firestore, and the build pipeline are already in place. Those prerequisites represent a separate 2–3 week workstream.
