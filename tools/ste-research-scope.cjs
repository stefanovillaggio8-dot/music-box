"use strict";
// Read-only current membership oracle for bounded Ste research. Not a player API.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function currentSteScope(){
 const files=['app.js','stato.json','playlist.json','online-imports.json','dj-deep-analysis.json'];
 const before=Object.fromEntries(files.map(f=>[f,hash(path.join(root,f))]));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-ste-scope-'));
 try{
  cp.execFileSync(process.execPath,['tools/simulate-library-listening.cjs','--only-profile=Ste','--personal-only=true','--exclude-playlists=Ste:gym','--inventory-only=true','--scope-dir='+dir,'--output='+path.join(dir,'report.json')],{cwd:root,timeout:30000,stdio:'pipe'});
  const scope=JSON.parse(fs.readFileSync(path.join(dir,'Ste.json'),'utf8'));
  if(scope.name!=='Ste'||!scope.auditExclusions?.some(x=>x.profile==='Ste'&&String(x.playlist).toLowerCase()==='gym'))throw Error('Current Ste personal scope and excluded playlist required');
  if(scope.membershipEvidence?.stateSha256!==before['stato.json']||scope.membershipEvidence?.playlistsSha256!==before['playlist.json']||scope.membershipEvidence?.importsSha256!==before['online-imports.json']||scope.runtimeEvidence?.applicationSha256!==before['app.js']||scope.runtimeEvidence?.indexSha256!==before['dj-deep-analysis.json'])throw Error('Scope provenance does not match the actual application snapshot');
  if(files.some(f=>hash(path.join(root,f))!==before[f]))throw Error('Application membership changed while exporting scope');
  return scope;
 }finally{
  if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('musicbox-ste-scope-'))throw Error('Unsafe temporary research directory');
  fs.rmSync(dir,{recursive:true,force:true});
 }
}
function validateSteCases(cases,scope,index){
 if(scope?.name!=='Ste')throw Error('Only current Ste personal scope is allowed');
 if(!Array.isArray(cases)||cases.length<1||cases.length>4)throw Error('Select one to four representative cases before PCM analysis');
 const members=new Map(scope.tracks.map(t=>[t.key,t])),seen=new Set();
 return cases.map(c=>{
  if(!c||c.from===c.to)throw Error('Distinct source and target required');
  for(const key of [c.from,c.to]){
   const t=members.get(key),e=index.entries[key];
   if(!t)throw Error('Recording outside current Ste personal library: '+key);
   if(!e||e.status!=='ok'||!/^[a-f0-9]{40}$/.test(t.sha)||e.sha!==t.sha)throw Error('Current Ste recording SHA mismatch: '+key);
  }
  if(members.get(c.from).sha===members.get(c.to).sha)throw Error('The same recording cannot be a new transition');
  const id=c.from+'\n'+c.to;if(seen.has(id))throw Error('Duplicate research case');seen.add(id);
  return {...c,sourceSha:members.get(c.from).sha,targetSha:members.get(c.to).sha};
 });
}
if(require.main===module){
 const args=process.argv.slice(2);if(args.some(a=>!/^--(?:output|cases)=.+/.test(a)))throw Error('Only --output and optional --cases are supported; profile is fixed to Ste');
 const value=k=>args.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3),file=value('output');
 if(!file||fs.existsSync(file))throw Error('Supply a new --output file; existing evidence is preserved');
 const scope=currentSteScope(),cases=value('cases');
 const result={scope,...(cases?{cases:validateSteCases(JSON.parse(fs.readFileSync(cases,'utf8')),scope,JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json'),'utf8')))}:{})};
 fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({profile:'Ste',recordings:scope.tracks.length,cases:result.cases?.length||0,audioDecoded:0,userDataChanged:false}));
}
module.exports={currentSteScope,validateSteCases};
