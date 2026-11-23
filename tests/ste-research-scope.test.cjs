"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {currentSteScope,validateSteCases}=require('../tools/ste-research-scope.cjs'),root=path.resolve(__dirname,'..');
test('new scope queries only actual personal Ste membership, excludes Gym and never changes user data',()=>{
 const names=['app.js','stato.json','playlist.json','online-imports.json','dj-deep-analysis.json'];
 const snapshot=()=>Object.fromEntries(names.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
 const before=snapshot(),scope=currentSteScope();assert.equal(scope.name,'Ste');assert.ok(scope.tracks.length>0);
 const playlist=JSON.parse(fs.readFileSync(path.join(root,'playlist.json'))).find(p=>p.nascostaDa==='Ste'&&p.name.toLowerCase()==='gym');
 assert.ok(playlist);assert.ok(scope.tracks.every(t=>!playlist.tracks.includes(t.id)));
 assert.equal(scope.membershipEvidence.stateSha256,before['stato.json']);assert.deepEqual(snapshot(),before);
});
test('bounded cases reject outside membership, changed audio, duplicate files and a foreign profile before PCM work',()=>{
 const a='a'.repeat(40),b='b'.repeat(40),scope={name:'Ste',tracks:[{key:'first',sha:a},{key:'second',sha:b}]},index={entries:{first:{status:'ok',sha:a},second:{status:'ok',sha:b}}};
 assert.equal(validateSteCases([{from:'first',to:'second'}],scope,index)[0].targetSha,b);
 assert.throws(()=>validateSteCases([{from:'outside-current-Ste',to:'second'}],scope,index),/outside/);
 assert.throws(()=>validateSteCases([{from:'first',to:'second'}],{...scope,name:'foreign'},index),/Ste/);
 assert.throws(()=>validateSteCases([{from:'first',to:'second'}],scope,{entries:{...index.entries,first:{status:'ok',sha:b}}}),/SHA/);
 assert.throws(()=>validateSteCases(Array(5).fill({from:'first',to:'second'}),scope,index),/four/);
 assert.throws(()=>validateSteCases(Array(2).fill({from:'first',to:'second'}),scope,index),/Duplicate/);
});
test('global research cannot run automatically from a PR; essential regressions and existing import analysis stay enabled',()=>{
 for(const f of ['dj-equivalence-audit.yml','dj-pcm-transition-features.yml','dj-structural-integration.yml']){
  const text=fs.readFileSync(path.join(root,'.github/workflows',f),'utf8'),trigger=text.slice(text.indexOf('on:\n'),text.indexOf('permissions:'));
  assert.ok(trigger.includes('workflow_dispatch:'));assert.doesNotMatch(trigger,/^  (pull_request|push):/m);
 }
 const read=f=>fs.readFileSync(path.join(root,'.github/workflows',f),'utf8');
 assert.match(read('dj-mix-tests.yml'),/pull_request:/);assert.match(read('dj-deep-full-scan.yml'),/branches: \[main\]/);
});
