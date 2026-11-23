'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
const candidate=require('../audits/ste-classifier-evaluation-20261123/native-element-shadow.json');
const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
const start=source.indexOf('function validateNativeCleanTailCue('),end=source.indexOf('function validateStructuralBeatCue(',start);
const validate=ios=>new Function('isIOS',source.slice(start,end)+'return validateNativeCleanTailCue;')(ios);
function fixture(){const record=structuredClone(candidate.record);return {record,p:record.cue,a:index.entries[candidate.from],b:index.entries[candidate.to]};}
test('a distinct natural class requires both native platforms, original speed, original entry and near-silent intact source',()=>{
 const {record,p,a,b}=fixture();assert.ok(validate(false)(record,p,a,b,a.duration));
 assert.equal(validate(true)(record,p,a,b,a.duration),null,'iPhone remains on existing safe playback');
 const mutations=[p=>p.entry=.1,p=>p.tempo=1.001,p=>p.gain=.9,p=>p.kind='beat',p=>p.measuredFullBeat=true,
  p=>p.end-=.1,p=>p.begin=NaN,p=>delete p.nativeCleanEvidence.begin,p=>p.composite={},
  p=>p.nativeCleanEvidence.nativeMeasurements.pop(),p=>p.nativeCleanEvidence.nativeMeasurements[0].platform='darwin',
  p=>p.nativeCleanEvidence.nativeMeasurements[0].sourceTailRmsMax=.000101,
  p=>p.nativeCleanEvidence.nativeMeasurements[0].sourceTailPeak=.0011,
  p=>p.nativeCleanEvidence.nativeMeasurements[0].targetNativeOverlapPeak=.961,
  p=>p.nativeCleanEvidence.nativeMeasurements[0].targetMediaOffset=.024,
  p=>p.nativeCleanEvidence.noDecoderSplice=false,p=>p.nativeCleanEvidence.eofLevelChangeDb=3.1,
  p=>p.nativeCleanEvidence.introductionExposure.accepted=false,p=>p.nativeCleanEvidence.sourceClock.sourceSha='f'.repeat(40)];
 for(const mutate of mutations){const f=fixture();mutate(f.p);assert.equal(validate(false)(f.record,f.p,f.a,f.b,f.a.duration),null,mutate.toString());}
});
test('actual planner adds only the native clean shadow case while preserving the existing full and partial classes',()=>{
 const text=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine}=new Function('require','__dirname',text.slice(0,text.indexOf('const tracks='))+'return {engine}')(require,path.join(root,'tools'));
 const {a,b,record}=fixture();assert.equal(engine.playbackTransition(a,b,a.duration),null);
 const added={...a,structuralBeatPlans:{...a.structuralBeatPlans,[b.sha]:record}};
 const cue=engine.playbackTransition(added,b,a.duration);assert.equal(cue.nativeCleanTail,true);assert.equal(cue.kind,'postlude');
 assert.equal(engine.fullBeatCueCertified(added,b,cue),false);assert.equal(cue.measuredFullBeat,false);assert.equal(cue.metricalRhythmic,false);
 const original=[['audio/songs/track-705.mp3','audio/songs/track-50.mp3',true],['audio/songs/track-4.mp3','audio/songs/track-38.mp3',false]];
 for(const [from,to,full] of original){const x=engine.withGuardedLRC(engine.verifiedIndexedGridTempo(index.entries[from])),y=engine.withGuardedLRC(engine.verifiedIndexedGridTempo(index.entries[to]));const p=engine.playbackTransition(x,y,x.duration);assert.equal(p.measuredFullBeat,full);assert.equal(p.metricalRhythmic,!full);assert.equal(p.entry,0);}
});
test('the native-only path aborts on queue changes and seeks without pausing the outgoing song or starting an intro',async()=>{
 const a=source.indexOf('function beginNativeCleanTail('),b=source.indexOf('// The normal Music Box EOF path',a);
 const make=new Function('source',`
  const isIOS=false,document={hidden:false},window={MusicBoxCompositeMix:{nativeClockOffset:()=>0}};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));let active=null,mixing=false,aborted=0;
  const timers=[],setTimeout=f=>(timers.push(f),timers.length),performance={now:()=>0};
  const handlers=new Map(),old={paused:false,seeking:false,currentTime:97,duration:100,
   addEventListener:(event,f)=>handlers.set(event,f),removeEventListener:(event)=>handlers.delete(event)};
  const incoming={paused:true,seeking:false,currentTime:0,readyState:4,volume:0,play(){this.paused=false;return Promise.resolve()}};
  let target=2;const app={mixAdoptHandoff:()=>true,currentId:()=>1,mixNext:()=>({id:target}),audio:()=>old,volume:()=>1,mixSourceMatches:()=>true};
  let prepared={ready:true,id:2,fromId:1,naturalEntry:0,audio:incoming};
  function cancel(){aborted++;active?.cleanup?.();active=null;mixing=false;incoming.paused=true}
  function handoff(){throw Error('Should not hand off before EOF')}
  eval(source+';');
  return {start:()=>beginNativeCleanTail(app,old,{id:2},{begin:99,nativeCleanEvidence:{sourceClock:{}},sourceSha:'a'}),
   changeQueue:()=>target=3,step:()=>timers.shift()?.(),seek:()=>handlers.get('seeking')?.(),
   state:()=>({aborted,oldPaused:old.paused,incomingPaused:incoming.paused,handlers:handlers.size})};
 `);
 for(const action of ['changeQueue','seek']){const f=make(source.slice(a,b));assert.equal(f.start(),true);f[action]();f.step();await Promise.resolve();assert.deepEqual(f.state(),{aborted:1,oldPaused:false,incomingPaused:true,handlers:0});}
});
