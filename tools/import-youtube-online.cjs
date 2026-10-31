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
const { fetchMP3 } = require("./cobalt-audio-fallback.cjs");

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
      // Due client di estrazione supportati da yt-dlp: il secondo e' utile
      // quando i formati del client predefinito non sono disponibili.
      // Nessun iframe, nessuna registrazione dal lettore, niente credenziali.
      const clients = [
        {name:"default", args:[]},
        {name:"android_vr", args:["--extractor-args","youtube:player_client=android_vr"]}
      ];
      let lastError=null;
      for (const client of clients) {
        try {
          console.log("Client yt-dlp:",client.name);
          run("yt-dlp", [
            "--ignore-config", "--js-runtimes", "deno", "--no-playlist",
            "--no-warnings", "--no-progress", "--socket-timeout", "20",
            "--retries", "2", "--fragment-retries", "2",
            "--format", "bestaudio/best",
            "--match-filters", "duration <= 720",
            "--max-filesize", "24M",
            "--extract-audio", "--audio-format", "mp3", "--audio-quality", "5",
            "--write-info-json",
            "--output", "songs/youtube-" + id + ".%(ext)s",
            ...client.args, url
          ], 175000);
          if (fs.existsSync(file) && fs.statSync(file).size > 0) {
            lastError=null;
            break;
          }
          lastError=new Error("Il client "+client.name+" non ha creato un MP3.");
        } catch (error) {
          lastError=error;
          if(fs.existsSync(file))fs.rmSync(file);
        }
      }
      if(lastError && !fs.existsSync(file)){
        // Cobalt viene eseguito solo localmente dal runner. Non usiamo
        // convertitori pubblici o pagine con popup e non apriamo YouTube.
        try{
          console.log("yt-dlp senza MP3: provo Cobalt locale");
          await fetchMP3(id,file);
          lastError=null;
          console.log("Cobalt ha prodotto un file MP3.");
        }catch(cobaltError){
          console.error("Cobalt fallito:",String(cobaltError.message||cobaltError).slice(0,180));
          throw new Error("Nessuno dei convertitori ha ottenuto audio. yt-dlp: "+
            String(lastError?.stderr||lastError?.message||lastError||"").slice(-350)+
            " | Cobalt: "+String(cobaltError.message||cobaltError).slice(0,180));
        }
      }
      if(lastError)throw lastError;
      if (!fs.existsSync(file)) {
        fail("Nessuno dei convertitori ha prodotto un MP3.");
      }
      if (fs.existsSync(infoFile)) details = JSON.parse(fs.readFileSync(infoFile,"utf8"));
      // Cobalt non produce il file metadati di yt-dlp. La durata va
      // verificata direttamente dall'audio, senza rifiutare i file validi.
      if(!Number.isFinite(Number(details.duration))){
        const ffprobe=run("ffprobe",[
          "-v","error","-show_entries","format=duration",
          "-of","default=noprint_wrappers=1:nokey=1",file
        ],20000).trim();
        details.duration=Number(ffprobe);
      }
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
  // Non basta chiamare un file ".mp3": verifica il codec reale.
  const codec = run("ffprobe",[
    "-v","error","-select_streams","a:0","-show_entries","stream=codec_name",
    "-of","default=noprint_wrappers=1:nokey=1",file
  ],20000).trim();
  if(codec!=="mp3"){
    const converted=file+".converted.mp3";
    try{
      console.log("Converto audio",clean(codec,40),"in MP3 autentico.");
      run("ffmpeg",["-nostdin","-hide_banner","-loglevel","error","-y",
        "-i",file,"-map","0:a:0","-vn","-c:a","libmp3lame","-q:a","5",converted],130000);
      if(!fs.existsSync(converted) || fs.statSync(converted).size<=0 ||
        fs.statSync(converted).size>MAX_BYTES)fail("MP3 ricodificato non valido.");
      fs.renameSync(converted,file);
    }finally{
      if(fs.existsSync(converted))fs.rmSync(converted);
    }
    const finalCodec=run("ffprobe",[
      "-v","error","-select_streams","a:0","-show_entries","stream=codec_name",
      "-of","default=noprint_wrappers=1:nokey=1",file
    ],20000).trim();
    if(finalCodec!=="mp3")fail("Codifica MP3 finale non verificata.");
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
