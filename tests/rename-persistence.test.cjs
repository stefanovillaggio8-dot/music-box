"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
function section(start,end){
 const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,"missing source: "+start);
 return app.slice(i,j);
}
test("cloud POST only acknowledges exact rename sent, never a newer second edit",()=>{
 const snippet=section("function _rinominiDaMandareSvuota(","/* Gli stessi due giochi");
 const data={};
 const LS={set:(key,value)=>{data[key]=structuredClone(value);}};
 const pending=()=>structuredClone(data.pending||{});
 const clean=new Function("LS","_rinominiDaMandare",snippet+"return _rinominiDaMandareSvuota;")(LS,pending);
 data.pending={song:{title:"Nome nuovo",artist:"Artista due"}};
 clean({song:{title:"Vecchio nome",artist:"Artista uno"}});
 assert.deepEqual(data["mb.rinominiDaMandare"],data.pending,
  "old network response cannot erase newer unsynced name");
 data.pending=data["mb.rinominiDaMandare"];
 clean({song:{title:"Nome nuovo",artist:"Artista due"}});
 assert.deepEqual(data["mb.rinominiDaMandare"],{});
});
test("disk recovery does not overwrite an existing more recent browser title",()=>{
 const body=section("async function _ripristinaRinomini()","/* La diagnostica.");
 assert.match(body,/if \(!mia \|\| \(!mia\.title && !mia\.artist\)\)/);
 assert.doesNotMatch(body,/mia\.title !== \(r\.title/);
});
test("IndexedDB renames are serialized and cloud updates are saved locally",()=>{
 const disk=section("let _rinominiDiskWrites=","async function _leggiRinomineDalDisco()");
 assert.match(disk,/_rinominiDiskWrites\.catch\(\(\)=>false\)\.then\(write\)/);
 assert.match(disk,/mappa: snapshot/);
 const cloud=section("if (j && j.rinomini && typeof j.rinomini === \"object\")","/* Ste: \"226 da entrambe");
 assert.match(cloud,/_salvaRinomineSulDisco\(mappa\)\.catch/);
 assert.match(cloud,/if\(!fromWorker&&mappa\[k\]\)continue/);
});
test("reload resubmits unacknowledged rename changes",()=>{
 assert.match(app,/Object\.keys\(_rinominiDaMandare\(\)\)\.length\)\s*_salvaStatoCondiviso\(\)/);
 const body=section("function _salvaStatoCondiviso(","const _mbUltimaLetturaWorker");
 assert.match(body,/_rinominiDaMandareSvuota\(sent\.rinomini\)/);
 assert.match(body,/_statoDaSalvare=Object\.keys\(_rinominiDaMandare\(\)\)\.length>0/);
});
