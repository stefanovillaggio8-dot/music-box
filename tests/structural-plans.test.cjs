'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
const from=source.indexOf('function indexedStructuralBeatBridge('),to=source.indexOf('function pcmFittedTempo(',from);
const lookup=new Function(source.slice(from,to)+'return indexedStructuralBeatBridge;')();
function fixture(){
 const a={sha:'a'.repeat(40),duration:100},b={sha:'b'.repeat(40),duration:200};
 const p={kind:'beat',structuralBeat:true,measuredFullBeat:true,metricalRhythmic:false,
  nativeTailFullBeat:false,preserveTail:false,silenceTrim:false,vocalFadeSeconds:.4,
  begin:32,end:40,fade:8,entry:80,tempo:1,sourceSha:a.sha,targetSha:b.sha,
  measuredPlacementError:.015,grooveScore:.8,measuredBeatCount:16,beatPulseAgreement:1,
  measuredPulseMode:false,fullOnsetFirst:.8,fullOnsetSecond:.8,
  structuralEvidence:{version:1,bars:4,beatsPerBar:4,sourcePhaseConfidence:.95,targetPhaseConfidence:.95,downbeatRms:.01,
   simultaneousVocalFrames:0,outgoingVocalTail:{start:38.8,end:40.35,clear:true,method:'spleeter-2stems-energy-v1',maxVocalRms:.001,maxRelativeVocal:.01}},
  harmonicEvidence:{average:.9,weakest:.8},composite:{sourceSha:a.sha,targetSha:b.sha,pitchPreserved:true,timingVerified:true,overlapPeak:.95,peak:.98,oversampledPeak:.99,
   rhythmVerified:true,postRenderRhythm:{method:'rendered-hpss-attacks-v1',mode:'full-pcm',accepted:true,matches:16,rmsSeconds:.015,agreement:1,firstHalfMatches:8,secondHalfMatches:8}}};
 a.structuralBeatPlans={[b.sha]:{version:1,fromSha:a.sha,toSha:b.sha,sourceDuration:100,nextDuration:200,cue:p,cues:[p]}};
 return {a,b,p};
}
test('an internal exit requires rendered originals and quiet vocal context, not a section flag',()=>{
 const {a,b,p}=fixture();assert.ok(lookup(a,b,100));
 const mutations=[()=>{delete p.composite},()=>{p.sourceSha='c'.repeat(40)},
  ()=>{p.structuralEvidence.outgoingVocalTail.maxVocalRms=.008},
  ()=>{p.structuralEvidence.downbeatRms=.08},()=>{p.structuralEvidence.sourcePhaseConfidence=undefined},
  ()=>{p.composite.oversampledPeak=1.1}];
 for(const mutate of mutations){const f=fixture();const copy=JSON.parse(JSON.stringify(f.p));
  // Mutations close over p, so restore the original record each iteration.
  Object.keys(p).forEach(k=>delete p[k]);Object.assign(p,copy);mutate();assert.equal(lookup(a,b,100),null);
 }
});
test('strict full PCM agreement is never replaced by the partial metrical category',()=>{
 const {a,b,p}=fixture();p.beatPulseAgreement=.67;assert.equal(lookup(a,b,100),null);
 p.measuredFullBeat=false;p.metricalRhythmic=true;
 p.composite.postRenderRhythm={...p.composite.postRenderRhythm,mode:'metrical-rhythmic',sharedPerBar:[2,3,2,3]};
 p.structuralEvidence.metricalCertificate={method:'shared-observed-attacks-plus-metrical-hypotheses-v1',
  gridRms:.015,gridMaximum:.03,observedSharedRms:.012,observedShared:10,minimumSharedPerBar:2,observedDownbeats:4,modelGridPoints:16};
 assert.ok(lookup(a,b,100));assert.equal(lookup(a,b,100).measuredFullBeat,false);
 p.structuralEvidence.metricalCertificate.observedDownbeats=3;assert.equal(lookup(a,b,100),null);
});
test('seeking beyond an early cue selects a later verified alternative or native fallback',()=>{
 const {a,b,p}=fixture(),later=JSON.parse(JSON.stringify(p));later.begin=60;later.end=68;
 later.structuralEvidence.outgoingVocalTail.start=66.8;later.structuralEvidence.outgoingVocalTail.end=68.35;
 a.structuralBeatPlans[b.sha].cues.push(later);
 assert.equal(lookup(a,b,100).begin,32);a.mixPosition=50;assert.equal(lookup(a,b,100).begin,60);
 a.mixPosition=70;assert.equal(lookup(a,b,100),null);assert.equal(lookup(a,b,NaN),null);
});
test('future vocals do not forbid an earlier section exit but fresh local vocal evidence vetoes it',()=>{
 const {a,b}=fixture();a.lastLyricAt=90;a.lastVoiceAt=90;assert.ok(lookup(a,b,100));
 a.lastVoiceAt=39.9;assert.equal(lookup(a,b,100),null);
 a.lastVoiceAt=90;a.lyricStarts=[39.8,90];assert.equal(lookup(a,b,100),null);
});
