"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const analysis=source.slice(source.indexOf("function clamp("),source.indexOf("async function decode("));
const plan=source.slice(source.indexOf("function hasReliableHarmony("),source.indexOf("function keyGuess("));
const {chroma,similarNotes,transition}=new Function(
 'const isIOS=false,style="auto",mixSeconds=6;\n'+analysis+'\n'+plan+
 '\nreturn {chroma,similarNotes,transition};'
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
  outroPhraseNotes:chroma(tail,53,58)};
 const b={...a,introAttackNotes:chroma(head,0,2.3),
  introPhraseNotes:chroma(head,0,6),safeIntroAt:0,first:0};
 return {a,b};
}
test("same REAL synthesized chords at exit/entry enable a phrase bridge",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 const notes=similarNotes(a,b);
 assert.ok(notes.matches&&notes.focused>.90);
 const result=transition(a,b,60);
 assert.ok(result&&result.kind==="phrase"&&result.end>59.9);
 assert.ok(result.fade>=2&&result.fade<=3.5);
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
 const result=transition(a,b,60);
 assert.equal(result.entry,0);
});
test("if a quiet outro is verified, choose stronger beat mix instead",()=>{
 const {a,b}=metadata(cMajor,cMajor);
 const result=transition({...a,safeOutroAt:52},b,60);
 assert.ok(result&&result.kind==="beat"&&result.fade>=4);
});
