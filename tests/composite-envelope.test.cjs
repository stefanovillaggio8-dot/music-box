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


test('intact-file rendering reads every original sample through actual EOF and audits audible components',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(5.28*sr)).fill(.5))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.7))};
 const r=compositePCM(outgoing,incoming,cue),last=outgoing.channels[0].length-1;
 assert.ok(Math.abs(r.nativeHandoffAt-4.98)<.001);assert.equal(r.sourceReadThrough,36.98);
 assert.equal(r.components.outgoing[0][last],.5);assert.equal(r.components.outgoing[0][last+1],0);
 for(const i of [0,20000,last,last+1])assert.ok(Math.abs(r.channels[0][i]-r.audibleComponents.outgoing[0][i]-r.audibleComponents.incoming[0][i])<1e-7);
 assert.throws(()=>compositePCM(outgoing,incoming,{...cue,entry:1}),/Unbound intact/);
});


test('offline shared lookahead contains an isolated summed peak without attenuating the whole overlap',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>{
  const x=new Float32Array(Math.round(5.3*sr)).fill(.4);x.fill(.95,Math.round(2.3*sr),Math.round(2.31*sr));return x;
 })};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.6))};
 const constant=compositePCM(outgoing,incoming,cue),dynamic=compositePCM(outgoing,incoming,{...cue,renderGainMode:'lookahead'});
 assert.ok(dynamic.peak<=.999);assert.ok(dynamic.overlapPeak<=.961);
 assert.ok(dynamic.gainProof.meanOverlapReductionDb<-20*Math.log10(constant.headroom)-.5);
 assert.equal(dynamic.gainProof.firstGain,1);assert.equal(dynamic.gainProof.nativeRevealGain,1);
 assert.equal(dynamic.channels[0][Math.round(1.3*sr)],dynamic.components.outgoing[0][Math.round(1.3*sr)]+dynamic.components.incoming[0][Math.round(1.3*sr)]);
 outgoing.channels[0][0]=1.1;
 assert.throws(()=>compositePCM(outgoing,incoming,{...cue,renderGainMode:'lookahead'}),/native boundaries/);
});
