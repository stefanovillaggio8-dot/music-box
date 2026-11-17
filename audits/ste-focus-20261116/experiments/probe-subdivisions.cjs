'use strict';
const fs=require('fs'),path=require('path'),req=require('module').createRequire(path.resolve('tools/probe.cjs'));
let s=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
s=s.replace('for(const predicted of e.beats){',`const hypotheses=e.beats.flatMap((t,i)=>{
 const delta=e.beats[i+1]-t;
 return delta>=.40&&delta<=1.09?[t,t+delta/2]:[t];
 });
 for(const predicted of hypotheses){`);
const mode=process.argv.includes('--partial')?'partial':'full';
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges','--exact-silence=../personal-20261116/all-personal-exact-silence.json','--metrical='+(mode==='partial'),'--output=../ste-focus-20261116/subdivision-'+mode+'-plans.json');
new Function('require','__dirname',s)(req,path.resolve('tools'));
const d=JSON.parse(fs.readFileSync('../ste-focus-20261116/subdivision-'+mode+'-plans.json'));
console.log(JSON.stringify({mode,pairs:[...new Set(d.plans.map(p=>p.from+'|'+p.to))],windows:d.plans.length}));
