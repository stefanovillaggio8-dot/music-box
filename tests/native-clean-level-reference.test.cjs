'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('mix-intelligente.js','utf8'),begin=code.indexOf('function validateNativeCleanTailCue('),end=code.indexOf('function validateStructuralBeatCue(',begin);
const validate=ios=>new Function('isIOS',code.slice(begin,end)+'return validateNativeCleanTailCue;')(ios);
const control=require('../audits/ste-factored-clean-20261123/new-pair-shadow.json'),index=require('../dj-deep-analysis.json');
function fixture(){
 const record=structuredClone(control.record),p=record.cue,e=p.nativeCleanEvidence;
 e.method='original-native-near-silent-tail-v3';
 for(const r of e.renderMeasurements){
  const before=.05,after=.05*10**(5.356/20),mixedBefore=before+.00002,mixedAfter=after;
  r.originalLevelReference={method:'original-native-eof-relative-level-v1',sourceSha:e.sourceSha,targetSha:e.targetSha,
   halfWindowSeconds:.5,originalBeforeRms:before,originalAfterRms:after,mixedBeforeRms:mixedBefore,mixedAfterRms:mixedAfter};
  r.eofLevelChangeDb=20*Math.log10(mixedAfter/mixedBefore);
 }
 e.eofLevelChangeDb=e.renderMeasurements.find(r=>r.sampleRate===48000).eofLevelChangeDb;
 return {record,p,a:index.entries[control.from],b:index.entries[control.to]};
}
const run=f=>validate(false)(f.record,f.p,f.a,f.b,f.a.duration);
test('original intro dynamics may exceed 3dB only when independently bounded added change remains transparent',()=>{
 const f=fixture();assert.ok(f.p.nativeCleanEvidence.eofLevelChangeDb>5);assert.ok(run(f));
 assert.equal(validate(true)(f.record,f.p,f.a,f.b,f.a.duration),null,'no iPhone activation');
 f.p.nativeCleanEvidence.method='original-native-near-silent-tail-v2';assert.equal(run(f),null,'legacy evidence must not gain a new exemption');
});
test('a real gain jump, wrong reference identity or incomplete measurement still rejects even if levels do not clip',()=>{
 const changes=[
  e=>delete e.renderMeasurements[0].originalLevelReference,
  e=>e.renderMeasurements[0].originalLevelReference.targetSha='f'.repeat(40),
  e=>e.renderMeasurements[0].originalLevelReference.halfWindowSeconds=.1,
  e=>e.renderMeasurements[0].originalLevelReference.originalBeforeRms=0,
  e=>e.renderMeasurements[0].originalLevelReference.mixedAfterRms*=10**(1/20),
  e=>e.renderMeasurements[0].originalLevelReference.mixedBeforeRms*=.9,
  e=>e.renderMeasurements[0].eofLevelChangeDb+=.1,
  e=>e.eofLevelChangeDb+=.1,
  e=>e.nativeMeasurements[0].sourceTailPeak=.00101,
  e=>e.nativeMeasurements[0].targetNativeOverlapPeak=.961,
  e=>e.renderMeasurements[0].oversampledPeak=1.01,
  e=>e.renderMeasurements[0].incomingGain=.9,
 ];
 for(const change of changes){const f=fixture();change(f.p.nativeCleanEvidence);assert.equal(run(f),null,change.toString());}
});
