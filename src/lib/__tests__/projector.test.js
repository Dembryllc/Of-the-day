import { describe, it, expect } from 'vitest';
import {
  normalizeColor,
  normalizeBackgroundUrl,
  isLikelyDirectImageUrl,
  normalizeProjectorStyle,
  getProjectorBackgroundImage,
  PROJECTOR_THEMES,
  PROJECTOR_BACKGROUNDS,
  DEFAULT_PROJECTOR_STYLE,
} from '../projector';

// ── normalizeColor ─────────────────────────────────────────────────────────────

describe('normalizeColor', () => {
  it('passes through a valid 6-digit hex color', () => {
    expect(normalizeColor('#1B2D5B', '#000000')).toBe('#1B2D5B');
    expect(normalizeColor('#ffffff', '#000000')).toBe('#ffffff');
    expect(normalizeColor('#AABBCC', '#000000')).toBe('#AABBCC');
  });

  it('returns fallback for null', () => {
    expect(normalizeColor(null, '#fallbk')).toBe('#fallbk');
  });

  it('returns fallback for undefined', () => {
    expect(normalizeColor(undefined, '#fallbk')).toBe('#fallbk');
  });

  it('returns fallback for empty string', () => {
    expect(normalizeColor('', '#fallbk')).toBe('#fallbk');
  });

  it('returns fallback for 3-digit hex', () => {
    expect(normalizeColor('#fff', '#fallbk')).toBe('#fallbk');
  });

  it('returns fallback for hex without #', () => {
    expect(normalizeColor('ffffff', '#fallbk')).toBe('#fallbk');
  });

  it('returns fallback for named color', () => {
    expect(normalizeColor('red', '#fallbk')).toBe('#fallbk');
  });

  it('returns fallback for rgb() color', () => {
    expect(normalizeColor('rgb(0,0,0)', '#fallbk')).toBe('#fallbk');
  });
});

// ── normalizeBackgroundUrl ─────────────────────────────────────────────────────

describe('normalizeBackgroundUrl', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeBackgroundUrl('')).toBe('');
    expect(normalizeBackgroundUrl()).toBe('');
    expect(normalizeBackgroundUrl(null)).toBe('');
  });

  it('passes through http URLs', () => {
    const url = 'http://example.com/bg.png';
    expect(normalizeBackgroundUrl(url)).toBe(url);
  });

  it('passes through https URLs', () => {
    const url = 'https://example.com/bg.jpg';
    expect(normalizeBackgroundUrl(url)).toBe(url);
  });

  it('passes through data: image URLs', () => {
    const url = 'data:image/png;base64,abc123';
    expect(normalizeBackgroundUrl(url)).toBe(url);
  });

  it('rejects non-URL strings', () => {
    expect(normalizeBackgroundUrl('not-a-url')).toBe('');
    expect(normalizeBackgroundUrl('ftp://foo.com/img.png')).toBe('');
  });

  it('trims URLs longer than 1200 characters', () => {
    const long = 'https://example.com/' + 'a'.repeat(1200);
    const result = normalizeBackgroundUrl(long);
    expect(result.length).toBe(1200);
    expect(result.startsWith('https://')).toBe(true);
  });

  it('trims leading/trailing whitespace', () => {
    const url = '  https://example.com/bg.png  ';
    expect(normalizeBackgroundUrl(url)).toBe('https://example.com/bg.png');
  });
});

// ── isLikelyDirectImageUrl ─────────────────────────────────────────────────────

describe('isLikelyDirectImageUrl', () => {
  it('returns true for .png', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.png')).toBe(true);
  });

  it('returns true for .jpg', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.jpg')).toBe(true);
  });

  it('returns true for .jpeg', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.jpeg')).toBe(true);
  });

  it('returns true for .webp', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.webp')).toBe(true);
  });

  it('returns true for .gif', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.gif')).toBe(true);
  });

  it('returns true for .svg', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.svg')).toBe(true);
  });

  it('returns true for image URL with query string', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.png?v=2')).toBe(true);
  });

  it('returns true for data:image/ URLs', () => {
    expect(isLikelyDirectImageUrl('data:image/png;base64,abc')).toBe(true);
    expect(isLikelyDirectImageUrl('data:image/jpeg;base64,abc')).toBe(true);
  });

  it('returns false for HTML page URL', () => {
    expect(isLikelyDirectImageUrl('https://example.com/page.html')).toBe(false);
  });

  it('returns false for bare domain URL', () => {
    expect(isLikelyDirectImageUrl('https://example.com/')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLikelyDirectImageUrl('')).toBe(false);
  });

  it('is case-insensitive for extensions', () => {
    expect(isLikelyDirectImageUrl('https://example.com/img.PNG')).toBe(true);
    expect(isLikelyDirectImageUrl('https://example.com/img.JPG')).toBe(true);
  });
});

// ── normalizeProjectorStyle ────────────────────────────────────────────────────

describe('normalizeProjectorStyle', () => {
  it('returns full defaults for an empty object', () => {
    const result = normalizeProjectorStyle({});
    expect(result.theme).toBe('Calm');
    expect(result.textSize).toBe('Large');
    expect(result.showTimer).toBe(true);
    expect(result.showStarter).toBe(true);
    expect(result.overlayOpacity).toBe(DEFAULT_PROJECTOR_STYLE.overlayOpacity);
  });

  it('uses account name as className fallback when no className provided', () => {
    const result = normalizeProjectorStyle({}, { name: 'Ms. Smith' });
    expect(result.className).toBe("Ms. Smith's Class");
  });

  it('uses generic fallback when no account and no className', () => {
    const result = normalizeProjectorStyle({});
    expect(result.className).toBe('Our Class');
  });

  it('preserves explicit className from style', () => {
    const result = normalizeProjectorStyle({ className: 'Room 12' });
    expect(result.className).toBe('Room 12');
  });

  it('falls back to Calm theme for an unrecognized theme', () => {
    const result = normalizeProjectorStyle({ theme: 'NonExistent' });
    expect(result.theme).toBe('Calm');
  });

  it('accepts each valid theme', () => {
    for (const themeKey of Object.keys(PROJECTOR_THEMES)) {
      const result = normalizeProjectorStyle({ theme: themeKey });
      expect(result.theme).toBe(themeKey);
    }
  });

  it('falls back to Large textSize for invalid value', () => {
    const result = normalizeProjectorStyle({ textSize: 'Huge' });
    expect(result.textSize).toBe('Large');
  });

  it('accepts valid textSize values', () => {
    for (const size of ['Normal', 'Large', 'Extra Large']) {
      expect(normalizeProjectorStyle({ textSize: size }).textSize).toBe(size);
    }
  });

  it('clamps overlayOpacity to 0–85', () => {
    expect(normalizeProjectorStyle({ overlayOpacity: -10 }).overlayOpacity).toBe(0);
    expect(normalizeProjectorStyle({ overlayOpacity: 100 }).overlayOpacity).toBe(85);
    expect(normalizeProjectorStyle({ overlayOpacity: 50 }).overlayOpacity).toBe(50);
  });

  it('respects showTimer: false', () => {
    expect(normalizeProjectorStyle({ showTimer: false }).showTimer).toBe(false);
  });

  it('defaults showTimer to true when not set', () => {
    expect(normalizeProjectorStyle({}).showTimer).toBe(true);
    expect(normalizeProjectorStyle({ showTimer: true }).showTimer).toBe(true);
  });

  it('respects showStarter: false', () => {
    expect(normalizeProjectorStyle({ showStarter: false }).showStarter).toBe(false);
  });

  it('fills theme colors from PROJECTOR_THEMES when no overrides given', () => {
    const result = normalizeProjectorStyle({ theme: 'Primary' });
    expect(result.backgroundColor).toBe(PROJECTOR_THEMES.Primary.background);
    expect(result.topColor).toBe(PROJECTOR_THEMES.Primary.top);
    expect(result.accentColor).toBe(PROJECTOR_THEMES.Primary.accent);
  });

  it('accepts a valid hex color override for backgroundColor', () => {
    const result = normalizeProjectorStyle({ backgroundColor: '#123456' });
    expect(result.backgroundColor).toBe('#123456');
  });

  it('falls back to theme color when backgroundColor is invalid hex', () => {
    const result = normalizeProjectorStyle({ backgroundColor: 'not-a-color', theme: 'Calm' });
    expect(result.backgroundColor).toBe(PROJECTOR_THEMES.Calm.background);
  });

  it('falls back to Solid backgroundPreset for unknown preset', () => {
    const result = normalizeProjectorStyle({ backgroundPreset: 'Nonexistent' });
    expect(result.backgroundPreset).toBe('Solid');
  });

  it('accepts each valid backgroundPreset', () => {
    for (const preset of Object.keys(PROJECTOR_BACKGROUNDS)) {
      const result = normalizeProjectorStyle({ backgroundPreset: preset });
      expect(result.backgroundPreset).toBe(preset);
    }
  });
});

// ── getProjectorBackgroundImage ────────────────────────────────────────────────

describe('getProjectorBackgroundImage', () => {
  it('returns "none" for Solid preset', () => {
    const result = getProjectorBackgroundImage({
      backgroundPreset: 'Solid',
      overlayOpacity: 42,
    });
    expect(result).toBe('none');
  });

  it('includes overlay gradient for non-Solid presets', () => {
    const result = getProjectorBackgroundImage({
      backgroundPreset: 'Stars',
      overlayOpacity: 42,
    });
    expect(result).toContain('linear-gradient(rgba(0,0,0,0.42)');
    expect(result).not.toBe('none');
  });

  it('returns url() string for CustomUrl with a URL', () => {
    const result = getProjectorBackgroundImage({
      backgroundPreset: 'CustomUrl',
      backgroundUrl: 'https://example.com/bg.jpg',
      overlayOpacity: 30,
    });
    expect(result).toContain('url("https://example.com/bg.jpg")');
    expect(result).toContain('rgba(0,0,0,0.3)');
  });

  it('returns "none" for CustomUrl with empty URL', () => {
    const result = getProjectorBackgroundImage({
      backgroundPreset: 'CustomUrl',
      backgroundUrl: '',
      overlayOpacity: 42,
    });
    expect(result).toBe('none');
  });

  it('falls back to Solid for an unrecognised preset', () => {
    const result = getProjectorBackgroundImage({
      backgroundPreset: 'DoesNotExist',
      overlayOpacity: 42,
    });
    expect(result).toBe('none');
  });

  it('reflects overlayOpacity in the gradient', () => {
    const result = getProjectorBackgroundImage({
      backgroundPreset: 'CalmGradient',
      overlayOpacity: 60,
    });
    expect(result).toContain('rgba(0,0,0,0.6)');
  });
});
