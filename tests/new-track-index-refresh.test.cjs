'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
const lo=source.indexOf('function unresolvedDeepTracks('),hi=source.indexOf('// Existing timed lyrics',lo);
const snippet=source.slice(lo,hi);
const safe={needed:true,running:false,enabled:true,hidden:false,offline:false,transferring:false,mixing:false,seeking:false,
 now:2000000,retryAfter:0,attemptAt:0,paused:false,readyState:4,bufferedAhead:12,remaining:150};
const allowed=new Function(snippet+'return deepRefreshAllowed')();
test('unseen original-PCM descriptors enter both directions of the generic candidate planner without a pair table',()=>{
 const tool=fs.readFileSync(path.join(__dirname,'../tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(__dirname,'../tools'));
 const notes=[.23,.01,.01,.01,.21,.01,.01,.23,.01,.01,.01,.25];
 const part=(start,end)=>({start,end,step:.02,
  onset:Array.from({length:Math.ceil((end-start)/.02)},(_,i)=>.05+Math.exp(-Math.pow(((i*.02+.25)%.5-.25)/.035,2))),
  beats:Array.from({length:Math.floor((end-start)/.5)},(_,i)=>start+i*.5),
  harmony:Array.from({length:Math.floor((end-start)/.5)-1},(_,i)=>({t:start+.5+i*.5,notes}))});
 const track=sha=>({sha,duration:100.1,last:100,bpm:120,chroma:notes,lastLyricAt:75,firstLyricAt:20,
  first:0,safeIntroAt:0,introDrive:.8,pcmTransition:{version:1,sha,method:'original-pcm-onset-chroma-20ms',intro:part(0,20),outro:part(80,100.1)}});
 const old=track('existing-unseen-fixture'),fresh=track('imported-unseen-fixture');
 for(const [a,b] of [[old,fresh],[fresh,old]]){
  const cue=engine.measuredFullBeatBridge(a,b,a.duration);
  assert.ok(cue);assert.equal(cue.entry,0);assert.ok(cue.measuredBeatCount>=8);
  assert.equal(a.structuralBeatPlans,undefined,'not a preloaded certified edge');
 }
 // This proves candidate discovery only. Synthetic PCM is not a real-MP3
 // render certificate and does not add either pair to the published counts.
});
test('metadata revalidation defers to native playback, offline downloads, background and backoff',()=>{
 assert.equal(allowed(safe),true);
 for(const key of ['running','hidden','offline','transferring','mixing','seeking'])assert.equal(allowed({...safe,[key]:true}),false,key);
 for(const state of [{enabled:false},{needed:false},{bufferedAhead:3},{remaining:40},{readyState:2},
  {retryAfter:3000000},{attemptAt:1900000}])assert.equal(allowed({...safe,...state}),false,JSON.stringify(state));
 assert.equal(allowed({...safe,paused:true,readyState:0,bufferedAhead:0,remaining:0}),true);
});
test('new-track metadata is fetched once, retained while pending, then closes when resolved',async()=>{
 let track={id:'future-recording',file:'songs/future.mp3'},resolved=false,resolveOnFetch=false,calls=0;
 const app={allTracks:()=>[track],offlineBusy:()=>false};
 const fixture=new Function('document','navigator','loadDeepIndex','deepLookup',`
 let deepRefreshNeeded=true,deepRefreshAttemptAt=0,deepRefreshRunning=false,enabled=true,
 offlineTransferPriority=false,mixing=false,active=null,mobileActive=null,seekRecoveryUntil=0,deepRetryAfter=0;
 const recentLibraryIds=['future-recording'];let pendingDeepTrackIds=new Set(recentLibraryIds);
 ${snippet}
 return {run:()=>refreshNewTrackIndex(arguments[4],null),state:()=>({deepRefreshNeeded,deepRefreshRunning}),
 resetClock:()=>{deepRefreshAttemptAt=0}};`);
 const api=fixture({hidden:false},{onLine:true},async force=>{assert.equal(force,true);calls++;if(resolveOnFetch)resolved=true},()=>resolved?{sha:'original'}:null,app);
 api.run();api.run();await new Promise(r=>setImmediate(r));
 assert.equal(calls,1);assert.equal(api.state().deepRefreshNeeded,true);
 api.run();await new Promise(r=>setImmediate(r));assert.equal(calls,1);
 resolveOnFetch=true;api.resetClock();api.run();await new Promise(r=>setImmediate(r));
 assert.equal(calls,2);assert.equal(api.state().deepRefreshNeeded,false);
});
test('large imports retain every pending public recording, beyond the 32-item shuffle priority sample',()=>{
 const tracks=Array.from({length:80},(_,i)=>({id:'new-'+i,file:'songs/new-'+i+'.mp3'}));
 tracks.push({id:'local-only',url:'blob:private-file'});
 const pending=new Function('deepLookup',`let pendingDeepTrackIds=new Set(${JSON.stringify([...tracks.map(t=>t.id),'deleted'])});${snippet}return unresolvedDeepTracks;`)(()=>null);
 const result=pending({allTracks:()=>tracks});assert.equal(result.size,80);
 assert.equal(result.has('new-79'),true);assert.equal(result.has('local-only'),false);assert.equal(result.has('deleted'),false);
});
test('a local recording that becomes a public MP3 triggers analysis refresh without a new track ID; rotating blobs do not',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
 const begin=app.indexOf('  let _djCatalogoPrecedente=new Map();'),end=app.indexOf("  /* Canzoni gia' suonate",begin);
 assert.ok(begin>0&&end>begin);
 const fixture=new Function(`let list=[],profile='Ste',_posizionePlaylist=-1,_playlistSuona=[],shuffle=false,currentId='';
 const _listaPerIlSeguito=()=>list,events=[],window={MusicBoxMix:{onLibraryChange:event=>events.push(event)}};
 ${app.slice(begin,end)}
 return {set:tracks=>{list=tracks;_controllaNuoviBraniMix()},events};`)();
 fixture.set([{id:'import',url:'blob:first'}]);assert.deepEqual(fixture.events[0].addedIds,['import']);
 fixture.set([{id:'import',url:'blob:rotated'}]);assert.equal(fixture.events.length,1);
 fixture.set([{id:'import',url:'songs/import-ready.mp3',file:'songs/import-ready.mp3'}]);
 assert.deepEqual(fixture.events[1].changedIds,['import']);assert.deepEqual(fixture.events[1].addedIds,[]);
});
