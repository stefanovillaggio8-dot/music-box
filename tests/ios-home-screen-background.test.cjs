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
