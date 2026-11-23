'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const data=require('../audits/ste-factored-clean-20261123/recordings.json'),{proposal,clockOffset}=require('../tools/factored-native-clean.cjs');
const source=Object.values(data.recordings).find(r=>r.quietSuffix),positive=Object.values(data.recordings).find(r=>r.prefix?.reusedPublishedEvidence);
test('independent recording proofs recover the published positive but never certify or install a pair',()=>{
 const p=proposal(source,positive,source.quietSuffix.begin);assert.equal(p.accepted,true);assert.equal(p.notPlaybackCertified,true);assert.equal(p.entry,0);assert.equal(p.tempo,1);
 assert.ok(p.requiredNext.includes('new-pair-original-render-and-exposure'));
});
test('new hot prefix is rejected before requesting more native analysis, while unmeasured native data stays pending',()=>{
 const fresh=Object.values(data.recordings).filter(r=>r.prefix?.notNativeCertified);
 assert.equal(fresh.length,2);
 for(const r of fresh){const p=proposal(source,r,source.quietSuffix.begin);
  if(Object.values(r.prefix.rates).some(x=>x.maximumPeak>.96))assert.equal(p.reason,'original-prefix-headroom');
  else assert.equal(p.reason,'missing-target-native-coverage');
 }
});
test('old eight-second negative cannot reuse a quiet suffix measured later',()=>{
 assert.equal(proposal(source,positive,source.duration-8).accepted,false);
 const loud=structuredClone(source);for(const r of loud.quietSuffix.native){r.sourceTailRmsMax=.806;r.channelRmsUpperBound=.806*Math.SQRT2;}
 assert.equal(proposal(loud,positive,source.quietSuffix.begin).reason,'source-not-independently-quiet');
});
test('missing platform, wrong identity, masked weak entrance, uncovered prefix and unknown clocks fail closed',()=>{
 const mutations=[x=>x.prefix.native.pop(),x=>x.clock.sourceSha='f'.repeat(40),x=>x.prefix.through=1,
  x=>x.prefix.originalWindows.forEach(r=>r.rms=0),x=>x.prefix.native[0].targetMediaDuration=.002,
  x=>x.prefix.native[0].targetNativeOverlapPeak=.961];
 for(const mutate of mutations){const b=structuredClone(positive);mutate(b);assert.equal(proposal(source,b,source.quietSuffix.begin).accepted,false,mutate.toString());}
});
test('a recognized container clock is distinct from a fitted lag or a permissive duration tolerance',()=>{
 const c=source.clock;assert.equal(clockOffset(c,c.decodedFrames/c.sampleRate),0);assert.equal(clockOffset(c,c.rawFrames/c.sampleRate),c.primingFrames/c.sampleRate);
 assert.equal(clockOffset(c,.002),null);assert.equal(clockOffset(c,c.rawFrames/c.sampleRate+.02),null);
 assert.equal(clockOffset({...c,rawFrames:c.rawFrames+1},c.rawFrames/c.sampleRate),null);
});
