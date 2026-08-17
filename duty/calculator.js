const DUTY_API = "https://duty-calc-api-production.up.railway.app";
const RELEASE3_VERSION = "2026.08.17+release3.1";
const RELEASE3_PAYLOAD_HASH = "5b7d90a7892b717c8b479d0abe3b36bc592caa10bccf75c37f7b385206e0f205";
const RELEASE3_RECORD_HASH = "d198c2bf20af75269d5e408b01a4268512f41083f9b2ddfd12c40a2ea9301217";
const RELEASE3_SLICE_ID = "slice:release3:exact-chapter99-rev16-qsp-uas";
const RELEASE3_SCHEDULE = "2026HTSRev16";
const RELEASE3_INPUT_CONTRACT = "exact_caller_supplied_htsus_mfn_chapter99_release3";
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

function isMoneyAmount(value) {
  return typeof value === "string" && /^(?:0|[1-9]\d*)(?:\.\d{2})$/.test(value);
}

function isRateAmount(value) {
  return typeof value === "string" &&
    /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value) &&
    Number(value) <= 500;
}

function release3AuthorityUsable(data) {
  const authority = data?.authority;
  return isRecord(authority) &&
    authority.state === "active" &&
    authority.rulesetVersion === RELEASE3_VERSION &&
    authority.rulesetPayloadHash === RELEASE3_PAYLOAD_HASH &&
    authority.releaseRecordHash === RELEASE3_RECORD_HASH &&
    authority.scheduleRevision === RELEASE3_SCHEDULE &&
    authority.inputContract === RELEASE3_INPUT_CONTRACT &&
    isText(authority.evidenceValidThrough) &&
    Array.isArray(authority.activeCoverageSliceIds) &&
    authority.activeCoverageSliceIds.length === 1 &&
    authority.activeCoverageSliceIds[0] === RELEASE3_SLICE_ID;
}

function normalizeRelease3Calculation(data) {
  if (data?.status !== "calculated" || !release3AuthorityUsable(data) || !isRecord(data.calculation)) return null;
  const calculation = data.calculation;
  if (
    calculation.currency !== "USD" ||
    !isRateAmount(calculation.totalRatePercent) ||
    !isMoneyAmount(calculation.customsValue?.amount) ||
    !isMoneyAmount(calculation.shippingCost?.amount) ||
    !isMoneyAmount(calculation.insuranceCost?.amount) ||
    !isMoneyAmount(calculation.dutyAmount?.amount) ||
    !isMoneyAmount(calculation.estimatedSubtotal?.amount) ||
    !Array.isArray(calculation.lineItems) ||
    calculation.lineItems.length === 0
  ) return null;

  const values = [
    calculation.customsValue.amount,
    calculation.shippingCost.amount,
    calculation.insuranceCost.amount,
    calculation.dutyAmount.amount,
    calculation.estimatedSubtotal.amount
  ].map(Number);
  if (values.some(value => !Number.isFinite(value) || value < 0)) return null;
  const expectedSubtotal = Math.round((values[0] + values[1] + values[2] + values[3]) * 100) / 100;
  if (Math.abs(values[4] - expectedSubtotal) > 0.01) return null;

  for (const item of calculation.lineItems) {
    if (
      !isRecord(item) ||
      !isText(item.layer) ||
      !isText(item.authority) ||
      !isRateAmount(item.ratePercent) ||
      !isMoneyAmount(item.dutyAmount?.amount) ||
      !Array.isArray(item.ruleIds) ||
      !Array.isArray(item.sourceDocumentIds)
    ) return null;
  }
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
    appendBreakdownRow(
      container,
      `${humanize(item.layer)} (${item.ratePercent}%)`,
      `+$${item.dutyAmount.amount}`,
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
  const shippingCost = formValue("shippingCost") || "0";
  const insuranceCost = formValue("insuranceCost") || "0";
  const error = document.getElementById("error");
  error.style.display = "none";
  clearNumericResult();

  const compactHts = hts.replaceAll(".", "");
  const entryAtValid = !entryAt || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(entryAt);
  if (
    !origin ||
    !/^(?:0[1-9]|[1-8]\d|9[0-7])\d{6}(?:\d{2})?$/.test(compactHts) ||
    !customsValue ||
    !mfnRate ||
    !forcedLaborCountryHeading ||
    !forcedLaborExceptionHeading ||
    (origin === "BR" && !brazilHeading) ||
    (qspHeading && !/^9903\.45\.(?:30|31)$/.test(qspHeading)) ||
    (uasHeading && !/^9903\.08\.2[0-6]$/.test(uasHeading)) ||
    !entryAtValid
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
    if (entryAt) params.set("entryAt", entryAt);
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

    const calculation = normalizeRelease3Calculation(data);
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
