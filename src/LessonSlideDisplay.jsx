import { useEffect } from 'react';

const THEMES = {
  calm: {
    bg: '#ffffff',
    text: '#1B2D5B',
    muted: '#6B7280',
    accent: '#2D7A6A',
    accentBg: 'rgba(45,122,106,0.08)',
    border: '#E5E7EB',
    stepNum: '#2D7A6A',
  },
  warm: {
    bg: '#FAF8F4',
    text: '#3B2A1A',
    muted: '#78624A',
    accent: '#B45309',
    accentBg: 'rgba(180,83,9,0.07)',
    border: '#E8DED0',
    stepNum: '#B45309',
  },
  bold: {
    bg: '#0A0F1E',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    accent: '#F5A623',
    accentBg: 'rgba(245,166,35,0.12)',
    border: 'rgba(255,255,255,0.12)',
    stepNum: '#F5A623',
  },
};

const LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

export default function LessonSlideDisplay({ slide, projectorMode = false, onExit }) {
  const t = THEMES[slide?.theme] || THEMES.calm;

  useEffect(() => {
    if (!projectorMode) return;
    const onKey = e => { if (e.key === 'Escape') onExit?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [projectorMode, onExit]);

  if (!slide) return null;

  const outcomes = (slide.outcomes || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps = (slide.steps || []).filter(Boolean);
  const lessonName = slide.lessonName || '';
  const learningTarget = slide.learningTarget || '';

  const wrapStyle = projectorMode ? {
    position: 'fixed', inset: 0, zIndex: 400,
    display: 'flex', flexDirection: 'column',
    background: t.bg, fontFamily: "'Outfit', sans-serif",
  } : {
    width: '100%', aspectRatio: '16/9',
    display: 'flex', flexDirection: 'column',
    background: t.bg, fontFamily: "'Outfit', sans-serif",
    borderRadius: 10, overflow: 'hidden',
    border: `1.5px solid ${t.border}`,
    minHeight: 0,
  };

  const pad = projectorMode ? 48 : 16;
  const ltSize = projectorMode ? 36 : 14;
  const contentSize = projectorMode ? 20 : 10;
  const stepSize = projectorMode ? 18 : 9.5;
  const stepNumSize = projectorMode ? 22 : 11;
  const labelSize = projectorMode ? 10 : 7;

  return (
    <div style={wrapStyle}>
      {/* Exit button — projector only */}
      {projectorMode && (
        <button
          type="button"
          onClick={onExit}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            padding: '8px 18px', background: 'rgba(0,0,0,0.4)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            minHeight: 44,
          }}
        >
          ✕ End Projection
        </button>
      )}

      {/* Lesson name header */}
      <div style={{
        padding: `${pad * 0.5}px ${pad}px`,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: projectorMode ? 16 : 8, fontWeight: 600, color: t.muted, letterSpacing: '0.03em' }}>
          {lessonName || 'Lesson Slide'}
        </span>
        <span style={{ fontSize: projectorMode ? 13 : 7, color: t.muted, opacity: 0.6 }}>
          {slide.subject && slide.grade ? `${slide.subject} · ${slide.grade}` : ''}
        </span>
      </div>

      {/* Learning target */}
      <div style={{
        padding: `${pad * 0.65}px ${pad}px`,
        borderBottom: `1px solid ${t.border}`,
        background: t.accentBg,
      }}>
        <div style={{ ...LABEL_STYLE, fontSize: labelSize, color: t.accent }}>Learning Target</div>
        <div style={{
          fontSize: ltSize, fontWeight: 700, color: t.text,
          lineHeight: 1.3, letterSpacing: '-0.01em',
        }}>
          {learningTarget || <span style={{ opacity: 0.3 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Outcomes + Expectations */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        flex: 1, minHeight: 0,
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ padding: `${pad * 0.55}px ${pad}px`, borderRight: `1px solid ${t.border}` }}>
          <div style={{ ...LABEL_STYLE, fontSize: labelSize, color: t.accent }}>Expected Outcomes</div>
          {outcomes.length > 0
            ? outcomes.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: projectorMode ? 10 : 5, marginBottom: projectorMode ? 10 : 5 }}>
                  <span style={{ color: t.accent, fontWeight: 700, flexShrink: 0, fontSize: contentSize }}>·</span>
                  <span style={{ fontSize: contentSize, color: t.text, lineHeight: 1.4 }}>{o}</span>
                </div>
              ))
            : <span style={{ fontSize: contentSize, color: t.muted, opacity: 0.5 }}>Outcomes will appear here</span>
          }
        </div>
        <div style={{ padding: `${pad * 0.55}px ${pad}px` }}>
          <div style={{ ...LABEL_STYLE, fontSize: labelSize, color: t.accent }}>Behavioral Expectations</div>
          {expectations.length > 0
            ? expectations.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: projectorMode ? 10 : 5, marginBottom: projectorMode ? 10 : 5 }}>
                  <span style={{ color: t.accent, fontWeight: 700, flexShrink: 0, fontSize: contentSize }}>·</span>
                  <span style={{ fontSize: contentSize, color: t.text, lineHeight: 1.4 }}>{e}</span>
                </div>
              ))
            : <span style={{ fontSize: contentSize, color: t.muted, opacity: 0.5 }}>Expectations will appear here</span>
          }
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: `${pad * 0.55}px ${pad}px` }}>
        <div style={{ ...LABEL_STYLE, fontSize: labelSize, color: t.accent }}>Steps</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: steps.length <= 3 ? `repeat(${steps.length || 1}, 1fr)` : 'repeat(3, 1fr)',
          gap: projectorMode ? '10px 20px' : '4px 10px',
        }}>
          {steps.length > 0
            ? steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: projectorMode ? 10 : 5 }}>
                  <span style={{
                    fontSize: stepNumSize, fontWeight: 800, color: t.stepNum,
                    lineHeight: 1.2, flexShrink: 0, minWidth: projectorMode ? 24 : 12,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: stepSize, color: t.text, lineHeight: 1.4 }}>{s}</span>
                </div>
              ))
            : <span style={{ fontSize: stepSize, color: t.muted, opacity: 0.5 }}>Steps will appear here</span>
          }
        </div>
      </div>
    </div>
  );
}
