/* Music Box - DJ Mix adattivo. Analisi locale, nessun invio dei file audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
let enabled=true;
try{enabled=localStorage.getItem("mb.djmix")!=="off"}catch(e){/* Storage bloccato */}
const cache=new Map(),pending=new Map(),mixFailures=new Map(),unavailableAnalysis=new Map();
// Persist only lightweight analysis measurements (never MP3 data). Keep the
// storage separate from Music Box audio caches and tolerate private browsing.
const ANALYSIS_VERSION=8;
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
let style="auto",mixSeconds=6;
try{
 const stored=localStorage.getItem("mb.mixStyle");
 if(allowedStyles.has(stored))style=stored;
 const secs=Number(localStorage.getItem("mb.mixSeconds"));
 if(Number.isFinite(secs)&&secs>=3&&secs<=12)mixSeconds=secs;
}catch(e){}
const KEY_NAMES=["Do","Do♯","Re","Mi♭","Mi","Fa","Fa♯","Sol","La♭","La","Si♭","Si"];
let active=null,previousId="",plan=null,plannedFor="",mixing=false,boundAudio=null;
function bridge(){return window.MusicBoxBridge}
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
function analyzeFrames(buf){
 const ch=buf.getChannelData(0),rate=buf.sampleRate,step=.025;
 const hop=Math.max(1,Math.round(rate*step)),energy=[];
 // Analisi del segnale reale: non ci fidiamo della durata dell'MP3, che
 // può contenere molti secondi di silenzio iniziale e finale.
 for(let pos=0;pos<ch.length;pos+=hop){
  let sum=0,n=0;const end=Math.min(ch.length,pos+hop);
  for(let i=pos;i<end;i+=4){sum+=ch[i]*ch[i];n++}
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
 const hasAudio=typical>.0012;
 const activeRms=blocks.filter(x=>x>gate).sort((x,y)=>x-y);
 const level=activeRms.length?
  activeRms[Math.floor(activeRms.length*.65)]:0;
 const beatConfidence=clamp(best.score,0,1);
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
 const silentTail=blocks.slice(Math.ceil(audibleEnd/(group*step)));
 const verifiedSilence=hasAudio&&trailing>=1.65&&silentTail.length>=7&&
  silentTail.every(v=>v<=Math.max(.0009,typical*.025));
 return {bpm:best.bpm,beatConfidence,introBeat,tailEnergy,introWave,outroWave,level,quietTail,
  outroReason:assessed.reason,safeOutroAt,safeIntroAt,
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
function chroma(buf,from=0,to=buf.duration){
 const data=buf.getChannelData(0),rate=buf.sampleRate,N=4096,hist=new Float64Array(12);
 if(data.length<N)return [...hist];
 const duration=buf.duration;
 const rangeStart=clamp(Number(from)||0,0,Math.max(0,duration-N/rate));
 const rangeEnd=clamp(Number(to)||duration,rangeStart+N/rate,duration);
 // Fewer windows on iPhone: enough for harmonic ranking, less CPU/RAM.
 const windows=isIOS?12:24;
 for(let w=0;w<windows;w++){
  const second=clamp(rangeStart+(w+.5)/windows*(rangeEnd-rangeStart),
   rangeStart,Math.max(rangeStart,rangeEnd-N/rate));
  const start=Math.floor(second*rate),re=new Float32Array(N),im=new Float32Array(N);
  for(let i=0;i<N;i++)re[i]=data[start+i]*(.5-.5*Math.cos(2*Math.PI*i/(N-1)));
  fft(re,im);
  for(let bin=Math.ceil(80*N/rate);bin<Math.min(N/2,Math.floor(1600*N/rate));bin++){
   const freq=bin*rate/N, midi=69+12*Math.log2(freq/440);
   const pitch=((Math.round(midi)%12)+12)%12;
   const mag=Math.hypot(re[bin],im[bin]);
   hist[pitch]+=Math.sqrt(mag);
  }
 }
 const total=hist.reduce((a,b)=>a+b,0)||1;
 return [...hist].map(v=>v/total);
}
function compatibility(a,b){
 if(!a?.chroma||!b?.chroma)return 0;
 let dot=0,aa=0,bb=0;
 for(let i=0;i<12;i++){dot+=a.chroma[i]*b.chroma[i];aa+=a.chroma[i]**2;bb+=b.chroma[i]**2}
 return dot/Math.sqrt((aa||1)*(bb||1));
}
async function decode(track){
 if(!enabled||!track)return null;
 const source=bridge()?.mixUrl?.(track)||track.url;
 if(!source||/^(javascript:|data:)/i.test(source))return null;
 const key=String(source);
 if(Date.now()<(unavailableAnalysis.get(key)||0))return null;
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const saved=await savedAnalysis(key);
 if(saved){cache.set(key,saved);return saved}
 // A second caller may have begun the same analysis while IndexedDB loaded.
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 // Offline/saved analyses still work in data-saving mode. Only network
 // downloads are suppressed.
 const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 if(connection?.saveData||/^(slow-)?2g$|^3g$/i.test(String(connection?.effectiveType||"")))
   return null;
 const operation=async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),isIOS?35000:22000);
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
    if(decoded.duration<35)return null;
    const frame=analyzeFrames(decoded);
    const harmonies=chroma(decoded);
    const expected=Number(track.spotifyDurationMs||0)/1000||
     Number(track.expectedDurationSec||0);
    const durationMismatch=expected>20&&
     Math.abs(decoded.duration-expected)>Math.max(7,expected*.07);
    const outroFrom=Math.max(0,frame.safeOutroAt??frame.last-10);
    const introTo=Math.min(decoded.duration,Math.max(9,frame.first+12));
    const result={...frame,chroma:harmonies,
     introChroma:chroma(decoded,0,introTo),
     outroChroma:chroma(decoded,outroFrom,Math.min(decoded.duration,frame.last)),
     duration:decoded.duration,durationMismatch};
    cache.set(key,result);
    saveAnalysis(key,result).catch(()=>{});
    if(cache.size>8)cache.delete(cache.keys().next().value);
    return result;
   }finally{if(typeof ctx.close==="function")await ctx.close().catch(()=>{})}
  }catch(e){return null}
  finally{clearTimeout(timeout)}
 };
 const job=isIOS?(mobileDecodeQueue=mobileDecodeQueue.catch(()=>{}).then(operation)):operation();
 pending.set(key,job);
 try{
  const data=await job;
  if(!data){
   unavailableAnalysis.set(key,Date.now()+300000);
   if(unavailableAnalysis.size>64)
    unavailableAnalysis.delete(unavailableAnalysis.keys().next().value);
  }else unavailableAnalysis.delete(key);
  return data;
 }finally{pending.delete(key)}
}

function hasReliableHarmony(ch){
 if(!Array.isArray(ch)||ch.length!==12)return false;
 const v=ch.slice().sort((a,b)=>b-a);
 return v[0]>=.117&&v.slice(0,4).reduce((a,b)=>a+b,0)>=.435;
}
function transition(a,b,actualDuration){
 const dur=Number(actualDuration);
 if(!Number.isFinite(dur)||dur<26||!a||!b||
    a.durationMismatch||b.durationMismatch||!Number.isFinite(a.duration)||
    Math.abs(a.duration-dur)>1.5)return null;
 const trim=Boolean(a.confidentTail&&a.last<dur-1.65);
 const musicalEnd=trim?Math.min(dur,a.last):dur;
 // Never jump ahead into a quiet, real introduction.
 const entry=Number.isFinite(b.safeIntroAt)?clamp(b.safeIntroAt,0,18):0;
 const end=clamp(musicalEnd+(trim?.07:-.04),13,dur-.025);
 let safe=Number.isFinite(a.safeOutroAt)?clamp(a.safeOutroAt,0,end):null;
 // A last lyric in the final 11 seconds protects the full final phrase.
 if(safe!==null&&Number.isFinite(a.lastLyricAt)){
  if(end-a.lastLyricAt<11)safe=end;
  else safe=Math.min(end,Math.max(safe,a.lastLyricAt+6));
 }
 const available=safe===null?0:end-safe;
 const common={entry,tempo:1,gain:1,score:null,silenceTrim:trim,
   trailing:trim?Math.max(0,dur-musicalEnd):0,safeOutroAt:safe};
 // Leave the actual song intact if we cannot prove there is a safe outro.
 // Verified silence can be skipped only AFTER the last audible part.
 if(available<1.75){
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
 const compatible=beatClose&&harmonic!==null&&harmonic>=.75;
 const earlyNextVoice=Number.isFinite(b.firstLyricAt)&&b.firstLyricAt<8;
 const longMix=compatible&&available>=4.4&&!earlyNextVoice;
 // Incompatible tracks: at most a discreet fade in a confirmed quiet tail.
 const kind=style==="auto"?(longMix?"beat":"soft"):style;
 const requested=kind==="beat"?
  clamp(4*4*60/bpm,4.5,8):style==="auto"?1.8:mixSeconds;
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
  score:harmonic===null?null:Math.round(harmonic*100)};
}
function keyGuess(ch){
 if(!Array.isArray(ch)||ch.length!==12)return null;
 // Correlazione con i profili maggiori/minori: è solo una stima,
 // non una tonalità certificata come quella disponibile a Spotify.
 const major=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
 const minor=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
 let top={score:-Infinity};
 for(let k=0;k<12;k++)for(const [label,profile] of [["maggiore",major],["minore",minor]]){
  let score=0;
  for(let j=0;j<12;j++)score+=ch[(j+k)%12]*profile[j];
  if(score>top.score)top={score,name:KEY_NAMES[k]+" "+label};
 }
 return top.name;
}
// A single HTMLAudioElement remains the output on iOS, including lock screen.
let mobileFadeTrack="",mobileFading=false;
function resetMobileFade(){
 if(mobileFading){
  const app=bridge(),audio=app?.audio();
  if(audio && app?.currentId()===mobileFadeTrack)
   try{audio.volume=app.volume?.()??1}catch(e){}
 }
 mobileFadeTrack="";mobileFading=false;
}
let prepared=null;
function dropPrepared(){
 if(!prepared)return;
 const p=prepared;prepared=null;
 try{p.audio.pause();p.audio.removeAttribute("src");p.audio.load()}catch(e){}
}
function cancel(){
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
 if(prepared?.id===song.id&&prepared.fromId===fromId&&prepared.url===url)return;
 dropPrepared();
 const upcoming=new Audio();upcoming.preload="auto";upcoming.volume=0;
 const p={id:song.id,fromId,url,audio:upcoming,ready:false,failed:false};
 prepared=p;
 upcoming.addEventListener("canplay",()=>{if(prepared===p)p.ready=true},{once:true});
 upcoming.addEventListener("error",()=>{if(prepared===p)p.failed=true},{once:true});
 upcoming.src=url;
 try{upcoming.load()}catch(e){p.failed=true}
 if(upcoming.readyState>=2)p.ready=true;
}
async function handoff(){
 const act=active;if(!act||act.handingOff)return;
 const app=bridge();
 if(!app||window.MusicBoxRoom?.isActive()||app.audio()!==act.original||
    app.currentId()!==act.fromId||app.mixNext()?.id!==act.track.id){cancel();return}
 const old=act.original,preview=act.upcoming,volume=app.volume();
 act.handingOff=true;
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
async function beginMix(song,proposed){
 const app=bridge(),old=app?.audio(),id=app?.currentId();
 if(!old||old.paused||mixing||!proposed||app.mixNext()?.id!==song.id||isIOS)return;
 const p=prepared;
 if(!p||p.failed||!p.ready||p.id!==song.id||p.fromId!==id)return;
 if(old.currentTime>proposed.end-.55)return;
 mixing=true;prepared=null;
 const upcoming=p.audio;
 const fade=clamp(Math.min(proposed.fade,proposed.end-old.currentTime-.2),.8,12);
 const act={original:old,fromId:id,upcoming,track:song,entry:proposed.entry,
  tempo:proposed.tempo||1,kind:proposed.kind,gain:proposed.gain||1,
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
  // Match beat phase without ever skipping a musical introduction.
  if(proposed.kind==="beat"&&Number.isFinite(proposed.beatPeriod)&&
     Number.isFinite(proposed.beatAnchor)&&Number.isFinite(proposed.nextBeat)){
   const period=proposed.beatPeriod;
   const phase=((proposed.beatAnchor-old.currentTime-proposed.nextBeat)%period+period)%period;
   if(phase>.045&&phase<Math.min(.42,period*.8)&&
      old.currentTime+phase<proposed.end-2.2)
    await new Promise(resolve=>setTimeout(resolve,Math.round(phase*1000)));
  }
  if(active!==act||old.paused||app.currentId()!==id||
     old.currentTime>=proposed.end-1.2){cancel();return}
  await upcoming.play();
  if(active!==act||app.currentId()!==id){cancel();return}
  if(old.paused){cancel();return}
  act.fade=clamp(Math.min(proposed.fade,proposed.end-old.currentTime-.12),.8,12);
  act.at=performance.now();
  function fadeStep(){
   if(active!==act)return;
   if(old.paused||app.audio()!==old||app.currentId()!==id||
      window.MusicBoxRoom?.isActive()){cancel();return}
   const time=clamp((performance.now()-act.at)/(act.fade*1000),0,1);
   const vol=app.volume();
   // Tre curve: Auto/Beat (equal power), Fade (lineare), Rise (entrata
   // graduale e uscita netta). Evita picchi quando il volume è alto.
   let outGain=Math.cos(time*Math.PI/2),inGain=Math.sin(time*Math.PI/2);
   if(act.kind==="fade"||act.kind==="soft"){outGain=1-time;inGain=time}
   else if(act.kind==="rise"){
    outGain=1-Math.pow(time,1.4);
    inGain=Math.pow(time,1.7);
   }
   // Reduce the combined gain near the crossover to avoid a sudden peak.
   const guard=act.kind==="beat"?1-.12*Math.sin(Math.PI*time):1;
   const correction=1+(act.gain-1)*Math.sin(Math.PI*time);
   try{
    old.volume=clamp(vol*outGain*guard,0,1);
    upcoming.volume=clamp(vol*inGain*correction*guard,0,1);
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
 }
}
function tick(){
 // iOS suspends/limits JS timers behind the lock screen. Leave the native
 // single HTML audio uninterrupted until Safari restores this page.
 if(isIOS&&document.hidden){
  if(active||prepared||mobileFading)cancel();
  return;
 }
 if(!enabled||window.MusicBoxRoom?.isActive()){
  if(active||prepared)cancel();
  return;
 }
 const app=bridge(),audio=app?.audio(),id=app?.currentId(),next=app?.mixNext();

 if(active?.handingOff){
  if(id===active.track.id)return;
  cancel();return;
 }
 if(isIOS&&audio&&boundAudio!==audio){
  boundAudio=audio;
  audio.addEventListener("timeupdate",()=>{try{tick()}catch(e){}});
 }
 if(!audio||!id||audio.paused||!next||!Number.isFinite(audio.duration)||audio.duration<26){
  if(active||prepared||mobileFading)cancel();
  return;
 }
 if(active&&(active.original!==audio||active.fromId!==id||active.track.id!==next.id)){
  cancel();
 }
 if(mixing)return;
 if(previousId!==id){
  cancel();previousId=id;plannedFor="";plan=null;shuffleRunFor="";
 }
 // Solo dopo aver registrato il brano corrente: una singola ottimizzazione
 // per traccia, anche quando il timer chiama tick ogni mezzo secondo.
 if(app&&audio&&!audio.paused&&Number.isFinite(audio.duration)&&
    audio.duration-audio.currentTime>25)
   maybeReorderShuffle(app,audio,id);
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
   plan=candidate; // Non mantenere una transizione smentita dalle analisi.
   updateDetails(a,b);
  };
  plan=null; // Wait for analyzed tracks; no speculative cue.
  const now=app.allTracks()?.find(t=>t.id===id);
  decode(now).then(value=>{a=value;update()}).catch(()=>{});
  decode(next).then(value=>{b=value;update()}).catch(()=>{});
 }
 if(!plan){resetMobileFade();return;}
 // Karaoke may load after the audio analysis. Cancel a now unsafe cue.
 const lastKnownLyric=app.mixLyricCues?.(id)?.last;
 if(!mixing&&Number.isFinite(lastKnownLyric)&&
    plan.begin<lastKnownLyric+6&&audio.duration-lastKnownLyric<16){
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
 // Inizia il buffer prima del punto di mix: mai aspettare la battuta finale
 // per scaricare i metadati del prossimo MP3.
 const preloadAt=Math.min(plan.begin-12,Math.max(0,audio.duration-25));
 const blockedUntil=mixFailures.get(id+"|"+next.id)||0;
 const previewAllowed=Date.now()>blockedUntil;
 if(previewAllowed&&!isIOS&&plan.kind!=="cut"&&audio.currentTime>=Math.max(0,preloadAt) &&
    (!prepared||prepared.id!==next.id||prepared.fromId!==id))prepare(next,id,app);
 // Se l'analisi certifica una lunga coda muta e il punto di mix è già
 // passato (es. analisi arrivata tardi), evita ulteriori secondi di silenzio.
 if((plan.silenceTrim||plan.kind==="soft")&&
    audio.currentTime>=plan.end+.08&&
    !active&&!mixing){
  const target=next.id,entry=plan.entry;
  cancel();plannedFor=target;plan=null;
  // Su iPhone un solo audio alla volta preserva i controlli nella
  // schermata di blocco; dove possibile elimina comunque la coda muta.
  Promise.resolve(app.mixHandoff(target,entry)).catch(()=>{});
  return;
 }
 if(previewAllowed&&!isIOS&&plan.kind!=="cut"&&prepared?.ready && audio.currentTime>=plan.begin &&
    audio.currentTime<plan.end-.55){
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
    keyGuess(obj.chroma)||"tonalità da verificare"].join(" · "):
  "analisi non disponibile";
 const description=plan?.silenceTrim?
   " · finale muto eliminato: "+plan.trailing.toFixed(1)+" s":"";
 el.textContent="Ora: "+fmt(a)+"  |  Dopo: "+fmt(b)+description+
   (plan?.kind==="cut"?" · passaggio diretto (niente sovrapposizione)":
     plan?" · mix "+(plan.kind||"auto")+" "+plan.fade.toFixed(1)+" s":
     " · passaggio normale, senza mix forzato");
}
function draw(){
 const btn=$("btnMixIntelligente");
 if(btn){
  btn.setAttribute("aria-pressed",String(enabled));
  const label=btn.querySelector(".voce-testo");
  if(label)label.innerHTML=(enabled?"Mix intelligente: attivo":"Mix intelligente: spento")+
   (isIOS?
    " <small>iPhone: analisi BPM e tonalità · finali muti ridotti</small>":
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
   "Su iPhone protegge i finali: salta soltanto code mute verificate. Il mix con due brani sovrapposti resta disponibile su PC per preservare i controlli a schermo bloccato.":
   "Su PC analizza BPM, tonalità locale e coda musicale: mixa soltanto quando trova una zona finale sufficientemente tranquilla. Se il finale è incerto, lascia finire il brano. Riconoscimento vocale non garantito.";
 const activeLabel=$("mixToggleLabel");
 if(activeLabel)activeLabel.textContent=enabled?"Attivo":"Disattivato";
}
let smartSuggested=[],smartRun=0,shuffleRunFor="";
async function intelligentShuffle(app,audio,fromId){
 if(!enabled||window.MusicBoxRoom?.isActive()||
    !app.mixShuffleCandidates||!app.mixSelectShuffle)return;
 const sequence=app.mixShuffleCandidates();
 if(sequence.length<2)return;
 const initialFirst=sequence[0].id,from=app.allTracks()?.find(t=>t.id===fromId);
 if(!from)return;
 const info=await decode(from);
 if(!info||!enabled||app.currentId()!==fromId)return;
 // Analisi limitata ai primi brani casuali; l'ordine manuale resta intatto.
 // Decode sequenziale per evitare picchi di RAM e connessioni concorrenti.
 const measured=[];
 for(const track of sequence.slice(0,isIOS?3:5)){
  if(!enabled||app.currentId()!==fromId||window.MusicBoxRoom?.isActive())return;
  const data=await decode(track);
  if(data)measured.push({track,data});
 }
 if(!measured.length||app.currentId()!==fromId||
    audio.duration-audio.currentTime<25)return;
 const ranking=measured.map(({track,data})=>{
  const sameArtist=Boolean(from.artist&&track.artist&&
   String(from.artist).trim().toLowerCase()===String(track.artist).trim().toLowerCase());
  const sameAlbum=Boolean(from.spotifyAlbum&&track.spotifyAlbum&&
   from.spotifyAlbum===track.spotifyAlbum);
  const score=smartScore(info,data)+(sameArtist?.10:0)+(sameAlbum?.05:0);
  return {id:track.id,score};
 }).sort((a,b)=>b.score-a.score);
 const original=ranking.find(x=>x.id===initialFirst),winner=ranking[0];
 // Modifica solo una coda casuale AUTOMATICA se il miglioramento è netto.
 if(winner&&winner.id!==initialFirst&&winner.score>=(isIOS?.70:.82)&&
    (!original||winner.score-original.score>=(isIOS?.04:.07))){
  app.mixSelectShuffle({fromId,initialFirst,pickId:winner.id});
 }
}
function maybeReorderShuffle(app,audio,id){
 if(!enabled||shuffleRunFor===id)return;
 const list=app.mixShuffleCandidates?.();
 if(!list||list.length<2)return;
 shuffleRunFor=id;
 intelligentShuffle(app,audio,id).catch(()=>{});
}

function smartScore(a,b){
 if(!a||!b||a.durationMismatch||b.durationMismatch)return -Infinity;
 // BPM 70%, armonia 20%, energia 10%. Un BPM doppio può significare
 // la medesima pulsazione percepita (half-time/double-time).
 const bpmA=Number(a.bpm),bpmB=Number(b.bpm);
 if(!bpmA||!bpmB)return -Infinity;
 const delta=Math.min(...[.5,1,2].map(scale=>
  Math.abs(Math.log2(bpmA/(bpmB*scale)))));
 const beat=clamp(1-delta/.4,0,1);
 const tail=a.outroChroma||a.chroma,head=b.introChroma||b.chroma;
 const harmony=tail&&head?compatibility({chroma:tail},{chroma:head}):.55;
 const level=a.level&&b.level?clamp(1-Math.abs(Math.log2(a.level/b.level))/3,0,1):.5;
 return beat*.7+harmony*.2+level*.1;
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
  const chosen=remaining.shift();
  ranked.push({...chosen,score:smartScore(previous,chosen.info)});
  previous=chosen.info;
 }
 // Se l'utente ha cambiato canzone o playlist, non proporgli una coda vecchia.
 if(app.currentId()!==currentId || window.MusicBoxRoom?.isActive()){
  if(state)state.textContent="La riproduzione è cambiata: premi di nuovo per ricalcolare.";
  return;
 }
 smartSuggested=ranked.map(x=>x.track.id);
 if(state)state.textContent="Sequenza consigliata · "+entries.length+" audio analizzati (stima). Nessun cambiamento ancora applicato.";
 if(list){
  const fragment=document.createDocumentFragment();
  ranked.forEach((x,i)=>{
   const row=document.createElement("li");
   const name=document.createElement("strong");
   name.textContent=(i+1)+". "+String(x.track.title||"Brano");
   const details=document.createElement("small");
   details.textContent=(x.track.artist?x.track.artist+" · ":"")+
     x.info.bpm+" BPM · "+(keyGuess(x.info.chroma)||"tonalità non disponibile");
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
function start(){
 const btn=$("btnMixIntelligente");
 btn?.addEventListener("click",()=>{
  enabled=!enabled;
  try{localStorage.setItem("mb.djmix",enabled?"on":"off")}catch(e){}
  if(!enabled)cancel();else{previousId="";plannedFor=""}
  draw();
  toast(enabled?(isIOS?
   "Mix attivato: salto i finali muti quando posso analizzarli, senza bloccare l'iPhone.":
   "Automix attivato: mix solo quando è adatto, altrimenti passo normalmente."):"Mix disattivato.");
 });
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
 $("mixToggle")?.addEventListener("click",()=>btn?.click());
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
 setInterval(()=>{try{tick()}catch(e){}},500);
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden)resetMobileFade();
  else if(enabled){plannedFor="";try{tick()}catch(e){}}
 });
 window.addEventListener("pageshow",()=>{if(enabled){plannedFor="";try{tick()}catch(e){}}});
}
window.MusicBoxMix={isEnabled:()=>enabled,isAnalyzing:()=>pending.size>0,cancel,
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
   const app=bridge(),track=app?.allTracks()?.find(t=>t.id===id);
   if(!track)return 0;
   const source=app.mixUrl?.(track)||track.url;
   const measured=cache.get(String(source));
   // Skip only verified digital silence; preserve low-volume instruments.
   return Number.isFinite(measured?.safeIntroAt)?clamp(measured.safeIntroAt,0,18):0;
  },
 onTrackChange:(id)=>{
  if(active&&!(active.handingOff&&active.track.id===id))cancel();
 },
 openSettings:()=>{const p=$("mixPanel");if(p)p.hidden=false}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();