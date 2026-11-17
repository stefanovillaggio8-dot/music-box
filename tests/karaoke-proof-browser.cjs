'use strict';
// CI only: native WebCrypto, bounded same-origin proof loading and real DOM.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),{fromCtc,hash}=require('../tools/karaoke-acoustic-proof.cjs');
const root=path.resolve(__dirname,'..'),browserName=process.env.MUSICBOX_COMPOSITE_BROWSERS;
if(!['chromium','webkit'].includes(browserName))throw Error('Select one CI browser');
const rows=[{t:1,text:'we watch heavy engines closely tonight'},{t:6,text:'another verse follows'}],audioSha256='a'.repeat(64);
const words=rows[0].text.split(' ').map((text,i)=>({lineIndex:0,wordIndex:i,text,t:1+i*.5,separatorAt:1.3+i*.5,
 confidence:.85,wholeFrameConfidence:.85,contextConfidence:.85,contextMaximumLogRatio:0,separatorConfidence:.95,boundaryGreedyExact:true,greedyExact:true}));
const proof=fromCtc(rows,rows.map(r=>({start:r.t,text:r.text})),words,audioSha256,'488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d');
proof.asr={model:'onnx-community/whisper-tiny_timestamped',revision:'517244293732ee2d58139af5814231b7e6830a0d',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}};
proof.recognizedRows=[{rowIndex:0,sourceT:1,t:1,partialAudio:false,words:words.map(w=>({wordIndex:w.wordIndex,t:w.t,end:w.separatorAt}))}];
const bytes=Buffer.from(JSON.stringify(proof)),sha256=hash(bytes),asset='karaoke-acoustic/'+sha256+'.json';
const files=new Map([['/',Buffer.from('<!doctype html><title>Karaoke acoustic evidence</title><p id="lyric"></p><script src="word-karaoke.js"></script><script src="karaoke-acoustic-proof.js"></script>')],
 ['/word-karaoke.js',fs.readFileSync(path.join(root,'word-karaoke.js'))],['/karaoke-acoustic-proof.js',fs.readFileSync(path.join(root,'karaoke-acoustic-proof.js'))],
 ['/karaoke-acoustic-index.json',Buffer.from(JSON.stringify({version:1,entries:{[audioSha256]:{path:asset,sha256,bytes:bytes.length}}}))],['/'+asset,bytes]]);
const requests=[];const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');requests.push(url.pathname);const content=files.get(url.pathname);
 if(!content){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',url.pathname.endsWith('.js')?'application/javascript':url.pathname.endsWith('.json')?'application/json':'text/html');
 res.setHeader('Content-Length',content.length);res.end(content);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await ({chromium,webkit}[browserName]).launch({headless:true});const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  const result=await page.evaluate(async({rows,audioSha256})=>{
   const api=window.MusicBoxAcousticProof,engine=window.MusicBoxWordKaraoke;
   const measured=await api.load(rows,audioSha256),observed=rows[0].text.split(' ').map((text,i)=>({text,t:1+i*.5,end:1.3+i*.5}));
   const additions=api.proposals(rows,measured,[observed]);
   const precomputed=api.recognizedRows(engine.estimateRows(rows),measured);
   const saved=engine.normalizeRows(additions),elements=engine.spanWords(document,saved[0],document.getElementById('lyric'));
   engine.paintWords(saved[0],elements,2.05);
   const changed=await api.load([{...rows[0],text:'different lyrics'},rows[1]],audioSha256);
   const wrongSource=await api.load(rows,'b'.repeat(64));
   return {precomputedWords:precomputed[0]?.words?.length||0,accepted:saved[0].acousticSpans.length,domWords:elements.length,changedRejected:changed===null,
    wrongSourceRejected:wrongSource===null,exactEnd:saved[0].acousticSpans[0].end};
  },{rows,audioSha256});
  assert.equal(result.accepted,6);assert.equal(result.domWords,6);assert.equal(result.exactEnd,1.3);
  assert.equal(result.precomputedWords,6);
  assert.equal(result.changedRejected,true);assert.equal(result.wrongSourceRejected,true);
  await page.context().setOffline(true);
  const offline=await page.evaluate(async({rows,audioSha256})=>{
   const proof=await MusicBoxAcousticProof.load(rows,audioSha256);
   return proof?{cached:true,words:MusicBoxAcousticProof.recognizedRows(MusicBoxWordKaraoke.estimateRows(rows),proof)[0]?.words.length||0}:{cached:false,words:0};
  },{rows,audioSha256});
  assert.equal(offline.words,offline.cached?6:0);assert.ok(requests.every(p=>files.has(p)||p==='/favicon.ico'));
  console.log(JSON.stringify({browser:browserName,actualNativeWebCryptoAndFetch:true,offlineCachedOrSafeFallback:true,offline,...result}));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
