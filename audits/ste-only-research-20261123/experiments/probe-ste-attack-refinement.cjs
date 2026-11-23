"use strict";
// Compare ONLY frozen Ste windows; neither a new pair search nor a certificate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const casesFile=arg('cases'),featuresFile=arg('features'),refined=read(arg('refined')),cases=read(casesFile),features=read(featuresFile).entries;
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert.equal(refined.profile,'Ste');assert.equal(refined.discoveryOnly,true);assert.equal(refined.casesSha256,hash(casesFile));assert.equal(refined.featuresSha256,hash(featuresFile));
for(const [f,h] of Object.entries(refined.inputHashes))assert.equal(hash(path.join(root,f)),h,'Input changed: '+f);
const database=read(path.join(root,'dj-deep-analysis.json'));
let source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
const needle=' const ratio=errors.length/Math.max(old.length,next.length);';assert.equal(source.split(needle).length,2);
source=source.replace(needle,needle+'\n if(diagnosis)Object.assign(diagnosis,{sourcePulses:old.length,targetPulses:next.length,matches:errors.length,ratio,first,second,rms:errors.length?Math.sqrt(errors.reduce((sum,x)=>sum+x*x,0)/errors.length):null});');
const audit=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const wrappedFs={...fs,readFileSync:(file,...args)=>path.resolve(String(file))===path.join(root,'mix-intelligente.js')?source:fs.readFileSync(file,...args)};
const {engine}=new Function('require','__dirname',audit.slice(0,audit.indexOf('// Independent PCM spotchecks'))+'return {engine};')(n=>n==='node:fs'?wrappedFs:require(n),path.join(root,'tools'));
const rows=[];
for(const c of cases){
 assert.ok(refined.entries[c.from]?.outro&&refined.entries[c.to]?.intro,'Case was not analyzed in the Ste-only tool');
 const evaluate=useRefined=>{
  let best=null;const rejections={};
  const part=(key,role)=>{
   const old=features[key].pcmTransition[role],ref=refined.entries[key][role];
   assert.equal(features[key].sha,database.entries[key].sha);assert.equal(refined.entries[key].sha,features[key].sha);
   const all=[old.beats,...(old.grids||[]).map(g=>g.beats)];assert.equal(all.length,ref.grids.length);
   return all.map((beats,i)=>{
    assert.deepEqual(beats,ref.grids[i].originalBeats);const replacement=ref.grids[i].beats;
    assert.equal(beats.length,replacement.length);assert.ok(replacement.every((t,j)=>Number.isFinite(t)&&Math.abs(t-beats[j])<=.040001&&(!j||t>replacement[j-1])));
    return {...old,beats:useRefined?replacement:beats};
   });
  };
  for(const a of part(c.from,'outro'))for(const b of part(c.to,'intro')){
   const diagnostic={},fit=engine.pcmFullBeatFit(a,b,c.begin,c.entry,c.rate,c.fade,diagnostic);
   rejections[diagnostic.reason||'passed']=(rejections[diagnostic.reason||'passed']||0)+1;
   const harmony=fit?(engine.pcmFullHarmony(a,b,c.begin,c.entry,c.rate,c.fade)||engine.pcmPreservedTailHarmony(a,b,c.begin,c.rate,c.fade)):null;
   const row={fitPassed:!!fit,harmonyPassed:!!harmony,...diagnostic,...(fit?{matches:fit.beats,ratio:fit.ratio,rms:fit.rms}:{})};
   if(!best||Number(row.fitPassed)>Number(best.fitPassed)||row.fitPassed===best.fitPassed&&((Number(row.ratio)||0)>(Number(best.ratio)||0)||row.ratio===best.ratio&&Number.isFinite(row.rms)&&row.rms<(best.rms??Infinity)))best=row;
  }
  return {best,rejections};
 };
 rows.push({from:c.from,to:c.to,role:c.role,begin:c.begin,entry:c.entry,fade:c.fade,rate:c.rate,before:evaluate(false),after:evaluate(true)});
}
const report={method:'frozen-Ste-window-actual-PCM-gates-v1',discoveryOnly:true,certifiedPairsAdded:0,criteriaUnchanged:true,geometryRetuned:false,modelDownbeatOrVocalProofNotChecked:true,rows};
fs.writeFileSync(arg('output'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
