'use strict';
const test=require('node:test'),assert=require('node:assert/strict');

test('a partial metrical pickup preserves source samples and completes its smooth reveal before native adoption',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0,
  measuredFullBeat:false,metricalRhythmic:true,metricalPickupWindow:true,preservedEntrance:'metrical-pickup-033-v1',renderReleaseSeconds:1.5};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(5.3*sr)).fill(.2))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.3))};
 const r=compositePCM(outgoing,incoming,cue),sample=t=>r.components.incoming[0][Math.round((t+.3)*sr)];
 assert.ok(Math.abs(sample(4.9)-.099)<1e-6);assert.ok(sample(5.5)<.16);
 assert.ok(Math.abs(sample(6.5)-.3)<1e-6);assert.ok(r.nativeRevealAt>=6.5);
 assert.equal(r.outgoingEnvelope,'unity-through-decoded-eof-v1');
 assert.ok(Math.abs(r.components.outgoing[0][Math.round(5.29*sr)]-.2)<1e-6);
 assert.throws(()=>compositePCM(outgoing,incoming,{...cue,measuredFullBeat:true}),/pickup envelope/);
});

test('a measured vocal gap brings the incoming voice to native level before EOF without a final level reset',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0,
  preservedEntrance:'vocal-handoff-foreground-v1',structuralEvidence:{vocalOverlapPolicy:'separated-vocal-handoff-v1',vocalHandoff:{at:2.5}}};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(5.3*sr)).fill(.2))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.3))};
 const r=compositePCM(outgoing,incoming,cue),sample=t=>r.components.incoming[0][Math.round((t+.3)*sr)];
 assert.ok(Math.abs(sample(1)-.3*.33)<1e-6);assert.ok(Math.abs(sample(3)-.3)<1e-6);
 assert.ok(Math.abs(sample(5.01)-sample(4.99))<1e-6,'incoming level cannot fall back to one third at EOF');
 assert.equal(r.outgoingEnvelope,'unity-through-decoded-eof-v1');assert.ok(r.peak<.999);
 assert.throws(()=>compositePCM(outgoing,incoming,{...cue,structuralEvidence:{}}),/foreground envelope/);
});

test('reconstructed peak bounds reserve smooth shared headroom without moving native boundaries',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0,renderGainMode:'lookahead'};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(5.3*sr)).fill(.3))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.3))};
 const ordinary=compositePCM(outgoing,incoming,cue),bounds=new Float32Array(ordinary.channels[0].length);
 bounds[Math.round(2.3*sr)]=1.2;
 const safe=compositePCM(outgoing,incoming,cue,{truePeakBounds:bounds});
 assert.equal(safe.gainProof.truePeakLookahead,true);assert.ok(safe.headroom<ordinary.headroom);
 assert.equal(safe.gainProof.firstGain,1);assert.equal(safe.gainProof.nativeRevealGain,1);
 assert.equal(safe.nativeHandoffAt,ordinary.nativeHandoffAt);assert.equal(safe.sourceReadThrough,ordinary.sourceReadThrough);
 assert.deepEqual(safe.channels[0],safe.channels[1]);assert.ok(safe.peak<=.999);
 assert.throws(()=>compositePCM(outgoing,incoming,cue,{truePeakBounds:new Float32Array(10)}),/true-peak bounds/);
});
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

test('the intact entrance retains the first drum attack without fading the outgoing recording',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(5.3*sr)).fill(.2))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.3))};
 const slow=compositePCM(outgoing,incoming,cue),attack=compositePCM(outgoing,incoming,{...cue,preservedEntrance:'first-attack-033-v1'});
 const first=Math.round((.3+.016)*sr),last=outgoing.channels[0].length-1;
 assert.ok(Math.abs(attack.components.incoming[0][first]-.3*.33)<1e-7);
 assert.ok(attack.components.incoming[0][first]>20*slow.components.incoming[0][first]);
 assert.equal(attack.components.outgoing[0][first],Math.fround(.2));
 assert.equal(attack.components.outgoing[0][last],Math.fround(.2));
 assert.equal(attack.components.outgoing[0][last+1],0);
 assert.equal(attack.components.incoming[0][Math.round(.3*sr)],0);
 assert.ok(attack.peak<=.999&&attack.overlapPeak<=.961);
});

test('lookahead reserves numerical headroom for a hot original transient while keeping the final peak guard unchanged',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0,renderGainMode:'lookahead'};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>{const x=new Float32Array(Math.round(5.3*sr)).fill(.4);x.fill(1.3285365,1200,1210);return x;})};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*10).fill(.2))};
 const result=compositePCM(outgoing,incoming,cue);
 assert.ok(result.peak<=.999);assert.ok(result.overlapPeak<=.961);
 assert.equal(result.gainProof.firstGain,1);assert.equal(result.gainProof.nativeRevealGain,1);
 assert.equal(result.components.outgoing[0][1200],Math.fround(1.3285365),'original transient is preserved before shared safety gain');
});

test('a protected rhythmic decay promotes the new song before EOF without dropping the original tail',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000;
 const cue={begin:32,entry:0,fade:7.5,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,
  preserveTail:true,vocalFadeSeconds:0,rhythmicTailWindow:true,measuredFullBeat:false,metricalRhythmic:true,
  preservedEntrance:'rhythmic-tail-foreground-v1',structuralEvidence:{rhythmicWindow:{seconds:5}}};
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(7.8*sr)).fill(.05))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>new Float32Array(sr*12).fill(.3))};
 const result=compositePCM(outgoing,incoming,cue),at=Math.round((.3+5.7)*sr),last=outgoing.channels[0].length-1;
 assert.equal(result.components.incoming[0][at],Math.fround(.3));
 assert.equal(result.components.outgoing[0][at],Math.fround(.05));assert.equal(result.components.outgoing[0][last],Math.fround(.05));
 assert.equal(result.components.incoming[0][last],result.components.incoming[0][last+1]);
 assert.throws(()=>compositePCM(outgoing,incoming,{...cue,measuredFullBeat:true}),/Unbound rhythmic tail/);
});
