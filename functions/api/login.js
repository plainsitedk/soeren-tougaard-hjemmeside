async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  if (!env.STATS_PASSWORD || !body.password || body.password !== env.STATS_PASSWORD) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Session token is derived purely from the server-side secret (not sent by the client),
  // so it can be recomputed and verified by /api/stats without any separate session store.
  const token = await sha256Hex(env.STATS_PASSWORD);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    `stats_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
  );

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
