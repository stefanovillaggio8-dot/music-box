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
 assert.ok(source.includes("measured?.safeIntroAt"));
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
  'const mobileIntroClips=new Map(),mobileOverlayFailures=new Map(),cache=new Map();'+
  'const deepLookup=()=>null;'+
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
 f.ctx.currentTime=105.6;
 f.old.currentTime=179.6;
 f.old.handlers.timeupdate();
 assert.equal(f.calls.length,1);
 assert.ok(f.calls[0].at>5.5&&f.calls[0].at<6.5);
 const nextAudio={paused:false,readyState:3,seeking:false,
  currentTime:0,seekable:{length:1},duration:180};
 f.setCurrent("next");f.setNative(nextAudio);
 f.engine.finishMobileMix(f.app);
 assert.ok(nextAudio.currentTime>5.5);
 assert.ok(f.engine.active()); // native loadeddata can still be stalled
 f.engine.active().nativeSyncAt=Date.now()-160;
 nextAudio.currentTime+=.2;
 f.engine.finishMobileMix(f.app);
 assert.equal(f.engine.active(),null);
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
 assert.ok(source.includes("mobileOverlayFailures.set(pair,Date.now()+60000)"));
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
 f.old.currentTime=179.6;
 f.old.handlers.timeupdate();
 assert.equal(f.calls.length,0);
 assert.equal(f.engine.active(),null);
});

test("iPhone EQ lowers incoming bass first and restores it progressively",()=>{
 const f=createMobileMixFixture();
 const frequency={initial:0,final:0,setValueAtTime(v){this.initial=v},
  exponentialRampToValueAtTime(v){this.final=v}};
 f.ctx.createBiquadFilter=()=>({type:"",frequency,connect(){},disconnect(){}});
 assert.equal(f.engine.startMobileMix(f.song,f.plan,f.app,f.old),true);
 assert.equal(f.engine.active().filter.type,"highpass");
 assert.equal(frequency.initial,135);
 assert.equal(frequency.final,40);
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
 assert.ok(source.includes("Intro non ancora preparata: evito di rallentare il brano corrente"));
 assert.ok(source.includes("Finale non sicuro per una sovrapposizione su iPhone"));
});
test("Safari can resume an audio context on later user gestures",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.ok(appSource.includes('_audioProno && _ctx?.state === "running"'));
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
 assert.ok(source.includes("Promise.resolve().then(()=>voice.analyze(decoded,frame))"));
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
});
test("PC preloads the next MP3 early rather than missing the mixing window",()=>{
 assert.ok(source.includes("Math.min(plan.begin-28,audio.duration-45)"));
 assert.ok(source.includes("if(previewAllowed&&!isIOS&&plan.kind!==\"cut\""));
});
test("late vocal model result does not forcibly reset an in-progress handoff",()=>{
 assert.ok(source.includes("if(!mixing&&!active&&!mobileActive){"));
 assert.ok(source.includes("if(voiceThreatensPlan(v,currentTrack,nextTrack,plan)&&"));
});

test("analyzes the real first musical onset instead of a long dead intro",()=>{
 const code=source.slice(source.indexOf("function musicalIntroEntry("),
  source.indexOf("function rhythmicFullTailJoin("));
 const entry=new Function("const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+code+
  "return musicalIntroEntry;")();
 assert.ok(Math.abs(entry({safeIntroAt:0,first:5.5,introDrive:.8,beatConfidence:.25})-5.38)<.001);
 assert.equal(entry({safeIntroAt:0,first:5.5,introDrive:.12,beatConfidence:.25}),0);
 assert.equal(entry({safeIntroAt:0,first:5.5,introDrive:.8,beatConfidence:.25,firstLyricAt:2}),0);
});
test("late vocals and protected endings veto the short full-tail beat bridge",()=>{
 const code=source.slice(source.indexOf("function rhythmicFullTailJoin("),
  source.indexOf("function hasImmediateMusicalIntro("));
 const run=new Function("const isIOS=false,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
  "const hasReliableHarmony=a=>Array.isArray(a)&&a.length===12;"+
  "const grooveAgreement=()=>({score:.82});"+
  "const similarNotes=()=>({focused:.56,phrase:.42});"+
  "const camelotMatch=()=>({weight:.1,score:.5});"+
  "const musicalIntroEntry=()=>0;"+code+"return rhythmicFullTailJoin;")();
 const notes=Array(12).fill(.10);
 const a={duration:180,last:179.9,bpm:120,beatConfidence:.23,
  protectedEnding:false,outroFinalNotes:notes};
 const b={bpm:122,beatConfidence:.22,introDrive:.8,introAttackNotes:notes};
 const p=run(a,b,180);
 assert.equal(p.kind,"snap");assert.ok(p.rhythmicUnderlay);
 assert.ok(p.end>=179.9&&p.end<=180&&p.fade<=1.05);
 assert.equal(run({...a,lastLyricAt:178},b,180),null);
 assert.equal(run({...a,lastVoiceAt:179},b,180),null);
 assert.equal(run({...a,protectedEnding:true},b,180),null);
 assert.equal(run(a,{...b,firstVoiceAt:.3},180),null);
});
test("optional vocal ML is not started for every shuffled preview",()=>{
 assert.ok(source.includes("voice?.analyze&&mayScanDesktopVoice(bridge(),track)"));
 assert.ok(source.includes("voiceJobs.size===0&&!voiceJobs.has(key)"));
});
