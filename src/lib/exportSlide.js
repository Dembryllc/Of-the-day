let _PptxGenJS = null;
async function getPptxGen() {
  if (!_PptxGenJS) {
    const mod = await import('pptxgenjs');
    _PptxGenJS = mod.default;
  }
  return _PptxGenJS;
}

const SLIDE_W = 10;
const SLIDE_H = 5.625;

// Theme color maps — hex without '#'
// Dark-theme rgba values are composited against their background colors
const THEME = {
  focus: {
    bg: 'FFFFFF', text: '374151', headerText: '9CA3AF',
    ltBg: 'F4FDFA', ltAccent: '2D7A6A', ltLabel: '2D7A6A', ltText: '111827',
    eqBg: 'EFF6FF', eqLabel: '1E40AF', eqText: '1E3A8A',
    c1Hdr: 'DCF5EE', c1Label: '2D7A6A', c1Accent: '2D7A6A',
    c2Hdr: 'DBEAFE', c2Label: '1D4ED8', c2Word: '1D4ED8', c2Def: '6B7280',
    tkHdr: 'FEF3C7', tkLabel: '92400E',
    dcHdr: 'F5F3FF', dcLabel: '5B21B6',
    exHdr: 'DCFCE7', exLabel: '166534',
  },
  soft: {
    bg: 'FAF8F4', text: '3B2A1A', headerText: 'B8A890',
    ltBg: 'FFFBF5', ltAccent: 'D97706', ltLabel: 'B45309', ltText: '3B2A1A',
    eqBg: 'FEF9F0', eqLabel: '92400E', eqText: '7C3811',
    c1Hdr: 'FEF3C7', c1Label: '92400E', c1Accent: 'D97706',
    c2Hdr: 'EDE9FE', c2Label: '5B21B6', c2Word: '5B21B6', c2Def: '78716C',
    tkHdr: 'DCFCE7', tkLabel: '166534',
    dcHdr: 'EDE9FE', dcLabel: '5B21B6',
    exHdr: 'FEF3C7', exLabel: '92400E',
  },
  // Dark themes: rgba composited against their respective bg colors
  blocks: {
    bg: '0D1B3E', text: 'DBDEE8', headerText: '4A6080',
    ltBg: '1A7A68', ltAccent: '4DB896', ltLabel: 'A0BCC8', ltText: 'FFFFFF',
    eqBg: '142D49', eqLabel: '4DB896', eqText: 'E0E8F0',
    c1Hdr: '1A3A50', c1Label: '4DB896', c1Accent: '4DB896',
    c2Hdr: '142F45', c2Label: '4DB896', c2Word: '4DB896', c2Def: '889AAA',
    tkHdr: '2A1E0D', tkLabel: 'F5A623',
    dcHdr: '1E1640', dcLabel: 'C084FC',
    exHdr: '0D2A1A', exLabel: '4ADE80',
  },
  depth: {
    bg: '070C18', text: 'CCCCDD', headerText: '3A4A5A',
    ltBg: '091A27', ltAccent: '22D3EE', ltLabel: '22D3EE', ltText: 'FFFFFF',
    eqBg: '131824', eqLabel: '22D3EE', eqText: 'DDDDEE',
    c1Hdr: '0B2A38', c1Label: '22D3EE', c1Accent: '22D3EE',
    c2Hdr: '1B1F2B', c2Label: '22D3EE', c2Word: '22D3EE', c2Def: '667788',
    tkHdr: '2C271A', tkLabel: 'FCD34D',
    dcHdr: '1F1F3A', dcLabel: 'A78BFA',
    exHdr: '0E2A2B', exLabel: '34D399',
  },
};

function sanitizeName(name) {
  return (name || 'Lesson').replace(/[^a-z0-9 \-_]/gi, '').trim() || 'Slide';
}

// Add a filled rectangle with no visible border
function box(slide, x, y, w, h, color) {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color },
    line: { color, pt: 0 },
  });
}

function addInstructionalLayout(prs, slide, data) {
  const c = THEME[data.theme] || THEME.focus;

  const HDR_H = 0.40;
  const LT_ROW_H = 1.30;
  const BODY_Y = HDR_H + LT_ROW_H;
  const BODY_H = SLIDE_H - BODY_Y;
  const LT_W = 5.8;
  const EQ_W = SLIDE_W - LT_W;
  const COL_W = SLIDE_W / 3;
  const COL_HDR_H = 0.32;
  const SUB_TOTAL_H = BODY_H / 3;
  const SUB_CONTENT_H = SUB_TOTAL_H - COL_HDR_H;

  slide.background = { color: c.bg };

  // ── Header ──
  box(slide, 0, 0, SLIDE_W, HDR_H, c.bg);
  slide.addText((data.lessonName || 'Lesson').toUpperCase(), {
    x: 0.25, y: 0, w: SLIDE_W * 0.6, h: HDR_H,
    fontSize: 10, bold: true, color: c.headerText,
    align: 'left', valign: 'middle', charSpacing: 3,
  });
  slide.addText([data.subject, data.grade].filter(Boolean).join(' · '), {
    x: SLIDE_W * 0.6, y: 0, w: SLIDE_W * 0.38, h: HDR_H,
    fontSize: 9, color: c.headerText,
    align: 'right', valign: 'middle',
  });

  // ── Learning Target ──
  box(slide, 0, HDR_H, LT_W, LT_ROW_H, c.ltBg);
  box(slide, 0, HDR_H, 0.07, LT_ROW_H, c.ltAccent);
  slide.addText('LEARNING TARGET', {
    x: 0.18, y: HDR_H + 0.07, w: LT_W - 0.25, h: 0.22,
    fontSize: 7, bold: true, color: c.ltLabel, charSpacing: 4, valign: 'middle',
  });
  slide.addText(data.learningTarget || '', {
    x: 0.18, y: HDR_H + 0.30, w: LT_W - 0.30, h: LT_ROW_H - 0.40,
    fontSize: 18, bold: true, color: c.ltText,
    lineSpacingMultiple: 1.15, shrinkText: true, valign: 'top',
  });

  // ── Essential Question ──
  box(slide, LT_W, HDR_H, EQ_W, LT_ROW_H, c.eqBg);
  slide.addText('ESSENTIAL QUESTION', {
    x: LT_W + 0.18, y: HDR_H + 0.07, w: EQ_W - 0.25, h: 0.22,
    fontSize: 7, bold: true, color: c.eqLabel, charSpacing: 4, valign: 'middle',
  });
  slide.addText(data.essentialQuestion || '', {
    x: LT_W + 0.18, y: HDR_H + 0.30, w: EQ_W - 0.30, h: LT_ROW_H - 0.40,
    fontSize: 13, bold: true, italic: true, color: c.eqText,
    lineSpacingMultiple: 1.35, shrinkText: true, valign: 'top',
  });

  // ── Col 1: Success Criteria ──
  box(slide, 0, BODY_Y, COL_W, COL_HDR_H, c.c1Hdr);
  slide.addText('SUCCESS CRITERIA', {
    x: 0.15, y: BODY_Y, w: COL_W - 0.2, h: COL_HDR_H,
    fontSize: 7, bold: true, color: c.c1Label, charSpacing: 3, valign: 'middle',
  });
  box(slide, 0, BODY_Y + COL_HDR_H, COL_W, BODY_H - COL_HDR_H, c.bg);

  const criteria = (data.successCriteria || []).filter(Boolean);
  const itemH = Math.min(0.65, (BODY_H - COL_HDR_H - 0.2) / Math.max(criteria.length, 1));
  criteria.forEach((sc, i) => {
    slide.addText([
      { text: '✓  ', options: { bold: true, color: c.c1Accent } },
      { text: sc, options: { color: c.text } },
    ], {
      x: 0.15, y: BODY_Y + COL_HDR_H + 0.12 + i * itemH, w: COL_W - 0.3, h: itemH,
      fontSize: 11, lineSpacingMultiple: 1.3, valign: 'top',
    });
  });

  // ── Col 2: Key Vocabulary ──
  box(slide, COL_W, BODY_Y, COL_W, COL_HDR_H, c.c2Hdr);
  slide.addText('KEY VOCABULARY', {
    x: COL_W + 0.15, y: BODY_Y, w: COL_W - 0.2, h: COL_HDR_H,
    fontSize: 7, bold: true, color: c.c2Label, charSpacing: 3, valign: 'middle',
  });
  box(slide, COL_W, BODY_Y + COL_HDR_H, COL_W, BODY_H - COL_HDR_H, c.bg);

  const vocab = (data.vocabulary || []).filter(v => v && (v.word || v.definition));
  const vocabItemH = Math.min(0.65, (BODY_H - COL_HDR_H - 0.2) / Math.max(vocab.length, 1));
  vocab.forEach((v, i) => {
    const parts = [];
    if (v.word) parts.push({ text: v.word, options: { bold: true, color: c.c2Word } });
    if (v.word && v.definition) parts.push({ text: ' — ', options: { color: c.c2Def } });
    if (v.definition) parts.push({ text: v.definition, options: { color: c.c2Def } });
    if (parts.length) {
      slide.addText(parts, {
        x: COL_W + 0.15, y: BODY_Y + COL_HDR_H + 0.12 + i * vocabItemH, w: COL_W - 0.3, h: vocabItemH,
        fontSize: 11, lineSpacingMultiple: 1.3, valign: 'top',
      });
    }
  });

  // ── Col 3: Student Task / Discussion / Exit Ticket ──
  const C3X = COL_W * 2;

  const sections = [
    { y: BODY_Y, hdr: 'STUDENT TASK', hdrColor: c.tkHdr, labelColor: c.tkLabel, content: data.studentTask },
    { y: BODY_Y + SUB_TOTAL_H, hdr: 'DISCUSSION', hdrColor: c.dcHdr, labelColor: c.dcLabel, content: data.discussionPrompt },
    { y: BODY_Y + SUB_TOTAL_H * 2, hdr: 'EXIT TICKET', hdrColor: c.exHdr, labelColor: c.exLabel, content: data.exitTicket },
  ];

  sections.forEach(({ y, hdr, hdrColor, labelColor, content }) => {
    box(slide, C3X, y, COL_W, COL_HDR_H, hdrColor);
    slide.addText(hdr, {
      x: C3X + 0.15, y, w: COL_W - 0.2, h: COL_HDR_H,
      fontSize: 7, bold: true, color: labelColor, charSpacing: 3, valign: 'middle',
    });
    box(slide, C3X, y + COL_HDR_H, COL_W, SUB_CONTENT_H, c.bg);
    slide.addText(content || '', {
      x: C3X + 0.15, y: y + COL_HDR_H + 0.07, w: COL_W - 0.3, h: SUB_CONTENT_H - 0.1,
      fontSize: 10, color: c.text, lineSpacingMultiple: 1.4, shrinkText: true, valign: 'top',
    });
  });
}

function addLegacyLayout(prs, slide, data) {
  slide.background = { color: '1B2A3B' };
  slide.addText(data.lessonName || 'Lesson Slide', {
    x: 0.5, y: 0.25, w: SLIDE_W - 1, h: 0.65,
    fontSize: 22, bold: true, color: 'FFFFFF', align: 'center',
  });
  slide.addText([data.subject, data.grade].filter(Boolean).join(' · '), {
    x: 0.5, y: 0.9, w: SLIDE_W - 1, h: 0.3,
    fontSize: 11, color: '88AABB', align: 'center',
  });

  const cols = [
    { label: 'Learning Outcomes', items: data.outcomes || [] },
    { label: 'Expectations', items: data.expectations || [] },
    { label: 'Steps', items: data.steps || [] },
  ];
  const colW = SLIDE_W / 3;
  cols.forEach(({ label, items }, ci) => {
    const x = ci * colW;
    slide.addText(label, {
      x: x + 0.2, y: 1.4, w: colW - 0.4, h: 0.35,
      fontSize: 12, bold: true, color: '4DB896',
    });
    items.filter(Boolean).forEach((item, ii) => {
      slide.addText(`•  ${item}`, {
        x: x + 0.2, y: 1.85 + ii * 0.55, w: colW - 0.4, h: 0.50,
        fontSize: 11, color: 'DDDDDD', lineSpacingMultiple: 1.3,
      });
    });
  });
}

async function buildPptx(data) {
  const PptxGenJS = await getPptxGen();
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';
  prs.author = 'OfTheDay.net';
  prs.subject = data.lessonName || 'Lesson Slide';

  const pptSlide = prs.addSlide();
  if (data.essentialQuestion !== undefined) {
    addInstructionalLayout(prs, pptSlide, data);
  } else {
    addLegacyLayout(prs, pptSlide, data);
  }
  return prs;
}

export async function exportToPowerPoint(data) {
  const prs = await buildPptx(data);
  await prs.writeFile({ fileName: `${sanitizeName(data.lessonName)}.pptx` });
}

// ── Google Slides export ──────────────────────────────────────────────────────
// Downloads a .pptx that Google Slides can open natively via File → Import.
// Returns the Drive upload URL so the caller can optionally open it.
export async function exportToGoogleSlides(data) {
  const prs = await buildPptx(data);
  const blob = await prs.write({ outputType: 'blob' });
  const filename = sanitizeName(data.lessonName);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // Open Google Drive so the user can upload right away
  window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener');
}
