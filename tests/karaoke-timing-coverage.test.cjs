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

test('rapid exact ASR lines align without the old 450ms phrase floor',()=>{
 const api=win.MusicBoxAudioAlign;
 const lines=[{t:1,text:'questa notte sono qui'},{t:1.4,text:'resto con te'}];
 const chunks=['questa','notte','sono','qui'].map((text,i)=>({text,timestamp:[1+i*.08,1.07+i*.08]}));
 const aligned=api.alignWindow(lines,chunks);
 assert.equal(aligned.length,1);assert.equal(aligned[0].words.length,4);
 assert.equal(aligned[0].end,1.31);
 assert.equal(api.alignWindow(lines,chunks.map((w,i)=>i===2?{...w,text:'altra'}:w)).length,0);
 for(const t of [null,false,'',true,{}])assert.equal(api.alignWindow([{t,text:lines[0].text}],chunks).length,0);
});

test('adjacent repeated hooks cannot claim the same ASR word observations twice',()=>{
 const api=win.MusicBoxAudioAlign;
 const aligned=api.alignWindow([{t:1,text:'vieni qui'},{t:1.3,text:'vieni qui'},{t:3,text:'dopo'}],
  [{text:'vieni',timestamp:[1.1,1.2]},{text:'qui',timestamp:[1.21,1.3]}]);
 assert.equal(aligned.length,1);assert.equal(aligned[0].sourceT,1);
});

test('estimated display words remain eligible for real audio analysis',()=>{
 const api=win.MusicBoxAudioAlign;
 const row={t:1,text:'vieni qui',estimated:true,words:[{t:1,text:'vieni '},{t:1.5,text:'qui'}]};
 assert.ok(api.preferredWindows([row],30).length);
 assert.equal(api.alignWindow([row],[{text:'vieni',timestamp:[1.1,1.3]},
  {text:'qui',timestamp:[1.35,1.6]}]).length,1);
});

test('a measured rapid word completes at its actual end before the next word',()=>{
 const api=win.MusicBoxWordKaraoke;
 const row={t:10,end:10.2,text:'e poi',words:[{t:10,end:10.03,text:'e '},{t:10.03,end:10.2,text:'poi'}]};
 const parts=row.words.map(()=>({style:{setProperty(key,value){this[key]=value}}}));
 api.paintWords(row,parts,10.015);assert.equal(parts[0].style['--karaoke-fill'],'50%');
 api.paintWords(row,parts,10.03);assert.equal(parts[0].style['--karaoke-fill'],'100%');
 assert.equal(parts[1].style['--karaoke-fill'],'0%');
 api.paintWords(row,parts,9.99);assert.equal(parts[0].style['--karaoke-fill'],'0%');
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

test("audio-measured short phrases survive actual application save and reload",async()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const save=app.slice(app.indexOf('  async function _salvaParoleDallAudio('),app.indexOf('  /* Recupero graduale mentre'));
 const parser=app.slice(app.indexOf('  function parseSynced('),app.indexOf('  function _righeTestoConParole('));
 const getter=app.slice(app.indexOf('  function _righeTestoConParole('),app.indexOf('  const _ritardiTesti='));
 const existing={synced:'[00:00] Ciao\n[00:04] Vieni qui\n[00:08] Ancora una frase'};
 const fixture=new Function('window','existing',`
  const currentId='song',lyricsData={song:existing},localLyrics={},db=null;
  const _testoLocaleVerificato=()=>localLyrics.song||existing;
  const $=()=>({hidden:true}),render=()=>{};
  const _haTempiParole=row=>window.MusicBoxWordKaraoke.hasWordTiming(row);
  ${parser}\n${getter}\n${save}
  return {save:_salvaParoleDallAudio,read:()=>localLyrics.song,rows:_righeTestoConParole};
 `)(win,existing);
 const aligned=win.MusicBoxAudioAlign.alignWindow([{t:0,text:'Ciao'},{t:4,text:'Vieni qui'},{t:8,text:'Ancora una frase'}],
  [{text:'Ciao',timestamp:[.08,.6]},{text:'Vieni',timestamp:[4.1,4.4]},{text:'qui',timestamp:[4.45,4.8]}]);
 assert.equal(await fixture.save('song',aligned),2);
 const stored=JSON.parse(JSON.stringify(fixture.read()));
 assert.equal(stored.synced,existing.synced);
 const rows=fixture.rows(stored);
 assert.equal(rows[0].words.length,1);assert.equal(rows[0].sourceT,0);
 assert.equal(rows[0].end,.6);assert.equal(rows[1].words.length,2);
 assert.equal(win.MusicBoxWordKaraoke.timingCoverage(rows).audio,2);
});

test('short-context retries require a previously analyzed unresolved passage',()=>{
 const api=win.MusicBoxAudioAlign,rows=[{t:1,text:'non voglio perdere queste parole rapide'},
  {t:16,text:'ancora questa frase senza un tempo'}];
 assert.ok(api.analysisWindows(rows,28,()=>false).every(w=>w.kind==='primary'));
 const retry=api.analysisWindows(rows,28,at=>at===0).filter(w=>w.kind==='context14');
 assert.equal(retry.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(retry.map(w=>[w.at,w.seconds,w.coreStart,w.coreEnd]))),[[0,16,0,14],[12,16,14,28]]);
 const timed=rows.map(r=>({...r,words:r.text.split(' ').map((text,i)=>({text:text+' ',t:r.t+i*.1,end:r.t+i*.1+.08}))}));
 assert.equal(api.analysisWindows(timed,28,()=>true).length,0);
});

test('overlapping short contexts own each actual observation once and never invent a timestamp',()=>{
 const api=win.MusicBoxAudioAlign;
 const chunks=[{text:'prima',timestamp:[13.7,13.9]},{text:'dopo',timestamp:[13.9,14.1]},
  {text:'sconosciuta',timestamp:[null,14.2]},{text:'negativa',timestamp:[-1,.2]}];
 const first=api.ownedContextWords(chunks,{kind:'context14',at:0,coreStart:0,coreEnd:14});
 const second=api.ownedContextWords(chunks.map(w=>({...w,timestamp:w.timestamp.map(t=>typeof t==='number'?t-12:t)})),
  {kind:'context14',at:12,coreStart:14,coreEnd:28});
 assert.equal(first.length,1);assert.equal(first[0],chunks[0]);
 assert.equal(second.length,1);assert.equal(second[0].text,'dopo');
 assert.equal(api.recognizedWords(second,12)[0].t,13.9);
});

test('iPhone context refinement uses one inference per visit and the unchanged three-window session cap',async()=>{
 let now=Date.now(),calls=[];const values=new Map(),pcm=new Float32Array(16000*40);
 class Clock extends Date{static now(){return now}}
 class Worker{postMessage(message){calls.push(message.pcm.length);queueMicrotask(()=>this.onmessage({data:{id:message.id,chunks:[]}}))}terminate(){}}
 class Offline{async decodeAudioData(){return {sampleRate:16000,duration:40,length:pcm.length,numberOfChannels:1,getChannelData:()=>pcm}}}
 const bridge={currentId:()=> 'song',profile:()=> 'Ste',audio:()=>({currentTime:0,duration:40}),
  allTracks:()=>[{id:'song'}],mixUrl:()=> 'https://example.test/song.mp3',lyricsData:()=>({synced:[
   {t:1,text:'the words you know and never want'},
   {t:7,text:'your heart will always be with me'},
   {t:16,text:'another first verse when we are here'}]})};
 const context={window:{Worker,OfflineAudioContext:Offline,MusicBoxBridge:bridge},Worker,Date:Clock,
  document:{hidden:false,baseURI:'https://example.test/',getElementById:()=>null},
  navigator:{onLine:true,gpu:{},userAgent:'iPhone'},URL,AbortController,setTimeout,clearTimeout,
  requestIdleCallback:fn=>fn(),sessionStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))},
  fetch:async()=>({ok:true,headers:{get:()=>null},blob:async()=>({size:20,arrayBuffer:async()=>new ArrayBuffer(20)})})};
 vm.runInNewContext(fs.readFileSync(path.join(root,'audio-lyrics-align.js'),'utf8'),context);
 const api=context.window.MusicBoxAudioAlign;
 for(let i=0;i<3;i++){
  assert.equal(api.request('song'),true);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,i+1);now+=20000;
 }
 assert.deepEqual(calls,[28*16000,16*16000,16*16000]);
 assert.equal(api.request('song'),false,'refinement cannot exceed the existing mobile session cap');
 api.cancel();
});
