/* Optional offline acoustic observations. No inference/model download here. */
(function(root){
'use strict';
const verified=new WeakSet(),finite=Number.isFinite;
const MODEL='WAV2VEC2_ASR_BASE_960H';
const sourceTime=r=>Number(r?.sourceT??r?.t);
const normalize=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/[^A-Z']/g,'');
const ordered=rows=>rows.slice().sort((a,b)=>sourceTime(a)-sourceTime(b));
const canonical=rows=>JSON.stringify(ordered(rows).map(r=>[sourceTime(r).toFixed(3),String(r.text||'').trim()]));
async function sha256(value){
 const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
 const digest=await root.crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
async function prepare(proof,rows,audioSha256,signal){
 if(signal?.aborted||!root.crypto?.subtle||!Array.isArray(rows)||!rows.length||proof?.version!==1||
    proof.method!=='ctc-observed-word-separator-v1'||proof.language!=='en'||
    !/^[a-f0-9]{64}$/.test(audioSha256)||proof.audioSha256!==audioSha256||
    proof.model?.name!==MODEL||proof.model?.sha256!=='488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d'||
    proof.lyricsSha256!==await sha256(canonical(rows))||!Array.isArray(proof.words)||proof.words.length>2000)return null;
 const words=[],unique=new Set(),original=ordered(rows),counts=new Map();
 for(const w of proof.words){const key=w.rowIndex+'|'+w.wordIndex;counts.set(key,(counts.get(key)||0)+1);}
 for(const w of proof.words){
  if(signal?.aborted)return null;
  const row=original[w.rowIndex],tokens=String(row?.text||'').match(/\S+\s*/gu)||[];
  const key=w.rowIndex+'|'+w.wordIndex;
  if(!row||!Number.isInteger(w.rowIndex)||!Number.isInteger(w.wordIndex)||w.wordIndex<0||w.wordIndex>=tokens.length||unique.has(key)||counts.get(key)!==1||
     !finite(w.sourceT)||Math.abs(w.sourceT-sourceTime(row))>.001||
     ![w.t,w.end,w.confidence,w.wholeFrameConfidence,w.contextConfidence,w.contextMaximumLogRatio,w.separatorConfidence].every(finite)||
     w.confidence<.8||w.confidence>1||w.wholeFrameConfidence<.8||w.wholeFrameConfidence>1||
     w.separatorConfidence<.8||w.separatorConfidence>1||w.contextConfidence<0||w.contextConfidence>1||w.contextMaximumLogRatio<0||w.end-w.t<.035||w.end-w.t>.8||
     w.t<sourceTime(row)-.45||w.end>(sourceTime(original[w.rowIndex+1])||sourceTime(row)+27)+.4)continue;
  const token=normalize(tokens[w.wordIndex]);
  // This is the entire freely decoded word BETWEEN separators, not a
  // substring forced into a longer recognized word ("in" in "thing").
  if(!token||w.decodedSha256!==await sha256(token))continue;
  unique.add(key);words.push(Object.freeze({...w,key,text:tokens[w.wordIndex],normalized:token}));
 }
 const recognized=[];
 if(proof.asr?.model==='onnx-community/whisper-tiny_timestamped'&&
    proof.asr?.revision==='517244293732ee2d58139af5814231b7e6830a0d'&&
    proof.asr?.dtype?.encoder_model==='fp32'&&proof.asr?.dtype?.decoder_model_merged==='q4'&&
    Array.isArray(proof.recognizedRows)&&proof.recognizedRows.length<=800){
  for(const saved of proof.recognizedRows){
   const row=original[saved.rowIndex],tokens=String(row?.text||'').match(/\S+\s*/gu)||[];
   if(!row||!Number.isInteger(saved.rowIndex)||!finite(saved.sourceT)||Math.abs(sourceTime(row)-saved.sourceT)>.001||!Array.isArray(saved.words))continue;
   const spans=saved.words.map(w=>({wordIndex:w.wordIndex,text:tokens[w.wordIndex],t:w.t,end:w.end}));
   if(spans.some(w=>!Number.isInteger(w.wordIndex)||w.wordIndex<0||w.wordIndex>=tokens.length||![w.t,w.end].every(finite)))continue;
   const candidate=saved.partialAudio?{...row,estimated:false,t:saved.sourceT,sourceT:saved.sourceT,partialAudio:true,acousticSpans:spans}:
    {...row,estimated:false,t:saved.t,sourceT:saved.sourceT,words:spans.map(w=>({text:w.text,t:w.t,end:w.end}))};
   const engine=root.MusicBoxWordKaraoke;
   if(candidate.words&&(spans.length!==tokens.length||spans.some((w,i)=>w.wordIndex!==i)))continue;
   if(engine?.hasWordTiming(candidate)||engine?.hasPartialTiming(candidate)){
    for(const w of candidate.words||candidate.acousticSpans)Object.freeze(w);
    Object.freeze(candidate.words||candidate.acousticSpans);recognized.push(Object.freeze(candidate));
   }
  }
 }
 const result=Object.freeze({audioSha256,canonical:canonical(rows),words:Object.freeze(words),recognized:Object.freeze(recognized)});
 verified.add(result);return result;
}
function proposals(rows,proof,observations=[],range=null){
 const engine=root.MusicBoxWordKaraoke;
 if(!engine||!verified.has(proof)||canonical(rows)!==proof.canonical)return [];
 const seen=new Set(),observed=[];
 for(const w of observations.flat()){
  if(!finite(w?.t)||!finite(w?.end))continue;
  const n=normalize(w.text||w.key),key=n+'|'+w.t+'|'+w.end;
  if(n&&!seen.has(key)){seen.add(key);observed.push({...w,n});}
 }
 const matches=w=>observed.filter(u=>u.n===w.normalized&&Math.abs(u.t-w.t)<=.15&&Math.abs(u.end-w.end)<=.20);
 const eligible=proof.words.map(w=>({...w,rowIndex:rows.findIndex(r=>Math.abs(sourceTime(r)-w.sourceT)<.001)})).filter(w=>{
  if(w.rowIndex<0)return false;
  const row=rows[w.rowIndex];
  return (!range||w.t>=range.start&&w.end<=range.end)&&
   !(row&&!row.estimated&&engine.hasWordTiming(row))&&!row.acousticSpans?.some(u=>u.wordIndex===w.wordIndex);
 });
 const result=[];
 for(let rowIndex=0;rowIndex<rows.length;rowIndex++){
  const row=rows[rowIndex];if(!row.estimated&&engine.hasWordTiming(row))continue;
  const found=new Map((row.acousticSpans||[]).map(w=>[w.wordIndex,w])),before=found.size;
  for(const w of eligible.filter(w=>w.rowIndex===rowIndex)){
   const corroborated=matches(w).some(u=>!eligible.some(v=>v.key!==w.key&&v.normalized===u.n&&
     Math.abs(u.t-v.t)<=.15&&Math.abs(u.end-v.end)<=.20));
   // Even very confident forced CTC can land on the wrong repeated phrase.
   // Require an independent freely recognized ASR word in the same interval.
   if(!corroborated)continue;
   // Never move an accepted neighbour to make room for a new observation.
   if([...found.values()].some(u=>u.wordIndex<w.wordIndex&&u.t>w.t||u.wordIndex>w.wordIndex&&u.t<w.t))continue;
   found.set(w.wordIndex,{wordIndex:w.wordIndex,text:w.text,t:w.t,end:w.end});
  }
  if(found.size===before)continue;
  const candidate={...row,estimated:false,t:sourceTime(row),sourceT:sourceTime(row),partialAudio:true,
    acousticSpans:[...found.values()].sort((a,b)=>a.wordIndex-b.wordIndex)};
  if(engine.hasPartialTiming(candidate))result.push(candidate);
 }
 return result;
}
function recognizedRows(rows,proof){
 const engine=root.MusicBoxWordKaraoke;
 if(!engine||!verified.has(proof)||canonical(rows)!==proof.canonical)return [];
 return proof.recognized.filter(candidate=>{
  const row=rows.find(r=>Math.abs(sourceTime(r)-sourceTime(candidate))<.001);
  return row&&(row.estimated||!engine.hasWordTiming(row))&&(!engine.hasPartialTiming(row)||
   candidate.words||candidate.acousticSpans.some(w=>!row.acousticSpans.some(v=>v.wordIndex===w.wordIndex)));
 });
}
let cachedIndex=null;
async function readIndex(signal){
 if(cachedIndex)return cachedIndex;
 const response=await root.fetch('./karaoke-acoustic-index.json',{cache:'force-cache',signal});
 if(!response.ok||Number(response.headers.get('content-length'))>96000)throw Error('Acoustic index unavailable');
 const bytes=await response.arrayBuffer();if(bytes.byteLength>96000)throw Error('Acoustic index size');
 const index=JSON.parse(new TextDecoder().decode(bytes));
 if(index.version!==1||!index.entries)throw Error('Acoustic index schema');
 cachedIndex=index;return index;
}
async function available(id,signal){
 const controller=new AbortController(),abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,1200);
 try{return !signal?.aborted&&!!(await readIndex(controller.signal)).tracks?.[id];}
 catch(_){return false;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
async function load(rows,audioSha256,signal){
 if(signal?.aborted)return null;
 const controller=new AbortController(),abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});
 const timeout=setTimeout(abort,1200);
 try{
  const bounded=async(url,limit)=>{
   const response=await root.fetch(url,{cache:'force-cache',signal:controller.signal});
   if(!response.ok||Number(response.headers.get('content-length'))>limit)throw Error('Acoustic proof unavailable');
   const bytes=await response.arrayBuffer();if(bytes.byteLength>limit)throw Error('Acoustic proof size');return bytes;
  };
  const index=await readIndex(controller.signal);
  const entry=index.version===1&&index.entries?.[audioSha256];
  if(!entry||!/^karaoke-acoustic\/[a-f0-9]{64}\.json$/.test(entry.path)||
     !/^[a-f0-9]{64}$/.test(entry.sha256)||entry.bytes>512000)return null;
  const bytes=await bounded('./'+entry.path,512000);
  if(controller.signal.aborted||bytes.byteLength!==entry.bytes||await sha256(bytes)!==entry.sha256)return null;
  return await prepare(JSON.parse(new TextDecoder().decode(bytes)),rows,audioSha256,controller.signal);
 }catch(_){return null;}finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
}
root.MusicBoxAcousticProof={canonical,normalize,sha256,prepare,proposals,recognizedRows,available,load};
})(typeof window!=='undefined'?window:globalThis);
