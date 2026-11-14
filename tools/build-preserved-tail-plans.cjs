'use strict';
// Full outgoing recording + incoming recording from time zero. No early
// content skip. Candidate data alone never authorizes runtime playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const root=path.resolve(__dirname,'..'),index=JSON.parse(fs.readFileSync(arg('index',path.join(root,'dj-deep-analysis.json'))));
const allFiles=(dir,re)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?allFiles(path.join(dir,e.name),re):re.test(e.name)?[path.join(dir,e.name)]:[]);
const whole=new Map(),pcm=new Map();
const edges=new Map();
if(arg('edges',''))for(const f of allFiles(arg('edges',''),/^edge-\d+\.json$/)){
 const d=JSON.parse(fs.readFileSync(f));if(d.errors?.length)throw Error('Failed edge source');
 for(const [k,e] of Object.entries(d.entries||{})){
  if(edges.has(k)||e.sha!==index.entries[k]?.sha||e.modelSha256!=='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331')throw Error('Unbound edge evidence');edges.set(k,e);
 }
}
for(const f of allFiles(arg('structure','structure'),/^structure-.*\.json$/))for(const [k,e] of Object.entries(JSON.parse(fs.readFileSync(f)).entries||{})){
 if(whole.has(k)||e.sha!==index.entries[k]?.sha)throw Error('Unbound or duplicate structure');whole.set(k,e);
}
if(arg('pcm',''))for(const f of allFiles(arg('pcm',''),/^pcm-\d+\.json$/))for(const [k,e] of Object.entries(JSON.parse(fs.readFileSync(f)).entries||{})){
 if(pcm.has(k)||e.sha!==index.entries[k]?.sha||e.pcmTransition?.sha!==e.sha)throw Error('Unbound or duplicate PCM');pcm.set(k,e.pcmTransition);
}
const tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const {engine}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine}')(require,path.join(root,'tools'));
const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),a=app.indexOf('const BUILTIN = ['),b=app.indexOf('];',a);
const catalog=vm.runInNewContext(app.slice(a,b+2)+';BUILTIN'),state=JSON.parse(fs.readFileSync(path.join(root,'stato.json'))),owners=new Map();
for(const song of catalog){
 const id='b-'+song.file.replace(/^.*\//,'').replace(/\.mp3$/i,'');
 if(!owners.has(song.file))owners.set(song.file,new Set());
 for(const profile of ['Ste','Diego','Emanuele'])if(((song.profile||'Ste')===profile||(state.miei?.[profile]||[]).includes(id))&&
  !(state.eliminati||[]).includes(profile+'.'+id)&&!(profile==='Ste'&&(state.eliminati||[]).includes(id)))owners.get(song.file).add(profile);
}
const owner=k=>owners.get(k.replace(/^[^/]+\//,'').replace('/bassi/','/'))||new Set();
const clear=(e,start,end)=>{
 const lo=Math.floor(start*10),hi=Math.ceil(end*10);if(hi>e.vocalRms.length||hi>e.mixRms.length||hi-lo<5)return null;
 let max=0,relative=0;
 for(let i=lo;i<hi;i++){const v=e.vocalRms[i],m=e.mixRms[i];if(!Number.isFinite(v)||!Number.isFinite(m))return null;max=Math.max(max,v);relative=Math.max(relative,v/Math.max(m,.003));}
 return {start,end,method:'spleeter-2stems-energy-v1',maxVocalRms:max,maxRelativeVocal:relative,clear:max<.004&&relative<.08,notHumanVerified:true};
};
function observedGrid(part,e){
 const beats=[];
 for(const predicted of e.beats){
  if(predicted<part.start+.06||predicted>part.end-.06)continue;
  const lo=Math.max(0,Math.round((predicted-part.start-.06)/.02)),hi=Math.min(part.onset.length-1,Math.round((predicted-part.start+.06)/.02));
  let best=lo;for(let i=lo+1;i<=hi;i++)if(part.onset[i]>part.onset[best])best=i;
  const t=+(part.start+best*.02).toFixed(4);
  if(part.onset[best]>=.25&&(!beats.length||t-beats.at(-1)>.20))beats.push(t);
 }
 return {...part,beats};
}
const prepared=[];
for(const [key,raw] of Object.entries(index.entries)){
 if(raw.status!=='ok'||!owner(key).size)continue;
 let e=whole.get(key),p=pcm.get(key);const edge=edges.get(key);
 if(edge){e={...e,beats:[...e.beats,...edge.intro.beats,...edge.outro.beats].sort((a,b)=>a-b)};p={intro:edge.intro.pcm,outro:edge.outro.pcm};}
 if(!e||!p)throw Error('Missing source evidence '+key);
 const source=[],target=[];
 for(const role of ['intro','outro']){
 for(const bars of edge?[e.reliableBars,edge[role].bars]:[e.reliableBars]){
 for(let stop=2;stop<=bars.length;stop++)for(const n of [2,4,8]){
  const chain=bars.slice(stop-n,stop);if(stop<n||chain.length!==n||chain.some((r,i)=>i&&(Math.abs(chain[i-1].end-r.start)>.08||r.beatsPerBar!==chain[0].beatsPerBar)))continue;
  const start=chain[0].start,end=chain.at(-1).end;
  const w={start,end,bars:n,meter:chain[0].beatsPerBar,phase:Math.min(...chain.map(x=>x.metricalPhaseConfidence)),downbeats:[...chain.map(x=>x.start),end],modelBeats:chain.flatMap(x=>x.modelBeats)};
  if(role==='outro'&&start>=26&&raw.duration-start<=16&&raw.duration-end>=-.001&&raw.duration-end<=8)source.push(w);
  if(role==='intro'&&start<=4&&end<=p.intro.end-.1)target.push(w);
 }
 }
 }
 prepared.push({key,raw:engine.withGuardedLRC(raw),e,source,target,outro:observedGrid(p.outro,e),intro:observedGrid(p.intro,e),owners:owner(key)});
}
const report={version:1,method:'preserved-file-tail-original-pcm-v1',tracks:prepared.length,profileFunnel:{},plans:[],windows:0};
const count=(profiles,key)=>{for(const p of profiles){report.profileFunnel[p]??={};report.profileFunnel[p][key]=(report.profileFunnel[p][key]||0)+1;}};
for(const a of prepared)for(const b of prepared){
 if(a.key===b.key||a.raw.sha===b.raw.sha||a.key.replace('/bassi/','/')===b.key.replace('/bassi/','/'))continue;
 const profiles=[...a.owners].filter(x=>b.owners.has(x));if(!profiles.length)continue;count(profiles,'pairs');
 if(!a.source.length){count(profiles,'noCoherentEndingBars');continue;}
 if(!b.target.length){count(profiles,'noCoherentInitialBars');continue;}
 let tempo=false,voice=false,harmony=false;const choices=[];
 for(const x of a.source)for(const y of b.target){
  if(x.bars!==y.bars||x.meter!==y.meter)continue;
  const ratio=(y.end-y.start)/(x.end-x.start);if(ratio<.95||ratio>1.05)continue;
  const nearest=(beats,t)=>{let value=null,error=.075;for(const b of beats)if(Math.abs(b-t)<error){error=Math.abs(b-t);value=b}return value;};
  const sourceDown=x.downbeats.slice(0,-1).map(t=>nearest(a.outro.beats,t)),targetDown=y.downbeats.slice(0,-1).map(t=>nearest(b.intro.beats,t));
  if([...sourceDown,...targetDown].some(t=>t==null))continue;
  const paired=x.modelBeats.map((t,i)=>[nearest(a.outro.beats,t),nearest(b.intro.beats,y.modelBeats[i])]).filter(p=>p.every(t=>t!=null));
  const rates=[1,ratio];
  if(paired.length>=8){
   const ma=paired.reduce((s,p)=>s+p[0],0)/paired.length,mb=paired.reduce((s,p)=>s+p[1],0)/paired.length;
   const covariance=paired.reduce((s,p)=>s+(p[0]-ma)*(p[1]-mb),0),variance=paired.reduce((s,p)=>s+(p[0]-ma)**2,0);
   const fitted=covariance/variance;if(fitted>=.95&&fitted<=1.05&&Math.abs(fitted/ratio-1)<=.025)rates.push(fitted);
  }
  for(const rate of [...new Set(rates)]){
   const begin=paired.length>=8?paired.reduce((s,p)=>s+p[0]-p[1]/rate,0)/paired.length:sourceDown[0]-targetDown[0]/rate,
    fade=a.raw.duration-begin,end=a.raw.duration;
   if(begin<a.outro.start+.1||begin<26||fade<4.5||fade>16||fade*rate>b.intro.end-.1)continue;tempo=true;
   const guard=clear(b.e,0,fade*rate+.3);
   const incomingClear=guard?.clear&&!(Number.isFinite(b.raw.firstLyricAt)&&b.raw.firstLyricAt<fade*rate+.3);
   const outgoingGuard=incomingClear?null:clear(a.e,begin-.3,end);
   const knownOutgoing=[a.raw.lastVoiceAt,a.raw.lastLyricAt,...(a.raw.lyricStarts||[])].some(t=>Number.isFinite(t)&&t>=begin-.3&&t<end+.1);
   if(!incomingClear&&(!outgoingGuard?.clear||knownOutgoing))continue;voice=true;
   const downbeatErrors=sourceDown.map((t,i)=>t-begin-targetDown[i]/rate),rms=Math.sqrt(downbeatErrors.reduce((s,x)=>s+x*x,0)/downbeatErrors.length);
   if(rms>.025||downbeatErrors.some(t=>Math.abs(t)>.05))continue;
   const h=engine.pcmFullHarmony(a.outro,b.intro,begin,0,rate,fade)||engine.pcmPreservedTailHarmony(a.outro,b.intro,begin,rate,fade,'first-attack-033-v1');if(!h)continue;harmony=true;
   report.windows++;
   const fit=engine.pcmFullBeatFit(a.outro,b.intro,begin,0,rate,fade);if(!fit)continue;
   choices.push({begin,end,fade,entry:0,tempo:rate,fit,harmony:h,sourceWindow:x,targetWindow:y,incomingGuard:guard,outgoingGuard,
    vocalOverlapPolicy:incomingClear?'instrumental-incoming-v1':'instrumental-outgoing-v1',downbeatRms:rms,sourceObservedDownbeats:sourceDown,targetObservedDownbeats:targetDown});
  }
 }
 count(profiles,!tempo?'meterOrTempo':!voice?'incomingVocalOrLyric':!harmony?'localHarmony':!choices.length?'independentBeatFit':'completeCandidates');
 if(choices.length){
  choices.sort((x,y)=>y.fit.beats-x.fit.beats||x.fit.rms-y.fit.rms);const selected=[];
  for(const c of choices){if(selected.length>=4)break;if(selected.some(x=>Math.abs(x.begin-c.begin)<.1&&Math.abs(x.tempo-c.tempo)<.0001))continue;selected.push(c);}
  for(const [number,c] of selected.entries()){
   const x=c.sourceWindow,y=c.targetWindow,fit=c.fit,h=c.harmony;
   const cue={kind:'beat',structuralBeat:true,preservedFileTail:true,measuredFullBeat:true,metricalRhythmic:false,
    nativeTailFullBeat:true,preserveTail:true,quietCertified:false,silenceTrim:false,softTailTrim:false,
    begin:c.begin,end:c.end,fade:c.fade,entry:0,tempo:c.tempo,gain:1,vocalFadeSeconds:0,preservedEntrance:'first-attack-033-v1',
    sourceSha:a.raw.sha,targetSha:b.raw.sha,contentPenalty:0,
    sourceTempoBpm:60*x.bars*x.meter/(x.end-x.start),targetTempoBpm:60*y.bars*y.meter/(y.end-y.start),
    nominalTempo:(y.end-y.start)/(x.end-x.start),nativeRatePreferred:c.tempo===1&&fit.rms<=.025,
    beatAnchor:c.sourceObservedDownbeats[0],nextBeat:c.targetObservedDownbeats[0],beatPeriod:(x.end-x.start)/(x.bars*x.meter),
    measuredBeatCount:fit.beats,beatPulseAgreement:fit.ratio,measuredPlacementError:fit.rms,
    grooveScore:fit.score,score:fit.score,fullOnsetFirst:fit.firstHalf,fullOnsetSecond:fit.secondHalf,
    measuredPulseMode:fit.observedPulses,fullPulseFirst:fit.firstBeats,fullPulseSecond:fit.secondBeats,fullPulseAttackSupport:fit.attackSupport,
    harmonicEvidence:h,harmonicMode:h.compatibleKey?'compatible-key':h.percussiveIntro?'percussion':'local-chords',
    percussiveIntro:!!h.percussiveIntro,harmonicScore:h.average,harmonicWeakest:h.weakest,
    structuralEvidence:{version:1,bars:x.bars,beatsPerBar:x.meter,sourcePhaseConfidence:x.phase,targetPhaseConfidence:y.phase,
     downbeatRms:c.downbeatRms,incomingWholeOverlap:c.incomingGuard,outgoingWholeOverlap:c.outgoingGuard,vocalOverlapPolicy:c.vocalOverlapPolicy,
     sourceObservedDownbeats:c.sourceObservedDownbeats,targetObservedDownbeats:c.targetObservedDownbeats,
     sourceModelDownbeats:x.downbeats,targetModelDownbeats:y.downbeats,
     pulseCheck:{source:a.outro.beats.filter(t=>t>=c.begin-.075&&t<=c.end-.12).map(t=>t-c.begin),
      target:b.intro.beats.filter(t=>t>=0&&t<=c.fade*c.tempo-.12),
      sourceBars:c.sourceObservedDownbeats.map(t=>t-c.begin),targetBars:c.targetObservedDownbeats.map(t=>t/c.tempo)},
     method:'source-eof-and-original-pcm-initial-pickup-v1',humanVerified:false,semanticLabelsVerified:false}};
   report.plans.push({from:a.key,to:b.key,profiles,primary:number===0,cue});
  }
 }
}
const output=arg('output','preserved-tail-plans.json');fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,plans:report.plans.length}));
