"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const first=source.slice(source.indexOf("function clamp("),source.indexOf("async function decode("));
const second=source.slice(source.indexOf("function hasReliableHarmony("),source.indexOf("function keyGuess("));
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
test("incompatible local opening and outro favor discreet fade",()=>{
 const flat=[0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.90];
 const plan=transition({...current,safeOutroAt:172,outroChroma:flat},next,180);
 assert.ok(plan&&plan.kind==="soft");
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
 assert.ok(source.includes("const tail=a.outroChroma||a.chroma,head=b.introChroma||b.chroma;"));
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
