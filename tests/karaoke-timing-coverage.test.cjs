"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const win={};vm.runInNewContext(fs.readFileSync(path.join(root,"word-karaoke.js"),"utf8"),{window:win});
const coverage=win.MusicBoxWordKaraoke.timingCoverage;
test("timing coverage never calls estimated or lyric-line timestamps audio-certified",()=>{
 const rows=[
  {t:1,sourceT:.85,text:"hello world",words:[{t:1,text:"hello "},{t:1.4,text:"world"}]},
  {t:3,text:"come back",words:[{t:3,text:"come "},{t:3.3,text:"back"}]},
  {t:5,text:"rapid words",estimated:true,words:[{t:5,text:"rapid "},{t:5.5,text:"words"}]},
  {t:7,text:"only line"},
  {t:9,text:"two words"}
 ];
 const c=coverage(rows);
 assert.equal(c.total,5);
 assert.equal(c.audio,1);
 assert.equal(c.provider,1);
 assert.equal(c.estimated,1);
 assert.equal(c.lineOnly,2);
 assert.equal(c.wordTimed,2);
 assert.equal(c.percent,40);
});
test("both karaoke views display the number of verified word-synced lines",()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 const immersive=fs.readFileSync(path.join(root,"immersive.js"),"utf8");
 assert.match(app,/wordCoverage\.wordTimed\+"\/"\+wordCoverage\.total/);
 assert.match(immersive,/coverage\.wordTimed\+"\/"\+coverage\.total/);
 assert.match(immersive,/sourceT:Number\(row.sourceT\)/);
 assert.doesNotMatch(immersive,/PAROLA PER PAROLA · IA/);
});

test("empty and boolean timestamps cannot fabricate trusted word timing",()=>{
 const api=win.MusicBoxWordKaraoke;
 for(const t of [null,undefined,"", "  ",false,true,[],{}]){
  assert.equal(api.normalizeRows([{t,text:"hello world"}]).length,0);
  const rows=api.normalizeRows([{t:0,text:"hello world",words:[{t,text:"hello "},{t:1,text:"world"}]}]);
  assert.equal(rows[0].words,undefined);
 }
 assert.equal(api.normalizeRows([{t:"0",text:"hello world"}])[0].t,0);
 assert.equal(api.normalizeRows([{t:0,text:"hello world",words:[null,{t:1,text:"world"}]}])[0].words,undefined);
 assert.equal(api.timingCoverage([{t:null,text:"hello world"}]).total,0);
 assert.equal(api.timingCoverage([{t:0,text:"hello world",words:[{t:0,text:"wrong "},{t:1,text:"lyrics"}]}]).wordTimed,0);
});
test("normalization cannot promote estimated words to trusted provider timing",()=>{
 const api=win.MusicBoxWordKaraoke;
 const estimated=api.estimateRows([{t:1,text:"hello world"},{t:5,text:"last line"}]);
 const rows=api.normalizeRows(estimated);
 assert.equal(rows[0].estimated,true);
 assert.equal(api.timingCoverage(rows).estimated,1);
 assert.equal(api.timingCoverage(rows).wordTimed,0);
});
test("Enhanced LRC closing timestamp preserves words and a measured phrase end",()=>{
 const api=win.MusicBoxWordKaraoke;
 const rows=api.parseEnhancedLrc("[00:10.00]<00:10.20>Hello <00:10.80>world<00:11.50>\n[00:20.00]<00:20.00>Come <00:20.50>back");
 assert.equal(rows[0].words.length,2);
 assert.equal(rows[0].t,10.2);
 assert.equal(rows[0].end,11.5);
 assert.equal(rows[0].words[1].end,11.5);
 assert.equal(rows[0].text,"Hello world");
 assert.equal(rows[1].words.length,2);
 assert.equal(rows[1].end,undefined);
 const normalized=api.normalizeRows(rows);
 assert.equal(normalized[0].end,11.5);
 assert.equal(api.timingCoverage(normalized).provider,2);
});
