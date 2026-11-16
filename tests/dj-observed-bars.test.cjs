'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine,tracks}=new Function('require','__dirname',source.slice(0,source.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks}')(require,path.join(root,'tools'));
const entries=new Map(tracks);
function fixture(){
 const originalA=entries.get('audio/songs/track-166.mp3'),b=entries.get('audio/songs/track-181.mp3');
 const original=originalA.structuralBeatPlans[b.sha],p=structuredClone(original.cue);
 // Unit tests exercise receipt validation, not a measurement of a decoder.
 // Actual native receipts are produced separately by the CI matrix.
 p.composite.nativeDecoderProof={method:'actual-browser-decode-v1',assetSha256:p.composite.sha256,rates:{
  44100:{samplePeak:p.composite.resampledCommonProof.samplePeak,overlapPeak:p.composite.resampledCommonProof.oversampledOverlapPeak,browsers:['chromium','webkit']},
  48000:{samplePeak:p.composite.peak,overlapPeak:p.composite.oversampledOverlapPeak,browsers:['chromium','webkit']}}};
 const record={...original,cue:p,cues:[p]},a={...originalA,structuralBeatPlans:{...originalA.structuralBeatPlans,[b.sha]:record}};
 return {a,b,p,record,validate:q=>engine.validatePreservedFileTailCue(record,q,a,b,a.duration)};
}
test('late instrumental rhythm uses observed bars and remains explicitly partial with both recordings intact',()=>{
 const {a,b,p,validate}=fixture();assert.ok(validate(p));
 const plan=engine.transition(a,b,a.duration);assert.equal(plan.metricalPickupWindow,true);
 assert.equal(plan.measuredFullBeat,false);assert.equal(plan.metricalRhythmic,true);
 assert.equal(engine.desktopBeatPairCertified(a,b,plan),true);assert.equal(plan.entry,0);assert.equal(plan.end,a.duration);
 assert.equal(plan.composite.outgoingEnvelope,'unity-through-decoded-eof-v1');
 assert.equal(plan.composite.postRenderRhythm.firstHalfMatches,0,'non-rhythmic prefix cannot be counted as a full beatmatch');
 assert.ok(plan.composite.postRenderRhythm.rmsSeconds<=.02);
 assert.ok(Math.abs(plan.composite.levelContinuity.changeDb)<=3);
});
test('missing native/44.1 kHz evidence, drift, weak bars, volume jumps and content cuts invalidate the new partial',()=>{
 for(const mutate of [p=>delete p.composite.nativeDecoderProof,p=>p.composite.nativeDecoderProof.rates[44100].browsers=['webkit'],
  p=>delete p.composite.resampledCommonProof,p=>p.composite.resampledCommonProof.rhythm.rmsSeconds=.02001,
  p=>p.composite.postRenderRhythm.matches=7,p=>p.composite.postRenderRhythm.sharedPerBar[0]=1,
  p=>p.composite.postRenderRhythm.downbeatRmsSeconds=.02501,p=>p.structuralEvidence.sourceObservedDownbeats[0]-=.2,
  p=>p.structuralEvidence.metricalCertificate.gridMaximum=.05001,p=>p.structuralEvidence.metricalCertificate.observedSharedRms=.02001,
  p=>p.measuredFullBeat=true,p=>p.entry=.1,p=>p.end-=1,p=>p.sourceRate=.98,
  p=>p.composite.levelContinuity.changeDb=3.001,p=>p.composite.renderedEntrance='first-attack-033-v1',
  p=>p.composite.releaseSeconds=.9,p=>p.harmonicEvidence.keyConfidence=.699]){
  const {p,validate}=fixture();mutate(p);assert.equal(validate(p),null);
 }
});
