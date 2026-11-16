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
  p.preservedEntrance!=='metrical-pickup-033-v1'||c.renderedEntrance!==p.preservedEntrance||c.releaseSeconds!==(p.metricalCadenceWindow?1.2:1.5)||
  c.resampledCommonProof?.assetSha256!==c.sha256||c.resampledCommonProof?.rhythm?.mode!=='metrical-rhythmic'||c.resampledCommonProof.rhythm.accepted!==true||
  !Number.isFinite(c.levelContinuity?.changeDb)||Math.abs(c.levelContinuity.changeDb)>3))throw Error('Missing observed-bar pickup render proof');
 if(p.metricalCadenceWindow){
  const w=p.structuralEvidence?.cadenceWindow;
  if(!p.metricalPickupWindow||p.nativeRecoveryCurve!=='sine-1.2-v1'||c.nativeRecoveryCurve!==p.nativeRecoveryCurve||p.fade>18||
   p.structuralEvidence?.bars!==4||w?.method!=='four-observed-bars-and-preserved-decay-v1'||
   !Number.isFinite(w.rhythmicSeconds)||w.rhythmicSeconds<4.5||!Number.isFinite(w.tailSeconds)||w.tailSeconds<.65||w.tailSeconds>4||
   Math.abs(w.rhythmicSeconds+w.tailSeconds-p.fade)>.001||c.cadenceTailProof?.sourceSha!==a.sha||
   !['at48000','at44100'].every(k=>{const t=c.cadenceTailProof[k];return t?.accepted===true&&t.method==='unmodified-original-hpss-tail-v1'&&
    t.sourceGainApplied===false&&t.searchedEntireTail===true&&Math.abs(t.sourceTailThrough-p.fade)<.001&&
    Math.abs(t.rhythmicSeconds-w.rhythmicSeconds)<.001&&Math.abs(t.tailSeconds-w.tailSeconds)<.001&&
    Number.isFinite(t.maximumTailOnset)&&t.maximumTailOnset>=0&&t.maximumTailOnset<.25&&
    Number.isFinite(t.maximumRelativeRms)&&t.maximumRelativeRms>=0&&t.maximumRelativeRms<=.5&&
    t.sampleRate===(k==='at48000'?48000:44100)&&Array.isArray(t.channelProofs)&&t.channelProofs.length===2&&t.channelProofs.every(v=>v.accepted===true&&v.method===t.method&&v.sampleRate===t.sampleRate&&v.sourceGainApplied===false&&v.searchedEntireTail===true&&Number.isFinite(v.maximumTailOnset)&&v.maximumTailOnset>=0&&v.maximumTailOnset<.25&&Number.isFinite(v.maximumRelativeRms)&&v.maximumRelativeRms>=0&&v.maximumRelativeRms<=.5);}))throw Error('Missing original cadence tail proof');
 }else if(p.nativeRecoveryCurve!=null||c.nativeRecoveryCurve!=null)throw Error('Unbound native recovery curve');
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
