const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const articlePath = path.join(root, 'blog/product-batch-tracking-and-fefo-for-shopify/index.html');
const article = fs.readFileSync(articlePath, 'utf8');
const blogIndex = fs.readFileSync(path.join(root, 'blog/index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

assert.match(
  article,
  /<title>Shopify Batch Tracking: “Add to Batch” and FEFO \| Attahir Labs<\/title>/,
  'the refresh should target the observed add-to-batch search intent',
);
assert.match(
  article,
  /<h1>Shopify batch tracking: what “add to batch” means and how FEFO works<\/h1>/,
  'the H1 should answer the observed query in plain language',
);
assert.match(article, /<meta name="description" content="What does add to batch mean on Shopify\?[^"\n]+">/);
assert.match(article, /<link rel="canonical" href="https:\/\/attahirlabs\.com\/blog\/product-batch-tracking-and-fefo-for-shopify\/">/);
assert.match(article, /Updated July 17, 2026/);

const jsonLd = [...article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const articleSchema = jsonLd.find((entry) => entry['@type'] === 'Article');
const faqSchema = jsonLd.find((entry) => entry['@type'] === 'FAQPage');

assert.ok(articleSchema, 'Article JSON-LD should exist');
assert.equal(articleSchema.headline, 'Shopify batch tracking: what “add to batch” means and how FEFO works');
assert.equal(articleSchema.datePublished, '2026-07-01');
assert.equal(articleSchema.dateModified, '2026-07-17');
assert.ok(faqSchema, 'FAQPage JSON-LD should exist');
assert.ok(faqSchema.mainEntity.length >= 5, 'FAQ schema should contain useful merchant questions');
assert.ok(
  faqSchema.mainEntity.some((item) => item.name === 'What does add to batch mean on Shopify?'),
  'FAQ schema should directly answer the observed query',
);
for (const item of faqSchema.mainEntity) {
  assert.ok(item.acceptedAnswer.text.length >= 45, `${item.name} should have a substantive schema answer`);
  assert.doesNotMatch(item.acceptedAnswer.text, /see (the )?(detailed )?answer|section above/i);
  assert.ok(article.includes(`<h3>${item.name}</h3>`), `${item.name} should also be visible on the page`);
  assert.ok(article.includes(`<p>${item.acceptedAnswer.text}</p>`), `${item.name} schema answer should match visible copy`);
}

for (const officialSource of [
  'https://shopify.dev/docs/api/admin-graphql/latest/objects/InventoryLevel',
  'https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods',
  'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
  'https://inspection.canada.ca/en/food-safety-industry/traceability',
  'https://inspection.canada.ca/en/food-safety-industry/traceability/lot-code',
]) {
  assert.ok(article.includes(officialSource), `article should cite official source ${officialSource}`);
}

assert.match(article, /What “add to batch” means in Shopify operations/);
assert.match(article, /A batch record does not increase Shopify's sellable quantity by itself/);
assert.match(article, /ShelfLife keeps app-local batch records/);
assert.match(
  article,
  /does not automatically allocate a batch to a fulfillment or map batches to customer orders/,
  'the article must state the verified ShelfLife product boundary',
);
assert.doesNotMatch(article, /apps\.shopify\.com\/shelflife/);
assert.equal((article.match(/data-cta="shelflife"/g) || []).length, 2, 'ShelfLife CTA should appear mid-post and near the end');

assert.match(
  blogIndex,
  /<h2>Shopify Batch Tracking: “Add to Batch” and FEFO<\/h2>[\s\S]*?<p class="post-meta">Updated July 17, 2026<\/p>[\s\S]*?<p class="post-excerpt">Learn what “add to batch” means, how FEFO differs from FIFO, and which lot, expiry, and location fields dated-inventory teams should track\.<\/p>/,
  'blog index should carry the refreshed title, date, and useful excerpt',
);
assert.match(
  sitemap,
  /<loc>https:\/\/attahirlabs\.com\/blog\/product-batch-tracking-and-fefo-for-shopify\/<\/loc>\s*<lastmod>2026-07-17<\/lastmod>/,
  'sitemap should reflect the substantive refresh date',
);

console.log('FEFO article refresh tests passed');
