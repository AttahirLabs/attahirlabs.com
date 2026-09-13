# Attahir Labs website content review — September 13, 2026

This change updates the homepage, public app pages, app directory, shared policies, and StoreChronicle naming. It does not change app prices, app permissions, app runtime configuration, or the production deployment mechanism.

## Product reference

`data/public-apps.json` is the maintained source for the three public product pages and the homepage/app-directory cards. Run `node tools/sync-product-pages.mjs` after editing it. CI rejects stale generated pages. HTML is generated ahead of time; prices and install links do not depend on client JavaScript.

Public listing text and screenshot URLs were retrieved directly on September 13, 2026:

- https://apps.shopify.com/stockclearance — Free 25 products, Standard $9/month or $90/year, Pro $19/month or $190/year; 14-day paid-plan trials.
- https://apps.shopify.com/tariffshield — Free 10 SKUs, Standard $19/month, Pro $190/year; no paid-plan trial advertised. Do not infer a shared monthly/annual tier structure.
- https://apps.shopify.com/shelflife — Free 25 lots/batches, Standard $14/month or $140/year, Pro $29/month or $290/year; 14-day paid-plan trials.
- https://apps.shopify.com/partners/attahir-labs — three public apps. Private submission progress is not established by this directory.

The screenshot sources are recorded per product in the reference. They are copied from the current public App Store gallery, show example data, and are explicitly labelled that way. They are not new captures of a merchant's live installation. Existing brand icons and social-preview images are preserved.

## Source and disclosure evidence

Read-only source revisions verified against remote `main` on the review date:

- StockClearance: `AttahirLabs/stock-clearance` at `7abce2a407591e43b8ac7ccf622aff923d2f5383`. Relevant files: `prisma/schema.prisma`, `app/models/email.server.ts`, `app/models/shop-data-erasure.server.ts`, `app/models/measurement.server.ts`, and authenticated uninstall handling.
- TariffShield: `AttahirLabs/tariff-shield` at `dbba709109ac4d78a6165c00b61109ff2cf5a612`. Relevant files: `prisma/schema.prisma`, `app/models/email.server.ts`, `app/models/shop-cleanup.server.ts`, `app/models/analytics.server.ts`, and `app/models/measurement.server.ts`. The FAQ describes the narrow U.S. quartz surface product coverage and current suspension of exact calculations.
- ShelfLife: `AttahirLabs/shelflife` at `c947e920fadb117c94c7f61fd1d32b20bd6d76df`. Relevant files: `prisma/schema.prisma`, `app/models/feedback.server.ts`, `app/models/tenant-lifecycle.server.ts`, `app/models/analytics.server.ts`, and billing observations.

Runtime analytics flags and provider retention settings were not changed or independently audited in this content update. Disclosures describe configured/optional delivery and distinguish first-party measurement from Google Analytics. They do not assert that every optional event is enabled, that keyed identifiers are anonymous, or that uninstall instantaneously erases provider-held records. Exact provider retention periods are not invented.

The older open privacy draft in PR #12 was compared for coverage. Shopify-hosted copies, app-owned effects, replay receipts, and the loss of cleanup access after uninstall are included; this change does not alter its reviewer video or close that older PR.

The Resend disclosure now includes recipients, subject, and message contents. Billing wording consistently refers to Shopify Billing. Uninstall wording follows https://help.shopify.com/en/manual/apps/uninstalling-apps and https://help.shopify.com/en/manual/your-account/manage-billing/billing-charges/types-of-charges/third-party-charges/app-charges.

StoreChronicle is the user-selected canonical product name. Existing article URLs are retained. `/apps/storechangelog`, `/apps/storechangelog/`, and `/apps/storechangelog/index.html` redirect to `/apps/storechronicle/`. Its page continues to state that the App Store listing is in preparation and describes the broader store-record purpose without representing in-progress restoration as released.

## Future content changes

1. Verify public availability and pricing on Shopify; check the relevant deployed functionality before adding new feature claims.
2. Update the product reference, screenshot sources, and affected app-specific policy sections.
3. Regenerate product pages, then run `node tools/sync-blog-cta-contract.mjs --write` when CTA copy changes and `node tools/sync-measurement.mjs --write` when pages or titles change.
4. Update sitemap dates only for the relevant content changes. A refreshed app promotion does not reverify dated tariff research.
5. Run `node tests/run-all-tests.js`, `git diff --check`, and mobile/desktop checks of changed pages, anchors, images, FAQs, and redirects.
6. Follow `DEPLOY.md` and the existing required review. After publication, verify the deployment proof and live HTML/assets for the approved commit.

## Independent review follow-up

Hiro reviewed the initial head `1616688aa6451c5974813836f40eeedc493b4e78`. His earlier main-session review raised a P2 about Exact Duty scope and availability; a later Telegram-session review did not retrieve that finding. Codex reconciled both against the portfolio status and a fresh public API response at 2026-09-13T18:42:01Z: the canonical QSP input returned HTTP 422, `RULESET_REVIEW_REQUIRED`, no calculation, `2026.09.03+release4.3`, and evidence valid through 2026-09-10T12:20:00Z. The FAQ and generated FAQ metadata now state the narrow quartz surface product scope and temporary unavailability. This is a content correction; it does not renew the ruleset or change the calculator backend. Reverify this statement when the reviewed rules are restored.
