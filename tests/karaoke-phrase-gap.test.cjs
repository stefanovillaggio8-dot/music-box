"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
const start=app.indexOf("  function activeLineIndex(time) {"),end=app.indexOf("  // Native timeupdate events",start);
assert.ok(start>0&&end>start);
const choose=rows=>new Function("lyricLines","_lyricWordParts",app.slice(start,end)+"return activeLineIndex;")(
 rows.map(r=>({dataset:{t:String(r.t)}})),rows.map(row=>({row,elements:[]})));
test("a known phrase end clears the normal reader during a long instrumental gap without advancing the next phrase",()=>{
 const pick=choose([{t:2,end:3,text:"sung phrase"},{t:12,text:"next phrase"},{t:15,text:"last"}]);
 assert.equal(pick(2.5),0);assert.equal(pick(4.5),0);
 assert.equal(pick(4.501),-1);assert.equal(pick(11.999),-1);
 assert.equal(pick(12),1);assert.equal(pick(2.75),0,"Seeking backwards reactivates the complete phrase");
});
test("unknown or estimated word endings never fabricate a pause; close and sustained phrases stay intact",()=>{
 for(const row of [{t:2},{t:2,estimated:true,words:[{t:2,end:3}]},{t:2,end:1},{t:2,partialAudio:true,acousticSpans:[{t:2,end:3}]}])
  assert.equal(choose([row,{t:12}])(7),0);
 assert.equal(choose([{t:2,end:8.5},{t:12}])(10.2),0,"Short phrase gaps do not flicker");
 assert.equal(choose([{t:2,end:10.9},{t:12}])(10.8),0,"Sustained final vowel stays active");
 assert.equal(choose([{t:2,words:[{t:2,end:3}]},{t:12}])(7),-1,"Existing acoustic word metadata may identify an end without rendering words");
});
test("final-phrase expiry and phrase-only rendering from PR65 remain unchanged",()=>{
 const pick=choose([{t:2,end:3},{t:12,end:13}]);
 assert.equal(pick(15.49),1);assert.equal(pick(15.501),-1);
 const a=app.indexOf("  function openLyrics() {"),b=app.indexOf("  /* Lo sfondo prende",a),render=app.slice(a,b);
 assert.ok(render.includes('p.textContent=line.text;'));
 assert.ok(render.includes('const elements=[]; // Phrase-only karaoke'));
 assert.doesNotMatch(render,/\.spanWords\(|MusicBoxAudioAlign[^;]*\.request\(/);
});
