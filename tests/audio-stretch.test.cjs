'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
function tone(rate,seconds,hz){return Float32Array.from({length:rate*seconds},(_,i)=>.2*Math.sin(2*Math.PI*hz*i/rate))}
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
