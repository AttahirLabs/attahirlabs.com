// Repository-only render checks: no live store, provider, or external network requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const artifactDir = process.env.QA_ARTIFACT_DIR;
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/public-apps.json'), 'utf8'));
const tariff = catalog.products.find(p => p.slug === 'tariffshield');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'website-fixture.invalid') return route.abort();
      let relative = decodeURIComponent(url.pathname).replace(/^\//, '');
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: 'Missing local fixture' });
      let body = fs.readFileSync(file);
      if (path.extname(file) === '.html') body = Buffer.from(body.toString().replace('</head>', '<style>html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}</style></head>'));
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
      await route.fulfill({ status: 200, contentType: types[path.extname(file)] || 'application/octet-stream', body });
    });
    const page = await context.newPage();
    const checks = [];
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/apps/', '/apps/tariffshield/']) {
        const response = await page.goto('http://website-fixture.invalid' + route);
        assert.equal(response.status(), 200);
        const main = route === '/apps/tariffshield/' ? page.locator('main') : page.locator('[data-app="tariffshield"]');
        await main.scrollIntoViewIfNeeded();
        assert.ok((await main.innerText()).includes(route === '/apps/tariffshield/' ? tariff.headline : tariff.summary));
        assert.ok((await main.innerText()).includes('Complete reviewed filing facts are required.'));
        if (route === '/apps/tariffshield/') {
          assert.ok((await main.innerText()).includes(tariff.scopeNote));
          for (const details of await page.locator('#faq details').all()) {
            await details.locator('summary').click();
            assert.ok(await details.locator('p').isVisible(), 'Native FAQ content must be accessible without JavaScript');
          }
          for (const image of await page.locator('#screenshots img').all()) {
            await image.scrollIntoViewIfNeeded();
            assert.ok((await image.getAttribute('alt')).includes('Not current guidance'));
          }
          assert.ok((await page.locator('#screenshots').innerText()).includes('Historical interface examples'));
          assert.ok((await page.locator('.product-shot figcaption').innerText()).includes('Historical'));
          const plans = await page.locator('.plan-card').allTextContents();
          assert.equal(plans.length, 3);
          assert.match(plans[1], /Standard[\s\S]*\$19[\s\S]*Billed monthly/);
          assert.match(plans[2], /Pro[\s\S]*\$190[\s\S]*Billed annually/);
          if (artifactDir && [390, 1440].includes(width)) {
            fs.mkdirSync(artifactDir, { recursive: true });
            await page.locator('#screenshots').screenshot({ path: path.join(artifactDir, `historical-gallery-${width}.png`) });
            // Capture a fresh initial viewport; an element taller than the viewport
            // otherwise moves the sticky navigation over the stitched screenshot.
            await page.goto('http://website-fixture.invalid' + route);
            await page.screenshot({ path: path.join(artifactDir, `product-hero-${width}.png`) });
          }
        }
        const geometry = await page.evaluate(() => ({
          viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
          headings: document.querySelectorAll('h1').length,
          broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'))
        }));
        assert.equal(geometry.headings, 1);
        assert.ok(geometry.documentWidth <= width + 1, JSON.stringify({ route, width, ...geometry }));
        assert.deepEqual(geometry.broken, []);
        checks.push({ route, width, ...geometry });
      }
    }
    console.log(JSON.stringify({ result: 'PASS', cases: checks.length, javaScriptEnabled: false, externalNetwork: false, checks }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
