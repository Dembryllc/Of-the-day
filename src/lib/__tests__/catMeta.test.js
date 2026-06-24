import { describe, it, expect } from 'vitest';
import { CAT_META, MORNING_MEETING_CATS } from '../catMeta';

describe('CAT_META', () => {
  it('contains exactly 14 categories', () => {
    expect(Object.keys(CAT_META)).toHaveLength(14);
  });

  it('every category has color, dark, and emoji fields', () => {
    for (const [name, meta] of Object.entries(CAT_META)) {
      expect(meta, `${name} missing color`).toHaveProperty('color');
      expect(meta, `${name} missing dark`).toHaveProperty('dark');
      expect(meta, `${name} missing emoji`).toHaveProperty('emoji');
    }
  });

  it('every color is a valid 6-digit hex', () => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    for (const [name, meta] of Object.entries(CAT_META)) {
      expect(meta.color, `${name} color`).toMatch(hexRe);
      expect(meta.dark, `${name} dark`).toMatch(hexRe);
    }
  });

  it('contains the four morning meeting categories', () => {
    expect(CAT_META).toHaveProperty('Greeting');
    expect(CAT_META).toHaveProperty('Sharing');
    expect(CAT_META).toHaveProperty('Group Activity');
    expect(CAT_META).toHaveProperty('Morning Message');
  });
});

describe('MORNING_MEETING_CATS', () => {
  it('is a Set with exactly 4 entries', () => {
    expect(MORNING_MEETING_CATS).toBeInstanceOf(Set);
    expect(MORNING_MEETING_CATS.size).toBe(4);
  });

  it('contains the correct four categories', () => {
    expect(MORNING_MEETING_CATS.has('Greeting')).toBe(true);
    expect(MORNING_MEETING_CATS.has('Sharing')).toBe(true);
    expect(MORNING_MEETING_CATS.has('Group Activity')).toBe(true);
    expect(MORNING_MEETING_CATS.has('Morning Message')).toBe(true);
  });

  it('every MORNING_MEETING_CATS entry exists in CAT_META', () => {
    for (const cat of MORNING_MEETING_CATS) {
      expect(CAT_META, `"${cat}" in MORNING_MEETING_CATS but not in CAT_META`).toHaveProperty(cat);
    }
  });
});
