"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const dj=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
test("LRCLIB search uses first artist and never exact-get after successful empty search",()=>{
 const from=app.indexOf('const endpoint = "https://lrclib.net"'),to=app.indexOf("if (options.syncedOnly) return null;",from);
 const block=app.slice(from,to);
 assert.match(block,/const searches=\[makeSearch\(firstArtist\)\]/);
 assert.match(block,/if\(!searchWorked&&Date\.now\(\)>=_lrclibNonPrimaDi\)/);
 assert.match(block,/\/api\/search\?track_name=/);
 assert.match(block,/fullArtist\.split\(/);
 assert.match(app,/remix\|rmx\|visual\|visualizer/);
});
test("unchanged DJ index refresh retains planned desktop transition",()=>{
 const from=dj.indexOf("function loadDeepIndex("),to=dj.indexOf("function canSaveAnalysis(",from);
 const code=dj.slice(from,to);
 assert.match(code,/if\(enabled&&!mixing&&changed\)/);
 assert.match(code,/JSON\.stringify\(beforeNow\)/);
 assert.match(code,/JSON\.stringify\(beforeNext\)/);
});
test("normal handoff is clearly distinguished from real beat mix",()=>{
 assert.match(dj,/Sovrapposizione audio avviata/);
 assert.match(dj,/audio\.duration-audio\.currentTime<=45&&/);
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,"..","versione.json"),"utf8")).versione;
 assert.ok(dj.includes('musicBoxVersion:"'+version+'"'),"DJ diagnostics must match the app release");
});


test("redundant featuring credits are cleaned only for lyric provider search",()=>{
 const from=app.indexOf("function _titoloPulitoPerTesti(");
 const end=app.indexOf("async function findLyrics(",from);
 assert.ok(from>0&&end>from);
 const normalize=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 const fn=new Function("stripVariants","normKey",app.slice(from,end)+
  "return _titoloPulitoPerTesti;")(s=>String(s).trim(),normalize);
 assert.equal(fn("Nayt, 3D","senza armi ft nayt"),"senza armi");
 assert.equal(fn("Nayt, 3D","senza armi ft altri"),"senza armi ft altri");
 assert.equal(fn("Nayt","senza armi"),"senza armi");
});
test("unreachable lyric services enter independent provider cooldown",()=>{
 assert.match(app,/mb\.lyricsOvhAttesaFino/);
 assert.match(app,/_attendiLyricsOvh\(300000\)/);
 assert.match(app,/_segnaLyricsOvhMancante\(chiaveLyricsOvh\)/);
 assert.match(app,/!\/\[,\/&\]\/\.test\(artistaCompleto\)/);
});

test("per-track lyric delay is durable and does not alter other songs",()=>{
 const start=app.indexOf("const _ritardiTesti=new Map();");
 const end=app.indexOf("function activeLineIndex(",start);
 assert.ok(start>0&&end>start);
 const memory=new Map();
 const make=new Function("store",
  'const LS={get:(k,d)=>store.has(k)?JSON.parse(store.get(k)):d,'+
  'set:(k,v)=>store.set(k,JSON.stringify(v))};'+
  'let profile="Ste",currentId="song-a",lyricActive=-1;'+
  'const lyricLines=[],$=()=>null,tickLyrics=()=>{};'+
  app.slice(start,end)+
  'return {get:id=>_ritardoTesto(id),set:(id,n)=>_impostaRitardoTesto(id,n)};');
 const one=make(memory);
 assert.equal(one.get("song-a"),0,"default LRC offset must not add artificial latency");
 one.set("song-a",1.2);
 one.set("song-b",-.4);
 assert.equal(one.get("song-a"),1.2);
 assert.equal(one.get("song-b"),-.4);
 assert.equal(make(memory).get("song-a"),1.2,"survive reload");
 assert.equal(make(memory).get("song-c"),0,"unrelated track keeps the LRC recording time");
});
test("both lyrics views share the corrected clock without scaling the LRC",()=>{
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(app,/activeLineIndex\(now-_ritardoTesto\(currentId\)\)/);
 assert.match(immersive,/const adjusted=time-\(Number\.isFinite\(delay\)\?delay:0\)/);
 assert.doesNotMatch(app,/const fattore = \(dur - 2\) \/ ultimo/);
 assert.match(html,/id="lyricsDelay"/);
 assert.match(html,/id="lyricsMode"/);
 assert.match(html,/id="lyricsProgressFill"/);
});

test("karaoke timing changes persist locally and sync to the dedicated cloud endpoint",()=>{
 const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 assert.match(app,/musicbox-lyric-timing/);
 assert.match(app,/async function _sincronizzaRitardiTestiCloud/);
 assert.match(app,/_segnalaModificaRitardoCloud\(id\)/);
 assert.match(app,/window\.addEventListener\("online"/);
 assert.match(app,/_ritardiCloudAggiornati/);
 assert.match(html,/id="lyricsSyncStatus"/);
 // A confirmation must remain above a lyrics overlay, and the sheet
 // must have a keyboard path out even when the mouse is unavailable.
 assert.match(css,/\.lyrics-overlay\{z-index:100!important/);
 assert.match(app,/e\.key==="Escape"&&!\$\("lyricsPanel"\)\.hidden/);
 assert.match(app,/function closeLyrics\(\) \{[\s\S]{0,160}syncNoScroll\(\)/);
});

test("DJ extra analysis budget respects iPhone/desktop limits and admits new imports",()=>{
 const from=dj.indexOf(" const extra=unknown.length?");
 const to=dj.indexOf(" const measured=indexed.slice();",from);
 assert.ok(from>0&&to>from,"candidate selection code must be extractable");
 const select=new Function("unknown","sequence","recentLibraryIds","isIOS",
  dj.slice(from,to)+"\\nreturn picked.map(t=>t.id);".replace(/\\n/g,"\n"));
 const unknown=[
  {id:"queued",aggiunto:1},
  {id:"new-a",aggiunto:Date.now()},
  {id:"new-b",aggiunto:Date.now()-100},
  ...Array.from({length:50},(_,i)=>({id:"older-"+i,aggiunto:2+i}))
 ];
 const next=[unknown[0]];
 const recent=["new-a","new-b"];
 const iphone=select(unknown,next,recent,true);
 assert.equal(iphone.length,2,"iPhone must never decode more than 2 extra MP3s");
 assert.deepEqual(iphone,["queued","new-a"],"scheduled and newly imported music both stay eligible");
 const desktop=select(unknown,next,recent,false);
 assert.ok(desktop.length<=8&&desktop.length>2,"desktop analysis stays bounded");
 assert.ok(desktop.includes("new-a")&&desktop.includes("new-b"));
 assert.equal(new Set(desktop).size,desktop.length,"no duplicate candidate decoding");
});

test("full lyrics are available even when karaoke timestamps exist",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 assert.match(app,/let _vistaTestiCompleta=LS\.get\("mb\.lyricsFullView",false\)===true/);
 assert.match(app,/const useSynced=synced\.length>0&&!_vistaTestiCompleta/);
 assert.match(app,/classList\.toggle\("lyrics-full-view",!useSynced\)/);
 assert.match(app,/const heading=document\.createElement\("h3"\)/);
 assert.match(app,/className="lyrics-verse"/);
 for(const id of ["lyricsViewToggle","lyricsReadingTools","lyricsFontDown","lyricsFontUp",
                  "lyricsReadTop","lyricsReadingCount","lyricsReadingProgress"]){
   assert.ok(html.includes('id="'+id+'"'),"missing reader control "+id);
 }
 assert.match(css,/grid-template-columns:minmax\(268px,34%\)/);
 assert.match(css,/\.lyrics-full-view \.lyrics-body\.lyrics-plain/);
 assert.match(css,/@media\(max-width:760px\)/);
});
test("shared catalog reconciliation avoids playback and identifies local-only items",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(app,/localDeviceOnlyIds:visible\.filter/);
 assert.match(app,/sharedVisibleCount:visible\.filter/);
 assert.match(app,/cloudLinkIds:visible\.filter/);
 assert.match(app,/const _syncCatalogWhenIdle=/);
 assert.match(app,/\(audio&&!audio\.paused\)/);
 assert.match(app,/const urls=\["\.\/online-imports\.json\?v="/);
 assert.match(html,/id="mbCatalogOrigin"/);
});

test("lyrics reading mode has a visible back button and a dark premium theme",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 assert.match(html,/<button[^>]*id="lyricsBack"[^>]*>← Indietro<\/button>/);
 assert.match(app,/\$\("lyricsBack"\)\?\.addEventListener\("click", closeLyrics\)/);
 assert.match(css,/\.lyrics-back-btn\{/);
 assert.match(css,/\/\* Music Box 6\.697 — Velvet Nights lyrics experience/);
 assert.match(css,/\.lyrics-full-view \.lyrics-body\.lyrics-plain\{\s*background:radial-gradient/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("private device-only MP3s remain visible but are not presented as synced",()=>{
 assert.match(app,/const localDeviceOnly=libraryAll\.filter\(t=>!t\.builtin/);
 assert.match(app,/const commonCount=Math\.max\(0,total-localDeviceOnly\.length\)/);
 assert.match(app,/condivisi · \+"/);
 assert.match(app,/totale "\+total/);
 assert.match(app,/localDeviceOnlyIds:visible\.filter/);
});

test("device reference exposes real ID differences rather than guessed local count",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(html,/id="btnCompareQuick"/);
 assert.match(app,/let _mbCatalogReference=null/);
 assert.match(app,/function _mbAggiornaBadgeCatalogo\(\)/);
 assert.match(app,/const publishedImports=await _braniYouTubePubblicati\(true\)/);
 assert.match(app,/ID EXTRA \(fuori dal riferimento\)/);
 assert.match(app,/ID MANCANTI dal dispositivo/);
 assert.match(app,/await _mbConfrontaCatalogoConWorker\(true\)/);
 assert.match(app,/function _mbConfrontaCatalogoConWorker\(silent=false\)/);
});

test("cross-device reference includes the shared cloud import records",()=>{
 assert.match(app,/async function _ytBraniDalCloud\(owner,force=false\)/);
 assert.match(app,/_ytCloudFetchState\[owner\]=\{ok:true/);
 assert.match(app,/async function _ytRicaricaLibreriaCloud\(force=false\)/);
 assert.match(app,/setTimeout\(\(\)=>_ytRicaricaLibreriaCloud\(true\),1400\)/);
 assert.match(app,/const cloudRows=await _ytBraniDalCloud\(profile,true\)/);
 assert.match(app,/const refId=b=>b\._cloudReferenceId\|\|_idBranoStabile\(b\)/);
 assert.match(app,/referenceSource\+=" \+ cloud"/);
});

test("LRC karaoke runs on the real audio clock, not timeupdate alone",()=>{
 assert.match(app,/function _precisioneKaraokeFrame\(\)/);
 assert.match(app,/requestAnimationFrame\(_precisioneKaraokeFrame\)/);
 assert.match(app,/if\(_precisioneKaraokeId\)cancelAnimationFrame\(_precisioneKaraokeId\)/);
 assert.match(app,/if\(document.hidden\)_fermaKaraokePrecisione\(\)/);
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 assert.match(immersive,/requestAnimationFrame\(precisionLyrics\)/);
 assert.match(immersive,/cancelAnimationFrame\(lyricAnimation\)/);
});
test("LRC provider ranks the right recording by file duration, not first search hit",()=>{
 const start=app.indexOf("    const choose = (arr) => {",app.indexOf("async function findLyrics("));
 const end=app.indexOf("    /* Lookup immediato",start);
 assert.ok(start>0&&end>start);
 const choose=new Function("arr","options","duration",
  "const artist='Singer',name='Example Song';"+
  "const normKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');"+
  "const validate=j=>!!j.syncedLyrics;"+
  "const parseSynced=s=>s.split('|').map(x=>({t:Number(x)}));"+
  app.slice(start,end)+"return choose(arr);");
 const items=[
  {trackName:"Example Song",artistName:"Singer",duration:161,syncedLyrics:"5|30|90"},
  {trackName:"Example Song",artistName:"Singer",duration:176,syncedLyrics:"5|30|90"},
  {trackName:"Example Song (Live)",artistName:"Singer",duration:175,syncedLyrics:"5|30|90"}
 ];
 assert.equal(choose(items,{syncedOnly:true},176),items[1]);
 assert.match(app,/const playingDuration=options.trackId===currentId&&audio&&/);
});

test("word-level lyricsfile parser keeps actual word starts, spaces, and apostrophes",()=>{
 const win={};
 new Function("window","globalThis",
  fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8"))(win,win);
 const engine=win.MusicBoxWordKaraoke;
 const example=[
  "version: '1.0'","metadata:","  title: Test","lines:",
  "  - text: 'It''s a test'","    words:",
  "      - text: \"It's \"","        start_ms: 1000","        end_ms: 1350",
  "      - text: 'a '","        start_ms: 1350",
  "      - text: test","        start_ms: 1520","        end_ms: 1890",
  "    start_ms: 1000","    end_ms: 1890",
  "  - text: Another line","    start_ms: 2050","    words:",
  "      - text: 'Another '","        start_ms: 2050",
  "      - text: line","        start_ms: 2500",
  "plain: |","  It's a test"
 ].join("\n");
 const data=engine.parseLyricsfile(example);
 assert.equal(data.length,2);
 assert.equal(data[0].text,"It's a test");
 assert.deepEqual(data[0].words.map(x=>x.t),[1,1.35,1.52]);
 assert.deepEqual(data[0].words.map(x=>x.end),[1.35,undefined,1.89]);
 assert.equal(data[1].words[1].text,"line");
});
test("enhanced LRC word timing is exact; ordinary LRC does not invent words",()=>{
 const win={};
 new Function("window","globalThis",
  fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8"))(win,win);
 const api=win.MusicBoxWordKaraoke;
 const enhanced="[00:12.30]<00:12.30>Hello <00:12.80>world\n"+
  "[00:15.10]<00:15.10>Next <00:15.50>sentence";
 const parsed=api.parseEnhancedLrc(enhanced);
 assert.equal(parsed.length,2);
 assert.deepEqual(parsed[0].words.map(w=>w.t),[12.3,12.8]);
 assert.equal(parsed[0].text,"Hello world");
 assert.equal(api.parseEnhancedLrc("[00:12.30] Hello world")[0].words,undefined);
 assert.equal(api.fromRecord({syncedLyrics:"[00:12.30] Hello world"}).length,0);
 assert.equal(api.fromRecord({syncedLyrics:enhanced}).length,2);
});
test("word display rejects wrong text/timestamps and only paints trusted words",()=>{
 const win={};
 new Function("window","globalThis",
  fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8"))(win,win);
 const engine=win.MusicBoxWordKaraoke;
 const doc={createElement:()=>({style:{setProperty(k,v){this[k]=v}},textContent:""})};
 const mount={children:[],appendChild(node){this.children.push(node)},textContent:""};
 const row={t:1,end:2,text:"Turn on",words:[
  {t:1,end:1.5,text:"Turn "},{t:1.5,end:2,text:"on"}
 ]};
 const elements=engine.spanWords(doc,row,mount);
 assert.equal(elements.length,2);
 engine.paintWords(row,elements,1.25);
 assert.equal(elements[0].style["--karaoke-fill"],"50%");
 assert.equal(elements[1].style["--karaoke-fill"],"0%");
 engine.paintWords(row,elements,1.75);
 assert.equal(elements[0].style["--karaoke-fill"],"100%");
 assert.equal(elements[1].style["--karaoke-fill"],"50%");
 const invalid={...row,text:"Different words"};
 assert.deepEqual(engine.spanWords(doc,invalid,{appendChild(){},textContent:""}),[]);
 assert.equal(engine.parseLyricsfile("version: '1.0'\nlines:\n - text: Broken\n   start_ms: -42").length,0);
});
test("word-synced karaoke persists locally, upgrades on demand and renders in both views",()=>{
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,"..","versione.json"),"utf8")).versione;
 assert.match(version,/^6\.\d+$/);
 assert.ok(app.includes('const APP_VERSION = "'+version+'"'));
 const revision=version.replace(/\D/g,"");
 assert.ok(html.includes("mix-intelligente.js?v="+revision));
 assert.ok(sw.includes('const CACHE = "spotifynonavraiimieisoldi-v'+revision+'";'));
 assert.match(app,/wordRows:r\.wordRows\|\|\[\]/);
 assert.match(app,/wordRows: risultato\.wordRows \|\| \[\]/);
 assert.match(app,/wordSyncOnly:true,syncedOnly:true/);
 assert.match(app,/requestWordLyrics:\(id\)=>\{/);
 assert.match(app,/_verificaParoleKaraoke\(song\)\.finally/);
 assert.match(app,/engine\?\.fromRecord\(j\)/);
 assert.match(app,/window\.MusicBoxWordKaraoke\?\.spanWords\(document,line,p\)/);
 assert.match(immersive,/window\.MusicBoxWordKaraoke\?\.paintWords/);
 assert.match(immersive,/PAROLA PER PAROLA/);
 assert.match(html,/word-karaoke\.js\?v=\d+/);
 assert.match(sw,/word-karaoke\.js\?v=\d+/);
 assert.match(css,/\.lyr-line\.on \.karaoke-word/);
 assert.match(css,/\.im-line\.active \.karaoke-word/);
});

test("offline Whisper word alignment accepts only exact transcript matching LRC line",()=>{
 const fake={};
 new Function("window","globalThis",
   fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8"))(fake,fake);
 const align=fake.MusicBoxAudioAlign.alignWindow;
 const rows=[{t:2,text:"Questa è la mia canzone"},{t:8,text:"Un'altra riga ancora"}];
 const good=[
  {text:" Questa",timestamp:[2.12,2.51]},
  {text:" è",timestamp:[2.52,2.63]},
  {text:" la",timestamp:[2.64,2.75]},
  {text:" mia",timestamp:[2.76,3.07]},
  {text:" canzone",timestamp:[3.08,3.63]},
  {text:" Un'altra",timestamp:[8.13,8.66]},
  {text:" riga",timestamp:[8.67,9.10]},
  {text:" ancora",timestamp:[9.11,9.71]}
 ];
 const ok=align(rows,good,0,28);
 assert.equal(ok.length,2);
 assert.equal(ok[0].words.length,5);
 assert.equal(ok[0].words[0].t,2.12);
 assert.equal(ok[0].words.map(w=>w.text).join(""),rows[0].text);
 assert.equal(align(rows,[{text:" what",timestamp:[2.1,2.3]}],0,28).length,0);
 const late=good.map(w=>({...w,timestamp:w.timestamp.map(t=>t+2)}));
 assert.equal(align(rows,late,0,28).length,0,"repeated choruses must not shift lyric times by two seconds");
});
test("word-level ASR analysis rejects wrong lyrics, preserves LRCLIB and audio playback",()=>{
 const audio=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const worker=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-worker.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 assert.match(worker,/whisper-tiny/);
 assert.match(worker,/return_timestamps:"word"/);
 assert.match(audio,/navigator\.gpu/);
 assert.match(audio,/window\.MusicBoxBridge\?\.audio/);
 assert.match(audio,/const budget=isPhone\?1:3/);
 assert.match(audio,/saveAudioWordRows\?\.\(id,aligned\)/);
 assert.match(app,/saveAudioWordRows:\(id,rows\)=>_salvaParoleDallAudio/);
 assert.match(app,/if\(kept\?\.words\?\.length>=2&&!kept\.estimated\)return kept/);
 assert.match(html,/audio-lyrics-align\.js\?v=\d+/);
 assert.match(sw,/audio-lyrics-worker\.js\?v=\d+/);
 assert.match(html,/id="lyricsAudioStatus"/);
});

test("automatic audio analysis samples at most one window on iPhone when no words match",async()=>{
 const module=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const values=new Map(),get=k=>values.get(k)||null,put=(k,v)=>values.set(k,String(v));
 let workers=0,segments=0,saved=0,fetched="",closed=false;
 const track={id:"s",title:"Original",artist:"Singer",url:"songs/test.mp3"};
 const lines=[
  {t:4,text:"Three short words"},{t:8,text:"Another three words"},
  {t:37,text:"More lyrics here"},{t:66,text:"One last verse"}
 ];
 const pcm=new Float32Array(16000*95);
 class MockWorker{
  constructor(){workers++}
  postMessage(message){
   segments++;
   queueMicrotask(()=>this.onmessage({data:{id:message.id,chunks:[
    {text:" wrong",timestamp:[4.1,4.3]},
    {text:" sound",timestamp:[4.4,4.8]},
    {text:" words",timestamp:[4.9,5.2]}
   ]}}));
  }
  terminate(){}
 }
 class MockAudio{
  async decodeAudioData(){return {sampleRate:16000,duration:95,length:pcm.length,
    numberOfChannels:1,getChannelData:()=>pcm}}
  async close(){closed=true}
 }
 const bridge={
  currentId:()=>track.id,
  audio:()=>({currentTime:4}),
  profile:()=>"Ste",
  allTracks:()=>[track],
  lyricsData:()=>({synced:lines}),
  mixUrl:()=>track.url,
  saveAudioWordRows:async()=>{saved++;return 1}
 };
 const fakeWindow={Worker:MockWorker,OfflineAudioContext:MockAudio,AudioContext:class {constructor(){throw Error("Live audio session must never be acquired")}},MusicBoxBridge:bridge};
 const fakeNav={gpu:{},onLine:true,userAgent:"iPhone",connection:{saveData:false}};
 const fakeDoc={hidden:false,baseURI:"https://music.example/",
  getElementById:()=>null};
 const session={getItem:get,setItem:put};
 const fetchMock=async url=>{
  fetched=url;
  return {ok:true,headers:{get:()=>null},blob:async()=>({
   size:20,arrayBuffer:async()=>new ArrayBuffer(20)
  })};
 };
 const api=new Function("window","globalThis","navigator","document","Worker",
   "sessionStorage","fetch","requestIdleCallback",module+
   "\nreturn window.MusicBoxAudioAlign;")(fakeWindow,fakeWindow,fakeNav,
   fakeDoc,MockWorker,session,fetchMock,callback=>callback());
 assert.equal(api.request("s"),true);
 await new Promise(resolve=>setTimeout(resolve,60));
 assert.equal(workers,1);
 assert.equal(segments,1,"one 28-second inference max on iPhone, even if every line is rejected");
 assert.equal(saved,0);
 assert.equal(fetched,"https://music.example/songs/test.mp3");
 assert.equal(closed,true);
 assert.equal(api.request("s"),false,"immediate repeated open does not reload Whisper");
});
test("audio analysis has no external upload endpoint and does not overwrite source timestamps",()=>{
 const engine=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 assert.match(engine,/const budget=isPhone\?1:3/);
 assert.match(engine,/if\(scanned>=budget/);
 assert.match(engine,/if\(!best\)continue/);
 assert.doesNotMatch(engine,/\/api\/transcription|speech-to-text.*fetch/);
 assert.match(app,/if\(kept\?\.words\?\.length>=2&&!kept\.estimated\)return kept/);
});


test("WebGPU Whisper model uses accurate encoder and GPU-safe q4 decoder, not broken q8",()=>{
 const worker=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-worker.js"),"utf8");
 assert.match(worker,/encoder_model:"fp32",decoder_model_merged:"q4"/);
 assert.doesNotMatch(worker,/dtype:"q8"/);
 assert.match(worker,/return_timestamps:"word"/);
 assert.match(worker,/Invalid audio segment/);
 const doc=fs.readFileSync(path.join(__dirname,"..",".github/workflows/dj-mix-tests.yml"),"utf8");
 for(const p of ["audio-lyrics-worker.js","audio-lyrics-align.js","word-karaoke.js","immersive.js"]){
  assert.ok(doc.includes("node --check "+p),"syntax must be checked in CI: "+p);
 }
});
test("word-window overlap handles a lyric at 27 s and avoids guessing outside its recording",()=>{
 const win={},code=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 new Function("window","globalThis",code)(win,win);
 const api=win.MusicBoxAudioAlign,track={t:27.2,text:"This verse starts now"};
 const rows=[{t:2,text:"An intro starts here"},track,{t:35,text:"Another phrase begins"}];
 const fakeWindow={MusicBoxBridge:{audio:()=>({currentTime:27})}};
 const select=new Function("window",code+";return window.MusicBoxAudioAlign.preferredWindows(arguments[1],arguments[2]);");
 const starts=select(fakeWindow,rows,90);
 assert.ok(starts.includes(24),"overlapping windows must analyze 27 s within a 28 s clip");
 const chunks=[
  {text:" This",timestamp:[3.3,3.48]},
  {text:" verse",timestamp:[3.49,3.71]},
  {text:" starts",timestamp:[3.72,3.93]},
  {text:" now",timestamp:[3.94,4.3]}
 ];
 const good=api.alignWindow(rows,chunks,24,28);
 assert.equal(good.length,1);
 assert.equal(good[0].t,27.2);
 assert.equal(good[0].words[0].t,27.3);
 const bogus=api.alignWindow(rows,chunks,0,28);
 assert.equal(bogus.length,0,"timestamps relative to audio windows cannot be treated as absolute");
});
test("mobile refuses oversized MP3 before decode and preserves the live music session",async()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 let downloaded=0,decoders=0,workers=0,flag="";
 class FakeOffline{constructor(){decoders++}}
 class FakeWorker{constructor(){workers++}}
 const rows=[{t:2,text:"First few words"},{t:7,text:"Second few words"},{t:12,text:"Third few words"}];
 const music={id:"oversize",title:"Track",artist:"Artist",url:"song.mp3"};
 const fakeWindow={
  Worker:FakeWorker,OfflineAudioContext:FakeOffline,
  AudioContext:class {constructor(){throw Error("would steal music audio session")}},
  MusicBoxBridge:{
   currentId:()=>music.id,allTracks:()=>[music],lyricsData:()=>({synced:rows}),
   mixUrl:()=>music.url,audio:()=>({duration:180,currentTime:2}),profile:()=>"Ste"
  }};
 const fakeNav={gpu:{},onLine:true,userAgent:"iPhone",connection:{saveData:false}};
 const fakeDoc={hidden:false,baseURI:"https://example.org/",
  getElementById:()=>({set textContent(v){flag=v}})};
 const storage={getItem:()=>null,setItem:()=>{}};
 const fakeFetch=async()=>{
  downloaded++;
  return {ok:true,headers:{get:()=>String(9*1024*1024)}};
 };
 const api=new Function("window","globalThis","navigator","document","Worker",
   "sessionStorage","fetch","requestIdleCallback",src+
   "\nreturn window.MusicBoxAudioAlign;")(fakeWindow,fakeWindow,fakeNav,
   fakeDoc,FakeWorker,storage,fakeFetch,fn=>fn());
 assert.equal(api.request(music.id),true);
 await new Promise(resolve=>setTimeout(resolve,45));
 assert.equal(downloaded,1);
 assert.equal(decoders,0);
 assert.equal(workers,0);
 assert.match(flag,/non disponibile/);
 assert.equal(fakeWindow.MusicBoxBridge.currentId(),music.id);
});
test("Whisper timeout terminates a hung worker without freezing playback",async()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const buffer=new Float32Array(16000*40);
 let terminated=0,launched=0,closed=0,stage="";
 class HangWorker{
  constructor(){launched++}
  postMessage(){/* intentionally never responds */}
  terminate(){terminated++}
 }
 class Offline{
  async decodeAudioData(){return {
   sampleRate:16000,length:buffer.length,duration:40,numberOfChannels:1,
   getChannelData:()=>buffer
  }}
  async close(){closed++}
 }
 const music={id:"stall",title:"Track",artist:"Artist",url:"song.mp3"};
 const rows=[{t:3,text:"Some words now"},{t:9,text:"Some other words"},{t:18,text:"Another lyric line"}];
 const win={Worker:HangWorker,OfflineAudioContext:Offline,MusicBoxBridge:{
  currentId:()=>music.id,allTracks:()=>[music],lyricsData:()=>({synced:rows}),
  mixUrl:()=>music.url,audio:()=>({currentTime:3,duration:40}),profile:()=>"Ste"
 }};
 const nav={gpu:{},userAgent:"iPhone",onLine:true,connection:{saveData:false}};
 const doc={hidden:false,baseURI:"https://example.org/",getElementById:()=>
  ({set textContent(x){stage=x}})};
 const mem=new Map();
 const storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v))};
 const fetchMock=async()=>({ok:true,headers:{get:()=>String(30000)},
  blob:async()=>({size:30000,arrayBuffer:async()=>new ArrayBuffer(30000)})});
 const fastTimeout=(fn,ms)=>setTimeout(fn,ms===90000?12:ms);
 const api=new Function("window","globalThis","navigator","document","Worker",
  "sessionStorage","fetch","requestIdleCallback","setTimeout",src+
  "\nreturn window.MusicBoxAudioAlign;")(win,win,nav,doc,HangWorker,storage,
    fetchMock,fn=>fn(),fastTimeout);
 assert.equal(api.request(music.id),true);
 await new Promise(resolve=>setTimeout(resolve,70));
 assert.equal(launched,1);
 assert.equal(terminated,1);
 assert.equal(closed,1);
 assert.match(stage,/non disponibile/);
 assert.ok(mem.has("mb.audioWords.fail."+music.id));
});
test("AI timing provenance survives browser restart and does not masquerade as LRCLIB",()=>{
 assert.match(app,/audioWordSynced:r\.audioWordSynced===true/);
 assert.match(app,/wordRows:joined,audioWordSynced:true/);
 assert.match(app,/if\(kept\?\.words\?\.length>=2&&!kept\.estimated\)return kept/);
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 assert.match(immersive,/next\?\.audioWordSynced\?"PAROLA PER PAROLA · IA"/);
 const engine=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 assert.match(engine,/completedInSession\.has\(id\)/);
 assert.match(engine,/const limit=isPhone\?MAX_MOBILE_BYTES:MAX_AUDIO_BYTES/);
 assert.match(engine,/window\.OfflineAudioContext\|\|window\.webkitOfflineAudioContext/);
 assert.match(engine,/if\(!selected\(at\)\)continue/);
});

test("audio word alignment overlaps lyric phrases crossing a 28-second boundary",()=>{
 const fake={MusicBoxBridge:{audio:()=>({currentTime:24})}};
 new Function("window","globalThis",fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8"))(fake,fake);
 const api=fake.MusicBoxAudioAlign;
 const rows=[{t:24.1,text:"One two three four five six seven"},{t:27.2,text:"Next phrase"}];
 const windows=api.preferredWindows(rows,90);
 assert.ok(windows.includes(19),"the full phrase must be in a window starting before its cue");
 assert.ok(windows.includes(24),"existing naturally aligned overlap remains");
 assert.ok(windows.indexOf(19)<windows.indexOf(0),"prioritize nearby overlap over a clipped early window");
 const chunks=["One","two","three","four","five","six","seven"].map((text,i)=>({text:" "+text,timestamp:[5.1+i,5.55+i]}));
 const aligned=api.alignWindow([rows[0]],chunks,19,28);
 assert.equal(aligned.length,1);
 assert.equal(aligned[0].words.length,7);
 assert.equal(aligned[0].words.map(w=>w.text).join(""),"One two three four five six seven");
});


test("Whisper language comes from real LRC text, not the browser locale or an English default",()=>{
 const fake={};
 new Function("window","globalThis",
  fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8"))(fake,fake);
 const detect=fake.MusicBoxAudioAlign.languageFromLyrics;
 const rows=text=>text.split(/[.!?]+/).filter(Boolean).map(text=>({text}));
 assert.equal(detect(rows("Non so perché sei ancora qui, voglio solo stare con te. Che cosa vuoi da me? Sono sempre io, davvero.")),"it");
 assert.equal(detect(rows("And when you look at me, I know what you want. The world will never be the same because you are here with me.")),"en");
 assert.equal(detect(rows("Yo quiero estar contigo porque tengo corazón. Estoy contigo y no quiero olvidarte nunca, sabes que estoy aquí.")),"es");
 assert.equal(detect(rows("Je suis avec toi dans la nuit. Je veux encore quelque chose, pourquoi toujours moi et jamais vous?")),"fr");
 assert.equal(detect(rows("Eu não tenho nada, você fica com meu coração. Minha saudade é demais e ninguém está aqui comigo.")),"pt");
 assert.equal(detect(rows("Ich liebe dich und ich bin immer hier. Warum bist du nicht bei mir heute, meine liebe?")),"de");
 assert.equal(detect(rows("La la la, oh baby, la la la.")),"","ambiguous lyrics must not be forced to English");
 assert.equal(detect(rows("Je suis avec toi. I want you, the world is mine. Che sono, non so.")),"","mixed language cue must be inconclusive");
 const worker=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-worker.js"),"utf8");
 const align=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 assert.match(worker,/return_timestamps:"word",task:"transcribe",language/);
 assert.match(worker,/!LANGUAGES\.has\(language\)/);
 assert.match(align,/requestWorker\(sample,language\)/);
 assert.match(align,/completedInSession\.add\(id\);\s*setStatus\("Lingua del testo incerta/);
 assert.match(html,/audio-lyrics-align\.js\?v=6715&amp;lang=1/);
 for(const file of ["audio-lyrics-align.js","audio-lyrics-worker.js"])
  assert.equal(sw.split(file+"?v=6715&lang=1").length-1,2);
});

test("Whisper worker sends explicit per-track language to ASR and rejects missing or invalid language",async()=>{
 const worker=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-worker.js"),"utf8");
 const source=worker.slice(worker.indexOf("self.onmessage=async e=>"));
 assert.ok(source.startsWith("self.onmessage"),"worker handler missing");
 const sent=[],calls=[];
 const mockSelf={postMessage:msg=>sent.push(msg)};
 const asr=async(_pcm,options)=>{calls.push(options);return {chunks:[{text:" test",timestamp:[0,0.4]}]};};
 const mockGetModel=async()=>asr;
 new Function("self","getModel","LANGUAGES",source)(mockSelf,mockGetModel,new Set(["it","en","es","fr","pt","de"]));
 const pcm=new Float32Array(16000);
 await mockSelf.onmessage({data:{id:10,pcm,language:"it"}});
 assert.equal(calls[0].language,"it");
 assert.deepEqual(calls[0],{return_timestamps:"word",task:"transcribe",language:"it"});
 assert.equal(sent[0].id,10);
 await mockSelf.onmessage({data:{id:11,pcm,language:"en"}});
 assert.equal(calls[1].language,"en");
 await mockSelf.onmessage({data:{id:12,pcm}});
 await mockSelf.onmessage({data:{id:13,pcm,language:"xx"}});
 assert.equal(calls.length,2,"invalid or missing language must not launch transcription");
 assert.match(sent[2].error,/Invalid audio segment/);
 assert.match(sent[3].error,/Invalid audio segment/);
});


test("line-level LRC lyrics now produce a distinct estimated word-by-word karaoke",()=>{
 const win={};
 new Function("window","globalThis",
  fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8"))(win,win);
 const api=win.MusicBoxWordKaraoke;
 const rows=[{t:7.7,text:"E quanto forte ti pensavo"},
  {t:11.92,text:"Che quasi non respiravo"},
  {t:15.92,text:"[Instrumental]"},
  {t:20.05,text:"Dammi un goccio in più Maria"}];
 const est=api.estimateRows(rows);
 assert.equal(rows[0].words,undefined,"source LRC rows remain untouched");
 assert.equal(est[0].estimated,true);
 assert.ok(est[0].words.length>=4,"word progress exists with line timestamps");
 assert.equal(est[0].words.map(w=>w.text).join("").trim(),rows[0].text);
 assert.equal(est[0].words[0].t,rows[0].t);
 assert.ok(est[0].words.at(-1).end<rows[1].t);
 assert.ok(est[0].words.every((w,i)=>i===0||w.t>=est[0].words[i-1].t));
 assert.equal(est[2].words,undefined,"instrumental markers are never spoken words");
 const container={children:[],appendChild(node){this.children.push(node)},textContent:""};
 const document={createElement:()=>({textContent:"",style:{setProperty(){}}})};
 assert.equal(api.spanWords(document,est[0],container).length,est[0].words.length);
 const verified={t:10,text:"Turn on",words:[{t:10,end:10.5,text:"Turn "},{t:10.5,end:11,text:"on"}]};
 assert.strictEqual(api.estimateRows([verified])[0],verified,"verified word data takes priority");
});

test("estimated words never suppress Whisper or contaminate verified saved timings",()=>{
 const align=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const sw=fs.readFileSync(path.join(__dirname,"..","sw.js"),"utf8");
 assert.match(app,/const baseline=saved\.some\(row=>row\.words\?\.length>=2\)/);
 assert.match(app,/return e\?\.estimateRows\?\.\(baseline\)\|\|baseline/);
 assert.match(app,/return kept&&!kept\.estimated\?kept:original/);
 assert.match(app,/if\(l\?\.synced&&!_righeTestoConParole\(l\)\.every\(r=>\s*r\.words\?\.length>=2&&!r\.estimated\)\)/);
 assert.match(align,/row\?\.estimated\?\{t:row\.t,text:row\.text\}:row/);
 assert.match(immersive,/guessed\?"PAROLA PER PAROLA · STIMA"/);
 assert.match(immersive,/row\.estimated\?\{estimated:true\}/);
 assert.match(app,/KARAOKE · PAROLA PER PAROLA \(STIMA\)/);
 assert.match(app,/track-badge-karaoke/);
 assert.match(app,/_statoKaraokeBrano\(t\.id\)\?\.label\|\|""/);
 assert.match(app,/LS\.set\("mb\.lyricsFullView",_vistaTestiCompleta\)/);
 const release=JSON.parse(fs.readFileSync(
  path.join(__dirname,"..","versione.json"),"utf8")).versione.replace(".","");
 for(const file of ["app.js","word-karaoke.js","immersive.js","style.css"]){
  // The main player follows the release; unchanged karaoke/CSS assets
  // deliberately keep their own revision in both online and offline URLs.
  const revision=file==="app.js"?release:"6715";
  assert.ok(html.includes(file+"?v="+revision+"&amp;words=2"));
  assert.equal(sw.split(file+"?v="+revision+"&words=2").length-1,2);
 }
});
