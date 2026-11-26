"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const {chromium,webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const immersive=fs.readFileSync(path.join(root,"immersive.js"),"utf8");
const scenes=fs.readFileSync(path.join(root,"immersive-scenes.js"),"utf8");
const animation=fs.readFileSync(path.join(root,"immersive-animation.js"),"utf8");
const textures=fs.readFileSync(path.join(root,"immersive-textures.webp"));
const photographedTextures=fs.readFileSync(path.join(root,"immersive-kid-yugi.webp"));
const libraryTextures=fs.readFileSync(path.join(root,"immersive-ste.webp"));
const referenceTextures=fs.readFileSync(path.join(root,"immersive-ste-references.webp"));
const videoStills=fs.readFileSync(path.join(root,"immersive-ste-video-stills.webp"));
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
 '<!doctype html><html lang="it"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
 '<link rel="stylesheet" href="/style.css"></head><body>',
 '<button id="btnImmersive" hidden>Immersive</button>',
 '<button id="btnLyrics" hidden>Testi</button>',
 '<script>',
 'window.fakeAudio={currentTime:12,duration:240,paused:false};',
 'window.fakeSong={id:"track-a",title:"Notte stellata",artist:"Artista di prova",cover:""};',
 'window.fakeLibraryTracks=[];',
 'window.fakeProfile="Ste";',
 'window.fakeCalls={toggle:0,next:0,prev:0};',
 'window.fakeLyricsOffset=0;',
 'window.fakeDelaySaves=[];',
 'window.fakeLyrics={text:"",synced:Array.from({length:26},(_,i)=>({t:i*8,text:"Riga karaoke originale di prova "+(i+1)}))};',
 'window.MusicBoxBridge={',
 ' profile:()=>fakeProfile,',
 ' audio:()=>fakeAudio,currentId:()=>fakeSong.id,',
 ' canUsePersonalCanvas:t=>fakeProfile==="Ste"&&Boolean(t?.id)&&t.id!=="gym-only",allTracks:()=>[fakeSong,...fakeLibraryTracks],lyricsData:()=>fakeLyrics,',
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
 '<script src="/immersive-scenes.js"></script>',
 '<script src="/immersive-animation.js"></script>',
 '<script src="/immersive.js"></script>',
 '</body></html>'
].join("\n");
// Four seconds of silent synthetic H.264. The browser decodes it over HTTP.
const clip=fs.readFileSync(path.join(__dirname,"fixtures","immersive-silent.mp4"));
const originalClips=Object.fromEntries(["eva","quanto-forte-ti-pensavo","per-una-notte-insieme","star-shopping"].map(name=>[
 "/immersive-loops/"+name+".mp4",fs.readFileSync(path.join(root,"immersive-loops",name+".mp4"))
]));
// Inject only synthetic test recordings. The production catalog stays intact.
const canvasFixtureEntries=Object.fromEntries(["short-loop","too-long"].map(id=>[id,{
 file:"songs/canvas-fixture.mp3",title:"Brano di prova",artist:"Artista di prova",
 kind:"official-loop",evidence:"https://example.test/test-permission",url:"/fixture.mp4"
}]));
const testImmersive=immersive.replace("const reviewedCanvasCatalog=Object.freeze({",
 match=>match+JSON.stringify(canvasFixtureEntries).slice(1,-1)+",");
const testScenes=scenes.replace("const scenes=Object.freeze({",match=>match+
 JSON.stringify(Object.fromEntries(Object.keys(canvasFixtureEntries).map(id=>[
  id,["songs/canvas-fixture.mp3","Brano di prova","Artista di prova","stars","violet","drift"]
 ]))).slice(1,-1)+",");
const server=http.createServer((req,res)=>{
 const loc=new URL(req.url,"http://127.0.0.1").pathname;
 if(loc==="/immersive-textures.webp"||loc==="/immersive-kid-yugi.webp"||loc==="/immersive-ste.webp"||loc==="/immersive-ste-references.webp"||loc==="/immersive-ste-video-stills.webp"){
  const image=loc==="/immersive-textures.webp"?textures:loc==="/immersive-kid-yugi.webp"?photographedTextures:loc==="/immersive-ste.webp"?libraryTextures:loc==="/immersive-ste-references.webp"?referenceTextures:videoStills;
  res.writeHead(200,{"Content-Type":"image/webp","Content-Length":image.length}).end(image);
  return;
 }
 const videoBytes=loc==="/fixture.mp4"?clip:originalClips[loc];
 if(videoBytes){
  const headers={"Content-Type":"video/mp4","Accept-Ranges":"bytes","Cache-Control":"no-store"};
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||"");
  if(range){
   const start=Number(range[1]),end=Math.min(videoBytes.length-1,range[2]?Number(range[2]):videoBytes.length-1);
   if(start>end){res.writeHead(416,{"Content-Range":"bytes */"+videoBytes.length});res.end();return}
   res.writeHead(206,{...headers,"Content-Length":end-start+1,"Content-Range":"bytes "+start+"-"+end+"/"+videoBytes.length});
   res.end(videoBytes.subarray(start,end+1));return;
  }
  res.writeHead(200,{...headers,"Content-Length":videoBytes.length});res.end(videoBytes);return;
 }

 const contents={"/style.css":css,"/immersive.js":testImmersive,"/immersive-scenes.js":testScenes,
  "/immersive-animation.js":animation}[loc]??fixture;
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
    const video=page.locator("#imVideo");
    const stage=page.locator("#imSongAnimation");
    const textureResponse=page.waitForResponse(res=>res.url().includes("/immersive-textures.webp")&&res.ok());
    const switchTrack=async(trackId,title="Brano di prova",file="songs/canvas-fixture.mp3",artist="Artista di prova")=>{
     await page.evaluate(({trackId,title,file,artist})=>{
      Object.assign(fakeSong,{id:trackId,file,title,artist});
      Object.assign(fakeAudio,{currentTime:123,duration:240,paused:false});
     },{trackId,title,file,artist});
     await page.waitForFunction(title=>document.getElementById("imTitle").textContent===title,title);
    };
    await page.evaluate(()=>{fakeSong.videoUrl="/fixture.mp4";fakeSong.musicVideoUrl="/fixture.mp4"});
    await switchTrack("b-track-179","Certe bugie");
    assert.equal(await page.locator("#imVideoToggle").isHidden(),true,"former full video stays disabled");
    assert.equal(await video.getAttribute("src"),null,"track metadata cannot load video");
    assert.equal(await page.locator("#immersivePanel iframe").count(),0);

    await switchTrack("short-loop","Versione diversa");
    assert.equal(await page.locator("#imVideoToggle").isHidden(),true,"the title must match the reviewed recording");
    await switchTrack("another-track","Brano senza animazione");
    await switchTrack("short-loop");
    assert.equal(await video.getAttribute("src"),null,"reduced motion requires explicit activation");
    await page.locator("#imClose").click();
    await page.emulateMedia({reducedMotion:"no-preference"});
    assert.equal(await video.getAttribute("src"),null,"no clip loads before entering immersive mode");
    if(size.name==="iphone13")await page.locator("#btnImmersive").tap();
    else await page.locator("#btnImmersive").click();
    await page.waitForFunction(()=>document.getElementById("immersivePanel").classList.contains("im-video-live"),null,{timeout:10000});
    const visual=await page.evaluate(()=>{
     const v=document.getElementById("imVideo"),shell=document.querySelector(".im-shell"),shade=document.querySelector(".im-video-shade");
     const b=document.getElementById("imToggle"),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     const lyrics=document.querySelector("#imKaraoke .im-line");
     return {
      muted:v.muted,inline:v.playsInline,
      videoZ:Number(getComputedStyle(v).zIndex),shadeZ:Number(getComputedStyle(shade).zIndex),shellZ:Number(getComputedStyle(shell).zIndex),
      hit:b.contains(hit),pointer:getComputedStyle(v).pointerEvents,
      lyricsVisible:getComputedStyle(lyrics).visibility==="visible",paused:fakeAudio.paused
     };
    });
    assert.ok(visual.muted&&visual.inline);
    assert.ok(visual.videoZ<visual.shadeZ&&visual.shadeZ<visual.shellZ);
    assert.ok(visual.hit&&visual.lyricsVisible&&!visual.paused);
    assert.equal(visual.pointer,"none");
    assert.equal(await stage.isHidden(),true,"an approved clip takes priority over generated art");
    assert.equal(await page.locator("#imAnimationLabel").isHidden(),true);
    const loopProof=await video.evaluate(v=>new Promise(resolve=>{
     let previous=v.currentTime,wraps=0;
     const finish=()=>{
      clearTimeout(deadline);
      v.removeEventListener("timeupdate",observe);
      resolve({wraps,time:v.currentTime,paused:v.paused,seeking:v.seeking,ready:v.readyState,error:v.error?.code});
     };
     const observe=()=>{
      const time=v.currentTime;
      if(previous>v.duration-1&&time<1)wraps++;
      previous=time;
      if(wraps>=2)finish();
     };
     const deadline=setTimeout(finish,12000);
     v.addEventListener("timeupdate",observe);
    }));
    assert.ok(loopProof.wraps>=2&&!loopProof.paused&&!loopProof.error,
     "the media clock must advance through two wraps: "+JSON.stringify(loopProof));
    assert.equal(await page.evaluate(()=>fakeAudio.currentTime),123,"loop does not seek the audio");

    await page.evaluate(()=>{fakeAudio.paused=true});
    await page.waitForFunction(()=>!document.getElementById("imVideo").hasAttribute("src"));
    await page.evaluate(()=>{fakeAudio.paused=false});
    await page.waitForFunction(()=>document.getElementById("immersivePanel").classList.contains("im-video-live"));
    await page.evaluate(()=>{
     Object.defineProperty(document,"hidden",{value:true,configurable:true});
     document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction(()=>!document.getElementById("imVideo").hasAttribute("src"));
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))});
    await page.waitForFunction(()=>document.getElementById("immersivePanel").classList.contains("im-video-live"));

    await switchTrack("another-track","Brano senza animazione");
    assert.equal(await page.locator("#imVideoToggle").isHidden(),true);
    assert.equal(await video.getAttribute("src"),null);
    await video.evaluate(v=>Object.defineProperty(v,"duration",{value:185,configurable:true}));
    await switchTrack("too-long");
    await stage.waitFor({state:"visible"});
    assert.equal(await video.getAttribute("src"),null,"a full-length response must be released");
    await video.evaluate(v=>{delete v.duration});

    await page.evaluate(()=>{fakeProfile="Diego"});
    await switchTrack("another-track","Brano senza animazione");
    await switchTrack("short-loop");
    assert.equal(await page.locator("#imVideoToggle").isHidden(),true,"the reviewed entry is exclusive to Ste");

    await page.evaluate(()=>{fakeProfile="Ste"});
    for(const [trackId,title,file,artist,asset,duration,version] of [
     ["b-track-34","Eva","songs/track-34.mp3","Kid Yugi, Tedua & Junior K","eva",6.76,"11"],
     ["b-track-2","QUANTO FORTE TI PENSAVO","songs/track-2.mp3","Madame","quanto-forte-ti-pensavo",6,"1"],
     ["b-track-160","Per una notte insieme","songs/track-160.mp3","Modà","per-una-notte-insieme",7,"1"],
     ["b-track-7","Star Shopping","songs/track-7.mp3","Lil Peep","star-shopping",7,"1"]
    ]){
     await switchTrack(trackId,title,file,artist);
     await page.waitForFunction(({asset,version})=>{
      const v=document.getElementById("imVideo");
      if(!v.currentSrc||v.currentTime<=.2||v.paused)return false;
      const url=new URL(v.currentSrc);
      return url.pathname.endsWith("/immersive-loops/"+asset+".mp4")&&url.searchParams.get("v")===version;
     },{asset,version},{timeout:12000});
     assert.ok(await video.evaluate((v,duration)=>v.muted&&v.playsInline&&v.duration===duration&&v.hasAttribute("data-music-box-clip"),duration));
     const frame=await video.evaluate(v=>{
      const rect=v.getBoundingClientRect(),style=getComputedStyle(v);
      return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,
       width:rect.width,height:rect.height,fit:style.objectFit,mask:style.maskImage,
       viewportWidth:innerWidth,viewportHeight:innerHeight,framing:v.dataset.musicBoxClip,
       sourceRatio:v.videoWidth/v.videoHeight};
     });
     const framedClips={eva:16/9};
     const framing=Object.hasOwn(framedClips,asset)?asset:"";
     assert.equal(frame.framing,framing);
     // The full scene, including the soft extension, fits in the viewport.
     const subjectRight=frame.right;
     assert.ok(frame.left>=-1&&frame.top>=-1&&subjectRight<=frame.viewportWidth+1&&frame.bottom<=frame.viewportHeight+1,
      "the subject fits in the viewport: "+JSON.stringify(frame));
     assert.ok(frame.fit==="contain"&&frame.mask.split("linear-gradient").length===3);
     assert.equal(frame.sourceRatio,framedClips[asset]??1);
     assert.ok(Math.abs(frame.width-frame.height*frame.sourceRatio)<1,"the encoded frame fits without cropping");
     assert.equal(await page.locator("#imAnimationLabel").isHidden(),false);
     assert.equal(await page.evaluate(()=>fakeAudio.currentTime),123);
    }
    await page.evaluate(()=>{fakeSong.cover="/immersive-textures.webp"});
    await switchTrack("b-track-30","Sintetico","songs/track-30.mp3","Kid Yugi");
    assert.equal(await video.getAttribute("src"),null,"Sintetico releases the previous clip");
    assert.equal(await stage.isHidden(),true);
    assert.equal(await page.locator("#imVideoToggle").isHidden(),true);
    assert.match(await page.locator("#imBackdrop").evaluate(el=>el.style.backgroundImage),/immersive-textures\.webp/);
    assert.equal(await page.evaluate(()=>fakeAudio.currentTime),123);
    const importer=page.locator("#imVideoImport");
    const choose=async files=>{
     const [chooser]=await Promise.all([page.waitForEvent("filechooser"),importer.click()]);
     await chooser.setFiles(files);
    };
    await importer.waitFor({state:"visible"});
    assert.equal(await importer.innerText(),"Aggiungi Canvas");
    await choose({name:"quadrato.mp4",mimeType:"video/mp4",buffer:clip});
    await page.waitForFunction(()=>!document.getElementById("imVideoImport").disabled);
    assert.equal(await video.getAttribute("src"),null,"a square local clip is rejected");
    await choose({
     name:"Canvas-16x9.mp4",mimeType:"video/mp4",buffer:originalClips["/immersive-loops/eva.mp4"]
    });
    const waitForPrivateCanvas=()=>page.waitForFunction(()=>{
     const v=document.getElementById("imVideo");
     return v.currentSrc.startsWith("blob:")&&v.currentTime>.2&&v.muted&&v.playsInline;
    });
    await waitForPrivateCanvas();
    const localUrl=await video.getAttribute("src");
    assert.equal(await video.getAttribute("data-music-box-clip"),"personal");
    assert.equal(await page.locator("#imAnimationLabel").innerText(),"Canvas personale");
    assert.equal(await importer.innerText(),"Cambia Canvas");
    await page.evaluate(()=>{fakeLibraryTracks=[{id:"allowed-a"},{id:"allowed-b"},{id:"gym-only"}]});
    await choose(["allowed-a","gym-only","allowed-b"].map(id=>({
     name:"Track ["+id+"].mp4",mimeType:"video/mp4",buffer:originalClips["/immersive-loops/eva.mp4"]
    })));
    await page.waitForFunction(()=>!document.getElementById("imVideoImport").disabled);
    const keys=await page.evaluate(()=>new Promise((resolve,reject)=>{
     const request=indexedDB.open("musicbox-local-canvases");
     request.onsuccess=()=>{
      const db=request.result,read=db.transaction("clips").objectStore("clips").getAllKeys();
      read.onsuccess=()=>{resolve(read.result);db.close()};
      read.onerror=()=>reject(read.error);
     };
     request.onerror=()=>reject(request.error);
    }));
    assert.deepEqual(keys,["Ste:allowed-a","Ste:allowed-b","Ste:b-track-30"]);
    await context.setOffline(true);
    await page.locator("#imClose").click();
    assert.equal(await video.getAttribute("src"),null,"closing releases the private clip");
    await page.locator("#btnImmersive").click();
    await waitForPrivateCanvas();
    assert.notEqual(await video.getAttribute("src"),localUrl,"reopening offline reads a fresh URL from storage");
    await context.setOffline(false);
    await page.evaluate(()=>{fakeProfile="Diego"});
    await page.waitForFunction(()=>document.getElementById("imVideoImport").hidden);
    assert.equal(await video.getAttribute("src"),null,"the private clip is scoped to Ste");
    await page.evaluate(()=>{fakeProfile="Ste"});
    await waitForPrivateCanvas();
    assert.equal(await page.evaluate(()=>fakeAudio.currentTime),123);
    await page.evaluate(()=>{fakeSong.cover=""});

    await switchTrack("b-track-27","Il Filmografo","songs/track-27.mp3","Kid Yugi");
    assert.equal(await video.getAttribute("src"),null,"changing away releases the clip");
    await page.locator("#imClose").click();
    assert.equal(await stage.isHidden(),true,"no art outside immersive mode");
    if(size.name==="iphone13")await page.locator("#btnImmersive").tap();
    else await page.locator("#btnImmersive").click();
    await stage.waitFor({state:"visible"});
    await page.locator("#imAnimationLabel").waitFor({state:"visible"});
    assert.equal(await page.locator("#imAnimationLabel").innerText(),"Animazione Music Box");
    assert.equal(await video.getAttribute("src"),null,"original Music Box art requires no video downloads");
    const shot=await stage.evaluate(node=>{
     const art=node.lastElementChild,shade=document.querySelector(".im-video-shade"),shell=document.querySelector(".im-shell");
     const lyric=document.querySelector("#imKaraoke .im-line.active"),r=lyric.getBoundingClientRect();
     const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     return {transform:getComputedStyle(art).transform,duration:parseFloat(getComputedStyle(art).animationDuration),
      width:art.width,height:art.height,layered:Number(getComputedStyle(node).zIndex)<Number(getComputedStyle(shade).zIndex)&&
       Number(getComputedStyle(shade).zIndex)<Number(getComputedStyle(shell).zIndex),
      lyricUsable:lyric.contains(hit),pointer:getComputedStyle(node).pointerEvents};
    });
    assert.ok(shot.layered&&shot.lyricUsable&&shot.pointer==="none",JSON.stringify(shot));
    assert.ok(shot.duration>=6&&shot.duration<=8&&shot.width<=640&&shot.height<=440);
    await page.waitForFunction(transform=>getComputedStyle(document.querySelector("#imSongAnimation canvas:last-child")).transform!==transform,shot.transform);
    const fingerprint=async()=>stage.evaluate(node=>{
     const pixels=node.lastElementChild.toDataURL();
     let hash=0;
     for(let i=0;i<pixels.length;i++)hash=Math.imul(hash,31)+pixels.charCodeAt(i)|0;
     return hash;
    });
    await textureResponse;
    const film=await fingerprint();
    await page.waitForFunction(previous=>{
     // Read actual canvas pixels. CSS panning alone would leave this bitmap unchanged.
     const pixels=document.querySelector("#imSongAnimation canvas:last-child").toDataURL();
     let hash=0;
     for(let i=0;i<pixels.length;i++)hash=Math.imul(hash,31)+pixels.charCodeAt(i)|0;
     return hash!==previous;
    },film,{polling:120,timeout:4000});
    await page.evaluate(()=>{fakeAudio.readyState=2});
    await page.locator("#imSongAnimation[data-suspended]").waitFor({state:"visible"});
    const held=await fingerprint();
    await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,260)));
    assert.equal(await fingerprint(),held,"the scene holds the last frame while audio buffers");
    assert.equal(await stage.evaluate(node=>getComputedStyle(node.lastElementChild).animationPlayState),"paused");
    assert.deepEqual(await page.evaluate(()=>[fakeAudio.paused,fakeAudio.currentTime]),[false,123]);
    await page.evaluate(()=>{fakeAudio.readyState=4});
    await page.waitForFunction(()=>!document.getElementById("imSongAnimation").hasAttribute("data-suspended"));
    assert.equal(await stage.evaluate(node=>getComputedStyle(node.lastElementChild).animationPlayState),"running");
    await page.waitForFunction(previous=>document.querySelector("#imSongAnimation canvas:last-child").toDataURL()!==previous,
     await stage.evaluate(node=>node.lastElementChild.toDataURL()),{polling:120,timeout:4000});
    await page.screenshot({path:"/tmp/immersive-song-"+engine+"-"+size.name+".png"});
    await switchTrack("b-track-40","Donna","songs/track-40.mp3","Kid Yugi");
    assert.notEqual(await fingerprint(),film,"two titles by the same artist have different original art");
    await page.evaluate(()=>{
     const context=document.querySelector("#imSongAnimation canvas:last-child").getContext("2d");
     const scale=context.scale.bind(context);
     window.subjectScales=0;
     context.scale=(x,y)=>{window.subjectScales++;scale(x,y)};
     fakeLyrics={id:"b-track-40",synced:[
      {t:10,text:"C'è la luna piena"},
      {t:20,text:"Un pianoforte senza tasti"},
      {t:30,text:"La pioggia nella stanza",estimated:true},
      {t:40,text:"Una città"}
     ]};
     fakeAudio.currentTime=14;
    });
    const activeLine=page.locator("#imKaraoke .im-line.active");
    await activeLine.filter({hasText:"C'è la luna piena"}).waitFor({state:"visible"});
    const donna=await fingerprint();
    await page.evaluate(()=>{fakeAudio.currentTime=24});
    await activeLine.filter({hasText:"Un pianoforte senza tasti"}).waitFor({state:"visible"});
    await page.evaluate(()=>{fakeAudio.currentTime=34});
    await activeLine.filter({hasText:"La pioggia nella stanza"}).waitFor({state:"visible"});
    await page.evaluate(()=>{fakeAudio.currentTime=44});
    await activeLine.filter({hasText:"Una città"}).waitFor({state:"visible"});
    assert.notEqual(await fingerprint(),donna,"Donna still has a moving background");
    assert.equal(await page.evaluate(()=>window.subjectScales),0,"Donna never draws a detached foreground subject");
    const reviewed=await page.evaluate(()=>{
     const animation=MusicBoxImmersiveAnimation;
     return ["b-track-27","b-track-213","b-track-233","b-track-670","b-track-705"].map(id=>{
      const [file,title,artist]=MusicBoxImmersiveScenes[id];
      const scene=animation.find({id,file,title,artist},"Ste");
      animation.describeLyrics(scene,[]);
      return scene.lyricSubject??scene.subject;
     });
    });
    assert.deepEqual(reviewed,["film","monitor","bridge","sail","skyline"],
     "reviewed recording scenes work without timed lyrics and preserve Il Filmografo");
    await page.locator("#imSongAnimation[data-photographed-scene]").waitFor({state:"visible"});
    const frameBefore=await stage.evaluate(node=>node.lastElementChild.toDataURL());
    await page.waitForFunction(previous=>document.querySelector("#imSongAnimation canvas:last-child").toDataURL()!==previous,
     frameBefore,{polling:120,timeout:4000});
    assert.equal(await stage.evaluate(node=>getComputedStyle(node.lastElementChild).animationName),"none",
     "the scene itself is animated in canvas pixels");
    await page.evaluate(()=>{
     const prototype=CanvasRenderingContext2D.prototype,drawImage=prototype.drawImage;
     window.photoCrops=[];
     prototype.drawImage=function(image,...rect){
      if(image instanceof HTMLImageElement&&image.src.includes("immersive-ste.webp")&&rect.length===8&&rect[6]>32){
       window.photoCrops.push({tile:image.naturalWidth/3,width:rect[2],height:rect[3],layer:this});
      }
      return drawImage.call(this,image,...rect);
     };
    });
    await switchTrack("b-track-25","Poter scegliere","songs/track-25.mp3","nayt");
    await page.locator("#imSongAnimation[data-photographed-scene]").waitFor({state:"visible"});
    const photo=await page.evaluate(()=>{
     const {tile,width,height,layer}=window.photoCrops.at(-1);
     const side=layer.canvas.width;
     const alpha=(x,y)=>layer.getImageData(Math.round(x*side),Math.round(y*side),1,1).data[3];
     return {tile,width,height,left:alpha(.015,.5),right:alpha(.98,.5),top:alpha(.5,.015),bottom:alpha(.5,.98)};
    });
    assert.ok(photo.width>=photo.tile*.98&&photo.height>=photo.tile*.98,
     "a portrait or wide viewport must show the almost complete source photo");
    assert.ok(photo.bottom<45,"the photo fades into the controls and lyrics instead of ending in a hard border");
    if(size.name==="desktop"){
     assert.ok(photo.left>250&&photo.top>250&&photo.right<30,
      "desktop art reaches the screen edges and fades toward the lyrics");
    }
    const extraAtlas=page.waitForResponse(response=>response.url().includes("/immersive-ste-references.webp")&&response.ok());
    const [file,title,artist]=await page.evaluate(()=>MusicBoxImmersiveScenes["b-track-117"]);
    await switchTrack("b-track-117",title,file,artist);
    await extraAtlas;
    await page.locator("#imSongAnimation[data-photographed-scene]").waitFor({state:"visible"});
    assert.equal(await video.getAttribute("src"),null,"new Ste reference uses local artwork");
    const newAtlas=page.waitForResponse(response=>response.url().includes("/immersive-ste-video-stills.webp")&&response.ok());
    const [sceneFile,sceneTitle,sceneArtist]=await page.evaluate(()=>MusicBoxImmersiveScenes["b-track-9"]);
    await switchTrack("b-track-9",sceneTitle,sceneFile,sceneArtist);
    await newAtlas;
    await page.locator("#imSongAnimation[data-photographed-scene]").waitFor({state:"visible"});
    assert.equal(await video.getAttribute("src"),null,"the verified reference is rendered as a local animated scene");
    await switchTrack("b-track-478","VENTANNI","songs/track-478.mp3","Måneskin");
    await stage.waitFor({state:"visible"});
    await page.locator("#imSongAnimation[data-photographed-scene]").waitFor({state:"visible"});
    await page.evaluate(()=>{fakeAudio.paused=true});
    await stage.waitFor({state:"hidden"});
    assert.equal(await stage.evaluate(node=>node.lastElementChild.width),0,"pause releases the drawn planes");
    await page.evaluate(()=>{fakeAudio.paused=false});
    await stage.waitFor({state:"visible"});
    await page.locator("#imClose").click();
    assert.equal(await stage.isHidden(),true);
    await page.locator("#btnImmersive").click();
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
