'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('mix-intelligente.js','utf8');
const helper=code.slice(code.indexOf('function nativeCleanLaunchLimit('),code.indexOf('function beginNativeCleanTail('));
const limit=new Function(helper+'return nativeCleanLaunchLimit')();
const saved=require('../audits/ste-classifier-evaluation-20261123/native-element-shadow.json').record.cue;
function fixture(){return structuredClone(saved)}
test('a late clean launch is bounded by actually meaningful original prefix and independently quiet native source',()=>{
 const p=fixture(),at=limit(p);assert.ok(at>p.begin+.3&&at<p.end-1.5);
 const through=p.nativeCleanEvidence.introductionExposure.rows.filter(r=>r.at+.25<=p.end-at-.1+1e-6&&r.originalRms>=.001).length*.25;
 assert.ok(through>=.75);assert.equal(p.tempo,1);assert.equal(p.entry,0);
});
test('rhythmic, altered, incomplete and insufficient evidence never expands the legacy 80ms launch bound',()=>{
 const mutations=[p=>p.nativeCleanTail=false,p=>p.measuredFullBeat=true,p=>p.metricalRhythmic=true,p=>p.entry=.1,p=>p.tempo=1.01,
  p=>p.nativeCleanEvidence.sourceSha='f'.repeat(40),p=>p.nativeCleanEvidence.introductionExposure.targetSha='f'.repeat(40),
  p=>p.nativeCleanEvidence.sourceUnityThroughEOF=false,p=>p.nativeCleanEvidence.incomingUnityFromZero=false,
  p=>p.nativeCleanEvidence.nativeMeasurements.pop(),p=>p.nativeCleanEvidence.nativeMeasurements[0].rate=96000,
  p=>p.nativeCleanEvidence.nativeMeasurements[0].sourceTailPeak=.00101,p=>p.nativeCleanEvidence.nativeMeasurements[0].sourceTailRmsMax=.0001,
  p=>p.nativeCleanEvidence.nativeMeasurements[0].targetNativeOverlapPeak=.96,
  p=>p.nativeCleanEvidence.introductionExposure.rows.forEach(r=>r.originalRms=0),
  p=>p.nativeCleanEvidence.introductionExposure.rows[0].at=.25,
  p=>p.nativeCleanEvidence.introductionExposure.rows[0].originalAt=.02,
  p=>p.nativeCleanEvidence.introductionExposure.rows[0].obscured=true];
 for(const mutate of mutations){const p=fixture();mutate(p);assert.equal(limit(p),p.begin+.08,mutate.toString())}
});
test('the actual native controller survives a delayed tick only inside the proven clean interval',async()=>{
 const body=code.slice(code.indexOf('function nativeCleanLaunchLimit('),code.indexOf('// The normal Music Box EOF path',code.indexOf('function nativeCleanLaunchLimit(')));
 const make=new Function('body','cue',`
 const isIOS=false,document={hidden:false},clamp=(x,a,b)=>Math.max(a,Math.min(b,x));let known=true;
 const window={MusicBoxCompositeMix:{nativeClockOffset:()=>known?0:null},MusicBoxRoom:{isActive:()=>false}};
 let active=null,mixing=false,plays=0,cancels=0;const timers=[],setTimeout=f=>(timers.push(f),timers.length),performance={now:()=>0};
 const old={currentTime:cue.begin-1,duration:cue.end,paused:false,seeking:false,ended:false,addEventListener(){},removeEventListener(){}};
 const incoming={currentTime:0,duration:cue.targetDuration,paused:true,seeking:false,readyState:4,play(){plays++;this.paused=false;return Promise.resolve()}};
 let prepared={ready:true,failed:false,id:2,fromId:1,naturalEntry:0,audio:incoming};
 const app={audio:()=>old,currentId:()=>1,mixNext:()=>({id:2}),mixAdoptHandoff(){},mixSourceMatches:()=>true,volume:()=>1};
 const cancel=()=>{cancels++;active=null;mixing=false},handoff=()=>{throw Error('No early EOF')};eval(body+';');
 return {arm:()=>beginNativeCleanTail(app,old,{id:2},cue),step:at=>{old.currentTime=at;timers.shift()?.()},unknown:()=>known=false,state:()=>({plays,cancels,sourceAt:old.currentTime})};`);
 const p=fixture(),good=make(body,p);assert.equal(good.arm(),true);good.step(p.begin+.3);await Promise.resolve();assert.equal(good.state().plays,1);assert.equal(good.state().cancels,0);
 const late=make(body,fixture());assert.equal(late.arm(),true);late.step(limit(p)+.01);assert.equal(late.state().plays,0);assert.equal(late.state().cancels,1);
 const unknown=make(body,fixture());assert.equal(unknown.arm(),true);unknown.unknown();unknown.step(p.begin+.1);assert.equal(unknown.state().plays,0);assert.equal(unknown.state().cancels,1);
});
