#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const arg=(k,d)=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const root=path.resolve(__dirname,'..'),db=JSON.parse(fs.readFileSync(arg('index',path.join(root,'dj-deep-analysis.json'))));
const archiveFile=arg('archive-index',''),archive=archiveFile?JSON.parse(fs.readFileSync(archiveFile)):null;
const prior=JSON.parse(fs.readFileSync(arg('baseline',path.join(root,'audits/structural-pair-audit-2026-11-13.json'))));
const code=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',code.slice(0,code.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(root,'tools'));
const rows=[];
for(const old of prior.verifiedPairs.filter(p=>p.structural)){
 const a=engine.withGuardedLRC(db.entries[old.from]),b=db.entries[old.to];
 const find=record=>(record?.cues||[record?.cue]).find(p=>p?.composite?.sha256===old.commonSha);
 let cue=find(a.structuralBeatPlans?.[b.sha]),cueSource='active-index';
 if(!cue&&archive){
  const aa=archive.entries[old.from],bb=archive.entries[old.to];
  if(aa?.sha!==a.sha||bb?.sha!==b.sha)throw Error('Archived recording SHA changed');
  cue=find(aa.structuralBeatPlans?.[bb.sha]);cueSource='sha-bound-archived-index';
 }
 if(!cue)throw Error('Original cue not found; supply --archive-index for removed historical candidates');
 if(cue.composite.sourceSha!==a.sha||cue.composite.targetSha!==b.sha)throw Error('Unbound archived cue');
 const m=a.musicalContent,decision=engine.structuralContentDecision(a,cue);
 rows.push({from:old.from,to:old.to,cueSource,begin:cue.begin,end:cue.end,originalDuration:a.duration,audibleEnd:m.audibleEnd,
  skippedAudibleSeconds:Math.max(0,m.audibleEnd-cue.end),unplayedRecordingPercent:100*Math.max(0,m.audibleEnd-cue.end)/(m.audibleEnd-m.audibleStart),
  remainingVocalRegions:m.vocalRegions.filter(r=>r[1]>cue.end&&r[0]<m.audibleEnd),
  remainingSectionHypotheses:m.boundaryTimes.filter(t=>t>cue.end&&t<m.audibleEnd),
  remainingPhraseHypotheses:m.phraseHypotheses.filter(p=>p.end>cue.end),
  positiveFutureLyricTimes:(a.lyricStarts||[]).filter(t=>t>=cue.end),
  musicalReason:decision.reason,decision,confidence:'SHA-bound original PCM energy and model vocal/novelty evidence; semantic roles and human listening unverified',
  chorusSoloBuildDropLabels:'UNKNOWN: no certified semantic classifier'});
}
const report={baselineEarlyTransitions:rows.length,retained:rows.filter(r=>r.decision.allowed).length,
 scope:'Outgoing-content guard only; retaining a historical exit does not authorize incoming skips or runtime playback.',
 rejected:rows.filter(r=>!r.decision.allowed).length,reasonCounts:{},rows};
for(const r of rows)report.reasonCounts[r.musicalReason]=(report.reasonCounts[r.musicalReason]||0)+1;
fs.writeFileSync(arg('output','content-cuts.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,rows:undefined}));
