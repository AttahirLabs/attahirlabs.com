#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const DEFAULT_ASSET_URL = 'https://attahirlabs.com/duty/calculator.js';
const EXPECTED_RELEASE = '2026.10.01+release4.5';
const EXPECTED_CALCULATION_PATH = '/api/v2/us-duty';
const LEGACY_CALCULATION_PATH = '/api/v1/landed-cost';

const EXPECTED_DECLARATION_CONTRACT = 'us-qsp-ordinary-general-rev20/v3';
const EXPECTED_AUTHORITY = Object.freeze({
  "rulesetVersion": "2026.10.01+release4.5",
  "rulesetPayloadHash": "1a83e4cc04e4ff5b42a87e8db3e0493277ac4f684dc89b0041dc579dae0c5feb",
  "releaseRecordHash": "fe51ed4b906c37c768f8fe560a5efd267b1126852acc6a67cb49c78b9ae5ed77",
  "resultContractVersion": "tariff.result-contract/v3",
  "scheduleRevision": "2026HTSRev20",
  "inputContract": "us-qsp-ordinary-general-rev20/v3",
  "evidenceAsOf": "2026-10-01T13:05:00Z",
  "evidenceValidThrough": "2026-10-08T13:05:00Z",
  "activeCoverageSliceIds": [
    "slice:release4:exact-qsp-rev20-ordinary-general"
  ]
});
// Signed Rev20 deployment smoke fixtures; local tests do not establish deployment.
// These declarations are owned diagnostic fixtures, not customer filing facts.
// Entry/review time lies inside source validity: Oct 1 13:05Z to Oct 8 13:05Z.
const QSP_INPUT = Object.freeze({
  calculationBasis: 'entry', origin: 'VN', manufacturingOrigin: 'VN',
  thirdCountryProcessing: 'none', certificationDisposition: 'not_required',
  brokerEntryReference: 'probe:this-entry-original-slab-processing-adcvd-review',
  adCvdStatus: 'not_subject', adCvdEvidenceRef: 'probe:this-entry-adcvd-review',
  entryTreatment: 'ordinary_general', qspProductStatus: 'subject_qsp',
  qspProductEvidenceRef: 'probe:this-entry-note41a-scope-and-subject-qsp-value',
  hts: '6810990020', customsValue: '1000.00', shippingCost: '50.00', insuranceCost: '10.00',
  mfnRate: '0', entryAt: '2026-10-03T12:00:00.000Z',
  qspHeading: '9903.45.30', qspQuotaStatus: 'allocated_in_quota',
  qspQuotaEvidenceRef: 'probe:this-entry-quota-allocation-review',
  qspQuotaReviewedAt: '2026-10-03T12:00:00.000Z',
  forcedLaborCountryHeading: '9903.05.84', forcedLaborExceptionHeading: 'NONE'
});
const OVER_QUOTA_INPUT = Object.freeze({ ...QSP_INPUT, qspHeading: '9903.45.31', qspQuotaStatus: 'confirmed_over_quota' });
const EXEMPT_INPUT = Object.freeze(Object.fromEntries(Object.entries({
  ...QSP_INPUT, origin: 'BR', manufacturingOrigin: 'BR', forcedLaborCountryHeading: '9903.05.27', brazilHeading: '9903.05.01'
}).filter(([key]) => !['qspHeading', 'qspQuotaStatus', 'qspQuotaEvidenceRef', 'qspQuotaReviewedAt'].includes(key))));
const MISSING_PRODUCT_INPUT = Object.freeze(Object.fromEntries(Object.entries(QSP_INPUT).filter(([key]) => key !== 'qspProductStatus')));
const CANADA_INPUT = Object.freeze({ ...QSP_INPUT, origin: 'CA', manufacturingOrigin: 'CA', forcedLaborCountryHeading: '9903.05.57' });

export function probeInputFingerprint(input) {
  return createHash('sha256').update(JSON.stringify({
    destination: 'US', basis: input.calculationBasis, origin: input.origin,
    manufacturingOrigin: input.manufacturingOrigin, thirdCountryProcessing: input.thirdCountryProcessing,
    certificationDisposition: input.certificationDisposition, brokerEntryReference: input.brokerEntryReference,
    adCvdStatus: input.adCvdStatus, adCvdEvidenceRef: input.adCvdEvidenceRef, entryTreatment: input.entryTreatment,
    qspProductStatus: input.qspProductStatus, qspProductEvidenceRef: input.qspProductEvidenceRef,
    hts: input.hts, entryAt: input.entryAt, customsValue: input.customsValue, mfnRate: input.mfnRate,
    forcedLaborCountryHeading: input.forcedLaborCountryHeading, forcedLaborExceptionHeading: input.forcedLaborExceptionHeading,
    brazilHeading: input.brazilHeading ?? null, qspHeading: input.qspHeading ?? null,
    qspQuotaStatus: input.qspQuotaStatus ?? null, qspQuotaEvidenceRef: input.qspQuotaEvidenceRef ?? null,
    qspQuotaReviewedAt: input.qspQuotaReviewedAt ?? null, shippingCost: input.shippingCost, insuranceCost: input.insuranceCost
  })).digest('hex');
}

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

  const declarationContract = exactSingleMatch(source, /const\s+DUTY_DECLARATION_CONTRACT\s*=\s*["']([^"']+)["']/g, 'declaration contract');
  if (declarationContract !== EXPECTED_DECLARATION_CONTRACT) throw new Error(`Unexpected public declaration contract: ${declarationContract}`);

  if (calculationPath !== EXPECTED_CALCULATION_PATH) {
    throw new Error(`Unexpected public calculation path: ${calculationPath}`);
  }
  if (releaseVersion !== EXPECTED_RELEASE) {
    throw new Error(`Unexpected public Release 4 version: ${releaseVersion}`);
  }

  for (const [constant, field] of [
    ['RELEASE4_PAYLOAD_HASH', 'rulesetPayloadHash'], ['RELEASE4_RECORD_HASH', 'releaseRecordHash'],
    ['RELEASE4_RESULT_CONTRACT', 'resultContractVersion'], ['RELEASE4_SCHEDULE', 'scheduleRevision'],
    ['RELEASE4_INPUT_CONTRACT', 'inputContract'], ['RELEASE4_EVIDENCE_AS_OF', 'evidenceAsOf'],
    ['RELEASE4_EVIDENCE_VALID_THROUGH', 'evidenceValidThrough'], ['RELEASE4_SLICE_ID', 'activeCoverageSliceIds']
  ]) {
    const value = exactSingleMatch(source, new RegExp(`const\\s+${constant}\\s*=\\s*["']([^"']+)["']`, 'g'), constant);
    const expected = field === 'activeCoverageSliceIds' ? EXPECTED_AUTHORITY[field][0] : EXPECTED_AUTHORITY[field];
    if (value !== expected) throw new Error(`Public asset signed identity mismatch: ${constant}`);
  }
  return { apiBase, calculationPath, releaseVersion, declarationContract };
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
  timeoutMs = 60_000,
  now = Date.now
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const requestOptions = { signal: AbortSignal.timeout(timeoutMs) };

  const assetResponse = await fetchImpl(assetUrl, requestOptions);
  if (!assetResponse.ok) {
    throw new Error(`Public calculator asset returned HTTP ${assetResponse.status}`);
  }
  const assetContract = inspectCalculatorAsset(await assetResponse.text());
  const evaluationAt = now();
  if (!Number.isFinite(evaluationAt) || evaluationAt < Date.parse(EXPECTED_AUTHORITY.evidenceAsOf) ||
      evaluationAt >= Date.parse(EXPECTED_AUTHORITY.evidenceValidThrough)) {
    throw new Error('Signed public authority is outside its evidence window');
  }

  const results = {};
  for (const [name, label, input, expected] of [
    ['qsp', 'QSP in-quota smoke', QSP_INPUT, ['37.500000', '375.00', '1435.00']],
    ['overQuota', 'QSP over-quota smoke', OVER_QUOTA_INPUT, ['62.500000', '625.00', '1685.00']],
    ['exempt', 'QSP exempt Brazil smoke', EXEMPT_INPUT, ['37.500000', '375.00', '1435.00']],
    ['missingProduct', 'Missing product scope', MISSING_PRODUCT_INPUT, 'QSP_PRODUCT_REVIEW_REQUIRED'],
    ['canada', 'Canada', CANADA_INPUT, 'UNSUPPORTED_ORIGIN_OR_DESTINATION']
  ]) {
    const response = await fetchImpl(buildUrl(assetContract.apiBase, assetContract.calculationPath, input), requestOptions);
    const body = await responseJson(response, label);
    if (typeof expected === 'string') {
      const numericKeys = numericResultKeys(body);
      if (numericKeys.length) throw new Error(`${label} response exposed a numeric calculation: ${numericKeys.join(', ')}`);
      if (response.status !== 422 || body.status !== 'indeterminate' || body.code !== expected) {
        throw new Error(`${label} containment mismatch: HTTP ${response.status}, status ${body.status}, code ${body.code}`);
      }
      results[name] = { httpStatus: response.status, status: body.status, code: body.code, numberFree: true };
      continue;
    }
    const summary = { httpStatus: response.status, status: body.status,
      totalRatePercent: body.calculation?.totalRatePercent,
      dutyAmount: body.calculation?.dutyAmount?.amount,
      estimatedSubtotal: body.calculation?.estimatedSubtotal?.amount };
    const required = { httpStatus: 200, status: 'calculated', totalRatePercent: expected[0], dutyAmount: expected[1], estimatedSubtotal: expected[2] };
    for (const [key, value] of Object.entries(required)) {
      if (summary[key] !== value) throw new Error(`${label} ${key} mismatch: expected ${value}, got ${summary[key]}`);
    }
    if (body.inputFingerprint !== probeInputFingerprint(input)) throw new Error(`${label} request fingerprint mismatch`);
    if (body.authority?.state !== 'active') throw new Error(`${label} authority state mismatch`);
    for (const [key, expected] of Object.entries(EXPECTED_AUTHORITY)) {
      if (JSON.stringify(body.authority?.[key]) !== JSON.stringify(expected)) throw new Error(`${label} signed authority ${key} mismatch`);
    }
    for (const key of ['dutyAmount', 'estimatedSubtotal']) {
      if (body.calculation[key]?.currency !== 'USD') throw new Error(`${label} ${key} currency mismatch`);
    }
    results[name] = summary;
  }
  return { ok: true, assetUrl, releaseVersion: assetContract.releaseVersion,
    declarationContract: assetContract.declarationContract, calculationPath: assetContract.calculationPath, ...results };

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
