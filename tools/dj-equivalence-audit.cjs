"use strict";
// Exhaustive ordered-pair audit of stored waveform-derived features.
// NOT an external Spotify-equivalence certificate or a listening test.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const args=process.argv.slice(2);
const arg=(key,otherwise)=>args.find(a=>a.startsWith("--"+key+"="))?.slice(key.length+3)??otherwise;
const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const database=JSON.parse(fs.readFileSync(arg('index',path.join(root,"dj-deep-analysis.json")),"utf8"));
const karaoke=JSON.parse(fs.readFileSync(path.join(root,"karaoke-index.json"),"utf8"));
const lyricBoundaries=JSON.parse(fs.readFileSync(arg('lyrics',path.join(root,"dj-lyric-boundaries.json")),"utf8"));
const version=JSON.parse(fs.readFileSync(path.join(root,"versione.json"),"utf8"));
const snippet=(from,to)=>{
 const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
 if(a<0||b<a)throw Error("Missing DJ source function "+from);
 return source.slice(a,b);
};
// Same real-index engine used in tests/dj-real-library.test.cjs, plus
// the exact desktop playback beat-certifier. A postlude is NOT a beatmatch.
const engine=new Function("isIOS","style","djLyricBoundaries",
 "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\n"+
 snippet("function withGuardedLRC(","function loadDJLyricBoundaries(")+
 snippet("function verifiedIndexedGridTempo(","function deepLookup(")+
 snippet("function onsetPairAgreement(","function iphoneBeatPairCertified(")+
 snippet("function desktopBeatPairCertified(","function certifiedNeutralBridge(")+
 snippet("function grooveAgreement(","// Find a *musical* release")+
 snippet("function certifiedNeutralBridge(","function mobileMixAllowed(")+
 snippet("function compatibility(","async function decode(")+
 snippet("function hasReliableHarmony(","function resetMobileFade(")+
 snippet("function desktopBeatStartDelay(","async function beginMix(")+
 "\nreturn {measuredFullBeatBridge,pcmFullBeatFit,pcmFullHarmony,pcmPreservedTailHarmony,fullBeatCueCertified,structuralContentDecision,incomingContentDecision,validatePreservedFileTailCue,transition,desktopBeatPairCertified,desktopBeatStartDelay,withGuardedLRC,verifiedIndexedGridTempo};"
)(false,"auto",lyricBoundaries.entries||{});
const tracks=Object.entries(database.entries||{})
 .filter(([k,x])=>x?.status==="ok"&&Number.isFinite(x.duration)&&x.duration>=26&&
  Array.isArray(x.chroma)&&x.chroma.length===12&&x.bpm>=55&&x.bpm<=210)
 .sort(([a],[b])=>a.localeCompare(b))
 .map(([key,meta])=>[key,engine.withGuardedLRC(engine.verifiedIndexedGridTempo(meta))]);
// Independent PCM spotchecks need the EXACT simulated mix point, not a
// generic final four seconds that can be after an earlier beat entry.
const fromKey=arg("pair-from",""),toKey=arg("pair-to","");
if(fromKey||toKey){
 if(!fromKey||!toKey)throw Error("Supply both --pair-from and --pair-to");
 const byKey=new Map(tracks);
 const a=byKey.get(fromKey),b=byKey.get(toKey);
 if(!a||!b)throw Error("Unanalyzable pair: "+fromKey+" -> "+toKey);
 const plan=engine.transition(a,b,a.duration);
 const beatLike=!!plan&&(["beat","snap","phrase"].includes(plan.kind)||
  plan.measuredBeatBridge===true||plan.earlyBeatJoin===true||
  plan.rhythmicGridJoin===true||plan.strongBeatBridge===true);
 const certified=!!(beatLike&&
  engine.desktopBeatPairCertified(a,b,plan)===true&&
  Number.isFinite(plan.begin)&&Number.isFinite(plan.end)&&
  Number.isFinite(a.last)&&plan.begin<a.last-.05&&
  plan.end>plan.begin&&plan.end<=a.duration+.2&&
  Number.isFinite(plan.score));
 // The playback engine arms the cue at begin, then waits for the next
 // matching kick. PCM measurements must start at the *audible* moment.
 const hasScheduledBeat=!!plan&&Number.isFinite(plan.beatPeriod)&&
  ["beat","snap","phrase","underlay"].includes(plan.kind);
 const beatStartWait=hasScheduledBeat&&Number.isFinite(plan?.begin)?
  engine.desktopBeatStartDelay(plan,plan.begin):0;
 const scheduledStart=Number.isFinite(beatStartWait)&&
   Number.isFinite(plan?.begin)?plan.begin+beatStartWait:null;
 console.log("[DJ PAIR PLAN]",JSON.stringify({from:fromKey,to:toKey,
  analyzedFrom:a.duration,analyzedTo:b.duration,
  lastAudible:a.last,plan,beatLike,certified,
  beatStartWait,scheduledStart,
  evidence:"metadata-engine simulation only; verify original PCM separately"}));
 process.exit(0);
}
const parts=arg("shard","0/1").split("/").map(Number);
const [shard,totalShards]=parts;
if(!Number.isInteger(shard)||!Number.isInteger(totalShards)||shard<0||
 totalShards<1||shard>=totalShards)throw Error("Expected --shard=0/12");
const maxOutgoing=Number(arg("max-outgoing","0"));
if(!Number.isInteger(maxOutgoing)||maxOutgoing<0)throw Error("Bad max-outgoing");
const result={
 schema:3,version:version.versione,catalogTracks:version.brani,
 indexTracks:Object.keys(database.entries||{}).length,
 analyzableTracks:tracks.length,
 excludedIndexTracks:Object.keys(database.entries||{}).length-tracks.length,
 lyricalBoundariesLoaded:tracks.filter(([k,a])=>a.lrcBoundarySource==="existing-synced-lrc-not-vocal-model").length,
 beatGridsTempoRefined:tracks.filter(([k,a])=>a.tempoVerifiedByGrid===true).length,
 possibleOrderedPairs:tracks.length*(tracks.length-1),
 shard,totalShards,analyzedPairs:0,verifiedBeat:0,earlyVerifiedBeat:0,
 completePcmBeat:0,renderedFullBeat:0,shortIndexedBeat:0,fullOverlapSeconds:0,
 metricalRhythmic:0,structuralEarlyExits:0,commonPcmAssets:0,crossfadePlans:0,normalChanges:0,
 plannedKinds:{},
 verifiedBeatSamples:[],verifiedPairs:[],safariFullWithCommonPcm:0,safariFullNativeNoAttenuation:0,safariFullAvailable:0,
 rejectedBeat:0,postlude:0,underlay:0,other:0,none:0,errors:[],
 nonBeatSamples:[],karaoke:{
  syncedLinesIndexed:Object.values(karaoke).filter(x=>x?.synced===true).length,
  provenWordAlignmentFromIndex:false,
  caveat:"Synced LRC lines do not prove the times of individual words."
 },verdict:"NOT_CERTIFIED",
 caveat:"Simulates the actual player feature enrichment with guarded synced-LRC and validated beat-grid BPM. Still not an acoustic listening test, comparison with Spotify, or physical iPhone verification."
};
const beatLike=p=>!!p&&(["beat","snap","phrase"].includes(p.kind)||
 p.measuredBeatBridge===true||p.earlyBeatJoin===true||
 p.rhythmicGridJoin===true||p.strongBeatBridge===true);
let outgoing=0;
for(let i=0;i<tracks.length;i++){
 if(i%totalShards!==shard)continue;
 if(maxOutgoing&&outgoing>=maxOutgoing)break;
 outgoing++;
 const [from,a]=tracks[i];
 for(let j=0;j<tracks.length;j++){
  if(i===j)continue;
  const [to,b]=tracks[j];
  result.analyzedPairs++;
  let plan;
  try{plan=engine.transition(a,b,a.duration)}
  catch(e){
   result.none++;
   if(result.errors.length<12)result.errors.push({from,to,error:String(e)});
   continue;
  }
  if(!plan){result.none++;result.normalChanges++;continue;}
  result.plannedKinds[plan.kind]=(result.plannedKinds[plan.kind]||0)+1;
  if(beatLike(plan)){
   let certified=false;
   try{certified=engine.desktopBeatPairCertified(a,b,plan)===true}
   catch(e){if(result.errors.length<12)result.errors.push({from,to,error:String(e)});}
   const audible=Number.isFinite(plan.begin)&&Number.isFinite(plan.end)&&
     Number.isFinite(a.last)&&plan.begin<a.last-.05&&
     plan.end>plan.begin&&plan.end<=a.duration+.2;
   if(certified&&audible&&Number.isFinite(plan.score)){
    result.verifiedBeat++;
    const common=!!plan.composite?.timingVerified;
    const nativeSafe=Number(plan.outputHeadroom)>=.999;
    result.verifiedPairs.push({from,to,full:!!plan.measuredFullBeat,partial:!!plan.metricalRhythmic,
     structural:!!plan.structuralBeat,common,fade:plan.fade,begin:plan.begin,end:plan.end,entry:plan.entry,
     rmsSeconds:plan.composite?.postRenderRhythm?.rmsSeconds??null,
     peak:plan.composite?.oversampledPeak??null,
     commonSha:plan.composite?.sha256??null});
    if(plan.measuredFullBeat){
     result.completePcmBeat++;result.fullOverlapSeconds+=plan.fade;
     if(common)result.safariFullWithCommonPcm++;
     if(nativeSafe)result.safariFullNativeNoAttenuation++;
     if(common||nativeSafe)result.safariFullAvailable++;
     if(plan.renderEvidence?.timingVerified||plan.composite?.timingVerified&&plan.composite?.rhythmVerified)result.renderedFullBeat++;
    }else if(plan.metricalRhythmic)result.metricalRhythmic++;
    else result.shortIndexedBeat++;
    if(plan.structuralBeat&&plan.end<=a.duration-8)result.structuralEarlyExits++;
    if(plan.composite?.timingVerified)result.commonPcmAssets++;
    if(result.verifiedBeatSamples.length<12)
     result.verifiedBeatSamples.push({from,to,kind:plan.kind,
      begin:plan.begin,end:plan.end,entry:plan.entry,
      fade:plan.fade,tempo:plan.tempo,
      lastAudible:a.last,score:plan.score,
      rendered:!!(plan.renderEvidence?.timingVerified||plan.composite?.timingVerified&&plan.composite?.rhythmVerified),
      metricalRhythmic:!!plan.metricalRhythmic,structuralEarlyExit:!!plan.structuralBeat,
      outputHeadroom:plan.outputHeadroom??null});
    if(plan.begin<a.last-.6)result.earlyVerifiedBeat++;
   }else result.rejectedBeat++;
  }else if(plan.kind==="postlude"||plan.measuredPostludeBridge)result.postlude++;
  else if(plan.kind==="underlay"||plan.subduedRhythmicUnderlay)result.underlay++;
  else{result.other++;if(plan.kind==='cut')result.normalChanges++;
   else if(['soft','fade','rise','continuity'].includes(plan.kind))result.crossfadePlans++;}
  if(result.nonBeatSamples.length<15&&
    (!beatLike(plan)||result.rejectedBeat>0&&!Number.isFinite(plan.score)))
   result.nonBeatSamples.push({from,to,kind:plan.kind||null});
 }
 if(outgoing%25===0)console.log("Checked",outgoing,"source tracks in shard",shard);
}
const sum=result.verifiedBeat+result.rejectedBeat+result.postlude+
 result.underlay+result.other+result.none;
if(sum!==result.analyzedPairs)throw Error("Audit arithmetic error");
result.averageFullOverlapSeconds=result.completePcmBeat?result.fullOverlapSeconds/result.completePcmBeat:null;
result.coveragePercent=result.analyzedPairs?
 +(100*result.verifiedBeat/result.analyzedPairs).toFixed(5):0;
result.verdict=result.analyzedPairs===result.possibleOrderedPairs&&
 result.verifiedBeat===result.analyzedPairs&&result.errors.length===0&&
 result.excludedIndexTracks===0?
 "FEATURE_INDEX_ONLY_ALL_PAIRS":"NOT_CERTIFIED";
const output=arg("output","");
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n");}
console.log("[DJ PAIR AUDIT]",JSON.stringify(result));
if(args.includes("--require-all")&&result.verdict==="NOT_CERTIFIED")process.exitCode=1;
