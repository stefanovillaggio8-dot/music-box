"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const from=app.indexOf("  function openLyrics() {");
const to=app.indexOf("  /* Lo sfondo prende",from);
assert.ok(from>0&&to>from,"openLyrics must remain inspectable");
function fixture(visible){
 const elements=new Map();
 const node=id=>{
  if(!elements.has(id))elements.set(id,{
    hidden:id==="lyricsPanel"?!visible:false,
    textContent:"OLD RECORDING'S LYRICS",children:[],
    replaceChildren(){this.children=[]},
    appendChild(child){this.children.push(child)}
   });
  return elements.get(id);
 };
 const script="let lyricLines=['old'],_lyricWordParts=['old'],lyricActive=1;\n"+
  app.slice(from,to)+"\nreturn {openLyrics,state:()=>({lyricLines,_lyricWordParts,lyricActive})};";
 const run=new Function("$","currentLyrics","current","document","_fermaKaraokePrecisione",script);
 let stop=0;
 const api=run(node,()=>null,()=>({title:"New song",artist:"New artist"}),
  {createElement:()=>({className:"",textContent:""})},()=>{stop++});
 return {node,api,stops:()=>stop};
}
test("rapid DJ handoff with missing lyrics never displays the previous song",()=>{
 const f=fixture(true);f.api.openLyrics();
 assert.equal(f.node("lyricsTitle").textContent,"New song");
 assert.equal(f.node("lyricsSub").textContent,"New artist");
 assert.equal(f.node("lyricsBody").children.length,1);
 assert.match(f.node("lyricsBody").children[0].textContent,/non disponibile/);
 assert.equal(f.node("lyricsSyncControls").hidden,true);
 assert.equal(f.api.state().lyricLines.length,0);
 assert.equal(f.api.state()._lyricWordParts.length,0);
 assert.equal(f.api.state().lyricActive,-1);
 assert.equal(f.stops(),1);
});
test("a hidden lyric panel is not forced open when next song lacks lyrics",()=>{
 const f=fixture(false);f.api.openLyrics();
 assert.equal(f.node("lyricsPanel").hidden,true);
 assert.equal(f.stops(),0);
});
