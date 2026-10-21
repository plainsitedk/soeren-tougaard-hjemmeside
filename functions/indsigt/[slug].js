import { getPosts, escapeHtml, formatDateDa, renderPage } from '../_lib.js';

const postCss = `<style>
  .post-back{ font-size:13px; color:var(--muted); display:inline-flex; align-items:center; gap:6px; margin-bottom:32px; border-bottom:1px solid var(--line); }
  .post-back:hover{ color:var(--ink); border-bottom-color:var(--ink); }
  .post-single-date{ font-family:'JetBrains Mono',monospace; font-size:11.5px; color:var(--muted-light); letter-spacing:0.06em; margin-bottom:14px; }
  .post-single-title{ font-size:clamp(1.75rem,4vw,2.4rem); line-height:1.15; margin-bottom:40px; }
  .prose{ font-size:16px; line-height:1.75; color:var(--ink-body); }
  .prose h1,.prose h2,.prose h3{ margin:1.8em 0 .5em; color:var(--ink); }
  .prose h1{ font-size:1.6em; }
  .prose h2{ font-size:1.3em; }
  .prose h3{ font-size:1.1em; font-family:Karla,sans-serif; font-weight:700; }
  .prose p{ margin:.85em 0; }
  .prose ul,.prose ol{ margin:.6em 0 .6em 1.4em; }
  .prose li{ margin:.3em 0; }
  .prose blockquote{ border-left:2px solid var(--clay); padding-left:1.1rem; margin:1.4rem 0; color:var(--muted); font-style:italic; }
  .prose a{ color:var(--clay); text-decoration:underline; }
  .prose strong{ font-weight:700; color:var(--ink); }
</style>`;

function notFound() {
  const html = renderPage({
    title: 'Indlæg ikke fundet – Tougaard Kommunikation',
    description: 'Dette indlæg findes ikke eller er blevet fjernet.',
    canonical: 'https://tougaardkommunikation.dk/indsigt',
    bodyHtml: `<h1>Indlæg ikke fundet</h1><p style="margin-top:14px;"><a href="/indsigt">← Tilbage til indsigt</a></p>`,
  });
  return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function onRequestGet({ env, params }) {
  const posts = await getPosts(env);
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return notFound();

  const canonical = `https://tougaardkommunikation.dk/indsigt/${post.slug}`;

  const bodyHtml = `
    <a class="post-back" href="/indsigt">← Alle indlæg</a>
    <div class="post-single-date mono">${formatDateDa(post.createdAt)}</div>
    <h1 class="post-single-title">${escapeHtml(post.title)}</h1>
    <div class="prose">${post.content}</div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    url: canonical,
    author: { '@type': 'Person', name: 'Søren Tougaard' },
    publisher: { '@type': 'Organization', name: 'Tougaard Kommunikation' },
  };

  const html = renderPage({
    title: `${post.title} – Tougaard Kommunikation`,
    description: post.excerpt,
    canonical,
    bodyHtml,
    jsonLd,
    extraHead: postCss,
  });

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
