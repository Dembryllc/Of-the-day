// Regenerates public/resources/morning-meeting-resource-pack.pdf from pack.html.
//
// Usage:
//   npm i -D playwright-core   (one-off; not a project dependency)
//   node scripts/resource-pack/render.js
//
// Chromium is located via CHROMIUM_PATH, then common install locations.
// Keep the 10 activities in pack.html in sync with RESOURCE_PACK_ACTIVITIES
// in functions/index.js — the email lists the same activities the PDF expands on.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const REPO = path.join(__dirname, '..', '..');

function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chromium not found — set CHROMIUM_PATH');
}

(async () => {
  const font = fs.readFileSync(path.join(REPO, 'public/fonts/outfit-1.woff2'));
  const dataUri = `data:font/woff2;base64,${font.toString('base64')}`;
  const html = fs
    .readFileSync(path.join(__dirname, 'pack.html'), 'utf8')
    .replace('OUTFIT_LATIN_DATA_URI', dataUri);
  const rendered = path.join(__dirname, '.pack-rendered.html');
  fs.writeFileSync(rendered, html);

  const browser = await chromium.launch({ executablePath: findChromium() });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + rendered, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const out = path.join(REPO, 'public/resources/morning-meeting-resource-pack.pdf');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true });
    console.log('PDF written:', out);
  } finally {
    await browser.close();
    fs.unlinkSync(rendered);
  }
})();
