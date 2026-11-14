const fs=require('node:fs'),path=require('node:path');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const index=JSON.parse(fs.readFileSync(arg('index','dj-deep-analysis.json'))),report=JSON.parse(fs.readFileSync(arg('report','composite-report.json')));
let applied=0;
if(process.argv.includes('--reset-structural'))for(const e of Object.values(index.entries))delete e.structuralBeatPlans;
for(const row of report.results){
 if(row.error)continue;
 const a=index.entries[row.from],b=index.entries[row.to],p=row.cue,c=p?.composite;
 if(!a||!b||a.sha!==p.sourceSha||b.sha!==p.targetSha||!c||c.overlapPeak>.961||c.peak>.9991||c.oversampledPeak>1||
    c.pitchPreserved!==true||c.timingVerified!==true||c.sourceSha!==a.sha||c.targetSha!==b.sha)throw Error('Unbound composite proof');
 if(p.structuralBeat){
  if(c.rhythmVerified!==true||c.postRenderRhythm?.accepted!==true)throw Error('Missing actual rendered rhythm proof');
  a.structuralBeatPlans??={};
  const existing=a.structuralBeatPlans[b.sha],cues=existing?.cues||[];
  const sameWindow=x=>['begin','end','entry','fade','tempo'].every(k=>
   Number.isFinite(x[k])&&Math.abs(x[k]-p[k])<.0001)&&
   x.measuredFullBeat===p.measuredFullBeat&&x.metricalRhythmic===p.metricalRhythmic&&x.preservedEntrance===p.preservedEntrance;
  // A second OS/encoder may produce a different FLAC hash for the same
  // certified window. Keep the already installed verified rendition.
  if(!cues.some(x=>x.composite.sha256===p.composite.sha256||sameWindow(x)))cues.push(p);
  const native=p=>p.nativeRatePreferred===true&&p.composite.postRenderRhythm.rmsSeconds<=.025;
  cues.sort((a,b)=>Number(b.measuredFullBeat)-Number(a.measuredFullBeat)||Number(native(b))-Number(native(a))||
    a.composite.postRenderRhythm.rmsSeconds-b.composite.postRenderRhythm.rmsSeconds||b.score-a.score);
  a.structuralBeatPlans[b.sha]={version:1,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration,cue:cues[0],cues};
 }else{
  const record=a.pcmBeatPlans?.[b.sha];
  if(!record||['begin','entry','fade','tempo'].some(k=>Math.abs(record.cue[k]-p[k])>.0001))throw Error('Different legacy plan');
  record.cue.composite=c;
 }
 applied++;
}
fs.writeFileSync(arg('output','dj-deep-analysis.json'),JSON.stringify(index)+'\n');
console.log(JSON.stringify({applied,failed:report.results.filter(r=>r.error).length}));
