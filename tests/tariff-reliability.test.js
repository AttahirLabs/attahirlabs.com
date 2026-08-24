const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const duty = read('duty/index.html');
const dutyClient = read('duty/calculator.js');
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

assert.match(dutyNotice, /Release 4 exact-QSP calculation/i);
assert.match(dutyNotice, /signed reviewed authority/i);
assert.match(dutyNotice, /unsupported or incomplete cases remain number-free/i);
assert.match(dutyNotice, /HTSUS classification/i);
assert.match(dutyNotice, /base MFN rate/i);
assert.match(dutyNotice, /U\.S\. customs value/i);
assert.match(dutyNotice, /Chapter 99 headings/i);
assert.match(dutyNotice, /not a customs classification, liquidation, or legal determination/i);
assert.doesNotMatch(dutyNotice, /<button|dismiss|hidden/i, 'calculator notice must be persistent');

assert.match(ratesNotice, /country-level legacy planning snapshot/i);
assert.match(ratesNotice, /dataset updated[^<]*March 18, 2026/i);
assert.match(ratesNotice, /evidence verified through[^<]*March 13, 2026/i);
assert.match(ratesNotice, /no row-level derivation/i);
assert.match(ratesNotice, /HTS|product classification/i);
assert.match(ratesNotice, /exemptions/i);
assert.match(ratesNotice, /entry date/i);
assert.match(ratesNotice, /tariff layer/i);
assert.match(ratesNotice, /free-trade|FTA/i);
assert.match(ratesNotice, /special remed/i);
assert.match(ratesNotice, /not for customs filing or final pricing/i);
assert.doesNotMatch(ratesNotice, /<button|dismiss|hidden/i, 'rates notice must be persistent');

assert.ok(
  duty.indexOf('id="dutyAccuracyNotice"') < duty.indexOf('<div class="calc-grid">'),
  'calculator notice must be above its inputs'
);
assert.ok(
  rates.indexOf('id="ratesAccuracyNotice"') < rates.indexOf('<div class="filters">'),
  'rates notice must be above its filters and table'
);

for (const label of ['Ruleset', 'Evidence valid through', 'Authority state', 'Coverage']) {
  assert.match(duty, new RegExp(label, 'i'), `calculator must render the ${label} response label`);
}
for (const label of ['Dataset updated', 'Evidence verified through', 'Provenance', 'State']) {
  assert.match(rates, new RegExp(label, 'i'), `rates table must render the ${label} response label`);
}
assert.match(dutyClient, /\/api\/v2\/us-duty/);
assert.doesNotMatch(dutyClient, /\/api\/v1\/landed-cost/);
assert.match(dutyClient, /if\s*\(\s*!response\.ok\s*\|\|\s*data\.status\s*!==\s*"calculated"\s*\)/, 'calculator must reject non-calculated responses');
assert.match(rates, /if\s*\(\s*!rr\.ok\s*\|\|\s*!mr\.ok\s*\)/, 'rates page must reject non-2xx responses');

assert.doesNotMatch(duty, /Total Landed(?: Cost)?/i);
assert.match(duty, /Estimated subtotal/i);
assert.match(duty, /taxes/i);
assert.match(duty, /brokerage|carrier/i);
assert.match(duty, /processing fees/i);
assert.match(duty, /unsupported tariff programs/i);
assert.match(duty, /shipping and insurance remain outside the customs value/i);

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

console.log('tariff reliability content and containment tests passed');
