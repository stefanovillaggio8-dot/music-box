"use strict";
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const test=require("node:test");
const source=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");

function between(from,to) {
 const start=source.indexOf(from),end=source.indexOf(to,start+from.length);
 assert.ok(start>=0&&end>start,"missing production source boundary: "+from);
 return source.slice(start,end);
}

test("a shuffle cycle survives 4h 59m but resets after 5h inactivity",()=>{
 const saved={};
 let now=Date.UTC(2026,10,20,9,0,0);
 const LS={
   get:(k,fallback)=>saved[k]??fallback,
   set:(k,v)=>{saved[k]=JSON.parse(JSON.stringify(v));}
 };
 const fn=between("function _salvaCicloCasuale(){","function _casualeSegnaAscoltata(id){");
 function instance(currentId){
   const ctx={Math,Date:{now:()=>now},LS,profile:"Ste",currentId,
     _casualeChiaveAttiva:"",_casualeAscoltate:new Set(),
     _casualeFresche:null,_casualeUniverso:null,_casualeProgrammate:[],
     _casualeScelto:"",_casualeDa:"",_casualeSceltaDJ:"",
     _casualeFirma:"",_casualeEscluse:new Set(),_casualeModificaUtente:false,
     _casualeUltimoAscoltoAt:0,
     LIMITE_INATTIVITA_CASUALE:5*60*60*1000,
     _chiaveContestoCasuale:()=> "soloSte"
   };
   vm.createContext(ctx);
   vm.runInContext(fn,ctx);
   return ctx;
 }
 const tracks=[{id:"a",url:"a.mp3"},{id:"b",url:"b.mp3"}];
 const first=instance("a");first._preparaCicloCasuale(tracks);
 assert.equal(first._casualeAscoltate.has("a"),true);
 now+=4*60*60*1000+59*60*1000;
 const near=instance(null);near._preparaCicloCasuale(tracks);
 assert.equal(near._casualeAscoltate.has("a"),true);
 now+=60*1000;
 const expired=instance(null);expired._preparaCicloCasuale(tracks);
 assert.equal(expired._casualeAscoltate.has("a"),false);
 assert.equal(expired._casualeFresche.has("a"),true);
});

test("after 2 hours away no track remains selected",()=>{
 const snip=between('const precedente = LS.get("mb.playback." + profile, null);',
   "let lastTrack = idSalvato");
 const now=Date.UTC(2026,10,20,18,0,0);
 function check(away){
   const records={"mb.playback.Ste":{id:"song-a",time:135,quando:now-away}};
   const ctx={Date:{now:()=>now},LS:{
     get:(key,def)=>records[key]??def,
     set:(key,val)=>{records[key]=val;}
   },profile:"Ste",st:{last:"song-a",time:135,quando:now-away},
     LIMITE_RIPRESA_SESSIONE:2*60*60*1000,
     currentId:"song-a",resumeAt:135,_ripresaAvvioCheckpoint:null,
     _pausaCheckpoint:null,_vuoleSuonare:true,_pausaEsplicita:false,
     _segnaIntenzioneSono:()=>{},
     updateProgressUI:()=>{}};
   vm.createContext(ctx);
   const result=vm.runInContext(snip+"\n({recent,idSalvato,currentId})",ctx);
   return result;
 }
 const before=check((2*60-1)*60*1000);
 assert.equal(before.idSalvato,"song-a");
 const boundary=check(2*60*60*1000);
 assert.equal(boundary.idSalvato,null);
 assert.equal(boundary.currentId,null);
 assert.equal(check(5*60*60*1000).idSalvato,null);
});

test("saved time is sought on actual decoder rather than only drawn in UI",()=>{
 const snip=between("function _verificaRipresaAvvio() {","function savePos() {");
 const now=Date.UTC(2026,10,20,20,0,0);
 const cp={id:"song-a",target:135,attempts:0,lastTry:0,firstTry:0,progressObserved:false};
 const ctx={Date:{now:()=>now},console,
   currentId:"song-a",
   audio:{currentTime:0,duration:200,readyState:4,seeking:false,paused:true},
   _ripresaAvvioCheckpoint:cp,resumeAt:135};
 vm.createContext(ctx);vm.runInContext(snip,ctx);
 ctx._verificaRipresaAvvio();
 assert.equal(ctx.audio.currentTime,135);
 assert.equal(ctx.resumeAt,135,"do not falsely confirm initial seek");
 cp.progressObserved=true;ctx.audio.paused=false;
 assert.equal(ctx._verificaRipresaAvvio(),true);
 assert.equal(ctx.resumeAt,0);
 assert.equal(ctx._ripresaAvvioCheckpoint,null);
});
