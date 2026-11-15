#!/usr/bin/env node
'use strict';
// Evaluation only: human word boundaries may diagnose missing observations,
// but must never become inputs to the player or its acceptance decisions.
const fs=require('node:fs'),crypto=require('node:crypto');
const {referenceWordLines,referenceForLine}=require('./karaoke-reference-lines.cjs');
const arg=(k,d)=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const refs=read(arg('references','references.json'));
const files=['baseline','alternative','additional'].map(k=>arg(k,'')).filter(Boolean);
if(files.length!==3)throw Error('Provide the original 28, 14 and 7 second reports');
const reports=files.map(read),replay=read(arg('replay','context-replay.json'));
const norm=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const totals=()=>({words:0,noNearbyExactObservation:0,nearbyExactObservation:0,
 anyObservationWithin100msAtBothBoundaries:0,consensusWithin60msButWrongOver250ms:0});
const groups={all:totals(),shortAtMostTwoCharacters:totals(),repeatedInPhrase:totals()};
const cases=[];
for(const c of reports[0].cases){
 const ref=refs.find(r=>r.name===c.record);
 if(!ref||ref.audioSha256&&ref.audioSha256!==c.sourceAudioSha256)throw Error('Reference identity mismatch');
 const words=[],wordLines=referenceWordLines(ref);
 for(const line of ref.lines.filter(l=>l.start>=c.start+.15&&l.start<c.start+26.9&&l.end<c.start+27.96)){
  const w=referenceForLine(ref,wordLines,line),tokens=line.text.match(/\S+\s*/gu)||[];
  if(tokens.length!==w.length||tokens.some((t,i)=>norm(t)!==norm(w[i].text)))continue;
  for(const word of w)words.push({...word,repeated:w.filter(v=>norm(v.text)===norm(word.text)).length>1});
 }
 const observed=[];
 for(let i=0;i<files.length;i++){
  const report=reports[i],other=report.cases.find(r=>r.id===c.id);
  if(other?.sourceAudioSha256!==c.sourceAudioSha256)throw Error('ASR identity mismatch');
  const stamp=crypto.createHash('sha256').update(JSON.stringify(report.inference)).digest('hex').slice(0,12);
  const cache=files[i]+'.'+stamp+'.'+c.id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.asr.json';
  const contextSeconds=report.inference.experimentalContext?.seconds||28;
  for(const w of read(cache)){
   if(!Array.isArray(w.timestamp)||!w.timestamp.every(Number.isFinite)||w.timestamp[1]<=w.timestamp[0])continue;
   observed.push({word:norm(w.text),start:c.start+w.timestamp[0],end:c.start+w.timestamp[1],
    context:contextSeconds+':'+Math.floor(w.timestamp[0]/contextSeconds)});
  }
 }
 const local=totals();
 for(const w of words){
  const matches=observed.filter(v=>v.word===norm(w.text)&&Math.abs(v.start-w.start)<=.75);
  const accurate=matches.some(v=>Math.abs(v.start-w.start)<=.1&&Math.abs(v.end-w.end)<=.1);
  // This deliberately generous diagnostic can match a nearby repeat. It is
  // an upper bound, not WER, proof of word identity or an acceptance rule.
  const wrongStable=matches.some((v,i)=>matches.slice(i+1).some(u=>u.context!==v.context&&
   Math.abs(v.start-u.start)<=.06&&Math.abs(v.end-u.end)<=.06&&
   Math.max(Math.abs(v.start-w.start),Math.abs(v.end-w.end))>.25&&
   Math.max(Math.abs(u.start-w.start),Math.abs(u.end-w.end))>.25));
  const targets=[local,groups.all,...(norm(w.text).length<=2?[groups.shortAtMostTwoCharacters]:[]),
   ...(w.repeated?[groups.repeatedInPhrase]:[])];
  for(const t of targets){t.words++;t[matches.length?'nearbyExactObservation':'noNearbyExactObservation']++;
   if(accurate)t.anyObservationWithin100msAtBothBoundaries++;
   if(wrongStable)t.consensusWithin60msButWrongOver250ms++;}
 }
 if(words.length!==replay.cases.find(x=>x.id===c.id)?.referenceWords)throw Error('Reference denominator drift');
 const accepted=replay.cases.find(x=>x.id===c.id);
 cases.push({id:c.id,category:c.category,...local,acceptedWords:accepted?.acceptedWords??null,
  worstAcceptedBoundaryErrorMs:Math.max(0,...(accepted?.errors||[]).flatMap(e=>[Math.abs(e.startErrorMs),Math.abs(e.endErrorMs)]))});
}
const result={method:'evaluation-only-observation-upper-bound-v1',sourceReports:files.map((f,i)=>({file:f.split(/[\\/]/).at(-1),
 sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),inference:reports[i].inference})),
 limits:['Human word boundaries are evaluation inputs only; never shipped as observed timestamps.',
 'Exact normalized lexical match within 750ms is a generous upper bound, not WER or occurrence certification.',
 'One observation within 100ms does not establish safe automatic selection among competing observations.',
 'Contexts can share correlated recognizer mistakes; agreement is not independent musical truth.'],
 groups,cases,acceptedReplayAggregate:replay.aggregate,productionChanged:false};
fs.writeFileSync(arg('output','observation-diagnosis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(groups));
