# App launch signup operations

The three unreleased app pages submit to `/api/release-signup`. A Cloudflare
Pages Function validates the request and stores app, normalized email, consent
version and creation time in D1. An atomic unique key deduplicates each app/email
pair. The same email can join multiple app lists. The endpoint has no read or
export route. It never sends email on signup. No email enters analytics or URLs.

## Activation gate (not yet completed)

Cloudflare CLI authentication was unavailable during implementation. Do not
merge/publish until the following setup and a preview signup test are complete.
The deployment workflow explicitly refuses a missing production binding.

1. Authenticate Wrangler to the existing Attahir Labs account
   `6f945ca08a01d636e0b02f37e859d4d5`. Use the pinned CLI in
   `.github/cloudflare-pages/node_modules/.bin/wrangler`.
2. Create a dedicated D1 database: `wrangler d1 create attahirlabs-release-signups`.
3. Initialize this new database:
   `wrangler d1 execute attahirlabs-release-signups --remote --file .github/signups/schema.sql`.
4. In Pages project `attahirlabs`, Settings > Bindings, bind the production
   database as `RELEASE_SIGNUPS`. Use a separate initialized D1 database for
   previews; never bind the production signup list to preview code.
5. Deploy this branch to a preview. Submit a synthetic `example.com` email and
   verify the actual D1 row, duplicate suppression, and app separation. Remove
   those exact synthetic rows afterward. The deployment workflow's Pages API
   token can remain limited to Pages; setup requires a separately authorized D1
   operator. No API keys belong in source or public JavaScript.
6. Follow the existing protected-main review/release process. Verify the three
   live form pages and an actual stored test signup on apex and www. Delete only
   the synthetic test records, and retain the normal deployment proof.

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
