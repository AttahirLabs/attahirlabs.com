const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appsCss = fs.readFileSync(path.join(root, 'apps/apps.css'), 'utf8');
const contactHtml = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');

const mobileMedia = appsCss.match(/@media \(max-width: 720px\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
assert.match(
  mobileMedia,
  /h1\s*\{[^}]*font-size:\s*clamp\(2\.35rem,\s*11vw,\s*3\.45rem\);[^}]*line-height:\s*1\.08;[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;[^}]*\}/,
  'the 720px mobile breakpoint should keep the apps hero H1 readable without breaking words'
);

const expectedDescription = 'Contact Attahir Labs for Shopify app support, product questions, beta access, and merchant workflow help.';
const descriptions = [...contactHtml.matchAll(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']\s*\/?\s*>/gi)];
assert.equal(descriptions.length, 1, 'contact.html should have exactly one meta description');
assert.equal(descriptions[0][1], expectedDescription, 'contact.html should use the approved meta description');

const canonicals = [...contactHtml.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']\s*\/?\s*>/gi)];
assert.equal(canonicals.length, 1, 'contact.html should have exactly one canonical link');
assert.equal(canonicals[0][1], 'https://attahirlabs.com/contact.html', 'contact.html should use its production canonical URL');

console.log('website guardrail tests passed');
