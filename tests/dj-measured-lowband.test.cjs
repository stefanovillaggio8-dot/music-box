"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const db=JSON.parse(fs.readFileSync(path.join(root,"dj-deep-analysis.json"),"utf8"));
const lyrics=JSON.parse(fs.readFileSync(path.join(root,"dj-lyric-boundaries.json"),"utf8"));
function section(first,last){
 const a=source.indexOf(first),b=source.indexOf(last,a+first.length);
 assert.ok(a>=0&&b>a,"missing function "+first);
 return source.slice(a,b);
}
const api=new Function("isIOS","style","djLyricBoundaries",
 "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\n"+
 section("function withGuardedLRC(","function loadDJLyricBoundaries(")+
 section("function verifiedIndexedGridTempo(","function deepLookup(")+
 section("function onsetPairAgreement(","function iphoneBeatPairCertified(")+
 section("function desktopBeatPairCertified(","function certifiedNeutralBridge(")+
 section("function grooveAgreement(","// Find a *musical* release")+
 section("function certifiedNeutralBridge(","function mobileMixAllowed(")+
 section("function mobileMixAllowed(","function rememberMobileClip(")+
 section("function compatibility(","async function decode(")+
 section("function hasReliableHarmony(","function resetMobileFade(")+
 "return {measuredWindowRhythmUnderlay,musicallyCompatibleOverlay,mobileMixAllowed,"+
 "withGuardedLRC,verifiedIndexedGridTempo};")(
 false,"auto",lyrics.entries||{});
const indexed=id=>api.withGuardedLRC(api.verifiedIndexedGridTempo(
 db.entries["audio/songs/track-"+id+".mp3"]));

test("real PCM beats unlock a restricted, early, filtered preview despite weak full-band harmony",()=>{
 const a=indexed(588),b=indexed(627);
 const p=api.measuredWindowRhythmUnderlay(a,b,a.duration);
 assert.equal(p?.kind,"underlay");
 assert.equal(p.independentLowBand,true);
 assert.equal(p.drumOnlyUnderlay,true);
 assert.equal(p.preserveTail,true);
 assert.equal(p.measuredBeatPlacement,true);
 assert.ok(p.beatPulseAgreement>=.90);
 assert.ok(p.independentOnsetScore>=.36);
 assert.ok(p.measuredPlacementError<=.055);
 assert.ok(p.underlayVolume<=.09&&p.underlayVolume>0);
 assert.ok(a.last-p.begin>4.65,"the new bass intro enters while music remains");
 assert.equal(p.silenceTrim,false,"the current recording must never be cut");
 assert.equal(api.musicallyCompatibleOverlay(a,b,p),true);
 assert.equal(api.mobileMixAllowed(p,a,null),true);
});

test("new preview cannot be forged into a loud, full-band, or off-beat iPhone mix",()=>{
 const a=indexed(588),b=indexed(627);
 const p=api.measuredWindowRhythmUnderlay(a,b,a.duration);
 assert.equal(api.mobileMixAllowed({...p,underlayVolume:.16},a,null),false);
 assert.equal(api.mobileMixAllowed({...p,beatPulseAgreement:.2},a,null),false);
 assert.equal(api.mobileMixAllowed({...p,measuredPlacementError:.2},a,null),false);
 assert.equal(api.mobileMixAllowed({...p,drumOnlyUnderlay:false},a,null),false);
 assert.equal(api.mobileMixAllowed({...p,preserveTail:false},a,null),false);
 assert.equal(api.musicallyCompatibleOverlay(a,b,{...p,underlayVolume:.16}),false);
 assert.equal(api.musicallyCompatibleOverlay(a,b,{...p,independentOnsetScore:0}),false);
 assert.equal(api.measuredWindowRhythmUnderlay(a,{...b,bpm:b.bpm*1.09},a.duration),null);
 assert.equal(api.measuredWindowRhythmUnderlay(
   {...a,outroOnsetWindows:null},b,a.duration),null);
});

test("independent low-band joins require real incoming bass and repeated measured pulses",()=>{
 const a=indexed(588),b=indexed(627);
 assert.equal(api.measuredWindowRhythmUnderlay(
   a,{...b,introBassRatio:.03},a.duration),null);
 assert.equal(api.measuredWindowRhythmUnderlay(
   a,{...b,introBeatTimes:[]},a.duration),null);
});

test("independent timestamp coincidence never overrides a poor real PCM onset fit",()=>{
 const a=indexed(11),b=indexed(1184);
 assert.equal(api.measuredWindowRhythmUnderlay(a,b,a.duration),null,
  "four timestamp-aligned kicks alone did not agree in the decoded MP3");
 const c=indexed(588),d=indexed(684);
 assert.equal(api.measuredWindowRhythmUnderlay(c,d,c.duration),null,
  "another independently measured negative PCM comparison stays rejected");
});
