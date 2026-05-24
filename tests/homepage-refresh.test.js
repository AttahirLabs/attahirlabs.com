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

assert.match(html, /<title>Attahir Labs \| Shopify Tools for Import Costs and Inventory Risk<\/title>/, 'homepage should use the refreshed SEO title');
assert.match(html, /<link rel="canonical" href="https:\/\/attahirlabs\.com\/">/, 'homepage canonical should include trailing slash');
includes('Install TariffShield', 'homepage should prioritize the public App Store app');
includes('https://apps.shopify.com/tariffshield', 'homepage should link to TariffShield App Store listing');
includes('Try duty calculator', 'homepage should route to the duty calculator');
includes('Run accessibility check', 'homepage should route to the free accessibility checker');
includes('Shipping Calculator', 'homepage should keep the shipping calculator visible');
includes('Product Pipeline', 'homepage should separate pipeline apps from live tools');
includes('App Store materials pending', 'pipeline apps should disclose their public availability status');
includes('StoreChangelog', 'homepage should use current StoreChangelog product name');
includes('WarrantyTracker', 'homepage should use current WarrantyTracker product name');
includes('StockClearance', 'homepage should include StockClearance');
includes('ShelfLife', 'homepage should include ShelfLife');
includes('AccessShield', 'homepage should include AccessShield');
includes('No installability theater', 'homepage should explicitly describe the status discipline');
includes('/blog/import-duty-from-vietnam-to-us/', 'homepage should feature current tariff content');
includes('/blog/shopify-import-duties/', 'homepage should feature Shopify duties content');
includes('/blog/ddp-vs-duties-at-checkout-for-shopify-how-merchants-actually-handle-import-charges/', 'homepage should feature DDP content');
includes('/blog/product-expiry-date-management-shopify/', 'homepage should feature ShelfLife-aligned content');

excludes(/StoreChronicle/, 'homepage should not use deprecated StoreChronicle name');
excludes(/WarrantyShield/, 'homepage should not use deprecated WarrantyShield name');
excludes(/Coming Soon/, 'homepage should not use vague Coming Soon labels');
excludes(/bulletproof/i, 'homepage should not make overbroad bulletproof claims');
excludes(/No tracking pixels/i, 'homepage should not contradict Google Analytics usage');
excludes(/GDPR compliant/i, 'homepage should not make blanket GDPR compliance claims');
excludes(/Daily<\/span>|Daily rate updates|daily rate updates/i, 'homepage should not claim daily updates without a current verification hook');
excludes(/986/, 'homepage should not include brittle tariff-rate counts');
excludes(/85\+ origin countries|39 import markets/i, 'homepage should avoid brittle coverage counts on the homepage');

assert.match(sitemap, /<loc>https:\/\/attahirlabs\.com\/<\/loc>\s*<lastmod>2026-05-24<\/lastmod>/, 'sitemap homepage lastmod should reflect the refresh');

console.log('homepage refresh tests passed');

