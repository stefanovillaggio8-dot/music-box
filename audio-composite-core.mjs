import {stretchClip,playedAt} from './audio-stretch-core.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// The final outgoing fade begins only inside the proven quiet vocal tail.
// Both recordings share ONE constant peak bound, including different drums.
export function compositePCM(outgoing,incoming,cue){
 const sr=outgoing.rate;
 if(sr!==incoming.rate||outgoing.channels.length!==2||incoming.channels.length!==2||
    !Number.isFinite(cue.fade)||cue.fade<4.5||cue.fade>16||
    outgoing.channels.some(c=>!(c instanceof Float32Array))||
    incoming.channels.some(c=>!(c instanceof Float32Array)))throw Error('Invalid stereo source');
 const stretched=stretchClip(incoming,cue);
 if(!stretched.timing.verified||!stretched.pitchPreserved)throw Error('Stretch timing failed');
 const preRoll=cue.renderPreRoll??.3,releaseSeconds=cue.renderReleaseSeconds??.9;
 if(![.3,.6,.9].includes(preRoll)||![.9,1.2,1.5].includes(releaseSeconds))throw Error('Unbounded common gain envelope');
 const tail=releaseSeconds+.9,seconds=preRoll+cue.fade+tail,frames=Math.round(seconds*sr),aOffset=Math.round((cue.begin-preRoll-outgoing.start)*sr),bOffset=Math.round((cue.entry-stretched.start)*sr);
 const preserveFile=cue.preservedFileTail===true;
 if(preserveFile&&(cue.nativeTailFullBeat!==true||cue.preserveTail!==true||cue.entry!==0||cue.vocalFadeSeconds!==0))throw Error('Unbound intact-file mode');
 const nativeHandoffAt=cue.structuralBeat&&!preserveFile?cue.fade:(outgoing.channels[0].length-aOffset)/sr-preRoll;
 if((!cue.structuralBeat||preserveFile)&&(nativeHandoffAt<cue.fade-.1||nativeHandoffAt>cue.fade+.2))throw Error('Native tail duration mismatch');
 if(aOffset<0||bOffset<0||outgoing.channels.some(c=>aOffset+Math.floor((preRoll+(preserveFile?nativeHandoffAt:cue.fade))*sr)>c.length+1)||
    stretched.channels.some(c=>bOffset+Math.round((seconds-preRoll)*sr)>c.length))throw Error('Incomplete transition source');
 const raw=[new Float32Array(frames),new Float32Array(frames)],components={outgoing:[new Float32Array(frames),new Float32Array(frames)],incoming:[new Float32Array(frames),new Float32Array(frames)]};let overlapRawPeak=0;
 for(let i=0;i<frames;i++){
  const t=i/sr-preRoll,u=clamp(t/cue.fade,0,1);
  let a=1,b=.33*Math.sin(Math.min(1,u*1.5)*Math.PI/2);
  if(cue.structuralBeat&&!preserveFile){
   if(cue.vocalFadeSeconds!==.4)throw Error('Unbound vocal fade envelope');
   const fadeStart=cue.fade-cue.vocalFadeSeconds;
   const late=clamp((t-fadeStart)/cue.vocalFadeSeconds,0,1);
   a=Math.cos(late*Math.PI/2);
   // Preserve the first actual drum transient. A 450ms fade from zero
   // erased that downbeat and failed the independent rendered-pulse test.
   b=.28*Math.sin(clamp(t/.008,0,1)*Math.PI/2)+.17*Math.sin(clamp(t/.45,0,1)*Math.PI/2)+.55*Math.sin(late*Math.PI/2);
  }else if(t>=nativeHandoffAt){a=0;b=.33+.67*clamp((t-nativeHandoffAt)/.55,0,1);}
  if(t>=nativeHandoffAt)a=0;
  for(let c=0;c<2;c++){
   const incomingIndex=bOffset+i-Math.round(preRoll*sr);
   const old=t<nativeHandoffAt?(outgoing.channels[c][aOffset+i]??0)*a:0,next=t>=0?stretched.channels[c][incomingIndex]*b:0;
   const value=old+next;components.outgoing[c][i]=old;components.incoming[c][i]=next;
   if(!Number.isFinite(value))throw Error('Invalid original PCM');raw[c][i]=value;
   if(t>=0&&t<=nativeHandoffAt)overlapRawPeak=Math.max(overlapRawPeak,Math.abs(value));
  }
 }
 const ceiling=Number.isFinite(cue.renderPeakCeiling)?cue.renderPeakCeiling:.96;
 if(ceiling<.85||ceiling>.96)throw Error('Invalid render peak target');
 let headroom=Math.min(1,ceiling/Math.max(.000001,overlapRawPeak));
 const smooth=t=>{const u=clamp(t,0,1);return u*u*(3-2*u)};
 const gainMode=cue.renderGainMode??'constant';
 if(!['constant','lookahead'].includes(gainMode))throw Error('Unknown common gain mode');
 let gainEnvelope=null,gainProof=null;
 if(gainMode==='lookahead'){
  // Offline, identical gain for both channels and components. Bound each
  // actual stereo sample, then reserve 25ms/dB attack and 125ms/dB release.
  // No hard limiter, gain boost, or relaxed peak ceiling is involved.
  const reduction=new Float64Array(frames),attack=40/sr,release=8/sr;
  for(let i=0;i<frames;i++){
   const t=i/sr-preRoll,bound=t>=0&&t<=nativeHandoffAt?ceiling:.999;
   reduction[i]=Math.max(0,20*Math.log10(Math.max(Math.abs(raw[0][i]),Math.abs(raw[1][i]),1e-9)/bound));
   if(i)reduction[i]=Math.max(reduction[i],reduction[i-1]-release);
  }
  for(let i=frames-2;i>=0;i--)reduction[i]=Math.max(reduction[i],reduction[i+1]-attack);
  const reveal=Math.round((preRoll+nativeHandoffAt+releaseSeconds+.15)*sr);
  if(reduction[0]>1e-6||reduction[reveal]>1e-6)throw Error('Lookahead gain cannot meet native boundaries');
  const maximum=reduction.reduce((a,b)=>Math.max(a,b),0);
  if(maximum>4.5)throw Error('Excessive shared gain reduction');
  gainEnvelope=Float64Array.from(reduction,x=>10**(-x/20));headroom=10**(-maximum/20);
  let sum=0,count=0;
  for(let i=0;i<frames;i++)if(i/sr>=preRoll&&i/sr<=preRoll+nativeHandoffAt){sum+=reduction[i];count++;}
  gainProof={method:'offline-stereo-shared-lookahead-v1',maximumReductionDb:maximum,meanOverlapReductionDb:sum/count,
   attackDbPerSecond:40,releaseDbPerSecond:8,firstGain:gainEnvelope[0],nativeRevealGain:gainEnvelope[reveal]};
 }
 let peak=0,overlapPeak=0;
 const audibleComponents={outgoing:components.outgoing.map(c=>c.slice()),incoming:components.incoming.map(c=>c.slice())};
 const channels=raw.map((c,channel)=>Float32Array.from(c,(x,i)=>{
  const t=i/sr-preRoll,g=gainEnvelope?gainEnvelope[i]:t<0?1-(1-headroom)*smooth((t+preRoll)/preRoll):
   t<=nativeHandoffAt?headroom:headroom+(1-headroom)*smooth((t-nativeHandoffAt)/releaseSeconds);
  const value=x*g;peak=Math.max(peak,Math.abs(value));
  audibleComponents.outgoing[channel][i]*=g;audibleComponents.incoming[channel][i]*=g;
  // Shared headroom does not alter relative phase. Component envelopes
  // remain separate only for the independent offline rendered-attack audit.
  if(t>=0&&t<=nativeHandoffAt)overlapPeak=Math.max(overlapPeak,Math.abs(value));return value;
 }));
 // Smooth entrance/release must itself remain safe. Reject hot source
 // masters rather than silently introducing a level step or hard limiter.
 if(peak>.999||overlapPeak>.961)throw Error('Smooth common gain exceeds safe peak');
 return {rate:sr,channels,components,audibleComponents,seconds,preRoll,releaseSeconds,envelopeVersion:gainProof?4:preRoll===.3&&releaseSeconds===.9?2:3,...(gainProof?{gainProof}:{}),warmupOriginalSeconds:stretched.warmupOriginalSeconds||0,nativeHandoffAt,nativeRevealAt:nativeHandoffAt+releaseSeconds+.15,peak,overlapPeak,headroom,pitchPreserved:true,
  ...(preserveFile?{sourceReadThrough:outgoing.start+outgoing.channels[0].length/sr,outgoingEnvelope:'unity-through-decoded-eof-v1'}:{}),
  timingVerified:true,timing:stretched.timing,
  handoffPosition:cue.entry+playedAt(cue.fade,cue.tempo,cue.fade,.85)};
}
