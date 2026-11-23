'use strict';
// Isolated actual-app experiment. Shadow index only; two original Ste songs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright'),{currentSteScope,validateSteCases}=require('../tools/ste-research-scope.cjs');
const root=path.resolve(__dirname,'..'),fixture=require('../audits/ste-classifier-evaluation-20261123/native-element-shadow.json');
const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
validateSteCases([fixture],currentSteScope(),index);
for(const key of [fixture.from,fixture.to]){
 const sha=index.entries[key].sha,bytes=fs.readFileSync(path.join(root,'../original-mp3',sha+'.mp3'));
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'),sha,'Actual-app audio must retain original Git identity');
}
const shadow=process.env.MUSICBOX_NATIVE_CLEAN_SHADOW==='true';
if(shadow)index.entries[fixture.from].structuralBeatPlans={...index.entries[fixture.from].structuralBeatPlans,[fixture.record.toSha]:fixture.record};
else assert.ok(index.entries[fixture.from].structuralBeatPlans?.[fixture.record.toSha]?.cue?.nativeCleanTail,'Release regression requires the ACTUAL installed index, never a shadow injection');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname;
  const key='audio'+name;
  if([fixture.from,fixture.to].includes(key)){
   const bytes=fs.readFileSync(path.join(root,'../original-mp3',index.entries[key].sha+'.mp3'));
   res.setHeader('Content-Type','audio/mpeg');res.setHeader('Accept-Ranges','bytes');
   const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
   if(range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
    if(lo>hi){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length});res.end();return;}
    res.writeHead(206,{'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));
   }else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}return;
  }
  if(name==='/dj-deep-analysis.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(index));return;}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(500);res.end(e.message)}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const report={shadowIndex:shadow,published:false,physicalIPhone:false,results:[]};
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
   const logs=[];page.on('console',m=>{if(m.text().includes('Music Box DJ'))logs.push(m.text())});page.on('pageerror',e=>logs.push(e.message));
   page.on('requestfailed',r=>{if(r.url().includes('.mp3'))logs.push({failed:r.url(),error:r.failure()})});
   await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin==='http://127.0.0.1:'+server.address().port)return route.continue();
    if(u.hostname==='raw.githubusercontent.com'&&/\/songs\/track-(?:38|4)\.mp3$/.test(u.pathname))return route.continue();
    return route.abort();
   });
   await page.addInitScript(()=>{
    localStorage.setItem('mb.profile',JSON.stringify('Ste'));localStorage.setItem('mb.djmix','on');
    window.__nativeCleanTrace=[];
    const play=HTMLMediaElement.prototype.play,seek=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'currentTime');
    Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{...seek,set(value){
     if(/\/track-4\.mp3/.test(this.src))__nativeCleanTrace.push({event:'target-seek',at:seek.get.call(this),value});
     return seek.set.call(this,value);
    }});
    HTMLMediaElement.prototype.play=function(){
     if(/\/track-4\.mp3/.test(this.src)){
      window.__incomingNative=this;__nativeCleanTrace.push({event:'target-play',at:this.currentTime,volume:this.volume,rate:this.playbackRate,sourceAt:window.__outgoingNative?.currentTime});
     }
     return play.apply(this,arguments);
    };
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MusicBoxMix?.diagnostics().deepIndexLoaded&&['b-track-38','b-track-4'].every(id=>MusicBoxBridge.playable().some(t=>t.id===id)),null,{timeout:20000});
   const inspection=await page.evaluate(()=>MusicBoxMix.inspectPair('b-track-38','b-track-4'));
   assert.equal(inspection.approved,true);assert.equal(inspection.beatCertified,false);assert.equal(inspection.cue.nativeCleanTail,true);
   await page.evaluate(begin=>{
    const adopt=MusicBoxBridge.mixAdoptHandoff;
    MusicBoxBridge.mixAdoptHandoff=(id,audio)=>{
     window.__beforeNativeAdoption={oldEnded:__outgoingNative.ended,sourceAt:__outgoingNative.currentTime,sourceDuration:__outgoingNative.duration,
      incomingAt:audio.currentTime,incomingPaused:audio.paused,incomingSeeking:audio.seeking};
     return adopt(id,audio);
    };
    const b=document.createElement('button');b.id='start-native-clean';b.textContent='Start Ste native clean trial';b.style.cssText='position:fixed;top:0;left:0;z-index:2147483647';
    b.onclick=async event=>{
     try{MusicBoxBridge.mixEnableAudio(event);await MusicBoxBridge.mixHandoff('b-track-38',begin-7);window.__outgoingNative=MusicBoxBridge.audio();
      if(MusicBoxBridge.mixEnqueue(['b-track-4'])!==1)throw Error('Actual manual queue rejected Ste target');window.__setupDone=true;
      window.__nativeCleanTimeline=[];window.__nativeCleanSampling=setInterval(()=>{if(__nativeCleanTimeline.length<110)__nativeCleanTimeline.push(MusicBoxMix.diagnostics())},100);
     }catch(e){window.__setupError=e.message}
    };document.body.append(b);
   },fixture.record.cue.begin);
   await page.click('#start-native-clean');
   try{
    await page.waitForFunction(()=>window.__setupDone||window.__setupError,null,{timeout:15000});
    assert.equal(await page.evaluate(()=>window.__setupError||null),null);
    await page.waitForFunction(()=>window.__incomingNative&&!__incomingNative.paused&&__incomingNative.currentTime>.1,null,{timeout:20000});
    const overlap=await page.evaluate(()=>({id:MusicBoxBridge.currentId(),sourceEnded:__outgoingNative.ended,oldVolume:__outgoingNative.volume,newVolume:__incomingNative.volume,sourceTime:__outgoingNative.currentTime,targetTime:__incomingNative.currentTime,diagnostics:MusicBoxMix.diagnostics()}));
    assert.equal(overlap.id,'b-track-38');assert.equal(overlap.sourceEnded,false);assert.equal(overlap.newVolume,overlap.oldVolume);
    await page.waitForFunction(()=>MusicBoxBridge.currentId()==='b-track-4',null,{timeout:10000});
    const adopted=await page.evaluate(()=>({sameElement:MusicBoxBridge.audio()===__incomingNative,beforeAdoption:window.__beforeNativeAdoption,
     targetTime:MusicBoxBridge.audio().currentTime,rate:MusicBoxBridge.audio().playbackRate,trace:__nativeCleanTrace,
     isPlaying:!MusicBoxBridge.audio().paused,sourceEndedAt:__outgoingNative.currentTime}));
    assert.equal(adopted.sameElement,true);assert.equal(adopted.beforeAdoption.oldEnded,true);assert.equal(adopted.isPlaying,true);assert.equal(adopted.rate,1);
    assert.ok(Math.abs(adopted.beforeAdoption.sourceAt-adopted.beforeAdoption.sourceDuration)<.002);
    assert.ok(adopted.targetTime>1&&adopted.targetTime<4);assert.equal(adopted.trace.filter(t=>t.event==='target-seek').length,0);
    const start=adopted.trace.find(t=>t.event==='target-play');assert.ok(start.at<=.02);assert.equal(start.volume,overlap.oldVolume);
    assert.ok(Math.abs(start.sourceAt-fixture.record.cue.begin-(name==='webkit'&&process.platform==='linux'?1105/48000:0))<.15);
    await page.evaluate(()=>MusicBoxBridge.audio().pause());
    report.results.push({browser:name,version:browser.version(),platform:process.platform,overlap,adopted,logs});
   }catch(e){console.error(name,JSON.stringify(await page.evaluate(()=>({setup:window.__setupError,src:MusicBoxBridge.audio()?.currentSrc,trace:window.__nativeCleanTrace,diagnostics:MusicBoxMix.diagnostics(),timeline:window.__nativeCleanTimeline,inspection:MusicBoxMix.inspectPair('b-track-38','b-track-4')}))),JSON.stringify(logs));throw e;}
   await context.close();
  }finally{await browser.close()}
 }}finally{server.close();if(process.env.MUSICBOX_NATIVE_CLEAN_OUTPUT)fs.writeFileSync(process.env.MUSICBOX_NATIVE_CLEAN_OUTPUT,JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({passed:report.results.length,physicalIPhone:false,published:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
