const DUTY_API = "https://duty-calc-api-production.up.railway.app";
const RELEASE3_VERSION = "2026.08.17+release3.1";
const RELEASE3_PAYLOAD_HASH = "5b7d90a7892b717c8b479d0abe3b36bc592caa10bccf75c37f7b385206e0f205";
const RELEASE3_RECORD_HASH = "d198c2bf20af75269d5e408b01a4268512f41083f9b2ddfd12c40a2ea9301217";
const RELEASE3_SLICE_ID = "slice:release3:exact-chapter99-rev16-qsp-uas";
const RELEASE3_SCHEDULE = "2026HTSRev16";
const RELEASE3_INPUT_CONTRACT = "exact_caller_supplied_htsus_mfn_chapter99_release3";
const RELEASE3_RESULT_CONTRACT = "tariff.result-contract/v3";
const RELEASE3_EVIDENCE_AS_OF = "2026-08-17T13:00:00Z";
const RELEASE3_EVIDENCE_VALID_THROUGH = "2026-08-24T13:00:00Z";
const RELEASE3_LINE_OPERATIONS = new Set(["add", "replace", "fill_to", "cap", "exempt"]);
const RELEASE3_LINE_DISPOSITIONS = new Set(["applied", "zero", "exempt"]);
let dutySubmission = 0;

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

function release3AuthorityUsable(data) {
  const authority = data?.authority;
  if (!isRecord(authority)) return false;
  const evidenceAsOf = parseCanonicalUtcInstant(authority.evidenceAsOf);
  const evidenceValidThrough = parseCanonicalUtcInstant(authority.evidenceValidThrough);
  const now = Date.now();
  return authority.state === "active" &&
    authority.rulesetVersion === RELEASE3_VERSION &&
    authority.rulesetPayloadHash === RELEASE3_PAYLOAD_HASH &&
    authority.releaseRecordHash === RELEASE3_RECORD_HASH &&
    authority.resultContractVersion === RELEASE3_RESULT_CONTRACT &&
    authority.evidenceAsOf === RELEASE3_EVIDENCE_AS_OF &&
    authority.evidenceValidThrough === RELEASE3_EVIDENCE_VALID_THROUGH &&
    evidenceAsOf !== null &&
    evidenceValidThrough !== null &&
    evidenceAsOf < evidenceValidThrough &&
    Number.isFinite(now) &&
    evidenceAsOf <= now &&
    now < evidenceValidThrough &&
    authority.scheduleRevision === RELEASE3_SCHEDULE &&
    authority.inputContract === RELEASE3_INPUT_CONTRACT &&
    Array.isArray(authority.activeCoverageSliceIds) &&
    authority.activeCoverageSliceIds.length === 1 &&
    authority.activeCoverageSliceIds[0] === RELEASE3_SLICE_ID;
}

function normalizeRelease3Calculation(data, requestAmounts) {
  if (data?.status !== "calculated" || !release3AuthorityUsable(data) || !isRecord(data.calculation)) return null;
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
      !RELEASE3_LINE_OPERATIONS.has(item.operation) ||
      !RELEASE3_LINE_DISPOSITIONS.has(item.disposition) ||
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

function renderRelease3Metadata(data, fallbackState) {
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

function renderRelease3Breakdown(calculation) {
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
  renderRelease3Metadata(data, "indeterminate");
  document.getElementById("disclaimerText").textContent =
    "No rate, duty, or subtotal is available for this request. Verify every filing input or consult a qualified customs professional.";
}

function formValue(id) {
  return document.getElementById(id).value.trim();
}

async function calculate() {
  const actionKey = `duty:${++dutySubmission}`;
  const origin = formValue("origin").toUpperCase();
  const hts = formValue("hts");
  const customsValue = formValue("customsValue");
  const mfnRate = formValue("mfnRate");
  const forcedLaborCountryHeading = formValue("forcedLaborCountryHeading");
  const forcedLaborExceptionHeading = formValue("forcedLaborExceptionHeading").toUpperCase();
  const brazilHeading = formValue("brazilHeading");
  const qspHeading = formValue("qspHeading");
  const uasHeading = formValue("uasHeading");
  const entryAt = formValue("entryAt");
  const normalizedEntryAt = normalizeEntryAt(entryAt);
  const shippingCost = formValue("shippingCost") || "0";
  const insuranceCost = formValue("insuranceCost") || "0";
  const error = document.getElementById("error");
  error.style.display = "none";
  clearNumericResult();

  const compactHts = hts.replaceAll(".", "");
  const customsValueCents = inputMoneyToCents(customsValue);
  const shippingCostCents = inputMoneyToCents(shippingCost);
  const insuranceCostCents = inputMoneyToCents(insuranceCost);
  if (
    !origin ||
    !/^(?:0[1-9]|[1-8]\d|9[0-7])\d{6}(?:\d{2})?$/.test(compactHts) ||
    customsValueCents === null ||
    customsValueCents <= 0n ||
    shippingCostCents === null ||
    insuranceCostCents === null ||
    !mfnRate ||
    !forcedLaborCountryHeading ||
    !forcedLaborExceptionHeading ||
    (origin === "BR" && !brazilHeading) ||
    (qspHeading && !/^9903\.45\.(?:30|31)$/.test(qspHeading)) ||
    (uasHeading && !/^9903\.08\.2[0-6]$/.test(uasHeading)) ||
    normalizedEntryAt === null
  ) {
    error.textContent = "Complete every required exact-input field.";
    error.style.display = "block";
    showUnavailable(null, "Indeterminate — required exact inputs are missing");
    window.AttahirAnalytics?.once(`${actionKey}:outcome`, "tool_failed", {
      surface: "duty_calculator",
      tool_name: "duty_calculator",
      error_code: "validation"
    });
    return;
  }

  const button = document.getElementById("calcBtn");
  button.disabled = true;
  button.textContent = "Checking signed authority...";
  document.getElementById("placeholder").style.display = "none";
  document.getElementById("results").style.display = "block";
  document.getElementById("route").textContent = `${origin} → United States`;
  document.getElementById("resultState").className = "result-status";
  document.getElementById("resultState").textContent = "Checking active Release 3 coverage…";
  renderRelease3Metadata(null, "checking");
  window.AttahirAnalytics?.once(`${actionKey}:start`, "tool_started", {
    surface: "duty_calculator",
    tool_name: "duty_calculator"
  });

  try {
    const params = new URLSearchParams({
      origin,
      hts,
      customsValue,
      mfnRate,
      forcedLaborCountryHeading,
      forcedLaborExceptionHeading,
      shippingCost,
      insuranceCost
    });
    if (origin === "BR") params.set("brazilHeading", brazilHeading);
    if (qspHeading) params.set("qspHeading", qspHeading);
    if (uasHeading) params.set("uasHeading", uasHeading);
    params.set("entryAt", normalizedEntryAt);
    const response = await fetch(DUTY_API + "/api/v2/us-duty?" + params);
    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

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

    const calculation = normalizeRelease3Calculation(data, {
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
    renderRelease3Metadata(data, "active");
    document.getElementById("rateDisplay").textContent = `${calculation.totalRatePercent}%`;
    document.getElementById("dutyDisplay").textContent = `$${calculation.dutyAmount.amount}`;
    document.getElementById("totalDisplay").textContent = `$${calculation.estimatedSubtotal.amount}`;
    renderRelease3Breakdown(calculation);
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
    error.textContent = "Failed to connect to the signed tariff authority API.";
    error.style.display = "block";
    showUnavailable(null, "Indeterminate — authority API unavailable");
    window.AttahirAnalytics?.once(`${actionKey}:outcome`, "tool_failed", {
      surface: "duty_calculator",
      tool_name: "duty_calculator",
      error_code: "network"
    });
  } finally {
    button.disabled = false;
    button.textContent = "Calculate Duty";
  }
}

window.calculate = calculate;
init();
