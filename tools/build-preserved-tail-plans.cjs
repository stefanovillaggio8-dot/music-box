'use strict';
// Full outgoing recording + incoming recording from time zero. No early
// content skip. Candidate data alone never authorizes runtime playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {placements}=require('./pcm-affine-placements.cjs');
const {metricalFit}=require('./pcm-metrical-fit.cjs');
const {shortlist}=require('./shortlist-musical-windows.cjs');
const {vocalHandoff}=require('./pcm-vocal-handoff.cjs');
const {rhythmicTail}=require('./pcm-rhythmic-tail.cjs');
const {validExactSuffix}=require('./exact-silent-suffix.cjs');
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const partial=arg('metrical','false')==='true';
const tailWindows=arg('rhythmic-tail','true')==='true';
const allowHandoff=arg('vocal-handoff','true')==='true';
const separateGrids=arg('separate-grid-hypotheses','true')==='true';
const initialBarLimit=Number(arg('initial-bar-limit','8'));
const diagnose=arg('diagnostics','false')==='true',pulseRejections=[],octavePairs=new Map();
const exactSilence=arg('exact-silence','')?JSON.parse(fs.readFileSync(arg('exact-silence',''))).entries:{};
if(![4,8].includes(initialBarLimit))throw Error('Supported initial-bar candidate limits: 4 or 8 seconds');
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
const extraEdges=new Map();
if(arg('extra-edges',''))for(const f of allFiles(arg('extra-edges',''),/^edge-\d+\.json$/)){
 const d=JSON.parse(fs.readFileSync(f));if(d.errors?.length)throw Error('Failed alternate edge source');
 for(const [k,e] of Object.entries(d.entries||{})){
  if(e.sha!==index.entries[k]?.sha||e.modelSha256!=='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'||e.analysisView!=='percussive'||e.pcmFromUnmodifiedOriginal!==true)throw Error('Unbound alternate edge evidence');
  if(extraEdges.has(k))throw Error('Duplicate alternate edge source');extraEdges.set(k,e);
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
const scopeFile=arg('scope',''),scope=scopeFile?JSON.parse(fs.readFileSync(scopeFile)):null;
if(scope&&(!scope.name||!Array.isArray(scope.tracks)||scope.tracks.some(t=>typeof t.key!=='string'||index.entries[t.key]?.status!=='ok'||!t.sha||index.entries[t.key]?.sha!==t.sha)))throw Error('Unbound library audit scope');
const scopeKeys=new Set(scope?.tracks.map(t=>t.key)||[]);
const owner=k=>scope?(scopeKeys.has(k)?new Set([scope.name]):new Set()):owners.get(k.replace(/^[^/]+\//,'').replace('/bassi/','/'))||new Set();
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
 for(const variant of [{bars:e.reliableBars,...(separateGrids?{view:'whole-original',observed:observedGrid(p[role],whole.get(key))}:{})},...(edge?[{bars:edge[role].bars,...(separateGrids?{view:'edge-original',observed:observedGrid(edge[role].pcm,{beats:edge[role].beats})}:{})}]:[]),...(extraEdges.has(key)?[{bars:extraEdges.get(key)[role].bars,view:'percussive',observed:observedGrid(extraEdges.get(key)[role].pcm,{beats:separateGrids?extraEdges.get(key)[role].beats:[...whole.get(key).beats,...extraEdges.get(key)[role].beats].sort((a,b)=>a-b)})}]:[])]){
 const bars=variant.bars;
 for(let stop=2;stop<=bars.length;stop++)for(const n of [2,4,8]){
  const chain=bars.slice(stop-n,stop);if(stop<n||chain.length!==n||chain.some((r,i)=>i&&(Math.abs(chain[i-1].end-r.start)>.08||r.beatsPerBar!==chain[0].beatsPerBar)))continue;
  const start=chain[0].start,end=chain.at(-1).end;
  const w={start,end,bars:n,meter:chain[0].beatsPerBar,phase:Math.min(...chain.map(x=>x.metricalPhaseConfidence)),downbeats:[...chain.map(x=>x.start),end],modelBeats:chain.flatMap(x=>x.modelBeats)};
  if(role==='outro'&&start>=26&&raw.duration-start<=16&&raw.duration-end>=-.001&&raw.duration-end<=8)source.push({...w,...(variant.observed?{observed:variant.observed,analysisView:variant.view}:{})});
  if(role==='intro'&&start<=initialBarLimit&&end<=p.intro.end-.1)target.push({...w,...(variant.observed?{observed:variant.observed,analysisView:variant.view}:{})});
 }
 }
 }
 prepared.push({key,raw:engine.withGuardedLRC(raw),e,source,target,outro:observedGrid(p.outro,e),intro:observedGrid(p.intro,e),owners:owner(key)});
}
const report={version:1,method:'preserved-file-tail-original-pcm-v1',initialBarCandidateLimitSeconds:initialBarLimit,tracks:prepared.length,profileFunnel:{},pairConditions:{},windowExclusions:{},plans:[],windows:0,alternateViewTracks:extraEdges.size,scope:scope?{name:scope.name,tracks:scope.tracks.length,unavailableMembers:scope.unavailable?.length||0,source:scope.source}:null};
const count=(profiles,key)=>{for(const p of profiles){report.profileFunnel[p]??={};report.profileFunnel[p][key]=(report.profileFunnel[p][key]||0)+1;}};
for(const a of prepared)for(const b of prepared){
 if(a.key===b.key||a.raw.sha===b.raw.sha||a.key.replace('/bassi/','/')===b.key.replace('/bassi/','/'))continue;
 const profiles=[...a.owners].filter(x=>b.owners.has(x));if(!profiles.length)continue;count(profiles,'pairs');
 if(!a.source.length){count(profiles,'noCoherentEndingBars');continue;}
 if(!b.target.length){count(profiles,'noCoherentInitialBars');continue;}
 let tempo=false,voice=false,harmony=false;const choices=[],reached=new Set();
 const excluded=k=>{for(const p of profiles){report.windowExclusions[p]??={};report.windowExclusions[p][k]=(report.windowExclusions[p][k]||0)+1;}};
 for(const x of a.source)for(const y of b.target){
  if(x.meter!==y.meter){excluded('meter');continue;}if(x.bars!==y.bars){excluded('barSpan');continue;}reached.add('meterAndSpan');
  const pairOut=x.observed||a.outro,pairIn=y.observed||b.intro;
  if(partial&&(a.raw.duration-x.end>.65||y.start>1.5))continue;
  const ratio=(y.end-y.start)/(x.end-x.start);if(ratio<.95||ratio>1.05){
   if(diagnose){for(const factor of [.5,2])if(ratio*factor>=.95&&ratio*factor<=1.05){
    const key=a.key+'|'+b.key,previous=octavePairs.get(key),cost=Math.abs(Math.log(ratio*factor));
    if(!previous||cost<previous.cost)octavePairs.set(key,{from:a.key,to:b.key,ratio,factor,cost,
     source:{start:x.start,end:x.end,bars:x.bars,meter:x.meter},target:{start:y.start,end:y.end,bars:y.bars,meter:y.meter}});
   }}
   excluded('bpm');continue;
  }reached.add('bpm');
  const nearest=(beats,t)=>{let value=null,error=.075;for(const b of beats)if(Math.abs(b-t)<error){error=Math.abs(b-t);value=b}return value;};
  const sourceDown=x.downbeats.slice(0,-1).map(t=>nearest(pairOut.beats,t)),targetDown=y.downbeats.slice(0,-1).map(t=>nearest(pairIn.beats,t));
  if([...sourceDown,...targetDown].some(t=>t==null)){excluded('observedDownbeat');continue;}reached.add('observedDownbeat');
  const paired=x.modelBeats.map((t,i)=>[nearest(pairOut.beats,t),nearest(pairIn.beats,y.modelBeats[i])]).filter(p=>p.every(t=>t!=null));
  const fitted=placements(paired,sourceDown.map((t,i)=>[t,targetDown[i]]),ratio);
  if(!fitted.length)excluded('affineDownbeatFit');else reached.add('affineDownbeatFit');
  for(const {rate,begin} of fitted){
   const fade=a.raw.duration-begin,end=a.raw.duration;
   if(fade<4.5||fade>(partial?12:16)){excluded('overlapDuration');continue;}
   if(begin<pairOut.start+.1||begin<26||fade*rate>pairIn.end-.1){excluded('pcmBounds');continue;}tempo=true;reached.add('duration');
   const guard=clear(b.e,0,fade*rate+.3);
   const incomingClear=guard?.clear&&!(Number.isFinite(b.raw.firstLyricAt)&&b.raw.firstLyricAt<fade*rate+.3);
   const outgoingGuard=incomingClear?null:clear(a.e,begin-.3,end);
   const knownOutgoing=[a.raw.lastVoiceAt,a.raw.lastLyricAt,...(a.raw.lyricStarts||[])].some(t=>Number.isFinite(t)&&t>=begin-.3&&t<end+.1);
   let handoff=allowHandoff&&!incomingClear&&(!outgoingGuard?.clear||knownOutgoing)?vocalHandoff(a.e,b.e,a.raw,b.raw,begin,end,rate,clear):null;
   if(!incomingClear&&(!outgoingGuard?.clear||knownOutgoing)&&!handoff){excluded('voice');continue;}voice=true;reached.add('voice');
   const downbeatErrors=sourceDown.map((t,i)=>t-begin-targetDown[i]/rate),rms=Math.sqrt(downbeatErrors.reduce((s,x)=>s+x*x,0)/downbeatErrors.length);
   if(rms>.025||downbeatErrors.some(t=>Math.abs(t)>.05)){excluded('downbeatTiming');continue;}
   const h=engine.pcmFullHarmony(pairOut,pairIn,begin,0,rate,fade)||engine.pcmPreservedTailHarmony(pairOut,pairIn,begin,rate,fade,handoff?'vocal-handoff-foreground-v1':'first-attack-033-v1',handoff?.at);if(!h){excluded('harmony');continue;}harmony=true;reached.add('harmony');
   report.windows++;
   const diagnosis={};const full=engine.pcmFullBeatFit(pairOut,pairIn,begin,0,rate,fade,diagnosis);
   const silence=exactSilence[a.key];
   const silentSeconds=!partial&&!full&&validExactSuffix(silence,a.raw)?silence.zeroFrom-begin:null;
   const zeroFit=silentSeconds>=4.5?engine.pcmFullBeatFit(pairOut,pairIn,begin,0,rate,silentSeconds):null;
   if(diagnose&&!full)pulseRejections.push({from:a.key,to:b.key,begin,fade,rate,reason:diagnosis.reason,
    source:{start:x.start,end:x.end,bars:x.bars,meter:x.meter,modelBeats:x.modelBeats,downbeats:x.downbeats,
     observed:pairOut.beats.filter(t=>t>=begin-.075&&t<=begin+fade-.12)},
    target:{start:y.start,end:y.end,bars:y.bars,meter:y.meter,modelBeats:y.modelBeats,downbeats:y.downbeats,
     observed:pairIn.beats.filter(t=>t>=0&&t<=fade*rate-.12)}});
   const ending=tailWindows&&!partial&&!full&&!zeroFit?rhythmicTail(pairOut,begin,fade,x.end):null;
   const windowFit=ending?engine.pcmFullBeatFit(pairOut,pairIn,begin,0,rate,ending.seconds):null;
   const fit=partial?(!full&&metricalFit(pairOut,pairIn,x,y,begin,rate)):(full||zeroFit||windowFit);if(!fit){excluded(diagnosis.reason||'independentBeatFit');continue;}
   let windowHarmony=!zeroFit&&windowFit?(engine.pcmFullHarmony(pairOut,pairIn,begin,0,rate,fade)||engine.pcmPreservedTailHarmony(pairOut,pairIn,begin,rate,fade,'rhythmic-tail-foreground-v1',ending.seconds+.3)):h;
   if(zeroFit&&incomingClear&&allowHandoff){
    const foreground=vocalHandoff(a.e,b.e,a.raw,b.raw,begin,end,rate,clear);
    const verified=foreground&&engine.pcmPreservedTailHarmony(pairOut,pairIn,begin,rate,fade,'vocal-handoff-foreground-v1',foreground.at);
    if(verified){handoff=foreground;windowHarmony=verified;}
   }
   if(!windowHarmony){excluded('tailForegroundHarmony');continue;}
   choices.push({begin,end,fade,entry:0,tempo:rate,fit,harmony:windowHarmony,sourceWindow:x,targetWindow:y,
    complete:!partial&&!!(full||zeroFit),...(windowFit?{rhythmicTail:ending}:{}),incomingGuard:guard,outgoingGuard,
    vocalOverlapPolicy:handoff?'separated-vocal-handoff-v1':incomingClear?'instrumental-incoming-v1':'instrumental-outgoing-v1',vocalHandoff:handoff,downbeatRms:rms,sourceObservedDownbeats:sourceDown,targetObservedDownbeats:targetDown,pairOut,pairIn,
    ...(zeroFit?{exactSilentSuffix:{...silence,beatVerificationSeconds:silentSeconds}}:{})});
  }
 }
 const firstMissing=['meterAndSpan','bpm','observedDownbeat','affineDownbeatFit','duration','voice','harmony'].find(k=>!reached.has(k))||(!choices.length?'independentBeatFit':choices.some(c=>!c.rhythmicTail)?'completeCandidates':'rhythmicTailCandidates');
 for(const p of profiles){report.pairConditions[p]??={};report.pairConditions[p][firstMissing]=(report.pairConditions[p][firstMissing]||0)+1;}
 count(profiles,!tempo?'meterOrTempo':!voice?'incomingVocalOrLyric':!harmony?'localHarmony':!choices.length?'independentBeatFit':partial?'partialCandidates':choices.some(c=>!c.rhythmicTail)?'completeCandidates':'rhythmicTailCandidates');
 if(choices.length){
  const selected=shortlist(choices);
  for(const [number,c] of selected.entries()){
   const x=c.sourceWindow,y=c.targetWindow,fit=c.fit,h=c.harmony;
   const cue={kind:'beat',structuralBeat:true,preservedFileTail:true,measuredFullBeat:!partial&&!c.rhythmicTail,metricalRhythmic:partial||!!c.rhythmicTail,
    ...(c.rhythmicTail?{rhythmicTailWindow:true}:{}),
    nativeTailFullBeat:true,preserveTail:true,quietCertified:false,silenceTrim:false,softTailTrim:false,
    begin:c.begin,end:c.end,fade:c.fade,entry:0,tempo:c.tempo,gain:1,vocalFadeSeconds:0,preservedEntrance:c.rhythmicTail?'rhythmic-tail-foreground-v1':c.vocalHandoff?'vocal-handoff-foreground-v1':'first-attack-033-v1',
    sourceSha:a.raw.sha,targetSha:b.raw.sha,contentPenalty:0,
    sourceTempoBpm:60*x.bars*x.meter/(x.end-x.start),targetTempoBpm:60*y.bars*y.meter/(y.end-y.start),
    nominalTempo:(y.end-y.start)/(x.end-x.start),nativeRatePreferred:c.tempo===1&&fit.rms<=.025,
    beatAnchor:c.sourceObservedDownbeats[0],nextBeat:c.targetObservedDownbeats[0],beatPeriod:(x.end-x.start)/(x.bars*x.meter),
    measuredBeatCount:fit.beats,beatPulseAgreement:fit.ratio,measuredPlacementError:fit.rms,
    grooveScore:fit.score,score:fit.score,fullOnsetFirst:fit.firstHalf,fullOnsetSecond:fit.secondHalf,
    measuredPulseMode:fit.observedPulses,fullPulseFirst:fit.firstBeats,fullPulseSecond:fit.secondBeats,fullPulseAttackSupport:fit.attackSupport,
    harmonicEvidence:h,harmonicMode:h.compatibleKey?'compatible-key':h.percussiveIntro?'percussion':'local-chords',
    percussiveIntro:!!h.percussiveIntro,harmonicScore:h.average,harmonicWeakest:h.weakest,
    structuralEvidence:{version:1,...(c.exactSilentSuffix?{exactSilentSuffix:c.exactSilentSuffix}:{}),...(x.analysisView||y.analysisView?{edgeAnalysisViews:{source:x.analysisView||'original',target:y.analysisView||'original'}}:{}),bars:x.bars,beatsPerBar:x.meter,sourcePhaseConfidence:x.phase,targetPhaseConfidence:y.phase,
     ...(partial?{metricalCertificate:fit.metricalCertificate}:{}),
     ...(c.rhythmicTail?{rhythmicWindow:c.rhythmicTail}:{}),
     downbeatRms:c.downbeatRms,incomingWholeOverlap:c.incomingGuard,outgoingWholeOverlap:c.outgoingGuard,vocalOverlapPolicy:c.vocalOverlapPolicy,...(c.vocalHandoff?{vocalHandoff:c.vocalHandoff}:{}),
     sourceObservedDownbeats:c.sourceObservedDownbeats,targetObservedDownbeats:c.targetObservedDownbeats,
     sourceModelDownbeats:x.downbeats,targetModelDownbeats:y.downbeats,
     pulseCheck:{source:c.pairOut.beats.filter(t=>t>=c.begin-.075&&t<=c.end-.12).map(t=>t-c.begin),
      target:c.pairIn.beats.filter(t=>t>=0&&t<=c.fade*c.tempo-.12),
      sourceBars:c.sourceObservedDownbeats.map(t=>t-c.begin),targetBars:c.targetObservedDownbeats.map(t=>t/c.tempo)},
     method:'source-eof-and-original-pcm-initial-pickup-v1',humanVerified:false,semanticLabelsVerified:false}};
   report.plans.push({from:a.key,to:b.key,profiles,primary:number===0,cue});
  }
 }
}
if(diagnose)report.diagnostics={notPlaybackCertificates:true,pulseRejections,
 octaveTempoPairs:octavePairs.size,octaveSamples:[...octavePairs.values()].sort((a,b)=>a.cost-b.cost||a.from.localeCompare(b.from)||a.to.localeCompare(b.to)).slice(0,64)};
const output=arg('output','preserved-tail-plans.json');fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,plans:report.plans.length,diagnostics:diagnose?{pulseWindows:pulseRejections.length,octaveTempoPairs:octavePairs.size}:undefined}));
