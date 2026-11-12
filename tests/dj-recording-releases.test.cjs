"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const introHelpers=source.slice(source.indexOf("function musicalIntroEntry("),
 source.indexOf("function hasImmediateMusicalIntro("));
const introText=source.slice(source.indexOf("function hasImmediateMusicalIntro("),
 source.indexOf("function transition(",source.indexOf("function hasImmediateMusicalIntro(")));
assert.match(introText,/function hasImmediateMusicalIntro\(/);
const immediate=new Function("const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));"+
 introHelpers+introText+"return hasImmediateMusicalIntro")();
const liveText=source.slice(source.indexOf("function liveQuietOutroReady("),
 source.indexOf("function needsLiveQuietRecovery("));
const ready=new Function(liveText+"return liveQuietOutroReady")();
function samples(){
 const data=[];
 // Synthetic envelope approximates the user's second screen recording:
 // regular musical energy, then real falling final notes, not silence.
 for(let t=0;t<=20;t+=.25){
  let level=.05+Math.abs(Math.sin(t*3.7))*.010;
  if(t>=15.5)level=.052*Math.exp(-(t-15.5)*.40);
  data.push({at:t,rms:level});
 }
 return data;
}
test("release can trigger during audible decaying music, BEFORE absolute silence",()=>{
 const x=samples();
 const now=19.75;
 assert.equal(ready(x,24.4,now,10,11),true,
  "Measured musical release should overlap around 4.6 s before the end");
 assert.ok(x.find(p=>p.at===now).rms>.006,
  "Last frame is still audibly above the previously-required silence gate");
});
test("early full-energy ending is never mistaken for a decaying outro",()=>{
 const x=samples().map(p=>({...p,rms:.048+Math.abs(Math.sin(p.at*6))*.014}));
 assert.equal(ready(x,24.4,19.75,10,11),false);
});
test("late vocal or a final karaoke line veto even a perfect audio decay",()=>{
 const x=samples();
 assert.equal(ready(x,24.4,19.75,17,11),false);
 assert.equal(ready(x,24.4,19.75,10,18.9),false);
});
test("a last-second new kick invalidates falling-release certification",()=>{
 const x=samples();
 for(const p of x)if(p.at>=19.25)p.rms=.060;
 assert.equal(ready(x,24.4,19.75,10,11),false);
});
test("missing or muted audio capture cannot approve a false musical release",()=>{
 assert.equal(ready(samples().map(p=>({...p,rms:0})),24.4,19.75),false);
 assert.equal(ready([],24.4,19.75),false);
});
test("reject incoming music that enters late despite high four-second average",()=>{
 assert.equal(immediate({introDrive:.85,first:3.5,safeIntroAt:0}),false);
 assert.equal(immediate({introDrive:.43,first:0,introBeat:8.5}),true,
  "Strongest onset at 8s is not evidence that the first musical beat is at 8s");
});
test("verified digital silence at the start can be skipped without deleting music",()=>{
 assert.equal(immediate({introDrive:.85,first:3.5,safeIntroAt:3.25,introBeat:3.8}),true);
});
test("detect an intro whose first bar is weak despite late high-volume beat",()=>{
 const g=[...Array(8).fill(-1.2),...Array(16).fill(.6),...Array(8).fill(0)];
 assert.equal(immediate({introDrive:.8,first:0,safeIntroAt:0,introGroove:g}),false);
});
test("allow an immediate, driven, repeating opening instead of false rejection",()=>{
 const g=Array.from({length:32},(_,i)=>i%4===0?1.3:-.4);
 assert.equal(immediate({introDrive:.76,first:0,safeIntroAt:0,introBeat:2,introGroove:g}),true);
});
test("do not modify source music, offline caches, or disable vocal protections",()=>{
 assert.match(source,/if\(Number\.isFinite\(lastLyricAt\)&&now-lastLyricAt<4\.5\)return false/);
 assert.match(source,/if\(Number\.isFinite\(lastVoiceAt\)&&now-lastVoiceAt<2\.5\)return false/);
 assert.match(source,/source\.connect\(analyser\); \/\/ No destination/);
});

// 23:18:26 screen recording: first track passes through a real quiet
// passage, then the final beat release is around 11-12 seconds before EOF.
// Never act on the temporary valley; act only on a certified final release.
const earlyText=source.slice(source.indexOf("function certifiedEarlyReleaseReady("),
 source.indexOf("function tryLiveQuietMix("));
const early=new Function(earlyText+"return certifiedEarlyReleaseReady")();
const outgoing={duration:206,last:201,dropRelease:{lastImpactAt:193.8,
 releaseAt:194.2,score:.88,quietLevel:.12},protectedEnding:false};
test("23:18 recording: certified final impact is eligible with 11+ seconds left",()=>{
 assert.equal(early(outgoing,206,194.4,186),true);
 assert.equal(early(outgoing,206,190,186),false,
  "The earlier pause is not the final musical release");
 assert.equal(early(outgoing,206,194.4,192.4),false,
  "Never bury a last lyric overlapping the release");
 assert.equal(early({...outgoing,lastVoiceAt:193.6},206,194.4,186),false);
});
test("never mistake a temporary volume valley or renewed last chorus for a final release",()=>{
 assert.equal(early({...outgoing,dropRelease:null},206,194.4,186),false);
 assert.equal(early({...outgoing,protectedEnding:true},206,194.4,186),false);
 assert.equal(early({...outgoing,duration:192},206,194.4,186),false);
 assert.equal(early({...outgoing,dropRelease:{...outgoing.dropRelease,score:.4}},206,194.4,186),false);
 assert.equal(early({...outgoing,dropRelease:{...outgoing.dropRelease,quietLevel:.38}},206,194.4,186),false);
});
test("23:18 recording: early verified impact can preempt a later silent-tail cue",()=>{
 assert.match(source,/const plannedLate=earlyRelease&&!plan\?\.measuredReleaseLeadIn&&/);
 assert.match(source,/\(!plan\|\|plan.kind==="cut"\|\|/);
 assert.match(source,/plan.begin>audio.currentTime\+1\.2/);
 assert.match(source,/if\(needsLiveQuietRecovery\(plan,audio.currentTime,mixReady\)\|\|plannedLate\)/);
 assert.match(source,/if\(!earlyCertified&&!liveQuietOutroReady\(/);
 assert.match(source,/if\(!nextAnalysis\|\|!hasImmediateMusicalIntro\(nextAnalysis\)\|\|/);
 assert.match(source,/!musicallyCompatibleOverlay\(analysis,nextAnalysis/);
});
test("the mixer logs its actual start, not only a selected library candidate",()=>{
 assert.match(source,/console.info\("\[Music Box DJ\] Sovrapposizione audio avviata"/);
 assert.match(source,/actualAt:Number\(old.currentTime.toFixed\(2\)\)/);
 assert.match(source,/remaining:Number\(\(old.duration-old.currentTime\).toFixed\(2\)\)/);
});

test("real diagnostic 1197: finished musical postlude can crossfade safely",()=>{
 const start=source.indexOf("function desktopMeasuredPostludeBridge(");
 const end=source.indexOf("function continuityFallback(",start);
 assert.ok(start>0&&end>start);
 const fn=new Function("isIOS","hasImmediateMusicalIntro","musicalIntroEntry",
  source.slice(start,end)+"return desktopMeasuredPostludeBridge;")(false,()=>true,()=>0);
 const a={duration:249.133,last:243.9,confidentTail:false,
  protectedEnding:false,lastLyricAt:215.11,lastVoiceAt:213.59,
  dropRelease:{lastImpactAt:241.3,releaseAt:241.75,
    quietLevel:.2685,score:.7315}};
 const b={duration:200,introDrive:.8};
 const plan=fn(a,b,249.133);
 assert.ok(plan,"the measured final decay must not wait through room noise");
 assert.equal(plan.kind,"soft");
 assert.equal(plan.measuredPostludeBridge,true);
 assert.equal(plan.score,null,"no false beat certification");
 assert.ok(plan.begin>a.last&&plan.end<=a.duration-.40);
 assert.equal(fn({...a,protectedEnding:true},b,249.133),null);
 assert.equal(fn({...a,lastVoiceAt:243.3},b,249.133),null);
 assert.equal(fn({...a,lastLyricAt:240},b,249.133),null);
 assert.equal(fn({...a,last:248.7},b,249.133),null);
 assert.equal(fn({...a,confidentTail:true},b,249.133),null);
 assert.equal(fn({...a,dropRelease:{...a.dropRelease,quietLevel:.5}},b,249.133),null);
 assert.equal(fn({...a,dropRelease:{...a.dropRelease,score:.6}},b,249.133),null);
});
test("postlude can be selected even after strict beatmatch rejects a pair",()=>{
 assert.ok(source.includes("certifiedPostlude=postlude&&"));
 assert.ok(source.includes("certifiedQuietAlternative||certifiedSilentBridge||certifiedPostlude"));
 assert.ok(source.includes("proposed.measuredPostludeBridge?.35:1.2"));
 assert.ok(source.includes('cue.measuredPostludeBridge===true&&cue.kind==="soft"'));
});

test("actual recording 1197 to 28 indexed context is logged for audio handoff",()=>{
 const index=JSON.parse(fs.readFileSync(path.join(__dirname,"..","dj-deep-analysis.json"),"utf8"));
 const a=index.entries?.["audio/songs/track-1197.mp3"];
 const b=index.entries?.["audio/songs/track-28.mp3"];
 console.info("[DJ USER REAL PAIR 1197->28]",JSON.stringify({
  found:!!a&&!!b,
  outgoing:a&&{duration:a.duration,last:a.last,
   confidentTail:a.confidentTail,protectedEnding:a.protectedEnding,
   release:a.dropRelease,lastVoiceAt:a.lastVoiceAt,lastLyricAt:a.lastLyricAt},
  incoming:b&&{duration:b.duration,bpm:b.bpm,beatConfidence:b.beatConfidence,
   first:b.first,safeIntroAt:b.safeIntroAt,introDrive:b.introDrive,
   introBeat:b.introBeat,firstVoiceAt:b.firstVoiceAt,firstLyricAt:b.firstLyricAt}
 }));
 assert.ok(index.entries&&Object.keys(index.entries).length>500);
});

test("postlude requires proof that final vocals ended",()=>{
 const start=source.indexOf("function desktopMeasuredPostludeBridge(");
 const end=source.indexOf("function continuityFallback(",start);
 const f=new Function("isIOS","hasImmediateMusicalIntro","musicalIntroEntry",
  source.slice(start,end)+"return desktopMeasuredPostludeBridge;")(false,()=>true,()=>0);
 const a={duration:249.133,last:243.9,confidentTail:false,protectedEnding:false,
  dropRelease:{lastImpactAt:241.3,releaseAt:241.75,quietLevel:.2685,score:.7315}};
 const b={introDrive:.8};
 assert.equal(f(a,b,a.duration),null,"no lyric/voice proof");
 assert.ok(f({...a,lastLyricAt:215.11},b,a.duration));
 assert.equal(f({...a,lastLyricAt:242},b,a.duration),null);
 assert.ok(f({...a,voiceModel:"validated",voiceScannedEnd:243.9,lastVoiceAt:211},b,a.duration));
});

test("real indexed Ste-library alternatives after track 1197 have audible intros",()=>{
 const idx=JSON.parse(fs.readFileSync(path.join(__dirname,"..","dj-deep-analysis.json"),"utf8"));
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,"..","stato.json"),"utf8"));
 const start=app.indexOf("const BUILTIN = ["),end=app.indexOf("\n  ];",start);
 const rows=new Function("return "+app.slice(start+"const BUILTIN = ".length,end+5))();
 const copied=new Set(catalog.miei?.Ste||[]);
 const allowed=rows.filter(t=>((t.profile||"Ste")==="Ste")||
   copied.has("b-"+String(t.file||"").split("/").pop().replace(/\.mp3$/i,"")))
   .map(t=>({file:"audio/"+t.file,title:t.title,artist:t.artist}));
 const beginIntro=source.indexOf("function musicalIntroEntry(");
 const endIntro=source.indexOf("function rhythmicFullTailJoin(",beginIntro);
 const beginHas=source.indexOf("function measuredQuietRhythmicIntro(");
 const endHas=source.indexOf("// A safe ending alone",beginHas);
 const beginPost=source.indexOf("function desktopMeasuredPostludeBridge(");
 const endPost=source.indexOf("function continuityFallback(",beginPost);
 assert.ok(beginIntro>=0&&endIntro>beginIntro&&beginHas>=0&&endHas>beginHas&&beginPost>=0&&endPost>beginPost);
 const fn=new Function("isIOS","clamp",
  source.slice(source.indexOf("function onsetPeriodicity("),source.indexOf("function onsetGridPhase("))+source.slice(beginIntro,endIntro)+source.slice(beginHas,endHas)+
  source.slice(beginPost,endPost)+"return desktopMeasuredPostludeBridge;")(
  false,(x,a,b)=>Math.max(a,Math.min(b,x)));
 const outgoing=idx.entries?.["audio/songs/track-1197.mp3"];
 const incoming28=idx.entries?.["audio/songs/track-28.mp3"];
 assert.ok(outgoing&&incoming28);
 const proved={...outgoing,lastLyricAt:215.11,lastVoiceAt:213.59,
  voiceModel:"runtime-diagnostic",voiceScannedEnd:244.5};
 assert.equal(fn(proved,incoming28,proved.duration),null,
  "track-28 opening is measured almost silent, so it must not be chosen");
 const candidates=allowed.flatMap(t=>{
  const analysis=idx.entries?.[t.file];
  if(!analysis||t.file==="audio/songs/track-1197.mp3")return [];
  const cue=fn(proved,analysis,proved.duration);
  return cue?[{id:t.file,introDrive:analysis.introDrive,bpm:analysis.bpm,title:t.title}]:[];
 }).sort((a,b)=>b.introDrive-a.introDrive);
 console.info("[DJ 1197 STE AUDIBLE POSTLUDE]",JSON.stringify({
  library:allowed.length,candidates:candidates.length,
  first:candidates.slice(0,8)
 }));
 assert.ok(candidates.length>=1,"real Ste library must contain a safe audible-intro alternative");
});

test("actual last-impact cue starts before the measured last audible frame",()=>{
 const start=source.indexOf("function desktopFinalImpactRelay(");
 const end=source.indexOf("function desktopMeasuredPostludeBridge(",start);
 assert.ok(start>=0&&end>start);
 const join=new Function("isIOS","hasImmediateMusicalIntro","beatBearingIntro",
   "grooveAgreement","onsetGridPhase","musicalIntroEntry",
   source.slice(start,end)+"return desktopFinalImpactRelay;")(
    false,()=>true,(b,min)=>Number(b.introDrive)>=min,()=>({score:.77}),()=>.12,()=>0);
 const a={duration:249.133,last:243.9,bpm:129.2,beatConfidence:.247,
  lastLyricAt:215.11,lastVoiceAt:213.59,protectedEnding:false,
  dropRelease:{lastImpactAt:241.3,releaseAt:241.75,score:.7315,quietLevel:.2685}};
 const b={duration:205,bpm:129.2,beatConfidence:.23,introDrive:.8,
  introOnset:Array(96).fill(.25)};
 const cue=join(a,b,249.133);
 assert.ok(cue);
 assert.equal(cue.kind,"soft");
 assert.equal(cue.measuredFinalImpact,true);
 assert.equal(cue.finalImpactAt,241.3);
 assert.ok(cue.begin<241.3&&cue.end>243.9);
 assert.ok(cue.begin<243.9-2.0,"must enter on last kick, not after the musical tail");
 assert.equal(cue.silenceTrim,false);
 assert.equal(cue.score,null,"never claim an unverified full beatmatch");
 assert.equal(join({...a,lastLyricAt:240},b,249.133),null);
 assert.equal(join({...a,lastVoiceAt:241},b,249.133),null);
 assert.equal(join({...a,protectedEnding:true},b,249.133),null);
 assert.equal(join({...a,dropRelease:{...a.dropRelease,score:.55}},b,249.133),null);
 assert.equal(join(a,{...b,introDrive:.1},249.133),null);
 assert.equal(join(a,{...b,bpm:165},249.133),null);
 assert.equal(join({...a,lastLyricAt:null,lastVoiceAt:null},b,249.133),null,
  "missing vocal evidence does not allow an on-beat overlap");
});
test("final-impact scheduler rejects missed last beat instead of late silence",()=>{
 const start=source.indexOf("function desktopBeatStartDelay(");
 const end=source.indexOf("async function beginMix(",start);
 const delay=new Function(source.slice(start,end)+"return desktopBeatStartDelay;")();
 const cue={kind:"soft",measuredFinalImpact:true,
  finalImpactAt:241.3,nextBeat:.12,end:243.97};
 assert.ok(Math.abs(delay(cue,241.11)-.07)<.002);
 assert.equal(delay(cue,241.32),null,"too late to enter on final impact");
 assert.equal(delay(cue,239.0),null,"no early speculative play");
 assert.match(source,/plan\.kind==="snap"\|\|(?:plan\.kind==="underlay"\|\|)?plan\.measuredFinalImpact===true/);
 assert.match(source,/if\(act\.measuredFinalImpact\)\{/);
});

test("certified release fallback does not authorize unsafe or iPhone overlays",()=>{
 const part=source.slice(source.indexOf("function certifiedAlternateRelease("),
   source.indexOf("function unalignedTransition(",
    source.indexOf("function certifiedAlternateRelease(")));
 const make=(failed,early,post,isIOS=false)=>{
  const factory=new Function("isIOS","desktopMeasuredReleaseLeadIn",
   "lowEnergyPostludeLeadIn","musicallyCompatibleOverlay",
   part+"return certifiedAlternateRelease;");
  return factory(isIOS,()=>early,()=>post,(a,b,p)=>p?.certified===true)(
   {duration:200},{duration:200},200,failed);
 };
 const bad={kind:"snap",certified:false},early={kind:"soft",certified:true},
       post={kind:"postlude",certified:true};
 assert.equal(make(bad,early,post),early);
 assert.equal(make(bad,early,post,true),post,
  "desktop-only releases are not available on iPhone");
 assert.equal(make(bad,null,post),post);
 assert.equal(make(bad,{kind:"soft",certified:false},null),bad);
 assert.equal(make(null,early,post),null);
 assert.equal(make({kind:"cut"},early,post).kind,"cut");
});
test("desktop independently measured releases must bypass the iOS-only quiet gate",()=>{
 const i=source.indexOf("const weakDesktopMatch=");
 const j=source.indexOf("const latePlannedSoft=",i);
 assert.ok(i>=0&&j>i);
 const gate=source.slice(i,j);
 assert.ok(gate.includes("candidate.measuredReleaseLeadIn!==true"));
 assert.match(gate,/!desktopBeatPairCertified/);
});

test("desktop crossfade follows decoded MP3 clocks rather than stale wall time",()=>{
 const i=source.indexOf("function djAudioClockProgress("),j=source.indexOf("function desktopBeatStartDelay(",i);
 assert.ok(i>=0&&j>i,"dedicated decoder-clock guard must exist");
 const progress=new Function("clamp",source.slice(i,j)+"return djAudioClockProgress;")(
  (n,min,max)=>Math.max(min,Math.min(max,n)));
 assert.equal(progress(102,100,22,20,1,4),.5);
 assert.ok(Math.abs(progress(102,100,22.04,20,1.02,4)-.5)<1e-8);
 assert.equal(progress(104.2,100,24.2,20,1,4),1);
 assert.equal(progress(100.85,100,20.01,20,1,4),null,
  "a stalled incoming decoder must not complete the mix");
 assert.equal(progress(100.02,100,20.9,20,1,4),null,
  "a stalled outgoing MP3 must not complete the mix");
 assert.equal(progress(99.8,100,20,20,1,4),null,
  "rewinding the outgoing MP3 must abort this cue");
 assert.equal(progress(102,100,22,20,Infinity,4),null);
 assert.equal(progress(102,100,22,20,1,0),null);
 const fade=source.slice(source.indexOf("function fadeStep(){",source.indexOf("async function beginMix(")),
   source.indexOf("if(time>=1){handoff();return}",source.indexOf("async function beginMix(")));
 assert.match(fade,/djAudioClockProgress\(/);
 assert.match(fade,/old\.seeking\|\|upcoming\.seeking/);
 assert.ok(!fade.includes("(performance.now()-act.at)/(act.fade*1000)"),
  "wall-time fade can complete while the MP3 decoder is stalled");
});
test("iPhone seek takes precedence over WebAudio and desktop re-seek waits for metadata",()=>{
 const tick=source.slice(source.indexOf("function tick(){"),
  source.indexOf("function paintWave(",source.indexOf("function tick(){")));
 assert.match(tick,/if\(isIOS&&mobileActive&&!mobileActive\.handingOff\)stopMobileMix\(\)/);
 const prep=source.slice(source.indexOf("function prepare("),source.indexOf("function naturalEndHandoff("));
 assert.match(prep,/p\.seekIssued\|\|upcoming\.seeking\|\|upcoming\.readyState<1/);
 assert.match(prep,/if\(!p\.seekReady\)\{p\.seekIssued=false;preseek\(\);return\}/);
});
test("bass reveal is measured, limited and never fabricates a beat",()=>{
 const dsp=source.slice(source.indexOf("function connectMixDsp("),
  source.indexOf("function djImpactBeatPoint("));
 assert.match(dsp,/if\(beatMatched&&dspMode==="auto"&&Math\.abs\(dspBass\)<\.05\)/);
 assert.match(dsp,/add\("lowshelf",95,2\.0\)/);
 assert.match(dsp,/createDynamicsCompressor/);
 assert.match(dsp,/limiter\.threshold\.value=-5/);
 assert.match(dsp,/beatMatched\|\|dspBass>0\|\|dspMid>0\|\|dspTreble>0/);
 const gainSnippet=source.slice(source.indexOf("function measuredReleasePreviewGain("),
   source.indexOf("function mixCurve("));
 const measured=new Function("clamp",gainSnippet+"return measuredReleasePreviewGain;")(
  (n,min,max)=>Math.max(min,Math.min(max,n)));
 assert.equal(measured(0,10,14,20),0);
 assert.ok(measured(12,10,14,20)>0&&measured(12,10,14,20)<.23);
 assert.ok(measured(10.8,10,14,20)>.13,
  "early harmonic release should be audible long before native EOF");
 assert.ok(Math.abs(measured(14,10,14,20)-.23)<.001);
 assert.ok(Math.abs(measured(20,10,14,20)-1)<.001);
});

test("certified rhythmic low-end gain is peak controlled in real WebAudio graphs",()=>{
 const i=source.indexOf("function connectMixDsp("),j=source.indexOf("function djImpactBeatPoint(",i);
 assert.ok(i>=0&&j>i);
 const graph=new Function("dspMode","dspStrength","dspBass","dspMid","dspTreble",
  source.slice(i,j)+"return connectMixDsp;")("auto",55,0,0,0);
 const links=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v},
  exponentialRampToValueAtTime(v){this.value=v}});
 let count=0;
 const ctx={currentTime:5,createBiquadFilter:()=>{
   const name="f"+ ++count;
   return {name,type:"",frequency:param(),Q:param(),gain:param(),
    connect(to){links.push(name+">"+(to.name||"out"))},disconnect(){}};
  },createDynamicsCompressor:()=>({name:"limiter",
   threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),
   connect(to){links.push("limiter>"+(to.name||"out"))},disconnect(){}})};
 const src={connect(to){links.push("src>"+(to.name||"out"))}},out={name:"out"};
 const nodes=graph(ctx,src,out,4,true,.52);
 assert.equal(nodes.length,3);
 assert.equal(nodes[0].type,"highpass","first filter must suppress unverified pre-beat bass");
 assert.equal(nodes[1].type,"lowshelf","boost only after the beat filter");
 assert.ok(nodes[1].gain.value<=2,"never add excessive automatic low-frequency boost");
 assert.equal(nodes[2].threshold.value,-5);
 assert.equal(nodes[2].ratio.value,4);
 assert.deepEqual(links,["src>f1","f1>f2","f2>limiter","limiter>out"]);
 const plain=graph(ctx,src,out,4,false,null);
 assert.equal(plain.length,0,"uncertified transitions must not receive boosted bass");
});
test("iPhone cancelled cursor gesture cannot seek or restart the native MP3",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const start=app.indexOf('progressBar.addEventListener("pointercancel",');
 const end=app.indexOf('  $("btnSeekBack")',start);
 assert.ok(start>=0&&end>start);
 const handler=app.slice(start,end);
 assert.ok(handler.includes("scrubbing = false;"));
 assert.ok(handler.includes("pendingSeek = null;"));
 assert.ok(!handler.includes("endScrub()"),"pointercancel must never request a seek");
 assert.ok(app.includes('progressBar.addEventListener("pointerup", endScrub)'));
});

test("quiet but beat-bearing opening survives every strict energy gate only with measured PCM pulses",()=>{
 const segment=source.slice(source.indexOf("function measuredQuietRhythmicIntro("),
  source.indexOf("// A safe ending alone"));
 const verify=new Function(
  "const musicalIntroEntry=b=>b.safeIntroAt||0,onsetPeriodicity=()=>.55;"+
  segment+"return beatBearingIntro;")();
 const intro=Array.from({length:96},(_,i)=>i%12===0?1:.02);
 const candidate={introDrive:.18,first:0,safeIntroAt:0,bpm:120,
  beatConfidence:.48,introOnset:intro};
 assert.equal(verify(candidate,.45),true,
  "a quiet but measured regular intro can enter the strict beat planner");
 assert.equal(verify({...candidate,introOnset:Array(96).fill(0)},.45),false,
  "quiet room tone is not a reliable rhythmic intro");
 assert.equal(verify({...candidate,introOnset:intro.map((x,i)=>i<48?x:.02)},.45),false,
  "a pulse in the first half alone is not a rhythmic intro");
 assert.equal(verify({...candidate,introDrive:.06},.45),false);
 assert.equal(verify({...candidate,first:2.4},.45),false,
  "a delayed attack must not produce a silent early transition");
 assert.equal(verify({...candidate,introDrive:.85,introOnset:null},.45),true,
  "an already strong intro remains eligible");
});
