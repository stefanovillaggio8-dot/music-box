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
 const tail=1.8,seconds=cue.fade+tail,frames=Math.round(seconds*sr),aOffset=Math.round((cue.begin-outgoing.start)*sr),bOffset=Math.round((cue.entry-stretched.start)*sr);
 if(aOffset<0||bOffset<0||outgoing.channels.some(c=>aOffset+Math.floor(cue.fade*sr)>c.length+1)||
    stretched.channels.some(c=>bOffset+frames>c.length))throw Error('Incomplete transition source');
 const raw=[new Float32Array(frames),new Float32Array(frames)];let peak=0;
 for(let i=0;i<frames;i++){
  const t=i/sr,u=clamp(t/cue.fade,0,1);
  let a=1,b=.33*Math.sin(Math.min(1,u*1.5)*Math.PI/2);
  if(cue.structuralBeat){
   if(cue.vocalFadeSeconds!==.4)throw Error('Unbound vocal fade envelope');
   const fadeStart=cue.fade-cue.vocalFadeSeconds;
   const late=clamp((t-fadeStart)/cue.vocalFadeSeconds,0,1);
   a=Math.cos(late*Math.PI/2);b=.45*Math.sin(Math.min(1,t/.45)*Math.PI/2)+.55*Math.sin(late*Math.PI/2);
  }else if(t>=cue.fade){a=0;b=.33+.67*clamp((t-cue.fade)/.55,0,1);}
  if(t>=cue.fade)a=0;
  for(let c=0;c<2;c++){
   const value=(t<cue.fade?(outgoing.channels[c][aOffset+i]??0)*a:0)+stretched.channels[c][bOffset+i]*b;
   if(!Number.isFinite(value))throw Error('Invalid original PCM');raw[c][i]=value;peak=Math.max(peak,Math.abs(value));
  }
 }
 const headroom=Math.min(1,.96/Math.max(.000001,peak));
 const channels=raw.map(c=>Float32Array.from(c,x=>x*headroom));
 return {rate:sr,channels,seconds,peak:peak*headroom,headroom,pitchPreserved:true,
  timingVerified:true,timing:stretched.timing,
  handoffPosition:cue.entry+playedAt(cue.fade,cue.tempo,cue.fade,.85)};
}
