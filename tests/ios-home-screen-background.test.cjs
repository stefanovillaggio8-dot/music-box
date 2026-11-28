"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const start=app.indexOf("    function _iosInstallataComeApp() {");
const end=app.indexOf("  /* Vero quando l'accesso",start);
assert.ok(start>=0&&end>start);
const rec=new Function("navigator","window",app.slice(start,end)+"return {_iosInstallataComeApp,_usaControlliNativiIos};");
const ua="Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
test("installed iOS no Safari UA activates native audio path",()=>{
 const x=rec({userAgent:ua,standalone:true},{matchMedia:()=>({matches:false})});
 assert.equal(x._iosInstallataComeApp(),true);
 assert.equal(x._usaControlliNativiIos(),true);
});
test("Safari remains supported, Chrome excluded",()=>{
 const safari=rec({userAgent:ua+" Safari/604",standalone:false},{matchMedia:()=>({matches:false})});
 const chrome=rec({userAgent:ua+" CriOS/120 Safari/604",standalone:false},{matchMedia:()=>({matches:false})});
 assert.equal(safari._usaControlliNativiIos(),true);
 assert.equal(chrome._usaControlliNativiIos(),false);
});
test("system transition is not confused with a later headset pause",()=>{
 const i=app.indexOf("  function _pausaDuranteCambioVisibilita(");
 const j=app.indexOf("  function _pausaNativaVolontaria(",i);
 const classify=new Function(app.slice(i,j)+"return _pausaDuranteCambioVisibilita;")();
 assert.equal(classify(true,1000,0,1400),true);
 assert.equal(classify(true,1000,0,30000),false);
 assert.equal(classify(false,1000,30000,30800),true);
});
test("hidden installed app preserves its media element across next song",()=>{
 const start=app.indexOf("async function playById("),end=app.indexOf("function idBranoA(",start);
 assert.match(app.slice(start,end),/audio = keepNativeSession \? previous : createAudio\(\)/);
});


function remoteHarness({volume=60,muted=false,compositeActive=false}={}){
 const start=app.indexOf("  let _remoteIosPlayGeneration=0;");
 const end=app.indexOf("  function _riproduciVolontaria(",start);
 assert.ok(start>=0&&end>start);
 const fake={paused:true,ended:false,currentTime:12,muted,_mbCommonMixMuted:compositeActive};
 const timers=[],calls=[],session={state:"active"};
 const build=new Function("fake","timers","calls","session","volume","compositeActive",
  "let audio=fake,currentId='track',_vuoleSuonare=true,_pausaEsplicita=false;"+
  "const navigator={audioSession:session},document={hidden:true};"+
  "const window={MusicBoxCompositeMix:{active:()=>compositeActive,stop:()=>{compositeActive=false;}}};"+
  "const setTimeout=(fn,ms)=>timers.push({fn,ms});"+
  "const _applicaAudio=()=>{fake.muted=volume===0||fake._mbCommonMixMuted};const _configuraSessioneAudio=()=>{};"+
  "const doPlay=async keep=>{calls.push(keep);return calls.length>=2};"+
  app.slice(start,end)+
  "return {start:(ok)=>_riprovaPlayEsternoIos(fake,'track',++_remoteIosPlayGeneration,Promise.resolve(ok),fake.currentTime),restore:()=>_ripristinaUscitaPlayEsternoIos(fake),pause:()=>{_pausaEsplicita=true;_vuoleSuonare=false;++_remoteIosPlayGeneration},resume:()=>{_pausaEsplicita=false;_vuoleSuonare=true},switchTrack:()=>{currentId='other'}};"
 )(fake,timers,calls,session,volume,compositeActive);
 return {fake,timers,calls,session,build};
}
test("remote iOS Play retries failed requests but cancels after explicit pause or track change",async()=>{
 const {fake,timers,calls,build}=remoteHarness();
 build.start(false);await Promise.resolve();
 assert.equal(timers[0].ms,250);
 await timers.shift().fn();
 assert.deepEqual(calls,[true]);assert.equal(timers[0].ms,750);
 await timers.shift().fn();
 assert.deepEqual(calls,[true,true]);
 fake.paused=false;fake.currentTime+=1;
 await timers.shift().fn();assert.equal(timers.length,0);
 build.start(false);await Promise.resolve();build.pause();build.resume();
 await timers.shift().fn();assert.equal(calls.length,2);
 build.start(false);await Promise.resolve();build.switchTrack();
 await timers.shift().fn();assert.equal(calls.length,2);
});
test("fulfilled play without native progress is retried; progressing playback is not disturbed",async()=>{
 const {fake,timers,calls,build}=remoteHarness();
 fake.paused=false;build.start(true);await Promise.resolve();
 assert.equal(timers[0].ms,1250);
 await timers.shift().fn();assert.deepEqual(calls,[true]);
 fake.currentTime+=1;
 await timers.shift().fn();assert.equal(timers.length,0);
});
test("interrupted native audio session is retried even when the playhead advances",async()=>{
 const {fake,timers,calls,session,build}=remoteHarness();
 fake.paused=false;session.state="interrupted";build.start(true);await Promise.resolve();
 fake.currentTime+=1;await timers.shift().fn();assert.deepEqual(calls,[true]);
 session.state="active";fake.currentTime+=1;await timers.shift().fn();assert.equal(timers.length,0);
});
test("remote Play restores stale composite mute but respects zero user volume",()=>{
 for(const volume of [0,60]){
  const {fake,build}=remoteHarness({volume,muted:true,compositeActive:true});
  build.restore();assert.equal(fake._mbCommonMixMuted,false);assert.equal(fake.muted,volume===0);
 }
});
