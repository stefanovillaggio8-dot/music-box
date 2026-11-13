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
 limitation:'English external references; exact human line anchors isolate acoustic word timing. No claim of Italian or full-catalog word accuracy.',cases:[]};
fs.mkdirSync(path.dirname(output),{recursive:true});
const asr=await pipeline('automatic-speech-recognition',report.inference.model,{
 device:'cpu',dtype:report.inference.dtype,session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
for(const record of records){
 const file=path.join(audio,record.name+'.mp3');
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const lines=record.lines.map((row,i)=>({...row,index:i,t:row.start}));
 const completeLines=start=>lines.filter(l=>l.start>=start+.15&&l.start<start+26.9&&l.end<start+27.96);
 const choices=lines.filter(l=>l.start>1).map(l=>{
  const start=Math.max(0,l.start-.5),selected=completeLines(start);
  const words=record.words.filter(w=>selected.some(l=>w.start>=l.start-.001&&w.end<=l.end+.001));
  return {start,selected,words,density:words.length/28};
 }).filter(c=>c.words.length>=12);
 const fast=record.genre==='Hip-Hop';
 choices.sort((a,b)=>fast?b.density-a.density:a.density-b.density);
 const selected=[{...choices[0],category:fast?'rap-dense':'singing-sparse'}];
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
  const id=record.name+'@'+choice.start.toFixed(3),cache=output+'.'+id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.asr.json';
  let chunks;
  if(fs.existsSync(cache))chunks=JSON.parse(fs.readFileSync(cache));
  else{
   const decoded=spawnSync('ffmpeg',['-nostdin','-v','error','-i',file,'-ss',String(choice.start),'-t','28','-ac','1','-ar','16000','-f','f32le','pipe:1'],{maxBuffer:4e6});
   if(decoded.status!==0)throw Error('Reference decode failed');
   const bytes=decoded.stdout,pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
   chunks=(await asr(pcm,{return_timestamps:'word',task:'transcribe',language:'en'})).chunks??[];
   fs.writeFileSync(cache,JSON.stringify(chunks));
  }
  const aligned=context.MusicBoxAudioAlign.alignWindow(choice.selected,chunks,choice.start,28);
  const errors=[],unmatched=[],estimated=[];let denominator=0;
  for(const line of choice.selected){
   const reference=record.words.filter(w=>w.start>=line.start-.001&&w.end<=line.end+.001);
   denominator+=reference.length;
   const result=aligned.find(r=>Math.abs(r.sourceT-line.start)<.002);
   if(!result){unmatched.push({lineIndex:line.index,words:reference.length});continue;}
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
   onset:stats(errors.map(x=>x.startErrorMs)),end:stats(errors.map(x=>x.endErrorMs)),errors,unmatched};
  report.cases.push(item);fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({id,words:denominator,observed:errors.length,onset:item.onset,end:item.end}));
 }
}
const all=report.cases.flatMap(c=>c.errors),total=report.cases.reduce((s,c)=>s+c.referenceWords,0);
report.aggregate={referenceWords:total,observedWords:all.length,observedCoverage:all.length/total,
 onset:stats(all.map(x=>x.startErrorMs)),end:stats(all.map(x=>x.endErrorMs))};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
