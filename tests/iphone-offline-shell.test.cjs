"use strict";
// Real WebKit service-worker test: online install -> close -> network OFF -> open.
// This checks the actual CSS/JS resources, not only static source assertions.
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const {webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",
 ".json":"application/json",".svg":"image/svg+xml",".png":"image/png",
 ".webp":"image/webp",".jpg":"image/jpeg",".mp3":"audio/mpeg"};
const server=http.createServer((req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname)}
 catch(_){res.writeHead(400).end();return}
 if(name==="/")name="/index.html";
 const file=path.resolve(root,"."+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(error,data)=>{
  if(error){res.writeHead(404).end();return}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"}).end(data);
 });
});
const timeout=45000;
async function run(){
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const url="http://127.0.0.1:"+server.address().port+"/";
 const release=JSON.parse(fs.readFileSync(path.join(root,"versione.json"),"utf8")).versione.replace(/\./g,"");
 // The live HTML can append a DJ-only cache-bust parameter; precache must
 // match the full actual script URL rather than a stale assumed URL.
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const djAsset=/<script src="(mix-intelligente\.js\?v=[0-9]+(?:&amp;dj=[0-9]+)?)"><\/script>/.exec(html);
 const djUrl=djAsset?.[1]?.replace(/&amp;/g,"&");
 assert.ok(djUrl?.startsWith("mix-intelligente.js?v="+release),
  "DJ script in live HTML must carry the current app version");
 // Karaoke and DJ releases can independently append cache revisions.
 // Test the actual installed HTML URLs, never a stale CSS/JS guess.
 const versionedAsset=name=>{
  const re=new RegExp('(?:src|href)="('+name.replace(".", "\\.")+
   '\\?v='+release+'(?:&amp;[a-z]+=[0-9]+)?)"');
  return re.exec(html)?.[1]?.replace(/&amp;/g,"&")||"";
 };
 const cssUrl=versionedAsset("style.css"),
  appUrl=versionedAsset("app.js"),
  immersiveUrl=versionedAsset("immersive.js");
 assert.ok(cssUrl&&appUrl&&immersiveUrl,
  "versioned stylesheet, player and immersive script must be present");
 let browser;
 try{
  browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},
   isMobile:true,hasTouch:true,serviceWorkers:"allow",
   userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1"});
  const page=await context.newPage();
  await page.goto(url,{waitUntil:"domcontentloaded",timeout});
  await page.waitForFunction(()=>!!window.MusicBoxBridge,{timeout});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const shell=await page.waitForFunction(async({rev,djUrl,cssUrl,appUrl,immersiveUrl})=>{
   const names=await caches.keys();
   const name=names.find(x=>x==="spotifynonavraiimieisoldi-v"+rev);
   if(!name)return false;
   const c=await caches.open(name);
   const required=["index.html",cssUrl,appUrl,
    "fuoco.js?v=6570",djUrl,immersiveUrl];
   for(const item of required)if(!(await c.match(new URL(item,location.href))))return false;
   return required.length;
  },{rev:release,djUrl,cssUrl,appUrl,immersiveUrl},{timeout});
  assert.ok(await shell.jsonValue(),"install must precache exact versioned shell");
  // A downloaded MP3 lives in a separate persistent profile cache and must
  // survive a cold restart while the app shell changes across releases.
  await page.evaluate(async()=>{
   const cache=await caches.open("spotifynonavraiimieisoldi-brani-Ste");
   await cache.put(new URL("songs/track-2.mp3",location.href),
    new Response(new Uint8Array([73,68,51]),{status:200,
     headers:{"Content-Type":"audio/mpeg"}}));
  });
  await page.close();
  await context.setOffline(true);
  const cold=await context.newPage();
  await cold.goto(url,{waitUntil:"domcontentloaded",timeout});
  await cold.waitForFunction(()=>!!window.MusicBoxBridge,{timeout:30000});
  await cold.waitForFunction(()=>window.MusicBoxBridge?.librarySnapshot?.().totalLoaded>200,
   {timeout:30000});
  const offline=await cold.evaluate(async({cssUrl,appUrl})=>{
   const css=await fetch(cssUrl);
   const js=await fetch(appUrl);
   const legacy=await fetch("style.css?v=unvisited-offline-variant");
   const saved=await (await caches.open("spotifynonavraiimieisoldi-brani-Ste"))
     .match(new URL("songs/track-2.mp3",location.href));
   return {background:getComputedStyle(document.body).backgroundColor,
    libraryCount:window.MusicBoxBridge.librarySnapshot().totalLoaded,
    downloadStillSaved:!!saved&&saved.status===200,
    cssOk:css.ok,jsOk:js.ok,legacyCssOk:legacy.ok,
    cssBytes:(await css.text()).length,jsBytes:(await js.text()).length,
    legacyCssBytes:(await legacy.text()).length,
    playerLoaded:!!window.MusicBoxBridge,
    stylesheetCount:document.styleSheets.length};
  },{cssUrl,appUrl});
  assert.ok(offline.cssOk&&offline.jsOk&&offline.legacyCssOk,
   "offline asset requests must be served from the cache");
  assert.ok(offline.cssBytes>20000&&offline.jsBytes>200000&&
   offline.legacyCssBytes>20000,"offline should load full CSS and JS");
  assert.ok(offline.stylesheetCount>0&&offline.playerLoaded&&
   offline.background!=="rgba(0, 0, 0, 0)"&&offline.libraryCount>200,
   "offline app must have styles and a populated library, not giant icons or zero songs");
  assert.equal(offline.downloadStillSaved,true,
   "saved MP3s must remain in the profile cache after offline restart");
  console.log("[IPHONE OFFLINE SHELL]",JSON.stringify(offline));
  await context.close();
 }finally{if(browser)await browser.close();server.close()}
}
run().catch(e=>{console.error(e?.stack||e);process.exitCode=1;server.close()});
