// Offline measurement of the ACTUAL audible components, after common gain.
// This is a conservative masking screen, not a psychoacoustic listening score.
export function introductionExposure(outgoing, audibleIncoming, originalIncoming, rate, cue, preRoll) {
 const frames=outgoing[0]?.length;
 if(![16000,44100,48000].includes(rate)||!Number.isFinite(preRoll)||preRoll<0||
    ![cue.entry,cue.tempo,cue.fade].every(Number.isFinite)||cue.entry<0||cue.tempo<=0||
    [outgoing,audibleIncoming,originalIncoming].some(c=>c.length!==2||c.some(x=>!(x instanceof Float32Array))))
  throw Error('Invalid introduction exposure source');
 const seconds=Math.min(5/cue.tempo,cue.fade),step=.25,rows=[];
 let run=0,longest=0,meaningful=0,masked=0,unknown=0;
 const rms=(channels,lo,hi)=>{
  if(lo<0||hi>channels[0].length||hi<=lo)throw Error('Incomplete introduction exposure source');
  let sum=0;for(const channel of channels)for(let i=lo;i<hi;i++){
   if(!Number.isFinite(channel[i]))throw Error('Non-finite introduction PCM');
   sum+=channel[i]*channel[i];
  }
  return Math.sqrt(sum/(2*(hi-lo)));
 };
 const db=(x,y)=>20*Math.log10(Math.max(x,1e-12)/Math.max(y,1e-12));
 // Broadband RMS alone wrongly calls a quiet high-hat inaudible under a
 // loud bass note. Screen only bands containing >=10% of the original
 // incoming frame's power, and require masking in EVERY such band.
 // Matched fourth-order Linkwitz-Riley edges; all processing stays offline.
 const bands=[[40,250],[250,2500],[2500,Math.min(12000,rate*.45)]];
 const filtered=(channels,low,high,limit)=>channels.map(input=>{
  let signal=input.slice(0,limit);
  for(const [frequency,highpass] of [[low,true],[low,true],[high,false],[high,false]]){
   const w=2*Math.PI*frequency/rate,c=Math.cos(w),alpha=Math.sin(w)/Math.SQRT2,a0=1+alpha;
   const b0=(highpass?1+c:1-c)/2/a0,b1=(highpass?-(1+c):1-c)/a0,b2=b0,
    a1=-2*c/a0,a2=(1-alpha)/a0;
   const output=new Float32Array(signal.length);let x1=0,x2=0,y1=0,y2=0;
   for(let i=0;i<signal.length;i++){
    const x=signal[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;
    output[i]=y;x2=x1;x1=x;y2=y1;y1=y;
   }
   signal=output;
  }
  return signal;
 });
 const end=Math.ceil((preRoll+seconds+.01)*rate),originalEnd=Math.ceil((Math.min(.8,cue.entry)+seconds*cue.tempo+.01)*rate);
 const bank=bands.map(([low,high])=>({low,high,old:filtered(outgoing,low,high,end),
  incoming:filtered(audibleIncoming,low,high,end),native:filtered(originalIncoming,low,high,originalEnd)}));
 for(let t=0;t+step<=seconds+1e-9;t+=step){
  const lo=Math.round((preRoll+t)*rate),hi=Math.round((preRoll+t+step)*rate);
  if(hi>frames)throw Error('Incomplete audible introduction');
  // The provided original clip starts at entry minus the renderer's warmup.
  const start=Math.min(.8,cue.entry)+t*cue.tempo;
  const native=rms(originalIncoming,Math.round(start*rate),Math.round((start+step*cue.tempo)*rate));
  const old=rms(outgoing,lo,hi),incoming=rms(audibleIncoming,lo,hi);
  const bandRows=bank.map(b=>{
   const original=rms(b.native,Math.round(start*rate),Math.round((start+step*cue.tempo)*rate));
   return {lowHz:b.low,highHz:b.high,originalRms:original,
    meaningful:native>=.001&&original>=.0005&&original*original>=native*native*.10,
    relativeDb:db(rms(b.incoming,lo,hi),rms(b.old,lo,hi))};
  });
  const audibleBands=bandRows.filter(b=>b.meaningful),active=audibleBands.length>0;
  const obscured=active&&audibleBands.every(b=>b.relativeDb<-18);
  if(active)meaningful+=step;else if(native>=.001)unknown+=step;
  if(obscured){masked+=step;run+=step;longest=Math.max(longest,run)}else run=0;
  rows.push({at:+t.toFixed(3),originalAt:+(cue.entry+t*cue.tempo).toFixed(3),
   originalRms:native,outgoingRms:old,incomingRms:incoming,
   relativeDb:db(incoming,old),attenuationDb:db(incoming,native),bands:bandRows,obscured});
 }
 const accepted=longest<.75&&meaningful>0&&unknown<.75;
 return {method:'rendered-introduction-band-masking-screen-v2',accepted,
  reason:longest>=.75?'sustained-masked-introduction':!accepted?'insufficient-introduction-band-evidence':'no-sustained-mask-detected',
  caveat:'Passing this screen does not establish perceptual audibility; human listening remains necessary.',
  protocol:{originalSeconds:5,windowSeconds:step,minimumOriginalRms:.001,
   bandsHz:bands,minimumOriginalBandRms:.0005,minimumOriginalBandPowerFraction:.10,
   maximumRelativeDb:-18,rejectedContinuousSeconds:.75},
  measuredSeconds:rows.length*step,meaningfulSeconds:meaningful,maskedSeconds:masked,
  longestMaskedSeconds:longest,unknownBandSeconds:unknown,rows};
}
