const fs=require('node:fs'),path=require('node:path');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const index=JSON.parse(fs.readFileSync(arg('index','dj-deep-analysis.json'))),report=JSON.parse(fs.readFileSync(arg('report','composite-report.json')));
let applied=0;
if(process.argv.includes('--reset-structural'))for(const e of Object.values(index.entries))delete e.structuralBeatPlans;
for(const row of report.results){
 if(row.error)continue;
 const a=index.entries[row.from],b=index.entries[row.to],p=row.cue,c=p?.composite;
 if(p?.experimentalSharedTempo||p?.sourceRate!=null)throw Error('Experimental source clock cannot be installed');
 if(!a||!b||a.sha!==p.sourceSha||b.sha!==p.targetSha||!c||c.overlapPeak>.961||c.peak>.9991||c.oversampledPeak>1||
    c.pitchPreserved!==true||c.timingVerified!==true||c.sourceSha!==a.sha||c.targetSha!==b.sha)throw Error('Unbound composite proof');
 if(p.rhythmicTailWindow&&(p.measuredFullBeat!==false||p.metricalRhythmic!==true||
   p.preservedEntrance!=='rhythmic-tail-foreground-v1'||c.resampledCommonProof?.assetSha256!==c.sha256||
   c.resampledCommonProof?.sampleRate!==44100||c.resampledCommonProof?.rhythm?.accepted!==true))throw Error('Missing actual common resampling proof');
 if(p.metricalPickupWindow&&(p.measuredFullBeat!==false||p.metricalRhythmic!==true||p.rhythmicTailWindow===true||
  p.preservedEntrance!=='metrical-pickup-033-v1'||c.renderedEntrance!==p.preservedEntrance||c.releaseSeconds!==1.5||
  c.resampledCommonProof?.assetSha256!==c.sha256||c.resampledCommonProof?.rhythm?.mode!=='metrical-rhythmic'||c.resampledCommonProof.rhythm.accepted!==true||
  !Number.isFinite(c.levelContinuity?.changeDb)||Math.abs(c.levelContinuity.changeDb)>3))throw Error('Missing observed-bar pickup render proof');
 if(p.nativeOriginalReturn&&(c.nativeSplice?.method!=='original-pcm-native-return-v1'||c.nativeSplice.targetSha!==b.sha||
  !Number.isFinite(c.nativeSplice.returnEnergyRatio)||c.nativeSplice.returnEnergyRatio<.85||c.nativeSplice.returnEnergyRatio>1.000001||
  c.nativeSplice.returnStart<c.nativeHandoffAt+.849||c.nativeSplice.returnStart>c.nativeHandoffAt+1.081||Math.abs(c.nativeSplice.returnEnd-c.nativeSplice.returnStart-.02)>.00001||
  c.nativeSplice.unmodifiedOriginalComparison!==true||!Number.isFinite(c.nativeSplice.encodedMaximumDifference)||c.nativeSplice.encodedMaximumDifference>2e-6))throw Error('Missing exact original native return');
 if(p.structuralBeat){
  if(c.rhythmVerified!==true||c.postRenderRhythm?.accepted!==true)throw Error('Missing actual rendered rhythm proof');
  if(p.structuralEvidence?.exactSilentSuffix&&(p.measuredFullBeat!==true||p.metricalRhythmic!==false||
   c.postRenderRhythm.exactSilentSuffix?.maximumPeak!==0||c.postRenderRhythm.exactSilentSuffix?.accepted!==true||
   c.resampledCommonProof?.assetSha256!==c.sha256||c.resampledCommonProof?.rhythm?.exactSilentSuffix?.maximumPeak!==0||
   c.resampledCommonProof?.rhythm?.exactSilentSuffix?.accepted!==true))throw Error('Unverified exact silent suffix');
  a.structuralBeatPlans??={};
  const existing=a.structuralBeatPlans[b.sha],cues=existing?.cues||[];
  const sameWindow=x=>['begin','end','entry','fade','tempo'].every(k=>
   Number.isFinite(x[k])&&Math.abs(x[k]-p[k])<.0001)&&
   x.measuredFullBeat===p.measuredFullBeat&&x.metricalRhythmic===p.metricalRhythmic&&x.preservedEntrance===p.preservedEntrance&&x.rhythmicTailWindow===p.rhythmicTailWindow&&x.nativeOriginalReturn===p.nativeOriginalReturn&&
   (!p.rhythmicTailWindow||Math.abs(x.structuralEvidence?.rhythmicWindow?.seconds-p.structuralEvidence?.rhythmicWindow?.seconds)<.0001);
  // A second OS/encoder may produce a different FLAC hash for the same
  // certified window. Keep the already installed verified rendition.
  if(!cues.some(x=>x.composite.sha256===p.composite.sha256||sameWindow(x)))cues.push(p);
  const native=p=>p.nativeRatePreferred===true&&p.composite.postRenderRhythm.rmsSeconds<=.025;
  // Within a 5-ms measured timing band, prefer the shorter certified
  // overlap. More simultaneous seconds do not themselves improve a mix.
  // Full/partial classification, native-rate preference and every
  // certification threshold remain unchanged.
  const timingBand=p=>Math.floor(p.composite.postRenderRhythm.rmsSeconds/.005);
  cues.sort((a,b)=>Number(b.measuredFullBeat)-Number(a.measuredFullBeat)||Number(native(b))-Number(native(a))||
    timingBand(a)-timingBand(b)||a.fade-b.fade||a.composite.postRenderRhythm.rmsSeconds-b.composite.postRenderRhythm.rmsSeconds||b.score-a.score);
  a.structuralBeatPlans[b.sha]={version:1,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration,cue:cues[0],cues};
 }else{
  const record=a.pcmBeatPlans?.[b.sha];
  if(!record||['begin','entry','fade','tempo'].some(k=>Math.abs(record.cue[k]-p[k])>.0001))throw Error('Different legacy plan');
  record.cue.composite=c;
 }
 applied++;
}
fs.writeFileSync(arg('output','dj-deep-analysis.json'),JSON.stringify(index)+'\n');
console.log(JSON.stringify({applied,failed:report.results.filter(r=>r.error).length}));
