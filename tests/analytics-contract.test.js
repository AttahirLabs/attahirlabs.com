const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const analyticsModule = require('../assets/analytics.js');

const sent = [];
const analytics = analyticsModule.createAnalytics({
  transport: (name, params) => sent.push({ name, params })
});

assert.deepEqual(
  analytics.emit('tool_completed', {
    surface: 'duty_calculator',
    tool_name: 'duty_calculator',
    result_band: 'high',
    harmless_unknown: 'dropped'
  }),
  {
    name: 'tool_completed',
    params: {
      surface: 'duty_calculator',
      tool_name: 'duty_calculator',
      result_band: 'high'
    }
  },
  'unknown keys must never enter the analytics payload'
);

for (const prohibited of [
  { scanned_url: 'https://merchant.example/private' },
  { raw_query_string: '?productValue=1000' },
  { product_value: 1000 },
  { issue_text: 'missing accessible name' },
  { email: 'merchant@example.com' }
]) {
  assert.equal(
    analytics.emit('tool_started', {
      surface: 'duty_calculator',
      tool_name: 'duty_calculator',
      ...prohibited
    }),
    null,
    `prohibited parameter ${Object.keys(prohibited)[0]} must fail closed`
  );
}

assert.deepEqual(
  analytics.emit('contact_intent', {
    surface: 'shipping_calculator',
    placement: 'result_cta'
  }),
  {
    name: 'contact_intent',
    params: {
      surface: 'shipping_calculator',
      placement: 'result_cta'
    }
  },
  'app_name is optional when a contact CTA is not tied to a launched app'
);

assert.deepEqual(
  analytics.emit('tool_to_app_referral', {
    surface: 'duty_calculator',
    placement: 'nav',
    tool_name: 'duty_calculator',
    app_name: 'tariffshield'
  }),
  {
    name: 'tool_to_app_referral',
    params: {
      surface: 'duty_calculator',
      placement: 'nav',
      tool_name: 'duty_calculator',
      app_name: 'tariffshield'
    }
  }
);

const beforeOnce = sent.length;
assert.ok(analytics.once('shipping:1:outcome', 'tool_completed', {
  surface: 'shipping_calculator',
  tool_name: 'shipping_calculator',
  result_band: 'medium'
}));
assert.equal(analytics.once('shipping:1:outcome', 'tool_failed', {
  surface: 'shipping_calculator',
  tool_name: 'shipping_calculator',
  error_code: 'unknown'
}), null, 'one action may have only one terminal outcome');
assert.equal(sent.length, beforeOnce + 1);

const disabled = analyticsModule.createAnalytics({ transport: null });
assert.doesNotThrow(() => disabled.emit('surface_viewed', {
  surface: 'shipping_calculator',
  surface_group: 'tool'
}));

assert.equal(analyticsModule.dutyResultBand('5%'), 'low');
assert.equal(analyticsModule.dutyResultBand('15%'), 'medium');
assert.equal(analyticsModule.dutyResultBand('30%'), 'high');
assert.equal(analyticsModule.dutyResultBand('31%'), 'very_high');
assert.equal(analyticsModule.dutyResultBand('n/a'), 'not_available');
assert.equal(analyticsModule.shippingResultBand(20), 'low');
assert.equal(analyticsModule.shippingResultBand(50), 'medium');
assert.equal(analyticsModule.shippingResultBand(51), 'high');
assert.equal(analyticsModule.shippingResultBand(Number.NaN), 'not_available');

const read = (relative) => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const duty = read('duty/index.html');
const shipping = read('shipping/index.html');
const handoff = read('tools/access-checker/index.html');
const analyticsSource = read('assets/analytics.js');

assert.doesNotMatch(
  analyticsSource,
  /location\.(?:href|search)|document\.referrer|URLSearchParams/,
  'raw location, query-string, and referrer values must never be read for analytics'
);

for (const [name, html] of [['DutyCalc', duty], ['ShippingCalc', shipping]]) {
  assert.match(html, /<script src="\/assets\/analytics\.js"><\/script>/, `${name} must load the shared contract`);
  assert.match(html, /tool_started/);
  assert.match(html, /tool_completed/);
  assert.match(html, /tool_failed/);
}

assert.match(duty, /data-analytics-event="tool_to_app_referral"[\s\S]*?data-analytics-app-name="tariffshield"/);
assert.match(duty, /data-analytics-event="cta_clicked"[\s\S]*?data-analytics-destination-type="blog"/);
assert.match(duty, /href="\/apps\/tariffshield\/" data-analytics-event="tool_to_app_referral"/);
assert.match(shipping, /data-analytics-event="contact_intent"[\s\S]*?data-analytics-placement="result_cta"/);
assert.match(handoff, /data-analytics-transport="disabled"/);

for (const html of [duty, shipping]) {
  const calls = html.split('\n').filter((line) => line.includes('AttahirAnalytics'));
  for (const call of calls) {
    assert.doesNotMatch(
      call,
      /origin|destination|productValue|shippingCost|insuranceCost|orderValue|postal|weight|length|width|height|raw_query|referrer|free.?text/i,
      `analytics call must contain stable enums only: ${call.trim()}`
    );
  }
}

console.log('privacy-safe free-tool analytics contract tests passed');
