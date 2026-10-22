const gateway = 'https://tariff-shield-production.up.railway.app/api/authority-duty';
const fields = new Set(['calculationBasis', 'origin', 'manufacturingOrigin', 'thirdCountryProcessing',
  'certificationDisposition', 'brokerEntryReference', 'adCvdStatus', 'adCvdEvidenceRef', 'entryTreatment',
  'qspProductStatus', 'qspProductEvidenceRef', 'hts', 'entryAt', 'customsValue', 'mfnRate',
  'forcedLaborCountryHeading', 'forcedLaborExceptionHeading', 'brazilHeading', 'qspHeading',
  'qspQuotaStatus', 'qspQuotaEvidenceRef', 'qspQuotaReviewedAt', 'shippingCost', 'insuranceCost']);
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const unavailable = (code, status = 503) => Response.json({ status: 'indeterminate', code,
  reason: 'No current exact result is available for this request.' }, {
  status, headers: status === 405 ? { ...headers, Allow: 'POST' } : headers
});

async function readBoundedJson(ctx, response, limit, milliseconds) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('BODY_MISSING');
  let timer;
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('BODY_TIMEOUT')), milliseconds); });
  try {
    const chunks = []; let length = 0;
    for (;;) {
      if (ctx.request.signal.aborted) throw new Error('REQUEST_ABORTED');
      const next = await Promise.race([reader.read(), deadline]);
      if (next.done) break;
      length += next.value.byteLength;
      if (length > limit) throw new Error('BODY_LIMIT');
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { raw, value: JSON.parse(raw) };
  } finally {
    clearTimeout(timer);
    ctx.waitUntil(reader.cancel().catch(() => {}));
  }
}

/** Same-origin relay only. The app owns live source admission and exact arithmetic.
 * No credentials, cookies, request logging, stored inputs, cache or retry fallback.
 * Controlled Node tests are not proof of a deployed Cloudflare runtime or legal admission. */
export async function onRequest(ctx) {
  const { request } = ctx;
  if (request.method !== 'POST') return unavailable('METHOD_NOT_ALLOWED', 405);
  if (request.headers.get('Origin') !== new URL(request.url).origin) return unavailable('INVALID_ORIGIN', 403);
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') || '')) return unavailable('INVALID_REQUEST', 400);
  const declared = request.headers.get('Content-Length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 16_384)) return unavailable('INVALID_REQUEST', 400);
  let input;
  try {
    const { raw, value } = await readBoundedJson(ctx, request, 16_384, 5_000);
    if (!value || typeof value !== 'object' || Array.isArray(value) || raw !== JSON.stringify(value) ||
        (declared !== null && Number(declared) !== new TextEncoder().encode(raw).byteLength) ||
        Object.entries(value).some(([key, field]) => !fields.has(key) || typeof field !== 'string') ||
        !['entry', 'per_unit'].includes(value.calculationBasis)) throw new Error('INVALID_INPUT');
    input = JSON.stringify(value);
  } catch { return unavailable('INVALID_REQUEST', 400); }

  const controller = new AbortController();
  let timer;
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => {
    controller.abort(); reject(new Error('GATEWAY_TIMEOUT'));
  }, 20_000); });
  try {
    if (request.signal.aborted) throw new Error('REQUEST_ABORTED');
    const upstream = await Promise.race([fetch(gateway, { method: 'POST', redirect: 'manual',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: input,
      signal: controller.signal }), deadline]);
    if (upstream.status >= 300 && upstream.status < 400) {
      if (upstream.body) ctx.waitUntil(upstream.body.cancel().catch(() => {}));
      throw new Error('GATEWAY_REDIRECT');
    }
    if (!/^application\/json(?:\s*;.*)?$/i.test(upstream.headers.get('Content-Type') || '')) {
      if (upstream.body) ctx.waitUntil(upstream.body.cancel().catch(() => {}));
      throw new Error('GATEWAY_CONTENT_TYPE');
    }
    const { value } = await Promise.race([readBoundedJson(ctx, upstream, 65_536, 20_000), deadline]);
    if (request.signal.aborted) throw new Error('REQUEST_ABORTED');
    if (!upstream.ok || value?.status !== 'calculated') {
      const code = value?.status === 'indeterminate' &&
        ['QSP_PRODUCT_REVIEW_REQUIRED', 'UNSUPPORTED_ORIGIN_OR_DESTINATION'].includes(value.code)
        ? value.code : 'AUTHORITY_RESULT_UNAVAILABLE';
      return unavailable(code, [400, 422, 429].includes(upstream.status) ? upstream.status : 503);
    }
    // Never forward provider headers (including Set-Cookie or CORS). The browser
    // independently validates signed identity, input echo and exact line arithmetic.
    return Response.json(value, { headers });
  } catch { return unavailable('AUTHORITY_RESULT_UNAVAILABLE'); }
  finally { clearTimeout(timer); controller.abort(); request.signal.removeEventListener('abort', abort); }
}
