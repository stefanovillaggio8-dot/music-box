#!/usr/bin/env node
"use strict";
/*
 * Music Box: ricerca alternativa di audio autonomamente pubblicati sotto CC0.
 * Non legge o scarica gli stream audiovisivi di YouTube.
 * Match severo su artista, brano, licenza e singolo file MP3.
 * Un archivio senza licenza verificabile non e' una sorgente valida.
 */
const fs=require("node:fs");
const MAX_BYTES=24*1024*1024;
function norm(v){
  return String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
function clipTitle(s){
  return String(s||"")
    .replace(/\s*[\[(](?:official\s*)?(?:music\s*)?(?:video|audio|lyrics?|lyric\s*video|visualizer|hq|hd|4k)[\])]/ig," ")
    .replace(/\s*[-|]\s*(?:official\s*)?(?:music\s*)?(?:video|audio|lyrics?|visualizer)\s*$/ig," ")
    .trim();
}
function parseArtistTitle(name,author){
  const t=clipTitle(name);
  const split=t.match(/^(.{2,80}?)\s+[-–—]\s+(.{2,110})$/);
  if(!split)return null;
  const artist=norm(split[1]);
  const title=norm(split[2]);
  const authorNorm=norm(author).replace(/(?:\s*vevo|\s*official)$/,"").trim();
  if(!artist||!title||artist===title)return null;
  // I metadati YouTube sono un aiuto, non una prova di titolarita'.
  if(authorNorm && authorNorm.length>=5 &&
     artist!==authorNorm && !authorNorm.includes(artist) && !artist.includes(authorNorm)){
    return null;
  }
  return {artist,title};
}
function isCC0(value) {
  const licenses=Array.isArray(value)?value:[value];
  return licenses.some(u=>/^https?:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/i.test(String(u||"").trim()));
}
function isSameRecordingCandidate(info,requested){
  if(!info||!info.metadata)return null;
  const m=info.metadata;
  if(!isCC0(m.licenseurl))return null;
  if(norm(m.creator)!==requested.artist)return null;
  const title=norm(m.title);
  if(title!==requested.title && title!==requested.artist+" "+requested.title)return null;
  const originals=(Array.isArray(info.files)?info.files:[]).filter(f=>
    f && f.source==="original" && typeof f.name==="string" &&
    /\.mp3$/i.test(f.name) && Number(f.size)>0 && Number(f.size)<=MAX_BYTES &&
    !f.name.includes(".."));
  // Niente raccolte, live-set o album: non sostituire mai un brano casuale.
  if(originals.length!==1)return null;
  return originals[0];
}
async function jsonAt(url,ms=6500){
  const response=await fetch(url,{headers:{"user-agent":"MusicBox/1.0 (CC0 audio discovery)","accept":"application/json"},signal:AbortSignal.timeout(ms)});
  if(!response.ok)throw Error("Catalogo HTTP "+response.status);
  return response.json();
}
async function downloadLimited(url,target){
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error("Download audio HTTP "+response.status);
  const final=new URL(response.url);
  if(final.protocol!=="https:"||
      !(/(^|\.)archive\.org$/i.test(final.hostname))) {
    throw Error("Archivio ha reindirizzato a un host inatteso");
  }
  const expected=Number(response.headers.get("content-length")||0);
  if(expected>MAX_BYTES)throw Error("File audio troppo grande");
  if(!response.body)throw Error("Risposta archivio senza file");
  const reader=response.body.getReader(),chunks=[];
  let count=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      count+=value.byteLength;
      if(count>MAX_BYTES)throw Error("Limite dimensione audio");
      chunks.push(Buffer.from(value));
    }
    if(count<2048)throw Error("Audio troppo piccolo");
    fs.writeFileSync(target,Buffer.concat(chunks));
  }finally{try{reader.releaseLock();}catch(_){}}
}
async function resolveLicensedAudio({videoId,requestedTitle,file}) {
  if(!/^[A-Za-z0-9_-]{11}$/.test(String(videoId||"")))return null;
  let name=String(requestedTitle||"").trim(),author="";
  // Se un nome non include esplicitamente artista e titolo, usa solo
  // metadati pubblici oEmbed, senza accedere agli stream del video.
  if(!parseArtistTitle(name,"")){
    try {
      const u="https://www.youtube.com/oembed?format=json&url="+
        encodeURIComponent("https://www.youtube.com/watch?v="+videoId);
      const meta=await jsonAt(u,5000);
      name=String(meta.title||"");author=String(meta.author_name||"");
    }catch(_){return null;}
  }
  const match=parseArtistTitle(name,author);
  if(!match)return null;
  const cleanSong=match.title.replace(/["\\]/g," ").slice(0,80);
  const q='mediatype:audio AND title:"'+cleanSong+'"';
  const search=new URL("https://archive.org/advancedsearch.php");
  search.searchParams.set("q",q);
  search.searchParams.set("rows","12");
  search.searchParams.set("output","json");
  for(const field of ["identifier","title","creator"])search.searchParams.append("fl[]",field);
  let records=[];
  try{
    const results=await jsonAt(search.toString(),9000);
    records=results&&results.response&&Array.isArray(results.response.docs)?
      results.response.docs:[];
  }catch(_){return null;}
  for(const record of records.slice(0,12)){
    const id=String(record.identifier||"");
    if(!/^[a-zA-Z0-9_.-]{2,120}$/.test(id))continue;
    try {
      const item=await jsonAt("https://archive.org/metadata/"+encodeURIComponent(id),7000);
      const audio=isSameRecordingCandidate(item,match);
      if(!audio)continue;
      const path=audio.name.split("/").map(encodeURIComponent).join("/");
      await downloadLimited("https://archive.org/download/"+encodeURIComponent(id)+"/"+path,file);
      return {
        source:"Internet Archive",
        sourceUrl:"https://archive.org/details/"+encodeURIComponent(id),
        license:"CC0-1.0",
        title:String(item.metadata.title||name).slice(0,160),
        artist:String(item.metadata.creator||"").slice(0,130)
      };
    }catch(e){
      try {if(fs.existsSync(file))fs.rmSync(file);}catch(_){}
    }
  }
  return null;
}
module.exports={norm,parseArtistTitle,isCC0,isSameRecordingCandidate,resolveLicensedAudio};