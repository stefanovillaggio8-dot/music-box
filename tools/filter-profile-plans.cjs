'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'app.js'),'utf8');
const start=code.indexOf('const BUILTIN = ['),end=code.indexOf('];',start);
const songs=vm.runInNewContext(code.slice(start,end+2)+';BUILTIN'),owners=new Map();
const state=JSON.parse(fs.readFileSync(path.join(root,'stato.json'))),profiles=['Ste','Diego','Emanuele'];
for(const s of songs){
 const id='b-'+s.file.replace(/^.*\//,'').replace(/\.mp3$/i,'');
 if(!owners.has(s.file))owners.set(s.file,new Set());
 for(const profile of profiles){
  const belongs=(s.profile||'Ste')===profile||(state.miei?.[profile]||[]).includes(id);
  const deleted=(state.eliminati||[]).includes(profile+'.'+id)||(profile==='Ste'&&(state.eliminati||[]).includes(id));
  if(belongs&&!deleted)owners.get(s.file).add(profile);
 }
}
const owner=k=>owners.get(k.split('/').slice(1).join('/').replace('/bassi/','/'))||new Set();
const shared=p=>[...owner(p.from)].filter(o=>owner(p.to).has(o));
const report=JSON.parse(fs.readFileSync(arg('plans','plans.json'))),all=report.plans;
report.plans=all.filter(p=>shared(p).length);
report.renderScope='same-published-profile-BUILTIN-plus-explicit-copies-minus-deletions; includes playlist-only; ownership unchanged';report.catalogCandidateWindows=all.length;
report.profileCandidateWindows=report.plans.length;report.profileWindowCounts={};
for(const p of report.plans)for(const o of shared(p))report.profileWindowCounts[o]=(report.profileWindowCounts[o]||0)+1;
report.profileCountsOverlapForAlreadySharedTracks=true;
fs.writeFileSync(arg('output','profile-plans.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({catalogWindows:all.length,profileWindows:report.plans.length,profiles:report.profileWindowCounts}));
