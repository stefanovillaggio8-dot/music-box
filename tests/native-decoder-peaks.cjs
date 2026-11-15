'use strict';
// CI only. Measure the actual native decoder without changing the player's
// absolute clipping checks, playing audio, fetching MP3s or deleting storage.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json'),'utf8')),assets=new Map();
for(const entry of Object.values(index.entries))for(const record of Object.values(entry.structuralBeatPlans||{}))
 for(const cue of record.cues||[record.cue])if(cue?.rhythmicTailWindow&&cue.composite)assets.set(cue.composite.sha256,cue.composite);
const name=process.env.MUSICBOX_COMPOSITE_BROWSERS;if(!['chromium','webkit'].includes(name))throw Error('Select one native decoder');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.end('<!doctype html><title>Read-only native PCM measurement</title>');return;}
 if(!/^\/dj-mixes\/[a-f0-9]{64}\.flac$/.test(url.pathname)){res.writeHead(404);res.end();return;}
 const bytes=fs.readFileSync(path.join(root,url.pathname));res.setHeader('Content-Type','audio/flac');res.setHeader('Content-Length',bytes.length);res.end(bytes);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await ({chromium,webkit}[name]).launch({headless:true});const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  const measured=await page.evaluate(async descriptors=>{
   const results=[];
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
     results.push({assetSha256:sha,sampleRate,samplePeak,overlapPeak,channels:decoded.numberOfChannels,duration:decoded.duration});
    }}finally{await ctx.close()}
   }
   return results;
  },[...assets.values()]);
  assert.equal(measured.length,assets.size*2);
  console.log(JSON.stringify({method:'actual-browser-decode-v1',browser:name,browserVersion:browser.version(),physicalIPhone:false,assets:measured},null,2));
 }finally{await browser?.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
