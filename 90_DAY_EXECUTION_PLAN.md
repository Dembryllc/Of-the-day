# 90-Day Execution Plan — OfTheDay.net
Date: 2026-06-07
Context: One founder, limited time, limited AI budget. Optimize for revenue.

---

## Constraints & Assumptions

- Solo founder, ~10-15 hrs/week on OfTheDay
- Goal: First paying customer within 30 days
- Stripe in test mode today → needs to go live
- Site not loading today → 3 infrastructure blockers
- Code quality is high; feature set is MVP-complete
- No marketing budget assumed; organic/teacher community focus

---

## This Week (Days 1–7): Make It Work

**Goal: App loads. Sign-in works. First user can complete the flow.**

All items this week are user actions (no code needed):

### Day 1 — Fix Infrastructure (2 hours total)

**Hour 1: GitHub Secrets + DNS**
1. GitHub → dembryllc/of-the-day → Settings → Secrets and variables → Actions
   - Add all 6 VITE_FIREBASE_* secrets (values in VERIFIED_FIX_PLAN.md)
2. Go to GitHub Actions → re-run latest workflow
3. Firebase Console → Hosting → Add custom domain → oftheday.net
   - Copy the 2 Firebase IP addresses
4. Netlify DNS → oftheday.net → DNS settings
   - Delete old A records pointing to Netlify
   - Add Firebase A records
   - Add CNAME: www → oftheday-c6490.web.app
5. Wait for DNS propagation (5–30 min)

**Hour 2: Firebase Auth**
1. Firebase Console → Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (add support email: dembryllc@gmail.com)
2. Authentication → Settings → Authorized domains
   - Add oftheday.net
   - Add www.oftheday.net
3. Test: open oftheday.net → create account → should work

**Verify:**
- [ ] oftheday.net loads (not blank)
- [ ] Can create email/password account
- [ ] Can sign in with Google
- [ ] Dashboard renders with grade selector
- [ ] Today view shows activities
- [ ] Projector mode opens

### Days 2–3: Stripe Go-Live (1 hour)

1. Stripe Dashboard → switch to Live mode
2. Create 2 products:
   - OfTheDay Pro Monthly: $9/mo (get live price ID)
   - OfTheDay Pro Annual: $79/yr (get live price ID)
3. Get live secret key (Stripe Dashboard → Developers → API keys)
4. Register webhook:
   - URL: `https://us-central1-oftheday-c6490.cloudfunctions.net/stripeWebhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret
5. Update `functions/.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Update `functions/index.js` — replace test price IDs with live price IDs
7. Deploy functions: `firebase deploy --only functions`

**Verify:**
- [ ] Can start checkout on /upgrade
- [ ] Stripe checkout shows real pricing
- [ ] Test purchase with real card (refund immediately)
- [ ] User gets Pro tier after payment

### Days 4–7: First User Acquisition

- Share in teacher Facebook groups / Reddit r/Teachers / Twitter/X
- Post in Responsive Classroom community forums
- Email any teachers you know personally
- Goal: 5–10 signups this week; 1 paid conversion

**Do NOT work on:**
- New features
- App.jsx refactoring
- Analytics (yet)
- School tier
- Mobile optimization

---

## This Month (Days 8–30): Monetize

**Goal: 5–10 paying users. Real revenue confirmed. Feedback loop established.**

### Week 2: Onboarding Polish
- Add a simple welcome state for first-time users (one small change in App.jsx)
- Add Sentry error tracking (30 min, package install + 2 lines)
- Add basic analytics: track signup, first routine generated, projector opened, upgrade click
- Tools: Posthog (free tier, 1M events/mo)

### Week 3: Conversion Optimization
- Test the full upgrade flow end-to-end as a free user
- Find and fix any friction points in trial → paid conversion
- Add "Trial ends in X days" email (Firebase Email Extension or SendGrid)
- Ensure Stripe Customer Portal is linked from settings (1 line of code: Stripe-hosted portal URL)

### Week 4: Distribution
- Create 2-minute demo video showing Today view → Projector mode
- Post to: Teachers Pay Teachers community, Responsive Classroom Facebook group, LinkedIn
- Goal: 50 signups total, 5 paid customers ($45/mo MRR)

**Do NOT work on:**
- School tier
- Real-time sync
- Mobile app
- Component extraction

---

## Next 90 Days (Days 31–90): Scale

**Goal: Consistent new signups. $200+/mo MRR. School pipeline started.**

### Month 2 (Days 31–60): Retention & Discovery

**Technical:**
- Add functions deploy to CI/CD pipeline (eliminates manual deploy step)
- Improve onboarding to guided first-use flow
- Subscription management UI (cancel without leaving the app)
- Trial-end email sequence (Day 10, Day 13, Day 14 of trial)
- Fix App.jsx by extracting DisplayMode, AuthScreen, ProfileSheet as separate files

**Growth:**
- Identify 5 "power user" teachers who use it daily — interview them
- Build a "Refer a colleague" flow (basic share button)
- Explore TPT (Teachers Pay Teachers) distribution partnership
- Submit to Edtech newsletters (EdSurge, etc.)

### Month 3 (Days 61–90): School Tier Prep

**Technical:**
- Design school tier: what does a school admin see?
- Build basic school admin dashboard (list of teachers, seat count)
- Add multi-seat license flow in Stripe (subscription with quantity)
- Test with 1 school administrator for feedback

**Growth:**
- Cold outreach to 20 school instructional coaches
- Create a "free for your school this month" intro offer
- Track: school-size conversion funnel

---

## What Should NOT Be Worked On

| Item | Why |
|------|-----|
| Mobile app (iOS/Android) | Web works on mobile browsers; native app requires 10x effort |
| Real-time Firestore listeners | Nice-to-have; manual sync works fine for current scale |
| i18n / localization | English-only market first; adds huge maintenance cost |
| Component extraction (App.jsx) | No user value; do after monetization is proven |
| Custom analytics dashboards | Use Posthog free tier; don't build your own |
| WCAG audit | Important but not a blocker for current user acquisition |
| vite.config.mjs cleanup | 5 min of work but not worth context-switching now |

---

## What Should Be Postponed

| Item | When to Revisit |
|------|----------------|
| School tier backend | Month 3 (after 20+ individual paying users) |
| Functions CI/CD | Month 2 (when function updates become frequent) |
| Sentry error tracking | Week 2 (after site is live) |
| Subscription management UI | Month 2 (when cancellations start happening) |

---

## What Should Be Abandoned (or Deprioritized Indefinitely)

| Item | Why |
|------|-----|
| foundation.html / vite.config.mjs second entry | Appears abandoned; clean it up in 5 min |
| Planning docs in repo root | Move to a /docs folder or delete after Phase 1 infra is fixed |
| Netlify as hosting (already removed) | Done; no further Netlify work needed |

---

## 90-Day Success Metrics

| Metric | Day 7 | Day 30 | Day 90 |
|--------|-------|--------|--------|
| Site loads | ✓ | ✓ | ✓ |
| Sign-in works | ✓ | ✓ | ✓ |
| Total signups | 10 | 50 | 200 |
| Paying users | 0 | 5 | 20 |
| MRR | $0 | $45 | $180 |
| Schools pipeline | 0 | 0 | 3 conversations |
