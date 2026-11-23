/* ISOLATED DIAGNOSTIC ONLY. Not included in Music Box or its service worker.
   Desktop WebKit with an iPhone UA does not reproduce iPhone media policy. */
(function(root){
'use strict';
root.createNativeDualDeckProbe=function(f,options={}){
 const old=new Audio('/original/'+f.sourceSha+'.mp3'),incoming=new Audio('/original/'+f.targetSha+'.mp3');
 for(const a of [old,incoming]){a.preload='metadata';a.volume=1;a.load()}
 let timer=null,finishTimer=null,started=false,intentionalPause=false;
 const report={physicalIPhone:false,notApplicationIntegration:true,notPlaybackCertified:true,userAgent:navigator.userAgent,
  sourceSha:f.sourceSha,targetSha:f.targetSha,phase:'unprimed',events:[],bootstrap:options.bootstrap||'audible',
  primingOrder:options.primingOrder||'parallel',sourceClockOffset:null};
 const log=(event,a)=>report.events.push({event,at:a?.currentTime,paused:a?.paused,ended:a?.ended,muted:a?.muted});
 const listeners=[];
 for(const [label,a] of [['source',old],['incoming',incoming]])for(const event of ['play','playing','pause','ended','error']){
  const handler=()=>log(label+'-'+event,a);a.addEventListener(event,handler);listeners.push([a,event,handler]);
 }
 const hidden=()=>document.hidden||options.hidden?.()===true;
 const clear=()=>{clearTimeout(timer);timer=null;clearTimeout(finishTimer);finishTimer=null};
 function stop(reason){clear();incoming.pause();report.phase='stopped';report.reason=reason;log(reason,old)}
 const sourcePause=()=>{if(!intentionalPause&&['waiting','overlap'].includes(report.phase)&&!old.ended)stop('source-paused-before-eof')};
 old.addEventListener('pause',sourcePause);
 old.addEventListener('seeking',()=>{if(['waiting','overlap'].includes(report.phase))stop('user-seek')});
 const visibility=()=>{if(hidden()&&['waiting','overlap'].includes(report.phase))stop('hidden')};
 document.addEventListener('visibilitychange',visibility);
 async function wait(test,ms=5000){const start=performance.now();while(!test()){
  if(performance.now()-start>ms)throw Error('bounded-readiness-timeout');await new Promise(r=>setTimeout(r,20));
 }}
 function prime(event){
  if(!event?.isTrusted||report.phase!=='unprimed')return Promise.reject(Error('trusted-prime-gesture-required'));
  report.phase='priming';incoming.muted=report.bootstrap==='muted';
  // Distinct experiment: authorize the second element while source is
  // paused, then start the source. It tests whether parallel priming itself
  // caused interruption; it does NOT assume simultaneous playback works.
  const authorization=report.primingOrder==='sequential'?
   Promise.resolve(incoming.play()).then(async()=>{
    await wait(()=>incoming.currentTime>.02,3000);report.sequentialPrimerSeconds=incoming.currentTime;
    incoming.pause();return old.play();
   }):Promise.all([old.play(),incoming.play()]);
  log('prime-request',incoming);
  return authorization.then(async()=>{
   await new Promise(r=>setTimeout(r,100));
   report.primingSourceContinued=!old.paused&&old.currentTime>.02;
   report.primingIncomingSeconds=incoming.currentTime;
   if(!report.primingSourceContinued)throw Error('priming-interrupted-source');
   intentionalPause=true;old.pause();incoming.pause();
   await wait(()=>old.readyState>=2&&incoming.readyState>=2);
   const offset=root.MusicBoxCompositeMix.nativeClockOffset(f.sourceClock,f.sourceSha,old.duration);
   const targetOffset=root.MusicBoxCompositeMix.nativeClockOffset(f.targetClock,f.targetSha,incoming.duration);
   if(offset===null||targetOffset===null)throw Error('unknown-real-native-clock');
   report.sourceClockOffset=offset;report.targetClockOffset=targetOffset;
   old.currentTime=f.begin-3+offset;incoming.currentTime=0;
   await wait(()=>!old.seeking&&!incoming.seeking&&Math.abs(old.currentTime-(f.begin-3+offset))<.08&&incoming.currentTime<=.02);
   report.phase='primed';intentionalPause=false;log('prime-complete',incoming);
  }).catch(error=>{intentionalPause=true;old.pause();stop(error.message);throw error});
 }
 function run(event){
  if(!event?.isTrusted||report.phase!=='primed')return Promise.reject(Error('trusted-run-gesture-required'));
  report.phase='waiting';started=false;const start=performance.now();
  const job=old.play();
  function advance(){
   if(!['waiting','overlap'].includes(report.phase))return;
   if(hidden()){stop('hidden');return;}
   if(performance.now()-start>10000){stop('bounded-test-timeout');return;}
   if(old.paused&&!old.ended){stop('source-paused-before-eof');return;}
   if(!started&&old.currentTime>=f.begin+report.sourceClockOffset){
    if(old.currentTime>f.begin+report.sourceClockOffset+.1){stop('missed-window');return;}
    if(incoming.seeking||incoming.currentTime>.02||incoming.readyState<2||
       root.MusicBoxCompositeMix.nativeClockOffset(f.targetClock,f.targetSha,incoming.duration)===null){stop('incoming-not-ready');return;}
    started=true;incoming.muted=false;report.phase='overlap';report.incomingStart=incoming.currentTime;report.sourceAtStart=old.currentTime;
    // Deliberately OUTSIDE a gesture: this tests the per-element bootstrap.
    incoming.play().then(()=>{report.incomingPlayResolved=true;log('incoming-playing',incoming)}).catch(e=>stop('incoming-play-rejected:'+e.name));
   }
   if(started&&old.ended){
    if(incoming.paused||incoming.currentTime<.1){stop('incoming-stopped-at-eof');return;}
    report.beforeAdoption={sourceEnded:old.ended,sourceAt:old.currentTime,sourceDuration:old.duration,incomingAt:incoming.currentTime};
    report.activeAudio=incoming;report.adoptedSameElement=true;report.phase='adopted';clear();
    // Bounded diagnostic, not an unattended second music player.
    finishTimer=setTimeout(()=>{incoming.pause();report.phase='complete'},1000);return;
   }
   timer=setTimeout(advance,25);
  }
  return Promise.resolve(job).then(()=>{advance()}).catch(e=>{stop('source-play-rejected:'+e.name);throw e});
 }
 function snapshot(){const {activeAudio,...rest}=report;return {...rest,sameIncomingElement:activeAudio===incoming,
  sourceTime:old.currentTime,incomingTime:incoming.currentTime,sourcePaused:old.paused,incomingPaused:incoming.paused};}
 function dispose(){intentionalPause=true;clear();old.pause();incoming.pause();for(const a of [old,incoming]){a.removeAttribute('src');a.load()}
  for(const [a,event,handler] of listeners)a.removeEventListener(event,handler);
  old.removeEventListener('pause',sourcePause);document.removeEventListener('visibilitychange',visibility);report.phase='disposed'}
 return {prime,run,stop,snapshot,dispose,old,incoming};
};
})(window);
