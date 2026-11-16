'use strict';
const fs=require('node:fs'),path=require('node:path');
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const index=JSON.parse(fs.readFileSync(arg('index','dj-deep-analysis.json'),'utf8')),folder=arg('proofs',''),output=arg('output','');
if(!folder||!output)throw Error('Explicit proof directory and output index required');
const files=fs.readdirSync(folder,{recursive:true}).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(folder,f),'utf8')));
const proofs=files.filter(p=>p.method==='actual-browser-decode-v1'),browsers=['chromium','webkit'];
if(proofs.length!==2||browsers.some(b=>proofs.filter(p=>p.browser===b).length!==1))throw Error('Both actual decoders required, exactly once');
let changed=0;const seen=new Set();
for(const entry of Object.values(index.entries))for(const record of Object.values(entry.structuralBeatPlans||{}))
 for(const cue of [record.cue,...(record.cues||[])]){
  if(!cue?.rhythmicTailWindow&&!cue?.metricalPickupWindow&&!cue?.structuralEvidence?.exactSilentSuffix)continue;const c=cue.composite,rates={};
  for(const sampleRate of [44100,48000]){
   const rows=proofs.map(p=>p.assets.filter(r=>r.assetSha256===c.sha256&&r.sampleRate===sampleRate));
   if(rows.some(a=>a.length!==1))throw Error('Missing or duplicated source-bound native PCM proof');
   const measured=rows.map(a=>a[0]);
   if(measured.some(r=>![r.samplePeak,r.overlapPeak,r.duration].every(Number.isFinite)||r.channels!==2||r.samplePeak<=0||r.samplePeak>.9992||r.overlapPeak<0||r.overlapPeak>.962||Math.abs(r.duration-c.seconds)>.04))throw Error('Invalid native PCM bounds');
   rates[sampleRate]={samplePeak:Math.max(...measured.map(r=>r.samplePeak)),overlapPeak:Math.max(...measured.map(r=>r.overlapPeak)),browsers};
   if(c.nativeSplice){
    const splice=measured.map(r=>r.nativeSplice);
    if(splice.some(r=>r?.method!=='actual-native-original-splice-v1'||r.targetSha!==c.targetSha||r.frames!==Math.round(sampleRate*.1)||
     !Number.isFinite(r.correlation)||r.correlation<.99||!Number.isFinite(r.relativeRms)||r.relativeRms<0||r.relativeRms>.10))throw Error('Missing actual native original-splice coherence');
    rates[sampleRate].nativeSplice={method:'actual-native-original-splice-v1',targetSha:c.targetSha,frames:Math.round(sampleRate*.1),
     minimumCorrelation:Math.min(...splice.map(r=>r.correlation)),maximumRelativeRms:Math.max(...splice.map(r=>r.relativeRms)),browsers};
   }
  }
  c.nativeDecoderProof={method:'actual-browser-decode-v1',assetSha256:c.sha256,rates,physicalIPhone:false};changed++;seen.add(c.sha256);
 }
fs.writeFileSync(output,JSON.stringify(index)+'\n');console.log(JSON.stringify({cueCopiesCertified:changed,uniqueAssets:seen.size}));
