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
