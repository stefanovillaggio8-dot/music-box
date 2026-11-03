"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
function excerpt(src,start,end){
 const i=src.indexOf(start),j=src.indexOf(end,i);
 assert.ok(i>=0&&j>i,"missing "+start);
 return src.slice(i,j);
}
test("system-induced Safari pause must not erase playback intent",()=>{
 const policy=new Function("ios","const _usaControlliNativiIos=()=>ios;"+
  excerpt(app,"function _pausaNativaVolontaria(","function createAudio()")+
  "return _pausaNativaVolontaria;")(true);
 const a={ended:false,_mbCambioBrano:false};
 assert.equal(policy(a,true),false);
 assert.equal(policy(a,false),true);
 assert.equal(policy({...a,ended:true},false),false);
 assert.equal(policy({...a,_mbCambioBrano:true},false),false);
});
test("stale ended/timeupdate/metadata events cannot change the new track",()=>{
 for(const ev of ["ended","timeupdate","loadedmetadata"]){
  assert.ok(app.includes('a.addEventListener("'+ev+'", () => { if (a === audio)'));
 }
});
test("repeated unchanged timeupdate cannot conceal a stalled iPhone stream",()=>{
 const code=excerpt(app,"let _ultimoAudioTracciato = null,","function handleTime()");
 const run=new Function("runtime",
  "const audio=runtime.player,Date={now:()=>runtime.time};"+
  "let _ultimoScorrimento=0,_silenziDiFila=3;"+
  code+"return {check:_registraAvanzamentoAudio,stats:()=>"+
  "({time:_ultimoScorrimento,retries:_silenziDiFila})};");
 const a={currentTime:0},env={player:a,time:1000},x=run(env);
 assert.equal(x.check(a),true);env.time=6000;
 assert.equal(x.check(a),false);
 assert.equal(x.stats().time,1000);
 a.currentTime=.06;assert.equal(x.check(a),false);
 a.currentTime=.34;assert.equal(x.check(a),true);
 assert.equal(x.stats().time,6000);
 assert.equal(x.stats().retries,0);
 assert.equal(x.check({currentTime:30}),false);
});
test("buffering does not reset heartbeat forever",()=>{
 const check=excerpt(app,"function _controllaCheSuoni(","function _riprovaPiuTardi(");
 assert.ok(check.includes("audio.readyState < 3 &&"));
 assert.ok(check.includes("18000) return"));
 assert.ok(!check.includes("if (audio.readyState < 3) { _ultimoScorrimento = Date.now(); return; }"));
});
test("offline MP3 lookup remains fast even with thousands of cached songs",async()=>{
 const code=excerpt(sw,"async function findCachedMusic(","async function rispostaDallaCache(");
 let enumerations=0,lookups=0;
 const cache={
  keys:async()=>["spotifynonavraiimieisoldi-brani-Ste","spotifynonavraiimieisoldi-stream-Ste"],
  open:async()=>({
   match:async()=>{lookups++;return null},
   keys:async()=>{enumerations++;return [new Request("https://old.test/songs/track-44.mp3")]}
  })
 };
 const lookup=new Function("caches",
  "const CACHE_BRANI='spotifynonavraiimieisoldi-brani',CACHE='spotifynonavraiimieisoldi-v6566';"+
  "const cacheBraniName=p=>'spotifynonavraiimieisoldi-brani-'+p;"+
  "const cacheStreamName=p=>'spotifynonavraiimieisoldi-stream-'+p;"+
  "const cachePrefetchName=p=>'spotifynonavraiimieisoldi-prefetch-'+p;"+
  code+"return findCachedMusic;")(cache);
 for(let n=0;n<250;n++)assert.equal(await lookup("https://new.test/songs/track-44.mp3","Ste"),null);
 assert.equal(enumerations,0,"normal playback must not enumerate every MP3");
 assert.equal(lookups,500);
 await lookup("https://new.test/songs/track-44.mp3","Ste",true);
 assert.ok(enumerations>0,"legacy offline URLs still recover on network failure");
});
test("new versions preserve user-downloaded MP3 caches",()=>{
 const activation=excerpt(sw,'self.addEventListener("activate"',"const CORE_EXT =");
 assert.ok(!activation.includes("caches.delete(cacheBraniName"));
 assert.ok(!activation.includes("caches.delete(cacheStreamName"));
 assert.ok(sw.includes("findCachedMusic(event.request.url, profile, true)"));
});
