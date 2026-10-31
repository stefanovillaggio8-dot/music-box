#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {fetchMP3,requireLocalTunnel}=require("./cobalt-audio-fallback.cjs");
assert.equal(requireLocalTunnel("http://127.0.0.1:9000/tunnel?id=ok"),"http://127.0.0.1:9000/tunnel?id=ok");
for(const url of [
  "https://example.com/tunnel?id=1",
  "http://127.0.0.1:8999/tunnel?id=1",
  "http://localhost:9000/tunnel?id=1",
  "http://127.0.0.1:9000/not-tunnel",
  "file:///etc/passwd"
]){
  assert.throws(()=>requireLocalTunnel(url));
}
const old=global.fetch;
const folder=fs.mkdtempSync(path.join(os.tmpdir(),"musicbox-cobalt-test-"));
const filename=path.join(folder,"sample.mp3");
const id="75qIYkMUGVE";
function responseJSON(data){return new Response(JSON.stringify(data),{status:200,headers:{"content-type":"application/json"}})}
async function run(){
  let visited=[];
  global.fetch=async (url,opts)=>{
    visited.push(String(url));
    if(String(url)==="http://127.0.0.1:9000/"){
      assert.equal(opts.method,"POST");
      assert.equal(JSON.parse(opts.body).audioFormat,"mp3");
      assert.equal(JSON.parse(opts.body).alwaysProxy,true);
      return responseJSON({status:"tunnel",url:"http://127.0.0.1:9000/tunnel?id=123",filename:"sample.mp3"});
    }
    if(String(url).startsWith("http://127.0.0.1:9000/tunnel")){
      return new Response(Buffer.alloc(4000,1),{status:200,headers:{"content-type":"audio/mpeg","content-length":"4000"}});
    }
    throw Error("Unexpected external URL: "+url);
  };
  const file=await fetchMP3(id,filename);
  assert.equal(file.format,"mp3");
  assert.equal(file.bytes,4000);
  assert.equal(fs.statSync(filename).size,4000);
  assert.equal(visited.length,2);
  fs.rmSync(filename,{force:true});
  global.fetch=async()=>responseJSON({status:"redirect",url:"https://external.example/audio.mp3"});
  await assert.rejects(()=>fetchMP3(id,filename),/non ha restituito un MP3/);
  assert.equal(fs.existsSync(filename),false);
  global.fetch=async()=>responseJSON({status:"tunnel",url:"http://127.0.0.1:9000@evil.example/tunnel"});
  await assert.rejects(()=>fetchMP3(id,filename),/indirizzo non locale/);
  assert.equal(fs.existsSync(filename),false);
  global.fetch=async url=>{
    if(String(url)==="http://127.0.0.1:9000/")return responseJSON({status:"tunnel",url:"http://127.0.0.1:9000/tunnel"});
    return new Response(Buffer.alloc(0),{status:200,headers:{"content-length":"30000000"}});
  };
  await assert.rejects(()=>fetchMP3(id,filename),/troppo grande/);
  assert.equal(fs.existsSync(filename),false);
  console.log("OK: Cobalt MP3, endpoint privato, redirect negati, dimensioni limitate, nessun file orfano.");
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{
  global.fetch=old;
  fs.rmSync(folder,{recursive:true,force:true});
});