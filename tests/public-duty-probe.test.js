const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const probeModuleUrl = pathToFileURL(path.join(__dirname, '..', 'tools', 'probe-public-duty.mjs')).href;
// Signed identity response fixtures only. No test below fetches the public asset or API.
const plannedAsset = `
const DUTY_API = "https://duty-calc-api-production.up.railway.app";
const RELEASE4_VERSION = "2026.10.01+release4.5";
const DUTY_DECLARATION_CONTRACT = "us-qsp-ordinary-general-rev20/v3";
const RELEASE4_PAYLOAD_HASH = "1a83e4cc04e4ff5b42a87e8db3e0493277ac4f684dc89b0041dc579dae0c5feb";
const RELEASE4_RECORD_HASH = "fe51ed4b906c37c768f8fe560a5efd267b1126852acc6a67cb49c78b9ae5ed77";
const RELEASE4_RESULT_CONTRACT = "tariff.result-contract/v3";
const RELEASE4_SCHEDULE = "2026HTSRev20";
const RELEASE4_INPUT_CONTRACT = "us-qsp-ordinary-general-rev20/v3";
const RELEASE4_EVIDENCE_AS_OF = "2026-10-01T13:05:00Z";
const RELEASE4_EVIDENCE_VALID_THROUGH = "2026-10-08T13:05:00Z";
const RELEASE4_SLICE_ID = "slice:release4:exact-qsp-rev20-ordinary-general";
async function calculate() { const response = await fetch(DUTY_API + "/api/v2/us-duty?" + params); }
`;
const authority = { state: "active", ...{
  "rulesetVersion": "2026.10.01+release4.5",
  "rulesetPayloadHash": "1a83e4cc04e4ff5b42a87e8db3e0493277ac4f684dc89b0041dc579dae0c5feb",
  "releaseRecordHash": "fe51ed4b906c37c768f8fe560a5efd267b1126852acc6a67cb49c78b9ae5ed77",
  "resultContractVersion": "tariff.result-contract/v3",
  "scheduleRevision": "2026HTSRev20",
  "inputContract": "us-qsp-ordinary-general-rev20/v3",
  "evidenceAsOf": "2026-10-01T13:05:00Z",
  "evidenceValidThrough": "2026-10-08T13:05:00Z",
  "activeCoverageSliceIds": [
    "slice:release4:exact-qsp-rev20-ordinary-general"
  ]
} };
function response(status, body) { return { ok: status >= 200 && status < 300, status, text: async () => body, json: async () => body }; }
// Independent gateway identity field ordering; all wire values are canonical fixture strings.
function fingerprint(input) {
  const identity = { destination: 'US', basis: input.calculationBasis };
  for (const key of ['origin', 'manufacturingOrigin', 'thirdCountryProcessing', 'certificationDisposition', 'brokerEntryReference',
    'adCvdStatus', 'adCvdEvidenceRef', 'entryTreatment', 'qspProductStatus', 'qspProductEvidenceRef', 'hts', 'entryAt',
    'customsValue', 'mfnRate', 'forcedLaborCountryHeading', 'forcedLaborExceptionHeading']) identity[key] = input[key];
  for (const key of ['brazilHeading', 'qspHeading', 'qspQuotaStatus', 'qspQuotaEvidenceRef', 'qspQuotaReviewedAt']) identity[key] = input[key] ?? null;
  identity.shippingCost = input.shippingCost; identity.insuranceCost = input.insuranceCost;
  return createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}
function harness(mutate = (_input, _body, _status) => {}, asset = plannedAsset) {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(String(url));
    if (url === 'https://attahirlabs.com/duty/calculator.js') return response(200, asset);
    const input = Object.fromEntries(new URL(url).searchParams);
    let status = 200;
    let body;
    if (input.origin === 'CA') { status = 422; body = { status: 'indeterminate', code: 'UNSUPPORTED_ORIGIN_OR_DESTINATION' }; }
    else if (!input.qspProductStatus) { status = 422; body = { status: 'indeterminate', code: 'QSP_PRODUCT_REVIEW_REQUIRED' }; }
    else {
      const over = input.qspHeading === '9903.45.31';
      body = { status: 'calculated', authority: { ...authority }, inputFingerprint: fingerprint(input), calculation: {
        totalRatePercent: over ? '62.500000' : '37.500000',
        dutyAmount: { amount: over ? '625.00' : '375.00', currency: 'USD' },
        estimatedSubtotal: { amount: over ? '1685.00' : '1435.00', currency: 'USD' }
      } };
    }
    mutate(input, body, status);
    return response(status, body);
  };
  return { requests, fetchImpl, now: () => Date.parse("2026-10-03T15:10:00Z") };
}

test('signed Rev20 probe validates five smoke scenarios and actual v3 wire declarations', async () => {
  const { inspectCalculatorAsset, runPublicDutyProbe } = await import(probeModuleUrl);
  assert.deepEqual(inspectCalculatorAsset(plannedAsset), { apiBase: 'https://duty-calc-api-production.up.railway.app', calculationPath: '/api/v2/us-duty', releaseVersion: authority.rulesetVersion, declarationContract: authority.inputContract });
  const mock = harness();
  const result = await runPublicDutyProbe(mock);
  assert.equal(result.ok, true);
  assert.equal(result.qsp.totalRatePercent, '37.500000');
  assert.equal(result.overQuota.dutyAmount, '625.00');
  assert.equal(result.overQuota.estimatedSubtotal, '1685.00');
  assert.equal(result.exempt.dutyAmount, '375.00');
  assert.equal(result.canada.numberFree, true);
  assert.equal(result.missingProduct.numberFree, true);
  assert.equal(mock.requests.length, 6);
  const inputs = mock.requests.slice(1).map(url => Object.fromEntries(new URL(url).searchParams));
  const [vn, over, br, missing, ca] = inputs;
  for (const input of inputs) {
    assert.equal(input.calculationBasis, 'entry');
    assert.equal(input.mfnRate, '0');
    assert.equal(input.entryAt, '2026-10-03T12:00:00.000Z');
    assert.equal(input.manufacturingOrigin, input.origin);
    assert.equal(input.thirdCountryProcessing, 'none');
    assert.equal(input.certificationDisposition, 'not_required');
    assert.equal(input.adCvdStatus, 'not_subject');
    assert.equal(input.entryTreatment, 'ordinary_general');
    assert.equal(input.forcedLaborExceptionHeading, 'NONE');
    for (const key of ['brokerEntryReference', 'adCvdEvidenceRef', 'qspProductEvidenceRef']) assert.ok(input[key].length >= 8);
    assert.ok(!Object.hasOwn(input, 'destination'));
  }
  assert.equal(vn.origin, 'VN'); assert.equal(vn.forcedLaborCountryHeading, '9903.05.84');
  assert.equal(vn.qspProductStatus, 'subject_qsp'); assert.equal(vn.qspHeading, '9903.45.30');
  assert.equal(vn.qspQuotaStatus, 'allocated_in_quota'); assert.equal(vn.qspQuotaReviewedAt, vn.entryAt);
  assert.equal(over.qspHeading, '9903.45.31'); assert.equal(over.qspQuotaStatus, 'confirmed_over_quota');
  assert.equal(br.origin, 'BR'); assert.equal(br.brazilHeading, '9903.05.01');
  for (const key of ['qspHeading', 'qspQuotaStatus', 'qspQuotaEvidenceRef', 'qspQuotaReviewedAt']) assert.ok(!Object.hasOwn(br, key));
  assert.ok(!Object.hasOwn(missing, 'qspProductStatus')); assert.equal(ca.origin, 'CA');
  assert.ok(inputs.every(input => input.origin !== 'CN'));
  assert.ok(mock.requests.every(url => !url.includes('/api/v1/landed-cost')));
});

test('legacy version, endpoint and absent/wrong v3 contract stop before API requests', async t => {
  const { runPublicDutyProbe } = await import(probeModuleUrl);
  for (const asset of [plannedAsset.replace('2026.10.01+release4.5', '2026.08.24+release4.1'),
    plannedAsset.replace('/api/v2/us-duty', '/api/v1/landed-cost'),
    plannedAsset.replace(/const DUTY_DECLARATION_CONTRACT[^;]+;/, ''),
    plannedAsset.replace('rev20/v3', 'rev20/v2')]) await t.test(asset.slice(0, 65), async () => {
      const mock = harness(undefined, asset);
      await assert.rejects(runPublicDutyProbe(mock), /legacy|version|declaration contract/);
      assert.equal(mock.requests.length, 1);
    });
});

test('supported scenarios require matching numeric amount, currency, request fingerprint and authority', async t => {
  const { runPublicDutyProbe } = await import(probeModuleUrl);
  for (const [name, mutate] of [
    ['amount', (_i, b) => { if (b.calculation) b.calculation.dutyAmount.amount = '425.00'; }],
    ['currency', (_i, b) => { if (b.calculation) b.calculation.dutyAmount.currency = 'CAD'; }],
    ['fingerprint', (_i, b) => { if (b.calculation) b.inputFingerprint = 'f'.repeat(64); }],
    ['version', (_i, b) => { if (b.authority) b.authority.rulesetVersion = '2026.08.24+release4.1'; }],
    ['inactive', (_i, b) => { if (b.authority) b.authority.state = 'review_required'; }],
    ['rulesetPayloadHash', (_i, b) => { if (b.authority) b.authority.rulesetPayloadHash = 'foreign'; }],
    ['releaseRecordHash', (_i, b) => { if (b.authority) b.authority.releaseRecordHash = 'foreign'; }],
    ['resultContractVersion', (_i, b) => { if (b.authority) b.authority.resultContractVersion = 'foreign'; }],
    ['scheduleRevision', (_i, b) => { if (b.authority) b.authority.scheduleRevision = 'foreign'; }],
    ['inputContract', (_i, b) => { if (b.authority) b.authority.inputContract = 'foreign'; }],
    ['evidenceAsOf', (_i, b) => { if (b.authority) b.authority.evidenceAsOf = 'foreign'; }],
    ['evidenceValidThrough', (_i, b) => { if (b.authority) b.authority.evidenceValidThrough = 'foreign'; }],
    ['extra slice', (_i, b) => { if (b.authority) b.authority.activeCoverageSliceIds = [...b.authority.activeCoverageSliceIds, 'slice:foreign']; }],
    ['over-quota', (i, b) => { if (i.qspHeading === '9903.45.31' && b.calculation) b.calculation.totalRatePercent = '37.500000'; }],
    ['exempt', (i, b) => { if (i.origin === 'BR') b.inputFingerprint = undefined; }]
  ]) await t.test(name, async () => { await assert.rejects(runPublicDutyProbe(harness(mutate)), /mismatch/); });
});

test('missing product and Canada containment reject numeric payloads and wrong codes', async t => {
  const { runPublicDutyProbe } = await import(probeModuleUrl);
  for (const condition of [i => i.origin === 'CA', i => !i.qspProductStatus]) for (const field of ['calculation', 'nested', 'code']) {
    await t.test(field, async () => {
      const mock = harness((i, b) => {
        if (!condition(i)) return;
        if (field === 'code') b.code = 'NO_ACTIVE_COVERAGE_MATCH';
        else if (field === 'nested') b.debug = { dutyAmount: { amount: '0.00' } };
        else b.calculation = { totalRatePercent: '0.000000' };
      });
      await assert.rejects(runPublicDutyProbe(mock), /numeric calculation|containment mismatch/);
    });
  }
});


test('every signed calculator asset pin is required and exact before API access', async t => {
  const { runPublicDutyProbe } = await import(probeModuleUrl);
  for (const constant of ['RELEASE4_PAYLOAD_HASH', 'RELEASE4_RECORD_HASH', 'RELEASE4_RESULT_CONTRACT',
    'RELEASE4_SCHEDULE', 'RELEASE4_INPUT_CONTRACT', 'RELEASE4_EVIDENCE_AS_OF', 'RELEASE4_EVIDENCE_VALID_THROUGH', 'RELEASE4_SLICE_ID']) {
    await t.test(constant, async () => {
      const asset = plannedAsset.replace(new RegExp(`(const ${constant} = ")[^"]+`), '$1foreign');
      const mock = harness(undefined, asset);
      await assert.rejects(runPublicDutyProbe(mock), /signed identity mismatch/);
      assert.equal(mock.requests.length, 1);
    });
  }
});


test('probe cannot claim success outside the signed evidence window', async t => {
  const { runPublicDutyProbe } = await import(probeModuleUrl);
  for (const at of ['2026-10-01T13:04:59.999Z', '2026-10-08T13:05:00Z']) await t.test(at, async () => {
    const mock = harness();
    await assert.rejects(runPublicDutyProbe({ ...mock, now: () => Date.parse(at) }), /evidence window/);
    assert.equal(mock.requests.length, 1);
  });
});
