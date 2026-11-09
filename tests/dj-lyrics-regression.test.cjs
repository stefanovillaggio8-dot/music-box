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
 assert.match(app,/let _vistaTestiCompleta=true/);
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
 assert.equal(version,"6.706");
 assert.match(app,/wordRows:r\.wordRows\|\|\[\]/);
 assert.match(app,/wordRows: risultato\.wordRows \|\| \[\]/);
 assert.match(app,/wordSyncOnly:true,syncedOnly:true/);
 assert.match(app,/requestWordLyrics:\(id\)=>_verificaParoleKaraoke/);
 assert.match(app,/engine\?\.fromRecord\(j\)/);
 assert.match(app,/window\.MusicBoxWordKaraoke\?\.spanWords\(document,line,p\)/);
 assert.match(immersive,/window\.MusicBoxWordKaraoke\?\.paintWords/);
 assert.match(immersive,/PAROLA PER PAROLA/);
 assert.match(html,/word-karaoke\.js\?v=6706/);
 assert.match(sw,/word-karaoke\.js\?v=6706/);
 assert.match(css,/\.lyr-line\.on \.karaoke-word/);
 assert.match(css,/\.im-line\.active \.karaoke-word/);
});
