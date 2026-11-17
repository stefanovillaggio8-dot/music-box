const fs=require('fs'),path=require('path'),req=require('module').createRequire(path.resolve('tools/probe.cjs'));
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges');
const s=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
const {prepared}=new Function('require','__dirname',s.slice(0,s.indexOf('const report={'))+'return {prepared}')(req,path.resolve('tools'));
const rows=JSON.parse(fs.readFileSync('../personal-20261116/Ste-baseline-windows.json')).diagnostics.pulseRejections;
const rms=v=>Math.sqrt(v.reduce((s,x)=>s+x*x,0)/v.length),out=[];
for(const from of [166,6,102,574,627]){
 const candidates=rows.filter(p=>p.from==='audio/songs/track-'+from+'.mp3'),group=[];
 for(const p of candidates){
  const ax=prepared.find(t=>t.key===p.from),by=prepared.find(t=>t.key===p.to);
  const x=ax.source.find(x=>Math.abs(x.start-p.source.start)<.001&&Math.abs(x.end-p.source.end)<.001),y=by.target.find(y=>Math.abs(y.start-p.target.start)<.001&&Math.abs(y.end-p.target.end)<.001);
  if(!x||!y)continue;
  const grid=x.modelBeats.map((t,i)=>t-p.begin-y.modelBeats[i]/p.rate);
  const a={...(x.observed||ax.outro),beats:p.source.observed},b={...(y.observed||by.intro),beats:p.target.observed};
  let why=[];if(rms(grid)>.025)why.push('modelGridRms');if(grid.some(e=>Math.abs(e)>.05))why.push('modelGridMax');
  const peak=(part,t)=>Math.max(...[-.02,0,.02].map(d=>part.onset[Math.round((t+d-part.start)/part.step)]||0));
  let errors=[],counts=[];
  for(let bar=0;bar<x.bars;bar++){
   const lo=x.downbeats[bar],hi=x.downbeats[bar+1],targetLo=y.downbeats[bar],targetHi=y.downbeats[bar+1];
   const old=a.beats.filter(t=>t>=lo-.06&&t<hi-.06),next=b.beats.filter(t=>t>=targetLo-.06&&t<targetHi-.06),used=new Set();let count=0;
   if(!old.some(t=>Math.abs(t-lo)<=.05)||!next.some(t=>Math.abs(t-targetLo)<=.05))why.push('missingStrongBarAnchor');
   for(const t of old){const hits=next.map((u,i)=>({u,i,error:t-p.begin-u/p.rate})).filter(r=>!used.has(r.i)&&Math.abs(r.error)<=.035&&peak(a,t)>=.35&&peak(b,r.u)>=.35).sort((a,b)=>Math.abs(a.error)-Math.abs(b.error));if(hits.length){used.add(hits[0].i);errors.push(hits[0].error);count++;}}
   counts.push(count);
  }
  if(counts.some(n=>n<2))why.push('tooFewPerBar');if(errors.length<8)why.push('tooFewShared');if(rms(errors)>.020)why.push('observedRms');
  group.push({from:p.from,to:p.to,fade:p.fade,targetStart:y.start,sourceAfterBars:ax.raw.duration-x.end,gridRms:rms(grid),gridMax:Math.max(...grid.map(Math.abs)),count:errors.length,counts,rms:rms(errors),why});
 }
 group.sort((a,b)=>a.why.length-b.why.length||b.count-a.count||a.rms-b.rms);out.push(...group.slice(0,3));
}
fs.writeFileSync('../ste-focus-20261116/partial-diagnosis.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
