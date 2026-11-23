'use strict';
// Actual application/DOM; controlled lyric metadata and a mocked translation
// provider. No lyrics are sent to a real service and no audio accuracy is claimed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
let code=fs.readFileSync(process.env.MUSICBOX_TRANSLATION_APP_FIXTURE||path.join(root,'app.js'),'utf8');
const replace=(marker,text)=>{assert.equal(code.split(marker).length,2);code=code.replace(marker,text)};
replace('  function currentLyrics() {','  function currentLyrics() {\n    if(window.__translationNoLyrics)return null;\n    if(window.__phraseRows)return {title:"Phrase fixture",artist:"UI test",text:__phraseRows.map(x=>x.text).join("\\n"),synced:""};');
replace('  function _righeTestoConParole(l){','  function _righeTestoConParole(l){\n    if(window.__phraseRows)return window.__phraseRows;');
replace('  function openLyrics() {',`  window.__translationHarness={
 open(lines,id='b-track-38'){
  currentId=id;window.__translationNoLyrics=false;window.__phraseRows=lines.map((text,i)=>({t:2+i*3,end:3+i*3,text}));
  Object.defineProperty(audio,'currentTime',{configurable:true,get:()=>2.5});
  _vistaTestiCompleta=false;openLyrics();
 },missing(){currentId='b-track-4';window.__translationNoLyrics=true;openLyrics()}
 };
  function openLyrics() {`);
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 if(u.pathname==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(code);return}
 const types={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'};
 try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch(_){res.writeHead(404).end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const results=[];
 try{for(const name of (process.env.MUSICBOX_COMPOSITE_BROWSERS||'chromium').split(',')){
  assert.ok(['chromium','webkit'].includes(name));const browser=await({chromium,webkit}[name]).launch({headless:true});
  try{
   const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await context.newPage(),queries=[],heavy=[],aborted=[],pending=[];let deferredLine=null;
   page.on('request',r=>{if(/audio-lyrics-worker|\.onnx(?:\?|$)|huggingface/.test(r.url()))heavy.push(r.url())});
   page.on('requestfailed',r=>{if(r.url().includes('mymemory.translated.net'))aborted.push(r.url())});
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.origin==='http://127.0.0.1:'+server.address().port)return route.continue();
    if(u.hostname==='api.mymemory.translated.net'){
     const q=u.searchParams.get('q');queries.push(q);
     if(q===deferredLine){pending.push(route);return}
     const text=q==='Entity fixture'?'Caff&#232; &amp; &lt;img src=x onerror=alert(1)&gt;':'IT '+q;
     return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({responseStatus:200,responseData:{translatedText:text}})});
    }
    return route.abort();
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__translationHarness&&localStorage.getItem('mb.sessione.attiva.v1.Ste'),null,{timeout:30000});
   const open=async lines=>{await page.evaluate(lines=>{__translationHarness.open(lines);document.getElementById('lyricsLingua').value='en'},lines)};
   const translate=async()=>{await page.click('#lyricsTraduci');await page.waitForFunction(()=>document.getElementById('lyricsTraduci').getAttribute('aria-pressed')==='true')};
   const phrases=Array.from({length:61},(_,i)=>'Phrase '+i);
   await open(phrases);await translate();assert.equal(queries.length,60);assert.equal(await page.locator('.lyr-traduzione').count(),60);
   await page.click('#lyricsTraduci');await translate();assert.equal(queries.length,60,'Capped result must be reused');
   await open(['Before correction']);await translate();await open(['After correction']);await translate();
   assert.equal(await page.locator('.lyr-traduzione').textContent(),'IT After correction');
   const beforeRepeated=queries.length;await open(['Chorus','Verse','Chorus']);await translate();assert.equal(queries.length-beforeRepeated,2);
   await open(['Entity fixture']);await translate();assert.equal(await page.locator('.lyr-traduzione').textContent(),'Caffè & <img src=x onerror=alert(1)>');
   assert.equal(await page.locator('#lyricsBody img').count(),0);
   // Abort a real browser request on a switch to a song lacking lyrics.
   deferredLine='Delayed old line';await open([deferredLine]);await page.click('#lyricsTraduci');
   for(let tries=0;pending.length===0&&tries<100;tries++)await new Promise(r=>setTimeout(r,20));assert.equal(pending.length,1);
   await page.evaluate(()=>__translationHarness.missing());
   await pending.shift().fulfill({status:500,body:'obsolete failure'}).catch(()=>{});
   await page.waitForFunction(()=>document.getElementById('lyricsTraduci').disabled===false);
   assert.equal(await page.locator('#lyricsTraduci').textContent(),'Traduci');assert.equal(await page.locator('.lyr-traduzione').count(),0);
   // Closing the current reader also cancels its in-flight service work.
   deferredLine='Delayed close line';await open([deferredLine]);await page.click('#lyricsTraduci');
   for(let tries=0;pending.length===0&&tries<100;tries++)await new Promise(r=>setTimeout(r,20));assert.equal(pending.length,1);
   await page.click('#lyricsClose');await pending.shift().fulfill({status:500,body:'obsolete failure'}).catch(()=>{});
   await open(['Reopened phrase']);deferredLine=null;await translate();
   assert.equal(await page.locator('.lyr-traduzione').textContent(),'IT Reopened phrase');
   assert.equal(await page.locator('#lyricsBody .karaoke-word').count(),0);assert.equal(heavy.length,0);
   assert.ok(aborted.length>=2,'Both obsolete provider requests must be aborted');
   results.push({browser:name,cappedFirstRequests:60,cappedRepeatRequests:0,repeatedPhraseRequests:2,editedTextCorrect:true,abortedRequests:aborted.length,
    escapedTextSafe:true,phraseOnly:true,wordModelRequests:heavy.length,externalServiceCalls:0});
   await context.close();
  }finally{await browser.close()}
 }}finally{server.close()}
 console.log(JSON.stringify({method:'actual-app-translation-with-mocked-provider-v1',physicalIPhone:false,acousticAccuracyMeasured:false,results},null,2));
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
