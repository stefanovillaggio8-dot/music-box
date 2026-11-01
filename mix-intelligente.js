/* Music Box - DJ Mix adattivo. Analisi locale, nessun invio dei file audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
let enabled=true;
try{enabled=localStorage.getItem("mb.djmix")!=="off"}catch(e){/* Storage bloccato */}
const cache=new Map(),pending=new Map();
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
 const gate=clamp(typical*.035,.0012,.015);
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
 const audibleStart=Math.max(0,first*group*step-.12);
 const audibleEnd=Math.min(duration,(last+1)*group*step);
 const leading=Math.max(0,audibleStart),trailing=Math.max(0,duration-audibleEnd);
 const diff=energy.map((v,i)=>i?Math.max(0,v-energy[i-1]):0);
 let best={bpm:120,score:-Infinity};
 // Autocorrelazione delle variazioni d'energia tra 72 e 180 BPM.
 for(let lag=Math.round(60/(180*step));lag<=Math.round(60/(72*step));lag++){
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
 return {bpm:best.bpm,beatConfidence,introBeat,tailEnergy,introWave,outroWave,
  first:hasAudio?audibleStart:0,
  last:hasAudio?audibleEnd:duration,beatAnchor,peak:ordered.at(-1)||0,
  trailing:hasAudio?trailing:0,leading:hasAudio?leading:0,
  confidentTail:hasAudio&&trailing>=2.0&&audibleEnd>Math.max(10,duration*.28)};
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
function chroma(buf){
 const data=buf.getChannelData(0),rate=buf.sampleRate,N=4096,hist=new Float64Array(12);
 if(data.length<N)return [...hist];
 const duration=buf.duration;
 // 24 finestre distribuite tra introduzione, corpo e finale.
 for(let w=0;w<24;w++){
  const second=clamp((w+.5)/24*duration,0,duration-N/rate);
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
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const job=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
  try{
   const response=await fetch(source,{mode:"cors",cache:"force-cache",signal:controller.signal});
   const maxBytes=isIOS?6500000:18000000;
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
   const AudioContext=window.AudioContext||window.webkitAudioContext;
   if(!AudioContext)return null;
   const ctx=new AudioContext();
   try{
    const decoded=await ctx.decodeAudioData(bytes.buffer.slice(0));
    if(decoded.duration<35)return null;
    const frame=analyzeFrames(decoded);
    const harmonies=isIOS?null:chroma(decoded);
    const result={...frame,level:Math.min(1,Math.max(.001,frame.peak*.6)),chroma:harmonies,duration:decoded.duration};
    cache.set(key,result);
    if(cache.size>8)cache.delete(cache.keys().next().value);
    return result;
   }finally{await ctx.close().catch(()=>{})}
  }catch(e){return null}
  finally{clearTimeout(timeout)}
 })();
 pending.set(key,job);
 try{return await job}finally{pending.delete(key)}
}
function transition(a,b,actualDuration){
 const dur=Number(actualDuration);
 if(!Number.isFinite(dur)||dur<26)return null;
 const trim=!!(a?.confidentTail&&a.last<dur-2);
 const audibleEnd=trim?Math.min(dur,a.last):dur;
 const end=clamp(audibleEnd-(trim?.22:1.15),13,dur-1.15);
 const bpm=Number(a?.bpm)||120,ratio=b?.bpm?bpm/b.bpm:1;
 const tempoClose=!!(a?.beatConfidence>.07&&b?.beatConfidence>.07&&ratio>=.92&&ratio<=1.08);
 const harmonic=a?.chroma&&b?.chroma?compatibility(a,b):null;
 const beatFriendly=tempoClose&&(harmonic===null||harmonic>.68);
 const autoStyle=beatFriendly?"beat":
  (harmonic!==null&&harmonic<.55?"fade":"rise");
 const kind=style==="auto"?autoStyle:style;
 const bars=beatFriendly&&kind==="beat"?4:2;
 const autoSeconds=beatFriendly?clamp(bars*4*60/bpm,4.5,9):3.7;
 const requested=style==="auto"?autoSeconds:mixSeconds;
 const fade=clamp(requested,2.8,Math.min(12,end-8));
 let begin=end-fade;
 // Usa la griglia ritmica rilevata nel brano in uscita.
 if(a?.beatAnchor&&a?.beatConfidence>.07){
  const period=60/bpm;
  const beatStart=a.beatAnchor+Math.round((begin-a.beatAnchor)/period)*period;
  begin+=clamp(beatStart-begin,-.23,.23);
 }
 // Piccole valli di volume nei pressi della battuta ideale evitano
 // sovrapposizioni inutilmente brusche tra due voci soliste.
 if(a?.tailEnergy?.length && kind==="fade"){
  const options=a.tailEnergy.filter(p=>Math.abs(p.at-begin)<1.3);
  if(options.length){
   const best=options.reduce((acc,p)=>p.energy<acc.energy?p:acc,options[0]);
   begin+=clamp(best.at-begin,-.35,.35);
  }
 }
 begin=clamp(begin,8,end-1.5);
 // Allinea il primo attacco ritmico del brano entrante. Se la traccia
 // contiene un'introduzione udibile non tagliarla automaticamente.
 let entry=b?.leading>=.65?clamp(b.first-.08,0,40):0;
 if(tempoClose && b?.introBeat>entry+.2 && b.introBeat<entry+3.5)
   entry=clamp(b.introBeat-.06,0,40);
 const tempo=tempoClose&&kind==="beat"?clamp(ratio,.97,1.03):1;
 const gain=a?.level&&b?.level?clamp(a.level/b.level,.87,1.13):1;
 return {begin,end,fade:end-begin,entry,tempo,kind,gain,
  score:harmonic===null?null:Math.round(harmonic*100),
  silenceTrim:trim,trailing:trim?Math.max(0,dur-audibleEnd):0};
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
let prepared=null;
function dropPrepared(){
 if(!prepared)return;
 const p=prepared;prepared=null;
 try{p.audio.pause();p.audio.removeAttribute("src");p.audio.load()}catch(e){}
}
function cancel(){
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
 let done=false;
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
   while(active===act&&performance.now()-t0<280){
    const p=clamp((performance.now()-t0)/280,0,1);
    old.volume=volume*p;
    preview.volume=volume*(1-p);
    await new Promise(resolve=>setTimeout(resolve,35));
   }
   done=true;
  }else{
   // Timeout: non tenere due stream vivi indefinitamente.
   // Il lettore principale resta quello ufficiale con volume ripristinato.
   try{old.volume=volume}catch(e){}
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
  at:0,fade,timer:null};
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
  await upcoming.play();
  if(active!==act||app.currentId()!==id){cancel();return}
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
   if(act.kind==="fade"){outGain=1-time;inGain=time}
   else if(act.kind==="rise"){
    outGain=1-Math.pow(time,1.4);
    inGain=Math.pow(time,1.7);
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
 }catch(e){cancel()}
}
function tick(){
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
  if(active||prepared)cancel();
  return;
 }
 if(active&&(active.original!==audio||active.fromId!==id||active.track.id!==next.id)){
  cancel();
 }
 if(mixing)return;
 if(previousId!==id){
  cancel();previousId=id;plannedFor="";plan=null;
 }
 if(plannedFor!==next.id){
  cancel();plannedFor=next.id;
  const fromId=id,target=next.id,duration=audio.duration;
  let a=null,b=null;
  const update=()=>{
   if(previousId!==fromId||plannedFor!==target||app.currentId()!==fromId||
      app.mixNext()?.id!==target||mixing)return;
   const candidate=transition(a,b,audio.duration);
   if(candidate)plan=candidate;
   updateDetails(a,b);
  };
  plan=transition(null,null,duration);
  const now=app.allTracks()?.find(t=>t.id===id);
  decode(now).then(value=>{a=value;update()}).catch(()=>{});
  decode(next).then(value=>{b=value;update()}).catch(()=>{});
 }
 if(!plan)return;
 // Inizia il buffer prima del punto di mix: mai aspettare la battuta finale
 // per scaricare i metadati del prossimo MP3.
 const preloadAt=Math.min(plan.begin-12,Math.max(0,audio.duration-25));
 if(!isIOS&&audio.currentTime>=Math.max(0,preloadAt) &&
    (!prepared||prepared.id!==next.id||prepared.fromId!==id))prepare(next,id,app);
 // Se l'analisi certifica una lunga coda muta e il punto di mix è già
 // passato (es. analisi arrivata tardi), evita ulteriori secondi di silenzio.
 if(plan.silenceTrim&&audio.currentTime>=plan.end+.15){
  const target=next.id,entry=plan.entry;
  cancel();plannedFor=target;plan=null;
  // Su iPhone un solo audio alla volta preserva i controlli nella
  // schermata di blocco; dove possibile elimina comunque la coda muta.
  Promise.resolve(app.mixHandoff(target,entry)).catch(()=>{});
  return;
 }
 if(!isIOS&&prepared?.ready && audio.currentTime>=plan.begin &&
    audio.currentTime<plan.end-.55){
  beginMix(next,plan).catch(()=>cancel());
 }
}

function paintWave(id,bars){
 const element=$(id);
 if(!element||!Array.isArray(bars)||!bars.length)return;
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
 if(a?.outroWave)paintWave("mixWaveOut",a.outroWave);
 if(b?.introWave)paintWave("mixWaveIn",b.introWave);
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
   (plan?" · transizione "+(plan.kind||"auto")+" "+plan.fade.toFixed(1)+" s":"");
}
function draw(){
 const btn=$("btnMixIntelligente");
 if(btn){
  btn.setAttribute("aria-pressed",String(enabled));
  const label=btn.querySelector(".voce-testo");
  if(label)label.innerHTML=(enabled?"Mix intelligente: attivo":"Mix intelligente: spento")+
   (isIOS?
    " <small>iPhone: riduzione dei silenzi · riproduzione protetta</small>":
    " <small>Automix · BPM · tonalità · transizioni adattive</small>");
 }
 const styleEl=$("mixStyle");
 if(styleEl&&styleEl.value!==style)styleEl.value=style;
 const secs=$("mixSeconds");
 if(secs&&Number(secs.value)!==mixSeconds)secs.value=String(mixSeconds);
 const value=$("mixSecondsValue");if(value)value.textContent=mixSeconds+" s";
 const note=$("mixDeviceNote");
 if(note)note.textContent=isIOS?
   "Su iPhone il lettore conserva un solo flusso audio per non compromettere l'ascolto a schermo bloccato: prova a saltare le code mute quando l'analisi è disponibile. Il crossfade DJ è disponibile su PC.":
   "Su PC la prossima traccia viene precaricata: Automix cerca la battuta, la tonalità e il punto di uscita migliore. Le preferenze restano salvate.";
 const activeLabel=$("mixToggleLabel");
 if(activeLabel)activeLabel.textContent=enabled?"Attivo":"Disattivato";
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
   "Automix attivato: preparo i brani e sincronizzo le transizioni."):"Mix disattivato.");
 });
 const panel=$("mixPanel");
 $("btnMixSettings")?.addEventListener("click",()=>{
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
 draw();
 setInterval(()=>{try{tick()}catch(e){}},500);
}
window.MusicBoxMix={isEnabled:()=>enabled,isAnalyzing:()=>pending.size>0,cancel,openSettings:()=>{const p=$("mixPanel");if(p)p.hidden=false}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();