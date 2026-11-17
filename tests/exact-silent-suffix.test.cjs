'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validExactSuffix}=require('../tools/exact-silent-suffix.cjs');
const fs=require('node:fs'),path=require('node:path');
function fixture(){
 const source={sha:'a'.repeat(40),duration:100},rates={};
 for(const rate of [44100,48000])rates[rate]={frames:100*rate,decodedDuration:100,nonzeroThroughFrame:99*rate,zeroFrom:99,maximumSuffixPeak:0,pcmSha256:'b'.repeat(64)};
 return {source,proof:{method:'original-stereo-exact-zero-suffix-v1',sourceSha:source.sha,sourceSha256:'c'.repeat(64),threshold:0,zeroFrom:99,through:100,rates}};
}
test('exact zero evidence requires both original stereo rates and its actual sample boundary',()=>{
 const {source,proof}=fixture();assert.equal(validExactSuffix(proof,source),true);
 for(const change of [p=>p.threshold=.0001,p=>p.sourceSha='f'.repeat(40),p=>delete p.rates[48000],
  p=>p.rates[48000].maximumSuffixPeak=1e-30,p=>p.zeroFrom-=.01,p=>p.zeroFrom+=.01,
  p=>p.rates[44100].nonzeroThroughFrame--]){
  const copy=structuredClone(proof);change(copy);assert.equal(validExactSuffix(copy,source),false);
 }
});

test('player requires exact raw suffix evidence and independently rendered evidence at both rates',()=>{
 const root=path.resolve(__dirname,'..'),tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(root,'tools'));
 const fixture=require('./fixtures/exact-silent-suffix-cue.json'),index=require('../dj-deep-analysis.json');
 const a=engine.withGuardedLRC(index.entries[fixture.from]),b=engine.withGuardedLRC(index.entries[fixture.to]);
 const validate=p=>engine.validatePreservedFileTailCue({version:1,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration},p,a,b,a.duration);
 assert.ok(validate(fixture.cue));
 for(const mutate of [p=>p.structuralEvidence.exactSilentSuffix.threshold=.0001,
  p=>p.structuralEvidence.exactSilentSuffix.zeroFrom-=.01,
  p=>p.composite.postRenderRhythm.exactSilentSuffix.maximumPeak=1e-30,
  p=>p.composite.postRenderRhythm.exactSilentSuffix.sourceGainApplied=true,
  p=>delete p.composite.resampledCommonProof,
  p=>p.composite.resampledCommonProof.rhythm.exactSilentSuffix.maximumPeak=1e-30,
  p=>p.composite.resampledCommonProof.rhythm.rmsSeconds=.041,
  p=>p.composite.stretchProfile='unknown',
  p=>delete p.structuralEvidence.exactSilentSuffix]){
  const cue=structuredClone(fixture.cue);mutate(cue);assert.equal(validate(cue),null);
 }
});
