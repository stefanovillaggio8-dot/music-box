'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
const start=sw.indexOf('  if (/\\/dj-deep-analysis\\.json$/i.test(url.pathname)) {'),end=sw.indexOf('  const isCore =',start);
assert(start>=0&&end>start);
const handler=new Function('event','url','caches','fetch','Request','Response','CACHE_DJ_INDEX','cacheInfoName','self',sw.slice(start,end));
async function run(network,exact=true){
 const base='https://example.test/dj-deep-analysis.json',url=base+'?pcm=1&structure=18';
 const values=new Map([[base,new Response(JSON.stringify({revision:'old-unqueried'}))]]);
 if(exact)values.set(url,new Response(JSON.stringify({revision:'exact-fresh'})));
 const writes=[];const cache={match:async(req,opt)=>{const key=req.url||String(req);return (opt?.ignoreSearch?[...values].find(([k])=>k.split('?')[0]===key.split('?')[0])?.[1]:values.get(key))?.clone()},
  put:async(req,res)=>{writes.push(req.url||String(req));values.set(req.url||String(req),res.clone())}};
 let response;const waits=[];const event={request:new Request(url,{headers:{'X-MusicBox-DJ-Revalidate':'1'}}),respondWith:r=>response=r,waitUntil:r=>waits.push(r)};
 handler(event,new URL(url),{open:async()=>cache},network,Request,Response,'test-dj-index',()=> 'info',{registration:{scope:'https://example.test/'}});
 const result=await response;await Promise.all(waits);return {result,writes,values,url};
}
test('offline explicit revalidation prefers the exact saved index over an older query variant',async()=>{
 const {result,writes}=await run(async()=>{throw Error('offline')});assert.equal(result.status,200);assert.equal((await result.json()).revision,'exact-fresh');assert.deepEqual(writes,[]);
});
test('a temporary HTTP failure cannot hide an existing exact analysis index',async()=>{
 const {result,writes}=await run(async()=>new Response('',{status:503}));assert.equal(result.status,200);assert.equal((await result.json()).revision,'exact-fresh');assert.deepEqual(writes,[]);
});
test('successful refresh replaces the same key while preserving other cached variants',async()=>{
 const {result,writes,values,url}=await run(async()=>new Response(JSON.stringify({revision:'new-network'})));
 assert.equal((await result.json()).revision,'new-network');assert.deepEqual(writes,[url]);assert.equal(values.size,2);
 assert.equal((await values.get(url).json()).revision,'new-network');
});
