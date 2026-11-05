"use strict";
const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html",".js":"text/javascript",".json":"application/json",
 ".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",
 ".jpg":"image/jpeg",".mp3":"audio/mpeg"};
const srv=http.createServer((req,res)=>{
 const pathPart=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
 const file=path.resolve(root,"."+pathPart);
 if(!(file===root||file.startsWith(root+path.sep))){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});res.end(body);
 });
});
async function run(){
 await new Promise(resolve=>srv.listen(0,"127.0.0.1",resolve));
 const browser=await chromium.launch({headless:true,
  args:["--autoplay-policy=no-user-gesture-required"]});
 try{
  const context=await browser.newContext({viewport:{width:1350,height:900}});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/mix-intelligente.js*",async route=>{
   const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
   const marker="window.MusicBoxMix={";
   assert.equal(source.split(marker).length,2);
   const hook="window.__MB_DESKTOP_MIX_TEST__={"+
    "isolate:()=>{tick=()=>{};stopSnapPrecision()},prepare,"+
    "beginMix,active:()=>active,preview:()=>prepared,"+
    "bridge:desktopSilentTailBridge};";
   await route.fulfill({status:200,contentType:"text/javascript",
    body:source.replace(marker,hook+marker)});
  });
  await page.route("**/dj-deep-analysis.json*",route=>
   route.fulfill({status:200,contentType:"application/json",
    body:'{"version":2,"entries":{},"analyzed":0,"sourceCount":0}'}));
  await page.goto("http://127.0.0.1:"+srv.address().port+"/index.html",
   {waitUntil:"domcontentloaded",timeout:45000});
  await page.waitForFunction(()=>
   !!window.MusicBoxBridge&&!!window.MusicBoxMix&&!!window.__MB_DESKTOP_MIX_TEST__,
   null,{timeout:25000});
  const meta=await page.evaluate(()=>({
   ios:window.MusicBoxMix.diagnostics().isIOS,
   active:window.MusicBoxMix.isEnabled(),
   button:!!document.getElementById("btnMixIntelligente")
  }));
  assert.equal(meta.ios,false,"desktop code path must be active");
  assert.equal(meta.button,true);
  assert.equal(meta.active,true);
  // An actual Chrome Audio element decodes and plays a short original WAV
  // generated entirely in memory (no copyrighted music or external API).
  const setup=await page.evaluate(()=>{
   window.__MB_DESKTOP_MIX_TEST__.isolate();
   const rate=22050,seconds=6,count=rate*seconds;
   const wav=new ArrayBuffer(44+count*2),view=new DataView(wav);
   function str(at,s){for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i))}
   str(0,"RIFF");view.setUint32(4,36+count*2,true);str(8,"WAVE");
   str(12,"fmt ");view.setUint32(16,16,true);
   view.setUint16(20,1,true);view.setUint16(22,1,true);
   view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
   view.setUint16(32,2,true);view.setUint16(34,16,true);
   str(36,"data");view.setUint32(40,count*2,true);
   for(let i=0;i<count;i++)
    view.setInt16(44+i*2,Math.round(10000*Math.sin(2*Math.PI*220*i/rate)),true);
   const url=URL.createObjectURL(new Blob([wav],{type:"audio/wav"}));
   const next={id:"test-next",url};
   const old={paused:false,ended:false,seeking:false,
    currentTime:37,duration:40,volume:.7,readyState:4,
    pause(){this.paused=true},removeAttribute(){},load(){}};
   const testState={id:"test-old",audio:old,next,adopted:false};
   const app={
    audio:()=>testState.audio,currentId:()=>testState.id,
    mixNext:()=>testState.next,mixUrl:track=>track.url,
    volume:()=>.7,wantsPlayback:()=>true,
    mixAdoptHandoff:(id,audio)=>{
     testState.id=id;testState.audio=audio;testState.adopted=true;
     return Promise.resolve(true);
    }
   };
   window.__MB_DESKTOP_STATE__=testState;
   window.MusicBoxBridge=app;
   window.__MB_DESKTOP_MIX_TEST__.prepare(next,"test-old",app);
   return {url,prepared:!!window.__MB_DESKTOP_MIX_TEST__.preview()};
  });
  assert.equal(setup.prepared,true);
  await page.waitForFunction(()=>
   window.__MB_DESKTOP_MIX_TEST__.preview()?.ready===true,
   null,{timeout:12000});
  const started=await page.evaluate(async()=>{
   const plan={kind:"soft",begin:37,end:39.1,fade:1.2,entry:0,
    tempo:1,gain:1,quietCertified:true,certifiedSilentBridge:true};
   await window.__MB_DESKTOP_MIX_TEST__.beginMix(
    window.__MB_DESKTOP_STATE__.next,plan);
   return {
    active:!!window.__MB_DESKTOP_MIX_TEST__.active(),
    mediaStarted:window.__MB_DESKTOP_MIX_TEST__.active()?.upcoming?.paused===false
   };
  });
  assert.equal(started.active,true,"desktop mixer did not begin fade");
  assert.equal(started.mediaStarted,true,"Chromium did not play the next audio");
  await page.waitForFunction(()=>window.__MB_DESKTOP_STATE__.adopted,
   null,{timeout:7000});
  const finished=await page.evaluate(()=>({
   adopted:window.__MB_DESKTOP_STATE__.adopted,
   current:window.__MB_DESKTOP_STATE__.id,
   playing:!window.__MB_DESKTOP_STATE__.audio.paused,
   playbackPosition:window.__MB_DESKTOP_STATE__.audio.currentTime
  }));
  assert.equal(finished.current,"test-next");
  assert.equal(finished.playing,true);
  assert.ok(finished.playbackPosition>.45,"preview audio restarted instead of being adopted");
  assert.deepEqual(errors,[],"unhandled JavaScript exception in real Chromium");
  console.log("[DESKTOP CHROMIUM DJ SMOKE]",JSON.stringify({meta,setup:{
   prepared:setup.prepared},started,finished,errors:errors.length}));
  await context.close();
 }finally{await browser.close()}
}
run().then(()=>srv.close(),err=>{
 console.error(err?.stack||err);srv.close();process.exitCode=1;
});
