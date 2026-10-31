"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const a=fs.readFileSync("app.js","utf8");
assert(!a.includes("_accendiSilenzio("),"Non avviare due audio player contemporanei");
assert(!a.includes("_silenzio ="),"Keepalive non richiesto");
assert(a.includes('navigator.audioSession.type = "playback"'),"Categoria playback non impostata");
assert(a.includes("if (a !== audio) return; /* evento di un vecchio lettore"),"Eventi audio obsoleti non protetti");
const start=a.indexOf("  function _controllaCheSuoni() {"),end=a.indexOf("  /* Quando il brano e' finito",start);
assert(start>=0&&end>start,"Watchdog assente");
const code=a.slice(start,end);
let rebuild=0,retries=0,started=0;
const audio={paused:false,ended:false,readyState:4,currentTime:38,duration:180,play:()=>Promise.resolve()};
const context={Date:{now:()=>20000},audio,currentId:"test",document:{hidden:true},
 _vuoleSuonare:true,_ultimoScorrimento:1000,_silenziDiFila:2,
 _finitoSenzaAvanti(){},_riprovaPiuTardi(){retries++},rebuildAudio(){rebuild++},
 _nascondiAiuto(){},current(){return {id:"test"}},console};
vm.runInNewContext(code+"\nthis.watch=_controllaCheSuoni;",context);
context.watch();assert.equal(rebuild,0,"Il player non va distrutto in background");
assert.equal(retries,0,"Niente tentativi invasivi in background");
context.document.hidden=false;context.watch();
assert.equal(rebuild,1,"Il recupero in primo piano deve restare disponibile");
const media=a.slice(a.indexOf("  function updateMediaSession() {"),a.indexOf("  function totalDuration() {"));
assert(media.includes("if (!t || !currentId) return"),"Non creare media session senza brano");
assert(media.includes('!audio.ended ? "playing" : "paused"'),"Stato incoerente");
const p=a.slice(a.indexOf("  async function doPlay("),a.indexOf("  /* ---------- Se l'iPhone non fa partire",a.indexOf("  async function doPlay(")));
assert(!p.includes('setPlaybackState("playing")'),"Non segnare playing prima del play reale");
const initial=a.slice(a.indexOf("  (async function init() {"),a.indexOf("    _resetEmanueleSeNecessario();",a.indexOf("  (async function init() {")));
assert(initial.includes('setPlaybackState("none")'),"Inizializzazione corretta");
assert(!initial.includes('setPlaybackState("playing")'),"Fake playing iniziale");
console.log("OK: nessun player muto concorrente, sessione playback, pause/play reali, watchdog non distruttivo in background");
