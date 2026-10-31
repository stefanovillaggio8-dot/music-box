"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const app=fs.readFileSync("app.js","utf8"),html=fs.readFileSync("index.html","utf8");
const between=(start,end)=>{const i=app.indexOf(start),j=app.indexOf(end,i+start.length);assert(i>=0&&j>i,start);return app.slice(i,j)};
const add=between("async function addFiles(fileList) {","/* Toglie dalla memoria del telefono");
assert(add.includes("addedIds.push(rec.id)")&&add.includes("addedIds.includes(t.id)"),"Exact imported files needed");
assert(!add.includes("condividiBraniLocali(true)"),"Race: do not upload before user confirmation");
assert(add.includes("await _chiediDoveMandare(fresh)"),"Do not bypass confirmation");
const upload=between("  /* Cloud upload:","  async function _condividiAdesso()");
assert(upload.includes("r.profile||profile||DEFAULT_PROFILE"),"Wrong upload profile");
assert(upload.includes("r.condiviso=true")&&upload.includes("dbPut(r)"),"Success not saved locally");
assert(upload.includes('fetch(SERVIZIO_PUBBLICA+"/aggiungi"'),"Cloud endpoint missing");
assert(app.includes('function _chiavePubblica()'),"Runtime key missing");
assert(!app.includes("const CHIAVE_PUBBLICA"),"Stale key");
const activation=between("  function _preparaCasellaServizio()","  /* Ste: il tasto in alto delle playlist");
assert(!activation.includes("fetch("),"Dummy upload must not run");
for(const id of ["fabCloud","cloudPanel","cloudKey","cloudSave","cloudClose","cloudRetry","cloudStatus"])
 assert.equal((html.match(new RegExp('id="'+id+'"',"g"))||[]).length,1,id+" duplicate or missing");
console.log("OK: files remain locally on errors, user approved cloud uploads, correct profile, runtime key, retry");
