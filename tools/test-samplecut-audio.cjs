#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {downloadFromSamplecut,safeUrl,MAX_BYTES}=require("./samplecut-audio-fallback.cjs");
const previous=global.fetch,dir=fs.mkdtempSync(path.join(os.tmpdir(),"mb-samplecut-"));
const dest=path.join(dir,"test.mp3"),signed="https://api.samplecut.app/d/12345678-1234-1234-1234-123456789abc";
function json(obj,status=201){return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json"}})}
const ok={download_url:signed,format:"mp3",full:true,track_duration_sec:20,title:"Test verified"};
async function main(){
  assert.equal(safeUrl(signed),signed);
  for(const url of ["http://api.samplecut.app/d/abc","https://evil.test/d/abc",
    "https://api.samplecut.app.evil.test/d/abc",
    "https://api.samplecut.app@evil.test/d/abc","https://api.samplecut.app/evil/abc"])
    assert.throws(()=>safeUrl(url));
  let calls=[];
  global.fetch=async (url,opts)=>{
    calls.push({url:String(url),opts});
    if(String(url).includes("/v1/downloads"))return json(ok);
    if(String(url)===signed)return new Response(Buffer.alloc(1024,42),{
      status:200,headers:{"content-type":"audio/mpeg","content-length":"1024"}});
    throw Error("Unexpected URL");
  };
  const done=await downloadFromSamplecut("0j_Dzxqhs6k",dest);
  assert.equal(done.bytes,1024);
  assert.equal(done.title,"Test verified");
  assert.equal(fs.statSync(dest).size,1024);
  assert.equal(calls.length,2);
  assert.equal(calls[0].opts.method,"POST");
  assert.equal(JSON.parse(calls[0].opts.body).url,"https://www.youtube.com/watch?v=0j_Dzxqhs6k");
  assert.equal(calls[1].opts.redirect,"error");
  fs.rmSync(dest);
  calls=[];
  global.fetch=async ()=>json({error:{code:"rate_limited",message:"Wait"}},429);
  await assert.rejects(downloadFromSamplecut("0j_Dzxqhs6k",dest),/rate_limited/);
  assert.equal(fs.existsSync(dest),false);
  global.fetch=async (url)=>{
    if(String(url).includes("/v1/downloads"))return json({...ok,download_url:"https://evil.test/d/hacked"});
    throw Error("Should never fetch another host");
  };
  await assert.rejects(downloadFromSamplecut("0j_Dzxqhs6k",dest),/non attendibile/);
  assert.equal(fs.existsSync(dest),false);
  global.fetch=async url=>String(url).includes("/v1/downloads")?json(ok):
    new Response(Buffer.alloc(1000),{status:200,headers:{"content-type":"audio/mpeg","content-length":String(MAX_BYTES+1)}});
  await assert.rejects(downloadFromSamplecut("0j_Dzxqhs6k",dest),/24 MB/);
  assert.equal(fs.existsSync(dest),false);
  await assert.rejects(downloadFromSamplecut("bad",dest),/ID YouTube/);
  console.log("OK: API gratuita Samplecut, HTTPS solo dominio ufficiale, rate limit, no SSRF, limite 24MB, pulizia errori");
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{
  global.fetch=previous;fs.rmSync(dir,{recursive:true,force:true});
});
