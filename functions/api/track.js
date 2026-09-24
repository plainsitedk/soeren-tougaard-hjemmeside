// Records a page view. No IP addresses or cookies are stored here — only
// aggregate counters (total, per-page, per-day) so this stays GDPR-light.
export async function onRequestPost(context) {
  const { request, env } = context;

  let path = 'other';
  try {
    const body = await request.json();
    if (body && body.path === 'ydelser') path = 'ydelser';
    else if (body && body.path === 'index') path = 'index';
  } catch (e) {
    // ignore malformed body, falls back to 'other'
  }

  const today = new Date().toISOString().slice(0, 10);
  const keys = ['views:total', `views:${path}`, `views:day:${today}`];

  await Promise.all(keys.map(async (key) => {
    const current = parseInt((await env.TOUGAARD_STATS.get(key)) || '0', 10);
    await env.TOUGAARD_STATS.put(key, String(current + 1));
  }));

  return new Response(null, { status: 204 });
}
