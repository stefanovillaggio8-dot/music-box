'use strict';
// Attach exact-window render evidence; never convert a failed render to a pass.
const fs=require('node:fs');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const index=JSON.parse(fs.readFileSync(arg('index','dj-deep-analysis.json')));
const plans=JSON.parse(fs.readFileSync(arg('plans','')));
const reports=arg('reports','').split(',').filter(Boolean).map(f=>JSON.parse(fs.readFileSync(f)));
if(!reports.length)throw Error('Supply --reports=render/report.json,...');
const baseline=JSON.parse(fs.readFileSync(arg('baseline','dj-deep-analysis.json'))),accepted=[],rejected=[];
for(const p of plans.plans){
 const measurements=reports.map(report=>{
  const matches=report.results.filter(r=>r.from===p.from&&r.to===p.to&&
   ['begin','entry','fade','tempo'].every(k=>Number.isFinite(r.cueParameters?.[k])&&Math.abs(r.cueParameters[k]-p.cue[k])<1e-8));
  if(matches.length!==1)throw Error('Missing or duplicated exact-window render '+p.from+' -> '+p.to);
  return matches[0];
 });
 if(measurements.some(r=>!r||r.error||typeof r.stretchAccepted!=='boolean'||r.sourceSha!==p.cue.sourceSha||
  r.targetSha!==p.cue.targetSha||Math.abs(r.seconds-p.cue.fade)>.003||
  !Number.isFinite(r.recommendedHeadroom)||r.recommendedHeadroom<=0||r.recommendedHeadroom>1||
  r.safeSamplesOverFullScale!==0))throw Error('Unverified rendered pair '+p.from+' -> '+p.to);
 if(measurements.some(r=>!r.stretchAccepted)){
  // A numerically plausible proposal may fail real SoundTouch rendering.
  // It is a rejected candidate, never a complete exported transition.
  // Keep independent, previously rendered ORIGINAL-window work if present.
  const previous=baseline.entries[p.from]?.pcmBeatPlans?.[p.cue.targetSha],c=previous?.cue?.composite;
  const keep=previous?.fromSha===p.cue.sourceSha&&previous?.toSha===p.cue.targetSha&&
   previous.cue.renderEvidence?.timingVerified===true&&c?.version===1&&
   c.sourceSha===p.cue.sourceSha&&c.targetSha===p.cue.targetSha&&c.introductionExposure?.accepted!==false;
  const table=index.entries[p.from]?.pcmBeatPlans;
  if(table){if(keep)table[p.cue.targetSha]=previous;else delete table[p.cue.targetSha];}
  rejected.push({from:p.from,to:p.to,sourceSha:p.cue.sourceSha,targetSha:p.cue.targetSha,
   reason:'rendered-stretch-timing-not-verified-at-every-rate',
   failedRates:measurements.filter(r=>!r.stretchAccepted).map(r=>r.sampleRate),retainedPreviousWindow:!!keep});
  continue;
 }
 const cue=index.entries[p.from]?.pcmBeatPlans?.[p.cue.targetSha]?.cue;
 if(!cue||['entry','tempo','fade','begin'].some(k=>Math.abs(cue[k]-p.cue[k])>1e-8))throw Error('Plan changed after render');
 cue.outputHeadroom=Math.min(...measurements.map(r=>r.recommendedHeadroom));
 cue.renderEvidence={sourceSha:p.cue.sourceSha,targetSha:p.cue.targetSha,
  sampleRates:measurements.map(r=>r.sampleRate),pitchPreserved:true,
  timingVerified:true,peakBound:Math.max(...measurements.map(r=>(r.sourcePeak+.33*r.processedPeak)*cue.outputHeadroom)),
  humanListening:false,downbeatsVerified:false,phrasesVerified:false};
 p.cue=cue;
 accepted.push(p);
}
plans.candidatesRequested=plans.plans.length;plans.plans=accepted;plans.rejectedCandidates=rejected;
const out=arg('output','dj-deep-analysis.json');fs.writeFileSync(out,JSON.stringify(index)+'\n');
fs.writeFileSync(arg('report','full-beat-audio-plans.json'),JSON.stringify(plans,null,2)+'\n');
console.log(JSON.stringify({candidatesRequested:plans.candidatesRequested,renderedPlans:plans.plans.length,rejectedCandidates:rejected.length,mobileFullGainSafe:plans.plans.filter(p=>p.cue.outputHeadroom===1).length}));
