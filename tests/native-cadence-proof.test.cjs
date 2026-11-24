"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),candidate=require('../audits/ste-architecture-20261116/unreleased-cadence-candidate.json');
// Synthetic decoder receipts test certificate policy, never acoustic accuracy.
function compile(options={}){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-cadence-proof-'));
 try{
  const c=candidate.record.cue.composite,proofs=path.join(folder,'proofs');fs.mkdirSync(proofs);
  const rows=[['chromium','linux'],['webkit','linux'],...(options.mac?[['webkit',options.duplicate?'linux':'darwin']]:[])];
  for(const [i,[browser,nativePlatform]] of rows.entries()){
   const assets=[44100,48000].map(sampleRate=>({assetSha256:c.sha256,sampleRate,channels:2,duration:c.seconds,samplePeak:.998,overlapPeak:.95,
    nativeSplice:{method:'actual-native-original-splice-v1',targetSha:c.targetSha,frames:Math.round(sampleRate*.1),clockMethod:'original-mp3-gapless-metadata-v1',decodedPrimingSeconds:0,mediaPrimingSeconds:0,correlation:1,relativeRms:0},
    nativeSourceClock:{method:'actual-native-source-clock-v1',sourceSha:c.sourceSha,decodedOffset:0,mediaOffset:0,decodedDuration:139.833469,mediaDuration:139.833469,
     prerollProof:{method:'actual-native-original-preroll-v1',sourceSha:c.sourceSha,frames:Math.round(c.sourcePrerollProof.throughOffsetSeconds*sampleRate),correlation:options.badWaveform&&nativePlatform==='darwin'?.165:1,relativeRms:options.badWaveform&&nativePlatform==='darwin'?1.295:0}}}));
   fs.writeFileSync(path.join(proofs,i+'.json'),JSON.stringify({method:'actual-browser-decode-v1',browser,nativePlatform,assets}));
  }
  const index=path.join(folder,'index.json'),output=path.join(folder,'output.json');
  fs.writeFileSync(index,JSON.stringify({entries:{source:{structuralBeatPlans:{target:candidate.record}}}}));
  const result=spawnSync(process.execPath,[path.join(root,'tools/apply-native-decoder-peaks.cjs'),'--index='+index,'--proofs='+proofs,'--output='+output],{encoding:'utf8'});
  return {status:result.status,error:result.stderr,output:fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):null};
 }finally{assert.ok(folder.startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(folder,{recursive:true,force:true});}
}
test('Linux-only outgoing coherence cannot certify a universal cadence',()=>{
 const r=compile();assert.notEqual(r.status,0);assert.match(r.error,/Linux AND macOS/);assert.equal(r.output,null);
});
test('nominal source waveform failure rejects a cadence despite matching duration and clocks',()=>{
 const r=compile({mac:true,badWaveform:true});assert.notEqual(r.status,0);assert.match(r.error,/original-only native preroll/);assert.equal(r.output,null);
});
test('three independently scoped receipts preserve both native platform requirements',()=>{
 const r=compile({mac:true});assert.equal(r.status,0,r.error);
 assert.deepEqual(r.output.entries.source.structuralBeatPlans.target.cue.composite.nativeDecoderProof.sourcePlatformCoverage,['darwin','linux']);
});
test('duplicate WebKit backends cannot substitute for missing Apple evidence',()=>{
 const r=compile({mac:true,duplicate:true});assert.notEqual(r.status,0);assert.match(r.error,/Duplicate WebKit platform/);
});
