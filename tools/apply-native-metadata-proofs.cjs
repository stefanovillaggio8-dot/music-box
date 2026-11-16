'use strict';
// Offline producer. It never changes original MP3s or browser storage.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function certify(candidates,proofs){
 if(candidates.version!==1||!candidates.entries||candidates.errors?.length)throw Error('Unverified metadata candidates');
 if(proofs.length!==2||['chromium','webkit'].some(b=>proofs.filter(p=>p.method==='native-mp3-metadata-identical-pcm-v1'&&p.browser===b).length!==1))throw Error('Exactly both native decoders required');
 const output={version:1,entries:{}};
 for(const [key,p] of Object.entries(candidates.entries)){
  const rates={};
  for(const sampleRate of [44100,48000]){
   const sets=proofs.map(proof=>proof.results.filter(r=>r.key===key&&r.sampleRate===sampleRate));
   if(sets.some(x=>x.length!==1))throw Error('Missing or duplicate native source/rate');
   const rows=sets.map(x=>x[0]);
   if(rows.some(r=>r.sourceSha!==p.sourceSha||r.sourceSha256!==p.sourceSha256||r.wrappedSha256!==p.wrappedSha256||r.accepted!==true||r.maximumSampleDifference!==0||r.channels!==2||!Number.isInteger(r.originalFrames)||r.originalFrames<=0||r.originalFrames!==r.wrappedFrames||Math.abs(r.originalFrames/sampleRate-p.duration)>.1)||rows[0].originalFrames!==rows[1].originalFrames)throw Error('Native PCM identity failed');
   rates[sampleRate]={frames:rows[0].originalFrames,channels:2,maximumSampleDifference:0,browsers:['chromium','webkit']};
  }
  output.entries[key]={...p,browserVerified:true,nativePcmIdentity:{method:'actual-native-metadata-identical-pcm-v1',sourceSha256:p.sourceSha256,wrappedSha256:p.wrappedSha256,rates}};
 }
 return output;
}
if(require.main===module){
 const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
 const input=arg('candidates'),folder=arg('proofs'),output=arg('output');
 if(!input||!folder||!output)throw Error('Explicit candidates, proofs directory and output required');
 const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
 const proofs=fs.readdirSync(folder,{recursive:true}).filter(f=>f.endsWith('.json')).map(f=>read(path.join(folder,f))).filter(p=>p.method==='native-mp3-metadata-identical-pcm-v1');
 const result=certify(read(input),proofs);
 result.proofReceipts=proofs.map(p=>({browser:p.browser,sha256:crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex')}));
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({verifiedSources:Object.keys(result.entries).length}));
}
module.exports={certify};
