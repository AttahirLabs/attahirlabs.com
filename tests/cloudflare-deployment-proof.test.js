const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const commitSha = 'a'.repeat(40);
const sourceTreeSha = 'b'.repeat(40);
const oldId = '11111111-1111-4111-8111-111111111111';
const deploymentId = '22222222-2222-4222-8222-222222222222';

const oldDeployment = {
  id: oldId,
  url: 'https://11111111.attahirlabs.pages.dev',
  environment: 'production',
  created_on: '2026-08-29T16:00:00.000Z',
  latest_stage: { name: 'deploy', status: 'success' },
  deployment_trigger: {
    metadata: { branch: 'main', commit_hash: 'c'.repeat(40) },
  },
};

const newDeployment = {
  id: deploymentId,
  url: 'https://22222222.attahirlabs.pages.dev',
  environment: 'production',
  created_on: '2026-08-29T17:00:00.000Z',
  latest_stage: { name: 'deploy', status: 'success' },
  deployment_trigger: {
    metadata: { branch: 'main', commit_hash: commitSha },
  },
};

const response = (result) => ({ success: true, errors: [], messages: [], result });
const expected = {
  accountId: '6f945ca08a01d636e0b02f37e859d4d5',
  projectName: 'attahirlabs',
  commitSha,
  sourceTreeSha,
  githubRunId: '33270000000',
  githubRunAttempt: '1',
};

(async () => {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../.github/scripts/verify-cloudflare-pages-deployment.mjs'),
  ).href;
  const { buildDeploymentProof } = await import(moduleUrl);

  const proof = buildDeploymentProof({
    before: response([oldDeployment]),
    after: response([newDeployment, oldDeployment]),
    expected,
  });

  assert.deepEqual(proof, {
    version: 1,
    kind: 'cloudflare-pages-production-deployment',
    accountId: expected.accountId,
    projectName: 'attahirlabs',
    environment: 'production',
    branch: 'main',
    status: 'success',
    commitSha,
    sourceTreeSha,
    githubRunId: 33270000000,
    githubRunAttempt: 1,
    deploymentId,
    deploymentUrl: newDeployment.url,
    deployedAt: newDeployment.created_on,
  });

  const rejects = (label, mutate) => {
    const fixture = structuredClone({
      before: response([oldDeployment]),
      after: response([newDeployment, oldDeployment]),
      expected,
    });
    mutate(fixture);
    assert.throws(
      () => buildDeploymentProof(fixture),
      Error,
      label,
    );
  };

  rejects('failed API response', (fixture) => {
    fixture.after.success = false;
    fixture.after.errors = [{ code: 10000, message: 'authentication error' }];
  });
  rejects('missing result array', (fixture) => { delete fixture.after.result; });
  rejects('stale deployment', (fixture) => { fixture.after.result = [oldDeployment]; });
  rejects('ambiguous new deployments', (fixture) => {
    const extra = structuredClone(newDeployment);
    extra.id = '33333333-3333-4333-8333-333333333333';
    fixture.after.result.unshift(extra);
  });
  rejects('new deployment is not latest', (fixture) => {
    fixture.after.result = [oldDeployment, newDeployment];
  });
  rejects('preview environment', (fixture) => {
    fixture.after.result[0].environment = 'preview';
  });
  rejects('wrong branch', (fixture) => {
    fixture.after.result[0].deployment_trigger.metadata.branch = 'feature/not-main';
  });
  rejects('wrong commit SHA', (fixture) => {
    fixture.after.result[0].deployment_trigger.metadata.commit_hash = 'd'.repeat(40);
  });
  rejects('non-success status', (fixture) => {
    fixture.after.result[0].latest_stage.status = 'failure';
  });
  rejects('missing deployment URL', (fixture) => { delete fixture.after.result[0].url; });
  rejects('non-Pages deployment URL', (fixture) => {
    fixture.after.result[0].url = 'https://example.com/not-cloudflare';
  });
  rejects('malformed deployment ID', (fixture) => { fixture.after.result[0].id = 'not-a-uuid'; });
  rejects('malformed source tree', (fixture) => { fixture.expected.sourceTreeSha = 'short'; });
  rejects('malformed run ID', (fixture) => { fixture.expected.githubRunId = 'not-numeric'; });

  console.log('Cloudflare Pages deployment proof fixtures passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
