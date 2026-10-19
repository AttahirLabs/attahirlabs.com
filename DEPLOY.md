# Deploying attahirlabs.com

Attahir Labs is a static site hosted by the Cloudflare Pages project `attahirlabs-site`
in account `5528a2e45416ae7eb22b1320b49aa16a`.
The apex domain and `www` are production aliases for that project. GitHub Pages,
Netlify, and Vercel are not production deployment targets.

## Production release

Every push to the protected `main` branch runs
`.github/workflows/deploy-pages.yml`. A manual dispatch is also permitted, but
the workflow fails closed unless it is running the exact 40-character commit on
`refs/heads/main` from `AttahirLabs/attahirlabs.com`.

The workflow:

1. checks out the event SHA and verifies its source tree and clean status;
2. runs `node tools/build-static.mjs` to build `_site` from a strict public-file
   allowlist, preserving the selected files byte for byte;
3. snapshots the current production deployment IDs;
4. deploys the exact commit with the lockfile-pinned Wrangler CLI;
5. reads Cloudflare's production deployment API and requires exactly one new,
   latest, successful `main` deployment bound to that commit; and
6. uploads a sanitized `cloudflare-pages-deployment-proof` artifact containing
   the Cloudflare deployment identity, source tree, GitHub run, and timestamp.

A successful upload command by itself is not release evidence. The deployment
proof and production byte-parity checks are the release gates.

## Public artifact boundary

`tools/build-static.mjs` owns the static publish list. Root HTML pages, public
navigation CSS, favicons, app icons, robots, sitemap, web manifest, Pages headers
and redirects, and IndexNow verification files are selected explicitly. Public
assets and page resources under `assets`, `apps`, `blog`, `duty`, `shipping`,
`web-design`, and `analytics-preferences` use a bounded extension allowlist. The
only published `tools` files are `tools/index.html` and
`tools/access-checker/index.html`. Runtime and font license notices and scene
credits are included explicitly. WebVTT captions are public media assets and are
retained beside the videos that reference them.

Developer Markdown, source catalogs, package metadata, source maps, secrets and
environment files, Git/workflow state, tests, prototypes, Unreal projects, model
sources, private review pages, and release backups are omitted. Symlinks and
files above Pages' 25 MiB per-file limit fail closed. The builder validates its
input selection before replacing an existing `_site`, and never copies its own
output back into the artifact. `node tools/build-static.mjs --list` inspects the
publish list without writing an artifact.

Pages Functions are **not** static assets. Run the pinned Wrangler command from
the repository root so it discovers and compiles the retained `functions/`
directory. Do not run deployment from inside `_site` or copy function source
into `_site`. The existing signup runtime and production binding checks remain
required before deployment.

## Required GitHub configuration

- `cloudflare-pages-production` environment secret: `CLOUDFLARE_PAGES_API_TOKEN`
- `cloudflare-pages-production` environment variable: `CLOUDFLARE_ACCOUNT_ID`
  set to `5528a2e45416ae7eb22b1320b49aa16a`

Keep the repository-level variable at the same value. Environment variables take
precedence in these jobs; an old repository value can conceal a configuration
mistake in a job that does not select the production environment.

The token must be an account-scoped Cloudflare API token limited to Cloudflare
Pages write access for the Attahir Labs account. It does not need DNS, Workers,
KV, D1, SSL, or zone permissions. Never commit or print the token.

When repairing an expired or invalid token, replace only the production
environment secret above. Preserve the separate `INDEXNOW_KEY` repository secret.
Rerun the deployment workflow for the current `main` commit and require its
sanitized deployment proof before rerunning the matching search-notification
run. The search workflow must observe that exact commit as the latest successful
production deployment before it submits changed URLs to IndexNow.

The workflow's `GITHUB_TOKEN` has `contents: read` only. All third-party actions
and the Wrangler package are pinned; update those pins only through a reviewed
pull request with the deployment-contract tests passing.

## Local verification

Run the same deterministic site gate used by pull requests:

```bash
node tests/run-all-tests.js
git diff --check
```

The public Shopify policy URL remains:
`https://attahirlabs.com/privacy.html`.
