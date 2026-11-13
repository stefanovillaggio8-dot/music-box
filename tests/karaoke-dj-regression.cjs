"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const karaokeSource = fs.readFileSync(path.join(root, "word-karaoke.js"), "utf8");
const immersiveSource = fs.readFileSync(path.join(root, "immersive.js"), "utf8");
const djSource = fs.readFileSync(path.join(root, "mix-intelligente.js"), "utf8");
const win = {};
vm.runInNewContext(karaokeSource, {window:win, globalThis:win});
const k=win.MusicBoxWordKaraoke;
assert.ok(k, "karaoke module loads");
let passed=0;
function test(name, fn){ fn(); passed++; console.log("PASS",name); }
function words(text, times){return times.map((t,i)=>({text:text[i], t}));}
test("reject words that do not match the lyric",()=>{
 const row=k.normalizeRows([{t:1,text:"ciao mondo",words:words(["ciao ","terra"],[1,1.4])}])[0];
 assert.equal(row.words,undefined);
});
test("accept correctly timed and spelled words",()=>{
 const row=k.normalizeRows([{t:1,text:"ciao mondo",words:words(["ciao ","mondo"],[1,1.4])}])[0];
 assert.equal(row.words.length,2);
});
test("reject out-of-order timestamps",()=>{
 const row=k.normalizeRows([{t:1,text:"ciao mondo",words:words(["ciao ","mondo"],[1.7,1.4])}])[0];
 assert.equal(row.words,undefined);
});
test("estimated words never count as verified",()=>{
 const rows=k.estimateRows([{t:1,text:"ciao mondo prova"},{t:4,text:"una frase nuova"}]);
 const coverage=k.timingCoverage(rows);
 assert.equal(coverage.audio,0);
 assert.equal(coverage.provider,0);
});
test("word fill follows actual media time",()=>{
 const row={t:1,end:2,text:"ciao mondo",words:[
  {t:1,end:1.5,text:"ciao "},{t:1.5,end:2,text:"mondo"}]};
 const values=[{},{}];
 const els=values.map(store=>({style:{setProperty(k,v){store[k]=v}}}));
 k.paintWords(row,els,1.25);
 assert.equal(values[0]["--karaoke-fill"],"50%");
 assert.equal(values[1]["--karaoke-fill"],"0%");
});
test("overlapping ASR word ends cannot cover following word",()=>{
 const row={t:1,end:2,text:"ciao mondo",words:[
  {t:1,end:1.9,text:"ciao "},{t:1.5,end:2,text:"mondo"}]};
 const values=[{},{}];
 const els=values.map(store=>({style:{setProperty(k,v){store[k]=v}}}));
 k.paintWords(row,els,1.6);
 assert.equal(values[0]["--karaoke-fill"],"100%");
 assert.equal(values[1]["--karaoke-fill"],"20%");
});
test("immersive cancels rapid competing smooth scrolls",()=>{
 assert.match(immersiveSource,/now-lastLyricScrollAt<450/);
 assert.match(immersiveSource,/seek.*rapid.*reducedMotion/);
});
test("DJ audit counts independent certification vetoes",()=>{
 assert.match(djSource,/certificationFailures/);
 for(const reason of ["mobile_playback_veto","desktop_beat_evidence_veto",
   "outro_release_veto","not_certified_beat_shape"]){
  assert.ok(djSource.includes(reason),reason);
 }
 assert.match(djSource,/if\(verified\)candidateAudit\.verifiedBeats\+\+/);
});
test("immersive sorts ASR-shifted cues and hides old-track lyrics",()=>{
 const makeClass=()=>({set:new Set(),toggle(name,on){
   if(on===undefined)on=!this.set.has(name);
   if(on)this.set.add(name);else this.set.delete(name);
   return on;
  },add(name){this.set.add(name)},remove(name){this.set.delete(name)},
  contains(name){return this.set.has(name)}});
 const karaoke={children:[],classList:makeClass(),
  replaceChildren(fragment){this.children=fragment.children},
  scrollTo(){},style:{removeProperty(){},setProperty(){}},
  clientHeight:400,scrollTop:0};
 const elements={imKaraoke:karaoke,imLyricModeLabel:{textContent:""}};
 const doc={readyState:"loading",addEventListener(){},
  getElementById(id){return elements[id]||null},
  createDocumentFragment(){return {children:[],appendChild(node){this.children.push(node)}}},
  createElement(){return {className:"",textContent:"",
   style:{setProperty(){}},classList:makeClass(),
   appendChild(){},offsetTop:50,offsetHeight:20}}};
 let current="song-b";
 const audio={currentTime:2.5,paused:true,seeking:false,duration:15};
 const app={currentId:()=>current,
  lyricsData:()=>({id:"song-b",synced:[
   {t:8,text:"third line"},{t:2,text:"first line"},{t:5,text:"second line"}]}),
  audio:()=>audio,lyricsDelay:()=>0};
 const w={MusicBoxBridge:app,MusicBoxWordKaraoke:k,addEventListener(){}};
 const instrumented=immersiveSource.replace("function renderLyrics(force){",
  "window.__setTestOpen=()=>{opened=true};"+
  "window.__renderTestLyrics=renderLyrics;"+
  "window.__rows=()=>lyricRows;function renderLyrics(force){");
 assert.notEqual(instrumented,immersiveSource,"test hooks inserted");
 vm.runInNewContext(instrumented,{window:w,document:doc,performance:{now:()=>0}});
 w.__setTestOpen();w.__renderTestLyrics(true);
 assert.deepEqual(Array.from(w.__rows(),row=>row.t),[2,5,8]);
 assert.ok(karaoke.children[0].classList.contains("active"));
 current="song-c";w.__renderTestLyrics(true);
 assert.equal(w.__rows()[0].text,"Musica, luci e atmosfera.");
 assert.doesNotMatch(karaoke.children[0].textContent,/first line|second line|third line/);
 // A genuinely timed phrase ends at 3s; never highlight it all the way
 // through the instrumental break to the next verse at 12s.
 current="song-b";
 app.lyricsData=()=>({id:"song-b",synced:[
  {t:2,end:3,text:"sung phrase"},{t:12,text:"next verse"},
  {t:15,text:"final verse"}]});
 audio.currentTime=2.5;w.__renderTestLyrics(true);
 assert.ok(karaoke.children[0].classList.contains("active"));
 audio.currentTime=6;w.__renderTestLyrics(false);
 assert.ok(karaoke.children.every(el=>!el.classList.contains("active")));
 assert.ok(!karaoke.children[1].classList.contains("past"),
  "future lyrics must not be marked as sung during instrumental gaps");
 audio.currentTime=12.25;w.__renderTestLyrics(false);
 assert.ok(karaoke.children[1].classList.contains("active"));
});
console.log("Music Box karaoke/DJ targeted regression:",passed,"passed");
