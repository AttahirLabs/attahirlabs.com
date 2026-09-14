const fs = require('node:fs');
const result = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const binding = result.result?.deployment_configs?.production?.d1_databases?.RELEASE_SIGNUPS;
if (result.success !== true || !binding?.id) {
  throw new Error('Production RELEASE_SIGNUPS D1 binding is missing. Complete .github/signups/README.md before release.');
}
console.log('Production signup database binding is configured.');
