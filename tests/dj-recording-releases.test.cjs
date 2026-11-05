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
 assert.match(source,/const plannedLate=earlyRelease&&\(!plan\|\|plan.kind==="cut"\|\|/);
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
 const beginHas=source.indexOf("function hasImmediateMusicalIntro(");
 const endHas=source.indexOf("// A safe ending alone",beginHas);
 const beginPost=source.indexOf("function desktopMeasuredPostludeBridge(");
 const endPost=source.indexOf("function continuityFallback(",beginPost);
 assert.ok(beginIntro>=0&&endIntro>beginIntro&&beginHas>=0&&endHas>beginHas&&beginPost>=0&&endPost>beginPost);
 const fn=new Function("isIOS","clamp",
  source.slice(beginIntro,endIntro)+source.slice(beginHas,endHas)+
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
