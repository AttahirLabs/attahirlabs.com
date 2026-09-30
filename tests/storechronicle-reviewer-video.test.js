const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const videoPath = path.join(__dirname, '..', 'assets', 'storechronicle-reviewer-walkthrough.mp4');
assert.ok(fs.existsSync(videoPath), 'The listing reviewer video must be included in the deployable site');
const video = fs.readFileSync(videoPath);
assert.ok(video.length > 100_000, 'The reviewer video must not be an empty placeholder');
assert.equal(video.toString('ascii', 4, 8), 'ftyp', 'The reviewer video must be an MP4');

console.log('StoreChronicle reviewer video asset present');
