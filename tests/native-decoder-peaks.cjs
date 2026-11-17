'use strict';
// CI only. Measure the actual native decoder without changing the player's
// absolute clipping checks, playing audio or deleting storage. Only a new
// original-return cue also fetches its SHA-bound original for splice proof.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json'),'utf8')),assets=new Map();
for(const entry of Object.values(index.entries))for(const record of Object.values(entry.structuralBeatPlans||{}))
 for(const cue of record.cues||[record.cue])if((cue?.rhythmicTailWindow||cue?.metricalPickupWindow||cue?.structuralEvidence?.exactSilentSuffix)&&cue.composite)assets.set(cue.composite.sha256,cue.composite);
const name=process.env.MUSICBOX_COMPOSITE_BROWSERS;if(!['chromium','webkit'].includes(name))throw Error('Select one native decoder');
const originals=new Map();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.end('<!doctype html><title>Read-only native PCM measurement</title><script src="/audio-composite-mix.js"></script>');return;}
 if(url.pathname==='/audio-composite-mix.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(root,'audio-composite-mix.js')));return;}
 const original=/^\/original\/([a-f0-9]{40})\.mp3$/.exec(url.pathname);
 if(original&&originals.has(original[1])){
  const bytes=originals.get(original[1]);res.setHeader('Content-Type','audio/mpeg');res.setHeader('Accept-Ranges','bytes');
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
   if(lo>hi||lo>=bytes.length){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length});res.end();return;}
   res.writeHead(206,{'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));
  }else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}return;
 }
 if(!/^\/dj-mixes\/[a-f0-9]{64}\.flac$/.test(url.pathname)){res.writeHead(404);res.end();return;}
 const bytes=fs.readFileSync(path.join(root,url.pathname));res.setHeader('Content-Type','audio/flac');res.setHeader('Content-Length',bytes.length);res.end(bytes);
});
(async()=>{
 for(const c of assets.values())for(const sha of c.nativeSplice?[c.targetSha,...(c.nativeRecoveryCurve?[c.sourceSha]:[])]:[])if(!originals.has(sha)){
  const key=Object.keys(index.entries).find(k=>index.entries[k].sha===sha),[origin,...parts]=key.split('/');
  const base={audio:'music-box-brani/main',app:'music-box/main',mobile:'music-box/mobile-audio'}[origin];
  const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/'+base+'/'+parts.join('/'));
  if(!response.ok)throw Error('Original splice source unavailable');const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>32e6||crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')!==sha)throw Error('Original splice source identity changed');
  originals.set(sha,bytes);
 }
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await ({chromium,webkit}[name]).launch({headless:true});const page=await browser.newPage();page.on('console',m=>{if(m.type()==='error')console.error(m.text())});
  await page.goto('http://127.0.0.1:'+server.address().port);
  const measured=await page.evaluate(async descriptors=>{
   const results=[],mediaClocks=new Map();
   async function nativeDuration(sha){
    // HTML media has its own clock, independent of AudioContext's rate.
    // Retain one real metadata element per original across both PCM decodes;
    // repeatedly tearing down/reopening the same GStreamer resource caused
    // a NaN second probe despite a valid first duration on identical bytes.
    if(!mediaClocks.has(sha)){
     const media=new Audio('/original/'+sha+'.mp3');media.preload='metadata';media.load();mediaClocks.set(sha,media);
     await new Promise(resolve=>{const start=Date.now(),poll=()=>Number.isFinite(media.duration)&&media.duration>26||Date.now()-start>5000?resolve():setTimeout(poll,25);poll()});
    }
    const media=mediaClocks.get(sha);
    if(!Number.isFinite(media.duration)||media.duration<=26)console.error('Native metadata probe failure '+JSON.stringify({sha,duration:media.duration,readyState:media.readyState,networkState:media.networkState,error:media.error?.message,errorCode:media.error?.code,seekable:media.seekable.length,buffered:media.buffered.length}));
    return media.duration;
   }
   try{
   for(const sampleRate of [44100,48000]){
    const ctx=new AudioContext({sampleRate});
    try{for(const c of descriptors){
     const bytes=await (await fetch(c.path)).arrayBuffer();
     const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
     if(sha!==c.sha256)throw Error('Encoded source hash mismatch');
     const decoded=await ctx.decodeAudioData(bytes);let samplePeak=0,overlapPeak=0;
     const lo=Math.ceil(c.preRoll*sampleRate),hi=Math.floor((c.preRoll+c.nativeHandoffAt)*sampleRate);
     for(let channel=0;channel<decoded.numberOfChannels;channel++){
      const values=decoded.getChannelData(channel);
      for(let i=0;i<values.length;i++){if(!Number.isFinite(values[i]))throw Error('Nonfinite native PCM');const v=Math.abs(values[i]);samplePeak=Math.max(samplePeak,v);if(i>=lo&&i<=hi)overlapPeak=Math.max(overlapPeak,v);}
     }
     if(samplePeak>.9992||overlapPeak>.962||decoded.numberOfChannels!==2||Math.abs(decoded.duration-c.seconds)>.04)throw Error('Native absolute peak/duration certificate failed');
     let nativeSplice=null,nativeSourceClock=null;
     if(c.nativeRecoveryCurve){
      const decoded=await ctx.decodeAudioData(await (await fetch('original/'+c.sourceSha+'.mp3')).arrayBuffer());
      const mediaDuration=await nativeDuration(c.sourceSha);
      const decodedOffset=MusicBoxCompositeMix.nativeClockOffset(c.nativeSplice.sourceClock,c.sourceSha,decoded.duration);
      const mediaOffset=MusicBoxCompositeMix.nativeClockOffset(c.nativeSplice.sourceClock,c.sourceSha,mediaDuration);
      console.error('Cadence source clocks '+JSON.stringify({sourceSha:c.sourceSha,sampleRate,decodedDuration:decoded.duration,mediaDuration,decodedOffset,mediaOffset}));
      if(decodedOffset===null||mediaOffset===null)throw Error('Unrecognized actual outgoing MP3 clock');
      nativeSourceClock={method:'actual-native-source-clock-v1',sourceSha:c.sourceSha,decodedOffset,mediaOffset,decodedDuration:decoded.duration,mediaDuration};
     }
     if(c.nativeSplice){
      const original=await ctx.decodeAudioData(await (await fetch('original/'+c.targetSha+'.mp3')).arrayBuffer());
      const nativeMediaDuration=await nativeDuration(c.targetSha);
      console.error('Original clocks '+JSON.stringify({sampleRate,targetSha:c.targetSha,decodedDuration:original.duration,decodedFrames:original.length,nativeMediaDuration}));

      const decodedPrimingSeconds=MusicBoxCompositeMix.nativeClockOffset(c.nativeSplice.targetClock,c.targetSha,original.duration);
      const mediaPrimingSeconds=MusicBoxCompositeMix.nativeClockOffset(c.nativeSplice.targetClock,c.targetSha,nativeMediaDuration);
      if(decodedPrimingSeconds===null||mediaPrimingSeconds===null)throw Error('Unrecognized actual native MP3 clock');
      const count=Math.round(.1*sampleRate),at=Math.round((c.preRoll+c.nativeRevealAt)*sampleRate),to=Math.round((c.nativeSplice.nativeResumeSeconds+decodedPrimingSeconds)*sampleRate);
      if(to<count||to>original.length||at>decoded.length)throw Error('Incomplete actual native original splice');
      let xx=0,yy=0,xy=0,error=0;
      for(let channel=0;channel<2;channel++){
       const a=decoded.getChannelData(channel),b=original.getChannelData(Math.min(channel,original.numberOfChannels-1));
       for(let i=0;i<count;i++){const x=a[at-count+i],y=b[to-count+i];xx+=x*x;yy+=y*y;xy+=x*y;error+=(x-y)**2;}
      }
      const correlation=xx>1e-10&&yy>1e-10?xy/Math.sqrt(xx*yy):error<1e-10?1:0;
      const relativeRms=Math.sqrt(error/Math.max(yy,1e-10));
      if(correlation<.99||relativeRms>.10){
       // Diagnostic lag search never certifies or changes the nominal comparison.
       let best={correlation:-1};const a=decoded.getChannelData(0),b=original.getChannelData(0);
       for(let lag=-4096;lag<=4096;lag+=4){let xx=0,yy=0,xy=0;for(let i=0;i<count;i++){const x=a[at-count+i],y=b[to-count+i+lag];xx+=x*x;yy+=y*y;xy+=x*y;}const v=xy/Math.sqrt(xx*yy);if(v>best.correlation)best={lag,correlation:v};}
       console.error('Actual native original splice differs: '+JSON.stringify({sampleRate,correlation,relativeRms,diagnosticOnly:best,commonAtSeconds:at/sampleRate,originalAtSeconds:to/sampleRate,nativeResumeSeconds:c.nativeSplice.nativeResumeSeconds,revealAtSeconds:c.preRoll+c.nativeRevealAt,originalDuration:original.duration}));
      }
      nativeSplice={method:'actual-native-original-splice-v1',targetSha:c.targetSha,frames:count,correlation,relativeRms,clockMethod:'original-mp3-gapless-metadata-v1',decodedPrimingSeconds,mediaPrimingSeconds};
     }
     results.push({assetSha256:sha,sampleRate,samplePeak,overlapPeak,channels:decoded.numberOfChannels,duration:decoded.duration,...(nativeSplice?{nativeSplice}:{}),...(nativeSourceClock?{nativeSourceClock}:{})});
    }}finally{await ctx.close()}
   }
   return results;
   }finally{for(const media of mediaClocks.values()){media.removeAttribute('src');media.load();}}
  },[...assets.values()]);
  assert.equal(measured.length,assets.size*2);
  assert.ok(measured.every(r=>!r.nativeSplice||r.nativeSplice.correlation>=.99&&r.nativeSplice.relativeRms<=.1),'Every nominal native splice must pass; diagnostic lag is never accepted');
  console.log(JSON.stringify({method:'actual-browser-decode-v1',browser:name,browserVersion:browser.version(),physicalIPhone:false,
   nativeMediaClockScope:'one-live-HTML-media-element-per-original-across-two-AudioContext-rates',assets:measured},null,2));
 }finally{await browser?.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
