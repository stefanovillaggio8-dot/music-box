'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const slice=(a,b)=>{const lo=app.indexOf(a),hi=app.indexOf(b,lo);assert.ok(lo>=0&&hi>lo,a);return app.slice(lo,hi);};
const visible=slice('function visibleTracks(perSuono) {',"  /* Se un brano e' stato tolto");
function library(name){
 const tracks=['Ste','Diego','Emanuele'].map(profile=>({id:profile,url:'/'+profile+'.mp3',profile}));
 tracks.push({id:'copied',profile:name==='Ste'?'Emanuele':'Ste',url:'/copy.mp3'},
  {id:'playlist-only',profile:name,url:'/playlist.mp3'},
  {id:'room',profile:name,url:'/room.mp3',source:'stanza-condivisa'});
 return new Function('tracks','name',`
 let profile=name,DEFAULT_PROFILE='Ste',_playlistAttiva='',favOnly=false,soloMaiAscoltati=false,soloScaricate=false,query='',ordinamento='titolo';
 const _soloInPlaylist=new Set(),favorites=new Set([name]),hiddenTracks=new Set();
 const _chiaveSoloInPlaylist=id=>name+'.'+id,_nascostiDallePlaylist=()=>new Set(['playlist-only']),_mieiCopiati=()=>new Set(['copied']);
 const ordinaLista=list=>list,_diChe=()=>{},isCached=t=>t.id==='copied',_ascoltoDi=t=>({s:t.id===name?1:0}),matchScore=(q,t)=>t.id===q?1:-1;
 ${visible}
 return {list:()=>visibleTracks(true),downloaded:()=>{soloScaricate=true},favorite:()=>{favOnly=true},search:q=>{query=q},unheard:()=>{soloMaiAscoltati=true}};
 `)(tracks,name);
}
test('each personal account permits its own recordings and explicit copies, never foreign-only or room recordings',()=>{
 for(const name of ['Ste','Diego','Emanuele'])assert.deepEqual(library(name).list().map(t=>t.id),[name,'copied']);
});
test('download, favorites, search and unheard filters still restrict the personal DJ library',()=>{
 for(const name of ['Ste','Diego','Emanuele']){
  const d=library(name);d.downloaded();assert.deepEqual(d.list().map(t=>t.id),['copied']);
  const f=library(name);f.favorite();assert.deepEqual(f.list().map(t=>t.id),[name]);
  const s=library(name);s.search('copied');assert.deepEqual(s.list().map(t=>t.id),['copied']);
  const u=library(name);u.unheard();assert.deepEqual(u.list().map(t=>t.id),['copied']);
 }
});
test('filter failure and stale indices cannot fall back to the loaded global catalog',()=>{
 const code=slice('  function idBranoA(indice) {','  let _djCatalogoPrecedente');
 const f=new Function('tracks',`
 let fail=false;const visibleTracks=()=>{if(fail)throw Error('filter unavailable');return [tracks[0]]};
 ${code}
 return {id:idBranoA,list:_listaPerIlSeguito,fail:()=>{fail=true}};
 `)([{id:'personal'},{id:'foreign'}]);
 assert.equal(f.id(0),'personal');assert.equal(f.id(1),'');
 f.fail();assert.deepEqual(f.list(),[]);assert.equal(f.id(0),'');
});
function selection(){
 const start=app.indexOf('mixSelectShuffle:({'),end=app.indexOf('  mixHandoff:',start);
 const expression=app.slice(start+'mixSelectShuffle:'.length,end).trim().replace(/,\s*$/,'');
 return new Function('expression',`
 let shuffle=true,repeat=false,_casualeModificaUtente=false,currentId='a',queue=[],_casualeProgrammate=['b','c'],_casualeSceltaDJ='';
 const _casualeFresche=new Set(['b','c','d']);let allowed=['b','c','d'];
 const window={MusicBoxRoom:{isActive:()=>false},MusicBoxBridge:{mixShufflePool:()=>allowed.map(id=>({id}))}};
 const _ordineCasualeModificato=()=>{};const select=eval('('+expression+')');
 return {select,restrict:ids=>{allowed=ids},queue:()=>_casualeProgrammate.slice(),manual:()=>queue.push('explicit'),room:on=>{window.MusicBoxRoom.isActive=()=>on}};
 `)(expression);
}
test('an already-previewed candidate removed by a new account/filter is rejected after async analysis',()=>{
 const s=selection();s.restrict(['b','d']);
 assert.equal(s.select({fromId:'a',initialFirst:'b',pickId:'c'}),false);
 assert.deepEqual(s.queue(),['b','c'],'no mutation of the manual or preview order');
 assert.equal(s.select({fromId:'a',initialFirst:'b',pickId:'d'}),true);
 assert.deepEqual(s.queue(),['d','b','c']);
});
test('manual queues and shared rooms never enter personal automatic promotion',()=>{
 for(const mode of ['manual','room']){
  const s=selection();mode==='manual'?s.manual():s.room(true);
  assert.equal(s.select({fromId:'a',initialFirst:'b',pickId:'c'}),false);
  assert.deepEqual(s.queue(),['b','c']);
 }
});
