'use strict';
// CI diagnostic: compare native MP3 metadata across transport paths. No
// player patches, source rewriting, audio publication or physical-iOS claim.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json'))).entries;
const keys=['audio/songs/track-4.mp3','audio/songs/track-934.mp3'],data=new Map(),requests=[];
const selected=process.env.MUSICBOX_COMPOSITE_BROWSERS;if(!['webkit','chromium'].includes(selected))throw Error('Choose one CI browser');
(async()=>{
 for(const key of keys){const sha=entries[key].sha,url='https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+key.slice(6);
  const response=await fetch(url);if(!response.ok)throw Error('Original unavailable');const bytes=Buffer.from(await response.arrayBuffer());
  if(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')!==sha)throw Error('Original changed');data.set(sha,bytes);
 }
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.end('<!doctype html><title>Native source metadata</title>');return;}
  const [,mode,sha]=pathname.split('/'),bytes=data.get(sha);if(!bytes){res.writeHead(404);res.end();return;}
  requests.push({mode,sha,range:req.headers.range||null});
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');res.setHeader('Content-Type','audio/mpeg');
  if(mode==='range'&&range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
   res.writeHead(206,{'Accept-Ranges':'bytes','Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));
  }else{if(mode==='range')res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',bytes.length);res.end(bytes);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await ({chromium,webkit}[selected]).launch({headless:true});const page=await browser.newPage(),base='http://127.0.0.1:'+server.address().port;
  await page.route('**/intercept/**',async route=>{const sha=new URL(route.request().url()).pathname.split('/')[2];requests.push({mode:'intercept',sha,range:route.request().headers().range||null});await route.fulfill({status:200,contentType:'audio/mpeg',body:data.get(sha)});});
  await page.goto(base);const results=[];
  for(const key of keys)for(const mode of ['range','whole','intercept']){
   const sha=entries[key].sha,url=base+'/'+mode+'/'+sha;
   const result=await page.evaluate(async url=>{
    const audio=new Audio();audio.preload='auto';audio.crossOrigin='anonymous';
    const metadata=await new Promise(resolve=>{const timer=setTimeout(()=>resolve({timeout:true}),10000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve({duration:audio.duration,readyState:audio.readyState})};audio.onerror=()=>{clearTimeout(timer);resolve({error:audio.error?.code})};audio.src=url;audio.load()});
    let decodedDuration=null,decodeError=null;try{const bytes=await(await fetch(url)).arrayBuffer();const context=new OfflineAudioContext(2,44100,44100);decodedDuration=(await context.decodeAudioData(bytes)).duration}catch(error){decodeError=String(error)}
    audio.removeAttribute('src');audio.load();return {metadata,decodedDuration,decodeError};
   },url);results.push({key,sha,mode,expectedDuration:entries[key].duration,...result});
  }
  console.log(JSON.stringify({browser:selected,physicalIPhone:false,results,requests},null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
