'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('the real component screen rejects a consumed quiet crescendo, not an equally audible rhythmic entrance',async()=>{
 const {introductionExposure}=await import('../tools/introduction-exposure.mjs');
 const rate=48000,pre=.3,cue={entry:0,tempo:1,fade:6};
 const pcm=(fn,hz=440)=>[0,1].map(()=>Float32Array.from({length:rate*7},(_,i)=>fn(i/rate)*Math.sin(2*Math.PI*hz*i/rate)));
 const old=pcm(()=>.35),native=pcm(t=>.002+t*.005);
 const obscured=pcm(t=>t<pre?0:.33*(.002+(t-pre)*.005));
 const failed=introductionExposure(old,obscured,native,rate,cue,pre);
 assert.equal(failed.accepted,false);assert.ok(failed.longestMaskedSeconds>=3);
 const strong=pcm(()=>.3),audible=pcm(t=>t<pre?0:.3*.8);
 assert.equal(introductionExposure(old,audible,strong,rate,cue,pre).accepted,true);
 // Independent counterexample to the rejected broadband-only prototype:
 // treble above a bass/mid tone remains exposed despite -25 dB total RMS.
 const treble=pcm(()=>.02,5000),treblePlayed=pcm(t=>t<pre?0:.02,5000);
 const spectral=introductionExposure(old,treblePlayed,treble,rate,cue,pre);
 assert.ok(spectral.rows[2].relativeDb<-18);assert.equal(spectral.accepted,true);
 // Loud outgoing music can end naturally; the very same original intro
 // is then fully exposed, with no seek, gain boost or content loss.
 const none=pcm(()=>0);
 assert.equal(introductionExposure(none,pcm(t=>.002+(t-pre)*.005),native,rate,cue,pre).accepted,true);
});
test('invalid or incomplete original PCM cannot certify exposure',async()=>{
 const {introductionExposure}=await import('../tools/introduction-exposure.mjs');
 const c=[new Float32Array(100),new Float32Array(100)];
 assert.throws(()=>introductionExposure(c,c,c,48000,{entry:0,tempo:1,fade:5},.3),/Incomplete/);
});
test('failed actual render evidence vetoes even a zero-seek incoming cue and is asset-bound',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8');
 const lo=source.indexOf('function incomingContentDecision('),hi=source.indexOf('function validExactSilentSuffix(',lo);
 const decide=new Function(source.slice(lo,hi)+'return incomingContentDecision')();
 const proof={method:'rendered-introduction-band-masking-screen-v2',accepted:false,targetSha:'new',assetSha256:'asset'};
 const cue={entry:0,composite:{sha256:'asset',introductionExposure:proof}};
 assert.equal(decide({sha:'new'},cue).allowed,false);
 proof.accepted=true;assert.equal(decide({sha:'new'},cue).allowed,true);
 assert.equal(decide({sha:'replaced'},cue).allowed,false);
 cue.composite.sha256='different-render';assert.equal(decide({sha:'new'},cue).allowed,false);
});
