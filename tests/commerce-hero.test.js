const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
// The native cinematic homepage replaces the elevator pod markup. Preserve
// the supported-scope checks on the actual public TariffShield card.
const tariffPanel = html.match(/<article\b[^>]*data-app="tariffshield"[\s\S]*?<\/article>/)?.[0];
assert.ok(tariffPanel, 'homepage must retain the current public TariffShield card');
assert.match(tariffPanel, /U\.S\. quartz surface/);
assert.match(tariffPanel, /Complete reviewed filing facts are required\./);
assert.match(tariffPanel, /Unsupported or incomplete inputs produce no estimate\./);
assert.match(tariffPanel, /Confirmed price updates/);
assert.match(tariffPanel, /href="\/apps\/tariffshield\/"/);
const tariffScope = tariffPanel.match(/<p\b[^>]*class="app-scope"[^>]*>([\s\S]*?)<\/p>/)?.[1];
assert.ok(tariffScope, 'homepage must show the supported tariff scope');
assert.doesNotMatch(tariffScope, /Ceramic table lamp|\$[0-9]/, 'coverage disclosure must not contain invented duty results');

(async () => {
  const {CommerceTimeline} = await import('../assets/commerce/timeline.mjs');
  const tour = new CommerceTimeline();
  const advance = (seconds, playing = true) => {
    for(let i = 0; i < Math.round(seconds * 100); i++) tour.advance(.01, playing);
  };
  advance(6);
  assert.equal(tour.index, 0, 'visitors have several seconds to inspect the initial business');
  assert.equal(tour.traveling, false);
  advance(.8);
  assert.equal(tour.traveling, true);
  const frozen = [tour.position, tour.elapsed, tour.dwell];
  advance(20, false);
  assert.deepEqual([tour.position,tour.elapsed,tour.dwell], frozen, 'pause freezes both elevator movement and dwell time');
  advance(1.2);
  assert.equal(tour.index, 1);
  assert.equal(tour.traveling, false);
  tour.select(3, true);
  assert.equal(tour.index, 3, 'manual navigation works instantly for reduced motion');
  const before = tour.offset(0);
  tour.next(); tour.advance(.05);
  assert.ok(Math.abs(tour.offset(0) - before) < .03, 'last-to-first elevator motion is continuous');
  advance(1.4);
  assert.equal(tour.index, 0);
  assert.equal(tour.offset(0), 0, 'the active business aligns with the display floor');
  assert.equal(tour.topIndex,3,'the foreground panel follows the business above the display floor');
  assert.equal(tour.offset(tour.topIndex),-1,'the chosen business occupies the top floor');
  const dwell = tour.dwell;
  tour.advance(300);
  assert.ok(tour.dwell - dwell <= .101, 'returning from a background tab cannot skip multiple businesses');
  tour.select(2, true); tour.select(0, true);
  assert.equal(tour.index, 0);
  for(let cycle = 0; cycle < 8; cycle++) {
    advance(8);
    assert.ok(tour.index >= 0 && tour.index < 4);
    assert.equal(new Set([0,1,2,3].map(i=>tour.offset(i))).size,4,'each pod has a distinct elevator position');
  }
  const expanded=new CommerceTimeline(6,6,1.15);
  for(let floor=0;floor<5;floor++)expanded.next(true);
  expanded.next();
  for(let i=0;i<120;i++)expanded.advance(.01);
  assert.equal(expanded.index,0,'six-business rotation wraps to the first shop');
  assert.equal(expanded.position,6,'absolute lap survives wrapping for alternate app panels');
  assert.equal(expanded.topIndex,5,'the top-floor business wraps with the six-business rotation');
  console.log('Commerce hero: dwell, pause, manual navigation, reduced-motion selection and seamless elevator wrap passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
