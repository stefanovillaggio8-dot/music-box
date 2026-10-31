#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const runner = path.resolve(__dirname, "import-youtube-online.cjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "mb-online-import-"));
const id = "abcdefghijk";
function request(link, profile = "Ste", rights = "CONFERMO", name = "Artista - Brano") {
  const event = path.join(root, "event.json");
  fs.writeFileSync(event, JSON.stringify({issue:{body:
    "YouTube: " + link + "\nProfilo: " + profile + "\nNome: " + name + "\nDiritti: " + rights}}));
  return spawnSync(process.execPath, [runner], {
    cwd: root, encoding: "utf8", timeout: 8000,
    env: {...process.env, GITHUB_EVENT_PATH:event, GITHUB_OUTPUT:path.join(root,"output.txt")}
  });
}
try {
  const forbidden = request("https://example.com/?v=" + id);
  assert.notEqual(forbidden.status, 0, "Un dominio esterno non deve essere accettato");
  const noRights = request("https://youtu.be/" + id, "Ste", "NO");
  assert.notEqual(noRights.status, 0, "Serve il consenso ai diritti");
  fs.mkdirSync(path.join(root,"songs"));
  fs.writeFileSync(path.join(root,"songs","youtube-"+id+".mp3"), Buffer.from("fixture"));
  const ok = request("https://youtu.be/" + id, "Ste");
  assert.equal(ok.status, 0, "Importazione di MP3 esistente: " + ok.stderr);
  let list = JSON.parse(fs.readFileSync(path.join(root,"online-imports.json"), "utf8"));
  assert.equal(list.length, 1);
  assert.equal(list[0].title, "Brano");
  assert.equal(list[0].artist, "Artista");
  assert.equal(list[0].profile, "Ste");
  assert.equal(list[0].file, "songs/youtube-" + id + ".mp3");
  assert.equal(request("https://www.youtube.com/watch?v=" + id, "Ste").status, 0);
  list = JSON.parse(fs.readFileSync(path.join(root,"online-imports.json"), "utf8"));
  assert.equal(list.length, 1, "La stessa canzone non va duplicata");
  assert.equal(request("https://www.youtube.com/watch?v=" + id, "Diego").status, 0);
  list = JSON.parse(fs.readFileSync(path.join(root,"online-imports.json"), "utf8"));
  assert.equal(list.length, 2, "La stessa canzone puo' appartenere a un altro profilo");
  console.log("OK: dominio sicuro, diritti, metadati, duplicati e profili isolati");
} finally {
  fs.rmSync(root, {recursive:true,force:true});
}
