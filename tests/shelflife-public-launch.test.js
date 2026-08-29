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
const homepageJsonLd = [...homepage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const organization = homepageJsonLd.find((entry) => entry['@type'] === 'Organization');

assert.ok(organization, 'homepage should expose parseable Organization JSON-LD');
assert.equal(organization.sameAs.length, 3, 'Organization sameAs should enumerate all three public apps');
assert.equal(organization.sameAs[2], listing, 'Organization sameAs should include the official ShelfLife listing');
assert.equal(organization.makesOffer.length, 3, 'Organization makesOffer should enumerate all three public apps');
assert.deepEqual(
  organization.makesOffer[2],
  {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'SoftwareApplication',
      name: 'ShelfLife',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Shopify'
    },
    url: listing
  },
  'Organization JSON-LD should expose ShelfLife as the third public SoftwareApplication offer'
);

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
