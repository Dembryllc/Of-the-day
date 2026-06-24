// Pure slide logic shared by LessonSlideCreator and LessonSlideDisplay.

// ── Theme aliases ──────────────────────────────────────────────────────────────
// Legacy theme names mapped to canonical keys (for backward-compat with saved slides)
export const SLIDE_THEME_ALIAS = { calm: 'focus', warm: 'soft', bold: 'blocks' };

// Canonical theme keys
export const SLIDE_VALID_THEMES = new Set(['focus', 'soft', 'blocks', 'depth']);

// Resolve any theme string (including legacy alias) to a canonical key.
// Falls back to 'focus' for unknown values.
export function resolveThemeKey(theme) {
  const resolved = SLIDE_THEME_ALIAS[theme] || theme;
  return SLIDE_VALID_THEMES.has(resolved) ? resolved : 'focus';
}

// ── Slide format detection ────────────────────────────────────────────────────
// Returns true for v2 (new instructional format), false for v1 (legacy)
export function isNewSlideFormat(slide) {
  if (!slide) return false;
  return slide.essentialQuestion !== undefined || slide.successCriteria !== undefined;
}

// ── Character limits ───────────────────────────────────────────────────────────
export const SLIDE_CHAR_LIMITS = {
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

// ── Free-tier slide cap ────────────────────────────────────────────────────────
export const FREE_SLIDE_CAP = 5;

// Returns true when a free-plan user has reached the cap and is trying to save
// a NEW slide (editing an existing slide always succeeds).
export function isAtSlideLimit(isPlanFree, savedSlides, currentSlideId) {
  if (!isPlanFree) return false;
  const isExisting = savedSlides.some(s => s.id === currentSlideId);
  if (isExisting) return false;
  return savedSlides.length >= FREE_SLIDE_CAP;
}
