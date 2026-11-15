'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={crypto:crypto.webcrypto,TextEncoder,TextDecoder};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../word-karaoke.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../karaoke-acoustic-proof.js'),'utf8'),context);
const api=context.MusicBoxAcousticProof;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function fromCtc(rows,lines,words,audioSha256,modelSha256){
 const output=[],seen=new Map(),conflicts=new Set();
 for(const w of words){
  if(w.separatorAt==null||!w.boundaryGreedyExact)continue;
  const sourceT=lines[w.lineIndex]?.start;
  const rowIndex=rows.findIndex(r=>Math.abs(Number(r.sourceT??r.t)-sourceT)<.002&&r.text===lines[w.lineIndex]?.text);
  if(rowIndex<0)continue;
  const value={rowIndex,sourceT:Number(rows[rowIndex].sourceT??rows[rowIndex].t),wordIndex:w.wordIndex,
   decodedSha256:hash(api.normalize(w.text)),t:w.t,end:w.separatorAt,
   confidence:w.confidence,wholeFrameConfidence:w.wholeFrameConfidence,
   contextConfidence:w.contextConfidence,contextMaximumLogRatio:w.contextMaximumLogRatio,
   separatorConfidence:w.separatorConfidence,greedyExact:w.greedyExact===true};
  const key=rowIndex+'|'+w.wordIndex;
  if(seen.has(key)&&JSON.stringify(seen.get(key))!==JSON.stringify(value))conflicts.add(key);
  else seen.set(key,value);
 }
 for(const [key,value] of seen)if(!conflicts.has(key))output.push(value);
 return {version:1,method:'ctc-observed-word-separator-v1',language:'en',audioSha256,
  lyricsSha256:hash(api.canonical(rows)),model:{name:'WAV2VEC2_ASR_BASE_960H',sha256:modelSha256},words:output};
}
function fromTimedRows(rows,measured){
 const engine=context.MusicBoxWordKaraoke,result=[];
 for(const row of measured){
  if(row.estimated)continue;
  const sourceT=Number(row.sourceT??row.t),rowIndex=rows.findIndex(r=>Math.abs(Number(r.sourceT??r.t)-sourceT)<.002&&r.text===row.text);
  if(rowIndex<0)continue;
  const full=engine.hasWordTiming(row),partial=engine.hasPartialTiming(row);
  if(!full&&!partial)continue;
  const words=full?row.words.map((w,i)=>({wordIndex:i,t:w.t,end:w.end})):row.acousticSpans.map(w=>({wordIndex:w.wordIndex,t:w.t,end:w.end}));
  if(words.some(w=>!Number.isFinite(w.t)||!Number.isFinite(w.end)))continue;
  result.push({rowIndex,sourceT:rows[rowIndex].sourceT??rows[rowIndex].t,t:row.t,partialAudio:!full,words});
 }
 return result;
}
module.exports={fromCtc,fromTimedRows,hash,prepare:api.prepare};
