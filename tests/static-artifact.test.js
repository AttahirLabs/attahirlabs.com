const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

(async () => {
  const {listPublicFiles, publicPages, buildStatic} = await import(pathToFileURL(path.resolve(__dirname, '../tools/build-static.mjs')));
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'attahirlabs-public-artifact-'));
  const put = (file, data = file) => { fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.writeFileSync(path.join(fixture,file),data); };
  const published = [
    'index.html','contact.html','privacy.html','terms.html','site-nav.css','favicon.svg','robots.txt','sitemap.xml','site.webmanifest','_headers','_redirects',
    'd31e55a42fcdc115698ed01271ccac0d.txt','IndexNow-proof.txt',
    'assets/cinema/motion.js','assets/cinema/motion.css','assets/cinema/district.webp','assets/cinema/district-loop.mp4','assets/cinema/scene-credits.txt',
    'assets/apps/stockclearance/chatgpt-review-demo-20261008.vtt','assets/commerce/motion.mjs','assets/commerce/vendor/THREE-LICENSE.txt','assets/fonts/Manrope-OFL.txt','assets/fonts/manrope-latin.woff2',
    'apps/index.html','apps/shelflife/index.html','apps/apps.css','blog/index.html','blog/a-guide/index.html','blog/blog-cta.css',
    'duty/index.html','duty/rates/index.html','duty/calculator.js','shipping/index.html','shipping/shipping.js','web-design/index.html',
    'analytics-preferences/index.html','tools/index.html','tools/access-checker/index.html',
  ];
  const privateFiles = [
    'READMESECRETS.txt','DEPLOY.md','BLOG_STYLE.md','MINI-MIGRATION-HANDOFF.md','debug.html','secret.js','package.json','.env','.dev.vars','CNAME',
    'functions/api/release-signup.js','.github/workflows/deploy-pages.yml','.git/config','.wrangler/state.sqlite','tests/private.test.js',
    'prototypes/unreal-cafe/SourceAssets/Snow/snow.blend','prototypes/commerce-world/index.html','releases/backup/index.html','review/private/index.html',
    'data/public-apps.json','tools/sync-product-pages.mjs','tools/internal/index.html',
    'assets/commerce/package.json','assets/commerce/vendor/README.md','assets/READMESECRETS.txt','assets/secret.json','assets/a.js.map',
    'assets/SourceAssets/rig.js','assets/SourceAssets/original.blend','assets/.private/secret.js','apps/node_modules/token.js','blog/releases/old/index.html',
    '_site/stale.html',
  ];
  try {
    published.forEach(file => put(file));privateFiles.forEach(file => put(file));
    assert.deepEqual(listPublicFiles(fixture), published.slice().sort(), 'only explicitly public files may be selected');
    assert.deepEqual(publicPages(fixture), published.filter(file => file.endsWith('.html')).sort().map(file => path.join(fs.realpathSync(fixture),file)));
    assert.ok(fs.existsSync(path.join(fixture,'_site/stale.html')), 'listing never changes the existing artifact');
    const secret = path.join(fixture,'.env');
    fs.symlinkSync(secret,path.join(fixture,'assets/leaked.css'));
    assert.throws(() => listPublicFiles(fixture), /rejects symlink/);
    assert.throws(() => buildStatic({sourceRoot:fixture}), /rejects symlink/);
    assert.ok(fs.existsSync(path.join(fixture,'_site/stale.html')), 'failed preflight preserves the previous output');
    fs.unlinkSync(path.join(fixture,'assets/leaked.css'));
    put('assets/oversized.mp4','');fs.truncateSync(path.join(fixture,'assets/oversized.mp4'),26*1024*1024);
    assert.throws(() => listPublicFiles(fixture), /25 MiB limit/);
    fs.unlinkSync(path.join(fixture,'assets/oversized.mp4'));
    const result = buildStatic({sourceRoot:fixture});
    assert.equal(result.files,published.length);
    assert.ok(result.bytes>0);
    const actual=[];
    const walk = dir => { for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else actual.push(path.relative(result.directory,file).split(path.sep).join('/'));} };
    walk(result.directory);
    assert.deepEqual(actual.sort(),published.slice().sort(), 'copied artifact has exact public coverage and no stale files');
    for(const file of published)assert.equal(fs.readFileSync(path.join(result.directory,file),'utf8'),fs.readFileSync(path.join(fixture,file),'utf8'),'copy preserves bytes: '+file);
    for(const file of privateFiles)assert.ok(!fs.existsSync(path.join(result.directory,file)), 'must not publish '+file);
    assert.ok(fs.existsSync(path.join(fixture,'functions/api/release-signup.js')), 'functions source remains in repository for Wrangler');
    fs.rmSync(result.directory,{recursive:true});
    fs.symlinkSync(path.join(fixture,'assets'),result.directory);
    assert.throws(() => buildStatic({sourceRoot:fixture}), /non-directory _site/);
    assert.ok(fs.existsSync(path.join(fixture,'assets/cinema/motion.js')), 'output symlink cannot delete source assets');
  } finally { fs.rmSync(fixture,{recursive:true,force:true}); }
  console.log('Static artifact allowlist, exact public byte copies, private-file leaks, stale output cleanup and symlink guards passed');
})().catch(error => { console.error(error);process.exitCode=1; });
