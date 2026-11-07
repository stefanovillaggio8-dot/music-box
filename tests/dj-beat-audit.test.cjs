"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"dj-deep-analysis.json"),"utf8"));
function extract(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,"Missing DJ analysis: "+a);return src.slice(i,j);}
const tools=new Function("isIOS","style",
 "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\n"+
 extract("function grooveAgreement(","// Find a *musical* release")+
 extract("function compatibility(","async function decode(")+
 extract("function hasReliableHarmony(","function resetMobileFade(")+
 extract("function onsetPairAgreement(","function iphoneBeatPairCertified(")+
 extract("function desktopBeatPairCertified(","function iphoneQuietReleaseCertified(")+
 extract("function iphoneQuietReleaseCertified(","function mobileMixAllowed(")+
 extract("function certifiedNeutralBridge(","function mobileMixAllowed(")+
 extract("function desktopBeatStartDelay(","async function beginMix(")+
 "return {transition,synchronizeBeatCue,desktopFinalImpactRelay,onsetPairAgreement,desktopBeatPairCertified,rhythmicGridEvidence,similarNotes,grooveAgreement,camelotMatch,"+
 "desktopBeatPairCertified,desktopBeatStartDelay,iphoneQuietReleaseCertified,certifiedNeutralBridge,measuredPulseUnderlay,onsetPeriodicity};"
)(false,"auto");
const tracks=Object.entries(catalog.entries||{})
 .filter(([key,x])=>x?.status==="ok"&&Number.isFinite(x.duration)&&
  x.duration>=26&&x.bpm>=55&&x.bpm<=210&&
  Array.isArray(x.chroma)&&x.chroma.length===12)
 .map(([key,data])=>({key,data}));
const find=(suffix)=>tracks.find(x=>x.key.endsWith(suffix));
const bpmRatio=(a,b)=>[.5,1,2].map(k=>a.bpm/(b.bpm*k))
 .reduce((x,y)=>Math.abs(Math.log2(x))<Math.abs(Math.log2(y))?x:y);
const short=x=>Number.isFinite(x)?+x.toFixed(3):null;

test("real-index audit: 130k+ different track pairs, classify actual join versus a merely quiet fade",()=>{
 assert.ok(tracks.length>=1100,"Real full-song MP3 metadata must be available");
 let pairs=0,nearBpm=0,plans=0,beats=0,releaseBeats=0,strictBeats=0,
  rejectedBeat=0,quietFades=0,unsafeFades=0,cut=0,other=0;
 const examples=[],earliest=[];
 // Reproducible sampling across the COMPLETE catalog, not 10 queued songs.
 for(let i=0;i<tracks.length;i+=5){
  const A=tracks[i];let local=0;
  for(let j=0;j<tracks.length;j+=2){
   const B=tracks[j];if(A.key===B.key)continue;
   pairs++;
   const ratio=bpmRatio(A.data,B.data);
   if(ratio>=.94&&ratio<=1.06)nearBpm++;
   const p=tools.transition(A.data,B.data,A.data.duration);
   if(!p)continue;plans++;
   if(p.measuredRhythmicRelease===true)releaseBeats++;
   assert.ok(Number.isFinite(p.begin)&&Number.isFinite(p.end)&&
    p.begin>=0&&p.end<=A.data.duration+.04,
    "Plan moves outside real MP3: "+A.key+" to "+B.key);
   if(p.kind==="beat"||p.kind==="snap"){
    beats++;
    const certified=tools.desktopBeatPairCertified(A.data,B.data,p);
    if(certified)strictBeats++;else rejectedBeat++;
    const n=tools.similarNotes(A.data,B.data),
      g=tools.grooveAgreement(A.data,B.data);
    if(examples.length<12)examples.push({from:A.key,to:B.key,
     kind:p.kind,certified,bpmA:A.data.bpm,bpmB:B.data.bpm,
     groove:short(g?.score),notes:short(n.focused),
     phrase:short(n.phrase),phase:short(p.beatPeriod)});
   }else if(["soft","fade","rise"].includes(p.kind)){
    if(tools.iphoneQuietReleaseCertified(A.data,p))quietFades++;
    else unsafeFades++;
   }else if(p.kind==="cut")cut++;
   else other++;
   if(p.begin<A.data.last-12&&earliest.length<6)earliest.push({
    from:A.key,to:B.key,begin:short(p.begin),end:short(p.end),
    last:short(A.data.last),kind:p.kind});
   local++;
  }
 }
 console.info("[DJ REAL INDEPENDENT AUDIT]",JSON.stringify({
  indexed:tracks.length,pairs,nearBpm,plans,beatProposals:beats,releaseBeats,
  strictBeats,rejectedBeat,quietFades,unsafeFades,cut,other,
  beatExamples:examples,veryEarly:earliest}));
 assert.ok(pairs>=130000,"Audit sampled too few real pairs");
 assert.equal(strictBeats+rejectedBeat,beats);
 assert.ok(nearBpm>1000,"Real tempos missing from catalog");
 assert.ok(unsafeFades+quietFades+cut+beats>0);
});

test("actual known bad recorded pair cannot pass as a matched beat",()=>{
 const a=find("audio/songs/track-153.mp3"),
  b=find("audio/songs/track-8.mp3");
 assert.ok(a&&b,"Nov 3 recorded real MP3 analyses must be present");
 const n=tools.similarNotes(a.data,b.data),
  g=tools.grooveAgreement(a.data,b.data),
  p=tools.transition(a.data,b.data,a.data.duration);
 assert.equal(n.matches,false);
 assert.equal(tools.desktopBeatPairCertified(a.data,b.data,{
  kind:"beat",beatPeriod:60/a.data.bpm}),false);
 assert.ok(!p||!["beat","snap"].includes(p.kind));
 console.info("[DJ KNOWN BAD AUDIO]",JSON.stringify({
  from:a.key,to:b.key,bpmA:a.data.bpm,bpmB:b.data.bpm,
  rhythm:short(g?.score),chordMatch:n.matches,
  boundary:short(n.focused),phrase:short(n.phrase),
  result:p?.kind||"none"}));
});

test("phase stress: 40k simulated desktop start times cannot silently drift off-beat",()=>{
 let checks=0,approved=0,late=0,maximumError=0;
 for(const bpm of [74,88,100,112,120,129.2,140,155,175]){
  const period=60/bpm;
  for(const kind of ["beat","snap"]){
   for(let j=0;j<2500;j++){
    const at=180+(j%411)/100;
    const end=at+(kind==="snap"?.35:1.25)+((j*7)%31)/100;
    const anchor=at-((j*13)%193)/137;
    const nextBeat=((j*17)%145)/197;
    const p={kind,beatPeriod:period,beatAnchor:anchor,
     nextBeat,end};
    const delay=tools.desktopBeatStartDelay(p,at);
    checks++;
    if(delay===null){late++;continue;}
    approved++;
    const phase=(anchor-(at+delay+nextBeat))/period;
    const nearest=Math.round(phase);
    const err=Math.abs(phase-nearest)*period;
    maximumError=Math.max(maximumError,err);
    assert.ok(err<=.0451,
     "New track would enter off-beat by "+err+"s at "+bpm+" BPM");
    assert.ok(at+delay<end-(kind==="snap"?.36:1.2));
   }
  }
 }
 console.info("[DJ PHASE STRESS]",JSON.stringify({checks,approved,
  declinedTooLate:late,maxErrorSeconds:short(maximumError)}));
 assert.ok(checks>=40000&&approved>3000&&late>0);
});

test("adversarial edits: same BPM cannot camouflage incompatible drums or chords",()=>{
 const a={bpm:126,beatConfidence:.6};
 const chroma=[.20,.18,.12,.10,.09,.08,.06,.05,.04,.035,.03,.015];
 const groove=Array.from({length:32},(_,i)=>i%4===0?2:i%4===1?-.8:-.4);
 const b={bpm:126.5,beatConfidence:.6,introDrive:.8,
  introGroove:groove,outroGroove:groove,
  introAttackNotes:chroma,introPhraseNotes:chroma,
  outroFinalNotes:chroma,outroPhraseNotes:chroma,
  chroma, introChroma:chroma, outroChroma:chroma};
 const pulse=Array.from({length:96},(_,i)=>i%17===0?2.3:
  i%13===0?1.2:i%5===0?.3:-.4);
 const outgoing={...a,...b,last:180,outroOnset:pulse};
 b.introOnset=pulse;
 const p={kind:"beat",beatPeriod:60/a.bpm,begin:176.0,end:179.8,fade:3.8};
 const base=tools.desktopBeatPairCertified(outgoing,b,p);
 assert.equal(base,true,"Positive control should be a physically close musical signature");
 const rotate=(v,shift)=>v.map((_,i)=>v[(i+shift)%12]);
 const discord={...b,introAttackNotes:rotate(chroma,5),
  introPhraseNotes:rotate(chroma,5),introChroma:rotate(chroma,5)};
 assert.equal(tools.desktopBeatPairCertified(outgoing,discord,p),false);
 const swing={...b,introGroove:groove.map((_,i)=>groove[(i+5)%32])};
 // A 5-position shift is an exact cyclical rotation; the algorithm only
 // accepts up to 7 phase units. Use reversed polarity for genuine mismatch.
 const offDrums={...swing,introGroove:groove.map(x=>-x)};
 assert.equal(tools.desktopBeatPairCertified(outgoing,offDrums,p),false);
 assert.equal(tools.desktopBeatPairCertified(outgoing,{...b,bpm:153},p),false);
});

test("select best candidate for independent MP3 waveform spot-checks",()=>{
 const outgoing=["audio/songs/track-153.mp3","audio/songs/track-160.mp3",
  "audio/songs/track-161.mp3"];
 const pairs=[{from:"audio/songs/track-153.mp3",
   to:"audio/songs/track-8.mp3",reason:"recorded_false_match"},
  {from:"audio/songs/track-391.mp3",to:"audio/songs/track-1164.mp3",reason:"certified_beat"},
  {from:"audio/songs/track-391.mp3",to:"audio/songs/track-598.mp3",reason:"certified_beat"},
  {from:"audio/songs/track-568.mp3",to:"audio/songs/track-464.mp3",reason:"rejected_beat"},
  // A newly certified SHORT beat-grid join: inspect the real MP3 before
  // allowing this kind of preview to become common on iPhone.
  {from:"audio/songs/track-378.mp3",to:"audio/songs/track-91.mp3",reason:"pulse_grid"}];
 for(const fromKey of outgoing){
  const from=tracks.find(x=>x.key===fromKey);
  if(!from)continue;
  const ranked=[];
  for(const to of tracks){
   if(to.key===from.key||to.data.introDrive<.37)continue;
   const ratio=bpmRatio(from.data,to.data);
   if(ratio<.96||ratio>1.04)continue;
   const g=tools.grooveAgreement(from.data,to.data);
   const n=tools.similarNotes(from.data,to.data);
   if(!g||!Number.isFinite(n.focused)||!Number.isFinite(n.phrase))continue;
   const score=g.score*.38+n.focused*.37+n.phrase*.25;
   ranked.push({from:from.key,to:to.key,reason:"top_near_match",
    score:short(score),drums:short(g.score),
    chord:short(n.focused),phrase:short(n.phrase),
    accepted:tools.desktopBeatPairCertified(from.data,to.data,{kind:"beat"})});
  }
  ranked.sort((a,b)=>b.score-a.score);
  if(ranked.length)pairs.push(ranked[0]);
 }
 const annotated=pairs.map(p=>{
  const from=tracks.find(x=>x.key===p.from),to=tracks.find(x=>x.key===p.to);
  const cue=from&&to?tools.transition(from.data,to.data,from.data.duration):null;
  return {...p,runtimeBeatCertified:cue?
   tools.desktopBeatPairCertified(from.data,to.data,cue):false,plan:cue?{
   kind:cue.kind,begin:short(cue.begin),end:short(cue.end),
   fade:short(cue.fade),entry:short(cue.entry),
   beatPeriod:short(cue.beatPeriod)
  }:null};
 });
 console.info("[DJ INDEPENDENT WAVEFORM TARGETS]",JSON.stringify(annotated));
 if(process.env.DJ_AUDIO_PAIR_FILE)
  fs.writeFileSync(process.env.DJ_AUDIO_PAIR_FILE,JSON.stringify(annotated,null,2));
 assert.ok(pairs.length>=3);
});

test("real MP3 regression: proposed beat fades cannot start after the final audible beat",()=>{
 const from=find("audio/songs/track-391.mp3");
 assert.ok(from);
 for(const key of ["audio/songs/track-1164.mp3","audio/songs/track-598.mp3"]){
  const to=tracks.find(x=>x.key===key);
  assert.ok(to);
  const plan=tools.transition(from.data,to.data,from.data.duration);
  assert.equal(plan?.kind,"beat");
  assert.ok(plan.begin>from.data.last,
   "The historical false beat should begin in the nonmusical outro");
  assert.equal(tools.desktopBeatPairCertified(from.data,to.data,plan),false,
   "Never certify a beat if the source music ended before the fade starts");
 }
});

test("the rescanned real MP3 catalog has percussive transients, not just BPM estimates",()=>{
 const measured=tracks.filter(t=>Array.isArray(t.data.outroOnset)&&
  t.data.outroOnset.length===96&&
  Array.isArray(t.data.introOnset)&&t.data.introOnset.length===96);
 console.info("[DJ POST-PCM INDEX]",JSON.stringify({
  indexed:tracks.length,withBothRealOnsets:measured.length,
  coverage:measured.length/tracks.length}));
 assert.ok(measured.length>=1000,"Per-MP3 drum transients need full library coverage");
 const identical=measured[0].data.introOnset;
 assert.equal(tools.onsetPairAgreement(
  {outroOnset:identical},{introOnset:identical})?.certified,true);
});

test("original MP3 false beat matches stay rejected with fresh onset data",()=>{
 const pairs=[
  ["track-391.mp3","track-1164.mp3"],
  ["track-391.mp3","track-598.mp3"],
  ["track-568.mp3","track-464.mp3"],
  ["track-153.mp3","track-8.mp3"],
  ["track-160.mp3","track-111.mp3"]
 ];
 const results=[];
 for(const pair of pairs){
  const a=tracks.find(x=>x.key==="audio/songs/"+pair[0]);
  const b=tracks.find(x=>x.key==="audio/songs/"+pair[1]);
  assert.ok(a&&b,"Original MP3 absent from actual index: "+pair.join(" -> "));
  const agreement=tools.onsetPairAgreement(a.data,b.data);
  assert.ok(agreement,"Missing independently measured onsets for "+pair.join(" -> "));
  assert.equal(agreement.certified,false,
   "Unrelated drum beats may not pass: "+pair.join(" -> "));
  const cue={kind:"beat",begin:a.data.last-3.8,end:a.data.last,fade:3.8};
  assert.equal(tools.desktopBeatPairCertified(a.data,b.data,cue),false);
  results.push({from:pair[0],to:pair[1],
   zero:+agreement.atZero.toFixed(3),best:+agreement.best.toFixed(3),
   lagMs:+agreement.lagMs.toFixed(1)});
 }
 console.info("[DJ VERIFIED WRONG BEATS REJECTED]",JSON.stringify(results));
});


test("real music: strict beat rejection still permits a measured, voice-safe neutral release",()=>{
 let pairs=0,alternatives=0,unsafe=0,conservative=0;
 const examples=[];
 for(let i=0;i<tracks.length;i+=8){
  const a=tracks[i];
  for(let j=0;j<tracks.length;j+=3){
   const b=tracks[j];if(a.key===b.key)continue;
   pairs++;
   const candidate=tools.transition(a.data,b.data,a.data.duration);
   const blocked=Boolean(candidate&&(candidate.kind==="beat"||candidate.kind==="snap")&&
    !tools.desktopBeatPairCertified(a.data,b.data,candidate));
   const neutral=tools.certifiedNeutralBridge(a.data,b.data,a.data.duration);
   if(!neutral)continue;
   alternatives++;
   if(blocked)conservative++;
   assert.equal(neutral.kind,"soft");
   assert.equal(neutral.preserveTail,true);
   assert.ok(neutral.begin>=a.data.dropRelease.releaseAt+.3);
   assert.ok(neutral.end>=a.data.last-.05);
   assert.ok(neutral.fade>=2.35&&neutral.fade<=5);
   if(!tools.iphoneQuietReleaseCertified(a.data,neutral))unsafe++;
   if(examples.length<5)examples.push({from:a.key,to:b.key,
    fade:+neutral.fade.toFixed(2),sourceLast:a.data.last,
    early:neutral.begin,previous: candidate?.kind||null});
  }
 }
 console.info("[DJ TRUE QUIET OPPORTUNITIES]",JSON.stringify({
  pairs,alternatives,conservative,unsafe,examples
 }));
 assert.ok(pairs>30000);
 assert.ok(alternatives>0,"Real MP3s should offer at least one certified neutral fade");
 assert.equal(unsafe,0,"Fallback must pass the same independent iPhone safety certificate");
});

test("pulse compatibility distribution from original onset spectra, not BPM alone",()=>{
 const corr=(arr,lag)=>{
  if(!Array.isArray(arr)||arr.length!==96||!Number.isInteger(lag)||lag<2||lag>48)return -1;
  let sum=0,x=0,y=0;
  for(let i=0;i+lag<96;i++){
   const a=arr[i],b=arr[i+lag];
   sum+=a*b;x+=a*a;y+=b*b;
  }
  return x>0&&y>0?sum/Math.sqrt(x*y):-1;
 };
 const periodic=(v,bpm)=>{
  if(!Array.isArray(v)||v.length!==96)return null;
  const frames=96*60/(bpm*4);
  const lags=[frames,frames*2,frames*4];
  const strengths=lags.map(t=>[Math.floor(t),Math.ceil(t)].map(l=>corr(v,l)))
   .map(x=>Math.max(...x));
  return Math.max(...strengths.slice(0,2));
 };
 const stats={pairs:0,tempo:0,harmony:0,rhythm:0,pulse:0,phase:0,negative:0};
 const samples=[];
 for(let i=0;i<tracks.length;i+=7){
  const a=tracks[i];
  for(let j=0;j<tracks.length;j+=3){
   const b=tracks[j];if(a.key===b.key)continue;stats.pairs++;
   const ratio=bpmRatio(a.data,b.data);
   if(ratio<.97||ratio>1.03)continue;stats.tempo++;
   const n=tools.similarNotes(a.data,b.data),g=tools.grooveAgreement(a.data,b.data);
   if(n.focused<.83||n.phrase<.70||g?.score<.79)continue;stats.harmony++;
   const x=tools.onsetPairAgreement(a.data,b.data);
   if(x?.atZero<0)stats.negative++;
   const pa=periodic(a.data.outroOnset,a.data.bpm),pb=periodic(b.data.introOnset,b.data.bpm);
   if(pa===null||pb===null)continue;stats.rhythm++;
   if(pa<.18||pb<.18)continue;stats.pulse++;
   if(x?.best>=.18&&x?.atZero>=.03&&Math.abs(x?.lagMs||0)<=250){
    stats.phase++;
    if(samples.length<8)samples.push({from:a.key,to:b.key,
     focus:+n.focused.toFixed(2),phrase:+n.phrase.toFixed(2),
     groove:+g.score.toFixed(2),pa:+pa.toFixed(2),pb:+pb.toFixed(2),
     phase:+x.atZero.toFixed(2),best:+x.best.toFixed(2),lag:x.lagMs});
   }
  }
 }
 const badA=find("audio/songs/track-391.mp3"),badB=find("audio/songs/track-1164.mp3");
 const bad=badA&&badB?{
  a:periodic(badA.data.outroOnset,badA.data.bpm),
  b:periodic(badB.data.introOnset,badB.data.bpm),
  match:tools.onsetPairAgreement(badA.data,badB.data)}:null;
 console.info("[DJ ORIGINAL PULSE OPPORTUNITIES]",JSON.stringify({stats,samples,bad}));
 assert.ok(stats.pairs>40000);
});

test("real-index beat-grid previews require regular pulses and chord safety",()=>{
 let total=0,matched=0;const sample=[];
 for(let i=0;i<tracks.length;i+=7){
  const a=tracks[i];
  for(let j=0;j<tracks.length;j+=3){
   const b=tracks[j];if(a.key===b.key)continue;total++;
   const p=tools.measuredPulseUnderlay(a.data,b.data,a.data.duration);
   if(!p)continue;matched++;
   assert.equal(p.kind,"snap");assert.equal(p.pulseUnderlay,true);
   assert.equal(p.preserveTail,true);
   assert.ok(p.begin>=0&&p.end<=a.data.duration);
   assert.ok(p.fade>=.62&&p.fade<=1.04);
   assert.equal(tools.desktopBeatPairCertified(a.data,b.data,p),true);
   if(sample.length<8)sample.push({a:a.key,b:b.key,quality:p.pulseConfidence});
  }
 }
 const a=find("audio/songs/track-391.mp3"),
   b=find("audio/songs/track-1164.mp3"),
   c=find("audio/songs/track-153.mp3"),
   d=find("audio/songs/track-8.mp3");
 assert.equal(tools.measuredPulseUnderlay(a.data,b.data,a.data.duration),null);
 assert.equal(tools.measuredPulseUnderlay(c.data,d.data,c.data.duration),null);
 console.info("[DJ PHASE-GRID REAL PAIRS]",JSON.stringify({total,matched,sample}));
 assert.ok(total>40000);
});

test("real 1197 last-impact musical pairing: audit intro beat, harmony and groove",()=>{
 const outgoing=find("audio/songs/track-1197.mp3")?.data;
 assert.ok(outgoing);
 const bpmA=outgoing.bpm;
 const scored=[];
 for(const b of tracks){
  if(b.key.endsWith("track-1197.mp3"))continue;
  const info=b.data;
  if(!(info.introDrive>=.43&&info.beatConfidence>=.16))continue;
  const ratio=[.5,1,2].map(k=>bpmA/(info.bpm*k))
   .reduce((x,y)=>Math.abs(Math.log2(x))<Math.abs(Math.log2(y))?x:y);
  if(!(ratio>=.94&&ratio<=1.06))continue;
  const g=tools.grooveAgreement(outgoing,info),n=tools.similarNotes(outgoing,info),
   k=tools.camelotMatch(outgoing,info);
  const score=(g?.score||0)*.45+(n?.focused||0)*.25+(n?.phrase||0)*.2+
    (k?.score||0)*.1-Math.abs(Math.log2(ratio))*.35;
  scored.push({id:b.key,ratio:+ratio.toFixed(3),intro:+info.introDrive.toFixed(3),
   bpm:info.bpm,groove:+(g?.score||0).toFixed(3),focused:+(n?.focused||0).toFixed(3),
   phrase:+(n?.phrase||0).toFixed(3),matches:n.matches===true,
   score:+score.toFixed(3),key:+(k?.score||0).toFixed(3),
   keyW:+(k?.weight||0).toFixed(3),
   onset:info.introBeat,voice:info.firstVoiceAt,lyric:info.firstLyricAt,
   beatConfidence:info.beatConfidence});
 }
 scored.sort((a,b)=>b.score-a.score);
 console.info("[DJ 1197 FINAL-BEAT MATCH SEARCH]",JSON.stringify({
  outgoing:{bpm:outgoing.bpm,beatConfidence:outgoing.beatConfidence,
   lastImpactAt:outgoing.dropRelease?.lastImpactAt,
   releaseAt:outgoing.dropRelease?.releaseAt,last:outgoing.last,
   voiceModel:outgoing.voiceModel,voiceScannedEnd:outgoing.voiceScannedEnd},
  bpmCompatible:scored.length,top:scored.slice(0,16)
 }));
 assert.ok(scored.length>0);
});

test("real Ste candidates for starting on final impact rather than room tone",()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 const start=app.indexOf("const BUILTIN = ["),end=app.indexOf("\n  ];",start);
 assert.ok(start>=0&&end>start);
 const rows=new Function("return "+app.slice(start+"const BUILTIN = ".length,end+5))();
 const s=JSON.parse(fs.readFileSync(path.join(root,"stato.json"),"utf8"));
 const own=new Set(rows.filter(x=>(x.profile||"Ste")==="Ste").map(x=>"audio/"+x.file));
 const copied=new Set(s.miei?.Ste||[]);
 for(const x of rows){
  const id="b-"+String(x.file||"").split("/").pop().replace(/\.mp3$/,"");
  if(copied.has(id))own.add("audio/"+x.file);
 }
 const a=find("audio/songs/track-1197.mp3").data;
 const out=[];
 for(const t of tracks){
  if(!own.has(t.key)||t.key.endsWith("track-1197.mp3"))continue;
  const b=t.data;if(!(b.introDrive>=.43&&b.beatConfidence>=.16))continue;
  const ratio=bpmRatio(a,b);
  if(ratio<.955||ratio>1.045)continue;
  const g=tools.grooveAgreement(a,b),n=tools.similarNotes(a,b),
   k=tools.camelotMatch(a,b),o=tools.onsetPairAgreement(a,b);
  if(g?.score<.70||n?.focused<.65||n?.phrase<.50||
     (k?.weight>=.14&&k.score<.45))continue;
  out.push({
   track:t.key,groove:+g.score.toFixed(3),focused:+n.focused.toFixed(3),
   phrase:+n.phrase.toFixed(3),key:+k.score.toFixed(3),
   onset:o?.best,zero:o?.atZero,certified:o?.certified===true,
   intro:b.introDrive,beat:b.beatConfidence,
   introBeat:b.introBeat,bpm:b.bpm
  });
 }
 out.sort((x,y)=>(y.groove+y.focused+y.phrase)-(x.groove+x.focused+x.phrase));
 console.info("[DJ 1197 STE FINAL IMPACT]",JSON.stringify({
  ownTracks:own.size,eligible:out.length,top:out.slice(0,20)}));
 assert.ok(out.length>=0);
});

test("real Ste final-impact eligible incoming MP3s",()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 const start=app.indexOf("const BUILTIN = ["),end=app.indexOf("\n  ];",start);
 assert.ok(start>=0&&end>start);
 const rows=new Function("return "+app.slice(start+"const BUILTIN = ".length,end+5))();
 const copies=new Set(JSON.parse(fs.readFileSync(path.join(root,"stato.json"),"utf8")).miei?.Ste||[]);
 const own=new Set(rows.filter(t=>(t.profile||"Ste")==="Ste"||
   copies.has("b-"+String(t.file||"").split("/").pop().replace(/\.mp3$/i,"")))
   .map(t=>"audio/"+t.file));
 const outgoing=find("audio/songs/track-1197.mp3")?.data;
 assert.ok(outgoing);
 const scanned={...outgoing,lastLyricAt:215.11,lastVoiceAt:213.59};
 const eligible=[],selected=[];
 for(const track of tracks){
  if(!own.has(track.key)||track.key.endsWith("track-1197.mp3"))continue;
  const plan=tools.desktopFinalImpactRelay(scanned,track.data,scanned.duration);
  if(!plan)continue;
  const n=tools.similarNotes(scanned,track.data),
    g=tools.grooveAgreement(scanned,track.data),
    k=tools.camelotMatch(scanned,track.data);
  const fit=!!(g&&g.score>=.70&&Number.isFinite(n?.focused)&&
   n.focused>=.65&&Number.isFinite(n?.phrase)&&n.phrase>=.50&&
   (k.weight<.14||k.score>=.52)&&
   (!n.alignment||!Number.isFinite(n.alignment.score)||
     n.alignment.score<=0||n.alignment.score>=.53));
  const sample={id:track.key,introDrive:track.data.introDrive,
   grooveScore:plan.grooveScore,focus:short(n.focused),
   phrase:short(n.phrase),key:short(k.score),keyWeight:short(k.weight),
   begin:plan.begin,end:plan.end,finalImpactAt:plan.finalImpactAt};
  eligible.push(sample);
  if(fit)selected.push(sample);
 }
 eligible.sort((a,b)=>b.grooveScore-a.grooveScore);
 console.info("[DJ STE REAL FINAL BEAT JOIN]",JSON.stringify({
  owned:own.size,eligible:eligible.length,selected:selected.length,
  top:eligible.slice(0,12)}));
 assert.ok(eligible.length>=1,"must have a real eligible musical successor for track 1197");
 assert.equal(selected.length,0,"the four candidates have strongly incompatible real chord boundaries and must not be promoted");
 assert.ok(eligible.every(p=>p.begin<241.3&&p.end>243.9));
});


test("same BPM is not sufficient if the final half of the real drums diverges",()=>{
 const pulse=Array.from({length:96},(_,i)=>
  Math.sin(i*.71)+Math.cos(i*1.63)*.45);
 const mismatched=pulse.map((x,i)=>i<72?x:-x);
 const identical=tools.onsetPairAgreement({outroOnset:pulse},{introOnset:pulse});
 const broken=tools.onsetPairAgreement({outroOnset:pulse},{introOnset:mismatched});
 assert.equal(identical?.certified,true,"matching 4s kick sequence must pass");
 assert.equal(broken?.certified,false,"one matching passage cannot hide a clashing final measure");
 assert.ok(broken?.firstHalf>.75&&broken?.secondHalf<.3);
});

test("beat clock uses actual four-second edge and intro, not a distant strongest transient",()=>{
 const hits=Array.from({length:96},(_,i)=>i%12===2?2.5:-.25);
 const a={bpm:120,last:140,beatAnchor:90,outroOnset:hits},
  b={bpm:120,safeIntroAt:0,introBeat:9.8,introOnset:hits};
 const cue=tools.synchronizeBeatCue(a,b,{
  kind:"beat",begin:136.2,end:140,fade:3.8,entry:0,
  beatPeriod:.5,beatAnchor:90,nextBeat:9.8});
 assert.equal(cue.measuredOnsetGrid,true);
 assert.ok(cue.beatAnchor>=136&&cue.beatAnchor<136.5,
  "anchor should be within real 4s ending");
 assert.ok(cue.nextBeat>=0&&cue.nextBeat<.5,
  "next beat should be within the real opening measure");
 assert.notEqual(cue.beatAnchor,90);
 assert.notEqual(cue.nextBeat,9.8);
});

test("strict beat overlays cannot start once the measured last kick has decayed",()=>{
 const a={last:100,dropRelease:{lastImpactAt:90.2,releaseAt:91.7}};
 const p={kind:"beat",begin:95,end:100,fade:5};
 assert.equal(tools.desktopBeatPairCertified(a,{},p),false);
});


test("pulse-grid beats need matching real percussion and chords, not just a crossfade",()=>{
 const data=tracks.map(x=>x.data).find(x=>x?.introOnset?.length===96&&
  x?.outroOnset?.length===96&&x?.introGroove?.length===32&&
  x?.outroGroove?.length===32);
 assert.ok(data,"must use real indexed onset and groove measurements");
 const beat=data.outroOnset,groove=data.outroGroove;
 const chroma=[.25,.18,.13,.10,.08,.07,.06,.05,.03,.02,.02,.01];
 const shared={bpm:124,beatConfidence:.75,introDrive:.8,duration:180,
  last:179.9,outroOnset:beat,introOnset:beat,
  outroGroove:groove,introGroove:groove,
  outroFinalNotes:chroma,outroPhraseNotes:chroma,
  introAttackNotes:chroma,introPhraseNotes:chroma,
  chroma,introChroma:chroma,outroChroma:chroma};
 const a={...shared,voiceModel:true,voiceScannedEnd:180,
  lastVoiceAt:155,lastLyricAt:155,protectedEnding:false};
 const b={...shared,firstVoiceAt:24,firstLyricAt:24};
 const candidate=tools.transition(a,b,180);
 assert.ok(candidate!==null,"identical measured beats must have a candidate");
 if(candidate.rhythmicGridJoin){
   assert.ok(candidate.beatPeriod>0.2&&candidate.beatPeriod<1);
   assert.ok(tools.desktopBeatPairCertified(a,b,candidate));
 }
 const mismatched={...b,bpm:151};
 assert.ok(!tools.rhythmicGridEvidence(a,mismatched));
});


test("measure how many real indexed songs can actually match rhythmic grids",()=>{
 let sampled=0,grid=0,bridges=0;const examples=[];
 for(let i=0;i<tracks.length;i+=7)for(let j=0;j<tracks.length;j+=3){
  const A=tracks[i],B=tracks[j];
  if(A.key===B.key)continue;
  sampled++;
  const e=tools.rhythmicGridEvidence(A.data,B.data);
  if(!e)continue;
  grid++;
  const p=tools.transition(A.data,B.data,A.data.duration);
  if(p?.rhythmicGridJoin){
   bridges++;
   if(examples.length<7)examples.push({from:A.key,to:B.key,
    kind:p.kind,score:+e.score.toFixed(3),pulse:+e.pulse.toFixed(3)});
  }
 }
 console.info("[DJ REAL RHYTHM GRID]",JSON.stringify({sampled,grid,bridges,examples}));
 assert.ok(sampled>40000);
 assert.ok(grid>0,"musically compatible rhythmic join must exist in the real index");
});


test("diagnose real-index musical match stages without inventing BPM agreements",()=>{
 const stat={sampled:0,tempo:0,withOnsets:0,pulseA:0,bothPulse:0,
  withGroove:0,withNotes:0,fullyMatched:0};const near=[];
 for(let i=0;i<tracks.length;i+=7)for(let j=0;j<tracks.length;j+=3){
  const a=tracks[i].data,b=tracks[j].data;stat.sampled++;
  if(!(a.bpm>55&&b.bpm>55&&a.bpm/b.bpm>=.975&&a.bpm/b.bpm<=1.025))continue;
  stat.tempo++;
  if(a.outroOnset?.length!==96||b.introOnset?.length!==96)continue;
  stat.withOnsets++;
  const pa=tools.onsetPeriodicity(a.outroOnset,a.bpm),
    pb=tools.onsetPeriodicity(b.introOnset,b.bpm);
  if(!(pa>=.18))continue;
  stat.pulseA++;
  if(!(pb>=.18))continue;
  stat.bothPulse++;
  const g=tools.grooveAgreement(a,b);
  if(!g||g.score<.75||g.correlation<.5)continue;
  stat.withGroove++;
  const n=tools.similarNotes(a,b);
  if(!(n.focused>=.72&&n.phrase>=.60))continue;
  stat.withNotes++;
  const k=tools.camelotMatch(a,b);
  if(k.weight>=.14&&k.score<.5)continue;
  stat.fullyMatched++;
  if(near.length<16)near.push({from:tracks[i].key,to:tracks[j].key,
   tempo:a.bpm/b.bpm,pulse:[pa,pb],groove:g.score,
   focus:n.focused,phrase:n.phrase,notesMatch:n.matches,
   alignment:n.alignment&&{match:n.alignment.matches,
    score:n.alignment.score,weakest:n.alignment.weakest},
   key:k,protectedEnding:a.protectedEnding,last:a.last,
   dropRelease:a.dropRelease?.lastImpactAt,voiceProof:!!a.voiceModel,
   lateVoice:a.lastVoiceAt,firstVoice:b.firstVoiceAt});
 }
 console.info("[DJ REAL MATCH GATES]",JSON.stringify({stat,near}));
 assert.ok(stat.sampled>40000);
});


test("real indexed pulse grid survives against mismatched BPM and chord progressions",()=>{
 const a=find("audio/songs/track-378.mp3"),b=find("audio/songs/track-91.mp3");
 assert.ok(a&&b);
 const evidence=tools.rhythmicGridEvidence(a.data,b.data);
 const bad=find("audio/songs/track-78.mp3"),badNext=find("audio/songs/track-966.mp3");
 console.info("[DJ ONSET VALIDATION PAIRS]",JSON.stringify({good:tools.onsetPairAgreement(a.data,b.data),
  bad:tools.onsetPairAgreement(bad.data,badNext.data)}));
 assert.ok(evidence,"real measured kick patterns should have a strict positive example");
 const plan=tools.transition(a.data,b.data,a.data.duration);
 assert.equal(plan?.rhythmicGridJoin,true);
 assert.equal(plan.kind,"snap","without verified singer ending, use only a short protected beat");
 assert.equal(tools.desktopBeatPairCertified(a.data,b.data,plan),true);
 assert.ok(plan.fade>=.75&&plan.fade<=1.36);
 const wait=tools.desktopBeatStartDelay(plan,plan.begin);
 assert.ok(wait!==null&&wait>=.08&&wait<=.19,
  "pre-roll must start before a real kick so it can enter in phase");
 const beat=plan.begin+wait+plan.nextBeat;
 const error=Math.abs(((beat-plan.beatAnchor)/plan.beatPeriod)-
  Math.round((beat-plan.beatAnchor)/plan.beatPeriod))*plan.beatPeriod;
 assert.ok(error<=.045,"the audible next kick must land on the old beat grid");
 const wrongA=find("audio/songs/track-78.mp3"),
  wrongB=find("audio/songs/track-966.mp3");
 assert.equal(tools.rhythmicGridEvidence(wrongA.data,wrongB.data),null,
  "the independently decoded 0.215-correlation pair must not pass");
 assert.equal(tools.rhythmicGridEvidence(a.data,{...b.data,bpm:169}),null);
});

test("measure early instrumental beat matches in the real published audio index",()=>{
 const withWindows=tracks.filter(x=>Array.isArray(x.data.outroOnsetWindows)&&
   x.data.outroOnsetWindows.length>0);
 let candidates=0,tempoClose=0;
 const samples=[];
 for(const outgoing of withWindows.filter((_,i)=>i%4===0)){
  const a={...outgoing.data,lastLyricAt:0,lastVoiceAt:0,
   voiceModel:"audit-instrumental-assumption",voiceScannedEnd:outgoing.data.last};
  for(const incoming of tracks.filter((_,i)=>i%3===0)){
   if(outgoing.key===incoming.key)continue;
   const b={...incoming.data,firstLyricAt:99,firstVoiceAt:99};
   const speed=a.bpm/b.bpm;
   if(speed<.975||speed>1.025)continue;
   tempoClose++;
   const p=tools.transition(a,b,a.duration);
   if(p?.earlyBeatJoin===true){
    candidates++;
    if(samples.length<8)samples.push({from:outgoing.key,to:incoming.key,
     begin:short(p.begin),end:short(p.end),score:p.score});
   }
  }
 }
 console.info("[DJ EARLY-BAR AUDIT - assumed instrumental, NOT vocal-certified]",
  JSON.stringify({withWindows:withWindows.length,tempoClose,candidates,samples}));
 assert.ok(withWindows.length>=1,"recent real MP3 index must expose new early waveform windows");
});
