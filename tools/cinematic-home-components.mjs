import {escapeHTML as esc} from './design-components.mjs';

const arrow = '<svg aria-hidden="true"><use href="#arrow"/></svg>';
const stages = {
  stockclearance:{poster:'warehouse-poster.webp',video:'warehouse-loop.mp4',alt:'Miniature warehouse with staff organizing inventory.'},
  shelflife:{poster:'retail-poster.webp',video:'retail-loop.mp4',alt:'Miniature shop with staff reviewing stock and serving customers.'}
};
export function cinematicHomeCards(products) {
  const order = ['stockclearance','shelflife','storechronicle','tariffshield'];
  return [...products].sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug)).map(p=>{
    const stage = stages[p.slug];
    const sample = p.homePreview || (p.slug==='stockclearance' ? '<strong>Review aging stock</strong><div><span>Inventory age</span><b>Review stock</b></div><div><span>Variant markdowns</span><b>Choose amounts</b></div><div><span>Campaigns</span><b>Review stage</b></div>' : '<strong>Know what expires next</strong><div><span>Batch records</span><b>Keep together</b></div><div><span>Expiry risk</span><b>Review dates</b></div><div><span>Picking order</span><b>FEFO guidance</b></div>');
    const art = stage ? `<div class="app-art" data-cinematic-depth><div class="app-world" data-cinema-stage><img class="world-art" data-cinema-poster src="/assets/cinema/${stage.poster}" width="1280" height="720" alt="${stage.alt}" loading="lazy" decoding="async"><video data-cinema-video data-src="/assets/cinema/${stage.video}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video></div><div class="sample-panel" aria-label="Illustrative ${esc(p.name)} workflow"><div class="sample-heading"><img src="${p.icon}" width="24" height="24" alt=""><span>${esc(p.name)}</span><span class="sample-dots" aria-hidden="true">•••</span></div><div class="sample-preview">${sample}</div><small>${esc(p.homePreviewLabel || 'Illustrative workflow · Example data')}</small></div></div>` : '';
    const label = p.ctaLabel || (p.availabilityNotice ? `View ${p.name} on Shopify` : `Install ${p.name}`);
    const install = `${p.listing}?utm_source=attahirlabs&utm_medium=website&utm_campaign=${p.slug}&utm_content=homepage_public_apps`;
    return `<article class="app-showcase card app-card${stage?'':' app-compact'}" data-app="${p.slug}" data-cinematic-reveal>${art}<div class="app-info"><div class="app-title">${stage?'':`<img src="${p.icon}" width="32" height="32" alt="${esc(p.iconAlt)}">`}<h3><a href="/apps/${p.slug}/">${esc(p.name)}</a></h3><span class="status">Shopify App Store</span></div><p class="app-benefit">${esc(p.homeHeadline || p.headline)}</p><p class="app-description">${esc(p.summary)}</p>${p.scopeNote?`<p class="app-scope">${esc(p.scopeNote)}</p>`:''}${p.availabilityNotice&&p.showAvailabilityNotice!==false?`<p class="availability-notice"><strong>Current availability:</strong> ${esc(p.availabilityNotice)}</p>`:''}<ul class="home-features">${p.homeFeatures.map(feature=>`<li>${esc(feature)}</li>`).join('')}</ul><p class="home-plan-summary">${esc(p.priceSummary)}<br><span>${esc(p.trialSummary)}</span></p><div class="app-actions"><a class="button button-primary" href="${esc(install)}" target="_blank" rel="noopener">${esc(label)} ${arrow}</a><a class="text-link" href="/apps/${p.slug}/">Features &amp; pricing ${arrow}</a></div></div></article>`;
  }).join('\n');
}

export function cinematicUpcomingApps(apps) {
  return apps.map(p=>`<a href="${esc(p.path)}"><span>${esc(p.name)}</span><small>${esc(p.status)}</small>${arrow}</a>`).join('');
}
