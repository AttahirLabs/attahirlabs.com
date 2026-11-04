// Cloudflare Pages Function. Every calculation goes through TariffShield's source-admission transaction.
import presenter from '../../duty/rev22-quote.js';
const EXPECTED_BINDING = null;
const fixedApp = 'https://tariff-shield-production.up.railway.app/api/authority-duty';
const fields = new Set(['calculationBasis','origin','manufacturingOrigin','thirdCountryProcessing','certificationDisposition','brokerEntryReference','adCvdStatus','adCvdEvidenceRef','entryTreatment','qspProductStatus','qspProductEvidenceRef','hts','entryAt','customsValue','mfnRate','forcedLaborCountryHeading','forcedLaborExceptionHeading','brazilHeading','qspHeading','qspQuotaStatus','qspQuotaEvidenceRef','qspQuotaReviewedAt','uasHeading','shippingCost','insuranceCost']);
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const fail=(status)=>Response.json({status:'indeterminate',code:'EXACT_DUTY_UNAVAILABLE',reason:'No supported duty estimate is available.'},{status,headers:status===405?{...headers,Allow:'POST'}:headers});
async function bounded(message,limit,signal) {
  const n=message.headers.get('content-length');
  if(n!==null&&(!/^\d+$/.test(n)||Number(n)>limit))throw Error('length');
  const reader=message.body?.getReader();if(!reader)throw Error('body');
  let timer,abort;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),5000); abort=()=>reject(Error('abort'));signal.addEventListener('abort',abort,{once:true});});
  const out=new Uint8Array(limit);let pos=0;
  try {while(true){if(signal.aborted)throw Error('abort');const v=await Promise.race([reader.read(),timeout]);if(v.done)break;
    if(pos+v.value.byteLength>limit)throw Error('limit');out.set(v.value,pos);pos+=v.value.byteLength;}
    if(n!==null&&Number(n)!==pos)throw Error('length');return new TextDecoder('utf-8',{fatal:true}).decode(out.subarray(0,pos));
  }finally{clearTimeout(timer);signal.removeEventListener('abort',abort);void reader.cancel().catch(()=>{});}
}
async function exactDutyInputFingerprint(input) {
  // Property order and null optional fields match the gateway exactInputFingerprint.
  const identity = {
    destination: "US", basis: input.calculationBasis,
    origin: input.origin, manufacturingOrigin: input.manufacturingOrigin,
    thirdCountryProcessing: input.thirdCountryProcessing, certificationDisposition: input.certificationDisposition,
    brokerEntryReference: input.brokerEntryReference, adCvdStatus: input.adCvdStatus,
    adCvdEvidenceRef: input.adCvdEvidenceRef, entryTreatment: input.entryTreatment,
    qspProductStatus: input.qspProductStatus, qspProductEvidenceRef: input.qspProductEvidenceRef,
    hts: input.hts, entryAt: input.entryAt, customsValue: input.customsValue, mfnRate: input.mfnRate,
    forcedLaborCountryHeading: input.forcedLaborCountryHeading, forcedLaborExceptionHeading: input.forcedLaborExceptionHeading,
    brazilHeading: input.brazilHeading ?? null, qspHeading: input.qspHeading ?? null,
    qspQuotaStatus: input.qspQuotaStatus ?? null, qspQuotaEvidenceRef: input.qspQuotaEvidenceRef ?? null,
    qspQuotaReviewedAt: input.qspQuotaReviewedAt ?? null,
    shippingCost: input.shippingCost, insuranceCost: input.insuranceCost,
  };
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(identity)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
// Only checked primitives leave this boundary. The upstream JSON is never an output object.
function requireWire(ok) { if (!ok) throw Error('unpublishable'); }
function record(v) { requireWire(v !== null && typeof v === 'object' && !Array.isArray(v)); return v; }
function str(v) { requireWire(typeof v === 'string' && v.length > 0 && v.length <= 600); return v; }
function list(v, build) { requireWire(Array.isArray(v) && v.length <= 64); return v.map(build); }
function literal(v, expected) { requireWire(v === expected); return expected; }
function symbols(v, expected) {
  requireWire(Array.isArray(v) && v.length === expected.length && v.every((x,i)=>x === expected[i]));
  return expected.map(x=>x);
}
function named(v, fields) {
  record(v);
  return Object.fromEntries(fields.map(k=>[k,str(v[k])]));
}
function withinReview(binding) {
  if (!binding) return false;
  const now = Date.now(), start = presenter.instantMicros(binding.evidenceAsOf), end = presenter.instantMicros(binding.evidenceValidThrough);
  if (!Number.isSafeInteger(now) || start === null || end === null) return false;
  // Date.now() has millisecond resolution. Withhold the millisecond containing a fractional exclusive end.
  const micros = BigInt(now) * 1000n;
  return start <= micros && micros + 999n < end;
}
// Match the ordinary-entry declarations required by the pinned kernel policy. A matching
// response fingerprint only proves the App echoed a value, not that the policy accepts it.
function reviewedReference(value) {
  if (typeof value !== 'string') return false;
  return Array.from(value.trim()).length >= 8 && Array.from(value).length <= 300;
}
function acceptsEntryDeclarations(input, qspStatus) {
  if (!['entry', 'per_unit'].includes(input.calculationBasis) ||
      input.manufacturingOrigin !== input.origin || input.thirdCountryProcessing !== 'none' ||
      input.certificationDisposition !== 'not_required' || input.adCvdStatus !== 'not_subject' ||
      input.entryTreatment !== 'ordinary_general' || input.qspProductStatus !== 'subject_qsp' ||
      ![input.brokerEntryReference, input.adCvdEvidenceRef, input.qspProductEvidenceRef].every(reviewedReference) ||
      input.forcedLaborExceptionHeading !== 'NONE' || Object.hasOwn(input, 'uasHeading') ||
      (input.origin === 'BR' ? input.brazilHeading !== '9903.05.01' : Object.hasOwn(input, 'brazilHeading'))) return false;

  // projectQuote has already checked this layer against its own immutable origin list.
  if (qspStatus === 'not_applicable') {
    return ['qspHeading','qspQuotaStatus','qspQuotaEvidenceRef','qspQuotaReviewedAt'].every(k => !Object.hasOwn(input, k));
  }
  const expected = input.qspHeading === '9903.45.30' ? 'allocated_in_quota' :
    input.qspHeading === '9903.45.31' ? 'confirmed_over_quota' : null;
  if (!expected || input.qspQuotaStatus !== expected || !reviewedReference(input.qspQuotaEvidenceRef)) return false;
  const entry = presenter.instantMicros(input.entryAt), reviewed = presenter.instantMicros(input.qspQuotaReviewedAt);
  return entry !== null && reviewed !== null && reviewed >= entry && reviewed <= BigInt(Date.now()) * 1000n;
}
function wireFor(raw,input,binding) {
  const v=record(raw), q=record(v.quote), c=record(v.calculation), d=record(v.reviewedEntryDeclarations), a=record(v.authority);
  requireWire(v.fixtureOnly === undefined || v.fixtureOnly === false);
  const warning='NOT_A_CUSTOMS_LIQUIDATION';
  symbols(v.warnings,[warning]);
  const stages=record(q.sourceStages);
  const sourceStages={
    captured:literal(stages.captured,'source_identity_bound'),reviewed:literal(stages.reviewed,'not_asserted_by_quote'),
    approvedForUse:literal(stages.approvedForUse,'requires_compiled_signed_target')
  };
  const declarations={};
  for(const k of ['qspProductStatus','qspProductEvidenceRef','manufacturingOrigin','thirdCountryProcessing','certificationDisposition',
                  'brokerEntryReference','adCvdStatus','adCvdEvidenceRef'])
    declarations[k]=literal(d[k],str(input[k]));
  for(const k of ['qspQuotaStatus','qspQuotaEvidenceRef','qspQuotaReviewedAt'])
    declarations[k]=literal(d[k],input[k]===undefined?null:str(input[k]));
  const fixedDeclarations={
    qspProductDefinition:'note41a_silica_and_resin_silica_greater_than_any_other_single_material_by_actual_weight_excludes_quarried_stone',
    customsValueScope:'subject_qsp_portion_only_excludes_accompanying_non_subject_goods',
    manufacturingOriginMeaning:'original_qsp_slab_manufacturing_country',verificationState:'unverified_caller_assumptions'
  };
  for(const [k,s] of Object.entries(fixedDeclarations)) declarations[k]=literal(d[k],s);
  const facts={
    'origin.country':'request.origin.country','destination.country':'request.destination.country',
    'product.classification':'request.product.classification','entry.basis':'request.entry.basis','entry.instant':'request.entry.at',
    'customs.value':'request.customsValue.amount','customs.currency':'request.customsValue.currency','base.mfn.rate':'caller:entry-classification'
  };
  const factLedger=list(q.factLedger,x=>{
    const r=record(x), fact=str(r.fact);
    if(fact==='ruleset.source_documents'||fact==='legal.applicability')
      return {fact,value:list(r.value,str),origin:str(r.origin),verificationState:str(r.verificationState),provenance:list(r.provenance,str)};
    const provenance=symbols(r.provenance,[Object.hasOwn(facts,fact)?facts[fact]:'caller:chapter99-filing']);
    let value;
    if(fact==='base.mfn.rate') {const x=record(r.value);value={kind:literal(x.kind,'ad_valorem'),percent:literal(x.percent,input.mfnRate)};}
    else if(fact==='product.classification'){const x=record(r.value);value={schedule:literal(x.schedule,'HTSUS'),scheduleRevision:literal(x.scheduleRevision,'2026HTSRev22'),code:literal(x.code,input.hts)};}
    else value=str(r.value);
    return {fact,value,origin:literal(r.origin,'user_supplied'),verificationState:literal(r.verificationState,'unverified_user_supplied'),provenance};
  });
  const coverageEvidence=list(q.coverageEvidence,x=>{
    const r=record(x);return {...named(r,['sliceId','evidenceAsOf','evidenceValidThrough']),
      effectiveFrom:literal(r.effectiveFrom,binding.earliestEntryAt),effectiveTo:literal(r.effectiveTo,binding.evidenceValidThrough),
      numericCoveragePermitted:literal(r.numericCoveragePermitted,true),fixtureSemantics:literal(r.fixtureSemantics,'authoritative_legal_coverage'),
      sourceDocumentIds:list(r.sourceDocumentIds,str)};
  });
  const layerDeterminations=list(q.layerDeterminations,x=>{
    const r=record(x);
    const row={...named(r,['layer','status','basis']),lineIndexes:list(r.lineIndexes,i=>{requireWire(Number.isSafeInteger(i)&&i>=0&&i<4);return i;}),
      ruleIds:list(r.ruleIds,str),sourceDocumentIds:list(r.sourceDocumentIds,str),claimIds:r.status==='not_applicable'?list(r.claimIds,str):symbols(r.claimIds,[]),reasonCodes:symbols(r.reasonCodes,[])};
    if (r.operationEvidence!==undefined) {
      requireWire(row.layer==='special.section301.forced_labor' && (row.status==='applied'||row.status==='zero'));
      const x=record(r.operationEvidence);row.operationEvidence={...named(x,['kind','targetRatePercent','referenceRatePercent','effectiveComponentRatePercent']),referenceLayers:list(x.referenceLayers,str)};
    }
    return row;
  });
  const money=v=>{const m=record(v);return {amount:str(m.amount),currency:literal(m.currency,'USD')};};
  const lineItems=list(c.lineItems,x=>{
    const r=record(x),layer=str(r.layer),authority=layer==='base.mfn'?'mfn':layer==='special.section203.qsp_safeguard'?'other':'section_301';
    if (r.reasonCodes!==undefined) symbols(r.reasonCodes,[]);
    return {layer,authority:literal(r.authority,authority),...named(r,['operation','disposition','ratePercent']),
      dutyAmount:money(r.dutyAmount),ruleIds:list(r.ruleIds,str),sourceDocumentIds:list(r.sourceDocumentIds,str)};
  });
  const calculation={currency:literal(c.currency,'USD'),totalRatePercent:str(c.totalRatePercent),lineItems};
  for(const key of ['customsValue','shippingCost','insuranceCost','dutyAmount','estimatedSubtotal']) calculation[key]=money(c[key]);
  return {
    status:literal(v.status,'calculated'),evaluatedEntryAt:str(v.evaluatedEntryAt),inputFingerprint:str(v.inputFingerprint),planningScope:literal(v.planningScope,'planning_only'),
    authority:{...named(a,['state','rulesetVersion','rulesetPayloadHash','releaseRecordHash','inputContract','resultContractVersion','scheduleRevision','evidenceAsOf','evidenceValidThrough']),activeCoverageSliceIds:list(a.activeCoverageSliceIds,str)},
    quote:{...named(q,['schemaVersion','resultContractVersion','sourceUse','planningScope','completeness']),sourceStages,
      reasonCodes:symbols(q.reasonCodes,[]),warnings:symbols(q.warnings,[warning]),resolvedDecisions:symbols(q.resolvedDecisions,[]),
      factLedger,coverageEvidence,layerDeterminations,consideredRuleIds:list(q.consideredRuleIds,str),sourceDocumentIds:list(q.sourceDocumentIds,str)},
    reviewedEntryDeclarations:declarations,calculation
  };
}

export async function onRequest({request}) {
  const started=performance.now();
  const u=new URL(request.url); if(request.method!=='POST')return fail(405);
  if(u.protocol!=='https:'||u.search||request.headers.get('origin')!==u.origin)return fail(403);
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')||''))return fail(415);
  if(!withinReview(EXPECTED_BINDING))return fail(503);
  let input,body;
  try{body=await bounded(request,16384,request.signal);input=JSON.parse(body);
    if(!input||typeof input!=='object'||Array.isArray(input)||JSON.stringify(input)!==body||
       !Object.keys(input).length||Object.entries(input).some(([k,v])=>!fields.has(k)||typeof v!=='string'||v.length>600))return fail(400);
  }catch{return fail(400);}
  const references = ['brokerEntryReference', 'adCvdEvidenceRef', 'qspProductEvidenceRef'];
  if (input.qspHeading !== undefined || input.qspQuotaEvidenceRef !== undefined) references.push('qspQuotaEvidenceRef');
  if (!references.every(name => typeof input[name] === 'string' && /^tsref:v1:[a-f0-9]{64}$/.test(input[name]))) return fail(400);
  const qspStatus = presenter.publicInputQspStatus(input, EXPECTED_BINDING, Date.now());
  if (!qspStatus || !acceptsEntryDeclarations(input, qspStatus)) return fail(422);
  // Reconstruct a deterministic wire from validated primitives. Client metadata never enters the App request.
  body = JSON.stringify(Object.fromEntries([...fields].filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]])));
  if (request.signal.aborted) return fail(503);
  const control=new AbortController();const abort=()=>control.abort();const clock=setTimeout(abort,15000);request.signal.addEventListener('abort',abort,{once:true});
  const live=()=>!request.signal.aborted && !control.signal.aborted && performance.now()-started < 15000 && withinReview(EXPECTED_BINDING);
  try {
    if(!live())return fail(503);
    // Never forward the caller's cookies, authorization, origin, query or headers. Never fall back to DutyCalc.
    const result=await fetch(fixedApp,{method:'POST',headers:{'Content-Type':'application/json'},body,credentials:'omit',cache:'no-store',redirect:'manual',signal:control.signal});
    if(result.status!==200||result.redirected||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(result.headers.get('content-type')||'')||
        !/^(?:private\s*,\s*no-store|no-store\s*,\s*private)$/i.test((result.headers.get('cache-control')||'').trim())){void result.body?.cancel().catch(()=>{});return fail(503);}
    const value=JSON.parse(await bounded(result,262144,control.signal));
    const fingerprint=await exactDutyInputFingerprint(input);
    if(!live())return fail(503);
    let wire;
    try { wire=wireFor(value,input,EXPECTED_BINDING); } catch { return fail(422); }
    const target=Object.freeze({kind:'compiled_signed_authority',binding:EXPECTED_BINDING});
    const checked=presenter.projectQuote(wire,{...input,inputFingerprint:fingerprint},target);
    if(checked.completeness!=='complete'||checked.softwareOnly!==false||!checked.calculation)return fail(422);
    const qspLayer = checked.layers.find(row => row.layer === 'special.section203.qsp_safeguard');
    if (!qspLayer || !acceptsEntryDeclarations(input, qspLayer.status)) return fail(422);
    const response=Response.json(wire,{headers});
    // The public wire is fully serialized before the final synchronous deadline/abort check.
    if(!live())return fail(503);
    return response;
  }catch{return fail(503);}finally{clearTimeout(clock);request.signal.removeEventListener('abort',abort);}
}
