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
 return app.playable().filter(t=>{
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
 for(const item of room.playlist){
  const file=String(item.file||"");
  const cloud=/^cloud\/youtube-[A-Za-z0-9_-]{11}\.mp3$/.test(file);
  if(!cloud&&!/^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(file))continue;
  if(cloud&&!/^https:\/\/adnteitlhopehllutlua\.supabase\.co\/functions\/v1\/musicbox-import-queue\?action=audio&id=[0-9a-f-]{36}$/i.test(String(item.url||"")))continue;
  const id=roomTrack(item);if(tracks.some(t=>t.id===id))continue;
  tracks.push({id,file:item.file,profile:item.profile||app.profile(),title:String(item.title||"Brano"),
   artist:String(item.artist||""),url:cloud?item.url:app.urlForFile(item.file),
   source:"stanza-condivisa",builtin:true,gradient:"linear-gradient(150deg,#623cbd,#1f2135)"});
 }
}
function selected(){
 if(!room||!room.joined||!Array.isArray(room.playlist))return null;
 return room.playlist[Number(room.currentIndex)||0]||null;
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
 for(const id of ["stanzaPlay","stanzaNext","stanzaRimescola"])
  $(id).hidden=!joined;
 $("stanzaInfo").textContent=invitation&&!active?
   "Hai ricevuto un invito. Entrando unisci i brani pubblicati della tua libreria con quelli del tuo amico.":
   active?"Stanza: "+(room?.hostProfile||"Host")+" + "+(room?.guestProfile||"in attesa")+
      ". Ogni partecipante ascolta i propri MP3 e quelli dell'altro.":
   "Crea una stanza privata e invia il link. Ogni persona contribuisce con la propria libreria o playlist selezionata.";
 if(active)status(joined?"Connessi: "+(room.playlist?.length||0)+" brani · "+
   (needsGesture?"tocca Attiva audio una volta sul dispositivo":"sincronizzazione automatica attiva"):
   "Stanza creata, in attesa del secondo partecipante.");
 else if(invitation)status("Controlla il profilo attivo, poi premi Entra.");
 else status("La sessione parte solo quando premi Crea.");
}
function open(){const el=$("stanzaPanel");if(!el)return;el.hidden=false;bridge()?.syncScroll?.();draw();}
function close(){if(!$("stanzaPanel"))return;$("stanzaPanel").hidden=true;bridge()?.syncScroll?.();}
async function create(){
 const songs=available();
 if(!songs.length){tell("Questa libreria non contiene MP3 online da condividere");return;}
 const btn=$("stanzaCrea");btn.disabled=true;
 try{
  const result=await request({action:"create",profile:bridge().profile(),tracks:songs});
  creds={id:result.id,token:result.hostToken,guestToken:result.guestToken,role:"host"};
  inviteUrl=location.origin+location.pathname+"#musicbox-room="+result.id+"."+result.guestToken;
  invitation=null;localPlay=true;needsGesture=false;save();await refresh();
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
  const result=await request({action:"join",id:invitation.id,token:invitation.token,
     profile:bridge().profile(),tracks:songs});
  creds={...invitation,role:"guest"};invitation=null;room=result.room;
  localPlay=true;needsGesture=false;save();lastRevision=0;await refresh();
  tell("Librerie unite. Play, pausa e brani si sincronizzano automaticamente.");
 }catch(e){tell("Invito: "+e.message)}
 finally{b.disabled=false;draw()}
}
function reportPlaybackFailure(){
 if(!room?.playing)return;
 needsGesture=true;draw();
 status("Il browser ha bloccato l'avvio audio: tocca Attiva audio una sola volta.");
}
function attachAudio(){
 const a=bridge()?.audio();
 if(!a||a===attachedAudio)return;
 attachedAudio=a;
 a.addEventListener("play",()=>{
  if(!isActive()||isRemoteEvent()||!room?.joined)return;
  needsGesture=false;
  if(!room.playing)control("play");
 });
 a.addEventListener("pause",()=>{
  if(!isActive()||isRemoteEvent()||document.hidden||a._mbCambioBrano||a.ended)return;
  if(room.playing)control("pause");
 });
 a.addEventListener("seeked",()=>{
  if(!isActive()||isRemoteEvent()||!room?.joined||!a.seekable?.length)return;
  if(room.playing||room.offset>0)control("seek",{seconds:Math.max(0,a.currentTime||0)});
 });
}
async function apply(){
 if(!creds||!room?.joined)return;
 registerTracks();
 const t=selected(),app=bridge();if(!t||!app)return;
 const id=roomTrack(t);
 const secondsAt=()=>{
  let seconds=Math.max(0,Number(room.offset)||0);
  if(room.playing&&room.startedAt)
   seconds+=Math.max(0,(Date.now()-Date.parse(room.startedAt))/1000);
  return seconds;
 };
 let changed=false;
 applying=true;
 try{
  if(app.currentId()!==id){suppress();changed=true;await app.play(id,!!room.playing)}
  const a=app.audio();attachAudio();if(!a)return;
  if(a.readyState>=1){
   if(Math.abs((a.currentTime||0)-secondsAt())>2.3){
    suppress();changed=true;
    try{a.currentTime=secondsAt()}catch(e){}
   }
  }else{
   a.addEventListener("loadedmetadata",()=>{
    if(app.currentId()===id)try{a.currentTime=secondsAt()}catch(e){}
   },{once:true});
  }
  if(!room.playing&&!a.paused){suppress();changed=true;a.pause()}
  else if(room.playing&&a.paused){
   suppress();changed=true;
   try{
    await app.playCurrent();
    // Alcuni player gestiscono internamente NotAllowedError.
    if(a.paused)setTimeout(()=>{if(isActive()&&room?.playing&&app.audio()===a&&a.paused)reportPlaybackFailure()},800);
    else needsGesture=false;
   }catch(e){reportPlaybackFailure();}
  }else if(room.playing&&!a.paused)needsGesture=false;
 }finally{applying=false;if(changed)suppress();draw();}
}

async function refresh(){
 if(!creds||busy)return;
 busy=true;
 try{
  const response=await request({action:"state",id:creds.id,token:creds.token});
  // Evita che una risposta di polling vecchia sovrascriva un comando appena
  // confermato dal server (salto indietro / doppia canzone).
  if(room && Number(response.room.revision)<Number(room.revision))return;
  room=response.room;registerTracks();attachAudio();
  if(lastRevision!==room.revision){lastRevision=room.revision;bridge()?.refreshQueue();}
  await apply();if(!$("stanzaPanel").hidden)draw();
 }catch(e){if(!$("stanzaPanel").hidden)status("Connessione: "+e.message)}
 finally{busy=false}
}
function control(command,extra){
 if(!creds||!room?.joined)return Promise.resolve();
 // Metti in coda le pressioni veloci, invece di perderle con commandBusy.
 // I seek durante lo scorrimento sono frequenti: il comando più recente basta.
 const action=async()=>{
  if(!creds||!room?.joined)return;
  try{
   const response=await request({action:"control",command,id:creds.id,token:creds.token,
     expectedRevision:room.revision,...(extra||{})});
   if(response.room && (!room||Number(response.room.revision)>=Number(room.revision))){
     room=response.room;lastRevision=0;
   }
   await refresh();
  }catch(e){
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
 const action=Promise.resolve(app.play(roomTrack(t),true));
 if(!room.playing)control("play");
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
 creds=null;room=null;invitation=null;inviteUrl="";localPlay=false;needsGesture=false;lastRevision=0;save();
 bridge()?.refreshQueue();draw();tell("Hai lasciato la stanza");
}
function isActive(){return !!(creds&&room?.joined)}
function playPause(){
 if(!isActive())return;
 control(room.playing?"pause":"play");
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
   invitation={id:match[1],token:match[2]};
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
 setInterval(()=>{if(creds&&!document.hidden)refresh()},2600);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&creds)refresh()});
 draw();
}
window.MusicBoxRoom={open,isActive,isApplying,interceptTrack,upcoming,control,refresh,leave};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();