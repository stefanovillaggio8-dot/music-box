'use strict';
// Cached, SHA-bound preflight only. No beat insertion, PCM decoding or cue.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {currentSteScope,validateSteCases}=require('../../tools/ste-research-scope.cjs');
const root=path.resolve(__dirname,'../..'),protocol=require('./protocol.json'),output=process.argv[2];
if(!output||fs.existsSync(output))throw Error('New evidence output required');
const index=require('../../dj-deep-analysis.json'),scope=currentSteScope();validateSteCases([protocol.pair],scope,index);
const keys=[protocol.pair.from,protocol.pair.to],whole={},pcm={},files=[
 '../whole-structure-ci/whole-structure-15/structure-15.json','../whole-structure-ci/whole-structure-2/structure-2.json',
 '../pcm-v3/pcm-0.json','../pcm-v3/pcm-11.json'];
const hashes={};for(const file of files){const bytes=fs.readFileSync(path.resolve(root,file));hashes[file]=crypto.createHash('sha256').update(bytes).digest('hex');
 const d=JSON.parse(bytes);for(const key of keys)if(d.entries[key]){
  const e=d.entries[key];assert.equal(e.sha,index.entries[key].sha);
  if(file.includes('whole-structure')){assert.equal(e.modelSha256['torch/hub/checkpoints/beat_this-final0.ckpt'],'8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331');whole[key]=e;}
  else{assert.equal(e.pcmTransition.sha,e.sha);pcm[key]=e.pcmTransition;}
 }}
const source=fs.readFileSync(path.join(root,'mix-intelligente.js'),'utf8'),start=source.indexOf('function pcmPreservedTailHarmony('),end=source.indexOf('// Offline pair plans',start);
let block=source.slice(start,end);const add=(needle,replacement)=>{assert.equal(block.split(needle).length,2);block=block.replace(needle,replacement)};
add(' if(source.length<6||Math.max(...clashes)>.45||Math.max(...excess)>.05)return null;',
 ` Object.assign(globalThis.__steHarmonyTrace,{sharedTonalFrames:source.length,frames,maximumRawClash:Math.max(...clashes),maximumAddedClash:Math.max(...excess)});
 if(source.length<6||Math.max(...clashes)>.45||Math.max(...excess)>.05)return null;`);
add(' if(!a||!b||Math.min(a.confidence,b.confidence)<.70||camelotMatch({camelot:a},{camelot:b}).score<.92)return null;',
 ` Object.assign(globalThis.__steHarmonyTrace,{sourceKey:a,targetKey:b,keyFit:a&&b?camelotMatch({camelot:a},{camelot:b}).score:null});
 if(!a||!b||Math.min(a.confidence,b.confidence)<.70||camelotMatch({camelot:a},{camelot:b}).score<.92)return null;`);
const instrumented=source.slice(0,start)+block+source.slice(end);
const audit=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const wrappedFs={...fs,readFileSync:(f,...args)=>path.resolve(String(f))===path.join(root,'mix-intelligente.js')?instrumented:fs.readFileSync(f,...args)};
const {engine}=new Function('require','__dirname',audit.slice(0,audit.indexOf('const tracks='))+'return {engine}')(n=>n==='node:fs'?wrappedFs:require(n),path.join(root,'tools'));
const quiet=require('../../tools/pcm-vocal-handoff.cjs').quietBounds,sourceVoice=quiet(whole[keys[0]]),targetVoice=quiet(whole[keys[1]]),rows=[];
try{for(const w of protocol.windows){
 const rate=(w.targetBarEnd-w.targetDownbeat)/(w.sourceBarEnd-w.sourceDownbeat),begin=w.sourceDownbeat-w.targetDownbeat/rate,end=index.entries[keys[0]].duration,fade=end-begin;
 globalThis.__steHarmonyTrace={};const ordinary=engine.pcmFullHarmony(pcm[keys[0]].outro,pcm[keys[1]].intro,begin,0,rate,fade);
 const preserved=engine.pcmPreservedTailHarmony(pcm[keys[0]].outro,pcm[keys[1]].intro,begin,rate,fade,'first-attack-033-v1');
 const lower=sourceVoice.suffixFrom-begin+.3,upper=targetVoice.prefixThrough/rate-.3;
 rows.push({hypothesizedBars:w.bars,begin,end,fade,entry:0,tempo:rate,geometryIsModelHypothesis:true,
  estimatedIncomingClear:targetVoice.prefixThrough>=fade*rate,estimatedVocalHandoffPossible:lower<=upper,
  sourceQuietSuffixFrom:sourceVoice.suffixFrom,targetQuietPrefixThrough:targetVoice.prefixThrough,
  originalHarmonyAccepted:!!ordinary,preservedHarmonyAccepted:!!preserved,harmonicTrace:globalThis.__steHarmonyTrace,
  newHighFrequencyOnsetAnalysisStarted:false,reason:!ordinary&&!preserved?'independent-harmony-gate-not-met':'further-rhythm-evidence-required'});
 }}finally{delete globalThis.__steHarmonyTrace}
const result={profile:'Ste',recordings:scope.tracks.length,pair:protocol.pair,originalSha:keys.map(k=>index.entries[k].sha),cachedFileSha256:hashes,
 distinctPairs:1,geometries:rows.length,newPcmDecodes:0,newModelInferences:0,newRenders:0,newCertifiedPairs:0,
 caveat:'Cached model/PCM summaries do not prove perceptual dissonance or human structure. No pair is certified.',rows};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(rows));
