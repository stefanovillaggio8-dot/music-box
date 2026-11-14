/* Read-only, on-demand inventory. No downloads, deletions, database opens
   or audio decoding. Payload sizes are not physical Safari disk usage. */
(function(root){
'use strict';
const prefix='spotifynonavraiimieisoldi';
const category=url=>{
 let path='';try{path=new URL(url).pathname}catch(_){}
 if(/\.mp3$/i.test(path))return 'audio';
 if(/dj-.*\.json$/i.test(path))return 'musicalAnalysis';
 if(/\.(onnx|bin)$/i.test(path))return 'models';
 if(/\.(png|jpe?g|webp|avif|svg)$/i.test(path))return 'coversAndImages';
 if(/lyric|karaoke/i.test(path))return 'lyrics';
 return 'shellAndMetadata';
};
function payload(value){
 let blobs=0;
 const text=JSON.stringify(value,(_,v)=>{
  if(typeof Blob!=='undefined'&&v instanceof Blob){blobs+=v.size;return '[Blob payload counted separately]';}
  return v;
 });
 return {blobBytes:blobs,metadataUtf8Bytes:new TextEncoder().encode(text||'').length};
}
async function inspect({db,cacheStorage=root.caches,storage=root.navigator?.storage,signal,profile}={}){
 const cancelled=()=>{if(signal?.aborted)throw Error('Storage inventory cancelled');};
 const report={version:1,profile:String(profile||''),origin:root.location?.origin||'',readOnly:true,
  scope:'Music Box-prefixed CacheStorage and supplied musicbox database; shared HTTP cache and other sites are not attributable.',
  sizes:'Cache declared Content-Length and IndexedDB Blob sizes/UTF-8 metadata; NOT exact physical disk usage.',
  estimate:null,caches:[],databases:[],sameRequestCopies:[],unattributedCacheCount:0};
 try{const e=await storage?.estimate?.();if(e)report.estimate={usage:e.usage,quota:e.quota,originWide:true,approximate:true};}catch(_){}
 const requests=new Map();
 for(const name of cacheStorage?await cacheStorage.keys():[]){
  cancelled();if(!name.startsWith(prefix)){report.unattributedCacheCount++;continue;}
  const cache=await cacheStorage.open(name),groups={};
  for(const request of await cache.keys()){
   cancelled();const response=await cache.match(request),kind=category(request.url);
   const group=groups[kind]??={entries:0,declaredBytes:0,unknownSizeEntries:0};group.entries++;
   const raw=response?.headers.get('content-length'),n=raw!=null&&raw.trim()!==''?Number(raw):NaN;
   if(response?.type!=='opaque'&&Number.isSafeInteger(n)&&n>=0)group.declaredBytes+=n;else group.unknownSizeEntries++;
   // Exact request URL only; identical URLs do not prove identical bytes.
   // URLs, lyrics and credentials never appear in the exported report.
   const prior=requests.get(request.url)||[];prior.push(name);requests.set(request.url,prior);
  }
  report.caches.push({name,groups});
 }
 for(const copies of requests.values())if(copies.length>1)report.sameRequestCopies.push({caches:copies,byteIdentityVerified:false});
 if(db)for(const name of Array.from(db.objectStoreNames)){
  cancelled();const summary={name,records:0,blobBytes:0,metadataUtf8Bytes:0};
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(name,'readonly'),request=tx.objectStore(name).openCursor();
   request.onsuccess=()=>{try{
    cancelled();const cursor=request.result;if(!cursor)return;
    const p=payload(cursor.value);summary.records++;summary.blobBytes+=p.blobBytes;summary.metadataUtf8Bytes+=p.metadataUtf8Bytes;cursor.continue();
   }catch(error){reject(error);}};
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Read-only database scan failed'));tx.onabort=()=>reject(Error('Read-only database scan aborted'));
  });report.databases.push(summary);
 }
 cancelled();return report;
}
root.MusicBoxStorageAudit={inspect,payload,category};
})(typeof window!=='undefined'?window:globalThis);
