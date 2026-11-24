'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{uninterruptedIntro}=require('../tools/native-intro-audibility.cjs');
const history=()=>[0,1,2,2.7].map((at,i)=>({at,observedAt:at*1000,event:['play-request','playing','volume-set','adoption'][i],volume:1,muted:false,rate:1,paused:i===0,seeking:false}));
test('an original audible stream is not a skipped intro merely because source EOF dispatch was delayed',()=>{
 assert.equal(uninterruptedIntro(history(),1),true);
});
test('a hidden, attenuated, accelerated, paused, seeking, buffering or discontinuous prefix is rejected',()=>{
 for(const mutate of [r=>r.muted=true,r=>r.volume=.09,r=>r.rate=1.04,r=>r.paused=true,r=>r.seeking=true,r=>r.event='waiting',r=>r.at=-1,r=>r.observedAt=NaN]){
  const h=history();mutate(h[2]);assert.equal(uninterruptedIntro(h,1),false,mutate.toString());
 }
 const jumped=history();jumped[0].at=1;assert.equal(uninterruptedIntro(jumped,1),false);
 const backwards=history();backwards[2].at=.2;assert.equal(uninterruptedIntro(backwards,1),false);
 assert.equal(uninterruptedIntro(history().filter(r=>r.event!=='playing'),1),false);
});
