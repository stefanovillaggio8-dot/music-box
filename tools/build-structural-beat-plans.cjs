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
  for(const w of e.windows){
   const lo=Math.max(0,Math.floor((w.start-.3)/.1)),hi=Math.ceil((w.start+.35)/.1);
   const clear=hi-lo>=5&&hi<=e.vocalRms.length&&Array.from({length:hi-lo},(_,i)=>lo+i).every(i=>
    Number.isFinite(e.vocalRms[i])&&Number.isFinite(e.mixRms[i])&&e.vocalRms[i]<.004&&e.vocalRms[i]/Math.max(e.mixRms[i],.003)<.08);
   w.incomingLeadVocalGuard={start:w.start-.3,end:w.start+.35,clear,method:'spleeter-2stems-energy-precontext-v1',notHumanVerified:true};
  }
 }
}
const tracks=Object.entries(index.entries).filter(([,e])=>e.status==='ok');
if(!partial&&features.size!==tracks.length)throw Error('Incomplete structure coverage '+features.size+'/'+tracks.length);
const tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(root,'tools'));
const guardedTracks=tracks.map(([key,e])=>[key,engine.withGuardedLRC(e)]);
const report={version:1,completeCoverage:!partial,features:features.size,tracks:tracks.length,
 possibleOrderedPairs:tracks.length*(tracks.length-1),consideredPairs:0,sameRecording:0,
 missingWholeRecording:0,noExitWindow:0,positiveLyricVeto:0,noEntryWindow:0,meterOrTempo:0,
 vocalConflict:0,harmony:0,eligiblePairs:0,insufficientObservedBeatFit:0,fullBeatCandidates:0,
 renderingNotYetVerified:0,windowsEvaluated:0,metricalRhythmicCandidates:0,plans:[],
 eligibility:'SHA-bound whole-file evidence, structural exit with separated-vocal quiet tail, same meter and bar count, tempo within 5%, no simultaneous separated vocal activity, local PCM harmonic gate; independent actual attack fit and rendering follow.',
 modelAccuracyIsNotHumanGroundTruth:true};
function voiced(w,t){
 const i=Math.round((t-w.vocalStart)/.1),v=w.vocalRms?.[i],m=w.mixRms?.[i];
 return !Number.isFinite(v)||!Number.isFinite(m)||v>=.004||v/Math.max(m,.003)>=.08;
}
function voiceCompatible(a,b,rate){
 if(rate!==1&&[0,.1,.2].some(t=>voiced(a,a.start+t))&&!b.incomingLeadVocalGuard.clear)return false;
 for(let t=0;t<a.end-a.start;t+=.1)if(voiced(a,a.start+t)&&voiced(b,b.start+t*rate))return false;
 return true;
}
// A separate rhythmic category for different accent patterns. It never
// earns the unchanged >=90% complete-PCM certificate. Require coherent
// whole-window metrical hypotheses AND independently observed shared
// attacks on every bar, including all downbeats, at stricter timing.
function metricalFit(aa,bb,x,y,rate){
 const bars=(e,w)=>e.reliableBars.filter(b=>b.start>=w.start-.001&&b.end<=w.end+.001);
 const ax=bars(aa,x),by=bars(bb,y);
 if(ax.length!==x.bars||by.length!==y.bars)return null;
 const errors=[],shared=[],counts=[];
 const peak=(w,t)=>{
  let value=0;for(const delta of [-.02,0,.02]){const i=Math.round((t+delta-w.pcm.start)/w.pcm.step);value=Math.max(value,w.pcm.onset[i]||0);}return value;
 };
 for(let bar=0;bar<ax.length;bar++){
  const a=ax[bar],b=by[bar];
  if(a.modelBeats.length!==b.modelBeats.length)return null;
  for(let i=0;i<a.modelBeats.length;i++)errors.push(a.modelBeats[i]-x.start-(b.modelBeats[i]-y.start)/rate);
  if(!a.beats.some(t=>Math.abs(t-a.start)<=.05)||!b.beats.some(t=>Math.abs(t-b.start)<=.05))return null;
  let count=0;const used=new Set();
  for(const t of a.beats){
   const options=b.beats.map((u,i)=>({u,i,error:t-x.start-(u-y.start)/rate})).filter(r=>!used.has(r.i)&&Math.abs(r.error)<=.035&&peak(x,t)>=.35&&peak(y,r.u)>=.35).sort((a,b)=>Math.abs(a.error)-Math.abs(b.error));
   if(options.length){used.add(options[0].i);count++;shared.push(options[0].error);}
  }
  if(count<2)return null;counts.push(count);
 }
 const rms=values=>Math.sqrt(values.reduce((s,x)=>s+x*x,0)/values.length),gridRms=rms(errors),actualRms=rms(shared);
 if(shared.length<8||gridRms>.025||Math.max(...errors.map(Math.abs))>.05||actualRms>.020)return null;
 const certificate={method:'shared-observed-attacks-plus-metrical-hypotheses-v1',
  gridRms,gridMaximum:Math.max(...errors.map(Math.abs)),observedSharedRms:actualRms,
  observedShared:shared.length,minimumSharedPerBar:Math.min(...counts),observedDownbeats:ax.length,
  modelGridPoints:errors.length,sourceObserved:x.beats.length,targetObserved:y.beats.length,
  humanMetricalReference:false};
 return {beats:shared.length,ratio:shared.length/Math.max(x.beats.length,y.beats.length),rms:actualRms,
  onset:1-gridRms/.10,score:1-gridRms/.10,firstHalf:null,secondHalf:null,observedPulses:false,
  firstBeats:counts.slice(0,counts.length/2).reduce((s,x)=>s+x,0),secondBeats:counts.slice(counts.length/2).reduce((s,x)=>s+x,0),
  attackSupport:1,metricalCertificate:certificate};
}
for(const [from,a] of guardedTracks){
 for(const [to,b] of guardedTracks){
  if(from===to)continue;report.consideredPairs++;
  if(a.sha===b.sha||from.replace('/bassi/','/')===to.replace('/bassi/','/')){report.sameRecording++;continue;}
  const aa=features.get(from),bb=features.get(to);
  if(!aa||!bb){report.missingWholeRecording++;continue;}
  const allExits=aa.windows.filter(w=>w.role==='exit'),entries=bb.windows.filter(w=>w.role==='entry');
  const exits=allExits.filter(w=>![a.lastVoiceAt,a.lastLyricAt,...(a.lyricStarts||[])].some(t=>Number.isFinite(t)&&t>=w.end-1.2&&t<w.end));
  if(allExits.length&&!exits.length){report.positiveLyricVeto++;continue;}
  if(!exits.length){report.noExitWindow++;continue;}
  if(!entries.length){report.noEntryWindow++;continue;}
  let metrical=false,vocal=false,harmonic=false,winner=null;const alternatives=[];
  for(const x of exits)for(const y of entries){
   report.windowsEvaluated++;
   const fade=x.end-x.start,spanRate=(y.end-y.start)/fade;
   if(x.beatsPerBar!==y.beatsPerBar||x.bars!==y.bars||spanRate<.95||spanRate>1.05)continue;
   metrical=true;
   for(const rate of [...new Set([1,spanRate])]){
   if(y.start+fade*rate+2.1>bb.duration)continue;
   if(!voiceCompatible(x,y,rate))continue;vocal=true;
   const harmony=engine.pcmFullHarmony(x.pcm,y.pcm,x.start,y.start,rate,fade);
   if(!harmony)continue;harmonic=true;
   const strictFit=engine.pcmFullBeatFit(x.pcm,y.pcm,x.start,y.start,rate,fade);
   const fit=strictFit||metricalFit(aa,bb,x,y,rate);
   if(!fit)continue;
   const downbeatErrors=x.downbeats.map((t,i)=>t-x.start-(y.downbeats[i]-y.start)/rate);
   if(downbeatErrors.some(t=>!Number.isFinite(t)||Math.abs(t)>.075))continue;
   const downbeatRms=Math.sqrt(downbeatErrors.reduce((s,x)=>s+x*x,0)/downbeatErrors.length);
   if(downbeatRms>.04)continue;
   const cue={kind:'beat',measuredFullBeat:!!strictFit,metricalRhythmic:!strictFit,structuralBeat:true,nativeTailFullBeat:false,
    preserveTail:false,quietCertified:false,silenceTrim:false,softTailTrim:false,
    begin:x.start,end:x.end,fade,entry:y.start,tempo:rate,nominalTempo:x.bpm/y.bpm,vocalFadeSeconds:x.vocalFadeSeconds,
    sourceTempoBpm:x.bpm,targetTempoBpm:y.bpm,gain:1,sourceSha:a.sha,targetSha:b.sha,
    nativeRatePreferred:rate===1&&fit.rms<=.025,
    beatAnchor:x.start,nextBeat:y.start,beatPeriod:60/x.bpm,
    measuredBeatCount:fit.beats,beatPulseAgreement:fit.ratio,measuredPlacementError:fit.rms,
    grooveScore:fit.score,fullOnsetFirst:fit.firstHalf,fullOnsetSecond:fit.secondHalf,
    measuredPulseMode:fit.observedPulses,fullPulseFirst:fit.firstBeats,
    fullPulseSecond:fit.secondBeats,fullPulseAttackSupport:fit.attackSupport,
    percussiveIntro:!!harmony.percussiveIntro,harmonicMode:harmony.compatibleKey?'compatible-key':harmony.percussiveIntro?'percussion':'local-chords',
    harmonicEvidence:harmony,introPcmVersion:3,outroPcmVersion:3,
    harmonicScore:harmony.average,harmonicWeakest:harmony.weakest,
    score:fit.score,structuralEvidence:{version:1,fromWindow:x.id,toWindow:y.id,
     pulseCheck:{source:x.beats.map(t=>t-x.start),target:y.beats.map(t=>t-y.start),sourceBars:x.downbeats.slice(0,-1).map(t=>t-x.start),targetBars:y.downbeats.slice(0,-1).map(t=>(t-y.start)/rate)},
     bars:x.bars,beatsPerBar:x.beatsPerBar,sourceBoundary:x.sectionAnchor,targetBoundary:y.sectionAnchor,
     metricalCertificate:fit.metricalCertificate||null,
     sourcePhaseConfidence:x.metricalPhaseConfidence,targetPhaseConfidence:y.metricalPhaseConfidence,
     downbeatRms,
     outgoingVocalTail:x.endGuard,simultaneousVocalFrames:0,
     outgoingVoiceDuringEntry:[0,.1,.2].some(t=>voiced(x,x.start+t)),incomingLeadVocalGuard:y.incomingLeadVocalGuard,
     sourcePhrase:x.phrase,targetPhrase:y.phrase,semanticLabelsVerified:false,humanVerified:false}};
   alternatives.push(cue);
   if(!winner||cue.measuredFullBeat&&!winner.measuredFullBeat||cue.measuredFullBeat===winner.measuredFullBeat&&
     (cue.nativeRatePreferred&&!winner.nativeRatePreferred||cue.nativeRatePreferred===winner.nativeRatePreferred&&cue.score>winner.score))winner=cue;
   }
  }
  if(!metrical){report.meterOrTempo++;continue;}
  if(!vocal){report.vocalConflict++;continue;}
  if(!harmonic){report.harmony++;continue;}
  report.eligiblePairs++;
  if(!winner){report.insufficientObservedBeatFit++;continue;}
  const selected=[winner];
  for(const cue of alternatives.sort((a,b)=>Number(b.measuredFullBeat)-Number(a.measuredFullBeat)||Number(b.nativeRatePreferred)-Number(a.nativeRatePreferred)||b.score-a.score)){
   if(selected.length>=6)break;
   if(selected.every(p=>Math.abs(p.end-cue.end)>=2||Math.abs(p.entry-cue.entry)>=2||Math.abs(p.tempo-cue.tempo)>.0001))selected.push(cue);
  }
  selected.forEach((cue,i)=>report.plans.push({from,to,primary:i===0,cue}));
  if(winner.measuredFullBeat)report.fullBeatCandidates++;else report.metricalRhythmicCandidates++;
 }
}
report.renderingNotYetVerified=report.plans.length;
report.candidateWindows=report.plans.length;
report.candidatePairs=report.fullBeatCandidates+report.metricalRhythmicCandidates;
report.fullSuccessOnEligible=report.eligiblePairs?report.fullBeatCandidates/report.eligiblePairs:null;
report.successOnEligible=report.eligiblePairs?report.candidatePairs/report.eligiblePairs:null;
report.successOnFullCatalog=report.candidatePairs/report.possibleOrderedPairs;
report.overlapSeconds=report.plans.filter(p=>p.primary).map(p=>p.cue.fade).sort((a,b)=>a-b);
report.averageOverlap=report.candidatePairs?report.overlapSeconds.reduce((s,x)=>s+x,0)/report.candidatePairs:null;
const out=arg('report','structural-report.json');fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,plans:undefined,overlapSeconds:undefined}));
