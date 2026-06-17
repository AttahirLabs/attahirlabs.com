const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const pages = [
  'apps/index.html',
  'apps/stockclearance/index.html',
  'apps/tariffshield/index.html',
  'apps/shelflife/index.html',
  'apps/accessshield/index.html',
  'apps/storechangelog/index.html',
  'apps/warrantytracker/index.html',
  'tools/index.html',
];

for (const page of pages) {
  const html = read(page);
  assert.match(html, /href="\/apps\/"[^>]*>Apps</, `${page} should link to the app hub`);
  assert.match(html, /href="\/tools\/"[^>]*>Free tools</, `${page} should link to the tools hub`);
  assert.match(html, /href="\/blog\/"[^>]*>Blog</, `${page} should keep Blog in the top nav`);
  assert.match(html, /href="\/contact\.html"[^>]*>Contact</, `${page} should keep Contact in the top nav`);
  const nav = html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/i)?.[0] || '';
  assert.ok(!nav.includes('View apps'), `${page} should not duplicate the Apps destination in global nav`);
  assert.ok(!nav.includes('Install StockClearance'), `${page} should keep app-specific install CTAs out of global nav`);
}

const appsHub = read('apps/index.html');
for (const route of [
  '/apps/stockclearance/',
  '/apps/tariffshield/',
  '/apps/shelflife/',
  '/apps/accessshield/',
  '/apps/storechangelog/',
  '/apps/warrantytracker/',
]) {
  assert.ok(appsHub.includes(route), `apps hub should route to ${route}`);
}

assert.ok(appsHub.includes('Problem-first app chooser'), 'apps hub should frame navigation by problem');
assert.ok(appsHub.includes('Public apps link directly to Shopify'), 'apps hub should separate public apps from pipeline apps');
assert.ok(appsHub.includes('Listing in preparation'), 'apps hub should label non-public apps honestly');

const stockClearance = read('apps/stockclearance/index.html');
assert.ok(stockClearance.includes('https://apps.shopify.com/stockclearance'), 'StockClearance page should link to the App Store');
assert.ok(stockClearance.includes('First five minutes'), 'StockClearance page should expose the early aha path');
assert.ok(stockClearance.includes('https://attahirlabs.com/assets/icons/stockclearance-512.png'), 'StockClearance page should use the StockClearance icon for social previews');

const tariffShield = read('apps/tariffshield/index.html');
assert.ok(tariffShield.includes('https://apps.shopify.com/tariffshield'), 'TariffShield page should link to the App Store');
assert.ok(tariffShield.includes('First five minutes'), 'TariffShield page should expose the early aha path');

for (const page of ['apps/shelflife/index.html', 'apps/accessshield/index.html', 'apps/storechangelog/index.html', 'apps/warrantytracker/index.html']) {
  const html = read(page);
  assert.ok(html.includes('App Store listing in preparation'), `${page} should not imply public installability`);
  assert.ok(!html.includes('apps.shopify.com/shelflife'), `${page} should not invent a Shopify App Store URL`);
  assert.ok(!html.includes('apps.shopify.com/accessshield'), `${page} should not invent a Shopify App Store URL`);
  assert.ok(!html.includes('apps.shopify.com/storechangelog'), `${page} should not invent a Shopify App Store URL`);
  assert.ok(!html.includes('apps.shopify.com/warrantytracker'), `${page} should not invent a Shopify App Store URL`);
}

const sitemap = read('sitemap.xml');
for (const loc of [
  'https://attahirlabs.com/apps/',
  'https://attahirlabs.com/apps/stockclearance/',
  'https://attahirlabs.com/apps/tariffshield/',
  'https://attahirlabs.com/apps/shelflife/',
  'https://attahirlabs.com/apps/accessshield/',
  'https://attahirlabs.com/apps/storechangelog/',
  'https://attahirlabs.com/apps/warrantytracker/',
  'https://attahirlabs.com/tools/',
]) {
  assert.ok(sitemap.includes(`<loc>${loc}</loc>`), `sitemap should include ${loc}`);
}

console.log('apps navigation tests passed');
