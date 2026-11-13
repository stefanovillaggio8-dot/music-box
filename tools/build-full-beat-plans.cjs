#!/usr/bin/env node
"use strict";
// Compile original-PCM evidence to small, SHA-bound pair cues. No audio and
// no PCM contour arrays are shipped to the player. Never changes a Git ref.
const fs=require('node:fs'),path=require('node:path');
const arg=(k,f)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const directory=arg('features',''),output=arg('output','dj-deep-analysis.json');
if(!directory)throw Error('Supply --features=DIR with PCM shard JSONs');
const root=path.resolve(__dirname,'..'),file=path.join(root,'dj-deep-analysis.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):/^pcm-\d+\.json$/.test(x.name)?[path.join(dir,x.name)]:[])}
const features=new Map();
for(const name of files(directory))for(const [key,value] of Object.entries(JSON.parse(fs.readFileSync(name,'utf8')).entries||{})){
 if(!data.entries[key]||data.entries[key].sha!==value.sha||value.pcmTransition?.sha!==value.sha)throw Error('SHA mismatch '+key);
 if(features.has(key))throw Error('Duplicate PCM shard entry '+key);
 features.set(key,value.pcmTransition);
}
if(!features.size)throw Error('No PCM transition features');
for(const [key,entry] of Object.entries(data.entries)){
 delete entry.pcmTransition;delete entry.pcmBeatPlans;
 if(features.has(key))entry.pcmTransition=features.get(key);
}
const tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const fsForEngine={...fs,readFileSync:(f,...args)=>path.resolve(String(f))===file?JSON.stringify(data):fs.readFileSync(f,...args)};
const req=x=>x==='node:fs'?fsForEngine:require(x);
const {engine,tracks}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks};')(req,path.join(root,'tools'));
const plans=[],raw=new Map(Object.entries(data.entries));
for(const [from,a] of tracks){
 if(!features.has(from))continue;
 for(const [to,b] of tracks){
  if(from===to||a.sha===b.sha||!features.has(to))continue;
  const cue=engine.measuredFullBeatBridge(a,b,a.duration);
  if(!cue)continue;
  const entry=raw.get(from);entry.pcmBeatPlans??={};
  entry.pcmBeatPlans[b.sha]={version:1,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration,cue};
  plans.push({from,to,cue});
 }
}
for(const entry of Object.values(data.entries))delete entry.pcmTransition;
fs.writeFileSync(output,JSON.stringify(data)+'\n');
const report={features:features.size,analyzable:tracks.length,fullBeatPlans:plans.length,plans};
fs.writeFileSync(arg('report','/tmp/musicbox-full-beat-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({features:features.size,fullBeatPlans:plans.length,examples:plans.slice(0,5)},null,2));
