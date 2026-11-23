"use strict";
// Bounded diagnosis: observed PCM attacks versus independent meter hypotheses.
// Model bars are not ground truth; no pair is certified by this tool.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {currentSteScope,validateSteCases}=require('./ste-research-scope.cjs');
const root=path.resolve(__dirname,'..'),arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
function observedMetricPart(part,model,lo,hi){
 const bars=model.reliableBars.filter(b=>b.end>=lo&&b.start<=hi&&b.metricalPhaseConfidence>=.8&&b.modelBeats.length===b.beatsPerBar);
 const predicted=[...new Set(bars.flatMap(b=>b.modelBeats))].sort((a,b)=>a-b),observed=[],missing=[],evidence=[];
 for(const predictedAt of predicted){
  if(predictedAt<part.start+.06||predictedAt>part.end-.06)continue;
  const first=Math.max(0,Math.round((predictedAt-part.start-.06)/part.step)),last=Math.min(part.onset.length-1,Math.round((predictedAt-part.start+.06)/part.step));
  let best=first;for(let i=first+1;i<=last;i++)if(part.onset[i]>part.onset[best])best=i;
  const t=+(part.start+best*part.step).toFixed(4),strength=part.onset[best];
  const row={predictedAt,observedAt:t,strength,offsetMs:(t-predictedAt)*1000};
  if(strength>=.25&&(!observed.length||t-observed.at(-1)>.20)){observed.push(t);evidence.push(row)}else missing.push(row);
 }
 return {part:{...part,beats:observed},evidence,missing,bars:bars.map(b=>({start:b.start,end:b.end,meter:b.beatsPerBar,bpm:b.bpm,phase:b.metricalPhaseConfidence,modelBeats:b.modelBeats}))};
}
function loadEngine(){
 let source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
 const needle=' const ratio=errors.length/Math.max(old.length,next.length);';assert.equal(source.split(needle).length,2);
 source=source.replace(needle,needle+'\n if(diagnosis)Object.assign(diagnosis,{sourcePulses:old.length,targetPulses:next.length,matches:errors.length,ratio,first,second,rms:errors.length?Math.sqrt(errors.reduce((sum,x)=>sum+x*x,0)/errors.length):null});');
 const audit=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const wrappedFs={...fs,readFileSync:(f,...a)=>path.resolve(String(f))===path.join(root,'mix-intelligente.js')?source:fs.readFileSync(f,...a)};
 return new Function('require','__dirname',audit.slice(0,audit.indexOf('// Independent PCM spotchecks'))+'return {engine};')(n=>n==='node:fs'?wrappedFs:require(n),path.join(root,'tools')).engine;
}
function validateGeometry(cases,index){
 for(const c of cases){
  if(!['begin','entry','fade','rate'].every(k=>Number.isFinite(c[k]))||c.begin<26||c.entry!==0||c.fade<4.5||c.fade>16||c.rate<.95||c.rate>1.05||Math.abs(c.begin+c.fade-index.entries[c.from].duration)>.08)
   throw Error('Frozen geometry must preserve the original tail and incoming time zero');
 }
 return cases;
}
function main(){
 const output=arg('output');if(!output||fs.existsSync(output))throw Error('New output evidence path required');
 const scope=currentSteScope(),index=read(path.join(root,'dj-deep-analysis.json'));
 const cases=validateGeometry(validateSteCases(read(arg('cases')),scope,index),index),features=read(arg('features')).entries;
 const needed=new Set(cases.flatMap(c=>[c.from,c.to])),whole=new Map();
 function files(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):/^structure-\d+\.json$/.test(e.name)?[path.join(d,e.name)]:[])}
 for(const file of files(arg('structure'))){
  const entries=read(file).entries||{};
  for(const k of needed){const e=entries[k];if(!e)continue;
   if(whole.has(k)||e.sha!==index.entries[k].sha||e.modelSha256?.['torch/hub/checkpoints/beat_this-final0.ckpt']!=='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331')throw Error('Unbound/duplicate model evidence '+k);
   whole.set(k,e);
  }
 }
 const engine=loadEngine(),rows=[];
 for(const c of cases){
  for(const k of [c.from,c.to])if(!whole.has(k)||features[k]?.sha!==index.entries[k].sha||features[k].pcmTransition.sha!==index.entries[k].sha)throw Error('Missing original source evidence '+k);
  const a=features[c.from].pcmTransition.outro,b=features[c.to].pcmTransition.intro;
  const source=observedMetricPart(a,whole.get(c.from),c.begin,c.begin+c.fade),target=observedMetricPart(b,whole.get(c.to),c.entry,c.entry+c.fade*c.rate);
  const diagnosis={},fit=engine.pcmFullBeatFit(source.part,target.part,c.begin,c.entry,c.rate,c.fade,diagnosis);
  const harmony=fit?(engine.pcmFullHarmony(source.part,target.part,c.begin,c.entry,c.rate,c.fade)||engine.pcmPreservedTailHarmony(source.part,target.part,c.begin,c.rate,c.fade)):null;
  rows.push({from:c.from,to:c.to,role:c.role,geometry:{begin:c.begin,entry:c.entry,fade:c.fade,rate:c.rate},metricFit:fit,diagnosis,harmony,
   source:{observed:source.part.beats,evidence:source.evidence,missing:source.missing,bars:source.bars},
   target:{observed:target.part.beats,evidence:target.evidence,missing:target.missing,bars:target.bars}});
 }
 const report={method:'independent-bar-hypothesis-observed-PCM-diagnosis-v1',profile:'Ste',scopeHash:crypto.createHash('sha256').update(JSON.stringify(scope)).digest('hex'),membershipEvidence:scope.membershipEvidence,criteriaUnchanged:true,newCertifiedPairs:0,modelEvidenceNotHumanTruth:true,geometryRetuned:false,rows};
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:rows.length,pcmGatePass:rows.filter(r=>r.metricFit).length,rows:rows.map(r=>({from:r.from,to:r.to,metricFit:r.metricFit,diagnosis:r.diagnosis,sourceMetricBars:r.source.bars.length,targetMetricBars:r.target.bars.length,missingSource:r.source.missing.length,missingTarget:r.target.missing.length}))},null,2));
}
if(require.main===module)main();
module.exports={observedMetricPart,validateGeometry};
