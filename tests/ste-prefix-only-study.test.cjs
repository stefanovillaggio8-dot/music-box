'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prepare}=require('../tools/ste-clean-probe-server.cjs');
const data=require('../audits/ste-kidyugi-prefixes-20261124/recordings.json');
test('four frozen new Ste prefixes never fabricate a published control or dual-player fixture',()=>{
 const r=prepare(data);assert.equal(r.fixture,null);assert.equal(r.needed.length,5);
 assert.equal(r.needed.filter(x=>x.prefix?.notNativeCertified).length,4);
 assert.equal(r.needed.filter(x=>x.prefix?.reusedPublishedEvidence).length,0);
 assert.throws(()=>prepare({...data,prefixOnly:false}),/Published control required/);
});
test('prefix-only study still rejects a recording beyond its frozen Ste cases',()=>{
 const d=structuredClone(data);d.cases.pop();assert.throws(()=>prepare(d),/outside frozen/);
});
