import { useEffect } from 'react';

// Scale helper: projector vs preview value
const s = (pm, big, small) => pm ? big : small;

// ── Brand mark ─────────────────────────────────────────────────────────────
function BrandMark({ pm, invert = false }) {
  const textCol = invert ? 'rgba(255,255,255,0.95)' : 'rgba(27,45,91,0.85)';
  const borderCol = invert ? 'rgba(255,255,255,0.2)' : 'rgba(27,45,91,0.15)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: s(pm, 10, 4),
      flexShrink: 0,
      border: `${s(pm, 2, 1)}px solid ${borderCol}`,
      borderRadius: 999,
      padding: `${s(pm, 8, 2.5)}px ${s(pm, 20, 6)}px`,
    }}>
      <span style={{ fontSize: s(pm, 26, 9), color: '#F5A623', lineHeight: 1 }}>●</span>
      <span style={{
        fontSize: s(pm, 36, 12), fontWeight: 800, color: textCol,
        letterSpacing: '0.04em', textTransform: 'lowercase', fontFamily: "'Outfit',sans-serif",
      }}>of the day</span>
    </div>
  );
}

// ── Shared micro-components ────────────────────────────────────────────────

function Bullet({ text, accent, textColor, size }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 900, fontSize: size * 1.05, lineHeight: 1.35, flexShrink: 0 }}>·</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function CheckBullet({ text, accent, textColor, size }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 800, fontSize: size * 0.9, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function CircleStep({ num, text, badgeBg, badgeText, textColor, size, pm }) {
  const dim = s(pm, 48, 14);
  const fz  = s(pm, 22, 7);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 16, 5) }}>
      <div style={{
        width: dim, height: dim, borderRadius: '50%',
        background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: fz, fontWeight: 800, color: badgeText,
        marginTop: s(pm, 2, 1),
      }}>{num}</div>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function VCenter({ children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', ...style }}>
      {children}
    </div>
  );
}

// ── FOCUS: Clear Focus ─────────────────────────────────────────────────────
function FocusLayout({ slide, pm }) {
  const p    = s(pm, 72, 18);
  const acc  = '#2D7A6A';
  const rule = '#ECEEF2';
  const bsz  = s(pm, 32, 11);
  const lsz  = s(pm, 16, 6);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${p * 0.28}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1.5px solid ${rule}` }}>
        <span style={{ fontSize: s(pm, 22, 7.5), fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 24, 9) }}>
          <span style={{ fontSize: s(pm, 20, 6.5), color: '#C0C5CF' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} />
        </div>
      </div>

      {/* Learning Target */}
      <div style={{
        flexShrink: 0,
        padding: `${p * 0.48}px ${p}px ${p * 0.48}px ${p - 3}px`,
        borderBottom: `1.5px solid ${rule}`,
        borderLeft: `${s(pm, 5, 3)}px solid ${acc}`,
      }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 14, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 66, 20), fontWeight: 800, color: '#111827', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.18 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col grid */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </VCenter>

        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Expectations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </VCenter>

        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, background: '#F0FBF8' }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {steps.map((st, i) => (
              <CircleStep key={i} num={i + 1} text={st}
                badgeBg={acc} badgeText="#fff"
                textColor="#1E3A32" size={bsz} pm={pm}
              />
            ))}
          </div>
        </VCenter>
      </div>
    </div>
  );
}

// ── SOFT: Soft Structure ───────────────────────────────────────────────────
function SoftLayout({ slide, pm }) {
  const p   = s(pm, 68, 13);
  const bsz = s(pm, 32, 10);
  const lsz = s(pm, 16, 6);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#FAF8F4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${p * 0.28}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #EDE7DB' }}>
        <span style={{ fontSize: s(pm, 24, 8), fontWeight: 800, color: '#5B3E2B', letterSpacing: '-0.01em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 24, 8) }}>
          <span style={{ fontSize: s(pm, 20, 6.5), color: '#A89080' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} />
        </div>
      </div>

      {/* Learning Target — amber anchor line */}
      <div style={{
        flexShrink: 0,
        padding: `${p * 0.42}px ${p}px`,
        background: '#FFFBF5',
        borderBottom: `${s(pm, 4, 3)}px solid #F5A623`,
      }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B45309', marginBottom: s(pm, 14, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 64, 17), fontWeight: 800, color: '#3B2A1A', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col sections — colored header bands */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Outcomes — amber */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #EDE7DB', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 18, 4.5)}px ${p}px`, background: '#FEF3C7', borderBottom: '1px solid #FDE68A' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#92400E' }}>Outcomes</span>
          </div>
          <VCenter style={{ flex: 1, padding: `${p * 0.3}px ${p}px` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
              {outcomes.map((o, i) => <Bullet key={i} text={o} accent="#D97706" textColor="#3B2A1A" size={bsz} />)}
            </div>
          </VCenter>
        </div>

        {/* Expectations — lavender + checkmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #EDE7DB', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 18, 4.5)}px ${p}px`, background: '#EDE9FE', borderBottom: '1px solid #D5C8F0' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5B21B6' }}>Expectations</span>
          </div>
          <VCenter style={{ flex: 1, padding: `${p * 0.3}px ${p}px` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
              {expectations.map((e, i) => <CheckBullet key={i} text={e} accent="#7C3AED" textColor="#3B2A1A" size={bsz} />)}
            </div>
          </VCenter>
        </div>

        {/* Steps — sage green + large bold numbers */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 18, 4.5)}px ${p}px`, background: '#DCFCE7', borderBottom: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#166534' }}>Steps</span>
          </div>
          <VCenter style={{ flex: 1, padding: `${p * 0.3}px ${p}px` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 18, 5) }}>
              {steps.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 16, 5) }}>
                  <span style={{
                    fontWeight: 900, fontSize: s(pm, 64, 14), color: '#16A34A',
                    lineHeight: 1, flexShrink: 0, minWidth: s(pm, 56, 16),
                  }}>{i + 1}</span>
                  <span style={{ fontSize: bsz, color: '#3B2A1A', lineHeight: 1.4 }}>{st}</span>
                </div>
              ))}
            </div>
          </VCenter>
        </div>
      </div>
    </div>
  );
}

// ── BLOCKS: Bold Blocks ────────────────────────────────────────────────────
function BlocksLayout({ slide, pm }) {
  const p   = s(pm, 68, 16);
  const acc = '#4DB896';
  const bsz = s(pm, 32, 11);
  const lsz = s(pm, 16, 6);
  const rule = 'rgba(255,255,255,0.07)';
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0D1B3E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${p * 0.28}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: s(pm, 22, 7.5), fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 24, 8) }}>
          <span style={{ fontSize: s(pm, 20, 6.5), color: 'rgba(255,255,255,0.3)' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} invert />
        </div>
      </div>

      {/* Full-width teal LT band */}
      <div style={{ flexShrink: 0, padding: `${p * 0.42}px ${p}px`, background: '#1A7A68' }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: s(pm, 14, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 62, 19), fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.3 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col grid: Outcomes | Expectations | Steps */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </VCenter>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Expectations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </VCenter>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {steps.map((st, i) => (
              <CircleStep key={i} num={i + 1} text={st}
                badgeBg={acc} badgeText="#0D1B3E"
                textColor="rgba(255,255,255,0.85)" size={bsz} pm={pm}
              />
            ))}
          </div>
        </VCenter>
      </div>
    </div>
  );
}

// ── DEPTH: Layered Depth ───────────────────────────────────────────────────
function DepthLayout({ slide, pm }) {
  const p   = s(pm, 60, 13);
  const g   = s(pm, 16, 5);
  const acc = '#22D3EE';
  const bsz = s(pm, 30, 10.5);
  const lsz = s(pm, 16, 6);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: s(pm, 16, 6),
    padding: `${s(pm, 28, 8)}px ${s(pm, 32, 10)}px`,
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
        <span style={{ fontSize: s(pm, 22, 7.5), fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 24, 8) }}>
          <span style={{ fontSize: s(pm, 18, 6.5), color: 'rgba(255,255,255,0.3)' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} invert />
        </div>
      </div>

      {/* LT glass card */}
      <div style={{
        ...card,
        flexShrink: 0, justifyContent: 'flex-start',
        borderLeft: `${s(pm, 5, 3)}px solid ${acc}`,
        background: 'rgba(34,211,238,0.06)',
        border: `1px solid rgba(34,211,238,0.25)`,
        borderLeftWidth: s(pm, 5, 3),
      }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 14, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 58, 16), fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3 glass cards: Outcomes | Expectations | Steps */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: g }}>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.85)" size={bsz} />)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Expectations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.85)" size={bsz} />)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 20, 6) }}>Steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 20, 6) }}>
            {steps.map((st, i) => (
              <CircleStep key={i} num={i + 1} text={st}
                badgeBg={acc} badgeText="#070C18"
                textColor="rgba(255,255,255,0.85)" size={bsz} pm={pm}
              />
            ))}
          </div>
        </div>
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
            position: 'absolute', top: 20, right: 20, zIndex: 10,
            padding: '12px 24px', background: 'rgba(0,0,0,0.55)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 10, fontSize: 18, fontWeight: 600, cursor: 'pointer', minHeight: 48,
          }}
        >
          ✕ End Projection
        </button>
      )}
      <Layout slide={slide} pm={projectorMode} />
    </div>
  );
}
