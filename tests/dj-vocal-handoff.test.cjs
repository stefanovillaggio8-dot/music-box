'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine,tracks}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks};')(require,path.join(root,'tools'));
const entries=new Map(tracks);
for(const [from,to] of [[934,1124],[700,521]])test(`real original ${from} to ${to} uses separated vocals with both recordings intact`,()=>{
 const a=entries.get('audio/songs/track-'+from+'.mp3'),b=entries.get('audio/songs/track-'+to+'.mp3'),cue=engine.transition(a,b,a.duration);
 assert.equal(engine.desktopBeatPairCertified(a,b,cue),true);assert.equal(cue.entry,0);assert.equal(cue.end,a.duration);
 assert.equal(cue.structuralEvidence.vocalOverlapPolicy,'separated-vocal-handoff-v1');
 const record=a.structuralBeatPlans[b.sha],validate=p=>engine.validatePreservedFileTailCue(record,p,a,b,a.duration);
 assert.ok(validate(cue));
 for(const mutate of [p=>p.structuralEvidence.vocalHandoff.marginSeconds=.1,
  p=>p.structuralEvidence.vocalHandoff.outgoingQuietSuffix.maxVocalRms=.004,
  p=>p.structuralEvidence.vocalHandoff.incomingQuietPrefix.end-=.2,
  p=>p.composite.postRenderRhythm.downbeatsVerified=false,p=>p.composite.oversampledPeak=1.001,
  p=>p.sourceRate=.98]){
  const changed=structuredClone(cue);mutate(changed);assert.equal(validate(changed),null);
 }
 const unsafe={...a,lastLyricAt:cue.begin+cue.structuralEvidence.vocalHandoff.at};
 assert.equal(engine.validatePreservedFileTailCue(record,cue,unsafe,b,a.duration),null,'known lyrics invalidate the supposedly quiet handoff');
});

test('separate coherent hypotheses recover an original-PCM fit that their union corrupts',()=>{
 const f=require('./fixtures/separate-metrical-grids.json');
 assert.equal(entries.get(f.from).sha,f.sourceSha);assert.equal(entries.get(f.to).sha,f.targetSha);
 assert.equal(engine.pcmFullBeatFit(f.sourceUnion,f.targetUnion,f.begin,0,f.rate,f.fade),null);
 const fit=engine.pcmFullBeatFit(f.sourceHypothesis,f.targetHypothesis,f.begin,0,f.rate,f.fade);
 assert.ok(fit);assert.ok(fit.ratio>=.9);assert.ok(fit.rms<=.04);
});
