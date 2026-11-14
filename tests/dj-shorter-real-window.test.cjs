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
