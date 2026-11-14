'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('background cancels actual pending analysis ownership across repeated hide/show cycles without touching music',async()=>{
 const events=new Map(),values=new Map(),pcm=new Float32Array(16000*40);let workers=0,terminated=0,closed=0,saved=0;
 class Worker{constructor(){workers++}postMessage(){}terminate(){terminated++}}
 class Offline{async decodeAudioData(){return {sampleRate:16000,duration:40,length:pcm.length,numberOfChannels:1,getChannelData:()=>pcm}}async close(){closed++}}
 const audio={currentTime:3,duration:40,paused:false,pause(){throw Error('Native playback must not be paused')}};
 const doc={hidden:false,baseURI:'https://example.test/',getElementById:()=>null,addEventListener:(name,fn)=>events.set(name,fn)};
 const window={Worker,OfflineAudioContext:Offline,addEventListener:(name,fn)=>events.set(name,fn),MusicBoxBridge:{
  currentId:()=> 'song',profile:()=> 'Diego',audio:()=>audio,allTracks:()=>[{id:'song'}],mixUrl:()=> 'https://example.test/song.mp3',saveAudioWordRows:()=>{saved++},
  lyricsData:()=>({synced:[{t:1,text:'the words you know and never want'},{t:7,text:'your heart will always be with me'},{t:16,text:'another first verse when we are here'}]})}};
 const c={window,Worker,document:doc,navigator:{onLine:true,gpu:{},userAgent:'iPhone'},URL,AbortController,setTimeout,clearTimeout,
  requestIdleCallback:fn=>fn(),sessionStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))},
  fetch:async()=>({ok:true,headers:{get:()=>null},blob:async()=>({size:20,arrayBuffer:async()=>new ArrayBuffer(20)})})};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../audio-lyrics-align.js'),'utf8'),c);const api=window.MusicBoxAudioAlign;
 assert.equal(workers,0,'opening the module cannot load a model');
 for(let i=0;i<5;i++){
  doc.hidden=false;assert.equal(api.request('song'),true);await new Promise(setImmediate);
  assert.equal(api.diagnostics().pendingInference,1);assert.equal(api.diagnostics().workerAlive,true);
  doc.hidden=true;events.get(i%2?'pagehide':'visibilitychange')();await new Promise(setImmediate);
  const d=api.diagnostics();assert.equal(d.pendingInference,0);assert.equal(d.workerAlive,false);assert.equal(d.activeAnalyses,0);
  assert.equal(d.fetchingAudio,false);assert.equal(d.continuationScheduled,false);assert.equal(api.request('song'),false);
 }
 assert.equal(workers,5);assert.equal(terminated,5);assert.equal(closed,5);assert.equal(saved,0);
 assert.equal(audio.paused,false);assert.equal(audio.currentTime,3);assert.equal(values.size,0,'cancelled inference must not acquire a failed-window cooldown');
});
