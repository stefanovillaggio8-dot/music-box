"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const worker=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
const excerpt=(from,to)=>{
 const i=src.indexOf(from),j=src.indexOf(to,i);
 assert.ok(i>=0&&j>i,"Missing "+from);
 return src.slice(i,j);
};
test("removing only from library does not send contradictory playlist markers",()=>{
 const body=excerpt("async function _eliminaBrano(", "/* Migrazione di sicurezza");
 const choose=body.slice(body.indexOf("if (!ancheDallePlaylist && nellePlaylist.length)"),
  body.indexOf("/* Segno che e' eliminato per sempre"));
 assert.match(choose,/_mettiSoloInPlaylist\(id\)/);
 assert.doesNotMatch(choose,/_soloInPlaylistRimossaSegna\(id\)/);
 assert.doesNotMatch(choose,/_soloInPlaylistSegna\(id, true\)/);
 assert.match(choose,/_salvaStatoCondiviso\(\)/);
});
test("worker state is authoritative even when its data is unchanged",()=>{
 const loader=excerpt("async function _caricaStatoCondiviso(", "async function _applicaStatoCondiviso(");
 assert.ok(loader.includes("await _applicaStatoCondiviso(jw.stato);"));
 assert.ok(loader.includes("return;"));
 const segment=loader.slice(loader.indexOf("await _applicaStatoCondiviso(jw.stato);"),
   loader.indexOf("} catch (e)",loader.indexOf("await _applicaStatoCondiviso(jw.stato);")));
 assert.ok(segment.includes("return;"),"skip stale fallback on an unchanged Worker response");
 assert.doesNotMatch(loader,/if \(await _applicaStatoCondiviso\(jw.stato\)\) return/);
});
test("pending phone-only playlist choices survive a stale cloud response",()=>{
 const apply=excerpt("async function _applicaStatoCondiviso(", "function _unisciPlaylistCondivise(");
 assert.match(apply,/aggiuntePendenti/);
 assert.match(apply,/rimozioniPendenti/);
 assert.match(apply,/_nascostiDallePlaylist\(\)/);
 assert.match(src,/confirmedAdds=new Set\(sent.soloInPlaylist\|\|\[\]\)/);
 assert.match(src,/confirmedRemoves=new Set\(sent.soloInPlaylistRimossi\|\|\[\]\)/);
});
test("fresh Worker playlists may shrink after deletion, static JSON cannot resurrect them",()=>{
 const merge=excerpt("function _unisciPlaylistCondivise(", "async function _caricaPlaylistCondivise(");
 const fetch=excerpt("async function _caricaPlaylistCondivise(", "let _gymInvioUltimo");
 assert.match(merge,/if\(daWorker&&!_playlistDaSincronizzare\)/);
 assert.match(merge,/gia\.tracks=newIds/);
 assert.match(fetch,/if\(workerValido\)/);
 assert.match(fetch,/return;\s*\}\s*\/\* ATTENZIONE/);
 assert.match(src,/mb\.playlistDaSincronizzare/);
});
test("mobile phone library pages stay bounded, and all tracks remain searchable",()=>{
 const code=excerpt("function _pagineLibreria(", "// Avoid replacing hundreds");
 const make=new Function(
  "let _mobileRowsContext='',_mobileRowsLimit=84;"+
  code+"return _pagineLibreria"
 )();
 const list=Array.from({length:1450},(_,i)=>({id:"track-"+i}));
 assert.equal(make(list,"Ste|library",true).rows.length,84);
 assert.equal(make(list,"Ste|library",true).more,true);
 assert.equal(make(list,"Diego|playlist",true).rows.length,84);
 assert.equal(make(list,"Diego|playlist",false).rows.length,1450);
 assert.match(src,/displayed\.forEach\(\(t\) =>/);
 assert.match(src,/new IntersectionObserver\(/);
 assert.match(src,/Carica altri brani/);
 assert.match(src,/list\.length-displayed\.length/);
 assert.doesNotMatch(worker,/caches\.delete\(cacheBraniName\(\)\)/);
});

test("worker playlist snapshots may shrink the gym without losing custom IDs",()=>{
 const code=excerpt("function _unisciPlaylistCondivise(",
  "async function _caricaPlaylistCondivise(");
 const make=(pending=false)=>{
  let playlists=[{name:"gym",id:"pl-gym",nascosta:true,nascostaDa:"Ste",
   tracks:["b-track-1","yt-abc123","b-track-2"]}],changes=0;
  const fn=new Function("env",
   "let playlists=env.playlists,profile='Ste';"+
   "const _playlistDaSincronizzare=env.pending;"+
   "const _playlistCercata=n=>playlists.find(p=>p.name===n);"+
   "let _soloInPlaylist=new Set();"+
   "const _ricalcolaSoloInPlaylist=()=>new Set();"+
   "const saveCurrentState=()=>{env.changes++};"+
   "const _disegnaLinguettePlaylist=()=>{},render=()=>{},"+
   "_aggiornaBadgePlaylist=()=>{};"+
   code+"return _unisciPlaylistCondivise;")({playlists,pending,changes});
  return {fn,playlists};
 };
 const fresh=make(false);
 fresh.fn([{name:"gym",id:"pl-gym",nascosta:true,nascostaDa:"Ste",
  tracks:["yt-abc123","b-track-2"]}],true);
 assert.deepEqual(fresh.playlists[0].tracks,["yt-abc123","b-track-2"],
  "a deleted song must not come back from the longer local playlist");
 const dirty=make(true);
 dirty.fn([{name:"gym",id:"pl-gym",nascosta:true,
  tracks:["b-track-2"]}],true);
 assert.deepEqual(dirty.playlists[0].tracks,
  ["b-track-1","yt-abc123","b-track-2"],
  "unsynced local changes must not be discarded by the remote GET");
});
test("local-only playlist changes persist across refresh without extra cloud writes",()=>{
 assert.match(src,/if \(payload === _playlistInvioUltimo\) \{\s*_playlistDaSincronizzare=false/);
 assert.match(src,/LS\.set\("mb\.playlistDaSincronizzare",false\)/);
 assert.match(src,/pl\.nascostaDa&&pl\.nascostaDa!==profile/);
 assert.match(src,/const libraryAll=visibleAll\.filter/);
 assert.match(src,/if\(_mobileRowsObserver\)\{_mobileRowsObserver\.disconnect/);
});

test("read-only library diagnostics detect playlist-only count differences",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const mix=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 assert.ok(html.includes('id="mixSyncLibrary"'));
 assert.ok(html.includes('id="mixCopyLibrary"'));
 assert.ok(mix.includes('$("mixCopyLibrary")?.addEventListener("click"'));
 assert.ok(mix.includes('await navigator.clipboard.writeText(report)'));
 const start=src.indexOf("librarySnapshot:()=>{");
 const end=src.indexOf("syncLibrary:async()=>{",start);
 assert.ok(start>0&&end>start);
 const expression=src.slice(start,end).trim().replace(/,\s*$/,"");
 const items=Array.from({length:233},(_,i)=>({id:"b-track-"+i,title:"Track "+i,artist:"Test",builtin:true}));
 const environment={
  tracks:items,profile:"Ste",DEFAULT_PROFILE:"Ste",
  _soloInPlaylist:new Set(["Ste.b-track-1","Ste.b-track-2","Ste.b-track-3","Ste.b-track-4"]),
  _chiaveSoloInPlaylist:id=>"Ste."+id,
  LS:{get:()=>({})},_mieiCopiati:()=>new Set(),APP_VERSION:"test"
 };
 const snap=new Function("e",
  "const {tracks,profile,DEFAULT_PROFILE,_soloInPlaylist,_chiaveSoloInPlaylist,LS,_mieiCopiati,APP_VERSION}=e;"+
  "return ({"+expression+"}).librarySnapshot;")(environment);
 const result=snap();
 assert.equal(result.totalLoaded,233);
 assert.equal(result.visibleCount,229);
 assert.deepEqual(result.playlistOnlyIds,["b-track-1","b-track-2","b-track-3","b-track-4"]);
 assert.equal(result.tracks.length,229);
 assert.equal(items.length,233,"diagnostics never delete loaded songs");
});
test("manual sync refreshes cloud and local view without erasing offline files",()=>{
 const i=src.indexOf("syncLibrary:async()=>{");
 const j=src.indexOf("profile:()=>profile,",i);
 const body=src.slice(i,j);
 assert.ok(body.includes("await _caricaStatoCondiviso()"));
 assert.ok(body.includes("await _caricaPlaylistCondivise()"));
 assert.ok(body.includes("await loadAll()"));
 assert.doesNotMatch(body,/dbDelete|caches\.delete|\.splice\(/);
});
