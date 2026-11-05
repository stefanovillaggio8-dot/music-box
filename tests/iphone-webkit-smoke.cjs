"use strict";
// Real desktop WebKit integration, using an iPhone viewport + UA. This is
// NOT a physical iPhone test and does not certify background iOS audio.
const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html",".js":"text/javascript",".json":"application/json",
 ".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg"};
const srv=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://127.0.0.1"),name=decodeURIComponent(url.pathname);
 const file=path.resolve(root,"."+name);
 if(!(file===root||file.startsWith(root+path.sep))){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});res.end(body);
 });
});
async function run(){
 await new Promise(resolve=>srv.listen(0,"127.0.0.1",resolve));
 const port=srv.address().port;
 const browser=await webkit.launch({headless:true});
 try{
  const context=await browser.newContext({
   viewport:{width:390,height:844},isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1"
  });
  const page=await context.newPage();
  // Test-only instrumentation. Production DJ source is unchanged: the
  // real WebKit engine will schedule an ORIGINAL synthetic AudioBuffer.
  await page.route("**/mix-intelligente.js*",async route=>{
   const original=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
   const marker="window.MusicBoxMix={";
   assert.equal(original.split(marker).length,2);
   const hook="window.__MB_WEBKIT_DJ_TEST__={"+
    "seed:(key,buffer,info)=>rememberMobileClip(key,buffer,info),"+
    "put:(key,info)=>cache.set(key,info),"+
    "start:startMobileMix,active:()=>mobileActive,stop:stopMobileMix};";
   await route.fulfill({status:200,contentType:"text/javascript",
    body:original.replace(marker,hook+marker)});
  });
  // The desktop-only 127.0.0.1:8788 diagnostics bridge is not installed
  // on the GitHub Actions runner. Make its optional /log endpoint inert
  // without concealing actual WebKit JavaScript exceptions in the DJ.
  await page.route(/^https?:\/\/127\.0\.0\.1:8788\/log(?:\?|$)/,route=>
   route.fulfill({status:204,headers:{
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS"}}));
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+port+"/index.html",{waitUntil:"domcontentloaded",timeout:45000});
  await page.waitForFunction(()=>!!window.MusicBoxBridge&&!!window.MusicBoxMix,
   {timeout:25000});
  const initial=await page.evaluate(()=>({
   hasMix:typeof window.MusicBoxMix?.diagnostics==="function",
   hasBridge:typeof window.MusicBoxBridge?.mixHandoff==="function",
   ios:window.MusicBoxMix.diagnostics()?.isIOS
  }));
  assert.equal(initial.hasMix,true);
  assert.equal(initial.hasBridge,true);
  assert.equal(initial.ios,true,"iPhone code path not selected in WebKit");
  await page.evaluate(()=>{
   const panel=document.getElementById("mixPanel");
   if(panel)panel.hidden=false;
   document.getElementById("btnMixSettings")?.click();
  });
  const status=await page.locator("#mixIphoneStatus").textContent();
  assert.ok(status&&status.trim().length>4,"Safari DJ status must explain its state");
  await page.evaluate(()=>{
   const toggle=document.getElementById("mixIphoneToggle");
   if(toggle)toggle.click();
  });
  const toggled=await page.evaluate(()=>window.MusicBoxMix.diagnostics().enabled);
  assert.equal(typeof toggled,"boolean");
  // A REAL trusted WebKit gesture must unlock a true AudioContext. We do
  // not merely mock createBufferSource/start() as the Node DJ tests do.
  await page.evaluate(()=>{
   const button=document.getElementById("mixIphoneToggle");
   button.addEventListener("pointerdown",()=>{
    const AC=window.AudioContext||window.webkitAudioContext;
    const ctx=new AC();window.__MB_REAL_CONTEXT__=ctx;
    ctx.resume().catch(()=>{});
   },{once:true});
  });
  await page.locator("#mixIphoneToggle").click();
  await page.waitForFunction(()=>window.__MB_REAL_CONTEXT__?.state==="running",
   null,{timeout:10000});
  const audioResult=await page.evaluate(async()=>{
   const ctx=window.__MB_REAL_CONTEXT__,testing=window.__MB_WEBKIT_DJ_TEST__;
   const buffer=ctx.createBuffer(2,44100*9,44100);
   for(let c=0;c<2;c++){
    const samples=buffer.getChannelData(c);
    for(let i=0;i<samples.length;i++)
     samples[i]=.05*Math.sin(2*Math.PI*(c?330:220)*i/44100);
   }
   const outgoing={id:"old",url:"memory:old"};
   const incoming={id:"new",url:"memory:new"};
   testing.put(outgoing.url,{duration:30,last:30,protectedEnding:false});
   testing.seed(incoming.url,buffer,{
    duration:120,first:0,safeIntroAt:0,introDrive:.9,beatConfidence:.8
   });
   const old={currentTime:27,paused:false,
    addEventListener(){},removeEventListener(){}};
   const app={currentId:()=>"old",allTracks:()=>[outgoing,incoming],
    mixUrl:track=>track.url,mixLyricCues:()=>null,
    mixRunningContext:()=>ctx,volume:()=>.45,
    mixHandoff:()=>Promise.resolve()};
   const plan={kind:"soft",begin:26,end:30,fade:4,entry:0,
    quietCertified:true,safeOutroAt:26,tempo:1};
   const clockStart=ctx.currentTime;
   const started=testing.start(incoming,plan,app,old);
   const active=testing.active();
   const scheduled=!!active?.source?.buffer&&
    active.source.buffer.duration>=8.8;
   await new Promise(resolve=>setTimeout(resolve,250));
   const advanced=ctx.currentTime-clockStart;
   testing.stop();
   await ctx.close();
   return {started,scheduled,advanced,contextState:ctx.state};
  });
  assert.equal(audioResult.started,true,
   "Real WebKit refused an iPhone DJ AudioBufferSource on trusted gesture");
  assert.equal(audioResult.scheduled,true);
  assert.ok(audioResult.advanced>.05,
   "WebKit audio playback clock did not advance while preview was active");

  // A missing/stalled audio context must not crash the app or hide the
  // native song controls. User-gesture requirements remain iOS-specific.
  assert.ok(errors.length===0,
   "Unexpected WebKit JS exceptions: "+errors.join(" | "));
  console.log("[IPHONE WEBKIT SMOKE]",JSON.stringify({
   initial,status,errors:errors.length,audioResult
  }));
  await context.close();
 }finally{await browser.close()}
}
run().then(()=>srv.close(),e=>{
 console.error(e?.stack||e);srv.close();process.exitCode=1;
});
