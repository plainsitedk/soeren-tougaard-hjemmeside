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

  const REF_BUCKETS = ['direct', 'google', 'bing', 'duckduckgo', 'facebook', 'instagram', 'linkedin', 'twitter', 'other'];
  const HOUR_BUCKETS = ['morgen', 'eftermiddag', 'aften', 'nat'];
  const YDELSE_SLUGS = ['kernefortaelling', 'kommunikationsstrategi', 'ledelse-krisestyring', 'digitalt-indhold', 'maerkesager', 'pressearbejde', 'hyr-kommunikator', 'indholdstjek'];

  const [total, indexViews, ydelserViews, refCounts, deviceCounts, hourCounts, contactSubmits, ydelseCounts] = await Promise.all([
    env.TOUGAARD_STATS.get('views:total'),
    env.TOUGAARD_STATS.get('views:index'),
    env.TOUGAARD_STATS.get('views:ydelser'),
    Promise.all(REF_BUCKETS.map((b) => env.TOUGAARD_STATS.get(`views:ref:${b}`))),
    Promise.all(['mobile', 'desktop'].map((d) => env.TOUGAARD_STATS.get(`views:device:${d}`))),
    Promise.all(HOUR_BUCKETS.map((h) => env.TOUGAARD_STATS.get(`views:hour:${h}`))),
    env.TOUGAARD_STATS.get('events:contact_submit'),
    Promise.all(YDELSE_SLUGS.map((s) => env.TOUGAARD_STATS.get(`events:ydelse:${s}`))),
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
      referrers: REF_BUCKETS.map((b, i) => ({ source: b, count: parseInt(refCounts[i] || '0', 10) }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count),
      devices: {
        mobile: parseInt(deviceCounts[0] || '0', 10),
        desktop: parseInt(deviceCounts[1] || '0', 10),
      },
      hours: HOUR_BUCKETS.map((h, i) => ({ bucket: h, count: parseInt(hourCounts[i] || '0', 10) })),
      contactSubmits: parseInt(contactSubmits || '0', 10),
      ydelseClicks: YDELSE_SLUGS.map((s, i) => ({ slug: s, count: parseInt(ydelseCounts[i] || '0', 10) }))
        .filter((y) => y.count > 0)
        .sort((a, b) => b.count - a.count),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
