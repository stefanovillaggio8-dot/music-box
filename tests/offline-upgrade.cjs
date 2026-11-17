"use strict";
// Real WebKit update/activation. Synthetic bytes test persistence, not audio decoding.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),release=require('../versione.json').versione,revision=release.replace(/\./g,''),prefix='spotifynonavraiimieisoldi';
const previous=fs.readFileSync(path.join(__dirname,'fixtures/sw-6734.js'));let updated=false;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/upgrade.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Isolated storage upgrade</title>');return;}
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const bytes=url.pathname==='/sw.js'&&!updated?previous:fs.existsSync(file)&&fs.statSync(file).isFile()?fs.readFileSync(file):null;
 if(!bytes){res.writeHead(404).end();return;}
 const type={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
 res.setHeader('Content-Type',type);res.end(bytes);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await webkit.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),origin='http://127.0.0.1:'+server.address().port;
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(origin+'/upgrade.html');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  const seed=await page.evaluate(async prefix=>{
   const sentinels=[];
   for(const profile of ['Ste','Diego','Emanuele']){
    const name=prefix+'-brani-'+profile,url=new URL('/songs/'+profile+'-saved.mp3',location.href).href,body='original-download-'+profile;
    await(await caches.open(name)).put(url,new Response(body));sentinels.push({name,url,body});
   }
   const legacyUrl=new URL('/songs/legacy-saved.mp3',location.href).href;
   await(await caches.open(prefix+'-v6734')).put(legacyUrl,new Response('legacy-original-download'));
   await(await caches.open('unrelated-origin-app-cache')).put('/foreign-data',new Response('keep-other-app'));
   localStorage.setItem('upgrade-personal-sentinel',JSON.stringify({favorites:['unchanged'],settings:{mix:true},playlist:['one','two']}));
   await new Promise((resolve,reject)=>{const r=indexedDB.open('upgrade-personal-sentinel',1);r.onupgradeneeded=()=>r.result.createObjectStore('settings');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const d=r.result,t=d.transaction('settings','readwrite');t.objectStore('settings').put('unchanged-user-data','account');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)};});
   return {sentinels,legacyUrl,personal:localStorage.getItem('upgrade-personal-sentinel')};
  },prefix);
  updated=true;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async({prefix,revision})=>(await caches.keys()).includes(prefix+'-v'+revision),{prefix,revision},{timeout:60000});
  // Match the app's explicit update action. Installation alone deliberately
  // cannot activate over a listening session.
  await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting,{},{timeout:60000});
  await page.evaluate(async()=>{(await navigator.serviceWorker.getRegistration()).waiting.postMessage({type:'SKIP_WAITING'});});
  // Wait for the new worker to activate and finish its migration, not just install.
  await page.waitForFunction(async({prefix,revision})=>{const r=await navigator.serviceWorker.getRegistration();return !r.installing&&!r.waiting&&r.active?.state==='activated'&&!(await caches.keys()).includes(prefix+'-v6734');},{prefix,revision},{timeout:60000});
  const proof=await page.evaluate(async({seed,prefix})=>{
   const exact=[];for(const s of seed.sentinels)exact.push((await(await(await caches.open(s.name)).match(s.url))?.text())===s.body);
   let legacyRetained=false;for(const name of await caches.keys()){const r=await(await caches.open(name)).match(seed.legacyUrl);if(r&&await r.text()==='legacy-original-download')legacyRetained=true;}
   const foreign=await(await(await caches.open('unrelated-origin-app-cache')).match('/foreign-data')).text();
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('upgrade-personal-sentinel',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result)});
   const indexed=await new Promise((resolve,reject)=>{const r=db.transaction('settings').objectStore('settings').get('account');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();
   return {savedPerProfile:exact,legacyRetained,foreign,localUnchanged:localStorage.getItem('upgrade-personal-sentinel')===seed.personal,indexed,cacheNames:await caches.keys()};
  },{seed,prefix});
  assert.deepEqual(proof.savedPerProfile,[true,true,true]);assert.equal(proof.legacyRetained,true);assert.equal(proof.foreign,'keep-other-app');assert.equal(proof.localUnchanged,true);assert.equal(proof.indexed,'unchanged-user-data');
  await context.setOffline(true);
  const offline=await page.evaluate(async revision=>{const r=await fetch('/app.js?v='+revision+'&words=16');return {status:r.status,body:await r.text()};},revision);
  assert.equal(offline.status,200);assert.ok(offline.body.includes('const APP_VERSION = "'+release+'";'));
  console.log(JSON.stringify({method:'actual-webkit-service-worker-upgrade-v1',from:'6.734',to:release,physicalIPhone:false,originalMediaDecoding:false,proof,offlineNewPlayer:true},null,2));
  await context.close();
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
