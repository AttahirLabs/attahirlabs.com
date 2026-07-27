const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'apps/shelflife/index.html'), 'utf8');
const iconUrl = '/assets/icons/shelflife-countdown-shelves-512.png';
const absoluteIconUrl = `https://attahirlabs.com${iconUrl}`;
const iconPath = path.join(root, iconUrl.slice(1));

assert.ok(fs.existsSync(iconPath), 'ShelfLife should ship the selected Countdown Shelves web icon');

const icon = fs.readFileSync(iconPath);
assert.equal(
  crypto.createHash('sha256').update(icon).digest('hex'),
  '356026fd2ffcf39074b687212e573cbce8b9be7e29da788f763b3c654d87c7ff',
  'ShelfLife web icon should remain byte-for-byte pinned to the selected derivative'
);
assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'ShelfLife icon should be a PNG');
assert.equal(icon.readUInt32BE(16), 512, 'ShelfLife web icon should be 512 pixels wide');
assert.equal(icon.readUInt32BE(20), 512, 'ShelfLife web icon should be 512 pixels tall');
assert.ok(icon.byteLength < 500 * 1024, 'ShelfLife web icon should remain below 500 KiB');

assert.match(
  page,
  new RegExp(`<img[^>]+class="shelflife-hero-icon"[^>]+src="${iconUrl}"[^>]+alt="ShelfLife app icon showing product shelves inside a countdown ring"[^>]*>`),
  'ShelfLife hero should visibly reference the selected icon with useful alternative text'
);
assert.ok(
  page.includes(`<meta property="og:image" content="${absoluteIconUrl}">`),
  'ShelfLife Open Graph preview should use the selected icon'
);
assert.ok(
  page.includes(`<meta name="twitter:image" content="${absoluteIconUrl}">`),
  'ShelfLife Twitter preview should use the selected icon'
);
assert.ok(page.includes('App Store listing in preparation'), 'ShelfLife should preserve its draft listing status');
assert.ok(!page.includes('apps.shopify.com/shelflife'), 'ShelfLife should not imply public installability');

console.log('ShelfLife icon tests passed');
