"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const mix=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
test("Safari waits for native playback buffer headroom before loading giant DJ index",()=>{
 const first=mix.indexOf("function iosIndexCanLoadNow(){"),last=mix.indexOf("function mobileClipWindow(audio)",first);
 assert.ok(first>=0&&last>first);
 const gate=new Function("bridge","isIOS",mix.slice(first,last)+"return iosIndexCanLoadNow");
 const audio=(ready,ahead)=>({
  paused:false,ended:false,seeking:false,readyState:ready,currentTime:20,
  buffered:{length:1,start:()=>0,end:()=>20+ahead}
 });
 assert.equal(gate(()=>({audio:()=>audio(2,2)}),true)(),false);
 assert.equal(gate(()=>({audio:()=>audio(2,21)}),true)(),true);
 assert.equal(gate(()=>({audio:()=>audio(4,2)}),true)(),true);
 assert.equal(gate(()=>({audio:()=>null}),true)(),true);
 assert.match(mix,/if\(!deepIndex&&!iosIndexCanLoadNow\(\)\)/);
});
test("iPhone trusted tap is forwarded to unlock WebAudio",()=>{
 assert.match(mix,/function setMixEnabled\(value,event\)/);
 assert.match(mix,/mixEnableAudio\?\.\(event\)/);
 assert.match(app,/mixEnableAudio:\(event\)=>_preparaAudio\(event\)/);
});
test("far-outro heavy iPhone DJ ticks are coalesced while cue timing stays precise",()=>{
 assert.match(mix,/ms-lastIPhoneSlowTick<1150/);
 assert.match(mix,/audio\.duration-audio\.currentTime>14/);
 assert.match(mix,/function armSnapPrecision\(/);
});
test("cached core shell avoids repeated background downloads",()=>{
 const first=sw.indexOf("/* Cached static assets must NOT trigger full background downloads");
 const last=sw.indexOf("return cached;",first);
 assert.ok(first>=0&&last>first);
 assert.match(sw.slice(first,last),/karaoke-index/);
 assert.doesNotMatch(sw.slice(first,last),/app\.js/);
 assert.match(sw,/event\.waitUntil\(lavoro\.then\(\(\)=>_coreRefreshPending\)/);
 assert.match(sw,/spotifynonavraiimieisoldi-v6624/);
});
