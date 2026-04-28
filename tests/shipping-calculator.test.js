const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const logicPath = path.join(root, 'shipping', 'calculator.js');
const pagePath = path.join(root, 'shipping', 'index.html');

assert.ok(fs.existsSync(logicPath), 'shipping/calculator.js should exist');
assert.ok(fs.existsSync(pagePath), 'shipping/index.html should exist');

const shipping = require(logicPath);

function approx(actual, expected, epsilon = 0.001) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

assert.equal(shipping.dimensionalWeight({ length: 20, width: 10, height: 8 }), 12, 'dimensional weight rounds up using retail divisor');
assert.equal(shipping.billableWeight({ weight: 5, length: 20, width: 10, height: 8 }), 12, 'billable weight uses greater of actual and dimensional weight');
assert.equal(shipping.selectZone('CA', 'H2X 1Y4', 'US', '10001'), 'crossBorder', 'Canada to US should be cross-border');
assert.equal(shipping.selectZone('US', '10001', 'US', '94105'), 'domestic', 'same-country US shipments should be domestic');
assert.equal(shipping.selectZone('CA', 'H2X 1Y4', 'GB', 'SW1A 1AA'), 'international', 'Canada to UK should be international');

const caToUs = shipping.estimateShipping({
  originCountry: 'CA',
  originPostal: 'H2X 1Y4',
  destinationCountry: 'US',
  destinationPostal: '10001',
  weight: 5,
  length: 20,
  width: 10,
  height: 8,
  orderValue: 120,
  speedPreference: 'balanced'
});

assert.equal(caToUs.zone, 'crossBorder');
assert.equal(caToUs.billableWeight, 12);
assert.deepEqual(caToUs.estimates.map((estimate) => estimate.service), ['Economy', 'Standard', 'Express']);
assert.ok(caToUs.estimates[0].low < caToUs.estimates[1].low && caToUs.estimates[1].low < caToUs.estimates[2].low, 'service estimates should be ordered low to high');
approx(caToUs.estimates[1].low, 35.7);
approx(caToUs.estimates[1].high, 45.55);
assert.match(caToUs.estimates[0].window, /business days/);

const economy = shipping.estimateShipping({
  originCountry: 'CA', destinationCountry: 'US', weight: 5, length: 20, width: 10, height: 8, orderValue: 120, speedPreference: 'economy'
});
const urgent = shipping.estimateShipping({
  originCountry: 'CA', destinationCountry: 'US', weight: 5, length: 20, width: 10, height: 8, orderValue: 120, speedPreference: 'urgent'
});
assert.ok(economy.estimates[0].low < caToUs.estimates[0].low, 'economy preference should lower the economy estimate');
assert.ok(urgent.estimates[2].low > caToUs.estimates[2].low, 'urgent preference should raise the express estimate');

const html = fs.readFileSync(pagePath, 'utf8');
assert.match(html, /<title>[^<]*Shipping Cost Calculator[^<]*Attahir Labs/i, 'page should have SEO title');
assert.match(html, /<link rel="canonical" href="https:\/\/attahirlabs\.com\/shipping\/">/i, 'page should have canonical URL');
assert.match(html, /property="og:title"/i, 'page should include Open Graph metadata');
assert.match(html, /name="twitter:card"/i, 'page should include Twitter metadata');
assert.match(html, /application\/ld\+json/i, 'page should include JSON-LD');
assert.match(html, /retail benchmark estimates may differ from Shopify checkout\/carrier account rates/i, 'page should include the required retail benchmark disclaimer');
for (const label of ['Home', 'Duty Calculator', 'Blog', 'Contact']) {
  assert.match(html, new RegExp(`>${label}<`, 'i'), `nav should include ${label}`);
}
for (const id of ['originCountry', 'originPostal', 'destinationCountry', 'destinationPostal', 'weight', 'length', 'width', 'height', 'orderValue', 'speedPreference']) {
  assert.match(html, new RegExp(`id="${id}"`), `page should include input ${id}`);
}
for (const service of ['Economy', 'Standard', 'Express']) {
  assert.match(html, new RegExp(service, 'i'), `page should mention ${service}`);
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(home, /href="\/shipping\/"/i, 'homepage should link to the shipping calculator');
const homeNav = home.match(/<ul class="nav-links">[\s\S]*?<\/ul>/i)?.[0] || '';
assert.match(homeNav, /href="\/shipping\/"[^>]*>Shipping Calculator</i, 'homepage top nav should include Shipping Calculator');
for (const sectionLink of ['#apps', '#problems', '#about']) {
  assert.ok(!homeNav.includes(`href="${sectionLink}"`), `homepage top nav should not link to ${sectionLink}`);
}

console.log('shipping calculator tests passed');
