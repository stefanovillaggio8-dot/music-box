'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
const data=require('../audits/ste-factored-clean-20261123/recordings-native.json');
const renders=require('../audits/ste-factored-clean-20261123/new-pair-render.json');
const candidate=require('../audits/ste-factored-clean-20261123/new-pair-shadow.json');
const index=require('../dj-deep-analysis.json'),{build}=require('../tools/build-factored-clean-candidate.cjs');
const start=source.indexOf('function validateNativeCleanTailCue('),end=source.indexOf('function validateStructuralBeatCue(',start);
const validate=ios=>new Function('isIOS',source.slice(start,end)+'return validateNativeCleanTailCue;')(ios);
function fixture(){const r=structuredClone(candidate.record);return {r,p:r.cue,a:index.entries[candidate.from],b:index.entries[candidate.to]};}
test('factored original receipts build a shadow; declared native priming never becomes a seek or an iPhone cue',()=>{
 const f=fixture();assert.ok(validate(false)(f.r,f.p,f.a,f.b,f.a.duration));assert.equal(validate(true)(f.r,f.p,f.a,f.b,f.a.duration),null);
 const built=build(data,candidate,renders);assert.equal(built.notPlaybackCertified,true);assert.equal(built.record.cue.entry,0);
 f.p.nativeCleanEvidence.method='original-native-near-silent-tail-v1';
 assert.equal(validate(false)(f.r,f.p,f.a,f.b,f.a.duration),null,'V1 zero-target-clock requirement remains intact');
});
test('both original renders, covered native clocks and conservative per-channel quiet bounds are mandatory',()=>{
 const mutations=[e=>delete e.targetClock,e=>e.targetClock.sourceSha='f'.repeat(40),e=>e.targetClock.rawFrames++,
  e=>e.nativeMeasurements[0].targetDecodedDuration=.002,e=>e.nativeMeasurements[0].sourceMediaDuration=.002,
  e=>e.nativeMeasurements[0].targetMediaOffset=.023,e=>e.nativeMeasurements[0].channelRmsUpperBound=.000101,
  e=>e.nativeMeasurements[0].channelRmsUpperBound=0,e=>e.renderMeasurements.pop(),
  e=>e.renderMeasurements[0].sampleRate=48000,e=>e.renderMeasurements[0].oversampledPeak=1.001,
  e=>e.renderMeasurements[0].overlapPeak=.961,e=>e.renderMeasurements[0].sourceReadThrough-=.01,
  e=>e.renderMeasurements[0].sourceUnityThroughEof=false,e=>e.renderMeasurements[0].entry=.1,
  e=>e.renderMeasurements[0].sourceGain=.9,e=>e.renderMeasurements[0].eofLevelChangeDb=3.01,
  e=>e.renderMeasurements[0].introductionExposure.accepted=false];
 for(const mutate of mutations){const f=fixture();mutate(f.p.nativeCleanEvidence);assert.equal(validate(false)(f.r,f.p,f.a,f.b,f.a.duration),null,mutate.toString());}
});
test('actual planner preserves the separate natural class and never upgrades the new pair to full or partial',()=>{
 const text=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine}=new Function('require','__dirname',text.slice(0,text.indexOf('const tracks='))+'return {engine}')(require,path.join(root,'tools'));
 const f=fixture(),added={...f.a,structuralBeatPlans:{...f.a.structuralBeatPlans,[f.b.sha]:f.r}};
 const p=engine.playbackTransition(added,f.b,f.a.duration);assert.equal(p.nativeCleanTail,true);assert.equal(p.kind,'postlude');
 assert.equal(p.measuredFullBeat,false);assert.equal(p.metricalRhythmic,false);assert.equal(engine.fullBeatCueCertified(added,f.b,p),false);
});
