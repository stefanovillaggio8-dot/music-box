"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const start=source.indexOf("async function intelligentShuffle(app,audio,fromId){");
const end=source.indexOf("let shuffleBusy=",start);
assert.ok(start>0&&end>start,"extract complete shuffle picker");

function fixture(options={}){
 const old={id:1,url:"old",analysis:{
  duration:100,bpm:120,beatConfidence:.65,introDrive:.85,level:.2,
  last:100,protectedEnding:false,...options.old
 }};
 const pool=(options.pool||[]).map((spec,i)=>({
  id:i+2,url:"next"+(i+2),analysis:{
   duration:110,bpm:120,beatConfidence:.65,introDrive:.80,level:.2,
   ...spec.analysis, cue:spec.cue
  }
 }));
 let selected=null;
 const app={
  currentId:()=>1,allTracks:()=>[old,...pool],
  mixShuffleCandidates:()=>options.manual?[]:pool.slice(0,2),
  mixShufflePool:()=>pool,
  mixSelectShuffle:arg=>{selected=arg;return true},
  mixUrl:t=>t.url,mixLyricCues:()=>null
 };
 const ctx={
  app,pool,old,selected:()=>selected,
  voiceScore:()=>({score:.85}),
  harmonyScore:()=>({focused:.82,phrase:.81}),
 };
 const shim=[
  "const enabled=true,isIOS=false,window={MusicBoxRoom:{isActive:()=>false}};",
  "const cache=new Map(),deepLookup=t=>t?.analysis||null;",
  "const decode=async t=>t?.analysis||null;",
  "const grooveAgreement=()=>({score:"+(Number(options.groove??.85))+"});",
  "const camelotMatch=()=>({score:"+(options.keyMatch?".97":".05")+
    ",weight:"+(options.keyMatch?".20":"0")+"});",
  "const hasImmediateMusicalIntro=t=>t.introDrive>=.30;",
  "const similarNotes=()=>({focused:"+(Number(options.focused??.82))+",phrase:"+(Number(options.phrase??.81))+"});",
  "const transition=(old,next)=>next.cue||null;",
  "let shuffleLastDecision=null,deepIndex=null;",
  source.slice(source.indexOf("function withValidatedVoice("),
    source.indexOf("function deepStatus(){",source.indexOf("function withValidatedVoice("))),
  source.slice(start,end),
  "return {run:()=>intelligentShuffle(ctx.app,{duration:100,currentTime:0},1),",
  "decision:()=>shuffleLastDecision};"
 ].join("\n");
 const picker=new Function("ctx",shim)(ctx);
 return {...ctx,...picker};
}
const soft=(fade,patch={})=>({
 kind:"soft",fade,quietCertified:true,neutralRelease:true,begin:92,
 ...patch
});
const beat=(fade,patch={})=>({
 kind:"beat",fade,measuredBeatBridge:true,verifiedHarmonicBridge:true,grooveScore:.84,score:88,
 ...patch
});
test("selects a certified musical fade instead of a random next song when beat matches are absent",async()=>{
 const f=fixture({pool:[{cue:null},{cue:soft(4.3)}]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,1);
 assert.equal(f.decision().reason,"sfumatura musicale verificata");
});
test("verified beat always outranks soft fallback regardless of its fade length",async()=>{
 const f=fixture({pool:[{cue:soft(5.1)},{cue:beat(3.2)}]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,1);
 assert.equal(f.decision().softCandidates,1);
 assert.equal(f.decision().reason,"beat certificato");
});
test("never select a soft fade if a late vocal overlaps the proposed join",async()=>{
 const f=fixture({old:{lastVoiceAt:94.3},pool:[
  {cue:null},{cue:soft(4.3,{begin:92})}
 ]});
 await f.run();
 assert.equal(f.selected(),null);
 assert.equal(f.decision().softCandidates,0);
});
test("reject quiet next intros and uncertified audio tails",async()=>{
 const f=fixture({pool:[
  {cue:null},
  {analysis:{introDrive:.1},cue:soft(4.4)},
  {cue:soft(4.4,{quietCertified:false})}
 ]});
 await f.run();
 assert.equal(f.selected(),null);
 assert.equal(f.decision().softCandidates,0);
});
test("do not reorder a manually managed queue",async()=>{
 const f=fixture({manual:true,pool:[{cue:soft(5)},{cue:beat(3.8)}]});
 const result=await f.run();
 assert.equal(result.retry,false);
 assert.equal(f.selected(),null);
});
test("honest diagnostics preserve near-rhythm counts without labelling a fade as beat",async()=>{
 const f=fixture({pool:[{cue:null},{cue:soft(4.2)}]});
 await f.run();
 const d=f.decision();
 assert.equal(d.beatCandidates,0);
 assert.ok(d.rhythmCandidates>=0);
 assert.equal(d.softCandidates,1);
 assert.equal(d.checked,2);
});

test("a final instrumental beat bridge requires a genuinely complete vocal scan",()=>{
 const start=source.indexOf("function verifiedInstrumentalSnap(");
 const end=source.indexOf(" // A measured late-bar bridge:",start);
 assert.ok(start>0&&end>start,"vocal-safe beat snap exists");
 const bridge=new Function(
  "const clamp=(x,a,b)=>Math.min(Math.max(x,a),b);"+
  "const hasReliableHarmony=()=>true;"+
  "const similarNotes=()=>({matches:false,score:.84,focused:.84,phrase:.78,alignment:{score:.72}});"+
  "const grooveAgreement=()=>({score:.78});"+
  "const camelotMatch=()=>({weight:0,score:1});"+
  source.slice(start,end)+
  "return verifiedInstrumentalSnap;"
 )();
 const a={duration:100,last:98,bpm:120,beatConfidence:.24,level:.22,
  outroFinalNotes:Array(12).fill(.13),voiceModel:"audio-vocal-ai",
  voiceScannedEnd:98.4,lastVoiceAt:85,protectedEnding:true};
 const b={duration:100,bpm:120,beatConfidence:.24,introDrive:.9,
  introAttackNotes:Array(12).fill(.14),safeIntroAt:0};
 const cue=bridge(a,b,100);
 assert.equal(cue?.kind,"snap","a vocal-certified protected ending may still have an instrumental final beat");
 assert.ok(cue.fade>=.62&&cue.fade<=1.04,"micro-bridge protects the complete outgoing note");
 assert.equal(cue.voiceVerifiedMicroBridge,true);
 assert.equal(bridge({...a,voiceModel:null},b,100),null);
 assert.equal(bridge({...a,voiceScannedEnd:90},b,100),null);
 assert.equal(bridge({...a,lastVoiceAt:97},b,100),null);
 assert.equal(bridge({...a,lastLyricAt:95},b,100),null);
 assert.equal(bridge({...a,duration:96},b,100),null);
 assert.equal(bridge(a,{...b,introDrive:.08},100),null);
});

test("voice completion rearms a previously locked shuffle search exactly when safe",()=>{
 const begin=source.indexOf("function rearmShuffleAfterVocalScan(");
 const end=source.indexOf("function maybeReorderShuffle(",begin);
 assert.ok(begin>0&&end>begin);
 const make=new Function("app","state",
  "const enabled=true,mixing=false,active=null,mobileActive=null;"+
  "const bridge=()=>app;"+
  "let shuffleGeneration=3,shuffleBusy=true,shuffleRunFor='b-track-160',"+
  "shuffleRetryAt=60000,shuffleAttempts=4;"+
  source.slice(begin,end)+
  "return {run:()=>rearmShuffleAfterVocalScan('b-track-160'),"+
  "state:()=>({shuffleGeneration,shuffleBusy,shuffleRunFor,shuffleRetryAt,shuffleAttempts})};");
 let currentTime=15;
 const app={currentId:()=> "b-track-160",audio:()=>({duration:100,currentTime})};
 const x=make(app,{});
 assert.equal(x.run(),true);
 assert.deepEqual(x.state(),{shuffleGeneration:4,shuffleBusy:false,
  shuffleRunFor:"",shuffleRetryAt:0,shuffleAttempts:0});
 currentTime=80;
 assert.equal(x.run(),false,"too late to safely restart a long library search");
 assert.equal(x.state().shuffleGeneration,4);
 assert.match(source,/if\(current\)rearmShuffleAfterVocalScan\(track.id\)/);
 assert.match(source,/if\(currentTrack\)rearmShuffleAfterVocalScan\(track.id\)/);
 assert.match(source,/rearmShuffleAfterVocalScan\(id\)/);
 assert.match(source,/runGeneration!==null&&runGeneration!==shuffleGeneration/);
});


test("late full-audio index invalidates stale DJ picks and resets exhausted retries",async()=>{
 const begin=source.indexOf("function loadDeepIndex(force=false){");
 const end=source.indexOf("function canSaveAnalysis(",begin);
 assert.ok(begin>=0&&end>begin,"complete deep index loader exists");
 const harness=new Function(
  "const enabled=true,mixing=false;"+
  "let plannedFor='previous',plan={kind:'cut'},shuffleGeneration=5,"+
  "shuffleBusy=true,shuffleRunFor='outgoing',shuffleRetryAt=9999,shuffleAttempts=4;"+
  "let deepIndex=null,deepIndexPromise=null;"+
  "const deepStatus=()=>{};"+
  "const fetch=async()=>({ok:true,json:async()=>({version:2,entries:{}})});"+
  source.slice(begin,end)+
  "return {run:loadDeepIndex,state:()=>({plannedFor,plan,shuffleGeneration,"+
  "shuffleBusy,shuffleRunFor,shuffleRetryAt,shuffleAttempts,hasIndex:!!deepIndex})};"
 )();
 await harness.run();
 assert.deepEqual(harness.state(),{
  plannedFor:"",plan:null,shuffleGeneration:6,shuffleBusy:false,
  shuffleRunFor:"",shuffleRetryAt:0,shuffleAttempts:0,hasIndex:true
 });
});


test("if no overlap can be certified, sequence only strongly matched tempo, drums and key",async()=>{
 const f=fixture({keyMatch:true,pool:[
  {analysis:{bpm:140},cue:null},
  {analysis:{bpm:120},cue:null}
 ]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,0);
 assert.equal(f.decision().nearCandidates,1);
 assert.equal(f.decision().reason,"ordine per BPM, groove e tonalita");
});

test("a near-rhythm match never claims to be a beat overlap",async()=>{
 const f=fixture({keyMatch:true,pool:[
  {analysis:{bpm:120},cue:null},
  {analysis:{bpm:145},cue:null}
 ]});
 await f.run();
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().nearCandidates,1);
 assert.equal(f.selected(),null,"keep an already compatible next song");
});

test("vocal-verified short beat join accepts strong drums and compatible key without inventing an unscanned voice",()=>{
 const start=source.indexOf("function verifiedInstrumentalSnap(");
 const end=source.indexOf(" // A measured late-bar bridge:",start);
 assert.ok(start>=0&&end>start);
 const join=new Function(
  "const clamp=(x,a,b)=>Math.min(Math.max(x,a),b);"+
  "const hasReliableHarmony=()=>true;"+
  "const similarNotes=()=>({matches:false,score:.73,focused:.72,phrase:.60,"+
    "alignment:{score:.59}});"+
  "const grooveAgreement=()=>({score:.83});"+
  "const camelotMatch=()=>({weight:.20,score:.92});"+
  source.slice(start,end)+"return verifiedInstrumentalSnap;"
 )();
 const a={duration:100,last:98.1,bpm:116,beatConfidence:.27,
  outroFinalNotes:Array(12).fill(.12),voiceModel:"YAMNet",
  voiceScannedEnd:98.2,lastVoiceAt:83,protectedEnding:true};
 const b={bpm:117,beatConfidence:.26,introDrive:.83,
  introAttackNotes:Array(12).fill(.12),safeIntroAt:0};
 const cue=join(a,b,100);
 assert.equal(cue?.kind,"snap");
 assert.ok(cue.fade>=.62&&cue.fade<=1.04);
 assert.equal(cue.preserveTail,true);
 assert.equal(join({...a,voiceModel:null},b,100),null);
 assert.equal(join({...a,lastVoiceAt:96.5},b,100),null);
 assert.equal(join({...a,lastLyricAt:96},b,100),null);
 assert.equal(join({...a,voiceScannedEnd:92},b,100),null);
 assert.equal(join(a,{...b,bpm:91},100),null);
});

test("a measured rhythm and chord-boundary match can be queued without a certain Camelot label",async()=>{
 const f=fixture({pool:[{analysis:{bpm:155},cue:null},
  {analysis:{bpm:120},cue:null}]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().nearCandidates,1);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,0);
});
test("a large BPM mismatch is not allowed to masquerade as a verified DJ bridge",async()=>{
 const f=fixture({pool:[{analysis:{bpm:120},cue:null},
  {analysis:{bpm:176},cue:null}]});
 await f.run();
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.selected(),null);
});

test("when no certified beat/soft/strict harmonic match exists, choose a measured rhythm-only sequence",async()=>{
 const f=fixture({pool:[
  {analysis:{bpm:160},cue:null},
  {analysis:{bpm:120},cue:null}
 ]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,0);
 assert.ok(f.decision().nearCandidates+f.decision().sequenceCandidates>=1);
});
test("a weak boundary or uncertain BPM must not manufacture an audio beat mix",async()=>{
 const f=fixture({pool:[
  {analysis:{bpm:200,introDrive:.10},cue:null},
  {analysis:{bpm:200},cue:null}
 ]});
 await f.run();
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,0);
 assert.equal(f.selected(),null);
});

test("shuffle analysis yields between chunks on iPhone and rechecks playback generation",()=>{
 const body=source.slice(source.indexOf("async function intelligentShuffle("),
  source.indexOf("let shuffleBusy=",source.indexOf("async function intelligentShuffle(")));
 assert.match(body,/if\(\+\+batchCount%24===0\)/);
 assert.match(body,/await new Promise\(resolve=>setTimeout\(resolve,0\)\)/);
 assert.match(body,/runGeneration!==shuffleGeneration\|\|app\.currentId\(\)!==fromId/);
 assert.match(source,/setInterval\(\(\)=>\{try\{tick\(\)\}catch\(e\)\{\}\},isIOS\?650:350\)/);
});

test("real-world zero beat matches still choose the best measured percussive next song",async()=>{
 const f=fixture({focused:.36,phrase:.21,groove:.82,pool:[
  {analysis:{bpm:176},cue:null},{analysis:{bpm:120},cue:null}
 ]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,0);
 assert.equal(f.decision().nearCandidates,0);
 assert.equal(f.decision().sequenceCandidates,0);
 assert.equal(f.decision().rhythmOrderCandidates,1);
 assert.equal(f.decision().reason,
  "ritmo simile, raccordo continuo (non beat certificato)");
});
