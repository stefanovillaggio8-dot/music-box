/* Music Box · dedicated on-device Whisper worker.
   The only network download is the ASR model; MP3 PCM is supplied directly
   from the local browser and never sent to an external transcription API. */
"use strict";
const LANGUAGES=new Set(["it","en","es","fr","pt","de"]);
let model=null;
async function getModel(){
 if(!model){
  model=(async()=>{
   const lib=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1");
   return lib.pipeline("automatic-speech-recognition",
     "onnx-community/whisper-tiny_timestamped",
     {device:"webgpu",dtype:{encoder_model:"fp32",decoder_model_merged:"q4"}});
  })();
 }
 return model;
}
self.onmessage=async e=>{
 const id=Number(e.data?.id),pcm=e.data?.pcm;
 const language=String(e.data?.language||"").toLowerCase();
 if(!Number.isSafeInteger(id))return;
 if(!(pcm instanceof Float32Array)||pcm.length<16000||
    pcm.length>16000*30||!LANGUAGES.has(language)){
  self.postMessage({id,error:"Invalid audio segment"});return;
 }
 try{
  const asr=await getModel();
  const result=await asr(pcm,{return_timestamps:"word",task:"transcribe",language});
  self.postMessage({id,chunks:Array.isArray(result?.chunks)?result.chunks:[]});
 }catch(error){
  // Do not suppress future retries forever if the model/CDN is temporarily
  // unavailable. The main thread applies a 24-hour per-song backoff.
  model=null;
  self.postMessage({id,error:String(error?.message||error).slice(0,180)});
 }
};
