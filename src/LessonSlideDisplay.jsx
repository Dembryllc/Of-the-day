import { useEffect } from 'react';

// Scale helper: projector vs preview value (accepts numbers OR CSS strings)
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
      <span style={{ color: accent, fontWeight: 900, fontSize: size, lineHeight: 1.35, flexShrink: 0 }}>·</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function CheckBullet({ text, accent, textColor, size }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontWeight: 800, fontSize: size, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: size, color: textColor, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function CircleStep({ num, text, badgeBg, badgeText, textColor, size, pm }) {
  const dim = s(pm, 'clamp(22px, 3vmin, 40px)', '13px');
  const fz  = s(pm, 'clamp(10px, 1.4vmin, 18px)', '7px');
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 'clamp(8px, 1.4vmin, 16px)', '5px') }}>
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

// ── FOCUS: Clear Focus ─────────────────────────────────────────────────────
function FocusLayout({ slide, pm }) {
  const p    = s(pm, 72, 18);
  const acc  = '#2D7A6A';
  const rule = '#ECEEF2';
  const bsz  = s(pm, 'clamp(16px, 2vmin, 30px)', '11px');
  const lsz  = s(pm, 'clamp(10px, 1.4vmin, 16px)', '6px');
  const igap = s(pm, 'clamp(8px, 1.4vmin, 20px)', '5px');
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
        <div style={{ fontSize: s(pm, 'clamp(28px, 4.5vmin, 60px)', '20px'), fontWeight: 800, color: '#111827', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.18 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col grid */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Outcomes — teal */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${rule}`, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: '#F0FBF8', borderBottom: `1px solid #C9EFE6` }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc }}>Outcomes</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="#374151" size={bsz} />)}
          </div>
        </div>

        {/* Expectations — blue */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${rule}`, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: '#EFF6FF', borderBottom: `1px solid #BFDBFE` }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E40AF' }}>Expectations</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent="#3B82F6" textColor="#374151" size={bsz} />)}
          </div>
        </div>

        {/* Steps — green */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: '#DCFCE7', borderBottom: `1px solid #BBF7D0` }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#166534' }}>Steps</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px`, background: '#F5FFFB' }}>
            {steps.map((st, i) => (
              <CircleStep key={i} num={i + 1} text={st}
                badgeBg={acc} badgeText="#fff"
                textColor="#1E3A32" size={bsz} pm={pm}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SOFT: Soft Structure ───────────────────────────────────────────────────
function SoftLayout({ slide, pm }) {
  const p   = s(pm, 68, 13);
  const bsz = s(pm, 'clamp(16px, 2vmin, 30px)', '11px');
  const lsz = s(pm, 'clamp(10px, 1.4vmin, 16px)', '6px');
  const igap = s(pm, 'clamp(8px, 1.4vmin, 20px)', '5px');
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
        <div style={{ fontSize: s(pm, 'clamp(28px, 4.5vmin, 58px)', '17px'), fontWeight: 800, color: '#3B2A1A', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col sections — colored header bands */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Outcomes — amber */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #EDE7DB', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: '#FEF3C7', borderBottom: '1px solid #FDE68A' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#92400E' }}>Outcomes</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent="#D97706" textColor="#3B2A1A" size={bsz} />)}
          </div>
        </div>

        {/* Expectations — lavender + checkmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #EDE7DB', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: '#EDE9FE', borderBottom: '1px solid #D5C8F0' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5B21B6' }}>Expectations</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent="#7C3AED" textColor="#3B2A1A" size={bsz} />)}
          </div>
        </div>

        {/* Steps — sage green + large bold numbers */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: '#DCFCE7', borderBottom: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#166534' }}>Steps</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {steps.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: s(pm, 'clamp(8px, 1.4vmin, 16px)', '5px') }}>
                <span style={{
                  fontWeight: 900, fontSize: s(pm, 'clamp(26px, 4vmin, 52px)', '14px'), color: '#16A34A',
                  lineHeight: 1, flexShrink: 0, minWidth: s(pm, 'clamp(22px, 3.5vmin, 44px)', '16px'),
                }}>{i + 1}</span>
                <span style={{ fontSize: bsz, color: '#3B2A1A', lineHeight: 1.4 }}>{st}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BLOCKS: Bold Blocks ────────────────────────────────────────────────────
function BlocksLayout({ slide, pm }) {
  const p   = s(pm, 68, 16);
  const acc = '#4DB896';
  const bsz = s(pm, 'clamp(16px, 2vmin, 30px)', '11px');
  const lsz = s(pm, 'clamp(10px, 1.4vmin, 16px)', '6px');
  const igap = s(pm, 'clamp(8px, 1.4vmin, 20px)', '5px');
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
        <div style={{ fontSize: s(pm, 'clamp(26px, 4.5vmin, 58px)', '19px'), fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.3 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3-col grid */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Outcomes */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${rule}`, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: 'rgba(77,184,150,0.14)', borderBottom: `1px solid rgba(77,184,150,0.22)` }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc }}>Outcomes</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </div>

        {/* Expectations */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${rule}`, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: 'rgba(77,184,150,0.14)', borderBottom: `1px solid rgba(77,184,150,0.22)` }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc }}>Expectations</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px` }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.87)" size={bsz} />)}
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: `${s(pm, 22, 5)}px ${p}px`, background: 'rgba(77,184,150,0.14)', borderBottom: `1px solid rgba(77,184,150,0.22)` }}>
            <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc }}>Steps</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${p * 0.25}px ${p}px`, background: 'rgba(0,0,0,0.15)' }}>
            {steps.map((st, i) => (
              <CircleStep key={i} num={i + 1} text={st}
                badgeBg={acc} badgeText="#0D1B3E"
                textColor="rgba(255,255,255,0.85)" size={bsz} pm={pm}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DEPTH: Layered Depth ───────────────────────────────────────────────────
function DepthLayout({ slide, pm }) {
  const p   = s(pm, 60, 13);
  const g   = s(pm, 16, 5);
  const acc = '#22D3EE';
  const bsz = s(pm, 'clamp(16px, 2vmin, 30px)', '11px');
  const lsz = s(pm, 'clamp(10px, 1.4vmin, 16px)', '6px');
  const igap = s(pm, 'clamp(8px, 1.4vmin, 20px)', '5px');
  const outcomes     = (slide.outcomes     || []).filter(Boolean);
  const expectations = (slide.expectations || []).filter(Boolean);
  const steps        = (slide.steps        || []).filter(Boolean);
  const card = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: s(pm, 16, 6),
    padding: `${s(pm, 28, 8)}px ${s(pm, 32, 10)}px`,
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
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
        <div style={{ fontSize: s(pm, 'clamp(24px, 4vmin, 54px)', '16px'), fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {slide.learningTarget || <span style={{ opacity: 0.2 }}>Learning target will appear here</span>}
        </div>
      </div>

      {/* 3 glass cards: Outcomes | Expectations | Steps */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: g }}>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 16, 5) }}>Outcomes</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap }}>
            {outcomes.map((o, i) => <Bullet key={i} text={o} accent={acc} textColor="rgba(255,255,255,0.85)" size={bsz} />)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 16, 5) }}>Expectations</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap }}>
            {expectations.map((e, i) => <CheckBullet key={i} text={e} accent={acc} textColor="rgba(255,255,255,0.85)" size={bsz} />)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: acc, marginBottom: s(pm, 16, 5) }}>Steps</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap }}>
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

// ── INSTRUCTIONAL SLIDE (new format) ─────────────────────────────────────
const INSTR_THEMES = {
  focus: {
    bg: '#FFFFFF', divider: '#ECEEF2', invert: false,
    ltBg: '#F4FDFA', ltAccent: '#2D7A6A', ltLabel: '#2D7A6A', ltText: '#111827',
    eqBg: '#EFF6FF', eqLabel: '#1E40AF', eqText: '#1E3A8A',
    c1Hdr: '#DCF5EE', c1HdrBdr: '#B8EBD9', c1Label: '#2D7A6A', c1Accent: '#2D7A6A',
    c2Hdr: '#DBEAFE', c2HdrBdr: '#BFDBFE', c2Label: '#1D4ED8', c2Word: '#1D4ED8', c2Def: '#6B7280',
    tkHdr: '#FEF3C7', tkHdrBdr: '#FDE68A', tkLabel: '#92400E',
    dcHdr: '#F5F3FF', dcHdrBdr: '#DDD6FE', dcLabel: '#5B21B6',
    exHdr: '#DCFCE7', exHdrBdr: '#BBF7D0', exLabel: '#166534',
    body: '#374151',
  },
  soft: {
    bg: '#FAF8F4', divider: '#EDE7DB', invert: false,
    ltBg: '#FFFBF5', ltAccent: '#D97706', ltLabel: '#B45309', ltText: '#3B2A1A',
    eqBg: '#FEF9F0', eqLabel: '#92400E', eqText: '#7C3811',
    c1Hdr: '#FEF3C7', c1HdrBdr: '#FDE68A', c1Label: '#92400E', c1Accent: '#D97706',
    c2Hdr: '#EDE9FE', c2HdrBdr: '#D5C8F0', c2Label: '#5B21B6', c2Word: '#5B21B6', c2Def: '#78716C',
    tkHdr: '#DCFCE7', tkHdrBdr: '#BBF7D0', tkLabel: '#166534',
    dcHdr: '#EDE9FE', dcHdrBdr: '#D5C8F0', dcLabel: '#5B21B6',
    exHdr: '#FEF3C7', exHdrBdr: '#FDE68A', exLabel: '#92400E',
    body: '#3B2A1A',
  },
  blocks: {
    bg: '#0D1B3E', divider: 'rgba(255,255,255,0.1)', invert: true,
    ltBg: '#1A7A68', ltAccent: '#4DB896', ltLabel: 'rgba(255,255,255,0.7)', ltText: '#FFFFFF',
    eqBg: 'rgba(77,184,150,0.12)', eqLabel: '#4DB896', eqText: 'rgba(255,255,255,0.9)',
    c1Hdr: 'rgba(77,184,150,0.2)', c1HdrBdr: 'rgba(77,184,150,0.35)', c1Label: '#4DB896', c1Accent: '#4DB896',
    c2Hdr: 'rgba(77,184,150,0.15)', c2HdrBdr: 'rgba(77,184,150,0.25)', c2Label: '#4DB896', c2Word: '#4DB896', c2Def: 'rgba(255,255,255,0.55)',
    tkHdr: 'rgba(245,166,35,0.18)', tkHdrBdr: 'rgba(245,166,35,0.3)', tkLabel: '#F5A623',
    dcHdr: 'rgba(147,51,234,0.2)', dcHdrBdr: 'rgba(147,51,234,0.3)', dcLabel: '#C084FC',
    exHdr: 'rgba(34,197,94,0.18)', exHdrBdr: 'rgba(34,197,94,0.3)', exLabel: '#4ADE80',
    body: 'rgba(255,255,255,0.87)',
  },
  depth: {
    bg: '#070C18', divider: 'rgba(255,255,255,0.12)', invert: true,
    ltBg: 'rgba(34,211,238,0.07)', ltAccent: '#22D3EE', ltLabel: '#22D3EE', ltText: '#FFFFFF',
    eqBg: 'rgba(255,255,255,0.05)', eqLabel: 'rgba(34,211,238,0.8)', eqText: 'rgba(255,255,255,0.85)',
    c1Hdr: 'rgba(34,211,238,0.15)', c1HdrBdr: 'rgba(34,211,238,0.25)', c1Label: '#22D3EE', c1Accent: '#22D3EE',
    c2Hdr: 'rgba(255,255,255,0.08)', c2HdrBdr: 'rgba(255,255,255,0.14)', c2Label: '#22D3EE', c2Word: '#22D3EE', c2Def: 'rgba(255,255,255,0.5)',
    tkHdr: 'rgba(251,191,36,0.15)', tkHdrBdr: 'rgba(251,191,36,0.25)', tkLabel: '#FCD34D',
    dcHdr: 'rgba(167,139,250,0.15)', dcHdrBdr: 'rgba(167,139,250,0.25)', dcLabel: '#A78BFA',
    exHdr: 'rgba(52,211,153,0.15)', exHdrBdr: 'rgba(52,211,153,0.25)', exLabel: '#34D399',
    body: 'rgba(255,255,255,0.85)',
  },
};

function InstructionalSlide({ slide, pm }) {
  const themeKey = ALIAS[slide.theme] || slide.theme || 'focus';
  const c = INSTR_THEMES[themeKey] || INSTR_THEMES.focus;
  const hp  = s(pm, 56, 13);
  const bsz = s(pm, 'clamp(13px, 1.7vmin, 24px)', '10px');
  const lsz = s(pm, 'clamp(9px, 1.1vmin, 13px)', '5px');
  const ltSz = s(pm, 'clamp(20px, 3vmin, 44px)', '15px');
  const eqSz = s(pm, 'clamp(13px, 1.8vmin, 26px)', '10px');
  const igap = s(pm, 'clamp(6px, 1.1vmin, 14px)', '4px');

  const ColHdr = ({ bg, border, label, color }) => (
    <div style={{ flexShrink: 0, padding: `${s(pm, 14, 3.5)}px ${hp}px`, background: bg, borderBottom: `1px solid ${border}` }}>
      <span style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{label}</span>
    </div>
  );

  const successCriteria = (slide.successCriteria || []).filter(Boolean);
  const vocabulary = (slide.vocabulary || []).filter(v => v && (v.word || v.definition));

  return (
    <div style={{ width: '100%', height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: `${s(pm, 14, 3)}px ${hp}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${c.divider}` }}>
        <span style={{ fontSize: s(pm, 19, 6.5), fontWeight: 700, color: c.invert ? 'rgba(255,255,255,0.45)' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {slide.lessonName || 'Lesson'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(pm, 18, 7) }}>
          <span style={{ fontSize: s(pm, 17, 6), color: c.invert ? 'rgba(255,255,255,0.3)' : '#C0C5CF' }}>{[slide.subject, slide.grade].filter(Boolean).join(' · ')}</span>
          <BrandMark pm={pm} invert={c.invert} />
        </div>
      </div>

      {/* Learning Target + Essential Question row */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: `1px solid ${c.divider}` }}>
        <div style={{ flex: '0 0 58%', padding: `${s(pm, 20, 5)}px ${hp}px`, background: c.ltBg, borderRight: `1px solid ${c.divider}`, borderLeft: `${s(pm, 5, 2)}px solid ${c.ltAccent}` }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ltLabel, marginBottom: s(pm, 8, 2) }}>🎯 Learning Target</div>
          <div style={{ fontSize: ltSz, fontWeight: 800, color: c.ltText, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {slide.learningTarget || <span style={{ opacity: 0.25 }}>Learning target will appear here</span>}
          </div>
        </div>
        <div style={{ flex: '0 0 42%', padding: `${s(pm, 20, 5)}px ${hp}px`, background: c.eqBg }}>
          <div style={{ fontSize: lsz, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.eqLabel, marginBottom: s(pm, 8, 2) }}>❓ Essential Question</div>
          <div style={{ fontSize: eqSz, fontWeight: 600, color: c.eqText, lineHeight: 1.35, fontStyle: 'italic' }}>
            {slide.essentialQuestion || <span style={{ opacity: 0.25, fontStyle: 'normal' }}>Essential question will appear here</span>}
          </div>
        </div>
      </div>

      {/* 3-col body */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

        {/* Col 1: Success Criteria */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${c.divider}`, overflow: 'hidden' }}>
          <ColHdr bg={c.c1Hdr} border={c.c1HdrBdr} label="✓ Success Criteria" color={c.c1Label} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${s(pm, 16, 4)}px ${hp}px` }}>
            {successCriteria.map((sc, i) => (
              <CheckBullet key={i} text={sc} accent={c.c1Accent} textColor={c.body} size={bsz} />
            ))}
            {successCriteria.length === 0 && <span style={{ fontSize: bsz, color: c.body, opacity: 0.3 }}>Success criteria will appear here</span>}
          </div>
        </div>

        {/* Col 2: Key Vocabulary */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${c.divider}`, overflow: 'hidden' }}>
          <ColHdr bg={c.c2Hdr} border={c.c2HdrBdr} label="📖 Key Vocabulary" color={c.c2Label} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: igap, padding: `${s(pm, 16, 4)}px ${hp}px` }}>
            {vocabulary.map((v, i) => (
              <div key={i} style={{ lineHeight: 1.35 }}>
                <span style={{ fontSize: bsz, fontWeight: 700, color: c.c2Word }}>{v.word}</span>
                {v.definition && <span style={{ fontSize: bsz, color: c.c2Def }}> — {v.definition}</span>}
              </div>
            ))}
            {vocabulary.length === 0 && <span style={{ fontSize: bsz, color: c.body, opacity: 0.3 }}>Vocabulary will appear here</span>}
          </div>
        </div>

        {/* Col 3: Task / Discussion / Exit Ticket */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${c.divider}`, overflow: 'hidden' }}>
            <ColHdr bg={c.tkHdr} border={c.tkHdrBdr} label="📝 Student Task" color={c.tkLabel} />
            <div style={{ flex: 1, padding: `${s(pm, 10, 3)}px ${hp}px`, fontSize: bsz, color: c.body, lineHeight: 1.4, overflow: 'hidden' }}>
              {slide.studentTask || <span style={{ opacity: 0.3 }}>Student task will appear here</span>}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${c.divider}`, overflow: 'hidden' }}>
            <ColHdr bg={c.dcHdr} border={c.dcHdrBdr} label="💬 Discussion" color={c.dcLabel} />
            <div style={{ flex: 1, padding: `${s(pm, 10, 3)}px ${hp}px`, fontSize: bsz, color: c.body, lineHeight: 1.4, overflow: 'hidden' }}>
              {slide.discussionPrompt || <span style={{ opacity: 0.3 }}>Discussion prompt will appear here</span>}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ColHdr bg={c.exHdr} border={c.exHdrBdr} label="🎫 Exit Ticket" color={c.exLabel} />
            <div style={{ flex: 1, padding: `${s(pm, 10, 3)}px ${hp}px`, fontSize: bsz, color: c.body, lineHeight: 1.4, overflow: 'hidden' }}>
              {slide.exitTicket || <span style={{ opacity: 0.3 }}>Exit ticket will appear here</span>}
            </div>
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
  const isNewFormat = slide.essentialQuestion !== undefined || slide.successCriteria !== undefined;
  const Layout = isNewFormat ? InstructionalSlide : (LAYOUTS[themeKey] || FocusLayout);

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
