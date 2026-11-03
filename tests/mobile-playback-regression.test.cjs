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


test("Safari seeking interrupts optional DJ work and preserves offline cache",()=>{
 assert.ok(app.includes('window.MusicBoxMix?.onSeek?.()'));
 assert.ok(app.includes('const pausaPerSeek = a.seeking ||'));
 assert.ok(app.includes('if (_vuoleSuonare && a.paused && !a.ended'));
 assert.ok(app.includes('if (_usaControlliNativiIos() && _vuoleSuonare) return;'));
 const mix=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 assert.ok(mix.includes('headers:{"Range":"bytes=0-786431"}'));
 assert.ok(mix.includes("if(response.status!==206"));
 assert.ok(mix.includes("onSeek:()=>{"));
});
test("cached MP3 Range responses reuse one bounded Blob on repeated seeks",async()=>{
 const code=excerpt(sw,"let _rangeBlobMemo=null;","let _ultimaRivalidazione");
 const rangeFn=new Function("Response","Date",code+"return rispostaDallaCache;")(Response,Date);
 let reads=0;
 const cached={blob:async()=>{reads++;return new Blob([new Uint8Array(1000)],{type:"audio/mpeg"})}};
 const url="https://raw.githubusercontent.com/example/songs/track-1.mp3";
 const a=await rangeFn(cached,"bytes=100-199",url);
 const b=await rangeFn(cached,"bytes=300-399",url);
 assert.equal(a.status,206);assert.equal(b.status,206);
 assert.equal(a.headers.get("Content-Range"),"bytes 100-199/1000");
 assert.equal(b.headers.get("Content-Range"),"bytes 300-399/1000");
 assert.equal((await a.blob()).size,100);
 assert.equal(reads,1);
 const c=await rangeFn(cached,"bytes=0-9",url+"?different=1");
 assert.equal(c.status,206);assert.equal(reads,2);
});
test("iPhone DJ loads bounded intro range and refuses a full file response",async()=>{
 const mix=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 const code=excerpt(mix,"async function decodeMobileIntroRange(","async function decode(track,needClip=false)");
 let requested=null,decoded=0,cancelled=0,mode=206,exposedRange=true;
 const runtime={
  fetch:async(url,options)=>{
   requested={url,options};
   return {status:mode,
    headers:new Headers(mode===206?(exposedRange?{"content-range":"bytes 0-19999/100000","content-length":"20000"}:{"content-length":"20000"}):{}),
    body:{cancel:async()=>{cancelled++}},
    arrayBuffer:async()=>new ArrayBuffer(20000)};
  },
  Offline:class {async decodeAudioData(){decoded++;return {duration:7}}}
 };
 const init="const document={hidden:false},djPlaybackEpoch=0,djFetchControllers=new Set();"+
  "const cache=new Map(),mobileIntroClips=new Map();"+
  "const mobileDJMayWork=()=>true;"+
  "const rememberMobileClip=(key,b)=>mobileIntroClips.set(key,b);"+
  "const withValidatedVoice=(v)=>v;"+
  "const fetch=(...args)=>r.fetch(...args);"+
  "const window={OfflineAudioContext:r.Offline};";
 const load=new Function("r",init+code+"return decodeMobileIntroRange;")(runtime);
 const deep={bpm:120};
 assert.equal(await load("https://example.com/song.mp3","s",deep,0),deep);
 assert.equal(requested.options.headers.Range,"bytes=0-786431");
 assert.equal(decoded,1);
 exposedRange=false; // Browser CORS hides response Content-Range, but 206 is still valid.
 assert.equal(await load("https://example.com/song-noexpose.mp3","s3",deep,0),deep);
 assert.equal(decoded,2);
 mode=200;
 assert.equal(await load("https://example.com/song2.mp3","s2",deep,0),null);
 assert.equal(decoded,2);
 assert.equal(cancelled,1);
});


test("1000 rapid offline iPhone seeks keep valid HTTP 206 ranges and one cached Blob",async()=>{
 const code=excerpt(sw,"let _rangeBlobMemo=null;","let _ultimaRivalidazione");
 const rangeFn=new Function("Response","Date",code+"return rispostaDallaCache;")(Response,Date);
 let reads=0;
 const cached={blob:async()=>{reads++;return new Blob([new Uint8Array(200000)],{type:"audio/mpeg"})}};
 const url="https://raw.githubusercontent.com/example/rapid.mp3";
 for(let i=0;i<1000;i++){
  const start=(i*1013)%199000,end=Math.min(199999,start+511);
  const res=await rangeFn(cached,"bytes="+start+"-"+end,url);
  assert.equal(res.status,206);
  assert.equal(res.headers.get("Content-Range"),"bytes "+start+"-"+end+"/200000");
  assert.equal(Number(res.headers.get("Content-Length")),end-start+1);
 }
 assert.equal(reads,1,"rapid scrubbing must not re-read a large cached MP3");
 const impossible=await rangeFn(cached,"bytes=300000-350000",url);
 assert.equal(impossible.status,416);
});
test("iPhone DJ stops an unexpectedly oversized streaming response before decoding",async()=>{
 const mix=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 const code=excerpt(mix,"async function decodeMobileIntroRange(","async function decode(track,needClip=false)");
 let reads=0,cancels=0,decoded=0;
 const runtime={
  fetch:async()=>({status:206,headers:new Headers(),
   body:{getReader:()=>({read:async()=>{reads++;return {done:false,value:new Uint8Array(300000)}},
    cancel:async()=>{cancels++}})}}),
  Offline:class {async decodeAudioData(){decoded++;return {duration:10}}}
 };
 const init="const document={hidden:false},djPlaybackEpoch=0,djFetchControllers=new Set();"+
  "const cache=new Map(),mobileIntroClips=new Map();"+
  "const mobileDJMayWork=()=>true;"+
  "const rememberMobileClip=(key,b)=>mobileIntroClips.set(key,b);"+
  "const withValidatedVoice=(v)=>v;"+
  "const fetch=(...args)=>r.fetch(...args);"+
  "const window={OfflineAudioContext:r.Offline};";
 const load=new Function("r",init+code+"return decodeMobileIntroRange;")(runtime);
 assert.equal(await load("https://example.com/oversize.mp3","x",{bpm:120},0),null);
 assert.equal(reads,3);assert.equal(cancels,1);assert.equal(decoded,0);
});
