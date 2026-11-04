const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {target,at,deadlineMs,sample,request,upstream,dirty,app}=require('./relay-synthetic-wire.cjs');
const root=path.resolve(__dirname,'..'),projector=require('../duty/rev22-quote.js');
const source=fs.readFileSync(path.join(root,'functions/api/authority-duty.js'),'utf8');
async function handler(){
 let s=source.replace("'../../duty/rev22-quote.js'",JSON.stringify(pathToFileURL(path.join(root,'duty/rev22-quote.js')).href));
 const mark='const EXPECTED_BINDING = null;';assert.equal(s.split(mark).length,2);
 return (await import('data:text/javascript;base64,'+Buffer.from(s.replace(mark,'const EXPECTED_BINDING = Object.freeze('+JSON.stringify(target)+');')).toString('base64'))).onRequest;
}
async function exercise(fn){
 const now=Date.now,fetch=global.fetch,json=Response.json;let clock=at;
 Date.now=()=>clock;try{await fn(await handler(),ms=>{clock=ms});}finally{Date.now=now;global.fetch=fetch;Response.json=json;}
}
const unavailable={status:'indeterminate',code:'EXACT_DUTY_UNAVAILABLE',reason:'No supported duty estimate is available.'};
const {fingerprint}=require('./relay-synthetic-wire.cjs');
function coherent(sampleType, field, fact, value) {
  const {input,response}=sample(sampleType);
  input[field]=value;
  response.inputFingerprint=fingerprint(input,input.calculationBasis);
  const item=response.quote.factLedger.find(f=>f.fact===fact);
  if(item) item.value=value;
  if(Object.hasOwn(response.reviewedEntryDeclarations,field)) response.reviewedEntryDeclarations[field]=value;
  return {input,response};
}
const outsideOrdinaryScope=[
  ['add','adCvdStatus','entry.adCvdStatus','unknown'],
  ['add','brokerEntryReference','entry.brokerEntryReference','x'],
  ['add','certificationDisposition','entry.certificationDisposition','unknown'],
  ['add','entryTreatment','entry.treatment','special'],
  ['add','qspProductStatus','entry.qspProductStatus','unknown'],
  ['add','thirdCountryProcessing','entry.thirdCountryProcessing','unknown'],
  ['add','manufacturingOrigin','entry.manufacturingOrigin','BR'],
  ['add','qspProductEvidenceRef','entry.qspProductEvidenceRef','1234567'],
  ['add','adCvdEvidenceRef','entry.adCvdEvidenceRef','𐐷'.repeat(299)+'ab'],
  ['add','qspQuotaEvidenceRef','entry.qspQuotaEvidenceRef','unexpected quota evidence'],
  ['add','brazilHeading','program.section301.brazil.heading','9903.05.01'],
  ['add','uasHeading','program.section232.uas.heading','9903.00.00'],
  ['topUp','qspQuotaEvidenceRef','entry.qspQuotaEvidenceRef','1234567'],
  ['topUp','qspQuotaReviewedAt','entry.qspQuotaReviewedAt','2026-11-04T11:59:59.999999Z'],
  ['topUp','qspQuotaReviewedAt','entry.qspQuotaReviewedAt','2026-11-04T12:01:00.000001Z'],
  ['topUp','qspQuotaStatus','entry.qspQuotaStatus','unknown'],
];
for(const [kind,field,fact,value] of outsideOrdinaryScope) {
  test('refuses self-consistent unsupported '+kind+' '+field+' '+String(value).slice(0,20),()=>exercise(async h=>{
    const {input,response}=coherent(kind,field,fact,value);
    let calls=0;global.fetch=async()=>{calls++;return upstream(response);};
    const raw=['brokerEntryReference','adCvdEvidenceRef','qspProductEvidenceRef','qspQuotaEvidenceRef'].includes(field);
    await refused(await h({request:request(input)}),raw?400:422);
    assert.equal(calls,0);
  }));
}
for(const length of [8,300])test('refuses an uncommitted '+length+' code-point reference before forwarding',()=>exercise(async h=>{
  const {input,response}=coherent('add','brokerEntryReference','entry.brokerEntryReference','𐐷'.repeat(length));
  let calls=0;global.fetch=async()=>{calls++;return upstream(response);};
  await refused(await h({request:request(input)}),400);assert.equal(calls,0);
}));
async function refused(r,status){assert.equal(r.status,status);assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.deepEqual(await r.json(),unavailable);}
for(const kind of ['add','topUp'])for(const basis of ['entry','per_unit'])test('closed '+kind+' '+basis+' wire reconstructs exact clean result even with deep unknown metadata',()=>exercise(async h=>{
 const {input,response}=sample(kind,basis);let next=response;
 global.fetch=async(u,o)=>{assert.equal(u,app);assert.equal(o.method,'POST');assert.equal(o.cache,'no-store');assert.equal(o.credentials,'omit');assert.equal(o.redirect,'manual');assert.deepEqual(o.headers,{'Content-Type':'application/json'});assert.deepEqual(JSON.parse(o.body),input);return upstream(next);};
 const clean=await h({request:request(input)});assert.equal(clean.status,200);const canonical=await clean.text();
 next=dirty(structuredClone(response));const result=await h({request:request(input)});assert.equal(result.status,200);assert.equal(result.headers.get('Cache-Control'),'private, no-store');assert.equal(await result.text(),canonical);
 const payload=JSON.parse(canonical),decision=projector.projectQuote(payload,{...input,inputFingerprint:response.inputFingerprint},Object.freeze({kind:'compiled_signed_authority',binding:target}));
 assert.equal(decision.completeness,'complete');assert.equal(decision.softwareOnly,false);assert.equal(payload.planningScope,'planning_only');assert.equal(payload.reviewedEntryDeclarations.verificationState,'unverified_caller_assumptions');assert.equal(payload.quote.coverageEvidence[0].sourceDocumentIds.length,26);
 assert.equal(payload.calculation.dutyAmount.amount,kind==='add'?'175.00':'350.00');assert.equal(payload.calculation.estimatedSubtotal.amount,kind==='add'?'1235.00':'1410.00');assert.equal(payload.quote.layerDeterminations.length,4);
 if(kind==='topUp')assert.deepEqual(payload.quote.layerDeterminations.find(x=>x.operationEvidence).operationEvidence,{kind:'fill_to',referenceRatePercent:'5.000000',targetRatePercent:'10',effectiveComponentRatePercent:'5.000000',referenceLayers:['base.mfn']});
}));
const corruptions={
 badTotal:x=>x.calculation.dutyAmount.amount='998.00',incomplete:x=>x.quote.completeness='partial',status:x=>x.status='error',wrongBinding:x=>x.authority.releaseRecordHash='f'.repeat(64),
 emptyLedger:x=>x.quote.factLedger=[],arrayStrings:x=>x.quote.factLedger[1].provenance.push('PRIVATE_ADDED_PROVENANCE'),spoof:x=>x.quote.factLedger[1].provenance=['UNREVIEWED'],
 extraNumeric:x=>x.quote.layerDeterminations[0].lineIndexes.push(9),extraLine:x=>x.calculation.lineItems.push(x.calculation.lineItems[0]),
 nestedArray:x=>x.quote.layerDeterminations[0].ruleIds.push(['UNREVIEWED']),factObject:x=>x.quote.factLedger[1].value={hidden:11},
 factArray:x=>x.quote.factLedger[1].value=['USD',91], warning:x=>x.quote.warnings.push('999999.98'),topWarning:x=>x.warnings=['UNREVIEWED'],
 unmappedStage:x=>x.quote.sourceStages.reviewed='approved_for_use',effectiveWindow:x=>x.quote.coverageEvidence[0].effectiveTo='unbounded',unmatchedDeclaration:x=>x.reviewedEntryDeclarations.brokerEntryReference='PRIVATE',
 nonPublicLineAuthority:x=>x.calculation.lineItems[0].authority='PRIVATE',extraEvidence:x=>x.quote.layerDeterminations[0].operationEvidence={unreviewed:8},extraClaim:x=>x.quote.layerDeterminations[0].claimIds=['PRIVATE'],
 extraDecision:x=>x.quote.resolvedDecisions.push({rate:5}),coverage:x=>x.quote.coverageEvidence[0].sourceDocumentIds.pop(),fingerprint:x=>x.inputFingerprint='f'.repeat(64),
 numericAmount:x=>x.calculation.dutyAmount.amount=999999,tamperedTopUp:x=>x.quote.layerDeterminations.find(r=>r.operationEvidence).operationEvidence.referenceRatePercent='77.00',fixture:x=>x.fixtureOnly=true
};
for(const [name,mutate] of Object.entries(corruptions))test('returns only fixed refusal for '+name,()=>exercise(async h=>{
 const {input,response}=sample('topUp');mutate(response);global.fetch=async()=>upstream(response);await refused(await h({request:request(input)}),422);
}));
test('two concurrent requests remain independent when evidence expires before a delayed response',()=>exercise(async (h,clock)=>{
 const late=sample('topUp'),early=sample('add');let release,start;
 const waiting=new Promise(r=>{start=r}),pending=new Promise(r=>{release=r});let calls=0;
 global.fetch=async(_url,o)=>{calls++;if(JSON.parse(o.body).origin==='AT'){start();await pending;return upstream(late.response);}return upstream(early.response);};
 const future=h({request:request(late.input)});await waiting;
 const current=await h({request:request(early.input)});assert.equal(current.status,200);assert.equal((await current.json()).calculation.dutyAmount.amount,'175.00');
 clock(deadlineMs);release();await refused(await future,503);
 await refused(await h({request:request(early.input)}),503);assert.equal(calls,2);
}));
test('an abort after serialization or a clock crossing during serialization withholds an otherwise complete wire',()=>exercise(async (h,clock)=>{
 for(const action of ['expire','abort']){
 clock(at);const ctrl=new AbortController(),{input,response}=sample('topUp'),save=Response.json;
 global.fetch=async()=>upstream(response);Response.json=function(value,opts){
  const output=save.call(Response,value,opts);
  if(value.status==='calculated'&&opts.headers['X-Content-Type-Options']==='nosniff'){if(action==='expire')clock(deadlineMs);else ctrl.abort();}
  return output;
 };
 try{await refused(await h({request:request(input,{signal:ctrl.signal})}),503);}finally{Response.json=save;}
 }
}));
test('unavailable App, public caches, and unreviewed response media are number-free',()=>exercise(async h=>{
 const {input,response}=sample('topUp');
 for(const [status,cache,type] of [[503,'private, no-store','application/json'],[200,'no-store','application/json'],[200,'private, no-store, public','application/json'],[200,'private, no-store','application/json+debug']]){
  global.fetch=async()=>new Response(JSON.stringify(response),{status,headers:{'content-type':type,'cache-control':cache}});
  await refused(await h({request:request(input)}),503);
 }
}));


test('unsupported inputs never reach the App, including plaintext placed in ordinary fields',()=>exercise(async h=>{
  let calls=0;global.fetch=async()=>{calls++;throw Error('unexpected App contact');};
  for(const kind of ['add','topUp']) {
    const {input}=sample(kind,'entry');
    for(const key of Object.keys(input)) {
      const denied=await h({request:request({...input,[key]:'synthetic-plaintext-reference-canary'})});
      assert.ok([400,422].includes(denied.status),key);assert.equal((await denied.json()).status,'indeterminate');
      assert.equal(calls,0,key);
    }
    for(const change of [{origin:'ZZ',manufacturingOrigin:'ZZ'},{hts:'0000000000'},{mfnRate:'99'},
      {customsValue:'0.00'},{insuranceCost:'1000000.01'},{entryAt:'2026-02-30T00:00:00Z'},
      {forcedLaborCountryHeading:'9903.99.99'},{brazilHeading:'9903.05.01'},{uasHeading:'unused'}]) {
      await refused(await h({request:request({...input,...change})}),422);assert.equal(calls,0);
    }
  }
}));
