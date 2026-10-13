import { getPosts, escapeHtml, formatDateDa, renderPage } from './_lib.js';

export async function onRequestGet({ env }) {
  const posts = (await getPosts(env)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const listCss = `<style>
  .nyheder-head{ margin-bottom:56px; }
  .nyheder-head .eyebrow{ font-size:13.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--clay); margin-bottom:14px; font-weight:500; }
  .nyheder-head h1{ font-size:clamp(1.9rem,4vw,2.5rem); line-height:1.15; margin-bottom:14px; }
  .nyheder-head p{ font-size:16px; line-height:1.6; color:var(--ink-body); max-width:50ch; }
  .post-item{ display:block; padding:30px 0; border-top:1px solid var(--line); }
  .post-item:first-of-type{ border-top:none; }
  .post-date{ font-family:'JetBrains Mono',monospace; font-size:11.5px; color:var(--muted-light); letter-spacing:0.06em; margin-bottom:10px; }
  .post-title{ font-size:clamp(1.15rem,2.2vw,1.5rem); line-height:1.3; margin-bottom:8px; transition:color .2s ease; }
  .post-item:hover .post-title{ color:var(--clay); }
  .post-excerpt{ font-size:15px; line-height:1.65; color:var(--ink-body); margin-bottom:10px; }
  .post-more{ font-size:13px; font-weight:600; color:var(--clay); border-bottom:1px solid rgba(192,90,43,0.4); display:inline-flex; align-items:center; gap:6px; }
  .nyheder-empty{ padding:40px 0; color:var(--muted); font-size:15px; }
</style>`;

  const listHtml = posts.length
    ? posts.map((p) => `
      <a class="post-item" href="/nyheder/${escapeHtml(p.slug)}">
        <div class="post-date mono">${formatDateDa(p.createdAt)}</div>
        <h2 class="post-title">${escapeHtml(p.title)}</h2>
        <p class="post-excerpt">${escapeHtml(p.excerpt)}</p>
        <span class="post-more">Læs mere →</span>
      </a>`).join('')
    : '<p class="nyheder-empty">Første indlæg er på vej. Kom tilbage snart.</p>';

  const bodyHtml = `
    <div class="nyheder-head">
      <div class="eyebrow">Nyheder</div>
      <h1>Tanker om kommunikation</h1>
      <p>Råd og perspektiver om kommunikationsstrategi, presse og indhold for B2B-virksomheder.</p>
    </div>
    ${listHtml}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Nyheder – Tougaard Kommunikation',
    url: 'https://tougaardkommunikation.dk/nyheder',
  };

  const html = renderPage({
    title: 'Nyheder – Tougaard Kommunikation',
    description: 'Råd og perspektiver om kommunikationsstrategi, presse og indhold for B2B-virksomheder, skrevet af Søren Tougaard.',
    canonical: 'https://tougaardkommunikation.dk/nyheder',
    bodyHtml,
    jsonLd,
    extraHead: listCss,
  });

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
