#!/usr/bin/env node
"use strict";
/* Music Box: alternate self-hosted Cobalt converter running only inside the
 * same GitHub Actions job. Content must be authorized by the submitter.
 * No public conversion API, browser iframe, credentials or proxy scraping.
 */
const fs=require("node:fs");
const {Readable,Transform}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const API="http://127.0.0.1:9000/";
const MAX_BYTES=24*1024*1024;
function requireLocalTunnel(uri){
  let u;
  try{u=new URL(uri)}catch{throw Error("Cobalt non ha restituito un URL valido");}
  if(u.protocol!=="http:"||u.hostname!=="127.0.0.1"||u.port!=="9000"||
     !u.pathname.startsWith("/tunnel"))
    throw Error("Il convertitore ha restituito un indirizzo non locale: non lo seguo");
  return u.href;
}
async function fetchMP3(videoId,outfile){
  if(!/^[A-Za-z0-9_-]{11}$/.test(videoId))throw Error("ID YouTube non valido");
  const response=await fetch(API,{
    method:"POST",
    headers:{"Accept":"application/json","Content-Type":"application/json"},
    body:JSON.stringify({url:"https://www.youtube.com/watch?v="+videoId,
      downloadMode:"audio",audioFormat:"mp3",audioBitrate:"128",alwaysProxy:true,
      localProcessing:"disabled"}),
    signal:AbortSignal.timeout(50000)
  });
  if(!response.ok)throw Error("Cobalt HTTP "+response.status);
  const result=await response.json();
  if(!result||result.status!=="tunnel"){
    const code=String(result?.error?.code||result?.status||"unknown").slice(0,130);
    throw Error("Cobalt non ha restituito un MP3: "+code);
  }
  const url=requireLocalTunnel(result.url);
  const stream=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(115000)});
  if(!stream.ok || stream.status!==200 || !stream.body)
    throw Error("Cobalt non ha inviato il file MP3 (HTTP "+stream.status+")");
  const contentLength=Number(stream.headers.get("content-length")||0);
  if(contentLength>MAX_BYTES)throw Error("MP3 troppo grande");
  const dest=outfile+".partial";
  let bytes=0;
  try{
    const gate=new Transform({
      transform(chunk,encoding,callback) {
        bytes+=chunk.length;
        if(bytes>MAX_BYTES)callback(new Error("MP3 oltre 24 MB"));
        else callback(null,chunk);
      }
    });
    await pipeline(Readable.fromWeb(stream.body),gate,fs.createWriteStream(dest,{flags:"wx"}));
    if(bytes<2048)throw Error("Nessun audio ricevuto");
    fs.renameSync(dest,outfile);
    return {bytes,format:"mp3",source:"Cobalt (self-hosted)"};
  }catch(e){
    try{fs.rmSync(dest,{force:true});}catch(_){}
    throw e;
  }
}
module.exports={requireLocalTunnel,fetchMP3};
if(require.main===module){
  const id=process.argv[2],outfile=process.argv[3];
  fetchMP3(id,outfile).then(r=>console.log("Cobalt MP3 ricevuto:",r.bytes,"byte"))
    .catch(e=>{console.error("Cobalt MP3 non disponibile:",String(e.message||e));process.exitCode=1});
}
