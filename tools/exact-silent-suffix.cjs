'use strict';
function validExactSuffix(p,source){
 return p?.method==='original-stereo-exact-zero-suffix-v1'&&p.sourceSha===source?.sha&&
  /^[a-f0-9]{64}$/.test(p.sourceSha256)&&p.threshold===0&&
  [p.zeroFrom,p.through].every(Number.isFinite)&&Math.abs(p.through-source.duration)<.001&&
  p.through-p.zeroFrom>=.25&&p.through-p.zeroFrom<=3&&[44100,48000].every(rate=>{
   const r=p.rates?.[rate];return r&&Number.isInteger(r.frames)&&Number.isInteger(r.nonzeroThroughFrame)&&
    r.frames>0&&r.nonzeroThroughFrame>=0&&r.nonzeroThroughFrame<r.frames&&r.maximumSuffixPeak===0&&
    /^[a-f0-9]{64}$/.test(r.pcmSha256)&&Math.abs(r.decodedDuration-r.frames/rate)<1e-9&&
    Math.abs(r.decodedDuration-p.through)<.1&&Math.abs(r.zeroFrom-r.nonzeroThroughFrame/rate)<1e-9&&
    r.zeroFrom<=p.zeroFrom+1e-9&&p.zeroFrom<=r.decodedDuration-.25;
  })&&Math.abs(p.zeroFrom-Math.max(p.rates[44100].zeroFrom,p.rates[48000].zeroFrom))<1e-9;
}
module.exports={validExactSuffix};
