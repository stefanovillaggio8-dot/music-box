#!/usr/bin/env node
/**
 * Recupera le copertine esatte dei brani Spotify tramite il loro ID, non
 * attraverso fuzzy matching artista/titolo. Non scarica MP3 o testi.
 * Esecuzione: node tools/fill-spotify-covers.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const app = await readFile("app.js", "utf8");
const startMarker = "const BUILTIN = [";
const start = app.indexOf(startMarker);
const end = app.indexOf("];", start);
if (start < 0 || end < start) throw new Error("Catalogo BUILTIN mancante");
const catalog = vm.runInNewContext("[" + app.slice(start + startMarker.length, end) + "]", {}, { timeout: 5000 });
if (!Array.isArray(catalog) || catalog.length < 1000) throw new Error("Catalogo incompleto");
const songs = catalog.filter(t => t && typeof t.spotifyId === "string" && /^[A-Za-z0-9]{22}$/.test(t.spotifyId));
const fileName = "covers-spotify.json";
let saved = {};
try {
  const obj = JSON.parse(await readFile(fileName, "utf8"));
  if (obj && typeof obj === "object" && !Array.isArray(obj)) saved = obj;
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const perRun = Number(process.env.MAX_SPOTIFY_COVERS || 1250);
let attempts = 0, successful = 0, errors = 0, blocked = 0;
for (const t of songs) {
  if (attempts >= perRun || blocked >= 10) break;
  if (saved[t.spotifyId]?.cover?.startsWith("https://")) continue;
  attempts++;
  const url = "https://open.spotify.com/oembed?url=" +
    encodeURIComponent("https://open.spotify.com/track/" + t.spotifyId);
  let data = null;
  for (let retry = 0; retry < 3; retry++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(18000),
        headers: { "User-Agent": "MusicBox/6.420 (https://github.com/stefanovillaggio8-dot/music-box)" }
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(Math.min(4000 * (retry + 1), 14000));
        continue;
      }
      if (response.status === 403) blocked++;
      if (!response.ok) break;
      data = await response.json();
      break;
    } catch (e) {
      if (retry < 2) await sleep(1200 * (retry + 1));
    }
  }
  if (data?.thumbnail_url && /^https:\/\//.test(data.thumbnail_url)) {
    saved[t.spotifyId] = {
      cover: data.thumbnail_url,
      title: t.title,
      artist: t.artist,
      album: t.spotifyAlbum || "",
      source: "Spotify oEmbed",
      date: new Date().toISOString().slice(0, 10)
    };
    successful++;
    blocked = 0;
  } else {
    errors++;
  }
  if (attempts % 25 === 0) {
    console.log("Ricercati:", attempts, "copertine trovate:", successful, "errori:", errors);
  }
  await sleep(450);
}
await writeFile(fileName, JSON.stringify(Object.fromEntries(Object.entries(saved).sort()), null, 2) + "\n");
console.log(JSON.stringify({ catalog: catalog.length, spotifyIds: songs.length,
  cached: Object.keys(saved).length, attempts, successful, errors, blocked }, null, 2));
