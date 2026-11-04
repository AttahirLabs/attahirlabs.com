const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'), text=fs.readFileSync(path.join(root,'functions/api/authority-duty.js'),'utf8');
async function handler(exercise=false){
  // Only removes the null guard in a test copy to exercise refusal paths. No test can create an admitted quote.
  const source=text.replace("'../../duty/rev22-quote.js'",JSON.stringify(pathToFileURL(path.join(root,'duty/rev22-quote.js')).href))
    .replace('const EXPECTED_BINDING = null;',exercise?'const EXPECTED_BINDING = Object.freeze({earliestEntryAt:"2026-10-01T00:00:00Z",evidenceAsOf:new Date(Date.now()-60000).toISOString(),evidenceValidThrough:new Date(Date.now()+60000).toISOString()});':'const EXPECTED_BINDING = null;');
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).onRequest;
}
const url='https://attahirlabs.com/api/authority-duty',headers={Origin:new URL(url).origin,'Content-Type':'application/json'};
const request=(body,options={})=>new Request(url,{method:'POST',headers,body,...options});
async function expectRefusal(response,status){assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('access-control-allow-origin'),null);assert.deepEqual(await response.json(),{status:'indeterminate',code:'EXACT_DUTY_UNAVAILABLE',reason:'No supported duty estimate is available.'});}
test('null target, cross-origin and wrong method return only a refusal without opening the App',async()=>{
 const h=await handler();let calls=0,save=global.fetch;global.fetch=()=>{calls++;throw Error('unexpected')};try{
 await expectRefusal(await h({request:request('{}')}),503);
 await expectRefusal(await h({request:request('{}',{headers:{...headers,Origin:'https://example.net'}})}),403);
 await expectRefusal(await h({request:new Request(url)}),405);assert.equal(calls,0);
 }finally{global.fetch=save}
});
test('relay bounds strict JSON, accepts no destination override, cookies or credentials; App errors and incomplete approvals with numbers in them are number-free',async()=>{
 const h=await handler(true),save=global.fetch;let count=0,next;const sample = require('./relay-synthetic-wire.cjs').sample('add','entry').input;
 const body=JSON.stringify({...sample,entryAt:new Date(Date.now()-1000).toISOString()});global.fetch=async(u,opts)=>{count++;assert.equal(u,'https://tariff-shield-production.up.railway.app/api/authority-duty');assert.equal(opts.method,'POST');assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'manual');assert.deepEqual(opts.headers,{'Content-Type':'application/json'});assert.deepEqual(JSON.parse(opts.body),JSON.parse(body));return next()};
 try{
 for(const b of ['{"origin":"BR","origin":"US"}','{"upstream":"elsewhere"}',JSON.stringify({origin:'x'.repeat(20000)})])await expectRefusal(await h({request:request(b)}),400);assert.equal(count,0);
 next=()=>Response.json({status:'indeterminate',totalDutyAmount:123},{status:503,headers:{'cache-control':'private, no-store'}});await expectRefusal(await h({request:request(body,{headers:{...headers,Cookie:'x','Authorization':'x'}})}),503);
 next=()=>Response.json({status:'calculated',totalDutyAmount:123},{headers:{'Cache-Control':'private, no-store'}});await expectRefusal(await h({request:request(body)}),422);
 next=()=>Response.json({status:'calculated',totalDutyAmount:123});await expectRefusal(await h({request:request(body)}),503);
 next=()=>new Response('x'.repeat(262145),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});await expectRefusal(await h({request:request(body)}),503);
 next=()=>{throw Error('timeout')};await expectRefusal(await h({request:request(body)}),503);assert.equal(count,5);
 }finally{global.fetch=save}
});
test('both public calculator numeric paths use the one private same-origin POST with no URL parameters',()=>{
 const src=fs.readFileSync(path.join(root,'duty/calculator.js'),'utf8');assert.equal((src.match(/await requestAdmittedDuty\(input, controller.signal\)/g)||[]).length,2);assert.match(src,/fetch\("\/api\/authority-duty",/);assert.doesNotMatch(src,/\/api\/v2\/us-duty/);
});
