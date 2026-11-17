'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
function run({failed=false,changed=false,previous=false}={}){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'mb-render-proof-'));
 try{
  const a='a'.repeat(40),b='b'.repeat(40),cue={sourceSha:a,targetSha:b,begin:100,entry:0,fade:5,tempo:1},
   plan={from:'audio/songs/new.mp3',to:'audio/songs/other.mp3',cue};
  const index={entries:{[plan.from]:{sha:a,pcmBeatPlans:{[b]:{fromSha:a,toSha:b,cue}}}}};
  const saved={fromSha:a,toSha:b,cue:{...cue,begin:90,renderEvidence:{timingVerified:true},
   composite:{version:1,sourceSha:a,targetSha:b,introductionExposure:{accepted:true}}}};
  const baseline={entries:{[plan.from]:{pcmBeatPlans:previous?{[b]:saved}:{}}}};
  const write=(file,value)=>{const p=path.join(folder,file);fs.writeFileSync(p,JSON.stringify(value));return p};
  const reports=[16000,48000].map(rate=>write(rate+'.json',{results:[{from:plan.from,to:plan.to,sourceSha:a,targetSha:b,
   cueParameters:{begin:changed?101:100,entry:0,fade:5,tempo:1},seconds:5,sampleRate:rate,
   stretchAccepted:!(failed&&rate===16000),recommendedHeadroom:.8,safeSamplesOverFullScale:0,sourcePeak:.8,processedPeak:.7}]}));
  const output=path.join(folder,'output.json'),report=path.join(folder,'verified.json');
  const result=spawnSync(process.execPath,[path.join(__dirname,'../tools/apply-full-beat-audio-proof.cjs'),
   '--index='+write('index.json',index),'--plans='+write('plans.json',{plans:[plan]}),'--reports='+reports.join(','),
   '--baseline='+write('baseline.json',baseline),'--output='+output,'--report='+report],{encoding:'utf8'});
  return {status:result.status,stderr:result.stderr,index:fs.existsSync(output)&&JSON.parse(fs.readFileSync(output)),
   report:fs.existsSync(report)&&JSON.parse(fs.readFileSync(report)),key:b,saved};
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
}
test('only candidates verified at every rendered rate enter the exported complete-plan list',()=>{
 const good=run();assert.equal(good.status,0,good.stderr);assert.equal(good.report.plans.length,1);
 assert.deepEqual(good.report.plans[0].cue.renderEvidence.sampleRates,[16000,48000]);
 const bad=run({failed:true});assert.equal(bad.status,0,bad.stderr);
 assert.equal(bad.report.plans.length,0);assert.equal(bad.report.rejectedCandidates.length,1);
 assert.deepEqual(bad.report.rejectedCandidates[0].failedRates,[16000]);
 assert.equal(bad.index.entries['audio/songs/new.mp3'].pcmBeatPlans[bad.key],undefined);
});
test('an unsuccessful new proposal preserves an independently verified previous window',()=>{
 const r=run({failed:true,previous:true});assert.equal(r.status,0,r.stderr);
 assert.deepEqual(r.index.entries['audio/songs/new.mp3'].pcmBeatPlans[r.key],r.saved);
 assert.equal(r.report.rejectedCandidates[0].retainedPreviousWindow,true);
});
test('a render at another cue cannot be reused as proof, even with identical file hashes and duration',()=>{
 const r=run({changed:true});assert.notEqual(r.status,0);assert.match(r.stderr,/exact-window render/);
 assert.equal(r.index,false);assert.equal(r.report,false);
});
