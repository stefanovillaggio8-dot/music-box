"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const tool=fs.readFileSync(path.join(__dirname,'../tools/dj-equivalence-audit.cjs'),'utf8');
const {engine,tracks}=new Function('require','__dirname',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return {engine,tracks};')(require,path.join(__dirname,'../tools'));
function fixture(){
 const notes=[.23,.01,.01,.01,.21,.01,.01,.23,.01,.01,.01,.25];
 const section=(start,end)=>({start,end,step:.02,
  onset:Array.from({length:Math.ceil((end-start)/.02)},(_,i)=>.05+Math.exp(-Math.pow(((i*.02+.25)%.5-.25)/.035,2))),
  beats:Array.from({length:Math.floor((end-start)/.5)},(_,i)=>start+i*.5),
  harmony:Array.from({length:Math.floor((end-start)/.5)-1},(_,i)=>({t:start+.5+i*.5,notes}))});
 const pcm=sha=>({version:1,sha,method:'original-pcm-onset-chroma-20ms',intro:section(0,20),outro:section(80,100.1)});
 const a={sha:'old',duration:100.1,last:100,bpm:120,chroma:notes,lastLyricAt:75,pcmTransition:pcm('old')};
 const b={sha:'new',duration:180,last:179,bpm:120,chroma:notes,first:0,safeIntroAt:0,introDrive:.8,firstLyricAt:12,pcmTransition:pcm('new')};
 return {a,b};
}
test('complete PCM bridge aligns eight or more actual beats across both halves',()=>{
 const {a,b}=fixture(),p=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.ok(p);assert.equal(p.kind,'beat');assert.ok(p.fade>=4.5);assert.ok(p.measuredBeatCount>=8);
 assert.ok(p.measuredPlacementError<.001);assert.ok(p.harmonicScore>.99);
 assert.equal(engine.desktopBeatPairCertified(a,b,p),true);
 for(const field of ['begin','end','entry','tempo','gain'])assert.equal(engine.desktopBeatPairCertified(a,b,{...p,[field]:p[field]+.1}),false);
});
test('full beatmix requires source identity, independent rhythm and vocal safety',()=>{
 const {a,b}=fixture();
 assert.equal(engine.measuredFullBeatBridge({...a,sha:'changed'},b,a.duration),null);
 assert.equal(engine.measuredFullBeatBridge(a,{...b,firstLyricAt:null},a.duration),null);
 assert.equal(engine.measuredFullBeatBridge({...a,lastLyricAt:99},b,a.duration)?.nativeTailFullBeat,true,
  'the native original must finish without ducking its late vocal');
 assert.equal(engine.measuredFullBeatBridge(a,{...b,firstLyricAt:3},a.duration),null);
 const flat=structuredClone(b);flat.pcmTransition.intro.onset.fill(.1);
 assert.equal(engine.measuredFullBeatBridge(a,flat,a.duration),null);
 const drift=structuredClone(b);drift.pcmTransition.intro.beats=drift.pcmTransition.intro.beats.map((t,i)=>t+i*.035);
 assert.equal(engine.measuredFullBeatBridge(a,drift,a.duration),null);
 const wrong=structuredClone(b);wrong.pcmTransition.intro.harmony.forEach(x=>x.notes=x.notes.map((v,i,all)=>all[(i+2)%12]));
 assert.equal(engine.measuredFullBeatBridge(a,wrong,a.duration),null);
});

test('compact plans preserve the PCM certificate while rechecking live recording and vocals',()=>{
 const {a,b}=fixture(),cue=engine.measuredFullBeatBridge(a,b,a.duration);
 cue.outputHeadroom=1;cue.renderEvidence={sourceSha:a.sha,targetSha:b.sha,
  pitchPreserved:true,timingVerified:true,peakBound:.9};
 a.pcmBeatPlans={[b.sha]:{version:2,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration,cue}};
 delete a.pcmTransition;delete b.pcmTransition;
 assert.ok(engine.measuredFullBeatBridge(a,b,a.duration));
 assert.equal(engine.desktopBeatPairCertified(a,b,cue),true);
 assert.equal(engine.measuredFullBeatBridge(a,{...b,sha:'different'},a.duration),null);
 assert.equal(engine.measuredFullBeatBridge(a,{...b,duration:181},a.duration),null);
 assert.equal(engine.measuredFullBeatBridge({...a,lastVoiceAt:cue.begin},b,a.duration)?.nativeTailFullBeat,true);
 assert.equal(engine.measuredFullBeatBridge(a,{...b,firstVoiceAt:cue.fade-.1},a.duration),null);
 assert.equal(engine.desktopBeatPairCertified(a,b,{...cue,entry:cue.entry+.1}),false);
});
test('an exact PCM window cannot be rescheduled one beat later',()=>{
 const {a,b}=fixture(),cue=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.equal(engine.desktopBeatStartDelay(cue,cue.begin),0);
 assert.equal(engine.desktopBeatStartDelay(cue,cue.begin+.5),null);
 assert.ok(Math.abs(engine.desktopBeatStartDelay(cue,cue.begin-.1)-.1)<1e-9);
 const code=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
 const helpers=code.slice(code.indexOf('function djFullBeatClockError('),code.indexOf('function djSoftFocusEnvelope('));
 const error=new Function(helpers+'return djFullBeatClockError;')();
 assert.ok(error(cue,cue.begin+1,cue.entry+cue.tempo)<1e-8);
 assert.ok(error(cue,cue.begin+1.5,cue.entry+cue.tempo)>.49);
});

test('full-band original percussion intro does not pretend to have matching chords',()=>{
 const {a,b}=fixture();
 b.pcmTransition.version=2;b.pcmTransition.method='original-pcm-hpss-onset-chroma-20ms-v2';
 for(const row of b.pcmTransition.intro.harmony){row.notes=Array(12).fill(1/12);row.tonalRatio=.03;row.rms=.15;}
 const p=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.ok(p);assert.equal(p.percussiveIntro,true);assert.equal(p.harmonicScore,null);
 assert.equal(p.drumOnlyUnderlay,undefined,'the original incoming recording plays at full bandwidth');
 assert.equal(engine.desktopBeatPairCertified(a,b,p),true);
 const pitched=structuredClone(b);pitched.pcmTransition.intro.harmony.forEach(r=>r.tonalRatio=.4);
 assert.equal(engine.measuredFullBeatBridge(a,pitched,a.duration),null);
 const quiet=structuredClone(b);quiet.pcmTransition.intro.harmony.forEach(r=>r.rms=0);
 assert.equal(engine.measuredFullBeatBridge(a,quiet,a.duration),null);
});

test('original MP3 fixtures prove a 6.8 second thirteen-beat mix, independent of compact flags',()=>{
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/full-beat-584-336.json'),'utf8'));
 const byKey=new Map(tracks),from='audio/songs/track-584.mp3',to='audio/songs/track-336.mp3';
 const a={...byKey.get(from),pcmTransition:fixture.entries[from].pcmTransition};
 const b={...byKey.get(to),pcmTransition:fixture.entries[to].pcmTransition};
 const p=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.ok(p);assert.ok(p.fade>6.8&&p.fade<6.9);assert.equal(p.measuredBeatCount,13);
 assert.ok(p.measuredPlacementError<.025);assert.ok(p.fullOnsetCorrelation>.55);
 assert.equal(p.harmonicMode,'compatible-key');assert.equal(p.harmonicKeyFrom,'4A');assert.equal(p.harmonicKeyTo,'5A');
 assert.ok(p.harmonicKeyConfidence>.87);assert.ok(p.harmonicDissonanceMax<0);
 assert.equal(p.nativeTailFullBeat,true);assert.equal(p.quietCertified,false);
 assert.ok(Math.abs(p.end-a.duration)<.04);assert.equal(p.silenceTrim,false);
 assert.equal(engine.desktopBeatPairCertified(a,b,p),true);
 assert.equal(engine.desktopBeatPairCertified(a,b,{...p,beatAnchor:p.beatAnchor+.1}),false);
 const bad=structuredClone(b);bad.pcmTransition.intro.onset.fill(0);
 assert.equal(engine.measuredFullBeatBridge(a,bad,a.duration),null);
 const vocals={...b,firstVoiceAt:b.safeIntroAt+2};
 assert.equal(engine.measuredFullBeatBridge(a,vocals,a.duration),null);
 delete a.pcmTransition;delete b.pcmTransition;
 const rendered=a.pcmBeatPlans[b.sha].cue;
 assert.equal(engine.desktopBeatPairCertified(a,b,p),false,'unrendered cue cannot bypass the measured common headroom');
 assert.equal(engine.desktopBeatPairCertified(a,b,rendered),true,'runtime uses the same SHA-bound rendered plan');
 assert.equal(engine.measuredFullBeatBridge(a,{...b,sha:'changed-audio'},a.duration),null);
});
test('live phase feedback converges without moving or retiming the outgoing player',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
 const helper=code.slice(code.indexOf('function fullBeatFeedbackRate('),code.indexOf('function djSoftFocusEnvelope('));
 const rate=new Function('clamp',helper+'return fullBeatFeedbackRate;')((v,a,b)=>Math.max(a,Math.min(b,v)));
 for(const tempo of [.96,1,1.0458])for(const initial of [-.08,.08]){
  let old=1,newClock=(1-initial)*tempo;
  for(let i=0;i<60;i++){
   const error=old-newClock/tempo;
   const correction=rate(tempo,error);
   assert.ok(correction>=.9&&correction<=1.1);
   old+=.05;newClock+=.05*correction;
  }
  assert.ok(Math.abs(old-newClock/tempo)<.003);
 }
});

test('local pulse hypotheses rescue half-time metadata only with observed attacks',()=>{
 const {a,b}=fixture();
 b.bpm=60;
 b.pcmTransition.version=3;b.pcmTransition.method='original-pcm-hpss-onset-chroma-20ms-v3-multigrid';
 b.pcmTransition.intro.grids=[{method:'local-onset',bpm:120,beats:[...b.pcmTransition.intro.beats]}];
 b.pcmTransition.intro.beats=b.pcmTransition.intro.beats.filter((t,i)=>i%2===0);
 const p=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.ok(p);assert.equal(p.targetTempoBpm,120);assert.ok(p.measuredBeatCount>=8);
 const fake=structuredClone(b);fake.pcmTransition.intro.grids[0].beats=fake.pcmTransition.intro.grids[0].beats.map(t=>t+.25);
 assert.equal(engine.measuredFullBeatBridge(a,fake,a.duration),null,'pulses in the trough cannot count');
});

test('extended native-tail windows keep both complete clocks and bounded mobile preparation',()=>{
 const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/full-beat-multigrid.json'),'utf8'));
 const byKey=new Map(tracks),from='audio/songs/track-1008.mp3',to='audio/songs/track-51.mp3';
 const a={...byKey.get(from),pcmTransition:evidence.entries[from].pcmTransition};
 const b={...byKey.get(to),pcmTransition:evidence.entries[to].pcmTransition};
 const p=engine.measuredFullBeatBridge(a,b,a.duration);
 assert.ok(p.fade>8&&p.fade<=16);assert.equal(p.end,a.duration-.035);
 assert.equal(p.nativeTailFullBeat,true);assert.equal(p.silenceTrim,false);
 const source=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
 assert.match(source,/clamp\(info\.pcmIntroSeconds,14,24\)/);
});

test('original PCM alternative grids add a real pair missed by the global beat grid',()=>{
 const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/full-beat-multigrid.json'),'utf8'));
 const byKey=new Map(tracks),from='audio/songs/track-347.mp3',to='audio/songs/track-219.mp3';
 const a={...byKey.get(from),pcmTransition:evidence.entries[from].pcmTransition};
 const b={...byKey.get(to),pcmTransition:evidence.entries[to].pcmTransition};
 const p=engine.measuredFullBeatBridge(a,b,a.duration);assert.ok(p);assert.ok(p.measuredBeatCount>=8);
 const oldA=structuredClone(a),oldB=structuredClone(b);
 delete oldA.pcmTransition.outro.grids;delete oldB.pcmTransition.intro.grids;
 assert.equal(engine.measuredFullBeatBridge(oldA,oldB,a.duration),null);
});

test('rendered output headroom cannot be removed and hot sums retain the Safari fallback',()=>{
 const {a,b}=fixture(),cue=engine.measuredFullBeatBridge(a,b,a.duration);
 const safe={...cue,outputHeadroom:.72,renderEvidence:{sourceSha:a.sha,targetSha:b.sha,
  pitchPreserved:true,timingVerified:true,peakBound:.96}};
 a.pcmBeatPlans={[b.sha]:{version:2,fromSha:a.sha,toSha:b.sha,sourceDuration:a.duration,nextDuration:b.duration,cue:safe}};
 delete a.pcmTransition;delete b.pcmTransition;
 assert.equal(engine.desktopBeatPairCertified(a,b,safe),true);
 const stripped={...safe};delete stripped.outputHeadroom;
 assert.equal(engine.desktopBeatPairCertified(a,b,stripped),false);
 const source=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
 const body=source.slice(source.indexOf('function mobileMixAllowed('),source.indexOf('function rememberMobileClip('));
 const allowed=new Function(body+'return mobileMixAllowed;')();
 assert.equal(allowed(safe,a),false,'Safari native volume cannot provide common headroom');
});
