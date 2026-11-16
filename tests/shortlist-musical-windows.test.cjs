'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{shortlist}=require('../tools/shortlist-musical-windows.cjs');
test('the render budget cannot lose every complete candidate to lower-error partial windows',()=>{
 const rows=Array.from({length:8},(_,i)=>({begin:100+i,fade:4.5+i,tempo:i===2?1:1.02,fit:{rms:.005+i*.001,beats:8+i},complete:false}));
 const full={begin:120,fade:10,tempo:1.01,fit:{rms:.025,beats:12},complete:true};
 const selected=shortlist([...rows,full]);assert.equal(selected.length,4);assert.ok(selected.includes(full));
 assert.ok(selected.every(x=>rows.includes(x)||x===full));assert.equal(full.complete,true);
});
