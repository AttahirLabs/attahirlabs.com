const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const blogRoot = path.join(root, 'blog');
const sleepNumberArticle = fs.readFileSync(
  path.join(root, 'blog/sleep-number-bankruptcy-shopify-inventory-lessons-2026/index.html'),
  'utf8',
);
const sharedBlogCss = fs.readFileSync(path.join(blogRoot, 'blog-cta.css'), 'utf8');
const ctaContract = JSON.parse(fs.readFileSync(path.join(root, 'data/blog-cta-contract.json'), 'utf8'));
const canonicalArticles = Object.keys(ctaContract.articles)
  .sort((left, right) => left.localeCompare(right))
  .map((slug) => path.join(blogRoot, slug, 'index.html'));

assert.equal(canonicalArticles.length, 70, 'the mobile guard must cover all 70 canonical articles');
for (const articlePath of canonicalArticles) {
  const article = fs.readFileSync(articlePath, 'utf8');
  assert.match(
    article,
    /<link\s+rel="stylesheet"\s+href="\/blog\/blog-cta\.css\?v=\d+">/,
    `${path.relative(root, articlePath)} must load the shared mobile guard stylesheet`,
  );
}

assert.match(
  sharedBlogCss,
  /article\s+table\s*,\s*\.post-content\s+table\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;[^}]*-webkit-overflow-scrolling:\s*touch;/,
  'wide article tables must scroll inside the article column instead of widening the page',
);
assert.match(
  sharedBlogCss,
  /article\s+li\s*,\s*\.post-content\s+li\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;/,
  'long source URLs in article lists must wrap inside a narrow viewport',
);

assert.match(
  sleepNumberArticle,
  /body\s*\{[^}]*overflow-x:\s*hidden;/,
  'the Sleep Number article should contain any horizontal overflow at the page boundary',
);
assert.match(
  sleepNumberArticle,
  /article\s*\{[^}]*min-width:\s*0;/,
  'the article column should be allowed to shrink below its intrinsic content width',
);
assert.match(
  sleepNumberArticle,
  /h1\s*\{[^}]*overflow-wrap:\s*anywhere;/,
  'the article title should wrap inside a narrow viewport',
);
assert.match(
  sleepNumberArticle,
  /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?main\s*\{[^}]*width:\s*calc\(100%\s*-\s*2rem\);[^}]*max-width:\s*358px;[^}]*margin-left:\s*1rem;[^}]*margin-right:\s*1rem;/,
  'the mobile article column should stay within the 390px capture boundary',
);

console.log('Sleep Number mobile overflow guardrails passed');
