'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('continuous Ste listening carries the actual fresh pool and current track across reporting sessions',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-ste-continuity-'));
 try{
  const output=path.join(temp,'six-changes.json');
  cp.execFileSync(process.execPath,['tools/simulate-library-listening.cjs','--only-profile=Ste','--personal-only=true','--exclude-playlists=Ste:gym','--only-mode=shuffle','--continuous-shuffle=true','--sessions=2','--steps=3','--output='+output],{cwd:path.resolve(__dirname,'..'),timeout:30000,stdio:'pipe'});
  const report=JSON.parse(fs.readFileSync(output)),r=report.results[0];assert.equal(report.results.length,1);assert.equal(r.profile,'Ste');assert.equal(r.totals.attempts,6);assert.equal(r.completedCycles,0);
  const trace=r.trace;assert.equal(trace.length,6);assert.equal(trace[2].session,0);assert.equal(trace[3].session,1);
  for(let n=1;n<trace.length;n++)assert.equal(trace[n].from,trace[n-1].to,'a reporting boundary cannot silently start a fresh song or reset history');
  assert.equal(new Set([trace[0].from,...trace.map(t=>t.to)]).size,7,'no repeat before exhausting the personal library');
  assert.equal(r.scopeAudit.outsideLibraryAttempts,0);
 }finally{
  const resolved=path.resolve(temp);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('musicbox-ste-continuity-'));fs.rmSync(resolved,{recursive:true,force:true});
 }
});
