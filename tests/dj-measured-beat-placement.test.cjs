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
 assert.match(early,/firstNextVoice>=fade\+\.65/);
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
