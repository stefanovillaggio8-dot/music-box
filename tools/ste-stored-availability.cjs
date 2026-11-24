'use strict';
// Read-only stored graph inspection, not a Cartesian pair scan or simulation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {currentSteScope}=require('./ste-research-scope.cjs');
function report(){
 const root=path.resolve(__dirname,'..'),scope=currentSteScope(),index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 const text=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
 const {engine}=new Function('require','__dirname',text.slice(0,text.indexOf('const tracks='))+'return {engine}')(require,path.join(root,'tools'));
 const members=new Map(scope.tracks.map(t=>[index.entries[t.key].sha,t.key])),pairs=[],seen=new Set();
 for(const {key} of scope.tracks){const a=engine.withGuardedLRC(engine.verifiedIndexedGridTempo(index.entries[key]));
  for(const sha of new Set([...Object.keys(a.structuralBeatPlans||{}),...Object.keys(a.pcmBeatPlans||{})])){
   const to=members.get(sha),signature=a.sha+'>'+sha;if(!to||seen.has(signature))continue;seen.add(signature);
   const b=engine.withGuardedLRC(engine.verifiedIndexedGridTempo(index.entries[to])),p=engine.playbackTransition(a,b,a.duration);
   if(!p)continue;
   const kind=p.nativeCleanTail?'cleanDesktop':p.measuredFullBeat&&engine.fullBeatCueCertified(a,b,p)?'full':p.metricalRhythmic?'partial':null;
   if(kind)pairs.push({from:key,to,kind,begin:p.begin,fade:p.fade,entry:p.entry,tempo:p.tempo});
  }
 }
 const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 return {personalSteRecordings:scope.tracks.length,examined:'stored same-account plans only; no Cartesian scan, simulation or new PCM',
  sourceJsSha256:hash('mix-intelligente.js'),indexSha256:hash('dj-deep-analysis.json'),
  counts:Object.fromEntries(['full','partial','cleanDesktop'].map(k=>[k,pairs.filter(p=>p.kind===k).length])),
  newCleanIPhone:0,pairs,physicalIPhone:false,humanListening:false};
}
if(require.main===module){const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('New output required');
 const value=report();fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n');console.log(JSON.stringify(value.counts));}
module.exports={report};
