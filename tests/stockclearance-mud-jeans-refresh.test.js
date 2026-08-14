const assert = require('node:assert/strict');
const fs = require('node:fs');

const articlePath = 'blog/retail-bankruptcies-dead-stock-warning-2026/index.html';
const sourcePath = '_posts/2026-04-21-retail-bankruptcies-dead-stock-warning-2026.md';
const article = fs.readFileSync(articlePath, 'utf8');
const source = fs.readFileSync(sourcePath, 'utf8');
const blogIndex = fs.readFileSync('blog/index.html', 'utf8');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');

const mudJeansSources = [
  'https://www.retaildive.com/news/mud-jeans-bankruptcy-k-shaped-economy-over-brooks-running-tapestry-earnings/827875/',
  'https://www.linkedin.com/feed/update/urn:li:activity:7490657205340483584/',
  'https://mudjeans.com/',
  'https://mudjeans.com/pages/about-us-mud-jeans'
];

assert.match(source, /^last_modified_at: 2026-08-14$/m, 'source records the refresh date');
assert.match(source, /## 2026 update: Mud Jeans/, 'source has the dated Mud Jeans update');
assert.match(source, /declared bankrupt after a filing it submitted itself/i);
assert.match(source, /historic debt/i);
assert.match(source, /temporarily paused new orders/i);
assert.match(source, /repairs, and take-back services/i);
assert.match(source, /weekly slow-mover thresholds/i);
assert.match(source, /circular or resale inventory separate from primary stock/i);
assert.match(source, /markdown, bundle, or liquidation/i);
assert.match(source, /not evidence that dead stock caused Mud Jeans’ bankruptcy/i);

assert.match(article, /<h2 id="2026-update-mud-jeans">2026 update: Mud Jeans<\/h2>/);
assert.match(article, /article:modified_time" content="2026-08-14"/);
assert.match(article, /"dateModified": "2026-08-14"/);
assert.match(article, /not evidence that dead stock caused Mud Jeans’ bankruptcy/i);
for (const url of mudJeansSources) {
  assert.ok(article.includes(url), `article cites ${url}`);
  assert.ok(source.includes(url), `source cites ${url}`);
}

assert.match(blogIndex, /Mud Jeans bankruptcy update/);
assert.match(sitemap, /retail-bankruptcies-dead-stock-warning-2026\/<\/loc>\s*<lastmod>2026-08-14<\/lastmod>/);
