"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {execFileSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const apiContext={};
new Function("window","globalThis",
 fs.readFileSync(path.join(root,"audio-lyrics-align.js"),"utf8"))(
 apiContext,apiContext);
const words=apiContext.MusicBoxAudioAlign;

test("local Whisper input preserves anti-phase stereo vocals instead of cancelling them",()=>{
 const sr=32000,samples=sr*3;
 const l=new Float32Array(samples),r=new Float32Array(samples);
 for(let i=0;i<samples;i++){
  l[i]=Math.sin(2*Math.PI*440*i/sr)*.7;
  r[i]=-l[i];
 }
 const make=(right)=>({sampleRate:sr,length:samples,
  numberOfChannels:right?2:1,
  getChannelData:ch=>ch===0?l:right});
 const mono=words.pcmSlice(make(null),0,3);
 const preserved=words.pcmSlice(make(r),0,3);
 const rms=x=>Math.sqrt(x.reduce((s,n)=>s+n*n,0)/x.length);
 assert.ok(rms(preserved)>.35,"anti-phase voice must remain audible to the model");
 assert.ok(Math.abs(rms(mono)-rms(preserved))<.025,
  "fallback must keep the genuine source channel, not amplify it");
 const normal=words.pcmSlice(make(new Float32Array(samples)),0,3);
 assert.ok(Math.abs(rms(normal)/rms(mono)-.5)<.025,
  "ordinary stereo must still downmix normally");
});

test("Whisper missing timestamps cannot silently become fabricated zero-second words",()=>{
 const actual=words.recognizedWords([
  {text:"missing",timestamp:[null,.8]},
  {text:"missing",timestamp:["",.8]},
  {text:"missing",timestamp:[0,null]},
  {text:"missing",timestamp:[undefined,1]},
  {text:"valid",timestamp:[.34,.67]},
 ]);
 assert.equal(actual.length,1);
 assert.equal(actual[0].t,.34);
});

test("real-index beat audio audit starts at the scheduled kick, not the 140ms preroll",()=>{
 const pairs=[["892","1096"]];
 for(const [a,b] of pairs){
  const raw=execFileSync(process.execPath,["tools/dj-equivalence-audit.cjs",
   `--pair-from=audio/songs/track-${a}.mp3`,
   `--pair-to=audio/songs/track-${b}.mp3`],
   {cwd:root,encoding:"utf8"});
  const data=JSON.parse(raw.split("[DJ PAIR PLAN] ")[1]);
  assert.equal(data.certified,true);
  assert.ok(data.beatStartWait>.08&&data.beatStartWait<.19);
  assert.ok(Math.abs(data.scheduledStart-data.plan.begin-data.beatStartWait)<1e-9);
  const p=data.plan;
  const incomingBeat=data.scheduledStart+p.nextBeat/p.tempo;
  const phase=((incomingBeat-p.beatAnchor)%p.beatPeriod+p.beatPeriod)%p.beatPeriod;
  assert.ok(Math.min(phase,p.beatPeriod-phase)<.00001,
   "the scheduled incoming kick must coincide with a measured outgoing beat");
 }
});

test("the old 770 to 874 phase match cannot authorize skipping an unverified incoming pickup",()=>{
 const raw=execFileSync(process.execPath,["tools/dj-equivalence-audit.cjs",
  '--pair-from=audio/songs/track-770.mp3','--pair-to=audio/songs/track-874.mp3'],{cwd:root,encoding:'utf8'});
 const data=JSON.parse(raw.split('[DJ PAIR PLAN] ')[1]);
 assert.equal(data.certified,false);assert.equal(data.plan,null);
 const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json'),'utf8'));
 assert.ok(index.entries['audio/songs/track-874.mp3'].safeIntroAt>0);
 assert.equal(index.entries['audio/songs/track-874.mp3'].musicalContent?.leadingDigitalSilence,undefined);
});
