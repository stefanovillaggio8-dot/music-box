'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
function reconcile(old,incoming){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mb-reconcile-'));
 try{
  const batch=path.join(dir,'batch.json'),target=path.join(dir,'target.json');
  fs.writeFileSync(batch,JSON.stringify({version:2,entries:{song:incoming}}));
  fs.writeFileSync(target,JSON.stringify({version:2,entries:{song:old}}));
  const run=spawnSync(process.env.PYTHON||'python',[path.join(__dirname,'../tools/dj-deep-reconcile.py'),batch,target],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);return JSON.parse(fs.readFileSync(target)).entries.song;
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
}
const old={sha:'original',status:'ok',checkedAt:'2026-11-16',bpm:120,
 musicalContent:{sourceSha:'original'},structuralBeatPlans:{new:{fromSha:'original',toSha:'new'}},pcmTransition:{sha:'original'}};
test('basic analysis refresh retains verified same-recording musical extensions and new measured BPM',()=>{
 const result=reconcile(old,{sha:'original',status:'ok',checkedAt:'2026-11-17',bpm:121});
 assert.equal(result.bpm,121);assert.deepEqual(result.musicalContent,old.musicalContent);
 assert.deepEqual(result.structuralBeatPlans,old.structuralBeatPlans);assert.deepEqual(result.pcmTransition,old.pcmTransition);
});
test('replacement recordings never inherit old certificates; late jobs and failures cannot destroy good analysis',()=>{
 const replaced=reconcile(old,{sha:'replacement',status:'ok',checkedAt:'2026-11-17',bpm:100});
 assert.equal(replaced.structuralBeatPlans,undefined);assert.equal(replaced.musicalContent,undefined);
 assert.deepEqual(reconcile(old,{sha:'original',status:'failed',checkedAt:'2026-11-17'}),old);
 assert.deepEqual(reconcile(old,{sha:'original',status:'ok',checkedAt:'2026-11-15'}),old);
});
