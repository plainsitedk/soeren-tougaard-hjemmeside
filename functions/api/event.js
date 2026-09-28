// Records a specific user action (contact form sent, ydelse tab opened).
// Same GDPR-light rules as /api/track: no IP, no cookies, aggregate counters only.
import { isBot, incrementKeys } from '../_lib.js';

const YDELSE_SLUGS = new Set([
  'kernefortaelling',
  'kommunikationsstrategi',
  'ledelse-krisestyring',
  'digitalt-indhold',
  'maerkesager',
  'pressearbejde',
  'hyr-kommunikator',
  'indholdstjek',
]);

export async function onRequestPost(context) {
  const { request, env } = context;

  const userAgent = request.headers.get('User-Agent') || '';
  if (isBot(userAgent)) {
    return new Response(null, { status: 204 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(null, { status: 204 });
  }

  const keys = [];
  if (body && body.type === 'contact_submit') {
    keys.push('events:contact_submit');
  } else if (body && body.type === 'ydelse_click' && YDELSE_SLUGS.has(body.slug)) {
    keys.push(`events:ydelse:${body.slug}`);
  }

  if (keys.length) await incrementKeys(env, keys);

  return new Response(null, { status: 204 });
}
