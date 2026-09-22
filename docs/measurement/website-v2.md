# Website measurement v2

Source implementation September 20, 2026. Deployment and processed GA acceptance are pending.

This extends `website-v1.md` with an explicit measurement-version boundary. Destination remains property 527581631, stream 13874364112, measurement ID G-8QRJWWVMRZ. The v1 canonical-page, opt-out, sanitation and single-bootstrap rules continue to apply.

## Changes

- All public App Store anchors have complete finite campaign tags, maintained by `tools/sync-measurement.mjs`. Existing reviewed placements remain; newly tagged app-page anchors use the general `app_page_cta` bucket rather than assuming a hero location. Internal page links and structured metadata are not tagged.
- Exact contact-page and support-mailto clicks emit one `contact_intent`, including the app where known. Annotated links do not double-send. Email addresses, subjects and message contents are not analytics payloads. Intent is not an accepted lead.
- An AccessChecker result handoff can emit one `tool_referral_landed` on the AccessShield page with bounded surface, placement, tool and app. It accepts `from=access_checker&placement=result_cta` and the exact older four-UTM tuple. Old internal handoff UTMs do not overwrite acquisition fields. This records unclassified landing context, not identity continuity or a verified customer.
- Every owned context adds `environment=production`. Ordinary traffic stays unclassified. Owned QA can set `ATTAHIR_ANALYTICS_TRAFFIC_CLASS` before bootstrap to exactly internal, development, review or monitoring; the source becomes `browser_diagnostic_marker`. This marker cannot establish merchant identity, does not come from query parameters, and is still subject to opt-out.
- Duty and Shipping local input rejection emits `tool_validation_failed`, with no valid start or terminal failure. Server rejection after an accepted attempt remains a failed attempt.
- Duty ignores duplicate submissions while in flight and aborts the browser request after 60 seconds. A timeout emits a bounded `tool_failed / timeout` and releases the UI. This means no result was received by the browser; it does not certify the server operation failed. Closing a tab can still leave an unresolved start.

## Acceptance and rollback

Meaningful tests cover every published App Store anchor and its campaign vocabulary, payload sanitation, contact deduplication, internal referral context, invalid-input separation, concurrent submissions and timeout cleanup. Run the repository's complete deterministic gate and diff check under the applicable resource guard before release.

Use an owned classified or suppressed browser path. Match the deployment and then verify processed GA rows; no live traffic or conversion claim follows from tests alone. If the diagnostic marker cannot be injected before initialization, suppress browser QA and keep processed diagnostic acceptance pending rather than sending unlabeled QA.

Rollback is a source revert and normal deployment. Preserve historical GA fields and destination IDs; version v1/v2 marks the semantics boundary. No key event, retention setting, customer data, database or billing behavior changes with this website release.

## Web design surface
`/web-design/` uses the finite `services` surface. Its project email link follows the existing `contact_intent` contract; subjects and message content are excluded. Tests cover the surface and one contact-intent event. A click is not a sent email, received inquiry, or paying project. No new analytics destination or data-collection backend is introduced.
