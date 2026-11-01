/* Music Box · ascolto condiviso. Questo modulo non legge password o dati palestra.
 * Ogni stanza dura 12 ore e richiede un invito con token crittografico. */
(function(){
"use strict";
const ENDPOINT="https://adnteitlhopehllutlua.supabase.co/functions/v1/musicbox-listen-together";
const $=id=>document.getElementById(id);
const bridge=()=>window.MusicBoxBridge;
let creds=null,room=null,invitation=null,inviteUrl="",busy=false,localPlay=false,lastRevision=0;
let applying=false,suppressEventsUntil=0,attachedAudio=null,needsGesture=false;
let commandChain=Promise.resolve();
// L'ultimo comando Play/Pausa prevale immediatamente sul polling.
let pendingPlayback=null,playbackSequence=0;
const shouldPlay=()=>pendingPlayback?.id===creds?.id?
  pendingPlayback.playing:Boolean(room?.playing);
const suppress=()=>{suppressEventsUntil=Date.now()+650;};
// I comandi intenzionali non devono essere bloccati dalla breve protezione
// contro gli eventi echo (play/seek) prodotti dal server.
const isApplying=()=>applying;
const isRemoteEvent=()=>applying||Date.now()<suppressEventsUntil;
function status(msg){const el=$("stanzaStato");if(el)el.textContent=msg;}
function tell(msg){if(bridge()?.toast)bridge().toast(msg);else status(msg);}
function available(){
 const app=bridge();if(!app)return [];
 const profile=app.profile();
 // Un filtro o una playlist possono escludere il brano che l'host sta
 // ascoltando: includilo, altrimenti il guest partirebbe su un altro brano.
 const playing=app.allTracks()?.find(t=>t?.id===app.currentId()&&t.source!=="stanza-condivisa");
 const list=[...(app.playable()||[])];
 if(playing&&!list.some(t=>t.id===playing.id))list.push(playing);
 return list.filter(t=>{
   if(!t||!t.url)return false;
   const f=String(t.file||"");
   if(/^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(f))return true;
   return /^cloud\/youtube-[A-Za-z0-9_-]{11}\.mp3$/.test(f) &&
     /^https:\/\/adnteitlhopehllutlua\.supabase\.co\/functions\/v1\/musicbox-import-queue\?action=audio&id=[0-9a-f-]{36}$/i.test(String(t.url));
  }).map(t=>({profile:t.profile||profile,file:t.file,title:t.title,
     artist:t.artist||"",...(t.source==="cloud-audio"?{url:t.url}:{})}));
}
async function request(body){
 const res=await fetch(ENDPOINT,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 let result;try{result=await res.json()}catch(e){throw Error("Il cloud non risponde correttamente")}
 if(!res.ok||!result.ok)throw Error(String(result.error||"Connessione non riuscita"));
 return result;
}
function save(){try{localStorage.setItem("mb.stanza.v1",creds?JSON.stringify(creds):"")}catch(e){}}
function roomTrack(item){return "stanza-"+String(item.key||item.file||"").replace(/[^a-zA-Z0-9_-]/g,"_");}
function registerTracks(){
 if(!room?.playlist)return;
 const app=bridge(),tracks=app?.allTracks();if(!tracks)return;
 // Evita O(braniStanza × braniLibreria) ad ogni polling: con 2000 brani
 // il vecchio tracks.some() ripeteva milioni di confronti.
 const known=new Map(tracks.map(t=>[t.id,t]));
 for(const item of room.playlist){
  const file=String(item.file||"");
  const cloud=/^cloud\/youtube-[A-Za-z0-9_-]{11}\.mp3$/.test(file);
  if(!cloud&&!/^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(file))continue;
  if(cloud&&!/^https:\/\/adnteitlhopehllutlua\.supabase\.co\/functions\/v1\/musicbox-import-queue\?action=audio&id=[0-9a-f-]{36}$/i.test(String(item.url||"")))continue;
  const id=roomTrack(item);
  if(known.has(id)){
   const track=known.get(id);
   if(track?.source==="stanza-condivisa"){
    track.addedBy=String(item.addedBy||item.profile||"");
    track.ownerAccounts=Array.isArray(item.ownerAccounts)?item.ownerAccounts:[item.profile];
   }
   continue;
  }
  known.set(id,null);
  tracks.push({id,file:item.file,profile:item.profile||app.profile(),title:String(item.title||"Brano"),
   artist:String(item.artist||""),addedBy:String(item.addedBy||item.profile||""),
   ownerAccounts:Array.isArray(item.ownerAccounts)?item.ownerAccounts:[item.profile],
   url:cloud?item.url:app.urlForFile(item.file),
   source:"stanza-condivisa",builtin:true,gradient:"linear-gradient(150deg,#623cbd,#1f2135)"});
 }
}
function selected(){
 if(!room||!room.joined||!Array.isArray(room.playlist))return null;
 return room.playlist[Number(room.currentIndex)||0]||null;
}
function sameProfile(){
 if(!creds||!room)return true;
 const expected=creds.profile||(creds.role==="host"?room.hostProfile:room.guestProfile);
 const roster=Array.isArray(room.participants)?room.participants:[];
 const profiles=Array.isArray(room.participantProfiles)?room.participantProfiles:[];
 const present=!roster.length||(creds.memberName?
   roster.includes(creds.memberName):profiles.length?profiles.includes(expected):true);
 return present&&(!expected||String(expected)===String(bridge()?.profile()||""));
}

/* Coda collaborativa della stanza: usa sempre le chiavi autorizzate dal server. */
let catalog=[],catalogFor="",catalogBusy=false,drawnRevision=-1;
function nextItems(){
 if(!room?.joined||!room.playlist?.length)return [];
 const i=Number(room.currentIndex)||0;
 return [...room.playlist.slice(i+1),...room.playlist.slice(0,i)];
}
function snapshot(){
 const app=bridge(),a=app?.audio(),t=app?.allTracks()?.find(t=>t.id===app.currentId());
 const isSource=!!t&&t.source!=="stanza-condivisa"&&
  (/^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(String(t.file||""))||
   /^cloud\/youtube-[A-Za-z0-9_-]{11}\.mp3$/.test(String(t.file||"")));
 return {currentKey:isSource?String(t.profile||app.profile())+":"+String(t.file):"",
  playing:!!a&&!a.paused&&!a.ended,seconds:Math.max(0,Number(a?.currentTime)||0)};
}
async function hostSync(){
 if(creds?.role!=="host"||room?.joined)return;
 const activeId=creds.id,activeToken=creds.token;
 const x=snapshot(),t=room?.playlist?.[Number(room.currentIndex)||0];
 if(!x.currentKey||!room.playlist.some(t=>t.key===x.currentKey))return;
 const at=(Number(room.offset)||0)+(room.playing&&room.startedAt?
   Math.max(0,(Date.now()-Date.parse(room.startedAt))/1000):0);
 if(t?.key===x.currentKey&&!!room.playing===x.playing&&Math.abs(at-x.seconds)<3.5)return;
 try{
  const res=await request({action:"host-sync",id:creds.id,token:creds.token,...x});
  if(creds?.id===activeId&&creds?.token===activeToken&&room?.id===activeId&&
      res.room&&Number(res.room.revision)>=Number(room.revision)){
   room=res.room;lastRevision=0;
  }
 }catch(e){if(!/Room changed/.test(e.message))console.warn("Stanza:",e.message)}
}
async function fetchCatalog(){
 if(!creds||!room?.joined)return;
 const marker=creds.id+":"+(room.participants||[room.hostProfile,room.guestProfile]).join("|");
 if(catalogFor===marker||catalogBusy)return;
 catalogBusy=true;
 try{
  const result=await request({action:"catalog",id:creds.id,token:creds.token});
  if(!creds||!room?.joined||
      creds.id+":"+(room.participants||[room.hostProfile,room.guestProfile]).join("|")!==marker)return;
  catalog=Array.isArray(result.catalog)?result.catalog:[];
  catalogFor=marker;drawnRevision=-1;draw();
 }catch(e){status("Catalogo stanza: "+e.message)}
 finally{catalogBusy=false}
}
function findKey(id){
 const item=room?.playlist?.find(t=>roomTrack(t)===id);
 if(item)return item.key;
 const t=bridge()?.allTracks()?.find(t=>t.id===id);
 if(!t)return "";
 const key=String(t.profile||bridge().profile())+":"+String(t.file||"");
 return catalog.some(t=>t.key===key)||room?.playlist?.some(t=>t.key===key)?key:"";
}
function enqueue(id,front=false){
 if(!isActive())return false;
 const key=findKey(id);
 if(!key){tell("Questo brano non è nel catalogo della stanza.");return true;}
 control("queue-add",{key,position:front?"next":"end"});return true;
}
function queueAction(id,action){
 if(!isActive())return false;
 const key=findKey(id);if(!key)return false;
 if(action==="remove")control("queue-remove",{key});
 if(action==="up"||action==="down")control("queue-move",{key,delta:action==="up"?-1:1});
 return true;
}
function button(label,description,fn){
 const el=document.createElement("button");el.type="button";el.textContent=label;
 el.title=description;el.setAttribute("aria-label",description);el.addEventListener("click",fn);
 return el;
}
function ownerLabel(t){
 const accounts=[...new Set((Array.isArray(t.ownerAccounts)?t.ownerAccounts:[])
   .concat(t.profile||[]).map(x=>String(x||"").trim()).filter(Boolean))];
 return "Account: "+(accounts.length?accounts.join(", "):"non indicato");
}
function songRow(t,actions,number){
 const row=document.createElement("div");row.className="stanza-queue-row";
 const info=document.createElement("span");info.className="stanza-song";
 const title=document.createElement("strong");title.textContent=(number?number+". ":"")+(t.title||"Brano");
 const meta=document.createElement("small");
 meta.textContent=[t.artist,ownerLabel(t),t.addedBy?"Aggiunta da "+t.addedBy:""].filter(Boolean).join(" · ");
 info.append(title,meta);row.append(info,actions);return row;
}
function activityText(event){
 const act=String(event.action||"");
 const name=String(event.actor||"Partecipante");
 const track=event.title?(' “'+event.title+'”'):"";
 const verbs={
  create:"ha creato la stanza",join:"è entrato nella stanza",
  leave:"è uscito dalla stanza",play:"ha premuto Play",
  pause:"ha messo in Pausa",next:"è passato alla successiva",
  previous:"è tornato alla precedente",seek:"ha spostato la riproduzione",
  reshuffle:"ha rimescolato la coda",select:"ha scelto il brano"+track,
  "queue-add":"ha aggiunto in coda"+track,
  "queue-remove":"ha rimosso dalla coda"+track,
  "queue-move":"ha spostato nella coda"+track
 };
 const isSongAction=["queue-add","queue-remove","queue-move","select","next","previous"].includes(act);
 const owners=Array.isArray(event.ownerAccounts)?event.ownerAccounts.filter(Boolean):[];
 const origin=event.source?String(event.source):"";
 const details=isSongAction&&event.title?
  " · Origine: "+(origin||"non indicata")+
  (owners.length?" · Account: "+owners.join(", "):""):"";
 return name+" "+(verbs[act]||"ha eseguito "+act)+details;
}
function renderActivity(){
 const root=$("stanzaActivityList");if(!root)return;
 root.replaceChildren();
 const items=Array.isArray(room?.activity)?room.activity:[];
 if(!items.length){root.textContent="Le azioni recenti del gruppo appariranno qui.";return;}
 for(const ev of [...items].reverse().slice(0,30)){
  const row=document.createElement("div");row.className="stanza-activity-item";
  const line=document.createElement("span");line.textContent=activityText(ev);
  const time=document.createElement("time");
  const parsed=Date.parse(ev.at);
  time.textContent=Number.isFinite(parsed)?new Date(parsed).toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}):"";
  if(ev.at)time.dateTime=ev.at;
  row.append(line,time);root.append(row);
 }
}
function searchSongs(){
 const container=$("stanzaRisultati");if(!container||!room?.joined)return;
 container.replaceChildren();
 const term=String($("stanzaCercaBrano")?.value||"").trim().toLocaleLowerCase("it");
 if(!term){container.textContent="Cerca un brano nelle librerie del gruppo per aggiungerlo alla coda.";return;}
 const matches=catalog.filter(t=>[t.title,t.artist,t.profile,t.addedBy,...(t.ownerAccounts||[])].join(" ").toLocaleLowerCase("it").includes(term));
 for(const t of matches.slice(0,14)){
  const actions=document.createElement("span");actions.className="stanza-queue-actions";
  actions.append(button("Dopo","Aggiungi dopo questo brano",()=>control("queue-add",{key:t.key,position:"next"})),
   button("+ Coda","Aggiungi in fondo alla coda",()=>control("queue-add",{key:t.key,position:"end"})));
  container.append(songRow(t,actions));
 }
 if(!matches.length)container.textContent=catalogBusy?"Sto caricando le librerie...":"Nessun risultato nella stanza.";
 if(matches.length>14){const hint=document.createElement("p");hint.className="stanza-hint";
  hint.textContent="Altri risultati: rendi la ricerca più specifica.";container.append(hint);}
}
function drawSharedQueue(){
 const area=$("stanzaQueueArea");if(!area)return;
 area.hidden=!isActive();
 const activity=$("stanzaActivity");
 if(activity)activity.hidden=!isActive();
 if(!isActive()||$("stanzaPanel")?.hidden)return;
 if(drawnRevision===Number(room.revision))return;
 drawnRevision=Number(room.revision);
 const list=$("stanzaCodaLista");if(!list)return;list.replaceChildren();
 const now=selected();
 if(now){const el=document.createElement("div");el.className="stanza-now";
  el.textContent="♫ Ora: "+now.title+" · "+(now.artist||now.profile)+
   " · "+ownerLabel(now)+(now.addedBy?" · Aggiunta da "+now.addedBy:"");list.append(el);}
 const next=nextItems();
 for(const [i,t] of next.slice(0,18).entries()){
  const actions=document.createElement("span");actions.className="stanza-queue-actions";
  const up=button("↑","Sposta prima",()=>control("queue-move",{key:t.key,delta:-1}));
  const down=button("↓","Sposta dopo",()=>control("queue-move",{key:t.key,delta:1}));
  up.disabled=i===0;down.disabled=i===next.length-1;
  actions.append(up,down,button("×","Rimuovi dalla coda",()=>control("queue-remove",{key:t.key})));
  list.append(songRow(t,actions,i+1));
 }
 if(next.length>18){const info=document.createElement("p");info.className="stanza-hint";
  info.textContent="Mostrati 18 brani su "+next.length+" in attesa.";list.append(info);}
 searchSongs();
 renderActivity();
}

function upcoming(limit=10){
 if(!creds||!room?.joined||!room.playlist?.length)return [];
 registerTracks();
 const list=room.playlist,count=list.length;
 const out=[];
 for(let i=1;i<=Math.min(limit,count-1);i++){
  const item=list[(Number(room.currentIndex||0)+i)%count];
  const t=bridge()?.allTracks()?.find(t=>t.id===roomTrack(item));
  if(t)out.push(t);
 }
 return out;
}
function draw(){
 if(!$("stanzaPanel"))return;
 const active=!!creds,joined=!!room?.joined;
 $("stanzaCrea").hidden=active||!!invitation;
 $("stanzaEntra").hidden=active||!invitation;
 $("stanzaCopia").hidden=!active||!inviteUrl;
 $("stanzaEsci").hidden=!active;
 $("stanzaAscolta").hidden=!joined||!needsGesture;
 $("stanzaPlay").textContent=shouldPlay()?"Pausa per entrambi":"Riprendi per entrambi";
 for(const id of ["stanzaPlay","stanzaNext","stanzaRimescola"])
  $(id).hidden=!joined;
 const people=room?.participants||[room?.hostProfile,room?.guestProfile].filter(Boolean);
 const count=Array.isArray(people)?people.length:0;
 const limit=Number(room?.maxParticipants)||8;
 const activity=$("stanzaActivity");if(activity)activity.hidden=!joined;
 $("stanzaInfo").textContent=invitation&&!active?
   "Invito a una stanza di gruppo. Entrando aggiungi i tuoi MP3 pubblicati e ti sincronizzi con gli altri.":
   active?"Stanza di gruppo ("+count+"/"+limit+"): "+(people.length?people.join(" · "):"in attesa")+
      ". Puoi inviare lo stesso link ad altri amici.":
   "Crea una stanza privata per massimo 8 persone. Tutti possono contribuire alla coda collaborativa.";
 if(active)status(joined?count+" partecipanti · "+(room.playlist?.length||0)+" brani · "+
   (needsGesture?"tocca Attiva audio una volta sul dispositivo":"sincronizzazione automatica attiva"):
   "Stanza creata, in attesa del secondo partecipante.");
 else if(invitation)status("Controlla il profilo attivo, poi premi Entra.");
 else status("La sessione parte solo quando premi Crea.");
 drawSharedQueue();
}
function open(){const el=$("stanzaPanel");if(!el)return;el.hidden=false;drawnRevision=-1;bridge()?.syncScroll?.();draw();}
function close(){if(!$("stanzaPanel"))return;$("stanzaPanel").hidden=true;bridge()?.syncScroll?.();}
async function create(){
 const songs=available();
 if(!songs.length){tell("Questa libreria non contiene MP3 online da condividere");return;}
 const btn=$("stanzaCrea");btn.disabled=true;
 try{
  const result=await request({action:"create",profile:bridge().profile(),tracks:songs,...snapshot()});
  creds={id:result.id,token:result.hostToken,guestToken:result.guestToken,
    role:"host",profile:bridge().profile()};
  inviteUrl=location.origin+location.pathname+"#musicbox-room="+result.id+"."+result.guestToken;
  invitation=null;localPlay=true;needsGesture=false;catalog=[];catalogFor="";drawnRevision=-1;save();await refresh();
  tell("Stanza creata: copia il link e invialo al tuo amico.");
 }catch(e){tell("Stanza: "+e.message)}
 finally{btn.disabled=false;draw()}
}
async function join(){
 if(!invitation)return;
 const songs=available();
 if(!songs.length){tell("Seleziona un account con MP3 pubblicati");return;}
 const b=$("stanzaEntra");b.disabled=true;
 try{
  const payload={action:"join",id:invitation.id,token:invitation.token,profile:bridge().profile(),tracks:songs};
  let result;
  try{result=await request(payload)}
  catch(e){if(!/Room changed/.test(e.message))throw e;result=await request(payload)}
  creds={...invitation,token:result.memberToken||invitation.token,
    role:result.memberToken?"member":"guest",profile:bridge().profile(),
    memberName:result.memberName||bridge().profile()};
  invitation=null;room=result.room;
  localPlay=true;needsGesture=false;catalog=[];catalogFor="";drawnRevision=-1;save();lastRevision=0;await refresh();
  tell("Sei nel gruppo ("+(room?.participants?.length||2)+"/8)! Coda e musica sincronizzate.");
 }catch(e){tell("Invito: "+e.message)}
 finally{b.disabled=false;draw()}
}
function reportPlaybackFailure(){
 if(!shouldPlay())return;
 needsGesture=true;draw();
 status("Il browser ha bloccato l'avvio audio: tocca Attiva audio una sola volta.");
}
function attachAudio(){
 const a=bridge()?.audio();
 if(!a||a===attachedAudio)return;
 attachedAudio=a;
 a.addEventListener("play",()=>{
  if(!isActive()||!room?.joined)return;
  // Il retry locale non deve annullare la pausa dell'intera stanza.
  if(!shouldPlay()){
   suppress();bridge()?.setRoomPlaybackIntent?.(false);
   try{a.pause()}catch(e){}
   return;
  }
  if(isRemoteEvent())return;
  needsGesture=false;
 });
 a.addEventListener("pause",()=>{
  if(!isActive()||isRemoteEvent()||document.hidden||a._mbCambioBrano||a.ended)return;
  if(shouldPlay())control("pause");
 });
 a.addEventListener("seeked",()=>{
  if(!isActive()||isRemoteEvent()||!room?.joined||!a.seekable?.length)return;
  if(shouldPlay()||room.offset>0)control("seek",{seconds:Math.max(0,a.currentTime||0)});
 });
}
async function apply(){
 if(!creds||!room?.joined)return;
 registerTracks();
 const t=selected(),app=bridge();if(!t||!app)return;
 const id=roomTrack(t);
 const secondsAt=()=>{
  if(pendingPlayback?.id===creds?.id&&!pendingPlayback.playing)
   return pendingPlayback.seconds;
  let seconds=Math.max(0,Number(room.offset)||0);
  if(shouldPlay()&&room.startedAt)
   seconds+=Math.max(0,(Date.now()-Date.parse(room.startedAt))/1000);
  return seconds;
 };
 let changed=false;
 applying=true;
 try{
  const activeId=creds.id,activeToken=creds.token;
  const want=shouldPlay();
  app.setRoomPlaybackIntent?.(want);
  if(app.currentId()!==id){
   suppress();changed=true;
   await app.play(id,want,secondsAt());
  }
  if(creds?.id!==activeId||creds?.token!==activeToken||!room?.joined)return;
  const a=app.audio();attachAudio();if(!a)return;
  if(a.readyState>=1){
   if(Math.abs((a.currentTime||0)-secondsAt())>2.3){
    suppress();changed=true;
    try{a.currentTime=secondsAt()}catch(e){}
   }
  }else if(a._mbRoomMetadataSeekFor!==id){
   a._mbRoomMetadataSeekFor=id;
   a.addEventListener("loadedmetadata",()=>{
    a._mbRoomMetadataSeekFor="";
    if(!isActive()||app.currentId()!==id||roomTrack(selected()||{})!==id)return;
    suppress();
    try{a.currentTime=secondsAt()}catch(e){}
   },{once:true});
  }
  if(!want&&!a.paused){suppress();changed=true;a.pause()}
  else if(want&&a.paused){
   suppress();changed=true;
   try{
    await app.playCurrent();
    // Alcuni player gestiscono internamente NotAllowedError.
    if(a.paused)setTimeout(()=>{if(isActive()&&shouldPlay()&&app.audio()===a&&a.paused)reportPlaybackFailure()},800);
    else needsGesture=false;
   }catch(e){reportPlaybackFailure();}
  }else if(want&&!a.paused)needsGesture=false;
 }finally{applying=false;if(changed)suppress();draw();}
}

async function refresh(){
 if(!creds||busy)return;
 const activeId=creds.id,activeToken=creds.token;
 const stillHere=()=>creds?.id===activeId&&creds?.token===activeToken;
 busy=true;
 try{
  // Risposta leggera quando la coda non e' cambiata: niente megabyte inutili.
  const response=await request({action:"state",id:activeId,token:activeToken,
    knownRevision:room?.id===activeId?Number(room.revision)||0:0});
  if(!stillHere())return;
  if(!response.unchanged){
   if(!response.room)return;
   // Una risposta di polling vecchia non puo' annullare un comando recente.
   if(room&&room.id===activeId&&Number(response.room.revision)<Number(room.revision))return;
   room=response.room;
  }
  if(!room||room.id!==activeId)return;
  if(!sameProfile()){
   leave();
   tell("Account cambiato: sei uscito dalla stanza per non mischiare gli ascolti.");
   return;
  }
  registerTracks();attachAudio();
  if(!room.joined)await hostSync();
  if(!stillHere()||!sameProfile())return;
  if(lastRevision!==room.revision){lastRevision=room.revision;bridge()?.refreshQueue();}
  await apply();
  if(!stillHere())return;
  if(room.joined)await fetchCatalog();
  if(stillHere()&&!$("stanzaPanel").hidden)draw();
 }catch(e){
  if(!stillHere())return;
  if(/Room not found or expired|Invitation not authorized/i.test(String(e.message||""))){
   // Il token personale puo' essere stato revocato dopo l'uscita;
   // non inviare un'altra notifica di leave con quel token.
   creds=null;room=null;pendingPlayback=null;save();draw();
   status("Stanza scaduta (12 ore). Creane una nuova e manda un nuovo invito.");
  }else if(!$("stanzaPanel").hidden)status("Connessione: "+e.message);
 }finally{busy=false}
}
function control(command,extra){
 if(!creds||!room?.joined)return Promise.resolve();
 const isPlayback=command==="pause"||command==="play";
 let seq=0;
 if(isPlayback){
  const want=command==="play",a=bridge()?.audio();
  seq=++playbackSequence;
  pendingPlayback={id:creds.id,seq,playing:want,
   seconds:Math.max(0,Number(a?.currentTime)||Number(room.offset)||0)};
  // L'effetto e' immediato, mentre il server conferma in seguito.
  bridge()?.setRoomPlaybackIntent?.(want);
  suppress();
  if(!want){
   if(a&&!a.paused)try{a.pause()}catch(e){}
  }else if(a?.paused&&bridge()?.currentId?.()===roomTrack(selected()||{})){
   // Play nello stesso gesto: necessario per Safari iOS.
   Promise.resolve(bridge()?.playCurrent?.()).catch(()=>{});
  }
  draw();
 }
 const action=async()=>{
  if(!creds||!room?.joined)return;
  if(!sameProfile()){leave();return;}
  const activeId=creds.id,activeToken=creds.token;
  const stillHere=()=>creds?.id===activeId&&creds?.token===activeToken;
  try{
   const payload={action:"control",command,id:activeId,token:activeToken,
     expectedRevision:room.revision,...(extra||{})};
   let response;
   try{response=await request(payload)}
   catch(e){
    if(!command.startsWith("queue-")||!/Queue changed/.test(e.message))throw e;
    const state=await request({action:"state",id:activeId,token:activeToken});
    if(!stillHere())return;
    if(!state.room)return;
    room=state.room;payload.expectedRevision=room.revision;response=await request(payload);
   }
   if(!stillHere())return;
   if(response.room&&(!room||Number(response.room.revision)>=Number(room.revision))){
    room=response.room;lastRevision=0;drawnRevision=-1;
    bridge()?.refreshQueue();draw();
   }
   // L'ACK precedente non deve interrompere il comando piu' recente.
   if(isPlayback&&pendingPlayback?.id===activeId&&pendingPlayback.seq===seq){
    pendingPlayback=null;
    bridge()?.setRoomPlaybackIntent?.(Boolean(room?.playing));
   }
   await refresh();
  }catch(e){
   if(!stillHere())return;
   if(isPlayback&&pendingPlayback?.id===activeId&&pendingPlayback.seq===seq){
    pendingPlayback=null;
    bridge()?.setRoomPlaybackIntent?.(Boolean(room?.playing));
   }
   tell("Sincronizzazione: "+e.message);
   await refresh();
  }
 };
 commandChain=commandChain.then(action,action);
 return commandChain;
}
function listen(){
 if(!room?.joined)return;
 const app=bridge(),t=selected();if(!app||!t)return;
 // Il play() locale avviene durante il gesto dell'utente, prima di qualsiasi
 // richiesta asincrona. Safari iOS può rifiutare un play solo dopo la rete.
 needsGesture=false;applying=true;
 const id=roomTrack(t),wasPlaying=shouldPlay();
 if(!wasPlaying)control("play");
 const elapsed=(Number(room.offset)||0)+(room.playing&&room.startedAt?
   Math.max(0,(Date.now()-Date.parse(room.startedAt))/1000):0);
 // Se il brano e' gia' caricato, non ricominciare da 0:00.
 const action=Promise.resolve(app.currentId()===id?
   (wasPlaying?app.playCurrent():null):app.play(id,true,elapsed));
 action.then(()=>{
  const a=app.audio();
  if(a?.paused)reportPlaybackFailure();
 }).catch(reportPlaybackFailure).finally(()=>{applying=false;suppress();draw()});
 draw();
}
function interceptTrack(id){
 if(!isActive()||isApplying())return false;
 const list=room.playlist||[];
 let index=list.findIndex(t=>roomTrack(t)===id);
 if(index<0){
  // Cliccare un brano nella libreria normale deve scegliere anche il brano
  // equivalente della stanza, non essere rifiutato perché l'id è sintetico.
  const track=bridge()?.allTracks()?.find(t=>t.id===id);
  if(track){
   index=list.findIndex(t=>String(t.file)===String(track.file)&&
    String(t.profile)===String(track.profile));
   if(index<0)index=list.findIndex(t=>String(t.file)===String(track.file));
  }
 }
 if(index<0){tell("Questo brano non è nella libreria condivisa.");return true;}
 control("select",{index});return true;
}

function leave(){
 // Informa gli altri membri e aggiorna i partecipanti sul server.
 // La richiesta non deve bloccare l'uscita locale.
 if(creds?.token&&room?.id){
  const req={action:"leave",id:creds.id,token:creds.token};
  request(req).catch(e=>{
   // Se due persone cambiano brano nello stesso istante, il database
   // risponde 409: riprova una volta, senza bloccare l'uscita locale.
   if(/Room changed/.test(String(e.message||"")))request(req).catch(()=>{});
  });
 }
 creds=null;room=null;invitation=null;inviteUrl="";localPlay=false;needsGesture=false;lastRevision=0;
 pendingPlayback=null;playbackSequence++;
 catalog=[];catalogFor="";drawnRevision=-1;save();
 // La riproduzione deve restare autonoma; nessuna risposta tardiva deve
 // ripristinare la stanza appena lasciata.
 bridge()?.refreshQueue();draw();tell("Hai lasciato la stanza");
}
function isActive(){return !!(creds&&room?.joined)}
function playPause(){
 if(!isActive())return;
 control(shouldPlay()?"pause":"play");
}
function start(){
 if(!$("btnAscoltoCondiviso"))return;
 $("btnAscoltoCondiviso").addEventListener("click",()=>{bridge()?.closeOther?.();open()});
 $("stanzaClose").addEventListener("click",close);
 $("stanzaPanel").addEventListener("click",e=>{if(e.target===$("stanzaPanel"))close()});
 $("stanzaCrea").addEventListener("click",create);
 $("stanzaEntra").addEventListener("click",join);
 $("stanzaCopia").addEventListener("click",async()=>{
  if(!inviteUrl)return;
  try{await navigator.clipboard.writeText(inviteUrl);tell("Invito copiato")}
  catch(e){window.prompt("Copia questo link",inviteUrl)}
 });
 $("stanzaAscolta").textContent="▶ Attiva audio sul dispositivo";
 $("stanzaAscolta").addEventListener("click",listen);
 $("stanzaPlay").addEventListener("click",playPause);
 $("stanzaNext").addEventListener("click",()=>control("next"));
 $("stanzaRimescola").addEventListener("click",()=>control("reshuffle"));
  $("stanzaCercaBrano")?.addEventListener("input",searchSongs);
  $("stanzaEsci").addEventListener("click",leave);
 // Capture intercetta i controlli principali mentre la stanza e' aperta,
 // per impedire che partano due canzoni diverse sui due dispositivi.
 for(const [id,cmd] of [["btnNext","next"],["btnPrev","previous"],
   ["btnShuffle","reshuffle"],["btnCasuale","reshuffle"]]){
  $(id).addEventListener("click",e=>{
   if(!isActive())return;
   e.preventDefault();e.stopImmediatePropagation();control(cmd);
  },true);
 }
 $("btnPlay").addEventListener("click",e=>{
  if(!isActive())return;
  e.preventDefault();e.stopImmediatePropagation();
  playPause();
 },true);
 try{
  const match=location.hash.match(/^#musicbox-room=([0-9a-f-]{36})\.([0-9a-f]{64})$/i);
  if(match){
   // Aprendo nuovamente lo stesso link sullo stesso telefono non creo una
   // seconda persona per sbaglio: riutilizzo la sessione personale salvata.
   let saved=null;
   try{saved=JSON.parse(localStorage.getItem("mb.stanza.v1")||"null")}catch(e){}
   if(saved?.id===match[1]&&/^[0-9a-f]{64}$/i.test(saved.token||"")&&
      (!saved.profile||saved.profile===bridge()?.profile())){
    creds=saved;
    if(saved.role==="host"&&/^[0-9a-f]{64}$/i.test(saved.guestToken||""))
     inviteUrl=location.origin+location.pathname+"#musicbox-room="+saved.id+"."+saved.guestToken;
    setTimeout(refresh,500);
   }else invitation={id:match[1],token:match[2]};
   history.replaceState({}, "",location.pathname+location.search);
   setTimeout(open,1000);
  }else{
   const raw=localStorage.getItem("mb.stanza.v1");
   const saved=raw?JSON.parse(raw):null;
   if(saved&&/^[0-9a-f-]{36}$/i.test(saved.id||"")&&/^[0-9a-f]{64}$/i.test(saved.token||"")){
    creds=saved;
    if(saved.role==="host"&&/^[0-9a-f]{64}$/i.test(saved.guestToken||""))
      inviteUrl=location.origin+location.pathname+"#musicbox-room="+saved.id+"."+saved.guestToken;
    setTimeout(refresh,1500);
   }
  }
 }catch(e){}
 setInterval(()=>{if(creds&&!document.hidden)refresh()},1800);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&creds)refresh()});
 draw();
}
window.MusicBoxRoom={open,isActive,isApplying,interceptTrack,upcoming,control,refresh,leave,enqueue,queueAction,
 shouldPlay,hasSession:()=>!!creds,remainingCount:()=>nextItems().length};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();