'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {referenceWordLines,referenceForLine,assertSameRecognizer}=require('../tools/karaoke-reference-lines.cjs');
const record={lines:[{start:1,end:4,text:'stay here'},{start:3,end:5,text:'come back'}],words:[
 {start:1,end:2,text:'stay',line_end:false},{start:2,end:4,text:'here',line_end:true},
 {start:3,end:3.5,text:'come',line_end:false},{start:3.5,end:5,text:'back',line_end:true}]};
test('overlapping sung phrases keep their declared word identity without duplicate reference words',()=>{
 const groups=referenceWordLines(record);
 assert.deepEqual(referenceForLine(record,groups,record.lines[0]).map(w=>w.text),['stay','here']);
 assert.deepEqual(referenceForLine(record,groups,record.lines[1]).map(w=>w.text),['come','back']);
 assert.equal(groups.flat().length,4);
 assert.equal(groups[0][1].end,4,'a genuine overlapping word end must not be clipped');
});
test('missing or contradictory annotation ownership cannot silently fall back to timestamp containment',()=>{
 assert.throws(()=>referenceWordLines({...record,words:record.words.map(w=>({...w,line_end:false}))}),/Incomplete/);
 assert.throws(()=>referenceWordLines({...record,lines:[{...record.lines[0],text:'another phrase'},record.lines[1]]}),/identity/);
 assert.throws(()=>referenceForLine(record,referenceWordLines(record),{...record.lines[0],start:1.1}),/Unknown/);
});
test('context replay rejects different or unpinned model outputs while allowing different context lengths',()=>{
 const a={inference:{model:'tiny',revision:'fixed-sha',dtype:{decoder:'q4'}}};
 assert.doesNotThrow(()=>assertSameRecognizer([a,{inference:{...a.inference,experimentalContext:{seconds:14}}}]));
 assert.throws(()=>assertSameRecognizer([a,{inference:{...a.inference,model:'base'}}]),/Mixed/);
 assert.throws(()=>assertSameRecognizer([a,{inference:{...a.inference,revision:undefined}}]),/unpinned/);
});
