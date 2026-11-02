"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const introText=source.slice(source.indexOf("function hasImmediateMusicalIntro("),
 source.indexOf("function transition(",source.indexOf("function hasImmediateMusicalIntro(")));
assert.match(introText,/function hasImmediateMusicalIntro\(/);
const immediate=new Function(introText+"return hasImmediateMusicalIntro")();
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
 assert.match(source,/if\(!nextAnalysis\|\|!hasImmediateMusicalIntro\(nextAnalysis\)\)return false/);
});
test("the mixer logs its actual start, not only a selected library candidate",()=>{
 assert.match(source,/console.info\("\[Music Box DJ\] Sovrapposizione audio avviata"/);
 assert.match(source,/actualAt:Number\(old.currentTime.toFixed\(2\)\)/);
 assert.match(source,/remaining:Number\(\(old.duration-old.currentTime\).toFixed\(2\)\)/);
});
