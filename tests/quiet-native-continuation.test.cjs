'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('mix-intelligente.js','utf8'),start=code.indexOf('function continueQuietNative('),end=code.indexOf('function quietDirectHandoff(',start);
function fixture(mode){
 const events=new Map(),timers=new Map();let timer=0,current=38,next=50,wants=true,handoffs=0,resumes=0;
 const audio={paused:false,ended:false,currentTime:158.6,src:'original-source',currentSrc:'original-source',_mbCambioBrano:false,
  addEventListener:(e,f)=>events.set(e,f),removeEventListener:e=>events.delete(e),pause(){this.paused=true}};
 const app={audio:()=>audio,currentId:()=>current,mixNext:()=>({id:next}),wantsPlayback:()=>wants,
  mixHandoff:(id,at)=>{assert.equal(id,50);assert.equal(at,0);assert.equal(audio._mbQuietNativeContinuation.fromId,38);assert.equal(audio._mbQuietNativeContinuation.toId,50);if(mode==='reject')throw Error('controlled handoff failure');if(mode==='decline')return false;handoffs++;current=id;return true},
  playCurrent:()=>{resumes++;audio.paused=false}};
 const fn=new Function('isIOS','setTimeout','clearTimeout',code.slice(start,end)+'return continueQuietNative;')(true,(f)=>{timers.set(++timer,f);return timer},id=>timers.delete(id));
 return {audio,run:()=>fn(app,audio,38,{id:50},0),ack:()=>events.get('pause')?.(),timeout:()=>[...timers.values()][0]?.(),
  queue:()=>next=4,pause:()=>wants=false,manual:()=>current=4,state:()=>({handoffs,resumes,handlers:events.size,timers:timers.size})};
}
test('quiet continuation drains the old native pause before issuing a one-use zero-entry continuation',async()=>{
 const t=fixture(),job=t.run();assert.equal(t.state().handoffs,0);assert.equal(t.audio._mbCambioBrano,true);t.ack();await job;await Promise.resolve();
 assert.equal(t.state().handoffs,1);assert.equal(t.state().resumes,0);assert.equal(t.state().handlers,0);assert.equal(t.state().timers,0);
});
test('explicit pause, reordered queue, manual track change and missing pause acknowledgement cannot start a stale successor',async()=>{
 for(const mode of ['pause','queue','manual','timeout']){
  const t=fixture(),job=t.run();if(mode==='timeout')t.timeout();else{t[mode]();t.ack()}
  await job;assert.equal(t.state().handoffs,0,mode);assert.equal(t.state().handlers,0);assert.equal(t.state().timers,0);
  assert.equal(t.audio.currentTime,158.6);assert.equal(t.audio.src,'original-source');
  assert.equal(t.state().resumes,['queue','timeout'].includes(mode)?1:0,mode);t.ack();assert.equal(t.state().handoffs,0);
 }
});

test('a rejected or declined native continuation restores the same original without a stale pause guard',async()=>{
 for(const mode of ['reject','decline']){
  const f=fixture(mode),job=f.run();f.ack();
  if(mode==='reject')await assert.rejects(job,/controlled handoff failure/);else assert.equal(await job,false);
  assert.equal(f.audio._mbCambioBrano,false);assert.equal(f.audio.paused,false);assert.equal(f.audio.currentTime,158.6);assert.equal(f.audio.src,'original-source');
  assert.equal(f.state().resumes,1);assert.equal(f.state().timers,0);assert.equal(f.state().handlers,0);
 }
});
