/* Music Box · Amici online v6.503
   Presence opt-in, no Spotify/GitHub account required. Device identity is
   local-only (not real account authentication). Invites remain private. */
(function () {
"use strict";
const ENDPOINT="https://adnteitlhopehllutlua.supabase.co/functions/v1/musicbox-friends-presence";
const $=id=>document.getElementById(id);
const bridge=()=>window.MusicBoxBridge;
const room=()=>window.MusicBoxRoom;
const VALID=["Ste","Diego","Emanuele"];
const KEY="mb.amici.online.v1.";
const SONGKEY="mb.amici.song.v1.";
const STATUS_LIMIT=180000;
let visible=false,shareSong=false,currentProfile="",registered=false,busy=false;
let lastPulse=0,lastList=0,pendingOut=[],incoming=[],friends=[];
let session=null,pulseChain=Promise.resolve(),polling=false;
const escapeName=(s)=>String(s||"").slice(0,180);
function tell(s){bridge()?.toast?.(s)}
function validProfile(){const n=bridge()?.profile?.();return VALID.includes(n)?n:""}
function stateForProfile(){
 const name=validProfile();
 if(name===currentProfile)return;
 const oldVisible=visible;
 currentProfile=name;lastPulse=0;registered=false;
 visible=!!name && localStorage.getItem(KEY+name)==="1";
 shareSong=!!name && localStorage.getItem(SONGKEY+name)!=="0";
 $("amiciVisible").checked=visible;
 $("amiciSong").checked=shareSong;
 $("amiciSong").disabled=!visible;
 if(oldVisible && !visible)enqueueOffline();
}
function getSession(){
 if(session)return session;
 try{
   const old=JSON.parse(localStorage.getItem("mb.amici.device.v1")||"null");
   if(old&&/^[0-9a-f-]{36}$/i.test(old.deviceId)&&/^[0-9a-f]{64}$/i.test(old.token)){
     session=old;return session;
   }
 }catch(e){}
 if(!window.crypto?.getRandomValues)return null;
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(n=>n.toString(16).padStart(2,"0")).join("");
 // crypto.randomUUID is unavailable on some HTTP LAN URLs. WebCrypto random
 // bytes remain available there; create a compliant v4 UUID ourselves.
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const h=Array.from(bytes).map(n=>n.toString(16).padStart(2,"0")).join("");
 const deviceId=h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);
 session={deviceId,token};
 try{localStorage.setItem("mb.amici.device.v1",JSON.stringify(session))}catch(e){}
 return session;
}
async function request(payload,timeout=8500){
 const controller=new AbortController();
 const kill=setTimeout(()=>controller.abort(),timeout);
 try{
   const res=await fetch(ENDPOINT,{method:"POST",cache:"no-store",
     headers:{"Content-Type":"application/json"},
     signal:controller.signal,body:JSON.stringify(payload)});
   const j=await res.json();
   if(!res.ok||!j.ok)throw Error(String(j.error||"Connessione non riuscita"));
   return j;
 }finally{clearTimeout(kill)}
}
function identity(){return getSession()||{}}
function queueWrite(task){
 pulseChain=pulseChain.catch(()=>{}).then(task);
 return pulseChain;
}
function enqueueOffline(){
 const id=identity();
 registered=false;
 if(!id.deviceId)return Promise.resolve();
 return queueWrite(()=>request({action:"offline",...id}).catch(()=>{}));
}
function nowSong(){
 const b=bridge(),track=b?.allTracks?.()?.find(t=>t.id===b?.currentId?.());
 const audio=b?.audio?.();
 return {playing:!!audio&&!audio.paused&&!audio.ended,
   title:escapeName(track?.title||""),artist:escapeName(track?.artist||"")};
}
async function pulse(force=false){
 stateForProfile();
 if(!visible||!currentProfile||!navigator.onLine)return;
 // Do not appear online while the app is hidden and music is paused.
 if(document.hidden&&!nowSong().playing)return;
 if(!force&&Date.now()-lastPulse<12000)return;
 const id=identity();
 if(!id.deviceId)return;
 const profileAtStart=currentProfile;
 const track=nowSong();
 lastPulse=Date.now();
 return queueWrite(async()=>{
   if(!visible||validProfile()!==profileAtStart)return;
   try{
    await request({action:"pulse",...id,profile:profileAtStart,
      showSong:shareSong,title:track.title,artist:track.artist,playing:track.playing,
      inRoom:!!room()?.getInviteLink?.()});
    registered=true;
    $("amiciStatus").textContent="Presenza attiva. Gli amici possono vederti online.";
   }catch(e){
    registered=false;lastPulse=0;
    $("amiciStatus").textContent="Connessione: "+e.message;
   }
 });
}
function setVisible(checked){
 stateForProfile();
 if(!currentProfile){$("amiciVisible").checked=false;return}
 visible=!!checked;
 localStorage.setItem(KEY+currentProfile,visible?"1":"0");
 $("amiciSong").disabled=!visible;
 if(!visible){$("amiciStatus").textContent="Modalità invisibile: nessuno vede la tua attività.";enqueueOffline()}
 else {lastPulse=0;pulse(true).then(refresh);}
 draw();
}
function setShareSong(checked){
 shareSong=!!checked;
 if(currentProfile)localStorage.setItem(SONGKEY+currentProfile,shareSong?"1":"0");
 lastPulse=0;pulse(true);
 draw();
}
function close(){const p=$("amiciPanel");if(p)p.hidden=true;bridge()?.syncScroll?.()}
function open(){
 bridge()?.closeOther?.();
 stateForProfile();
 $("amiciPanel").hidden=false;
 $("amiciStatus").textContent=visible
  ?"Gli amici vedono che sei online.":"Modalità invisibile: la tua attività è privata.";
 bridge()?.syncScroll?.();draw();refresh();
}
function tag(className,txt){const n=document.createElement("span");n.className=className;n.textContent=txt;return n;}
function btn(label,handler,disabled=false){
 const b=document.createElement("button");b.type="button";b.textContent=label;b.disabled=disabled;
 b.addEventListener("click",handler);return b;
}
function renderFriends(){
 const root=$("amiciList");if(!root)return;
 root.replaceChildren();
 const myId=getSession()?.deviceId;
 const list=friends.filter(f=>f.id!==myId);
 const unique=new Set();
 const filtered=list.filter(f=>{const k=f.profile+":"+f.id;if(unique.has(k))return false;unique.add(k);return true;});
 $("amiciOnlineCount").textContent=String(filtered.length);
 if(!filtered.length){root.append(tag("amici-empty","Nessun amico visibile adesso. Quando Ste, Diego o Emanuele attivano la presenza, compariranno qui."));return;}
 for(const f of filtered){
  const row=document.createElement("article");row.className="amici-user";
  const avatar=tag("amici-avatar",String(f.profile||"?").slice(0,1).toUpperCase());
  const info=document.createElement("div");info.className="amici-user-info";
  const h=document.createElement("div");h.className="amici-user-head";
  h.append(tag("amici-name",f.profile),tag("amici-indicator","● Online"));
  const subtitle=tag("amici-track",f.sharingSong&&f.title?
      ((f.playing?"♫ ":"⏸ ")+f.title+(f.artist?" · "+f.artist:"")):
      (f.sharingSong?"Non sta ascoltando musica":"Ascolto privato"));
  info.append(h,subtitle);
  const actions=document.createElement("div");actions.className="amici-user-actions";
  if(f.inRoom)actions.append(btn("Chiedi di entrare",()=>askToJoin(f),!visible));
  row.append(avatar,info,actions);root.append(row);
 }
}
function renderRequests(){
 const container=$("amiciRequests");if(!container)return;
 container.replaceChildren();
 if(!visible){container.append(tag("amici-empty","Attiva la presenza per inviare o ricevere richieste."));return;}
 let anything=false;
 for(const r of incoming){
  anything=true;
  const row=document.createElement("div");row.className="amici-request";
  row.append(tag("amici-request-text",String(r.requester_profile||"Amico")+" vuole entrare nella tua stanza"));
  const actions=document.createElement("span");actions.className="amici-request-actions";
  const invite=room()?.getInviteLink?.()||"";
  actions.append(btn("Accetta",()=>answer(r.id,true),!invite),
                 btn("Rifiuta",()=>answer(r.id,false)));
  row.append(actions);container.append(row);
 }
 for(const r of pendingOut){
  anything=true;
  const row=document.createElement("div");row.className="amici-request";
  const txt=r.status==="approved"?"Il tuo invito è stato accettato":
    r.status==="declined"?"La richiesta è stata rifiutata":"Richiesta inviata · in attesa";
  row.append(tag("amici-request-text",txt));
  if(r.status==="approved"&&r.inviteUrl)
    row.append(btn("Apri stanza",()=>enterRoom(r.inviteUrl)));
  container.append(row);
 }
 if(!anything)container.append(tag("amici-empty","Nessuna richiesta di ingresso."));
}
function draw(){
 stateForProfile();
 $("amiciVisible").checked=visible;
 $("amiciSong").checked=shareSong;
 $("amiciSong").disabled=!visible;
 renderFriends();renderRequests();
}
async function askToJoin(friend){
 if(!visible){tell("Attiva la presenza per chiedere di entrare.");return;}
 if(!friend?.inRoom)return;
 if(room()?.hasSession?.()){tell("Esci prima dalla tua stanza attuale.");return;}
 try{
  await pulse(true);
  await request({action:"request",...identity(),target:friend.id});
  tell("Richiesta inviata a "+friend.profile);
  refresh();
 }catch(e){tell("Richiesta non inviata: "+e.message)}
}
async function answer(requestId,accept){
 try{
  const raw=room()?.getInviteLink?.()||"";
  const match=raw.match(/#musicbox-room=([0-9a-f-]{36})\.([0-9a-f]{64})$/i);
  const inviteUrl=accept&&match?
    "https://stefanovillaggio8-dot.github.io/music-box/#musicbox-room="+match[1]+"."+match[2]:"";
  await request({action:"respond",...identity(),requestId,accept,inviteUrl});
  tell(accept?"Invito inviato in privato":"Richiesta rifiutata");
  refresh();
 }catch(e){tell("Non posso rispondere: "+e.message)}
}
function enterRoom(url){
 if(room()?.hasSession?.()){tell("Esci prima dalla tua stanza attuale.");return;}
 if(room()?.joinFromLink?.(url)){close();return;}
 tell("Non posso aprire l'invito. Ricarica l'app.");
}
async function refresh(){
 if(polling||!navigator.onLine)return;
 polling=true;
 try{
  stateForProfile();
  if(visible && !registered)await pulse(true);
  const who=identity();
  const [list,box]=await Promise.all([
    request({action:"list"}),
    visible&&registered?request({action:"inbox",...who}):Promise.resolve({incoming:[],mine:[]})
  ]);
  friends=Array.isArray(list.people)?list.people:[];
  incoming=Array.isArray(box.incoming)?box.incoming:[];
  pendingOut=Array.isArray(box.mine)?box.mine:[];
  lastList=Date.now();if(!$("amiciPanel").hidden)draw();
 }catch(e){
  if(!$("amiciPanel").hidden)$("amiciStatus").textContent="Amici: "+e.message;
 }finally{polling=false}
}
function start(){
 if(!$("amiciPanel")||!$("btnAmiciOnline"))return;
 stateForProfile();
 $("btnAmiciOnline").addEventListener("click",open);
 $("amiciClose").addEventListener("click",close);
 $("amiciPanel").addEventListener("click",e=>{if(e.target===$("amiciPanel"))close()});
 $("amiciVisible").addEventListener("change",e=>setVisible(e.target.checked));
 $("amiciSong").addEventListener("change",e=>setShareSong(e.target.checked));
 $("amiciRefresh").addEventListener("click",refresh);
 setInterval(()=>{
   stateForProfile();
   if(visible&&document.hidden&&!nowSong().playing){
     if(registered)enqueueOffline();
   } else if(visible) pulse();
   if(!document.hidden&&!$("amiciPanel").hidden&&Date.now()-lastList>=9000)refresh();
 },5000);
 document.addEventListener("visibilitychange",()=>{
   if(!document.hidden){lastPulse=0;pulse(true);if(!$("amiciPanel").hidden)refresh();}
   else if(visible&&bridge()?.audio?.()?.paused)enqueueOffline();
 });
 window.addEventListener("online",()=>{lastPulse=0;pulse(true);refresh()});
 window.addEventListener("pagehide",()=>{
   if(!visible)return;
   const a=bridge()?.audio?.();if(a&&!a.paused&&!a.ended)return;
   try{fetch(ENDPOINT,{method:"POST",keepalive:true,headers:{"Content-Type":"application/json"},
     body:JSON.stringify({action:"offline",...identity()})}).catch(()=>{})}catch(e){}
 });
 if(visible)pulse(true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();