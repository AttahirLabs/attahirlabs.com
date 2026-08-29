const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github/workflows/deploy-pages.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, '.github/cloudflare-pages/package.json'), 'utf8'),
);
const packageLock = JSON.parse(
  fs.readFileSync(path.join(root, '.github/cloudflare-pages/package-lock.json'), 'utf8'),
);

assert.match(workflow, /^name:\s*Deploy Cloudflare Pages\s*$/m);
assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /permissions:\s*\n\s+contents:\s+read/);
assert.doesNotMatch(workflow, /pages:\s*write|id-token:\s*write/);
assert.match(workflow, /environment:\s*\n\s+name:\s*cloudflare-pages-production/);

assert.match(workflow, /uses:\s*actions\/checkout@[a-f0-9]{40}\s*$/m);
assert.match(workflow, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
assert.match(workflow, /uses:\s*actions\/setup-node@[a-f0-9]{40}\s*$/m);
assert.match(workflow, /uses:\s*actions\/upload-artifact@[a-f0-9]{40}\s*$/m);
assert.doesNotMatch(workflow, /cloudflare\/wrangler-action@/);

assert.match(workflow, /api\.cloudflare\.com\/client\/v4\/accounts\/\$CLOUDFLARE_ACCOUNT_ID\/pages\/projects\/attahirlabs\/deployments\?env=production/);
assert.doesNotMatch(workflow, /per_page=/, 'Cloudflare Pages deployment inventory must use the API-supported default page size');
assert.match(workflow, /Authorization: Bearer \$CLOUDFLARE_PAGES_API_TOKEN/);
assert.match(workflow, /working-directory:\s*\.github\/cloudflare-pages/);
assert.match(workflow, /run:\s*npm ci --ignore-scripts/);
assert.match(workflow, /\.github\/cloudflare-pages\/node_modules\/\.bin\/wrangler pages deploy _site/);
assert.match(workflow, /--project-name=attahirlabs/);
assert.match(workflow, /--branch=main/);
assert.match(workflow, /--commit-hash="\$GITHUB_SHA"/);
assert.match(workflow, /--commit-dirty=false/);

assert.match(workflow, /test "\$GITHUB_REPOSITORY" = "AttahirLabs\/attahirlabs\.com"/);
assert.match(workflow, /test "\$GITHUB_REF" = "refs\/heads\/main"/);
assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/);
assert.match(workflow, /git rev-parse 'HEAD\^\{tree\}'/);
assert.match(workflow, /test -z "\$\(git status --porcelain=v1 --untracked-files=all\)"/);
assert.match(workflow, /test "\$\{#GITHUB_SHA\}" -eq 40/);
assert.match(workflow, /test "\$\{#source_tree_sha\}" -eq 40/);

assert.match(workflow, /node \.github\/scripts\/verify-cloudflare-pages-deployment\.mjs/);
assert.match(workflow, /--before "\$RUNNER_TEMP\/cloudflare-pages-before\.json"/);
assert.match(workflow, /--after "\$RUNNER_TEMP\/cloudflare-pages-after\.json"/);
assert.match(workflow, /--output "\$RUNNER_TEMP\/cloudflare-pages-deployment-proof\.json"/);
assert.match(workflow, /name:\s*cloudflare-pages-deployment-proof/);
assert.match(workflow, /path:\s*\$\{\{\s*runner\.temp\s*\}\}\/cloudflare-pages-deployment-proof\.json/);
assert.match(workflow, /if-no-files-found:\s*error/);

const beforeSnapshot = workflow.indexOf('cloudflare-pages-before.json');
const deployCommand = workflow.indexOf('pages deploy _site');
const afterSnapshot = workflow.indexOf('cloudflare-pages-after.json');
const verifier = workflow.indexOf('verify-cloudflare-pages-deployment.mjs', afterSnapshot);
const upload = workflow.indexOf('- name: Upload sanitized deployment proof');
assert.ok(beforeSnapshot >= 0 && beforeSnapshot < deployCommand, 'production IDs must be snapshotted before upload');
assert.ok(deployCommand < afterSnapshot, 'production must be queried after upload');
assert.ok(afterSnapshot < verifier, 'post-deploy evidence must be captured before verification');
assert.ok(verifier < upload, 'proof must be verified before it is uploaded');

assert.equal(packageJson.private, true);
assert.equal(packageJson.dependencies.wrangler, '4.127.1', 'Wrangler must be pinned exactly');
assert.equal(packageLock.lockfileVersion, 3);
assert.equal(packageLock.packages[''].dependencies.wrangler, '4.127.1');

for (const excluded of ['.git', '.github', 'tests', '_site']) {
  assert.ok(workflow.includes(`--exclude '${excluded}'`), `${excluded} must be excluded from the artifact`);
}
assert.doesNotMatch(workflow, /actions\/(?:configure-pages|upload-pages-artifact|deploy-pages)@/);

console.log('Cloudflare Pages deployment workflow contract passed');
