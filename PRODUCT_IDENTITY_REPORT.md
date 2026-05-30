# Product Identity Report — OfTheDay.net

**Date:** 2026-05-30
**Status:** Pre-commercial. Functional product, no monetization infrastructure.

---

## Product Summary

OfTheDay.net is a web-based morning meeting planner built specifically for teachers using the Responsive Classroom framework. The app generates a daily structured meeting routine composed of four activity slots — Greeting, Sharing, Group Activity, and Morning Message — drawn from a curated library of classroom-appropriate activities. Teachers can filter by grade level (K–2, 3–5, 6–8, 9–12), time constraints, and energy level. A projector mode allows the teacher to display the current activity on a classroom screen while managing the flow from their own device.

The app lives entirely inside a single 1.59MB HTML file (`index.html`). All React source code is compressed and base64-encoded into a custom bundler format. There is no npm build step. The product is functional but not commercially packaged.

---

## Target Users

**Primary:** K–12 classroom teachers, particularly those familiar with or practicing the Responsive Classroom morning meeting model. This is a niche but well-defined audience. Responsive Classroom is widely adopted in US elementary and middle schools.

**Secondary:** Instructional coaches and school administrators who manage teacher professional development around morning meeting culture.

**Not currently addressed:** Students, parents, school IT departments, curriculum directors.

---

## Target Buyers

- **Individual teachers** purchasing a personal subscription ($8–15/month or $79–99/year is market-appropriate for teacher tools).
- **Schools** purchasing a site license for all teachers in a building (~$199–499/year).
- **Districts** purchasing a district license for all schools (enterprise pricing, $2,000–10,000/year depending on size).

Currently, none of these buyer tiers exist. There is no pricing page, no payment flow, and no account infrastructure that could support licensing.

---

## Core Workflows

All workflows confirmed from source code analysis:

1. **Daily Meeting Planning**: Teacher opens app, selects grade band, reviews auto-generated routine. Can swap individual activities using a replacement drawer. Total estimated meeting duration is displayed.

2. **Projector Display**: Teacher clicks "Projector" to open a second browser window with a full-screen activity display. Teacher-facing controls stay on the main window. Projector window syncs via localStorage polling (every 1.2 seconds). Four visual themes available: Calm, Bright, Minimal, Primary.

3. **Activity Library**: Browse 14 activity categories including SEL Prompt, Brain Teaser, Movement Break, Mindfulness, Vocabulary, Math Do Now, Writing Do Now, On This Day, and Teacher Note. Grade filtering available throughout.

4. **Content Tools**:
   - Word of the Day: Pulled from vocabularyninja.co.uk with grade filtering
   - Do Now: Daily math and writing warm-up problems, grade-level filtered
   - On This Day: Historical facts fetched via Netlify Function from onthisday.com, filtered to remove violent or heavy political content

5. **Custom Content Creation**: Teachers can create My Activities (custom activity cards) and My Routines (saved routine sequences).

6. **Cloud Sync**: Optional sync via `/.netlify/functions/sync`. User identified by SHA-256(email + syncKey). Data stored in Netlify Blobs up to 750KB.

---

## Current Value Proposition

The app saves teachers the 10–20 minutes of daily prep time required to assemble a Responsive Classroom morning meeting from scratch. It provides grade-appropriate content, handles timing, and solves the classroom display problem via projector mode. For teachers who run daily morning meetings, this is a genuine daily-use utility.

The core loop is strong: open app, see today's routine, display it on the projector, run the meeting. This is a credible, useful product.

---

## Missing Product Clarity

- **No landing page.** Cold visitors see a login/signup form with no explanation of what the product does. This is a complete conversion failure for any teacher discovering the app via search or referral.
- **No pricing signal.** Teachers have no way to understand whether this is free, freemium, or paid.
- **No onboarding.** A `tutorialSeen` field exists in the codebase but is unused. New users are dropped into the app with no guidance.
- **No differentiation statement.** There is no messaging explaining why OfTheDay.net is better than a Google Slides deck or a paper planning template.
- **Device-locked accounts.** Because auth is localStorage-only, teachers who clear their browser or switch devices lose their account entirely. This is a fatal trust problem for a paid product.

---

## Monetization Potential

The Responsive Classroom market is real and underserved by digital tools. Estimated US market: 500,000+ teachers trained in Responsive Classroom practices. Even 0.5% conversion at $9/month = $270,000 ARR.

**Recommended pricing model:**
- **Free tier**: 3 saved routines, basic activity library, no cloud sync
- **Pro tier**: $9/month or $79/year per teacher — unlimited routines, full library, cloud sync, projector mode
- **School tier**: $199/year per school — all teachers, admin dashboard (future)
- **District tier**: Custom pricing

---

## Biggest Product Risks

1. **Device-locked auth destroys retention.** Teachers will not pay for a tool they can lose when their browser updates or IT wipes their workstation.
2. **No landing page means zero organic conversion.** Any SEO or social traffic hits a signup wall with no context.
3. **18 base activities is a thin library.** A teacher who exhausts the variety within two weeks will churn.
4. **Projector mode only works same-device/same-browser.** Teachers with a dedicated classroom display connected to a different machine cannot use this feature.
5. **External content dependencies.** Both vocabularyninja.co.uk and onthisday.com are third-party URLs with no SLA. A single outage breaks core features with no user-visible fallback.
6. **The custom bundler makes the product unmaintainable.** Adding a single activity requires understanding and modifying a non-standard, undocumented compression format.
