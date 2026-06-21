import { useState, useCallback, useEffect, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { saveLessonSlide, loadLessonSlides, deleteLessonSlide, saveBehavioralExpectations } from './lib/firestore';
import LessonSlideDisplay from './LessonSlideDisplay';

const SUBJECTS = ['ELA', 'Math', 'Science', 'Social Studies', 'SEL', 'Art', 'Music', 'PE', 'Other'];
const GRADES = ['K–2', '3–5', '6–8', '9–12'];
const THEMES = ['calm', 'warm', 'bold'];
const THEME_LABELS = { calm: 'Calm', warm: 'Warm', bold: 'Bold' };

const LIMITS = {
  lessonName: 60,
  learningTarget: 120,
  outcome: 60,
  expectation: 60,
  step: 60,
  topic: 200,
  preserveLanguage: 100,
};

const blankSlide = (grade = '3–5', savedExpectations = []) => ({
  id: `slide-${Date.now()}`,
  lessonName: '',
  subject: 'Math',
  grade,
  theme: 'calm',
  learningTarget: '',
  outcomes: ['', ''],
  expectations: savedExpectations.length > 0 ? [...savedExpectations] : ['', '', ''],
  steps: ['', '', '', ''],
  createdAt: new Date().toISOString(),
});

function CharCount({ value, limit }) {
  const len = (value || '').length;
  const pct = len / limit;
  const color = pct >= 1 ? '#DC2626' : pct >= 0.9 ? '#D97706' : 'var(--muted)';
  return (
    <span style={{ fontSize: 11, color, fontWeight: pct >= 0.9 ? 600 : 400 }}>
      {len}/{limit}
    </span>
  );
}

function FieldRow({ label, children, extra }) {
  return (
    <div className="slide-field-row">
      <div className="slide-field-label">
        <span>{label}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

function SlideTextarea({ value, onChange, limit, placeholder, rows = 1 }) {
  const over = (value || '').length >= limit;
  return (
    <div style={{ position: 'relative' }}>
      <textarea
        className={`slide-field-input${over ? ' slide-field-input--over' : ''}`}
        value={value}
        onChange={e => onChange(e.target.value.slice(0, limit))}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

function ArrayFieldList({ label, items, onChange, limit, placeholder, min = 2, max = 3 }) {
  const add = () => onChange([...items, '']);
  const remove = i => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, v) => onChange(items.map((x, idx) => idx === i ? v.slice(0, limit) : x));
  return (
    <FieldRow label={label} extra={
      <div style={{ display: 'flex', gap: 4 }}>
        {items.length < max && <button type="button" className="slide-arr-btn" onClick={add} title="Add">+</button>}
        {items.length > min && <button type="button" className="slide-arr-btn slide-arr-btn--remove" onClick={() => remove(items.length - 1)} title="Remove">−</button>}
      </div>
    }>
      {items.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
            <textarea
              className={`slide-field-input${v.length >= limit ? ' slide-field-input--over' : ''}`}
              value={v}
              onChange={e => update(i, e.target.value)}
              placeholder={`${placeholder} ${i + 1}`}
              rows={1}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <CharCount value={v} limit={limit} />
            </div>
          </div>
        </div>
      ))}
    </FieldRow>
  );
}

function StepsList({ steps, onChange }) {
  const min = 3, max = 6;
  const add = () => onChange([...steps, '']);
  const remove = () => onChange(steps.slice(0, -1));
  const update = (i, v) => onChange(steps.map((x, idx) => idx === i ? v.slice(0, LIMITS.step) : x));
  return (
    <FieldRow label="Steps" extra={
      <div style={{ display: 'flex', gap: 4 }}>
        {steps.length < max && <button type="button" className="slide-arr-btn" onClick={add} title="Add step">+</button>}
        {steps.length > min && <button type="button" className="slide-arr-btn slide-arr-btn--remove" onClick={remove} title="Remove step">−</button>}
      </div>
    }>
      {steps.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
          <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: 13, minWidth: 16, paddingTop: 7 }}>{i + 1}</span>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
            <textarea
              className={`slide-field-input${v.length >= LIMITS.step ? ' slide-field-input--over' : ''}`}
              value={v}
              onChange={e => update(i, e.target.value)}
              placeholder={`Step ${i + 1}`}
              rows={1}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <CharCount value={v} limit={LIMITS.step} />
            </div>
          </div>
        </div>
      ))}
    </FieldRow>
  );
}

// ── My Slides Library ─────────────────────────────────────────────────────────

function MySlidesView({ slides, onEdit, onDelete, onProject, loading }) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? slides.filter(s =>
        (s.lessonName + s.learningTarget + s.subject + s.grade)
          .toLowerCase().includes(q.toLowerCase()))
    : slides;

  if (loading) return <div className="slide-lib-empty">Loading saved slides…</div>;
  if (slides.length === 0) return (
    <div className="slide-lib-empty">
      <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>No saved slides yet</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Create a slide and hit Save to build your library.</div>
    </div>
  );
  return (
    <div className="slide-lib">
      <div className="slide-lib-search-wrap">
        <input
          className="slide-lib-search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by lesson name, subject, grade…"
        />
      </div>
      {filtered.length === 0 && <div className="slide-lib-empty" style={{ marginTop: 24 }}>No slides match "{q}"</div>}
      <div className="slide-lib-grid">
        {filtered.map(s => (
          <div key={s.id} className="slide-lib-card">
            <div className="slide-lib-thumb">
              <LessonSlideDisplay slide={s} />
            </div>
            <div className="slide-lib-meta">
              <div className="slide-lib-name">{s.lessonName || 'Untitled Slide'}</div>
              <div className="slide-lib-sub">{[s.subject, s.grade].filter(Boolean).join(' · ')}</div>
            </div>
            <div className="slide-lib-actions">
              <button type="button" className="btn-secondary btn-compact" onClick={() => onEdit(s)}>Edit</button>
              <button type="button" className="btn-primary btn-compact" onClick={() => onProject(s)}>▶ Project</button>
              <button type="button" className="slide-lib-delete" onClick={() => onDelete(s.id)} title="Delete slide">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Creator ──────────────────────────────────────────────────────────────

export default function LessonSlideCreator({
  account,
  isPlanFree,
  onUpgradeNeeded,
  onProjectSlide,
  savedBehavioralExpectations,
  onSaveBehavioralExpectations,
}) {
  const [view, setView] = useState('create'); // 'create' | 'slides'
  const [slide, setSlide] = useState(() => blankSlide(account?.grade, savedBehavioralExpectations));
  const [topic, setTopic] = useState('');
  const [preserveLanguage, setPreserveLanguage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [simplifying, setSimplifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [savedSlides, setSavedSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [projecting, setProjecting] = useState(false);

  // Whether the current slide is already saved (editing) vs. brand-new
  const isExistingSlide = useMemo(
    () => savedSlides.some(s => s.id === slide.id),
    [savedSlides, slide.id]
  );
  // Free users are blocked from creating a 6th new slide
  const atSlideLimit = isPlanFree && !isExistingSlide && savedSlides.length >= 5;

  const update = useCallback((field, value) => {
    setSlide(s => ({ ...s, [field]: value }));
  }, []);

  // Load saved slides on mount (and uid change) — needed for count-based gate on create view
  useEffect(() => {
    if (!account?.uid) return;
    setSlidesLoading(true);
    loadLessonSlides(account.uid)
      .then(setSavedSlides)
      .catch(() => {})
      .finally(() => setSlidesLoading(false));
  }, [account?.uid]);

  const handleGenerate = useCallback(async () => {
    if (atSlideLimit) { onUpgradeNeeded(); return; }
    if (!slide.subject || !topic.trim()) {
      setGenError('Add a subject and describe your lesson first.');
      return;
    }
    setGenError('');
    setGenerating(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error('Not signed in');
      const resp = await fetch('/api/generate-slide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          subject: slide.subject,
          grade: slide.grade,
          topic: topic.trim(),
          preserveLanguage: preserveLanguage.trim(),
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Generation failed (' + resp.status + ')');
      }
      const data = await resp.json();
      setSlide(s => ({
        ...s,
        lessonName: data.lessonName || s.lessonName,
        learningTarget: data.learningTarget || '',
        outcomes: data.outcomes?.length ? data.outcomes : s.outcomes,
        expectations: data.expectations?.length ? data.expectations : s.expectations,
        steps: data.steps?.length ? data.steps : s.steps,
      }));
    } catch (err) {
      setGenError(
        err?.message?.includes('fill in') || err?.message?.includes('unavailable')
          ? 'Generation unavailable right now — fill in the fields below.'
          : err?.message?.includes('not configured')
          ? 'AI generation is not configured — contact support.'
          : err?.message
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  }, [slide.subject, slide.grade, topic, preserveLanguage, atSlideLimit, onUpgradeNeeded]);

  const handleSimplify = useCallback(async () => {
    if (isPlanFree) { onUpgradeNeeded(); return; }
    if (!slide.learningTarget) return;
    setSimplifying(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error('Not signed in');
      const resp = await fetch('/api/simplify-slide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          grade: slide.grade,
          learningTarget: slide.learningTarget,
          outcomes: slide.outcomes.filter(Boolean),
        }),
      });
      if (!resp.ok) return; // silent — simplification is a nice-to-have
      const data = await resp.json();
      setSlide(s => ({
        ...s,
        learningTarget: data.learningTarget || s.learningTarget,
        outcomes: data.outcomes?.length ? data.outcomes : s.outcomes,
      }));
    } catch {
      // silent — simplification is a nice-to-have
    } finally {
      setSimplifying(false);
    }
  }, [slide.grade, slide.learningTarget, slide.outcomes, isPlanFree, onUpgradeNeeded]);

  const handleSave = useCallback(async () => {
    if (!account?.uid) return;
    if (atSlideLimit) { onUpgradeNeeded(); return; }
    setSaving(true);
    setSaveMsg('');
    try {
      await saveLessonSlide(account.uid, slide);
      const hasCustomExpectations = slide.expectations.some(e => e.trim());
      if (hasCustomExpectations) {
        await saveBehavioralExpectations(account.uid, slide.expectations.filter(Boolean));
        onSaveBehavioralExpectations?.(slide.expectations.filter(Boolean));
      }
      // Refresh slide list so count stays accurate
      loadLessonSlides(account.uid).then(setSavedSlides).catch(() => {});
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      if (err.code === 'SLIDE_LIMIT_REACHED') {
        loadLessonSlides(account.uid).then(setSavedSlides).catch(() => {});
        onUpgradeNeeded();
      } else {
        setSaveMsg('Save failed — try again.');
      }
    } finally {
      setSaving(false);
    }
  }, [account?.uid, slide, atSlideLimit, onUpgradeNeeded, onSaveBehavioralExpectations]);

  const handleSaveNew = useCallback(() => {
    setSlide(s => ({ ...s, id: `slide-${Date.now()}`, createdAt: new Date().toISOString() }));
    setSaveMsg('');
  }, []);

  const handleProject = useCallback((slideToProject = null) => {
    const target = slideToProject || slide;
    if (isPlanFree) { onUpgradeNeeded(); return; }
    onProjectSlide(target);
  }, [slide, isPlanFree, onUpgradeNeeded, onProjectSlide]);

  const handleEditSaved = useCallback(s => {
    setSlide(s);
    setView('create');
  }, []);

  const handleDeleteSaved = useCallback(async id => {
    if (!account?.uid) return;
    try {
      await deleteLessonSlide(account.uid, id);
      setSavedSlides(prev => prev.filter(s => s.id !== id));
    } catch {}
  }, [account?.uid]);

  const handleNewSlide = useCallback(() => {
    setSlide(blankSlide(account?.grade, savedBehavioralExpectations));
    setTopic('');
    setPreserveLanguage('');
    setGenError('');
    setSaveMsg('');
  }, [account?.grade, savedBehavioralExpectations]);

  return (
    <div className="slide-creator">
      {/* Header tabs */}
      <div className="slide-creator-header">
        <div className="slide-creator-tabs">
          <button
            type="button"
            className={`slide-tab${view === 'create' ? ' active' : ''}`}
            onClick={() => setView('create')}
          >
            ✏️ New Slide
          </button>
          <button
            type="button"
            className={`slide-tab${view === 'slides' ? ' active' : ''}`}
            onClick={() => setView('slides')}
          >
            🖼️ My Slides {savedSlides.length > 0 && `(${savedSlides.length})`}
          </button>
        </div>
        {view === 'create' && (
          <button type="button" className="btn-ghost btn-compact" onClick={handleNewSlide}>
            + New
          </button>
        )}
      </div>

      {view === 'slides' ? (
        <MySlidesView
          slides={savedSlides}
          loading={slidesLoading}
          onEdit={handleEditSaved}
          onDelete={handleDeleteSaved}
          onProject={s => handleProject(s)}
        />
      ) : (
        <div className="slide-creator-body">
          {/* Left: form */}
          <div className="slide-form-col">

            {/* Free-tier slide count banner — shown at 3/5 and above */}
            {isPlanFree && savedSlides.length >= 3 && (
              <div className={`slide-free-banner${savedSlides.length >= 5 ? ' slide-free-banner--full' : savedSlides.length >= 4 ? ' slide-free-banner--warn' : ''}`}>
                {savedSlides.length >= 5
                  ? <>All 5 free slides used — <button type="button" className="slide-free-cta" onClick={onUpgradeNeeded}>Upgrade to save more →</button></>
                  : <>{savedSlides.length} of 5 free slides used{savedSlides.length === 4 ? ' — 1 remaining' : ''}</>
                }
              </div>
            )}

            {/* Theme + meta */}
            <div className="slide-meta-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label className="slide-field-label">Theme</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {THEMES.map(th => (
                    <button
                      key={th}
                      type="button"
                      className={`slide-theme-btn slide-theme-btn--${th}${slide.theme === th ? ' active' : ''}`}
                      onClick={() => update('theme', th)}
                    >
                      {THEME_LABELS[th]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <FieldRow label="Lesson Name" extra={<CharCount value={slide.lessonName} limit={LIMITS.lessonName} />}>
              <input
                className="slide-field-input"
                type="text"
                value={slide.lessonName}
                onChange={e => update('lessonName', e.target.value.slice(0, LIMITS.lessonName))}
                placeholder="e.g. Adding Fractions"
              />
            </FieldRow>

            <div className="slide-row-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="slide-field-label">Subject</label>
                <select
                  className="slide-field-input"
                  value={slide.subject}
                  onChange={e => update('subject', e.target.value)}
                >
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="slide-field-label">Grade</label>
                <select
                  className="slide-field-input"
                  value={slide.grade}
                  onChange={e => update('grade', e.target.value)}
                >
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* AI intake */}
            <div className="slide-ai-section">
              <div className="slide-field-label" style={{ marginBottom: 6 }}>Describe your lesson (for AI generation)</div>
              <textarea
                className="slide-field-input"
                value={topic}
                onChange={e => setTopic(e.target.value.slice(0, LIMITS.topic))}
                placeholder="e.g. Adding fractions with like denominators using fraction strips"
                rows={2}
              />
              <input
                className="slide-field-input"
                type="text"
                value={preserveLanguage}
                onChange={e => setPreserveLanguage(e.target.value.slice(0, LIMITS.preserveLanguage))}
                placeholder={'Specific language to keep (optional) — e.g. "turn and talk"'}
                style={{ marginTop: 6 }}
              />
              {genError && <div className="slide-gen-error">{genError}</div>}
              <button
                type="button"
                className="btn-primary slide-gen-btn"
                onClick={handleGenerate}
                disabled={generating || (!topic.trim())}
              >
                {generating ? '✨ Generating…' : '✨ Generate with AI'}
              </button>
            </div>

            <div className="slide-divider">— or fill in manually —</div>

            {/* Learning target */}
            <FieldRow label="Learning Target" extra={<CharCount value={slide.learningTarget} limit={LIMITS.learningTarget} />}>
              <SlideTextarea
                value={slide.learningTarget}
                onChange={v => update('learningTarget', v)}
                limit={LIMITS.learningTarget}
                placeholder='e.g. "I can add fractions with the same denominator."'
                rows={2}
              />
              {slide.learningTarget && !isPlanFree && (
                <button
                  type="button"
                  className="slide-simplify-btn"
                  onClick={handleSimplify}
                  disabled={simplifying}
                >
                  {simplifying ? 'Simplifying…' : `Simplify for ${slide.grade}`}
                </button>
              )}
            </FieldRow>

            <ArrayFieldList
              label="Expected Outcomes"
              items={slide.outcomes}
              onChange={v => update('outcomes', v)}
              limit={LIMITS.outcome}
              placeholder="Outcome"
              min={2} max={3}
            />

            <ArrayFieldList
              label="Behavioral Expectations"
              items={slide.expectations}
              onChange={v => update('expectations', v)}
              limit={LIMITS.expectation}
              placeholder="Expectation"
              min={2} max={3}
            />

            <StepsList steps={slide.steps} onChange={v => update('steps', v)} />

            {/* Actions */}
            <div className="slide-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : saveMsg || '💾 Save'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleProject()}
              >
                ▶ Project
              </button>
            </div>
            {saveMsg && !saving && (
              <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
                {saveMsg} <button type="button" className="slide-free-cta" onClick={handleSaveNew}>Save as new →</button>
              </div>
            )}

          </div>

          {/* Right: live preview */}
          <div className="slide-preview-col">
            <div className="slide-field-label" style={{ marginBottom: 8 }}>Live Preview</div>
            <LessonSlideDisplay slide={slide} />
          </div>
        </div>
      )}
    </div>
  );
}
