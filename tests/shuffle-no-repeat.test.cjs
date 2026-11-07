"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const a=app.indexOf("let _casualeFresche = null;"),b=app.indexOf("  function nextIndex() {",a);
assert.ok(a>=0&&b>a);
function make(storage=new Map(),profile="Ste"){
 return new Function("store","name",
  'const LS={get:(k,d)=>store.has(k)?JSON.parse(store.get(k)):d,set:(k,v)=>store.set(k,JSON.stringify(v))};'+
  'let profile=name,_playlistAttiva="",_posizionePlaylist=-1,_playlistSuona=[],'+
  'favOnly=false,soloMaiAscoltati=false,soloScaricate=false,query="",shuffle=true,currentId="a";'+
  'const tracks=["a","b","c","d"].map(id=>({id,url:"x"}));'+
  'const window={MusicBoxRoom:{isActive:()=>false}},renderQueueCount=()=>{},'+
  '_listaPerIlSeguito=()=>tracks,_braniPlaylistInRiproduzione=()=>tracks;'+
  app.slice(a,b)+
  'return {peek:()=>_listaProssimiCasuali(tracks),next:()=>{const i=_prossimaCasuale(tracks);return i>=0?tracks[i].id:null},'+
  'play:id=>{currentId=id;if(_casualeProgrammate[0]===id)_casualeProgrammate.shift();else _casualeProgrammate=[];_casualeSegnaAscoltata(id)},'+
  'reset:_azzeraCasuale,context:c=>{_playlistAttiva=c;_azzeraCasuale()}}'
 )(storage,profile);
}
test("every song appears exactly once before a new shuffle cycle",()=>{
 const s=make(),seen=new Set(["a"]);
 for(let remaining=3;remaining>0;remaining--){
  const upcoming=s.peek(),next=s.next();
  assert.equal(upcoming.length,remaining);
  assert.equal(new Set(upcoming).size,remaining);
  assert.ok(upcoming.every(id=>!seen.has(id)));
  assert.ok(!seen.has(next));seen.add(next);s.play(next);
 }
 assert.equal(seen.size,4);
});
test("reload and shuffle toggle retain the played-song history",()=>{
 const store=new Map(),s=make(store);
 const song=s.next();s.play(song);s.reset();
 assert.ok(!s.peek().includes(song));
 assert.ok(!make(store).peek().includes(song));
});
test("playlist and profile histories are independent",()=>{
 const storage=new Map(),s=make(storage);
 s.next();s.play("b");s.context("Gym");
 assert.ok(s.peek().includes("a"));
 s.context("");assert.ok(!s.peek().includes("a"));
 assert.ok(make(storage,"Diego").peek().includes("b"));
});
test("Smart Mix selection only accepts unplayed tracks",()=>{
 assert.match(app,/fresh\.has\(t\.id\)/);
 assert.match(app,/if\(!_casualeFresche\?\.has\(pickId\)\|\|pickId===currentId\)return false;/);
 assert.match(app,/if\(autoplay\)_casualeSegnaAscoltata\(id\)/);
});


test("entering a playlist containing the current song does not schedule it again",()=>{
 const s=make(),first=s.peek();
 assert.ok(!first.includes("a"));
 s.context("Gym");
 const gym=s.peek();
 assert.ok(gym.length>0);
 assert.ok(!gym.includes("a"),"already playing song must be marked as visited in this context");
 assert.equal(new Set(gym).size,gym.length,"no duplicates in playlist preview");
 s.context("");
 assert.ok(!s.peek().includes("a"),"library history survives changing tabs");
});

test("automatic next-song candidates exclude missing audio but browsing still shows them",()=>{
 const start=app.indexOf("function visibleTracks(perSuono) {");
 const end=app.indexOf("  /* Se un brano e' stato tolto",start);
 assert.ok(start>0&&end>start);
 const build=new Function("library",
  'let tracks=library,profile="Ste",DEFAULT_PROFILE="Ste",_playlistAttiva="",'+
  'favOnly=false,soloMaiAscoltati=false,soloScaricate=false,query="";'+
  'const _soloInPlaylist=new Set(),favorites=new Set(),hiddenTracks=new Set(),'+
  '_chiaveSoloInPlaylist=id=>id,_mieiCopiati=()=>new Set(),'+
  'ordinaLista=list=>list,_diChe=()=>{};'+
  app.slice(start,end)+'return visibleTracks;');
 const visible=build([
  {id:"playable",url:"https://example.org/a.mp3",profile:"Ste"},
  {id:"missing-url",url:"",profile:"Ste"},
  {id:"undefined-url",profile:"Ste"},
  {id:"waiting-video",youtubeId:"pending",url:"https://example.org/video",profile:"Ste"},
  {id:"friend",url:"https://example.org/f.mp3",profile:"Diego"}
 ]);
 assert.deepEqual(visible(true).map(t=>t.id),["playable"],
   "auto-next and DJ should see only playable tracks owned by the current profile");
 assert.equal(visible(false).length,5,
   "do not hide broken/importing entries from the normal library view");
});


test("ten displayed shuffle songs are previews; DJ promotion changes the ACTUAL next track",()=>{
 const start=app.indexOf("let _casualeFresche = null;");
 const end=app.indexOf("  function nextIndex() {",start);
 const begin=app.indexOf("mixSelectShuffle:({");
 const until=app.indexOf("  mixHandoff:",begin);
 assert.ok(start>0&&end>start&&begin>0&&until>begin);
 const expression=app.slice(begin+"mixSelectShuffle:".length,until)
   .trim().replace(/,\s*$/,"");
 const tracks=Array.from({length:22},(_,i)=>({
  id:i===0?"a":"track-"+i,url:"/audio/"+i+".mp3"
 }));
 const make=new Function("tracks","selector",
  'const LS={get:()=>({}),set:()=>{}},profile="Ste";'+
  'let _playlistAttiva="",_posizionePlaylist=-1,_playlistSuona=[],'+
  'favOnly=false,soloMaiAscoltati=false,soloScaricate=false,query="",'+
  'shuffle=true,repeat=false,currentId="a",queue=[];'+
  'const window={MusicBoxRoom:{isActive:()=>false},MusicBoxBridge:{}};'+
  'let renderQueueCount=()=>{};'+
  'const _listaPerIlSeguito=()=>tracks,_braniPlaylistInRiproduzione=()=>tracks;'+
  app.slice(start,end)+
  'const select=eval("("+selector+")");'+
  'window.MusicBoxBridge.mixShufflePool=()=>tracks.filter(t=>'+
  't.id!=="a"&&_casualeFresche.has(t.id));'+
  'return {preview:()=>_listaProssimiCasuali(tracks,10),'+
  'next:()=>tracks[_prossimaCasuale(tracks)]?.id,'+
  'select,manual:id=>queue.push(id),dj:()=>_casualeSceltaDJ};');
 const c=make(tracks,expression);
 const firstTen=c.preview();
 assert.equal(firstTen.length,10);
 const outside=tracks.find(t=>t.id!=="a"&&!firstTen.includes(t.id)).id;
 assert.equal(c.select({fromId:"a",initialFirst:firstTen[0],pickId:outside}),true);
 assert.equal(c.preview()[0],outside);
 assert.equal(c.next(),outside,"real auto-next must match DJ-selected first ID");
 assert.equal(c.dj(),outside,"UI labels precisely the selected DJ candidate");
 assert.equal(new Set(c.preview()).size,10);
 c.manual("manual-id");
 assert.equal(c.select({fromId:"a",initialFirst:outside,pickId:firstTen[1]}),false,
  "a user's manual queue must override any automatic DJ reorder");
});


test("stale DJ overlays cannot override a manually changed first song",()=>{
 const mix=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
 const fade=mix.slice(mix.indexOf("function fadeStep(){"),
  mix.indexOf("const time=clamp((performance.now()",mix.indexOf("function fadeStep(){")));
 assert.match(fade,/app\.mixNext\?\.\(\)\?\.id!==song\.id/);
 const h=mix.slice(mix.indexOf("function quietDirectHandoff("),
  mix.indexOf("// A phase offset",mix.indexOf("function quietDirectHandoff(")));
 assert.match(h,/app\.mixNext\?\.\(\)\?\.id!==next\.id/);
 const natural=mix.slice(mix.indexOf("function naturalEndHandoff("),
  mix.indexOf("async function handoff(",mix.indexOf("function naturalEndHandoff(")));
 assert.match(natural,/const latest=app\.mixNext\?\.\(\)/);
});
