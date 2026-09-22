# App launch signup operations

The three unreleased app pages submit to `/api/release-signup`. A Cloudflare
Pages Function validates the request and stores app, normalized email, consent
version and creation time in D1. An atomic unique key deduplicates each app/email
pair. The same email can join multiple app lists. The endpoint has no read or
export route. It never sends email on signup. No email enters analytics or URLs.

## Production activation

The site uses Cloudflare account `5528a2e45416ae7eb22b1320b49aa16a` and
Pages project `attahirlabs-site`. Production binds `RELEASE_SIGNUPS` to the
dedicated `attahirlabs-release-signups` D1 database. Preview uses a separate
`attahirlabs-release-signups-preview` database. Both have the schema in
`schema.sql`.

The approved design was directly deployed to production on 2026-09-22 from
commit `00babdce730e50c66610411aa8f11e86e3122c6b`. Synthetic submissions
to the apex and www hosts stored one row each for AccessShield, StoreChronicle,
and WarrantyTracker; a duplicate AccessShield submission did not add a row.
The three synthetic rows were then deleted and a zero-row check confirmed
cleanup. The repository's GitHub Actions workflow targets this account and
project, but its existing Pages API token still needs validation in a real
workflow run before CI deployment is considered proven.

For subsequent releases, follow the protected-main review process, verify the
three live form pages and a stored test signup, remove only the synthetic test
records, and retain the workflow's deployment proof. The Pages API token can
remain limited to Pages; D1 administration uses a separate authorized operator.
No API keys belong in source or public JavaScript.

Pages deploy compiles the root `functions/` directory. It is excluded from the
static `_site` artifact; schema and operations files are under excluded `.github`.

## Verification

- `node tests/run-all-tests.js`
- After `npm ci --ignore-scripts` in `.github/cloudflare-pages`, run
  `node .github/signups/verify.mjs` from the repository root. This exercises the
  real local Workers runtime and D1, using the compatibility date supported by
  the pinned runtime. It verifies persistence, deduplication, separate app lists,
  rate limiting, and an honest 503 when storage fails.
- Chrome checks at 1440, 390, and 320px cover success/reset, failure/retry and
  overflow. Browser response fixtures test UI behavior; the D1 test above tests
  actual storage. Neither is production proof.

## Launch and cancellation

An operator can query `release_signups` through the authenticated Cloudflare D1
console, filtering on the exact app slug. The form does not detect app launches
or schedule a campaign automatically. At launch, prepare the matching app's
email with its public install URL, honor cancellation requests, and obtain the
user's authorization to send the announcement. Use the list only for that app's
launch; do not add it to a newsletter. Track successful delivery before clearing
fulfilled signup records so retries do not send duplicate announcements.

Cancellation requests go to support@attahirlabs.com from the registered address.
Delete the matching app/email record using a parameterized query in an authorized
operator tool. Do not put real addresses in checked-in SQL, logs, or evidence.
Daily network-address digests cap submissions at 20 per day; cleanup occurs on
subsequent successful signup processing. Honeypot and same-origin checks reduce
basic abuse; they do not verify email ownership. Review the list before sending.
