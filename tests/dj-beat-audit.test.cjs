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
 extract("function desktopBeatPairCertified(","function iphoneQuietReleaseCertified(")+
 extract("function iphoneQuietReleaseCertified(","function mobileMixAllowed(")+
 extract("function desktopBeatStartDelay(","async function beginMix(")+
 "return {transition,similarNotes,grooveAgreement,camelotMatch,"+
 "desktopBeatPairCertified,desktopBeatStartDelay,iphoneQuietReleaseCertified};"
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
 let pairs=0,nearBpm=0,plans=0,beats=0,strictBeats=0,
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
  indexed:tracks.length,pairs,nearBpm,plans,beatProposals:beats,
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
 const outgoing={...a,...b};
 const p={kind:"beat",beatPeriod:60/a.bpm};
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
   to:"audio/songs/track-8.mp3",reason:"recorded_false_match"}];
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
 console.info("[DJ INDEPENDENT WAVEFORM TARGETS]",JSON.stringify(pairs));
 if(process.env.DJ_AUDIO_PAIR_FILE)
  fs.writeFileSync(process.env.DJ_AUDIO_PAIR_FILE,JSON.stringify(pairs,null,2));
 assert.ok(pairs.length>=3);
});
