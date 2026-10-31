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

/* Stop on rate limits, never sleep for hours or mark a throttled track as missing. */
async function fetchJSON(url) {
  let lastError="";
  for (let attempt=0;attempt<3;attempt++) {
    try {
      const r=await fetch(url,{
        headers:{"User-Agent":"MusicBox-karaoke-index/2.2 (https://github.com/stefanovillaggio8-dot/music-box)",
          "Lrclib-Client":"MusicBox/6.432 (https://github.com/stefanovillaggio8-dot/music-box)"},
        signal:AbortSignal.timeout(10000)
      });
      /* LRCLIB documents 503 as temporary ServerOverloaded, not a
         permanent absence of lyrics. Respect Retry-After and retry briefly.
         Never retry 429 without its full rate-limit cooldown. */
      if(r.status===503){
        const waitSeconds=Math.min(8,Math.max(1,Number(r.headers.get("Retry-After"))||2));
        lastError="HTTP 503 overloaded, Retry-After "+waitSeconds+"s";
        if(attempt<2){await sleep(waitSeconds*1000);continue;}
        return {blocked:true,reason:lastError,items:[]};
      }
      if(r.status===429) {
        const after=Math.max(1,Number(r.headers.get("Retry-After"))||60);
        return {blocked:true,reason:"HTTP 429 rate limited; retry after "+after+"s",items:[]};
      }
      if(r.status===403||r.status>=500) return {blocked:true,reason:"HTTP "+r.status,items:[]};
      if(!r.ok) return {blocked:false,reason:"HTTP "+r.status,items:[]};
      const j=await r.json();
      return {blocked:false,reason:"",items:Array.isArray(j)?j:[j]};
    } catch(e) {
      lastError=String(e && e.message || e).slice(0,180);
      if(attempt<2)await sleep(1100*(attempt+1));
    }
  }
  return {blocked:true,reason:"network: "+lastError,items:[]};
}

async function main(){
  const app=await fs.readFile("app.js","utf8"),p="const BUILTIN = [";
  const start=app.indexOf(p),end=app.indexOf("];",start);
  if(start<0||end<start)throw Error("Catalogo non trovato");
  const catalog=vm.runInNewContext("["+app.slice(start+p.length,end)+"]",{}, {timeout:5000});
  if(catalog.length<1072)throw Error("Catalogo incompleto: "+catalog.length);
  const known=JSON.parse(await fs.readFile("lyrics.json","utf8"));
  const indexFile="karaoke-index.json";
  let index={};
  try{index=JSON.parse(await fs.readFile(indexFile,"utf8"));}
  catch(e){if(e.code!=="ENOENT")throw e;}

  /* A bounded, resumable scan: a GitHub job never needs to process
     every song in a single execution. Remember verified misses separately. */
  const stateFile="karaoke-scan-state.json";
  let checked={};
  try { checked=JSON.parse(await fs.readFile(stateFile,"utf8")); }
  catch(e) { if(e.code!=="ENOENT")throw e; }
  const list=catalog.map(t=>({
    ...t,stableId:"b-"+String(t.file).replace(/^.*\//,"").replace(/\.mp3$/i,"")
  })).sort((a,b)=>Number(b.profile==="Emanuele")-Number(a.profile==="Emanuele"));
  const started=Date.now(), limit=Math.max(1,Math.min(100,Number(process.env.MAX_KARAOKE_LOOKUP)||80));
  const maxRuntime=7*60*1000;
  const staleMs=6*24*60*60*1000;
  let attempted=0,found=0,missed=0,already=0,existing=0,throttled=false,blockReason="";
  for(const t of list) {
    if(attempted>=limit || Date.now()-started>maxRuntime)break;
    const id=t.stableId;
    if(known[id]?.synced){existing++;continue;}
    if(index[id]?.lrclibId){already++;continue;}
    if(!t.title || !t.artist)continue;
    if(checked[id] && Date.now()-Date.parse(checked[id])<staleMs)continue;
    const title=cleanTitle(t.title), artist=mainArtist(t.artist);
    const search="https://lrclib.net/api/search?track_name="+encodeURIComponent(title)+
      "&artist_name="+encodeURIComponent(artist);
    let response=await fetchJSON(search);
    if(response.blocked){throttled=true;blockReason=response.reason;break;}
    let candidates=response.items;
    if(!candidates.length){
      response=await fetchJSON("https://lrclib.net/api/search?q="+encodeURIComponent(title+" "+artist));
      if(response.blocked){throttled=true;break;}
      candidates=response.items;
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
    attempted++;
    checked[id]=new Date().toISOString();
    if(selected) {
      index[id]={lrclibId:selected.id,synced:true,duration:selected.duration||null,
        source:"LRCLIB",indexedAt:new Date().toISOString().slice(0,10)};
      delete checked[id];
      found++;
    } else missed++;
    if(attempted%10===0)console.log(JSON.stringify({attempted,found,missed,throttled}));
    await sleep(400);
  }
  await fs.writeFile(indexFile,JSON.stringify(Object.fromEntries(Object.entries(index).sort()),null,2)+"\n");
  await fs.writeFile(stateFile,JSON.stringify(Object.fromEntries(Object.entries(checked).sort()),null,2)+"\n");
  console.log(JSON.stringify({total:catalog.length,attempted,found,missed,already,existing,throttled,blockReason,
    indexed:Object.keys(index).length,checked:Object.keys(checked).length},null,2));

}
main().catch(e=>{console.error(e);process.exitCode=1;});
