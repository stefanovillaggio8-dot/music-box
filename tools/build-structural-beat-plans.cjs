#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const root=path.resolve(__dirname,'..'),index=JSON.parse(fs.readFileSync(arg('index',path.join(root,'dj-deep-analysis.json'))));
const dir=arg('features',''),partial=process.argv.includes('--allow-partial');
if(!dir)throw Error('Supply --features=DIR');
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(d,x.name)):/^structure.*\.json$/.test(x.name)?[path.join(d,x.name)]:[]);
const features=new Map();
for(const file of files(dir)){
 const shard=JSON.parse(fs.readFileSync(file));
 if(shard.errors?.length)throw Error('Failed source analysis '+file);
 for(const [key,e] of Object.entries(shard.entries||{})){
  if(features.has(key)||index.entries[key]?.sha!==e.sha||e.modelSha256==null||
     Math.abs(index.entries[key].duration-e.duration)>1.5)throw Error('Unbound or duplicate structure '+key);
  features.set(key,e);
 }
}
const tracks=Object.entries(index.entries).filter(([,e])=>e.status==='ok');
if(!partial&&features.size!==tracks.length)throw Error('Incomplete structure coverage '+features.size+'/'+tracks.length);
const tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(root,'tools'));
const report={version:1,completeCoverage:!partial,features:features.size,tracks:tracks.length,
 possibleOrderedPairs:tracks.length*(tracks.length-1),consideredPairs:0,sameRecording:0,
 missingWholeRecording:0,noExitWindow:0,noEntryWindow:0,meterOrTempo:0,
 vocalConflict:0,harmony:0,eligiblePairs:0,insufficientObservedBeatFit:0,fullBeatCandidates:0,
 renderingNotYetVerified:0,windowsEvaluated:0,plans:[],
 eligibility:'SHA-bound whole-file evidence, structural exit with separated-vocal quiet tail, same meter and bar count, tempo within 5%, no simultaneous separated vocal activity, local PCM harmonic gate; independent actual attack fit and rendering follow.',
 modelAccuracyIsNotHumanGroundTruth:true};
function voiced(w,t){
 const i=Math.round((t-w.vocalStart)/.1),v=w.vocalRms?.[i],m=w.mixRms?.[i];
 return !Number.isFinite(v)||!Number.isFinite(m)||v>=.004||v/Math.max(m,.003)>=.08;
}
function voiceCompatible(a,b,rate){
 for(let t=0;t<a.end-a.start;t+=.1)if(voiced(a,a.start+t)&&voiced(b,b.start+t*rate))return false;
 return true;
}
for(const [from,a] of tracks){
 for(const [to,b] of tracks){
  if(from===to)continue;report.consideredPairs++;
  if(a.sha===b.sha||from.replace('/bassi/','/')===to.replace('/bassi/','/')){report.sameRecording++;continue;}
  const aa=features.get(from),bb=features.get(to);
  if(!aa||!bb){report.missingWholeRecording++;continue;}
  const exits=aa.windows.filter(w=>w.role==='exit'),entries=bb.windows.filter(w=>w.role==='entry');
  if(!exits.length){report.noExitWindow++;continue;}
  if(!entries.length){report.noEntryWindow++;continue;}
  let metrical=false,vocal=false,harmonic=false,winner=null;
  for(const x of exits)for(const y of entries){
   report.windowsEvaluated++;
   const fade=x.end-x.start,rate=(y.end-y.start)/fade;
   if(x.beatsPerBar!==y.beatsPerBar||x.bars!==y.bars||rate<.95||rate>1.05)continue;
   metrical=true;
   if(!voiceCompatible(x,y,rate))continue;vocal=true;
   const harmony=engine.pcmFullHarmony(x.pcm,y.pcm,x.start,y.start,rate,fade);
   if(!harmony)continue;harmonic=true;
   const fit=engine.pcmFullBeatFit(x.pcm,y.pcm,x.start,y.start,rate,fade);
   if(!fit)continue;
   const downbeatErrors=x.downbeats.map((t,i)=>t-x.start-(y.downbeats[i]-y.start)/rate);
   if(downbeatErrors.some(t=>!Number.isFinite(t)||Math.abs(t)>.075))continue;
   const downbeatRms=Math.sqrt(downbeatErrors.reduce((s,x)=>s+x*x,0)/downbeatErrors.length);
   if(downbeatRms>.04)continue;
   const cue={kind:'beat',measuredFullBeat:true,structuralBeat:true,nativeTailFullBeat:false,
    preserveTail:false,quietCertified:false,silenceTrim:false,softTailTrim:false,
    begin:x.start,end:x.end,fade,entry:y.start,tempo:rate,nominalTempo:x.bpm/y.bpm,vocalFadeSeconds:x.vocalFadeSeconds,
    sourceTempoBpm:x.bpm,targetTempoBpm:y.bpm,gain:1,sourceSha:a.sha,targetSha:b.sha,
    beatAnchor:x.start,nextBeat:y.start,beatPeriod:60/x.bpm,
    measuredBeatCount:fit.beats,beatPulseAgreement:fit.ratio,measuredPlacementError:fit.rms,
    grooveScore:fit.score,fullOnsetFirst:fit.firstHalf,fullOnsetSecond:fit.secondHalf,
    measuredPulseMode:fit.observedPulses,fullPulseFirst:fit.firstBeats,
    fullPulseSecond:fit.secondBeats,fullPulseAttackSupport:fit.attackSupport,
    percussiveIntro:!!harmony.percussiveIntro,harmonicMode:harmony.compatibleKey?'compatible-key':harmony.percussiveIntro?'percussion':'local-chords',
    harmonicEvidence:harmony,introPcmVersion:3,outroPcmVersion:3,
    harmonicScore:harmony.average,harmonicWeakest:harmony.weakest,
    score:fit.score,structuralEvidence:{version:1,fromWindow:x.id,toWindow:y.id,
     bars:x.bars,beatsPerBar:x.beatsPerBar,sourceBoundary:x.sectionAnchor,targetBoundary:y.sectionAnchor,
     sourcePhaseConfidence:x.metricalPhaseConfidence,targetPhaseConfidence:y.metricalPhaseConfidence,
     downbeatRms,
     outgoingVocalTail:x.endGuard,simultaneousVocalFrames:0,
     sourcePhrase:x.phrase,targetPhrase:y.phrase,semanticLabelsVerified:false,humanVerified:false}};
   if(!winner||cue.score>winner.score)winner=cue;
  }
  if(!metrical){report.meterOrTempo++;continue;}
  if(!vocal){report.vocalConflict++;continue;}
  if(!harmonic){report.harmony++;continue;}
  report.eligiblePairs++;
  if(!winner){report.insufficientObservedBeatFit++;continue;}
  report.plans.push({from,to,cue:winner});report.fullBeatCandidates++;
 }
}
report.renderingNotYetVerified=report.plans.length;
report.successOnEligible=report.eligiblePairs?report.plans.length/report.eligiblePairs:null;
report.successOnFullCatalog=report.plans.length/report.possibleOrderedPairs;
report.overlapSeconds=report.plans.map(p=>p.cue.fade).sort((a,b)=>a-b);
report.averageOverlap=report.plans.length?report.overlapSeconds.reduce((s,x)=>s+x,0)/report.plans.length:null;
const out=arg('report','structural-report.json');fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,plans:undefined,overlapSeconds:undefined}));
