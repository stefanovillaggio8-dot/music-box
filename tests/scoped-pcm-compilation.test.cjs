'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
test('PCM compilation honors the explicit personal input without modifying or importing the global catalog',()=>{
 const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-scoped-pcm-'));
 const current=fs.readFileSync(path.join(root,'dj-deep-analysis.json'));
 try{
  const data=JSON.parse(current),pcm=require('./fixtures/full-beat-584-336.json'),keys=Object.keys(pcm.entries);
  const input=path.join(dir,'personal.json'),features=path.join(dir,'features'),output=path.join(dir,'output.json'),report=path.join(dir,'report.json'),pairs=path.join(dir,'pairs.json');
  fs.mkdirSync(features);fs.writeFileSync(input,JSON.stringify({...data,entries:Object.fromEntries(keys.map(k=>[k,data.entries[k]]))}));
  const originalInput=fs.readFileSync(input);
  fs.writeFileSync(path.join(features,'pcm-0.json'),JSON.stringify(pcm));fs.writeFileSync(pairs,'[]');
  cp.execFileSync(process.execPath,['tools/build-full-beat-plans.cjs','--index='+input,'--features='+features,'--candidates='+pairs,'--output='+output,'--report='+report],{cwd:root});
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(output)).entries).sort(),keys.sort());
  assert.equal(JSON.parse(fs.readFileSync(report)).features,2);assert.equal(JSON.parse(fs.readFileSync(report)).consideredPairs,0);
  assert.ok(fs.readFileSync(input).equals(originalInput));assert.ok(fs.readFileSync(path.join(root,'dj-deep-analysis.json')).equals(current));
 }finally{
  assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('musicbox-scoped-pcm-'));fs.rmSync(dir,{recursive:true,force:true});
 }
});
