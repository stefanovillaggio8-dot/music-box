'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine,tracks}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks};')(require,path.join(root,'tools'));
const entries=new Map(tracks);
for(const [from,to] of [['audio/songs/track-4.mp3','audio/songs/track-38.mp3'],['audio/songs/track-705.mp3','audio/songs/track-50.mp3'],['audio/songs/bassi/track-53.mp3','audio/songs/bassi/track-51.mp3']]){
 test(`protected rhythmic tail preserves the actual recording: ${from} -> ${to}`,()=>{
  const a=entries.get(from),b=entries.get(to),p=engine.transition(a,b,a.duration),record=a.structuralBeatPlans[b.sha];
  assert.equal(p.measuredFullBeat,false);assert.equal(p.metricalRhythmic,true);assert.equal(p.rhythmicTailWindow,true);
  assert.equal(p.entry,0);assert.equal(p.end,a.duration);assert.equal(p.composite.outgoingEnvelope,'unity-through-decoded-eof-v1');
  assert.equal(engine.desktopBeatPairCertified(a,b,p),true);assert.ok(p.composite.postRenderRhythm.agreement>=.9);
  assert.equal(p.composite.resampledCommonProof.assetSha256,p.composite.sha256);assert.equal(p.composite.resampledCommonProof.rhythm.accepted,true);
  const validate=c=>engine.validatePreservedFileTailCue(record,c,a,b,a.duration);
  for(const mutate of [c=>c.measuredFullBeat=true,c=>c.entry=.1,c=>c.end-=1,
   c=>c.structuralEvidence.rhythmicWindow.seconds+=.2,c=>c.composite.postRenderRhythm.tailEvidence.maximumTailOnset=.25,
   c=>c.composite.postRenderRhythm.tailEvidence.maximumRelativeRms=.51,c=>c.composite.postRenderRhythm.tailEvidence.sourceGainApplied=true,
   c=>c.composite.postRenderRhythm.tailEvidence.searchedEntireTail=false,c=>delete c.composite.resampledCommonProof,
   c=>c.composite.resampledCommonProof.assetSha256='f'.repeat(64),c=>c.composite.resampledCommonProof.rhythm.agreement=.89,
   c=>c.composite.resampledCommonProof.rhythm.rmsSeconds=.041,c=>c.composite.resampledCommonProof.oversampledPeak=1.001]){
   const changed=structuredClone(p);mutate(changed);assert.equal(validate(changed),null);
  }
 });
}
test('every previously verified full pair remains full after adding partial rhythmic tails',()=>{
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'audits/architecture-20261115/pairs-summary.json'),'utf8'));
 const full=baseline.verifiedPairs.filter(p=>p.full);assert.equal(full.length,11);
 for(const p of full){const a=entries.get(p.from),b=entries.get(p.to),cue=engine.transition(a,b,a.duration);assert.equal(cue.measuredFullBeat,true,p.from+' -> '+p.to);assert.equal(engine.playbackTransition(a,b,a.duration).measuredFullBeat,true);}
});
test('a later original attack cannot be hidden by shortening the rhythmic window',()=>{
 const {rhythmicTail}=require('../tools/pcm-rhythmic-tail.cjs'),onset=Array(501).fill(.01);
 for(let i=0;i<=250;i+=25)onset[i]=1;
 const part={start:0,end:10,step:.02,onset};assert.ok(rhythmicTail(part,0,10,5.5));
 onset[490]=1;assert.equal(rhythmicTail(part,0,10,5.5),null,'a restarted phrase near EOF is not a quiet tail');
});
test('the actual Safari shuffle promotes a verified partial while keeping full counters separate',async()=>{
 const source=fs.readFileSync(path.join(root,'tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
 const {engine,members,lookup}=new Function('require','__dirname',source.slice(0,source.indexOf('(async()=>'))+'return {engine,members,lookup};')(require,path.join(root,'tools'));
 const list=members('Ste'),get=id=>list.find(t=>t.id==='b-track-'+id),from=get(4),target=get(38),other=get(2);let selected=null;
 const pool=[other,target],app={currentId:()=>from.id,allTracks:()=>list,mixUrl:t=>t.url,mixLyricCues:()=>null,
  mixRunningContext:()=>({sampleRate:44100}),mixShuffleCandidates:()=>pool,mixShufflePool:()=>pool,
  mixSelectShuffle:r=>{assert.ok(pool.some(t=>t.id===r.pickId));selected=r;return true}};
 await engine.intelligentShuffle(app,{duration:lookup(from).duration,currentTime:0},from.id);
 assert.equal(selected.pickId,target.id);assert.equal(engine.decision().beatCandidates,0);assert.equal(engine.decision().partialBeatCandidates,1);
});

test('the listening audit uses the actual live fallback resolver, including quiet filtered introductions',()=>{
 const a=entries.get('audio/songs/bassi/track-259.mp3'),b=entries.get('audio/songs/bassi/track-51.mp3');
 const p=engine.playbackTransition(a,b,a.duration);assert.equal(p.kind,'underlay');assert.equal(p.neutralAmbientUnderlay,true);
 assert.equal(p.preserveTail,true);assert.equal(p.entry,0);assert.ok(p.underlayVolume<=.09);assert.notEqual(p.measuredFullBeat,true);
});
test('the real boosted Gym scope prepares a future rhythmic mix instead of consuming its follower as a weak bed',async()=>{
 const source=fs.readFileSync(path.join(root,'tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
 // A URL selector fixture is pinned to the same actual boost manifest used by
 // the app. No library track or user-owned playlist is inserted or removed.
 const oldArgs=process.argv;process.argv=[...oldArgs,'--boost-list='+path.join(root,'tests/fixtures/gym-boost-manifest.json')];
 let fixture;try{fixture=new Function('require','__dirname',source.slice(0,source.indexOf('(async()=>'))+'return {engine,members,lookup};')(require,path.join(root,'tools'));}finally{process.argv=oldArgs;}
 const playlist=JSON.parse(fs.readFileSync(path.join(root,'playlist.json'),'utf8')).find(p=>p.name==='gym'),list=fixture.members('Ste',playlist);
 const get=id=>list.find(t=>t.id==='b-track-'+id),from=get(259),target=get(51),predecessor=get(53),pool=[target,...list.filter(t=>t.id!==from.id&&t.id!==target.id)];let selected=null;
 const app={currentId:()=>from.id,allTracks:()=>list,mixUrl:t=>t.url,mixLyricCues:()=>null,mixRunningContext:()=>({sampleRate:48000}),
  mixShuffleCandidates:()=>pool.slice(0,10),mixShufflePool:()=>pool,mixSelectShuffle:r=>{assert.ok(pool.some(t=>t.id===r.pickId));selected=r;return true}};
 await fixture.engine.intelligentShuffle(app,{duration:fixture.lookup(from).duration,currentTime:0},from.id);
 assert.equal(selected.pickId,predecessor.id);assert.equal(fixture.engine.decision().sequenceLookahead.measuredFullBeat,false);
 assert.equal(fixture.engine.decision().sequenceLookahead.metricalRhythmic,true);assert.equal(fixture.engine.decision().beatCandidates,0);
 const cue=fixture.engine.playbackTransition(fixture.lookup(predecessor),fixture.lookup(target),fixture.lookup(predecessor).duration);
 assert.equal(cue.metricalRhythmic,true);assert.equal(cue.entry,0);
});
