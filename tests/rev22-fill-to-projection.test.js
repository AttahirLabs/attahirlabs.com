"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {projectQuote,renderQuote}=require("../duty/rev22-quote"),packet=JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures/rev22-fill-to-software-quotes.json"))),copy=v=>JSON.parse(JSON.stringify(v));
const target=Object.freeze({kind:"software_fixture",labSha256:"02f930d4b86843bd3b2c523d2f7296f6fd3fa4dfab4ee39c7ce94c9b3d824f9a"});
class Element{constructor(){this.textContent="";this.style={};this.children=[];}appendChild(v){this.children.push(v);}replaceChildren(...v){this.children=v;this.textContent="";}}
const nodes=()=>Object.fromEntries(["resultNumbers","rateDisplay","dutyDisplay","totalDisplay","resultState","breakdown","rev22Evidence"].map(k=>[k,new Element()]));
const text=n=>[n.textContent,...n.children.map(text)].join(" ");
const sample=()=>copy(packet.samples.find(s=>s.input.origin==="JP"&&s.input.hts==="7020006000"));
function reprice(v,percent){const c=v.response.calculation,line=c.lineItems.find(l=>l.operation==="fill_to");line.ratePercent=percent;line.dutyAmount.amount=(Number(percent)*10).toFixed(2);line.disposition=Number(percent)===0?"zero":"applied";c.totalRatePercent=c.lineItems.reduce((a,l)=>a+Number(l.ratePercent),0).toFixed(6);c.dutyAmount.amount=c.lineItems.reduce((a,l)=>a+Number(l.dutyAmount.amount),0).toFixed(2);c.estimatedSubtotal.amount=(1060+Number(c.dutyAmount.amount)).toFixed(2);}

test("five qualified top-up families render the effective component without double counting MFN",()=>{
 assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname,"fixtures/rev22-fill-to-software-quotes.json"))).digest("hex"),"1451087c882540c210225bba2eb071a011d32184026299b3ceec75b752e3059b");
 assert.equal(packet.softwareOnly,true);assert.equal(packet.noCanonicalRecordOrSignaturesCreated,true);assert.equal(packet.samples.length,10);
 const totals={AT:"350.00",JP:"375.00",KR:"125.00",CH:"375.00",TW:"350.00"};
 for(const s of packet.samples){const model=projectQuote(s.response,s.input,target),n=nodes();assert.equal(model.completeness,"complete",s.requestId);assert.equal(model.softwareOnly,true);renderQuote(model,n,()=>new Element());assert.equal(n.dutyDisplay.textContent,"$"+s.response.calculation.dutyAmount.amount);assert.match(text(n.breakdown),/top-up .* toward .* including declared MFN/);assert.match(n.resultState.textContent,/Software test only/);if(s.input.mfnRate==="5")assert.equal(s.response.calculation.dutyAmount.amount,totals[s.input.origin]);}
});

test("top-up kind, bound target, reference and coordinated component changes show no total",()=>{
 for(const mode of["kind","target","reference","effectiveEvidence","statutoryTargetAsComponent","coordinatedComponent","missingEvidence","source","rule"]){const s=sample(),row=s.response.quote.layerDeterminations.find(r=>r.operationEvidence),line=s.response.calculation.lineItems[row.lineIndexes[0]];
  if(mode==="kind")line.operation="add";
  if(mode==="target")row.operationEvidence.targetRatePercent="13";
  if(mode==="reference")row.operationEvidence.referenceLayers=["special.section203.qsp_safeguard"];
  if(mode==="effectiveEvidence")row.operationEvidence.effectiveComponentRatePercent="1";
  if(mode==="statutoryTargetAsComponent"){reprice(s,row.operationEvidence.targetRatePercent);row.operationEvidence.effectiveComponentRatePercent=line.ratePercent;}
  if(mode==="coordinatedComponent"){reprice(s,"1");row.operationEvidence.effectiveComponentRatePercent="1";}
  if(mode==="missingEvidence")delete row.operationEvidence;
  if(mode==="source")row.sourceDocumentIds=line.sourceDocumentIds=["doc:sha256:"+"0".repeat(64)];
  if(mode==="rule")row.ruleIds=line.ruleIds=["rule:us.section301.release2.forced-labor.9903-05-71.assessed"];
  const n=nodes();renderQuote(projectQuote(packet.samples[0].response,packet.samples[0].input,target),n,()=>new Element());const model=projectQuote(s.response,s.input,target);assert.equal(model.completeness,"incomplete",mode);assert.equal(model.calculation,null,mode);renderQuote(model,n,()=>new Element());assert.equal(n.resultNumbers.style.display,"none",mode);for(const id of["dutyDisplay","rateDisplay","totalDisplay"])assert.equal(n[id].textContent,"—",mode);
 }
});

test("unrepresented MFN and additive rates cannot create a new arithmetic policy",()=>{
 const s=sample();s.input.mfnRate="6";s.response.quote.factLedger.find(f=>f.fact==="base.mfn.rate").value.percent="6";assert.equal(projectQuote(s.response,s.input,target).completeness,"incomplete");
 const original=JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures/rev22-public-software-quotes.json"))),v=copy(original.samples.find(s=>s.input.origin==="AE"&&s.response.status==="calculated")),row=v.response.quote.layerDeterminations.find(r=>r.layer==="special.section301.forced_labor"),line=v.response.calculation.lineItems[row.lineIndexes[0]];line.ratePercent="1";line.dutyAmount.amount="10.00";v.response.calculation.totalRatePercent="31";v.response.calculation.dutyAmount.amount="310.00";v.response.calculation.estimatedSubtotal.amount="1370.00";assert.equal(projectQuote(v.response,v.input,target).completeness,"incomplete");
});

test("a complete qualified top-up fixture still cannot configure the production binding",()=>{
 const s=sample();s.response.scope={approved:true};assert.equal(projectQuote(s.response,s.input,null).completeness,"incomplete");const client=fs.readFileSync(path.join(__dirname,"../duty/calculator.js"),"utf8");assert.match(client,/const REV22_COMPILED_BINDING = null;/);assert.doesNotMatch(client,/effectiveComponentsByDeclaredMfn/);
});
