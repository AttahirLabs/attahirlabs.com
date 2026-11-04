const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Controlled Node Fetch transport tests; these do not establish Cloudflare
// deployment, source admission, signed legal approval or live browser parity.
const source = fs.readFileSync(path.join(__dirname, '../functions/api/authority-duty.js'), 'utf8');
const origin = 'https://fixture.invalid';
const fields = { calculationBasis: 'per_unit', origin: 'VN', manufacturingOrigin: 'VN',
  customsValue: '1000.00', brokerEntryReference: 'owned-entry-review' };
const request = (body = JSON.stringify(fields), changes = {}) => new Request(origin + '/api/authority-duty', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...changes.headers },
  body, ...Object.fromEntries(Object.entries(changes).filter(([key]) => key !== 'headers'))
});
function harness(fetchImpl, timers = {}) {
  const calls = [], cleanup = [];
  const context = { Response, URL, Uint8Array, TextDecoder, TextEncoder, AbortController,
    setTimeout, clearTimeout, ...timers, fetch: (...args) => { calls.push(args); return fetchImpl(...args); } };
  vm.createContext(context);
  vm.runInContext(source.replace('export async function onRequest', 'async function onRequest'), context);
  return { calls, cleanup, call: req => context.onRequest({ request: req, waitUntil(promise) { cleanup.push(promise); } }) };
}
const upstream = (body, status = 200, extra = {}) => Response.json(body, { status, headers: extra });
const numberFree = body => assert.doesNotMatch(JSON.stringify(body), /calculation|dutyAmount|totalRatePercent|estimatedSubtotal|customsValue/);

test('forwards canonical strings and basis to the fixed gateway without caller credentials or caching headers', async () => {
  const positive = { status: 'calculated', inputFingerprint: 'fixture-only-not-authority' };
  const h = harness(async () => upstream(positive, 200, { 'Set-Cookie': 'secret=example', 'Access-Control-Allow-Origin': '*' }));
  const response = await h.call(request(undefined, { headers: { Cookie: 'shop=example', Authorization: 'Bearer fixture-only' } }));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), positive);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Set-Cookie'), null); assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(h.calls.length, 1);
  const [url, options] = h.calls[0];
  assert.equal(url, 'https://tariff-shield-production.up.railway.app/api/authority-duty');
  assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'manual');
  assert.equal(options.body, JSON.stringify(fields));
  assert.equal(Object.keys(options.headers).length, 2);
  assert.equal(options.headers.Authorization, undefined); assert.equal(options.headers.Cookie, undefined);
});
test('refuses methods, cross-origin requests and invalid bodies before provider contact', async t => {
  const cases = [new Request(origin + '/api/authority-duty'), request(undefined, { headers: { Origin: 'https://foreign.invalid' } }),
    request('{}'), request(JSON.stringify({ ...fields, endpoint: 'https://foreign.invalid' })),
    request(JSON.stringify({ ...fields, customsValue: 1000 })), request('{"calculationBasis":"entry","calculationBasis":"per_unit"}'),
    request(JSON.stringify({ ...fields, calculationBasis: 'bad' })), request(JSON.stringify({ ...fields, shop: 'other.myshopify.com' })),
    request('x'.repeat(16_385)), request(undefined, { headers: { 'Content-Length': '999999' } })];
  for (const [i, req] of cases.entries()) await t.test(String(i), async () => {
    const h = harness(async () => { throw new Error('must not contact'); });
    const response = await h.call(req); assert.ok([400, 403, 405].includes(response.status));
    if (response.status === 405) assert.equal(response.headers.get('Allow'), 'POST');
    numberFree(await response.json()); assert.equal(h.calls.length, 0);
  });
});
test('contains non-success states and never forwards stale numbers or arbitrary provider diagnostics', async t => {
  for (const [status, body] of [[503, { status: 'calculated', calculation: { dutyAmount: 42 } }],
    [422, { status: 'indeterminate', code: 'QSP_PRODUCT_REVIEW_REQUIRED', calculation: { dutyAmount: 42 } }],
    [200, { status: 'indeterminate', reason: 'sensitive fixture diagnostic', calculation: { dutyAmount: 42 } }]]) await t.test(String(status), async () => {
    const h = harness(async () => upstream(body, status));
    const response = await h.call(request());
    assert.equal(response.status, status === 422 ? 422 : 503); const result = await response.json(); numberFree(result);
    assert.doesNotMatch(JSON.stringify(result), /sensitive fixture/);
    assert.equal(h.calls.length, 1);
  });
});
test('rejects invalid content type, malformed or oversized upstream JSON without fallback', async t => {
  for (const response of [new Response(null, { status: 302, headers: { Location: 'https://foreign.invalid/' } }),
    new Response('<html>fixture</html>'), new Response('{', { headers: { 'Content-Type': 'application/json' } }),
    upstream({ status: 'calculated', extra: 'x'.repeat(65_536) })]) await t.test('invalid upstream', async () => {
    const h = harness(async () => response); const result = await h.call(request());
    assert.equal(result.status, 503); numberFree(await result.json()); assert.equal(h.calls.length, 1);
  });
});
test('fixed transport timeout aborts the one request and returns number-free failure', async () => {
  const timers = new Map(); let signal;
  const h = harness((_url, options) => { signal = options.signal; queueMicrotask(() => timers.get(20_000)()); return new Promise(() => {}); }, {
    setTimeout(fn, ms) { timers.set(ms, fn); return ms; }, clearTimeout(ms) { timers.delete(ms); }
  });
  const response = await h.call(request()); assert.equal(response.status, 503); numberFree(await response.json());
  assert.equal(signal.aborted, true); assert.equal(h.calls.length, 1); assert.equal(timers.size, 0);
});
