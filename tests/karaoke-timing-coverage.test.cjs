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
