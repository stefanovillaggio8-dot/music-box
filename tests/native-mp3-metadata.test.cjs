'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const source=fs.readFileSync(require('path').join(__dirname,'../native-mp3-metadata.js'),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture({ua='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 Safari/605.1.15',platform='',duration=.002}={}){
 const timers=new Map(),events=new Map(),docEvents=new Map(),fetches=[],revoked=[],urls=new Map();let timer=0,current=true,wants=true;
 const original=Buffer.alloc(2048,24),prefix=Buffer.from('metadata'),wrapped=Buffer.concat([original.subarray(0,44),prefix,original.subarray(44)]);
 const proof={method:'mp3-frame-count-prefix-identical-pcm-v1',browserVerified:true,sourceSha256:sha(original),wrappedSha256:sha(wrapped),sourceBytes:original.length,wrappedBytes:wrapped.length,insertAt:44,prefixBase64:prefix.toString('base64'),duration:126,
  pcmIdentity:Object.fromEntries([44100,48000].map(rate=>[rate,{sha256:'b'.repeat(64),bytes:rate*126*8}]))};
 proof.nativePcmIdentity={method:'actual-native-metadata-identical-pcm-v1',sourceSha256:proof.sourceSha256,wrappedSha256:proof.wrappedSha256,rates:Object.fromEntries([44100,48000].map(rate=>[rate,{frames:126*rate,channels:2,maximumSampleDifference:0,browsers:['chromium','webkit']}]))};
 class LocalURL extends URL{static createObjectURL(blob){const u='blob:fixture-'+urls.size;urls.set(u,blob);return u}static revokeObjectURL(u){revoked.push(u)}}
 const audio={duration,readyState:4,currentTime:.002,muted:true,volume:.7,src:'http://localhost/songs/track-4.mp3',_mbMixSourceUrl:'http://localhost/songs/track-4.mp3',playCalls:0,
  addEventListener:(n,f)=>{if(!events.has(n))events.set(n,new Set());events.get(n).add(f)},removeEventListener:(n,f)=>events.get(n)?.delete(f),play(){this.playCalls++;return Promise.resolve()}};
 const doc={hidden:false,addEventListener:(n,f)=>{if(!docEvents.has(n))docEvents.set(n,new Set());docEvents.get(n).add(f)},removeEventListener:(n,f)=>docEvents.get(n)?.delete(f)};
 const c={navigator:{userAgent:ua,platform},crypto:crypto.webcrypto,URL:LocalURL,Blob,Uint8Array,TextDecoder,AbortController,location:{href:'http://localhost/index.html'},document:doc,atob,
  setTimeout:(f,ms)=>{timers.set(++timer,{f,ms});return timer},clearTimeout:id=>timers.delete(id)};
 c.fetch=async(url,options)=>{fetches.push({url,options});const b=url.includes('native-mp3-metadata.json')?Buffer.from(JSON.stringify({version:1,entries:{'audio/songs/track-4.mp3':proof}})):original;
  return {ok:true,headers:{get:()=>String(b.length)},arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.length)}};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);
 const options={url:audio.src,canonical:audio._mbMixSourceUrl,current:()=>current,wantsPlayback:()=>wants},api=c.MusicBoxNativeMetadata;
 const emit=name=>{for(const f of [...(events.get(name)||[])])f()};
 return {c,api,audio,options,proof,original,wrapped,timers,fetches,revoked,urls,emit,doc,
  arm:()=>api.arm(audio,options),setCurrent:x=>current=x,setWants:x=>wants=x,
  run:async()=>{const next=[...timers].find(([,x])=>x.ms===600);if(next){timers.delete(next[0]);next[1].f();}await api.whenIdle()},
  visibility:hidden=>{doc.hidden=hidden;for(const f of [...(docEvents.get('visibilitychange')||[])])f()}};
}

test('iPhone, macOS and Chromium never start optional metadata work',async()=>{
 for(const ua of ['Mozilla (iPhone) AppleWebKit/605.1.15','Mozilla (Macintosh) AppleWebKit/605.1.15','Mozilla (Linux) AppleWebKit/537 Chrome/140']){
  const f=fixture({ua});f.arm();await f.run();assert.equal(f.fetches.length,0);assert.equal(f.timers.size,0);
 }
});

test('usable and briefly provisional metadata retain the original source without downloading',async()=>{
 const f=fixture({duration:126});f.arm();await f.run();assert.equal(f.fetches.length,0);assert.equal(f.audio._mbNativeMetadataCleanup,undefined);
 const g=fixture();g.arm();g.audio.duration=126;g.emit('durationchange');await g.run();assert.equal(g.fetches.length,0);assert.equal(g.audio.src,g.options.url);
});

test('persistent invalid metadata is repaired once with immutable bytes, canonical identity and binary mute',async()=>{
 const f=fixture();f.arm();f.emit('playing');f.emit('progress');assert.equal(f.timers.size,1);await f.run();
 assert.equal(f.fetches.length,2);assert.equal(f.audio.src,'blob:fixture-0');assert.equal(f.audio._mbMixSourceUrl,f.options.canonical);assert.equal(f.audio.muted,true);assert.equal(f.audio.volume,.7);
 assert.deepEqual(Buffer.from(await f.urls.get(f.audio.src).arrayBuffer()),f.wrapped);assert.deepEqual(f.original,Buffer.alloc(2048,24));assert.equal(f.audio.playCalls,1);assert.equal(f.api.diagnostics().repairsApplied,1);
 f.emit('playing');f.emit('progress');await f.run();assert.equal(f.fetches.length,2);assert.equal(f.timers.size,0);
});

test('changed originals, prefixes and unverified representations cannot replace the source',async()=>{
 for(const mutate of [p=>p.sourceSha256='c'.repeat(64),p=>p.wrappedSha256='c'.repeat(64),p=>p.browserVerified=false,p=>delete p.pcmIdentity[48000],p=>p.nativePcmIdentity.rates[48000].maximumSampleDifference=1e-9,p=>p.nativePcmIdentity.wrappedSha256='f'.repeat(64)]){
  const f=fixture();mutate(f.proof);f.arm();await f.run();assert.equal(f.audio.src,f.options.url);assert.equal(f.audio.playCalls,0);assert.equal(f.urls.size,0);
 }
});

test('superseding the owner during download aborts stale data without playing it',async()=>{
 const f=fixture(),fetch=f.c.fetch;let release;
 f.c.fetch=async(url,o)=>{if(!url.includes('native-mp3'))await new Promise(r=>release=r);return fetch(url,o)};
 f.arm();const running=f.run();while(!release)await new Promise(setImmediate);
 f.setCurrent(false);f.emit('progress');release();await running;assert.equal(f.audio.src,f.options.url);assert.equal(f.audio.playCalls,0);assert.equal(f.fetches.at(-1).options.signal.aborted,true);
});

test('pause during repair never resumes playback or steals the pending initial seek',async()=>{
 const f=fixture(),fetch=f.c.fetch;let release;
 f.c.fetch=async(url,o)=>{if(!url.includes('native-mp3'))await new Promise(r=>release=r);return fetch(url,o)};
 f.audio._mbInitialSeekCleanup=()=>{};f.arm();const running=f.run();while(!release)await new Promise(setImmediate);
 f.setWants(false);release();await running;assert.equal(f.audio.playCalls,0);assert.equal(typeof f.audio._mbInitialSeekCleanup,'function');
 f.audio.duration=126;f.audio.currentTime=110.6;f.emit('loadedmetadata');assert.equal(f.audio.currentTime,110.6);
});

test('manual seeking cancels repair rather than restoring the old cursor',async()=>{
 const f=fixture();f.arm();f.emit('seeking');f.audio.currentTime=30;await f.run();assert.equal(f.fetches.length,0);assert.equal(f.audio.currentTime,30);assert.equal(f.audio.src,f.options.url);
});

test('hidden pages stop delayed and in-flight work while retaining an applied playing source',async()=>{
 const f=fixture();f.arm();f.visibility(true);await f.run();assert.equal(f.fetches.length,0);f.visibility(false);await f.run();assert.equal(f.api.diagnostics().repairsApplied,1);f.visibility(true);assert.equal(f.revoked.length,0);
 const g=fixture(),fetch=g.c.fetch;let release;g.c.fetch=async(url,o)=>{if(!url.includes('native-mp3'))await new Promise(r=>release=r);return fetch(url,o)};
 g.arm();const running=g.run();while(!release)await new Promise(setImmediate);g.visibility(true);release();await running;assert.equal(g.audio.src,g.options.url);assert.equal(g.audio.playCalls,0);
});

test('a new source releases its old object URL with no timer or stale owner',async()=>{
 const f=fixture();f.arm();await f.run();const old=f.audio.src;f.audio._mbNativeMetadataCleanup('source-assignment');assert.deepEqual(f.revoked,[old]);assert.equal(f.timers.size,0);assert.equal(f.audio._mbNativeMetadataCleanup,undefined);
 f.api.cancel('again');assert.deepEqual(f.revoked,[old]);
});


test('a Linux backend with Safari-compatible UA is detected without enabling an emulated iPhone',async()=>{
 const f=fixture({ua:'Mozilla (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15',platform:'Linux x86_64'});f.arm();await f.run();assert.equal(f.api.diagnostics().repairsApplied,1);
 const phone=fixture({ua:'Mozilla (iPhone) AppleWebKit/605.1.15',platform:'Linux x86_64'});phone.arm();await phone.run();assert.equal(phone.fetches.length,0);assert.equal(phone.timers.size,0);
});
