const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function discoverTests(directory = __dirname) {
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.test.js'))
    .sort((left, right) => left.localeCompare(right))
    .map((file) => path.join(directory, file));
}

function runAllTests() {
  const tests = discoverTests();
  if (tests.length === 0) {
    throw new Error('No tests/*.test.js files were discovered');
  }

  for (const test of tests) {
    const relative = path.relative(process.cwd(), test);
    console.log(`\n==> ${relative}`);
    const result = spawnSync(process.execPath, [test], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

module.exports = { discoverTests, runAllTests };

if (require.main === module) runAllTests();
