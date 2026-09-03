const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'duty', 'index.html'), 'utf8');
const client = fs.readFileSync(path.join(__dirname, '..', 'duty', 'calculator.js'), 'utf8');

for (const id of [
  'origin',
  'hts',
  'customsValue',
  'mfnRate',
  'forcedLaborCountryHeading',
  'forcedLaborExceptionHeading',
  'brazilHeading',
  'qspHeading',
  'entryAt',
  'shippingCost',
  'insuranceCost'
]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing exact-input field #${id}`);
}

assert.match(html, /destination[^<]{0,80}United States/i, 'the supported destination must be fixed to the United States');
assert.match(client, /\/api\/v2\/us-duty/, 'the calculator must use the signed Release 4 endpoint');
assert.doesNotMatch(client, /\/api\/v1\/landed-cost/, 'the legacy origin-only calculator must stay contained');
assert.match(html, /exact caller-supplied HTSUS, MFN,[^<]{0,40}and Chapter 99 inputs/i);
assert.match(html, /not a customs classification, liquidation, or legal determination/i);
assert.match(html, /shipping and insurance[^<]{0,160}outside[^<]{0,80}customs value/i);
assert.match(client, /status\s*!==\s*["']calculated["']|data\.status\s*===\s*["']indeterminate["']/, 'indeterminate responses must fail closed');
assert.match(client, /clearNumericResult\(\)/, 'the client must clear old numeric output before every request');

assert.match(client, /2026\.09\.03\+release4\.3/, 'the client must pin Release 4.3');
assert.match(client, /5718e84ce12f225bbf0102fbb80689f6676951b23cf5f7755c2f52259a36d7d9/);
assert.match(client, /f11afc122a633d8c6ec30778b904bcba57b4150d045686486a07e24218e7b7ff/);
assert.doesNotMatch(html, /id=["']uasHeading["']/i, 'unsupported UAS scope must not be offered');
assert.doesNotMatch(client, /uasHeading/, 'unsupported UAS scope must not be submitted');

console.log('Release 4 exact-duty calculator contract passed');

class FakeElement {
  constructor(value = '') {
    this.value = value;
    this.style = { display: '' };
    this.textContent = '';
    this.className = '';
    this.disabled = false;
    this.children = [];
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = children;
    this.textContent = '';
  }
}

function makeElements() {
  return {
    origin: new FakeElement('BR'),
    destination: new FakeElement('United States (US)'),
    hts: new FakeElement('61091000'),
    customsValue: new FakeElement('1000.00'),
    mfnRate: new FakeElement('5'),
    forcedLaborCountryHeading: new FakeElement('9903.05.27'),
    forcedLaborExceptionHeading: new FakeElement('NONE'),
    brazilHeading: new FakeElement('9903.05.01'),
    brazilFields: new FakeElement(),
    qspHeading: new FakeElement(''),
    entryAt: new FakeElement('2026-08-17T13:30:00Z'),
    shippingCost: new FakeElement('50.00'),
    insuranceCost: new FakeElement('10.00'),
    error: new FakeElement(),
    calcBtn: new FakeElement(),
    placeholder: new FakeElement(),
    results: new FakeElement(),
    resultNumbers: new FakeElement(),
    resultState: new FakeElement(),
    responseMetadata: new FakeElement(),
    route: new FakeElement(),
    rateDisplay: new FakeElement(),
    dutyDisplay: new FakeElement(),
    totalDisplay: new FakeElement(),
    breakdown: new FakeElement(),
    marginDesc: new FakeElement(),
    disclaimerText: new FakeElement()
  };
}

function visibleText(element) {
  return [element.textContent, ...element.children.map(visibleText)].join(' ');
}

async function runCalculation(response, overrides = {}, now = '2026-09-03T13:00:00Z') {
  const elements = makeElements();
  for (const [id, value] of Object.entries(overrides)) {
    assert.ok(elements[id], `unexpected override #${id}`);
    elements[id].value = value;
  }
  const analytics = [];
  let requestedUrl = '';
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }

    static now() {
      return Date.parse(now);
    }
  }
  const context = {
    Date: FixedDate,
    URLSearchParams,
    console,
    document: {
      createElement() {
        return new FakeElement();
      },
      getElementById(id) {
        assert.ok(elements[id], `unexpected element #${id}`);
        return elements[id];
      }
    },
    window: {
      AttahirAnalytics: {
        once(_key, name, params) {
          analytics.push({ name, params });
        },
        dutyResultBand() {
          return 'high';
        }
      }
    },
    async fetch(url) {
      requestedUrl = String(url);
      return response;
    }
  };
  vm.createContext(context);
  vm.runInContext(client.replace(/\ninit\(\);\s*$/, '\n'), context);
  await context.calculate();
  return { elements, analytics, requestedUrl };
}

function calculatedBody() {
  return {
    status: 'calculated',
    authority: {
      state: 'active',
      rulesetVersion: '2026.09.03+release4.3',
      rulesetPayloadHash: '5718e84ce12f225bbf0102fbb80689f6676951b23cf5f7755c2f52259a36d7d9',
      releaseRecordHash: 'f11afc122a633d8c6ec30778b904bcba57b4150d045686486a07e24218e7b7ff',
      resultContractVersion: 'tariff.result-contract/v3',
      evidenceAsOf: '2026-09-03T12:20:00Z',
      evidenceValidThrough: '2026-09-10T12:20:00Z',
      activeCoverageSliceIds: ['slice:release4:exact-qsp-rev18'],
      scheduleRevision: '2026HTSRev18',
      inputContract: 'exact_caller_supplied_htsus_mfn_chapter99_release4_qsp_only'
    },
    calculation: {
      currency: 'USD',
      customsValue: { amount: '1000.00', currency: 'USD' },
      shippingCost: { amount: '50.00', currency: 'USD' },
      insuranceCost: { amount: '10.00', currency: 'USD' },
      totalRatePercent: '42.500000',
      dutyAmount: { amount: '425.00', currency: 'USD' },
      estimatedSubtotal: { amount: '1485.00', currency: 'USD' },
      lineItems: [
        {
          layer: 'base_mfn',
          authority: 'HTSUS',
          operation: 'replace',
          disposition: 'applied',
          ratePercent: '5.000000',
          dutyAmount: { amount: '50.00', currency: 'USD' },
          ruleIds: ['base'],
          sourceDocumentIds: ['htsus']
        },
        {
          layer: 'section_301',
          authority: 'Chapter 99',
          operation: 'add',
          disposition: 'applied',
          ratePercent: '37.500000',
          dutyAmount: { amount: '375.00', currency: 'USD' },
          ruleIds: ['br', 'forced-labor'],
          sourceDocumentIds: ['fr-br', 'fr-fl']
        }
      ]
    },
    disclaimer: 'Planning estimate under the exact inputs supplied. Not a customs classification, liquidation, or legal determination.'
  };
}

test('entryAt is visibly required in the exact-input UI', () => {
  assert.match(html, /<input[^>]+id=["']entryAt["'][^>]+required/i);
  assert.match(html, /Entry instant[^<]{0,80}\*/i);
  assert.doesNotMatch(html, /Leave blank to evaluate at the API[^<]+current time/i);
});

test('calculated Release 4 response renders only after exact authority and arithmetic validation', async () => {
  const { elements, analytics, requestedUrl } = await runCalculation({
    ok: true,
    status: 200,
    async json() {
      return calculatedBody();
    }
  });
  assert.match(requestedUrl, /\/api\/v2\/us-duty\?/);
  assert.match(requestedUrl, /origin=BR/);
  assert.match(requestedUrl, /brazilHeading=9903\.05\.01/);
  assert.match(requestedUrl, /entryAt=2026-08-17T13%3A30%3A00\.000Z/);
  assert.doesNotMatch(requestedUrl, /destination=/);
  assert.equal(elements.resultNumbers.style.display, 'block');
  assert.equal(elements.rateDisplay.textContent, '42.500000%');
  assert.equal(elements.dutyDisplay.textContent, '$425.00');
  assert.equal(elements.totalDisplay.textContent, '$1485.00');
  assert.match(visibleText(elements.responseMetadata), /2026\.09\.03\+release4\.3/);
  assert.ok(analytics.some(event => event.name === 'tool_completed'));
  assert.ok(!analytics.some(event => event.name === 'tool_failed'));
});

test('valid zero, exempt, and negative cap lines reconcile and render under per-line half-even arithmetic', async () => {
  const body = calculatedBody();
  body.calculation.totalRatePercent = '25.000000';
  body.calculation.dutyAmount.amount = '250.00';
  body.calculation.estimatedSubtotal.amount = '1310.00';
  body.calculation.lineItems = [
    {
      layer: 'base.mfn',
      authority: 'mfn',
      operation: 'replace',
      disposition: 'applied',
      ratePercent: '100.000000',
      dutyAmount: { amount: '1000.00', currency: 'USD' },
      ruleIds: [],
      sourceDocumentIds: [],
    },
    {
      layer: 'special.section232.uas_cap',
      authority: 'section_232',
      operation: 'cap',
      disposition: 'applied',
      ratePercent: '-75.000000',
      dutyAmount: { amount: '-750.00', currency: 'USD' },
      ruleIds: ['uas-cap'],
      sourceDocumentIds: ['uas-source'],
    },
    {
      layer: 'special.zero',
      authority: 'other',
      operation: 'add',
      disposition: 'zero',
      ratePercent: '0.000000',
      dutyAmount: { amount: '0.00', currency: 'USD' },
      ruleIds: ['zero'],
      sourceDocumentIds: [],
    },
    {
      layer: 'special.exempt',
      authority: 'exemption',
      operation: 'exempt',
      disposition: 'exempt',
      ratePercent: '0.000000',
      dutyAmount: { amount: '0.00', currency: 'USD' },
      ruleIds: ['exempt'],
      sourceDocumentIds: [],
    },
  ];
  const { elements } = await runCalculation({ ok: true, status: 200, async json() { return body; } });
  assert.equal(elements.resultNumbers.style.display, 'block');
  assert.equal(elements.rateDisplay.textContent, '25.000000%');
  assert.equal(elements.dutyDisplay.textContent, '$250.00');
  assert.match(visibleText(elements.breakdown), /-\$750\.00/);

  const halfEven = calculatedBody();
  halfEven.calculation.customsValue.amount = '0.01';
  halfEven.calculation.shippingCost.amount = '0.00';
  halfEven.calculation.insuranceCost.amount = '0.00';
  halfEven.calculation.totalRatePercent = '50.000000';
  halfEven.calculation.dutyAmount.amount = '0.00';
  halfEven.calculation.estimatedSubtotal.amount = '0.01';
  halfEven.calculation.lineItems = [{
    layer: 'rounding.tie',
    authority: 'other',
    operation: 'add',
    disposition: 'applied',
    ratePercent: '50.000000',
    dutyAmount: { amount: '0.00', currency: 'USD' },
    ruleIds: ['half-even'],
    sourceDocumentIds: [],
  }];
  const tie = await runCalculation(
    { ok: true, status: 200, async json() { return halfEven; } },
    { customsValue: '0.01', shippingCost: '0', insuranceCost: '0' },
  );
  assert.equal(tie.elements.resultNumbers.style.display, 'block');
  assert.equal(tie.elements.dutyDisplay.textContent, '$0.00');
});

test('the exact QSP scope fact is sent only when supplied', async () => {
  const qsp = await runCalculation(
    { ok: true, status: 200, async json() { return calculatedBody(); } },
    { origin: 'CN', hts: '6810990020', brazilHeading: '', qspHeading: '9903.45.30' },
  );
  assert.match(qsp.requestedUrl, /hts=6810990020/);
  assert.match(qsp.requestedUrl, /qspHeading=9903\.45\.30/);
  assert.doesNotMatch(qsp.requestedUrl, /uasHeading=/);
});

test('entryAt is required, accepts only canonical UTC Z RFC 3339 with at most millisecond precision, and is normalized', async t => {
  for (const [entryAt, encoded] of [
    ['2026-09-03T04:01:00Z', '2026-09-03T04%3A01%3A00.000Z'],
    ['2026-09-03T04:01:00.1Z', '2026-09-03T04%3A01%3A00.100Z'],
    ['2026-09-03T04:01:00.12Z', '2026-09-03T04%3A01%3A00.120Z'],
    ['2026-09-03T04:01:00.123Z', '2026-09-03T04%3A01%3A00.123Z'],
    ['2026-08-15T04:01:00Z', '2026-08-15T04%3A01%3A00.000Z'],
    ['2026-09-03T04:00:59.999Z', '2026-09-03T04%3A00%3A59.999Z'],
    ['2026-09-03T04:01:00.000Z', '2026-09-03T04%3A01%3A00.000Z'],
  ]) {
    await t.test(`normalizes ${entryAt}`, async () => {
      const result = await runCalculation(
        { ok: true, status: 200, async json() { return calculatedBody(); } },
        { entryAt },
      );
      assert.match(result.requestedUrl, new RegExp(`entryAt=${encoded.replaceAll('.', '\\.')}(?:&|$)`));
      assert.equal(result.elements.resultNumbers.style.display, 'block');
    });
  }

  for (const entryAt of [
    '',
    '2026-09-03T04:01:00+00:00',
    '2026-09-03T00:01:00-04:00',
    '2026-09-03T04:01:00.1234Z',
    '2026-02-30T04:01:00Z',
  ]) {
    await t.test(`rejects ${entryAt || 'blank input'}`, async () => {
      const result = await runCalculation(
        { ok: true, status: 200, async json() { return calculatedBody(); } },
        { entryAt },
      );
      assert.equal(result.requestedUrl, '', 'invalid entryAt must not delegate the request time to the API');
      assert.equal(result.elements.resultNumbers.style.display, 'none');
      assert.doesNotMatch(result.elements.rateDisplay.textContent, /\d/);
      assert.ok(result.analytics.some(event => event.name === 'tool_failed'));
      assert.ok(!result.analytics.some(event => event.name === 'tool_started'));
    });
  }
});

test('Release 4 authority requires the exact result contract and live canonical evidence window', async t => {
  const cases = [
    ['missing contract', body => { delete body.authority.resultContractVersion; }],
    ['foreign contract', body => { body.authority.resultContractVersion = 'tariff.result-contract/v2'; }],
    ['inactive state', body => { body.authority.state = 'inactive'; }],
    ['foreign ruleset version', body => { body.authority.rulesetVersion = '2026.08.24+release4.2'; }],
    ['foreign payload hash', body => { body.authority.rulesetPayloadHash = 'a'.repeat(64); }],
    ['foreign release record', body => { body.authority.releaseRecordHash = 'b'.repeat(64); }],
    ['foreign schedule revision', body => { body.authority.scheduleRevision = '2026HTSRev16'; }],
    ['foreign input contract', body => { body.authority.inputContract = 'exact_caller_supplied_htsus_mfn_chapter99'; }],
    ['missing evidence start', body => { delete body.authority.evidenceAsOf; }],
    ['foreign evidence start', body => { body.authority.evidenceAsOf = '2026-08-24T16:20:01Z'; }],
    ['non-canonical evidence start', body => { body.authority.evidenceAsOf = '2026-08-24T16:20:00.000Z'; }],
    ['missing evidence end', body => { delete body.authority.evidenceValidThrough; }],
    ['foreign evidence end', body => { body.authority.evidenceValidThrough = '2026-08-31T16:20:01Z'; }],
    ['invalid evidence end', body => { body.authority.evidenceValidThrough = 'not-an-instant'; }],
    ['reversed evidence window', body => {
      body.authority.evidenceAsOf = '2026-09-10T12:20:00Z';
      body.authority.evidenceValidThrough = '2026-09-03T12:20:00Z';
    }],
    ['non-array slices', body => { body.authority.activeCoverageSliceIds = 'slice:release4:exact-qsp-rev18'; }],
    ['empty slices', body => { body.authority.activeCoverageSliceIds = []; }],
    ['extra slice', body => { body.authority.activeCoverageSliceIds.push('slice:foreign'); }],
    ['foreign slice', body => { body.authority.activeCoverageSliceIds[0] = 'slice:foreign'; }],
    ['non-string slice', body => { body.authority.activeCoverageSliceIds[0] = 7; }],
  ];

  for (const [name, mutate] of cases) {
    await t.test(name, async () => {
      const body = calculatedBody();
      mutate(body);
      const result = await runCalculation({ ok: true, status: 200, async json() { return body; } });
      assert.equal(result.elements.resultNumbers.style.display, 'none');
      assert.match(result.elements.resultState.textContent, /validation failed/i);
    });
  }

  await t.test('rejects a not-yet-valid evidence window at current time', async () => {
    const body = calculatedBody();
    const result = await runCalculation(
      { ok: true, status: 200, async json() { return body; } },
      {},
      '2026-08-17T12:59:59.999Z',
    );
    assert.equal(result.elements.resultNumbers.style.display, 'none');
  });

  await t.test('rejects an expired evidence window at current time', async () => {
    const body = calculatedBody();
    const result = await runCalculation(
      { ok: true, status: 200, async json() { return body; } },
      {},
      '2026-09-10T12:20:00.000Z',
    );
    assert.equal(result.elements.resultNumbers.style.display, 'none');
  });

  await t.test('accepts the exact evidence start boundary at current time', async () => {
    const body = calculatedBody();
    const result = await runCalculation(
      { ok: true, status: 200, async json() { return body; } },
      {},
      '2026-09-03T12:20:00.000Z',
    );
    assert.equal(result.elements.resultNumbers.style.display, 'block');
  });
});

test('calculation requires USD at every money field and reconciles the response to request and aggregate arithmetic', async t => {
  const invalidMutations = [
    ['top-level currency', body => { body.calculation.currency = 'CAD'; }],
    ['customs-value currency', body => { body.calculation.customsValue.currency = 'CAD'; }],
    ['shipping currency', body => { delete body.calculation.shippingCost.currency; }],
    ['insurance currency', body => { body.calculation.insuranceCost.currency = 'EUR'; }],
    ['aggregate duty currency', body => { body.calculation.dutyAmount.currency = 'CAD'; }],
    ['subtotal currency', body => { body.calculation.estimatedSubtotal.currency = 'CAD'; }],
    ['line-item duty currency', body => { delete body.calculation.lineItems[0].dutyAmount.currency; }],
    ['customs-value amount type', body => { body.calculation.customsValue.amount = 1000; }],
    ['shipping amount shape', body => { body.calculation.shippingCost.amount = '50'; }],
    ['insurance amount shape', body => { body.calculation.insuranceCost.amount = '10.000'; }],
    ['aggregate rate type', body => { body.calculation.totalRatePercent = 42.5; }],
    ['aggregate duty amount shape', body => { body.calculation.dutyAmount.amount = '425'; }],
    ['subtotal amount shape', body => { body.calculation.estimatedSubtotal.amount = '1485'; }],
    ['request customs-value mismatch', body => { body.calculation.customsValue.amount = '999.00'; }],
    ['request shipping mismatch', body => { body.calculation.shippingCost.amount = '49.00'; }],
    ['request insurance mismatch', body => { body.calculation.insuranceCost.amount = '9.00'; }],
    ['aggregate rate mismatch', body => { body.calculation.totalRatePercent = '42.000000'; }],
    ['aggregate duty mismatch', body => { body.calculation.dutyAmount.amount = '424.00'; }],
    ['subtotal mismatch', body => { body.calculation.estimatedSubtotal.amount = '1484.00'; }],
    ['line-item rate mismatch', body => { body.calculation.lineItems[0].ratePercent = '4.000000'; }],
    ['line-item duty mismatch', body => { body.calculation.lineItems[0].dutyAmount.amount = '49.00'; }],
    ['line-items member type', body => { body.calculation.lineItems = {}; }],
    ['empty line-items', body => { body.calculation.lineItems = []; }],
    ['invalid line-item member', body => { body.calculation.lineItems[0] = null; }],
    ['missing line-item layer', body => { delete body.calculation.lineItems[0].layer; }],
    ['missing line-item authority', body => { delete body.calculation.lineItems[0].authority; }],
    ['missing line-item operation', body => { delete body.calculation.lineItems[0].operation; }],
    ['foreign line-item operation', body => { body.calculation.lineItems[0].operation = 'multiply'; }],
    ['missing line-item disposition', body => { delete body.calculation.lineItems[0].disposition; }],
    ['foreign line-item disposition', body => { body.calculation.lineItems[0].disposition = 'ignored'; }],
    ['line-item rate type', body => { body.calculation.lineItems[0].ratePercent = 5; }],
    ['line-item duty amount type', body => { body.calculation.lineItems[0].dutyAmount.amount = 50; }],
    ['rule IDs member type', body => { body.calculation.lineItems[0].ruleIds = 'base'; }],
    ['rule ID value type', body => { body.calculation.lineItems[0].ruleIds = [7]; }],
    ['source document IDs member type', body => { body.calculation.lineItems[0].sourceDocumentIds = 'htsus'; }],
    ['source document ID value type', body => { body.calculation.lineItems[0].sourceDocumentIds = [7]; }],
  ];

  for (const [name, mutate] of invalidMutations) {
    await t.test(name, async () => {
      const body = calculatedBody();
      mutate(body);
      const result = await runCalculation({ ok: true, status: 200, async json() { return body; } });
      assert.equal(result.elements.resultNumbers.style.display, 'none');
      assert.doesNotMatch(result.elements.rateDisplay.textContent, /\d/);
      assert.match(result.elements.resultState.textContent, /validation failed/i);
      assert.ok(result.analytics.some(event => event.name === 'tool_failed'));
      assert.ok(!result.analytics.some(event => event.name === 'tool_completed'));
    });
  }
});

test('a stale Release 2 response is rejected without rendering numbers', async () => {
  const body = calculatedBody();
  body.authority.rulesetVersion = '2026.08.13+release2.1';
  const { elements } = await runCalculation({
    ok: true,
    status: 200,
    async json() { return body; },
  });
  assert.equal(elements.resultNumbers.style.display, 'none');
  assert.doesNotMatch(elements.rateDisplay.textContent, /\d/);
  assert.match(elements.resultState.textContent, /validation failed/i);
});

test('indeterminate response clears stale numeric content and never renders injected numbers', async () => {
  const { elements, analytics } = await runCalculation({
    ok: false,
    status: 422,
    async json() {
      return {
        status: 'indeterminate',
        code: 'NO_ACTIVE_COVERAGE_MATCH',
        reason: 'No exact coverage match',
        calculation: {
          totalRatePercent: '99.000000',
          dutyAmount: { amount: '999.00' },
          estimatedSubtotal: { amount: '1999.00' }
        }
      };
    }
  });
  assert.equal(elements.resultNumbers.style.display, 'none');
  assert.doesNotMatch(elements.rateDisplay.textContent, /\d/);
  assert.doesNotMatch(elements.dutyDisplay.textContent, /\d/);
  assert.doesNotMatch(elements.totalDisplay.textContent, /\d/);
  assert.doesNotMatch(visibleText(elements.breakdown), /\d/);
  assert.match(elements.resultState.textContent, /indeterminate/i);
  assert.ok(analytics.some(event => event.name === 'tool_failed'));
  assert.ok(!analytics.some(event => event.name === 'tool_completed'));
});
