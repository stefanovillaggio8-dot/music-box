"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
function excerpt(first,last){
 const i=source.indexOf(first),j=source.indexOf(last,i+first.length);
 assert.ok(i>=0&&j>i,"missing DJ function "+first);
 return source.slice(i,j);
}
const allow=new Function(excerpt("function mobileMixAllowed(",
 "function rememberMobileClip(")+"return mobileMixAllowed;")();
const sample={kind:"snap",begin:173,end:173.72,fade:.72,
 preserveTail:true,measuredBeatBridge:true,grooveScore:.83,score:82};

test("Safari can plan a DJ cue at readyState 2 and prepares a clip only with buffered audio",()=>{
  const from=source.indexOf("function mobileClipWindow(audio) {");
  const until=source.indexOf("// A certified 3-5s blend",from);
  assert.ok(from>0&&until>from,"bounded iOS preview gate exists");
  const gate=Function("document","mobileDJMayWork",
    source.slice(from,until)+";return mobileClipWindow")(
      {hidden:false},()=>true);
  const make=(ready,ahead)=>({
    paused:false,seeking:false,readyState:ready,currentTime:110,duration:200,
    buffered:{length:1,start:()=>100,end:()=>110+ahead}
  });
  assert.equal(gate(make(2,14)),true,"Safari state 2 can prepare after 14s buffered");
  assert.equal(gate(make(2,3)),false,"do not compete with a weak mobile buffer");
  assert.equal(gate(make(3,4)),true,"ordinary buffered stream still works");
  assert.equal(gate(make(1,20)),false,"cannot decode while playback is not ready");
  assert.equal(gate({...make(2,14),seeking:true}),false,"seeks take precedence");
  assert.ok(source.includes("if(isIOS&&audio&&(audio.seeking||audio.readyState<2))"),
    "metadata planning must work while Safari reports readyState=2");
  assert.ok(source.includes('if(!ctx)ctx=bridge()?.mixRunningContext?.();'),
    "legacy iPhone can reuse an unlocked context for decode");
});

test("measured short beat can enter iPhone with no simulated YAMNet voice scan",()=>{
 assert.equal(allow(sample,{protectedEnding:false,lastVoiceAt:165},167),true);
 assert.equal(allow({...sample,voiceVerifiedMicroBridge:true},{},null),true);
 assert.equal(allow(sample,{protectedEnding:true},167),false);
 assert.equal(allow(sample,{protectedEnding:false},172),false);
 assert.equal(allow({...sample,grooveScore:.51},{protectedEnding:false},167),false);
 assert.equal(allow({...sample,score:36},{protectedEnding:false},167),false);
 assert.equal(allow({...sample,preserveTail:false},{protectedEnding:false},167),false);
 assert.equal(allow(sample,null,null),false);
});
test("long overlays still require certified safe vocal and quiet region",()=>{
 const beat={kind:"beat",begin:164,end:168,fade:4,
  quietCertified:true,safeOutroAt:164};
 assert.equal(allow(beat,{},null),true);
 assert.equal(allow({...beat,quietCertified:false},{},null),false);
 assert.equal(allow({...beat,safeOutroAt:null},{},null),false);
 assert.equal(allow({...beat,fade:1},{},null),false);
 assert.equal(allow({kind:"cut",begin:163,end:168,fade:5},{},null),false);
});
test("Safari never prepares a full MP3 while native playback is starting or buffering",()=>{
 const policy=rt=>new Function("runtime",
  "const isIOS=true,document={get hidden(){return runtime.hidden}},Date={now:()=>runtime.now};"+
  "let lastDJTrackChange=runtime.last,offlineTransferPriority=false;"+
  excerpt("function mobileDJMayWork(","function mobileMixAllowed(")+
  "return mobileClipWindow;")(rt);
 const audio=(at,state)=>({paused:false,readyState:state,
  duration:180,currentTime:at,buffered:{
   length:1,start:()=>0,end:()=>164}});
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(20,4)),false,
  "far from outro: no full decode");
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(110,4)),true);
 assert.equal(policy({now:11000,last:9000,hidden:false})(audio(110,4)),false,
  "skip cooldown");
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(110,2)),true,
  "iOS can report HAVE_CURRENT_DATA even with 54 seconds buffered");
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(158,2)),false,
  "state 2 with six buffered seconds must not start a decode");
 assert.equal(policy({now:11000,last:0,hidden:true})(audio(110,4)),false,
  "screen locked");
});
test("iPhone next button starts the native song before repaint, not a second decoder",()=>{
 const p=app.slice(app.indexOf("async function playById("),
  app.indexOf("function idBranoA(",app.indexOf("async function playById(")));
 assert.ok(p.indexOf("const _avvioImmediato = autoplay ? doPlay() : null;")>=0);
 assert.ok(p.indexOf("const _avvioImmediato = autoplay ? doPlay() : null;")<
  p.indexOf("_segnaRigaAttiva();"));
 assert.match(app,/function _preparaIlSuccessivo\(id\) \{[\s\S]{0,450}if \(_usaControlliNativiIos\(\)\) return;/);
 assert.match(app,/if \(_usaControlliNativiIos\(\) && !window\.MusicBoxMix\?\.needsAudioContext\?\.\(\)\) return;/);
 assert.ok(source.includes("mobileMixAllowed(plan,nowInfo"));
 assert.ok(source.includes("mobileClipWindow(audio)"));
 assert.ok(source.includes("vocalSafe:!lowPreview"));
});
test("real MP3 index contains eligible measured DJ joins but refuses unverified unsafe long blends",()=>{
 const idx=JSON.parse(fs.readFileSync(path.join(root,"dj-deep-analysis.json"),"utf8"));
 const tracks=Object.entries(idx.entries||{}).filter(([k,v])=>
  v?.status==="ok"&&Number.isFinite(v.duration)&&v.duration>=26&&
  v.bpm>=55&&v.bpm<=210&&Array.isArray(v.chroma)&&v.chroma.length===12)
  .map(([key,data])=>({key,data}));
 const engine=new Function("isIOS","style",
  "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\n"+
  excerpt("function grooveAgreement(","// Find a *musical* release")+
  excerpt("function compatibility(","async function decode(")+
  excerpt("function hasReliableHarmony(","function resetMobileFade(")+
  excerpt("function iphoneBeatPairCertified(","function mobileMixAllowed(")+
  "return {transition,iphoneBeatPairCertified,iphoneQuietReleaseCertified};")(false,"auto");
 let total=0,plans=0,allowed=0,lowPreview=0,strict=0,weak=0,
   softSafe=0,softUnsafe=0,beatEligible=0;
 for(let i=0;i<tracks.length;i+=11)
  for(let j=0;j<tracks.length;j+=2){
   if(i===j)continue;
   total++;
   const a=tracks[i].data,b=tracks[j].data;
   const p=engine.transition(a,b,a.duration);
   if(!p)continue;
   plans++;
   if(allow(p,a,null)){
    allowed++;if(p.kind==="snap"&&!p.voiceVerifiedMicroBridge)lowPreview++;
    if(p.kind==="beat"||p.kind==="snap"){
      beatEligible++;
      if(engine.iphoneBeatPairCertified(a,b,p))strict++;else weak++;
    }else if(engine.iphoneQuietReleaseCertified(a,p))softSafe++;
    else softUnsafe++;
    assert.ok(p.end<=a.duration+.04&&p.begin>=0);
   }
  }
 console.info("[iPhone DJ REAL]",JSON.stringify({indexed:tracks.length,total,
  plans,allowed,lowPreview,strict,weak,softSafe,softUnsafe,beatEligible}));
 assert.ok(total>=25000);
 assert.ok(allowed>=1,"at least one real beat/quiet overlap should be eligible");
 assert.ok(softUnsafe+weak>0,
  "real library must reject speculative overlays on audible unmatched endings");
});

test("iPhone shuffle only promotes tracks its actual mixer can play",()=>{
 assert.ok(source.includes("const mobilePlayable=musicallyPlayable&&(!isIOS||"));
 assert.ok(source.includes("iphoneBeatPairCertified(old,next,cue)"));
 assert.ok(source.includes("const verified=Boolean(mobilePlayable&&"));
 assert.ok(source.includes("const safeSoft=Boolean(mobilePlayable&&"));
});
test("DJ index does not compete with native iPhone startup or play while disabled",()=>{
 assert.ok(source.includes("function start(){\n // A disabled DJ must not download"));
 assert.ok(source.includes("if(enabled){\n  if(isIOS)setTimeout"));
 assert.ok(source.includes("mobileOverlayEnabled=true;\n   try{localStorage.setItem"));
 assert.ok(source.includes("bridge()?.mixEnableAudio?.(event);"));
});

test("large Safari DJ index retries after a slow/failed fetch without a reload",async()=>{
 const begin=source.indexOf("let deepIndex=null,deepIndexPromise=null");
 const end=source.indexOf("function canSaveAnalysis(",begin);
 assert.ok(begin>=0&&end>begin);
 const code=source.slice(begin,end);
 const clock={now:100000},queued=[];
 let requests=0;
 const fetch=async()=>{
  requests++;
  if(requests===1)throw Error("slow network");
  return {ok:true,json:async()=>({version:2,entries:{}})};
 };
 const api=new Function("fetch","clock","queued",
  "const isIOS=true,document={hidden:false};"+
  "const Date={now:()=>clock.now};"+
  "const setTimeout=(fn,delay)=>{queued.push({fn,delay});return queued.length};"+
  "const clearTimeout=()=>{};"+
  "const AbortController=globalThis.AbortController;"+
  "const bridge=()=>null;const iosIndexCanLoadNow=()=>true;let offlineTransferPriority=false,deepTransferController=null;"+
  "let enabled=true,mixing=false,plannedFor='',plan=null,"+
  "shuffleGeneration=0,shuffleBusy=false,shuffleRunFor='',shuffleRetryAt=0,shuffleAttempts=0;"+
  "const $=()=>null;"+
  code+
  "return {loadDeepIndex,stat:()=>({retryAfter:deepRetryAfter,loaded:!!deepIndex})};"
 )(fetch,clock,queued);
 assert.equal(await api.loadDeepIndex(),null);
 assert.equal(requests,1);
 assert.ok(api.stat().retryAfter>clock.now);
 assert.equal(await api.loadDeepIndex(),null,"do not retry every audio tick");
 assert.equal(requests,1);
 clock.now=api.stat().retryAfter+1;
 assert.equal((await api.loadDeepIndex()).version,2);
 assert.equal(requests,2);
 assert.equal(api.stat().loaded,true);
 assert.equal((await api.loadDeepIndex()).version,2);
 assert.equal(requests,2,"successful index is reused");
});
test("continue button never cancels playback intention while audio already plays",()=>{
 assert.ok(app.includes("if (audio && !audio.paused) { _nascondiAiuto(); return; }"));
 assert.ok(!app.includes("if (audio && !audio.paused) { _vuoleSuonare = false; return; }"));
});

test("iPhone rejects false beat matches even when BPM is similar",()=>{
 const verify=new Function(
  "const similarNotes=(a,b)=>b.notes;"+
  "const grooveAgreement=(a,b)=>b.drums;"+
  "const onsetPairAgreement=()=>({certified:true});"+
  "const camelotMatch=(a,b)=>b.key;"+
  excerpt("function iphoneBeatPairCertified(","function mobileMixAllowed(")+
  "return iphoneBeatPairCertified;"
 )();
 const from={bpm:126,beatConfidence:.5,last:180};
 const to={bpm:128,beatConfidence:.55,
  notes:{matches:true,focused:.86,phrase:.77,
   alignment:{matches:true,score:.84}},
  drums:{score:.87,correlation:.74},key:{weight:.2,score:.9}};
 const cue={kind:"snap",measuredBeatBridge:true,begin:179.2,end:179.92,fade:.72};
 assert.equal(verify(from,to,cue),true);
 assert.equal(verify(from,{...to,notes:{...to.notes,matches:false}},cue),false);
 assert.equal(verify(from,{...to,drums:{score:.72,correlation:.44}},cue),false);
 assert.equal(verify(from,{...to,notes:{...to.notes,alignment:{matches:false}}},cue),false);
 assert.equal(verify(from,{...to,bpm:142},cue),false);
 assert.equal(verify(from,null,cue),false);
 assert.equal(verify(from,to,{kind:"soft"}),true);
});
test("Safari handoff verifies native progress and never seeks twice",()=>{
 const fn=source.slice(source.indexOf("function finishMobileMix("),
  source.indexOf("function handoffMobileMix("));
 assert.ok(fn.includes("!act.nativeRepairAttempted"));
 assert.ok(fn.includes("act.nativeRepairAttempted=true"));
 assert.ok(fn.includes("audio.currentTime-act.nativeSyncTime>=.15"));
 assert.ok(fn.includes("Math.abs(heard-audio.currentTime)<=1.5"));
});
test("iPhone seeks are not treated as deliberate pauses",()=>{
 const start=app.indexOf('a.addEventListener("pause", () => {');
 const stop=app.indexOf('a.addEventListener("playing", () => {',start);
 const fn=app.slice(start,stop);
 assert.ok(fn.includes("!eDelSistema && !pausaPerSeek"));
 assert.ok(fn.includes("_vuoleSuonare&&!a.ended&&pausaPerSeek"));
 assert.ok(app.includes("if(!a.seeking&&a.readyState>=3)a._mbCambioBrano=false"));
});

test("quiet fade on iPhone requires near-silent measured release",()=>{
 const isQuiet=new Function(
  excerpt("function iphoneQuietReleaseCertified(","function mobileMixAllowed(")+
  "return iphoneQuietReleaseCertified;"
 )();
 const cue={kind:"soft",begin:173,end:178,quietCertified:true};
 const a={protectedEnding:false,dropRelease:{
  releaseAt:171,quietLevel:.08,score:.88}};
 assert.equal(isQuiet(a,cue),true);
 assert.equal(isQuiet({...a,dropRelease:{...a.dropRelease,quietLevel:.43}},cue),false);
 assert.equal(isQuiet({...a,protectedEnding:true},cue),false);
 assert.equal(isQuiet({confidentTail:true,last:172.9},cue),true);
 assert.equal(isQuiet({outroGap:{start:170,end:179}},cue),true);
 assert.equal(isQuiet({},cue),false);
 assert.equal(isQuiet(null,cue),false);
 assert.equal(isQuiet(null,{kind:"snap"}),true);
});

// A real closing decay earns a neutral fade, NOT a fake beat label.
// Unknown vocals cannot override known late lyrics or voice detections.
test("DJ recovers a verified quiet fade when an exact beatmatch is impossible",()=>{
 const head=source.indexOf("function certifiedNeutralBridge(");
 const tail=source.indexOf("function mobileMixAllowed(",head);
 assert.ok(head>0&&tail>head);
 const choose=new Function(
  "const hasImmediateMusicalIntro=()=>true;"+
  "const musicalIntroEntry=b=>b.safeIntroAt||0;"+
  source.slice(head,tail)+"return certifiedNeutralBridge;")();
 const a={duration:180,last:177,protectedEnding:false,
  confidentTail:true,lastLyricAt:165,lastVoiceAt:168,
  dropRelease:{lastImpactAt:170,releaseAt:172,score:.91,quietLevel:.08}};
 const b={introDrive:.81,safeIntroAt:0,firstLyricAt:4};
 const p=choose(a,b,180);
 assert.equal(p?.kind,"soft");
 assert.equal(p?.neutralRelease,true);
 assert.equal(p?.preserveTail,true);
 assert.ok(p.begin>=a.dropRelease.releaseAt+.3);
 assert.ok(p.end>=a.last,"original last audible notes survive the fade");
 assert.ok(p.fade>=2.35,"audible overlapping intro");
 assert.equal(choose({...a,lastVoiceAt:172.1},b,180),null);
 assert.equal(choose({...a,lastLyricAt:171},b,180),null);
 assert.equal(choose({...a,protectedEnding:true},b,180),null);
 assert.equal(choose({...a,dropRelease:{...a.dropRelease,quietLevel:.4}},b,180),null);
 assert.equal(choose(a,{...b,firstLyricAt:.5},180),null);
 assert.equal(choose(a,b,166),null);
});

test("iPhone DJ prepares optional intro data before WebAudio is resumed",()=>{
 assert.ok(source.includes("if(isIOS&&mobileOverlayEnabled&&plan&&"));
 const preparation=excerpt("if(isIOS&&mobileOverlayEnabled&&plan&&","decode(next,true).catch(()=>{})");
 assert.ok(!preparation.includes('mixRunningContext?.()?.state==="running"'),
  "preparing audio must not require a running playback AudioContext");
 assert.ok(preparation.includes("mobileMixAllowed(plan,nowInfo"));
 assert.ok(preparation.includes("mobileClipWindow(audio)"));
 assert.ok(app.includes("mixRunningContext:()=>_mixContextAttivo()"));
});
test("iPhone mobile debug reports why an available cue failed to start",()=>{
 assert.ok(source.includes('mobileMixLastBlocker="WebAudio inattivo:'));
 assert.ok(source.includes('mobileMixLastBlocker="Anteprima MP3 non ancora pronta"'));
 assert.ok(source.includes('status="Mix non avviato: "+mobileMixLastBlocker'));
});

test("Safari native handoff retries only twice and obeys a deliberate pause",()=>{
 const code=excerpt("function finishMobileMix(","function handoffMobileMix(");
 const counter={now:10000,tries:0,stops:0};
 const state={track:{id:"next"},handingOff:true,entry:1,
  ctx:{currentTime:2},started:0,rateSpeed:1,rateRamp:0,
  handoffAt:8300,timeoutAt:17000,clipEnd:18,
  nativeRetryCount:0,nativeRetryAt:0};
 const audio={paused:true,readyState:0,seeking:false,currentTime:0,seekable:{length:0}};
 let intended=true;
 const app={currentId:()=>"next",audio:()=>audio,
  wantsPlayback:()=>intended,playCurrent:()=>{counter.tries++;return Promise.resolve()}};
 const finish=new Function("counter","state",
  "let mobileActive=state;const stopMobileMix=()=>{counter.stops++};"+
  "const Date={now:()=>counter.now};"+
  "const mobilePlayedSeconds=act=>act.ctx.currentTime-act.started;"+
  code+"return finishMobileMix;")(counter,state);
 finish(app);assert.equal(counter.tries,1);
 finish(app);assert.equal(counter.tries,1);
 counter.now+=1300;finish(app);assert.equal(counter.tries,2);
 counter.now+=1300;finish(app);assert.equal(counter.tries,2);
 intended=false;finish(app);assert.equal(counter.stops,1);
});

test("quiet 2.35s fade has over 1s of possible launch time on Safari",()=>{
 assert.ok(source.includes('if(secondsLeft<(p.kind==="snap"?.30:1.25)'));
 assert.ok(source.includes('audio.currentTime<plan.end-(plan.kind==="snap"?.26:1.25)'));
 assert.ok(source.includes("armSnapPrecision(audio,id)"));
});


test("certified silent outro hands off on iPhone even when an unusable plan exists",()=>{
 const a=source.indexOf("const measuredEnding=currentSource&&");
 const b=source.indexOf("const earlyRelease=certifiedEarlyReleaseReady(",a);
 assert.ok(a>0&&b>a,"late-stage playback control exists");
 const body=source.slice(a,b);
 assert.ok(body.includes("certifiedTailSkip(measuredEnding,audio.duration,"));
 assert.ok(body.includes("quietDirectHandoff(app,audio,id,next,entry,"));
 assert.ok(body.includes("!active&&!mobileActive&&!mixing&&!silentFadeReady"));
 assert.ok(body.includes("!isIOS&&plan?.certifiedSilentBridge===true"));
 // A full-track certificate, not silence inferred from the audio element.
 const first=source.indexOf("function certifiedTailSkip(");
 const last=source.indexOf("// Desktop-only safety net",first);
 assert.ok(first>0&&last>first);
 const safe=new Function(source.slice(first,last)+"return certifiedTailSkip;")();
 const ending={duration:180,last:176,confidentTail:true};
 assert.equal(safe(ending,180,176.3,null),true);
 assert.equal(safe({...ending,confidentTail:false},180,176.3,null),false);
 assert.equal(safe({...ending,lastVoiceAt:175.8},180,176.3,null),false);
 assert.equal(safe(ending,180,176.3,175.7),false);
 assert.equal(safe(ending,175,176.3,null),false);
 assert.equal(safe(ending,180,175.9,null),false);
});

test("short iPhone fade allowed only in a verified digital-silent tail",()=>{
 const policy=new Function("isIOS","hasImmediateMusicalIntro","musicalIntroEntry",
  excerpt("function iphoneSilentTailBridge(","function desktopSilentTailBridge(")+
  "return iphoneSilentTailBridge;")(true,()=>true,()=>0);
 const a={duration:180,last:177.5,confidentTail:true,protectedEnding:false};
 const b={introDrive:.8,duration:185};
 const cue=policy(a,b,180);
 assert.ok(cue);
 assert.equal(cue.mobileSilentBridge,true);
 assert.equal(cue.certifiedSilentBridge,true);
 assert.equal(cue.kind,"soft");
 assert.ok(cue.begin>a.last+.25&&cue.end<180);
 assert.ok(cue.fade>=.65&&cue.fade<=1.70);
 assert.equal(allow(cue,a,170),true);
 assert.equal(allow(cue,a,177.2),false);
 assert.equal(policy({...a,confidentTail:false},b,180),null);
 assert.equal(policy({...a,protectedEnding:true},b,180),null);
 assert.equal(policy({...a,lastVoiceAt:177.3},b,180),null);
 assert.equal(policy({...a,last:179.3},b,180),null);
 assert.equal(policy({...a,duration:177},b,180),null);
});
test("iPhone can actually start short verified silent fade",()=>{
 assert.ok(source.includes("iphoneSilentTailBridge(currentAnalysis,nextAnalysis,audio.duration)"));
 assert.ok(source.includes("possibleSilentBridge=silentBridge||mobileSilentBridge"));
 assert.ok(source.includes("p.mobileSilentBridge?.58:1.25"));
 assert.ok(source.includes("plan.mobileSilentBridge?.42:1.25"));
 assert.ok(source.includes("cue.mobileSilentBridge===true"));
});
