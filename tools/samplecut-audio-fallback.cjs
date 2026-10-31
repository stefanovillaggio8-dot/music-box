#!/usr/bin/env node
"use strict";
// Samplecut free API: server-side only; no YouTube cookies, no iPhone storage.
// The caller must have confirmed appropriate content rights.
const fs=require("node:fs");
const path=require("node:path");
const API="https://api.samplecut.app/v1/downloads";
const MAX_BYTES=24*1024*1024;
function safeUrl(raw){
  const url=new URL(String(raw||""));
  if(url.protocol!=="https:"||url.hostname!=="api.samplecut.app"||
     url.port||url.username||url.password||!/^\/d\/[A-Za-z0-9-]+(?:\?.*)?$/.test(url.pathname+url.search))
     throw Error("Samplecut ha restituito un indirizzo audio non attendibile");
  return url.href;
}
async function downloadFromSamplecut(id,destination){
  if(!/^[A-Za-z0-9_-]{11}$/.test(String(id||"")))throw Error("ID YouTube non valido");
  if(!destination || !path.basename(destination).endsWith(".mp3"))throw Error("Percorso MP3 non valido");
  const response=await fetch(API,{
    method:"POST",
    headers:{"content-type":"application/json","x-client-name":"musicbox"},
    body:JSON.stringify({url:"https://www.youtube.com/watch?v="+id,format:"mp3",response:"url"}),
    signal:AbortSignal.timeout(125000),
    redirect:"error"
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    const code=String(data?.error?.code||"HTTP_"+response.status).slice(0,80);
    const message=String(data?.error?.message||"Servizio non disponibile").slice(0,140);
    throw Error("Samplecut "+code+": "+message);
  }
  if(response.status!==201)throw Error("Samplecut ha risposto senza confermare la creazione MP3");
  const url=safeUrl(data.download_url);
  if(data.format!=="mp3"||data.full!==true)throw Error("Samplecut non ha preparato un MP3 completo");
  if(Number(data.track_duration_sec)>12*60+1)throw Error("Samplecut: video troppo lungo");
  const track=await fetch(url,{method:"GET",redirect:"error",signal:AbortSignal.timeout(125000)});
  if(!track.ok||!track.body)throw Error("File MP3 Samplecut non disponibile: HTTP "+track.status);
  const declared=Number(track.headers.get("content-length")||0);
  if(declared>MAX_BYTES)throw Error("MP3 superiore a 24 MB");
  const mime=String(track.headers.get("content-type")||"").toLowerCase();
  if(!/(?:audio\/mpeg|audio\/mp3|application\/octet-stream)/.test(mime))
    throw Error("Samplecut non ha restituito contenuto audio");
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  let fd=null,total=0;
  try{
    fd=fs.openSync(destination,"wx");
    for await(const chunk of track.body){
      const b=Buffer.from(chunk);
      total+=b.length;
      if(total>MAX_BYTES)throw Error("MP3 superiore a 24 MB");
      fs.writeSync(fd,b);
    }
    fs.closeSync(fd);fd=null;
    if(total<512)throw Error("Risposta MP3 vuota o incompleta");
    return {bytes:total,title:String(data.title||"").slice(0,150)};
  }catch(err){
    if(fd!==null)fs.closeSync(fd);
    try{fs.rmSync(destination,{force:true});}catch(_){}
    throw err;
  }
}
module.exports={downloadFromSamplecut,safeUrl,MAX_BYTES};
