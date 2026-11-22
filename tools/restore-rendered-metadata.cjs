#!/usr/bin/env node
'use strict';
// Explicit recovery of lost, already-published evidence, never certification
// of a new pair. Current basic measurements, membership and revocations win.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
for(const k of ['baseline','current','scopes','output','report'])if(!arg(k))throw Error('Required --'+k);
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const baseline=read(arg('baseline')),current=read(arg('current'));
if(baseline.version!==2||current.version!==2||baseline.introExposureRevision!==2||current.introExposureRevision!==2)throw Error('Compatible exposure protocol required');
const profiles=(arg('profiles')||'Ste').split(',');
if(!profiles.length||profiles.some(x=>!['Ste','Diego','Emanuele'].includes(x)))throw Error('Personal profiles only');
const owners=new Map(),targets=new Map();
for(const name of profiles){
 const scope=read(path.join(arg('scopes'),name+'.json'));
 if(scope.name!==name||!scope.auditExclusions?.some(p=>p.profile==='Ste'&&String(p.playlist).toLowerCase()==='gym')&&name==='Ste')throw Error('Explicit Ste exclusion required');
 for(const t of scope.tracks){
  if(current.entries[t.key]?.status!=='ok'||current.entries[t.key]?.sha!==t.sha)throw Error('Scope source changed '+t.key);
  if(!owners.has(t.key))owners.set(t.key,new Set());owners.get(t.key).add(name);
  if(!targets.has(t.sha))targets.set(t.sha,new Set());targets.get(t.sha).add(name);
 }
}
const context={Number,Array,Map,Set,Uint8Array,Float32Array};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'audio-composite-mix.js'),'utf8'),context);
const checked=new Map(),report={baselineSha256:crypto.createHash('sha256').update(fs.readFileSync(arg('baseline'))).digest('hex'),
 profiles,restored:[],rejected:[],currentFieldsOverwritten:0,downloadBytesModified:0};
function valid(cue,source,target){
 const c=cue?.composite,e=c?.introductionExposure;
 if(cue?.sourceSha!==source||cue?.targetSha!==target||!context.MusicBoxCompositeMix.supports(cue)||
  e?.method!=='rendered-introduction-band-masking-screen-v2'||e.accepted!==true||
  e.sourceSha!==source||e.targetSha!==target||e.assetSha256!==c.sha256)return false;
 if(!checked.has(c.sha256)){
  const file=path.join(root,c.path);
  checked.set(c.sha256,fs.existsSync(file)&&crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===c.sha256);
 }
 return checked.get(c.sha256);
}
for(const [key,profilesHere] of owners){
 const dest=current.entries[key],old=baseline.entries[key];
 if(!old||old.status!=='ok'||old.sha!==dest.sha||Math.abs(old.duration-dest.duration)>1.5)continue;
 if(!dest.musicalContent&&old.musicalContent?.sourceSha===dest.sha&&old.musicalContent.wholeCoverageVerified===true){
  dest.musicalContent=old.musicalContent;report.restored.push({key,field:'musicalContent'});
 }
 for(const field of ['structuralBeatPlans','pcmBeatPlans'])for(const [sha,record] of Object.entries(old[field]||{})){
  if(Object.hasOwn(dest[field]||{},sha))continue;
  if(record.fromSha!==dest.sha||record.toSha!==sha||![...profilesHere].some(p=>targets.get(sha)?.has(p)))continue;
  const cues=(record.cues||[record.cue]).filter(c=>valid(c,dest.sha,sha));
  if(!cues.length){report.rejected.push({key,toSha:sha,field,reason:'no-current-render-and-exposure-proof'});continue;}
  const recovered={...record,cue:cues[0]};if(record.cues)recovered.cues=cues;
  dest[field]??={};dest[field][sha]=recovered;
  report.restored.push({key,toSha:sha,field,assets:cues.map(c=>c.composite.sha256)});
 }
 if(dest.pcmIntroSeconds==null&&Object.keys(dest.pcmBeatPlans||{}).length&&Number.isFinite(old.pcmIntroSeconds)&&old.pcmIntroSeconds>0&&old.pcmIntroSeconds<=24)
  dest.pcmIntroSeconds=old.pcmIntroSeconds;
}
for(const [file,value] of [[arg('output'),current],[arg('report'),report]]){
 fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,file===arg('report')?2:0)+'\n');
}
console.log(JSON.stringify({profiles,restoredFields:report.restored.length,restoredPlanRecords:report.restored.filter(x=>x.toSha).length,rejectedRecords:report.rejected.length}));
