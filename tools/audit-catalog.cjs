#!/usr/bin/env node
"use strict";
/* Music Box: read-only integrity audit. Never touches music, profiles or downloads. */
const fs = require("node:fs");
const vm = require("node:vm");
const fail = [];
function json(file) {
  try { return JSON.parse(fs.readFileSync(file,"utf8")); }
  catch (e) { fail.push(file + ": " + e.message); return {}; }
}
const app = fs.readFileSync("app.js","utf8");
const marker = "const BUILTIN = [";
const start = app.indexOf(marker), end = app.indexOf("];",start);
if(start<0||end<0)throw Error("Catalogo BUILTIN mancante");
const songs = vm.runInNewContext("["+app.slice(start+marker.length,end)+"]", {}, {timeout:5000});
const version = json("versione.json");
const spotify = json("covers-spotify.json");
const generic = json("covers.json");
json("lyrics.json");
const karaoke = json("karaoke-index.json");
if(!Array.isArray(songs) || songs.length!==version.brani) fail.push("Numero brani incoerente con versione.json");
const seen = new Set(), counts = {},missingSpotify = [], brokenCoverPaths=[];
for(const t of songs){
  const p=t.profile||"Ste";
  counts[p]=(counts[p]||0)+1;
  if(!t.title||typeof t.title!=="string"||typeof t.file!=="string"||!t.file.endsWith(".mp3"))
    fail.push("Metadati brano invalidi: "+JSON.stringify(t).slice(0,200));
  const key=p+"|"+t.file;
  if(seen.has(key))fail.push("File duplicato nello stesso profilo: "+key);
  seen.add(key);
  if(t.spotifyId){
    const meta=spotify[t.spotifyId];
    if(!meta||!/^https:\/\//.test(meta.cover||""))missingSpotify.push(p+" "+t.title);
    else if(meta.title!==t.title||meta.artist!==t.artist)
      fail.push("Metadati copertina Spotify discordanti per "+t.spotifyId);
  }
  if(t.cover && !/^https:\/\//.test(t.cover) && !fs.existsSync(t.cover))
    brokenCoverPaths.push({profile:p,title:t.title,file:t.cover});
}
for(const [key,v] of Object.entries(karaoke)){
  if(!/^b-[a-zA-Z0-9_-]+$/.test(key) || !Number.isSafeInteger(v.lrclibId) ||
     v.lrclibId<1 || v.synced!==true)fail.push("Indice karaoke non valido: "+key);
}
if(missingSpotify.length)fail.push("Copertine Spotify mancanti: "+missingSpotify.slice(0,10).join(", "));
console.log(JSON.stringify({version:version.versione,total:songs.length,
  profiles:counts,spotifyIDs:Object.keys(spotify).length,
  genericCovers:Object.keys(generic).length,karaokeIndexed:Object.keys(karaoke).length,
  missingLocalCoverPaths:brokenCoverPaths,
  errors:fail},null,2));
if(fail.length)process.exitCode=1;
