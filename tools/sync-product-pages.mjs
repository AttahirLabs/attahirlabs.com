import fs from 'node:fs';
import {productNav, productFooter, scene, walkthrough} from './design-components.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/public-apps.json'),'utf8'));
const check=process.argv.includes('--check');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=items=>`<ul>${items.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`;
const install=(p,where='app_page_hero')=>`${p.listing}?utm_source=attahirlabs&utm_medium=website&utm_campaign=${p.slug}&utm_content=${where}`;
const cta=(p,where)=>`<a class="btn btn-primary" href="${esc(install(p,where))}" rel="noopener" target="_blank">Install ${esc(p.name)}</a>`;
const intro=(k,h,p='')=>`<div class="section-head"><div class="section-kicker">${esc(k)}</div><h2>${esc(h)}</h2>${p?`<p class="section-copy">${esc(p)}</p>`:''}</div>`;
const section=(id,content,band=false)=>`<section id="${id}"${band?' class="route-band"':''}><div class="container">${content}</div></section>`;
function main(p){
 const shot=p.screenshots[0];
 const heading=`<div class="product-heading"><img class="${p.slug==='shelflife'?'shelflife-hero-icon':'product-icon'}" src="${p.icon}" alt="${esc(p.iconAlt)}" width="48" height="48"><span>${esc(p.name)}</span></div>`;
 const hero=`<section class="page-hero product-hero"><div class="container hero-copy"><div class="eyebrow">Available on the Shopify App Store</div>${heading}<h1>${esc(p.headline)}</h1><p class="lede">${esc(p.description)}</p><div class="button-row">${cta(p,'app_page_hero')}<a class="btn btn-secondary" href="#features">Explore features <span aria-hidden="true">↗</span></a></div><p class="plan-summary">${esc(p.priceSummary)}<br><span>${esc(p.trialSummary)}</span></p></div>${scene(p,`<figure class="product-shot"><a href="${shot.src}" target="_blank" rel="noopener" aria-label="View ${esc(p.name)} screenshot at full size"><img class="product-screen" src="${shot.src}" alt="${esc(shot.alt)}" width="1280" height="720" fetchpriority="high"></a><figcaption>From the current App Store listing. Example data shown.</figcaption></figure>`)}</section>`;
 const links=`<div class="product-links" aria-label="On this page"><a href="#features">Features</a><a href="#screenshots">Screenshots</a><a href="#setup">Getting started</a><a href="#pricing">Pricing</a><a href="#faq">Questions</a></div>`;
 const features=section('features',intro('What you can do',p.workflowTitle)+`<div class="feature-grid">${p.features.map(([h,t])=>`<article class="card"><h3>${esc(h)}</h3><p>${esc(t)}</p></article>`).join('')}</div>`);
 const screenshots=section('screenshots',intro('Inside the app',`Take a closer look at ${p.name}.`,'Open any image to view the details. Screenshots show example data and the interface published in our Shopify listing.')+`<div class="screenshot-grid">${p.screenshots.map(s=>`<figure><a href="${s.src}" target="_blank" rel="noopener" aria-label="View full-size screenshot: ${esc(s.alt)}"><img src="${s.src}" alt="${esc(s.alt)}" width="1280" height="720" loading="lazy"></a><figcaption>${esc(s.alt)}</figcaption></figure>`).join('')}</div>`,true);
 const setup=section('setup',intro('Getting started','Set up your first useful workflow.')+`<ol class="setup-grid">${p.steps.map(([h,t],i)=>`<li class="card"><span class="step-number">0${i+1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>`);
 const pricing=section('pricing',intro('Pricing','Choose the plan that fits your work.','All prices are in USD. Review current prices, trial eligibility, and billing terms on Shopify before subscribing.')+`<div class="pricing-grid">${p.plans.map(plan=>`<article class="card plan-card"><h3>${esc(plan.name)}</h3><p class="plan-price">${plan.price===0?'Free':`$${plan.price}<span> / ${plan.period}</span>`}</p><p class="plan-cycle">${plan.alternate?`or $${plan.alternate}/year`:plan.price===0?'No subscription charge':`Billed ${plan.period==='year'?'annually':'monthly'}`}</p>${plan.trialDays?`<p class="trial-note">${plan.trialDays}-day free trial</p>`:''}${list(plan.features)}<a class="btn btn-secondary" href="${esc(install(p,'app_page_cta'))}" target="_blank" rel="noopener">View ${esc(plan.name)} on Shopify</a></article>`).join('')}</div><p class="pricing-source">Pricing checked September 13, 2026. <a href="${esc(install(p,'app_page_cta'))}" target="_blank" rel="noopener">See the Shopify listing</a>.</p>`,true);
 const faq=section('faq',intro('Common questions',`Before you install ${p.name}.`)+`<div class="faq-list">${p.faqs.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`);
 const dataTitle=p.slug==='stockclearance'?'Built for product-level inventory decisions.':'Know how your store data is used.';
 const footer=section('next',intro('Your next step',dataTitle)+`<p class="section-copy">Read the <a href="/privacy.html#${p.slug}">${esc(p.name)} privacy disclosure</a> and <a href="/terms.html">subscription terms</a>, or contact <a href="mailto:support@attahirlabs.com">support@attahirlabs.com</a> for help.</p><div class="button-row">${cta(p,'app_page_footer')}<a class="btn btn-secondary" href="${p.guide}">${esc(p.guideLabel)}</a></div>`,true);
 return `<main class="product-page" id="main">\n${[hero,links,features,walkthrough(p),setup,screenshots,pricing,faq,footer].join('\n')}\n</main>`;
}
function schemas(p){return [
 {'@context':'https://schema.org','@type':'SoftwareApplication',name:p.listingName,applicationCategory:'BusinessApplication',operatingSystem:'Shopify',url:`https://attahirlabs.com/apps/${p.slug}/`,description:p.description,offers:p.plans.flatMap(plan=>[{name:plan.name,'@type':'Offer',price:String(plan.price),priceCurrency:catalog.currency,url:p.listing,description:plan.price===0?'Free plan':`${plan.period==='year'?'Annual':'Monthly'} billing${plan.trialDays?`; ${plan.trialDays}-day free trial`:''}`},...(plan.alternate?[{'@type':'Offer',name:`${plan.name} annual`,price:String(plan.alternate),priceCurrency:catalog.currency,url:p.listing,description:`Annual billing; ${plan.trialDays}-day free trial`}]:[])])},
 {'@context':'https://schema.org','@type':'FAQPage',mainEntity:p.faqs.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))}
 ].map(s=>`<script type="application/ld+json">\n${JSON.stringify(s,null,2)}\n</script>`).join('\n');}
function write(relative,content){const file=path.join(root,relative);const before=fs.readFileSync(file,'utf8');if(content===before)return;if(check){console.error(`${relative} differs from the product reference; run node tools/sync-product-pages.mjs`);process.exitCode=1;}else fs.writeFileSync(file,content);}
for(const p of catalog.products){
 const relative=`apps/${p.slug}/index.html`;let html=fs.readFileSync(path.join(root,relative),'utf8');
 html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,'');
 html=html.replace(/<nav\b[\s\S]*?<\/nav>/,productNav(p)).replace(/<footer\b[\s\S]*?<\/footer>/,productFooter(p));
 html=html.replace(/<body[^>]*>/,`<body data-product="${p.slug}" data-page="product">`);
 html=html.replace(/<main(?:\s[^>]*)?>[\s\S]*?<\/main>/,main(p));
 html=html.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(p.description)}">`);
 html=html.replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${esc(p.description)}">`);
 html=html.replace(/<link rel="stylesheet" href="\/apps\/product-pages\.css[^"]*">\s*/g,'');
 const marker=html.includes('<link rel="stylesheet" href="/assets/vector.css')?'<link rel="stylesheet" href="/assets/vector.css':'</head>';
 html=html.replace(marker,`<link rel="stylesheet" href="/apps/product-pages.css?v=20260913">\n${schemas(p)}\n${marker}`);
 write(relative,html);
}
const cards=catalog.products.map((p,i)=>`<article class="card app-card" data-reveal><span class="app-number">0${i+1}</span><div class="app-heading"><img class="app-icon" src="${p.icon}" alt="${p.slug==='shelflife'?'ShelfLife app icon':esc(p.iconAlt)}" width="48" height="48"><div><span class="tag tag-live">Shopify App Store</span><h3><a href="/apps/${p.slug}/">${p.name} <span class="row-arrow" aria-hidden="true">↗</span></a></h3></div></div><p>${esc(p.summary)}</p><div class="row-preview" aria-hidden="true"><img src="${p.screenshots[0].src}" alt="" width="1280" height="720" loading="lazy"></div>${list(p.homeFeatures)}<p class="home-plan-summary">${esc(p.priceSummary)}<br><span>${esc(p.trialSummary)}</span></p><div class="button-row"><a class="btn btn-dark" href="${esc(install(p,'homepage_public_apps'))}" rel="noopener" target="_blank">Install ${p.name}</a><a class="btn btn-light" href="/apps/${p.slug}/">Features &amp; pricing</a></div></article>`).join('\n');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
write('index.html',home.replace(/<!-- public-app-cards:start -->[\s\S]*?<!-- public-app-cards:end -->/,`<!-- public-app-cards:start -->\n${cards}\n<!-- public-app-cards:end -->`));
const hub=fs.readFileSync(path.join(root,'apps/index.html'),'utf8');
const hubCards=cards.replaceAll('btn-dark','btn-primary').replaceAll('btn-light','btn-secondary').replaceAll('homepage_public_apps','apps_hub_hero');
write('apps/index.html',hub.replace(/<!-- public-app-cards:start -->[\s\S]*?<!-- public-app-cards:end -->/,`<!-- public-app-cards:start -->\n${hubCards}\n<!-- public-app-cards:end -->`));
