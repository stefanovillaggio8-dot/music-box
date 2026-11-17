'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {placements}=require('../tools/pcm-affine-placements.cjs');
test('robust candidate recovers a measured bar alignment despite one mislocated attack',()=>{
 const pairs=Array.from({length:12},(_,i)=>[100+i*.5,i*.5+(i===5?.18:0)]);
 const result=placements(pairs,[[100,0],[102,2],[104,4]],1);
 assert.ok(result.some(p=>p.rate===1&&Math.abs(p.begin-100)<.00001));
 assert.ok(result.every(p=>Math.abs(p.begin-100)<=.025));
});
test('no robust candidate can hide contradictory measured bars or excessive stretch',()=>{
 assert.deepEqual(placements([],[[100,0],[102,2.3]],1),[]);
 assert.deepEqual(placements([],[[100,0],[102,2]],1.2),[]);
 assert.deepEqual(placements([[100,NaN]],[[100,0]],1),[]);
});
