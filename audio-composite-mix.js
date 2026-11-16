/* Bounded, source-bound offline PCM mixes. Safari uses native muted, never
   HTMLMediaElement.volume, to replace the outgoing signal during overlap.
   A missing asset/clock/decoder leaves the ordinary native player available. */
(function(root){
'use strict';
const cache=new Map(),pending=new Map(),failures=new Map();let current=null,lastStop=null;
const finite=Number.isFinite,limit=(n,a,b)=>Math.max(a,Math.min(b,n));
function outputLevel(app,audio){
 if(Number(app.volume())===0)return 0;
 const native=Number(audio?.volume);
 // iOS can return 1 despite a lower requested software volume. Match
 // the native readback at both binary switches, including that case.
 return finite(native)?limit(native,0,1):limit(Number(app.volume())||0,0,1);
}
// MP3 decoders differ in whether their public clock retains declared codec
// priming. Resolve only two container-evidenced durations; never fit a lag.
function nativeClockOffset(metadata,sha,duration){
 const p=metadata;
 if(p?.method!=='original-mp3-gapless-metadata-v1'||p.sourceSha!==sha||![44100,48000].includes(p.sampleRate)||
    ![p.rawFrames,p.decodedFrames,p.primingFrames,p.paddingFrames].every(Number.isInteger)||p.decodedFrames<=p.sampleRate*26||
    p.primingFrames<0||p.primingFrames>p.sampleRate*.1||p.paddingFrames<0||p.paddingFrames>p.sampleRate*.1||
    p.rawFrames!==p.decodedFrames+p.primingFrames+p.paddingFrames||!finite(duration))return null;
 const gapless=Math.abs(duration-p.decodedFrames/p.sampleRate)<=.002,raw=Math.abs(duration-p.rawFrames/p.sampleRate)<=.002;
 if(gapless&&raw&&p.primingFrames>0)return null;
 return gapless?0:raw?p.primingFrames/p.sampleRate:null;
}
function supports(cue){
 const c=cue?.composite;
 return !!c&&c.version===1&&c.sourceSha===cue.sourceSha&&c.targetSha===cue.targetSha&&
  /^[a-f0-9]{40}$/.test(c.sourceSha)&&/^[a-f0-9]{40}$/.test(c.targetSha)&&
  /^dj-mixes\/[a-f0-9]{64}\.flac$/.test(c.path)&&/^[a-f0-9]{64}$/.test(c.sha256)&&
  [c.seconds,c.peak,c.overlapPeak,c.oversampledPeak,c.begin,c.entry,c.fade,c.tempo,c.handoffPosition,c.nativeHandoffAt,c.nativeRevealAt].every(finite)&&[.3,.6,.9].includes(c.preRoll)&&
  (c.releaseSeconds==null||[.9,1.2,1.5].includes(c.releaseSeconds))&&
  ((c.preRoll===.3&&(c.releaseSeconds==null||c.releaseSeconds===.9))||
   [3,4].includes(c.envelopeVersion)&&finite(c.releaseSeconds)&&
   Math.abs(c.seconds-(c.preRoll+cue.fade+c.releaseSeconds+.9))<.002&&
   Math.abs(c.nativeRevealAt-(c.nativeHandoffAt+c.releaseSeconds+.15))<.002)&&
  c.nativeHandoffAt>=cue.fade-(cue.preservedFileTail?.1:.001)&&c.nativeHandoffAt<=cue.fade+.2&&
  c.nativeRevealAt>=c.nativeHandoffAt+1&&c.nativeRevealAt<=c.seconds-c.preRoll-.1&&
  c.peak>0&&c.peak<=.9991&&c.overlapPeak<=.961&&c.oversampledPeak<=1&&c.seconds>=cue.fade+1.7&&c.seconds<=20&&
  ['begin','entry','fade','tempo'].every(k=>Math.abs(c[k]-cue[k])<.0001)&&
  c.pitchPreserved===true&&c.timingVerified===true&&c.renderedFromOriginals===true&&
  (cue.stretchProfile==null?c.stretchProfile==null:cue.stretchProfile==='transient-60-12-8-v1'&&c.stretchProfile===cue.stretchProfile)&&
  (c.envelopeVersion!==4||c.gainProof?.method==='offline-stereo-shared-lookahead-v1'&&
   [c.gainProof.maximumReductionDb,c.gainProof.meanOverlapReductionDb].every(finite)&&
   c.gainProof.maximumReductionDb>=0&&c.gainProof.maximumReductionDb<=4.5&&
   c.gainProof.meanOverlapReductionDb>=0&&c.gainProof.meanOverlapReductionDb<=c.gainProof.maximumReductionDb&&
   c.gainProof.attackDbPerSecond===40&&c.gainProof.releaseDbPerSecond===8&&c.gainProof.firstGain===1&&c.gainProof.nativeRevealGain===1)&&
  (!cue.preservedFileTail||cue.entry===0&&cue.nativeTailFullBeat===true&&cue.preserveTail===true&&
   c.outgoingEnvelope==='unity-through-decoded-eof-v1'&&finite(c.sourceReadThrough)&&Math.abs(c.sourceReadThrough-cue.end)<=.1)&&
  (!cue.structuralBeat||c.rhythmVerified===true&&c.postRenderRhythm?.accepted===true)&&
  (!cue.metricalPickupWindow||cue.nativeOriginalReturn===true&&cue.measuredFullBeat===false&&cue.metricalRhythmic===true&&
   cue.preservedEntrance==='metrical-pickup-033-v1'&&c.renderedEntrance===cue.preservedEntrance&&c.releaseSeconds===(cue.metricalCadenceWindow?1.2:1.5)&&!!c.nativeDecoderProof)&&
  (cue.nativeRecoveryCurve==null&&!cue.metricalCadenceWindow&&c.nativeRecoveryCurve==null||
   cue.metricalCadenceWindow===true&&cue.metricalPickupWindow===true&&cue.nativeRecoveryCurve==='sine-1.2-v1'&&
   c.nativeRecoveryCurve===cue.nativeRecoveryCurve&&cue.fade<=18&&cue.structuralEvidence?.bars===4&&
   // A duration-only certificate misses Apple's headerless-MP3 waveform shift.
   // New cadences need nominal original-prefix coherence on BOTH backends.
   Array.isArray(c.nativeDecoderProof?.sourcePlatformCoverage)&&['linux','darwin'].every(os=>c.nativeDecoderProof.sourcePlatformCoverage.includes(os))&&
   latestLaunchTime(cue)>cue.begin-c.preRoll+.04&&
   cue.structuralEvidence?.cadenceWindow?.method==='four-observed-bars-and-preserved-decay-v1'&&
   [44100,48000].every(rate=>{const v=c.nativeDecoderProof?.rates?.[rate]?.sourceClockProof;return v?.method==='actual-native-source-clock-v1'&&v.sourceSha===cue.sourceSha&&Array.isArray(v.browsers)&&v.browsers.length===2&&v.browsers.includes('chromium')&&v.browsers.includes('webkit')})&&
   c.cadenceTailProof?.sourceSha===cue.sourceSha&&['at48000','at44100'].every(k=>{
    const t=c.cadenceTailProof[k],w=cue.structuralEvidence.cadenceWindow;
    return t?.method==='unmodified-original-hpss-tail-v1'&&t.accepted===true&&t.sourceGainApplied===false&&t.searchedEntireTail===true&&
     finite(w.rhythmicSeconds)&&finite(w.tailSeconds)&&w.rhythmicSeconds>=4.5&&w.tailSeconds>=.65&&w.tailSeconds<=4&&
     Math.abs(w.rhythmicSeconds+w.tailSeconds-cue.fade)<.001&&Math.abs(t.rhythmicSeconds-w.rhythmicSeconds)<.001&&
     Math.abs(t.tailSeconds-w.tailSeconds)<.001&&Math.abs(t.sourceTailThrough-cue.fade)<.001&&
     finite(t.maximumTailOnset)&&t.maximumTailOnset>=0&&t.maximumTailOnset<.25&&finite(t.maximumRelativeRms)&&t.maximumRelativeRms>=0&&t.maximumRelativeRms<=.5&&
     t.sampleRate===(k==='at48000'?48000:44100)&&Array.isArray(t.channelProofs)&&t.channelProofs.length===2&&t.channelProofs.every(v=>v.accepted===true&&v.method===t.method&&v.sampleRate===t.sampleRate&&v.sourceGainApplied===false&&v.searchedEntireTail===true&&finite(v.maximumTailOnset)&&v.maximumTailOnset>=0&&v.maximumTailOnset<.25&&finite(v.maximumRelativeRms)&&v.maximumRelativeRms>=0&&v.maximumRelativeRms<=.5);
   }))&&
  (!cue.nativeOriginalReturn||cue.metricalPickupWindow&&
   nativeClockOffset(c.nativeSplice?.sourceClock,cue.sourceSha,c.nativeSplice?.sourceClock?.decodedFrames/c.nativeSplice?.sourceClock?.sampleRate)===0&&
   nativeClockOffset(c.nativeSplice?.targetClock,cue.targetSha,c.nativeSplice?.targetClock?.decodedFrames/c.nativeSplice?.targetClock?.sampleRate)===0&&
   c.nativeSplice?.method==='original-pcm-native-return-v1'&&c.nativeSplice.targetSha===cue.targetSha&&
   finite(c.nativeSplice.returnEnergyRatio)&&c.nativeSplice.returnEnergyRatio>=.85&&c.nativeSplice.returnEnergyRatio<=1.000001&&
   finite(c.nativeSplice.returnStart)&&finite(c.nativeSplice.returnEnd)&&c.nativeSplice.returnStart>=c.nativeHandoffAt+.849&&c.nativeSplice.returnStart<=c.nativeHandoffAt+1.081&&
   Math.abs(c.nativeSplice.returnEnd-c.nativeSplice.returnStart-.02)<.00001&&c.nativeSplice.returnEnd<=c.nativeRevealAt-.3&&
   c.nativeSplice.unmodifiedOriginalComparison===true&&finite(c.nativeSplice.encodedMaximumDifference)&&c.nativeSplice.encodedMaximumDifference>=0&&c.nativeSplice.encodedMaximumDifference<=2e-6&&
   [44100,48000].every(rate=>{const v=c.nativeDecoderProof?.rates?.[rate]?.nativeSplice;return v?.method==='actual-native-original-splice-v1'&&v.clockMethod==='original-mp3-gapless-metadata-v1'&&v.targetSha===cue.targetSha&&
    finite(v.minimumCorrelation)&&v.minimumCorrelation>=.99&&finite(v.maximumRelativeRms)&&v.maximumRelativeRms>=0&&v.maximumRelativeRms<=.1}))&&
  (!c.nativeDecoderProof||c.nativeDecoderProof.method==='actual-browser-decode-v1'&&c.nativeDecoderProof.assetSha256===c.sha256&&
   [44100,48000].every(rate=>{const p=c.nativeDecoderProof.rates?.[rate];return p&&
    [p.samplePeak,p.overlapPeak].every(finite)&&p.samplePeak>0&&p.samplePeak<=.9992&&p.overlapPeak>=0&&p.overlapPeak<=.962&&
    Array.isArray(p.browsers)&&p.browsers.length===2&&p.browsers.includes('chromium')&&p.browsers.includes('webkit')}));
}
async function prepare(cue,ctx){
 if(!supports(cue)||!ctx?.decodeAudioData)throw Error('No certified common mix');
 const key=cue.composite.sha256+':'+ctx.sampleRate;if(cache.has(key))return true;
 if(pending.has(key))return pending.get(key).promise;
 if(Date.now()<(failures.get(key)||0))throw Error('Mix temporarily unavailable');
 const controller=new AbortController(),entry={controller,promise:null};
 const job=(async()=>{
  const response=await fetch(cue.composite.path,{cache:'force-cache',signal:controller.signal});
  if(!response.ok||Number(response.headers.get('content-length')||0)>9e6)throw Error('Mix unavailable');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>9e6)throw Error('Mix too large');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==cue.composite.sha256)throw Error('Mix hash mismatch');
  if(controller.signal.aborted)throw Error('Mix preparation cancelled');
  const buffer=await ctx.decodeAudioData(bytes);
  if(controller.signal.aborted)throw Error('Mix preparation cancelled');
  if(buffer.numberOfChannels!==2||Math.abs(buffer.duration-cue.composite.seconds)>.04)throw Error('Mix decode mismatch');
  let peak=0,overlapPeak=0;
  const lo=Math.ceil(cue.composite.preRoll*buffer.sampleRate),hi=Math.floor((cue.composite.preRoll+cue.composite.nativeHandoffAt)*buffer.sampleRate);
  for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++){
   const value=data[i];if(!finite(value))throw Error('Invalid PCM');peak=Math.max(peak,Math.abs(value));
   if(i>=lo&&i<=hi)overlapPeak=Math.max(overlapPeak,Math.abs(value));
  }}
  // FLAC quantization and decoding can differ by a few least significant bits.
  const declared=Math.max(cue.composite.oversampledPeak,cue.composite.nativeDecoderProof?.rates?.[buffer.sampleRate]?.samplePeak||0);
  if(peak>.9992||overlapPeak>.962||peak>declared+.001)throw Error('Mix peak mismatch');
  cache.set(key,buffer);while(cache.size>2)cache.delete(cache.keys().next().value);
  return true;
 })();entry.promise=job;pending.set(key,entry);
 try{return await job}catch(error){
  if(!controller.signal.aborted){failures.set(key,Date.now()+15000);while(failures.size>4)failures.delete(failures.keys().next().value);}
  throw error;
 }finally{if(pending.get(key)===entry)pending.delete(key)}
}
function cancelPreparation(){for(const job of pending.values())job.controller.abort();pending.clear();}
function stop(reason='cancelled'){
 const act=current;if(!act)return;current=null;clearTimeout(act.timer);
 lastStop={reason,handingOff:act.handingOff,nativeTime:act.old.currentTime,clock:act.ctx.currentTime,
  clockError:act.clockError,contextState:act.ctx.state,paused:act.old.paused,seeking:act.old.seeking};
 try{act.source.stop()}catch(_){}try{act.source.disconnect();act.gain.disconnect()}catch(_){}
 const userMuted=Number(act.app.volume())===0;
 act.old._mbCommonMixMuted=false;act.old.muted=act.wasMuted||userMuted;
 if(act.successor){act.successor._mbCommonMixMuted=false;act.successor.muted=userMuted;}
 for(const [target,event,listener] of act.listeners)target.removeEventListener(event,listener);
}
function latestLaunchTime(cue){
 const c=cue.composite,p=c.sourcePrerollProof,legacy=cue.begin-c.preRoll+.04;
 if(cue.nativeOriginalReturn!==true||p?.method!=='original-only-preroll-with-common-gain-v1'||p.assetSha256!==c.sha256||p.sourceSha!==cue.sourceSha||
    p.sharedGainOnly!==true||p.fromOffsetSeconds!==0||p.sampleRate!==c.sampleRate||
    ![p.frames,p.throughOffsetSeconds,p.maximumReductionDb,p.maximumOriginalWaveformResidual,p.maximumEncodedDifference,p.incomingMaximumPeak].every(finite)||
    !Number.isInteger(p.frames)||p.frames<=0||p.throughOffsetSeconds<=.04||p.throughOffsetSeconds>c.preRoll-.0199||
    Math.abs(p.frames/p.sampleRate-p.throughOffsetSeconds)>.00001||p.maximumReductionDb<0||p.maximumReductionDb>.1||
    p.maximumOriginalWaveformResidual<0||p.maximumOriginalWaveformResidual>2e-6||p.maximumEncodedDifference<0||p.maximumEncodedDifference>2e-6||p.incomingMaximumPeak!==0||
    c.nativeDecoderProof?.assetSha256!==c.sha256||!Array.isArray(c.nativeDecoderProof.sourcePlatformCoverage)||!['linux','darwin'].every(os=>c.nativeDecoderProof.sourcePlatformCoverage.includes(os))||![44100,48000].every(rate=>{const v=c.nativeDecoderProof?.rates?.[rate]?.originalPrerollProof;
     return v?.method==='actual-native-original-preroll-v1'&&v.sourceSha===cue.sourceSha&&v.frames===Math.round(p.throughOffsetSeconds*rate)&&
      finite(v.minimumCorrelation)&&v.minimumCorrelation>=.99&&finite(v.maximumRelativeRms)&&v.maximumRelativeRms>=0&&v.maximumRelativeRms<=.1&&
      Array.isArray(v.browsers)&&v.browsers.length===2&&v.browsers.includes('chromium')&&v.browsers.includes('webkit');}))return legacy;
 return Math.max(legacy,Math.min(cue.begin-.02,cue.begin-c.preRoll+p.throughOffsetSeconds));
}
function tryStart(cue,old,app,toId,ctx){
 const sourceOffset=cue?.nativeOriginalReturn?nativeClockOffset(cue.composite?.nativeSplice?.sourceClock,cue.sourceSha,old?.duration):0;
 if(sourceOffset===null)return false;
 const sourceTime=()=>old.currentTime-sourceOffset;
 const buffer=supports(cue)&&cache.get(cue.composite.sha256+':'+ctx?.sampleRate);
 if(current||!buffer||ctx?.state!=='running'||old?.paused||old.seeking||old.muted||
    root.document?.hidden||app.mixNext?.()?.id!==toId||root.MusicBoxRoom?.isActive?.()||
    app.mixSourceMatches?.(app.currentId(),old)!==true||
    sourceTime()<cue.begin-5||sourceTime()>latestLaunchTime(cue))return false;
 const source=ctx.createBufferSource(),gain=ctx.createGain(),fromId=app.currentId();
 source.buffer=buffer;source.connect(gain);gain.connect(ctx.destination);
 gain.gain.value=outputLevel(app,old);
 let offset=0,started=0;
 const act={source,gain,old,wasMuted:old.muted,ctx,fromId,toId,app,cue,listeners:[],handingOff:false};
 const listen=(target,event,listener)=>{target?.addEventListener?.(event,listener);act.listeners.push([target,event,listener]);};
 const abort=()=>{if(current===act)stop()};
 listen(old,'seeking',()=>{if(!act.handingOff)abort()});listen(old,'pause',()=>{if(!act.handingOff&&!(cue.nativeTailFullBeat&&old.ended))abort()});
 listen(old,'ratechange',()=>{if(!act.handingOff)abort()});
 listen(root.document,'visibilitychange',()=>{if(root.document.hidden)abort()});
 listen(ctx,'statechange',()=>{if(ctx.state!=='running')abort()});
 source.onended=abort;current=act;
 const advance=()=>{
  if(current!==act)return;
  const elapsed=ctx.currentTime-started+offset,post=limit(elapsed-cue.fade,0,.85);
  const position=cue.composite.handoffPosition+post*cue.tempo+(1-cue.tempo)*post*post/1.7+Math.max(0,elapsed-cue.fade-.85);
  const expectedId=act.handingOff?toId:fromId;
  // Once muted, the outgoing media element can switch to a different
  // clock. Its reported drift cannot desynchronize the already rendered
  // common signal: both audible tracks now use this one AudioContext.
  // Seeking, pause, rate/source changes still cancel explicitly, and the
  // incoming native clock must match before its output is revealed.
  act.clockError=sourceTime()-cue.begin-elapsed;
  if(!act.handingOff&&(!Number.isFinite(act.vocalCheckedAt)||ctx.currentTime-act.vocalCheckedAt>.25)){
   act.vocalCheckedAt=ctx.currentTime;if(app.mixVocalCutSafe?.(cue,fromId)===false||root.MusicBoxMix?.contentCutSafe?.(cue,fromId,toId)===false){stop();return;}
  }
  if(ctx.state!=='running'||root.document?.hidden||app.wantsPlayback?.()===false||
     app.currentId()!==expectedId||(!act.handingOff&&((old.paused&&!(cue.nativeTailFullBeat&&old.ended))||old.seeking||app.audio()!==old||
      app.mixNext?.()?.id!==toId))||
     root.MusicBoxRoom?.isActive?.()){stop('playback-state-or-clock-changed');return;}
  gain.gain.setTargetAtTime(outputLevel(app,app.audio()),ctx.currentTime,.025);
  if(!act.handingOff&&elapsed>=cue.composite.nativeHandoffAt){
   act.handingOff=true;
   act.requestedPosition=position;act.requestedAt=ctx.currentTime;
   try{
    const job=app.mixHandoff(toId,position,{muted:true});
    act.successor=app.audio();
    if(!act.successor||!act.successor.muted)throw Error('Silent handoff unavailable');
    Promise.resolve(job).catch(abort);
   }catch(_){stop();return;}
  }
  if(act.handingOff){
   const next=act.successor;
   const targetOffset=cue.nativeOriginalReturn?nativeClockOffset(cue.composite.nativeSplice.targetClock,cue.targetSha,next?.duration):0;
   if(targetOffset===null){if(elapsed>=cue.composite.nativeRevealAt)stop('unknown-native-mp3-clock');else act.timer=setTimeout(advance,20);return;}
   const nativePosition=position+targetOffset;
   // Wait for the app's initial seek to finish, then correct the declared
   // codec priming once. This is a clock conversion, not a user seek.
   if(targetOffset>0&&!act.nativeClockMapped&&next.readyState>=2&&!next.seeking&&!next._mbInitialSeekCleanup){
    act.nativeClockMapped=true;act.correctingSeekTarget=nativePosition;
    try{next.currentTime=nativePosition}catch(_){stop('native-mp3-clock-seek');return;}
    act.timer=setTimeout(advance,20);return;
   }
   if(next!==app.audio()||next.seeking){
    if(elapsed>cue.fade+1.2){stop();return;}
   }else if(next.readyState>=2&&!next.paused&&Math.abs(next.currentTime-nativePosition)<=.065&&elapsed>=cue.composite.nativeRevealAt){
    // Native volume is unreliable on iOS: switch binary mute and stop
    // the common buffer in one JS turn. No simultaneous unattenuated sum.
    next.muted=Number(app.volume())===0;stop();return;
   }else if(next.readyState>=2&&!next.paused&&!next._mbInitialSeekCleanup&&Math.abs(next.currentTime-nativePosition)>.065&&!act.corrected){
    act.corrected=true;act.correctingSeekTarget=nativePosition;try{next.currentTime=nativePosition}catch(_){stop();return;}
   }
   if(elapsed>=cue.composite.seconds-cue.composite.preRoll-.12){stop();return;}
  }
  act.timer=setTimeout(advance,20);
 };
 const launch=()=>{
  if(current!==act)return;
  if(old.paused||old.seeking||app.currentId()!==fromId||app.mixNext?.()?.id!==toId||ctx.state!=='running'||root.document?.hidden||root.MusicBoxRoom?.isActive?.()||app.mixSourceMatches?.(fromId,old)!==true||app.mixVocalCutSafe?.(cue,fromId)===false||root.MusicBoxMix?.contentCutSafe?.(cue,fromId,toId)===false){stop();return;}
  const startAt=cue.begin-cue.composite.preRoll;
  if(sourceTime()<startAt){act.timer=setTimeout(launch,sourceTime()<startAt-.12?35:8);return;}
  if(sourceTime()>latestLaunchTime(cue)){stop('late-start-clock');return;}
  offset=sourceTime()-cue.begin;started=ctx.currentTime;
  try{source.start(started,offset+cue.composite.preRoll);old._mbCommonMixMuted=true;old.muted=true}catch(_){stop();return;}
  act.timer=setTimeout(advance,20);
 };
 launch();return true;
}
function onSeek(reason,audio){
 const act=current;if(!act)return false;
 if(reason!=='user'&&act.handingOff&&audio===act.successor){
  if(!act.initialSeekConsumed&&act.ctx.currentTime-act.requestedAt<1.5&&Math.abs(audio.currentTime-act.requestedPosition)<.10){act.initialSeekConsumed=true;return true;}
  if(Number.isFinite(act.correctingSeekTarget)&&Math.abs(audio.currentTime-act.correctingSeekTarget)<.10){act.correctingSeekTarget=null;return true;}
 }
 stop();return false;
}
root.MusicBoxCompositeMix={supports,prepare,tryStart,stop,cancelPreparation,onSeek,nativeClockOffset,latestLaunchTime,
 isPrepared:(cue,ctx)=>!!ctx&&supports(cue)&&cache.has(cue.composite.sha256+':'+ctx.sampleRate),
 active:()=>!!current,diagnostics:()=>({active:!!current,lastStop}),owns:audio=>!!current&&current.old===audio};
})(typeof window==='undefined'?globalThis:window);
