// Records a page view. No IP addresses or cookies are stored here — only
// aggregate counters (total, per-page, per-day, referrer source) so this stays GDPR-light.
const REF_BUCKETS = {
  'google.': 'google',
  'bing.com': 'bing',
  'duckduckgo.com': 'duckduckgo',
  'facebook.com': 'facebook',
  'instagram.com': 'instagram',
  'linkedin.com': 'linkedin',
  't.co': 'twitter',
  'twitter.com': 'twitter',
  'x.com': 'twitter',
};

function bucketReferrer(referrer, ownHost) {
  if (!referrer) return 'direct';
  let host;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '');
  } catch (e) {
    return 'direct';
  }
  if (!host || host === ownHost) return 'direct';
  for (const key in REF_BUCKETS) {
    if (host.includes(key)) return REF_BUCKETS[key];
  }
  return 'other';
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let path = 'other';
  let referrer = '';
  try {
    const body = await request.json();
    if (body && body.path === 'ydelser') path = 'ydelser';
    else if (body && body.path === 'index') path = 'index';
    if (body && typeof body.referrer === 'string') referrer = body.referrer;
  } catch (e) {
    // ignore malformed body, falls back to 'other'
  }

  const ownHost = new URL(request.url).hostname.replace(/^www\./, '');
  const refBucket = bucketReferrer(referrer, ownHost);

  const today = new Date().toISOString().slice(0, 10);
  const keys = ['views:total', `views:${path}`, `views:day:${today}`, `views:ref:${refBucket}`];

  await Promise.all(keys.map(async (key) => {
    const current = parseInt((await env.TOUGAARD_STATS.get(key)) || '0', 10);
    await env.TOUGAARD_STATS.put(key, String(current + 1));
  }));

  return new Response(null, { status: 204 });
}
