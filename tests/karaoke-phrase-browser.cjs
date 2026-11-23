"use strict";
// Real application/DOM with controlled phrase metadata and media clock.
// This measures display behavior, not recognition accuracy or original audio.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const names=(process.env.MUSICBOX_COMPOSITE_BROWSERS||'chromium').split(',');
const appFile=process.env.MUSICBOX_PHRASE_APP_FIXTURE||path.join(root,'app.js');
let code=fs.readFileSync(appFile,'utf8');
const marker='  function currentLyrics() {';assert.equal(code.split(marker).length,2);
code=code.replace(marker,marker+'\n    if(window.__phraseRows)return {title:"Phrase fixture",artist:"UI test",text:__phraseRows.map(x=>x.text).join("\\n"),synced:""};');
const rowMarker='  function _righeTestoConParole(l){';assert.equal(code.split(rowMarker).length,2);
code=code.replace(rowMarker,rowMarker+'\n    if(window.__phraseRows)return window.__phraseRows;');
const hook='  function openLyrics() {';assert.equal(code.split(hook).length,2);
code=code.replace(hook,`  window.__phraseHarness={
 open(rows,id='b-track-27'){
  currentId=id;window.__phraseRows=rows;window.__phraseTime=2.5;
  Object.defineProperty(audio,'currentTime',{configurable:true,get:()=>window.__phraseTime});
  _vistaTestiCompleta=false;openLyrics();
 },at(t){window.__phraseTime=t;tickLyrics();}
 };
`+hook);
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 if(u.pathname==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(code);return}
 const types={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'};
 try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end()}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const result=[];
 try{for(const name of names){
  assert.ok(['chromium','webkit'].includes(name));const browser=await({chromium,webkit}[name]).launch({headless:true});
  try{
   const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await context.newPage(),heavy=[];
   page.on('request',r=>{if(/audio-lyrics-worker|\.onnx(?:\?|$)|huggingface/.test(r.url()))heavy.push(r.url())});
   await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:'+server.address().port?r.continue():r.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__phraseHarness&&localStorage.getItem('mb.sessione.attiva.v1.Ste'),null,{timeout:30000});
   const rows=[{t:2,end:3,text:'Entire sung phrase'},{t:12,text:'Next complete phrase'},{t:15,text:'Final whole phrase'}];
   await page.evaluate(rows=>__phraseHarness.open(rows),rows);
   const normal=[];
   for(const t of [2.5,6,12.25,2.75]){
    normal.push(await page.evaluate(t=>{__phraseHarness.at(t);return {time:t,active:[...document.querySelectorAll('#lyricsBody .lyr-line.on')].map(n=>n.textContent),wordSpans:document.querySelectorAll('#lyricsBody .karaoke-word').length}},t));
   }
   console.error(name,'normal phrase trace',JSON.stringify(normal));
   assert.deepEqual(normal.map(x=>x.active),[[rows[0].text],[],[rows[1].text],[rows[0].text]]);
   assert.ok(normal.every(x=>x.wordSpans===0));
   await page.click('#lyricsClose');await page.click('#btnImmersive');
   const immersive=[];
   for(const t of [2.5,6,12.25,2.75]){
    await page.evaluate(t=>__phraseHarness.at(t),t);
    await page.waitForFunction(({expected})=>JSON.stringify([...document.querySelectorAll('#imKaraoke .im-line.active')].map(n=>n.textContent))===JSON.stringify(expected),{expected:t===6?[]:t===12.25?[rows[1].text]:[rows[0].text]},{timeout:5000});
    immersive.push(await page.evaluate(()=>({active:[...document.querySelectorAll('#imKaraoke .im-line.active')].map(n=>n.textContent),wordSpans:document.querySelectorAll('#imKaraoke .karaoke-word').length})));
   }
   assert.ok(immersive.every(x=>x.wordSpans===0));
   await page.evaluate(()=>{__phraseHarness.open([{t:2,text:'Unknown ending'},{t:12,text:'Future phrase'},{t:15,text:'Last phrase'}]);__phraseHarness.at(6)});
   assert.equal(await page.locator('#lyricsBody .lyr-line.on').textContent(),'Unknown ending');
   assert.equal(heavy.length,0,'Opening either view must not start a word-alignment worker/model');
   result.push({browser:name,normal,immersive,unknownEndPreserved:true,wordAlignmentRequests:0});
   await context.close();
  }finally{await browser.close()}
 }}finally{server.close()}
 console.log(JSON.stringify({method:'actual-app-phrase-display-clock-v1',acousticAccuracyMeasured:false,physicalIPhone:false,results:result},null,2));
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
