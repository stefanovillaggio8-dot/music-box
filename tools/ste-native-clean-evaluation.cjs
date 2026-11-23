'use strict';
// Read-only, bounded evaluation. Receipts never install plans or certify a mix.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');
const {currentSteScope,validateSteCases}=require('./ste-research-scope.cjs');
const root=path.resolve(__dirname,'..');
async function evaluate(candidateFile,output){
 if(fs.existsSync(output))throw Error('Preserve existing evidence: choose a new output');
 const c=JSON.parse(fs.readFileSync(candidateFile)),index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 if(c.evaluationOnly!==true||c.entry!==0||c.tempo!==1||c.preRoll!==.3||c.fade<.5||c.fade>3||Math.abs(c.end-c.begin-c.fade)>.001)throw Error('Only bounded original-speed evaluation');
 const scope=currentSteScope(),[selected]=validateSteCases([{from:c.from,to:c.to}],scope,index);
 if(c.sourceSha!==selected.sourceSha||c.targetSha!==selected.targetSha)throw Error('Changed candidate identity');
 const asset=fs.readFileSync(path.resolve(path.dirname(candidateFile),c.path)),sha=crypto.createHash('sha256').update(asset).digest('hex');
 if(sha!==c.sha256)throw Error('Changed evaluation asset');
 const resources=new Map([['/mix.flac',{bytes:asset,type:'audio/flac'}],['/audio-composite-mix.js',{bytes:fs.readFileSync(path.join(root,'audio-composite-mix.js')),type:'text/javascript'}]]);
 for(const sha of [c.sourceSha,c.targetSha]){
  const bytes=fs.readFileSync(path.join(root,'../original-mp3',sha+'.mp3'));
  if(crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')!==sha)throw Error('Changed original');
  resources.set('/'+sha+'.mp3',{bytes,type:'audio/mpeg'});
 }
 const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><script src="/audio-composite-mix.js"></script>');return;}
  const r=resources.get(req.url);if(!r){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',r.type);res.setHeader('Accept-Ranges','bytes');
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const lo=Number(range[1]),hi=Math.min(r.bytes.length-1,range[2]?Number(range[2]):r.bytes.length-1);
   if(lo>hi){res.writeHead(416,{'Content-Range':'bytes */'+r.bytes.length});res.end();return;}
   res.writeHead(206,{'Content-Range':`bytes ${lo}-${hi}/${r.bytes.length}`,'Content-Length':hi-lo+1});res.end(r.bytes.subarray(lo,hi+1));
  }else{res.setHeader('Content-Length',r.bytes.length);res.end(r.bytes);}
 });
 const report={evaluationOnly:true,playbackCertified:false,physicalIPhone:false,assetSha256:sha,sourceSha:c.sourceSha,targetSha:c.targetSha,scopeRecordings:scope.tracks.length,platform:process.platform,results:[]};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
   const measured=await page.evaluate(async c=>{
    const media=new Map(),durations={};
    try{
     for(const sha of [c.sourceSha,c.targetSha]){
      const a=new Audio('/'+sha+'.mp3');a.preload='metadata';media.set(sha,a);a.load();
      await new Promise(resolve=>{const start=Date.now();function poll(){Number.isFinite(a.duration)&&a.duration>26||Date.now()-start>5000?resolve():setTimeout(poll,25)}poll()});
      durations[sha]=Number.isFinite(a.duration)?a.duration:null;
     }
     const results=[];
     for(const rate of [44100,48000]){
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)throw Error('This backend does not provide Web Audio');
      const ctx=new Context({sampleRate:rate});
      try{
       const [mix,source,target]=await Promise.all(['/mix.flac','/'+c.sourceSha+'.mp3','/'+c.targetSha+'.mp3'].map(async url=>ctx.decodeAudioData(await (await fetch(url)).arrayBuffer())));
       const sourceDecodedOffset=MusicBoxCompositeMix.nativeClockOffset(c.nativeClocks.source,c.sourceSha,source.duration);
       const sourceMediaOffset=MusicBoxCompositeMix.nativeClockOffset(c.nativeClocks.source,c.sourceSha,durations[c.sourceSha]);
       const targetDecodedOffset=MusicBoxCompositeMix.nativeClockOffset(c.nativeClocks.target,c.targetSha,target.duration);
       const targetMediaOffset=MusicBoxCompositeMix.nativeClockOffset(c.nativeClocks.target,c.targetSha,durations[c.targetSha]);
       let peak=0,overlapPeak=0,sourceTailPeak=0,sourceTailRmsMax=0;
       for(let ch=0;ch<mix.numberOfChannels;ch++){
        const a=mix.getChannelData(ch);
        for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));if(i>=Math.round(c.preRoll*rate)&&i<Math.round((c.preRoll+c.nativeHandoffAt)*rate))overlapPeak=Math.max(overlapPeak,Math.abs(a[i]));}
       }
       if(sourceDecodedOffset!==null){
        for(let i=Math.round((c.begin+sourceDecodedOffset)*rate);i<source.length;i+=Math.round(.02*rate)){
         let energy=0,n=0;
         for(let ch=0;ch<source.numberOfChannels;ch++){const a=source.getChannelData(ch);for(let j=i;j<Math.min(a.length,i+Math.round(.02*rate));j++){energy+=a[j]*a[j];n++;sourceTailPeak=Math.max(sourceTailPeak,Math.abs(a[j]));}}
         sourceTailRmsMax=Math.max(sourceTailRmsMax,Math.sqrt(energy/Math.max(n,1)));
        }
       }
       // Compare the actual unmodified final 100ms at the nominal target clock.
       // No best-lag fit or correction is allowed in this acceptance criterion.
       let xx=0,yy=0,xy=0,error=0;
       const count=Math.round(.1*rate),at=Math.round((c.preRoll+c.nativeRevealAt)*rate),to=Math.round((c.nativeRevealAt+(targetDecodedOffset||0))*rate);
       for(let ch=0;ch<2;ch++)for(let i=0;i<count;i++){
        const x=mix.getChannelData(ch)[at-count+i],y=target.getChannelData(ch)[to-count+i];xx+=x*x;yy+=y*y;xy+=x*y;error+=(x-y)**2;
       }
       const correlation=xy/Math.sqrt(xx*yy),relativeRms=Math.sqrt(error/Math.max(yy,1e-10));
       results.push({rate,peak,overlapPeak,sourceTailPeak,sourceTailRmsMax,correlation,relativeRms,sourceDecodedOffset,sourceMediaOffset,targetDecodedOffset,targetMediaOffset,
        sourceDecodedDuration:source.duration,sourceMediaDuration:durations[c.sourceSha],targetDecodedDuration:target.duration,targetMediaDuration:durations[c.targetSha],
        accepted:[sourceDecodedOffset,sourceMediaOffset,targetDecodedOffset,targetMediaOffset].every(x=>x!==null)&&peak<=.9992&&overlapPeak<=.962&&sourceTailPeak<=.001&&sourceTailRmsMax<=.0001&&correlation>=.99&&relativeRms<=.1});
      }finally{await ctx.close()}
     }
     return results;
    }finally{for(const a of media.values()){a.removeAttribute('src');a.load()}}
   },c);
   report.results.push({browser:name,version:browser.version(),measurements:measured});
   console.log(JSON.stringify(report.results.at(-1)));
  }catch(error){report.results.push({browser:name,error:error.message});console.error(name,error.message)}finally{await browser.close()}
 }}finally{server.close()}
 report.decoderAccepted=report.results.length===2&&report.results.every(r=>r.measurements?.length===2&&r.measurements.every(m=>m.accepted));
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){
 const args=process.argv.slice(2);if(args.length!==2)throw Error('candidate.json new-receipt.json required');
 evaluate(...args).catch(e=>{console.error(e);process.exitCode=1});
}
module.exports={evaluate};
