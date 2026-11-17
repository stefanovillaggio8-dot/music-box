#!/usr/bin/env node
// Offline operator tool. Never imported by the player or Service Worker.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import createFixture from './karaoke-application-fixture.cjs';
const arg=(key,fallback)=>process.argv.find(s=>s.startsWith('--'+key+'='))?.slice(key.length+3)??fallback;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const manifest=read(arg('manifest','manifest.json')),work=path.resolve(arg('work','karaoke-asr-work'));
const output=path.resolve(arg('output',path.join(work,'timed-rows.json')));
const proofFile=arg('proof-index',''),index=proofFile?read(proofFile):null;
const runtime=arg('runtime','@huggingface/transformers');
const {pipeline,env}=await import(path.isAbsolute(runtime)?pathToFileURL(runtime).href:runtime);
env.cacheDir=path.resolve(arg('cache','.cache/karaoke'));
env.backends.onnx.wasm.numThreads=2;
const inference={model:'onnx-community/whisper-tiny_timestamped',revision:'517244293732ee2d58139af5814231b7e6830a0d',
 dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}};
const corroborator=arg('ctc-corroborator','none');
if(!['none','base'].includes(corroborator))throw Error('Unknown offline CTC corroborator');
const auxiliary={model:'onnx-community/whisper-base_timestamped',revision:'608c49e61301901684bc36cac8f74b95ff6b5a8e',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}};
let auxiliaryModel=null;
if(corroborator==='base')inference.supplementalCtcCorroborator={...auxiliary,method:'ctc-only-after-original-v1'};
const model=await pipeline('automatic-speech-recognition',inference.model,{
 device:'cpu',revision:inference.revision,dtype:inference.dtype,session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
const context={crypto:crypto.webcrypto,TextEncoder,TextDecoder};context.window=context;vm.createContext(context);
for(const file of ['word-karaoke.js','audio-lyrics-align.js','karaoke-acoustic-proof.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const fixture=createFixture(context,root),align=context.MusicBoxAudioAlign,acoustic=context.MusicBoxAcousticProof;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const results=[];fs.mkdirSync(work,{recursive:true});fs.mkdirSync(path.dirname(output),{recursive:true});
const asLrc=rows=>rows.map(r=>'['+Math.floor(r.t/60)+':'+(r.t%60).toFixed(3).padStart(6,'0')+'] '+r.text).join('\n');
for(const record of manifest.records){
 if(record.language!=='en'||!Array.isArray(record.windows)||record.windows.length>30||record.rows.length>800)
  throw Error('Unsupported language or unbounded request');
 const source=path.resolve(record.file),audioSha256=sha(fs.readFileSync(source));
 if(record.audioSha256&&record.audioSha256!==audioSha256)throw Error('Recording changed');
 const state=fixture({synced:asLrc(record.rows)}),history=align.createObservationHistory(),all=[];
 const descriptor=index?.entries?.[audioSha256];let proof=null;
 if(descriptor){
  if(!/^karaoke-acoustic\/[a-f0-9]{64}\.json$/.test(descriptor.path))throw Error('Invalid proof path');
  const bytes=fs.readFileSync(path.join(path.dirname(path.resolve(proofFile)),descriptor.path));
  if(sha(bytes)!==descriptor.sha256)throw Error('CTC proof changed');
  proof=await acoustic.prepare(JSON.parse(bytes),state.rows(),audioSha256);
  // A bounded rerun must retain previously exported observations outside
  // its new windows too. The phone never needs to repeat this inference.
  await state.save('song',acoustic.recognizedRows(state.rows(),proof));
 }
 const certified=()=>state.rows().filter(r=>!r.estimated&&(context.MusicBoxWordKaraoke.hasWordTiming(r)||context.MusicBoxWordKaraoke.hasPartialTiming(r))).flatMap(r=>(r.words||r.acousticSpans||[]).map((w,i)=>({key:(r.sourceT??r.t)+'|'+r.text+'|'+(w.wordIndex??i),t:w.t,end:w.end})));
 const previous=certified();
 for(const start of record.windows){
  if(!Number.isFinite(start)||start<0||start>=3600)throw Error('Invalid source window');
  const identity={audioSha256,start,seconds:28,inference:{model:inference.model,revision:inference.revision,dtype:inference.dtype},method:'original-stereo-app-pcm-slice-contexts-28-14-7-v1'};
  const cache=path.join(work,sha(JSON.stringify(identity))+'.asr.json');let passes;
  if(fs.existsSync(cache)){
   const cached=read(cache);if(JSON.stringify(cached.identity)!==JSON.stringify(identity))throw Error('ASR cache identity mismatch');passes=cached.passes;
  }else{
   const decoded=spawnSync('ffmpeg',['-nostdin','-v','error','-i',source,'-ss',String(start),'-t','28','-ar','16000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024,timeout:60000});
   if(decoded.status)throw Error('Original PCM decode failed');
   const stereo=new Float32Array(decoded.stdout.buffer,decoded.stdout.byteOffset,decoded.stdout.length/4);
   const left=new Float32Array(stereo.length/2),right=new Float32Array(stereo.length/2);
   for(let i=0;i<left.length;i++){left[i]=stereo[2*i];right[i]=stereo[2*i+1];}
   // Identical anti-phase protection to the phone input path.
   const mono=Float32Array.from(align.pcmSlice({sampleRate:16000,length:left.length,numberOfChannels:2,getChannelData:i=>i?right:left},0,left.length/16000));
   passes=[];
   for(const size of [28,14,7])for(let core=0;core<28;core+=size){
    const lo=Math.max(0,core-2),hi=Math.min(28,core+size+2,mono.length/16000);
    if(hi-lo<4)continue;
    const result=await model(mono.slice(Math.round(lo*16000),Math.round(hi*16000)),{language:'en',task:'transcribe',return_timestamps:'word'});
    const spec={kind:size===28?'primary':size===14?'context14':'context7',at:start+lo,seconds:hi-lo,parentAt:start,coreStart:start+core,coreEnd:start+core+size};
    passes.push({spec,chunks:align.ownedContextWords(result.chunks||[],spec)});
   }
   fs.writeFileSync(cache,JSON.stringify({identity,passes}));
  }
  for(const {spec,chunks} of passes){
   const rows=state.rows(),sourceAt=r=>r.sourceT??r.t;
   const aligned=align.alignWindow(rows,chunks,spec.at,spec.seconds);
   const partial=align.alignAcousticSpans(rows.map(row=>aligned.find(r=>Math.abs(sourceAt(r)-sourceAt(row))<.002)||row),chunks,spec.at,spec.seconds);
   const pending=[...aligned,...partial],current=rows.map(row=>pending.find(r=>Math.abs(sourceAt(r)-sourceAt(row))<.002)||row);
   const consensus=align.alignConsensusSpans(current,history.observe(audioSha256,spec,chunks));
   await state.save('song',[...aligned,...partial.filter(row=>!consensus.some(r=>Math.abs(sourceAt(r)-sourceAt(row))<.002)),...consensus]);
   all.push(align.recognizedWords(chunks,spec.at));
  }
  console.log(JSON.stringify({id:record.id,window:start}));
 }
 if(proof){
  await state.save('song',acoustic.proposals(state.rows(),proof,all));
  if(corroborator==='base'){
   // Supplemental ASR only corroborates existing observed CTC boundaries;
   // its own timestamps can never replace an accepted word or make a row.
   for(const start of record.windows){
    const identity={audioSha256,start,seconds:28,inference:auxiliary,method:'original-pcm-ctc-corroboration-v1'};
    const file=path.join(work,sha(JSON.stringify(identity))+'.asr.json');let chunks;
    if(fs.existsSync(file)){
     const cached=read(file);if(JSON.stringify(cached.identity)!==JSON.stringify(identity))throw Error('Auxiliary ASR cache identity mismatch');chunks=cached.chunks;
    }else{
     auxiliaryModel??=await pipeline('automatic-speech-recognition',auxiliary.model,{device:'cpu',revision:auxiliary.revision,dtype:auxiliary.dtype,session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
     const decoded=spawnSync('ffmpeg',['-nostdin','-v','error','-i',source,'-ss',String(start),'-t','28','-ar','16000','-ac','1','-f','f32le','pipe:1'],{maxBuffer:4e6,timeout:60000});
     if(decoded.status)throw Error('Auxiliary original PCM decode failed');
     const bytes=decoded.stdout,mono=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
     chunks=(await auxiliaryModel(mono,{language:'en',task:'transcribe',return_timestamps:'word'})).chunks||[];
     fs.writeFileSync(file,JSON.stringify({identity,chunks}));
    }
    const observed=align.recognizedWords(chunks,start);
    await state.save('song',acoustic.proposals(state.rows(),proof,[...all,observed],{start,end:start+28}));
   }
  }
 }
 const final=new Map(certified().map(w=>[w.key,w]));
 if(previous.some(w=>!final.has(w.key)||final.get(w.key).t!==w.t||final.get(w.key).end!==w.end))throw Error('Previously accepted word interval changed; refusing export');
 const engine=context.MusicBoxWordKaraoke;
 results.push({id:record.id,audioSha256,rows:state.rows().filter(r=>!r.estimated&&(engine.hasWordTiming(r)||engine.hasPartialTiming(r)))});
 fs.writeFileSync(output,JSON.stringify({inference,records:results},null,2)+'\n');
}
