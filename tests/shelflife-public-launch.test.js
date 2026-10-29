const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const listing = 'https://apps.shopify.com/shelflife';
const {elementsWithAttribute} = require('./helpers/html-elements.cjs');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertListingCta(relativePath, label) {
  const html = read(relativePath);
  const anchors = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const matching = anchors.filter(([, href, contents]) => {
    const text = contents.replace(/<svg\b[\s\S]*?<\/svg>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text !== label) return false;
    const url = new URL(href.replaceAll('&amp;', '&'), 'https://attahirlabs.com');
    return url.origin + url.pathname === listing && !url.username && !url.password && !url.hash;
  });
  assert.ok(
    matching.length > 0,
    `${relativePath} should send the ${label} CTA to the official ShelfLife listing`
  );
}

const homepage = read('index.html');
const appsHub = read('apps/index.html');
const appPage = read('apps/shelflife/index.html');
const publicCatalog = JSON.parse(read('data/public-apps.json'));
const shelfLifeSource = publicCatalog.products.find((app) => app.slug === 'shelflife');
const sitemap = read('sitemap.xml');
const homepageJsonLd = [...homepage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const organization = homepageJsonLd.find((entry) => entry['@type'] === 'Organization');
const publicApps = publicCatalog.products.map(app => ({
  name:app.name,url:app.listing,price:String(Math.min(...app.plans.map(plan => plan.price))),priceCurrency:publicCatalog.currency
}));

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
  'https://attahirlabs.com/': { lastmod: '2026-09-23', changefreq: 'weekly', priority: '1.0' },
  'https://attahirlabs.com/apps/': { lastmod: '2026-09-23', changefreq: 'weekly', priority: '0.95' },
  'https://attahirlabs.com/apps/shelflife/': { lastmod: '2026-09-22', changefreq: 'weekly', priority: '0.9' },
  'https://attahirlabs.com/blog/product-expiry-date-management-shopify/': { lastmod: '2026-09-13', changefreq: 'monthly', priority: '0.8' },
  'https://attahirlabs.com/blog/product-batch-tracking-and-fefo-for-shopify/': { lastmod: '2026-09-13', changefreq: 'monthly', priority: '0.8' }
})) {
  assert.deepEqual(sitemapMetadata(url), expected, `${url} sitemap metadata should reflect the ShelfLife launch`);
}

assert.ok(elementsWithAttribute(homepage, 'data-app').some(entry => entry.value === 'shelflife'), 'homepage should retain ShelfLife in the public app showcase');
assert.ok(
  ['StockClearance', 'ShelfLife'].every(name => homepage.includes(`Install ${name}`)) && homepage.includes('View TariffShield on Shopify'),
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

assert.equal(shelfLifeSource.plans.length, 1, 'ShelfLife should have one public plan in the website source');
assert.equal(shelfLifeSource.plans[0].price, 0, 'ShelfLife public plan should be free');
assert.equal((appPage.match(/class="card plan-card"/g) || []).length, 1, 'ShelfLife page should render one plan');
assert.ok(!/\$14|\$29|Upgrade to Pro|14-day free trial/.test(appPage), 'ShelfLife page should not advertise retired paid pricing');

for (const [relativePath, html] of [
  ['index.html', homepage],
  ['apps/index.html', appsHub],
  ['apps/shelflife/index.html', appPage]
]) {
  // Other upcoming app cards correctly retain their own preparation status.
  const shelfLifeSurface = relativePath === 'apps/shelflife/index.html' ? html
    : elementsWithAttribute(html, 'data-app').find(entry => entry.value === 'shelflife')?.html;
  assert.ok(shelfLifeSurface, `${relativePath} must expose a ShelfLife public surface`);
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
    assert.ok(!shelfLifeSurface.includes(stale), `${relativePath} should not retain stale ShelfLife launch copy: ${stale}`);
  }
}

console.log('ShelfLife public-launch tests passed');
