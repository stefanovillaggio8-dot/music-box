#!/usr/bin/env node
'use strict';
// Replay measured ASR alternatives through the actual application save path.
// Human references score the result only; they never supply an observation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const arg=(k,d)=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const references=read(arg('references','references.json'));
const baselineFile=arg('baseline','baseline.json'),alternativeFile=arg('alternative','alternative.json');
const baseline=read(baselineFile),alternative=read(alternativeFile);
const additionalFile=arg('additional','');
const observations=[[baselineFile,baseline],[alternativeFile,alternative],...(additionalFile?[[additionalFile,read(additionalFile)]]:[])];
const context={};context.window=context;vm.createContext(context);
for(const f of ['word-karaoke.js','audio-lyrics-align.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const slice=(from,to)=>app.slice(app.indexOf(from),app.indexOf(to,app.indexOf(from)));
const parser=slice('  function parseSynced(','  function _righeTestoConParole(');
const getter=slice('  function _righeTestoConParole(','  const _ritardiTesti=');
const save=slice('  async function _salvaParoleDallAudio(','  /* Recupero graduale mentre');
const fixture=existing=>new Function('window','existing',`
 const currentId='song',lyricsData={song:existing},localLyrics={},db=null;
 const _testoLocaleVerificato=()=>localLyrics.song||existing;
 const $=()=>({hidden:true}),render=()=>{};
 const _haTempiParole=row=>window.MusicBoxWordKaraoke.hasWordTiming(row);
 ${parser}\n${getter}\n${save}
 return {save:_salvaParoleDallAudio,rows:()=>_righeTestoConParole(localLyrics.song||existing)};
`)(context,existing);
const normalize=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const stats=errors=>{
 const sorted=errors.map(Math.abs).sort((a,b)=>a-b),q=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
 return {count:errors.length,medianAbsoluteMs:q(.5),p95AbsoluteMs:q(.95)};
};
const cacheFor=(file,report,id)=>file+'.'+crypto.createHash('sha256').update(JSON.stringify(report.inference)).digest('hex').slice(0,12)+'.'+id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.asr.json';
const lrc=rows=>rows.map(r=>'['+String(Math.floor(r.start/60)).padStart(2,'0')+':'+(r.start%60).toFixed(3).padStart(6,'0')+'] '+r.text).join('\n');
(async()=>{
 const output={version:1,method:'actual application save/reload and context ownership; unchanged full and partial acoustic gates',implementedInBranchPlayer:true,publicDeployment:false,
  referenceLanguages:[...new Set(references.map(r=>r.language||'en'))],
  runtimeSha256:Object.fromEntries(['audio-lyrics-align.js','word-karaoke.js','app.js'].map(f=>
   [f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),
  limitation:'Additional ASR passes with manual phrase anchors; not independent Italian validation or physical phone inference. Estimated words are excluded.',cases:[]};
 for(const c of baseline.cases){
  const other=alternative.cases.find(a=>a.id===c.id),record=references.find(r=>r.name===c.record);
  if(!other||c.sourceAudioSha256!==other.sourceAudioSha256)throw Error('Alternative recording identity mismatch');
  if(!record||record.audioSha256&&record.audioSha256!==c.sourceAudioSha256)throw Error('Reference recording identity mismatch');
  const state=fixture({synced:lrc(record.lines)});
  for(const [file,report] of observations){
   if(report.cases.find(x=>x.id===c.id)?.sourceAudioSha256!==c.sourceAudioSha256)throw Error('Additional recording identity mismatch');
   const observed=read(cacheFor(file,report,c.id));
   const coreSeconds=report.inference.experimentalContext?.seconds||28;
   const passes=coreSeconds===28?[null]:Array.from({length:Math.ceil(28/coreSeconds)},(_,i)=>i*coreSeconds);
   for(const core of passes){
    const lo=core==null?0:Math.max(0,core-2),hi=core==null?28:Math.min(28,core+coreSeconds+2);
    const chunks=core==null?observed:context.MusicBoxAudioAlign.ownedContextWords(
     observed.map(w=>({...w,timestamp:w.timestamp.map(t=>t-lo)})),
     {kind:'context14',at:c.start+lo,coreStart:c.start+core,coreEnd:c.start+core+coreSeconds});
    const rows=state.rows(),offset=c.start+lo,seconds=hi-lo;
    const aligned=context.MusicBoxAudioAlign.alignWindow(rows,chunks,offset,seconds),sourceAt=r=>r.sourceT??r.t;
    const partial=context.MusicBoxAudioAlign.alignAcousticSpans(rows.map(row=>aligned.find(r=>Math.abs(sourceAt(r)-sourceAt(row))<.002)||row),chunks,offset,seconds);
    await state.save('song',[...aligned,...partial]);
   }
  }
  const errors=[];
  for(const line of record.lines.filter(l=>l.start>=c.start+.15&&l.start<c.start+26.9&&l.end<c.start+27.96)){
   const row=state.rows().find(r=>Math.abs((r.sourceT??r.t)-line.start)<.002&&r.text===line.text);
   if(!row||row.estimated===true)continue;
   const reference=record.words.filter(w=>w.start>=line.start-.001&&w.end<=line.end+.001),tokens=line.text.match(/\S+\s*/gu)||[];
   if(tokens.length!==reference.length||tokens.some((t,i)=>normalize(t)!==normalize(reference[i].text)))continue;
   const measured=context.MusicBoxWordKaraoke.hasWordTiming(row)?row.words.map((w,i)=>({...w,wordIndex:i})):row?.acousticSpans||[];
   for(const w of measured)errors.push({startErrorMs:1000*(w.t-reference[w.wordIndex].start),endErrorMs:1000*(w.end-reference[w.wordIndex].end)});
  }
  output.cases.push({id:c.id,category:c.category,referenceWords:c.referenceWords,acceptedWords:errors.length,errors});
 }
 const errors=output.cases.flatMap(c=>c.errors),total=output.cases.reduce((s,c)=>s+c.referenceWords,0);
 output.aggregate={referenceWords:total,acceptedWords:errors.length,coverage:errors.length/total,onset:stats(errors.map(e=>e.startErrorMs)),end:stats(errors.map(e=>e.endErrorMs))};
 fs.writeFileSync(arg('output','context-replay.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output.aggregate));
})().catch(e=>{console.error(e);process.exitCode=1});
