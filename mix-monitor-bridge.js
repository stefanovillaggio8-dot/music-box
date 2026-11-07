"use strict";
(function(){
 // Companion for Smart Mix Lab. Read-only monitoring, local device only.
 // No audio bytes, song files, account tokens or analytics are uploaded.
 const CHANNEL="musicbox-smartmix-monitor-v1";
 const STORE="mb.smartmix.lab.events";
 const device=/iPhone|iPad|iPod/i.test(navigator.userAgent)?"iphone":"pc";
 const channel=typeof BroadcastChannel==="function"?new BroadcastChannel(CHANNEL):null;
 let events=[],counter=0,version="—",lastAudio=null,lastId="",lastTime=null,
  lastSeek=null,waitingAt=null,lastOverlap="",lastBlocker="",lastDiag=null,
  lastShuffle=null,lastSelectedAuto="",lastEnded=false,lastHidden=null,
  lastCatalogueAt=0,lastEventAt=new Map(),playedAutomatically=new Set(),
  lastStatusAt=0,activeLabUntil=0;
 try{const v=JSON.parse(localStorage.getItem(STORE));if(Array.isArray(v))events=v.slice(-650)}catch(_){}
 function app(){return window.MusicBoxBridge||null}
 function mix(){return window.MusicBoxMix||null}
 function getDiag(){try{return mix()?.diagnostics?.()||null}catch(_){return null}}
 function snapshotVersion(){
  try{const snap=app()?.librarySnapshot?.();if(snap?.version)version=String(snap.version)}catch(_){}
 }
 function emit(type,title,detail,opts){
  const now=Date.now(),fingerprint=type+"|"+title+"|"+(opts?.trackId||"")+"|"+(opts?.toId||"");
  if(now-(lastEventAt.get(fingerprint)||0)<(opts?.cooldown||1400))return;
  lastEventAt.set(fingerprint,now);
  if(lastEventAt.size>100)lastEventAt.clear();
  const item={id:device+"-"+now+"-"+(++counter),ts:new Date(now).toISOString(),
   device,type,title:String(title||"Evento").slice(0,130),
   detail:String(detail||"").slice(0,420),trackId:String(opts?.trackId||""),
   fromId:String(opts?.fromId||""),toId:String(opts?.toId||""),version};
  events.push(item);
  events=events.slice(-650);
  try{localStorage.setItem(STORE,JSON.stringify(events))}catch(_){}
  send({type:"event",event:item});
 }
 function send(data){try{channel?.postMessage(data)}catch(_){}}
 function catalogue(){
  const b=app();if(!b?.allTracks)return;
  try{
   const tracks=b.allTracks().filter(t=>t&&t.id&&t.url&&!t.youtubeId).slice(0,5000)
    .map(t=>({id:String(t.id),title:String(t.title||t.id),
     artist:String(t.artist||""),file:String(t.file||""),
     // Only paths are needed to match entries from the deep audio index.
     url:/^blob:|^data:/i.test(String(t.url||""))?"":String(t.url||"").slice(0,220)}));
   send({type:"catalog",device,tracks});
   lastCatalogueAt=Date.now();
  }catch(_){}
 }
 function diagnose(d){
  const audio=app()?.audio?.(),id=d.current||"";
  if(audio!==lastAudio){
   lastAudio=audio;lastTime=null;lastSeek=null;waitingAt=null;lastEnded=false;
   if(audio){
    const bound=audio;
    audio.addEventListener("seeking",()=>{
     if(lastAudio!==bound)return;
     lastSeek={at:performance.now(),id:app()?.currentId?.(),before:bound.currentTime};
    });
    audio.addEventListener("seeked",()=>{
     if(lastAudio!==bound||!lastSeek)return;
     const ms=performance.now()-lastSeek.at;
     if(ms>2800)emit("issue","Seek lento rilevato",
      "La ricerca audio ha impiegato "+Math.round(ms)+" ms (soglia 2800 ms).",
      {trackId:app()?.currentId?.(),cooldown:15000});
     else emit("info","Seek completato",
      Math.round(ms)+" ms · posizione "+(Number(bound.currentTime)||0).toFixed(1)+" s",
      {trackId:app()?.currentId?.(),cooldown:900});
     lastSeek=null;
    });
    audio.addEventListener("waiting",()=>{
     if(lastAudio===bound&&!bound.paused)waitingAt=performance.now()
    });
    audio.addEventListener("playing",()=>{
     if(lastAudio!==bound)return;
     if(waitingAt){
      const ms=performance.now()-waitingAt;
      if(ms>4500)emit("issue","Buffering prolungato",
       "Il lettore ha atteso "+(ms/1000).toFixed(1)+" s.",
       {trackId:app()?.currentId?.(),cooldown:15000});
      waitingAt=null;
     }
    });
    audio.addEventListener("error",()=>{
     if(lastAudio!==bound)return;
     emit("issue","Errore del lettore audio",
      "Codice browser "+String(bound.error?.code||"non disponibile"),
      {trackId:app()?.currentId?.(),cooldown:10000});
    });
    audio.addEventListener("ended",()=>{if(lastAudio===bound)lastEnded=true});
   }
  }
  if(id&&id!==lastId){
   const previous=lastId,automatic=!!(lastShuffle&&
    lastShuffle.manualCount===0&&!lastShuffle.userReordered&&
    (id===lastShuffle.first||id===lastSelectedAuto));
   const suffix=automatic?" [auto]":" [manuale/non classificato]";
   if(previous){
    emit("track","Nuovo brano in riproduzione",
     previous+" → "+id+suffix,{trackId:id,fromId:previous,toId:id,cooldown:300});
    if(automatic){
     if(playedAutomatically.has(id)){
      emit("issue","Possibile ripetizione in shuffle",
       "Il brano "+id+" è ricomparso nella sequenza automatica osservata. Verificare se il ciclo era già terminato.",
       {trackId:id,fromId:previous,toId:id,cooldown:15000});
     }
     playedAutomatically.add(id);
    }
   }else emit("info","Lettore rilevato","Brano attuale: "+id,{trackId:id,cooldown:300});
   lastId=id;lastOverlap="";lastBlocker="";lastTime=null;lastEnded=false;
   snapshotVersion();
  }
  const now=Number(d.playbackTime);
  if(Number.isFinite(now)&&id&&id===lastId&&
   Number.isFinite(lastTime)&&lastTime>20&&now<4&&
   !audio?.seeking&&!lastSeek&&!lastEnded){
   emit("issue","Possibile ripartenza da zero",
    "Stesso brano "+id+": posizione "+lastTime.toFixed(1)+" s → "+now.toFixed(1)+" s, senza seek rilevato.",
    {trackId:id,cooldown:18000});
  }
  if(Number.isFinite(now))lastTime=now;
  if(d.liveTransition?.started){
   const t=d.liveTransition;
   const pair=String(t.fromId)+"|"+String(t.toId);
   if(lastOverlap!==pair){
    lastOverlap=pair;
    emit("overlap","Sovrapposizione audio realmente avviata",
      String(t.kind||"mix")+" · uscita "+t.fromId+" → ingresso "+t.toId+
      " · "+(Number.isFinite(Number(t.fade))?Number(t.fade).toFixed(2)+" s":"durata da misurare"),
      {trackId:id,fromId:t.fromId,toId:t.toId,cooldown:350});
   }
  }
  if(device==="iphone"&&d.enabled&&d.mobileMixLastBlocker&&
   d.plannedCue?.kind&&Number.isFinite(Number(d.remaining))&&
   Number(d.remaining)<20&&!d.liveTransition){
   const fingerprint=String(id)+"|"+String(d.next)+"|"+String(d.mobileMixLastBlocker);
   if(lastBlocker!==fingerprint){
    lastBlocker=fingerprint;
    emit("issue","Mix iPhone non avviato",
     String(d.mobileMixLastBlocker)+" · "+id+" → "+String(d.next),
     {trackId:id,fromId:id,toId:d.next,cooldown:25000});
   }
  }
  const shuffle=d.shuffleState||null,search=d.shuffleSearch||null;
  if(shuffle){
   if(search?.chosen&&shuffle.manualCount>0&&search.outgoing===id){
    emit("issue","Possibile conflitto shuffle / coda manuale",
     "Il DJ segnala una scelta automatica mentre sono presenti "+shuffle.manualCount+
     " brani manuali. Verificare la sequenza prima di concludere.",
     {trackId:id,cooldown:30000});
   }
   lastSelectedAuto=search?.outgoing===id?String(search.chosen||""):"";
   // This is an observation of the current cycle, never a global history.
   if(shuffle.autoCount===0&&shuffle.manualCount===0&&!search?.chosen)
    playedAutomatically.clear();
   lastShuffle={first:shuffle.first,manualCount:shuffle.manualCount,
    userReordered:shuffle.userReordered,autoCount:shuffle.autoCount};
  }
  lastDiag=d;
 }
 function status(){
  const d=getDiag();
  if(!d)return;
  diagnose(d);
  send({type:"status",data:{device,ts:new Date().toISOString(),
   diagnostics:d,profile:app()?.profile?.()||null,version}});
  lastStatusAt=Date.now();
 }
 if(channel)channel.onmessage=e=>{
  const msg=e.data;if(!msg||typeof msg!=="object")return;
  activeLabUntil=Date.now()+10000;
  if(msg.type==="hello"||msg.type==="catalog-request"){
   if(Date.now()-lastCatalogueAt>400||msg.type==="catalog-request")catalogue();
   status();
  }else if(msg.type==="status-request")status();
  else if(msg.type==="inspect"&&msg.requestId){
   let result=null;
   try{result=mix()?.inspectPair?.(String(msg.fromId||""),String(msg.toId||""))||null}
   catch(error){result={source:"musicbox-engine",device,approved:false,
    certified:false,beatCertified:false,reasons:["Errore nell'ispezione: "+String(error?.message||error).slice(0,100)]}}
   send({type:"inspect-response",requestId:msg.requestId,result});
  }
 };
 // The engine dispatches this only after HTMLAudioElement.play() or
 // Safari AudioBufferSourceNode.start() has actually succeeded.
 window.addEventListener("musicbox:mix-overlap",e=>{
  const t=e.detail||{};
  if(!t.fromId||!t.toId)return;
  lastOverlap=String(t.fromId)+"|"+String(t.toId);
  emit("overlap","Sovrapposizione audio realmente avviata",
   String(t.kind||"mix")+" · "+t.fromId+" → "+t.toId+
   " · ingresso reale a "+(Number(t.actualAt)||0).toFixed(2)+" s"+
   " · "+(Number(t.fade)||0).toFixed(2)+" s di mix previsto",
   {fromId:t.fromId,toId:t.toId,trackId:t.fromId,cooldown:350});
 });
 document.addEventListener("visibilitychange",()=>{
  const audio=app()?.audio?.(),playing=!!(audio&&!audio.paused);
  if(document.hidden){
   lastHidden={ts:Date.now(),position:audio?.currentTime??null,playing};
   emit("info","Music Box in background",
     "Pagina nascosta; la continuità audio sarà valutata al ritorno.",
     {trackId:app()?.currentId?.(),cooldown:1000});
  }else if(lastHidden){
   const elapsed=(Date.now()-lastHidden.ts)/1000;
   const progressed=Number(audio?.currentTime)-Number(lastHidden.position);
   emit("info","Music Box tornato in primo piano",
    "Dopo "+elapsed.toFixed(1)+" s · avanzamento player "+(
     Number.isFinite(progressed)?progressed.toFixed(1)+" s":"non disponibile")+
     ". Eventuali pause da cuffie o sistema richiedono verifica manuale.",
    {trackId:app()?.currentId?.(),cooldown:1000});
   lastHidden=null;
  }
 });
 window.addEventListener("pagehide",()=>{
  emit("info","Sessione Music Box sospesa",
   "La pagina è stata chiusa o il browser l'ha sospesa.",{cooldown:1000});
 });
 // The native audio, offline downloads and app initialization take precedence.
 setTimeout(()=>{snapshotVersion();catalogue();status()},1800);
 setInterval(()=>{
  if(document.hidden)return;
  if(!window.MusicBoxMix||!window.MusicBoxBridge)return;
  // Reduce diagnostic work when the Lab is not open, especially on iPhone.
  if(Date.now()>activeLabUntil&&Date.now()-lastStatusAt<9000)return;
  status();
  if(Date.now()-lastCatalogueAt>45000)catalogue();
 },1600);
})();
