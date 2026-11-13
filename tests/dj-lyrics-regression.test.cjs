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
 assert.equal(good[0].t,27.3);
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
 assert.ok(mem.has("mb.audioWords.fail.Ste."+music.id));
});
test("AI timing provenance survives browser restart and does not masquerade as LRCLIB",()=>{
 assert.match(app,/audioWordSynced:r\.audioWordSynced===true/);
 assert.match(app,/wordRows:joined,audioWordSynced:true/);
 assert.match(app,/if\(kept\?\.words\?\.length>=2&&!kept\.estimated\)return kept/);
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 assert.match(immersive,/next\?\.audioWordSynced\?"PAROLA PER PAROLA · IA"/);
 const engine=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 assert.match(engine,/completedInSession\.has\(sessionId\)/);
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
 assert.notEqual(windows[0],24,
  "iPhone must not use its one window on a start that skips the 24.1s line");
 assert.ok([19,22].includes(windows[0]),
  "choose a nearby clip that can actually align the full vocal phrase");
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
 assert.match(align,/completedInSession\.add\(sessionId\);\s*setStatus\("Lingua del testo incerta/);
 assert.match(html,/audio-lyrics-align\.js\?v=6728&amp;lang=8/);
 assert.equal(sw.split("audio-lyrics-align.js?v=6728&lang=8").length-1,2);
 assert.equal(sw.split("audio-lyrics-worker.js?v=6715&lang=1").length-1,2);
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
  const wordCache=file==="word-karaoke.js"?"7":file==="immersive.js"?"5":file==="app.js"?"4":"2";
  assert.ok(html.includes(file+"?v="+revision+"&amp;words="+wordCache));
  assert.equal(sw.split(file+"?v="+revision+"&words="+wordCache).length-1,2);
 }
});


test("queued vocal scanning protects playback and respects native buffering",()=>{
 const from=dj.indexOf("function mayScanDesktopVoice(");
 const to=dj.indexOf("function scheduleDeepVoice(",from);
 assert.ok(from>=0&&to>from,"queued scan eligibility must be present");
 const eligible=new Function("window","mixing","active",dj.slice(from,to)+
  "\nreturn mayScanDesktopVoice;")({MusicBoxRoom:{isActive:()=>false}},false,null);
 const audio={paused:false,seeking:false,duration:190,currentTime:30,
  readyState:4,buffered:{length:0}};
 const player={audio:()=>audio,currentId:()=> "song-a",
  mixNext:()=>({id:"song-b"})};
 assert.equal(eligible(player,{id:"song-b"}),true,
  "Queued intro can be checked with a stable buffered player");
 audio.readyState=2;
 assert.equal(eligible(player,{id:"song-b"}),false,
  "Do not download an optional MP3 while the player buffers");
 audio.readyState=3;
 audio.buffered={length:1,start:()=>0,end:()=>32};
 assert.equal(eligible(player,{id:"song-b"}),false,
  "A small buffer cannot authorize queued analysis");
 audio.buffered={length:1,start:()=>0,end:()=>55};
 assert.equal(eligible(player,{id:"song-b"}),true);
 audio.currentTime=111;
 assert.equal(eligible(player,{id:"song-b"}),false,
  "Late queue changes cannot begin a costly scan");
 audio.currentTime=30;audio.paused=true;
 assert.equal(eligible(player,{id:"song-b"}),false,
  "Pause and seeking should never start new DJ analysis");
 assert.equal(eligible(player,{id:"song-c"}),false,
  "Unrelated tracks must not be scanned");
});


test("wrong-song lyrics cannot replace Amelie with Paganini or Jolly",()=>{
 const builtin=JSON.parse(fs.readFileSync(path.join(__dirname,"..","lyrics.json"),"utf8"));
 const first=app.indexOf("const _testoIdentitaCache=new WeakMap()");
 const end=app.indexOf("// A foreground, rate-limited upgrade",first);
 assert.ok(first>0&&end>first,"read the actual lyric identity and selection code");
 const code=app.slice(first,end);
 const am=builtin["b-track-205"],pa=builtin["b-track-28"],jo=builtin["b-track-213"];
 assert.equal(am.title,"Amelie");
 assert.equal(pa.title,"Paganini");
 assert.equal(jo.title,"Jolly");
 const local={};
 const currentId="b-track-205";
 const parse=s=>String(s||"").split("\n").filter(x=>/^\[\d/.test(x));
 const engine=new Function("lyricsData","localLyrics","currentId","parseSynced",
   code+";return {same:_testoAppartieneAlBrano,active:currentLyrics};")(
    builtin,local,currentId,parse);
 const fakeLyrics=(source)=>({
  id:currentId,title:"Amelie",artist:"Kid Yugi",
  synced:source.synced,text:source.text,
  wordRows:[{t:3,text:"Wrong song",words:[{t:3,text:"Wrong "},{t:4,text:"song"}]}]
 });
 for(const wrong of [pa,jo]){
  local[currentId]=fakeLyrics(wrong);
  assert.equal(engine.same(currentId,local[currentId]),false,
   "Matching artist, displayed title and timed words do not prove song identity");
  assert.equal(engine.active(),am,
   "Built-in Amelie lyrics must beat a previously cached wrong-song karaoke");
 }
 local[currentId]=fakeLyrics(am);
 assert.equal(engine.same(currentId,local[currentId]),true);
 assert.equal(engine.active(),local[currentId],
  "A correctly associated per-song word upgrade must remain eligible");
 const retimed={...fakeLyrics(am),synced:am.synced.replace(/\[00:09\.99\]/,"[00:10.12]")};
 assert.equal(engine.same(currentId,retimed),true,
  "Small timing edits and different punctuation must not reject the right song");
 assert.equal(engine.same("b-track-500",fakeLyrics(am)),false,
  "An explicit mismatched recording ID must never be reused across profiles");
 const upgrading=app.slice(app.indexOf("async function _verificaParoleKaraoke("),
  app.indexOf("async function _salvaParoleDallAudio("));
 assert.match(upgrading, /_testoAppartieneAlBrano\(id,\{synced:result\.synced\}\)/,
  "Word upgrades must check identity BEFORE writing to IndexedDB");
 const fetching=app.slice(app.indexOf("async function _completaTestoInAscolto("),
  app.indexOf("function _programmaTestiKaraoke(",app.indexOf("async function _completaTestoInAscolto(")));
 assert.match(fetching, /_testoAppartieneAlBrano\(t\.id,entry\)/,
  "Auto-fetched karaoke must never overwrite known lyrics of another recording");
 const djCues=app.slice(app.indexOf("mixLyricCues:(id)=>"),
  app.indexOf("mixCandidates:()=>",app.indexOf("mixLyricCues:(id)=>")));
 assert.match(djCues,/const local=_testoLocaleVerificato\(id\)/,
  "DJ must not trust the wrong song's lyric boundary");
});

test("Dimenticare and Sono gia solo never show unrelated plain lyrics",()=>{
 const all=JSON.parse(fs.readFileSync(path.join(__dirname,"..","lyrics.json"),"utf8"));
 for(const id of ["b-track-185","b-track-246"]){
  const song=all[id],lines=song.synced.split(/\r?\n/).
   map(x=>x.replace(/^\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]\s*/,"").trim()).
   filter(Boolean);
  assert.ok(lines.length>=15,"The original timed song has full lyrics");
  const phrase=lines.find(x=>x.split(/\s+/).length>=5);
  assert.ok(song.text.includes(phrase),
   "The full-text view must use words from the SAME recording as timed karaoke: "+song.title);
 }
});

test("enhanced LRC preserves early measured syllables instead of estimating karaoke",()=>{
 const script=fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8");
 const karaoke=new Function("const window={};"+script+";return window.MusicBoxWordKaraoke;")();
 const input="[00:20.00]<00:19.35>Can <00:19.75>you <00:20.12>hear <00:20.47>me";
 const rows=karaoke.parseEnhancedLrc(input);
 assert.equal(rows.length,1);
 assert.equal(rows[0].words.length,4);
 assert.equal(rows[0].t,19.35);
 assert.equal(rows[0].words[0].t,19.35);
 assert.equal(rows[0].words[3].t,20.47);
 const unsafe="[00:20.00]<00:15.00>Can <00:15.40>you <00:16.00>hear <00:16.40>me";
 const bad=karaoke.parseEnhancedLrc(unsafe);
 assert.equal(bad[0].words,undefined,
  "Do not trust a word timestamp five seconds before its LRC line");
});
test("enhanced LRC uses the actual first word even when the provider line is early",()=>{
 const script=fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8");
 const karaoke=new Function("const window={};"+script+";return window.MusicBoxWordKaraoke;")();
 const legitimate=karaoke.parseEnhancedLrc(
  "[00:10.00]<00:11.20>Hello <00:11.70>real <00:12.25>music");
 assert.equal(legitimate.length,1);
 assert.equal(legitimate[0].t,11.20,"Do not light up a line 1.2s before the first confirmed syllable");
 assert.equal(legitimate[0].words.length,3);
 assert.equal(legitimate[0].words[0].t,11.20);
 const tooLate=karaoke.parseEnhancedLrc(
  "[00:10.00]<00:13.50>Hello <00:14.00>real <00:14.40>music");
 assert.equal(tooLate[0].t,10.00,
  "An implausible word clock must not move the lyric cue");
 assert.equal(tooLate[0].words,undefined,
  "Do not present implausible tags as audio-confirmed karaoke");
 const textMismatch=karaoke.parseEnhancedLrc(
  "[00:10.00]Hello <00:11.20>real <00:11.70>music");
 assert.equal(textMismatch[0].t,10.00);
 assert.equal(textMismatch[0].words,undefined,
  "Unmatched text prefixes cannot justify a shifted line");
});
test("Whisper first-word shift is saved using original LRC source anchor",()=>{
 const alignSource=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const wordSource=fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8");
 const window={};
 new Function("window","globalThis",alignSource)(window,window);
 new Function("window","globalThis",wordSource)(window,window);
 const lines=[{t:10,text:"We feel the music"},{t:16,text:"Other words now"},
  {t:22,text:"Another phrase here"}];
 const chunks=[
  {text:" We",timestamp:[11.2,11.4]},
  {text:" feel",timestamp:[11.45,11.66]},
  {text:" the",timestamp:[11.7,11.8]},
  {text:" music",timestamp:[11.85,12.1]}
 ];
 const shifted=window.MusicBoxAudioAlign.alignWindow(lines,chunks,0,28);
 assert.equal(shifted.length,1,"Exact four-word match should be accepted");
 assert.equal(shifted[0].sourceT,10);
 assert.equal(shifted[0].t,11.2);
 const saved=window.MusicBoxWordKaraoke.normalizeRows(shifted);
 assert.equal(saved[0].sourceT,10,"Persisted row must retain original phrase anchor");
 assert.equal(saved[0].t,11.2,"Audio-verified first word is the display cue");
 assert.equal(saved[0].words.length,4);
 const appSave=app.slice(app.indexOf("async function _salvaParoleDallAudio("),
  app.indexOf("/* Recupero graduale mentre",app.indexOf("async function _salvaParoleDallAudio(")));
 assert.match(appSave,/Math\.abs\(sourceT\(row\)-original\.t\)<\.02/);
 assert.match(appSave,/p\.replaceChildren\(\)/,
  "UI must patch only changed lyrics instead of rebuilding the whole sheet");
 assert.doesNotMatch(appSave,/Math\.abs\(row\.t-original\.t\)<\.02/,
  "Display timing must not be used to find the original lyric row");
});
test("subdued Smart Mix lead-in starts before the last musical beats, not the silence",()=>{
 const from=dj.indexOf("function subduedRhythmicIntro(");
 const to=dj.indexOf("function desktopMeasuredReleaseLeadIn(",from);
 assert.ok(from>0&&to>from);
 const make=new Function("const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+
  "const onsetPeriodicity=()=>.6,hasImmediateMusicalIntro=()=>true,"+
  "grooveAgreement=()=>({score:.84,correlation:.7}),"+
  "similarNotes=()=>({focused:.87,phrase:.8}),"+
  "camelotMatch=()=>({weight:0,score:.7}),"+
  "musicalIntroEntry=()=>0,onsetGridPhase=()=>.1;"+
  dj.slice(from,to)+";return subduedRhythmicIntro;")();
 const data={duration:200,last:199,bpm:120,beatConfidence:.8,
  outroOnset:Array(96).fill(1),introOnset:Array(96).fill(1),
  introDrive:.8};
 const plan=make(data,{...data},200);
 assert.equal(plan.kind,"underlay");
 assert.ok(plan.begin<=196.8&&plan.begin>=194.9,
  "Subdued entrance should start while final music is audible");
 assert.ok(plan.end>199&&plan.preserveTail);
});


test("Whisper exact four-word timing repairs LRC verses leading the audio",()=>{
 const code=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const align=new Function("const window={};"+code+";return window.MusicBoxAudioAlign;")();
 const phrase=(text,times)=>times.map((t,i)=>({text:text.split(" ")[i],timestamp:[t,t+.18]}));
 const four="When the drums arrive";
 const match=align.alignWindow([{t:10,text:four},{t:15,text:"Next chorus"}],
  phrase(four,[11.25,11.61,12.01,12.42]),0,28);
 assert.equal(match.length,1);
 assert.ok(Math.abs(match[0].words[0].t-11.25)<.001);
 assert.equal(match[0].words.map(w=>w.text).join("").trim(),four);
 const ambiguous="Three short words";
 const rejected=align.alignWindow([{t:10,text:ambiguous},{t:15,text:"Next chorus"}],
  phrase(ambiguous,[11.25,11.64,12.01]),0,28);
 assert.equal(rejected.length,0,
  "Loose offset should not accept short, repeatedly sung lines");
});


test("strong recorded drums can enter early as bass-only without blending weak chords",()=>{
 const from=dj.indexOf("function subduedRhythmicIntro(");
 const to=dj.indexOf("function desktopMeasuredReleaseLeadIn(",from);
 const fn=new Function("const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+
  "const onsetPeriodicity=()=>.6,hasImmediateMusicalIntro=()=>true,"+
  "grooveAgreement=()=>({score:.84,correlation:.70}),"+
  "similarNotes=()=>({focused:.58,phrase:.46}),"+
  "camelotMatch=()=>({weight:.12,score:.75}),"+
  "musicalIntroEntry=()=>0,onsetGridPhase=()=>.1;"+
  dj.slice(from,to)+";return subduedRhythmicIntro;")();
 const a={duration:200,last:199,bpm:120,beatConfidence:.8,
  outroOnset:Array(96).fill(1),introOnset:Array(96).fill(1),
  introDrive:.8};
 const cue=fn(a,{...a},200);
 assert.equal(cue.kind,"underlay");
 assert.equal(cue.drumOnlyUnderlay,true);
 assert.ok(cue.underlayVolume<=.16&&cue.preserveTail);
 assert.ok(cue.begin<a.last-2.5);
});
test("low-harmony DJ previews require a real low-pass filter before playback",()=>{
 const from=dj.indexOf("function connectMixDsp(");
 const to=dj.indexOf("// Confident musical joins",from);
 const make=new Function("const dspBass=0,dspMid=0,dspTreble=0,"+
   "dspMode='auto',dspStrength=55;"+dj.slice(from,to)+
   ";return connectMixDsp;")();
 const filters=[],events=[];
 const frequency=()=>({value:0,setValueAtTime:(v,t)=>events.push(["set",v,t]),
  exponentialRampToValueAtTime:(v,t)=>events.push(["ramp",v,t])});
 const ctx={currentTime:0,createBiquadFilter:()=>{
  const node={type:"",frequency:frequency(),gain:{value:0},
   Q:{value:0},connect:()=>{}};
  filters.push(node);return node;
 }};
 const source={connect:()=>{}},gain={};
 const nodes=make(ctx,source,gain,4,false,null,0,false,true);
 assert.ok(nodes.length>0);
 assert.ok(filters.some(f=>f.type==="lowpass"));
 assert.ok(events.some(e=>e[0]==="set"&&e[1]===260));
 assert.ok(events.some(e=>e[0]==="ramp"&&e[1]===18000));
 assert.match(dj,/if\(proposed\.drumOnlyUnderlay&&!act\.dsp\)\{cancel\(\);plan=null;return\}/);
});


test("window-aware DJ measures older audible kick windows and preserves the whole vocal ending",()=>{
 const from=dj.indexOf("function measuredWindowRhythmUnderlay(");
 const to=dj.indexOf("function subduedRhythmicIntro(",from);
 assert.ok(from>0&&to>from);
 const choose=new Function("const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));"+
  "const independentPulseTrain=()=>({score:.87,phase:.25}),"+
  "onsetPeriodicity=()=>.68,hasImmediateMusicalIntro=()=>true,"+
  "musicalIntroEntry=()=>0,onsetGridPhase=()=>.25,"+
  "grooveAgreement=()=>({score:.8,correlation:.6}),"+
  "similarNotes=()=>({focused:.56,phrase:.5}),"+
  "camelotMatch=()=>({weight:.08,score:.6});"+
  dj.slice(dj.indexOf("function measuredTempoRelation("),to)+
  ";return measuredWindowRhythmUnderlay;")();
 const win={start:190,end:194,levelRatio:.75,
  onset:Array(96).fill(0).map((_,i)=>i%12===0?1:0),
  groove:Array(32).fill(.3),notes:Array(12).fill(.5)};
 const outgoing={duration:200,last:199,bpm:120,beatConfidence:.8,
  outroOnsetWindows:[win]};
 const incoming={duration:180,bpm:120,beatConfidence:.8,introDrive:.8,
  introOnset:Array(96).fill(0).map((_,i)=>i%12===0?1:0)};
 const cue=choose(outgoing,incoming,200);
 assert.ok(cue,"a measured window before the last four seconds must be eligible");
 assert.equal(cue.kind,"underlay");
 assert.equal(cue.measuredWindowUnderlay,true);
 assert.equal(cue.drumOnlyUnderlay,true);
 assert.ok(cue.begin>=win.start+.25&&cue.begin<=win.end-1.1);
 assert.ok(cue.begin<outgoing.last-4.65,"incoming kick begins before old silence");
 assert.equal(cue.preserveTail,true);
 assert.equal(cue.silenceTrim,false);
 assert.ok(cue.underlayVolume<=.145);
 assert.equal(choose(outgoing,{...incoming,firstVoiceAt:.5},200),null,
  "measured incoming vocals prevent underlay");
 assert.equal(choose({...outgoing,outroOnsetWindows:[{...win,levelRatio:.01}]},
  incoming,200),null,"digitally silent outgoing windows cannot certify a beat");
 assert.match(dj,/filter\.frequency\.setValueAtTime\(260,t\+Math\.max\(\.16,seconds-\.04\)\)/);
 assert.match(dj,/filter\.frequency\.exponentialRampToValueAtTime\(18000,\s*t\+Math\.max\(\.34,seconds\+\.38\)\)/);
});


test("DJ phrase mapper supports real half-time groove without double-speed playback",()=>{
 const begin=dj.indexOf("function measuredTempoRelation(");
 const end=dj.indexOf("function subduedRhythmicIntro(",begin);
 assert.ok(begin>0&&end>begin);
 const choose=new Function("const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+
  "const independentPulseTrain=()=>({score:.89,phase:.25}),"+
  "onsetPeriodicity=()=>.67,hasImmediateMusicalIntro=()=>true,"+
  "musicalIntroEntry=()=>0,onsetGridPhase=()=>.25,"+
  "grooveAgreement=()=>({score:.82,correlation:.66}),"+
  "similarNotes=()=>({focused:.64,phrase:.54}),"+
  "camelotMatch=()=>({weight:.10,score:.75});"+
  dj.slice(begin,end)+";return {measuredTempoRelation,measuredWindowRhythmUnderlay};")();
 const win={start:190,end:194,levelRatio:.72,energyTrend:.9,
  onset:Array(96).fill(.2),groove:Array(32).fill(.5),
  notes:Array(12).fill(.08),beatCount:7,bassRatio:.35};
 const old={duration:200,last:199,bpm:60,beatConfidence:.80,
  outroOnsetWindows:[win],
  structureEvents:[{at:192.1,direction:"rising",change:1.1}]};
 const intro={duration:170,bpm:120,beatConfidence:.80,
  introDrive:.90,introBassRatio:.36,introOnset:Array(96).fill(.3)};
 const relative=choose.measuredTempoRelation(old,intro);
 assert.equal(relative.scale,.5);
 assert.equal(relative.ratio,1);
 assert.equal(relative.period,1);
 const cue=choose.measuredWindowRhythmUnderlay(old,intro,200);
 assert.ok(cue,"Half-time matching should be eligible for lowpass only");
 assert.equal(cue.tempoScale,.5);
 assert.equal(cue.tempo,1,"Never speed up a 120-BPM MP3 to 240 BPM");
 assert.equal(cue.drumOnlyUnderlay,true);
 assert.ok(cue.fade>=4.5&&cue.fade<=11.8);
 assert.ok(cue.begin>=win.start+.25&&cue.begin<=win.end-1.10);
 assert.equal(cue.preserveTail,true);
 assert.ok(cue.underlayVolume<=.135);
 assert.equal(choose.measuredWindowRhythmUnderlay(old,
  {...intro,introBassRatio:.01},200),null,
  "Filtered-only intro must contain measured low-frequency energy");
 assert.equal(choose.measuredWindowRhythmUnderlay(old,
  {...intro,firstLyricAt:.3},200),null,
  "Known initial lyric forbids overlapping it with outgoing music");
 assert.equal(choose.measuredTempoRelation(old,{...intro,bpm:94}),null,
  "Different tempos without a half/double-time relationship are rejected");
});


test("continuity fallback never cuts a late vocal or claims a beatmatched overlay",()=>{
 const from=dj.indexOf("function adaptiveLowBandContinuity(");
 const to=dj.indexOf("function subduedRhythmicIntro(",from);
 assert.ok(from>0&&to>from);
 const policy=new Function("const hasImmediateMusicalIntro=()=>true,"+
  "onsetPeriodicity=()=>.65,musicalIntroEntry=()=>0,"+
  "adaptiveUnderlayLevel=()=>.08;"+
  dj.slice(from,to)+";return adaptiveLowBandContinuity;")();
 const outgoing={duration:200,last:199,protectedEnding:true};
 const next={introDrive:.80,bpm:120,beatConfidence:.82,
  introBassRatio:.39,introOnset:Array(96).fill(.2)};
 const cue=policy(outgoing,next,200);
 assert.ok(cue,"a measured low-band opening can bridge under a protected ending");
 assert.equal(cue.kind,"underlay");
 assert.equal(cue.neutralAmbientUnderlay,true);
 assert.equal(cue.drumOnlyUnderlay,true);
 assert.equal(cue.preserveTail,true);
 assert.equal(cue.beatPeriod,null,"no fabricated beat certificate");
 assert.equal(cue.safeOutroAt,null,"never advance the outgoing playhead");
 assert.equal(cue.silenceTrim,false);
 assert.ok(cue.begin<=outgoing.last-2.4&&cue.end>outgoing.last);
 assert.ok(cue.underlayVolume<=.09);
 assert.ok(cue.fade>=3.15&&cue.fade<=6.8);
 assert.equal(policy(outgoing,{...next,firstVoiceAt:0},200),null,
  "Known incoming singing at 0 seconds forbids overlap");
 assert.equal(policy(outgoing,{...next,firstLyricAt:1.0},200),null,
  "Lyrics also prevent overlapping a sung intro");
 assert.equal(policy(outgoing,{...next,introBassRatio:.02},200),null,
  "An intro with insufficient measured bass cannot enter the low band");
 assert.equal(policy({...outgoing,last:185},next,200),null,
  "A long digital tail needs its own independently verified skip");
 assert.equal(policy({...outgoing,duration:191},next,200),null,
  "A mismatched duration is never safe");
 assert.match(dj,/if\(!p\|\|p\.neutralAmbientUnderlay===true\)return 0/);
 assert.match(dj,/if\(cue\.neutralAmbientUnderlay===true\)/);
 assert.match(dj,/if\(plan\?\.neutralAmbientUnderlay===true\)/);
});


test("measured beat-pulse alignment rejects drifting decoders and validates repeated kicks",()=>{
 const a=dj.indexOf("function measuredPulseAlignment(");
 const b=dj.indexOf("function measuredWindowRhythmUnderlay(",a);
 assert.ok(a>=0&&b>a);
 const check=new Function(dj.slice(a,b)+";return measuredPulseAlignment;")();
 const hits=[10,10.5,11,11.5,12,12.5,13,13.5];
 const intro=[0,.5,1,1.5,2,2.5,3];
 const good=check(hits,intro,10,0,1);
 assert.ok(good&&good.ratio>=.9&&good.rms<.01);
 const late=check(hits,intro.map(x=>x+.22),10,0,1);
 assert.ok(late&&late.ratio<.30);
 assert.equal(check([],intro,10,0,1),null);
});
test("verified audio alignment activates the lyric row at first spoken syllable",()=>{
 const alignScript=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const api=new Function("const window={};"+alignScript+
  ";return window.MusicBoxAudioAlign;")();
 const line="Feel the rhythm tonight";
 const chunks=line.split(" ").map((text,i)=>({
   text,timestamp:[10.7+i*.35,10.9+i*.35]
 }));
 const rows=api.alignWindow([{t:10,text:line},{t:14,text:"Other phrase"}],chunks,0,28);
 assert.equal(rows.length,1);
 assert.equal(rows[0].t,10.7);
 assert.equal(rows[0].words[0].t,10.7);
 assert.equal(rows[0].alignedFromAudio,true);
 const wordScript=fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8");
 const words=new Function("const window={};"+wordScript+
  ";return window.MusicBoxWordKaraoke;")();
 const normalized=words.normalizeRows([
  {t:10,text:line,words:chunks.map((x,i)=>({
   text:i===3?"tonight":x.text+" ",t:x.timestamp[0]
  })).map((w,i,arr)=>i===arr.length-1?w:{...w})}
 ]);
 assert.equal(normalized.length,1);
 assert.equal(normalized[0].t,10.7);
});


test("DJ harmonic section entry earns stronger bass only with independently aligned real beats",()=>{
 const start=dj.indexOf("function measuredTempoRelation(");
 const end=dj.indexOf("function subduedRhythmicIntro(",start);
 const choose=new Function("const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+
  "const independentPulseTrain=()=>({score:.90,phase:.25}),"+
  "onsetPeriodicity=()=>.72,hasImmediateMusicalIntro=()=>true,"+
  "musicalIntroEntry=()=>0,onsetGridPhase=()=>.25,"+
  "grooveAgreement=()=>({score:.86,correlation:.78}),"+
  "similarNotes=()=>({focused:.84,phrase:.75}),"+
  "camelotMatch=()=>({weight:.08,score:.76});"+
  dj.slice(start,end)+";return measuredWindowRhythmUnderlay;")();
 const window={start:190,end:194,levelRatio:.8,energyTrend:.03,
  onset:Array(96).fill(.3),groove:Array(32).fill(.3),
  notes:Array(12).fill(.08)};
 const outgoing={duration:200,last:199,bpm:120,beatConfidence:.9,
  outroOnsetWindows:[window],
  structureEvents:[{at:191.5,direction:"harmonic",change:.43}]};
 const incoming={duration:180,bpm:120,beatConfidence:.9,
  introDrive:.8,introBassRatio:.5,
  introOnset:Array(96).fill(.4)};
 const prior=choose(outgoing,incoming,200);
 assert.ok(prior);
 const alignedWindow={...window,
  measuredBeatTimes:Array.from({length:9},(_,i)=>prior.begin+i*.5)};
 const matched=choose({...outgoing,beatGrid:{reliable:true},
  outroOnsetWindows:[alignedWindow]},
  {...incoming,beatGrid:{reliable:true},
   introBeatTimes:Array.from({length:8},(_,i)=>i*.5)},200);
 assert.ok(matched);
 assert.ok(matched.beatPulseAgreement>=.75);
 assert.ok(matched.underlayVolume>.145&&matched.underlayVolume<=.215);
 const misaligned=choose({...outgoing,beatGrid:{reliable:true},
  outroOnsetWindows:[{...alignedWindow,
   measuredBeatTimes:alignedWindow.measuredBeatTimes.map(t=>t+.2)}]},
  {...incoming,beatGrid:{reliable:true},
   introBeatTimes:Array.from({length:8},(_,i)=>i*.5)},200);
 // A CONSTANT 200 ms phase offset is correctable by scheduling the
 // upcoming song at a different moment; it is not an offbeat result.
 assert.ok(misaligned?.measuredBeatPlacement===true);
 assert.ok(misaligned.beatPulseAgreement>=.85);
 assert.ok(Math.abs(misaligned.begin-matched.begin)>.12,
  "the mixer must ACTUALLY shift the start to the measured new phase");
 const drifting=choose({...outgoing,beatGrid:{reliable:true},
  outroOnsetWindows:[{...alignedWindow,
   measuredBeatTimes:alignedWindow.measuredBeatTimes.map((t,i)=>t+i*i*.17)}]},
  {...incoming,beatGrid:{reliable:true},
   introBeatTimes:Array.from({length:8},(_,i)=>i*.5)},200);
 assert.equal(drifting,null,
  "irregular drifting beats must not be presented as phase-matched bass");
});

test("iPhone karaoke may inspect several different passages on later requests without unbounded decoding",async()=>{
 const code=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const lyrics=[
  {t:3,text:"I want to know your heart is mine"},
  {t:9,text:"You know that I want you tonight"},
  {t:35,text:"And we will see the world tonight"},
  {t:60,text:"I wanna know where you are now"}
 ];
 let current=4,now=Date.now(),clips=0,downloads=0,closed=0,profile="Ste";
 const pcm=new Float32Array(16000*80),memory=new Map();
 class WorkerMock{
  postMessage(m){
   clips++;
   queueMicrotask(()=>this.onmessage({data:{id:m.id,chunks:[]}}));
  }
  terminate(){}
 }
 class OfflineMock{
  async decodeAudioData(){
   return {sampleRate:16000,duration:80,length:pcm.length,
    numberOfChannels:1,getChannelData:()=>pcm};
  }
  async close(){closed++}
 }
 const track={id:"song-karaoke",url:"songs/track.mp3"};
 const bridge={currentId:()=>track.id,
  audio:()=>({duration:80,currentTime:current}),
  profile:()=>profile,allTracks:()=>[track],
  lyricsData:()=>({synced:lyrics}),mixUrl:()=>track.url};
 const win={Worker:WorkerMock,OfflineAudioContext:OfflineMock,MusicBoxBridge:bridge};
 const nav={gpu:{},onLine:true,userAgent:"iPhone",connection:{saveData:false}};
 const doc={hidden:false,baseURI:"https://music.example/",getElementById:()=>null};
 const storage={getItem:k=>memory.get(k)||null,
  setItem:(k,v)=>memory.set(k,String(v))};
 const fetchMock=async()=>{
  downloads++;
  return {ok:true,headers:{get:()=>null},blob:async()=>({
   size:100,arrayBuffer:async()=>new ArrayBuffer(100)})};
 };
 const api=new Function("window","navigator","document","sessionStorage",
  "fetch","Worker","requestIdleCallback","Date","URL",
  code+";return window.MusicBoxAudioAlign;")(
   win,nav,doc,storage,fetchMock,WorkerMock,fn=>fn(),{now:()=>now},URL);
 assert.equal(api.languageFromLyrics(lyrics),"en");
 for(const [i,position] of [4,36,61].entries()){
  current=position;now+=16000;
  assert.equal(api.request(track.id),true);
  await new Promise(resolve=>setTimeout(resolve,40));
  assert.equal(clips,i+1,"one new isolated 28s clip per request");
  assert.equal(downloads,i+1,"never download more than once per request");
 }
 now+=16000;current=70;
 assert.equal(api.request(track.id),false,"per-song session cap protects iPhone");
 assert.equal(clips,3);
 assert.equal(closed,3,"offline decoders must be closed after each window");
 // Same catalog ID on a different profile must not inherit the first
 // profile's cap, pending work, or previously inspected lyric windows.
 profile="Diego";current=4;now+=16000;
 assert.equal(api.request(track.id),true);
 await new Promise(resolve=>setTimeout(resolve,40));
 assert.equal(clips,4);
 assert.equal(downloads,4);
 assert.equal(closed,4);
 assert.ok(!memory.has("mb.audioWords.fail.Ste."+track.id),
  "healthy analysis does not create another profile's error cooldown");
});


test("immersive karaoke rejects stale lyrics from a different recording during DJ handoff",()=>{
 const immersive=fs.readFileSync(path.join(__dirname,"..","immersive.js"),"utf8");
 const start=immersive.indexOf("const incoming=b?.lyricsData?.()||null;");
 const end=immersive.indexOf("const signature=",start);
 assert.ok(start>0&&end>start,"the real immersive source must verify the recording");
 const current={id:"b-track-205",text:"Amelie",synced:[{t:10,text:"Amelie"}]};
 const previous={id:"b-track-213",text:"Jolly",synced:[{t:10,text:"Jolly"}]};
 const choose=new Function("b","id",immersive.slice(start,end)+"return next;");
 assert.equal(choose({lyricsData:()=>previous},current.id),null,
  "stale Jolly provider data must not replace current Amelie lyrics");
 assert.deepEqual(choose({lyricsData:()=>current},current.id),current);
 assert.deepEqual(choose({lyricsData:()=>({text:"No explicit ID"})},current.id),
  {text:"No explicit ID"},"legacy verified built-in lyrics remain available");
 assert.match(immersive,/Date\.now\(\)-lastLyricsRefreshAt>1800/,
  "on-screen corrections should propagate promptly, without polling at frame rate");
});


test("distinct long vocals keep their measured onset beyond an early LRC cue, unlike repeated hooks",()=>{
 const alignSource=fs.readFileSync(path.join(__dirname,"..","audio-lyrics-align.js"),"utf8");
 const karaokeSource=fs.readFileSync(path.join(__dirname,"..","word-karaoke.js"),"utf8");
 const win={};
 new Function("window","globalThis",alignSource)(win,win);
 new Function("window","globalThis",karaokeSource)(win,win);
 const text="Every single night the city remembers your name";
 const tokens=text.split(" ");
 const makeChunks=(offset,wrong=-1)=>tokens.map((word,i)=>({
  text:" "+(i===wrong?"different":word),
  timestamp:[+(offset+i*.31).toFixed(3),+(offset+i*.31+.22).toFixed(3)]
 }));
 const base=[{t:10,text},{t:18,text:"A different line begins"}];
 const measured=win.MusicBoxAudioAlign.alignWindow(base,makeChunks(12.35),0,28);
 assert.equal(measured.length,1,"seven-plus exact unique words can confirm a late vocal");
 assert.equal(measured[0].sourceT,10,"the original LRC anchor is retained");
 assert.equal(measured[0].t,12.35,"the first measured syllable drives display");
 const stored=win.MusicBoxWordKaraoke.normalizeRows(measured);
 assert.equal(stored[0].sourceT,10,"normalization must not drop a trusted 2.35s correction");
 assert.equal(stored[0].t,12.35);
 assert.equal(stored[0].words.length,tokens.length);
 assert.equal(win.MusicBoxAudioAlign.alignWindow(base,makeChunks(12.85),0,28).length,0,
  "an implausible 2.85-second shift is rejected");
 assert.equal(win.MusicBoxAudioAlign.alignWindow(base,makeChunks(12.35,3),0,28).length,0,
  "even one incorrect word prevents a measured correction");
 const short=[{t:10,text:"We feel the music tonight"},{t:18,text:"Another lyric line"}];
 const lateShort="We feel the music tonight".split(" ").map((word,i)=>({
  text:" "+word,timestamp:[12.1+i*.30,12.32+i*.30]
 }));
 assert.equal(win.MusicBoxAudioAlign.alignWindow(short,lateShort,0,28).length,0,
  "short repeated hooks cannot use the extended lag allowance");
 const appSource=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
 assert.match(appSource,/row\.t>=original\.t-\.45&&row\.t<=original\.t\+maxLag/,
  "the save path must preserve the same validated offset bounds");
 assert.match(appSource,/return \{id:currentId,text:String\(l\.text\|\|""\)/,
  "immersive karaoke must receive the currently playing recording ID");
});

test("audio-aligned karaoke rebuilds the line order when measured syllables cross LRC timestamps",()=>{
 const start=app.indexOf("  function _righeKaraokeInOrdine(");
 const end=app.indexOf("  async function _salvaParoleDallAudio(",start);
 assert.ok(start>=0&&end>start,"measured-line order gate is present");
 const ordered=new Function(app.slice(start,end)+"return _righeKaraokeInOrdine;")();
 assert.equal(ordered([{t:6},{t:7.2},{t:9.5}]),true);
 assert.equal(ordered([{t:6},{t:7.2},{t:7.2}]),true,
  "simultaneous lyric cues do not require a needless DOM rebuild");
 assert.equal(ordered([{t:6},{t:9.1},{t:8.8}]),false,
  "a late voice onset must not leave an unsorted binary-search timeline");
 assert.equal(ordered([{t:6},{t:NaN},{t:10}]),false);
 assert.equal(ordered([{t:6},{t:-1}]),false);
 assert.match(app,/const inPlace=_righeKaraokeInOrdine\(joined\)&&/);
 assert.match(app,/\}else openLyrics\(\);/);
});

test("last karaoke verse stops glowing after the measured final sung word",()=>{
 const begin=app.indexOf("  function activeLineIndex(time) {");
 const end=app.indexOf("  // Native timeupdate events",begin);
 assert.ok(begin>=0&&end>begin);
 const choose=(row)=>new Function("lyricLines","_lyricWordParts",
  app.slice(begin,end)+"return activeLineIndex;")(
  [{dataset:{t:"10"}},{dataset:{t:"80"}}],
  [{row:{t:10}},{row}]);
 const measured=choose({t:80,words:[
  {t:80,text:"fine ",end:81},{t:82,text:"canzone",end:82.7}]});
 assert.equal(measured(84.9),1);
 assert.equal(measured(85.21),-1,
  "do not light the final line for 9s after its last measured syllable");
 const explicit=choose({t:80,end:86,words:[{t:82,end:82.7}]});
 assert.equal(explicit(87.1),1,"honor longer verified line endings");
 assert.equal(explicit(88.6),-1);
 const unknown=choose({t:80});
 assert.equal(unknown(88),1,"do not invent an early finish without word timing");
 assert.equal(unknown(89.1),-1);
});
