// Offline measurement of the ACTUAL audible components, after common gain.
// This is a conservative masking screen, not a psychoacoustic listening score.
export function introductionExposure(outgoing, audibleIncoming, originalIncoming, rate, cue, preRoll) {
 const frames=outgoing[0]?.length;
 if(![44100,48000].includes(rate)||!Number.isFinite(preRoll)||preRoll<0||
    ![cue.entry,cue.tempo,cue.fade].every(Number.isFinite)||cue.entry<0||cue.tempo<=0||
    [outgoing,audibleIncoming,originalIncoming].some(c=>c.length!==2||c.some(x=>!(x instanceof Float32Array))))
  throw Error('Invalid introduction exposure source');
 const seconds=Math.min(5/cue.tempo,cue.fade),step=.25,rows=[];
 let run=0,longest=0,meaningful=0,masked=0;
 const rms=(channels,lo,hi)=>{
  if(lo<0||hi>channels[0].length||hi<=lo)throw Error('Incomplete introduction exposure source');
  let sum=0;for(const channel of channels)for(let i=lo;i<hi;i++){
   if(!Number.isFinite(channel[i]))throw Error('Non-finite introduction PCM');
   sum+=channel[i]*channel[i];
  }
  return Math.sqrt(sum/(2*(hi-lo)));
 };
 const db=(x,y)=>20*Math.log10(Math.max(x,1e-12)/Math.max(y,1e-12));
 for(let t=0;t+step<=seconds+1e-9;t+=step){
  const lo=Math.round((preRoll+t)*rate),hi=Math.round((preRoll+t+step)*rate);
  if(hi>frames)throw Error('Incomplete audible introduction');
  // The provided original clip starts at entry minus the renderer's warmup.
  const start=Math.min(.8,cue.entry)+t*cue.tempo;
  const native=rms(originalIncoming,Math.round(start*rate),Math.round((start+step*cue.tempo)*rate));
  const old=rms(outgoing,lo,hi),incoming=rms(audibleIncoming,lo,hi);
  const active=native>=.001;
  const obscured=active&&db(incoming,old)<-18;
  if(active)meaningful+=step;
  if(obscured){masked+=step;run+=step;longest=Math.max(longest,run)}else run=0;
  rows.push({at:+t.toFixed(3),originalAt:+(cue.entry+t*cue.tempo).toFixed(3),
   originalRms:native,outgoingRms:old,incomingRms:incoming,
   relativeDb:db(incoming,old),attenuationDb:db(incoming,native),obscured});
 }
 return {method:'rendered-introduction-masking-screen-v1',accepted:longest<.75,
  reason:longest>=.75?'sustained-masked-introduction':'no-sustained-mask-detected',
  caveat:'Passing this screen does not establish perceptual audibility; human listening remains necessary.',
  protocol:{originalSeconds:5,windowSeconds:step,minimumOriginalRms:.001,
   maximumRelativeDb:-18,rejectedContinuousSeconds:.75},
  measuredSeconds:rows.length*step,meaningfulSeconds:meaningful,maskedSeconds:masked,
  longestMaskedSeconds:longest,rows};
}
