'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function cue(){return {begin:32,end:48.2,entry:0,fade:16.2,tempo:1,structuralBeat:true,preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,vocalFadeSeconds:0,
 measuredFullBeat:false,metricalRhythmic:true,metricalPickupWindow:true,nativeOriginalReturn:true,metricalCadenceWindow:true,
 nativeRecoveryCurve:'sine-1.2-v1',preservedEntrance:'metrical-pickup-033-v1',renderReleaseSeconds:1.2,targetSha:'a'.repeat(40),
 structuralEvidence:{bars:4,sourcePhaseConfidence:.99,targetPhaseConfidence:.99,sourceModelDownbeats:[33,36.25,39.5,42.75,46],targetModelDownbeats:[1,4.25,7.5,10.75,14],
 cadenceWindow:{method:'four-observed-bars-and-preserved-decay-v1',sourceStart:33,sourceEnd:46,targetStart:1,targetEnd:14,rhythmicSeconds:14.75,tailSeconds:1.45}}};}
test('the extended duration needs four anchored bars and an explicitly bounded preserved decay',async()=>{
 const {cadenceSpanValid}=await import('../audio-stretch-core.mjs');assert.equal(cadenceSpanValid(cue()),true);
 for(const mutate of [p=>p.measuredFullBeat=true,p=>p.entry=.1,p=>p.fade=18.01,p=>p.structuralEvidence.bars=3,
  p=>p.nativeRecoveryCurve='other',p=>p.structuralEvidence.sourcePhaseConfidence=.79,p=>p.structuralEvidence.cadenceWindow.targetStart=8.1,
  p=>p.structuralEvidence.cadenceWindow.tailSeconds=4.1,p=>p.structuralEvidence.sourceModelDownbeats[4]+=.1]){
  const p=cue();mutate(p);assert.equal(cadenceSpanValid(p),false);
 }
});
test('cadence recovery keeps the outgoing EOF and restores original PCM before native reveal',async()=>{
 const {compositePCM}=await import('../audio-composite-core.mjs'),sr=8000,p=cue();
 const outgoing={rate:sr,start:31.7,channels:[0,1].map(()=>new Float32Array(Math.round(16.5*sr)).fill(.2))};
 const incoming={rate:sr,start:0,channels:[0,1].map(()=>Float32Array.from({length:sr*24},(_,i)=>.15*Math.sin(i/sr*1234)))};
 const r=compositePCM(outgoing,incoming,p);
 assert.equal(r.outgoingEnvelope,'unity-through-decoded-eof-v1');assert.equal(r.nativeSplice.maximumLast100msDifference,0);
 assert.ok(r.nativeSplice.returnEnd<=r.nativeRevealAt-.3);assert.equal(r.releaseSeconds,1.2);
 assert.equal(r.components.outgoing[0][Math.round(16.49*sr)],Math.fround(.2));
 assert.throws(()=>compositePCM(outgoing,incoming,{...p,renderReleaseSeconds:1.5}),/cadence release/);
 assert.throws(()=>compositePCM(outgoing,incoming,{...p,metricalCadenceWindow:false}),/Invalid stereo source/);
});
test('the original-source cadence cannot authorize playback without its native clock and decoder receipts',()=>{
 const source=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine,tracks}=new Function('require','__dirname',source.slice(0,source.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks}')(require,path.join(root,'tools'));
 const entries=new Map(tracks),a=structuredClone(entries.get('audio/songs/track-6.mp3')),b=entries.get('audio/songs/track-233.mp3');
 const record=a.structuralBeatPlans[b.sha],p=record.cue;assert.equal(p.metricalCadenceWindow,true);
 delete p.composite.nativeDecoderProof;
 assert.equal(engine.validatePreservedFileTailCue(record,p,a,b,a.duration),null);
});
test('the installed cadence stays partial and rejects missing stereo tail evidence, clocks and level jumps',()=>{
 const source=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine,tracks}=new Function('require','__dirname',source.slice(0,source.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks}')(require,path.join(root,'tools'));
 const entries=new Map(tracks),original=entries.get('audio/songs/track-6.mp3'),b=entries.get('audio/songs/track-233.mp3');
 const selected=engine.transition(original,b,original.duration);
 assert.equal(selected.metricalCadenceWindow,true);assert.equal(selected.measuredFullBeat,false);assert.equal(selected.metricalRhythmic,true);
 assert.equal(selected.entry,0);assert.equal(selected.end,original.duration);assert.ok(selected.composite.postRenderRhythm.rmsSeconds<=.020);
 assert.equal(engine.desktopBeatPairCertified(original,b,selected),true);
 for(const mutate of [p=>delete p.composite.nativeSplice,p=>delete p.composite.nativeDecoderProof.rates[44100].sourceClockProof,
  p=>p.composite.nativeDecoderProof.rates[48000].sourceClockProof.sourceSha='a'.repeat(40),
  p=>p.composite.nativeDecoderProof.rates[48000].sourceClockProof.decodedOffsets=[.01],
  p=>delete p.structuralEvidence.cadenceWindow,p=>p.structuralEvidence.cadenceWindow.targetStart+=.1,
  p=>delete p.composite.cadenceTailProof.at44100,p=>p.composite.cadenceTailProof.at48000.channelProofs.pop(),
  p=>p.composite.cadenceTailProof.at44100.channelProofs[1].maximumTailOnset=.25,
  p=>p.composite.cadenceTailProof.at48000.channelProofs[0].maximumRelativeRms=.5001,
  p=>p.composite.cadenceTailProof.at48000.channelProofs[0].sampleRate=44100,
  p=>p.composite.levelContinuity.changeDb=-3.0001,p=>p.composite.releaseSeconds=1.5,
  p=>p.nativeRecoveryCurve='smooth',p=>p.measuredFullBeat=true,p=>p.entry=.1,p=>p.end-=.2]){
  const a=structuredClone(original),r=a.structuralBeatPlans[b.sha],p=r.cue;mutate(p);
  assert.equal(engine.validatePreservedFileTailCue(r,p,a,b,a.duration),null);
 }
});
