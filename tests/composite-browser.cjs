'use strict';
// Real native decoders + AudioContext in Chromium/WebKit. No physical
// iPhone/background-playback claim. Assets contain original Music Box PCM.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
const plans=Object.entries(data.entries).flatMap(([from,a])=>[...Object.values(a.pcmBeatPlans||{}),...Object.values(a.structuralBeatPlans||{})].filter(p=>p.cue?.composite).map(p=>({from,...p})));
if(!plans.length)throw Error('No actual composite plans to test');
const catalog=new Map(Object.entries(data.entries).map(([k,e])=>[e.sha,k])),sourceCache=new Map();
async function original(sha){
 if(sourceCache.has(sha))return sourceCache.get(sha);
 const key=catalog.get(sha);if(!key)throw Error('Unknown original');
 const local=path.resolve(process.env.MUSICBOX_ORIGINAL_CACHE||path.join(root,'../original-mp3'),sha+'.mp3');
 let bytes;
 if(fs.existsSync(local))bytes=fs.readFileSync(local);
 else{
  const [origin,...parts]=key.split('/'),base={audio:'music-box-brani/main',app:'music-box/main',mobile:'music-box/mobile-audio'}[origin];
  const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/'+base+'/'+parts.join('/'));
  if(!response.ok)throw Error('Original unavailable');bytes=Buffer.from(await response.arrayBuffer());
 }
 const actual=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 if(actual!==sha)throw Error('Original SHA mismatch');sourceCache.set(sha,bytes);return bytes;
}
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<button id="go">Audio</button><script src="/audio-composite-mix.js"></script>');return;}
  if(/^\/original\/[a-f0-9]{40}\.mp3$/.test(pathname)){
   const bytes=await original(pathname.slice(10,-4));res.setHeader('Content-Type','audio/mpeg');res.setHeader('Accept-Ranges','bytes');
   const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
   if(range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);res.writeHead(206,{'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));}
   else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}return;
  }
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.flac')?'audio/flac':'application/octet-stream');res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(500);res.end(String(e.message));}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const results=[];
 try{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
   const browser=await engine.launch({headless:true});
   try{
    const page=await browser.newPage();page.on('pageerror',e=>console.error(name,e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(()=>{document.querySelector('#go').onclick=()=>{window.ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:48000});window.ctx.resume()}});
    await page.click('#go');
    const decoded=await page.evaluate(async plans=>{
     for(const plan of plans){if(!MusicBoxCompositeMix.supports(plan.cue))throw Error('Descriptor rejected');await MusicBoxCompositeMix.prepare(plan.cue,ctx);}
     return plans.length;
    },plans);
    assert.equal(decoded,plans.length);
    const plan=[...plans].sort((a,b)=>a.cue.fade-b.cue.fade)[0];
    await original(plan.fromSha);await original(plan.toSha);
    await page.evaluate(async plan=>{
     window.cue=plan.cue;await MusicBoxCompositeMix.prepare(cue,ctx);
     window.player=new Audio('/original/'+plan.fromSha+'.mp3');window.id='out';
     window.trace={handoffs:0,mutedBeforePlay:false};
     window.app={audio:()=>player,currentId:()=>id,mixNext:()=>({id:'in'}),volume:()=>.7,wantsPlayback:()=>true,
      mixHandoff:(target,position,options)=>{
       trace.handoffs++;const previous=player;id=target;player=new Audio('/original/'+plan.toSha+'.mp3');
       player.muted=options?.muted===true;trace.mutedBeforePlay=player.muted;
       player.addEventListener('loadedmetadata',()=>{player.currentTime=position},{once:true});
       previous.pause();return player.play();
      }};
     await new Promise((resolve,reject)=>{player.addEventListener('loadedmetadata',resolve,{once:true});player.addEventListener('error',reject,{once:true});player.load()});
     player.currentTime=cue.begin-.25;
     await new Promise(resolve=>player.addEventListener('seeked',resolve,{once:true}));
     document.querySelector('#go').onclick=()=>{ctx.resume();player.play()};
    },plan);
    await page.click('#go');await page.waitForFunction(()=>!player.paused&&player.currentTime>=cue.begin-.25);
    const started=await page.evaluate(()=>MusicBoxCompositeMix.tryStart(cue,player,app,'in',ctx));assert.equal(started,true);
    await page.waitForFunction(()=>trace.handoffs===1&&!MusicBoxCompositeMix.active()&&!player.muted,{timeout:25000});
    const state=await page.evaluate(()=>({id,handoffs:trace.handoffs,mutedBeforePlay:trace.mutedBeforePlay,paused:player.paused,at:player.currentTime}));
    assert.equal(state.id,'in');assert.equal(state.handoffs,1);assert.equal(state.mutedBeforePlay,true);assert.equal(state.paused,false);
    // Repeat start then seek: the common source must release native mute.
    await page.evaluate(async plan=>{
     player.pause();id='out';player=new Audio('/original/'+plan.fromSha+'.mp3');
     await new Promise(resolve=>{player.addEventListener('loadedmetadata',resolve,{once:true});player.load()});
     player.currentTime=cue.begin-.1;await new Promise(resolve=>player.addEventListener('seeked',resolve,{once:true}));
     document.querySelector('#go').onclick=()=>player.play();
    },plan);
    await page.click('#go');await page.waitForFunction(()=>!player.paused);
    assert.equal(await page.evaluate(()=>MusicBoxCompositeMix.tryStart(cue,player,app,'in',ctx)),true);
    await page.waitForFunction(()=>player.muted);await page.evaluate(()=>{player.currentTime+=2});
    await page.waitForFunction(()=>!MusicBoxCompositeMix.active()&&!player.muted);
    results.push({browser:name,decodedOriginalMixes:decoded,actualNativeHandoff:state,seekRollback:true,physicalIPhone:false});
   }finally{await browser.close()}
  }
  console.log(JSON.stringify({results},null,2));
 }finally{server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
