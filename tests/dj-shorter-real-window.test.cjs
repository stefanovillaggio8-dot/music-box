'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('the actual player planner selects the shorter four-bar intact cue and retains its historical alternative',()=>{
 const root=path.resolve(__dirname,'..'),tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine,tracks}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks};')(require,path.join(root,'tools'));
 const entries=new Map(tracks),a=entries.get('audio/songs/track-1183.mp3'),b=entries.get('audio/songs/track-1198.mp3');
 const cue=engine.transition(a,b,a.duration);assert.equal(engine.desktopBeatPairCertified(a,b,cue),true);
 assert.ok(cue.fade>9&&cue.fade<11);assert.equal(cue.structuralEvidence.bars,4);assert.equal(cue.entry,0);
 assert.equal(cue.preservedFileTail,true);assert.equal(cue.end,a.duration);assert.equal(cue.sourceSha,a.sha);assert.equal(cue.targetSha,b.sha);
 assert.ok(a.structuralBeatPlans[b.sha].cues.some(p=>p.fade>13&&p.entry===0),'previous certified audio is preserved');
});

test('real Safari shuffle uses rendered precision to promote the better verified mix while respecting the fresh pool',async()=>{
 const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
 const {engine,members,lookup}=new Function('require','__dirname',source.slice(0,source.indexOf('(async()=>'))+'return {engine,members,lookup};')(require,path.join(root,'tools'));
 const list=members('Emanuele'),from=list.find(t=>t.id==='b-track-1183'),first=list.find(t=>t.id==='b-track-1070'),better=list.find(t=>t.id==='b-track-1198');
 let selected=null,pool=[first,better];
 const app={currentId:()=>from.id,allTracks:()=>[from,first,better],mixUrl:t=>t.url,mixLyricCues:()=>null,
  mixRunningContext:()=>({sampleRate:48000}),mixShuffleCandidates:()=>pool,mixShufflePool:()=>pool,
  mixSelectShuffle:r=>{assert.ok(pool.some(t=>t.id===r.pickId));selected=r;return true}};
 await engine.intelligentShuffle(app,{duration:lookup(from).duration,currentTime:0},from.id);
 assert.equal(selected.pickId,better.id);assert.equal(engine.decision().renderPreference.chosen,better.id);
 pool=[first];selected=null;await engine.intelligentShuffle(app,{duration:lookup(from).duration,currentTime:0},from.id);
 assert.equal(selected,null,'a consumed or manually excluded target cannot be reinserted');
});
