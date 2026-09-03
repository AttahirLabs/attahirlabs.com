const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const probeModuleUrl = pathToFileURL(
  path.join(__dirname, '..', 'tools', 'probe-public-duty.mjs')
).href;

const liveAsset = `
const DUTY_API = "https://duty-calc-api-production.up.railway.app";
const RELEASE4_VERSION = "2026.09.03+release4.3";
async function calculate() {
  const response = await fetch(DUTY_API + "/api/v2/us-duty?" + params);
}
`;

const qspBody = {
  status: 'calculated',
  calculation: {
    totalRatePercent: '42.500000',
    dutyAmount: { amount: '425.00', currency: 'USD' },
    estimatedSubtotal: { amount: '1485.00', currency: 'USD' }
  }
};

const canadaBody = {
  status: 'indeterminate',
  code: 'NO_ACTIVE_COVERAGE_MATCH',
  reason: 'No active coverage matches every required exact input.'
};

function response(status, body, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? contentType : null },
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    json: async () => body
  };
}

test('the public duty probe derives and validates the live Release 4 endpoint', async () => {
  const { inspectCalculatorAsset, runPublicDutyProbe } = await import(probeModuleUrl);

  assert.deepEqual(inspectCalculatorAsset(liveAsset), {
    apiBase: 'https://duty-calc-api-production.up.railway.app',
    calculationPath: '/api/v2/us-duty',
    releaseVersion: '2026.09.03+release4.3'
  });

  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(String(url));
    if (url === 'https://attahirlabs.com/duty/calculator.js') {
      return response(200, liveAsset, 'application/javascript; charset=utf-8');
    }
    const parsed = new URL(url);
    if (parsed.searchParams.get('origin') === 'CN') return response(200, qspBody);
    if (parsed.searchParams.get('origin') === 'CA') return response(422, canadaBody);
    throw new Error(`unexpected URL: ${url}`);
  };

  const result = await runPublicDutyProbe({ fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.calculationPath, '/api/v2/us-duty');
  assert.deepEqual(result.qsp, {
    httpStatus: 200,
    status: 'calculated',
    totalRatePercent: '42.500000',
    dutyAmount: '425.00',
    estimatedSubtotal: '1485.00'
  });
  assert.deepEqual(result.canada, {
    httpStatus: 422,
    status: 'indeterminate',
    code: 'NO_ACTIVE_COVERAGE_MATCH',
    numberFree: true
  });
  assert.ok(requested.some((url) => url.includes('/api/v2/us-duty?')));
  assert.ok(requested.every((url) => !url.includes('/api/v1/landed-cost')));
});

test('the probe rejects a legacy public calculator asset before any API request', async () => {
  const { inspectCalculatorAsset, runPublicDutyProbe } = await import(probeModuleUrl);
  const legacyAsset = liveAsset.replace('/api/v2/us-duty', '/api/v1/landed-cost');
  assert.throws(
    () => inspectCalculatorAsset(legacyAsset),
    /legacy \/api\/v1\/landed-cost/i
  );

  let requests = 0;
  await assert.rejects(
    runPublicDutyProbe({
      fetchImpl: async () => {
        requests += 1;
        return response(200, legacyAsset, 'application/javascript');
      }
    }),
    /legacy \/api\/v1\/landed-cost/i
  );
  assert.equal(requests, 1, 'the probe must stop after inspecting the public asset');
});

test('the probe rejects numeric output in an unsupported Canada response', async () => {
  const { runPublicDutyProbe } = await import(probeModuleUrl);
  const fetchImpl = async (url) => {
    if (url === 'https://attahirlabs.com/duty/calculator.js') {
      return response(200, liveAsset, 'application/javascript');
    }
    const parsed = new URL(url);
    if (parsed.searchParams.get('origin') === 'CN') return response(200, qspBody);
    return response(422, {
      ...canadaBody,
      calculation: { totalRatePercent: '0.000000' }
    });
  };

  await assert.rejects(
    runPublicDutyProbe({ fetchImpl }),
    /Canada response exposed a numeric calculation/i
  );
});
