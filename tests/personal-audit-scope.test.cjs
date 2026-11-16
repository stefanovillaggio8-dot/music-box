'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
test('personal audit excludes the requested playlist without changing user data or other profiles',()=>{
 const root=path.resolve(__dirname,'..'),folder=fs.mkdtempSync(path.join(os.tmpdir(),'musicbox-personal-audit-'));
 const names=['stato.json','playlist.json'],before=names.map(n=>fs.readFileSync(path.join(root,n)));
 try{
  cp.execFileSync(process.execPath,['tools/simulate-library-listening.cjs','--personal-only=true','--exclude-playlists=Ste:gym',
   '--inventory-only=true','--scope-dir='+folder,'--output='+path.join(folder,'report.json')],{cwd:root});
  const read=n=>JSON.parse(fs.readFileSync(path.join(folder,n+'.json'))),scope=read('Ste'),playlists=JSON.parse(before[1]);
  const excluded=new Set(playlists.find(p=>p.nascostaDa==='Ste'&&p.name.toLowerCase()==='gym').tracks);
  assert.ok(scope.tracks.length>100);assert.equal(scope.tracks.filter(t=>excluded.has(t.id)).length,0);
  assert.ok(read('Diego').tracks.length>100);assert.ok(read('Emanuele').tracks.length>100);
  assert.deepEqual(read('report').results,[]);assert.equal(read('report').personalLibrariesOnly,true);
  for(const [i,name] of names.entries())assert.ok(fs.readFileSync(path.join(root,name)).equals(before[i]));
 }finally{
  assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));
  assert.ok(path.basename(folder).startsWith('musicbox-personal-audit-'));fs.rmSync(folder,{recursive:true,force:true});
 }
});
