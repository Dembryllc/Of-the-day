import { useEffect } from 'react';

// Scale helper: projector vs preview value
const s = (pm, big, small) => pm ? big : small;

// ── Shared micro-components ────────────────────────────────────────────────

function Label({ text, color, size }) {
  return (
    <div style={{
      fontSize: size, fontWeight: 800, letterSpacing: '0.11em',
      textTransform: 'uppercase', color, marginBottom: size * 1.4,
    }}>
      {text}
    </div>
  );
}

function Bullet({ text, accent, textColor, size, pm }) {
  return (
    <div style={{ display: 'flex', gap: s(pm, 8, 3), marginBottom: s(pm, 9, 3.5), alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 800, fontSize: size * 1.1, lineHeight: 1.25, flexShrink: 0 }}>·</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function NumStep({ num, text, accent, textColor, size, pm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 8, 3), marginBottom: s(pm, 9, 3.5) }}>
      <span style={{
        fontWeight: 900, fontSize: size * 1.2, color: accent,
        lineHeight: 1.15, flexShrink: 0, minWidth: s(pm, 22, 11),
      }}>{num}</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// ── FOCUS: Clear Focus ─────────────────────────────────────────────────────
// Oversized learning target dominates. Whitespace is the hierarchy signal.
// 3-column grid below. No fills — weight and spacing do all the work.
function FocusLayout({ slide, pm }) {
  const p = s(pm, 52, 14);
  const acc = '#2D7A6A';
  const rule = '#ECEEF2';
  const outcomes = (slide.outcomes || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps = (slide.steps || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Slim header bar */}
      <div style={{ padding: `${p * 0.35}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1.5px solid ${rule}` }}>
        <span style={{ fontSize: s(pm, 12, 7), fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <span style={{ fontSize: s(pm, 11, 6.5), color: '#C0C5CF' }}>
          {[slide.subject, slide.grade].filter(Boolean).join(' · ')}
        </span>
      </div>

      {/* Learning target — oversized, takes ~38% of slide */}
      <div style={{ padding: `${p * 0.62}px ${p}px ${p * 0.5}px`, borderBottom: `1.5px solid ${rule}` }}>
        <Label text="Learning Target" color={acc} size={s(pm, 9, 5.5)} />
        <div style={{ fontSize: s(pm, 40, 15), fontWeight: 800, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.18 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3 equal columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, minHeight: 0 }}>
        <div style={{ padding: `${p * 0.45}px ${p}px`, borderRight: `1px solid ${rule}`, overflow: 'hidden' }}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 5.5)} />
          {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#374151" size={s(pm, 16, 8)} pm={pm} />)}
        </div>
        <div style={{ padding: `${p * 0.45}px ${p}px`, borderRight: `1px solid ${rule}`, overflow: 'hidden' }}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 5.5)} />
          {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="#374151" size={s(pm, 16, 8)} pm={pm} />)}
        </div>
        <div style={{ padding: `${p * 0.45}px ${p}px`, overflow: 'hidden' }}>
          <Label text="Steps" color={acc} size={s(pm, 9, 5.5)} />
          {steps.map((st, i) => <NumStep key={i} num={i + 1} text={st} accent={acc} textColor="#374151" size={s(pm, 16, 8)} pm={pm} />)}
        </div>
      </div>
    </div>
  );
}

// ── SOFT: Soft Structure ───────────────────────────────────────────────────
// Warm-to-lavender gradient bg. All sections in rounded white cards.
// Steps as horizontal pill badges. High contrast despite soft palette.
function SoftLayout({ slide, pm }) {
  const p = s(pm, 36, 11);
  const g = s(pm, 12, 4);
  const acc = '#7C65C0';
  const outcomes = (slide.outcomes || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps = (slide.steps || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.88)',
    borderRadius: s(pm, 14, 6),
    border: '1.5px solid rgba(124,101,192,0.14)',
    padding: `${s(pm, 18, 7)}px ${s(pm, 20, 8)}px`,
    boxShadow: '0 1px 8px rgba(90,70,160,0.07)',
    overflow: 'hidden',
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(148deg,#FDF8F2 0%,#EDE7F8 100%)', display: 'flex', flexDirection: 'column', padding: p, gap: g, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: s(pm, 14, 7), fontWeight: 700, color: '#5E4A9E', letterSpacing: '0.01em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <span style={{ fontSize: s(pm, 12, 6), color: '#9D8EC9' }}>
          {[slide.subject, slide.grade].filter(Boolean).join(' · ')}
        </span>
      </div>

      {/* LT card */}
      <div style={{ ...card, flexShrink: 0 }}>
        <Label text="Learning Target" color={acc} size={s(pm, 9, 5)} />
        <div style={{ fontSize: s(pm, 28, 12), fontWeight: 700, color: '#2D1B5E', lineHeight: 1.25, letterSpacing: '-0.015em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Outcomes + Expectations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: g, flex: 1, minHeight: 0 }}>
        <div style={card}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 5)} />
          {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#2D1B5E" size={s(pm, 15.5, 8)} pm={pm} />)}
        </div>
        <div style={card}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 5)} />
          {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="#2D1B5E" size={s(pm, 15.5, 8)} pm={pm} />)}
        </div>
      </div>

      {/* Steps as pill badges */}
      <div style={{ ...card, flexShrink: 0 }}>
        <Label text="Steps" color={acc} size={s(pm, 9, 5)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(pm, 10, 4) }}>
          {steps.map((st, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: s(pm, 7, 3),
              background: 'rgba(124,101,192,0.1)', border: '1.5px solid rgba(124,101,192,0.22)',
              borderRadius: s(pm, 100, 40), padding: `${s(pm, 7, 2.5)}px ${s(pm, 15, 5.5)}px`,
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 800, fontSize: s(pm, 14, 7), color: acc }}>{i + 1}</span>
              <span style={{ fontSize: s(pm, 14, 7), color: '#3D2878', lineHeight: 1.3 }}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BLOCKS: Bold Blocks ────────────────────────────────────────────────────
// Deep navy base. Full-width teal band for LT (bold color blocking).
// Numbered circle badges for steps. High-energy, elementary-appropriate.
function BlocksLayout({ slide, pm }) {
  const p = s(pm, 48, 14);
  const acc = '#4DB896';
  const outcomes = (slide.outcomes || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps = (slide.steps || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0D1B3E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: `${p * 0.32}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: s(pm, 12, 7), fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <span style={{ fontSize: s(pm, 11, 6), color: 'rgba(255,255,255,0.3)' }}>
          {[slide.subject, slide.grade].filter(Boolean).join(' · ')}
        </span>
      </div>

      {/* Full-width teal LT band */}
      <div style={{ padding: `${p * 0.55}px ${p}px`, background: '#1A7A68' }}>
        <Label text="Learning Target" color="rgba(255,255,255,0.6)" size={s(pm, 9, 5.5)} />
        <div style={{ fontSize: s(pm, 36, 14), fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.3 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Outcomes + Expectations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
        <div style={{ padding: `${p * 0.48}px ${p}px`, borderRight: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 5.5)} />
          {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.87)" size={s(pm, 16.5, 8.5)} pm={pm} />)}
        </div>
        <div style={{ padding: `${p * 0.48}px ${p}px`, overflow: 'hidden' }}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 5.5)} />
          {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.87)" size={s(pm, 16.5, 8.5)} pm={pm} />)}
        </div>
      </div>

      {/* Steps — circular number badges */}
      <div style={{ padding: `${p * 0.4}px ${p}px`, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
        <Label text="Steps" color={acc} size={s(pm, 9, 5.5)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(pm, 18, 6) }}>
          {steps.map((st, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 10, 4), maxWidth: s(pm, 280, 105) }}>
              <div style={{
                width: s(pm, 30, 13), height: s(pm, 30, 13), borderRadius: '50%',
                background: acc, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: s(pm, 14, 6.5), fontWeight: 800, color: '#0D1B3E',
              }}>{i + 1}</div>
              <span style={{ fontSize: s(pm, 15.5, 8), color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, paddingTop: s(pm, 4, 1) }}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DEPTH: Layered Depth ───────────────────────────────────────────────────
// Very dark base. Glass-card panels (no blur — just translucent bg + border).
// Bento asymmetry: outcomes 3fr, expectations 2fr.
// Steps as inline numbered chips at bottom.
function DepthLayout({ slide, pm }) {
  const p = s(pm, 38, 11);
  const g = s(pm, 10, 4);
  const acc = '#7D6AFF';
  const outcomes = (slide.outcomes || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps = (slide.steps || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: s(pm, 12, 5),
    padding: `${s(pm, 18, 7)}px ${s(pm, 20, 8)}px`,
    overflow: 'hidden',
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#070C18', display: 'flex', flexDirection: 'column', padding: p, gap: g, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: s(pm, 11, 6.5), fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <span style={{ fontSize: s(pm, 10, 6), color: 'rgba(255,255,255,0.3)' }}>
          {[slide.subject, slide.grade].filter(Boolean).join(' · ')}
        </span>
      </div>

      {/* LT glass card with left accent border */}
      <div style={{ ...card, borderLeft: `3px solid ${acc}`, flexShrink: 0 }}>
        <Label text="Learning Target" color={acc} size={s(pm, 9, 5)} />
        <div style={{ fontSize: s(pm, 32, 13), fontWeight: 700, color: '#FFFFFF', lineHeight: 1.22, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Bento: outcomes (wider) + expectations (narrower) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: g, flex: 1, minHeight: 0 }}>
        <div style={card}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 5)} />
          {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.82)" size={s(pm, 16, 8)} pm={pm} />)}
        </div>
        <div style={card}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 5)} />
          {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.82)" size={s(pm, 16, 8)} pm={pm} />)}
        </div>
      </div>

      {/* Steps as numbered chips — inline at bottom */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(pm, 8, 3), alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: s(pm, 9, 5.5), fontWeight: 800, color: acc, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: s(pm, 4, 2) }}>
          Steps
        </span>
        {steps.map((st, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: s(pm, 6, 2.5),
            background: 'rgba(125,106,255,0.14)', border: '1px solid rgba(125,106,255,0.32)',
            borderRadius: s(pm, 100, 40), padding: `${s(pm, 6, 2.5)}px ${s(pm, 14, 5)}px`,
          }}>
            <span style={{ fontWeight: 800, fontSize: s(pm, 13, 6.5), color: acc }}>{i + 1}</span>
            <span style={{ fontSize: s(pm, 13, 6.5), color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{st}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
// Backward-compat aliases so saved slides with old theme names still render
const ALIAS = { calm: 'focus', warm: 'soft', bold: 'blocks' };
const LAYOUTS = { focus: FocusLayout, soft: SoftLayout, blocks: BlocksLayout, depth: DepthLayout };

export default function LessonSlideDisplay({ slide, projectorMode = false, onExit }) {
  useEffect(() => {
    if (!projectorMode) return;
    const handler = e => { if (e.key === 'Escape') onExit?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [projectorMode, onExit]);

  if (!slide) return null;

  const themeKey = ALIAS[slide.theme] || slide.theme || 'focus';
  const Layout = LAYOUTS[themeKey] || FocusLayout;

  const wrapStyle = projectorMode
    ? { position: 'fixed', inset: 0, zIndex: 400, fontFamily: "'Outfit',sans-serif" }
    : {
        width: '100%', aspectRatio: '16/9',
        fontFamily: "'Outfit',sans-serif",
        borderRadius: 10, overflow: 'hidden',
        border: '1.5px solid #E5E7EB', minHeight: 0,
      };

  return (
    <div style={wrapStyle}>
      {projectorMode && (
        <button
          type="button"
          onClick={onExit}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            padding: '8px 18px', background: 'rgba(0,0,0,0.5)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44,
          }}
        >
          ✕ End Projection
        </button>
      )}
      <Layout slide={slide} pm={projectorMode} />
    </div>
  );
}
