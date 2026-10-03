# Navy Studio design validation

Approved direction: B, October 3, 2026.

## Changes

- Shared navy navigation/footer and Manrope typography on 94 public HTML routes.
- Navy homepage hero with the existing six-business elevator, warmer lighting, editorial storefront previews, and app showcase cards.
- Six dedicated product pages with split heroes, approved app logos, glass previews, and their existing workflows and launch forms.
- Responsive web-design showcase and matching journal, tool, and reading surfaces.
- New WebP imagery and self-hosted font; no new runtime dependency.

## Validation before release

- All 30 site test files passed via `node tests/run-all-tests.js`.
- Both page generators passed `--check`; `git diff --check` passed.
- Real Workers/D1 signup tests passed: persistence, app separation, deduplication, rate limits, and storage-failure behavior.
- Browser layout checks at 320px and 390px found no horizontal overflow on the homepage, all six app pages, services, journal, an inventory guide, and shipping calculator.
- Desktop/tablet review confirmed readable hero copy, product cards and storefront composition. Mobile navigation opens and closes with Escape.
- Existing collision, handoff, elevator continuity, top-store panel matching and reduced-motion tests passed.
- Production Pages configuration has a nonempty `RELEASE_SIGNUPS` D1 binding in `env.production`.

Deployment and public byte parity are verified separately after the protected-main release.
