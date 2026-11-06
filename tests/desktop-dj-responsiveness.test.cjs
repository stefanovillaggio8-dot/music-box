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
