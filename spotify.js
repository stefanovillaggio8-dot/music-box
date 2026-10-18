/* ---------- Importa una playlist di Spotify ----------

   Ste: "posso mettere il link della mia playlist di spotify e in automatico
   importa le canzoni?".

   Come funziona, e cosa NON fa:
   - Spotify non si puo' scaricare (ha una protezione, vale per tutti), quindi
     l'audio non viene da Spotify: viene da YouTube, come sempre.
   - Da Spotify prendiamo solo l'ELENCO delle canzoni, e serve l'accesso con
     l'account di Ste perche' le sue playlist sono private. Le playlist
     pubbliche si vedrebbero anche senza, ma il login serve per le sue.
   - L'accesso e' col metodo "authorization code con PKCE": non c'e' nessuna
     password e nessun segreto, e il permesso vale solo per questa app sul
     telefono di Ste.

   Il Client ID e' pubblico (non e' una password): puo' stare nel codice.
   Comunque lo teniamo in un posto solo cosi' e' facile cambiarlo. */
const SPOTIFY_CLIENT_ID = "97b894cf504b412fa96e5a7ced1880c4";
const SPOTIFY_REDIRECT = "https://stefanovillaggio8-dot.github.io/music-box/";
const SPOTIFY_SCOPI = "playlist-read-private playlist-read-collaborative";

let _spotifyAccess = null;
let _spotifyChiave = null;   /* la "code_verifier" dell'accesso in corso */

function _spotifySalvaToken(t) {
  try {
    LS.set("mb.spotify", {
      access: t.access_token,
      scadenza: Date.now() + (Number(t.expires_in || 3600) - 60) * 1000
    });
    return true;
  } catch (e) { return false; }
}
function _spotifyToken() {
  try {
    const v = LS.get("mb.spotify", null);
    if (!v || !v.access) return "";
    if (Number(v.scadenza || 0) < Date.now()) return "";
    return String(v.access);
  } catch (e) { return ""; }
}

/* Il codice di verifica per PKCE: una stringa casuale, e il suo "impronta"
   SHA-256 che Spotify pretende di vedere al posto della password. */
async function _spotifyPkce() {
  const byte = new Uint8Array(48);
  crypto.getRandomValues(byte);
  const base = (b) => btoa(String.fromCharCode.apply(null, b))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const verifier = base(byte);
  const somma = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier: verifier, sfida: base(new Uint8Array(somma)) };
}

/* Step 1: butto Ste su Spotify per l'accesso. */
async function _spotifyAccedi() {
  if (!SPOTIFY_CLIENT_ID) { toast("Manca il Client ID di Spotify"); return; }
  let pk;
  try { pk = await _spotifyPkce(); } catch (e) {
    toast("Il telefono non mi fa fare le operazioni sicure: usa Safari aggiornato");
    return;
  }
  /* ATTENZIONE: la chiave DEVE sopravvivere al salto su Spotify.
     Se resta solo in una variabile, la pagina si ricarica e la variabile
     sparisce: al ritorno non c'e' niente da scambiare e il login fallisce
     con "Accesso scaduto". Quindi la metto via insieme al suo stato. */
  _spotifyChiave = pk.verifier;
  const stato = base(String(Date.now()));
  try {
    LS.set("mb.spotifyStato", stato);
    LS.set("mb.spotifyChiave", pk.verifier);
  } catch (e) { /* noop */ }
  const q = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT,
    scope: SPOTIFY_SCOPI,
    code_challenge: pk.sfida,
    code_challenge_method: "S256",
    state: stato
  });
  const url = "https://accounts.spotify.com/authorize?" + q.toString();

  /* Prima: far vedere che l'app ha capito e sta per portare su Spotify.
     Ste: "sto aprendo spotify ma non si apre": senza questa riga non si
     capiva nemmeno se il comando era partito. */
  try {
    _spotifyPnl("Sto aprendo Spotify", "",
      '<p class="step-hint">Ti porto su Spotify per dargli l\'accesso. ' +
      'L\'accesso me lo dai una volta sola.</p>');
  } catch (e) { /* noop */ }

  try { window.location.href = url; } catch (e) { /* non salto: vedo sotto */ }

  /* Ste: "ma non si apre". Il salto lo fa il codice da solo, e quando
     l'app e' installata sulla schermata Home il telefono lo blocca:
     non succede niente e non si capisce perche'.
     Allora: se dopo qualche secondo la pagina non e' cambiata, gli mostro
     il collegamento VERO da toccare con il dito. Un link toccato dal
     telefono funziona sempre, perche' lo gestisce il browser e non il
     nostro codice. */
  try {
    setTimeout(function () {
      /* se la pagina e' cambiata non do disturbare niente */
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        _spotifyPnl("Tocca per aprire Spotify", "una volta sola",
          '<p class="step-hint">Il telefono non ha voluto aprire la pagina da solo. ' +
          'Tocca il collegamento qui sotto: poi su Spotify premi "Accetta".</p>' +
          '<a class="btn-main" style="display:block;text-align:center;margin-top:10px" href="' +
          String(url).replace(/&/g, "&amp;") + '">Apri Spotify</a>');
      } catch (e) { /* noop */ }
    }, 2500);
  } catch (e) { /* noop */ }
}

/* Step 2: Spotify rimanda qui con ?code=... e io scambio il codice per il
   permesso vero. */
async function _spotifyCompletaAccesso(code, stato) {
  if (!code || !stato) return false;
  let salvato = "";
  try { salvato = String(LS.get("mb.spotifyStato", "")); } catch (e) {}
  if (!salvato || salvato !== stato) { toast("Accesso non valido, riprova"); return false; }
  /* La chiave la prendo da li': dopo il redirect la pagina e' nuova e la
     variabile in memoria non esiste piu'. */
  let verifier = "";
  try { verifier = String(LS.get("mb.spotifyChiave", "")); } catch (e) {}
  if (!verifier) verifier = _spotifyChiave || "";
  if (!verifier) { toast("Accesso scaduto, riprova"); return false; }
  let r;
  try {
    r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_REDIRECT,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
      }).toString()
    });
  } catch (e) { toast("Non riesco a parlare con Spotify"); return false; }
  if (!r.ok) { toast("Spotify non ha accettato l'accesso"); return false; }
  const j = await r.json();
  _spotifySalvaToken(j);
  _spotifyChiave = null;
  try {
    LS.remove("mb.spotifyStato");
    LS.remove("mb.spotifyChiave");
  } catch (e) {}
  return true;
}

async function _spotifyApi(percorso) {
  const token = _spotifyToken();
  if (!token) return null;
  try {
    const r = await fetch("https://api.spotify.com/v1" + percorso, {
      headers: { Authorization: "Bearer " + token }
    });
    if (r.status === 401) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

/* Le playlist, anche le private: per queste serve l'accesso. */
async function _spotifyPlaylist() {
  const tutte = [];
  let url = "/me/playlists?limit=50";
  for (let pagina = 0; pagina < 4 && url; pagina++) {
    const j = await _spotifyApi(url);
    if (!j) break;
    for (const p of (j.items || [])) {
      tutte.push({
        id: p.id,
        nome: p.name,
        privata: p.public === false,
        canzoni: Number((p.tracks && p.tracks.total) || 0)
      });
    }
    url = j.next ? j.next.replace("https://api.spotify.com/v1", "") : "";
  }
  return tutte;
}

/* I titoli veri della playlist: qui Spotify dà i nomi, che è quello che
   mi serve (l'audio poi lo cerco su YouTube). */
async function _spotifyBrani(playlistId) {
  const brani = [];
  let url = "/playlists/" + playlistId + "/tracks?limit=100";
  for (let pagina = 0; pagina < 12 && url; pagina++) {
    const j = await _spotifyApi(url);
    if (!j) break;
    for (const it of (j.items || [])) {
      const t = it.track;
      if (!t || !t.name || t.is_local) continue;
      const chi = (t.artists || []).map((a) => a.name).filter(Boolean).join(", ");
      if (!chi) continue;
      brani.push(t.name.replace(/\s+/g, " ").trim() + "|" + chi.replace(/\s+/g, " ").trim());
    }
    url = j.next ? j.next.replace("https://api.spotify.com/v1", "") : "";
  }
  return brani;
}

/* ============================================================
   Da qui in poi c'era il file spotify-ui.js, ora dentro questo.
   Ste: due file separati e uno solo dei due non partiva, e non si
   accorgeva di niente. Ora viaggiano insieme.
   ============================================================ */

/* ---------- La parte con cui Ste sceglie e avvia ----------

   Il flusso che aveva descritto lui:
   "premo importa le playlist di spotify, lo premo e mi dice di fare l'accesso,
    se dico sì lo fa, scelgo la playlist da importare, e se dico no non fa
    niente e l'app funziona come è ora".
   E: se il computer è spento, la lista si mette in coda e parte quando si
   accende. */
function _spotifyPnl(titolo, sotto, html) {
  const p = $("spotifyPanel");
  if (!p) return;
  $("spotifyTitolo").textContent = titolo;
  $("spotifySotto").textContent = sotto || "";
  $("spotifyCorpo").innerHTML = html || "";
  p.hidden = false;
  syncNoScroll();
}
/* === La traccia ===

   Ste: "non funziona, non dice niente, la X non chiude". Ho cambiato
   questo codice tante volte e ogni volta pensavo di aver capito: non
   avevo. Il problema e' che ogni tentativo finiva con lo stesso
   "non funziona", senza nessun indizio.

   Adesso ogni passo lascia un segno scritto dentro il pannello, uno
   sotto l'altro. Si vede esattamente dove si ferma, senza dover
   indovinare. E' roba mia di diagnostica: quando funziona si puo'
   togliere. */
function _spotifyTraccia(testo) {
  try {
    const p = $("spotifyPanel");
    if (!p) return;
    p.hidden = false;
    let box = document.getElementById("spotifyTraccia");
    if (!box) {
      box = document.createElement("div");
      box.id = "spotifyTraccia";
      box.style.cssText = "margin-top:12px;font:600 12px/1.6 ui-monospace,Consolas,monospace;" +
        "color:#7fd7ff;opacity:.9;word-break:break-word";
      const card = p.querySelector(".import-card");
      if (!card) return;
      card.appendChild(box);
    }
    const riga = document.createElement("div");
    riga.textContent = "• " + testo;
    box.appendChild(riga);
  } catch (e) { /* la traccia non deve mai bloccare niente */ }
}
if (typeof window !== "undefined") { try { window._spotifyTraccia = _spotifyTraccia; } catch (e) {} }

/* Ste: "la X per chiudere non funziona". Anche qui lascio un segno,
   cosi' si distingue "non arriva il tocco" da "arriva ma non funziona". */
function _spotifyChiudi() {
  _spotifyTraccia("X premuta");
  const p = $("spotifyPanel");
  if (p) p.hidden = true;
  const box = document.getElementById("spotifyTraccia");
  if (box && box.parentNode) box.parentNode.removeChild(box);
  try { document.body.classList.remove("no-scroll"); } catch (e) { /* noop */ }
  try { syncNoScroll(); } catch (e) { /* noop */ }
}

function _spotifyParla(variabile, testo) {
  const codice = (function () {
    try {
      const q = new URLSearchParams(window.location.search);
      return q.get(variabile) || "";
    } catch (e) { return ""; }
  })();
  return { codice: codice, testo: testo };
}

/* Il pulsante del menu. */
function _spotifyMenu() {
  _spotifyTraccia("sono dentro _spotifyMenu");
  if (_spotifyToken()) {
    _spotifyMostraPlaylist();
    return;
  }
  _spotifyPnl("Collegare Spotify",
    "",
    '<p class="step-hint">Per vedere le tue playlist serve l\'accesso al tuo ' +
    'account Spotify. Me lo dai una volta sola, non ti chiedo la password e ' +
    'il permesso vale solo su questo telefono.</p>' +
    '<button class="btn-main" id="spotifyAccedi">Accedi con Spotify</button>' +
    '<button class="btn-main" id="spotifySalta" style="margin-top:10px">Non ora</button>');
  $("spotifyAccedi").addEventListener("click", () => { _spotifyChiudi(); _spotifyAccedi(); });
  $("spotifySalta").addEventListener("click", () => {
    _spotifyChiudi();
    toast("Nessun problema, l'app resta come e'");
  });
}

async function _spotifyMostraPlaylist() {
  _spotifyPnl("Le tue playlist", "sto leggendo...", '<p class="step-hint">Un attimo...</p>');
  const tutte = await _spotifyPlaylist();
  if (!tutte.length) {
    _spotifyPnl("Playlist", "",
      '<p class="step-hint">Non sono riuscito a leggere le tue playlist. ' +
      'Prova a collegare Spotify di nuovo.</p>');
    return;
  }
  let html = '<p class="step-hint">Tocca la playlist da importare. Le canzoni ' +
    'che hai gia\' non vengono copiate due volte.</p><div class="spotify-lista">';
  for (const p of tutte) {
    html += '<button class="spotify-riga" data-id="' + p.id + '">' +
      '<span class="spotify-nome">' + p.nome + "</span>" +
      '<span class="spotify-quante">' + p.canzoni + " canzoni" +
      (p.privata ? " · privata" : "") + "</span></button>";
  }
  html += "</div>" +
    '<button class="btn-main" id="spotifyEsci" style="margin-top:12px">Chiudi</button>';
  _spotifyPnl("Le tue playlist", tutte.length + " playlist", html);

  for (const b of document.querySelectorAll(".spotify-riga")) {
    b.addEventListener("click", () => { _spotifyImporta(b.getAttribute("data-id")); });
  }
  $("spotifyEsci").addEventListener("click", _spotifyChiudi);
}

/* Leggo la lista e la mando al computer. */
async function _spotifyImporta(playlistId) {
  _spotifyPnl("Sto leggendo la playlist", "un attimo...", '<p class="step-hint">Prendo i titoli...</p>');
  const brani = await _spotifyBrani(playlistId);
  if (!brani.length) {
    _spotifyPnl("Playlist", "", '<p class="step-hint">Questa playlist non ha brani che posso usare.</p>');
    return;
  }
  /* Tolgo subito i doppioni interni: due brani uguali nella stessa lista non
     mi servono due volte. */
  const visti = new Set();
  const uniche = [];
  for (const b of brani) {
    const k = b.toLowerCase();
    if (visti.has(k)) continue;
    visti.add(k);
    uniche.push(b);
  }
  const profilo = profile;
  const riga = '<p class="step-hint"><b>' + uniche.length + " canzoni</b> da " +
    profilo + ".</p><p class=\"step-hint\">Se il computer e' spento non e' un " +
    "problema: restano in coda e partono quando lo accendi.</p>" +
    '<button class="btn-main" id="spotifyManda">Scarica ora</button>' +
    '<button class="btn-main" id="spotifyAnnulla" style="margin-top:10px">Annulla</button>';
  _spotifyPnl("Playlist pronta", uniche.length + " canzoni", riga);
  $("spotifyAnnulla").addEventListener("click", _spotifyChiudi);
  $("spotifyManda").addEventListener("click", () => { _spotifyMandaLista(uniche, profilo); });
}

/* Il passaggio vero: se il computer c'e' gliele mando subito, altrimenti le
   metto da parte e riprovo piu' tardi da sola. */
async function _spotifyMandaLista(lista, profilo) {
  const chiave = "mb.codaSpotify";
  const giunto = await ponteOnline();
  if (!giunto) {
    try { LS.set(chiave, { lista: lista, profilo: profilo, quando: Date.now() }); } catch (e) {}
    _spotifyChiudi();
    toast("Computer spento: le " + lista.length + " canzoni aspettano che lo accenda", 6000);
    return;
  }
  _spotifyPnl("Sto mandando al computer", lista.length + " canzoni", '<p class="step-hint">Un attimo...</p>');
  try {
    const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
    const r = await fetch(base + "/spotify-lista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilo: profilo, lista: lista })
    });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      _spotifyPnl("Non e' andata", "", '<p class="step-hint">' +
        (j && j.errore ? j.errore : "il computer non ha accettato la lista") + "</p>");
      return;
    }
    _spotifyChiudi();
    toast("Fatto: il computer scarica " + lista.length + " canzoni. Ci mette un po'.", 6000);
    _spotifyControllaLavoro(j.id, lista.length);
  } catch (e) {
    _spotifyPnl("Non e' andata", "", '<p class="step-hint">Non riesco a parlare con il computer.</p>');
  }
}

/* Se il computer era spento, quando si accende riprovo da sola. */
async function _spotifyRiprovaCoda() {
  let coda = null;
  try { coda = LS.get("mb.codaSpotify", null); } catch (e) {}
  if (!coda || !coda.lista || !coda.lista.length) return;
  if (!(await ponteOnline())) return;
  try {
    const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
    const r = await fetch(base + "/spotify-lista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilo: coda.profilo, lista: coda.lista })
    });
    if (r.ok) {
      const j = await r.json();
      LS.remove("mb.codaSpotify");
      toast("Ripresa la lista che aspettava: " + coda.lista.length + " canzoni", 6000);
      _spotifyControllaLavoro(j.id, coda.lista.length);
    }
  } catch (e) { /* noop */ }
}

/* Chiedo come sta andando, cosi' Ste non resta a pensare che sia finito. */
async function _spotifyControllaLavoro(id, totale) {
  let tentativi = 0;
  const guarda = async () => {
    if (tentativi++ > 400) return;
    let j = null;
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/spotify-stato?id=" + encodeURIComponent(id));
      if (r.ok) j = await r.json();
    } catch (e) { /* noop */ }
    if (!j) { setTimeout(guarda, 4000); return; }
    const fatto = Number(j.fatto || 0);
    if (j.stati === "fatto") {
      toast("Fatto: " + fatto + " canzoni scaricate e messe in libreria", 8000);
      return;
    }
    if (j.stati && String(j.stati).indexOf("errore") === 0) {
      toast("Il computer ha avuto un problema: " + j.stati, 8000);
      return;
    }
    if (fatto > 0) toast("Scaricate " + fatto + " di " + (totale || j.totale || "?") + "…", 2500);
    setTimeout(guarda, 5000);
  };
  setTimeout(guarda, 3000);
}

/* Se Spotify mi rimanda qui dopo il login, chiudo la finestrella e faccio
   partire tutto senza toccare niente. */
async function _spotifyRientro() {
  let q = null;
  try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
  const code = q.get("code") || "";
  const stato = q.get("state") || "";
  const errore = q.get("error") || "";
  if (!code && !errore) return;
  try {
    history.replaceState({}, document.title, window.location.pathname);
  } catch (e) { /* noop */ }
  if (errore) { toast("Non hai concesso Spotify: " + errore, 6000); return; }
  const ok = await _spotifyCompletaAccesso(code, stato);
  if (!ok) return;
  toast("Collegato a Spotify", 4000);
  _spotifyMostraPlaylist();
}

/* Ste: "se premo importa da spotify non apre nulla".
   Prima il bottone era collegato dentro app.js, dentro un try/catch che
   si mangiava ogni errore: se qualcosa andava storto non succedeva
   niente e non si capiva perche'. Ora il collegamento sta qui, vicino al
   resto di Spotify, e se un errore capita lo dice a voce invece di
   fallire in silenzio. */
/* Ste: "se premo importa da spotify non apre nulla" e poi, anche dopo la
   correzione: "non mi dice niente e non apre niente".

   Il fatto che non dicesse NULLA era l'indizio: se il codice di errore fosse
   partito, avrebbe scritto qualcosa. Non partiva niente, quindi il tap non
   arrivava al bottone, oppure il pannello restava nascosto e la scritta di
   errore finiva su un pannello che non si vedeva.

   Per questo adesso il pannello si rende VISIBILE al primo tocco, prima di
   fare qualsiasi altra cosa. Se poi qualcosa va storto, la scritta di
   errore resta dentro il pannello, dove la si vede, e non solo in un avviso
   che passa via. */
function _spotifySicuro(s) {
  return String(s).replace(/[&<>]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
  });
}

let _ultimoTapSpotify = 0;

function _spotifyApri() {
  _spotifyTraccia("bottone toccato");
  /* il bottone puo' ricevere due eventi per un tocco (listener + onclick):
     se arriva subito un secondo evento lo lascio passare, non rifaccio
     tutto un'altra volta */
  const ora = Date.now();
  if (ora - _ultimoTapSpotify < 800) return;
  _ultimoTapSpotify = ora;

  let p = null;
  try { p = $("spotifyPanel"); } catch (e) { p = null; }

  /* passo 1: mostrare qualcosa, subito */
  try {
    if (!p) throw new Error("il pannello di Spotify non c'e' nella pagina");
    p.hidden = false;
    $("spotifyTitolo").textContent = "Spotify";
    $("spotifySotto").textContent = "un attimo...";
    $("spotifyCorpo").innerHTML = '<p class="step-hint">Sto aprendo...</p>';
    document.body.classList.add("no-scroll");
  } catch (errore) {
    try { toast("Spotify non si apre: " + (errore && errore.message ? errore.message : String(errore)), 8000); } catch (e) {}
    return;
  }

  _spotifyTraccia("pannello aperto");
  /* passo 2: chiudere il menu Altro e aprire il contenuto vero */
  try { if (typeof _chiudiAltro === "function") _chiudiAltro(); } catch (e) { /* noop */ }
  _spotifyTraccia("menu chiuso");
  try {
    _spotifyMenu();
  } catch (errore) {
    const che = (errore && errore.message) ? errore.message : String(errore);
    _spotifyTraccia("ERRORE: " + che);
    try {
      p.hidden = false;
      $("spotifyTitolo").textContent = "Spotify non si apre";
      $("spotifySotto").textContent = "";
      $("spotifyCorpo").innerHTML =
        '<p class="step-hint">' + _spotifySicuro(che) + "</p>";
    } catch (e) { /* noop */ }
    try { toast("Spotify non si apre: " + che, 8000); } catch (e) {}
  }
}
if (typeof window !== "undefined") {
  try { window._spotifyApri = _spotifyApri; } catch (e) {}
  /* Ste: "non funziona e non mi dice niente". Ora la guida dice se
     Spotify e' pronto o no: se qui c'e' scritto "non caricato", il file
     non e' arrivato e il problema non e' nel resto. */
  try { window._spotifyPronto = true; } catch (e) {}
}

function _spotifyAggancia() {
  const bs = $("btnSpotify");
  if (bs && !bs._collegatoSpotify) {
    bs._collegatoSpotify = true;
    bs.addEventListener("click", _spotifyApri);
  }
  const sc = $("spotifyChiudi");
  if (sc && !sc._collegatoSpotify) {
    sc._collegatoSpotify = true;
    sc.addEventListener("click", _spotifyChiudi);
  }
  const p = $("spotifyPanel");
  if (p && !p._collegatoSpotify) {
    p._collegatoSpotify = true;
    p.addEventListener("click", (e) => { if (e.target === p) _spotifyChiudi(); });
  }
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _spotifyAggancia);
  } else {
    _spotifyAggancia();
  }
}