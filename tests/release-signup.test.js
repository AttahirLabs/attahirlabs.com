const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const source = fs.readFileSync('functions/api/release-signup.js', 'utf8');
  const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  let writes = 0;
  const env = { RELEASE_SIGNUPS: {
    prepare(sql) { return { bind() { return this; }, async first() { return { attempts: 1 }; } }; },
    async batch() { writes++; }
  } };
  const submit = (data, options = {}, bindings = env) => onRequest({ env: bindings, request: new Request('https://attahirlabs.com/api/release-signup', {
    method: 'POST', headers: { Origin: 'https://attahirlabs.com', 'Content-Type': 'application/x-www-form-urlencoded', ...options.headers },
    body: new URLSearchParams({ app: 'accessshield', email: 'qa@example.com', consent: 'launch-v1', ...data })
  }) });
  assert.equal((await submit({})).status, 200);
  assert.equal(writes, 1);
  for (const data of [{ email: 'bad' }, { email: 'a@b.com\nbcc:x@y.com' }, { app: 'shelflife' }, { consent: '' }, { website: 'bot' }]) {
    assert.equal((await submit(data)).status, 400);
  }
  assert.equal((await submit({}, { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await submit({}, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await submit({ email: 'a'.repeat(3000) })).status, 413);
  assert.equal((await submit({}, {}, {})).status, 503);
  assert.equal((await onRequest({ request: new Request('https://attahirlabs.com/api/release-signup'), env })).status, 405);
  assert.equal(writes, 1, 'Rejected submissions must never be stored');
  for (const app of ['accessshield', 'storechronicle', 'warrantytracker']) {
    const html = fs.readFileSync(`apps/${app}/index.html`, 'utf8');
    assert.match(html, /data-release-signup/);
    assert.ok(html.includes(`name="app" value="${app}"`));
    assert.match(html, /type="email"[^>]+required/);
    assert.match(html, /role="status"/);
  }
  for (const app of ['shelflife', 'tariffshield', 'stockclearance']) {
    assert.doesNotMatch(fs.readFileSync(`apps/${app}/index.html`, 'utf8'), /data-release-signup/);
  }
  console.log('Release signup validation and page coverage passed');
})().catch(error => { console.error(error); process.exit(1); });
