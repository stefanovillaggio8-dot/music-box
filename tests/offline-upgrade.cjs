"use strict";
// Real WebKit update/activation. Synthetic bytes test persistence, not audio decoding.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),release=require('../versione.json').versione,revision=release.replace(/\./g,''),prefix='spotifynonavraiimieisoldi';
const previousFixture=process.env.MUSICBOX_PREVIOUS_WORKER_FIXTURE;
if(previousFixture&&!/^sw-\d{4,5}-[a-z0-9-]+\.js$/.test(previousFixture))throw Error('Explicit local worker fixture required');
const previousRevision=previousFixture?/^sw-(\d+)/.exec(previousFixture)[1]:process.env.MUSICBOX_PREVIOUS_REVISION||String(Number(revision)-1);
if(!/^\d{4,5}$/.test(previousRevision)||Number(previousRevision)>Number(revision)||Number(previousRevision)===Number(revision)&&!previousFixture)throw Error('Explicit previous worker revision required');
const previous=fs.readFileSync(path.join(__dirname,'fixtures',previousFixture||'sw-'+previousRevision+'.js'));
if(!previous.toString().includes('const CACHE = "'+prefix+'-v'+previousRevision+'"'))throw Error('Worker fixture version does not match');
const appAsset=/<script src="(app\.js\?[^\"]+)"/.exec(fs.readFileSync(path.join(root,'index.html'),'utf8'))[1].replaceAll('&amp;','&');
let updated=false;
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
  const seed=await page.evaluate(async({prefix,previousRevision})=>{
   const sentinels=[];
   for(const profile of ['Ste','Diego','Emanuele']){
    const name=prefix+'-brani-'+profile,url=new URL('/songs/'+profile+'-saved.mp3',location.href).href,body='original-download-'+profile;
    await(await caches.open(name)).put(url,new Response(body));sentinels.push({name,url,body});
   }
   const legacyUrl=new URL('/songs/legacy-saved.mp3',location.href).href;
   await(await caches.open(prefix+'-v'+previousRevision)).put(legacyUrl,new Response('legacy-original-download'));
   await(await caches.open('unrelated-origin-app-cache')).put('/foreign-data',new Response('keep-other-app'));
   localStorage.setItem('upgrade-personal-sentinel',JSON.stringify({favorites:['unchanged'],settings:{mix:true},playlist:['one','two']}));
   await new Promise((resolve,reject)=>{const r=indexedDB.open('upgrade-personal-sentinel',1);r.onupgradeneeded=()=>r.result.createObjectStore('settings');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const d=r.result,t=d.transaction('settings','readwrite');t.objectStore('settings').put('unchanged-user-data','account');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)};});
   return {sentinels,legacyUrl,personal:localStorage.getItem('upgrade-personal-sentinel')};
  },{prefix,previousRevision});
  updated=true;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async({prefix,revision})=>(await caches.keys()).includes(prefix+'-v'+revision),{prefix,revision},{timeout:60000});
  // Match the app's explicit update action. Installation alone deliberately
  // cannot activate over a listening session.
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const next=r.waiting||r.installing;if(next)next.postMessage({type:'SKIP_WAITING'});});
  // Wait for the new worker to activate and finish its migration, not just install.
  await page.waitForFunction(async({prefix,revision,previousRevision,appAsset})=>{
   const r=await navigator.serviceWorker.getRegistration(),names=await caches.keys();
   if(r.installing||r.waiting||r.active?.state!=='activated')return false;
   if(previousRevision===revision)return !!await(await caches.open(prefix+'-v'+revision)).match(new URL(appAsset,location.href));
   return !names.includes(prefix+'-v'+previousRevision);
  },{prefix,revision,previousRevision,appAsset},{timeout:60000});
  const proof=await page.evaluate(async({seed,prefix})=>{
   const exact=[];for(const s of seed.sentinels)exact.push((await(await(await caches.open(s.name)).match(s.url))?.text())===s.body);
   let legacyRetained=false;for(const name of await caches.keys()){const r=await(await caches.open(name)).match(seed.legacyUrl);if(r&&await r.text()==='legacy-original-download')legacyRetained=true;}
   const foreign=await(await(await caches.open('unrelated-origin-app-cache')).match('/foreign-data')).text();
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('upgrade-personal-sentinel',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result)});
   const indexed=await new Promise((resolve,reject)=>{const r=db.transaction('settings').objectStore('settings').get('account');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();
   return {savedPerProfile:exact,legacyRetained,foreign,localUnchanged:localStorage.getItem('upgrade-personal-sentinel')===seed.personal,indexed,cacheNames:await caches.keys()};
  },{seed,prefix});
  assert.deepEqual(proof.savedPerProfile,[true,true,true]);assert.equal(proof.legacyRetained,true);assert.equal(proof.foreign,'keep-other-app');assert.equal(proof.localUnchanged,true);assert.equal(proof.indexed,'unchanged-user-data');
  // A cache-first worker must not turn the app's deliberate index refresh
  // into another response containing old measurements for imported music.
  const refreshed=await page.evaluate(async prefix=>{
   const url=new URL('/dj-deep-analysis.json?pcm=1&structure=18',location.href).href;
   await(await caches.open(prefix+'-dj-index')).put(url,new Response(JSON.stringify({version:2,entries:{},fixture:'stale-index'}),{headers:{'Content-Type':'application/json'}}));
   window.__djIndexKeyCountBefore=(await(await caches.open(prefix+'-dj-index')).keys()).length;
   const r=await fetch(url,{headers:{'X-MusicBox-DJ-Revalidate':'1'}}),data=await r.json();
   return r.status===200&&!data.fixture&&data.analyzed>0;
  },prefix);
  assert.equal(refreshed,true,'explicit new-recording analysis refresh must return the fresh network metadata');
  await page.waitForFunction(async prefix=>{
   const c=await caches.open(prefix+'-dj-index'),url=new URL('/dj-deep-analysis.json?pcm=1&structure=18',location.href).href,r=await c.match(url);
   if(!r)return false;const data=await r.json();return !data.fixture&&data.analyzed>0;
  },prefix);
  assert.equal(await page.evaluate(async prefix=>(await(await caches.open(prefix+'-dj-index')).keys()).length,prefix),await page.evaluate(()=>__djIndexKeyCountBefore),'fresh analysis replaces the same metadata key without duplicate copies');
  await context.setOffline(true);
  assert.equal(await page.evaluate(async()=>{
   const r=await fetch('/dj-deep-analysis.json?pcm=1&structure=18',{headers:{'X-MusicBox-DJ-Revalidate':'1'}}),d=await r.json();return r.status===200&&!d.fixture&&d.analyzed>0;
  }),true,'the revalidated index remains available through the same loader request while offline');
  const offline=await page.evaluate(async appAsset=>{const r=await fetch('/'+appAsset);return {status:r.status,body:await r.text()};},appAsset);
  assert.equal(offline.status,200);assert.ok(offline.body.includes('const APP_VERSION = "'+release+'";'));
  assert.equal(offline.body,fs.readFileSync(path.join(root,'app.js'),'utf8'),'Offline response must be the actual NEW player, even when the release number is unchanged');
  console.log(JSON.stringify({method:'actual-webkit-service-worker-upgrade-v1',from:previousRevision[0]+'.'+previousRevision.slice(1),to:release,physicalIPhone:false,originalMediaDecoding:false,proof,freshDJIndexRevalidated:refreshed,offlineNewPlayer:true},null,2));
  await context.close();
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
