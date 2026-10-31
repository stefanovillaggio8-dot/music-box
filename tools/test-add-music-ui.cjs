"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html","utf8"), app=fs.readFileSync("app.js","utf8"), css=fs.readFileSync("style.css","utf8");
for (const id of ["fab","fabMenu","fabChiudi","fabImporta","fabYouTube","fabSpotify","fabGuide",
  "fabCercaTitolo","fabProfiloNome","btnAggiungiMusica","btnImport","btnSpotify","btnAiuto"]) {
  assert.equal((html.match(new RegExp('id="' + id + '"',"g"))||[]).length,1,id + " assente o duplicato");
}
assert(html.includes("File audio dal telefono"),"File non distinguibile");
assert(html.includes('id="ytImportaFile"'),"Manca importazione diretta da File nel pannello YouTube");
assert(html.includes('https://cobalt.tools/') && html.includes('sito esterno'),"Link convertitore non etichettato");
assert(html.includes('File → Download'),"Istruzioni iPhone mancanti");
assert(app.includes('$("ytImportaFile").addEventListener("click"') && app.includes("fileInput.click();"),"Scelta file non collegata");
assert(css.includes(".yt-file-fallback-actions") && css.includes(".fab-file-walkthrough"),"Stili non presenti");

assert(html.includes("Riconosci titoli da uno screenshot"),"Screenshot confuso con MP3");
assert(html.includes("La pubblicazione online riesce solo") || html.includes("La pubblicazione online riesce solo"),
  "Manca avviso sulla pubblicazione");
assert(html.includes("non significa") && html.includes("MP3"),"Spiegazioni import incomplete");
assert(app.includes('const prof = $("fabProfiloNome")') && app.includes("prof.textContent = profile"),"Profilo del menu non dinamico");
assert(app.includes('$("btnAggiungiMusica").addEventListener'),"Azione menu Altro non collegata");
assert(app.includes('$("fabSpotify").addEventListener') && app.includes('if (b) b.click()'),"Spotify non collegato");
assert(app.includes('$("fabGuide").addEventListener') && app.includes("_apriAiuto()"),"Guida non collegata");
assert(css.includes(".fab-sheet-options") && css.includes(".aiuto-guida-grid"),"Stili menu/guida assenti");
assert(!app.includes('await caches.delete('),"Cancellazione non sicura trovata nel lettore");
console.log("OK: aggiunta da File/YouTube/Spotify, profilo attivo, aiuto, menu coerenti");
