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
  "const enabled=true,isIOS=false,window={MusicBoxRoom:{isActive:()=>false}};"+
   "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));",
  "const cache=new Map(),deepLookup=t=>t?.analysis||null;",
  "const decode=async t=>t?.analysis||null;",
  "const grooveAgreement=()=>({score:"+(Number(options.groove??.85))+"});",
  "const bpmGap=(a,b)=>Math.abs(Number(a?.bpm||0)-Number(b?.bpm||0));",
  "const camelotMatch=(a,b)=>({score:Number.isFinite(b?.keyScore)?b.keyScore:"+
    (options.keyMatch?".97":".05")+
    ",weight:Number.isFinite(b?.keyWeight)?b.keyWeight:"+
    (options.keyMatch?".20":"0")+"});",
  "const hasImmediateMusicalIntro=t=>t.introDrive>=.30;",
  "const similarNotes=(a,b)=>({focused:Number.isFinite(b?.focusScore)?b.focusScore:"+
    Number(options.focused??.82)+
    ",phrase:Number.isFinite(b?.phraseScore)?b.phraseScore:"+
    Number(options.phrase??.81)+"});",
  "const transition=(old,next)=>next.cue||null;",
  "const musicalIntroEntry=()=>0;",
  "const onsetGridPhase=()=>.12;",
  source.slice(source.indexOf("function desktopFinalImpactRelay("),
    source.indexOf("function continuityFallback(",source.indexOf("function desktopMeasuredPostludeBridge("))),
  "const desktopBeatPairCertified=()=>true,iphoneBeatPairCertified=()=>true,"+
   "iphoneQuietReleaseCertified=()=>true;",
  "let shuffleLastDecision=null,deepIndex=null;",
  source.slice(source.indexOf("function withValidatedVoice("),
    source.indexOf("function deepStatus(){",source.indexOf("function withValidatedVoice("))),
  source.slice(source.indexOf("function musicallyCompatibleOverlay("),
    source.indexOf("function transition(",source.indexOf("function musicallyCompatibleOverlay("))),
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

test("Spotify-style safe soft fades prefer matching key, notes and BPM over a longer unrelated fade",async()=>{
 const f=fixture({groove:.85,pool:[
  {analysis:{bpm:95,introDrive:.9,keyScore:.05,keyWeight:.2,
    focusScore:.20,phraseScore:.20},cue:soft(5.0)},
  {analysis:{bpm:120,introDrive:.75,keyScore:.97,keyWeight:.2,
    focusScore:.91,phraseScore:.84},cue:soft(3.2)}
 ]});
 const result=await f.run();
 assert.equal(result.selected,true);
 assert.equal(f.selected()?.pickId,3,"more harmonic fade should beat unrelated longer fade");
 assert.equal(f.decision().beatCandidates,0,"no invented beatmatch");
 assert.equal(f.decision().softCandidates,1,"unrelated quiet fade is not a compatible pairing");
 assert.equal(f.decision().reason,"sfumatura su finale quieto (non beat uguali)");
});

test("incompatible chords cannot blend merely because the outro is quiet",async()=>{
 const f=fixture({groove:.86,pool:[
  {analysis:{focusScore:.24,phraseScore:.12,keyScore:.05,keyWeight:.20},cue:soft(5)},
  {analysis:{focusScore:.91,phraseScore:.84,keyScore:.97,keyWeight:.20},cue:soft(3.4)}
 ]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().softCandidates,1,"dissonant quiet fades are refused");
});
test("matching drums alone never force an incompatible automatic DJ pair",async()=>{
 const f=fixture({focused:.36,phrase:.21,groove:.82,pool:[
  {analysis:{bpm:176},cue:null},{analysis:{bpm:120},cue:null}
 ]});
 await f.run();
 assert.equal(f.selected(),null,"a weak chord match cannot be advertised as mixed");
 assert.equal(f.decision().rhythmOrderCandidates,1);
});
test("safe soft musical ranking does not change manually ordered queues",async()=>{
 const f=fixture({manual:true,pool:[
  {analysis:{keyScore:.05,keyWeight:.2},cue:soft(5)},
  {analysis:{keyScore:.97,keyWeight:.2},cue:soft(3)}
 ]});
 await f.run();assert.equal(f.selected(),null);
});

test("selects a certified musical fade instead of a random next song when beat matches are absent",async()=>{
 const f=fixture({groove:.85,pool:[{cue:null},{cue:soft(4.3)}]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,1);
 assert.equal(f.decision().reason,"sfumatura su finale quieto (non beat uguali)");
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
  source.slice(source.indexOf("function certifiedMixBoundary("),source.indexOf("// Permit a rhythmic overlap",source.indexOf("function certifiedMixBoundary(")))+source.slice(start,end)+
  "return verifiedInstrumentalSnap;"
 )();
 const a={duration:100,last:99.75,bpm:120,beatConfidence:.24,level:.22,
  outroFinalNotes:Array(12).fill(.13),voiceModel:"audio-vocal-ai",
  voiceScannedEnd:99.95,lastVoiceAt:85,protectedEnding:true};
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
 const begin=source.indexOf("function scheduleDeepIndexRetry(delay){");
 const end=source.indexOf("function canSaveAnalysis(",begin);
 assert.ok(begin>=0&&end>begin,"complete deep index loader exists");
 const harness=new Function(
  "const enabled=true,mixing=false;"+
  "let plannedFor='previous',plan={kind:'cut'},shuffleGeneration=5,"+
  "shuffleBusy=true,shuffleRunFor='outgoing',shuffleRetryAt=9999,shuffleAttempts=4;"+
  "let deepIndex=null,deepIndexPromise=null,deepRetryAfter=0,deepRetryTimer=null,deepLoadFailures=0;"+
  "let offlineTransferPriority=false,deepTransferController=null;const bridge=()=>null;"+
  "const isIOS=false,document={hidden:false};"+
  "const iosIndexCanLoadNow=()=>true;const deepStatus=()=>{};"+
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
  source.slice(source.indexOf("function certifiedMixBoundary("),source.indexOf("// Permit a rhythmic overlap",source.indexOf("function certifiedMixBoundary(")))+source.slice(start,end)+"return verifiedInstrumentalSnap;"
 )();
 const a={duration:100,last:99.8,bpm:116,beatConfidence:.27,
  outroFinalNotes:Array(12).fill(.12),voiceModel:"YAMNet",
  voiceScannedEnd:99.95,lastVoiceAt:83,protectedEnding:true};
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

test("rhythm-only resemblance is diagnostic, not a DJ mix",async()=>{
 const f=fixture({focused:.36,phrase:.21,groove:.82,pool:[
  {analysis:{bpm:176},cue:null},{analysis:{bpm:120},cue:null}
 ]});
 await f.run();
 assert.equal(f.selected(),null);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().nearCandidates,0);
 assert.equal(f.decision().rhythmOrderCandidates,1);
});
test("real audible DJ transitions outrank similarity-only queue candidates",()=>{
 const body=source.slice(source.indexOf("async function intelligentShuffle("),
  source.indexOf("let shuffleBusy=",source.indexOf("async function intelligentShuffle(")));
 assert.ok(body.includes("const choicePool=scored.length?scored:impactScored.length?impactScored:"));
 assert.ok(body.includes("nearScored.length?nearScored"));
});

test("measured final postlude chooses audible next song, not faint random intro",async()=>{
 const old={duration:100,last:94,confidentTail:false,protectedEnding:false,
  lastLyricAt:70,lastVoiceAt:72,
  dropRelease:{lastImpactAt:90.7,releaseAt:91.7,score:.74,quietLevel:.27}};
 const f=fixture({old,pool:[
  {analysis:{introDrive:.0874},cue:null},
  {analysis:{introDrive:.86},cue:null}
 ]});
 const selected=await f.run();
 assert.equal(selected.selected,true);
 assert.equal(f.selected()?.pickId,3,"audible intro must replace the almost-silent random next");
 assert.equal(f.decision().beatCandidates,0,"no fake beat matching");
 assert.equal(f.decision().postludeCandidates,1);
 assert.equal(f.decision().reason,
  "raccordo dopo ultimo suono, ingresso musicale subito udibile");
 const manual=fixture({manual:true,old,pool:[
  {analysis:{introDrive:.0874},cue:null},{analysis:{introDrive:.86},cue:null}
 ]});
 await manual.run();assert.equal(manual.selected(),null,"do not override manual queues");
});

test("verified last-impact cue replaces near-silent auto next, not a manual queue",async()=>{
 const outgoing={duration:100,last:95.2,bpm:120,beatConfidence:.35,
   lastLyricAt:70,lastVoiceAt:72,protectedEnding:false,
   dropRelease:{lastImpactAt:92.7,releaseAt:93.1,score:.78,quietLevel:.22}};
 const next={bpm:120,introDrive:.8,beatConfidence:.35,
   introOnset:Array(96).fill(.3),first:0,safeIntroAt:0};
 const f=fixture({old:outgoing,pool:[
   {analysis:{...next,introDrive:.0874},cue:null},
   {analysis:next,cue:null}
 ]});
 await f.run();
 assert.equal(f.selected()?.pickId,3,"cue must be on measured impact, not later silence");
 assert.equal(f.decision().beatCandidates,0,"not a verified harmonic beatmatch");
 assert.equal(f.decision().impactCandidates,1);
 assert.equal(f.decision().reason,
   "ingresso sul colpo finale misurato, non beatmatch armonico");
 const manual=fixture({manual:true,old:outgoing,pool:[
   {analysis:next,cue:null},{analysis:next,cue:null}
 ]});
 await manual.run();
 assert.equal(manual.selected(),null,"user queue is immutable");
});
