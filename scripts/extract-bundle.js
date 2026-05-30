#!/usr/bin/env node
/**
 * Extract the React source from the custom-bundled app.html.
 *
 * Produces:
 *   src/styles.css          — all CSS from the template <style> tag
 *   src/tweaks-panel.jsx    — tweaks-panel component (manifest UUID f3ea1d81)
 *   src/App.jsx             — main app source (inline text/babel script)
 *   public/fonts/           — embedded woff2 fonts
 */

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT     = path.resolve(__dirname, '..');
const SRC      = path.join(ROOT, 'src');
const FONTS    = path.join(ROOT, 'public', 'fonts');
const APP_HTML = path.join(ROOT, 'app.html');

// ── Helpers ───────────────────────────────────────────────────────────────────

function decompress(entry) {
  const buf = Buffer.from(entry.data, 'base64');
  return entry.compressed ? zlib.gunzipSync(buf) : buf;
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  const kb = (Buffer.byteLength(content) / 1024).toFixed(1);
  console.log(`  wrote ${path.relative(ROOT, filePath)} (${kb} KB)`);
}

// ── Parse ─────────────────────────────────────────────────────────────────────

const html     = fs.readFileSync(APP_HTML, 'utf8');
const mfMatch  = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
const tplMatch = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);

if (!mfMatch || !tplMatch) {
  console.error('Could not find bundler script tags in app.html');
  process.exit(1);
}

const manifest = JSON.parse(mfMatch[1].trim());
const template = JSON.parse(tplMatch[1].trim());

// ── Extract fonts ─────────────────────────────────────────────────────────────

console.log('\nExtracting fonts...');
const fontIds = Object.entries(manifest)
  .filter(([, v]) => v.mime && v.mime.startsWith('font/'));

// Map UUID → font filename (referenced in CSS as url("UUID"))
const fontMap = {};
fontIds.forEach(([id, entry], i) => {
  const ext  = entry.mime.split('/')[1];       // woff2
  const name = `outfit-${i}.${ext}`;
  const dest = path.join(FONTS, name);
  write(dest, decompress(entry));
  fontMap[id] = `/fonts/${name}`;
});

// ── Extract CSS ───────────────────────────────────────────────────────────────

console.log('\nExtracting CSS...');
const styleMatch = template.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) { console.error('No <style> tag found'); process.exit(1); }

let css = styleMatch[1];
// Replace embedded font UUID references with real paths
Object.entries(fontMap).forEach(([id, p]) => {
  css = css.split(`"${id}"`).join(`"${p}"`);
});
write(path.join(SRC, 'styles.css'), css);

// ── Extract tweaks-panel.jsx ──────────────────────────────────────────────────

console.log('\nExtracting tweaks-panel.jsx...');
const TWEAKS_UUID = 'f3ea1d81-1357-45c0-a34f-ed166241e6ad';
let tweaks = decompress(manifest[TWEAKS_UUID]).toString('utf8');

// Convert from global-style to ES module:
// 1. Add React import at top
// 2. Replace window.assign export block with named exports
tweaks = tweaks
  .replace(/^(\s*\/\/ tweaks-panel\.jsx)/, `import React, { useState, useEffect, useRef } from 'react';\n$1`)
  .replace(
    /Object\.assign\(window,\s*\{([\s\S]*?)\}\s*\);?\s*$/,
    (_, body) => {
      const names = body.match(/\b\w+\b/g) || [];
      return `export { ${names.join(', ')} };`;
    }
  );

write(path.join(SRC, 'tweaks-panel.jsx'), tweaks);

// ── Extract App.jsx ───────────────────────────────────────────────────────────

console.log('\nExtracting App.jsx...');
const scripts = [...template.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
// Script 4 (index 4) is the inline text/babel main app
const mainScript = scripts.find((s, i) => i === 4 || (s[1].includes('text/babel') && !s[1].includes('src=')));
if (!mainScript) { console.error('Could not find main inline babel script'); process.exit(1); }
let app = mainScript[2];

// Collect all names exported by tweaks-panel (anything before Object.assign was on window)
const tweaksExports = [
  'useTweaks','TweaksPanel','TweakSection','TweakRow',
  'TweakSlider','TweakToggle','TweakRadio','TweakSelect',
  'TweakText','TweakNumber','TweakColor','TweakButton',
];

// Build the import for tweaks (only ones actually used in App.jsx)
const usedTweaks = tweaksExports.filter(n => new RegExp(`\\b${n}\\b`).test(app));

// 1. Replace `const { useState, ... } = React;` with proper import
app = app.replace(
  /^\s*const\s*\{([^}]+)\}\s*=\s*React\s*;/m,
  (_, names) => {
    const hooks = names.split(',').map(s => s.trim()).filter(Boolean);
    return `import React, { ${hooks.join(', ')} } from 'react';` +
           (usedTweaks.length ? `\nimport { ${usedTweaks.join(', ')} } from './tweaks-panel';` : '');
  }
);

// 2. Remove the ReactDOM.createRoot call (moves to main.jsx)
app = app.replace(
  /\n?ReactDOM\.createRoot\([^)]+\)\.render\(<App\/>\);?\s*$/,
  ''
);

// 3. Export App as default
app = app.trimEnd() + '\n\nexport default App;\n';

write(path.join(SRC, 'App.jsx'), app);

// ── Done ──────────────────────────────────────────────────────────────────────

console.log('\nExtraction complete.');
console.log('Next: run `node scripts/verify-extract.js` to count components, then set up Vite.');
