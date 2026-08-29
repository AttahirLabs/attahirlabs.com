import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogRoot = path.join(root, 'blog');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'data/blog-cta-contract.json'), 'utf8'));
const write = process.argv.includes('--write');
const stylesheet = '    <link rel="stylesheet" href="/blog/blog-cta.css?v=20260829">\n';

const publicBlocks = {
  tariffshield: `
<aside class="blog-app-cta" data-app-cta="tariffshield">
<p class="blog-cta-eyebrow">For supported U.S. duty scenarios</p>
<h2>Check exact U.S. duty inputs inside Shopify</h2>
<p>TariffShield gives authenticated Shopify merchants a read-only Exact Duty workflow for the exact HTSUS number, origin, MFN rate, Chapter 99 facts, customs value, and entry time they supply. It does not classify goods, infer origin or program eligibility, or return a number for unsupported coverage. Verify filing facts with official sources or a qualified customs professional.</p>
<a data-app-store-cta href="https://apps.shopify.com/tariffshield" rel="noopener" target="_blank">View TariffShield on the Shopify App Store →</a>
</aside>
`,
  stockclearance: `
<aside class="blog-app-cta" data-app-cta="stockclearance">
<p class="blog-cta-eyebrow">For slow and aging Shopify inventory</p>
<h2>Turn inventory signals into a reviewed clearance plan</h2>
<p>StockClearance helps Shopify merchants identify slow, dead, and seasonal inventory, see capital at risk, and organize products for clearance review. The merchant still reviews and executes pricing, discount, bundle, collection, and disposal decisions.</p>
<a data-app-store-cta href="https://apps.shopify.com/stockclearance" rel="noopener" target="_blank">View StockClearance on the Shopify App Store →</a>
</aside>
`,
  shelflife: `
<aside class="blog-app-cta" data-app-cta="shelflife">
<p class="blog-cta-eyebrow">For dated and batch-sensitive inventory</p>
<h2>Keep batches, expiry dates, and recall records connected</h2>
<p>ShelfLife helps Shopify merchants track expiry dates, batches, supplier lots, and FEFO workflows while keeping recall-ready operational records. It does not decide whether a product is legally recallable or replace official notices, food-safety procedures, or qualified advice.</p>
<a data-app-store-cta href="https://apps.shopify.com/shelflife" rel="noopener" target="_blank">Install ShelfLife</a>
</aside>
`
};

const resourceBlocks = {
  'access-checker': `
<aside class="blog-resource-cta" data-resource-cta="access-checker">
<p class="blog-cta-eyebrow">Free storefront check</p>
<h2>Scan the storefront customers actually use</h2>
<p>Use the free Attahir Labs accessibility checker to find common automated WCAG signals on a public storefront. An automated scan is a starting point, not legal certification or a substitute for manual keyboard, screen-reader, and user testing.</p>
<a data-resource-link href="/tools/access-checker/">Run the free accessibility checker →</a>
</aside>
`,
  'official-sources': `
<aside class="blog-resource-cta" data-resource-cta="official-sources">
<p class="blog-cta-eyebrow">Jurisdiction-specific verification</p>
<h2>Use the official sources for this market</h2>
<p>This article covers a jurisdiction outside the current supported U.S. scope of TariffShield and the Attahir Labs duty calculator. Use the primary sources below and a qualified customs professional for the exact classification, origin, preference, rate, value, and entry facts. Do not substitute a U.S. calculator result.</p>
<a data-resource-link href="#sources">Review the primary sources →</a>
</aside>
`,
  'storechangelog-preview': `
<aside class="blog-resource-cta" data-resource-cta="storechangelog-preview" data-app-availability="in-preparation">
<p class="blog-cta-eyebrow">Product status: in preparation</p>
<h2>Use the change-log workflow now</h2>
<p>StoreChangelog is not available to install from the Shopify App Store yet. Use this article's field-level change-log and incident-review process now, and check the product page for current release status.</p>
<a data-resource-link href="/apps/storechangelog/">View StoreChangelog release status →</a>
</aside>
`,
  'warrantytracker-preview': `
<aside class="blog-resource-cta" data-resource-cta="warrantytracker-preview" data-app-availability="in-preparation">
<p class="blog-cta-eyebrow">Product status: in preparation</p>
<h2>Build the warranty workflow before choosing software</h2>
<p>WarrantyTracker is not available to install from the Shopify App Store yet. Use this article's policy, evidence, resolution, and reporting checklist now, and check the product page for current release status.</p>
<a data-resource-link href="/apps/warrantytracker/">View WarrantyTracker release status →</a>
</aside>
`
};

const appListingAnchor = /<a\b[^>]*href=["']https:\/\/apps\.shopify\.com\/(?:tariffshield|stockclearance|shelflife|accessshield|storechangelog|warrantytracker)(?:[?/#][^"']*)?["'][^>]*>([\s\S]*?)<\/a>/gi;

function containsListing(fragment) {
  return /https:\/\/apps\.shopify\.com\/(?:tariffshield|stockclearance|shelflife|accessshield|storechangelog|warrantytracker)/i.test(fragment);
}

function removeLegacySalesCopy(html) {
  html = html.replace(/<aside\b[^>]*(?:data-app-cta|data-resource-cta)=["'][^"']+["'][^>]*>[\s\S]*?<\/aside>\s*/gi, '');
  html = html.replace(/<div\b(?=[^>]*class=["'][^"']*\bcta-box\b)[^>]*>[\s\S]*?<\/div>\s*/gi, (block) => containsListing(block) ? '' : block);
  html = html.replace(/<p\b[^>]*>[\s\S]*?<\/p>\s*/gi, (paragraph) => containsListing(paragraph) ? '' : paragraph);
  html = html.replace(appListingAnchor, '$1');
  html = html.replace(/<h2>CTA<\/h2>\s*/gi, '');
  html = html.replace(/<p>CTA:\s*[\s\S]*?<\/p>\s*/gi, '');
  return html;
}

function cleanEditorialLabels(slug, html) {
  html = html.replaceAll(
    'Dead Stock Prevention Guide (StockClearance tie-in)',
    'Dead Stock Prevention Guide: How Shopify Merchants Can Find Slow Movers Before They Become Write-Offs'
  );
  html = html.replaceAll(
    'Shopify Changelog Best Practices (StoreChangelog tie-in)',
    'Shopify Changelog Best Practices: Build a Change Log That Helps During Incidents'
  );
  html = html.replaceAll('Why StockClearance is the right tie-in here', 'Why StockClearance fits this workflow');
  html = html.replaceAll("StoreChangelog's tie-in is strongest here:", 'A structured store change log is especially useful here:');
  html = html.replaceAll('This is where the StoreChangelog tie-in becomes practical.', 'This is where a structured store change log becomes practical.');
  html = html.replace(/<p><strong>SEO title:<\/strong>[\s\S]*?<strong>App tie-in:<\/strong>\s*TariffShield<\/p>\s*/i, '');
  html = html.replace(/<h2\b[^>]*>\s*CTA\s*<\/h2>\s*/gi, '');
  html = html.replace(/<(h[2-6])([^>]*)>\s*CTA:\s*([a-z])/gi, (_, tag, attrs, first) => `<${tag}${attrs}>${first.toUpperCase()}`);
  html = html.replace(/<h2([^>]*)>(check landed cost before the broker files|if your warranty replacements cross borders, model the duty risk too|pair change history with landed-cost discipline|check your duty exposure before you quote the shipment)<\/h2>/gi,
    (_, attrs, heading) => `<h2${attrs}>${heading.charAt(0).toUpperCase()}${heading.slice(1)}</h2>`);
  html = html.replace(/<p><strong>CTA:<\/strong>[\s\S]*?<\/p>\s*/gi, '');
  html = html.replace(
    /<div class="faq-a">Yes\.\s*StockClearance automates[\s\S]*?<\/div>/i,
    '<div class="faq-a">StockClearance helps identify slow and dead inventory, show capital at risk, and organize products for review. Merchants still decide and execute any flash sale, bundle, collection, markdown, or disposal action.</div>'
  );
  if (slug === 'dead-stock-clearance-q2-2026') {
    html = html.replace(
      /(<div class="faq-q">Q: Can an app help with this\?<\/div>\s*)<div class="faq-a">[\s\S]*?<\/div>/i,
      '$1<div class="faq-a">Yes. <a href="https://apps.shopify.com/stockclearance?utm_source=attahirlabs&utm_medium=website&utm_campaign=stockclearance&utm_content=dead_stock_guide_faq" rel="noopener" target="_blank">StockClearance</a> helps identify slow and dead inventory, show capital at risk, and organize products for review. Merchants still decide and execute any flash sale, bundle, collection, markdown, or disposal action.</div>'
    );
  }
  if (slug === 'dead-stock-prevention-guide-shopify-slow-movers') {
    html = html.replace(/<p>If you are importing products[\s\S]*?TariffShield[\s\S]*?<\/p>\s*/i, '');
    html = html.replace(/<p>Dead stock prevention gets easier[\s\S]*?TariffShield[\s\S]*?<\/p>\s*/i, '');
  }
  if (slug === 'how-to-handle-product-recalls-on-shopify') {
    html = html.replace(/<p>This is where a tariff and duty workflow[\s\S]*?<\/p>\s*/i, '');
  }
  if (slug === 'how-to-track-who-changed-a-shopify-product-and-why-shopify-s-native-logs-fall-short') {
    html = html.replace(/<p>Use TariffShield[\s\S]*?<\/p>\s*/i, '');
  }
  if (slug === 'shopify-changelog-best-practices') {
    html = html.replace(/<p>Use the <strong><a href="\/duty\/">TariffShield duty calculator[\s\S]*?<\/p>\s*/i, '');
    html = html.replace(/<p>Many merchants change product prices[\s\S]*?TariffShield duty calculator, when duty exposure matters\.<\/p>\s*/i, '');
  }
  if (slug === 'shopify-warranty-management-what-merchants-need-to-track') {
    html = html.replace(/<p>This is also where TariffShield[\s\S]*?<\/p>\s*/i, '');
    html = html.replace(/<p>Use TariffShield[\s\S]*?<\/p>\s*/i, '');
  }
  if (slug === 'eu-low-value-import-duty-changes-2026') {
    html = html.replace(/<p>If you are trying to price low-value imports into Europe[\s\S]*?<\/p>\s*/i, '');
  }
  if (slug === 'doj-ada-website-accessibility-deadline-2026') {
    html = html.replace(/<p>&lt;div class="cta-box"&gt;[\s\S]*?&lt;\/div&gt;<\/p>\s*/gi, '');
  }
  if (slug === 'is-shopify-ada-compliant-2026') {
    html = html.replace(
      /<p>Accessibility fixes improve usability[\s\S]*?<\/p>/i,
      '<p>Accessibility fixes improve usability, conversion quality, and risk posture. Start with the <a href="/tools/access-checker/">free accessibility checker</a>, then prioritize manual keyboard, screen-reader, and customer-journey testing. For related context, read the <a href="/blog/wcag-accessibility-guide/">WCAG accessibility guide</a> and the <a href="/blog/shopify-account-takeover-protection/">Shopify account takeover protection guide</a>.</p>'
    );
  }
  if (slug === 'wcag-accessibility-guide') {
    html = html.replace(
      /<p>AccessShield scans your Shopify store for WCAG violations and gives you a prioritized list of fixes[^<]*<\/p>/i,
      '<p>The free Attahir Labs accessibility checker scans a public storefront for common automated WCAG signals and returns a prioritized starting list. Automated results do not prove compliance and should be followed by manual keyboard, screen-reader, zoom, contrast, and checkout-path testing.</p>'
    );
  }
  if (slug === 'shopify-food-recall-batch-tracking-white-cheddar-seasoning-2026') {
    html = html.replace(
      /Until the public App Store listing is ready, use this checklist as the operating standard\./i,
      'Use this checklist as the operating standard, then connect the records to ShelfLife when the workflow matches your store.'
    );
  }
  if (slug === 'wcag-accessibility-guide') {
    html = html.replaceAll('https://attahirlabs.com/accessibility-check/', '/tools/access-checker/');
  }
  return html;
}

function insertStylesheet(html) {
  if (html.includes('/blog/blog-cta.css?v=20260829')) return html;
  const siteNav = /\s*<link rel="stylesheet" href="\/site-nav\.css[^>]*>\s*/i;
  if (siteNav.test(html)) return html.replace(siteNav, (match) => `\n${stylesheet}${match.trimEnd()}\n`);
  return html.replace(/<\/head>/i, `${stylesheet}</head>`);
}

function insertContractBlock(slug, html) {
  const assigned = contract.articles[slug];
  let block = publicBlocks[assigned] || resourceBlocks[assigned] || '';
  const hrefOverride = contract.articleHrefOverrides?.[slug];
  if (hrefOverride && contract.publicApps[assigned]) {
    block = block.replace(`href="${contract.publicApps[assigned]}"`, `href="${hrefOverride}"`);
  }
  if (!block) return html;
  if (html.includes('href="#cta"')) {
    block = block.replace('<aside class=', '<aside id="cta" class=');
  }
  const normalizedBlock = `${block.trim()}\n`;
  const sources = /\s*<section\b(?=[^>]*class=["'][^"']*\breferences\b)(?=[^>]*id=["']sources["'])/i;
  if (sources.test(html)) return html.replace(sources, `\n${normalizedBlock}<section class="references" id="sources" data-cta-anchor="true"`).replace(
    /<section class="references" id="sources" data-cta-anchor="true"[^>]*>/i,
    '<section class="references" id="sources">'
  );
  if (/<\/article>/i.test(html)) return html.replace(/\s*<\/article>/i, `\n${normalizedBlock}</article>`);
  if (/<\/main>/i.test(html)) return html.replace(/\s*<\/main>/i, `\n${normalizedBlock}</main>`);
  if (/<\/div>\s*<\/body>/i.test(html)) return html.replace(/\s*<\/div>\s*<\/body>/i, `\n${normalizedBlock}</div>\n</body>`);
  return html.replace(/\s*<\/body>/i, `\n${normalizedBlock}</body>`);
}

function transform(slug, html) {
  let next = removeLegacySalesCopy(html);
  next = cleanEditorialLabels(slug, next);
  next = insertStylesheet(next);
  next = insertContractBlock(slug, next);
  next = next.replaceAll('.cta-box a[href*="apps.shopify.com/tariffshield"]', '.cta-box a[data-app-store-cta]');
  return next;
}

const changed = [];
for (const slug of Object.keys(contract.articles).sort()) {
  const file = path.join(blogRoot, slug, 'index.html');
  const current = fs.readFileSync(file, 'utf8');
  const next = transform(slug, current);
  if (next !== current) {
    changed.push(path.relative(root, file));
    if (write) fs.writeFileSync(file, next);
  }
}

const indexFile = path.join(blogRoot, 'index.html');
const currentIndex = fs.readFileSync(indexFile, 'utf8');
const nextIndex = cleanEditorialLabels('index', currentIndex);
if (nextIndex !== currentIndex) {
  changed.push(path.relative(root, indexFile));
  if (write) fs.writeFileSync(indexFile, nextIndex);
}

if (changed.length) {
  const verb = write ? 'updated' : 'requires synchronization';
  console.log(`${changed.length} blog files ${verb}:`);
  for (const file of changed) console.log(`- ${file}`);
  if (!write) process.exitCode = 1;
} else {
  console.log('blog CTA contract is synchronized');
}
