'use strict';
// Both recordings remain intact. This proposes a handoff only when an
// original-PCM vocal-free suffix meets a vocal-free prefix with 300 ms
// margins on BOTH sides. A model estimate never trims either recording.
const cache=new WeakMap();
function quietBounds(e){
 if(cache.has(e))return cache.get(e);
 const good=i=>Number.isFinite(e.vocalRms?.[i])&&Number.isFinite(e.mixRms?.[i])&&
  e.vocalRms[i]<.004&&e.vocalRms[i]/Math.max(e.mixRms[i],.003)<.08;
 const n=Math.min(e.vocalRms?.length||0,e.mixRms?.length||0);let prefix=0,last=n-1;
 while(prefix<n&&good(prefix))prefix++;
 while(last>=0&&good(last))last--;
 const dirty=new Uint32Array(n+1);for(let i=0;i<n;i++)dirty[i+1]=dirty[i]+Number(!good(i));
 const result={prefixThrough:prefix*.1,suffixFrom:(last+1)*.1,dirty};cache.set(e,result);return result;
}
function vocalHandoff(a,b,rawA,rawB,begin,end,rate,clear){
 const x=quietBounds(a),y=quietBounds(b),fade=end-begin;
 const known=[rawA.lastVoiceAt,rawA.lastLyricAt,...(rawA.lyricStarts||[])].filter(t=>Number.isFinite(t)&&t<end+.1);
 const lower=Math.max(.6,x.suffixFrom-begin+.3,...known.map(t=>t-begin+.601));
 const upper=Math.min(fade-.6,y.prefixThrough/rate-.3,Number.isFinite(rawB.firstLyricAt)?rawB.firstLyricAt/rate-.3:Infinity);
 if(!Number.isFinite(lower)||lower>upper)return null;
 const at=(lower+upper)/2,source=clear(a,begin+at-.3,end),target=clear(b,0,(at+.3)*rate);
 if(!source?.clear||!target?.clear)return null;
 return {method:'original-pcm-separated-vocal-handoff-v1',at,marginSeconds:.3,
  outgoingQuietSuffix:source,incomingQuietPrefix:target,humanVocalReference:false};
}
module.exports={quietBounds,vocalHandoff};
