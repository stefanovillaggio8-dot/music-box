#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const arg=(name,fallback)=>process.argv.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3)??fallback;
(async()=>{
 const {stretchClip}=await import('../audio-stretch-core.mjs');
 const rate=Number(arg('rate','16000')),bytes=fs.readFileSync(arg('input',''));
 if(bytes.length%8||bytes.length>rate*40*8)throw Error('Invalid stereo PCM input');
 const source=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
 const channels=[0,1].map(c=>Float32Array.from({length:source.length/2},(_,i)=>source[i*2+c]));
 const cue=JSON.parse(fs.readFileSync(arg('cue',''),'utf8'));
 const result=stretchClip({rate,start:0,channels},cue);
 if(!result.pitchPreserved||!result.timing.verified)throw Error('Original MP3 time-stretch timing failed: '+JSON.stringify(result.timing));
 console.log(JSON.stringify({pitchPreserved:result.pitchPreserved,hold:result.rateHold,ramp:result.rateRamp,timing:result.timing}));
})().catch(error=>{console.error(error.message);process.exitCode=1});
