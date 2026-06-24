import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toMs, resolvePlan } from '../usePlan';

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

// ── toMs ──────────────────────────────────────────────────────────────────────

describe('toMs', () => {
  it('passes through a plain number unchanged', () => {
    expect(toMs(1000)).toBe(1000);
    expect(toMs(0)).toBe(0);
  });

  it('uses .toMillis() for Firestore Timestamp objects', () => {
    const ts = { toMillis: () => 1700000000000 };
    expect(toMs(ts)).toBe(1700000000000);
  });

  it('falls back to seconds * 1000 when .toMillis is absent', () => {
    expect(toMs({ seconds: 1700000 })).toBe(1700000000);
  });

  it('returns null for null', () => {
    expect(toMs(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toMs(undefined)).toBeNull();
  });

  it('returns null for a string (not a valid timestamp type)', () => {
    // strings are not numbers, have no .toMillis, no .seconds → null
    expect(toMs('2024-01-01')).toBeNull();
  });

  // Regression: pre-fix, toMs returned null for plain numbers because
  // trialStartedAt is pre-converted to ms before being stored on the account
  // object — causing trial to be granted forever.
  it('correctly handles pre-converted plain-number timestamp (regression)', () => {
    const nowMs = Date.now();
    expect(toMs(nowMs)).toBe(nowMs);
    expect(typeof toMs(nowMs)).toBe('number');
  });
});

// ── resolvePlan ───────────────────────────────────────────────────────────────

describe('resolvePlan', () => {
  let now;

  beforeEach(() => {
    now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns free when account is null', () => {
    expect(resolvePlan(null)).toBe('free');
  });

  it('returns free when account is undefined', () => {
    expect(resolvePlan(undefined)).toBe('free');
  });

  it('returns pro when tier is pro (Stripe subscriber)', () => {
    expect(resolvePlan({ tier: 'pro' })).toBe('pro');
  });

  it('returns pro when plan is pro (manual override)', () => {
    expect(resolvePlan({ plan: 'pro' })).toBe('pro');
  });

  it('returns pro when plan is school (manual override)', () => {
    expect(resolvePlan({ plan: 'school' })).toBe('pro');
  });

  it('returns pro for trial with no trialStartedAt (just signed up)', () => {
    expect(resolvePlan({ plan: 'trial', trialStartedAt: null })).toBe('pro');
    expect(resolvePlan({ plan: 'trial', trialStartedAt: undefined })).toBe('pro');
  });

  it('returns pro for trial within 14 days (plain ms timestamp)', () => {
    const startedMs = now - (13 * 24 * 60 * 60 * 1000); // 13 days ago
    expect(resolvePlan({ plan: 'trial', trialStartedAt: startedMs })).toBe('pro');
  });

  it('returns pro for trial within 14 days (Firestore Timestamp object)', () => {
    const startedMs = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    const ts = { toMillis: () => startedMs };
    expect(resolvePlan({ plan: 'trial', trialStartedAt: ts })).toBe('pro');
  });

  it('returns pro for trial within 14 days (seconds-only object)', () => {
    const startedMs = now - (3 * 24 * 60 * 60 * 1000); // 3 days ago
    const ts = { seconds: Math.floor(startedMs / 1000) };
    expect(resolvePlan({ plan: 'trial', trialStartedAt: ts })).toBe('pro');
  });

  it('returns free for expired trial (> 14 days ago)', () => {
    const startedMs = now - (15 * 24 * 60 * 60 * 1000); // 15 days ago
    expect(resolvePlan({ plan: 'trial', trialStartedAt: startedMs })).toBe('free');
  });

  it('returns free for trial exactly at the 14-day boundary', () => {
    const startedMs = now - TRIAL_MS; // exactly 14 days
    expect(resolvePlan({ plan: 'trial', trialStartedAt: startedMs })).toBe('free');
  });

  it('returns free for unknown plan', () => {
    expect(resolvePlan({ plan: 'free' })).toBe('free');
    expect(resolvePlan({ plan: 'unknown' })).toBe('free');
    expect(resolvePlan({ plan: '' })).toBe('free');
  });

  it('tier pro takes precedence over plan free', () => {
    expect(resolvePlan({ tier: 'pro', plan: 'free' })).toBe('pro');
  });

  // Regression: expired trial with a Firestore Timestamp should expire correctly
  it('expired trial with Firestore Timestamp returns free (regression)', () => {
    const startedMs = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const ts = { toMillis: () => startedMs };
    expect(resolvePlan({ plan: 'trial', trialStartedAt: ts })).toBe('free');
  });
});
