#!/usr/bin/env node
"use strict";
// Metadata-only discovery. Never downloads, caches or republishes a video.
// An Apple listing proves catalogue availability, NOT a background-use right.
// Archive hits are candidates for manual provenance review, never playback URLs.
const fs=require("node:fs"),vm=require("node:vm");
const {publishedCatalog}=require("./published-personal-catalog.cjs");
const read=f=>fs.readFileSync(f,"utf8");
const app=read("app.js"),state=JSON.parse(read("stato.json")),playlists=JSON.parse(read("playlist.json"));
const a=app.indexOf("const BUILTIN = ["),b=app.indexOf("];",a);
if(a<0||b<a)throw Error("Missing catalog");
const builtin=vm.runInNewContext(app.slice(a,b+2)+";BUILTIN");
const catalog=publishedCatalog(app,builtin,JSON.parse(read("online-imports.json")));
const i=app.indexOf("function _idBranoStabile("),j=app.indexOf("// Queste funzioni",i);
const stableId=new Function("BUILTIN",app.slice(i,j)+"return _idBranoStabile;")(catalog);
const copies=new Set(state.miei?.Ste||[]),deleted=new Set(state.eliminati||[]);
const stePlaylists=playlists.filter(p=>p.nascostaDa==="Ste");
const isGym=p=>String(p.name||"").trim().toLowerCase()==="gym";
const gymPlaylists=stePlaylists.filter(isGym);
const gym=new Set(gymPlaylists.flatMap(p=>p.tracks||[]));
const hiddenGym=new Set(gymPlaylists.filter(p=>p.nascosta===true).flatMap(p=>p.tracks||[]));
const otherPlaylists=new Set(stePlaylists.filter(p=>!isGym(p)).flatMap(p=>p.tracks||[]));
const playlistOnly=new Set((state.soloInPlaylist||[]).filter(x=>x.startsWith("Ste.")).map(x=>x.slice(4)));
const excludedGym=new Set();
const tracks=new Map();
for(const t of catalog){
 const id=stableId(t);
 const personal=(t.profile||"Ste")==="Ste"||copies.has(id);
 if(deleted.has("Ste."+id)||deleted.has(id)||tracks.has(id))continue;
 if(gym.has(id)&&!otherPlaylists.has(id)&&(!personal||hiddenGym.has(id)||playlistOnly.has(id))){
  excludedGym.add(id);
  continue;
 }
 if(personal||otherPlaylists.has(id))tracks.set(id,{id,title:String(t.title||""),artist:String(t.artist||"")});
}
const normalize=s=>String(s||"").normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const titleKey=s=>normalize(String(s||"").replace(/\s*\((?:official (?:music )?video|visual(?: video)?|music video)\)\s*$/i,"").replace(/\s*-\s*(?:official (?:music )?video|visual(?: video)?|music video)\s*$/i,""));
const mainArtist=s=>normalize(String(s||"").split(/\s*(?:,| & | \/ | feat\.? | ft\.? )\s*/i)[0]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function json(url){
 const res=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{"Accept":"application/json","User-Agent":"MusicBox metadata audit/1.0"}});
 if(!res.ok)throw Error("HTTP "+res.status);
 return res.json();
}
function appleMatch(x,t){
 return x.kind==="music-video"&&titleKey(x.trackName)===titleKey(t.title)&&
 (normalize(x.artistName)===normalize(t.artist)||mainArtist(x.artistName)===mainArtist(t.artist));
}
function archiveMatch(x,t){
 const creators=Array.isArray(x.creator)?x.creator:[x.creator];
 const licenses=Array.isArray(x.licenseurl)?x.licenseurl:[x.licenseurl];
 return creators.some(c=>normalize(c)===normalize(t.artist))&&titleKey(x.title)===titleKey(t.title)&&
 licenses.some(v=>/^https?:\/\/creativecommons\.org\/(?:publicdomain\/zero\/1\.0|licenses\/by\/4\.0)\/?$/i.test(String(v||"")));
}
function quote(s){return '"'+String(s).replace(/["\\]/g," ").slice(0,180)+'"'}
async function scan(t){
 const result={...t,apple:"not_checked",archive:"not_checked",usableBackground:false};
 if(!t.title||!t.artist||t.title.length>180||t.artist.length>180){result.apple=result.archive="invalid_metadata";return result}
 const apple=new URL("https://itunes.apple.com/search");
 for(const [k,v] of Object.entries({term:t.artist+" "+t.title,country:"IT",media:"musicVideo",entity:"musicVideo",limit:"20"}))apple.searchParams.set(k,v);
 try{
  const j=await json(apple);
  if(!Array.isArray(j.results))throw Error("unexpected catalogue response");
  const hits=j.results.filter(x=>appleMatch(x,t));
  result.apple=hits.length?"catalogue_match_restricted":"no_exact_match";
  result.appleMatches=hits.map(x=>({trackId:x.trackId,trackName:x.trackName,artistName:x.artistName,trackTimeMillis:x.trackTimeMillis})).slice(0,5);
 }catch(e){result.apple="lookup_error";result.appleError=String(e.message).slice(0,100)}
 const arc=new URL("https://archive.org/advancedsearch.php");
 arc.searchParams.set("q","mediatype:movies AND creator:"+quote(t.artist)+" AND title:"+quote(t.title)+" AND (licenseurl:*creativecommons.org*)");
 for(const v of ["identifier","title","creator","licenseurl"])arc.searchParams.append("fl[]",v);
 arc.searchParams.set("output","json");arc.searchParams.set("rows","20");
 try{
  const j=await json(arc);
  if(!Array.isArray(j.response?.docs))throw Error("unexpected archive response");
  const hits=j.response.docs.filter(x=>archiveMatch(x,t));
  result.archive=hits.length?"license_claim_needs_rightsholder_review":"no_exact_license_claim";
  result.archiveCandidates=hits.map(x=>({identifier:x.identifier,title:x.title,creator:x.creator,licenseurl:x.licenseurl})).slice(0,5);
 }catch(e){result.archive="lookup_error";result.archiveError=String(e.message).slice(0,100)}
 return result;
}
(async()=>{
 const output=process.argv[2]||"ste-video-discovery.json";
 if(fs.existsSync(output))throw Error("Refusing to overwrite evidence");
 const report={profile:"Ste",scope:"Published personal catalogue plus Ste playlists other than Gym; excludes Gym-only and deleted entries. Unpublished device-only songs are outside the available data.",
 sources:{apple:"https://performance-partners.apple.com/search-api",archive:"https://archive.org/advancedsearch.php"},
 notes:"No preview URLs or media bytes requested. Catalogue match is not a playback licence. Archive self-reported claims require rights-holder proof, a full recording, matching version and audiovisual alignment. Nothing is automatically enabled.",
 catalogCount:tracks.size,gymOnlyExcluded:excludedGym.size,rows:[]};
 const checkpoint=()=>fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");
 if(process.argv.includes("--scope-only")){
  report.rows=[...tracks.values()];checkpoint();
  console.log(JSON.stringify({catalogCount:tracks.size,gymOnlyExcluded:excludedGym.size}));
  return;
 }
 const cache=new Map();
 for(const t of tracks.values()){
  const key=JSON.stringify([titleKey(t.title),normalize(t.artist)]);
  let hit=cache.get(key);
  if(!hit){hit=await scan(t);cache.set(key,hit);await sleep(3400)}
  report.rows.push({...hit,id:t.id,title:t.title,artist:t.artist});
  if(report.rows.length%10===0){checkpoint();console.log("Scanned "+report.rows.length+"/"+tracks.size)}
 }
 report.summary={scanned:report.rows.length,catalogueMatches:report.rows.filter(x=>x.apple==="catalogue_match_restricted").length,
 licenseClaims:report.rows.filter(x=>x.archive==="license_claim_needs_rightsholder_review").length,
 appleErrors:report.rows.filter(x=>x.apple==="lookup_error").length,
 archiveErrors:report.rows.filter(x=>x.archive==="lookup_error").length,usableBackgrounds:0};
 checkpoint();console.log(JSON.stringify(report.summary));
})().catch(e=>{console.error(e);process.exitCode=1});
