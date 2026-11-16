"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function fixture(options={}){
 const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
 const {engine,members,lookup}=new Function('require','__dirname',source.slice(0,source.indexOf('(async()=>'))+'return {engine,members,lookup};')(require,path.join(root,'tools'));
 const list=members('Diego'),get=id=>list.find(t=>t.id==='b-track-'+id),from=get(359),target=get(135),alternative=get(280),predecessor=get(353);
 let selected=null,reads=0,pool=[target,alternative,predecessor];
 const app={currentId:()=>from.id,allTracks:()=>list,mixUrl:t=>t.url,mixRunningContext:()=>({sampleRate:48000}),
  mixShuffleCandidates:()=>pool,mixShufflePool:()=>++reads>1&&options.removePredecessor?[target,alternative]:pool,
  mixShuffleSelection:()=>({manualCount:options.manual?1:0,userReordered:!!options.reordered}),
  mixLyricCues:id=>options.lateVoice&&id===predecessor.id?{last:lookup(predecessor).duration,starts:[lookup(predecessor).duration-.1]}:null,
  mixSelectShuffle:r=>{assert.ok(pool.some(t=>t.id===r.pickId));selected=r;return true}};
 return {engine,lookup,from,target,alternative,predecessor,app,selected:()=>selected,
  run:()=>engine.intelligentShuffle(app,{duration:lookup(from).duration,currentTime:0},from.id)};
}
test('actual Diego shuffle preserves a fresh certified follower without calling its current natural change a beatmatch',async()=>{
 const f=fixture();await f.run();assert.equal(f.selected().pickId,f.predecessor.id,'prepare the certified successor instead of spending its follower');
 const d=f.engine.decision();assert.deepEqual(Array.from(d.futurePartnerReservation.futureSources),[f.predecessor.id]);
 assert.equal(d.beatCandidates,0);assert.ok(d.futurePartnerReservation.checkedLinks<=128);
 const a=f.lookup(f.predecessor),b=f.lookup(f.target),cue=f.engine.transition(a,b,a.duration);
 assert.equal(cue.measuredFullBeat,true);assert.equal(cue.entry,0);assert.equal(f.engine.desktopBeatPairCertified(a,b,cue),true);
});
test('reservation cannot survive a predecessor removed from the latest fresh pool',async()=>{
 const f=fixture({removePredecessor:true});await f.run();assert.equal(f.engine.decision().futurePartnerReservation,null);
});
test('reservation respects manual and user-reordered queues',async()=>{
 for(const options of [{manual:true},{reordered:true}]){const f=fixture(options);await f.run();assert.equal(f.engine.decision().futurePartnerReservation,null);}
});
test('new local lyrics veto a future partner whose acoustic handoff no longer passes',async()=>{
 const f=fixture({lateVoice:true});await f.run();assert.equal(f.engine.decision().futurePartnerReservation,null);
});

// Actual personal-library members and the actual planner, without a shuffled
// seed or a hand-built beat certificate. The current two postludes are equal;
// only the future source->follower is a verified full beatmatch.
function personalPostlude(options={}){
 const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tools/simulate-library-listening.cjs'),'utf8').replace(/^#![^\n]*\n/,'');
 const {engine,members,lookup}=new Function('require','__dirname',source.slice(0,source.indexOf('(async()=>'))+'return {engine,members,lookup};')(require,path.join(root,'tools'));
 const list=members('Ste'),get=id=>list.find(t=>t.id==='b-track-'+id),from=get(208),follower=get(50),predecessor=get(705),spare=get(105);
 const pool=[follower,predecessor,spare];let selected=null,reads=0;
 if(options.delayedIntro)lookup(predecessor).musicalContent={...lookup(predecessor).musicalContent,audibleStart:.5};
 if(options.staleContent)lookup(predecessor).musicalContent={...lookup(predecessor).musicalContent,sourceSha:'a'.repeat(40)};
 const app={currentId:()=>from.id,allTracks:()=>list,mixUrl:t=>t.url,mixRunningContext:()=>({sampleRate:48000}),
  mixShuffleCandidates:()=>pool,mixShufflePool:()=>++reads>1&&options.removed?[follower,spare]:pool,
  mixShuffleSelection:()=>({manualCount:options.manual?1:0,userReordered:!!options.reordered}),
  mixLyricCues:id=>options.lateVoice&&id===predecessor.id?{last:lookup(predecessor).duration,starts:[lookup(predecessor).duration-.1]}:null,
  mixSelectShuffle:r=>{selected=r;return true}};
 return {engine,lookup,from,follower,predecessor,selected:()=>selected,
  run:()=>engine.intelligentShuffle(app,{duration:lookup(from).duration,currentTime:0},from.id)};
}
test('equal validated personal postludes prepare a full successor instead of consuming its follower',async()=>{
 const f=personalPostlude();await f.run();assert.equal(f.selected()?.pickId,f.predecessor.id);
 const d=f.engine.decision();assert.equal(d.futurePartnerReservation.currentTransition,'identical-validated-postlude');
 assert.equal(d.beatCandidates,0);assert.equal(d.partialBeatCandidates,0);
 const a=f.lookup(f.from),b=f.lookup(f.predecessor),z=f.lookup(f.follower);
 const x=f.engine.playbackTransition(a,b,a.duration),y=f.engine.playbackTransition(a,z,a.duration);
 for(const key of ['begin','end','fade','gain','entry','tempo'])assert.equal(x[key],y[key]);
 assert.equal(x.preserveTail,true);assert.ok(x.begin>a.last);assert.equal(f.engine.transition(b,z,b.duration).measuredFullBeat,true);
});
test('postlude preparation requires fresh PCM-bound immediate openings and a still-valid future full',async()=>{
 for(const options of [{delayedIntro:true},{staleContent:true},{lateVoice:true},{removed:true},{manual:true},{reordered:true}]){
  const f=personalPostlude(options);await f.run();assert.notEqual(f.engine.decision().futurePartnerReservation?.currentTransition,'identical-validated-postlude',JSON.stringify(options));
 }
});
