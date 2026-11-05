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

test("prefetched complete MP3 is promoted into the correct profile offline cache",async()=>{
 const code=excerpt(app,"  async function _promuoviCachePerOffline(","  function _offlinePronto(");
 const sample=new Uint8Array(8000).fill(31);
 const names=[];
 const prefetch={match:async()=>new Response(sample,{status:200,headers:{"Content-Type":"audio/mpeg","Content-Length":"8000"}})};
 const dest={saved:null,put:async function(url,res){this.saved={url,res}}};
 const promote=new Function("prefetch","Response",
  "const CACHE_PREFIX='spotifynonavraiimieisoldi';"+
  "const streamCache=async()=>({match:async()=>null});"+
  "const caches={open:async name=>{if(name!=='spotifynonavraiimieisoldi-prefetch-Diego')throw Error('wrong profile');return prefetch}};"+
  code+"return _promuoviCachePerOffline;")(prefetch,Response);
 assert.equal(await promote(dest,"https://example.com/music.mp3","Diego"),true);
 assert.equal(dest.saved.url,"https://example.com/music.mp3");
 assert.equal((await dest.saved.res.blob()).size,8000);
});
test("legacy prefetch refuses partial HTTP 206 even if 6000 bytes exist",async()=>{
 const code=excerpt(app,"  async function _promuoviCachePerOffline(","  function _offlinePronto(");
 let writes=0;
 const prefetch={match:async()=>new Response(new Uint8Array(6000),{status:206,headers:{"Content-Type":"audio/mpeg"}})};
 const promote=new Function("prefetch","Response",
  "const CACHE_PREFIX='spotifynonavraiimieisoldi';"+
  "const streamCache=async()=>({match:async()=>null});"+
  "const caches={open:async()=>prefetch};"+
  code+"return _promuoviCachePerOffline;")(prefetch,Response);
 assert.equal(await promote({put:async()=>writes++},"https://example.com/song.mp3","Ste"),false);
 assert.equal(writes,0);
});
test("prefetch and single-song downloads reject HTTP 206 instead of saving partial audio",async()=>{
 const code=excerpt(app,"  async function fetchToCache(","  async function _controllaSpazioAvviso()");
 let writes=0;
 const cache={put:async()=>{writes++}};
 const run=new Function("fetch","Response","Blob",code+"return fetchToCache;");
 const partial=run(async()=>new Response(new Uint8Array(8000),{
   status:206,headers:{"Content-Type":"audio/mpeg"}}),Response,Blob);
 await assert.rejects(partial("https://example.com/audio.mp3",cache,null),/HTTP 206/);
 assert.equal(writes,0);
 const complete=run(async()=>new Response(new Uint8Array(8000),{
   status:200,headers:{"Content-Type":"audio/mpeg","Content-Length":"8000"}}),Response,Blob);
 assert.equal(await complete("https://example.com/audio.mp3",cache,null),8000);
 assert.equal(writes,1);
});
test("Safari repeat seek uses recent cached Blob before touching CacheStorage again",async()=>{
 const sw=require("node:fs").readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 const code=excerpt(sw,"let _rangeBlobMemo=null;","let _ultimaRivalidazione")+
  excerpt(sw,"async function cachedMusicResponse(event) {",'self.addEventListener("fetch"');
 const stats={lookups:0};
 const load=new Function("stats","Response","Blob","Headers",`
   const profileForEvent=async()=> "Ste";
   const findCachedMusic=async()=>{stats.lookups++;return new Response(new Uint8Array(12000),{
     status:200,headers:{"Content-Type":"audio/mpeg"}})};
   const _rivalidaBrano=async()=>{};
   `+code+"return cachedMusicResponse;");
 const serve=load(stats,Response,Blob,Headers);
 const url="https://example.com/songs/track-1.mp3";
 const request=range=>({request:{url,headers:new Headers({Range:range}),destination:"audio"},
   waitUntil:()=>{}});
 const first=await serve(request("bytes=0-1023"));
 const next=await serve(request("bytes=6000-6999"));
 assert.equal(first.status,206);
 assert.equal(next.status,206);
 assert.equal(next.headers.get("Content-Range"),"bytes 6000-6999/12000");
 assert.equal(stats.lookups,1);
});

test("two-slot iPhone offline saves can stream without buffering whole MP3 blobs",async()=>{
 const code=excerpt(app,"  async function cacheTrack(","  /* Ste: \"quando premo seleziona");
 const build=fetchMock=>{
  const cache={
   saved:null,deletes:0,
   match:async()=>null,
   put:async function(url,response){
    const bytes=new Uint8Array(await response.arrayBuffer());
    this.saved={url,bytes,headers:response.headers};
   },
   delete:async function(url){this.saved=null;this.deletes++;return true;}
  };
  const run=new Function("fetch","cache",
   "const profile='Ste',offlineAbort=null,offlineStopRequested=false;"+
   "const _promuoviCachePerOffline=async()=>false;"+
   "const _offlinePronto=row=>{row.state='ok';row.label='pronta'};"+
   "const fmtBytes=x=>String(x);"+
   code+"return row=>cacheTrack(row,cache,'Ste');")(fetchMock,cache);
  return {cache,run};
 };
 const complete=build(async()=>new Response(new Uint8Array(8192).fill(27),{
  status:200,headers:{"Content-Type":"audio/mpeg","Content-Length":"8192"}}));
 const good={track:{url:"https://example.com/good.mp3"},state:"todo",el:null};
 await complete.run(good);
 assert.equal(good.state,"ok");
 assert.equal(complete.cache.saved.bytes.byteLength,8192);
 assert.equal(complete.cache.saved.headers.get("X-Scaricato")!==null,true);
 assert.equal(complete.cache.deletes,0);
 const broken=build(async()=>new Response(new Uint8Array(4096).fill(27),{
  status:200,headers:{"Content-Type":"audio/mpeg","Content-Length":"8192"}}));
 const bad={track:{url:"https://example.com/partial.mp3"},state:"todo",el:null};
 await broken.run(bad);
 assert.equal(bad.state,"err","incomplete HTTP 200 must fail closed");
 assert.equal(broken.cache.saved,null,"partial file must be deleted");
 assert.equal(broken.cache.deletes,1);
 const ranged=build(async()=>new Response(new Uint8Array(8192),{
  status:206,headers:{"Content-Type":"audio/mpeg"}}));
 const row={track:{url:"https://example.com/206.mp3"},state:"todo",el:null};
 await ranged.run(row);
 assert.equal(row.state,"err");
 assert.equal(ranged.cache.saved,null);
});
