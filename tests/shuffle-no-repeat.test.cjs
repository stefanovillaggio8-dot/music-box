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
