'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {contextBarChains}=require('../tools/context-bar-chains.cjs');
const bar=(start,extra={})=>({start,end:start+2,beatsPerBar:4,modelBeats:[0,.5,1,1.5].map(t=>t+start),metricalPhaseConfidence:.95,beatProbabilityGeometricMean:.9,downbeatProbabilityMin:.9,...extra});
const bounds={start:0,end:20};

test('complementary original contexts recover a chain without inventing or moving any model event',()=>{
 const first=bar(0),last=bar(2),views=[{name:'whole-original',bars:[first]},{name:'edge-original',bars:[last]}],before=JSON.stringify(views);
 const result=contextBarChains(views,bounds);assert.equal(result.length,1);assert.deepEqual(result[0].bars,[first,last]);
 assert.equal(result[0].bars[0],first);assert.equal(result[0].bars[1],last);assert.equal(JSON.stringify(views),before);
 assert.deepEqual(result[0].contexts,[['whole-original'],['edge-original']]);
});

test('already available chains and duplicate detections do not inflate novel chain counts',()=>{
 const bars=[bar(0),bar(2),bar(4),bar(6)];
 assert.deepEqual(contextBarChains([{name:'whole-original',bars},{name:'edge-original',bars:bars.map(b=>({...b}))}],bounds),[]);
});

test('different downbeat phases, gaps, tempos, meters and weak evidence cannot be stitched',()=>{
 for(const last of [bar(2.74),bar(2.1),bar(2,{end:4.4}),bar(2,{beatsPerBar:3}),bar(2,{metricalPhaseConfidence:.79}),bar(2,{beatProbabilityGeometricMean:.69}),bar(2,{downbeatProbabilityMin:.49})])
  assert.deepEqual(contextBarChains([{name:'whole-original',bars:[bar(0)]},{name:'edge-original',bars:[last]}],bounds),[]);
 assert.throws(()=>contextBarChains([{name:'percussive',bars:[bar(0)]}],bounds),/Only original/);
});

test('four-bar path crosses contexts, stays within the selected bounds and fails closed at its cap',()=>{
 const views=[{name:'whole-original',bars:[bar(0),bar(2)]},{name:'edge-original',bars:[bar(4),bar(6)]}];
 const result=contextBarChains(views,bounds);assert.ok(result.some(c=>c.bars.length===4));
 assert.ok(contextBarChains(views,{...bounds,earliestStart:2,latestStart:2}).every(c=>c.bars[0].start===2));
 assert.deepEqual(contextBarChains(views,{...bounds,end:3}),[]);
 assert.throws(()=>contextBarChains(views,{...bounds,limit:0}),/limit exceeded/);
});
