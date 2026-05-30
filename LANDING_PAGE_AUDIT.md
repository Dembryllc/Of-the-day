# LANDING PAGE AUDIT — OfTheDay.net

**Date:** 2026-05-30
**Status:** CRITICAL GAP. No landing page exists.

---

## Current State

**There is no landing page.** Zero. A visitor who navigates to OfTheDay.net sees a login/signup form — and nothing else. There is no tagline, no product description, no screenshot, no feature list, no social proof, no pricing signal, and no reason for a first-time visitor to create an account.

This is the single largest conversion failure in the product. Every teacher who discovers OfTheDay.net through a web search, a Pinterest pin, a Twitter/X post, a colleague recommendation, or a direct link from a blog post lands on an authentication wall with no context. The expected conversion rate from cold traffic in this state is approximately 0%.

The app itself is genuinely useful. The landing page problem is not a product problem — it is a marketing and presentation problem. It can be fixed entirely in the frontend without changing any backend or core app code.

---

## Impact of Missing Landing Page

| Channel | Without Landing Page | With Landing Page |
|---|---|---|
| Google organic search | Users bounce immediately on unfamiliar signup form | Users understand value → 5-15% conversion to trial |
| Word-of-mouth referral | Colleagues send link, recipient confused, doesn't convert | Recipient sees product, converts at 20-30% |
| Paid ads (future) | Every ad dollar goes to a signup wall → near-zero ROAS | Visitors see proposition before committing → positive ROAS possible |
| Email campaigns (future) | CTA links land on login form | CTA links land on converting page |
| Social sharing | Screenshots of login form shared, no context | Hero + screenshots shared, drives interest |
| SEO | Page has no indexable content, no keywords, no structured data | Full SEO surface area: title, description, headings, schema |

---

## Proposed Landing Page Structure

The landing page should be a separate HTML page or React route that loads before the auth wall. It should answer three questions within 5 seconds: What is this? Who is it for? Why should I care?

---

### Section 1: Navigation Bar

- Logo: OfTheDay.net
- Links: Features, How It Works, Pricing, FAQ
- CTA button: "Try It Free" → scrolls to signup or goes to `/app`
- Secondary link: "Sign In" for returning users

---

### Section 2: Hero

**Purpose:** Communicate the core value in one sentence. Get the teacher to keep reading.

**Tagline options (A/B test these):**

- "Your Morning Meeting, Ready in Seconds."
- "The Daily Routine Planner Built for Responsive Classroom Teachers."
- "Stop Reinventing Your Morning Meeting Every Day."
- "Grade-Ready Morning Meeting Activities — Every Single Day."

**Sub-headline (below tagline):**
"OfTheDay.net automatically builds your daily Greeting, Sharing, Group Activity, and Morning Message from a library of grade-appropriate activities. Open it at 8am and you're ready."

**Hero CTA:** "Try It Free — No Credit Card Required"

**Hero visual:** A clean screenshot or animated mockup of the Today view with activities populated. This single image does more to explain the product than any paragraph of text.

---

### Section 3: The Problem

**Purpose:** Build empathy with the teacher before pitching the solution.

**Copy direction:**
> "Every morning before school, thousands of teachers are scrambling. Searching Pinterest for a new greeting activity. Googling 'responsive classroom morning meeting ideas.' Reusing the same circle activity they've used for three weeks because there's no time to think.
>
> Morning meetings are the most important 15 minutes of the school day. But preparing them shouldn't eat into your planning time every single day."

---

### Section 4: The Solution

**Purpose:** Position OfTheDay.net as the answer to the problem just described.

**Copy direction:**
> "OfTheDay.net generates a complete, grade-appropriate morning meeting routine every day — automatically. Greeting, Sharing, Group Activity, and Morning Message, selected from a library of activities built for Responsive Classroom teachers.
>
> Open the app. See your meeting. Run your meeting. Done."

**Supporting visual:** Side-by-side comparison or before/after: "Without OfTheDay: 20 minutes of searching. With OfTheDay: Open your laptop."

---

### Section 5: How It Works

**Purpose:** Remove mystery. Show the 3-step flow with simple icons or screenshots.

**Steps:**
1. **Choose your grade level.** K-2, 3-5, 6-8, or 9-12. The app filters everything to match your students.
2. **See today's meeting.** A complete routine is ready the moment you open the app. Swap any activity with one tap if you want a change.
3. **Display on your projector.** One click opens a full-screen display view. Four visual themes to match your classroom vibe.

---

### Section 6: Features

**Purpose:** Give detail-oriented buyers the specifics they want.

**Feature grid (6 cards):**

1. **Daily Routine Builder** — Automatic Greeting, Sharing, Group Activity, Morning Message. Filters by grade, time, and class energy.
2. **Projector Mode** — One-click full-screen display view with 4 themes (Calm, Bright, Minimal, Primary). No Google Slides needed.
3. **Word of the Day** — Grade-level vocabulary words, ready every morning.
4. **Do Now Warm-Ups** — Daily math and writing warm-up problems by grade band. Toggle between subjects.
5. **On This Day** — Historical classroom facts for the current date, automatically filtered for age-appropriateness.
6. **My Activities + My Routines** — Build your own activities and save your favorite routine combinations.

---

### Section 7: Use Cases

**Purpose:** Help teachers self-identify and see themselves using the product.

**3 use case cards:**

1. **The elementary teacher who runs Responsive Classroom daily.** "I use it every single morning. The projector mode is the best part — my kids walk in and see the greeting activity on the board before I even have my coffee."
2. **The middle school teacher who wants structure without the prep.** "I needed something that didn't require 20 minutes to set up. This takes 30 seconds."
3. **The new teacher who doesn't know where to start.** "I had no idea how to run a morning meeting. This gave me a starting point and I learned what works for my class."

---

### Section 8: Who It's For

**Purpose:** Qualify visitors. Let unfit visitors self-select out efficiently.

**Copy direction:**
> "OfTheDay.net is built for K-12 teachers who run morning meetings — especially those familiar with Responsive Classroom, PBIS, or SEL-first classroom cultures. It works best for teachers who want a consistent daily routine without spending prep time building it from scratch."

**Grade levels:** K-2, 3-5, 6-8, 9-12 (all supported)

---

### Section 9: Pricing Preview

**Purpose:** Set expectations before the signup form. Remove the "is this free?" question.

**Simple three-column pricing table:**

| Free | Pro Teacher — $9/mo | School — $199/yr |
|---|---|---|
| Today view | Everything in Free | Everything in Pro |
| Basic activity library | Full activity library | Up to 50 teacher accounts |
| 3 saved routines | Unlimited routines | School-branded templates (soon) |
| 1 custom activity | Unlimited custom activities | |
| | Projector mode | |
| | Cloud sync (all devices) | |
| | Word of the Day, Do Now, On This Day | |

**Primary CTA:** "Start Free" — no credit card required.

---

### Section 10: FAQ

Anticipated teacher questions:

1. **Is there a free plan?** Yes. The free plan includes the daily routine view and basic activity library.
2. **Does it work on a Chromebook?** Yes. OfTheDay.net is a web app that works in any modern browser.
3. **Can I use it with my classroom projector?** Yes. Pro includes a dedicated projector view that runs in a second browser window.
4. **What grade levels are supported?** K-2, 3-5, 6-8, and 9-12.
5. **Does my school need to purchase it?** Individual teachers can subscribe directly. School and district licensing is available.
6. **Is this specifically for Responsive Classroom?** It's built with Responsive Classroom structure in mind, but the activities work for any morning meeting format.
7. **What happens to my data if I cancel?** Your routines and custom activities are yours. You can export them (future feature).

---

### Section 11: Final CTA

**Purpose:** Close the page with a low-friction call to action.

> "Join thousands of teachers who start their day with OfTheDay.net."
> [Start Free — No Credit Card Required]
> or
> "Already have an account? Sign In."

---

## SEO Recommendations

### Title Tag

```
OfTheDay.net — Morning Meeting Planner for Responsive Classroom Teachers
```

### Meta Description

```
Automatically generate grade-appropriate morning meeting routines every day. Greeting, Sharing, Group Activity, and Morning Message — ready in seconds. Built for K-12 Responsive Classroom teachers.
```

### Open Graph Tags

```html
<meta property="og:title" content="OfTheDay.net — Morning Meeting Planner for Teachers" />
<meta property="og:description" content="Stop prepping your morning meeting from scratch every day. OfTheDay.net builds a complete K-12 routine automatically." />
<meta property="og:image" content="https://oftheday.net/assets/og-preview.png" />
<meta property="og:url" content="https://oftheday.net" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### Schema Markup (Education Software)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "OfTheDay.net",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "description": "Morning meeting planner for K-12 teachers using Responsive Classroom. Automatically generates daily Greeting, Sharing, Group Activity, and Morning Message activities.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free tier available"
  },
  "audience": {
    "@type": "EducationalAudience",
    "educationalRole": "teacher"
  }
}
```

### Target Keywords

- "responsive classroom morning meeting planner"
- "morning meeting activities K-12"
- "daily morning meeting routine teacher"
- "responsive classroom greeting activities"
- "morning meeting projector display"
- "morning meeting do now activities"

### Technical SEO Notes

- The current `index.html` contains no indexable text content visible to crawlers (all content is inside the React bundle)
- The landing page must be statically rendered HTML (not inside the React bundle) for SEO to work
- Add a sitemap at `/sitemap.xml` once the landing page is live
- Add `robots.txt` explicitly allowing the landing page and disallowing `/app/*`
