"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash, webcrypto } = require("node:crypto");
const { projectQuote, renderQuote } = require("../duty/rev22-quote");
const raw = fs.readFileSync(path.join(__dirname, "fixtures/rev22-public-software-quotes.json"));
const packet = JSON.parse(raw);
const target = Object.freeze({ kind: "software_fixture", labSha256: "02f930d4b86843bd3b2c523d2f7296f6fd3fa4dfab4ee39c7ce94c9b3d824f9a" });
const copy = value => JSON.parse(JSON.stringify(value));
const sample = origin => copy(packet.samples.find(row => row.input.origin === origin && row.response.status === "calculated"));

class Element {
  constructor(value = "") { this.value = value; this.textContent = ""; this.style = {}; this.children = []; }
  appendChild(value) { this.children.push(value); }
  replaceChildren(...values) { this.children = values; this.textContent = ""; }
}
const elements = () => Object.fromEntries(["resultNumbers", "rateDisplay", "dutyDisplay", "totalDisplay", "resultState", "breakdown", "rev22Evidence"].map(id => [id, new Element()]));
const visible = node => [node.textContent, ...node.children.map(visible)].join(" ");

test("positive fixtures retain exact known software identity without canonical signatures", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), "d202e7722636646e0ab30c00536de53ece1d2102fbeaea126f7d0cf1bf85c6e7");
  assert.equal(packet.fixtureOnly, true);
  assert.equal(packet.noCanonicalRecordOrSignaturesCreated, true);
  for (const value of packet.samples.filter(row => row.response.status === "calculated")) {
    const model = projectQuote(value.response, value.input, target);
    assert.equal(model.completeness, "complete", value.requestId);
    assert.equal(model.softwareOnly, true);
    const nodes = elements();
    renderQuote(model, nodes, () => new Element());
    assert.equal(nodes.dutyDisplay.textContent, "$" + value.response.calculation.dutyAmount.amount);
    assert.equal(nodes.totalDisplay.textContent, "$" + value.response.calculation.estimatedSubtotal.amount);
    assert.match(nodes.resultState.textContent, /Software test only/);
    assert.match(nodes.resultState.textContent, /declared inputs/);
    assert.match(visible(nodes.rev22Evidence), /Declared by you; unverified/);
    assert.match(visible(nodes.rev22Evidence), /Source identity references/);
  }
});

test("all actual before-window and expiry fixtures remain number-free", () => {
  for (const value of packet.samples.filter(row => row.response.status !== "calculated")) {
    const model = projectQuote(value.response, value.input, target);
    assert.equal(model.completeness, "incomplete");
    assert.equal(model.calculation, null);
  }
});

test("NULL target refuses even a complete known fixture or API approval claims", () => {
  const value = sample("AE");
  value.response.approved = true;
  value.response.target = target;
  value.response.quote.sourceStages.reviewed = "approved";
  assert.equal(projectQuote(value.response, value.input, null).completeness, "incomplete");
  assert.equal(projectQuote(value.response, value.input, Object.freeze({ kind: "software_fixture", labSha256: "0".repeat(64) })).completeness, "incomplete");
});

test("missing or unknown layers cannot yield a partial total", () => {
  for (const mode of ["missing", "unknown", "ambiguous", "absentPolicy", "wrongPolicy", "absentBrazilRule"]) {
    const value = sample("AE"), rows = value.response.quote.layerDeterminations;
    if (mode === "missing") rows.splice(rows.findIndex(row => row.layer === "special.section301.forced_labor"), 1);
    if (mode === "unknown") rows.find(row => row.layer === "special.section301.forced_labor").status = "unknown";
    if (mode === "ambiguous") rows[1] = copy(rows[0]);
    if (mode === "absentPolicy") { const row = rows.find(row => row.status === "not_applicable"); row.claimIds = []; }
    if (mode === "wrongPolicy") rows.find(row => row.status === "not_applicable").claimIds = ["claim:test.invalid:unknown"];
    if (mode === "absentBrazilRule") rows.find(row => row.layer === "special.section301.brazil").ruleIds = [];
    const model = projectQuote(value.response, value.input, target);
    assert.equal(model.completeness, "incomplete", mode);
    assert.equal(model.calculation, null);
  }
});

test("missing declaration or invented verified MFN refuses the whole estimate", () => {
  for (const mode of ["missing", "duplicate", "verifiedMFN", "changedFact"]) {
    const value = sample("AE"), facts = value.response.quote.factLedger;
    if (mode === "missing") value.response.quote.factLedger = facts.filter(row => row.fact !== "entry.adCvdStatus");
    if (mode === "duplicate") facts.push(copy(facts[0]));
    if (mode === "verifiedMFN") facts.find(row => row.fact === "base.mfn.rate").verificationState = "verified";
    if (mode === "changedFact") facts.find(row => row.fact === "entry.manufacturingOrigin").value = "CA";
    assert.equal(projectQuote(value.response, value.input, target).completeness, "incomplete", mode);
  }
});

test("request, source, line and arithmetic tampering are refused", () => {
  for (const mode of ["fingerprint", "source", "extraLine", "index", "amount", "total", "rate", "canada"]) {
    const value = sample("AE");
    if (mode === "fingerprint") value.response.inputFingerprint = "0".repeat(64);
    if (mode === "source") value.response.quote.layerDeterminations[1].sourceDocumentIds = ["https://untrusted.invalid"];
    if (mode === "extraLine") value.response.calculation.lineItems.push(copy(value.response.calculation.lineItems[0]));
    if (mode === "index") value.response.quote.layerDeterminations[1].lineIndexes = [0];
    if (mode === "amount") value.response.calculation.lineItems[0].dutyAmount.amount = "0.00";
    if (mode === "total") value.response.calculation.estimatedSubtotal.amount = "1.00";
    if (mode === "rate") value.response.calculation.totalRatePercent = "500";
    if (mode === "canada") value.input.origin = "CA";
    assert.equal(projectQuote(value.response, value.input, target).completeness, "incomplete", mode);
  }
});

test("an incomplete result clears every stale numeric display and keeps explicit layer state", () => {
  const value = sample("AU"), nodes = elements();
  renderQuote(projectQuote(value.response, value.input, target), nodes, () => new Element());
  assert.notEqual(nodes.dutyDisplay.textContent, "—");
  value.response.quote.completeness = "incomplete";
  value.response.quote.layerDeterminations.find(row => row.layer === "special.section301.forced_labor").status = "unknown";
  renderQuote(projectQuote(value.response, value.input, target), nodes, () => new Element());
  assert.equal(nodes.resultNumbers.style.display, "none");
  for (const id of ["dutyDisplay", "rateDisplay", "totalDisplay"]) assert.equal(nodes[id].textContent, "—");
  assert.equal(nodes.rev22Evidence.hidden, false);
  assert.match(visible(nodes.rev22Evidence), /Unresolved/);
  assert.doesNotMatch(visible(nodes.breakdown), /\$/);
});

test("only projector snapshots render and validated snapshots cannot mutate afterwards", () => {
  const value = sample("AE"), model = projectQuote(value.response, value.input, target), nodes = elements();
  assert.throws(() => { model.calculation.dutyAmount.amount = "500.00"; }, TypeError);
  assert.throws(() => { model.layers[0].status = "approved"; }, TypeError);
  renderQuote({ ...model }, nodes, () => new Element());
  assert.equal(nodes.resultNumbers.style.display, "none");
});

test("source and rule text is rendered as text rather than HTML", () => {
  const value = sample("AE"), row = value.response.quote.layerDeterminations.find(x => x.status === "applied");
  row.ruleIds = ["<img src=x onerror=alert(1)>"];
  value.response.calculation.lineItems[row.lineIndexes[0]].ruleIds = [...row.ruleIds];
  const model = projectQuote(value.response, value.input, target), nodes = elements();
  renderQuote(model, nodes, () => new Element());
  assert.match(visible(nodes.rev22Evidence), /<img src=x/);
  assert.ok(nodes.rev22Evidence.children.every(child => child.children.every(part => !Object.hasOwn(part, "innerHTML"))));
});

function clientContext(options = {}) {
  let client = fs.readFileSync(path.join(__dirname, "../duty/calculator.js"), "utf8");
  if (options.binding) client = client.replace("const REV22_COMPILED_BINDING = null;", "const REV22_COMPILED_BINDING = Object.freeze(" + JSON.stringify(options.binding) + ");");
  const nodes = elements();
  for (const [name, value] of Object.entries(options.input || {})) nodes[name] = new Element(value);
  class TestDate extends Date { static now() { return Date.parse(options.now || "2026-10-31T16:00:00Z"); } }
  const context = { Date: TestDate, console, TextEncoder, crypto: webcrypto, URLSearchParams, AbortController, setTimeout, clearTimeout,
    document: { createElement: () => new Element(), getElementById: id => nodes[id] || (nodes[id] = new Element()) },
    window: {}, AttahirRev22Quote: { projectQuote, renderQuote } };
  vm.createContext(context);
  vm.runInContext(client.replace(/\ninit\(\);\s*$/, "\n"), context);
  return { context, nodes };
}

test("compiled production binding stays literally NULL and browser data cannot configure it", () => {
  const { context, nodes } = clientContext(), value = sample("AE");
  context.window.REV22_COMPILED_BINDING = { approved: true };
  context.REV22_COMPILED_BINDING = { approved: true };
  assert.equal(context.projectRev22PublicResponse(value.response, value.input, value.input.inputFingerprint), null);
  context.renderRev22PublicResponse(value.response, value.input, value.input.inputFingerprint);
  assert.equal(nodes.dutyDisplay.textContent, "—");
  assert.match(nodes.resultState.textContent, /not approved/);
});

// Structural test configuration only. The record hash is a labelled software
// token, never a signature, canonical record or approval receipt.
function softwareInputBinding() {
  const token = createHash("sha256").update("SOFTWARE TEST ONLY: NO CANONICAL RECORD OR AUTHORITY").digest("hex");
  return { schemaVersion: "tariff.public-rev22-binding/v1", candidateId: "authority-candidate:release-4-rev22-retained26-materialization-20261103-newproposal-2",
    rulesetVersion: "2026.11.03+release4.rev22.retained26.newproposal.2", rulesetPayloadHash: token, releaseRecordHash: token,
    candidateRawSha256: token, candidatePayloadSha256: token, exactInputPolicyHash: token,
    resultContractVersion: "tariff.result-contract/v3", scheduleRevision: "2026HTSRev22", inputContract: "us-qsp-ordinary-general-rev22/v3",
    coverageSliceId: "slice:release4:exact-qsp-rev22-ordinary-general", evidenceAsOf: "2026-10-31T15:28:10.000001Z",
    evidenceValidThrough: "2026-11-01T15:28:10Z", earliestEntryAt: "2026-10-31T15:28:10.000001Z" };
}

test("Rev22 form entry and quota guards compare the last microsecond without changing legacy parsing", () => {
  const binding = softwareInputBinding(), input = sample("AE").input;
  input.entryAt = input.qspQuotaReviewedAt = "2026-10-31T15:28:10.000001Z";
  const good = clientContext({ binding, input });
  assert.equal(good.context.readRev22ExactDutyInput().entryAt, input.entryAt);
  const before = clientContext({ binding, input: { ...input, entryAt: "2026-10-31T15:28:10Z" } });
  assert.throws(() => before.context.readRev22ExactDutyInput(), error => error.code === "REV22_ENTRY_BEFORE_REVIEWED_COVERAGE");
  const quota = clientContext({ binding, input: { ...input, qspQuotaReviewedAt: "2026-10-31T15:28:10Z" } });
  assert.throws(() => quota.context.readRev22ExactDutyInput(), error => error.code === "REV22_QUOTA_REVIEW_OUTSIDE_ENTRY_WINDOW");
  const future = clientContext({ binding, input: { ...input, entryAt: "2026-10-31T16:00:00.000001Z", qspQuotaReviewedAt: "2026-10-31T16:00:00.000001Z" } });
  assert.throws(() => future.context.readRev22ExactDutyInput(), error => error.code === "REV22_ENTRY_OUTSIDE_REVIEWED_COVERAGE");
  const oneMoreMicrosecond = clientContext({ binding: { ...binding, evidenceValidThrough: "2026-10-31T16:00:00.000001Z" }, input });
  assert.equal(oneMoreMicrosecond.context.readRev22ExactDutyInput().entryAt, input.entryAt);
  const expired = clientContext({ binding: { ...binding, evidenceValidThrough: "2026-10-31T16:00:00.000000Z" }, input });
  assert.throws(() => expired.context.readRev22ExactDutyInput(), error => error.code === "REV22_BINDING_OUTSIDE_REVIEW_WINDOW");
});

test("Rev22 microseconds preserve exact gateway identity while Rev20 behavior stays unchanged", () => {
  const { context } = clientContext();
  assert.equal(context.normalizeRev22EntryAt("2026-10-31T15:28:10.123456Z"), "2026-10-31T15:28:10.123456Z");
  assert.equal(context.normalizeRev22EntryAt("2026-10-31T15:28:10.123000Z"), "2026-10-31T15:28:10.123Z");
  assert.equal(context.normalizeEntryAt("2026-10-31T15:28:10.123456Z"), null);
  assert.equal(context.rev22InstantMicros("2026-11-01T15:28:09.999999Z") + 1n, context.rev22InstantMicros("2026-11-01T15:28:10Z"));
  for (const invalid of ["2026-02-30T00:00:00Z", "2026-10-31T15:28:10.1234567Z", "2026-10-31T15:28:10+00:00", "2026-10-31T25:00:00Z"]) assert.equal(context.normalizeRev22EntryAt(invalid), null);
});

test("incomplete evidence lives outside the hidden numeric wrapper in the actual page", () => {
  const html = fs.readFileSync(path.join(__dirname, "../duty/index.html"), "utf8");
  assert.match(html, /<div class="breakdown" id="rev22Evidence" hidden><\/div>\s*<div id="resultNumbers">/);
  const value = sample("AE"), nodes = elements();
  value.response.quote.completeness = "incomplete";
  renderQuote(projectQuote(value.response, value.input, target), nodes, () => new Element());
  assert.equal(nodes.resultNumbers.style.display, "none");
  assert.equal(nodes.rev22Evidence.hidden, false);
  assert.match(visible(nodes.rev22Evidence), /Approved use Not approved or unresolved/);
  assert.doesNotMatch(visible(nodes.rev22Evidence), /\$/);
});

function removeNumericLayer(value, layer, claim) {
  const calculation = value.response.calculation, rows = value.response.quote.layerDeterminations;
  const row = rows.find(item => item.layer === layer), index = row.lineIndexes[0];
  const removed = calculation.lineItems.splice(index, 1)[0];
  for (const other of rows) other.lineIndexes = other.lineIndexes.filter(i => i !== index).map(i => i > index ? i - 1 : i);
  row.status = "not_applicable";
  row.basis = layer === "special.section203.qsp_safeguard" ? "bound_policy_qsp_exempt_origin" : "bound_rule_explicit_brazil_origin_scope";
  row.claimIds = [claim];
  if (layer === "special.section203.qsp_safeguard") row.ruleIds = [];
  calculation.totalRatePercent = String(Number(calculation.totalRatePercent) - Number(removed.ratePercent));
  calculation.dutyAmount.amount = (Number(calculation.dutyAmount.amount) - Number(removed.dutyAmount.amount)).toFixed(2);
  calculation.estimatedSubtotal.amount = (Number(calculation.estimatedSubtotal.amount) - Number(removed.dutyAmount.amount)).toFixed(2);
}

function assertIncompleteClearsNumbers(value, message) {
  const nodes = elements(), good = sample("AE");
  renderQuote(projectQuote(good.response, good.input, target), nodes, () => new Element());
  const model = projectQuote(value.response, value.input, target);
  assert.equal(model.completeness, "incomplete", message);
  assert.equal(model.calculation, null, message);
  renderQuote(model, nodes, () => new Element());
  assert.equal(nodes.resultNumbers.style.display, "none", message);
  for (const id of ["dutyDisplay", "rateDisplay", "totalDisplay"]) assert.equal(nodes[id].textContent, "—", message);
  assert.equal(nodes.rev22Evidence.hidden, false, message);
}

test("M1 reconciled AE QSP and BR Brazil omissions cannot claim a scope exemption", () => {
  for (const [origin, layer, claim] of [["AE", "special.section203.qsp_safeguard", "qsp-exempt-origins"], ["BR", "special.section301.brazil", "brazil-ordinary-exclusions"]]) {
    const value = sample(origin), original = value.response.calculation.dutyAmount.amount;
    removeNumericLayer(value, layer, claim);
    assert.notEqual(value.response.calculation.dutyAmount.amount, original);
    assertIncompleteClearsNumbers(value, origin);
  }
});

test("M2 matching line labels cannot authorize unbound sources or unknown rules", () => {
  for (const mode of ["unknownSource", "unknownRule", "boundOtherOriginRule", "removedConsideredRule"]) {
    const value = sample("AE"), row = value.response.quote.layerDeterminations.find(item => item.layer === "special.section301.forced_labor");
    const line = value.response.calculation.lineItems[row.lineIndexes[0]];
    if (mode === "unknownSource") row.sourceDocumentIds = line.sourceDocumentIds = ["doc:sha256:" + "0".repeat(64)];
    if (mode === "unknownRule") row.ruleIds = line.ruleIds = ["rule:test.invalid:never-considered"];
    if (mode === "boundOtherOriginRule") row.ruleIds = line.ruleIds = ["rule:us.section301.release2.forced-labor.9903-05-23.assessed"];
    if (mode === "removedConsideredRule") value.response.quote.consideredRuleIds = value.response.quote.consideredRuleIds.filter(id => !row.ruleIds.includes(id));
    assertIncompleteClearsNumbers(value, mode);
  }
});

test("source identity and legal ledgers must equal the actual considered source closure", () => {
  for (const mode of ["identityValue", "identityProvenance", "identityOrigin", "legalValue", "legalProvenance", "legalOrigin", "quoteSources", "extraConsideredRule"]) {
    const value = sample("AE"), quote = value.response.quote;
    const identity = quote.factLedger.find(row => row.fact === "ruleset.source_documents"), legal = quote.factLedger.find(row => row.fact === "legal.applicability");
    const fake = "doc:sha256:" + "0".repeat(64);
    if (mode === "identityValue") identity.value = [fake];
    if (mode === "identityProvenance") identity.provenance = [fake];
    if (mode === "identityOrigin") identity.origin = "user_supplied";
    if (mode === "legalValue") legal.value = [];
    if (mode === "legalProvenance") legal.provenance = [fake];
    if (mode === "legalOrigin") legal.origin = "authority_bound";
    if (mode === "quoteSources") quote.sourceDocumentIds = [fake];
    if (mode === "extraConsideredRule") quote.consideredRuleIds.push("rule:test.invalid:never-considered");
    assertIncompleteClearsNumbers(value, mode);
  }
});

test("conditional QSP and Brazil facts cannot disappear from both request and ledger", () => {
  for (const [origin, field, name] of [["AE", "qspHeading", "program.section203.qsp.heading"], ["AE", "qspQuotaStatus", "entry.qspQuotaStatus"],
    ["AE", "qspQuotaEvidenceRef", "entry.qspQuotaEvidenceRef"], ["AE", "qspQuotaReviewedAt", "entry.qspQuotaReviewedAt"], ["BR", "brazilHeading", "program.section301.brazil.heading"]]) {
    const value = sample(origin); delete value.input[field];
    value.response.quote.factLedger = value.response.quote.factLedger.filter(row => row.fact !== name);
    assertIncompleteClearsNumbers(value, field);
  }
});

test("applied rule qualification must match the selected QSP heading and bound origin", () => {
  for (const mode of ["heading", "unknownOrigin", "forcedHeading", "quotaDisposition"]) {
    const value = sample("AE"), facts = value.response.quote.factLedger;
    if (mode === "heading") {
      value.input.qspHeading = "9903.45.31"; value.input.qspQuotaStatus = "confirmed_over_quota";
      facts.find(row => row.fact === "program.section203.qsp.heading").value = value.input.qspHeading;
      facts.find(row => row.fact === "entry.qspQuotaStatus").value = value.input.qspQuotaStatus;
    }
    if (mode === "unknownOrigin") { value.input.origin = "ZZ"; facts.find(row => row.fact === "origin.country").value = "ZZ"; }
    if (mode === "forcedHeading") { value.input.forcedLaborCountryHeading = "9903.05.23"; facts.find(row => row.fact === "program.section301.forcedLabor.countryHeading").value = value.input.forcedLaborCountryHeading; }
    if (mode === "quotaDisposition") { value.input.qspQuotaStatus = "confirmed_over_quota"; facts.find(row => row.fact === "entry.qspQuotaStatus").value = value.input.qspQuotaStatus; }
    assertIncompleteClearsNumbers(value, mode);
  }
});

test("public scope is fixed exact-source preparation metadata, never response configuration", () => {
  const source = fs.readFileSync(path.join(__dirname, "../duty/rev22-quote.js"), "utf8");
  const scopeRaw = source.split("/* BEGIN GENERATED PUBLIC SCOPE JSON */\n")[1].split("\n/* END GENERATED PUBLIC SCOPE JSON */")[0];
  assert.equal(createHash("sha256").update(scopeRaw).digest("hex"), "30ecd770dbfd5eb64e2c72c2542e0533f1c8e215acf21fa3030414feb8010ec9");
  const scopes = JSON.parse(scopeRaw);
  assert.equal(scopes.authorityState, "unsigned_preparation_only_not_approved");
  assert.equal(scopes.software.sourceDocumentIds.length, 1);
  assert.equal(scopes.materialization.sourceDocumentIds.length, 26);
  assert.equal(scopes.software.rules.length, 56);
  assert.equal(scopes.materialization.rules.length, 56);
  assert.equal(scopes.materialization.rulesetPayloadHash, "c197654ed22aececc1ff020879fb246fc0b4c0714424b97d2e02073f15219c2f");
  assert.doesNotMatch(scopeRaw, /owner|session|approvedBy|reviewers|private|\/Users\//i);
  const value = sample("AE"); removeNumericLayer(value, "special.section203.qsp_safeguard", "qsp-exempt-origins");
  value.response.scope = { qspExemptEligibleOrigins: ["AE"] };
  const injected = Object.freeze({ ...target, scope: value.response.scope });
  assert.equal(projectQuote(value.response, value.input, injected).completeness, "incomplete");
});
