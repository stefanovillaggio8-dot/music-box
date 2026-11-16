'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),root=process.cwd(),work=path.resolve('../ste-focus-20261116');
const requireTool=Module.createRequire(path.resolve('tools/prototype.cjs'));
const prefixes=new Map(JSON.parse(fs.readFileSync(work+'/leading-silence.json')).filter(x=>x.through>=.1).map(x=>[x.key,x]));
let text=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
text=text.replace('for(const a of prepared)for(const b of prepared){',`for(const a of prepared)for(const originalB of prepared){
const proof=prefixes.get(originalB.key),entry=proof?Math.max(0,proof.through-.002):0;
const shiftPart=p=>({...p,start:p.start-entry,end:p.end-entry,beats:p.beats.map(t=>t-entry),harmony:p.harmony.map(r=>({...r,t:r.t-entry}))});
const b=!entry?originalB:{...originalB,raw:{...originalB.raw,firstLyricAt:Number.isFinite(originalB.raw.firstLyricAt)?originalB.raw.firstLyricAt-entry:undefined},
 e:{...originalB.e,_prefixEntry:entry},intro:shiftPart(originalB.intro),
 target:originalB.target.map(w=>({...w,start:w.start-entry,end:w.end-entry,downbeats:w.downbeats.map(t=>t-entry),modelBeats:w.modelBeats.map(t=>t-entry),...(w.observed?{observed:shiftPart(w.observed)}:{})}))};
`);
text=text.replace('const lo=Math.floor(start*10),hi=Math.ceil(end*10);','if(e._prefixEntry){start+=e._prefixEntry;end+=e._prefixEntry;} const lo=Math.floor(start*10),hi=Math.ceil(end*10);');
// Full clear incoming overlap is measured in original coordinates. Other
// handoff variants stay excluded from this bounded candidate experiment.
text=text.replace('const allowHandoff=arg(\'vocal-handoff\',\'true\')===\'true\';','const allowHandoff=false;');
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges','--exact-silence=../personal-20261116/all-personal-exact-silence.json','--output='+work+'/prefix-candidates.json');
new Function('require','__dirname','prefixes',text)(requireTool,path.resolve('tools'),prefixes);
const d=JSON.parse(fs.readFileSync(work+'/prefix-candidates.json'));
for(const p of d.plans){
 const evidence=prefixes.get(p.to),entry=evidence?Math.max(0,evidence.through-.002):0;
 p.cue.entry=entry;p.leadingSilence=evidence;
 if(entry){
  p.cue.nextBeat+=entry;
  const e=p.cue.structuralEvidence;
  e.targetObservedDownbeats=e.targetObservedDownbeats.map(t=>t+entry);e.targetModelDownbeats=e.targetModelDownbeats.map(t=>t+entry);
  e.pulseCheck.target=e.pulseCheck.target.map(t=>t+entry);
  // targetBars are already relative to the audible overlap, not file zero.
 }
}
fs.writeFileSync(work+'/prefix-original-plans.json',JSON.stringify(d,null,2));
console.log(JSON.stringify({pairs:[...new Set(d.plans.map(p=>p.from+'|'+p.to))],windows:d.plans.length}));
