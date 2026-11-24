'use strict';
// Isolated actual-app experiment. Shadow index only; two original Ste songs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright'),{currentSteScope,validateSteCases}=require('../tools/ste-research-scope.cjs');
const root=path.resolve(__dirname,'..'),fixture=JSON.parse(fs.readFileSync(process.env.MUSICBOX_NATIVE_CLEAN_FIXTURE||path.join(root,'audits/ste-classifier-evaluation-20261123/native-element-shadow.json')));
const fromId='b-'+path.basename(fixture.from,'.mp3'),toId='b-'+path.basename(fixture.to,'.mp3'),targetFile='/'+path.basename(fixture.to);
const translationMode=process.env.MUSICBOX_NATIVE_TRANSLATION==='true';
const phoneNaturalMode=process.env.MUSICBOX_PHONE_NATIVE_INTRO==='true';
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
  if(name==='/app.js'&&translationMode){
   let code=fs.readFileSync(path.join(root,'app.js'),'utf8');
   for(const [marker,extra] of [
    ['  function currentLyrics() {','\n    return {title:"Controlled phrase fixture",artist:"UI regression",text:currentId===window.__nativePair.fromId?"Native outgoing phrase":"Native incoming phrase",synced:""};'],
    ['  function _righeTestoConParole(l){','\n    return [{t:0,text:currentId===window.__nativePair.fromId?"Native outgoing phrase":"Native incoming phrase"}];']
   ]){assert.equal(code.split(marker).length,2);code=code.replace(marker,marker+extra)}
   res.setHeader('Content-Type','text/javascript');res.end(code);return;
  }
  if(name==='/mix-intelligente.js'){
   let code=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
   const marker='function beginNativeCleanTail(app,old,next,p){';assert.equal(code.split(marker).length,2);
   code=code.replace(marker,`function beginNativeCleanTail(app,old,next,p){
    const sample={sourceAt:old.currentTime,sourceDuration:old.duration,begin:p.begin,preparedReady:prepared?.ready,preparedFailed:prepared?.failed,
     preparedEntry:prepared?.naturalEntry,targetTime:prepared?.audio?.currentTime,targetDuration:prepared?.audio?.duration,targetReady:prepared?.audio?.readyState,
     sourceClock:window.MusicBoxCompositeMix?.nativeClockOffset?.(p.nativeCleanEvidence?.sourceClock,p.sourceSha,old.duration),active:!!active,mixing};
    const result=nativeCleanTestImplementation(app,old,next,p);sample.result=result;
    (window.__nativeClockAttempts??=[]).push(sample);if(__nativeClockAttempts.length>180)__nativeClockAttempts.shift();return result;
   }
   function nativeCleanTestImplementation(app,old,next,p){`);
   res.setHeader('Content-Type','text/javascript');res.end(code);return;
  }
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(500);res.end(e.message)}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const report={shadowIndex:shadow,published:false,physicalIPhone:false,controlledPhraseFixture:translationMode,results:[]};
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({serviceWorkers:'block',...(phoneNaturalMode?{isMobile:true,hasTouch:true,viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})}),page=await context.newPage();
   const logs=[];let translationRequested=false,translationAborted=false;const wordModels=[];
   page.on('console',m=>{if(m.text().includes('Music Box DJ'))logs.push(m.text())});page.on('pageerror',e=>logs.push(e.message));
   page.on('request',r=>{if(/audio-lyrics-worker|\.onnx(?:\?|$)|huggingface/.test(r.url()))wordModels.push(r.url())});
   page.on('requestfailed',r=>{if(r.url().includes('.mp3'))logs.push({failed:r.url(),error:r.failure()});if(r.url().includes('mymemory.translated.net'))translationAborted=true});
   await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(translationMode&&u.hostname==='api.mymemory.translated.net'){translationRequested=true;return;}
    if(u.origin==='http://127.0.0.1:'+server.address().port)return route.continue();
    if(u.hostname==='raw.githubusercontent.com'&&[fixture.from,fixture.to].some(key=>u.pathname.endsWith('/'+key.slice(6))))return route.continue();
    return route.abort();
   });
   await page.addInitScript(({targetFile,fromId,toId,translationMode,eventTrace})=>{
    window.__nativePair={targetFile,fromId,toId};window.__nativeEventTrace=eventTrace;
    window.__nativeTranslationMode=translationMode;window.__nativeLyricSamples=[];
    localStorage.setItem('mb.profile',JSON.stringify('Ste'));localStorage.setItem('mb.djmix','on');
    window.__nativeCleanTrace=[];
    const play=HTMLMediaElement.prototype.play,seek=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'currentTime');
    Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{...seek,set(value){
     if(new URL(this.src,location.href).pathname.endsWith(targetFile))__nativeCleanTrace.push({event:'target-seek',at:seek.get.call(this),value});
     return seek.set.call(this,value);
    }});
    if(window.__nativeEventTrace){const pause=HTMLMediaElement.prototype.pause;
     HTMLMediaElement.prototype.pause=function(){if(new URL(this.src,location.href).pathname.endsWith(targetFile))__nativeCleanTrace.push({event:'target-pause',at:this.currentTime,ended:this.ended,stack:new Error().stack});return pause.apply(this,arguments)};
    }
    HTMLMediaElement.prototype.play=function(){
     if(new URL(this.src,location.href).pathname.endsWith(targetFile)){
      window.__incomingNative=this;__nativeCleanTrace.push({event:'target-play',at:this.currentTime,volume:this.volume,rate:this.playbackRate,sourceAt:window.__outgoingNative?.currentTime,sourceDuration:window.__outgoingNative?.duration});
     }
     return play.apply(this,arguments);
    };
   },{targetFile,fromId,toId,translationMode,eventTrace:process.env.MUSICBOX_NATIVE_EVENT_TRACE==='true'});
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MusicBoxMix?.diagnostics().deepIndexLoaded&&[__nativePair.fromId,__nativePair.toId].every(id=>MusicBoxBridge.playable().some(t=>t.id===id)),null,{timeout:20000});
   const inspection=await page.evaluate(()=>MusicBoxMix.inspectPair(__nativePair.fromId,__nativePair.toId));
   if(phoneNaturalMode){assert.ok(!inspection.cue?.neutralAmbientUnderlay);}
   else{assert.equal(inspection.approved,true);assert.equal(inspection.beatCertified,false);assert.equal(inspection.cue.nativeCleanTail,true);}
   await page.evaluate(({begin,stall})=>{
    window.__phoneHandoffs=[];window.__overlapEvents=[];
    window.__nativeStallEnabled=stall;
    addEventListener('musicbox:mix-overlap',e=>__overlapEvents.push(e.detail));
    window.__eofChecks=[];const natural=MusicBoxMix.naturalEndHandoff;
    MusicBoxMix.naturalEndHandoff=(...args)=>{const before={ended:MusicBoxBridge.audio().ended,paused:MusicBoxBridge.audio().paused,at:MusicBoxBridge.audio().currentTime,live:MusicBoxMix.diagnostics().liveTransition,
     incomingPaused:window.__incomingNative?.paused,incomingAt:window.__incomingNative?.currentTime,incomingReady:window.__incomingNative?.readyState};const result=natural(...args);__eofChecks.push({...before,result});return result};
    const normal=MusicBoxBridge.mixHandoff;
    MusicBoxBridge.mixHandoff=(id,entry,options)=>{
     if(id===__nativePair.toId)__phoneHandoffs.push({sourceId:MusicBoxBridge.currentId(),sourceAt:MusicBoxBridge.audio().currentTime,sourceDuration:MusicBoxBridge.audio().duration,entry});
     return normal(id,entry,options);
    };
    const adopt=MusicBoxBridge.mixAdoptHandoff;
    MusicBoxBridge.mixAdoptHandoff=(id,audio)=>{
     window.__beforeNativeAdoption={oldEnded:__outgoingNative.ended,sourceAt:__outgoingNative.currentTime,sourceDuration:__outgoingNative.duration,
      incomingAt:audio.currentTime,incomingPaused:audio.paused,incomingSeeking:audio.seeking,observedAt:performance.now()};
     return adopt(id,audio);
    };
    const b=document.createElement('button');b.id='start-native-clean';b.textContent='Start Ste native clean trial';b.style.cssText='position:fixed;top:0;left:0;z-index:2147483647';
    b.onclick=async event=>{
     try{MusicBoxBridge.mixEnableAudio(event);await MusicBoxBridge.mixHandoff(__nativePair.fromId,begin-7);window.__outgoingNative=MusicBoxBridge.audio();
      if(MusicBoxBridge.mixEnqueue([__nativePair.toId])!==1)throw Error('Actual manual queue rejected Ste target');window.__setupDone=true;
      window.__nativeCleanTimeline=[];
      window.__captureNativeOverlap=()=>{
       const incoming=window.__incomingNative;
       if(!window.__observedNativeOverlap&&incoming&&!incoming.paused&&incoming.currentTime>.1&&!__outgoingNative.ended&&MusicBoxBridge.currentId()===__nativePair.fromId)
        window.__observedNativeOverlap={id:MusicBoxBridge.currentId(),sourceEnded:__outgoingNative.ended,oldVolume:__outgoingNative.volume,newVolume:incoming.volume,sourceTime:__outgoingNative.currentTime,targetTime:incoming.currentTime,lyrics:document.getElementById('lyricsBody').textContent,diagnostics:MusicBoxMix.diagnostics()};
      };
      window.__nativeCleanSampling=setInterval(()=>{
       __captureNativeOverlap();
       if(__nativeStallEnabled&&!window.__nativeStall&&window.__outgoingNative&&!__outgoingNative.ended){
        const clock=MusicBoxMix.inspectPair(__nativePair.fromId,__nativePair.toId)?.cue?.nativeCleanEvidence?.sourceClock;
        const offset=MusicBoxCompositeMix.nativeClockOffset(clock,clock?.sourceSha,__outgoingNative.duration);
        if(offset!==null&&__outgoingNative.currentTime>=begin+offset-.2){
         const from=__outgoingNative.currentTime,at=performance.now();while(performance.now()-at<350){}
         window.__nativeStall={from,through:__outgoingNative.currentTime,seconds:(performance.now()-at)/1000};
        }
       }
       if(__nativeCleanTimeline.length<110)__nativeCleanTimeline.push(MusicBoxMix.diagnostics());
       if(__nativeTranslationMode&&__nativeLyricSamples.length<110)__nativeLyricSamples.push({beforeAdoption:!window.__beforeNativeAdoption,
        readerOpen:!document.getElementById('lyricsPanel').hidden,id:MusicBoxBridge.currentId(),sourceAt:__outgoingNative.currentTime,lyrics:document.getElementById('lyricsBody').textContent});
      },100);
     }catch(e){window.__setupError=e.message}
    };document.body.append(b);
   },{begin:fixture.record.cue.begin,stall:process.env.MUSICBOX_NATIVE_CUE_STALL==='true'});
   await page.click('#start-native-clean');
   try{
    await page.waitForFunction(()=>window.__setupDone||window.__setupError,null,{timeout:15000});
    assert.equal(await page.evaluate(()=>window.__setupError||null),null);
    if(phoneNaturalMode){
     await page.waitForFunction(()=>MusicBoxBridge.currentId()===__nativePair.toId&&!MusicBoxBridge.audio().paused&&MusicBoxBridge.audio().currentTime>.25,null,{timeout:20000});
     const state=await page.evaluate(()=>({calls:__phoneHandoffs,trace:__nativeCleanTrace,overlapEvents:__overlapEvents,
      current:MusicBoxBridge.currentId(),time:MusicBoxBridge.audio().currentTime,sameNativeElement:MusicBoxBridge.audio()===__outgoingNative,volume:MusicBoxBridge.audio().volume,muted:MusicBoxBridge.audio().muted,rate:MusicBoxBridge.audio().playbackRate}));
     assert.equal(state.calls.length,1);assert.equal(state.calls[0].entry,0);assert.equal(state.overlapEvents.length,0);
     const call=state.calls[0],clock=fixture.record.cue.nativeCleanEvidence.sourceClock;
     const offset=await page.evaluate(({clock,sha,duration})=>MusicBoxCompositeMix.nativeClockOffset(clock,sha,duration),{clock,sha:fixture.record.fromSha,duration:call.sourceDuration});
     assert.notEqual(offset,null);assert.ok(call.sourceAt-offset>=fixture.record.cue.begin-.3,'complete independently quiet suffix');
     assert.ok(call.sourceAt<call.sourceDuration-1.5,'audible native successor before encoded EOF');
     assert.ok(state.trace.find(t=>t.event==='target-play').at<=.02);assert.ok(state.trace.filter(t=>t.event==='target-seek').every(t=>t.value===0));
     assert.equal(state.sameNativeElement,true);assert.equal(state.muted,false);assert.equal(state.volume,1);assert.equal(state.rate,1);
     report.results.push({browser:name,platform:process.platform,phoneNativeIntro:true,physicalIPhone:false,state,logs});
     await page.evaluate(()=>MusicBoxBridge.audio().pause());await context.close();continue;
    }
    if(translationMode){
     await page.click('#btnLyrics');await page.click('#lyricsTraduci');
     for(let i=0;i<50&&!translationRequested;i++)await new Promise(r=>setTimeout(r,20));assert.equal(translationRequested,true);
    }
    // Capture the actual overlap in the browser's media clock. A delayed CDP
    // round-trip after EOF must not mislabel an already verified live overlap.
    await page.waitForFunction(()=>window.__observedNativeOverlap,null,{timeout:20000});
    const overlap=await page.evaluate(()=>__observedNativeOverlap);
    assert.equal(overlap.id,fromId);assert.equal(overlap.sourceEnded,false);assert.equal(overlap.newVolume,overlap.oldVolume);
    if(translationMode){assert.ok(overlap.lyrics.includes('Native outgoing phrase'));assert.ok(!overlap.lyrics.includes('Native incoming phrase'))}
    await page.waitForFunction(()=>MusicBoxBridge.currentId()===__nativePair.toId,null,{timeout:10000});
    if(translationMode){
     await page.waitForFunction(()=>document.getElementById('lyricsBody').textContent.includes('Native incoming phrase'),null,{timeout:5000});
     for(let i=0;i<50&&!translationAborted;i++)await new Promise(r=>setTimeout(r,20));assert.equal(translationAborted,true);
     assert.equal(await page.locator('#lyricsTraduci').textContent(),'Traduci');assert.equal(wordModels.length,0);
     const samples=await page.evaluate(()=>__nativeLyricSamples.filter(s=>s.beforeAdoption&&s.readerOpen));
     assert.ok(samples.length>=8);assert.ok(samples.every(s=>s.id===fromId&&s.lyrics.includes('Native outgoing phrase')&&!s.lyrics.includes('Native incoming phrase')));
    }
    const adopted=await page.evaluate(()=>({sameElement:MusicBoxBridge.audio()===__incomingNative,beforeAdoption:window.__beforeNativeAdoption,
     targetTime:MusicBoxBridge.audio().currentTime,observedAt:performance.now(),rate:MusicBoxBridge.audio().playbackRate,trace:__nativeCleanTrace,
     isPlaying:!MusicBoxBridge.audio().paused,sourceEndedAt:__outgoingNative.currentTime}));
    assert.equal(adopted.sameElement,true);assert.equal(adopted.beforeAdoption.oldEnded,true);assert.equal(adopted.isPlaying,true);assert.equal(adopted.rate,1);
    assert.ok(Math.abs(adopted.beforeAdoption.sourceAt-adopted.beforeAdoption.sourceDuration)<.002);
    assert.ok(adopted.beforeAdoption.incomingAt>1&&adopted.beforeAdoption.incomingAt<4,'already heard original prefix at actual EOF adoption');
    const advanced=adopted.targetTime-adopted.beforeAdoption.incomingAt,wall=(adopted.observedAt-adopted.beforeAdoption.observedAt)/1000;
    assert.ok(advanced>=-.02&&Math.abs(advanced-wall)<.5,'same native decoder continues from its observed adoption clock');
    assert.equal(adopted.trace.filter(t=>t.event==='target-seek').length,0);
    const start=adopted.trace.find(t=>t.event==='target-play');assert.ok(start.at<=.02);assert.equal(start.volume,overlap.oldVolume);
    // Validate the actual launch clock at launch, not a later EOF duration
    // estimate. EOF still independently requires ended=true and intact source.
    const sourceOffset=await page.evaluate(c=>MusicBoxCompositeMix.nativeClockOffset(c.sourceClock,c.sourceSha,c.duration),{sourceClock:fixture.record.cue.nativeCleanEvidence.sourceClock,sourceSha:fixture.record.fromSha,duration:start.sourceDuration});
    assert.notEqual(sourceOffset,null);
    const actualBegin=start.sourceAt-sourceOffset,p=fixture.record.cue;
    assert.ok(actualBegin>=p.begin-.02,'no early launch before the independently quiet source interval');
    if(actualBegin>p.begin+.08){
     const margin=.1+Math.max(0,...p.nativeCleanEvidence.nativeMeasurements.flatMap(m=>[m.targetDecodedOffset||0,m.targetMediaOffset||0]));
     const meaningful=p.nativeCleanEvidence.introductionExposure.rows.filter(r=>r.at+.25<=p.end-actualBegin-margin+1e-6&&r.originalRms>=.001).length*.25;
     assert.ok(meaningful>=.75,'late native launch still exposes >=750ms meaningful ORIGINAL prefix with decoder margin');
    }else assert.ok(Math.abs(actualBegin-p.begin)<.15);
    if(process.env.MUSICBOX_NATIVE_CUE_STALL==='true'){
     const stall=await page.evaluate(()=>window.__nativeStall);assert.ok(stall?.seconds>=.35);assert.ok(actualBegin>p.begin+.08,'exercise a real media-clock delay beyond the legacy timing point');
    }
    await page.evaluate(()=>MusicBoxBridge.audio().pause());
    report.results.push({browser:name,version:browser.version(),platform:process.platform,overlap,adopted,eofChecks:await page.evaluate(()=>__eofChecks),stall:await page.evaluate(()=>window.__nativeStall||null),
     ...(translationMode?{translation:{obsoleteRequestGoneByHandoff:translationAborted,oldPhrasesThroughOriginalEof:true,wordModelRequests:wordModels.length,
      observedOldPhraseSamples:await page.evaluate(()=>__nativeLyricSamples.filter(s=>s.beforeAdoption&&s.readerOpen).length)}}:{}),logs});
   }catch(e){const failure=await page.evaluate(()=>({setup:window.__setupError,src:MusicBoxBridge.audio()?.currentSrc,trace:window.__nativeCleanTrace,eofChecks:window.__eofChecks,diagnostics:MusicBoxMix.diagnostics(),clockAttempts:window.__nativeClockAttempts,timeline:window.__nativeCleanTimeline}));report.results.push({browser:name,platform:process.platform,failed:e.message,failure,logs});console.error(name,e.message,JSON.stringify(failure));throw e;}
   await context.close();
  }finally{await browser.close()}
 }}finally{server.close();if(process.env.MUSICBOX_NATIVE_CLEAN_OUTPUT)fs.writeFileSync(process.env.MUSICBOX_NATIVE_CLEAN_OUTPUT,JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({passed:report.results.length,physicalIPhone:false,published:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
