'use strict';
// Independently measure a frozen recording suffix, never certify/install a pair.
const fs=require('node:fs'),{chromium,webkit}=require('playwright'),{server}=require('./ste-clean-probe-server.cjs');
(async()=>{
 const [file,output]=process.argv.slice(2);if(!output||fs.existsSync(output))throw Error('New evidence file required');
 const data=JSON.parse(fs.readFileSync(file)),env=server(data),source=Object.values(data.recordings).find(r=>r.quietSuffix);
 const report={method:'bounded-native-original-quiet-recording-v1',evaluationOnly:true,notPlaybackCertified:true,physicalIPhone:false,platform:process.platform,sourceSha:source.sourceSha,results:[]};
 await new Promise(r=>env.server.listen(0,'127.0.0.1',r));
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await engine.launch({headless:true});
  try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+env.server.address().port+'/observed');
   try{const measurements=await page.evaluate(async r=>{
    const media=new Audio('/original/'+r.sourceSha+'.mp3');media.preload='metadata';media.load();
    try{
     await new Promise(resolve=>{const at=performance.now();function poll(){Number.isFinite(media.duration)&&media.duration>26||performance.now()-at>5000?resolve():setTimeout(poll,25)}poll()});
     const sourceMediaOffset=MusicBoxCompositeMix.nativeClockOffset(r.clock,r.sourceSha,media.duration);
     if(sourceMediaOffset===null)throw Error('Unrecognized native source media clock');
     const rows=[];
     for(const rate of [44100,48000]){
      const ctx=new AudioContext({sampleRate:rate});
      try{
       const decoded=await ctx.decodeAudioData(await(await fetch('/original/'+r.sourceSha+'.mp3')).arrayBuffer()),sourceDecodedOffset=MusicBoxCompositeMix.nativeClockOffset(r.clock,r.sourceSha,decoded.duration);
       if(sourceDecodedOffset===null||decoded.numberOfChannels!==2||decoded.sampleRate!==rate)throw Error('Unrecognized native PCM clock or layout');
       let sourceTailPeak=0,sourceTailRmsMax=0,maximumChannelRms=0;
       const begin=Math.round((r.quietSuffix.from+sourceDecodedOffset)*rate),step=Math.round(.02*rate);
       if(begin<0||decoded.length-begin<.8*rate)throw Error('Uncovered source suffix');
       for(let i=begin;i<decoded.length;i+=step){
        let total=0,count=0;
        for(let c=0;c<2;c++){
         const x=decoded.getChannelData(c);let energy=0,n=0;
         for(let j=i;j<Math.min(i+step,x.length);j++){if(!Number.isFinite(x[j]))throw Error('Nonfinite PCM');energy+=x[j]*x[j];n++;sourceTailPeak=Math.max(sourceTailPeak,Math.abs(x[j]));}
         maximumChannelRms=Math.max(maximumChannelRms,Math.sqrt(energy/n));total+=energy;count+=n;
        }
        sourceTailRmsMax=Math.max(sourceTailRmsMax,Math.sqrt(total/count));
       }
       const channelRmsUpperBound=Math.SQRT2*sourceTailRmsMax;
       rows.push({rate,sourceTailPeak,sourceTailRmsMax,maximumChannelRms,channelRmsUpperBound,sourceDecodedOffset,sourceMediaOffset,
        sourceDecodedDuration:decoded.duration,sourceMediaDuration:media.duration,from:r.quietSuffix.from,through:decoded.duration-sourceDecodedOffset,
        accepted:sourceTailPeak<=.001&&channelRmsUpperBound<=.0001});
      }finally{await ctx.close()}
     }return rows;
    }finally{media.removeAttribute('src');media.load()}
   },source);report.results.push({browser:name,version:browser.version(),measurements});
   }catch(e){report.results.push({browser:name,error:e.message})}finally{await page.close()}
  }finally{await browser.close()}
 }}finally{env.server.close();fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
 const passed=report.results.every(r=>r.measurements?.length===2&&r.measurements.every(m=>m.accepted));
 console.log(JSON.stringify({platform:process.platform,sourceSha:report.sourceSha,passed,notPlaybackCertified:true}));
 if(!passed||!report.results.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
