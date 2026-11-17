'use strict';
// Real app + original MP3s: a rejected masked introduction must not run
// silently before native EOF. This is clock/gain evidence, not listening.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
const ids=['166','181'],originals=new Map();
async function loadOriginals(){for(const id of ids){
 const row=index.entries['audio/songs/track-'+id+'.mp3'];
 const file=path.resolve(process.env.MUSICBOX_ORIGINAL_CACHE||path.join(root,'../original-mp3'),row.sha+'.mp3');
 let bytes;
 if(fs.existsSync(file))bytes=fs.readFileSync(file);
 else{
  const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-'+id+'.mp3',{signal:AbortSignal.timeout(60000)});
  assert.equal(response.ok,true);bytes=Buffer.from(await response.arrayBuffer());
 }
 const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(sha,row.sha);originals.set(id,bytes);
}}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
 fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(bytes)});
});
(async()=>{
 await loadOriginals();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,results=[];
 try{
  for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
   if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
   const browser=await type.launch({headless:true});
   try{
    const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     const id=/\/songs\/track-(166|181)\.mp3$/.exec(url.pathname)?.[1];
     if(!id){if(url.origin===origin)await route.continue();else await route.abort();return}
     const bytes=originals.get(id),headers={'Accept-Ranges':'bytes','Access-Control-Allow-Origin':'*'};
     const range=/^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range||'');
     if(range){
      const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
      if(lo>hi||lo>=bytes.length){await route.fulfill({status:416,headers:{...headers,'Content-Range':'bytes */'+bytes.length},body:''});return}
      await route.fulfill({status:206,contentType:'audio/mpeg',headers:{...headers,'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`},body:bytes.subarray(lo,hi+1)});
     }else await route.fulfill({status:200,contentType:'audio/mpeg',headers,body:bytes});
    });
    await page.addInitScript(()=>{
     localStorage.setItem('mb.profile',JSON.stringify('Ste'));localStorage.setItem('mb.shuffle','false');
     window.__intro={plays:[],oldEnded:false,overlays:[]};
     const play=HTMLMediaElement.prototype.play;
     HTMLMediaElement.prototype.play=function(){
      // currentSrc can still name the previous recording immediately
      // after src assignment. Observe the requested media identity too.
      const src=this.src||this.currentSrc;
      // Capture EOF before the app's normal ended listener starts its
      // successor synchronously. A later bubble listener would falsely
      // label that legitimate handoff as pre-EOF playback.
      if(/track-166\.mp3/.test(src))this.addEventListener('ended',()=>{__intro.oldEnded=true},{capture:true,once:true});
      if(/track-181\.mp3/.test(src))__intro.plays.push({at:this.currentTime,volume:this.volume,muted:this.muted,afterEof:__intro.oldEnded,requestedSource:src,currentSource:this.currentSrc});
      return play.apply(this,arguments);
     };
     const info=console.info;console.info=function(...args){if(args.some(a=>String(a).includes('Sovrapposizione audio avviata')))__intro.overlays.push(args.join(' '));return info.apply(this,args)};
    });
    await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MusicBoxMix?.diagnostics().deepIndexLoaded&&
     ['b-track-166','b-track-181'].every(id=>MusicBoxBridge.playable().some(t=>t.id===id)),null,{timeout:30000});
    const decision=await page.evaluate(()=>MusicBoxMix.inspectPair('b-track-166','b-track-181'));
    assert.equal(decision.approved,false,'the masked overlay must be rejected by the actual app');
    await page.evaluate(duration=>{
     const button=document.createElement('button');button.id='intro-start';button.textContent='Play originals';
     button.style.cssText='position:fixed;top:0;left:0;z-index:2147483647';
     button.onclick=async event=>{
      try{
       MusicBoxBridge.mixEnableAudio(event);
       await MusicBoxBridge.mixHandoff('b-track-166',duration-12);
       if(MusicBoxBridge.mixEnqueue(['b-track-181'])!==1)throw Error('Manual personal queue not prepared');
      }catch(error){__intro.error=String(error)}
     };document.body.append(button);
    },index.entries['audio/songs/track-166.mp3'].duration);
    await page.click('#intro-start');
    try{await page.waitForFunction(()=>MusicBoxBridge.currentId()==='b-track-181'&&MusicBoxBridge.audio().currentTime>1.2&&!MusicBoxBridge.audio().paused,null,{timeout:45000});}
    catch(error){console.error(name,await page.evaluate(()=>({trace:__intro,id:MusicBoxBridge.currentId(),time:MusicBoxBridge.audio()?.currentTime,next:MusicBoxBridge.mixNext(),diagnostics:MusicBoxMix.diagnostics()})));throw error;}
    const proof=await page.evaluate(()=>({trace:__intro,currentId:MusicBoxBridge.currentId(),time:MusicBoxBridge.audio().currentTime,
     nativeVolume:MusicBoxBridge.audio().volume,requestedVolume:MusicBoxBridge.volume(),muted:MusicBoxBridge.audio().muted,
     tempo:MusicBoxBridge.audio().playbackRate,personal:MusicBoxBridge.playable().some(t=>t.id===MusicBoxBridge.currentId())}));
    console.error(name,'original entrance trace',JSON.stringify(proof));
    assert.equal(proof.trace.error,undefined);assert.equal(proof.trace.oldEnded,true);
    assert.ok(proof.trace.plays.length>=1);assert.ok(proof.trace.plays.every(p=>p.afterEof&&p.at<.3),'the opening cannot advance under the previous song');
    assert.equal(proof.trace.overlays.length,0);assert.equal(proof.nativeVolume,proof.requestedVolume);
    assert.equal(proof.muted,false);assert.equal(proof.tempo,1);assert.equal(proof.personal,true);
    results.push({browser:name,method:'actual-personal-app-unmasked-natural-introduction-v1',physicalIPhone:false,
     sourceSha:index.entries['audio/songs/track-166.mp3'].sha,targetSha:index.entries['audio/songs/track-181.mp3'].sha,...proof});
    await context.close();
   }finally{await browser.close()}
  }
  console.log(JSON.stringify({results},null,2));
 }finally{server.close()}
})().catch(error=>{console.error(error);process.exitCode=1;server.close()});
