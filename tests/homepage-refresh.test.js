const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

function includes(text, message) {
  assert.ok(html.includes(text), message || 'homepage should include ' + text);
}

function excludes(pattern, message) {
  assert.ok(!pattern.test(html), message || 'homepage should not match ' + pattern);
}

function readPngPixel(filePath, x, y) {
  const png = fs.readFileSync(filePath);
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${filePath} should be a PNG`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === 'IHDR') {
      width = png.readUInt32BE(dataStart);
      height = png.readUInt32BE(dataStart + 4);
      bitDepth = png[dataStart + 8];
      colorType = png[dataStart + 9];
    } else if (type === 'IDAT') {
      idat.push(png.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  assert.equal(bitDepth, 8, `${filePath} should be an 8-bit PNG`);
  assert.ok(colorType === 2 || colorType === 6, `${filePath} should be an RGB or RGBA PNG so icon color can be regression-tested`);
  assert.ok(x >= 0 && x < width && y >= 0 && y < height, 'pixel coordinates should be inside the PNG');

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rows = [];
  let rawOffset = 0;

  for (let row = 0; row < height; row += 1) {
    const filter = raw[rawOffset];
    rawOffset += 1;
    const current = Buffer.from(raw.subarray(rawOffset, rawOffset + rowLength));
    rawOffset += rowLength;
    const previous = rows[row - 1] || Buffer.alloc(rowLength);

    for (let i = 0; i < rowLength; i += 1) {
      const left = i >= bytesPerPixel ? current[i - bytesPerPixel] : 0;
      const up = previous[i];
      const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0;
      if (filter === 1) current[i] = (current[i] + left) & 0xff;
      if (filter === 2) current[i] = (current[i] + up) & 0xff;
      if (filter === 3) current[i] = (current[i] + Math.floor((left + up) / 2)) & 0xff;
      if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        current[i] = (current[i] + predictor) & 0xff;
      }
    }

    rows.push(current);
  }

  const pixelOffset = x * bytesPerPixel;
  const pixel = Array.from(rows[y].subarray(pixelOffset, pixelOffset + bytesPerPixel));
  return colorType === 6 ? pixel : [...pixel, 255];
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
includes('utm_content=homepage_public_apps', 'homepage StockClearance install link should be campaign-trackable');
includes('https://apps.shopify.com/tariffshield', 'homepage should link to TariffShield App Store listing');
includes('What problem are you trying to solve?', 'homepage should route by merchant problem');
includes('Use free tools', 'homepage hero should route to the tool chooser');
includes('Shipping calculator', 'homepage should keep the shipping calculator visible');
includes('Public Apps', 'homepage should separate public apps from supporting tools');
includes('StoreChangelog', 'homepage should use current StoreChangelog product name');
includes('WarrantyTracker', 'homepage should use current WarrantyTracker product name');
includes('StockClearance', 'homepage should include StockClearance');
includes('ShelfLife', 'homepage should include ShelfLife');
includes('AccessShield', 'homepage should include AccessShield');
includes('/assets/home/merchant-operations-hero.jpg', 'homepage should use a relevant merchant-operations hero image');
includes('/assets/home/merchant-operations-hero-mobile.jpg', 'homepage should use an optimized mobile hero image');
includes('/assets/home/package-cost-desk.jpg', 'homepage should use a relevant package and cost-planning visual');
includes('<section class="tool-section" id="tools">', 'homepage free-tools section should have a stable anchor for direct visual checks');
includes('class="tool-intro-row"', 'homepage free-tools section should separate the intro/image row from the tool cards');
includes('class="tool-grid tool-card-grid"', 'homepage free-tools section should give cards a full-width grid row');
includes('Quick checks before you change a workflow.', 'homepage free-tools section should use tighter section copy');
includes('class="tool-cta"', 'homepage free-tools cards should use button-like CTAs');
includes('StockClearance logo', 'homepage should show the correct public inventory app logo');
includes('TariffShield app icon', 'homepage should show the public tariff app visually');
includes('2 public apps', 'homepage should summarize current public app status');
includes('3 free tools', 'homepage should summarize live tool status');
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
assert.ok(nav.includes('class="nav-item-apps"'), 'homepage top nav should expose an Apps hover dropdown wrapper');
assert.ok(nav.includes('class="apps-dropdown"'), 'homepage top nav should expose the Apps hover dropdown');
assert.ok(nav.includes('class="nav-item-tools"'), 'homepage top nav should expose a Free tools hover dropdown wrapper');
assert.ok(nav.includes('class="tools-dropdown"'), 'homepage top nav should expose the Free tools hover dropdown');
for (const route of [
  '/apps/stockclearance/',
  '/apps/tariffshield/',
  '/apps/shelflife/',
  '/apps/accessshield/',
  '/apps/storechangelog/',
  '/apps/warrantytracker/',
]) {
  assert.ok(nav.includes(`href="${route}"`), `homepage Apps dropdown should link to ${route}`);
}
for (const route of [
  '/duty/',
  '/shipping/',
  '/tools/access-checker/',
]) {
  assert.ok(nav.includes(`href="${route}"`), `homepage Free tools dropdown should link to ${route}`);
}
assert.ok(!nav.includes('View apps'), 'homepage top nav should not duplicate the Apps destination');
assert.ok(!nav.includes('Install StockClearance'), 'homepage top nav should not compete with page-level install CTAs');
assert.ok(!nav.includes('<li><a href="/apps/tariffshield/">TariffShield</a></li>'), 'homepage top nav should not add every public app as a top-level item');
assert.ok(!nav.includes('<li><a href="/shipping/">Shipping calculator</a></li>'), 'homepage top nav should not make individual tools top-level items');

excludes(/StoreChronicle/, 'homepage should not use deprecated StoreChronicle name');
excludes(/WarrantyShield/, 'homepage should not use deprecated WarrantyShield name');
excludes(/Coming Soon/, 'homepage should not use vague Coming Soon labels');
excludes(/4 preparing/i, 'homepage hero should not foreground staged apps as a proof chip');
excludes(/The homepage is now a router/i, 'homepage router section should stay visually tight without the descriptive helper line');
excludes(/Only apps with verified public Shopify App Store listings get install calls to action here\./i, 'homepage public apps section should stay tight without helper copy');
excludes(/No installability theater|Status Discipline/i, 'homepage should not include the removed status-discipline section');
excludes(/Built next/i, 'homepage public apps section should not include a preparation card beside public install CTAs');
excludes(/The free tools are diagnostic paths/i, 'homepage free-tools section should not use the old cramped explanatory copy');
excludes(/bulletproof/i, 'homepage should not make overbroad bulletproof claims');
excludes(/No tracking pixels/i, 'homepage should not contradict Google Analytics usage');
excludes(/GDPR compliant/i, 'homepage should not make blanket GDPR compliance claims');
excludes(/Daily<\/span>|Daily rate updates|daily rate updates/i, 'homepage should not claim daily updates without a current verification hook');
excludes(/986/, 'homepage should not include brittle tariff-rate counts');
excludes(/85\+ origin countries|39 import markets/i, 'homepage should avoid brittle coverage counts on the homepage');
excludes(/assets\/mockups\/shipping-calculator-(mockups|mobile-mockup|desktop-mockup)\.jpg/, 'homepage should not use shipping-calculator phone mockups as page imagery');

const stockClearanceLogoPixel = readPngPixel(path.join(root, 'assets/icons/stockclearance-logo-96.png'), 48, 38);
assert.ok(
  stockClearanceLogoPixel[0] < 40 &&
  stockClearanceLogoPixel[1] > 120 &&
  stockClearanceLogoPixel[2] > 120 &&
  stockClearanceLogoPixel[3] === 255,
  'StockClearance homepage card should use the boxes-and-tag logo, not the orange app icon'
);

assert.match(sitemap, /<loc>https:\/\/attahirlabs\.com\/<\/loc>\s*<lastmod>2026-06-28<\/lastmod>/, 'sitemap homepage lastmod should reflect the latest homepage update');

console.log('homepage refresh tests passed');
