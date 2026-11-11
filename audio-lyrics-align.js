/* Music Box · optional on-device Whisper word alignment.
   Audio stays in the browser; model weights are fetched only once by the
   on-demand worker. Never invent word times, never replace trusted LRCLIB. */
(function(root){
"use strict";
const $=id=>typeof document==="undefined"?null:document.getElementById(id);
const VERSION=2,MAX_AUDIO_BYTES=18*1024*1024,WINDOW=28,STEP=24,FS=16000;
const MAX_MOBILE_BYTES=8*1024*1024,WORKER_TIMEOUT_MS=90000;
const RETRY_MS=24*3600000;
const active=new Set(),completedInSession=new Set();
const attempts=new Map(),sessionWindows=new Map();
// Keep each foreground WebGPU pass short; permit later, separate lyric clips.
const MOBILE_SESSION_WINDOW_CAP=3,DESKTOP_SESSION_WINDOW_CAP=6;

/* Read the existing timed lyrics to select Whisper's explicit language.
   Transformers.js 3.8.1 otherwise silently assumes English even for the
   multilingual model. Unknown/mixed lyrics are left untouched rather than
   making up Italian/English word timestamps. No external language API. */
const ASR_LANGUAGE_MARKERS=Object.freeze({"it":"che sono siamo non perche perché voglio vuoi volevo vorrei dentro senza ancora niente sempre ormai adesso questo questa questi queste quello quella quelli quelle tutto tutta tutti tutte posso potrei sappiamo dimmi dirti davvero davvero invece soltanto mentre allora pure sai so cuore occhi stanotte notte sogni sogno strada pensieri pensiero amore amarti amarti","en":"the and you your yours with when where what why how who will would should never always nothing something because want wanna gonna know knows knew just dont don't can't could there their they them we're we are was were have has had here more another some other few three four first second third words word lyrics lyric line lines one last verse song music today tomorrow forever tonight feeling feel heart mind mine baby girl boy please look think see need make take time again","es":"quiero quieres tengo tienes estoy estamos eres nadie nunca tampoco contigo conmigo mañana manana corazón corazon ahora donde dónde cuando cuándo porque pero aunque solo sólo ojos noche sueños suenos vida años anos olvidar olvidarte sabe sabes dime quiero volver volveré besame beso amar amor siempre","fr":"je suis avec dans pour parce pourquoi jamais toujours rien toi moi vous nous est etait étais être etre veux peux alors encore aujourd'hui demain amour coeur cœur nuit jours jour yeux sans belle beaux elle elles ils leur notre votre","pt":"não nao você voce vocês voces coração coracao estou tenho minha minhas meu meus teu teus sua suas tudo todos todas saudade demais fica ficar fico hoje ontem amanhã amanha ninguém ninguem comigo comigo saudades viver beijo beijos amor sempre","de":"ich nicht dich dir liebe mein meine meiner meiner und keine kein alles immer etwas nichts bist sind haben gehen wann bitte warum heute morgen nacht wieder deine deiner deine deinen unser unsere herz augen ohne jeder jeden zeit weiß weiss"});
const ASR_LANGUAGE_SETS=Object.fromEntries(Object.entries(ASR_LANGUAGE_MARKERS)
  .map(([code,words])=>[code,new Set(words.split(/\s+/u))]));
function languageFromLyrics(rows){
 if(!Array.isArray(rows))return "";
 const source=rows.slice(0,120).map(r=>String(r?.text||"")).join(" ").toLowerCase();
 const tokens=source.match(/\p{L}+/gu)||[];
 if(tokens.length<6)return "";
 const scores=[];
 for(const [code,markers] of Object.entries(ASR_LANGUAGE_SETS)){
  const counts=new Map();let score=0,hits=0;
  for(const token of tokens){
   if(!markers.has(token))continue;
   const count=counts.get(token)||0;
   if(count>=3)continue; // A repeated hook cannot decide the whole track.
   counts.set(token,count+1);score++;if(count===0)hits++;
  }
  scores.push({code,score,hits});
 }
 scores.sort((a,b)=>b.score-a.score);
 const [winner,second]=scores;
 if(winner.score<5||winner.hits<3||
    winner.score<second.score*1.5+2)return "";
 return winner.code;
}
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
   // A provider's LRC line may lead the recorded vocal by 1-2 seconds.
   // Accept only a complete, ordered EXACT match of >=4 spoken words
   // in that wider region; short/repeated hooks retain the strict gate.
   const lag=candidates[k].t-start;
   const maximumLate=tokens.length>=4?1.70:.85;
   if(candidates[k].key!==keys[0]||lag<-.45||lag>maximumLate)continue;
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
  // The aligned FIRST syllable determines when this line lights up.
  // Keeping the provider's earlier row.t made a visually premature
  // karaoke line even though every individual word was audio-aligned.
  const measuredStart=parts[0].t;
  const displayStart=Math.abs(measuredStart-start)<=1.70?
   measuredStart:start;
  results.push({t:+displayStart.toFixed(3),
   text:String(row.text).trim(),words:parts,
   alignedFromAudio:true});
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
function stopWorker(reason){
 const old=worker;worker=null;
 for(const req of pending.values()){
  clearTimeout(req.timer);
  req.reject(Error(reason||"Whisper unavailable"));
 }
 pending.clear();
 try{old?.terminate()}catch(_){}
}
function requestWorker(data,language){
 if(!worker){
  worker=new Worker("audio-lyrics-worker.js?v=6715&lang=1",{type:"module"});
  worker.onmessage=e=>{
   const id=Number(e.data?.id),req=pending.get(id);
   if(!req)return;
   clearTimeout(req.timer);pending.delete(id);
   if(e.data?.error)req.reject(Error(String(e.data.error)));
   else req.resolve(Array.isArray(e.data?.chunks)?e.data.chunks:[]);
  };
  worker.onerror=()=>stopWorker("Whisper could not load");
  worker.onmessageerror=()=>stopWorker("Invalid Whisper worker message");
 }
 const id=++sequence;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>stopWorker("Whisper timed out"),WORKER_TIMEOUT_MS);
  pending.set(id,{resolve,reject,timer});
  try{worker.postMessage({id,pcm:data,language},[data.buffer])}
  catch(e){stopWorker("Whisper worker message failed")}
 });
}
function setStatus(value){
 const el=$("lyricsAudioStatus");
 if(el)el.textContent=value;
}
function preferredWindows(lines,duration){
 const blocks=new Set();
 for(const row of Array.isArray(lines)?lines:[]){
  const t=Number(row?.t);
  if(row?.words?.length>=2||!Number.isFinite(t)||t<0)continue;
  const base=Math.floor(Math.max(0,t-.8)/STEP)*STEP;
  // A phrase near the end of a 28-second clip may be cut off even
  // when its first word is inside it. Add a window with five seconds
  // of lead-in so Whisper can hear the complete phrase.
  if(t-base>WINDOW-10){
   const overlap=Math.max(0,Math.floor(t-5));
   if(overlap<duration-3)blocks.add(overlap);
  }
  if(base<duration-3)blocks.add(base);
 }
 // The nearest relevant clip gets the mobile one-window budget first.
 const now=Number(window.MusicBoxBridge?.audio?.()?.currentTime)||0;
 return [...blocks].sort((a,b)=>Math.abs(a-now)-Math.abs(b-now));
}
async function analyze(id){
 if(!canRun())return false;
 const bridge=window.MusicBoxBridge;
 const profile=String(bridge?.profile?.()||"");
 const sessionId=profile+"|"+id;
 if(!bridge||bridge.currentId?.()!==id||completedInSession.has(sessionId))return false;
 const rows=(bridge.lyricsData?.()?.synced||[]).map(row=>
  row?.estimated?{t:row.t,text:row.text}:row);
 if(rows.length<3||rows.every(row=>row.words?.length>=2))return false;
 const language=languageFromLyrics(rows);
 if(!language){
  completedInSession.add(sessionId);
  setStatus("Lingua del testo incerta: mantengo i tempi originali");
  return false;
 }
 const last=Number(sessionStorage.getItem("mb.audioWords.fail."+id)||0);
 if(last&&Date.now()-last<RETRY_MS)return false;
 const track=bridge.allTracks?.().find(t=>t.id===id);
 const src=track&&bridge.mixUrl?.(track);
 if(typeof src!=="string"||!src)return false;
  const absolute=new URL(src,document.baseURI);
  if(!/^(https?:|blob:)$/i.test(absolute.protocol))return false;
 const isPhone=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||"")||
   (/Macintosh/i.test(navigator.userAgent||"")&&Number(navigator.maxTouchPoints)>1);
 const limit=isPhone?MAX_MOBILE_BYTES:MAX_AUDIO_BYTES;
 // An already-visited song/section must not trigger repeated network,
 // decoding and model downloads as Immersive refreshes every few seconds.
 const clockDuration=Number(bridge.audio?.()?.duration)||0;
 const keyFor=at=>"mb.audioWords.attempt."+VERSION+"."+profile+"."+id+"."+at;
 const selected=at=>Date.now()-Number(sessionStorage.getItem(keyFor(at))||0)>=6*3600000;
 const sessionCap=isPhone?MOBILE_SESSION_WINDOW_CAP:DESKTOP_SESSION_WINDOW_CAP;
 if((sessionWindows.get(sessionId)||0)>=sessionCap){
  completedInSession.add(sessionId);return false;
 }
 if(clockDuration>3&&!preferredWindows(rows,clockDuration).some(selected)){
  completedInSession.add(sessionId);return false;
 }
 setStatus("Analisi voce locale: preparo il brano…");
 let ctx;
 try{
  const response=await fetch(absolute.href,{cache:"force-cache"});
  if(!response.ok)throw Error("Music download unavailable");
  const declared=Number(response.headers.get("content-length"));
  if(declared>limit)throw Error("Track too large for safe analysis");
  const blob=await response.blob();
  if(blob.size>limit)throw Error("Track too large");
  const bytes=await blob.arrayBuffer();
  // Offline context does not claim the active iPhone audio session.
  // Never start a second live AudioContext while Music Box is playing.
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)throw Error("Offline audio decoder unavailable");
  ctx=new Offline(1,FS,FS);
  const decoded=await ctx.decodeAudioData(bytes);
  const duration=Math.min(Number(decoded.duration)||0,3600);
  if(!Number.isFinite(duration)||duration<4||
     duration>(isPhone?300:600))throw Error("Track too long for safe analysis");
  const windows=preferredWindows(rows,duration);
  if(!windows.length)return false;
  // Mobile: only one short window per visit; no full-song inference in
  // the foreground, which could kill the PWA or interrupt Smart Mix.
  const budget=isPhone?1:3;
  let saved=0,scanned=0;
  for(const at of windows){
   if(scanned>=budget||active.has(sessionId)===false||document.hidden||
     bridge.currentId?.()!==id||String(bridge.profile?.()||"")!==profile)break;
   const key=keyFor(at);
   if(!selected(at))continue;
   scanned++;
   const sample=pcmSlice(decoded,at,WINDOW);
   setStatus("Analizzo la voce: "+Math.round(at)+"–"+
     Math.round(Math.min(duration,at+WINDOW))+" s…");
   const chunks=await requestWorker(sample,language);
   if(active.has(sessionId)===false||bridge.currentId?.()!==id||String(bridge.profile?.()||"")!==profile)break;
   const aligned=alignWindow(rows,chunks,at,Math.min(WINDOW,duration-at));
   sessionStorage.setItem(key,String(Date.now()));
   if(!aligned.length)continue;
   const stored=await bridge.saveAudioWordRows?.(id,aligned);
   saved+=Number(stored)||0;
   if(saved>0)setStatus("IA locale: "+saved+" frasi con parole allineate");
  }
  if(scanned){
   const total=(sessionWindows.get(sessionId)||0)+scanned;
   sessionWindows.set(sessionId,total);
   // Keep the six-hour per-window cooldown. New requests can inspect only
   // a DIFFERENT passage, bounded per session and never during this pass.
   if(total>=sessionCap||!preferredWindows(rows,duration).some(selected))
    completedInSession.add(sessionId);
  }
  if(!saved&&scanned)setStatus("Voce troppo ambigua: mantengo i tempi originali");
  return saved>0;
 }catch(e){
  sessionStorage.setItem("mb.audioWords.fail."+id,String(Date.now()));
  setStatus("Analisi audio non disponibile: karaoke originale conservato");
  return false;
 }finally{
  try{await ctx?.close?.()}catch(_){}
  if(isPhone&&worker&&!pending.size)stopWorker("Mobile analysis complete");
 }
}
function request(id){
 id=String(id||window.MusicBoxBridge?.currentId?.()||"");
 const sessionId=String(window.MusicBoxBridge?.profile?.()||"")+"|"+id;
 if(!id||active.size||completedInSession.has(sessionId)||!canRun())return false;
 const now=Date.now(),last=attempts.get(sessionId)||0;
 if(now-last<15000)return false;
 attempts.set(sessionId,now);
 active.add(sessionId);
 // Do not hold up UI events or voice playback. Use idle time if available.
 const start=()=>{
  if(!active.has(sessionId))return;
  analyze(id).finally(()=>active.delete(sessionId));
 };
 if(typeof requestIdleCallback==="function")
  requestIdleCallback(start,{timeout:2500});
 else setTimeout(start,1600);
 return true;
}
root.MusicBoxAudioAlign={request,alignWindow,recognizedWords,pcmSlice,preferredWindows,languageFromLyrics};
})(typeof window!=="undefined"?window:globalThis);
