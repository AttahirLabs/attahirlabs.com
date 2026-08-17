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
  'uasHeading',
  'entryAt',
  'shippingCost',
  'insuranceCost'
]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing exact-input field #${id}`);
}

assert.match(html, /destination[^<]{0,80}United States/i, 'the supported destination must be fixed to the United States');
assert.match(client, /\/api\/v2\/us-duty/, 'the calculator must use the signed Release 3 endpoint');
assert.doesNotMatch(client, /\/api\/v1\/landed-cost/, 'the legacy origin-only calculator must stay contained');
assert.match(html, /exact caller-supplied HTSUS, MFN,[^<]{0,40}and Chapter 99 inputs/i);
assert.match(html, /not a customs classification, liquidation, or legal determination/i);
assert.match(html, /shipping and insurance[^<]{0,160}outside[^<]{0,80}customs value/i);
assert.match(client, /status\s*!==\s*["']calculated["']|data\.status\s*===\s*["']indeterminate["']/, 'indeterminate responses must fail closed');
assert.match(client, /clearNumericResult\(\)/, 'the client must clear old numeric output before every request');

assert.match(client, /2026\.08\.17\+release3\.1/, 'the client must pin Release 3.1');
assert.match(client, /5b7d90a7892b717c8b479d0abe3b36bc592caa10bccf75c37f7b385206e0f205/);
assert.match(client, /d198c2bf20af75269d5e408b01a4268512f41083f9b2ddfd12c40a2ea9301217/);

console.log('Release 3 exact-duty calculator contract passed');

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
    uasHeading: new FakeElement(''),
    entryAt: new FakeElement(''),
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

async function runCalculation(response, overrides = {}) {
  const elements = makeElements();
  for (const [id, value] of Object.entries(overrides)) {
    assert.ok(elements[id], `unexpected override #${id}`);
    elements[id].value = value;
  }
  const analytics = [];
  let requestedUrl = '';
  const context = {
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
      rulesetVersion: '2026.08.17+release3.1',
      rulesetPayloadHash: '5b7d90a7892b717c8b479d0abe3b36bc592caa10bccf75c37f7b385206e0f205',
      releaseRecordHash: 'd198c2bf20af75269d5e408b01a4268512f41083f9b2ddfd12c40a2ea9301217',
      evidenceValidThrough: '2027-08-17',
      activeCoverageSliceIds: ['slice:release3:exact-chapter99-rev16-qsp-uas'],
      scheduleRevision: '2026HTSRev16',
      inputContract: 'exact_caller_supplied_htsus_mfn_chapter99_release3'
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
          ratePercent: '5.000000',
          dutyAmount: { amount: '50.00', currency: 'USD' },
          ruleIds: ['base'],
          sourceDocumentIds: ['htsus']
        },
        {
          layer: 'section_301',
          authority: 'Chapter 99',
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

test('calculated Release 3 response renders only after exact authority and arithmetic validation', async () => {
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
  assert.doesNotMatch(requestedUrl, /destination=/);
  assert.equal(elements.resultNumbers.style.display, 'block');
  assert.equal(elements.rateDisplay.textContent, '42.500000%');
  assert.equal(elements.dutyDisplay.textContent, '$425.00');
  assert.equal(elements.totalDisplay.textContent, '$1485.00');
  assert.match(visibleText(elements.responseMetadata), /2026\.08\.17\+release3\.1/);
  assert.ok(analytics.some(event => event.name === 'tool_completed'));
  assert.ok(!analytics.some(event => event.name === 'tool_failed'));
});

test('QSP and future UAS exact scope facts are sent only when supplied', async () => {
  const qsp = await runCalculation(
    { ok: true, status: 200, async json() { return calculatedBody(); } },
    { origin: 'CN', hts: '6810990020', brazilHeading: '', qspHeading: '9903.45.30' },
  );
  assert.match(qsp.requestedUrl, /hts=6810990020/);
  assert.match(qsp.requestedUrl, /qspHeading=9903\.45\.30/);
  assert.doesNotMatch(qsp.requestedUrl, /uasHeading=/);

  const uas = await runCalculation(
    { ok: true, status: 200, async json() { return calculatedBody(); } },
    {
      origin: 'CN',
      hts: '8504409580',
      brazilHeading: '',
      uasHeading: '9903.08.21',
      entryAt: '2026-09-03T04:01:00Z',
    },
  );
  assert.match(uas.requestedUrl, /uasHeading=9903\.08\.21/);
  assert.match(uas.requestedUrl, /entryAt=2026-09-03T04%3A01%3A00Z/);
  assert.doesNotMatch(uas.requestedUrl, /qspHeading=/);
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
