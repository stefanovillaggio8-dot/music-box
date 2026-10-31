#!/usr/bin/env node
import assert from "node:assert/strict";
import {parseMusicMetadata,mergeMusicMetadata} from "../cloud/musicbox-import-queue/track-metadata.mjs";
const cases=[
 ["Kid Yugi - Sentire La Musica (Visual)","Kid Yugi","Sentire La Musica"],
 ["Dominic Fike - WHITE KEYS","Dominic Fike","WHITE KEYS"],
 ["Lazza - ZONDA (Official Music Video)","Lazza","ZONDA"],
 ["Central Cee – Loading [Official Audio]","Central Cee","Loading"],
 ["Artist — Song (feat. Friend) (Official Video)","Artist","Song (feat. Friend)"],
 ["Artist - Song (Acoustic Version)","Artist","Song (Acoustic Version)"],
 ["Salmo - 90MIN (Official Visualizer)","Salmo","90MIN"],
 ["Artist - Song (Remix)","Artist","Song (Remix)"]
];
for(const [full,artist,title] of cases){
 const result=parseMusicMetadata(full,"Generic Label");
 assert.equal(result.artist,artist,full+" artist");
 assert.equal(result.title,title,full+" title");
 assert.equal(result.confident,true);
}
assert.deepEqual(
  Object.fromEntries(Object.entries(parseMusicMetadata("White Keys","Dominic Fike - Topic")).filter(([k])=>k==="artist"||k==="title")),
  {artist:"Dominic Fike",title:"White Keys"}
);
assert.equal(parseMusicMetadata("A song","Random Records").artist,"");
assert.equal(parseMusicMetadata("Just a Song (Official Audio)","Uploader").title,"Just a Song");
assert.equal(mergeMusicMetadata("Artist - Title","A strange upload","Label").artist,"Artist");
assert.equal(mergeMusicMetadata("","Kid Yugi - Sentire La Musica (Visual)","Channel").title,"Sentire La Musica");
console.log("OK: artista e titolo separati, metadati YouTube, Topic, tag video, versioni reali mantenute.");
