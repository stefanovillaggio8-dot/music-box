"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const tool=fs.readFileSync(path.join(__dirname,'../tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine};')(require,path.join(__dirname,'../tools'));
function fixture(){
 const notes=[.23,.01,.01,.01,.21,.01,.01,.23,.01,.01,.01,.25];
 const section=(start,end)=>({start,end,step:.02,
  onset:Array.from({length:Math.ceil((end-start)/.02)},(_,i)=>.05+Math.exp(-Math.pow(((i*.02+.25)%.5-.25)/.035,2))),
  beats:Array.from({length:Math.floor((end-start)/.5)},(_,i)=>start+i*.5),
  harmony:Array.from({length:Math.floor((end-start)/.5)-1},(_,i)=>({t:start+.5+i*.5,notes}))});
 const pcm=sha=>({version:1,sha,method:'original-pcm-onset-chroma-20ms',intro:section(0,20),outro:section(80,100.1)});
 const a={sha:'old',duration:100.1,last:100,bpm:120,chroma:notes,lastLyricAt:75,pcmTransition:pcm('old')};
 const b={sha:'new',duration:180,last:179,bpm:120,chroma:notes,first:0,safeIntroAt:0,introDrive:.8,firstLyricAt:12,pcmTransition:pcm('new')};
 return {a,b};
}
test('complete PCM bridge aligns eight or more actual beats across both halves',()=>{
 const {a,b}=fixture(),p=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.ok(p);assert.equal(p.kind,'beat');assert.ok(p.fade>=4.5);assert.ok(p.measuredBeatCount>=8);
 assert.ok(p.measuredPlacementError<.001);assert.ok(p.harmonicScore>.99);
 assert.equal(engine.desktopBeatPairCertified(a,b,p),true);
 for(const field of ['begin','end','entry','tempo','gain'])assert.equal(engine.desktopBeatPairCertified(a,b,{...p,[field]:p[field]+.1}),false);
});
test('full beatmix requires source identity, independent rhythm and vocal safety',()=>{
 const {a,b}=fixture();
 assert.equal(engine.measuredFullBeatBridge({...a,sha:'changed'},b,a.duration),null);
 assert.equal(engine.measuredFullBeatBridge(a,{...b,firstLyricAt:null},a.duration),null);
 assert.equal(engine.measuredFullBeatBridge({...a,lastLyricAt:99},b,a.duration),null);
 assert.equal(engine.measuredFullBeatBridge(a,{...b,firstLyricAt:3},a.duration),null);
 const flat=structuredClone(b);flat.pcmTransition.intro.onset.fill(.1);
 assert.equal(engine.measuredFullBeatBridge(a,flat,a.duration),null);
 const drift=structuredClone(b);drift.pcmTransition.intro.beats=drift.pcmTransition.intro.beats.map((t,i)=>t+i*.035);
 assert.equal(engine.measuredFullBeatBridge(a,drift,a.duration),null);
 const wrong=structuredClone(b);wrong.pcmTransition.intro.harmony.forEach(x=>x.notes=x.notes.map((v,i,all)=>all[(i+2)%12]));
 assert.equal(engine.measuredFullBeatBridge(a,wrong,a.duration),null);
});
