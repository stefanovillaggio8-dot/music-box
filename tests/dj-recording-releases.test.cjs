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
