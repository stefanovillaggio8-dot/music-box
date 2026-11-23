'use strict';
// Research hypotheses from complementary ORIGINAL contexts, never new beats.
// Existing compiler and rendered-audio gates remain the certification owners.
function contextBarChains(views,{start,end,earliestStart=start,latestStart=end,limit=1024}){
 const candidates=[];
 for(const {name,bars} of views){
  if(!['whole-original','edge-original'].includes(name))throw Error('Only original metrical contexts may be joined');
  for(const b of bars){
  if(!Number.isFinite(b.start)||!Number.isFinite(b.end)||b.start<start||b.end>end+.001||b.end<=b.start||
     ![3,4,5].includes(b.beatsPerBar)||b.metricalPhaseConfidence<.8||b.metricalPhaseConfidence>1||
     !Number.isFinite(b.metricalPhaseConfidence)||!(b.beatProbabilityGeometricMean>=.7)||!(b.downbeatProbabilityMin>=.5)||
     !Array.isArray(b.modelBeats)||b.modelBeats.length!==b.beatsPerBar||
     b.modelBeats.some((t,i)=>!Number.isFinite(t)||t<b.start-.001||t>=b.end||i&&t<=b.modelBeats[i-1]))continue;
  const same=candidates.find(x=>x.bar.beatsPerBar===b.beatsPerBar&&Math.abs(x.bar.start-b.start)<=.08&&Math.abs(x.bar.end-b.end)<=.08&&
   x.bar.modelBeats.every((t,i)=>Math.abs(t-b.modelBeats[i])<=.08));
  if(same){same.contexts.add(name);if(b.metricalPhaseConfidence>same.bar.metricalPhaseConfidence)same.bar=b;}
  else candidates.push({bar:b,contexts:new Set([name])});
 }}
 candidates.sort((a,b)=>a.bar.start-b.bar.start||a.bar.end-b.bar.end);
 const chains=[];
 function walk(chain){
  const last=chain.at(-1),n=chain.length;
  if([2,4,8].includes(n)){
   const common=[...chain[0].contexts].filter(name=>chain.every(x=>x.contexts.has(name)));
   // Exclude chains already available in a single context. They continue
   // through the unchanged legacy variants, avoiding invented improvement.
   if(!common.length){
    if(chains.length>=limit)throw Error('Bounded original context chain limit exceeded');
    chains.push({bars:chain.map(x=>x.bar),contexts:chain.map(x=>[...x.contexts].sort())});
   }
  }
  if(n===8)return;
  const period=(last.bar.end-last.bar.start)/last.bar.beatsPerBar;
  for(const next of candidates){
   const b=next.bar;
   if(b.start<=last.bar.start||Math.abs(last.bar.end-b.start)>.08||b.beatsPerBar!==last.bar.beatsPerBar)continue;
   const nextPeriod=(b.end-b.start)/b.beatsPerBar;
   if(Math.abs(nextPeriod-period)>period*.08)continue;
   walk([...chain,next]);
  }
 }
 for(const first of candidates)if(first.bar.start>=earliestStart&&first.bar.start<=latestStart)walk([first]);
 return chains;
}
module.exports={contextBarChains};
