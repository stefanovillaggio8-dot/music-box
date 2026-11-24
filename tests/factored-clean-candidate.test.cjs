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
test('native runtime recognizes declared raw metadata and cancels stale preparation without moving the incoming clock',async()=>{
 const a=source.indexOf('function nativeCleanLaunchLimit('),b=source.indexOf('// The normal Music Box EOF path',a);
 const {clockOffset}=require('../tools/factored-native-clean.cjs');
 const make=new Function('snippet','cue','clockOffset',`
  const isIOS=false,document={hidden:false},window={MusicBoxCompositeMix:{nativeClockOffset:(c,sha,d)=>c?.sourceSha===sha?clockOffset(c,d):null}};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let active=null,mixing=false,aborted=0,plays=0,seeks=0,target=2;
  const timers=[],setTimeout=f=>(timers.push(f),timers.length),performance={now:()=>0},handlers=new Map();
  const old={paused:false,seeking:false,currentTime:cue.begin-2,duration:cue.nativeCleanEvidence.sourceClock.decodedFrames/cue.nativeCleanEvidence.sourceClock.sampleRate,
   addEventListener:(e,f)=>handlers.set(e,f),removeEventListener:e=>handlers.delete(e)};
  const c=cue.nativeCleanEvidence.targetClock;
  const incoming={paused:true,seeking:false,duration:c.rawFrames/c.sampleRate,readyState:4,
   get currentTime(){return 0},set currentTime(v){seeks++},play(){plays++;this.paused=false;return Promise.resolve()}};
  const app={mixAdoptHandoff:()=>true,currentId:()=>1,mixNext:()=>({id:target}),audio:()=>old,volume:()=>1,mixSourceMatches:()=>true};
  let prepared={ready:true,id:2,fromId:1,naturalEntry:0,audio:incoming};
  function cancel(){aborted++;active?.cleanup?.();active=null;mixing=false;incoming.paused=true}
  function handoff(){throw Error('Unexpected early handoff')}
  eval(snippet);
  return {start:()=>beginNativeCleanTail(app,old,{id:2},cue),step:()=>{old.currentTime=cue.begin;timers.shift()?.()},
   badMetadata:()=>incoming.duration=.002,badSourceMetadata:()=>old.duration=.002,changeQueue:()=>target=3,hide:()=>document.hidden=true,
   seek:()=>handlers.get('seeking')?.(),pause:()=>{old.paused=true;handlers.get('pause')?.()},
   state:()=>({plays,seeks,aborted,incomingPaused:incoming.paused,sourcePaused:old.paused})};
 `);
 const create=()=>make(source.slice(a,b),structuredClone(candidate.record.cue),clockOffset);
 const pending=create();pending.badMetadata();assert.equal(pending.start(),false);assert.equal(pending.state().plays,0);
 const success=create();assert.equal(success.start(),true);success.step();await Promise.resolve();
 assert.deepEqual(success.state(),{plays:1,seeks:0,aborted:0,incomingPaused:false,sourcePaused:false});success.seek();
 for(const action of ['badMetadata','badSourceMetadata','changeQueue','hide','seek','pause']){
  const f=create();assert.equal(f.start(),true);f[action]();f.step();await Promise.resolve();
  const state=f.state();assert.equal(state.plays,0,action);assert.equal(state.seeks,0);assert.equal(state.aborted,1);assert.equal(state.incomingPaused,true);
  assert.equal(state.sourcePaused,action==='pause');
 }
});
