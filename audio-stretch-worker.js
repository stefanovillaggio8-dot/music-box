import {stretchClip} from './audio-stretch-core.mjs?v=3';
self.onmessage=({data})=>{
 try{
  const clip=stretchClip(data.clip,data.cue);
  self.postMessage({id:data.id,clip},clip.channels.map(c=>c.buffer));
 }catch(error){self.postMessage({id:data.id,error:String(error?.message||error).slice(0,160)})}
};
