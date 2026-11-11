/* Optional SHA-verified, genuinely isolated outgoing vocal over next track.
   A Demucs AAC sidecar must exist. This never guesses vocals from the MP3
   or downloads a separation model during playback. Desktop only until
   real-device Safari multi-stream timing is separately certified. */
(function(root){
"use strict";
let index=null,requested=false,prepared=null;
const validHash=x=>/^[a-f0-9]{40}$/.test(String(x||""));
function load(){
 if(requested)return;
 requested=true;
 if(typeof fetch!=="function")return;
 fetch("dj-vocal-stems.json",{cache:"no-cache"})
  .then(r=>r.ok?r.json():null)
  .then(x=>{if(x?.version===1&&x.entries&&typeof x.entries==="object"&&
    !Array.isArray(x.entries))index=x.entries})
  .catch(()=>{});
}
function find(analysis,cue){
 // Only the fully verified measured vocal-underlay tier is eligible.
 // No positive voice evidence, actual matching musical beat, or real
 // Demucs stem -> the existing original-audio protection remains active.
 if(!cue?.voiceConfirmedUnderlay||!cue?.vocalBeatUnderlay||
    !cue?.earlyBeatJoin||!cue?.measuredBeatBridge)return null;
 const sha=String(analysis?.sha||"").toLowerCase();
 if(!validHash(sha))return null;
 const x=index?.[sha];
 if(!x||x.sourceSha!==sha||
    x.separator!=="demucs-htdemucs"||
    x.role!=="isolated-outgoing-vocals"||
    x.path!=="dj-stems/vocals/"+sha+".m4a"||
    ![x.start,x.end,x.sourceDuration,analysis.duration,cue.begin,
      cue.vocalEndAt].every(Number.isFinite)||
    Math.abs(x.sourceDuration-analysis.duration)>.55||
    cue.begin<x.start+.25||cue.vocalEndAt>x.end-.32||
    cue.vocalEndAt<=cue.begin+.3)return null;
 return x;
}
function release(p){
 if(!p)return;
 try{p.audio.pause()}catch(_){}
 try{p.audio.removeAttribute("src");p.audio.load()}catch(_){}
}
function stop(){
 const old=prepared;prepared=null;release(old);
}
function prepare(trackId,analysis,cue){
 const stem=find(analysis,cue);
 if(!stem){stop();return false}
 if(prepared?.trackId===trackId&&prepared.path===stem.path&&
    Math.abs(prepared.cueAt-cue.begin)<.09)return prepared.ready;
 stop();
 const audio=new Audio();
 audio.preload="auto";audio.volume=0;
 const p={trackId,path:stem.path,cueAt:cue.begin,stem,audio,ready:false,failed:false};
 prepared=p;
 const target=Math.max(0,cue.begin-stem.start);
 const update=()=>{
  if(prepared!==p||p.failed||audio.readyState<1||audio.seeking)return;
  if(Math.abs(audio.currentTime-target)>.075)
   try{audio.currentTime=target}catch(_){p.failed=true}
  p.ready=!audio.seeking&&audio.readyState>=2&&
   Math.abs(audio.currentTime-target)<=.22;
 };
 audio.addEventListener("loadedmetadata",update);
 audio.addEventListener("seeked",update);
 audio.addEventListener("canplay",update);
 audio.addEventListener("error",()=>{p.failed=true;p.ready=false});
 audio.src=stem.path;
 try{audio.load()}catch(_){p.failed=true}
 update();
 return p.ready;
}
async function activate(trackId,cue,original){
 const p=prepared;
 if(!p||p.failed||!p.ready||p.trackId!==trackId||
    Math.abs(p.cueAt-cue.begin)>.09||original.paused||original.seeking||
    Math.abs(p.audio.currentTime+p.stem.start-original.currentTime)>.26)
  return null;
 try{
  await p.audio.play();
  if(prepared!==p||original.paused||p.audio.paused||
     p.audio.seeking||p.audio.readyState<2||
     Math.abs(p.audio.currentTime+p.stem.start-original.currentTime)>.16){
   if(prepared===p)prepared=null;release(p);return null;
  }
  prepared=null;
  return p;
 }catch(_){
  if(prepared===p)prepared=null;
  release(p);return null;
 }
}
function levels(progress,secondsFromStart,remainingVoice){
 const fade=Math.min(1,Math.max(0,secondsFromStart/.28));
 const release=Math.min(1,Math.max(0,(.32-remainingVoice)/.32));
 return {
  native:Math.cos(fade*Math.PI/2),
  vocals:.82*Math.sin(fade*Math.PI/2)*Math.cos(release*Math.PI/2),
  backing:Math.min(.90,.36+.44*Math.sin(Math.max(0,Math.min(1,progress))*Math.PI/2))
 };
}
root.MusicBoxVocalStems={load,find,prepare,activate,stop,release,levels};
})(typeof window!=="undefined"?window:globalThis);
