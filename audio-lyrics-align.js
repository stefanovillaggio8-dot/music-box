/* Music Box · optional on-device Whisper word alignment.
   Audio stays in the browser; model weights are fetched only once by the
   on-demand worker. Never invent word times, never replace trusted LRCLIB. */
(function(root){
"use strict";
const $=id=>typeof document==="undefined"?null:document.getElementById(id);
const VERSION=7,MAX_AUDIO_BYTES=18*1024*1024,WINDOW=28,STEP=24,FS=16000;
const MAX_MOBILE_BYTES=8*1024*1024,WORKER_TIMEOUT_MS=90000;
const RETRY_MS=24*3600000;
const active=new Set(),completedInSession=new Set();
const attempts=new Map(),sessionWindows=new Map();
const uncertainLanguageLyrics=new Map();
// A provider can later replace an ambiguous LRC with one whose language
// can be recognized. Skip repeated identical lyrics, not every future edit.
const lyricSignature=rows=>(Array.isArray(rows)?rows:[]).slice(0,120)
 .map(row=>String(row?.text||"")).join("\u241e");
// Keep each foreground WebGPU pass short; permit later, separate lyric clips.
const MOBILE_SESSION_WINDOW_CAP=3,DESKTOP_SESSION_WINDOW_CAP=26;

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
  const ts=part?.timestamp;
  // Whisper sometimes emits [null, null] for an unaligned word.
  // Number(null) is zero, which used to invent a word at song start.
  if(!Array.isArray(ts)||ts.length!==2||
     ts.some(value=>typeof value!=="number"&&typeof value!=="string"||
       typeof value==="string"&&!value.trim()))continue;
  const t=Number(ts[0]),end=Number(ts[1]);
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
function hasWordTiming(row){
 if(row?.estimated===true)return false;
 return root.MusicBoxWordKaraoke?.hasWordTiming?.(row)??
  (row?.words?.length>=2||row?.words?.length===1&&
   Number.isFinite(row.words[0].end)&&row.words[0].end>row.words[0].t);
}
function alignWindow(lines,transcribed,offset=0,duration=WINDOW){
 if(!Array.isArray(lines)||!Array.isArray(transcribed))return [];
 const words=recognizedWords(transcribed,offset).map((word,index)=>({...word,index}));
 if(!words.length)return [];
 const results=[],end=offset+duration;
 let lastUsedWord=-1;
 const time=value=>(typeof value==="number"||typeof value==="string"&&value.trim())&&
  Number.isFinite(Number(value))&&Number(value)>=0?Number(value):NaN;
 for(let j=0;j<lines.length;j++){
  const row=lines[j],start=time(row?.t),next=time(lines[j+1]?.t);
  if(row?.t==null||!Number.isFinite(start)||
     start<offset+.15&&!(offset===0&&start===0)||start>end-1.1||
     hasWordTiming(row))continue;
  const limit=Math.min(end-.04,Number.isFinite(next)?next-.05:start+10,start+11);
  // Fast rap can contain a complete, exactly recognized line in <450ms.
  // Actual word observations, not a guessed minimum phrase duration,
  // decide whether it can be aligned.
  if(limit-start<.08)continue;
  const tokens=wordTokens(row.text),keys=tokens.map(normalized);
  const shortPhrase=tokens.length<=2;
  if(tokens.length<1||tokens.length>22||keys.some(k=>!k)||
     tokens.length>1&&new Set(keys).size<2||String(row.text||"").length>220)continue;
  const candidates=words.filter(w=>w.index>lastUsedWord&&w.t>=start-.45&&w.t<=limit+.1);
  if(candidates.length<tokens.length||candidates.length>34)continue;
  let best=null;
  for(let k=0;k<candidates.length;k++){
   // A provider's LRC line may lead the recorded vocal by 1-2 seconds.
   // Accept only a complete, ordered EXACT match of >=4 spoken words
   // in that wider region; short/repeated hooks retain the strict gate.
   const lag=candidates[k].t-start;
   // Whisper sometimes splits one Italian contraction (l'amore or c'è)
   // into two measured ASR tokens. Merge only adjacent timestamps when
   // their full normalized spelling matches the actual written word.
   const measuredWordAt=(at,key)=>{
    const first=candidates[at],second=candidates[at+1];
    if(first?.key===key)return {word:first,advance:1};
    if(keys.length>=4&&first&&second&&first.key+second.key===key&&
       second.t>=first.end-.04&&second.t-first.end<=.20&&
       second.end-first.t<=2)
     return {word:{key,t:first.t,end:second.end,index:second.index},advance:2};
    return null;
   };
   // Long distinctive phrases may start after an early LRC cue;
   // short or repeated hooks retain the tight 850ms / 1700ms gate.
   const extended=keys.length>=7&&new Set(keys).size>=5;
   const maximumLate=shortPhrase?.30:extended?2.70:tokens.length>=4?1.70:.85;
   const firstMatch=measuredWordAt(k,keys[0]);
   if(!firstMatch||lag<(shortPhrase?-.20:-.45)||lag>maximumLate)continue;
   const found=[firstMatch.word];let cursor=k+firstMatch.advance;
   let unrelatedAsrWords=0;
   for(let w=1;w<tokens.length;w++){
    // Reject an apparent match that jumps across many unrelated ASR words.
    // Allow at most TWO skipped words in the whole line, not two per word.
    let hit=null;
    for(let n=cursor;n<Math.min(candidates.length,cursor+3);n++){
     const matched=measuredWordAt(n,keys[w]);
     if(matched&&unrelatedAsrWords+n-cursor<=(shortPhrase?0:2)){
      unrelatedAsrWords+=n-cursor;
      hit={word:matched.word,next:n+matched.advance};break;
     }
    }
    if(!hit)break;
    found.push(hit.word);cursor=hit.next;
   }
   if(found.length!==tokens.length||shortPhrase&&found.some(w=>w.end-w.t<.04)||
      found.some((w,i)=>i>0&&w.t<found[i-1].t))
    continue;
   if(found[found.length-1].t>=limit+.16||
      found[found.length-1].end>limit+.7)continue;
   const cost=Math.abs(found[0].t-start)+
     .12*Math.max(0,found[found.length-1].end-limit);
   if(!best||cost<best.cost)best={found,cost};
  }
  if(!best)continue;
  // Adjacent/repeated LRC rows must never reuse the same recognized
  // syllables. That produced apparently measured duplicate word times.
  lastUsedWord=best.found[best.found.length-1].index;
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
  const maxMeasuredOffset=keys.length>=7&&new Set(keys).size>=5?2.70:1.70;
  const displayStart=measuredStart>=start-.45&&
   measuredStart<=start+maxMeasuredOffset?measuredStart:start;
  results.push({t:+displayStart.toFixed(3),sourceT:+start.toFixed(3),
   text:String(row.text).trim(),words:parts,end:parts[parts.length-1].end,
   alignedFromAudio:true});
 }
 return results;
}
// Separate partial evidence: exact distinctive sequences, never guessed
// timestamps for missing tokens or a "verified" label for an entire line.
function alignAcousticSpans(lines,transcribed,offset=0,duration=WINDOW){
 if(!Array.isArray(lines)||!Array.isArray(transcribed))return [];
 const words=recognizedWords(transcribed,offset).map((w,index)=>({...w,index}));
 const reserved=new Set();
 for(const row of lines)if(hasWordTiming(row)){
  const lo=row.words[0].t-.02,hi=row.words[row.words.length-1].end+.02;
  for(const w of words)if(w.t>=lo&&w.end<=hi)reserved.add(w.index);
 }
 const results=[];let lastUsed=-1;
 for(let rowIndex=0;rowIndex<lines.length;rowIndex++){
  const row=lines[rowIndex],start=Number(row?.sourceT??row?.t),next=Number(lines[rowIndex+1]?.sourceT??lines[rowIndex+1]?.t);
  if(!Number.isFinite(start)||row?.t==null||hasWordTiming(row)||start<offset+.15&&!(offset===0&&start===0))continue;
  const tokens=wordTokens(row.text),keys=tokens.map(normalized);
  if(keys.length<4||keys.length>80||keys.some(k=>!k))continue;
  const limit=Math.min(offset+duration-.04,Number.isFinite(next)&&next>start?next-.05:start+27);
  const pool=words.filter(w=>!reserved.has(w.index)&&w.index>lastUsed&&w.t>=start-.45&&w.end<=limit+.4),runs=[];
  for(let i=0;i<keys.length;i++)for(let j=0;j<pool.length;j++){
   if(keys[i]!==pool[j].key)continue;let n=0;
   while(i+n<keys.length&&j+n<pool.length&&keys[i+n]===pool[j+n].key&&
    pool[j+n].end-pool[j+n].t>=.035&&pool[j+n].end-pool[j+n].t<=.8&&
    (!n||pool[j+n].index===pool[j+n-1].index+1&&pool[j+n].t>=pool[j+n-1].end-.04&&pool[j+n].t-pool[j+n-1].end<=.25))n++;
   const distinctive=new Set(keys.slice(i,i+n)).size,anchored=i===0&&pool[j].t-start<=.85;
   if(n<(anchored?4:6)||distinctive<(anchored?3:5))continue;
   const same=(list,at)=>keys.slice(i,i+n).every((key,k)=>list[at+k]===key);
   const recognized=pool.map(w=>w.key);
   if(keys.reduce((s,_,at)=>s+Number(same(keys,at)),0)!==1||recognized.reduce((s,_,at)=>s+Number(same(recognized,at)),0)!==1)continue;
   runs.push({i,j,n});
  }
  runs.sort((a,b)=>b.n-a.n||a.i-b.i||a.j-b.j);
  const chosen=[],usedLyrics=new Set(),usedAsr=new Set();
  for(const run of runs){
   if(Array.from({length:run.n},(_,k)=>run.i+k).some(i=>usedLyrics.has(i))||
      Array.from({length:run.n},(_,k)=>pool[run.j+k].index).some(i=>usedAsr.has(i))||
      chosen.some(c=>(c.i<run.i)!==(c.j<run.j)))continue;
   chosen.push(run);for(let k=0;k<run.n;k++){usedLyrics.add(run.i+k);usedAsr.add(pool[run.j+k].index)}
  }
  const spans=chosen.flatMap(r=>Array.from({length:r.n},(_,k)=>({wordIndex:r.i+k,text:tokens[r.i+k],
   t:pool[r.j+k].t,end:pool[r.j+k].end,asrIndex:pool[r.j+k].index}))).sort((a,b)=>a.wordIndex-b.wordIndex);
  if(spans.length<4||spans.some((w,i)=>i&&w.t<spans[i-1].t))continue;
  lastUsed=Math.max(lastUsed,...spans.map(s=>s.asrIndex));
  results.push({t:start,sourceT:start,text:String(row.text).trim(),partialAudio:true,
   acousticSpans:spans.map(({asrIndex,...word})=>word)});
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
 // In some masters a vocal stem is nearly opposite-phase between L/R.
 // Blindly averaging stereo then silences that voice before Whisper hears
 // it. Inspect this *window's* PCM (not metadata) and keep the stronger
 // original channel ONLY when the normal mono sum severely cancels.
 let fallbackChannel=null;
 if(r){
  let ll=0,rr=0,lr=0;
  const stride=Math.max(1,Math.floor(available/8192));
  for(let j=start;j<start+available;j+=stride){
   const left=l[j],right=r[j];
   ll+=left*left;rr+=right*right;lr+=left*right;
  }
  const opposition=lr/Math.sqrt(ll*rr||1);
  const remaining=(ll+rr+2*lr)/(ll+rr||1);
  if(opposition<-.90&&remaining<.22)
   fallbackChannel=ll>=rr?l:r;
 }
 const step=sr/FS;
 for(let i=0;i<length;i++){
  const begin=start+Math.floor(i*step);
  const last=Math.min(count,start+Math.floor((i+1)*step));
  let sum=0;
  for(let j=begin;j<Math.max(begin+1,last);j++)
   sum+=fallbackChannel?fallbackChannel[j]:r?(l[j]+r[j])*.5:l[j];
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
let alignmentEpoch=0,downloadController=null,continuationTimer=null;
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
  worker=new Worker("audio-lyrics-worker.js?v=6715&lang=2",{type:"module"});
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
function karaokeViewOpen(){
 return $("lyricsPanel")?.hidden===false||$("immersivePanel")?.hidden===false;
}
function preferredWindows(lines,duration){
 const blocks=new Set();
 for(const row of Array.isArray(lines)?lines:[]){
  const t=Number(row?.t);
  if(hasWordTiming(row)||!Number.isFinite(t)||t<0)continue;
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
 // On mobile only ONE clip is analyzed per request. The absolutely nearest
 // clip may begin just BEFORE a lyric cue (the matcher needs 150ms lead-in)
 // or leave too little room to hear its final syllables. Prefer a nearby
 // clip that contains a complete, not-yet-timed phrase instead.
 const now=Number(window.MusicBoxBridge?.audio?.()?.currentTime)||0;
 const coverage=new Map();
 for(const at of blocks){
  let eligible=0;
  for(const row of Array.isArray(lines)?lines:[]){
   const t=Number(row?.t);
   if(hasWordTiming(row)||!Number.isFinite(t)||
      t<at+.15&&!(at===0&&t===0)||t>Math.min(duration-1.1,at+WINDOW-4.5)||
      (String(row?.text||"").match(/\S+/gu)||[]).length<1)continue;
   eligible++;
  }
  coverage.set(at,eligible);
 }
 // Preserve proximity: a faraway verse must not jump ahead of the
 // current passage just because it contains more lines.
 return [...blocks].sort((a,b)=>{
  const da=Math.abs(a-now),db=Math.abs(b-now);
  return Math.floor(da/12)-Math.floor(db/12)||
   coverage.get(b)-coverage.get(a)||da-db;
 });
}
async function analyze(id,epoch=alignmentEpoch){
 if(!canRun())return false;
 const bridge=window.MusicBoxBridge;
 if(epoch!==alignmentEpoch)return false;
 const profile=String(bridge?.profile?.()||"");
 const sessionId=profile+"|"+id;
 if(!bridge||bridge.currentId?.()!==id||completedInSession.has(sessionId))return false;
 const rows=(bridge.lyricsData?.()?.synced||[]).map(row=>
  row?.estimated?{t:row.t,text:row.text}:row);
 if(rows.length<3||rows.every(hasWordTiming))return false;
 const language=languageFromLyrics(rows);
 if(!language){
  uncertainLanguageLyrics.set(sessionId,lyricSignature(rows));
  setStatus("Lingua del testo incerta: mantengo i tempi originali");
  return false;
 }
 uncertainLanguageLyrics.delete(sessionId);
 const failureKey="mb.audioWords.fail."+profile+"."+id;
 const last=Number(sessionStorage.getItem(failureKey)||0);
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
 const sessionCap=isPhone?(karaokeViewOpen()?
  Math.min(16,Math.max(MOBILE_SESSION_WINDOW_CAP,Math.ceil(clockDuration/STEP)+2)):
  MOBILE_SESSION_WINDOW_CAP):DESKTOP_SESSION_WINDOW_CAP;
 if((sessionWindows.get(sessionId)||0)>=sessionCap){
  completedInSession.add(sessionId);return false;
 }
 if(clockDuration>3&&!preferredWindows(rows,clockDuration).some(selected)){
  completedInSession.add(sessionId);return false;
 }
 setStatus("Analisi voce locale: preparo il brano…");
 let ctx;
 const controller=new AbortController();downloadController=controller;
 try{
  const response=await fetch(absolute.href,{cache:"force-cache",signal:controller.signal});
  if(epoch!==alignmentEpoch)return false;
  if(!response.ok)throw Error("Music download unavailable");
  const declared=Number(response.headers.get("content-length"));
  if(declared>limit)throw Error("Track too large for safe analysis");
  const blob=await response.blob();
  if(blob.size>limit)throw Error("Track too large");
  const bytes=await blob.arrayBuffer();
  if(epoch!==alignmentEpoch)return false;
  // Offline context does not claim the active iPhone audio session.
  // Never start a second live AudioContext while Music Box is playing.
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)throw Error("Offline audio decoder unavailable");
  ctx=new Offline(1,FS,FS);
  const decoded=await ctx.decodeAudioData(bytes);
  if(epoch!==alignmentEpoch)return false;
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
   if(epoch!==alignmentEpoch||scanned>=budget||active.has(sessionId)===false||document.hidden||
     bridge.currentId?.()!==id||String(bridge.profile?.()||"")!==profile)break;
   const key=keyFor(at);
   if(!selected(at))continue;
   scanned++;
   const sample=pcmSlice(decoded,at,WINDOW);
   setStatus("Analizzo la voce: "+Math.round(at)+"–"+
     Math.round(Math.min(duration,at+WINDOW))+" s…");
   const chunks=await requestWorker(sample,language);
   if(epoch!==alignmentEpoch||active.has(sessionId)===false||bridge.currentId?.()!==id||String(bridge.profile?.()||"")!==profile)break;
   const aligned=alignWindow(rows,chunks,at,Math.min(WINDOW,duration-at));
   const sourceAt=row=>row.sourceT??row.t;
   const partial=alignAcousticSpans(rows.map(row=>aligned.find(r=>Math.abs(sourceAt(r)-sourceAt(row))<.002)||row),chunks,at,Math.min(WINDOW,duration-at));
   aligned.push(...partial);
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
  if(epoch!==alignmentEpoch||controller.signal.aborted)return false;
  sessionStorage.setItem(failureKey,String(Date.now()));
  setStatus("Analisi audio non disponibile: karaoke originale conservato");
  return false;
 }finally{
  try{await ctx?.close?.()}catch(_){}
  if(downloadController===controller)downloadController=null;
  if(epoch===alignmentEpoch&&isPhone&&worker&&!pending.size)stopWorker("Mobile analysis complete");
 }
}
function cancel(){
 alignmentEpoch++;
 if(continuationTimer){clearTimeout(continuationTimer);continuationTimer=null;}
 for(const key of active)attempts.delete(key);
 active.clear();
 try{downloadController?.abort()}catch(_){}
 downloadController=null;
 stopWorker("Alignment superseded");
}
function request(id){
 id=String(id||window.MusicBoxBridge?.currentId?.()||"");
 const sessionId=String(window.MusicBoxBridge?.profile?.()||"")+"|"+id;
 if(active.size&&!active.has(sessionId))cancel();
 if(!id||active.size||completedInSession.has(sessionId)||!canRun())return false;
 const signature=lyricSignature(window.MusicBoxBridge?.lyricsData?.()?.synced);
 if(uncertainLanguageLyrics.has(sessionId)&&
    uncertainLanguageLyrics.get(sessionId)===signature)return false;
 const now=Date.now(),last=attempts.get(sessionId)||0;
 if(now-last<15000)return false;
 attempts.set(sessionId,now);
 active.add(sessionId);
 const epoch=alignmentEpoch,beforeWindows=sessionWindows.get(sessionId)||0;
 // Do not hold up UI events or voice playback. Use idle time if available.
 const start=()=>{
  if(epoch!==alignmentEpoch||!active.has(sessionId))return;
  analyze(id,epoch).finally(()=>{
   if(epoch!==alignmentEpoch)return;
   active.delete(sessionId);
   if((sessionWindows.get(sessionId)||0)>beforeWindows&&
      !completedInSession.has(sessionId)&&canRun()&&karaokeViewOpen()&&
      String(window.MusicBoxBridge?.profile?.()||"")+"|"+
       window.MusicBoxBridge?.currentId?.()===sessionId){
    if(continuationTimer)clearTimeout(continuationTimer);
    continuationTimer=setTimeout(()=>{
     continuationTimer=null;
     if(epoch===alignmentEpoch&&karaokeViewOpen())request(id);
    },20000);
   }
  });
 };
 if(typeof requestIdleCallback==="function")
  requestIdleCallback(start,{timeout:2500});
 else setTimeout(start,1600);
 return true;
}
root.MusicBoxAudioAlign={request,cancel,alignWindow,alignAcousticSpans,recognizedWords,pcmSlice,preferredWindows,languageFromLyrics};
})(typeof window!=="undefined"?window:globalThis);
