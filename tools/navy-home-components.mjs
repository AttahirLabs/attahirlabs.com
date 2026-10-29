const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow = name => `<svg aria-hidden="true"><use href="#${name}"/></svg>`;

export function navyHomeAppInfo(product) {
  const p = product;
  const route = `/apps/${p.slug}/`;
  const listing = `${p.listing}?utm_source=attahirlabs&utm_medium=website&utm_campaign=${p.slug}&utm_content=homepage_public_apps`;
  const label = p.ctaLabel || (p.availabilityNotice ? `View ${p.name} on Shopify` : `Install ${p.name}`);
  const install = `<a class="text-link listing-link" href="${esc(listing)}" target="_blank" rel="noopener">${esc(label)} ${arrow('diagonal')}</a>`;
  const scope = p.scopeNote ? `<p class="app-scope">${esc(p.scopeNote)}</p>` : '';
  if (['stockclearance', 'shelflife'].includes(p.slug)) {
    return `<div class="app-info" data-app="${esc(p.slug)}"><div class="app-title"><h3><a href="${route}">${esc(p.name)}</a></h3><span class="status">Shopify App Store</span></div><p>${esc(p.summary)}</p><div class="app-actions"><a class="text-link" href="${route}">Explore ${esc(p.name)} ${arrow('arrow')}</a>${install}</div></div>`;
  }
  return `<div data-app="${esc(p.slug)}"><span class="small-label">Also in the suite · Shopify App Store</span><a class="portfolio-app-link" href="${route}"><img src="${esc(p.icon)}" width="24" height="24" alt="${esc(p.iconAlt)}">${esc(p.name)} ${arrow('diagonal')}</a><p>${esc(p.summary)}</p>${scope}${install}</div>`;
}

export function navyUpcomingApps(products) {
  return `<p class="upcoming-links">${products.map(p => `<a href="${esc(p.path)}"><span>${esc(p.name)}</span><small>${esc(p.status)}</small></a>`).join('')}</p>`;
}

export function syncNavyHome(html, catalog) {
  const slugs = [...html.matchAll(/<!-- navy-app:([a-z0-9-]+):start -->/g)].map(match => match[1]);
  const expected = catalog.products.map(p => p.slug);
  if (slugs.length !== expected.length || new Set(slugs).size !== slugs.length || expected.some(slug => !slugs.includes(slug))) {
    throw new Error('The navy homepage needs one product region for every public catalog app');
  }
  for (const p of catalog.products) {
    const start = `<!-- navy-app:${p.slug}:start -->`;
    const end = `<!-- navy-app:${p.slug}:end -->`;
    const from = html.indexOf(start);
    const to = html.indexOf(end, from);
    if (to < 0) throw new Error(`Missing navy homepage product end marker: ${p.slug}`);
    html = html.slice(0, from) + `${start}\n${navyHomeAppInfo(p)}\n${end}` + html.slice(to + end.length);
  }
  if (!html.includes('<!-- upcoming-apps:start -->') || !html.includes('<!-- upcoming-apps:end -->')) {
    throw new Error('The navy homepage needs a separate upcoming-app region');
  }
  return html.replace(/<!-- upcoming-apps:start -->[\s\S]*?<!-- upcoming-apps:end -->/, `<!-- upcoming-apps:start -->\n${navyUpcomingApps(catalog.unlistedApps || [])}\n<!-- upcoming-apps:end -->`);
}
