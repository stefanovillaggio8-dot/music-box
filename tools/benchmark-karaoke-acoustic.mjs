#!/usr/bin/env node
// Manual references are evaluation data only; never supplied as ASR output.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
const arg=(key,fallback)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3)??fallback;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const records=JSON.parse(fs.readFileSync(arg('references','references.json'),'utf8'));
const audio=path.resolve(arg('audio','references')),output=path.resolve(arg('output','acoustic-results.json'));
const runtime=arg('runtime','@huggingface/transformers');
const {pipeline,env}=await import(path.isAbsolute(runtime)?pathToFileURL(runtime).href:runtime);
env.cacheDir=path.resolve(arg('cache','.cache/karaoke'));
env.backends.onnx.wasm.numThreads=2;
const context={console,Map,Set,Float32Array,Uint8Array,AbortController,setTimeout,clearTimeout};
context.window=context;context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'word-karaoke.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'audio-lyrics-align.js'),'utf8'),context);
const normalize=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const stats=values=>{
 if(!values.length)return null;
 const sorted=values.map(Math.abs).sort((a,b)=>a-b),quantile=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))];
 return {count:values.length,signedMeanMs:values.reduce((a,b)=>a+b,0)/values.length,
   medianAbsoluteMs:quantile(.5),p90AbsoluteMs:quantile(.9),p95AbsoluteMs:quantile(.95),
   within50:sorted.filter(x=>x<=50).length/values.length,within100:sorted.filter(x=>x<=100).length/values.length,
   within250:sorted.filter(x=>x<=250).length/values.length};
};
const report={schema:1,source:'https://huggingface.co/datasets/jamendolyrics/jamendolyrics',
 reference:'manually annotated word starts and ends, current dataset',
 inference:{model:arg('model','onnx-community/whisper-tiny_timestamped'),library:'transformers.js 3.8.1',device:'cpu',
 dtype:{encoder_model:'fp32',decoder_model_merged:'q4'},browserWebGPUVerified:false},
 referenceLanguages:[...new Set(records.map(r=>r.language||'en'))],
 limitation:'External references with exact human line anchors isolate acoustic word timing. No claim of Italian or full-catalog word accuracy.',cases:[]};
report.inference.revision=arg('revision',report.inference.model==='onnx-community/whisper-tiny_timestamped'?'517244293732ee2d58139af5814231b7e6830a0d':'main');
const chunkSeconds=Number(arg('asr-chunk-seconds','28'));
if(![7,14,28].includes(chunkSeconds))throw Error('Supported benchmark ASR contexts: 7, 14 or 28 seconds');
if(chunkSeconds!==28)report.inference.experimentalContext={seconds:chunkSeconds,overlapSeconds:2,
 ownership:'word midpoint in nonoverlapping core; timestamps remain original ASR observations',
 deployedInPlayer:false};
const inferenceKey=crypto.createHash('sha256').update(JSON.stringify(report.inference)).digest('hex').slice(0,12);
fs.mkdirSync(path.dirname(output),{recursive:true});
const asr=await pipeline('automatic-speech-recognition',report.inference.model,{
 device:'cpu',revision:report.inference.revision,dtype:report.inference.dtype,session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
for(const record of records){
 const file=path.join(audio,record.name+'.mp3');
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(record.audioSha256&&record.audioSha256!==sha256)throw Error('Reference recording changed');
 const lines=record.lines.map((row,i)=>({...row,index:i,t:row.start}));
 const completeLines=start=>lines.filter(l=>l.start>=start+.15&&l.start<start+26.9&&l.end<start+27.96);
 const choices=lines.filter(l=>l.start>1).map(l=>{
  const start=Math.max(0,l.start-.5),selected=completeLines(start);
  const words=record.words.filter(w=>selected.some(l=>w.start>=l.start-.001&&w.end<=l.end+.001));
  return {start,selected,words,density:words.length/28};
 }).filter(c=>c.words.length>=12);
 const fast=record.genre==='Hip-Hop'||record.benchmarkRole==='singing-fast';
 choices.sort((a,b)=>fast?b.density-a.density:a.density-b.density);
 const selected=[{...choices[0],category:record.benchmarkRole||(fast?'rap-dense':'singing-sparse')}];
 // Repeated text at a distant position tests occurrence identity, not just
 // whether a chorus appears somewhere in the recording.
 const seen=new Map();
 for(const line of lines){
  const key=normalize(line.text),previous=seen.get(key);
  if(key.length>18&&previous&&line.start-previous.start>28){
   const start=line.start-.5;
   if(Math.abs(start-selected[0].start)>28){selected.push({start,selected:completeLines(start),category:'repeated-phrase'});break;}
  }
  seen.set(key,line);
 }
 for(const choice of selected){
  const id=record.name+'@'+choice.start.toFixed(3),cache=arg('asr-cache-prefix',output)+'.'+inferenceKey+'.'+id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.asr.json';
  let chunks;
  const cached=fs.existsSync(cache);let inferenceMs=null;
  if(cached){
   const prefix=arg('asr-cache-prefix','');
   if(prefix&&prefix!==output){const original=JSON.parse(fs.readFileSync(prefix));
    if(original.cases.find(c=>c.id===id)?.sourceAudioSha256!==sha256)throw Error('Cached ASR recording identity mismatch');}
   chunks=JSON.parse(fs.readFileSync(cache));
  }
  else{
   const decoded=spawnSync('ffmpeg',['-nostdin','-v','error','-i',file,'-ss',String(choice.start),'-t','28','-ac','1','-ar','16000','-f','f32le','pipe:1'],{maxBuffer:4e6});
   if(decoded.status!==0)throw Error('Reference decode failed');
   const bytes=decoded.stdout,pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
   const inferAt=performance.now();
   if(chunkSeconds===28)chunks=(await asr(pcm,{return_timestamps:'word',task:'transcribe',language:record.language||'en'})).chunks??[];
   else{
    chunks=[];
    // Keep the SAME reference window and denominator. These shorter ASR
    // contexts are an offline experiment, not a reference-informed prompt.
    for(let core=0;core<28;core+=chunkSeconds){
     const lo=Math.max(0,core-2),hi=Math.min(28,core+chunkSeconds+2);
     const observed=(await asr(pcm.slice(Math.round(lo*16000),Math.round(hi*16000)),
      {return_timestamps:'word',task:'transcribe',language:record.language||'en'})).chunks??[];
     for(const word of observed){
      const ts=word.timestamp;
      if(!Array.isArray(ts)||ts.length!==2||!ts.every(t=>typeof t==='number'&&Number.isFinite(t)))continue;
      const midpoint=(ts[0]+ts[1])/2+lo;
      if(midpoint>=core&&midpoint<Math.min(28,core+chunkSeconds))
       chunks.push({...word,timestamp:ts.map(t=>t+lo)});
     }
    }
   }
   inferenceMs=performance.now()-inferAt;
   fs.writeFileSync(cache,JSON.stringify(chunks));
  }
  const alignmentAt=performance.now();const aligned=context.MusicBoxAudioAlign.alignWindow(choice.selected,chunks,choice.start,28);
  const partial=context.MusicBoxAudioAlign.alignAcousticSpans?.(choice.selected.map(line=>aligned.find(r=>Math.abs(r.sourceT-line.start)<.002)||line),chunks,choice.start,28)||[];
  const partialErrors=[];
  for(const row of partial){
   const line=choice.selected.find(l=>Math.abs(l.start-row.sourceT)<.002);
   const reference=record.words.filter(w=>w.start>=line.start-.001&&w.end<=line.end+.001);
   const tokens=line.text.match(/\S+\s*/gu)||[];
   if(tokens.length!==reference.length||tokens.some((s,i)=>normalize(s)!==normalize(reference[i].text)))continue;
   for(const w of row.acousticSpans)partialErrors.push({wordIndex:w.wordIndex,lineIndex:line.index,
    startErrorMs:(w.t-reference[w.wordIndex].start)*1000,endErrorMs:(w.end-reference[w.wordIndex].end)*1000});
  }
  const errors=[],unmatched=[],estimated=[];let denominator=0;
  const alignmentMs=performance.now()-alignmentAt;
  const displayed=context.MusicBoxWordKaraoke.estimateRows(choice.selected.map(line=>
   aligned.find(r=>Math.abs(r.sourceT-line.start)<.002)||partial.find(r=>Math.abs(r.sourceT-line.start)<.002)||line));
  for(const line of choice.selected){
   const reference=record.words.filter(w=>w.start>=line.start-.001&&w.end<=line.end+.001);
   denominator+=reference.length;
   const result=aligned.find(r=>Math.abs(r.sourceT-line.start)<.002);
   if(!result){
    unmatched.push({lineIndex:line.index,words:reference.length});
    const fallback=displayed.find(r=>r.t===line.start&&r.estimated===true);
    if(fallback?.words?.length===reference.length&&fallback.words.every((w,i)=>normalize(w.text)===normalize(reference[i].text)))
     fallback.words.forEach((w,i)=>estimated.push({lineIndex:line.index,wordIndex:i,startErrorMs:(w.t-reference[i].start)*1000,endErrorMs:(w.end-reference[i].end)*1000}));
    continue;
   }
   if(result.words.length!==reference.length||result.words.some((w,i)=>normalize(w.text)!==normalize(reference[i].text))){
    unmatched.push({lineIndex:line.index,words:reference.length,reason:'tokenization mismatch'});continue;
   }
   result.words.forEach((word,i)=>errors.push({lineIndex:line.index,wordIndex:i,
    startErrorMs:(word.t-reference[i].start)*1000,endErrorMs:(word.end-reference[i].end)*1000,
    observedStart:word.t,observedEnd:word.end,referenceStart:reference[i].start,referenceEnd:reference[i].end}));
  }
  const item={id,record:record.name,genre:record.genre,category:choice.category,start:choice.start,seconds:28,
   sourceAudioSha256:sha256,referenceWords:denominator,observedWords:errors.length,
   observedCoverage:denominator?errors.length/denominator:0,estimatedWords:estimated.length,
   onset:stats(errors.map(x=>x.startErrorMs)),end:stats(errors.map(x=>x.endErrorMs)),errors,unmatched,
   estimatedOnset:stats(estimated.map(x=>x.startErrorMs)),estimatedEnd:stats(estimated.map(x=>x.endErrorMs)),estimatedErrors:estimated,
   partialWords:partialErrors.length,partialErrors,partialOnset:stats(partialErrors.map(x=>x.startErrorMs)),partialEnd:stats(partialErrors.map(x=>x.endErrorMs)),
   acceptedWords:errors.length+partialErrors.length,performance:{cachedAsr:cached,inferenceMs,alignmentMs,notPhysicalIPhone:true}};
  report.cases.push(item);fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({id,words:denominator,observed:errors.length,onset:item.onset,end:item.end}));
 }
}
const all=report.cases.flatMap(c=>c.errors),total=report.cases.reduce((s,c)=>s+c.referenceWords,0);
report.aggregate={referenceWords:total,observedWords:all.length,observedCoverage:all.length/total,
 onset:stats(all.map(x=>x.startErrorMs)),end:stats(all.map(x=>x.endErrorMs))};
const estimated=report.cases.flatMap(c=>c.estimatedErrors);
const partial=report.cases.flatMap(c=>c.partialErrors);
report.partial={words:partial.length,onset:stats(partial.map(w=>w.startErrorMs)),end:stats(partial.map(w=>w.endErrorMs)),
 combinedCoverage:(all.length+partial.length)/total};
report.fullPhraseBaseline={...report.aggregate};
const combined=[...all,...partial];
report.aggregate={...report.aggregate,observedWords:combined.length,completePhraseWords:all.length,partialWords:partial.length,
 observedCoverage:combined.length/total,onset:stats(combined.map(w=>w.startErrorMs)),end:stats(combined.map(w=>w.endErrorMs))};
report.aggregate.estimatedWords=estimated.length;report.aggregate.estimatedOnset=stats(estimated.map(x=>x.startErrorMs));
report.aggregate.estimatedEnd=stats(estimated.map(x=>x.endErrorMs));
report.aggregate.unalignedWords=total-combined.length-estimated.length;
report.categories={};
for(const category of ['rap-dense','singing-fast','singing-sparse','repeated-phrase']){
 const cases=report.cases.filter(c=>c.category===category),errors=cases.flatMap(c=>[...c.errors,...c.partialErrors]),denominator=cases.reduce((s,c)=>s+c.referenceWords,0);
 report.categories[category]={referenceWords:denominator,acceptedWords:errors.length,coverage:denominator?errors.length/denominator:null,
  onset:stats(errors.map(e=>e.startErrorMs)),end:stats(errors.map(e=>e.endErrorMs))};
}
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
