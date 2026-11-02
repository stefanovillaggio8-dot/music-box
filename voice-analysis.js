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
// The 521 AudioSet labels include more than just "Singing" and "Speech".
// This is a positive-event detector; a low score is not proof of instrumentals.
function vocalCategory(name){
 const n=String(name||"").toLowerCase().trim();
 return /^(speech|singing|male singing|female singing|child singing|synthetic singing|rapping|rap|vocal music|choir|humming|whispering|chant|chanting|mantra|yodeling|screaming|shout|shouting|yell|spoken word|narration(?:, monologue)?|conversation|child speech, kid speaking|male speech, man speaking|female speech, woman speaking|speech synthesizer|babbling|whisper|groan|singing bowl)$/.test(n);
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
// Music videos are usually 44.1/48kHz stereo. Compress the *working* vocal
// windows to 16kHz with a box-filter anti-alias pass. The original decoded
// buffer is not changed and can be freed while the model downloads.
function monoSegment(buffer,from,seconds){
 const inputRate=buffer.sampleRate,rate=Math.min(16000,inputRate);
 const at=Math.max(0,Math.floor(from*inputRate));
 const length=Math.min(buffer.length-at,Math.floor(seconds*inputRate));
 if(length<inputRate*.99)return null;
 const left=buffer.getChannelData(0);
 const right=buffer.numberOfChannels>1?buffer.getChannelData(1):null;
 const n=Math.floor(length*rate/inputRate),samples=new Float32Array(n);
 const inputStep=inputRate/rate;
 const group=Math.max(1,Math.floor(rate*.4));
 for(let first=0;first<n;first+=group){
  const last=Math.min(n,first+group);
  let lp=0,rp=0,mp=0;
  if(right){
   const stride=Math.max(1,Math.floor((last-first)/90));
   for(let i=first;i<last;i+=stride){
    const p=Math.min(buffer.length-1,at+Math.floor(i*inputStep));
    const l=left[p],r=right[p];
    lp+=l*l;rp+=r*r;mp+=(l+r)*(l+r)*.25;
   }
  }
  // Prefer the loudest real channel only when the two channels almost
  // cancel. Never discard phase-opposed sung vocals by averaging L and R.
  const channel=right&&mp<Math.max(lp,rp)*.20?(lp>=rp?0:1):-1;
  for(let i=first;i<last;i++){
   const begin=at+Math.floor(i*inputStep);
   const end=Math.min(buffer.length,at+Math.max(Math.floor((i+1)*inputStep),Math.floor(i*inputStep)+1));
   let sum=0;
   for(let p=begin;p<end;p++)
    sum+=channel===0?left[p]:channel===1?right[p]:
     right?(left[p]+right[p])*.5:left[p];
   samples[i]=sum/Math.max(1,end-begin);
  }
 }
 return {at:at/inputRate,samples,rate};
}
function prepare(buffer,info){
 const duration=Number(buffer?.duration)||0,rate=Number(buffer?.sampleRate);
 if(!Number.isFinite(duration)||duration<24||!Number.isFinite(rate)||rate<1000)return null;
 const end=Math.min(duration,Number.isFinite(info?.last)?info.last:duration);
 // Sample more of the outro than before, so vocals around late breakdowns
 // don't go unnoticed. At 16kHz these ~44s occupy under 3MB in mono PCM.
 const head=monoSegment(buffer,0,11.5);
 const tail=monoSegment(buffer,Math.max(0,end-32),32);
 if(!head||!tail)return null;
 return {head,tail,rate:head.rate,end};
}
// YAMNet's TFLite input represents 15,600 samples at 16kHz (975ms).
// Previous 960ms chunks could be shorter than one valid inference frame.
const WINDOW_SECONDS=1.02,STEP_SECONDS=.67;
function* framesFor(data){
 const n=Math.floor(data.rate*WINDOW_SECONDS),step=Math.max(1,Math.round(data.rate*STEP_SECONDS));
 for(const [kind,segment] of [["intro",data.head],["outro",data.tail]]){
  const buf=segment.samples;let last=-1;
  for(let offset=0;offset+n<=buf.length;offset+=step){
   last=offset;
   yield {at:segment.at+offset/data.rate,kind,samples:buf.subarray(offset,offset+n)};
  }
  const final=Math.max(0,buf.length-n);
  if(final>last&&buf.length>=n)
   yield {at:segment.at+final/data.rate,kind,samples:buf.subarray(final,final+n)};
 }
}
// A strong single-frame voice event counts. Lower-confidence singing/rap
// requires adjacent supporting windows to avoid reacting to one drum hit.
function summarizeFrames(data,frames){
 const signals=[];
 for(let i=0;i<frames.length;i++){
  const frame=frames[i],score=frame.score;
  if(score>=.42){
   signals.push({...frame,confidence:score});
   continue;
  }
  if(score<.155)continue;
  const before=frames[i-1],after=frames[i+1];
  const near=v=>v&&v.kind===frame.kind&&Math.abs(v.at-frame.at)<1.5&&v.score>=.12;
  if(near(before)||near(after))
   signals.push({...frame,confidence:score});
 }
 function intervals(kind){
  const events=signals.filter(x=>x.kind===kind).sort((a,b)=>a.at-b.at);
  const spans=[];
  for(const event of events){
   const right=Math.min(data.end,event.at+WINDOW_SECONDS);
   const last=spans[spans.length-1];
   if(last&&event.at-last.end<=.82){
    last.end=Math.max(last.end,right);
    last.confidence=Math.max(last.confidence,event.confidence);
   }else spans.push({at:event.at,end:right,confidence:event.confidence});
  }
  return spans;
 }
 const head=intervals("intro"),tail=intervals("outro");
 return {source:"yamnet",modelVersion:3,
  firstVoiceAt:head.length?head[0].at:null,
  lastVoiceAt:tail.length?tail[tail.length-1].end:null,
  firstVoiceConfidence:head.length?head[0].confidence:null,
  lastVoiceConfidence:tail.length?tail[tail.length-1].confidence:null,
  voiceIntervals:tail.slice(-12),
  scannedEnd:data.end,scannedFrom:data.tail.at,
  // Coverage indicates *where* the model ran, never verified vocal absence.
  scannedFrames:frames.length};
}
function evaluatePrepared(data,classifier){
 if(!data||!classifier||typeof classifier.classify!=="function")return null;
 const frames=[];
 for(const frame of framesFor(data)){
  let score;
  try{score=vocalConfidence(classifier.classify(frame.samples,data.rate))}
  catch(e){return null}
  frames.push({at:frame.at,kind:frame.kind,score});
 }
 return summarizeFrames(data,frames);
}
// Limit synchronous MediaPipe inference to two calls per event-loop turn.
async function evaluatePreparedAsync(data,classifier){
 if(!data||!classifier||typeof classifier.classify!=="function")return null;
 const frames=[];let n=0;
 for(const frame of framesFor(data)){
  if(typeof document!=="undefined"&&document.hidden)return null;
  let score;
  try{score=vocalConfidence(classifier.classify(frame.samples,data.rate))}
  catch(e){return null}
  frames.push({at:frame.at,kind:frame.kind,score});
  if(++n%2===0)await new Promise(resolve=>setTimeout(resolve,0));
 }
 return summarizeFrames(data,frames);
}
function evaluate(buffer,classifier,info){
 return evaluatePrepared(prepare(buffer,info),classifier);
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