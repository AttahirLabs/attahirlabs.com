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
function populated(fixture) {
  let html = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace('class="results" id="results"', 'class="results" id="results" style="display:block"');
  for (const [id, value] of [['rateDisplay', fixture.rate], ['dutyDisplay', fixture.duty], ['totalDisplay', fixture.total]]) {
    html = html.replace(new RegExp(`(id="${id}">)[^<]*`), (_match, opening) => opening + value);
  }
  html = html.replace('<div class="breakdown" id="breakdown"></div>', `<div class="breakdown" id="breakdown">${fixture.rows.map(([label, value]) => `<div class="row-item duty"><span>${label}</span><span>${value}</span></div>`).join('')}</div>`);
  html = html.replace('Awaiting a response', 'Calculated — exact inputs matched active signed coverage');
  return html;
}
let browser;
let server;
(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/duty/') { res.setHeader('Content-Type', 'text/html'); res.end(populated(fixtures[url.searchParams.get('fixture')])); return; }
    const file = path.join(root, url.pathname);
    if (url.pathname.endsWith('.css') && fs.existsSync(file)) { res.setHeader('Content-Type', 'text/css'); res.end(fs.readFileSync(file)); return; }
    res.writeHead(204); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true });
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const results = [];
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
  }
  console.log(JSON.stringify({ checks: results.length, results, network: 'localhost only; browser scripts disabled' }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });
