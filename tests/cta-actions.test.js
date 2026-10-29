const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

(async () => {
  const root = path.resolve(__dirname, '..');
  const {publicPages} = await import(pathToFileURL(path.join(root, 'tools/build-static.mjs')));
  const {applyCTAContract} = await import(pathToFileURL(path.join(root, 'tools/cta-components.mjs')));
  const pages = publicPages(root);
  let links = 0;
  let projectLinks = 0;
  for (const file of pages) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(applyCTAContract(html, relative), html, `${relative}: action links stay consistent after generation`);
    assert.doesNotMatch(html, /<button\b[^>]*(?:data-cinema-toggle|data-motion-toggle)/, `${relative}: removed pause controls stay absent`);
    assert.doesNotMatch(html, /href="(?:\/web-design\/#start|javascript:)/i, `${relative}: no obsolete enquiry chain or script-only link`);
    const pageURL = new URL('/' + relative.replace(/index\.html$/, ''), 'https://attahirlabs.com');
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      links++;
      const label = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const url = new URL(match[1].replaceAll('&amp;', '&'), pageURL);
      assert.ok(['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol), `${relative}: supported action ${label}`);
      if (/^(?:Start a project|Let[’']s (?:talk about your project|build your next chapter)|Tell us what you[’']re building)/i.test(label)) {
        projectLinks++;
        assert.equal(url.pathname, '/web-design/start/', `${relative}: ${label} opens the actual form`);
        assert.equal(url.hash, '');
      }
      if (/^Explore (?:all |the )?apps(?:\s*[↗→])?$/i.test(label)) {
        assert.equal(url.pathname, '/apps/', `${relative}: app exploration goes to the apps page`);
        assert.equal(url.hash, '');
      }
      if (url.origin !== pageURL.origin) continue;
      let target = path.join(root, decodeURIComponent(url.pathname));
      if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
      else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${relative}: destination exists for ${label}: ${url.pathname}`);
      if (url.hash && path.extname(target) === '.html') {
        const fragment = decodeURIComponent(url.hash.slice(1));
        const destination = fs.readFileSync(target, 'utf8');
        assert.ok([...destination.matchAll(/\bid="([^"]+)"/g)].some(m => m[1] === fragment), `${relative}: destination fragment exists: ${url.href}`);
      }
    }
  }
  assert.ok(projectLinks >= 5, 'cover all project-entry placements');
  const formPage = fs.readFileSync(path.join(root, 'web-design/start/index.html'), 'utf8');
  assert.match(formPage, /<form\b[^>]*data-project-inquiry/);
  for (const name of ['name', 'email', 'service', 'brief']) assert.match(formPage, new RegExp(`<(?:input|select|textarea)\\b[^>]*name="${name}"[^>]*required`));
  console.log(`CTA actions: ${pages.length} public pages, ${links} links and ${projectLinks} direct project links resolve; no pause buttons remain.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
