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

test("single measured words retain their explicit ends through parsing and drawing",()=>{
 const api=win.MusicBoxWordKaraoke;
 const rows=api.parseEnhancedLrc('[00:00.00]<00:00.00>Ciao<00:00.80>');
 assert.equal(rows[0].words.length,1);assert.equal(rows[0].end,.8);
 assert.equal(api.fromRecord({syncedLyrics:'[00:00.00]<00:00.00>Ciao<00:00.80>'})[0].words.length,1);
 const normalized=api.normalizeRows(rows);
 assert.equal(api.hasWordTiming(normalized[0]),true);
 assert.equal(api.timingCoverage(normalized).wordTimed,1);
 assert.equal(api.normalizeRows([{t:0,text:'Ciao',words:[{t:0,text:'Ciao'}]}])[0].words,undefined);
 const element={style:{setProperty(key,value){this[key]=value}}};
 const elements=api.spanWords({createElement:()=>element},normalized[0],{appendChild(){}});
 assert.equal(elements.length,1);api.paintWords(normalized[0],elements,.4);
 assert.equal(element.style['--karaoke-fill'],'50%');
});
test("audio matching covers time-zero and short phrases only with exact, nearby observations",()=>{
 vm.runInNewContext(fs.readFileSync(path.join(root,'audio-lyrics-align.js'),'utf8'),{window:win});
 const api=win.MusicBoxAudioAlign;
 const rows=[{t:0,text:'Ciao'},{t:4,text:'Vieni qui'},{t:8,text:'Ancora una frase'}];
 const chunks=[{text:'Ciao',timestamp:[.08,.6]},{text:'Vieni',timestamp:[4.1,4.4]},{text:'qui',timestamp:[4.45,4.8]}];
 const aligned=api.alignWindow(rows,chunks);
 assert.equal(aligned.length,2);assert.equal(aligned[0].sourceT,0);
 assert.equal(aligned[0].end,.6);assert.equal(aligned[1].words.length,2);
 assert.equal(api.alignWindow(rows,chunks.map(w=>({...w,timestamp:w.timestamp.map(t=>t+.4)}))).length,0);
 const extra=[chunks[1],{text:'tu',timestamp:[4.42,4.44]},chunks[2]];
 assert.equal(api.alignWindow(rows,extra).length,0);
 assert.equal(api.recognizedWords([{text:'Ciao',timestamp:[false,' ']}]).length,0);
});
test("a new song aborts stale karaoke analysis and immediately accepts the next request",async()=>{
 const idle=[],writes=[];let current='old',aborted=false;
 const bridge={currentId:()=>current,profile:()=>'',audio:()=>({duration:180}),
  lyricsData:()=>({synced:[{t:1,text:'che sono siamo non voglio dentro senza ancora'},{t:8,text:'questo cuore notte sempre'},{t:14,text:'tutta questa strada'}]}),
  allTracks:()=>[{id:current}],mixUrl:()=> 'https://example.test/song.mp3'};
 const window={MusicBoxBridge:bridge,Worker:function(){},requestIdleCallback:fn=>idle.push(fn)};
 const context={window,document:{hidden:false,baseURI:'https://example.test/',getElementById:()=>null},
  navigator:{onLine:true,gpu:{},userAgent:'desktop'},URL,AbortController,
  requestIdleCallback:fn=>idle.push(fn),setTimeout,clearTimeout,
  sessionStorage:{getItem:()=>null,setItem:(...args)=>writes.push(args)},
  fetch:(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'))}))};
 vm.runInNewContext(fs.readFileSync(path.join(root,'audio-lyrics-align.js'),'utf8'),context);
 const api=window.MusicBoxAudioAlign;
 assert.equal(api.request('old'),true);idle.shift()();
 current='new';assert.equal(api.request('new'),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(aborted,true);assert.equal(writes.length,0,'cancellation cannot cause the 24h failure backoff');
 api.cancel();current='old';assert.equal(api.request('old'),true,'a cancelled window can be retried');
 api.cancel();
});
