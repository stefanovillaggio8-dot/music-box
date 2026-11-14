'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {metricalFit}=require('../tools/pcm-metrical-fit.cjs');
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
test('drift, missing downbeats, weak attacks and sparse bars cannot earn a metrical certificate',()=>{
 for(const change of [r=>r.y.modelBeats[8]+=.2,r=>r.b.beats=r.b.beats.slice(1),r=>r.b.onset.fill(0),r=>r.b.beats=r.b.beats.filter(t=>t<4||t>=6)]){
  const r=data();change(r);assert.equal(metricalFit(r.a,r.b,r.x,r.y,100,1),null);
 }
});
