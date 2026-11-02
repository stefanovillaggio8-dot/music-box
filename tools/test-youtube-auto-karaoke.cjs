#!/usr/bin/env node
"use strict";
// Prove della selezione automatica dei testi YouTube senza rete e senza MP3.
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const src=fs.readFileSync("app.js","utf8");
const start=src.indexOf("  function _eAudioYouTubePerTesti(t) {");
const end=src.indexOf("  async function _completaTestoInAscolto(",start);
assert(start>=0&&end>start,"Selettore karaoke automatico assente");
const ctx={
  tracks:[
    {id:"yt-75qIYkMUGVE",source:"youtube-link",title:"WHITE KEYS",artist:"Dominic Fike",
      file:"",url:"",profile:"Ste",builtin:true},
    {id:"yt-S8oUoa0pwpo",source:"cloud-audio",title:"Sentire La Musica",artist:"Kid Yugi",
      file:"cloud/youtube-S8oUoa0pwpo.mp3",url:"https://example.test/cloud-audio",
      profile:"Ste",builtin:true},
    {id:"b-youtube-abcdefghijk",title:"My Song (Remix)",artist:"New Artist",
      file:"songs/youtube-abcdefghijk.mp3",url:"songs/youtube-abcdefghijk.mp3",
      profile:"Emanuele",builtin:true},
    {id:"b-own",title:"Locally added song",artist:"Other Artist",builtin:false,
      profile:"Ste",url:"songs/private.mp3"}
  ],
  BUILTIN:[
    {id:"b-static",title:"Older hit",artist:"Older Artist",profile:"Ste"},
    {id:"b-youtube-abcdefghijk",title:"My Song (Remix)",artist:"New Artist",profile:"Emanuele"}
  ],
  _idBranoStabile:b=>b.id,
  stripArtistPrefix:(artist,title)=>String(title).replace(new RegExp("^"+artist+" - "),""),
  profile:"Ste",DEFAULT_PROFILE:"Ste",Set,Number
};
vm.runInNewContext(src.slice(start,end)+"\nthis.select=_testiCandidatiAutomatici;this.isYT=_eAudioYouTubePerTesti;",ctx);
const out=ctx.select();
assert.equal(ctx.isYT(ctx.tracks[0]),false,"Link ancora in coda non e' un MP3");
assert.equal(ctx.isYT(ctx.tracks[1]),true,"File cloud completato deve cercare karaoke");
assert.equal(ctx.isYT(ctx.tracks[2]),true,"MP3 pubblicato su GitHub deve cercare karaoke");
assert.equal(out[0].id,"yt-S8oUoa0pwpo","YouTube pronto profilo attivo prioritario");
assert.equal(out[0].artist,"Kid Yugi");
assert.equal(out[0].title,"Sentire La Musica");
assert.equal(out[1].id,"b-youtube-abcdefghijk","YouTube pubblicato include builtin=true");
assert(!out.some(t=>t.id==="yt-75qIYkMUGVE"),"Nessuna richiesta per MP3 non ancora pronto");
assert.equal(out.filter(t=>t.id==="b-youtube-abcdefghijk").length,1,"Nessun duplicato");
assert(out.some(t=>t.id==="b-static"),"Non escludere il catalogo normale");
assert(out.some(t=>t.id==="b-own"),"Non escludere gli MP3 locali");
const worker=src.slice(src.indexOf("  function _programmaTestiKaraoke() {"),
  src.indexOf("async function playById(",src.indexOf("  function _programmaTestiKaraoke() {")));
assert(worker.includes("elencoDaCompletare=_testiCandidatiAutomatici()"),"Scanner non usa i candidati YouTube");
assert(worker.includes("const syncedOnly = !importato || !!(attuale && attuale.text);"),"Per YouTube deve cercare anche testo non sincronizzato e poi il karaoke");
assert(worker.includes("_completaTestoInAscolto(t, syncedOnly)"),"Scanner non chiama il recupero dei testi");
assert(src.includes('album: _eAudioYouTubePerTesti(t) ? ""'),"Stato cloud non deve essere confuso con il titolo album");
assert(src.includes("if(linked.some(t=>t.source===\"cloud-audio\" && t.url))"),"La conversione conclusa non avvia la ricerca");
assert(src.includes("dbPutLyrics(entry)"),"Risultati non salvati in IndexedDB");
console.log("OK: karaoke automatico YouTube completato, priorita per profilo, fallback testo, no MP3 fittizi, cache lyrics intatta");
