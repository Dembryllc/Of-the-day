import { defineConfig, loadEnv } from 'vite';
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

// Blog articles live in HeyCatch and are fetched in the browser. At build time
// we also read the list once so crawlers get a static page per article with its
// own title/description/canonical, and the sitemap lists every article. Any
// failure here is swallowed: the build never depends on the blog API.
const blogStatic = key => ({
  name: 'blog-static',
  apply: 'build',
  async closeBundle() {
    if (!key) return;
    try {
      const articles = [];
      for (let offset = 0; ; offset += 50) {
        const res = await fetch(`https://api.heycatch.ai/v1/articles?key=${encodeURIComponent(key)}&limit=50&offset=${offset}`);
        if (!res.ok) return;
        const page = await res.json();
        articles.push(...(page.articles || []));
        if (!page.articles?.length || articles.length >= (page.total || 0)) break;
      }
      const dist = path.resolve('dist');
      const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
      for (const a of articles) {
        if (!a.slug || !/^[\w-]+$/.test(a.slug)) continue;
        const url = `https://oftheday.net/blog/${a.slug}`;
        const title = `${a.title} — OfTheDay.net`;
        const desc = a.meta_description || '';
        const html = base
          .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
        const dir = path.join(dist, 'blog', a.slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      }
      const map = path.join(dist, 'sitemap.xml');
      if (articles.length && fs.existsSync(map)) {
        const day = d => (d ? String(d).slice(0, 10) : '');
        const urls = articles.filter(a => a.slug && /^[\w-]+$/.test(a.slug)).map(a => {
          const last = day(a.updated_at || a.updated || a.published_at);
          return `  <url>\n    <loc>https://oftheday.net/blog/${a.slug}</loc>${last ? `\n    <lastmod>${last}</lastmod>` : ''}\n  </url>\n`;
        }).join('');
        fs.writeFileSync(map, fs.readFileSync(map, 'utf8').replace('</urlset>', `${urls}</urlset>`));
      }
    } catch { /* blog is optional at build time */ }
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), perRouteHtml(), blogStatic(loadEnv(mode, process.cwd(), 'VITE_').VITE_HEYCATCH_API_KEY)],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
