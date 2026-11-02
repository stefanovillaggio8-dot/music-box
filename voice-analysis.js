/* Music Box - dedicated on-device voice/singing guard for DJ transitions.
   YAMNet is an AudioSet EVENT classifier, not a source separator, voice
   transcription, or a guaranteed singing detector. Positive observations
   veto unsafe cuts. Negative observations NEVER certify an instrumental tail.
   No audio recordings or transcript are uploaded by this module. */
(function(){
"use strict";
const PACKAGE="0.10.22";
const CDN="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@"+PACKAGE;
const MODEL="https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite";
let modelPromise=null,modelCooldown=0;
function vocalCategory(name){
 const n=String(name||"").toLowerCase().trim();
 return /^(speech|singing|rapping|rap|vocal music|choir|humming|whispering|chant|chanting|yodeling|screaming|shout|shouting|spoken word|narration|conversation)$/.test(n);
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
function monoWindow(buffer,at,seconds=.96){
 const rate=buffer.sampleRate,length=Math.floor(seconds*rate);
 const first=Math.floor(at*rate);
 if(first<0||first+length>buffer.length)return null;
 const left=buffer.getChannelData(0);
 const right=buffer.numberOfChannels>1?buffer.getChannelData(1):null;
 const samples=new Float32Array(length);
 for(let i=0;i<length;i++)samples[i]=right?(left[first+i]+right[first+i])*.5:left[first+i];
 return samples;
}
function evaluate(buffer,classifier,info){
 const duration=Number(buffer?.duration)||0;
 if(!Number.isFinite(duration)||duration<24||
    !classifier||typeof classifier.classify!=="function")return null;
 const end=Math.min(duration,Number.isFinite(info?.last)?info.last:duration);
 const segments=[],step=1.4,clip=.96;
 const classifyRange=(from,to,kind)=>{
  for(let t=Math.max(0,from);t+clip<=Math.min(duration,to)+.00001;t+=step){
   const samples=monoWindow(buffer,t,clip);
   if(!samples)break;
   let score=0;
   try{score=vocalConfidence(classifier.classify(samples,buffer.sampleRate))}
   catch(e){return false}
   // Singing may score lower than isolated speech over full accompaniment.
   // False positives only make mixing *more conservative*.
   if(score>=.20)
    segments.push({at:Math.round(t*100)/100,end:Math.round((t+clip)*100)/100,
     score:Math.round(score*1000)/1000,kind});
  }
  return true;
 };
 const outroFrom=Math.max(0,end-22);
 const lastStart=Math.max(0,end-clip);
 if(!classifyRange(0,Math.min(duration,10),"intro") ||
    !classifyRange(outroFrom,lastStart+clip,"outro"))return null;
 const outro=segments.filter(s=>s.kind==="outro");
 const intro=segments.filter(s=>s.kind==="intro");
 const lastVoiceAt=outro.length?Math.max(...outro.map(s=>s.end)):null;
 const firstVoiceAt=intro.length?Math.min(...intro.map(s=>s.at)):null;
 return {source:"yamnet",lastVoiceAt,firstVoiceAt,
  scannedEnd:end,scannedFrom:outroFrom,modelVersion:1};
}
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
async function analyze(buffer,info){
 // Never start an expensive model download while the screen is locked,
 // in data saver, or when the DJ feature is disabled.
 if(typeof document!=="undefined"&&document.hidden)return null;
 const net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 if(net?.saveData||/^(slow-)?2g$|^3g$/i.test(String(net?.effectiveType||"")))return null;
 const model=await loadModel();
 if(!model)return null;
 try{return evaluate(buffer,model,info)}catch(e){return null}
}
window.MusicBoxVocal={analyze,modelReady:()=>Boolean(modelPromise),
 // Pure evaluator exposed so project regression tests can use a mock model.
 evaluate};
})();