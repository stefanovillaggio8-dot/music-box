'use strict';
// CI fixture fetcher. Scope is checked before any original is downloaded.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {currentSteScope,validateSteCases}=require('./ste-research-scope.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),candidate=JSON.parse(fs.readFileSync(process.argv[2]));
 if(candidate.evaluationOnly!==true)throw Error('Evaluation fixture required');
 const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 const [pair]=validateSteCases([{from:candidate.from,to:candidate.to}],currentSteScope(),index);
 if((candidate.sourceSha||candidate.record?.fromSha)!==pair.sourceSha||(candidate.targetSha||candidate.record?.toSha)!==pair.targetSha)throw Error('Changed fixture SHA');
 const folder=path.resolve(root,'../original-mp3');fs.mkdirSync(folder,{recursive:true});
 for(const key of [pair.from,pair.to]){
  const sha=index.entries[key].sha,file=path.join(folder,sha+'.mp3');
  let bytes;
  if(fs.existsSync(file))bytes=fs.readFileSync(file);
  else{
   if(!key.startsWith('audio/songs/'))throw Error('Only selected original audio repository fixtures');
   const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+key.slice(6));
   if(!response.ok)throw Error('Original unavailable');bytes=Buffer.from(await response.arrayBuffer());
  }
  if(bytes.length>32e6||crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')!==sha)throw Error('Original identity mismatch');
  if(!fs.existsSync(file))fs.writeFileSync(file,bytes,{flag:'wx'});
 }
 console.log('Two current Ste originals verified; no playback or user storage changed');
})().catch(e=>{console.error(e);process.exitCode=1});
