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
console.log("Music Box karaoke/DJ targeted regression:",passed,"passed");
