const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const sync=spawnSync(process.execPath,['tools/sync-vector-design.mjs','--check'],{encoding:'utf8'});
assert.equal(sync.status,0,sync.stdout+sync.stderr);
const products=['stockclearance','tariffshield','shelflife','accessshield','storechronicle','warrantytracker'];
for(const slug of products){
 const html=fs.readFileSync(`apps/${slug}/index.html`,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.ok(html.includes('class="product-brand"'));
 assert.ok(html.includes('data-demo'));
 assert.equal((html.match(/data-step=/g)||[]).length,3);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,`${slug}: duplicate IDs`);
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),`${slug}: missing anchor ${m[1]}`);
 for(const m of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)(?:\?[^"]*)?"/g))assert.ok(fs.existsSync('.'+m[1]),`${slug}: missing asset ${m[1]}`);
 assert.ok(html.indexOf('/assets/vector.css')>html.indexOf('/apps/product-pages.css'),'theme overrides load last');
}
const privacy=fs.readFileSync('privacy.html','utf8');
for(const text of ['App measurement:', 'off by default', 'independent deletion log', 'Downgrade export grace.']) assert.ok(privacy.includes(text),`Preserve live StoreChronicle disclosure: ${text}`);
const content=fs.readFileSync('data/storechronicle-details.inc','utf8');
for(const text of ['not a whole-store backup','up to 120 days','seven-day read-only'])assert.ok(content.includes(text));
console.log('Vector pages: generator consistency, distinct product navigation, asset and anchor integrity, newer live disclosures preserved');
