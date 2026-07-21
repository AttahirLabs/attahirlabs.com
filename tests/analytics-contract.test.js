const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analytics = require('../assets/analytics.js');

const sent = [];
analytics.setTransport((name, params) => sent.push({ name, params }));

assert.deepStrictEqual(
  analytics.emit('tool_completed', {
    surface: 'duty_calculator', tool_name: 'duty_calculator', result_band: 'high', unknown: 'drop-me'
  }),
  { name: 'tool_completed', params: { surface: 'duty_calculator', tool_name: 'duty_calculator', result_band: 'high' } }
);
assert.strictEqual(sent.length, 1);
assert.strictEqual(analytics.emit('tool_started', {
  surface: 'duty_calculator', tool_name: 'duty_calculator', url: 'https://merchant.test'
}), null);
assert.strictEqual(sent.length, 1, 'prohibited data must fail closed without transport');
assert.strictEqual(analytics.emit('tool_started', {
  surface: 'duty_calculator', tool_name: 'not_a_tool'
}), null);

const disabled = require('../assets/analytics.js').createAnalytics({ transport: null });
assert.doesNotThrow(() => disabled.emit('surface_viewed', { surface: 'homepage', surface_group: 'website' }));

const completion = analytics.once('submission-1', 'tool_completed', {
  surface: 'shipping_calculator', tool_name: 'shipping_calculator', result_band: 'medium'
});
assert.ok(completion);
assert.strictEqual(analytics.once('submission-1', 'tool_completed', {
  surface: 'shipping_calculator', tool_name: 'shipping_calculator', result_band: 'medium'
}), null, 'the same action key must not emit twice');

assert.strictEqual(analytics.classifyPath('/blog/how-to-calculate-landed-cost/').surface, 'blog_post');
assert.strictEqual(analytics.sourceSlug('/blog/how-to-calculate-landed-cost/?x=1'), 'how-to-calculate-landed-cost');
assert.strictEqual(analytics.sourceSlug('/not-blog/'), null);
assert.deepStrictEqual(analytics.classifyBlogDestination('https://apps.shopify.com/stockclearance?utm_source=x'), { destination_type: 'shopify_app_store', app_name: 'stockclearance' });
assert.deepStrictEqual(analytics.classifyBlogDestination('/tools/access-checker/'), { destination_type: 'tool' });
assert.strictEqual(analytics.classifyBlogDestination('https://merchant.example/private'), null);

for (const relative of [
  'index.html', 'apps/index.html', 'apps/tariffshield/index.html', 'apps/stockclearance/index.html',
  'apps/shelflife/index.html', 'apps/accessshield/index.html', 'apps/storechangelog/index.html',
  'apps/warrantytracker/index.html', 'duty/index.html', 'shipping/index.html', 'tools/access-checker/index.html'
]) {
  const html = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  assert.ok(html.includes('/assets/analytics.js'), `${relative} must load the analytics contract`);
  const hasTransport = html.includes('googletagmanager.com') || html.includes('data-analytics-transport="disabled"');
  assert.ok(hasTransport, `${relative} must have gtag or explicitly mark transport disabled`);
}

for (const slug of fs.readdirSync(path.join(__dirname, '..', 'blog'))) {
  const file = path.join(__dirname, '..', 'blog', slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('/assets/analytics.js'), `blog/${slug} must load the analytics contract`);
  assert.ok(html.includes('googletagmanager.com') || html.includes('data-analytics-transport="disabled"'), `blog/${slug} must have gtag or explicitly disabled transport`);
}

console.log('analytics contract tests passed');
