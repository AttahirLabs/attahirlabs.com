# AttahirLabs website measurement contract v1

Owner: AttahirLabs. Product: public website. Version: `website-v1`. Implementation date: 2026-09-07. Status: implemented locally; release and live destination validation pending. Historical data is unchanged. The cutover is the deployment timestamp, which must be recorded in the release evidence.

This contract implements the portfolio measurement standard. The observed unit is an anonymous browser/session or an explicit tool attempt. A website referral is intent to visit an App Store listing. It is not an install, activation, trial, paid subscription, retained merchant, or revenue. Website users and GA engagement are not proof of customers. Verified installs and revenue belong to the relevant app's authoritative records; no cross-property user identity is invented.

## Destination and coverage

The current website sends to GA4 property `527581631`, web stream `13874364112`, measurement ID `G-8QRJWWVMRZ`. That property also contains Shopify listing traffic historically; reports must segment by hostname and stream. Moving streams is outside this code change.

`tools/sync-measurement.mjs` inventories every published HTML file, installs one synchronous `/assets/analytics.js` bootstrap early in its head, after charset and any meta Content Security Policy, removes legacy direct gtag initialization, and generates a finite source catalogue in the shared asset. It covers the homepage, app hub and all app pages, blog hub and articles, calculators/rate guide, tools hub, contact and legal pages. Titles and canonical paths come from repository source, never arbitrary runtime input. New unknown page families fail synchronization until reviewed.

The AccessChecker page is an immediate redirect to the separate AccessChecker app. It, the legacy redirect documents, and the review image-selection artifact have the same script coverage but collection disabled. No fictitious tool activity is emitted by a redirect. The external AccessChecker app needs its own contract. The three content generators invoke synchronization after writing. Run `node tools/sync-measurement.mjs --write` after other HTML publishing; CI's coverage test rejects omissions and drift.

## Events and reporting

| Event | Trigger / unit | Parameters | Deduplication and interpretation |
| --- | --- | --- | --- |
| `page_view` | One eligible document load | Safe page context below | One bootstrap and explicit send; gtag default pageview is disabled. A reload is another view. |
| `app_store_outbound` | Native click, including keyboard activation, on an exact HTTPS listing link for TariffShield, StockClearance, or ShelfLife | `app_name`, `surface`, `placement`, `destination_type=shopify_app_store` | One delegated click listener; nested targets resolve to the anchor; duplicate bootstrap/binds are ignored. A distinct second click remains a distinct intent. No alias event doubles the same referral. |
| `surface_viewed` | Existing calculator surface view | `surface`, `surface_group=tool` | Existing once-per-surface contract, separate from pageviews. |
| `tool_started` | Existing accepted calculator submission | `surface`, `tool_name` | Existing action semantics preserved. No start merely on page load. |
| `tool_completed` | Existing successful calculator result | `surface`, `tool_name`, `result_band` | Existing `once(action:outcome)` allows one terminal outcome. No raw result amount. |
| `tool_failed` | Existing validation or calculation failure | `surface`, `tool_name`, `error_code` | Validation rejection is separate from accepted submissions; do not compute success rate as completed / (completed + all failed). |
| `tool_to_app_referral` | Existing duty-tool link to owned app page | `surface`, `placement`, `tool_name`, `app_name` | Distinct earlier funnel stage, not an App Store referral. |
| `cta_clicked`, `contact_intent` | Existing explicitly annotated tool CTAs | Existing bounded surface/placement/destination/app fields | Navigation or contact intent, not sale/lead completion. |

`app_name` remains the existing slug field. Source uses built-in `page_location` / `page_path`; no new source dimension is required. Register existing event dimensions `app_name`, `surface`, `placement`, `destination_type`, `traffic_class` as applicable. `measurement_version` marks the cutover in event data; it may be registered if version comparison is required.

Allowed placements are `nav`, `hero`, `app_card`, `content`, `article_inline`, `article_footer`, `footer`, `result_cta`, `tool_result`. Context uses finite surface enums and the generated catalogue. Destination detection validates exact origin and the three listing paths. Query strings, link text and destination URLs are not included in the event. Existing CTA hrefs/UTMs and navigation behavior are preserved.

No website activation, return-value, trial, payment or retention events are manufactured. These stages are not applicable until an authoritative app integration implements and verifies them.

## Privacy, consent and owned QA

The site has no existing consent-banner controller. This change introduces no blocking UX. Before the first site script, a host integration can set `window.ATTAHIR_ANALYTICS_CONSENT = 'denied'`; the bootstrap honors it. The standard `window['ga-disable-G-8QRJWWVMRZ'] = true` and `window.ATTAHIR_ANALYTICS_DISABLED = true` also suppress the SDK load, configuration and all owned sends. Existing consent integrations must set denial before this script. A later denial stops owned explicit sends; to stop an already-loaded SDK's automatic collection use `window.AttahirAnalytics.disable({ persist: true })`, which sets the standard `ga-disable` flag immediately and persists the opt-out when storage is available. Reload before collecting again. Consent management UX is not implemented here.

Owned QA must establish opt-out before navigating or before any document script executes. For Playwright, use `context.addInitScript(() => { window.ATTAHIR_ANALYTICS_DISABLED = true; window['ga-disable-G-8QRJWWVMRZ'] = true; });` before creating/navigating the page. For a dedicated manual browser profile, set `localStorage.setItem('attahir.analytics.disabled', 'true')` on the site origin, then reload; the first setup visit itself may already have been collected. For a clean first visit use the browser init-script approach. Reset with `localStorage.removeItem('attahir.analytics.disabled')`, clear any window flags, and reload. Suppression is reversible and does not remove historical records.

Only HTTPS production apex/www hosts and catalogue pages can collect. Localhost, previews, custom ports, unknown paths and disabled pages do not load production GA. Traffic without explicit verification is `traffic_class=unclassified`. No geography, data-center city, user-agent pattern, direct traffic, or engagement threshold becomes an automated bot/customer verdict. Owned QA is suppressed rather than relabeled organic or customer traffic. Unknown external probes remain unclassified.

All owned events and gtag defaults use a fixed production origin plus a finite canonical page path; query strings and fragments are removed. The referrer is reduced to an origin from a finite known public referral-host list; unknown origins, store domains, userinfo, custom ports and invalid URLs are dropped. No form values, email, shop domain, product value, calculator input, IP, stack, arbitrary title or raw URL enters an owned event. SDK-managed transport fields remain subject to the GA settings below.

Validated campaign inputs are forwarded explicitly as `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content` while `page_location` stays query-free. Values are exact, case-sensitive enums; duplicate keys and unknown values are dropped. This preserves known campaigns without permitting arbitrary query payloads:

| Input | Allowed values |
| --- | --- |
| `utm_source` | attahirlabs, newsletter, shopify, google, bing, chatgpt, claude, gemini, linkedin, reddit |
| `utm_medium` | website, email, organic, referral, social, cpc, ai-assistant |
| `utm_campaign` | tariffshield, stockclearance, shelflife, free-tools, blog, portfolio, launch |
| `utm_content` | homepage_public_apps, apps_hub_hero, app_page_hero, dead_stock_guide_cta, blog_cta, tool_cta, nav, footer |

New campaign values require a reviewed code/contract update. Unknown UTMs, search terms, `gclid` and other click IDs are intentionally not forwarded. Reports must acknowledge this attribution boundary. No identifiers/session IDs or engagement are fabricated.

## Validation and release gates

Run `node tests/run-all-tests.js`, `node tools/sync-measurement.mjs`, and `git diff --check`. The new test inventories actual HTML, exercises every public App Store href through the delegated handler, tests nested/keyboard clicks, repeated includes/binds, fail-closed hosts/paths, opt-outs, denied consent and hostile URL/query/referrer values. Existing calculator tests retain action and terminal-result coverage.

The homepage and calculators preserve their existing API connection origins and add the scoped, non-advertising GA collection origins from [Google's CSP guidance](https://developers.google.com/tag-platform/security/guides/csp#google_analytics): `https://*.google-analytics.com`, `https://*.analytics.google.com`, and `https://www.googletagmanager.com`. The bootstrap follows meta CSP so the policy applies before execution. Actual browser network delivery remains a live verification gate.

Before claiming live verification, inspect this stream's enhanced measurement settings. Automatic outbound clicks, form interactions, site search, downloads and browser-history pageviews can emit additional URL/form metadata independently of this owned contract; disable conflicting automatic collection or validate its privacy and duplication behavior. This code does not change GA administration. Preserve normal SDK session and engagement behavior; do not synthesize replacements.

After deployment, record the commit, deploy time and destinations. First verify a QA-opted-out browser sends no GA request. Then use an explicitly approved validation visit with synthetic values and inspect one pageview and one referral arriving at the expected destination with only bounded fields, no duplicates and attribution preserved. Do not label those validation visits customer activity. A tool validation must verify the existing start/outcome semantics without modifying a real merchant's records. Until then the status remains implemented and locally tested, not live verified.
