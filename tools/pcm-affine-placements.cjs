'use strict';
// Candidate geometry only. Every proposal still needs the existing full
// original-PCM, bar, voice, harmony and audible post-render certificates.
const median=values=>{const s=[...values].sort((a,b)=>a-b),i=s.length>>1;return s.length%2?s[i]:(s[i-1]+s[i])/2;};
function placements(pairs,bars,nominal){
 if(!Number.isFinite(nominal)||nominal<.95||nominal>1.05||
    !bars.length||[...pairs,...bars].some(p=>p.length!==2||!p.every(Number.isFinite)))return [];
 const admissible=r=>Number.isFinite(r)&&r>=.95&&r<=1.05&&Math.abs(r/nominal-1)<=.025;
 const rates=[1,nominal];
 if(pairs.length>=8){
  const ma=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,mb=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
  rates.push(pairs.reduce((s,p)=>s+(p[0]-ma)*(p[1]-mb),0)/pairs.reduce((s,p)=>s+(p[0]-ma)**2,0));
  const slopes=[];
  for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){
   const dx=pairs[j][0]-pairs[i][0];if(dx>=1)slopes.push((pairs[j][1]-pairs[i][1])/dx);
  }
  if(slopes.length)rates.push(median(slopes));
 }
 if(bars.length>=2)rates.push((bars.at(-1)[1]-bars[0][1])/(bars.at(-1)[0]-bars[0][0]));
 const result=[];
 for(const rate of rates.filter((r,i,a)=>(r===1||admissible(r))&&a.findIndex(x=>Math.abs(x-r)<.00001)===i)){
  const offsets=bars.map(p=>p[0]-p[1]/rate),begins=[median(offsets)];
  if(pairs.length>=8){const v=pairs.map(p=>p[0]-p[1]/rate);begins.push(v.reduce((a,b)=>a+b,0)/v.length,median(v));}
  for(const begin of begins){
   // The robust fit cannot move a model bar away from its actually
   // observed counterpart. No outlier is removed from this final check.
   const errors=offsets.map(x=>x-begin),rms=Math.sqrt(errors.reduce((s,x)=>s+x*x,0)/errors.length);
   if(rms>.025||errors.some(x=>Math.abs(x)>.05)||result.some(x=>Math.abs(x.rate-rate)<.00001&&Math.abs(x.begin-begin)<.001))continue;
   result.push({rate,begin});
  }
 }
 return result;
}
module.exports={placements};
