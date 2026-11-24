"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const {chromium,webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const immersive=fs.readFileSync(path.join(root,"immersive.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const begin=html.indexOf('<div id="immersivePanel"');
const end=html.indexOf('<div class="lyrics-overlay"',begin);
assert.ok(begin>=0&&end>begin,"Immersive markup must exist");
const fragment=html.slice(begin,end);
const lyricsBegin=html.indexOf('<div class="lyrics-overlay"');
const lyricsEnd=html.indexOf('<div class="import-overlay" id="spotifyPanel"',lyricsBegin);
assert.ok(lyricsBegin>0&&lyricsEnd>lyricsBegin,"full lyrics markup must exist");
const lyricsFragment=html.slice(lyricsBegin,lyricsEnd);
assert.match(css,/\.im-root\.im-focus \.im-karaoke/);
assert.match(css,/env\(safe-area-inset-top\)/);
assert.match(fragment,/class="im-aura"/,"album artwork has its animated halo");
assert.match(fragment,/class="im-mini-spectrum"/,"decorative mini spectrum exists");
assert.match(css,/@keyframes im-orbit/,"cinematic orbit has a keyframe");
assert.doesNotMatch(immersive,/new Audio\s*\(|new AudioContext\s*\(/,
 "Immersive cannot create a second audio engine");
const fixture=[
 '<!doctype html><html lang="it"><head>',
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
 '<link rel="stylesheet" href="/style.css"></head><body>',
 '<button id="btnImmersive" hidden>Immersive</button>',
 '<button id="btnLyrics" hidden>Testi</button>',
 '<script>',
 'window.fakeAudio={currentTime:12,duration:240,paused:false};',
 'window.fakeSong={id:"track-a",title:"Notte stellata",artist:"Artista di prova",cover:""};',
 'window.fakeCalls={toggle:0,next:0,prev:0};',
 'window.fakeLyricsOffset=0;',
 'window.fakeDelaySaves=[];',
 'window.fakeLyrics={text:"",synced:Array.from({length:26},(_,i)=>({t:i*8,text:"Riga karaoke originale di prova "+(i+1)}))};',
 'window.MusicBoxBridge={',
 ' audio:()=>fakeAudio,currentId:()=>fakeSong.id,',
 ' allTracks:()=>[fakeSong],lyricsData:()=>fakeLyrics,',
 ' lyricsDelay:()=>fakeLyricsOffset,',
 ' setLyricsDelay:(id,value)=>{if(id!==fakeSong.id||!Number.isFinite(value))return false;',
 '   fakeLyricsOffset=Math.max(-8,Math.min(8,Math.round(value*10)/10));',
 '   fakeDelaySaves.push({id,value:fakeLyricsOffset});return true;},',
 ' togglePlayback:()=>{fakeAudio.paused=!fakeAudio.paused;fakeCalls.toggle++},',
 ' next:()=>{fakeCalls.next++;fakeSong.id="track-b";fakeSong.title="Secondo brano"},',
 ' previous:()=>{fakeCalls.prev++;fakeSong.id="track-c";fakeSong.title="Primo brano"}',
 '};',
 '</script>',
 fragment,
 lyricsFragment,
 '<script src="/immersive.js"></script>',
 '</body></html>'
].join("\n");
// Four-second synthetic silent H.264 fixture, generated with FFmpeg and ffprobe-verified.
const clip=Buffer.from("AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAANBbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAD6AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAmx0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAD6AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAACAAAAAgAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAA+gAAAAAAABAAAAAAHkbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAABAABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABj21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAU9zdGJsAAAAt3N0c2QAAAAAAAAAAQAAAKdhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAACAAIABIAAAASAAAAAAAAAABFUxhdmM2MS4xOS4xMDEgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAK/+EAFmdCwAraJbARAAADAAEAAAMABA8SJqABAARozg/IAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAAL4AAAAAAAAAGHN0dHMAAAAAAAAAAQAAAAgAACAAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAgAAAABAAAANHN0c3oAAAAAAAAAAAAAAAgAAAAZAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAABRzdGNvAAAAAAAAAAEAAANxAAAAYXVkdGEAAABZbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAsaWxzdAAAACSpdG9vAAAAHGRhdGEAAAABAAAAAExhdmY2MS43LjEwMwAAAAhmcmVlAAAAZ21kYXQAAAAVZYiEOhGKAAIlMcAAQOI4AAgpSddeAAAABkGaIBKiwAAAAAZBmkATosAAAAAGQZpgE6LAAAAABkGagBOiwAAAAAZBmqATosAAAAAGQZrAE6LAAAAABkGa4BOiwA==","base64");
const server=http.createServer((req,res)=>{
 const loc=new URL(req.url,"http://127.0.0.1").pathname;
 if(loc==="/fixture.mp4"){
  const headers={"Content-Type":"video/mp4","Accept-Ranges":"bytes","Cache-Control":"no-store"};
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||"");
  if(range){
   const start=Number(range[1]),end=Math.min(clip.length-1,range[2]?Number(range[2]):clip.length-1);
   if(start>end){res.writeHead(416,{"Content-Range":"bytes */"+clip.length});res.end();return}
   res.writeHead(206,{...headers,"Content-Length":end-start+1,"Content-Range":"bytes "+start+"-"+end+"/"+clip.length});
   res.end(clip.subarray(start,end+1));return;
  }
  res.writeHead(200,{...headers,"Content-Length":clip.length});res.end(clip);return;
 }

 const contents=loc==="/style.css"?css:loc==="/immersive.js"?immersive:fixture;
 res.writeHead(200,{"Content-Type":loc.endsWith(".css")?"text/css":
  loc.endsWith(".js")?"text/javascript":"text/html","Cache-Control":"no-store"});
 res.end(contents);
});
async function run(){
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const engine=process.env.IMMERSIVE_ENGINE==="webkit"?"webkit":"chromium";
 const browser=await (engine==="webkit"?webkit:chromium).launch({headless:true,
  ...(engine==="chromium"?{
   executablePath:fs.existsSync("/usr/bin/google-chrome")?"/usr/bin/google-chrome":undefined,
   args:["--autoplay-policy=no-user-gesture-required"]}:{} )});
 try{
  const sizes=[
   {name:"desktop",width:1360,height:900},
   {name:"iphone13",width:390,height:844},
   {name:"iphoneMini",width:375,height:667},
   {name:"iphoneMax",width:430,height:932},
   {name:"iphoneCompact",width:360,height:640}
  ];
  for(const size of sizes){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},
    ...(size.name!=="desktop"?{isMobile:true,hasTouch:true}:{}),reducedMotion:"reduce"});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"load"});
   await page.waitForFunction(()=>!document.getElementById("btnImmersive").hidden);
   await page.locator("#btnImmersive").click();
   await page.waitForFunction(()=>window.MusicBoxImmersive?.isOpen());
   await page.waitForFunction(()=>document.querySelectorAll("#imKaraoke .im-line").length===26);
   const state=await page.evaluate(()=>{
    const root=document.querySelector(".im-root"),player=document.querySelector(".im-player");
    return {title:document.getElementById("imTitle").textContent,
     lyricMode:document.getElementById("imLyricModeLabel").textContent,
     active:document.querySelector("#imKaraoke .im-line.active")?.textContent,
     panelRadius:getComputedStyle(player).borderRadius,
     coverWidth:document.querySelector(".im-cover").getBoundingClientRect().width,
     overflow:root.scrollWidth-root.clientWidth};
   });
   assert.equal(state.title,"Notte stellata");
   assert.equal(await page.locator("#imVideoToggle").isHidden(),true,"no guessed video for an audio-only song");
   assert.equal(await page.locator("#imVideo").getAttribute("src"),null);
   if(size.name==="desktop"){
    const layout=await page.evaluate(()=>{
     const rect=id=>document.getElementById(id).getBoundingClientRect();
     return {coverRight:rect("imCover").right,lyricsLeft:rect("imKaraoke").left,
      lyricsHeight:rect("imKaraoke").height,titleTop:rect("imTitle").top,
      coverBottom:rect("imCover").bottom,controlsBottom:rect("imToggle").bottom};
    });
    assert.ok(layout.coverRight<layout.lyricsLeft,"artwork left and lyrics right");
    assert.ok(layout.titleTop>=layout.coverBottom-5,"song title underneath artwork");
    assert.ok(layout.lyricsHeight>=350,"cinematic lyric stage is tall");
    assert.ok(layout.controlsBottom<=size.height,"desktop controls remain reachable");
   }
   const atmosphere=await page.evaluate(()=>({
    hue:getComputedStyle(document.getElementById("immersivePanel")).getPropertyValue("--im-hue").trim(),
    halo:!!document.querySelector(".im-aura"),
    satellites:document.querySelectorAll(".im-aura i").length,
    glowDisplay:getComputedStyle(document.querySelector(".im-ambient-bloom")).display,
    glowOpacity:parseFloat(getComputedStyle(document.querySelector(".im-ambient-bloom")).opacity),
    spectrumWidth:document.querySelector(".im-mini-spectrum").getBoundingClientRect().width,
    spectrum:document.querySelectorAll(".im-mini-spectrum span").length,
    entering:document.getElementById("immersivePanel").classList.contains("im-track-enter")
   }));
   assert.match(atmosphere.hue,/^\d+$/,"track has a themed color");
   assert.equal(atmosphere.halo,true);
   assert.equal(atmosphere.satellites,2,"orbit dots are included in stage");
   assert.equal(atmosphere.glowDisplay,"block","glow must actually render on phones");
   assert.ok(atmosphere.glowOpacity>=.5,"glow must not be almost transparent");
   assert.ok(atmosphere.spectrumWidth>=65,"decorative spectrum must be noticeable");
   assert.equal(atmosphere.spectrum,9);
   assert.equal(atmosphere.entering,true);
   assert.equal(state.lyricMode,"SINCRONIZZATO PER FRASI");
   assert.match(state.active,/prova 2/);
   assert.ok(state.coverWidth>120,"album cover remains visible");
   // Check the rendered SVG, not just aria labels: assigning .hidden on
   // SVGElement may be a no-op in Safari, showing both icons at once.
   assert.equal(await page.locator("#imToggle .im-play-icon").isVisible(),false,
    "Playing state must hide the play triangle");
   assert.equal(await page.locator("#imToggle .im-pause-icon").isVisible(),true,
    "Playing state must show the pause bars");
   assert.ok(state.overflow<=3,"no horizontal overflow: "+size.name);
   assert.equal(await page.locator("#imSyncToggle").isVisible(),true,
    "timed lyrics show an accessible sync control");
   await page.locator("#imSyncToggle").click();
   assert.equal(await page.locator("#imSyncToggle").getAttribute("aria-expanded"),"true");
   assert.equal(await page.locator("#imSyncValue").textContent(),"0,0 s");
   await page.locator("#imSyncEarlier").click();
   assert.equal(await page.evaluate(()=>fakeLyricsOffset),-.2,"earlier adjusts the existing saved delay");
   assert.equal(await page.locator("#imSyncValue").textContent(),"-0,2 s");
   await page.locator("#imSyncLater").click();
   assert.equal(await page.evaluate(()=>fakeLyricsOffset),0);
   await page.locator("#imSyncEarlier").click();
   await page.locator("#imSyncReset").click();
   assert.equal(await page.evaluate(()=>fakeLyricsOffset),0,"reset restores the baseline");
   await page.locator("#imSyncToggle").click();
   assert.equal(await page.locator("#imSyncPanel").isHidden(),true);
   await page.evaluate(()=>{
     fakeAudio.currentTime=8.1;fakeLyricsOffset=.25;
   });
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("prova 1"));
   await page.evaluate(()=>{fakeAudio.currentTime=8.4;});
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("prova 2"));
   await page.evaluate(()=>{fakeAudio.currentTime=12;});
   const mobile=await page.evaluate(()=>{
    const root=document.getElementById("immersivePanel");
    const rect=id=>{
     const r=document.getElementById(id).getBoundingClientRect();
     return {top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),height:+r.height.toFixed(1)}
    };
    return {vh:window.innerHeight,scrollHeight:root.scrollHeight,
     playerBg:getComputedStyle(document.querySelector(".im-player")).backgroundColor,
     artTag:getComputedStyle(document.querySelector(".im-art-tag")).display,
     cover:rect("imCover"),title:rect("imTitle"),
     lyrics:rect("imKaraoke"),seek:rect("imSeek"),
     controls:rect("imToggle"),link:rect("imLyrics"),
     close:rect("imClose")};
   });
   if(size.name!=="desktop"){
    assert.equal(mobile.playerBg,"rgba(0, 0, 0, 0)",
     "mobile now-playing must not be a boxed desktop glass panel");
    assert.equal(mobile.artTag,"none",
     "mobile view should hide decorative caption");
    assert.ok(mobile.cover.height>=(size.height>740?180:120));
    assert.ok(mobile.close.bottom<size.height,"close button must remain reachable");
    if(size.height>=840){
     assert.ok(mobile.controls.bottom<=size.height,
      "playback must be visible without scrolling on a normal iPhone");
    }
   }
   console.log("[IMMERSIVE PHONE LAYOUT]",JSON.stringify({engine,screen:size.name,mobile}));
   await page.evaluate(()=>{
    const seek=document.getElementById("imSeek");
    seek.value="600";
    seek.dispatchEvent(new Event("input",{bubbles:true}));
    seek.dispatchEvent(new Event("change",{bubbles:true}));
   });
   assert.equal(await page.evaluate(()=>window.fakeAudio.currentTime),144);
   // At 144.00 the next line must NOT enter before its .25s offset.
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("18"));
   await page.evaluate(()=>{fakeAudio.currentTime=144.4;});
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("19"));
   await page.waitForFunction(()=>document.querySelector("#imKaraoke").scrollTop>20,null,{timeout:4000});
   const karaoke=await page.evaluate(()=>document.querySelector("#imKaraoke").scrollTop);
   assert.ok(karaoke>20,"synced karaoke scrolls to the active line");
   // The last line begins at 200s; the MP3 continues to 240s.
   // Do not leave it highlighted during a long vocal-free outro.
   await page.evaluate(()=>{fakeAudio.currentTime=220;});
   await page.waitForFunction(()=>!document.querySelector("#imKaraoke .im-line.active"));
   await page.evaluate(()=>{fakeAudio.currentTime=144.4;});
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("19"),
    null,{timeout:4000});
   await page.locator("#imFocusToggle").click();
   assert.equal(await page.locator("#imFocusToggle").getAttribute("aria-pressed"),"true");
   await page.waitForFunction(()=>document.getElementById("imKaraoke").clientHeight>=220,null,{timeout:4000});
   assert.ok(await page.locator("#imKaraoke").evaluate(el=>el.clientHeight)>=220,"focus lyric stage should expand");
   // Tap a timed phrase: jump to its LRC onset plus the user's delay,
   // never change the playback state and keep the original phrase intact.
   const phrase=page.locator("#imKaraoke .im-line").nth(5);
   assert.equal(await phrase.getAttribute("role"),"button");
   assert.equal(await phrase.getAttribute("tabindex"),"0");
   assert.match(await phrase.getAttribute("aria-label"),/Vai a 0:40/);
   await page.evaluate(()=>{fakeAudio.currentTime=12;});
   await phrase.evaluate(row=>row.click());
   assert.equal(await page.evaluate(()=>fakeAudio.currentTime),40.25,
    "clicking a synced phrase jumps to its true media-clock cue plus lyric delay");
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("prova 6"));
   assert.equal(await page.evaluate(()=>fakeAudio.paused),false,"seeking must not pause playback");
   // Keyboard users can navigate the same synced lines.
   await page.locator("#imKaraoke .im-line").nth(3).press("Enter");
   assert.equal(await page.evaluate(()=>fakeAudio.currentTime),24.25);
   await page.locator("#imKaraoke .im-line").nth(4).press("Space");
   assert.equal(await page.evaluate(()=>fakeAudio.currentTime),32.25);
   // In a shared listening room a local time assignment is forbidden.
   await page.evaluate(()=>{
    window.fakeRoomSeeks=[];
    window.MusicBoxRoom={isActive:()=>true,shouldPlay:()=>true,
     control:(name,payload)=>fakeRoomSeeks.push({name,payload})};
    document.querySelectorAll("#imKaraoke .im-line")[8].click();
   });
   const roomSeek=await page.evaluate(()=>window.fakeRoomSeeks);
   assert.deepEqual(roomSeek,[{name:"seek",payload:{seconds:64.25}}]);
   assert.equal(await page.evaluate(()=>fakeAudio.currentTime),32.25,
    "shared room routes seek to room owner instead of changing local audio");
   await page.evaluate(()=>{delete window.MusicBoxRoom;});
   // An unseekable audio source should fail closed, not set invalid time.
   await page.evaluate(()=>{
    fakeAudio.duration=NaN;
    document.querySelectorAll("#imKaraoke .im-line")[6].click();
   });
   assert.equal(await page.evaluate(()=>fakeAudio.currentTime),32.25);
   await page.evaluate(()=>{fakeAudio.duration=240;});
   // Dragging a lyric to scroll must not accidentally jump playback
   // even if Safari synthesizes a click after pointer/touch movement.
   const afterDrag=await page.evaluate(()=>{
    const row=document.querySelectorAll("#imKaraoke .im-line")[9],
      before=fakeAudio.currentTime;
    const opts={bubbles:true,clientX:110,clientY:220,button:0};
    row.dispatchEvent(new PointerEvent("pointerdown",opts));
    row.dispatchEvent(new PointerEvent("pointermove",{...opts,clientY:275}));
    row.dispatchEvent(new PointerEvent("pointerup",{...opts,clientY:275}));
    row.click();
    return {before,after:fakeAudio.currentTime};
   });
   assert.equal(afterDrag.after,afterDrag.before,
    "a drag across a lyric must not seek");
   await page.locator("#imToggle").click();
   await page.waitForFunction(()=>document.querySelector(".im-root").classList.contains("im-paused"));
   assert.equal(await page.evaluate(()=>window.fakeCalls.toggle),1);
   assert.equal(await page.locator("#imToggle").getAttribute("aria-label"),"Riprendi");
   assert.equal(await page.locator("#imToggle .im-play-icon").isVisible(),true,
    "Paused state must show only the play triangle");
   assert.equal(await page.locator("#imToggle .im-pause-icon").isVisible(),false,
    "Paused state must hide the pause bars");
   await page.locator("#imToggle").click();
   await page.waitForFunction(()=>!document.querySelector(".im-root").classList.contains("im-paused"));
   assert.equal(await page.evaluate(()=>window.fakeCalls.toggle),2);
   assert.equal(await page.locator("#imToggle .im-play-icon").isVisible(),false,
    "Resuming must hide the play triangle again");
   assert.equal(await page.locator("#imToggle .im-pause-icon").isVisible(),true,
    "Resuming must restore the pause bars");
   await page.locator("#imNext").click();
   await page.waitForFunction(()=>document.getElementById("imTitle").textContent==="Secondo brano");
   assert.equal(await page.evaluate(()=>window.fakeCalls.next),1);
   // Untimed lyrics do not have an acoustic onset; they must remain readable
   // but not clickable and must never fabricate a seek position.
   await page.evaluate(()=>{
    window.fakeLyrics={text:"Testo non sincronizzato\\nSeconda frase",synced:[]};
    fakeAudio.currentTime=27;
   });
   await page.waitForFunction(()=>document.getElementById("imLyricModeLabel").textContent==="TESTO NON SINCRONIZZATO");
   const plain=page.locator("#imKaraoke .im-line").first();
   assert.equal(await plain.getAttribute("role"),null);
   assert.equal(await page.locator("#imSyncToggle").isHidden(),true,
    "untimed text cannot be edited as synchronized phrases");
   await plain.evaluate(row=>row.click());
   assert.equal(await page.evaluate(()=>fakeAudio.currentTime),27,
    "untimed text must never seek");

   await page.evaluate(()=>{
    const el=document.getElementById("imKaraoke");
    // Touch() is not directly constructible on some desktop WebKit builds.
    // Dispatch real bubbling events with explicit coordinates in both engines.
    const down=new Event("touchstart",{bubbles:true});
    Object.defineProperty(down,"touches",{value:[{clientY:120}]});
    el.dispatchEvent(down);
    const up=new Event("touchend",{bubbles:true});
    Object.defineProperty(up,"changedTouches",{value:[{clientY:320}]});
    el.dispatchEvent(up);
   });
   assert.equal(await page.evaluate(()=>window.MusicBoxImmersive.isOpen()),true,
    "swiping the lyrics cannot dismiss immersive mode");

   if(size.name==="desktop"||size.name==="iphone13"){
    // Unsupported links are intentionally invisible and never loaded.
    await page.evaluate(()=>{fakeSong.id="external-video";fakeSong.videoUrl="https://www.youtube.com/watch?v=example";});
    await page.waitForTimeout(250);
    assert.equal(await page.locator("#imVideoToggle").isHidden(),true);
    assert.equal(await page.locator("#imVideo").getAttribute("src"),null);
    await page.evaluate(()=>{fakeSong.id="verified-video";fakeSong.videoUrl="/fixture.mp4";
     fakeAudio.currentTime=.5;fakeAudio.duration=4;fakeAudio.paused=false;});
    await page.waitForFunction(()=>!document.getElementById("imVideoToggle").hidden);
    // The test context uses reduced motion; explicit activation is required.
    await page.locator("#imVideoToggle").click();
    await page.waitForFunction(()=>document.getElementById("immersivePanel").classList.contains("im-video-live"),null,{timeout:12000});
    const visual=await page.evaluate(()=>{
     const v=document.getElementById("imVideo"),shell=document.querySelector(".im-shell"),shade=document.querySelector(".im-video-shade"),cover=document.getElementById("imCover");
     const b=document.getElementById("imToggle"),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     return {muted:v.muted,volume:v.volume,videoZ:Number(getComputedStyle(v).zIndex),shadeZ:Number(getComputedStyle(shade).zIndex),shellZ:Number(getComputedStyle(shell).zIndex),cover:getComputedStyle(cover).visibility,hit:b.contains(hit),pointer:getComputedStyle(v).pointerEvents};
    });
    assert.equal(visual.muted,true);
    assert.equal(visual.volume,0);
    assert.ok(visual.videoZ<visual.shadeZ&&visual.shadeZ<visual.shellZ,"video stays beneath shade and controls");
    assert.equal(visual.cover,"hidden","cover must not overlay the video");
    assert.equal(visual.hit,true,"play button remains the top clickable element");
    assert.equal(visual.pointer,"none");
    await page.evaluate(()=>fakeAudio.paused=true);
    await page.waitForFunction(()=>document.getElementById("imVideo").paused);
    await page.evaluate(()=>{fakeSong.id="no-video";delete fakeSong.videoUrl;});
    await page.waitForFunction(()=>document.getElementById("imVideoToggle").hidden&&
      !document.getElementById("immersivePanel").classList.contains("im-video-live")&&
      !document.getElementById("imVideo").hasAttribute("src"));
   }
   await page.screenshot({path:"/tmp/immersive-"+size.name+".png"});
   await page.keyboard.press("Escape");
   await page.waitForFunction(()=>!window.MusicBoxImmersive.isOpen());
   // Validate the separately opened full-lyrics sheet with a long text,
   // including on a compact iPhone. The controls must stay visible.
   const fullLyrics=await page.evaluate(()=>{
     const panel=document.getElementById("lyricsPanel"),body=document.getElementById("lyricsBody");
     panel.hidden=false;
     document.getElementById("lyricsTitle").textContent="Brano di prova";
     document.getElementById("lyricsSub").textContent="Artista";
     panel.classList.add("lyrics-full-view");
     document.getElementById("lyricsSyncControls").hidden=true;
     document.getElementById("lyricsReadingTools").hidden=false;
     body.classList.add("lyrics-plain");
     body.replaceChildren(...Array.from({length:14},(_,stanza)=>{
       const section=document.createElement("section");section.className="lyrics-verse";
       for(let i=0;i<5;i++){
         const p=document.createElement("p");p.className="lyr-line-full";
         p.textContent="Verso completo della canzone "+(stanza*5+i+1);
         section.appendChild(p);
       }
       return section;
     }));
     const card=panel.querySelector(".lyrics-card");
     const footer=panel.querySelector(".lyrics-pie").getBoundingClientRect(),
       viewport=window.innerHeight;
     // Backdrop intentionally extends beyond the screen for blur.
     // Measure actual content overflow inside the clipped sheet instead.
     return {width:card.scrollWidth-card.clientWidth,
       footerBottom:footer.bottom,viewport,bodyScroll:body.scrollHeight,
       bodyHeight:body.clientHeight,sliderVisible:
        document.getElementById("lyricsDelay").getBoundingClientRect().width>20,
       modeVisible:document.getElementById("lyricsMode").getBoundingClientRect().height>0};
   });
   assert.ok(fullLyrics.width<=3,"lyrics sheet must not overflow horizontally");
   assert.ok(fullLyrics.footerBottom<=fullLyrics.viewport+2,"footer must fit phone height");
   assert.ok(fullLyrics.bodyScroll>fullLyrics.bodyHeight,"long plain lyrics must scroll");
   assert.ok(fullLyrics.modeVisible,"reading mode must stay visible");
   const reader=await page.evaluate(()=>{
     const back=document.getElementById("lyricsBack").getBoundingClientRect();
     const controls=document.getElementById("lyricsReadingTools").getBoundingClientRect();
     const body=document.getElementById("lyricsBody");
     const theme=getComputedStyle(body).backgroundImage;
     return {backWidth:back.width,backBottom:back.bottom,controlsHeight:controls.height,
       darkTheme:theme.includes("gradient")&&!theme.includes("rgb(251, 248, 252)"),
       color:getComputedStyle(body.querySelector(".lyr-line-full")).color};
   });
   assert.ok(reader.backWidth>50&&reader.backBottom<=size.height,
    "Indietro must fit the device viewport "+size.name);
   assert.ok(reader.controlsHeight>0,"reader controls should be visible "+size.name);
   assert.ok(reader.darkTheme,"full lyrics must use the dark theme "+size.name);
   assert.equal(reader.color,"rgb(252, 246, 255)","lines must contrast with dark reading surface");
   console.log("[LYRICS MOBILE READER]",JSON.stringify({engine,screen:size.name,...reader}));
   assert.deepEqual(errors,[],"Unexpected browser errors: "+size.name);
   console.log("[IMMERSIVE UI]",JSON.stringify({engine,screen:size.name,state,
    karaokeScrolled:karaoke,focus:true,controls:true,errors:errors.length}));
   await context.close();
  }
  // Non-reduced-motion mode must actually animate, while pause halts the
  // decorative movement without creating a second audio engine.
  const motionContext=await browser.newContext({viewport:{width:390,height:844},
   isMobile:true,hasTouch:true,reducedMotion:"no-preference"});
  try{
   const motionPage=await motionContext.newPage();
   await motionPage.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"load"});
   await motionPage.locator("#btnImmersive").click();
   await motionPage.waitForFunction(()=>document.querySelector(".im-aura")&&
    document.getElementById("immersivePanel").classList.contains("im-track-enter"));
   const animation=await motionPage.evaluate(()=>({
    orbit:getComputedStyle(document.querySelector(".im-aura"),"::before").animationName,
    satellite:getComputedStyle(document.querySelector(".im-aura i")).animationName,
    ambient:getComputedStyle(document.querySelector(".im-ambient-bloom")).animationName,
    art:getComputedStyle(document.querySelector(".im-cover")).animationName,
    rootOverflow:document.querySelector(".im-root").scrollWidth-document.querySelector(".im-root").clientWidth
   }));
   assert.match(animation.orbit,/im-orbit/,"mobile halo rotates in normal motion");
   assert.match(animation.satellite,/im-orbit/,"mobile orbiting light rotates");
   assert.match(animation.ambient,/im-aurora-alive/,"mobile ambient scene actually moves");
   assert.match(animation.art,/im-album-breathe-visible/,"mobile cover motion must be visible");
   assert.ok(animation.rootOverflow<=3,"motion layers do not widen mobile page");
   await motionPage.locator("#imToggle").click();
   await motionPage.waitForFunction(()=>document.querySelector(".im-root").classList.contains("im-paused"));
   const state=await motionPage.evaluate(()=>
    getComputedStyle(document.querySelector(".im-aura"),"::before").animationPlayState);
   assert.equal(state,"paused","ambient animation pauses with playback");
  }finally{await motionContext.close()}
 }finally{await browser.close()}
}
run().then(()=>server.close(),e=>{
 console.error(e.stack||e);server.close();process.exitCode=1;
});