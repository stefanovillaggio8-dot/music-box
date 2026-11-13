'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function tone(rate,seconds,hz){return Float32Array.from({length:rate*seconds},(_,i)=>.2*Math.sin(2*Math.PI*hz*i/rate))}
function fakeStretchBrowser(){
 const instances=[];
 class FakeWorker{
  constructor(){instances.push(this)}
  postMessage(data){this.lastMessage=data}
  terminate(){this.terminated=true}
 }
 const window={Worker:FakeWorker};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../audio-stretch.js'),'utf8'),{
  window,Worker:FakeWorker,setTimeout,clearTimeout,Date,Error
 });
 return {api:window.MusicBoxStretch,instances};
}
test('mobile time stretch changes beat speed while preserving pitch and stereo phase',async()=>{
 const {stretchClip,playedAt}=await import('../audio-stretch-core.mjs');
 const rate=16000,input=tone(rate,16,440),out=stretchClip({rate,start:0,channels:[input,input.slice()]},{entry:0,tempo:1.0458,fade:6.849});
 const a=out.channels[0],b=out.channels[1];
 let crossing=0;const lo=rate,hi=rate*3;
 for(let i=lo+1;i<hi;i++){if(a[i-1]<0&&a[i]>=0)crossing++;assert.ok(Math.abs(a[i]-b[i])<1e-7);}
 assert.ok(Math.abs(crossing/2-440)<3,'pitch must remain 440Hz, not rise to 460Hz');
 assert.ok(Math.abs(playedAt(4,1.0458,out.rateHold,out.rateRamp)-4*1.0458)<1e-8);
 assert.ok(out.pitchPreserved);assert.equal(out.rateSpeed,1.0458);
});
test('time-stretch worker is local, bounded and required before a pitched mobile full mix',()=>{
 const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
 const worker=fs.readFileSync(path.join(root,'audio-stretch-worker.js'),'utf8');
 assert.match(worker,/stretchClip/);assert.doesNotMatch(worker,/https?:\/\//);
 assert.match(source,/if\(!clip\.pitchPreserved&&programmableRate/);
 assert.match(source,/clip\.pitchPreserved\?clip\.rateSpeed:1/);
 assert.match(source,/clip\.pitchPreserved\?0:/);
});

test('sixteen-second native-tail stretch keeps the measured tempo until EOF',async()=>{
 const {stretchClip,playedAt}=await import('../audio-stretch-core.mjs');
 const rate=16000,input=tone(rate,23,440);
 const out=stretchClip({rate,start:0,channels:[input]},{entry:0,tempo:.97,fade:16});
 assert.equal(out.rateHold,16);assert.ok(Math.abs(playedAt(15,.97,out.rateHold,out.rateRamp)-14.55)<1e-8);
 let crossing=0;for(let i=rate*12+1;i<rate*14;i++)if(out.channels[0][i-1]<0&&out.channels[0][i]>=0)crossing++;
 assert.ok(Math.abs(crossing/2-440)<3);
});
test('seek cancellation allows the same iPhone mix to prepare immediately again',async()=>{
 const {api,instances}=fakeStretchBrowser();
 const clip={rate:16000,start:0,channels:[new Float32Array(1024)]};
 const cue={entry:0,tempo:1.04,fade:6.85};
 const obsolete=api.prepare(clip,cue);
 assert.equal(instances.length,1);
 api.cancel();
 assert.equal(instances[0].terminated,true);
 // Start again before the rejected job has even settled. A user seek is
 // not a decoder failure and must not enforce a 25-second retry timeout.
 const fresh=api.prepare(clip,cue);
 assert.equal(instances.length,2);
 const expected={pitchPreserved:true,timing:{verified:true},channels:clip.channels};
 instances[1].onmessage({data:{id:instances[1].lastMessage.id,clip:expected}});
 assert.equal(await obsolete,null);
 assert.equal(await fresh,expected);
 assert.equal(api.get(clip,cue),expected);
 api.cancel();
});
test('a genuinely failed audio stretch worker retains a bounded retry backoff',async()=>{
 const {api,instances}=fakeStretchBrowser();
 const clip={rate:16000,start:0,channels:[new Float32Array(1024)]};
 const cue={entry:0,tempo:1.04,fade:6.85};
 const pending=api.prepare(clip,cue);
 instances[0].onerror(new Error('decoder worker crashed'));
 assert.equal(await pending,null);
 assert.equal(await api.prepare(clip,cue),null);
 assert.equal(instances.length,1,'a failed worker must not be recreated on every player tick');
});
