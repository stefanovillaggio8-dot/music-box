/* Music Box · optional on-device Whisper word alignment.
   Audio stays in the browser; model weights are fetched only once by the
   on-demand worker. Never invent word times, never replace trusted LRCLIB. */
(function(root){
"use strict";
const $=id=>typeof document==="undefined"?null:document.getElementById(id);
const VERSION=1,MAX_AUDIO_BYTES=18*1024*1024,WINDOW=28,FS=16000;
const RETRY_MS=24*3600000;
const active=new Set();
const attempts=new Map();
const normalized=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9']+/g,"").replace(/'/g,"");
const wordTokens=s=>String(s||"").match(/\S+\s*/gu)||[];
function recognizedWords(raw,offset=0){
 if(!Array.isArray(raw))return [];
 const out=[];
 for(const part of raw){
  const ts=part?.timestamp,t=Number(ts?.[0]),end=Number(ts?.[1]);
  const text=String(part?.text||"").trim();
  if(!text||text.length>60||text.split(/\s+/).length!==1||
     !Number.isFinite(t)||!Number.isFinite(end)||t<0||end<t)continue;
  const key=normalized(text);
  if(key)out.push({t:Math.round((t+offset)*1000)/1000,
    end:Math.round((end+offset)*1000)/1000,key});
 }
 return out;
}
// Only all-exact, ordered word matches can earn timing. A repeated chorus
// at the wrong position cannot drift more than 850ms from its LRC cue.
function alignWindow(lines,transcribed,offset=0,duration=WINDOW){
 if(!Array.isArray(lines)||!Array.isArray(transcribed))return [];
 const words=recognizedWords(transcribed,offset);
 if(!words.length)return [];
 const results=[],end=offset+duration;
 for(let j=0;j<lines.length;j++){
  const row=lines[j],start=Number(row?.t),next=Number(lines[j+1]?.t);
  if(!Number.isFinite(start)||start<offset+.15||start>end-1.1||
     row?.words?.length>=2)continue;
  const limit=Math.min(end-.04,Number.isFinite(next)?next-.05:start+10,start+11);
  if(limit-start<.45)continue;
  const tokens=wordTokens(row.text),keys=tokens.map(normalized);
  if(tokens.length<3||tokens.length>22||keys.some(k=>!k)||
     new Set(keys).size<2||String(row.text||"").length>220)continue;
  const candidates=words.filter(w=>w.t>=start-.45&&w.t<=limit+.1);
  if(candidates.length<tokens.length||candidates.length>34)continue;
  let best=null;
  for(let k=0;k<candidates.length;k++){
   if(candidates[k].key!==keys[0]||Math.abs(candidates[k].t-start)>.85)continue;
   const found=[candidates[k]];let cursor=k+1;
   for(let w=1;w<tokens.length;w++){
    // Allow at most 2 unrelated words between correctly recognized tokens.
    let hit=-1;
    for(let n=cursor;n<Math.min(candidates.length,cursor+3);n++)
     if(candidates[n].key===keys[w]){hit=n;break}
    if(hit<0)break;
    found.push(candidates[hit]);cursor=hit+1;
   }
   if(found.length!==tokens.length||found.some((w,i)=>i>0&&w.t<found[i-1].t))
    continue;
   if(found[found.length-1].t>=limit+.16||
      found[found.length-1].end>limit+.7)continue;
   const cost=Math.abs(found[0].t-start)+
     .12*Math.max(0,found[found.length-1].end-limit);
   if(!best||cost<best.cost)best={found,cost};
  }
  if(!best)continue;
  const parts=tokens.map((text,i)=>{
   const seen=best.found[i],nextWord=best.found[i+1];
   const safeEnd=Math.max(seen.t,Math.min(seen.end,
     nextWord?nextWord.t:limit));
   return {text,t:seen.t,end:safeEnd};
  });
  // Round-tripping is mandatory: the user-supplied lyric line is authoritative.
  if(parts.map(w=>w.text).join("").trim()!==String(row.text||"").trim())continue;
  results.push({t:start,text:String(row.text).trim(),words:parts});
 }
 return results;
}
function pcmSlice(buffer,from,seconds=WINDOW){
 const sr=Number(buffer?.sampleRate),count=Number(buffer?.length);
 if(!Number.isFinite(sr)||sr<FS||!Number.isFinite(count)||count<1)
  throw Error("Invalid decoded audio");
 const l=buffer.getChannelData(0);
 const r=buffer.numberOfChannels>1?buffer.getChannelData(1):null;
 const start=Math.floor(from*sr);
 const available=Math.max(0,Math.min(count-start,Math.floor(seconds*sr)));
 if(available<sr*2)throw Error("Insufficient audio data");
 const length=Math.floor(available*FS/sr),pcm=new Float32Array(length);
 const step=sr/FS;
 for(let i=0;i<length;i++){
  const begin=start+Math.floor(i*step);
  const last=Math.min(count,start+Math.floor((i+1)*step));
  let sum=0;
  for(let j=begin;j<Math.max(begin+1,last);j++)
   sum+=r?(l[j]+r[j])*.5:l[j];
  pcm[i]=sum/Math.max(1,last-begin);
 }
 return pcm;
}
function canRun(){
 if(typeof navigator==="undefined"||typeof document==="undefined"||
    navigator.onLine===false||document.hidden||!navigator.gpu||
    navigator.connection?.saveData||!window.Worker)return false;
 if(/2g|3g/.test(navigator.connection?.effectiveType||""))return false;
 return true;
}
let worker=null,sequence=0,pending=new Map();
function requestWorker(data){
 if(!worker){
  worker=new Worker("audio-lyrics-worker.js?v=6707",{type:"module"});
  worker.onmessage=e=>{
   const id=Number(e.data?.id),request=pending.get(id);
   if(!request)return;
   pending.delete(id);
   if(e.data?.error)request.reject(Error(String(e.data.error)));
   else request.resolve(e.data?.chunks||[]);
  };
  worker.onerror=()=>{
   for(const req of pending.values())req.reject(Error("Model initialization failed"));
   pending.clear();try{worker.terminate()}catch(_){}
   worker=null;
  };
 }
 const id=++sequence;
 return new Promise((resolve,reject)=>{
  pending.set(id,{resolve,reject});
  worker.postMessage({id,pcm:data},[data.buffer]);
 });
}
function setStatus(value){
 const el=$("lyricsAudioStatus");
 if(el)el.textContent=value;
}
function preferredWindows(lines,duration){
 const blocks=[...new Set(lines.filter(l=>!l.words?.length&&Number.isFinite(Number(l.t)))
  .map(row=>Math.floor(Math.max(0,row.t-.6)/WINDOW)*WINDOW))]
  .filter(at=>at<duration-3);
 // Current verse first, then earlier verses. Never process beyond a
 // bounded number of windows in one foreground listening session.
 const now=Number(window.MusicBoxBridge?.audio?.()?.currentTime)||0;
 blocks.sort((a,b)=>Math.abs(a-now)-Math.abs(b-now));
 return blocks;
}
async function analyze(id){
 if(!canRun())return false;
 const bridge=window.MusicBoxBridge;
 if(!bridge||bridge.currentId?.()!==id)return false;
 const rows=bridge.lyricsData?.()?.synced||[];
 if(rows.length<3||rows.every(row=>row.words?.length>=2))return false;
 const last=Number(sessionStorage.getItem("mb.audioWords.fail."+id)||0);
 if(last&&Date.now()-last<RETRY_MS)return false;
 const track=bridge.allTracks?.().find(t=>t.id===id);
 const src=track&&bridge.mixUrl?.(track);
 if(typeof src!=="string"||!src)return false;
  const absolute=new URL(src,document.baseURI);
  if(!/^(https?:|blob:)$/i.test(absolute.protocol))return false;
 const profile=String(bridge.profile?.()||"");
 setStatus("Analisi voce locale: preparo il brano…");
 let ctx;
 try{
  const response=await fetch(absolute.href,{cache:"force-cache"});
  if(!response.ok)throw Error("Music download unavailable");
  const declared=Number(response.headers.get("content-length"));
  if(declared>MAX_AUDIO_BYTES)throw Error("Track too large for mobile-safe analysis");
  const blob=await response.blob();
  if(blob.size>MAX_AUDIO_BYTES)throw Error("Track too large");
  const bytes=await blob.arrayBuffer();
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)throw Error("Audio decoding not available");
  ctx=new AudioCtor();
  const decoded=await ctx.decodeAudioData(bytes);
  const duration=Math.min(decoded.duration,3600);
  const windows=preferredWindows(rows,duration);
  if(!windows.length)return false;
  const isPhone=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||"");
  // Mobile: only one short window per visit; no full-song inference in
  // the foreground, which could kill the PWA or interrupt Smart Mix.
  const budget=isPhone?1:3;
  let saved=0,scanned=0;
  for(const at of windows){
   if(scanned>=budget||active.has(id)===false||document.hidden||
     bridge.currentId?.()!==id)break;
   const key="mb.audioWords.attempt."+VERSION+"."+profile+"."+id+"."+at;
   if(Date.now()-Number(sessionStorage.getItem(key)||0)<6*3600000)continue;
   scanned++;
   const sample=pcmSlice(decoded,at,WINDOW);
   setStatus("Analizzo la voce: "+Math.round(at)+"–"+
     Math.round(Math.min(duration,at+WINDOW))+" s…");
   const chunks=await requestWorker(sample);
   if(active.has(id)===false||bridge.currentId?.()!==id)break;
   const aligned=alignWindow(rows,chunks,at,Math.min(WINDOW,duration-at));
   sessionStorage.setItem(key,String(Date.now()));
   if(!aligned.length)continue;
   const stored=await bridge.saveAudioWordRows?.(id,aligned);
   saved+=Number(stored)||0;
   if(saved>0)setStatus("IA locale: "+saved+" frasi con parole allineate");
  }
  if(!saved)setStatus("Voce troppo ambigua: mantengo i tempi originali");
  return saved>0;
 }catch(e){
  sessionStorage.setItem("mb.audioWords.fail."+id,String(Date.now()));
  setStatus("Analisi audio non disponibile: karaoke originale conservato");
  return false;
 }finally{
  try{await ctx?.close()}catch(_){}
  if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||"")&&
     worker&&!pending.size){
    try{worker.terminate()}catch(_){}
    worker=null;
  }
 }
}
function request(id){
 id=String(id||window.MusicBoxBridge?.currentId?.()||"");
 if(!id||active.has(id)||!canRun())return false;
 const now=Date.now(),last=attempts.get(id)||0;
 if(now-last<15000)return false;
 attempts.set(id,now);
 active.add(id);
 // Do not hold up UI events or voice playback. Use idle time if available.
 const start=()=>{
  if(!active.has(id))return;
  analyze(id).finally(()=>active.delete(id));
 };
 if(typeof requestIdleCallback==="function")
  requestIdleCallback(start,{timeout:2500});
 else setTimeout(start,1600);
 return true;
}
root.MusicBoxAudioAlign={request,alignWindow,recognizedWords,pcmSlice,preferredWindows};
})(typeof window!=="undefined"?window:globalThis);
