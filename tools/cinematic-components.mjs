// Progressive presentation only: application logic, copy and form contracts stay in their owners.
import {applyCTAContract} from './cta-components.mjs';
const VERSION = '20261029-actions';
const TYPOGRAPHY_VERSION = '20261029-type';
const poster = kind => `/assets/cinema/${kind === 'warehouse' ? 'warehouse' : kind === 'retail' ? 'retail' : 'district'}-poster.webp`;
const video = kind => `/assets/cinema/${kind === 'warehouse' ? 'warehouse' : kind === 'retail' ? 'retail' : 'district'}-loop.mp4`;
const media = kind => `<img class="cinema-scene-poster" data-cinema-poster src="${poster(kind)}" alt="" width="1280" height="720" decoding="async"><video class="cinema-scene-video" data-cinema-video data-src="${video(kind)}" poster="${poster(kind)}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>`;
const credits = `<div class="cinema-motion-control"><span class="cinema-motion-note"><a href="/assets/cinema/scene-credits.txt">Scene credits</a></span></div>`;

function attr(tag, name, value = '') {
  return new RegExp(`\\s${name}(?:\\s|=|>)`).test(tag) ? tag : tag.replace(/>$/, ` ${name}${value ? `="${value}"` : ''}>`);
}

export function cinematicRoute(relative) {
  if (/^apps\/[^/]+\/index\.html$/.test(relative)) return 'product';
  return ({'apps/index.html':'apps','tools/index.html':'tools','web-design/index.html':'services','blog/index.html':'journal','contact.html':'contact','privacy.html':'legal','terms.html':'legal','analytics-preferences/index.html':'preferences','duty/index.html':'duty','duty/rates/index.html':'rates','shipping/index.html':'shipping','tools/access-checker/index.html':'access-checker'})[relative] || (relative.startsWith('blog/') ? 'article' : 'utility');
}

export function applyCinematic(html, relative) {
  html = applyCTAContract(html, relative);
  if (relative === 'web-design/start/index.html') return html;
  if (relative === 'index.html' || /^(?:prototypes|releases|review|_site)\//.test(relative) || !html.includes('</head>') || !/<nav\b/.test(html)) return html;
  const route = cinematicRoute(relative);
  html = html.replaceAll('/assets/cinema/district.webp', '/assets/cinema/district-poster.webp').replaceAll('/assets/cinema/stockclearance.webp', '/assets/cinema/warehouse-poster.webp').replaceAll('/assets/cinema/shelflife.webp', '/assets/cinema/retail-poster.webp');
  html = html.replace(/<body([^>]*)>/, (_, attrs) => `<body${attrs.replace(/ data-cinematic-(?:site|route)(?:="[^"]*")?/g, '')} data-cinematic-site data-cinematic-route="${route}">`);
  html = html.replace(/<link[^>]*href="\/assets\/cinematic-site\.css[^>]*>\s*/g, '').replace(/<link[^>]*href="\/assets\/cinema\/motion\.css[^>]*>\s*/g, '').replace(/<script[^>]*src="\/assets\/cinema\/motion\.js[^>]*><\/script>\s*/g, '');
  html = html.replace('</head>', `<link rel="stylesheet" href="/assets/cinema/motion.css?v=${VERSION}">\n<link rel="stylesheet" href="/assets/cinematic-site.css?v=${TYPOGRAPHY_VERSION}">\n<script defer src="/assets/cinema/motion.js?v=${VERSION}"></script>\n</head>`);

  // Real HTML interfaces sit over a moving illustrative miniature stage.
  if (route === 'product') {
    const slug = relative.split('/')[1];
    const kind = slug === 'stockclearance' ? 'warehouse' : slug === 'shelflife' ? 'retail' : 'district';
    html = html.replace(/<div class="product-stage"([^>]*)>/, (_, attrs) => `<div class="product-stage"${attrs.includes('data-cinematic-depth') ? attrs : `${attrs} data-cinematic-depth`}>`);
    html = html.replace(/<img class="stage-backdrop"[^>]*>/, `<div class="cinema-product-scene" data-cinema-stage data-cinematic-depth>${media(kind)}</div>`);
    html = html.replace(/<div class="stage-interface"([^>]*)>/, (_, attrs) => attr(`<div class="stage-interface"${attrs}>`, 'data-cinematic-depth'));
  }
  if ((route === 'apps' || route === 'tools') && !html.includes('class="cinema-hub-stage"')) {
    html = html.replace(/<aside class="product-shot"([^>]*)>[\s\S]*?<\/aside>/, aside => `<div class="cinema-hub-stage" data-cinema-stage data-cinematic-depth>${media(route === 'tools' ? 'warehouse' : 'district')}${aside}</div>`);
  }
  if (route === 'services') {
    html = html.replace(/<(?:figure|div) class="(?:studio-storefront|studio-desktop|studio-phone)"[^>]*>/g, tag => attr(tag, 'data-cinematic-depth'));
  }
  if (route === 'contact' && !/<main\b/.test(html)) {
    html = html.replace(/(<\/nav>\s*)(<div class="container">[\s\S]*?)(\s*<footer\b)/, '$1<main id="main" class="cinema-contact">$2</main>$3');
  }
  // Decorative scenes remain still when there is no visible playback control.
  html = html.replace(/<(?:div|figure) class="cinema-(?:product-scene|hub-stage)"[^>]*>/g, tag => attr(attr(tag, 'data-cinema-stage'), 'data-cinema-static'));
  if (!/<(?:main|article)\b/.test(html) && !/\bid="main"/.test(html)) html = html.replace(/<div class="container"([^>]*)>/, '<div class="container"$1 id="main" role="main">');
  if (!html.includes('class="skip-link"') && /<(?:main|article)\b[^>]*id="main"/.test(html)) html = html.replace(/(<body[^>]*>)/, '$1\n<a class="skip-link" href="#main">Skip to content</a>');

  // Reveal groups leave long-form paragraphs, input controls and dynamic results stationary.
  html = html.replace(/<(?:div|header|article|figure|li)\b[^>]*class="[^"]*"[^>]*>/g, tag => {
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(/\s+/) || [];
    return classes.some(c => ['section-head','hero-copy','service-hero-copy','studio-journal-head','post-card','card','blog-hero-figure','service-inquiry'].includes(c)) && !/\b(?:aria-live|data-panel)=/.test(tag) ? attr(tag, 'data-cinematic-reveal') : tag;
  });
  html = html.replace(/(<h2\b[^>]*?) data-cinematic-reveal(?:="[^"]*")?/g, '$1');
  html = html.replace(/<h1\b[^>]*>/g, tag => attr(tag, 'data-cinematic-reveal'));
  html = html.replace(/<aside\b[^>]*class="cinema-footer-controls"[^>]*>[\s\S]*?<\/aside>\s*/g, '')
    .replace(/<div\b[^>]*class="cinema-motion-control"[^>]*>[\s\S]*?<\/div>/g, '');
  html = html.includes('</footer>') ? html.replace(/<\/footer>/, `${credits}</footer>`) : html.replace('</body>', `<aside class="cinema-footer-controls" aria-label="Scene attribution">${credits}</aside>\n</body>`);
  return html;
}
