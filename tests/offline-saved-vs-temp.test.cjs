"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
function excerpt(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,"missing "+start);return source.slice(a,b);}
test("offline panel distinguishes manually saved from temporary stream MP3s",async()=>{
 const section=excerpt(app,"  async function _elencoOfflineDelProfilo(", "  async function refreshCachedSongs()");
 const mock={
  "spotifynonavraiimieisoldi-brani-Ste":["https://x.test/songs/track-5.mp3"],
  "spotifynonavraiimieisoldi-stream-Ste":["https://x.test/songs/track-6.mp3"]
 };
 const fake={keys:async()=>Object.keys(mock),open:async name=>({keys:async()=>mock[name].map(url=>({url}))})};
 const load=new Function("caches","URL",
  "const CACHE_PREFIX='spotifynonavraiimieisoldi',profile='Ste';"+
  "const window={caches},location={href:'https://x.test/'};"+
  "const cacheBraniName=()=>CACHE_PREFIX+'-brani-Ste',cacheStreamName=()=>CACHE_PREFIX+'-stream-Ste';"+
  "const _eUrlAudioOffline=u=>u.endsWith('.mp3');"+
  "const _chiaveFileOffline=u=>u.split('/').at(-1);"+
  section+"return _elencoOfflineDelProfilo;")(fake,URL);
 const all=await load(),manual=await load(true);
 assert(all.has("https://x.test/songs/track-5.mp3"));
 assert(all.has("https://x.test/songs/track-6.mp3"));
 assert(manual.has("https://x.test/songs/track-5.mp3"));
 assert(!manual.has("https://x.test/songs/track-6.mp3"));
 const panel=excerpt(app,"  async function scanOffline() {","  /* Ste: \"nelle canzoni nuove");
 assert(panel.includes("const savedOffline = await _elencoOfflineDelProfilo(true)"));
 assert(panel.includes('state: saved ? "ok" : "todo"'));
});
test("full temporary cached MP3 is promoted without internet or cache deletion",async()=>{
 const code=excerpt(app,"  async function _promuoviCachePerOffline(","  function _offlinePronto(");
 const sample=new Uint8Array(6000).fill(42);
 const cache={match:async()=>new Response(sample,{status:200,headers:{"Content-Type":"audio/mpeg","Content-Length":"6000"}})};
 let stored=null;
 const dest={put:async(k,res)=>{stored={k,res}}};
 const promote=new Function("streams","Response","Date",
  "const streamCache=async()=>streams;"+code+"return _promuoviCachePerOffline;")(cache,Response,Date);
 assert.equal(await promote(dest,"https://x.test/song.mp3","Ste"),true);
 assert.equal(stored.k,"https://x.test/song.mp3");
 assert.equal((await stored.res.blob()).size,6000);
 assert.equal(stored.res.headers.get("X-Scaricato")!==null,true);
});
test("never promote partial HTTP 206, HTML, or incomplete MP3s",async()=>{
 const code=excerpt(app,"  async function _promuoviCachePerOffline(","  function _offlinePronto(");
 let writes=0;
 const dest={put:async()=>{writes++}};
 let res=null;
 const streams={match:async()=>res};
 const promote=new Function("streams","Response","Date",
  "const streamCache=async()=>streams;"+code+"return _promuoviCachePerOffline;")(streams,Response,Date);
 res=new Response(new Uint8Array(6000),{status:206,headers:{"Content-Type":"audio/mpeg"}});
 assert.equal(await promote(dest,"https://x.test/s","Ste"),false);
 res=new Response(new Uint8Array(6000),{status:200,headers:{"Content-Type":"text/html"}});
 assert.equal(await promote(dest,"https://x.test/s","Ste"),false);
 res=new Response(new Uint8Array(2000),{status:200,headers:{"Content-Type":"audio/mpeg"}});
 assert.equal(await promote(dest,"https://x.test/s","Ste"),false);
 assert.equal(writes,0);
});
test("manual queue pins temporary tracks and never runs third worker",()=>{
 const section=excerpt(app,"  async function downloadAllOffline(","  async function _resumeOfflineDownloads()");
 assert(section.includes('r.state==="todo"'),"temporary entries must not be skipped");
 assert(section.includes("const concurrency=2"),"keep two parallel downloads");
 assert(section.includes("cacheTrack(rows[i],cache,owner)"),"pin in selected account cache");
});
test("service worker update no longer force reloads an active iPhone playlist",()=>{
 const section=excerpt(app,"navigator.serviceWorker.addEventListener(\"controllerchange\"","navigator.serviceWorker.register(\"sw.js\"");
 assert(!section.includes("window.location.reload()"),"controller change must not reload the running player");
 const manual=excerpt(app,"  async function _aggiornaMusicBoxDaVersione() {","  let offlineBusy = false;");
 assert(manual.includes("window.location.assign(url.href)"),"manual version button still updates on demand");
});
