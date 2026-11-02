"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const helpers=source.slice(source.indexOf("function findDropRelease("),source.indexOf("function analyzeFrames("));
const transitionSource=source.slice(source.indexOf("function transition("),source.indexOf("// Circle of fifths/Camelot:"));
function engine(ios=false,notesMatch=true){
 return new Function(
  "const isIOS="+String(ios)+",style='auto';"+
  "function clamp(x,a,b){return Math.max(a,Math.min(b,x))}"+
  "function similarNotes(){return {matches:"+String(notesMatch)+",focused:.91,phrase:.88,score:.92,alignment:{matches:"+String(notesMatch)+",fade:4.2,score:.95}}}"+
  "function grooveAgreement(){return {score:.87}}"+
  "function hasReliableHarmony(){return false}"+
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
