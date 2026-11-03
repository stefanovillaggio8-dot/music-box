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
 "\nreturn {transition,similarNotes,grooveAgreement,camelotMatch,hasImmediateMusicalIntro,continuityFallback};"
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

test("diagnose the 2026-11-03 screen recording: track 153 into 8",()=>{
 const a=tracks.find(t=>t.key==="audio/songs/track-153.mp3");
 const b=tracks.find(t=>t.key==="audio/songs/track-8.mp3");
 assert.ok(a&&b,"Both recorded MP3s must be in the measured index");
 const plan=engine.transition(a.data,b.data,a.data.duration);
 const notes=engine.similarNotes(a.data,b.data);
 const groove=engine.grooveAgreement(a.data,b.data);
 const key=engine.camelotMatch(a.data,b.data);
 console.info("[DJ RECORDING 153 TO 8]",JSON.stringify({
  from:{key:a.key,bpm:a.data.bpm,confidence:a.data.beatConfidence,
    duration:a.data.duration,last:a.data.last,protectedEnding:a.data.protectedEnding,
    confidentTail:a.data.confidentTail,lastLyricAt:a.data.lastLyricAt,
    lastVoiceAt:a.data.lastVoiceAt,dropRelease:a.data.dropRelease},
  to:{key:b.key,bpm:b.data.bpm,confidence:b.data.beatConfidence,
    introDrive:b.data.introDrive,first:b.data.first,firstLyricAt:b.data.firstLyricAt},
  notes:{matches:notes.matches,focused:notes.focused,phrase:notes.phrase,
    alignment:notes.alignment,reason:notes.reason},
  groove,key,plan
 }));
});

test("inspect music actually responsible for repeated zero beatCandidates in console",()=>{
 const targets=["track-160.mp3","track-161.mp3","track-112.mp3","track-138.mp3"];
 for(const target of targets){
  const outgoing=tracks.find(t=>t.key==="audio/songs/"+target)||
   tracks.find(t=>t.key.endsWith("/"+target));
  if(!outgoing){console.info("[DJ ZERO DIAGNOSTIC]",JSON.stringify({target,missing:true}));continue;}
  const a=outgoing.data;
  const counts={total:0,introRejected:0,beatConfidence18:0,nearBpm:0,
   groove60:0,harmonicFocused60:0,phrase45:0,match:0,
   anyBeat:0,anySnap:0,anySoft:0,anyCut:0,anyOther:0};
  let best=[];
  for(const incoming of tracks){
   if(incoming.key===outgoing.key)continue;
   counts.total++;
   const b=incoming.data;
   if(b.introDrive<.33||b.first-(b.safeIntroAt||0)>1.3){counts.introRejected++;continue}
   if(a.beatConfidence>=.18&&b.beatConfidence>=.18)counts.beatConfidence18++;
   const bpmA=a.bpm,bpmB=b.bpm;
   const ratio=[.5,1,2].map(n=>bpmA/(bpmB*n))
    .reduce((x,y)=>Math.abs(Math.log2(x))<Math.abs(Math.log2(y))?x:y);
   if(ratio<.94||ratio>1.06)continue;
   counts.nearBpm++;
   const g=engine.grooveAgreement(a,b);
   if((g?.score||0)<.60)continue;
   counts.groove60++;
   const n=engine.similarNotes(a,b);
   if((n.focused||0)>=.60)counts.harmonicFocused60++;
   if((n.phrase||0)>=.45)counts.phrase45++;
   if(n.matches)counts.match++;
   const cue=engine.transition(a,b,a.duration);
   // Only a diagnostic upper bound: assume the actual vocal scanner later
   // proves the final 12s instrumental. NEVER treat this as existing proof.
   const hypotheticallyScanned={...a,voiceModel:"TEST_ONLY",
    voiceScannedEnd:a.last+.1,lastVoiceAt:Math.max(0,a.last-12)};
   const hypothetical=engine.transition(hypotheticallyScanned,b,a.duration);
   if(hypothetical?.voiceVerifiedMicroBridge)
    counts.possibleWithActualVocalProof=(counts.possibleWithActualVocalProof||0)+1;
   if(cue){
    if(cue.kind==="beat")counts.anyBeat++;
    else if(cue.kind==="snap")counts.anySnap++;
    else if(cue.kind==="soft")counts.anySoft++;
    else if(cue.kind==="cut")counts.anyCut++;
    else counts.anyOther++;
   }
   best.push({id:incoming.key,groove:+g.score.toFixed(3),
    focused:+Number(n.focused||0).toFixed(3),phrase:+Number(n.phrase||0).toFixed(3),
    align:+Number(n.alignment?.score||0).toFixed(3),matched:n.matches,
    bpm:b.bpm,kind:cue?.kind||null});
  }
  best.sort((x,y)=>((Number(y.matched)-Number(x.matched))*.8+
    y.focused*.2+y.groove*.3)-((Number(x.matched)-Number(y.matched))*.8+
    x.focused*.2+x.groove*.3));
  console.info("[DJ ZERO DIAGNOSTIC]",JSON.stringify({
   target,analysis:{duration:a.duration,last:a.last,trailing:a.trailing,
    bpm:a.bpm,confidence:a.beatConfidence,
    dropRelease:a.dropRelease,protectedEnding:a.protectedEnding,
    confidentTail:a.confidentTail,voiceModel:a.voiceModel||null},
   counts,examples:best.slice(0,4)}));
 }
});


test("screen recording 00:41:03: diagnose musical candidates for track-1197 and track-129",()=>{
 for(const target of ["track-1197.mp3","track-129.mp3"]){
  const from=tracks.find(t=>t.key==="audio/songs/"+target)||
   tracks.find(t=>t.key.endsWith("/"+target));
  if(!from){console.info("[DJ USER VIDEO]",JSON.stringify({target,missing:true}));continue;}
  const a=from.data,counts={library:0,tempo:0,groove:0,boundary:0,
   nearUnknownKey:0},examples=[];
  for(const {key,data:b} of tracks){
   if(key===from.key||!(b.introDrive>=.33)||b.first-(b.safeIntroAt||0)>1.3)continue;
   counts.library++;
   const ratio=[.5,1,2].map(k=>a.bpm/(b.bpm*k))
     .reduce((x,y)=>Math.abs(Math.log2(x))<Math.abs(Math.log2(y))?x:y);
   if(ratio<.945||ratio>1.055)continue;
   counts.tempo++;
   const g=engine.grooveAgreement(a,b);
   if(!g||g.score<.60)continue;
   counts.groove++;
   const n=engine.similarNotes(a,b);
   if(Number.isFinite(n.focused)&&n.focused>=.65&&
      Number.isFinite(n.phrase)&&n.phrase>=.48)counts.boundary++;
   if(g.score>=.76&&n.focused>=.71&&n.phrase>=.48){
    counts.nearUnknownKey++;
    examples.push({key,groove:+g.score.toFixed(2),
     focused:+n.focused.toFixed(2),phrase:+n.phrase.toFixed(2)});
   }
  }
  console.info("[DJ USER VIDEO]",JSON.stringify({target,counts,
   top:examples.slice(0,4)}));
 }
});

test("extended 50k+ measured DJ transitions: end boundaries, sync metadata, safe fallback",()=>{
 const out=tracks.filter((_,i)=>i%Math.max(1,Math.floor(tracks.length/250))===0).slice(0,250);
 const ins=tracks.filter((_,i)=>i%Math.max(1,Math.floor(tracks.length/235))===0).slice(0,235);
 let pairs=0,beat=0,snap=0,soft=0,cut=0,other=0,missing=0;
 for(const a of out)for(const b of ins){
  if(a.key===b.key)continue;
  pairs++;
  const cue=engine.transition(a.data,b.data,a.data.duration);
  if(!cue){missing++;continue}
  assert.ok(Number.isFinite(cue.begin)&&Number.isFinite(cue.end));
  assert.ok(cue.begin>=0&&cue.end>=cue.begin);
  assert.ok(cue.end<=a.data.duration+.03);
  assert.ok(Number.isFinite(cue.entry)&&cue.entry>=0);
  assert.ok(Number.isFinite(cue.fade)&&cue.fade>=0);
  assert.ok(!a.data.durationMismatch,"duration-mismatched source was matched");
  if(cue.kind==="beat")beat++;
  else if(cue.kind==="snap")snap++;
  else if(cue.kind==="soft")soft++;
  else if(cue.kind==="cut")cut++;
  else other++;
 }
 assert.ok(pairs>=30000,"stress test must include 30k+ real-song pairs");
 console.info("[DJ FULL STRESS]",JSON.stringify({
  indexed:tracks.length,pairs,beat,snap,soft,cut,other,none:missing}));
});


test("large-library randomized DJ transitions respect real audio boundaries and voice guards",()=>{
 let pairs=0,plans=0,beat=0,snap=0,protectedCount=0;
 for(let i=0;i<tracks.length;i+=11){
  const a=tracks[i].data;
  for(let j=0;j<tracks.length;j+=2){
   if(i===j)continue;
   const b=tracks[j].data;
   const cue=engine.transition(a,b,a.duration);
   pairs++;
   if(!cue)continue;
   plans++;
   assert.ok(Number.isFinite(cue.begin)&&Number.isFinite(cue.end),
    "nonfinite DJ cue "+tracks[i].key+" -> "+tracks[j].key);
   assert.ok(cue.begin>=0&&cue.end<=a.duration+.05&&cue.end>=cue.begin,
    "invalid transition boundary "+tracks[i].key+" -> "+tracks[j].key);
   assert.ok(Number.isFinite(cue.entry)&&cue.entry>=0&&cue.entry<=18.01,
    "next music entrance must not jump ahead");
   if(cue.kind==="beat")beat++;
   if(cue.kind==="snap")snap++;
   if((cue.kind==="beat"||cue.kind==="snap")&&plans%7===0){
    // Newly discovered late vocals must not permit this early beat join.
    const guarded=engine.transition({...a,lastLyricAt:cue.end-.1,
     lastVoiceAt:cue.end-.1},b,a.duration);
    assert.ok(guarded?.kind!=="beat"&&guarded?.kind!=="snap",
      "unsafe beat crossing late vocal "+tracks[i].key+" -> "+tracks[j].key);
    protectedCount++;
   }
  }
 }
 console.info("[DJ MASS LOAD]",JSON.stringify({tracks:tracks.length,
  pairs,plans,beat,snap,protectedCount}));
 assert.ok(pairs>30000,"large sample should cover the whole collection");
 assert.ok(plans>0,"must include feasible real audio transitions");
});

test("real audio index audits one-beat blends without trimming protected endings",()=>{
 let checked=0,blended=0;
 const outgoing=tracks.filter((_,i)=>i%14===0).slice(0,90);
 const incoming=tracks.filter((_,i)=>i%7===0).slice(0,180);
 for(const a of outgoing)for(const b of incoming){
  if(a.key===b.key)continue;
  checked++;
  const p=engine.transition(a.data,b.data,a.data.duration);
  if(!p?.rhythmicUnderlay)continue;
  blended++;
  assert.ok(p.end>=a.data.duration-.1&&p.end<=a.data.duration);
  // A protected LOUD ending may have a genuine compatible beat.
  // It must remain audible through the handoff, never be treated as silence.
  assert.ok(p.preserveTail===true,"matched final music must be preserved");
  assert.ok(p.fade<=1.05 ||
   (p.kind==="beat"&&p.vocalVerifiedBeat===true&&p.fade<=4.5),
   "long blends need measured voice safety");
  if(a.data.protectedEnding===true)
   assert.equal(p.silenceTrim,false,"a loud final kick cannot be trimmed");
  const guarded={...a.data,lastLyricAt:a.data.duration-.4,lastVoiceAt:a.data.duration-.4};
  assert.ok(!engine.transition(guarded,b.data,guarded.duration)?.rhythmicUnderlay);
 }
 console.info("[DJ REAL RHYTHM BRIDGES]",JSON.stringify({checked,blended}));
 assert.ok(checked>5000);
});

test("diagnose why observed zero-candidate tracks reject short rhythmic joins",()=>{
 const targets=["track-160.mp3","track-161.mp3","track-112.mp3","track-138.mp3"];
 for(const target of targets){
  const current=tracks.find(t=>t.key==="audio/songs/"+target);
  if(!current)continue;
  const a=current.data;let cnt={tempo:0,drums:0,notes:0,key:0,eligible:0};
  const examples=[];
  for(const incoming of tracks){
   if(incoming.key===current.key)continue;
   const b=incoming.data;
   if(!engine.hasImmediateMusicalIntro(b))continue;
   const ratio=[.5,1,2].map(scale=>a.bpm/(b.bpm*scale)).reduce((p,q)=>
    Math.abs(Math.log2(p))<Math.abs(Math.log2(q))?p:q);
   if(!Number.isFinite(ratio)||ratio<.94||ratio>1.06)continue;
   cnt.tempo++;
   const g=engine.grooveAgreement(a,b);
   if(!g||g.score<.77)continue;
   cnt.drums++;
   const n=engine.similarNotes(a,b);
   if(!(n.focused>=.5&&n.phrase>=.35))continue;
   cnt.notes++;
   const k=engine.camelotMatch(a,b);
   if(k.weight>=.14&&k.score<.4)continue;
   cnt.key++;
   const cue=engine.transition(a,b,a.duration);
   if(cue?.rhythmicUnderlay)cnt.eligible++;
   examples.push({id:incoming.key,groove:+g.score.toFixed(2),
    focused:+n.focused.toFixed(2),phrase:+n.phrase.toFixed(2),
    key:k.score,weight:k.weight,
    confidence:b.beatConfidence,drive:b.introDrive,kind:cue?.kind||null});
  }
  console.info("[DJ ACTUAL ZERO FILTERS]",JSON.stringify({target,protected:a.protectedEnding,
   last:a.last,duration:a.duration,confidence:a.beatConfidence,counts:cnt,
   sample:examples.slice(0,4)}));
 }
});

test("track-161 can find at least one measured percussive bridge, without inventing key harmony",()=>{
 const outgoing=tracks.find(x=>x.key==="audio/songs/track-161.mp3");
 assert.ok(outgoing,"real playback regression track-161 must be indexed");
 const matches=tracks.filter(t=>t.key!==outgoing.key).map(next=>({
  next,plan:engine.transition(outgoing.data,next.data,outgoing.data.duration)
 })).filter(x=>x.plan?.rhythmicUnderlay);
 console.info("[DJ TRACK 161 BRIDGES]",JSON.stringify({
  count:matches.length,
  candidates:matches.slice(0,5).map(x=>({id:x.next.key,
   percussiveOnly:!!x.plan.percussiveOnly,fade:x.plan.fade,
   start:x.plan.begin,end:x.plan.end}))
 }));
 assert.ok(matches.length>=1,"Track 161 should find a beat-aligned short join in the indexed library");
 for(const {plan} of matches){
  assert.ok(plan.end>=outgoing.data.duration-.1);
  assert.ok(plan.fade<=1.05);
 }
});

test("real audio library: zero-candidate tracks still have a gentle final-song continuity",()=>{
 const targets=["track-160.mp3","track-161.mp3","track-112.mp3","track-138.mp3"];
 let tested=0,fallbacks=0;
 for(const file of targets){
  const a=tracks.find(t=>t.key==="audio/songs/"+file);
  if(!a)continue;
  const choices=tracks.filter(t=>t.key!==a.key).slice(0,120);
  for(const b of choices){
   const p=engine.transition(a.data,b.data,a.data.duration)||
    engine.continuityFallback(a.data,b.data,a.data.duration);
   assert.ok(p,"desktop must have an executable transition plan");
   assert.ok(p.end<=a.data.duration&&p.end>=26);
   assert.ok(p.fade>=0);
   if(p.continuityFallback){
    fallbacks++;
    assert.equal(p.kind,"continuity");
    assert.equal(p.score,null);
    if(a.data.protectedEnding===true)
     assert.ok(p.end>=a.data.duration-.2,"do not cut protected song");
   }
   tested++;
  }
 }
 console.info("[DJ REAL FALLBACK]",JSON.stringify({tested,fallbacks}));
 assert.ok(tested>=400&&fallbacks>0);
});
