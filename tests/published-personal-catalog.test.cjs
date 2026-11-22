'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const {publishedCatalog}=require('../tools/published-personal-catalog.cjs');
const track=(id,profile)=>({title:id,artist:'unseen fixture',file:'songs/youtube-'+id+'.mp3',profile});
test('the real selector audit prefix also loads correctly from external regression callers',()=>{
 const file=path.join(root,'tools/simulate-library-listening.cjs'),source=fs.readFileSync(file,'utf8').replace(/^#![^\n]*\n/,'');
 const previous=process.argv;
 try{
  process.argv=[process.execPath,file,'--personal-only=true','--exclude-playlists=Ste:gym'];
  const helper=new Function('require','__dirname',source.slice(0,source.indexOf('(async()=>'))+'return {members};')(require,path.dirname(file));
  assert.ok(helper.members('Ste').length>100);assert.ok(helper.members('Diego').length>100);
 }finally{process.argv=previous}
});
test('published imports use actual app validation and merge by file AND owner, without changing inputs',()=>{
 const builtin=[track('FutureSte01','Ste')],imports=[track('FutureSte01','Ste'),track('FutureSte01','Diego'),track('FutureEma01','Emanuele'),
  {...track('Invalid0001','Ste'),file:'../private.mp3'},track('short','Ste'),{...track('Other000001','Ste'),profile:null}];
 const before=JSON.stringify({builtin,imports});
 const result=publishedCatalog(app,builtin,imports);
 assert.deepEqual(result.map(x=>[x.file,x.profile]),[
  ['songs/youtube-FutureSte01.mp3','Ste'],['songs/youtube-FutureSte01.mp3','Diego'],['songs/youtube-FutureEma01.mp3','Emanuele']]);
 assert.equal(JSON.stringify({builtin,imports}),before);
 assert.throws(()=>publishedCatalog(app,builtin,{}),/imports array/);
});
test('new published recordings enter only their actual personal scope; unknown analysis is explicit and excluded playlist stays excluded',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-published-scope-'));
 const protectedFiles=['app.js','stato.json','playlist.json','online-imports.json','dj-deep-analysis.json'];
 const before=protectedFiles.map(x=>fs.readFileSync(path.join(root,x)));
 try{
  const write=(name,data)=>{const p=path.join(folder,name+'.json');fs.writeFileSync(p,JSON.stringify(data));return p};
  const imports=[track('FutureSte01','Ste'),track('FutureDie01','Diego'),track('FutureEma01','Emanuele'),track('GymOnly0001','Ste'),track('Unknown0001','Ste')];
  const data=JSON.parse(before[4]);
  for(const t of imports.slice(0,4))data.entries['app/'+t.file]={sha:'1'.repeat(40),status:'ok',duration:100,first:0,last:100,bpm:120};
  const playlists=JSON.parse(before[2]);playlists.find(p=>p.nascostaDa==='Ste'&&p.name.toLowerCase()==='gym').tracks.push('b-youtube-GymOnly0001');
  cp.execFileSync(process.execPath,['tools/simulate-library-listening.cjs','--personal-only=true','--exclude-playlists=Ste:gym','--inventory-only=true',
   '--imports='+write('imports',imports),'--index='+write('index',data),'--playlists='+write('playlists',playlists),
   '--scope-dir='+folder,'--output='+path.join(folder,'report.json')],{cwd:root});
  for(const [profile,own] of [['Ste','FutureSte01'],['Diego','FutureDie01'],['Emanuele','FutureEma01']]){
   const scope=JSON.parse(fs.readFileSync(path.join(folder,profile+'.json'))),ids=new Set(scope.tracks.map(t=>t.id));
   assert.equal(ids.has('b-youtube-'+own),true);
   for(const other of ['FutureSte01','FutureDie01','FutureEma01'].filter(x=>x!==own))assert.equal(ids.has('b-youtube-'+other),false);
   assert.equal(ids.has('b-youtube-GymOnly0001'),false);
   if(profile==='Ste')assert.ok(scope.unavailable.includes('b-youtube-Unknown0001'));
  }
  const report=JSON.parse(fs.readFileSync(path.join(folder,'report.json')));
  assert.equal(report.publishedImports.manifestRows,5);assert.match(report.publishedImports.sha256,/^[a-f0-9]{64}$/);
  for(const [i,name] of protectedFiles.entries())assert.ok(fs.readFileSync(path.join(root,name)).equals(before[i]));
 }finally{
  assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('musicbox-published-scope-'));
  fs.rmSync(folder,{recursive:true,force:true});
 }
});
