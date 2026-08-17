#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const checkedAt = "2026-08-17T13:00:00Z";
const reviewAfter = "2026-08-24T13:00:00Z";
const modifiedDate = "2026-08-17";
const warning = "No universal current U.S. tariff rate is available from country of origin alone.";

const pages = [
  {
    slug: "de-minimis-threshold-2026",
    title: "De Minimis Court Ruling 2026: The $800 Exemption Stays Suspended",
    description: "The August 13 trade-court ruling leaves the U.S. de minimis suspension in place. Here’s what changed, what didn’t, and how low-value imports are entered now.",
    publishedDate: "2026-03-24",
    meta: "Updated August 17, 2026 · 8 min read",
    alt: "Editorial photo of small ecommerce parcels, customs forms, blurred barcode labels, a calculator, and a landed-cost table for low-value imports.",
    faq: [
      ["Did the court restore the $800 de minimis exemption?", "No. The court upheld the President’s authority under IEEPA to suspend the administrative exemption."],
      ["Did the ruling create a new tariff rate?", "No. It decides whether low-value goods can be denied de minimis treatment. The duty still comes from the product’s HTSUS classification and any applicable Chapter 99 measures."],
      ["Are genuine gifts still exempt?", "The CBP FAQ says the separate bona fide gift rules and traveler personal-item rules weren’t changed by the de minimis suspension. The facts still have to satisfy those separate provisions."],
      ["Can I use one percentage for every package under $800?", "Absolutely not. Low value isn’t a tariff classification."],
    ],
    body: `
<p class="lead">The headline is simple: the old $800 shortcut is still suspended. The court ruling changed the legal certainty around that suspension, but it didn’t invent a new tariff rate.</p>
<figure class="post-figure" data-generated-visual="editorial-gpt-image-2"><picture><img src="/assets/blog/de-minimis-threshold-2026/hero.jpg" alt="Editorial photo of small ecommerce parcels, customs forms, blurred barcode labels, a calculator, and a landed-cost table for low-value imports." width="3840" height="2160" decoding="async" fetchpriority="high"></picture><figcaption>Low-value parcels now need the same classification and duty questions importers used to postpone until a shipment crossed $800.</figcaption></figure>
<div class="callout callout-warn"><p><strong>The court upheld the suspension of de minimis. It didn’t set a flat duty for low-value packages.</strong></p></div>
<h2>What the court decided</h2>
<p>On August 13, 2026, the U.S. Court of International Trade ruled in <em>Axle of Dearborn Inc. v. Department of Commerce</em> that IEEPA lets the President rescind or suspend the de minimis privilege in 19 U.S.C. § 1321. The court also treated the agencies’ implementation as ministerial rather than a separate policy decision that needed fresh Administrative Procedure Act review.</p>
<p>That’s narrower than the viral version of the story. The same opinion acknowledges the Supreme Court’s earlier holding that IEEPA doesn’t authorize tariffs. So this ruling doesn’t bring back IEEPA tariffs. It says the President can turn off an administrative exemption that had allowed many shipments valued at $800 or less to enter without the normal duty process.</p>
<p>In plain English: a door closed. The tax code behind the door didn’t get replaced.</p>
<h2>What happens to a $40 parcel</h2>
<p>Value alone no longer answers the question. CBP says shipments affected by the suspension must use the appropriate formal or informal entry process. Informal entry is generally available when the shipment is valued at $2,500 or less, but the classification, origin, admissibility rules, and entry method still matter.</p>
<p>A $40 phone case, a $40 cotton shirt, and a $40 machine part can carry three different duty results. Calling all three “low value” tells you almost nothing about the final charge.</p>
<div class="quick-answer-grid">
<div class="quick-answer-card"><div class="quick-answer-label">Still suspended</div><p>The administrative de minimis exemption for affected commercial shipments.</p></div>
<div class="quick-answer-card"><div class="quick-answer-label">Still required</div><p>HTSUS classification, origin, customs value, entry date, and Chapter 99 checks.</p></div>
<div class="quick-answer-card"><div class="quick-answer-label">Not a new rate</div><p>The court ruling itself adds zero percentage points.</p></div>
</div>
<h2>Postal shipments aren’t a loophole</h2>
<p>CBP’s current ecommerce FAQ covers shipments arriving through every transportation mode. International mail now has its own informal-entry process, and CBP lists additional changes beginning October 22, 2026 for certain Chapter 98, Chapter 99, free-trade-agreement, and partner-government-agency goods.</p>
<p>Don’t build a checkout around the idea that switching carriers or routing a parcel through the mail restores the old exemption. That’s the kind of shortcut that works right up until a package is held and your customer gets the bill.</p>
<h2>The exceptions didn’t vanish</h2>
<p>CBP says the separate treatment for bona fide gifts and traveler personal or household articles remains unchanged. Those aren’t magic labels. A seller can’t turn a commercial order into a gift by checking a box, and a bulk shipment doesn’t become personal luggage because someone wishes hard enough.</p>
<h2>What merchants should change</h2>
<ol>
<li>Classify the product under the current HTSUS instead of using package value as a proxy.</li>
<li>Capture origin and the expected U.S. entry date.</li>
<li>Check current Chapter 99 programs and their exceptions.</li>
<li>Decide who pays duties and make that promise obvious before checkout.</li>
<li>Keep the result in review when a required filing fact is missing.</li>
</ol>
<div class="cta-box"><h3>Make tariff uncertainty visible before it eats the order</h3><p>TariffShield helps Shopify merchants flag exposed products and model landed-cost margin. For a supported exact-input estimate, use the signed duty calculator.</p><a href="/apps/tariffshield/">See TariffShield</a> <a href="/duty/">Open the duty calculator</a></div>
<h2 id="faq">Questions merchants are asking</h2>`,
    sources: [
      ["U.S. Court of International Trade — Slip Opinion 26-94", "https://www.cit.uscourts.gov/sites/cit/files/26-94.pdf"],
      ["CBP — Ecommerce Frequently Asked Questions", "https://www.cbp.gov/trade/basic-import-export/e-commerce/faqs"],
      ["Federal Register 2026-12670 — non-postal de minimis suspension", "https://www.federalregister.gov/documents/2026/06/24/2026-12670/indefinite-suspension-of-the-de-minimis-exemption-for-merchandise-arriving-through-all-modes-other"],
      ["Federal Register 2026-12669 — postal de minimis suspension", "https://www.federalregister.gov/documents/2026/06/24/2026-12669/indefinite-suspension-of-the-de-minimis-exemption-for-mail-shipments-and-new-postal-informal-entry"],
      ["USITC — current Harmonized Tariff Schedule", "https://hts.usitc.gov/"],
    ],
  },
  {
    slug: "quartz-countertop-tariffs-2026",
    title: "Quartz Countertop Tariffs 2026: 25% or 50% Started August 15",
    description: "U.S. safeguard tariffs on covered quartz surface products took effect August 15, 2026. The exact rate depends on product scope, origin exemption, and quota heading.",
    publishedDate: modifiedDate,
    meta: "August 17, 2026 · 7 min read",
    alt: "Editorial photo of quartz countertop samples, a measuring tape, receiving paperwork, and a warehouse inspection table with no readable labels.",
    faq: [
      ["Is every quartz countertop charged 25%?", "No. Product scope, country exemptions, and quota status all matter."],
      ["What happens after the quota fills?", "Covered non-exempt entries move from heading 9903.45.30 to the over-quota heading 9903.45.31, which carries a 50% additional rate in the first year."],
      ["Are granite and marble included?", "No. U.S. note 41 excludes quarried stone surfaces such as granite, marble, soapstone, and quartzite."],
      ["Can TariffShield decide whether my shipment is inside the quota?", "No. That status comes from the filing facts and CBP quota administration; it shouldn’t be guessed from product value or origin."],
    ],
    body: `
<p class="lead">A new U.S. safeguard tariff on quartz surface products is already live. For covered goods from non-exempt countries, the first-year additional rate is <span data-tariff-claim-id="qsp-within-quota-rate">25%</span> inside the quota and <span data-tariff-claim-id="qsp-over-quota-rate">50%</span> after the quota is exhausted.</p>
<figure class="post-figure" data-generated-visual="editorial-gpt-image-2"><picture><img src="/assets/blog/quartz-countertop-tariffs-2026/hero.jpg" alt="Editorial photo of quartz countertop samples, a measuring tape, receiving paperwork, and a warehouse inspection table with no readable labels." width="3840" height="2160" decoding="async" fetchpriority="high"></picture><figcaption>The tariff follows the legal product definition and quota heading, not the marketing name on a sample rack.</figcaption></figure>
<div class="callout callout-danger"><p><strong>Effective date: August 15, 2026 at 12:01 a.m. Eastern.</strong> This one is active, not proposed.</p></div>
<h2>The rate table</h2>
<table><thead><tr><th>Entry period</th><th>Within quota · 9903.45.30</th><th>Over quota · 9903.45.31</th></tr></thead><tbody>
<tr><td>Aug. 15, 2026–Aug. 14, 2027</td><td><strong>25% additional</strong></td><td><strong>50% additional</strong></td></tr>
<tr><td>Aug. 15, 2027–Aug. 14, 2028</td><td>23% additional</td><td>49% additional</td></tr>
<tr><td>Aug. 15, 2028–Aug. 14, 2029</td><td>21% additional</td><td>48% additional</td></tr>
<tr><td>Aug. 15, 2029–Aug. 14, 2030</td><td>19% additional</td><td>47% additional</td></tr>
</tbody></table>
<p>Those rates are cumulative. They sit on top of the ordinary Chapter 68 or Chapter 70 duty and any antidumping, countervailing, or other applicable charges.</p>
<h2>What counts as QSP</h2>
<p>U.S. note 41 covers slabs and other surfaces made from a mixture that contains predominantly silica plus a resin binder, where silica is greater by actual weight than any other single material. Finished countertops, backsplashes, vanity tops, flooring, wall facing, shower surrounds, mantels, and tiles can all be caught. Cutting or finishing the slab in a third country doesn’t automatically remove it from scope.</p>
<p>The listed classifications are 6810.99.0020, 6810.99.0040, and 7020.00.6000. But the HTS number isn’t the whole test. The physical composition and product description still control.</p>
<p>Quarried stone products—granite, marble, soapstone, and quartzite—are outside this QSP definition. “Looks like stone” is not a classification method. Neither is “the supplier called it engineered quartz.”</p>
<h2>The quota is real</h2>
<p>For the first year, the annual quota is 13,006,426 square meters, divided into four quarterly limits of 3,251,606 square meters. CBP can carry unused quantity into the next quarter. Once the available quantity is gone, covered entries use the over-quota heading.</p>
<p>That means yesterday’s entry result doesn’t prove today’s quota status. A calculator can model the rate tied to the Chapter 99 heading you supply, but it shouldn’t pretend to know how much quota remains at the instant your shipment enters.</p>
<h2>Country exemptions</h2>
<p>The exemption list is long. Canada and Mexico are exempt, as are listed free-trade partners, developing countries, and Caribbean Basin beneficiaries in U.S. note 41(c). Don’t simplify that into “all FTA countries” or “all developing countries.” Check the current note against the actual origin.</p>
<h2>Margin damage</h2>
<p>On $40,000 of covered customs value, a 25% additional duty is $10,000. The 50% over-quota rate is $20,000. That’s before the ordinary duty, trade-remedy charges, brokerage, or delivery costs.</p>
<p>If you sell countertops, vanities, tile, or furniture made with imported quartz surfaces, recheck open purchase orders now. Don’t wait for the carrier invoice to explain your margin.</p>
<div class="cta-box"><h3>Flag exposed products before the next purchase order</h3><p>TariffShield gives Shopify merchants a review queue for tariff and landed-cost exposure. The exact calculator accepts the Chapter 99 quota heading when the filing fact is known.</p><a href="/apps/tariffshield/">See TariffShield</a> <a href="/duty/">Calculate a supported entry</a></div>
<h2 id="faq">Quick answers</h2>`,
    sources: [
      ["Federal Register — Proclamation 11051", "https://www.federalregister.gov/documents/2026/08/05/2026-15975/to-facilitate-positive-adjustment-to-competition-from-imports-of-quartz-surface-products"],
      ["USITC — HTSUS 2026 Revision 16", "https://hts.usitc.gov/"],
    ],
  },
  {
    slug: "us-drone-tariffs-2026",
    title: "U.S. Drone Tariffs 2026: 25% and 100% Start September 3",
    description: "New Section 232 tariffs on drones and UAS components begin September 3, 2026, with exact Chapter 99 rates, partner conditions, and a February 2027 component phase.",
    publishedDate: modifiedDate,
    meta: "August 17, 2026 · 8 min read",
    alt: "Editorial photo of commercial drone components, propellers, batteries, thermal camera hardware, and customs inspection paperwork on an industrial workbench.",
    faq: [
      ["Are the drone tariffs active today?", "No. The first phase starts September 3, 2026 at 12:01 a.m. Eastern."],
      ["Which drones get the 100% rate?", "Covered drones over 25 kg, covered drones with thermal imaging, docking stations, and specified components use heading 9903.08.21 unless a lower or zero heading applies."],
      ["Do all small drones get 25%?", "Only covered small UAS without thermal imaging under the listed classifications, and only when another partner or approved-program heading doesn’t apply."],
      ["Can I claim the EU or Japan 15% treatment from origin alone?", "No. The proclamation requires certification that substantially all critical components and technology come from the named partner group, plus an implementation process and CBP product notice."],
    ],
    body: `
<p class="lead">The U.S. is adding a <span data-tariff-claim-id="uas-annex-one-rate">100%</span> Section 232 duty to the highest-risk drone categories and <span data-tariff-claim-id="uas-annex-two-rate">25%</span> to covered small drones without thermal imaging. The first phase starts September 3, 2026.</p>
<figure class="post-figure" data-generated-visual="editorial-gpt-image-2"><picture><img src="/assets/blog/us-drone-tariffs-2026/hero.jpg" alt="Editorial photo of commercial drone components, propellers, batteries, thermal camera hardware, and customs inspection paperwork on an industrial workbench." width="3840" height="2160" decoding="async" fetchpriority="high"></picture><figcaption>Weight, thermal capability, component use, origin certification, and the exact Chapter 99 heading decide the UAS layer.</figcaption></figure>
<div class="callout callout-warn"><p><strong>Not active yet:</strong> September 3 is the first entry date. The delayed component phase starts February 9, 2027.</p></div>
<h2>The headings</h2>
<table><thead><tr><th>Chapter 99</th><th>Treatment</th><th>Who it covers</th></tr></thead><tbody>
<tr><td>9903.08.20</td><td>No change</td><td>Listed tariff provisions when the article isn’t for the covered UAS use</td></tr>
<tr><td>9903.08.21</td><td>+100%</td><td>Covered large UAS, thermal-imaging UAS, docking stations, and specified components</td></tr>
<tr><td>9903.08.22</td><td>+25%</td><td>Covered small UAS without thermal imaging; broader listed components from Feb. 9, 2027</td></tr>
<tr><td>9903.08.23</td><td><span data-tariff-claim-id="uas-uk-rate">+10%</span></td><td>Eligible UK products that meet the component-and-technology certification rule</td></tr>
<tr><td>9903.08.24</td><td><span data-tariff-claim-id="uas-partner-total-rate">15% total</span></td><td>Eligible Japan, Korea, Taiwan, Switzerland, Liechtenstein, and EU products</td></tr>
<tr><td>9903.08.25 / .26</td><td>No change</td><td>Specified approved onshoring programs; .25 ends Feb. 9, 2027</td></tr>
</tbody></table>
<h2>What gets 100%</h2>
<p>Annex I covers remote- and non-remote-controlled UAS above 25 kilograms; covered small UAS that integrate thermal imaging; docking stations under specified electrical provisions; and certain parts for UAS over 25 kilograms. The parts scope excludes systems for retail delivery, agriculture, or sale to the Department of War.</p>
<p>The product list includes 8504.40.9580, 8537.10.9170, UAS subheadings in 8806, and specified 8807 parts provisions. The scope notes matter. Typing “drone parts” into a product title doesn’t resolve them.</p>
<h2>What gets 25%</h2>
<p>Annex II covers small UAS of 25 kilograms or less when they don’t have thermal imaging. Annex III adds listed propellers, undercarriages, and other UAS components at 25% beginning February 9, 2027. If a component is already covered by Annex I, the Annex I treatment wins.</p>
<h2>The partner rates have strings attached</h2>
<p>Eligible goods from Japan, Korea, Taiwan, Switzerland, Liechtenstein, and EU member states can use a total 15% rate including Column 1 duty. Eligible UK goods get an additional 10% rate. But origin alone isn’t enough: importers must satisfy the “substantially all critical components and technology” certification condition, and Commerce must establish the process and inform CBP which products qualify.</p>
<p>Until those operational facts exist for an entry, the lower rate is not something a merchant should guess into a margin sheet.</p>
<h2>Some companies get a delayed start</h2>
<p>Companies on the specified Blue UAS, Blue UAS Framework, or FCC Conditional Approval lists on September 2 may get a 180-day delayed effective date for covered listed products and components. Commerce must tell CBP which companies and products qualify. Again: company-list status is an entry fact, not an inference.</p>
<h2>What to do now</h2>
<ol>
<li>Map every drone and UAS component to the current HTSUS code.</li>
<li>Separate thermal from non-thermal small UAS and capture maximum take-off weight.</li>
<li>Get supplier evidence for component origin if you expect partner treatment.</li>
<li>Reprice September arrivals before they ship, then recheck CBP implementation instructions.</li>
<li>Leave delayed-list and onshoring cases in review until the agency confirms them.</li>
</ol>
<div class="cta-box"><h3>September inventory needs a tariff review now</h3><p>TariffShield helps Shopify merchants find exposed SKUs and test margin before the effective date. The signed calculator will return numbers only when the exact UAS heading and other required filing facts are supplied.</p><a href="/apps/tariffshield/">See TariffShield</a> <a href="/duty/">Open the duty calculator</a></div>
<h2 id="faq">Quick answers</h2>`,
    sources: [
      ["White House — UAS Section 232 proclamation", "https://www.whitehouse.gov/presidential-actions/2026/08/adjusting-imports-of-unmanned-aircraft-systems-and-unmanned-aircraft-systems-components-into-the-united-states/"],
      ["White House — UAS Annex I", "https://www.whitehouse.gov/wp-content/uploads/2026/08/ANNEX-I-1.pdf"],
      ["White House — UAS Annex II", "https://www.whitehouse.gov/wp-content/uploads/2026/08/Annex-II-1.pdf"],
      ["White House — UAS Annex III", "https://www.whitehouse.gov/wp-content/uploads/2026/08/Annex-III.pdf"],
      ["White House — UAS Annex IV (HTSUS headings)", "https://www.whitehouse.gov/wp-content/uploads/2026/08/Annex-IV-1.pdf"],
      ["USITC — current Harmonized Tariff Schedule", "https://hts.usitc.gov/"],
    ],
  },
  {
    slug: "solar-polysilicon-tariffs-2026",
    title: "Solar and Polysilicon Tariffs 2026: New Prices Start December 4",
    description: "The U.S. polysilicon proclamation starts a minimum-import-price program and additional solar-chain tariffs on December 4, 2026. Here are the exact thresholds and open implementation facts.",
    publishedDate: modifiedDate,
    meta: "August 17, 2026 · 8 min read",
    alt: "Editorial photo of solar wafers, cell samples, a polysilicon chunk, a precision scale, and import paperwork on a clean manufacturing inspection bench.",
    faq: [
      ["Are the polysilicon measures active now?", "No. The stated entry date is December 4, 2026 at 12:01 a.m. Eastern."],
      ["Is the MIP just another percentage tariff?", "No. It uses product units—kilograms or watts—and the entered value and certification facts. Treating it like a flat percentage would be wrong."],
      ["Does the additional 15% apply to raw polysilicon?", "The proclamation applies the extra ad-valorem layer to polysilicon ingots and listed derivatives. The MIP program has its own broader product coverage."],
      ["Why doesn’t the calculator publish a polysilicon number yet?", "Because the current signed engine handles ad-valorem rates, not per-kilogram or per-watt MIPs plus entry-documentation logic. A confident wrong number is worse than a review flag."],
    ],
    body: `
<p class="lead">On December 4, 2026, the U.S. plans to start minimum import prices for polysilicon and solar-chain products, plus an additional <span data-tariff-claim-id="polysilicon-derivative-rate">15%</span> duty on covered ingots and derivatives.</p>
<figure class="post-figure" data-generated-visual="editorial-gpt-image-2"><picture><img src="/assets/blog/solar-polysilicon-tariffs-2026/hero.jpg" alt="Editorial photo of solar wafers, cell samples, a polysilicon chunk, a precision scale, and import paperwork on a clean manufacturing inspection bench." width="3840" height="2160" decoding="async" fetchpriority="high"></picture><figcaption>The minimum-price calculation needs units, value, contract timing, and entry documentation—not just an origin and a percentage.</figcaption></figure>
<div class="callout callout-warn"><p><strong>Future action:</strong> the measures start with entries on or after December 4, 2026 at 12:01 a.m. Eastern.</p></div>
<h2>The minimum prices</h2>
<table><thead><tr><th>Product</th><th>Minimum import price</th></tr></thead><tbody>
<tr><td>Polysilicon</td><td>$21 per kilogram</td></tr>
<tr><td>Polysilicon ingots and wafers</td><td>$100 per kilogram</td></tr>
<tr><td>Solar cells</td><td>$0.22 per watt</td></tr>
<tr><td>Solar modules</td><td>$0.38 per watt</td></tr>
</tbody></table>
<p>If the importer doesn’t submit the required entry documentation, the proclamation says the merchandise is subject to a specific tariff equal to the applicable minimum price. If the documentation is submitted but entered value is below the minimum, the specific tariff equals the difference between entered value and the minimum.</p>
<p>That isn’t ordinary percentage math. You need quantity in kilograms or watts, entered value, and the documentation status before you can calculate it safely.</p>
<h2>The extra percentage</h2>
<p>Covered polysilicon ingots and derivatives also get a 15% additional Section 232 rate. Eligible products of Japan, Korea, Taiwan, Switzerland, Liechtenstein, and EU member states use a total 15% treatment including Column 1 duty. Eligible UK products use an additional <span data-tariff-claim-id="polysilicon-uk-rate">10%</span>.</p>
<p>The proclamation also authorizes approved onshoring plans and trading-partner adjustments. Those depend on later agency decisions and company-specific facts.</p>
<h2>Old contracts matter</h2>
<p>CBP must allow documentation that the first arm’s-length U.S. sale will meet the MIP, or that the sale uses fixed terms in a contract signed before August 6, 2026. That contract clause could be a big deal for inventory already ordered, but it isn’t a blanket exemption.</p>
<h2>Why we’re holding the calculator</h2>
<p>The signed tariff engine currently supports exact ad-valorem operations. It doesn’t yet support dollars per kilogram, dollars per watt, first-sale documentation, or the MIP value-gap formula. So TariffShield is treating this as a monitored future obligation, not publishing a made-up equivalent percentage.</p>
<p>That’s less flashy. It’s also correct.</p>
<h2>What solar merchants should collect</h2>
<ol>
<li>Exact HTSUS classification and product form: raw polysilicon, ingot, wafer, cell, or module.</li>
<li>Net kilograms or rated watts in the customs unit.</li>
<li>Entered value and the first arm’s-length sale documentation.</li>
<li>Contract date and fixed terms for any pre-August 6 agreement.</li>
<li>Origin and any later partner or onshoring approval evidence.</li>
</ol>
<div class="cta-box"><h3>Put December exposure into the buying decision</h3><p>TariffShield can keep affected inventory in review while the unit-based calculation and CBP implementation details are completed.</p><a href="/apps/tariffshield/">See TariffShield</a></div>
<h2 id="faq">Quick answers</h2>`,
    sources: [
      ["White House — polysilicon Section 232 proclamation", "https://www.whitehouse.gov/presidential-actions/2026/08/adjusting-imports-of-polysilicon-and-its-derivatives-into-the-united-states/"],
      ["White House — polysilicon Annex I", "https://www.whitehouse.gov/wp-content/uploads/2026/08/ANNEX-I.pdf"],
      ["White House — polysilicon Annex II", "https://www.whitehouse.gov/wp-content/uploads/2026/08/Annex-II.pdf"],
      ["USITC — current Harmonized Tariff Schedule", "https://hts.usitc.gov/"],
    ],
  },
];

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function faqMarkup(page) {
  return `<div class="faq">${page.faq.map(([question, answer]) => `<div class="faq-item"><div class="faq-q">${question}</div><div class="faq-a">${answer}</div></div>`).join("\n")}</div>`;
}

function referencesMarkup(page) {
  return `<section class="references" id="sources"><h2>Official sources</h2><ol>${page.sources.map(([label, url]) => `<li><a href="${url}" rel="noopener" target="_blank">${label}</a></li>`).join("\n")}</ol><p><strong>Checked through:</strong> August 17, 2026 at 13:00 UTC. Re-review required no later than August 24, 2026 at 13:00 UTC or sooner if an official source changes.</p></section>`;
}

function articleMarkup(page) {
  return `<article class="post-content" data-tariff-authority-state="review-required"><a class="back-link" href="/blog/">← Back to Blog</a><p class="post-meta">${page.meta}</p><h1>${page.title}</h1>${page.body}${faqMarkup(page)}<div class="callout"><p><strong>${warning}</strong></p><p>Classification, product scope, origin, entry time, base duty, Chapter 99 treatment, quota or certification facts, and exceptions can change the result. Missing fact? Keep the number in review.</p></div>${referencesMarkup(page)}<p><strong>Disclaimer:</strong> Informational content only. Verify the current HTSUS and CBP instructions or use a licensed customs broker for an entry-specific decision.</p></article>`;
}

function replaceMeta(html, attribute, value, replacement) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*["']${value}["'])[^>]*>`, "i");
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function transform(template, page) {
  let html = template;
  const previousMobileContainment = '.post-content { min-width: 0; overflow-x: hidden; }\n        .post-content table { max-width: 100%; }';
  html = html.replace(previousMobileContainment, '');
  const mobileContainment = '.post-content { width: 100%; max-width: 720px; min-width: 0; }\n        .post-content table { display: block; width: 100%; max-width: 100%; overflow-x: auto; }';
  if (!html.includes(mobileContainment)) html = html.replace('</style>', `        ${mobileContainment}\n</style>`);
  html = html.replace(/\n[ \t]+\n(?=        \.post-content)/g, '\n');
  const start = html.search(/<article(?:\s[^>]*)?>/i);
  const endStart = html.indexOf("</article>", start);
  if (start < 0 || endStart < 0) throw new Error(`article boundary missing for ${page.slug}`);
  html = `${html.slice(0, start)}${articleMarkup(page)}${html.slice(endStart + 10)}`;
  const canonical = `https://attahirlabs.com/blog/${page.slug}/`;
  const image = `https://attahirlabs.com/assets/blog/${page.slug}/hero.jpg`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title} | Attahir Labs</title>`);
  for (const [attribute, value, replacement] of [
    ["name", "description", `<meta name="description" content="${escapeAttribute(page.description)}">`],
    ["property", "og:title", `<meta property="og:title" content="${escapeAttribute(page.title)}">`],
    ["property", "og:description", `<meta property="og:description" content="${escapeAttribute(page.description)}">`],
    ["property", "og:url", `<meta property="og:url" content="${canonical}">`],
    ["property", "og:image", `<meta property="og:image" content="${image}">`],
    ["property", "og:image:width", `<meta property="og:image:width" content="3840">`],
    ["property", "og:image:height", `<meta property="og:image:height" content="2160">`],
    ["property", "og:image:alt", `<meta property="og:image:alt" content="${escapeAttribute(page.alt)}">`],
    ["name", "twitter:image", `<meta name="twitter:image" content="${image}">`],
    ["property", "article:published_time", `<meta property="article:published_time" content="${page.publishedDate}">`],
    ["property", "article:modified_time", `<meta property="article:modified_time" content="${modifiedDate}">`],
  ]) html = replaceMeta(html, attribute, value, replacement);
  html = html.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/gi, "");
  html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
  const articleJson = { "@context": "https://schema.org", "@type": "Article", headline: page.title, description: page.description, mainEntityOfPage: canonical, datePublished: page.publishedDate, dateModified: modifiedDate, image, author: { "@type": "Organization", name: "Attahir Labs" }, publisher: { "@type": "Organization", name: "Attahir Labs" } };
  const faqJson = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  html = html.replace("</head>", `<link rel="canonical" href="${canonical}">\n<script type="application/ld+json">${JSON.stringify(articleJson)}</script>\n<script type="application/ld+json">${JSON.stringify(faqJson)}</script>\n</head>`);
  return html;
}

const existingTemplate = fs.readFileSync(path.join(root, "blog/de-minimis-threshold-2026/index.html"), "utf8");
for (const page of pages) {
  page.body = page.body.replace('<figure class="post-figure"', '<figure class="post-figure blog-hero-figure"');
  const target = path.join(root, "blog", page.slug, "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const template = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : existingTemplate;
  fs.writeFileSync(target, transform(template, page));
}

const newCards = pages.slice(1).map((page) => `<div class="post-card has-image"><a href="/blog/${page.slug}/"><img alt="${escapeAttribute(page.alt)}" class="post-card-image" decoding="async" height="2160" loading="lazy" src="/assets/blog/${page.slug}/hero.jpg" width="3840"/><div class="post-meta"><span class="post-tag">Tariffs</span><span class="post-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">New</span> August 17, 2026 · 8 min read</div><div class="post-title">${page.title}</div><p class="post-excerpt">${page.description}</p><span class="read-more">Read the guide →</span></a></div>`).join("\n");
const indexPath = path.join(root, "blog/index.html");
let index = fs.readFileSync(indexPath, "utf8");
index = index.replace(/<a class="featured-link" href="\/blog\/de-minimis-threshold-2026\/">[\s\S]*?<\/a>/, `<a class="featured-link" href="/blog/de-minimis-threshold-2026/"><div class="featured-label">Breaking ruling</div><div class="featured-title">The $800 Exemption Stays Suspended</div><div class="featured-copy">The trade court upheld the de minimis suspension. Here’s what changed, what didn’t, and why low value still isn’t a tariff rate.</div></a>`);
index = index.replace(/<!-- 20260817-tariff-activity:start -->[\s\S]*?<!-- 20260817-tariff-activity:end -->\s*/g, "");
index = index.replace("<!-- tariff-authority-cards:start -->", `<!-- tariff-authority-cards:start -->\n<!-- 20260817-tariff-activity:start -->\n${newCards}\n<!-- 20260817-tariff-activity:end -->`);
index = index.replace(/(<a href="\/blog\/de-minimis-threshold-2026\/">[\s\S]*?<div class="post-meta">)[\s\S]*?(<div class="post-title">)[\s\S]*?(<p class="post-excerpt">)[\s\S]*?(<span class="read-more">)/, `$1<span class="post-tag">Tariffs</span><span class="post-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">Court ruling</span> Updated August 17, 2026 · 8 min read</div>$2${pages[0].title}</div>$3${pages[0].description}</p>$4`);
fs.writeFileSync(indexPath, index);

const sitemapPath = path.join(root, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8");
for (const page of pages) {
  const canonical = `https://attahirlabs.com/blog/${page.slug}/`;
  const block = `<url>\n    <loc>${canonical}</loc>\n    <lastmod>${modifiedDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  const pattern = new RegExp(`<url>\\s*<loc>${canonical.replaceAll("/", "\\/")}<\\/loc>[\\s\\S]*?<\\/url>`);
  sitemap = pattern.test(sitemap) ? sitemap.replace(pattern, block) : sitemap.replace("</urlset>", `  ${block}\n</urlset>`);
}
fs.writeFileSync(sitemapPath, sitemap);

const claimsPath = path.join(root, "data/tariff-content-claims.json");
const claims = JSON.parse(fs.readFileSync(claimsPath, "utf8"));
claims.asOf = checkedAt;
claims.reviewAfter = reviewAfter;
Object.assign(claims.authorityRegistry, {
  cit_26_94: { url: "https://www.cit.uscourts.gov/sites/cit/files/26-94.pdf", label: "U.S. Court of International Trade — Slip Opinion 26-94" },
  cbp_ecommerce_faq_2026: { url: "https://www.cbp.gov/trade/basic-import-export/e-commerce/faqs", label: "CBP — Ecommerce Frequently Asked Questions" },
  fr_2026_15975: { url: "https://www.federalregister.gov/documents/2026/08/05/2026-15975/to-facilitate-positive-adjustment-to-competition-from-imports-of-quartz-surface-products", label: "Federal Register — Proclamation 11051" },
  whitehouse_uas_2026_08_13: { url: "https://www.whitehouse.gov/presidential-actions/2026/08/adjusting-imports-of-unmanned-aircraft-systems-and-unmanned-aircraft-systems-components-into-the-united-states/", label: "White House — UAS Section 232 proclamation" },
  whitehouse_polysilicon_2026_08_06: { url: "https://www.whitehouse.gov/presidential-actions/2026/08/adjusting-imports-of-polysilicon-and-its-derivatives-into-the-united-states/", label: "White House — polysilicon Section 232 proclamation" },
});
for (const page of claims.pages) {
  if (page.path !== "/duty/") {
    page.verifiedThrough = checkedAt;
    page.reviewAfter = reviewAfter;
  }
}
const deMinimis = claims.pages.find((page) => page.path === "/blog/de-minimis-threshold-2026/");
Object.assign(deMinimis, {
  title: pages[0].title,
  eventIds: ["us_de_minimis_cit_26_94"],
  authorityIds: ["cit_26_94", "cbp_ecommerce_faq_2026", "fr_2026_12670", "fr_2026_12669", "usitc_current_hts"],
  modifiedDate,
});
const additions = [
  [pages[1], "us_qsp_safeguard_2026", ["fr_2026_15975", "usitc_current_hts"], [["qsp-within-quota-rate", 25], ["qsp-over-quota-rate", 50]]],
  [pages[2], "us_section232_uas_2026", ["whitehouse_uas_2026_08_13", "usitc_current_hts"], [["uas-annex-one-rate", 100], ["uas-annex-two-rate", 25], ["uas-uk-rate", 10], ["uas-partner-total-rate", 15]]],
  [pages[3], "us_section232_polysilicon_2026", ["whitehouse_polysilicon_2026_08_06", "usitc_current_hts"], [["polysilicon-derivative-rate", 15], ["polysilicon-uk-rate", 10]]],
];
for (const [page, eventId, authorityIds, numeric] of additions) {
  const entry = {
    schemaVersion: 1,
    path: `/blog/${page.slug}/`,
    title: page.title,
    contentRole: "event_canonical",
    eventIds: [eventId],
    authorityIds,
    numericClaims: numeric.map(([claimId, value]) => ({ claimId, value, unit: "percent", status: eventId === "us_qsp_safeguard_2026" ? "supported_scope_limited" : "supported_future_scope_limited" })),
    canonicalUrl: `https://attahirlabs.com/blog/${page.slug}/`,
    publicationStatus: "published",
    modifiedDate,
    verifiedThrough: checkedAt,
    reviewAfter,
    failClosedWording: warning,
  };
  const existing = claims.pages.findIndex((item) => item.path === entry.path);
  if (existing >= 0) claims.pages[existing] = entry;
  else claims.pages.push(entry);
}
fs.writeFileSync(claimsPath, `${JSON.stringify(claims, null, 2)}\n`);

console.log(JSON.stringify({ pages: pages.map((page) => page.slug), claims: claims.pages.length, checkedAt, reviewAfter }, null, 2));
