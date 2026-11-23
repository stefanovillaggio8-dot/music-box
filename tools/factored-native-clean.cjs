'use strict';
// Proposal policy only. Per-recording evidence never installs a runtime cue.
function clockOffset(c,duration){
 if(c?.method!=='original-mp3-gapless-metadata-v1'||!/^[a-f0-9]{40}$/.test(c.sourceSha)||![44100,48000].includes(c.sampleRate)||
  ![c.rawFrames,c.decodedFrames,c.primingFrames,c.paddingFrames].every(Number.isInteger)||c.decodedFrames<26*c.sampleRate||
  c.primingFrames<0||c.paddingFrames<0||c.primingFrames>c.sampleRate*.1||c.paddingFrames>c.sampleRate*.1||
  c.rawFrames!==c.decodedFrames+c.primingFrames+c.paddingFrames||!Number.isFinite(duration))return null;
 const gapless=Math.abs(duration-c.decodedFrames/c.sampleRate)<=.002,raw=Math.abs(duration-c.rawFrames/c.sampleRate)<=.002;
 if(gapless&&raw&&c.primingFrames>0)return null;
 return gapless?0:raw?c.primingFrames/c.sampleRate:null;
}
function proposal(a,b,begin){
 const no=reason=>({accepted:false,reason,notPlaybackCertified:true});
 if(!a||!b||a.sourceSha===b.sourceSha||a.clock?.sourceSha!==a.sourceSha||b.clock?.sourceSha!==b.sourceSha)return no('source-identity');
 const s=a.quietSuffix,t=b.prefix,fade=a.duration-begin;
 if(!Number.isFinite(fade)||fade<.5||fade>3||begin<26||s?.sourceSha!==a.sourceSha||t?.sourceSha!==b.sourceSha||
  ![s?.from,s?.through].every(Number.isFinite)||begin-.3<s.from-1e-9||Math.abs(s.through-a.duration)>.001)return no('uncovered-source-interval');
 const complete=rows=>Array.isArray(rows)&&rows.length===8&&new Set(rows.map(r=>r.platform+'/'+r.browser+'/'+r.rate)).size===8&&
  rows.every(r=>['linux','darwin'].includes(r.platform)&&['chromium','webkit'].includes(r.browser)&&[44100,48000].includes(r.rate));
 if(!complete(s.native))return no('missing-source-native-coverage');
 for(const r of s.native){
  if(![r.sourceTailPeak,r.sourceTailRmsMax,r.channelRmsUpperBound].every(Number.isFinite)||r.sourceTailPeak<0||r.sourceTailPeak>.001||
   r.sourceTailRmsMax<0||r.channelRmsUpperBound<Math.SQRT2*r.sourceTailRmsMax-1e-15||r.channelRmsUpperBound>.0001||
   clockOffset(a.clock,r.sourceDecodedDuration)!==r.sourceDecodedOffset||clockOffset(a.clock,r.sourceMediaDuration)!==r.sourceMediaOffset)return no('source-not-independently-quiet');
 }
 // Stop rejected targets before requesting native decoding. This uses the
 // original unmodified prefix, not an artificially attenuated entrance.
 if(t.rates&&Object.values(t.rates).some(r=>r.maximumPeak+Math.max(...s.native.map(m=>m.sourceTailPeak))>.96))return no('original-prefix-headroom');
 if(!complete(t.native))return no('missing-target-native-coverage');
 const native=[];
 for(const r of s.native){
  const q=t.native.find(q=>q.platform===r.platform&&q.browser===r.browser&&q.rate===r.rate);
  const bin=q.bins?.find(x=>x.through>=fade+.1-1e-9);
  const covered=bin?.through??t.through,peak=bin?.maximumPeakSoFar??q.targetNativeOverlapPeak;
  const windows=q.bins?.filter(x=>x.through<=fade+1e-9).map(x=>({at:x.through-.25,seconds:.25,rms:x.rms}))||t.originalWindows;
  const meaningful=windows?.filter(x=>x.at+x.seconds<=fade+1e-9&&x.rms>=.001).reduce((n,x)=>n+x.seconds,0);
  if(!Number.isFinite(covered)||covered<fade+.1-1e-9||!Number.isFinite(peak)||peak<0||peak+r.sourceTailPeak>.96)return no('native-prefix-headroom-or-coverage');
  if(!Number.isFinite(meaningful)||meaningful<.75)return no('incoming-not-meaningful-during-overlap');
  if(clockOffset(b.clock,q.targetDecodedDuration)!==q.targetDecodedOffset||clockOffset(b.clock,q.targetMediaDuration)!==q.targetMediaOffset)return no('unknown-target-clock');
  native.push({...r,targetNativeOverlapPeak:peak,targetDecodedOffset:q.targetDecodedOffset,targetMediaOffset:q.targetMediaOffset,
   targetDecodedDuration:q.targetDecodedDuration,targetMediaDuration:q.targetMediaDuration});
 }
 return {accepted:true,evaluationOnly:true,notPlaybackCertified:true,from:a.key,to:b.key,
  sourceSha:a.sourceSha,targetSha:b.sourceSha,begin,end:a.duration,fade,entry:0,tempo:1,targetDuration:b.duration,
  sourceClock:a.clock,targetClock:b.clock,nativeMeasurements:native,
  requiredNext:['new-pair-original-render-and-exposure','both-platform-actual-player','separate-iphone-physical-validation']};
}
module.exports={clockOffset,proposal};
