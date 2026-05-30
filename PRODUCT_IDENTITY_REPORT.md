# PRODUCT IDENTITY REPORT — OfTheDay.net

**Date:** 2026-05-30
**Status:** Pre-commercial / Functional MVP

---

## Product Summary

OfTheDay.net is a web-based morning meeting planner designed for K-12 teachers who follow the Responsive Classroom framework. The product automates the daily routine of selecting and displaying morning meeting activities — Greeting, Sharing, Group Activity, and Morning Message — and adds supplementary classroom content tools including a Word of the Day, math/writing Do Now warm-ups, historical On This Day facts, a projector display mode, and a personal activity library.

The app is a single-page React application bundled into a single 1.59MB HTML file (`index.html`), served via Netlify. There is no landing page; users arrive directly at a login/signup screen. All user data is stored in `localStorage` by default, with an optional cloud sync feature backed by Netlify Blobs. There is no payment infrastructure, no pricing page, and no monetization of any kind.

---

## Target Users

**Primary User: The individual classroom teacher (K-12)**

- Teaches in a school using or familiar with Responsive Classroom, PBIS, or structured morning meeting formats
- Spends 10–25 minutes each morning running a class meeting
- Wants to reduce the cognitive overhead of selecting appropriate, grade-level activities daily
- May project meeting content onto a classroom screen or smartboard
- Likely working on a personal device (laptop or tablet), often on a school network with content filtering

**Secondary User: Instructional coaches and department leads**

- May curate routines for a team of teachers
- Would benefit from My Routines and My Activities features once those are more prominently surfaced

**Grade bands supported:** K-2, 3-5, 6-8, 9-12 — the grade picker exists in code and filters activity content accordingly.

**Not currently served:** Students, parents, school IT departments, curriculum directors, district administrators.

---

## Target Buyers

| Buyer Type | Willingness to Pay | Decision Maker | Path to Purchase |
|---|---|---|---|
| Individual teacher (self-pay) | Low-Medium ($5–15/mo) | Themselves | Credit card, direct |
| Individual teacher (school-funded) | Medium | Principal or coach | Requires simple invoice flow |
| School (site license) | High ($150–300/yr) | Principal or curriculum director | Needs admin dashboard (future) |
| District (bulk license) | Very High ($2k–10k/yr) | Curriculum coordinator | Requires procurement compliance, SSO, reporting |

The most realistic early revenue path is individual teacher self-pay at $8–12/month, targeting teachers already familiar with Responsive Classroom. School and district licensing are longer-term plays requiring additional infrastructure.

---

## Core Workflows (as implemented in source code)

**1. Daily Morning Meeting Planning (Today view)**
- Teacher opens app, selects grade band, reviews auto-generated routine
- Routine contains 4 slots: Greeting, Sharing, Group Activity, Morning Message
- Teacher can filter by time available and class energy level
- Individual activities can be swapped using a replacement drawer
- Total meeting duration is calculated and displayed
- This is the core value loop — it works end-to-end

**2. Projector/Display Mode**
- Teacher clicks to open a second browser window at `?projector=1`
- Main window controls which activity is shown; projector window displays it
- Sync via localStorage polling at 1.2-second intervals
- 4 visual themes: Calm, Bright, Minimal, Primary
- Critical limitation: only works in the same browser on the same device

**3. Activity Library**
- 18 base activities in the POOL array
- 14 activity categories: Greeting, Sharing, Group Activity, Morning Message, SEL Prompt, Brain Teaser, Movement Break, Mindfulness, Vocabulary, Math Do Now, Writing Do Now, On This Day, Teacher Note, Timer
- Teachers can create custom activities (My Activities)
- Teachers can star/bookmark activities (Favorites)
- Grade-level filtering applies throughout

**4. Content Tools**
- **Word of the Day**: Fetches from vocabularyninja.co.uk with grade-level filtering
- **Do Now**: Daily math and writing warm-up problems; grade-filtered; teacher-customizable
- **On This Day**: Netlify Function (`netlify/functions/on-this-day.js`) fetches from onthisday.com, content-filters for classroom appropriateness (blocks violence, heavy politics), falls back to hardcoded data — but fallback only covers 13 dates out of 365

**5. Custom Content Creation**
- My Activities: teachers create activities with title, category, prompt/directions
- My Routines: teachers save and reload custom meeting configurations

**6. Cloud Sync**
- Optional sync via `/.netlify/functions/sync`
- User identified by SHA-256(email + syncKey)
- Data stored in Netlify Blobs, up to 750KB payload
- No real server-side auth validation beyond key matching

---

## Current Value Proposition

**Delivered value (confirmed from source code):**
- Eliminates daily decision-making overhead of choosing morning meeting activities
- Provides grade-appropriate content out of the box across 14 categories
- Enables clean projector display without a separate slideshow tool
- Supports teacher customization (custom activities, saved routines) without external tools
- The core loop is strong: open app → see today's routine → display on projector → run the meeting

**What makes it credible:**
- Responsive Classroom alignment is real and visible in the activity structure
- Grade-level filtering is implemented and functional
- Projector mode is a genuine differentiator — no competing free tool does this cleanly
- Content variety across 14 categories is broader than most teacher productivity apps in this niche

**What undermines the value proposition today:**
- There is no page anywhere that communicates this value to a new visitor
- Cold traffic lands on a login form with zero explanation of what the product does

---

## Missing Product Clarity

1. **No landing page.** Cold visitors see a login/signup form with no tagline, no screenshots, no explanation. This is a complete conversion failure for any teacher discovering the app via search or referral.
2. **No pricing signal.** Teachers have no way to understand whether this is free, freemium, or paid.
3. **No onboarding flow.** The code contains a `tutorialSeen` localStorage field that is never used. New users are dropped into the app with no guidance.
4. **No differentiation statement.** There is no messaging explaining why OfTheDay.net is better than a Google Slides deck or a paper planning template.
5. **Device-locked accounts.** Auth is localStorage-only. Teachers who clear their browser or switch devices lose their account entirely unless they have configured cloud sync — which is not explained at signup.
6. **No content depth signal.** With 18 base activities, a teacher cannot tell from the app whether the library will sustain daily use across a 180-day school year.

---

## Monetization Potential

The Responsive Classroom market is real and underserved by digital tools. Estimated US addressable market: 500,000+ teachers trained in Responsive Classroom practices annually.

**Revenue projection at conservative conversion:**
- 0.5% of 500,000 teachers = 2,500 subscribers
- At $9/month = $270,000 ARR from individual teachers alone
- A single school district with 200 schools at $199/year = $39,800 ARR from one contract

**Recommended freemium SaaS model:**

| Tier | Price | Features | Target |
|---|---|---|---|
| Free | $0 | Today view, basic library, 3 saved routines, 1 custom activity | Acquisition / trial |
| Pro Teacher | $9/month or $79/year | Unlimited routines, full library, all content tools, projector mode, cloud sync | Individual teachers |
| School | $199/year | All Pro features, up to 50 teacher seats, admin overview (future) | Building-level buyers |
| District | Custom | All School features, SSO, usage reporting | District curriculum offices |

**Adjacent revenue opportunities:**
- Curated activity packs (SEL-focused, holiday-themed, subject-specific) as one-time add-ons
- PD workshop integration with Responsive Classroom training programs
- White-label or branded routine sets for district curriculum offices

---

## Biggest Product Risks

1. **Device-locked auth is a fatal trust problem.** Teachers will not pay for a tool where data disappears when their browser is cleared or their school IT department reimages their machine. This must be resolved before any monetization attempt.

2. **No landing page means zero organic conversion.** Any SEO effort, word-of-mouth referral, or paid ad campaign lands on a signup wall with no context. The current conversion rate from cold traffic is effectively 0%.

3. **18 base activities will not sustain daily use.** A teacher using this for daily morning meetings will exhaust the variety within 2–4 weeks. Content depth is the primary retention risk at this stage.

4. **Projector mode only works same-device/same-browser.** Many teachers use a dedicated classroom computer for display and a personal device for control. The localStorage polling architecture (`?projector=1` window sync) breaks entirely in this common use case.

5. **External content dependencies introduce silent failure modes.** Both vocabularyninja.co.uk and onthisday.com are third-party URLs with no API contracts, no SLAs, and no fallback parity. Either can change or disappear at any time.

6. **The custom bundler makes the product unmaintainable.** Adding a single activity or fixing a bug requires understanding and modifying a non-standard, undocumented gzip+base64 compression format inside a 1.59MB HTML file. This is a developer productivity and quality-assurance blocker.
