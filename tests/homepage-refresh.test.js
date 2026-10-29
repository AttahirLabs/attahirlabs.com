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

const {elementsWithAttribute} = require('./helpers/html-elements.cjs');
const publicCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data/public-apps.json'), 'utf8'));
const publicEntries = elementsWithAttribute(html, 'data-app');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'homepage IDs must be unique');

assert.match(html, /<title>Attahir Labs \| E-commerce Apps, Web Design &amp; Shopify Setup<\/title>/);
assert.match(html, /<link rel="canonical" href="https:\/\/attahirlabs\.com\/">/);
assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
assert.doesNotMatch(html, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i, 'production homepage must be indexable');
assert.match(html, /<body\b[^>]*data-page="home"[^>]*data-design="navy-district"/, 'retain the selected navy district design');
const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
assert.equal(headings.length, 1);
assert.equal(headings[0][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 'Build a better e-commerce business.');
assert.match(html, /<a\b[^>]*class="skip-link"[^>]*href="#main"[^>]*>Skip to content<\/a>/);
assert.match(html, /<main\b[^>]*id="main"/);
includes('Explore the apps');
includes('Start a project');
includes('href="/web-design/#start"');
for (const route of ['/apps/', '/tools/', '/web-design/#start', '/blog/', '/contact.html', '/privacy.html', '/terms.html']) {
  includes(`href="${route}"`, `homepage retains the ${route} destination`);
}

assert.deepEqual(publicEntries.map(entry => entry.value).sort(), publicCatalog.products.map(product => product.slug).sort(),
  'the two primary cards and two compact public entries together cover exactly the public catalog');
const primaryGrid = elementsWithAttribute(html, 'class').find(entry => entry.value.split(/\s+/).includes('app-grid'));
assert.ok(primaryGrid, 'retain the primary app showcase');
assert.deepEqual(elementsWithAttribute(primaryGrid.html, 'data-app').map(entry => entry.value).sort(), ['shelflife', 'stockclearance'],
  'StockClearance and ShelfLife retain the selected large scene cards');
const portfolio = elementsWithAttribute(html, 'class').find(entry => entry.value.split(/\s+/).includes('portfolio-note'));
assert.ok(portfolio, 'the supporting apps remain in the separate portfolio band');
assert.deepEqual(elementsWithAttribute(portfolio.html, 'data-app').map(entry => entry.value).sort(), ['storechronicle', 'tariffshield']);
for (const product of publicCatalog.products) {
  const entry = publicEntries.find(candidate => candidate.value === product.slug).html;
  assert.ok(entry.includes(`href="/apps/${product.slug}/"`), `${product.name}: retain the app-page route`);
  const primaryCard = elementsWithAttribute(primaryGrid.html, 'class').find(candidate =>
    candidate.value.split(/\s+/).includes('app-showcase') &&
    elementsWithAttribute(candidate.html, 'data-app').some(app => app.value === product.slug));
  assert.ok((primaryCard?.html || entry).includes(product.icon), `${product.name}: retain the catalog icon with its public presentation`);
  assert.ok(fs.existsSync(path.join(root, product.icon.slice(1))), `${product.name}: the icon exists locally`);
  assert.match(entry, /Shopify App Store/, `${product.name}: retain its public status`);
  const listingLinks = [...entry.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)]
    .map(match => match[1].replaceAll('&amp;', '&')).filter(href => href.startsWith('https://apps.shopify.com/'));
  assert.ok(listingLinks.length, `${product.name}: expose a public listing CTA`);
  for (const href of listingLinks) {
    const url = new URL(href);
    assert.equal(url.origin + url.pathname, product.listing, `${product.name}: retain its exact verified listing handle`);
    for (const [key, value] of Object.entries({utm_source:'attahirlabs', utm_medium:'website', utm_campaign:product.slug, utm_content:'homepage_public_apps'})) {
      assert.deepEqual(url.searchParams.getAll(key), [value], `${product.name}: preserve one tracked ${key}`);
    }
  }
  assert.doesNotMatch(entry, /App Store listing in preparation|Get notified at launch/, `${product.name}: public availability cannot regress`);
}
for (const claim of html.matchAll(/\b(\d+) public apps\b/g)) assert.equal(Number(claim[1]), publicCatalog.products.length);
const upcoming = html.match(/<!-- upcoming-apps:start -->([\s\S]*?)<!-- upcoming-apps:end -->/)?.[1];
assert.ok(upcoming, 'upcoming apps remain separately marked');
assert.deepEqual([...upcoming.matchAll(/href="(\/apps\/[^"#?]+\/)"/g)].map(match => match[1]).sort(),
  publicCatalog.unlistedApps.map(app => app.path).sort(), 'the upcoming band contains only unlisted app destinations');
for (const app of publicCatalog.unlistedApps) {
  assert.ok(upcoming.includes(app.name) && upcoming.includes(app.status), `${app.name}: retain its actual preparation status`);
  assert.ok(!upcoming.includes(`Install ${app.name}`));
}
assert.ok(!upcoming.includes('StoreChronicle'), 'StoreChronicle must not return to upcoming status');

const organizationSchemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(match => JSON.parse(match[1])).filter(schema => schema['@type'] === 'Organization');
assert.equal(organizationSchemas.length, 1);
const organization = organizationSchemas[0];
assert.equal(organization.name, 'Attahir Labs');
assert.equal(organization.url, 'https://attahirlabs.com/');
assert.equal(organization.logo, 'https://attahirlabs.com/icon-512.png');
assert.deepEqual(organization.sameAs, publicCatalog.products.map(product => product.listing));
assert.equal(organization.makesOffer.length, publicEntries.length);
assert.deepEqual(organization.makesOffer.map(offer => ({name:offer.itemOffered.name, url:offer.url, price:offer.price, currency:offer.priceCurrency})),
  publicCatalog.products.map(product => ({name:product.name, url:product.listing, price:String(Math.min(...product.plans.map(plan => plan.price))), currency:publicCatalog.currency})));
const chronicleOffer = organization.makesOffer.find(offer => offer.itemOffered.name === 'StoreChronicle');
assert.equal(chronicleOffer.url, 'https://apps.shopify.com/storechangelog');
assert.equal(chronicleOffer.price, '0');

const tools = elementsWithAttribute(html, 'id').find(entry => entry.value === 'tools');
assert.ok(tools, 'retain the stable tools section destination');
for (const route of ['/duty/', '/shipping/', '/tools/access-checker/']) assert.ok(tools.html.includes(`href="${route}"`));
includes('Shipping calculator');
includes('/blog/dead-stock-clearance-q2-2026/');
includes('/blog/product-expiry-date-management-shopify/');
const nav = html.match(/<nav\b[^>]*data-menu[^>]*>[\s\S]*?<\/nav>/)?.[0];
assert.ok(nav, 'retain a labelled primary menu for the selected layout');
assert.match(nav, /aria-label="Main navigation"/);
for (const [label, target] of [['Apps','#apps'], ['Web design','#web-design'], ['Free tools','#tools'], ['Guides','#guides']]) {
  assert.match(nav, new RegExp(`href="${target}"[^>]*>${label}<`));
  assert.ok(ids.includes(target.slice(1)), `${label}: the navigation fragment resolves`);
}
assert.match(nav, /href="\/web-design\/#start"[^>]*>Start a project/);
const menuButton = html.match(/<button\b[^>]*data-menu-toggle[^>]*>/)?.[0];
assert.ok(menuButton);
assert.match(menuButton, /aria-expanded="false"/);
const controlledMenu = menuButton.match(/aria-controls="([^"]+)"/)?.[1];
assert.ok(controlledMenu && ids.includes(controlledMenu), 'the mobile menu controls an existing navigation element');
assert.ok(!nav.includes('Install StockClearance'), 'navigation does not compete with app CTAs');

for (const [pattern, message] of [
  [/StoreChangelog/, 'keep the current StoreChronicle name'],
  [/WarrantyShield/, 'keep the current WarrantyTracker name'],
  [/Coming Soon/, 'keep explicit preparation labels'],
  [/No installability theater|Status Discipline/i, 'do not restore removed internal status copy'],
  [/bulletproof/i, 'avoid overbroad claims'],
  [/No tracking pixels/i, 'do not contradict the shared analytics bootstrap'],
  [/GDPR compliant/i, 'avoid blanket compliance claims'],
  [/Daily<\/span>|Daily rate updates|daily rate updates/i, 'avoid unsupported update claims'],
  [/986|85\+ origin countries|39 import markets/i, 'avoid brittle tariff coverage claims'],
  [/assets\/mockups\/shipping-calculator-(mockups|mobile-mockup|desktop-mockup)\.jpg/, 'do not use tool screenshots as scene artwork'],
  [/Local design prototype|localhost|127\.0\.0\.1|(?:src|href|poster|data-src)="\/?prototypes\//i, 'do not ship preview-only labels or paths'],
]) excludes(pattern, message);
const logoPixel = readPngPixel(path.join(root, 'assets/icons/stockclearance-logo-96.png'), 48, 38);
assert.ok(logoPixel[0] < 40 && logoPixel[1] > 120 && logoPixel[2] > 120 && logoPixel[3] === 255,
  'retain the current boxes-and-tag inventory logo');
assert.match(sitemap, /<loc>https:\/\/attahirlabs\.com\/<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);

includes('Illustrative website concept');
includes('Illustrative data');
includes('data-parallax', 'retain bounded ambient art motion');
excludes(/A world of commerce|Illustrative scene|Step (?:inside|into) the caf[ée]|Take a look around|Pause motion|Scene credits|Analytics preferences/i, 'removed homepage labels stay absent');
excludes(/data-motion-toggle|data-scene-open|id="cafe-dialog"|data-cafe-video/, 'removed controls do not leave an unreachable café viewer');
assert.doesNotMatch(html, /\/assets\/cinema\/(?:home\.css|motion\.js)|data-cinema-video/, 'do not retain the replaced full-website cinematic homepage runtime');
const localAssets = [...new Set([...html.matchAll(/(?:src|data-src|poster|href)="(\/assets\/[^"?#]+)(?:\?[^\"]*)?"/g)].map(match => match[1]))];
assert.ok(localAssets.includes('/assets/navy-district/district.webp'));
assert.deepEqual(localAssets.filter(asset => !fs.existsSync(path.join(root, asset.slice(1)))), [], 'every homepage media, font and runtime dependency exists locally');
console.log('Navy district homepage: selected layout, public catalog, listing/SEO metadata and simplified homepage controls passed');
