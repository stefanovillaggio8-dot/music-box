#!/usr/bin/env node
"use strict";
/*
 * Music Box - importazione cloud da una richiesta GitHub autorizzata.
 * Funziona sui runner GitHub Actions: nessun programma sul PC personale.
 * Scarica solo contenuti per i quali il richiedente dichiara di avere i diritti.
 * Se YouTube non consente l'accesso non tenta bypass di login/DRM.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const MAX_BYTES = 24 * 1024 * 1024;
const MAX_SECONDS = 12 * 60;
const manifestFile = "online-imports.json";
const body = String(JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")).issue?.body || "");

function field(name) {
  const line = body.split(/\r?\n/).find(x => x.startsWith(name + ": "));
  return line ? line.slice(name.length + 2).trim() : "";
}
function fail(reason) { throw new Error(reason); }
function videoId(link) {
  let u;
  try { u = new URL(link); } catch { fail("Il link non e' un indirizzo valido."); }
  if (u.protocol !== "https:") fail("Usa un link HTTPS di YouTube.");
  const host = u.hostname.toLowerCase();
  let id = "";
  if (host === "youtu.be" || host === "www.youtu.be") {
    id = u.pathname.split("/")[1] || "";
  } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
    if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
    else if (/^\/(shorts|live)\/[^/]+\/?$/.test(u.pathname)) id = u.pathname.split("/")[2] || "";
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) fail("Il link deve puntare a un solo video YouTube.");
  return id;
}
function clean(text, limit = 130) {
  return String(text || "").replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}
function run(command, args, timeout = 180000) {
  return execFileSync(command, args, { encoding: "utf8", timeout, maxBuffer: 8 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}
function output(name, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, name + "=" + String(value).replace(/[\r\n]/g, " ") + "\n");
}
function main() {
  const id = videoId(field("YouTube"));
  const profile = clean(field("Profilo"), 40);
  if (!profile || !/^[\p{L}\p{N} _.-]+$/u.test(profile)) fail("Profilo non valido.");
  if (field("Diritti") !== "CONFERMO") fail("Devi confermare di poter importare questo contenuto.");
  const requested = clean(field("Nome"), 160);
  const file = "songs/youtube-" + id + ".mp3";
  let entries = [];
  try {
    entries = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    if (!Array.isArray(entries)) fail("Indice online non valido.");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const existing = entries.find(x => x.file === file && x.profile === profile);
  if (existing && fs.existsSync(file)) {
    console.log("Gia' pubblicato per " + profile + ": " + file);
    output("title", clean(existing.title));
    output("status", "already");
    return;
  }
  let details = {};
  const url = "https://www.youtube.com/watch?v=" + id;
  if (!fs.existsSync(file)) {
    console.log("Leggo metadati del video " + id);
    details = JSON.parse(run("yt-dlp", ["--no-playlist", "--no-warnings", "--skip-download", "--dump-single-json",
      "--socket-timeout", "20", url], 110000));
    const seconds = Number(details.duration);
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS || details.is_live) {
      fail("Video live, durata sconosciuta o superiore a 12 minuti.");
    }
    console.log("Preparo MP3: " + clean(details.title));
    try {
      run("yt-dlp", ["--no-playlist", "--no-warnings", "--no-progress", "--socket-timeout", "20",
        "--max-filesize", "24M", "--extract-audio", "--audio-format", "mp3", "--audio-quality", "5",
        "--output", "songs/youtube-" + id + ".%(ext)s", url], 200000);
    } catch (e) {
      if (fs.existsSync(file)) fs.rmSync(file);
      throw new Error("Audio non disponibile da YouTube: " + clean(String(e.stderr || e.message).split("\n").filter(Boolean).slice(-1)[0], 190));
    }
    if (!fs.existsSync(file) || fs.statSync(file).size <= 0) fail("Non e' stato prodotto un MP3 valido.");
    if (fs.statSync(file).size > MAX_BYTES) {
      fs.rmSync(file);
      fail("MP3 superiore a 24 MB. Nessun file pubblicato.");
    }
  }
  let title = clean(details.track || details.title || "Audio YouTube " + id);
  let artist = clean(details.artist || details.creator || details.uploader || "");
  if (requested) {
    const split = requested.indexOf(" - ");
    if (split > 0) {
      artist = clean(requested.slice(0, split));
      title = clean(requested.slice(split + 3));
    } else title = requested;
  }
  if (!title) fail("Titolo non disponibile.");
  entries = entries.filter(x => !(x.file === file && x.profile === profile));
  entries.push({
    title, artist, profile, file,
    cover: "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
    youtubeId: id
  });
  entries.sort((a, b) => String(a.profile).localeCompare(String(b.profile)) ||
    String(a.title).localeCompare(String(b.title)));
  fs.writeFileSync(manifestFile, JSON.stringify(entries, null, 2) + "\n");
  output("title", title);
  output("file", file);
  output("status", "added");
  console.log("Pronto per pubblicazione: " + profile + " - " + title);
}
try { main(); } catch (e) { console.error("IMPORTAZIONE FALLITA:", e.message || e); process.exitCode = 1; }
