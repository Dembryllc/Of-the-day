import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readSeenActivities,
  markActivitiesSeen,
  readUsedToday,
  recordUsedToday,
  readUsedThisWeek,
  recordUsedThisWeek,
  getWeekStart,
} from '../storage';

// jsdom provides localStorage; clear before each test

beforeEach(() => {
  localStorage.clear();
});

// ── readSeenActivities / markActivitiesSeen ────────────────────────────────────

describe('readSeenActivities', () => {
  it('returns an empty Set when nothing is stored', () => {
    const result = readSeenActivities();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns stored activity IDs as a Set', () => {
    localStorage.setItem('ofd:seenActivities', JSON.stringify([1, 2, 3]));
    const result = readSeenActivities();
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.size).toBe(3);
  });

  it('returns empty Set when stored JSON is corrupt', () => {
    localStorage.setItem('ofd:seenActivities', 'not-json');
    const result = readSeenActivities();
    expect(result.size).toBe(0);
  });
});

describe('markActivitiesSeen', () => {
  it('persists new IDs', () => {
    markActivitiesSeen([10, 20]);
    const result = readSeenActivities();
    expect(result.has(10)).toBe(true);
    expect(result.has(20)).toBe(true);
  });

  it('merges with existing seen IDs', () => {
    localStorage.setItem('ofd:seenActivities', JSON.stringify([1, 2]));
    markActivitiesSeen([3, 4]);
    const result = readSeenActivities();
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.size).toBe(4);
  });

  it('does not duplicate IDs already present', () => {
    markActivitiesSeen([5]);
    markActivitiesSeen([5]);
    const result = readSeenActivities();
    expect(result.size).toBe(1);
  });

  it('handles an empty array without error', () => {
    expect(() => markActivitiesSeen([])).not.toThrow();
  });
});

// ── readUsedToday / recordUsedToday ────────────────────────────────────────────

describe('readUsedToday', () => {
  it('returns empty Set when nothing is stored', () => {
    const result = readUsedToday();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns IDs for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('ofd:usedToday', JSON.stringify({ date: today, ids: [7, 8] }));
    const result = readUsedToday();
    expect(result.has(7)).toBe(true);
    expect(result.has(8)).toBe(true);
  });

  it('returns empty Set when stored date is not today (stale data)', () => {
    localStorage.setItem('ofd:usedToday', JSON.stringify({ date: '2000-01-01', ids: [99] }));
    const result = readUsedToday();
    expect(result.size).toBe(0);
  });

  it('returns empty Set when stored JSON is corrupt', () => {
    localStorage.setItem('ofd:usedToday', 'bad-json');
    expect(readUsedToday().size).toBe(0);
  });
});

describe('recordUsedToday', () => {
  it('stores IDs under today\'s date', () => {
    recordUsedToday([1, 2, 3]);
    const today = new Date().toISOString().slice(0, 10);
    const raw = JSON.parse(localStorage.getItem('ofd:usedToday'));
    expect(raw.date).toBe(today);
    expect(raw.ids).toContain(1);
    expect(raw.ids).toContain(3);
  });

  it('merges with existing today IDs', () => {
    recordUsedToday([1]);
    recordUsedToday([2]);
    const result = readUsedToday();
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
  });

  it('does not duplicate IDs', () => {
    recordUsedToday([5, 5]);
    recordUsedToday([5]);
    const result = readUsedToday();
    expect(result.size).toBe(1);
  });

  it('resets stale data from a prior day', () => {
    localStorage.setItem('ofd:usedToday', JSON.stringify({ date: '2000-01-01', ids: [99] }));
    recordUsedToday([42]);
    const result = readUsedToday();
    expect(result.has(99)).toBe(false);
    expect(result.has(42)).toBe(true);
  });
});

// ── getWeekStart ───────────────────────────────────────────────────────────────

describe('getWeekStart', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(getWeekStart()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns Monday as the week start', () => {
    // Mock a known date: Wednesday 2024-01-03 → week start Monday 2024-01-01
    const wednesday = new Date('2024-01-03T12:00:00');
    vi.setSystemTime(wednesday);
    expect(getWeekStart()).toBe('2024-01-01');
    vi.useRealTimers();
  });

  it('returns Monday for a Sunday (ISO week — Sunday wraps back to prior Monday)', () => {
    // Sunday 2024-01-07 → prior Monday 2024-01-01
    const sunday = new Date('2024-01-07T12:00:00');
    vi.setSystemTime(sunday);
    expect(getWeekStart()).toBe('2024-01-01');
    vi.useRealTimers();
  });
});

// ── readUsedThisWeek / recordUsedThisWeek ─────────────────────────────────────

describe('readUsedThisWeek', () => {
  it('returns empty Set when nothing is stored', () => {
    expect(readUsedThisWeek().size).toBe(0);
  });

  it('returns IDs for the current week', () => {
    const weekStart = getWeekStart();
    localStorage.setItem('ofd:usedThisWeek', JSON.stringify({ weekStart, ids: [10, 11] }));
    const result = readUsedThisWeek();
    expect(result.has(10)).toBe(true);
    expect(result.has(11)).toBe(true);
  });

  it('resets when stored week does not match current week', () => {
    localStorage.setItem('ofd:usedThisWeek', JSON.stringify({ weekStart: '2000-01-03', ids: [55] }));
    expect(readUsedThisWeek().size).toBe(0);
  });
});

describe('recordUsedThisWeek', () => {
  it('stores IDs under the current week start', () => {
    recordUsedThisWeek([20, 21]);
    const result = readUsedThisWeek();
    expect(result.has(20)).toBe(true);
    expect(result.has(21)).toBe(true);
  });

  it('merges with existing week IDs', () => {
    recordUsedThisWeek([1]);
    recordUsedThisWeek([2]);
    const result = readUsedThisWeek();
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
  });

  it('resets stale week data and stores new IDs', () => {
    localStorage.setItem('ofd:usedThisWeek', JSON.stringify({ weekStart: '2000-01-03', ids: [99] }));
    recordUsedThisWeek([42]);
    const result = readUsedThisWeek();
    expect(result.has(99)).toBe(false);
    expect(result.has(42)).toBe(true);
  });
});
