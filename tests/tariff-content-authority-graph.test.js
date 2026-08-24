const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data', 'tariff-content-claims.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const blogIndex = fs.readFileSync(path.join(root, 'blog', 'index.html'), 'utf8');
const asOf = new Date(process.env.TARIFF_CI_AS_OF || manifest.asOf);
const universalWarning =
  'No universal current U.S. tariff rate is available from country of origin alone.';

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function fileForPath(publicPath) {
  if (publicPath === '/blog/') return path.join(root, 'blog', 'index.html');
  if (publicPath === '/duty/') return path.join(root, 'duty', 'index.html');
  if (publicPath === '/duty/rates/') {
    return path.join(root, 'duty', 'rates', 'index.html');
  }
  return path.join(root, publicPath.replace(/^\/|\/$/g, ''), 'index.html');
}

assert.equal(manifest.schemaVersion, 1);
assert.ok(Number.isFinite(asOf.getTime()), 'TARIFF_CI_AS_OF must be an instant');
assert.ok(
  asOf < new Date(manifest.reviewAfter),
  'authority graph is past reviewAfter and must fail closed',
);
assert.equal(manifest.pages.length, 24);

const paths = new Set();
const canonicals = new Set();
const eventCanonicalIds = new Set();
const registryIds = new Set(Object.keys(manifest.authorityRegistry));

for (const page of manifest.pages) {
  assert.equal(page.schemaVersion, 1);
  assert.equal(page.publicationStatus, 'published');
  if (page.path === '/duty/') {
    assert.equal(page.authorityState, 'release4_active_exact_qsp');
    assert.equal(page.failClosedWording, 'Unsupported or incomplete cases remain number-free.');
  } else {
    assert.equal(page.verifiedThrough, manifest.asOf);
    assert.equal(page.reviewAfter, manifest.reviewAfter);
    assert.equal(page.failClosedWording, universalWarning);
  }
  assert.ok(!paths.has(page.path), `duplicate public path ${page.path}`);
  assert.ok(!canonicals.has(page.canonicalUrl), `duplicate canonical ${page.canonicalUrl}`);
  paths.add(page.path);
  canonicals.add(page.canonicalUrl);

  const file = fileForPath(page.path);
  assert.ok(fs.existsSync(file), `missing published page ${page.path}`);
  const html = fs.readFileSync(file, 'utf8');
  const expectedState = page.path === '/duty/'
    ? 'data-tariff-authority-state="release-4-active"'
    : 'data-tariff-authority-state="review-required"';
  assert.ok(html.includes(expectedState), `${page.path} lacks expected authority state`);
  if (page.path === '/duty/') {
    assert.ok(
      sitemap.includes(`<loc>${page.canonicalUrl}</loc>\n    <lastmod>${page.modifiedDate}</lastmod>`),
      `${page.path} sitemap lastmod differs from the authority manifest`,
    );
  }
  assert.ok(html.includes(page.failClosedWording), `${page.path} lacks authority warning`);
  assert.ok(
    html.includes(page.canonicalUrl),
    `${page.path} does not expose its canonical URL`,
  );
  assert.equal(
    [...html.matchAll(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi)].length,
    1,
    `${page.path} must expose exactly one canonical link`,
  );

  if (page.contentRole === 'event_canonical') {
    assert.ok(
      html.includes(`<h1>${page.title}</h1>`),
      `${page.path} visible title differs from manifest`,
    );
    assert.ok(
      html.includes(`<title>${page.title} | Attahir Labs</title>`),
      `${page.path} document title differs from manifest`,
    );
    assert.equal(
      count(blogIndex, `href="${page.path}"`),
      1,
      `${page.path} must appear exactly once in the blog index`,
    );
    assert.equal(
      count(sitemap, `<loc>${page.canonicalUrl}</loc>`),
      1,
      `${page.path} must appear exactly once in the sitemap`,
    );
    for (const eventId of page.eventIds) {
      assert.ok(
        !eventCanonicalIds.has(eventId),
        `event ${eventId} has duplicate canonical pages`,
      );
      eventCanonicalIds.add(eventId);
    }
  }

  for (const authorityId of page.authorityIds) {
    assert.ok(registryIds.has(authorityId), `${page.path} has unknown authority ${authorityId}`);
  }
  for (const claim of page.numericClaims) {
    assert.match(claim.claimId, /^[a-z0-9][a-z0-9-]+$/);
    assert.ok(
      ['supported_scope_limited', 'supported_future_scope_limited'].includes(claim.status),
      `${claim.claimId} has an unsafe publication status`,
    );
    assert.ok(
      html.includes(`data-tariff-claim-id="${claim.claimId}"`),
      `${claim.claimId} lacks a visible binding`,
    );
    assert.ok(
      html.includes(`${claim.value}%`),
      `${claim.claimId} visible value differs from the manifest`,
    );
  }

  if (page.calculatorSupport) {
    assert.ok(
      [
        'supported_exact_inputs_only',
        'unsupported_non_ad_valorem',
      ].includes(page.calculatorSupport),
      `${page.path} has an unknown calculator support state`,
    );
    if (page.calculatorSupport !== 'supported_exact_inputs_only') {
      const ctaBlock = html.match(/<div class="cta-box">[\s\S]*?<\/div>/)?.[0] || '';
      assert.ok(
        !ctaBlock.includes('href="/duty/"'),
        `${page.path} CTA must not link unsupported tariff coverage to /duty/`,
      );
    }
    for (const overclaim of [
      /flag exposed products/i,
      /review queue for tariff/i,
      /find exposed SKUs/i,
      /keep affected inventory in review/i,
    ]) {
      assert.ok(
        !overclaim.test(html),
        `${page.path} overstates contained catalog or inventory automation`,
      );
    }
  }
}

const stalePatterns = [
  /These rates are proposed, not in force\./i,
  /current(?:ly active)? 10% Section 122/i,
  /current Section 122 baseline/i,
  /temporary 10% Section 122 surcharge/i,
  /Section 122 \(10%\)/i,
  /17\.5[–-]35%/i,
  /60% and 85%/i,
  /stack on top of everything else/i,
  /updated weekly from government sources/i,
];

for (const page of manifest.pages) {
  const html = fs.readFileSync(fileForPath(page.path), 'utf8');
  for (const pattern of stalePatterns) {
    assert.ok(!pattern.test(html), `${page.path} still matches stale claim ${pattern}`);
  }
}

for (const slug of [
  'us-brazil-section-301-tariff-2026',
  'us-section-338-canada-tariffs-2026',
  'proposed-section-301-forced-labor-tariffs-2026',
]) {
  const canonical = `https://attahirlabs.com/blog/${slug}/`;
  const urlBlockPattern = new RegExp(
    `<url>\\s*<loc>${canonical}</loc>\\s*<lastmod>([^<]+)</lastmod>[\\s\\S]*?</url>`,
  );
  const match = sitemap.match(urlBlockPattern);
  assert.ok(match, `${slug} is missing from the sitemap`);
  assert.equal(
    match[1],
    manifest.pages.find((page) => page.canonicalUrl === canonical).modifiedDate,
    `${slug} has a stale sitemap lastmod`,
  );
  assert.ok(blogIndex.includes(`/blog/${slug}/`), `${slug} is missing from discovery`);
}

assert.ok(
  !paths.has('/blog/final-section-301-forced-labor-tariffs-2026/'),
  'forced-labor final action must retain the existing canonical slug',
);

console.log(
  `tariff content authority graph verified: ${manifest.pages.length} pages, ` +
    `${eventCanonicalIds.size} canonical event identities`,
);
