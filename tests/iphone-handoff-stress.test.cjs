"use strict";
// Deterministic iPhone DJ stress suite. Node simulates native Safari timing
// and buffering; WebKit browser lifecycle is tested in iphone-webkit-smoke.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const excerpt=(from,to)=>{
 const i=source.indexOf(from),j=source.indexOf(to,i);
 assert.ok(i>=0&&j>i,"Missing DJ source section "+from);
 return source.slice(i,j);
};
const clockCode=excerpt("function mobilePlayedSeconds(","function mobileNativeSeekReady(");
const seekCode=excerpt("function mobileNativeSeekReady(","function finishMobileMix(");
const finishCode=excerpt("function finishMobileMix(","function handoffMobileMix(");
const played=new Function(clockCode+"return mobilePlayedSeconds;")();
const makeFinish=new Function("state","clock","hooks",
 "let mobileActive=state;const Date={now:()=>clock.now};"+
 "const stopMobileMix=(fade)=>hooks.stops.push(fade);"+
 clockCode+seekCode+finishCode+"return finishMobileMix;");

test("Safari playbackRate clock is continuous for 18000 hold/ramp/sample cases",()=>{
 let n=0;
 for(const speed of [.97,.975,.985,.993,1,1.007,1.015,1.025,1.03]){
  for(const duration of [.65,1.2,2.35,3.1,4.7,7.5,9.5,12]){
   const hold=duration*.72,ramp=duration*.28;
   const state={ctx:{currentTime:0},started:4,rateSpeed:speed,
    rateHold:hold,rateRamp:ramp};
   let previous=-1;
   // Analytically integrate the exact scheduled WebAudio automation.
   for(let i=0;i<=250;i++){
    const t=duration*i/250;
    state.ctx.currentTime=4+t;
    const expected=t<=hold?speed*t:t<hold+ramp?
     speed*hold+speed*(t-hold)+(1-speed)*(t-hold)**2/(2*ramp):
     t+(speed-1)*(hold+ramp/2);
    const actual=played(state);
    assert.ok(Math.abs(actual-expected)<1e-8,
     "Safari native handoff offset must follow the actual source speed");
    assert.ok(actual>=previous-1e-10,"Audio time must never jump backward");
    previous=actual;n++;
   }
   state.ctx.currentTime=4+duration+3;
   assert.ok(Math.abs(played(state)-
    (duration+3+(speed-1)*(hold+ramp/2)))<1e-8);
   state.ctx.currentTime=2;
   assert.equal(played(state),0,"Future WebAudio starts cannot consume samples");
  }
 }
 console.info("[IPHONE RATE STRESS]",JSON.stringify({cases:n,speeds:9,durations:8}));
});

test("Safari handoff never seeks an unbuffered native MP3, even in 500 jittered scenarios",()=>{
 let seeksAllowed=0,unbufferedAvoided=0;
 for(let i=0;i<500;i++){
  const speed=.97+(i%31)*.002;
  const buffered=i%2===0;
  const state={track:{id:"new"},handingOff:true,entry:i%3,
   ctx:{currentTime:2.9+(i%13)*.045},started:0,
   rateSpeed:speed,rateHold:1.8,rateRamp:.9,
   handoffAt:1000,timeoutAt:20000,clipEnd:15,
   nativeRetryCount:0,nativeRetryAt:0,nativeRepairAttempted:false};
  const target=state.entry+played(state);
  const clock={now:2000},hooks={stops:[]},values={seeks:0,time:0};
  const audio={paused:false,readyState:2,seeking:false,error:null,
   duration:140,seekable:{length:1,start:()=>0,end:()=>140},
   buffered:{length:1,start:()=>0,end:()=>buffered?20:Math.max(0,target-.8)},
   get currentTime(){return values.time},
   set currentTime(at){values.time=at;values.seeks++}};
  const app={audio:()=>audio,currentId:()=>"new",wantsPlayback:()=>true,
   playCurrent:()=>Promise.resolve()};
  const finish=makeFinish(state,clock,hooks);
  finish(app);finish(app);finish(app);
  assert.equal(values.seeks,buffered?1:0,
   "Only one verified seek into already buffered media is permitted");
  assert.equal(values.time,buffered?target:0);
  assert.equal(hooks.stops.length,0,"Preview continues during native decoding");
  if(buffered)seeksAllowed++;else unbufferedAvoided++;
 }
 console.info("[IPHONE BUFFER STRESS]",JSON.stringify({scenarios:500,
  verifiedOneTimeRepairs:seeksAllowed,unsafeSeeksPrevented:unbufferedAvoided}));
});

test("500 real-time transition scenarios hand off only after native decoder progresses",()=>{
 let completed=0,aborted=0;
 for(let i=0;i<500;i++){
  const speed=.97+(i%31)*.002;
  const explicitPause=i%5===0;
  const clock={now:2500},hooks={stops:[]};
  const state={track:{id:"next"},handingOff:true,entry:i%7,
   ctx:{currentTime:3},started:0,rateSpeed:speed,
   rateHold:2,rateRamp:1,handoffAt:1200,timeoutAt:16000,
   clipEnd:14,nativeRetryCount:0,nativeRetryAt:0};
  const native={paused:false,readyState:3,seeking:false,
   currentTime:state.entry+played(state),duration:150};
  let retries=0;
  const app={audio:()=>native,currentId:()=>"next",
   wantsPlayback:()=>!explicitPause,
   playCurrent:()=>{retries++;return Promise.resolve()}};
  const finish=makeFinish(state,clock,hooks);
  finish(app);
  if(explicitPause){
   assert.equal(hooks.stops.length,1,
    "Manual pause must abandon preview without autoplay");
   assert.equal(retries,0);aborted++;continue;
  }
  assert.equal(hooks.stops.length,0,"Do not stop before progress is verified");
  assert.equal(state.nativeSyncDone,true);
  assert.equal(state.nativeRepairAttempted,undefined,"No false seek");
  // Native decoder keeps up for 420ms: allow a short final fade.
  clock.now+=420;state.ctx.currentTime+=.42;
  native.currentTime=state.entry+played(state);
  finish(app);
  assert.deepEqual(hooks.stops,[.20]);
  assert.equal(retries,0);completed++;
 }
 console.info("[IPHONE NATIVE CONTINUITY]",JSON.stringify({scenarios:500,
  progressed:completed,manualPausesHonored:aborted}));
});

test("Safari audio buffer eligibility is strict for all readyState levels and segment gaps",()=>{
 const canSeek=new Function(seekCode+"return mobileNativeSeekReady;")();
 let cases=0,approved=0;
 for(let state=0;state<=4;state++){
  for(let gap=0;gap<=20;gap++){
   for(const seeking of [false,true]){
    const target=7.5;
    const end=target+.25+(gap-10)*.15;
    const audio={readyState:state,seeking,
     seekable:{length:1,start:()=>0,end:()=>120},
     buffered:{length:1,start:()=>0,end:()=>end}};
    const expected=state>=2&&!seeking&&end>=target+.35;
    assert.equal(canSeek(audio,target),expected,
     "Native Safari seeks must be possible only when data is buffered");
    if(expected)approved++;cases++;
   }
  }
 }
 console.info("[IPHONE BUFFER GUARD]",JSON.stringify({cases,approved}));
});
