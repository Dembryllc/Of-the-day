import { useEffect } from 'react';

// Scale helper: projector vs preview value
const s = (pm, big, small) => pm ? big : small;

// ── Brand mark ─────────────────────────────────────────────────────────────
function BrandMark({ pm, invert = false }) {
  const textCol = invert ? 'rgba(255,255,255,0.65)' : 'rgba(27,45,91,0.5)';
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

// Conceptual bullet — used for outcomes
function Bullet({ text, accent, textColor, size }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 900, fontSize: size * 1.05, lineHeight: 1.35, flexShrink: 0 }}>·</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// Behavioral check — used for expectations
function CheckBullet({ text, accent, textColor, size }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 800, fontSize: size * 0.9, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// Numbered circle badge — used for steps in Focus and Blocks
function CircleStep({ num, text, badgeBg, badgeText, textColor, size, pm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 10, 5) }}>
      <div style={{
        width: s(pm, 26, 14), height: s(pm, 26, 14), borderRadius: '50%',
        background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: s(pm, 12, 7), fontWeight: 800, color: badgeText,
        marginTop: s(pm, 1, 1),
      }}>{num}</div>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// Vertically centers content within available height
function VCenter({ children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', ...style }}>
      {children}
    </div>
  );
}

// ── FOCUS: Clear Focus ─────────────────────────────────────────────────────
// White bg. 3-section identity: outcomes (·), expectations (✓), steps (circles + teal tint).
// Thin teal left-border accent on LT signals precision and clarity.
function FocusLayout({ slide, pm }) {
  const p    = s(pm, 52, 18);
  const acc  = '#2D7A6A';
  const rule = '#ECEEF2';
  const bsz  = s(pm, 16, 11);
  const lsz  = s(pm, 9, 6);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);

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

      {/* Learning Target — left teal accent border signals precision */}
      <div style={{
        flexShrink: 0,
        padding: `${p * 0.48}px ${p}px ${p * 0.48}px ${p - 3}px`,
        borderBottom: `1.5px solid ${rule}`,
        borderLeft: `3px solid ${acc}`,
      }}>
        <div style={{ fontSize: s(pm, 9, 6), fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 10, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 38, 20), fontWeight: 800, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.18 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col grid — distinct visual identity per column */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Outcomes — conceptual bullet */}
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </VCenter>

        {/* Expectations — checkmark signals behavioral / action */}
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: `1px solid ${rule}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Expectations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </VCenter>

        {/* Steps — numbered circles + teal column tint signals procedure */}
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, background: '#F0FBF8' }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
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
// Warm cream bg. Three section columns with colored header bands for instant
// visual identity. LT anchored by an amber accent bar. Steps use large
// bold numbers — the focal point of the procedural column.
function SoftLayout({ slide, pm }) {
  const p   = s(pm, 36, 13);
  const bsz = s(pm, 15, 10);
  const lsz = s(pm, 9, 6);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: '#FAF8F4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${p * 0.28}px ${p}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #EDE7DB' }}>
        <span style={{ fontSize: s(pm, 13, 8), fontWeight: 800, color: '#5B3E2B', letterSpacing: '-0.01em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 14, 8) }}>
          <span style={{ fontSize: s(pm, 11, 6.5), color: '#A89080' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} />
        </div>
      </div>

      {/* Learning Target — warm field, amber bottom border as the anchor line */}
      <div style={{
        flexShrink: 0,
        padding: `${p * 0.45}px ${p}px`,
        background: '#FFFBF5',
        borderBottom: `3px solid #F5A623`,
      }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B45309', marginBottom: s(pm, 10, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 30, 17), fontWeight: 800, color: '#3B2A1A', lineHeight: 1.2, letterSpacing: '-0.015em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col sections — colored header bands give instant visual identity */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

        {/* Outcomes — amber band */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #EDE7DB', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 9, 4.5)}px ${p}px`, background: '#FEF3C7', borderBottom: '1px solid #FDE68A' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#92400E' }}>
              Outcomes
            </span>
          </div>
          <VCenter style={{ flex: 1, padding: `${p * 0.3}px ${p}px` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 11, 6) }}>
              {outcomes.map((o, i) => <Bullet key={i} text={o} accent="#D97706" textColor="#3B2A1A" size={bsz} />)}
            </div>
          </VCenter>
        </div>

        {/* Expectations — lavender band + checkmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #EDE7DB', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 9, 4.5)}px ${p}px`, background: '#EDE9FE', borderBottom: '1px solid #D5C8F0' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5B21B6' }}>
              Expectations
            </span>
          </div>
          <VCenter style={{ flex: 1, padding: `${p * 0.3}px ${p}px` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 11, 6) }}>
              {expectations.map((e, i) => <CheckBullet key={i} text={e} accent="#7C3AED" textColor="#3B2A1A" size={bsz} />)}
            </div>
          </VCenter>
        </div>

        {/* Steps — sage green band + large bold numbers as focal point */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 9, 4.5)}px ${p}px`, background: '#DCFCE7', borderBottom: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#166534' }}>
              Steps
            </span>
          </div>
          <VCenter style={{ flex: 1, padding: `${p * 0.3}px ${p}px` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 10, 5) }}>
              {steps.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 10, 5) }}>
                  <span style={{
                    fontWeight: 900, fontSize: s(pm, 26, 14), color: '#16A34A',
                    lineHeight: 1, flexShrink: 0, minWidth: s(pm, 28, 16),
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
// PASS — no redesign. Deep navy + full-width teal LT band + circle step badges.
function BlocksLayout({ slide, pm }) {
  const p   = s(pm, 48, 16);
  const acc = '#4DB896';
  const bsz = s(pm, 16.5, 11);
  const lsz = s(pm, 9, 6);
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

      {/* Full-width teal LT band */}
      <div style={{ flexShrink: 0, padding: `${p * 0.42}px ${p}px`, background: '#1A7A68' }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: s(pm, 10, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 34, 19), fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.3 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Outcomes + Expectations */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px`, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </VCenter>
        <VCenter style={{ padding: `${p * 0.3}px ${p}px` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Expectations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </VCenter>
      </div>

      {/* Steps */}
      <div style={{ flexShrink: 0, padding: `${p * 0.35}px ${p}px`, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 10, 5) }}>Steps</div>
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
// Near-black base. Elevated glass cards (10% opacity, visible borders).
// Accent switched to #22D3EE cyan — clearly distinct from Soft Structure purple.
// Steps rendered as a full glass card at the bottom, not inline chips.
function DepthLayout({ slide, pm }) {
  const p   = s(pm, 38, 13);
  const g   = s(pm, 10, 5);
  const acc = '#22D3EE';
  const bsz = s(pm, 16, 10.5);
  const lsz = s(pm, 9, 6);
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
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

      {/* LT glass card — cyan left border + subtle tinted bg */}
      <div style={{
        ...card,
        flexShrink: 0, justifyContent: 'flex-start',
        borderLeft: `3px solid ${acc}`,
        background: 'rgba(34,211,238,0.06)',
        border: `1px solid rgba(34,211,238,0.25)`,
        borderLeftWidth: 3,
      }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 10, 5) }}>
          Learning Target
        </div>
        <div style={{ fontSize: s(pm, 30, 16), fontWeight: 700, color: '#FFFFFF', lineHeight: 1.22, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* Bento: outcomes (wider) + expectations */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: g }}>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Outcomes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.85)" size={bsz} />)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 12, 6) }}>Expectations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(pm, 12, 6) }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.85)" size={bsz} />)}
          </div>
        </div>
      </div>

      {/* Steps — full-width glass card at bottom (not chips) */}
      <div style={{ ...card, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: s(pm, 24, 10), justifyContent: 'flex-start' }}>
        <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, flexShrink: 0 }}>
          Steps
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(pm, 16, 7), alignItems: 'center' }}>
          {steps.map((st, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: s(pm, 8, 4) }}>
              <div style={{
                width: s(pm, 24, 12), height: s(pm, 24, 12), borderRadius: '50%',
                background: acc, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: s(pm, 11, 6.5), fontWeight: 800, color: '#070C18',
              }}>{i + 1}</div>
              <span style={{ fontSize: s(pm, 14, 8.5), color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>{st}</span>
              {i < steps.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: s(pm, 14, 8), marginLeft: s(pm, 4, 2) }}>→</span>
              )}
            </div>
          ))}
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
