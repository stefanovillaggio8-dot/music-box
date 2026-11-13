"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const js=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const start=js.indexOf("function measuredPulseAlignment(");
const end=js.indexOf("function measuredWindowRhythmUnderlay(",start);
assert.ok(start>0&&end>start);
const engine=new Function(js.slice(start,end)+
  "return {measuredPulseAlignment,measuredBeatJoinCandidate};")();
const localStart=js.indexOf("function measuredLocalBeatGrid(");
const localEnd=js.indexOf("function measuredPulseAlignment(",localStart);
assert.ok(localStart>0&&localEnd>localStart);
const measuredLocalBeatGrid=new Function(js.slice(localStart,localEnd)+
 "return measuredLocalBeatGrid;")();
test("local PCM grid accepts five or more regular quarter-note beats without any global-grid flag",()=>{
 const exact=Array.from({length:8},(_,i)=>100+i*.5);
 assert.equal(measuredLocalBeatGrid(exact,120,100,104),true);
 assert.equal(measuredLocalBeatGrid(exact,145,100,104),false);
 assert.equal(measuredLocalBeatGrid([100,100.02,100.04,100.06,100.08],120,100,104),false);
 assert.equal(measuredLocalBeatGrid([100,100.5,101,102.6,103.1],120,100,104),false);
 assert.equal(measuredLocalBeatGrid(exact.slice(0,3),120,100,104),false);
});
const a=Array.from({length:11},(_,i)=>100+i*.5);
const b=Array.from({length:10},(_,i)=>.25+i*.5);
test("independent PCM beat anchors align different kick sounds with timed entry",()=>{
 const result=engine.measuredBeatJoinCandidate(a,b,0,1,100,101,100.22);
 assert.ok(result,"multi-beat grid should find a phase-compatible start");
 assert.ok(result.begin>=100&&result.begin<=101);
 assert.ok(result.fit.total>=3&&result.fit.verified>=3);
 assert.ok(result.fit.rms<.015);
 assert.ok(result.fit.ratio>=.9);
 const at=engine.measuredPulseAlignment(a,b,result.begin,0,1);
 assert.ok(at.ratio>=.9);
});
test("several fast onset detections cannot reuse one outgoing beat as multiple matches",()=>{
 const outgoing=[100,100.5,101,101.5];
 const clustered=[.25,.28,.31,.34];
 const fit=engine.measuredPulseAlignment(outgoing,clustered,99.75,0,1);
 assert.ok(fit&&fit.total===4);
 assert.ok(fit.verified<=1&&fit.ratio<.85,
  "three hi-hats near one kick cannot certify a rhythmic bridge");
 assert.equal(engine.measuredBeatJoinCandidate(
  outgoing,clustered,0,1,99.6,100.2,99.75),null);
});
test("bad periodicity, unsupported tempo shift or insufficient evidence cannot pass",()=>{
 const irregular=[.25,.96,1.84,2.76,3.98];
 assert.equal(engine.measuredBeatJoinCandidate(
  a,irregular,0,1,100,101,100.25),null);
 assert.equal(engine.measuredBeatJoinCandidate(
  a,b,0,1.20,100,101,100.25),null);
 assert.equal(engine.measuredBeatJoinCandidate(
  [100,100.5],b,0,1,100,101,100.25),null);
 assert.equal(engine.measuredBeatJoinCandidate(
  a,[.25,.75],0,1,100,101,100.25),null);
});
test("full-band promotion requires direct PCM beats plus unchanged vocal/harmonic checks",()=>{
 const early=js.slice(js.indexOf("function earlyMatchedBar("),
   js.indexOf("function rhythmicReleaseBeatBridge("));
 assert.match(early,/const reliableLocalGrid=measuredLocalBeatGrid\(/);
 assert.match(early,/observedPlacement=reliableLocalGrid\?measuredBeatJoinCandidate\(/);
 assert.match(early,/observedFit\.verified>=4/);
 assert.match(early,/observedFit\.ratio>=\.90/);
 assert.match(early,/observedFit\.rms<=\.055/);
 assert.match(early,/notes\.focused>=\.86/);
 assert.match(early,/drums\.correlation>=\.55/);
 assert.match(early,/if\(reliableLocalGrid&&!observedPlacement\)continue/);
 assert.match(early,/voiceConfirmed/);
 assert.match(early,/incomingVoiceAfter>=fade\+\.65/);
 assert.match(early,/barAccents\?\.reliable&&barAccents\.score<\.62/);
 assert.match(early,/measuredBeatPlacement:!!observedPlacement/);
});
test("phase alignment stays a low-band preview, never a fake full-band beat certificate",()=>{
 const block=js.slice(end,js.indexOf("function adaptiveUnderlayLevel(",end));
 assert.match(block,/measuredBeatPlacement:best\.measuredBeatPlacement/);
 assert.match(block,/drumOnlyUnderlay:true,preserveTail:true/);
 assert.match(block,/quietCertified:false/);
 assert.match(block,/placed\?\.fit\?\.ratio>=\.85/);
 assert.doesNotMatch(block,/voiceConfirmedUnderlay:true/);
});

test("3.5 percent rhythm adjustment needs both PCM grids and cannot certify full-band music",()=>{
 const from=js.indexOf("function measuredTempoRelation(");
 const to=js.indexOf("function measuredLocalBeatGrid(",from);
 assert.ok(from>0&&to>from);
 const relation=new Function(js.slice(from,to)+"return measuredTempoRelation;")();
 const a={bpm:120,beatGrid:{reliable:true},outroOnsetWindows:[{start:90}]};
 const b={bpm:116.1,beatGrid:{reliable:true},introBeatTimes:[.5,1,1.5,2,2.5,3]};
 const yes=relation(a,b);
 assert.ok(yes&&yes.ratio>1.025&&yes.ratio<1.035);
 assert.equal(relation({...a,beatGrid:{reliable:false}},b),null);
 assert.equal(relation(a,{...b,introBeatTimes:[]}),null);
 assert.equal(relation(a,{...b,bpm:114}),null,"tempo correction above 3.5% remains blocked");
 const portion=js.slice(js.indexOf("function measuredWindowRhythmUnderlay("),
  js.indexOf("function adaptiveUnderlayLevel("));
 assert.match(portion,/widerTempo&&\(!placed\|\|placed\.fit\.verified<4/);
 assert.match(portion,/placed\.fit\.ratio<\.90\|\|placed\.fit\.rms>\.06/);
 assert.match(portion,/drumOnlyUnderlay:true,preserveTail:true/);
 assert.match(portion,/quietCertified:false/);
});

test("live full-band mix cancels decoder drift smaller than the continuity watchdog",()=>{
 const phaseCode=js.slice(js.indexOf("function djBeatPhaseError("),js.indexOf("function djSoftFocusEnvelope("));
 const clockCode=js.slice(js.indexOf("function djAudioClockProgress("),js.indexOf("function desktopBeatStartDelay("));
 const fadeCode=js.slice(js.indexOf("  function fadeStep(){"),js.indexOf("  fadeStep();",js.indexOf("  function fadeStep(){")));
 function fixture(measured){
  const old={currentTime:100.5,paused:false,readyState:4,volume:1};
  const upcoming={currentTime:.5,readyState:4,volume:0};
  const act={oldAudioAt:100,newAudioAt:0,tempo:1,fade:8,kind:"beat",end:108};
  const proposed={measuredBeatBridge:measured,beatPeriod:.5,beatAnchor:100,nextBeat:0,entry:0,tempo:1};
  const app={audio:()=>old,currentId:()=>"old",mixNext:()=>({id:"next"}),volume:()=>.8};
  const pending=[];
  const build=new Function("old","upcoming","act","proposed","app","setTimeout",`
   const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
   let active=act,plan=proposed,cancelled=false;
   const id="old",song={id:"next"},window={},mixFailures=new Map();
   const cancel=()=>{cancelled=true;active=null},handoff=()=>{};
   const mixCurve=()=>({outGain:1,inGain:.1});
   ${phaseCode}\n${clockCode}\n${fadeCode}
   return {step:fadeStep,cancelled:()=>cancelled};
  `);
  return {old,upcoming,pending,api:build(old,upcoming,act,proposed,app,fn=>pending.push(fn))};
 }
 const f=fixture(true);
 f.api.step();assert.equal(f.api.cancelled(),false);
 f.old.currentTime+=.3;f.upcoming.currentTime+=.12;
 f.pending.shift()();assert.equal(f.api.cancelled(),true,
  "180ms decoder drift must not continue as a certified beatmatch");
 const aligned=fixture(true);
 aligned.api.step();aligned.old.currentTime+=.3;aligned.upcoming.currentTime+=.3;
 aligned.pending.shift()();assert.equal(aligned.api.cancelled(),false);
 const neutral=fixture(false);
 neutral.api.step();neutral.old.currentTime+=.3;neutral.upcoming.currentTime+=.12;
 neutral.pending.shift()();assert.equal(neutral.api.cancelled(),false,
  "a neutral fade does not require matching drum phase");
});
