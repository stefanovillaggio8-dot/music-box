'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
const from='audio/songs/track-705.mp3',to='audio/songs/track-50.mp3';
test('recovery restores actual same-MP3 renders only in a shared personal scope, preserving new basic data and current proofs',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-proof-recovery-'));
 try{
  const baseline={version:2,introExposureRevision:2,entries:{[from]:index.entries[from],[to]:index.entries[to]}};
  assert.ok(baseline.entries[from].structuralBeatPlans?.[baseline.entries[to].sha],'Known render must remain available');
  const current=structuredClone(baseline);delete current.entries[from].structuralBeatPlans;delete current.entries[from].musicalContent;
  current.entries[from].checkedAt='2026-11-22';current.entries[from].beatConfidence=.123;
  const write=(name,obj)=>{const file=path.join(folder,name);fs.writeFileSync(file,JSON.stringify(obj));return file};
  const old=write('baseline.json',baseline),now=write('current.json',current),out=path.join(folder,'output.json'),report=path.join(folder,'report.json');
  const scope={name:'Ste',auditExclusions:[{profile:'Ste',playlist:'gym'}],tracks:[{key:from,sha:current.entries[from].sha},{key:to,sha:current.entries[to].sha}]};
  const scopeFile=write('Ste.json',scope);
  const run=()=>cp.spawnSync(process.execPath,['tools/restore-rendered-metadata.cjs','--baseline='+old,'--current='+now,'--scopes='+folder,'--output='+out,'--report='+report],{cwd:root,encoding:'utf8'});
  const first=run();assert.equal(first.status,0,first.stderr);
  let recovered=JSON.parse(fs.readFileSync(out));assert.ok(recovered.entries[from].structuralBeatPlans[current.entries[to].sha]);
  assert.equal(recovered.entries[from].checkedAt,'2026-11-22');assert.equal(recovered.entries[from].beatConfidence,.123);
  // A current revocation record is never overwritten by archived evidence.
  current.entries[from].structuralBeatPlans={[current.entries[to].sha]:{revoked:true}};write('current.json',current);
  assert.equal(run().status,0);recovered=JSON.parse(fs.readFileSync(out));assert.deepEqual(recovered.entries[from].structuralBeatPlans[current.entries[to].sha],{revoked:true});
  delete current.entries[from].structuralBeatPlans;write('current.json',current);
  scope.tracks=scope.tracks.filter(t=>t.key!==to);write('Ste.json',scope);
  assert.equal(run().status,0);recovered=JSON.parse(fs.readFileSync(out));assert.equal(recovered.entries[from].structuralBeatPlans,undefined,'Foreign target is not restored');
  scope.tracks.push({key:to,sha:'f'.repeat(40)});write('Ste.json',scope);
  const changed=run();assert.notEqual(changed.status,0);assert.match(changed.stderr,/Scope source changed/);
  scope.name='Gym';write('Ste.json',scope);assert.notEqual(run().status,0);
 }finally{
  assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('musicbox-proof-recovery-'));
  fs.rmSync(folder,{recursive:true,force:true});
 }
});
