const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const duty = read('duty/index.html');
const rates = read('duty/rates/index.html');
const articles = new Map([
  ['de minimis', read('blog/de-minimis-threshold-2026/index.html')],
  ['India import duty', read('blog/import-duty-from-india-to-us/index.html')],
  ['Section 232', read('blog/section-232-tariffs-explained/index.html')],
  ['US-China tariffs', read('blog/us-china-tariff-rates-2026/index.html')],
  ['landed cost', read('blog/how-to-calculate-landed-cost/index.html')],
  ['Shopify import duties', read('blog/shopify-import-duties/index.html')]
]);

function sectionBefore(html, id, laterMarker) {
  const start = html.indexOf(`id="${id}"`);
  const end = html.indexOf(laterMarker, start);
  assert.notEqual(start, -1, `missing #${id}`);
  assert.notEqual(end, -1, `missing marker after #${id}: ${laterMarker}`);
  return html.slice(start, end);
}

const dutyNotice = sectionBefore(duty, 'dutyAccuracyNotice', '<div class="calc-grid">');
const ratesNotice = sectionBefore(rates, 'ratesAccuracyNotice', '<div class="filters">');

for (const [name, notice] of [['calculator', dutyNotice], ['rates table', ratesNotice]]) {
  assert.match(notice, /country-level legacy planning snapshot/i, `${name} must identify the legacy scope`);
  assert.match(notice, /dataset updated[^<]*March 18, 2026/i, `${name} must label the dataset update date`);
  assert.match(notice, /evidence verified through[^<]*March 13, 2026/i, `${name} must distinguish the evidence cutoff`);
  assert.match(notice, /no row-level derivation/i);
  assert.match(notice, /HTS|product classification/i);
  assert.match(notice, /exemptions/i);
  assert.match(notice, /entry date/i);
  assert.match(notice, /tariff layer/i);
  assert.match(notice, /free-trade|FTA/i);
  assert.match(notice, /special remed/i);
  assert.match(notice, /not for customs filing or final pricing/i);
  assert.doesNotMatch(notice, /<button|dismiss|hidden/i, `${name} notice must be persistent`);
}

assert.ok(
  duty.indexOf('id="dutyAccuracyNotice"') < duty.indexOf('<div class="calc-grid">'),
  'calculator notice must be above its inputs'
);
assert.ok(
  rates.indexOf('id="ratesAccuracyNotice"') < rates.indexOf('<div class="filters">'),
  'rates notice must be above its filters and table'
);

for (const label of ['Dataset updated', 'Evidence verified through', 'Provenance', 'State']) {
  assert.match(duty, new RegExp(label, 'i'), `calculator must render the ${label} response label`);
  assert.match(rates, new RegExp(label, 'i'), `rates table must render the ${label} response label`);
}
assert.match(duty, /datasetUpdatedAt/);
assert.match(duty, /lastUpdated/, 'legacy update metadata must remain visible on a fail-closed response');
assert.match(duty, /verifiedThrough/);
assert.match(duty, /provenanceStatus/);
assert.match(duty, /RATE_DATA_REVIEW_REQUIRED/);
assert.match(duty, /if\s*\(\s*!res\.ok\s*\)/, 'calculator must reject non-2xx responses');
assert.match(rates, /if\s*\(\s*!rr\.ok\s*\|\|\s*!mr\.ok\s*\)/, 'rates page must reject non-2xx responses');

assert.doesNotMatch(duty, /Total Landed(?: Cost)?/i);
assert.match(duty, /Estimated subtotal/i);
assert.match(duty, /taxes/i);
assert.match(duty, /brokerage|carrier/i);
assert.match(duty, /processing fees/i);
assert.match(duty, /special remedies/i);
assert.match(duty, /optional planning inputs/i);
assert.match(duty, /legally dutiable|customs value[^<]*depends/i);

assert.match(rates, /historical country-level planning assumptions/i);
assert.match(rates, /rateState/);
assert.match(rates, /rateDataState/);
assert.match(rates, /Historical/);
assert.match(rates, /Review required/);
for (const forbidden of [
  /browse all (?:import duty|tariff) rates/i,
  /updated weekly/i,
  /rates updated weekly/i,
  /current country-level comparisons/i,
  /government sources/i
]) {
  assert.doesNotMatch(rates, forbidden, `rates page retains a freshness/provenance overclaim: ${forbidden}`);
}

const forbiddenClaims = [
  ['de minimis', /calculate your exact duty/i],
  ['de minimis', /product category[^<]{0,120}exact landed cost/i],
  ['de minimis', /updated weekly with current tariff rates/i],
  ['de minimis', /know exactly what you(?:'|’)re paying/i],
  ['India import duty', /get your exact duty rate in seconds/i],
  ['India import duty', /enter your product(?:'|’)s HTS code or description/i],
  ['India import duty', /see exactly what you(?:'|’)ll pay/i],
  ['Section 232', /calculator handles Section 232, Section 301, and Section 122 stacking/i],
  ['US-China tariffs', /update our[^<]*tariff calculator[^<]*weekly/i],
  ['US-China tariffs', /exact numbers without doing the arithmetic/i],
  ['US-China tariffs', /calculator gives you exact tariff rates/i],
  ['landed cost', /calculate your exact landed cost in seconds/i],
  ['landed cost', /enter your FOB price, origin country, and HTS code/i],
  ['landed cost', /full breakdown[^<]*MPF[^<]*HMF/i],
  ['Shopify import duties', /calculation for any product and destination market/i]
];

for (const [articleName, pattern] of forbiddenClaims) {
  assert.doesNotMatch(
    articles.get(articleName),
    pattern,
    `${articleName} retains a false calculator capability claim: ${pattern}`
  );
}

const categoricalValuationClaims = [
  ['India import duty', /Duty is calculated on the CIF value[^<]*includes your freight and insurance/i],
  ['US-China tariffs', /On the <strong>CIF value<\/strong>[^<]*shipping and insurance costs increase the base/i],
  ['landed cost', /CBP uses the <strong>CIF value<\/strong> as the dutiable base/i],
  ['landed cost', /calculating duty on your FOB price instead of your CIF value/i],
  ['landed cost', /CIF invoice price <em>is<\/em> your dutiable value[^<]*CBP uses it directly/i],
  ['landed cost', /Duty applies to the full CIF price, freight and all/i],
  ['landed cost', /CIF\. CBP calculates duty on Cost \+ Insurance \+ Freight/i],
  ['Shopify import duties', /including the US under CIF/i],
  ['Shopify import duties', /customs value is \$12 and the 20% tariff adds/i],
  ['Shopify import duties', /declared product value plus international shipping cost \(CIF basis\)/i]
];

for (const [articleName, pattern] of categoricalValuationClaims) {
  assert.doesNotMatch(
    articles.get(articleName),
    pattern,
    `${articleName} retains categorical U.S./global CIF wording: ${pattern}`
  );
}

function calculatorSource(html) {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const source = scripts.map((match) => match[1]).find((script) => script.includes('async function calculate()'));
  assert.ok(source, 'calculator script not found');
  return source.replace(/\ninit\(\);\s*$/, '\n');
}

function makeElement(initial = {}) {
  return {
    value: '',
    style: { display: '' },
    textContent: '',
    innerHTML: '',
    disabled: false,
    children: [],
    appendChild(child) {
      this.children.push(child);
      this.innerHTML = '';
      return child;
    },
    replaceChildren(...children) {
      this.children = children;
      this.innerHTML = '';
      this.textContent = '';
    },
    ...initial
  };
}

function visibleElementText(element) {
  return [
    element.textContent,
    element.innerHTML,
    ...(element.children || []).map(visibleElementText)
  ].join(' ');
}

async function assertReviewRequiredBehavior() {
  const elements = {
    origin: makeElement({ value: 'CN' }),
    destination: makeElement({ value: 'US' }),
    productValue: makeElement({ value: '100' }),
    shippingCost: makeElement({ value: '10' }),
    insuranceCost: makeElement({ value: '5' }),
    error: makeElement(),
    calcBtn: makeElement(),
    placeholder: makeElement({ style: { display: 'none' } }),
    results: makeElement({ style: { display: 'block' } }),
    resultNumbers: makeElement({ style: { display: 'block' } }),
    resultState: makeElement(),
    responseMetadata: makeElement(),
    route: makeElement({ textContent: 'China → United States' }),
    rateDisplay: makeElement({ textContent: '99%' }),
    dutyDisplay: makeElement({ textContent: '$999.00' }),
    totalDisplay: makeElement({ textContent: '$1,114.00' }),
    breakdown: makeElement({ innerHTML: '<span>$1,114.00</span>' }),
    marginDesc: makeElement({ textContent: '99% increase' }),
    disclaimerText: makeElement({ textContent: 'old result' })
  };

  const analyticsCalls = [];
  let resolveFetch;
  const context = {
    URLSearchParams,
    console,
    document: {
      createElement() {
        return makeElement();
      },
      getElementById(id) {
        assert.ok(elements[id], `unexpected calculator element lookup: ${id}`);
        return elements[id];
      }
    },
    window: {
      AttahirAnalytics: {
        once(actionKey, name, params) {
          analyticsCalls.push({ actionKey, name, params });
          return { name, params };
        },
        dutyResultBand() {
          return 'not_available';
        }
      }
    },
    fetch() {
      return new Promise((resolve) => {
        resolveFetch = resolve;
      });
    }
  };
  vm.createContext(context);
  vm.runInContext(calculatorSource(duty), context);

  const calculation = context.calculate();
  await Promise.resolve();
  assert.equal(elements.resultNumbers.style.display, 'none', 'old numeric result must hide before fetch resolves');
  for (const id of ['rateDisplay', 'dutyDisplay', 'totalDisplay']) {
    assert.doesNotMatch(elements[id].textContent, /\d/, `${id} must clear before the request`);
  }
  assert.doesNotMatch(elements.breakdown.innerHTML, /\d/, 'old numeric breakdown must clear before the request');

  resolveFetch({
    ok: false,
    status: 503,
    async json() {
      return {
        error: 'Rate data review required',
        code: 'RATE_DATA_REVIEW_REQUIRED',
        state: 'indeterminate',
        rateData: {
          state: 'review_required',
          datasetUpdatedAt: '2026-03-18',
          verifiedThrough: '2026-03-13',
          provenanceStatus: 'legacy_snapshot_untraced'
        },
        breakdown: {
          dutyRatePercent: '99%',
          dutyAmount: 999,
          totalLandedCost: 1114
        }
      };
    }
  });
  await calculation;

  assert.equal(elements.resultNumbers.style.display, 'none', '503 must never reveal numeric result content');
  for (const id of ['rateDisplay', 'dutyDisplay', 'totalDisplay']) {
    assert.doesNotMatch(elements[id].textContent, /\d/, `${id} must stay number-free after 503`);
  }
  assert.doesNotMatch(elements.breakdown.innerHTML, /\d/, 'partial stale 503 JSON must not enter the breakdown');
  assert.match(elements.resultState.textContent, /indeterminate|review required|unavailable/i);
  const renderedMetadata = visibleElementText(elements.responseMetadata);
  assert.match(renderedMetadata, /2026-03-18/);
  assert.match(renderedMetadata, /2026-03-13/);
  assert.match(renderedMetadata, /legacy snapshot untraced/i);
  assert.ok(analyticsCalls.some((call) => call.name === 'tool_started'));
  assert.ok(analyticsCalls.some((call) => call.name === 'tool_failed'));
  for (const call of analyticsCalls) {
    assert.deepEqual(
      Object.keys(call.params).sort(),
      call.name === 'tool_started'
        ? ['surface', 'tool_name']
        : ['error_code', 'surface', 'tool_name'],
      'analytics must contain stable enums only'
    );
    assert.doesNotMatch(JSON.stringify(call), /CN|US|100|10|5|product|origin|destination/i);
  }
}

assertReviewRequiredBehavior()
  .then(() => console.log('tariff reliability containment tests passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
