'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const code=fs.readFileSync(require('node:path').join(__dirname,'../audio-composite-mix.js'),'utf8');
function fixture(){
 const listeners=new Map(),events={addEventListener:(name,f)=>listeners.set(name,f),removeEventListener:()=>{}};
 const doc={...events,hidden:false};const ctx={...events,state:'running',sampleRate:48000,currentTime:0,
  createBufferSource:()=>({connect(){},disconnect(){},start(){},stop(){}}),
  createGain:()=>{ctx.testGain={connect(){},disconnect(){},gain:{value:0,setTargetAtTime(value){this.value=value}}};return ctx.testGain;},destination:{},
  decodeAudioData:async()=>({duration:7.1,sampleRate:48000,numberOfChannels:2,getChannelData:()=>new Float32Array([.1,-.2])})};
 const bytes=new Uint8Array([1,2,3]).buffer;
 const sandbox={console,Map,Set,Number,Array,Uint8Array,Float32Array,crypto,AbortController,
  document:doc,fetch:async()=>({ok:true,headers:{get:()=>3},arrayBuffer:async()=>bytes}),setTimeout,clearTimeout};
 sandbox.window=sandbox;vm.runInNewContext(code,sandbox);
 return {api:sandbox.MusicBoxCompositeMix,ctx,doc,bytes,listeners,environment:sandbox};
}
async function cue(f){
 const sha=Buffer.from(await crypto.subtle.digest('SHA-256',f.bytes)).toString('hex');
 return {begin:32,end:37,fade:5,entry:64,tempo:1,sourceSha:'a'.repeat(40),targetSha:'b'.repeat(40),
  composite:{version:1,path:'dj-mixes/'+sha+'.flac',sha256:sha,sourceSha:'a'.repeat(40),targetSha:'b'.repeat(40),
   begin:32,entry:64,fade:5,tempo:1,seconds:7.1,peak:.2,overlapPeak:.2,oversampledPeak:.2,preRoll:.3,handoffPosition:69,nativeHandoffAt:5,nativeRevealAt:6.05,
   pitchPreserved:true,timingVerified:true,renderedFromOriginals:true}};
}
test('common mix refuses stale sources, altered cues and hot assets',async()=>{
 const f=fixture(),p=await cue(f);assert.equal(f.api.supports(p),true);
 for(const changed of [{...p,entry:0},{...p,sourceSha:'c'.repeat(40)},
  {...p,composite:{...p.composite,peak:1.01}},{...p,composite:{...p.composite,path:'../private'}}])assert.equal(f.api.supports(changed),false);
});
test('common mix verifies decoded PCM; native volume is never the outgoing gate',async()=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);
 const old={...f.ctx,paused:false,seeking:false,muted:false,currentTime:31.7,volume:1};
 const app={audio:()=>old,currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>.8,wantsPlayback:()=>true,mixSourceMatches:()=>true};
 assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),true);assert.equal(old.muted,true);assert.equal(old.volume,1);
 f.api.stop();assert.equal(old.muted,false);assert.equal(f.api.active(),false);
});
test('missing assets or a late/stalled clock never mute the native recording',async()=>{
 const f=fixture(),p=await cue(f),old={paused:false,seeking:false,muted:false,currentTime:32.3};
 const app={currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>1,mixSourceMatches:()=>true};
 assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),false);
 await f.api.prepare(p,f.ctx);assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),false);
 old.currentTime=32;f.ctx.state='suspended';assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),false);assert.equal(old.muted,false);
});
test('hash mismatch fails before decoding or touching the native player',async()=>{
 const f=fixture(),p=await cue(f);p.composite.sha256='f'.repeat(64);
 await assert.rejects(f.api.prepare(p,f.ctx),/hash mismatch/);
});
test('seek cancellation releases an asset request and permits an immediate fresh preparation',async()=>{
 const f=fixture(),p=await cue(f),requests=[];
 f.environment.fetch=(url,{signal})=>new Promise((resolve,reject)=>{
  requests.push({resolve,signal});signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
 });
 const obsolete=f.api.prepare(p,f.ctx);f.api.cancelPreparation();
 const fresh=f.api.prepare(p,f.ctx);await assert.rejects(obsolete,/aborted/);
 assert.equal(requests.length,2);
 requests[1].resolve({ok:true,headers:{get:()=>3},arrayBuffer:async()=>f.bytes});
 assert.equal(await fresh,true);
});
test('a missing asset backs off instead of refetching on every player tick',async()=>{
 const f=fixture(),p=await cue(f);let requests=0;
 f.environment.fetch=async()=>{requests++;return {ok:false}};
 await assert.rejects(f.api.prepare(p,f.ctx),/unavailable/);
 await assert.rejects(f.api.prepare(p,f.ctx),/temporarily/);assert.equal(requests,1);
});
test('a user seek during native handoff cancels the common clock and is never corrected backwards',async t=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);
 t.after(()=>f.api.stop());
 const old={...f.ctx,paused:false,seeking:false,muted:false,currentTime:31.7,volume:1};
 const next={paused:false,seeking:false,muted:true,currentTime:69,readyState:2};let id='a',player=old;
 const app={audio:()=>player,currentId:()=>id,mixNext:()=>({id:'b'}),volume:()=>1,wantsPlayback:()=>true,mixSourceMatches:()=>true,
  mixHandoff:()=>{id='b';player=next;return Promise.resolve()}};
 assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),true);
 f.ctx.currentTime=5.32;old.currentTime=37.02;
 await new Promise(r=>setTimeout(r,35));assert.equal(id,'b');assert.equal(f.api.active(),true);
 assert.equal(f.api.onSeek('native',next),true,'consume only the known initial programmatic seek');
 next.currentTime=69.2;assert.equal(f.api.onSeek('user',next),false);
 assert.equal(f.api.active(),false);assert.equal(next.muted,false);assert.equal(next.currentTime,69.2);
});
test('a common handoff can retain the gesture-authorized native media element',async t=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);t.after(()=>f.api.stop());
 const audio={...f.ctx,paused:false,seeking:false,muted:false,currentTime:31.7,readyState:2};let id='a';
 const app={audio:()=>audio,currentId:()=>id,mixNext:()=>({id:'b'}),volume:()=>1,wantsPlayback:()=>true,mixSourceMatches:()=>true,
  mixHandoff:(_,position)=>{id='b';audio.currentTime=position;f.listeners.get('seeking')?.();return Promise.resolve()}};
 assert.equal(f.api.tryStart(p,audio,app,'b',f.ctx),true);
 f.ctx.currentTime=5.32;audio.currentTime=37.02;
 await new Promise(r=>setTimeout(r,35));assert.equal(id,'b');assert.equal(f.api.active(),true);
 assert.equal(f.api.onSeek('media',audio),true);assert.equal(audio.muted,true);
});
test('common output follows native volume readback rather than an ignored iOS request',async t=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);t.after(()=>f.api.stop());
 const audio={...f.ctx,paused:false,seeking:false,muted:false,currentTime:31.7,volume:1};
 const app={audio:()=>audio,currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>.37,wantsPlayback:()=>true,mixSourceMatches:()=>true};
 audio.currentTime=31;assert.equal(f.api.tryStart(p,audio,app,'b',f.ctx),true);
 assert.equal(audio.muted,false);assert.notEqual(audio._mbCommonMixMuted,true,'arming alone cannot claim the native mute');f.api.stop();audio.currentTime=31.7;
 assert.equal(f.api.tryStart(p,audio,app,'b',f.ctx),true);assert.equal(f.ctx.testGain.gain.value,1);
 f.api.stop();audio.volume=.37;assert.equal(f.api.tryStart(p,audio,app,'b',f.ctx),true);assert.equal(f.ctx.testGain.gain.value,.37);
});
test('a mute requested during the common overlap survives cancellation',async()=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);let volume=1;
 const audio={...f.ctx,paused:false,seeking:false,muted:false,currentTime:31.7,volume:1};
 const app={audio:()=>audio,currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>volume,wantsPlayback:()=>true,mixSourceMatches:()=>true};
 assert.equal(f.api.tryStart(p,audio,app,'b',f.ctx),true);volume=0;f.api.stop();
 assert.equal(audio.muted,true);assert.equal(audio._mbCommonMixMuted,false);
});

test('muted outgoing clock drift does not cancel the shared audible signal; rate changes still cancel',async t=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);t.after(()=>f.api.stop());
 const audio={...f.ctx,paused:false,seeking:false,muted:false,currentTime:31.7,volume:1};
 const app={audio:()=>audio,currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>1,wantsPlayback:()=>true,mixSourceMatches:()=>true};
 assert.equal(f.api.tryStart(p,audio,app,'b',f.ctx),true);
 f.ctx.currentTime=.4;audio.currentTime=32.19;
 await new Promise(r=>setTimeout(r,35));
 assert.equal(f.api.active(),true);assert.equal(audio.muted,true);
 f.listeners.get('ratechange')();assert.equal(f.api.active(),false);assert.equal(audio.muted,false);
});
