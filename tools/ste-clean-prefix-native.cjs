'use strict';
const fs=require('node:fs'),{chromium,webkit}=require('playwright'),{server}=require('./ste-clean-probe-server.cjs');
(async()=>{
 const [file,output]=process.argv.slice(2);if(!output||fs.existsSync(output))throw Error('New evidence output required');
 const data=JSON.parse(fs.readFileSync(file)),env=server(data),report={evaluationOnly:true,notPlaybackCertified:true,platform:process.platform,physicalIPhone:false,results:[]};
 const selected=env.needed.filter(r=>r.prefix?.notNativeCertified);
 await new Promise(r=>env.server.listen(0,'127.0.0.1',r));
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await engine.launch({headless:true});
  try{for(const record of selected){const page=await browser.newPage();await page.goto('http://127.0.0.1:'+env.server.address().port);
   try{const values=await page.evaluate(async r=>{
    const media=new Audio('/original/'+r.sourceSha+'.mp3');media.preload='metadata';media.load();
    try{
     await new Promise(resolve=>{const start=Date.now();function poll(){Number.isFinite(media.duration)&&media.duration>26||Date.now()-start>5000?resolve():setTimeout(poll,25)}poll()});
     const measurements=[];
     for(const rate of [44100,48000]){
      const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('Native Web Audio unavailable');
      const ctx=new Context({sampleRate:rate});
      try{const decoded=await ctx.decodeAudioData(await(await fetch('/original/'+r.sourceSha+'.mp3')).arrayBuffer());
       const targetDecodedOffset=MusicBoxCompositeMix.nativeClockOffset(r.clock,r.sourceSha,decoded.duration),targetMediaOffset=MusicBoxCompositeMix.nativeClockOffset(r.clock,r.sourceSha,media.duration);
       if(targetDecodedOffset===null||targetMediaOffset===null)throw Error('Unknown native metadata clock');
       const bins=[];let maximumPeakSoFar=0;
       for(let i=0;i<Math.round(3.5*rate);i+=Math.round(.25*rate)){
        let energy=0,n=0;for(let ch=0;ch<2;ch++){const a=decoded.getChannelData(ch);for(let j=i;j<i+Math.round(.25*rate);j++){if(!Number.isFinite(a[j]))throw Error('Incomplete prefix');energy+=a[j]*a[j];n++;maximumPeakSoFar=Math.max(maximumPeakSoFar,Math.abs(a[j]));}}
        bins.push({through:(i+Math.round(.25*rate))/rate,maximumPeakSoFar,rms:Math.sqrt(energy/n)});
       }
       measurements.push({rate,targetDecodedOffset,targetMediaOffset,targetDecodedDuration:decoded.duration,targetMediaDuration:media.duration,bins});
      }finally{await ctx.close()}
     }
     return measurements;
    }finally{media.removeAttribute('src');media.load()}
   },record);report.results.push({sourceSha:record.sourceSha,browser:name,measurements:values});
   }finally{await page.close()}
  }}finally{await browser.close()}
 }}finally{env.server.close();fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({records:selected.length,measurements:report.results.length*2,platform:process.platform,playbackCertified:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
