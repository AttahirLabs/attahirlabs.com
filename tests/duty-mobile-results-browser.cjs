// Isolated layout fixtures: render repository CSS with populated result markup.
// Browser JavaScript is disabled; evaluate reads geometry only, never mutates or fetches.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(process.env.DUTY_PAGE_PATH || path.join(root, 'duty/index.html'), 'utf8');
const fixtures = {
  ordinary: { rate: '37.500000%', duty: '$375.00', total: '$1435.00', rows: [
    ['Base.mfn (0.000000%)', '+$0.00'],
    ['Special.section301.forced labor (12.500000%)', '+$125.00'],
    ['Special.section203.qsp safeguard (25.000000%)', '+$250.00'],
    ['Estimated subtotal', '$1435.00']
  ] },
  overQuota: { rate: '62.500000%', duty: '$625.00', total: '$1685.00', rows: [
    ['Special.section203.qsp safeguard (50.000000%)', '+$500.00'], ['Estimated subtotal', '$1685.00']
  ] },
  largeValues: { rate: '500.000000%', duty: '$50000000.00', total: '$62000000.00', rows: [
    ['Special.section203.qsp safeguard (500.000000%)', '+$50000000.00'],
    ['Special.cap (-75.000000%)', '-$7500000.00'], ['Estimated subtotal', '$62000000.00']
  ] }
};
function populated(fixture, state = "calculated") {
  let html = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace('class="results" id="results"', 'class="results" id="results" style="display:block"');
  for (const [id, value] of [['rateDisplay', fixture.rate], ['dutyDisplay', fixture.duty], ['totalDisplay', fixture.total]]) {
    html = html.replace(new RegExp(`(id="${id}">)[^<]*`), (_match, opening) => opening + value);
  }
  html = html.replace('<div class="breakdown" id="breakdown"></div>', `<div class="breakdown" id="breakdown">${fixture.rows.map(([label, value]) => `<div class="row-item duty"><span>${label}</span><span>${value}</span></div>`).join('')}</div>`);
  html = html.replace('Awaiting a response', 'Calculated — exact inputs matched active signed coverage');
  html = html.replace('<div class="desc" id="marginDesc"></div>', '<div class="desc" id="marginDesc">3 signed authority layers matched this exact request.</div>');
  html = html.replace('<div class="disclaimer" id="disclaimerText"></div>', '<div class="disclaimer" id="disclaimerText">Planning estimate under the exact inputs supplied. Not a legal determination.</div>');
  if (state !== 'calculated') {
    html = html.replace('class="result-status" id="resultState"', 'class="result-status unavailable" id="resultState"');
    html = html.replace('Calculated — exact inputs matched active signed coverage', 'Indeterminate — no supported exact result');
    html = html.replace('<div id="resultNumbers">', '<div id="resultNumbers" style="display:none">');
    if (state === 'validation') html = html.replace('<div class="error" id="error"></div>', '<div class="error" id="error" style="display:block">Complete every required reviewed entry input.</div>');
  }
  return html;
}
async function readContrast(page) {
  return page.evaluate(() => {
      const rgba = value => { const parts = value.match(/[\d.]+/g).map(Number); return [...parts.slice(0, 3), parts[3] ?? 1]; };
      const over = (front, back) => [...front.slice(0, 3).map((value, i) => value * front[3] + back[i] * (1 - front[3])), 1];
      const luminance = color => color.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((total, v, i) => total + v * [.2126, .7152, .0722][i], 0);
      const selectors = ['.hero p', '.hero-badge', '.accuracy-panel h2', '.accuracy-panel p', '.accuracy-panel strong',
        '.card h2', 'label', '.input-note', 'input[type="text"]', 'input[type="number"]', 'select', '.btn', '.error', '.result-status', '.response-metadata span',
        '.response-metadata strong', '.stat .label', '.stat .num', '.breakdown .row-item > span',
        '.margin-box .title', '.margin-box .desc', '.disclaimer', '.cta-link', '.seo p', '.seo a', 'footer p', 'footer a'];
      return selectors.flatMap(selector => [...document.querySelectorAll(selector)].filter(el => el.getBoundingClientRect().height > 0).map(el => {
        const chain = []; for (let node = el; node; node = node.parentElement) chain.push(node);
        let background = [255, 255, 255, 1];
        for (const node of chain.reverse()) background = over(rgba(getComputedStyle(node).backgroundColor), background);
        const foreground = over(rgba(getComputedStyle(el).color), background);
        const a = luminance(foreground), b = luminance(background);
        return { selector, text: el.textContent.slice(0, 80), foreground, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05),
          opacities: chain.map(node => getComputedStyle(node).opacity) };
      }));
    });
}

let browser;
let server;
(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/duty/') { res.setHeader('Content-Type', 'text/html'); res.end(populated(fixtures[url.searchParams.get('fixture')], url.searchParams.get('state') || 'calculated')); return; }
    const file = path.join(root, url.pathname);
    if (url.pathname.endsWith('.css') && fs.existsSync(file)) { res.setHeader('Content-Type', 'text/css'); res.end(fs.readFileSync(file)); return; }
    res.writeHead(204); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true });
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const results = [];
  const contrastResults = [];
  for (const width of [320, 375, 390, 480, 768, 1024]) for (const [fixtureName, fixture] of Object.entries(fixtures)) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`http://127.0.0.1:${server.address().port}/duty/?fixture=${fixtureName}`);
    const geometry = await page.evaluate(() => ({
      viewport: innerWidth, document: document.documentElement.scrollWidth,
      results: document.getElementById('results').getBoundingClientRect().toJSON(),
      rows: [...document.querySelectorAll('.breakdown .row-item')].map(row => ({
        bounds: row.getBoundingClientRect().toJSON(),
        parts: [...row.children].map(part => ({ text: part.textContent, bounds: part.getBoundingClientRect().toJSON(), scroll: part.scrollWidth, client: part.clientWidth }))
      })),
      stats: [...document.querySelectorAll('.stat .num')].map(value => ({ text: value.textContent, scroll: value.scrollWidth, client: value.clientWidth }))
    }));
    results.push({ width, fixture: fixtureName, documentWidth: geometry.document });
    assert.ok(geometry.document <= width + 1, `${fixtureName} at ${width}px widened document to ${geometry.document}px`);
    for (const row of geometry.rows) for (const part of row.parts) {
      assert.ok(part.bounds.left >= geometry.results.left - 1 && part.bounds.right <= geometry.results.right + 1, 'breakdown label and value remain inside result column');
      assert.ok(part.scroll <= part.client + 1, 'breakdown content wraps without clipping');
    }
    for (const stat of geometry.stats) assert.ok(stat.scroll <= stat.client + 1, 'statistic remains readable within its tile');
    assert.deepEqual(geometry.stats.map(x => x.text), [fixture.rate, fixture.duty, fixture.total], 'responsive layout preserves complete numeric text');
    const contrast = await readContrast(page);
    contrastResults.push({ width, fixture: fixtureName, minimumRatio: Math.min(...contrast.map(x => x.ratio)), samples: contrast });
    for (const sample of contrast) {
      assert.ok(sample.opacities.every(value => value === '1'), 'contrast fixture must not hide text through ancestor opacity');
      assert.ok(sample.ratio >= 4.5, `${sample.selector} at ${width}px contrast ${sample.ratio.toFixed(2)} below 4.5:1 on composited ${sample.background.slice(0, 3)}`);
    }

  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const state of ['unavailable', 'validation']) {
    await page.goto(`http://127.0.0.1:${server.address().port}/duty/?fixture=ordinary&state=${state}`);
    const contrast = await readContrast(page);
    assert.ok(contrast.some(x => x.selector === '.result-status'), 'unsupported state contrast must be measured');
    if (state === 'validation') assert.ok(contrast.some(x => x.selector === '.error'), 'visible validation error contrast must be measured');
    for (const sample of contrast) assert.ok(sample.ratio >= 4.5, `${state} ${sample.selector} contrast ${sample.ratio.toFixed(2)} below 4.5:1`);
    contrastResults.push({ width: 390, state, minimumRatio: Math.min(...contrast.map(x => x.ratio)), samples: contrast });
  }
  console.log(JSON.stringify({ checks: results.length, results, contrastResults, network: 'localhost only; browser scripts disabled' }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });
