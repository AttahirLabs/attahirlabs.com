const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const blogRoot = path.join(root, 'blog');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'data/blog-cta-contract.json'), 'utf8'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function textContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|#39);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const articleSlugs = fs.readdirSync(blogRoot)
  .filter((slug) => {
    const file = path.join(blogRoot, slug, 'index.html');
    if (!fs.existsSync(file)) return false;
    const html = fs.readFileSync(file, 'utf8');
    return /<h1\b/i.test(html) && !/http-equiv=["']refresh/i.test(html);
  })
  .sort();
const contractedSlugs = Object.keys(contract.articles).sort();

const edgeRedirects = new Map();
for (const [lineNumber, rawLine] of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/).entries()) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const fields = line.split(/\s+/);
  if (fields.length !== 3 || fields[2] !== '301') {
    fail(`_redirects:${lineNumber + 1} must contain source, destination, and 301`);
    continue;
  }
  if (edgeRedirects.has(fields[0])) fail(`_redirects repeats ${fields[0]}`);
  edgeRedirects.set(fields[0], fields[1]);
}

for (const slug of fs.readdirSync(blogRoot).sort()) {
  const relative = `blog/${slug}/index.html`;
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (!/http-equiv=["']refresh/i.test(html)) continue;
  const canonical = html.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']https:\/\/attahirlabs\.com(\/blog\/[^"']+\/)["'][^>]*>/i);
  if (!canonical) {
    fail(`${relative} redirect helper lacks a canonical blog target`);
    continue;
  }
  const alias = `/blog/${slug}/`;
  if (edgeRedirects.get(alias) !== canonical[1]) {
    fail(`${relative} lacks an exact edge 301 from ${alias} to ${canonical[1]}`);
  }
  if (/<article\b|FAQPage|data-(?:app|resource)-cta=|class=["'][^"']*cta-box/i.test(html)) {
    fail(`${relative} redirect helper retains article, FAQ, or CTA payload`);
  }
  if (!/This guide has moved/i.test(textContent(html))) {
    fail(`${relative} redirect helper lacks a concise moved-page message`);
  }
}

try {
  assert.deepEqual(contractedSlugs, articleSlugs);
} catch {
  fail(`CTA contract inventory differs from the ${articleSlugs.length} source articles`);
}

for (const slug of articleSlugs) {
  if (/\btie[ -]?in\b/i.test(slug)) fail(`source article slug ${slug} exposes an internal “tie-in” label`);
}

const publicEntries = Object.entries(contract.publicApps);
const unavailableListings = ['accessshield', 'storechangelog', 'warrantytracker'];
const appNameInTitle = /\b(?:TariffShield|StockClearance|ShelfLife|AccessShield|StoreChangelog|WarrantyTracker)\b/i;

for (const slug of articleSlugs) {
  const relative = `blog/${slug}/index.html`;
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const visibleText = textContent(html);
  const assigned = contract.articles[slug];

  if (/\btie[ -]?in\b/i.test(visibleText)) fail(`${relative} exposes an internal “tie-in” label`);
  if (/\btie[ -]?in\b/i.test(html)) fail(`${relative} exposes an internal “tie-in” label in public HTML`);
  for (const tag of html.matchAll(/<(?:title|meta|link)\b[^>]*>/gi)) {
    if (/\btie[ -]?in\b/i.test(tag[0])) fail(`${relative} exposes an internal “tie-in” label in head metadata`);
  }
  if (/<h[1-6][^>]*>\s*CTA(?:\s*:|\s*<\/h)/i.test(html) || /<strong>CTA:\s*<\/strong>/i.test(html)) {
    fail(`${relative} exposes an internal CTA label`);
  }
  if (/<h2\b[^>]*>\s*[a-z]/.test(html)) fail(`${relative} has a reader-facing H2 that begins with lowercase text`);
  if (/SEO title:<\/strong>[\s\S]{0,500}Meta description:<\/strong>[\s\S]{0,500}Target keyword:<\/strong>/i.test(html)) {
    fail(`${relative} exposes editorial scaffold metadata`);
  }
  if (/Until the public App Store listing is ready/i.test(html)) fail(`${relative} has stale pre-launch ShelfLife copy`);

  if (assigned === 'official-sources') {
    const articleBody = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
    const withoutResourceCta = articleBody.replace(/<aside\b[^>]*data-resource-cta=["']official-sources["'][^>]*>[\s\S]*?<\/aside>/gi, '');
    if (/(?:href=["'](?:\/duty\/|\/apps\/tariffshield\/|\/products\/tariffshield\/)|apps\.shopify\.com\/tariffshield)/i.test(withoutResourceCta)) {
      fail(`${relative} promotes a U.S.-only TariffShield or duty-calculator route in an official-sources article`);
    }
  }

  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]));
  for (const anchor of html.matchAll(/\bhref=["']#([^"']+)["']/gi)) {
    if (!ids.has(anchor[1])) fail(`${relative} links to missing local fragment #${anchor[1]}`);
  }

  for (const app of unavailableListings) {
    if (new RegExp(`https://apps\\.shopify\\.com/${app}(?:[?/#\"']|$)`, 'i').test(html)) {
      fail(`${relative} links to unavailable Shopify listing ${app}`);
    }
  }

  const directApps = publicEntries.filter(([, url]) => html.includes(url)).map(([app]) => app);
  if (Object.hasOwn(contract.publicApps, assigned)) {
    const expectedUrl = contract.articleHrefOverrides?.[slug] || contract.publicApps[assigned];
    if (!html.includes(`data-app-cta="${assigned}"`)) fail(`${relative} lacks the ${assigned} CTA marker`);
    if (!html.includes(`href="${expectedUrl}"`)) fail(`${relative} lacks the exact ${assigned} listing CTA`);
    if (directApps.some((app) => app !== assigned)) fail(`${relative} contains a cross-app listing CTA: ${directApps.join(', ')}`);
  } else {
    if (directApps.length) fail(`${relative} must use ${assigned}, not public-app listing CTA(s): ${directApps.join(', ')}`);
    if (assigned !== 'none') {
      const expectedResource = contract.resourceCtas[assigned];
      if (!html.includes(`data-resource-cta="${assigned}"`)) fail(`${relative} lacks the ${assigned} resource CTA marker`);
      if (!html.includes(`href="${expectedResource}"`)) fail(`${relative} lacks the exact ${assigned} resource CTA`);
    }
  }
}

const indexHtml = fs.readFileSync(path.join(blogRoot, 'index.html'), 'utf8');
const indexText = textContent(indexHtml);
if (/\btie[ -]?in\b/i.test(indexText)) fail('blog/index.html exposes an internal “tie-in” title label');

function plainTitle(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value) => String.fromCodePoint(Number.parseInt(value, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const indexCardCounts = new Map();
for (const card of indexHtml.matchAll(/<a href=["']\/blog\/([^/"']+)\/["'][^>]*>((?:(?!<\/a>)[\s\S])*)<\/a>/gi)) {
  const slug = card[1];
  const cardTitle = card[2].match(/(?:<div class=["']post-title["'][^>]*>|<h2\b[^>]*>)([\s\S]*?)(?:<\/div>|<\/h2>)/i);
  const articlePath = path.join(blogRoot, card[1], 'index.html');
  if (!cardTitle || !fs.existsSync(articlePath)) continue;
  indexCardCounts.set(slug, (indexCardCounts.get(slug) || 0) + 1);
  const articleHtml = fs.readFileSync(articlePath, 'utf8');
  const articleTitle = articleHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (articleTitle && plainTitle(cardTitle[1]) !== plainTitle(articleTitle[1])) {
    fail(`blog/index.html card title for ${card[1]} differs from the article H1`);
  }
}

for (const slug of articleSlugs) {
  const count = indexCardCounts.get(slug) || 0;
  if (count !== 1) fail(`blog/index.html has ${count} cards for ${slug}; expected exactly 1`);

  const relative = `blog/${slug}/index.html`;
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const ogTag = html.match(/<meta\b(?=[^>]*property=["']og:title["'])[^>]*>/i);
  const ogTitle = ogTag && ogTag[0].match(/content=(["'])([\s\S]*?)\1/i);
  const articleHeadlines = [];
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(script[1]);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      for (const record of records) {
        if (record && ['Article', 'BlogPosting', 'NewsArticle'].includes(record['@type']) && record.headline) {
          articleHeadlines.push(String(record.headline));
          if (!record.datePublished) fail(`${relative} Article JSON-LD lacks datePublished`);
          for (const value of [record.headline, record.description, record.mainEntityOfPage, record.url, record.image].flat()) {
            if (value && /\btie[ -]?in\b/i.test(String(value))) {
              fail(`${relative} exposes an internal “tie-in” label in Article JSON-LD`);
            }
          }
        }
      }
    } catch {
      fail(`${relative} contains invalid JSON-LD`);
    }
  }
  if (!h1 || !documentTitle) {
    fail(`${relative} lacks a reader-facing H1 or document title`);
    continue;
  }
  const expected = plainTitle(h1[1]);
  const actualTitle = plainTitle(documentTitle[1]).replace(/\s*\|\s*Attahir Labs\s*$/i, '');
  if (actualTitle !== expected) fail(`${relative} document title differs from the article H1`);
  if (appNameInTitle.test(expected)) fail(`${relative} exposes an Attahir Labs app name in its public article title`);
  if (ogTitle && plainTitle(ogTitle[2]) !== expected) fail(`${relative} og:title differs from the article H1`);
  for (const articleHeadline of articleHeadlines) {
    if (plainTitle(articleHeadline) !== expected) fail(`${relative} Article headline differs from the article H1`);
  }
  if (articleHeadlines.length !== 1) fail(`${relative} has ${articleHeadlines.length} Article JSON-LD records; expected exactly 1`);
}

const sourcePages = {
  '2026-03-26-march-sales-slump-dead-stock.md': 'dead-stock-clearance-q2-2026',
  '2026-03-31-shopify-account-takeover-protection.md': 'shopify-account-takeover-protection',
  '2026-04-20-cbp-tariff-refund-portal-live.md': 'cbp-tariff-refund-portal-live',
  '2026-04-20-uk-import-duty-post-brexit.md': 'uk-import-duty-post-brexit',
  '2026-04-21-doj-ada-website-accessibility-deadline-2026.md': 'doj-ada-website-accessibility-deadline-2026',
  '2026-04-21-retail-bankruptcies-dead-stock-warning-2026.md': 'retail-bankruptcies-dead-stock-warning-2026',
  '2026-05-07-shopify-benchmark-comparisons-removed-may-19.md': 'shopify-benchmark-comparisons-removed-may-19'
};
for (const [sourceFile, slug] of Object.entries(sourcePages)) {
  const source = fs.readFileSync(path.join(root, '_posts', sourceFile), 'utf8');
  const sourceTitle = source.match(/^title:\s*["'](.+)["']\s*$/m);
  const article = fs.readFileSync(path.join(blogRoot, slug, 'index.html'), 'utf8');
  const articleTitle = article.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!sourceTitle || !articleTitle || plainTitle(sourceTitle[1]) !== plainTitle(articleTitle[1])) {
    fail(`_posts/${sourceFile} title differs from blog/${slug}/index.html H1`);
  }
}

const publicCopyGuardrails = [
  [/This draft is for general educational purposes/i, 'draft-stage disclaimer label'],
  [/\bretargeted\b/i, 'editorial retargeting note'],
  [/current documented safe claims/i, 'internal claim-review language'],
  [/SEO and operational themes/i, 'SEO-planning language'],
  [/search entry point/i, 'search-planning language'],
  [/answer-engine optimization/i, 'answer-engine planning language'],
  [/built to capture the query chain/i, 'query-capture planning language'],
  [/worst March since 2020/i, 'unsupported March benchmark'],
  [/Sales down 30%/i, 'unsupported sales benchmark'],
  [/Industry standard is usually 60[–-]90 days/i, 'unsupported dead-stock benchmark'],
  [/15[–-]25% markdown usually moves/i, 'unsupported markdown outcome'],
  [/beats a permanent price drop every time/i, 'absolute markdown outcome'],
  [/Carrying cost:\s*~2[–-]3% per month/i, 'unsupported carrying-cost benchmark'],
  [/This is happening TODAY/i, 'stale account-takeover urgency'],
  [/\$25K\+/i, 'unsupported account-takeover loss amount'],
  [/5,000[–-]10,000\+ emails/i, 'unsupported email-bombing volume'],
  [/one thread has been running for 48\+ hours/i, 'uncited incident-thread claim'],
  [/4,605 ADA Title III lawsuits/i, 'unsupported accessibility lawsuit count'],
  [/score jumps roughly 40%/i, 'unsupported accessibility-score improvement'],
  [/Hit 85[–-]90% on Lighthouse/i, 'unsafe Lighthouse compliance threshold'],
  [/Budget \$1,000[–-]\$5,000/i, 'unsupported accessibility-service range'],
  [/Settlements run \$5,000 to \$50,000\+/i, 'unsupported accessibility-settlement range'],
  [/If you have any EU traffic, you(?:'|’)?re in scope/i, 'overbroad EAA scope claim'],
  [/wrong code can mean 25% more in duties/i, 'unsupported HTS card uplift'],
  [/could save you thousands in duties/i, 'unsupported CUSMA savings claim'],
  [/depends on p(?:["<]|$)/i, 'truncated EU meta description'],
  [/app is installe(?:["<]|$)/i, 'truncated changelog meta description'],
  [/Bonus:\*\*/i, 'visible Markdown emphasis marker']
];

const sourceCopyGuardrails = [
  [/30[–-]50% drops/i, 'unsupported March sales range'],
  [/35[–-]50% off/i, 'universal markdown range'],
  [/60\+ days/i, 'fixed dead-stock age threshold'],
  [/48[–-]72 hours maximum/i, 'fixed flash-sale duration'],
  [/1K[–-]10K followers/i, 'fixed influencer range'],
  [/90 days should be flagged/i, 'fixed inventory-age threshold'],
  [/always outperform/i, 'guaranteed campaign outcome'],
  [/\$25,?000/i, 'unsupported account-takeover loss amount'],
  [/500\+ order notifications/i, 'unsupported notification volume'],
  [/vast majority of account takeover attempts/i, 'unsupported 2FA outcome'],
  [/\$50K credit line[\s\S]{0,80}\$5K/i, 'fixed credit-line example'],
  [/significantly more sophisticated in 2026/i, 'unsupported attack-trend claim'],
  [/increasingly common/i, 'unsupported attack-trend claim'],
  [/Shopify(?:'|’)?s platform security is solid/i, 'categorical platform-security claim']
];

for (const sourceFile of fs.readdirSync(path.join(root, '_posts')).filter((file) => file.endsWith('.md'))) {
  const source = fs.readFileSync(path.join(root, '_posts', sourceFile), 'utf8');
  for (const [pattern, label] of [...publicCopyGuardrails, ...sourceCopyGuardrails]) {
    if (pattern.test(source)) fail(`_posts/${sourceFile} retains ${label}`);
  }
}

for (const slug of articleSlugs) {
  const relative = `blog/${slug}/index.html`;
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const visibleText = textContent(html);

  for (const [pattern, label] of publicCopyGuardrails) {
    if (pattern.test(visibleText) || pattern.test(html)) fail(`${relative} retains ${label}`);
  }

  if (/<p\b[^>]*>\s*\|[\s\S]{0,2500}?\|\s*:?-{3,}/i.test(html)) {
    fail(`${relative} renders a Markdown table as visible paragraph text`);
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/\*\*|\[[^\]]+\]\(https?:\/\/|>\s*Sources?:/i.test(match[1])) {
      fail(`${relative} exposes Markdown or editorial source labels in JSON-LD`);
    }
  }
}

for (const [pattern, label] of publicCopyGuardrails) {
  if (pattern.test(indexText) || pattern.test(indexHtml)) fail(`blog/index.html retains ${label}`);
}

if (/\/(?:blog|assets\/blog)\/[^"'<>\s]*tie[ -]?in/i.test(indexHtml)) {
  fail('blog/index.html links to a public article or asset URL containing an internal “tie-in” label');
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
if (/\/blog\/[^<>\s]*tie[ -]?in/i.test(sitemap)) {
  fail('sitemap.xml contains a public article URL with an internal “tie-in” label');
}

const deadStockQ2 = fs.readFileSync(path.join(blogRoot, 'dead-stock-clearance-q2-2026', 'index.html'), 'utf8');
const trackedStockClearanceBase = 'https://apps.shopify.com/stockclearance?utm_source=attahirlabs&utm_medium=website&utm_campaign=stockclearance';
if (!deadStockQ2.includes(`${trackedStockClearanceBase}&utm_content=dead_stock_guide_cta`)) {
  fail('dead-stock guide lost its historical CTA campaign attribution');
}
if (!deadStockQ2.includes(`${trackedStockClearanceBase}&utm_content=dead_stock_guide_faq`)) {
  fail('dead-stock guide lost its FAQ-position campaign attribution');
}

const sync = spawnSync(process.execPath, ['tools/sync-blog-cta-contract.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (sync.status !== 0) fail(`blog CTA generator drifted:\n${sync.stdout}${sync.stderr}`);

for (const [slug, badge] of [
  ['saks-global-inventory-lessons-shopify-2026', 'Breaking'],
  ['retail-bankruptcies-dead-stock-warning-2026', 'Breaking'],
  ['doj-ada-website-accessibility-deadline-2026', 'Breaking'],
  ['cbp-tariff-refund-portal-live', 'New'],
  ['qvc-bankruptcy-stock-clearance-2026', 'Breaking'],
  ['home-retail-dead-stock-2026', 'Breaking'],
  ['hts-code-reclassification-tariff-margin', 'Must Read'],
  ['dead-stock-clearance-q2-2026', 'Timely'],
  ['shopify-account-takeover-protection', 'Breaking']
]) {
  const cardPattern = new RegExp(`href=["']\\/blog\\/${slug}\\/["'][\\s\\S]{0,900}>\\s*${badge}\\s*<`, 'i');
  if (cardPattern.test(indexHtml)) fail(`blog/index.html retains stale “${badge}” badge for ${slug}`);
}

for (const [slug, badge] of [
  ['canada-canned-vegetable-safeguard-tariff-2026', 'Breaking'],
  ['cbp-tariff-refund-portal-live', 'New'],
  ['qvc-bankruptcy-stock-clearance-2026', 'Breaking'],
  ['retail-bankruptcies-dead-stock-warning-2026', 'Breaking'],
  ['shopify-account-takeover-protection', 'Breaking News']
]) {
  const html = fs.readFileSync(path.join(blogRoot, slug, 'index.html'), 'utf8');
  if (new RegExp(`>\\s*${badge}\\s*<`, 'i').test(html)) fail(`blog/${slug}/index.html retains stale “${badge}” badge`);
}

for (const [relative, pattern, label] of [
  ['blog/shopifyql-matches-shopify-reports-2026/index.html', /<(?:title|h1)\b[^>]*>[^<]*Reporting QA/i, 'internal Reporting QA title'],
  ['blog/index.html', /class=["']post-title["'][^>]*>[^<]*Reporting QA/i, 'internal Reporting QA card title']
]) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  if (pattern.test(html)) fail(`${relative} retains ${label}`);
}
if (/reduce refunds by up to 40%/i.test(indexText)) fail('blog/index.html exposes the unsupported warranty outcome claim');

for (const slug of articleSlugs) {
  const html = fs.readFileSync(path.join(blogRoot, slug, 'index.html'), 'utf8');
  const visibleText = textContent(html);
  if (/reduce refunds by up to 40%/i.test(visibleText)) fail(`blog/${slug}/index.html exposes the unsupported warranty outcome claim`);
}

if (failures.length) {
  throw new assert.AssertionError({
    message: `Blog CTA/title contract failed (${failures.length} findings):\n- ${failures.join('\n- ')}`,
    actual: failures.length,
    expected: 0,
    operator: 'strictEqual'
  });
}

console.log(`blog CTA/title contract passed for ${articleSlugs.length} articles`);
