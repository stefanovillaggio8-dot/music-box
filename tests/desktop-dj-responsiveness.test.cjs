"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dj=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
function section(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,"missing "+a);return s.slice(i,j);}
test("optional desktop voice classification is limited to current track well before ending",()=>{
 const code=section(dj,"function mayScanDesktopVoice(","function scheduleDeepVoice(");
 const policy=new Function("let mixing=false,active=null;"+code+"return mayScanDesktopVoice;")();
 const media={duration:180,currentTime:20,paused:false,seeking:false};
 const bridge={currentId:()=>"a",audio:()=>media};
 assert.equal(policy(bridge,{id:"a"}),true);
 assert.equal(policy(bridge,{id:"b"}),false);
 media.currentTime=120;assert.equal(policy(bridge,{id:"a"}),false);
 media.currentTime=20;media.paused=true;assert.equal(policy(bridge,{id:"a"}),false);
 media.paused=false;media.seeking=true;assert.equal(policy(bridge,{id:"a"}),false);
});
test("heavy voice ML is delayed and single-flight on desktop",()=>{
 const code=section(dj,"function scheduleDeepVoice(","function toast(");
 assert.ok(code.includes("voiceJobs.size>=1"));
 assert.ok(code.includes("setTimeout(resolve,4500)"));
 assert.ok(code.includes("mayScanDesktopVoice(bridge(),track)"));
});
test("desktop library beat search yields event loop during large candidate comparisons",()=>{
 const code=section(dj,"async function intelligentShuffle(","let shuffleBusy=");
 assert.ok(code.includes("if(++batchCount%24===0)"));
 assert.ok(code.includes("await new Promise(resolve=>setTimeout(resolve,0))"));
 assert.ok(!code.includes("if(isIOS&&++batchCount%24===0)"));
});
test("normal desktop preloader never duplicates the active DJ audio preview",()=>{
 const code=section(app,"function _preparaIlSuccessivo(id) {","let _timerRiprove = null;");
 assert.ok(code.includes("if (_usaControlliNativiIos()) return;"));
 assert.ok(code.includes("if (window.MusicBoxMix?.isEnabled?.()) return;"));
});
test("console explains matching outcomes with explicit candidate counts",()=>{
 assert.ok(dj.includes('scored.length+" beat verificati'));
 assert.ok(!dj.includes('console.info("[Music Box DJ] Ricerca beat in libreria",shuffleLastDecision)'));
});


test("desktop fades in next song only after proven digital silence",()=>{
 const start=dj.indexOf("function desktopSilentTailBridge(");
 const end=dj.indexOf("function continuityFallback(",start);
 assert.ok(start>=0&&end>start);
 const safe=new Function("isIOS","hasImmediateMusicalIntro","musicalIntroEntry",
  dj.slice(start,end)+"return desktopSilentTailBridge;")(false,()=>true,()=>0);
 const a={duration:180,last:176,confidentTail:true,protectedEnding:false};
 const p=safe(a,{introDrive:.7},180);
 assert.ok(p);
 assert.equal(p.certifiedSilentBridge,true);
 assert.equal(p.kind,"soft");
 assert.equal(p.score,null);
 assert.ok(p.begin>=a.last+.3&&p.end<180);
 assert.equal(safe({...a,protectedEnding:true},{},180),null);
 assert.equal(safe({...a,confidentTail:false},{},180),null);
 assert.equal(safe({...a,lastLyricAt:175.8},{},180),null);
 assert.equal(safe({...a,last:179},{},180),null);
});
test("desktop prefers a certified silent bridge to a dry cut",()=>{
 assert.match(dj,/const silentBridge=!isIOS&&currentAnalysis&&nextAnalysis/);
 assert.match(dj,/chosen&&chosen.kind!=="cut"\?chosen:null/);
 assert.match(dj,/certifiedQuietAlternative\|\|certifiedSilentBridge/);
 assert.match(dj,/cue\.certifiedSilentBridge===true&&cue\.kind==="soft"/);
});

test("missing track analysis schedules bounded DJ retry without approving unsafe pairs",()=>{
 assert.match(dj,/plannedFor===next\.id&&!plan&&lastPlanMissing&&planRetryCount<4/);
 assert.match(dj,/epoch!==planEpoch/);
 assert.match(dj,/lastPlanMissing=!\(a&&b\)/);
 assert.match(dj,/planWaitingAnalysis:!!lastPlanMissing/);
});
test("current release prioritizes final-impact before postlude",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,"..","versione.json"),"utf8")).versione;
 assert.match(version,/^\d+\.\d+$/);
 const revision=version.replace(".","");
 assert.ok(app.includes('const APP_VERSION = "'+version+'"'));
 assert.ok(html.includes('mix-intelligente.js?v='+revision));
 assert.ok(html.includes('app.js?v='+revision),
  'iPhone and PC must reload the matching player version');
 assert.ok(sw.includes('spotifynonavraiimieisoldi-v'+revision));
 assert.ok(dj.includes('certifiedImpact||(chosen&&chosen.kind!=="cut"?chosen:null)'),
  "plan must prefer final beat over the quiet postlude");
 assert.ok(dj.includes('const choicePool=scored.length?scored:impactScored.length?impactScored:'),
  "auto selector must prefer the final-beat successor");
 assert.ok(dj.includes("plan.measuredFinalImpact===true"),
  "measured beat must use the precision timer");
 assert.ok(dj.includes("finalImpactAt:Number.isFinite(plan?.finalImpactAt)?plan.finalImpactAt:null"),
  "diagnostics must disclose actual final-impact timing");
});

test("real final-beat release joins before encoded silence, without losing the instrumental ending",()=>{
 const code=section(dj,"function rhythmicReleaseBeatBridge(","function verifiedRhythmicGridBridge(");
 const validators=section(dj,"function iphoneBeatPairCertified(","function iphoneQuietReleaseCertified(");
 const api=new Function("rhythmicGridEvidence","onsetPairAgreement",
  "hasImmediateMusicalIntro","musicalIntroEntry","onsetGridPhase","clamp",
  validators+code+"return {plan:rhythmicReleaseBeatBridge,pc:desktopBeatPairCertified,ios:iphoneBeatPairCertified};"
 )(
  (_,b)=>b?.badHarmony?null:{longCompatible:true,score:.91,tempo:1,groove:.9},
  (_,b)=>({certified:!b?.offBeat}),
  ()=>true,()=>0,()=>0,(n,min,max)=>Math.max(min,Math.min(max,n))
 );
 const a={duration:200,last:196,bpm:120,lastLyricAt:171,
  confidentTail:true,protectedEnding:false,
  dropRelease:{lastImpactAt:193.4,releaseAt:194.25,score:.87,quietLevel:.1}};
 const b={bpm:120,safeIntroAt:0,firstLyricAt:8,firstVoiceAt:9};
 const cue=api.plan(a,b,200);
 assert.equal(cue?.kind,"beat");
 assert.equal(cue?.measuredRhythmicRelease,true);
 assert.ok(cue.begin<a.dropRelease.lastImpactAt-1.1,
  "incoming beat must begin while old percussion is still playing");
 assert.ok(cue.end<a.duration-3.5,
  "the transition must finish before digital silence, not at EOF");
 assert.ok(cue.end>a.last&&cue.preserveTail===true,
  "preserve the original decay through its final audible sound");
 assert.ok(api.pc(a,b,cue)&&api.ios(a,b,cue),
  "both devices must certify the same measured release");
 assert.equal(api.plan({...a,lastLyricAt:190},b,200),null,
  "late vocal phrasing must never be overlaid");
 assert.equal(api.plan({...a,lastLyricAt:undefined},b,200),null,
  "no vocal evidence is not proof of an instrumental ending");
 assert.equal(api.plan(a,{...b,offBeat:true},200),null,
  "similar BPM cannot hide incompatible actual beat onsets");
 assert.equal(api.plan(a,{...b,badHarmony:true},200),null,
  "unrelated chord boundaries must never mix");
 assert.equal(api.pc(a,b,{...cue,begin:194.8}),false,
  "a mix started after the last actual beat is not beatmatched");
});

test("a measured early musical decay outranks a proposed late soft fade without overriding real beats",()=>{
 const selector=section(dj,"const latePlannedSoft=Boolean(candidate&&",
  "lastPlanMissing=!(a&&b);");
 assert.ok(selector.includes('["soft","fade","rise","continuity"].includes(candidate.kind)'),
  "only late non-beat plans may be replaced");
 assert.ok(selector.includes("candidate.begin>currentAnalysis.dropRelease.releaseAt+1.2"),
  "the replacement must be measurably earlier");
 assert.ok(selector.includes("certifiedNeutralBridge(currentAnalysis,nextAnalysis,audio.duration)"),
  "the early release must independently pass the existing strict safety gate");
 assert.ok(selector.includes("certifiedQuietAlternative.begin+.65<candidate.begin"),
  "a nearly identical cue should not be churned");
 assert.ok(selector.includes("chosen=certifiedQuietAlternative"),
  "the selected cue must actually be promoted");
 assert.ok(selector.includes('realBeat||certifiedImpact||'),
  "an already approved musical beat always retains priority");
});

test("earlier four-second real beat windows can mix before the last impact without clipping lyrics",()=>{
 const body=section(dj,"function earlyMatchedBar(","function rhythmicReleaseBeatBridge(");
 const make=new Function("env",
  "const {clamp,hasImmediateMusicalIntro,camelotMatch,musicalIntroEntry,"+
  "onsetGridPhase,similarNotes,grooveAgreement,onsetPeriodicity,hasReliableHarmony}=env;"+
  body+"return earlyMatchedBar;");
 const env={
  clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
  hasImmediateMusicalIntro:()=>true,
  camelotMatch:()=>({weight:.5,score:.9}),
  musicalIntroEntry:()=>0,
  onsetGridPhase:()=>0,
  similarNotes:()=>({matches:true,focused:.90,phrase:.85}),
  grooveAgreement:()=>({score:.9,correlation:.70}),
  onsetPeriodicity:()=>.72,
  hasReliableHarmony:()=>true
 };
 const plan=make(env);
 const beatProfile=Array.from({length:96},(_,i)=>i%12===0?2:.05);
 const a={duration:200,last:198,bpm:120,beatConfidence:.8,
  protectedEnding:false,lastLyricAt:172,voiceModel:"checked",
  voiceScannedEnd:198,
  outroOnsetWindows:[{start:190,end:194,onset:beatProfile,
    groove:Array(32).fill(.6),notes:Array(12).fill(.09),levelRatio:.7}]};
 const b={bpm:120,beatConfidence:.8,introDrive:.8,
  introOnset:beatProfile,firstLyricAt:20};
 const cue=plan(a,b,200);
 assert.ok(cue&&cue.kind==="beat", "must recognize certified earlier musical bars");
 assert.equal(cue.earlyBeatJoin,true);
 assert.ok(cue.begin<a.last-6&&cue.end>=a.last-.2,
  "start before final beat but preserve the entire original ending");
 assert.equal(plan({...a,lastLyricAt:188},b,200),null,
  "late original lyrics forbid an early overlay");
 assert.equal(plan({...a,lastLyricAt:undefined,voiceModel:null},b,200),null,
  "unknown vocal safety cannot be guessed");
 assert.equal(plan(a,{...b,firstLyricAt:4},200),null,
  "incoming vocals must not overlap the first song");
 assert.equal(plan({...a,outroOnsetWindows:[]},b,200),null,
  "older indexes fall back safely, with no invented early beats");
 assert.equal(plan(a,b,190),null,"incorrect decoded duration vetoes a mix");
 assert.equal(plan(a,{...b,bpm:85},200),null,
  "tempo-incompatible music cannot be aligned by a simple fade");
 assert.equal(plan(a,b,200)?.preserveTail,true);
 assert.equal(plan(a,{...b,introOnset:Array.from({length:96},
  (_,i)=>i%12===6?2:.05)},200),null,
  "a similar BPM with off-beat percussion is NOT a synchronized musical beat");
 assert.match(dj,/librosa-onsets-chroma-rms-v4-windows/,
  "new indexed beat windows must be loaded on both desktop and iPhone");
});
