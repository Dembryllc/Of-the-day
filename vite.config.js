import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { ROUTE_META } from './src/lib/routes.js';

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// The app is a single-page app, so every URL used to be served the homepage's
// <head> (same title, same canonical). After the build, write one static copy
// of index.html per public marketing route with that route's own title,
// description and canonical. Firebase Hosting serves an exact file before the
// "**" rewrite, so /changelog gets dist/changelog/index.html. The React app
// still boots from the same script tag and renders the route as before.
const perRouteHtml = () => ({
  name: 'per-route-html',
  apply: 'build',
  closeBundle() {
    const dist = path.resolve('dist');
    const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    for (const [route, meta] of Object.entries(ROUTE_META)) {
      if (route === '/') continue;
      const url = `https://oftheday.net${route}`;
      const html = base
        .replace(/<title>.*?<\/title>/, `<title>${esc(meta.title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`);
      const dir = path.join(dist, route);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
    }
  },
});

export default defineConfig({
  plugins: [react(), perRouteHtml()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
