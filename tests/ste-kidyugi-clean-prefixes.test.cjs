'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),index=require('../dj-deep-analysis.json');
const audit=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',audit.slice(0,audit.indexOf('const tracks='))+'return {engine}')(require,path.join(root,'tools'));
const source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8');
const lo=source.indexOf('function validateNativeCleanTailCue('),hi=source.indexOf('function validateStructuralBeatCue(',lo);
const iosValidate=new Function('isIOS',source.slice(lo,hi)+'return validateNativeCleanTailCue;')(true);
for(const id of [33,87,1187,138])test('installed Ste clean27→'+id+' preserves originals and never promotes its class or enables iPhone',()=>{
 const a=engine.withGuardedLRC(index.entries['audio/songs/track-27.mp3']),b=engine.withGuardedLRC(index.entries['audio/songs/track-'+id+'.mp3']);
 const record=a.structuralBeatPlans[b.sha],p=engine.playbackTransition(a,b,a.duration);
 assert.ok(record);assert.equal(p.nativeCleanTail,true);assert.equal(p.kind,'postlude');
 assert.equal(p.measuredFullBeat,false);assert.equal(p.metricalRhythmic,false);assert.equal(p.entry,0);assert.equal(p.tempo,1);assert.equal(p.gain,1);
 assert.equal(p.begin,144.593);assert.equal(p.end,a.duration);assert.equal(p.preserveTail,true);
 assert.equal(iosValidate(record,record.cue,a,b,a.duration),null);
 assert.equal(p.nativeCleanEvidence.nativeMeasurements.length,8);
});
