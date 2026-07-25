#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const modifiedDate = "2026-07-25";
const checkedAt = "2026-07-25T22:30:00Z";
const reviewAfter = "2026-07-28T04:01:00Z";
const universalWarning =
  "No universal current U.S. tariff rate is available from country of origin alone.";

const sources = {
  s122: {
    id: "fr_2026_03824",
    label: "Federal Register 2026-03824 — Proclamation 11012",
    url: "https://federalregister.gov/documents/2026/02/25/2026-03824/imposing-a-temporary-import-surcharge-to-address-fundamental-international-payments-problems",
  },
  brazil: {
    id: "ustr_brazil_final_2026_07",
    label: "USTR — final Brazil Section 301 action",
    url: "https://ustr.gov/about/policy-offices/press-office/press-releases/2026/july/ustr-section-301-action-brazils-unreasonable-acts-policies-and-practices",
  },
  forced: {
    id: "ustr_forced_labor_final_2026_07",
    label: "USTR — final forced-labor Section 301 action",
    url: "https://ustr.gov/about/policy-offices/press-office/press-releases/2026/july/ustr-takes-action-forced-labor-section-301-investigations",
  },
  forcedNotice: {
    id: "ustr_forced_labor_prepublication_2026_07_23",
    label: "USTR — final-action prepublication notice",
    url: "https://ustr.gov/sites/default/files/files/Press/Releases/2026/FLIP%20301%20Investigation%20Final%20Action%20FRN%207-23-26%20FINAL.pdf",
  },
  canada: {
    id: "ustr_section338_canada_2026",
    label: "USTR — Section 338 actions on Canadian products",
    url: "https://ustr.gov/about/policy-offices/press-office/press-releases/2026/july/ambassador-greer-issues-statement-president-trump-imposing-section-338-tariffs-canada",
  },
  canadaAlcohol: {
    id: "fr_2026_14991",
    label: "Federal Register 2026-14991 — listed Canadian alcohol products",
    url: "https://federalregister.gov/documents/2026/07/23/2026-14991/imposing-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united",
  },
  canadaDairy: {
    id: "fr_2026_14992",
    label: "Federal Register 2026-14992 — listed Canadian dairy products",
    url: "https://federalregister.gov/documents/2026/07/23/2026-14992/imposing-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united",
  },
  canadaMotor: {
    id: "fr_2026_14997",
    label: "Federal Register 2026-14997 — listed Canadian motor products",
    url: "https://federalregister.gov/documents/2026/07/23/2026-14997/imposing-additional-duties-to-offset-canadian-discrimination-against-the-commerce-of-the-united",
  },
  hts: {
    id: "usitc_current_hts",
    label: "USITC — current Harmonized Tariff Schedule",
    url: "https://hts.usitc.gov/",
  },
  cbp: {
    id: "cbp_determining_duty_rates",
    label: "CBP — determining duty rates",
    url: "https://www.cbp.gov/trade/programs-administration/determining-duty-rates",
  },
  usmca: {
    id: "ustr_usmca",
    label: "USTR — United States-Mexico-Canada Agreement",
    url: "https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement",
  },
  canadaTariff: {
    id: "cbsa_2026_customs_tariff",
    label: "CBSA — 2026 Customs Tariff",
    url: "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html",
  },
  canadaOrigin: {
    id: "cbsa_cusma_origin",
    label: "CBSA — certifying the origin of goods under CUSMA",
    url: "https://www.cbsa-asfc.gc.ca/services/cusma-aceum/cog-com-eng.html",
  },
  canadaTrade: {
    id: "canada_trade_agreements",
    label: "Global Affairs Canada — trade agreements and negotiations",
    url: "https://international.canada.ca/en/services/business/trade/agreements-negotiations",
  },
  cbpUsmca: {
    id: "cbp_usmca",
    label: "CBP — USMCA implementation",
    url: "https://www.cbp.gov/trade/priority-issues/trade-agreements/USMCA",
  },
  deMinimisNonPostal: {
    id: "fr_2026_12670",
    label: "Federal Register 2026-12670 — non-postal de minimis suspension",
    url: "https://federalregister.gov/documents/2026/06/24/2026-12670/indefinite-suspension-of-the-de-minimis-exemption-for-merchandise-arriving-through-all-modes-other",
  },
  deMinimisPostal: {
    id: "fr_2026_12669",
    label: "Federal Register 2026-12669 — postal de minimis suspension",
    url: "https://federalregister.gov/documents/2026/06/24/2026-12669/indefinite-suspension-of-the-de-minimis-exemption-for-mail-shipments-and-new-postal-informal-entry",
  },
};

const commonSources = ["s122", "brazil", "forced", "canada", "hts", "cbp"];

const pages = [
  {
    slug: "cusma-usmca-guide",
    title: "CUSMA/USMCA in 2026: Qualification Is Not the Whole Duty Answer",
    description:
      "USMCA qualification can reduce ordinary duty, but separate product-targeted U.S. measures still require HTS, entry, and exception checks.",
    events: ["us_section301_forced_labor_2026", "us_section338_canada_2026"],
    sourceKeys: [
      "usmca",
      "canadaTariff",
      "canadaOrigin",
      "canadaTrade",
      "cbpUsmca",
      "forced",
      "canada",
      "canadaAlcohol",
      "canadaDairy",
      "canadaMotor",
      "hts",
      "cbp",
    ],
    points: [
      "USMCA remains in force. A qualifying good may receive its agreement preference, but that preference is not a promise that every other duty layer is zero.",
      "The July forced-labor Section 301 action remains product-, economy-, MFN-, entry-, and exemption-dependent.",
      "The three Section 338 actions are separate from USMCA and apply only to listed Canadian alcohol, dairy, and motor-vehicle products from August 19.",
    ],
    faq: [
      {
        question: "Q: Is CUSMA/USMCA still in force in 2026?",
        answer:
          "Yes. The agreement remains in force. Later product-targeted Section 301 and Section 338 actions are separate measures, not termination of the agreement.",
      },
      {
        question: "Q: Does CUSMA qualification guarantee zero total U.S. duty?",
        answer:
          "No. Qualification may reduce ordinary duty, but separate product-targeted measures and their exceptions still require review.",
      },
      {
        question: "Q: Is there one current duty rate for all Canadian goods?",
        answer:
          "No. The answer depends on classification, origin qualification, product schedules, entry timing, and applicable exceptions.",
      },
      {
        question: "Q: Do the Section 338 actions apply to every Canadian product?",
        answer:
          "No. They are future additional duties for listed alcohol, dairy, and motor-vehicle products beginning August 19.",
      },
      {
        question: "Q: What evidence is needed to claim CUSMA treatment?",
        answer:
          "Use the required origin-certification data and retain support for the applicable product-specific rule of origin. Check current CBSA or CBP guidance for the entry.",
      },
      {
        question: "Q: Can a country-only calculator confirm CUSMA eligibility?",
        answer:
          "No. Eligibility requires product classification, origin facts, and supporting documentation that a country-only planning snapshot does not evaluate.",
      },
      {
        question: "Q: What should I do when a required tariff fact is missing?",
        answer:
          "Keep the result indeterminate and review required until the current tariff schedule, product scope, entry date, and exceptions are verified.",
      },
    ],
  },
  {
    slug: "de-minimis-threshold-2026",
    title: "De Minimis Threshold 2026: Entry Rules Do Not Determine the Tariff Rate",
    description:
      "The 2026 low-value entry changes affect entry treatment, not the product-specific duty answer.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["deMinimisNonPostal", "deMinimisPostal", "s122", "forced", "hts", "cbp"],
    points: [
      "The June non-postal and July postal changes must be evaluated as entry rules. They do not supply a product's HTS classification or Chapter 99 treatment.",
      "Proclamation 11012 reached its stated endpoint at 12:01 a.m. EDT on July 24. Its former surcharge is historical, not a current layer to keep adding.",
      "Low value does not turn the July forced-labor action into one flat country rate.",
    ],
  },
  {
    slug: "how-to-calculate-landed-cost",
    title: "How to Calculate Landed Cost in 2026 Without Guessing the Duty",
    description:
      "A fail-closed landed-cost workflow that separates known freight and fees from an unverified product-specific duty result.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "forced", "hts", "cbp"],
    points: [
      "Add known purchase price, freight, insurance, brokerage, and fees normally; keep duty indeterminate until the HTS, origin, entry time, and special-program facts are verified.",
      "Do not carry the expired Section 122 surcharge forward and do not simply subtract it from an older worked total.",
      "The July Section 301 action cannot be applied safely from country of origin alone.",
    ],
  },
  {
    slug: "hts-code-lookup",
    title: "HTS Code Lookup in 2026: Base Classification Plus Chapter 99 Checks",
    description:
      "Use the current HTS and CBP rulings, then evaluate each event-specific Chapter 99 measure and exception.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_brazil_2026", "us_section301_forced_labor_2026", "us_section338_canada_2026"],
    sourceKeys: commonSources,
    points: [
      "The USITC lookup provides the base classification framework. It does not by itself resolve every Chapter 99 overlay or exception.",
      "The former Section 122 surcharge reached its stated endpoint. Brazil, forced-labor, and Canada actions each have their own product schedules and exceptions.",
      "Return indeterminate whenever the full HTS, product scope, entry time, or exemption state is missing.",
    ],
  },
  {
    slug: "hts-code-reclassification-tariff-margin",
    title: "HTS Reclassification and Margin Risk: Rebuild the Duty Stack",
    description:
      "Reclassification can change base and special-duty treatment, but obsolete and mutually excluded tariff layers must not be stacked.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "forced", "hts", "cbp"],
    points: [
      "A classification change can move a product into or out of an HTS schedule, so the entire entry must be recalculated from controlling sources.",
      "The former Section 122 layer is historical, and its same-portion Section 232 exception makes old additive examples unsafe.",
      "Do not add the forced-labor action without evaluating its product schedule, economy mode, MFN formula, timing, and exceptions.",
    ],
  },
  {
    slug: "import-duty-from-india-to-us",
    title: "Import Duty from India to the U.S. in 2026: Product-Specific Verification",
    description:
      "India origin alone no longer supports a single current U.S. duty result.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "The former Section 122 surcharge reached its stated endpoint and must not remain in current India totals.",
      "The July forced-labor action includes India, but only within its product, entry, exemption, and Section 232 rules.",
      "Verify the complete HTS and entry facts; do not publish a blanket India percentage.",
    ],
  },
  {
    slug: "import-duty-from-japan-to-us-2026",
    title: "Import Duty from Japan to the U.S. in 2026: MFN Formula Required",
    description:
      "Japan's July Section 301 treatment uses a product- and MFN-dependent formula, not one country rate.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "The temporary Section 122 layer is historical after its stated endpoint.",
      "Japan's forced-labor action mode is a net-of-MFN formula. The answer depends on the base MFN rate, product schedule, entry time, and exceptions.",
      "Without those selectors, the correct product-level output is indeterminate.",
    ],
  },
  {
    slug: "import-duty-from-mexico-to-us-2026",
    title: "Import Duty from Mexico to the U.S. in 2026: USMCA Plus Product Checks",
    description:
      "USMCA qualification and the July Section 301 action are separate tests; Mexico does not have one current all-product rate.",
    events: ["us_section301_forced_labor_2026"],
    sourceKeys: ["usmca", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "USMCA can provide a preference when the product satisfies its rules of origin and documentation requirements.",
      "The July forced-labor Section 301 action is a separate product-targeted measure with timing and exception rules.",
      "Do not turn Mexico origin or USMCA eligibility into one universal all-in duty number.",
    ],
  },
  {
    slug: "import-duty-from-vietnam-to-us",
    title: "U.S. Import Duty on Vietnam Apparel in 2026: HTS and Scope Required",
    description:
      "Vietnam apparel duty requires the garment HTS and current product-specific action checks; old Section 122 totals are retired.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "Apparel rates vary materially by fiber, construction, gender, and garment type, so the full HTS classification remains essential.",
      "The temporary Section 122 surcharge reached its endpoint and no longer belongs in a current Vietnam example.",
      "The forced-labor action is product- and exception-dependent; Vietnam origin alone is insufficient.",
    ],
  },
  {
    slug: "section-232-tariffs-explained",
    title: "Section 232 Tariffs Explained: Verify Scope and Non-Stacking Rules",
    description:
      "Section 232 treatment is product-specific and must be reconciled with each event's exclusion and same-portion rules.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_brazil_2026", "us_section301_forced_labor_2026", "us_section338_canada_2026"],
    sourceKeys: commonSources,
    points: [
      "Section 232 applies only where the current HTS and controlling proclamation place the product or content in scope.",
      "Old examples that added Section 232, Section 301, and Section 122 mechanically have been retired; the measures contain different exclusions and same-portion rules.",
      "Brazil, forced-labor, and Canada actions require event-specific Section 232 exception evaluation.",
    ],
  },
  {
    slug: "section-232-pharma-tariffs-2026",
    title: "Section 232 Pharma in 2026: Keep July Section 301 Changes Separate",
    description:
      "Scheduled Brazil and forced-labor pharmaceutical amendments are Section 301 changes, not proof of one general Section 232 pharma rate.",
    events: ["us_section301_brazil_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["brazil", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "The scheduled July 31 pharmaceutical schedule changes belong to the Brazil and forced-labor Section 301 actions.",
      "They do not establish one general Section 232 pharmaceutical rate and must not be represented that way.",
      "Product classification, schedule coverage, entry time, and exceptions must be verified before any numeric result.",
    ],
  },
  {
    slug: "section-301-vs-section-232-vs-section-122",
    title: "Section 301 vs. Section 232 vs. Section 122: July 2026 Status",
    description:
      "Section 122 is historical after its stated endpoint; Section 301 and Section 232 remain event- and product-specific.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_brazil_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "brazil", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "Section 122: Proclamation 11012 reached its stated endpoint at 12:01 a.m. EDT on July 24.",
      "Section 301 now includes distinct Brazil and forced-labor actions in addition to legacy programs; each has its own scope.",
      "Section 232 remains product-specific. Never add these authorities mechanically without checking their interaction rules.",
    ],
  },
  {
    slug: "shopify-import-duties",
    title: "Shopify Import Duties in 2026: Use a Source-and-Status Workflow",
    description:
      "Replace flat country tables with a product, HTS, origin, entry-time, and exception workflow.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026", "us_section338_canada_2026"],
    sourceKeys: ["s122", "forced", "canada", "usmca", "hts", "cbp"],
    points: [
      "A checkout or catalog needs a review state when current product facts are incomplete; a flat country table is not a customs result.",
      "The former Section 122 surcharge is historical, the forced-labor action is product-dependent, and the future Canada action covers only listed products.",
      "USMCA remains in force, but it does not erase every separate product-targeted measure.",
    ],
  },
  {
    slug: "us-china-tariff-rates-2026",
    title: "U.S.-China Tariffs in 2026: No Single Current All-Product Rate",
    description:
      "Legacy China Section 301 lists remain product-specific, Section 122 is historical, and the July forced-labor action requires selectors.",
    events: ["us_section122_temporary_surcharge_2026", "us_section301_forced_labor_2026"],
    sourceKeys: ["s122", "forced", "forcedNotice", "hts", "cbp"],
    points: [
      "Legacy China Section 301 treatment still depends on the exact HTS list and exclusions.",
      "The temporary Section 122 surcharge reached its stated endpoint, so older combined ranges and worked totals are not current.",
      "The July forced-labor action adds another product- and exception-dependent evaluation; do not start from a country-only number.",
    ],
  },
  {
    slug: "usmca-not-renewed-2026-shopify-tariff-risk",
    title: "USMCA Was Not Renewed in 2026. It Did Not End.",
    description:
      "USMCA remains in force; later product-targeted Section 301 and Section 338 actions are separate and do not equal termination.",
    events: ["us_section301_forced_labor_2026", "us_section338_canada_2026"],
    sourceKeys: ["usmca", "forced", "canada", "canadaAlcohol", "canadaDairy", "canadaMotor", "hts", "cbp"],
    points: [
      "The 2026 joint review did not terminate USMCA, and qualifying goods can still use the agreement preference.",
      "The later forced-labor Section 301 and Canadian Section 338 actions are separate legal measures.",
      "The Section 338 actions cover listed alcohol, dairy, and motor products from August 19; they are not a tariff on all Canadian goods.",
    ],
  },
  {
    slug: "proposed-section-301-forced-labor-tariffs-2026",
    title: "Final Forced-Labor Section 301 Action: Product Scope Comes First",
    description:
      "USTR took final action effective July 24, but economy, product, MFN, entry, and exception selectors still control the result.",
    events: ["us_section301_forced_labor_2026"],
    sourceKeys: ["forced", "forcedNotice", "hts", "cbp"],
    numericClaims: [
      {
        claimId: "forced-labor-named-economies-tier",
        value: 10,
        unit: "percent",
        status: "supported_scope_limited",
      },
      {
        claimId: "forced-labor-general-tier",
        value: 12.5,
        unit: "percent",
        status: "supported_scope_limited",
      },
    ],
    points: [
      "USTR took final action rather than leaving the June proposal pending.",
      'The notice includes <span data-tariff-claim-id="forced-labor-named-economies-tier">10%</span> and <span data-tariff-claim-id="forced-labor-general-tier">12.5%</span> event tiers, plus net-of-MFN formulas for specified economies.',
      "Those figures are not flat all-product country rates. Product schedules, MFN, entry time, exemptions, and Section 232 status can change the result.",
    ],
  },
  {
    slug: "us-brazil-section-301-tariff-2026",
    title: "U.S. Brazil Section 301 Action: 25% Applies Only to Covered Products",
    description:
      "The Brazil Section 301 additional duty applies only to covered products and remains indeterminate without HTS, timing, and exception facts.",
    events: ["us_section301_brazil_2026"],
    sourceKeys: ["brazil", "hts", "cbp"],
    newPage: true,
    numericClaims: [
      {
        claimId: "brazil-covered-products-additional-rate",
        value: 25,
        unit: "percent",
        status: "supported_scope_limited",
      },
    ],
    points: [
      'The final action includes a <span data-tariff-claim-id="brazil-covered-products-additional-rate">25% additional duty</span> only for products in the controlling schedules.',
      "Product exclusions, transition eligibility, entry time, and Section 232 status can change the result.",
      "Brazil origin alone is insufficient; return indeterminate when the HTS/product or exception facts are missing.",
    ],
  },
  {
    slug: "us-section-338-canada-tariffs-2026",
    title: "U.S. Section 338 Actions on Canadian Alcohol, Dairy, and Motor Products",
    description:
      "The three Section 338 actions are future, listed-product measures—not a current tariff on all Canadian goods.",
    events: ["us_section338_canada_alcohol_2026", "us_section338_canada_dairy_2026", "us_section338_canada_motor_2026"],
    sourceKeys: ["canada", "canadaAlcohol", "canadaDairy", "canadaMotor", "usmca", "hts", "cbp"],
    newPage: true,
    numericClaims: [
      {
        claimId: "canada-section338-listed-products-rate",
        value: 50,
        unit: "percent",
        status: "supported_future_scope_limited",
      },
    ],
    points: [
      'The three proclamations provide a future <span data-tariff-claim-id="canada-section338-listed-products-rate">50% additional duty</span> for listed alcohol, dairy, and motor-vehicle products beginning August 19.',
      "They are not a tariff on all Canadian goods and do not terminate USMCA.",
      "Do not calculate a current Section 338 amount before the effective-instant HTSUS and CBP implementation state is verified.",
    ],
  },
];

const eventSourceIds = Object.fromEntries(
  Object.entries(sources).map(([key, value]) => [key, value.id]),
);

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function pagePath(page) {
  return `/blog/${page.slug}/`;
}

function articleMarkup(page) {
  const sourceList = page.sourceKeys
    .map((key) => {
      const source = sources[key];
      return `<li><a href="${source.url}" rel="noopener" target="_blank">${source.label}</a></li>`;
    })
    .join("\n");
  const points = page.points.map((point) => `<li>${point}</li>`).join("\n");
  const faq = page.faq
    ? `<h2 id="faq">Frequently Asked Questions</h2>
<div class="faq">
${page.faq
  .map(
    (item) => `<div class="faq-item">
<div class="faq-q">${item.question}</div>
<div class="faq-a">${item.answer}</div>
</div>`,
  )
  .join("\n")}
</div>`
    : "";
  return `<article class="post-content" data-tariff-authority-state="review-required">
<a class="back-link" href="/blog/">← Back to Blog</a>
<p class="post-meta">Authority status update · July 25, 2026</p>
<h1>${page.title}</h1>
<p class="lead">${page.description}</p>
<div class="callout">
<p><strong>${universalWarning}</strong></p>
<p>Classification, product scope, origin, entry time, MFN treatment, Section 232 status, and exemptions can change the result. When any required selector is missing, the safe output is <strong>indeterminate / review required</strong>.</p>
</div>
<h2>What the reviewed sources support</h2>
<ul>
${points}
</ul>
<h2>What to do before pricing or filing</h2>
<ol>
<li>Confirm the complete HTS classification and the product description used for entry.</li>
<li>Check the current HTSUS and controlling Chapter 99 notes for the entry date.</li>
<li>Evaluate product schedules, transition rules, Section 232 interaction, and exclusions.</li>
<li>Keep the result in review-required state until every selector and source is resolved.</li>
</ol>
<p>The Attahir Labs rate table and TariffShield use fail-closed containment while the legacy country snapshots lack current row-level provenance. They must not supply a current numeric customs result.</p>
${faq}
<section class="references" id="sources">
<h2>Reviewed official sources</h2>
<ol>
${sourceList}
</ol>
<p><strong>Checked through:</strong> July 25, 2026 at 22:30 UTC. Re-review required no later than July 28, 2026 at 04:01 UTC or sooner if an official source changes.</p>
</section>
<p><strong>Disclaimer:</strong> Informational content only. Verify the current HTSUS and CBP instructions or use a licensed customs broker for an entry-specific decision.</p>
</article>`;
}

function replaceMetaTag(html, selector, replacement) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${selector.attribute}\\s*=\\s*["']${selector.value}["'])[^>]*>`,
    "i",
  );
  if (!pattern.test(html)) return html;
  return html.replace(pattern, replacement);
}

function transformDocument(html, page) {
  const articleStart = html.search(/<article(?:\s[^>]*)?>/i);
  const articleEndStart = html.indexOf("</article>", articleStart);
  if (articleStart < 0 || articleEndStart < 0) {
    throw new Error(`Cannot locate article boundary for ${page.slug}`);
  }
  const articleEnd = articleEndStart + "</article>".length;
  html = `${html.slice(0, articleStart)}${articleMarkup(page)}${html.slice(articleEnd)}`;

  const canonical = `https://attahirlabs.com${pagePath(page)}`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title} | Attahir Labs</title>`);
  html = replaceMetaTag(
    html,
    { attribute: "name", value: "description" },
    `<meta name="description" content="${escapeAttribute(page.description)}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "property", value: "og:title" },
    `<meta property="og:title" content="${escapeAttribute(page.title)}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "property", value: "og:description" },
    `<meta property="og:description" content="${escapeAttribute(page.description)}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "name", value: "twitter:title" },
    `<meta name="twitter:title" content="${escapeAttribute(page.title)}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "name", value: "twitter:description" },
    `<meta name="twitter:description" content="${escapeAttribute(page.description)}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "property", value: "og:url" },
    `<meta property="og:url" content="${canonical}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "property", value: "og:image:alt" },
    `<meta property="og:image:alt" content="${escapeAttribute(page.description)}">`,
  );
  html = replaceMetaTag(
    html,
    { attribute: "property", value: "article:modified_time" },
    `<meta property="article:modified_time" content="${modifiedDate}">`,
  );
  html = html.replace(
    /<meta\b(?=[^>]*\bname\s*=\s*["']keywords["'])[^>]*>\s*/i,
    "",
  );
  if (page.newPage) {
    html = html.replace(
      /<meta\b(?=[^>]*\b(?:property|name)\s*=\s*["'](?:og:image(?::width|:height|:alt)?|twitter:image)["'])[^>]*>\s*/gi,
      "",
    );
  }
  html = html.replace(
    /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/gi,
    "",
  );
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${canonical}">\n</head>`,
  );
  html = html.replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    "",
  );
  const structured = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    mainEntityOfPage: canonical,
    dateModified: modifiedDate,
    author: { "@type": "Organization", name: "Attahir Labs" },
    publisher: { "@type": "Organization", name: "Attahir Labs" },
  };
  const structuredScripts = [
    structured,
    ...(page.faq
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          },
        ]
      : []),
  ]
    .map(
      (item) =>
        `<script type="application/ld+json">${JSON.stringify(item)}</script>`,
    )
    .join("\n");
  html = html.replace(
    "</head>",
    `${structuredScripts}\n</head>`,
  );
  return html;
}

function writePage(page, baseTemplate) {
  const file = path.join(root, "blog", page.slug, "index.html");
  if (page.newPage) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, transformDocument(baseTemplate, page));
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, transformDocument(html, page));
}

function updateBlogIndex() {
  const file = path.join(root, "blog", "index.html");
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    /\s*<p class="tariff-authority-warning"[^>]*>[\s\S]*?<\/p>\s*/g,
    "\n",
  );
  html = html.replace(
    /\s*<!-- tariff-authority-cards:start -->[\s\S]*?<!-- tariff-authority-cards:end -->\s*/g,
    "\n",
  );
  html = html.replace(
    '<div class="container">',
    '<div class="container" data-tariff-authority-state="review-required">',
  );
  html = html
    .replace(
      "Current US apparel tariff rate from Vietnam, Section 122, HTS garment lookup, origin evidence, and Vietnam-vs-China landed-cost modeling.",
      "Vietnam apparel duty now requires the garment HTS, current Chapter 99 scope, entry timing, and exception checks.",
    )
    .replace(
      "Section 301, Section 122, Section 232, and the actual duty ranges importers are planning around.",
      "China duties remain product-specific; the temporary Section 122 layer is historical and July Section 301 scope requires review.",
    )
    .replace(
      "Proposed Section 301 Forced-Labor Tariffs: What Shopify Merchants Should Do Now",
      "Final Forced-Labor Section 301 Action: Product Scope Comes First",
    )
    .replace(
      "USTR proposed new 10% and 12.5% Section 301 tariff tiers on imports from 60 economies. The rates are not final yet, but Shopify merchants should model SKU-level exposure now.",
      "USTR took final action effective July 24. Economy, product, MFN, entry, and exception selectors still control every product result.",
    )
    .replace(
      "A refreshed 2026 guide to Section 301, Section 232, and Section 122 tariff layers, including origin checks, product-scope risk, and current Section 122 exceptions.",
      "July status: Section 122 is historical after its endpoint; Section 301 and Section 232 remain event- and product-specific.",
    )
    .replace(
      "For apparel imports from Vietnam, the current US tariff is usually the garment's HTS apparel duty plus the temporary 10% Section 122 surcharge. See the likely duty range, Vietnam vs China comparison, origin-risk checks, and landed-cost math.",
      "Vietnam apparel duty requires the garment HTS, product scope, entry timing, and exception state; no flat country result is published.",
    )
    .replace(
      "Steel at 50%. Aluminum at 50%. Autos at 25%. Copper at 50%. Section 232 tariffs are the heaviest product-specific duties in the US — and they stack on top of everything else. Here's what importers and manufacturers need to know.",
      "Section 232 is product-specific and must be reconciled with each event's exclusion and same-portion rules before calculating.",
    )
    .replace(
      "A refreshed guide to the tariff stack importers are actually dealing with now: the Section 122 baseline, China-specific Section 301 duties, product-specific Section 232 exposure, and the practical ranges you should use for landed-cost planning.",
      "A source-first guide: the temporary Section 122 layer is historical, while current Section 301 and Section 232 treatment requires product facts.",
    );
  html = html.replace(
    /(<p class="subtitle">[\s\S]*?<\/p>)/,
    `$1
<p class="tariff-authority-warning" role="status"><strong>Tariff-rate notice:</strong> ${universalWarning}</p>`,
  );

  const insertion = `        <!-- tariff-authority-cards:start -->
        <div class="post-card">
            <a href="/blog/us-brazil-section-301-tariff-2026/">
                <div class="post-meta"><span class="post-tag">Tariffs</span> July 25, 2026</div>
                <h2>U.S. Brazil Section 301 Action: 25% Applies Only to Covered Products</h2>
                <p class="post-excerpt">Covered-product action with HTS, transition, entry-time, exception, and Section 232 checks—not a flat Brazil rate.</p>
            </a>
        </div>
        <div class="post-card">
            <a href="/blog/us-section-338-canada-tariffs-2026/">
                <div class="post-meta"><span class="post-tag">Tariffs</span> July 25, 2026</div>
                <h2>U.S. Section 338 Actions on Canadian Alcohol, Dairy, and Motor Products</h2>
                <p class="post-excerpt">Future listed-product actions beginning August 19—not a current tariff on all Canadian goods and not the end of USMCA.</p>
            </a>
        </div>
        <!-- tariff-authority-cards:end -->
`;
  const gridMarker = '<div class="post-card has-image">';
  let gridIndex = html.indexOf(gridMarker);
  if (gridIndex < 0) throw new Error("Cannot locate blog card grid");
  const existingStart = html.indexOf(
    '<div class="post-card">\n            <a href="/blog/us-brazil-section-301-tariff-2026/">',
  );
  if (existingStart >= 0 && existingStart < gridIndex) {
    html = `${html.slice(0, existingStart)}${html.slice(gridIndex)}`;
    gridIndex = html.indexOf(gridMarker);
  }
  html = `${html.slice(0, gridIndex)}${insertion}${html.slice(gridIndex)}`;
  fs.writeFileSync(file, html);
}

function updateFailClosedTools() {
  const tools = [
    {
      relativePath: "duty/index.html",
      container: '<div class="container">',
      noticeTitle:
        '<h2 id="dutyAccuracyTitle">Accuracy &amp; freshness notice</h2>',
    },
    {
      relativePath: "duty/rates/index.html",
      container: '<div class="container">',
      noticeTitle:
        '<h2 id="ratesAccuracyTitle">Accuracy &amp; freshness notice</h2>',
    },
  ];
  const notice = `<p class="tariff-authority-warning"><strong>Historical country-level planning snapshot only.</strong> No current numeric result is available. ${universalWarning}</p>`;
  for (const tool of tools) {
    const file = path.join(root, tool.relativePath);
    let html = fs.readFileSync(file, "utf8");
    html = html.replace(
      tool.container,
      '<div class="container" data-tariff-authority-state="review-required">',
    );
    html = html.replace(
      /\s*<p class="tariff-authority-warning">[\s\S]*?<\/p>\s*/g,
      "\n",
    );
    if (!html.includes(tool.noticeTitle)) {
      throw new Error(`Cannot locate accuracy notice in ${tool.relativePath}`);
    }
    html = html.replace(
      tool.noticeTitle,
      `${tool.noticeTitle}
        ${notice}`,
    );
    fs.writeFileSync(file, html);
  }
}

function updateSitemap() {
  const file = path.join(root, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");
  const paths = [
    "/blog/",
    "/duty/",
    "/duty/rates/",
    ...pages.filter((page) => !page.newPage).map(pagePath),
  ];
  for (const pathname of paths) {
    const escaped = pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(<loc>https://attahirlabs\\.com${escaped}</loc>\\s*<lastmod>)[^<]+`,
    );
    if (!pattern.test(xml)) {
      throw new Error(`Sitemap is missing ${pathname}`);
    }
    xml = xml.replace(pattern, `$1${modifiedDate}`);
  }
  for (const page of pages.filter((item) => item.newPage)) {
    const canonical = `https://attahirlabs.com${pagePath(page)}`;
    if (xml.includes(`<loc>${canonical}</loc>`)) {
      const escaped = pagePath(page).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      xml = xml.replace(
        new RegExp(
          `(<loc>https://attahirlabs\\.com${escaped}</loc>\\s*<lastmod>)[^<]+`,
        ),
        `$1${modifiedDate}`,
      );
      continue;
    }
    xml = xml.replace(
      "</urlset>",
      `  <url>
    <loc>${canonical}</loc>
    <lastmod>${modifiedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`,
    );
  }
  fs.writeFileSync(file, xml);
}

function writeManifest() {
  const records = [
    {
      path: "/duty/",
      title: "Historical Import-Duty Planning Snapshot",
      contentRole: "tool",
      eventIds: ["legacy_dutycalc_snapshot_2026_03_18"],
      authorityIds: [],
      numericClaims: [],
    },
    {
      path: "/duty/rates/",
      title: "Historical Tariff Planning Table",
      contentRole: "tool",
      eventIds: ["legacy_dutycalc_snapshot_2026_03_18"],
      authorityIds: [],
      numericClaims: [],
    },
    ...pages.map((page) => ({
      path: pagePath(page),
      title: page.title,
      contentRole: page.newPage || page.slug === "proposed-section-301-forced-labor-tariffs-2026"
        ? "event_canonical"
        : "dependent_guide",
      eventIds: page.events,
      authorityIds: page.sourceKeys.map((key) => eventSourceIds[key]),
      numericClaims: page.numericClaims ?? [],
    })),
    {
      path: "/blog/",
      title: "Blog",
      contentRole: "index",
      eventIds: [],
      authorityIds: [],
      numericClaims: [],
    },
  ].map((record) => ({
    schemaVersion: 1,
    ...record,
    canonicalUrl: `https://attahirlabs.com${record.path}`,
    publicationStatus: "published",
    modifiedDate,
    verifiedThrough: checkedAt,
    reviewAfter,
    failClosedWording: universalWarning,
  }));

  const registry = Object.fromEntries(
    Object.values(sources).map((source) => [
      source.id,
      { url: source.url, label: source.label },
    ]),
  );
  const output = {
    schemaVersion: 1,
    asOf: checkedAt,
    reviewAfter,
    authorityRegistry: registry,
    pages: records,
  };
  const directory = path.join(root, "data");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, "tariff-content-claims.json"),
    `${JSON.stringify(output, null, 2)}\n`,
  );
}

const forcedTemplate = fs.readFileSync(
  path.join(
    root,
    "blog",
    "proposed-section-301-forced-labor-tariffs-2026",
    "index.html",
  ),
  "utf8",
);

for (const page of pages) writePage(page, forcedTemplate);
updateBlogIndex();
updateFailClosedTools();
updateSitemap();
writeManifest();

console.log(
  JSON.stringify({
    rebuiltPages: pages.length,
    newPages: pages.filter((page) => page.newPage).length,
    manifestRecords: pages.length + 3,
    modifiedDate,
  }),
);
