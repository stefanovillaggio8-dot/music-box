'use strict';
// RESEARCH ONLY. Does not install a cue or relax either deck's 5% bound.
// First asks whether symmetric tempo adjustment can find NEW pairs, before
// implementing a second SoundTouch stream and native source-clock mapping.
const fs=require('fs'),path=require('path'),Module=require('module');
const root=process.cwd(),work=path.resolve('../ste-focus-20261116');
const realRequire=Module.createRequire(path.resolve('tools/prototype.cjs'));
const load=(text,file,req=realRequire)=>{const m={exports:{}};new Function('require','module','exports','__dirname',text)(req,m,m.exports,path.dirname(file));return m.exports;};
const low=.95/1.05,high=1.05/.95;
const placement=load(fs.readFileSync('tools/pcm-affine-placements.cjs','utf8').replaceAll('r>=.95&&r<=1.05',`r>=${low}&&r<=${high}`).replace('nominal<.95||nominal>1.05',`nominal<${low}||nominal>${high}`),path.resolve('tools/pcm-affine-placements.cjs'));
let text=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
text=text.replace('ratio<.95||ratio>1.05',`ratio<${low}||ratio>${high}`);
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges','--exact-silence=../personal-20261116/all-personal-exact-silence.json','--output='+work+'/dual-tempo-candidates.json');
new Function('require','__dirname',text)(name=>name==='./pcm-affine-placements.cjs'?placement:realRequire(name),path.resolve('tools'));
const d=JSON.parse(fs.readFileSync(work+'/dual-tempo-candidates.json'));
const fresh=d.plans.filter(p=>p.cue.tempo<.95||p.cue.tempo>1.05).map(p=>{
 const nominal=p.cue.tempo,sourceRate=1/Math.sqrt(nominal),targetRate=Math.sqrt(nominal);
 return {...p,notPlaybackCertified:true,sourceRate,targetRate,eachDeckWithinFivePercent:sourceRate>=.95&&sourceRate<=1.05&&targetRate>=.95&&targetRate<=1.05};
});
fs.writeFileSync(work+'/dual-tempo-new.json',JSON.stringify({notPlaybackCertified:true,plans:fresh},null,2));
console.log(JSON.stringify({newWindows:fresh.length,pairs:[...new Set(fresh.map(p=>p.from+'|'+p.to))]}));
