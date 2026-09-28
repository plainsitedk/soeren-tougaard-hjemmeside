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
