'use strict';
// Keep the bounded render budget, but do not spend all four slots on
// near-identical long windows just because they contain more attacks.
function shortlist(choices,limit=4){
 const rms=(a,b)=>a.fit.rms-b.fit.rms||a.fade-b.fade;
 const shortest=[...choices].sort((a,b)=>a.fade-b.fade||rms(a,b));
 const accurate=[...choices].sort(rms),native=accurate.filter(x=>x.tempo===1&&x.fit.rms<=.025);
 const supported=[...choices].sort((a,b)=>b.fit.beats-a.fit.beats||rms(a,b));
 const complete=accurate.filter(c=>c.complete===true);
 const selected=[],add=c=>{if(c&&selected.length<limit&&!selected.some(x=>Math.abs(x.begin-c.begin)<.1&&Math.abs(x.tempo-c.tempo)<.0001))selected.push(c);};
 // Every input has ALREADY passed the same original-PCM, metrical,
 // content, vocal and harmonic gates; no candidate earns playback here.
 // Keep one already verified complete candidate when partial windows
 // happen to occupy every short/native/low-error slot. Rendering still
 // has to independently accept it; no class is promoted here.
 for(const c of [complete[0],shortest[0],accurate[0],native[0],supported[0],...accurate])add(c);
 return selected;
}
module.exports={shortlist};
