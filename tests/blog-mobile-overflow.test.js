const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sleepNumberArticle = fs.readFileSync(
  path.join(root, 'blog/sleep-number-bankruptcy-shopify-inventory-lessons-2026/index.html'),
  'utf8',
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
