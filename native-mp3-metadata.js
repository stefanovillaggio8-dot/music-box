/* Metadata-only recovery for a demonstrated Linux WebKit native-decoder fault.
   Original downloads remain immutable. No PCM decode, model, database or cache writes. */
(function(root){
'use strict';
let active=null,index=null,repairsApplied=0,last={state:'idle'};
const finite=Number.isFinite;
const supported=()=>/Linux/i.test(root.navigator?.userAgent||'')&&/AppleWebKit\//.test(root.navigator?.userAgent||'')&&!/Chrome|Chromium|Edg|Android/i.test(root.navigator?.userAgent||'');
const hash=async bytes=>Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
const visible=()=>!root.document?.hidden;
function arm(audio,options={}){
 active?.cancel('superseded');active=null;
 if(!supported()||!audio||!root.crypto?.subtle||typeof options.current!=='function')return;
 const s={audio,closed:false,attempted:false,applied:false,controller:null,timer:null,timeout:null,blob:null,job:null,generation:0};active=s;
 const owns=()=>!s.closed&&options.current();
 const invalid=()=>audio.readyState>=1&&finite(audio.duration)&&audio.duration>=0&&audio.duration<=.05&&audio.currentTime<=.05;
 const wanted=()=>options.wantsPlayback?.()===true;
 const record=(state,reason)=>{last={state,reason:reason||null,sourceReplaced:s.applied};};
 const clearTimer=()=>{if(s.timer!=null)root.clearTimeout(s.timer);s.timer=null;};
 const stopNetwork=()=>{s.generation++;s.controller?.abort();s.controller=null;if(s.timeout!=null)root.clearTimeout(s.timeout);s.timeout=null;};
 const events=['loadedmetadata','durationchange','canplay','playing','progress','timeupdate'];
 const detach=()=>{clearTimer();for(const e of events)audio.removeEventListener(e,onEvent);audio.removeEventListener('seeking',onSeek);root.document?.removeEventListener('visibilitychange',onVisibility);};
 s.cancel=reason=>{if(s.closed)return;s.closed=true;detach();stopNetwork();if(s.blob){root.URL.revokeObjectURL(s.blob);s.blob=null;}if(audio._mbNativeMetadataCleanup===s.cancel)delete audio._mbNativeMetadataCleanup;if(active===s)active=null;record('cancelled',reason);};
 audio._mbNativeMetadataCleanup=s.cancel;
 const bounded=async(url,limit,signal)=>{
  const r=await root.fetch(url,{cache:'force-cache',signal});
  if(!r.ok||Number(r.headers.get('content-length'))>limit)throw Error('Metadata source unavailable');
  const bytes=await r.arrayBuffer();if(bytes.byteLength>limit)throw Error('Metadata source too large');return bytes;
 };
 async function repair(){
  s.timer=null;if(!owns()||!visible()||!wanted()||!invalid()||s.attempted)return;
  s.attempted=true;const generation=++s.generation,controller=new AbortController();s.controller=controller;record('preparing');
  s.timeout=root.setTimeout(()=>controller.abort(),12000);
  try{
   if(!index){const bytes=await bounded('./native-mp3-metadata.json?v=1',32768,controller.signal);const parsed=JSON.parse(new TextDecoder().decode(bytes));if(parsed.version!==1||!parsed.entries)throw Error('Metadata index schema');index=parsed;}
   const canonical=new root.URL(options.canonical||options.url,root.location.href);
   const match=Object.entries(index.entries).find(([key])=>canonical.pathname.endsWith('/'+key.split('/').slice(1).join('/'))),p=match?.[1];
   if(!p||p.method!=='mp3-frame-count-prefix-identical-pcm-v1'||p.browserVerified!==true||
      !/^[a-f0-9]{64}$/.test(p.sourceSha256)||!/^[a-f0-9]{64}$/.test(p.wrappedSha256)||
      !Number.isInteger(p.sourceBytes)||p.sourceBytes<1024||p.sourceBytes>16*1024*1024||
      !Number.isInteger(p.insertAt)||p.insertAt<0||p.insertAt>=p.sourceBytes||!finite(p.duration)||p.duration<26||
      ![44100,48000].every(rate=>/^[a-f0-9]{64}$/.test(p.pcmIdentity?.[rate]?.sha256)&&Number.isInteger(p.pcmIdentity[rate].bytes)&&p.pcmIdentity[rate].bytes>0))throw Error('No verified metadata representation');
   const identity=p.nativePcmIdentity;
   if(identity?.method!=='actual-native-metadata-identical-pcm-v1'||identity.sourceSha256!==p.sourceSha256||identity.wrappedSha256!==p.wrappedSha256||
      ![44100,48000].every(rate=>{const r=identity.rates?.[rate];return r&&Number.isInteger(r.frames)&&r.frames>0&&Math.abs(r.frames/rate-p.duration)<.1&&r.channels===2&&r.maximumSampleDifference===0&&r.browsers?.length===2&&r.browsers.includes('chromium')&&r.browsers.includes('webkit')}))throw Error('Missing exact native PCM identity');
   const prefix=Uint8Array.from(root.atob(p.prefixBase64),v=>v.charCodeAt(0));if(!prefix.length||prefix.length>2048||p.wrappedBytes!==p.sourceBytes+prefix.length)throw Error('Metadata prefix bounds');
   const bytes=await bounded(options.url,p.sourceBytes,controller.signal);
   if(bytes.byteLength!==p.sourceBytes||await hash(bytes)!==p.sourceSha256)throw Error('Original MP3 identity changed');
   const original=new Uint8Array(bytes),wrapped=new Uint8Array(p.wrappedBytes);wrapped.set(original.subarray(0,p.insertAt));wrapped.set(prefix,p.insertAt);wrapped.set(original.subarray(p.insertAt),p.insertAt+prefix.length);
   if(await hash(wrapped)!==p.wrappedSha256)throw Error('Metadata representation identity changed');
   if(!owns()||controller.signal.aborted||generation!==s.generation||!visible()||!invalid())return;
   s.blob=root.URL.createObjectURL(new Blob([wrapped],{type:'audio/mpeg'}));s.applied=true;repairsApplied++;
   // Keep canonical source identity, native mute, volume and pending initial seek.
   // Existing loadedmetadata handlers perform the requested position once valid.
   audio._mbCambioBrano=true;audio.src=s.blob;detach();record('applied');
   if(owns()&&wanted())Promise.resolve(audio.play()).catch(()=>{});
  }catch(error){if(owns()&&generation===s.generation)record('unavailable',String(error.message||error));}
  finally{if(generation===s.generation){if(s.timeout!=null)root.clearTimeout(s.timeout);s.timeout=null;s.controller=null;}}
 }
 function onEvent(){
  if(!owns()){s.cancel('source-changed');return;}
  if(s.applied)return;
  if(!invalid()){
   clearTimer();
   if(audio.readyState>=1&&finite(audio.duration)&&audio.duration>.05){
    detach();stopNetwork();s.closed=true;
    if(audio._mbNativeMetadataCleanup===s.cancel)delete audio._mbNativeMetadataCleanup;
    if(active===s)active=null;record('native-metadata-ready');
   }
   return;
  }
  if(visible()&&wanted()&&!s.attempted&&s.timer==null){record('waiting');s.timer=root.setTimeout(()=>{s.job=repair();},600);}
 }
 function onSeek(){if(!s.applied)s.cancel('seek');}
 function onVisibility(){
  if(!visible()){clearTimer();if(s.controller){stopNetwork();s.attempted=false;record('background-cancelled');}}
  else onEvent();
 }
 for(const e of events)audio.addEventListener(e,onEvent);audio.addEventListener('seeking',onSeek);root.document?.addEventListener('visibilitychange',onVisibility);onEvent();
 return s.cancel;
}
root.MusicBoxNativeMetadata={arm,cancel:reason=>active?.cancel(reason),diagnostics:()=>({...last,repairsApplied}),whenIdle:()=>active?.job||Promise.resolve()};
})(typeof window!=='undefined'?window:globalThis);
