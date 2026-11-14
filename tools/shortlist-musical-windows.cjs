'use strict';
// Keep the bounded render budget, but do not spend all four slots on
// near-identical long windows just because they contain more attacks.
function shortlist(choices,limit=4){
 const rms=(a,b)=>a.fit.rms-b.fit.rms||a.fade-b.fade;
 const shortest=[...choices].sort((a,b)=>a.fade-b.fade||rms(a,b));
 const accurate=[...choices].sort(rms),native=accurate.filter(x=>x.tempo===1&&x.fit.rms<=.025);
 const supported=[...choices].sort((a,b)=>b.fit.beats-a.fit.beats||rms(a,b));
 const selected=[],add=c=>{if(c&&selected.length<limit&&!selected.some(x=>Math.abs(x.begin-c.begin)<.1&&Math.abs(x.tempo-c.tempo)<.0001))selected.push(c);};
 // Every input has ALREADY passed the same original-PCM, metrical,
 // content, vocal and harmonic gates; no candidate earns playback here.
 for(const c of [shortest[0],accurate[0],native[0],supported[0],...accurate])add(c);
 return selected;
}
module.exports={shortlist};
