'use strict';
const fs=require('fs'),path=require('path'),req=require('module').createRequire(path.resolve('tools/probe.cjs'));
let s=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
s=s.replace("e.modelSha256!=='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'||e.analysisView!=='percussive'","e.modelSha256!=='365b553f43750717c907f32fbc42910f3b264d616654583df6e44472c93ead80'||e.analysisView!=='independent-seed1'");
const mode=process.argv.includes('--partial')?'partial':'full';
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges','--exact-silence=../personal-20261116/all-personal-exact-silence.json','--extra-edges=../ste-focus-20261116/seed1-edges','--output=../ste-focus-20261116/seed1-'+mode+'-plans.json','--metrical='+(mode==='partial'));
new Function('require','__dirname',s)(req,path.resolve('tools'));
const d=JSON.parse(fs.readFileSync('../ste-focus-20261116/seed1-'+mode+'-plans.json'));
console.log(JSON.stringify({mode,pairs:[...new Set(d.plans.map(p=>p.from+'|'+p.to))],windows:d.plans.length}));
