/* ISOLATED STUDY. No application integration or iPhone certification. */
(function(root){
'use strict';
root.createObservedNativeProbe=function(f,options={}){
 const old=new Audio('/original/'+f.sourceSha+'.mp3'),incoming=new Audio(options.silentPrimer?'/silent-primer.wav':'/original/'+f.targetSha+'.mp3');
 for(const a of [old,incoming]){a.preload='auto';a.volume=1;a.load()}
 const clock=(a,c,sha)=>root.MusicBoxCompositeMix.nativeClockOffset(c,sha,a.duration);
 const hidden=()=>document.hidden||options.hidden?.()===true;
 const r={method:'observed-native-clock-before-play-promise-v2',phase:'unprimed',physicalIPhone:false,
  notApplicationIntegration:true,notPlaybackCertified:true,sourceSha:f.sourceSha,targetSha:f.targetSha,
  events:[],samples:[],userAgent:navigator.userAgent,silentPrimer:options.silentPrimer===true,
  observeSourceAfterPlay:options.observeSourceAfterPlay===true,sourcePlayRequests:0};
 let timer=null,finish=null,generation=0,started=false;
 const log=(event,a)=>r.events.push({event,wall:performance.now(),time:a?.currentTime,duration:a?.duration,paused:a?.paused,readyState:a?.readyState});
 const clear=()=>{clearTimeout(timer);clearTimeout(finish);timer=finish=null};
 function stop(reason){generation++;clear();r.beforeStop={sourcePaused:old.paused,sourceAt:old.currentTime,incomingPaused:incoming.paused,incomingAt:incoming.currentTime};
  r.phase='stopped';r.reason=reason;incoming.pause();log(reason,old)}
 async function wait(test,budget=5000){const at=performance.now(),token=generation;while(!test()){
  if(generation!==token||hidden())throw Error('cancelled-during-readiness');
  if(performance.now()-at>budget)throw Error('bounded-native-readiness-timeout');await new Promise(resolve=>setTimeout(resolve,20));
 }}
 const handlers=[];
 const on=(a,event,handler)=>{a.addEventListener(event,handler);handlers.push([a,event,handler])};
 for(const [name,a] of [['source',old],['incoming',incoming]])for(const event of ['play','playing','pause','ended','error'])on(a,event,()=>log(name+'-'+event,a));
 on(old,'pause',()=>{if(['waiting','overlap'].includes(r.phase)&&!old.ended)stop('source-paused-before-eof')});
 on(old,'seeking',()=>{if(['waiting','overlap'].includes(r.phase))stop('source-seek')});
 const visibility=()=>{if(hidden()&&['priming','primed','positioning','waiting','overlap','adopted'].includes(r.phase))stop('hidden')};
 document.addEventListener('visibilitychange',visibility);
 function prime(event){
  if(!event?.isTrusted||r.phase!=='unprimed')return Promise.reject(Error('trusted-prime-required'));
  r.phase='priming';const token=generation;log('incoming-prime-request',incoming);
  // Only the incoming element is primed. The original never plays here.
  let job;try{job=incoming.play()}catch(e){stop(e.message);return Promise.reject(e)}
  Promise.resolve(job).then(()=>{if(generation!==token){incoming.pause();return}log('incoming-prime-promise',incoming)}).catch(e=>{if(generation===token)stop('prime-play-rejected:'+e.name)});
  return wait(()=>incoming.currentTime>.02&&(!incoming.paused||incoming.ended)).then(async()=>{
   r.primerSeconds=incoming.currentTime;r.sourceNeverPlayedDuringPrime=old.paused&&old.currentTime===0;incoming.pause();
   if(options.silentPrimer){incoming.src='/original/'+f.targetSha+'.mp3';incoming.load();r.originalLoadedOnSamePrimedElement=true;}
   await wait(()=>old.readyState>=2&&incoming.readyState>=2&&(options.observeSourceAfterPlay||clock(old,f.sourceClock,f.sourceSha)!==null)&&clock(incoming,f.targetClock,f.targetSha)!==null);
   r.sourceClockOffset=clock(old,f.sourceClock,f.sourceSha);r.targetClockOffset=clock(incoming,f.targetClock,f.targetSha);
   r.prePlaySourceDuration=old.duration;
   if(!options.observeSourceAfterPlay)old.currentTime=f.begin-3+r.sourceClockOffset;
   incoming.currentTime=0;
   await wait(()=>!old.seeking&&!incoming.seeking&&(options.observeSourceAfterPlay||Math.abs(old.currentTime-(f.begin-3+r.sourceClockOffset))<.08)&&incoming.currentTime<=.02);
   if(generation!==token)throw Error('cancelled-prime');r.phase='primed';log('prime-ready',incoming);
  }).catch(e=>{if(generation===token)stop(e.message);throw e});
 }
 function run(event){
  if(!event?.isTrusted||r.phase!=='primed')return Promise.reject(Error('trusted-run-required'));
  r.phase=options.observeSourceAfterPlay?'positioning':'waiting';started=false;const at=performance.now(),token=generation;
  r.sourcePlayRequests++;
  let job;try{job=old.play()}catch(e){stop(e.message);return Promise.reject(e)}
  r.sourcePlayRequestedAt=at;log('source-play-request',old);
  // Native clock observation must NOT wait for this promise to resolve.
  Promise.resolve(job).then(()=>{r.sourcePlayPromiseResolvedAt=performance.now();log('source-play-promise',old)})
   .catch(e=>{if(generation===token)stop('source-play-rejected:'+e.name)});
  function advance(){
   if(generation!==token||!['positioning','waiting','overlap'].includes(r.phase))return;
   const elapsed=performance.now()-at;
   if(r.samples.length<420)r.samples.push({wall:elapsed,sourceAt:old.currentTime,incomingAt:incoming.currentTime,sourcePaused:old.paused,incomingPaused:incoming.paused});
   if(hidden()){stop('hidden');return}
   if(elapsed>10000){stop('bounded-study-timeout');return}
   if(old.error||incoming.error){stop('native-media-error');return}
   if(old.paused&&!old.ended){stop('source-paused-before-eof');return}
   if(r.phase==='positioning'){
    // Original first play is trusted; provisional metadata is never fitted.
    // A diagnostic seek is issued ONCE only after a declared clock appears.
    if(!r.positioning){
     const offset=clock(old,f.sourceClock,f.sourceSha);
     if(offset!==null){r.sourceClockOffset=offset;r.positioning={duration:old.duration,offset,sourceAt:old.currentTime,at:elapsed};old.currentTime=f.begin-3+offset;}
    }
    if(r.positioning&&!old.seeking&&Math.abs(old.currentTime-(f.begin-3+r.sourceClockOffset))<.08){r.phase='waiting';log('declared-source-clock-ready-after-play',old);}
    else {if(elapsed>5000){stop('bounded-source-clock-refinement-timeout');return}timer=setTimeout(advance,25);return;}
   }
   if(!started&&old.currentTime>=f.begin+r.sourceClockOffset){
    if(old.currentTime>f.begin+r.sourceClockOffset+.08){stop('missed-window');return}
    if(clock(old,f.sourceClock,f.sourceSha)!==r.sourceClockOffset||clock(incoming,f.targetClock,f.targetSha)===null||
       incoming.seeking||incoming.currentTime>.02||incoming.readyState<2){stop('unready-or-changed-native-clock');return}
    started=true;r.phase='overlap';r.incomingStart=incoming.currentTime;r.sourceAtStart=old.currentTime;
    r.incomingRequestedAt=performance.now();log('incoming-overlap-request',incoming);
    try{Promise.resolve(incoming.play()).then(()=>{if(generation!==token){incoming.pause();return}r.incomingPlayResolvedAt=performance.now();log('incoming-play-promise',incoming)})
     .catch(e=>{if(generation===token)stop('incoming-play-rejected:'+e.name)});
    }catch(e){stop('incoming-play-threw:'+e.name);return}
   }
   if(started){
    if(incoming.paused&&performance.now()-r.incomingRequestedAt>500){stop('incoming-did-not-start');return}
    if(old.ended){
     if(incoming.paused||incoming.currentTime<.1){stop('incoming-stopped-at-eof');return}
     r.beforeAdoption={sourceEnded:true,sourceAt:old.currentTime,sourceDuration:old.duration,incomingAt:incoming.currentTime};
     r.phase='adopted';r.sameIncomingElement=true;clear();finish=setTimeout(()=>{generation++;incoming.pause();r.phase='complete'},1000);return;
    }
   }else if(old.ended){stop('source-ended-before-overlap');return}
   timer=setTimeout(advance,25);
  }
  advance();return Promise.resolve();
 }
 function snapshot(){return {...r,sourceTime:old.currentTime,incomingTime:incoming.currentTime,sourcePaused:old.paused,incomingPaused:incoming.paused}}
 function dispose(){generation++;clear();r.phase='disposed';for(const [a,event,fn] of handlers)a.removeEventListener(event,fn);document.removeEventListener('visibilitychange',visibility);
  for(const a of [old,incoming]){a.pause();a.removeAttribute('src');a.load()}}
 return {prime,run,stop,snapshot,dispose,old,incoming};
};
})(window);
