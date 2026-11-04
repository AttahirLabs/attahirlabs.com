const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'duty/calculator.js'), 'utf8');
const originalNull = 'const REV22_COMPILED_BINDING = null;';
const materializationId = 'authority-candidate:release-4-rev22-retained26-materialization-20261103-newproposal-2';
// These are software-only in-memory shapes. Production source stays NULL; no
// fixture is an approved target, genuine signature or numerical release.
function syntheticBinding() {
  return {
    schemaVersion: 'tariff.public-rev22-binding/v1', candidateId: materializationId,
    rulesetVersion: '2026.11.03+release4.rev22.retained26.newproposal.2', rulesetPayloadHash: 'a'.repeat(64),
    releaseRecordHash: 'b'.repeat(64), candidateRawSha256: 'c'.repeat(64),
    candidatePayloadSha256: 'd'.repeat(64), exactInputPolicyHash: 'e'.repeat(64),
    resultContractVersion: 'tariff.result-contract/v3', scheduleRevision: '2026HTSRev22',
    inputContract: 'us-qsp-ordinary-general-rev22/v3',
    coverageSliceId: 'slice:release4:exact-qsp-rev22-ordinary-general',
    evidenceAsOf: '2026-10-31T15:28:10Z', evidenceValidThrough: '2026-11-01T15:28:10Z',
    earliestEntryAt: '2026-10-31T15:28:10Z'
  };
}
const values = {
  calculationBasis: 'entry', origin: 'BR', manufacturingOrigin: 'BR',
  thirdCountryProcessing: 'none', certificationDisposition: 'not_required',
  brokerEntryReference: 'broker-entry-reviewed', adCvdStatus: 'not_subject',
  adCvdEvidenceRef: 'broker-adcvd-reviewed', entryTreatment: 'ordinary_general',
  qspProductStatus: 'subject_qsp', qspProductEvidenceRef: 'broker-product-reviewed',
  hts: '7020006000', entryAt: '2026-10-31T16:00:00Z', customsValue: '1000.00',
  mfnRate: '5', forcedLaborCountryHeading: '9903.05.27', forcedLaborExceptionHeading: 'NONE',
  brazilHeading: '9903.05.01', qspHeading: '', qspQuotaStatus: '', qspQuotaEvidenceRef: '',
  qspQuotaReviewedAt: '', shippingCost: '50.00', insuranceCost: '10.00'
};
function context(options = {}) {
  let text = source.replace(/\ninit\(\);\s*$/, '\n');
  if (Object.hasOwn(options, 'binding')) {
    assert.equal(text.split(originalNull).length - 1, 1);
    const literal = JSON.stringify(options.binding);
    text = text.replace(originalNull, `const REV22_COMPILED_BINDING = ${options.freeze === false ? literal : `Object.freeze(${literal})`};`);
  }
  let reads = 0;
  let requests = 0;
  const form = { ...values, ...(options.values || {}) };
  class FixedDate extends Date {
    static now() { return Date.parse(options.now || '2026-10-31T17:00:00Z'); }
  }
  const window = { ...(options.globals || {}) };
  const sandbox = {
    Date: FixedDate, console, window,
    document: {
      documentElement: { dataset: { rev22Binding: JSON.stringify(syntheticBinding()) } },
      getElementById(id) {
        reads++;
        assert.ok(Object.hasOwn(form, id), `Unexpected form field ${id}`);
        return { value: form[id] };
      }
    },
    fetch() { requests++; throw Error('No HTTP is allowed in these helper tests'); }
  };
  Object.assign(sandbox, options.globals || {});
  vm.createContext(sandbox);
  vm.runInContext(text, sandbox);
  return { sandbox, reads: () => reads, requests: () => requests };
}

test('compiled future target is NULL and claims retain a distinct unapproved pending slot', () => {
  assert.ok(source.includes(originalNull));
  const claims = JSON.parse(fs.readFileSync(path.join(root, 'data/tariff-content-claims.json')));
  const duty = claims.pages.find(page => page.path === '/duty/');
  assert.deepEqual(duty.pendingAuthority, { candidateId: materializationId, binding: null, state: 'not_approved' });
  assert.equal(duty.rulesetVersion, '2026.10.01+release4.5');
  assert.equal(duty.reviewAfter, '2026-10-08T13:05:00Z');
  const html = fs.readFileSync(path.join(root, 'duty/index.html'), 'utf8');
  assert.match(html, /data-duty-input-contract="us-qsp-ordinary-general-rev20\/v3"/);
});

test('unconfigured helper refuses before form reads or HTTP and accepts no global/DOM override', () => {
  const ctx = context({ globals: { REV22_COMPILED_BINDING: syntheticBinding() } });
  assert.equal(ctx.sandbox.configuredRev22PublicBinding(), null);
  assert.throws(() => ctx.sandbox.readRev22ExactDutyInput(), error => error.code === 'REV22_BINDING_NOT_CONFIGURED');
  assert.equal(ctx.reads(), 0);
  assert.equal(ctx.requests(), 0);
});

test('future binding schema rejects extra/missing keys, wrong identity/hash/contract and invalid windows', () => {
  for (const mutate of [
    value => { value.extra = 'unreviewed'; }, value => { delete value.releaseRecordHash; },
    value => { value.candidateId = 'authority-candidate:test.invalid:other'; },
    value => { value.rulesetVersion = 'test.invalid:another-version'; },
    value => { value.rulesetPayloadHash = 'not-a-hash'; },
    value => { value.scheduleRevision = '2026HTSRev20'; },
    value => { value.inputContract = 'us-qsp-ordinary-general-rev22/v2'; },
    value => { value.evidenceAsOf = '2026-02-30T15:28:10Z'; },
    value => { value.earliestEntryAt = '2026-08-15T04:00:59Z'; },
    value => { value.earliestEntryAt = '2026-10-31T15:28:11Z'; },
    value => { value.evidenceValidThrough = value.evidenceAsOf; }
  ]) {
    const binding = syntheticBinding(); mutate(binding);
    const ctx = context({ binding });
    assert.equal(ctx.sandbox.configuredRev22PublicBinding(), null);
    assert.throws(() => ctx.sandbox.readRev22ExactDutyInput());
    assert.equal(ctx.reads(), 0);
  }
  assert.equal(context({ binding: syntheticBinding(), freeze: false }).sandbox.configuredRev22PublicBinding(), null);
});

test('software-only injected input binding validates all v3 form facts and exact normalized keys', () => {
  const ctx = context({ binding: syntheticBinding() });
  const input = ctx.sandbox.readRev22ExactDutyInput();
  assert.equal(input.entryAt, '2026-10-31T16:00:00.000Z');
  assert.equal(input.qspProductStatus, 'subject_qsp');
  assert.ok(Object.isFrozen(input));
  assert.equal(ctx.sandbox.rev22NormalizedInputHasExactShape({ ...input, optionalUnknown: 'not permitted' }), false);
  const incomplete = { ...input }; delete incomplete.adCvdEvidenceRef;
  assert.equal(ctx.sandbox.rev22NormalizedInputHasExactShape(incomplete), false);
  assert.equal(ctx.requests(), 0);
  for (const override of [{ qspProductStatus: '' }, { adCvdStatus: 'unknown' },
    { manufacturingOrigin: 'VN' }, { forcedLaborExceptionHeading: '9903.05.27' },
    { hts: '70200060' }, { origin: 'CA', manufacturingOrigin: 'CA' }]) {
    assert.throws(() => context({ binding: syntheticBinding(), values: override }).sandbox.readRev22ExactDutyInput());
  }
});

test('new restrictive entry floor enforces before/equal/after without altering legacy input behavior', () => {
  const before = context({ binding: syntheticBinding(), values: { entryAt: '2026-10-31T15:28:09.999Z' } });
  assert.equal(before.sandbox.readExactDutyInput().entryAt, '2026-10-31T15:28:09.999Z');
  assert.throws(() => before.sandbox.readRev22ExactDutyInput(), error => error.code === 'REV22_ENTRY_BEFORE_REVIEWED_COVERAGE');
  for (const entryAt of ['2026-10-31T15:28:10Z', '2026-10-31T15:28:10.001Z']) {
    assert.ok(context({ binding: syntheticBinding(), values: { entryAt } }).sandbox.readRev22ExactDutyInput());
  }
});

test('review window is exclusive and rejects unavailable clocks before form reads', () => {
  for (const now of ['2026-10-31T15:28:09.999Z', '2026-11-01T15:28:10Z', 'not-an-instant']) {
    const ctx = context({ binding: syntheticBinding(), now });
    assert.throws(() => ctx.sandbox.readRev22ExactDutyInput(), error => error.code === 'REV22_BINDING_OUTSIDE_REVIEW_WINDOW');
    assert.equal(ctx.reads(), 0);
  }
});

test('input-only preparation never authorizes Rev22 API numbers, even in an injected fixture', () => {
  const binding = syntheticBinding();
  for (const ctx of [context(), context({ binding })]) {
    const authority = { state: 'active', ...binding,
      activeCoverageSliceIds: [binding.coverageSliceId] };
    assert.equal(ctx.sandbox.release4AuthorityUsable({ authority }), false);
  }
});
