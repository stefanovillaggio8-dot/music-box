'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const source=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function fixture(){
 const c={crypto:crypto.webcrypto,TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout};c.window=c;vm.createContext(c);
 for(const f of ['word-karaoke.js','karaoke-acoustic-proof.js'])vm.runInContext(source(f),c);
 const api=c.MusicBoxAcousticProof,rows=[{t:1,text:'we watch heavy engines closely tonight'},{t:6,text:'another verse follows'}];
 const observations=rows[0].text.split(' ').map((text,i)=>({text,t:1+i*.5,end:1.3+i*.5}));
 return {c,api,rows,observations,async proof(){return {version:1,method:'ctc-observed-word-separator-v1',language:'en',audioSha256:'a'.repeat(64),
  lyricsSha256:await api.sha256(api.canonical(rows)),model:{name:'WAV2VEC2_ASR_BASE_960H',sha256:'488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d'},
  words:await Promise.all(observations.map(async(w,i)=>({rowIndex:0,sourceT:1,wordIndex:i,decodedSha256:await api.sha256(api.normalize(w.text)),
   t:w.t,end:w.end,confidence:.85,wholeFrameConfidence:.85,contextConfidence:.85,contextMaximumLogRatio:0,separatorConfidence:.95,greedyExact:true})))}}};
}
test('observed separators require real matching ASR intervals and retain exact measured boundaries',async()=>{
 const f=fixture(),proof=await f.api.prepare(await f.proof(),f.rows,'a'.repeat(64));
 assert.equal(f.api.proposals(f.rows,proof,[]).length,0);
 const spans=f.api.proposals(f.rows,proof,[f.observations])[0].acousticSpans;
 assert.equal(spans.length,6);for(const w of spans){assert.equal(w.t,f.observations[w.wordIndex].t);assert.equal(w.end,f.observations[w.wordIndex].end);}
 assert.equal(f.api.proposals(f.rows,proof,[f.observations],{start:10,end:20}).length,0);
});
test('different recordings, edited phrase anchors, lyrics and unpinned models fail closed',async()=>{
 const f=fixture(),p=await f.proof();
 assert.equal(await f.api.prepare(p,f.rows,'b'.repeat(64)),null);
 assert.equal(await f.api.prepare(p,[{...f.rows[0],t:1.1},f.rows[1]],'a'.repeat(64)),null);
 assert.equal(await f.api.prepare(p,[{...f.rows[0],text:'other words here'},f.rows[1]],'a'.repeat(64)),null);
 p.model.sha256='b'.repeat(64);assert.equal(await f.api.prepare(p,f.rows,'a'.repeat(64)),null);
});
test('forced substrings and missing or weak separators never become accepted words',async()=>{
 const f=fixture(),p=await f.proof();p.words[0].decodedSha256=await f.api.sha256('WEATHER');p.words[1].separatorConfidence=.79;p.words[2].end=NaN;
 const proof=await f.api.prepare(p,f.rows,'a'.repeat(64));
 assert.equal(proof.words.length,3);assert.equal(f.api.proposals(f.rows,proof,[f.observations]).length,0,'four-word minimum unchanged');
});
test('all previously accepted partial spans and full rows keep their timestamps',async()=>{
 const f=fixture(),p=await f.proof(),proof=await f.api.prepare(p,f.rows,'a'.repeat(64));
 const old=f.observations.slice(0,4).map((w,i)=>({...w,wordIndex:i,t:w.t+.01,end:w.end+.01}));
 const rows=[{...f.rows[0],partialAudio:true,acousticSpans:old},f.rows[1]];
 const result=f.api.proposals(rows,proof,[f.observations])[0];
 for(let i=0;i<4;i++){assert.equal(result.acousticSpans[i].t,old[i].t);assert.equal(result.acousticSpans[i].end,old[i].end);}
 rows[0]={...f.rows[0],words:f.observations.map((w,i)=>({...w,text:w.text+(i<5?' ':'')}))};
 assert.equal(f.c.MusicBoxWordKaraoke.hasWordTiming(rows[0]),true);assert.equal(f.api.proposals(rows,proof,[f.observations]).length,0);
});
test('one ASR word cannot corroborate two nearby repeated occurrences',async()=>{
 const f=fixture();f.rows[0].text='we we heavy engines closely tonight';f.observations[1]={...f.observations[0],t:1.04,end:1.34};
 const p=await f.proof(),proof=await f.api.prepare(p,f.rows,'a'.repeat(64));
 const result=f.api.proposals(f.rows,proof,[[f.observations[0],...f.observations.slice(2)]]);
 assert.equal(result[0].acousticSpans.length,4);assert.ok(result[0].acousticSpans.every(w=>w.wordIndex>=2));
});
test('confident CTC alone cannot certify an uncorroborated repeated phrase',async()=>{
 const f=fixture(),p=await f.proof();for(const w of p.words)w.confidence=w.wholeFrameConfidence=.95;
 const proof=await f.api.prepare(p,f.rows,'a'.repeat(64));assert.equal(f.api.proposals(f.rows,proof,[]).length,0);
 for(const w of p.words)w.contextMaximumLogRatio=3;
 const rejected=await f.api.prepare(p,f.rows,'a'.repeat(64));assert.equal(f.api.proposals(f.rows,rejected,[]).length,0);
});
test('loaded evidence is content-addressed, bounded and never deletes caches or downloads',async()=>{
 const f=fixture(),p=await f.proof(),bytes=new TextEncoder().encode(JSON.stringify(p)),hash=await f.api.sha256(bytes);const urls=[];
 const entry={path:'karaoke-acoustic/'+hash+'.json',sha256:hash,bytes:bytes.length};
 f.c.fetch=async url=>{urls.push(url);const data=url.includes('index')?new TextEncoder().encode(JSON.stringify({version:1,entries:{['a'.repeat(64)]:entry}})):bytes;
  return {ok:true,headers:{get:()=>data.length},arrayBuffer:async()=>data.buffer}};
 assert.ok(await f.api.load(f.rows,'a'.repeat(64)));assert.equal(urls.length,2);
 bytes[0]=0;assert.equal(await f.api.load(f.rows,'a'.repeat(64)),null);
 const other=fixture();other.c.fetch=async()=>{urls.push('index');const data=new TextEncoder().encode(JSON.stringify({version:1,entries:{['a'.repeat(64)]:{...entry,path:'../other-site/cache.json'}}}));return {ok:true,headers:{get:()=>data.length},arrayBuffer:async()=>data.buffer}};
 urls.length=0;assert.equal(await other.api.load(other.rows,'a'.repeat(64)),null);assert.equal(urls.length,1);
 const abort=new AbortController();abort.abort();urls.length=0;assert.equal(await f.api.load(f.rows,'a'.repeat(64),abort.signal),null);assert.equal(urls.length,0);
});
test('cancelling a foreground analysis aborts the in-flight optional fetch',async()=>{
 const f=fixture(),parent=new AbortController();let aborted=0;
 f.c.fetch=async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted++;reject(Error('Cancelled'));},{once:true}));
 const loading=f.api.load(f.rows,'a'.repeat(64),parent.signal);parent.abort();
 assert.equal(await loading,null);assert.equal(aborted,1);
});
test('precomputed ASR restores measured words over estimates and rejects a changed recognizer',async()=>{
 const f=fixture(),p=await f.proof();p.asr={model:'onnx-community/whisper-tiny_timestamped',revision:'517244293732ee2d58139af5814231b7e6830a0d',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}};
 p.recognizedRows=[{rowIndex:0,sourceT:1,t:1,partialAudio:false,words:f.observations.map((w,i)=>({wordIndex:i,t:w.t,end:w.end}))}];
 const estimated=f.c.MusicBoxWordKaraoke.estimateRows(f.rows),proof=await f.api.prepare(p,estimated,'a'.repeat(64));
 const loaded=f.api.recognizedRows(estimated,proof);assert.equal(loaded.length,1);assert.equal(loaded[0].words.length,6);assert.equal(loaded[0].estimated,false);
 assert.equal(f.api.recognizedRows([loaded[0],f.rows[1]],proof).length,0,'existing measured rows keep their own intervals');
 p.asr.revision='different';const changed=await f.api.prepare(p,estimated,'a'.repeat(64));assert.equal(f.api.recognizedRows(estimated,changed).length,0);
});
test('offline precomputed rows pass the real application save and preserve earlier partial intervals',async()=>{
 const f=fixture();f.rows.push({t:12,text:'your heart will always be here with me'});
 const original=f.observations.slice(0,4).map((w,i)=>({...w,wordIndex:i,t:+(w.t+.01).toFixed(3),end:+(w.end+.01).toFixed(3)}));
 const create=require('../tools/karaoke-application-fixture.cjs'),state=create(f.c)({synced:f.rows.map(r=>'[00:'+r.t.toFixed(3).padStart(6,'0')+'] '+r.text).join('\n'),
  wordRows:[{...f.rows[0],partialAudio:true,acousticSpans:original}]});
 const candidate={t:1,sourceT:1,text:f.rows[0].text,words:f.observations.map((w,i)=>({text:w.text+(i<5?' ':''),t:w.t,end:w.end}))};
 assert.equal(await state.save('song',[candidate]),1);
 const row=state.rows()[0];assert.equal(row.estimated,undefined);assert.equal(row.words.length,6);
 for(let i=0;i<4;i++){assert.equal(row.words[i].t,original[i].t);assert.equal(row.words[i].end,original[i].end);}
});
test('proof-only karaoke works without a GPU, decoder or worker and does not repeat MP3 reads',async()=>{
 const f=fixture(),p=await f.proof(),values=new Map(),events=new Map();
 f.rows.push({t:12,text:'your heart will always be here with me'});
 const audioBytes=new Uint8Array(20);p.audioSha256=await f.api.sha256(audioBytes);p.lyricsSha256=await f.api.sha256(f.api.canonical(f.rows));
 p.asr={model:'onnx-community/whisper-tiny_timestamped',revision:'517244293732ee2d58139af5814231b7e6830a0d',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}};
 p.recognizedRows=[{rowIndex:0,sourceT:1,t:1,partialAudio:false,words:f.observations.map((w,i)=>({wordIndex:i,t:w.t,end:w.end}))}];
 const bytes=new TextEncoder().encode(JSON.stringify(p)),hash=await f.api.sha256(bytes),asset='karaoke-acoustic/'+hash+'.json';let nativeRows=f.c.MusicBoxWordKaraoke.estimateRows(f.rows),saved=0,mp3Reads=0;
 const fetch=async url=>{
  if(String(url).endsWith('.mp3')){mp3Reads++;return {ok:true,headers:{get:()=>20},blob:async()=>({size:20,arrayBuffer:async()=>audioBytes.buffer})};}
  const data=String(url).includes('index')?new TextEncoder().encode(JSON.stringify({version:1,entries:{[p.audioSha256]:{path:asset,sha256:hash,bytes:bytes.length}},tracks:{song:[p.audioSha256]}})):bytes;
  return {ok:true,headers:{get:()=>data.length},arrayBuffer:async()=>data.buffer};
 };
 f.c.fetch=fetch;f.c.OfflineAudioContext=class{constructor(){throw Error('Proof must not decode audio')}};f.c.Worker=class{constructor(){throw Error('Proof must not launch inference')}};
 f.c.document={hidden:false,baseURI:'https://example.test/',getElementById:()=>null,addEventListener:(k,v)=>events.set(k,v)};f.c.navigator={onLine:false,userAgent:'iPhone'};f.c.URL=URL;f.c.requestIdleCallback=fn=>fn();
 f.c.sessionStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 f.c.MusicBoxBridge={profile:()=> 'Ste',currentId:()=> 'song',audio:()=>({duration:40}),allTracks:()=>[{id:'song'}],mixUrl:()=> 'https://example.test/song.mp3',lyricsData:()=>({synced:nativeRows}),
  saveAudioWordRows:async(id,rows)=>{saved++;nativeRows=[rows[0],...nativeRows.slice(1)];return rows.length}};
 vm.runInContext(source('audio-lyrics-align.js'),f.c);assert.equal(f.c.MusicBoxAudioAlign.request('song'),true);
 for(let i=0;i<40&&f.c.MusicBoxAudioAlign.diagnostics().activeAnalyses;i++)await new Promise(resolve=>setTimeout(resolve,2));
 assert.equal(saved,1);assert.equal(mp3Reads,1);assert.equal(nativeRows[0].estimated,false);assert.equal(nativeRows[0].words.length,6);
 const diagnostics=f.c.MusicBoxAudioAlign.diagnostics();assert.equal(diagnostics.workerAlive,false);assert.equal(diagnostics.completedSessionWindows,0);assert.equal(diagnostics.pendingInference,0);
 f.c.MusicBoxAudioAlign.cancel();const later=Date.now()+60000;f.c.Date=class extends Date{static now(){return later}};
 assert.equal(f.c.MusicBoxAudioAlign.request('song'),true);await new Promise(setImmediate);assert.equal(mp3Reads,1);
});
test('a superseded track during proof download cannot decode audio or save stale lyrics',{timeout:3000},async()=>{
 let id='song',release,decoded=0,saved=0;const values=new Map();
 let started;const waiting=new Promise(resolve=>started=resolve);
 const window={Worker:class{},crypto:crypto.webcrypto,MusicBoxAcousticProof:{load:()=>new Promise(resolve=>{release=resolve;started()})},
  OfflineAudioContext:class{decodeAudioData(){decoded++}},MusicBoxBridge:{currentId:()=>id,profile:()=> 'Ste',audio:()=>({duration:40}),
   allTracks:()=>[{id:'song'}],mixUrl:()=> 'https://example.test/song.mp3',saveAudioWordRows:()=>saved++,lyricsData:()=>({synced:[
    {t:1,text:'the words you know and never want'},{t:7,text:'your heart will always be with me'},{t:16,text:'another first verse when we are here'}]})}};
 const c={window,document:{hidden:false,baseURI:'https://example.test/',getElementById:()=>null,addEventListener:()=>{}},navigator:{onLine:true,gpu:{},userAgent:'iPhone'},URL,AbortController,setTimeout,clearTimeout,
  requestIdleCallback:fn=>fn(),sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},
  fetch:async()=>({ok:true,headers:{get:()=>null},blob:async()=>({size:20,arrayBuffer:async()=>new ArrayBuffer(20)})})};
 vm.runInNewContext(source('audio-lyrics-align.js'),c);assert.equal(window.MusicBoxAudioAlign.request('song'),true);
 await waiting;
 assert.ok(release);id='different';release(null);await new Promise(setImmediate);
 assert.equal(decoded,0);assert.equal(saved,0);assert.equal(window.MusicBoxAudioAlign.diagnostics().activeAnalyses,0);
});


test('supplemental offline corroboration is source-bound and cannot load an unpinned model on the phone',async()=>{
 const f=fixture(),p=await f.proof();
 p.asr={model:'onnx-community/whisper-tiny_timestamped',revision:'517244293732ee2d58139af5814231b7e6830a0d',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'},
  supplementalCtcCorroborator:{method:'ctc-only-after-original-v1',model:'onnx-community/whisper-base_timestamped',revision:'608c49e61301901684bc36cac8f74b95ff6b5a8e',dtype:{encoder_model:'fp32',decoder_model_merged:'q4'}}};
 p.recognizedRows=[{rowIndex:0,sourceT:1,t:1,partialAudio:false,words:f.observations.map((w,i)=>({wordIndex:i,t:w.t,end:w.end}))}];
 f.c.fetch=()=>{throw Error('No model or PCM download is necessary to load observations')};
 const proof=await f.api.prepare(p,f.rows,'a'.repeat(64));assert.equal(f.api.recognizedRows(f.rows,proof)[0].words.length,6);
 assert.equal(await f.api.prepare(p,f.rows,'b'.repeat(64)),null);
 for(const mutate of [x=>x.revision='main',x=>x.model='other',x=>x.method='asr-estimate',x=>x.dtype.decoder_model_merged='fp32']){
  const changed=structuredClone(p);mutate(changed.asr.supplementalCtcCorroborator);
  const rejected=await f.api.prepare(changed,f.rows,'a'.repeat(64));assert.equal(f.api.recognizedRows(f.rows,rejected).length,0);
 }
});
