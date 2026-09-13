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
for (const p of catalog.products) {
  const html = read(`apps/${p.slug}/index.html`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ['features', 'screenshots', 'setup', 'pricing', 'faq']) {
    assert.ok(html.includes(`id="${id}"`), `${p.name}: missing ${id} destination`);
  }
  assert.ok(privacy.includes(`id="${p.slug}"`), `${p.name}: privacy anchor must resolve`);
  for (const s of p.screenshots) {
    const image = fs.readFileSync(path.join(root, s.src.slice(1)));
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(image.readUInt32BE(16) >= 1000, `${p.name}: screenshot must be legible when expanded`);
    assert.ok(s.source.startsWith('https://cdn.shopify.com/app-store/listing_images/'));
  }
  const metadata = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const faq = metadata.find(x => x['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, (html.match(/<details>/g) || []).length);
  const offer = metadata.find(x => x['@type'] === 'SoftwareApplication');
  assert.ok(offer.offers.every(x => x.priceCurrency === 'USD' && x.url === p.listing));
}
// Trial promises and annual billing must remain specific to each app.
const tariff = catalog.products.find(p => p.slug === 'tariffshield');
assert.ok(tariff.plans.every(p => p.trialDays === 0));
assert.equal(tariff.plans.find(p => p.name === 'Pro').period, 'year');
assert.match(read('apps/tariffshield/index.html'), /U\.S\. quartz surface product scenarios/);
assert.match(read('apps/tariffshield/index.html'), /exact calculations are temporarily unavailable/);
assert.match(read('apps/tariffshield/index.html'), /unsupported or incomplete cases return no duty number/);
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
