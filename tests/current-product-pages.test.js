const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const catalog = JSON.parse(read('data/public-apps.json'));
// A pricing or FAQ edit must update all rendered surfaces, not only one page.
const sync = spawnSync(process.execPath, ['tools/sync-product-pages.mjs', '--check'], { cwd: root, encoding: 'utf8' });
assert.equal(sync.status, 0, sync.stdout + sync.stderr);
assert.deepEqual(catalog.products.map(p => p.slug).sort(), ['shelflife', 'stockclearance', 'tariffshield']);
const privacy = read('privacy.html');
const stockImages = ['01-variant-selection.jpg','02-staged-markdowns.jpg','03-catalog-pricing.jpg','04-campaign-controls.jpg','05-flow-merchandising.jpg','06-outcomes-handoff.jpg'];
function jpegSize(image) {
  assert.equal(image.readUInt16BE(0), 0xffd8, 'StockClearance asset must be JPEG');
  let offset = 2;
  while (offset < image.length) {
    assert.equal(image[offset++], 0xff);
    while (image[offset] === 0xff) offset++;
    const marker = image[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = image.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= image.length);
    if ([0xc0,0xc1,0xc2].includes(marker)) return [image.readUInt16BE(offset + 5),image.readUInt16BE(offset + 3)];
    offset += length;
  }
  assert.fail('StockClearance JPEG is missing a supported frame size');
}
for (const p of catalog.products) {
  const html = read(`apps/${p.slug}/index.html`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ['features', 'screenshots', 'setup', 'pricing', 'faq']) {
    assert.ok(html.includes(`id="${id}"`), `${p.name}: missing ${id} destination`);
  }
  assert.ok(privacy.includes(`id="${p.slug}"`), `${p.name}: privacy anchor must resolve`);
  for (const s of p.screenshots) {
    const image = fs.readFileSync(path.join(root, s.src.slice(1)));
    if (p.slug === 'stockclearance') {
      const index = p.screenshots.indexOf(s);
      assert.equal(p.screenshots.length, 6);
      assert.equal(s.src, `/assets/apps/stockclearance/${stockImages[index]}`);
      assert.equal(s.source, `https://attahirlabs.com${s.src}`);
      assert.equal(s.kind, index === 0 ? 'actual_app_ui' : 'explanatory_diagram');
      assert.deepEqual(jpegSize(image), [1600, 900]);
      assert.equal(s.width, 1600); assert.equal(s.height, 900);
      assert.match(s.alt, index === 0 ? /^Actual StockClearance campaign interface/ : /^Explanatory /);
      assert.ok(html.includes(`src="${s.src}"`));
    } else {
      assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.ok(image.readUInt32BE(16) >= 1000, `${p.name}: screenshot must be legible when expanded`);
      assert.ok(s.source.startsWith('https://cdn.shopify.com/app-store/listing_images/'));
    }
  }
  const metadata = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const faq = metadata.find(x => x['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, (html.match(/<details>/g) || []).length);
  const offer = metadata.find(x => x['@type'] === 'SoftwareApplication');
  assert.ok(offer.offers.every(x => x.priceCurrency === 'USD' && x.url === p.listing));
}
const stockPage = read('apps/stockclearance/index.html');
assert.match(stockPage, /actual app interface from an owned development store/);
assert.match(stockPage, /remaining graphics are labelled explanatory diagrams/);
assert.match(stockPage, /Built for reviewed variant clearance/);
assert.match(stockPage, /2,048 selected variants/);
assert.match(stockPage, /eight market contexts and eight active countries/);
assert.match(stockPage, /B2B company-location and retail contexts are blocked/);
assert.doesNotMatch(stockPage, /45,000|Built for product-level inventory decisions/);
// Trial promises and annual billing must remain specific to each app.
const tariff = catalog.products.find(p => p.slug === 'tariffshield');
assert.ok(tariff.plans.every(p => p.trialDays === 0));
assert.equal(tariff.plans.find(p => p.name === 'Pro').period, 'year');
assert.match(read('apps/tariffshield/index.html'), /U\.S\. quartz surface product scenarios/);
assert.match(read('apps/tariffshield/index.html'), /Both Exact Duty and multi-market margin calculations are temporarily unavailable/);
assert.match(read('apps/tariffshield/index.html'), /Unsupported or incomplete cases also return no duty number/);
for (const page of ['index.html', 'apps/index.html', 'apps/tariffshield/index.html']) {
  assert.doesNotMatch(read(page), /class="availability-notice"/, `${page}: TariffShield notice banner should be hidden`);
}
for (const slug of ['stockclearance', 'shelflife']) {
  assert.ok(catalog.products.find(p => p.slug === slug).plans.filter(p => p.price > 0).every(p => p.trialDays === 14));
}
assert.doesNotMatch(privacy, /Only your alert email address|Shopify Payments/);
assert.match(privacy, /message contents/);
assert.match(privacy, /protected identifiers and deletion-state markers/);
assert.match(privacy, /Google Analytics/);
assert.match(privacy, /href="\/analytics-preferences\/"/);
for (const p of ['index.html', 'apps/index.html', 'apps/storechronicle/index.html']) {
  const html = read(p);
  assert.ok(html.includes('StoreChronicle'));
  assert.doesNotMatch(html, /StoreChangelog|\/apps\/storechangelog\//);
}
assert.match(read('_redirects'), /^\/apps\/storechangelog\/ \/apps\/storechronicle\/ 301$/m);
assert.match(read('sitemap.xml'), /<loc>https:\/\/attahirlabs.com\/apps\/storechronicle\/<\/loc>/);
assert.doesNotMatch(read('sitemap.xml'), /<loc>https:\/\/attahirlabs.com\/apps\/storechangelog\/<\/loc>/);
console.log('Current product pages: shared content, screenshots, privacy links, plan boundaries, and rename redirects verified.');
