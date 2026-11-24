'use strict';
// Builds a bounded SHADOW candidate, never installs or publishes an index.
const fs=require('node:fs'),path=require('node:path');
const {currentSteScope,validateSteCases}=require('./ste-research-scope.cjs');
const root=path.resolve(__dirname,'..');
function build(folder,proofs,output){
 if(fs.existsSync(output))throw Error('Choose a new output; preserve evidence');
 const c=JSON.parse(fs.readFileSync(path.join(folder,'candidate.json'))),index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 const [pair]=validateSteCases([{from:c.from,to:c.to}],currentSteScope(),index);
 if(c.evaluationOnly!==true||pair.sourceSha!==c.sourceSha||pair.targetSha!==c.targetSha)throw Error('Changed Ste evaluation source');
 const nativeMeasurements=[];
 for(const file of fs.readdirSync(proofs).filter(f=>f.endsWith('.json'))){
  const d=JSON.parse(fs.readFileSync(path.join(proofs,file)));
  if(d.assetSha256!==c.sha256||d.sourceSha!==c.sourceSha||d.targetSha!==c.targetSha||d.evaluationOnly!==true)throw Error('Unbound native evidence');
  for(const r of d.results)for(const m of r.measurements||[])nativeMeasurements.push({...m,platform:d.platform,browser:r.browser});
 }
 const exposure=JSON.parse(fs.readFileSync(path.join(folder,'independent-exposure.json'))).find(r=>r.label==='clean-38-4'&&r.sampleRate===48000)?.introductionExposure;
 const level=JSON.parse(fs.readFileSync(path.join(folder,'preview-measurements.json'))).results.find(r=>r.label==='clean-38-4'&&r.sampleRate===48000);
 const cue={kind:'postlude',nativeCleanTail:true,measuredFullBeat:false,metricalRhythmic:false,structuralBeat:false,
  preserveTail:true,nativeTailFullBeat:true,silenceTrim:false,gain:1,
  sourceSha:c.sourceSha,targetSha:c.targetSha,begin:c.begin,end:c.end,fade:c.fade,entry:0,tempo:1,targetDuration:index.entries[c.to].duration,
  nativeCleanEvidence:{method:'original-native-near-silent-tail-v1',sourceSha:c.sourceSha,targetSha:c.targetSha,begin:c.begin,end:c.end,
   noDecoderSplice:true,sourceUnityThroughEOF:true,incomingUnityFromZero:true,notHumanListening:true,
   sourceClock:c.nativeClocks.source,nativeMeasurements,eofLevelChangeDb:level?.eofRmsChangeDb,
   introductionExposure:{...exposure,sourceSha:c.sourceSha,targetSha:c.targetSha}}};
 const record={version:1,fromSha:c.sourceSha,toSha:c.targetSha,sourceDuration:index.entries[c.from].duration,nextDuration:index.entries[c.to].duration,cue,cues:[cue]};
 const source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
 const start=source.indexOf('function validateNativeCleanTailCue('),end=source.indexOf('function validateStructuralBeatCue(',start);
 const validate=new Function('isIOS',source.slice(start,end)+'return validateNativeCleanTailCue;')(false);
 if(!validate(record,cue,index.entries[c.from],index.entries[c.to],record.sourceDuration))throw Error('Native clean evidence rejected; no shadow candidate written');
 fs.writeFileSync(output,JSON.stringify({evaluationOnly:true,notPlaybackCertified:true,from:c.from,to:c.to,record},null,2)+'\n');
 console.log('One native-element shadow candidate; full/partial/public counts unchanged');
 return record;
}
if(require.main===module){if(process.argv.length!==5)throw Error('evaluation-folder native-receipts-folder new-output.json');build(...process.argv.slice(2));}
module.exports={build};
