'use strict';
const fs=require('fs'),path=require('path'),req=require('module').createRequire(path.resolve('tools/probe.cjs'));
let s=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
// Keep the entire incoming prefix. Only its first metrically supported
// phrase may start later; the eight real shared hits and per-bar checks,
// whole-overlap harmony and voice protection stay mandatory.
s=s.replace('if(partial&&(a.raw.duration-x.end>.65||y.start>1.5))continue;','if(partial&&a.raw.duration-x.end>.65)continue;');
process.argv.push('--metrical=true','--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges','--output=../ste-focus-20261116/delayed-metrical-plans.json');
new Function('require','__dirname',s)(req,path.resolve('tools'));
const d=JSON.parse(fs.readFileSync('../ste-focus-20261116/delayed-metrical-plans.json'));
console.log(JSON.stringify({pairs:[...new Set(d.plans.map(p=>p.from+'|'+p.to))],plans:d.plans.length}));
