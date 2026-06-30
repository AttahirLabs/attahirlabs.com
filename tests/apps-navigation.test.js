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
  assert.match(html, /href="\/apps\/apps\.css\?v=20260630-app-router-scroll"/, `${page} should load the cache-busted shared app stylesheet`);
  assert.match(html, /href="\/apps\/footer-logo\.css\?v=20260630"/, `${page} should load the footer-logo cache-busting override`);
  assert.match(html, /href="\/apps\/"[^>]*>Apps</, `${page} should link to the app hub`);
  assert.match(html, /href="\/tools\/"[^>]*>Free tools</, `${page} should link to the tools hub`);
  assert.match(html, /href="\/blog\/"[^>]*>Blog</, `${page} should keep Blog in the top nav`);
  assert.match(html, /href="\/contact\.html"[^>]*>Contact</, `${page} should keep Contact in the top nav`);
  const nav = html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/i)?.[0] || '';
  assert.ok(nav.includes('class="nav-item-apps"'), `${page} should expose the Apps hover dropdown wrapper`);
  assert.ok(nav.includes('class="apps-dropdown"'), `${page} should expose the Apps hover dropdown`);
  assert.ok(nav.includes('class="nav-item-tools"'), `${page} should expose the Free tools hover dropdown wrapper`);
  assert.ok(nav.includes('class="tools-dropdown"'), `${page} should expose the Free tools hover dropdown`);
  assert.ok(!nav.includes('View apps'), `${page} should not duplicate the Apps destination in global nav`);
  assert.ok(!nav.includes('Install StockClearance'), `${page} should keep app-specific install CTAs out of global nav`);
  for (const route of [
    '/apps/stockclearance/',
    '/apps/tariffshield/',
    '/apps/shelflife/',
    '/apps/accessshield/',
    '/apps/storechangelog/',
    '/apps/warrantytracker/',
  ]) {
    assert.ok(nav.includes(`href="${route}"`), `${page} Apps dropdown should link to ${route}`);
  }
  for (const route of [
    '/duty/',
    '/shipping/',
    '/tools/access-checker/',
  ]) {
    assert.ok(nav.includes(`href="${route}"`), `${page} Free tools dropdown should link to ${route}`);
  }
}

const appsHub = read('apps/index.html');
const appsCss = read('apps/apps.css');
const footerLogoCss = read('apps/footer-logo.css');
const toolsHub = read('tools/index.html');
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
assert.ok(appsHub.includes('utm_content=apps_hub_hero'), 'apps hub StockClearance install link should be campaign-trackable');
assert.ok(appsHub.includes('6 app paths'), 'apps hub router should signal that all app paths are represented');
assert.ok(appsHub.includes('class="workflow-list is-scrollable" data-auto-scroll'), 'apps hub router should be a scrollable auto-advancing list');
assert.match(appsHub, /<a class="workflow-row" href="\/apps\/stockclearance\/" aria-label="Open StockClearance app page"><span>Clear aging inventory<\/span><span class="status status-live">StockClearance<\/span><\/a>/, 'apps hub router StockClearance row should be a full clickable link');
assert.match(appsHub, /<a class="workflow-row" href="\/apps\/tariffshield\/" aria-label="Open TariffShield app page"><span>Protect landed-cost margin<\/span><span class="status status-live">TariffShield<\/span><\/a>/, 'apps hub router TariffShield row should be a full clickable link');
assert.match(appsHub, /<a class="workflow-row" href="\/apps\/shelflife\/" aria-label="Open ShelfLife app page"><span>Track expiry and recalls<\/span><span class="status status-prep">ShelfLife<\/span><\/a>/, 'apps hub router ShelfLife row should be a full clickable link');
assert.match(appsHub, /<a class="workflow-row" href="\/apps\/accessshield\/" aria-label="Open AccessShield app page"><span>Find accessibility risks<\/span><span class="status status-prep">AccessShield<\/span><\/a>/, 'apps hub router AccessShield row should be a full clickable link');
assert.match(appsHub, /<a class="workflow-row" href="\/apps\/storechangelog\/" aria-label="Open StoreChangelog app page"><span>Catch risky store changes<\/span><span class="status status-prep">StoreChangelog<\/span><\/a>/, 'apps hub router StoreChangelog row should be a full clickable link');
assert.match(appsHub, /<a class="workflow-row" href="\/apps\/warrantytracker\/" aria-label="Open WarrantyTracker app page"><span>Manage warranty claims<\/span><span class="status status-prep">WarrantyTracker<\/span><\/a>/, 'apps hub router WarrantyTracker row should be a full clickable link');
assert.ok(appsHub.includes("window.matchMedia('(prefers-reduced-motion: reduce)'"), 'apps hub auto-scroll should respect reduced-motion settings');

const stockClearance = read('apps/stockclearance/index.html');
assert.ok(stockClearance.includes('https://apps.shopify.com/stockclearance'), 'StockClearance page should link to the App Store');
assert.ok(stockClearance.includes('utm_content=app_page_hero'), 'StockClearance install CTA should be campaign-trackable');
assert.ok(stockClearance.includes('First five minutes'), 'StockClearance page should expose the early aha path');
assert.ok(stockClearance.includes('From inventory signal to clearance decision.'), 'StockClearance page should explain the signal-to-action workflow');
assert.ok(stockClearance.includes('Built for product-level inventory decisions.'), 'StockClearance page should disclose product-level data boundaries');
assert.ok(stockClearance.includes('"@type": "SoftwareApplication"'), 'StockClearance page should include software application schema');
assert.ok(stockClearance.includes('"@type": "FAQPage"'), 'StockClearance page should include FAQ schema');
assert.ok(stockClearance.includes('https://attahirlabs.com/assets/icons/stockclearance-512.png'), 'StockClearance page should use the StockClearance icon for social previews');

const deadStockGuide = read('blog/dead-stock-clearance-q2-2026/index.html');
assert.ok(deadStockGuide.includes('utm_content=dead_stock_guide_cta'), 'dead-stock guide CTA should be campaign-trackable');

assert.ok(appsCss.includes('overflow-x: hidden'), 'shared app-page CSS should guard against mobile horizontal overflow');
assert.ok(appsCss.includes('.hero-grid > *'), 'shared app-page CSS should let hero grid children shrink on mobile');
assert.match(appsCss, /\.apps-dropdown strong,\s*\.tools-dropdown strong\s*{\s*display: block;/, 'Nav dropdown names should stack above descriptions');
assert.match(appsCss, /\.apps-dropdown span,\s*\.tools-dropdown span\s*{\s*display: block;/, 'Nav dropdown descriptions should stack below names');
assert.match(appsCss, /\.workflow-list\.is-scrollable\s*{[\s\S]*overflow-y: auto;/, 'Scrollable workflow lists should allow manual vertical scrolling');
assert.match(appsCss, /\.workflow-list\.is-scrollable\s*{[\s\S]*scroll-snap-type: y proximity;/, 'Scrollable workflow lists should snap between app options');
assert.match(appsCss, /footer \.nav-logo\s*{\s*color: var\(--paper\);/, 'Footer brand should be readable on the dark footer background');
assert.match(appsCss, /footer \.nav-logo span\s*{\s*color: #5eead4;/, 'Footer Labs accent should stay readable on the dark footer background');
assert.match(footerLogoCss, /footer \.nav-logo\s*{\s*color: #ffffff;/, 'Footer override should bypass stale shared CSS caches');
assert.match(footerLogoCss, /footer \.nav-logo span\s*{\s*color: #5eead4;/, 'Footer override should keep the Labs accent readable');
assert.match(toolsHub, /<a class="workflow-row" href="\/duty\/" aria-label="Open import duty calculator"><span>Import duty estimate<\/span><span class="status status-tool">Duty<\/span><\/a>/, 'tools hub hero duty row should be a full clickable link with a clean accessible name');
assert.match(toolsHub, /<a class="workflow-row" href="\/shipping\/" aria-label="Open shipping calculator"><span>Package shipping range<\/span><span class="status status-tool">Shipping<\/span><\/a>/, 'tools hub hero shipping row should be a full clickable link with a clean accessible name');
assert.match(toolsHub, /<a class="workflow-row" href="\/tools\/access-checker\/" aria-label="Open accessibility checker"><span>Storefront accessibility scan<\/span><span class="status status-tool">WCAG<\/span><\/a>/, 'tools hub hero accessibility row should be a full clickable link with a clean accessible name');
assert.match(appsCss, /\.workflow-row:hover,\s*\.workflow-row:focus-visible\s*{[\s\S]*transform: translateY\(-3px\) scale\(1\.015\);/, 'tools hub hero links should pop out on hover and keyboard focus');

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
