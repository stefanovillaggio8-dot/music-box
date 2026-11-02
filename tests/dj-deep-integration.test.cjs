"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const text=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const start=text.indexOf("function deepLookup(track){");
const end=text.indexOf("function deepStatus(){",start);
assert.ok(start>0&&end>start);
const lookup=(entries)=>new Function("deepIndex",text.slice(start,end)+"return deepLookup")({
 version:1,entries});
const features={sha:"test",status:"ok",duration:160,analyzer:"librosa-onsets-chroma-rms-v1",
 chroma:Array.from({length:12},(_,i)=>i/78),bpm:120,introDrive:.8};
test("precomputed real audio from main audio library avoids MP3 download",()=>{
 const get=lookup({"audio/songs/track-88.mp3":features});
 assert.equal(get({file:"songs/track-88.mp3"}),features);
 assert.equal(get({url:"https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-88.mp3"}),features);
});
test("future smartphone uploads on mobile-audio are recognized",()=>{
 const get=lookup({"mobile/songs/youtube-abc123def45.mp3":features});
 assert.equal(get({file:"songs/youtube-abc123def45.mp3"}),features);
});
test("failed, unknown and stale/incomplete analyses safely fall back",()=>{
 const get=lookup({"audio/songs/track-88.mp3":{status:"failed",duration:100},
 "audio/songs/track-89.mp3":{...features,chroma:null}});
 assert.equal(get({file:"songs/track-88.mp3"}),null);
 assert.equal(get({file:"songs/track-89.mp3"}),null);
 assert.equal(get({file:"songs/track-90.mp3"}),null);
});
test("index analyzed asynchronously, unindexed songs retain local analysis",()=>{
 assert.ok(text.includes('fetch("dj-deep-analysis.json"'));
 assert.ok(text.includes('loadDeepIndex().catch(()=>{})'));
 assert.ok(text.includes('const saved=await savedAnalysis(key)'));
 assert.ok(text.includes('decode(next,mobileOverlayEnabled&&!document.hidden)'));
});

test("deep index voice scan is restricted to active and next tracks",()=>{
 assert.ok(text.includes("scheduleDeepVoice(track,key,merged)"));
 assert.ok(text.includes("scheduleDeepVoice(track,key,deep)"));
 assert.ok(text.includes("if(!merged.voiceModel)scheduleDeepVoice"));
 assert.ok(text.includes("voiceModelVersion:local.voiceModelVersion"));
});
function vocalFixture(){
 const start=text.indexOf("const voiceRetry=new Map();");
 const end=text.indexOf("function toast(m)",start);
 assert.ok(start>0&&end>start);
 const app={currentId:()=>1,mixNext:()=>({id:2})};
 const window={
  MusicBoxVocal:{analyze:async()=>({
   source:"yamnet",modelVersion:3,firstVoiceAt:0,lastVoiceAt:98,
   firstVoiceConfidence:.74,lastVoiceConfidence:.91,
   voiceIntervals:[{at:95,end:98,confidence:.91}],
   scannedFrom:70,scannedEnd:100
  })},
  OfflineAudioContext:class{
   async decodeAudioData(){return {duration:100}}
   async close(){}
  }
 };
 let fetched=0,persisted=0;
 const env={
  app,window,doc:{hidden:false},
  fetch:async()=>{fetched++;return {
   ok:true,headers:{get:()=>"40"},arrayBuffer:async()=>new ArrayBuffer(40)
  }},
  saved:async()=>{persisted++}
 };
 const runner=new Function("env",[
  "const window=env.window,document=env.doc,navigator={connection:{effectiveType:'4g'}},isIOS=false,enabled=true;",
  "const bridge=()=>env.app,fetch=env.fetch,saveAnalysis=env.saved;",
  "const cache=new Map(),voiceJobs=new Map();",
  "let active=null,mobileActive=null,plan=null,mixing=false,plannedFor='old';",
  "const voiceThreatensPlan=()=>false,cancel=()=>{};",
  text.slice(start,end),
  "return {cache,voiceJobs,scheduleDeepVoice,voiceIsRelevant};"
 ].join("\n"))(env);
 return {...runner,count:()=>fetched,saved:()=>persisted};
}
test("deep-index vocal scan enriches only the current song without sending PCM",async()=>{
 const f=vocalFixture(),key="https://example.test/audio.mp3",data={duration:100,last:100};
 f.cache.set(key,data);
 f.scheduleDeepVoice({id:99},key,data);
 assert.equal(f.count(),0);
 f.scheduleDeepVoice({id:1},key,data);
 const job=f.voiceJobs.get(key);
 assert.ok(job);
 await job;
 assert.equal(f.count(),1);
 assert.equal(f.saved(),1);
 assert.equal(f.cache.get(key).voiceModel,"yamnet");
 assert.equal(f.cache.get(key).voiceModelVersion,3);
 assert.equal(f.cache.get(key).lastVoiceAt,98);
 assert.equal(f.cache.get(key).voiceIntervals[0].at,95);
});
test("deep-index enrichment refuses audio durations that disagree",async()=>{
 const f=vocalFixture(),key="https://example.test/audio.mp3",data={duration:170,last:170};
 f.cache.set(key,data);
 f.scheduleDeepVoice({id:1},key,data);
 const job=f.voiceJobs.get(key);assert.ok(job);
 await job;
 assert.equal(f.cache.get(key).voiceModel,undefined);
 assert.equal(f.saved(),0);
});

test("deep audio always wins over stale local beat analysis; vocal veto remains",()=>{
 const begin=text.indexOf("function withValidatedVoice(");
 const end=text.indexOf("function deepStatus(){",begin);
 assert.ok(begin>0&&end>begin);
 const merge=new Function(text.slice(begin,end)+"return withValidatedVoice")();
 const deep={duration:180,bpm:126,beatConfidence:.24,
  outroFinalNotes:Array(12).fill(.12)};
 const local={duration:180,bpm:95,voiceModel:"YAMNet",
  voiceModelVersion:4,lastVoiceAt:156,voiceScannedEnd:177};
 const result=merge(deep,local);
 assert.equal(result.bpm,126);
 assert.deepEqual(result.outroFinalNotes,deep.outroFinalNotes);
 assert.equal(result.lastVoiceAt,156);
 assert.equal(result.voiceModel,"YAMNet");
 assert.equal(merge(deep,{...local,duration:173}).voiceModel,undefined);
 assert.match(text,/withValidatedVoice\(deepLookup\(t\),local\)/);
});
