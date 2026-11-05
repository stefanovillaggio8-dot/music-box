"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const helpers=source.slice(source.indexOf("function findDropRelease("),source.indexOf("function analyzeFrames("));
const certifiedBoundarySource=source.slice(source.indexOf("function certifiedMixBoundary("),source.indexOf("// Permit a rhythmic overlap",source.indexOf("function certifiedMixBoundary(")));
const transitionSource=source.slice(source.indexOf("function strongInstrumentalBeatBridge("),source.indexOf("// Circle of fifths/Camelot:"));
function engine(ios=false,notesMatch=true){
 return new Function(
  "const isIOS="+String(ios)+",style='auto';"+
  "function clamp(x,a,b){return Math.max(a,Math.min(b,x))}"+
  "function similarNotes(){return {matches:"+String(notesMatch)+",focused:.91,phrase:.88,score:.92,alignment:{matches:"+String(notesMatch)+",fade:4.2,score:.95}}}"+
  "function grooveAgreement(){return {score:.87}}"+
  "function hasReliableHarmony(){return false}"+
  "function bpmGap(){return 0}"+
  "function camelotMatch(){return {weight:0,score:1}}"+
  helpers+certifiedBoundarySource+transitionSource+
  "return {findDropRelease,drivenIntro,transition}"
 )();
}
const blocks=()=>Array.from({length:500},()=>.21);
function musicalEnding(){
 const b=blocks();
 for(let i=445;i<460;i++)b[i]=.026;
 for(let i=460;i<475;i++)b[i]=.014;
 for(let i=475;i<b.length;i++)b[i]=0;
 return b;
}
function fixture(ios=false){
 const e=engine(ios),cue=e.findDropRelease(musicalEnding(),.21,95,100);
 const outgoing={duration:100,last:95,confidentTail:true,dropRelease:cue,
  bpm:120,beatConfidence:.75,level:.21};
 const incoming={duration:100,bpm:120,beatConfidence:.75,level:.21,
  introDrive:.8,safeIntroAt:0,introBeat:0};
 return {e,cue,outgoing,incoming};
}
test("detects final drop release before encoded silence",()=>{
 const {cue}=fixture();
 assert.ok(cue,"last drop must be detected");
 assert.ok(cue.lastImpactAt<cue.releaseAt&&cue.releaseAt<95);
 assert.ok(cue.seconds>2.1&&cue.seconds<12);
});
test("loud final music or drum comeback stays protected",()=>{
 const e=engine(),b=blocks();
 for(let i=490;i<b.length;i++)b[i]=0;
 assert.equal(e.findDropRelease(b,.21,100,100),null);
 const x=musicalEnding();for(let i=466;i<475;i++)x[i]=.21;
 assert.equal(e.findDropRelease(x,.21,95,100),null);
});
test("matched release uses the real last musical beat and intro",()=>{
 const {e,cue,outgoing,incoming}=fixture();
 const plan=e.transition(outgoing,incoming,100);
 assert.ok(plan&&plan.dropReleaseBridge);
 assert.equal(plan.kind,"beat");
 assert.ok(plan.begin>=cue.lastImpactAt+1.05,"final beat must ring");
 assert.ok(plan.end>=outgoing.last&&plan.fade>=2);
 assert.equal(plan.entry,0,"never seek over musical intro");
});
test("silent or weak next introduction is not treated as musical compatibility",()=>{
 const {e,outgoing,incoming}=fixture();
 const plan=e.transition(outgoing,{...incoming,introDrive:.08},100);
 assert.ok(!plan?.dropReleaseBridge);
 assert.ok(plan===null||plan.kind==="cut");
 const b=blocks();for(let i=0;i<23;i++)b[i]=.001;
 assert.ok(e.drivenIntro(b,.21,0)<.25);
});
test("last vocal or lyric protects the important outro",()=>{
 const {e,outgoing,incoming}=fixture();
 for(const patch of [{lastVoiceAt:91},{lastLyricAt:91}]){
  const plan=e.transition({...outgoing,...patch},incoming,100);
  assert.ok(!plan?.dropReleaseBridge);
  assert.ok(!plan||plan.begin>=95,"do not fade over sung finale");
 }
});
test("new vocal on incoming attack blocks double vocals",()=>{
 const {e,outgoing,incoming}=fixture();
 const plan=e.transition(outgoing,{...incoming,firstVoiceAt:.7},100);
 assert.ok(!plan?.dropReleaseBridge);
});
test("iPhone protects energetic unverified tails but allows settled measured releases",()=>{
 const {e,outgoing,incoming}=fixture(true);
 const uncertain={...outgoing,dropRelease:{
  ...outgoing.dropRelease,quietLevel:.55,score:.38
 }};
 assert.ok(!e.transition(uncertain,incoming,100)?.dropReleaseBridge);
 const verified=e.transition({...uncertain,lastLyricAt:80},incoming,100);
 assert.ok(verified?.dropReleaseBridge&&verified.quietCertified);
 const measured=e.transition(outgoing,incoming,100);
 assert.ok(measured?.dropReleaseBridge&&measured.quietCertified);
});
test("high-impact full-volume finale is flagged as protected",()=>{
 const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 assert.ok(source.includes("a.protectedEnding!==true"));
 const analysis=source.slice(source.indexOf("function clamp("),source.indexOf("async function decode("));
 const fx=new Function(analysis+"return analyzeFrames;")();
 const rate=8000,duration=64,arr=new Float32Array(rate*duration);
 for(let i=0;i<arr.length;i++){const t=i/rate;arr[i]=.3*Math.sin(2*Math.PI*220*t);}
 const info=fx({sampleRate:rate,duration,getChannelData:()=>arr});
 assert.equal(info.protectedEnding,true);
 assert.equal(info.safeOutroAt,null);
});
test("legacy fade paths do not blend two near-silent intros",()=>{
 const {e,outgoing,incoming}=fixture();
 const plan=e.transition({...outgoing,dropRelease:null,safeOutroAt:87},
  {...incoming,introDrive:.05},100);
 assert.ok(plan===null||plan.kind==="cut");
});
test("natural decaying final beat is matched before the silence, not after",()=>{
 const engine=engineForDecay();
 const blocks=Array.from({length:200},(_,i)=>{
  const time=i*.2;
  if(time<31)return .20;
  if(time<37)return .20*Math.exp(-(time-31)*.55);
  return 0;
 });
 const cue=engine.findDropRelease(blocks,.20,38,40);
 assert.ok(cue,"last beat release must be detected");
 assert.ok(cue.lastImpactAt<33&&cue.releaseAt<34);
 assert.ok(cue.releaseAt<38-2.1,"new song can enter during the release");
});
function engineForDecay(){return engine(false)}
test("outgoing harmony/groove are analyzed before the detected silence",()=>{
 assert.ok(source.includes("frame.dropRelease.lastImpactAt+.20"));
 assert.ok(source.includes("dropRelease.lastImpactAt+.20"));
});
test("wrong MP3 duration cannot trigger speculative drop skip",()=>{
 const {e,outgoing,incoming}=fixture();
 assert.equal(e.transition({...outgoing,duration:85},incoming,100),null);
});

test("compatible final beat can blend BEFORE the end without encoded digital silence",()=>{
 const {e,outgoing,incoming}=fixture();
 const music={...outgoing,confidentTail:false,protectedEnding:false,last:100,
  duration:100,dropRelease:{lastImpactAt:90.5,releaseAt:91.8,
   quietLevel:.12,score:.89},safeOutroAt:91.8};
 const plan=e.transition(music,incoming,100);
 assert.ok(plan?.dropReleaseBridge,"A measured quiet release should be eligible");
 assert.ok(plan.begin<96,"The next song enters several seconds before the end");
 assert.ok(plan.end>=99.9,"Do not truncate the outgoing musical ending");
 assert.equal(plan.silenceTrim,false,"No fake digital silence should be claimed");
});
test("no encoded silence does NOT permit cutting late vocals",()=>{
 const {e,outgoing,incoming}=fixture();
 const cue={lastImpactAt:90,releaseAt:91.5,quietLevel:.1,score:.92};
 const a={...outgoing,last:100,duration:100,confidentTail:false,
  protectedEnding:false,dropRelease:cue,lastVoiceAt:95};
 assert.equal(e.transition(a,incoming,100),null);
});
test("measured quiet release permits a safe iPhone overlap without timed lyrics",()=>{
 const {e,outgoing,incoming}=fixture(true);
 const tail={...outgoing,duration:100,last:100,confidentTail:false,
  protectedEnding:false,dropRelease:{lastImpactAt:90.1,releaseAt:91.5,quietLevel:.12,score:.88}};
 const plan=e.transition(tail,incoming,100);
 assert.ok(plan?.dropReleaseBridge);
 assert.equal(plan.quietCertified,true);
 assert.ok(plan.begin<=96 && plan.fade>=3.5);
});
test("continuous full-volume music cannot be reclassified as a final release",()=>{
 const e=engine(),blocks=Array.from({length:500},()=>.24);
 assert.equal(e.findDropRelease(blocks,.24,100,100),null);
});
test("real PCM ending still audible to the last frame can produce a musical release",()=>{
 const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 const helper=source.slice(source.indexOf("function findDropRelease("),source.indexOf("function drivenIntro("));
 const release=new Function(helper+"return findDropRelease")();
 const blocks=Array.from({length:500},(_,i)=>{
  if(i<452)return .2;
  const t=(i-452)*.2;
  return .1*Math.exp(-t*.47)+.002;
 });
 const cue=release(blocks,.20,100,100);
 assert.ok(cue && cue.releaseAt<93.5,"Detect genuine audible decay without zero-valued tail");
});

test("incompatible next song can start a neutral fade before recorded silence",()=>{
 const e=engine(false,false);
 const a={duration:100,last:100,confidentTail:false,protectedEnding:false,
  safeOutroAt:91.6,dropRelease:{lastImpactAt:90.3,releaseAt:91.6,
   quietLevel:.11,score:.88},level:.2,bpm:120,beatConfidence:.75};
 const b={duration:140,bpm:120,beatConfidence:.75,introDrive:.80,
  safeIntroAt:0,introBeat:0,level:.2};
 const plan=e.transition(a,b,100);
 assert.ok(plan,"A low-energy release deserves a gentle handoff");
 assert.equal(plan.kind,"soft","Incompatible harmony must not be beat-matched");
 assert.ok(plan.neutralRelease);
 assert.ok(plan.begin<97&&plan.fade>=3,"Do not wait for the last second");
 assert.ok(plan.end>=99.9,"Never cut remaining audible notes");
 assert.equal(plan.silenceTrim,false);
});
test("neutral pre-silence fade keeps spoken or sung final phrase intact",()=>{
 const e=engine(false,false);
 const a={duration:100,last:100,confidentTail:false,protectedEnding:false,
  safeOutroAt:91.6,dropRelease:{lastImpactAt:90.3,releaseAt:91.6,
   quietLevel:.11,score:.88},level:.2,bpm:120,beatConfidence:.75,
  lastVoiceAt:96};
 const b={duration:140,bpm:120,beatConfidence:.75,introDrive:.8,
  safeIntroAt:0,introBeat:0,level:.2};
 assert.equal(e.transition(a,b,100),null,"Do not fade across late singing");
});
test("neutral release rejects quiet opening and untrusted outgoing decay",()=>{
 const e=engine(false,false);
 const a={duration:100,last:100,confidentTail:false,protectedEnding:false,
  safeOutroAt:91.6,dropRelease:{lastImpactAt:90.3,releaseAt:91.6,
   quietLevel:.11,score:.88},level:.2,bpm:120,beatConfidence:.75};
 const b={duration:140,bpm:120,beatConfidence:.75,introDrive:.08,
  safeIntroAt:0,introBeat:0,level:.2};
 assert.equal(e.transition(a,b,100),null,"A near-silent intro is not a musical drop");
 assert.equal(e.transition({...a,dropRelease:{...a.dropRelease,quietLevel:.8,score:.1}},
  {...b,introDrive:.8},100),null,"A still-loud tail cannot be treated as quiet");
});

test("recording regression: last lyric starts near the end but beat decays afterward",()=>{
 const e=engine(false,false);
 // A timestamp is a lyric LINE ONSET, not proof the voice continues to
 // the MP3's final frame. A separate 4s guard and the measured falling
 // envelope must both succeed before an early soft transition.
 const a={duration:100,last:100,confidentTail:false,protectedEnding:false,
  dropRelease:{lastImpactAt:91,releaseAt:92,quietLevel:.09,score:.91},
  safeOutroAt:92,lastLyricAt:91,beatConfidence:.55,level:.19,bpm:90};
 const b={duration:150,bpm:123,beatConfidence:.58,introDrive:.8,
  safeIntroAt:0,level:.2};
 const plan=e.transition(a,b,100);
 assert.ok(plan,"Confirmed beat-decay after a final lyric must allow a safe fade");
 assert.equal(plan.kind,"soft","Dissonant tracks must not be beatmatched");
 assert.equal(plan.verifiedDecayAfterLyrics,true);
 assert.ok(plan.begin>=95&&plan.begin<=96,"Wait for the lyric to finish, but enter well before the end");
 assert.ok(plan.fade>=3.9&&plan.end>=99.9,"Preserve the previous song through the audible tail");
 assert.equal(plan.silenceTrim,false);
 assert.ok(source.includes("const verifiedQuietLyricExit="));
});
test("recording regression: late vocals and a new lyric line still veto fade",()=>{
 const e=engine(false,false);
 const a={duration:100,last:100,confidentTail:false,protectedEnding:false,
  dropRelease:{lastImpactAt:91,releaseAt:92,quietLevel:.09,score:.91},
  safeOutroAt:92,lastLyricAt:91,beatConfidence:.55,level:.19,bpm:90};
 const b={duration:150,bpm:123,beatConfidence:.58,introDrive:.8,safeIntroAt:0};
 for(const patch of [{lastLyricAt:93},{lastVoiceAt:94},{protectedEnding:true}]){
  const plan=e.transition({...a,...patch},b,100);
  assert.ok(!plan||plan.verifiedDecayAfterLyrics!==true,"No fake karaoke safety after a later vocal/re-attack");
 }
});

test("when prebuffer is unavailable, only digitally verified end silence can be skipped",()=>{
 const marker=source.slice(source.indexOf("function certifiedTailSkip("),source.indexOf("function tick(){"));
 assert.ok(marker.startsWith("function certifiedTailSkip("));
 const canSkip=new Function(marker+"return certifiedTailSkip")();
 const a={duration:100,last:96,confidentTail:true,
  lastVoiceAt:90,lastLyricAt:88};
 assert.equal(canSkip(a,100,96.3,88),true);
 assert.equal(canSkip(a,100,95.8,88),false,"Musical samples cannot be skipped");
 assert.equal(canSkip({...a,confidentTail:false},100,97,88),false);
 assert.equal(canSkip({...a,duration:93},100,97,88),false);
 assert.equal(canSkip({...a,lastVoiceAt:95.9},100,97,88),false);
 assert.equal(canSkip(a,100,97,95.8),false,"Last karaoke cue vetoes early skip");
});

test("screen recording 19:08:34: real audible decay triggers an overlap BEFORE the silent end",()=>{
 const live=source.slice(source.indexOf("function liveQuietOutroReady("),
  source.indexOf("function tryLiveQuietMix("));
 const eligible=new Function(live+"return liveQuietOutroReady")();
 // Relative 0.25s RMS values from the user's screen recording, not
 // audio samples: copyright-safe regression data.
 const late=[.005886,.004836,.004393,.003759,.003287,.002886,.002453,.002064,
  .001657,.001310,.001112,.000835,.000668,.000512,.000364,.000236,
  .000124,.000060,.000028,.000004];
 const samples=[];
 for(let t=0;t<26;t+=.25)
  samples.push({at:216+t,rms:.011+.007*Math.abs(Math.sin(t*1.79))});
 late.forEach((r,i)=>samples.push({at:216+26+i*.25,rms:r}));
 const at=216+29.75;
 assert.ok(eligible(samples,249,at,216+20,216+21),
  "The quiet, measured musical release should trigger 3+ seconds before the encoded end");
 assert.equal(eligible(samples,249,216+26,216+20,216+21),false,
  "Do not treat still-audible outro music as silence");
 assert.equal(eligible(samples,249,at,216+28,216+21),false,
  "A late vocal lyric must not be interrupted");
 assert.equal(eligible(samples,249,at,216+20,216+29),false,
  "Model-detected late singing must veto the handoff");
 assert.equal(eligible(samples.map(x=>({...x,rms:0})),249,at),false,
  "CORS-muted capture is not evidence of silence");
 const comeback=samples.map(x=>({...x}));
 for(const x of comeback)if(x.at>216+29)x.rms=.010;
 assert.equal(eligible(comeback,249,at),false,
  "A new beat or chorus makes the tail ineligible");
});
test("desktop fallback prebuffers even if harmonic plan is null or direct-cut",()=>{
 assert.match(source,/if\(!isIOS&&\(plan===null\|\|plan.kind==="cut"\)/);
 assert.match(source,/if\(tryLiveQuietMix\(app,audio,id,next,finalLyric,measuredEnding\)\)return/);
 assert.match(source,/source\.connect\(analyser\); \/\/ No destination/);
 assert.ok(!source.includes("source.connect(ctx.destination)"),
  "Do not reroute original playback through the analysis context");
});

test("real-time capture keeps browser audio on native path and uses selective CORS",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.match(app,/function _assegnaAudioSorgente\(a,source\)/);
 assert.match(app,/u\.hostname==="raw\.githubusercontent\.com"/);
 assert.match(app,/else a\.removeAttribute\("crossorigin"\)/);
 assert.match(app,/_assegnaAudioSorgente\(audio,t\._mbNormalFallbackTried\?/);
 assert.match(app,/_assegnaAudioSorgente\(audio,_url\)/);
 assert.match(source,/function closeLiveOutro\(\)/);
 assert.match(source,/if\(liveOutro&&liveOutro\.audio!==audio\)closeLiveOutro\(\)/);
});
test("GitHub Pages fire artwork avoids 405 POST and HTTP bridge mixed content",()=>{
 const fire=fs.readFileSync(path.join(__dirname,"..","fuoco.js"),"utf8");
 assert.ok(fire.includes('location.protocol === "https:" && /\\.github\\.io$/i.test(location.hostname)'));
 assert.ok(fire.includes("mettiArtwork(bruciata);\n      return;"));
});

test("screen recording 19:32:45: verified soft release gets a head start without losing musical intros",()=>{
 const live=source.slice(source.indexOf("function liveQuietOutroReady("),
  source.indexOf("function tryLiveQuietMix("));
 const eligible=new Function(live+"return liveQuietOutroReady")();
 const samples=[];
 for(let t=72;t<93;t+=.25)samples.push({at:t,rms:t<91?.015:.006});
 for(let t=93;t<=97;t+=.25)
  samples.push({at:t,rms:.0048*Math.exp(-(t-93)*.42)});
 assert.equal(eligible(samples,101,96,88,89),true,
  "The measured fading end qualifies with five seconds left");
 assert.equal(eligible(samples,101,96,94.5,89),false,
  "Do not overlap a new sung line");
 assert.equal(eligible(samples.map(x=>x.at>95.5?{...x,rms:.018}:x),
  101,96,88,89),false,"Do not interrupt a returning beat");
 assert.equal(eligible(samples.map(x=>({...x,rms:0})),
  101,96,88,89),false,"A muted capture is not musical evidence");
 assert.match(source,/kind:"quiet",silenceTrim:false/);
 assert.match(source,/Math\.abs\(nextAnalysis\.duration-prepared\.audio\.duration\)<1\.5/);
 assert.match(source,/const entry=verifiedIntro\?clamp\(nextAnalysis\.safeIntroAt,0,18\):0/);
 const curveSource=source.slice(source.indexOf("function mixCurve("),
  source.indexOf("async function beginMix("));
 const curve=new Function("const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));"+
  curveSource+"return mixCurve")();
 assert.ok(curve("quiet",.2).inGain>curve("soft",.2).inGain,
  "The incoming song should rise earlier than the old linear fade");
 assert.equal(curve("quiet",0).inGain,0);
 assert.ok(Math.abs(curve("quiet",1).inGain-1)<1e-12);
});

test("screen recording 19:46:33: never log a fake mix repeatedly after preview error",()=>{
 const quiet=source.slice(source.indexOf("function tryLiveQuietMix("),
  source.indexOf("function tick(){"));
 const fade=source.slice(source.indexOf("async function beginMix("),
  source.indexOf("// Even when the next MP3"));
 assert.match(quiet,/prepared\.ready&&!prepared\.failed/);
 assert.match(quiet,/prepared\.audio\?\.readyState>=2/);
 assert.match(quiet,/quietDirectHandoff\(app,audio,id,next,entry/);
 assert.ok(!quiet.includes("console.info("),
  "Do not claim a successful overlap from the decision function");
 assert.ok(fade.indexOf("await upcoming.play()")>=0);
 assert.ok(fade.indexOf("await upcoming.play()")<
  fade.indexOf("Sovrapposizione audio avviata"),
  "Report a crossfade only after the second player actually starts");
 assert.match(source,/p\.failed=true;p\.ready=false/);
 assert.match(source,/quietHandoffFor===pair/);
 assert.match(source,/duration-now>13\.5\|\|duration-now<2\.2/);
});

test("intermittent MP3 failures: one original-track fallback, fresh retry, no stale-track override",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const create=app.slice(app.indexOf("function createAudio()"),
  app.indexOf("function rebuildAudio("));
 const error=app.slice(app.indexOf("function handleError()"),
  app.indexOf("async function usaCopiaLocale("));
 assert.ok(!create.includes('a.addEventListener("error", function ()'),
  "Two simultaneous media-error listeners must not race");
 assert.match(error,/!t\._mbNormalFallbackTried/);
 assert.match(error,/original=String\(audio\.currentSrc\|\|audio\.src\)\.replace\("\/bassi\/","\/"\)/);
 assert.match(error,/errorCode===2\|\|errorCode===3\|\|errorCode===4/);
 assert.match(error,/!t\._mbRicaricaMp3Provata/);
 assert.match(error,/currentId!==failingId\|\|audio!==failingAudio/);
 assert.match(app,/_mbNormalFallbackTried = false/);
});

test("release version is identical in player, metadata, HTML assets and service worker",()=>{
 const root=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
 const app=root("app.js"),html=root("index.html"),
  sw=root("sw.js"),meta=JSON.parse(root("versione.json"));
 const match=/const APP_VERSION = "([0-9]+\.[0-9]+)";/.exec(app);
 assert.ok(match,"Application version constant must be present");
 assert.equal(match[1],meta.versione,
  "Player version must match the online metadata: no more stale version badges");
 const token=match[1].replace(/\./g,"");
 assert.ok(html.includes('app.js?v='+token+'"'),
  "HTML must request the updated player script");
 assert.ok(html.includes('mix-intelligente.js?v='+token+'"'),
  "HTML must request the same release of DJ Mix");
 assert.ok(sw.includes('spotifynonavraiimieisoldi-v'+token+'"'),
  "Offline worker version must match the player");
});

test("20:03 and 20:05 recordings: matched energetic instrumental ending mixes before silence",()=>{
 const e=engine(false,true);
 const a={duration:100,last:100,bpm:120,beatConfidence:.75,level:.2,
  protectedEnding:true,confidentTail:false,outroFinalNotes:[.2,.3],
  lastLyricAt:75,beatAnchor:98};
 const b={duration:136,bpm:121,beatConfidence:.76,level:.21,
  introDrive:.82,introAttackNotes:[.3,.2],introBeat:0,safeIntroAt:0};
 const plan=e.transition(a,b,100);
 assert.ok(plan?.strongBeatBridge && plan.instrumentalBeatBridge,
  "Do not mistake a loud matched instrumental beat for a protected silence-only tail");
 assert.equal(plan.kind,"beat");
 assert.ok(plan.begin<=96.5 && plan.fade>=3.5);
 assert.equal(plan.silenceTrim,false);
 assert.equal(plan.entry,0);
 assert.ok(plan.end>=99.9,"Preserve the last old beat during the handoff");
});
test("energetic beat does not overpower late singing, uncertain detection or incompatible intros",()=>{
 const e=engine(false,true),mismatch=engine(false,false);
 const a={duration:100,last:100,bpm:120,beatConfidence:.8,level:.2,
  protectedEnding:true,outroFinalNotes:[.3,.2],lastLyricAt:75};
 const b={duration:120,bpm:121,beatConfidence:.82,level:.2,
  introDrive:.8,introAttackNotes:[.2,.3],safeIntroAt:0};
 for(const update of [{lastLyricAt:97},{lastLyricAt:undefined},
   {lastVoiceAt:98},{beatConfidence:.12}]){
  assert.ok(!e.transition({...a,...update},b,100)?.instrumentalBeatBridge,
   "Do not mix over unknown/late vocal, untrusted beat or unsafe finish");
 }
 assert.ok(!e.transition(a,{...b,firstVoiceAt:.5},100)?.instrumentalBeatBridge);
 assert.ok(!e.transition(a,{...b,introDrive:.09},100)?.instrumentalBeatBridge);
 assert.ok(!mismatch.transition(a,b,100)?.instrumentalBeatBridge,
  "Do not assert an exact match from similar BPM alone");
 const iphone=engine(true,true).transition(a,b,100);
 assert.ok(iphone?.instrumentalBeatBridge && iphone.quietCertified,
  "Allow explicitly vocal-safe rhythmic overlay on iPhone foreground");
});

test("20:19:15 recording: a planned soft mix may recover during measured decay",()=>{
 const marker=source.slice(source.indexOf("function liveQuietOutroReady("),
  source.indexOf("function tryLiveQuietMix("));
 const tools=new Function(marker+
  "return {liveQuietOutroReady,needsLiveQuietRecovery}")();
 const samples=[];
 // Representative relative RMS envelope from the screen recording:
 // audible music -> decaying tail -> encoded silence; no audio embedded.
 for(let t=7;t<=22;t+=.25)
  samples.push({at:t,rms:.011+.003*Math.abs(Math.sin(t*2.1))});
 for(let t=22.25;t<=27;t+=.25)
  samples.push({at:t,rms:.014*Math.exp(-(t-22.25)*.7)});
 const now=26.5,duration=32;
 assert.equal(tools.liveQuietOutroReady(samples,duration,now,18,18),true,
  "The fade is real before the final silence starts");
 assert.equal(tools.liveQuietOutroReady(samples,duration,23,18,18),false,
  "Do not interrupt the still-strong final beat");
 assert.equal(tools.liveQuietOutroReady(samples,duration,now,25,18),false,
  "A newly sung line must veto the overlap");
 assert.equal(tools.needsLiveQuietRecovery({kind:"soft",begin:25},now,true),true,
  "Existing soft plan must not disable verified live-outro detection");
 assert.equal(tools.needsLiveQuietRecovery({kind:"beat",begin:24},now,false),true,
  "A beat preview that never loaded may fall back after its musical cue");
 assert.equal(tools.needsLiveQuietRecovery({kind:"beat",begin:24},now,true),false,
  "Do not downgrade an executable beat-to-beat transition");
 assert.equal(tools.needsLiveQuietRecovery({kind:"beat",begin:26.3},now,false),false,
  "Do not skip a matching beat before its cue arrives");
 assert.match(source,/if\(needsLiveQuietRecovery\(plan,audio.currentTime,mixReady\)\|\|plannedLate\)/);
});

test("20:33:52: beat match searches beyond ten queued songs and works again on next track",async()=>{
 const src=source.slice(source.indexOf("async function intelligentShuffle("),
  source.indexOf("function smartScore("));
 const vocalMerge=source.slice(source.indexOf("function withValidatedVoice("),
  source.indexOf("function deepStatus(){",source.indexOf("function withValidatedVoice(")));
 const create=new Function(vocalMerge+"const enabled=true,isIOS=false;"+
  "const window={MusicBoxRoom:{isActive:()=>false}},console={info(){}};"+
  "const cache=new Map(),shuffleRunFor='',noop=0;"+
  "const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));"+
  "const grooveAgreement=()=>({score:.9});"+
  "const similarNotes=()=>({focused:.8,phrase:.8});"+
   "const camelotMatch=()=>({score:.5,weight:0});"+
  "const hasImmediateMusicalIntro=()=>true;"+
   "const desktopBeatPairCertified=()=>true,iphoneQuietReleaseCertified=()=>true;"+
  "let fromAnalysis={duration:200,bpm:120,beatConfidence:.82};"+
  "const deepLookup=t=>({id:t.id,duration:200,bpm:120,"+
  "beatConfidence:.8,introDrive:.8});"+
  "const decode=async t=>t.id.startsWith('current')?fromAnalysis:deepLookup(t);"+
  "const musicallyCompatibleOverlay=()=>true;"+
   "const transition=(a,b)=>b.id.startsWith('winner')?"+
  "{kind:'beat',fade:4.2,grooveScore:.91,score:93,"+
  "instrumentalBeatBridge:true}:null;"+
  src+"return {intelligentShuffle};");
 const engine=create(),pool=Array.from({length:65},(_,i)=>({
  id:i===42?"winner-1":i===53?"winner-2":"other-"+i,url:"songs/"+i+".mp3"
 }));
 let current="current-1",chosen=[];
 const app={
  currentId:()=>current,
  allTracks:()=>[{id:current},...pool],
  mixShuffleCandidates:()=>pool.slice(0,10),
  mixShufflePool:()=>pool,
  mixSelectShuffle:selection=>{chosen.push(selection);return true},
  mixLyricCues:()=>({first:4,last:90})
 };
 const audio={duration:200,currentTime:20};
 let result=await engine.intelligentShuffle(app,audio,current);
 assert.ok(result.selected);
 assert.equal(chosen[0].pickId,"winner-1",
  "First song must discover a real beat candidate beyond the first ten");
 current="current-2";
 // A next-song cycle must be able to select a fresh candidate, too.
 const newPool=pool.filter(t=>t.id!=="winner-1");
 app.mixShufflePool=()=>newPool;
 app.mixShuffleCandidates=()=>newPool.slice(0,10);
 result=await engine.intelligentShuffle(app,audio,current);
 assert.ok(result.selected);
 assert.equal(chosen[1].pickId,"winner-2",
  "Do not become a one-shot DJ after the first handoff");
 assert.match(source,/shuffleGeneration\+\+;shuffleBusy=false/);
 assert.match(source,/generation===shuffleGeneration\)shuffleBusy=false/);
 assert.match(source,/failedAt=Date\.now\(\)/);
});
test("beat search preserves manually selected queue and never chooses a soft match over actual beat",async()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.match(app,/mixShufflePool:\(\)=>\{/);
 assert.match(app,/if\(!shuffle\|\|queue\.length\|\|repeat\|\|!currentId/);
 assert.match(app,/fresh\.has\(t\.id\)/);
 assert.match(app,/const pool=window\.MusicBoxBridge\.mixShufflePool\(\)/);
 assert.match(source,/cue\.verifiedHarmonicBridge===true/);
 assert.match(source,/cue\.verifiedMicroBeat===true/);
 assert.match(source,/if\(!verified\)\{/);
 assert.match(source,/const choicePool=scored\.length\?scored:softScored/);
 assert.match(source,/cue\.quietCertified===true/);
 assert.match(source,/return \{retry:unknown\.length>picked\.length&&noMatch/);
});

test("version badge uses the real header button, updates worker before reload, preserves MP3 caches",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 assert.match(html,/<button class="ver" id="appVer" type="button"/);
 assert.ok(!html.includes('id="verBadge"'),"Obsolete version badge must not exist");
 assert.ok(!app.includes('$("verBadge")'),"Do not bind to a missing element");
 assert.match(app,/vf\.addEventListener\("click", _aggiornaMusicBoxDaVersione\)/);
 assert.match(app,/\$\("btnRefresh"\)\.addEventListener\("click", _aggiornaMusicBoxDaVersione\)/);
 const first=app.indexOf("async function _aggiornaMusicBoxDaVersione(");
 const last=app.indexOf('  $("btnRefresh").addEventListener("click"',first);
 const updater=app.slice(first,last);
 assert.ok(first>=0&&last>first,"Updater must be available to both refresh buttons");
 assert.match(updater,/getRegistration\(\)/);
 assert.match(updater,/reg\.update\(\)/);
 assert.match(updater,/reg\.waiting\) reg\.waiting\.postMessage\(\{ type: "SKIP_WAITING" \}/);
 assert.match(updater,/searchParams\.set\("forza", String\(Date\.now\(\)\)\)/);
 assert.match(updater,/window\.location\.assign\(url\.href\)/);
 assert.ok(!/caches\.delete\(|indexedDB\.deleteDatabase\(|unregister\(\)/.test(updater),
  "Never clear offline caches or databases when refreshing the app");
 assert.match(css,/#appVer:focus-visible/);
 assert.match(css,/#appVer:disabled/);
});
