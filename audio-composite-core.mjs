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
 const preRoll=.3,tail=1.8,seconds=preRoll+cue.fade+tail,frames=Math.round(seconds*sr),aOffset=Math.round((cue.begin-preRoll-outgoing.start)*sr),bOffset=Math.round((cue.entry-stretched.start)*sr);
 const nativeHandoffAt=cue.structuralBeat?cue.fade:(outgoing.channels[0].length-aOffset)/sr-preRoll;
 if(!cue.structuralBeat&&(nativeHandoffAt<cue.fade-.001||nativeHandoffAt>cue.fade+.2))throw Error('Native tail duration mismatch');
 if(aOffset<0||bOffset<0||outgoing.channels.some(c=>aOffset+Math.floor((preRoll+cue.fade)*sr)>c.length+1)||
    stretched.channels.some(c=>bOffset+Math.round((seconds-preRoll)*sr)>c.length))throw Error('Incomplete transition source');
 const raw=[new Float32Array(frames),new Float32Array(frames)],components={outgoing:[new Float32Array(frames),new Float32Array(frames)],incoming:[new Float32Array(frames),new Float32Array(frames)]};let overlapRawPeak=0;
 for(let i=0;i<frames;i++){
  const t=i/sr-preRoll,u=clamp(t/cue.fade,0,1);
  let a=1,b=.33*Math.sin(Math.min(1,u*1.5)*Math.PI/2);
  if(cue.structuralBeat){
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
 const headroom=Math.min(1,ceiling/Math.max(.000001,overlapRawPeak)),smooth=t=>{const u=clamp(t,0,1);return u*u*(3-2*u)};
 let peak=0,overlapPeak=0;
 const channels=raw.map(c=>Float32Array.from(c,(x,i)=>{
  const t=i/sr-preRoll,g=t<0?1-(1-headroom)*smooth((t+preRoll)/preRoll):
   t<=nativeHandoffAt?headroom:headroom+(1-headroom)*smooth((t-nativeHandoffAt)/.9);
  const value=x*g;peak=Math.max(peak,Math.abs(value));
  // Shared headroom does not alter relative phase. Component envelopes
  // remain separate only for the independent offline rendered-attack audit.
  if(t>=0&&t<=nativeHandoffAt)overlapPeak=Math.max(overlapPeak,Math.abs(value));return value;
 }));
 // Smooth entrance/release must itself remain safe. Reject hot source
 // masters rather than silently introducing a level step or hard limiter.
 if(peak>.999||overlapPeak>.961)throw Error('Smooth common gain exceeds safe peak');
 return {rate:sr,channels,components,seconds,preRoll,envelopeVersion:2,warmupOriginalSeconds:stretched.warmupOriginalSeconds||0,nativeHandoffAt,nativeRevealAt:nativeHandoffAt+1.05,peak,overlapPeak,headroom,pitchPreserved:true,
  timingVerified:true,timing:stretched.timing,
  handoffPosition:cue.entry+playedAt(cue.fade,cue.tempo,cue.fade,.85)};
}
