#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const path=require("node:path");
const fs=require("node:fs");
const port=43000+Math.floor(Math.random()*10000);
const root=path.resolve(__dirname,"..");
const server=spawn(process.execPath,[path.join(__dirname,"serve-private-musicbox.cjs"),root,String(port)],
 {stdio:["ignore","pipe","pipe"]});
let err="";
server.stderr.on("data",d=>{err+=String(d)});
const base="http://127.0.0.1:"+port+"/";
const sleep=n=>new Promise(r=>setTimeout(r,n));
async function main(){
  try{
    let ready=false;
    for(let i=0;i<50;i++){
      if(server.exitCode!==null)throw Error("Server terminated early: "+err);
      try {const r=await fetch(base+"index.html");if(r.ok){ready=true;break}} catch(e){}
      await sleep(120);
    }
    assert.ok(ready,"Local private server did not start: "+err);
    const html=await fetch(base+"index.html");
    assert.equal(html.status,200);
    assert.match(html.headers.get("content-type")||"","text/html");
    const song=fs.statSync(path.join(root,"silenzio.mp3"));
    assert.ok(song.size>50);
    const audio=await fetch(base+"silenzio.mp3",{headers:{Range:"bytes=0-15"}});
    assert.equal(audio.status,206);
    assert.equal(audio.headers.get("content-range"),"bytes 0-15/"+song.size);
    assert.equal((await audio.arrayBuffer()).byteLength,16);
    const head=await fetch(base+"silenzio.mp3",{method:"HEAD"});
    assert.equal(head.status,200);
    assert.equal(head.headers.get("content-length"),String(song.size));
    const missing=await fetch(base+"songs/__this-file-does-not-exist.mp3");
    assert.equal(missing.status,404);
    const privateFile=await fetch(base+".gitignore");
    assert.equal(privateFile.status,403);
    console.log("Private audio server: HTML, MP3 byte ranges, HEAD, 404 and dotfile protection PASSED");
  } finally {server.kill()}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.kill()});
