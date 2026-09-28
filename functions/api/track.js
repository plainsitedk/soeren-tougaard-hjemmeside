// Records a page view. No IP addresses or cookies are stored here — only
// aggregate counters (total, per-page, per-day, referrer, device, time of day) so this stays GDPR-light.
import { isBot, deviceType, hourBucket, incrementKeys } from '../_lib.js';

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

  const userAgent = request.headers.get('User-Agent') || '';
  if (isBot(userAgent)) {
    return new Response(null, { status: 204 });
  }

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
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const keys = [
    'views:total',
    `views:${path}`,
    `views:day:${today}`,
    `views:ref:${refBucket}`,
    `views:device:${deviceType(userAgent)}`,
    `views:hour:${hourBucket(now)}`,
  ];

  await incrementKeys(env, keys);

  return new Response(null, { status: 204 });
}
