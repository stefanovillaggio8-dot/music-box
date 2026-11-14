'use strict';
// Isolated real browser storage. No user's database/cache is opened.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const script=fs.readFileSync(path.join(__dirname,'../offline-storage-audit.js'));
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/audit.js'?'text/javascript':'text/html');res.end(req.url==='/audit.js'?script:'<script src="/audit.js"></script>');});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const results=[];
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&process.env.MUSICBOX_COMPOSITE_BROWSERS!==name)continue;
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
   let requests=0;page.on('request',()=>requests++);
   const r=await page.evaluate(async()=>{
    const prefix='spotifynonavraiimieisoldi',url=location.origin+'/songs/track-1.mp3?private=never-export',bytes=new Uint8Array(6000).fill(42);
    for(const type of ['brani','stream']){const c=await caches.open(prefix+'-'+type+'-Diego');await c.put(url,new Response(bytes,{headers:{'Content-Type':'audio/mpeg','Content-Length':'6000'}}));}
    const shell=await caches.open(prefix+'-fixture');await shell.put('/dj-deep-analysis.json',new Response('{}'));
    const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('isolated-musicbox-audit',1);q.onupgradeneeded=()=>{for(const name of ['tracks','lyrics','copertine'])q.result.createObjectStore(name,{keyPath:'id'});};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
    await new Promise((resolve,reject)=>{const tx=db.transaction(['tracks','lyrics','copertine'],'readwrite');tx.objectStore('tracks').put({id:'song',blob:new Blob([bytes])});tx.objectStore('lyrics').put({id:'song',synced:'[00:01] testo'});tx.objectStore('copertine').put({id:'__mb_favs__:Diego',favorites:['song']});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    window.Worker=function(){throw Error('Storage inventory cannot create workers')};window.AudioContext=function(){throw Error('Storage inventory cannot create audio contexts')};
    const before=await caches.keys(),report=await MusicBoxStorageAudit.inspect({db,profile:'Diego'}),after=await caches.keys();
    const read=store=>new Promise((resolve,reject)=>{const q=db.transaction(store,'readonly').objectStore(store).get(store==='copertine'?'__mb_favs__:Diego':'song');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
    const track=await read('tracks'),lyrics=await read('lyrics'),favorites=await read('copertine');
    const saved=await (await caches.open(prefix+'-brani-Diego')).match(url),preserved=new Uint8Array(await saved.arrayBuffer());
    const controller=new AbortController();controller.abort();let cancelled=false;
    try{await MusicBoxStorageAudit.inspect({db,signal:controller.signal})}catch(error){cancelled=/cancelled/.test(error.message)}
    db.close();return {report,cacheNamesUnchanged:JSON.stringify(before)===JSON.stringify(after),
     offlineAudioByteExact:preserved.length===bytes.length&&preserved.every((x,i)=>x===bytes[i]),
     importedAudioBytes:track.blob.size,lyricsPreserved:lyrics.synced==='[00:01] testo',favoritesPreserved:favorites.favorites[0]==='song',cancelled};
   });
   assert.equal(requests,0);assert.equal(r.report.caches.length,3);assert.equal(r.report.sameRequestCopies.length,1);
   assert.equal(r.report.caches.find(c=>c.name.endsWith('-fixture')).groups.musicalAnalysis.unknownSizeEntries,1);
   assert.equal(r.report.databases.find(d=>d.name==='tracks').blobBytes,6000);
   for(const key of ['cacheNamesUnchanged','offlineAudioByteExact','lyricsPreserved','favoritesPreserved','cancelled'])assert.equal(r[key],true,key);
   assert.equal(r.importedAudioBytes,6000);assert.equal(JSON.stringify(r.report).includes('never-export'),false);
   results.push({browser:name,...r,networkRequestsDuringAudit:requests,physicalIPhone:false});
  }finally{await browser.close()}
 }}finally{server.close()}
 console.log(JSON.stringify({results},null,2));
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
