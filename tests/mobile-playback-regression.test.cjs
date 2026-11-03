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
 assert.ok(app.includes('window.MusicBoxMix?.onSeek?.("media")'));
 assert.ok(app.includes('window.MusicBoxMix?.onSeek?.("user")'));
 assert.ok(app.includes('const pausaPerSeek = a.seeking ||'));
 assert.ok(app.includes('if (_vuoleSuonare && a.paused && !a.ended'));
 assert.ok(app.includes('if (_usaControlliNativiIos() && _vuoleSuonare) return;'));
 const mix=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 assert.ok(mix.includes('headers:{"Range":"bytes=0-786431"}'));
 assert.ok(mix.includes("if(response.status!==206"));
 assert.ok(mix.includes("onSeek:(reason)=>{"));
 assert.ok(mix.includes('reason!=="user"'));
 assert.ok(mix.includes("active?.handingOff&&active.track.id===target"));
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

test("locked iPhone headphone pause after several seconds is intentional",()=>{
 const classify=new Function(
  excerpt(app,"function _pausaDuranteCambioVisibilita(",
    "function _pausaNativaVolontaria(")+
  "return _pausaDuranteCambioVisibilita;")();
 assert.equal(classify(true,1000,0,1650),true,
  "a simultaneous hide/pause may be system interruption");
 assert.equal(classify(true,1000,0,5500),false,
  "headphone pause 4.5s after lock must be deliberate");
 assert.equal(classify(true,1000,0,45000),false,
  "headphone pause while long backgrounded must be deliberate");
 assert.equal(classify(false,1000,30000,30800),true,
  "iOS foreground transition interruption is still protected");
 assert.equal(classify(false,1000,30000,35000),false);
});
test("iOS MediaSession play/pause handlers must be registered, never null",()=>{
 const session=excerpt(app,"function updateMediaSession()","function totalDuration()");
 assert.ok(session.includes('setHandler("pause", () => { _pausaVolontaria(); });'));
 assert.ok(session.includes('setHandler("play", () => {'));
 assert.ok(!session.includes('setHandler("pause", null)'));
 assert.ok(!session.includes('setHandler("play", null)'));
});
test("headphone pause cancels all retry work and persists paused intent",()=>{
 const pauseSource=excerpt(app,"function _pausaVolontaria()",
  "/* Ste: \"riapro l'app e si ferma la canzone");
 const observed={paused:false,cancels:0,intent:true,stats:0};
 const build=new Function("o",
  "const window={MusicBoxMix:{cancel:()=>o.cancels++}};"+
  "let _vuoleSuonare=true,_pausaEsplicita=false;"+
  "let _silenziDiFila=3,_timerRiprove=null,_timerAiuto=null;"+
  "const audio={pause:()=>{o.paused=true}};"+
  "const _segna=()=>{},_chiudiAscolto=()=>{o.stats++};"+
  "const _memorizzaPausaCorrente=()=>{};"+
  "const _segnaIntenzioneSono=v=>{o.intent=v};"+
  "const setPlaybackState=()=>{},_nascondiAiuto=()=>{},"+
   "syncPlayUI=()=>{},_usaControlliNativiIos=()=>true,"+
   "updateMediaSession=()=>{};"+
  pauseSource+
  "return {pause:_pausaVolontaria,state:()=>({want:_vuoleSuonare,explicit:_pausaEsplicita})};"
 )(observed);
 build.pause();
 assert.equal(observed.paused,true);
 assert.equal(observed.intent,false);
 assert.equal(observed.cancels,1);
 assert.equal(observed.stats,1);
 assert.deepEqual(build.state(),{want:false,explicit:true});
});
test("delayed play, retry and resume cannot resurrect an explicit iPhone pause",()=>{
 const player=excerpt(app,"function createAudio()","function rebuildAudio(");
 const recovery=excerpt(app,"function _riprendiDopoRicarica()",
  "function _riproduciVolontaria()");
 const retry=excerpt(app,"function _riprovaPiuTardi(",
  "/* L'intestazione esce");
 const voluntary=excerpt(app,"function _riproduciVolontaria(",
  "async function togglePlay()");
 assert.ok(player.includes('if(_pausaEsplicita&&!_vuoleSuonare){'));
 assert.ok(player.includes('try{a.pause()}catch(_){}'));
 assert.ok(recovery.includes('if(audio!==resumeAudio||_pausaEsplicita||'));
 assert.ok(recovery.includes('!_avevoIntesoDiAscoltare()'));
 assert.ok(retry.includes('if(_pausaEsplicita||!_vuoleSuonare)return;'));
 assert.ok(voluntary.includes('_pausaEsplicita = false;'));
 assert.ok(app.includes('if(_pausaEsplicita&&!_vuoleSuonare)return false;'));
});

test("background pause saves the precise decoder time, not just a painted progress bar",()=>{
 const script=excerpt(app,"function _pausaSalvata()","function updatePlayerHeight()");
 const state=new Map();
 const LS={get:(k,d)=>state.has(k)?state.get(k):d,
  set:(k,v)=>state.set(k,v),remove:k=>state.delete(k)};
 let track={id:"b-track-80",currentTime:143.658,paused:true,readyState:4,
  duration:238,playCalls:0,play(){this.playCalls++;return Promise.resolve()}};
 const writes=[];
 const env={track,LS,writes};
 const make=new Function("env",
  "let audio=env.track,currentId='b-track-80',profile='Ste';"+
  "let _pausaCheckpoint=null,_pausaEsplicita=true,_vuoleSuonare=false;"+
  "let _ultimoSeekUtente=0;"+
  "const LS=env.LS,writeProfileState=(p,v)=>env.writes.push(v);"+
  "const profileState=()=>({last:currentId,time:143.658});"+
  "const totalDuration=()=>audio.duration;"+
  "const updateProgressUI=(pos,dur)=>env.display={pos,dur};"+
  script+
  "return {checkpoint:_memorizzaPausaCorrente,save:savePos,"+
   "restore:_riallineaPausaReale,reset:(a)=>{audio=a},stored:()=>_pausaCheckpoint};"
 )(env);
 make.checkpoint();
 assert.equal(LS.get("mb.pausaPos.Ste").time,143.658);
 assert.equal(LS.get("mb.playback.Ste").time,143.658);
 // Safari discards the decoded playback position while suspended.
 track.currentTime=0;
 make.save();
 assert.equal(LS.get("mb.playback.Ste").time,143.658,
  "a broken audio element must not overwrite an authoritative pause point");
 assert.equal(make.restore(),true);
 assert.equal(track.currentTime,143.658,"real audio decoder must seek");
 assert.equal(track.playCalls,0,"restoring a PAUSED song must never press play");
 assert.equal(env.display.pos,143.658);
});
test("a paused track can recover after a full iPhone page recreation",()=>{
 const script=excerpt(app,"function _pausaSalvata()","function updatePlayerHeight()");
 const state=new Map([["mb.pausaPos.Ste",{id:"b-track-42",time:119.127,quando:400}],
   ["mb.playback.Ste",{id:"b-track-42",time:119.127,quando:400}]]);
 const audio={paused:true,currentTime:0,readyState:1,duration:211,
  playCalls:0,play(){this.playCalls++}};
 const fn=new Function("s",
  "const LS={get:(k,d)=>s.state.has(k)?s.state.get(k):d,set:(k,v)=>s.state.set(k,v)};"+
  "let audio=s.audio,currentId='b-track-42',profile='Ste';"+
  "let _pausaCheckpoint=null,_pausaEsplicita=false,_vuoleSuonare=false;"+
  "let _ultimoSeekUtente=0;"+
  "const profileState=()=>({last:currentId,time:119.127});"+
  "const writeProfileState=()=>{};"+
  "const totalDuration=()=>audio.duration,updateProgressUI=(pos,d)=>{s.display=pos};"+
  script+"return _riallineaPausaReale;"
 )({state,audio});
 assert.equal(fn(),true);
 assert.equal(audio.currentTime,119.127);
 assert.equal(audio.playCalls,0);
});
test("the resume event keeps paused near-end timestamps, short positions and state",()=>{
 const metadata=excerpt(app,"function handleMetadata()", "function _avvisaBranoNonDisponibile(");
 const env={audio:{paused:true,duration:200,currentTime:0},
  resumeAt:199.45,display:null};
 const metadataFn=new Function("env",
  "let audio=env.audio,resumeAt=env.resumeAt,currentId='b-track-1';"+
  "const totalDuration=()=>audio.duration;"+
  "const LS={get:()=> 'no'};const _pausaEsplicita=true;"+
  "const _pausaSalvata=()=>({id:'b-track-1',time:199.45});"+
  "const _riallineaPausaReale=()=>true;const _vuoleSuonare=false;"+
  "const updateProgressUI=(p,d)=>env.display={p,d};"+
  metadata+"return {run:handleMetadata,resume:()=>resumeAt};"
 )(env);
 metadataFn.run();
 assert.ok(Math.abs(env.audio.currentTime-199.45)<.05,
  "a pause near the end must not restart from zero");
 assert.equal(metadataFn.resume(),0);
 assert.equal(env.display.p,env.audio.currentTime);
 assert.match(app,/resumeAt=salvato>\.01\?salvato:0/);
 assert.match(app,/mb\.pausaPos\."\+profile/);
});
test("foreground recovery seeks the HTMLAudioElement and does not autoplay paused music",()=>{
 assert.match(app,/if\(typeof _riallineaPausaReale==="function"\)\s*_riallineaPausaReale\(\)/);
 assert.match(app,/a\.addEventListener\("canplay",\s*\(\) =>/);
 assert.match(app,/const pending=_ripristinoPausaAtteso/);
 assert.match(app,/_memorizzaPausaCorrente\(\);\s*setPlaybackState\("paused"\)/);
 assert.match(app,/if\(audio\?\.paused&&!_vuoleSuonare\)_riallineaPausaReale\(\)/);
 assert.match(app,/const sec=Math\.max\(0,Math\.round/);
});
