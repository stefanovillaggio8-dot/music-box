'use strict';
// Separate the period with outgoing attacks from its preserved decay. This
// is a PARTIAL transition. Every attack in the rhythmic window still faces
// the existing full PCM fit; an independent raw-audio tail audit is mandatory.
function rhythmicTail(part,begin,fade,modelEnd){
 if(!part||part.step!==.02||!Array.isArray(part.onset)||
    ![begin,fade,modelEnd,part.start,part.end].every(Number.isFinite)||
    begin<part.start||begin+fade>part.end+.001)return null;
 let last=null;
 for(let i=1;i<part.onset.length-1;i++){
  const t=part.start+i*part.step,v=part.onset[i];
  if(t<begin||t>begin+fade)continue;
  if(!Number.isFinite(v)||v<0)return null;
  if(v>=.25&&v>=part.onset[i-1]&&v>=part.onset[i+1])last=t;
 }
 if(last===null)return null;
 const seconds=Math.max(modelEnd-begin,last-begin+.15),tailSeconds=fade-seconds;
 if(seconds<4.5||tailSeconds<.65||tailSeconds>8)return null;
 const samples=part.onset.filter((_,i)=>{
  const t=part.start+i*part.step;return t>=begin+seconds&&t<=begin+fade;
 });
 if(samples.length<20||samples.some(v=>!Number.isFinite(v)||v<0||v>=.25))return null;
 return {method:'original-pcm-rhythm-ending-v1',seconds,tailSeconds,
  lastOriginalOnset:last-begin,maximumTailOnset:Math.max(...samples),
  onsetThreshold:.25,tailPreserved:true,humanVerified:false};
}
module.exports={rhythmicTail};
