"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const index=JSON.parse(fs.readFileSync(path.join(root,"dj-deep-analysis.json"),"utf8"));
const excerpt=(start,end)=>{
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,"DJ routine missing: "+start);
 return source.slice(i,j);
};
const engine=new Function("isIOS","style",
 "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\n"+
 excerpt("function grooveAgreement(","// Find a *musical* release")+
 excerpt("function compatibility(","async function decode(")+
 excerpt("function hasReliableHarmony(","function resetMobileFade(")+
 "\nreturn {transition,similarNotes,grooveAgreement};"
)(false,"auto");
const tracks=Object.entries(index.entries||{})
 .filter(([key,v])=>v?.status==="ok"&&Number.isFinite(v.duration)&&v.duration>=26&&
  Array.isArray(v.chroma)&&v.chroma.length===12&&v.bpm>=55&&v.bpm<=210)
 .map(([key,data])=>({key,data}));
test("actual precomputed music library: sample real beat/soft/cut decisions and ensure transitions respect duration",()=>{
 assert.ok(tracks.length>100,"Expected many actual indexed MP3 analyses");
 const labels={beat:0,snap:0,soft:0,cut:0,none:0},byTrack=new Set();
 let pairs=0,candidateRhythm=0,candidateGroove=0,candidateHarmonic=0;
 // Reproducible, broadly distributed sample; no downloading entire MP3s.
 const sources=tracks.filter((_,i)=>i%Math.max(1,Math.floor(tracks.length/95))===0).slice(0,95);
 for(const a of sources){
  let passes=0;
  for(let i=0;i<tracks.length;i+=Math.max(1,Math.floor(tracks.length/160))){
   const b=tracks[i];
   if(a.key===b.key)continue;
   pairs++;
   const bpmA=a.data.bpm,bpmB=b.data.bpm;
   const ratio=[.5,1,2].map(n=>bpmA/(bpmB*n))
     .reduce((x,y)=>Math.abs(Math.log2(x))<Math.abs(Math.log2(y))?x:y);
   if(ratio>=.94&&ratio<=1.06){
    candidateRhythm++;
    const groove=engine.grooveAgreement(a.data,b.data);
    if(groove?.score>=.60)candidateGroove++;
    if(engine.similarNotes(a.data,b.data).focused>=.60)candidateHarmonic++;
   }
   const plan=engine.transition(a.data,b.data,a.data.duration);
   const name=plan?.kind||"none";labels[name]=(labels[name]||0)+1;
   if(plan){
    assert.ok(Number.isFinite(plan.begin)&&Number.isFinite(plan.end));
    assert.ok(plan.begin>=0&&plan.end<=a.data.duration+0.02);
    if(plan.kind==="beat"||plan.kind==="snap")passes++;
   }
  }
  if(passes>0)byTrack.add(a.key);
 }
 const stats={indexed:tracks.length,pairs,nearBpm:candidateRhythm,
  rhythmicGroove:candidateGroove,similarNotes:candidateHarmonic,
  withVerifiedBeat:byTrack.size,outcome:labels};
 console.info("[DJ INDEX REAL AUDIO]",JSON.stringify(stats));
 assert.ok(pairs>5000,"Need broad music-library coverage");
 assert.ok(candidateRhythm>0,"Expected at least some physically close BPM candidates");
});
