"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
const from=source.indexOf("function adoptedMixRevealGain(");
const to=source.indexOf("async function handoff()",from);
assert.ok(from>0&&to>from,"adopted audio volume recovery exists");

function fixture(){
 let now=0,currentId="incoming",userVolume=.9;
 const audio={paused:false,seeking:false,ended:false,volume:.09};
 let currentAudio=audio;
 const pending=[];
 const app={audio:()=>currentAudio,currentId:()=>currentId,
  volume:()=>userVolume};
 const api=new Function("bridge","performance","setTimeout",
  "const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\n"+
  source.slice(from,to)+
  "return {adoptedMixRevealGain,revealAdoptedMixAudio};"
 )(()=>app,{now:()=>now},fn=>{pending.push(fn);return pending.length});
 const advance=ms=>{now+=ms;const next=pending.shift();assert.ok(next);next()};
 return {audio,app,api,advance,pending,
  setVolume:v=>userVolume=v,
  swapSong:()=>{currentId="another";currentAudio={volume:.8}}};
}

test("adopted low-band audio regains full volume gradually after protected EOF",()=>{
 const f=fixture();
 f.api.revealAdoptedMixAudio(f.audio,"incoming",.09,.78);
 assert.ok(Math.abs(f.audio.volume-.09)<.0001,
  "handoff must not jump from 9% to full volume instantly");
 f.advance(300);
 assert.ok(f.audio.volume>.09&&f.audio.volume<.9);
 f.advance(480);
 assert.ok(Math.abs(f.audio.volume-.9)<.0001,
  "next track must not remain faint after the outgoing track ends");
 assert.equal(f.pending.length,0);
});

test("volume slider changes are honored during the adopted-song reveal",()=>{
 const f=fixture();
 f.api.revealAdoptedMixAudio(f.audio,"incoming",.09,.78);
 f.setVolume(.4);
 f.advance(390);
 assert.ok(f.audio.volume>.04&&f.audio.volume<.4);
 f.advance(390);
 assert.equal(f.audio.volume,.4);
});

test("user pause restores resume level and track change cancels stale gain writes",()=>{
 const f=fixture();
 f.api.revealAdoptedMixAudio(f.audio,"incoming",.09,.78);
 f.audio.paused=true;
 f.advance(100);
 assert.equal(f.audio.volume,.9);
 assert.equal(f.pending.length,0);
 const b=fixture();
 b.api.revealAdoptedMixAudio(b.audio,"incoming",.09,.78);
 b.swapSong();
 b.advance(200);
 assert.equal(b.audio.volume,.09);
 assert.equal(b.pending.length,0);
});

test("audio adoption invokes the reveal after replacing the main player",()=>{
 const body=source.slice(to,source.indexOf("// Bounded gain for a NON beatmatched",to));
 const adoption=body.indexOf("app.mixAdoptHandoff(act.track.id,preview)");
 const reveal=body.indexOf("revealAdoptedMixAudio(preview,act.track.id,previewLevel");
 assert.ok(adoption>=0&&reveal>adoption);
 assert.ok(body.includes("releaseDesktopDsp(old)"),
  "previous WebAudio graph cleanup must still run");
});

test("filtered beat underlay waits for native EOF before adopting and revealing",()=>{
 const start=source.indexOf("function fadeStep(){");
 const stop=source.indexOf("// Even when the next MP3 cannot be analyzed",start);
 assert.ok(start>0&&stop>start);
 const fade=source.slice(start,stop);
 const ended=fade.indexOf("if(old.ended&&(act.nativeTailFullBeat||act.subduedRhythmicUnderlay||act.postMusicalTailUnderlay))");
 const pauseGuard=fade.indexOf("if(old.paused||app.audio()!==old");
 assert.ok(ended>=0&&ended<pauseGuard,
  "native ended event must win over paused state and preserve seamless handoff");
 assert.match(fade,/if\(time>=1\)\{[\s\S]*?if\(act\.nativeTailFullBeat\|\|act\.subduedRhythmicUnderlay\|\|act\.postMusicalTailUnderlay\)\{[\s\S]*?setTimeout\(fadeStep,45\);return;/,
  "underlay clock completion must not cut the outgoing MP3 before EOF");
});
