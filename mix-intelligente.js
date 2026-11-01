/* Music Box - DJ Mix adattivo. Analisi locale, nessun invio dei file audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
let enabled=true;
try{enabled=localStorage.getItem("mb.djmix")!=="off"}catch(e){/* Storage bloccato */}
const cache=new Map(),pending=new Map();
let active=null,previousId="",plan=null,plannedFor="",mixing=false;
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
 const finalStart=Math.max(0,Math.round(audibleEnd/step)-800);
 for(let i=finalStart;i<Math.min(diff.length,Math.ceil(audibleEnd/step));i++){
  if(diff[i]>maxNovelty){maxNovelty=diff[i];beatAnchor=i*step}
 }
 const hasAudio=typical>.0012;
 return {bpm:best.bpm,first:hasAudio?audibleStart:0,
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
 if(isIOS||!enabled||!track)return null;
 const source=bridge()?.mixUrl?.(track)||track.url;
 if(!source||/^(javascript:|data:)/i.test(source))return null;
 const key=String(source);
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const job=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
  try{
   const response=await fetch(source,{mode:"cors",cache:"force-cache",signal:controller.signal});
   if(!response.ok||Number(response.headers.get("content-length")||0)>18000000)return null;
   let bytes;
   if(response.body&&response.body.getReader){
    const reader=response.body.getReader(),parts=[];let total=0;
    while(true){
     const {done,value}=await reader.read();if(done)break;
     total+=value.length;
     if(total>18000000){await reader.cancel();return null}
     parts.push(value);
    }
    bytes=new Uint8Array(total);let offset=0;
    for(const p of parts){bytes.set(p,offset);offset+=p.length}
   }else{
    const ab=await response.arrayBuffer();if(ab.byteLength>18000000)return null;
    bytes=new Uint8Array(ab);
   }
   const AudioContext=window.AudioContext||window.webkitAudioContext;
   if(!AudioContext)return null;
   const ctx=new AudioContext();
   try{
    const decoded=await ctx.decodeAudioData(bytes.buffer.slice(0));
    if(decoded.duration<35)return null;
    const frame=analyzeFrames(decoded),harmonies=chroma(decoded);
    const result={...frame,chroma:harmonies,duration:decoded.duration};
    cache.set(key,result);
    if(cache.size>6)cache.delete(cache.keys().next().value);
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
 const confident=!!(a?.confidentTail && a.last<dur-2.0);
 const audibleEnd=confident?Math.min(dur,a.last):dur;
 // L'ultimo istante udibile conta più della fine del file.
 // Conserva 0.2s di margine se il brano ha una coda musicale reale.
 const end=clamp(audibleEnd-(confident?.15:1.2),13,dur-1.2);
 const bpm=Number(a?.bpm)||120;
 const fit=!!(b?.bpm&&Math.abs(Math.log2(bpm/b.bpm))<.16);
 const harmony=a?.chroma&&b?.chroma?compatibility(a,b):null;
 const bars=fit&&harmony>.76?3:2;
 const fade=clamp(bars*4*60/bpm,3.5,7);
 let begin=end-fade;
 // Se la battuta è riconoscibile, il punto di ingresso è leggermente
 // riallineato al beat; non spostare il mix verso una coda già silenziosa.
 if(a?.beatAnchor && a?.bpm){
  const beat=60/a.bpm;
  const nearest=a.beatAnchor+Math.round((begin-a.beatAnchor)/beat)*beat;
  begin+=clamp(nearest-begin,-.22,.22);
 }
 begin=clamp(begin,9,end-1.4);
 return {begin,end,fade:end-begin,
  entry:b?.leading>=.65?clamp(b.first-.08,0,35):0,
  score:harmony===null?null:Math.round(harmony*100),
  silenceTrim:confident,
  trailing:confident?Math.max(0,dur-audibleEnd):0};
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
 const act=active;if(!act)return;
 const app=bridge();
 if(!app||window.MusicBoxRoom?.isActive()||app.audio()!==act.original||
    app.currentId()!==act.fromId){cancel();return}
 const at=Math.max(0,act.upcoming.currentTime||act.entry);
 try{await app.mixHandoff(act.track.id,at)}
 catch(e){/* Il lettore normale gestisce eventuali problemi di rete. */}
 finally{cancel()}
}
async function beginMix(song,proposed){
 const app=bridge(),old=app?.audio(),id=app?.currentId();
 if(!old||old.paused||mixing||!proposed||app.mixNext()?.id!==song.id||isIOS)return;
 const p=prepared;
 if(!p||p.failed||!p.ready||p.id!==song.id||p.fromId!==id)return;
 if(old.currentTime>proposed.end-.55)return;
 mixing=true;prepared=null;
 const upcoming=p.audio;
 const fade=clamp(Math.min(proposed.fade,proposed.end-old.currentTime-.2),.8,8);
 const act={original:old,fromId:id,upcoming,track:song,entry:proposed.entry,
  at:0,fade,timer:null};
 active=act;
 try{
  if(proposed.entry>0&&upcoming.seekable?.length){
   upcoming.currentTime=Math.min(proposed.entry,Math.max(0,(upcoming.duration||Infinity)-1));
   if(upcoming.seeking){
    await Promise.race([new Promise(resolve=>
      upcoming.addEventListener("seeked",resolve,{once:true})),
      new Promise(resolve=>setTimeout(resolve,1400))]);
   }
  }
  if(active!==act||old.paused||app.currentId()!==id){cancel();return}
  await upcoming.play();
  if(active!==act||app.currentId()!==id){cancel();return}
  act.at=performance.now();
  function fadeStep(){
   if(active!==act)return;
   if(old.paused||app.audio()!==old||app.currentId()!==id||
      window.MusicBoxRoom?.isActive()){cancel();return}
   const time=clamp((performance.now()-act.at)/(act.fade*1000),0,1);
   const vol=app.volume();
   try{
    old.volume=vol*Math.cos(time*Math.PI/2);
    upcoming.volume=vol*Math.sin(time*Math.PI/2);
   }catch(e){cancel();return}
   if(time>=1){handoff();return}
   act.timer=setTimeout(fadeStep,50);
  }
  fadeStep();
 }catch(e){cancel()}
}
function tick(){
 if(!enabled||isIOS||window.MusicBoxRoom?.isActive()){
  if(active||prepared)cancel();
  return;
 }
 const app=bridge(),audio=app?.audio(),id=app?.currentId(),next=app?.mixNext();
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
 if(audio.currentTime>=Math.max(0,preloadAt) &&
    (!prepared||prepared.id!==next.id||prepared.fromId!==id))prepare(next,id,app);
 // Se l'analisi certifica una lunga coda muta e il punto di mix è già
 // passato (es. analisi arrivata tardi), evita ulteriori secondi di silenzio.
 if(plan.silenceTrim&&audio.currentTime>=plan.end+.15){
  const target=next.id,entry=plan.entry;
  cancel();plannedFor=target;plan=null;
  Promise.resolve(app.mixHandoff(target,entry)).catch(()=>{});
  return;
 }
 if(prepared?.ready && audio.currentTime>=plan.begin &&
    audio.currentTime<plan.end-.55){
  beginMix(next,plan).catch(()=>cancel());
 }
}

function draw(){
 const btn=$("btnMixIntelligente");if(!btn)return;
 btn.setAttribute("aria-pressed",String(enabled));
 const label=btn.querySelector(".voce-testo");
 if(label)label.innerHTML=(enabled?"Mix intelligente: attivo":"Mix intelligente: spento")+
  (isIOS?" <small>iPhone: passaggio normale protetto</small>":" <small>BPM · tonalità · attacchi · crossfade</small>");
}
function start(){
 const btn=$("btnMixIntelligente");
 btn?.addEventListener("click",()=>{
  enabled=!enabled;
  try{localStorage.setItem("mb.djmix",enabled?"on":"off")}catch(e){}
  if(!enabled)cancel();else{previousId="";plannedFor="";}
  draw();toast(enabled?(isIOS?"Mix attivo: su iPhone resta il passaggio normale per proteggere l'audio.":"Mix intelligente attivato. Analizzo i brani in riproduzione."):"Mix intelligente disattivato.");
 });
 draw();
 setInterval(()=>{tick().catch(()=>{})},650);
}
window.MusicBoxMix={isEnabled:()=>enabled,isAnalyzing:()=>pending.size>0,cancel};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();