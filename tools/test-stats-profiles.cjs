"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const src = fs.readFileSync("app.js", "utf8");
const catalogStart = src.indexOf("const BUILTIN = [");
assert(catalogStart >= 0, "Catalogo BUILTIN non trovato");
const open = catalogStart + "const BUILTIN = ".length;
const close = src.indexOf("];", open);
assert(close > open, "Fine catalogo non trovata");
const BUILTIN = vm.runInNewContext(src.slice(open, close + 1), {}, { timeout: 3000 });
assert(BUILTIN.length > 1000, "Catalogo incompleto");

const a = src.indexOf("  function _braniPerStatistiche(nome) {");
const b = src.indexOf("  function _rigaStat(", a);
assert(a >= 0 && b > a, "Funzioni statistiche assenti");
const funcs = src.slice(a, b);
const owners = ["Ste", "Emanuele", "Diego", "Ari", "Francesco"];
const originalCounts = Object.fromEntries(
  owners.map(name => [name, BUILTIN.filter(t => (t.profile || "Ste") === name).length])
);
const firstE = BUILTIN.find(t => t.profile === "Emanuele");
const firstS = BUILTIN.find(t => t.profile === "Ste");
const firstD = BUILTIN.find(t => t.profile === "Diego");
const id = t => "b-" + t.file.split("/").pop().replace(/\.mp3$/, "");
const eliminati = {};
const copiati = { Ste: [], Diego: [] };
const tracks = BUILTIN.filter(t => t.profile === "Emanuele").map(t => ({ ...t, id: id(t), builtin: true }));
const context = {
  BUILTIN, tracks, profile: "Emanuele", DEFAULT_PROFILE: "Ste",
  LS: { get(k, fallback) { return k === "mb.eliminati" ? eliminati : fallback; } },
  _idBranoStabile: id,
  _mieiCopiatiDi: name => new Set(copiati[name] || []),
  profileState: () => ({ stats: {} }),
  _artistiDi: list => new Set(list.map(t => t.artist).filter(Boolean)).size,
  eGiaCondiviso: () => true
};
const numeri = vm.runInNewContext(funcs + "\n_numeriProfilo", context, { timeout: 3000 });
for (const name of owners) {
  assert.equal(numeri(name).brani, originalCounts[name],
    "Numero errato per " + name + " mentre e' aperto Emanuele");
}
const firstEid = id(firstE), firstSid = id(firstS), firstDid = id(firstD);
copiati.Ste.push(firstEid);
assert.equal(numeri("Ste").brani, originalCounts.Ste + 1, "Copia in Ste ignorata");
eliminati["Ste." + firstSid] = 1;
assert.equal(numeri("Ste").brani, originalCounts.Ste, "Eliminazione Ste ignorata");
assert.equal(numeri("Emanuele").brani, originalCounts.Emanuele,
  "Eliminazione in Ste ha modificato Emanuele");
eliminati["Diego." + firstDid] = 1;
assert.equal(numeri("Diego").brani, originalCounts.Diego - 1, "Eliminazione Diego ignorata");
tracks.push({ id: "importato-test", profile: "Emanuele", title: "Brano locale di test",
  artist: "Artista locale", builtin: false });
assert.equal(numeri("Emanuele").brani, originalCounts.Emanuele + 1,
  "Brano locale del profilo attivo ignorato");
console.log("OK: conteggi reali per Ste, Emanuele, Diego, Ari e Francesco; copie, eliminazioni e brani locali rispettati");
