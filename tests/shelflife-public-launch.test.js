const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const listing = 'https://apps.shopify.com/shelflife';

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertListingCta(relativePath, label) {
  const html = read(relativePath);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(
    html,
    new RegExp(`<a[^>]+href="${listing}"[^>]*>${escapedLabel}</a>`),
    `${relativePath} should send the ${label} CTA to the official ShelfLife listing`
  );
}

const homepage = read('index.html');
const appsHub = read('apps/index.html');
const appPage = read('apps/shelflife/index.html');
const sitemap = read('sitemap.xml');
const homepageJsonLd = [...homepage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const organization = homepageJsonLd.find((entry) => entry['@type'] === 'Organization');
const publicApps = [
  { name: 'StockClearance', url: 'https://apps.shopify.com/stockclearance', price: '0', priceCurrency: 'USD' },
  { name: 'TariffShield', url: 'https://apps.shopify.com/tariffshield', price: '0', priceCurrency: 'USD' },
  { name: 'ShelfLife', url: listing, price: '0', priceCurrency: 'USD' }
];

assert.ok(organization, 'homepage should expose parseable Organization JSON-LD');
assert.deepEqual(
  [...organization.sameAs].sort(),
  publicApps.map((app) => app.url).sort(),
  'Organization sameAs should expose the exact order-independent set of public app URLs'
);
assert.deepEqual(
  organization.makesOffer.map((offer) => ({
    offerType: offer['@type'],
    applicationType: offer.itemOffered?.['@type'],
    applicationCategory: offer.itemOffered?.applicationCategory,
    operatingSystem: offer.itemOffered?.operatingSystem,
    name: offer.itemOffered?.name,
    url: offer.url,
    price: offer.price,
    priceCurrency: offer.priceCurrency
  })).sort((left, right) => left.url.localeCompare(right.url)),
  publicApps.map((app) => ({
    offerType: 'Offer',
    applicationType: 'SoftwareApplication',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Shopify',
    ...app
  })).sort((left, right) => left.url.localeCompare(right.url)),
  'Organization makesOffer should expose the exact order-independent URL, name, free price, and currency pairs'
);

function sitemapMetadata(url) {
  const entry = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((match) => match[1])
    .find((block) => block.includes(`<loc>${url}</loc>`));
  assert.ok(entry, `sitemap should include ${url}`);
  const value = (tag) => entry.match(new RegExp(`<${tag}>([^<]+)</${tag}>`))?.[1];
  return {
    lastmod: value('lastmod'),
    changefreq: value('changefreq'),
    priority: value('priority')
  };
}

for (const [url, expected] of Object.entries({
  'https://attahirlabs.com/': { lastmod: '2026-08-29', changefreq: 'weekly', priority: '1.0' },
  'https://attahirlabs.com/apps/': { lastmod: '2026-08-29', changefreq: 'weekly', priority: '0.95' },
  'https://attahirlabs.com/apps/shelflife/': { lastmod: '2026-08-29', changefreq: 'weekly', priority: '0.9' },
  'https://attahirlabs.com/blog/product-expiry-date-management-shopify/': { lastmod: '2026-08-29', changefreq: 'monthly', priority: '0.8' },
  'https://attahirlabs.com/blog/product-batch-tracking-and-fefo-for-shopify/': { lastmod: '2026-08-29', changefreq: 'monthly', priority: '0.8' }
})) {
  assert.deepEqual(sitemapMetadata(url), expected, `${url} sitemap metadata should reflect the ShelfLife launch`);
}

assert.ok(homepage.includes('<strong>3 public apps</strong>'), 'homepage should count ShelfLife as public');
assert.ok(
  homepage.includes('StockClearance, TariffShield, and ShelfLife are live on Shopify.'),
  'homepage public-app proof should name ShelfLife'
);
assert.match(
  appsHub,
  /<a class="workflow-row" href="\/apps\/shelflife\/" aria-label="Open ShelfLife app page"><span>Track expiry and recalls<\/span><span class="status status-live">ShelfLife<\/span><\/a>/,
  'apps hub router should label ShelfLife as live while keeping app-page navigation'
);

assertListingCta('index.html', 'Install ShelfLife');
assertListingCta('apps/index.html', 'Install ShelfLife');
assertListingCta('apps/shelflife/index.html', 'Install ShelfLife');
assertListingCta('blog/product-expiry-date-management-shopify/index.html', 'Install ShelfLife');
assertListingCta('blog/product-batch-tracking-and-fefo-for-shopify/index.html', 'Install ShelfLife');

for (const [relativePath, html] of [
  ['index.html', homepage],
  ['apps/index.html', appsHub],
  ['apps/shelflife/index.html', appPage]
]) {
  for (const stale of [
    '2 public apps',
    'App Store listing in preparation',
    'Preparing listing',
    'ShelfLife is not linked as installable',
    'View ShelfLife status',
    'Ask about ShelfLife',
    'ShelfLife once it is public',
    'ShelfLife when it is public'
  ]) {
    assert.ok(!html.includes(stale), `${relativePath} should not retain stale ShelfLife launch copy: ${stale}`);
  }
}

console.log('ShelfLife public-launch tests passed');
