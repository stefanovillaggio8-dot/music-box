#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const src=fs.readFileSync("app.js","utf8");
const page=fs.readFileSync("index.html","utf8");
const start=src.indexOf("  function _ytAggiornaVociLibreria(entries, owner, draw=false) {");
const end=src.indexOf("  async function loadAll() {",start);
assert(start>0&&end>start,"Missing link-to-library mapping function");
const calls=[];
const ctx={
 tracks:[{id:"b-track-2",title:"Existing MP3",file:"songs/track-2.mp3",builtin:true}],
 profile:"Ste",PALETTE:["gradient"],render(){calls.push("render")},
};
const mapper=vm.runInNewContext("("+src.slice(start,end).trim()+")",ctx);
mapper([{video_id:"75qIYkMUGVE",title:"Video YouTube",status:"failed"},
        {video_id:"75qIYkMUGVE",title:"Duplicate",status:"failed"},
        {video_id:"bad-id",title:"Invalid",status:"queued"}],"Ste",true);
assert.equal(ctx.tracks.length,2);
assert.equal(ctx.tracks[0].id,"yt-75qIYkMUGVE");
assert.equal(ctx.tracks[0].source,"youtube-link");
assert.equal(ctx.tracks[0].builtin,true);
assert.equal(ctx.tracks[0].url,"");
assert.equal(ctx.tracks[0].profile,"Ste");
assert.equal(ctx.tracks[1].id,"b-track-2");
assert.equal(calls.length,1);
mapper([{video_id:"aabbccddeef",status:"queued"}],"Emanuele",true);
assert.equal(ctx.tracks[0].id,"yt-75qIYkMUGVE","Do not mix profiles");
assert.equal(calls.length,1);
ctx.tracks.push({id:"b-youtube-new",file:"songs/youtube-75qIYkMUGVE.mp3"});
mapper([{video_id:"75qIYkMUGVE",status:"completed"}],"Ste");
assert.equal(ctx.tracks.filter(x=>x.youtubeId).length,0,"Use real MP3 if available");
assert(src.includes("_ytAggiornaVociLibreria(await _ytBraniDalCloud(_nomeYT)"));
assert(src.includes('_ytAggiornaVociLibreria(previous,selected,true)'));
assert(src.includes('if (t.source==="youtube-link" && t.youtubeId)'));
assert(src.includes('list=list.filter(t=>!t.youtubeId)'));
assert(src.includes('if (t.builtin && !t.youtubeId && !isCached(t))'));
assert(src.includes('if(!t.youtubeId) {'));
assert(!page.includes('id="btnMieiVideoYT"'));
assert(/<script src="app\.js\?v=\d+"><\/script>/.test(page),"App script must be versioned");
console.log("OK: YouTube appears in the actual library, instantly and after reload; profile isolation, dedupe, playback routing, no fake MP3/offline.");
