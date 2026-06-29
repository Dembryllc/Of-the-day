import { useState, useCallback, useEffect, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { saveLessonSlide, loadLessonSlides, deleteLessonSlide, saveBehavioralExpectations } from './lib/firestore';
import { exportToPowerPoint, exportToGoogleSlides } from './lib/exportSlide';
import LessonSlideDisplay from './LessonSlideDisplay';

const SUBJECTS = ['ELA', 'Math', 'Science', 'Social Studies', 'SEL', 'Art', 'Music', 'PE', 'Other'];
const GRADES = ['K–2', '3–5', '6–8', '9–12'];
const THEMES = ['focus', 'soft', 'blocks', 'depth'];
const THEME_LABELS = { focus: 'Clear Focus', soft: 'Soft Structure', blocks: 'Bold Blocks', depth: 'Layered Depth' };

const LIMITS = {
  lessonName: 80,
  learningTarget: 100,
  essentialQuestion: 120,
  successCriterion: 90,
  vocabWord: 30,
  vocabDef: 80,
  studentTask: 300,
  discussionPrompt: 250,
  exitTicket: 250,
  topic: 200,
  preserveLanguage: 100,
};

const blankSlide = (grade = '3–5') => ({
  id: `slide-${Date.now()}`,
  lessonName: '',
  subject: 'Math',
  grade,
  theme: 'focus',
  learningTarget: '',
  essentialQuestion: '',
  successCriteria: ['', ''],
  vocabulary: [{ word: '', definition: '' }, { word: '', definition: '' }],
  studentTask: '',
  discussionPrompt: '',
  exitTicket: '',
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

function VocabularyList({ items, onChange }) {
  const min = 1, max = 4;
  const add = () => onChange([...items, { word: '', definition: '' }]);
  const remove = () => onChange(items.slice(0, -1));
  const update = (i, field, val) => onChange(
    items.map((x, idx) => idx === i ? { ...x, [field]: val.slice(0, field === 'word' ? LIMITS.vocabWord : LIMITS.vocabDef) } : x)
  );
  return (
    <FieldRow label="Key Vocabulary" extra={
      <div style={{ display: 'flex', gap: 4 }}>
        {items.length < max && <button type="button" className="slide-arr-btn" onClick={add} title="Add term">+</button>}
        {items.length > min && <button type="button" className="slide-arr-btn slide-arr-btn--remove" onClick={remove} title="Remove term">−</button>}
      </div>
    }>
      {items.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
          <div style={{ flex: '0 0 36%' }}>
            <textarea
              className={`slide-field-input${(v.word || '').length >= LIMITS.vocabWord ? ' slide-field-input--over' : ''}`}
              value={v.word}
              onChange={e => update(i, 'word', e.target.value)}
              placeholder={`Term ${i + 1}`}
              rows={1}
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              className={`slide-field-input${(v.definition || '').length >= LIMITS.vocabDef ? ' slide-field-input--over' : ''}`}
              value={v.definition}
              onChange={e => update(i, 'definition', e.target.value)}
              placeholder="Student-friendly definition"
              rows={1}
            />
          </div>
        </div>
      ))}
    </FieldRow>
  );
}

// ── My Slides Library ─────────────────────────────────────────────────────────

function MySlidesView({ slides, onEdit, onDelete, onProject, onExportPptx, onExportGoogle, loading }) {
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
              <button type="button" className="btn-ghost btn-compact" onClick={() => onExportPptx(s)} title="Download as PowerPoint">.pptx</button>
              <button type="button" className="btn-ghost btn-compact" onClick={() => onExportGoogle(s)} title="Export to Google Slides">Slides</button>
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
  const [slide, setSlide] = useState(() => blankSlide(account?.grade));
  const [topic, setTopic] = useState('');
  const [preserveLanguage, setPreserveLanguage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [simplifying, setSimplifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [savedSlides, setSavedSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [exporting, setExporting] = useState(null); // null | 'pptx' | 'google'
  const [exportMsg, setExportMsg] = useState('');

  const isExistingSlide = useMemo(
    () => savedSlides.some(s => s.id === slide.id),
    [savedSlides, slide.id]
  );
  const atSlideLimit = isPlanFree && !isExistingSlide && savedSlides.length >= 5;

  const update = useCallback((field, value) => {
    setSlide(s => ({ ...s, [field]: value }));
  }, []);

  useEffect(() => {
    if (!account?.uid) return;
    setSlidesLoading(true);
    loadLessonSlides(account.uid)
      .then(setSavedSlides)
      .catch(err => { console.error('[Slides Load Error]', err?.code, err?.message); })
      .finally(() => setSlidesLoading(false));
  }, [account?.uid]);

  const handleGenerate = useCallback(async () => {
    if (atSlideLimit) { onUpgradeNeeded(); return; }
    if (!account?.uid) { onUpgradeNeeded(); return; }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
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
        essentialQuestion: data.essentialQuestion || '',
        successCriteria: data.successCriteria?.length ? data.successCriteria : ['', ''],
        vocabulary: data.vocabulary?.length ? data.vocabulary : [{ word: '', definition: '' }],
        studentTask: data.studentTask || '',
        discussionPrompt: data.discussionPrompt || '',
        exitTicket: data.exitTicket || '',
        // Clear legacy fields from old slides
        outcomes: [],
        expectations: [],
        steps: [],
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
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          grade: slide.grade,
          learningTarget: slide.learningTarget,
          successCriteria: (slide.successCriteria || []).filter(Boolean),
        }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      setSlide(s => ({
        ...s,
        learningTarget: data.learningTarget || s.learningTarget,
        ...(data.successCriteria?.length ? { successCriteria: data.successCriteria } : {}),
      }));
    } catch {
      // silent — simplification is a nice-to-have
    } finally {
      setSimplifying(false);
    }
  }, [slide.grade, slide.learningTarget, slide.successCriteria, isPlanFree, onUpgradeNeeded]);

  const handleSave = useCallback(async () => {
    if (!account?.uid) return;
    if (atSlideLimit) { onUpgradeNeeded(); return; }
    setSaving(true);
    setSaveMsg('');
    try {
      await saveLessonSlide(account.uid, slide);
    } catch (err) {
      console.error('[Slide Save Error]', err?.code, err?.message, err);
      if (err.code === 'SLIDE_LIMIT_REACHED') {
        loadLessonSlides(account.uid).then(setSavedSlides).catch(() => {});
        onUpgradeNeeded();
      } else if (err.code === 'permission-denied') {
        setSaveMsg('Permission denied — try refreshing the page (Ctrl+Shift+R).');
      } else {
        setSaveMsg((err.message || 'Save failed — try again.') + (err.code ? ` [${err.code}]` : ''));
      }
      setSaving(false);
      return;
    }
    loadLessonSlides(account.uid).then(setSavedSlides).catch(err => { console.error('[Slides Reload Error]', err?.code, err?.message); });
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2500);
    setSaving(false);
  }, [account?.uid, slide, atSlideLimit, onUpgradeNeeded]);

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
    setSlide(blankSlide(account?.grade));
    setTopic('');
    setPreserveLanguage('');
    setGenError('');
    setSaveMsg('');
  }, [account?.grade]);

  const handleExportPptx = useCallback(async (target = null) => {
    const s = target || slide;
    setExporting('pptx');
    setExportMsg('');
    try {
      await exportToPowerPoint(s);
      setExportMsg('Downloaded!');
    } catch (err) {
      console.error('[Export PPTX]', err);
      setExportMsg('Export failed — try again.');
    } finally {
      setExporting(null);
      setTimeout(() => setExportMsg(''), 3000);
    }
  }, [slide]);

  const handleExportGoogle = useCallback(async (target = null) => {
    const s = target || slide;
    setExporting('google');
    setExportMsg('');
    try {
      await exportToGoogleSlides(s);
      setExportMsg('Opened in Google Slides!');
    } catch (err) {
      console.error('[Export Google Slides]', err);
      setExportMsg(err.message || 'Export failed — try again.');
    } finally {
      setExporting(null);
      setTimeout(() => setExportMsg(''), 6000);
    }
  }, [slide]);

  // Detect if the slide being edited is in the new format
  const isNewFormat = slide.essentialQuestion !== undefined || slide.successCriteria !== undefined;

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
          onExportPptx={s => handleExportPptx(s)}
          onExportGoogle={s => handleExportGoogle(s)}
        />
      ) : (
        <div className="slide-creator-body">
          {/* Left: form */}
          <div className="slide-form-col">

            {/* Free-tier slide count banner */}
            {isPlanFree && savedSlides.length >= 3 && (
              <div className={`slide-free-banner${savedSlides.length >= 5 ? ' slide-free-banner--full' : savedSlides.length >= 4 ? ' slide-free-banner--warn' : ''}`}>
                {savedSlides.length >= 5
                  ? <>All 5 free slides used — <button type="button" className="slide-free-cta" onClick={onUpgradeNeeded}>Upgrade to save more →</button></>
                  : <>{savedSlides.length} of 5 free slides used{savedSlides.length === 4 ? ' — 1 remaining' : ''}</>
                }
              </div>
            )}

            {/* Theme */}
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
                <select className="slide-field-input" value={slide.subject} onChange={e => update('subject', e.target.value)}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="slide-field-label">Grade</label>
                <select className="slide-field-input" value={slide.grade} onChange={e => update('grade', e.target.value)}>
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

            {/* Learning Target */}
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

            {/* Essential Question — only on new-format slides */}
            {isNewFormat && (
              <FieldRow label="Essential Question" extra={<CharCount value={slide.essentialQuestion} limit={LIMITS.essentialQuestion} />}>
                <SlideTextarea
                  value={slide.essentialQuestion}
                  onChange={v => update('essentialQuestion', v)}
                  limit={LIMITS.essentialQuestion}
                  placeholder='e.g. "Why does the denominator stay the same when we add fractions?"'
                  rows={2}
                />
              </FieldRow>
            )}

            {/* Success Criteria — new format */}
            {isNewFormat && (
              <ArrayFieldList
                label="Success Criteria"
                items={slide.successCriteria || ['', '']}
                onChange={v => update('successCriteria', v)}
                limit={LIMITS.successCriterion}
                placeholder='e.g. "I will explain my thinking in writing."'
                min={2} max={3}
              />
            )}

            {/* Key Vocabulary — new format */}
            {isNewFormat && (
              <VocabularyList
                items={slide.vocabulary || [{ word: '', definition: '' }]}
                onChange={v => update('vocabulary', v)}
              />
            )}

            {/* Student Task — new format */}
            {isNewFormat && (
              <FieldRow label="Student Task" extra={<CharCount value={slide.studentTask} limit={LIMITS.studentTask} />}>
                <SlideTextarea
                  value={slide.studentTask}
                  onChange={v => update('studentTask', v)}
                  limit={LIMITS.studentTask}
                  placeholder='e.g. "1. Watch the model. 2. Try 2 problems with a partner. 3. Check your work."'
                  rows={2}
                />
              </FieldRow>
            )}

            {/* Discussion Prompt — new format */}
            {isNewFormat && (
              <FieldRow label="Discussion Prompt" extra={<CharCount value={slide.discussionPrompt} limit={LIMITS.discussionPrompt} />}>
                <SlideTextarea
                  value={slide.discussionPrompt}
                  onChange={v => update('discussionPrompt', v)}
                  limit={LIMITS.discussionPrompt}
                  placeholder='e.g. "Turn and Talk: Explain to your partner why the denominator stays the same."'
                  rows={2}
                />
              </FieldRow>
            )}

            {/* Exit Ticket — new format */}
            {isNewFormat && (
              <FieldRow label="Exit Ticket" extra={<CharCount value={slide.exitTicket} limit={LIMITS.exitTicket} />}>
                <SlideTextarea
                  value={slide.exitTicket}
                  onChange={v => update('exitTicket', v)}
                  limit={LIMITS.exitTicket}
                  placeholder='e.g. "Solve 2/5 + 1/5. Show your work and explain your thinking."'
                  rows={2}
                />
              </FieldRow>
            )}

            {/* Legacy fields for old-format slides */}
            {!isNewFormat && slide.outcomes !== undefined && (
              <>
                <ArrayFieldList
                  label="Expected Outcomes"
                  items={slide.outcomes || ['', '']}
                  onChange={v => update('outcomes', v)}
                  limit={120}
                  placeholder="Outcome"
                  min={2} max={3}
                />
                <ArrayFieldList
                  label="Behavioral Expectations"
                  items={slide.expectations || ['', '', '']}
                  onChange={v => update('expectations', v)}
                  limit={120}
                  placeholder="Expectation"
                  min={2} max={3}
                />
              </>
            )}

            {/* Actions */}
            <div className="slide-actions">
              <button type="button" className="btn-secondary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save'}
              </button>
              <button type="button" className="btn-primary" onClick={() => handleProject()}>
                ▶ Project
              </button>
            </div>
            <div className="slide-export-actions">
              <button
                type="button"
                className="btn-ghost btn-compact"
                onClick={() => handleExportPptx()}
                disabled={exporting !== null}
                title="Download as PowerPoint (.pptx)"
              >
                {exporting === 'pptx' ? 'Exporting…' : '⬇ PowerPoint'}
              </button>
              <button
                type="button"
                className="btn-ghost btn-compact"
                onClick={() => handleExportGoogle()}
                disabled={exporting !== null}
                title="Export directly to Google Slides (requires Google sign-in)"
              >
                {exporting === 'google' ? 'Uploading…' : '⬇ Google Slides'}
              </button>
            </div>
            {exportMsg && (
              <div style={{
                fontSize: 12,
                color: exportMsg.startsWith('Opened') || exportMsg === 'Downloaded!' ? 'var(--teal)' : '#D97706',
                textAlign: 'center',
                marginTop: 2,
                lineHeight: 1.4,
                padding: '0 8px',
              }}>
                {exportMsg}
              </div>
            )}
            {saveMsg && !saving && (
              <div style={{
                fontSize: 13,
                color: saveMsg === 'Saved!' ? 'var(--teal)' : '#DC2626',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: 4,
              }}>
                {saveMsg}
                {saveMsg === 'Saved!' && (
                  <> <button type="button" className="slide-free-cta" onClick={handleSaveNew}>Save as new →</button></>
                )}
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
