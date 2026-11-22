'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
test('actual twelve-shard publisher preserves same-source evidence, revocations, source replacement and concurrent updates',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-shard-merge-'));
 try{
  const good={sha:'same-source',status:'ok',checkedAt:'2026-11-16',bpm:120,
   musicalContent:{sourceSha:'same-source'},structuralBeatPlans:{target:{cue:{composite:{sha256:'verified'}}}},
   pcmBeatPlans:{target:{cue:{begin:90}}},pcmTransition:{sha:'same-source'},pcmIntroSeconds:19};
  const entries=Object.fromEntries(Array.from({length:12},(_,i)=>['song-'+i,{...good}]));
  entries['song-3']={...good,checkedAt:'2026-11-19'};
  entries['song-4']={sha:'same-source',status:'ok',checkedAt:'2026-11-16'};
  const target=path.join(dir,'index.json');
  fs.writeFileSync(target,JSON.stringify({version:2,introExposureRevision:2,entries}));
  for(let i=0;i<12;i++){
   const basic={sha:i===2?'replacement':'same-source',status:i===1?'failed':'ok',checkedAt:'2026-11-17',bpm:121};
   if(i===4||i===5)Object.assign(basic,{structuralBeatPlans:{obsolete:'snapshot'},pcmIntroSeconds:24});
   fs.writeFileSync(path.join(dir,'dj-shard-'+i+'.json'),JSON.stringify({version:2,parts:12,shard:i,sourceCount:12,entries:{['song-'+i]:basic}}));
  }
  const run=()=>cp.spawnSync(process.env.PYTHON||'python',['tools/dj-deep-merge.py','--directory',dir,'--target',target],{cwd:root,encoding:'utf8'});
  const first=run();assert.equal(first.status,0,first.stderr);
  const out=JSON.parse(fs.readFileSync(target));assert.equal(out.introExposureRevision,2);
  for(const key of ['musicalContent','structuralBeatPlans','pcmBeatPlans','pcmTransition','pcmIntroSeconds']){
   assert.deepEqual(out.entries['song-0'][key],good[key]);assert.equal(out.entries['song-2'][key],undefined);
  }
  assert.equal(out.entries['song-0'].bpm,121);
  assert.deepEqual(out.entries['song-1'],good);assert.deepEqual(out.entries['song-3'],entries['song-3']);
  assert.equal(out.entries['song-4'].structuralBeatPlans,undefined);
  assert.deepEqual(out.entries['song-5'].structuralBeatPlans,good.structuralBeatPlans);
  assert.equal(out.entries['song-5'].pcmIntroSeconds,19);
  const saved=fs.readFileSync(target);fs.unlinkSync(path.join(dir,'dj-shard-11.json'));
  const missing=run();assert.notEqual(missing.status,0);assert.match(missing.stderr,/expected 12 shard/);assert.ok(fs.readFileSync(target).equals(saved));
 }finally{
  assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('musicbox-shard-merge-'));
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
