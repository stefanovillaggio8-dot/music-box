"use strict";
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>n!==null&&n!==undefined&&n!==""&&Number.isFinite(Number(n))?Number(n).toFixed(1):"—";
const time=n=>{if(n===null||n===undefined||n===""||!Number.isFinite(Number(n)))return "--:--";let x=Math.max(0,Math.floor(Number(n)));return Math.floor(x/60)+":"+String(x%60).padStart(2,"0")};
const ago=t=>{if(!t)return "—";const d=Math.max(0,Date.now()-new Date(t).getTime());return d<60000?"ora":d<3600000?Math.round(d/60000)+" min fa":new Date(t).toLocaleString("it-IT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})};
const safeNumber=n=>Number.isFinite(Number(n))?Number(n):null;
const key="mb.smartmix.lab.";
function read(name,def){try{const v=JSON.parse(localStorage.getItem(key+name));return v??def}catch(_){return def}}
function write(name,value){try{localStorage.setItem(key+name,JSON.stringify(value))}catch(_){}}
const state={
 device:/iPhone|iPad|iPod/i.test(navigator.userAgent)?"iphone":"pc",view:"overview",
 index:null,rows:[],catalog:[],events:read("events",[]),snapshots:read("snapshots",[]),
 manual:read("manual",{}),checks:[],results:[],lastResult:null,lastLive:null,lastLiveAt:0,
 version:"—",page:0,batch:[],channel:null,pending:new Map(),toastTimer:null,
 lastStatusDevice:null,indexError:null
};
state.events=Array.isArray(state.events)?state.events.slice(-650):[];
state.snapshots=Array.isArray(state.snapshots)?state.snapshots.slice(-50):[];
state.manual=state.manual&&typeof state.manual==="object"?state.manual:{};
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("visible");clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove("visible"),2500)}
function platformLabel(d){return d==="iphone"?"iPhone":"PC"}
function changeView(view){
 if(!$( "view-"+view))return;state.view=view;
 document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+view));
 document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
 const names={overview:"Overview",library:"Brani analizzati",transitions:"Transizioni",events:"Monitor live",tests:"Test & mobile",compare:"Prima / dopo"};
 $("viewName").textContent=names[view]||view;
 $("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"instant"});
 if(view==="library")renderLibrary();
 if(view==="events")renderEvents();
 if(view==="tests")renderTests();
 if(view==="compare")renderSnapshots();
 if(view==="transitions")fillTracks();
}
function changeDevice(d){state.device=d;document.querySelectorAll("[data-device]").forEach(x=>x.classList.toggle("chosen",x.dataset.device===d));renderAll()}
function broadcast(message){try{state.channel?.postMessage(message)}catch(_){}}
function request(type,payload,timeoutMs){
 if(!state.channel)return Promise.resolve(null);
 const requestId="lab-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
 return new Promise(resolve=>{
  const timer=setTimeout(()=>{state.pending.delete(requestId);resolve(null)},timeoutMs||2600);
  state.pending.set(requestId,result=>{clearTimeout(timer);resolve(result)});
  broadcast({type,requestId,...(payload||{})});
 });
}
function onMessage(msg){
 if(!msg||typeof msg!=="object")return;
 if(msg.type==="status"&&msg.data){state.lastLive=msg.data;state.lastLiveAt=Date.now();state.lastStatusDevice=msg.data.device||null;renderOverview()}
 if(msg.type==="catalog"&&Array.isArray(msg.tracks)){state.catalog=msg.tracks.slice(0,5000).map(t=>({id:String(t.id||""),title:String(t.title||""),artist:String(t.artist||""),file:String(t.file||""),url:String(t.url||"")}));mergeCatalog();fillTracks();renderOverview()}
 if(msg.type==="event"&&msg.event)addEvent(msg.event);
 if(msg.type==="inspect-response"&&msg.requestId&&state.pending.has(msg.requestId)){const fn=state.pending.get(msg.requestId);state.pending.delete(msg.requestId);fn(msg.result||null)}
 if(msg.type==="hello"){broadcast({type:"catalog-request"});broadcast({type:"status-request"})}
}
function connect(){
 if(!("BroadcastChannel" in window))return;
 try{state.channel=new BroadcastChannel("musicbox-smartmix-monitor-v1");state.channel.onmessage=e=>onMessage(e.data);broadcast({type:"hello",from:"lab"});broadcast({type:"catalog-request"});broadcast({type:"status-request"})}catch(_){}
}
function addEvent(e){
 if(!e||!e.id)return;
 if(state.events.some(x=>x.id===e.id))return;
 const item={id:String(e.id),type:String(e.type||"info"),device:e.device==="iphone"?"iphone":"pc",
  ts:String(e.ts||new Date().toISOString()),title:String(e.title||"Evento"),detail:String(e.detail||""),
  trackId:String(e.trackId||""),fromId:String(e.fromId||""),toId:String(e.toId||""),
  version:String(e.version||state.version)};
 state.events.push(item);state.events=state.events.slice(-650);write("events",state.events);
 if(state.view==="events")renderEvents();renderOverview();if(state.view==="tests")renderTests();
}
function qualityState(){const live=state.lastLive&&Date.now()-state.lastLiveAt<12000?state.lastLive:null;return live&&live.device===state.device?live:null}
function parseSongPath(keyStr){return String(keyStr).match(/songs\/[A-Za-z0-9/_-]+\.mp3/i)?.[0]||null}
function mergeCatalog(){
 const map=new Map();
 for(const [k,v] of Object.entries(state.index?.entries||{})){
  const file=parseSongPath(k);if(!file)continue;
  const score=k.startsWith("audio/")?3:k.startsWith("mobile/")?2:1;
  const prev=map.get(file);
  if(!prev||score>prev.priority)map.set(file,{id:"",file,title:file.split("/").pop().replace(".mp3",""),artist:"",info:v,status:v?.status==="ok"?"ok":"unknown",priority:score});
 }
 for(const t of state.catalog){
  const file=parseSongPath(t.file||t.url);
  const entry=file?map.get(file):null;
  const obj=entry||{file:file||"",info:null,status:"unknown",priority:0};
  const row={...obj,id:t.id,title:t.title||obj.title,artist:t.artist||"",file:obj.file||file||""};
  if(file)map.set(file,row);
  else map.set("track:"+t.id,row);
 }
 state.rows=[...map.values()].filter(x=>x.id||x.file).sort((a,b)=>String(a.title).localeCompare(String(b.title),"it"));
 $("metricAnalyzed").textContent=(state.index?.analyzed??state.rows.filter(x=>x.info?.status==="ok").length).toLocaleString("it-IT");
 $("metricCoverage").textContent=state.index?.sourceCount?String(state.index.analyzed||0)+" / "+String(state.index.sourceCount)+" audio indicizzati":"Copertura da verificare";
 $("statusIndex").textContent=state.index?((state.index.analyzed||0)+" / "+(state.index.sourceCount||"?")):(state.indexError?"Indice non disponibile":"In caricamento");
 $("sideSub").textContent=state.index?"Indice disponibile":"Nessun dato audio caricato";
 if(state.view==="library")renderLibrary();
}
async function loadIndex(force){
 $("sourceStatus").textContent="INDICE IN CARICAMENTO";
 try{
  const r=await fetch("../dj-deep-analysis.json",{cache:force?"reload":"default"});
  if(!r.ok)throw Error("HTTP "+r.status);
  const j=await r.json();
  if(!j||typeof j.entries!=="object")throw Error("Formato dati non valido");
  state.index=j;state.indexError=null;
  mergeCatalog();
  $("sourceStatus").textContent="INDICE AUDIO DISPONIBILE";
  $("sourceStatus").classList.remove("offline");
  state.version=state.version||"—";
  renderAll();
 }catch(e){
  state.indexError=String(e?.message||e);
  $("sourceStatus").textContent="INDICE NON DISPONIBILE";
  $("sourceStatus").classList.add("offline");
  $("statusIndex").textContent="Non disponibile";
  toast("Indice non caricato: "+state.indexError);
 }
}
async function loadVersion(){
 try{const r=await fetch("../versione.json",{cache:"no-store"});if(!r.ok)return;const j=await r.json();if(j?.versione){state.version=String(j.versione);$("engineVersion").textContent="V "+state.version}}catch(_){}
}
function findRow(idOrFile){
 if(!idOrFile)return null;
 const s=String(idOrFile);
 return state.rows.find(r=>r.id===s||r.file===s)||state.rows.find(r=>r.file.endsWith("/"+s+".mp3"))||null;
}
function rowLabel(r){return (r.title||r.file||r.id)+" · "+(r.artist||r.id||r.file)}
function displayTrack(id){const r=findRow(id);return r?rowLabel(r):id||"—"}
function drawWave(el,values,isIncoming,beatAt,bpm,duration,first){
 if(!el)return;el.className="wavebox"+(isIncoming?" incoming":"");
 if(!Array.isArray(values)||!values.length){el.innerHTML='<div class="wave-empty">Analisi audio non disponibile</div>';return}
 const max=Math.max(.03,...values.map(x=>Math.max(0,Number(x)||0)));
 let markup=values.slice(0,64).map((v,i)=>'<span class="wavebar" style="height:'+Math.max(5,Math.round(Math.max(0,Number(v)||0)/max*58))+'px"></span>').join("");
 const period=Number(bpm)>0?60/Number(bpm):0;
 if(period&&beatAt!==null&&beatAt!==undefined&&Number.isFinite(Number(beatAt))){
  const start=first?0:Math.max(0,Number(duration)-16);
  let anchor=Number(beatAt);
  const count=0;
  while(anchor>=start)anchor-=period;
  for(let t=anchor+period;t<=start+16;t+=period){
   const x=(t-start)/16*100;
   if(x>=0&&x<=100)markup+='<span class="beat-marker" style="left:'+x.toFixed(2)+'%"></span>';
  }
 }
 el.innerHTML=markup;
}
function renderOverview(){
 const live=qualityState(),d=live?.diagnostics||{},now=findRow(d.current),next=findRow(d.next);
 $("sideConnection").textContent=live?"Monitor collegato":"Solo analisi locale";
 $("sourceStatus").classList.toggle("connected",!!live);
 if(live)$("sourceStatus").textContent="MONITOR "+platformLabel(state.device).toUpperCase()+" COLLEGATO";
 else if(state.index)$("sourceStatus").textContent="INDICE AUDIO DISPONIBILE";
 $("sourceStatus").classList.toggle("offline",!live&&!state.index);
 $("metricChecks").textContent=state.results.filter(r=>r.device===state.device).length.toLocaleString("it-IT");
 $("metricOverlaps").textContent=state.events.filter(e=>e.device===state.device&&e.type==="overlap").length;
 $("metricIssues").textContent=state.events.filter(e=>e.device===state.device&&e.type==="issue").length;
 $("currentTrack").textContent=now?.title||d.current||"Nessun brano in riproduzione";
 $("currentSubtitle").textContent=now?.artist|| (live?"Aspetto dati del brano":"Apri Music Box sullo stesso dispositivo");
 $("nextTrack").textContent=next?.title||d.next||"Prossimo brano sconosciuto";
 $("nextSubtitle").textContent=next?.artist||"";
 $("currentTime").textContent=time(d.playbackTime)+(Number.isFinite(Number(d.remaining))?" / −"+time(d.remaining):"");
 $("outroBpm").textContent=now?.info?.bpm?fmt(now.info.bpm)+" BPM":"— BPM";
 $("introBpm").textContent=next?.info?.bpm?fmt(next.info.bpm)+" BPM":"— BPM";
 $("nextKey").textContent=next?.info?.camelot?.code||"—";
 drawWave($("waveOut"),now?.info?.outroWave,false,now?.info?.beatAnchor,now?.info?.bpm,now?.info?.duration,false);
 drawWave($("waveIn"),next?.info?.introWave,true,next?.info?.introBeat,next?.info?.bpm,next?.info?.duration,true);
 const cue=d.plannedCue||{},active=d.liveTransition;
 $("nowTransition").textContent=active?"SOVRAPPOSIZIONE REALE · "+String(active.kind||"mix").toUpperCase():
   cue.kind?String(cue.kind).toUpperCase()+" · "+fmt(cue.fade)+" s":"Nessun mix verificato";
 $("livePill").textContent=active?"In corso":live?d.enabled?"In ascolto":"Mix spento":"Offline";
 $("livePill").className="pill"+(!live?" amber":"");
 $("liveDetail").textContent=live?d.mobileMixLastBlocker||d.lastTickFailure||"Dati letti dal player attivo":"Questo dispositivo non sta inviando dati";
 $("statusEngine").textContent=live?(d.enabled?"Smart Mix attivo":"Smart Mix disattivato"):"Non collegato";
 $("statusShuffle").textContent=live?(d.shuffleSearch?.reason|| (d.shuffleBusy?"Analisi in corso":"In attesa")):"Non disponibile";
 $("statusBuffer").textContent=live?(fmt(d.bufferedAhead)+" s · "+String(d.playerReadyState??"—")+"/4"):"Non disponibile";
 $("statusVocal").textContent=live?(d.lastVoiceAt!=null?"Voce fino a "+fmt(d.lastVoiceAt)+" s":d.lastLyricAt!=null?"LRC fino a "+fmt(d.lastLyricAt)+" s":"Evidenza insufficiente"):"Da verificare";
 const health=(!state.index?0:50)+(live?20:0)+(d.enabled?10:0)+(d.analysisReady?10:0)+(d.deepIndexLoaded?10:0);
 $("healthScore").textContent=state.index?health+"%":"—";
 $("healthRing").style.background="conic-gradient(#a58bfa "+Math.round(3.6*health)+"deg,#232a42 0deg)";
 $("healthTitle").textContent=active?"Mix in esecuzione":live?"Telemetria attiva":state.index?"Indice pronto":"Monitor non collegato";
 $("healthBody").textContent=active?"Il player segnala un mix effettivamente avviato.":live?"Controlli dal dispositivo "+platformLabel(state.device)+". Il punteggio è disponibilità dati, non qualità audio.":"Apri Music Box su "+platformLabel(state.device)+" per ricevere eventi dal player.";
 renderEventList($("overviewEvents"),state.events.filter(e=>e.device===state.device).slice(-4).reverse(),4);
 if(state.view==="tests")renderTests();
}
function renderEventList(el,items,limit){
 if(!el)return;
 if(!items.length){el.innerHTML='<p class="empty">Nessun evento registrato per '+platformLabel(state.device)+'.</p>';return}
 el.innerHTML=items.slice(0,limit||1000).map(e=>'<div class="event"><span class="event-dot '+esc(e.type)+'"></span><div class="event-body"><strong>'+esc(e.title)+'</strong><span>'+esc(e.detail)+'</span></div><time>'+esc(ago(e.ts))+'</time></div>').join("");
}
function renderEvents(){
 let rows=state.events.filter(e=>e.device===state.device).slice().reverse();
 const filter=$("eventFilter").value;
 if(filter!=="all")rows=rows.filter(e=>e.type===filter);
 $("eventCount").textContent=rows.length+" eventi";
 renderEventList($("eventsFeed"),rows,400);
}
function renderLibrary(){
 const q=$("librarySearch").value.toLocaleLowerCase("it").trim();
 const filter=$("libraryFilter").value;
 const filtered=state.rows.filter(r=>(!q||(r.title+" "+r.artist+" "+r.file+" "+r.id).toLocaleLowerCase("it").includes(q))&&(filter==="all"||(filter==="ok"?r.info?.status==="ok":r.info?.status!=="ok")));
 const maxPage=Math.max(0,Math.ceil(filtered.length/50)-1);state.page=Math.min(state.page,maxPage);
 const shown=filtered.slice(state.page*50,(state.page+1)*50);
 $("libraryCount").textContent=filtered.length.toLocaleString("it-IT")+" risultati";
 $("libraryRows").innerHTML=shown.map(r=>{
  const m=r.info||{},ok=m.status==="ok";
  return '<tr><td><span class="row-title">'+esc(r.title||r.file)+'</span><span class="row-sub">'+esc(r.artist||r.file||r.id)+'</span></td>'+
   '<td class="mono">'+esc(m.bpm?fmt(m.bpm):"—")+'</td><td><span class="mini-tag purple">'+esc(m.camelot?.code||"—")+'</span></td>'+
   '<td class="mono">'+esc(m.beatConfidence!=null?Math.round(m.beatConfidence*100)+"%":"—")+'</td>'+
   '<td class="mono">'+esc(m.safeIntroAt!=null?fmt(m.safeIntroAt)+" / "+fmt(m.safeOutroAt):"—")+'</td>'+
   '<td><span class="mini-tag '+(ok?"ok":"warn")+'">'+(ok?"Analizzato":"Da analizzare")+'</span></td>'+
   '<td><button class="text-button choose-track" data-file="'+esc(r.file||r.id)+'">Simula →</button></td></tr>';
 }).join("")||'<tr><td colspan="7" class="empty">Nessun brano corrisponde ai filtri.</td></tr>';
 $("libraryFooter").textContent=filtered.length?"Risultati "+(state.page*50+1)+"–"+Math.min(filtered.length,(state.page+1)*50)+" di "+filtered.length:"Nessun risultato";
 $("libraryPage").textContent=(state.page+1)+" / "+(maxPage+1);
 $("libraryPrev").disabled=state.page===0;$("libraryNext").disabled=state.page>=maxPage;
 document.querySelectorAll(".choose-track").forEach(el=>el.addEventListener("click",()=>{
  const row=findRow(el.dataset.file);if(row)$("fromQuery").value=queryLabel(row);
  changeView("transitions");toast("Seleziona il brano successivo per confrontarli");
 }));
}
function queryLabel(r){return (r.title||r.file)+" — "+(r.artist||r.file)+" ["+(r.id||r.file)+"]"}
function fillTracks(){
 const selected=state.rows.slice(0,3500);
 $("trackOptions").innerHTML=selected.map(r=>'<option value="'+esc(queryLabel(r))+'"></option>').join("");
}
function matchInput(input){
 const val=input.value.trim();if(!val)return null;
 const m=val.match(/\[([^\]]+)\]\s*$/);
 if(m){const exact=findRow(m[1]);if(exact)return exact}
 const exact=state.rows.find(r=>queryLabel(r)===val||r.file===val||r.id===val);
 if(exact)return exact;
 const q=val.toLocaleLowerCase("it");
 return state.rows.find(r=>(r.title||"").toLocaleLowerCase("it")===q)||
  state.rows.find(r=>(r.title||"").toLocaleLowerCase("it").includes(q))||null;
}
function gapBpm(a,b){
 const aa=Number(a?.bpm),bb=Number(b?.bpm);
 if(!(aa>0&&bb>0))return null;
 return Math.min(...[.5,1,2].map(scale=>Math.abs(aa-bb*scale)/Math.max(aa,bb*scale)));
}
function groove(a,b){
 const x=a?.outroGroove,y=b?.introGroove;
 if(!Array.isArray(x)||!Array.isArray(y)||x.length!==32||y.length!==32)return null;
 let best=-1,phase=0;
 for(let shift=0;shift<8;shift++){let dot=0,xx=0,yy=0;for(let i=0;i<32;i++){const p=Number(x[i])||0,q=Number(y[(i+shift)%32])||0;dot+=p*q;xx+=p*p;yy+=q*q}const s=dot/Math.sqrt(Math.max(1e-8,xx*yy));if(s>best){best=s;phase=shift}}
 return {score:Math.max(0,Math.min(1,(best+1)/2)),phase};
}
function camelotFit(a,b){
 if(!a||!b)return null;
 const x=String(a).match(/^(\d{1,2})([AB])$/),y=String(b).match(/^(\d{1,2})([AB])$/);
 if(!x||!y)return null;
 const diff=Math.min((Number(x[1])-Number(y[1])+12)%12,(Number(y[1])-Number(x[1])+12)%12);
 return x[1]===y[1]&&x[2]===y[2]?1:
 x[1]===y[1]&&x[2]!==y[2]?.8:
 diff===1&&x[2]===y[2]?.78:.15;
}
function estimatePair(from,to){
 const a=from?.info,b=to?.info;
 const reasons=[],g=gapBpm(a,b),gr=groove(a,b),fit=camelotFit(a?.camelot?.code,b?.camelot?.code);
 if(!a||!b||a.status!=="ok"||b.status!=="ok")reasons.push("Dati audio insufficienti: impossibile certificare il mix.");
 else{
  if(g===null)reasons.push("BPM non disponibili.");
  else if(g>.065)reasons.push("BPM non sufficientemente vicini, anche a metà/doppio tempo.");
  if(gr===null)reasons.push("Griglie ritmiche non confrontabili.");
  else if(gr.score<.70)reasons.push("Finale e intro non mostrano beat abbastanza coerenti.");
  if(fit!==null&&fit<.45)reasons.push("Chiavi Camelot poco compatibili.");
  if(a.protectedEnding)reasons.push("Finale musicale importante: vietato abbreviare senza prova vocale.");
  if(!Number.isFinite(a.lastVoiceAt)&&!Number.isFinite(a.lastLyricAt))reasons.push("Ultima frase vocale non verificata.");
  if(!Number.isFinite(b.firstVoiceAt)&&!Number.isFinite(b.firstLyricAt))reasons.push("Ingresso vocale del prossimo brano non verificato.");
 }
 if(!reasons.length)reasons.push("Dati compatibili come pre-selezione: serve il motore per certificare e avviare l'audio.");
 return {source:"index-estimate",device:state.device,from:{id:from?.id,title:from?.title,info:a},to:{id:to?.id,title:to?.title,info:b},
  groove:gr,tempoGap:g,camelotFit:fit,approved:null,certified:false,beatCertified:false,actual:false,cue:null,reasons};
}
async function inspect(from,to){
 const fallback=estimatePair(from,to);
 if(!from?.id||!to?.id||!state.channel)return fallback;
 const r=await request("inspect",{fromId:from.id,toId:to.id},2300);
 if(r&&r.source==="musicbox-engine"){
  return {...r,from:{...r.from,info:r.from?.info||from.info},to:{...r.to,info:r.to?.info||to.info}};
 }
 return fallback;
}
function rememberResult(r){state.lastResult=r;state.results.push({device:state.device,at:new Date().toISOString(),from:r.from?.id||r.from?.title,to:r.to?.id||r.to?.title,
 source:r.source,approved:r.approved,certified:r.certified,beatCertified:r.beatCertified,
 reasons:r.reasons?.slice(0,8)||[],cue:r.cue?{kind:r.cue.kind,begin:r.cue.begin,end:r.cue.end,fade:r.cue.fade}:null});
 state.results=state.results.slice(-400);renderOverview()}
function renderResult(r){
 const a=r.from?.info||{},b=r.to?.info||{},g=r.groove?.score,tempoGap=r.tempoGap;
 const certified=r.approved===true&&r.certified===true;
 const engine=r.source==="musicbox-engine";
 const title=certified?"Transizione certificata dal motore":engine?(r.approved?"Piano possibile, con condizioni":"Transizione rifiutata / fallback"):"Compatibilità indicativa";
 const cls=certified?"ok":engine&&r.approved===false?"warn":"purple";
 const badge=certified?"Beat / passaggio verificato":engine?"Risultato del motore":"Solo pre-valutazione";
 const notes=(r.reasons||[]).map(reason=>'<span class="reason '+(certified?"safe":"")+'">'+esc(reason)+'</span>').join("");
 const cue=r.cue||{};
 $("simResult").className="result-card";
 $("simResult").innerHTML='<div class="result-heading"><div><h3>'+esc(title)+'</h3><p>'+esc(r.from?.title||r.from?.id||"Uscita")+' → '+esc(r.to?.title||r.to?.id||"Ingresso")+' · '+(engine?"Analisi motore reale":"Confronto matematico su indice audio")+'</p></div><span class="mini-tag '+cls+'">'+badge+'</span></div>'+
  '<div class="result-grid"><div class="result-stat"><small>TEMPO</small><strong>'+esc(fmt(a.bpm))+' / '+esc(fmt(b.bpm))+'</strong></div>'+
  '<div class="result-stat"><small>CAMELOT</small><strong>'+esc(a.camelot?.code||"—")+' / '+esc(b.camelot?.code||"—")+'</strong></div>'+
  '<div class="result-stat"><small>GROOVE / BEAT</small><strong>'+(g!=null?Math.round(g*100)+"%":"—")+'</strong></div>'+
  '<div class="result-stat"><small>FINESTRA MIX</small><strong>'+esc(cue.fade!=null?fmt(cue.fade)+" s":"Nessuna")+'</strong></div></div>'+
  '<div class="result-timeline"><div><div class="wave-label"><span>OUTRO REALE</span><span>BEAT</span></div><div class="wavebox" id="resultOut"></div></div><div><div class="wave-label"><span>INTRO REALE</span><span>BEAT</span></div><div class="wavebox" id="resultIn"></div></div></div>'+
  '<div class="result-notes">'+(r.platformResults?'<span class="reason safe">PC: '+(r.platformResults.pc?.allowed?"piano consentito":"fallback")+"</span>"+'<span class="reason safe">iPhone: '+(r.platformResults.iphone?.allowed?"piano consentito":"fallback")+"</span>":"" )+(notes||'<span class="reason safe">Nessuna criticità riportata.</span>')+'</div>'+
  '<div class="monitor-foot"><span>'+esc(engine?"Certificazione riferita al dispositivo in cui il motore gira. La riproduzione reale va verificata a parte.":"La stima non garantisce sincronizzazione del beat, assenza di voce o possibilità di sovrapposizione.")+'</span><button class="text-button" id="savePairBaseline">Salva snapshot →</button></div>';
 drawWave($("resultOut"),a.outroWave,false,a.beatAnchor,a.bpm,a.duration,false);
 drawWave($("resultIn"),b.introWave,true,b.introBeat,b.bpm,b.duration,true);
 $("savePairBaseline")?.addEventListener("click",saveSnapshot);
}
async function simulate(){
 const a=matchInput($("fromQuery")),b=matchInput($("toQuery"));
 if(!a||!b){toast("Seleziona due brani validi");return}
 if(a.file===b.file||a.id&&a.id===b.id){toast("Il brano in entrata deve essere diverso");return}
 $("simulate").disabled=true;$("simulate").textContent="Analisi in corso…";
 const r=await inspect(a,b);rememberResult(r);renderResult(r);
 $("simulationSource").textContent=r.source==="musicbox-engine"?"Piano ottenuto dal motore reale · nessun audio riprodotto":"Stima basata sull'indice audio · apri Music Box per la certificazione";
 $("simulate").disabled=false;$("simulate").textContent="▶ Analizza transizione";
}
async function batch(){
 const list=state.rows.filter(x=>x.info?.status==="ok");
 if(list.length<2){toast("Indice audio insufficiente per i confronti");return}
 $("batchRun").disabled=true;$("batchResults").innerHTML='<p class="empty">Analisi delle coppie in corso…</p>';
 const result=[];
 for(let i=0;i<12;i++){
  const a=list[Math.floor(Math.random()*list.length)];
  let b=list[Math.floor(Math.random()*list.length)];
  if(a===b)b=list[(list.indexOf(a)+1)%list.length];
  // Each comparison uses measurements; it never starts playback.
  const r=await inspect(a,b);result.push({a,b,r});rememberResult(r);
 }
 state.batch=result;
 $("batchResults").innerHTML=result.map(x=>'<div class="batch-row"><strong>'+esc(x.a.title)+' → '+esc(x.b.title)+'</strong><span>'+esc(x.r.groove?.score!=null?Math.round(x.r.groove.score*100)+"% groove":"Groove non disponibile")+'</span><span class="mini-tag '+(x.r.source==="musicbox-engine"?(x.r.beatCertified?"ok":"warn"):"purple") +'">'+(x.r.beatCertified?"Beat certificato":x.r.source==="musicbox-engine"?"Motore / fallback":"Stima")+"</span></div>").join("");
 $("batchRun").disabled=false;
 toast("12 coppie valutate; il motore certifica solo quelle supportate");
}
const autoDefs=[
 {id:"shuffleConflict",title:"Smart Mix non invade la coda manuale",desc:"La scelta automatica deve rispettare i brani aggiunti manualmente."},
 {id:"noRepeat",title:"Nessun brano già riprodotto riscelto",desc:"Controllo di ripetizioni nella stessa sequenza casuale monitorata."},
 {id:"beatMatch",title:"Beat e fase realmente compatibili",desc:"BPM simili da soli non certificano il beatmatch."},
 {id:"vocalSafety",title:"Niente tagli su frasi vocali",desc:"Controllo dei confini di voce/LRC e del punto d'ingresso previsto."},
 {id:"safeFallback",title:"Fallback sicuro senza prova sufficiente",desc:"Se il mix non è affidabile, il player deve mantenere il brano integro."},
 {id:"iphonePlayback",title:"Avvio del mix su Safari iPhone",desc:"Verifica blocchi WebAudio, anteprima pronta e clock."}
];
const mobileDefs=[
 {id:"mixNotStarting",title:"Smart Mix non parte",desc:"Avvia due brani compatibili su iPhone a schermo acceso e controlla se il secondo audio inizia."},
 {id:"restartZero",title:"Nuovo brano che riparte da zero",desc:"Durante il passaggio, verifica che barra temporale e audio rimangano sincronizzati."},
 {id:"slowSeek",title:"Seek lento o bloccato",desc:"Sposta la barra in più punti; registra quanto dura l'operazione."},
 {id:"backgroundPlayback",title:"Riproduzione a schermo bloccato",desc:"Blocca l'iPhone e verifica audio, play/pausa delle cuffie e ripresa."},
 {id:"iosOverlap",title:"Sovrapposizione effettivamente udibile",desc:"Confronta la sovrapposizione percepita con quella prevista dal piano."}
];
function computeChecks(){
 const live=qualityState(),d=live?.diagnostics||{},events=state.events.filter(x=>x.device===state.device);
 const seq=events.filter(x=>x.type==="track"&&x.detail.includes("[auto]")).map(x=>x.trackId).filter(Boolean);
 const dup=events.filter(x=>x.type==="issue"&&/ripetut|duplicat|shuffle/i.test(x.title+" "+x.detail));
 const conflicts=events.filter(x=>x.type==="issue"&&/coda manuale|conflitto shuffle/i.test(x.title+" "+x.detail));
 const overlap=events.filter(x=>x.type==="overlap");
 const result=state.lastResult?.device===state.device?state.lastResult:null;
 const tests={};
 tests.shuffleConflict={status:conflicts.length?"fail":d.shuffleState&&d.shuffleState.manualCount>0&&!d.shuffleSearch?.chosen?"pass":"pending",detail:conflicts.length?"Conflitto registrato nella timeline":d.shuffleState?"Coda manuale: "+d.shuffleState.manualCount+" · reorder utente: "+Boolean(d.shuffleState.userReordered):"Serve una sessione con coda casuale attiva"};
 tests.noRepeat={status:dup.length?"fail":seq.length>=3&&new Set(seq).size===seq.length?"pass":"pending",detail:dup.length?"Possibile ripetizione rilevata":seq.length+" cambi automatici osservati"};
 tests.beatMatch={status:result&&result.source==="musicbox-engine"?(result.beatCertified?"pass":result.approved===false?"pending":"pending"):"pending",detail:result?.source==="musicbox-engine"?(result.beatCertified?"Beat verificati dal motore":"Piano non certificato come beatmatch"):"Simula una coppia con il motore collegato"};
 tests.vocalSafety={status:result?.source==="musicbox-engine"?(result.vocalSafe===true?"pass":result.vocalSafe===false?"fail":"pending"):"pending",detail:result?.source==="musicbox-engine"?(result.vocalSafe===true?"Confine voce rispettato":result.vocalSafe===false?"Potenziale violazione: ispezionare il piano":"Evidenza vocale incompleta"):"Dati vocali non ancora verificati"};
 tests.safeFallback={status:result?.source==="musicbox-engine"&&result.approved===false&&(!result.cue||result.cue.kind==="cut")?"pass":"pending",detail:"In assenza di prove, non deve partire una sovrapposizione forzata"};
 tests.iphonePlayback={status:state.device==="iphone"?(d.liveTransition?"pass":d.mobileMixLastBlocker?"fail":"pending"):"pending",detail:state.device==="iphone"?(d.mobileMixLastBlocker||"Avvia una sessione Smart Mix su iPhone"):"Controllo disponibile sul dispositivo iPhone"};
 return tests;
}
function renderTests(){
 const checks=computeChecks();state.checks=checks;
 let pass=0,pending=0,fail=0;
 $("autoTests").innerHTML=autoDefs.map(def=>{
  const c=checks[def.id]||{status:"pending",detail:"Dati non disponibili"};if(c.status==="pass")pass++;else if(c.status==="fail")fail++;else pending++;
  return '<div class="test-row"><span class="test-status '+c.status+'">'+(c.status==="pass"?"✓":c.status==="fail"?"!":"?")+'</span><div class="test-description"><strong>'+esc(def.title)+'</strong><p>'+esc(def.desc)+'</p><em>'+esc(c.detail)+'</em></div></div>'
 }).join("");
 $("mobileTests").innerHTML=mobileDefs.map(def=>{
  const m=state.manual[state.device+":"+def.id]||{},s=m.status||"pending";
  if(s==="pass")pass++;else if(s==="fail")fail++;else pending++;
  return '<div class="test-row"><span class="test-status '+s+'">'+(s==="pass"?"✓":s==="fail"?"!":"?")+'</span><div class="test-description"><strong>'+esc(def.title)+'</strong><p>'+esc(def.desc)+'</p><em>'+(m.at?"Verificato "+esc(ago(m.at))+" su "+esc(platformLabel(state.device)):"Non testato su questo dispositivo")+'</em></div><div class="test-actions"><button data-manual="'+esc(def.id)+'" data-status="pass">OK</button><button data-manual="'+esc(def.id)+'" data-status="fail">Bug</button><button data-manual="'+esc(def.id)+'" data-status="pending">↺</button></div></div>';
 }).join("");
 $("testsPass").textContent=pass;$("testsPending").textContent=pending;$("testsFail").textContent=fail;
 document.querySelectorAll("[data-manual]").forEach(b=>b.addEventListener("click",()=>{
  const id=b.dataset.manual,status=b.dataset.status;
  state.manual[state.device+":"+id]={status,at:new Date().toISOString(),version:state.version};
  write("manual",state.manual);renderTests();
  if(status==="fail")addEvent({id:"manual-"+Date.now()+"-"+id,type:"issue",device:state.device,title:"Bug verificato: "+(mobileDefs.find(x=>x.id===id)?.title||id),detail:"Segnalazione manuale · versione "+state.version,ts:new Date().toISOString()});
  toast(status==="pending"?"Test azzerato":status==="pass"?"Test segnato OK":"Bug registrato");
 }));
}
function currentStats(device){
 const list=state.events.filter(e=>e.device===device);
 const checks=computeChecks();
 const manual=mobileDefs.map(t=>state.manual[device+":"+t.id]?.status||"pending");
 return {device,analyzed:state.index?.analyzed||0,checks:state.results.filter(r=>r.device===device).length,
  overlaps:list.filter(e=>e.type==="overlap").length,issues:list.filter(e=>e.type==="issue").length,
  trackChanges:list.filter(e=>e.type==="track").length,mobilePass:manual.filter(v=>v==="pass").length,
  mobileFail:manual.filter(v=>v==="fail").length};
}
function saveSnapshot(){
 const snap={id:"snap-"+Date.now()+"-"+Math.random().toString(36).slice(2,5),at:new Date().toISOString(),
 label:"Music Box "+state.version+" · "+platformLabel(state.device),version:state.version,device:state.device,
 stats:currentStats(state.device),tests:structuredCopy(state.manual),lastResult:state.lastResult?{
  source:state.lastResult.source,from:state.lastResult.from?.id,to:state.lastResult.to?.id,
  approved:state.lastResult.approved,beatCertified:state.lastResult.beatCertified,reasons:state.lastResult.reasons,
  cue:state.lastResult.cue}:null};
 state.snapshots.push(snap);state.snapshots=state.snapshots.slice(-50);write("snapshots",state.snapshots);
 renderSnapshots();toast("Snapshot salvato. Confrontalo dopo la modifica.");
}
function structuredCopy(o){return JSON.parse(JSON.stringify(o||{}))}
function renderSnapshots(){
 const list=state.snapshots.slice().reverse();
 const options=list.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.label+" · "+new Date(s.at).toLocaleDateString("it-IT")+' '+new Date(s.at).toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}))+'</option>').join("");
 const before=$("beforeSelect").value,after=$("afterSelect").value;
 $("beforeSelect").innerHTML='<option value="">Seleziona baseline</option>'+options;
 $("afterSelect").innerHTML='<option value="">Seleziona versione successiva</option>'+options;
 if(list.some(x=>x.id===before))$("beforeSelect").value=before;
 else if(list.length>=2)$("beforeSelect").value=list[1].id;
 if(list.some(x=>x.id===after))$("afterSelect").value=after;
 else if(list.length)$("afterSelect").value=list[0].id;
 $("snapshotList").innerHTML=list.map(s=>'<div class="snapshot-item"><div><strong>'+esc(s.label)+'</strong><span>'+esc(new Date(s.at).toLocaleString("it-IT"))+' · '+esc(s.device)+' · '+(s.stats?.checks||0)+' prove</span></div><button data-remove="'+esc(s.id)+'">Elimina</button></div>').join("")||'<p class="empty">Nessuno snapshot salvato.</p>';
 document.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{state.snapshots=state.snapshots.filter(s=>s.id!==b.dataset.remove);write("snapshots",state.snapshots);renderSnapshots();toast("Snapshot rimosso")}));
}
function compareSnapshots(){
 const before=state.snapshots.find(s=>s.id===$("beforeSelect").value),after=state.snapshots.find(s=>s.id===$("afterSelect").value);
 if(!before||!after){toast("Scegli due snapshot");return}
 const measures=[["Brani analizzati","analyzed"],["Coppie valutate","checks"],["Mix reali","overlaps"],["Anomalie","issues"],["Bug mobile","mobileFail"],["Test mobile OK","mobilePass"]];
 $("comparison").innerHTML='<div class="panel-heading"><div><span class="section-kicker">DELTA / REGRESSION</span><h2>'+esc(before.label)+' → '+esc(after.label)+'</h2></div></div><div class="compare-grid">'+measures.map(([name,k])=>{
  const x=Number(before.stats?.[k]||0),y=Number(after.stats?.[k]||0),delta=y-x;
  const good=k==="issues"||k==="mobileFail"?delta<0:delta>0;
  return '<div class="compare-tile"><span>'+esc(name)+'</span><strong>'+y+'</strong><small class="'+(delta===0?"":good?"positive":"negative")+'">'+(delta>0?"+":"")+delta+' rispetto a '+x+'</small></div>';
 }).join("")+'</div><p class="compare-note">I conteggi riflettono le sessioni monitorate e possono variare per durata e dispositivo. Una riduzione dei bug è significativa solo se lo stesso test è stato ripetuto nelle stesse condizioni. Nessuna valutazione acustica è stata inventata.</p>';
}
function exportReport(){
 const obj={schema:"musicbox-smartmix-lab-v1",exportedAt:new Date().toISOString(),version:state.version,device:state.device,
 index:{analyzed:state.index?.analyzed||0,total:state.index?.sourceCount||0},events:state.events,snapshots:state.snapshots,
 manual:state.manual,results:state.results};
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;
 link.download="music-box-smart-mix-"+state.device+"-"+new Date().toISOString().slice(0,10)+".json";link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1200);toast("Report esportato sul dispositivo");
}
async function importReport(file){
 try{
  if(!file||file.size>15*1024*1024)throw Error("File assente o troppo grande");
  const obj=JSON.parse(await file.text());
  if(obj?.schema!=="musicbox-smartmix-lab-v1")throw Error("Formato non riconosciuto");
  for(const e of (Array.isArray(obj.events)?obj.events:[]).slice(-650))addEvent(e);
  const ids=new Set(state.snapshots.map(s=>s.id));
  for(const s of (Array.isArray(obj.snapshots)?obj.snapshots:[]).slice(-50)){
   if(typeof s.id!=="string"||ids.has(s.id))continue;
   state.snapshots.push(s);ids.add(s.id);
  }
  if(obj.manual&&typeof obj.manual==="object")state.manual={...state.manual,...obj.manual};
  if(Array.isArray(obj.results))state.results=[...state.results,...obj.results.slice(-250)].slice(-400);
  write("snapshots",state.snapshots);write("manual",state.manual);renderAll();toast("Report "+platformLabel(obj.device)+" importato");
 }catch(e){toast("Importazione fallita: "+String(e?.message||e))}
}
function renderAll(){renderOverview();if(state.view==="library")renderLibrary();if(state.view==="events")renderEvents();if(state.view==="tests")renderTests();if(state.view==="compare")renderSnapshots()}
function wire(){
 document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>changeView(b.dataset.view)));
 document.querySelectorAll(".jump").forEach(b=>b.addEventListener("click",()=>changeView(b.dataset.target)));
 document.querySelectorAll("[data-device]").forEach(b=>b.addEventListener("click",()=>changeDevice(b.dataset.device)));
 $("mobileNav").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
 $("refresh").addEventListener("click",()=>{loadIndex(true);broadcast({type:"status-request"});broadcast({type:"catalog-request"})});
 $("libraryRefresh").addEventListener("click",()=>loadIndex(true));
 ["librarySearch","libraryFilter"].forEach(id=>$(id).addEventListener(id==="librarySearch"?"input":"change",()=>{state.page=0;renderLibrary()}));
 $("libraryPrev").addEventListener("click",()=>{state.page--;renderLibrary()});
 $("libraryNext").addEventListener("click",()=>{state.page++;renderLibrary()});
 $("simulate").addEventListener("click",simulate);
 $("randomPair").addEventListener("click",()=>{
  const rows=state.rows.filter(r=>r.info?.status==="ok");if(rows.length<2)return toast("Indice audio non pronto");
  const a=rows[Math.floor(Math.random()*rows.length)],b=rows[Math.floor(Math.random()*rows.length)];
  $("fromQuery").value=queryLabel(a);$("toQuery").value=queryLabel(b===a?rows[(rows.indexOf(a)+1)%rows.length]:b);
 });
 const swap=()=>{const a=$("fromQuery").value;$("fromQuery").value=$("toQuery").value;$("toQuery").value=a};
 $("swapPair").addEventListener("click",swap);$("swapPair").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();swap()}});
 $("batchRun").addEventListener("click",batch);
 $("eventFilter").addEventListener("change",renderEvents);
 $("clearEvents").addEventListener("click",()=>{state.events=state.events.filter(e=>e.device!==state.device);write("events",state.events);renderAll();toast("Eventi locali eliminati per "+platformLabel(state.device))});
 $("runChecks").addEventListener("click",()=>{renderTests();toast("Controlli rivalutati. Le prove iPhone richiedono il dispositivo reale.")});
 $("compareNow").addEventListener("click",compareSnapshots);
 $("saveSnapshot").addEventListener("click",saveSnapshot);
 $("importBtn").addEventListener("click",()=>$("importFile").click());
 $("importFile").addEventListener("change",e=>{const f=e.target.files?.[0];if(f)importReport(f);e.target.value=""});
 for(const id of ["export1","export2"])$(id).addEventListener("click",exportReport);
}
wire();connect();changeDevice(state.device);mergeCatalog();loadVersion();loadIndex(false);
setInterval(()=>{if(state.channel){broadcast({type:"status-request"});if(!state.catalog.length)broadcast({type:"catalog-request"})}renderOverview()},3000);
})();
