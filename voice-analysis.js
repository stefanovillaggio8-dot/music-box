/* Music Box - dedicated on-device voice/singing guard for DJ transitions.
   YAMNet is an AudioSet EVENT classifier, not a source separator, voice
   transcription, or a guaranteed singing detector. Positive observations
   veto unsafe cuts. Negative observations NEVER certify an instrumental tail.
   No audio recordings or transcript are uploaded by this module. */
(function(){
"use strict";
const PACKAGE="0.10.35";
const CDN="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@"+PACKAGE;
const MODEL="https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite";
let modelPromise=null,modelCooldown=0;
function vocalCategory(name){
 const n=String(name||"").toLowerCase().trim();
 // AudioSet/YAMNet class map uses labels such as "Child speech, kid
 // speaking" and "Narration, monologue", not only the short class names.
 // Catch the actual 521-class vocabulary, including vocalizations in rap.
 return /^(speech|singing|male singing|female singing|child singing|synthetic singing|rapping|rap|vocal music|choir|humming|whispering|chant|chanting|mantra|yodeling|screaming|shout|shouting|yell|spoken word|narration(?:, monologue)?|conversation|child speech, kid speaking|male speech, man speaking|female speech, woman speaking|speech synthesizer|babbling)$/.test(n);
}
function vocalConfidence(output){
 let score=0;
 for(const frame of Array.isArray(output)?output:[output]){
  for(const head of (frame?.classifications||[])){
   for(const category of (head.categories||[])){
    if(vocalCategory(category.categoryName||category.displayName))
     score=Math.max(score,Number(category.score)||0);
   }
  }
 }
 return score;
}
function monoSegment(buffer,from,seconds){
 const rate=buffer.sampleRate;
 const at=Math.max(0,Math.floor(from*rate));
 const n=Math.min(buffer.length-at,Math.floor(seconds*rate));
 if(n<rate*.9)return null;
 const left=buffer.getChannelData(0);
 const right=buffer.numberOfChannels>1?buffer.getChannelData(1):null;
 const samples=new Float32Array(n);
 for(let i=0;i<n;i++)
  samples[i]=right?(left[at+i]+right[at+i])*.5:left[at+i];
 return {at:at/rate,samples};
}
function prepare(buffer,info){
 const duration=Number(buffer?.duration)||0,rate=buffer?.sampleRate;
 if(!Number.isFinite(duration)||duration<24||!Number.isFinite(rate))return null;
 const end=Math.min(duration,Number.isFinite(info?.last)?info.last:duration);
 // Copy under ~33 seconds of samples. The complete decoded MP3 can now
 // be freed while the model is downloading, especially important on iOS.
 const head=monoSegment(buffer,0,10.5);
 const tail=monoSegment(buffer,Math.max(0,end-23),23);
 if(!head||!tail)return null;
 return {head,tail,rate,end};
}
function evaluatePrepared(data,classifier){
 if(!data||!classifier||typeof classifier.classify!=="function")return null;
 const found=[],step=1.3,seconds=.96;
 const classify=(segment,kind)=>{
  const n=Math.floor(data.rate*seconds),buf=segment.samples;
  for(let offset=0;offset+n<=buf.length;offset+=Math.round(step*data.rate)){
   const t=segment.at+offset/data.rate;
   const slice=buf.subarray(offset,offset+n);
   let score=0;
   try{score=vocalConfidence(classifier.classify(slice,data.rate))}
   catch(e){return false}
   if(score>=.22)found.push({at:t,end:t+seconds,score,kind});
  }
  // Cover the very last available second, even when not on the stride.
  if(buf.length>=n&&buf.length>n){
   const t=segment.at+(buf.length-n)/data.rate;
   let score=0;
   try{score=vocalConfidence(classifier.classify(buf.subarray(buf.length-n),data.rate))}
   catch(e){return false}
   if(score>=.22)found.push({at:t,end:t+seconds,score,kind});
  }
  return true;
 };
 if(!classify(data.head,"intro")||!classify(data.tail,"outro"))return null;
 const outro=found.filter(v=>v.kind==="outro"&&v.at<=data.end);
 const intro=found.filter(v=>v.kind==="intro");
 // Last vocal detected within the ending guard window. Never interpret
 // missing detections as confirmation that vocals are absent.
 const lastVoiceAt=outro.length?
  Math.min(data.end,Math.max(...outro.map(v=>v.end))):null;
 const firstVoiceAt=intro.length?Math.min(...intro.map(v=>v.at)):null;
 return {source:"yamnet",lastVoiceAt,firstVoiceAt,
  scannedEnd:data.end,scannedFrom:data.tail.at,modelVersion:1};
}
function evaluate(buffer,classifier,info){
 return evaluatePrepared(prepare(buffer,info),classifier);
}
// The MediaPipe classifier is synchronous. Running 20-30 inferences in
// one uninterrupted task can freeze the browser's DJ timers. Schedule a
// maximum of two inferences per turn and let the audio player breathe.
function* framesFor(data){
 const n=Math.floor(data.rate*.96),step=Math.max(1,Math.round(data.rate*1.3));
 for(const [kind,segment] of [["intro",data.head],["outro",data.tail]]){
  const buf=segment.samples;
  let last=-1;
  for(let offset=0;offset+n<=buf.length;offset+=step){
   last=offset;
   yield {at:segment.at+offset/data.rate,kind,samples:buf.subarray(offset,offset+n)};
  }
  const end=Math.max(0,buf.length-n);
  if(end>last&&buf.length>=n)
   yield {at:segment.at+end/data.rate,kind,samples:buf.subarray(end,end+n)};
 }
}
function summarizeFrames(data,found){
 const outro=found.filter(x=>x.kind==="outro"&&x.at<=data.end);
 const intro=found.filter(x=>x.kind==="intro");
 return {source:"yamnet",
  lastVoiceAt:outro.length?Math.min(data.end,Math.max(...outro.map(v=>v.end))):null,
  firstVoiceAt:intro.length?Math.min(...intro.map(v=>v.at)):null,
  scannedEnd:data.end,scannedFrom:data.tail.at,modelVersion:2};
}
async function evaluatePreparedAsync(data,classifier){
 if(!data||!classifier||typeof classifier.classify!=="function")return null;
 const found=[];let n=0;
 for(const frame of framesFor(data)){
  if(typeof document!=="undefined"&&document.hidden)return null;
  let score;
  try{score=vocalConfidence(classifier.classify(frame.samples,data.rate))}
  catch(e){return null}
  if(score>=.22)found.push({at:frame.at,end:frame.at+.96,score,kind:frame.kind});
  if(++n%2===0)await new Promise(resolve=>setTimeout(resolve,0));
 }
 return summarizeFrames(data,found);
}
let classificationQueue=Promise.resolve();
async function loadModel(){
 if(Date.now()<modelCooldown||typeof window==="undefined"||
    !window.WebAssembly)return null;
 if(modelPromise)return modelPromise;
 modelPromise=(async()=>{
  try{
   const task=await import(CDN+"/+esm");
   const files=await task.FilesetResolver.forAudioTasks(CDN+"/wasm");
   return await task.AudioClassifier.createFromOptions(files,{
    baseOptions:{modelAssetPath:MODEL},maxResults:-1,scoreThreshold:0
   });
  }catch(e){
   modelCooldown=Date.now()+20*60000;return null;
  }
 })();
 const result=await modelPromise;
 if(!result)modelPromise=null;
 return result;
}
function analyze(buffer,info){
 if(typeof document!=="undefined"&&document.hidden)return Promise.resolve(null);
 const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 if(net?.saveData||/^(slow-)?2g$|^3g$/i.test(String(net?.effectiveType||"")))
  return Promise.resolve(null);
 const data=prepare(buffer,info);
 if(!data)return Promise.resolve(null);
 // No full-song PCM kept across model download and no user audio uploaded.
 return loadModel().then(model=>{
  if(!model||document.hidden)return null;
  const next=classificationQueue.catch(()=>{}).then(()=>
   evaluatePreparedAsync(data,model));
  classificationQueue=next.catch(()=>{});
  return next;
 }).catch(()=>null);
}
window.MusicBoxVocal={analyze,modelReady:()=>Boolean(modelPromise),
 // Pure evaluators exposed for deterministic regressions.
 evaluate,evaluateAsync:(buffer,classifier,info)=>
  evaluatePreparedAsync(prepare(buffer,info),classifier)};
})();