# UX/UI STATE REPORT — OfTheDay.net

**Date:** 2026-05-30
**Status:** Functional but pre-commercial. Clean visual design, weak onboarding, zero conversion context.

---

## UX/UI Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Usability | 6 / 10 | Core tasks work; discoverability of secondary features is poor |
| Visual Design | 7.5 / 10 | Clean teal/dark theme, polished component system |
| Onboarding | 2 / 10 | No tutorial, no guidance, `tutorialSeen` field exists but is unused |
| Conversion Potential | 2 / 10 | No product context before signup; no pricing signal; no landing page |
| Trust | 4 / 10 | localStorage auth, no password reset, no email verification |
| Classroom Readiness | 7 / 10 | Projector mode works, grade filtering works, content is appropriate |
| Mobile Experience | 6 / 10 | Responsive layout + mobile bottom nav present; projector mode is desktop-only |
| Overall UX | 5 / 10 | Functional for a teacher who already knows what it does; hostile to new visitors |

---

## Strengths

**1. Visual Design Quality**
The teal/dark theme is polished, consistent, and appropriate for an education product. Custom CSS design tokens are used throughout, producing a coherent visual language. Component styling (cards, buttons, activity chips, sidebar) is professional. This is above average for a teacher tool in this market.

**2. Responsive Layout (24 media queries confirmed)**
The app handles mobile, tablet, and desktop breakpoints. The mobile layout uses a bottom navigation bar pattern (standard for mobile apps), which is a strong UX choice for one-handed classroom use on a phone or tablet.

**3. Slide-Up Detail Sheets**
Activity detail views use a slide-up sheet pattern (common in iOS/Android apps) that works naturally on both mobile and desktop. This is a better interaction pattern than modal dialogs for a touch-first use case.

**4. Projector Mode with 4 Themes**
The projector display view (`?projector=1` window) with theme choices (Calm, Bright, Minimal, Primary) is a genuinely valuable and well-executed feature. The ability to match projector aesthetics to classroom culture is a thoughtful teacher-facing decision.

**5. Grade Picker**
The grade band selector (K-2, 3-5, 6-8, 9-12) is present and functional. When set, it filters activity content throughout the app. This is the most important personalization feature in the product.

---

## Issues

---

### Issue 1: No Onboarding or Tutorial Flow

| Property | Detail |
|---|---|
| **Issue** | New users are dropped directly into the Today view with no explanation of how the app works, what the activity categories mean, or how to use the projector |
| **Where found** | App startup flow; `tutorialSeen` localStorage key exists in source code but is never read or used |
| **Severity** | High |
| **Business Impact** | First-session abandonment. Teachers who don't immediately understand the value proposition leave and don't return. |
| **Recommended Fix** | A 3–5 step onboarding modal that runs once: (1) "Here's your daily meeting routine," (2) "Swap any activity," (3) "Open projector mode," (4) "Save your favorite routines." Trigger via `tutorialSeen === false`. |
| **Expected Outcome** | Reduced bounce rate on first session, higher Day 7 retention |

---

### Issue 2: Auth Screen Has Zero Product Context

| Property | Detail |
|---|---|
| **Issue** | The first thing any visitor sees is a login/signup form. There is no app name in large text, no tagline, no screenshot, no "What is this?" explanation. |
| **Where found** | `AuthScreen` component — the entry point for all unauthenticated users |
| **Severity** | Critical |
| **Business Impact** | Zero conversion from cold traffic. Any teacher who doesn't already know the product leaves immediately. |
| **Recommended Fix** | Add a split-screen auth layout: left panel shows product hero (tagline + screenshot/illustration), right panel contains the login/signup form. Or add a "Learn More" link above the form that goes to the landing page. |
| **Expected Outcome** | 10–30% improvement in signup rate from cold traffic |

---

### Issue 3: 1.5MB Load Time

| Property | Detail |
|---|---|
| **Issue** | The entire 1.59MB HTML file must download, decompress, and be Babel-transpiled before any React rendering begins. On a 10 Mbps school network, this can take 3–5 seconds of blank screen. |
| **Where found** | `index.html` (1.59MB) — confirmed file size |
| **Severity** | High |
| **Business Impact** | Teachers on slow school networks will abandon the app before it loads. Core Web Vitals (LCP, FID, CLS) will be very poor, hurting both SEO and user experience. |
| **Recommended Fix** | Replace the custom bundler and in-browser Babel with a proper build pipeline (Vite). The built app with code splitting should load in under 1 second on the same network. |
| **Expected Outcome** | LCP under 2.5s, elimination of blank-screen startup delay, SEO improvement |

---

### Issue 4: Projector Mode Limited to Same Device/Same Browser

| Property | Detail |
|---|---|
| **Issue** | The projector sync uses `localStorage` polling every 1.2 seconds. `localStorage` is scoped to a single browser origin on a single device. The projector window and the control window must be open in the same browser on the same machine. |
| **Where found** | Projector mode implementation in `index.html` source; `?projector=1` URL parameter |
| **Severity** | High |
| **Business Impact** | Many teachers have a dedicated classroom display computer connected to a projector and use a separate personal device to control the lesson. The current implementation does not support this common use case at all. |
| **Recommended Fix** | Replace localStorage polling with a server-sent event (SSE) channel via Firebase Realtime Database or a dedicated socket endpoint. A "room code" system (4-digit code) would allow any device to join the projector session. |
| **Expected Outcome** | Projector mode becomes usable for the majority of classroom setups, turning it into a genuine commercial differentiator |

---

### Issue 5: "My Activities" and "My Routines" Buried in Sub-Navigation

| Property | Detail |
|---|---|
| **Issue** | The Library and Build sections have sub-navigation tabs. "My Activities" and "My Routines" are secondary tabs within those sections, not top-level navigation items. New users rarely discover them. |
| **Where found** | Library sub-views (Library, Word of the Day, Do Now, On This Day, My Activities, Favorites) and Build sub-views (Build, My Routines, My Activities, Routines) |
| **Severity** | Medium |
| **Business Impact** | Custom activities and saved routines are differentiated features. If teachers don't find them, they don't use them. Unused features don't drive retention. |
| **Recommended Fix** | Add empty state cards on the Today view and Library view that promote "Create your first custom activity" and "Save this routine" with direct deep-links. Also surface "My Routines" as a primary navigation item on the sidebar. |
| **Expected Outcome** | Higher feature discovery rate, higher engagement with personalization features |

---

### Issue 6: Grade Picker Not Prominently Featured on First Load

| Property | Detail |
|---|---|
| **Issue** | The grade picker is present in the Today view, but new users don't know they should set it immediately. The app shows content at some default grade level, which may be irrelevant to the teacher's actual class. |
| **Where found** | Today view — grade picker component |
| **Severity** | Medium |
| **Business Impact** | If the first activities a teacher sees are for the wrong grade, they perceive the product as irrelevant and don't return. |
| **Recommended Fix** | Prompt for grade level as step 1 of the onboarding flow (or during signup). Store the selection in the user account, not just as an in-session state. Make the grade badge highly visible on the Today view header. |
| **Expected Outcome** | Higher relevance of first-session content, better first impression |

---

### Issue 7: No Empty States for Library or Routines

| Property | Detail |
|---|---|
| **Issue** | When a teacher has no saved routines, no custom activities, and no favorites, the corresponding views likely show a blank area with no guidance. There is no empty state illustration or "Get started" prompt. |
| **Where found** | My Activities, My Routines, Favorites sub-views |
| **Severity** | Medium |
| **Business Impact** | Empty screens feel broken. Teachers who see a blank "My Routines" tab don't know what to do next and don't explore further. |
| **Recommended Fix** | Design explicit empty state components with an illustration, a short description ("You haven't saved any routines yet"), and a clear call-to-action button ("Build your first routine"). |
| **Expected Outcome** | Higher activation rate for personalization features |

---

### Issue 8: No User-Visible Error State When "On This Day" Fetch Fails

| Property | Detail |
|---|---|
| **Issue** | When the `on-this-day.js` Netlify Function fails (network error, onthisday.com down, or a date not covered by the 13-date fallback), the user sees either nothing or a generic error. There is no friendly error message explaining what happened or offering an alternative. |
| **Where found** | On This Day view, `netlify/functions/on-this-day.js` fallback coverage gap |
| **Severity** | Medium |
| **Business Impact** | Silent failures create distrust. A teacher who opens the On This Day panel and sees nothing will assume the product is broken. |
| **Recommended Fix** | Add an explicit error state: "We couldn't load today's historical facts. Check your connection and try again." with a retry button. Extend the fallback dataset to cover all 365 days. |
| **Expected Outcome** | Reduced perception of brokenness; better offline/degraded-network experience |

---

### Issue 9: Cloud Sync Is Confusing ("What Is a Sync Key?")

| Property | Detail |
|---|---|
| **Issue** | The cloud sync feature requires users to understand what a "sync key" is, why it exists, and how to use it. This is a technical implementation detail that has leaked into the user interface. Most teachers will not understand it and will skip cloud sync entirely. |
| **Where found** | Settings — cloud sync section; `netlify/functions/sync.js` |
| **Severity** | Medium |
| **Business Impact** | Without cloud sync, accounts are device-locked. Teachers who don't use sync will lose their data when switching devices, generating support tickets and churn. |
| **Recommended Fix** | Replace the sync key model entirely with Firebase Auth (proper user accounts). If sync key must remain temporarily, reframe it as "backup passphrase" with a clear "Copy this somewhere safe" prompt at account creation. |
| **Expected Outcome** | Higher cloud sync adoption, lower data-loss support tickets |

---

### Issue 10: No Password Reset Flow

| Property | Detail |
|---|---|
| **Issue** | There is no "Forgot password?" link and no password reset mechanism. If a teacher forgets their password, they have no recovery path. Their account data is permanently inaccessible. |
| **Where found** | Auth screen — login form; `ofd:account` localStorage structure |
| **Severity** | High |
| **Business Impact** | Password reset is table stakes for any product with user accounts. Its absence directly contributes to account abandonment and is a trust signal that the product is not production-grade. |
| **Recommended Fix** | Implement password reset via Firebase Auth's built-in email-based reset flow. This requires migrating to Firebase Auth. Alternatively, add a temporary "Export account data / Reset account" flow in Settings so teachers can at least recover their custom content. |
| **Expected Outcome** | Eliminated account lock-out scenario; improved trust |

---

## Additional UX Observations

- **No feedback on activity swap:** When a teacher swaps an activity in the Today routine, there is no animation or confirmation that the swap happened. A brief card-flip or slide animation would make the action feel more satisfying.
- **Timer activity category exists but behavior is unclear:** One of the 14 activity categories is "Timer." It is not clear from the UX whether this renders an actual countdown timer in projector mode or just a text prompt. If it is just text, this is a missed opportunity.
- **Settings is a modal, not a page:** The Settings panel is implemented as a modal overlay. This limits the amount of configuration that can fit. As the product grows (subscription management, notification preferences, school settings), Settings will need to become a dedicated full-page view.
- **No keyboard navigation:** The app does not appear to support keyboard navigation for power users or accessibility. Tab order and focus management should be audited for WCAG 2.1 AA compliance, which may be required for school district adoption.
