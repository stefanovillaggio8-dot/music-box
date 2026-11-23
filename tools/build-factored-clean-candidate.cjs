'use strict';
// Consumes a frozen single pair and its independent recording/render evidence.
// Writes a SHADOW fixture only. It never modifies the playback index.
const fs=require('node:fs'),path=require('node:path'),{proposal}=require('./factored-native-clean.cjs');
const {currentSteScope,validateSteCases}=require('./ste-research-scope.cjs');
const root=path.resolve(__dirname,'..');
function build(data,pair,render){
 const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 validateSteCases([pair],currentSteScope(),index);
 const records=Object.values(data.recordings),a=records.find(r=>r.key===pair.from),b=records.find(r=>r.key===pair.to);
 if(a?.sourceSha!==index.entries[pair.from]?.sha||b?.sourceSha!==index.entries[pair.to]?.sha)throw Error('Changed recording identity');
 const proposed=proposal(a,b,a.quietSuffix.begin);if(!proposed.accepted)throw Error(proposed.reason);
 const rows=render.results,level=rows?.find(v=>v.sampleRate===48000),exposure=level?.introductionExposure;
 const cue={kind:'postlude',nativeCleanTail:true,measuredFullBeat:false,metricalRhythmic:false,structuralBeat:false,
  preserveTail:true,nativeTailFullBeat:true,silenceTrim:false,gain:1,sourceSha:a.sourceSha,targetSha:b.sourceSha,
  begin:proposed.begin,end:proposed.end,fade:proposed.fade,entry:0,tempo:1,targetDuration:b.duration,
  nativeCleanEvidence:{method:'original-native-near-silent-tail-v2',sourceSha:a.sourceSha,targetSha:b.sourceSha,
   begin:proposed.begin,end:proposed.end,noDecoderSplice:true,sourceUnityThroughEOF:true,incomingUnityFromZero:true,
   notHumanListening:true,sourceClock:a.clock,targetClock:b.clock,nativeMeasurements:proposed.nativeMeasurements,
   renderMeasurements:rows,eofLevelChangeDb:level?.eofLevelChangeDb,
   introductionExposure:{...exposure,sourceSha:a.sourceSha,targetSha:b.sourceSha}}};
 const record={version:1,fromSha:a.sourceSha,toSha:b.sourceSha,sourceDuration:a.duration,nextDuration:b.duration,cue,cues:[cue]};
 const source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8'),start=source.indexOf('function validateNativeCleanTailCue('),end=source.indexOf('function validateStructuralBeatCue(',start);
 const validate=new Function('isIOS',source.slice(start,end)+'return validateNativeCleanTailCue;')(false);
 if(!validate(record,cue,index.entries[pair.from],index.entries[pair.to],a.duration))throw Error('Shadow evidence rejected');
 return {evaluationOnly:true,notPlaybackCertified:true,from:pair.from,to:pair.to,record};
}
if(require.main===module){
 const [recordings,cases,renders,from,to,output]=process.argv.slice(2);
 if(!output||fs.existsSync(output))throw Error('New output required');
 const pair=JSON.parse(fs.readFileSync(cases)).find(p=>p.from===from&&p.to===to);
 if(!pair)throw Error('Pair not frozen');
 const fixture=build(JSON.parse(fs.readFileSync(recordings)),pair,JSON.parse(fs.readFileSync(renders)));
 fs.writeFileSync(output,JSON.stringify(fixture,null,2)+'\n');console.log('One factored SHADOW, no installed cue');
}
module.exports={build};
