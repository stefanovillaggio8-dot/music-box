'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {prepare}=require('./ste-clean-probe-server.cjs');
(async()=>{
 const data=JSON.parse(fs.readFileSync(process.argv[2])),{needed}=prepare(data),folder=path.resolve(__dirname,'../../original-mp3');
 fs.mkdirSync(folder,{recursive:true});
 for(const r of needed){const file=path.join(folder,r.sourceSha+'.mp3');if(fs.existsSync(file))continue;
  if(!r.key.startsWith('audio/songs/'))throw Error('Selected original repository only');
  const response=await fetch('https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+r.key.slice(6));
  if(!response.ok)throw Error('Selected original unavailable');const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>32e6||crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')!==r.sourceSha)throw Error('Changed selected original');
  fs.writeFileSync(file,bytes,{flag:'wx'});
 }
 console.log(needed.length+' bounded Ste originals verified; no runtime index writes');
})().catch(e=>{console.error(e);process.exitCode=1});
