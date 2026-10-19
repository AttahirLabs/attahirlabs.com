// The public website is an allowlist, never a repository copy with exclusions.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootFiles = new Set([
  'index.html', 'contact.html', 'privacy.html', 'terms.html', 'site-nav.css',
  'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'tariffshield-icon.png', 'robots.txt', 'sitemap.xml', 'site.webmanifest', '_headers', '_redirects',
]);
const publicDirectories = ['assets', 'apps', 'blog', 'duty', 'shipping', 'web-design', 'analytics-preferences'];
const toolsPages = ['tools/index.html', 'tools/access-checker/index.html'];
const publicExtensions = new Set([
  '.html', '.css', '.js', '.mjs', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif',
  '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.vtt',
]);
const publicNotices = new Set([
  'assets/commerce/vendor/THREE-LICENSE.txt', 'assets/fonts/Manrope-OFL.txt', 'assets/cinema/scene-credits.txt',
]);
const privateDirectories = new Set([
  'sourceassets', 'prototypes', 'releases', 'review', 'tests', 'node_modules', 'data', 'functions', '_site',
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const posix = value => value.split(path.sep).join('/');
const exists = file => { try { return fs.lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } };

function checkedFile(sourceRoot, relative) {
  const parts = relative.split('/');
  for (let i=1;i<parts.length;i++) {
    const parent = exists(path.join(sourceRoot,...parts.slice(0,i)));
    if (parent?.isSymbolicLink()) throw new Error(`Public artifact rejects symlink parent: ${relative}`);
  }
  const stat = exists(path.join(sourceRoot, relative));
  if (!stat) return false;
  if (stat.isSymbolicLink()) throw new Error(`Public artifact rejects symlink: ${relative}`);
  if (!stat.isFile()) throw new Error(`Expected a regular public file: ${relative}`);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`Public file exceeds Cloudflare Pages' 25 MiB limit: ${relative}`);
  return true;
}

/** Sorted POSIX paths, relative to sourceRoot. Read-only; no output directory is created. */
export function listPublicFiles(sourceRoot = repoRoot) {
  sourceRoot = fs.realpathSync(sourceRoot);
  const files = new Set();
  for (const relative of [...rootFiles, ...toolsPages]) if (checkedFile(sourceRoot, relative)) files.add(relative);
  for (const entry of fs.readdirSync(sourceRoot, {withFileTypes:true})) {
    // IndexNow verification tokens are deliberately public, unlike arbitrary root .txt files.
    if (/^(?:[a-f0-9]{32}|IndexNow[A-Za-z0-9_-]*)\.txt$/i.test(entry.name) && checkedFile(sourceRoot, entry.name)) files.add(entry.name);
  }
  function walk(relative) {
    const absolute = path.join(sourceRoot, relative);
    const stat = exists(absolute);
    if (!stat) return;
    if (stat.isSymbolicLink()) throw new Error(`Public artifact rejects symlink directory: ${relative}`);
    if (!stat.isDirectory()) throw new Error(`Expected a public directory: ${relative}`);
    for (const entry of fs.readdirSync(absolute, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || privateDirectories.has(entry.name.toLowerCase())) continue;
      const candidate = posix(path.join(relative, entry.name));
      if (entry.isDirectory()) { walk(candidate); continue; }
      if (!publicNotices.has(candidate) && !publicExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      if (checkedFile(sourceRoot, candidate)) files.add(candidate);
    }
  }
  for (const directory of publicDirectories) walk(directory);
  return [...files].sort();
}

/** Absolute HTML filenames for public-only generators and test walkers. */
export function publicPages(sourceRoot = repoRoot) {
  const resolved = fs.realpathSync(sourceRoot);
  return listPublicFiles(resolved).filter(file => file.endsWith('.html')).map(file => path.join(resolved, file));
}

/** Build only sourceRoot/_site. Functions stay in the repository for Wrangler's own compilation. */
export function buildStatic({sourceRoot = repoRoot} = {}) {
  sourceRoot = fs.realpathSync(sourceRoot);
  const files = listPublicFiles(sourceRoot);
  if (!files.includes('index.html')) throw new Error('Public artifact requires index.html');
  const output = path.join(sourceRoot, '_site');
  const prior = exists(output);
  if (prior && (prior.isSymbolicLink() || !prior.isDirectory())) throw new Error('Refusing to replace a non-directory _site');
  // Validate the complete input list before removing an old output.
  fs.rmSync(output, {recursive:true, force:true});
  fs.mkdirSync(output, {recursive:true});
  let bytes = 0;
  for (const relative of files) {
    const destination = path.join(output, relative);
    fs.mkdirSync(path.dirname(destination), {recursive:true});
    fs.copyFileSync(path.join(sourceRoot, relative), destination, fs.constants.COPYFILE_EXCL);
    bytes += fs.statSync(destination).size;
  }
  return {directory:output, files:files.length, bytes};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--list') console.log(listPublicFiles().join('\n'));
  else if (args.length === 0) console.log(JSON.stringify(buildStatic()));
  else throw new Error('Usage: node tools/build-static.mjs [--list]');
}
