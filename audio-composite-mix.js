/* Bounded, source-bound offline PCM mixes. Safari uses native muted, never
   HTMLMediaElement.volume, to replace the outgoing signal during overlap.
   A missing asset/clock/decoder leaves the ordinary native player available. */
(function(root){
'use strict';
const cache=new Map(),pending=new Map();let current=null;
const finite=Number.isFinite,limit=(n,a,b)=>Math.max(a,Math.min(b,n));
function supports(cue){
 const c=cue?.composite;
 return !!c&&c.version===1&&c.sourceSha===cue.sourceSha&&c.targetSha===cue.targetSha&&
  /^[a-f0-9]{40}$/.test(c.sourceSha)&&/^[a-f0-9]{40}$/.test(c.targetSha)&&
  /^dj-mixes\/[a-f0-9]{64}\.flac$/.test(c.path)&&/^[a-f0-9]{64}$/.test(c.sha256)&&
  [c.seconds,c.peak,c.begin,c.entry,c.fade,c.tempo,c.handoffPosition].every(finite)&&
  c.peak>0&&c.peak<=.961&&c.seconds>=cue.fade+1.4&&c.seconds<=20&&
  ['begin','entry','fade','tempo'].every(k=>Math.abs(c[k]-cue[k])<.0001)&&
  c.pitchPreserved===true&&c.timingVerified===true&&c.renderedFromOriginals===true;
}
async function prepare(cue,ctx){
 if(!supports(cue)||!ctx?.decodeAudioData)throw Error('No certified common mix');
 const key=cue.composite.sha256;if(cache.has(key))return true;
 if(pending.has(key))return pending.get(key);
 const job=(async()=>{
  const response=await fetch(cue.composite.path,{cache:'force-cache'});
  if(!response.ok||Number(response.headers.get('content-length')||0)>9e6)throw Error('Mix unavailable');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>9e6)throw Error('Mix too large');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==key)throw Error('Mix hash mismatch');
  const buffer=await ctx.decodeAudioData(bytes);
  if(buffer.numberOfChannels!==2||Math.abs(buffer.duration-cue.composite.seconds)>.04)throw Error('Mix decode mismatch');
  let peak=0;for(let c=0;c<2;c++)for(const value of buffer.getChannelData(c)){
   if(!finite(value))throw Error('Invalid PCM');peak=Math.max(peak,Math.abs(value));
  }
  // FLAC quantization and decoding can differ by a few least significant bits.
  if(peak>.962||Math.abs(peak-cue.composite.peak)>.003)throw Error('Mix peak mismatch');
  cache.set(key,buffer);while(cache.size>2)cache.delete(cache.keys().next().value);
  return true;
 })();pending.set(key,job);
 try{return await job}finally{pending.delete(key)}
}
function stop(){
 const act=current;if(!act)return;current=null;clearTimeout(act.timer);
 try{act.source.stop()}catch(_){}try{act.source.disconnect();act.gain.disconnect()}catch(_){}
 act.old.muted=act.wasMuted;
 if(act.successor)act.successor.muted=false;
 for(const [target,event,listener] of act.listeners)target.removeEventListener(event,listener);
}
function tryStart(cue,old,app,toId,ctx){
 const buffer=supports(cue)&&cache.get(cue.composite.sha256);
 if(current||!buffer||ctx?.state!=='running'||old?.paused||old.seeking||old.muted||
    root.document?.hidden||app.mixNext?.()?.id!==toId||root.MusicBoxRoom?.isActive?.()||
    old.currentTime<cue.begin-.45||old.currentTime>cue.begin+.065)return false;
 const source=ctx.createBufferSource(),gain=ctx.createGain(),fromId=app.currentId();
 source.buffer=buffer;source.connect(gain);gain.connect(ctx.destination);
 gain.gain.value=limit(Number(app.volume())||0,0,1);
 let offset=0,started=0;
 const act={source,gain,old,wasMuted:old.muted,ctx,fromId,toId,app,cue,listeners:[],handingOff:false};
 const listen=(target,event,listener)=>{target?.addEventListener?.(event,listener);act.listeners.push([target,event,listener]);};
 const abort=()=>{if(current===act)stop()};
 listen(old,'seeking',abort);listen(old,'pause',()=>{if(!act.handingOff)abort()});
 listen(root.document,'visibilitychange',()=>{if(root.document.hidden)abort()});
 listen(ctx,'statechange',()=>{if(ctx.state!=='running')abort()});
 source.onended=abort;current=act;
 const advance=()=>{
  if(current!==act)return;
  const elapsed=ctx.currentTime-started+offset,post=limit(elapsed-cue.fade,0,.85);
  const position=cue.composite.handoffPosition+post*cue.tempo+(1-cue.tempo)*post*post/1.7+Math.max(0,elapsed-cue.fade-.85);
  const expectedId=act.handingOff?toId:fromId;
  if(ctx.state!=='running'||root.document?.hidden||app.wantsPlayback?.()===false||
     app.currentId()!==expectedId||(!act.handingOff&&(old.paused||old.seeking||app.audio()!==old||
      app.mixNext?.()?.id!==toId||Math.abs(old.currentTime-cue.begin-elapsed)>.08))||
     root.MusicBoxRoom?.isActive?.()){stop();return;}
  gain.gain.setTargetAtTime(limit(Number(app.volume())||0,0,1),ctx.currentTime,.025);
  if(!act.handingOff&&elapsed>=cue.fade){
   act.handingOff=true;
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
   }else if(next.readyState>=2&&!next.paused&&Math.abs(next.currentTime-position)<=.065){
    // Native volume is unreliable on iOS: switch binary mute and stop
    // the common buffer in one JS turn. No simultaneous unattenuated sum.
    next.muted=false;stop();return;
   }else if(next.readyState>=2&&!next.paused&&!act.corrected){
    act.corrected=true;try{next.currentTime=position}catch(_){stop();return;}
   }
   if(elapsed>=cue.composite.seconds-.12){stop();return;}
  }
  act.timer=setTimeout(advance,20);
 };
 const launch=()=>{
  if(current!==act)return;
  if(old.paused||old.seeking||app.currentId()!==fromId||app.mixNext?.()?.id!==toId||ctx.state!=='running'||root.document?.hidden){stop();return;}
  if(old.currentTime<cue.begin){act.timer=setTimeout(launch,8);return;}
  if(old.currentTime>cue.begin+.065){stop();return;}
  offset=Math.max(0,old.currentTime-cue.begin);started=ctx.currentTime;
  try{source.start(started,offset);old.muted=true}catch(_){stop();return;}
  act.timer=setTimeout(advance,20);
 };
 launch();return true;
}
root.MusicBoxCompositeMix={supports,prepare,tryStart,stop,active:()=>!!current};
})(typeof window==='undefined'?globalThis:window);
