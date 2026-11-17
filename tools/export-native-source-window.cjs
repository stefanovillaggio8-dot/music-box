"use strict";
// Offline forensic capture, not a playback or musical certificate. No lag fit.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),candidate=require('../audits/ste-architecture-20261116/unreleased-cadence-candidate.json'),cue=candidate.record.cue;
const browserName=process.env.MUSICBOX_NATIVE_BROWSER,output=process.env.MUSICBOX_NATIVE_WINDOW_OUTPUT;
if(!['chromium','webkit'].includes(browserName)||!output)throw Error('Explicit browser and new output directory required');
const folder=path.resolve(output);if(fs.existsSync(folder))throw Error('Capture output must not overwrite existing files');
const sim=fs.readFileSync(path.join(root,'tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
process.argv.push('--personal-only=true','--exclude-playlists=Ste:gym');
const {members}=new Function('require','__dirname',sim.slice(0,sim.indexOf('(async()=>'))+'return {members};')(require,path.join(root,'tools'));
const personal=new Set(members('Ste').map(t=>'audio/'+t.file));
const captureKey=process.env.MUSICBOX_NATIVE_SOURCE_KEY||candidate.sourceKey,isCandidate=captureKey===candidate.sourceKey;
assert.match(captureKey,/^audio\/songs\/[A-Za-z0-9_-]+\.mp3$/);
assert.ok(personal.has(captureKey)&&(!isCandidate||personal.has(candidate.targetKey)),'Every captured recording must remain in the actual personal Ste scope');
const index=require('../dj-deep-analysis.json'),entry=index.entries[captureKey],sourceSha=entry.sha;
assert.equal(entry.status,'ok');assert.ok(Number.isFinite(entry.duration)&&entry.duration>26);
if(isCandidate){assert.equal(sourceSha,cue.sourceSha);assert.equal(index.entries[candidate.targetKey].sha,cue.targetSha);}
const captureCue=isCandidate?cue:{begin:entry.duration-17+.8,composite:{preRoll:.3}};
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+captureKey.slice(6));assert.equal(response.ok,true);
 const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length<32e6);assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'),sourceSha);
 fs.mkdirSync(folder,{recursive:true});const written=new Map();let server,browser;
 try{
  server=http.createServer((req,res)=>{
   if(req.url==='/original.mp3'){res.setHeader('Content-Type','audio/mpeg');res.setHeader('Content-Length',bytes.length);res.end(bytes);return;}
   const match=/^\/pcm\/(44100|48000)$/.exec(req.url);
   if(req.method==='POST'&&match){
    const rate=Number(match[1]);if(written.has(rate)){res.writeHead(409).end();return;}
    let size=0;const parts=[];req.on('data',chunk=>{size+=chunk.length;if(size>12e6)req.destroy();else parts.push(chunk)});
    req.on('end',()=>{try{const content=Buffer.concat(parts);assert.ok(content.length>0&&content.length%8===0);const file=rate+'.f32le';fs.writeFileSync(path.join(folder,file),content,{flag:'wx'});written.set(rate,{file,bytes:content.length,sha256:sha256(content)});res.end('stored');}catch(e){res.writeHead(400).end(String(e.message))}});return;
   }
   res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Read-only native source capture</title>');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await({chromium,webkit}[browserName]).launch({headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  const windows=await page.evaluate(async cue=>{
   const rows=[];
   if(new Uint8Array(new Uint16Array([1]).buffer)[0]!==1)throw Error('Expected little-endian IEEE float capture');
   for(const sampleRate of [44100,48000]){
    const ctx=new AudioContext({sampleRate});try{
     if(ctx.sampleRate!==sampleRate)throw Error('Native rate differs');
     const pcm=await ctx.decodeAudioData(await(await fetch('/original.mp3')).arrayBuffer()),startFrame=Math.floor((cue.begin-cue.composite.preRoll-.5)*sampleRate),frames=pcm.length-startFrame;
     if(pcm.numberOfChannels!==2||startFrame<0||frames<=sampleRate||frames>32*sampleRate)throw Error('Unbounded native source window');
     const interleaved=new Float32Array(frames*2),left=pcm.getChannelData(0),right=pcm.getChannelData(1);
     for(let i=0;i<frames;i++){const l=left[startFrame+i],r=right[startFrame+i];if(!Number.isFinite(l)||!Number.isFinite(r))throw Error('Nonfinite native source');interleaved[2*i]=l;interleaved[2*i+1]=r;}
     const result=await fetch('/pcm/'+sampleRate,{method:'POST',body:interleaved.buffer});if(!result.ok)throw Error('Native capture not stored');
     rows.push({sampleRate,startFrame,frames,channels:2,decodedSourceFrames:pcm.length,decodedSourceDuration:pcm.duration,throughDecodedEOF:true,sourceProcessing:'none',fittedLagApplied:false});
    }finally{await ctx.close()}
   }
   return rows;
  },captureCue);
  const result={method:'actual-native-source-window-v1',decoderApi:'AudioContext.decodeAudioData',captureRevision:process.env.GITHUB_SHA||null,workflowRun:process.env.GITHUB_RUN_ID||null,forensicOnly:true,notPlaybackCertification:true,physicalIPhone:false,nativePlatform:process.platform,browser:browserName,browserVersion:browser.version(),sourceKey:captureKey,targetKey:isCandidate?candidate.targetKey:null,sourceSha,originalSha256:sha256(bytes),originalBytes:bytes.length,sourceOnlyControl:!isCandidate,candidateAssetSha256:isCandidate?cue.composite.sha256:null,windows:windows.map(w=>{const file=written.get(w.sampleRate);assert.equal(file.bytes,w.frames*8);return {...w,...file}})};
  fs.writeFileSync(path.join(folder,'capture.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
 }finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
