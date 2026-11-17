'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {metricalFit,observedBarMetricalFit}=require('../tools/pcm-metrical-fit.cjs');
function data(){
 const x={start:100,end:108,bars:4,meter:4,modelBeats:Array.from({length:16},(_,i)=>100+i*.5),downbeats:[100,102,104,106,108]},
  y={...x,start:0,end:8,modelBeats:x.modelBeats.map(t=>t-100),downbeats:x.downbeats.map(t=>t-100)};
 const a={start:99,step:.02,onset:Array(500).fill(1),beats:x.modelBeats},b={start:0,step:.02,onset:Array(500).fill(1),beats:y.modelBeats};return {a,b,x,y};
}
test('partial metrical evidence counts real shared attacks on every bar without claiming full beatmatch',()=>{
 const {a,b,x,y}=data(),f=metricalFit(a,b,x,y,100,1);
 assert.equal(f.beats,16);assert.equal(f.metricalCertificate.observedDownbeats,4);
 assert.equal(f.metricalCertificate.minimumSharedPerBar,4);assert.equal(f.measuredFullBeat,undefined);
});

test('observed bar anchors refine model phase without relaxing actual paired attack or grid precision',()=>{
 const {a,b,x,y}=data();a.beats=a.beats.map(t=>t+.06);b.beats=b.beats.map(t=>t+.06);
 const source=x.downbeats.slice(0,-1).map(t=>t+.06),target=y.downbeats.slice(0,-1).map(t=>t+.06);
 assert.equal(metricalFit(a,b,x,y,100,1),null,'the old model timestamps miss the real bar attacks');
 const fit=observedBarMetricalFit(a,b,x,y,100,1,source,target);
 assert.equal(fit.beats,16);assert.ok(fit.rms<1e-10);
 assert.equal(fit.metricalCertificate.method,'observed-bar-anchors-metrical-hypotheses-v2');
 assert.ok(fit.metricalCertificate.maximumModelAnchorRefinement<=.075);
 assert.equal(fit.metricalCertificate.originalModelAnchorsRetained,true);
});

test('observed-anchor refinement refuses invented phase, actual bar drift and sparse shared attacks',()=>{
 for(const change of [r=>r.source[0]+=.08,r=>r.target[1]+=.051,r=>r.a.onset.fill(0),r=>r.b.beats=r.b.beats.filter((_,i)=>i%3===0)]){
  const r=data();r.source=r.x.downbeats.slice(0,-1);r.target=r.y.downbeats.slice(0,-1);change(r);
  assert.equal(observedBarMetricalFit(r.a,r.b,r.x,r.y,100,1,r.source,r.target),null);
 }
});
test('drift, missing downbeats, weak attacks and sparse bars cannot earn a metrical certificate',()=>{
 for(const change of [r=>r.y.modelBeats[8]+=.2,r=>r.b.beats=r.b.beats.slice(1),r=>r.b.onset.fill(0),r=>r.b.beats=r.b.beats.filter(t=>t<4||t>=6)]){
  const r=data();change(r);assert.equal(metricalFit(r.a,r.b,r.x,r.y,100,1),null);
 }
});
