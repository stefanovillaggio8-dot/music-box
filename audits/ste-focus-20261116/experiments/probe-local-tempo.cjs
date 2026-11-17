const fs=require('fs'),path=require('path'),Module=require('module'),req=Module.createRequire(path.resolve('tools/probe.cjs'));
let source=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
// Experimental calibration of nominal BPM from actually observed downbeats,
// rather than the final unobserved endpoint of the last model bar. Keep the
// per-deck 5%, all observed bars/pulses, voice and harmonic tests unchanged.
source=source.replace("const ratio=(y.end-y.start)/(x.end-x.start);",`const xx=x.downbeats.slice(0,-1),yy=y.downbeats.slice(0,-1);
const nearestTempo=(p,t)=>{const a=p.beats.filter(v=>Math.abs(v-t)<.075).sort((a,b)=>Math.abs(a-t)-Math.abs(b-t));return a[0]};
const ax=xx.map(t=>nearestTempo(pairOut,t)),by=yy.map(t=>nearestTempo(pairIn,t));
const observedNominal=ax.length>=2&&[...ax,...by].every(Number.isFinite)?(by.at(-1)-by[0])/(ax.at(-1)-ax[0]):NaN;
const ratio=Number.isFinite(observedNominal)?observedNominal:(y.end-y.start)/(x.end-x.start);`);
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges','--exact-silence=../personal-20261116/all-personal-exact-silence.json','--output=../ste-focus-20261116/local-tempo-plans.json');
new Function('require','__dirname',source)(req,path.resolve('tools'));
const d=JSON.parse(fs.readFileSync('../ste-focus-20261116/local-tempo-plans.json'));console.log([...new Set(d.plans.map(p=>p.from+'|'+p.to))]);
