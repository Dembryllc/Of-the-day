import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Blog articles come live from the HeyCatch API; nothing is copied into the
// repo. The key is read-only and publishable, but it still lives in an env var
// (VITE_HEYCATCH_API_KEY), never in source. Without it the blog is just empty.
const API = 'https://api.heycatch.ai/v1';
const KEY = import.meta.env.VITE_HEYCATCH_API_KEY || '';
const PAGE = 50;
const TTL_MS = 120 * 1000; // revalidate every 2 minutes

const cache = new Map(); // url -> { at, data }
const inflight = new Map();

async function get(path, query = {}) {
  if (!KEY) throw new Error('no-key');
  const qs = new URLSearchParams({ ...query, key: KEY });
  const url = `${API}${path}?${qs}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  if (inflight.has(url)) return inflight.get(url);

  const run = (async () => {
    let res = await fetch(url);
    if (res.status === 429) { // wait as told, retry once, never loop
      const wait = Math.min(Number(res.headers.get('Retry-After')) || 2, 10);
      await new Promise(r => setTimeout(r, wait * 1000));
      res = await fetch(url);
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`blog-api-${res.status}`);
    const data = await res.json();
    cache.set(url, { at: Date.now(), data });
    return data;
  })().finally(() => inflight.delete(url));
  inflight.set(url, run);
  return run;
}

// Every article, newest first, paging 50 at a time.
export async function fetchAllArticles() {
  const all = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await get('/articles', { limit: PAGE, offset });
    const items = page?.articles || [];
    all.push(...items);
    if (!items.length || all.length >= (page.total ?? 0)) break;
  }
  return all;
}

export async function fetchArticle(slug) {
  const data = await get(`/articles/${encodeURIComponent(slug)}`);
  return data?.article || null;
}

// { status: 'loading' | 'ready' | 'error', articles }. Errors never throw into
// the page; the caller shows an empty state.
export function useArticles() {
  const [state, setState] = useState({ status: 'loading', articles: [] });
  useEffect(() => {
    let live = true;
    fetchAllArticles()
      .then(articles => live && setState({ status: 'ready', articles }))
      .catch(() => live && setState({ status: 'error', articles: [] }));
    return () => { live = false; };
  }, []);
  return state;
}

// "Blog" nav/footer link, hidden while there are no articles. `inList` wraps
// it in an <li> for the top nav's <ul>, so no empty item is left behind
// while it's hidden. Requests are shared, so several links cost one call.
export function BlogLink({ inList = false, onClick } = {}) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let live = true;
    get('/articles', { limit: 1 }).then(d => live && setTotal(d?.total || 0)).catch(() => {});
    return () => { live = false; };
  }, []);
  if (total === 0) return null;
  const link = <Link to="/blog" onClick={onClick}>Blog</Link>;
  return inList ? <li>{link}</li> : link;
}
