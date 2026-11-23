'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {clockOffset}=require('../tools/factored-native-clean.cjs');
const data=require('../audits/ste-factored-clean-20261123/recordings.json');
const a=Object.values(data.recordings).find(r=>r.quietSuffix),b=Object.values(data.recordings).find(r=>r.prefix?.reusedPublishedEvidence);
function fixture(){
 const audios=[],timers=new Map(),events=new Map();let now=0,serial=0;
 class Audio{
  constructor(){this.currentTime=0;this.duration=(audios.length?b:a).clock.decodedFrames/(audios.length?b:a).clock.sampleRate;
   this.paused=true;this.readyState=4;this.seeking=false;this.ended=false;this.plays=0;this.events=new Map();audios.push(this)}
  load(){}removeAttribute(){}addEventListener(e,fn){if(!this.events.has(e))this.events.set(e,new Set());this.events.get(e).add(fn)}
  removeEventListener(e,fn){this.events.get(e)?.delete(fn)}emit(e){for(const fn of this.events.get(e)||[])fn()}
  play(){this.plays++;this.paused=false;if(this===audios[1]&&this.plays===1)this.currentTime=.03;
   return new Promise(resolve=>{this.resolvePlay=resolve})}
  pause(){this.paused=true;this.emit('pause')}
 }
 const document={hidden:false,addEventListener:(e,fn)=>events.set(e,fn),removeEventListener:e=>events.delete(e)};
 const window={MusicBoxCompositeMix:{nativeClockOffset:(c,sha,d)=>c.sourceSha===sha?clockOffset(c,d):null}};
 vm.runInNewContext(fs.readFileSync('tools/ios-native-observed-probe.js','utf8'),{window,document,Audio,navigator:{userAgent:'deterministic test, not a browser'},performance:{now:()=>now},
  setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id)});
 const f={sourceSha:a.sourceSha,targetSha:b.sourceSha,begin:a.quietSuffix.begin,end:a.duration,sourceClock:a.clock,targetClock:b.clock};
 const probe=window.createObservedNativeProbe(f);
 return {probe,f,document,old:audios[0],incoming:audios[1],advance(){const [id,t]=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0]||[];if(t){now=t.at;timers.delete(id);t.fn()}},hide(){document.hidden=true;events.get('visibilitychange')?.()}};
}
test('actual media clock can launch and complete while BOTH play promises remain unresolved',async()=>{
 const t=fixture();await t.probe.prime({isTrusted:true});assert.equal(t.old.plays,0);assert.equal(t.probe.snapshot().sourceNeverPlayedDuringPrime,true);
 await t.probe.run({isTrusted:true});assert.equal(t.probe.snapshot().sourcePlayPromiseResolvedAt,undefined);
 t.old.currentTime=t.f.begin+.02;t.advance();assert.equal(t.probe.snapshot().phase,'overlap');assert.equal(t.probe.snapshot().incomingStart,0);
 assert.equal(t.incoming.plays,2);t.old.currentTime=t.old.duration;t.old.ended=true;t.old.paused=true;t.incoming.currentTime=2.2;t.advance();
 assert.equal(t.probe.snapshot().phase,'adopted');assert.equal(t.probe.snapshot().beforeAdoption.sourceEnded,true);t.probe.dispose();
});
test('seek, explicit pause, hidden and changed clock cancel without resetting or restarting original',async()=>{
 for(const action of ['seek','pause','hidden','clock']){
  const t=fixture();await t.probe.prime({isTrusted:true});await t.probe.run({isTrusted:true});
  if(action==='seek')t.old.emit('seeking');if(action==='pause')t.old.pause();if(action==='hidden')t.hide();
  if(action==='clock'){t.old.duration=.002;t.old.currentTime=t.f.begin;t.advance()}
  const r=t.probe.snapshot();assert.equal(r.phase,'stopped',action);assert.equal(t.incoming.plays,1);assert.equal(t.incoming.paused,true);
  assert.equal(t.old.plays,1);assert.equal(t.old.paused,action==='pause');t.probe.dispose();
 }
});
test('a late incoming play resolution cannot resurrect a cancelled second deck',async()=>{
 const t=fixture();await t.probe.prime({isTrusted:true});await t.probe.run({isTrusted:true});t.old.currentTime=t.f.begin;t.advance();
 t.hide();t.incoming.paused=false;t.incoming.resolvePlay();await new Promise(setImmediate);
 assert.equal(t.incoming.paused,true);assert.equal(t.probe.snapshot().phase,'stopped');assert.equal(t.old.plays,1);t.probe.dispose();
});
