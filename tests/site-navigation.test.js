const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const appStylePages = [
  'index.html',
  'apps/index.html',
  'apps/stockclearance/index.html',
  'apps/tariffshield/index.html',
  'apps/shelflife/index.html',
  'apps/accessshield/index.html',
  'apps/storechangelog/index.html',
  'apps/warrantytracker/index.html',
  'tools/index.html',
];

const siteNavPages = [
  'blog/index.html',
  'duty/index.html',
  'duty/rates/index.html',
  'shipping/index.html',
  'tools/access-checker/index.html',
  ...fs.readdirSync(path.join(root, 'blog'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `blog/${entry.name}/index.html`)
    .filter((relativePath) => fs.existsSync(path.join(root, relativePath))),
];

const expectedDropdownRoutes = [
  '/apps/stockclearance/',
  '/apps/tariffshield/',
  '/apps/shelflife/',
  '/apps/accessshield/',
  '/apps/storechangelog/',
  '/apps/warrantytracker/',
  '/duty/',
  '/shipping/',
  '/tools/access-checker/',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function primaryNav(html, relativePath) {
  const nav = html.match(/<nav\b[\s\S]*?<\/nav>/i)?.[0] || '';
  assert.ok(nav, `${relativePath} should have a primary nav`);
  return nav;
}

function assertConsistentNav(relativePath, { requiresSiteNavCss = false } = {}) {
  const html = read(relativePath);
  const nav = primaryNav(html, relativePath);

  for (const [label, href] of [
    ['Apps', '/apps/'],
    ['Free tools', '/tools/'],
    ['Blog', '/blog/'],
    ['Contact', '/contact.html'],
  ]) {
    assert.match(nav, new RegExp(`href="${href.replace('/', '\\/')}"[^>]*>${label}<`, 'i'), `${relativePath} should show ${label} in the top nav`);
  }

  for (const className of ['nav-item-apps', 'apps-dropdown', 'nav-item-tools', 'tools-dropdown']) {
    assert.ok(nav.includes(className), `${relativePath} should include ${className}`);
  }

  for (const route of expectedDropdownRoutes) {
    assert.ok(nav.includes(`href="${route}"`), `${relativePath} nav dropdowns should link to ${route}`);
  }

  assert.doesNotMatch(nav, />Home<\/a>/, `${relativePath} should use the brand mark, not a separate Home tab`);
  assert.doesNotMatch(nav, />Duty Calculator<\/a>/, `${relativePath} should group duty under Free tools`);
  assert.doesNotMatch(nav, />Shipping Calculator<\/a>/, `${relativePath} should group shipping under Free tools`);
  assert.doesNotMatch(nav, />Calculator<\/a>|>Rates<\/a>/, `${relativePath} should not expose calculator-local tabs in the global nav`);

  if (requiresSiteNavCss) {
    assert.ok(html.includes('href="/site-nav.css?v=20260630-global-nav"'), `${relativePath} should load the scoped global nav stylesheet`);
    assert.match(nav, /<nav class="site-nav" aria-label="Primary">/, `${relativePath} should use the scoped site nav wrapper`);
  }
}

for (const page of appStylePages) {
  assertConsistentNav(page);
}

for (const page of siteNavPages) {
  assertConsistentNav(page, { requiresSiteNavCss: true });
}

const siteNavCss = read('site-nav.css');
assert.match(siteNavCss, /\.site-nav \.apps-dropdown,\s*\.site-nav \.tools-dropdown\s*{[\s\S]*opacity: 0;/, 'site-nav CSS should hide dropdowns until hover/focus');
assert.match(siteNavCss, /\.site-nav \.apps-dropdown strong,\s*\.site-nav \.tools-dropdown strong\s*{\s*display: block;/, 'site-nav CSS should stack dropdown names above descriptions');
assert.match(siteNavCss, /@media \(max-width: 768px\)[\s\S]*\.site-nav \.apps-dropdown,\s*\.site-nav \.tools-dropdown\s*{\s*display: none;/, 'site-nav CSS should simplify dropdowns on mobile');

console.log('site navigation tests passed');
