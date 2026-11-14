'use strict';
const fs=require('node:fs'),path=require('node:path');
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const root=path.resolve(__dirname,'..'),file=arg('index',path.join(root,'dj-deep-analysis.json')),db=JSON.parse(fs.readFileSync(file));
const code=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',code.slice(0,code.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(root,'tools'));
const rejected=[];let retained=0;
for(const [from,entry] of Object.entries(db.entries)){
 const a=engine.withGuardedLRC(entry);
 for(const [sha,record] of Object.entries(entry.structuralBeatPlans||{})){
  const valid=[];
  for(const cue of record.cues||[record.cue]){
   const d=engine.structuralContentDecision(a,cue);
   if(d.allowed){valid.push({cue,decision:d});retained++;}
   else rejected.push({from,targetSha:sha,begin:cue.begin,end:cue.end,compositeSha:cue.composite.sha256,decision:d});
  }
  valid.sort((a,b)=>a.decision.penalty-b.decision.penalty||Number(b.cue.measuredFullBeat)-Number(a.cue.measuredFullBeat));
  if(!valid.length)delete entry.structuralBeatPlans[sha];
  else{record.cues=valid.map(x=>x.cue);record.cue=record.cues[0];}
 }
}
fs.writeFileSync(arg('output',file),JSON.stringify(db)+'\n');
fs.writeFileSync(arg('report','content-pruning.json'),JSON.stringify({retained,rejectedCount:rejected.length,rejected},null,2)+'\n');
console.log(JSON.stringify({retained,rejected:rejected.length}));
