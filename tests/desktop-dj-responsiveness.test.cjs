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
 assert.ok(code.includes("if (_usaControlliNativiIos() || window.MusicBoxMix?.isEnabled?.()) return;"));
});
test("console explains matching outcomes with explicit candidate counts",()=>{
 assert.ok(dj.includes('scored.length+" beat verificati'));
 assert.ok(!dj.includes('console.info("[Music Box DJ] Ricerca beat in libreria",shuffleLastDecision)'));
});
