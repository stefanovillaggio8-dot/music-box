"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const src = fs.readFileSync("app.js", "utf8");
function between(start, end) {
  const i = src.indexOf(start), j = src.indexOf(end, i + start.length);
  assert(i >= 0 && j > i, "Blocco non trovato: " + start);
  return src.slice(i, j);
}
const fav = between("  function _preferitiConScelte(lista, scelte) {", "  function loadProfileState() {");
const storage = {};
const favoritesContext = {
  Set, Object, Array, Date,
  profile: "Ste", favorites: new Set(), db: null,
  profileState: (name) => (storage[name] ||= {favs: [], favOverrides: {}}),
  writeProfileState: (name, patch) => Object.assign(storage[name] ||= {}, patch)
};
vm.runInNewContext(fav + '\nthis.api = { apply: _preferitiConScelte, merge: _unisciPreferitiRemoti, save: _memorizzaSceltaPreferito };', favoritesContext);
const api = favoritesContext.api;
const own = new Set(["b-track-1", "b-track-2"]);
let got = api.merge(new Set(), ["b-track-1"], {}, own);
assert(got.has("b-track-1"), "Un preferito remoto nuovo va importato");
favoritesContext.favorites = new Set(got);
favoritesContext.favorites.delete("b-track-1");
api.save("b-track-1", false);
assert.equal(storage.Ste.favOverrides["b-track-1"], false);
got = api.merge(new Set(storage.Ste.favs), ["b-track-1"], storage.Ste.favOverrides, own);
assert(!got.has("b-track-1"), "Un vecchio server non deve ripristinare un cuore tolto");
favoritesContext.favorites = got;
favoritesContext.favorites.add("b-track-2");
api.save("b-track-2", true);
got = api.apply(storage.Ste.favs, storage.Ste.favOverrides);
assert(got.has("b-track-2"), "Un cuore aggiunto deve essere letto dal salvataggio");
got = api.merge(got, ["b-track-100"], storage.Ste.favOverrides, own);
assert(!got.has("b-track-100"), "Preferiti altrui non devono contaminare Ste");

const block = between("  let _statsPosVisto = 0;", "  /* Fa partire il cronometro delle statistiche. */");
let now = 0, listened = 0;
const fakeDate = { now: () => now };
const audio = {currentTime: 0, paused: false, ended: false, seeking: false, _mbCambioBrano: false, playbackRate: 1};
const stats = { audio, Date: fakeDate, isFinite, Math, Number, _vuoleSuonare: true,
  current: () => ({id:"b-track-1"}), _segnaAscolto: (song, sec) => listened += sec };
vm.runInNewContext(block + '\nthis.statApi = { follow:_seguiAscolto, reset:_chiudiAscolto, start:_iniziaAscolto };', stats);
function tick(ms, pos) { now += ms; audio.currentTime = pos; stats.statApi.follow(audio); }
tick(1000, 0);
tick(1000, 1);
tick(1000, 2);
assert(listened > 0.5 && listened < 1.5, "L'ascolto normale non viene contato");
const beforePause = listened;
stats._vuoleSuonare = false; audio.paused = true; stats.statApi.reset(false);
tick(180000, 2);
assert.equal(listened, beforePause, "La pausa anche lunga non deve contare");
audio.paused = false; stats._vuoleSuonare = true;
tick(1000, 2);
tick(1000, 3);
assert(listened > beforePause, "Dopo play deve riprendere il conteggio");
const beforeSeek = listened;
tick(700, 123); // browser che non emette seeking
assert.equal(listened, beforeSeek, "Saltare avanti non conta neppure i 0.7s della manovra");
audio.seeking = true; tick(200, 160);
audio.seeking = false; stats.statApi.reset(false);
tick(500, 160);
assert.equal(listened, beforeSeek, "Anche la ricerca con seeking/seeked non conta");
tick(1000, 161);
assert(listened > beforeSeek, "Il tempo ascoltato dopo il salto viene contato");
stats._vuoleSuonare = false; tick(1000, 162);
assert(listened < beforeSeek + 2.2, "Una pausa richiesta dalla lockscreen non deve contare");
console.log("OK: cuore aggiunto/rimosso resiste al server vecchio, isolamento per profilo, pausa background e seek non contano");
