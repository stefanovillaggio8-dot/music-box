/* Music Box - DJ Mix adattivo. Analisi locale, nessun invio dei file audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
let enabled=true;
try{enabled=localStorage.getItem("mb.djmix")!=="off"}catch(e){/* Storage bloccato */}
const cache=new Map(),pending=new Map(),mixFailures=new Map(),unavailableAnalysis=new Map();
const mobileIntroClips=new Map(),mobileOverlayFailures=new Map(),voiceJobs=new Map();
const mobileClipRetryAt=new Map();let mobileClipFailure=null;
const mobileClipMetrics={ranges:0,fullFetches:0,successes:0,errors:0,method:"",lastError:""};
const STALE_MOBILE_PREVIEW=Symbol("stale mobile intro request");
// Optional DJ work must never delay a real song change or touch offline caches.
let djPlaybackEpoch=0,lastDJTrackChange=0;
const djFetchControllers=new Set();
function abortObsoleteDJWork(){
 djPlaybackEpoch++;lastDJTrackChange=Date.now();
 for(const ctrl of djFetchControllers)try{ctrl.abort()}catch(_){}
 djFetchControllers.clear();
}
let offlineTransferPriority=false;
let deepTransferController=null;
function mobileDJMayWork(){
 return !offlineTransferPriority&&
  (!isIOS||(!document.hidden&&Date.now()-lastDJTrackChange>=5500));
}
// The deep DJ index supplies beat/harmonic cues instantly. Preparing an
// optional Safari overlay can decode a whole MP3 and must NOT run while
// a freshly selected native song is buffering.
function mobileClipWindow(audio) {
 if(!audio||audio.paused||audio.seeking||document.hidden||audio.readyState<3||
    !mobileDJMayWork())return false;
 const remaining=audio.duration-audio.currentTime;
 if(!Number.isFinite(remaining)||remaining>95||remaining<6)return false;
 let ahead=0;
 try{
  for(let i=0;i<audio.buffered.length;i++){
   if(audio.buffered.start(i)<=audio.currentTime+.5&&
      audio.buffered.end(i)>=audio.currentTime)
    ahead=Math.max(ahead,audio.buffered.end(i)-audio.currentTime);
  }
 }catch(_){}
 return audio.readyState>=4||ahead>=3;
}
// A certified 3-5s blend requires the existing vocal/quiet constraints.
// A short matched drum junction without vocal proof is only a subdued
// preview: the native original remains audible to its measured end.
// An iPhone beat overlap must match measured DRUMS and CHORDS, not BPM alone.
// Independent original-MP3 comparison showed similar BPM/chords are not
// enough: 391->1164/598 had -0.16 aligned rhythmic correlation. Require
// the newly measured 4-second drum/onset profiles before any beat overlay.
function onsetPairAgreement(a,b){
 const tail=a?.outroOnset,head=b?.introOnset,n=96;
 if(!Array.isArray(tail)||!Array.isArray(head)||
    tail.length!==n||head.length!==n||
    tail.some(v=>!Number.isFinite(v))||
    head.some(v=>!Number.isFinite(v)))return null;
 const correlate=shift=>{
  let dot=0,xx=0,yy=0,count=0;
  for(let i=0;i<n;i++){
   const j=i+shift;
   if(j<0||j>=n)continue;
   const x=tail[i],y=head[j];
   dot+=x*y;xx+=x*x;yy+=y*y;count++;
  }
  if(count<78||xx<5||yy<5)return null;
  return dot/Math.sqrt(xx*yy);
 };
 const zero=correlate(0);
 if(!Number.isFinite(zero))return null;
 let best=zero,shift=0;
 for(let d=-12;d<=12;d++){
  const score=correlate(d);
  if(Number.isFinite(score)&&score>best){best=score;shift=d}
 }
 // Large resynchronizations and mismatched beats are not DJ transitions.
 return {atZero:zero,best,lagMs:shift*4000/n,
  certified:best>=.49&&zero>=.26&&Math.abs(shift)<=4};
}
function iphoneBeatPairCertified(a,b,cue){
 if(!cue)return false;
 const beatLike=cue.kind==="snap"||cue.kind==="beat"||
  cue.measuredBeatBridge||cue.rhythmicUnderlay||cue.strongBeatBridge;
 if(!beatLike)return true;
 if(cue.pulseUnderlay===true)
  return cue.kind==="snap"&&!!measuredPulseUnderlay(a,b,a?.duration)&&
   Number.isFinite(cue.fade)&&cue.fade>=.62&&cue.fade<=1.04; // neutral quiet fade, not a claimed beat match
 if(!beatWindowContainsAudibleMusic(a,cue))return false;
 if(!a||!b||a.durationMismatch||b.durationMismatch||
    !Number.isFinite(a.bpm)||!Number.isFinite(b.bpm)||
    a.beatConfidence<.20||b.beatConfidence<.20)return false;
 const ratios=[.5,1,2].map(k=>a.bpm/(b.bpm*k));
 const tempo=ratios.reduce((best,r)=>
  Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best);
 if(tempo<.965||tempo>1.035)return false;
 const harmony=similarNotes(a,b),drums=grooveAgreement(a,b);
 if(onsetPairAgreement(a,b)?.certified!==true)return false;
 if(harmony?.matches!==true||!Number.isFinite(harmony.focused)||
    harmony.focused<.79||!Number.isFinite(harmony.phrase)||
    harmony.phrase<.68||
    !(harmony.alignment?.matches===true||
      (!harmony.alignment&&harmony.focused>=.92&&harmony.phrase>=.86)))
  return false;
 if(!drums||drums.score<.82||
    !Number.isFinite(drums.correlation)||drums.correlation<.64)
  return false;
 const key=camelotMatch(a,b);
 if(key.weight>=.14&&key.score<.54)return false;
 return true;
}
// A quiet fade is NOT a beat match. Only crossfade if actual MP3 analysis
// proves the outgoing song is already silent or has a settled musical decay.
// On desktop a beat match needs real rhythmic AND harmonic agreement.
// BPM alone or a quiet outro is not enough to certify any DJ cut.
function desktopBeatPairCertified(a,b,p){
 if(!p)return false;
 if(!["beat","snap","phrase"].includes(p.kind)&&
    !p.measuredBeatBridge&&!p.rhythmicUnderlay&&!p.strongBeatBridge)return true;
 if(p.pulseUnderlay===true)
  return p.kind==="snap"&&!!measuredPulseUnderlay(a,b,a?.duration)&&
   Number.isFinite(p.fade)&&p.fade>=.62&&p.fade<=1.04;
 if(!beatWindowContainsAudibleMusic(a,p))return false;
 if(!a||!b||a.durationMismatch||b.durationMismatch||
    !Number.isFinite(a.bpm)||!Number.isFinite(b.bpm)||
    a.beatConfidence<.20||b.beatConfidence<.20||
    !Number.isFinite(b.introDrive)||b.introDrive<.39)return false;
 const ratios=[.5,1,2].map(k=>a.bpm/(b.bpm*k));
 const speed=ratios.reduce((x,y)=>Math.abs(Math.log2(x))<
  Math.abs(Math.log2(y))?x:y);
 if(!Number.isFinite(speed)||speed<.963||speed>1.037)return false;
 const n=similarNotes(a,b),g=grooveAgreement(a,b);
 if(onsetPairAgreement(a,b)?.certified!==true)return false;
 if(n.matches!==true||!Number.isFinite(n.focused)||n.focused<.79||
    !Number.isFinite(n.phrase)||n.phrase<.68||
    !g||g.score<.80||!Number.isFinite(g.correlation)||
    g.correlation<.60)return false;
 if(n.alignment&&n.alignment.score>0&&
    (!n.alignment.matches||n.alignment.weakest<.52))return false;
 const key=camelotMatch(a,b);
 return key.weight<.14||key.score>=.55;
}
// The raw MP3 audio audit found two "certified" 391->1164/598 bridges
// whose proposed mix STARTS AFTER the source music stopped (128.94s vs
// 127.3s). Similar global notes and RMS grooves are not actual beat joins.
function beatWindowContainsAudibleMusic(a,cue){
 if(!a||!cue||!Number.isFinite(a.last)||
    !Number.isFinite(cue.begin)||!Number.isFinite(cue.end)||
    cue.end<=cue.begin||cue.begin<0)return false;
 // Do not play a beat-match in encoded silence or after a long musical
 // decay. Allow 350ms for 100ms RMS-window measurement uncertainty.
 if(cue.end>a.last+.35)return false;
 const fade=cue.end-cue.begin;
 const audible=Math.min(cue.end,a.last)-cue.begin;
 const needed=cue.kind==="snap"?
   Math.min(.48,fade*.55):
   Math.min(1.8,Math.max(1.1,fade*.45));
 return audible>=needed;
}
function iphoneQuietReleaseCertified(a,cue){
 if(!cue)return false;
 if(!["soft","fade","rise"].includes(cue.kind))return true;
 if(!a||cue.quietCertified!==true||a.protectedEnding===true||
    !Number.isFinite(cue.begin)||!Number.isFinite(cue.end))return false;
 const digital=Boolean(a.confidentTail===true&&
   Number.isFinite(a.last)&&cue.begin>=a.last-.35);
 const gap=Boolean(a.outroGap&&
   Number.isFinite(a.outroGap.start)&&Number.isFinite(a.outroGap.end)&&
   cue.begin>=a.outroGap.start&&cue.end<=a.outroGap.end+.15);
 const release=a.dropRelease;
 const decayed=Boolean(release&&
   Number.isFinite(release.releaseAt)&&release.releaseAt<=cue.begin-.3&&
   Number.isFinite(release.quietLevel)&&release.quietLevel<=.15&&
   Number(release.score)>=.76&&
   (!Number.isFinite(a.lastVoiceAt)||a.lastVoiceAt<=cue.begin-1.4)&&
   (!Number.isFinite(a.lastLyricAt)||a.lastLyricAt<=cue.begin-4));
 return digital||gap||decayed;
}
// A failed strict beatmatch must not erase a VERIFIED, already-decaying
// outro. Use a neutral overlap only after the final impact has fallen away.
// This never certifies two unrelated drum patterns as the same beat.
function certifiedNeutralBridge(a,b,dur){
 const release=a?.dropRelease;
 if(!release||!a||!b||a.durationMismatch||b.durationMismatch||
    a.protectedEnding===true||!Number.isFinite(a.duration)||
    !Number.isFinite(dur)||Math.abs(a.duration-dur)>1.5||
    !Number.isFinite(a.last)||!Number.isFinite(release.releaseAt)||
    !Number.isFinite(release.lastImpactAt)||release.score<.78||
    release.quietLevel>.15||a.last-release.releaseAt<2.9||
    release.releaseAt<release.lastImpactAt||
    !hasImmediateMusicalIntro(b)||b.introDrive<.36||
    (Number.isFinite(a.lastLyricAt)&&
     a.lastLyricAt>release.releaseAt-4)||
    (Number.isFinite(a.lastVoiceAt)&&
     a.lastVoiceAt>release.releaseAt-2.5)||
    (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<1.8)||
    (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<1.8))
   return null;
 const end=Math.min(dur-.04,a.last+.07);
 const begin=Math.max(release.releaseAt+.4,end-4.8,
   Number.isFinite(a.lastLyricAt)?a.lastLyricAt+4:0,
   Number.isFinite(a.lastVoiceAt)?a.lastVoiceAt+1.8:0);
 const fade=end-begin;
 if(!Number.isFinite(fade)||fade<2.35||fade>5||
    begin<20||end-begin<=0)return null;
 const trim=a.confidentTail===true&&dur-a.last>=1.65;
 return {kind:"soft",begin,end,fade,
  entry:musicalIntroEntry(b),tempo:1,gain:1,score:null,
  quietCertified:true,neutralRelease:true,
  safeOutroAt:begin,verifiedDecayAfterLyrics:true,
  decayReleaseAt:release.releaseAt,
  silenceTrim:trim,trailing:trim?dur-end:0,
  preserveTail:true,softTailTrim:false};
}
function mobileMixAllowed(plan,ending,lastLyricAt) {
 if(!plan||!Number.isFinite(plan.begin)||!Number.isFinite(plan.end)||
    plan.end<=plan.begin)return false;
 if(plan.rhythmicUnderlay&&plan.measuredBeatBridge&&plan.preserveTail){
  // Low-volume unverified overlay: never duck the native Safari player.
  return !!ending&&Number.isFinite(ending.duration)&&
   Math.abs(ending.duration-plan.end)<13&&
   plan.grooveScore>=.77&&plan.score>=50&&
   (plan.kind==="snap"?plan.fade>=.60&&plan.fade<=1.06:
    plan.kind==="beat"&&plan.vocalVerifiedBeat===true)&&
   (!Number.isFinite(lastLyricAt)||lastLyricAt<=plan.begin-4)&&
   (!Number.isFinite(ending.lastVoiceAt)||
    ending.lastVoiceAt<=plan.begin-2.5);
 }
 if(plan.kind==="snap"){
  if(!plan.measuredBeatBridge||plan.fade<.46)return false;
  if(plan.voiceVerifiedMicroBridge)return true;
  return plan.fade<=.86&&plan.preserveTail===true&&
   plan.grooveScore>=.76&&plan.score>=70&&
   !!ending&&ending.protectedEnding!==true&&
   (!Number.isFinite(lastLyricAt)||lastLyricAt<=plan.begin-4)&&
   (!Number.isFinite(ending.lastVoiceAt)||
     ending.lastVoiceAt<=plan.begin-2.5);
 }
 return ["beat","soft","fade","rise"].includes(plan.kind)&&
  plan.fade>=(plan.kind==="beat"?3.5:2.35)&&
  plan.quietCertified===true&&Number.isFinite(plan.safeOutroAt);
}
function rememberMobileClip(key,decoded,info){
 if(!isIOS||!decoded||!info)return;
 try{
  const rate=decoded.sampleRate;
  // The actual first musical beat can be later than the digital silence.
  // Keep it within the bounded decoded preview.
  const start=Math.max(0,musicalIntroEntry(info)-.2);
  const offset=Math.floor(start*rate);
  // Longer bounded preview covers delayed Safari startup.
   const count=Math.min(Math.floor(14*rate),decoded.length-offset);
  if(count<rate*4)return;
  const channels=[];
  for(let c=0;c<Math.min(2,decoded.numberOfChannels);c++)
   channels.push(new Float32Array(decoded.getChannelData(c).subarray(offset,offset+count)));
  if(!channels.length)return;
  mobileIntroClips.delete(key);
  mobileIntroClips.set(key,{start,rate,channels});
  while(mobileIntroClips.size>1)mobileIntroClips.delete(mobileIntroClips.keys().next().value);
 }catch(e){} // Do not compromise the normal player
}

// Persist only lightweight analysis measurements (never MP3 data). Keep the
// storage separate from Music Box audio caches and tolerate private browsing.
const ANALYSIS_VERSION=29; // start mismatched neutral fades at measured release, not near playback end
// Serial decoding keeps Safari from allocating multiple full-song PCM buffers.
let mobileDecodeQueue=Promise.resolve();
let analysisDbPromise=null;
function analysisDatabase(){
 if(analysisDbPromise)return analysisDbPromise;
 if(typeof indexedDB==="undefined")return Promise.resolve(null);
 analysisDbPromise=new Promise(resolve=>{
  try{
   const req=indexedDB.open("musicbox-dj-analysis",1);
   req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains("records")){
     const store=db.createObjectStore("records",{keyPath:"url"});
     store.createIndex("when","when");
    }
   };
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>resolve(null);
   req.onblocked=()=>resolve(null);
  }catch(e){resolve(null)}
 });
 return analysisDbPromise;
}
// Deep DJ index measures real MP3 audio in bounded cloud batches.
// New or offline songs still fall back to local waveform analysis.
let deepIndex=null,deepIndexPromise=null,deepRetryAfter=0,deepRetryTimer=null,deepLoadFailures=0;
function deepLookup(track){
 if(!deepIndex||!track)return null;
 const raw=String(track.file||track.url||"");
 const path=raw.match(/(?:^|\/)(songs\/[A-Za-z0-9/_-]+\.mp3)(?:[?#]|$)/i)?.[1];
 if(!path)return null;
 const keys=/\/music-box\/(?:mobile-audio|refs\/heads\/mobile-audio)\//.test(raw)?
   ["mobile/"+path,"audio/"+path,"app/"+path]:
   ["audio/"+path,"mobile/"+path,"app/"+path];
 for(const key of keys){
  const value=deepIndex.entries?.[key];
  if(value?.status==="ok"&&/^(librosa-onsets-chroma-rms-v1|librosa-onsets-chroma-rms-v2)$/.test(value.analyzer||"")&&
     Number.isFinite(value.duration)&&value.duration>=26&&
     Array.isArray(value.chroma)&&value.chroma.length===12)return value;
 }
 return null;
}
// The full real-audio index provides comparable beat/harmony measurements.
// Carry only vocal safety data from an older local decoded copy.
function withValidatedVoice(deep,local){
 if(!deep)return local||null;
 if(!local?.voiceModel||!Number.isFinite(local.duration)||
    Math.abs(local.duration-deep.duration)>=1)return deep;
 return {...deep,lastVoiceAt:local.lastVoiceAt,firstVoiceAt:local.firstVoiceAt,
  voiceModel:local.voiceModel,voiceModelVersion:local.voiceModelVersion,
  lastVoiceConfidence:local.lastVoiceConfidence,
  firstVoiceConfidence:local.firstVoiceConfidence,
  voiceIntervals:local.voiceIntervals,
  voiceScannedFrom:local.voiceScannedFrom,voiceScannedEnd:local.voiceScannedEnd};
}
function deepStatus(){
 const count=Number(deepIndex?.analyzed)||0,total=Number(deepIndex?.sourceCount)||0;
 const el=$("mixDeepStatus");
 if(el)el.textContent=total?
   "Audio reale analizzato: "+count+"/"+total+" brani. I nuovi MP3 vengono elaborati progressivamente; gli altri usano il controllo locale.":
   "Indice audio avanzato in preparazione. Intanto Music Box analizza localmente le transizioni.";
}
// A large real-audio index must survive slow Safari connections and retry
// independently of the native HTML audio player's buffering.
function scheduleDeepIndexRetry(delay){
 if(deepRetryTimer!==null)return;
 deepRetryTimer=setTimeout(()=>{
  deepRetryTimer=null;
  if(!enabled)return;
  if(document.hidden){scheduleDeepIndexRetry(15000);return}
  loadDeepIndex().catch(()=>{});
 },Math.max(1000,delay));
}
function loadDeepIndex(force=false){
 if(offlineTransferPriority||bridge()?.offlineBusy?.())return Promise.resolve(deepIndex);
 if(deepIndexPromise)return deepIndexPromise;
 if(deepIndex&&!force)return Promise.resolve(deepIndex);
 if(!force&&Date.now()<deepRetryAfter)return Promise.resolve(deepIndex);
 const job=(async()=>{
  // The index is several megabytes: six seconds is not enough on mobile.
  // Revalidate cached metadata, rather than forcing another complete
  // download every fifteen minutes when nothing changed.
  const ctrl=new AbortController();
  deepTransferController=ctrl;
  // A 5.3 MB index cannot arrive in 25 seconds over a 0.1 MB/s link.
  const timeout=setTimeout(()=>ctrl.abort(),isIOS?180000:60000);
  try{
   const resp=await fetch("dj-deep-analysis.json",{
    cache:"no-cache",signal:ctrl.signal
   });
   if(!resp.ok)throw Error("Indice DJ non disponibile");
   const json=await resp.json();
   if(![1,2].includes(json?.version)||!json.entries||
      typeof json.entries!=="object")
    throw Error("Schema DJ non valido");
   deepIndex=json;
   deepLoadFailures=0;deepRetryAfter=0;
   if(deepRetryTimer!==null){
    clearTimeout(deepRetryTimer);deepRetryTimer=null;
   }
   if(enabled&&!mixing){
    // A late index must reopen a search that previously had no candidates.
    plannedFor="";plan=null;
    shuffleGeneration++;shuffleBusy=false;
    shuffleRunFor="";shuffleRetryAt=0;shuffleAttempts=0;
   }
  }catch(error){
   if(offlineTransferPriority||bridge()?.offlineBusy?.())return deepIndex;
   deepLoadFailures++;
   const delay=Math.min(120000,15000*Math.pow(2,
    Math.min(3,deepLoadFailures-1)));
   deepRetryAfter=Date.now()+delay;
   if(!deepIndex&&enabled)scheduleDeepIndexRetry(delay+250);
  }finally{
   clearTimeout(timeout);
   if(deepTransferController===ctrl)deepTransferController=null;
   deepStatus();
  }
  return deepIndex;
 })();
 deepIndexPromise=job;
 job.finally(()=>{if(deepIndexPromise===job)deepIndexPromise=null})
    .catch(()=>{});
 return job;
}

function canSaveAnalysis(source){
 // No tokens, signed URLs, local connection credentials or cloud sessions.
 return typeof source==="string"&&source.length<1024&&
   (source.startsWith("https://raw.githubusercontent.com/stefanovillaggio8-dot/") ||
    /^songs\/[a-z0-9_-]+\.mp3$/i.test(source));
}
async function savedAnalysis(source){
 if(!canSaveAnalysis(source))return null;
 const db=await analysisDatabase();if(!db)return null;
 return new Promise(resolve=>{
  try{
   const req=db.transaction("records","readonly").objectStore("records").get(source);
   req.onsuccess=()=>{
    const item=req.result;
    if(!item||item.version!==ANALYSIS_VERSION||Date.now()-item.when>7*86400000||!item.data||
       !Number.isFinite(item.data.bpm)||!Number.isFinite(item.data.duration))
      return resolve(null);
    resolve(item.data);
   };
   req.onerror=()=>resolve(null);
  }catch(e){resolve(null)}
 });
}
async function saveAnalysis(source,data){
 if(!canSaveAnalysis(source))return;
 const db=await analysisDatabase();if(!db)return;
 try{
  const tx=db.transaction("records","readwrite");
  const store=tx.objectStore("records");
  store.put({url:source,when:Date.now(),version:ANALYSIS_VERSION,data});
  // Limit the cache by age to avoid consuming significant device storage.
  const count=store.count();
  count.onsuccess=()=>{
   let excess=Math.max(0,count.result-60);
   if(!excess)return;
   const cursor=store.index("when").openCursor();
   cursor.onsuccess=()=>{
    const item=cursor.result;
    if(!item||excess<=0)return;
    item.delete();excess--;item.continue();
   };
  };
 }catch(e){/* Quota or storage denied: in-memory analysis still works */}
}

const allowedStyles=new Set(["auto","fade","rise"]);
let style="auto",mixSeconds=6,mobileOverlayEnabled=true;
try{
 const stored=localStorage.getItem("mb.mixStyle");
 if(allowedStyles.has(stored))style=stored;
 mobileOverlayEnabled=localStorage.getItem("mb.mixIphone")!=="off";
 const secs=Number(localStorage.getItem("mb.mixSeconds"));
 if(Number.isFinite(secs)&&secs>=3&&secs<=12)mixSeconds=secs;
}catch(e){}
const KEY_NAMES=["Do","Do♯","Re","Mi♭","Mi","Fa","Fa♯","Sol","La♭","La","Si♭","Si"];
let active=null,previousId="",plan=null,plannedFor="",mixing=false,boundAudio=null;
function bridge(){return window.MusicBoxBridge}

// Precomputed librosa features do not contain speech detections. Analyze
// ONLY the currently playing / queued song in the browser, never the full
// shuffle catalog. This is a separate, bounded and cancellable task.
const voiceRetry=new Map();
function voiceIsRelevant(track){
 const app=bridge();
 return track?.id!=null&&app&&
  (app.currentId?.()===track.id||app.mixNext?.()?.id===track.id);
}
// Optional speech inference is not allowed to compete with the timed mix.
function mayScanDesktopVoice(app,track){
 const audio=app?.audio?.();
 return Boolean(app?.currentId?.()===track?.id&&audio&&
  !audio.paused&&!audio.seeking&&Number.isFinite(audio.duration)&&
  audio.duration-audio.currentTime>75&&!mixing&&!active);
}
function scheduleDeepVoice(track,key,data){
 const app=bridge();
 const voice=window.MusicBoxVocal,net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 if(!enabled||isIOS||!voice?.analyze||!voiceIsRelevant(track)||document.hidden||
   !mayScanDesktopVoice(app,track)||
   voiceJobs.has(key)||voiceJobs.size>=1||Date.now()<(voiceRetry.get(key)||0)||
   net?.saveData||/^(slow-)?2g$|^3g$/i.test(String(net?.effectiveType||"")))return;
 const job=(async()=>{
  // A new track receives time to start playback and plan its transition.
  await new Promise(resolve=>setTimeout(resolve,4500));
  if(!enabled||document.hidden||!mayScanDesktopVoice(bridge(),track))return;
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),35000);
  let context=null;
  try{
   const response=await fetch(key,{mode:"cors",cache:"force-cache",signal:abort.signal});
   const limit=isIOS?12000000:25000000;
   if(!response.ok||Number(response.headers.get("content-length")||0)>limit)return;
   let bytes;
   if(response.body?.getReader){
    const reader=response.body.getReader(),chunks=[];let length=0;
    while(true){
     const part=await reader.read();if(part.done)break;
     length+=part.value.length;
     if(length>limit){await reader.cancel();return}
     chunks.push(part.value);
    }
    bytes=new Uint8Array(length);let off=0;
    for(const part of chunks){bytes.set(part,off);off+=part.length}
   }else{
    const raw=await response.arrayBuffer();if(raw.byteLength>limit)return;
    bytes=new Uint8Array(raw);
   }
   if(document.hidden||!voiceIsRelevant(track))return;
   const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
   const Live=window.AudioContext||window.webkitAudioContext;
   if(Offline)try{context=new Offline(1,1,44100)}catch(e){}
   if(!context&&Live)context=new Live();
   if(!context)return;
   const decoded=await context.decodeAudioData(bytes.buffer);
   if(Math.abs(decoded.duration-data.duration)>Math.max(5,data.duration*.045))return;
   const found=await voice.analyze(decoded,{last:data.last});
   if(!found||document.hidden)return;
   const previous=cache.get(key);
   if(!previous||Math.abs(previous.duration-data.duration)>1)return;
   const enriched={...previous,
    lastVoiceAt:found.lastVoiceAt,firstVoiceAt:found.firstVoiceAt,
    lastVoiceConfidence:found.lastVoiceConfidence,
    firstVoiceConfidence:found.firstVoiceConfidence,
    voiceIntervals:found.voiceIntervals,
    voiceModel:found.source,voiceModelVersion:found.modelVersion,
    voiceScannedEnd:found.scannedEnd,voiceScannedFrom:found.scannedFrom};
   cache.set(key,enriched);saveAnalysis(key,enriched).catch(()=>{});
   const app=bridge(),current=app?.currentId?.()===track.id,
     next=app?.mixNext?.()?.id===track.id;
   if(voiceThreatensPlan(found,current,next,plan)&&(active||mobileActive))cancel();
   if((current||next)&&!mixing&&!active&&!mobileActive){plannedFor="";plan=null;}
   if(current)rearmShuffleAfterVocalScan(track.id);
  }catch(e){/* Optional vocal scan must never interrupt native playback */}
  finally{
   clearTimeout(timeout);
   if(context?.close)try{await context.close()}catch(e){}
   voiceRetry.set(key,Date.now()+8*60000);
   if(voiceRetry.size>40)voiceRetry.delete(voiceRetry.keys().next().value);
  }
 })();
 voiceJobs.set(key,job);
 job.finally(()=>{if(voiceJobs.get(key)===job)voiceJobs.delete(key)}).catch(()=>{});
}

function toast(m){bridge()?.toast?.(m)}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}

function spectrumAt(data,rate,at){
 const N=2048,from=Math.floor(at*rate-N/2);
 if(from<0||from+N>data.length)return null;
 const re=new Float32Array(N),im=new Float32Array(N);
 for(let i=0;i<N;i++)re[i]=data[from+i]*(.5-.5*Math.cos(2*Math.PI*i/(N-1)));
 fft(re,im);
 let total=0,logs=0,bass=0,n=0;
 const hi=Math.min(N/2,Math.ceil(5000*N/rate));
 for(let k=Math.max(2,Math.ceil(45*N/rate));k<hi;k++){
  const power=re[k]*re[k]+im[k]*im[k]+1e-16;
  total+=power;logs+=Math.log(power);n++;
  if(k*rate/N<=250)bass+=power;
 }
 if(!n||total<1e-8)return null;
 return {flat:Math.exp(logs/n)/(total/n),bass:bass/total};
}
function estimateMusicalEnd(data,rate,blocks,typical,duration,audibleEnd){
 const blockSeconds=.2,limit=Math.max(20,duration-16);
 const quiet=clamp(typical*.055,.0007,.012); // Keep truly quiet notes and vocals
 let i=blocks.length-1;
 while(i>=0&&(blocks[i]||0)<=quiet)i--;
 const quietStart=(i+1)*blockSeconds;
 let end=audibleEnd,why="silence";
 if(duration-quietStart>=1.9&&quietStart>limit)
  end=Math.min(end,quietStart+.12);
 // A rumbling, low-pitched or broadband tail with little energy is often
 // ambient noise, rather than music. Require a sustained tail.
 const samples=[];
 for(let t=Math.max(limit,.5);t<duration-.1;t+=.5){
  const pos=Math.max(0,Math.floor((t-.25)/blockSeconds));
  const nearby=blocks.slice(pos,Math.min(blocks.length,pos+3));
  const rms=nearby.length?Math.sqrt(nearby.reduce((a,x)=>a+x*x,0)/nearby.length):0;
  const spec=spectrumAt(data,rate,t);
  samples.push({t,rms,flat:spec?.flat??0,bass:spec?.bass??0});
 }
 let from=duration;
 for(let j=samples.length-1;j>=0;j--){
  const x=samples[j],silent=x.rms<=quiet;
  const noisy=x.rms<typical*.30&&x.flat>.68; // Bass and tonal fade-outs are real music
  if(!silent&&!noisy)break;
  from=x.t;
 }
 if(duration-from>=2.5&&from>limit&&from<end){
  end=Math.min(end,from+.15);why="ambience";
 }
 // Never skip a long central interlude or more than 14 seconds.
 if(end<Math.max(duration-14,duration*.55,18))
  return {end:audibleEnd,reason:"none"};
 return {end,reason:end<audibleEnd-.5?why:"silence"};
}
function weakOutro(blocks,level,duration){
 if(duration<34||level<.009)return null;
 const step=.2,cut=Math.floor((duration-7.5)/step);
 let last=-1;
 for(let i=Math.floor(Math.max(18,duration-32)/step);i<cut;i++)
  if(blocks[i]>level*.35)last=i;
 if(last<0)return null;
 const start=(last+1)*step,tail=blocks.slice(last+1);
 if(duration-start<7.5||duration-start>31||tail.length<30)return null;
 const avg=tail.reduce((a,b)=>a+b,0)/tail.length;
 if(avg>level*.09||Math.max(...tail)>level*.17)return null;
 const before=blocks.slice(Math.max(0,last-30),last+1);
 if(before.filter(v=>v>level*.33).length<before.length*.4)return null;
 return {start,fadeStart:start+2.1,end:Math.min(duration-.2,start+6)};
}
// A long near-silent *gap* near the end is different from a silent
// ending: a faint ambient outro can resume after the gap. Detect it from
// the whole song and require the later section to remain much quieter
// than the earlier music. Strong returns are always protected.
function lateOutroGap(blocks,typical,duration){
 if(duration<65||typical<.008||!Array.isArray(blocks))return null;
 const step=.2,startIndex=Math.floor(Math.max(35,duration-43)/step);
 const limit=Math.min(blocks.length,Math.floor((duration-5)/step));
 const threshold=Math.max(.00065,typical*.19);
 const runs=[];let begin=-1;
 for(let i=startIndex;i<=limit;i++){
  const quiet=i<limit&&(blocks[i]||0)<threshold;
  if(quiet&&begin<0)begin=i;
  if(!quiet&&begin>=0){
   if(i-begin>=35)runs.push({from:begin,to:i});
   begin=-1;
  }
 }
 for(const gap of runs.reverse()){
  const start=gap.from*step,quietEnd=gap.to*step;
  const before=blocks.slice(Math.max(0,gap.from-32),gap.from);
  if(before.length<18||
     before.filter(v=>v>typical*.43).length<Math.ceil(before.length*.48))continue;
  const remaining=duration-quietEnd;
  if(remaining<1.5||remaining>20)continue;
  const after=blocks.slice(gap.to);
  if(!after.length)continue;
  const sorted=after.slice().sort((a,b)=>a-b);
  const upper=sorted[Math.floor(sorted.length*.89)]||0;
  const average=after.reduce((sum,v)=>sum+v,0)/after.length;
  // Don't suppress a returned verse, drop or chorus.
  if(upper>typical*.50||average>typical*.33||
     after.filter(v=>v>typical*.44).length>after.length*.12)continue;
  const fadeStart=Math.max(0,start-1.3);
  const end=Math.min(duration-1.0,start+3.2);
  if(end-fadeStart<3.1)continue;
  return {start,quietEnd,fadeStart,end,lateMean:average/typical};
 }
 return null;
}
// Some songs go quiet for 10-25 seconds and then return briefly with
// strong audio. Record the pause as a CANDIDATE, never automatically skip it:
// its last passage is protected until karaoke/voice analysis confirms that
// the returning section has no singing to preserve.
function lateOutroBreak(blocks,typical,duration){
 if(duration<65||typical<.008||!Array.isArray(blocks))return null;
 const step=.2,from=Math.floor(Math.max(40,duration-44)/step);
 const until=Math.min(blocks.length,Math.floor((duration-4)/step));
 const threshold=Math.max(.00065,typical*.18);
 let begin=-1;const gaps=[];
 for(let i=from;i<=until;i++){
  const quiet=i<until&&(blocks[i]||0)<threshold;
  if(quiet&&begin<0)begin=i;
  else if(!quiet&&begin>=0){
   if(i-begin>=45)gaps.push({start:begin*step,quietEnd:i*step,index:begin,finish:i});
   begin=-1;
  }
 }
 for(const gap of gaps.reverse()){
  const remaining=duration-gap.quietEnd;
  if(remaining<4||remaining>13.5)continue;
  const before=blocks.slice(Math.max(0,gap.index-32),gap.index);
  if(before.length<18||
     before.filter(v=>v>typical*.44).length<before.length*.47)continue;
  const after=blocks.slice(gap.finish);
  const loud=after.filter(v=>v>typical*.44).length;
  // This is a genuine strong comeback, not the softer outro already
  // handled by lateOutroGap. Voice/lyrics must approve any skipping.
  if(loud<after.length*.33)continue;
  return {start:gap.start,quietEnd:gap.quietEnd,
    fadeStart:Math.max(0,gap.start-1.3),
    end:Math.min(duration-1,gap.start+3.2),
    resumedSeconds:remaining};
 }
 return null;
}
// Energy rhythm signature sampled on the BPM grid. We compare the last
// eight beats of A with the first eight beats of B, allowing cyclic phase
// shifts. This is a timbral/rhythmic match, not a silent-tail detector.
function beatEnergySignature(blocks,bpm,at,endAligned=false){
 if(!Array.isArray(blocks)||!(bpm>=55&&bpm<=210))return null;
 const beat=60/bpm,span=beat*8;
 const begin=endAligned?at-span:at;
 if(begin<0||begin+span>blocks.length*.2+.15)return null;
 const values=[];
 for(let i=0;i<32;i++){
  const time=begin+(i+.5)*span/32;
  const pos=Math.max(0,Math.min(blocks.length-1,Math.floor(time/.2)));
  values.push(blocks[pos]||0);
 }
 const mean=values.reduce((sum,v)=>sum+v,0)/32;
 const variance=values.reduce((sum,v)=>sum+(v-mean)**2,0)/32;
 const sd=Math.sqrt(variance);
 if(mean<.003||sd<mean*.13)return null;
 return values.map(v=>clamp((v-mean)/sd,-3,3));
}
function grooveAgreement(a,b){
 const tail=a?.outroGroove,head=b?.introGroove;
 if(!Array.isArray(tail)||!Array.isArray(head)||
    tail.length!==32||head.length!==32)return null;
 let high=-1,phase=0;
 for(let shift=0;shift<8;shift++){
  let dot=0,aa=0,bb=0;
  for(let i=0;i<32;i++){
   const x=tail[i],y=head[(i+shift)%32];
   dot+=x*y;aa+=x*x;bb+=y*y;
  }
  const corr=dot/Math.sqrt(Math.max(1e-8,aa*bb));
  if(corr>high){high=corr;phase=shift}
 }
 return {score:clamp((high+1)/2,0,1),phase,correlation:high};
}
// Find a *musical* release following the final substantial hit. This is
// deliberately different from matching the two silent ends. Never treat a
// loud closing beat, last sung phrase, or re-attack as expendable.
function findDropRelease(blocks,level,musicalEnd,duration){
 if(!Array.isArray(blocks)||!Number.isFinite(level)||level<.006||
    !Number.isFinite(musicalEnd)||musicalEnd<26)return null;
 const step=.2,lo=Math.max(0,Math.floor((musicalEnd-17)/step));
 const hi=Math.min(blocks.length-1,Math.ceil(musicalEnd/step)-1);
 let lastStrong=-1;
 const strong=Math.max(.004,level*.61);
 for(let i=lo;i<=hi;i++)if((blocks[i]||0)>=strong)lastStrong=i;
 if(lastStrong<lo)return null;
 const afterStart=lastStrong+1,releaseAt=afterStart*step+.35;
 const tail=blocks.slice(afterStart,hi+1);
 const seconds=musicalEnd-releaseAt;
 if(seconds<2.15||seconds>12||tail.length<10)return null;
 const average=x=>x.reduce((a,b)=>a+b,0)/Math.max(1,x.length);
 const third=Math.max(3,Math.floor(tail.length/3));
 const firstAvg=average(tail.slice(0,third));
 const lastAvg=average(tail.slice(-third));
 const finalAvg=average(tail.slice(-Math.min(5,tail.length)));
 const peak=Math.max(...tail),mean=average(tail);
 // A decreasing musical release is useful even if it has audible reverb.
 // Reject loud re-attacks, sustained singers and non-decreasing endings.
 if(!(firstAvg>.001&&lastAvg<=firstAvg*.59&&
      finalAvg<=level*.16&&lastAvg<=level*.24&&
      peak<=level*.70&&mean<=level*.40))return null;
 return {lastImpactAt:lastStrong*step,releaseAt,seconds,
  quietLevel:mean/Math.max(level,.001),score:Math.max(0,1-mean/level)};
}
function drivenIntro(blocks,level,first){
 if(!Array.isArray(blocks)||!Number.isFinite(level)||level<.003)return 0;
 const lo=Math.max(0,Math.floor(first/.2)),hi=Math.min(blocks.length,lo+23);
 const slice=blocks.slice(lo,hi);
 if(slice.length<8)return 0;
 const average=slice.reduce((s,x)=>s+x,0)/slice.length;
 const active=slice.filter(x=>x>=level*.28).length/slice.length;
 return clamp((average/level)*.60+active*.40,0,1);
}

function analyzeFrames(buf){
 const ch=buf.getChannelData(0),rate=buf.sampleRate,step=.025;
 // Detect energy on both stereo channels: a quiet left channel must not
 // make an audible right-channel vocal or instrumental ending disappear.
 const right=buf.numberOfChannels>1?buf.getChannelData(1):null;
 const hop=Math.max(1,Math.round(rate*step)),energy=[];
 // Analisi del segnale reale: non ci fidiamo della durata dell'MP3, che
 // può contenere molti secondi di silenzio iniziale e finale.
 for(let pos=0;pos<ch.length;pos+=hop){
  let sum=0,n=0;const end=Math.min(ch.length,pos+hop);
  for(let i=pos;i<end;i+=4){
   sum+=right?(ch[i]*ch[i]+right[i]*right[i])*.5:ch[i]*ch[i];
   n++;
  }
  energy.push(Math.sqrt(sum/Math.max(1,n)));
 }
 // Finestre da 200ms: ignorano singoli clic, transienti o fruscii isolati.
 const group=8,blocks=[];
 for(let i=0;i<energy.length;i+=group){
  let sum=0,n=0;
  for(let j=i;j<Math.min(i+group,energy.length);j++){sum+=energy[j]*energy[j];n++}
  blocks.push(Math.sqrt(sum/Math.max(1,n)));
 }
 const ordered=blocks.slice().sort((a,b)=>a-b);
 const typical=ordered[Math.floor(ordered.length*.9)]||0;
 // I finali possono contenere rumore tenue o riverbero: confronta con
 // il livello tipico del brano, senza richiedere silenzio digitale assoluto.
 const gate=clamp(typical*.075,.0015,.02);
 const activity=blocks.map(v=>v>gate);
 // Due finestre attive in tre: una pausa interna non deve chiudere il brano.
 let first=0,last=Math.max(0,blocks.length-1);
 for(let i=0;i<activity.length;i++){
  if(activity.slice(i,i+3).filter(Boolean).length>=2){first=i;break}
 }
 for(let i=activity.length-1;i>=0;i--){
  if(activity.slice(Math.max(0,i-2),i+1).filter(Boolean).length>=2){last=i;break}
 }
 const duration=buf.duration||ch.length/rate;
 // 'first' anticipa di una finestra la coppia di blocchi attivi:
 // riportala vicino all'attacco reale per non lasciare 0.3-0.5s di vuoto.
 const audibleStart=Math.max(0,(first+1)*group*step-.10);
 const signalEnd=Math.min(duration,(last+1)*group*step);
 const assessed=estimateMusicalEnd(ch,rate,blocks,typical,duration,signalEnd);
 const softOutro=weakOutro(blocks,typical,duration);
 const outroGap=lateOutroGap(blocks,typical,duration);
 const outroBreak=outroGap?null:lateOutroBreak(blocks,typical,duration);
 const audibleEnd=Math.min(signalEnd,assessed.end);
 const leading=Math.max(0,audibleStart),trailing=Math.max(0,duration-audibleEnd);
 const diff=energy.map((v,i)=>i?Math.max(0,v-energy[i-1]):0);
 let best={bpm:120,score:-Infinity};
 // Autocorrelazione delle variazioni d'energia tra 72 e 180 BPM.
 for(let lag=Math.round(60/(210*step));lag<=Math.round(60/(55*step));lag++){
  let corr=0,denom=0;
  for(let i=lag;i<diff.length;i+=2){corr+=diff[i]*diff[i-lag];denom+=diff[i]*diff[i]}
  const score=corr/(denom+1e-8);
  if(score>best.score)best={bpm:Math.round(60/(lag*step)),score};
 }
 let beatAnchor=audibleEnd,maxNovelty=0;
 let introBeat=audibleStart,introPeak=0;
 const introStart=Math.max(0,Math.round(audibleStart/step));
 const introEnd=Math.min(diff.length,introStart+Math.round(16/step));
 for(let i=introStart;i<introEnd;i++){
  if(diff[i]>introPeak){introPeak=diff[i];introBeat=i*step}
 }
 const finalStart=Math.max(0,Math.round(audibleEnd/step)-800);
 for(let i=finalStart;i<Math.min(diff.length,Math.ceil(audibleEnd/step));i++){
  if(diff[i]>maxNovelty){maxNovelty=diff[i];beatAnchor=i*step}
 }
 // Preserve the beat phase of the music BEFORE an ending pause.
 if(outroGap||outroBreak){
  const early=(outroGap||outroBreak);
  let peak=0,anchor=null;
  const lo=Math.max(0,Math.floor((early.start-7)/step));
  const hi=Math.min(diff.length-1,Math.floor((early.start-.3)/step));
  for(let i=lo;i<=hi;i++)
   if(diff[i]>peak){peak=diff[i];anchor=i*step}
  early.beatAnchor=anchor;
 }
 const introGroove=beatEnergySignature(blocks,best.bpm,audibleStart,false);
 const hasAudio=typical>.0012;
 const activeRms=blocks.filter(x=>x>gate).sort((x,y)=>x-y);
 const level=activeRms.length?
  activeRms[Math.floor(activeRms.length*.65)]:0;
 // Find the final strong beat and the release AFTER it; compare against
 // the incoming musical attack instead of pairing two empty sections.
 const dropRelease=findDropRelease(blocks,level,audibleEnd,duration);
 const grooveEdge=outroGap||outroBreak?
  Math.max(8,(outroGap||outroBreak).start):
  dropRelease?Math.max(8,dropRelease.lastImpactAt+.20):audibleEnd;
 const outroGroove=beatEnergySignature(blocks,best.bpm,grooveEdge,true);
 const beatConfidence=clamp(best.score,0,1);
 // A forceful last bar is part of the song, not a free transition slot.
 // Even perfectly matched keys should not erase a final drum fill/drop.
 const closing=blocks.slice(Math.max(0,Math.floor((audibleEnd-2.2)/.2)),
   Math.min(blocks.length,Math.ceil(audibleEnd/.2)));
 const protectedEnding=level>.006&&closing.length>=7&&
   closing.filter(x=>x>=level*.62).length>=closing.length*.36;
 // Forma d'onda compressa per il pannello delle transizioni; calcolata
 // dagli stessi frame usati per individuare i silenzi. Nessun upload.
 function waveform(from,to){
  const bars=[];
  const start=Math.max(0,from),stop=Math.min(duration,to);
  const len=Math.max(.5,stop-start);
  for(let k=0;k<48;k++){
   const left=Math.floor((start+(k/48)*len)/step);
   const right=Math.min(energy.length,Math.max(left+1,Math.ceil((start+(k+1)/48*len)/step)));
   let peak=0;
   for(let i=left;i<right;i++)peak=Math.max(peak,energy[i]||0);
   bars.push(clamp(peak/(typical||.1),0,1));
  }
  return bars;
 }
 const introWave=waveform(audibleStart,audibleStart+16);
 const outroWave=waveform(audibleEnd-16,audibleEnd);
 // Finestra di 1s nei secondi conclusivi: una valle d'energia facilita
 // un incrocio di battute senza troncare un ritornello.
 const tailEnergy=[];
 for(let t=Math.max(0,audibleEnd-17);t<audibleEnd;t+=1){
  const firstIndex=Math.max(0,Math.floor(t/step));
  const lastIndex=Math.min(energy.length,firstIndex+Math.round(1/step));
  let e=0;
  for(let i=firstIndex;i<lastIndex;i++)e+=energy[i]*energy[i];
  tailEnergy.push({at:t,energy:Math.sqrt(e/Math.max(1,lastIndex-firstIndex))});
 }
 // Non sovrapporre due ritornelli: l'automix accetta il beatmatch soltanto
 // quando gli ultimi secondi si sono davvero abbassati di intensità.
 const tailSlice=tailEnergy.filter(p=>p.at>=audibleEnd-3.5);
 const tailLevel=tailSlice.length?tailSlice.reduce((sum,p)=>sum+p.energy,0)/tailSlice.length:level;
 const quietTail=hasAudio&&level>.0012&&tailSlice.length>=2&&tailLevel<level*.72;
 // Conservative phrase-safe cue: only after the last high-energy event.
 // Audio energy cannot prove there are no vocals; uncertain endings play on.
 let safeOutroAt=null;
 if(hasAudio&&level>.004){
  const blockSeconds=group*step;
  const from=Math.max(0,Math.floor((audibleEnd-16)/blockSeconds));
  const to=Math.min(blocks.length-1,Math.ceil(audibleEnd/blockSeconds)-1);
  const strong=Math.max(gate*1.5,level*.52);
  let lastStrong=-1;
  for(let j=from;j<=to;j++)if(blocks[j]>=strong)lastStrong=j;
  if(lastStrong>=from){
   const start=(lastStrong+1)*blockSeconds;
   const tail=blocks.slice(lastStrong+1,to+1);
   const seconds=audibleEnd-start;
   const average=tail.reduce((sum,v)=>sum+v,0)/Math.max(1,tail.length);
   const maximum=tail.reduce((max,v)=>Math.max(max,v),0);
   if(seconds>=2.8&&seconds<=12&&tail.length>=10&&
      maximum<=level*.52&&average<=level*.30)
    safeOutroAt=Math.max(0,start-.05);
  }
 }
 // Only skip initial silence verified at an extremely low signal level.
 const introBlocks=blocks.slice(0,Math.max(0,Math.floor(audibleStart/(group*step))));
 const safeIntroAt=hasAudio&&audibleStart>=.85&&introBlocks.length>=4&&
  introBlocks.every(v=>v<=Math.max(.0007,typical*.018))?
   Math.max(0,audibleStart-.12):0;
 // The incoming opening must be MUSICAL at the actual playback entry:
 // only confirmed digital silence may be skipped. A quiet ambient intro
 // preceding the first beat is not a compatible beat-mix attack.
 const introDrive=drivenIntro(blocks,level,safeIntroAt||0);
 // Final attack is a tentative note position, never a reason to cut speech.
 let lastNoteAt=null;
 const onsetFrom=Math.max(1,Math.ceil((audibleEnd-2.3)/step));
 const onsetUntil=Math.min(diff.length-2,Math.floor((audibleEnd-.38)/step));
 const threshold=Math.max(.0015,level*.045);
 for(let i=onsetFrom;i<=onsetUntil;i++)
  if(diff[i]>threshold&&energy[i]>gate*.85&&
     diff[i]>=Math.max(diff[i-1]||0,diff[i+1]||0))
   lastNoteAt=i*step;
 const silentTail=blocks.slice(Math.ceil(audibleEnd/(group*step)));
 const verifiedSilence=hasAudio&&trailing>=1.65&&silentTail.length>=7&&
  silentTail.every(v=>v<=Math.max(.0009,typical*.025));
 return {bpm:best.bpm,beatConfidence,introBeat,tailEnergy,introWave,outroWave,level,quietTail,
  outroReason:assessed.reason,safeOutroAt,safeIntroAt,lastNoteAt,protectedEnding,softOutro,outroGap,outroBreak,dropRelease,introDrive,introGroove,outroGroove,
  first:hasAudio?audibleStart:0,
  last:hasAudio?audibleEnd:duration,beatAnchor,peak:ordered.at(-1)||0,
  trailing:hasAudio?trailing:0,leading:hasAudio?leading:0,
  confidentTail:verifiedSilence&&audibleEnd>Math.max(20,duration*.55)};
}
function fft(re,im){
 const n=re.length;
 for(let i=1,j=0;i<n;i++){
  let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
  if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}
 }
 for(let len=2;len<=n;len<<=1){
  const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);
  for(let i=0;i<n;i+=len){
   let ur=1,ui=0;
   for(let j=0;j<len/2;j++){
    const ar=re[i+j],ai=im[i+j];
    const br=re[i+j+len/2]*ur-im[i+j+len/2]*ui;
    const bi=re[i+j+len/2]*ui+im[i+j+len/2]*ur;
    re[i+j]=ar+br;im[i+j]=ai+bi;re[i+j+len/2]=ar-br;im[i+j+len/2]=ai-bi;
    const nr=ur*wr-ui*wi;ui=ur*wi+ui*wr;ur=nr;
   }
  }
 }
}
function chroma(buf,from=0,to=buf.duration,tonalOnly=false){
 const data=buf.getChannelData(0),rate=buf.sampleRate,
  right=buf.numberOfChannels>1?buf.getChannelData(1):null,
  N=tonalOnly&&!isIOS?8192:4096,hist=new Float64Array(12);
 if(data.length<N)return [...hist];
 const duration=buf.duration;
 const rangeStart=clamp(Number(from)||0,0,Math.max(0,duration-N/rate));
 const rangeEnd=clamp(Number(to)||duration,rangeStart+N/rate,duration);
 // Fewer windows on iPhone: enough for harmonic ranking, less CPU/RAM.
 const windows=tonalOnly?(isIOS?8:12):(isIOS?12:24);
 for(let w=0;w<windows;w++){
  const second=clamp(rangeStart+(w+.5)/windows*(rangeEnd-rangeStart),
   rangeStart,Math.max(rangeStart,rangeEnd-N/rate));
  const start=Math.floor(second*rate),re=new Float32Array(N),im=new Float32Array(N);
  for(let i=0;i<N;i++){
   const sample=right?(data[start+i]+right[start+i])*.5:data[start+i];
   re[i]=sample*(.5-.5*Math.cos(2*Math.PI*i/(N-1)));
  }
  fft(re,im);
  for(let bin=Math.ceil(80*N/rate);bin<Math.min(N/2,Math.floor(1600*N/rate));bin++){
   const freq=bin*rate/N, midi=69+12*Math.log2(freq/440);
   const pitch=((Math.round(midi)%12)+12)%12;
   const mag=Math.hypot(re[bin],im[bin]);
   if(tonalOnly){
    // Ignore broad-band percussion/noise: a pitched spectral peak should
    // stand above its neighbors, not just have some energy in each bin.
    if(bin<=2||bin>=N/2-2)continue;
    const before=Math.hypot(re[bin-1],im[bin-1]);
    const after=Math.hypot(re[bin+1],im[bin+1]);
    if(mag<before*.94||mag<after*.94)continue;
   }
   hist[pitch]+=Math.sqrt(mag)*(tonalOnly?Math.pow(180/freq,.10):1);
  }
 }
 const total=hist.reduce((a,b)=>a+b,0)||1;
 return [...hist].map(v=>v/total);
}
// Consecutive harmonic snapshots near the genuine first/last audible
// notes. Average track keys cannot prove two phrases fit musically.
function harmonicTimeline(buf,first,last,fromEnd){
 if(!buf||last-first<3)return [];
 const offsets=isIOS?[.65,1.85,3.15,4.55]:[.65,1.65,2.65,3.65,4.65,5.65];
 const timeline=[];
 for(const offset of offsets){
  const center=fromEnd?last-offset:first+offset;
  if(center-.60<first||center+.60>last)continue;
  timeline.push({offset,notes:chroma(buf,center-.60,center+.60,true)});
 }
 return timeline;
}
function compatibility(a,b){
 if(!a?.chroma||!b?.chroma)return 0;
 let dot=0,aa=0,bb=0;
 for(let i=0;i<12;i++){dot+=a.chroma[i]*b.chroma[i];aa+=a.chroma[i]**2;bb+=b.chroma[i]**2}
 return dot/Math.sqrt((aa||1)*(bb||1));
}

 // The index already contains the measurements. On iPhone, load ONLY
 // an MP3 intro byte range for an optional WebAudio overlap, never a full song.
 async function decodeMobileIntroRange(source,key,deep,epoch){
 if(offlineTransferPriority||!mobileDJMayWork()||document.hidden||epoch!==djPlaybackEpoch)return null;
 if(Date.now()<(mobileClipRetryAt.get(key)||0))return null;
 const ctrl=new AbortController();djFetchControllers.add(ctrl);
 const timer=setTimeout(()=>ctrl.abort(),55000);
 const stale=()=>offlineTransferPriority||ctrl.signal.aborted||
  epoch!==djPlaybackEpoch||document.hidden;
 async function readLimited(response,limit){
  if(!response.ok)throw Error("HTTP "+response.status);
  if(Number(response.headers.get("content-length")||0)>limit)
   throw Error("File troppo grande per il mix");
  if(response.body?.getReader){
   const reader=response.body.getReader(),parts=[];let total=0;
   try{
    while(true){
     const {done,value}=await reader.read();if(done)break;
     if(stale())throw Error("Operazione annullata");
     total+=value.byteLength;
     if(total>limit)throw Error("Limite memoria anteprima raggiunto");
     parts.push(value);
    }
   }catch(err){try{await reader.cancel()}catch(_){}throw err}
   const bytes=new Uint8Array(total);let off=0;
   for(const p of parts){bytes.set(p,off);off+=p.byteLength}
   return bytes.buffer;
  }
  const buf=await response.arrayBuffer();
  if(buf.byteLength>limit)throw Error("Limite memoria anteprima raggiunto");
  return buf;
 }
 // If a server ignores Range and streams a large HTTP 200, consume ONLY
 // the intro prefix and cancel the remaining 10+ MB. Safari may still decode
 // these complete MP3 frames for its bounded WebAudio overlap.
 async function readPrefix(response,limit){
  if(!response.body?.getReader)
   throw Error("Il server non supporta anteprime MP3 in streaming");
  const reader=response.body.getReader(),parts=[];let got=0;
  try{
   while(got<limit){
    const {done,value}=await reader.read();if(done)break;
    if(stale())throw Error("Anteprima annullata");
    const remaining=limit-got;
    const part=value.byteLength>remaining?value.subarray(0,remaining):value;
    parts.push(part);got+=part.byteLength;
   }
  }finally{try{await reader.cancel()}catch(_){}}
  const bytes=new Uint8Array(got);let off=0;
  for(const part of parts){bytes.set(part,off);off+=part.byteLength}
  return bytes.buffer;
 }
 async function clipFromBytes(bytes,complete){
  if(stale()||bytes.byteLength<16384)return null;
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)throw Error("Decodifica Web Audio non disponibile");
  const ctx=new Offline(1,1,44100);
  const decoded=await ctx.decodeAudioData(bytes.slice(0));
  if(stale())return null;
  if(complete&&Math.abs(decoded.duration-deep.duration)>1.5)
   throw Error("MP3 diverso dall'analisi musicale");
  rememberMobileClip(key,decoded,deep);
  if(!mobileIntroClips.has(key))throw Error("Introduzione MP3 non decodificabile");
  const merged=withValidatedVoice(deep,cache.get(key));
  cache.set(key,merged);
  mobileClipRetryAt.delete(key);mobileClipFailure=null;
  return merged;
 }
 try{
  mobileClipMetrics.ranges++;
  const response=await fetch(source,{mode:"cors",cache:"no-store",
   signal:ctrl.signal,headers:{"Range":"bytes=0-786431"}});
  if(stale())return null;
  if(response.status!==206&&response.status!==200)
   throw Error("Anteprima MP3 non disponibile: HTTP "+response.status);
  const complete=response.status===200,cr=response.headers.get("content-range")||"";
  if(!complete&&cr&&!/^bytes\s+0-\d+\/\d+$/i.test(cr))
   throw Error("Intervallo MP3 non valido");
  const advertised=Number(response.headers.get("content-length")||0);
  if(complete&&advertised>7*1024*1024){
   const first=await readPrefix(response,2*1024*1024);
   if(stale())return null;
   try{
    const result=await clipFromBytes(first,false);
    if(result){mobileClipMetrics.successes++;
     mobileClipMetrics.method="HTTP 200 · solo intro";return result;}
   }catch(_){/* Incomplete MP3 frames fail on some Safari releases */ }
   if(advertised>12*1024*1024){
    mobileClipFailure={source:key,reason:"MP3 troppo grande per il mix"};
    mobileClipRetryAt.set(key,Date.now()+90000);
    return null;
   }
   // The 2MB prefix was consumed. Continue to the bounded complete-file path.
  }else{
   const bytes=await readLimited(response,complete?12*1024*1024:786432);
   if(stale())return null;
   if(complete){
    mobileClipMetrics.fullFetches++;
    const result=await clipFromBytes(bytes,true);
    if(result){mobileClipMetrics.successes++;mobileClipMetrics.method="HTTP 200";}
    return result;
   }
   try{
    const result=await clipFromBytes(bytes,false);
    if(result){mobileClipMetrics.successes++;mobileClipMetrics.method="HTTP 206";return result;}
   }catch(_){/* Safari can reject a valid but incomplete MP3 */ }
  }
  if(stale())return null;
  // Safari sometimes needs more complete MP3 frames before decodeAudioData
  // can decode a partial response. Try a bounded 2 MB header/intro first
  // (rather than fetching a whole 7 MB song into iPhone RAM).
  try{
   const wider=await fetch(source,{mode:"cors",cache:"force-cache",
    signal:ctrl.signal,headers:{"Range":"bytes=0-2097151"}});
   if(wider.status===206){
    const widerBytes=await readLimited(wider,2097152);
    if(stale())return null;
    const decoded=await clipFromBytes(widerBytes,false);
    if(decoded){mobileClipMetrics.successes++;
     mobileClipMetrics.method="HTTP 206 · intro estesa";return decoded;}
   }else if(wider.status===200&&
     Number(wider.headers.get("content-length")||0)<=12*1024*1024){
    // The service worker may return an already-complete cached response.
    // Avoid issuing an unnecessary third download.
    const fullBytes=await readLimited(wider,12*1024*1024);
    if(stale())return null;
    const decoded=await clipFromBytes(fullBytes,true);
    if(decoded){mobileClipMetrics.successes++;
     mobileClipMetrics.method="HTTP 200 · cache completa";return decoded;}
   }
  }catch(_){if(stale())return null}
  if(stale())return null;
  // The complete-file fallback is allowed only while the current native
  // song has adequate buffered audio; it must never stall playback.
  const playing=bridge()?.audio?.();
  let ahead=0;
  try{for(let i=0;i<playing.buffered.length;i++)
   if(playing.buffered.start(i)<=playing.currentTime+.5&&
      playing.buffered.end(i)>=playing.currentTime)
    ahead=Math.max(ahead,playing.buffered.end(i)-playing.currentTime)
  }catch(_){}
  const conn=navigator.connection||navigator.webkitConnection;
  if(!playing||playing.paused||playing.seeking||playing.readyState<3||
     (playing.readyState<4&&ahead<12)||conn?.saveData||
     /^(slow-)?2g$|^3g$/i.test(String(conn?.effectiveType||""))){
   mobileClipRetryAt.set(key,Date.now()+18000);
   mobileClipFailure={source:key,reason:"Attendo più audio già caricato"};
   return null;
  }
  // Reuse a complete MP3 saved offline before issuing another full
  // network fetch. Never store partial fragments into the offline cache.
  try{
   const existing=typeof caches!=="undefined"?
    await caches.match(source,{ignoreSearch:true}):null;
   if(existing?.status===200){
    const len=Number(existing.headers.get("content-length")||0);
    if(len>=16384&&len<=12*1024*1024){
     const local=await readLimited(existing,12*1024*1024);
     const decoded=await clipFromBytes(local,true);
     if(decoded){
      mobileClipMetrics.successes++;
      mobileClipMetrics.method="MP3 offline già salvato";return decoded;
     }
    }
   }
  }catch(_){if(stale())return null}
  if(stale())return null;
  mobileClipMetrics.fullFetches++;
  const full=await fetch(source,{mode:"cors",cache:"force-cache",signal:ctrl.signal});
  if(full.status!==200)throw Error("MP3 completo non disponibile");
  const completeBytes=await readLimited(full,12*1024*1024);
  const result=await clipFromBytes(completeBytes,true);
  if(result){mobileClipMetrics.successes++;mobileClipMetrics.method="MP3 completo";}
  return result;
 }catch(e){
  if(stale())return null;
  const reason=String(e?.message||e||"Decodifica non disponibile");
  mobileClipFailure={source:key,reason};
  // Stop Safari from redownloading the same undecodable MP3 every 650 ms.
  mobileClipRetryAt.set(key,Date.now()+25000);
  mobileClipMetrics.errors++;mobileClipMetrics.lastError=reason;
  return null;
 }finally{clearTimeout(timer);djFetchControllers.delete(ctrl)}
}
async function decode(track,needClip=false){
 if(!enabled||!track)return null;
 const epoch=djPlaybackEpoch;
 const source=bridge()?.mixUrl?.(track)||track.url;
 if(!source||/^(javascript:|data:)/i.test(source))return null;
 const key=String(source);
 if(Date.now()<(unavailableAnalysis.get(key)||0))return null;
 // Never decode a full MP3 or download the giant index just to play an
 // optional Safari intro. The native song is always highest priority.
 if(isIOS&&needClip&&!deepIndex)return null;
 if(isIOS&&!needClip&&bridge()?.audio?.()&&!bridge().audio().paused)
  return deepLookup(track)||cache.get(key)||null;
 if(!deepIndex)await loadDeepIndex();
 const deep=deepLookup(track);
 if(isIOS&&needClip){
  if(!deep||Date.now()<(mobileClipRetryAt.get(key)||0))return null;
  if(mobileIntroClips.has(key))return cache.get(key)||deep;
  if(pending.has(key))return pending.get(key);
  const job=(mobileDecodeQueue=mobileDecodeQueue.catch(()=>{}).then(()=>
    decodeMobileIntroRange(source,key,deep,epoch)));
  pending.set(key,job);
  try{return await job}finally{if(pending.get(key)===job)pending.delete(key)}
 }
 if(deep&&(!needClip||mobileIntroClips.has(key))){
  const current=cache.get(key);
  // A local vocal scan can be valid even when its BPM estimate is stale.
  const stored=current?.voiceModel?current:await savedAnalysis(key);
  const merged=withValidatedVoice(deep,stored);
  cache.set(key,merged);
  if(!merged.voiceModel)scheduleDeepVoice(track,key,merged);
  return merged;
 }
 if(cache.has(key)&&(!needClip||mobileIntroClips.has(key)))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const saved=await savedAnalysis(key);
 if(saved&&(!needClip||mobileIntroClips.has(key))){cache.set(key,saved);return saved}
 // A second caller may have begun the same analysis while IndexedDB loaded.
 if(cache.has(key)&&(!needClip||mobileIntroClips.has(key)))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 // Offline/saved analyses still work in data-saving mode. Only network
 // downloads are suppressed.
 const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 if(connection?.saveData||/^(slow-)?2g$|^3g$/i.test(String(connection?.effectiveType||"")))
   return null;
 const operation=async()=>{
  if(isIOS&&(!mobileDJMayWork()||epoch!==djPlaybackEpoch))
   return STALE_MOBILE_PREVIEW;
  const controller=new AbortController();
  djFetchControllers.add(controller);
  const timeout=setTimeout(()=>controller.abort(),isIOS?25000:22000);
  try{
   const response=await fetch(source,{mode:"cors",cache:"force-cache",signal:controller.signal});
   // 6.5MB escludeva molti MP3 su iPhone: mancava l'analisi delle code mute.
   const maxBytes=isIOS?12000000:25000000;
   if(!response.ok||Number(response.headers.get("content-length")||0)>maxBytes)return null;
   let bytes;
   if(response.body&&response.body.getReader){
    const reader=response.body.getReader(),parts=[];let total=0;
    while(true){
     const {done,value}=await reader.read();if(done)break;
     total+=value.length;
     if(total>maxBytes){await reader.cancel();return null}
     parts.push(value);
    }
    bytes=new Uint8Array(total);let offset=0;
    for(const p of parts){bytes.set(p,offset);offset+=p.length}
   }else{
    const ab=await response.arrayBuffer();if(ab.byteLength>maxBytes)return null;
    bytes=new Uint8Array(ab);
   }
   if(isIOS&&(epoch!==djPlaybackEpoch||controller.signal.aborted||
      document.hidden))return STALE_MOBILE_PREVIEW;
   // OfflineAudioContext decodes without opening a second playback session.
   // The old live AudioContext could disturb MediaSession on iOS and fail
   // when Safari suspends output audio contexts.
   const OfflineContext=window.OfflineAudioContext||window.webkitOfflineAudioContext;
   const AudioContext=window.AudioContext||window.webkitAudioContext;
   let ctx=null;
   if(isIOS&&OfflineContext)try{ctx=new OfflineContext(1,1,44100)}catch(e){}
   if(!ctx&&AudioContext)ctx=new AudioContext();
   if(!ctx)return null;
   try{
    const decoded=await ctx.decodeAudioData(bytes.buffer.slice(0));
    if(isIOS&&(epoch!==djPlaybackEpoch||document.hidden))
     return STALE_MOBILE_PREVIEW;
    if(decoded.duration<35)return null;
    // Already-indexed audio needs only the short intro preview on Safari:
    // skip costly FFT/chroma and whole-song vocal model.
    if(isIOS&&deep&&Math.abs(decoded.duration-deep.duration)<1.5){
     if(needClip)rememberMobileClip(key,decoded,deep);
     const fast=withValidatedVoice(deep,cache.get(key));
     cache.set(key,fast);return fast;
    }
    const frame=analyzeFrames(decoded);
    const harmonies=chroma(decoded);
     const tonal=chroma(decoded,0,decoded.duration,true);
    const expected=Number(track.spotifyDurationMs||0)/1000||
     Number(track.expectedDurationSec||0);
    const durationMismatch=expected>20&&
     Math.abs(decoded.duration-expected)>Math.max(7,expected*.07);
    const earlyBoundary=frame.outroGap||frame.outroBreak;
    const outroFrom=earlyBoundary?Math.max(0,earlyBoundary.start-10):
     Math.max(0,(frame.dropRelease?.lastImpactAt??frame.last)-10);
    const introTo=Math.min(decoded.duration,Math.max(9,frame.first+12));
    const firstSound=Math.max(0,frame.first);
    const lastSound=earlyBoundary?Math.max(2,earlyBoundary.start-.18):
     frame.dropRelease?Math.max(2,frame.dropRelease.lastImpactAt+.20):
     Math.min(decoded.duration,frame.last);
    const result={...frame,chroma:harmonies,
     introChroma:chroma(decoded,0,introTo),
     outroChroma:chroma(decoded,outroFrom,lastSound),
     introNotes:chroma(decoded,firstSound,Math.min(decoded.duration,firstSound+5)),
     outroNotes:chroma(decoded,Math.max(0,lastSound-5),lastSound),
     // 2-second boundary notes (including the final sung pitch) are
     // more decisive than the overall song key.
     introAttackNotes:chroma(decoded,firstSound,Math.min(decoded.duration,firstSound+2.3)),
     introPhraseNotes:chroma(decoded,firstSound,Math.min(decoded.duration,firstSound+6)),
     outroFinalNotes:chroma(decoded,Math.max(0,lastSound-2.5),lastSound),
     outroPhraseNotes:chroma(decoded,Math.max(0,lastSound-7),Math.max(0,lastSound-2)),
     introTimeline:harmonicTimeline(decoded,firstSound,Math.min(decoded.duration,firstSound+9),false),
     outroTimeline:harmonicTimeline(decoded,Math.max(0,lastSound-9),lastSound,true),
     duration:decoded.duration,durationMismatch,
      camelot:/^(?:[1-9]|1[0-2])[AB]$/.test(String(track.camelot||track.camelotKey||"").toUpperCase())?
       {code:String(track.camelot||track.camelotKey).toUpperCase(),confidence:1}:
       (camelotEstimate(tonal)||camelotEstimate(harmonies))};
    // Keep the NEXT intro, not every analyzed shuffle candidate in RAM.
     if(isIOS&&!document.hidden&&(needClip||bridge()?.mixNext?.()?.id===track.id))
      rememberMobileClip(key,decoded,frame);
    cache.set(key,result);
    saveAnalysis(key,result).catch(()=>{});
    // Analyze singing and speech separately without delaying the native
    // playback or blocking the next-track preload on iPhone.
    const voice=window.MusicBoxVocal;
    if(!isIOS&&voice?.analyze&&mayScanDesktopVoice(bridge(),track)&&
       voiceJobs.size===0&&!voiceJobs.has(key)&&!document.hidden){
     let job=null;
     job=Promise.resolve().then(async()=>{
      await new Promise(resolve=>setTimeout(resolve,4500));
      if(!enabled||document.hidden||!mayScanDesktopVoice(bridge(),track))return null;
      return voice.analyze(decoded,frame);
     })
      .then(v=>{
       if(!v||cache.get(key)!==result)return;
       Object.assign(result,{lastVoiceAt:v.lastVoiceAt,
        firstVoiceAt:v.firstVoiceAt,voiceModel:v.source,
        voiceModelVersion:v.modelVersion,voiceIntervals:v.voiceIntervals,
        firstVoiceConfidence:v.firstVoiceConfidence,
        lastVoiceConfidence:v.lastVoiceConfidence,
        voiceScannedEnd:v.scannedEnd,voiceScannedFrom:v.scannedFrom});
       saveAnalysis(key,result).catch(()=>{});
       const app=bridge();
       if(app?.currentId()===track.id||
          app?.mixNext?.()?.id===track.id){
        // A singing classifier often finds vocals anywhere in a song.
        // Only vocals NEAR THE MIX POINT can invalidate an active blend.
        // v6.519 cancelled on *any* vocal detection, even 60s earlier.
        const currentTrack=app.currentId()===track.id;
        const nextTrack=app.mixNext?.()?.id===track.id;
        if(voiceThreatensPlan(v,currentTrack,nextTrack,plan)&&
           (active||mobileActive))cancel();
        // Never restart the planning loop during an already running
        // handoff or change the player based on non-dangerous vocals.
        if(!mixing&&!active&&!mobileActive){
         plannedFor="";plan=null;
        }
        if(currentTrack)rearmShuffleAfterVocalScan(track.id);
       }
      }).catch(()=>{}).finally(()=>{if(voiceJobs.get(key)===job)voiceJobs.delete(key)});
     voiceJobs.set(key,job);
    }
    if(cache.size>8)cache.delete(cache.keys().next().value);
    return result;
   }finally{if(typeof ctx.close==="function")await ctx.close().catch(()=>{})}
  }catch(e){return controller.signal.aborted&&isIOS?
    STALE_MOBILE_PREVIEW:null}
  finally{clearTimeout(timeout);djFetchControllers.delete(controller)}
 };
 const job=isIOS?(mobileDecodeQueue=mobileDecodeQueue.catch(()=>{}).then(()=>{
  // The queue may change while Safari decodes another long MP3.
  // Don't waste the next decode slot on an obsolete intro.
  if(needClip&&bridge()?.mixNext?.()?.id!==track.id)
   return STALE_MOBILE_PREVIEW;
  return operation();
 })):operation();
 pending.set(key,job);
 try{
  const data=await job;
  if(data===STALE_MOBILE_PREVIEW)return null; // Not a broken MP3.
  if(!data){
   unavailableAnalysis.set(key,Date.now()+300000);
   if(unavailableAnalysis.size>64)
    unavailableAnalysis.delete(unavailableAnalysis.keys().next().value);
  }else unavailableAnalysis.delete(key);
  return data;
 }finally{pending.delete(key)}
}

// Singing is common in music; only a vocal overlapping the specific
// transition window can invalidate an already audible mix.
function voiceThreatensPlan(voice,isCurrent,isNext,currentPlan){
 if(!currentPlan)return false;
 return Boolean(
  (isCurrent&&Number.isFinite(voice?.lastVoiceAt)&&
   Number.isFinite(currentPlan.begin)&&voice.lastVoiceAt>=currentPlan.begin-5)||
  (isNext&&Number.isFinite(voice?.firstVoiceAt)&&voice.firstVoiceAt<7)
 );
}

// Read lightweight saved analysis first, without waiting for a whole MP3 to
// be decoded again just to build a small iPhone playback preview.
async function cachedMobileAnalysis(track){
 const source=bridge()?.mixUrl?.(track)||track?.url;
 if(!source)return null;
 const key=String(source);
 const deep=deepLookup(track);
 if(deep){
  const merged=withValidatedVoice(deep,cache.get(key));
  cache.set(key,merged);
  if(!merged.voiceModel)scheduleDeepVoice(track,key,merged);
  return merged;
 }
 if(cache.has(key))return cache.get(key);
 const stored=await savedAnalysis(key);
 if(stored){cache.set(key,stored);return stored}
 return null;
}
function hasReliableHarmony(ch){
 if(!Array.isArray(ch)||ch.length!==12)return false;
 const v=ch.slice().sort((a,b)=>b-a);
 // A continuous hum or a single sustained pitch is not evidence that
 // two arrangements harmonize. Require more than one meaningful tone.
 return v[0]>=.117&&v[0]<.64&&v[1]>=.105&&
  v.slice(0,4).reduce((a,b)=>a+b,0)>=.435;
}
function focusedChroma(ch){
 const floor=1/12*.82;
 return ch.map(value=>Math.max(0,value-floor));
}
function focusedCompatibility(a,b){
 return compatibility({chroma:focusedChroma(a)},{chroma:focusedChroma(b)});
}
// Compare the actual chord sequence at synchronized points of the blend.
// One common note in two averaged spectra is NOT enough for a transition.
function bestHarmonicAlignment(a,b){
 const tail=a?.outroTimeline,head=b?.introTimeline;
 if(!Array.isArray(tail)||!Array.isArray(head)||
    tail.length<3||head.length<3)return null;
 const closest=(items,offset)=>{
  let best=null,dist=Infinity;
  for(const x of items){const d=Math.abs(x.offset-offset);if(d<dist){best=x;dist=d}}
  return dist<=.92?best?.notes:null;
 };
 let best=null;
 for(const fade of [2.4,3.1,3.8,4.5,5.2]){
  const checks=[];
  for(const fraction of [.22,.50,.78]){
   const old=closest(tail,fade*(1-fraction));
   const next=closest(head,fade*fraction);
   if(!hasReliableHarmony(old)||!hasReliableHarmony(next))continue;
   const focus=focusedCompatibility(old,next);
   const top=ch=>ch.map((value,pitch)=>({value,pitch}))
    .sort((x,y)=>y.value-x.value).slice(0,3);
   const shared=top(old).filter(x=>top(next).some(y=>y.pitch===x.pitch)).length;
   checks.push({focus,passing:focus>=.60&&shared>=2});
  }
  if(checks.length!==3)continue;
  const average=checks.reduce((sum,x)=>sum+x.focus,0)/3;
  const weakest=Math.min(...checks.map(x=>x.focus));
  const matches=average>=.78&&weakest>=.48&&
   checks.filter(x=>x.passing).length>=2;
  const score=average*.75+weakest*.25;
  const candidate={fade,score,weakest,matches};
  if(!best||Number(matches)>Number(best.matches)||
     (matches===best.matches&&score>best.score))best=candidate;
 }
 // If all three aligned checkpoints are untrustworthy, do NOT
 // silently fall back to a misleading whole-song chord average.
 return best||{fade:null,score:0,weakest:0,matches:false};
}
function similarNotes(a,b){
 const tail=a?.outroFinalNotes||a?.outroNotes||a?.outroChroma||a?.chroma;
 const head=b?.introAttackNotes||b?.introNotes||b?.introChroma||b?.chroma;
 if(!hasReliableHarmony(tail)||!hasReliableHarmony(head))
  return {matches:false,score:null,focused:null,reason:"uncertain"};
 const broad=compatibility({chroma:tail},{chroma:head});
 const focused=focusedCompatibility(tail,head);
 const ranked=arr=>arr.map((value,n)=>({value,n})).sort((x,y)=>y.value-x.value);
 const ta=ranked(tail),tb=ranked(head);
 const shared=ta.slice(0,3).some(x=>tb.slice(0,3).some(y=>y.n===x.n));
 const fifth=ta.slice(0,2).some(x=>tb.slice(0,2).some(y=>
  [5,7].includes((x.n-y.n+12)%12)));
 const phraseA=a?.outroPhraseNotes||a?.outroNotes||a?.outroChroma||tail;
 const phraseB=b?.introPhraseNotes||b?.introNotes||b?.introChroma||head;
 const phrase=hasReliableHarmony(phraseA)&&hasReliableHarmony(phraseB)?
  focusedCompatibility(phraseA,phraseB):focused;
 const alignment=bestHarmonicAlignment(a,b);
 const staticMatch=broad>=.74&&focused>=.69&&
  (shared||(fifth&&focused>=.82))&&phrase>=.42;
 // Measured chord progressions veto misleading global-key matches.
 // A few intros contain too few reliable harmonic frames for a full
 // three-point comparison. In that case only an exceptionally strong
 // boundary match PLUS a matching beat pattern may act as a fallback.
 const reliableProgression=alignment&&alignment.score>0;
 const groove=grooveAgreement(a,b);
 const fallback=staticMatch&&broad>=.87&&focused>=.88&&
  phrase>=.84&&groove?.score>=.86;
 const matches=reliableProgression?
  alignment.matches&&(staticMatch||alignment.score>=.89):
  alignment?fallback:staticMatch;
 const score=reliableProgression?alignment.score*.82+focused*.18:
  focused*.54+phrase*.30+broad*.16;
 return {matches,score,focused,phrase,alignment,
  reason:matches?"similar":alignment?"phrase-mismatch":"different"};
}
// A low-energy frame is not necessarily the end of the song. The DJ
// can move its handoff ahead of EOF only when actual DIGITAL silence was
// measured after the last audible frame, never from 'last' alone.
function certifiedMixBoundary(a,dur,end){
 if(!a||!Number.isFinite(dur)||!Number.isFinite(end))return false;
 if(dur-end<=.72)return true;
 return a.confidentTail===true&&Number.isFinite(a.last)&&
  dur-a.last>=1.65&&dur-a.last<=12&&Math.abs(end-a.last)<=.25;
}

// Permit a rhythmic overlap while the outgoing instrumental beat is
// still audible. Previously protected loud endings were always rejected,
// even with matched chords, groove and tempo. Never infer vocal safety
// merely from an absent detection.
function strongInstrumentalBeatBridge(a,b,dur){
 if(!a||!b||a.durationMismatch||b.durationMismatch||
    !Number.isFinite(a.duration)||Math.abs(a.duration-dur)>1.5||
    !Number.isFinite(a.bpm)||!Number.isFinite(b.bpm)||
    a.bpm<55||a.bpm>210||b.bpm<55||b.bpm>210||
    a.beatConfidence<.30||b.beatConfidence<.30||
    !Number.isFinite(b.introDrive)||b.introDrive<.43||
    !(a.outroFinalNotes||a.outroNotes||a.outroChroma)||
    !(b.introAttackNotes||b.introNotes||b.introChroma))return null;
 if(a.protectedEnding!==true&&a.dropRelease)return null;
 const end=clamp((Number.isFinite(a.last)?a.last:dur)+.06,25,dur-.035);
 if(dur-end>13||!certifiedMixBoundary(a,dur,end))return null;
 const notes=similarNotes(a,b),groove=grooveAgreement(a,b);
 const ratio=[.5,1,2].map(scale=>a.bpm/(b.bpm*scale))
  .reduce((best,r)=>Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best);
 if(!notes.matches||Number(notes.focused)<.78||
    Number(notes.phrase)<.69||!groove||
    !Number.isFinite(groove.score)||groove.score<.81||
    ratio<.965||ratio>1.035||
    (notes.alignment&&notes.alignment.score>0&&!notes.alignment.matches))
  return null;
 const approxBar=4*60/a.bpm;
 const fade=clamp(notes.alignment?.matches&&Number.isFinite(notes.alignment.fade)?
  notes.alignment.fade:approxBar*1.5,3.5,5.1);
 const begin=end-fade;
 if(begin<14)return null;
 // A karaoke timestamp marks the START of a line. Otherwise require
 // the vocal classifier to have genuinely scanned through the end.
 const lyricEndKnown=Number.isFinite(a.lastLyricAt)&&
  a.lastLyricAt<=begin-5.5;
 const scannedVoiceEnd=Boolean(a.voiceModel&&
  Number.isFinite(a.voiceScannedEnd)&&a.voiceScannedEnd>=end-1&&
  (!Number.isFinite(a.lastVoiceAt)||a.lastVoiceAt<=begin-2.5));
 if(!lyricEndKnown&&!scannedVoiceEnd)return null;
 if((Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>begin-5.5)||
    (Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>begin-2.5)||
    (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<2.6)||
    (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<2.6))return null;
 const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
 return {entry,begin,end,fade,kind:"beat",
  tempo:clamp(ratio,.97,1.03),
  gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
  score:Math.round(notes.score*100),grooveScore:groove.score,
  silenceTrim:!!(a.confidentTail&&a.last<dur-1.65),
  softTailTrim:false,quietCertified:scannedVoiceEnd||lyricEndKnown,
  safeOutroAt:begin,trailing:Math.max(0,dur-end),
  strongBeatBridge:true,instrumentalBeatBridge:true,
  verifiedHarmonicBridge:true,preserveTail:true,
  beatPeriod:60/a.bpm,
  beatAnchor:Number.isFinite(a.beatAnchor)?a.beatAnchor:end,
  nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
}

// Regular beat-grid evidence independent of drum timbre: a different kick
// sample must not be treated as a different tempo. Use only for short joins.
function onsetPeriodicity(values,bpm){
 if(!Array.isArray(values)||values.length!==96||
    !Number.isFinite(bpm)||bpm<55||bpm>210)return null;
 const corr=lag=>{
  if(!Number.isInteger(lag)||lag<3||lag>48)return -1;
  let xy=0,xx=0,yy=0;
  for(let i=0;i+lag<96;i++){
   const a=values[i],b=values[i+lag];
   if(!Number.isFinite(a)||!Number.isFinite(b))return -1;
   xy+=a*b;xx+=a*a;yy+=b*b;
  }
  return xx>1&&yy>1?xy/Math.sqrt(xx*yy):-1;
 };
 const lag=24*60/bpm;
 return Math.max(...[lag,2*lag].map(n=>
  Math.max(corr(Math.floor(n)),corr(Math.ceil(n)))));
}
function onsetGridPhase(values,bpm){
 const period=24*60/bpm;
 if(!Array.isArray(values)||values.length!==96||
    !Number.isFinite(period)||period<6||period>27)return 0;
 let best=-Infinity,bestPhase=0;
 for(let phase=0;phase<period;phase+=.5){
  let sum=0,count=0;
  for(let p=phase;p<96;p+=period){
   const i=Math.round(p);
   sum+=Math.max(values[Math.max(0,i-1)]||0,
    values[i]||0,values[Math.min(95,i+1)]||0);
   count++;
  }
  if(sum/Math.max(1,count)>best){
   best=sum/Math.max(1,count);bestPhase=phase;
  }
 }
 return bestPhase/24;
}
// After a full REAL vocal scan, a short beat join is possible even when
// the long-form chord progression is not a perfect match. Preserve the
// outgoing final note; a missing voice measurement is never proof of safety.
function verifiedInstrumentalSnap(a,b,dur){
 if(!a||!b||a.durationMismatch||b.durationMismatch||
    !Number.isFinite(a.duration)||Math.abs(a.duration-dur)>1.5||
    !a.voiceModel||!Number.isFinite(a.voiceScannedEnd)||
    !Number.isFinite(a.last)||!Number.isFinite(a.bpm)||
    !Number.isFinite(b.bpm)||a.beatConfidence<.17||b.beatConfidence<.17||
    b.introDrive<.43||!hasReliableHarmony(a.outroFinalNotes)||
    !hasReliableHarmony(b.introAttackNotes))return null;
 const end=clamp(a.last+.045,26,dur-.035);
 if(end<26||dur-end>13||!certifiedMixBoundary(a,dur,end)||
    a.voiceScannedEnd<end-.75)return null;
 if((Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>end-5)||
    (Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>end-5)||
    (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<1.5)||
    (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<1.5))return null;
 const ratio=[.5,1,2].map(scale=>a.bpm/(b.bpm*scale))
  .reduce((best,r)=>Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best);
 if(ratio<.965||ratio>1.035)return null;
 const notes=similarNotes(a,b),groove=grooveAgreement(a,b);
 const key=camelotMatch(a,b);
 if(!groove||groove.score<.65||!Number.isFinite(notes.focused)||
    !Number.isFinite(notes.phrase)|| (key.weight>.14&&key.score<.30))
  return null;
 // A shorter, beat-grid-length join needs reliable boundary chords rather
 // than identical multi-bar progressions. A *weaker* harmonic match is only
 // accepted with stronger measured drums AND a compatible known key.
 const clearPhrase=notes.focused>=.78&&notes.phrase>=.68&&
  (notes.matches||(notes.alignment?.score||0)>=.68);
 const verifiedGroove=groove.score>=.79&&notes.focused>=.69&&
  notes.phrase>=.55&&
  ((notes.alignment?.score||0)>=.57||
   (key.weight>=.14&&key.score>=.90));
 if(!clearPhrase&&!verifiedGroove)return null;
 const fade=clamp(1.5*60/a.bpm,.62,1.04),begin=end-fade;
 if(begin<20)return null;
 const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
 return {kind:"snap",begin,end,entry,fade,tempo:clamp(ratio,.97,1.03),
  gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
  score:Math.round((notes.score??notes.focused)*100),
  grooveScore:groove.score,measuredBeatBridge:true,
  voiceVerifiedMicroBridge:true,preserveTail:true,
  verifiedMicroBeat:clearPhrase||verifiedGroove,
  quietCertified:false,softTailTrim:false,
  silenceTrim:!!(a.confidentTail&&dur-a.last>=1.65),
  trailing:Math.max(0,dur-end),safeOutroAt:null,
  beatPeriod:60/a.bpm,beatAnchor:Number.isFinite(a.beatAnchor)?a.beatAnchor:end,
  nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
}
 // A measured late-bar bridge: no absolute silence is needed.
 // Real librosa confidence clusters around .24; .30 filtered almost everything.
 function measuredBeatBridge(a,b,dur){
  if(!a||!b||a.durationMismatch||b.durationMismatch||
     !Number.isFinite(a.duration)||Math.abs(a.duration-dur)>1.5||
     a.beatConfidence<.18||b.beatConfidence<.18||
     b.introDrive<.30||a.protectedEnding===true||
     !hasReliableHarmony(a.outroFinalNotes)||!hasReliableHarmony(b.introAttackNotes))
   return null;
  const speeds=[.5,1,2].map(k=>a.bpm/(b.bpm*k));
  const ratio=speeds.reduce((x,y)=>Math.abs(Math.log2(x))<Math.abs(Math.log2(y))?x:y);
  if(!Number.isFinite(ratio)||ratio<.955||ratio>1.045)return null;
  const groove=grooveAgreement(a,b),notes=similarNotes(a,b);
  // A matching BPM or a moderate chord-similarity score is NOT a DJ
  // match. On the Nov 3 video, 153->8 had the same BPM but conflicting
  // chords: alignment.matches=false, phrase=.46, groove=.74. Reject it.
  const key=camelotMatch(a,b);
  const keyCompatible=key.weight<.10||key.score>=.52;
  const chordSequence=notes.alignment?.matches===true;
  const staticException=!notes.alignment&&notes.matches===true&&
   notes.focused>=.91&&notes.phrase>=.87;
  const longMusicalMatch=Boolean(keyCompatible&&groove?.score>=.80&&
   notes.matches===true&&notes.focused>=.79&&notes.phrase>=.68&&
   (chordSequence||staticException));
  // Real final drums and the opening chord can match even when a
  // long three-point chord progression does not. Such a boundary only
  // earns a SHORT blend, never a 4-second fade or an early trim.
  const measuredBoundary=Boolean(notes.alignment&&
   Number(notes.alignment.score)>=.73&&
   Number(notes.alignment.weakest)>=.50&&
   Number(notes.focused)>=.77&&Number(notes.phrase)>=.66&&
   groove?.score>=.80);
  const exceptionalEdge=notes.focused>=.91&&
   notes.phrase>=.86&&groove?.score>=.88;
  const shortMusicalMatch=Boolean(keyCompatible&&groove?.score>=.78&&
   notes.focused>=.74&&notes.phrase>=.63&&
   (chordSequence||measuredBoundary||exceptionalEdge||
    (!notes.alignment&&notes.matches===true)));
  if(!longMusicalMatch&&!shortMusicalMatch)return null;
  const end=clamp((Number.isFinite(a.last)?a.last:dur)+.055,25,dur-.035);
  if(end<26||dur-end>13||!certifiedMixBoundary(a,dur,end)||
     (Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>end-7)||
     (Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>end-4.6)||
     (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<2.6)||
     (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<2.6))return null;
  const voiceProof=Boolean((Number.isFinite(a.lastLyricAt)&&a.lastLyricAt<=end-9)||
     (a.voiceModel&&a.voiceScannedEnd>=end-1&&
      (!Number.isFinite(a.lastVoiceAt)||a.lastVoiceAt<=end-6.5)));
  const safe=voiceProof&&longMusicalMatch;
  const snapFade=clamp(1.75*60/a.bpm,.63,1.10);
  const fade=safe?3.95:snapFade,begin=end-fade;
  const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
  const trim=Boolean(a.confidentTail&&dur-a.last>=1.65);
  return {entry,begin,end,fade,kind:safe?"beat":"snap",tempo:clamp(ratio,.97,1.03),
   gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
   score:Math.round((notes.score||notes.focused)*100),
   grooveScore:groove.score,measuredBeatBridge:true,
   preserveTail:true,quietCertified:safe,safeOutroAt:safe?begin:null,
   verifiedHarmonicBridge:longMusicalMatch,verifiedMicroBeat:shortMusicalMatch,
   silenceTrim:trim,softTailTrim:false,trailing:trim?dur-end:0,
   beatPeriod:60/a.bpm,beatAnchor:Number.isFinite(a.beatAnchor)?a.beatAnchor:end,
   nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
 }
// A four-second average can claim a strong intro even when its FIRST
// bars are nearly silent. Such a preview creates the audible hole seen
// in the 22:30 screen recordings. Certify the point where we actually play.

function musicalIntroEntry(b){
 const saved=Number.isFinite(b?.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
 // A measurable driven intro after digital silence deserves an accurate cue.
 if(!b||!Number.isFinite(b.first)||b.first-saved<=1.3||
    b.first>12.5||Number(b.introDrive)<.43||
    !(Number(b.beatConfidence)>=.16)||
    (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<b.first-.2)||
    (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<b.first-.2))return saved;
 return clamp(b.first-.12,saved,18);
}
// This is a short two-pulse overlap, not a claim of identical full phrases.
// The incoming music enters under the complete outgoing audio boundary.
// The closing instrumental beat can be mixed WHILE audible. Protected
// endings are preserved, not treated as digital silence to be skipped.
// Missing vocal metadata NEVER implies a voice-free finale.
function rhythmicFullTailJoin(a,b,dur){
 if(!a||!b||a.durationMismatch||b.durationMismatch||
    !Number.isFinite(a.duration)||Math.abs(a.duration-dur)>1.5||
    !Number.isFinite(a.last)||
    (a.last<dur-1.6&&!(a.confidentTail===true&&dur-a.last<=12))||
    !Number.isFinite(a.bpm)||!Number.isFinite(b.bpm)||
    a.beatConfidence<.16||b.beatConfidence<.16||
    b.introDrive<.43||
    !hasReliableHarmony(a.outroFinalNotes)||
    !hasReliableHarmony(b.introAttackNotes)||
    (Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>=a.last-5)||
    (Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>=a.last-6)||
    (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<2)||
    (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<2))return null;
 const ratio=[.5,1,2].map(k=>a.bpm/(b.bpm*k)).reduce(
  (best,v)=>Math.abs(Math.log2(v))<Math.abs(Math.log2(best))?v:best);
 if(!Number.isFinite(ratio)||ratio<.95||ratio>1.05)return null;
 const groove=grooveAgreement(a,b),notes=similarNotes(a,b);
 if(!groove||groove.score<.77||
    !Number.isFinite(notes.focused)||notes.focused<.50||
    !Number.isFinite(notes.phrase)||notes.phrase<.35)return null;
 const key=camelotMatch(a,b);
 const percussiveOnly=key.weight>=.14&&key.score<.40;
 if(percussiveOnly&&!(groove.score>=.89&&notes.focused>=.76&&
   notes.phrase>=.64))return null;
 if(!notes.matches&&!(groove.score>=.85&&notes.focused>=.72&&
    notes.phrase>=.60&&(!notes.alignment||notes.alignment.matches||
      (notes.focused>=.91&&notes.phrase>=.86))))return null;
 const trimmed=Boolean(a.confidentTail===true&&
    dur-a.last>=1.65&&dur-a.last<=12);
 const end=trimmed?Math.min(dur-.035,a.last+.07):dur-.035;
 const lyricSafe=Number.isFinite(a.lastLyricAt)&&a.lastLyricAt<=end-9;
 const scanned=Boolean(a.voiceModel&&Number.isFinite(a.voiceScannedEnd)&&
    a.voiceScannedEnd>=end-.8&&
    (!Number.isFinite(a.lastVoiceAt)||a.lastVoiceAt<=end-6));
 const verified=Boolean((lyricSafe||scanned)&&groove.score>=.82&&
    notes.focused>=.72&&notes.phrase>=.56&&
    (!key.weight||key.score>=.48));
 // Longer beat-to-beat crossfade only for a certified instrumental outro.
 // Otherwise the next kick enters at low volume over just 2-3 beats,
 // with the outgoing music fully audible until very close to its ending.
 const fade=verified?clamp(7*60/a.bpm,3.1,4.5):
    clamp(1.8*60/a.bpm,.62,1.05);
 const begin=end-fade;
 if(begin<25)return null;
 const entry=musicalIntroEntry(b);
 return {kind:verified?"beat":"snap",begin,end,fade,entry,
   tempo:clamp(ratio,.97,1.03),
   gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
   score:Math.round(notes.focused*100),grooveScore:groove.score,
   rhythmicUnderlay:true,percussiveOnly,measuredBeatBridge:true,preserveTail:true,
   vocalVerifiedBeat:verified,verifiedMicroBeat:true,
   verifiedHarmonicBridge:verified&&notes.matches===true,
   silenceTrim:trimmed,softTailTrim:false,quietCertified:false,
   trailing:trimmed?dur-end:0,safeOutroAt:null,
   beatPeriod:60/a.bpm,beatAnchor:Number.isFinite(a.beatAnchor)?a.beatAnchor:end,
   nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
}
// Desktop continuity when a strict musical match is unavailable.
// Never claim this as a matched beat; keep the outgoing song audible
// nearly to its natural ending, while the next song rises below it.
// Beat-grid aligned SUBDUED preview: preserves the complete outgoing
// sound, uses two measured periodic pulses and checks the incoming chords.
// Never claim identical drums and never cut an uncertain sung ending.
function measuredPulseUnderlay(a,b,dur){
 if(!a||!b||a.durationMismatch||b.durationMismatch||
    !Number.isFinite(a.duration)||Math.abs(a.duration-dur)>1.5||
    !Number.isFinite(a.last)||a.last<28||
    !(a.last>=dur-1.6||(a.confidentTail&&dur-a.last<=12))||
    !Number.isFinite(a.bpm)||!Number.isFinite(b.bpm)||
    a.beatConfidence<.19||b.beatConfidence<.19||
    b.introDrive<.39||!hasImmediateMusicalIntro(b)||
    (Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>=a.last-6)||
    (Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>=a.last-4.5)||
    (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<2)||
    (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<2))return null;
 const ratio=a.bpm/b.bpm;
 if(ratio<.97||ratio>1.03)return null;
 const pa=onsetPeriodicity(a.outroOnset,a.bpm);
 const pb=onsetPeriodicity(b.introOnset,b.bpm);
 if(!Number.isFinite(pa)||!Number.isFinite(pb)||pa<.18||pb<.18)return null;
 const notes=similarNotes(a,b),g=grooveAgreement(a,b),key=camelotMatch(a,b);
 if(!g||g.score<.77||g.correlation<.54||
    !Number.isFinite(notes.focused)||notes.focused<.72||
    !Number.isFinite(notes.phrase)||notes.phrase<.55||
    (key.weight>=.14&&key.score<.55))return null;
 const end=Math.min(dur-.035,a.last+.055);
 const fade=Math.max(.62,Math.min(1.04,1.65*60/a.bpm));
 const begin=end-fade;
 if(begin<28||end>dur||end<=begin)return null;
 const edge=a.dropRelease?
  Math.min(a.last,a.dropRelease.lastImpactAt+.20):a.last;
 const lastGridStart=Math.max(0,edge-4);
 const firstGridStart=Number.isFinite(b.safeIntroAt)?b.safeIntroAt:0;
 const entry=musicalIntroEntry(b);
 const trim=a.confidentTail===true&&dur-a.last>=1.65;
 return {kind:"snap",pulseUnderlay:true,rhythmicUnderlay:true,
  measuredBeatBridge:true,preserveTail:true,verifiedMicroBeat:true,
  begin,end,fade,entry,tempo:ratio,gain:1,
  quietCertified:false,safeOutroAt:null,silenceTrim:trim,
  trailing:trim?dur-end:0,
  score:Math.round(notes.focused*100),grooveScore:g.score,
  pulseConfidence:Math.min(pa,pb),beatPeriod:60/a.bpm,
  beatAnchor:lastGridStart+onsetGridPhase(a.outroOnset,a.bpm),
  nextBeat:firstGridStart+onsetGridPhase(b.introOnset,b.bpm)-entry};
}
function continuityFallback(a,b,actualDuration){
 const dur=Number(actualDuration);
 if(isIOS||!Number.isFinite(dur)||dur<26||
    a?.durationMismatch===true||
    (Number.isFinite(a?.duration)&&Math.abs(a.duration-dur)>1.5))return null;
 // An indexed song whose ending is NOT certified silent must keep
 // playing through its native onended event, rather than fade over an
 // unrelated intro and silently discard its last notes.
 if(a&&Number.isFinite(a.duration)&&
    !(a.confidentTail===true&&Number.isFinite(a.last)&&
      dur-a.last>=1.65&&dur-a.last<=12))return null;
 const last=Number(a?.last);
 const trimmed=Boolean(a?.confidentTail===true&&Number.isFinite(last)&&
    dur-last>=1.65&&dur-last<=12&&a?.protectedEnding!==true&&
    (!Number.isFinite(a?.lastVoiceAt)||a.lastVoiceAt<last-.75)&&
    (!Number.isFinite(a?.lastLyricAt)||a.lastLyricAt<last-.75));
 const end=trimmed?Math.min(dur-.18,last+.15):dur-.18;
 const fade=end>34?2.55:1.55;
 return {kind:"continuity",continuityFallback:true,
   begin:end-fade,end,fade,entry:b?musicalIntroEntry(b):0,
   tempo:1,gain:1,preserveTail:true,quietCertified:false,
   score:null,grooveScore:null,
   silenceTrim:trimmed,trailing:trimmed?dur-end:0,
   safeOutroAt:null};
}
function hasImmediateMusicalIntro(b){
 if(!b||(Number.isFinite(b.introDrive)&&b.introDrive<.33))return false;
 const entry=musicalIntroEntry(b);
 // A verified digital-silence trim is fine; a quiet atmospheric passage
 // before the first real note must NOT be mistaken for the opening beat.
 if(Number.isFinite(b.first)&&b.first-entry>1.3)return false;
 const groove=b.introGroove;
 if(Array.isArray(groove)&&groove.length===32){
  const mean=arr=>arr.reduce((s,v)=>s+v,0)/arr.length;
  const early=mean(groove.slice(0,8));
  const later=mean(groove.slice(8,24));
  if(early<-.85&&later-early>.85)return false;
 }
 // introBeat is the STRONGEST onset within 12 seconds, not the
 // first musical sound. Its timing must not veto an opening that is
 // already audible and rhythmically driven from its first measure.
 // Genuine pre-music gaps are rejected above using 'first' and groove.
 return true;
}
function transition(a,b,actualDuration){
 const dur=Number(actualDuration);
 if(!Number.isFinite(dur)||dur<26||!a||!b||
    a.durationMismatch||b.durationMismatch||!Number.isFinite(a.duration)||
    Math.abs(a.duration-dur)>1.5||!hasImmediateMusicalIntro(b))return null;
 const openingEntry=musicalIntroEntry(b);
 if(openingEntry!==(Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0))
  b={...b,safeIntroAt:openingEntry};
 const activeBeat=strongInstrumentalBeatBridge(a,b,dur);
 if(activeBeat)return activeBeat;
 const measured=measuredBeatBridge(a,b,dur);
 if(measured)return measured;
 const scannedSnap=verifiedInstrumentalSnap(a,b,dur);
 if(scannedSnap)return scannedSnap;
 const pulse=measuredPulseUnderlay(a,b,dur);
 if(pulse)return pulse;
 // First try a MUSICAL phrase bridge: last significant drop/beat is
 // protected, the remaining release is genuinely quiet, and the next
 // track starts with music rather than another quiet passage.
 // It is better to leave a track intact than manufacture a bad transition.
 const release=a.dropRelease;
 // The last karaoke timestamp is the *start* of a lyric line, not the
 // end of the singer's voice. An absolute "12 seconds from last lyric"
 // veto used to reject a genuine settled fade (recording 2026-11-02).
 // After the final measured beat has clearly decayed, allow only a short,
 // neutral overlap. Never seek over the old ending or mix across a new
 // late vocal detection.
 const decayEnd=clamp(Number(a.last)+.07,13,dur-.025);
 const decayVerified=release&&a.protectedEnding!==true&&
   Number.isFinite(release.releaseAt)&&
   release.releaseAt<=decayEnd-3.4&&
   Number.isFinite(release.quietLevel)&&release.quietLevel<=.20&&
   release.score>=.76;
 const vocalLate=Number.isFinite(a.lastLyricAt)&&
   a.lastLyricAt>=decayEnd-12;
 if(decayVerified&&vocalLate&&
    a.lastLyricAt<=release.releaseAt+.5&&
    (!Number.isFinite(a.lastVoiceAt)||
      a.lastVoiceAt<=release.releaseAt+.6)&&
    (b.introDrive===undefined||b.introDrive>=.33)){
  // Four seconds after the last LRC onset leaves room for the whole
  // sung phrase; a model-detected voice end needs its own 1.8s margin.
  const begin=Math.max(release.releaseAt+1.5,
    a.lastLyricAt+4,
    Number.isFinite(a.lastVoiceAt)?a.lastVoiceAt+1.8:0,
    decayEnd-5.5);
  const fade=decayEnd-begin;
  if(fade>=2.5&&fade<=5.5){
   const trim=Boolean(a.confidentTail&&a.last<dur-1.65);
   return {entry:Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0,
    begin,end:decayEnd,fade,kind:"soft",tempo:1,gain:1,
    silenceTrim:trim,softTailTrim:false,
    trailing:trim?Math.max(0,dur-a.last):0,
    safeOutroAt:begin,quietCertified:true,
    neutralRelease:true,verifiedDecayAfterLyrics:true,
    decayReleaseAt:release.releaseAt,dropReleaseBridge:false,
    score:null};
  }
 }
 if(release&&release.releaseAt<a.last-2.1&&a.protectedEnding!==true&&
    b.introDrive>=.33&&a.beatConfidence>=.17&&b.beatConfidence>=.17){
  const lateSinging=(Number.isFinite(a.lastLyricAt)&&
      a.lastLyricAt>=release.releaseAt-3)||
    (Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>=release.releaseAt-3);
  const nextVocal=(Number.isFinite(b.firstLyricAt)&&
     b.firstLyricAt<=2.6)||(Number.isFinite(b.firstVoiceAt)&&
     b.firstVoiceAt<=2.6);
  const notes=similarNotes(a,b),groove=grooveAgreement(a,b);
  const bpmA=Number(a.bpm),bpmB=Number(b.bpm);
  const ratios=[.5,1,2].map(scale=>bpmA/(bpmB*scale));
  const ratio=ratios.reduce((best,r)=>Math.abs(Math.log2(r))<
    Math.abs(Math.log2(best))?r:best,ratios[0]);
  const harmonyStrong=notes.matches&&Number(notes.focused)>=.74&&
    Number(notes.phrase)>=.55&&
    (!notes.alignment||notes.alignment.matches);
  // No "silence vs silence" match. Require a driven beginning and the
  // real final beat groove, not just an approximate global key.
  const compatible=ratio>=.95&&ratio<=1.05&&
    groove?.score>=.73&&harmonyStrong;
  // A decay measured on the genuine audio allows the next intro to enter
  // *during the musical release*, even without encoded digital silence.
  // Never truncate the outgoing song's last audible samples.
  const instrumentalTailProven=Number.isFinite(a.lastLyricAt)&&
    a.lastLyricAt<=release.releaseAt-3;
  const measuredQuiet=Number.isFinite(release.quietLevel)&&
    release.quietLevel<=.23&&release.score>=.67&&
    a.protectedEnding!==true;
  if(compatible&&!lateSinging&&!nextVocal&&
     (!isIOS||instrumentalTailProven||measuredQuiet)){
   const end=clamp(a.last+.07,13,dur-.025);
   const begin=Math.max(release.releaseAt,
     release.lastImpactAt+1.05,end-5.7);
   const fade=end-begin;
   if(fade>=2.35&&fade<=6.3){
    const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
    const kind=fade<3.5?"soft":"beat";
    const trim=Boolean(a.confidentTail&&a.last<dur-1.65);
    return {entry,begin,end,fade,kind,
      tempo:kind==="beat"?clamp(ratio,.97,1.03):1,
      gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
      score:Math.round((notes.score??.8)*100),grooveScore:groove.score,
      silenceTrim:trim,softTailTrim:false,
      quietCertified:instrumentalTailProven||measuredQuiet,safeOutroAt:begin,
      trailing:trim?Math.max(0,dur-a.last):0,dropReleaseBridge:true,
      beatPeriod:kind==="beat"?60/bpmA:null,beatAnchor:release.lastImpactAt,
      nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
   }
  }
 }
 // A long quiet break with a brief LOUD return is a different case.
 // Do not mistake the returning music for safe silence. Only an ending
 // already verified as instrumental (timed last lyric or a full vocal
 // scan with no late vocal detection) may be abbreviated.
 const lateBreak=a.outroBreak;
 if(lateBreak&&lateBreak.end<dur-1){
  const lyricSafe=Number.isFinite(a.lastLyricAt)&&
   a.lastLyricAt<=lateBreak.start-4.5;
  const lateVoice=Number.isFinite(a.lastVoiceAt)&&
   a.lastVoiceAt>=lateBreak.start-4.5;
  // A missed voice event is never proof of an instrumental outro.
  const gapVoiceFree=false;
  const harmony=similarNotes(a,b),rhythm=grooveAgreement(a,b);
  const bpmA=Number(a.bpm),bpmB=Number(b.bpm);
  const speed=bpmA>0&&bpmB>0?
   [.5,1,2].map(scale=>bpmA/(bpmB*scale))
   .reduce((best,r)=>Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best):1;
  // A matched beat and a matched chord boundary are required. These
  // conditions distinguish a useful DJ handoff from merely skipping audio.
  if((lyricSafe||gapVoiceFree)&&!lateVoice&&(b.introDrive===undefined||b.introDrive>=.32)&&
     harmony.matches&&harmony.focused>=.77&&rhythm?.score>=.79&&
     a.beatConfidence>=.2&&b.beatConfidence>=.2&&
     speed>=.96&&speed<=1.04){
   const start=lateBreak.start,end=lateBreak.end;
   const begin=lateBreak.fadeStart,entry=
    Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
   return {entry,begin,end,fade:end-begin,
    kind:style==="auto"?"beat":style,
    tempo:clamp(speed,.97,1.03),
    gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
    score:Math.round((harmony.score??.8)*100),
    grooveScore:rhythm.score,
    silenceTrim:true,softTailTrim:true,
    quietCertified:true,safeOutroAt:begin,trailing:dur-end,
    lateInstrumentalBreak:true,outroGapStart:start,
    beatPeriod:60/bpmA,beatAnchor:lateBreak.beatAnchor,
    nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
  }
 }
 // If the final passage contains a long quiet valley followed only by
 // very subdued audio, hand off near the START of the valley, not at
 // the end of the encoded MP3. This path requires BPM AND harmony.
 const gap=a.outroGap;
 if(gap&&gap.end<dur-1.5){
  const protectedVoice=Number.isFinite(a.lastVoiceAt)&&
    a.lastVoiceAt>=gap.start-3.5;
  const protectedLyrics=Number.isFinite(a.lastLyricAt)&&
    a.lastLyricAt>=gap.start-3.5;
  const beatDistance=bpmGap(a,b);
  const notes=similarNotes(a,b);
  const keys=camelotMatch(a,b);
  const matching=notes.matches||
    (notes.focused>=.78&&notes.phrase>=.68&&keys.score>=.90);
  if(!protectedVoice&&!protectedLyrics&&(b.introDrive===undefined||b.introDrive>=.32)&&matching&&beatDistance<=10&&
     a.beatConfidence>=.12&&b.beatConfidence>=.12){
   const bpmA=Number(a.bpm),bpmB=Number(b.bpm);
   const ratios=[.5,1,2].map(scale=>bpmA/(bpmB*scale));
   const ratio=ratios.reduce((best,r)=>
    Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best,ratios[0]);
   const beatMix=ratio>=.94&&ratio<=1.06;
   const end=clamp(gap.end,18,dur-1.0);
   const begin=clamp(gap.fadeStart,0,end-3);
   const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
   return {entry,begin,end,fade:end-begin,
    kind:beatMix?"beat":"soft",
    tempo:beatMix?clamp(ratio,.97,1.03):1,
    gain:a.level&&b.level?clamp(a.level/b.level,.87,1.13):1,
    score:Math.round((notes.score??.8)*100),
    // The quiet interval begins *after* the musical release; keep
    // the preview audible while the old outro settles.
    silenceTrim:true,softTailTrim:true,quietCertified:true,
    safeOutroAt:begin,trailing:dur-end,
    beatPeriod:beatMix?60/bpmA:null,
    beatAnchor:beatMix?gap.beatAnchor:null,
    nextBeat:beatMix?(Number.isFinite(b.introBeat)?b.introBeat-entry:null):null,
    outroGapStart:gap.start};
  }
 }
 const digital=Boolean(a.confidentTail&&a.last<dur-1.65);
 const weak=a.softOutro;
 const protectedTail=weak&&(
  (Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>=weak.start-2)||
  (Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>=weak.start-2));
 const soft=Boolean(!digital&&weak&&!protectedTail&&weak.end<dur-1.65);
 const trim=digital||soft;
 const musicalEnd=digital?Math.min(dur,a.last):soft?weak.end:dur;
 // Never jump ahead into a quiet, real introduction.
 const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
 let end=clamp(musicalEnd+(trim?.07:-.04),13,dur-.025);
 let safe=Number.isFinite(a.safeOutroAt)?clamp(a.safeOutroAt,0,end):
  soft?clamp(weak.fadeStart,0,end):null;
 // Timed karaoke can reveal a full instrumental outro even when its
 // drums remain loud. Keep a generous 8-second margin after the last lyric.
 // If the last phrase is too near the end, don't overlap it at all.
 if(Number.isFinite(a.lastLyricAt)){
  if(end-a.lastLyricAt<12)safe=end;
  else if(end-a.lastLyricAt>=18){
   const lyricalExit=Math.max(a.lastLyricAt+8,end-8);
   safe=safe===null?lyricalExit:Math.max(safe,lyricalExit);
  }else if(safe!==null)safe=Math.max(safe,a.lastLyricAt+8);
  if(safe!==null)safe=Math.min(end,safe);
 }
 // Model detections are a safety veto. No detection is NOT evidence of no vocals.
 if(Number.isFinite(a.lastVoiceAt)){
  const voiceEnd=clamp(a.lastVoiceAt,0,end);
  if(end-voiceEnd<12)safe=end;
  else safe=safe===null?Math.max(voiceEnd+6,end-8):
   Math.max(safe,voiceEnd+6);
  safe=Math.min(end,safe);
 }
 const notes=similarNotes(a,b);
 // A transient alone does NOT prove that a final note, reverb tail or
 // syllable can be cut. Keep the entire audible ending. Blend only inside
 // a verified quiet tail; cut only verified digital silence (trim below).
 // lastNoteAt remains useful as harmonic onset metadata.
 const available=safe===null?0:end-safe;
 const common={entry,tempo:1,gain:1,score:null,silenceTrim:trim,
   trailing:trim?Math.max(0,dur-musicalEnd):0,safeOutroAt:safe,
   // Unlike desktop, the iPhone cannot reliably attenuate native playback.
   // Only overlay when the audio analysis itself found a settled quiet outro.
   quietCertified:Number.isFinite(safe)&&(Number.isFinite(a.safeOutroAt)||soft),
    softTailTrim:soft};
 // Reject silence-versus-silence even in the legacy crossfade paths.
 // The opening may be soft music: preserve it without an overlap.
 if(Number.isFinite(b.introDrive)&&b.introDrive<.30)
  return trim?{...common,begin:end,end,fade:0,kind:"cut"}:null;
 // Leave the actual song intact if we cannot prove there is a safe outro.
 // Verified silence can be skipped only AFTER the last audible part.
 if(available<1.75){
  // A protected full-tail bridge on desktop: play the next harmonic intro
  // quietly underneath the last chord without cutting the original early.
  // Never trigger if timed lyrics or the voice detector report late singing.
  const bpmA=Number(a.bpm)||120,bpmB=Number(b.bpm)||120;
  const tempoDelta=Math.min(...[.5,1,2].map(scale=>
   Math.abs(Math.log2(bpmA/(bpmB*scale)))));
  const vocalLate=(Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>end-5)||
   (Number.isFinite(a.lastLyricAt)&&a.lastLyricAt>end-6);
  const nextStartsVocal=(Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<3.5)||
   (Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<3.5);
  const groove=grooveAgreement(a,b);
  const harmonicProof=notes.matches&&notes.focused>=.80&&
    notes.phrase>=.68&&(!notes.alignment||notes.alignment.matches);
  const key=camelotMatch(a,b);
  const rhythmProof=(groove&&groove.score>=.70)||
    (notes.alignment?.matches&&notes.alignment.score>=.84);
  const canBridge=a.protectedEnding!==true&&
   (b.introDrive===undefined||b.introDrive>=.30)&&
   a.outroFinalNotes&&b.introAttackNotes&&
   a.beatConfidence>=.20&&b.beatConfidence>=.20&&
   harmonicProof&&rhythmProof&&(!key.weight||key.score>=.55)&&
   tempoDelta<=.07&&!vocalLate&&!nextStartsVocal;
  if(canBridge){
   const seconds=notes.alignment?.matches?
    clamp(notes.alignment.fade,3.65,5.2):
    clamp(8*60/bpmA,3.65,4.7);
   const tempoRatio=[.5,1,2].map(scale=>bpmA/(bpmB*scale))
    .reduce((best,r)=>Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best);
   // A loud beat bridge on iPhone is only safe when karaoke or a vocal
   // classifier has verified that the singing ended before this section.
   const verifiedInstrumentalEnd=(Number.isFinite(a.lastLyricAt)&&
     a.lastLyricAt<=end-seconds-2);
   const mobileSafe=Boolean(verifiedInstrumentalEnd&&groove?.score>=.80);
   if(!isIOS||mobileSafe){
    return {...common,begin:end-seconds,end,fade:seconds,
     kind:style==="auto"?"beat":style,
     tempo:clamp(tempoRatio,.97,1.03),
     quietCertified:mobileSafe,strongBeatBridge:true,
     safeOutroAt:end-seconds,
     softTailTrim:false,score:Math.round(notes.score*100),
     grooveScore:groove?.score??null,
     beatPeriod:60/bpmA,beatAnchor:a.beatAnchor,
     nextBeat:Number.isFinite(b.introBeat)?b.introBeat-entry:null};
   }
  }
  const shortJoin=rhythmicFullTailJoin(a,b,dur);
  if(shortJoin)return shortJoin;
  return trim?{...common,begin:end,end,fade:0,kind:"cut"}:null;
 }
 const bpm=Number(a.bpm)||120;
 const ratios=b.bpm?[.5,1,2].map(mult=>bpm/(b.bpm*mult)):[1];
 const ratio=ratios.reduce((best,r)=>
  Math.abs(Math.log2(r))<Math.abs(Math.log2(best))?r:best,ratios[0]);
 const beatClose=a.beatConfidence>=.13&&b.beatConfidence>=.13&&
  ratio>=.94&&ratio<=1.06;
 const tailHarmony=a.outroChroma||a.chroma;
 const headHarmony=b.introChroma||b.chroma;
 const reliable=hasReliableHarmony(tailHarmony)&&hasReliableHarmony(headHarmony);
 const harmonic=reliable?compatibility({chroma:tailHarmony},{chroma:headHarmony}):null;
 const compatible=beatClose&&notes.matches&&harmonic!==null&&harmonic>=.75;
 // Similar BPM alone is not enough to overlap mismatched notes.
 if(!notes.matches){
  // An incompatible chord boundary should not create a long two-key mix.
  // But a *measured* decaying outro is already too quiet to warrant
  // waiting through the entire encoded MP3. Let the next song enter with
  // a short neutral fade after the final impact, never a fake beatmatch.
  // The outgoing song is still played through its last audible samples.
  const release=a.dropRelease;
  const measuredSettledRelease=Boolean(release&&
   Number.isFinite(release.quietLevel)&&release.quietLevel<=.23&&
   release.score>=.67&&a.protectedEnding!==true&&
   Number.isFinite(safe)&&safe>=release.releaseAt-.2&&
   (!Number.isFinite(a.lastVoiceAt)||a.lastVoiceAt<=safe-1.5)&&
   (!Number.isFinite(a.lastLyricAt)||a.lastLyricAt<=safe-1.5));
  const quiet=measuredSettledRelease||a.quietTail===true||soft;
  if(quiet&&(b.introDrive===undefined||b.introDrive>=.30)&&
     Number.isFinite(safe)&&available>=2.6){
   const duration=Math.min(measuredSettledRelease?5.0:2.6,available-.12);
   return {...common,begin:end-duration,end,fade:duration,kind:"soft",
    quietCertified:common.quietCertified||measuredSettledRelease,
    neutralRelease:measuredSettledRelease};
  }
  return trim?{...common,begin:end,end,fade:0,kind:"cut"}:null;
 }
 const earlyNextVoice=(Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<8)||
  (Number.isFinite(b.firstVoiceAt)&&b.firstVoiceAt<8);
 const longMix=compatible&&(b.introDrive===undefined||b.introDrive>=.30)&&available>=4.4&&!earlyNextVoice;
 // Incompatible tracks: at most a discreet fade in a confirmed quiet tail.
 const kind=style==="auto"?(longMix?"beat":"soft"):style;
 const requestedBase=kind==="beat"?
  clamp(4*4*60/bpm,4.5,8):style==="auto"?2.8:mixSeconds;
 // Limit the fade to the region whose harmony was checked.
 const requested=notes.alignment?.matches?
  Math.min(requestedBase,notes.alignment.fade+.35):requestedBase;
 const fade=clamp(Math.min(requested,available-.08),1.5,Math.min(10,end-8));
 if(fade<1.6)return trim?{...common,begin:end,end,fade:0,kind:"cut"}:null;
 let begin=end-fade;
 if(kind==="beat"&&a.beatAnchor&&a.beatConfidence>=.13){
  const period=60/bpm;
  begin+=clamp(a.beatAnchor+Math.round((begin-a.beatAnchor)/period)*period-begin,-.20,.20);
 }
 begin=clamp(begin,safe,end-1.5);
 const effectiveFade=end-begin;
 const finalKind=kind==="beat"&&effectiveFade<3.5?"soft":kind;
 const tempo=beatClose&&finalKind==="beat"?clamp(ratio,.97,1.03):1;
 const gain=a.level&&b.level?clamp(a.level/b.level,.87,1.13):1;
 // Beat phase and tempo are distinct: align using a tiny playback delay
 // rather than seeking forward and losing the next song's opening notes.
 const beatPeriod=finalKind==="beat"&&a.beatConfidence>=.2&&
  b.beatConfidence>=.2?60/bpm:null;
 const beatAnchor=beatPeriod&&Number.isFinite(a.beatAnchor)?a.beatAnchor:null;
 const nextBeat=beatPeriod&&Number.isFinite(b.introBeat)?b.introBeat-entry:null;
 return {...common,begin,end,fade:effectiveFade,kind:finalKind,tempo,gain,
  beatPeriod,beatAnchor,nextBeat,
  score:notes.score===null?null:Math.round(notes.score*100)};
}
// Circle of fifths/Camelot: minor A, major B.
const CAM_A=[5,12,7,2,9,4,11,6,1,8,3,10],CAM_B=[8,3,10,5,12,7,2,9,4,11,6,1];
function camelotEstimate(ch){
 if(!Array.isArray(ch)||ch.length!==12||ch.some(v=>!Number.isFinite(v)))return null;
 const avg=ch.reduce((s,v)=>s+v,0)/12;
 const norm=Math.hypot(...ch.map(v=>v-avg));
 if(norm<.014)return null;
 const profiles=[
  ["B",[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]],
  ["A",[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]]];
 const guesses=[];
 for(const [mode,p] of profiles){
  const mean=p.reduce((s,v)=>s+v,0)/12;
  const denom=norm*Math.hypot(...p.map(v=>v-mean));
  for(let pitch=0;pitch<12;pitch++){
   let score=0;
   for(let j=0;j<12;j++)score+=(ch[(j+pitch)%12]-avg)*(p[j]-mean);
   guesses.push({mode,pitch,score:score/(denom||1)});
  }
 }
 guesses.sort((a,b)=>b.score-a.score);
 const best=guesses[0],second=guesses[1];
 if(best.score<.25)return null;
 const confidence=clamp((best.score-.18)*1.15+(best.score-second.score)*1.4,0,1);
 return {code:String((best.mode==="A"?CAM_A:CAM_B)[best.pitch])+best.mode,
  mode:best.mode,pitch:best.pitch,confidence};
}
function keyGuess(ch){
 const k=camelotEstimate(ch);
 return k?KEY_NAMES[k.pitch]+(k.mode==="A"?" minore":" maggiore")+
  " · "+k.code+" (stima)":null;
}
function camelotMatch(a,b){
 const key=x=>{
  const v=x?.camelot;
  if(typeof v==="string"&&/^(?:[1-9]|1[0-2])[AB]$/.test(v))
   return {code:v,confidence:1};
  if(v?.code&&/^(?:[1-9]|1[0-2])[AB]$/.test(v.code))return v;
  return camelotEstimate(x?.chroma);
 };
 const ka=key(a),kb=key(b);
 if(!ka||!kb)return {score:.5,weight:0};
 const delta=Math.abs(parseInt(ka.code,10)-parseInt(kb.code,10));
 const distance=Math.min(delta,12-delta),same=ka.code.slice(-1)===kb.code.slice(-1);
 const score=distance===0?(same?1:.97):distance===1?(same?.92:.55):
  distance===2?(same?.40:.24):.05;
 return {score,weight:.23*Math.min(clamp(ka.confidence??1,0,1),clamp(kb.confidence??1,0,1))};
}
function bpmGap(a,b){
 const bpmA=Number(a?.bpm),bpmB=Number(b?.bpm);
 if(!(bpmA>0&&bpmB>0))return Infinity;
 return Math.min(...[.5,1,2].map(scale=>Math.abs(bpmA-bpmB*scale)));
}

function resetMobileFade(){
 if(mobileFading){
  const app=bridge(),audio=app?.audio();
  if(audio && app?.currentId()===mobileFadeTrack)
   try{audio.volume=app.volume?.()??1}catch(e){}
 }
 mobileFadeTrack="";mobileFading=false;
}
let mobileFading=false, mobileFadeTrack="";
let mobileActive=null;
let mobileMixLastBlocker="",mobileMixLastStartedAt=0;
function stopMobileMix(fadeSeconds=0){
 const act=mobileActive;mobileActive=null;
 if(!act)return;
 if(act.strongBeatBridge||act.snap)resetMobileFade();
 const release=()=>{
  try{act.old?.removeEventListener?.("pause",act.onPause)}catch(e){}
  try{act.old?.removeEventListener?.("playing",act.onPlaying)}catch(e){}
  try{act.old?.removeEventListener?.("timeupdate",act.onProgress)}catch(e){}
  try{act.old?.removeEventListener?.("seeking",act.onSeek)}catch(e){}
  try{act.source.onended=null;act.source.stop()}catch(e){}
  try{act.source.disconnect()}catch(e){}
  try{act.filter?.disconnect()}catch(e){}
  try{act.gain.disconnect()}catch(e){}
 };
 if(fadeSeconds>0&&act.ctx.state==="running"){
  try{
   const now=act.ctx.currentTime;
   act.gain.gain.cancelScheduledValues(now);
   act.gain.gain.setValueAtTime(act.gain.gain.value,now);
   act.gain.gain.linearRampToValueAtTime(0,now+fadeSeconds);
   setTimeout(release,Math.ceil(fadeSeconds*1000)+35);
   return;
  }catch(e){}
 }
 release();
}
function startMobileMix(song,p,app,old){
 const current=app?.allTracks?.()?.find(t=>t.id===app.currentId?.());
 const urlCurrent=current&&(app.mixUrl?.(current)||current.url);
 const ending=current&&(cache.get(String(urlCurrent))||deepLookup(current));
 const lastLyricAt=app?.mixLyricCues?.(app.currentId?.())?.last;
 if(!isIOS||!enabled||!mobileOverlayEnabled||document.hidden||
    mobileActive||!mobileMixAllowed(p,ending,lastLyricAt)||
    (p.kind!=="snap"&&old.currentTime<p.safeOutroAt-.1)){
   mobileMixLastBlocker="Transizione non consentita: protezione vocale o pagina inattiva";
   return false;
 }
 const ctx=app.mixRunningContext?.();
 const url=app.mixUrl?.(song)||song.url;
 const pair=app.currentId()+"|"+song.id;
 if(Date.now()<(mobileOverlayFailures.get(pair)||0)){
   mobileMixLastBlocker="Motore Safari temporaneamente indisponibile";
   return false;
 }
 const clip=mobileIntroClips.get(String(url));
 if(!ctx||ctx.state!=="running"){
   mobileMixLastBlocker="WebAudio inattivo: tocca Play con schermo acceso";
   return false;
 }
 if(!clip){
   mobileMixLastBlocker="Anteprima MP3 non ancora pronta";
   return false;
 }
 let source=null,gain=null,filter=null;
 try{
  const offset=Math.max(0,p.entry-clip.start);
  const frames=clip.channels[0].length;
  const secondsLeft=p.end-old.currentTime;
  // Do not start a crossfade so late that it would cut the next song.
  // A 2.35-second quiet fade used to have a ~200ms start window.
  // Safari needs at least 1.25s remaining to finish a late, safe blend.
  if(secondsLeft<(p.kind==="snap"?.30:1.25)||(frames/clip.rate-offset)<secondsLeft+.3){
   mobileMixLastBlocker="Punto di mix perso o introduzione troppo corta";
   return false;
  }
  const buf=ctx.createBuffer(clip.channels.length,frames,clip.rate);
  for(let c=0;c<clip.channels.length;c++)buf.copyToChannel(clip.channels[c],c);
  source=ctx.createBufferSource();gain=ctx.createGain();
  source.buffer=buf;
  // Ease the new bass into the old outro instead of doubling both kicks.
  // If a filter is unsupported, use the ordinary gain-only path.
  if(typeof ctx.createBiquadFilter==="function"){
   try{
    filter=ctx.createBiquadFilter();filter.type="highpass";
    filter.frequency.setValueAtTime(135,ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40,ctx.currentTime+Math.max(1.2,p.fade*.72));
    source.connect(filter);filter.connect(gain);
   }catch(e){try{filter?.disconnect()}catch(_){}filter=null;source.connect(gain)}
  }else source.connect(gain);
  gain.connect(ctx.destination);
  // Schedule at a measured beat phase if it costs less than 230 ms.
  // Never seek into the incoming song to fake musical alignment.
  const period=Number(p.beatPeriod);
  const phase=Number.isFinite(period)&&period>.20&&
    Number.isFinite(p.beatAnchor)&&Number.isFinite(p.nextBeat)?
    ((p.beatAnchor-old.currentTime-p.nextBeat)%period+period)%period:0;
  // Short joins last less than a second: the previous 3s gate made
  // on-beat alignment impossible for every mobile snap.
  const delay=phase>.008&&phase<=.19&&secondsLeft-phase>=.48?phase:0;
  const startedAt=ctx.currentTime+delay;
  const ramp=p.kind==="snap"?Math.max(.23,Math.min(.40,secondsLeft-delay-.08)):
   Math.max(.9,Math.min(p.fade*.72,secondsLeft-delay-.25));
  gain.gain.setValueAtTime(0,ctx.currentTime);
  // If the outgoing vocal was not scanned, NEVER duck the old song.
  // Keep the matched subsecond drum preview quiet instead.
  const lowPreview=p.kind==="snap"&&!p.voiceVerifiedMicroBridge;
  const target=clamp(app.volume?.()??1,0,1)*
   (lowPreview?.43:p.kind==="snap"?.80:p.strongBeatBridge?.60:.86);
  // Spotify-style envelopes: beat/equal power, fade/linear, rise/slow
  // start. If the iOS WebAudio implementation lacks curves, fall back
  // to a simple safe linear ramp.
  if(typeof gain.gain.setValueCurveAtTime==="function"){
   try{
    const shape=new Float32Array(48);
    for(let i=0;i<shape.length;i++){
     const u=i/(shape.length-1);
     const proportion=p.softTailTrim?Math.sin(Math.pow(u,.65)*Math.PI/2):
       p.kind==="rise"?Math.pow(u,1.7):
       p.kind==="beat"?Math.sin(u*Math.PI/2):u;
     shape[i]=target*proportion;
    }
    gain.gain.setValueCurveAtTime(shape,startedAt,ramp);
   }catch(e){gain.gain.linearRampToValueAtTime(target,startedAt+ramp)}
  }else gain.gain.linearRampToValueAtTime(target,startedAt+ramp);
  // Make the measured BPM adjustment actually audible on iPhone.
  // The last beat of the preview is always back to original speed,
  // so the native handoff has no permanent pitch/rate discontinuity.
  let rateSpeed=1,rateRamp=0;
  const rate=source.playbackRate;
  if(rate&&typeof rate.setValueAtTime==="function"&&
     typeof rate.linearRampToValueAtTime==="function"){
   const requested=clamp(Number(p.tempo)||1,.97,1.03);
   if(Math.abs(requested-1)>.002){
    rateSpeed=requested;
    rateRamp=clamp(secondsLeft*.60,.45,2.6);
    rate.setValueAtTime(requested,startedAt);
    rate.linearRampToValueAtTime(1,startedAt+rateRamp);
   }
  }
  source.start(startedAt,offset);
  mobileMixLastBlocker="";mobileMixLastStartedAt=Date.now();
  const onPause=()=>{
   if(mobileActive?.old===old&&!mobileActive.handingOff)stopMobileMix();
  };
  const onPlaying=()=>{
   if(mobileActive?.handingOff)finishMobileMix(app);
  };
  const onProgress=()=>{
   if(mobileActive?.source===source&&!mobileActive.handingOff&&
      old.currentTime>=mobileActive.end-(mobileActive.snap?.09:.40))handoffMobileMix(app);
  };
  const onSeek=()=>{
   if(mobileActive?.source===source&&!mobileActive.handingOff)stopMobileMix();
  };
  mobileActive={source,gain,filter,ctx,fromId:app.currentId(),track:song,
   entry:p.entry,started:startedAt,audioStartedAt:old.currentTime+delay,
   end:p.end,old,onPause,onPlaying,onProgress,onSeek,handingOff:false,
   handoffAt:0,nativeRetryCount:0,nativeRetryAt:0,rateSpeed,rateRamp,
   clipEnd:startedAt+frames/clip.rate-offset-(rateSpeed-1)*rateRamp/2,
   lastCtxTime:ctx.currentTime,lastAudioTime:old.currentTime,
   strongBeatBridge:!!p.strongBeatBridge,snap:p.kind==="snap",
   vocalSafe:!lowPreview};
  old.addEventListener?.("pause",onPause);
  old.addEventListener?.("playing",onPlaying);
  old.addEventListener?.("timeupdate",onProgress);
  old.addEventListener?.("seeking",onSeek);
  source.onended=()=>{
   if(mobileActive?.source===source&&!mobileActive.handingOff)stopMobileMix();
  };
  return true;
 }catch(e){
  mobileMixLastBlocker="Safari ha rifiutato il secondo audio: "+
   String(e?.message||"avvio non consentito").slice(0,120);
  mobileOverlayFailures.set(pair,Date.now()+30000);
  try{source?.stop()}catch(_){}
  try{source?.disconnect()}catch(_){}
  try{filter?.disconnect()}catch(_){}
  try{gain?.disconnect()}catch(_){}
  stopMobileMix();
  return false;
 }
}
// Convert the WebAudio wall-clock to actual MP3 playhead seconds.
// During a small BPM match the preview starts at up to +/-3% speed and
// returns smoothly to 1x before the native iPhone player takes over.
function mobilePlayedSeconds(act){
 const elapsed=Math.max(0,act.ctx.currentTime-act.started);
 const speed=Number(act.rateSpeed)||1,ramp=Number(act.rateRamp)||0;
 if(ramp<=0||speed===1)return elapsed;
 if(elapsed<=ramp)return speed*elapsed+
  (1-speed)*elapsed*elapsed/(2*ramp);
 return elapsed+(speed-1)*ramp/2;
}
function finishMobileMix(app){
  const act=mobileActive;
  if(!act||!act.handingOff)return;
  const audio=app?.audio?.();
  if(!audio||app.currentId()!==act.track.id){
   if(Date.now()>=act.timeoutAt)stopMobileMix();
   return;
  }
  // Honour explicit pauses, and retry a stalled native handoff at most twice.
  if(app.wantsPlayback?.()===false){stopMobileMix();return}
  if(audio.paused&&Date.now()-act.handoffAt>=850&&
     Date.now()<act.timeoutAt-1000&&(act.nativeRetryCount||0)<2&&
     Date.now()-(act.nativeRetryAt||0)>=1200){
   act.nativeRetryCount=(act.nativeRetryCount||0)+1;
   act.nativeRetryAt=Date.now();
   try{Promise.resolve(app.playCurrent?.()).catch(()=>{})}catch(_){}
  }
  // A second forced seek before Safari has really decoded the native MP3
  // caused buffering pauses and rewinds to 0:00. Keep the audible preview
  // until the new native clock is verified to be moving at the right place.
  if(!audio.paused&&audio.readyState>=2&&!audio.seeking){
   const heard=act.entry+mobilePlayedSeconds(act);
   if(!act.nativeSyncDone){
    const drift=heard-audio.currentTime;
    if(!Number.isFinite(drift))return;
    if(Math.abs(drift)>.85){
     // Correct at most once, and only after the source is seekable and
     // playable; never seek repeatedly across waiting/timeupdate events.
     if(!act.nativeRepairAttempted&&audio.readyState>=3&&
        audio.seekable?.length){
      act.nativeRepairAttempted=true;
      try{audio.currentTime=Math.min(heard,
        Math.max(0,(audio.duration||Infinity)-.5))}catch(_){}
     }
     return;
    }
    act.nativeSyncDone=true;
    act.nativeSyncAt=Date.now();
    act.nativeSyncTime=audio.currentTime;
    return;
   }
   if(audio.currentTime<act.nativeSyncTime-.7){
    act.nativeSyncDone=false;return;
   }
   if(Date.now()-act.nativeSyncAt>=250&&
      audio.currentTime-act.nativeSyncTime>=.15&&
      Math.abs(heard-audio.currentTime)<=1.5){
    stopMobileMix(.20);
    return;
   }
  }
  // The fallback stays bounded by the real decoded buffer, not an
  // arbitrary eight seconds which could cause a silent handoff.
  if(Date.now()>=act.timeoutAt||
     act.ctx.currentTime>=act.clipEnd-.35){
   // Do not resurrect a headset pause; recover only when the native
   // successor is still stopped despite the listener's Play intention.
   const recover=app?.currentId?.()===act.track.id&&
    app?.wantsPlayback?.()===true&&(audio.paused||audio.readyState<2);
   stopMobileMix();
   if(recover)try{Promise.resolve(app.playCurrent?.()).catch(()=>{})}catch(_){}
  }
 }
 function handoffMobileMix(app){
 const act=mobileActive;
 if(!act||act.handingOff)return;
 if(!app||app.currentId()!==act.fromId||
    app.mixNext()?.id!==act.track.id){stopMobileMix();return}
 // If WebAudio stopped progressing while the HTML player continued, never
 // hand off based on a stale preview position.
 const mediaElapsed=act.old.currentTime-act.audioStartedAt;
 const overlayElapsed=act.ctx.currentTime-act.started;
 if(act.ctx.state!=="running"||Math.abs(mediaElapsed-overlayElapsed)>.85){
  stopMobileMix();return;
 }
 act.handingOff=true;act.handoffAt=Date.now();
  act.timeoutAt=Date.now()+Math.max(1000,Math.min(15000,
   (act.clipEnd-act.ctx.currentTime-.4)*1000));
  act.nativeSyncDone=false;act.nativeRepairAttempted=false;
  act.nativeRetryCount=0;act.nativeRetryAt=0;
  const position=act.entry+mobilePlayedSeconds(act);
 Promise.resolve(app.mixHandoff(act.track.id,position))
  .catch(()=>stopMobileMix());
}
let prepared=null;
// 350ms ticks can miss sub-second junctions. Run the fast clock only
// when a beat-compatible junction is imminent and the page is visible.
let snapPrecisionTimer=null;
function stopSnapPrecision(){
 if(snapPrecisionTimer!==null){clearInterval(snapPrecisionTimer);snapPrecisionTimer=null}
}
function armSnapPrecision(audio,id){
 // Safari may tick at 650ms when a short measured quiet fade has less
 // than a second to start; arm the accurate pre-roll for that cue too.
 const eligible=!!plan&&(plan.kind==="snap"||
  (isIOS&&["beat","soft","fade","rise"].includes(plan.kind)));
 if(!eligible||mixing||!audio||audio.paused||document.hidden||
    audio.currentTime<plan.begin-3||audio.currentTime>=plan.end){
  stopSnapPrecision();return;
 }
 if(snapPrecisionTimer!==null)return;
 snapPrecisionTimer=setInterval(()=>{
  const app=bridge(),a=app?.audio?.();
  const stillEligible=!!plan&&(plan.kind==="snap"||
   (isIOS&&["beat","soft","fade","rise"].includes(plan.kind)));
  if(!enabled||!a||a!==audio||app?.currentId?.()!==id||
     !stillEligible||a.paused||a.currentTime>=plan.end||
     document.hidden||mixing){
   stopSnapPrecision();return;
  }
  try{tick()}catch(_){stopSnapPrecision()}
 },95);
}
function dropPrepared(){
 if(!prepared)return;
 const p=prepared;prepared=null;
 try{p.audio.pause();p.audio.removeAttribute("src");p.audio.load()}catch(e){}
}
function cancel(){
 stopSnapPrecision();
 stopMobileMix();
 resetMobileFade();
 if(active){
  const act=active;active=null;
  if(act.timer)clearTimeout(act.timer);
  try{act.upcoming.pause();act.upcoming.removeAttribute("src");act.upcoming.load()}catch(e){}
  try{act.original.volume=bridge()?.volume?.()??1}catch(e){}
 }
 dropPrepared();
 mixing=false;
}
function prepare(song,fromId,app){
 const url=app.mixUrl?.(song)||song.url;
 if(!url)return;
 if(prepared?.id===song.id&&prepared.fromId===fromId&&prepared.url===url){
  // A failed previous preview is not permanently "prepared".
  // Try again once after a short cooldown if the connection recovered.
  if(!prepared.failed||Date.now()-(prepared.failedAt||Date.now())<11000)return;
 }
 dropPrepared();
 const upcoming=new Audio();upcoming.preload="auto";upcoming.volume=0;
 const p={id:song.id,fromId,url,audio:upcoming,ready:false,failed:false};
 prepared=p;
 upcoming.addEventListener("canplay",()=>{if(prepared===p)p.ready=true},{once:true});
 upcoming.addEventListener("error",()=>{if(prepared===p){p.failed=true;p.ready=false;p.failedAt=Date.now();}},{once:true});
 upcoming.src=url;
 try{upcoming.load()}catch(e){p.failed=true;p.failedAt=Date.now()}
 if(upcoming.readyState>=2)p.ready=true;
}
// No verified musical match: use the ALREADY buffered next audio exactly
// at native EOF. Do not fade out the last kick or download the same MP3
// again. If prebuffer is absent, let the original ended handler run.
function naturalEndHandoff(){
 if(!enabled||isIOS||mixing||active||
    window.MusicBoxRoom?.isActive())return false;
 const app=bridge(),old=app?.audio?.(),fromId=app?.currentId?.();
 const next=app?.mixNext?.(),p=prepared;
 if(!old?.ended||!fromId||!next||!p||p.fromId!==fromId||
    p.id!==next.id||!p.ready||p.failed||p.audio?.error||
    p.audio?.readyState<2)return false;
 // Detach the preview BEFORE playById/onTrackChange removes prepared
 // media nodes. The browser's loaded MP3 is the new native player.
 const incoming=p.audio;
 prepared=null;
 (async()=>{
  try{
   if(app.currentId?.()!==fromId||app.mixNext?.()?.id!==next.id)return;
   incoming.volume=clamp(app.volume?.()??1,0,1);
   await incoming.play();
   if(app.currentId?.()!==fromId||app.mixNext?.()?.id!==next.id){
    try{incoming.pause()}catch(_){}
    return;
   }
   const adopted=app.mixAdoptHandoff?.(next.id,incoming);
   if(!adopted)throw Error("Buffered player could not be adopted");
   await adopted;
   console.info("[Music Box DJ] Fine naturale: prossimo MP3 già pronto, nessun beat tagliato",
    {outgoing:fromId,incoming:next.id});
  }catch(error){
   try{incoming.pause()}catch(_){}
   // Revert to standard native progression if autoplay/adoption fails.
   if(app.currentId?.()===fromId)
    Promise.resolve().then(()=>app.mixHandoff(next.id,0))
     .catch(e=>console.warn("[Music Box DJ] Fine naturale: ripiego fallito",e));
  }
 })();
 return true;
}

async function handoff(){
 const act=active;if(!act||act.handingOff)return;
 const app=bridge();
 if(!app||window.MusicBoxRoom?.isActive()||app.audio()!==act.original||
    app.currentId()!==act.fromId||app.mixNext()?.id!==act.track.id){cancel();return}
 const old=act.original,preview=act.upcoming,volume=app.volume();
 act.handingOff=true;
 // Desktop: hand the already playing, prebuffered audio to Music Box.
 // Re-loading and seeking that same MP3 is what caused a 1-3s pause.
 const canAdopt=Boolean(!isIOS&&typeof app.mixAdoptHandoff==="function"&&
    !preview.paused&&!preview.seeking&&preview.readyState>=2&&
    Number.isFinite(preview.currentTime)&&preview.currentTime>=act.entry+.10);
 if(canAdopt){
  try{
   const adopted=app.mixAdoptHandoff(act.track.id,preview);
   if(adopted&&app.currentId()===act.track.id&&app.audio()===preview){
    active=null;mixing=false;stopSnapPrecision();
    if(act.timer)clearTimeout(act.timer);
    try{old.pause()}catch(_){}
    try{old.removeAttribute("src");old.load()}catch(_){}
    // No cancel(): that would pause/remove src from the NEW main player.
    Promise.resolve(adopted).catch(error=>console.warn(
     "[Music Box DJ] Errore dopo adozione audio",String(error?.message||error)));
    console.info("[Music Box DJ] Cambio continuo: riutilizzo del lettore gia in riproduzione",
     {outgoing:act.fromId,incoming:act.track.id,at:preview.currentTime});
    return;
   }
  }catch(error){
   console.warn("[Music Box DJ] Adozione audio non riuscita",String(error?.message||error));
  }
 }
 // Legacy fallback, if adoption is not possible.
 // Non togliere il lettore già udibile mentre il lettore principale sta
 // ancora facendo fetch, decode e seek del nuovo MP3.
 const timeAtHandoff=Math.max(0,preview.currentTime||act.entry);
 let playJob;
 try{
  playJob=Promise.resolve(app.mixHandoff(act.track.id,timeAtHandoff));
  // Il player originale reimposta il volume in _applicaAudio(): riportalo
  // a zero finché non ha realmente un frame pronto da riprodurre.
  old.volume=0;
  const ready=()=>!old.paused&&old.readyState>=2&&
    app.currentId()===act.track.id&&!old.seeking;
  let maxWait=0;
  while(active===act&&!ready()&&maxWait<45){
   if(app.wantsPlayback?.()===false){cancel();return}
   if(app.currentId()!==act.track.id){cancel();return}
   await new Promise(resolve=>setTimeout(resolve,100));
   maxWait++;
  }
  if(active!==act||app.currentId()!==act.track.id)return;
  if(!ready()){
   // Se il nuovo player non parte, non inventare una transizione conclusa.
   // Lascia il preview udibile finché il browser lo consente.
   await Promise.race([playJob.catch(()=>{}),new Promise(r=>setTimeout(r,600))]);
  }
  if(ready()){
   // Sincronizza il nuovo player alla traccia che l'utente sta già sentendo.
   // Esegue il seek soltanto se non è già allineato e se il file è seekable.
   try{
    if(old.seekable?.length&&Math.abs(old.currentTime-preview.currentTime)>.35)
      old.currentTime=Math.min(preview.currentTime,Math.max(0,(old.duration||Infinity)-.5));
   }catch(e){}
   if(old.seeking){
    await Promise.race([new Promise(resolve=>
      old.addEventListener("seeked",resolve,{once:true})),
      new Promise(resolve=>setTimeout(resolve,1000))]);
   }
   if(active!==act||app.currentId()!==act.track.id)return;
   // Passaggio finale breve ma continuo: elimina il salto del lettore
   // precedente dopo il crossfade musicale principale.
   const t0=performance.now();
   while(active===act&&app.wantsPlayback?.()!==false&&performance.now()-t0<280){
    const p=clamp((performance.now()-t0)/280,0,1);
    old.volume=volume*p;
    preview.volume=volume*(1-p);
    await new Promise(resolve=>setTimeout(resolve,35));
   }
  }else{
   // Timeout: non tenere due stream vivi indefinitamente.
   // Il lettore principale resta quello ufficiale con volume ripristinato.
   try{old.volume=volume}catch(e){}
   toast("Il lettore ha impiegato troppo a preparare il brano successivo.");
  }
 }catch(e){
  try{old.volume=volume}catch(_){}
 }finally{
  if(active===act)cancel();
 }
}
function mixCurve(kind,t,softTail=false){
 const time=clamp(t,0,1);
 let outGain=Math.cos(time*Math.PI/2),inGain=Math.sin(time*Math.PI/2);
 if(kind==="phrase"){
  // The old release kept the outgoing song at full volume until 72% and
  // then dropped it in ~0.7s: a perceptibly abrupt swap on busy outros.
  // This smooth, broad harmonic envelope lets the instruments exchange
  // energy over the matched measures, without a sudden amplitude step.
  const smooth=x=>{const v=clamp(x,0,1);return v*v*(3-2*v)};
  outGain=Math.cos(smooth((time-.25)/.75)*Math.PI/2);
  inGain=Math.sin(smooth(time)*Math.PI/2);
 }else if(kind==="quiet"){
  // A verified soft outro is already low: lift the next music earlier
  // instead of applying a linear fade to two near-silent signals.
  inGain=Math.sin(Math.pow(time,.58)*Math.PI/2);
 }else if(kind==="fade"||kind==="soft"){outGain=1-time;inGain=time}
 else if(kind==="rise"){
  outGain=1-Math.pow(time,1.4);
  inGain=Math.pow(time,1.7);
 }
 if(softTail){outGain=1-time;inGain=Math.sin(Math.pow(time,.65)*Math.PI/2)}
 const guard=kind==="beat"?1-.12*Math.sin(Math.PI*time):kind==="phrase"?.93:1;
 return {outGain:outGain*guard,inGain:inGain*guard};
}
function quietDirectHandoff(app,audio,id,next,entry,reason){
 const pair=id+"|"+next?.id;
 if(!app||!next||!audio||audio.paused||
    app.currentId()!==id||quietHandoffFor===pair||
    window.MusicBoxRoom?.isActive())return false;
 quietHandoffFor=pair;
 cancel();plannedFor=next.id;plan=null;
 console.info("[Music Box DJ] Finale misurato: avvio diretto del prossimo brano",
  {outgoing:id,incoming:next.id,reason});
 Promise.resolve().then(()=>app.mixHandoff(next.id,entry))
  .catch(error=>console.warn("[Music Box DJ] Passaggio diretto non riuscito",String(error?.message||error)));
 return true;
}
// A phase offset over 420ms previously led to an OFF-BEAT start.
function desktopBeatStartDelay(p,at){
 if(!p||!["beat","snap","phrase"].includes(p.kind))return 0;
 const period=Number(p.beatPeriod),out=Number(p.beatAnchor),
  incoming=Number(p.nextBeat);
 if(!Number.isFinite(period)||period<.24||period>1.2||
    !Number.isFinite(out)||!Number.isFinite(incoming)||
    !Number.isFinite(at)||!Number.isFinite(p.end))return null;
 const phase=((out-at-incoming)%period+period)%period;
 const wait=phase<=.045||period-phase<=.045?0:phase;
 if(at+wait>=p.end-(p.kind==="snap"?.36:1.2))return null;
 return wait;
}
async function beginMix(song,proposed){
 const app=bridge(),old=app?.audio(),id=app?.currentId();
 if(!old||old.paused||mixing||!proposed||app.mixNext()?.id!==song.id||isIOS)return;
 const p=prepared;
 if(!p||p.failed||!p.ready||p.id!==song.id||p.fromId!==id)return;
 if(old.currentTime>proposed.end-(proposed.kind==="snap"?.25:.55))return;
 mixing=true;stopSnapPrecision();prepared=null;
 const upcoming=p.audio;
 const fade=clamp(Math.min(proposed.fade,proposed.end-old.currentTime-.08),proposed.kind==="snap"?.20:.8,12);
 const act={original:old,fromId:id,upcoming,track:song,entry:proposed.entry,
  tempo:proposed.tempo||1,kind:proposed.kind,gain:proposed.gain||1,
  softTail:!!proposed.softTailTrim,preserveTail:!!proposed.preserveTail,
  rhythmicUnderlay:!!proposed.rhythmicUnderlay,
  vocalVerifiedBeat:!!proposed.vocalVerifiedBeat,
  continuityFallback:!!proposed.continuityFallback,
  at:0,fade,end:proposed.end,timer:null};
 active=act;
 try{
  if(proposed.entry>0&&upcoming.readyState>=1){
   try{upcoming.currentTime=Math.min(proposed.entry,Math.max(0,(upcoming.duration||Infinity)-1))}
   catch(e){/* Se il provider non consente il seek, mantiene l'inizio */}
   if(upcoming.seeking){
    await Promise.race([new Promise(resolve=>
      upcoming.addEventListener("seeked",resolve,{once:true})),
      new Promise(resolve=>setTimeout(resolve,1400))]);
   }
  }
  if(active!==act||old.paused||app.currentId()!==id){cancel();return}
  if(act.tempo!==1){
   try{upcoming.preservesPitch=true;upcoming.playbackRate=act.tempo}catch(e){}
  }
  // Wait for the matching beat, or leave both song endings intact.
  const beatWait=desktopBeatStartDelay(proposed,old.currentTime);
  if(beatWait===null){cancel();plan=null;return}
  if(beatWait>.045)
   await new Promise(resolve=>setTimeout(resolve,Math.round(beatWait*1000)));
  if(active!==act||old.paused||app.currentId()!==id||
     old.currentTime>=proposed.end-(proposed.kind==="snap"?.17:1.2)){cancel();return}
  await upcoming.play();
  if(active!==act||app.currentId()!==id){cancel();return}
  console.info("[Music Box DJ] Sovrapposizione audio avviata",
   {outgoing:id,incoming:song.id,kind:proposed.kind,
    cueAt:Number(proposed.begin.toFixed(2)),actualAt:Number(old.currentTime.toFixed(2)),
    remaining:Number((old.duration-old.currentTime).toFixed(2)),
    entry:proposed.entry,seconds:act.fade.toFixed(2),
    certifiedRelease:!!proposed.liveQuietCertified,
    continuityFallback:!!proposed.continuityFallback});
  if(old.paused){cancel();return}
  act.fade=clamp(Math.min(proposed.fade,proposed.end-old.currentTime-.05),proposed.kind==="snap"?.18:.8,12);
  act.at=performance.now();
  function fadeStep(){
   if(active!==act)return;
   if(old.paused||app.audio()!==old||app.currentId()!==id||
      window.MusicBoxRoom?.isActive()){cancel();return}
   const time=clamp((performance.now()-act.at)/(act.fade*1000),0,1);
   const vol=app.volume();
   // Dedicated curve: the first track stays audible until its last
   // fraction, and the second song enters quietly beneath matching notes.
   let {outGain,inGain}=mixCurve(act.kind,time,act.softTail);
   if(act.preserveTail){
    const late=clamp((time-(act.kind==="snap"?.20:.55))/(act.kind==="snap"?.80:.45),0,1);
    outGain=Math.cos(Math.pow(late,1.35)*Math.PI/2);
    inGain=Math.sin(Math.pow(time,.95)*Math.PI/2);
   }
   // Underlay remains quiet until the very end to limit key clashes.
   if(act.rhythmicUnderlay){
    const lateStart=act.vocalVerifiedBeat ? .34 : .79;
    const late=clamp((time-lateStart)/(1-lateStart),0,1);
    outGain=Math.cos(Math.pow(late,1.35)*Math.PI/2);
    inGain=Math.sin(Math.pow(time,act.vocalVerifiedBeat?1.18:1.85)*Math.PI/2);
   }
   if(act.continuityFallback){
    // Avoid cutting a late vocal: the original holds at full volume
    // for 75% of the short overlap, then naturally yields at its end.
    const tail=clamp((time-.75)/.25,0,1);
    const early=clamp(time/.66,0,1);
    const lift=clamp((time-.66)/.34,0,1);
    outGain=Math.cos(tail*Math.PI/2);
    inGain=.17*Math.sin(early*Math.PI/2)+.83*Math.sin(lift*Math.PI/2);
   }
   const correction=1+(act.gain-1)*Math.sin(Math.PI*time);
   try{
    old.volume=clamp(vol*outGain,0,1);
    upcoming.volume=clamp(vol*inGain*correction,0,1);
    // Micro-beatmatching massimo ±3%; termina a velocità normale
    // per evitare uno scatto udibile quando subentra il lettore principale.
    if(act.tempo!==1)upcoming.playbackRate=1+(act.tempo-1)*(1-time);
   }catch(e){cancel();return}
   if(time>=1){handoff();return}
   act.timer=setTimeout(fadeStep,50);
  }
  fadeStep();
 }catch(e){
  // Un browser può bloccare un secondo audio avviato fuori dal gesto
  // dell'utente: non riprovarlo ogni mezzo secondo.
  mixFailures.set(id+"|"+song.id,Date.now()+60000);
  cancel();
  if(proposed?.liveQuietCertified&&app?.currentId?.()===id&&!old.paused)
   quietDirectHandoff(app,old,id,song,proposed.entry||0,"lettore secondario non avviato");
 }
}
// Even when the next MP3 cannot be analyzed (or its intro is unsuitable),
// never wait through *proven digital silence* in the current track.
// Only a fully measured, duration-matched tail is eligible: no guesswork.
function certifiedTailSkip(a,duration,now,lastLyricAt){
 if(!a?.confidentTail||!Number.isFinite(a.duration)||
    Math.abs(a.duration-duration)>1.5||
    !Number.isFinite(a.last)||a.last<26||
    duration-a.last<1.65||now<a.last+.25||now>duration-.2)return false;
 if(Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>=a.last-.6)return false;
 const lyric=Number.isFinite(lastLyricAt)?lastLyricAt:a.lastLyricAt;
 if(Number.isFinite(lyric)&&lyric>=a.last-.6)return false;
 return true;
}
// Desktop-only safety net for verified near-silent real-audio fade-outs.
// Unlike PCM pre-analysis, this observes the currently *playing* stream.
// It NEVER changes the original element's audio routing or connects to
// speakers. It works even if the deep index or second-track analysis failed.
// Media capture may be unavailable or CORS-silent: then simply do nothing.
let liveOutro=null,liveReportFor="",quietHandoffFor="";
function closeLiveOutro(){
 const state=liveOutro;liveOutro=null;
 if(!state)return;
 try{state.source.disconnect()}catch(_){}
 try{state.analyser.disconnect()}catch(_){}
 try{state.ctx.close()?.catch(()=>{})}catch(_){}
}
function sampleLiveOutro(audio){
 // A finished song may be followed by a much longer new one. Disconnect
 // immediately instead of keeping the old MediaStream/AudioContext alive.
 if(liveOutro&&liveOutro.audio!==audio)closeLiveOutro();
 if(isIOS||!audio||audio.paused||
    !Number.isFinite(audio.duration)||audio.duration-audio.currentTime>38)return;
 if(liveOutro?.audio!==audio){
  closeLiveOutro();
  if(typeof audio.captureStream!=="function")return;
  try{
   const stream=audio.captureStream();
   if(!stream.getAudioTracks().length)return;
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC)return;
   const ctx=new AC(),source=ctx.createMediaStreamSource(stream);
   const analyser=ctx.createAnalyser();
   analyser.fftSize=2048;
   source.connect(analyser); // No destination: keep native playback untouched.
   liveOutro={audio,ctx,source,analyser,buffer:new Float32Array(2048),
    samples:[],lastAt:-1};
   if(ctx.state==="suspended")ctx.resume().catch(()=>{});
  }catch(_){closeLiveOutro();return}
 }
 const state=liveOutro;
 if(!state||state.ctx.state!=="running"||audio.seeking)return;
 const now=audio.currentTime;
 if(now-state.lastAt<.23)return;
 // A seek or replay invalidates the baseline, but a late 0s outro
 // does not count as music unless the last 18s really contained music.
 if(now<state.lastAt-.3||now-state.lastAt>3)state.samples=[];
 state.lastAt=now;
 try{
  state.analyser.getFloatTimeDomainData(state.buffer);
  let power=0;
  for(let i=0;i<state.buffer.length;i++)power+=state.buffer[i]*state.buffer[i];
  state.samples.push({at:now,rms:Math.sqrt(power/state.buffer.length)});
  if(state.samples.length>115)state.samples.shift();
 }catch(_){}
}
function liveQuietOutroReady(samples,duration,now,lastLyricAt,lastVoiceAt){
 if(!Array.isArray(samples)||!Number.isFinite(duration)||!Number.isFinite(now)||
    duration-now>13.5||duration-now<2.2)return false;
 if(Number.isFinite(lastLyricAt)&&now-lastLyricAt<4.5)return false;
 if(Number.isFinite(lastVoiceAt)&&now-lastVoiceAt<2.5)return false;
 const earlier=samples.filter(p=>p.at>=now-19&&p.at<=now-3.3);
 const recent=samples.filter(p=>p.at>=now-1.25&&p.at<=now+.03);
 if(earlier.length<12||recent.length<4||
    recent.at(-1).at-recent[0].at<.85)return false;
 const values=earlier.map(p=>p.rms).sort((a,b)=>a-b);
 const baseline=values[Math.floor(values.length*.74)];
 if(!Number.isFinite(baseline)||baseline<.001)return false;
 // Real music must have been playing; a CORS-muted capture stream
 // cannot be used as evidence that the song's outro is silent.
 if(earlier.filter(p=>p.rms>=baseline*.55).length<7)return false;
 // Two safe entry points: (a) already-quiet tail, or (b) a measured
 // monotonically declining musical release BEFORE it becomes silent.
 // The old absolute 24% threshold waited until the outgoing audio was
 // effectively gone and left an audible gap on the supplied recordings.
 const quiet=recent.every(p=>p.rms<=baseline*.24)&&
  recent.at(-1).rms<=recent[0].rms*1.35+baseline*.008;
 const average=recent.reduce((sum,p)=>sum+p.rms,0)/recent.length;
 const falling=recent[0].rms>=baseline*.20&&
  average<=baseline*.57&&recent.at(-1).rms<=baseline*.49&&
  recent.at(-1).rms<=recent[0].rms*.72&&
  recent.every(p=>p.rms<=baseline*.73)&&
  recent.slice(1).filter((p,i)=>p.rms>recent[i].rms*1.45+baseline*.035).length===0;
 return quiet||falling;
}
// A planned soft fade may miss its prebuffer window. The live measured
// outro must remain eligible: otherwise the browser waits until the MP3 is
// nearly finished despite having verified a real, already-decaying ending.
// For beat/phrase plans, only downgrade after their cue was MISSED because
// the preview is unavailable. A running beat bridge is never interrupted.
function needsLiveQuietRecovery(p,now,ready){
 if(!p||p.kind==="cut"||p.kind==="soft")return true;
 return ["beat","phrase","fade","rise"].includes(p.kind)&&
   Number.isFinite(p.begin)&&now>=p.begin+.75&&!ready;
}
// A precomputed full-track scan is allowed to certify the actual final
// impact before the stream has decayed into silence. An ordinary volume
// valley, even 12 seconds from the end, never satisfies this certificate.
function certifiedEarlyReleaseReady(a,dur,now,lastLyricAt){
 const release=a?.dropRelease;
 if(!a||!release||a.durationMismatch||a.protectedEnding===true||
    !Number.isFinite(dur)||!Number.isFinite(now)||
    !Number.isFinite(a.duration)||Math.abs(a.duration-dur)>1.5||
    dur-now>16||dur-now<2.2||
    !Number.isFinite(release.releaseAt)||
    !Number.isFinite(release.lastImpactAt)||
    now<release.releaseAt-.1||now>release.releaseAt+6.4||
    release.score<.76||release.quietLevel>.20||
    release.releaseAt<release.lastImpactAt||
    !Number.isFinite(a.last)||a.last-release.releaseAt<2.1||
    a.last-release.releaseAt>12)return false;
 const lyric=Number.isFinite(lastLyricAt)?lastLyricAt:a.lastLyricAt;
 if(Number.isFinite(lyric)&&lyric>release.releaseAt-4.5)return false;
 if(Number.isFinite(a.lastVoiceAt)&&a.lastVoiceAt>release.releaseAt-2.5)return false;
 return true;
}
function tryLiveQuietMix(app,audio,id,next,lastLyricAt,analysis){
 if(isIOS||active||mobileActive||mixing||!next||
    quietHandoffFor===id+"|"+next.id||
    Date.now()<(mixFailures.get(id+"|"+next.id)||0))return false;
 const earlyCertified=certifiedEarlyReleaseReady(analysis,
  audio.duration,audio.currentTime,lastLyricAt);
 if(!earlyCertified&&!liveQuietOutroReady(
   liveOutro?.audio===audio?liveOutro.samples:null,
   audio.duration,audio.currentTime,lastLyricAt,analysis?.lastVoiceAt))return false;
 // The submitted 22:30 recording contains a quiet passage followed by a
 // genuine musical comeback. A live energy drop alone cannot predict the
 // future: only a release measured against the WHOLE MP3 is eligible.
 const durationMatches=Number.isFinite(analysis?.duration)&&
  Math.abs(analysis.duration-audio.duration)<1.5;
 const release=analysis?.dropRelease;
 const futureCertified=durationMatches&&release&&
  Number.isFinite(release.releaseAt)&&
  audio.currentTime>=release.releaseAt-.15&&
  release.score>=.67&&release.quietLevel<=.25&&
  analysis.protectedEnding!==true;
 const tailCertified=durationMatches&&analysis?.confidentTail===true&&
  Number.isFinite(analysis.last)&&
  audio.duration-analysis.last>=1.65&&
  audio.currentTime>=analysis.last-.1;
 if(!futureCertified&&!tailCertified)return false;
 const remaining=audio.duration-audio.currentTime;
 const fade=clamp(Math.min(3.7,remaining-.55),1.5,3.7);
 if(fade<1.7)return false;
 const nextSource=app.mixUrl?.(next)||next?.url;
 const nextAnalysis=nextSource&&(cache.get(String(nextSource))||deepLookup(next));
 if(!nextAnalysis||!hasImmediateMusicalIntro(nextAnalysis))return false;
 const verifiedIntro=Number.isFinite(nextAnalysis?.safeIntroAt)&&
   Number.isFinite(nextAnalysis?.duration)&&
   Number.isFinite(prepared?.audio?.duration)&&
   Math.abs(nextAnalysis.duration-prepared.audio.duration)<1.5;
 const entry=verifiedIntro?clamp(nextAnalysis.safeIntroAt,0,18):0;
 const previewMatches=prepared?.id===next.id&&prepared.fromId===id;
 const previewReady=previewMatches&&prepared.ready&&!prepared.failed&&
   !prepared.audio?.error&&prepared.audio?.readyState>=2;
 // The 19:46 recording revealed a real failure: ready could remain true
 // after the preview failed, so the mixer logged "starting" every 350ms
 // without ever entering beginMix. Never claim a mix before it plays.
 // Start the native next track directly if a verified fade is almost over.
 if(!previewReady){
  const previewFailed=previewMatches&&
    (prepared.failed||!!prepared.audio?.error);
  // When the full MP3 proves that its FINAL impact has already passed,
  // a failed second player must not leave several seconds of dead air.
  // Prefer native playback over waiting for an impossible crossfade.
  if((earlyCertified&&previewFailed)||
     (earlyCertified&&audio.currentTime>=release.releaseAt+1.6)||
     (previewFailed&&remaining<=4.5)||remaining<=3.3)
   return quietDirectHandoff(app,audio,id,next,entry,
     previewFailed?"anteprima audio non disponibile":
      earlyCertified?"rilascio musicale conclusivo, anteprima lenta":"anteprima non pronta");
  return false;
 }
 const p={entry,begin:audio.currentTime,end:audio.currentTime+fade+.2,
  fade,tempo:1,gain:1,kind:"quiet",silenceTrim:false,
  liveQuietCertified:true,quietCertified:true};
 beginMix(next,p).catch(error=>{
  mixFailures.set(id+"|"+next.id,Date.now()+60000);
  quietDirectHandoff(app,audio,id,next,entry,
   "errore nell'avvio del secondo lettore");
 });
 return true;
}
function tick(){
 // iOS suspends/limits JS timers behind the lock screen. Leave the native
 // single HTML audio uninterrupted until Safari restores this page.
 if(isIOS&&document.hidden){
  if(mobileActive)stopMobileMix();
  if(active||prepared||mobileFading)cancel();
  return;
 }
 if(!enabled||window.MusicBoxRoom?.isActive()){
  if(active||prepared||mobileActive||mobileFading)cancel();
  closeLiveOutro();
  return;
 }
 const app=bridge(),audio=app?.audio(),id=app?.currentId(),next=app?.mixNext();
 if(isIOS)updateMobileStatus();
 if(mobileActive){
  if(document.hidden){stopMobileMix();return}
  if(mobileActive.handingOff){finishMobileMix(app);return}
  if(!audio||audio!==mobileActive.old||audio.paused||
     mobileActive.ctx.state!=="running"||
     id!==mobileActive.fromId||next?.id!==mobileActive.track.id){
   stopMobileMix();
  }else{
   // A running AudioContext may nevertheless stop advancing on Safari.
   // Detect a stalled preview clock and let the native song finish.
   const audioStep=audio.currentTime-mobileActive.lastAudioTime;
   const clockStep=mobileActive.ctx.currentTime-mobileActive.lastCtxTime;
   if(audioStep>.30&&clockStep<.025){
    stopMobileMix();return;
   }
   mobileActive.lastAudioTime=audio.currentTime;
   mobileActive.lastCtxTime=mobileActive.ctx.currentTime;
   if((mobileActive.strongBeatBridge||mobileActive.snap)&&mobileActive.vocalSafe){
    // Duck the native outgoing beat where supported; Safari may
    // ignore media-element volume, so the incoming gain stays limited.
    const progress=clamp((audio.currentTime-mobileActive.audioStartedAt)/
      Math.max(.5,mobileActive.end-mobileActive.audioStartedAt),0,1);
    try{
     audio.volume=(app.volume?.()??1)*(1-(mobileActive.snap?.38:.65)*progress);
     mobileFadeTrack=id;mobileFading=true;
    }catch(_){}
   }
   if(audio.currentTime>=mobileActive.end-(mobileActive.snap?.09:.40))handoffMobileMix(app);
   return;
  }
 }
 if(active?.handingOff){
  if(id===active.track.id)return;
  cancel();return;
 }
 if(isIOS&&audio&&boundAudio!==audio){
  boundAudio=audio;
  const attached=audio;
  audio.addEventListener("timeupdate",()=>{
   if(boundAudio!==attached)return;
   try{tick()}catch(e){}
  });
 }
 // Do not run music analysis while iOS is seeking/buffering.
 if(isIOS&&audio&&(audio.seeking||audio.readyState<3)){
  if(mobileActive)stopMobileMix();
  return;
 }
 if(!audio||!id||audio.paused||!next||!Number.isFinite(audio.duration)||audio.duration<26){
  if(active||prepared||mobileFading)cancel();
  if(!audio||audio!==liveOutro?.audio)closeLiveOutro();
  return;
 }
 if(!isIOS)sampleLiveOutro(audio);
 if(active&&(active.original!==audio||active.fromId!==id||active.track.id!==next.id)){
  cancel();
 }
 if(mixing){stopSnapPrecision();return}
 if(previousId!==id){
  cancel();previousId=id;plannedFor="";plan=null;
   shuffleGeneration++;shuffleBusy=false;
   shuffleRunFor="";shuffleRetryAt=0;shuffleAttempts=0;quietHandoffFor="";
   shuffleLastLyricFor="";shuffleLastLyric=null;
 }
 if(plannedFor!==next.id){
  cancel();plannedFor=next.id;
  const fromId=id,target=next.id,duration=audio.duration;
  let a=null,b=null;
  const update=()=>{
   if(previousId!==fromId||plannedFor!==target||app.currentId()!==fromId||
      app.mixNext()?.id!==target||mixing)return;
   const lyricA=app.mixLyricCues?.(fromId),lyricB=app.mixLyricCues?.(target);
   const currentAnalysis=a&&lyricA?{...a,lastLyricAt:lyricA.last}:a;
   const nextAnalysis=b&&lyricB?{...b,firstLyricAt:lyricB.first}:b;
   const candidate=transition(currentAnalysis,nextAnalysis,audio.duration);
   // iPhone uses a single stream: never cut an audible vocal outro
   // merely because the next track matches harmonically.
   const weakIphoneMatch=isIOS&&candidate&&
     (!iphoneBeatPairCertified(currentAnalysis,nextAnalysis,candidate)||
      !iphoneQuietReleaseCertified(currentAnalysis,candidate));
   // Unmatched rhythm OR an audible, non-matching "quiet" fade
   // must keep the original ending intact and use native progression.
   const weakDesktopMatch=!isIOS&&candidate&&
     (!desktopBeatPairCertified(currentAnalysis,nextAnalysis,candidate)||
      !iphoneQuietReleaseCertified(currentAnalysis,candidate));
   const certifiedQuietAlternative=
     (weakIphoneMatch||weakDesktopMatch||!candidate)&&
     currentAnalysis&&nextAnalysis?
      certifiedNeutralBridge(currentAnalysis,nextAnalysis,audio.duration):null;
   plan=(weakIphoneMatch||weakDesktopMatch)?
    certifiedQuietAlternative:
    (candidate||certifiedQuietAlternative||
      (currentAnalysis&&nextAnalysis?
       continuityFallback(currentAnalysis,nextAnalysis,audio.duration):null));
   updateDetails(a,b);
  };
  // Preload the next track even if beat analysis cannot certify a mix.
  // A speculative fade before ANY outgoing analysis may hide a
  // real final beat. Prebuffer the next MP3 separately, but never
  // play an uncertified overlap.
  plan=null;
  const now=app.allTracks()?.find(t=>t.id===id);
  // Safari decodes one song at a time: get the next intro ready first.
  // Do not wait for the entire current track before preparing the next.
  if(isIOS){
   // Fast-path: an indexed analysis is enough to choose the cue now;
   // regenerate the short preview in parallel, without delaying planning.
   cachedMobileAnalysis(next).then(value=>{
    if(value){b=value;update()}
   }).catch(()=>{});
   cachedMobileAnalysis(now).then(value=>{
    if(value){a=value;update()}
   }).catch(()=>{});
   // DO NOT launch full MP3 decoding at song selection time. We obtain
   // indexed cues without touching the native Safari audio pipeline.
   // Any optional short overlay is prepared only in the final 75s below.
  }else{
   decode(now).then(value=>{a=value;update()}).catch(()=>{});
   decode(next).then(value=>{b=value;update()}).catch(()=>{});
  }
 }
 // Newly fetched karaoke timing can certify a formerly unknown vocal outro.
 const lyricForSearch=app.mixLyricCues?.(id)?.last;
 if(shuffleLastLyricFor!==id){
  shuffleLastLyricFor=id;
  shuffleLastLyric=Number.isFinite(lyricForSearch)?lyricForSearch:null;
 }else if(Number.isFinite(lyricForSearch)&&lyricForSearch!==shuffleLastLyric){
  shuffleLastLyric=lyricForSearch;
  rearmShuffleAfterVocalScan(id);
 }
 // Don't allow shuffle candidate downloads to monopolize Safari's
 // single decoder while the next track has not been prepared for the mix.
 const nextSource=app.mixUrl?.(next)||next.url;
 const nowTrack=app.allTracks()?.find(t=>t.id===id);
 const canReorder=!isIOS||
   (!!deepLookup(nowTrack)&&audio.duration-audio.currentTime>52&&
    mobileDJMayWork());
 if(canReorder&&audio.duration-audio.currentTime>(isIOS?60:25))
  maybeReorderShuffle(app,audio,id);
 // A single late decoded preview is optional. The current song must be
 // buffering safely and a musically compatible cue must already exist.
 const nowUrl=nowTrack&&(app.mixUrl?.(nowTrack)||nowTrack.url);
 const nowInfo=nowTrack&&
  (cache.get(String(nowUrl))||deepLookup(nowTrack));
 if(isIOS&&mobileOverlayEnabled&&plan&&
    // Offline decoding can prepare the next MP3 even while WebAudio is
    // temporarily suspended. Only actual playback needs the running clock.
    mobileMixAllowed(plan,nowInfo,app.mixLyricCues?.(id)?.last)&&
    mobileClipWindow(audio)&&
    !mobileIntroClips.has(String(nextSource))&&!pending.has(String(nextSource)))
   decode(next,true).catch(()=>{});
 // A soft transition needs the next MP3 buffered before the fade.
 // A missing/incompatible musical plan must not leave a 3-5s silent tail.
 // Preload just one future track on desktop; leave iPhone unchanged.
 if(!isIOS&&(plan===null||plan.kind==="cut")&&
    audio.duration-audio.currentTime<=25&&
    audio.duration-audio.currentTime>2.2&&
    Date.now()>(mixFailures.get(id+"|"+next.id)||0)&&
    (!prepared||prepared.id!==next.id||prepared.fromId!==id))
  prepare(next,id,app);
 const mixReady=Boolean(prepared?.ready&&!prepared?.failed&&
  prepared?.audio?.readyState>=2&&prepared.id===next.id&&prepared.fromId===id);
 // A full-track musical-release certificate beats a cue scheduled in
 // the almost-silent tail. A genuine beat already imminent keeps priority.
 const currentSong=app.allTracks?.()?.find(t=>t.id===id);
 const currentSource=currentSong&&(app.mixUrl?.(currentSong)||currentSong.url);
 const measuredEnding=currentSource&&
   (cache.get(String(currentSource))||deepLookup(currentSong));
 const finalLyric=app.mixLyricCues?.(id)?.last;
 const earlyRelease=certifiedEarlyReleaseReady(measuredEnding,
  audio.duration,audio.currentTime,finalLyric);
 const plannedLate=earlyRelease&&(!plan||plan.kind==="cut"||
  !Number.isFinite(plan.begin)||plan.begin>audio.currentTime+1.2);
 if(needsLiveQuietRecovery(plan,audio.currentTime,mixReady)||plannedLate){
  if(tryLiveQuietMix(app,audio,id,next,finalLyric,measuredEnding))return;
 }
  if(!plan){
  const currentTrack=app.allTracks?.()?.find(t=>t.id===id);
  const url=currentTrack&&(app.mixUrl?.(currentTrack)||currentTrack.url);
  const analysis=url&&(cache.get(String(url))||deepLookup(currentTrack));
  const lastLyric=app.mixLyricCues?.(id)?.last;
  if(certifiedTailSkip(analysis,audio.duration,audio.currentTime,lastLyric)){
   const nextInfo=cache.get(String(nextSource))||deepLookup(next);
   const entry=Number.isFinite(nextInfo?.safeIntroAt)?
    clamp(nextInfo.safeIntroAt,0,18):0;
   const target=next.id;
   cancel();plannedFor=target;plan=null;
   Promise.resolve(app.mixHandoff(target,entry)).catch(()=>{});
   return;
  }
  resetMobileFade();return;
 }
 // Karaoke may load after the audio analysis. Cancel a now unsafe cue.
 const lastKnownLyric=app.mixLyricCues?.(id)?.last;
 // A karaoke cue can arrive AFTER analysis. Never skip a newly
 // discovered final phrase, even if it precedes a 20-second quiet gap.
 if(!mixing&&plan.outroGapStart&&Number.isFinite(lastKnownLyric)&&
    lastKnownLyric>=plan.outroGapStart-3.5){
  dropPrepared();plan=null;resetMobileFade();return;
 }
 const verifiedQuietLyricExit=Boolean(plan.verifiedDecayAfterLyrics&&
    plan.quietCertified&&plan.kind==="soft"&&
    Number.isFinite(plan.decayReleaseAt)&&
    lastKnownLyric<=plan.decayReleaseAt+.5&&
    plan.begin>=lastKnownLyric+4);
 if(!mixing&&Number.isFinite(lastKnownLyric)&&
    plan.begin<lastKnownLyric+6&&audio.duration-lastKnownLyric<16&&
    !verifiedQuietLyricExit){
  if(plan.silenceTrim)plan={...plan,begin:plan.end,fade:0,kind:"cut"};
  else {dropPrepared();plan=null;resetMobileFade();return}
 }
 // iOS foreground: fade the confirmed tail without opening another player.
 // This is a single-stream smart handoff, not overlapping two audio sources.
 if(isIOS){
  const trimOk=Boolean(plan.silenceTrim&&plan.trailing>=1.65);
  const mobileEnd=plan.end;
  const fadeAt=Math.max(mobileEnd-.35,plan.safeOutroAt??mobileEnd);
  if(trimOk&&Number.isFinite(plan.safeOutroAt)&&!document.hidden&&
     audio.currentTime>=fadeAt&&audio.currentTime<mobileEnd){
   const volume=app.volume?.()??1;
   const fraction=clamp((mobileEnd-audio.currentTime)/.35,.15,1);
   try{audio.volume=volume*fraction;mobileFadeTrack=id;mobileFading=true}catch(e){}
  }else if(mobileFading)resetMobileFade();
 }
 armSnapPrecision(audio,id);
 // Inizia il buffer prima del punto di mix: mai aspettare la battuta finale
 // per scaricare i metadati del prossimo MP3.
 // Prebuffer early on PC: waiting until 12s before the boundary could
  // leave the next MP3 at readyState 0, so the crossfade never started.
  const preloadAt=isIOS?Math.min(plan.begin-12,Math.max(0,audio.duration-25)):
    Math.max(0,Math.min(plan.begin-28,audio.duration-45));
 const blockedUntil=mixFailures.get(id+"|"+next.id)||0;
 const previewAllowed=Date.now()>blockedUntil;
 if(previewAllowed&&!isIOS&&plan.kind!=="cut"&&audio.currentTime>=Math.max(0,preloadAt) &&
    (!prepared||prepared.id!==next.id||prepared.fromId!==id||
      (prepared.failed&&Date.now()-(prepared.failedAt||0)>=11000)))
   prepare(next,id,app);
 // If the crossfade couldn't start (not enough buffering or suspended
 // iPhone WebAudio), hand off shortly AFTER a verified long quiet pause
 // begins. Do not leave the listener in silence for 20 more seconds.
 // If the preview is playing, mobileActive / active protects its handoff.
 const gapFallback=Number.isFinite(plan.outroGapStart)&&
  audio.currentTime>=plan.outroGapStart+.75;
 const ordinaryFallback=(plan.silenceTrim||plan.kind==="soft")&&
  audio.currentTime>=plan.end+.08;
 if((gapFallback||ordinaryFallback)&&!active&&!mobileActive&&!mixing){
  const target=next.id,entry=plan.entry;
  cancel();plannedFor=target;plan=null;
  // Su iPhone un solo audio alla volta preserva i controlli nella
  // schermata di blocco; dove possibile elimina comunque la coda muta.
  Promise.resolve(app.mixHandoff(target,entry)).catch(()=>{});
  return;
 }
 if(isIOS&&!document.hidden&&!mobileActive&&
    audio.currentTime>=plan.begin&&
    audio.currentTime<plan.end-(plan.kind==="snap"?.26:1.25)&&
    mobileMixAllowed(plan,measuredEnding,lastKnownLyric))
  startMobileMix(next,plan,app,audio);
 if(previewAllowed&&!isIOS&&plan.kind!=="cut"&&prepared?.ready && audio.currentTime>=plan.begin &&
    audio.currentTime<plan.end-(plan.kind==="snap"?.25:.55)){
  beginMix(next,plan).catch(()=>cancel());
 }
}

function paintWave(id,bars){
 const element=$(id);
 if(!element)return;
 if(!Array.isArray(bars)||!bars.length){element.replaceChildren();return}
 const fragment=document.createDocumentFragment();
 for(const value of bars){
  const bar=document.createElement("span");
  bar.className="mix-wave-bar";
  bar.style.height=Math.round(4+26*Math.pow(clamp(value,0,1),.6))+"px";
  fragment.appendChild(bar);
 }
 element.replaceChildren(fragment);
}
function updateDetails(a,b){
 paintWave("mixWaveOut",a?.outroWave);
 paintWave("mixWaveIn",b?.introWave);
 const el=$("mixDetail");if(!el)return;
 if(!a&&!b){
  el.textContent="Analisi automatica dei brani quando la musica è in riproduzione.";
  return;
 }
 const fmt=(obj)=>obj?
  [(Number.isFinite(obj.bpm)?obj.bpm+" BPM":"BPM non disponibili"),
    (obj.camelot?.code?"Camelot "+obj.camelot.code+" (stima)":keyGuess(obj.chroma))||"tonalità da verificare"].join(" · "):
  "analisi non disponibile";
 const description=plan?.measuredBeatBridge?
   plan.kind==="snap"?" · stacco corto sulla battuta, senza aspettare silenzi":
   " · beat reali compatibili: mix anticipato":
   plan?.instrumentalBeatBridge?
   " · beat finale e iniziale compatibili: mix anticipato senza silenzio":
   plan?.lateInstrumentalBreak?
   " · pausa lunga prima dell'ultimo strumentale: passaggio protetto":
   plan?.strongBeatBridge?
   " · beat finale e iniziale compatibili: sovrapposizione anche senza silenzio"+
   (Number.isFinite(plan.grooveScore)?" · ritmo "+Math.round(plan.grooveScore*100)+"%":""):
   Number.isFinite(plan?.outroGapStart)?
   " · pausa finale lunga riconosciuta: entrata prima del silenzio":
   plan?.continuityFallback?
   " · raccordo continuo, senza beatmatch certificato":
   plan?.softTailTrim?
   " · finale molto debole abbreviato: "+plan.trailing.toFixed(1)+" s":
   plan?.silenceTrim?" · finale muto eliminato: "+plan.trailing.toFixed(1)+" s":"";
 const vocal=a?.voiceModel?(Number.isFinite(a.lastVoiceAt)?
  " · voce rilevata fino a "+a.lastVoiceAt.toFixed(1)+" s":
  " · analisi vocale IA eseguita"):"";
 const boundary=a&&b?similarNotes(a,b):null;
 const harmonic=boundary?(boundary.score===null?
  " · note al confine non distinguibili":
  " · note finale/inizio "+Math.round(boundary.score*100)+"%"+
    (boundary.matches?" (compatibili)":" (non compatibili)")):"";
 const transitionName=plan?.kind==="phrase"?"ponte armonico":
   plan?.kind==="beat"?"mix a tempo":(plan?.kind||"auto");
 el.textContent="Ora: "+fmt(a)+"  |  Dopo: "+fmt(b)+description+vocal+harmonic+
   (plan?.kind==="cut"?" · passaggio diretto (niente sovrapposizione)":
     plan?" · "+transitionName+" "+plan.fade.toFixed(1)+" s":
     " · passaggio normale, senza mix forzato");
}
function updateMobileStatus(){
 if(!isIOS)return;
 const el=$("mixIphoneStatus");
 if(!el||$("mixPanel")?.hidden)return;
 const app=bridge(),next=app?.mixNext?.(),audio=app?.audio?.();
 const url=next&&(app.mixUrl?.(next)||next.url);
 const clip=url&&mobileIntroClips.has(String(url));
 const context=app?.mixRunningContext?.();
 let status;
 if(!enabled||!mobileOverlayEnabled)status="Mix su iPhone disattivato.";
 else if(offlineTransferPriority)status="Priorità ai download offline: il mix riprende dopo.";
 else if(!deepIndex)status="Indice musicale in caricamento: il lettore normale continua.";
 else if(document.hidden)status="Schermo bloccato: riproduzione normale protetta.";
 else if(mobileActive?.handingOff)status="Mix eseguito: passo al lettore normale.";
 else if(mobileActive)status="Transizione in corso: introduzione sovrapposta.";
 else if(!audio||audio.paused)status="Avvia una canzone per preparare il mix.";
 else if(!next)status="Nessun prossimo brano nella coda.";
 else if(!context)status="Audio mix non attivo: tocca Play o un comando nell'app con schermo acceso.";
 else if(!plan||plan.kind==="cut")status=
  "Nessun mix sicuro per questa coppia: passaggio normale, senza tagliare la canzone.";
 else if(!mobileMixAllowed(plan,
   app?.allTracks?.()?.find(t=>t.id===app.currentId?.())&&
    (cache.get(String(app.mixUrl?.(app.allTracks().find(t=>t.id===app.currentId()))))||
     deepLookup(app.allTracks().find(t=>t.id===app.currentId()))),
   app?.mixLyricCues?.(app.currentId?.())?.last))
  status="Finale non adatto a una sovrapposizione: passaggio normale protetto.";
 else if(!clip&&mobileClipFailure?.source===String(url))status=
  "Intro non pronta: "+mobileClipFailure.reason+". La musica normale continua.";
 else if(!clip)status="Preparo l'intro del prossimo brano senza fermare la canzone.";
 else if(mobileMixLastBlocker&&Date.now()-mobileMixLastStartedAt>1800&&
    Number.isFinite(plan?.begin)&&audio.currentTime>=plan.begin-.5&&
    audio.currentTime<plan.end+.6)
  status="Mix non avviato: "+mobileMixLastBlocker;
 else if(plan.pulseUnderlay)
  status="Pulsazioni allineate: preparo un breve raccordo ritmico a volume ridotto.";
 else if(plan.kind==="snap"&&plan.measuredBeatBridge)
  status="Beat compatibili misurati: anteprima ritmica breve e prudente, se Safari la consente.";
 else if(!plan.quietCertified||!["beat","soft","fade","rise"].includes(plan.kind))
  status="Finale non sicuro per una sovrapposizione su iPhone: passaggio normale.";
 else status="Introduzione pronta · "+(plan.kind==="beat"?"mix ritmico":"sfumatura")+
   " previsto a "+Math.max(0,Math.round(plan.begin))+" s.";
 if(el.textContent!==status)el.textContent=status;
}
function draw(){
 const row=$("mixIphoneRow"),toggle=$("mixIphoneToggle");
 if(row)row.hidden=!isIOS;
 if(toggle){
  toggle.textContent=mobileOverlayEnabled?"Attivo":"Spento";
  toggle.setAttribute("aria-pressed",String(mobileOverlayEnabled));
 }
 const btn=$("btnMixIntelligente");
 if(btn){
  btn.setAttribute("aria-pressed",String(enabled));
  const label=btn.querySelector(".voce-testo");
  if(label)label.innerHTML=(enabled?"Mix intelligente: attivo":"Mix intelligente: spento")+
   (isIOS?
    " <small>iPhone: mix a schermo acceso se supportato · ripiego normale al blocco</small>":
    " <small>Automix automatico: mixa solo quando i brani sono compatibili</small>");
 }
 const styleEl=$("mixStyle");
 if(styleEl&&styleEl.value!==style)styleEl.value=style;
 const secs=$("mixSeconds");
 if(secs){
  if(Number(secs.value)!==mixSeconds)secs.value=String(mixSeconds);
  secs.disabled=style==="auto";
  secs.title=style==="auto"?"Automix sceglie da solo la durata per ogni coppia di brani":"Durata manuale della transizione";
 }
 const value=$("mixSecondsValue");if(value)value.textContent=mixSeconds+" s";
 const note=$("mixDeviceNote");
 if(note)note.textContent=isIOS?
   "Su iPhone, a schermo acceso, mixa anche beat finali e iniziali compatibili quando l'assenza di voce è verificata; riconosce inoltre i finali silenziosi. Safari può limitare le sovrapposizioni: a schermo bloccato riproduzione normale protetta.":
   "Analizza BPM, note e chiusura musicale. Quando il modello vocale IA è disponibile, controlla canto e parlato prima del taglio; i casi incerti non vengono forzati.";
 const activeLabel=$("mixToggleLabel");
 if(activeLabel)activeLabel.textContent=enabled?"Attivo":"Disattivato";
 const directToggle=$("mixToggle");
 if(directToggle){
  directToggle.setAttribute("aria-pressed",String(enabled));
  directToggle.setAttribute("aria-label",enabled?
   "Disattiva Mix intelligente":"Attiva Mix intelligente");
  directToggle.style.background=enabled?"#208f73":"#4c5468";
 }
 // Draw on every open, also after backgrounding Safari.
 const panelStatus=$("mixIphoneStatus");
 if(!enabled&&panelStatus)panelStatus.textContent="Mix intelligente disattivato.";
 updateMobileStatus();
}
let smartSuggested=[],smartRun=0,shuffleRunFor="";
// The shuffle picker is continuously re-armed for EACH outgoing song.
// Inspect the measured metadata from the whole eligible library, rather
// than treating the first ten randomly picked songs as the only options.
// It never downloads the whole catalog and never changes a manual queue.
async function intelligentShuffle(app,audio,fromId){
 const runGeneration=typeof shuffleGeneration==="number"?shuffleGeneration:null;
 if(!enabled||window.MusicBoxRoom?.isActive()||
    !app.mixShuffleCandidates||!app.mixSelectShuffle)return {retry:false};
 const sequence=app.mixShuffleCandidates();
 const pool=app.mixShufflePool?.()||sequence;
 if(!sequence.length||pool.length<2)return {retry:false};
 const initialFirst=sequence[0].id,from=app.allTracks()?.find(t=>t.id===fromId);
 if(!from)return {retry:false};
 const fromInfo=await decode(from);
 if(!fromInfo||!enabled||app.currentId()!==fromId)return {retry:app.currentId()===fromId};
 const lastLyric=app.mixLyricCues?.(fromId)?.last;
 const old=Number.isFinite(lastLyric)?{...fromInfo,lastLyricAt:lastLyric}:fromInfo;
 const source=t=>String(app.mixUrl?.(t)||t.url||"");
 // Indexed real-audio measurements: cheap and synchronous even for hundreds
 // of candidates. A missing analysis is NOT proof of matching beat.
 const indexed=[],unknown=[];
 for(const t of pool.slice(0,1800)){
  if(!t?.id||t.id===fromId)continue;
  const local=cache.get(source(t));
  const info=withValidatedVoice(deepLookup(t),local);
  if(info)indexed.push({track:t,info});
  else unknown.push(t);
 }
 // When the deep index hasn't covered the library, decode only a bounded,
 // distributed sample. Prefer the already scheduled next songs and spread
 // the remainder across the playlist rather than just alphabetic entries.
 const extra=unknown.length?Math.min(isIOS?3:8,unknown.length):0;
 const picked=[];
 for(const t of sequence.slice(0,3)){
  if(unknown.some(x=>x.id===t.id)&&!picked.some(x=>x.id===t.id))picked.push(t);
 }
 for(let i=0;picked.length<extra&&i<extra*3;i++){
  const at=Math.min(unknown.length-1,Math.floor((i+.5)*unknown.length/(extra*3)));
  const t=unknown[at];
  if(t&&!picked.some(x=>x.id===t.id))picked.push(t);
 }
 const measured=indexed.slice();
 // At most two extra MP3 decodes concurrently. This is optional;
 // a fully indexed library never needs a bulk fetch.
 let cursor=0;
 async function worker(){
  while(cursor<picked.length){
   const t=picked[cursor++];
   if(!enabled||app.currentId()!==fromId||
      audio.duration-audio.currentTime<25)return;
   const info=await decode(t);
   if(info)measured.push({track:t,info});
  }
 }
 if(picked.length)await Promise.all([worker(),worker()]);
 if(!enabled||app.currentId()!==fromId||
    window.MusicBoxRoom?.isActive()||
    audio.duration-audio.currentTime<22)return {retry:false};
 // Count only physically justified BEAT plans, not a similarly keyed
 // song with a random groove. No candidate -> keep current order and
 // the verified quiet/silence fallback.
 const scored=[],softScored=[],nearScored=[],sequenceScored=[],rhythmOrderScored=[];
 const rejected={weakIntro:0,noMusicalBridge:0,onlyQuiet:0};
 // These are near matches, not certified playback candidates. Showing both
 // numbers prevents 'beatCandidates: 0' from falsely implying the library
 // has no songs with similar tempo or real beat patterns.
 let rhythmCandidates=0,harmonicCandidates=0,batchCount=0;
 for(const {track,info} of measured){
  // Also yield on PC: large library comparisons must not block audio events.
  if(++batchCount%24===0){
   await new Promise(resolve=>setTimeout(resolve,0));
   if(runGeneration!==shuffleGeneration||app.currentId()!==fromId||
      (typeof document!=="undefined"&&document.hidden))return {retry:false};
  }
  if(!info||info.durationMismatch||!Number.isFinite(info.bpm)||
     !Number.isFinite(info.beatConfidence)||info.beatConfidence<.12||
     !hasImmediateMusicalIntro(info)){
   rejected.weakIntro++;continue;
  }
  const bpmA=Number(old.bpm),bpmB=Number(info.bpm);
  if(bpmA>0&&bpmB>0&&old.beatConfidence>=.16){
   const ratio=[.5,1,2].map(scale=>bpmA/(bpmB*scale))
    .reduce((best,value)=>Math.abs(Math.log2(value))<Math.abs(Math.log2(best))?value:best);
   if(ratio>=.94&&ratio<=1.06){
    const rhythm=grooveAgreement(old,info);
    if(rhythm?.score>=.60){
     rhythmCandidates++;
     const harmony=similarNotes(old,info);
     if(harmony.focused>=.60&&harmony.phrase>=.45)
      harmonicCandidates++;
     // Rhythm-only sorting never certifies a harmonic beat mix.
     if(rhythm.score>=.66&&ratio>=.945&&ratio<=1.055&&
        info.introDrive>=.43&&info.beatConfidence>=.16){
      const key=camelotMatch(old,info);
      const keyFit=key.weight>=.14?key.score:.5;
      const chroma=Number.isFinite(harmony.focused)?harmony.focused:0;
      const phrase=Number.isFinite(harmony.phrase)?harmony.phrase:0;
      rhythmOrderScored.push({track,score:rhythm.score*.57+
       chroma*.18+phrase*.12+keyFit*.13-
       Math.abs(Math.log2(ratio))*.50});
     }
     // Spotify-style smart ordering is separate from mixing: if there is
     // no certified overlap, prefer an adjacent song with matching tempo,
     // measured drums and key rather than an unrelated random track.
     // This never gives permission to crossfade an unverified vocal outro.
     const key=typeof camelotMatch==="function"?camelotMatch(old,info):null;
     // A low-confidence key estimate is not grounds to reject an
     // otherwise measured rhythmic match. This tier changes the NEXT
     // song only; it never certifies an audio overlap or a vocal cut.
     const reliableKey=(key?.weight||0)>=.14;
     const boundaryStrong=Number.isFinite(harmony.focused)&&
      Number.isFinite(harmony.phrase)&&
      harmony.focused>=.65&&harmony.phrase>=.48;
     const keyCompatible=!reliableKey||key.score>=.55;
     const musicalProof=boundaryStrong&&
      (reliableKey?rhythm.score>=.69:
       rhythm.score>=.76&&harmony.focused>=.71);
     const quality=harmony.focused*.42+harmony.phrase*.22+
      rhythm.score*.27+(reliableKey?key.score*.09:.045)-
      Math.abs(Math.log2(ratio))*.65;
     if(ratio>=.945&&ratio<=1.055&&keyCompatible&&musicalProof){
      nearScored.push({track,score:quality});
     }else if(ratio>=.92&&ratio<=1.08&&
       rhythm.score>=.62&&Number.isFinite(harmony.focused)&&
       Number.isFinite(harmony.phrase)&&
       harmony.focused>=.58&&harmony.phrase>=.39&&
       (!reliableKey||key.score>=.40)){
      // Wider but still measured order-only fallback. Never turn this
      // into a beatCandidates value or permission to overlap vocals.
      sequenceScored.push({track,score:quality});
     }
    }
   }
  }
  const firstLyric=app.mixLyricCues?.(track.id)?.first;
  const next=Number.isFinite(firstLyric)?{...info,firstLyricAt:firstLyric}:info;
  const cue=transition(old,next,audio.duration);
  // Never declare a "beat winner" on Safari if its actual mobile
  // overlay constraints would reject it at playback time.
  const mobilePlayable=!isIOS||
   (mobileMixAllowed(cue,old,lastLyric)&&
    iphoneBeatPairCertified(old,next,cue)&&iphoneQuietReleaseCertified(old,cue));
  // Only a musically verified bridge earns the "beat" tier. A weak
  // rhythmic resemblance must NEVER outrank a safe next song.
  const verified=Boolean(mobilePlayable&&
   desktopBeatPairCertified(old,next,cue)&&
   iphoneQuietReleaseCertified(old,cue)&&cue&&
    ((cue.kind==="snap"&&cue.measuredBeatBridge&&cue.verifiedMicroBeat===true&&
      cue.fade>=.46)||
     (cue.kind==="beat"&&cue.fade>=2.7&&
      (cue.verifiedHarmonicBridge===true||cue.dropReleaseBridge===true||
       cue.instrumentalBeatBridge===true))));
  if(!verified){
   // Only as a SECOND choice: a measured musical decay may permit a
   // short, audible overlap even when no two percussion patterns match.
   // Never silently count this as a verified beat or shorten a vocal.
   const safeSoft=Boolean(mobilePlayable&&
    iphoneQuietReleaseCertified(old,cue)&&cue&&cue.kind==="soft"&&cue.fade>=2.35&&
    cue.quietCertified===true&&info.introDrive>=.43&&
    (cue.neutralRelease||cue.verifiedDecayAfterLyrics||cue.dropReleaseBridge||
     (Number.isFinite(cue.safeOutroAt)&&cue.safeOutroAt<=cue.begin+.25))&&
    (!Number.isFinite(old.lastVoiceAt)||old.lastVoiceAt<=cue.begin-1.3)&&
    (!Number.isFinite(old.lastLyricAt)||old.lastLyricAt<=cue.begin-4)&&
    (!Number.isFinite(next.firstVoiceAt)||next.firstVoiceAt>=3)&&
    (!Number.isFinite(next.firstLyricAt)||next.firstLyricAt>=3));
   if(safeSoft){
    const score=1+Math.min(.16,cue.fade*.025)+info.introDrive*.10+
     (Number(cue.grooveScore)||0)*.07;
    softScored.push({track,cue,score});
   }else if(!cue)rejected.noMusicalBridge++;
   else rejected.onlyQuiet++;
   continue;
  }
  // Real source measurements and valid cue outweigh global BPM similarity.
  const score=1+(Number(cue.grooveScore)||0)*.22+
   (Number(cue.score)||0)/100*.15+
   Math.min(.12,Math.max(0,cue.fade)/45);
  scored.push({track,cue,score});
 }
 scored.sort((a,b)=>b.score-a.score);
 softScored.sort((a,b)=>b.score-a.score);
 nearScored.sort((a,b)=>b.score-a.score);
 sequenceScored.sort((a,b)=>b.score-a.score);
 rhythmOrderScored.sort((a,b)=>b.score-a.score);
 // Order-only fallback is still preferable to an unrelated random song,
 // but absolutely never gains permission to overlap a sung ending.
 // Prefer a next song with actually compatible notes and drums.
 // Prioritize a transition that the iPhone/desktop mixer can genuinely
 // PLAY over a rhythm/key resemblance that cannot produce a mix.
 const choicePool=scored.length?scored:softScored.length?softScored:
  nearScored.length?nearScored:sequenceScored.length?sequenceScored:rhythmOrderScored;
 const best=choicePool[0],current=choicePool.find(x=>x.track.id===initialFirst);
 const noMatch=!best;
 if(best&&best.track.id!==initialFirst&&
    (!current||best.score>current.score+.045)){
  if(runGeneration!==null&&runGeneration!==shuffleGeneration)return {retry:false};
  const selected=app.mixSelectShuffle({fromId,initialFirst,pickId:best.track.id});
  if(selected){
   shuffleLastDecision={outgoing:fromId,checked:measured.length,available:pool.length,
    beatCandidates:scored.length,softCandidates:softScored.length,
    nearCandidates:nearScored.length,sequenceCandidates:sequenceScored.length,
    rhythmCandidates,harmonicCandidates,rhythmOrderCandidates:rhythmOrderScored.length,
    rejected,chosen:best.track.id,
    shortRhythmicMix:!!best.cue?.rhythmicUnderlay,
    reason:scored.length?(best.cue?.rhythmicUnderlay?
     "raccordo ritmico breve, finale preservato":"beat certificato"):nearScored.length?
     "ordine per BPM, groove e tonalita":softScored.length?
     "sfumatura su finale quieto (non beat uguali)":sequenceScored.length?
      "ordine ritmico prudente (nessun mix forzato)":
      "ritmo simile, raccordo continuo (non beat certificato)"};
   console.info(scored.length?"[Music Box DJ] Scelta automatica: beat verificato in libreria":
    nearScored.length?"[Music Box DJ] Scelta automatica: note e groove affini":
    softScored.length?"[Music Box DJ] Scelta automatica: rilascio quieto verificato":
     "[Music Box DJ] Scelta automatica: ritmo e tonalita affini (senza taglio forzato)",
    {outgoing:fromId,incoming:best.track.id,
     fade:best.cue?.fade?.toFixed(1)??null,
     checked:measured.length,available:pool.length});
   return {retry:false,selected:true};
  }
 }
 // Obsolete vocal evidence must not overwrite a fresh selection.
 if(runGeneration!==null&&runGeneration!==shuffleGeneration)return {retry:false};
 // If analysis coverage is incomplete, retry later once more metadata
 // becomes available, instead of permanently locking the song to silence.
 shuffleLastDecision={outgoing:fromId,checked:measured.length,available:pool.length,
  beatCandidates:scored.length,softCandidates:softScored.length,
  nearCandidates:nearScored.length,sequenceCandidates:sequenceScored.length,
  rhythmCandidates,harmonicCandidates,rhythmOrderCandidates:rhythmOrderScored.length,
   rejected,chosen:current?.track.id||null,
   vocalModelReady:!!old.voiceModel,
   outgoingVoiceScannedThroughEnd:!!(old.voiceModel&&
    Number.isFinite(old.voiceScannedEnd)&&Number.isFinite(old.last)&&
    old.voiceScannedEnd>=old.last-1),
   protectedEnding:old.protectedEnding===true,dropReleaseVerified:!!old.dropRelease,
  reason:noMatch?"nessuna sovrapposizione o sequenza affidabile nei brani analizzati":
   scored.length?"brano in coda gia compatibile con il beat":
   nearScored.length?"brano in coda gia simile per BPM, groove e note":
   softScored.length?"brano in coda compatibile con una sfumatura quieta":
    sequenceScored.length?"brano in coda gia selezionato per ritmo e note":
    rhythmOrderScored.length?"brano in coda gia affine per percussioni":
    "nessun ritmo affidabile: raccordo continuo al cambio brano",
  indexAudioReady:!!deepIndex,
  lastKnownVocal:Number.isFinite(old.lastVoiceAt)?old.lastVoiceAt:null,
  lastLyric:Number.isFinite(old.lastLyricAt)?old.lastLyricAt:null};
 console.info("[Music Box DJ] Ricerca beat in libreria: "+
  scored.length+" beat verificati, "+softScored.length+" sfumature, "+
  nearScored.length+" brani affini, "+rhythmCandidates+
  " ritmi compatibili su "+measured.length+" analizzati. "+
  shuffleLastDecision.reason);
 return {retry:unknown.length>picked.length&&noMatch,
  checked:measured.length,missing:unknown.length,noMatch};
}
let shuffleBusy=false,shuffleRetryAt=0,shuffleAttempts=0,shuffleGeneration=0;
let shuffleLastDecision=null,shuffleLastLyricFor="",shuffleLastLyric=null;
function rearmShuffleAfterVocalScan(id){
 const app=bridge(),audio=app?.audio?.();
 if(!enabled||mixing||active||mobileActive||app?.currentId?.()!==id||
    !audio||!Number.isFinite(audio.duration)||
    audio.duration-audio.currentTime<25)return false;
 shuffleGeneration++;shuffleBusy=false;shuffleRunFor="";
 shuffleRetryAt=0;shuffleAttempts=0;
 return true;
}
function maybeReorderShuffle(app,audio,id){
 if(!enabled||shuffleBusy||shuffleRunFor===id||
    Date.now()<shuffleRetryAt||shuffleAttempts>=4)return;
 const list=app.mixShuffleCandidates?.();
 if(!list?.length)return;
 shuffleBusy=true;shuffleAttempts++;
 const generation=shuffleGeneration;
 intelligentShuffle(app,audio,id).then(result=>{
  if(generation!==shuffleGeneration||app.currentId()!==id)return;
  if(result?.selected||!result?.retry)shuffleRunFor=id;
  else shuffleRetryAt=Date.now()+Math.min(20000,6000*shuffleAttempts);
 }).catch(error=>{
  if(generation===shuffleGeneration&&app.currentId()===id)
   shuffleRetryAt=Date.now()+12000;
 }).finally(()=>{
  // A stale download from the previous song cannot unlock, relock or
  // postpone the new song's candidate search.
  if(generation===shuffleGeneration)shuffleBusy=false;
 });
}
function smartScore(a,b){
 if(!a||!b||a.durationMismatch||b.durationMismatch)return -Infinity;
 // Half-time and double-time are the same pulse, but not identical BPM.
 const gap=bpmGap(a,b);
 if(!Number.isFinite(gap))return -Infinity;
 const beat=clamp(1-gap/19,0,1);
 const notes=similarNotes(a,b);
 const harmony=notes.matches?clamp(notes.score??0,0,1):0;
 const level=a.level&&b.level?clamp(1-Math.abs(Math.log2(a.level/b.level))/3,0,1):.5;
 const key=camelotMatch(a,b);
 const groove=grooveAgreement(a,b);
 // For shuffle, prefer the next song whose opening drums actually fit
 // the outgoing eight-beat pattern, not just a nearby BPM/key.
 // When either file cannot be analyzed, keep the earlier scoring method.
 const base=groove?
  beat*.26+harmony*.39+level*.08+groove.score*.27:
  beat*.34+harmony*.56+level*.10;
 const matchedBeatBonus=groove?.score>=.80&&notes.matches&&gap<=8?.035:0;
 return clamp((base*(1-key.weight)+key.score*key.weight+matchedBeatBonus)*
  ((b.introDrive===undefined||b.introDrive>=.32)?1:.73),0,1);
}

async function suggestSmartOrder(){
 const app=bridge(),state=$("mixSmartStatus"),list=$("mixSmartList"),add=$("mixSmartAdd");
 if(!app?.mixCandidates||window.MusicBoxRoom?.isActive()){
  if(state)state.textContent="Esci dall'ascolto condiviso prima di creare una sequenza.";
  return;
 }
 if(navigator.connection?.saveData||
    /^(slow-)?2g$|^3g$/i.test(String(navigator.connection?.effectiveType||""))){
  if(state)state.textContent="Risparmio dati o connessione lenta: analisi rimandata per non consumare traffico.";
  return;
 }
 const generation=++smartRun;
 smartSuggested=[];if(add)add.disabled=true;
 if(list)list.replaceChildren();
 const currentId=app.currentId(),current=app.allTracks()?.find(t=>t.id===currentId);
 const candidates=app.mixCandidates().filter(t=>t?.id&&t.url);
 if(!current||!candidates.length){
  if(state)state.textContent="Avvia una canzone e apri una playlist con altri brani disponibili.";
  return;
 }
 // Un campione di tutta la selezione, non soltanto i primi artisti
 // dell'ordinamento alfabetico. Al massimo 8 MP3 da analizzare su PC.
 const max=isIOS?4:8,count=Math.min(max,candidates.length),picked=[];
 for(let k=0;k<count;k++){
  const at=Math.min(candidates.length-1,Math.floor((k+.5)*candidates.length/count));
  const track=candidates[at];
  if(track&&!picked.some(x=>x.id===track.id))picked.push(track);
 }
 if(state)state.textContent="Analisi musicale in corso · 0/"+picked.length+" canzoni…";
 let analysed=0;
 const currentInfo=await decode(current);
 if(generation!==smartRun)return;
 if(!currentInfo){
  if(state)state.textContent="Impossibile analizzare l'MP3 attuale: non invento una compatibilità musicale.";
  return;
 }
 const entries=[];
 // 2 richieste parallele al massimo: evita di saturare la connessione
 // o la RAM del browser quando l'utente possiede centinaia di canzoni.
 let position=0;
 const worker=async()=>{
  while(position<picked.length&&generation===smartRun){
   const index=position++,track=picked[index];
   const info=await decode(track);
   if(generation!==smartRun)return;
   analysed++;
   if(info)entries.push({track,info});
   if(state)state.textContent="Analisi musicale in corso · "+analysed+"/"+picked.length+" canzoni…";
  }
 };
 await Promise.all([worker(),worker()]);
 if(generation!==smartRun)return;
 if(!entries.length){
  if(state)state.textContent="Questi MP3 non permettono l'analisi: la coda originale resta invariata.";
  return;
 }
 const ranked=[],remaining=entries.slice();
 let previous=currentInfo;
 while(remaining.length&&ranked.length<3){
  remaining.sort((x,y)=>smartScore(previous,y.info)-smartScore(previous,x.info));
  const chosen=remaining.shift(),score=smartScore(previous,chosen.info);
  // Avoid recommending incompatible pairs simply to fill three slots.
  if(!Number.isFinite(score)||score<.59)break;
  ranked.push({...chosen,score});
  previous=chosen.info;
 }
 // Se l'utente ha cambiato canzone o playlist, non proporgli una coda vecchia.
 if(app.currentId()!==currentId || window.MusicBoxRoom?.isActive()){
  if(state)state.textContent="La riproduzione è cambiata: premi di nuovo per ricalcolare.";
  return;
 }
 smartSuggested=ranked.map(x=>x.track.id);
 if(!ranked.length){
  if(state)state.textContent="Nessuna coppia sufficientemente armonica in questo gruppo. La coda resta invariata.";
  if(add)add.disabled=true;
  return;
 }
 if(state)state.textContent="Sequenza consigliata · "+entries.length+
  " brani analizzati confrontando tempo, Camelot e note reali (stime).";
 if(list){
  const fragment=document.createDocumentFragment();
  ranked.forEach((x,i)=>{
   const row=document.createElement("li");
   const name=document.createElement("strong");
   name.textContent=(i+1)+". "+String(x.track.title||"Brano");
   const details=document.createElement("small");
   details.textContent=(x.track.artist?x.track.artist+" · ":"")+
     x.info.bpm+" BPM · "+((x.info.camelot?.code?"Camelot "+x.info.camelot.code+" (stima)":keyGuess(x.info.chroma))||"tonalità non disponibile");
   row.append(name,details);fragment.appendChild(row);
  });
  list.replaceChildren(fragment);
 }
 if(add)add.disabled=false;
}

let checkingCurrentAudio=false,verifyRequestedTrackId=null;
async function verifyCurrentAudio(targetId=null){
 const button=$("mixVerifyCurrent"),status=$("mixVerifyStatus");
 if(checkingCurrentAudio)return;
 const app=bridge(),song=app?.allTracks()?.find(t=>t.id===(targetId||app.currentId()));
 if(!song){
  if(status)status.textContent="Riproduci prima il brano che vuoi controllare.";
  return;
 }
 const url=app.mixUrl?.(song)||song.url;
 if(!url){
  if(status)status.textContent="Questo brano non ha una sorgente MP3 verificabile.";
  return;
 }
 const name=String(song.title||"Brano");
 checkingCurrentAudio=true;
 if(button)button.disabled=true;
 if(status)status.textContent="Verifico "+name+": download e decodifica senza avviare la musica…";
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
 let ctx=null;
 try{
  const maxSize=isIOS?16000000:32000000;
  // Un download di prova indipendente non sostituisce o modifica le cache
  // offline di Music Box; evita risultati vecchi quando esiste un MP3 online.
  const fetched=new URL(url,location.href);
  if(fetched.protocol!=="https:"&&fetched.protocol!=="http:")throw Error("Indirizzo MP3 non supportato");
  const trusted=fetched.hostname==="raw.githubusercontent.com"&&
   fetched.pathname.startsWith("/stefanovillaggio8-dot/music-box-brani/");
  if(trusted)fetched.searchParams.set("mb-check","1");
  const response=await fetch(fetched.href,{cache:"no-store",signal:controller.signal});
  if(!response.ok)throw Error("Risposta HTTP "+response.status+": file non disponibile o non raggiungibile");
  const declared=Number(response.headers.get("content-length")||0);
  if(declared>maxSize)throw Error("File troppo grande per il controllo sul dispositivo; non significa che sia corrotto");
  let data;
  if(response.body?.getReader){
   const reader=response.body.getReader(),pieces=[];let total=0;
   while(true){
    const part=await reader.read();
    if(part.done)break;
    total+=part.value.length;
    if(total>maxSize){await reader.cancel();throw Error("File troppo grande per la memoria disponibile per il controllo")}
    pieces.push(part.value);
   }
   data=new Uint8Array(total);let offset=0;
   for(const piece of pieces){data.set(piece,offset);offset+=piece.length}
  }else{
   const buffer=await response.arrayBuffer();
   if(buffer.byteLength>maxSize)throw Error("File troppo grande per il controllo");
   data=new Uint8Array(buffer);
  }
  if(data.length<4096)throw Error("File troppo corto: MP3 incompleto o vuoto");
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)throw Error("Il browser non permette la verifica della decodifica");
  ctx=new Ctx();
  let decoded;
  try{decoded=await ctx.decodeAudioData(data.buffer.slice(0))}
  catch(_){throw Error("Decodifica fallita: possibile MP3 corrotto, incompleto o formato non supportato")}
  if(!Number.isFinite(decoded.duration)||decoded.duration<5)
   throw Error("Durata audio non valida dopo la decodifica");
  const analysis=analyzeFrames(decoded);
  const expected=Number(song.spotifyDurationMs||0)/1000||Number(song.expectedDurationSec||0);
  const mismatch=expected>20&&Math.abs(decoded.duration-expected)>Math.max(7,expected*.07);
  const recorded=Number(song._mbUltimoErroreAudio||0);
  const report=name+" · "+(data.length/1e6).toFixed(2)+" MB"+
   " · durata "+decoded.duration.toFixed(1)+" s"+
   (expected>20?" (catalogo "+expected.toFixed(1)+" s)":"")+
   ". "+(mismatch?
    "ATTENZIONE: MP3 probabilmente incompleto o versione sbagliata: "+
    Math.round(Math.abs(decoded.duration-expected))+
    " secondi di differenza. Non considerarlo verificato; sostituisci il file con una copia corretta. ":
    "Decodifica riuscita; non sono emerse discrepanze di durata note. ")+
   (analysis.confidentTail?
    "Finale poco musicale o muto rilevato: "+analysis.trailing.toFixed(1)+" s. ":"")+
   (recorded===3?"Il player ha segnalato un errore di decodifica. ":"")+
   "La decodifica da sola non conferma che la registrazione sia quella giusta.";
  if(status)status.textContent=report;
 }catch(error){
  if(status)status.textContent=name+" · verifica non riuscita: "+
   String(error?.message||error||"errore sconosciuto")+
   ". Non sostituire automaticamente l'MP3: controlla la sorgente.";
 }finally{
  clearTimeout(timeout);
  if(ctx)try{await ctx.close()}catch(_){}
  checkingCurrentAudio=false;
  if(button)button.disabled=false;
 }
}
function settingsChanged(){
 try{
  localStorage.setItem("mb.mixStyle",style);
  localStorage.setItem("mb.mixSeconds",String(mixSeconds));
 }catch(e){}
 if(!mixing){plan=null;plannedFor="";dropPrepared()}
 draw();
}
// Both switches call the same state setter. On iPhone the menu button
// may be disabled/hidden, and programmatically clicking it was a no-op.
function setMixEnabled(value){
 const requested=Boolean(value);
 if(enabled===requested){draw();return}
 enabled=requested;
 try{localStorage.setItem("mb.djmix",enabled?"on":"off")}catch(e){}
 if(!enabled){cancel();plannedFor="";plan=null;resetMobileFade()}
 else {
  previousId="";plannedFor="";
  // Turning the primary Mix switch on also enables iPhone mixing. The
  // separate iPhone toggle remains available for disabling overlays.
  if(isIOS){
   mobileOverlayEnabled=true;
   try{localStorage.setItem("mb.mixIphone","on")}catch(_){}
   bridge()?.mixEnableAudio?.();
  }
  // Do not pull a multi-megabyte harmonic index in the same tap as play.
  if(!deepIndex)setTimeout(()=>{if(enabled&&!document.hidden)
   loadDeepIndex().catch(()=>{})},isIOS?2200:0);
 }
 draw();
 toast(enabled?"Mix intelligente attivato.":"Mix intelligente disattivato.");
}
function start(){
 // A disabled DJ must not download the entire musical index. Safari's
 // native first MP3 has priority over index parsing and network requests.
 if(enabled){
  if(isIOS)setTimeout(()=>{if(enabled&&!document.hidden)
   loadDeepIndex().catch(()=>{})},3500);
  else loadDeepIndex().catch(()=>{});
 }
 // The cloud batch index grows while music is playing: adopt new analyzed
 // tracks automatically, without reloading the tab or re-downloading MP3s.
 setInterval(()=>{
  if(enabled&&!document.hidden)loadDeepIndex(true).catch(()=>{});
 },15*60*1000);
 const btn=$("btnMixIntelligente");
 btn?.addEventListener("click",()=>setMixEnabled(!enabled));
 const panel=$("mixPanel");
 $("btnMixSettings")?.addEventListener("click",()=>{
  verifyRequestedTrackId=null;
  const verifyButton=$("mixVerifyCurrent");
  if(verifyButton)verifyButton.textContent="Verifica il brano in ascolto";
  try{bridge()?.closeOther?.()}catch(e){}
  if(panel)panel.hidden=false;
  draw();updateDetails(null,null);
 });
 $("mixClose")?.addEventListener("click",()=>{if(panel)panel.hidden=true});
 panel?.addEventListener("click",e=>{if(e.target===panel)panel.hidden=true});
 $("mixStyle")?.addEventListener("change",e=>{
  if(allowedStyles.has(e.target.value)){style=e.target.value;settingsChanged()}
 });
 $("mixSeconds")?.addEventListener("input",e=>{
  mixSeconds=clamp(Math.round(Number(e.target.value)||6),3,12);
  settingsChanged();
 });
 $("mixToggle")?.addEventListener("click",event=>{
  event.preventDefault();
  event.stopPropagation();
  setMixEnabled(!enabled);
 });
 $("mixIphoneToggle")?.addEventListener("click",()=>{
  mobileOverlayEnabled=!mobileOverlayEnabled;
  try{localStorage.setItem("mb.mixIphone",mobileOverlayEnabled?"on":"off")}catch(e){}
  if(!mobileOverlayEnabled)stopMobileMix();
  else if(enabled)bridge()?.mixEnableAudio?.();
  draw();
 });
 $("mixVerifyCurrent")?.addEventListener("click",()=>{verifyCurrentAudio(verifyRequestedTrackId).catch(()=>{});});
 $("mixSmartOrder")?.addEventListener("click",()=>{
  suggestSmartOrder().catch(e=>{
   const status=$("mixSmartStatus");
   if(status)status.textContent="Analisi non disponibile. La coda non è stata cambiata.";
  });
 });
 $("mixSmartAdd")?.addEventListener("click",()=>{
  const added=bridge()?.mixEnqueue?.(smartSuggested)||0;
  if(added){
   const status=$("mixSmartStatus");
   if(status)status.textContent=added+" brani aggiunti in fondo alla coda. Playlist originale invariata.";
   smartSuggested=[];
   const btn=$("mixSmartAdd");if(btn)btn.disabled=true;
   toast("Aggiunti "+added+" brani alla coda in ordine armonico.");
  }
 });
 draw();
 setInterval(()=>{try{tick()}catch(e){}},isIOS?650:350);
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
   // This event still fires when foreground timers are suspended.
   // Restore the native player's uninterrupted background playback.
   stopMobileMix();
   resetMobileFade();
  }else if(enabled){
   plannedFor="";
   if(isIOS&&!deepIndex)setTimeout(()=>{if(enabled&&!document.hidden)
    loadDeepIndex().catch(()=>{})},2200);
   try{tick()}catch(e){}
  }
 });
 window.addEventListener("pageshow",()=>{if(enabled){plannedFor="";try{tick()}catch(e){}}});
}
window.MusicBoxMix={isEnabled:()=>enabled,
 pauseForOffline:()=>{
  offlineTransferPriority=true;
  try{deepTransferController?.abort()}catch(_){}
  djPlaybackEpoch++;
  for(const ctrl of djFetchControllers)try{ctrl.abort()}catch(_){}
  djFetchControllers.clear();
 },
 resumeAfterOffline:()=>{
  offlineTransferPriority=false;
  if(enabled&&!deepIndex&&!document.hidden)scheduleDeepIndexRetry(1400);
 },
 needsAudioContext:()=>enabled&&mobileOverlayEnabled,
 isAnalyzing:()=>pending.size>0,cancel,naturalEndHandoff,
 deepProgress:()=>({analyzed:deepIndex?.analyzed||0,total:deepIndex?.sourceCount||0}),
 diagnostics:()=>{
  const app=bridge(),audio=app?.audio?.(),id=app?.currentId?.(),next=app?.mixNext?.();
  const track=app?.allTracks?.()?.find(t=>t.id===id);
  const url=track&&(app?.mixUrl?.(track)||track.url);
  const a=url&&(cache.get(String(url))||deepLookup(track));
  const points=liveOutro?.audio===audio?liveOutro.samples:[];
  return {
   enabled,isIOS,current:id,next:next?.id||null,
   deepIndexLoaded:!!deepIndex,offlineTransferPriority,
   audioContextState:app?.mixRunningContext?.()?.state||"not-running",
   remaining:Number.isFinite(audio?.duration)?Math.round((audio.duration-audio.currentTime)*10)/10:null,
   analysisReady:!!a,deepIndexed:!!deepLookup(track),
   analysisDuration:a?.duration??null,lastAudible:a?.last??null,
   lastLyricAt:app?.mixLyricCues?.(id)?.last??null,
   lastVoiceAt:a?.lastVoiceAt??null,
   dropRelease:a?.dropRelease||null,softOutro:a?.softOutro||null,
   confidentTail:!!a?.confidentTail,
   plannedKind:plan?.kind||null,plannedBegin:plan?.begin??null,
   instrumentalBeatBridge:!!plan?.instrumentalBeatBridge,
   measuredBeatBridge:!!plan?.measuredBeatBridge,
   pulseUnderlay:!!plan?.pulseUnderlay,
   mobileMixLastBlocker,mobileMixLastStartedAt,
   certifiedQuietAlternative:!!plan?.neutralRelease,
   shuffleSearch:shuffleLastDecision&&shuffleLastDecision.outgoing===id?
    shuffleLastDecision:null,
   shuffleBusy,
   previewReady:!!prepared?.ready,previewFailed:!!prepared?.failed,
   mobileClipReady:!!(next&&mobileIntroClips.has(String(app?.mixUrl?.(next)||next.url))),
   mobileClipFailure:mobileClipFailure?.source===String(app?.mixUrl?.(next)||next?.url)?
    mobileClipFailure.reason:null,mobileClipMetrics:{...mobileClipMetrics},
   previewMatches:!!(prepared&&prepared.id===next?.id&&prepared.fromId===id),
   liveSampleCount:points.length,liveContext:liveOutro?.ctx?.state||"unsupported",
   liveRms:points.at(-1)?.rms??null,
   liveQuietEligible:liveQuietOutroReady(points,
    audio?.duration,audio?.currentTime,app?.mixLyricCues?.(id)?.last,a?.lastVoiceAt)
  };
 },

 verifyTrack:(id)=>{
  const app=bridge(),exists=app?.allTracks()?.some(t=>t.id===id);
  const panel=$("mixPanel");
  if(!exists||!panel)return false;
  verifyRequestedTrackId=id;
  const verifyButton=$("mixVerifyCurrent");
  if(verifyButton)verifyButton.textContent="Ripeti verifica MP3 selezionato";
  try{app.closeOther?.()}catch(e){}
  panel.hidden=false;
  try{app.syncScroll?.()}catch(e){}
  verifyCurrentAudio(id).catch(()=>{});
  return true;
 },
  // Taglia SOLO un'introduzione effettivamente muta già verificata.
  // Non aspettare la fine della precedente se il player ne ha i dati pronti.
  introStart:(id)=>{
   // Turning DJ Mix OFF must also disable previously measured intro skips.
   // Otherwise the player still behaved like Mix was active on iPhone.
   if(!enabled)return 0;
   const app=bridge(),track=app?.allTracks()?.find(t=>t.id===id);
   if(!track)return 0;
   const source=app.mixUrl?.(track)||track.url;
   const measured=deepLookup(track)||cache.get(String(source));
   // Skip only verified digital silence; preserve low-volume instruments.
   return Number.isFinite(measured?.safeIntroAt)?clamp(measured.safeIntroAt,0,18):0;
  },
 onSeek:(reason)=>{
  // Metadata/loading/resync can trigger seeking on the newly selected
  // song. It is NOT a user's scrub: keep the audible preview alive until
  // the main audio clock has actually resumed.
  const target=bridge()?.currentId?.();
  if(reason!=="user"&&
    ((active?.handingOff&&active.track.id===target)||
     (mobileActive?.handingOff&&mobileActive.track.id===target)))return;
  abortObsoleteDJWork();cancel();plan=null;plannedFor="";previousId="";
  shuffleGeneration++;shuffleBusy=false;shuffleRunFor="";
 },
 onTrackChange:(id)=>{
  abortObsoleteDJWork();
  // Immediately invalidate pending shuffle work on EACH song change.
  // A previous catalog fetch must not disable the next DJ transition.
  shuffleGeneration++;shuffleBusy=false;shuffleRetryAt=0;shuffleAttempts=0;
  shuffleRunFor="";shuffleLastDecision=null;
  quietHandoffFor="";plannedFor="";plan=null;
  if(mobileActive&&!(mobileActive.handingOff&&mobileActive.track.id===id))stopMobileMix();
  if(active&&!(active.handingOff&&active.track.id===id))cancel();
 },
 openSettings:()=>{const p=$("mixPanel");if(p)p.hidden=false}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();