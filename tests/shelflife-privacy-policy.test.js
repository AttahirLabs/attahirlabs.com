const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const policy = fs.readFileSync(
  path.join(__dirname, '..', 'privacy.html'),
  'utf8'
);
const text = policy
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&rsquo;|&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

assert.match(
  text,
  /ShelfLife Batch and Expiry Data:[\s\S]*batch\/lot number[\s\S]*supplier[\s\S]*unit cost[\s\S]*location[\s\S]*expiry and manufacture dates[\s\S]*quantity[\s\S]*notes/i,
  'the policy must enumerate ShelfLife merchant-entered batch and expiry data'
);
assert.match(
  text,
  /ShelfLife Settings and Operational Records:[\s\S]*alert email[\s\S]*automation[\s\S]*metafield[\s\S]*scan[\s\S]*delivery[\s\S]*effect/i,
  'the policy must disclose ShelfLife settings and durable operational/effect records'
);
assert.match(
  text,
  /Optional Shopify Metafield Copies:[\s\S]*earliest active expiry date[\s\S]*location and quantity summary[\s\S]*off by default/i,
  'the policy must explain ShelfLife’s optional Shopify-hosted display copies'
);
assert.match(
  text,
  /Resend \(ShelfLife Email and Feedback\):[\s\S]*recipient email[\s\S]*shop domain[\s\S]*product title[\s\S]*batch\/lot number[\s\S]*expiry date[\s\S]*status[\s\S]*days remaining[\s\S]*feedback category[\s\S]*optional contact email[\s\S]*message/i,
  'the policy must truthfully disclose the ShelfLife payloads sent to Resend'
);
assert.match(
  text,
  /Google Analytics 4 \(Optional ShelfLife Server-Side Analytics\):[\s\S]*route and lifecycle events[\s\S]*pseudonymous SHA-256-derived shop identifier[\s\S]*raw shop domain/i,
  'the policy must disclose optional ShelfLife GA4 events and pseudonymous identity'
);
assert.match(
  text,
  /Shopify Billing and Managed Pricing/i,
  'billing must be attributed to Shopify Billing and Managed Pricing'
);
assert.doesNotMatch(
  text,
  /Shopify Payments/,
  'the policy must not misidentify app subscription billing as Shopify Payments'
);
assert.match(
  text,
  /ShelfLife Deletion Boundary:[\s\S]*uninstall[\s\S]*SHOP_REDACT[\s\S]*raw shop domain[\s\S]*opaque HMAC[\s\S]*replay[\s\S]*seven-day expiry[\s\S]*scheduled maintenance[\s\S]*backlog may delay physical deletion/i,
  'the policy must disclose ShelfLife’s raw-data deletion and opaque anti-replay retention boundary'
);
assert.doesNotMatch(
  text,
  /webhook receipts[\s\S]{0,240}up to seven days/i,
  'the policy must not promise an impossible wall-clock deletion maximum'
);
assert.doesNotMatch(
  text,
  /\bFIFO\b/,
  'the policy must use FEFO for ShelfLife expiry-first fulfillment preferences'
);

console.log('ShelfLife privacy policy disclosure tests passed');
