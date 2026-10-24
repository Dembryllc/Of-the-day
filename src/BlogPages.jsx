import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Shell } from './MarketingPages';
import { useSeo } from './lib/seo';
import { ROUTE_META } from './lib/routes';
import { fetchArticle, useArticles } from './lib/blog';

// /blog (index) and /blog/:slug (article). Articles are fetched live from the
// HeyCatch API in the browser; see src/lib/blog.jsx.

const SITE = 'https://oftheday.net';
const PER_PAGE = 20;
const RTL = new Set(['ar', 'he', 'fa', 'ur']);

const fmtDate = iso => (iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
const readTime = n => (n ? `${n} min read` : '');

function Meta({ article }) {
  const date = article.published_at || article.published;
  return (
    <p className="lp-legal-date" style={{ marginBottom: 0 }}>
      {date && <time dateTime={date}>{fmtDate(date)}</time>}
      {date && article.read_time ? ' · ' : ''}
      {readTime(article.read_time)}
    </p>
  );
}

/* ───────────── /blog ───────────── */

export function BlogIndexPage() {
  useSeo({ ...ROUTE_META['/blog'], path: '/blog' });
  const { status, articles } = useArticles();
  const [params] = useSearchParams();
  const pages = Math.max(1, Math.ceil(articles.length / PER_PAGE));
  const page = Math.min(Math.max(parseInt(params.get('page'), 10) || 1, 1), pages);
  const shown = articles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Shell>
      <main className="lp-legal-page" style={{ maxWidth: 760 }}>
        <h1>Blog</h1>
        <p className="vs-lead">Ideas for making morning meeting easier and better.</p>
        {status === 'loading' && <p>Loading articles…</p>}
        {status !== 'loading' && !articles.length && <p>No articles yet.</p>}
        {shown.map(a => (
          <section key={a.id || a.slug}>
            <h2 style={{ marginBottom: 4 }}><Link to={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>{a.title}</Link></h2>
            <Meta article={a} />
          </section>
        ))}
        {pages > 1 && (
          <p>
            {page > 1 && <Link to={page === 2 ? '/blog' : `/blog?page=${page - 1}`}>← Newer</Link>}
            {page > 1 && page < pages && ' · '}
            {page < pages && <Link to={`/blog?page=${page + 1}`}>Older →</Link>}
          </p>
        )}
        <p><Link to="/">Back to the homepage</Link></p>
      </main>
    </Shell>
  );
}

/* ───────────── /blog/:slug ───────────── */

// Table of contents from every <h2 id>, except the FAQ. Goes after the Key
// takeaways list, or above the content when there are none.
function buildArticle(html) {
  const clean = DOMPurify.sanitize(html || '', { ADD_ATTR: ['id'] });
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const heads = [...root.querySelectorAll('h2[id]')].filter(h => h.id !== 'faq');
  if (!heads.length) return root.innerHTML;

  const toc = doc.createElement('nav');
  toc.setAttribute('aria-label', 'Table of contents');
  toc.innerHTML = `<h3>On this page</h3><ul>${heads
    .map(h => `<li><a href="#${encodeURIComponent(h.id)}">${h.textContent.replace(/[<>&]/g, '')}</a></li>`)
    .join('')}</ul>`;

  const takeaways = [...root.querySelectorAll('h2')].find(h => /key takeaways/i.test(h.textContent));
  if (takeaways) {
    let at = takeaways;
    while (at.nextElementSibling && at.nextElementSibling.tagName !== 'H2') at = at.nextElementSibling;
    at.after(toc);
  } else {
    root.prepend(toc);
  }
  return root.innerHTML;
}

// JSON-LD with "<" escaped so it cannot close the script tag.
function useJsonLd(jsonLd) {
  useEffect(() => {
    if (!jsonLd || typeof jsonLd !== 'object' || !Object.keys(jsonLd).length) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    document.head.appendChild(el);
    return () => el.remove();
  }, [jsonLd]);
}

// Article-only head tags that the shared useSeo does not cover.
function useArticleHead(article) {
  useEffect(() => {
    if (!article) return;
    const added = [];
    const prevLang = document.documentElement.lang;
    const prevDir = document.documentElement.dir;
    const og = document.head.querySelector('meta[property="og:type"]');
    const prevType = og?.getAttribute('content');
    if (og) og.setAttribute('content', 'article');
    if (article.language && article.language !== 'en') {
      document.documentElement.lang = article.language;
      if (RTL.has(article.language)) document.documentElement.dir = 'rtl';
    }
    const when = article.published_at || article.published;
    if (when) {
      const m = document.createElement('meta');
      m.setAttribute('property', 'article:published_time');
      m.content = when;
      document.head.appendChild(m);
      added.push(m);
    }
    return () => {
      added.forEach(n => n.remove());
      if (og && prevType != null) og.setAttribute('content', prevType);
      document.documentElement.lang = prevLang;
      document.documentElement.dir = prevDir;
    };
  }, [article]);
}

export function BlogArticlePage() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', article: null });

  useEffect(() => {
    let live = true;
    setState({ status: 'loading', article: null });
    fetchArticle(slug)
      .then(article => live && setState({ status: article ? 'ready' : 'missing', article }))
      .catch(() => live && setState({ status: 'error', article: null }));
    return () => { live = false; };
  }, [slug]);

  const { article, status } = state;
  useSeo({
    title: article ? `${article.title} — OfTheDay.net` : 'Blog — OfTheDay.net',
    description: article?.meta_description || ROUTE_META['/blog'].description,
    path: `/blog/${slug}`,
  });
  useArticleHead(article);
  useJsonLd(article?.jsonLd);
  const html = useMemo(() => (article ? buildArticle(article.content_html) : ''), [article]);

  // A missing article is a real 404 for crawlers too: noindex it.
  useEffect(() => {
    if (status !== 'missing') return;
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex';
    document.head.appendChild(m);
    return () => m.remove();
  }, [status]);

  return (
    <Shell>
      <main className="lp-legal-page" style={{ maxWidth: 760 }}>
        {status === 'loading' && <p>Loading…</p>}
        {status === 'missing' && (
          <>
            <h1>Article not found</h1>
            <p>We couldn't find that article.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Blog</h1>
            <p>This article isn't available right now. Please try again in a few minutes.</p>
          </>
        )}
        {status === 'ready' && (
          <article lang={article.language || undefined} dir={RTL.has(article.language) ? 'rtl' : undefined}>
            <h1>{article.title}</h1>
            <Meta article={article} />
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        )}
        <p><Link to="/blog">← All articles</Link></p>
      </main>
    </Shell>
  );
}
