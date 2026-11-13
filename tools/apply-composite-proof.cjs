const fs=require('node:fs'),path=require('node:path');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const index=JSON.parse(fs.readFileSync(arg('index','dj-deep-analysis.json'))),report=JSON.parse(fs.readFileSync(arg('report','composite-report.json')));
let applied=0;
for(const row of report.results){
 if(row.error)continue;
 const a=index.entries[row.from],b=index.entries[row.to],p=row.cue,c=p?.composite;
 if(!a||!b||a.sha!==p.sourceSha||b.sha!==p.targetSha||!c||c.peak>.961||
    c.pitchPreserved!==true||c.timingVerified!==true||c.sourceSha!==a.sha||c.targetSha!==b.sha)throw Error('Unbound composite proof');
 if(p.structuralBeat){
  a.structuralBeatPlans??={};a.structuralBeatPlans[b.sha]={version:1,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration,cue:p};
 }else{
  const record=a.pcmBeatPlans?.[b.sha];
  if(!record||['begin','entry','fade','tempo'].some(k=>Math.abs(record.cue[k]-p[k])>.0001))throw Error('Different legacy plan');
  record.cue.composite=c;
 }
 applied++;
}
fs.writeFileSync(arg('output','dj-deep-analysis.json'),JSON.stringify(index)+'\n');
console.log(JSON.stringify({applied,failed:report.results.filter(r=>r.error).length}));
