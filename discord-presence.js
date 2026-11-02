/* Music Box -> Discord desktop: voluntary presence via local-only bridge. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const ENDPOINT="http://127.0.0.1:8792/activity";
const ENABLED="mb.discord.presence.enabled.v1";
const APP_ID="mb.discord.presence.appid.v1";
const desktop=/Windows/i.test(navigator.userAgent||"");
let busy=false,lastStatus="",lastPayload="",lastRequest=0,lastRunning=false;
const settings={
 get enabled(){try{return localStorage.getItem(ENABLED)!=="0";}catch(_){return true;}},
 get appId(){try{return localStorage.getItem(APP_ID)||"";}catch(_){return "";}}
};
function status(message){
 if(message===lastStatus)return;
 lastStatus=message;
 if($("discordRpcStatus"))$("discordRpcStatus").textContent=message;
}
// Discord can proxy public HTTPS album artwork, including Deezer and Spotify CDN.
// Never send blob:, data:, localhost or URLs with credentials to the Discord client.
function publicArtwork(value){
 if(typeof value!=="string"||!value.trim())return "";
 try{
  const url=new URL(value.trim(),document.baseURI);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.href.length>300)return "";
  const host=url.hostname.toLowerCase();
  if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||
     host==="0.0.0.0"||host==="::1"||/^(\d{1,3}\.){3}\d{1,3}$/.test(host)||
     host.startsWith("10.")||host.startsWith("192.168.")||host.startsWith("172."))return "";
  return url.href;
 }catch(_){return "";}
}
function coverFromPlayer(track){
 // Actual player artwork is authoritative, not a fallback icon or unrelated
 // image from another track in the library.
 const candidates=[track?.cover,track?.coverUrl,track?.artwork,track?.albumArt];
 try{
  const el=document.getElementById("playerArt");
  const bg=el&&(el.style.backgroundImage||getComputedStyle(el).backgroundImage)||"";
  const match=bg.match(/^url\(["']?(.*?)["']?\)$/i);
  if(match)candidates.push(match[1]);
 }catch(_){}
 try{
  const meta=navigator.mediaSession?.metadata;
  if(meta&&meta.title===track?.title&&Array.isArray(meta.artwork))
   for(const art of meta.artwork)candidates.push(art?.src);
 }catch(_){}
 for(const candidate of candidates){
  const url=publicArtwork(candidate);
  if(url&&!/\/(?:icon-(?:180|192|512)|discord-fallback)\.(?:png|webp)(?:[?#]|$)/i.test(url))return url;
 }
 return "";
}

function trackInfo(){
 const bridge=window.MusicBoxBridge;
 if(!bridge)return {playing:false};
 const audio=bridge.audio?.();
 const t=bridge.allTracks?.()?.find?.(x=>x.id===bridge.currentId?.());
 if(!audio||!t||audio.paused||audio.ended)return {playing:false};
 const duration=Number(audio.duration),pos=Number(audio.currentTime);
 const cover=coverFromPlayer(t);
 return {playing:true,title:String(t.title||"").slice(0,120),artist:String(t.artist||"").slice(0,120),
  position:Number.isFinite(pos)?Math.max(0,pos):0,
  duration:Number.isFinite(duration)?Math.max(0,duration):0,cover};
}
async function pulse(force=false){
 if(!desktop)return;
 if(!settings.enabled){
  if(lastRunning&&settings.appId){lastRunning=false;await push({applicationId:settings.appId,playing:false});}
  return;
 }
 const id=settings.appId.trim();
 if(!/^[0-9]{17,21}$/.test(id)){
  status("Per attivare Discord inserisci prima l'Application ID.");
  return;
 }
 const playback=trackInfo();
 const body={applicationId:id,...playback};
 const sig=[id,playback.playing,playback.title,playback.artist,playback.cover].join("|");
 const now=Date.now();
 if(!force&&sig===lastPayload&&now-lastRequest<9000)return;
 lastPayload=sig;lastRequest=now;lastRunning=playback.playing;
 await push(body);
}
async function push(body){
 if(busy)return;
 busy=true;
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),2800);
 try{
  const r=await fetch(ENDPOINT,{method:"POST",mode:"cors",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),signal:abort.signal});
  const j=await r.json();
  if(!r.ok||!j.ok)throw Error(j.error||"Errore del ponte locale");
  if(j.connected)status(body.playing?"Su Discord: "+(body.title||"Music Box"):"Discord collegato · in pausa");
  else status(j.error&&j.error!=="Collegamento a Discord..."?j.error:"Collegamento a Discord in corso...");
 }catch(e){
  status("Ponte Discord non raggiungibile. Installa una sola volta il ponte per Windows.");
 }finally{clearTimeout(timer);busy=false;}
}
function setup(){
 if(!$("discordRpcEnabled"))return;
 $("discordRpcEnabled").checked=settings.enabled;
 $("discordRpcId").value=settings.appId;
 if(!desktop){
  $("discordRpcEnabled").disabled=true;
  $("discordRpcId").disabled=true;
  status("Rich Presence disponibile su Windows con Discord Desktop.");
  return;
 }
 $("discordRpcEnabled").addEventListener("change",()=>{
  try{localStorage.setItem(ENABLED,$("discordRpcEnabled").checked?"1":"0");}catch(_){}
  lastPayload="";lastRequest=0;
  if(!settings.enabled)status("Condivisione su Discord disattivata.");
  pulse(true);
 });
 $("discordRpcId").addEventListener("change",()=>{
  const id=$("discordRpcId").value.trim();
  try{localStorage.setItem(APP_ID,id);}catch(_){}
  lastPayload="";lastRequest=0;
  pulse(true);
 });
 $("discordRpcId").addEventListener("input",()=>{
  status("Salva l'Application ID uscendo dal campo, poi avvia il ponte Windows.");
 });
 $("discordRpcCheck").addEventListener("click",()=>pulse(true));
 if(!settings.appId)status("Inserisci l'Application ID per collegare Discord.");
 else if(!settings.enabled)status("Condivisione su Discord disattivata.");
 setInterval(()=>{if(!document.hidden||trackInfo().playing)pulse();},3300);
 ["play","pause","ended","seeked","durationchange"].forEach(type=>{
  document.addEventListener(type,()=>pulse(true),true);
 });
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)pulse(true);});
 window.addEventListener("pagehide",()=>{
  if(lastRunning&&settings.appId){
   // Best-effort cleanup; the companion also expires stale playing data after 25s.
   fetch(ENDPOINT,{method:"POST",mode:"cors",keepalive:true,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({applicationId:settings.appId,playing:false})}).catch(()=>{});
  }
 });
 setTimeout(()=>pulse(true),1500);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
else setup();
})();