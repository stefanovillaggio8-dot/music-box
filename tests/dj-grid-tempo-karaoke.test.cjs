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
  {text:"L'",timestamp:[.10,.20]},
  {text:"amore",timestamp:[.20,.63]},
  {text:"torna",timestamp:[.85,1.20]},
  {text:"quando",timestamp:[1.30,1.64]},
  {text:"puoi",timestamp:[1.70,2.12]}
 ];
 const result=align(lines,chunks,1,4);
 assert.equal(result.length,1);
 assert.equal(result[0].words.length,4);
 assert.equal(result[0].words[0].t,1.1);
 assert.equal(result[0].words[0].end,1.63);
 assert.equal(result[0].words.map(x=>x.text).join(""),lines[0].text);
 assert.equal(align([{t:1,text:"L'amore fugge quando puoi"}],chunks,1,4).length,0,
  "same word count but incorrect transcription must not be accepted");
});
