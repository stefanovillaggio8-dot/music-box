#!/usr/bin/env node
'use strict';
// Replays the REAL selector and planner. No live user preference or queue
// is written. Public snapshot membership and assumed offline state differ
// explicitly; a source model, not listening judgement, supplies the evidence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(p,'utf8');
const index=JSON.parse(read(arg('index',path.join(root,'dj-deep-analysis.json'))));
const source=read(arg('engine',path.join(root,'mix-intelligente.js'))),appSource=read(arg('app',path.join(root,'app.js')));
const lyricBoundaries=JSON.parse(read(path.join(root,'dj-lyric-boundaries.json'))).entries;
const state=JSON.parse(read(path.join(root,'stato.json'))),playlists=JSON.parse(read(path.join(root,'playlist.json')));
const a=appSource.indexOf('const BUILTIN = ['),b=appSource.indexOf('];',a);
const rawCatalog=vm.runInNewContext(appSource.slice(a,b+2)+';BUILTIN');
const idStart=appSource.indexOf('function _idBranoStabile('),idEnd=appSource.indexOf('// Queste funzioni',idStart);
const stableId=new Function('BUILTIN',appSource.slice(idStart,idEnd)+'return _idBranoStabile;')(rawCatalog);
const catalog=rawCatalog.map(t=>({...t,id:stableId(t)}));
const snippet=(from,to)=>{const a=source.indexOf(from),b=source.indexOf(to,a+from.length);if(a<0||b<a)throw Error('Missing runtime slice '+from);return source.slice(a,b)};
const sampleRate=48000,isIOS=arg('platform','safari')==='safari';
const commonScope={Map,Set,Number,Array,Uint8Array,Float32Array};commonScope.window=commonScope;vm.createContext(commonScope);
vm.runInContext(read(path.join(root,'audio-composite-mix.js')),commonScope);
const microtask=fn=>{queueMicrotask(fn);return 0;};
const program=`const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const enabled=true,style='auto',djLyricBoundaries=boundaries,cache=new Map(),deepIndex={analyzed:1176};
 let shuffleGeneration=0,shuffleLastDecision=null,recentLibraryIds=[];
 const deepLookup=t=>lookup(t),decode=async t=>lookup(t);
 `+
 snippet('function withGuardedLRC(','function loadDJLyricBoundaries(')+
 snippet('function verifiedIndexedGridTempo(','function deepLookup(')+
 snippet('function withValidatedVoice(','function deepStatus(')+
 snippet('function onsetPairAgreement(','function iphoneBeatPairCertified(')+
 snippet('function iphoneBeatPairCertified(','function desktopBeatPairCertified(')+
 snippet('function desktopBeatPairCertified(','function certifiedNeutralBridge(')+
 snippet('function grooveAgreement(','// Find a *musical* release')+
 snippet('function certifiedNeutralBridge(','function mobileMixAllowed(')+
 snippet('function mobileMixAllowed(','function rememberMobileClip(')+
 snippet('function compatibility(','async function decode(')+
 snippet('function hasReliableHarmony(','function resetMobileFade(')+
 snippet('function desktopBeatStartDelay(','async function beginMix(')+
 // Caching a deterministic top-level plan avoids recomputing pairs across
 // sessions; selection, fresh history and RNG still run for every event.
 `const nativeTransition=transition,plans=new Map();transition=(a,b,dur)=>{
 const key=[a.sha,b.sha,a.lastLyricAt,b.firstLyricAt,a.mixPosition||0,dur].join('|');
 if(!plans.has(key))plans.set(key,nativeTransition(a,b,dur));return plans.get(key);};`+
 snippet('async function intelligentShuffle(','let recentLibraryIds=')+
 `return {transition,desktopBeatPairCertified,iphoneBeatPairCertified,iphoneQuietReleaseCertified,mobileMixAllowed,
 musicallyCompatibleOverlay,withGuardedLRC,verifiedIndexedGridTempo,intelligentShuffle,decision:()=>shuffleLastDecision};`;
let scenarioOffline=false,available=new Set(),preparedMixes=new Set();
const window={MusicBoxRoom:{isActive:()=>false},MusicBoxStretch:{},MusicBoxCompositeMix:{
 supports:c=>commonScope.MusicBoxCompositeMix.supports(c)&&(!scenarioOffline||preparedMixes.has(c.composite.sha256)),
 isPrepared:c=>preparedMixes.has(c.composite.sha256)}};
const metaCache=new Map();let engine;
function keyFor(t,boost=false){
 if(!t?.file)return null;const candidates=['audio/','app/','mobile/'].map(p=>p+t.file);
 if(boost)candidates.unshift('audio/'+t.file.replace('/','/bassi/'));
 return candidates.find(k=>index.entries[k]?.status==='ok')||null;
}
function lookup(t){
 const key=t?.analysisKey||keyFor(t);if(!key)return null;
 if(!metaCache.has(key))metaCache.set(key,engine.withGuardedLRC(engine.verifiedIndexedGridTempo(index.entries[key])));
 return metaCache.get(key);
}
engine=new Function('isIOS','boundaries','lookup','window','navigator','document','console','setTimeout','clearTimeout',program)(
 isIOS,lyricBoundaries,lookup,window,{get onLine(){return !scenarioOffline}},{hidden:false},{info(){},warn(){}},microtask,()=>{});
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const shuffled=(items,random)=>{const copy=items.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
const profiles=['Ste','Diego','Emanuele'],offlineFilterImplemented=appSource.includes('function _mixPlayableNow(');
function members(profile,playlist=null){
 const copies=new Set(state.miei?.[profile]||[]),deleted=new Set(state.eliminati||[]);
 const only=new Set((state.soloInPlaylist||[]).filter(x=>x.startsWith(profile+'.')).map(x=>x.slice(profile.length+1)));
 for(const p of playlists)if(p.nascosta&&p.nascostaDa===profile)for(const id of p.tracks||[])only.add(id);
 const rows=catalog.filter(t=>((t.profile||'Ste')===profile||copies.has(t.id))&&
  !deleted.has(profile+'.'+t.id)&&!(profile==='Ste'&&deleted.has(t.id))&&
  (playlist?(playlist.tracks||[]).includes(t.id):!only.has(t.id)));
 const unique=new Map();for(const t of rows)if(!unique.has(t.id)||(t.profile||'Ste')===profile)unique.set(t.id,t);
 return [...unique.values()].map(t=>({...t,url:t.file,analysisKey:keyFor(t)}));
}
function resultFor(from,to){
 if(scenarioOffline&&!available.has(to.id))return {kind:'unavailable',overlap:0,skipped:0};
 const a=lookup(from),b=lookup(to);if(!a||!b)return {kind:'normal',overlap:0,skipped:0,missingAnalysis:true};
 let position=0,p=null;
 for(let retry=0;retry<18;retry++){
  p=engine.transition({...a,mixPosition:position},b,a.duration);
  if(!p?.structuralBeat||window.MusicBoxCompositeMix.supports(p))break;
  position=p.begin+.06;
 }
 if(!p||p.begin<position-.1)return {kind:'normal',overlap:0,skipped:0};
 const common=window.MusicBoxCompositeMix.supports(p);
 const allowed=engine.musicallyCompatibleOverlay(a,b,p)&&engine.desktopBeatPairCertified(a,b,p)&&
  (!p.structuralBeat||common)&&(!isIOS||engine.mobileMixAllowed(p,a,a.lastLyricAt)&&engine.iphoneBeatPairCertified(a,b,p)&&engine.iphoneQuietReleaseCertified(a,p))&&
  (!isIOS||!p.measuredFullBeat||common||p.outputHeadroom>=.999);
 let kind='normal';
 if(allowed){if(p.measuredFullBeat)kind='full';else if(p.metricalRhythmic||p.kind==='snap')kind='partial';
  else if(['soft','fade','rise'].includes(p.kind))kind='crossfade';else if(p.kind==='postlude')kind='postlude';else if(p.kind==='underlay')kind='underlay';}
 const skipped=p.structuralBeat&&allowed?Math.max(0,(a.musicalContent?.audibleEnd??a.last)-p.end):0;
 const incomingOmitted=kind==='normal'?0:Math.max(0,p.entry||0);
 return {kind,overlap:kind==='normal'?0:p.fade,skipped,incomingOmitted,
  incomingAudibleUpperBound:Math.max(0,incomingOmitted-(b.musicalContent?.audibleStart??0)),begin:p.begin,end:p.end,
  earlyOverlapStart:!!(allowed&&p.begin<=a.duration-8),
  early:!!(allowed&&p.structuralBeat&&p.end<=a.duration-8),safariFull:kind==='full'&&(common||p.outputHeadroom>=.999),
  significantContentSkippedSeconds:null,semanticContentUnknown:true};
}
async function simulate(profile,mode,list,sessions,steps,seed){
 const totals={attempts:0,full:0,partial:0,crossfade:0,normal:0,postlude:0,underlay:0,unavailable:0,early:0,safariFull:0,
  overlapSum:0,skippedSum:0,maxSkipped:0,incomingOmittedSum:0,maxIncomingOmitted:0,incomingAudibleUpperBoundSum:0,
  earlyOverlapStart:0,longestWithoutFull:0,automaticChanges:0,manualQueueChanges:0,missingAnalysis:0};
 const trace=[];scenarioOffline=mode==='offline-shuffle';preparedMixes=new Set();
 const random=rng(seed),offlineOrder=shuffled(list,random);available=new Set(offlineOrder.slice(0,Math.ceil(list.length/2)).map(t=>t.id));
 for(let session=0;session<sessions;session++){
  const ordered=mode==='ordered'||mode==='playlist'||mode==='manual-queue';
  let fresh=ordered?list.slice():shuffled(list,random);
  if(scenarioOffline&&offlineFilterImplemented)fresh=fresh.filter(t=>available.has(t.id));
  const start=scenarioOffline?fresh.findIndex(t=>available.has(t.id)):0;
  let current=start>=0?fresh.splice(start,1)[0]:null,streak=0;
  for(let step=0;current&&fresh.length&&step<steps;step++){
   let pool=fresh.slice(),next=pool[0],selected=false;
   if(!ordered){
    const app={currentId:()=>current.id,allTracks:()=>list,mixUrl:t=>t.url,mixLyricCues:()=>null,mixRunningContext:()=>({sampleRate}),
     mixShuffleCandidates:()=>pool.slice(0,10),mixShufflePool:()=>pool,
     mixSelectShuffle:({fromId,initialFirst,pickId})=>{
      if(fromId!==current.id||initialFirst!==pool[0].id||!pool.some(t=>t.id===pickId))throw Error('Selector escaped fresh profile/playlist pool');
      next=pool.find(t=>t.id===pickId);selected=true;return true;}};
    const data=lookup(current);if(data)await engine.intelligentShuffle(app,{duration:data.duration,currentTime:0},current.id);
   }
   if(!fresh.some(t=>t.id===next.id)||next.id===current.id)throw Error('Repeated or out-of-pool selection');
   const result=resultFor(current,next);totals.attempts++;totals[result.kind]++;totals.early+=!!result.early;totals.safariFull+=!!result.safariFull;
   totals.overlapSum+=result.overlap||0;totals.skippedSum+=result.skipped||0;totals.maxSkipped=Math.max(totals.maxSkipped,result.skipped||0);
   totals.incomingOmittedSum+=result.incomingOmitted||0;totals.maxIncomingOmitted=Math.max(totals.maxIncomingOmitted,result.incomingOmitted||0);
   totals.incomingAudibleUpperBoundSum+=result.incomingAudibleUpperBound||0;totals.earlyOverlapStart+=!!result.earlyOverlapStart;
   totals.manualQueueChanges+=mode==='manual-queue';
   totals.automaticChanges+=selected;totals.missingAnalysis+=!!result.missingAnalysis;
   streak=result.kind==='full'?0:streak+1;totals.longestWithoutFull=Math.max(totals.longestWithoutFull,streak);
   if(trace.length<40)trace.push({session,step,from:current.id,to:next.id,...result});
   fresh=fresh.filter(t=>t.id!==next.id);current=next;
  }
 }
 const mixed=totals.attempts-totals.normal-totals.unavailable;
 return {profile,mode,members:list.length,sessions,steps,seed,totals,
  percent:Object.fromEntries(['full','partial','crossfade','normal','postlude','underlay','unavailable','early','safariFull'].map(k=>[k,totals.attempts?100*totals[k]/totals.attempts:0])),
  averageOverlap:mixed?totals.overlapSum/mixed:0,averageSkippedAudible:totals.attempts?totals.skippedSum/totals.attempts:0,
  significantAudioSkipped:'NOT_SEMANTICALLY_ANNOTATED; audible seconds are an upper bound',trace};
}
function inventory(profile,list,audit){
 const full=[],seen=new Set();
 for(const pair of audit.verifiedPairs.filter(p=>p.full)){
  const fromSha=index.entries[pair.from]?.sha,toSha=index.entries[pair.to]?.sha;
  for(const from of list.filter(t=>lookup(t)?.sha===fromSha))for(const to of list.filter(t=>lookup(t)?.sha===toSha)){
   const key=from.id+'|'+to.id;if(seen.has(key))continue;seen.add(key);
   const result=resultFor(from,to);if(result.kind!=='full')continue;
   full.push({from:from.id,to:to.id,fromTitle:from.title,toTitle:to.title,fromSha,toSha,...result});
  }
 }
 return {profile,members:list.length,completePairs:full.length,
  uniqueRecordingPairs:new Set(full.map(p=>p.fromSha+'|'+p.toSha)).size,full};
}
(async()=>{
 const report={version:2,platform:isIOS?'safari-logical-capability':'desktop-logical-capability',seed:20261114,
  sourceSnapshot:'Unchanged BUILTIN + repository stato.json + playlist.json; includes ONLY explicit published copies, deletions and hidden playlist membership.',
  offlineAssumption:'Synthetic fixed 50% MP3 manifest, no predecoded common buffers. NOT a measurement of the user device downloads.',
  limits:'Metadata/actual-code simulation; no human beauty judgement, physical browser latency or unknown device preferences. Missing analysis never becomes a verified transition.',results:[],inventories:[]};
 const audit=arg('inventory-audit','')?JSON.parse(read(arg('inventory-audit',''))):null;
 const sessions=Number(arg('sessions','20')),steps=Number(arg('steps','40'));
 for(const [i,profile] of profiles.entries()){
  if(arg('only-profile','')&&arg('only-profile','')!==profile)continue;
  const library=members(profile);
  if(audit)report.inventories.push(inventory(profile,library,audit));
  if(arg('inventory-only','false')==='true')continue;
  for(const mode of ['ordered','manual-queue','shuffle','offline-shuffle']){
   if(arg('only-mode','')&&arg('only-mode','')!==mode)continue;
   const result=await simulate(profile,mode,library,mode==='ordered'||mode==='manual-queue'?1:sessions,mode==='ordered'?library.length-1:steps,20261114+i*100);
   report.results.push(result);console.log(JSON.stringify({profile,mode,members:library.length,full:result.totals.full,attempts:result.totals.attempts}));
  }
  for(const playlist of playlists.filter(p=>p.nascostaDa===profile))for(const mode of ['playlist','playlist-shuffle']){
   if(arg('only-mode','')&&arg('only-mode','')!==mode)continue;
   report.results.push({...await simulate(profile,mode,members(profile,playlist),mode==='playlist'?1:sessions,playlist.tracks.length-1,20261114+i),playlist:playlist.name});
  }
 }
 fs.writeFileSync(arg('output','listening-simulation.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
