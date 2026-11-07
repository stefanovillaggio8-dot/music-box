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
 assert.ok(loader.includes("await _applicaStatoCondiviso(jw.stato,true);"));
 assert.ok(loader.includes("return;"));
 const segment=loader.slice(loader.indexOf("await _applicaStatoCondiviso(jw.stato,true);"),
   loader.indexOf("} catch (e)",loader.indexOf("await _applicaStatoCondiviso(jw.stato,true);")));
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
  _nascostiDallePlaylist:()=>new Set(),
  LS:{get:()=>({})},_mieiCopiati:()=>new Set(),APP_VERSION:"test"
 };
 const snap=new Function("e",
  "const {tracks,profile,DEFAULT_PROFILE,_soloInPlaylist,_chiaveSoloInPlaylist,LS,_mieiCopiati,APP_VERSION,_nascostiDallePlaylist}=e;"+
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

test("stale local duplicate markers cannot hide unique shared tracks",()=>{
 const code=excerpt("function _unisciDuplicatiLocali(elenco) {","function _duplicatiLocali() {");
 const updates=[];
 const merge=new Function("updates",
  "const profile='Ste',DEFAULT_PROFILE='Ste';"+
  "const _duplicatiLocali=()=>['b-track-7'];"+
  "const writeProfileState=(name,value)=>updates.push({name,value});"+
  "const stessoBrano=(a,b)=>a.title===b.title&&a.artist===b.artist;"+
  "const _haRinomina=()=>false,_spostaRinomina=()=>{};"+
  "const segnalaErrore=()=>{};"+code+"return _unisciDuplicatiLocali;")(updates);
 const all=[
  {id:"b-track-7",title:"Unico",artist:"Artista",builtin:true,profile:"Ste"},
  {id:"b-track-8",title:"Altro",artist:"Artista",builtin:true,profile:"Ste"},
  {id:"b-track-9",title:"Unico",artist:"Artista",builtin:true,profile:"Ste"}];
 assert.deepEqual(merge(all).map(x=>x.id),["b-track-7","b-track-8"]);
 assert.equal(all.length,3,"no source tracks were deleted");
 assert.ok(updates.some(x=>x.name==="Ste"&&
  Array.isArray(x.value.duplicati)&&x.value.duplicati.length===0));
 assert.doesNotMatch(code,/giaNascosti\.has\(t\.id\)/);
});

test("standalone iPhone PWA reloads fresh Gym metadata without purging offline MP3s",()=>{
 const published=JSON.parse(fs.readFileSync(path.join(__dirname,"..","playlist.json"),"utf8"));
 const gym=published.find(p=>String(p.name).toLowerCase()==="gym");
 assert.ok(gym&&gym.nascosta===true&&gym.nascostaDa==="Ste");
 assert.ok(gym.tracks.length>=20,"real Gym-only playlist must stay available");
 assert.match(worker,/\.\/playlist\.json/);
 assert.match(worker,/const sempreFresco = \/versione\\.json\$\|stato\\.json\$\|playlist\\.json\$/);
 const fresh=excerpt("async function _caricaPlaylistCondivise()", "let _gymInvioUltimo");
 assert.match(fresh,/gymCompletaSulWorker/);
 assert.match(fresh,/if\(!_playlistDaSincronizzare\)/);
 assert.match(fresh,/current\.nascosta!==true/);
 assert.match(fresh,/current\.tracks\|\|\[\]\)\.length<gym\[0\]\.tracks\.length/);
 assert.match(fresh,/cache:"no-store"/);
 assert.match(fresh,/_unisciPlaylistCondivise\(gym,false\)/);
 const initial=excerpt("function loadProfileState()", "function saveCurrentState()");
 assert.match(initial,/_soloInPlaylist = _ricalcolaSoloInPlaylist\(\)/);
 assert.doesNotMatch(worker,/caches\.delete\(cacheBraniName\(/);
});
test("Gym tracks remain in the playlist, but not in Ste main library or count",()=>{
 const published=JSON.parse(fs.readFileSync(path.join(__dirname,"..","playlist.json"),"utf8"));
 const gym=published.find(p=>p.name==="gym");
 const getFlags=excerpt("function _nascostiDallePlaylist()", "function _ricalcolaSoloInPlaylist()");
 const read=(profile)=>new Function("playlists","profile",
  getFlags+"return _nascostiDallePlaylist();")([gym],profile);
 assert.deepEqual([...read("Ste")].sort(),[...new Set(gym.tracks)].sort());
 assert.equal(read("Diego").size,0,"Ste's hidden Gym must not remove Diego songs");
 const count=excerpt("const visibleAll = tracks.filter", "function _quantiEliminati()");
 const helper=new Function("env",
  "const {tracks,profile,DEFAULT_PROFILE,_soloInPlaylist,_chiaveSoloInPlaylist,_playlistAttiva,_playlistCercata,list,eGiaCondiviso,_nascostiDallePlaylist}=env;"+
  count+"return {total,mine};");
 const gymSet=new Set(gym.tracks);
 const items=[
  {id:"b-track-1",source:"file",builtin:true},
  ...gym.tracks.map(id=>({id,source:"file",builtin:true}))
 ].filter((t,i,all)=>all.findIndex(x=>x.id===t.id)===i);
 const flags=new Set([...read("Ste")].map(id=>"Ste."+id));
 const env={tracks:items,profile:"Ste",DEFAULT_PROFILE:"Ste",_soloInPlaylist:flags,
  _chiaveSoloInPlaylist:id=>"Ste."+id,
  _playlistAttiva:"",_playlistCercata:()=>gym,list:items,eGiaCondiviso:()=>false,
  _nascostiDallePlaylist:()=>read("Ste")};
 const main=helper(env);
 assert.equal(main.total,1,"Gym-only tracks must not inflate main library");
 const inside=helper({...env,_playlistAttiva:"gym"});
 assert.equal(inside.total,gymSet.size,"Gym tab must count exactly its own members");
});

test("Safari and installed PWA use the same deployed Music Box release",()=>{
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,"..","versione.json"),"utf8")).versione;
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const revision=version.replace(".","");
 assert.match(version,/^\d+\.\d+$/);
 assert.ok(src.includes('const APP_VERSION = "'+version+'"'));
 assert.ok(html.includes('app.js?v='+revision));
 assert.ok(worker.includes('const CACHE = "spotifynonavraiimieisoldi-v'+revision+'"'));
 assert.ok(html.includes('mix-intelligente.js?v='+revision));
});

test("PWA copies absent on cloud are published once without restoring deleted songs",()=>{
 const apply=excerpt("async function _applicaStatoCondiviso(", "function _unisciPlaylistCondivise(");
 assert.match(apply,/if\(fromWorker\)/);
 assert.match(apply,/_branoEliminato\(id,profile\)/);
 assert.match(apply,/mb\.copieSyncTentativo/);
 assert.match(apply,/setTimeout\(\(\)=>_salvaStatoCondiviso\(\),1000\)/);
 assert.match(src,/await _applicaStatoCondiviso\(j,false\)/);
});
