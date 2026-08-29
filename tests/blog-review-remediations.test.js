const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const ctaContract = JSON.parse(read('data/blog-cta-contract.json'));

const amazon = read('blog/amazon-fba-landed-cost-guide/index.html');
assert.doesNotMatch(amazon, /estimate tariff exposure, customs fees, and delivered import cost/i);
assert.match(amazon, /supported U\.S\. scenario/i);
assert.match(amazon, /does not calculate customs fees, freight, Amazon charges, or delivered import cost/i);

const batch = read('blog/product-batch-tracking-and-fefo-for-shopify/index.html');
assert.match(batch, /For a supported U\.S\. scenario[\s\S]{0,180}>free duty calculator<\/a>/i);
assert.match(batch, /For Canadian imports, do not use a U\.S\. calculator result/i);
assert.doesNotMatch(batch, /For U\.S\. and Canadian import planning[^<]+tools help/i);

const ukSource = read('_posts/2026-04-20-uk-import-duty-post-brexit.md');
assert.doesNotMatch(ukSource, /^appTieIn:/m);
assert.doesNotMatch(ukSource, /TariffShield|attahirlabs\.com\/duty\//i);
assert.doesNotMatch(ukSource, /^## CTA\b/m);
assert.match(ukSource, /Use the official UK and EU sources/i);

const cbpSource = read('_posts/2026-04-20-cbp-tariff-refund-portal-live.md');
const cbpPage = read('blog/cbp-tariff-refund-portal-live/index.html');
for (const [name, content] of [['CBP source', cbpSource], ['CBP page', cbpPage]]) {
  assert.doesNotMatch(content, /product-level tariff exposure monitoring/i, `${name} overstates product monitoring`);
  assert.match(content, /only for supported U\.S\. exact-input scenarios/i, `${name} must scope the free calculator`);
  assert.match(content, /does not monitor products/i, `${name} must state the monitoring exclusion`);
}

const sourcePolicies = {
  '2026-03-26-march-sales-slump-dead-stock.md': ['dead-stock-clearance-q2-2026', 'stockclearance'],
  '2026-03-31-shopify-account-takeover-protection.md': ['shopify-account-takeover-protection', 'none'],
  '2026-04-20-cbp-tariff-refund-portal-live.md': ['cbp-tariff-refund-portal-live', 'tariffshield'],
  '2026-04-20-uk-import-duty-post-brexit.md': ['uk-import-duty-post-brexit', 'official-sources'],
  '2026-04-21-doj-ada-website-accessibility-deadline-2026.md': ['doj-ada-website-accessibility-deadline-2026', 'access-checker'],
  '2026-04-21-retail-bankruptcies-dead-stock-warning-2026.md': ['retail-bankruptcies-dead-stock-warning-2026', 'stockclearance'],
  '2026-05-07-shopify-benchmark-comparisons-removed-may-19.md': ['shopify-benchmark-comparisons-removed-may-19', 'stockclearance']
};

const deployedSourceFiles = fs.readdirSync(path.join(root, '_posts'))
  .filter((file) => file.endsWith('.md'))
  .sort();
assert.deepEqual(deployedSourceFiles, Object.keys(sourcePolicies).sort(), 'every deployed _posts source needs a CTA policy');

const appNames = {
  TariffShield: 'tariffshield',
  StockClearance: 'stockclearance',
  ShelfLife: 'shelflife',
  AccessShield: 'accessshield',
  StoreChangelog: 'storechangelog',
  WarrantyTracker: 'warrantytracker'
};

function normalizeMarkup(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const sourceFile of deployedSourceFiles) {
  const [slug, assignment] = sourcePolicies[sourceFile];
  assert.equal(ctaContract.articles[slug], assignment, `${sourceFile} policy differs from the canonical CTA contract`);
  const source = read(`_posts/${sourceFile}`);
  const page = read(`blog/${slug}/index.html`);
  const frontMatter = source.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] || '';

  assert.doesNotMatch(frontMatter, /^\s*(?:app[-_ ]*)?tie[-_ ]?in\s*:/im, `${sourceFile} exposes internal tie-in metadata`);
  assert.doesNotMatch(source, /\btie[ -]?in\b/i, `${sourceFile} exposes an internal tie-in label`);

  const sourceTitle = source.match(/^title:\s*["'](.+)["']\s*$/m)?.[1];
  const pageTitle = page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .trim();
  assert.equal(sourceTitle, pageTitle, `${sourceFile} title must match its static page`);
  for (const field of ['title', 'metaTitle']) {
    const value = frontMatter.match(new RegExp(`^${field}:\\s*["'](.+)["']\\s*$`, 'm'))?.[1];
    if (value) assert.doesNotMatch(value, /TariffShield|StockClearance|ShelfLife|AccessShield|StoreChangelog|WarrantyTracker/i);
  }

  const namedApps = Object.entries(appNames).filter(([name]) => new RegExp(`\\b${name}\\b`, 'i').test(source));
  assert.ok(namedApps.length <= 1, `${sourceFile} broadly promotes multiple apps: ${namedApps.map(([name]) => name).join(', ')}`);
  if (namedApps.length === 1) {
    assert.equal(namedApps[0][1], assignment, `${sourceFile} promotes ${namedApps[0][0]} but policy is ${assignment}`);
  }

  for (const [app, url] of Object.entries(ctaContract.publicApps)) {
    if (source.includes(url)) assert.equal(app, assignment, `${sourceFile} links the ${app} listing under ${assignment} policy`);
  }

  const appMarkers = [...source.matchAll(/data-app-cta=["']([^"']+)["']/g)].map((match) => match[1]);
  const resourceMarkers = [...source.matchAll(/data-resource-cta=["']([^"']+)["']/g)].map((match) => match[1]);
  assert.ok(appMarkers.length + resourceMarkers.length <= 1, `${sourceFile} contains multiple CTA policy markers`);
  for (const marker of [...appMarkers, ...resourceMarkers]) {
    assert.equal(marker, assignment, `${sourceFile} CTA marker ${marker} differs from ${assignment}`);
  }
}

for (const [sourceFile, slug, assignment, marker] of [
  ['2026-05-07-shopify-benchmark-comparisons-removed-may-19.md', 'shopify-benchmark-comparisons-removed-may-19', 'stockclearance', 'data-app-cta'],
  ['2026-04-21-doj-ada-website-accessibility-deadline-2026.md', 'doj-ada-website-accessibility-deadline-2026', 'access-checker', 'data-resource-cta']
]) {
  const source = read(`_posts/${sourceFile}`);
  const page = read(`blog/${slug}/index.html`);
  const pattern = new RegExp(`<aside\\b(?=[^>]*${marker}=["']${assignment}["'])[^>]*>[\\s\\S]*?<\\/aside>`, 'i');
  const sourceCta = source.match(pattern)?.[0];
  const pageCta = page.match(pattern)?.[0];
  assert.ok(sourceCta, `${sourceFile} lacks its canonical ${assignment} CTA`);
  assert.equal(normalizeMarkup(sourceCta), normalizeMarkup(pageCta || ''), `${sourceFile} CTA copy differs from the canonical page`);
}

const sourceRepairs = [
  {
    file: 'blog/shopify-account-takeover-protection/index.html',
    stale: 'https://support.google.com/accounts/answer/9289417',
    current: 'https://support.google.com/accounts/answer/6103523'
  },
  {
    file: 'blog/sleep-number-bankruptcy-shopify-inventory-lessons-2026/index.html',
    stale: 'https://ir.sleepnumber.com/news/news-details/2026/Sleep-Number-Receives-Court-Approval-for-Sale-to-Sleep-Country-Canada/default.aspx',
    current: 'https://www.sec.gov/Archives/edgar/data/827187/000095010326011603/dp251018_8k.htm'
  },
  {
    file: 'blog/wcag-accessibility-guide/index.html',
    stale: 'https://www.usablenet.com/research/2024-ada-remediation-report',
    current: 'https://www.ada.gov/resources/web-guidance/'
  },
  {
    file: 'blog/wcag-accessibility-guide/index.html',
    stale: 'https://www.ontario.ca/page/accessibility-ontarians-disabilities-act',
    current: 'https://www.ontario.ca/page/about-accessibility-laws'
  },
  {
    file: 'blog/wcag-accessibility-guide/index.html',
    stale: 'https://ec.europa.eu/info/policies/digital-europe/european-accessibility-act_en',
    current: 'https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en'
  }
];

for (const { file, stale, current } of sourceRepairs) {
  const content = read(file);
  assert.ok(!content.includes(stale), `${file} retains reviewer-confirmed 404 ${stale}`);
  assert.ok(content.includes(current), `${file} lacks full-GET-verified source ${current}`);
}

console.log('blog reviewer remediations passed');
