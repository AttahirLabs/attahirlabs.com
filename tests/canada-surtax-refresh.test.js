const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('blog/canada-surtax-on-chinese-goods-2026/index.html', 'utf8');
const index = fs.readFileSync('blog/index.html', 'utf8');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');

assert.match(html, /Canada Tariffs on Chinese Goods 2026: Surtax Rates &amp; Import Rules/);
assert.match(html, /article:modified_time"\s+content="2026-07-15"|content="2026-07-15"\s+property="article:modified_time"/);
assert.match(html, /Updated July 15, 2026/);
assert.match(html, /Customs Notice 24-36/);
assert.match(html, /Notice to Importers No\. 1162/);
assert.match(html, /Notice to Importers No\. 1163/);
assert.doesNotMatch(html, /product with \$3 worth of Chinese steel/);
assert.doesNotMatch(html, /CAD \$40 for courier\/postal imports/);

const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
assert.ok(jsonLd.some((item) => item['@type'] === 'Article'));
assert.ok(jsonLd.some((item) => item['@type'] === 'FAQPage'));
assert.match(index, /Canada Tariffs on Chinese Goods 2026: Surtax Rates &amp; Import Rules/);
assert.match(index, /Updated Jul 15/);
assert.match(sitemap, /canada-surtax-on-chinese-goods-2026\/<\/loc>\s*<lastmod>2026-07-15<\/lastmod>/);

console.log('Canada surtax refresh guardrails passed');
