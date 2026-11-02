"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const start=source.indexOf("async function intelligentShuffle(app,audio,fromId){");
const end=source.indexOf("let shuffleBusy=",start);
assert.ok(start>0&&end>start,"extract complete shuffle picker");

function fixture(options={}){
 const old={id:1,url:"old",analysis:{
  duration:100,bpm:120,beatConfidence:.65,introDrive:.85,level:.2,
  last:100,protectedEnding:false,...options.old
 }};
 const pool=(options.pool||[]).map((spec,i)=>({
  id:i+2,url:"next"+(i+2),analysis:{
   duration:110,bpm:120,beatConfidence:.65,introDrive:.80,level:.2,
   ...spec.analysis, cue:spec.cue
  }
 }));
 let selected=null;
 const app={
  currentId:()=>1,allTracks:()=>[old,...pool],
  mixShuffleCandidates:()=>options.manual?[]:pool.slice(0,2),
  mixShufflePool:()=>pool,
  mixSelectShuffle:arg=>{selected=arg;return true},
  mixUrl:t=>t.url,mixLyricCues:()=>null
 };
 const ctx={
  app,pool,old,selected:()=>selected,
  voiceScore:()=>({score:.85}),
  harmonyScore:()=>({focused:.82,phrase:.81}),
 };
 const shim=[
  "const enabled=true,isIOS=false,window={MusicBoxRoom:{isActive:()=>false}};",
  "const cache=new Map(),deepLookup=t=>t?.analysis||null;",
  "const decode=async t=>t?.analysis||null;",
  "const grooveAgreement=()=>({score:.85});",
  "const similarNotes=()=>({focused:.82,phrase:.81});",
  "const transition=(old,next)=>next.cue||null;",
  "let shuffleLastDecision=null;",
  source.slice(start,end),
  "return {run:()=>intelligentShuffle(ctx.app,{duration:100,currentTime:0},1),",
  "decision:()=>shuffleLastDecision};"
 ].join("\n");
 const picker=new Function("ctx",shim)(ctx);
 return {...ctx,...picker};
}
const soft=(fade,patch={})=>({
 kind:"soft",fade,quietCertified:true,neutralRelease:true,begin:92,
 ...patch
});
const beat=(fade,patch={})=>({
 kind:"beat",fade,measuredBeatBridge:true,grooveScore:.84,score:88,
 ...patch
});
test("selects a certified musical fade instead of a random next song when beat matches are absent",async()=>{
 const f=fixture({pool:[{cue:null},{cue:soft(4.3)}]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,0);
 assert.equal(f.decision().softCandidates,1);
 assert.equal(f.decision().reason,"sfumatura musicale verificata");
});
test("verified beat always outranks soft fallback regardless of its fade length",async()=>{
 const f=fixture({pool:[{cue:soft(5.1)},{cue:beat(3.2)}]});
 await f.run();
 assert.equal(f.selected()?.pickId,3);
 assert.equal(f.decision().beatCandidates,1);
 assert.equal(f.decision().softCandidates,1);
 assert.equal(f.decision().reason,"beat certificato");
});
test("never select a soft fade if a late vocal overlaps the proposed join",async()=>{
 const f=fixture({old:{lastVoiceAt:94.3},pool:[
  {cue:null},{cue:soft(4.3,{begin:92})}
 ]});
 await f.run();
 assert.equal(f.selected(),null);
 assert.equal(f.decision().softCandidates,0);
});
test("reject quiet next intros and uncertified audio tails",async()=>{
 const f=fixture({pool:[
  {cue:null},
  {analysis:{introDrive:.1},cue:soft(4.4)},
  {cue:soft(4.4,{quietCertified:false})}
 ]});
 await f.run();
 assert.equal(f.selected(),null);
 assert.equal(f.decision().softCandidates,0);
});
test("do not reorder a manually managed queue",async()=>{
 const f=fixture({manual:true,pool:[{cue:soft(5)},{cue:beat(3.8)}]});
 const result=await f.run();
 assert.equal(result.retry,false);
 assert.equal(f.selected(),null);
});
test("honest diagnostics preserve near-rhythm counts without labelling a fade as beat",async()=>{
 const f=fixture({pool:[{cue:null},{cue:soft(4.2)}]});
 await f.run();
 const d=f.decision();
 assert.equal(d.beatCandidates,0);
 assert.ok(d.rhythmCandidates>=0);
 assert.equal(d.softCandidates,1);
 assert.equal(d.checked,2);
});
