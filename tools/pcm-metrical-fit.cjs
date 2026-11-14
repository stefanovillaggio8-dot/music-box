'use strict';
// Different accent patterns: a PARTIAL metrical certificate, never full.
function metricalFit(outro,intro,x,y,begin,rate){
 if(x.modelBeats.length!==y.modelBeats.length||x.modelBeats.length!==x.bars*x.meter)return null;
 const rms=v=>Math.sqrt(v.reduce((s,x)=>s+x*x,0)/v.length),grid=x.modelBeats.map((t,i)=>t-begin-y.modelBeats[i]/rate);
 if(rms(grid)>.025||grid.some(x=>Math.abs(x)>.05))return null;
 const peak=(p,t)=>Math.max(...[-.02,0,.02].map(d=>p.onset[Math.round((t+d-p.start)/p.step)]||0));
 const shared=[],counts=[];
 for(let bar=0;bar<x.bars;bar++){
  const lo=x.downbeats[bar],hi=x.downbeats[bar+1],targetLo=y.downbeats[bar],targetHi=y.downbeats[bar+1];
  const a=outro.beats.filter(t=>t>=lo-.06&&t<hi-.06),b=intro.beats.filter(t=>t>=targetLo-.06&&t<targetHi-.06),used=new Set();
  if(!a.some(t=>Math.abs(t-lo)<=.05)||!b.some(t=>Math.abs(t-targetLo)<=.05))return null;
  let count=0;
  for(const t of a){
   const choices=b.map((u,i)=>({u,i,error:t-begin-u/rate})).filter(r=>!used.has(r.i)&&Math.abs(r.error)<=.035&&peak(outro,t)>=.35&&peak(intro,r.u)>=.35).sort((a,b)=>Math.abs(a.error)-Math.abs(b.error));
   if(choices.length){used.add(choices[0].i);shared.push(choices[0].error);count++;}
  }
  if(count<2)return null;counts.push(count);
 }
 if(shared.length<8||rms(shared)>.020)return null;
 const certificate={method:'shared-observed-attacks-plus-metrical-hypotheses-v1',gridRms:rms(grid),gridMaximum:Math.max(...grid.map(Math.abs)),
  observedSharedRms:rms(shared),observedShared:shared.length,minimumSharedPerBar:Math.min(...counts),observedDownbeats:x.bars,modelGridPoints:grid.length,humanMetricalReference:false};
 return {beats:shared.length,ratio:shared.length/Math.max(outro.beats.filter(t=>t>=x.start&&t<x.end).length,intro.beats.filter(t=>t>=y.start&&t<y.end).length),
  rms:rms(shared),score:1-rms(grid)/.10,firstHalf:null,secondHalf:null,observedPulses:false,
  firstBeats:counts.slice(0,counts.length/2).reduce((s,n)=>s+n,0),secondBeats:counts.slice(counts.length/2).reduce((s,n)=>s+n,0),attackSupport:1,metricalCertificate:certificate};
}
module.exports={metricalFit};
