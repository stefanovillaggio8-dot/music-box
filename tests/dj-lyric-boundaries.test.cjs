"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const builder=require("../tools/build-dj-lyric-boundaries.cjs");
const sha="a".repeat(40),other="b".repeat(40);
const lrc="[00:05.10] First lyric words\n[00:12.50] Another vocal line\n[01:10.20] Middle passage\n[01:34.30] The final line";
const fake={version:2,entries:{
 "audio/songs/track-23.mp3":{status:"ok",sha,duration:110},
 "app/songs/track-23.mp3":{status:"ok",sha:other,duration:110}
}};
test("usable LRC lines yield source SHA-bound *conservative* timing",()=>{
 const built=builder.build(fake,{"b-track-23":{synced:lrc}},{"b-track-23":{duration:110,synced:true}});
 assert.equal(built.stats.mapped,2);
 for(const key of [sha,other]){
  const item=built.entries[key];
  assert.equal(item.firstLrcAt,5.1);
  assert.equal(item.firstLyricAt,2.3);
  assert.equal(item.lastLrcAt,94.3);
  assert.equal(item.lastLyricAt,100.3);
  assert.equal(item.provenance,"existing-synced-lrc-not-vocal-model");
  assert.equal("voiceModel" in item,false);
  assert.equal("lastVoiceAt" in item,false);
 }
});
test("mismatched duration and unknown SHA cannot mislabel a different MP3",()=>{
 const wrong=builder.build(fake,{"b-track-23":{synced:lrc}},
  {"b-track-23":{duration:125,synced:true}});
 assert.equal(wrong.stats.mapped,0);
 const unknown=builder.build({version:2,entries:{
  "audio/songs/track-23.mp3":{status:"ok",sha:"NOT-A-GIT-SHA",duration:110}
 }},{"b-track-23":{synced:lrc}},{});
 assert.equal(unknown.stats.mapped,0);
});
test("LRC filters section labels and rejects sparse or out of range lyrics",()=>{
 const valid=builder.timestamps(lrc+"\n[01:40.20] [Outro]");
 assert.equal(valid.length,4);
 assert.equal(builder.timestamps("[00:00.00] Intro\n[00:01.00] Okay").length,0);
 const tooLate=builder.build({version:2,entries:{
  "audio/songs/track-23.mp3":{status:"ok",sha,duration:75}
 }},{"b-track-23":{synced:lrc}},{});
 assert.equal(tooLate.stats.mapped,0);
});
