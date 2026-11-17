const test=require('node:test'),assert=require('node:assert/strict');
test('real preceding PCM is opt-in and never changes the stored cue or invents a prefix',async()=>{
 const {stretchClip}=await import('../audio-stretch-core.mjs');
 const rate=16000,channels=[Float32Array.from({length:rate*14},(_,i)=>.2*Math.sin(2*Math.PI*440*i/rate))];
 const clip={rate,start:10,channels},cue={entry:10.8,fade:8,tempo:1.02};
 const cold=stretchClip(clip,cue),warm=stretchClip(clip,{...cue,warmupOriginal:true});
 assert.equal(cold.warmupOriginalSeconds,0);assert.equal(warm.warmupOriginalSeconds,.8);
 assert.equal(warm.start,10);assert.equal(cue.entry,10.8);assert.equal(warm.pitchPreserved,true);
 for(let i=0;i<rate*.8;i++)assert.equal(warm.channels[0][i],channels[0][i]);
 const noContext=stretchClip({...clip,start:10.8}, {...cue,warmupOriginal:true});
 assert.equal(noContext.warmupOriginalSeconds,0,'unavailable preceding audio is never fabricated');
});
test('exact native tempo preserves every stereo sample instead of filtering the first kick',async()=>{
 const {stretchClip}=await import('../audio-stretch-core.mjs');
 const rate=16000,a=Float32Array.from({length:rate*12},(_,i)=>i%3200<100?.5*Math.exp(-(i%3200)/25):.04*Math.sin(i)),b=Float32Array.from(a,x=>-x);
 const result=stretchClip({rate,start:40,channels:[a,b]},{entry:40.8,fade:8,tempo:1,warmupOriginal:true});
 assert.deepEqual(result.channels[0],a);assert.deepEqual(result.channels[1],b);
 assert.notEqual(result.channels[0],a);assert.equal(result.timing.method,'identity-pcm-no-stretch');
 assert.equal(result.warmupOriginalSeconds,0);assert.equal(result.pitchPreserved,true);
});
