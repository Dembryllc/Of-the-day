import { Link, Navigate, useParams } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { useSeo } from './lib/seo';
import { ROUTE_META } from './lib/routes';
import { BlogLink } from './lib/blog';
import './landing.css';

// Public marketing pages: /vs/:rival and /changelog. They reuse the landing
// page's nav, footer and legal-page typography. HeyCatch tracking covers them
// through MARKETING_PATHS in src/lib/routes.js (marketing pages only).

function usePageChrome() {
  useLayoutEffect(() => {
    const prev = [document.body.style.overflow, document.body.style.background, document.body.style.height, document.documentElement.style.height];
    document.body.style.overflow = 'auto';
    document.body.style.background = '#fff';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    return () => {
      [document.body.style.overflow, document.body.style.background, document.body.style.height, document.documentElement.style.height] = prev;
    };
  }, []);
}

export function Shell({ children }) {
  usePageChrome();
  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/assets/ofthedaylogi.png" alt="OfTheDay" className="nav-logo-img" />
          </a>
          <div className="nav-actions">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/login?signup=1" className="btn-primary">Try It Free</Link>
          </div>
        </div>
      </nav>
      {children}
      <footer className="footer">
        <div className="footer-logo">of<span>·</span>the<span>·</span>day</div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/district">For Districts</Link>
          <BlogLink />
          <Link to="/changelog">Changelog</Link>
          <Link to="/vs/nearpod">vs Nearpod</Link>
          <Link to="/vs/simple-mondays">vs Simple Mondays</Link>
          <Link to="/vs/google-slides">vs Google Slides</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <div className="footer-copy">© 2026 OfTheDay.net · Built for teachers who love their mornings.</div>
      </footer>
    </div>
  );
}

/* ───────────── /vs/:rival ───────────── */

// Rival facts are limited to what each company publishes on its own site,
// and every page says to check theirs. Do not add a claim about a rival that
// cannot be read on its public site. Last checked: October 2026.
const OFD_ROWS = {
  job: 'A fresh four-part Morning Meeting for your grade band every day: Greeting, Sharing, Group Activity, Morning Message.',
  price: 'Free plan (5 AI lesson slides a month). Pro is $79 a year or $9 a month. Schools pay the same price per teacher and can buy by purchase order.',
  students: 'No. Students never log in and we collect no student data.',
};

const VS = {
  nearpod: {
    name: 'Nearpod',
    h1: 'OfTheDay vs Nearpod',
    lead: 'Nearpod is a platform for interactive lessons that students join on their own devices. OfTheDay does one narrower job: it builds your Morning Meeting each day. They overlap less than the names suggest, and many teachers could reasonably use both.',
    short: [
      'Pick Nearpod if you want a large lesson library, live student responses on their devices, and a tool your school or district can roll out to everyone.',
      'Pick OfTheDay if the part of your day you keep rebuilding is the first ten minutes: the greeting, the sharing prompt, the group activity and the morning message.',
    ],
    rows: [
      ['What it is', 'An interactive lesson platform for teachers and administrators.'],
      ['What it costs', 'A free tier plus paid tiers. At the time we checked (October 2026) its public pricing page listed Gold at $159 a year and Platinum at $397 a year, plus school licenses. Check their site for today’s prices.'],
      ['Do students log in?', 'Students join lessons on their own devices.'],
    ],
    rivalFits: [
      'You want full lessons with polls, quizzes and live student responses.',
      'Your school wants one platform with district-level setup and support.',
      'You need a big library of ready-made content across subjects, not just a morning routine.',
    ],
    ofdFits: [
      'You run a daily Morning Meeting and are tired of finding something new for it.',
      'You want something that works with no student accounts and no student data.',
      'You want to pay for it yourself at $79 a year, or stay on the free plan.',
    ],
  },
  'simple-mondays': {
    name: 'Simple Mondays',
    h1: 'OfTheDay vs Simple Mondays',
    lead: 'Simple Mondays presents itself as an AI helper that cuts down teacher planning and burnout. OfTheDay is narrower: it hands you the same four-part Morning Meeting structure every day, filled with fresh activities for your grade band. One is a general planning helper; the other is one daily routine, done.',
    short: [
      'Pick Simple Mondays if you want help planning many kinds of work across your week, not just the morning.',
      'Pick OfTheDay if you want to open one page and have today’s Morning Meeting ready, with the structure already there.',
    ],
    rows: [
      ['What it is', 'An AI planning helper for K-12 teachers, as described on its own site.'],
      ['What it costs', 'We could not find prices on the pages we read in October 2026. Check their site.'],
      ['Do students log in?', 'Check their site. OfTheDay is the one we can speak for: no.'],
    ],
    rivalFits: [
      'You want an AI helper for planning in general, across the whole week.',
      'You like to describe what you need and have a tool draft it.',
    ],
    ofdFits: [
      'You already know the Morning Meeting parts you want and just need a fresh set each day.',
      'You want a routine that is the same shape every day, so students know what to expect.',
      'You want a free plan to start with and no credit card.',
    ],
  },
  'google-slides': {
    name: 'a Google Slides deck you build yourself',
    h1: 'OfTheDay vs building your Morning Meeting in Google Slides',
    lead: 'Plenty of teachers run Morning Meeting from a Google Slides deck they made themselves, and it works. The cost is the time: the deck is yours to rebuild every few weeks. Here is when that trade is worth it and when it is not.',
    short: [
      'Stay with your own deck if you have one that works, you enjoy building it, and your students respond to it.',
      'Try OfTheDay if you are repeating the same slides by November and would rather spend that time elsewhere. You can still open our lesson slides in Google Slides: they export as .pptx files.',
    ],
    rows: [
      ['What it is', 'A blank deck you design, fill and reuse. Free with a Google account.'],
      ['What it costs', 'Nothing, plus your own time to build and refresh it.'],
      ['Do students log in?', 'No, unless you share the deck with them.'],
    ],
    rivalFits: [
      'You want full control over the look, wording and order of every slide.',
      'Your team shares one deck and edits it together.',
      'You already have a deck that works and rarely needs changes.',
    ],
    ofdFits: [
      'You are running low on fresh greetings, sharing prompts and group activities.',
      'You want the day’s meeting built for your grade band without making slides.',
      'You want to project a clean routine without formatting anything.',
    ],
  },
};

export function VsPage() {
  const { rival } = useParams();
  const page = VS[rival];
  const path = `/vs/${rival}`;
  useSeo({ ...(ROUTE_META[path] || ROUTE_META['/']), path });
  if (!page) return <Navigate to="/" replace />;
  return (
    <Shell>
      <main className="lp-legal-page" style={{ maxWidth: 760 }}>
        <h1>{page.h1}</h1>
        <p className="vs-lead">{page.lead}</p>

        <h2>The short version</h2>
        <ul>{page.short.map(t => <li key={t}>{t}</li>)}</ul>

        <h2>Side by side</h2>
        <div className="vs-compare">
          {[['What it is', OFD_ROWS.job, page.rows[0][1]], ['What it costs', OFD_ROWS.price, page.rows[1][1]], ['Do students log in?', OFD_ROWS.students, page.rows[2][1]]].map(([label, ofd, rival]) => (
            <div className="vs-row" key={label}>
              <h3>{label}</h3>
              <p><strong>OfTheDay:</strong> {ofd}</p>
              <p><strong>{page.name.replace(/^a /, '')}:</strong> {rival}</p>
            </div>
          ))}
        </div>

        <h2>When {page.name} is the better fit</h2>
        <ul>{page.rivalFits.map(t => <li key={t}>{t}</li>)}</ul>

        <h2>When OfTheDay is the better fit</h2>
        <ul>{page.ofdFits.map(t => <li key={t}>{t}</li>)}</ul>

        <p className="vs-note">We wrote this ourselves, so read it with that in mind. What we say about other products comes from what they publish and may be out of date. Prices checked October 2026.</p>

        <p><Link to="/login?signup=1" className="btn-primary-lg" style={{ display: 'inline-block' }}>Try It Free — No Credit Card</Link></p>
        <p><Link to="/demo">Or open the live demo</Link> · <Link to="/">Back to the homepage</Link></p>
      </main>
    </Shell>
  );
}

/* ───────────── /changelog ───────────── */

// Newest first. Every entry is a real change from the repo's commit history
// (git log), written for teachers. Add new entries at the top with the date
// the change went live.
const CHANGES = [
  { date: '2026-10-13', items: [
    'The free plan’s limit of 5 AI lesson slides a month is now counted on our server, so it applies the same way for every free account. Pro stays unlimited.',
    'We added traffic stats to our public pages only (the homepage, pricing, district and legal pages). They are never loaded on signed-in screens, and they carry no teacher names or emails.',
  ] },
  { date: '2026-10-07', items: [
    'PowerPoint and Google Slides exports now fill the whole slide. They used to use only about three-quarters of it.',
  ] },
  { date: '2026-09-18', items: [
    'The Today screen now opens on your routine. The sales text that used to sit above it is gone.',
    'Library cards open a panel that shows the directions and prompt before you pick an activity.',
    'The routine builder lets you search, add, arrange and read activities without leaving the screen.',
    'Fixed grade filtering for teachers who pick a single grade, and added more variety to the daily routine.',
    'Word of the Day, Do Now and the other extras now have a back button that says where it goes.',
  ] },
  { date: '2026-08-27', items: [
    'Projected lesson slides use larger text so they are readable from the back of the room.',
  ] },
  { date: '2026-08-25', items: [
    'You can manage or cancel your subscription from your profile.',
    'Fixed a bug that could have left a new Pro subscriber on the Free plan after paying. We found it in our own test, before any customer was affected.',
  ] },
  { date: '2026-08-08', items: [
    'The free Morning Meeting Resource Pack is sent by email from OfTheDay, with a download link for the printable PDF.',
  ] },
  { date: '2026-07-07', items: [
    'Homepage rebuilt around the Morning Meeting, with the AI lesson slide maker as the second tool.',
    'Shortcuts to Word of the Day, Do Now and On This Day now show on the Today screen.',
  ] },
  { date: '2026-07-02', items: [
    'Phone fixes: the main sign-up button now shows in the menu, and the menu button is a full-size tap target.',
  ] },
  { date: '2026-06-29', items: [
    'Lesson slides export to PowerPoint, and open in Google Slides.',
  ] },
  { date: '2026-06-23', items: [
    'Added a live demo you can open without an account.',
  ] },
];

const longDate = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export function ChangelogPage() {
  useSeo({ ...ROUTE_META['/changelog'], path: '/changelog' });
  return (
    <Shell>
      <main className="lp-legal-page" style={{ maxWidth: 760 }}>
        <h1>Changelog</h1>
        <p className="vs-lead">What we changed in OfTheDay and when, newest first.</p>
        {CHANGES.map(c => (
          <section key={c.date}>
            <h2><time dateTime={c.date}>{longDate(c.date)}</time></h2>
            <ul>{c.items.map(t => <li key={t}>{t}</li>)}</ul>
          </section>
        ))}
        <p><Link to="/">Back to the homepage</Link></p>
      </main>
    </Shell>
  );
}
