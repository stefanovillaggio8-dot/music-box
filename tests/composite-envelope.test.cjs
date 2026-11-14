'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('a longer measured gain entrance recovers a hot transient without changing the vocal fade or clipping criteria',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000,fade=5;
 const cue={begin:32,entry:10,fade,tempo:1,structuralBeat:true,vocalFadeSeconds:.4};
 const outgoing={rate:sr,start:31.1,channels:[0,1].map(()=>{
  const data=new Float32Array(sr*6).fill(.9);
  for(let i=0;i<data.length;i++){const t=i/sr-.9;if(t>-.24&&t<-.18)data[i]=1.08;}return data;
 })};
 const incoming={rate:sr,start:9.2,channels:[0,1].map(()=>new Float32Array(sr*11).fill(.9))};
 assert.throws(()=>compositePCM(outgoing,incoming,cue),/safe peak/);
 const result=compositePCM(outgoing,incoming,{...cue,renderPreRoll:.9,renderReleaseSeconds:1.5});
 assert.ok(result.peak<=.999);assert.ok(result.overlapPeak<=.961);assert.equal(result.envelopeVersion,3);
 assert.equal(result.nativeRevealAt,6.65);assert.equal(result.components.outgoing[0][Math.round((.9+3)*sr)],Math.fround(.9));
 assert.equal(result.components.outgoing[0][Math.round((.9+5)*sr)],0);
 // A peak at the very start still cannot be hidden by the longer ramp.
 for(const channel of outgoing.channels)channel[0]=1.08;
 assert.throws(()=>compositePCM(outgoing,incoming,{...cue,renderPreRoll:.9,renderReleaseSeconds:1.5}),/safe peak/);
});
