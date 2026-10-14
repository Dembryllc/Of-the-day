// Public marketing routes: one source for page metadata. Used by the pages
// themselves (useSeo), by vite.config.js (static per-route HTML) and, for the
// path list, by the HeyCatch marketing-only filter.
export const ROUTE_META = {
  '/': {
    title: 'OfTheDay.net — Morning Meeting Planner for K-12 Teachers',
    description: 'Automatically generate grade-appropriate morning meeting routines every day. Greeting, Sharing, Group Activity, and Morning Message — ready in seconds. Built for K-12 Responsive Classroom teachers.',
  },
  '/district': {
    title: 'OfTheDay for Schools and Districts — Pricing, Privacy, DPA',
    description: 'School and district licensing for OfTheDay.net: one invoice, up to 50 teacher accounts per school license, no student data collected, and a Data Privacy Agreement on request.',
  },
  '/privacy': {
    title: 'Privacy Policy — OfTheDay.net',
    description: 'What OfTheDay.net collects from teachers, what it never collects from students, and how to ask us to delete your data.',
  },
  '/terms': {
    title: 'Terms of Service — OfTheDay.net',
    description: 'The terms for using OfTheDay.net, the morning meeting planner for K-12 teachers.',
  },
  '/changelog': {
    title: 'OfTheDay Changelog — What We Changed and When',
    description: 'A dated list of changes to OfTheDay.net: new features, fixes and plan changes, newest first.',
  },
  '/vs/nearpod': {
    title: 'OfTheDay vs Nearpod — Which Fits a Morning Meeting?',
    description: 'An honest comparison of OfTheDay and Nearpod for K-12 teachers: what each is built for, what each costs, and when to pick the other one.',
  },
  '/vs/simple-mondays': {
    title: 'OfTheDay vs Simple Mondays — Morning Meeting vs AI Planning',
    description: 'How OfTheDay (a daily four-part Morning Meeting) differs from Simple Mondays (AI teacher planning), and who each one fits better.',
  },
  '/vs/google-slides': {
    title: 'OfTheDay vs Building Morning Meeting Slides in Google Slides',
    description: 'Is a do-it-yourself Google Slides morning meeting worth it, or is a daily generated routine? What you gain, what you give up, and when DIY is the better call.',
  },
};

export const MARKETING_PATHS = Object.keys(ROUTE_META);
