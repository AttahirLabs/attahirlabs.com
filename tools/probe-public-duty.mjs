#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const DEFAULT_ASSET_URL = 'https://attahirlabs.com/duty/calculator.js';
const EXPECTED_RELEASE = '2026.08.24+release4.1';
const EXPECTED_CALCULATION_PATH = '/api/v2/us-duty';
const LEGACY_CALCULATION_PATH = '/api/v1/landed-cost';

const QSP_INPUT = Object.freeze({
  origin: 'CN',
  hts: '6810990020',
  customsValue: '1000.00',
  shippingCost: '50.00',
  insuranceCost: '10.00',
  mfnRate: '5',
  entryAt: '2026-08-20T12:20:00.000Z',
  qspHeading: '9903.45.30',
  forcedLaborCountryHeading: '9903.05.31',
  forcedLaborExceptionHeading: 'NONE'
});

const CANADA_INPUT = Object.freeze({
  origin: 'CA',
  hts: '6810990020',
  customsValue: '1000.00',
  shippingCost: '50.00',
  insuranceCost: '10.00',
  mfnRate: '5',
  entryAt: '2026-08-20T12:20:00.000Z',
  qspHeading: '9903.45.30',
  forcedLaborCountryHeading: '9903.05.57',
  forcedLaborExceptionHeading: 'NONE'
});

function exactSingleMatch(source, pattern, label) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${label}; found ${matches.length}`);
  }
  return matches[0][1];
}

export function inspectCalculatorAsset(source) {
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error('Public calculator asset is empty');
  }
  if (source.includes(LEGACY_CALCULATION_PATH)) {
    throw new Error(`Public calculator asset references legacy ${LEGACY_CALCULATION_PATH}`);
  }

  const apiBase = exactSingleMatch(
    source,
    /const\s+DUTY_API\s*=\s*["'](https:\/\/[^"']+)["']/g,
    'DUTY_API constant'
  );
  const calculationPath = exactSingleMatch(
    source,
    /fetch\(DUTY_API\s*\+\s*["'](\/api\/v\d+\/[^?"']+)\?/g,
    'calculation fetch path'
  );
  const releaseVersion = exactSingleMatch(
    source,
    /const\s+RELEASE4_VERSION\s*=\s*["']([^"']+)["']/g,
    'Release 4 version'
  );

  if (calculationPath !== EXPECTED_CALCULATION_PATH) {
    throw new Error(`Unexpected public calculation path: ${calculationPath}`);
  }
  if (releaseVersion !== EXPECTED_RELEASE) {
    throw new Error(`Unexpected public Release 4 version: ${releaseVersion}`);
  }

  return { apiBase, calculationPath, releaseVersion };
}

function buildUrl(apiBase, calculationPath, params) {
  const url = new URL(calculationPath, apiBase);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function responseJson(response, label) {
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} did not return JSON`);
  }
}

function numericResultKeys(value, path = []) {
  if (!value || typeof value !== 'object') return [];
  const found = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];
    if (/^(?:calculation|totalRatePercent|ratePercent|dutyRatePercent|dutyAmount|estimatedSubtotal|totalLandedCost|amount)$/i.test(key)) {
      found.push(childPath.join('.'));
    }
    found.push(...numericResultKeys(child, childPath));
  }
  return found;
}

export async function runPublicDutyProbe({
  fetchImpl = globalThis.fetch,
  assetUrl = DEFAULT_ASSET_URL,
  timeoutMs = 60_000
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const requestOptions = { signal: AbortSignal.timeout(timeoutMs) };

  const assetResponse = await fetchImpl(assetUrl, requestOptions);
  if (!assetResponse.ok) {
    throw new Error(`Public calculator asset returned HTTP ${assetResponse.status}`);
  }
  const assetContract = inspectCalculatorAsset(await assetResponse.text());

  const qspResponse = await fetchImpl(
    buildUrl(assetContract.apiBase, assetContract.calculationPath, QSP_INPUT),
    requestOptions
  );
  const qspBody = await responseJson(qspResponse, 'QSP smoke');
  const qsp = {
    httpStatus: qspResponse.status,
    status: qspBody.status,
    totalRatePercent: qspBody.calculation?.totalRatePercent,
    dutyAmount: qspBody.calculation?.dutyAmount?.amount,
    estimatedSubtotal: qspBody.calculation?.estimatedSubtotal?.amount
  };
  const expectedQsp = {
    httpStatus: 200,
    status: 'calculated',
    totalRatePercent: '42.500000',
    dutyAmount: '425.00',
    estimatedSubtotal: '1485.00'
  };
  for (const [key, expected] of Object.entries(expectedQsp)) {
    if (qsp[key] !== expected) {
      throw new Error(`QSP smoke ${key} mismatch: expected ${expected}, got ${qsp[key]}`);
    }
  }

  const canadaResponse = await fetchImpl(
    buildUrl(assetContract.apiBase, assetContract.calculationPath, CANADA_INPUT),
    requestOptions
  );
  const canadaBody = await responseJson(canadaResponse, 'Canada containment smoke');
  const exposedNumericKeys = numericResultKeys(canadaBody);
  if (exposedNumericKeys.length > 0) {
    throw new Error(`Canada response exposed a numeric calculation: ${exposedNumericKeys.join(', ')}`);
  }
  if (
    canadaResponse.status !== 422 ||
    canadaBody.status !== 'indeterminate' ||
    canadaBody.code !== 'NO_ACTIVE_COVERAGE_MATCH'
  ) {
    throw new Error(
      `Canada containment mismatch: HTTP ${canadaResponse.status}, status ${canadaBody.status}, code ${canadaBody.code}`
    );
  }

  return {
    ok: true,
    assetUrl,
    releaseVersion: assetContract.releaseVersion,
    calculationPath: assetContract.calculationPath,
    qsp,
    canada: {
      httpStatus: canadaResponse.status,
      status: canadaBody.status,
      code: canadaBody.code,
      numberFree: true
    }
  };
}

async function main() {
  try {
    console.log(JSON.stringify(await runPublicDutyProbe(), null, 2));
  } catch (error) {
    console.error(`Public duty probe failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
