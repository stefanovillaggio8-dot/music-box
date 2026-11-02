"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const analysis=source.slice(source.indexOf("function clamp("),source.indexOf("async function decode("));
const plan=source.slice(source.indexOf("function hasReliableHarmony("),source.indexOf("function resetMobileFade("));
const {chroma,harmonicTimeline,similarNotes,bestHarmonicAlignment,transition}=new Function(
 'const isIOS=false,style="auto",mixSeconds=6;\n'+analysis+'\n'+plan+
 '\nreturn {chroma,harmonicTimeline,similarNotes,bestHarmonicAlignment,transition};'
)();
function song(tones){
 const rate=8000,duration=60,data=new Float32Array(rate*duration);
 for(let i=0;i<data.length;i++){
  const t=i/rate;
  let v=0;for(const [n,hz] of tones.entries())v+=.27/(n+1)*Math.sin(2*Math.PI*hz*t);
  data[i]=v;
 }
 return {sampleRate:rate,duration,getChannelData:()=>data};
}
const cMajor=song([261.626,329.628,391.995]);
const fSharp=song([369.994,466.164,554.365]);
function metadata(tail,head){
 const a={duration:60,last:60,bpm:120,beatConfidence:.8,beatAnchor:56,
  level:.24,safeOutroAt:null,confidentTail:false,
  outroFinalNotes:chroma(tail,57.5,60),
  outroPhraseNotes:chroma(tail,53,58),
  outroChroma:chroma(tail,52,60)};
 const b={...a,introAttackNotes:chroma(head,0,2.3),
  introPhraseNotes:chroma(head,0,6),introChroma:chroma(head,0,9),safeIntroAt:0,first:0};
 return {a,b};
}
test("matching real chord notes may blend once a safe outro is verified",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 const notes=similarNotes(a,b);
 assert.ok(notes.matches&&notes.focused>.90);
 const result=transition({...a,safeOutroAt:52},b,60);
 assert.ok(result&&result.kind==="beat"&&result.end>59.9);
 assert.ok(result.fade>=4&&result.fade<=8);
});
test("different REAL synthesized chords do not overlap",()=>{
 const {a,b}=metadata(cMajor,fSharp);
 assert.ok(!similarNotes(a,b).matches);
 assert.equal(transition(a,b,60),null);
});
test("late detected vocals block even a perfectly matched harmonic bridge",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 assert.equal(transition({...a,lastVoiceAt:57},b,60),null);
});
test("a late line of timed karaoke vetoes the same bridge",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 assert.equal(transition({...a,lastLyricAt:56.5},b,60),null);
});
test("no doubled vocals: an immediate incoming singer prevents phrase blend",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 assert.equal(transition(a,{...b,firstVoiceAt:0},60),null);
});
test("large tempo mismatch prevents an otherwise harmonic phrase transition",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 assert.equal(transition(a,{...b,bpm:84},60),null);
});
test("harmonically matching intro preserves its first real note",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 const result=transition({...a,safeOutroAt:52},b,60);
 assert.equal(result.entry,0);
});
test("if a quiet outro is verified, choose stronger beat mix instead",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 const result=transition({...a,safeOutroAt:52},b,60);
 assert.ok(result&&result.kind==="beat"&&result.fade>=4);
});

test("protected bridge never fades out the outgoing singer early",()=>{
 const from=source.indexOf("function mixCurve(kind,t");
 const to=source.indexOf("async function beginMix(",from);
 assert.ok(from>0&&to>from);
 const curve=new Function(
  "function clamp(x,a,b){return Math.max(a,Math.min(b,x))}\n"+
  source.slice(from,to)+"\nreturn mixCurve;"
 )();
 assert.ok(curve("phrase",0).outGain>.90);
 assert.ok(curve("phrase",.5).outGain>.75);
 assert.ok(curve("phrase",.7).outGain>.35&&curve("phrase",.7).outGain<.90);
 assert.ok(curve("phrase",.7).inGain>.70);
 assert.ok(curve("phrase",1).outGain<.01);
 assert.ok(curve("phrase",1).inGain>.90);
});
test("bad pitch compatibility does not produce a phrase-bridge plan",()=>{
 const {a,b}=metadata(cMajor,fSharp);
 const preview=transition(a,b,60);
 assert.equal(preview,null);
});

function chordProgression(outro,intro){
 const rate=8000,duration=60,data=new Float32Array(rate*duration);
 const tones={
  C:[261.626,329.628,391.995],
  F:[349.228,440.0,523.251],
  G:[391.995,493.883,587.330]
 };
 for(let i=0;i<data.length;i++){
  const t=i/rate;
  const key=t>=54?outro[Math.min(2,Math.floor((t-54)/2))]:
   t<6?intro[Math.min(2,Math.floor(t/2))]:"C";
  const freqs=tones[key];let val=0;
  for(const hz of freqs)val+=.22/3*Math.sin(2*Math.PI*hz*t);
  data[i]=val;
 }
 return {sampleRate:rate,duration,getChannelData:()=>data};
}
function fullTimeline(aTrack,bTrack){
 const {a,b}=metadata(aTrack,bTrack);
 a.outroTimeline=harmonicTimeline(aTrack,51,60,true);
 b.introTimeline=harmonicTimeline(bTrack,0,9,false);
 return {a,b};
}
test("timeline aligns genuine sustained chords even during loud musical endings",()=>{
 const aTrack=chordProgression(["C","C","C"],["C","C","C"]);
 const bTrack=chordProgression(["C","C","C"],["C","C","C"]);
 const {a,b}=fullTimeline(aTrack,bTrack);
 const aligned=bestHarmonicAlignment(a,b);
 assert.ok(aligned&&aligned.matches);
 const plan=transition({...a,protectedEnding:true},b,60);
 // A measured strong final beat must veto the otherwise convincing
 // harmonic/rhythmic handoff, so the original ending plays to completion.
 assert.equal(plan,null);
});
test("matching average keys cannot override a discordant chord sequence",()=>{
 const aTrack=chordProgression(["C","F","C"],["C","C","C"]);
 const bTrack=chordProgression(["C","C","C"],["F","C","F"]);
 const {a,b}=fullTimeline(aTrack,bTrack);
 const aligned=bestHarmonicAlignment(a,b);
 assert.ok(aligned!==null);
 // Even when some local chord windows match, overall incompatibility
 // must veto the bridge rather than trust the averaged key.
 assert.equal(similarNotes(a,b).matches,false);
 assert.equal(transition(a,b,60),null);
});
test("an unreliable local chord timeline never falls back to an average key match",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 a.outroTimeline=[{offset:.6,notes:new Array(12).fill(0)},
  {offset:1.6,notes:new Array(12).fill(0)},
  {offset:2.6,notes:new Array(12).fill(0)}];
 b.introTimeline=[{offset:.6,notes:new Array(12).fill(0)},
  {offset:1.6,notes:new Array(12).fill(0)},
  {offset:2.6,notes:new Array(12).fill(0)}];
 const result=similarNotes(a,b);
 assert.equal(result.matches,false);
 assert.equal(transition(a,b,60),null);
});
test("new broad crossfade curve changes smoothly without a final sudden swap",()=>{
 const from=source.indexOf("function mixCurve(kind,t");
 const to=source.indexOf("async function beginMix(",from);
 const curve=new Function("function clamp(x,a,b){return Math.max(a,Math.min(b,x))}\n"+
  source.slice(from,to)+"\nreturn mixCurve;")();
 let previous=null;
 for(let x=0;x<=100;x++){
  const gains=curve("phrase",x/100);
  assert.ok(gains.outGain>=0&&gains.inGain>=0);
  if(previous){
   assert.ok(Math.abs(previous.outGain-gains.outGain)<.045);
   assert.ok(Math.abs(previous.inGain-gains.inGain)<.045);
  }
  previous=gains;
 }
});

test("a verified genuinely quiet outro still blends when keys are incompatible",()=>{
 const {a,b}=metadata(cMajor,fSharp);
 const old={...a,safeOutroAt:52,quietTail:true};
 const next=transition(old,b,60);
 assert.equal(next?.kind,"soft");
 assert.ok(next.fade>=2&&next.begin>=52);
});
test("loud incompatible music cannot use the quiet-outro fallback",()=>{
 const {a,b}=metadata(cMajor,fSharp);
 assert.equal(transition({...a,safeOutroAt:52,quietTail:false},b,60),null);
});
test("manual fade mode still permits compatible melodic phrase transitions",()=>{
 const st=source.slice(source.indexOf("function clamp("),source.indexOf("async function decode("));
 const p=source.slice(source.indexOf("function hasReliableHarmony("),source.indexOf("function resetMobileFade("));
 const alt=new Function('const isIOS=false,style="fade",mixSeconds=6;\n'+st+'\n'+p+
  '\nreturn {transition};')();
 const {a,b}=metadata(cMajor,cMajor);
 const result=alt.transition({...a,safeOutroAt:52},b,60);
 assert.ok(result&&result.kind==="fade"&&result.fade>=2);
});

test("a single persistent hum cannot masquerade as matching musical chords",()=>{
 const hum=song([220,440]); // Same pitch class in two octaves, not a chord.
 const {a,b}=metadata(hum,hum);
 assert.equal(similarNotes(a,b).matches,false);
 assert.equal(transition(a,b,60),null);
});
