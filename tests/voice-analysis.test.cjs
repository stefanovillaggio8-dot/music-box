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
 assert.ok(calls>50&&calls<95);
 assert.ok(longest>=2000&&longest<=2100);
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

test("real YAMNet voice classes include narrated and child speech",()=>{
 const model={classify(){return [{classifications:[{categories:[
  {categoryName:"Child speech, kid speaking",score:.8}
 ]}]}]}};
 const out=moduleInstance().evaluate(fakeBuffer(),model,{last:80});
 assert.ok(out.lastVoiceAt>=79);
});

test("async on-device voice scan yields between synchronous model batches",async()=>{
 const model=moduleInstance();
 let calls=0,yielded=false;
 const originalSetTimeout=globalThis.setTimeout;
 // The classifier must see microtask/timer yields rather than block the
 // whole analysis continuously on the music player's UI thread.
 const task=model.evaluateAsync(fakeBuffer(),{classify(samples){
  calls++;
  return [{classifications:[{categories:[
   {categoryName:"Singing",score:samples[0]>.2?.81:.02}
  ]}]}];
 }},{last:80});
 await new Promise(resolve=>setTimeout(()=>{yielded=calls>0;resolve()},0));
 const result=await task;
 assert.ok(yielded&&calls>5&&result?.lastVoiceAt>=78);
});
test("async classifier errors do not stop the music player",async()=>{
 const out=await moduleInstance().evaluateAsync(fakeBuffer(),{
  classify(){throw Error("model busy")}
 },{last:80});
 assert.equal(out,null);
});

test("YAMNet receives enough audio per window even at 16kHz",()=>{
 const pcm=new Float32Array(48000*54);
 for(let i=0;i<pcm.length;i++)pcm[i]=.3*Math.sin(i*.02);
 const buffer={sampleRate:48000,duration:54,length:pcm.length,
  numberOfChannels:1,getChannelData:()=>pcm};
 let minLength=Infinity,maxLength=0,rates=new Set();
 const out=moduleInstance().evaluate(buffer,{classify(samples,rate){
  minLength=Math.min(minLength,samples.length);
  maxLength=Math.max(maxLength,samples.length);
  rates.add(rate);
  return [{classifications:[{categories:[{categoryName:"Music",score:.99}]}]}];
 }},{last:54});
 assert.equal(out.modelVersion,3);
 assert.ok(minLength>=15600 && maxLength<=16500,{minLength,maxLength});
 assert.deepEqual([...rates],[16000]);
});
test("antiphase stereo singing does not cancel out in the mono detector",()=>{
 const mono=fakeBuffer(),right=new Float32Array(mono.getChannelData(0).length);
 const left=mono.getChannelData(0);
 for(let i=0;i<right.length;i++)right[i]=-left[i];
 const stereo={...mono,numberOfChannels:2,
  getChannelData:ch=>ch?right:left};
 const result=moduleInstance().evaluate(stereo,classifier,{last:80});
 assert.ok(result.lastVoiceAt>=79);
});
test("isolated weak voice-like sound is not enough to invent singing",()=>{
 let call=0;
 const result=moduleInstance().evaluate(fakeBuffer("instrumental"),{
  classify(){const score=call++===6?.22:.02;
   return [{classifications:[{categories:[{categoryName:"Singing",score}]}]}];
  }
 },{last:80});
 assert.equal(result.firstVoiceAt,null);
 assert.equal(result.lastVoiceAt,null);
});
test("adjacent quiet rap frames form a protected vocal phrase",()=>{
 let call=0;
 const result=moduleInstance().evaluate(fakeBuffer("instrumental"),{
  classify(){
   const score=(call>=58&&call<=61)?.20:.01;call++;
   return [{classifications:[{categories:[{categoryName:"Rapping",score}]}]}];
  }
 },{last:80});
 assert.ok(result.lastVoiceAt>=70,result);
 assert.equal(result.firstVoiceAt,null);
 assert.ok(result.voiceIntervals.length>=1);
});
test("real sound event detection stays a safety veto, not a silence certificate",()=>{
 const out=moduleInstance().evaluate(fakeBuffer("instrumental"),classifier,{last:80});
 assert.equal(out.lastVoiceAt,null);
 assert.equal(out.source,"yamnet");
 assert.ok(out.scannedFrames>50);
 assert.equal("instrumentalConfirmed" in out,false);
});
