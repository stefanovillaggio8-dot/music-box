/* Music Box - DJ Mix adattivo. Analisi locale, nessun invio dei file audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
let enabled=localStorage.getItem("mb.djmix")!=="off";
const cache=new Map(),pending=new Map();
let active=null,previousId="",plan=null,plannedFor="",mixing=false;
function bridge(){return window.MusicBoxBridge}
function toast(m){bridge()?.toast?.(m)}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function analyzeFrames(buf){
 const ch=buf.getChannelData(0),rate=buf.sampleRate,hop=Math.max(1,Math.round(rate*.05));
 const e=[],count=Math.ceil(ch.length/hop),stride=4;
 for(let i=0;i<count;i++){
  let sum=0,n=0,end=Math.min(ch.length,(i+1)*hop);
  for(let j=i*hop;j<end;j+=stride){sum+=ch[j]*ch[j];n++}
  e.push(Math.sqrt(sum/Math.max(1,n)));
 }
 let peak=0;for(const x of e)peak=Math.max(peak,x);
 let first=0,last=e.length-1;
 // Entrate e uscite musicali, non semplice durata dell'MP3.
 const threshold=Math.max(.007,peak*.19);
 for(let i=0;i<e.length;i++)if(e[i]>threshold){first=i;break}
 for(let i=e.length-1;i>=0;i--)if(e[i]>threshold){last=i;break}
 const diff=e.map((v,i)=>i?Math.max(0,v-e[i-1]):0);
 const candidates=[];
 for(let bpm=72;bpm<=180;bpm++){
  const lag=Math.round(60/(bpm*.05));
  let corr=0,energy=0;
  for(let i=lag;i<diff.length;i+=2){corr+=diff[i]*diff[i-lag];energy+=diff[i]*diff[i]}
  candidates.push({bpm,score:corr/(energy+1e-8)});
 }
 candidates.sort((a,b)=>b.score-a.score);
 const bpm=candidates[0]?.bpm||120;
 // Trova un attacco ritmico forte negli ultimi 20 secondi.
 const minIndex=Math.max(0,last-400);
 let beatAnchor=last;
 let maxNovelty=0;
 for(let i=minIndex;i<=last;i++){
  if(diff[i]>maxNovelty){maxNovelty=diff[i];beatAnchor=i}
 }
 return {bpm,first:first*.05,last:last*.05,beatAnchor:beatAnchor*.05,peak};
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
 if(isIOS||!enabled||!track?.url||!/^https?:|^blob:/i.test(track.url))return null;
 const key=String(track.file||track.id||track.url);
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const job=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
  try{
   const response=await fetch(track.url,{mode:"cors",cache:"force-cache",signal:controller.signal});
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
 const dur=Math.min(actualDuration,a?.duration||actualDuration);
 if(!a||!b||!Number.isFinite(dur)||dur<40)return null;
 const tempoFit=Math.abs(Math.log2(a.bpm/b.bpm));
 const harmonic=compatibility(a,b);
 // Durata legata alle battute; transizioni lunghe solo per BPM e tonalita' compatibili.
 const bars=(tempoFit<.15&&harmonic>.75)?4:2;
 const secondsPerBeat=60/a.bpm,fade=clamp(bars*4*secondsPerBeat,3.0,8.5);
 const end=clamp(Math.min(dur-.35,a.last+.4),25,dur-.35);
 const anchor=a.beatAnchor||end;
 let begin=end-fade;
 const period=60/a.bpm;
 const nearest=anchor+Math.round((begin-anchor)/period)*period;
 begin+=clamp(nearest-begin,-period*.5,period*.5);
 begin=clamp(begin,18,end-2.0);
 return {begin,end,fade:end-begin,entry:clamp(b.first||0,0,9),score:Math.round((harmonic*100))};
}
function cancel(){
 if(!active)return;
 try{active.upcoming.pause();active.upcoming.removeAttribute("src");active.upcoming.load()}catch(e){}
 try{if(active.original)active.original.volume=bridge()?.volume?.()??1}catch(e){}
 active=null;mixing=false;
}
async function handoff(){
 const act=active;if(!act)return;
 const app=bridge(),next=act.track;
 if(!app||window.MusicBoxRoom?.isActive()||app.audio()!==act.original){cancel();return}
 const at=Math.max(0,act.upcoming.currentTime||act.entry);
 try{
  // L'audio di anteprima continua finche' il lettore ufficiale e' avviato.
  await app.mixHandoff(next.id,at);
 }finally{cancel()}
}
async function beginMix(song,proposed){
 const app=bridge(),old=app?.audio();
 if(!old||old.paused||mixing||!proposed||app.mixNext()?.id!==song.id||isIOS)return;
 mixing=true;
 const upcoming=new Audio();
 upcoming.preload="auto";
 upcoming.src=app.mixUrl?.(song)||song.url;
 upcoming.volume=0;
 // Mantieni la riproducibilita\u0027 degli MP3 senza richiedere CORS al media element.
 const act={original:old,upcoming,track:song,entry:proposed.entry,at:performance.now(),fade:proposed.fade};
 active=act;
 try{
  await new Promise((resolve,reject)=>{
   if(upcoming.readyState>=1)return resolve();
   const ok=()=>{cleanup();resolve()},err=()=>{cleanup();reject(Error("metadata"))};
   const cleanup=()=>{clearTimeout(timer);upcoming.removeEventListener("loadedmetadata",ok);upcoming.removeEventListener("error",err)};
   upcoming.addEventListener("loadedmetadata",ok,{once:true});
   upcoming.addEventListener("error",err,{once:true});
   const timer=setTimeout(()=>{cleanup();reject(Error("timeout"))},4000);
  });
  if(active!==act||old.paused){cancel();return}
  upcoming.currentTime=proposed.entry;
  await upcoming.play();
  act.at=performance.now();
  // Fade equal-power. Non usa WebAudio: rispetta il player e la catena dei bassi.
  function fade(){
   if(active!==act)return;
   if(old.paused||app.audio()!==old||window.MusicBoxRoom?.isActive()){cancel();return}
   const p=clamp((performance.now()-act.at)/(act.fade*1000),0,1),volume=app.volume();
   try{old.volume=volume*Math.cos(p*Math.PI/2);upcoming.volume=volume*Math.sin(p*Math.PI/2)}catch(e){cancel();return}
   if(p>=1){handoff();return}
   act.timer=setTimeout(fade,50);
  }
  fade();
 }catch(e){cancel()}
}
async function tick(){
 if(!enabled||isIOS||mixing||document.hidden||window.MusicBoxRoom?.isActive()){if(active)cancel();return}
 const app=bridge(),audio=app?.audio(),id=app?.currentId(),next=app?.mixNext();
 if(!audio||!id||audio.paused||!next||!Number.isFinite(audio.duration)||audio.duration<40)return;
 if(previousId!==id){previousId=id;plan=null;plannedFor="";}
 if(plannedFor!==next.id){
  plannedFor=next.id;plan=null;
  const now=app.allTracks()?.find(t=>t.id===id);
  Promise.all([decode(now),decode(next)]).then(([a,b])=>{
   if(app.currentId()!==id||app.mixNext()?.id!==next.id||!a||!b)return;
   plan=transition(a,b,audio.duration);
  }).catch(()=>{});
 }
 if(plan&&audio.currentTime>=plan.begin&&audio.currentTime<plan.end-.6)
  beginMix(next,plan);
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
  enabled=!enabled;localStorage.setItem("mb.djmix",enabled?"on":"off");
  if(!enabled)cancel();else{previousId="";plannedFor="";}
  draw();toast(enabled?(isIOS?"Mix attivo: su iPhone resta il passaggio normale per proteggere l'audio.":"Mix intelligente attivato. Analizzo i brani in riproduzione."):"Mix intelligente disattivato.");
 });
 draw();
 setInterval(()=>{tick().catch(()=>{})},650);
}
window.MusicBoxMix={isEnabled:()=>enabled,isAnalyzing:()=>pending.size>0,cancel};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();