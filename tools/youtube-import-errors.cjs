#!/usr/bin/env node
"use strict";
// Questa funzione non usa credenziali, reti o dati personali.
function classifyImportFailure(detail) {
  const msg=String(detail||"");
  if (/error\.api\.youtube\.login|sign in to confirm|login_required|not a bot|automated requests|verifica anti-bot|richiede una verifica anti-bot/i.test(msg))
    return "YouTube richiede verifica/login al server cloud: il PO Token non elimina i blocchi IP. Nessun MP3 pubblicato.";
  if (/error\.api\.youtube\.copyright|copyright claim|video unavailable|video is unavailable|private video|video is private|members-only|age.restricted/i.test(msg))
    return "Video non disponibile o soggetto a restrizioni; nessun MP3 pubblicato.";
  if (/HTTP Error 403|HTTP 403|error\.api\.youtube\.blocked|forbidden|po token.*(?:failed|error|missing)/i.test(msg))
    return "YouTube ha rifiutato l'accesso allo stream (403/token); nessun MP3 pubblicato.";
  if (/timed out|timeout|network is unreachable|temporary failure|econnreset|enotfound/i.test(msg))
    return "Servizio audio temporaneamente non raggiungibile; nessun MP3 pubblicato.";
  if (/ffmpeg.*(?:not found|not recognized|not installed)/i.test(msg))
    return "Convertitore audio del server non disponibile; nessun MP3 pubblicato.";
  return "Nessun MP3 ottenuto: controlla disponibilita', autorizzazione e formato del video.";
}
module.exports={classifyImportFailure};
