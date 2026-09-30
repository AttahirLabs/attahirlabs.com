import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Miniflare, convertV4MiniflareOptions } from '../cloudflare-pages/node_modules/miniflare/dist/src/index.js';
const source = fs.readFileSync('functions/api/release-signup.js', 'utf8');
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: "signups", modules: true, script: `${source}\nexport default {fetch(request, env) {return onRequest({request, env});}}`, compatibilityDate: '2026-09-04', d1Databases: ['RELEASE_SIGNUPS'] }] }));
try {
  const db = await mf.getD1Database('RELEASE_SIGNUPS');
  for (const sql of fs.readFileSync('.github/signups/schema.sql', 'utf8').split(';').filter(s => s.trim())) await db.prepare(sql).run();
  const send = (app, email = 'QA@example.com', ip = '192.0.2.1') => mf.dispatchFetch('https://attahirlabs.com/api/release-signup', { method: 'POST', headers: { Origin: 'https://attahirlabs.com', 'CF-Connecting-IP': ip, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ app, email, consent: 'launch-v1' }).toString() });
  assert.equal((await send('accessshield')).status, 200);
  assert.equal((await send('accessshield', 'qa@example.com')).status, 200);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM release_signups').first()).n, 1);
  assert.equal((await send('storechronicle')).status, 200);
  assert.equal((await send('warrantytracker')).status, 200);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM release_signups').first()).n, 3);
  for (let i=0; i<16; i++) assert.equal((await send('accessshield')).status, 200);
  assert.equal((await send('accessshield')).status, 429);
  const row = await db.prepare('SELECT * FROM release_signups LIMIT 1').first();
  assert.equal(row.email, 'qa@example.com');
  assert.equal(row.consent_version, 'launch-v1');
  assert.ok(row.created_at);
  await db.prepare('DROP TABLE release_signups').run();
  assert.equal((await send('accessshield', 'failure@example.com', '192.0.2.2')).status, 503);
  console.log('Real Workers runtime/D1: persistence, app separation, deduplication, rate limit, and storage failure passed');
} finally { await mf.dispose(); }
