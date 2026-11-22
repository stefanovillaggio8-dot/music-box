'use strict';
// Real original Kid Yugi MP3, actual app startup/Play/refresh. No physical
// iPhone claim. The explicit reset-on-Play trial is labelled fault injection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const id='b-track-27',row=require('../dj-deep-analysis.json').entries['audio/songs/track-27.mp3'],target=37.321;
async function main(){
 const file=path.resolve(process.env.MUSICBOX_ORIGINAL_CACHE||path.join(root,'../original-mp3'),row.sha+'.mp3');
 const bytes=fs.existsSync(file)?fs.readFileSync(file):Buffer.from(await (await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-27.mp3')).arrayBuffer());
 assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),row.sha);
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,body)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(body)});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,results=[];
 try{for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await type.launch({headless:true});
  try{for(const [minutes,resetDecoder,noAnimationFrames] of [[119,false,false],[119,true,false],[119,false,true],[121,false,false],[299,false,false],[301,false,false]]){
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(!/\/songs\/track-27\.mp3$/.test(url.pathname)){if(url.origin===origin)await route.continue();else await route.abort();return}
    const headers={'Accept-Ranges':'bytes','Access-Control-Allow-Origin':'*'},range=/^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range||'');
    if(range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
     if(lo>hi){await route.fulfill({status:416,headers:{...headers,'Content-Range':'bytes */'+bytes.length},body:''});return}
     await route.fulfill({status:206,contentType:'audio/mpeg',headers:{...headers,'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`},body:bytes.subarray(lo,hi+1)});
    }else await route.fulfill({status:200,contentType:'audio/mpeg',headers,body:bytes});
   });
   await page.addInitScript(({id,target,minutes,resetDecoder})=>{
    if(!sessionStorage.getItem('session-test-seeded')){
     const quando=Date.now()-minutes*60000;
     localStorage.setItem('mb.profile',JSON.stringify('Ste'));localStorage.setItem('mb.profiles',JSON.stringify(['Ste','Diego','Emanuele']));
     localStorage.setItem('mb.state',JSON.stringify({Ste:{last:id,time:target,quando,favs:[id]},Diego:{last:'b-track-353',time:24,quando}}));
     localStorage.setItem('mb.playback.Ste',JSON.stringify({id,time:target,quando}));localStorage.setItem('mb.suonava',JSON.stringify('no'));
     localStorage.setItem('mb.shuffle',JSON.stringify(true));localStorage.setItem('mb.shuffle.cicli.v1.Ste',JSON.stringify({test:{played:[id],at:quando}}));
     localStorage.setItem('mb.shuffle.cicli.v1.Diego',JSON.stringify({test:{played:['other'],at:quando}}));
     sessionStorage.setItem('session-test-seeded','yes');
    }
    window.__sessionTrace={plays:[],audible:[],resetDecoder,faultApplied:false};
    const original=HTMLMediaElement.prototype.play,muted=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'muted');
    Object.defineProperty(HTMLMediaElement.prototype,'muted',{...muted,set(value){muted.set.call(this,value);
     if(!value&&!this.paused&&/track-27\.mp3/.test(this.src))__sessionTrace.audible.push({at:this.currentTime,seeking:this.seeking});}});
    HTMLMediaElement.prototype.play=function(){
     if(/track-27\.mp3/.test(this.src)){
      if(resetDecoder&&!__sessionTrace.faultApplied){__sessionTrace.faultApplied=true;this.currentTime=0}
      __sessionTrace.plays.push({at:this.currentTime,muted:this.muted});
     }
     return original.apply(this,arguments);
    };
   },{id,target,minutes,resetDecoder});
   await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MusicBoxBridge&&localStorage.getItem('mb.sessione.attiva.v1.Ste'),null,{timeout:30000});
   const initial=await page.evaluate(()=>({id:MusicBoxBridge.currentId(),time:MusicBoxBridge.audio()?.currentTime,paused:MusicBoxBridge.audio()?.paused,
    plays:__sessionTrace.plays,shuffle:JSON.parse(localStorage.getItem('mb.shuffle.cicli.v1.Ste')),other:JSON.parse(localStorage.getItem('mb.shuffle.cicli.v1.Diego'))}));
   assert.equal(initial.plays.length,0,'Reopening must not autoplay');assert.equal(initial.paused,true);
   assert.deepEqual(initial.other.test.played,['other']);
   if(minutes<120){
    assert.equal(initial.id,id);assert.deepEqual(initial.shuffle.test.played,[id]);
    // Separate scheduling fault: media timeupdate/seeked must complete the
    // restore even when background-like conditions provide no RAF callbacks.
    if(noAnimationFrames)await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
    await page.click('#btnPlay',{force:true});
    try{await page.waitForFunction(t=>{const a=MusicBoxBridge.audio();return !a.paused&&!a.seeking&&!a.muted&&a.currentTime>=t+.04&&a.currentTime<t+2},target,{timeout:15000})}
    catch(e){console.error(name,minutes,await page.evaluate(()=>({id:MusicBoxBridge.currentId(),time:MusicBoxBridge.audio()?.currentTime,ready:MusicBoxBridge.audio()?.readyState,muted:MusicBoxBridge.audio()?.muted,error:MusicBoxBridge.audio()?.error?.code,trace:__sessionTrace})));throw e}
    const played=await page.evaluate(()=>({time:MusicBoxBridge.audio().currentTime,trace:__sessionTrace}));
    assert.ok(played.trace.plays.every(x=>x.muted||x.at>=target-.2));
    assert.ok(played.trace.audible.every(x=>x.at>=target-.2&&!x.seeking));
    assert.equal(played.trace.faultApplied,resetDecoder);
    await page.click('#btnPlay',{force:true});const paused=await page.evaluate(()=>MusicBoxBridge.audio().currentTime);
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>MusicBoxBridge?.currentId()==='b-track-27',null,{timeout:30000});
    await page.click('#btnPlay',{force:true});await page.waitForFunction(t=>!MusicBoxBridge.audio().paused&&!MusicBoxBridge.audio().muted&&MusicBoxBridge.audio().currentTime>=t-.2,paused,{timeout:15000});
    results.push({browser:name,minutes,resetDecoder,noAnimationFrames:!!noAnimationFrames,restoredTime:played.time,refreshPosition:paused,sourceSha:row.sha,noAutoplay:true});
   }else{
    assert.equal(initial.id,null);assert.equal(initial.time,0);
    assert.equal(Object.keys(initial.shuffle).length===0,minutes>=300);
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>MusicBoxBridge&&localStorage.getItem('mb.sessione.attiva.v1.Ste'),null,{timeout:30000});
    assert.equal(await page.evaluate(()=>MusicBoxBridge.currentId()),null,'A second refresh cannot resurrect the expired selection');
    results.push({browser:name,minutes,emptySelection:true,shuffleReset:minutes>=300,noAutoplay:true});
   }
   await context.close();
  }}finally{await browser.close()}
 }}finally{server.close()}
 console.log(JSON.stringify({method:'actual-original-mp3-session-reopen-v1',physicalIPhone:false,results},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
