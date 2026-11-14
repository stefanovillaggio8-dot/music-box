'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const {shortlist}=require('../tools/shortlist-musical-windows.cjs');
test('shorter valid musical windows survive the bounded shortlist alongside precise, native and longer alternatives',()=>{
 const long=Array.from({length:8},(_,i)=>({begin:100+i*.001,fade:14-i*.001,tempo:1.02+i*.0002,fit:{beats:24,rms:.02+i*.001}}));
 const short={begin:109,fade:5,tempo:1.01,fit:{beats:8,rms:.022}},native={begin:105,fade:9,tempo:1,fit:{beats:16,rms:.023}};
 const result=shortlist([...long,short,native]);assert.equal(result.length,4);assert.ok(result.includes(short));assert.ok(result.includes(native));assert.ok(result.includes(long[0]));
 assert.deepEqual(shortlist([]),[]);
});
