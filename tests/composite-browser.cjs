'use strict';
// Real native decoders + AudioContext in Chromium/WebKit. No physical
// iPhone/background-playback claim. Assets contain original Music Box PCM.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
const playbackProfile=process.env.MUSICBOX_COMPOSITE_PROFILE||'Emanuele';
const plans=Object.entries(data.entries).flatMap(([from,a])=>[...Object.values(a.pcmBeatPlans||{}),...Object.values(a.structuralBeatPlans||{})].flatMap(p=>(p.cues||[p.cue]).filter(c=>c?.composite).map(cue=>({from,...p,cue}))));
if(!plans.length)throw Error('No actual composite plans to test');
const catalog=new Map(Object.entries(data.entries).map(([k,e])=>[e.sha,k])),sourceCache=new Map();
async function original(sha){
 if(sourceCache.has(sha))return sourceCache.get(sha);
 const key=catalog.get(sha);if(!key)throw Error('Unknown original');
 const local=path.resolve(process.env.MUSICBOX_ORIGINAL_CACHE||path.join(root,'../original-mp3'),sha+'.mp3');
 let bytes;
 if(fs.existsSync(local))bytes=fs.readFileSync(local);
 else{
  const [origin,...parts]=key.split('/'),base={audio:'music-box-brani/main',app:'music-box/main',mobile:'music-box/mobile-audio'}[origin];
  const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/'+base+'/'+parts.join('/'));
  if(!response.ok)throw Error('Original unavailable');bytes=Buffer.from(await response.arrayBuffer());
 }
 const actual=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 if(actual!==sha)throw Error('Original SHA mismatch');sourceCache.set(sha,bytes);return bytes;
}
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<button id="go">Audio</button><script src="/audio-composite-mix.js"></script>');return;}
  const originalSha=/^\/original\/[a-f0-9]{40}\.mp3$/.test(pathname)?pathname.slice(10,-4):data.entries['audio'+pathname]?.sha;
  if(originalSha&&pathname.endsWith('.mp3')){
   const bytes=await original(originalSha);res.setHeader('Content-Type','audio/mpeg');res.setHeader('Accept-Ranges','bytes');
   const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
   if(range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);res.writeHead(206,{'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));}
   else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}return;
  }
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.flac':'audio/flac'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(500);res.end(String(e.message));}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const results=[];
 try{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
   if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
   const browser=await engine.launch({headless:true});
   try{
    const page=await browser.newPage();page.on('pageerror',e=>console.error(name,e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(()=>{document.querySelector('#go').onclick=()=>{window.ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:48000});window.ctx.resume()}});
    await page.click('#go');
    const decoded=await page.evaluate(async plans=>{
     for(const plan of plans){if(!MusicBoxCompositeMix.supports(plan.cue))throw Error('Descriptor rejected');await MusicBoxCompositeMix.prepare(plan.cue,ctx);}
     return plans.length;
    },plans);
    assert.equal(decoded,plans.length);
    const resampled=await page.evaluate(async plans=>{
     const other=new (window.AudioContext||window.webkitAudioContext)({sampleRate:44100});
     const rejected=[];
     try{for(const p of plans){try{await MusicBoxCompositeMix.prepare(p.cue,other)}catch(error){
      const buffer=await other.decodeAudioData(await (await fetch(p.cue.composite.path)).arrayBuffer());let peak=0,overlapPeak=0,peakAt=0;
      for(let c=0;c<buffer.numberOfChannels;c++){const values=buffer.getChannelData(c);for(let i=0;i<values.length;i++){const value=Math.abs(values[i]);if(value>peak){peak=value;peakAt=i/buffer.sampleRate}if(i>=.3*buffer.sampleRate&&i<=(.3+p.cue.composite.nativeHandoffAt)*buffer.sampleRate)overlapPeak=Math.max(overlapPeak,value)}}
      rejected.push({from:p.from,toSha:p.toSha,structural:!!p.cue.structuralBeat,sha:p.cue.composite.sha256,error:String(error),peak,peakAt,overlapPeak,declaredPeak:p.cue.composite.oversampledPeak});
     }}
      return {sampleRate:other.sampleRate,decoded:plans.length-rejected.length,rejected};}
     finally{await other.close()}
    },plans);
    console.error(name,'resampled',JSON.stringify(resampled));
    assert.equal(resampled.sampleRate,44100);assert.deepEqual(resampled.rejected,[]);
    // Exercise pitch-preserving stretch AND intact decoded EOF together,
    // using an incoming recording from zero rather than a historical cut.
    const plan=plans.filter(p=>p.from===(playbackProfile==='Ste'?'audio/songs/bassi/track-53.mp3':'audio/songs/track-700.mp3')&&p.toSha===data.entries[playbackProfile==='Ste'?'audio/songs/bassi/track-51.mp3':'audio/songs/track-521.mp3'].sha&&p.cue.preservedFileTail&&p.cue.entry===0&&
     p.cue.preservedEntrance===(playbackProfile==='Ste'?'rhythmic-tail-foreground-v1':'vocal-handoff-foreground-v1')&&Math.abs(p.cue.tempo-1)>.001)
     .sort((a,b)=>a.cue.fade-b.cue.fade)[0];
    assert.ok(plan,'A rendered intact-file stretch must be available');
    await original(plan.fromSha);await original(plan.toSha);
    await page.evaluate(async plan=>{
     window.cue=plan.cue;await MusicBoxCompositeMix.prepare(cue,ctx);
     window.player=new Audio('/original/'+plan.fromSha+'.mp3');window.id='out';
     window.trace={handoffs:0,mutedBeforePlay:false};
     window.app={audio:()=>player,currentId:()=>id,mixNext:()=>({id:'in'}),volume:()=>.7,wantsPlayback:()=>true,mixSourceMatches:()=>true,
      mixHandoff:(target,position,options)=>{
       trace.handoffs++;id=target;player.src='/original/'+plan.toSha+'.mp3';
       player.muted=options?.muted===true;trace.mutedBeforePlay=player.muted;
       player.addEventListener('loadedmetadata',()=>{player.currentTime=position},{once:true});
       return player.play().catch(error=>{trace.playError=String(error);throw error});
      }};
     await new Promise((resolve,reject)=>{player.addEventListener('loadedmetadata',resolve,{once:true});player.addEventListener('error',reject,{once:true});player.load()});
     // Let the freshly seeked native decoder settle before comparing its
     // clock with AudioContext. The real planner arms during ongoing play.
     player.currentTime=cue.begin-cue.composite.preRoll-1.5;
     await new Promise(resolve=>player.addEventListener('seeked',resolve,{once:true}));
     document.querySelector('#go').onclick=()=>{ctx.resume();player.play()};
    },plan);
    await page.click('#go');await page.waitForFunction(()=>!player.paused&&player.currentTime>=cue.begin-cue.composite.preRoll-.14);
    const started=await page.evaluate(()=>MusicBoxCompositeMix.tryStart(cue,player,app,'in',ctx));assert.equal(started,true);
    try{await page.waitForFunction(()=>trace.handoffs===1&&!MusicBoxCompositeMix.active()&&!player.muted,{timeout:25000});}
    catch(error){console.error(name,'standalone failure',JSON.stringify(await page.evaluate(()=>({trace,time:player.currentTime,paused:player.paused,common:MusicBoxCompositeMix.diagnostics(),cue}))));throw error;}
    const state=await page.evaluate(()=>({id,handoffs:trace.handoffs,mutedBeforePlay:trace.mutedBeforePlay,paused:player.paused,at:player.currentTime,playError:trace.playError||null}));
    console.error(name,'native handoff',JSON.stringify(state));
    assert.equal(state.id,'in');assert.equal(state.handoffs,1);assert.equal(state.mutedBeforePlay,true);assert.equal(state.paused,false);
    // Repeat start then seek: the common source must release native mute.
    await page.evaluate(async plan=>{
     player.pause();id='out';player=new Audio('/original/'+plan.fromSha+'.mp3');
     await new Promise(resolve=>{player.addEventListener('loadedmetadata',resolve,{once:true});player.load()});
     player.currentTime=cue.begin-cue.composite.preRoll-1.5;await new Promise(resolve=>player.addEventListener('seeked',resolve,{once:true}));
     document.querySelector('#go').onclick=()=>player.play();
    },plan);
    await page.click('#go');await page.waitForFunction(()=>!player.paused&&player.currentTime>=cue.begin-cue.composite.preRoll-.14);
    assert.equal(await page.evaluate(()=>MusicBoxCompositeMix.tryStart(cue,player,app,'in',ctx)),true);
    await page.waitForFunction(()=>player.muted);await page.evaluate(()=>{player.currentTime+=2});
    await page.waitForFunction(()=>!MusicBoxCompositeMix.active()&&!player.muted);
    await page.evaluate(()=>{player.pause();ctx.close()});
    // Exercise the real app bridge as well as the bounded-mix controller.
    // Source assignment/play must see binary mute already applied on iOS.
    const appContext=await browser.newContext({serviceWorkers:'block'}),shell=await appContext.newPage();
    shell.on('pageerror',e=>console.error(name,'app bridge page',e.message));
    await shell.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(url.origin==='http://127.0.0.1:'+server.address().port){await route.continue();return;}
     const at=url.pathname.indexOf('/songs/');
     const key=at>=0?'audio'+url.pathname.slice(at):'',sha=data.entries[key]?.sha;
     if(sha){await route.fulfill({status:200,contentType:'audio/mpeg',body:await original(sha)});return;}
     await route.abort();
    });
    await shell.addInitScript(profile=>{
     localStorage.setItem('mb.profile',JSON.stringify(profile));window.__nativePlayMutes=[];
     const play=HTMLMediaElement.prototype.play;
     HTMLMediaElement.prototype.play=function(){window.__nativePlayMutes.push(this.muted);return play.apply(this,arguments)};
    },playbackProfile);
    await shell.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
    const bridgeSource=playbackProfile==='Ste'?'b-track-4':'b-track-934';
    // The initial BUILTIN list precedes loadAll(). A first arbitrary entry
    // can disappear when published deletions arrive (Ste's track-1 did).
    // Use a verified, still-visible source from this exact profile.
    await shell.waitForFunction(({profile,id})=>window.MusicBoxBridge?.profile?.()===profile&&
     MusicBoxBridge.playable().some(t=>t.id===id),{profile:playbackProfile,id:bridgeSource},{timeout:20000});
    await shell.evaluate(id=>{
     const track=MusicBoxBridge.playable().find(t=>t.id===id);if(!track)throw Error('Native bridge reference not available');
     const button=document.createElement('button');button.id='silent-handoff';button.textContent='test';
     button.style.cssText='position:fixed;top:0;left:0;z-index:2147483647';
     window.__silentBridgeTrace={requested:track.id};
      button.onclick=()=>MusicBoxBridge.mixHandoff(track.id,2,{muted:true}).then(
       result=>{__silentBridgeTrace.resolved=true;__silentBridgeTrace.result=result},
       error=>{__silentBridgeTrace.error=String(error)});document.body.append(button);
    },bridgeSource);
    await shell.click('#silent-handoff');
    try{await shell.waitForFunction(()=>MusicBoxBridge.audio()?.readyState>=2&&!MusicBoxBridge.audio().paused,null,{timeout:30000});}
    catch(error){console.error(name,'initial native bridge',JSON.stringify(await shell.evaluate(()=>{
     const a=MusicBoxBridge.audio();return {trace:__silentBridgeTrace,currentId:MusicBoxBridge.currentId(),profile:MusicBoxBridge.profile(),
      paused:a?.paused,src:a?.currentSrc,readyState:a?.readyState,error:a?.error?.message,diagnostics:MusicBoxMix.diagnostics()};
    })));throw error;}
    const silentBridge=await shell.evaluate(()=>({muted:MusicBoxBridge.audio().muted,lastPlayWasMuted:__nativePlayMutes.at(-1)}));
    assert.equal(silentBridge.muted,true);assert.equal(silentBridge.lastPlayWasMuted,true);
    await shell.waitForFunction(()=>MusicBoxMix.diagnostics().deepIndexLoaded,{timeout:20000});
    const actualPlan=await shell.evaluate(({plans,profile})=>{
     const tracks=MusicBoxBridge.allTracks(),find=key=>tracks.find(t=>'audio/'+t.file===key);
     for(const p of plans){
      if(!p.cue.structuralBeat||!p.cue.measuredFullBeat&&!p.cue.rhythmicTailWindow)continue;
      const a=find(p.from),b=find(p.to);
      if(!a||!b||(a.profile||'Ste')!==profile||(b.profile||'Ste')!==profile)continue;
      const inspected=MusicBoxMix.inspectPair(a.id,b.id);
      if(inspected.approved&&inspected.cue?.structuralBeat)return {fromId:a.id,toId:b.id,cue:inspected.cue,
       fromSha:p.fromSha,toSha:p.toSha,sourceBoundCue:p.cue};
     }
     return null;
    },{profile:playbackProfile,plans:plans.map(p=>({...p,to:catalog.get(p.toSha)})).sort((a,b)=>
     Number(b.from==='audio/songs/track-934.mp3'&&b.to==='audio/songs/track-1124.mp3')-
     Number(a.from==='audio/songs/track-934.mp3'&&a.to==='audio/songs/track-1124.mp3'))});
    assert.ok(actualPlan,'A real same-profile structural pair must be available');
    // Network latency retrieving the external original must not consume the
    // nine-second scheduling window. Only warm the Node fixture's SHA-checked
    // bytes: the app still fetches, decodes and prepares through its real path.
    await Promise.all([original(actualPlan.fromSha),original(actualPlan.toSha)]);
    if(playbackProfile==='Emanuele'){
     assert.equal(actualPlan.fromId,'b-track-934');assert.equal(actualPlan.toId,'b-track-1124');
     assert.ok(actualPlan.cue.fade>13&&actualPlan.cue.fade<15);assert.ok(Math.abs(actualPlan.cue.tempo-1)>.001,'Exercise the new vocal-handoff cue through the real planner');
    }
    await shell.evaluate(p=>{
     document.querySelector('#silent-handoff').onclick=async event=>{
      window.__plannedSetup={stage:'handoff-requested'};
      MusicBoxBridge.mixEnableAudio(event);
      const pending=MusicBoxBridge.mixHandoff(p.fromId,Math.max(0,p.cue.begin-9));
      const source=MusicBoxBridge.audio();window.__plannedMedia=[];
      for(const event of ['loadedmetadata','playing','seeking','seeked','ended','pause','ratechange','timeupdate'])source.addEventListener(event,()=>{
       if(__plannedMedia.length<32)__plannedMedia.push({event,at:source.currentTime,duration:source.duration,paused:source.paused,seeking:source.seeking,rate:source.playbackRate});
      });
      await pending;
      __plannedSetup={stage:'source-ready',id:MusicBoxBridge.currentId(),time:MusicBoxBridge.audio().currentTime};
      if(MusicBoxBridge.mixEnqueue([p.toId])!==1)throw Error('Actual queue rejected target');
      __plannedSetup.stage='target-queued';
      window.__plannedHandoffs=0;
      const handoff=MusicBoxBridge.mixHandoff;
      MusicBoxBridge.mixHandoff=(...args)=>{__plannedHandoffs++;return handoff(...args)};
     };
    },actualPlan);
    await shell.click('#silent-handoff');
    try{await shell.waitForFunction(()=>MusicBoxCompositeMix.active()&&MusicBoxBridge.audio()._mbCommonMixMuted===true,{timeout:22000});}
    catch(error){console.error(name,'planner diagnostic',JSON.stringify(await shell.evaluate(p=>({pair:p,
     setup:window.__plannedSetup,media:window.__plannedMedia,common:MusicBoxCompositeMix.diagnostics(),diagnostics:MusicBoxMix.diagnostics(),contentSafe:MusicBoxMix.contentCutSafe(p.sourceBoundCue,p.fromId,p.toId),lyric:MusicBoxBridge.mixLyricCues(p.fromId),
     inspection:MusicBoxMix.inspectPair(p.fromId,p.toId)}),actualPlan)));throw error;}
    const muteDuringOverlap=await shell.evaluate(()=>{
     const button=document.querySelector('#btnVolIcon');button.click();
     const muted=MusicBoxBridge.volume()===0&&MusicBoxBridge.audio().muted;
     button.click();return {muted,unmuteKeptCommonOwnership:MusicBoxBridge.volume()>0&&MusicBoxBridge.audio().muted};
    });
    assert.equal(muteDuringOverlap.muted,true);assert.equal(muteDuringOverlap.unmuteKeptCommonOwnership,true);
    await shell.waitForFunction(id=>MusicBoxBridge.currentId()===id&&!MusicBoxCompositeMix.active()&&!MusicBoxBridge.audio().muted,actualPlan.toId,{timeout:25000});
    const plannedPlayback=await shell.evaluate(()=>({handoffs:__plannedHandoffs,paused:MusicBoxBridge.audio().paused,sourceMatches:MusicBoxBridge.mixSourceMatches(MusicBoxBridge.currentId(),MusicBoxBridge.audio())}));
    assert.equal(plannedPlayback.handoffs,1);assert.equal(plannedPlayback.paused,false);assert.equal(plannedPlayback.sourceMatches,true);
    await appContext.close();
    // Independently exercise ordinary shuffle with a unique library title.
    // It need not start on the same source as the explicit optimized mix.
    const automaticPlan=playbackProfile==='Emanuele'?{fromId:'b-track-700',toId:'b-track-521'}:actualPlan;
    // Independent fresh-listening session: the manual handoff above has
    // already played its target and must not be used to fake repeat-free
    // shuffle availability by erasing the active session's history.
    const autoContext=await browser.newContext({serviceWorkers:'block'}),auto=await autoContext.newPage();
    auto.on('pageerror',e=>console.error(name,'shuffle page',e.message));
    auto.on('console',m=>{if(['warning','error'].includes(m.type()))console.error(name,'shuffle console',m.type(),m.text())});
    await auto.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(url.origin==='http://127.0.0.1:'+server.address().port){await route.continue();return;}
     const at=url.pathname.indexOf('/songs/'),key=at>=0?'audio'+url.pathname.slice(at):'',sha=data.entries[key]?.sha;
     if(sha){await route.fulfill({status:200,contentType:'audio/mpeg',body:await original(sha)});return;}await route.abort();
    });
    await auto.addInitScript(profile=>{localStorage.setItem('mb.profile',JSON.stringify(profile));localStorage.setItem('mb.shuffle','true')},playbackProfile);
    await auto.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
    await auto.waitForFunction(()=>MusicBoxMix.diagnostics().deepIndexLoaded,{timeout:20000});
    await auto.waitForFunction(({profile,fromId,toId})=>MusicBoxBridge.profile()===profile&&
     [fromId,toId].every(id=>MusicBoxBridge.allTracks().some(t=>t.id===id)),
     {profile:playbackProfile,...automaticPlan},{timeout:30000});
    // Start through the real library row, then restore the full library
    // search scope. This retains the actual tap/media activation and wins
    // over initial last-song restoration, just like an explicit selection.
    const sourceInfo=await auto.evaluate(p=>{const t=MusicBoxBridge.allTracks().find(t=>t.id===p.fromId);return {title:t.title,artist:t.artist}},automaticPlan);
    const sourceTitle=sourceInfo.title;
    await auto.locator('#search').click();
    await auto.locator('#search').fill(sourceTitle.replace(/[^\p{L}\p{N}\s]/gu,'').trim());
    // Wait in the page's timer queue: the source can already exist in the
    // OLD DOM, before the application's 160 ms debounced render removes it.
    await auto.evaluate(()=>new Promise(resolve=>setTimeout(resolve,220)));
    // The app debounces filtering for 160 ms. Clicking a row from the
    // unfiltered DOM can lose pointer-up when render() replaces that row.
    // Wait for the actual filtered list, then tap its title, not a row
    // centre that can fall on a nested action at another browser's width.
    const findSource=info=>{
     const norm=s=>String(s||'').normalize('NFD').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
     return [...document.querySelectorAll('.track')].findIndex(row=>norm(row.querySelector('.track-testo')?.textContent)===norm(info.title)&&norm(row.querySelector('.track-meta')?.textContent).includes(norm(info.artist)));
    };
    const sourcePresent=info=>{const norm=s=>String(s||'').normalize('NFD').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();return [...document.querySelectorAll('.track')].some(row=>norm(row.querySelector('.track-testo')?.textContent)===norm(info.title)&&norm(row.querySelector('.track-meta')?.textContent).includes(norm(info.artist)));};
    try{await auto.waitForFunction(sourcePresent,sourceInfo,{timeout:10000});}
    catch(error){console.error(name,'filtered rows',JSON.stringify(await auto.evaluate(()=>({query:document.querySelector('#search').value,rows:[...document.querySelectorAll('.track')].map(r=>r.textContent)}))));throw error;}
    console.error(name,'automatic source',JSON.stringify(automaticPlan));
    const sourceIndex=await auto.evaluate(findSource,sourceInfo);assert.ok(sourceIndex>=0);
    await auto.locator('.track').nth(sourceIndex).locator('.track-testo').click();
    try{await auto.waitForFunction(p=>MusicBoxBridge.currentId()===p.fromId&&!MusicBoxBridge.audio().paused,automaticPlan,{timeout:20000});}
    catch(error){console.error(name,'library start diagnostic',JSON.stringify(await auto.evaluate(()=>{
     const a=MusicBoxBridge.audio();return {currentId:MusicBoxBridge.currentId(),profile:MusicBoxBridge.profile(),
      paused:a.paused,src:a.currentSrc,readyState:a.readyState,networkState:a.networkState,error:a.error?.message,
      toast:document.querySelector('#toast')?.textContent,search:document.querySelector('#search')?.value,
      rows:[...document.querySelectorAll('.track')].map(x=>x.textContent),diagnostics:MusicBoxMix.diagnostics()};
    })));throw error;}
    await auto.locator('#search').fill('');
    try{await auto.waitForFunction(()=>MusicBoxMix.diagnostics().shuffleSearch?.beatCandidates>0||MusicBoxMix.diagnostics().shuffleSearch?.partialBeatCandidates>0,{timeout:20000});}
    catch(error){console.error(name,'shuffle diagnostic',JSON.stringify(await auto.evaluate(()=>({diagnostics:MusicBoxMix.diagnostics(),selection:MusicBoxBridge.mixShuffleSelection()}))));throw error;}
    const automaticShuffle=await auto.evaluate(()=>{
     const next=MusicBoxBridge.mixNext(),current=MusicBoxBridge.currentId(),state=MusicBoxBridge.mixShuffleSelection();
     return {full:MusicBoxMix.inspectPair(current,next.id).cue?.measuredFullBeat===true,
      partial:MusicBoxMix.inspectPair(current,next.id).cue?.metricalRhythmic===true,manualQueue:state.manualCount,poolRespected:MusicBoxBridge.mixShufflePool().some(t=>t.id===next.id)};
    });
    assert.equal(automaticShuffle.full,playbackProfile==='Emanuele');if(playbackProfile==='Ste')assert.equal(automaticShuffle.partial,true);assert.equal(automaticShuffle.manualQueue,0);assert.equal(automaticShuffle.poolRespected,true);
    await autoContext.close();
    results.push({browser:name,profile:playbackProfile,indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'dj-deep-analysis.json'))).digest('hex'),decodedOriginalMixes:decoded,resampled,actualNativeHandoff:state,
     nativeHandoffMode:{preservedFileTail:plan.cue.preservedFileTail,entry:plan.cue.entry,tempo:plan.cue.tempo},
     seekRollback:true,silentAppBridge:silentBridge,actualSameProfilePlannerPlayback:plannedPlayback,
     optimizedCue:{from:actualPlan.fromId,to:actualPlan.toId,fade:actualPlan.cue.fade,tempo:actualPlan.cue.tempo},muteDuringOverlap,automaticShuffle,physicalIPhone:false});
   }finally{await browser.close()}
  }
  console.log(JSON.stringify({results},null,2));
 }finally{server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
