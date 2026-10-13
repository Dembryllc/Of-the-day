// First-touch acquisition source, so a signup or resource-pack email can be
// traced back to where the teacher came from (e.g. a Pinterest pin).
//
// Stays in the browser until the teacher signs up or submits the capture form;
// then it is saved on their own users/{uid} doc or their waitlist doc.
// Nothing is sent anywhere on its own, so it is safe to run on every page,
// including /demo.
const KEY = 'ofd:attribution';
const UTM_FIELDS = ['source', 'medium', 'campaign', 'content'];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function captureAttribution() {
  if (read()) return; // first touch wins
  let entry = null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('utm_source')) {
      entry = {};
      for (const f of UTM_FIELDS) {
        const v = params.get(`utm_${f}`);
        if (v) entry[f] = v.slice(0, 100);
      }
    } else if (/(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/i.test(document.referrer ? new URL(document.referrer).hostname : '')) {
      // Untagged pin (or a repin by someone else) still counts as Pinterest.
      entry = { source: 'pinterest', medium: 'referral' };
    }
    if (!entry) return;
    entry.landingPath = window.location.pathname.slice(0, 100);
    entry.firstSeenAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // storage blocked or bad referrer URL: attribution is best-effort
  }
}

export function getAttribution() {
  return read();
}

// Runs once at module load. main.jsx imports this before App, so it runs
// before anything else on the page can fail.
captureAttribution();
