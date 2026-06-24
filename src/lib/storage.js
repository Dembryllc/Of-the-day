// Pure localStorage helpers — no side effects, no imports required.

export function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
}

// ── Seen activities ────────────────────────────────────────────────────────────

export function readSeenActivities() {
  try {
    const raw = localStorage.getItem('ofd:seenActivities');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function markActivitiesSeen(ids) {
  try {
    const existing = readSeenActivities();
    ids.forEach(id => existing.add(id));
    localStorage.setItem('ofd:seenActivities', JSON.stringify([...existing]));
  } catch {}
}

// ── Used today ─────────────────────────────────────────────────────────────────

export function readUsedToday() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem('ofd:usedToday');
    const obj = raw ? JSON.parse(raw) : {};
    return new Set(obj.date === today ? (obj.ids || []) : []);
  } catch { return new Set(); }
}

export function recordUsedToday(ids) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem('ofd:usedToday');
    const obj = raw ? JSON.parse(raw) : {};
    const existing = new Set(obj.date === today ? (obj.ids || []) : []);
    ids.forEach(id => existing.add(id));
    localStorage.setItem('ofd:usedToday', JSON.stringify({ date: today, ids: [...existing] }));
  } catch {}
}

// ── Used this week ─────────────────────────────────────────────────────────────

export function readUsedThisWeek() {
  const weekStart = getWeekStart();
  try {
    const raw = localStorage.getItem('ofd:usedThisWeek');
    const obj = raw ? JSON.parse(raw) : {};
    return new Set(obj.weekStart === weekStart ? (obj.ids || []) : []);
  } catch { return new Set(); }
}

export function recordUsedThisWeek(ids) {
  const weekStart = getWeekStart();
  try {
    const raw = localStorage.getItem('ofd:usedThisWeek');
    const obj = raw ? JSON.parse(raw) : {};
    const existing = new Set(obj.weekStart === weekStart ? (obj.ids || []) : []);
    ids.forEach(id => existing.add(id));
    localStorage.setItem('ofd:usedThisWeek', JSON.stringify({ weekStart, ids: [...existing] }));
  } catch {}
}
