const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(root, '.github', 'workflows', 'notify-search-engines.yml'),
  'utf8'
);
const changedFilesScript = path.join(root, 'tools', 'search-changed-files.sh');

assert.match(workflow, /curl --fail-with-body --silent --show-error --retry 3/);
assert.match(workflow, /https:\/\/api\.indexnow\.org\/indexnow/);
assert.match(workflow, /IndexNow accepted the submission/);
assert.doesNotMatch(workflow, /google\.com\/ping/);
assert.doesNotMatch(workflow, /bing\.com\/ping\?sitemap/);
assert.doesNotMatch(workflow, /curl -s(?:\s|$)/);
assert.match(workflow, /fetch-depth:\s*0/);
assert.match(workflow, /environment:\s*\n\s+name:\s*cloudflare-pages-production/);
assert.match(workflow, /CLOUDFLARE_PAGES_API_TOKEN:\s*\$\{\{\s*secrets\.CLOUDFLARE_PAGES_API_TOKEN\s*\}\}/);
assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID:\s*\$\{\{\s*vars\.CLOUDFLARE_ACCOUNT_ID\s*\}\}/);
assert.match(workflow, /pages\/projects\/attahirlabs\/deployments\?env=production/);
assert.doesNotMatch(workflow, /per_page=/, 'search gating must use the Cloudflare API-supported default page size');
assert.match(workflow, /verify-cloudflare-pages-deployment\.mjs[\s\S]*--latest[\s\S]*--commit-sha "\$GITHUB_SHA"/);
assert.match(workflow, /test "\$GITHUB_REF" = "refs\/heads\/main"/);
assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/);
assert.ok(
  workflow.indexOf('Wait for the exact production deployment') < workflow.indexOf('Verify public sitemap'),
  'IndexNow must wait for the exact Cloudflare production commit before reading or notifying URLs',
);
assert.match(workflow, /github\.event\.before/);
assert.match(workflow, /github\.sha/);
assert.match(workflow, /bash tools\/search-changed-files\.sh/);
assert.doesNotMatch(workflow, /HEAD~1/);
assert.doesNotMatch(
  workflow,
  /search-changed-files[^\n]*(?:\|\|\s*(?:echo|true)|2>\/dev\/null)/,
  'changed-file discovery must not hide a git diff failure'
);

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function write(relativeRoot, relative, content) {
  const target = path.join(relativeRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'attahirlabs-search-range-'));
git(fixture, ['init', '-q']);
git(fixture, ['config', 'user.name', 'Search Test']);
git(fixture, ['config', 'user.email', 'search-test@example.invalid']);
write(fixture, 'README.md', 'base\n');
git(fixture, ['add', '--', 'README.md']);
git(fixture, ['commit', '-qm', 'base']);
const before = git(fixture, ['rev-parse', 'HEAD']);

write(fixture, 'blog/earlier-push/index.html', '<h1>Earlier push article</h1>\n');
git(fixture, ['add', '--', 'blog/earlier-push/index.html']);
git(fixture, ['commit', '-qm', 'indexable earlier commit']);
write(fixture, 'README.md', 'later non-indexable change\n');
git(fixture, ['add', '--', 'README.md']);
git(fixture, ['commit', '-qm', 'later commit']);
const after = git(fixture, ['rev-parse', 'HEAD']);

const multiCommit = spawnSync('bash', [changedFilesScript, before, after], { cwd: fixture, encoding: 'utf8' });
assert.equal(multiCommit.status, 0, multiCommit.stderr);
assert.deepEqual(multiCommit.stdout.trim().split('\n').sort(), ['README.md', 'blog/earlier-push/index.html']);

const initialPush = spawnSync('bash', [changedFilesScript, '0'.repeat(40), after], { cwd: fixture, encoding: 'utf8' });
assert.equal(initialPush.status, 0, initialPush.stderr);
assert.deepEqual(initialPush.stdout.trim().split('\n').sort(), ['README.md', 'blog/earlier-push/index.html']);

const missingBefore = spawnSync('bash', [changedFilesScript, 'f'.repeat(40), after], { cwd: fixture, encoding: 'utf8' });
assert.notEqual(missingBefore.status, 0, 'a missing before commit must fail closed');

const noRepository = fs.mkdtempSync(path.join(os.tmpdir(), 'attahirlabs-search-no-repo-'));
const gitFailure = spawnSync('bash', [changedFilesScript, before, after], { cwd: noRepository, encoding: 'utf8' });
assert.notEqual(gitFailure.status, 0, 'a git command failure must exit nonzero');

console.log('search-notification-workflow.test.js passed');
