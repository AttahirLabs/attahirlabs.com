const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/test.yml'), 'utf8');
const runnerPath = path.join(__dirname, 'run-all-tests.js');

assert.ok(fs.existsSync(runnerPath), 'CI must use the deterministic test-discovery runner');
const { discoverTests } = require(runnerPath);
const discovered = discoverTests().map((file) => path.basename(file));
const expected = fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.test.js'))
  .sort((left, right) => left.localeCompare(right));

assert.deepEqual(discovered, expected, 'the runner must discover every sorted tests/*.test.js file');
for (const required of [
  'analytics-contract.test.js',
  'canada-surtax-refresh.test.js',
  'ci-test-discovery.test.js',
  'tariff-reliability.test.js',
  'website-guardrails.test.js'
]) {
  assert.ok(discovered.includes(required), `${required} must be in CI discovery`);
}

assert.match(workflow, /runs-on:\s*ubuntu-24\.04/);
assert.match(workflow, /permissions:\s*\n\s+contents:\s+read/);
assert.match(workflow, /uses:\s*actions\/checkout@[a-f0-9]{40}\s*$/m);
assert.match(workflow, /uses:\s*actions\/setup-node@[a-f0-9]{40}\s*$/m);
assert.match(workflow, /fetch-depth:\s*0/);
assert.match(workflow, /node tests\/run-all-tests\.js/);
assert.doesNotMatch(
  workflow,
  /^\s*node\s+tests\/[^ \n]+\.test\.js\s*$/m,
  'the workflow must not maintain a drift-prone explicit test list'
);
assert.match(workflow, /git diff --check/);

console.log(`CI discovery contract passed for ${discovered.length} sorted site tests`);
