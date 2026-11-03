"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"mix-intelligente.js"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
function excerpt(first,last){
 const i=source.indexOf(first),j=source.indexOf(last,i+first.length);
 assert.ok(i>=0&&j>i,"missing DJ function "+first);
 return source.slice(i,j);
}
const allow=new Function(excerpt("function mobileMixAllowed(",
 "function rememberMobileClip(")+"return mobileMixAllowed;")();
const sample={kind:"snap",begin:173,end:173.72,fade:.72,
 preserveTail:true,measuredBeatBridge:true,grooveScore:.83,score:82};
test("measured short beat can enter iPhone with no simulated YAMNet voice scan",()=>{
 assert.equal(allow(sample,{protectedEnding:false,lastVoiceAt:165},167),true);
 assert.equal(allow({...sample,voiceVerifiedMicroBridge:true},{},null),true);
 assert.equal(allow(sample,{protectedEnding:true},167),false);
 assert.equal(allow(sample,{protectedEnding:false},172),false);
 assert.equal(allow({...sample,grooveScore:.51},{protectedEnding:false},167),false);
 assert.equal(allow({...sample,score:36},{protectedEnding:false},167),false);
 assert.equal(allow({...sample,preserveTail:false},{protectedEnding:false},167),false);
 assert.equal(allow(sample,null,null),false);
});
test("long overlays still require certified safe vocal and quiet region",()=>{
 const beat={kind:"beat",begin:164,end:168,fade:4,
  quietCertified:true,safeOutroAt:164};
 assert.equal(allow(beat,{},null),true);
 assert.equal(allow({...beat,quietCertified:false},{},null),false);
 assert.equal(allow({...beat,safeOutroAt:null},{},null),false);
 assert.equal(allow({...beat,fade:1},{},null),false);
 assert.equal(allow({kind:"cut",begin:163,end:168,fade:5},{},null),false);
});
test("Safari never prepares a full MP3 while native playback is starting or buffering",()=>{
 const policy=rt=>new Function("runtime",
  "const isIOS=true,document={get hidden(){return runtime.hidden}},Date={now:()=>runtime.now};"+
  "let lastDJTrackChange=runtime.last;"+
  excerpt("function mobileDJMayWork(","function mobileMixAllowed(")+
  "return mobileClipWindow;")(rt);
 const audio=(at,state)=>({paused:false,readyState:state,
  duration:180,currentTime:at,buffered:{
   length:1,start:()=>0,end:()=>164}});
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(20,4)),false,
  "far from outro: no full decode");
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(110,4)),true);
 assert.equal(policy({now:11000,last:9000,hidden:false})(audio(110,4)),false,
  "skip cooldown");
 assert.equal(policy({now:11000,last:0,hidden:false})(audio(110,2)),false,
  "buffering");
 assert.equal(policy({now:11000,last:0,hidden:true})(audio(110,4)),false,
  "screen locked");
});
test("iPhone next button starts the native song before repaint, not a second decoder",()=>{
 const p=app.slice(app.indexOf("async function playById("),
  app.indexOf("function idBranoA(",app.indexOf("async function playById(")));
 assert.ok(p.indexOf("const _avvioImmediato = autoplay ? doPlay() : null;")>=0);
 assert.ok(p.indexOf("const _avvioImmediato = autoplay ? doPlay() : null;")<
  p.indexOf("_segnaRigaAttiva();"));
 assert.match(app,/function _preparaIlSuccessivo\(id\) \{[\s\S]{0,450}if \(_usaControlliNativiIos\(\)\) return;/);
 assert.match(app,/if \(_usaControlliNativiIos\(\) && !window\.MusicBoxMix\?\.needsAudioContext\?\.\(\)\) return;/);
 assert.ok(source.includes("mobileMixAllowed(plan,nowInfo"));
 assert.ok(source.includes("mobileClipWindow(audio)"));
 assert.ok(source.includes("vocalSafe:!lowPreview"));
});
test("real MP3 index contains eligible measured DJ joins but refuses unverified unsafe long blends",()=>{
 const idx=JSON.parse(fs.readFileSync(path.join(root,"dj-deep-analysis.json"),"utf8"));
 const tracks=Object.entries(idx.entries||{}).filter(([k,v])=>
  v?.status==="ok"&&Number.isFinite(v.duration)&&v.duration>=26&&
  v.bpm>=55&&v.bpm<=210&&Array.isArray(v.chroma)&&v.chroma.length===12)
  .map(([key,data])=>({key,data}));
 const engine=new Function("isIOS","style",
  "const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\n"+
  excerpt("function grooveAgreement(","// Find a *musical* release")+
  excerpt("function compatibility(","async function decode(")+
  excerpt("function hasReliableHarmony(","function resetMobileFade(")+
  "return {transition};")(false,"auto");
 let total=0,plans=0,allowed=0,lowPreview=0;
 for(let i=0;i<tracks.length;i+=11)
  for(let j=0;j<tracks.length;j+=2){
   if(i===j)continue;
   total++;
   const a=tracks[i].data,b=tracks[j].data;
   const p=engine.transition(a,b,a.duration);
   if(!p)continue;
   plans++;
   if(allow(p,a,null)){
    allowed++;if(p.kind==="snap"&&!p.voiceVerifiedMicroBridge)lowPreview++;
    assert.ok(p.end<=a.duration+.04&&p.begin>=0);
   }
  }
 console.info("[iPhone DJ REAL]",JSON.stringify({indexed:tracks.length,total,
  plans,allowed,lowPreview}));
 assert.ok(total>=25000);
 assert.ok(allowed>=1,"at least one real beat/quiet overlap should be eligible");
});

test("iPhone shuffle only promotes tracks its actual mixer can play",()=>{
 assert.ok(source.includes("const mobilePlayable=!isIOS||mobileMixAllowed(cue,old,lastLyric);"));
 assert.ok(source.includes("const verified=Boolean(mobilePlayable&&cue"));
 assert.ok(source.includes("const safeSoft=Boolean(mobilePlayable&&cue"));
});
test("DJ index does not compete with native iPhone startup or play while disabled",()=>{
 assert.ok(source.includes("function start(){\n // A disabled DJ must not download"));
 assert.ok(source.includes("if(enabled){\n  if(isIOS)setTimeout"));
 assert.ok(source.includes("mobileOverlayEnabled=true;\n   try{localStorage.setItem"));
 assert.ok(source.includes("bridge()?.mixEnableAudio?.();"));
});

test("large Safari DJ index retries after a slow/failed fetch without a reload",async()=>{
 const begin=source.indexOf("let deepIndex=null,deepIndexPromise=null");
 const end=source.indexOf("function canSaveAnalysis(",begin);
 assert.ok(begin>=0&&end>begin);
 const code=source.slice(begin,end);
 const clock={now:100000},queued=[];
 let requests=0;
 const fetch=async()=>{
  requests++;
  if(requests===1)throw Error("slow network");
  return {ok:true,json:async()=>({version:2,entries:{}})};
 };
 const api=new Function("fetch","clock","queued",
  "const isIOS=true,document={hidden:false};"+
  "const Date={now:()=>clock.now};"+
  "const setTimeout=(fn,delay)=>{queued.push({fn,delay});return queued.length};"+
  "const clearTimeout=()=>{};"+
  "const AbortController=globalThis.AbortController;"+
  "let enabled=true,mixing=false,plannedFor='',plan=null,"+
  "shuffleGeneration=0,shuffleBusy=false,shuffleRunFor='',shuffleRetryAt=0,shuffleAttempts=0;"+
  "const deepStatus=()=>{};"+
  code+
  "return {loadDeepIndex,stat:()=>({retryAfter:deepRetryAfter,loaded:!!deepIndex})};"
 )(fetch,clock,queued);
 assert.equal(await api.loadDeepIndex(),null);
 assert.equal(requests,1);
 assert.ok(api.stat().retryAfter>clock.now);
 assert.equal(await api.loadDeepIndex(),null,"do not retry every audio tick");
 assert.equal(requests,1);
 clock.now=api.stat().retryAfter+1;
 assert.equal((await api.loadDeepIndex()).version,2);
 assert.equal(requests,2);
 assert.equal(api.stat().loaded,true);
 assert.equal((await api.loadDeepIndex()).version,2);
 assert.equal(requests,2,"successful index is reused");
});
test("continue button never cancels playback intention while audio already plays",()=>{
 assert.ok(app.includes("if (audio && !audio.paused) { _nascondiAiuto(); return; }"));
 assert.ok(!app.includes("if (audio && !audio.paused) { _vuoleSuonare = false; return; }"));
});
