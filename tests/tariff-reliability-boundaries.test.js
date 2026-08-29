const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const duty = read('duty/index.html');
const rates = read('duty/rates/index.html');
const NOW = '2026-07-24T04:00:00.000Z';
const FUTURE_REVIEW = '2026-07-25T04:00:00.000Z';

function inlineScript(html, marker) {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const source = scripts.map((match) => match[1]).find((script) => script.includes(marker));
  assert.ok(source, `inline script containing ${marker} not found`);
  return source.replace(/\ninit\(\);\s*$/, '\n');
}

const ratesScript = inlineScript(rates, 'function filterRates()');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class FakeElement {
  constructor(tagName = 'div', initial = {}) {
    this.tagName = tagName.toUpperCase();
    this.style = { display: '' };
    this.value = '';
    this.disabled = false;
    this.className = '';
    this.attributes = {};
    this.children = [];
    this._textContent = '';
    this._innerHTML = '';
    Object.assign(this, initial);
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join('');
  }

  set textContent(value) {
    this._textContent = String(value ?? '');
    this._innerHTML = '';
    this.children = [];
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    return this.children.map((child) => child.serialize()).join('');
  }

  set innerHTML(value) {
    this._innerHTML = String(value ?? '');
    this._textContent = '';
    this.children = [];
  }

  appendChild(child) {
    this._innerHTML = '';
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this._innerHTML = '';
    this._textContent = '';
    this.children = [...children];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  serialize() {
    const attributes = [
      this.className ? `class="${escapeHtml(this.className)}"` : '',
      ...Object.entries(this.attributes).map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    ].filter(Boolean).join(' ');
    const body = this._innerHTML || escapeHtml(this._textContent) + this.children.map((child) => child.serialize()).join('');
    return `<${this.tagName.toLowerCase()}${attributes ? ` ${attributes}` : ''}>${body}</${this.tagName.toLowerCase()}>`;
  }
}

function fixedDate(iso) {
  const RealDate = Date;
  return class FixedDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [iso]));
    }

    static now() {
      return RealDate.parse(iso);
    }
  };
}

const invalidRates = [
  ['object', { injected: 15 }],
  ['nonnumeric string', 'abc'],
  ['numeric-prefix markup-like string', '15%<img src=x onerror="globalThis.pwned=true">'],
  ['NaN string', 'NaN'],
  ['Infinity string', 'Infinity'],
  ['negative', -5],
  ['greater than 100', 100.01]
];

function rendered(element) {
  return `${element.textContent} ${element.innerHTML}`;
}

function ratesElements() {
  return {
    marketFilter: new FakeElement('select', { value: '' }),
    search: new FakeElement('input', { value: '' }),
    count: new FakeElement(),
    tbody: new FakeElement('tbody'),
    ratesResponseMetadata: new FakeElement()
  };
}

function historicalRate(rate) {
  return {
    origin: { code: 'JP', name: 'Japan' },
    destination: 'US',
    region: 'Asia',
    rate,
    rateState: 'historical',
    rateDataState: 'review_required'
  };
}

function historicalMetadata() {
  return {
    datasetUpdatedAt: '2026-03-18',
    verifiedThrough: '2026-03-13',
    provenanceStatus: 'legacy_snapshot_untraced',
    state: 'degraded',
    usable: false,
    reviewAfter: '2026-07-23T04:00:00.000Z',
    markets: {
      US: {
        datasetUpdatedAt: '2026-03-18',
        verifiedThrough: '2026-03-13',
        provenanceStatus: 'legacy_snapshot_untraced',
        state: 'review_required',
        usable: false,
        reviewAfter: '2026-07-23T04:00:00.000Z'
      }
    }
  };
}

async function runRatesPage(rateBody, marketBody = {}) {
  const elements = ratesElements();
  const context = {
    Date: fixedDate(NOW),
    console,
    document: {
      createElement(tagName) {
        return new FakeElement(tagName);
      },
      getElementById(id) {
        assert.ok(elements[id], `unexpected rates element lookup: ${id}`);
        return elements[id];
      }
    },
    async fetch(url) {
      const body = url.includes('/rates?') ? rateBody : marketBody;
      return {
        ok: true,
        status: 200,
        async json() {
          return body;
        }
      };
    }
  };
  vm.createContext(context);
  vm.runInContext(ratesScript, context);
  await context.init();
  return elements;
}

for (const [name, suppliedRate] of invalidRates) {
  test(`rates table rejects ${name} rate without markup or a numeric row`, async () => {
    const elements = await runRatesPage(
      { rates: [historicalRate(suppliedRate)], rateData: historicalMetadata() },
      { markets: [], rateData: historicalMetadata() }
    );
    assert.doesNotMatch(rendered(elements.tbody), /<img|onerror/i);
    assert.doesNotMatch(rendered(elements.tbody), /Japan|United States|Asia|%/);
  });
}

for (const [name, rateBody] of [
  ['missing response metadata', { rates: [historicalRate(15)] }],
  ['malformed response metadata', { rates: [historicalRate(15)], rateData: 'review_required' }],
  ['missing metadata fields', { rates: [historicalRate(15)], rateData: { state: 'review_required' } }],
  ['missing row state labels', {
    rates: [{ ...historicalRate(15), rateState: undefined, rateDataState: undefined }],
    rateData: historicalMetadata()
  }]
]) {
  test(`rates table hides numeric rows with ${name}`, async () => {
    const elements = await runRatesPage(rateBody, {
      markets: [],
      rateData: historicalMetadata()
    });
    assert.doesNotMatch(rendered(elements.tbody), /15%/);
  });
}

test('rates table renders only validated historical, review-required rows with both labels', async () => {
  const elements = await runRatesPage(
    { rates: [historicalRate(15)], rateData: historicalMetadata() },
    { markets: [], rateData: historicalMetadata() }
  );
  assert.match(rendered(elements.tbody), /15%/);
  assert.match(rendered(elements.tbody), /Historical/);
  assert.match(rendered(elements.tbody), /Review required/);
});

test('rates table does not interpolate API rows into innerHTML', () => {
  assert.doesNotMatch(ratesScript, /tbody[^;\n]*\.innerHTML\s*=\s*html/);
  assert.doesNotMatch(ratesScript, /\+\s*r\.rate\s*\+\s*['"]%/);
});

function dutyLinkContexts(html) {
  const content = html.replace(/<nav\b[\s\S]*?<\/nav>/gi, '');
  const contexts = [];
  for (const match of content.matchAll(/href\s*=\s*(["'])\/duty\/\1/gi)) {
    const anchor = match.index;
    const paragraphStart = content.lastIndexOf('<p', anchor);
    const paragraphEndBefore = content.lastIndexOf('</p>', anchor);
    if (paragraphStart > paragraphEndBefore) {
      const end = content.indexOf('</p>', anchor);
      assert.notEqual(end, -1, 'DutyCalc-linked paragraph is not closed');
      contexts.push(content.slice(paragraphStart, end + 4));
      continue;
    }

    const before = content.slice(0, anchor);
    const ctaMatches = [...before.matchAll(/<div\b[^>]*class="[^"]*(?:cta|callout)[^"]*"[^>]*>/gi)];
    assert.ok(ctaMatches.length > 0, 'DutyCalc link is outside a paragraph or CTA/callout');
    const start = ctaMatches.at(-1).index;
    const end = content.indexOf('</div>', anchor);
    assert.notEqual(end, -1, 'DutyCalc-linked CTA/callout is not closed');
    contexts.push(content.slice(start, end + 6));
  }
  return contexts;
}

// The normalized 70-article CTA contract replaced broad DutyCalc sales links
// with one reviewed app/resource CTA per article. These are the exact remaining
// editorial DutyCalc contexts; changing this inventory requires claim review.
const reviewedDutyLinkedBlogFiles = [
  'blog/amazon-fba-landed-cost-guide/index.html',
  'blog/cbp-tariff-refund-portal-live/index.html',
  'blog/customs-broker-due-diligence-checklist-for-shopify-merchants/index.html',
  'blog/customs-broker-shopify/index.html',
  'blog/ddp-vs-duties-at-checkout-for-shopify-how-merchants-actually-handle-import-charges/index.html',
  'blog/de-minimis-threshold-2026/index.html',
  'blog/dead-stock-prevention-guide-shopify-slow-movers/index.html',
  'blog/gamestop-retro-inventory-playbook-2026/index.html',
  'blog/product-batch-tracking-and-fefo-for-shopify/index.html',
  'blog/quartz-countertop-tariffs-2026/index.html',
  'blog/section-232-full-value-tariffs-on-steel-aluminum-and-copper-goods/index.html',
  'blog/tariff-engineering-legal-ways-to-reduce-import-duties-2026/index.html',
  'blog/us-drone-tariffs-2026/index.html'
];

function plainText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|#39|quot);/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

const positiveCalculatorOverclaims = [
  ['HTS or product-description input', /\b(?:calculator|dutycalc|tool)\b[^.!?]{0,220}\b(?:enter|input|accepts?|uses?|appl(?:y|ies)|provide)\b[^.!?]{0,100}\b(?:HTS|HS code|product description)\b/i],
  ['HTS or product-description input', /\b(?:enter|input|accepts?|provide)\b[^.!?]{0,100}\b(?:HTS|HS code|product description)\b[^.!?]{0,220}\b(?:calculator|dutycalc|tool)\b/i],
  ['current tariff stacking', /\b(?:calculator|dutycalc|tool)\b[^.!?]{0,240}\b(?:checks?|calculates?|models?|handles?|appl(?:y|ies)|includes?|shows?|estimates?)\b[^.!?]{0,180}\b(?:current tariff (?:layers?|stack)|full (?:duty|tariff) stack|other tariff layers|Section (?:232|301|122))\b/i],
  ['current tariff stacking', /\b(?:current tariff (?:layers?|stack)|full (?:duty|tariff) stack|other tariff layers)\b[^.!?]{0,160}\b(?:use|try)\b[^.!?]{0,80}\b(?:calculator|dutycalc|tool)\b/i],
  ['automatic CUSMA/USMCA treatment', /\b(?:calculator|dutycalc|tool)\b[^.!?]{0,180}\b(?:CUSMA|USMCA)\b[^.!?]{0,100}\b(?:automatic|factor(?:ed|s)?\s+in|appl(?:y|ies))\b/i],
  ['automatic CUSMA/USMCA treatment', /\b(?:CUSMA|USMCA)\b[^.!?]{0,150}\b(?:automatic|factor(?:ed|s)?\s+in)\b[^.!?]{0,180}\b(?:calculator|dutycalc|tool)\b/i],
  ['exact, actual, or current duty output', /\b(?:calculator|dutycalc|tool)\b[^.!?]{0,160}\b(?:shows?|returns?|calculates?|gives?|checks?)\b[^.!?]{0,60}\b(?:exact|actual|current)\b[^.!?]{0,80}\b(?:dut(?:y|ies)|tariff|landed cost)\b/i],
  ['exact, actual, or current duty output', /\b(?:know|see|get|calculate|check)\b[^.!?]{0,50}\b(?:exact|actual|current)\b[^.!?]{0,80}\b(?:dut(?:y|ies)|tariff|landed cost)\b[^.!?]{0,160}\b(?:calculator|dutycalc|tool)\b/i],
  ['non-duty fee coverage', /\b(?:calculator|dutycalc|tool)\b[^.!?]{0,180}\b(?:calculates?|estimates?|shows?|returns?|includes?|covers?|handles?|accounts? for|factors? in)\b[^.!?]{0,180}\b(?:(?:customs|brokerage|broker|carrier|processing|Amazon|FBA|freight|shipping)\s+(?:fees?|charges?)|tax(?:es)?)\b/i],
  ['non-duty fee coverage', /\b(?:(?:customs|brokerage|broker|carrier|processing|Amazon|FBA|freight|shipping)\s+(?:fees?|charges?)|tax(?:es)?)\b[^.!?]{0,180}\b(?:calculates?|estimates?|shows?|returns?|includes?|covers?|handles?|accounts? for|factors? in)\b[^.!?]{0,180}\b(?:calculator|dutycalc|tool)\b/i],
  ['delivered or all-in cost coverage', /\b(?:calculator|dutycalc|tool)\b[^.!?]{0,180}\b(?:calculates?|estimates?|shows?|returns?|includes?|covers?|handles?)\b[^.!?]{0,140}\b(?:delivered(?: import)? cost|all-in(?: landed)? cost|total landed cost|full landed cost)\b/i],
  ['delivered or all-in cost coverage', /\b(?:delivered(?: import)? cost|all-in(?: landed)? cost|total landed cost|full landed cost)\b[^.!?]{0,180}\b(?:calculates?|estimates?|shows?|returns?|includes?|covers?|handles?)\b[^.!?]{0,180}\b(?:calculator|dutycalc|tool)\b/i]
];

const nonUsJurisdiction = '(?:Canada|Canadian|United Kingdom|U\\.?K\\.?|Europe|European Union|E\\.?U\\.?|Mexico|Mexican|Australia|Australian|New Zealand|Japan|Japanese|India|Indian|Vietnam|Vietnamese)';
const nonUsSupportPatterns = [
  new RegExp(`\\b${nonUsJurisdiction}\\b[^.!?]{0,180}\\b(?:can|may|should)?\\s*(?:use|try|rely on)\\b[^.!?]{0,100}\\b(?:calculator|dutycalc|tool)\\b`, 'i'),
  new RegExp(`\\b(?:calculator|dutycalc|tool)\\b[^.!?]{0,180}\\b(?:supports?|works? for|can be used (?:for|in)|estimates? (?:imports? )?(?:for|in))\\b[^.!?]{0,100}\\b${nonUsJurisdiction}\\b`, 'i'),
  new RegExp(`\\b(?:use|try|rely on)\\b[^.!?]{0,100}\\b(?:calculator|dutycalc|tool)\\b[^.!?]{0,100}\\b(?:for|in|with)\\b[^.!?]{0,60}\\b${nonUsJurisdiction}\\b`, 'i')
];

function isExplicitlyNegated(value) {
  const semanticVerbs = [...value.matchAll(/\b(?:enters?|inputs?|accepts?|uses?|appl(?:y|ies)|provides?|checks?|calculates?|estimates?|models?|handles?|includes?|shows?|returns?|gives?|knows?|sees?|gets?|covers?|accounts?|factors?|supports?|supported|works?|worked|tries?|tried|relies?|relied)\b/gi)];
  const target = semanticVerbs.at(-1);
  if (!target) return false;
  const prefix = value.slice(Math.max(0, target.index - 32), target.index);
  return /(?:\b(?:does|do|can|will|should)\s+not\s+|\b(?:doesn't|don't|cannot|can't|won't|shouldn't)\s*)$/i.test(prefix);
}

function calculatorClaimFailures(text) {
  const failures = [];
  for (const [claim, pattern] of positiveCalculatorOverclaims) {
    const match = text.match(pattern);
    if (!match) continue;
    if (isExplicitlyNegated(match[0])) continue;
    failures.push(claim);
  }
  for (const pattern of nonUsSupportPatterns) {
    const match = text.match(pattern);
    if (match && !isExplicitlyNegated(match[0])) failures.push('non-U.S. jurisdiction support');
  }
  return [...new Set(failures)];
}

test('DutyCalc semantic guard rejects fee, all-in-cost, and non-U.S. support implications', () => {
  assert.ok(
    calculatorClaimFailures('The duty calculator estimates customs fees, brokerage fees, carrier fees, processing fees, and Amazon fees.').includes('non-duty fee coverage')
  );
  assert.ok(
    calculatorClaimFailures('Use the calculator to calculate delivered cost and all-in landed cost.').includes('delivered or all-in cost coverage')
  );
  assert.ok(
    calculatorClaimFailures('Canadian merchants can use the duty calculator to estimate import duty.').includes('non-U.S. jurisdiction support')
  );
  assert.deepEqual(
    calculatorClaimFailures('The calculator does not calculate customs fees, brokerage fees, carrier fees, processing fees, Amazon fees, or delivered import cost.'),
    []
  );
  assert.deepEqual(
    calculatorClaimFailures('For Canadian imports, do not use a U.S. calculator result. The free duty calculator supports only U.S. scenarios with exact inputs.'),
    []
  );
});

for (const [name, text, expectedClaim] of [
  ['tax coverage', 'The duty calculator calculates taxes.', 'non-duty fee coverage'],
  ['freight coverage', 'The duty calculator estimates freight charges.', 'non-duty fee coverage'],
  ['explicit Canadian use', 'Use the duty calculator for Canadian imports.', 'non-U.S. jurisdiction support'],
  ['positive fee claim after unrelated caveat', 'The duty calculator does not classify products, but estimates brokerage fees.', 'non-duty fee coverage']
]) {
  test(`DutyCalc semantic guard rejects ${name}`, () => {
    assert.ok(calculatorClaimFailures(text).includes(expectedClaim));
  });
}

test('DutyCalc semantic guard preserves exact-input U.S. wording and genuine disclaimer-only negatives', () => {
  assert.deepEqual(
    calculatorClaimFailures('For a supported U.S. exact-input scenario, use the free duty calculator to estimate duty.'),
    []
  );
  assert.deepEqual(
    calculatorClaimFailures('The calculator does not calculate taxes, freight charges, shipping charges, brokerage fees, or delivered import cost.'),
    []
  );
  assert.deepEqual(
    calculatorClaimFailures('For Canadian imports, do not use the U.S. duty calculator. It supports only U.S. destinations with exact inputs.'),
    []
  );
});

test('blog DutyCalc links are claim-safe and the repaired CUSMA sources and FAQ schema stay aligned', () => {
  const ctaContract = JSON.parse(read('data/blog-cta-contract.json'));
  const blogFiles = Object.keys(ctaContract.articles)
    .map((slug) => path.join('blog', slug, 'index.html'))
    .sort();
  assert.equal(blogFiles.length, 70, 'canonical CTA-contract blog scan unexpectedly narrowed');

  let contextCount = 0;
  const dutyLinkedBlogFiles = [];
  const failures = [];
  for (const relative of blogFiles) {
    const contexts = dutyLinkContexts(read(relative));
    if (contexts.length > 0) dutyLinkedBlogFiles.push(relative);
    assert.ok(contexts.length <= 1, `${relative} has an unreviewed additional DutyCalc context`);
    for (const context of contexts) {
      contextCount += 1;
      const text = plainText(context);
      for (const claim of calculatorClaimFailures(text)) {
        failures.push(`${relative}: ${claim}: ${text}`);
      }
    }
  }
  assert.deepEqual(dutyLinkedBlogFiles, reviewedDutyLinkedBlogFiles);
  assert.equal(contextCount, reviewedDutyLinkedBlogFiles.length);
  assert.deepEqual(failures, []);

  const cusma = read('blog/cusma-usmca-guide/index.html');
  const staleSources = [
    'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/tblmod-1-eng.html',
    'https://www.cbsa-asfc.gc.ca/trade-commerce/cusma-aceum/cert-origin-eng.html',
    'https://www.international.gc.ca/trade-commerce/trade-policy-politique-commerciale/agr-acc/cusma-aceum/index.aspx',
    'https://www.cbp.gov/trade/free-trade-agreements/usmca'
  ];
  const currentSources = [
    'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html',
    'https://www.cbsa-asfc.gc.ca/services/cusma-aceum/cog-com-eng.html',
    'https://international.canada.ca/en/services/business/trade/agreements-negotiations',
    'https://www.cbp.gov/trade/priority-issues/trade-agreements/USMCA'
  ];
  for (const url of staleSources) assert.ok(!cusma.includes(url), `stale CUSMA source remains: ${url}`);
  for (const url of currentSources) assert.ok(cusma.includes(url), `current CUSMA source missing: ${url}`);

  const jsonLd = [...cusma.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  const faqSchema = jsonLd.find((item) => item['@type'] === 'FAQPage');
  assert.ok(faqSchema, 'CUSMA visible FAQ requires FAQPage JSON-LD');
  const schemaEntries = faqSchema.mainEntity.map((item) => ({
    question: item.name,
    answer: item.acceptedAnswer.text
  }));
  const visibleEntries = [...cusma.matchAll(
    /<div class="faq-item">\s*<div class="faq-q">([\s\S]*?)<\/div>\s*<div class="faq-a">([\s\S]*?)<\/div>\s*<\/div>/g
  )].map((match) => ({
    question: plainText(match[1]),
    answer: plainText(match[2])
  }));
  assert.equal(visibleEntries.length, 7, 'CUSMA visible FAQ count changed');
  assert.deepEqual(schemaEntries, visibleEntries);
});
