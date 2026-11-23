'use strict';
// Evaluate archived observations only. This is NOT a playback certificate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),packet=JSON.parse(fs.readFileSync(path.join(__dirname,'experiment.json')));
const {currentSteScope,validateSteCases}=require(path.join(root,'tools/ste-research-scope.cjs'));
const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
validateSteCases(packet.cases,currentSteScope(),index);
let source=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
assert.equal(source.split('return {playbackTransition,').length,2);
source=source.replace('return {playbackTransition,','return {focusedChroma,camelotEstimate,camelotMatch,playbackTransition,');
// Stop BEFORE global catalog preparation; no pair campaign is executed.
const {engine}=new Function('require','__dirname',source.slice(0,source.indexOf('const tracks='))+'return {engine}')(require,path.join(root,'tools'));
const file=process.argv.find(a=>a.startsWith('--features='))?.slice(11),data=file?JSON.parse(fs.readFileSync(file)):packet.observations;
const pre=packet.preflight.reverse,{begin,fade,rate}=pre.geometry;
assert.equal(data.rows.length,2);
for(const role of ['source','target']){
 const row=data.rows.find(r=>r.role===role);assert.ok(row);
 assert.equal(row.key,role==='source'?pre.from:pre.to,'Only the frozen reverse Ste pair may be evaluated');
 assert.equal(row.channels.length,2);
}
const mean=rows=>Array.from({length:12},(_,i)=>rows.reduce((s,r)=>s+r.notes[i],0)/rows.length);
const normalize=notes=>{const x=engine.focusedChroma(notes),sum=x.reduce((s,n)=>s+n,0);return x.map(n=>n/sum)};
const rough=x=>x.reduce((s,n,p)=>s+n*(x[(p+1)%12]+x[(p+11)%12]+.5*x[(p+6)%12]),0),results=[];
for(const row of data.rows)assert.equal(index.entries[row.key].sha,row.sha,'Current original identity must match');
for(let c=0;c<2;c++){
 const a=data.rows.find(r=>r.role==='source').channels[c],b=data.rows.find(r=>r.role==='target').channels[c];
 const sourceKey=engine.camelotEstimate(mean(a.harmony)),targetKey=engine.camelotEstimate(mean(b.harmony));
 const frame=a.harmony.map((r,i)=>{const x=normalize(r.notes),y=normalize(b.harmony[i].notes),clash=x.reduce((s,n,p)=>s+n*(y[(p+1)%12]+y[(p+11)%12]+.5*y[(p+6)%12]),0);return {clash,excess:clash-Math.max(rough(x),rough(y))}});
 results.push({channel:c,sourceKey,targetKey,keyRelation:engine.camelotMatch({camelot:sourceKey},{camelot:targetKey}),
  rawMax:Math.max(...frame.map(r=>r.clash)),excessMax:Math.max(...frame.map(r=>r.excess)),
  meaningfulPairedFrames:a.harmony.filter((r,i)=>r.rms>=.005&&b.harmony[i].rms>=.005).length,
  fullHarmony:engine.pcmFullHarmony(a,b,begin,0,rate,fade),tailHarmony:engine.pcmPreservedTailHarmony(a,b,begin,rate,fade,'vocal-handoff-foreground-v1',pre.handoff.at)});
}
const accepted=results.every(r=>r.sourceKey?.confidence>=.7&&r.targetKey?.confidence>=.7&&r.keyRelation.score>=.92&&r.rawMax<=.45&&r.excessMax<=.05&&r.meaningfulPairedFrames>=6&&(r.fullHarmony||r.tailHarmony))&&results[0].sourceKey.code===results[1].sourceKey.code&&results[0].targetKey.code===results[1].targetKey.code;
assert.equal(accepted,false,'The archived experiment was rejected; investigate changed evidence rather than silently promoting it');
console.log(JSON.stringify({accepted,newCertifiedPairs:0,results},null,2));
