/* Bounded, source-bound offline PCM mixes. Safari uses native muted, never
   HTMLMediaElement.volume, to replace the outgoing signal during overlap.
   A missing asset/clock/decoder leaves the ordinary native player available. */
(function(root){
'use strict';
const cache=new Map(),pending=new Map(),failures=new Map();let current=null;
const finite=Number.isFinite,limit=(n,a,b)=>Math.max(a,Math.min(b,n));
function supports(cue){
 const c=cue?.composite;
 return !!c&&c.version===1&&c.sourceSha===cue.sourceSha&&c.targetSha===cue.targetSha&&
  /^[a-f0-9]{40}$/.test(c.sourceSha)&&/^[a-f0-9]{40}$/.test(c.targetSha)&&
  /^dj-mixes\/[a-f0-9]{64}\.flac$/.test(c.path)&&/^[a-f0-9]{64}$/.test(c.sha256)&&
  [c.seconds,c.peak,c.overlapPeak,c.oversampledPeak,c.begin,c.entry,c.fade,c.tempo,c.handoffPosition,c.nativeHandoffAt,c.nativeRevealAt].every(finite)&&c.preRoll===.3&&
  c.nativeHandoffAt>=cue.fade-.001&&c.nativeHandoffAt<=cue.fade+.2&&
  c.nativeRevealAt>=c.nativeHandoffAt+1&&c.nativeRevealAt<=c.seconds-c.preRoll-.1&&
  c.peak>0&&c.peak<=.9991&&c.overlapPeak<=.961&&c.oversampledPeak<=1&&c.seconds>=cue.fade+1.7&&c.seconds<=20&&
  ['begin','entry','fade','tempo'].every(k=>Math.abs(c[k]-cue[k])<.0001)&&
  c.pitchPreserved===true&&c.timingVerified===true&&c.renderedFromOriginals===true&&
  (!cue.structuralBeat||c.rhythmVerified===true&&c.postRenderRhythm?.accepted===true);
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
  if(peak>.9992||overlapPeak>.962||peak>cue.composite.oversampledPeak+.001)throw Error('Mix peak mismatch');
  cache.set(key,buffer);while(cache.size>2)cache.delete(cache.keys().next().value);
  return true;
 })();entry.promise=job;pending.set(key,entry);
 try{return await job}catch(error){
  if(!controller.signal.aborted){failures.set(key,Date.now()+15000);while(failures.size>4)failures.delete(failures.keys().next().value);}
  throw error;
 }finally{if(pending.get(key)===entry)pending.delete(key)}
}
function cancelPreparation(){for(const job of pending.values())job.controller.abort();pending.clear();}
function stop(){
 const act=current;if(!act)return;current=null;clearTimeout(act.timer);
 try{act.source.stop()}catch(_){}try{act.source.disconnect();act.gain.disconnect()}catch(_){}
 act.old.muted=act.wasMuted;
 if(act.successor)act.successor.muted=false;
 for(const [target,event,listener] of act.listeners)target.removeEventListener(event,listener);
}
function tryStart(cue,old,app,toId,ctx){
 const buffer=supports(cue)&&cache.get(cue.composite.sha256+':'+ctx?.sampleRate);
 if(current||!buffer||ctx?.state!=='running'||old?.paused||old.seeking||old.muted||
    root.document?.hidden||app.mixNext?.()?.id!==toId||root.MusicBoxRoom?.isActive?.()||
    app.mixSourceMatches?.(app.currentId(),old)!==true||
    old.currentTime<cue.begin-5||old.currentTime>cue.begin-cue.composite.preRoll+.04)return false;
 const source=ctx.createBufferSource(),gain=ctx.createGain(),fromId=app.currentId();
 source.buffer=buffer;source.connect(gain);gain.connect(ctx.destination);
 gain.gain.value=limit(Number(app.volume())||0,0,1);
 let offset=0,started=0;
 const act={source,gain,old,wasMuted:old.muted,ctx,fromId,toId,app,cue,listeners:[],handingOff:false};
 const listen=(target,event,listener)=>{target?.addEventListener?.(event,listener);act.listeners.push([target,event,listener]);};
 const abort=()=>{if(current===act)stop()};
 listen(old,'seeking',abort);listen(old,'pause',()=>{if(!act.handingOff&&!(cue.nativeTailFullBeat&&old.ended))abort()});
 listen(root.document,'visibilitychange',()=>{if(root.document.hidden)abort()});
 listen(ctx,'statechange',()=>{if(ctx.state!=='running')abort()});
 source.onended=abort;current=act;
 const advance=()=>{
  if(current!==act)return;
  const elapsed=ctx.currentTime-started+offset,post=limit(elapsed-cue.fade,0,.85);
  const position=cue.composite.handoffPosition+post*cue.tempo+(1-cue.tempo)*post*post/1.7+Math.max(0,elapsed-cue.fade-.85);
  const expectedId=act.handingOff?toId:fromId;
  if(!act.handingOff&&(!Number.isFinite(act.vocalCheckedAt)||ctx.currentTime-act.vocalCheckedAt>.25)){
   act.vocalCheckedAt=ctx.currentTime;if(app.mixVocalCutSafe?.(cue,fromId)===false){stop();return;}
  }
  if(ctx.state!=='running'||root.document?.hidden||app.wantsPlayback?.()===false||
     app.currentId()!==expectedId||(!act.handingOff&&((old.paused&&!(cue.nativeTailFullBeat&&old.ended))||old.seeking||app.audio()!==old||
      app.mixNext?.()?.id!==toId||Math.abs(old.currentTime-cue.begin-elapsed)>.08))||
     root.MusicBoxRoom?.isActive?.()){stop();return;}
  gain.gain.setTargetAtTime(limit(Number(app.volume())||0,0,1),ctx.currentTime,.025);
  if(!act.handingOff&&elapsed>=cue.composite.nativeHandoffAt){
   act.handingOff=true;
   act.requestedPosition=position;act.requestedAt=ctx.currentTime;
   try{
    const job=app.mixHandoff(toId,position,{muted:true});
    act.successor=app.audio();
    if(!act.successor||act.successor===old||!act.successor.muted)throw Error('Silent handoff unavailable');
    Promise.resolve(job).catch(abort);
   }catch(_){stop();return;}
  }
  if(act.handingOff){
   const next=act.successor;
   if(next!==app.audio()||next.seeking){
    if(elapsed>cue.fade+1.2){stop();return;}
   }else if(next.readyState>=2&&!next.paused&&Math.abs(next.currentTime-position)<=.065&&elapsed>=cue.composite.nativeRevealAt){
    // Native volume is unreliable on iOS: switch binary mute and stop
    // the common buffer in one JS turn. No simultaneous unattenuated sum.
    next.muted=false;stop();return;
   }else if(next.readyState>=2&&!next.paused&&Math.abs(next.currentTime-position)>.065&&!act.corrected){
    act.corrected=true;act.correctingSeekTarget=position;try{next.currentTime=position}catch(_){stop();return;}
   }
   if(elapsed>=cue.composite.seconds-cue.composite.preRoll-.12){stop();return;}
  }
  act.timer=setTimeout(advance,20);
 };
 const launch=()=>{
  if(current!==act)return;
  if(old.paused||old.seeking||app.currentId()!==fromId||app.mixNext?.()?.id!==toId||ctx.state!=='running'||root.document?.hidden||root.MusicBoxRoom?.isActive?.()||app.mixSourceMatches?.(fromId,old)!==true||app.mixVocalCutSafe?.(cue,fromId)===false){stop();return;}
  const startAt=cue.begin-cue.composite.preRoll;
  if(old.currentTime<startAt){act.timer=setTimeout(launch,old.currentTime<startAt-.12?35:8);return;}
  if(old.currentTime>startAt+.04){stop();return;}
  offset=old.currentTime-cue.begin;started=ctx.currentTime;
  try{source.start(started,offset+cue.composite.preRoll);old.muted=true}catch(_){stop();return;}
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
root.MusicBoxCompositeMix={supports,prepare,tryStart,stop,cancelPreparation,onSeek,active:()=>!!current,owns:audio=>!!current&&current.old===audio};
})(typeof window==='undefined'?globalThis:window);
