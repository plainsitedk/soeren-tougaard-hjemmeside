async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/stats_session=([a-f0-9]{64})/);
  const expected = env.STATS_PASSWORD ? await sha256Hex(env.STATS_PASSWORD) : null;

  if (!match || !expected || match[1] !== expected) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [total, indexViews, ydelserViews] = await Promise.all([
    env.TOUGAARD_STATS.get('views:total'),
    env.TOUGAARD_STATS.get('views:index'),
    env.TOUGAARD_STATS.get('views:ydelser'),
  ]);

  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const dayCounts = await Promise.all(days.map((d) => env.TOUGAARD_STATS.get(`views:day:${d}`)));

  return new Response(
    JSON.stringify({
      ok: true,
      total: parseInt(total || '0', 10),
      index: parseInt(indexViews || '0', 10),
      ydelser: parseInt(ydelserViews || '0', 10),
      daily: days.map((d, i) => ({ date: d, count: parseInt(dayCounts[i] || '0', 10) })),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
