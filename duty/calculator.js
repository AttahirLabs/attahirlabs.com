const DUTY_API = "https://duty-calc-api-production.up.railway.app";
const RELEASE4_VERSION = "2026.10.01+release4.5";
const RELEASE4_PAYLOAD_HASH = "1a83e4cc04e4ff5b42a87e8db3e0493277ac4f684dc89b0041dc579dae0c5feb";
const RELEASE4_RECORD_HASH = "fe51ed4b906c37c768f8fe560a5efd267b1126852acc6a67cb49c78b9ae5ed77";
const RELEASE4_SLICE_ID = "slice:release4:exact-qsp-rev20-ordinary-general";
const RELEASE4_SCHEDULE = "2026HTSRev20";
const RELEASE4_INPUT_CONTRACT = "us-qsp-ordinary-general-rev20/v3";
const RELEASE4_RESULT_CONTRACT = "tariff.result-contract/v3";
const RELEASE4_EVIDENCE_AS_OF = "2026-10-01T13:05:00Z";
const RELEASE4_EVIDENCE_VALID_THROUGH = "2026-10-08T13:05:00Z";
// Caller declarations must match the pinned signed Rev20 ordinary General authority.
const DUTY_DECLARATION_CONTRACT = "us-qsp-ordinary-general-rev20/v3";
const ORDINARY_COUNTRY_HEADINGS = {
  "AE": "9903.05.80",
  "AO": "9903.05.21",
  "AR": "9903.05.22",
  "AT": "9903.05.39",
  "AU": "9903.05.23",
  "BD": "9903.05.26",
  "BE": "9903.05.39",
  "BG": "9903.05.39",
  "BH": "9903.05.25",
  "BR": "9903.05.27",
  "BS": "9903.05.24",
  "CH": "9903.05.74",
  "CL": "9903.05.30",
  "CO": "9903.05.32",
  "CR": "9903.05.33",
  "CY": "9903.05.39",
  "CZ": "9903.05.39",
  "DE": "9903.05.39",
  "DK": "9903.05.39",
  "DO": "9903.05.34",
  "DZ": "9903.05.20",
  "EC": "9903.05.35",
  "EE": "9903.05.39",
  "EG": "9903.05.36",
  "ES": "9903.05.39",
  "FI": "9903.05.39",
  "FR": "9903.05.39",
  "GB": "9903.05.81",
  "GR": "9903.05.39",
  "GT": "9903.05.40",
  "GY": "9903.05.41",
  "HK": "9903.05.43",
  "HN": "9903.05.42",
  "HR": "9903.05.39",
  "HU": "9903.05.39",
  "ID": "9903.05.45",
  "IE": "9903.05.39",
  "IL": "9903.05.47",
  "IQ": "9903.05.46",
  "IT": "9903.05.39",
  "JO": "9903.05.50",
  "JP": "9903.05.49",
  "KH": "9903.05.28",
  "KR": "9903.05.71",
  "KW": "9903.05.52",
  "KZ": "9903.05.51",
  "LK": "9903.05.72",
  "LT": "9903.05.39",
  "LU": "9903.05.39",
  "LV": "9903.05.39",
  "LY": "9903.05.53",
  "MA": "9903.05.56",
  "MT": "9903.05.39",
  "MX": "9903.05.55",
  "NG": "9903.05.59",
  "NL": "9903.05.39",
  "NO": "9903.05.60",
  "NZ": "9903.05.57",
  "OM": "9903.05.61",
  "PE": "9903.05.63",
  "PH": "9903.05.64",
  "PK": "9903.05.62",
  "PL": "9903.05.39",
  "PT": "9903.05.39",
  "QA": "9903.05.65",
  "RO": "9903.05.39",
  "SA": "9903.05.67",
  "SE": "9903.05.39",
  "SG": "9903.05.68",
  "SI": "9903.05.39",
  "SK": "9903.05.39",
  "SV": "9903.05.37",
  "TH": "9903.05.77",
  "TT": "9903.05.78",
  "TW": "9903.05.76",
  "UY": "9903.05.82",
  "VE": "9903.05.83",
  "VN": "9903.05.84",
  "ZA": "9903.05.69"
};
const QSP_EXEMPT_ORIGINS = new Set(["AO","AU","BR","BS","CO","CR","DO","DZ","EC","EG","GT","GY","HN","ID","IL","IQ","JO","KH","KR","KZ","LK","MX","NG","PE","PH","PK","SG","SV","TT","ZA"]);
const QSP_GENERAL_MFN = { "6810990020": 0, "6810990040": 0, "7020006000": 5 };
const RELEASE4_LINE_OPERATIONS = new Set(["add", "replace", "fill_to", "cap", "exempt"]);
const RELEASE4_LINE_DISPOSITIONS = new Set(["applied", "zero", "exempt"]);
let dutySubmission = 0;
let dutyInFlight = false;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isCode(value) {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value);
}

function humanize(value) {
  const text = String(value || "").replace(/_/g, " ");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function replaceSelectOptions(select, placeholder, items, normalize) {
  select.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  items.forEach(item => {
    const normalized = normalize(item);
    if (!normalized) return;
    const option = document.createElement("option");
    option.value = normalized.value;
    option.textContent = normalized.label;
    select.appendChild(option);
  });
}

function toggleBrazilFields() {
  document.getElementById("brazilFields").style.display =
    document.getElementById("origin").value === "BR" ? "block" : "none";
}

async function init() {
  const originSelect = document.getElementById("origin");
  originSelect.addEventListener("change", toggleBrazilFields);
  try {
    const response = await fetch(DUTY_API + "/api/v1/countries");
    if (!response.ok) throw new Error("Reference data unavailable");
    const data = await response.json();
    replaceSelectOptions(
      originSelect,
      "Select origin country...",
      Array.isArray(data.countries) ? data.countries : [],
      country => isCode(country?.code) && isText(country?.name)
        ? { value: country.code, label: `${country.name} (${country.code})` }
        : null
    );
    toggleBrazilFields();
  } catch (error) {
    console.error("Failed to load countries", error);
    replaceSelectOptions(originSelect, "Countries unavailable", [], () => null);
  }
}

function parseCanonicalUtcInstant(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, fraction = ""] = match;
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) return null;
  const expected = `${year}-${month}-${day}T${hour}:${minute}:${second}.${fraction.padEnd(3, "0")}Z`;
  return new Date(millis).toISOString() === expected ? millis : null;
}

function normalizeEntryAt(value) {
  const millis = parseCanonicalUtcInstant(value);
  return millis === null ? null : new Date(millis).toISOString();
}

function inputMoneyToCents(value) {
  if (typeof value !== "string") return null;
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  return BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0"));
}

function moneyToCents(value, allowNegative = false) {
  if (typeof value !== "string") return null;
  const pattern = allowNegative
    ? /^(-?)(0|[1-9]\d*)\.(\d{2})$/
    : /^(0|[1-9]\d*)\.(\d{2})$/;
  const match = pattern.exec(value);
  if (!match || value === "-0.00") return null;
  if (allowNegative) {
    const cents = BigInt(match[2]) * 100n + BigInt(match[3]);
    return match[1] === "-" ? -cents : cents;
  }
  return BigInt(match[1]) * 100n + BigInt(match[2]);
}

function rateToMicros(value, allowNegative = false) {
  if (typeof value !== "string") return null;
  const pattern = allowNegative
    ? /^(-?)(0|[1-9]\d*)\.(\d{6})$/
    : /^(0|[1-9]\d*)\.(\d{6})$/;
  const match = pattern.exec(value);
  if (!match) return null;
  const wholeIndex = allowNegative ? 2 : 1;
  const fractionIndex = allowNegative ? 3 : 2;
  const micros = BigInt(match[wholeIndex]) * 1_000_000n + BigInt(match[fractionIndex]);
  const signed = allowNegative && match[1] === "-" ? -micros : micros;
  return signed >= -500_000_000n && signed <= 500_000_000n ? signed : null;
}

function roundHalfEven(numerator, denominator) {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  let quotient = absolute / denominator;
  const remainder = absolute % denominator;
  const doubled = remainder * 2n;
  if (doubled > denominator || (doubled === denominator && quotient % 2n === 1n)) {
    quotient += 1n;
  }
  return sign * quotient;
}

function dutyCents(customsValueCents, rateMicros) {
  return roundHalfEven(customsValueCents * rateMicros, 100_000_000n);
}

function isTextArray(value) {
  return Array.isArray(value) &&
    value.every(isText) &&
    new Set(value).size === value.length;
}

function isUsdMoney(value, allowNegative = false) {
  return isRecord(value) && value.currency === "USD" && moneyToCents(value.amount, allowNegative) !== null;
}

function release4AuthorityUsable(data) {
  const authority = data?.authority;
  if (!isRecord(authority)) return false;
  const evidenceAsOf = parseCanonicalUtcInstant(authority.evidenceAsOf);
  const evidenceValidThrough = parseCanonicalUtcInstant(authority.evidenceValidThrough);
  const now = Date.now();
  return authority.state === "active" &&
    authority.rulesetVersion === RELEASE4_VERSION &&
    authority.rulesetPayloadHash === RELEASE4_PAYLOAD_HASH &&
    authority.releaseRecordHash === RELEASE4_RECORD_HASH &&
    authority.resultContractVersion === RELEASE4_RESULT_CONTRACT &&
    authority.evidenceAsOf === RELEASE4_EVIDENCE_AS_OF &&
    authority.evidenceValidThrough === RELEASE4_EVIDENCE_VALID_THROUGH &&
    evidenceAsOf !== null &&
    evidenceValidThrough !== null &&
    evidenceAsOf < evidenceValidThrough &&
    Number.isFinite(now) &&
    evidenceAsOf <= now &&
    now < evidenceValidThrough &&
    authority.scheduleRevision === RELEASE4_SCHEDULE &&
    authority.inputContract === RELEASE4_INPUT_CONTRACT &&
    Array.isArray(authority.activeCoverageSliceIds) &&
    authority.activeCoverageSliceIds.length === 1 &&
    authority.activeCoverageSliceIds[0] === RELEASE4_SLICE_ID;
}

function normalizeRelease4Calculation(data, requestAmounts) {
  if (!/^[a-f0-9]{64}$/.test(requestAmounts?.inputFingerprint || "") ||
      data?.inputFingerprint !== requestAmounts.inputFingerprint) return null;
  if (data?.status !== "calculated" || !release4AuthorityUsable(data) || !isRecord(data.calculation)) return null;
  const calculation = data.calculation;
  if (
    calculation.currency !== "USD" ||
    !isUsdMoney(calculation.customsValue) ||
    !isUsdMoney(calculation.shippingCost) ||
    !isUsdMoney(calculation.insuranceCost) ||
    !isUsdMoney(calculation.dutyAmount) ||
    !isUsdMoney(calculation.estimatedSubtotal) ||
    !Array.isArray(calculation.lineItems) ||
    calculation.lineItems.length === 0
  ) return null;

  const customsValueCents = moneyToCents(calculation.customsValue.amount);
  const shippingCostCents = moneyToCents(calculation.shippingCost.amount);
  const insuranceCostCents = moneyToCents(calculation.insuranceCost.amount);
  const aggregateDutyCents = moneyToCents(calculation.dutyAmount.amount);
  const subtotalCents = moneyToCents(calculation.estimatedSubtotal.amount);
  const totalRateMicros = rateToMicros(calculation.totalRatePercent);
  if (
    customsValueCents === null ||
    shippingCostCents === null ||
    insuranceCostCents === null ||
    aggregateDutyCents === null ||
    subtotalCents === null ||
    totalRateMicros === null ||
    !isRecord(requestAmounts) ||
    customsValueCents !== requestAmounts.customsValueCents ||
    shippingCostCents !== requestAmounts.shippingCostCents ||
    insuranceCostCents !== requestAmounts.insuranceCostCents ||
    subtotalCents !== customsValueCents + shippingCostCents + insuranceCostCents + aggregateDutyCents
  ) return null;

  let lineRateMicros = 0n;
  let lineDutyCents = 0n;
  for (const item of calculation.lineItems) {
    const rateMicros = rateToMicros(item?.ratePercent, true);
    const itemDutyCents = isUsdMoney(item?.dutyAmount, true)
      ? moneyToCents(item.dutyAmount.amount, true)
      : null;
    if (
      !isRecord(item) ||
      !isText(item.layer) ||
      !isText(item.authority) ||
      !RELEASE4_LINE_OPERATIONS.has(item.operation) ||
      !RELEASE4_LINE_DISPOSITIONS.has(item.disposition) ||
      rateMicros === null ||
      itemDutyCents === null ||
      !isTextArray(item.ruleIds) ||
      !isTextArray(item.sourceDocumentIds) ||
      (item.operation === "exempt") !== (item.disposition === "exempt") ||
      (item.disposition === "zero") !== (rateMicros === 0n && item.operation !== "exempt") ||
      (item.disposition === "applied") !== (rateMicros !== 0n) ||
      itemDutyCents !== dutyCents(customsValueCents, rateMicros)
    ) return null;
    lineRateMicros += rateMicros;
    lineDutyCents += itemDutyCents;
  }
  if (lineRateMicros !== totalRateMicros || lineDutyCents !== aggregateDutyCents) return null;
  return calculation;
}

function renderRelease4Metadata(data, fallbackState) {
  const authority = isRecord(data?.authority) ? data.authority : {};
  const sliceCount = Array.isArray(authority.activeCoverageSliceIds)
    ? authority.activeCoverageSliceIds.length
    : 0;
  const rows = [
    ["Ruleset", authority.rulesetVersion || "Not available"],
    ["Evidence valid through", authority.evidenceValidThrough || "Not available"],
    ["Authority state", humanize(authority.state || fallbackState) || "Not available"],
    ["Coverage", sliceCount ? `${sliceCount} active slice${sliceCount === 1 ? "" : "s"}` : "No active match"]
  ];
  const container = document.getElementById("responseMetadata");
  container.replaceChildren();
  rows.forEach(([label, value]) => {
    const row = document.createElement("span");
    const heading = document.createElement("strong");
    const detail = document.createElement("span");
    heading.textContent = `${label}:`;
    detail.textContent = ` ${value}`;
    row.appendChild(heading);
    row.appendChild(detail);
    container.appendChild(row);
  });
}

function appendBreakdownRow(container, label, value, className = "") {
  const row = document.createElement("div");
  row.className = `row-item${className ? ` ${className}` : ""}`;
  const labelNode = document.createElement("span");
  const valueNode = document.createElement("span");
  labelNode.textContent = label;
  valueNode.textContent = value;
  if (className === "total") valueNode.className = "green";
  row.appendChild(labelNode);
  row.appendChild(valueNode);
  container.appendChild(row);
}

function renderRelease4Breakdown(calculation) {
  const container = document.getElementById("breakdown");
  container.replaceChildren();
  appendBreakdownRow(container, "U.S. customs value", `$${calculation.customsValue.amount}`);
  if (Number(calculation.shippingCost.amount) > 0) {
    appendBreakdownRow(container, "Shipping outside customs value", `$${calculation.shippingCost.amount}`);
  }
  if (Number(calculation.insuranceCost.amount) > 0) {
    appendBreakdownRow(container, "Insurance outside customs value", `$${calculation.insuranceCost.amount}`);
  }
  calculation.lineItems.forEach(item => {
    const amount = item.dutyAmount.amount;
    const signedAmount = amount.startsWith("-") ? `-$${amount.slice(1)}` : `+$${amount}`;
    appendBreakdownRow(
      container,
      `${humanize(item.layer)} (${item.ratePercent}%)`,
      signedAmount,
      "duty"
    );
  });
  appendBreakdownRow(container, "Estimated subtotal", `$${calculation.estimatedSubtotal.amount}`, "total");
}

function clearNumericResult() {
  document.getElementById("resultNumbers").style.display = "none";
  document.getElementById("rateDisplay").textContent = "—";
  document.getElementById("dutyDisplay").textContent = "—";
  document.getElementById("totalDisplay").textContent = "—";
  document.getElementById("breakdown").replaceChildren();
  document.getElementById("marginDesc").textContent = "";
  document.getElementById("disclaimerText").textContent = "";
}

function showUnavailable(data, message) {
  clearNumericResult();
  document.getElementById("placeholder").style.display = "none";
  document.getElementById("results").style.display = "block";
  document.getElementById("route").textContent = "No supported exact result";
  const resultState = document.getElementById("resultState");
  resultState.className = "result-status unavailable";
  resultState.textContent = message;
  renderRelease4Metadata(data, "indeterminate");
  document.getElementById("disclaimerText").textContent =
    "No rate, duty, or subtotal is available for this request. Verify every filing input or consult a qualified customs professional.";
}

function formValue(id) {
  return document.getElementById(id).value.trim();
}

function validEvidenceReference(value) {
  const length = Array.from(value.trim()).length;
  return length >= 8 && length <= 300;
}

function canonicalInputMoney(value, required, maximum) {
  if (!required && !value) return "0.00";
  const cents = inputMoneyToCents(value);
  if (cents === null || (required && cents <= 0n) || cents > BigInt(maximum) * 100n) {
    throw new TypeError("Supply a canonical USD amount within the supported range.");
  }
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

function readExactDutyInput() {
  const input = {};
  for (const key of ["calculationBasis", "origin", "manufacturingOrigin", "thirdCountryProcessing",
    "certificationDisposition", "brokerEntryReference", "adCvdStatus", "adCvdEvidenceRef",
    "entryTreatment", "qspProductStatus", "qspProductEvidenceRef", "hts", "entryAt", "customsValue",
    "mfnRate", "forcedLaborCountryHeading", "forcedLaborExceptionHeading", "brazilHeading", "qspHeading",
    "qspQuotaStatus", "qspQuotaEvidenceRef", "qspQuotaReviewedAt", "shippingCost", "insuranceCost"]) {
    input[key] = formValue(key);
  }
  input.origin = input.origin.toUpperCase();
  input.manufacturingOrigin = input.manufacturingOrigin.toUpperCase();
  input.hts = input.hts.replaceAll(".", "");
  input.forcedLaborExceptionHeading = input.forcedLaborExceptionHeading.toUpperCase();
  if (!["entry", "per_unit"].includes(input.calculationBasis)) throw new TypeError("Select entry or per-unit calculation basis.");
  if (!Object.hasOwn(QSP_GENERAL_MFN, input.hts)) throw new TypeError("This scope requires 6810990020, 6810990040, or 7020006000; an eight-digit parent is insufficient.");
  if (!Object.hasOwn(ORDINARY_COUNTRY_HEADINGS, input.origin)) throw new TypeError("This origin is outside the supported ordinary General scope.");
  if (input.qspProductStatus !== "subject_qsp" || !validEvidenceReference(input.qspProductEvidenceRef)) {
    throw new TypeError("Declare reviewed Note 41(a) subject-QSP product scope and provide an 8–300 code-point evidence reference, including review of the subject-QSP customs value portion.");
  }
  if (input.manufacturingOrigin !== input.origin || input.thirdCountryProcessing !== "none" ||
      input.certificationDisposition !== "not_required" || input.adCvdStatus !== "not_subject" ||
      input.entryTreatment !== "ordinary_general" || !validEvidenceReference(input.brokerEntryReference) ||
      !validEvidenceReference(input.adCvdEvidenceRef)) {
    throw new TypeError("Explicit original slab origin, processing, certification, ordinary General treatment and AD/CVD review declarations are required, with 8–300 code-point references.");
  }
  if (!/^(?:0|[1-9]\d{0,2})(?:\.\d{1,6})?$/.test(input.mfnRate) ||
      Number(input.mfnRate) !== QSP_GENERAL_MFN[input.hts] || input.forcedLaborExceptionHeading !== "NONE" ||
      input.forcedLaborCountryHeading !== ORDINARY_COUNTRY_HEADINGS[input.origin] ||
      (input.origin === "BR" ? input.brazilHeading !== "9903.05.01" : Boolean(input.brazilHeading))) {
    throw new TypeError("Headings and MFN must match the supported ordinary General scope. NONE is allowed for ordinary Brazil; 9903.05.27 as an exception or other threshold/special treatment is unsupported.");
  }
  input.entryAt = normalizeEntryAt(input.entryAt);
  const entry = input.entryAt ? Date.parse(input.entryAt) : NaN;
  const now = Date.now();
  if (!Number.isFinite(entry) || !Number.isFinite(now) || entry < Date.parse("2026-08-15T04:01:00Z") || entry > now) {
    throw new TypeError("Supply a valid UTC entry instant within the supported entry window and no later than now.");
  }
  const exempt = QSP_EXEMPT_ORIGINS.has(input.origin);
  if (exempt) {
    if (input.qspHeading || input.qspQuotaStatus || input.qspQuotaEvidenceRef || input.qspQuotaReviewedAt) {
      throw new TypeError("QSP-exempt origins must omit the QSP heading and all quota declarations.");
    }
  } else {
    const expected = { "9903.45.30": "allocated_in_quota", "9903.45.31": "confirmed_over_quota" }[input.qspHeading];
    const reviewed = normalizeEntryAt(input.qspQuotaReviewedAt);
    if (!expected || input.qspQuotaStatus !== expected || !validEvidenceReference(input.qspQuotaEvidenceRef) ||
        !reviewed || Date.parse(reviewed) < entry || Date.parse(reviewed) > now) {
      throw new TypeError("Supply the matching QSP quota disposition and 8–300 code-point evidence, reviewed at or after entry and no later than now.");
    }
    input.qspQuotaReviewedAt = reviewed;
  }
  for (const key of ["brazilHeading", "qspHeading", "qspQuotaStatus", "qspQuotaEvidenceRef", "qspQuotaReviewedAt"]) {
    if (!input[key]) delete input[key];
  }
  input.customsValue = canonicalInputMoney(input.customsValue, true, 10_000_000);
  input.shippingCost = canonicalInputMoney(input.shippingCost, false, 1_000_000);
  input.insuranceCost = canonicalInputMoney(input.insuranceCost, false, 1_000_000);
  return input;
}

async function exactDutyInputFingerprint(input) {
  // Property order and null optional fields match the gateway exactInputFingerprint.
  const identity = {
    destination: "US", basis: input.calculationBasis,
    origin: input.origin, manufacturingOrigin: input.manufacturingOrigin,
    thirdCountryProcessing: input.thirdCountryProcessing, certificationDisposition: input.certificationDisposition,
    brokerEntryReference: input.brokerEntryReference, adCvdStatus: input.adCvdStatus,
    adCvdEvidenceRef: input.adCvdEvidenceRef, entryTreatment: input.entryTreatment,
    qspProductStatus: input.qspProductStatus, qspProductEvidenceRef: input.qspProductEvidenceRef,
    hts: input.hts, entryAt: input.entryAt, customsValue: input.customsValue, mfnRate: input.mfnRate,
    forcedLaborCountryHeading: input.forcedLaborCountryHeading, forcedLaborExceptionHeading: input.forcedLaborExceptionHeading,
    brazilHeading: input.brazilHeading ?? null, qspHeading: input.qspHeading ?? null,
    qspQuotaStatus: input.qspQuotaStatus ?? null, qspQuotaEvidenceRef: input.qspQuotaEvidenceRef ?? null,
    qspQuotaReviewedAt: input.qspQuotaReviewedAt ?? null,
    shippingCost: input.shippingCost, insuranceCost: input.insuranceCost,
  };
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(identity)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function calculate() {
  if (dutyInFlight) return;
  const actionKey = `duty:${++dutySubmission}`;
  const error = document.getElementById("error");
  error.style.display = "none";
  clearNumericResult();
  let input;
  try {
    input = readExactDutyInput();
  } catch (validation) {
    error.textContent = validation.message;
    error.style.display = "block";
    showUnavailable(null, "Indeterminate — required exact inputs are missing or unsupported");
    window.AttahirAnalytics?.once(`${actionKey}:validation`, "tool_validation_failed", {
      surface: "duty_calculator", tool_name: "duty_calculator", error_code: "validation"
    });
    return;
  }
  const { origin } = input;
  const customsValueCents = inputMoneyToCents(input.customsValue);
  const shippingCostCents = inputMoneyToCents(input.shippingCost);
  const insuranceCostCents = inputMoneyToCents(input.insuranceCost);

  const button = document.getElementById("calcBtn");
  dutyInFlight = true;
  button.disabled = true;
  button.textContent = "Checking signed authority...";
  document.getElementById("placeholder").style.display = "none";
  document.getElementById("results").style.display = "block";
  document.getElementById("route").textContent = `${origin} → United States`;
  document.getElementById("resultState").className = "result-status";
  document.getElementById("resultState").textContent = "Checking active Release 4 coverage…";
  renderRelease4Metadata(null, "checking");
  window.AttahirAnalytics?.once(`${actionKey}:start`, "tool_started", {
    surface: "duty_calculator",
    tool_name: "duty_calculator"
  });

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 60_000);
  try {
    const inputFingerprint = await exactDutyInputFingerprint(input);
    if (controller.signal.aborted) throw new Error("CLIENT_TIMEOUT");
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) params.set(key, value);
    }
    const response = await fetch(DUTY_API + "/api/v2/us-duty?" + params, { signal: controller.signal });
    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

    if (controller.signal.aborted) throw new Error("CLIENT_TIMEOUT");
    if (!response.ok || data.status !== "calculated") {
      const code = isText(data.code) ? data.code : "UNAVAILABLE";
      error.textContent = isText(data.reason)
        ? data.reason
        : isText(data.error) ? data.error : "No supported exact result is available.";
      error.style.display = "block";
      showUnavailable(data, `Indeterminate — ${humanize(code)}`);
      const errorCode = response.status === 429
        ? "rate_limited"
        : response.status === 400 ? "validation" : "upstream";
      window.AttahirAnalytics?.once(`${actionKey}:outcome`, "tool_failed", {
        surface: "duty_calculator",
        tool_name: "duty_calculator",
        error_code: errorCode
      });
      return;
    }

    const calculation = normalizeRelease4Calculation(data, {
      inputFingerprint,
      customsValueCents,
      shippingCostCents,
      insuranceCostCents
    });
    if (!calculation) {
      error.textContent = "The signed calculation response could not be validated.";
      error.style.display = "block";
      showUnavailable(data, "Indeterminate — response validation failed");
      window.AttahirAnalytics?.once(`${actionKey}:outcome`, "tool_failed", {
        surface: "duty_calculator",
        tool_name: "duty_calculator",
        error_code: "upstream"
      });
      return;
    }

    document.getElementById("resultNumbers").style.display = "block";
    document.getElementById("resultState").className = "result-status";
    document.getElementById("resultState").textContent =
      "Calculated — exact inputs matched active signed coverage";
    renderRelease4Metadata(data, "active");
    document.getElementById("rateDisplay").textContent = `${calculation.totalRatePercent}%`;
    document.getElementById("dutyDisplay").textContent = `$${calculation.dutyAmount.amount}`;
    document.getElementById("totalDisplay").textContent = `$${calculation.estimatedSubtotal.amount}`;
    renderRelease4Breakdown(calculation);
    document.getElementById("marginDesc").textContent =
      `${calculation.lineItems.length} signed authority layer${calculation.lineItems.length === 1 ? "" : "s"} matched this exact request.`;
    document.getElementById("disclaimerText").textContent = data.disclaimer ||
      "Planning estimate under the exact inputs supplied. Not a customs classification, liquidation, or legal determination.";
    const resultBand = window.AttahirAnalytics?.dutyResultBand(`${calculation.totalRatePercent}%`) || "not_available";
    window.AttahirAnalytics?.once(`${actionKey}:outcome`, "tool_completed", {
      surface: "duty_calculator",
      tool_name: "duty_calculator",
      result_band: resultBand
    });
  } catch (_) {
    error.textContent = controller.signal.aborted
      ? "The request timed out. No result was received; you can try again."
      : "Failed to connect to the signed tariff authority API.";
    error.style.display = "block";
    showUnavailable(null, "Indeterminate — authority API unavailable");
    window.AttahirAnalytics?.once(`${actionKey}:outcome`, "tool_failed", {
      surface: "duty_calculator",
      tool_name: "duty_calculator",
      error_code: controller.signal.aborted ? "timeout" : "network"
    });
  } finally {
    clearTimeout(deadline);
    dutyInFlight = false;
    button.disabled = false;
    button.textContent = "Calculate Duty";
  }
}

window.calculate = calculate;
init();
