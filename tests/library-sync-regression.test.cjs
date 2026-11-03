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
 assert.match(loader,/await _applicaStatoCondiviso\(jw.stato\);\s*return;/);
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
