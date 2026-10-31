#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const resolver=require("./resolve-licensed-audio.cjs");

assert.deepEqual(resolver.parseArtistTitle("Artist - New Song (Official Audio)","Artist"),{artist:"artist",title:"new song"});
assert.equal(resolver.parseArtistTitle("Artist - New Song","A different singer"),null);
assert.equal(resolver.parseArtistTitle("Just a song",""),null);
assert.equal(resolver.isCC0("https://creativecommons.org/publicdomain/zero/1.0/"),true);
assert.equal(resolver.isCC0("https://creativecommons.org/licenses/by/4.0/"),false);
const licensed={metadata:{creator:"Artist",title:"New Song",licenseurl:"https://creativecommons.org/publicdomain/zero/1.0/",mediatype:"audio"},files:[{source:"original",name:"song.mp3",size:"2500"}]};
assert.ok(resolver.isSameRecordingCandidate(licensed,{artist:"artist",title:"new song"}));
assert.equal(resolver.isSameRecordingCandidate({...licensed,metadata:{...licensed.metadata,creator:"Wrong artist"}},{artist:"artist",title:"new song"}),null);
assert.equal(resolver.isSameRecordingCandidate({...licensed,metadata:{...licensed.metadata,licenseurl:""}},{artist:"artist",title:"new song"}),null);
assert.equal(resolver.isSameRecordingCandidate({...licensed,files:[...licensed.files,{source:"original",name:"another.mp3",size:"5000"}]},{artist:"artist",title:"new song"}),null);

const previous=global.fetch;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"mb-cc0-test-"));
const target=path.join(tmp,"audio.mp3");
function asJSON(value){return new Response(JSON.stringify(value),{status:200,headers:{"content-type":"application/json"}})}
let visited=[];
global.fetch=async (url)=>{
  const link=String(url);visited.push(link);
  if(link.includes("youtube.com/oembed"))return asJSON({title:"Artist - New Song (Official Audio)",author_name:"Artist"});
  if(link.includes("advancedsearch.php"))return asJSON({response:{docs:[{identifier:"verified-record"}]}});
  if(link.includes("/metadata/verified-record"))return asJSON(licensed);
  if(link.includes("/download/verified-record/song.mp3")){
    const response=new Response(Buffer.alloc(3000,1),{status:200,headers:{"content-length":"3000","content-type":"audio/mpeg"}});
    Object.defineProperty(response,"url",{value:link});
    return response;
  }
  throw Error("Unexpected URL "+link);
};
(async()=>{
  const result=await resolver.resolveLicensedAudio({videoId:"75qIYkMUGVE",requestedTitle:"",file:target});
  assert.ok(result,"CC0 track should be accepted");
  assert.equal(result.license,"CC0-1.0");
  assert.equal(fs.statSync(target).size,3000);
  assert.ok(visited.some(url=>url.includes("advancedsearch.php")));
  fs.rmSync(target);
  const noRights={...licensed,metadata:{...licensed.metadata,licenseurl:"https://creativecommons.org/licenses/by-nc-nd/4.0/"}};
  global.fetch=async url=>{
    const link=String(url);
    if(link.includes("youtube.com/oembed"))return asJSON({title:"Artist - New Song",author_name:"Artist"});
    if(link.includes("advancedsearch.php"))return asJSON({response:{docs:[{identifier:"verified-record"}]}});
    if(link.includes("/metadata/verified-record"))return asJSON(noRights);
    throw Error("Unexpected download for non-CC0 file");
  };
  const rejected=await resolver.resolveLicensedAudio({videoId:"75qIYkMUGVE",requestedTitle:"",file:target});
  assert.equal(rejected,null);
  assert.equal(fs.existsSync(target),false);
  console.log("OK: exact audio, CC0 license, missing license, album, invalid artist, no download of unlicensed file.");
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{
  global.fetch=previous;
  fs.rmSync(tmp,{recursive:true,force:true});
});