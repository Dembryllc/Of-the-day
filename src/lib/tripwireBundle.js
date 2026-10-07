// The "10-Day Morning Meeting Bank" tripwire bundle: a fixed, deterministic
// sequence of 10 full Morning Meeting decks (Greeting + Sharing + Group
// Activity + Morning Message), built from whatever is currently in the
// activity library.
//
// Group Activity and Morning Message are the thin categories (as few as 4
// total activities each — see CLAUDE.md's "Routine Variety" notes), so this
// deliberately does NOT try to guarantee 10 unique activities per category.
// Instead it cycles each category's pool with `day % pool.length`, which
// guarantees an activity never repeats on two *consecutive* days as long as
// the pool has 2+ items, while still being honest that a pool of 4 will
// repeat every 4th day. The bundle's own copy discloses this — see
// TripwireBankScreen.jsx — rather than promising zero repeats the library
// can't back up.

export const TRIPWIRE_BUNDLE_DAYS = 10;

const SLOTS = ["Greeting", "Sharing", "Group Activity", "Morning Message"];

// Small per-category offsets so Group Activity and Morning Message don't
// land on the exact same point in their (identically-sized) cycles on the
// same day — purely cosmetic variety, not load-bearing for correctness.
const SLOT_OFFSET = { "Greeting": 0, "Sharing": 0, "Group Activity": 0, "Morning Message": 1 };

export function buildTripwireBundle(activities) {
  const byCat = {};
  for (const cat of SLOTS) {
    byCat[cat] = activities.filter(a => a.cat === cat);
  }

  const days = [];
  for (let day = 0; day < TRIPWIRE_BUNDLE_DAYS; day++) {
    const deck = { day: day + 1 };
    for (const cat of SLOTS) {
      const pool = byCat[cat];
      deck[cat] = pool.length ? pool[(day + SLOT_OFFSET[cat]) % pool.length] : null;
    }
    days.push(deck);
  }
  return days;
}

export function tripwireDeckActivities(deck) {
  return SLOTS.map(cat => deck[cat]).filter(Boolean);
}
