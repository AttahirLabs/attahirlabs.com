const apps = new Set(['accessshield', 'storechronicle', 'warrantytracker']);
const reply = (status, message) => Response.json({ ok: status === 200, message }, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return reply(405, 'Please submit the signup form.');
  const origin = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origin) return reply(403, 'Please use the form on this website.');
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) {
    return reply(415, 'Please use the signup form.');
  }
  let body = '';
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, 'Please enter your email address.');
    const decoder = new TextDecoder();
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) { await reader.cancel(); return reply(413, 'The submission is too large.'); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch { return reply(400, 'Please try submitting the form again.'); }
  const form = new URLSearchParams(body);
  const email = (form.get('email') || '').trim().toLowerCase();
  const app = form.get('app');
  if (form.get('website')) return reply(400, 'Please try submitting the form again.');
  if (!apps.has(app) || form.get('consent') !== 'launch-v1') return reply(400, 'Please confirm the launch notification request.');
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return reply(400, 'Enter a valid email address.');
  if (!env.RELEASE_SIGNUPS) return reply(503, 'Signups are temporarily unavailable. Please try again later.');
  try {
    // Only a daily digest is stored for abuse prevention, never the IP itself.
    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${day}:${ip}`));
    const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const db = env.RELEASE_SIGNUPS;
    const count = await db.prepare(`INSERT INTO signup_limits (key, day, attempts) VALUES (?, ?, 1)
      ON CONFLICT(key) DO UPDATE SET attempts = MIN(attempts + 1, 21) RETURNING attempts`).bind(key, day).first();
    if (count.attempts > 20) return reply(429, 'Too many attempts. Please try again tomorrow.');
    await db.batch([
      db.prepare('DELETE FROM signup_limits WHERE day < ?').bind(day),
      db.prepare(`INSERT INTO release_signups (app, email, consent_version) VALUES (?, ?, 'launch-v1')
        ON CONFLICT(app, email) DO NOTHING`).bind(app, email)
    ]);
    return reply(200, 'You’re on the list! We’ll email you when this app launches.');
  } catch {
    console.error(JSON.stringify({ event: 'release_signup_storage_failed' }));
    return reply(503, 'We couldn’t save your signup. Please try again later.');
  }
}
