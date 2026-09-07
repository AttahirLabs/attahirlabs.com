// Normalize every published HTML family after content generation. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const ignored = new Set(['.git', '.github', 'node_modules', 'tests', '_site']);
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    if (ignored.has(entry.name) || entry.name.startsWith('.')) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
function surface(p) {
  if (p === '/') return 'homepage';
  if (p === '/apps/') return 'apps_hub';
  if (p.startsWith('/apps/')) return 'app_page';
  if (p === '/blog/') return 'blog_hub';
  if (p.startsWith('/blog/')) return 'blog_article';
  if (p === '/duty/') return 'duty_calculator';
  if (p === '/duty/rates/') return 'duty_rates';
  if (p === '/shipping/') return 'shipping_calculator';
  if (p === '/tools/access-checker/') return 'access_checker';
  if (p === '/tools/') return 'tools_hub';
  if (p === '/contact.html') return 'contact';
  if (p.startsWith('/review/')) return 'review';
  if (['/privacy.html', '/terms.html', '/analytics-preferences/'].includes(p)) return 'legal';
  throw new Error('Add a reviewed surface for ' + p);
}
const catalogue = {};
let changed = 0;
function update(file, next) {
  if (fs.readFileSync(file, 'utf8') === next) return;
  changed++;
  if (write) fs.writeFileSync(file, next);
  else console.error('Measurement sync needed: ' + path.relative(root, file));
}
for (const file of files(root)) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const publicPath = '/' + relative.replace(/(^|\/)index\.html$/, '$1');
  const html = fs.readFileSync(file, 'utf8');
  const disabled = publicPath === '/analytics-preferences/' || publicPath.startsWith('/review/') || /http-equiv=["']refresh["']/i.test(html);
  // Titles come only from reviewed source files, never dynamic document content.
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim();
  if (!title || title.length > 200) throw new Error('Missing/bounded title: ' + relative);
  catalogue[publicPath] = { surface: surface(publicPath), title, ...(disabled ? { disabled: true } : {}) };
  let next = html.replace(/^[ \t]*<script\b[^>]*src=["'][^"']*(?:googletagmanager\.com\/gtag\/js|\/assets\/analytics\.js)[^"']*["'][^>]*>\s*<\/script>[ \t]*\n?/gim, '');
  next = next.replace(/^[ \t]*<script\b[^>]*>([\s\S]*?)<\/script>[ \t]*\n?/gim, (match, body) => /gtag\(['"]config['"],\s*['"]G-8QRJWWVMRZ/.test(body) ? '' : match);
  // Preserve existing API origins while allowing GA's documented non-ad collection endpoints.
  next = next.replace(/(<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]+)("[^>]*>)/i, (match, start, policy, end) => {
    const updated = policy.replace(/connect-src\s+([^;]+)/, (_, values) => {
      const origins = new Set(values.trim().split(/\s+/));
      origins.delete('https://www.google-analytics.com');
      for (const origin of ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com']) origins.add(origin);
      return 'connect-src ' + [...origins].join(' ');
    });
    return start + updated + end;
  });
  const tag = '    <script src="/assets/analytics.js"' + (disabled ? ' data-analytics-transport="disabled"' : '') + '></script>';
  // A meta CSP must take effect before scripts execute. Charset stays early too.
  const before = next.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/i)?.[0]
    || next.match(/<meta\b[^>]*charset=[^>]*>/i)?.[0];
  if (before) next = next.replace(before, before + '\n' + tag);
  else next = next.replace(/(<head\b[^>]*>\s*\n)/i, '$1' + tag + '\n');
  update(file, next);
}
const assetPath = path.join(root, 'assets/analytics.js');
const asset = fs.readFileSync(assetPath, 'utf8');
update(assetPath, asset.replace(/  \/\/ BEGIN GENERATED PAGES[^\n]*\n[\s\S]*?  \/\/ END GENERATED PAGES/, '  // BEGIN GENERATED PAGES (tools/sync-measurement.mjs)\n  const pages = Object.freeze(' + JSON.stringify(catalogue, null, 2) + ');\n  // END GENERATED PAGES'));
if (changed && !write) process.exitCode = 1;
console.log(`${Object.keys(catalogue).length} HTML pages checked; ${changed} files ${write ? 'updated' : 'need updates'}.`);
