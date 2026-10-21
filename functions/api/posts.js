// Blog post CRUD. Public reads happen directly from KV in functions/indsigt.js and
// functions/indsigt/[slug].js — this endpoint is only used by blog-admin.html and is
// fully auth-gated (same session cookie as /api/stats) so it also works as the
// editor's login gate.
async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function isAuthed(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/stats_session=([a-f0-9]{64})/);
  const expected = env.STATS_PASSWORD ? await sha256Hex(env.STATS_PASSWORD) : null;
  return !!(match && expected && match[1] === expected);
}

function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'indlaeg';
}

function uniqueSlug(base, posts, excludeId) {
  let slug = base;
  let n = 2;
  while (posts.some((p) => p.slug === slug && p.id !== excludeId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getPosts(env) {
  const raw = await env.TOUGAARD_STATS.get('blog:posts');
  return raw ? JSON.parse(raw) : [];
}

async function savePosts(env, posts) {
  await env.TOUGAARD_STATS.put('blog:posts', JSON.stringify(posts));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const posts = await getPosts(env);
  return json({ ok: true, posts: posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.title || !body.content) return json({ ok: false, error: 'title and content required' }, 400);

  const posts = await getPosts(env);
  const base = slugify(body.slug || body.title);
  const slug = uniqueSlug(base, posts, null);
  const now = new Date().toISOString();
  const post = {
    id: 'post_' + Date.now(),
    slug,
    title: body.title,
    excerpt: body.excerpt || stripHtml(body.content).slice(0, 180),
    content: body.content,
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  await savePosts(env, posts);
  return json({ ok: true, post }, 201);
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ ok: false, error: 'id required' }, 400);

  const posts = await getPosts(env);
  const idx = posts.findIndex((p) => p.id === body.id);
  if (idx < 0) return json({ ok: false, error: 'not found' }, 404);

  const base = slugify(body.slug || body.title || posts[idx].title);
  const slug = uniqueSlug(base, posts, body.id);
  posts[idx] = {
    ...posts[idx],
    title: body.title || posts[idx].title,
    slug,
    excerpt: body.excerpt || stripHtml(body.content || posts[idx].content).slice(0, 180),
    content: body.content || posts[idx].content,
    updatedAt: new Date().toISOString(),
  };
  await savePosts(env, posts);
  return json({ ok: true, post: posts[idx] });
}

export async function onRequestDelete({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ ok: false, error: 'id required' }, 400);

  const posts = await getPosts(env);
  const filtered = posts.filter((p) => p.id !== body.id);
  await savePosts(env, filtered);
  return json({ ok: true });
}
