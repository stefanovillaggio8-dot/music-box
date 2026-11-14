'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
function fixture(saved={}){
 const start=source.indexOf('  async function _precaricaInCache('),end=source.indexOf('  function _preparaIlSuccessivo(',start);
 let downloads=0;const caches={open:async name=>{await Promise.resolve();return {match:async url=>saved[name]?.[url]}}};
 const prepare=new Function('caches','fetchToCache',`const window={caches},profile='Diego',CACHE_PREFIX='spotifynonavraiimieisoldi';
 let _precaricaInCorso=false;const _urlDelBrano=t=>t.url,cacheBraniName=p=>CACHE_PREFIX+'-brani-'+p,cacheStreamName=p=>CACHE_PREFIX+'-stream-'+p;
 ${source.slice(start,end)};return _precaricaInCache;`)(caches,async()=>{downloads++;await Promise.resolve();});
 return {prepare,count:()=>downloads};
}
const url='https://example.test/songs/track-1.mp3',complete=()=>new Response(new Uint8Array(4096),{status:200,headers:{'Content-Length':'4096','Content-Type':'audio/mpeg'}});
test('prefetch reuses a complete exact-URL saved, streaming or prepared MP3 without new writes',async()=>{
 for(const type of ['brani','stream','prefetch']){
  const f=fixture({['spotifynonavraiimieisoldi-'+type+'-Diego']:{[url]:complete()}});await f.prepare({url});assert.equal(f.count(),0);
 }
});
test('concurrent preparations cannot pass the lock while CacheStorage is opening',async()=>{
 const f=fixture();await Promise.all(Array.from({length:5},()=>f.prepare({url})));assert.equal(f.count(),1);
});
test('prefetch never substitutes another profile, a bass variant, or a partial response',async()=>{
 for(const saved of [
  {'spotifynonavraiimieisoldi-brani-Ste':{[url]:complete()}},
  {'spotifynonavraiimieisoldi-brani-Diego':{[url.replace('/songs/','/songs/bassi/')]:complete()}},
  {'spotifynonavraiimieisoldi-brani-Diego':{[url]:new Response('partial',{status:206})}}
 ]){const f=fixture(saved);await f.prepare({url});assert.equal(f.count(),1);}
});
