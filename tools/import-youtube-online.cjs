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
const { resolveLicensedAudio } = require("./resolve-licensed-audio.cjs");

const MAX_BYTES = 24 * 1024 * 1024;
const MAX_SECONDS = 12 * 60;
const manifestFile = "online-imports.json";
const body = process.env.MB_IMPORT_JSON_PATH
  ? (() => {
      const task = JSON.parse(fs.readFileSync(process.env.MB_IMPORT_JSON_PATH,"utf8"));
      if (!task || !/^[A-Za-z0-9_-]{11}$/.test(task.video_id || "")) throw new Error("Invalid cloud job");
      return "YouTube: https://www.youtube.com/watch?v="+task.video_id+"\n"+
        "Profilo: "+task.profile+"\nNome: "+(task.requested_title || "")+"\nDiritti: CONFERMO";
    })()
  : String(JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")).issue?.body || "");

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
async function main() {
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
  // Un solo passaggio yt-dlp evita doppie richieste per lo stesso video.
  // Non si aggirano login, verifiche anti-bot o controlli sui diritti.
  let details = {};
  const url = "https://www.youtube.com/watch?v=" + id;
  const infoFile = "songs/youtube-" + id + ".info.json";
  const previous = entries.find(x => x.file === file && x.title);
  // Fonte alternativa che non copia stream YouTube: brani autonomamente
  // pubblicati CC0 e verificati con artista, titolo e file unico.
  // Quando la corrispondenza non e' rigorosa non si sostituisce l'audio.
  let licensed=null;
  if(!fs.existsSync(file)){
    try {
      licensed=await resolveLicensedAudio({videoId:id,requestedTitle:requested,file});
      if(licensed){
        details={title:licensed.title,artist:licensed.artist};
        console.log("Audio CC0 verificato:",licensed.sourceUrl);
      }
    }catch(e){
      console.warn("Catalogo CC0 non disponibile:",String(e.message||e).slice(0,130));
      if(fs.existsSync(file))fs.rmSync(file);
    }
  }
  if (fs.existsSync(file)) {
    if (previous) details = { track: previous.title, artist: previous.artist };
    console.log("Riutilizzo MP3 gia' nell'archivio: " + file);
  } else {
    fs.mkdirSync("songs", {recursive:true});
    console.log("Preparo MP3 autorizzato " + id + " in un solo passaggio");
    try {
      run("yt-dlp", [
        "--ignore-config", "--js-runtimes", "deno", "--no-playlist",
        "--no-warnings", "--no-progress", "--socket-timeout", "20",
        "--retries", "3", "--fragment-retries", "3",
        "--retry-sleep", "http:linear=1:3:1",
        "--format", "bestaudio/best",
        "--match-filters", "duration <= 720",
        "--max-filesize", "24M",
        "--extract-audio", "--audio-format", "mp3", "--audio-quality", "5",
        "--write-info-json",
        "--output", "songs/youtube-" + id + ".%(ext)s",
        url
      ], 240000);
      if (!fs.existsSync(file)) {
        fail("YouTube non ha fornito un audio valido: verifica durata, accesso e formato.");
      }
      if (fs.existsSync(infoFile)) details = JSON.parse(fs.readFileSync(infoFile,"utf8"));
      const seconds = Number(details.duration);
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS ||
          details.is_live || details.live_status === "is_live") {
        fail("Video live, durata sconosciuta o superiore a 12 minuti.");
      }
    } catch (e) {
      if (fs.existsSync(file)) fs.rmSync(file);
      const detail = String((e && (e.stderr || e.message)) || e);
      if (/sign in to confirm.{0,150}(?:bot|human)|not a bot|automated requests/i.test(detail)) {
        fail("YouTube richiede una verifica anti-bot al server: non e' stato possibile ottenere l'audio.");
      }
      throw e;
    } finally {
      try { if (fs.existsSync(infoFile)) fs.rmSync(infoFile); } catch (_) {}
    }
  }
  if (!fs.existsSync(file) || fs.statSync(file).size <= 0) fail("Nessun MP3 valido prodotto.");
  if (fs.statSync(file).size > MAX_BYTES) {
    fs.rmSync(file);
    fail("MP3 superiore a 24 MB. Nessun file pubblicato.");
  }
  const secondsAudio = Number(run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file
  ], 20000).trim());
  if (!Number.isFinite(secondsAudio) || secondsAudio <= 0 || secondsAudio > MAX_SECONDS + 1)
    fail("Verifica MP3 fallita: file audio vuoto, corrotto o troppo lungo.");
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
    youtubeId: id,
    ...(licensed ? {audioSource:licensed.source,
      sourceUrl:licensed.sourceUrl,license:licensed.license} : {})
  });
  entries.sort((a, b) => String(a.profile).localeCompare(String(b.profile)) ||
    String(a.title).localeCompare(String(b.title)));
  fs.writeFileSync(manifestFile, JSON.stringify(entries, null, 2) + "\n");
  output("title", title);
  output("file", file);
  output("status", "added");
  console.log("Pronto per pubblicazione: " + profile + " - " + title);
}
main().catch(e => {
  const detail = String((e && (e.stderr || e.message)) || e || "Errore sconosciuto");
  const publicError = /sign in to confirm.{0,150}(?:bot|human)|verifica anti-bot|automated requests/i.test(detail)
    ? "YouTube blocca il download dai server GitHub (controllo anti-bot)."
    : /ffmpeg.*(?:not found|not recognized|not installed)/i.test(detail)
    ? "Il convertitore audio del server non e' disponibile."
    : "Importazione fallita: verifica disponibilita', diritti e formato del video.";
  if (process.env.RUNNER_TEMP) {
    try { fs.writeFileSync(path.join(process.env.RUNNER_TEMP, "musicbox-cloud-error.txt"), publicError); } catch (_) {}
  }
  console.error("IMPORTAZIONE FALLITA:", detail);
  process.exitCode = 1;
});
