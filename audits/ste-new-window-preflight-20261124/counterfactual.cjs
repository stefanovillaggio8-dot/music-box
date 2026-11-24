'use strict';
// BOUNDED counterfactual classification only. Voice veto and plans unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),tool=path.join(root,'tools/build-preserved-tail-plans.cjs');
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('New output required');
const original=fs.readFileSync(tool,'utf8');let code=original;
const veto="if(!incomingClear&&(!outgoingGuard?.clear||knownOutgoing)&&!handoff){excluded('voice');continue;}";
if(code.split(veto).length!==2)throw Error('Owning voice gate changed; review before reuse');
code=code.replace(veto,`if(!incomingClear&&(!outgoingGuard?.clear||knownOutgoing)&&!handoff){
 const h=engine.pcmFullHarmony(pairOut,pairIn,begin,0,rate,fade)||engine.pcmPreservedTailHarmony(pairOut,pairIn,begin,rate,fade,'first-attack-033-v1');
 const diagnosis={},fit=engine.pcmFullBeatFit(pairOut,pairIn,begin,0,rate,fade,diagnosis);
 report.counterfactual.push({from:a.key,to:b.key,sourceSha:a.raw.sha,targetSha:b.raw.sha,begin,end,fade,tempo:rate,
  sourceView:x.analysisView,targetView:y.analysisView,sourceBars:x.bars,targetBars:y.bars,
  wouldMeetCachedHarmony:!!h,wouldMeetCachedFullPulse:!!fit,pulseDiagnostic:diagnosis,
  incomingGuard:guard,outgoingGuard,knownOutgoing,neverCertifiesAbsenceOfVoice:true,installed:false});
 excluded('voice');continue;}`);
const marker="const output=arg('output','preserved-tail-plans.json');";
code=code.replace('const report={version:1,','const report={counterfactual:[],version:1,');
code=code.replace(marker,"report.counterfactualProtocol={boundedCases:3,unchangedVoiceVeto:true,newPcmDecodes:0,newInference:0,compilerSha256:'"+crypto.createHash('sha256').update(original).digest('hex')+"'};"+marker);
process.argv.push('--cases='+path.join(__dirname,'cases.json'),'--structure='+path.join(root,'../whole-structure-ci'),'--pcm='+path.join(root,'../pcm-v3'),'--diagnostics=true','--output='+path.resolve(output));
const req=require('node:module').createRequire(tool);
new Function('require','__dirname',code)(req,path.dirname(tool));
