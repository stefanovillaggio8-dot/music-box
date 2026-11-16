'use strict';
// Compare ORIGINAL and metadata-only representation through each native decoder.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),http=require('http'),assert=require('assert/strict');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'audits/acoustic-boundaries-20261115/metadata-pilot-candidates.json'))).entries;
const browserName=process.env.MUSICBOX_COMPOSITE_BROWSERS;if(!['chromium','webkit'].includes(browserName))throw Error('One native decoder required');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const assets=new Map();for(const [key,p] of Object.entries(entries)){
  const url='https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+key.slice(6),res=await fetch(url);assert.equal(res.ok,true);
  const original=Buffer.from(await res.arrayBuffer());assert.equal(hash(original),p.sourceSha256);
  const prefix=Buffer.from(p.prefixBase64,'base64'),wrapped=Buffer.concat([original.subarray(0,p.insertAt),prefix,original.subarray(p.insertAt)]);assert.equal(hash(wrapped),p.wrappedSha256);
  assets.set('/original/'+p.sourceSha,original);assets.set('/wrapped/'+p.sourceSha,wrapped);
 }
 const server=http.createServer((req,res)=>{const bytes=assets.get(req.url);if(bytes){res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':bytes.length});res.end(bytes)}else res.end('<title>Native metadata identity</title>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const results=[];
 try{
  browser=await ({chromium,webkit}[browserName]).launch({headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  for(const [key,proof] of Object.entries(entries))for(const sampleRate of [44100,48000]){
   const result=await page.evaluate(async({sampleRate,proof})=>{
    const ctx=new AudioContext({sampleRate});try{
     const original=await(await fetch('/original/'+proof.sourceSha)).arrayBuffer(),wrapped=await(await fetch('/wrapped/'+proof.sourceSha)).arrayBuffer();
     const a=await ctx.decodeAudioData(original),b=await ctx.decodeAudioData(wrapped);let maximumSampleDifference=0;
     if(a.length!==b.length||a.numberOfChannels!==b.numberOfChannels)return {sampleRate,originalFrames:a.length,wrappedFrames:b.length,accepted:false};
     for(let c=0;c<a.numberOfChannels;c++){const x=a.getChannelData(c),y=b.getChannelData(c);for(let i=0;i<x.length;i++)maximumSampleDifference=Math.max(maximumSampleDifference,Math.abs(x[i]-y[i]));}
     return {sampleRate,originalFrames:a.length,wrappedFrames:b.length,channels:a.numberOfChannels,maximumSampleDifference,accepted:maximumSampleDifference<=1e-7};
    }finally{await ctx.close()}
   },{sampleRate,proof});assert.equal(result.accepted,true,key+' at '+sampleRate);results.push({key,sourceSha:proof.sourceSha,sourceSha256:proof.sourceSha256,wrappedSha256:proof.wrappedSha256,...result});
  }
  console.log(JSON.stringify({method:'native-mp3-metadata-identical-pcm-v1',browser:browserName,physicalIPhone:false,maximumAllowedDifference:1e-7,results},null,2));
 }finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
