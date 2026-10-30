#!/usr/bin/env node
"use strict";
/**
 * Audit karaoke Music Box: risolve gli ID LRCLIB dei brani non sincronizzati.
 * Salva SOLAMENTE identificatori e metadati, mai parole o testi delle canzoni.
 * L'app recupera i contenuti dal servizio per l'ascolto dell'utente.
 */
const fs = require("node:fs/promises");
const vm = require("node:vm");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const normalize = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/\([^)]*\b(?:feat|ft|visual|official|audio)\b[^)]*\)/g, " ")
  .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
function mainArtist(a) {
  return String(a || "").split(/,|&|\/|\s+feat\.?\s+|\s+ft\.?\s+|\s+x\s+/i)[0].trim();
}
function cleanTitle(v) {
  return String(v || "").replace(/\s*\((?:feat|ft)\.?\s+[^)]*\)/gi, "")
    .replace(/\s*-\s*(?:official|audio|visualizer)\s*(?:video|audio)?/gi, "").trim();
}
function sameTitle(want, got) {
  let x=normalize(cleanTitle(want)), y=normalize(cleanTitle(got));
  if(!x||!y) return false;
  if(x===y) return true;
  const a=x.split(" "),b=y.split(" ");
  if(a.length>=3&&b.length>=3){
    const common=a.filter(v=>b.includes(v)).length;
    return common/Math.max(a.length,b.length)>=0.88;
  }
  return false;
}
function sameArtist(want, got){
  const a=normalize(mainArtist(want)),b=normalize(mainArtist(got));
  return !!a&&!!b&&(a===b||b.startsWith(a+" ")||a.startsWith(b+" "));
}
const fetchJSON=async(url)=>{
  for(let i=0;i<3;i++){
    try {
      const r=await fetch(url,{headers:{"User-Agent":"MusicBox-karaoke-index/1.0 (github.com/stefanovillaggio8-dot/music-box)"},
        signal:AbortSignal.timeout(14000)});
      if(r.status===429||r.status===503){await sleep(Math.min(15000,3000*(i+1)));continue;}
      if(!r.ok) return [];
      const j=await r.json();
      return Array.isArray(j)?j:[j];
    }catch(e){if(i<2)await sleep((i+1)*900);}
  }
  return [];
};
async function main(){
  const app=await fs.readFile("app.js","utf8"),p="const BUILTIN = [";
  const start=app.indexOf(p),end=app.indexOf("];",start);
  if(start<0||end<start)throw Error("Catalogo non trovato");
  const catalog=vm.runInNewContext("["+app.slice(start+p.length,end)+"]",{}, {timeout:5000});
  if(catalog.length!==1072)throw Error("Numero brani cambiato: "+catalog.length);
  const known=JSON.parse(await fs.readFile("lyrics.json","utf8"));
  const indexFile="karaoke-index.json";
  let index={};
  try{index=JSON.parse(await fs.readFile(indexFile,"utf8"));}
  catch(e){if(e.code!=="ENOENT")throw e;}
  const playlist=catalog.map(t=>({
    ...t,
    stableId:"b-"+String(t.file).replace(/^.*\//,"").replace(/\.mp3$/i,"")
  })).sort((a,b)=>Number(b.profile==="Emanuele")-Number(a.profile==="Emanuele"));
  let attempted=0,found=0,missed=0,already=0,existing=0;
  const max=Number(process.env.MAX_KARAOKE_LOOKUP||1050);
  for(const t of playlist){
    if(attempted>=max)break;
    const id=t.stableId;
    if(known[id]?.synced){existing++;continue;}
    if(index[id]?.lrclibId){already++;continue;}
    if(!t.title||!t.artist)continue;
    attempted++;
    const title=cleanTitle(t.title), artist=mainArtist(t.artist);
    const search="https://lrclib.net/api/search?track_name="+encodeURIComponent(title)+
      "&artist_name="+encodeURIComponent(artist);
    let candidates=await fetchJSON(search);
    if(!candidates.length){
      const q="https://lrclib.net/api/search?q="+encodeURIComponent(title+" "+artist);
      candidates=await fetchJSON(q);
    }
    const duration=Number(t.spotifyDurationMs||0)/1000;
    const selected=candidates.filter(r=>{
      if(!Number.isSafeInteger(r.id)||r.id<1||!r.syncedLyrics||r.instrumental)return false;
      if(!sameTitle(title,r.trackName)||!sameArtist(artist,r.artistName))return false;
      const rows=String(r.syncedLyrics).match(/^\[\d{1,3}:\d{2}\.\d{1,3}\]/gm);
      if(!rows||rows.length<3)return false;
      if(duration>0&&Number(r.duration)>0&&Math.abs(duration-Number(r.duration))>15)return false;
      return true;
    }).sort((a,b)=>{
      const exactA=normalize(a.trackName)===normalize(title)?1:0;
      const exactB=normalize(b.trackName)===normalize(title)?1:0;
      if(exactA!==exactB)return exactB-exactA;
      return Math.abs((a.duration||0)-duration)-Math.abs((b.duration||0)-duration);
    })[0];
    if(selected){
      index[id]={lrclibId:selected.id,synced:true,duration:selected.duration||null,
        source:"LRCLIB",indexedAt:new Date().toISOString().slice(0,10)};
      found++;
    } else missed++;
    if(attempted%40===0)console.log(JSON.stringify({attempted,found,missed,already,existing}));
    await sleep(360);
  }
  await fs.writeFile(indexFile,JSON.stringify(Object.fromEntries(Object.entries(index).sort()),null,2)+"\n");
  console.log(JSON.stringify({total:catalog.length,attempted,found,missed,already,existing,indexed:Object.keys(index).length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
