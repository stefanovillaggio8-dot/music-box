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
 const end=src.indexOf("syncLibrary:()=>_sincronizzaCatalogoDispositivi(true)",start);
 assert.ok(start>0&&end>start);
 const expression=src.slice(start,end).trim().replace(/,\s*$/,"");
 const items=Array.from({length:233},(_,i)=>({id:"b-track-"+i,title:"Track "+i,artist:"Test",builtin:true}));
 const environment={
  tracks:items,profile:"Ste",DEFAULT_PROFILE:"Ste",
  _soloInPlaylist:new Set(["Ste.b-track-1","Ste.b-track-2","Ste.b-track-3","Ste.b-track-4"]),
  _chiaveSoloInPlaylist:id=>"Ste."+id,
  _nascostiDallePlaylist:()=>new Set(),
  _playlistCercata:()=>null,_playlistAttiva:"",
  location:{origin:"https://example.test"},window:{matchMedia:()=>({matches:true})},
  LS:{get:()=>({})},_mieiCopiati:()=>new Set(),APP_VERSION:"test",
  SERVIZIO_PUBBLICA:"",_mbUltimaLetturaWorker:{source:"test",deleted:0,restored:[],copied:0}
 };
 const snap=new Function("e",
  "const {tracks,profile,DEFAULT_PROFILE,_soloInPlaylist,_chiaveSoloInPlaylist,LS,_mieiCopiati,APP_VERSION,_nascostiDallePlaylist,_playlistCercata,_playlistAttiva,location,window,SERVIZIO_PUBBLICA,_mbUltimaLetturaWorker}=e;"+
  "return ({"+expression+"}).librarySnapshot;")(environment);
 const result=snap();
 assert.equal(result.totalLoaded,233);
 assert.equal(result.standalone,true);
 assert.equal(result.gymPlaylistCount,0);
 assert.deepEqual(result.gymUnexpectedInLibrary,[]);
 assert.equal(result.visibleCount,229);
 assert.deepEqual(result.playlistOnlyIds,["b-track-1","b-track-2","b-track-3","b-track-4"]);
 assert.equal(result.tracks.length,229);
 assert.equal(items.length,233,"diagnostics never delete loaded songs");
});
test("manual sync bypasses stale metadata cooldown, reports ID differences and preserves MP3s",()=>{
 const i=src.indexOf("function _sincronizzaCatalogoDispositivi(force=false){");
 const j=src.indexOf("/* Mette dentro quello che arriva dal Worker",i);
 assert.ok(i>=0&&j>i);
 const body=src.slice(i,j);
 assert.ok(src.includes("syncLibrary:()=>_sincronizzaCatalogoDispositivi(true)"));
 assert.ok(body.includes("await _caricaStatoCondiviso()"));
 assert.ok(body.includes("await _caricaPlaylistCondivise()"));
 assert.ok(body.includes("await loadAll(force)"));
 assert.ok(body.includes("await _recuperaCopiePubblicate(force)"));
 assert.ok(body.includes("addedIds,removedIds"));
 assert.ok(body.includes("updatedIds"));
 assert.match(src,/if \(!force && Date\.now\(\) - _ytOnlineFetchedAt < 45000\)/);
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
 assert.deepEqual(merge(all).map(x=>x.id),["b-track-7","b-track-8","b-track-9"],
  "two different published IDs are not duplicates solely by display title");
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


test("manual catalog synchronization re-requests fresh cloud audio and cloud copies",()=>{
 const load=excerpt("async function loadAll(forceRemote=false)", "/* L'indice pubblicato contiene solo gli ID LRCLIB");
 assert.match(load,/const ownLinks=await _ytBraniDalCloud\(_nomeYT,forceRemote\)/);
 assert.match(load,/await _ytCopieDaAltriProfili\(_nomeYT,forceRemote\)/);
 const copy=excerpt("async function _ytCopieDaAltriProfili(owner,force=false)", "function _ytFondiBozze");
 assert.match(copy,/await _ytBraniDalCloud\(name,force\)/);
 assert.match(src,/if\(!force&&cached&&cached\.time>0&&Date\.now\(\)-cached\.time<25000\)/);
 const sync=excerpt("function _sincronizzaCatalogoDispositivi(force=false)", "/* Mette dentro quello che arriva dal Worker");
 assert.match(sync,/await loadAll\(force\)/);
 assert.doesNotMatch(sync,/dbDelete|caches\.delete/);
});

test("cloud library diagnostics report whether remote data was actually refreshed",()=>{
 const snapshot=excerpt("librarySnapshot:()=>{","syncLibrary:()=>");
 assert.match(snapshot,/cloudFetchOk:cloudFetch\?cloudFetch\.ok===true:null/);
 assert.match(snapshot,/publishedCatalogCount:visible\.filter/);
 assert.match(snapshot,/cloudAudioCount:visible\.filter/);
 assert.match(snapshot,/cloudPendingCount:visible\.filter/);
 const sync=excerpt("function _sincronizzaCatalogoDispositivi(force=false)","/* Mette dentro quello che arriva dal Worker");
 assert.match(sync,/if\(force&&_ytCloudFetchState\[profile\]\?\.ok===false/);
 assert.match(sync,/await _ytBraniDalCloud\(owner,true\)/);
 assert.doesNotMatch(sync,/caches\.delete|indexedDB\.deleteDatabase/);
 const dj=require("node:fs").readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 assert.match(dj,/Cloud aggiornato/);
 assert.match(dj,/cloud non verificato/);
});

test("cross-device source counts distinguish published catalog from playable and pending cloud entries",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(src,/publishedCatalogCount:visible\.filter/);
 assert.match(src,/cloudAudioCount:visible\.filter\(t=>t\.source==="cloud-audio"\)/);
 assert.match(src,/cloudPendingCount:visible\.filter\(t=>t\.source==="youtube-link"\)/);
 assert.match(src,/MP3 cloud/);
 assert.match(src,/link cloud \(non pronti\)/);
 assert.match(html,/id="mbCatalogOrigin"/);
});

test("cloud network errors keep the last complete playlist and permit immediate retry",async()=>{
 const cloud=excerpt("async function _ytBraniDalCloud(owner,force=false)",
  "function _ytAggiornaVociLibreria(entries, owner, draw=false)");
 const saved=new Map(),requests=[];
 const links=[{video_id:"75qIYkMUGVE",status:"completed"},
  {video_id:"Osxwh-qQLu4",status:"completed"}];
 const mockFetch=async(url)=>{
  requests.push(url);
  if(requests.length===2)throw Error("Offline / HTTP 403");
  return {ok:true,json:async()=>({ok:true,links:requests.length===1?links:links.slice(0,1)})};
 };
 const code="const DEFAULT_PROFILE='Ste';"+
  "const LS=env.LS,fetch=env.fetch;"+
  "const _ytLinksMemory=Object.create(null);"+
  "const _ytCloudFetchState=Object.create(null);"+
  "const _ytLinksInFlight=Object.create(null);"+
  "const _ytFondiBozze=rows=>rows;"+
  cloud+"return {read:_ytBraniDalCloud,status:_ytCloudFetchState,cached:_ytLinksMemory};";
 const api=new Function("env",code)({LS:{
  get:(k,def)=>saved.has(k)?saved.get(k):def,
  set:(k,v)=>saved.set(k,v)},fetch:mockFetch});
 const first=await api.read("Ste",true);
 assert.equal(first.length,2);
 const unavailable=await api.read("Ste",true);
 assert.equal(unavailable.length,2,"403 must retain the last successful cloud list");
 assert.equal(api.status.Ste.ok,false);
 assert.equal(api.cached.Ste.time,0,"failed refresh must not block another retry");
 const updated=await api.read("Ste",false);
 assert.equal(updated.length,1,"a successful shorter response is authoritative");
 assert.equal(api.status.Ste.ok,true);
 assert.equal(requests.length,3);
});
test("a failed cloud response cannot erase already loaded playable YouTube music",()=>{
 const update=excerpt("function _ytAggiornaVociLibreria(entries, owner, draw=false)",
  "async function loadAll(forceRemote=false)");
 const cloud={id:"yt-75qIYkMUGVE",source:"cloud-audio",profile:"Ste",
  file:"cloud/youtube-75qIYkMUGVE.mp3",url:"https://example.test/audio"};
 const main={id:"b-track-10",file:"songs/track-10.mp3",source:"published",profile:"Ste"};
 const state={Ste:{ok:false}};
 const env={tracks:[main,cloud],state,deleted:new Set()};
 const make=new Function("e",
  "let tracks=e.tracks;const profile='Ste',_ytCloudFetchState=e.state;"+
  "const _ytForeignCopiesByOwner=Object.create(null);"+
  "const _branoEliminato=(id)=>e.deleted.has(id);"+
  "const _dataAggiuntaBrano=()=>0,PALETTE=['#000'],BUILTIN=[];"+
  "const applicaRinomine=()=>{},render=()=>{},"+
  "_controllaNuoviBraniMix=()=>{},_programmaTestiKaraoke=()=>{};"+
  update+"return {run:_ytAggiornaVociLibreria,list:()=>tracks};")(env);
 make.run([],"Ste",false);
 assert.deepEqual(make.list().map(x=>x.id).sort(),["b-track-10","yt-75qIYkMUGVE"]);
 state.Ste={ok:true};
 make.run([],"Ste",false);
 assert.deepEqual(make.list().map(x=>x.id),["b-track-10"],
  "a successful authoritative response can remove an outdated cloud link");
});


test("published catalog reparse retains all songs and Spotify/cover metadata",()=>{
 const start=src.indexOf("  const BUILTIN_RE = ");
 const end=src.indexOf('let _firmaLibreria = "";',start);
 assert.ok(start>0&&end>start,"catalog parser exists");
 const parse=new Function("DEFAULT_PROFILE",src.slice(start,end)+"return parseBuiltinFrom;")("Ste");
 const parsed=parse(src);
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,"..","versione.json"),"utf8"));
 assert.equal(parsed.length,version.brani,"catalog reparse must preserve every published row");
 for(const id of [205,224,515])
  assert.ok(parsed.some(t=>t.file==="songs/track-"+id+".mp3"&&t.profile==="Ste"),
   "published track "+id+" must not disappear");
 assert.ok(parsed.some(t=>t.profile==="Emanuele"&&t.spotifyId),
  "Spotify metadata cannot be lost during refresh");
 assert.ok(parsed.some(t=>t.cover),"cover metadata cannot be lost");
 const updater=src.slice(src.indexOf("async function checkForNewSongs()"),
   src.indexOf("  async function openOffline()",src.indexOf("async function checkForNewSongs()")));
 assert.match(updater,/parsed\.length<BUILTIN\.length/);
 assert.match(updater,/BUILTIN\.push\(\{\.\.\.b\}\)/);
});

test("catalog retains distinct published song IDs even with identical renamed titles",()=>{
 const reducer=excerpt("function _unisciDuplicatiLocali(elenco)","function _duplicatiLocali()");
 const merge=new Function("profile",
   "const DEFAULT_PROFILE='Ste';"+
   "const _duplicatiLocali=()=>[],writeProfileState=()=>{},segnalaErrore=()=>{};"+
   "const stessoBrano=(a,b)=>a.title===b.title&&a.artist===b.artist;"+
   "const _haRinomina=()=>false;"+
   reducer+"return _unisciDuplicatiLocali;")("Ste");
 const rows=[
  {id:"b-track-28",title:"Amelie",artist:"Kid Yugi",profile:"Ste",builtin:true},
  {id:"b-track-205",title:"Amelie",artist:"Kid Yugi",profile:"Ste",builtin:true},
  {id:"b-track-224",title:"Terri",artist:"Kid Yugi",profile:"Ste",builtin:true},
  {id:"b-track-515",title:"A Te",artist:"Jovanotti",profile:"Ste",builtin:true},
  {id:"u-first",title:"Local",artist:"Artist",profile:"Ste",builtin:false},
  {id:"u-copy",title:"Local",artist:"Artist",profile:"Ste",builtin:false}
 ];
 assert.deepEqual(merge(rows).map(t=>t.id),
 ["b-track-28","b-track-205","b-track-224","b-track-515","u-first"]);
});
