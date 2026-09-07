(function (root, factory) {
  // A repeated script include must not initialize GA or bind clicks twice.
  if (root.document && root.AttahirAnalytics) return;
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AttahirAnalytics = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  const MEASUREMENT_ID = 'G-8QRJWWVMRZ';
  const OPT_OUT_STORAGE_KEY = 'attahir.analytics.disabled';
  const VERSION = 'website-v1';
  // BEGIN GENERATED PAGES (tools/sync-measurement.mjs)
  const pages = Object.freeze({
  "/analytics-preferences/": {
    "surface": "legal",
    "title": "Analytics Preferences | Attahir Labs",
    "disabled": true
  },
  "/apps/accessshield/": {
    "surface": "app_page",
    "title": "AccessShield for Shopify Accessibility Workflows | Attahir Labs"
  },
  "/apps/": {
    "surface": "apps_hub",
    "title": "Shopify Apps by Merchant Problem | Attahir Labs"
  },
  "/apps/shelflife/": {
    "surface": "app_page",
    "title": "ShelfLife for Shopify Expiry, Batch, and Recall Workflows | Attahir Labs"
  },
  "/apps/stockclearance/": {
    "surface": "app_page",
    "title": "Shopify Dead Stock App and Markdown Workflow | StockClearance"
  },
  "/apps/storechangelog/": {
    "surface": "app_page",
    "title": "StoreChangelog for Shopify Change Tracking and Rollback | Attahir Labs"
  },
  "/apps/tariffshield/": {
    "surface": "app_page",
    "title": "TariffShield for Shopify Import Costs and Margins | Attahir Labs"
  },
  "/apps/warrantytracker/": {
    "surface": "app_page",
    "title": "WarrantyTracker for Shopify Warranty Claims and Lookup | Attahir Labs"
  },
  "/blog/ada-accessibility-lawsuits-2026-what-shopify-merchants-need-to-know/": {
    "surface": "blog_article",
    "title": "ADA Accessibility Lawsuits 2026: What Shopify Merchants Need to Know | Attahir Labs"
  },
  "/blog/amazon-fba-landed-cost-guide/": {
    "surface": "blog_article",
    "title": "Amazon FBA Landed Cost: Complete Guide for 2026 | Attahir Labs"
  },
  "/blog/at-home-ceo-transition-dead-stock-lessons-shopify-2026/": {
    "surface": "blog_article",
    "title": "At Home Is Changing CEOs After Bankruptcy. Shopify Merchants Should Treat It as a Dead-Stock Warning | Attahir Labs"
  },
  "/blog/canada-canned-vegetable-safeguard-tariff-2026/": {
    "surface": "blog_article",
    "title": "Canada's Canned-Vegetable Safeguard Tariff: What Shopify Merchants Should Notice | Attahir Labs"
  },
  "/blog/canada-surtax-on-chinese-goods-2026/": {
    "surface": "blog_article",
    "title": "Canada Tariffs on Chinese Goods 2026: Surtax Rates &amp; Import Rules | Attahir Labs"
  },
  "/blog/cbp-tariff-refund-portal-live/": {
    "surface": "blog_article",
    "title": "CBP Tariff Refund Portal: Who Qualifies, What Phase 1 Covers, and What Importers Should Do Next | Attahir Labs"
  },
  "/blog/cusma-usmca-guide/": {
    "surface": "blog_article",
    "title": "CUSMA/USMCA in 2026: Qualification Is Not the Whole Duty Answer | Attahir Labs"
  },
  "/blog/customs-broker-due-diligence-checklist-for-shopify-merchants/": {
    "surface": "blog_article",
    "title": "Customs Broker Due-Diligence Checklist for Shopify Merchants | Attahir Labs"
  },
  "/blog/customs-broker-shopify/": {
    "surface": "blog_article",
    "title": "How to Find a Customs Broker for Your Shopify Store | Attahir Labs"
  },
  "/blog/ddp-vs-duties-at-checkout-for-shopify-how-merchants-actually-handle-import-charges/": {
    "surface": "blog_article",
    "title": "DDP vs Duties at Checkout for Shopify: How Merchants Actually Handle Import Charges | Attahir Labs"
  },
  "/blog/de-minimis-threshold-2026/": {
    "surface": "blog_article",
    "title": "De Minimis Court Ruling 2026: The $800 Exemption Stays Suspended | Attahir Labs"
  },
  "/blog/dead-stock-clearance-q2-2026/": {
    "surface": "blog_article",
    "title": "March Sales Slump? How to Clear Dead Stock Before Q2 | Attahir Labs"
  },
  "/blog/dead-stock-prevention-guide-shopify-slow-movers/": {
    "surface": "blog_article",
    "title": "Dead Stock Prevention Guide: How Shopify Merchants Can Find Slow Movers Before They Become Write-Offs | Attahir Labs"
  },
  "/blog/dead-stock-prevention-guide-stockclearance-tie-in/": {
    "surface": "blog_article",
    "title": "Redirecting to Dead Stock Prevention Guide | Attahir Labs",
    "disabled": true
  },
  "/blog/doj-ada-website-accessibility-deadline-2026/": {
    "surface": "blog_article",
    "title": "ADA Website Accessibility Deadline 2026: What Shopify Merchants Need to Know | Attahir Labs"
  },
  "/blog/eu-low-value-import-duty-changes-2026/": {
    "surface": "blog_article",
    "title": "EU Low-Value Import Duty 2026: EUR 3 Rule from July 1 | Attahir Labs"
  },
  "/blog/eu-tariff-rates-importing-to-europe-2026/": {
    "surface": "blog_article",
    "title": "EU Tariff Rates: Importing to Europe in 2026 | Attahir Labs"
  },
  "/blog/gamestop-retro-inventory-playbook-2026/": {
    "surface": "blog_article",
    "title": "Dead Stock vs Collectible Inventory: GameStop’s Retro Playbook for Shopify | Attahir Labs"
  },
  "/blog/guitar-center-turnaround-dead-stock-lessons-shopify-2026/": {
    "surface": "blog_article",
    "title": "Guitar Center’s Turnaround: The Dead-Stock Lesson Shopify Merchants Should Use Now | Attahir Labs"
  },
  "/blog/home-retail-dead-stock-2026/": {
    "surface": "blog_article",
    "title": "Home Retailers Are Under Pressure in 2026: A Dead Stock Playbook for Shopify Merchants | Attahir Labs"
  },
  "/blog/how-to-calculate-landed-cost/": {
    "surface": "blog_article",
    "title": "How to Calculate Landed Cost in 2026 Without Guessing the Duty | Attahir Labs"
  },
  "/blog/how-to-find-a-customs-broker/": {
    "surface": "blog_article",
    "title": "Redirecting to the Customs Broker Guide | Attahir Labs",
    "disabled": true
  },
  "/blog/how-to-handle-product-recalls-on-shopify/": {
    "surface": "blog_article",
    "title": "How to Handle Product Recalls on Shopify | Attahir Labs"
  },
  "/blog/how-to-track-who-changed-a-shopify-product-and-why-shopify-s-native-logs-fall-short/": {
    "surface": "blog_article",
    "title": "How to Track Who Changed a Shopify Product (and Why Shopify&#x27;s Native Logs Fall Short) | Attahir Labs"
  },
  "/blog/hts-code-lookup/": {
    "surface": "blog_article",
    "title": "HTS Code Lookup in 2026: Base Classification Plus Chapter 99 Checks | Attahir Labs"
  },
  "/blog/hts-code-reclassification-tariff-margin/": {
    "surface": "blog_article",
    "title": "HTS Reclassification and Margin Risk: Rebuild the Duty Stack | Attahir Labs"
  },
  "/blog/import-duty-from-india-to-us/": {
    "surface": "blog_article",
    "title": "Import Duty from India to the U.S. in 2026: Product-Specific Verification | Attahir Labs"
  },
  "/blog/import-duty-from-japan-to-us-2026/": {
    "surface": "blog_article",
    "title": "Import Duty from Japan to the U.S. in 2026: MFN Formula Required | Attahir Labs"
  },
  "/blog/import-duty-from-mexico-to-us-2026/": {
    "surface": "blog_article",
    "title": "Import Duty from Mexico to the U.S. in 2026: USMCA Plus Product Checks | Attahir Labs"
  },
  "/blog/import-duty-from-vietnam-to-us/": {
    "surface": "blog_article",
    "title": "U.S. Import Duty on Vietnam Apparel in 2026: HTS and Scope Required | Attahir Labs"
  },
  "/blog/": {
    "surface": "blog_hub",
    "title": "Blog — Attahir Labs | Import Duties, Tariffs &amp; Ecommerce Tools"
  },
  "/blog/is-shopify-ada-compliant-2026/": {
    "surface": "blog_article",
    "title": "Is Shopify ADA Compliant? What Merchants Still Need to Fix in 2026 | Attahir Labs"
  },
  "/blog/product-batch-tracking-and-fefo-for-shopify/": {
    "surface": "blog_article",
    "title": "Product batch tracking and FEFO for Shopify | Attahir Labs"
  },
  "/blog/product-expiry-date-management-shopify/": {
    "surface": "blog_article",
    "title": "Product Expiry Date Management for Shopify | Attahir Labs"
  },
  "/blog/proposed-section-301-forced-labor-tariffs-2026/": {
    "surface": "blog_article",
    "title": "Final Forced-Labor Section 301 Action: Product Scope Comes First | Attahir Labs"
  },
  "/blog/quartz-countertop-tariffs-2026/": {
    "surface": "blog_article",
    "title": "Quartz Countertop Tariffs 2026: 25% or 50% Started August 15 | Attahir Labs"
  },
  "/blog/qvc-bankruptcy-stock-clearance-2026/": {
    "surface": "blog_article",
    "title": "QVC Bankruptcy Filing: What Shopify Merchants Should Learn About Dead Stock and Liquidation in 2026 | Attahir Labs"
  },
  "/blog/retail-bankruptcies-dead-stock-warning-2026/": {
    "surface": "blog_article",
    "title": "Retail Bankruptcies Are a Warning Sign: How Shopify Merchants Should Handle Dead Stock in 2026 | Attahir Labs"
  },
  "/blog/saks-global-inventory-forecast-shopify-dead-stock-2026/": {
    "surface": "blog_article",
    "title": "Saks Global Inventory Forecast: Shopify Dead Stock Lessons | Attahir Labs"
  },
  "/blog/saks-global-inventory-lessons-shopify-2026/": {
    "surface": "blog_article",
    "title": "Saks Global’s Bankruptcy Exit Plan: The Inventory Lesson for Shopify Merchants | Attahir Labs"
  },
  "/blog/saks-simon-rent-settlement-inventory-lessons-shopify-2026/": {
    "surface": "blog_article",
    "title": "Saks and Simon Settled Their Rent Fight. Shopify Merchants Should Read It as an Inventory Warning | Attahir Labs"
  },
  "/blog/section-232-full-value-tariffs-on-steel-aluminum-and-copper-goods/": {
    "surface": "blog_article",
    "title": "Section 232 Full-Value Tariffs After Proclamation 11032 | Attahir Labs"
  },
  "/blog/section-232-pharma-tariffs-2026/": {
    "surface": "blog_article",
    "title": "Section 232 Pharma in 2026: Keep July Section 301 Changes Separate | Attahir Labs"
  },
  "/blog/section-232-tariffs-explained/": {
    "surface": "blog_article",
    "title": "Section 232 Tariffs Explained: Verify Scope and Non-Stacking Rules | Attahir Labs"
  },
  "/blog/section-301-vs-section-232-vs-section-122/": {
    "surface": "blog_article",
    "title": "Section 301 vs. Section 232 vs. Section 122: July 2026 Status | Attahir Labs"
  },
  "/blog/shopify-account-takeover-protection/": {
    "surface": "blog_article",
    "title": "How to Protect Your Shopify Store From Account Takeover in 2026 | Attahir Labs"
  },
  "/blog/shopify-benchmark-comparisons-removed-may-19/": {
    "surface": "blog_article",
    "title": "Shopify Benchmark Comparisons Are Going Away. Save This Data Now. | Attahir Labs"
  },
  "/blog/shopify-changelog-best-practices/": {
    "surface": "blog_article",
    "title": "Shopify Changelog Best Practices: Build a Change Log That Helps During Incidents | Attahir Labs"
  },
  "/blog/shopify-changelog-best-practices-storechangelog-tie-in/": {
    "surface": "blog_article",
    "title": "Redirecting to Shopify Changelog Best Practices | Attahir Labs",
    "disabled": true
  },
  "/blog/shopify-food-recall-batch-tracking-bulk-salmonella-2026/": {
    "surface": "blog_article",
    "title": "Shopify Food Recall Batch Tracking After Bulk Salmonella Ingredient Alerts | Attahir Labs"
  },
  "/blog/shopify-food-recall-batch-tracking-salmonella-seasoning-2026/": {
    "surface": "blog_article",
    "title": "Shopify Recall Batch Tracking After a Class I Salmonella Recall | Attahir Labs"
  },
  "/blog/shopify-food-recall-batch-tracking-undeclared-allergens-2026/": {
    "surface": "blog_article",
    "title": "Shopify Food Recall Batch Tracking After Undeclared Allergen Alerts | Attahir Labs"
  },
  "/blog/shopify-food-recall-batch-tracking-white-cheddar-seasoning-2026/": {
    "surface": "blog_article",
    "title": "Shopify Recall Batch Tracking After White Cheddar Salmonella Alert | Attahir Labs"
  },
  "/blog/shopify-hs-codes-and-country-of-origin-setup-checklist-for-duties-at-checkout/": {
    "surface": "blog_article",
    "title": "Shopify HS Codes and Country of Origin: Setup Checklist for Duties at Checkout | Attahir Labs"
  },
  "/blog/shopify-import-duties/": {
    "surface": "blog_article",
    "title": "Shopify Import Duties in 2026: Use a Source-and-Status Workflow | Attahir Labs"
  },
  "/blog/shopify-import-duties-cross-border-guide/": {
    "surface": "blog_article",
    "title": "Redirecting to Shopify Import Duties Guide | Attahir Labs",
    "disabled": true
  },
  "/blog/shopify-payments-payout-currency-bank-accounts-2026/": {
    "surface": "blog_article",
    "title": "Shopify Payments: Payout Bank Accounts by Currency | Attahir Labs"
  },
  "/blog/shopify-product-recall-batch-tracking-undeclared-allergen-2026/": {
    "surface": "blog_article",
    "title": "Shopify Product Recall Checklist: Batch Tracking After an Undeclared Allergen Alert | Attahir Labs"
  },
  "/blog/shopify-recall-batch-tracking-boichik-sesame-allergen-2026/": {
    "surface": "blog_article",
    "title": "Shopify Recall Batch Tracking After Boichik Bagels Sesame Allergen Alert | Attahir Labs"
  },
  "/blog/shopify-recall-batch-tracking-halawa-pistachio-salmonella-2026/": {
    "surface": "blog_article",
    "title": "Shopify Recall Batch Tracking After Halawa Pistachio Salmonella Alert | Attahir Labs"
  },
  "/blog/shopify-recall-batch-tracking-moringa-pepperoni-2026/": {
    "surface": "blog_article",
    "title": "Shopify Recall Batch Tracking After Moringa Salmonella and Pepperoni Roll Alerts | Attahir Labs"
  },
  "/blog/shopify-recall-batch-tracking-moringa-salmonella-2026/": {
    "surface": "blog_article",
    "title": "Shopify Recall Batch Tracking After Moringa Salmonella Alerts | Attahir Labs"
  },
  "/blog/shopify-warranty-management-what-merchants-need-to-track/": {
    "surface": "blog_article",
    "title": "Shopify Warranty Management: What Merchants Need to Track | Attahir Labs"
  },
  "/blog/shopifyql-matches-shopify-reports-2026/": {
    "surface": "blog_article",
    "title": "ShopifyQL MATCHES: Keep Shopify Segments and Reports Aligned in 2026 | Attahir Labs"
  },
  "/blog/sleep-number-bankruptcy-shopify-inventory-lessons-2026/": {
    "surface": "blog_article",
    "title": "Sleep Number Bankruptcy: Shopify Inventory Lessons for Slow-Moving Stock | Attahir Labs"
  },
  "/blog/solar-polysilicon-tariffs-2026/": {
    "surface": "blog_article",
    "title": "Solar and Polysilicon Tariffs 2026: New Prices Start December 4 | Attahir Labs"
  },
  "/blog/tariff-engineering-legal-ways-to-reduce-import-duties-2026/": {
    "surface": "blog_article",
    "title": "Tariff Engineering: Legal Ways to Reduce Import Duties in 2026 | Attahir Labs"
  },
  "/blog/uk-import-duty-post-brexit/": {
    "surface": "blog_article",
    "title": "Preferential Duties UK &amp; EU: Reduce Import Costs in 2026 | Attahir Labs"
  },
  "/blog/us-brazil-section-301-tariff-2026/": {
    "surface": "blog_article",
    "title": "U.S. Brazil Section 301 Action: 25% Applies Only to Covered Products | Attahir Labs"
  },
  "/blog/us-china-tariff-rates-2026/": {
    "surface": "blog_article",
    "title": "U.S.-China Tariffs in 2026: No Single Current All-Product Rate | Attahir Labs"
  },
  "/blog/us-drone-tariffs-2026/": {
    "surface": "blog_article",
    "title": "U.S. Drone Tariffs 2026: 25% and 100% Start September 3 | Attahir Labs"
  },
  "/blog/us-section-338-canada-tariffs-2026/": {
    "surface": "blog_article",
    "title": "U.S. Section 338 Actions on Canadian Alcohol, Dairy, and Motor Products | Attahir Labs"
  },
  "/blog/usmca-not-renewed-2026-shopify-tariff-risk/": {
    "surface": "blog_article",
    "title": "USMCA Was Not Renewed in 2026. It Did Not End. | Attahir Labs"
  },
  "/blog/warranty-policy-reduce-refunds/": {
    "surface": "blog_article",
    "title": "How a Clear Warranty Policy Can Reduce Avoidable Refunds | Attahir Labs"
  },
  "/blog/wcag-accessibility-guide/": {
    "surface": "blog_article",
    "title": "WCAG Accessibility for Ecommerce: Why Overlay Widgets Don't Work and What Actually Does | Attahir Labs"
  },
  "/contact.html": {
    "surface": "contact",
    "title": "Contact Us | Attahir Labs"
  },
  "/duty/": {
    "surface": "duty_calculator",
    "title": "Free US Import Duty Calculator: Signed HTSUS &amp; Chapter 99 Estimate | Attahir Labs"
  },
  "/duty/rates/": {
    "surface": "duty_rates",
    "title": "Historical Country-Level Tariff Planning Assumptions | Attahir Labs"
  },
  "/": {
    "surface": "homepage",
    "title": "Attahir Labs | Shopify Apps for Inventory, Tariffs, and Store Operations"
  },
  "/privacy.html": {
    "surface": "legal",
    "title": "Privacy Policy | Attahir Labs"
  },
  "/review/japan-duty-image-candidates/": {
    "surface": "review",
    "title": "Japan duty image candidates",
    "disabled": true
  },
  "/shipping/": {
    "surface": "shipping_calculator",
    "title": "Shipping Cost Calculator: Retail Benchmark Estimates | Attahir Labs"
  },
  "/terms.html": {
    "surface": "legal",
    "title": "Terms of Service | Attahir Labs"
  },
  "/tools/access-checker/": {
    "surface": "access_checker",
    "title": "Free WCAG Accessibility Checker | Attahir Labs",
    "disabled": true
  },
  "/tools/": {
    "surface": "tools_hub",
    "title": "Free Shopify Merchant Tools | Attahir Labs"
  }
});
  // END GENERATED PAGES
  const publicApps = new Set(['tariffshield', 'stockclearance', 'shelflife']);
  const campaignValues = Object.freeze({
    utm_source: ['attahirlabs', 'newsletter', 'shopify', 'google', 'bing', 'chatgpt', 'claude', 'gemini', 'linkedin', 'reddit'],
    utm_medium: ['website', 'email', 'organic', 'referral', 'social', 'cpc', 'ai-assistant'],
    utm_campaign: ['tariffshield', 'stockclearance', 'shelflife', 'free-tools', 'blog', 'portfolio', 'launch'],
    utm_content: ['homepage_public_apps', 'apps_hub_hero', 'app_page_hero', 'dead_stock_guide_cta', 'blog_cta', 'tool_cta', 'nav', 'footer']
  });
  const campaignKeys = { utm_source: 'campaign_source', utm_medium: 'campaign_medium', utm_campaign: 'campaign_name', utm_content: 'campaign_content' };
  const referrerHosts = new Set(['attahirlabs.com', 'www.attahirlabs.com', 'apps.shopify.com', 'google.com', 'www.google.com', 'google.ca', 'www.google.ca', 'bing.com', 'www.bing.com', 'duckduckgo.com', 'search.yahoo.com', 'chatgpt.com', 'claude.ai', 'gemini.google.com', 'perplexity.ai', 'www.perplexity.ai', 'www.linkedin.com', 'www.reddit.com', 't.co']);
  let pageContext = null;
  let booted = false;

  function optedOut() {
    if (root.ATTAHIR_ANALYTICS_DISABLED === true || root['ga-disable-' + MEASUREMENT_ID] === true || root.ATTAHIR_ANALYTICS_CONSENT === 'denied') return true;
    try { return root.localStorage?.getItem(OPT_OUT_STORAGE_KEY) === 'true'; }
    catch (_) { return true; }
  }

  function safeCampaign(search) {
    const clean = {};
    const query = new URLSearchParams(String(search || ''));
    for (const [key, values] of Object.entries(campaignValues)) {
      const input = query.getAll(key);
      if (input.length === 1 && values.includes(input[0])) clean[campaignKeys[key]] = input[0];
    }
    return clean;
  }

  function safeReferrer(input) {
    try {
      const url = new URL(input);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || !referrerHosts.has(url.hostname)) return '';
      return url.origin + '/';
    } catch (_) { return ''; }
  }

  function canonicalPath(pathname) {
    let path = String(pathname || '').replace(/\/index\.html$/, '/');
    // Cloudflare Pages also serves root .html documents without their extension.
    const documentAlias = path.replace(/\/$/, '') + '.html';
    if (Object.prototype.hasOwnProperty.call(pages, documentAlias)) return documentAlias;
    if (!path.endsWith('/') && !path.endsWith('.html')) path += '/';
    return Object.prototype.hasOwnProperty.call(pages, path) ? path : null;
  }

  function bootstrap(doc, location) {
    if (booted || !doc || !location) return;
    booted = true;
    const path = canonicalPath(location.pathname);
    // Known public pages only; redirects/review artifacts and local QA never send.
    if (!path || pages[path].disabled || location.protocol !== 'https:' || !['attahirlabs.com', 'www.attahirlabs.com'].includes(location.hostname) || location.port || optedOut()) return;
    pageContext = {
      page_location: 'https://attahirlabs.com' + path,
      page_path: path,
      page_title: pages[path].title,
      page_referrer: safeReferrer(doc.referrer),
      surface: pages[path].surface,
      traffic_class: 'unclassified',
      measurement_version: VERSION,
      ...safeCampaign(location.search)
    };
    root.dataLayer = root.dataLayer || [];
    root.gtag = root.gtag || function () { root.dataLayer.push(arguments); };
    root.gtag('js', new Date());
    // Safe defaults also cover SDK session/engagement events. The one owned
    // page_view below replaces gtag's default page_view.
    root.gtag('set', { ...pageContext, allow_google_signals: false, allow_ad_personalization_signals: false });
    root.gtag('config', MEASUREMENT_ID, { ...pageContext, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    root.gtag('event', 'page_view', { ...pageContext });
    const script = doc.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    doc.head.appendChild(script);
  }

  const contract = Object.freeze({
    app_store_outbound: { required: ['surface', 'placement', 'app_name', 'destination_type'], optional: [] },
    surface_viewed: { required: ['surface', 'surface_group'], optional: [] },
    cta_clicked: { required: ['surface', 'placement', 'destination_type'], optional: [] },
    tool_started: { required: ['surface', 'tool_name'], optional: [] },
    tool_completed: { required: ['surface', 'tool_name', 'result_band'], optional: [] },
    tool_failed: { required: ['surface', 'tool_name', 'error_code'], optional: [] },
    contact_intent: { required: ['surface', 'placement'], optional: ['app_name'] },
    tool_to_app_referral: {
      required: ['surface', 'placement', 'tool_name', 'app_name'],
      optional: []
    }
  });

  const enums = Object.freeze({
    surface: new Set(['homepage', 'apps_hub', 'app_page', 'blog_hub', 'blog_article', 'tools_hub', 'duty_rates', 'contact', 'legal', 'review', 'duty_calculator', 'shipping_calculator', 'access_checker']),
    surface_group: new Set(['tool']),
    placement: new Set(['nav', 'hero', 'app_card', 'content', 'article_inline', 'article_footer', 'footer', 'result_cta', 'tool_result']),
    destination_type: new Set([
      'apps_hub',
      'app_page',
      'shopify_app_store',
      'contact',
      'tool',
      'blog'
    ]),
    app_name: new Set([
      'tariffshield',
      'stockclearance',
      'shelflife',
      'accessshield',
      'storechangelog',
      'warrantytracker'
    ]),
    tool_name: new Set(['duty_calculator', 'shipping_calculator', 'access_checker']),
    result_band: new Set([
      'low',
      'medium',
      'high',
      'very_high',
      'not_available',
      'excellent_80_100',
      'needs_work_50_79',
      'poor_0_49'
    ]),
    error_code: new Set([
      'validation',
      'rate_limited',
      'network',
      'upstream',
      'timeout',
      'unknown'
    ])
  });

  const prohibitedKeyParts = new Set([
    'url',
    'domain',
    'shop',
    'email',
    'ip',
    'user',
    'agent',
    'query',
    'search',
    'text',
    'product',
    'order',
    'customer',
    'hs',
    'code',
    'referrer',
    'exception',
    'stack',
    'secret',
    'token',
    'input',
    'value',
    'issue',
    'finding',
    'description'
  ]);

  function normalizedKeyParts(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  function containsProhibitedKey(params, allowedKeys) {
    return Object.keys(params).some((key) => {
      if (allowedKeys.has(key)) return false;
      return normalizedKeyParts(key).some((part) => prohibitedKeyParts.has(part));
    });
  }

  function gtagTransport(name, params) {
    if (!pageContext || optedOut()) return;
    if (typeof root.gtag === 'function') root.gtag('event', name, { ...pageContext, ...params });
  }

  function createAnalytics(options) {
    let transport = options && Object.prototype.hasOwnProperty.call(options, 'transport')
      ? options.transport
      : gtagTransport;
    const seen = new Set();

    function validate(name, params) {
      const rule = contract[name];
      if (!rule || !params || typeof params !== 'object' || Array.isArray(params)) return null;
      if (name === 'app_store_outbound' && (!publicApps.has(params.app_name) || params.destination_type !== 'shopify_app_store')) return null;
      const allowedKeys = new Set([...rule.required, ...rule.optional]);
      if (containsProhibitedKey(params, allowedKeys)) return null;

      const clean = {};
      for (const key of rule.required) {
        const value = params[key];
        if (typeof value !== 'string' || !value || !enums[key]?.has(value)) return null;
        clean[key] = value;
      }
      for (const key of rule.optional) {
        if (params[key] === undefined || params[key] === null || params[key] === '') continue;
        if (typeof params[key] !== 'string' || !enums[key]?.has(params[key])) return null;
        clean[key] = params[key];
      }
      return { name, params: clean };
    }

    function emit(name, params) {
      const event = validate(name, params);
      if (!event) return null;
      try {
        if (typeof transport === 'function') transport(event.name, event.params);
      } catch (_) {
        // Analytics must never affect navigation or tool behavior.
      }
      return event;
    }

    function once(actionKey, name, params) {
      if (typeof actionKey !== 'string' || !actionKey || seen.has(actionKey)) return null;
      const event = emit(name, params);
      if (event) seen.add(actionKey);
      return event;
    }

    return {
      emit,
      once,
      validate,
      setTransport(next) {
        transport = next;
      }
    };
  }

  function dutyResultBand(ratePercent) {
    const rate = Number.parseFloat(String(ratePercent));
    if (!Number.isFinite(rate)) return 'not_available';
    if (rate <= 5) return 'low';
    if (rate <= 15) return 'medium';
    if (rate <= 30) return 'high';
    return 'very_high';
  }

  function shippingResultBand(lowestEstimate) {
    const amount = Number(lowestEstimate);
    if (!Number.isFinite(amount)) return 'not_available';
    if (amount <= 20) return 'low';
    if (amount <= 50) return 'medium';
    return 'high';
  }

  function surfaceFromPath(pathname) {
    const path = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    if (path === '/duty') return 'duty_calculator';
    if (path === '/shipping') return 'shipping_calculator';
    if (path === '/tools/access-checker') return 'access_checker';
    return null;
  }

  function datasetKey(key) {
    return 'analytics' + key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  const analytics = createAnalytics({});

  const boundDocuments = new WeakSet();
  function appFromLink(href) {
    try {
      const url = new URL(href, 'https://attahirlabs.com');
      if (url.protocol !== 'https:' || url.hostname !== 'apps.shopify.com' || url.port || url.username || url.password) return null;
      const app = url.pathname.replace(/^\//, '').replace(/\/$/, '');
      return publicApps.has(app) ? app : null;
    } catch (_) { return null; }
  }

  function placementFor(anchor, surface) {
    const explicit = anchor.dataset?.analyticsPlacement;
    if (enums.placement.has(explicit)) return explicit;
    if (anchor.closest('nav, header')) return 'nav';
    if (anchor.closest('footer')) return 'footer';
    if (anchor.closest('.blog-app-cta, [data-app-cta]')) return 'article_footer';
    if (anchor.closest('.hero')) return 'hero';
    if (anchor.closest('.app-card, .product-card')) return 'app_card';
    return surface === 'blog_article' ? 'article_inline' : 'content';
  }

  function bindDom(doc, location) {
    if (!doc || !location || boundDocuments.has(doc)) return;
    boundDocuments.add(doc);
    const surface = surfaceFromPath(location.pathname);
    if (surface && !pages[canonicalPath(location.pathname)]?.disabled) {
      analytics.once(
        `surface:${surface}`,
        'surface_viewed',
        { surface, surface_group: 'tool' }
      );
    }

    doc.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      const anchor = event.target?.closest?.('a[href]');
      const app = anchor && appFromLink(anchor.getAttribute('href'));
      if (app && pageContext) {
        analytics.emit('app_store_outbound', {
          surface: pageContext.surface, placement: placementFor(anchor, pageContext.surface),
          app_name: app, destination_type: 'shopify_app_store'
        });
        return; // One canonical event even when a legacy data attribute is present.
      }
      const element = event.target?.closest?.('[data-analytics-event]');
      if (!element) return;
      const name = element.dataset.analyticsEvent;
      if (name === 'app_store_outbound') return; // Only verified listing anchors above.
      const rule = contract[name];
      if (!rule) return;
      const params = {};
      for (const key of [...rule.required, ...rule.optional]) {
        const value = element.dataset[datasetKey(key)];
        if (value !== undefined) params[key] = value;
      }
      analytics.emit(name, params);
    });
  }

  // Supported runtime opt-out also stops the already loaded Google SDK. Direct
  // configuration flags are intended for preinitialization.
  analytics.disable = function (options) {
    root.ATTAHIR_ANALYTICS_DISABLED = true;
    root['ga-disable-' + MEASUREMENT_ID] = true;
    if (options?.persist) {
      try { root.localStorage?.setItem(OPT_OUT_STORAGE_KEY, 'true'); } catch (_) { /* Profile may deny storage. */ }
    }
  };
  analytics.createAnalytics = createAnalytics;
  analytics.dutyResultBand = dutyResultBand;
  analytics.shippingResultBand = shippingResultBand;
  analytics.surfaceFromPath = surfaceFromPath;
  analytics.bindDom = bindDom;
  analytics.safeCampaign = safeCampaign;
  analytics.safeReferrer = safeReferrer;
  analytics.canonicalPath = canonicalPath;
  analytics.appFromLink = appFromLink;
  analytics.VERSION = VERSION;
  analytics.EVENTS = Object.freeze(Object.keys(contract));

  if (root.document && root.location) {
    // An off choice in another same-origin tab must stop this SDK too. Turning
    // on never reactivates an existing document, including a BFCache restore.
    root.addEventListener?.('storage', function (event) {
      if (event.key !== OPT_OUT_STORAGE_KEY || event.newValue !== 'true') return;
      try {
        if (event.storageArea !== root.localStorage) return;
      } catch (_) { /* A relevant off event stays fail-closed if access is denied. */ }
      analytics.disable();
    });
    root.addEventListener?.('pageshow', function (event) {
      if (event.persisted && optedOut()) analytics.disable();
    });
    bootstrap(root.document, root.location);
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => bindDom(root.document, root.location));
    } else {
      bindDom(root.document, root.location);
    }
  }

  return analytics;
});
