"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const helpers=source.slice(source.indexOf("function findDropRelease("),source.indexOf("function analyzeFrames("));
const transitionSource=source.slice(source.indexOf("function transition("),source.indexOf("// Circle of fifths/Camelot:"));
function engine(ios=false){
 return new Function(
  "const isIOS="+String(ios)+",style='auto';"+
  "function clamp(x,a,b){return Math.max(a,Math.min(b,x))}"+
  "function similarNotes(){return {matches:true,focused:.91,phrase:.88,score:.92,alignment:{matches:true,fade:4.2,score:.95}}}"+
  "function grooveAgreement(){return {score:.87}}"+
  "function bpmGap(){return 0}"+
  "function camelotMatch(){return {weight:0,score:1}}"+
  helpers+transitionSource+
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
test("iPhone refuses an unverified overlapping release, but uses timed safe outro",()=>{
 const {e,outgoing,incoming}=fixture(true);
 assert.ok(!e.transition(outgoing,incoming,100)?.dropReleaseBridge);
 const verified=e.transition({...outgoing,lastLyricAt:80},incoming,100);
 assert.ok(verified?.dropReleaseBridge&&verified.quietCertified);
});
test("wrong MP3 duration cannot trigger speculative drop skip",()=>{
 const {e,outgoing,incoming}=fixture();
 assert.equal(e.transition({...outgoing,duration:85},incoming,100),null);
});
