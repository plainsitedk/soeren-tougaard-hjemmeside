import { getPosts } from './_lib.js';

const STATIC_URLS = [
  { loc: 'https://tougaardkommunikation.dk/', changefreq: 'monthly', priority: '1.0' },
  { loc: 'https://tougaardkommunikation.dk/ydelser.html', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://tougaardkommunikation.dk/nyheder', changefreq: 'weekly', priority: '0.7' },
];

export async function onRequestGet({ env }) {
  const posts = await getPosts(env);
  const postUrls = posts.map((p) => ({
    loc: `https://tougaardkommunikation.dk/nyheder/${p.slug}`,
    lastmod: (p.updatedAt || p.createdAt).slice(0, 10),
    changefreq: 'monthly',
    priority: '0.6',
  }));

  const urls = [...STATIC_URLS, ...postUrls];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
