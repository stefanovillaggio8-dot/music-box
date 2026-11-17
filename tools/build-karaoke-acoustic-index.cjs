#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{fromCtc,fromTimedRows,hash,prepare}=require('./karaoke-acoustic-proof.cjs');
const arg=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const manifest=read(arg('manifest')),measured=read(arg('observations'));
const output=path.resolve(arg('output')),folder=path.join(output,'karaoke-acoustic');
const timed=arg('timed')?read(arg('timed')):null,entries={},tracks={},summary=[];
if(timed&&(timed.inference?.model!=='onnx-community/whisper-tiny_timestamped'||timed.inference?.revision!=='517244293732ee2d58139af5814231b7e6830a0d'))throw Error('Unbound precomputed ASR');
if(measured.method!=='ctc-observed-word-separator-v1'||measured.modelSha256!=='488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d')throw Error('Unbound CTC model');
fs.mkdirSync(folder,{recursive:true});
(async()=>{for(const record of manifest.records){
 const evidence=measured.records.find(r=>r.id===record.id);
 const audioSha256=hash(fs.readFileSync(record.file));
 if(!evidence||evidence.sourceAudioSha256!==audioSha256||record.language!=='en')throw Error('Recording identity mismatch');
 const lines=record.rows.map(r=>({start:r.t,text:r.text}));
 const proof=fromCtc(record.rows,lines,evidence.words,audioSha256,measured.modelSha256);
 proof.separationWeights=measured.separationWeights;
 if(timed){
  const recognized=timed.records.find(r=>r.id===record.id);
  if(recognized?.audioSha256!==audioSha256)throw Error('Precomputed ASR recording mismatch');
  proof.asr=timed.inference;proof.recognizedRows=fromTimedRows(record.rows,recognized.rows);
 }
 const accepted=await prepare(proof,record.rows,audioSha256);
 if(!accepted||!accepted.words.length&&!accepted.recognized.length){summary.push({id:record.id,included:false,reason:'no-eligible-acoustic-evidence'});continue;}
 const bytes=Buffer.from(JSON.stringify(proof)+'\n'),sha256=hash(bytes),file='karaoke-acoustic/'+sha256+'.json';
 if(entries[audioSha256]&&entries[audioSha256].sha256!==sha256)throw Error('Conflicting transcripts for one recording');
 fs.writeFileSync(path.join(output,file),bytes);
 entries[audioSha256]={path:file,sha256,bytes:bytes.length};
 const id=record.id.split('@')[0];tracks[id]??=[];tracks[id].push(audioSha256);
 summary.push({id:record.id,audioSha256,words:proof.words.length,bytes:bytes.length});
}
fs.writeFileSync(path.join(output,'karaoke-acoustic-index.json'),JSON.stringify({version:1,entries,tracks},null,2)+'\n');
console.log(JSON.stringify(summary));
})().catch(error=>{console.error(error);process.exitCode=1});
