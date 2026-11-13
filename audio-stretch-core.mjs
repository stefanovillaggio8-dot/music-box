/* SoundTouchJS 0.3.0 is distributed separately under LGPL-2.1; see vendor/soundtouchjs/LICENSE. */
import {SoundTouch,SimpleFilter} from './vendor/soundtouchjs/soundtouch.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function playedAt(t,tempo,hold,ramp){
 const a=Math.min(Math.max(0,t),hold),b=clamp(t-hold,0,ramp);
 return a*tempo+b*tempo+(1-tempo)*b*b/(2*ramp)+Math.max(0,t-hold-ramp);
}
function timingCheck(original,processed,rate,offset,tempo,hold,ramp,seconds){
 const hop=.01,frame=Math.max(16,Math.round(rate*.008)),x=[],y=[];
 const power=(samples,at)=>{
  let sum=0;const lo=Math.max(0,Math.round(at*rate)),hi=Math.min(samples.length,lo+frame);
  for(let i=lo;i<hi;i++)sum+=samples[i]*samples[i];
  return Math.sqrt(sum/Math.max(1,hi-lo));
 };
 for(let t=.10;t<seconds-.15;t+=hop){
  x.push(power(original,offset+playedAt(t,tempo,hold,ramp)));
  y.push(power(processed,offset+t));
 }
 const attack=v=>v.map((n,i)=>Math.max(0,n-(v[i-1]??n)));
 const xx=attack(x),yy=attack(y);
 const assess=(lo,hi)=>{
  let winner={score:-1,lag:Infinity};
  for(let lag=-8;lag<=8;lag++){
   let dot=0,a=0,b=0,count=0;
   for(let i=lo;i<hi;i++){
    const j=i+lag;if(j<lo||j>=hi)continue;
    dot+=xx[i]*yy[j];a+=xx[i]**2;b+=yy[j]**2;count++;
   }
   const score=a>1e-8&&b>1e-8&&count>50?dot/Math.sqrt(a*b):-1;
   if(score>winner.score+.005||Math.abs(score-winner.score)<=.005&&Math.abs(lag)<Math.abs(winner.lag))winner={score,lag};
  }
  return {score:winner.score,lagMs:winner.lag*10};
 };
 const whole=assess(0,xx.length),half=Math.floor(xx.length/2),a=assess(0,half),b=assess(half,xx.length);
 return {whole,first:a,second:b,verified:whole.score>=.45&&a.score>=.35&&b.score>=.35&&
  Math.abs(whole.lagMs)<=40&&Math.abs(a.lagMs)<=40&&Math.abs(b.lagMs)<=40};
}
export function stretchClip(clip,cue){
 const sr=Number(clip.rate),channels=clip.channels,tempo=Number(cue.tempo),fade=Number(cue.fade);
 if(!Array.isArray(channels)||channels.length<1||channels.length>2||
  !Number.isFinite(sr)||sr<8000||sr>96000||!Number.isFinite(tempo)||tempo<.95||tempo>1.05||
  !Number.isFinite(fade)||fade<4.5||fade>16||
  channels.some(c=>!(c instanceof Float32Array)||c.length!==channels[0].length||c.length>sr*40))throw Error('Invalid time-stretch clip');
 const offset=cue.entry-clip.start,prefix=Math.round(offset*sr),inputLength=channels[0].length-prefix;
 if(prefix<0||inputLength<sr*(fade*1.05+1))throw Error('Incomplete time-stretch source');
 if(tempo===1){
  // Exact identity is stronger evidence than running an unnecessary WSOLA
  // filter. In particular it preserves the first native drum transient.
  const timing={method:'identity-pcm-no-stretch',whole:{score:1,lagMs:0},first:{score:1,lagMs:0},second:{score:1,lagMs:0},verified:true};
  return {...clip,channels:channels.map(c=>c.slice()),pitchPreserved:true,rateSpeed:1,rateHold:fade,rateRamp:.85,timing,warmupOriginalSeconds:0};
 }
 // Warm the actual WSOLA input with preceding ORIGINAL audio when it is
 // available. Starting the filter cold at an internal downbeat smeared
 // its first transient; copying an unprocessed prefix did not warm it.
 const context=cue.warmupOriginal===true?Math.min(prefix,Math.round(.8*sr)):0,sourceStart=prefix-context;
 const skip=Math.round(context/tempo),processLength=inputLength+context;
 const hold=fade,ramp=.85,pipe=new SoundTouch();
 pipe.stretch.setParameters(sr,0,0,0);pipe.pitch=1;pipe.rate=1;
 const source={extract(target,count,position){
  const real=Math.max(0,Math.min(count,processLength+Math.ceil(sr*.6)-position));
  for(let i=0;i<real;i++){
   target[i*2]=channels[0][sourceStart+position+i]||0;
   target[i*2+1]=(channels[1]||channels[0])[sourceStart+position+i]||0;
  }
  return real;
 }};
 const filter=new SimpleFilter(source,pipe),block=1024,stereo=new Float32Array(block*2),parts=[];
 const maxFrames=Math.ceil((processLength/sr+1)*sr/.94);let frames=0;
 while(frames<maxFrames){
  const t=(frames-skip)/sr,progress=clamp((t-hold)/ramp,0,1);
  pipe.tempo=tempo+(1-tempo)*progress;
  const count=filter.extract(stereo,block);if(!count)break;
  parts.push(stereo.slice(0,count*2));frames+=count;
 }
 const output=channels.map(c=>{const out=new Float32Array(prefix+frames-skip);out.set(c.subarray(0,prefix));return out});
 let at=prefix,consumed=0;
 for(const part of parts){for(let i=0;i<part.length/2;i++){
  if(consumed++<skip)continue;
  output[0][at]=part[i*2];if(output[1])output[1][at]=part[i*2+1];at++;
 }}
 const timing=timingCheck(channels[0],output[0],sr,offset,tempo,hold,ramp,fade);
 return {...clip,channels:output,pitchPreserved:true,rateSpeed:tempo,rateHold:hold,rateRamp:ramp,timing,warmupOriginalSeconds:context/sr};
}
