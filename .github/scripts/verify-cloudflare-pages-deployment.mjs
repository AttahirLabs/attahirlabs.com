#!/usr/bin/env node

import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const ACCOUNT_ID_PATTERN = /^[0-9a-f]{32}$/;
const SAFE_PROJECT_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,56}[a-z0-9])?$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;
const EXPECTED_ACCOUNT_ID = '6f945ca08a01d636e0b02f37e859d4d5';
const EXPECTED_PROJECT_NAME = 'attahirlabs';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireExactString(value, expected, label) {
  if (value !== expected) {
    throw new Error(`${label} must equal ${JSON.stringify(expected)}`);
  }
  return value;
}

function requirePattern(value, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`${label} is malformed`);
  }
  return value;
}

function requirePositiveSafeInteger(value, label) {
  const text = String(value);
  if (!POSITIVE_INTEGER_PATTERN.test(text)) {
    throw new Error(`${label} must be a positive integer`);
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} exceeds the safe integer range`);
  }
  return parsed;
}

function validatePagesUrl(value, deploymentId, projectName) {
  if (typeof value !== 'string') {
    throw new Error('deployment url is missing');
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('deployment url is malformed');
  }
  const allowedHosts = new Set([
    `${deploymentId}.${projectName}.pages.dev`,
    `${deploymentId.slice(0, 8)}.${projectName}.pages.dev`,
  ]);
  if (
    parsed.protocol !== 'https:'
    || !allowedHosts.has(parsed.hostname)
    || parsed.username
    || parsed.password
    || parsed.port
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
  ) {
    throw new Error('deployment url must be a sanitized Cloudflare Pages URL');
  }
  return value;
}

function validateTimestamp(value) {
  const match = typeof value === 'string'
    ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?Z$/.exec(value)
    : null;
  if (!match) {
    throw new Error('deployment created_on is malformed');
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = ''] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const milliseconds = Number(fraction.slice(0, 3).padEnd(3, '0'));
  const instant = new Date(Date.UTC(year, month - 1, day, hour, minute, second, milliseconds));
  if (
    year < 2000
    || instant.getUTCFullYear() !== year
    || instant.getUTCMonth() !== month - 1
    || instant.getUTCDate() !== day
    || instant.getUTCHours() !== hour
    || instant.getUTCMinutes() !== minute
    || instant.getUTCSeconds() !== second
    || instant.getUTCMilliseconds() !== milliseconds
  ) {
    throw new Error('deployment created_on is not a real timestamp');
  }
  return value;
}

export function validateDeploymentList(payload, label = 'Cloudflare response') {
  const response = requireObject(payload, label);
  if (response.success !== true) {
    throw new Error(`${label} did not report success`);
  }
  if (!Array.isArray(response.result)) {
    throw new Error(`${label}.result must be an array`);
  }
  if (!Array.isArray(response.errors) || response.errors.length > 0) {
    throw new Error(`${label} contains API errors`);
  }

  const ids = new Set();
  for (const [index, rawDeployment] of response.result.entries()) {
    const deployment = requireObject(rawDeployment, `${label}.result[${index}]`);
    const id = requirePattern(deployment.id, UUID_PATTERN, `${label}.result[${index}].id`);
    if (ids.has(id)) {
      throw new Error(`${label} contains duplicate deployment id ${id}`);
    }
    ids.add(id);
    requireExactString(
      deployment.environment,
      'production',
      `${label}.result[${index}].environment`,
    );
  }
  return response.result;
}

export function validateLatestProductionDeployment(payload, expectedCommitSha) {
  const commitSha = requirePattern(expectedCommitSha, SHA_PATTERN, 'commit sha');
  const deployments = validateDeploymentList(payload, 'production response');
  if (deployments.length === 0) {
    throw new Error('production response contains no deployments');
  }

  const deployment = deployments[0];
  const latestStage = requireObject(deployment.latest_stage, 'deployment latest_stage');
  requireExactString(latestStage.name, 'deploy', 'deployment latest_stage.name');
  requireExactString(latestStage.status, 'success', 'deployment latest_stage.status');
  const trigger = requireObject(deployment.deployment_trigger, 'deployment trigger');
  const metadata = requireObject(trigger.metadata, 'deployment trigger metadata');
  requireExactString(metadata.branch, 'main', 'deployment branch');
  requireExactString(metadata.commit_hash, commitSha, 'deployment commit sha');
  return deployment;
}

export function buildDeploymentProof({ before, after, expected }) {
  const inputs = requireObject(expected, 'expected');
  const accountId = requirePattern(inputs.accountId, ACCOUNT_ID_PATTERN, 'account id');
  requireExactString(accountId, EXPECTED_ACCOUNT_ID, 'account id');
  const projectName = requirePattern(inputs.projectName, SAFE_PROJECT_PATTERN, 'project name');
  requireExactString(projectName, EXPECTED_PROJECT_NAME, 'project name');
  const commitSha = requirePattern(inputs.commitSha, SHA_PATTERN, 'commit sha');
  const sourceTreeSha = requirePattern(inputs.sourceTreeSha, SHA_PATTERN, 'source tree sha');
  const githubRunId = requirePositiveSafeInteger(inputs.githubRunId, 'GitHub run id');
  const githubRunAttempt = requirePositiveSafeInteger(inputs.githubRunAttempt, 'GitHub run attempt');

  const beforeDeployments = validateDeploymentList(before, 'before response');
  const afterDeployments = validateDeploymentList(after, 'after response');
  const beforeIds = new Set(beforeDeployments.map(({ id }) => id));
  const newlyObserved = afterDeployments.filter(({ id }) => !beforeIds.has(id));

  if (newlyObserved.length !== 1) {
    throw new Error(`expected exactly one new production deployment, observed ${newlyObserved.length}`);
  }

  const deployment = newlyObserved[0];
  if (afterDeployments[0]?.id !== deployment.id) {
    throw new Error('the new deployment is not the latest production deployment');
  }

  requirePattern(deployment.id, UUID_PATTERN, 'deployment id');
  const latestStage = requireObject(deployment.latest_stage, 'deployment latest_stage');
  requireExactString(latestStage.name, 'deploy', 'deployment latest_stage.name');
  requireExactString(latestStage.status, 'success', 'deployment latest_stage.status');
  const trigger = requireObject(deployment.deployment_trigger, 'deployment trigger');
  const metadata = requireObject(trigger.metadata, 'deployment trigger metadata');
  requireExactString(metadata.branch, 'main', 'deployment branch');
  requireExactString(metadata.commit_hash, commitSha, 'deployment commit sha');

  return {
    version: 1,
    kind: 'cloudflare-pages-production-deployment',
    accountId,
    projectName,
    environment: 'production',
    branch: 'main',
    status: 'success',
    commitSha,
    sourceTreeSha,
    githubRunId,
    githubRunAttempt,
    deploymentId: deployment.id,
    deploymentUrl: validatePagesUrl(deployment.url, deployment.id, projectName),
    deployedAt: validateTimestamp(deployment.created_on),
  };
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || value === undefined || value.startsWith('--')) {
      throw new Error(`invalid argument near ${flag ?? '<end>'}`);
    }
    if (values.has(flag)) {
      throw new Error(`duplicate argument ${flag}`);
    }
    values.set(flag, value);
  }
  return values;
}

async function readJson(path, label) {
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`could not read ${label}: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

async function writeJsonAtomically(path, value) {
  const target = resolve(path);
  const temporary = resolve(dirname(target), `.${target.split('/').pop()}.${process.pid}.tmp`);
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, target);
}

async function main(argv) {
  const args = parseArguments(argv);
  if (args.has('--latest')) {
    if (args.size !== 2 || !args.has('--commit-sha')) {
      throw new Error('--latest requires exactly --commit-sha');
    }
    const latest = await readJson(args.get('--latest'), 'latest production response');
    const deployment = validateLatestProductionDeployment(latest, args.get('--commit-sha'));
    process.stdout.write(`Verified latest production deployment ${deployment.id}.\n`);
    return;
  }
  if (args.has('--snapshot')) {
    if (args.size !== 1) {
      throw new Error('--snapshot cannot be combined with proof arguments');
    }
    const snapshot = await readJson(args.get('--snapshot'), 'deployment snapshot');
    const deployments = validateDeploymentList(snapshot, 'deployment snapshot');
    process.stdout.write(`Validated ${deployments.length} production deployment ids.\n`);
    return;
  }

  const required = [
    '--before',
    '--after',
    '--output',
    '--account-id',
    '--project-name',
    '--commit-sha',
    '--source-tree-sha',
    '--github-run-id',
    '--github-run-attempt',
  ];
  for (const flag of required) {
    if (!args.has(flag)) throw new Error(`missing required argument ${flag}`);
  }
  if (args.size !== required.length) {
    throw new Error('unknown proof argument');
  }

  const proof = buildDeploymentProof({
    before: await readJson(args.get('--before'), 'before response'),
    after: await readJson(args.get('--after'), 'after response'),
    expected: {
      accountId: args.get('--account-id'),
      projectName: args.get('--project-name'),
      commitSha: args.get('--commit-sha'),
      sourceTreeSha: args.get('--source-tree-sha'),
      githubRunId: args.get('--github-run-id'),
      githubRunAttempt: args.get('--github-run-attempt'),
    },
  });
  await writeJsonAtomically(args.get('--output'), proof);
  process.stdout.write(`Verified Cloudflare Pages deployment ${proof.deploymentId}.\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Cloudflare deployment verification failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
