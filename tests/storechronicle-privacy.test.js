const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
const product = fs.readFileSync(path.join(root, 'apps/storechronicle/index.html'), 'utf8');
const section = privacy.match(/<section aria-labelledby="storechronicle">([\s\S]*?)<\/section>/)?.[1];
assert.ok(section, 'StoreChronicle must have its own scoped privacy disclosure');
assert.match(privacy, /href="#storechronicle"/);
assert.match(product, /href="\/privacy\.html#storechronicle"/);
for (const phrase of ['pre-release testing', 'free-text', '7 days', '90 days', 'no automatic age-based expiry',
  'up to 30 days', '6 days', '27 days', 'manual recovery points', 'explicit opt-in',
  'provider and recipient copies', 'not proof that an entire privacy request is complete']) {
  assert.ok(section.includes(phrase), `Missing scoped disclosure: ${phrase}`);
}
assert.doesNotMatch(section, /all (?:data|copies|backups).*?(?:27|30) days/i);
assert.match(section, /does not extend a privacy-deletion deadline/);
assert.match(section, /support@attahirlabs\.com/);
assert.doesNotMatch(section, /delivery remains disabled|manual recovery points are being reconciled/);
for (const phrase of ['resend.com/security/gdpr', 'United States', 'Free, Pro and Scale',
  '7-day backups', 'earlier message removal', '30 days of receipt', 'request identifier',
  'Slack or Discord workspace', 'not automatically removed']) {
  assert.ok(section.includes(phrase), `Missing operational disclosure: ${phrase}`);
}
assert.match(privacy, /<script src="\/assets\/analytics\.js"><\/script>/);
assert.match(privacy, /href="\/analytics-preferences\/"/);
assert.doesNotMatch(privacy, /Only your alert email address/);
for (const id of ['stockclearance', 'tariffshield', 'shelflife', 'retention', 'analytics']) {
  assert.ok(privacy.includes(`id="${id}"`), `Unrelated privacy section lost: ${id}`);
}
console.log('StoreChronicle scoped privacy disclosure and shared-policy preservation passed.');
