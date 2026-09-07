const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/analytics.js'), 'utf8');
const api = require('../assets/analytics.js');
const sync = spawnSync(process.execPath, ['tools/sync-measurement.mjs'], { cwd: root, encoding: 'utf8' });
assert.equal(sync.status, 0, sync.stdout + sync.stderr);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules', '_site', 'tests'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const files = htmlFiles(root);
assert.ok(files.length > 80, 'exercise every actual HTML family, not a fixed sample');
const familyCounts = {};
const publicLinks = [];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const html = fs.readFileSync(file, 'utf8');
  const publicPath = '/' + relative.replace(/(^|\/)index\.html$/, '$1');
  assert.equal(api.canonicalPath(publicPath), publicPath, relative + ' has a bounded canonical source');
  const scripts = [...html.matchAll(/<script\b[^>]*src="\/assets\/analytics\.js"[^>]*><\/script>/g)];
  assert.equal(scripts.length, 1, relative + ' loads the bootstrap exactly once');
  assert.ok(scripts[0].index < html.indexOf('</head>'), relative + ' checks QA before any automatic sends');
  assert.doesNotMatch(html, /googletagmanager\.com\/gtag|gtag\(['"]config/, relative + ' must not bypass the bootstrap');
  const policyTag = html.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/i);
  if (policyTag) {
    assert.ok(policyTag.index < scripts[0].index, relative + ' applies CSP before bootstrap execution');
    const connect = policyTag[0].match(/connect-src ([^;]+)/)?.[1];
    if (connect) for (const origin of ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com']) assert.ok(connect.split(' ').includes(origin), relative + ' permits non-ad GA collection: ' + origin);
  }
  familyCounts[relative.split('/')[0]] = (familyCounts[relative.split('/')[0]] || 0) + 1;
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const app = api.appFromLink(match[1].replaceAll('&amp;', '&'));
    if (app) publicLinks.push({ app, href: match[1], publicPath });
  }
}
for (const family of ['index.html', 'apps', 'blog', 'duty', 'shipping', 'tools', 'contact.html', 'privacy.html', 'terms.html', 'review']) assert.ok(familyCounts[family], family);
assert.deepEqual([...new Set(publicLinks.map(x => x.app))].sort(), ['shelflife', 'stockclearance', 'tariffshield']);
assert.ok(publicLinks.length > 40, 'exercise the actual published App Store CTAs');

function browser(options = {}) {
  const listeners = {};
  const scripts = [];
  const doc = {
    readyState: options.loading ? 'loading' : 'complete',
    referrer: options.referrer || '',
    head: { appendChild: script => scripts.push(script) },
    createElement: () => ({}),
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); }
  };
  const window = {
    document: doc,
    location: { protocol: 'https:', hostname: 'attahirlabs.com', port: '', pathname: options.path || '/', search: options.search || '', ...options.location },
    localStorage: { getItem: () => options.storage || null },
    ...options.flags
  };
  const context = vm.createContext({ window, URL, URLSearchParams });
  vm.runInContext(source, context);
  return {
    window, doc, scripts, context,
    events: () => (window.dataLayer || []).map(x => Array.from(x)).filter(x => x[0] === 'event'),
    dispatch(name, event = {}) { (listeners[name] || []).forEach(fn => fn(event)); },
    listeners
  };
}
function target(href, ancestors = [], data = {}) {
  const anchor = {
    dataset: data,
    getAttribute: key => key === 'href' ? href : null,
    closest(selector) {
      if (selector === 'a[href]') return this;
      if (selector === '[data-analytics-event]') return data.analyticsEvent ? this : null;
      return selector.split(',').map(x => x.trim()).some(x => ancestors.includes(x)) ? {} : null;
    }
  };
  return { closest: selector => anchor.closest(selector) }; // A nested span/text wrapper.
}
const clean = browser({
  path: '/apps/shelflife/', search: '?email=private@example.com&shop=secret.myshopify.com&utm_source=google&utm_medium=organic&utm_campaign=shelflife&utm_content=app_page_hero&gclid=secret',
  referrer: 'https://www.google.com/search?q=private@example.com#secret'
});
assert.equal(clean.scripts.length, 1);
assert.equal(clean.events().filter(x => x[1] === 'page_view').length, 1);
const context = clean.events()[0][2];
assert.equal(context.page_location, 'https://attahirlabs.com/apps/shelflife/');
assert.equal(context.page_referrer, 'https://www.google.com/');
assert.equal(context.traffic_class, 'unclassified');
assert.equal(context.campaign_source, 'google');
assert.equal(context.campaign_medium, 'organic');
assert.equal(context.campaign_name, 'shelflife');
assert.equal(context.campaign_content, 'app_page_hero');
assert.doesNotMatch(JSON.stringify(clean.window.dataLayer), /private|secret|gclid|myshopify/);
assert.ok(clean.window.dataLayer.some(x => x[0] === 'config' && x[2].send_page_view === false));
assert.equal(clean.listeners.keydown, undefined, 'native keyboard activation produces a click; no second keyboard listener');
clean.dispatch('click', { detail: 0, target: target('https://apps.shopify.com/shelflife', ['.hero']) });
assert.equal(clean.events().filter(x => x[1] === 'app_store_outbound').length, 1);
const referral = clean.events().at(-1)[2];
assert.equal(referral.app_name, 'shelflife');
assert.equal(referral.placement, 'hero');
assert.equal(referral.surface, 'app_page');
assert.equal(referral.destination_type, 'shopify_app_store');
assert.doesNotMatch(JSON.stringify(referral), /link_url|href|email/);
clean.window.AttahirAnalytics.bindDom(clean.doc, clean.window.location);
vm.runInContext(source, clean.context);
clean.dispatch('click', { target: target('https://apps.shopify.com/shelflife', [], { analyticsEvent: 'app_store_outbound' }) });
assert.equal(clean.events().filter(x => x[1] === 'app_store_outbound').length, 2, 'duplicate includes/binds do not duplicate an activation; a second intentional click still counts');
assert.equal(clean.scripts.length, 1);
assert.equal(clean.events().filter(x => x[1] === 'page_view').length, 1);

for (const link of publicLinks) {
  const runtime = browser({ path: link.publicPath });
  runtime.dispatch('click', { target: target(link.href.replaceAll('&amp;', '&'), ['.blog-app-cta']) });
  assert.equal(runtime.events().filter(x => x[1] === 'app_store_outbound').length, 1, link.publicPath + ' actual CTA emits once');
  assert.equal(runtime.events().at(-1)[2].app_name, link.app);
}
for (const href of ['http://apps.shopify.com/shelflife', 'https://apps.shopify.com.evil.example/shelflife', 'https://secret@apps.shopify.com/shelflife', 'https://apps.shopify.com/shelflife/reviews', 'https://apps.shopify.com/accessshield', 'javascript:alert(1)']) {
  assert.equal(api.appFromLink(href), null);
  clean.dispatch('click', { target: target(href) });
}
assert.equal(clean.events().filter(x => x[1] === 'app_store_outbound').length, 2);
clean.dispatch('click', { defaultPrevented: true, target: target('https://apps.shopify.com/tariffshield') });
assert.equal(clean.events().filter(x => x[1] === 'app_store_outbound').length, 2);

for (const options of [
  { flags: { ATTAHIR_ANALYTICS_DISABLED: true } },
  { flags: { 'ga-disable-G-8QRJWWVMRZ': true } },
  { flags: { ATTAHIR_ANALYTICS_CONSENT: 'denied' } },
  { storage: 'true' },
  { location: { hostname: 'localhost' } },
  { location: { hostname: 'preview.pages.dev' } },
  { location: { protocol: 'http:' } },
  { location: { port: '8080' } },
  { path: '/email/private@example.com' },
  { path: '/tools/access-checker/' },
  { path: '/review/japan-duty-image-candidates/' }
]) {
  const runtime = browser(options);
  runtime.window.AttahirAnalytics.emit('tool_started', { surface: 'shipping_calculator', tool_name: 'shipping_calculator' });
  runtime.dispatch('click', { target: target('https://apps.shopify.com/shelflife') });
  assert.equal(runtime.scripts.length, 0, JSON.stringify(options));
  assert.equal(runtime.events().length, 0, JSON.stringify(options));
}
const lateDenied = browser();
lateDenied.window.ATTAHIR_ANALYTICS_DISABLED = true;
lateDenied.dispatch('click', { target: target('https://apps.shopify.com/shelflife') });
assert.equal(lateDenied.events().length, 1, 'explicit events honor a later preinit-flag change too');
const runtimeDisabled = browser();
runtimeDisabled.window.AttahirAnalytics.disable({ persist: true });
assert.equal(runtimeDisabled.window['ga-disable-G-8QRJWWVMRZ'], true, 'runtime disable invokes the Google SDK opt-out flag');
runtimeDisabled.dispatch('click', { target: target('https://apps.shopify.com/shelflife') });
assert.equal(runtimeDisabled.events().length, 1);
for (const origin of ['https://claude.ai', 'https://gemini.google.com']) {
  const referred = browser({ referrer: origin + '/private-conversation?email=secret@example.com' });
  assert.equal(referred.events()[0][2].page_referrer, origin + '/');
  assert.doesNotMatch(JSON.stringify(referred.window.dataLayer), /private-conversation|secret@example/);
}
assert.deepEqual(api.safeCampaign('?utm_source=google&utm_source=google&utm_campaign=private@example.com&utm_medium=email'), { campaign_medium: 'email' });
for (const input of ['https://merchant.myshopify.com/?secret', 'https://private@www.google.com/q', 'http://www.google.com/', 'https://127.0.0.1/private', 'https://unknown.example/?private', 'not a url']) assert.equal(api.safeReferrer(input), '');
assert.equal(api.safeReferrer('https://attahirlabs.com/contact.html?email=secret#secret'), 'https://attahirlabs.com/');
for (const path of ['/duty/index.html', '/shipping/index.html']) {
  const alias = browser({ path });
  assert.equal(alias.events().filter(x => x[1] === 'surface_viewed').length, 1, path);
  assert.doesNotMatch(alias.events()[0][2].page_location, /index.html/);
}
for (const path of ['/contact', '/contact/', '/privacy', '/terms']) {
  const alias = browser({ path });
  assert.equal(alias.events().filter(x => x[1] === 'page_view').length, 1, path);
  assert.equal(alias.events()[0][2].page_path, path.replace(/\/$/, '') + '.html');
}
const loading = browser({ loading: true, path: '/shipping/' });
assert.equal(loading.events().filter(x => x[1] === 'page_view').length, 1);
loading.dispatch('DOMContentLoaded');
loading.dispatch('DOMContentLoaded');
assert.equal(loading.events().filter(x => x[1] === 'surface_viewed').length, 1);
assert.equal(loading.events().filter(x => /^tool_(started|completed|failed)$/.test(x[1])).length, 0, 'loading a calculator never fabricates a tool attempt');
console.log(`Website measurement: ${files.length} HTML pages and ${publicLinks.length} live CTA hrefs verified; privacy, QA, keyboard/nested clicks and duplication checks passed.`);
