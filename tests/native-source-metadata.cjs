'use strict';
// CI diagnostic: compare native MP3 metadata across transport paths. No
// player patches, original-frame rewriting, publication or physical-iOS claim.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json'))).entries;
const keys=['audio/songs/track-4.mp3','audio/songs/track-934.mp3'],data=new Map(),wrapped=new Map(),requests=[];
const candidates=JSON.parse(fs.readFileSync(path.join(root,'audits/acoustic-boundaries-20261115/metadata-pilot-candidates.json'))).entries;
const selected=process.env.MUSICBOX_COMPOSITE_BROWSERS;if(!['webkit','chromium'].includes(selected))throw Error('Choose one CI browser');
(async()=>{
 for(const key of keys){const sha=entries[key].sha,url='https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+key.slice(6);
  const response=await fetch(url);if(!response.ok)throw Error('Original unavailable');const bytes=Buffer.from(await response.arrayBuffer());
  if(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')!==sha)throw Error('Original changed');data.set(sha,bytes);
  const candidate=candidates[key];if(candidate){
   if(crypto.createHash('sha256').update(bytes).digest('hex')!==candidate.sourceSha256)throw Error('Candidate source changed');
   const fixed=Buffer.concat([bytes.subarray(0,candidate.insertAt),Buffer.from(candidate.prefixBase64,'base64'),bytes.subarray(candidate.insertAt)]);
   if(crypto.createHash('sha256').update(fixed).digest('hex')!==candidate.wrappedSha256)throw Error('Candidate identity changed');wrapped.set(sha,fixed);
  }
 }
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.end('<!doctype html><title>Native source metadata</title><button id="play">Play diagnostic</button>');return;}
  const [,mode,sha]=pathname.split('/'),bytes=(mode.startsWith('prefix-')?wrapped:data).get(sha);if(!bytes){res.writeHead(404);res.end();return;}
  requests.push({mode,sha,range:req.headers.range||null});
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');res.setHeader('Content-Type','audio/mpeg');
  if(mode.endsWith('range')&&range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
   res.writeHead(206,{'Accept-Ranges':'bytes','Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));
  }else{if(mode.endsWith('range'))res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',bytes.length);res.end(bytes);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await ({chromium,webkit}[selected]).launch({headless:true});const page=await browser.newPage(),base='http://127.0.0.1:'+server.address().port;
  await page.route('**/intercept/**',async route=>{const sha=new URL(route.request().url()).pathname.split('/')[2];requests.push({mode:'intercept',sha,range:route.request().headers().range||null});await route.fulfill({status:200,contentType:'audio/mpeg',body:data.get(sha)});});
  await page.goto(base);const results=[];
  for(const key of keys)for(const mode of ['raw','range','whole','intercept','blob',...(candidates[key]?['prefix-range','prefix-blob']:[])]){
   const sha=entries[key].sha,url=mode==='raw'?'https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+key.slice(6):base+'/'+mode+'/'+sha;
   await page.evaluate(()=>window.__probeReady=false);
   const pending=page.evaluate(async({url,blob,expectedDuration})=>{
    const audio=new Audio();audio.preload='auto';audio.crossOrigin='anonymous';
    const mediaUrl=blob?URL.createObjectURL(new Blob([await(await fetch(url)).arrayBuffer()],{type:'audio/mpeg'})):url;
    const metadata=await new Promise(resolve=>{const timer=setTimeout(()=>resolve({timeout:true}),10000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve({duration:audio.duration,readyState:audio.readyState})};audio.onerror=()=>{clearTimeout(timer);resolve({error:audio.error?.code})};audio.src=mediaUrl;audio.load()});
    const playError=await new Promise(resolve=>{document.querySelector('#play').onclick=()=>{audio.muted=true;audio.play().then(()=>resolve(null),error=>resolve(String(error)))};window.__probeReady=true;});
    await new Promise(resolve=>setTimeout(resolve,600));
    const afterPlayback={duration:audio.duration,at:audio.currentTime,ended:audio.ended,paused:audio.paused,playError};audio.pause();
    // The application can assign the same source again for an explicit
    // handoff. Compare that path too, retaining the original MP3 bytes.
    window.__probeReady=false;
    const requestedPosition=expectedDuration-16,seekEvents=[];
    const seek=()=>{if(audio.readyState>=1&&Number.isFinite(audio.duration)&&audio.duration>.05){audio.currentTime=requestedPosition;for(const event of seekEvents)audio.removeEventListener(event,seek)}};
    for(const event of ['loadedmetadata','durationchange','canplay','playing']){seekEvents.push(event);audio.addEventListener(event,seek)}
    const repeatedMetadata=await new Promise(resolve=>{const timer=setTimeout(()=>resolve({timeout:true}),10000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve({duration:audio.duration,readyState:audio.readyState})};audio.onerror=()=>{clearTimeout(timer);resolve({error:audio.error?.code})};audio.src=mediaUrl;});
    const repeatedPlayError=await new Promise(resolve=>{document.querySelector('#play').onclick=()=>audio.play().then(()=>resolve(null),error=>resolve(String(error)));window.__probeReady=2;});
    await new Promise(resolve=>setTimeout(resolve,600));
    const repeatedPlayback={metadata:repeatedMetadata,requestedPosition,duration:audio.duration,at:audio.currentTime,ended:audio.ended,paused:audio.paused,playError:repeatedPlayError};audio.pause();
    for(const event of seekEvents)audio.removeEventListener(event,seek);
    let decodedDuration=null,decodedPcmSha256=null,decodedFrames=null,decodeError=null;try{
     const bytes=await(await fetch(url)).arrayBuffer(),context=new OfflineAudioContext(2,44100,44100),buffer=await context.decodeAudioData(bytes);decodedDuration=buffer.duration;decodedFrames=buffer.length;
     decodedPcmSha256=await Promise.all(Array.from({length:buffer.numberOfChannels},async(_,i)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer.getChannelData(i)))).map(v=>v.toString(16).padStart(2,'0')).join('')));
    }catch(error){decodeError=String(error)}
    audio.removeAttribute('src');audio.load();if(blob)URL.revokeObjectURL(mediaUrl);return {metadata,afterPlayback,repeatedPlayback,decodedDuration,decodedFrames,decodedPcmSha256,decodeError};
   },{url,blob:mode.endsWith('blob'),expectedDuration:entries[key].duration});
   await page.waitForFunction(()=>window.__probeReady===true);await page.click('#play');
   await page.waitForFunction(()=>window.__probeReady===2);await page.click('#play');
   const result=await pending;results.push({key,sha,mode,expectedDuration:entries[key].duration,...result});
  }
  console.log(JSON.stringify({browser:selected,physicalIPhone:false,results,requests},null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
