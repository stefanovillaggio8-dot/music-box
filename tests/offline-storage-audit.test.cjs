'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../offline-storage-audit.js'),'utf8');
function api(){const c={Blob,TextEncoder,URL,Map,JSON,Number};vm.createContext(c);vm.runInContext(source,c);return c.MusicBoxStorageAudit;}
test('storage report counts scoped payloads without downloading bodies or claiming unknown sizes',async()=>{
 const a=api(),prefix='spotifynonavraiimieisoldi',names=[prefix+'-brani-Diego',prefix+'-prefetch-Diego','unrelated-app'];let opens=0;
 const url='https://raw.githubusercontent.com/example/song.mp3?secret=never-export';
 const cacheStorage={keys:async()=>names,open:async name=>{opens++;return {keys:async()=>[{url},{url:'https://site/dj-deep-analysis.json'}],match:async r=>({status:200,type:'basic',headers:{get:k=>k==='content-length'&&r.url===url?'5000000':null},blob:()=>{throw Error('No body reads permitted')}})}}};
 const r=await a.inspect({cacheStorage,profile:'Diego',storage:{estimate:async()=>({usage:999999999,quota:1e10})}});
 assert.equal(opens,2);assert.equal(r.caches[0].groups.audio.declaredBytes,5000000);
 assert.equal(r.caches[0].groups.musicalAnalysis.unknownSizeEntries,1);
 assert.equal(r.sameRequestCopies.length,2);assert.equal(r.sameRequestCopies[0].byteIdentityVerified,false);
 assert.equal(r.estimate.originWide,true);assert.equal(r.unattributedCacheCount,1);
 assert.equal(JSON.stringify(r).includes('never-export'),false);
});
test('Blob payload and textual metadata remain separate; hidden-page abort does no mutation',async()=>{
 const a=api(),r=a.payload({blob:new Blob(['hello']),lyrics:'canzone'});assert.equal(r.blobBytes,5);assert.ok(r.metadataUtf8Bytes>5);
 await assert.rejects(a.inspect({signal:{aborted:true},cacheStorage:{keys:async()=>['spotifynonavraiimieisoldi-brani-Diego'],open(){throw Error('Must not open')}}}),/cancelled/);
});
