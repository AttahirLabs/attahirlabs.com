const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

function includes(text, message) {
  assert.ok(html.includes(text), message || 'homepage should include ' + text);
}

function excludes(pattern, message) {
  assert.ok(!pattern.test(html), message || 'homepage should not match ' + pattern);
}

assert.match(html, /<title>Attahir Labs \| Shopify Apps for Inventory, Tariffs, and Store Operations<\/title>/, 'homepage should use the problem-first SEO title');
assert.match(html, /<link rel="canonical" href="https:\/\/attahirlabs\.com\/">/, 'homepage canonical should include trailing slash');
includes('<h1>Attahir Labs</h1>', 'homepage hero should make the brand the first-viewport signal');
includes('Find the right app', 'homepage hero should have one clear primary routing CTA');
includes('Install StockClearance', 'homepage should prioritize the newly public inventory app');
includes('Install TariffShield', 'homepage should keep TariffShield as a public App Store app');
includes('/apps/stockclearance/', 'homepage should route StockClearance through its app page');
includes('/apps/tariffshield/', 'homepage should route TariffShield through its app page');
includes('/apps/', 'homepage should include the scalable app hub');
includes('/tools/', 'homepage should include the scalable free-tools hub');
includes('https://apps.shopify.com/stockclearance', 'homepage should link to StockClearance App Store listing');
includes('https://apps.shopify.com/tariffshield', 'homepage should link to TariffShield App Store listing');
includes('What problem are you trying to solve?', 'homepage should route by merchant problem');
includes('Use free tools', 'homepage hero should route to the tool chooser');
includes('Shipping calculator', 'homepage should keep the shipping calculator visible');
includes('Public Apps', 'homepage should separate public apps from supporting tools');
includes('App Store listing in preparation', 'pipeline apps should disclose their public availability status');
includes('Only apps with verified public Shopify App Store listings get install calls to action here.', 'homepage status discipline should reflect public app availability');
includes('StoreChangelog', 'homepage should use current StoreChangelog product name');
includes('WarrantyTracker', 'homepage should use current WarrantyTracker product name');
includes('StockClearance', 'homepage should include StockClearance');
includes('ShelfLife', 'homepage should include ShelfLife');
includes('AccessShield', 'homepage should include AccessShield');
includes('No installability theater', 'homepage should explicitly describe the status discipline');
includes('/assets/home/merchant-operations-hero.jpg', 'homepage should use a relevant merchant-operations hero image');
includes('/assets/home/merchant-operations-hero-mobile.jpg', 'homepage should use an optimized mobile hero image');
includes('/assets/home/package-cost-desk.jpg', 'homepage should use a relevant package and cost-planning visual');
includes('StockClearance app icon', 'homepage should show the public inventory app visually');
includes('TariffShield app icon', 'homepage should show the public tariff app visually');
includes('2 public apps', 'homepage should summarize current public app status');
includes('3 free tools', 'homepage should summarize live tool status');
includes('4 preparing', 'homepage should summarize staged app status');
includes('/blog/dead-stock-clearance-q2-2026/', 'homepage should feature current inventory content');
includes('/blog/import-duty-from-vietnam-to-us/', 'homepage should feature current tariff content');
includes('/blog/product-expiry-date-management-shopify/', 'homepage should feature ShelfLife-aligned content');

const nav = html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/i)?.[0] || '';
assert.ok(!nav.includes('href="#live"'), 'homepage top nav should not link to internal live section');
assert.ok(!nav.includes('href="#pipeline"'), 'homepage top nav should not link to internal pipeline section');
assert.ok(!nav.includes('href="#resources"'), 'homepage top nav should not link to internal resources section');
assert.match(nav, /href="\/apps\/"[^>]*>Apps</i, 'homepage top nav should link to app hub');
assert.match(nav, /href="\/tools\/"[^>]*>Free tools</i, 'homepage top nav should link to free-tools hub');
assert.match(nav, /href="\/blog\/"[^>]*>Blog</i, 'homepage top nav should keep Blog');
assert.match(nav, /href="\/contact\.html"[^>]*>Contact</i, 'homepage top nav should keep Contact');
assert.ok(!nav.includes('View apps'), 'homepage top nav should not duplicate the Apps destination');
assert.ok(!nav.includes('Install StockClearance'), 'homepage top nav should not compete with page-level install CTAs');
assert.ok(!nav.includes('TariffShield'), 'homepage top nav should not add every public app by name');
assert.ok(!nav.includes('Shipping Calculator'), 'homepage top nav should move individual tools behind the free-tools hub');

excludes(/StoreChronicle/, 'homepage should not use deprecated StoreChronicle name');
excludes(/WarrantyShield/, 'homepage should not use deprecated WarrantyShield name');
excludes(/Coming Soon/, 'homepage should not use vague Coming Soon labels');
excludes(/bulletproof/i, 'homepage should not make overbroad bulletproof claims');
excludes(/No tracking pixels/i, 'homepage should not contradict Google Analytics usage');
excludes(/GDPR compliant/i, 'homepage should not make blanket GDPR compliance claims');
excludes(/Daily<\/span>|Daily rate updates|daily rate updates/i, 'homepage should not claim daily updates without a current verification hook');
excludes(/986/, 'homepage should not include brittle tariff-rate counts');
excludes(/85\+ origin countries|39 import markets/i, 'homepage should avoid brittle coverage counts on the homepage');
excludes(/assets\/mockups\/shipping-calculator-(mockups|mobile-mockup|desktop-mockup)\.jpg/, 'homepage should not use shipping-calculator phone mockups as page imagery');

assert.match(sitemap, /<loc>https:\/\/attahirlabs\.com\/<\/loc>\s*<lastmod>2026-06-16<\/lastmod>/, 'sitemap homepage lastmod should reflect the StockClearance public update');

console.log('homepage refresh tests passed');
