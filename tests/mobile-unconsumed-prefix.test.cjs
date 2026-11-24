'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const oldArgs=process.argv;process.argv=[...oldArgs,'--platform=safari','--personal-only=true','--exclude-playlists=Ste:gym'];
const text=fs.readFileSync(path.join(__dirname,'../tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
const {members,engine,lookup}=new Function('require','__dirname',text.slice(0,text.indexOf('(async()=>'))+'return {members,engine,lookup}')(require,path.resolve(__dirname,'../tools'));
process.argv=oldArgs;const list=members('Ste'),a=lookup(list.find(t=>t.file==='songs/track-38.mp3')),b=lookup(list.find(t=>t.file==='songs/track-50.mp3'));
const old=require('../audits/ste-phone-silent-20261123/filtered-underlay-before.json');
test('actual Ste filtered 9% intro cannot be consumed as if its first 5.454 seconds had been heard',()=>{
 assert.equal(a.sha,old.sourceSha);assert.equal(b.sha,old.targetSha);
 assert.equal(engine.musicallyCompatibleOverlay(a,b,old.cue),false);
 assert.equal(engine.mobileMixAllowed(old.cue,a,a.lastLyricAt),false);
 const p=engine.playbackTransition(a,b,a.duration);assert.ok(!p||!p.neutralAmbientUnderlay);
});
test('existing Safari full and metrical partial controls keep their actual certification',()=>{
 for(const [from,to,full] of [[705,50,true],[4,38,false]]){
  const x=lookup(list.find(t=>t.file==='songs/track-'+from+'.mp3')),y=lookup(list.find(t=>t.file==='songs/track-'+to+'.mp3'));
  const p=engine.playbackTransition(x,y,x.duration);assert.equal(p.measuredFullBeat,full);assert.equal(p.metricalRhythmic,!full);
 }
});
