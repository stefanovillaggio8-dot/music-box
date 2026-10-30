#!/usr/bin/env node
"use strict";
/* Copertine di brani non Spotify: cerca solo titolo e artista concordanti.
   Non cambia gli MP3, non modifica mai una copertina già presente. */
const fs = require("node:fs/promises");
const vm = require("node:vm");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function norm(v) {
  return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\([^)]*(?:feat|ft|visual|official|audio)[^)]*\)/gi, " ")
    .replace(/[^a-z0-9]+/g, "");
}
function terms(v) {
  return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\([^)]*\b(?:feat|ft|visual|official|audio)\b[^)]*\)/gi, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
}
function overlap(want, got) {
  const a = new Set(terms(want)), b = new Set(terms(got));
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / Math.max(a.size, b.size);
}
function correctTitle(want, got) {
  return norm(want) === norm(got) || overlap(want, got) >= 0.86;
}
function correctArtist(want, got) {
  const first = String(want || "").split(/,|&| feat\.?| ft\.?/i)[0].trim();
  return !!first && (norm(first) === norm(got) ||
    norm(got).includes(norm(first)) || norm(first).includes(norm(got)) ||
    overlap(first, got) >= 0.72);
}
async function getJSON(url) {
  const r = await fetch(url, {signal: AbortSignal.timeout(11000),
    headers: {"User-Agent": "MusicBoxArtworkAudit/1.0"}});
  if (!r.ok) return null;
  return r.json();
}
async function find(t) {
  const query = (t.artist + " " + t.title).trim();
  try {
    const uri = "https://itunes.apple.com/search?entity=song&country=IT&limit=30&term=" +
      encodeURIComponent(query);
    const j = await getJSON(uri);
    const items = (j && Array.isArray(j.results) ? j.results : []);
    const exact = items.filter(r => r.artworkUrl100 &&
      correctTitle(t.title, r.trackName) && correctArtist(t.artist, r.artistName));
    const album = String(t.spotifyAlbum || "");
    const preferred = exact.find(r => album && norm(album) === norm(r.collectionName)) || exact[0];
    if (preferred) return {
      cover: preferred.artworkUrl100.replace(/100x100/g, "600x600"),
      title: t.title, artist: t.artist,
      album: preferred.collectionName || album,
      source: "Apple iTunes catalogo, titolo/artista verificati",
      date: new Date().toISOString().slice(0,10)
    };
  } catch (e) { /* Apple non disponibile. */ }
  try {
    const uri = "https://api.deezer.com/search/track?limit=25&q=" +
      encodeURIComponent(query);
    const j = await getJSON(uri);
    const exact = (j && Array.isArray(j.data) ? j.data : []).filter(r => r.album?.cover_big &&
      correctTitle(t.title, r.title) && correctArtist(t.artist, r.artist?.name));
    const album = String(t.spotifyAlbum || "");
    const preferred = exact.find(r => album && norm(album) === norm(r.album?.title)) || exact[0];
    if (preferred) return {
      cover: preferred.album.cover_big, title: t.title, artist: t.artist,
      album: preferred.album.title || album,
      source: "Deezer catalogo, titolo/artista verificati",
      date: new Date().toISOString().slice(0,10)
    };
  } catch (e) { /* Nessuna corrispondenza affidabile. */ }
  return null;
}
async function main() {
  const app = await fs.readFile("app.js", "utf8"), marker = "const BUILTIN = [";
  const start = app.indexOf(marker), end = app.indexOf("];", start);
  if (start < 0 || end < start) throw Error("Catalogo non trovato");
  const songs = vm.runInNewContext("[" + app.slice(start + marker.length, end) + "]", {}, {timeout:5000});
  if (songs.length !== 1072) throw Error("Attesi 1072 brani, trovati " + songs.length);
  const known = JSON.parse(await fs.readFile("covers.json", "utf8"));
  const miss = songs.filter(t => !t.spotifyId && t.artist && t.title && !t.cover &&
    !known[norm(t.artist+" "+t.title)]);
  const unique = new Map(miss.map(t=>[norm(t.artist+" "+t.title),t]));
  let found=0,notFound=0;
  for(const [key,t] of unique) {
    const c=await find(t);
    if(c && !known[key]) {known[key]=c;found++;}
    else notFound++;
    await wait(350);
  }
  await fs.writeFile("covers.json",JSON.stringify(known,null,2)+"\n");
  console.log(JSON.stringify({candidates:unique.size,found,notFound,coverRecords:Object.keys(known).length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
