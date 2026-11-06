/* Music Box · Immersive Mode. Visual-only overlay; never owns/replaces audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id), api=()=>window.MusicBoxBridge;
let opened=false,lastId="",lastLyrics=null,lastLyricsId="",lastLine=-1,anim=0,gestureY=null,focusBefore=null,lockBefore=false,lastLyricsRefreshAt=0;
let lastLyricsSignature="",lyricRows=[],lyricTimed=false;
const fmt=n=>{const value=Number(n);const s=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
function safeCover(t){
 const value=t?.cover;
 if(typeof value!=="string"||!value.trim())return "";
 try{
  const uri=new URL(value,document.baseURI);
  if(uri.protocol==="https:"||uri.protocol==="http:"||uri.protocol==="blob:"||uri.protocol==="data:")return uri.href;
 }catch(e){}
 return "";
}
function fillCurrent(){
 const b=api(),id=b?.currentId?.(),t=b?.allTracks?.()?.find(x=>x.id===id);
 if(!opened)return;
 const title=t?.title||"Nessuna traccia",artist=t?.artist||"Music Box",img=safeCover(t);
 $("imTitle").textContent=title;
 $("imArtist").textContent=artist;
 $("imCover").style.backgroundImage=img?"url("+JSON.stringify(img)+")":"";
 $("imBackdrop").style.backgroundImage=img?"url("+JSON.stringify(img)+")":"";
 $("imCover").classList.toggle("im-no-cover",!img);
 $("imBackdrop").classList.toggle("im-no-cover",!img);
 lastLyricsId="";
 lastLyrics=null;
 lastLine=-1;
 lastLyricsSignature="";lyricRows=[];lyricTimed=false;
 $("imKaraoke").textContent="";
 $("imKaraoke").classList.remove("has-lines");
 renderLyrics(true);
}
function renderLyrics(force){
 const b=api(),id=b?.currentId?.(),karaoke=$("imKaraoke");
 if(!opened||!id||!karaoke)return;
 if(lastLyricsId!==id||force){
  const next=b?.lyricsData?.()||null;
  const signature=JSON.stringify([next?.text||"",next?.synced||[]]);
  if(lastLyricsId!==id||signature!==lastLyricsSignature){
   lastLyrics=next;lastLyricsId=id;lastLyricsSignature=signature;lastLine=-1;
   const synced=Array.isArray(next?.synced)?
    next.synced.filter(row=>Number.isFinite(Number(row?.t))&&String(row?.text||"").trim()):[];
   lyricTimed=synced.length>=3;
   const plain=String(next?.text||"").trim();
   let plainRows=plain.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
   // Untimed text has no timestamps. Reflow a large paragraph into rows.
   if(!lyricTimed&&plainRows.length<2&&plain.length>110){
    plainRows=[];let row="";
    for(const word of plain.split(/\s+/)){
     if(row&&row.length+word.length+1>58){plainRows.push(row);row=""}
     row+=(row?" ":"")+word;
    }
    if(row)plainRows.push(row);
   }
   lyricRows=(lyricTimed?synced.map(row=>({text:String(row.text).trim(),t:Number(row.t)})):
    plainRows.map(text=>({text}))).slice(0,500);
   if(!lyricRows.length)lyricRows=[{text:"Musica, luci e atmosfera."}];
   const fragment=document.createDocumentFragment();
   for(const data of lyricRows){
    const row=document.createElement("p");
    row.className="im-line";row.textContent=data.text;
    fragment.appendChild(row);
   }
   karaoke.replaceChildren(fragment);
   karaoke.classList.toggle("has-lines",!!next?.text||lyricTimed);
   karaoke.classList.toggle("approximate",!lyricTimed);
   karaoke.scrollTop=0;
  }
  lastLyricsRefreshAt=Date.now();
 }
 const audio=b?.audio?.(),time=Math.max(0,Number(audio?.currentTime)||0);
 let index=0;
 if(lyricTimed){
  for(let i=0;i<lyricRows.length;i++){
   if(lyricRows[i].t<=time+.15)index=i;
   else break;
  }
 }else if(lyricRows.length>1){
  // Plain text follows approximate playback progress, NOT fake LRC timings.
  const duration=Number(audio?.duration)||0;
  if(duration>1){
   const progress=Math.min(1,Math.max(0,(time-3)/Math.max(1,duration-9)));
   index=Math.min(lyricRows.length-1,Math.floor(progress*lyricRows.length));
  }
 }
 if(index===lastLine)return;
 lastLine=index;
 for(let i=0;i<karaoke.children.length;i++)
  karaoke.children[i].classList.toggle("active",i===index);
 const active=karaoke.children[index];
 if(active){
  const top=Math.max(0,active.offsetTop-(karaoke.clientHeight-active.offsetHeight)/2);
  try{karaoke.scrollTo({top,behavior:"smooth"})}
  catch(_){karaoke.scrollTop=top}
 }
}
function paint(){
 if(!opened)return;
 const b=api(),a=b?.audio?.(),t=b?.allTracks?.()?.find(x=>x.id===b.currentId?.());
 if((b?.currentId?.()||"")!==lastId){lastId=b?.currentId?.()||"";fillCurrent()}
 const length=Number.isFinite(a?.duration)?Math.max(0,Number(a.duration)):0;
 const position=Number.isFinite(a?.currentTime)?Math.max(0,Number(a.currentTime)):0;
 const seek=$("imSeek");
 if(!seek.matches(":active")&&document.activeElement!==seek){
  seek.value=length?String(Math.min(1000,Math.round(position/length*1000))):"0";
 }
 $("imCurrent").textContent=fmt(position);
 $("imDuration").textContent=fmt(length);
 $("imToggle").textContent=a?.paused?"▶":"❚❚";
 $("imToggle").setAttribute("aria-label",a?.paused?"Riprendi":"Metti in pausa");
 $("imState").textContent=window.MusicBoxRoom?.isActive?.()?"ASCOLTO CONDIVISO":"ORA IN RIPRODUZIONE";
 $("imVisualizer").classList.toggle("im-stopped",!a||a.paused);
 if(Date.now()-lastLyricsRefreshAt>3500)renderLyrics(true);
 else renderLyrics(false);
 anim=window.setTimeout(paint,120);
}
function open(){
 if(opened||!api()?.audio?.())return;
 const root=$("immersivePanel");if(!root)return;
 focusBefore=document.activeElement;
 opened=true;lastId="";lastLyricsId="";
 lockBefore=document.body.classList.contains("no-scroll");
 root.hidden=false;
 document.body.classList.add("no-scroll");
 $("btnImmersive")?.setAttribute("aria-expanded","true");
 paint();
 $("imClose").focus({preventScroll:true});
}
function close(){
 if(!opened)return;
 opened=false;
 if(anim)clearTimeout(anim);anim=0;
 $("immersivePanel").hidden=true;
 $("btnImmersive")?.setAttribute("aria-expanded","false");
 if(!lockBefore)document.body.classList.remove("no-scroll");
 try{focusBefore?.focus?.({preventScroll:true})}catch(e){}
}
function toggle(){opened?close():open()}
function seekTo(){
 const b=api(),a=b?.audio?.();if(!a||!Number.isFinite(a.duration)||a.duration<=0)return;
 const seconds=Math.min(a.duration,Math.max(0,Number($("imSeek").value)/1000*a.duration));
 if(window.MusicBoxRoom?.isActive?.())window.MusicBoxRoom.control("seek",{seconds});
 else {try{a.currentTime=seconds}catch(e){}}
 $("imCurrent").textContent=fmt(seconds);
}
function togglePlayback(){
 const b=api();
 if(window.MusicBoxRoom?.isActive?.()){
  const desired=window.MusicBoxRoom.shouldPlay?.();
  window.MusicBoxRoom.control(desired?"pause":"play");
 }else b?.togglePlayback?.();
}
function goNext(){const b=api();if(window.MusicBoxRoom?.isActive?.())window.MusicBoxRoom.control("next");else b?.next?.()}
function goBack(){const b=api();if(window.MusicBoxRoom?.isActive?.())window.MusicBoxRoom.control("previous");else b?.previous?.()}
function textPanel(){
 close();
 const button=$("btnLyrics");
 if(button&&!button.hidden)button.click();
 else api()?.toast?.("Il testo di questa canzone non è ancora disponibile.");
}
function start(){
 $("btnImmersive")?.addEventListener("click",toggle);
 $("imClose")?.addEventListener("click",close);
 $("imToggle")?.addEventListener("click",togglePlayback);
 $("imPrev")?.addEventListener("click",goBack);
 $("imNext")?.addEventListener("click",goNext);
 $("imLyrics")?.addEventListener("click",textPanel);
 $("imSeek")?.addEventListener("change",seekTo);
 $("imSeek")?.addEventListener("input",()=>{const a=api()?.audio?.();$("imCurrent").textContent=fmt((Number(a?.duration)||0)*Number($("imSeek").value)/1000)});
 const root=$("immersivePanel");
 root?.addEventListener("pointerdown",e=>{if(e.target===root)close()});
 root?.addEventListener("touchstart",e=>{gestureY=e.touches?.[0]?.clientY??null},{passive:true});
 root?.addEventListener("touchend",e=>{if(gestureY!=null&&e.changedTouches?.[0]?.clientY-gestureY>140)close();gestureY=null},{passive:true});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&opened){e.preventDefault();close()}});
 window.addEventListener("popstate",()=>{if(opened)close()});
 const btn=$("btnImmersive");
 if(btn){btn.hidden=false;btn.disabled=false;btn.setAttribute("aria-expanded","false")}
}
window.MusicBoxImmersive={open,close,isOpen:()=>opened};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();