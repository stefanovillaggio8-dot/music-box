'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const code=fs.readFileSync(require('node:path').join(__dirname,'../audio-composite-mix.js'),'utf8');
function fixture(){
 const listeners=new Map(),events={addEventListener:(name,f)=>listeners.set(name,f),removeEventListener:()=>{}};
 const doc={...events,hidden:false};const ctx={...events,state:'running',currentTime:0,
  createBufferSource:()=>({connect(){},disconnect(){},start(){},stop(){}}),
  createGain:()=>({connect(){},disconnect(){},gain:{value:0,setTargetAtTime(){}}}),destination:{},
  decodeAudioData:async()=>({duration:6.8,numberOfChannels:2,getChannelData:()=>new Float32Array([.1,-.2])})};
 const bytes=new Uint8Array([1,2,3]).buffer;
 const sandbox={console,Map,Set,Number,Array,Uint8Array,Float32Array,crypto,
  document:doc,fetch:async()=>({ok:true,headers:{get:()=>3},arrayBuffer:async()=>bytes}),setTimeout,clearTimeout};
 sandbox.window=sandbox;vm.runInNewContext(code,sandbox);
 return {api:sandbox.MusicBoxCompositeMix,ctx,doc,bytes,listeners};
}
async function cue(f){
 const sha=Buffer.from(await crypto.subtle.digest('SHA-256',f.bytes)).toString('hex');
 return {begin:32,end:37,fade:5,entry:64,tempo:1,sourceSha:'a'.repeat(40),targetSha:'b'.repeat(40),
  composite:{version:1,path:'dj-mixes/'+sha+'.flac',sha256:sha,sourceSha:'a'.repeat(40),targetSha:'b'.repeat(40),
   begin:32,entry:64,fade:5,tempo:1,seconds:6.8,peak:.2,handoffPosition:69,
   pitchPreserved:true,timingVerified:true,renderedFromOriginals:true}};
}
test('common mix refuses stale sources, altered cues and hot assets',async()=>{
 const f=fixture(),p=await cue(f);assert.equal(f.api.supports(p),true);
 for(const changed of [{...p,entry:0},{...p,sourceSha:'c'.repeat(40)},
  {...p,composite:{...p.composite,peak:1.01}},{...p,composite:{...p.composite,path:'../private'}}])assert.equal(f.api.supports(changed),false);
});
test('common mix verifies decoded PCM; native volume is never the outgoing gate',async()=>{
 const f=fixture(),p=await cue(f);await f.api.prepare(p,f.ctx);
 const old={...f.ctx,paused:false,seeking:false,muted:false,currentTime:32,volume:1};
 const app={audio:()=>old,currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>.8,wantsPlayback:()=>true};
 assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),true);assert.equal(old.muted,true);assert.equal(old.volume,1);
 f.api.stop();assert.equal(old.muted,false);assert.equal(f.api.active(),false);
});
test('missing assets or a late/stalled clock never mute the native recording',async()=>{
 const f=fixture(),p=await cue(f),old={paused:false,seeking:false,muted:false,currentTime:32.3};
 const app={currentId:()=> 'a',mixNext:()=>({id:'b'}),volume:()=>1};
 assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),false);
 await f.api.prepare(p,f.ctx);assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),false);
 old.currentTime=32;f.ctx.state='suspended';assert.equal(f.api.tryStart(p,old,app,'b',f.ctx),false);assert.equal(old.muted,false);
});
test('hash mismatch fails before decoding or touching the native player',async()=>{
 const f=fixture(),p=await cue(f);p.composite.sha256='f'.repeat(64);
 await assert.rejects(f.api.prepare(p,f.ctx),/hash mismatch/);
});
