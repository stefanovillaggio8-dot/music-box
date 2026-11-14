"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const first=source.slice(source.indexOf("function clamp("),source.indexOf("async function decode("));
const second=source.slice(source.indexOf("function hasReliableHarmony("),source.indexOf("function resetMobileFade("));
assert.ok(first.includes("function analyzeFrames("));
assert.ok(second.includes("function transition("));
const {analyzeFrames,transition}=new Function(
  'const isIOS=false,style="auto",mixSeconds=6;\n'+first+'\n'+second+'\nreturn {analyzeFrames,transition};'
)();
const harmony=[.24,.16,.12,.11,.08,.08,.06,.04,.03,.03,.025,.025];
const current={duration:180,last:180,safeOutroAt:null,confidentTail:false,
 bpm:120,beatConfidence:.8,beatAnchor:165,level:.3,chroma:harmony,
 introChroma:harmony,outroChroma:harmony};
const next={...current,safeIntroAt:0,first:1.3,leading:1.3};
function synthetic(variant){
 const rate=8000,duration=64,data=new Float32Array(rate*duration);
 for(let i=0;i<data.length;i++){
  const t=i/rate;let amplitude=.3;
  if(variant==="quietOutro"&&t>=54)amplitude=.052;
  if(variant==="silentTail"&&t>=60)amplitude=0;
  if(variant==="softIntro"&&t<3)amplitude=.010;
  if(variant==="silentIntro"&&t<3)amplitude=0;
  data[i]=amplitude*(Math.sin(2*Math.PI*220*t)*.7+Math.sin(2*Math.PI*330*t)*.3);
 }
 return {sampleRate:rate,duration,getChannelData:()=>data};
}

test("measured musical boundary can overlap without requiring an entire identical chord progression",()=>{
 const s=source.slice(source.indexOf("function measuredBeatBridge("),
  source.indexOf("// A four-second average",source.indexOf("function measuredBeatBridge(")));
 const safe=source.slice(source.indexOf("function certifiedMixBoundary("),
  source.indexOf("// Permit a rhythmic overlap",source.indexOf("function certifiedMixBoundary(")));
 const mock=new Function(
  "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
  "const hasReliableHarmony=()=>true;"+
  "const grooveAgreement=()=>({score:.86});"+
  "const similarNotes=()=>({matches:false,focused:.85,phrase:.76,score:.80,"+
    "alignment:{matches:false,score:.82,weakest:.61}});"+
  "const camelotMatch=()=>({score:.95,weight:.21});"+
  "const beatBearingIntro=(b,min)=>b.introDrive>=min;"+safe+s+"return measuredBeatBridge;"
 )();
 const a={duration:180,last:179.96,bpm:120,beatConfidence:.29,
  outroFinalNotes:[1],protectedEnding:false,beatAnchor:175.5};
 const b={bpm:121,beatConfidence:.27,introDrive:.77,
  introAttackNotes:[1],safeIntroAt:0,introBeat:.5};
 const p=mock(a,b,180);
 assert.equal(p?.kind,"snap");
 assert.equal(p.verifiedMicroBeat,true);
 assert.equal(p.preserveTail,true);
 assert.equal(p.silenceTrim,false);
 assert.ok(p.begin<179.3&&p.end>179.9,"matched beat starts before the end");
 assert.ok(p.fade>=.63&&p.fade<=1.10);
 assert.equal(mock({...a,last:174},b,180),null,
  "an unverified tail cannot be cut after a false last-frame estimate");
 assert.equal(mock({...a,lastLyricAt:178},b,180),null);
});

test("vocal or loud ending is never shortened by guessed timing",()=>{
 assert.equal(transition(current,next,180),null);
});
test("a confirmed quiet outro allows a longer musical overlap",()=>{
 const plan=transition({...current,safeOutroAt:172},next,180);
 assert.equal(plan.kind,"beat");
 assert.ok(plan.begin>=172&&plan.fade>=4&&plan.end>=179.9);
});
test("normal opening notes of the next song are preserved",()=>{
 assert.equal(transition({...current,safeOutroAt:172},next,180).entry,0);
});
test("early next vocal is not obscured by a long blend",()=>{
 const plan=transition({...current,safeOutroAt:172},{...next,firstLyricAt:0},180);
 assert.equal(plan.kind,"soft");
});
test("final synchronized lyric blocks an early transition",()=>{
 assert.equal(transition({...current,safeOutroAt:172,lastLyricAt:174},next,180),null);
});
test("last lyric before a genuine instrumental outro is allowed",()=>{
 const plan=transition({...current,safeOutroAt:172,lastLyricAt:150},next,180);
 assert.equal(plan.kind,"beat");
});
test("only genuinely silent tail may be skipped",()=>{
 const plan=transition({...current,last:175,confidentTail:true},next,180);
 assert.equal(plan.kind,"cut"); assert.ok(plan.end>=175);
});
test("unavailable analysis cannot trigger destructive fade",()=>{
 assert.equal(transition(null,next,180),null);
});
test("wrong MP3 duration cannot trigger destructive mix",()=>{
 assert.equal(transition({...current,duration:150,safeOutroAt:142},next,180),null);
});
test("a short quiet outro does not cause a long beatmix",()=>{
 assert.equal(transition({...current,safeOutroAt:177},next,180).kind,"soft");
});
test("ongoing loud music has no safe early cue",()=>{
 const x=analyzeFrames(synthetic("loud"));
 assert.equal(x.safeOutroAt,null);assert.equal(x.confidentTail,false);
});
test("real quiet musical ending is not misdetected as silence",()=>{
 const x=analyzeFrames(synthetic("quietOutro"));
 assert.ok(x.last>63.5);assert.ok(x.safeOutroAt>=53&&x.safeOutroAt<59);
});
test("digital silence tail is verified before trimming",()=>{
 const x=analyzeFrames(synthetic("silentTail"));
 assert.ok(x.confidentTail&&x.last>=59.5&&x.last<61);
});
test("soft but real musical intro stays intact",()=>{
 assert.equal(analyzeFrames(synthetic("softIntro")).safeIntroAt,0);
});
test("genuine silent intro may be skipped safely",()=>{
 assert.ok(analyzeFrames(synthetic("silentIntro")).safeIntroAt>2.5);
});
test("speculative iPhone early cut has been removed",()=>{
 assert.equal(source.includes("mobileSmartCut"),false);
 assert.ok(source.includes("plan.silenceTrim&&plan.trailing>=1.65"));
});

test("beat phase metadata is available without skipping the next intro",()=>{
 const withBeat={...current,safeOutroAt:172,beatAnchor:168.5,beatConfidence:.8};
 const withIntro={...next,introBeat:1.5,beatConfidence:.8,safeIntroAt:0};
 const plan=transition(withBeat,withIntro,180);
 assert.equal(plan.kind,"beat");
 assert.ok(plan.beatPeriod>0.25&&plan.beatPeriod<1);
 assert.equal(plan.beatAnchor,168.5);
 assert.equal(plan.nextBeat,1.5);
 assert.equal(plan.entry,0);
});
test("unmeasured beat phase does not invent alignment",()=>{
 const plan=transition({...current,safeOutroAt:172,beatConfidence:.15},next,180);
 assert.equal(plan.kind,"beat");
 assert.equal(plan.beatPeriod,null);
});
test("incompatible intro/outro notes never force a crossfade",()=>{
 const flat=[0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.90];
 const plan=transition({...current,safeOutroAt:172,outroChroma:flat},next,180);
 assert.equal(plan,null);
});
test("a late vocal cue protects the song even with a quiet ending",()=>{
 for(const timestamp of [173,175,178]){
  assert.equal(transition({...current,safeOutroAt:172,lastLyricAt:timestamp},next,180),null);
 }
});
test("the engine does not seek into low volume opening notes",()=>{
 assert.equal(source.includes("measured?.leading>=1.8"),false);
 assert.ok(source.includes("return musicalIntroEntry(measured)"));
});
test("iPhone leaves playback alone while app is in the background",()=>{
 assert.ok(source.includes("if(isIOS&&document.hidden)"));
 assert.ok(!source.includes("mobileSmartCut"));
});
test("local harmony is used for automatic queue order",()=>{
 assert.ok(source.includes("const notes=similarNotes(a,b);"));
 assert.ok(source.includes("const groove=grooveAgreement(a,b);"));
});

test("stereo song with audio only on right channel keeps full ending",()=>{
 const right=synthetic("loud").getChannelData(0);
 const left=new Float32Array(right.length);
 const b={sampleRate:8000,duration:64,numberOfChannels:2,
  getChannelData:channel=>channel?right:left};
 const info=analyzeFrames(b);
 assert.equal(info.confidentTail,false);
 assert.equal(info.safeOutroAt,null);
 assert.ok(info.last>63.5);
});

function createMobileMixFixture(){
 const a=source.indexOf("let mobileActive=null;");
 const b=source.indexOf("let prepared=null;",a);
 assert.ok(a>=0&&b>a);
 const block=source.slice(a,b);
 const engine=new Function("schedule",
  'const isIOS=true,document={hidden:false};let enabled=true,mobileOverlayEnabled=true;'+
  'const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));'+
  'const mobileIntroClips=new Map(),mobileOverlayFailures=new Map(),'+
   'cache=new Map([["previous.mp3",{duration:180,last:180,protectedEnding:false}]]);'+
   'let dspMode="auto",dspStrength=55,dspBass=0,dspMid=0,dspTreble=0;'+
   source.slice(source.indexOf("function connectMixDsp("),
    source.indexOf("\ntry{\n const stored=",source.indexOf("function connectMixDsp(")))+'\n'+
  'const deepLookup=()=>null,resetMobileFade=()=>{};'+
  source.slice(source.indexOf("function mobileMixAllowed("),
   source.indexOf("function rememberMobileClip("))+ '\n'+block+
  '\nreturn {startMobileMix,stopMobileMix,handoffMobileMix,finishMobileMix,'+
  'clips:mobileIntroClips,active:()=>mobileActive,'+
  'enabled:v=>mobileOverlayEnabled=v,hidden:v=>document.hidden=v};'
 )(()=>{});
 const gainValue={value:0,setValueAtTime(v){this.value=v},
  linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}};
 let stopped=false;
 const sourceNode={connect(){},start(){},stop(){stopped=true},disconnect(){}};
 const gainNode={gain:gainValue,connect(){},disconnect(){}};
 const ctx={currentTime:100,state:"running",destination:{},
  createBuffer:()=>({copyToChannel(){}}),
  createBufferSource:()=>sourceNode,createGain:()=>gainNode};
 const old={currentTime:174,paused:false,handlers:{},
  addEventListener(event,callback){this.handlers[event]=callback},
  removeEventListener(event){delete this.handlers[event]}};
 const song={id:"next",url:"sample.mp3"};
 const plan={kind:"beat",begin:172,fade:6,entry:0,safeOutroAt:172,end:180,quietCertified:true};
 let id="previous",native=old;const calls=[];
 const app={currentId:()=>id,mixNext:()=>song,mixRunningContext:()=>ctx,
  allTracks:()=>[{id:"previous",url:"previous.mp3"}],
  mixLyricCues:()=>({last:150}),
  mixUrl:track=>track.url,volume:()=>.8,audio:()=>native,
  mixHandoff:(trackId,at)=>{calls.push({trackId,at});return Promise.resolve()}};
 engine.clips.set(song.url,{start:0,rate:100,channels:[new Float32Array(1400)]});
 return {engine,ctx,old,song,plan,app,calls,
  setCurrent:v=>id=v,setNative:v=>native=v,isStopped:()=>stopped};
}
test("iPhone overlay uses an independent, bounded intro buffer",()=>{
 const f=createMobileMixFixture();
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 assert.equal(f.old.src,undefined);
 assert.ok(f.engine.active());
 assert.equal(typeof f.old.handlers.pause,"function");
 f.old.handlers.pause();
 assert.equal(f.engine.active(),null);
 assert.equal(f.isStopped(),true);
});
test("iPhone mixing falls back when context suspended, feature off or hidden",()=>{
 const f=createMobileMixFixture();
 f.ctx.state="suspended";
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),false);
 f.ctx.state="running";f.engine.enabled(false);
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),false);
 f.engine.enabled(true);f.engine.hidden(true);
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),false);
});
test("iPhone preview hands off at the current second, never song start",()=>{
 const f=createMobileMixFixture();
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 f.ctx.currentTime=105.98;
 f.old.currentTime=179.98;
 f.old.handlers.timeupdate();
 assert.equal(f.calls.length,1);
 assert.ok(f.calls[0].at>5.5&&f.calls[0].at<6.5);
 // The native target must really be seekable and buffered. Safari's
 // readyState 3 alone does not certify a distant playback position.
 const nextAudio={paused:false,readyState:3,seeking:false,
  currentTime:0,seekable:{length:1,start:()=>0,end:()=>180},
  buffered:{length:1,start:()=>0,end:()=>30},duration:180};
 f.setCurrent("next");f.setNative(nextAudio);
 f.engine.finishMobileMix(f.app);
 assert.ok(nextAudio.currentTime>5.5);
 assert.ok(f.engine.active()); // seek must settle
 f.engine.finishMobileMix(f.app); // verify current position
 assert.ok(f.engine.active()?.nativeSyncDone);
 f.engine.active().nativeSyncAt=Date.now()-400;
 nextAudio.currentTime+=.3;
 f.ctx.currentTime+=.3;
 f.engine.finishMobileMix(f.app);
 assert.equal(f.engine.active(),null);
});

test("iPhone leaves last 400ms of real audio intact during a DJ mix",()=>{
 const f=createMobileMixFixture();
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 f.old.currentTime=179.6;f.ctx.currentTime=105.6;
 f.old.handlers.timeupdate();
 assert.equal(f.calls.length,0,"must not switch 400ms before the last note");
 f.old.currentTime=179.98;f.ctx.currentTime=105.98;
 f.old.handlers.timeupdate();
 assert.equal(f.calls.length,1,"switch after measured last note");
 assert.ok(f.calls[0].at>5.9,"native successor follows preview clock");
});
test("iPhone natural EOF pause keeps an active preview playing",()=>{
 const f=createMobileMixFixture();
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 f.ctx.currentTime=106;f.old.currentTime=180;f.old.ended=true;
 f.old.handlers.pause();
 assert.equal(f.calls.length,1,"EOF is not an intentional user pause");
 assert.equal(f.engine.active()?.handingOff,true);
 assert.equal(typeof f.old.handlers.ended,"function");
 f.engine.stopMobileMix();
 assert.equal(f.old.handlers.ended,undefined,"ended listener is cleaned up");
});
test("desktop fallback crossfades the new decoder and never replays old audio",async()=>{
 const begin=source.indexOf("async function handoff(){");
 const end=source.indexOf("function mixCurve(",begin);
 assert.ok(begin>0&&end>begin);
 const old={paused:false,volume:0,readyState:4,currentTime:178,seekable:{length:1}};
 const preview={paused:false,seeking:true,readyState:4,currentTime:8,volume:.75};
 const nextNative={paused:false,seeking:false,readyState:4,currentTime:8,volume:.75,
   duration:200,seekable:{length:1}};
 let current="old",main=old,canceled=0,calls=0;
 const app={audio:()=>main,currentId:()=>current,mixNext:()=>({id:"next"}),
  volume:()=>.75,wantsPlayback:()=>true,mixAdoptHandoff:()=>null,
  mixHandoff:(id,at)=>{assert.equal(at,8);calls++;current=id;main=nextNative;return Promise.resolve()}};
 const act={original:old,upcoming:preview,track:{id:"next"},fromId:"old",entry:0,timer:null};
 const fn=new Function("app","act","onCancel",
  "let active=act,mixing=true;const isIOS=false;"+
  "const window={MusicBoxRoom:{isActive:()=>false}};"+
  "const bridge=()=>app,stopSnapPrecision=()=>{},toast=()=>{};"+
  "const cancel=()=>{onCancel();active=null};"+
  "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
  source.slice(begin,end)+"return handoff;")(app,act,()=>canceled++);
 await fn();
 assert.equal(calls,1);
 assert.equal(canceled,1);
 assert.equal(old.volume,0,"outgoing audio stays silent");
 assert.equal(nextNative.volume,.75,"new player reaches requested volume");
 assert.ok(preview.volume<=.1,"DJ preview fades out to the new native player");
 assert.equal(main,nextNative);
});

test("iPhone lock screen cleanup is hooked directly to visibilitychange",()=>{
 assert.ok(source.includes('document.addEventListener("visibilitychange"'));
 assert.ok(source.includes('if(document.hidden){\n   // This event still fires'));
 assert.ok(source.includes('stopMobileMix();\n   resetMobileFade();'));
});

test("timed lyrics allow a full-volume instrumental outro if final vocals ended well before",()=>{
 const plan=transition({...current,safeOutroAt:null,lastLyricAt:151},next,180);
 assert.ok(plan);
 assert.equal(plan.kind,"beat");
 assert.ok(plan.begin>=171&&plan.end>=179);
});
test("sustained near-end karaoke remains protected",()=>{
 const plan=transition({...current,safeOutroAt:null,lastLyricAt:171},next,180);
 assert.equal(plan,null);
});
test("mobile DJ failed-start cooldown is installed",()=>{
 assert.ok(source.includes("mobileOverlayFailures.set(pair,Date.now()+30000)"));
 assert.ok(source.includes("clockStep<.025"));
});

test("iPhone foreground seeking cancels overlay without touching native source",()=>{
 const f=createMobileMixFixture();
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 f.old.handlers.seeking();
 assert.equal(f.engine.active(),null);
 assert.equal(f.old.src,undefined);
});
test("iPhone audio-clock drift blocks a corrupted seek into the next song",()=>{
 const f=createMobileMixFixture();
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 f.ctx.currentTime=101;
 f.old.currentTime=179.98;
 f.old.handlers.timeupdate();
 assert.equal(f.calls.length,0);
 assert.equal(f.engine.active(),null);
});

test("iPhone EQ lowers incoming bass first and restores it progressively",()=>{
 const f=createMobileMixFixture();
 const frequency={initial:0,final:0,setValueAtTime(v){this.initial=v},
  exponentialRampToValueAtTime(v){this.final=v}};
 f.ctx.createBiquadFilter=()=>({type:"",frequency,connect(){},disconnect(){}});
 assert.equal(f.engine.startMobileMix(f.song,
  {...f.plan,measuredBeatBridge:true},f.app,f.old),true);
 assert.equal(f.engine.active().dspNodes[0].type,"highpass");
 assert.ok(frequency.initial>=150,"incoming bass starts attenuated");
 assert.ok(frequency.final<=50,"incoming bass opens up by the end");
 f.engine.stopMobileMix();
});
test("iPhone EQ unavailability must not stop the native audio or the safe overlay",()=>{
 const f=createMobileMixFixture();
 f.ctx.createBiquadFilter=()=>{throw Error("filter unavailable")};
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 assert.ok(f.engine.active());
 assert.equal(f.old.src,undefined);
 f.engine.stopMobileMix();
});

test("iPhone refuses an energetic outro even if lyrics end early",()=>{
 const f=createMobileMixFixture();
 const loud={...f.plan,quietCertified:false};
 assert.equal(f.engine.startMobileMix(f.song,loud,f.app,f.old),false);
 assert.equal(f.engine.active(),null);
});
test("desktop still may mix a lyric-certified energetic instrumental ending",()=>{
 const planned=transition({...current,safeOutroAt:null,lastLyricAt:151},next,180);
 assert.equal(planned.kind,"beat");
 assert.equal(planned.quietCertified,false);
});

test("a safe short 2.8-second blend can start on iPhone",()=>{
 const f=createMobileMixFixture();
 const soft={...f.plan,kind:"soft",fade:2.8};
 f.old.currentTime=177.2;
 assert.equal(f.engine.startMobileMix(f.song,soft,f.app,f.old),true);
 assert.ok(f.engine.active());
 f.engine.stopMobileMix();
});
test("a late mobile mix cannot start with less than two seconds remaining",()=>{
 const f=createMobileMixFixture();
 f.old.currentTime=178.9;
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),false);
 assert.equal(f.engine.active(),null);
});
test("beat phase scheduling is capped to less than one-quarter second",()=>{
 const f=createMobileMixFixture();
 const p={...f.plan,beatPeriod:.5,beatAnchor:175.17,nextBeat:0};
 assert.equal(f.engine.startMobileMix(f.song,p,f.app,f.old),true);
 assert.ok(f.engine.active().started>=100);
 assert.ok(f.engine.active().started<=100.23);
 assert.ok(f.engine.active().started>100.1);
 f.engine.stopMobileMix();
});
test("iPhone prioritizes the incoming intro before shuffle candidates",()=>{
 const decoding=source.indexOf('decode(next,true).catch(()=>{})');
 const shuffle=source.indexOf('maybeReorderShuffle(app,audio,id);');
 // The optional MP3 decode now follows queue planning and is gated by
 // stable Safari buffering rather than racing the very first play().
 assert.ok(shuffle>=0&&decoding>shuffle);
 assert.ok(source.includes('mobileMixAllowed(plan,nowInfo'));
 assert.ok(source.includes('mobileClipWindow(audio)'));
 assert.ok(source.includes('cachedMobileAnalysis(next).then(value=>'));
});
test("iPhone readiness indicators distinguish preparing from an unsafe outro",()=>{
 assert.ok(source.includes('function updateMobileStatus()'));
 assert.ok(source.includes("Preparo l'intro del prossimo brano senza fermare la canzone."));
 assert.ok(source.includes("Finale non sicuro per una sovrapposizione su iPhone"));
});
test("Safari can resume an audio context on later user gestures",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.ok(appSource.includes('_audioProno && _mixContextAttivo()'));
 assert.ok(appSource.includes('window.addEventListener(ev, _preparaAudio, { passive: true })'));
});

test("manual Fade and Rise on iPhone both produce a real overlay on a safe ending",()=>{
 for(const kind of ["fade","rise"]){
  const f=createMobileMixFixture();
  const plan={...f.plan,kind,fade:6};
  assert.equal(f.engine.startMobileMix(f.song,plan,f.app,f.old),true,kind);
  assert.ok(f.engine.active());
  f.engine.stopMobileMix();
 }
});
test("iPhone Rise fades in slower than Fade and both reach the requested target",()=>{
 function measure(kind){
  const f=createMobileMixFixture();
  let recorded=null;
  const param={value:0,setValueAtTime(v){this.value=v},
   linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){},
   setValueCurveAtTime(shape){recorded=[...shape]}};
  f.ctx.createGain=()=>({gain:param,connect(){},disconnect(){}});
  assert.equal(f.engine.startMobileMix(f.song,{...f.plan,kind},f.app,f.old),true);
  assert.ok(recorded&&recorded.length===48);
  f.engine.stopMobileMix();
  return recorded;
 }
 const fade=measure("fade"),rise=measure("rise"),beat=measure("beat");
 assert.ok(rise[12]<fade[12]);
 assert.ok(beat[12]>fade[12]);
 assert.ok(Math.abs(rise[47]-fade[47])<1e-5);
});
test("short safe soft transitions now get at least two seconds to be heard",()=>{
 const plan=transition({...current,safeOutroAt:177},next,180);
 assert.equal(plan.kind,"soft");
 assert.ok(plan.fade>=2.35);
});
test("do not allow a phone fade over an unverified sung ending",()=>{
 const f=createMobileMixFixture();
 const bad={...f.plan,kind:"fade",quietCertified:false};
 assert.equal(f.engine.startMobileMix(f.song,bad,f.app,f.old),false);
});

test("200 variable-length outro transitions never start before certified safe music",()=>{
 let seed=123456789;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<200;i++){
  const duration=75+Math.floor(rand()*280);
  const safe=duration-2.5-rand()*13;
  const bpm=65+Math.floor(rand()*140);
  const lastLyricAt=i%3===0?duration-3-rand()*20:undefined;
  const a={...current,duration,last:duration,safeOutroAt:safe,bpm,lastLyricAt,
   beatAnchor:duration-5};
  const b={...next,bpm:bpm*(i%2===0?1:1.08)};
  const plan=transition(a,b,duration);
  if(!plan)continue;
  assert.ok(Number.isFinite(plan.begin)&&Number.isFinite(plan.end));
  assert.ok(plan.begin>=safe-.001);
  assert.ok(plan.end<=duration+.001);
  assert.ok(plan.begin<=plan.end);
  assert.ok(plan.entry>=0&&plan.entry<=18);
  if(Number.isFinite(lastLyricAt)&&duration-lastLyricAt<12)
   assert.equal(plan.kind,"cut");
 }
});

test("obsolete iPhone preparation never blacklists a valid MP3",()=>{
 assert.ok(source.includes('const STALE_MOBILE_PREVIEW=Symbol('));
 assert.ok(source.includes('if(needClip&&bridge()?.mixNext?.()?.id!==track.id)'));
 assert.ok(source.includes('if(data===STALE_MOBILE_PREVIEW)return null'));
});

test("last audible musical note is preserved even if pitches match",()=>{
 const h=[.24,.16,.12,.11,.08,.08,.06,.04,.03,.03,.025,.025];
 const a={...current,safeOutroAt:172,outroNotes:h,lastNoteAt:178};
 const b={...next,introNotes:h};
 const plan=transition(a,b,180);
 assert.ok(plan&&plan.kind==="beat"&&plan.end>=179.9);
});
test("different dominant note signatures prevent a distracting crossfade",()=>{
 const h=[.24,.16,.12,.11,.08,.08,.06,.04,.03,.03,.025,.025];
 const d=[.02,.03,.01,.02,.02,.03,.01,.08,.02,.02,.70,.04];
 assert.equal(transition({...current,safeOutroAt:172,outroNotes:h},
  {...next,introNotes:d},180),null);
});
test("lyrics continuing into a final note are never cut mid phrase",()=>{
 assert.equal(transition({...current,safeOutroAt:172,lastNoteAt:178,lastLyricAt:174},next,180),null);
});
test("an uncertified loud ending cannot be chopped before last note",()=>{
 assert.equal(transition({...current,safeOutroAt:null,lastNoteAt:178},next,180),null);
});

test("dedicated singing detection prevents cutting an ongoing vocal phrase",()=>{
 const plan=transition({...current,safeOutroAt:172,lastVoiceAt:175},next,180);
 assert.equal(plan,null);
});
test("an early vocal detection on the following track rules out long beat overlaps",()=>{
 const plan=transition({...current,safeOutroAt:172},{...next,firstVoiceAt:0},180);
 assert.equal(plan.kind,"soft");
});
test("an earlier finished vocal is compatible with a confirmed instrumental outro",()=>{
 const plan=transition({...current,safeOutroAt:172,lastVoiceAt:140},next,180);
 assert.ok(plan&&plan.kind==="beat");
});
test("a detected vocal near a last note prevents cutting just ahead of that note",()=>{
 const plan=transition({...current,safeOutroAt:172,lastVoiceAt:176,lastNoteAt:178},next,180);
 assert.equal(plan,null);
});
test("dedicated model is asynchronous so audio decoding is not delayed by model download",()=>{
 assert.ok(source.includes("voice?.analyze&&mayScanDesktopVoice(bridge(),track)"));
 assert.ok(source.includes("await new Promise(resolve=>setTimeout(resolve,4500))"));
 assert.ok(source.includes("plannedFor=\"\";plan=null;"));
});

test("a last-note onset is never permission to truncate a track",()=>{
 const plan=transition({...current,safeOutroAt:172,lastNoteAt:179},next,180);
 assert.ok(plan&&plan.end>179.9);
});

test("iPhone next-song preload cache matches service worker's per-profile cache",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 assert.ok(app.includes('caches.open("spotifynonavraiimieisoldi-prefetch-" + profile)'));
 assert.ok(sw.includes('function cachePrefetchName(p) { return CACHE_PREFIX + "-prefetch-" + p; }'));
 assert.ok(sw.includes("cachePrefetchName(profile)"));
});
test("iPhone lock-screen fallback keeps native music rather than forcing WebAudio",()=>{
 assert.ok(source.includes("if(isIOS&&document.hidden){"));
 assert.ok(source.includes("if(mobileActive)stopMobileMix();"));
 assert.ok(source.includes("Leave the native"));
});

test("voice detected earlier in song must not cancel an active desktop mix",()=>{
 const start=source.indexOf("function voiceThreatensPlan(");
 const stop=source.indexOf("// Read lightweight saved analysis",start);
 assert.ok(start>=0&&stop>start);
 const risk=new Function(source.slice(start,stop)+"\nreturn voiceThreatensPlan")();
 const plan={begin:176,end:179.9,kind:"phrase"};
 assert.equal(risk({lastVoiceAt:140},true,false,plan),false);
 assert.equal(risk({lastVoiceAt:null},true,false,plan),false);
 assert.equal(risk({lastVoiceAt:178},true,false,plan),true);
 assert.equal(risk({firstVoiceAt:24},false,true,plan),false);
 assert.equal(risk({firstVoiceAt:0.5},false,true,plan),true);
 assert.equal(risk({lastVoiceAt:178},true,false,null),false);
 const underlay={vocalBeatUnderlay:true,fade:8,entry:3,tempo:1.025,vocalEndAt:180};
 assert.equal(risk({firstVoiceAt:11.7},false,true,underlay),true);
 assert.equal(risk({firstVoiceAt:12},false,true,underlay),false);
 assert.equal(risk({firstVoiceAt:8.7},false,true,{...underlay,entry:0,tempo:.975}),false);

});
test("PC preloads the next MP3 early rather than missing the mixing window",()=>{
 assert.ok(source.includes("Math.min(plan.begin-28,audio.duration-45)"));
 assert.ok(source.includes("if(previewAllowed&&!isIOS&&plan.kind!==\"cut\""));
});
test("late vocal model result does not forcibly reset an in-progress handoff",()=>{
 assert.ok(source.includes("if(!mixing&&!active&&!mobileActive){"));
 assert.ok(source.includes("if(voiceThreatensPlan(v,currentTrack,nextTrack,plan)&&"));
});

test("a late first loud onset cannot delete a quiet pickup without original digital-silence proof",()=>{
 const code=source.slice(source.indexOf("function musicalIntroEntry("),
  source.indexOf("function rhythmicFullTailJoin("));
 const entry=new Function("const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+code+
  "return musicalIntroEntry;")();
 assert.equal(entry({safeIntroAt:0,first:5.5,introDrive:.8,beatConfidence:.25}),0);
 assert.equal(entry({safeIntroAt:0,first:5.5,introDrive:.12,beatConfidence:.25}),0);
 assert.equal(entry({safeIntroAt:0,first:5.5,introDrive:.8,beatConfidence:.25,firstLyricAt:2}),0);
 const sha='f'.repeat(40),b={sha,safeIntroAt:5.38,first:5.5,introDrive:.8,beatConfidence:.25,
  musicalContent:{leadingDigitalSilence:{sourceSha:sha,method:'original-stereo-peak-prefix-v1',sampleRate:48000,through:5.38,maximumPeak:0}}};
 assert.equal(entry(b),5.38);
 b.musicalContent.leadingDigitalSilence.sourceSha='a'.repeat(40);assert.equal(entry(b),0);
});
test("late vocals veto the join; matched protected endings keep every audible beat",()=>{
 const code=source.slice(source.indexOf("function rhythmicFullTailJoin("),
  source.indexOf("function hasImmediateMusicalIntro("));
 const run=new Function("const isIOS=false,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
  "const hasReliableHarmony=a=>Array.isArray(a)&&a.length===12;"+
  "const grooveAgreement=()=>({score:.90});"+
  "const similarNotes=()=>({matches:true,focused:.86,phrase:.78,alignment:{matches:true}});"+
  "const camelotMatch=()=>({weight:.1,score:.5});"+
  "const musicalIntroEntry=()=>0,beatBearingIntro=(b,min)=>b.introDrive>=min;"+code+"return rhythmicFullTailJoin;")();
 const notes=Array(12).fill(.10);
 const a={duration:180,last:179.9,bpm:120,beatConfidence:.23,
  protectedEnding:false,outroFinalNotes:notes};
 const b={bpm:122,beatConfidence:.22,introDrive:.8,introAttackNotes:notes};
 const p=run(a,b,180);
 assert.equal(p.kind,"snap");assert.ok(p.rhythmicUnderlay);
 assert.ok(p.end>=179.9&&p.end<=180&&p.fade<=1.05);
 assert.equal(run({...a,lastLyricAt:178},b,180),null);
 assert.equal(run({...a,lastVoiceAt:179},b,180),null);
 const protectedPlan=run({...a,protectedEnding:true},b,180);
 assert.equal(protectedPlan?.kind,"snap");
 assert.ok(protectedPlan.preserveTail&&!protectedPlan.silenceTrim);
 assert.ok(protectedPlan.end>=179.9,"loud final drum must play through");
 assert.equal(run(a,{...b,firstVoiceAt:.3},180),null);
});
test("optional vocal ML is not started for every shuffled preview",()=>{
 assert.ok(source.includes("voice?.analyze&&mayScanDesktopVoice(bridge(),track)"));
 assert.ok(source.includes("voiceJobs.size===0&&!voiceJobs.has(key)"));
});

test("desktop continuity exists when strict beat analysis returns zero matches",()=>{
 const c=source.slice(source.indexOf("function continuityFallback("),
   source.indexOf("function hasImmediateMusicalIntro("));
 assert.ok(c.length>300,"fallback must be in the production DJ file");
 const desktop=new Function("const isIOS=false,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));"+
  "const musicalIntroEntry=t=>t?.safeIntroAt||0;"+c+
  "return continuityFallback;")();
 const mobile=new Function("const isIOS=true,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));"+
  "const musicalIntroEntry=t=>t?.safeIntroAt||0;"+c+
  "return continuityFallback;")();
 const fallback=desktop(null,null,249);
 assert.equal(fallback.kind,"continuity");
 assert.equal(fallback.continuityFallback,true);
 assert.equal(fallback.score,null,"not a fabricated certified beat");
 assert.ok(fallback.begin>=246&&fallback.end>=248.8);
 assert.ok(fallback.fade>=2.4&&fallback.fade<=2.6);
 assert.equal(fallback.silenceTrim,false,"never cut unknown music");
 assert.equal(mobile(null,null,249),null,"do not disrupt Safari native player");
 const protectedEnd=desktop({duration:249,last:243,confidentTail:true,
  protectedEnding:true,lastLyricAt:246},null,249);
 assert.equal(protectedEnd.silenceTrim,false);
 assert.ok(protectedEnd.end>=248.8,"protect final singing and music");
 const silent=desktop({duration:249,last:243,confidentTail:true,
  protectedEnding:false,lastLyricAt:210},null,249);
 assert.equal(silent.silenceTrim,true);
 assert.ok(silent.end>=243&&silent.end<245);
 assert.equal(desktop({duration:190},null,249),null,"duration mismatch");
});
test("continuity overlay is audible before EOF while preserving outgoing vocal",()=>{
 const begin=source.indexOf("if(act.continuityFallback){");
 const end=source.indexOf("const correction=1+(act.gain-1)",begin);
 assert.ok(begin>0&&end>begin);
 const curve=new Function("time","const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));"+
  "const act={continuityFallback:true};let outGain=1,inGain=0;"+
  source.slice(begin,end)+"return {outGain,inGain};");
 assert.ok(curve(.5).outGain>.999);
 assert.ok(curve(.5).inGain>0&&curve(.5).inGain<.18);
 assert.ok(curve(.9).inGain>.5);
 assert.ok(curve(.9).outGain<.9);
 assert.ok(curve(1).outGain<.001&&curve(1).inGain>.99);
});
test("the DJ preplans continuity and retries failed desktop previews",()=>{
 assert.ok(source.includes("const weakIphoneMatch=isIOS&&candidate&&"));
 assert.ok(source.includes("plan=(weakIphoneMatch||weakDesktopMatch)?"));
 assert.ok(source.includes("certifiedQuietAlternative"),"uncertified beat must degrade to measured quiet fade, never a fake beat");
 assert.ok(source.includes("continuityFallback(currentAnalysis,nextAnalysis,audio.duration):null"));
 assert.ok(source.includes("plan=null;"),"unmeasured outro must not trigger a speculative fade");
 assert.ok(!source.includes("plan=isIOS?null:continuityFallback(null,null,duration)"));
 assert.ok(source.includes("(prepared.failed&&Date.now()-(prepared.failedAt||0)>=11000)"));
});


test("natural EOF switches to the prebuffered MP3 without losing the last beat",async()=>{
 const begin=source.indexOf("function naturalEndHandoff(");
 const end=source.indexOf("async function handoff(){",begin);
 assert.ok(begin>0&&end>begin,"DJ natural-finish bridge missing");
 let playing=0,adopted=0,fallback=0,current="old";
 const preview={readyState:4,paused:true,play:async()=>{
   preview.paused=false;playing++;
 },pause:()=>{preview.paused=true}};
 const old={ended:true};
 const app={audio:()=>old,currentId:()=>current,mixNext:()=>({id:"next"}),
  volume:()=>.8,mixAdoptHandoff:(id,a)=>{
   assert.equal(id,"next");assert.equal(a,preview);adopted++;current="next";
   return Promise.resolve(true);
  },mixHandoff:()=>{fallback++}};
 const fixture=new Function("app","preview",
  "let prepared={id:'next',fromId:'old',audio:preview,ready:true,failed:false};"+
  "const enabled=true,isIOS=false,mixing=false,active=null,"+
   "window={MusicBoxRoom:{isActive:()=>false}};"+
  "const bridge=()=>app,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
  source.slice(begin,end)+
  "return {run:naturalEndHandoff,prepared:()=>prepared};"
 )(app,preview);
 assert.equal(fixture.run(),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(playing,1);assert.equal(adopted,1);assert.equal(fallback,0);
 assert.equal(fixture.prepared(),null);
 assert.equal(preview.volume,.8);
});

test("preloaded next MP3 seeks only a certified digital intro and waits for seeked",()=>{
 const begin=source.indexOf("function certifiedNaturalIntroEntry(");
 const end=source.indexOf("// No verified musical match:",begin);
 assert.ok(begin>0&&end>begin);
 class FakeAudio{
  constructor(){this.readyState=0;this.seeking=false;this._time=0;this.listeners={};}
  addEventListener(name,fn){(this.listeners[name]||=[]).push(fn)}
  emit(name){for(const fn of this.listeners[name]||[])fn()}
  set currentTime(v){this._time=v;this.seeking=true}
  get currentTime(){return this._time}
  load(){this.readyState=1;this.emit("loadedmetadata");this.readyState=4;this.emit("canplay")}
  finishSeek(){this.seeking=false;this.emit("seeked");this.emit("canplay")}
  pause(){}
  removeAttribute(){}
 }
 const sha='a'.repeat(40);
 const records=new Map([["next.mp3",{sha,safeIntroAt:3.12,first:3.24,introDrive:.8,
  musicalContent:{leadingDigitalSilence:{sourceSha:sha,method:'original-stereo-peak-prefix-v1',sampleRate:48000,through:3.12,maximumPeak:0}}}]]);
 const harness=new Function("Audio","cache",
  "let prepared=null,plan=null;const isIOS=false;const deepLookup=()=>null;"+
  "const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+
  source.slice(source.indexOf('function musicalIntroEntry('),source.indexOf('function rhythmicFullTailJoin('))+
  "const dropPrepared=()=>{prepared=null};"+
  source.slice(begin,end)+
  "return {prepare,entry:certifiedNaturalIntroEntry,get:()=>prepared,"+
  "setPlan:v=>{plan=v}};"
 )(FakeAudio,records);
 const app={mixUrl:t=>t.url};
 const song={id:"next",url:"next.mp3"};
 assert.ok(Math.abs(harness.entry(song,app)-3.12)<.01);
 harness.prepare(song,"old",app);
 const p=harness.get();
 assert.equal(p.audio.currentTime,3.12);
 assert.equal(p.ready,false,"do not promote a seek-in-progress to playable");
 p.audio.finishSeek();
 assert.equal(p.ready,true);
 assert.equal(p.seekReady,true);
 // Later-arriving beat analysis must update the SAME buffered MP3 in
 // advance and must not turn a musical cue into an unsafe EOF skip.
 harness.setPlan({kind:"beat",entry:1.62});
 harness.prepare(song,"old",app);
 assert.equal(harness.get(),p,"never re-download prebuffered audio");
 assert.equal(p.audio.currentTime,1.62);
 assert.equal(p.ready,false,"wait for the new seeked event");
 assert.equal(p.eofSafe,false);
 p.audio.finishSeek();
 assert.equal(p.ready,true);
 harness.setPlan(null);
 harness.prepare(song,"old",app);
 assert.equal(harness.get(),p);
 assert.equal(p.audio.currentTime,3.12);
 assert.equal(p.ready,false);
 p.audio.finishSeek();
 assert.equal(p.ready,true);
 assert.equal(p.eofSafe,true);
 const voiced={id:"voice",url:"voice.mp3"};
 records.set("voice.mp3",{safeIntroAt:0,first:.1});
 assert.equal(harness.entry(voiced,app),0,"never skip a genuine first note");
 records.set("voice.mp3",{safeIntroAt:3,first:2.1});
 assert.equal(harness.entry(voiced,app),0,"never seek past an audible introduction");
 records.set("voice.mp3",{sha,safeIntroAt:3.12,first:3.24,introDrive:.8});
 assert.equal(harness.entry(voiced,app),0,"prebuffering cannot treat an energy threshold as proof of digital silence");
});

test("digital silence can adopt buffered next MP3 early, but not before the LAST audible sound",async()=>{
 const begin=source.indexOf("function naturalEndHandoff(");
 const end=source.indexOf("async function handoff(){",begin);
 const guardStart=source.indexOf("function certifiedTailSkip(");
 const guardEnd=source.indexOf("// A complete MP3 analysis",guardStart);
 assert.ok(begin>0&&end>begin&&guardStart>0&&guardEnd>guardStart);
 const analysis={duration:200,last:195,confidentTail:true,lastVoiceAt:178,lastLyricAt:175};
 let current="old",adopted=0,fallback=0;
 const old={ended:false,paused:false,duration:200,currentTime:194.9,
  pause(){this.paused=true}};
 const preview={readyState:4,currentTime:3.12,paused:true,
  async play(){this.paused=false},pause(){this.paused=true}};
 const app={audio:()=>old,currentId:()=>current,mixNext:()=>({id:"next"}),
  allTracks:()=>[{id:"old",url:"old.mp3"}],mixUrl:t=>t.url,
  mixLyricCues:()=>({last:175}),volume:()=>.65,
  mixAdoptHandoff:(id,node)=>{assert.equal(node,preview);
   assert.equal(id,"next");adopted++;current=id;return Promise.resolve(true)},
  mixHandoff:()=>{fallback++}};
 const fixture=new Function("app","preview","cache",
  "let prepared={id:'next',fromId:'old',audio:preview,ready:true,failed:false,"+
   "naturalEntry:3.12,seekReady:true};"+
  "const enabled=true,isIOS=false,mixing=false,active=null,"+
  "window={MusicBoxRoom:{isActive:()=>false}};"+
  "const bridge=()=>app,deepLookup=()=>null,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
  source.slice(guardStart,guardEnd)+source.slice(begin,end)+
  "return {run:naturalEndHandoff,get:()=>prepared};"
 )(app,preview,new Map([["old.mp3",analysis]]));
 assert.equal(fixture.run(true),false,"keep the last .1s music");
 old.currentTime=195.30;
 assert.equal(fixture.run(true),true,"only verified digital silence may be bypassed");
 assert.equal(fixture.run(),true,"ignore duplicated ended event while adopting");
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(adopted,1);assert.equal(fallback,0);
 assert.equal(preview.currentTime,3.12);
 assert.equal(old.paused,true);
 assert.equal(fixture.get(),null);
});

test("native EOF remains available when no next preview is ready",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.ok(app.includes("if (window.MusicBoxMix?.naturalEndHandoff?.()) return;"));
 assert.match(source,/p\.audio\?\.readyState<2\|\|/);
 assert.ok(source.includes("try{incoming.pause()}catch(_){}"));
 assert.ok(!source.includes("caches.delete("));
});

test("DJ handoff keeps its already playing decoded audio instead of loading same MP3 again",async()=>{
 const start=source.indexOf("async function handoff(){");
 const end=source.indexOf("function mixCurve(",start);
 assert.ok(start>0&&end>start);
 const old={paused:false,volume:0,pauseCount:0,
  pause(){this.paused=true;this.pauseCount++},
  removeAttribute(){this.srcRemoved=true},load(){this.cleared=true}};
 const live={paused:false,seeking:false,readyState:4,currentTime:3.4,volume:.08,
  src:"https://example.com/song.mp3"};
 const act={original:old,fromId:"out",upcoming:live,
  track:{id:"next"},entry:0,fade:2.55,timer:null};
 let current="out",main=old,adopted=0,ordinary=0,stoppedPrecision=0,revealed=0;
 const app={audio:()=>main,currentId:()=>current,
  mixNext:()=>({id:"next"}),volume:()=>.25,
  mixAdoptHandoff:(id,elem)=>{
   adopted++;current=id;main=elem;return Promise.resolve(true);
  },
  mixHandoff:()=>{ordinary++;throw new Error("refetch would interrupt audio")}};
 const harness=new Function("app","act","stopSnapPrecision","revealAdoptedMixAudio",
  "let active=act,mixing=true;const isIOS=false;"+
  "const window={MusicBoxRoom:{isActive:()=>false}};"+
  "const bridge=()=>app;const releaseDesktopDsp=()=>{};"+
  "const cancel=()=>{throw Error('must not cancel adopted preview')};"+
  source.slice(start,end)+
  "return {handoff,state:()=>({active,mixing})};"
 )(app,act,()=>stoppedPrecision++,(_audio,id,at)=>{
  revealed++;assert.equal(_audio,live);assert.equal(id,"next");assert.equal(at,.08);
 });
 await harness.handoff();
 assert.equal(adopted,1,"adopt preloaded audio instead of downloading again");
 assert.equal(ordinary,0);
 assert.equal(main,live,"live, already playing preview must become main audio");
 assert.equal(live.paused,false,"the audible source must not be paused");
 assert.equal(live.currentTime,3.4,"no second seek");
 assert.equal(old.pauseCount,1,"old song should be discarded only after adoption");
 assert.ok(old.cleared);
 assert.equal(harness.state().active,null);
 assert.equal(harness.state().mixing,false);
 assert.equal(stoppedPrecision,1);
 assert.equal(revealed,1,"successful native handoff must restore the new audio volume");
});
test("automatic handoff seek does not cancel audible preview; manual seeking does",()=>{
 const beg=source.indexOf("onSeek:(reason)=>");
 const end=source.indexOf("onTrackChange:(id)=>",beg);
 assert.ok(beg>0&&end>beg);
 const snippet=source.slice(beg,end).trim().replace(/,\s*$/,"");
 const counters={canceled:0,aborted:0};
 const active={handingOff:true,track:{id:"next"}};
 const fn=new Function("counters","active",
  "const mobileActive=null,bridge=()=>({currentId:()=>\"next\"});"+
  "let plan={},plannedFor='next',previousId='old';"+
  "let planEpoch=2,planRetryAt=30000,planRetryCount=3,lastPlanMissing=true;"+
  "let seekRecoveryUntil=0,lastSeekCancelledAt=0,lastSeekCancelledTrack='';"+
  "let shuffleGeneration=0,shuffleBusy=true,shuffleRunFor='old';"+
  "const abortObsoleteDJWork=()=>{counters.aborted++};"+
  "const cancel=()=>{counters.canceled++};"+
  "return ({"+snippet+"}).onSeek;"
 )(counters,active);
 fn("media");
 assert.equal(counters.canceled,0);
 assert.equal(counters.aborted,0);
 fn("user");
 assert.equal(counters.canceled,1);
 assert.equal(counters.aborted,1);
});
test("Music Box app hands the prebuffered MP3 to its ordinary player without a fresh source or seek",()=>{
 const code=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.ok(code.includes("function createAudio() {"));
 assert.ok(code.includes("const existing = arguments.length ? arguments[0] : null;"));
 assert.ok(code.includes("audio = createAudio(liveDjAudio)"));
 assert.ok(code.includes("if (!_adottaDj) _assegnaAudioSorgente(audio,_url)"));
 assert.ok(code.includes("if (!_adottaDj && startAt > 0 && Number.isFinite(startAt))"));
 assert.ok(code.includes("mixAdoptHandoff:(id,liveAudio)=>"));
 assert.ok(code.includes('window.MusicBoxMix?.onSeek?.("media")'));
 assert.equal((code.match(/window\.MusicBoxMix\?\.onSeek\?\.\("user"\)/g)||[]).length,3);
});

test("desktop compares both chord changes and drum grooves, not BPM alone",()=>{
 const start=source.indexOf("function desktopBeatPairCertified(");
 const end=source.indexOf("function iphoneQuietReleaseCertified(",start);
 const check=new Function(
  "const similarNotes=(a,b)=>b.notes;"+
  "const grooveAgreement=(a,b)=>b.groove;"+
  "const onsetPairAgreement=()=>({certified:true});"+
  "const camelotMatch=(a,b)=>b.key;"+
  "const beatBearingIntro=(b,min)=>b.introDrive>=min;"+
  source.slice(start,end)+"return desktopBeatPairCertified;")();
 const a={bpm:126,beatConfidence:.55,last:180};
 const b={bpm:127,beatConfidence:.52,introDrive:.8,
  notes:{matches:true,focused:.88,phrase:.78,alignment:{
   matches:true,score:.85,weakest:.7}},
  groove:{score:.87,correlation:.74},key:{weight:.2,score:.86}};
 const cue={kind:"snap",measuredBeatBridge:true,begin:179.2,end:179.92,fade:.72};
 assert.equal(check(a,b,cue),true);
 assert.equal(check(a,{...b,groove:{score:.7,correlation:.4}},cue),false);
 assert.equal(check(a,{...b,notes:{...b.notes,matches:false}},cue),false);
 assert.equal(check(a,{...b,notes:{...b.notes,alignment:{score:.6,matches:false,weakest:.4}}},cue),false);
 assert.equal(check(a,{...b,bpm:147},cue),false);
 assert.equal(check(a,b,{kind:"soft"}),true);
});
test("desktop waits for an aligned beat instead of starting outside phase",()=>{
 const i=source.indexOf("function desktopBeatStartDelay(");
 const j=source.indexOf("async function beginMix(",i);
 const delay=new Function(source.slice(i,j)+"return desktopBeatStartDelay;")();
 const p={kind:"beat",end:104,beatPeriod:.5,beatAnchor:100,nextBeat:.1};
 assert.ok(Math.abs(delay(p,98.5)-.4)<.0001);
 assert.equal(delay({...p,kind:"snap",end:99},98.5),null);
 assert.equal(delay({...p,beatPeriod:null},98.5),null);
 assert.equal(delay({...p,kind:"soft"},98.5),0);
});
test("desktop runtime does not force an unverified beat overlap",()=>{
 assert.ok(source.includes("weakDesktopMatch=!isIOS&&candidate&&"));
 assert.ok(source.includes("desktopBeatPairCertified(currentAnalysis,nextAnalysis,candidate)"));
 assert.ok(source.includes("scored.length?scored:partialScored.length?partialScored:impactScored.length?impactScored:"));
});

test("onset fingerprint must prove a rhythmic join; mismatched drums never qualify",()=>{
 const i=source.indexOf("function onsetPairAgreement(");
 const j=source.indexOf("function iphoneBeatPairCertified(",i);
 assert.ok(i>0&&j>i);
 const compare=new Function(source.slice(i,j)+"return onsetPairAgreement;")();
 const pulse=Array.from({length:96},(_,k)=>k%17===0?2.2:
  k%11===0?1.1:k%5===0?.4:-.4);
 const wrong=Array.from({length:96},(_,k)=>k%17===6?2.2:
  k%11===3?1.1:k%5===2?.4:-.4);
 assert.equal(compare({outroOnset:pulse},{introOnset:pulse})?.certified,true);
 assert.equal(compare({outroOnset:pulse},{introOnset:wrong})?.certified,false);
 assert.equal(compare({outroOnset:pulse},{introOnset:null}),null);
 assert.equal(compare({outroOnset:pulse},{introOnset:Array(96).fill(0)}),null);
 const late=Array.from({length:96},(_,k)=>k<9?0:pulse[k-9]);
 assert.equal(compare({outroOnset:pulse},{introOnset:late})?.certified,false,
  "even a similar rhythm cannot require a >300ms playback jump");
});

test("a subsecond iPhone snap actually waits for the next aligned beat",()=>{
 const f=createMobileMixFixture();
 f.old.currentTime=179.15;
 const p={...f.plan,kind:"snap",begin:179.05,end:180,fade:.95,
  measuredBeatBridge:true,preserveTail:true,voiceVerifiedMicroBridge:true,
  grooveScore:.85,score:83,beatPeriod:.5,beatAnchor:179.32,nextBeat:0};
 assert.equal(f.engine.startMobileMix(f.song,p,f.app,f.old),true);
 assert.ok(f.engine.active().started>f.ctx.currentTime+.14);
 assert.ok(f.engine.active().started<f.ctx.currentTime+.19,
  "the corrected 0.17-second beat delay must be applied even for a short snap");
 f.engine.stopMobileMix();
});
test("iPhone WebAudio clock can be frozen despite reporting running, and a new tap rebuilds it",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const start=appSource.indexOf("  let _audioProno = false;");
 const end=appSource.indexOf('  try {\n    ["pointerdown",',start);
 assert.ok(start>=0&&end>start);
 const env={now:1000,created:0,closed:0};
 class AC{
  constructor(){env.created++;this.state="running";this.currentTime=0}
  close(){env.closed++;this.state="closed";return Promise.resolve()}
  resume(){this.state="running";return Promise.resolve()}
 }
 const make=new Function("env","AC",
  "const Date={now:()=>env.now};"+
  "const navigator={userActivation:{isActive:true}};"+
  "const window={AudioContext:AC,MusicBoxMix:{needsAudioContext:()=>true}};"+
  "const _usaControlliNativiIos=()=>true;"+
  "let _ctx=null,bassiAccesi=false,_audioCollegato=null;"+
  appSource.slice(start,end)+
  "return {tap:_preparaAudio,ready:_mixContextAttivo,ctx:()=>_ctx};");
 const testEngine=make(env,AC);
 testEngine.tap();
 const initial=testEngine.ctx();
 assert.equal(testEngine.ready(),initial);
 env.now=3000;
 assert.equal(testEngine.ready(),null,"running context with stalled clock must not mix");
 testEngine.tap();
 assert.notEqual(testEngine.ctx(),initial,"fresh gesture rebuilds a DJ-only context");
 assert.equal(testEngine.ready(),testEngine.ctx());
 assert.equal(env.closed,1);
 assert.equal(env.created,2);
 testEngine.ctx().currentTime=.42;
 env.now+=600;
 assert.equal(testEngine.ready(),testEngine.ctx());
});
test("iPhone checks its native successor before stopping WebAudio and never undoes a headset pause",()=>{
 assert.ok(source.includes("app?.wantsPlayback?.()===true"));
 assert.ok(source.includes("app.playCurrent?.()"));
 assert.ok(source.includes("mobileMixLastBlocker"));
 assert.ok(source.includes("mobileMixLastStartedAt"));
});

test("Safari can still begin a measured 2.35s soft fade after a short timer delay",()=>{
 const f=createMobileMixFixture();
 f.old.currentTime=178.45;
 const p={...f.plan,kind:"soft",begin:177.65,end:180,
  fade:2.35,safeOutroAt:172,quietCertified:true};
 assert.equal(f.engine.startMobileMix(f.song,p,f.app,f.old),true,
  "a real 1.55s remaining must still allow an audible measured overlap");
 assert.equal(f.engine.active().old,f.old);
 f.engine.stopMobileMix();
});
test("foreground precision scheduling includes measured quiet fades",()=>{
 const fn=source.slice(source.indexOf("function armSnapPrecision("),
  source.indexOf("function dropPrepared("));
 assert.ok(fn.includes('isIOS&&["beat","soft","fade","rise"].includes(plan.kind)'));
 assert.ok(fn.includes("},95);"));
 assert.ok(source.includes('audio.currentTime<plan.end-(plan.kind==="snap"?.26:'));
 assert.ok(source.includes('plan.mobileSilentBridge?.25:1.25'));
});

test("Safari accepts genuine touch gestures even if userActivation incorrectly reports false",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const start=app.indexOf("  let _audioProno = false;");
 const end=app.indexOf('  try {\n    ["pointerdown",',start);
 assert.ok(start>0&&end>start);
 let created=0;
 class AC {constructor(){created++;this.currentTime=0;this.state="running"}}
 const build=new Function("AC",
  "const Date={now:()=>1000};"+
  "const navigator={userActivation:{isActive:false}};"+
  "const window={AudioContext:AC,MusicBoxMix:{needsAudioContext:()=>true}};"+
  "const _usaControlliNativiIos=()=>true;"+
  "let _ctx=null,bassiAccesi=false,_audioCollegato=null;"+
  app.slice(start,end)+"return {activate:_preparaAudio,get:()=>_ctx};"
 )(AC);
 build.activate();assert.equal(created,0,"no context without gesture");
 build.activate({isTrusted:false,type:"click"});
 assert.equal(created,0,"synthetic click must not start WebAudio");
 build.activate({isTrusted:true,type:"touchstart"});
 assert.equal(created,1,"actual iPhone touch must unlock mix context");
 assert.equal(build.get()?.state,"running");
});


test("desktop declines phase corrections too late to sound like one beat",()=>{
 const i=source.indexOf("function desktopBeatStartDelay(");
 const j=source.indexOf("async function beginMix(",i);
 const delay=new Function(source.slice(i,j)+"return desktopBeatStartDelay;")();
 assert.equal(delay({kind:"snap",beatPeriod:.5,beatAnchor:200.31,
  nextBeat:0,end:201},200),null);
 assert.ok(delay({kind:"beat",beatPeriod:.5,beatAnchor:200.40,
  nextBeat:0,end:205},200)>.35);
 assert.ok(delay({kind:"beat",beatPeriod:.5,beatAnchor:200.1,
  nextBeat:0,end:205},200)>=0);
});
test("iPhone never starts a full-volume off-phase beat to mask failed alignment",()=>{
 assert.match(source,/Beat reali fuori fase: passo al brano senza sovrapporli/);
 assert.match(source,/const maxBeatWait=/);
  assert.match(source,/p.kind==="beat"&&p.measuredBeatBridge===true/);
 assert.match(source,/phase>maxBeatWait&&period-phase>\.045/);
});

test("a measured instrumental beat can enter beneath a complete outgoing vocal",()=>{
 const i=source.indexOf("function earlyMatchedBar(");
 const j=source.indexOf("function rhythmicReleaseBeatBridge(",i);
 assert.ok(i>=0&&j>i);
 const early=new Function(
  "const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+
  "const hasImmediateMusicalIntro=()=>true,hasReliableHarmony=()=>true;"+
  "const camelotMatch=()=>({weight:.2,score:.96});"+
  "const grooveAgreement=()=>({score:.95,correlation:.90});"+
  "const similarNotes=()=>({focused:.93,phrase:.90,alignment:{score:.93,matches:true}});"+
  "const onsetPeriodicity=()=>.85,onsetGridPhase=()=>0,musicalIntroEntry=b=>b.safeIntroAt||0;"+
  "const alignedEarlyOnsetAgreement=()=>({score:.95,first:.95,second:.95});"+
  "const beatBearingIntro=(b,min)=>b.introDrive>=min;"+
  source.slice(source.indexOf("function measuredLocalBeatGrid("),
    source.indexOf("function measuredPulseAlignment("))+
  source.slice(i,j)+";return earlyMatchedBar;"
 )();
 const onset=Array.from({length:96},(_,i)=>i%12===0?2.5:0);
 const outgoing={duration:120,last:119.75,bpm:120,beatConfidence:.9,
  lastLyricAt:113.6,lastVoiceAt:118.4,voiceModel:"YAMNet",
  voiceScannedEnd:119.7,protectedEnding:true,
  outroOnsetWindows:[{start:111,end:115,onset,groove:Array(32).fill(.8),
   notes:Array(12).fill(.13),levelRatio:.85}]};
 const next={bpm:120,beatConfidence:.9,introDrive:.9,
  firstVoiceAt:12,firstLyricAt:13,introOnset:onset};
 const safe=early(outgoing,next,120);
 assert.equal(safe?.kind,"beat");
 assert.equal(safe?.vocalBeatUnderlay,true);
 assert.equal(safe?.vocalEndAt,118.4);
 assert.equal(safe?.preserveTail,true);
 assert.equal(safe?.rhythmicGridJoin,true);
 assert.equal(safe?.quietCertified,false,"audible vocals cannot be called a quiet fade");
 assert.ok(safe.begin<outgoing.lastLyricAt&&safe.end>outgoing.lastVoiceAt);
 assert.equal(early({...outgoing,lastVoiceAt:119.7},next,120),null,
  "protect a vocal that continues to the very end");
 assert.equal(early(outgoing,{...next,safeIntroAt:5,firstVoiceAt:12},120),null,
  "entry skips five seconds of the instrumental lead-in");
 const boundary=safe.fade+.65;
 assert.ok(early(outgoing,{...next,firstVoiceAt:boundary+.01},120));
 assert.equal(early(outgoing,{...next,bpm:118,firstVoiceAt:boundary+.01},120),null,
  "a faster decoder reaches the vocal before the overlap ends");
 assert.equal(early(outgoing,{...next,firstVoiceAt:4},120),null,
  "two simultaneous vocal lines are not allowed");
 assert.equal(early({...outgoing,lastLyricAt:null,voiceModel:null,
  voiceScannedEnd:null,lastVoiceAt:null},next,120),null,
  "unknown singer cannot be treated as an instrumental outro");
 const unknown=early({...outgoing,lastVoiceAt:null,voiceModel:null,
  voiceScannedEnd:null},next,120);
 assert.equal(unknown?.vocalBeatUnderlay,true,
  "karaoke timing permits subdued underlay only with fully preserved tail");
 assert.ok(unknown.vocalEndAt>=unknown.end-.07);
 const mi=source.indexOf("function mobileMixAllowed(");
 const mj=source.indexOf("function rememberMobileClip(",mi);
 const allowed=new Function(source.slice(mi,mj)+";return mobileMixAllowed;")();
 assert.equal(Boolean(allowed(safe,outgoing,outgoing.lastLyricAt)),true);
 assert.equal(Boolean(allowed(unknown,{...outgoing,voiceModel:null,
  lastVoiceAt:null,voiceScannedEnd:null},outgoing.lastLyricAt)),true);
 assert.equal(Boolean(allowed(safe,outgoing,119)),false,
  "late lyrics invalidate a previously certified overlay");
 assert.match(source,/if\(act\.vocalBeatUnderlay\)/);
 assert.match(source,/if\(mobileActive\.vocalBeatUnderlay\)/);
 assert.match(source,/!verifiedQuietLyricExit&&!verifiedVocalBeat/);
});

test("late arriving karaoke line can cancel a formerly quiet postlude",()=>{
 assert.match(source,/plan\.postMusicalTailUnderlay===true&&/);
 assert.match(source,/lastKnownLyric>plan\.begin-5/);
});
test("shuffle exposes every real-audio filter stage without forcing bad beatmatches",()=>{
 assert.match(source,/candidateAudit=\{indexed:indexed\.length,missingFromIndex:unknown\.length/);
 assert.match(source,/candidateAudit\.validIntros\+\+/);
 assert.match(source,/candidateAudit\.closeTempo\+\+/);
 assert.match(source,/candidateAudit\.compatibleGroove\+\+/);
 assert.match(source,/candidateAudit\.compatibleNotes\+\+/);
 assert.match(source,/candidateAudit\.verifiedBeats\+\+/);
 assert.match(source,/rejected,candidateAudit,limitingStage,chosen:/);
 assert.match(source,/beat del brano in uscita non abbastanza affidabile/);
 assert.match(source,/nessun punto di sovrapposizione musicale sicuro/);
 assert.match(source,/nessuna sovrapposizione o sequenza affidabile nei brani analizzati/);
});


test("DJ impact reveal is exactly tied to a measured incoming beat and never runs on unverified music",()=>{
 const funcs=source.slice(source.indexOf("function djImpactBeatPoint("),
  source.indexOf("\ntry{\n const stored=",source.indexOf("function djImpactBeatPoint(")));
 const api=new Function("clamp",funcs+"\nreturn {beat:djImpactBeatPoint,envelope:djImpactEnvelope};")(
  (x,a,b)=>Math.max(a,Math.min(b,x)));
 const certified={kind:"beat",preserveTail:true,
  vocalVerifiedBeat:true,measuredBeatBridge:true,quietCertified:false,
  beatPeriod:.5,beatAnchor:100,nextBeat:.1,tempo:1};
 const point=api.beat(certified,4);
 assert.ok(Math.abs(point-.525)<1e-8,"bass reveal must land on the incoming actual kick");
 assert.equal(api.beat({...certified,vocalVerifiedBeat:false},4),null,
  "unknown vocal safety is not permission for a loud bass reveal");
 assert.equal(api.beat({...certified,kind:"snap"},4),null,
  "a subsecond unverified snap stays subtle");
 assert.equal(api.beat({...certified,beatAnchor:null},4),null);
 assert.equal(api.beat({...certified,nextBeat:null},4),null);
 assert.equal(api.beat({...certified,tempo:1.2},4),null);
 assert.equal(api.beat({...certified,subduedRhythmicUnderlay:true},4),null);
 assert.equal(api.beat({...certified,vocalBeatUnderlay:true},4),null,
  "the original singing must never be ducked for an impact");
 assert.equal(api.beat(certified,1.2),null,"short mixes cannot stage a long reveal");
 const start=api.envelope(0,point),warm=api.envelope(.25,point),
   beat=api.envelope(point,point),drop=api.envelope(.72,point),
   final=api.envelope(1,point);
 assert.ok(start.inGain<.001&&start.outGain>.99);
 assert.ok(warm.inGain<.25&&warm.outGain>.95);
 assert.ok(beat.inGain>.72&&beat.inGain<.89,"real next kick gains the focus");
 assert.ok(drop.inGain>.92&&drop.outGain<.40,
  "the new recording must become clearly foreground music after its downbeat");
 assert.ok(final.inGain>.999&&final.outGain<.001);
 let previous=0;
 for(let step=0;step<=100;step++){
  const gains=api.envelope(step/100,point);
  assert.ok(gains.inGain>=previous-1e-9,"no abrupt backwards volume pumps");
  assert.ok(Math.abs(gains.inGain**2+gains.outGain**2-1)<1e-6,
   "equal-power mix avoids artificial power spikes");
  previous=gains.inGain;
 }
});

test("certified impact DSP holds back the bass then reveals it near the real beat",()=>{
 const code=source.slice(source.indexOf("function connectMixDsp("),
  source.indexOf("\ntry{\n const stored=",source.indexOf("function connectMixDsp(")));
 const attach=new Function("dspMode","dspStrength","dspBass","dspMid","dspTreble",
  code+"\nreturn connectMixDsp;")("auto",55,0,0,0);
 const events=[];
 const filter={type:"",frequency:{
  value:0,setValueAtTime(value,time){events.push({kind:"set",value,time})},
  exponentialRampToValueAtTime(value,time){events.push({kind:"ramp",value,time})}},
  Q:{value:0},gain:{value:0},connect(){},disconnect(){}};
 const audio={connect(){},disconnect(){}},output={};
 const ctx={currentTime:100,createBiquadFilter:()=>filter};
 const nodes=attach(ctx,audio,output,4,true,.525);
 assert.equal(nodes.length,1);
 assert.equal(filter.type,"highpass");
 assert.ok(events[0].value>=100,"filtered underlay has a muted bass");
 assert.ok(events[1].time>101.8&&events[1].time<102.1);
 assert.equal(events[2].value,35,"full bass returns after the incoming downbeat");
 assert.ok(events[2].time>102.1&&events[2].time<102.3);
 events.length=0;
 attach(ctx,audio,output,4,false,null);
 assert.equal(events.length,0,"a non-beat plan has no automatic highpass gimmick");
});

test("iPhone confident beat overlap exposes the next real track at the certified kick",()=>{
 const f=createMobileMixFixture();
 const curves=[];
 f.ctx.createGain=()=>({
  gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},
   cancelScheduledValues(){},setValueCurveAtTime(shape,started,duration){
    curves.push({shape:[...shape],started,duration});
   }},
  connect(){},disconnect(){}
 });
 const plan={...f.plan,preserveTail:true,vocalVerifiedBeat:true,
  measuredBeatBridge:true,verifiedHarmonicBridge:true,
  beatPeriod:.5,beatAnchor:174.1,nextBeat:.1,tempo:1};
 assert.equal(f.engine.startMobileMix(f.song,plan,f.app,f.old),true);
 const state=f.engine.active();
 assert.ok(state&&state.djRevealAt>=.4&&state.djRevealAt<=.72);
 assert.equal(curves.length,1,"real WebAudio gain curve must be scheduled");
 const values=curves[0].shape;
 assert.ok(values[Math.round(values.length*.75)]>
   3*values[Math.round(values.length*.25)],
   "incoming beat becomes audibly dominant after the certified impact");
 assert.ok(values.every(n=>Number.isFinite(n)&&n>=0&&n<=.8),
  "no accidental boost outside the user volume or unsafe gain");
 f.old.handlers.pause();
 assert.equal(f.engine.active(),null);
});


test("safe quiet-song transitions get a fast musical sweep without claiming matched beats",()=>{
 const helpers=source.slice(source.indexOf("function djImpactBeatPoint("),
  source.indexOf("\ntry{\n const stored=",source.indexOf("function djImpactBeatPoint(")));
 const yes=new Function("clamp",helpers+"return djSoftRevealReady;")(
  (x,a,b)=>Math.max(a,Math.min(b,x)));
 assert.equal(yes({kind:"soft",neutralRelease:true,quietCertified:true},3.5),true);
 assert.equal(yes({kind:"soft",neutralRelease:true,quietCertified:false},3.5),false);
 assert.equal(yes({kind:"soft",neutralRelease:true,quietCertified:true,
  vocalBeatUnderlay:true},3.5),false);
 assert.equal(yes({kind:"beat",neutralRelease:true,quietCertified:true},3.5),false);
 const code=source.slice(source.indexOf("function connectMixDsp("),
  source.indexOf("\ntry{\n const stored=",source.indexOf("function connectMixDsp(")));
 const attach=new Function("dspMode","dspStrength","dspBass","dspMid","dspTreble",
  code+"return connectMixDsp;")("auto",55,0,0,0);
 let filter=null;const events=[];
 const ctx={currentTime:10,createBiquadFilter:()=>filter={
  type:"",frequency:{value:0,
   setValueAtTime(v,t){events.push({type:"set",v,t})},
   exponentialRampToValueAtTime(v,t){events.push({type:"ramp",v,t})}},
  Q:{value:0},gain:{value:0},connect(){},disconnect(){}
 }};
 const sound={connect(){},disconnect(){}};
 assert.equal(attach(ctx,sound,{},3.4,false,null,0,true).length,1);
 assert.equal(filter.type,"lowpass");
 assert.ok(events[0].v>1500&&events[0].v<3600);
 assert.equal(events.at(-1).v,18000,"incoming track regains full high frequencies");
 assert.ok(events.at(-1).t<=11.5,"sweep is audible early, not after the transition");
 events.length=0;
 assert.equal(attach(ctx,sound,{},3.4,false,null,0,false).length,0,
  "an unverified handoff never gets an added effect");
});

test("decisive certified downbeat still has constant musical energy",()=>{
 const h=source.slice(source.indexOf("function djImpactBeatPoint("),
  source.indexOf("\ntry{\n const stored=",source.indexOf("function djImpactBeatPoint(")));
 const f=new Function("clamp",h+
  "return {impact:djImpactEnvelope,soft:djSoftFocusEnvelope,ready:djSoftRevealReady};")(
  (x,a,b)=>Math.max(a,Math.min(b,x)));
 const before=f.impact(.24,.525),at=f.impact(.525,.525),after=f.impact(.72,.525);
 assert.ok(before.outGain>.95&&before.inGain<.25);
 assert.ok(at.inGain>.75&&at.outGain<.66);
 assert.ok(after.inGain>.95&&after.outGain<.32);
 for(let i=0;i<=100;i++){
  const x=f.impact(i/100,.525);
  assert.ok(Math.abs(x.inGain*x.inGain+x.outGain*x.outGain-1)<1e-7);
 }
 assert.ok(f.soft(.3)>.69);
 assert.equal(f.ready({kind:"soft",quietCertified:false,neutralRelease:true},3),false);
 assert.equal(f.ready({kind:"soft",quietCertified:true,neutralRelease:true},3),true);
 assert.ok(source.includes("softReveal?djSoftFocusEnvelope(u)"));
});


test("real four-beat accent matching vetoes mismatched bar accents, not flat drum grids",()=>{
 const phase=source.slice(source.indexOf("function onsetGridPhase("),
  source.indexOf("// Different kick samples may still share",source.indexOf("function onsetGridPhase(")));
 const bars=source.slice(source.indexOf("function djMeasuredBarAccents("),
  source.indexOf("function earlyMatchedBar(",source.indexOf("function djMeasuredBarAccents(")));
 const verify=new Function("clamp",phase+bars+"return djMeasuredBarAccents;")(
  (x,a,b)=>Math.max(a,Math.min(b,x)));
 const onset=(beats)=>Array.from({length:96},(_,i)=>{
  const beat=i/12;
  return i%12===0&&beat<beats.length?beats[beat]:0;
 });
 const a=onset([1,.35,.7,.40,1,.35,.7,.40]);
 const equal=onset([1,.35,.7,.40,1,.35,.7,.40]);
 const reversed=onset([.35,1,.4,.7,.35,1,.4,.7]);
 const plain=onset(Array(8).fill(.6));
 assert.ok(verify(a,equal,120,0).score>.98);
 assert.ok(verify(a,reversed,120,0).score<.62);
 assert.equal(verify(plain,plain,120,0).reliable,false,
  "flat 4-on-floor drums cannot certify a downbeat or musical measure");
 assert.equal(verify(a,equal,120,3.9),null,
  "too few overlapping verified beats must remain unproven");
});

test("actual decoder playhead must preserve outgoing-incoming beat phase",()=>{
 const helpers=source.slice(source.indexOf("function djImpactBeatPoint("),
  source.indexOf("\ntry{\n const stored=",source.indexOf("function djImpactBeatPoint(")));
 const verify=new Function("clamp",helpers+"return djBeatPhaseError;")(
  (x,a,b)=>Math.max(a,Math.min(b,x)));
 const plan={beatPeriod:.5,beatAnchor:100,nextBeat:.1,entry:0,tempo:1};
 assert.ok(verify(plan,101.1,1.2)<1e-8);
 assert.ok(Math.abs(verify(plan,101.1,1.45)-.25)<1e-8);
 assert.ok(verify({...plan,tempo:1.02},101.1,1.222)<1e-8);
 assert.equal(verify({...plan,nextBeat:null},101.1,1.2),null);
 assert.ok(source.includes("const livePhaseError=djBeatPhaseError("));
 assert.ok(source.includes("cancel();plan=null;return;"));
});


test("measured early release preview is smooth, capped, and never ducks the outgoing song",()=>{
 const part=source.slice(source.indexOf("function measuredReleasePreviewGain("),
  source.indexOf("function mixCurve(",source.indexOf("function measuredReleasePreviewGain(")));
 const gain=new Function("clamp",part+"return measuredReleasePreviewGain;")(
  (x,a,b)=>Math.max(a,Math.min(b,x)));
 const begin=182.79,last=185.5,end=188.999;
 assert.equal(gain(begin,begin,last,end),0);
 assert.ok(gain(last-.001,begin,last,end)<=.23);
 assert.ok(Math.abs(gain(last,begin,last,end)-.23)<1e-7);
 assert.ok(Math.abs(gain(end,begin,last,end)-1)<1e-8);
 assert.equal(gain(NaN,begin,last,end),0);
 assert.equal(gain(3,5,2,1),0);
 let prev=-1;
 for(let i=0;i<=1000;i++){
  const x=begin+(end-begin)*i/1000;
  const g=gain(x,begin,last,end);
  assert.ok(g>=prev-1e-8,"no backward volume pump");
  assert.ok(g>=0&&g<=1+1e-8,"no amplitude boost");
  if(x<last)assert.ok(g<=.23+1e-8,
   "unknown vocal safety forbids overpowering the original outro");
  prev=g;
 }
 assert.ok(source.includes("outGain=1;")&&
  source.includes("inGain=measuredReleasePreviewGain(old.currentTime,"),
  "the original is never muted during the measured release");
});


test("measured release preview survives a delayed fade tick at the old song native EOF",()=>{
 const handler=source.slice(source.indexOf("function naturalEndHandoff("),
   source.indexOf("async function handoff("));
 assert.ok(handler.includes("active?.measuredReleaseLeadIn"),
  "native onended must adopt a running early preview instead of loading a new MP3");
 assert.ok(handler.includes("active.original?.ended"));
 assert.ok(source.includes("measuredReleaseLeadIn:!!proposed.measuredReleaseLeadIn"));
 assert.ok(source.includes("!plan?.measuredReleaseLeadIn"),
  "do not preempt a planned release with a later quiet fallback");
});


test("DJ uses already measured source-specific analysis before async decode after a seek",()=>{
 const helperStart=source.indexOf("function alreadyMeasuredAnalysis(");
 const helperEnd=source.indexOf("async function cachedMobileAnalysis(",helperStart);
 const mergeStart=source.indexOf("function withValidatedVoice(");
 const mergeEnd=source.indexOf("function deepStatus(",mergeStart);
 assert.ok(helperStart>0&&helperEnd>helperStart);
 const local=new Map([["file-a.mp3",{duration:120,voiceModel:"verified",
  lastVoiceAt:113,voiceScannedEnd:119}]]);
 const lookup=(track)=>track.id==="a"?{duration:120,bpm:123,
  analyzer:"librosa-onsets-chroma-rms-v8-harmonic-sections"}:null;
 const measured=new Function("cache","deepLookup",
  source.slice(mergeStart,mergeEnd)+source.slice(helperStart,helperEnd)+
  "return alreadyMeasuredAnalysis;")(local,lookup);
 const app={mixUrl:(track)=>track.url};
 const existing=measured({id:"a",url:"file-a.mp3"},app);
 assert.equal(existing.bpm,123);
 assert.equal(existing.voiceModel,"verified");
 assert.equal(existing.lastVoiceAt,113);
 assert.equal(measured({id:"b",url:"file-b.mp3"},app),null);
 const tick=source.slice(source.indexOf("function tick(){"),
  source.indexOf("function paintWave("));
 const current=tick.indexOf("a=alreadyMeasuredAnalysis(now,app)");
 const incoming=tick.indexOf("b=alreadyMeasuredAnalysis(next,app)");
 const firstPlan=tick.indexOf("if(a||b)update()");
 const decode=tick.indexOf("decode(now).then(");
 assert.ok(current>0&&incoming>current&&firstPlan>incoming&&decode>firstPlan,
  "A measured, lyric-safe cue must be planned before optional async decoding");
 assert.match(tick,/if\(!isIOS&&prepared\?\.id===target/,
  "later analysis must still retarget the existing prebuffer, not redownload");
});
