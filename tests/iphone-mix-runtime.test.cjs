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
