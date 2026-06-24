import { describe, it, expect } from 'vitest';
import {
  SLIDE_THEME_ALIAS,
  SLIDE_VALID_THEMES,
  SLIDE_CHAR_LIMITS,
  FREE_SLIDE_CAP,
  resolveThemeKey,
  isNewSlideFormat,
  isAtSlideLimit,
} from '../slideUtils';

// ── SLIDE_THEME_ALIAS ─────────────────────────────────────────────────────────

describe('SLIDE_THEME_ALIAS', () => {
  it('maps legacy "calm" to "focus"', () => {
    expect(SLIDE_THEME_ALIAS.calm).toBe('focus');
  });

  it('maps legacy "warm" to "soft"', () => {
    expect(SLIDE_THEME_ALIAS.warm).toBe('soft');
  });

  it('maps legacy "bold" to "blocks"', () => {
    expect(SLIDE_THEME_ALIAS.bold).toBe('blocks');
  });

  it('has exactly 3 alias entries', () => {
    expect(Object.keys(SLIDE_THEME_ALIAS)).toHaveLength(3);
  });
});

// ── SLIDE_VALID_THEMES ────────────────────────────────────────────────────────

describe('SLIDE_VALID_THEMES', () => {
  it('contains the 4 canonical theme keys', () => {
    for (const key of ['focus', 'soft', 'blocks', 'depth']) {
      expect(SLIDE_VALID_THEMES.has(key)).toBe(true);
    }
  });

  it('does not contain legacy alias names', () => {
    expect(SLIDE_VALID_THEMES.has('calm')).toBe(false);
    expect(SLIDE_VALID_THEMES.has('warm')).toBe(false);
    expect(SLIDE_VALID_THEMES.has('bold')).toBe(false);
  });
});

// ── resolveThemeKey ───────────────────────────────────────────────────────────

describe('resolveThemeKey', () => {
  it('passes through canonical theme keys unchanged', () => {
    expect(resolveThemeKey('focus')).toBe('focus');
    expect(resolveThemeKey('soft')).toBe('soft');
    expect(resolveThemeKey('blocks')).toBe('blocks');
    expect(resolveThemeKey('depth')).toBe('depth');
  });

  it('resolves legacy alias "calm" to "focus"', () => {
    expect(resolveThemeKey('calm')).toBe('focus');
  });

  it('resolves legacy alias "warm" to "soft"', () => {
    expect(resolveThemeKey('warm')).toBe('soft');
  });

  it('resolves legacy alias "bold" to "blocks"', () => {
    expect(resolveThemeKey('bold')).toBe('blocks');
  });

  it('falls back to "focus" for unknown theme', () => {
    expect(resolveThemeKey('nonexistent')).toBe('focus');
    expect(resolveThemeKey('')).toBe('focus');
    expect(resolveThemeKey(undefined)).toBe('focus');
    expect(resolveThemeKey(null)).toBe('focus');
  });

  // Regression: old slides saved with alias theme names must still render correctly
  it('all saved alias themes resolve to a valid theme (regression)', () => {
    for (const alias of Object.keys(SLIDE_THEME_ALIAS)) {
      const resolved = resolveThemeKey(alias);
      expect(SLIDE_VALID_THEMES.has(resolved), `alias "${alias}" → "${resolved}" not in SLIDE_VALID_THEMES`).toBe(true);
    }
  });
});

// ── isNewSlideFormat ──────────────────────────────────────────────────────────

describe('isNewSlideFormat', () => {
  it('returns true when essentialQuestion is present (even if empty string)', () => {
    expect(isNewSlideFormat({ essentialQuestion: '' })).toBe(true);
    expect(isNewSlideFormat({ essentialQuestion: 'Why do we round numbers?' })).toBe(true);
  });

  it('returns true when successCriteria is present (even if empty array)', () => {
    expect(isNewSlideFormat({ successCriteria: [] })).toBe(true);
    expect(isNewSlideFormat({ successCriteria: ['I will...'] })).toBe(true);
  });

  it('returns true when both essentialQuestion and successCriteria are present', () => {
    expect(isNewSlideFormat({ essentialQuestion: 'Q?', successCriteria: ['SC1'] })).toBe(true);
  });

  it('returns false for a v1 slide (outcomes/expectations/steps only)', () => {
    expect(isNewSlideFormat({
      lessonName: 'Fractions',
      outcomes: ['Understand fractions'],
      expectations: ['Listen'],
      steps: ['Step 1'],
    })).toBe(false);
  });

  it('returns false for an empty object (v1 legacy default)', () => {
    expect(isNewSlideFormat({})).toBe(false);
  });

  it('returns false for null/undefined slide', () => {
    expect(isNewSlideFormat(null)).toBe(false);
    expect(isNewSlideFormat(undefined)).toBe(false);
  });

  // Regression: AI-generated slides (v2) must use InstructionalSlide layout;
  // old saved slides (v1) must still render with legacy layouts
  it('AI-generated slide fields trigger new format (regression)', () => {
    const aiSlide = {
      lessonName: 'Adding Fractions',
      learningTarget: 'I can add fractions with unlike denominators',
      essentialQuestion: 'Why does finding a common denominator matter?',
      successCriteria: ['I will find a common denominator', 'I will add numerators'],
      vocabulary: [{ word: 'denominator', definition: 'bottom number of a fraction' }],
      studentTask: '1. Find the LCD  2. Rewrite fractions  3. Add numerators',
      discussionPrompt: 'Turn and talk: why do the denominators need to match?',
      exitTicket: 'Solve: 1/4 + 1/3',
    };
    expect(isNewSlideFormat(aiSlide)).toBe(true);
  });
});

// ── SLIDE_CHAR_LIMITS ─────────────────────────────────────────────────────────

describe('SLIDE_CHAR_LIMITS', () => {
  // These values are documented in CLAUDE.md and must not drift
  const expected = {
    lessonName: 80,
    learningTarget: 100,
    essentialQuestion: 120,
    successCriterion: 90,
    vocabWord: 30,
    vocabDef: 80,
    studentTask: 220,
    discussionPrompt: 180,
    exitTicket: 180,
    topic: 200,
    preserveLanguage: 100,
  };

  it('has all required fields', () => {
    for (const field of Object.keys(expected)) {
      expect(SLIDE_CHAR_LIMITS, `missing field "${field}"`).toHaveProperty(field);
    }
  });

  it('matches the documented character limits exactly', () => {
    for (const [field, limit] of Object.entries(expected)) {
      expect(SLIDE_CHAR_LIMITS[field], `${field} limit mismatch`).toBe(limit);
    }
  });
});

// ── FREE_SLIDE_CAP ────────────────────────────────────────────────────────────

describe('FREE_SLIDE_CAP', () => {
  it('is 5', () => {
    expect(FREE_SLIDE_CAP).toBe(5);
  });
});

// ── isAtSlideLimit ────────────────────────────────────────────────────────────

describe('isAtSlideLimit', () => {
  const makeSlides = n => Array.from({ length: n }, (_, i) => ({ id: `slide-${i}` }));

  it('returns false for pro users regardless of slide count', () => {
    expect(isAtSlideLimit(false, makeSlides(10), 'new-slide')).toBe(false);
  });

  it('returns false for free users below the cap', () => {
    expect(isAtSlideLimit(true, makeSlides(4), 'new-slide')).toBe(false);
  });

  it('returns true for free users at the cap with a new slide', () => {
    expect(isAtSlideLimit(true, makeSlides(5), 'new-slide')).toBe(true);
  });

  it('returns true for free users above the cap with a new slide', () => {
    // Above-cap (>5) is impossible via normal flow but the guard still fires
    expect(isAtSlideLimit(true, makeSlides(6), 'new-slide')).toBe(true);
  });

  it('returns false when editing an existing slide, even at the cap', () => {
    const slides = makeSlides(5);
    const existingId = slides[2].id; // 'slide-2' is already saved
    expect(isAtSlideLimit(true, slides, existingId)).toBe(false);
  });

  it('returns false when slide list is empty', () => {
    expect(isAtSlideLimit(true, [], 'new-slide')).toBe(false);
  });

  // Regression: free users must never be blocked from editing their own saved slides
  it('editing an existing slide is always allowed regardless of plan (regression)', () => {
    const slides = [{ id: 'my-slide' }, ...makeSlides(4)];
    expect(isAtSlideLimit(true, slides, 'my-slide')).toBe(false);
    expect(isAtSlideLimit(false, slides, 'my-slide')).toBe(false);
  });
});
