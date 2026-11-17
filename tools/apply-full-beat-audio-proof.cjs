'use strict';
// Attach exact-window render evidence; never convert a failed render to a pass.
const fs=require('node:fs');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const index=JSON.parse(fs.readFileSync(arg('index','dj-deep-analysis.json')));
const plans=JSON.parse(fs.readFileSync(arg('plans','')));
const reports=arg('reports','').split(',').filter(Boolean).map(f=>JSON.parse(fs.readFileSync(f)));
if(!reports.length)throw Error('Supply --reports=render/report.json,...');
for(const p of plans.plans){
 const measurements=reports.map(report=>report.results.find(r=>r.from===p.from&&r.to===p.to));
 if(measurements.some(r=>!r||r.error||!r.stretchAccepted||r.sourceSha!==p.cue.sourceSha||
  r.targetSha!==p.cue.targetSha||Math.abs(r.seconds-p.cue.fade)>.003||
  !Number.isFinite(r.recommendedHeadroom)||r.recommendedHeadroom<=0||r.recommendedHeadroom>1||
  r.safeSamplesOverFullScale!==0))throw Error('Unverified rendered pair '+p.from+' -> '+p.to);
 const cue=index.entries[p.from]?.pcmBeatPlans?.[p.cue.targetSha]?.cue;
 if(!cue||['entry','tempo','fade','begin'].some(k=>Math.abs(cue[k]-p.cue[k])>1e-8))throw Error('Plan changed after render');
 cue.outputHeadroom=Math.min(...measurements.map(r=>r.recommendedHeadroom));
 cue.renderEvidence={sourceSha:p.cue.sourceSha,targetSha:p.cue.targetSha,
  sampleRates:measurements.map(r=>r.sampleRate),pitchPreserved:true,
  timingVerified:true,peakBound:Math.max(...measurements.map(r=>(r.sourcePeak+.33*r.processedPeak)*cue.outputHeadroom)),
  humanListening:false,downbeatsVerified:false,phrasesVerified:false};
 p.cue=cue;
}
const out=arg('output','dj-deep-analysis.json');fs.writeFileSync(out,JSON.stringify(index)+'\n');
fs.writeFileSync(arg('report','full-beat-audio-plans.json'),JSON.stringify(plans,null,2)+'\n');
console.log(JSON.stringify({renderedPlans:plans.plans.length,mobileFullGainSafe:plans.plans.filter(p=>p.cue.outputHeadroom===1).length}));
