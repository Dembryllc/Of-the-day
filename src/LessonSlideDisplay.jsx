import { useEffect } from 'react';

// Scale helper: projector vs preview value
const s = (pm, big, small) => pm ? big : small;

// ── Brand mark ─────────────────────────────────────────────────────────────
function BrandMark({ pm, invert = false }) {
  const textCol = invert ? 'rgba(255,255,255,0.7)' : 'rgba(27,45,91,0.55)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 5, 3), flexShrink: 0 }}>
      <span style={{ fontSize: s(pm, 10, 7), color: '#F5A623', lineHeight: 1 }}>●</span>
      <span style={{
        fontSize: s(pm, 12, 8), fontWeight: 800, color: textCol,
        letterSpacing: '0.06em', textTransform: 'lowercase', fontFamily: "'Outfit',sans-serif",
      }}>of the day</span>
    </div>
  );
}

// ── Shared micro-components ────────────────────────────────────────────────

function Label({ text, color, size }) {
  return (
    <div style={{
      fontSize: size, fontWeight: 800, letterSpacing: '0.1em',
      textTransform: 'uppercase', color, marginBottom: size * 1.4,
    }}>{text}</div>
  );
}

// Bullet with no own marginBottom — parent uses gap
function Bullet({ text, accent, textColor, size }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 800, fontSize: size * 1.1, lineHeight: 1.3, flexShrink: 0 }}>·</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function CircleStep({ num, text, accent, bg, textColor, size, pm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 10, 5) }}>
      <div style={{
        width: s(pm, 26, 14), height: s(pm, 26, 14), borderRadius: '50%',
        background: bg || accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: s(pm, 12, 7), fontWeight: 800, color: '#fff',
        marginTop: s(pm, 1, 1),
      }}>{num}</div>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// Wrapper that vertically centers its children within available height
function VCenter({ children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', ...style }}>
      {children}
    </div>
  );
}

// ── FOCUS: Clear Focus ─────────────────────────────────────────────────────
function FocusLayout({ slide, pm }) {
  const p   = s(pm, 52, 18);
  const acc = '#2D7A6A';
  const rule = '#ECEEF2';
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);
  const bsz = s(pm, 16, 11);  // bullet/step font size

  return (
    <div style={{ width: '100%', height: '100%', background: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${p * 0.28}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1.5px solid ${rule}` }}>
        <span style={{ fontSize: s(pm, 12, 7.5), fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 16, 9) }}>
          <span style={{ fontSize: s(pm, 11, 6.5), color: '#C0C5CF' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} />
        </div>
      </div>

      {/* Learning Target — shrinks to content, centered vertically */}
      <div style={{ flexShrink: 0, padding: `${p * 0.5}px ${p}px`, borderBottom: `1.5px solid ${rule}` }}>
        <Label text="Learning Target" color={acc} size={s(pm, 9, 6)} />
        <div style={{ fontSize: s(pm, 38, 20), fontWeight: 800, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.18 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col grid — expands to fill remainder, content centered in each col */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </VCenter>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </VCenter>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px` }}>
          <Label text="Steps" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {steps.map((st, i) => <CircleStep key={i} num={i + 1} text={st} accent={acc} bg={acc} textColor="#374151" size={bsz} pm={pm} />)}
          </div>
        </VCenter>
      </div>
    </div>
  );
}

// ── SOFT: Soft Structure ───────────────────────────────────────────────────
function SoftLayout({ slide, pm }) {
  const p   = s(pm, 36, 13);
  const g   = s(pm, 12, 5);
  const acc = '#7C65C0';
  const bsz = s(pm, 15.5, 10);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.88)',
    borderRadius: s(pm, 14, 7),
    border: '1.5px solid rgba(124,101,192,0.14)',
    padding: `${s(pm, 18, 8)}px ${s(pm, 20, 10)}px`,
    boxShadow: '0 1px 8px rgba(90,70,160,0.07)',
    overflow: 'hidden',
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(148deg,#FDF8F2 0%,#EDE7F8 100%)',
      display: 'flex', flexDirection: 'column',
      padding: p, gap: g, overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: s(pm, 14, 8), fontWeight: 700, color: '#5E4A9E' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 14, 8) }}>
          <span style={{ fontSize: s(pm, 12, 6.5), color: '#9D8EC9' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} />
        </div>
      </div>

      {/* LT card — shrinks to content */}
      <div style={{ ...card, flexShrink: 0 }}>
        <Label text="Learning Target" color={acc} size={s(pm, 9, 6)} />
        <div style={{ fontSize: s(pm, 26, 14), fontWeight: 700, color: '#2D1B5E', lineHeight: 1.25, letterSpacing: '-0.015em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Outcomes + Expectations — flex: 1, content centered within each card */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: g }}>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 11, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#2D1B5E" size={bsz} />)}
          </div>
        </div>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 11, 6) }}>
            {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="#2D1B5E" size={bsz} />)}
          </div>
        </div>
      </div>

      {/* Steps pills — shrinks to content */}
      <div style={{ ...card, flexShrink: 0 }}>
        <Label text="Steps" color={acc} size={s(pm, 9, 6)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(pm, 8, 4) }}>
          {steps.map((st, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: s(pm, 7, 3.5),
              background: 'rgba(124,101,192,0.1)', border: '1.5px solid rgba(124,101,192,0.22)',
              borderRadius: s(pm, 100, 50), padding: `${s(pm, 6, 3)}px ${s(pm, 14, 7)}px`,
            }}>
              <span style={{ fontWeight: 800, fontSize: s(pm, 13, 8), color: acc }}>{i + 1}</span>
              <span style={{ fontSize: s(pm, 13, 8), color: '#3D2878', lineHeight: 1.3 }}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BLOCKS: Bold Blocks ────────────────────────────────────────────────────
function BlocksLayout({ slide, pm }) {
  const p   = s(pm, 48, 16);
  const acc = '#4DB896';
  const bsz = s(pm, 16.5, 11);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0D1B3E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${p * 0.28}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: s(pm, 12, 7.5), fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 14, 8) }}>
          <span style={{ fontSize: s(pm, 11, 6.5), color: 'rgba(255,255,255,0.3)' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} invert />
        </div>
      </div>

      {/* Full-width teal LT band — shrinks to content */}
      <div style={{ flexShrink: 0, padding: `${p * 0.42}px ${p}px`, background: '#1A7A68' }}>
        <Label text="Learning Target" color="rgba(255,255,255,0.65)" size={s(pm, 9, 6)} />
        <div style={{ fontSize: s(pm, 34, 19), fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.3 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Outcomes + Expectations — flex: 1, content centered within each col */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </VCenter>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px` }}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </VCenter>
      </div>

      {/* Steps — shrinks to content at bottom */}
      <div style={{ flexShrink: 0, padding: `${p * 0.35}px ${p}px`, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
        <Label text="Steps" color={acc} size={s(pm, 9, 6)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(pm, 18, 8) }}>
          {steps.map((st, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 10, 5), maxWidth: s(pm, 280, 130) }}>
              <div style={{
                width: s(pm, 28, 14), height: s(pm, 28, 14), borderRadius: '50%',
                background: acc, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: s(pm, 13, 7), fontWeight: 800, color: '#0D1B3E',
              }}>{i + 1}</div>
              <span style={{ fontSize: s(pm, 15, 9.5), color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, paddingTop: s(pm, 3, 1.5) }}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DEPTH: Layered Depth ───────────────────────────────────────────────────
function DepthLayout({ slide, pm }) {
  const p   = s(pm, 38, 13);
  const g   = s(pm, 10, 5);
  const acc = '#7D6AFF';
  const bsz = s(pm, 16, 10.5);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.11)',
    borderRadius: s(pm, 12, 6),
    padding: `${s(pm, 18, 8)}px ${s(pm, 20, 10)}px`,
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: '#070C18',
      display: 'flex', flexDirection: 'column',
      padding: p, gap: g, overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: s(pm, 11, 7.5), fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 14, 8) }}>
          <span style={{ fontSize: s(pm, 10, 6.5), color: 'rgba(255,255,255,0.3)' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} invert />
        </div>
      </div>

      {/* LT glass card — shrinks to content */}
      <div style={{ ...card, borderLeft: `3px solid ${acc}`, flexShrink: 0, justifyContent: 'flex-start' }}>
        <Label text="Learning Target" color={acc} size={s(pm, 9, 6)} />
        <div style={{ fontSize: s(pm, 30, 16), fontWeight: 700, color: '#FFFFFF', lineHeight: 1.22, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Bento: outcomes (wider) + expectations — flex: 1 */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: g }}>
        <div style={card}>
          <Label text="Outcomes" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.82)" size={bsz} />)}
          </div>
        </div>
        <div style={card}>
          <Label text="Expectations" color={acc} size={s(pm, 9, 6)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {expectations.map((e, i) => <Bullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.82)" size={bsz} />)}
          </div>
        </div>
      </div>

      {/* Steps chips — shrinks to content at bottom */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: s(pm, 8, 4) }}>
        <span style={{ fontSize: s(pm, 9, 6), fontWeight: 800, color: acc, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: s(pm, 4, 2), flexShrink: 0 }}>
          Steps
        </span>
        {steps.map((st, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: s(pm, 6, 3.5),
            background: 'rgba(125,106,255,0.15)', border: '1px solid rgba(125,106,255,0.34)',
            borderRadius: s(pm, 100, 50), padding: `${s(pm, 6, 3.5)}px ${s(pm, 14, 7)}px`,
          }}>
            <span style={{ fontWeight: 800, fontSize: s(pm, 12, 7.5), color: acc }}>{i + 1}</span>
            <span style={{ fontSize: s(pm, 13, 8), color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{st}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
const ALIAS   = { calm: 'focus', warm: 'soft', bold: 'blocks' };
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
  const Layout   = LAYOUTS[themeKey] || FocusLayout;

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
