// Shared helpers for the stats functions. Filename starts with "_" so
// Cloudflare Pages does not treat this as a routable function itself.

const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|skypeuripreview|applebot|adsbot|mediapartners|python-requests|curl|wget|headlesschrome|phantomjs|puppeteer|playwright|libwww|go-http-client|okhttp|postmanruntime/i;

export function isBot(userAgent) {
  if (!userAgent) return true; // no UA at all is not a real browser visit
  return BOT_UA_RE.test(userAgent);
}

export function deviceType(userAgent) {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent || '') ? 'mobile' : 'desktop';
}

const HOUR_BUCKETS = [
  { name: 'nat', from: 0, to: 5 },
  { name: 'morgen', from: 6, to: 11 },
  { name: 'eftermiddag', from: 12, to: 17 },
  { name: 'aften', from: 18, to: 23 },
];

export function hourBucket(date) {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', hour: '2-digit', hourCycle: 'h23' }).format(date),
    10
  );
  const bucket = HOUR_BUCKETS.find((b) => hour >= b.from && hour <= b.to);
  return bucket ? bucket.name : 'nat';
}

export async function incrementKeys(env, keys) {
  await Promise.all(
    keys.map(async (key) => {
      const current = parseInt((await env.TOUGAARD_STATS.get(key)) || '0', 10);
      await env.TOUGAARD_STATS.put(key, String(current + 1));
    })
  );
}

export async function getPosts(env) {
  const raw = await env.TOUGAARD_STATS.get('blog:posts');
  return raw ? JSON.parse(raw) : [];
}

export function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDateDa(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Shared page chrome (topbar, footer, design tokens) for the server-rendered /indsigt pages,
// kept visually identical to index.html / ydelser.html so the blog doesn't look bolted on.
export function renderPage({ title, description, canonical, bodyHtml, jsonLd, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="theme-color" content="#F6F4ED" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="https://tougaardkommunikation.dk/images/portraet.jpg" />
<meta property="og:locale" content="da_DK" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2316180F'/%3E%3Ccircle cx='72' cy='68' r='9' fill='%23C05A2B'/%3E%3Ctext x='30' y='68' font-family='Georgia,serif' font-size='58' fill='%23F6F4ED'%3ET%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:ital,wght@0,300..700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${extraHead}
<style>
  :root{
    --paper:#F6F4ED; --paper-raised:#FFFDF8; --paper-sunken:#EFECE2;
    --line:#DDD9CB; --ink:#16180F; --ink-body:#3C3E33;
    --muted:#5A5C50; --muted-light:#8A8A7C; --clay:#C05A2B; --olive:#4C5A34;
  }
  * { box-sizing: border-box; }
  html,body{ margin:0; padding:0; background:var(--paper); color:var(--ink); font-family:Karla,system-ui,sans-serif; }
  a{ color:var(--clay); text-decoration:none; border-bottom:1px solid rgba(192,90,43,0.35); }
  a:hover{ color:var(--ink); border-bottom-color:var(--ink); }
  h1,h2,h3{ font-family:'Libre Baskerville',Georgia,serif; font-weight:400; margin:0; letter-spacing:-0.02em; text-wrap:pretty; }
  p{ margin:0; }
  .mono{ font-family:'JetBrains Mono',monospace; }
  .btn{ font-family:Karla,sans-serif; font-weight:600; border-radius:2px; cursor:pointer; transition:background .22s ease, color .22s ease, border-color .22s ease; display:inline-block; }
  .btn-dark{ font-size:14px; padding:11px 20px; background:var(--ink); color:var(--paper-raised); border:1px solid var(--ink); white-space:nowrap; flex-shrink:0; }
  .btn-dark:hover{ background:var(--clay); border-color:var(--clay); }
  a:focus-visible, button:focus-visible{ outline:2px solid var(--clay); outline-offset:2px; }

  .site{ border:1px solid var(--line); background:var(--paper); }
  .topbar{ display:flex; align-items:center; justify-content:space-between; padding:22px 44px; border-bottom:1px solid var(--line); position:sticky; top:0; background:rgba(246,244,237,0.94); backdrop-filter:blur(8px); z-index:10; }
  .wordmark{ font-family:'Libre Baskerville',Georgia,serif; font-size:21px; letter-spacing:-0.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
  .nav{ display:flex; gap:22px; align-items:center; }
  .nav a:not(.btn){ font-size:14.5px; color:var(--ink-body); border-bottom:1px solid transparent; font-family:Karla,sans-serif; transition:color .22s ease, border-color .22s ease; white-space:nowrap; }
  .nav a:not(.btn):hover{ color:var(--clay); }
  .nav a:not(.btn).active{ color:var(--clay); border-bottom-color:rgba(192,90,43,0.4); }
  .menu-toggle{ display:none; background:none; border:1px solid var(--line); border-radius:2px; width:38px; height:38px; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; font-size:16px; color:var(--ink); }
  .mobile-menu{ display:none; }

  main{ max-width:760px; margin:0 auto; padding:64px 44px 96px; }

  .footer{ border-top:1px solid var(--line); padding:34px 44px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; }
  .footer-credits{ padding:0 44px 28px; font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.06em; color:var(--muted-light); text-align:center; }
  .footer-word{ font-family:'Libre Baskerville',Georgia,serif; font-size:18px; }

  @media (max-width:900px){
    .topbar{ padding-left:20px; padding-right:20px; min-width:0; position:relative; }
    .wordmark{ font-size:15px; min-width:0; }
    .nav{ gap:10px; }
    .nav a:not(.btn){ display:none; }
    .btn-dark{ font-size:12.5px; padding:9px 14px; }
    .menu-toggle{ display:flex; }
    .mobile-menu{ position:absolute; top:100%; left:0; right:0; background:var(--paper); border-bottom:1px solid var(--line); flex-direction:column; padding:6px 20px 16px; z-index:9; }
    .mobile-menu.open{ display:flex; }
    .mobile-menu a{ padding:12px 0; font-size:16px; color:var(--ink-body); border-bottom:1px solid var(--line); }
    .mobile-menu a:last-child{ border-bottom:none; }
    main{ padding:40px 20px 64px; }
    .footer, .footer-credits{ padding-left:20px; padding-right:20px; }
  }
  @media (max-width:480px){
    .topbar{ flex-wrap:wrap; row-gap:10px; padding-top:14px; padding-bottom:14px; }
    .wordmark{ font-size:16px; white-space:normal; overflow:visible; text-overflow:clip; flex:1 1 100%; order:1; }
    .nav{ order:2; margin-left:auto; }
  }
</style>
</head>
<body>

<div class="site">
  <div class="topbar">
    <a href="/" class="wordmark" style="border-bottom:none;color:var(--ink);">Tougaard Kommunikation</a>
    <div class="nav">
      <a href="/#ydelser">Ydelser</a>
      <a href="/#processen">Processen</a>
      <a href="/#om-mig">Om mig</a>
      <a href="/#tidligere-kunder">Tidligere kunder</a>
      <a href="/ydelser.html#priser">Priser</a>
      <a href="/indsigt" class="active">Indsigt</a>
      <a href="/#kontakt" class="btn btn-dark">Kontakt mig</a>
      <button type="button" class="menu-toggle" id="menuToggle" aria-label="Åbn menu" aria-expanded="false">☰</button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="/#ydelser">Ydelser</a>
      <a href="/#processen">Processen</a>
      <a href="/#om-mig">Om mig</a>
      <a href="/#tidligere-kunder">Tidligere kunder</a>
      <a href="/ydelser.html#priser">Priser</a>
      <a href="/indsigt">Indsigt</a>
    </div>
  </div>

  <main>
${bodyHtml}
  </main>

  <div class="footer">
    <div class="footer-word">Tougaard Kommunikation</div>
    <a href="https://www.linkedin.com/in/s%C3%B8ren-tougaard" target="_blank" rel="noopener" aria-label="LinkedIn" style="border-bottom:none;color:var(--muted-light);display:flex;align-items:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
    </a>
  </div>
  <div class="footer-credits">Udviklet af Tobias Gutkin · Foto: Jeanna Natalie Lund</div>
</div>

<script>
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'indsigt', referrer: document.referrer })
  }).catch(function(){});
</script>
</body>
</html>`;
}
