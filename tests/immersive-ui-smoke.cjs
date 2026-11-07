"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const immersive=fs.readFileSync(path.join(root,"immersive.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const begin=html.indexOf('<div id="immersivePanel"');
const end=html.indexOf('<div class="lyrics-overlay"',begin);
assert.ok(begin>=0&&end>begin,"Immersive markup must exist");
const fragment=html.slice(begin,end);
assert.match(css,/\.im-root\.im-focus \.im-karaoke/);
assert.match(css,/env\(safe-area-inset-top\)/);
assert.doesNotMatch(immersive,/new Audio\s*\(|new AudioContext\s*\(/,
 "Immersive cannot create a second audio engine");
const fixture=[
 '<!doctype html><html lang="it"><head>',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<link rel="stylesheet" href="/style.css"></head><body>',
 '<button id="btnImmersive" hidden>Immersive</button>',
 '<button id="btnLyrics" hidden>Testi</button>',
 '<script>',
 'window.fakeAudio={currentTime:12,duration:240,paused:false};',
 'window.fakeSong={id:"track-a",title:"Notte stellata",artist:"Artista di prova",cover:""};',
 'window.fakeCalls={toggle:0,next:0,prev:0};',
 'window.fakeLyrics={text:"",synced:Array.from({length:26},(_,i)=>({t:i*8,text:"Riga karaoke originale di prova "+(i+1)}))};',
 'window.MusicBoxBridge={',
 ' audio:()=>fakeAudio,currentId:()=>fakeSong.id,',
 ' allTracks:()=>[fakeSong],lyricsData:()=>fakeLyrics,',
 ' togglePlayback:()=>{fakeAudio.paused=!fakeAudio.paused;fakeCalls.toggle++},',
 ' next:()=>{fakeCalls.next++;fakeSong.id="track-b";fakeSong.title="Secondo brano"},',
 ' previous:()=>{fakeCalls.prev++;fakeSong.id="track-c";fakeSong.title="Primo brano"}',
 '};',
 '</script>',
 fragment,
 '<script src="/immersive.js"></script>',
 '</body></html>'
].join("\n");
const server=http.createServer((req,res)=>{
 const loc=new URL(req.url,"http://127.0.0.1").pathname;
 const contents=loc==="/style.css"?css:loc==="/immersive.js"?immersive:fixture;
 res.writeHead(200,{"Content-Type":loc.endsWith(".css")?"text/css":
  loc.endsWith(".js")?"text/javascript":"text/html","Cache-Control":"no-store"});
 res.end(contents);
});
async function run(){
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const browser=await chromium.launch({headless:true,
  executablePath:fs.existsSync("/usr/bin/google-chrome")?"/usr/bin/google-chrome":undefined,
  args:["--autoplay-policy=no-user-gesture-required"]});
 try{
  const sizes=[{name:"desktop",width:1360,height:900},{name:"iphone",width:390,height:844}];
  for(const size of sizes){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},
    ...(size.name==="iphone"?{isMobile:true,hasTouch:true}:{}),reducedMotion:"reduce"});
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
   assert.equal(state.lyricMode,"SINCRONIZZATO");
   assert.match(state.active,/prova 2/);
   assert.ok(state.coverWidth>120,"album cover remains visible");
   assert.ok(state.overflow<=3,"no horizontal overflow: "+size.name);
   await page.evaluate(()=>{
    const seek=document.getElementById("imSeek");
    seek.value="600";
    seek.dispatchEvent(new Event("input",{bubbles:true}));
    seek.dispatchEvent(new Event("change",{bubbles:true}));
   });
   assert.equal(await page.evaluate(()=>window.fakeAudio.currentTime),144);
   await page.waitForFunction(()=>document.querySelector("#imKaraoke .im-line.active")?.textContent.includes("19"));
   const karaoke=await page.evaluate(()=>document.querySelector("#imKaraoke").scrollTop);
   assert.ok(karaoke>20,"synced karaoke scrolls to the active line");
   await page.locator("#imFocusToggle").click();
   assert.equal(await page.locator("#imFocusToggle").getAttribute("aria-pressed"),"true");
   const focus=await page.evaluate(()=>{const el=document.getElementById("imKaraoke");return {height:el.clientHeight,root:document.getElementById("immersivePanel").className,computed:getComputedStyle(el).height,minHeight:getComputedStyle(el).minHeight,frame:getComputedStyle(el.parentElement).height,inline:el.getAttribute("style"),matches:el.matches(".im-root.im-focus .im-karaoke"),parent:el.closest(".im-root")?.id,focusRules:[...document.styleSheets].flatMap(s=>[...s.cssRules]).filter(x=>x.selectorText?.includes(".im-root.im-focus .im-karaoke")).map(x=>x.cssText.slice(0,250))}});
   console.log("[IMMERSIVE FOCUS DEBUG]",JSON.stringify({screen:size.name,focus}));
   assert.ok(focus.height>=220,"focus lyric stage should expand");
   await page.locator("#imToggle").click();
   await page.waitForFunction(()=>document.querySelector(".im-root").classList.contains("im-paused"));
   assert.equal(await page.evaluate(()=>window.fakeCalls.toggle),1);
   assert.equal(await page.locator("#imToggle").getAttribute("aria-label"),"Riprendi");
   await page.locator("#imNext").click();
   await page.waitForFunction(()=>document.getElementById("imTitle").textContent==="Secondo brano");
   assert.equal(await page.evaluate(()=>window.fakeCalls.next),1);
   await page.evaluate(()=>{
    const el=document.getElementById("imKaraoke");
    const t=new Touch({identifier:7,target:el,clientY:120});
    el.dispatchEvent(new TouchEvent("touchstart",{bubbles:true,touches:[t],changedTouches:[t]}));
    const e=new Touch({identifier:7,target:el,clientY:320});
    el.dispatchEvent(new TouchEvent("touchend",{bubbles:true,touches:[],changedTouches:[e]}));
   });
   assert.equal(await page.evaluate(()=>window.MusicBoxImmersive.isOpen()),true,
    "swiping the lyrics cannot dismiss immersive mode");
   await page.screenshot({path:"/tmp/immersive-"+size.name+".png"});
   await page.keyboard.press("Escape");
   await page.waitForFunction(()=>!window.MusicBoxImmersive.isOpen());
   assert.deepEqual(errors,[],"Unexpected browser errors: "+size.name);
   console.log("[IMMERSIVE UI]",JSON.stringify({screen:size.name,state,
    karaokeScrolled:karaoke,focus:true,controls:true,errors:errors.length}));
   await context.close();
  }
 }finally{await browser.close()}
}
run().then(()=>server.close(),e=>{
 console.error(e.stack||e);server.close();process.exitCode=1;
});