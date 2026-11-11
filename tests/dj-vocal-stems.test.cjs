"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const runtime=fs.readFileSync(path.join(__dirname,"..","dj-vocal-stem-runtime.js"),"utf8");
const engine=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const sha="a".repeat(40),file="dj-stems/vocals/"+sha+".m4a";
const row={sourceSha:sha,path:file,start:175,end:199.84,
 sourceDuration:200,separator:"demucs-htdemucs",role:"isolated-outgoing-vocals"};
const outgoing={sha,duration:200};
const cue={voiceConfirmedUnderlay:true,vocalBeatUnderlay:true,
 earlyBeatJoin:true,measuredBeatBridge:true,begin:180,vocalEndAt:198.7};
function fixture(entries={[sha]:row}){
 let streams=0;
 class FakeAudio{
  constructor(){
   streams++;this.currentTime=0;this.readyState=3;this.seeking=false;
   this.paused=true;this.volume=0;this.handlers={};
  }
  addEventListener(name,cb){this.handlers[name]=cb}
  set src(value){this._src=value}
  get src(){return this._src}
  load(){this.handlers.loadedmetadata?.();this.handlers.canplay?.()}
  async play(){this.paused=false}
  pause(){this.paused=true}
  removeAttribute(k){if(k==="src")this._src=""}
 }
 const win={};
 const fetchMock=async()=>({ok:true,json:async()=>({version:1,entries})});
 const api=new Function("window","Audio","fetch",runtime+
  ";return window.MusicBoxVocalStems;")(win,FakeAudio,fetchMock);
 return {api,streams:()=>streams};
}
test("only a SHA-matched actual Demucs stem is eligible for a verified vocal bridge",async()=>{
 const {api,streams}=fixture();
 api.load();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(api.find(outgoing,cue)?.path,file);
 for(const [other,otherCue] of [
  [{...outgoing,sha:"b".repeat(40)},cue],
  [outgoing,{...cue,voiceConfirmedUnderlay:false}],
  [outgoing,{...cue,vocalBeatUnderlay:false}],
  [outgoing,{...cue,earlyBeatJoin:false}],
  [outgoing,{...cue,measuredBeatBridge:false}],
  [outgoing,{...cue,vocalEndAt:199.7}],
  [{...outgoing,duration:195},cue]
 ])assert.equal(api.find(other,otherCue),null);
 assert.equal(streams(),0,"checking a manifest must not start an audio decoder");
});
test("vocal stem is preseeked, clock-verified, and cancelable without touching main MP3",async()=>{
 const {api,streams}=fixture();
 api.load();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(api.prepare("old",outgoing,cue),true);
 assert.equal(streams(),1);
 let old={currentTime:180,paused:false,seeking:false};
 const clip=await api.activate("old",cue,old);
 assert.ok(clip&&clip.audio&&!clip.audio.paused);
 assert.equal(clip.audio.currentTime,5);
 assert.equal(api.levels(.2,.3,10).vocals>0,true);
 assert.equal(api.levels(.7,.6,-.8).vocals,0);
 assert.ok(api.levels(.2,.3,10).native<.01,
  "backing from old full MP3 must fade while isolated vocal remains");
 api.release(clip);
 assert.equal(clip.audio.paused,true);
 assert.equal(clip.audio.src,"");
});
test("missing stems and browser clock drift never create an extra playback channel",async()=>{
 const {api,streams}=fixture();
 api.load();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(api.prepare("old",outgoing,cue),true);
 assert.equal(await api.activate("old",cue,
  {currentTime:182,paused:false,seeking:false}),null);
 assert.equal(streams(),1);
 api.stop();
 assert.equal(api.prepare("old",{...outgoing,sha:"b".repeat(40)},cue),false);
 assert.equal(streams(),1);
});
test("isolated stem routing is optional and excluded from iPhone WebAudio mixer",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 assert.match(engine,/if\(previewAllowed&&!isIOS&&plan\.voiceConfirmedUnderlay&&/);
 assert.match(engine,/act\.stem=await window\.MusicBoxVocalStems\?\.activate/);
 assert.match(engine,/combinedPower=Math\.hypot\(outGain,incomingGain,stemGain\)/);
 assert.match(engine,/if\(act\.stem\)window\.MusicBoxVocalStems\?\.release/);
 assert.match(html,/dj-vocal-stem-runtime\.js\?v=6720&amp;stem=1/);
 assert.equal(sw.split("dj-vocal-stem-runtime.js?v=6720&stem=1").length-1,2);
 assert.ok(sw.includes('"./dj-vocal-stems.json"'));
});
