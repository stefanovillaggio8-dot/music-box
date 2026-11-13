/* Optional, bounded pitch-preserving preparation of an indexed mobile intro. */
(function(root){
'use strict';
const clips=new WeakMap();let worker=null,sequence=0;const jobs=new Map();
const key=p=>[p.entry,p.tempo,p.fade].map(n=>Number(n).toFixed(5)).join('|');
function cancel(reason='cancelled'){
 const aborted=reason==='cancelled';
 for(const job of jobs.values()){
  clearTimeout(job.timer);
  // Seeking and switching songs intentionally invalidates a pending clip.
  // It must be possible to prepare that same clip again immediately.
  if(aborted&&job.entries.get(job.key)?.pending)job.entries.delete(job.key);
  const error=Error(aborted?'Stretch cancelled':'Stretch worker failed');
  if(aborted)error.name='AbortError';
  job.reject(error);
 }
 jobs.clear();try{worker?.terminate()}catch(_){}worker=null;
}
function get(clip,cue){return clips.get(clip)?.get(key(cue))?.ready||null;}
function prepare(clip,cue){
 let entries=clips.get(clip);if(!entries){entries=new Map();clips.set(clip,entries)}
 const k=key(cue),old=entries.get(k);
 if(old?.ready)return Promise.resolve(old.ready);
 if(old?.pending)return old.pending;
 if(old?.failedAt&&Date.now()-old.failedAt<25000)return Promise.resolve(null);
 if(!root.Worker)return Promise.resolve(null);
 if(!worker){
  try{worker=new Worker('audio-stretch-worker.js?v=2',{type:'module'})}
  catch(_){entries.set(k,{failedAt:Date.now()});return Promise.resolve(null)}
  worker.onmessage=({data})=>{
   const job=jobs.get(data.id);if(!job)return;
   jobs.delete(data.id);clearTimeout(job.timer);
   if(data.error)job.reject(Error(data.error));else job.resolve(data.clip);
  };
  worker.onerror=()=>cancel('worker-error');
 }
 const id=++sequence,channels=clip.channels.map(c=>c.slice());
 const pending=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>cancel('worker-error'),12000);
  jobs.set(id,{resolve,reject,timer,entries,key:k});
  try{worker.postMessage({id,clip:{...clip,channels},cue:{entry:cue.entry,tempo:cue.tempo,fade:cue.fade}},channels.map(c=>c.buffer))}
  catch(error){jobs.delete(id);clearTimeout(timer);reject(error)}
 }).then(result=>{
  if(!result?.pitchPreserved||result.timing?.verified!==true)throw Error('Stretch timing not verified');
  entries.set(k,{ready:result});while(entries.size>2)entries.delete(entries.keys().next().value);
  return result;
 }).catch(error=>{
  if(error?.name==='AbortError'){
   if(entries.get(k)?.pending===pending)entries.delete(k);
   return null;
  }
  entries.set(k,{failedAt:Date.now()});return null;
 });
 entries.set(k,{pending});return pending;
}
root.MusicBoxStretch={prepare,get,cancel};
})(typeof window!=='undefined'?window:globalThis);
