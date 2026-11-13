"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const start=source.indexOf("function verifiedIndexedGridTempo(");
const end=source.indexOf("function deepLookup(",start);
assert.ok(start>=0&&end>start,"tempo adjustment must stay inspectable");
const verifiedIndexedGridTempo=new Function(source.slice(start,end)+
 "\nreturn verifiedIndexedGridTempo")();
const grid=bpm=>Array.from({length:16},(_,i)=>+(i*120/bpm).toFixed(3));
test("coarse DJ tempo improves only with a real stable two-beat grid",()=>{
 const indexed={bpm:120,tempoRefined:false,beatGrid:{reliable:true,anchors:grid(125.5)}};
 const result=verifiedIndexedGridTempo(indexed);
 assert.ok(Math.abs(result.bpm-125.5)<.2,result.bpm);
 assert.equal(result.indexedBpmOriginal,120);
 assert.equal(result.tempoVerifiedByGrid,true);
 assert.equal(indexed.bpm,120,"source index must not be mutated");
 assert.equal(verifiedIndexedGridTempo({...indexed,beatGrid:{...indexed.beatGrid,reliable:false}}).bpm,120);
 assert.equal(verifiedIndexedGridTempo({...indexed,tempoRefined:true}).bpm,120);
 assert.equal(verifiedIndexedGridTempo({...indexed,bpm:170}).bpm,170);
 const irregular=grid(125.5);irregular[9]+=0.24;
 assert.equal(verifiedIndexedGridTempo({...indexed,beatGrid:{reliable:true,anchors:irregular}}).bpm,120);
});
const sandbox={};
vm.runInNewContext(fs.readFileSync(path.join(root,"audio-lyrics-align.js"),"utf8"),sandbox);
const align=sandbox.MusicBoxAudioAlign.alignWindow;
test("Italian contractions preserve actual two-token ASR timing, never guessed word times",()=>{
 const lines=[{t:1,text:"L'amore torna quando puoi"},{t:5,text:"poi tutto cambia"}];
 const chunks=[
  {text:"L'",timestamp:[1.10,1.20]},
  {text:"amore",timestamp:[1.20,1.63]},
  {text:"torna",timestamp:[1.85,2.20]},
  {text:"quando",timestamp:[2.30,2.64]},
  {text:"puoi",timestamp:[2.70,3.12]}
 ];
 const result=align(lines,chunks,0,4);
 assert.equal(result.length,1);
 assert.equal(result[0].words.length,4);
 assert.equal(result[0].words[0].t,1.1);
 assert.equal(result[0].words[0].end,1.63);
 assert.equal(result[0].words.map(x=>x.text).join(""),lines[0].text);
 assert.equal(align([{t:1,text:"L'amore fugge quando puoi"}],chunks,0,4).length,0,
  "same word count but incorrect transcription must not be accepted");
});

test("real index quiet rhythmic opening does not get mistaken for silence",()=>{
 const index=JSON.parse(fs.readFileSync(path.join(root,"dj-deep-analysis.json"),"utf8")).entries;
 const engine=new Function(
  "const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));"+
  source.slice(source.indexOf("function onsetPeriodicity("),
   source.indexOf("function onsetGridPhase("))+
  "const musicalIntroEntry=b=>Number.isFinite(b?.safeIntroAt)?b.safeIntroAt:0;"+
  source.slice(source.indexOf("function measuredQuietRhythmicIntro("),
   source.indexOf("// A safe ending alone does not prove"))+
  source.slice(source.indexOf("function lowEnergyPostludeLeadIn("),
   source.indexOf("function transition(a,b,actualDuration)"))+
  "return {measuredQuietRhythmicIntro,hasImmediateMusicalIntro,lowEnergyPostludeLeadIn};"
 )();
 const outgoing=index["audio/songs/track-1197.mp3"];
 const quiet=index["audio/songs/track-686.mp3"];
 const silent=index["audio/songs/track-174.mp3"];
 assert.ok(outgoing&&quiet&&silent);
 assert.ok(quiet.introDrive<.33,"the existing global energy gate rejected this real song");
 assert.equal(engine.measuredQuietRhythmicIntro(quiet),true);
 assert.equal(engine.hasImmediateMusicalIntro(quiet),true);
 assert.equal(engine.hasImmediateMusicalIntro(silent),false,
  "genuinely weak or delayed intros must remain protected");
 assert.equal(engine.measuredQuietRhythmicIntro({...quiet,introOnset:Array(96).fill(0)}),false,
  "never invent rhythmic evidence from BPM alone");
 const vocalSafe={...outgoing,lastLyricAt:215.11,lastVoiceAt:213.59};
 const cue=engine.lowEnergyPostludeLeadIn(vocalSafe,quiet,outgoing.duration);
 assert.equal(cue?.kind,"postlude");
 assert.ok(cue.begin>outgoing.last&&cue.begin<outgoing.duration-3,
  "actual quiet song joins during measured encoded postlude, never cuts old music");
 assert.equal(cue.preserveTail,true);
 assert.equal(cue.silenceTrim,false);
 assert.equal(engine.lowEnergyPostludeLeadIn({...vocalSafe,lastLyricAt:242},
  quiet,outgoing.duration),null,"late vocal activity must still veto the overlap");
});

test("karaoke refuses false word timestamps assembled across repeated ASR hallucinations",()=>{
 const row=[{t:4,text:"ciao bella come stai oggi"}];
 const observed=[
  ["ciao",4.2],["eh",4.4],["bella",4.6],
  ["uh",4.8],["come",5.0],["mah",5.2],
  ["stai",5.4],["oh",5.6],["oggi",5.8]
 ].map(([text,t])=>({text,timestamp:[t,t+.13]}));
 assert.equal(align(row,observed,0,28).length,0,
  "four unmatched ASR words cannot certify an exact five-word lyric");
 const exact=observed.filter(x=>!["eh","uh","mah","oh"].includes(x.text));
 const accepted=align(row,exact,0,28);
 assert.equal(accepted.length,1,"genuinely contiguous audio words remain accepted");
 assert.equal(accepted[0].words.length,5);
});
