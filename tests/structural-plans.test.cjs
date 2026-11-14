'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
const from=source.indexOf('function indexedStructuralBeatBridge('),to=source.indexOf('function pcmFittedTempo(',from);
const lookup=new Function(source.slice(from,to)+'return indexedStructuralBeatBridge;')();
function fixture(){
 const a={sha:'a'.repeat(40),duration:100},b={sha:'b'.repeat(40),duration:200};
 a.musicalContent={version:1,sourceSha:a.sha,sourceDuration:100,audibleStart:0,audibleEnd:100,wholeCoverageVerified:true,
  vocalRegions:[[1,80]],boundaryTimes:[20,60],cutEvidence:[92,94].map(end=>({end,remainingEnergyRatio:.8,maximumRemainingBlockRatio:1}))};
 const p={kind:'beat',structuralBeat:true,measuredFullBeat:true,metricalRhythmic:false,
  nativeTailFullBeat:false,preserveTail:false,silenceTrim:false,vocalFadeSeconds:.4,
  begin:84,end:92,fade:8,entry:0,tempo:1,sourceSha:a.sha,targetSha:b.sha,
  measuredPlacementError:.015,grooveScore:.8,measuredBeatCount:16,beatPulseAgreement:1,
  measuredPulseMode:false,fullOnsetFirst:.8,fullOnsetSecond:.8,
  structuralEvidence:{version:1,bars:4,beatsPerBar:4,sourcePhaseConfidence:.95,targetPhaseConfidence:.95,downbeatRms:.01,
   simultaneousVocalFrames:0,outgoingVocalTail:{start:90.8,end:92.35,clear:true,method:'spleeter-2stems-energy-v1',maxVocalRms:.001,maxRelativeVocal:.01}},
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
 const {a,b,p}=fixture(),later=JSON.parse(JSON.stringify(p));p.begin=82;p.end=90;
 p.structuralEvidence.outgoingVocalTail.start=88.8;p.structuralEvidence.outgoingVocalTail.end=90.35;
 a.musicalContent.cutEvidence.push({end:90,remainingEnergyRatio:.8,maximumRemainingBlockRatio:1});
 a.structuralBeatPlans[b.sha].cues.push(later);
 assert.equal(lookup(a,b,100).begin,84);a.mixPosition=83;assert.equal(lookup(a,b,100).begin,84);
 a.mixPosition=95;assert.equal(lookup(a,b,100),null);assert.equal(lookup(a,b,NaN),null);
});
test('a quiet cut cannot sacrifice a future vocal or lyric phrase',()=>{
 const {a,b}=fixture();a.lastLyricAt=90;a.lastVoiceAt=90;assert.ok(lookup(a,b,100));
 a.lastVoiceAt=99;assert.equal(lookup(a,b,100),null);
 a.lastVoiceAt=90;a.lyricStarts=[90,99];assert.equal(lookup(a,b,100),null);
});
test('large unverified skips and later structural changes are denied despite perfect rhythm',()=>{
 const {a,b,p}=fixture();p.begin=27.48;p.end=35.48;
 p.structuralEvidence.outgoingVocalTail.start=34.28;p.structuralEvidence.outgoingVocalTail.end=35.48;
 a.musicalContent.vocalRegions=[];a.musicalContent.boundaryTimes=[];
 a.musicalContent.cutEvidence.push({end:35.48,remainingEnergyRatio:.8,maximumRemainingBlockRatio:1});
 assert.equal(lookup(a,b,100),null);
 p.begin=84;p.end=92;p.structuralEvidence.outgoingVocalTail.start=90.8;p.structuralEvidence.outgoingVocalTail.end=92;
 a.musicalContent.boundaryTimes=[96];assert.equal(lookup(a,b,100),null);
 a.musicalContent.boundaryTimes=[];delete a.musicalContent;assert.equal(lookup(a,b,100),null);
});


test('an acoustically clean internal entry cannot skip unverified incoming content',()=>{
 const {a,b,p}=fixture();p.entry=80;assert.equal(lookup(a,b,100),null);
 b.musicalContent={leadingDigitalSilence:{sourceSha:b.sha,method:'original-stereo-peak-prefix-v1',sampleRate:48000,through:80,maximumPeak:0}};
 assert.ok(lookup(a,b,100));b.musicalContent.leadingDigitalSilence.maximumPeak=.003;assert.equal(lookup(a,b,100),null);
});
function intactFixture(){
 const f=fixture(),{a,b,p}=f;
 Object.assign(p,{preservedFileTail:true,nativeTailFullBeat:true,preserveTail:true,softTailTrim:false,
  begin:92,end:100,fade:8,entry:0,gain:1,vocalFadeSeconds:0});
 a.lastVoiceAt=99.9;a.lastLyricAt=99.9;a.musicalContent.vocalRegions=[[1,100]];
 Object.assign(p.structuralEvidence,{incomingWholeOverlap:{method:'spleeter-2stems-energy-v1',clear:true,start:0,end:8.3,maxVocalRms:.001,maxRelativeVocal:.01}});
 Object.assign(p.composite,{sourceReadThrough:99.98,outgoingEnvelope:'unity-through-decoded-eof-v1'});
 Object.assign(p.composite.postRenderRhythm,{downbeatsVerified:true,downbeatMatches:4,downbeatRmsSeconds:.01,maximumDownbeatError:.02});
 return f;
}
test('a complete decoded file can overlap an instrumental opening without fading its final voice',()=>{
 const {a,b}=intactFixture();assert.ok(lookup(a,b,100));
});
test('intact-file mode rejects cuts, hidden entrance skips, missing attacks and unsafe or stale proofs',()=>{
 const mutations=[p=>p.end=99,p=>p.entry=1,p=>p.vocalFadeSeconds=.4,p=>p.preserveTail=false,
 p=>p.composite.sourceReadThrough=98,p=>delete p.composite.outgoingEnvelope,
 p=>p.structuralEvidence.incomingWholeOverlap.maxVocalRms=.004,p=>p.structuralEvidence.incomingWholeOverlap.end=8,
 p=>delete p.fullOnsetFirst,p=>{p.measuredPulseMode=true;delete p.fullPulseAttackSupport},
 p=>p.composite.postRenderRhythm.downbeatMatches=3,p=>p.composite.postRenderRhythm.downbeatRmsSeconds=.026,
 p=>p.composite.postRenderRhythm.agreement=.89,p=>p.composite.oversampledPeak=1.01];
 for(const change of mutations){const {a,b,p}=intactFixture();change(p);assert.equal(lookup(a,b,100),null);}
 const {a,b}=intactFixture();b.firstLyricAt=7;assert.equal(lookup(a,b,100),null);
});
