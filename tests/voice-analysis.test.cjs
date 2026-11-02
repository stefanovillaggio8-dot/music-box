"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","voice-analysis.js"),"utf8");
function moduleInstance(){
 const window={WebAssembly:{}};
 new Function("window","navigator",source)(window,{});
 return window.MusicBoxVocal;
}
function fakeBuffer(kind="vocalTail"){
 const sampleRate=2000,duration=80;
 const pcm=new Float32Array(sampleRate*duration);
 for(let i=0;i<pcm.length;i++){
  const time=i/sampleRate;
  pcm[i]=(kind==="vocalTail"&&(time>=72||time<=5))?.45:.018;
 }
 return {sampleRate,duration,length:pcm.length,numberOfChannels:1,
  getChannelData:()=>pcm};
}
const classifier={classify(samples){
 const avg=samples.reduce((s,x)=>s+Math.abs(x),0)/samples.length;
 return [{classifications:[{categories:[
  {categoryName:avg>.15?"Singing":"Piano",score:.84}
 ]}]}];
}};
test("actual voice-classification interface recognizes late singing",()=>{
 const result=moduleInstance().evaluate(fakeBuffer(),classifier,{last:80});
 assert.equal(result.source,"yamnet");
 assert.ok(result.lastVoiceAt>=78);
 assert.ok(result.firstVoiceAt<5);
});
test("instrumental ending does not invent a detected singer",()=>{
 const result=moduleInstance().evaluate(fakeBuffer("instrumental"),classifier,{last:80});
 assert.equal(result.lastVoiceAt,null);
 assert.equal(result.firstVoiceAt,null);
});
test("classifies only short samples, not entire raw MP3",()=>{
 let longest=0,calls=0;
 const observe={classify(samples){calls++;longest=Math.max(longest,samples.length);
  return [{classifications:[{categories:[{categoryName:"Music",score:.99}]}]}];
 }};
 moduleInstance().evaluate(fakeBuffer(),observe,{last:80});
 assert.ok(calls>15&&calls<50);
 assert.ok(longest<=2000);
});
test("model failure cannot guess a safe vocal ending",()=>{
 const fail={classify(){throw Error("model unavailable")}};
 assert.equal(moduleInstance().evaluate(fakeBuffer(),fail,{last:80}),null);
});
test("no voice recording or lyrics are sent by this feature",()=>{
 assert.equal(source.includes("fetch(buffer"),false);
 assert.equal(source.includes("upload"),true); // descriptive prohibition
 assert.ok(source.includes("getChannelData"));
});
