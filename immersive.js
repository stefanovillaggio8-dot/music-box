/* Music Box · Immersive Mode. Visual-only overlay; never owns/replaces audio. */
(function(){
"use strict";
const $=id=>document.getElementById(id), api=()=>window.MusicBoxBridge;
let opened=false,lastId="",lastLyrics=null,lastLyricsId="",lastLine=-1,anim=0,lyricAnimation=0,gestureY=null,focusBefore=null,lockBefore=false,lastLyricsRefreshAt=0;
let lastLyricsSignature="",lyricRows=[],lyricTimed=false,lastLyricScrollAt=0;
let lyricPointer=null,suppressLyricTapUntil=0;
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
// The atmosphere follows the track identity without reading artwork pixels,
// touching the audio pipeline, or requesting a second decoder on iOS.
function atmosphereForTrack(id,title,artist){
 const root=$("immersivePanel");if(!root)return;
 const key=String(id||"")+"|"+String(title||"")+"|"+String(artist||"");
 let hash=2166136261;
 for(let i=0;i<key.length;i++)hash=Math.imul(hash^key.charCodeAt(i),16777619)>>>0;
 // A restrained set of cinematic hues; the real artwork remains the background.
 const palette=[206,224,248,267,290,319,348,176];
 const hue=palette[hash%palette.length];
 root.style.setProperty("--im-hue",String(hue));
 root.style.setProperty("--im-hue-alt",String((hue+56)%360));
 root.classList.remove("im-track-enter");
 // Restart a short entrance animation only when the actual recording changes.
 // This is one layout read per track change, never per audio frame.
 void root.offsetWidth;
 root.classList.add("im-track-enter");
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
 $("imCover").setAttribute("aria-label",img?"Copertina di "+title:"Copertina non disponibile per "+title);
 $("imBackdrop").classList.toggle("im-no-cover",!img);
 atmosphereForTrack(id,title,artist);
 lastLyricsId="";
 lastLyrics=null;
 lastLine=-1;
 lastLyricsSignature="";lyricRows=[];lyricTimed=false;lastLyricScrollAt=0;
 lyricPointer=null;suppressLyricTapUntil=0;
 $("imKaraoke").textContent="";
 $("imKaraoke").classList.remove("has-lines");
 renderLyrics(true);
}
function renderLyrics(force){
 const b=api(),id=b?.currentId?.(),karaoke=$("imKaraoke");
 if(!opened||!id||!karaoke)return;
 if(lastLyricsId!==id||force){
  const incoming=b?.lyricsData?.()||null;
  // A deferred lyric-provider callback can still expose the previous
  // recording during DJ handoff. Never show that text on the new song.
  const next=incoming?.id!=null&&String(incoming.id)!==String(id)?
   null:incoming;
  const signature=JSON.stringify([next?.text||"",next?.synced||[]]);
  if(lastLyricsId!==id||signature!==lastLyricsSignature){
   lastLyrics=next;lastLyricsId=id;lastLyricsSignature=signature;lastLine=-1;
   // ASR-corrected starts may reorder adjacent LRC lines; the binary-like
   // media-clock scan below must always receive chronological cues.
   const synced=Array.isArray(next?.synced)?
    next.synced.filter(row=>Number.isFinite(Number(row?.t))&&String(row?.text||"").trim())
     .sort((a,b)=>Number(a.t)-Number(b.t)):[];
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
   lyricRows=(lyricTimed?synced.map(row=>({text:String(row.text).trim(),t:Number(row.t),
      ...(row.end!=null&&Number.isFinite(Number(row.end))?{end:Number(row.end)}:{}),
      ...(Array.isArray(row.words)?{words:row.words}:{}),
      ...(row.partialAudio?{partialAudio:true,acousticSpans:row.acousticSpans}:{}),
      ...(row.sourceT!=null&&Number.isFinite(Number(row.sourceT))?{sourceT:Number(row.sourceT)}:{}),
      ...(row.estimated?{estimated:true}:{})})):
    plainRows.map(text=>({text}))).slice(0,500);
   if(!lyricRows.length)lyricRows=[{text:"Musica, luci e atmosfera."}];
   const fragment=document.createDocumentFragment();
   for(let i=0;i<lyricRows.length;i++){
    const data=lyricRows[i],row=document.createElement("p");
    row.className="im-line";
    data._elements=[]; // Display full phrases, never estimated word progress.
    row.textContent=data.text;
    // Only timed cues can seek; never guess locations from plain lyrics.
    if(lyricTimed&&Number.isFinite(data.t)&&data.t>=0){
     row.classList.add("im-seekable");
     row.dataset.seekIndex=String(i);
     row.tabIndex=0;
     row.setAttribute("role","button");
     row.setAttribute("aria-label","Vai a "+fmt(data.t)+": "+data.text);
     row.title="Vai a "+fmt(data.t);
    }
    fragment.appendChild(row);
   }
   karaoke.replaceChildren(fragment);
   karaoke.classList.toggle("has-lines",!!next?.text||lyricTimed);
   karaoke.classList.toggle("approximate",!lyricTimed);
   const status=$("imLyricModeLabel");
   if(status)status.textContent=lyricTimed?
     "SINCRONIZZATO PER FRASI":next?.text?"TESTO NON SINCRONIZZATO":"SOLO MUSICA";
   karaoke.scrollTop=0;
  }
  lastLyricsRefreshAt=Date.now();
 }
 const audio=b?.audio?.(),time=Math.max(0,Number(audio?.currentTime)||0);
 // LRC timestamps are line onsets. Never highlight before the onset:
 // an adjustable positive delay makes the lyrics enter later, not earlier.
 const delay=Number(b?.lyricsDelay?.(id));
 const adjusted=time-(Number.isFinite(delay)?delay:0);
 let index=lyricTimed?-1:0;
 if(lyricTimed){
  for(let i=0;i<lyricRows.length;i++){
   if(lyricRows[i].t<=adjusted)index=i;
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
 if(lyricTimed&&index===lyricRows.length-1){
  const last=lyricRows[index],lastWord=last.words?.[last.words.length-1];
  const wordEnd=Number(lastWord?.end);
  const phraseEnd=Number(last.end);
  const measuredExpiry=Number.isFinite(phraseEnd)&&phraseEnd>=last.t?
    phraseEnd+2.5:Number.isFinite(wordEnd)&&wordEnd>=last.t?
    wordEnd+2.5:last.t+9;
  const partialEnd=Math.max(-Infinity,...(last.acousticSpans||[]).map(w=>Number(w.end)).filter(Number.isFinite));
  const expiry=Math.max(measuredExpiry,partialEnd+2.5);
  // A missing final LRC line must NOT leave an unrelated phrase
  // brightly active throughout a long instrumental outro.
  if(adjusted>expiry)index=lyricRows.length;
 }
 // A verified phrase can finish well before the next lyric cue.
 // During instrumental gaps clear its highlight without advancing to a
 // future line or marking unsung verses as already performed.
 // Never guess the end from unverified LRC line-start timestamps.
 if(lyricTimed&&index>=0&&index<lyricRows.length-1){
  const row=lyricRows[index],next=lyricRows[index+1];
  const end=row.end!=null?Number(row.end):
   row.estimated!==true&&row.words?.length?
    Number(row.words[row.words.length-1]?.end):NaN;
  const nextAt=Number(next.t);
  if(Number.isFinite(end)&&end>=row.t&&Number.isFinite(nextAt)&&
     nextAt-end>4&&adjusted>end+1.5){
   if(lastLine>=0&&lastLine<karaoke.children.length)
    karaoke.children[lastLine].classList.remove("active");
   lastLine=-1;
   return;
  }
 }
 if(index===lastLine){
  if(index>=0&&index<lyricRows.length)
   window.MusicBoxWordKaraoke?.paintWords(
    lyricRows[index],lyricRows[index]._elements,adjusted);
  return;
 }
 // Only the changed passage needs DOM class updates. Toggling all 500
 // rows at every sung line caused layout/style stalls on GPU-busy desktops.
 const previous=lastLine;
 lastLine=index;
 const lines=karaoke.children;
 if(previous>=0&&previous<lines.length)
  lines[previous].classList.remove("active");
 if(index>=0&&index<lines.length)
  lines[index].classList.add("active");
 if(index>previous){
  for(let i=Math.max(0,previous);i<index;i++)lines[i]?.classList.add("past");
 }else if(index<previous){
  for(let i=Math.max(0,index);i<previous;i++)lines[i]?.classList.remove("past");
 }
 const active=lines[index];
 if(active){
  window.MusicBoxWordKaraoke?.paintWords(
   lyricRows[index],lyricRows[index]._elements,adjusted);
  const top=Math.max(0,active.offsetTop-(karaoke.clientHeight-active.offsetHeight)/2);
  // A user seek can jump dozens of verses: cancel the previous smooth
  // animation instead of forcing Safari to finish it before showing lyrics.
  // Closely spaced rap/fast lyrics can change lines faster than Safari's
  // smooth-scroll animation finishes. Repeated animations then queue up,
  // appearing to freeze or lag despite correct media-clock timestamps.
  const now=performance.now();
  const rapid=lastLyricScrollAt>0&&now-lastLyricScrollAt<450;
  lastLyricScrollAt=now;
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  const jumped=Math.abs(index-previous)>3||audio?.seeking||rapid||reducedMotion;
  if(jumped){
   karaoke.style.scrollBehavior="auto";
   karaoke.scrollTop=top;
   karaoke.style.removeProperty("scroll-behavior");
  }else{
   try{karaoke.scrollTo({top,behavior:"smooth"})}
   catch(_){karaoke.scrollTop=top}
  }
 }
}
// Advance LRC lines at media-clock precision without repainting the player.
function precisionLyrics(){
 lyricAnimation=0;
 if(!opened||document.hidden)return;
 const a=api()?.audio?.();
 if(!a||a.paused||a.ended||a.seeking)return;
 renderLyrics(false);
 lyricAnimation=requestAnimationFrame(precisionLyrics);
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
 seek.style.setProperty("--im-progress",(Math.max(0,Math.min(1000,Number(seek.value)||0))/10)+"%");
 $("imCurrent").textContent=fmt(position);
 $("imDuration").textContent=fmt(length);
 const room=window.MusicBoxRoom;
 const paused=room?.isActive?.()&&typeof room.shouldPlay==="function"
  ? !room.shouldPlay():!a||a.paused;
 const toggle=$("imToggle");
 // SVGElement.hidden is not reliably reflected as the HTML hidden
 // attribute (notably on Safari/WebKit). Set real attributes so the
 // stylesheet's svg[hidden] rule actually hides the inactive symbol.
 const playIcon=toggle.querySelector(".im-play-icon");
 const pauseIcon=toggle.querySelector(".im-pause-icon");
 if(paused){
  playIcon.removeAttribute("hidden");
  pauseIcon.setAttribute("hidden","");
 }else{
  playIcon.setAttribute("hidden","");
  pauseIcon.removeAttribute("hidden");
 }
 toggle.setAttribute("aria-label",paused?"Riprendi":"Metti in pausa");
 toggle.setAttribute("aria-pressed",String(!paused));
 $("immersivePanel").classList.toggle("im-paused",paused);
 $("immersivePanel").classList.toggle("im-away",document.hidden);
 $("imState").textContent=window.MusicBoxRoom?.isActive?.()?"ASCOLTO CONDIVISO":"ORA IN RIPRODUZIONE";
 $("imVisualizer").classList.toggle("im-stopped",!a||a.paused);
 if(Date.now()-lastLyricsRefreshAt>1800)renderLyrics(true);
 else renderLyrics(false);
 if(!lyricAnimation&&!document.hidden&&a&&!a.paused&&!a.ended&&!a.seeking)
   lyricAnimation=requestAnimationFrame(precisionLyrics);
 anim=window.setTimeout(paint,120);
}
function open(){
 if(opened||!api()?.audio?.())return;
 const root=$("immersivePanel");if(!root)return;
 focusBefore=document.activeElement;
 opened=true;lastId="";lastLyricsId="";
 root.classList.remove("im-focus");
 $("imFocusToggle").setAttribute("aria-pressed","false");
 $("imFocusToggle").innerHTML='Focus testo <span aria-hidden="true">⤢</span>';
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
 lyricPointer=null;suppressLyricTapUntil=0;
 if(anim)clearTimeout(anim);anim=0;
 if(lyricAnimation)cancelAnimationFrame(lyricAnimation);
 lyricAnimation=0;
 $("immersivePanel").hidden=true;
 $("btnImmersive")?.setAttribute("aria-expanded","false");
 if(!lockBefore)document.body.classList.remove("no-scroll");
 try{focusBefore?.focus?.({preventScroll:true})}catch(e){}
}
function toggle(){opened?close():open()}
function toggleFocus(){
 if(!opened)return;
 const enabled=$("immersivePanel").classList.toggle("im-focus"),button=$("imFocusToggle");
 button.setAttribute("aria-pressed",String(enabled));
 button.setAttribute("aria-label",enabled?"Riduci il testo":"Ingrandisci il testo");
 button.innerHTML=enabled?'Mostra copertina <span aria-hidden="true">⤡</span>':
  'Focus testo <span aria-hidden="true">⤢</span>';
 lastLine=-1;renderLyrics(false);
}
function seekToPhrase(target){
 if(!opened||!lyricTimed)return;
 const karaoke=$("imKaraoke"),line=target?.closest?.(".im-line[data-seek-index]");
 if(!line||line.parentElement!==karaoke)return;
 const index=Number(line.dataset.seekIndex),id=api()?.currentId?.();
 if(!Number.isSafeInteger(index)||index<0||index>=lyricRows.length||
    String(id)!==String(lastLyricsId))return; // Handoff or stale text.
 const cue=lyricRows[index],b=api(),a=b?.audio?.();
 const start=Number(cue?.t),duration=Number(a?.duration);
 if(!a||!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<=0)return;
 // Positive lyric delay means a phrase is shown later than the raw LRC onset.
 const delay=Number(b?.lyricsDelay?.(id));
 const seconds=Math.max(0,Math.min(duration,start+(Number.isFinite(delay)?delay:0)));
 const room=window.MusicBoxRoom;
 if(room?.isActive?.())room.control("seek",{seconds});
 else{try{a.currentTime=seconds}catch(e){return}}
 // Keep the same paused/playing state. Room seeks become visible when
 // the room's authoritative media clock catches up.
 $("imCurrent").textContent=fmt(seconds);
 if(!room?.isActive?.())renderLyrics(false);
}
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
 $("imFocusToggle")?.addEventListener("click",toggleFocus);
 $("imSeek")?.addEventListener("change",seekTo);
 const karaoke=$("imKaraoke");
 // Use event delegation because lyric rows are replaced when the track changes.
 // Pointer movement protects manual scrolling from becoming accidental seeks.
 karaoke?.addEventListener("pointerdown",e=>{
  if(!e.target?.closest?.(".im-seekable")||e.button!==0)return;
  lyricPointer={x:e.clientX,y:e.clientY,scroll:karaoke.scrollTop};
 });
 karaoke?.addEventListener("pointermove",e=>{
  if(lyricPointer&&(Math.abs(e.clientX-lyricPointer.x)>12||
      Math.abs(e.clientY-lyricPointer.y)>12))
   suppressLyricTapUntil=performance.now()+600;
 },{passive:true});
 karaoke?.addEventListener("pointerup",e=>{
  if(lyricPointer&&(Math.abs(e.clientX-lyricPointer.x)>12||
      Math.abs(e.clientY-lyricPointer.y)>12||
      Math.abs(karaoke.scrollTop-lyricPointer.scroll)>12))
   suppressLyricTapUntil=performance.now()+600;
  lyricPointer=null;
 });
 karaoke?.addEventListener("pointercancel",()=>{
  lyricPointer=null;suppressLyricTapUntil=performance.now()+600;
 });
 // Safari may issue touch events even when pointer events are coalesced.
 let touchStart=null;
 karaoke?.addEventListener("touchstart",e=>{
  const t=e.touches?.[0];
  touchStart=t?{x:t.clientX,y:t.clientY,scroll:karaoke.scrollTop}:null;
 },{passive:true});
 karaoke?.addEventListener("touchmove",e=>{
  const t=e.touches?.[0];
  if(touchStart&&(Math.abs(t.clientX-touchStart.x)>12||
      Math.abs(t.clientY-touchStart.y)>12||
      Math.abs(karaoke.scrollTop-touchStart.scroll)>12))
   suppressLyricTapUntil=performance.now()+600;
 },{passive:true});
 karaoke?.addEventListener("touchend",e=>{
  const t=e.changedTouches?.[0];
  if(t&&touchStart&&(Math.abs(t.clientX-touchStart.x)>12||
      Math.abs(t.clientY-touchStart.y)>12||
      Math.abs(karaoke.scrollTop-touchStart.scroll)>12))
   suppressLyricTapUntil=performance.now()+600;
  touchStart=null;
 },{passive:true});
 karaoke?.addEventListener("touchcancel",()=>{
  touchStart=null;suppressLyricTapUntil=performance.now()+600;
 },{passive:true});
 karaoke?.addEventListener("click",e=>{
  if(performance.now()<suppressLyricTapUntil)return;
  seekToPhrase(e.target);
 });
 karaoke?.addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ")return;
  if(!e.target?.matches?.(".im-seekable"))return;
  e.preventDefault();
  seekToPhrase(e.target);
 });
 $("imSeek")?.addEventListener("input",()=>{
  const a=api()?.audio?.(),seek=$("imSeek");
  $("imCurrent").textContent=fmt((Number(a?.duration)||0)*Number(seek.value)/1000);
  seek.style.setProperty("--im-progress",(Number(seek.value)/10)+"%");
 });
 const root=$("immersivePanel");
 root?.addEventListener("pointerdown",e=>{if(e.target===root)close()});
 // A swipe inside karaoke must SCROLL the lyrics, not dismiss the player.
 root?.addEventListener("touchstart",e=>{
  const target=e.target;
  const dismissible=target===root||target.closest?.(".im-head");
  gestureY=dismissible?e.touches?.[0]?.clientY??null:null;
 },{passive:true});
 root?.addEventListener("touchend",e=>{
  if(gestureY!=null&&e.changedTouches?.[0]?.clientY-gestureY>140)close();
  gestureY=null;
 },{passive:true});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&opened){e.preventDefault();close()}});
 window.addEventListener("popstate",()=>{if(opened)close()});
 const btn=$("btnImmersive");
 if(btn){btn.hidden=false;btn.disabled=false;btn.setAttribute("aria-expanded","false")}
}
window.MusicBoxImmersive={open,close,isOpen:()=>opened};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
