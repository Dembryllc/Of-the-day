import { useEffect } from 'react';

// Per-route <title>, description and canonical. index.html carries the
// homepage defaults; this keeps a client-side navigation in step with them.
// Crawlers that do not run JavaScript get the same values from the static
// per-route HTML that vite.config.js writes at build time (keep both lists in
// sync through src/lib/routes.js).
const setMeta = (selector, attr, value) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

export function useSeo({ title, description, path }) {
  useEffect(() => {
    const url = `https://oftheday.net${path === '/' ? '/' : path}`;
    const prevTitle = document.title;
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    return () => { document.title = prevTitle; };
  }, [title, description, path]);
}
