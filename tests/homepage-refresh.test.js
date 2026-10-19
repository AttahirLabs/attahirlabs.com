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

assert.match(html, /<title>Attahir Labs \| E-commerce Apps, Web Design &amp; Shopify Setup<\/title>/, 'homepage should use the problem-first SEO title');
assert.match(html, /<link rel="canonical" href="https:\/\/attahirlabs\.com\/">/, 'homepage canonical should include trailing slash');
assert.match(html, /<body\b[^>]*\bdata-design="cinematic-commerce"/, 'homepage should use the approved cinematic-commerce design');
const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
assert.equal(headings.length, 1, 'homepage should expose one primary heading');
assert.equal(headings[0][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  'Build a better e-commerce business.', 'homepage should lead with the approved business benefit');
assert.match(html, /<a\b[^>]*class="skip-link"[^>]*href="#main"[^>]*>Skip to content<\/a>/);
assert.match(html, /<main\b[^>]*id="main"/, 'the keyboard skip link must have a main-content destination');
includes('Explore the apps', 'homepage hero should have one clear primary routing CTA');
includes('Install StockClearance', 'homepage should prioritize the newly public inventory app');
includes('View TariffShield on Shopify', 'homepage should disclose TariffShield availability while keeping its listing link');
includes('/apps/stockclearance/', 'homepage should route StockClearance through its app page');
includes('/apps/tariffshield/', 'homepage should route TariffShield through its app page');
includes('/apps/', 'homepage should include the scalable app hub');
includes('/tools/', 'homepage should include the scalable free-tools hub');
includes('https://apps.shopify.com/stockclearance', 'homepage should link to StockClearance App Store listing');
includes('utm_content=homepage_public_apps', 'homepage StockClearance install link should be campaign-trackable');
includes('https://apps.shopify.com/tariffshield', 'homepage should link to TariffShield App Store listing');
includes('https://apps.shopify.com/shelflife', 'homepage should link to ShelfLife App Store listing');
includes('Install ShelfLife', 'homepage should expose the verified ShelfLife install CTA');
includes('What problem are you trying to solve?', 'homepage should route by merchant problem');
includes('Start a project', 'homepage hero should route to web design services');
includes('href="/web-design/#start"', 'project CTAs should retain the existing web-design enquiry destination');
includes('Shipping calculator', 'homepage should keep the shipping calculator visible');
includes('Public Apps', 'homepage should separate public apps from supporting tools');
includes('StoreChronicle', 'homepage should use current StoreChronicle product name');
includes('WarrantyTracker', 'homepage should use current WarrantyTracker product name');
includes('StockClearance', 'homepage should include StockClearance');
includes('ShelfLife', 'homepage should include ShelfLife');
includes('AccessShield', 'homepage should include AccessShield');
assert.match(html, /<section\b(?=[^>]*\bclass="[^"]*\btool-section\b)(?=[^>]*\bid="tools")[^>]*>/,
  'homepage free-tools section should retain its stable anchor');
assert.match(html, /class="[^"]*\btool-grid\b[^\"]*\btool-card-grid\b[^\"]*"/,
  'homepage free-tools section should retain its tool-card grid');
includes('Quick checks before you change a workflow.', 'homepage free-tools section should use tighter section copy');
includes('/assets/icons/stockclearance-suite.png', 'homepage should show the current catalog inventory app icon');
includes('TariffShield app icon', 'homepage should show the public tariff app visually');
const publicAppCardCount = [...html.matchAll(/<article\b[^>]*\bdata-app=["'][^"']+["'][^>]*>/g)].length;
includes(`${publicAppCardCount} public apps`, 'homepage public-app summary should agree with its actual rendered app cards');
const publicCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data/public-apps.json'), 'utf8'));
const publicCards = [...html.matchAll(/<article\b[^>]*\bdata-app=["']([^"']+)["'][^>]*>[\s\S]*?<\/article>/g)];
assert.deepEqual(publicCards.map(card => card[1]).sort(), publicCatalog.products.map(product => product.slug).sort(),
  'only catalog-confirmed public apps may have installable cards');
for (const product of publicCatalog.products) {
  const card = publicCards.find(card => card[1] === product.slug)[0];
  assert.ok(card.includes(`href="/apps/${product.slug}/"`), `${product.name}: retain app-page route`);
  assert.ok(card.includes(`href="${product.listing}?`), `${product.name}: use its exact public Shopify listing`);
  assert.ok(card.includes(product.icon), `${product.name}: use its current catalog icon`);
  assert.ok(fs.existsSync(path.join(root, product.icon.slice(1))), `${product.name}: icon must exist locally`);
  assert.ok(card.includes('Shopify App Store'), `${product.name}: preserve public status`);
}
const upcoming = html.match(/<!-- upcoming-apps:start -->([\s\S]*?)<!-- upcoming-apps:end -->/)?.[1];
assert.ok(upcoming, 'upcoming apps must remain separate from public app cards');
for (const app of publicCatalog.unlistedApps) {
  assert.ok(upcoming.includes(`href="${app.path}"`), `${app.name}: retain upcoming app-page route`);
  assert.ok(upcoming.includes(`<span>${app.name}</span><small>${app.status}</small>`), `${app.name}: preserve catalog availability`);
  assert.ok(!upcoming.includes(`Install ${app.name}`), `${app.name}: no premature installation claim`);
}
const organizationSchemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(match => JSON.parse(match[1])).filter(schema => schema['@type'] === 'Organization');
assert.equal(organizationSchemas.length, 1);
const organization = organizationSchemas[0];
assert.equal(organization.name, 'Attahir Labs');
assert.equal(organization.url, 'https://attahirlabs.com/');
assert.equal(organization.logo, 'https://attahirlabs.com/icon-512.png');
assert.deepEqual(organization.sameAs, publicCatalog.products.map(product => product.listing), 'homepage listing metadata should include every public app with its verified listing handle');
assert.equal(organization.makesOffer.length, publicAppCardCount, 'homepage offers should agree with actual public app cards');
assert.deepEqual(organization.makesOffer.map(offer => ({name:offer.itemOffered.name,url:offer.url,price:offer.price,currency:offer.priceCurrency})),
  publicCatalog.products.map(product => ({name:product.name,url:product.listing,price:String(Math.min(...product.plans.map(plan => plan.price))),currency:publicCatalog.currency})));
const chronicleOffer = organization.makesOffer.find(offer => offer.itemOffered.name === 'StoreChronicle');
assert.equal(chronicleOffer.url, 'https://apps.shopify.com/storechangelog');
assert.equal(chronicleOffer.price, '0');
includes('3 free tools', 'homepage should summarize live tool status');
includes('/blog/dead-stock-clearance-q2-2026/', 'homepage should feature current inventory content');
includes('href="/blog/"', 'homepage should retain access to the full guide library');
includes('/blog/product-expiry-date-management-shopify/', 'homepage should feature ShelfLife-aligned content');

const nav = html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/i)?.[0] || '';
assert.ok(!nav.includes('href="#live"'), 'homepage top nav should not link to internal live section');
assert.ok(!nav.includes('href="#pipeline"'), 'homepage top nav should not link to internal pipeline section');
assert.ok(!nav.includes('href="#resources"'), 'homepage top nav should not link to internal resources section');
assert.match(nav, /href="\/apps\/"[^>]*>Apps</i, 'homepage top nav should link to app hub');
assert.match(nav, /href="\/tools\/"[^>]*>Free tools</i, 'homepage top nav should link to free-tools hub');
assert.match(nav, /href="\/web-design\/"[^>]*>Web design</i, 'homepage top nav should retain web-design services');
assert.match(nav, /href="\/web-design\/#start"[^>]*>Start a project/i, 'homepage top nav should retain project enquiries');
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
  '/apps/storechronicle/',
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

excludes(/StoreChangelog/, 'homepage should not use the previous StoreChangelog name');
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

assert.match(sitemap, /<loc>https:\/\/attahirlabs\.com\/<\/loc>\s*<lastmod>2026-09-23<\/lastmod>/, 'sitemap homepage lastmod should reflect the current site update');

includes('data-cinematic-depth', 'approved homepage should retain layered cinematic scenes');
includes('class="portfolio-note"', 'unreleased apps should remain in their separate portfolio band');
includes('Illustrative scene', 'the commerce world must not imply client proof');
includes('Illustrative website concept', 'the storefront must remain clearly illustrative');
includes('data-cinema-toggle', 'visitors must have a visible motion control');
assert.match(html, /<button\b[^>]*data-cinema-toggle[^>]*aria-pressed="(?:true|false)"/, 'motion control must expose its state');
assert.match(html, /<dialog\b[^>]*id="cafe-dialog"[^>]*aria-labelledby="cafe-title"/, 'world viewer must have an accessible title');
includes('aria-label="Close world viewer"', 'world viewer must have an accessible close control');
const cinemaVideos = [...html.matchAll(/<video\b[^>]*data-cinema-video[^>]*>/g)];
assert.ok(cinemaVideos.length > 0, 'cinematic homepage should contain its native scenes');
for (const [tag] of cinemaVideos) {
  for (const attribute of ['muted', 'loop', 'playsinline', 'preload="none"']) {
    assert.ok(tag.includes(attribute), `native scene should retain ${attribute}`);
  }
  assert.ok(!tag.includes('autoplay'), 'runtime must respect motion preferences before playing media');
}
const cinemaAssets = [...new Set([...html.matchAll(/(?:src|data-src|poster)="(\/assets\/cinema\/[^"?]+)(?:\?[^\"]*)?"/g)].map(match => match[1]))];
const missingCinemaAssets = cinemaAssets.filter(asset => !fs.existsSync(path.join(root, asset.slice(1))));
assert.deepEqual(missingCinemaAssets, [], 'all referenced cinematic posters and videos must exist before release');
console.log('homepage refresh tests passed');
