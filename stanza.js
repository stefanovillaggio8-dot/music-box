/* Music Box · ascolto condiviso. Questo modulo non legge password o dati palestra.
 * Ogni stanza dura 12 ore e richiede un invito con token crittografico. */
(function(){
"use strict";
const ENDPOINT="https://adnteitlhopehllutlua.supabase.co/functions/v1/musicbox-listen-together";
const $=id=>document.getElementById(id);
const bridge=()=>window.MusicBoxBridge;
let creds=null,room=null,invitation=null,inviteUrl="",busy=false,localPlay=false,lastRevision=0;
function status(msg){const el=$("stanzaStato");if(el)el.textContent=msg;}
function tell(msg){if(bridge()?.toast)bridge().toast(msg);else status(msg);}
function available(){
 const app=bridge();if(!app)return [];
 const profile=app.profile();
 return app.playable().filter(t=>t && t.url &&
   /^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(String(t.file||"")))
   .map(t=>({profile:t.profile||profile,file:t.file,title:t.title,artist:t.artist||""}));
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
  if(!/^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(String(item.file||"")))continue;
  const id=roomTrack(item);if(tracks.some(t=>t.id===id))continue;
  tracks.push({id,file:item.file,profile:app.profile(),title:String(item.title||"Brano"),
   artist:String(item.artist||""),url:app.urlForFile(item.file),source:"stanza-condivisa",
   builtin:true,gradient:"linear-gradient(150deg,#623cbd,#1f2135)"});
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
 for(const id of ["stanzaAscolta","stanzaPlay","stanzaNext","stanzaRimescola"])
  $(id).hidden=!joined;
 $("stanzaInfo").textContent=invitation&&!active?
   "Hai ricevuto un invito. Entrando unisci i brani pubblicati della tua libreria con quelli del tuo amico.":
   active?"Stanza: "+(room?.hostProfile||"Host")+" + "+(room?.guestProfile||"in attesa")+
      ". Ogni partecipante ascolta i propri MP3 e quelli dell'altro.":
   "Crea una stanza privata e invia il link. Ogni persona contribuisce con la propria libreria o playlist selezionata.";
 if(active)status(joined?"Connessi: "+(room.playlist?.length||0)+" brani · "+
   (localPlay?"riproduzione sincronizzata attiva":"tocca Ascolta insieme su questo dispositivo"):
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
  creds={id:result.id,token:result.hostToken,role:"host"};
  inviteUrl=location.origin+location.pathname+"#musicbox-room="+result.id+"."+result.guestToken;
  invitation=null;localPlay=false;save();await refresh();
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
  localPlay=false;save();lastRevision=0;await refresh();
  tell("Librerie unite. Premi Ascolta insieme per iniziare.");
 }catch(e){tell("Invito: "+e.message)}
 finally{b.disabled=false;draw()}
}
async function apply(){
 if(!creds||!room?.joined)return;
 registerTracks();if(!localPlay)return;
 const t=selected();if(!t)return;
 const app=bridge();if(!app)return;
 const id=roomTrack(t);
 let seconds=Math.max(0,Number(room.offset)||0);
 if(room.playing&&room.startedAt)
  seconds+=Math.max(0,(Date.now()-Date.parse(room.startedAt))/1000);
 if(app.currentId()!==id) {
  await app.play(id,!!room.playing);
  const audio=app.audio();
  if(audio){
   if(audio.readyState>=1){try{audio.currentTime=seconds}catch(e){}}
   else audio.addEventListener("loadedmetadata",function(){if(app.currentId()===id)
     try{audio.currentTime=seconds}catch(e){}},{once:true});
  }
 }else {
  const audio=app.audio();
  if(!audio)return;
  if(audio.readyState>=1&&Math.abs((audio.currentTime||0)-seconds)>3)
   try{audio.currentTime=seconds}catch(e){}
  if(!room.playing&&!audio.paused)audio.pause();
  else if(room.playing&&audio.paused)app.playCurrent();
 }
}
async function refresh(){
 if(!creds||busy)return;
 busy=true;
 try{
  const response=await request({action:"state",id:creds.id,token:creds.token});
  room=response.room;registerTracks();
  if(lastRevision!==room.revision){lastRevision=room.revision;bridge()?.refreshQueue();}
  await apply();if(!$("stanzaPanel").hidden)draw();
 }catch(e){if(!$("stanzaPanel").hidden)status("Connessione: "+e.message)}
 finally{busy=false}
}
async function control(command,extra){
 if(!creds||!room?.joined)return;
 try{
  const response=await request({action:"control",command,id:creds.id,token:creds.token,...(extra||{})});
  if(response.room){room=response.room;lastRevision=0;}
  await refresh();
 }catch(e){tell("Sincronizzazione: "+e.message);await refresh()}
}
function listen(){
 if(!room?.joined)return;
 localPlay=true;registerTracks();
 const t=selected();
 if(t){
  // Avvio locale prima dell'attesa di rete, necessario al gesto Safari.
  bridge()?.play(roomTrack(t),true);
  control("play");
 }
 draw();
}
function leave(){
 creds=null;room=null;invitation=null;inviteUrl="";localPlay=false;lastRevision=0;save();
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
 $("btnPlay").addEventListener("click",()=>{
  if(!isActive())return;
  setTimeout(()=>control(bridge()?.audio()&&!bridge().audio().paused?"play":"pause"),200);
 });
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
    creds=saved;setTimeout(refresh,1500);
   }
  }
 }catch(e){}
 setInterval(()=>{if(creds&&!document.hidden)refresh()},2600);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&creds)refresh()});
 draw();
}
window.MusicBoxRoom={open,isActive,upcoming,control,refresh,leave};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();