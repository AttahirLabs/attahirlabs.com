const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
let browser;
(async()=>{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});
 const base=process.env.QA_URL||'http://127.0.0.1:8765';
 async function page(options={}){const p=await browser.newPage({viewport:{width:1440,height:1000},...options});await p.route('**/*google-analytics.com/**',r=>r.abort());await p.route('**/*googletagmanager.com/**',r=>r.abort());return p;}
 const p=await page();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/');await p.waitForSelector('[data-commerce-state="ready"]');await p.waitForTimeout(500);
 const hero=p.locator('[data-commerce-hero]'),canvas=p.locator('.commerce-canvas canvas');
 assert.equal(await p.locator('.commerce-controls,[data-commerce-pause],[data-commerce-select]').count(),0,'no category strip or pause control');
 const movingA=await canvas.screenshot();await p.waitForTimeout(650);assert.ok(!movingA.equals(await canvas.screenshot()),'the miniature scene actually animates');
 await hero.focus();await p.waitForTimeout(200);
 const stillA=await canvas.screenshot();await p.waitForTimeout(450);assert.ok(stillA.equals(await canvas.screenshot()),'keyboard focus holds the scene');
 // Two rounds exercise all six businesses and all three upcoming app alternatives.
 const expected=[0,1,2,3,4,5,0,6,7,3,4,8];
 for(let step=0;step<expected.length;step++){
  if(step)await p.keyboard.press('ArrowRight');
  assert.equal(await hero.getAttribute('data-business'),String(step%6));
  assert.ok(await p.locator(`[data-commerce-panel="${expected[step]}"]`).isVisible());
  if(step<6)await hero.screenshot({path:`/tmp/commerce-refined-${step}.png`});
 }
 await p.keyboard.press('ArrowRight');assert.equal(await hero.getAttribute('data-active-panel'),'0');
 await p.keyboard.press('Space');await p.evaluate(()=>document.activeElement.blur());
 await p.waitForFunction(()=>Number(document.querySelector('.commerce-panel-stack').style.opacity)<.8,{},{timeout:15000});
 await hero.focus();assert.equal(await p.locator('.commerce-panel-stack').evaluate(el=>el.style.opacity),'1','focus settles mid-transition to a readable panel');
 for(const width of [1100,1024,900,768,681,680,390,320]){
  await p.setViewportSize({width,height:1000});await p.waitForTimeout(150);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await p.evaluate(()=>{
   const copy=document.querySelector('.hero-copy .lede').getBoundingClientRect();
   const card=document.querySelector('.commerce-panel-stack').getBoundingClientRect();
   return Math.max(0,Math.min(copy.right,card.right)-Math.max(copy.left,card.left)) *
    Math.max(0,Math.min(copy.bottom,card.bottom)-Math.max(copy.top,card.top))===0;
  }),`hero copy stays clear of its glass panel at ${width}px`);
  for(let scene=0;scene<6;scene++){
   await p.keyboard.press('ArrowRight');
   assert.ok(await p.evaluate(()=>{const panel=document.querySelector('.commerce-panel:not([hidden])').getBoundingClientRect();const frame=document.querySelector('[data-commerce-hero]').getBoundingClientRect();return panel.left>=-1&&panel.right<=innerWidth+1&&panel.bottom<frame.bottom-8;}),`panel ${scene} fits at ${width}px`);
  }
 }
 await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:'/tmp/commerce-refined-desktop.png'});
 await p.setViewportSize({width:390,height:1000});await hero.screenshot({path:'/tmp/commerce-refined-mobile.png'});await p.close();
 const r=await page({reducedMotion:'reduce'});await r.goto(base+'/');await r.waitForSelector('[data-commerce-state="ready"]');await r.locator('[data-commerce-hero]').focus();await r.keyboard.press('ArrowRight');await r.keyboard.press('ArrowRight');assert.ok(await r.locator('[data-commerce-panel="2"]').isVisible());await r.waitForTimeout(200);const reduced=r.locator('.commerce-canvas canvas'),reducedA=await reduced.screenshot();await r.waitForTimeout(450);assert.ok(reducedA.equals(await reduced.screenshot()),'reduced motion freezes all 3D movement');await r.close();
 const fallback=await page();await fallback.route('**/assets/commerce/world.js*',route=>route.abort());await fallback.goto(base+'/');await fallback.waitForSelector('[data-commerce-state="fallback"]');assert.ok(await fallback.locator('.glass-artwork').isVisible());assert.ok(await fallback.getByRole('link',{name:'Build your website',exact:true}).isVisible());await fallback.close();
 const nojs=await page({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(base+'/');assert.ok(await nojs.locator('.glass-artwork').isVisible());assert.equal(await nojs.locator('.commerce-live').isVisible(),false);await nojs.close();
 assert.deepEqual(errors,[]);console.log('Commerce browser: six rooms, nine matching panels, upcoming app alternatives, animation, keyboard hold/restart, readable transition stops, responsive layouts, reduced motion and fallbacks passed.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>browser?.close());
