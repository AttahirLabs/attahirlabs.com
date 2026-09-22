const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
let browser;
(async()=>{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});
 const base=process.env.QA_URL||'http://127.0.0.1:8765';
 async function page(options={}){const p=await browser.newPage({viewport:{width:1440,height:1000},...options});await p.route('**/*google-analytics.com/**',r=>r.abort());await p.route('**/*googletagmanager.com/**',r=>r.abort());return p;}
 const p=await page();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/');await p.waitForSelector('[data-commerce-state="ready"]');await p.waitForTimeout(500);
 const canvas=p.locator('.commerce-canvas canvas');const movingA=await canvas.screenshot();await p.waitForTimeout(650);const movingB=await canvas.screenshot();assert.ok(!movingA.equals(movingB),'the miniature scene actually animates');
 await p.locator('[data-commerce-pause]').click();await p.waitForTimeout(300);assert.equal(await p.locator('[data-commerce-pause]').textContent(),'Play');
 const stillA=await canvas.screenshot();await p.waitForTimeout(650);assert.ok(stillA.equals(await canvas.screenshot()),'Pause freezes people, rooms, and the elevator');
 for(let i=0;i<4;i++){await p.locator(`[data-commerce-select="${i}"]`).click();assert.equal(await p.locator(`[data-commerce-panel="${i}"]`).isVisible(),true);assert.equal(await p.locator('[data-commerce-hero]').getAttribute('data-business'),String(i));}
 // A keyboard user can hold a scene and explicitly restart it.
 await p.locator('[data-commerce-pause]').click();
 await p.locator('[data-commerce-select="1"]').focus();
 assert.equal(await p.locator('[data-commerce-pause]').textContent(),'Play');
 await p.waitForTimeout(200);const focused=await canvas.screenshot();await p.waitForTimeout(450);assert.ok(focused.equals(await canvas.screenshot()),'focus anywhere in the scene controls pauses animation');
 await p.locator('[data-commerce-pause]').focus();await p.keyboard.press('Enter');
 assert.equal(await p.locator('[data-commerce-pause]').textContent(),'Pause');
 await p.evaluate(()=>document.activeElement.blur());
 await p.waitForFunction(()=>Number(document.querySelector('.commerce-panel-stack').style.opacity)<.8,{},{timeout:15000});
 await p.locator('[data-commerce-pause]').click();
 assert.equal(await p.locator('.commerce-panel-stack').evaluate(el=>el.style.opacity),'1','pausing a transition settles to a readable panel');
 for(const width of [768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(120);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const bounds=await p.evaluate(()=>{const panel=document.querySelector('.commerce-panel:not([hidden])').getBoundingClientRect();const controls=document.querySelector('.commerce-controls').getBoundingClientRect();return {panelBottom:panel.bottom,controlsTop:controls.top};});assert.ok(bounds.panelBottom<bounds.controlsTop,JSON.stringify({width,...bounds}));}
 await p.close();
 const r=await page({reducedMotion:'reduce'});await r.goto(base+'/');await r.waitForSelector('[data-commerce-state="ready"]');assert.ok(await r.locator('[data-commerce-pause]').isDisabled());await r.locator('[data-commerce-select="2"]').click();assert.ok(await r.locator('[data-commerce-panel="2"]').isVisible());await r.waitForTimeout(300);const reduced=r.locator('.commerce-canvas canvas');const reducedA=await reduced.screenshot();await r.waitForTimeout(450);assert.ok(reducedA.equals(await reduced.screenshot()),'reduced motion freezes all 3D movement');await r.close();
 const fallback=await page();await fallback.route('**/assets/commerce/world.js',route=>route.abort());await fallback.goto(base+'/');await fallback.waitForSelector('[data-commerce-state="fallback"]');assert.ok(await fallback.locator('.glass-artwork').isVisible());assert.ok(await fallback.getByRole('link',{name:'Build your website',exact:true}).isVisible());await fallback.close();
 const nojs=await page({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(base+'/');assert.ok(await nojs.locator('.glass-artwork').isVisible());assert.equal(await nojs.locator('.commerce-live').isVisible(),false);await nojs.close();
 assert.deepEqual(errors,[]);await browser.close();console.log('Commerce browser: animated frames, pause, synchronized choices, controls at tablet/mobile sizes, reduced motion, failed-renderer and no-JS fallbacks passed.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>browser?.close());
