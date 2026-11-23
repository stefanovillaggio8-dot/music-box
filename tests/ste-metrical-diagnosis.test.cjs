'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {observedMetricPart,validateGeometry}=require('../tools/diagnose-ste-metrical-pulses.cjs');

test('metrical diagnosis exports actual attacks, retains missing evidence, and invents no pulse',()=>{
 const onset=Array(201).fill(0);onset[25]=1;onset[76]=.8;
 const part={start:0,end:4,step:.02,onset,beats:[.9,2.9]};
 const model={reliableBars:[{start:.5,end:2.5,modelBeats:[.5,1,1.5,2],beatsPerBar:4,metricalPhaseConfidence:.95,bpm:120}]};
 const before=JSON.stringify({part,model}),r=observedMetricPart(part,model,0,4);
 assert.deepEqual(r.part.beats,[.5,1.52]);assert.deepEqual(r.missing.map(x=>x.predictedAt),[1,2]);
 assert.equal(r.evidence[1].strength,.8);assert.equal(JSON.stringify({part,model}),before);
 model.reliableBars[0].metricalPhaseConfidence=.79;
 assert.deepEqual(observedMetricPart(part,model,0,4).part.beats,[]);
});

test('diagnostic geometry cannot silently retune a case, skip an introduction, or cut the original ending',()=>{
 const index={entries:{a:{duration:100}}},c={from:'a',begin:90,entry:0,fade:10,rate:1};
 assert.equal(validateGeometry([c],index)[0],c);
 for(const change of [{entry:1},{begin:89},{rate:1.06},{fade:NaN},{fade:0},{begin:undefined}])
  assert.throws(()=>validateGeometry([{...c,...change}],index),/Frozen geometry/);
});

test('bounded plan generation rejects foreign cases before loading any musical evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-ste-metric-'));
 try{
  const cases=path.join(dir,'cases.json');fs.writeFileSync(cases,JSON.stringify([{from:'outside-current-Ste',to:'audio/songs/track-34.mp3'}]));
  const run=cp.spawnSync(process.execPath,['tools/build-preserved-tail-plans.cjs','--cases='+cases,'--structure='+path.join(dir,'must-not-open')],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:30000});
  assert.equal(run.status,1);assert.match(run.stderr,/outside current Ste personal library/);assert.doesNotMatch(run.stderr,/ENOENT|must-not-open/);
  fs.writeFileSync(cases,JSON.stringify([{from:'audio/songs/track-34.mp3',to:'audio/songs/track-39.mp3'}]));
  const valid=cp.spawnSync(process.execPath,['tools/build-preserved-tail-plans.cjs','--cases='+cases,'--structure='+path.join(dir,'must-not-open')],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:30000});
  assert.equal(valid.status,1);assert.match(valid.stderr,/new explicit output path/);assert.doesNotMatch(valid.stderr,/ENOENT|must-not-open/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('cross-context research cannot silently run on the unbounded catalog',()=>{
 const run=cp.spawnSync(process.execPath,['tools/build-preserved-tail-plans.cjs','--context-bar-chains=true','--structure=must-not-open'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:30000});
 assert.equal(run.status,1);assert.match(run.stderr,/require bounded current Ste/);assert.doesNotMatch(run.stderr,/ENOENT/);
});

test('a metrical tail veto is reported before tempo rather than falsely diagnosed as incompatible BPM',()=>{
 const root=path.resolve(__dirname,'..'),index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 const scope=require('../tools/ste-research-scope.cjs').currentSteScope(),a=scope.tracks[0],b=scope.tracks.find(t=>t.sha!==a.sha);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-ste-tail-gate-'));
 try{
  const entries={[a.key]:index.entries[a.key],[b.key]:index.entries[b.key]},whole={},features={};
  const makeBar=start=>({start,end:start+3,beatsPerBar:4,modelBeats:[start,start+.75,start+1.5,start+2.25],metricalPhaseConfidence:.99});
  for(const [key,raw] of Object.entries(entries)){
   const start=key===a.key?raw.duration-8:.2;
   // Synthetic fixtures exercise ordering only; no PCM or musical evidence
   // is asserted and no resulting plan can pass the acoustic gates.
   whole[key]={sha:raw.sha,beats:[],reliableBars:[makeBar(start),makeBar(start+3)],vocalRms:[],mixRms:[]};
   const part=(start,end)=>({start,end,step:.02,onset:Array(Math.ceil((end-start)/.02)+1).fill(0),beats:[],harmony:[]});
   features[key]={sha:raw.sha,pcmTransition:{sha:raw.sha,intro:part(0,20),outro:part(raw.duration-20,raw.duration)}};
  }
  for(const sub of ['whole','pcm'])fs.mkdirSync(path.join(dir,sub));
  for(const [file,value] of [['index.json',index],['cases.json',[{from:a.key,to:b.key}]],['whole/structure-test.json',{entries:whole}],['pcm/pcm-0.json',{entries:features}]])fs.writeFileSync(path.join(dir,file),JSON.stringify(value));
  const output=path.join(dir,'result.json'),run=cp.spawnSync(process.execPath,['tools/build-preserved-tail-plans.cjs','--metrical=true','--diagnostics=true','--cases='+path.join(dir,'cases.json'),'--index='+path.join(dir,'index.json'),'--structure='+path.join(dir,'whole'),'--pcm='+path.join(dir,'pcm'),'--output='+output],{cwd:root,encoding:'utf8',timeout:30000});
  assert.equal(run.status,0,run.stderr);const report=JSON.parse(fs.readFileSync(output));
  assert.equal(report.profileFunnel.Ste.unsupportedMetricalTail,1);
  assert.equal(report.diagnostics.caseDiagnostics[0].firstMissing,'tailEligibility');
  assert.equal(report.pairConditions.Ste.bpm,undefined);assert.deepEqual(report.plans,[]);
 }finally{assert.equal(path.dirname(dir),os.tmpdir());fs.rmSync(dir,{recursive:true,force:true});}
});
