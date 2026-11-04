// Isolated, unsigned HTTP fixtures only: this target may never be compiled into a release.
const {readFileSync}=require('node:fs'),{createHash}=require('node:crypto'),path=require('node:path');
const fixtureFile=path.join(__dirname,'fixtures/rev22-relay-synthetic-wire.json'),raw=readFileSync(fixtureFile);
if(createHash('sha256').update(raw).digest('hex')!=='6a3de9f837cc310940a7e46e5c5ddd6949f7f52a2127bf58d19cf12753dd1bfb')throw Error('fixture drift');
const data=JSON.parse(raw),at=Date.parse('2026-11-04T12:01:00Z'),deadlineMs=Date.parse(data.testBinding.evidenceValidThrough);
const target=Object.freeze({...data.testBinding,schemaVersion:'tariff.public-rev22-binding/v1',coverageSliceId:data.testBinding.activeCoverageSliceIds[0],
candidateRawSha256:'34fc428cd5e35cb903be0f395ce6dd9df56aa3c49302d962f9b052691d5255f9',candidatePayloadSha256:'817bf5ef8d6412ec23a6653d70bbc30657fc36a502c652cc984d9865a2937d2e',exactInputPolicyHash:'457e343bbdb5b865f121718d66bfad7fe5ebd7752bb760f889c6d2e04680088e'});
function fingerprint(i,basis){
 const id={destination:'US',basis};
 for(const k of ['origin','manufacturingOrigin','thirdCountryProcessing','certificationDisposition','brokerEntryReference','adCvdStatus','adCvdEvidenceRef','entryTreatment','qspProductStatus','qspProductEvidenceRef','hts','entryAt','customsValue','mfnRate','forcedLaborCountryHeading','forcedLaborExceptionHeading','brazilHeading','qspHeading','qspQuotaStatus','qspQuotaEvidenceRef','qspQuotaReviewedAt','shippingCost','insuranceCost'])id[k]=i[k]??null;
 return createHash('sha256').update(JSON.stringify(id)).digest('hex');
}
function sample(kind='add',basis='entry'){
 const row=structuredClone(kind==='add'?data:data.topUp), input={...row.input,calculationBasis:basis}, response=row.response;
 let json=JSON.stringify(response);
 for(const field of ['brokerEntryReference','adCvdEvidenceRef','qspProductEvidenceRef','qspQuotaEvidenceRef']){
   if(!input[field])continue;
   const original=input[field], token='tsref:v1:'+createHash('sha256').update('fixture-only|'+field+'|'+original).digest('hex');
   json=json.split(original).join(token);input[field]=token;
 }
 const bound=JSON.parse(json);bound.inputFingerprint=fingerprint(input,basis);return {input,response:bound};
}
const url='https://attahirlabs.com/api/authority-duty',app='https://tariff-shield-production.up.railway.app/api/authority-duty';
const request=(input,opts={})=>new Request(url,{method:'POST',headers:{Origin:new URL(url).origin,'Content-Type':'application/json'},body:JSON.stringify(input),...opts});
function upstream(value){return Response.json(value,{headers:{'Cache-Control':'private, no-store'}});}
function dirty(v){
 // Attach fields to every object on the original wire, including rows inside arrays and typed ledger values.
 const walk=o=>{if(o&&typeof o==='object'){for(const x of Object.values(o))walk(x);if(!Array.isArray(o))Object.defineProperty(o,'__proto__',{value:{hacked:'UNREVIEWED',number:-987654},enumerable:true});if(!Array.isArray(o))o.extraDiagnostic={private:'UNREVIEWED',numeric:[-987654,'9999999.97']};}};
 walk(v);v.authority.secretDiagnostic='SYNTHETIC_NESTED_SENTINEL';v.calculation.unreviewedTotal='9999999.99';v.quote.unapprovedOtherValue='9999999.98';
 return v;
}
module.exports={target,at,deadlineMs,sample,request,upstream,dirty,app,url,fingerprint};

