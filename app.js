"use strict";

(function () {
  const BUILTIN = [
    { title: "BLANCO - SOTTOGONNA", file: "songs/track-1.mp3", artist: "BLANCO" },
    { title: "Madame - QUANTO FORTE TI PENSAVO", file: "songs/track-2.mp3", artist: "Madame" },
    { title: "Poter scegliere - Nayt (Live)", file: "songs/track-3.mp3", artist: "Nayt" },
    { title: "Sono Ok", file: "songs/track-4.mp3", artist: "XCarme" },
    { title: "Artie 5ive - SWAG MUSIC", file: "songs/track-5.mp3", artist: "Artie 5ive" },
    { title: "Kid Yugi x Lil Peep MASHUP", file: "songs/track-6.mp3", artist: "Kid Yugi / Lil Peep" },
    { title: "Lil Peep - Star Shopping", file: "songs/track-7.mp3", artist: "Lil Peep" },
    { title: "Malpensa", file: "songs/track-8.mp3", artist: "G.Mineiro, Flatpearl, Succo" },
    { title: "MOSTRO - LA CITTÀ", file: "songs/track-9.mp3", artist: "MOSTRO" },
    { title: "CIGNO NERO RMX (Nayt, Frah Quintale, Tony Boy)", file: "songs/track-10.mp3", artist: "Nayt / Frah Quintale / Tony Boy" },
    { title: "SAITTA - Romantici Terroni", file: "songs/track-11.mp3", artist: "SAITTA" },
    { title: "thasup - s!r!", file: "songs/track-12.mp3", artist: "thasup" },
    { title: "Tony Boy - Victoria", file: "songs/track-13.mp3", artist: "Tony Boy" },
    { title: "Un mondo a parte (Visual)", file: "songs/track-14.mp3", artist: "Jovanotti" },
    { title: "Sogni Appesi", file: "songs/track-15.mp3", artist: "Ultimo", profile: "Ste" },
    { title: "nayt - Exit", file: "songs/track-16.mp3", artist: "nayt", profile: "Ste" },
    { title: "Hai visto mai", file: "songs/track-17.mp3", artist: "Frah Quintale", profile: "Ste" },
    { title: "Il Più Grande Spettacolo Dopo Il Big Bang", file: "songs/track-18.mp3", artist: "Jovanotti", profile: "Ste" },
    { title: "Stella Cadente", file: "songs/track-19.mp3", artist: "Modà", profile: "Ste" },
    { title: "Kid Yugi x Nuts - Lil Peep", file: "songs/track-20.mp3", artist: "Ferro di checov", profile: "Ste" },
    { title: "Lastronauta (Visual)", file: "songs/track-23.mp3", artist: "nayt", profile: "Ste" },
    { title: "zero rimorsi", file: "songs/track-24.mp3", artist: "il tre", profile: "Ste" },
    { title: "Poter scegliere", file: "songs/track-25.mp3", artist: "nayt", profile: "Ste" },
    { title: "NON MI RICONOSCO", file: "songs/track-26.mp3", artist: "MACE", profile: "Ste" },
    { title: "Il Filmografo", file: "songs/track-27.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "Paganini", file: "songs/track-28.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "terr1", file: "songs/track-29.mp3", artist: "kid yugi", profile: "Ste" },
    { title: "Sintetico", file: "songs/track-30.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "ROMANTICA", file: "songs/track-31.mp3", artist: "Ultimo", profile: "Ste" },
    { title: "Eroina", file: "songs/track-32.mp3", artist: "Kid Yugi & Tutti Fenomeni", profile: "Ste" },
    { title: "Lilith", file: "songs/track-33.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "Eva", file: "songs/track-34.mp3", artist: "Kid Yugi, Tedua & Junior K", profile: "Ste" },
    { title: "l'anima", file: "songs/track-35.mp3", artist: "madame", profile: "Ste" },
    { title: "IL GIORNO CHE ASPETTAVO", file: "songs/track-36.mp3", artist: "Ultimo", profile: "Ste" },
    { title: "La Violenza Necessaria", file: "songs/track-37.mp3", artist: "Kid Yugi & Shiva", profile: "Ste" },
    { title: "Gilgamesh", file: "songs/track-38.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "Tristano e Isotta", file: "songs/track-39.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "Donna", file: "songs/track-40.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "Lucifero", file: "songs/track-41.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "the cure", file: "songs/track-42.mp3", artist: "Olivia Rodrigo", profile: "Ste" },
    { title: "solo domande", file: "songs/track-43.mp3", artist: "nayt & 3D", profile: "Ste" },
    { title: "La canzone dellamore perduto ft. Joan Thiele [Sanremo 2026]", file: "songs/track-44.mp3", artist: "nayt", profile: "Ste" },
    { title: "Porto il Commerciale", file: "songs/track-45.mp3", artist: "Kid Yugi, Night Skinny & Artie 5ive", profile: "Ste" },

    { title: "nuts", file: "songs/track-47.mp3", artist: "Lil Peep", profile: "Ste" },
    { title: "NEON", file: "songs/track-48.mp3", artist: "Sfera Ebbasta & Shiva", profile: "Ste" },
      { title: "sailor song", file: "songs/track-46.mp3", artist: "gigi perez", profile: "Ste" },
];

  const PALETTE = [
    "linear-gradient(135deg,#b06bff,#4fc3ff)",
    "linear-gradient(135deg,#ff7a9e,#ffb86b)",
    "linear-gradient(135deg,#37e6a6,#4fc3ff)",
    "linear-gradient(135deg,#ffb02e,#ff5c7a)"
  ];

  const $ = (id) => document.getElementById(id);
  const APP_NAME = "spotifynonavraiimieisoldi";
  const APP_VERSION = "6.91";

  let recovering = false;
  async function selfHeal() {
    if (recovering) return;
    let done = false;
    try { done = sessionStorage.getItem("mb-healed") === "1"; } catch (e) { done = false; }
    if (done) return;
    recovering = true;
    try { sessionStorage.setItem("mb-healed", "1"); } catch (e) { /* noop */ }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* noop */ }
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length) {
          await Promise.all(regs.map((r) => r.update().catch(() => {})));
        } else {
          await navigator.serviceWorker.register("sw.js");
        }
      }
    } catch (e) { /* noop */ }
    location.reload();
  }

  const startedAt = Date.now();
  window.addEventListener("error", () => {
    if (Date.now() - startedAt < 8000) selfHeal();
  });
  const searchEl = $("search");
  const playlistEl = $("playlist");
  const emptyEl = $("empty");
  const fileInput = $("fileInput");

  let audio = null;
  let tracks = [];
  let currentId = null;
  let shuffle = false;
  let repeat = false;
  let query = "";
  let favorites = new Set();
  let favOnly = false;
  /* Filtro "solo quelli che non ho ancora ascoltato": comodo per dare una
     prima ascolto a tutto quello che ho scaricato e non ho mai sentito. */
  let soloMaiAscoltati = false;
  let hiddenTracks = new Set();
  /* Numeri della libreria, per il registro: cosi' capisco cosa manca senza
     dover chiedere uno screenshot. */
  let _numeriGiaInviati = false;
  let _ultimiDuplicati = 0;
  let _ultimiSenzaFile = 0;
  /* Come e' ordinata la libreria. Di default per artista, cosi' i brani dello
     stesso artista stanno di fila; si ricorda la scelta per ogni dispositivo. */
  let ordinamento = "artista";
  let scrubbing = false;
  let pendingSeek = null;
  let lastSave = 0;
  let resumeAt = 0;
  let queue = [];
  let suppressClick = false;
  let swReg = null;

  /* I profili: ognuno ha la sua libreria e la sua cartella di mp3 sul PC.
     Prima erano due fissi (Ste ed Emanuele); ora l'elenco e' una lista, cosi'
     aggiungere un profilo e' una riga e basta. */
  const PROFILI = [
    { nome: "Ste", cartella: "ste" },
    { nome: "Emanuele", cartella: "emanuela" },
    { nome: "Ari", cartella: "ari" }
  ];
  const DEFAULT_PROFILE = PROFILI[0].nome;
  /* Il tasto semplice "Scarica l'mp3 col PC" adesso salva anche una copia
     nella cartella del profilo: cosi' il brano finisce nella libreria
     condivisa e si vede anche dagli altri dispositivi. Prima restava solo in
     questo browser, e per questo si vedevano numeri diversi su PC e telefono. */
  const CARTELLA_PREDEFINITA = PROFILI[0].cartella;
  let profile = DEFAULT_PROFILE;
  let profiles = [DEFAULT_PROFILE];

/* Lo stato dei profili sta in memoria finche' la pagina e' aperta.

     Prima ogni volta rileggevo localStorage e riconvertivo il JSON: a ogni
     chiamata nasceva un oggetto NUOVO. Quindi quando le statistiche
     aggiungevano un secondo, lo scrivevano su un oggetto che un attimo dopo
     spariva: i secondi non venivano mai salvati e sul telefono il numero
     restava sempre a zero. */
let _statoInMemoria = null;

function allState() {
  if (!_statoInMemoria) _statoInMemoria = LS.get("mb.state", {}) || {};
  return _statoInMemoria;
}

function saveAllState(next) {
  _statoInMemoria = next || {};
  LS.set("mb.state", _statoInMemoria);
}

function profileState(name) {
  const all = allState();
  if (!all[name] || typeof all[name] !== "object") {
    all[name] = { hidden: [], favs: [], last: null, time: 0 };
  }
  return all[name];
}

/* Quando salvo un profilo riparto sempre da quello che c'e' ADESSO sul
     disco, non da quello che avevo in memoria. Serve per quando la app e'
     aperta in due finestre: se nell'una metti un preferito e nell'altra
     un brano nascosto, prima una delle due modifiche spariva (l'ultima
     scrittura copriva l'altra). */
function writeProfileState(name, patch) {
  let fresco = {};
  try { fresco = LS.get("mb.state", {}) || {}; } catch (e) { fresco = {}; }
  /* se questo profilo non esiste ancora parto da uno vuoto pulito, non dalla
     copia in memoria: altrimenti un profilo nuovo si porterebbe dietro
     campi vecchi di un altro */
  const base = (fresco[name] && typeof fresco[name] === "object") ? fresco[name] : {};
  fresco[name] = Object.assign({}, base, patch);
  saveAllState(fresco);
}

/* Se un'altra finestra cambia qualcosa, me ne accorgo e rileggo: altrimenti
   resterei con i dati vecchi in memoria. */
window.addEventListener("storage", (e) => {
  if (e && e.key && e.key !== "mb.state") return;
  _statoInMemoria = null;
  /* puo' arrivare mentre la pagina si sta ancora montando: non deve
     interrompere niente, quindi ogni parte va protetta */
  try { loadProfileState(); } catch (x) { /* noop */ }
  try { _aggiornaBadgeFalliti(); } catch (x) { /* noop */ }
  try { render(); } catch (x) { /* noop */ }
});

  function loadProfileState() {
    const st = profileState(profile);
    hiddenTracks = new Set(st.hidden || []);
    favorites = new Set(st.favs || []);
    return st;
  }

  function saveCurrentState() {
    writeProfileState(profile, { hidden: Array.from(hiddenTracks), favs: Array.from(favorites) });
  }

  const LS = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* noop */ }
    },
    remove(k) {
      try { localStorage.removeItem(k); } catch (e) { /* noop */ }
    }
  };

  let lyricsData = {};
  let coversData = {};
  let localLyrics = {};
  let lyricLines = [];
  let lyricActive = -1;
  let lyricsUserScrollAt = 0;

  let db = null;
  const DB_NAME = "musicbox";
  const DB_STORE = "tracks";
  const DB_IMPORTS = "imports";
  const DB_LYRICS = "lyrics";
  /* Le copertine che trovo dal browser le tengo qui, per brano.
     Serve per i brani della libreria condivisa: quelle copertine le puo'
     correggere solo il computer che le ha scaricate (covers.json), quindi
     se manca una copertina la cerco io e me la segno qui sul dispositivo. */
  const DB_COVERS = "copertine";
  const DB_VERSION = 4;

  /* ---------- IndexedDB ---------- */
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DB_STORE)) {
          req.result.createObjectStore(DB_STORE, { keyPath: "id" });
        }
        if (!req.result.objectStoreNames.contains(DB_IMPORTS)) {
          req.result.createObjectStore(DB_IMPORTS, { keyPath: "id" });
        }
    if (!req.result.objectStoreNames.contains(DB_LYRICS)) {
      req.result.createObjectStore(DB_LYRICS, { keyPath: "id" });
    }
    if (!req.result.objectStoreNames.contains(DB_COVERS)) {
      req.result.createObjectStore(DB_COVERS, { keyPath: "id" });
    }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbPut(rec) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(rec);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbGet(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function dbDel(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function dbSetImport(rec) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_IMPORTS, "readwrite");
      tx.objectStore(DB_IMPORTS).put(rec);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbDelImport(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_IMPORTS, "readwrite");
      tx.objectStore(DB_IMPORTS).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbAllLyrics() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_LYRICS, "readonly");
      const req = tx.objectStore(DB_LYRICS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function dbPutLyrics(rec) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_LYRICS, "readwrite");
    tx.objectStore(DB_LYRICS).put(rec);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  }

  /* Copertine trovate dal browser, per brano della libreria condivisa. */
  function dbAllCover() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_COVERS, "readonly");
    const req = tx.objectStore(DB_COVERS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  }

  function dbPutCover(rec) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_COVERS, "readwrite");
    tx.objectStore(DB_COVERS).put(rec);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  }

  /* ---------- Caricamento tracce ---------- */
  /* ---------- Rinominare un brano tenendo premesso ----------
     Il nome nuovo lo tengo da parte per dispositivo, senza toccare la
     libreria sul PC: e' il modo meno invasivo e funziona anche per i brani
     che vengono dal sito (che non posso modificare li'). */
  let editId = null;

  function nomiRinomati() {
    try {
      return LS.get("mb.rinomini", {}) || {};
    } catch (e) {
      return {};
    }
  }

  function applicaRinomina(t) {
    const mappa = nomiRinomati();
    const r = mappa[t.id];
    if (!r) return t;
    if (r.title) t.title = r.title;
    if (r.artist) t.artist = r.artist;
    return t;
  }

/* Il nome vero di un brano della libreria condivisa. L'id del brano e'
     "b-" + nome del file, quindi lo riprendo da li'. Serve quando si toglie
     una rinomina: senza questo il nome restava quello cambiato fino a
     ricaricare la pagina. */
function _originaleDi(id) {
  try {
    if (typeof id !== "string" || id.indexOf("b-") !== 0) return null;
    const file = id.slice(2) + ".mp3";
    for (const b of BUILTIN) {
      if (String(b.file || "").replace(/^.*\//, "") === file) return b;
    }
  } catch (e) { /* noop */ }
  return null;
  }

  function applicaRinomine() {
  const mappa = nomiRinomati();
  for (const t of tracks) {
    const r = mappa[t.id];
    if (r && (r.title || r.artist)) {
      if (r.title) t.title = r.title;
      if (r.artist) t.artist = r.artist;
      continue;
    }
    /* nessuna rinomina attiva: torna al nome vero */
    const orig = _originaleDi(t.id);
    if (orig) {
      t.title = orig.title || t.title;
      t.artist = orig.artist || t.artist || "";
    }
  }
  }

  function apriRinomina(id) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    editId = id;
    $("editTitle").value = t.title || "";
    $("editArtist").value = t.artist || "";
    const mappa = nomiRinomati();
    $("editAvviso").textContent = mappa[id]
      ? "Questo brano ha gia' un nome cambiato su questo dispositivo."
      : "Il cambio vale solo su questo telefono o computer.";
    $("editPanel").hidden = false;
    syncNoScroll();
    try { $("editTitle").focus(); } catch (e) { /* noop */ }
  }

  function chiudiRinomina(salva) {
    const id = editId;
    editId = null;
    $("editPanel").hidden = true;
    syncNoScroll();
    if (!salva || !id) return;
    const mappa = nomiRinomati();
    const t = tracks.find((x) => x.id === id);
    const titoloNuovo = String($("editTitle").value || "").trim();
    const artistaNuovo = String($("editArtist").value || "").trim();
    /* Prima di cambiare il nome, sposto via le statistiche: la chiave di un
       brano e' fatta con artista e titolo, quindi se cambio il nome senza
       spostarle il brano riparte da zero (perde "quante volte l'ho
       ascoltato" e i secondi).
       Uso i nomi come saranno DAVVERO dopo il cambio: se lascio vuoto un
       campo, il brano continua ad avere il vecchio valore, e la chiave
       deve tenerne conto. */
if (t) {
        /* se sto TOLGENDO la rinomina, tutto torna al nome vero del brano */
        const tolgo = !titoloNuovo && !artistaNuovo;
        const orig = tolgo ? _originaleDi(id) : null;
        const titoloEffettivo = titoloNuovo || (orig && orig.title) || t.title;
        const artistaEffettivo = artistaNuovo || (orig && orig.artist) || t.artist || "";
        _spostaStatistiche(t.title, t.artist, titoloEffettivo, artistaEffettivo);
      }
    mappa[id] = { title: titoloNuovo, artist: artistaNuovo };
    if (!mappa[id].title && !mappa[id].artist) delete mappa[id];
    try { LS.set("mb.rinomini", mappa); } catch (e) { /* noop */ }
    applicaRinomine();
    render();
    toast("Nome cambiato");
  }

  /* Sposta la scheda di ascolto da un nome all'altro quando cambio il nome
     di un brano. Se il brano torna col nome vero, il percorso e' inverso. */
  function _spostaStatistiche(titoloDa, artistaDa, titoloA, artistaA) {
    try {
      const da = _chiaveBrano({ title: titoloDa, artist: artistaDa });
      const a = _chiaveBrano({ title: titoloA, artist: artistaA });
      if (!da || !a || da === a) return;
      const st = statisticheProfilo();
      const vecchia = st[da];
      if (!vecchia) return;
      const nuova = st[a] || { v: 0, s: 0 };
      nuova.v = (nuova.v || 0) + (vecchia.v || 0);
      nuova.s = (nuova.s || 0) + (vecchia.s || 0);
      if (!nuova.t) { nuova.t = vecchia.t || ""; nuova.a = vecchia.a || ""; }
      st[a] = nuova;
      delete st[da];
      _salvaStatistiche();
    } catch (e) { /* noop */ }
  }

  $("editSave").addEventListener("click", () => chiudiRinomina(true));
  $("editCancel").addEventListener("click", () => chiudiRinomina(false));
  $("editReset").addEventListener("click", () => {
    const id = editId;
    if (!id) return;
    const mappa = nomiRinomati();
    delete mappa[id];
    try { LS.set("mb.rinomini", mappa); } catch (e) { /* noop */ }
    editId = null;
    $("editPanel").hidden = true;
    syncNoScroll();
    applicaRinomine();
    render();
    toast("Rimesso il nome originale");
  });
  $("editPanel").addEventListener("click", (e) => {
    if (e.target === $("editPanel")) chiudiRinomina(false);
  });

/* Tieni premesso (telefono e computer) e si apre la modifica del nome.
     Quando hai aperto la modifica, il tocco successivo NON deve suonare il
     brano: prima succedeva il contrario, e finivi per ascoltare la canzone
     mentre cercavi di rinominarla. */
  function collegaPressioneLunga(el, id) {
    let timer = null;
    let giaPartito = false;
    let apertoIl = 0;
    const apri = () => {
      giaPartito = true;
      apertoIl = Date.now();
      apriRinomina(id);
    };
    const via = (v) => { timer = setTimeout(apri, 600); };
    const pulisci = () => { if (timer) clearTimeout(timer); timer = null; };
    el.addEventListener("touchstart", () => via(), { passive: true });
    el.addEventListener("touchend", () => setTimeout(pulisci, 60), { passive: true });
    el.addEventListener("touchcancel", pulisci, { passive: true });
    /* Se il dito si muove, e' uno scorrimento: NON deve aprire la modifica
       e NON deve essere bloccato, altrimenti non riesci piu' a scorrere
       la lista passando il dito sulle canzoni. */
    el.addEventListener("touchmove", pulisci, { passive: true });
    el.addEventListener("mousedown", (e) => { via(); if (e.button === 2) pulisci(); });
    el.addEventListener("mouseup", pulisci);
    el.addEventListener("mouseleave", pulisci);
    /* il tasto destro apre la modifica: e' gia' aperta, quindi segnalo
       anche questo, cosi' il clic dopo non suona niente */
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      apri();
    });
    /* qualunque clic nei pressi dell'apertura viene ignorato */
    el.addEventListener("click", (e) => {
      if (giaPartito || (apertoIl && Date.now() - apertoIl < 1200)) {
        giaPartito = false;
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  /* Se il profilo aperto non ha brani ma un altro profilo ne ha, te lo dico:
     succede perche' le librerie sono diverse e si sembra sparito tutto. */
  function avvisaProfiloVuoto() {
    const avviso = $("avvisoProfilo");
    if (!avviso) return;
    if (tracks.length) {
      avviso.hidden = true;
      return;
    }
    const miei = BUILTIN.filter((b) => (b.profile || DEFAULT_PROFILE) === profile).length;
    if (miei > 0) {
      avviso.hidden = true;
      return;
    }
    const altro = PROFILI.map((p) => p.nome).find((n) => n !== profile &&
      BUILTIN.filter((b) => (b.profile || DEFAULT_PROFILE) === n).length > 0);
    if (!altro) {
      avviso.hidden = true;
      return;
    }
    const quanti = BUILTIN.filter((b) => (b.profile || DEFAULT_PROFILE) === altro).length;
    avviso.innerHTML = "";
    const p = document.createElement("div");
    p.textContent = "Nel profilo " + profile + " non ci sono brani. In " + altro + " ce ne sono " + quanti + ".";
    const b = document.createElement("button");
    b.textContent = "Vai al profilo " + altro;
    b.addEventListener("click", () => {
      avviso.hidden = true;
      switchProfile(altro);
    });
    avviso.appendChild(p);
    avviso.appendChild(b);
    avviso.hidden = false;
  }

  /* ---------- Statistiche di ascolto ----------
   Conta quante volte e quanto tempo ho ascoltato ogni brano. I dati sono
   per profilo: le statistiche di Emanuele stanno separate da quelle di Ste,
   anche se la libreria e' la stessa. */
  function statisticheProfilo(nome) {
    const st = profileState(nome || profile);
    if (!st.stats || typeof st.stats !== "object") st.stats = {};
    return st.stats;
  }

  function _chiaveStats(t) {
    return _chiaveBrano(t);
  }

  let _statsUltimoTempo = 0;
  let _statsCronometro = null;
  let _statsUltimoSalvataggio = 0;
  let _tick = 0;

  function _segnaAscolto(t, secondi, nuovo) {
    try {
      if (!t) return;
      const chiave = _chiaveStats(t);
      if (!chiave) return;
      const st = statisticheProfilo();
      const r = st[chiave] || { v: 0, s: 0 };
if (nuovo) r.v = (r.v || 0) + 1;
        /* NON arrotondo qui: i pezzi arrivano piccoli (sul telefono 0,25
           secondi alla volta) e arrotondandoli uno per uno diventerebbero
           tutti zero, e i secondi andrebbero persi. Sommo i pezzi esatti e
           arrotondo solo quando li mostro. */
        r.s = (r.s || 0) + Math.max(0, Number(secondi) || 0);
      r.t = t.title || "";
      r.a = t.artist || "";
      st[chiave] = r;
      const ora = Date.now();
      if (ora - _statsUltimoSalvataggio > 15000) {
        _statsUltimoSalvataggio = ora;
        writeProfileState(profile, { stats: st });
      }
    } catch (e) { /* le statistiche non devono mai fermare l'uso */ }
  }

  function _salvaStatistiche() {
    try { writeProfileState(profile, { stats: statisticheProfilo() }); } catch (e) { /* noop */ }
  }

  /* Segue l'ascolto reale e NON conta quello che salti.
     Guardo ogni secondo quanto e' andato avanti il brano:
     - se avanza di poco (1 secondo), e' ascolto vero e lo sommo
     - se avanza tanto (perche' hai premuto avanti), NON lo sommo: la canzone
       l'hai saltata, non ascoltata.
     Prima guardavo ogni 5 secondi e accettavo solo fino a 3 secondi di
     salto: con quei numeri non contava praticamente niente. */
  /* Registro di controllo: ogni 15 secondi scrivo nel registro del PC com'e'
     il conteggio. Serve per capire PERCHE' i secondi non salgono guardando
     il suo telefono, invece di indovinare: quanta musica sta suonando, se il
     cronometro e' partito, e quanto ha contato finora. */
  function _segnalaControllo(secondiContati) {
    try {
      const t = current();
      segnalaErrore("controllo ascolto: brano=" + (t ? (t.artist || "?") + " / " + (t.title || "?") : "nessuno") +
        " | suona=" + (audio ? (audio.paused ? "no" : "si") : "nessun player") +
        " | cronometro=" + (_statsConto ? Math.round((Date.now() - _statsTic) / 1000) + "s" : "fermo") +
        " | contati ora=" + Math.round(secondiContati) + "s");
    } catch (e) { /* noop */ }
  }

  /* Conto il tempo in cui la musica STA SUONANDO, anche se esci dall'app o
   blocchi il telefono: se la canzone continua, la stai sentendo.
   Conto a "tratti": ogni volta che guardo, aggiungo il tempo passato e riparto
   da zero. Serve perche' quando la scheda non e' visibile il browser rallenta
   i controlli (una volta al minuto, o meno): aggiungendo il tempo passato
   quei secondi non si perdono. Ogni somma e' limitata a 90 secondi, cosi' se
   il telefono si e' addormentato di colpo non ti aggiunge minuti fantasma.
   Saltando i brani non si conta nulla: si conta il tempo che ci metti a
   premere "avanti", cioe' quasi niente. */
  /* CONTO QUELLO CHE LA MUSICA HA DAVVERO SUONATO.

     Prima contavo con l'orologio: passavano 2 secondi e aggiungevo 2 secondi.
     Ma sul telefono l'orologio e gli avvisi vanno a modo loro, e quei 2
     secondi arrivavano a blocchi: il numero cresceva a scatti e sembrava
     rotto.

     Adesso guardo la posizione DENTRO la canzone. Se la canzone e' al secondo
     10 e un secondo dopo e' al secondo 11, ho ascoltato esattamente 1 secondo.
     Non importa che ore siano, non importa con che' frequenza arrivano gli
     avvisi, non importa se l'app e' in primo piano: se la musica avanza, io
     conto quello che e'advance. E' il dato vero, non una stima. */
  let _statsPosVisto = 0;   /* posizione della canzone all'ultimo controllo */
  let _statsTic = 0;        /* orologio all'ultimo controllo */
  let _statsConto = false;  /* il conto e' partito? */
  const _STATI_MAX = 600;   /* saltino assurdo: non si conta */

  function _posizioneMusica() {
    try {
      const ct = audio && typeof audio.currentTime === "number" ? audio.currentTime : 0;
      return (isFinite(ct) && ct > 0) ? ct : 0;
    } catch (e) { return 0; }
  }

  function _staSuonandoOra() {
    try { return !!(audio && !audio.paused && !audio.ended); } catch (e) { return false; }
  }

  function _iniziaAscolto() {
    /* Segno da dove si parte quando parte la musica: cosi' anche il primo
       pezzetto viene contato e non si perde l'inizio della canzone. */
    _statsConto = true;
    _statsPosVisto = _posizioneMusica();
    _statsTic = Date.now();
  }

  function _chiudiAscolto(riparte) {
    if (!riparte) { _statsConto = false; _statsPosVisto = 0; _statsTic = 0; }
  }

  function _seguiAscolto(audio) {
    try {
      if (!_staSuonandoOra()) { _chiudiAscolto(false); return; }
      const adesso = Date.now();
      const pos = _posizioneMusica();
      if (pos <= 0) {
        /* ripiego per flussi dove la posizione non si legge */
        if (!_statsConto) { _statsConto = true; _statsTic = adesso; return; }
        const passati = (adesso - _statsTic) / 1000;
        if (passati >= 2) {
          _statsTic = adesso;
          _segnaAscolto(current(), passati > _STATI_MAX ? _STATI_MAX : passati, false);
        }
        return;
      }
      if (!_statsConto) _iniziaAscolto();
      const passati = (adesso - _statsTic) / 1000;
      const avanti = pos - _statsPosVisto;
      _statsPosVisto = pos;
      _statsTic = adesso;
      if (avanti < 0) return;   /* canzone cambiata o riavvolta: riparto pulito */
      /* Contiamo il PIU' PICCOLO fra il tempo passato e quanto la canzone ha
         davvero fatto avanti.
         - se il telefono si blocca, la canzone resta ferma e non conto troppo;
         - se gli avvisi arrivano radi, non perdo niente perche' la canzone
           dice esattamente quanto e' andata avanti. */
      let quanto = avanti;
      if (passati >= 0 && passati < quanto) quanto = passati;
      if (quanto <= 0) return;
      _segnaAscolto(current(), quanto > _STATI_MAX ? _STATI_MAX : quanto, false);
    } catch (e) { /* noop */ }
  }

  /* Fa partire il cronometro delle statistiche. */
  /* ---------- La finestra delle statistiche ----------
     Mostra i numeri del profilo aperto e, sotto, un confronto con gli
     altri due profili: cosi' vedi subito com'e' messa la libreria di tutti. */
  function _artistiDi(lista) {
    const set = new Set();
    for (const t of lista) {
      const k = gruppoArtista(t);
      if (k && k !== "zzz") set.add(k);
    }
    return set.size;
  }

  function _tempoTesto(secondi) {
    const s = Math.max(0, Math.round(secondi || 0));
    if (s < 60) return s + (s === 1 ? " secondo" : " secondi");
    const ore = Math.floor(s / 3600);
    const min = Math.floor((s % 3600) / 60);
    if (!ore) return min + (min === 1 ? " minuto" : " minuti");
    return ore + (ore === 1 ? " ora" : " ore") + (min ? " e " + min + (min === 1 ? " minuto" : " minuti") : "");
  }

  function _numeriProfilo(nome) {
    const lista = tracks.filter((t) => (t.profile || DEFAULT_PROFILE) === nome && !hiddenTracks.has(t.id));
    const st = profileState(nome);
    const stats = (st && st.stats) || {};
    let volte = 0, secondi = 0;
    const perArtista = new Map();
    const perBrano = [];
    for (const k in stats) {
      const r = stats[k] || {};
      volte += r.v || 0;
      secondi += r.s || 0;
      const nomeArtista = (r.a || "").trim() || "senza artista";
      perArtista.set(nomeArtista, (perArtista.get(nomeArtista) || 0) + (r.v || 0));
      if ((r.s || 0) > 0) perBrano.push({ titolo: r.t || "", artista: r.a || "", s: r.s || 0 });
    }
    const topArtisti = [...perArtista.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topBrani = perBrano.sort((a, b) => b.s - a.s).slice(0, 5);
    return {
      nome: nome,
      brani: lista.length,
      artisti: _artistiDi(lista),
      tuoi: lista.filter((t) => !t.builtin && !t.preview && !eGiaCondiviso(t)).length,
      volte: volte,
      secondi: secondi,
      topArtisti: topArtisti,
      topBrani: topBrani
    };
  }

  function _rigaStat(numero, testo, nota) {
    return '<div class="stat-riga"><b>' + numero + "</b><span>" + testo +
      (nota ? ' <i>' + nota + "</i>" : "") + "</span></div>";
  }

  function apriStatistiche() {
    const pannello = $("statsPanel");
    if (!pannello) return;
    _ricostruisciStatistiche();
    pannello.hidden = false;
    syncNoScroll();
  }

  /* Costruisce i numeri dentro la finestra. Si richiama anche ogni 2 secondi
     mentre la finestra e' aperta, cosi' il tempo ascoltato cresce davanti
     agli occhi invece di restare fermo. */
  function _ricostruisciStatistiche() {
    const pannello = $("statsPanel");
    if (!pannello) return;
    const n = _numeriProfilo(profile);
    $("statsSub").textContent = "Profilo " + profile;
    let html = "";
    html += '<div class="stat-griglia">';
    html += _rigaStat(n.brani, n.brani === 1 ? "brano" : "brani");
    html += _rigaStat(n.artisti, n.artisti === 1 ? "artista" : "artisti");
    html += _rigaStat(_tempoTesto(n.secondi), "di musica ascoltata");
    html += _rigaStat(n.volte, n.volte === 1 ? "ascolto" : "ascolti");
    if (n.tuoi) html += _rigaStat(n.tuoi, "brani aggiunti da te");
    html += "</div>";

    if (n.topArtisti.length) {
      html += "<h4>Artisti più ascoltati</h4><div class=\"stat-lista\">";
      for (const [a, v] of n.topArtisti) {
        html += '<div class="stat-item"><span>' + a + "</span><b>" + v + "</b></div>";
      }
      html += "</div>";
    } else {
      html += '<p class="step-hint">Non hai ancora ascoltato niente con questo profilo: ascolta una canzone e i numeri si riempiono da soli.</p>';
    }
    if (n.topBrani.length) {
      html += "<h4>Brani più ascoltati</h4><div class=\"stat-lista\">";
      for (const b of n.topBrani) {
        html += '<div class="stat-item"><span>' + (b.artista ? b.artista + " — " : "") + b.titolo +
          "</span><b>" + _tempoTesto(b.s) + "</b></div>";
      }
      html += "</div>";
    }

    /* Gli altri profili: utile per capire se la libreria e' quella giusta */
    html += "<h4>Come sono gli altri profili</h4><div class=\"stat-lista\">";
    for (const pr of PROFILI) {
      const m = _numeriProfilo(pr.nome);
      const chi = pr.nome === profile ? " (sei tu)" : "";
      html += '<div class="stat-item' + (pr.nome === profile ? " io" : "") + '"><span>' + pr.nome + chi +
        "</span><b>" + m.brani + " brani · " + m.volte + " ascolti</b></div>";
    }
    html += "</div>";
    html += '<p class="step-hint">Gli ascolti si contano sul dispositivo dove stai ascoltando: se ascolti sul telefono, il computer non lo sa.</p>';

    /* Diagnostica visibile: sul telefono non posso leggere cosa succede
       (il browser vieta al sito di scrivere sul computer), quindi qui dentro
       mostriamo quello che la pagina crede di sapere. Se i secondi non
       salgono, qui si vede perche'. */
    html += "<h4>Come sta andando l'ascolto</h4>";
    const suonaOra = !!(audio && !audio.paused && !audio.ended);
    const brano = current();
    const chiave = brano ? _chiaveStats(brano) : "";
    const salvati = chiave ? ((statisticheProfilo()[chiave] || {}).s || 0) : 0;
    html += '<div class="stat-lista">';
    html += '<div class="stat-item"><span>Música sta suonando</span><b>' + (suonaOra ? "sì" : "no") + "</b></div>";
    html += '<div class="stat-item"><span>Dove e\' la canzone</span><b>' + _posizioneMusica().toFixed(1) + "s</b></div>";
    html += '<div class="stat-item"><span>Secondi di questo brano</span><b>' + Math.round(salvati) + "s</b></div>";
    html += '<div class="stat-item"><span>Timer di riserva</span><b>' + (_statsCronometro ? "attivo" : "non parte") + "</b></div>";
    html += '<div class="stat-item"><span>Versione della pagina</span><b>' + APP_VERSION + "</b></div>";
    html += "</div>";

    $("statsCorpo").innerHTML = html;
    pannello.hidden = false;
    syncNoScroll();
  }

  function chiudiStatistiche() {
    const pannello = $("statsPanel");
    if (!pannello) return;
    pannello.hidden = true;
    syncNoScroll();
  }

  /* Conta anche quando la musica si muove. Prima contavo solo con un timer
     che parte all'avvio della pagina: se qualcosa in avvio va storto (e sul
     telefono capita) il timer non parte e i secondi non salgono mai.
     L'evento timeupdate scatta invece ogni volta che la musica avanza,
     quindi funziona su ogni dispositivo. */
  function _contaAlMuoversi() {
    try {
      _seguiAscolto(audio);
      /* Se la finestra delle statistiche e' aperta la aggiorno QUI, non solo
         col timer: sul telefono il timer va piano e i secondi sembravano
         saltare a blocchi di 2 secondi invece di crescere davanti agli occhi. */
      const pannello = $("statsPanel");
      if (pannello && !pannello.hidden) {
        _tick++;
        if (_tick % 8 === 0) {
          try { _ricostruisciStatistiche(); } catch (e) { /* noop */ }
        }
      }
    } catch (e) { /* noop */ }
  }

  function _avviaStatistiche() {
    try {
      if (_statsCronometro) return;
/* Ogni secondo: abbastanza per capire se stai ascoltando o saltando,
  e abbastanza leggero da non accorgertene.
  Se la finestra delle statistiche e' aperta, la aggiorno ogni 2
  secondi: senza questo i numeri restavano fermi a com'erano quando
  l'hai aperta e sembrava che il tempo non si contasse. */
  _statsCronometro = setInterval(() => {
    _seguiAscolto(audio);
    _salvaStatistiche();
    _tick++;
    const pannello = $("statsPanel");
    if (pannello && !pannello.hidden && _tick % 2 === 0) {
      try { _ricostruisciStatistiche(); } catch (e) { /* noop */ }
    }
    /* ogni 15 secondi scrivo come sta andando, cosi' lo leggo dal registro
       e non devo chiedere uno screenshot */
    if (_tick % 15 === 0) {
      let contati = 0;
      try {
        const st = statisticheProfilo();
        const t = current();
        const k = t ? _chiaveStats(t) : "";
        contati = (k && st[k] && st[k].s) || 0;
      } catch (e) { /* noop */ }
      _segnalaControllo(contati);
    }
  }, 1000);
    } catch (e) { /* noop */ }
    window.addEventListener("pagehide", () => { _chiudiAscolto(false); });
    /* Esci dall'app o blocchi il telefono? Se la musica continua a suonare la
       stai sentendo, quindi il tempo si conta lo stesso. Se invece si ferma,
       il conto si chiude e basta. */
    document.addEventListener("visibilitychange", () => {
      _chiudiAscolto(false);
    });
  }

  function _contaAscoltoNuovo(t) {
    _segnaAscolto(t, 0, true);
  }

  async function loadAll() {
  /* Copertine che ho cercato io dal browser per questi brani (vedi
     "Scarica tutte le copertine mancanti"): valgono solo su questo
     dispositivo, ma cosi' un brano senza copertina la vede comunque. */
  let copertineMie = {};
  try {
    const salvate = await dbAllCover();
    for (const c of salvate) {
      if (c && c.id && c.cover) copertineMie[c.id] = c;
    }
  } catch (e) { /* noop */ }

const builtin = BUILTIN
      .filter((b) => (b.profile || DEFAULT_PROFILE) === profile)
      .map((b, i) => {
      /* Il nome di parecchi file era "ARTISTA - ARTISTA - TITOLO" (per
         esempio "BLANCO - BLANCO - SOTTOGONNA"): in libreria si vedeva
         l'artista due volte. Tolgo il nome dell'artista dal titolo quando
         è ripetuto. La funzione esisteva gia', ma serviva solo per cercare
         le copertine: qui serve anche per quello che si legge. */
      const titoloPulito = stripArtistPrefix(b.artist, b.title);
      if (titoloPulito && titoloPulito !== b.title) {
      _spostaStatistiche(b.title, b.artist || "", titoloPulito, b.artist || "");
      }
      const info = coverInfo(b.artist, b.title);
      const stabile = "b-" + String(b.file || ("builtin-" + BUILTIN.indexOf(b))).replace(/^.*\//, "").replace(/\.mp3$/i, "");
      const mia = copertineMie[stabile];
      return {
        id: stabile,
        title: titoloPulito || b.title,
        artist: b.artist || "",
        album: (info && info.album ? info.album : "") || (mia && mia.album ? mia.album : ""),
        cover: (info && info.cover ? info.cover : "") || (mia ? mia.cover : ""),
        url: b.file,
        builtin: true,
        gradient: PALETTE[i % PALETTE.length],
        size: null
      };
    });

  let added = [];
  let doppioni = 0;
  try {
    const records = (await dbAll()).filter((r) => r && r.id && r.blob);
    added = records
  .filter((r) => (r.profile || DEFAULT_PROFILE) === profile)
  /* Se il brano esiste gia' nella libreria condivisa non lo mostro due volte:
       la copia nel browser serve per non riscaricarlo, ma elencarla
       creava due righe identiche e i contatti non tornavano piu' con gli
       altri dispositivi. Il brano condiviso fa da riga unica. */
  .filter((r) => {
    if (eGiaCondiviso({ title: r.title, artist: r.artist })) {
      doppioni++;
      /* Non mostro la riga, ma segno il brano come "gia' in lista" cosi'
         handleError puo' usare questa copia se il file online non parte. */
      _copieLocali.set(_chiaveBrano({ artist: r.artist, title: r.title }), r);
      return false;
    }
    return true;
  })
  .map((r) => ({
  id: r.id,
  title: r.title,
  artist: r.artist || "",
  album: r.album || "",
  /* Se nel file delle copertine c'e' una copertina giusta per questo brano,
     la preferisco a quella salvata nel database: quella risale al giorno in
     cui l'hai importato e conteneva anche copertine sbagliate. E se questo
     brano e' nella lista di quelli non affidabili, non uso quella salvata. */
  cover: (function (rr) {
    if (copertinaNonAffidabile(rr.artist, rr.title)) return null;
    const giusta = coverInfo(rr.artist, rr.title);
    return (giusta && giusta.cover) || rr.cover || null;
  })(r),
  source: r.source || "file",
  url: URL.createObjectURL(r.blob),
  builtin: false,
  gradient: PALETTE[(builtin.length + Math.abs(hashId(r.id))) % PALETTE.length],
  size: r.size
  }));
  } catch (e) {
    console.warn("IndexedDB non disponibile", e);
  }
  if (doppioni) {
    _ultimiDuplicati = doppioni;
    /* Lo segno come condivisi cosi' non li cerco piu' da condividere e
       non li ricontrollo a ogni avvio. */
    try {
      const tutti = await dbAll();
      for (const r of tutti || []) {
        if (r && !r.condiviso && eGiaCondiviso({ title: r.title, artist: r.artist })) {
          r.condiviso = true;
          try { await dbPut(r); } catch (e2) { /* pazienza */ }
        }
      }
    } catch (e3) { /* noop */ }
    segnalaErrore("libreria: nascosti " + doppioni + " doppioni (brani gia' condivisi)");
  }


    tracks = builtin.concat(added);
    /* I nomi che hai cambiato vanno messi DOPO che la lista e' stata
       ricostruita: prima li applicavo alla lista vecchia, che qui dentro
       veniva buttata via, e al riavvio il brano tornava col nome
       originale. */
    applicaRinomine();
    /* un brano che avevo segnato come "non scaricato" e' comparso in
       libreria: non lo riprovo piu' e lo tolgo dalla lista */
    try { _pulisciFallitiRisolti(); } catch (e) { /* noop */ }
    try { _aggiornaBadgeFalliti(); } catch (e) { /* noop */ }
    render();
  }

  async function loadLyrics() {
    try {
      const res = await fetch("lyrics.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      lyricsData = await res.json();
    } catch (e) {
      console.warn("Testi non disponibili", e);
      lyricsData = {};
    }
  }

  /* Passa all'avvio su tutti i brani: chi non ha la copertina cerca di
     recuperarla da solo, e lascia traccia di quelli che restano scoperti
     (serve a me per capire quando manca qualcosa in covers.json). */
  /* ---------- "Scarica tutte le copertine mancanti" ----------
     Prima si recuperava una copertina alla volta, solo quando aprivi un brano:
     se ne mancavano 15 non te ne accorgevi e non le cercava mai.
     Adesso c'e' un bottone: cerca tutte quelle che mancano, una alla volta
     (per non fare troppe richieste in fila), e alla fine dice quante ne ha
     sistemate e quante non le ha trovate. */
  let _copertineInCorso = false;
  let _copertineAnnullate = false;

  function _elencoSenzaCopertina() {
    return tracks.filter((t) => !t || !t.cover || !String(t.cover).trim());
  }

  function _salvaCopertinaMia(t, blob, album) {
    try {
      const ora = tracks.find((x) => x.id === t.id);
      if (!ora) return;
      ora.cover = blob;
      if (album && !ora.album) ora.album = album;
      /* se il brano e' quello che sta suonando, la schermata di blocco
         del telefono deve aggiornarsi subito invece di aspettare il brano dopo */
      const oraInRiposo = current();
      if (oraInRiposo && oraInRiposo.id === t.id) updateMediaSession();
    } catch (e) { /* noop */ }
  }

  function _stampaCopertine(stato, testo, dettaglio) {
    const pannello = $("coverPanel");
    const corpo = $("coverCorpo");
    if (!pannello || !corpo) return;
    if ($("coverSub")) {
      $("coverSub").textContent = testo || "";
    }
    let html = "";
    if (stato === "lavoro") {
      html = '<div class="stat-lista"><div class="stat-item"><span>Copertine mancanti</span><b>' +
        (dettaglio && dettaglio.totale !== undefined ? dettaglio.totale : 0) + "</b></div>" +
        '<div class="stat-item"><span>Fatto</span><b>' + (dettaglio ? dettaglio.fatte : 0) + "</b></div>" +
        '<div class="stat-item"><span>Adesso sta cercando</span><b>' +
        (dettaglio && dettaglio.ora ? dettaglio.ora : "-") + "</b></div></div>";
    } else if (stato === "fine") {
      const d = dettaglio || { sistemate: 0, nonTrovate: 0, nomi: [] };
      html = '<div class="stat-lista">';
      html += '<div class="stat-item"><span>Sistemate</span><b>' + d.sistemate + "</b></div>";
      html += '<div class="stat-item"><span>Non trovate</span><b>' + d.nonTrovate + "</b></div>";
      html += "</div>";
      if (d.nomi && d.nomi.length) {
        html += '<h4>Non sono state trovate</h4><div class="stat-lista">';
        for (const n of d.nomi) html += '<div class="stat-item"><span>' + String(n).replace(/[<>]/g, "") + "</span><b>senza</b></div>";
        html += "</div>";
      }
    } else if (stato === "vuoto") {
      html = '<div class="stat-lista"><div class="stat-item"><span>Copertine mancanti</span><b>0</b></div></div>' +
        '<p class="nota" style="margin:8px 2px 0">Tutte le copertine ci sono gia.</p>';
    }
    corpo.innerHTML = html;
    pannello.hidden = false;
    syncNoScroll();
  }

  function _chiudiPannelloCopertine() {
    _copertineAnnullate = true;
    const pannello = $("coverPanel");
    if (pannello) pannello.hidden = true;
    syncNoScroll();
  }

  async function cercaTutteLeCopertine() {
    if (_copertineInCorso) return;
    const daCercare = _elencoSenzaCopertina();
    _copertineInCorso = true;
    _copertineAnnullate = false;
    try {
      if (!daCercare.length) {
        _stampaCopertine("vuoto", "Non manca nessuna copertina");
        return;
      }
      _stampaCopertine("lavoro", "Sto cercando " + daCercare.length + " copertine, non chiudere la pagina",
        { totale: daCercare.length, fatte: 0, ora: "" });
      let sistemate = 0;
      const nomi = [];
      for (let i = 0; i < daCercare.length; i++) {
        if (_copertineAnnullate) break;
        const t = daCercare[i];
        const nome = (t.artist || "?") + " - " + t.title;
        _stampaCopertine("lavoro", "Cerco " + (i + 1) + " di " + daCercare.length + "  (" + nome + ")",
          { totale: daCercare.length, fatte: sistemate, ora: nome });
        let presa = false;
        try {
          const c = await findCoverLocal(t.artist, t.title);
          if (c && c.cover) {
            const ir = await fetch(c.cover);
            if (ir.ok) {
              const blob = await ir.blob();
              _salvaCopertinaMia(t, blob, c.album);
              try { await dbPutCover({ id: t.id, cover: blob, album: c.album || "", title: t.title, artist: t.artist || "" }); } catch (e) { /* noop */ }
              presa = true;
            }
          }
        } catch (e) { /* noop */ }
        if (presa) sistemate++;
        else nomi.push(nome);
        /* ogni volta una pausa, cosi' iTunes (e i nostri programmi) non
           vengono martellati e la pagina resta reattiva */
        await new Promise((r) => setTimeout(r, 700));
      }
      render();
      _stampaCopertine("fine", "Fatto: " + sistemate + " sistemate, " + nomi.length + " non trovate",
        { sistemate: sistemate, nonTrovate: nomi.length, nomi: nomi.slice(0, 20) });
    } finally {
      _copertineInCorso = false;
    }
  }

  function recuperaCopertineMancanti() {
    const senza = tracks.filter((t) => !t.cover);
    if (!senza.length) return;
    for (const t of senza) {
      if (!t.builtin) {
        // ritrovo la copertina e ridisegno quando arriva, altrimenti
        // l'immagine resta vuota anche se poi e' stata trovata
        Promise.resolve(enrichTrack(t.id)).then((fatto) => {
          if (fatto) {
            const ora = tracks.find((x) => x.id === t.id);
            if (ora && !ora.cover) {
              const gia = coverInfo(ora.artist, ora.title);
              if (gia && gia.cover) {
                ora.cover = gia.cover;
                if (!ora.album) ora.album = gia.album || "";
                render();
              }
            }
          }
        }).catch(() => { /* noop */ });
      }
    }
    const dettaglio = senza.slice(0, 8).map((t) => {
      const k = normKey((t.artist || "") + " " + (t.title || ""));
      return (t.artist || "?") + " - " + t.title + " [chiave " + k + (coversData[k] ? ": c'è in covers.json" : ": ASSENTE") + "]";
    });
    segnalaErrore("senza copertina: " + senza.length + " -> " + dettaglio.join(" || "));
  }

  /* Brani per cui la copertina salvata in passato era DI UN ALTRO BRANO
     (per esempio "Eroina" di Kid Yugi aveva dentro la copertina di Alan
     Walker). La tolgo dal file delle copertine, ma il telefono e il
     computer hanno ancora dentro quella sbagliata: senza questa lista me la
     continuerebbero a mostrare. Preferisco non mostrare niente: una
     copertina assente si capisce, una sbagliata fa perdere tempo.
     Quando la copertina giusta arriva nel file, vince quella e questa lista
     non serve piu'. */
  const COPERTINE_NON_AFFIDABILI = [
    { artista: "Kid Yugi & Tutti Fenomeni", titolo: "Eroina" },
    { artista: "Kid Yugi, Tedua & Junior K", titolo: "Eva" },
    { artista: "madame", titolo: "l'anima" },
    { artista: "nayt", titolo: "Lastronauta (Visual)" },
    { artista: "Ferro di checov", titolo: "Kid Yugi x Nuts - Lil Peep" },
    { artista: "Nayt / Frah Quintale / Tony Boy", titolo: "CIGNO NERO RMX" }
  ];
  function copertinaNonAffidabile(artist, title) {
    for (const x of COPERTINE_NON_AFFIDABILI) {
      if (titoloDaProvare(artist, title).some((t) => titleMatch(t, x.titolo).score >= 60) &&
          artistaSimile(artist, x.artista)) return true;
    }
    return false;
  }

  async function loadCovers() {
    try {
      /* Aggiungo il tempo alla richiesta: senza, il telefono può servire la
         copia vecchia del file e le copertine restano quelle sbagliate. */
      const res = await fetch("covers.json?t=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      coversData = await res.json();
    } catch (e) {
      try {
        const res = await fetch("covers.json");
        if (res.ok) { coversData = await res.json(); return; }
      } catch (e2) { /* noop */ }
      coversData = {};
    }
  }

  function stripArtistPrefix(artist, title) {
    const a = (artist || "").trim();
    const t = (title || "").trim();
    if (a && t.toLowerCase().startsWith(a.toLowerCase() + " - ")) return t.slice(a.length + 3).trim();
    return t;
  }

  function coverKey(artist, title) {
    return normKey((artist || "") + " " + stripArtistPrefix(artist, title));
  }

  /* Chiave "sporca", senza togliere cio' che c'e' tra parentesi: serve perche'
     il programma che scarica le copertine le chiama in un modo e io in
     un altro (per esempio "nayt - Poter scegliere - Nayt (Live)": qui
     diventa naytpotersceglierenayt, li' naytpotersceglierenaytlive).
     Se provo una sola forma, quelle copertine non le trovo mai. */
  function chiaveSemplice(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

/* Due artisti si somigliano se sono lo stesso nome scritto in modo un po'
     diverso ("Olivia Rodrigo" e "olivia rodriguo" sono lo stesso nome con un
     refuso). Confronto le lettere una a una: se sono diverse al massimo due,
     compresi i caratteri in piu' o in meno, e' lo stesso artista.
     Prima usavo un algoritmo complicato che sbagliava, e faceva scartare
     anche le copertine giuste. */
  function artistaSimile(a, b) {
    const x = normKey(a), y = normKey(b);
    if (!x || !y) return false;
    if (x === y) return true;
    if (x.indexOf(y) >= 0 || y.indexOf(x) >= 0) return true;
    const m = Math.min(x.length, y.length);
    if (m < 4) return false;
    let diversi = Math.abs(x.length - y.length);
    for (let i = 0; i < m; i++) {
      if (x.charAt(i) !== y.charAt(i)) diversi++;
      if (diversi > 2) return false;
    }
    return diversi <= 2;
  }

  /* Titoloni da provare quando cerco la copertina. In libreria i titoli sono
     messi in modo che a volte l'artista ci sta dentro ("SAITTA - Romantici
     Terroni", "Poter scegliere - Nayt (Live)"): se guardo solo il titolo
     intero non somiglia mai a quello del file delle copertine e il brano
     resta senza immagine. Provo quindi anche il titolo ripulito. */
  function titoliDaProvare(artist, title) {
    const out = [];
    const visti = [];
    /* Restituisco i titoli come sono, non gia' ridotti a una parola: il
       confronto con titleMatch ha bisogno delle parole vere. */
    const aggiungi = (v) => {
      const s = String(v || "").trim();
      const k = normKey(s);
      if (!k) return;
      for (const gia of visti) if (normKey(gia) === k) return;
      visti.push(s);
      out.push(s);
    };
    aggiungi(stripArtistPrefix(artist, title));
    aggiungi(String(title || "").replace(/\((live|visual|audio|official|remaster|explicit)[^)]*\)/gi, ""));
    const s = String(title || "");
    const i = s.lastIndexOf(" - ");
    if (i > 0) {
      aggiungi(s.slice(0, i));
      aggiungi(s.slice(i + 3));
    }
    aggiungi(title);
    return out;
  }

  function coverInfo(artist, title) {
    const senzaArtista = stripArtistPrefix(artist, title);
    /* Una voce di covers.json vale solo se parla davvero del brano che
       sto cercando. Il file a volte aveva la chiave giusta ma dentro i
       dati di un altro brano (es. la chiave di "Eroina" di Kid Yugi
       conteniva la copertina di "Eroina" di Alan Walker): senza questo
       controllo la app mostrava la copertina sbagliata senza accorgersene. */
    const buona = (c) => {
      if (!c || !c.cover) return false;
      if (normKey(artist) && !artistaSimile(artist, c.artist)) return false;
      if (normKey(title)) {
        let ok = false;
        for (const cand of titoliDaProvare(artist, title)) {
          const m = titleMatch(cand, c.title || "");
          if (m && m.score >= 60) { ok = true; break; }
        }
        if (!ok) return false;
      }
      return true;
    };
    /* Prima cerco con artista E titolo insieme: e' il modo giusto. */
    const varianti = [
      coverKey(artist, title),
      normKey((artist || "") + " " + (title || "")),
      chiaveSemplice((artist || "") + " " + (title || "")),
      chiaveSemplice((artist || "") + " " + senzaArtista)
    ];
    for (const k of varianti) {
      if (k && buona(coversData[k])) return coversData[k];
    }
    /* Poi, per il solo titolo: cosi' com'era prima, ma sempre controllando
       che l'artista sia davvero quello. */
    for (const k of [normKey(title || ""), chiaveSemplice(title || "")]) {
      if (k && buona(coversData[k])) return coversData[k];
    }
    return null;
  }

  async function loadLocalLyrics() {
    localLyrics = {};
    try {
      const rows = await dbAllLyrics();
      for (const r of rows) {
        localLyrics[r.id] = { title: r.title, artist: r.artist || "", text: r.text, synced: r.synced || "", source: r.source || "" };
      }
    } catch (e) {
      localLyrics = {};
    }
  }

  function hashId(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  /* ---------- Rendering ---------- */
  function filterText(t) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function wordsOf(s) {
    return filterText(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  }

  function matchScore(q, t) {
    const all = wordsOf(q);
    const words = all.filter((w) => w.length >= 2);
    if (!words.length) {
      const nq = normKey(q);
      if (!nq) return 0;
      const hay = normKey(t.title + " " + t.artist);
      return hay.indexOf(nq) >= 0 ? 5 : -1;
    }
    const tw = wordsOf(t.title);
    const aw = wordsOf(t.artist);
    const hay = tw.concat(aw);
    let score = 0;
    for (const w of words) {
      if (tw.some((x) => x === w)) score += 4;
      else if (w.length >= 3 && tw.some((x) => x.length >= 3 && (x.startsWith(w) || w.startsWith(x)))) score += 3;
      else if (aw.some((x) => x === w)) score += 2;
      else if (w.length >= 3 && aw.some((x) => x.length >= 3 && (x.startsWith(w) || w.startsWith(x)))) score += 1;
      else if (w.length >= 3 && hay.some((x) => x.indexOf(w) >= 0)) score += 0.5;
      else return -1;
    }
    if (filterText(t.title) === filterText(q)) score += 12;
    if (t.artist && filterText(t.artist) === filterText(q)) score += 12;
    if (words.length === 1 && score >= 3) score += 1;
    return score;
  }

  /* Come raggruppo i brani per artista: gli accenti e la punteggiatura non
     devono creare gruppi diversi ("Kid Yugi" e "kid yugi" sono lo stesso),
     e i feat non devono spargere un brano in due gruppi. */
  function gruppoArtista(t) {
    let a = String(t.artist || "").trim();
    if (!a) {
      /* senza artista, provo a toglierlo dal titolo ("Nayt - Esce") */
      const m = /^([^-]{2,40})\s+-\s+(.+)$/.exec(String(t.title || ""));
      if (m) a = m[1];
    }
    if (!a) return "zzz";
    return normParole(a.split(/\s*(?:,|feat|ft|&|x|e)\s+/i)[0]) || "zzz";
  }
  function titoloOrdinato(t) {
    return normKey(t.title);
  }
const ORDINAMENTI = [
  { id: "artista", nome: "Per artista" },
  { id: "titolo", nome: "Per titolo" },
  { id: "aggiunti", nome: "Piu' recenti" },
  { id: "ascoltati", nome: "Piu' ascoltati" },
  { id: "maiascoltati", nome: "Meno ascoltati" }
  ];

  /* Quante volte e per quanti secondi ho ascoltato un brano: me lo dice la
     scheda di ascolto dello stesso brano. Se non c'e' scheda, il brano non
     l'ho ancora ascoltato (quindi 0). */
  function _ascoltoDi(t) {
    try {
      if (!t) return { v: 0, s: 0 };
      const c = _chiaveStats(t);
      if (!c) return { v: 0, s: 0 };
      const r = statisticheProfilo()[c];
      return { v: (r && r.v) || 0, s: (r && r.s) || 0 };
    } catch (e) { return { v: 0, s: 0 }; }
  }
  function ordinaLista(lista) {
    if (ordinamento === "titolo") {
      return lista.slice().sort((a, b) => titoloOrdinato(a) < titoloOrdinato(b) ? -1 : 1);
    }
    if (ordinamento === "aggiunti") {
      return lista.slice().sort((a, b) => (b.aggiunto || 0) - (a.aggiunto || 0));
    }
    /* Ordinamento per ascolto: nel primo i piu' sentiti in cima, nel
       secondo i meno sentiti in cima. Chi non hai ancora ascoltato va
       fuori dai due gruppi (dopo se ordini per "piu' ascoltati", prima se
       ordini per "meno ascoltati"): cosi' i mai ascoltati non si
       mescolano con gli altri e restano riconoscibili. */
    if (ordinamento === "ascoltati" || ordinamento === "maiascoltati") {
      const su = ordinamento === "ascoltati";
      const dentro = lista.filter((t) => _ascoltoDi(t).s > 0);
      const fuori = lista.filter((t) => _ascoltoDi(t).s <= 0);
      const perTempo = dentro.slice().sort((a, b) => {
        const x = _ascoltoDi(a);
        const y = _ascoltoDi(b);
        const d = y.s - x.s;
        if (d !== 0) return su ? d : -d;
        if (y.v !== x.v) return su ? (y.v - x.v) : (x.v - y.v);
        return (a.artist || "") < (b.artist || "") ? -1 : 1;
      });
      return su ? perTempo.concat(fuori) : fuori.concat(perTempo);
    }
    /* Default: tutti i brani di un artista di fila, gli artisti in ordine
       alfabetico, e dentro ogni gruppo i brani per titolo. Cosi' i 5 brani
       di Nayt stanno insieme, poi i 5 di Kid Yugi, e se aggiungo un brano
       nuovo di un artista gia' presente finisce nel suo gruppo da solo. */
    return lista.slice().sort((a, b) => {
      const ga = gruppoArtista(a), gb = gruppoArtista(b);
      if (ga !== gb) return ga < gb ? -1 : 1;
      const ta = titoloOrdinato(a), tb = titoloOrdinato(b);
      if (ta !== tb) return ta < tb ? -1 : 1;
      return String(a.title || "") < String(b.title || "") ? -1 : 1;
    });
  }
  function visibleTracks() {
    let list = tracks.filter((t) => !hiddenTracks.has(t.id));
    if (favOnly) list = list.filter((t) => favorites.has(t.id));
    if (soloMaiAscoltati) list = list.filter((t) => _ascoltoDi(t).s <= 0);
    if (!query) return ordinaLista(list);
    const scored = [];
    for (const t of list) {
      const s = matchScore(query, t);
      if (s >= 0) scored.push({ t, s });
    }
    /* durante la ricerca l'ordine piu' utile e' quanto somigliano al testo
       scritto, quindi qui non riordino per artista */
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.t);
  }

  async function hideTrack(id) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    const msg = t.builtin
      ? "«" + t.title + "» sparisce dalla tua lista, ma resta nel sito e gli altri lo vedono ancora."
      : "«" + t.title + "» sparisce dalla tua lista di questo profilo.";
    const yes = await askConfirm("Togliere dalla lista?", msg, "Togli");
    if (!yes) return;
    hiddenTracks.add(id);
    saveCurrentState();
    if (currentId === id) {
      if (audio) audio.pause();
      currentId = null;
      setHud();
    }
    closeLyrics();
    render();
  /* niente: la finestra dei nascosti e' stata tolta */
    toast("Brano tolto dalla lista");
  }

  function restoreHidden() {
    hiddenTracks = new Set();
    saveCurrentState();
    render();
  /* niente: la finestra dei nascosti e' stata tolta */
    toast("Brani ripristinati: sono di nuovo tutti visibili");
  }

  /* Non c'e' piu' la finestra dei brani nascosti: quando elimini una canzone
     ti gia' chiede conferma, quindi una lista di "nascosti" da riportare
     indietro non serviva a niente. Il menu rapido del brano nascosto offre
     "Rimetti nella lista". */

  /* Rende pubblici i brani che esistono solo su questo dispositivo, e lo fa
     DA SOLO: non c'e' un tasto da premere. Ogni brano importato a mano resta
     nel browser da cui l'hai importato, quindi senza questo non lo vedresti
     dagli altri dispositivi. Chiamo questa funzione all'avvio e ogni volta
     che finisce un import, cosi' non ci resta niente da fare a mano.

     I brani senza file (per esempio solo un'anteprima o un link) non si
     possono condividere: non c'e' niente da mandare. */
  let condivisioneInCorso = false;
  async function condividiBraniLocali() {
    if (condivisioneInCorso) return;
    if (!db) return;
    condivisioneInCorso = true;
    const ind = $("shareInd");
    const badge = $("shareBadge");
    try {
      let daMandare = [];
      let senzaFile = 0;
      let giaCondivisi = 0;
      try {
        const tutti = await dbAll();
        /* Un brano che esiste gia' nella libreria condivisa non lo rimando:
           si aggiornerebbe da solo e rischierei di crearne un secondo. */
        const utili = (tutti || []).filter((r) => r && !r.condiviso);
        for (const r of utili) {
          if (eGiaCondiviso({ title: r.title, artist: r.artist })) {
            giaCondivisi++;
            r.condiviso = true;
            try { await dbPut(r); } catch (e3) { /* non e' grave */ }
            continue;
          }
          if (r.blob && r.blob.size) daMandare.push(r);
          else senzaFile++;
        }
      } catch (e) {
        segnalaErrore("condivisione: lettura brani fallita: " + String((e && e.message) || e).slice(0, 120));
        return;
      }
      _ultimiSenzaFile = senzaFile;
      if (giaCondivisi) {
        segnalaErrore("condivisione: " + giaCondivisi + " brani erano gia' nella libreria condivisa");
      }
      if (senzaFile) {
        segnalaErrore("condivisione: " + senzaFile + " brani senza file, non condivisibili");
      }
      if (!daMandare.length) {
        if (ind) ind.hidden = true;
        return;
      }
      const online = await ponteOnline();
      if (!online) {
        /* Il PC non c'e': non e' un errore, lascio i brani qui e riprovo
           al prossimo avvio. Non disturbo l'utente con un avviso. */
        if (ind) ind.hidden = true;
        return;
      }
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      if (ind) {
        ind.hidden = false;
        ind.classList.add("busy");
        ind.title = "Sto condividendo " + daMandare.length + " brani con gli altri dispositivi";
      }
      let fatti = 0;
      let falliti = 0;
      for (const r of daMandare) {
        const nome = [(r.artist || ""), (r.title || "")].join(" - ")
          .replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim() || "brano";
        try {
          const risp = await fetch(base + "/salva?nome=" + encodeURIComponent(nome) +
            "&cartella=" + encodeURIComponent(CARTELLA_PREDEFINITA), {
            method: "POST",
            headers: { "Content-Type": "audio/mpeg" },
            body: r.blob
          });
          if (!risp.ok) throw new Error("il programma ha risposto " + risp.status);
          r.condiviso = true;
          try { await dbPut(r); } catch (e2) { /* va bene anche senza riscrivere */ }
          fatti++;
          if (badge) badge.textContent = String(daMandare.length - fatti - falliti);
        } catch (e) {
          falliti++;
          segnalaErrore("brano non condiviso (" + nome.slice(0, 40) + "): " +
            String((e && e.message) || e).slice(0, 120));
        }
      }
      if (ind) ind.classList.remove("busy");
      toast(falliti
        ? "Condivisi " + fatti + " brani, " + falliti + " non riusciti"
        : "Condivisi " + fatti + (fatti === 1 ? " brano" : " brani") + ": ora si vedono anche sugli altri dispositivi");
      segnalaErrore("condivisione finita: " + fatti + " condivisi, " + falliti + " falliti, " + senzaFile + " senza file");
    } finally {
      condivisioneInCorso = false;
      render();
    }
  }

  /* Aggiorna l'indicatore: dice quanti brani privati ci sono ancora da
     condividere, e sparisce quando non ne resta nessuno. */
  function aggiornaIndicatoreCondivisione() {
    const ind = $("shareInd");
    const badge = $("shareBadge");
    if (!ind) return;
    const privati = tracks.filter((t) => !t.builtin && !t.preview && !eGiaCondiviso(t)).length;
    const daCondividere = privati > 0;
    ind.hidden = !daCondividere && !condivisioneInCorso;
    if (badge) {
      badge.hidden = !daCondividere;
      badge.textContent = String(privati);
    }
    ind.title = daCondividere
      ? privati + (privati === 1 ? " brano solo su questo dispositivo: si condivide da solo" :
        " brani solo su questo dispositivo: si condividono da soli")
      : "Tutti i brani sono gia' condivisi";
  }

  /* Un brano locale e uno condiviso sono lo stesso brano: la copia nel
     browser serve solo per non scaricarlo due volte, ma elencarlo come
     "solo tuo" e' sbagliato, e non serve neppure rimandarlo al PC.
     Prima succedeva esattamente questo: dopo aver condiviso un brano, il PC
     continuava a dire "10 solo tuoi" perche' non si accorgeva che quel
     brano era gia' nella libreria di tutti. */
  /* Come normKey ma lascia gli spazi: serve per capire se un artista e'
     l'altro piu' i suoi feat (per esempio "Kid Yugi" dentro
     "Kid Yugi, Tedua & Junior K"). */
  function normParole(s) {
    return String(s || "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  /* Lo stesso artista, o uno che e' l'altro con dentro i feat. */
  function stessoArtista(a, b) {
    const x = normParole(a), y = normParole(b);
    if (!x || !y) return false;
    if (x === y) return true;
    const corto = x.length <= y.length ? x : y;
    const lungo = x.length <= y.length ? y : x;
    /* il nome corto deve finire a confine di parola, altrimenti
       "Kid Yugi" risulterebbe dentro "Kid Yugiroll" */
    return lungo.indexOf(corto) === 0 && lungo.charAt(corto.length) === " ";
  }
  function stessoBrano(a, b) {
    if (!a || !b) return false;
    const ta = normKey(a.title), tb = normKey(b.title);
    if (!ta || !tb) return false;
    const titoliUguali = ta === tb || ta.indexOf(tb) >= 0 || tb.indexOf(ta) >= 0;
    if (!titoliUguali) return false;
    if (normKey(a.artist) || normKey(b.artist)) return stessoArtista(a.artist, b.artist);
    /* Senza artista non si puo' dire con certezza, quindi non confondo. */
    return ta.length >= 8;
  }
  /* La lista si ridisegna spesso e il confronto coi brani condivisi gira ogni
     volta: me lo ricordo, cosi' non ripeto lo stesso lavoro. */
  const _memoCondiviso = new Map();
  /* Copie nel browser dei brani che esistono gia' nella libreria condivisa.
     Non le mostro in lista (altrimenti ci sarebbero due righe identiche),
     ma le tengo qui: se il file online non si puo' suonare, uso questa. */
  const _copieLocali = new Map();
  function _chiaveBrano(t) {
  return normKey(t.artist) + "|" + normKey(t.title);
  }

  function eGiaCondiviso(t) {
    if (t.builtin) return true;
    const k = normKey(t.artist) + "|" + normKey(t.title);
    if (_memoCondiviso.has(k)) return _memoCondiviso.get(k);
    let r = false;
    for (const b of BUILTIN) if (stessoBrano(t, b)) { r = true; break; }
    if (_memoCondiviso.size > 800) _memoCondiviso.clear();
    _memoCondiviso.set(k, r);
    return r;
  }

  function render() {
    const list = visibleTracks();
    playlistEl.innerHTML = "";

    const visibleAll = tracks.filter((t) => !hiddenTracks.has(t.id));
    const total = visibleAll.length;
    const mine = visibleAll.filter((t) => !t.builtin && !t.preview && !eGiaCondiviso(t)).length;
    const n = list.length;
    /* I brani nascosti a mano non sparivano senza dire niente: il contatore
       sembrava sbagliato. Adesso lo dice, e lo scrivo anche nel registro del
       PC cosi' i numeri si possono controllare senza chiedere. */
const nascosti = hiddenTracks.size;
    /* Scritta semplice, senza simboli strani: prima c'era un trattino lungo
       che sembrava scritto male, e non si capiva cosa volesse dire. */
    let label = profile + ": " + total + (total === 1 ? " brano" : " brani");
    if (mine) label += ", " + mine + (mine === 1 ? " solo tuo" : " solo tuoi");
    if (favOnly || soloMaiAscoltati || query) label = n + " di " + total + (total === 1 ? " brano" : " brani");
    $("trackCount").textContent = label;
    /* Il bottone dell'ordinamento mostra sempre la scelta attuale. */
    const bt = $("btnOrdina");
    if (bt) {
      const scelta = ORDINAMENTI.find((o) => o.id === ordinamento) || ORDINAMENTI[0];
      bt.textContent = scelta.nome;
      bt.title = "Cambia ordinamento (ora: " + scelta.nome.toLowerCase() + ")";
    }
    /* Registro dei numeri della libreria: una volta per avvio. Serve a me per
       capire cosa manca senza dover chiedere uno screenshot a Stefano. */
    if (!_numeriGiaInviati) {
      _numeriGiaInviati = true;
      try {
        const condivisi = tracks.filter((t) => t.builtin).length;
        segnalaErrore("libreria: " + tracks.length + " brani in tutto = " + condivisi + " condivisi + " +
          (tracks.length - condivisi) + " privati; visibili " + visibleAll.length +
          "; nascosti a mano " + nascosti + "; duplicati nascosti " + _ultimiDuplicati +
          "; brani senza file " + _ultimiSenzaFile);
      } catch (e) { /* noop */ }
    }
    aggiornaIndicatoreCondivisione();

    if (!list.length) {
      emptyEl.hidden = false;
      emptyEl.textContent = !total
        ? (hiddenTracks.size
          ? "Hai nascosto tutti i brani di " + profile + ": tocca l'icona dell'occhio per rivederli."
          : "La libreria di " + profile + " è vuota. Le canzoni arrivano dal computer (cartella musica mp3 " +
            profile.toLowerCase() + ") oppure scaricale con la scheda Importa.")
        : !tracks.length
          ? "Nessun brano. Tocca + per aggiungere della musica."
          : favOnly && !query
            ? "Nessun preferito: tocca il cuore su un brano."
            : "Nessun brano trovato.";
      return;
    }
    emptyEl.hidden = true;
    avvisaProfiloVuoto();

    list.forEach((t) => {
      const li = document.createElement("li");
      li.className = "track" + (t.id === currentId ? " active" : "");

      let art;
      if (t.cover) {
        art = document.createElement("img");
        art.className = "track-art";
        art.alt = "";
        art.src = t.cover;
      } else {
        art = document.createElement("div");
        art.className = "track-art";
        art.style.background = t.gradient;
      }

      const info = document.createElement("div");
      info.className = "track-info";
      const title = document.createElement("div");
      title.className = "track-title";
      title.textContent = t.title;
      if (t.builtin) {
        const badge = document.createElement("span");
        badge.className = "track-badge";
        badge.textContent = "tutti";
        title.appendChild(badge);
      }
      info.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "track-meta";
      const bits = [];
      if (t.artist) bits.push(t.artist);
      if (t.album) bits.push(t.album);
      if (t.preview) bits.push("anteprima 30s");
      if (t.builtin) meta.textContent = bits.length ? bits.join(" · ") : "per tutti";
      else meta.textContent = bits.length ? bits.join(" · ") + " · solo tua" : "solo tua";
      info.appendChild(meta);

      li.appendChild(art);
      li.appendChild(info);
      /* Tieni premuto e si apre il menu rapido (che al primo posto ha
         "Cambia nome e artista"). Qui non metto un secondo gestore di
         pressione lunga: due insieme si confondevano e la finestra del nome
         si apriva anche con un tocco normale. */
      li.title = "Tieni premuto per le azioni sulla canzone";

      const favBtn = document.createElement("button");
      favBtn.className = "track-fav" + (favorites.has(t.id) ? " on" : "");
      favBtn.setAttribute("aria-label", "Preferito");
      favBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"/></svg>';
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (favorites.has(t.id)) favorites.delete(t.id);
        else favorites.add(t.id);
        saveCurrentState();
        render();
      });
      li.appendChild(favBtn);

      if (t.builtin && !isCached(t)) {
        const cloud = document.createElement("button");
        cloud.className = "track-cloud";
        cloud.setAttribute("aria-label", "Scarica " + t.title + " per offline");
        cloud.title = "Non e' ancora offline: tocca per scaricarla";
        cloud.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 19a4.5 4.5 0 0 1-.4-8.98 6 6 0 0 1 11.6 1.65A4 4 0 0 1 18.5 19h-12Z"/></svg>';
        cloud.addEventListener("click", (e) => {
          e.stopPropagation();
          cacheOneTrack(t, cloud);
        });
        li.appendChild(cloud);
      }

      if (!t.builtin && !t.preview) {
        const share = document.createElement("button");
        share.className = "track-share";
        share.setAttribute("aria-label", "Condividi " + t.title);
        share.title = "Condividi con tutti";
        share.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z"/><path fill="currentColor" d="M4 15a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a1 1 0 1 1 2 0v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2a1 1 0 0 1 1-1Z"/></svg>';
        share.addEventListener("click", (e) => {
          e.stopPropagation();
          exportTrack(t);
        });
        li.appendChild(share);
      }

      const del = document.createElement("button");
      del.className = "track-del";
      if (t.builtin || t.preview) {
        del.setAttribute("aria-label", "Togli dalla lista " + t.title);
        del.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 11H7v-2h10v2Z"/></svg>';
        del.addEventListener("click", () => hideTrack(t.id));
      } else {
        del.setAttribute("aria-label", "Elimina " + t.title);
        del.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h.3l.9 12.2A3 3 0 0 0 9.2 22h5.6a3 3 0 0 0 3-2.8L18.7 7H19a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm4 2v1h-2V5h2Zm-3.7 5.5a1 1 0 0 1 1.9.3l-.4 7a1 1 0 1 1-1.9-.3l.4-7Zm5.9.3a1 1 0 1 1 1.9-.3l-.4 7a1 1 0 1 1-1.9.3l.4-7Z"/></svg>';
        del.addEventListener("click", () => removeTrack(t.id));
      }
      li.appendChild(del);

      li.addEventListener("click", () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        playById(t.id);
      });
      bindLongPress(li, t);
      playlistEl.appendChild(li);
    });
  }

  /* ---------- Audio robusto (fix iOS lock screen) ---------- */
  function setPlaybackState(s) {
    if ("mediaSession" in navigator) {
      try { navigator.mediaSession.playbackState = s; } catch (e) { /* noop */ }
    }
  }

  function handleEnded() {
    if (currentId) LS.set("mb.pos." + currentId, 0);
    if (queue.length) {
      const next = queue.shift();
      persistQueue();
      renderQueueCount();
      playById(next);
      return;
    }
    if (repeat) {
      audio.currentTime = 0;
      doPlay();
    } else {
      playById(idBranoA(nextIndex()));
    }
  }

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function updateProgressUI(t, d) {
    const fill = $("playerProgress").querySelector(".fill");
    if (fill) fill.style.width = (d ? (t / d) * 100 : 0) + "%";
    $("curTime").textContent = fmtTime(t);
    $("totTime").textContent = d ? fmtTime(d) : "0:00";
  }

  function savePos() {
    if (currentId && audio && isFinite(audio.currentTime)) {
      const sec = Math.floor(audio.currentTime);
      writeProfileState(profile, { last: currentId, time: sec });
      LS.set("mb.pos." + currentId, sec);
    }
  }

  function updatePlayerHeight() {
    const el = $("player");
    if (!el) return;
    const h = Math.round(el.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty("--player-h", h + "px");
  }

  function maybeSavePos() {
    const now = Date.now();
    if (now - lastSave < 3000) return;
    lastSave = now;
    savePos();
  }

function handleTime() {
  if (!scrubbing) {
    const t = audio.currentTime;
    updateProgressUI(t, totalDuration());
    maybeSavePos();
  }
  tickLyrics();
  syncPlayUI();
  /* la barra della schermata di blocco del telefono deve camminare
     insieme al brano: senza questo resta ferma */
  _aggiornaPosizioneSchermo();
  }

  function handleMetadata() {
    const want = resumeAt;
    resumeAt = 0;
    if (want > 8 && audio) {
      const d = totalDuration();
      try { audio.currentTime = Math.min(want, d > 20 ? d - 5 : want); } catch (e) { /* noop */ }
    }
    updateProgressUI(audio ? audio.currentTime || 0 : 0, totalDuration());
  }

  function handleError() {
  console.warn("Errore audio, provo a recuperare");
  const t = current();
  if (t && t.builtin && !t._provatoLocale) {
    /* Il brano viene dal sito e non si vuole: uso la copia nel browser. */
    t._provatoLocale = true;
    usaCopiaLocale(t).then((blob) => {
      if (!blob) {
        segnalaErrore("brano non riproducibile e senza copia locale: " +
          String((t.artist || "") + " " + (t.title || "")).slice(0, 60));
        return;
      }
      audio = createAudio();
      audio.src = URL.createObjectURL(blob);
      audio.volume = volumePct / 100;
      segnalaErrore("uso la copia locale per: " +
        String((t.artist || "") + " " + (t.title || "")).slice(0, 60));
      doPlay();
    });
    return;
  }
  rebuildAudio(true);
  }

  /* Se un brano condiviso non si puo' suonare dal sito (per esempio il file
     non e' ancora stato pubblicato), provo con la copia che ho nel browser. */
  async function usaCopiaLocale(brano) {
    try {
      const k = _chiaveBrano(brano);
      let rec = _copieLocali.get(k);
      if (rec === undefined) {
        const tutti = await dbAll();
        rec = (tutti || []).find((r) => r && r.blob && _chiaveBrano({ artist: r.artist, title: r.title }) === k) || null;
        _copieLocali.set(k, rec);
      }
      return (rec && rec.blob) ? rec.blob : null;
    } catch (e) {
      return null;
    }
  }

  function createAudio() {
    const a = new Audio();
    a.preload = "metadata";
    a.addEventListener("play", () => {
    syncPlayUI();
    updateMediaSession();
    _iniziaAscolto();
    });
    a.addEventListener("pause", () => {
    syncPlayUI();
    updateMediaSession();
    savePos();
    _chiudiAscolto(false);
    });
    a.addEventListener("ended", handleEnded);
    a.addEventListener("timeupdate", handleTime);
    /* Il conteggio del tempo ascoltato: qui si conta davvero, perche' questo
       evento scatta finche' la musica suona, su computer e su telefono. */
    a.addEventListener("timeupdate", _contaAlMuoversi);
    a.addEventListener("loadedmetadata", handleMetadata);
    a.addEventListener("error", handleError);
    return a;
  }

/* Ricreo il lettore audio. Fermo quello vecchio: se e' ancora vivo
     continuerebbe a suonare da solo. */
function rebuildAudio(autoplay) {
  const t = current();
  if (!t) return;
  const time = (audio && isFinite(audio.currentTime) && audio.currentTime) || 0;
  if (audio) { try { audio.pause(); } catch (e) { /* noop */ } }
  audio = createAudio();
  audio.src = t.url;
  audio.volume = volumePct / 100;
  try { if (time) audio.currentTime = time; } catch (e) { /* noop */ }
  if (autoplay) doPlay();
  }

  /* Faccio partire il brano.
     Prima, quando play() falliva, chiamavo rebuildAudio(true) che richiamava
     doPlay(): e se falliva di nuovo richiamava rebuildAudio... all'infinito.
     Ogni giro creava un lettore nuovo e non si sentiva NULLA, e il ciclo
     teneva occupato il browser tanto che la musica si fermava al brano dopo.
     Happenede soprattutto con lo schermo spento e con il tasto "avanti"
     dalla schermata di blocco, dove il browser blocca play(). */
  async function doPlay(hoGiaRiprovato) {
    if (!audio) audio = createAudio();
    try {
      audio.volume = volumePct / 100;
      setPlaybackState("playing");
      await audio.play();
      return true;
    } catch (e) {
      console.warn("Play bloccato" + (hoGiaRiprovato ? " (anche dopo aver ricreato il lettore)" : ""), e);
      /* il lettore si ricrea UNA volta sola, e senza richiamare doPlay da
         dentro: altrimenti si ripete per sempre */
      if (!hoGiaRiprovato) {
        rebuildAudio(false);
        return doPlay(true);
      }
      /* ancora bloccato (telefono in standby): riprovo con calma */
      _riprovaPiuTardi();
      return false;
    }
  }

  let _timerRiprove = null;
  function _riprovaPiuTardi() {
    if (_timerRiprove) clearTimeout(_timerRiprove);
    const tentativi = [1000, 3000, 6000];
    let i = 0;
    const riprova = () => {
      if (i >= tentativi.length) return;
      const quando = tentativi[i++];
      _timerRiprove = setTimeout(() => {
        try {
          if (audio && audio.paused && currentId) {
            /* riprovo sul brano corrente, senza ricominciare tutto */
            audio.play().catch(() => riprova());
            return;
          }
        } catch (e) { /* noop */ }
        riprova();
      }, quando);
    };
    riprova();
  }

  /* ---------- Menu rapido (pressione lunga) ---------- */
  function persistQueue() {
    LS.set("mb.queue", queue);
  }

  function renderQueueCount() {
    const el = $("quickCount");
    if (el) {
      el.hidden = !queue.length;
      el.textContent = queue.length ? queue.length + (queue.length === 1 ? " brano in coda" : " brani in coda") : "";
    }
    const badge = $("queueBadge");
    if (badge) {
      badge.hidden = !queue.length;
      badge.textContent = queue.length ? (queue.length > 9 ? "9+" : queue.length) : "";
    }
  }

  function queueTrack(id, front) {
    if (front) queue.unshift(id);
    else queue.push(id);
    persistQueue();
    renderQueueCount();
    toast(front ? "Lo suono dopo questo" : "Aggiunto in coda");
  }

  function openQueue() {
    renderQueueList();
    $("queuePanel").hidden = false;
    syncNoScroll();
  }

  function closeQueue() {
    $("queuePanel").hidden = true;
    syncNoScroll();
  }

  function moveQueue(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= queue.length) return;
    const id = queue[i];
    queue[i] = queue[j];
    queue[j] = id;
    persistQueue();
    renderQueueList();
  }

  function removeQueue(i) {
    queue.splice(i, 1);
    persistQueue();
    renderQueueCount();
    renderQueueList();
    if (!queue.length) {
      $("queueHint").hidden = true;
      const body = $("queueBody");
      const e = document.createElement("p");
      e.className = "queue-empty";
      e.textContent = "Coda vuota. Tieni premuto su una canzone e scegli \u201cAscolta dopo\u201d o \u201cMetti in coda\u201d.";
      body.appendChild(e);
    }
  }

  function playFromQueue(i) {
    const id = queue.splice(i, 1)[0];
    persistQueue();
    renderQueueCount();
    closeQueue();
    playById(id);
  }

  function renderQueueList() {
    const body = $("queueBody");
    body.innerHTML = "";

    const now = tracks.find((x) => x.id === currentId);
    if (now) {
      const head = document.createElement("div");
      head.className = "queue-item queue-now";
      const hi = document.createElement("div");
      hi.className = "queue-info";
      const ht = document.createElement("div");
      ht.className = "queue-title";
      ht.textContent = now.title;
      hi.appendChild(ht);
      if (now.artist) {
        const ha = document.createElement("div");
        ha.className = "queue-artist";
        ha.textContent = now.artist;
        hi.appendChild(ha);
      }
      head.appendChild(hi);
      const tag = document.createElement("span");
      tag.className = "queue-now-tag";
      tag.textContent = "In riproduzione";
      head.appendChild(tag);
      body.appendChild(head);
    }

    if (!queue.length) {
      const e = document.createElement("p");
      e.className = "queue-empty";
      e.textContent = "Coda vuota. Tieni premuto su una canzone e scegli \u201cAscolta dopo\u201d o \u201cMetti in coda\u201d.";
      body.appendChild(e);
      $("queueHint").hidden = true;
      return;
    }
    $("queueHint").hidden = false;

    const btnUp = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 5l7 7-1.4 1.4L12 7.8 6.4 13.4 5 12l7-7Z"/></svg>';
    const btnDown = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 19l-7-7 1.4-1.4L12 16.2l5.6-5.6L19 12l-7 7Z"/></svg>';
    const btnPlayQ = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5a1 1 0 0 1 1.5-.87l11 6.5a1 1 0 0 1 0 1.74l-11 6.5A1 1 0 0 1 8 18.5v-13Z"/></svg>';
    const btnClose = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5l5 5 5-5 1.4 1.4L13.4 12l5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5Z"/></svg>';

    const mkBtn = (title, html, fn, disabled) => {
      const b = document.createElement("button");
      b.className = "qbtn";
      b.type = "button";
      b.title = title;
      b.setAttribute("aria-label", title);
      b.innerHTML = html;
      b.disabled = !!disabled;
      b.addEventListener("click", fn);
      return b;
    };

    queue.forEach((id, i) => {
      const t = tracks.find((x) => x.id === id);
      const row = document.createElement("div");
      if (!t) {
        row.className = "queue-item queue-gone";
        const g = document.createElement("div");
        g.className = "queue-info";
        const gt = document.createElement("div");
        gt.className = "queue-title";
        gt.textContent = "Brano non più disponibile";
        g.appendChild(gt);
        row.appendChild(g);
        row.appendChild(mkBtn("Rimuovi", btnClose, () => removeQueue(i)));
        body.appendChild(row);
        return;
      }

      row.className = "queue-item";
      const num = document.createElement("div");
      num.className = "queue-num";
      num.textContent = i + 1;
      row.appendChild(num);

      const info = document.createElement("div");
      info.className = "queue-info";
      info.title = "Riproduci ora";
      info.addEventListener("click", () => playFromQueue(i));
      const ti = document.createElement("div");
      ti.className = "queue-title";
      ti.textContent = t.title;
      info.appendChild(ti);
      if (t.artist) {
        const ar = document.createElement("div");
        ar.className = "queue-artist";
        ar.textContent = t.artist;
        info.appendChild(ar);
      }
      row.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "queue-actions";
      actions.appendChild(mkBtn("Riproduci", btnPlayQ, () => playFromQueue(i)));
      actions.appendChild(mkBtn("Sposta su", btnUp, () => moveQueue(i, -1), i === 0));
      actions.appendChild(mkBtn("Sposta giù", btnDown, () => moveQueue(i, 1), i === queue.length - 1));
      actions.appendChild(mkBtn("Rimuovi", btnClose, () => removeQueue(i)));
      row.appendChild(actions);
      body.appendChild(row);
    });
  }

  function closeQuick() {
    $("quickPanel").hidden = true;
    syncNoScroll();
  }

  function quickAction(label, iconPath, fn, danger) {
    const b = document.createElement("button");
    b.className = "quick-btn" + (danger ? " danger" : "");
    b.type = "button";
    b.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="' + iconPath + '"/></svg>';
    b.appendChild(document.createTextNode(label));
    b.addEventListener("click", () => {
      closeQuick();
      fn();
    });
    return b;
  }

  const ICON_QUEUE = "M3 6h18v2H3V6Zm0 5h11v2H3v-2Zm0 5h11v2H3v-2Zm13-6 4 3-4 3v-6Z";
const ICON_EDIT = "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z";
  const ICON_NEXT = "M6 5l9 7-9 7V5Zm10 0h2v14h-2V5Z";
  const ICON_HIDE = "M3.3 2 2 3.3l2.4 2.4C2.5 7 1.4 8.7 1 9c1.1 2.3 4 5 7 6l2 2 1.3-1.3 15.4 15.4 1.3-1.3L3.3 2ZM12 5c4.4 0 8 4 8 4-.5 1-1.6 2.4-3.1 3.5l-1.5-1.5c1-.9 1.6-1.9 1.9-2.6-.6-.8-2.6-2.4-5.3-2.4-.4 0-.8 0-1.2.1L9.6 4.9c.8-.1 1.6-.1 2.4-.1Z";
  const ICON_SHARE = "M18 16a3 3 0 0 0-2.4 1.2l-6.9-4a3 3 0 0 0 0-1.4l7-4.1A3 3 0 1 0 15 6c0 .2 0 .4.1.6l-7 4.1a3 3 0 1 0 0 6.6l6.9 4A3 3 0 1 0 18 16Z";
  const ICON_OFFLINE = "M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z";

  function openQuickMenu(t) {
    if (!t) return;
    $("quickTitle").textContent = t.title;
    const box = $("quickActions");
box.innerHTML = "";
  /* Prima cosa nel menu: cambiare il nome. Stava in una pressione lunga
     separata, ma sul telefono un semplice tocco genera anche gli eventi del
     mouse e quella finestra si apriva da sola mentre ascoltavi. Ora la
     pressione lunga apre SOLO questo menu, e qui dentro c'e' tutto. */
  box.appendChild(quickAction("Cambia nome e artista", ICON_EDIT, () => apriRinomina(t.id)));
  box.appendChild(quickAction("Ascolta dopo", ICON_NEXT, () => queueTrack(t.id, true)));
    box.appendChild(quickAction("Metti in coda", ICON_QUEUE, () => queueTrack(t.id, false)));
    if (t.builtin) {
      const el = document.createElement("button");
      el.className = "quick-btn";
      el.type = "button";
      el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="' + ICON_OFFLINE + '"/></svg>';
      const gia = isCached(t);
      el.appendChild(document.createTextNode(gia ? "Già salvata offline" : cloudBusy ? "Salvataggio in corso..." : "Scarica per offline"));
      el.disabled = gia;
      el.style.opacity = gia ? ".55" : "1";
      el.addEventListener("click", () => {
        closeQuick();
        if (!cloudBusy) cacheOneTrack(t);
      });
      box.appendChild(el);
    } else {
      box.appendChild(quickAction("Condividi file", ICON_SHARE, () => exportTrack(t)));
    }
    box.appendChild(quickAction("Nascondi", ICON_HIDE, () => hideTrack(t.id), true));
  if (hiddenTracks.size) {
    box.appendChild(quickAction("Rimetti i nascosti", ICON_HIDE, () => _ripristinaNascosti()));
  }
    renderQueueCount();
    $("quickPanel").hidden = false;
    syncNoScroll();
  }

  /* Qui si rimettono i brani nascosti: la finestra con la lista di "nascosti"
     e' stata tolta (l'eliminazione chiede gia' conferma, quindi era inutile),
     ma se un brano e' stato nascosto puoi riportarlo qui, dal menu del brano
     o del profilo. */
function _ripristinaNascosti() {
    const quanti = hiddenTracks.size;
    if (!quanti) {
      toast("Non ci sono brani nascosti");
      return;
    }
    const messaggio = "Vuoi rimettere nella lista i " + quanti +
      (quanti === 1 ? " brano nascosto?" : " brani nascosti?");
    if (!confirm(messaggio)) return;
    hiddenTracks = new Set();
    saveCurrentState();
    render();
    toast("Brani rimessi nella lista");
  }

  function bindLongPress(el, t) {

    let timer = null;
    let startX = 0;
    let startY = 0;
    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest("button")) return;
      startX = e.clientX || 0;
      startY = e.clientY || 0;
      timer = setTimeout(() => {
        timer = null;
        suppressClick = true;
        try { navigator.vibrate && navigator.vibrate(8); } catch (err) { /* noop */ }
        openQuickMenu(t);
      }, 550);
      const moved = (ev) => {
        if (!timer) return;
        const dx = Math.abs((ev.clientX || 0) - startX);
        const dy = Math.abs((ev.clientY || 0) - startY);
        if (dx > 10 || dy > 10) stop();
      };
      const up = () => {
        stop();
        el.removeEventListener("pointermove", moved);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      };
      el.addEventListener("pointermove", moved);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /* ---------- Player ---------- */
  function current() {
    return tracks.find((t) => t.id === currentId) || null;
  }

  function setArt(el, t) {
    if (!el) return;
    const cover = t && t.cover ? String(t.cover).replace(/["'()]/g, "") : "";
    if (cover) {
      el.style.backgroundImage = 'url("' + cover + '")';
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage = "";
      el.style.background = t ? t.gradient : "linear-gradient(135deg,#333,#222)";
    }
  }

  function setHud() {
    const t = current();
    setArt($("playerArt"), t);
    setArt($("hudArt"), t);
    $("playerTitle").textContent = t ? t.title : "—";
    $("hudTitle").textContent = t ? t.title : "Nessuna traccia";
    $("hudSub").textContent = t ? (currentLyrics() ? "Testo disponibile" : t.builtin ? "Brano incluso" : "Brano aggiunto") : "Aggiungi musica per iniziare";
    updateLyricsButton();
    render();
  }

  function updateLyricsButton() {
    $("btnLyrics").hidden = !currentLyrics();
  }

  function currentLyrics() {
    if (!currentId) return null;
    if (lyricsData[currentId] && lyricsData[currentId].text) return lyricsData[currentId];
    if (localLyrics[currentId] && localLyrics[currentId].text) return localLyrics[currentId];
    return null;
  }

  async function playById(id, autoplay = true) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    if (id !== currentId) resumeAt = 0;
    currentId = id;
    /* Cambio brano: chiudo il conto del pezzo precedente e riparto. */
    _chiudiAscolto(false);
    if (autoplay) _contaAscoltoNuovo(t);
    _iniziaAscolto();
    writeProfileState(profile, { last: id, time: 0 });
    if (!audio) audio = createAudio();
    audio.src = t.url;
    audio.volume = volumePct / 100;
    setHud();
    updateProgressUI(0, 0);
    const activeEl = playlistEl.querySelector(".track.active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    updateMediaSession();
    if (autoplay) await doPlay();
  }

  /* Il brano in una certa posizione, ma SENZA far esplodere niente.
     Prima scrivevo direttamente tracks[indice].id: se la libreria e' vuota
     (un computer nuovo, o un profilo senza brani, o tutti brani nascosti)
     tracks[0] non esiste e la pagina si fermava con un errore. */
function idBranoA(indice) {
  const t = tracks[indice];
  return (t && t.id) ? t.id : "";
}

function nextIndex() {
    if (shuffle && tracks.length > 1) {
      let n = Math.floor(Math.random() * tracks.length);
      const cur = tracks.findIndex((x) => x.id === currentId);
      if (cur >= 0 && tracks.length > 1) {
        for (let k = 0; k < 20 && n === cur; k++) n = Math.floor(Math.random() * tracks.length);
      }
      return n;
    }
    const idx = tracks.findIndex((x) => x.id === currentId);
    return (idx + 1) % Math.max(tracks.length, 1);
  }

  function prevIndex() {
    const idx = tracks.findIndex((x) => x.id === currentId);
    return (idx - 1 + tracks.length) % Math.max(tracks.length, 1);
  }

  function playNext() {
    if (queue.length) {
      const next = queue.shift();
      persistQueue();
      renderQueueCount();
      playById(next);
      return;
    }
    playById(idBranoA(nextIndex()));
  }

  async function togglePlay() {
    if (!currentId && tracks.length) await playById(tracks[0].id);
    if (audio.paused) await doPlay();
    else audio.pause();
  }

  function setSvgVisible(el, visible) {
    if (visible) el.removeAttribute("hidden");
    else el.setAttribute("hidden", "");
  }

function syncPlayUI() {
  if (!audio) return;
  setSvgVisible($("iconPlay"), audio.paused);
  setSvgVisible($("iconPause"), !audio.paused);
  setPlaybackState(audio.paused ? "paused" : "playing");
  const art = $("playerArt");
  if (art) art.classList.toggle("playing", !audio.paused);
  const hud = $("hudArt");
  if (hud) hud.classList.toggle("playing", !audio.paused);
  /* se il brano si e' fermo o e' finito, anche la schermata di blocco
     del telefono deve saperlo */
  if (audio.paused || audio.ended) _aggiornaPosizioneSchermo();
  }

  /* La copertina da mostrare sulla schermata di blocco del telefono.
     La copertina puo' essere un indirizzo internet (le copertine buone
     sono in covers.json) oppure un'immagine scaricata e tenuta sul
     dispositivo (quella che ho cercato io con "Scarica tutte le copertine
     mancanti"). */
let _copertinaSchermoUrl = "";
function _copertinaPerSchermo(t) {
    const c = t && t.cover;
    try {
      if (typeof c === "string" && /^https?:\/\//i.test(c)) return c;
      if (c && typeof c !== "string" && typeof c.size === "number") {
        /* non tengo via gli indirizzi vecchi, altrimenti a ogni brano
           se ne crea uno nuovo e la memoria del telefono si riempie */
        if (_copertinaSchermoUrl) URL.revokeObjectURL(_copertinaSchermoUrl);
        _copertinaSchermoUrl = URL.createObjectURL(c);
        return _copertinaSchermoUrl;
      }
    } catch (e) { /* noop */ }
    return "";
  }

  /* Dov'e' la canzone nella barra: serve per la barra della schermata
     di blocco. Il telefono la disegna da solo se glielo diciamo. */
let _ultimaPosizioneSchermo = 0;
function _aggiornaPosizioneSchermo() {
  if (!("mediaSession" in navigator)) return;
  if (!navigator.mediaSession.setPositionState) return;
  /* Non lo chiamo a ogni evento della musica: sono 4-5 volte al secondo e
     non serve. Una volta ogni due secondi la barra della schermata di
     blocco scorre comunque, e il telefono respira meglio. */
  const ora = Date.now();
  if (ora - _ultimaPosizioneSchermo < 2000) return;
  _ultimaPosizioneSchermo = ora;
  try {
    const d = audio && isFinite(audio.duration) ? audio.duration : 0;
    if (!d || d <= 0) return;
    const p = Math.max(0, Math.min(audio.currentTime || 0, d));
    navigator.mediaSession.setPositionState({
      duration: d,
      playbackRate: (audio.playbackRate || 1),
      position: p
    });
  } catch (e) { /* noop */ }
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const t = current();
    const cop = _copertinaPerSchermo(t);
    const meta = new MediaMetadata({
      title: t ? t.title : APP_NAME,
      artist: t ? (t.artist || APP_NAME) : APP_NAME,
      album: (t && t.album) ? t.album : APP_NAME,
      artwork: cop ? [{ src: cop, sizes: "512x512" }] : [{ src: "icon-512.png", sizes: "512x512", type: "image/png" }]
    });
    navigator.mediaSession.metadata = meta;
    _aggiornaPosizioneSchermo();
    const setHandler = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* noop */ }
    };
    setHandler("play", () => doPlay());
    setHandler("pause", () => { if (audio) audio.pause(); });
    setHandler("nexttrack", () => playNext());
    setHandler("previoustrack", () => playById(idBranoA(prevIndex())));
    setHandler("seekto", (d) => {
      if (d.seekTime != null && audio && isFinite(audio.duration)) {
        audio.currentTime = Math.max(0, Math.min(d.seekTime, audio.duration));
        updateProgressUI(audio.currentTime, audio.duration);
      }
    });
    setHandler("seekbackward", () => seekBy(-15));
    setHandler("seekforward", () => seekBy(15));
    setHandler("stop", () => { if (audio) audio.pause(); });
    setPlaybackState(audio && !audio.paused ? "playing" : "paused");
  }

  function totalDuration() {
    if (audio && isFinite(audio.duration) && audio.duration > 0) return audio.duration;
    try {
      if (audio && audio.seekable && audio.seekable.length) {
        return audio.seekable.end(audio.seekable.length - 1);
      }
    } catch (e) { /* noop */ }
    return 0;
  }

  function seekBy(delta) {
    if (!audio) return;
    const d = totalDuration();
    const attuale = audio.currentTime || 0;
    let t = attuale + delta;
    if (t < 0) t = 0;
    if (d && t > d) t = d;
    try {
      audio.currentTime = t;
    } catch (e) {
      return;
    }
    updateProgressUI(audio.currentTime, d);
    savePos();
  }

  async function exportTrack(t) {
    try {
      toast("Preparo il file...");
      let blob = null;
      if (t.builtin) {
        const res = await fetch(t.url);
        if (!res.ok) throw new Error("file non raggiungibile");
        blob = await res.blob();
      } else {
        const rec = await dbGet(t.id);
        if (rec && rec.blob) blob = rec.blob;
      }
      if (!blob) throw new Error("file non trovato");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (t.artist ? t.artist + " - " : "") + t.title.replace(/[\\/:*?"<>|]/g, "") + ".mp3";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 8000);
      toast("Salvalo e mettilo nella cartella musica mp3 " + profile.toLowerCase() + " sul computer: così lo vede chiunque usi quel nome");
    } catch (e) {
      toast("Esportazione non riuscita: " + e.message);
    }
  }

  const OTHER_PROFILE = "Emanuele";
  let switching = false;

  function updateProfileButton() {
    $("profInitial").textContent = (profile || "?").trim().charAt(0).toUpperCase();
    $("btnProfile").classList.add("on");
  }

  function profileList() {
    // il profilo aperto per primo, poi tutti gli altri
    const nomi = PROFILI.map((p) => p.nome);
    return [profile].concat(nomi.filter((n) => n !== profile));
  }

  function cartellaDi(nome) {
    const p = PROFILI.find((x) => x.nome === nome);
    return p ? p.cartella : "";
  }

  function renderProfiles() {
    const box = $("profileList");
    box.innerHTML = "";
    for (const name of profileList()) {
      const row = document.createElement("div");
      row.className = "prof-row" + (name === profile ? " active" : "");
      const ava = document.createElement("div");
      ava.className = "prof-ava";
      ava.textContent = name.charAt(0).toUpperCase();
      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.minWidth = "0";
      const nm = document.createElement("p");
      nm.className = "prof-name";
      nm.textContent = name;
      const sub = document.createElement("p");
      sub.className = "prof-sub";
      sub.textContent = name === profile ? "stai ascoltando come " + name : "tocca per ascoltare come " + name;
      info.appendChild(nm);
      info.appendChild(sub);
      row.appendChild(ava);
      row.appendChild(info);
      const use = document.createElement("button");
      use.className = "btn-mini" + (name === profile ? " go" : "");
      use.textContent = name === profile ? "Adesso" : "Vai";
      use.addEventListener("click", (e) => {
        e.stopPropagation();
        switchProfile(name);
      });
      row.appendChild(use);
      row.addEventListener("click", () => {
        if (name !== profile) switchProfile(name);
      });
      box.appendChild(row);
    }
    updateProfileButton();
  }

  async function switchProfile(name) {
    if (switching) return;
    if (name === profile) {
      closeProfile();
      return;
    }
    switching = true;
    try {
      saveCurrentState();
      profile = name;
      LS.set("mb.profile", name);
      updateProfileButton();
      if (audio) {
        try { audio.pause(); } catch (e) { /* noop */ }
      }
      currentId = null;
      const st = loadProfileState();
      await loadLocalLyrics();
      await loadAll();
  /* niente: la finestra dei nascosti e' stata tolta */
      setHud();
      const last = st.last ? tracks.find((t) => t.id === st.last) : null;
      if (last) {
        currentId = last.id;
        audio.src = last.url;
        // anche cambiando profilo il brano riparte dall'inizio
        const pos = 0;
        audio.addEventListener("loadedmetadata", () => {
          if (pos > 0 && isFinite(audio.duration)) {
            try { audio.currentTime = Math.min(pos, Math.max(0, audio.duration - 1)); } catch (e) { /* noop */ }
          }
        }, { once: true });
        setHud();
      }
      updateMediaSession();
      updateProfileButton();
      closeProfile();
      toast("Ora ascolti: " + name);
    } finally {
      switching = false;
    }
  }

  let confirmResolve = null;

  function syncNoScroll() {
    const open = !$("importPanel").hidden || !$("lyricsPanel").hidden ||
      !$("profilePanel").hidden || !$("confirmPanel").hidden || !$("offlinePanel").hidden ||
      !$("quickPanel").hidden || !$("queuePanel").hidden;
    document.body.classList.toggle("no-scroll", open);
  }

  function askConfirm(title, message, okLabel) {
    $("confirmTitle").textContent = title;
    $("confirmMsg").textContent = message;
    $("confirmYes").textContent = okLabel || "Elimina";
    $("confirmPanel").hidden = false;
    syncNoScroll();
    return new Promise((resolve) => { confirmResolve = resolve; });
  }

  function closeConfirm(result) {
    $("confirmPanel").hidden = true;
    const r = confirmResolve;
    confirmResolve = null;
    syncNoScroll();
    if (r) r(result);
  }

  $("confirmYes").addEventListener("click", () => closeConfirm(true));
  $("confirmNo").addEventListener("click", () => closeConfirm(false));
  $("confirmPanel").addEventListener("click", (e) => {
    if (e.target === $("confirmPanel")) closeConfirm(false);
  });

  function openProfile() {
    renderProfiles();
    $("profilePanel").hidden = false;
    syncNoScroll();
  }

  function closeProfile() {
    $("profilePanel").hidden = true;
    syncNoScroll();
  }

  /* ---------- Testi ---------- */
  function syncedToText(synced) {
    return String(synced || "")
      .replace(/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function parseSynced(synced) {
    const out = [];
    const re = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s*([^\n]*)/g;
    const s = String(synced || "");
    let m;
    while ((m = re.exec(s))) {
      const sec = Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number("0." + m[3]) : 0);
      out.push({ t: sec, text: m[4] });
    }
    return out;
  }

  function activeLineIndex(time) {
    let idx = -1;
    for (let i = 0; i < lyricLines.length; i++) {
      if (Number(lyricLines[i].dataset.t) <= time) idx = i;
      else break;
    }
    return idx;
  }

  function tickLyrics() {
    if ($("lyricsPanel").hidden || !lyricLines.length || !audio) return;
    const idx = activeLineIndex(audio.currentTime || 0);
    if (idx === lyricActive) return;
    if (lyricActive >= 0 && lyricLines[lyricActive]) lyricLines[lyricActive].classList.remove("on");
    if (idx >= 0) {
      lyricLines[idx].classList.add("on");
      if (Date.now() - lyricsUserScrollAt >= 4000) {
        try { lyricLines[idx].scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { /* noop */ }
      }
    }
    lyricActive = idx;
  }

  function openLyrics() {
    const l = currentLyrics();
    if (!l) return;
    $("lyricsTitle").textContent = l.title;
    $("lyricsSub").textContent = l.artist || "";
    const body = $("lyricsBody");
    body.innerHTML = "";
    lyricLines = [];
    lyricActive = -1;
    lyricsUserScrollAt = 0;
    const synced = parseSynced(l.synced);
    if (synced.length) {
      for (const line of synced) {
        const p = document.createElement("p");
        p.className = "lyr-line";
        p.textContent = line.text;
        p.dataset.t = String(line.t);
        body.appendChild(p);
        lyricLines.push(p);
      }
    } else {
      String(l.text || "").split("\n").forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        const trim = line.trim();
        if (/^\[.*\]$/.test(trim)) p.className = "lyr-sec";
        else if (!trim) p.className = "lyr-gap";
        body.appendChild(p);
      });
    }
    $("lyricsPanel").hidden = false;
    document.body.classList.add("no-scroll");
    tickLyrics();
  }

  function closeLyrics() {
    $("lyricsPanel").hidden = true;
    document.body.classList.remove("no-scroll");
  }

  /* ---------- Aggiunta / rimozione ---------- */
  async function addFiles(fileList) {
    let ok = 0;
    const errors = [];
    for (const file of Array.from(fileList)) {
      const rec = {
        id: "u-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        title: file.name.replace(/\.[^.]+$/, ""),
        artist: "",
        profile: profile,
        blob: file,
        size: file.size
      };
      try {
        await dbPut(rec);
        ok++;
      } catch (e) {
        errors.push(file.name);
      }
    }
    if (ok) {
      toast((ok === 1 ? "1 brano aggiunto" : ok + " brani aggiunti") + " — solo per " + profile);
      await loadAll();
      const fresh = tracks.filter((t) => !t.builtin).slice(-ok);
      for (const t of fresh) enrichTrack(t.id);
    }
    if (errors.length) toast("Errore con: " + errors.slice(0, 2).join(", "));
  }

/* Toglie dalla memoria del telefono tutto quello che riguarda un brano:
     il file audio, l'import, i testi, la copertina che avevo cercato, la
     coda. Serve dopo aver eliminato un brano, cosi' non resta niente. */
async function _dimenticaBranoOvunque(id) {
  const uri = "songs/track-" + String(id).replace(/^b-track-/, "") + ".mp3";
  try { await dbDel(id); } catch (e) { /* noop */ }
  try { await dbDelImport(id); } catch (e) { /* noop */ }
  try {
    const tx = db.transaction(DB_LYRICS, "readwrite");
    tx.objectStore(DB_LYRICS).delete(id);
  } catch (e) { /* noop */ }
  try {
    const tx = db.transaction(DB_COVERS, "readwrite");
    tx.objectStore(DB_COVERS).delete(id);
  } catch (e) { /* noop */ }
  delete localLyrics[id];
  const i = queue.indexOf(id);
  if (i >= 0) queue.splice(i, 1);
  /* e dalla copia che il telefono tiene per quando non c'e' rete */
  try {
    const chiavi = await caches.keys();
    for (const k of chiavi) {
      const c = await caches.open(k);
      await c.delete(new URL(uri, location.href).href);
      await c.delete(location.origin + "/" + uri);
      await c.delete(location.origin + "/music-box/" + uri);
    }
  } catch (e) { /* noop */ }
}

async function removeTrack(id) {
  const t = tracks.find((x) => x.id === id);
  if (!t) return;
  const cheCartella = cartellaDi(profile);
  /* Prima provo a farlo davvero sul computer: cancellare il file e
     toglierlo dal sito. Se il computer non e' raggiungibile non fingono
     niente: dico che il file resta e lascio decidere a te. */
  let fattoSulPc = false;
  let motivo = "";
  const collegato = await ponteOnline();
  if (collegato && cheCartella && t.url && /^songs\/track-\d+\.mp3$/.test(t.url)) {
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/elimina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: t.url, cartella: cheCartella, pubblica: true })
      });
      const j = await r.json().catch(() => ({}));
if (r.ok && j && j.ok) {
          fattoSulPc = true;
          /* Il computer puo' aver tolto il brano dal sito ma non quello
             nella cartella (se non ha trovato un file sicuramente identico).
             In quel caso l'utente deve saperlo, altrimenti crede che
             l'eliminazione sia a posto e il brano ricompare. */
          if (j.avviso) motivo = String(j.avviso);
        } else motivo = String((j && j.errore) || "non sono riuscito");
    } catch (e) {
      motivo = "il computer non ha risposto";
    }
  } else if (!collegato) {
    motivo = "il computer non e' raggiungibile";
  }

  if (!fattoSulPc) {
    const si = await askConfirm(
      "Non posso cancellare il file",
      "Il programma sul computer " + (motivo || "non e' raggiungibile") + ".\n\n" +
      "Posso togliere il brano dalla lista di questo telefono, ma il file mp3 resta sul computer " +
      "e il brano tornera' alla prossima apertura.\n\nVuoi toglierlo solo da qui?",
      "Togli da qui"
    );
    if (!si) return;
  } else {
    const si = await askConfirm(
      "Eliminare per sempre?",
      "\"" + (t.title || "") + "\" verra' cancellato:\n" +
      "- il file mp3 dal computer\n" +
      "- il brano dalla libreria di questo computer\n" +
      "- il brano dal sito, quindi sparisce anche dagli altri dispositivi\n\n" +
      "Non si puo' piu' recuperare. Il testo e la copertina spariscono con lui.",
      "Elimina per sempre"
    );
    if (!si) return;
  }

  if (currentId === id) {
    try { audio.pause(); } catch (e) { /* noop */ }
    closeLyrics();
    currentId = null;
    setHud();
  }
  await _dimenticaBranoOvunque(id);
  /* anche dai preferiti, dai nascosti e dalle statistiche */
  try {
    const st = profileState(profile);
    const patch = {};
    if (Array.isArray(st.favs)) patch.favs = st.favs.filter((x) => x !== id);
    if (Array.isArray(st.hidden)) patch.hidden = st.hidden.filter((x) => x !== id);
    try { favorites.delete(id); } catch (e) { /* noop */ }
    try { hiddenTracks.delete(id); } catch (e) { /* noop */ }
    writeProfileState(profile, patch);
    const st2 = statisticheProfilo();
    const c = _chiaveStats(t);
    if (c && st2[c]) {
      delete st2[c];
      _salvaStatistiche();
    }
  } catch (e) { /* noop */ }
  await loadAll();
  render();
toast(fattoSulPc ? "Brano eliminato per sempre" : "Brano tolto da questo telefono");
}

  function stripVariants(s) {
    return normText(s)
      .replace(/\b(live|remastered|remaster|explicit|version|edit|remix|cover|instrumental|acoustic|medley|karaoke|strumentale)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenOverlap(want, got) {
    const w = titleTokens(want);
    if (!w.length) {
      const nq = normKey(want);
      if (!nq) return 1;
      return normKey(got).indexOf(nq) >= 0 ? 1 : 0;
    }
    const g = new Set(titleTokens(got));
    if (!g.size) return 0;
    let hit = 0;
    for (const t of w) if (g.has(t)) hit++;
    return hit / w.length;
  }

  function titleCompatible(want, got) {
    const a = tokenOverlap(stripVariants(want), got);
    const b = tokenOverlap(stripVariants(got), want);
    return Math.max(a, b) >= 0.7;
  }

  async function findLyrics(artist, title) {
    const safeArtist = encodeURIComponent(artist || "Unknown");
    const safeTitle = encodeURIComponent(stripVariants(title));
    try {
      const r1 = await fetch("https://api.lyrics.ovh/v1/" + safeArtist + "/" + safeTitle);
      if (r1.ok) {
        const j = await r1.json();
        if (j && j.lyrics && j.lyrics.length > 120 &&
            (!j.title || titleCompatible(title, j.title))) {
          return { text: String(j.lyrics).replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim(), source: "lyrics.ovh" };
        }
      }
    } catch (e) { /* noop */ }
    try {
      const r2 = await fetch("https://lrclib.net/api/get?artist_name=" + safeArtist + "&track_name=" + safeTitle);
      if (r2.ok) {
        const j = await r2.json();
        const synced = j && j.syncedLyrics ? String(j.syncedLyrics) : "";
        const text = j && (j.plainLyrics || syncedToText(synced));
        if (text && text.length > 120 &&
            (!j.trackName || titleCompatible(title, j.trackName))) {
          return {
            text: text.replace(/\n{3,}/g, "\n\n").trim(),
            synced: synced,
            source: "LRCLIB" + (synced ? " (sincronizzato)" : "")
          };
        }
      }
    } catch (e) { /* noop */ }
    return null;
  }

  async function findCoverLocal(artist, title) {
    /* Prima guardo covers.json: e' il posto dove le copertine sono gia'
       controllate e funzionanti (per esempio quelle prese da Deezer).
       Prima chiedevo solo a iTunes, e cosi' quei brani restavano senza
       immagine perche' iTunes non aveva (o non restituiva) il disegno. */
    try {
      const gia = coverInfo(artist, title);
      if (gia && gia.cover) {
        return { cover: gia.cover, album: gia.album || "" };
      }
    } catch (e) { /* noop */ }
    const term = (artist ? artist + " " : "") + stripVariants(title);
    try {
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(term) + "&entity=song&limit=8", 12000);
      if (!r.ok) return null;
      const j = await r.json();
      for (const res of (j.results || [])) {
        if (!titleCompatible(title, res.trackName || "")) continue;
        if (artist && tokenOverlap(artist, res.artistName || "") < 0.5) continue;
        const url = (res.artworkUrl100 || "").replace("100x100", "600x600");
        if (url) return { cover: url, album: res.collectionName || "" };
      }
    } catch (e) { /* noop */ }
    return null;
  }

  async function enrichTrack(id) {
    if (!id) return;
    try {
      const rec = await dbGet(id);
      if (!rec || !rec.blob) return;
      const patch = {};
      let changed = false;
      if (!rec.cover) {
        const c = await findCoverLocal(rec.artist, rec.title);
        if (c) {
          patch.album = c.album || rec.album || "";
          patch.coverUrl = c.cover;
          try {
            const ir = await fetch(c.cover);
            if (ir.ok) patch.cover = await ir.blob();
          } catch (e) {
            patch.cover = null;
          }
          changed = true;
        }
      }
      if (changed) await dbPut(Object.assign({}, rec, patch));
      if (!localLyrics[rec.id]) {
        const l = await findLyrics(rec.artist, rec.title);
        if (l) {
          localLyrics[rec.id] = { title: rec.title, artist: rec.artist || "", text: l.text, synced: l.synced || "", source: l.source };
          await dbPutLyrics({ id: rec.id, title: rec.title, artist: rec.artist || "", text: l.text, synced: l.synced || "", source: l.source });
        }
      }
      await loadAll();
      if (currentId === rec.id) setHud();
    } catch (e) {
      console.warn("Completamento automatico fallito", e);
    }
  }

  /* ---------- Importazione: OCR + metadati + download ---------- */
  const IMPORT_LIMIT = 60;
  const MAX_DOWNLOAD = 40 * 1024 * 1024;
  const IA_SEARCH = "https://archive.org/advancedsearch.php";
  const IA_META = "https://archive.org/metadata/";
  const IA_THUMB = "https://archive.org/services/img/";
  const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
  const OCR_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  let ocrWorker = null;
  let importList = [];
  let importActive = null;
  let libKeys = new Set();

  function normKey(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\((live|remaster(ed)?|explicit|bonus track)[^)]*\)/g, " ")
      .replace(/\[(live|remaster(ed)?|explicit)[^\]]*\]/g, " ")
      .replace(/[^a-z0-9]+/g, "");
  }

  function trackKeys(t) {
    const keys = new Set();
    const a = normKey(t.artist);
    let ti = normKey(t.title);
    if (ti) keys.add(ti);
    if (a && ti.startsWith(a) && ti.length > a.length) {
      ti = ti.slice(a.length);
      keys.add(ti);
    }
    if (a && ti) keys.add(a + ti);
    return keys;
  }

  function libraryKeys() {
    const keys = new Set();
    for (const t of tracks) for (const k of trackKeys(t)) keys.add(k);
    return keys;
  }

  const NOISE_PATTERNS = [
    /\(?\b\d{1,2}[:.]\d{2}\b\)?/g,
    /\b\d{1,4}\s?(kb|mb|gb|kbps|mbps)\b/gi,
    /\b(19|20)\d{2}\b/g,
    /\b(official|video|audio|visual|visualizer|lyrics?|lyric video|mv|hd|hq|4k|remastered|remaster|explicit|full album|prod|produced|stereo)\b/gi,
    /\b(play|ascolta|riproduci|scarica|download|condividi|share|aggiungi|add|like|cuore|piu opzioni|more options|ordina per|sort by|qualita|offline|preferito|playlist|album|artista|artist|brani|tracks|canzoni|libreria|ora in riproduzione|shuffle|repeat)\b/gi
  ];

  const CREDITS = [
    /\([^)]*\b(prod|produced|by|con|feat|ft|featuring)\b[^)]*\)/gi,
    /\[[^\]]*\b(prod|produced|by|con|feat|ft|featuring)\b[^\]]*\]/gi,
    /\s+(ft|feat|featuring)\.?\s+[^-|]+$/i
  ];

  const STOPWORDS = /^(la|le|il|lo|i|gli|del|della|delle|di|da|a|al|alla|alle|con|per|tra|e|che|mia|mio|tua|tuo|suo|sua|mia|libreria|playlist|brani|canzoni|album|musica|ascolta|riproduci|ascolto|ascoltando|coda|queue|tutto|tutti|ora|in|ora in riproduzione|piu|opzioni|scarica|condividi|aggiungi|preferito|offline|qualita|random|shuffle|repeat|1|2|3|4|5|6|7|8|9|10)$/i;

  function cleanLine(raw) {
    let line = String(raw || "")
      .replace(/[\u2018\u2019\u201B]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014\u2212]/g, "-")
      .replace(/[\u00A0\u2007\u202F]/g, " ")
      .replace(/[^\p{L}\p{N}\s\-:,'&!?().]/gu, " ")
      .trim();
    for (const re of CREDITS) line = line.replace(re, " ");
    for (const re of NOISE_PATTERNS) line = line.replace(re, " ");
    for (let i = 0; i < 4; i++) {
      const before = line;
      line = line.replace(/^\d{1,3}\s*[.)\]:-]\s*/, "");
      line = line.replace(/^(play|ascolta|riproduci|scarica|download|condividi|share|aggiungi|add|like|cuore)\b\s*/i, "");
      line = line.trim();
      if (line === before) break;
    }
    line = line.replace(/\(\s*\)|\[\s*\]|\s+[.,;]\s*$/g, " ");
    line = line.replace(/[ \t]{2,}/g, (m) => (m.length > 2 ? "  " : m));
    line = line.replace(/^[\s\-:,.'&]+/, "").replace(/[\s\-:,.'&]+$/, "");
    const words = line.split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const useful = words.filter((w) => !STOPWORDS.test(w));
    if (!useful.length) return "";
    const letters = (line.match(/\p{L}/gu) || []).length;
    if (letters < 3) return "";
    if (/^\d+$/.test(line)) return "";
    if (line.length > 120) return "";
    return line;
  }

  /* Scrive solo il nome di un artista (es. "nayt") e vuoi tutte le sue
     canzoni: funziona se la riga e' una parola sola, oppure se e' un
     artista che gia' conosciamo (in libreria o nelle copertine). */
  const KNOWN_ARTISTS = new Set();

  function collectKnownArtists() {
    KNOWN_ARTISTS.clear();
    for (const t of tracks) if (t.artist) KNOWN_ARTISTS.add(t.artist);
    for (const k of Object.keys(coversData || {})) {
      const c = coversData[k];
      if (c && c.artist) KNOWN_ARTISTS.add(c.artist);
    }
  }

  function looksLikeArtist(line) {
    const t = String(line || "").trim();
    if (!t) return false;
    if (!/\s/.test(t)) return true;
    const k = normKey(t);
    if (!k) return false;
    for (const a of KNOWN_ARTISTS) if (normKey(a) === k) return true;
    return false;
  }

  /* Un artista con lo spazio (es. "Post Malone", "Tyler, The Creator") non e'
     ancora in libreria non viene riconosciuto, perche' la riga sembra un titolo.
     Qui si chiede a iTunes se quella frase e' un artista.
     Attenzione pero': certi titoli sono anche nomi di artisti ("Blinding Lights",
     "Mamma Mia"), quindi se la frase e' anche un brano la lasciamo com'e' e non
     la trasformiamo in "tutte le canzoni dell'artista".
     Con "artista: nome" invece si forza la scelta. */
  async function iTunesQuestoEArtista(nome) {
    const grezzo = String(nome || "").trim();
    const forzato = /^artista\s*:/i.test(grezzo);
    const t = grezzo.replace(/^artista\s*:\s*/i, "");
    if (!t) return "";
    const parole = t.split(/\s+/).filter(Boolean);
    if (parole.length > 5) return "";
    if (!forzato && parole.length < 2) return "";
    const mio = normKey(t);
    if (!mio) return "";
    try {
      // Se l'utente ha scritto "artista:" usa la ricerca artisti dedicata,
      // che e' precisa. Altrimenti cerco fra i brani: cosi' con una sola
      // richiesta vedo sia il nome dell'artista sia il titolo del brano.
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(t) +
        (forzato ? "&entity=musicArtist&limit=8" : "&entity=song&limit=30") + "&country=IT", 12000);
      if (!r.ok) return "";
      const d = await r.json();
      const risultati = (d && d.results) || [];
      // 1) e' anche un brano? allora non tocchiamo niente (salvo "artista:")
      //    ATTENZIONE: se quel titolo lo hanno pochi artisti, e' quasi certamente
      //    una coincidenza: per "kid yugi" esiste un solo brano omonimo di un
      //    artista sconosciuto, ma "Kid Yugi" e' un nome d'arte. Se invece il
      //    titolo e' in mano a molti (Blinding Lights, Mamma Mia...) allora
      //    e' davvero un brano e lo lasciamo brano.
      if (!forzato) {
        const omonimi = risultati.filter((s) => s && s.trackName && normKey(s.trackName) === mio);
        const artistiDiversi = new Set(omonimi.map((s) => String(s.artistName || "")));
        if (omonimi.length >= 4 && artistiDiversi.size >= 3) return "";
      }
      // 2) e' un artista esatto
      for (const s of risultati) {
        if (s && s.artistName && normKey(s.artistName) === mio) return String(s.artistName);
      }
      // 3) nome molto simile (typo, accenti, virgole)
      let migliore = "", punteggio = 0;
      for (const s of risultati) {
        if (!s || !s.artistName) continue;
        const p = titleMatch(mio, normKey(s.artistName)).score;
        if (p > punteggio) { punteggio = p; migliore = String(s.artistName); }
      }
      if (punteggio >= 88) return migliore;
      // 4) Ultimo tentativo: chiedo l'elenco degli artisti.
      //    Nei risultati dei brani il nome e' spesso "Kid Yugi, Night Skinny &
      //    Artie 5ive", quindi non coincide mai e senza questo passaggio un
      //    artista come "kid yugi" finiva trattato come titolo di un brano.
      if (!forzato) {
        try {
          const r2 = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(t) +
            "&entity=musicArtist&limit=8&country=IT", 12000);
          if (r2.ok) {
            const d2 = await r2.json();
            const artisti = (d2 && d2.results) || [];
            for (const a of artisti) {
              if (a && a.artistName && normKey(a.artistName) === mio) return String(a.artistName);
            }
            let m2 = "", p2 = 0;
            for (const a of artisti) {
              if (!a || !a.artistName) continue;
              const p = titleMatch(mio, normKey(a.artistName)).score;
              if (p > p2) { p2 = p; m2 = String(a.artistName); }
            }
            if (p2 >= 90) return m2;
          }
        } catch (e) { /* noop */ }
      }
      return "";
    } catch (e) { return ""; }
  }

  /* Scrive anche "artista e nome" senza trattino (es. "nayt tropico"):
     se la riga parte con un artista che gia' conosciamo, tutto quello
     che viene dopo e' il brano. Provo l'artista piu' lungo per primo,
     cosi' "the beatles yesterday" non diventa "the" + "beatles yesterday". */
  function splitKnownArtist(line) {
    const t = String(line || "").trim();
    if (!t) return null;
    const low = t.toLowerCase();
    const nomi = [];
    for (const a of KNOWN_ARTISTS) {
      const s = String(a || "").trim();
      if (s) nomi.push(s);
    }
    nomi.sort((a, b) => b.length - a.length);
    for (const a of nomi) {
      const al = a.toLowerCase();
      if (t.length <= a.length || !low.startsWith(al)) continue;
      const dopo = t.slice(a.length).replace(/^[\s\-:,|]+/, "").trim();
      if (dopo) return { artist: a, title: dopo };
    }
    /* Caso inverso: il nome dell'artista arriva in fondo ("tropico nayt"). */
    for (const a of nomi) {
      const al = a.toLowerCase();
      if (t.length <= a.length + 1) continue;
      if (!low.endsWith(al)) continue;
      const prima = t.slice(0, t.length - a.length).replace(/[\s\-:,|]+$/, "").trim();
      if (prima) return { artist: a, title: prima };
    }
    return null;
  }

  function parseImportText(text) {
    const out = [];
    const seen = new Set();
    const lines = String(text || "").split(/\r?\n/);
    for (const raw of lines) {
      const line = cleanLine(raw);
      if (!line || line.length < 2) continue;
      let artist = "";
      let title = line;
      let artistOnly = false;
      const m = /^(.+?)\s+-\s+(.+)$/.exec(line);
      if (m) {
        artist = m[1].trim();
        title = m[2].trim();
      } else {
        const m2 = /^(.+?)\s{2,}(.+)$/.exec(line);
        if (m2) {
          artist = m2[1].trim();
          title = m2[2].trim();
        } else {
          const m3 = splitKnownArtist(line);
          if (m3) {
            artist = m3.artist;
            title = m3.title;
          } else if (looksLikeArtist(line)) {
            artistOnly = true;
          }
        }
      }
      title = title.replace(/\s+/g, " ").trim();
      artist = artist.replace(/\s+/g, " ").trim();
      if (!title) continue;
      const key = normKey(artist + title);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ artist, title, artistOnly });
      if (out.length >= IMPORT_LIMIT) break;
    }
    return out;
  }

  function ocrLabel(status) {
    const map = {
      "loading tesseract core": "Carico il motore OCR",
      "initializing tesseract": "Preparo il motore OCR",
      "loading language traineddata": "Scarico la lingua italiana",
      "initializing api": "Preparo il riconoscimento",
      "recognizing text": "Leggo lo screenshot"
    };
    return map[status] || status;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("OCR non scaricabile, serve la connessione"));
      document.head.appendChild(s);
    });
  }

  async function loadImage(file) {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("immagine non leggibile"));
        img.src = url;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function preprocessImage(file) {
    const img = await loadImage(file);
    const scale = Math.min(3, Math.max(1, 1800 / Math.max(1, img.width)));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    let data;
    try {
      data = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      return file;
    }
    const px = data.data;
    let min = 255;
    let max = 0;
    const gray = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
      gray[p] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const range = Math.max(1, max - min);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const v = ((gray[p] - min) * 255 / range) | 0;
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
      px[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/png"));
  }

  async function getOcrWorker(onProgress) {
    if (ocrWorker) return ocrWorker;
    if (!window.Tesseract) await loadScript(OCR_SRC);
    ocrWorker = await window.Tesseract.createWorker(["ita", "eng"], 1, {
      logger: (m) => {
        if (m && m.status && typeof m.progress === "number") onProgress(ocrLabel(m.status), m.progress);
      }
    });
    try {
      await ocrWorker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    } catch (e) { /* noop */ }
    return ocrWorker;
  }

  async function runOcr(file, onProgress) {
    const worker = await getOcrWorker(onProgress);
    const res = await worker.recognize(file);
    return (res && res.data && res.data.text) || "";
  }

  function archiveUrl(identifier, name) {
    return "https://archive.org/download/" + encodeURIComponent(identifier) + "/" +
      encodeURIComponent(name).replace(/%2F/g, "/");
  }

  function pickAudioFile(files) {
    const audio = (files || []).filter((f) => {
      const n = (f.name || "").toLowerCase();
      return /\.(mp3|m4a|aac|mp4)$/.test(n) && f.size && Number(f.size) < MAX_DOWNLOAD;
    });
    audio.sort((a, b) => Number(a.size) - Number(b.size));
    return audio[0] || null;
  }

  function normText(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\((live|remaster(ed)?|explicit|bonus track)[^)]*\)/g, " ")
      .replace(/\[(live|remaster(ed)?|explicit)[^\]]*\]/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function titleTokens(s) {
    return normText(s).split(" ").filter((t) => t.length >= 3);
  }

  function titleMatch(query, candidate) {
    const qt = titleTokens(query);
    if (!qt.length) {
      const q = normKey(query);
      const c = normKey(candidate);
      if (q && c && (c === q || c.includes(q))) return { score: 70, strong: true };
      return { score: 0, strong: false };
    }
    const ct = new Set(titleTokens(candidate));
    if (!ct.size) return { score: 0, strong: false };
    let hit = 0;
    for (const t of qt) if (ct.has(t)) hit++;
    const frac = hit / qt.length;
    const extra = ct.size - hit;
    if (frac === 1 && extra <= 1) return { score: 90, strong: true };
    if (frac === 1) return { score: 75, strong: true };
    if (frac >= 0.85 && extra <= 2) return { score: 60, strong: true };
    if (frac >= 0.6) return { score: 35, strong: false };
    return { score: 0, strong: false };
  }

  const VARIANT_WORDS = /(live|remix|remaster|cover|karaoke|medley|instrumental|acoustic|version|edit|mix|strumentale|dj|rework)/;

  function artistMatch(want, got) {
    const w = titleTokens(want);
    if (!w.length) return true;
    if (!got) return false;
    const g = new Set(titleTokens(got));
    if (!g.size) return false;
    let hit = 0;
    for (const t of w) if (g.has(t)) hit++;
    return hit / w.length >= 0.6;
  }

  function hasVariantWords(s) {
    const raw = (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return VARIANT_WORDS.test(raw);
  }

  function candidateScore(item, candTitle, candArtist) {
    const m = titleMatch(item.title, candTitle);
    if (m.score <= 0) return { score: 0, strong: false };
    let score = m.score;
    let strong = m.strong;
    if (item.artist) {
      if (artistMatch(item.artist, candArtist)) score += 10;
      else {
        score = Math.max(1, score - 45);
        strong = false;
      }
    } else {
      if (m.score < 90) strong = false;
    }
    if (hasVariantWords(candTitle) && !hasVariantWords(item.title)) {
      score = Math.max(1, score - 15);
      strong = false;
    }
    return { score, strong };
  }

  /* Una richiesta che non risponde non deve bloccare la ricerca: senza questo
     un solo sito lento lasciava tutti i brani successivi fermi su "cerco...".
     Dopo i secondi indicati mollo tutto e vado avanti col brano seguente. */
  function conScadenza(promessa, ms, messaggio) {
    return new Promise((ok, ko) => {
      const t = setTimeout(() => ko(new Error(messaggio || "troppo lento")), ms);
      if (promessa && typeof promessa.then === "function") {
        promessa.then(
          (v) => { clearTimeout(t); ok(v); },
          (e) => { clearTimeout(t); ko(e); }
        );
      } else {
        clearTimeout(t);
        ok(promessa);
      }
    });
  }

  // fetch con tempo massimo: se il sito non risponde, siamo salvi
  function fetchConScadenza(url, ms, opzioni) {
    const ctl = new AbortController();
    const scad = setTimeout(() => ctl.abort(), ms || 12000);
    const fatto = fetch(url, Object.assign({}, opzioni || {}, { signal: ctl.signal }));
    return conScadenza(fatto, (ms || 12000) + 1500, "richiesta scaduta")
      .finally(() => clearTimeout(scad));
  }

  async function iaQuery(query, rows) {
    const url = IA_SEARCH + "?q=" + encodeURIComponent(query) +
      "&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=licenseurl" +
      "&rows=" + (rows || 12) + "&page=1&output=json";
    const res = await fetchConScadenza(url, 12000);
    if (!res.ok) throw new Error("archive non raggiungibile");
    const json = await res.json();
    return (json.response && json.response.docs) || [];
  }

  function iaSearchPhrase(title) {
    const core = normText(title)
      .replace(/\b(live|remastered|remaster|explicit|version|edit|remix|cover|instrumental|acoustic|medley|karaoke|strumentale)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return core || normText(title);
  }

  async function searchArchive(item) {
    const phrase = iaSearchPhrase(item.title);
    let docs = [];
    try {
      docs = await iaQuery('title:("' + phrase + '") AND mediatype:(audio)');
    } catch (e) { /* noop */ }
    if (!docs.length) {
      try {
        docs = await iaQuery('"' + phrase + '" AND mediatype:(audio)');
      } catch (e) { /* noop */ }
    }
    if (!docs.length) return [];

    const out = [];
    for (const doc of docs.slice(0, 5)) {
      if (!doc.identifier) continue;
      let meta;
      try {
        const mres = await fetch(IA_META + encodeURIComponent(doc.identifier));
        if (!mres.ok) continue;
        meta = await mres.json();
      } catch (e) {
        continue;
      }
      const docArtist = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;
      const files = (meta.files || []).filter((f) => {
        return /\.(mp3|m4a|aac|mp4)$/i.test(f.name || "") && f.size && Number(f.size) < MAX_DOWNLOAD;
      });
      for (const f of files) {
        const candTitle = (f.title || String(f.name).replace(/\.[^.]+$/, "")).toString().slice(0, 120);
        const candArtist = (f.artist || docArtist || "").toString().slice(0, 80);
        const c = candidateScore(item, candTitle, candArtist);
        if (c.score <= 0) continue;
        let score = c.score;
        let strong = c.strong;
        if (hasVariantWords(String(f.name) + " " + (doc.title || "")) && !hasVariantWords(item.title)) {
          score = Math.max(1, score - 15);
          strong = false;
        }
        out.push({
          score,
          strong,
          title: candTitle,
          artist: candArtist,
          album: (doc.title || "").toString().slice(0, 80),
          license: doc.licenseurl ? doc.licenseurl.toString().slice(0, 80) : "vedi fonte",
          source: "Internet Archive",
          url: archiveUrl(doc.identifier, f.name),
          cover: IA_THUMB + encodeURIComponent(doc.identifier)
        });
      }
      out.sort((a, b) => b.score - a.score);
      if (out.length > 12) out.length = 12;
      if (out.length && out[0].score >= 100 && out[0].strong) break;
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 3);
  }

  async function searchCommons(item) {
    const term = item.title + (item.artist ? " " + item.artist : "");
    const url = COMMONS_API + "?action=query&format=json&generator=search&gsrsearch=" +
      encodeURIComponent(term + " filetype:audio") +
      "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url%7Cextmetadata&iiextmetadatafilter=LicenseShortName";
  const res = await fetchConScadenza(url, 12000);
  if (!res.ok) throw new Error("wikimedia non raggiungibile");
    const json = await res.json();
    const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
    const out = [];
    for (const p of pages) {
      const info = (p.imageinfo || [])[0];
      if (!info || !info.url) continue;
      if (!/\.(mp3|m4a|aac|mp4)$/i.test(info.url)) continue;
      const name = String(p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "");
      const c = candidateScore(item, name, "");
      if (c.score <= 0) continue;
      const lic = info.extmetadata && info.extmetadata.LicenseShortName ? info.extmetadata.LicenseShortName.value : "Wikimedia Commons";
      out.push({
        score: Math.max(1, c.score - 5),
        strong: c.strong,
        title: name.slice(0, 120),
        artist: item.artist || "",
        album: "",
        license: String(lic).slice(0, 80),
        source: "Wikimedia Commons",
        url: String(info.url).split("?")[0],
        cover: ""
      });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 3);
  }

  /* Scrivevo solo "nayt": invece di un brano, cerco TUTTE le canzoni
     di quell'artista. L'elenco esce dal catalogo pubblico di iTunes,
     poi ogni canzone la cerco anche dove si scarica per davvero. */
  // Prima fermava a 20 brani per artista, e con artisti grandi (Nayt ne ha
  // 69 su iTunes) ne mostrava pochissimi. Ora tiene il passo con la lista.
  const ARTIST_TRACK_LIMIT = 60;

  function itunesArtwork(url) {
    return String(url || "").replace("100x100", "600x600");
  }

  /* Nell'elenco di un artista voglio i pezzi suoi, non le compilation dove
     c'e' solo come feat: quindi l'artista deve essere il nome principale. */
  function artistaCatalogo(want, got) {
    if (!artistMatch(want, got)) return false;
    const w = normKey(want);
    const g = normKey(got);
    if (!w || !g) return false;
    return g.startsWith(w) && g.length <= w.length + 22;
  }

  /* L'id dell'artista su iTunes: serve per aprirne il catalogo completo. */
  async function itunesArtistId(name) {
    const mio = normKey(name);
    if (!mio) return 0;
    try {
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(name) +
        "&entity=musicArtist&limit=8&country=IT", 12000);
      if (!r.ok) return 0;
      const d = await r.json();
      for (const a of ((d && d.results) || [])) {
        if (a && a.artistId && normKey(a.artistName) === mio) return a.artistId;
      }
    } catch (e) { /* noop */ }
    return 0;
  }

  async function itunesArtistTracks(name) {
    const out = [];
    const vistati = new Set();
    const aggiungi = (s) => {
      if (out.length >= ARTIST_TRACK_LIMIT) return;
      if (!s || !s.trackName || !s.artistName) return;
      if (!artistaCatalogo(name, s.artistName)) return;
      const key = normKey(s.artistName + " " + s.trackName);
      if (vistati.has(key)) return;
      vistati.add(key);
      out.push({
        artist: s.artistName,
        title: s.trackName,
        album: s.collectionName || "",
        cover: itunesArtwork(s.artworkUrl100),
        secs: Math.round((s.trackTimeMillis || 0) / 1000),
        preview: s.previewUrl || ""
      });
    };
    // 1) ricerca normale, che trova subito i pezzi piu' noti
    for (const term of [name, name + " canzoni"]) {
      let data = null;
      try {
        const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(term) +
          "&entity=song&limit=200&country=IT", 12000);
        if (!r.ok) continue;
        data = await r.json();
      } catch (e) {
        continue;
      }
      for (const s of (data.results || [])) aggiungi(s);
      if (out.length >= 3) break;
    }
    // 2) catalogo dell'artista: la ricerca normale ne trova solo una parte.
    //    Per "kid yugi" dava 5 brani, cosi' invece arrivano tutti.
    if (out.length < ARTIST_TRACK_LIMIT) {
      const id = await itunesArtistId(name);
      if (id) {
        try {
          const r = await fetchConScadenza("https://itunes.apple.com/lookup?id=" + id +
            "&entity=song&limit=200&country=IT", 15000);
          if (r.ok) {
            const d = await r.json();
            for (const s of ((d && d.results) || [])) aggiungi(s);
          }
        } catch (e) { /* noop */ }
      }
    }
    return out;
  }

  /* Riga scritta senza artista ("ayl popolare"): se non so di chi si tratta,
     chiedo a iTunes chi e' l'artista e qual e' il titolo esatto. Cosi' la ricerca
     del download parte con una scia giusta invece di indovinare. */
  async function itunesGuess(testo) {
    if (!testo) return null;
    let data = null;
    try {
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(testo) +
        "&entity=song&limit=25&country=IT", 12000);
      if (!r.ok) return null;
      data = await r.json();
    } catch (e) {
      return null;
    }
    let best = null;
    for (const s of (data.results || [])) {
      if (!s || !s.trackName) continue;
      const m = titleMatch(testo, s.trackName);
      if (m.score < 70) continue;
      const score = m.score + (artistMatch(testo, s.artistName) ? 8 : 0);
      if (best && score <= best.score) continue;
      best = {
        score: score,
        artist: s.artistName || "",
        title: s.trackName,
        album: s.collectionName || "",
        cover: itunesArtwork(s.artworkUrl100),
        secs: Math.round((s.trackTimeMillis || 0) / 1000),
        preview: s.previewUrl || ""
      };
    }
    return best;
  }

  function previewCandidate(s) {
    return {
      score: 20,
      strong: false,
      title: s.title,
      artist: s.artist,
      album: s.album,
      license: "solo 30 secondi",
      source: "anteprima 30s",
      url: s.preview,
      cover: s.cover
    };
  }

  // ---- Ascoltare PRIMA di importare ------------------------------------
  // Un solo player per tutta la schermata: se ne avvii un altro, il primo si ferma.
  let anteprimaAudio = null, anteprimaBtn = null;
  function fermaAnteprima() {
    if (anteprimaAudio) {
      try { anteprimaAudio.pause(); } catch (e) {}
      anteprimaAudio.src = "";
      anteprimaAudio = null;
    }
    if (anteprimaBtn) {
      anteprimaBtn.textContent = anteprimaBtn.dataset.label || "Ascolta";
      anteprimaBtn.classList.remove("btn-mini-on");
      anteprimaBtn = null;
    }
  }
  // cand: il risultato della ricerca. Se ha l'anteprima di 30s si sente quella,
  // altrimenti si sente il brano vero. Il bottone dice sempre di cosa si tratta.
  function bottoneAnteprima(cand, testo) {
    const solo30 = !!(cand && cand.license === "solo 30 secondi");
    const src = (cand && (cand.preview || cand.url)) || "";
    const etichetta = testo || (solo30 ? "Anteprima 30s" : (cand && cand.url ? "Ascolta" : ""));
    return { etichetta: etichetta, solo30: solo30, src: src, cand: cand };
  }
  function ascoltaPrima(b, fn) {
    if (!b || !b.src) return;
    if (anteprimaAudio && anteprimaAudio.src === b.src && !anteprimaAudio.paused) { fermaAnteprima(); return; }
    fermaAnteprima();
    try {
      anteprimaAudio = new Audio();
      anteprimaAudio.preload = "none";
      anteprimaAudio.src = b.src;
      anteprimaAudio.addEventListener("ended", fermaAnteprima);
      anteprimaAudio.addEventListener("error", () => {
        fermaAnteprima();
        if (fn) fn(new Error("non e' stato possibile suonare l'anteprima"));
      });
      anteprimaBtn = b.el;
      b.el.dataset.label = b.etichetta;
      b.el.textContent = "Ferma";
      b.el.classList.add("btn-mini-on");
      anteprimaAudio.play();
      if (fn) fn(null);
    } catch (e) {
      fermaAnteprima();
      if (fn) fn(e);
    }
  }
  // Dice SEMPRE perche' un brano e' solo 30 secondi: cosi' non si crede
  // di poter ascoltarlo tutto prima di importarlo.
  function notaAnteprima(cand) {
    if (cand && cand.license === "solo 30 secondi") {
      return "Solo 30 secondi di anteprima: il brano completo non e' liberamente scaricabile.";
    }
    return "";
  }

  /* Link esterni (aperti in una scheda nuova, senza dare il link alla pagina).
     linkEsterno fa il bottone, poi ne faccio due: la ricerca su YouTube per
     sentire il brano, e il convertitore che mi ha chiesto Stefano. */
  const LINK_CONVERTITORE = "https://notube.link/it/youtube-app-429";

  function linkEsterno(testo, href, titolo, classe) {
    const a = document.createElement("a");
    a.className = "btn-mini" + (classe ? " " + classe : "");
    a.textContent = testo;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = titolo || "";
    return a;
  }

  /* Copia negli appunti. Su https e su 127.0.0.1 funziona l'API moderna;
     su una pagina http normale (per esempio il telefono aperto con
     l'indirizzo della rete) il browser la blocca, e uso il metodo vecchio. */
  async function copiaNegliAppunti(testo) {
    const t = String(testo || "");
    if (!t) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(t);
        return true;
      }
    } catch (e) { /* provo con il metodo vecchio */ }
    try {
      const area = document.createElement("textarea");
      area.value = t;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, t.length);
      const ok = document.execCommand("copy");
      area.remove();
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  /* Quando del brano c'e' solo l'anteprima di 30 secondi, offro la strada per
     ascoltarlo intero: cerco la canzone su YouTube. Uso la pagina di ricerca
     e non un link a caso, perche' cosi' porta sempre alla canzone giusta
     anche se l'artista ha un nome con lo spazio o dei caratteri strani.
     Premendo copio anche il link negli appunti, cosi' non serve ricordarselo. */
  // Chiede al programma sul PC di trovare il video ORIGINALE del brano.
  // Non serve nessuna chiave: usa lo stesso motore che scarica l'mp3.
  /* Se una richiesta al programma del PC fallisce, vuol dire che il PC e'
     spento o l'indirizzo non va piu': lo dimentico, cosi' alla prossima
     ricerca lo cerco di nuovo invece di insistere su un indirizzo morto. */
  function dimenticaPonte() {
    ponteCheRisponde = "";
    ponteCache = null;
  }

  async function cercaVideoEsatto(artista, titolo, secondi) {
    try {
      const ctl = new AbortController();
      const scad = setTimeout(() => ctl.abort(), 20000);
      const q = "?artista=" + encodeURIComponent(artista || "") +
        "&titolo=" + encodeURIComponent(titolo || "") +
        "&sec=" + encodeURIComponent(String(Math.round(secondi || 0) || 0));
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/cerca" + q, { cache: "no-store", signal: ctl.signal });
      clearTimeout(scad);
      if (!r.ok) return "";
      const j = await r.json();
      return (j && j.trovato && j.video && j.video.url) ? String(j.video.url) : "";
    } catch (e) {
      dimenticaPonte();
      return "";
    }
  }

  /* Tasto YouTube. Premendolo:
     1) se il PC e' collegato cerca il video ORIGINALE del brano, lo copia
        negli appunti e lo apre;
     2) se il brano non si trova, o se non c'e' il PC, apre la ricerca con
        artista e titolo, cosi' la trovi comunque.
     Il link di ricerca resta negli appunti in ogni caso. */
  function linkYouTube(artista, titolo, secondi) {
    const q = [artista, titolo].map((s) => String(s || "").trim()).filter(Boolean).join(" ");
    if (!q) return null;
    const ricerca = "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
    const a = linkEsterno("yt", ricerca,
      "Cerca il video originale su YouTube e copia il link negli appunti", "btn-yt");
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      segnalaErrore("yt premuto: " + q.slice(0, 60));
      // Apro subito una scheda (durante il clic, altrimenti il browser la
      // blocca) ma con un avviso dentro: se lascio about:blank sembra rotto,
      // e se apro direttamente la ricerca di YouTube sembra che non abbia
      // trovato niente. La ricerca del video esatto puo' mettere 10 secondi.
      let scheda = null;
      try { scheda = window.open("about:blank", "_blank"); } catch (e) { scheda = null; }
      if (!scheda) {
        segnalaErrore("yt: il browser ha bloccato la nuova scheda");
        copiaNegliAppunti(ricerca);
        toast("Il browser ha bloccato la nuova scheda: link di ricerca copiato negli appunti");
        return;
      }
      try {
        scheda.document.open();
        scheda.document.write(
          "<!doctype html><html><head><meta charset='utf-8'><title>Cerco il video</title></head>" +
          "<body style='background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif;" +
          "display:flex;height:100vh;align-items:center;justify-content:center;text-align:center'>" +
          "<div><div style='font-size:34px'>&#127916;</div>" +
          "<p style='font-size:18px'>Sto cercando il video originale di</p>" +
          "<p style='font-size:22px;font-weight:700'>" + String(q).replace(/[<>&]/g, " ") + "</p>" +
          "<p style='color:#8b949e;font-size:15px'>Ci metto qualche secondo. Non chiudere questa scheda.</p></div>" +
          "</body></html>");
        scheda.document.close();
      } catch (e) { /* la scheda non si lascia scrivere: pazienza */ }
      const testoVecchio = a.textContent;
      a.textContent = "...";
      cercaVideoEsatto(artista, titolo, secondi).then((esatto) => {
        if (a.isConnected) a.textContent = testoVecchio;
        if (!esatto) {
          // niente video esatto: allora si va alla ricerca, che almeno la
          // vedi e la cerchi tu
          try { scheda.location.replace(ricerca); } catch (e) {
            try { scheda.location.href = ricerca; } catch (e2) { /* noop */ }
          }
          copiaNegliAppunti(ricerca);
          toast("Non ho trovato il video esatto: ti ho aperto la ricerca");
          segnalaErrore("video esatto non trovato per: " + q.slice(0, 60));
          return;
        }
        try { scheda.location.replace(esatto); } catch (e) {
          try { scheda.location.href = esatto; } catch (e2) { /* noop */ }
        }
        segnalaErrore("video esatto: " + esatto);
        copiaNegliAppunti(esatto).then((ok) => {
          toast(ok ? "Video originale trovato e link copiato negli appunti"
            : "Video originale trovato, ma non sono riuscito a copiare il link");
        });
      });
    });
    return a;
  }

  // Il convertitore e' un sito esterno: apro la pagina, non un brano a caso.
  // Chiamato "noTube" e non "mp3" perche' il nome dice che e' un sito.
  function linkConvertitore() {
    return linkEsterno("noTube", LINK_CONVERTITORE,
      "Sito esterno: apri la pagina, incolla il link del video e scarica tu", "btn-mp3");
  }

  async function findDownload(item) {
    const cands = [];
    /* Le due ricerche andavano una dopo l'altra: se un sito ci metteva 8
       secondi e l'altro 6, la riga restava su "cerco..." per 14 secondi.
       Adesso partono insieme e ognuno ha un tetto di 9 secondi: al massimo
       si aspetta il sito piu' lento, non la somma. */
    const esiti = await Promise.allSettled([
      conScadenza(searchArchive(item), 9000, "sito lento"),
      conScadenza(searchCommons(item), 9000, "sito lento")
    ]);
    for (const e of esiti) {
      if (e.status === "fulfilled" && e.value) cands.push(...e.value);
    }
    cands.sort((a, b) => b.score - a.score);
    const list = cands.slice(0, 5);
    return { best: list.length ? list[0] : null, list };
  }

  /* Cerca un brano e gli assegna lo stato trovato (trovato / scegli /
     solo anteprima / non disponibile). La usa sia il ciclo principale sia il
     tasto "Riprova", cosi' la logica e' sempre la stessa.
     Massimo 14 secondi: adesso i due siti si cercano insieme e ognuno ha un
     tetto proprio, quindi non serve stare 35 secondi aspettando. */
  async function cercaItemSingolo(item) {
    let found = null;
    let scaduto = false;
    try {
      found = await conScadenza(findDownload(item), 14000, "ricerca scaduta");
    } catch (e) {
      found = null;
      scaduto = /scadut|lent/i.test(String((e && e.message) || ""));
    }
    item.candidates = (found && found.list) || [];
    item.tagMancato = "";
    const best = found && found.best;
    if (best && best.strong) {
      item.state = "ready";
      item.meta = best;
    } else if (item.anteprima) {
      // il brano intero non e' in nessun archivio: resta l'anteprima
      item.candidates = item.candidates.concat([item.anteprima]);
      item.meta = item.anteprima;
      item.state = "found";
      item.tagTrovato = "anteprima 30s";
    } else if (best) {
      item.state = "choose";
    } else {
      item.state = "missing";
      item.tagMancato = scaduto ? "ricerca scaduta" : "";
    }
    paintImport(item);
  }

  function sync32(n) {
    return new Uint8Array([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
  }

  function concatBytes(list) {
    let total = 0;
    for (const b of list) total += b.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const b of list) {
      out.set(b, off);
      off += b.length;
    }
    return out;
  }

  function id3Frame(id, payload) {
    return concatBytes([new TextEncoder().encode(id), sync32(payload.length), new Uint8Array([0, 0]), payload]);
  }

  function id3Text(id, value) {
    if (!value) return null;
    const bytes = new TextEncoder().encode(String(value));
    const payload = new Uint8Array(1 + bytes.length);
    payload[0] = 3;
    payload.set(bytes, 1);
    return id3Frame(id, payload);
  }

  function id3Cover(cover) {
    if (!cover || !cover.data || !cover.data.length) return null;
    const mime = cover.mime || "image/jpeg";
    return id3Frame("APIC", concatBytes([
      new Uint8Array([0]),
      new TextEncoder().encode(mime),
      new Uint8Array([0, 3, 0]),
      cover.data
    ]));
  }

  function stripExistingTag(blob, head) {
    if (!(head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33)) return blob;
    const major = head[3];
    if (major === 2 && head.length >= 8) {
      const size = (head[5] << 16) | (head[6] << 8) | head[7];
      if (size > 0 && 6 + size <= blob.size) return blob.slice(6 + size);
      return blob;
    }
    if (head.length >= 10) {
      const size = ((head[6] & 0x7f) << 21) | ((head[7] & 0x7f) << 14) | ((head[8] & 0x7f) << 7) | (head[9] & 0x7f);
      if (size > 0 && 10 + size <= blob.size) return blob.slice(10 + size);
    }
    return blob;
  }

  async function tagMp3(blob, meta, cover) {
    try {
      if (blob.size > MAX_DOWNLOAD) return blob;
      const head = new Uint8Array(await blob.slice(0, 10).arrayBuffer());
      const audio = stripExistingTag(blob, head);
      const frames = [
        id3Text("TIT2", meta.title),
        id3Text("TPE1", meta.artist),
        id3Text("TALB", meta.album),
        id3Text("TCOP", meta.license),
        id3Text("TSRC", meta.source),
        id3Cover(cover)
      ].filter(Boolean);
      const body = concatBytes(frames);
      const header = concatBytes([
        new TextEncoder().encode("ID3"),
        new Uint8Array([3, 0, 0]),
        sync32(body.length)
      ]);
      return new Blob([header, body, audio], { type: blob.type || "audio/mpeg" });
    } catch (e) {
      return blob;
    }
  }

  async function fetchCoverBlob(url) {
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch (e) {
      return null;
    }
  }

  function fmtBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  async function downloadDirect(url, onProgress, signal) {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const type = (res.headers.get("content-type") || "").toLowerCase();
    if (type && type.indexOf("audio/") < 0 && type.indexOf("application/octet-stream") < 0) {
      throw new Error("il link non punta a un file audio");
    }
    const total = Number(res.headers.get("content-length") || 0);
    if (total && total > MAX_DOWNLOAD) throw new Error("file troppo grande (max 40 MB)");
    if (!res.body) return await res.blob();
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      chunks.push(part.value);
      got += part.value.byteLength;
      if (got > MAX_DOWNLOAD) {
        try { await reader.cancel(); } catch (e) { /* noop */ }
        throw new Error("file troppo grande (max 40 MB)");
      }
      onProgress(total ? got / total : 0, got);
    }
    return new Blob(chunks, { type: type || "audio/mpeg" });
  }

  function readFileWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total, e.loaded);
      };
      fr.onload = () => resolve(new Blob([fr.result], { type: file.type || "audio/mpeg" }));
      fr.onerror = () => reject(new Error("lettura file fallita"));
      fr.readAsArrayBuffer(file);
    });
  }

  async function saveImported(meta, blob, source) {
    const id = "i-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const coverBlob = await fetchCoverBlob(meta.cover);
    const isMp3 = /mpeg/i.test(blob.type || "") || /\.(mp3|mpeg)$/i.test(meta.url || "");
    const audio = isMp3 ? await tagMp3(blob, meta, coverBlob) : blob;
    const rec = {
      id,
      title: meta.title,
      artist: meta.artist || "",
      album: meta.album || "",
      blob: audio,
      size: audio.size,
      source: source || "import",
      profile: profile,
      license: meta.license || "",
      pageUrl: meta.url || "",
      cover: coverBlob || meta.cover || "",
      date: new Date().toISOString()
    };
    await dbPut(rec);
    await dbSetImport({ id, title: rec.title, artist: rec.artist, album: rec.album, status: "ok", date: rec.date });
    /* Ogni brano nuovo lo condivido subito con gli altri dispositivi, senza
       aspettare che venga ricaricata la pagina. */
    condividiBraniLocali();
    enrichTrack(id);
    return rec;
  }

  async function importItem(item) {
    const meta = item.meta;
    if (!meta || !meta.url) return;
    for (const k of trackKeys(meta)) if (libKeys.has(k)) {
      item.state = "dupe";
      paintImport(item);
      return;
    }
    item.state = "downloading";
    item.controller = new AbortController();
    paintImport(item);
    if (item.el) item.el.prog.hidden = false;
    try {
      const blob = await downloadDirect(meta.url, (ratio, got) => {
        if (!item.el) return;
        item.el.fill.style.width = Math.round(ratio * 100) + "%";
        item.el.bytes.textContent = fmtBytes(got);
      }, item.controller.signal);
      await finishImport(item, blob, meta.source);
    } catch (e) {
      if (e && e.name === "AbortError") return;
      item.state = "error";
      if (item.el) {
        item.el.fill.classList.add("err");
        item.el.bytes.textContent = e.message;
      }
      paintImport(item);
    }
  }

  async function autoImportAll() {
    const todo = importList.filter((x) => x.state === "ready");
    let idx = 0;
    const worker = async () => {
      for (;;) {
        const i = idx++;
        if (i >= todo.length) return;
        await importItem(todo[i]);
      }
    };
    const n = Math.min(2, todo.length);
    const runners = [];
    for (let k = 0; k < n; k++) runners.push(worker());
    await Promise.all(runners);
  }

  /* Apre il selettore file per agganciare un brano a questo pezzo della lista.
     Serve dopo aver scaricato l'mp3 da qualche parte a mano. */
  function scegliFilePer(item) {
    importActive = item;
    const inp = $("importAudioInput");
    inp.value = "";
    inp.click();
  }

  // Numeri da seguire, uno per riga: si legge meglio di un paragrafo.
  function guidaPassi(testi) {
    const ol = document.createElement("ol");
    ol.className = "imp-guida";
    for (const t of testi) {
      const li = document.createElement("li");
      li.textContent = t;
      ol.appendChild(li);
    }
    return ol;
  }

  /* Ponte YouTube sul PC: un piccolo programma (strumenti-youtube) che gira
     solo sulla mia macchina e ascolta su 127.0.0.1. Se e' acceso, posso
     scaricare e convertire da solo. Funziona SOLO aprendo la app sul PC:
     dal telefono il browser blocca la richiesta, e va bene cosi'. */
  /* Il programma che scarica puo' stare sul computer stesso (127.0.0.1) oppure
     nella rete privata di casa (Tailscale, indirizzo 100.x): dal telefono
     127.0.0.1 sarebbe il telefono stesso, quindi provo piu' indirizzi.
     Resto solo su 127.0.0.1 e sull'indirizzo privato: mai su 0.0.0.0, che
     aprirebbe il programma a chiunque sia sul Wi-Fi. */
  const INDIRIZZI_PONTE = ["http://127.0.0.1:8788", "http://100.106.211.2:8788"];
  let ponteCheRisponde = "";
  let ponteCache = null;
  let segnalatoIndirizzo = "";

  // Manda un errore al registro del programma sul PC, se e' acceso.
  // Serve a me per capire cosa si rompe senza dover chiedere ogni volta.

  /* Provo gli indirizzi uno alla volta finche' uno risponde.
     Sul computer risponde 127.0.0.1, dal telefono risponde l'indirizzo
     della rete privata. Uso quello che ha risposto per tutte le richieste
     successive, cosi' non rifaccio la prova ogni volta.
     Se piu' righe premono i pulsanti insieme condividono la stessa prova:
     prima ognuna faceva la sua e si avevano 20 richieste in contemporanea,
     tutte lentissime, e la scritta "controllo il PC..." restava ferma. */
  let ponteInCorso = null;
  async function cercaPonte() {
    if (ponteCheRisponde) return ponteCheRisponde;
    for (const base of INDIRIZZI_PONTE) {
      try {
        const ctl = new AbortController();
        const scad = setTimeout(() => ctl.abort(), 1800);
        const r = await fetch(base + "/ping", { cache: "no-store", signal: ctl.signal });
        clearTimeout(scad);
        if (r.ok) {
          ponteCheRisponde = base;
          return base;
        }
      } catch (e) { /* questo indirizzo non va bene, provo il prossimo */ }
    }
    return "";
  }
  function trovaPonte() {
    if (ponteCheRisponde) return Promise.resolve(ponteCheRisponde);
    if (!ponteInCorso) {
      ponteInCorso = cercaPonte().then((r) => { ponteInCorso = null; return r; });
    }
    return ponteInCorso;
  }

  function segnalaErrore(testo) {
    const msg = "v" + APP_VERSION + " | " + String(testo || "").slice(0, 300);
    try {
      const base = ponteCheRisponde || INDIRIZZI_PONTE[0];
      const ctl = new AbortController();
      const scad = setTimeout(() => ctl.abort(), 3000);
      fetch(base + "/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testo: msg }),
        signal: ctl.signal
      }).catch(() => {}).then(() => clearTimeout(scad));
    } catch (e) { /* noop */ }
  }

  /* Questa funzione non deve mai rompersi: se le succede qualcosa di inatteso
     la scritta del brano resta ferma su "controllo il PC..." e sembra che il
     programma sia occupato. Quindi ogni errore diventa una risposta
     "programma spento", che e' la verita' quando qualcosa non funziona. */
  async function ponteOnline() {
    try {
      if (ponteCache && Date.now() - ponteCache.t < 30000) return ponteCache.ok;
      /* Se l'indirizzo giusto e' gia' noto mi fido: ha gia' risposto una
         volta, non rifaccio la richiesta. */
      if (ponteCheRisponde) {
        ponteCache = { ok: true, t: Date.now() };
        return true;
      }
      const base = await trovaPonte();
      const ok = !!base;
      const perche = ok ? "" : "nessun indirizzo risponde (" + INDIRIZZI_PONTE.join(", ") + ")";
      ponteCache = { ok: ok, t: Date.now() };
      if (segnalatoIndirizzo !== window.location.href) {
        segnalatoIndirizzo = window.location.href;
        segnalaErrore("pagina aperta su " + window.location.href +
          (window.isSecureContext ? " (sicura)" : " (non sicura)") +
          " -> programma sul PC " + (ok ? "raggiungibile su " + base : "NON raggiungibile: " + perche));
      }
      return ok;
    } catch (e) {
      ponteCache = { ok: false, t: Date.now() };
      segnalaErrore("controllo del PC fallito: " + String((e && (e.message || e)) || "errore").slice(0, 160));
      return false;
    }
  }

  // Campo dove incollare il link di YouTube, col tasto per convertirlo.
  // cartella: "" (solo libreria), "ste" o "emanuela" (salva anche la copia).
  // Prima di mostrare il campo controllo che il programma sul PC sia vivo:
  // se e' spento te lo dico, invece di lasciare un campo che non serve.
  /* La riga del brano esiste ancora? item.el e' un oggetto mio, non un
     elemento della pagina: per sapere se e' ancora attaccata devo guardare
     l'elemento vero, cioe' la riga o il contenitore dei tasti.
     Prima usavo el.isConnected, che su un oggetto e' sempre undefined:
     la funzione usciva subito e non creava niente. */
  function rigaViva(el) {
    if (!el) return false;
    const nodo = el.row || el.actions;
    return !!(nodo && nodo.isConnected);
  }

  /* Un solo pulsante e non devi incollare piu' niente a mano:
     cerco io il video giusto, te lo apro, te lo metto negli appunti e parto
     subito con la conversione. Prima dovevi aprire YouTube, copiare il link,
     tornare indietro e incollarlo: erano 4 passaggi e sembrava che non
     funzionasse. Il campo dove incollare resta, per quando sbaglio video. */
  /* Se il brano e' gia' nella libreria non lo riscarico da YouTube: e' una
     richiesta inutile che fa salire il conto delle richieste e, prima o poi,
     porta a un blocco. Meglio dirti "ce l'hai gia'" e farti sentire quello
     che hai. */
  function giaInLibreria(t) {
    try {
      for (const x of tracks) {
        if (!x || !x.url) continue;
        if (hiddenTracks.has(x.id)) continue;
        if (stessoBrano({ title: t.title, artist: t.artist }, { title: x.title, artist: x.artist })) {
          return x;
        }
      }
    } catch (e) { /* noop */ }
    return null;
  }

  async function campoLinkYouTube(item, cartella, stato) {
    const scrivi = (testo) => scriviStatoPonte(stato, testo);
    item.cartella = cartella || "";
    segnalaErrore("premuto: " + (cartella ? "salva in " + cartella : "solo libreria"));
    scrivi("controllo il PC...");
    const online = await ponteOnline();
    /* Non esco piu' se la riga e' sparita: lavoro con gli elementi nuovi,
       cosi' la scritta non resta ferma su "controllo il PC..." per sempre. */
    const el = item.el;
    if (!el) { scrivi("programma sul PC: spento"); return; }
    scrivi("programma sul PC: acceso");
    /* Prima di tutto: e' gia' nella libreria? allora non scarico niente,
       non solo per risparmiare, ma per non chiedere a YouTube. */
    const gia = giaInLibreria(item);
    if (gia && gia.url) {
      scrivi("brano gia' in libreria");
      toast("Questo brano ce l'hai gia': non lo riscarico");
      segnalaErrore("brano gia' presente, non riscaricato: " +
        String((item.artist || "") + " " + (item.title || "")).slice(0, 60));
      return;
    }
    if (!online) {
      scrivi("programma sul PC: spento");
      toast("Il programma sul PC non e' acceso: apri la Music Box dal link 'Sul PC' della dashboard");
      return;
    }
    if (el.ytUrl) {
      el.ytUrl.focus();
      return;
    }
    /* Apro la scheda SUBITO, durante il clic: se aspetto la ricerca il
       browser la blocca, e senza scheda non posso mostrarti il video. */
    let scheda = null;
    try { scheda = window.open("about:blank", "_blank"); } catch (e) { scheda = null; }
    scrivi("cerco il video giusto su YouTube...");
    const esatto = await cercaVideoEsatto(item.artist, item.title, item.secs);
    const dopo = item.el;
    if (!dopo) return;
    if (!esatto) {
      // non ho trovato il brano: apro la ricerca cosi' la vedi e scegli tu
      const ricerca = "https://www.youtube.com/results?search_query=" +
        encodeURIComponent([item.artist, item.title].filter(Boolean).join(" "));
      if (scheda) { try { scheda.location.replace(ricerca); } catch (e) {} }
      copiaNegliAppunti(ricerca);
      toast("Non ho trovato il video esatto: ti ho aperto la ricerca e ho copiato il link");
      segnalaErrore("video esatto non trovato: apro la ricerca");
      scrivi("aperta la ricerca su YouTube");
      campoLinkManuale(item);
      return;
    }
    if (scheda) { try { scheda.location.replace(esatto); } catch (e) {} }
    copiaNegliAppunti(esatto);
    segnalaErrore("video esatto: " + esatto);
    toast("Video giusto trovato e link copiato: sto scaricando");
    scrivi("sto scaricando l'mp3...");
    await convertiDaYouTube(item, esatto);
  }

  /* Il campo da incollare, per quando serve scegliere il video a mano. */
  function campoLinkManuale(item) {
    const el = item.el;
    if (!el || el.ytUrl) return;
    const invio = document.createElement("span");
    invio.className = "imp-nota-anteprima";
    invio.textContent = "incolla qui il link di YouTube (quello che finisce con watch?v=...)";
    el.actions.appendChild(invio);
    const inp = document.createElement("input");
    inp.className = "imp-url";
    inp.type = "url";
    inp.placeholder = "https://www.youtube.com/watch?v=...";
    const go = document.createElement("button");
    go.className = "btn-mini go";
    go.textContent = "Scarica";
    go.addEventListener("click", () => convertiDaYouTube(item));
    el.actions.appendChild(inp);
    el.actions.appendChild(go);
    el.ytUrl = inp;
    el.ytGo = go;
    segnalaErrore("campo pronto per incollare il link");
    try { inp.focus(); } catch (e) {}
  }

  // Scarica l'mp3 dal PC e lo mette subito in libreria, agganciandolo a questo
  // brano. Mostra l'avanzamento mentre arrivano i byte.
  // urlPronto: quando l'ho gia' trovato io, non aspetto che lo incolli.
  /* ---------- Brani che non sono riuscito a scaricare ----------
     Prima, quando un download falliva, spariva tutto: spariva il link,
     spariva l'errore, e dopo un ricaricamento della pagina non sapevo
     piu' cosa avevo provato a scaricare.
     Adesso me li segno (per profilo, quindi restano anche dopo aver
     chiuso la pagina) e ci metto un bottone per riprovare: magari nel
     frattempo YouTube ha smesso di bloccarmi. */
  function _falliti() {
    try {
      const st = profileState(profile);
      return Array.isArray(st.falliti) ? st.falliti : [];
    } catch (e) { return []; }
  }

  function _salvaFalliti(lista) {
    try { writeProfileState(profile, { falliti: lista.slice(0, 60) }); } catch (e) { /* noop */ }
  }

  function _aggiornaBadgeFalliti() {
    const n = _falliti().length;
    const b = $("fallitiBadge");
    if (b) { b.textContent = String(n); b.hidden = n === 0; }
    const btn = $("btnFalliti");
    if (btn) btn.classList.toggle("has-falliti", n > 0);
    return n;
  }

  function _notaFallito(url, artista, titolo, cartella, errore) {
    if (!url) return;
    const voce = {
      url: String(url),
      artista: String(artista || ""),
      titolo: String(titolo || ""),
      cartella: String(cartella || ""),
      errore: String(errore || "").slice(0, 160),
      quando: Date.now()
    };
    const lista = _falliti().filter((x) => x.url !== voce.url);
    lista.unshift(voce);
    _salvaFalliti(lista);
    _aggiornaBadgeFalliti();
  }

  function _togliFallito(url) {
    _salvaFalliti(_falliti().filter((x) => x.url !== url));
    _aggiornaBadgeFalliti();
  }

  /* Se un brano che avevo segnato come fallito e' comparso in libreria
     (perche' l'hai aggiunto tu a mano), non lo riprovo piu': e' inutile. */
  function _pulisciFallitiRisolti() {
    const lista = _falliti();
    if (!lista.length) return;
    let tolta = false;
    const resta = lista.filter((f) => {
      const gia = tracks.some((t) => stessoBrano(t, { artist: f.artista, title: f.titolo }));
      if (gia) tolta = true;
      return !gia;
    });
    if (tolta) { _salvaFalliti(resta); _aggiornaBadgeFalliti(); }
  }

  let _riprovaInCorso = false;

  async function _riprovaFallito(f) {
    if (_riprovaInCorso) return false;
    _riprovaInCorso = true;
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: f.url,
          cartella: f.cartella || "",
          titolo: [f.artista, f.titolo].join(" - ").replace(/^\s*-\s*/, "").trim()
        })
      });
      if (!r.ok) {
        let msg = "non riuscito";
        try { const j = await r.json(); if (j && j.errore) msg = String(j.errore); } catch (e) { }
        /* se YouTube ha bloccato, la pausa la gestisce il programma: non
           insisto e lascio la voce nella lista */
        _notaFallito(f.url, f.artista, f.titolo, f.cartella, msg);
        toast("Non ancora: " + msg.slice(0, 60));
        return false;
      }
      const blob = await r.blob();
      const meta = {
        title: f.titolo || (blob && blob.name) || "brano",
        artist: f.artista || "",
        album: "",
        license: "",
        source: "youtube (convertito sul PC)"
      };
      await saveImported(meta, blob, meta.source);
      for (const k of trackKeys(meta)) libKeys.add(k);
      _togliFallito(f.url);
      toast(meta.title + " scaricato");
      await loadAll();
      return true;
    } catch (e) {
      _notaFallito(f.url, f.artista, f.titolo, f.cartella, (e && e.message) || "errore");
      return false;
    } finally {
      _riprovaInCorso = false;
    }
  }

  async function _riprovaTutti() {
    if (_riprovaInCorso) return;
    const lista = _falliti();
    for (let i = 0; i < lista.length; i++) {
      const f = lista[i];
      _stampaFalliti("Sto riprovando " + (i + 1) + " di " + lista.length + ": " + (f.titolo || f.artista || "senza nome"));
      const ok = await _riprovaFallito(f);
      if (!ok) {
        /* se e' bloccato mi fermo: gli altri fallirebbero uguale e
           farei solo danno */
        _stampaFalliti("Mi fermo: YouTube sta bloccando. Riprova fra qualche minuto.");
        return;
      }
      /* una pausa fra una prova e l'altra, come fa il programma sul PC */
      await new Promise((r) => setTimeout(r, 2500));
    }
    _stampaFalliti("Fatto: ho riprovato tutti.");
  }

  function _stampaFalliti(sottotitolo) {
    const pannello = $("fallitiPanel");
    const corpo = $("fallitiCorpo");
    if (!pannello || !corpo) return;
    const lista = _falliti();
    if ($("fallitiSub")) $("fallitiSub").textContent = sottotitolo || (lista.length ? "Qui puoi riprovare quando vuoi" : "Non c'e' niente da riprovare");
    let html = "";
    if (!lista.length) {
      html = '<div class="stat-lista"><div class="stat-item"><span>Brani non scaricati</span><b>0</b></div></div>' +
        '<p class="nota" style="margin:8px 2px 0">Non c\'e\' nessun brano scaricato a meta\'.</p>';
    } else {
      html = '<div class="profile-actions" style="margin-bottom:10px"><button class="btn-main" id="btnRiprovaTutti">Riprova tutti</button>' +
        '<button class="btn-ghost" id="btnDimenticaFalliti">Dimentica tutti</button></div>';
      for (const f of lista) {
        const nome = [f.artista, f.titolo].filter(Boolean).join(" - ") || "senza nome";
        const quando = f.quando ? new Date(f.quando) : null;
        const quandoTxt = quando ? quando.toLocaleDateString("it-IT") + " " + String(quando.getHours()).padStart(2, "0") + ":" + String(quando.getMinutes()).padStart(2, "0") : "";
        html += '<div class="falliti-riga" data-url="' + encodeURIComponent(f.url) + '">' +
          '<div class="falliti-info"><div class="falliti-nome">' + String(nome).replace(/[<>]/g, "") + "</div>" +
          '<div class="falliti-dome">' + String(f.errore || "").replace(/[<>]/g, "") + (quandoTxt ? " - " + quandoTxt : "") + "</div></div>" +
          '<div class="falliti-btns"><button data-azione="riprova">Riprova</button>' +
          '<button data-azione="togli">Togli</button></div></div>';
      }
    }
    corpo.innerHTML = html;
    pannello.hidden = false;
    syncNoScroll();
  }

  function _chiudiPannelloFalliti() {
    const pannello = $("fallitiPanel");
    if (pannello) pannello.hidden = true;
    syncNoScroll();
  }

  async function convertiDaYouTube(item, urlPronto) {
    const el = item.el;
    const url = urlPronto || (el.ytUrl ? el.ytUrl.value.trim() : "");
    if (!url) {
      toast("Prima incolla il link di YouTube");
      segnalaErrore("Scarica premuto ma il campo era vuoto");
      return;
    }
    segnalaErrore("converto: " + url.slice(0, 60) + " cartella=" + (el.cartella || "nessuna"));
    if (el.ytGo) el.ytGo.disabled = true;
    if (el.ytUrl) el.ytUrl.disabled = true;
    item.state = "downloading";
    el.prog.hidden = false;
    el.fill.classList.remove("err");
    el.fill.style.width = "3%";
    el.bytes.textContent = "converto col PC...";
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
    const r = await fetch(base + "/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url,
          cartella: (el.cartella || ""),
          titolo: [(item.artist || ""), (item.title || "")].join(" - ").replace(/^\s*-\s*/, "").trim()
        })
      });
      if (!r.ok) {
        let msg = "conversione non riuscita";
        try {
          const j = await r.json();
          if (j && j.errore) msg = String(j.errore);
        } catch (e) {}
        throw new Error(msg);
      }
      // se avevo chiesto una copia su disco, te dico se e' andata bene
      const copia = r.headers.get("X-Cartella") || "";
      if (copia === "non salvata") toast("Ho l'mp3, ma non sono riuscito a salvarlo in cartella");
      // leggo a pezzetti cosi' si vede l'avanzamento
      const lettore = r.body && r.body.getReader ? r.body.getReader() : null;
      let parti = [];
      let totale = 0;
      if (lettore) {
        for (;;) {
          const passo = await lettore.read();
          if (passo.done) break;
          parti.push(passo.value);
          totale += passo.value.length;
          el.fill.style.width = Math.min(95, 10 + Math.round(totale / 90000)) + "%";
          el.bytes.textContent = fmtBytes(totale);
        }
      } else {
        parti = [await r.arrayBuffer()];
        totale = parti[0].byteLength;
      }
      const blob = new Blob(parti, { type: "audio/mpeg" });
      segnalaErrore("mp3 ricevuto: " + blob.size + " byte, lo metto in libreria");
      el.fill.style.width = "100%";
      el.bytes.textContent = fmtBytes(blob.size);
      item.meta = Object.assign({}, item.meta || {}, {
        title: item.title,
        artist: item.artist,
        album: item.album || "",
        license: (item.meta && item.meta.license) || "",
        source: "youtube (convertito sul PC)"
      });
      await finishImport(item, blob, "youtube (convertito sul PC)");
    } catch (err) {
      // non lo porto in "errore": puo' essere un link sbagliato, e serve
      // riprovare senza perdere il brano
      dimenticaPonte();
      el.fill.classList.add("err");
      el.bytes.textContent = String((err && err.message) || err);
segnalaErrore("conversione fallita: " + String((err && err.message) || err).slice(0, 160));
    /* me lo segno, cosi' posso riprovare dopo senza cercare di nuovo il link */
    _notaFallito(url, item.artist, item.title, (el && el.cartella) || "", (err && err.message) || err);
    item.state = "found";
      if (el.ytGo) el.ytGo.disabled = false;
      if (el.ytUrl) el.ytUrl.disabled = false;
    }
  }

  // Riga che dice se il programma sul PC e' acceso. Prima non si vedeva nulla
  // e non si capiva perche': ora lo stato e' sempre scritto.
  // Riga che dice se il programma sul PC e' acceso. Prima si aspettava
  // l'oggetto del brano e faceva el.actions.appendChild: ma ora i tasti
  // stanno in gruppi, e li passo direttamente il contenitore.
  function statoPonte(contenitore) {
    const s = document.createElement("span");
    s.className = "imp-stato-ponte";
    contenitore.appendChild(s);
    return s;
  }

  function scriviStatoPonte(s, testo) {
    if (!s) return;
    s.textContent = testo;
    s.classList.remove("imp-stato-ok", "imp-stato-no");
    if (testo.indexOf("controllo") === 0) return;   // ancora in prova: resta grigio
    s.classList.add(testo.indexOf("acceso") >= 0 ? "imp-stato-ok" : "imp-stato-no");
  }

  /* I tasti per il PC sono SEMPRE visibili, anche se il programma e' spento.
     Prima comparivano solo quando una richiesta riusciva: se falliva non
     vedevi niente e restavi a indovinare. Meglio un tasto che spiega. */
  function aggiungiPonte(item) {
    const el = item.el;
    if (!el || el.ponte) return;
    el.ponte = true;
    const gruppo = nuovoGruppo(el, "Sul PC (scarica e converti da solo)");
    // dichiaro lo stato PRIMA dei tasti: i tasti lo richiamano al click
    const stato = statoPonte(gruppo);
    scriviStatoPonte(stato, "controllo il PC...");
    nuovoBottone(gruppo, "Scarica l'mp3 col PC", () => campoLinkYouTube(item, CARTELLA_PREDEFINITA, stato),
      "btn-mini-auto", "Scarico e converto io col PC: il brano va in libreria e resta su tutti i dispositivi");
    // un tasto per ogni profilo: oltre che in libreria salvo una copia nella
    // sua cartella mp3 sul PC. Prima erano due scritti a mano.
    for (const p of PROFILI) {
      if (!p.cartella) continue;
      nuovoBottone(gruppo, "Salva in mp3 " + p.nome, () => campoLinkYouTube(item, p.cartella, stato),
        "btn-mini-cartella", "Oltre che in libreria, salvo una copia in musica mp3 " + p.cartella);
    }
    /* Aggiorno lo stato SENZA controllare se la riga e' ancora a schermo:
       se nel frattempo la lista si e' ridisegnata, questa riga e' vecchia e
       non la vede piu' nessuno, e la riga nuova fa il controllo per conto
       suo. Prima invece uscivo subito e la scritta "controllo il PC..."
       restava lì per sempre, e sembrava che il programma fosse occupato. */
    ponteOnline().then((online) => {
      scriviStatoPonte(stato, online
        ? "programma sul PC: acceso"
        : "programma sul PC: spento");
    });
    /* Rete di sicurezza: dopo 5 secondi la scritta non deve piu' dire
       "controllo il PC...", altrimenti sembra tutto bloccato. */
    setTimeout(() => {
      if (stato && stato.textContent && stato.textContent.indexOf("controllo") === 0) {
        scriviStatoPonte(stato, "programma sul PC: ?");
      }
    }, 5000);
  }

  // Mostra i passi da seguire sotto un brano che ha solo l'anteprima.
  function elGuide(item) {
    const el = item.el;
    if (!el || el.guida) return;
    const gruppo = nuovoGruppo(el, "A mano (senza PC)");
    const piu = document.createElement("details");
    piu.className = "hint-more imp-altro";
    const somma = document.createElement("summary");
    somma.textContent = "Come si fa senza il PC";
    piu.appendChild(somma);
    piu.appendChild(guidaPassi([
      "apri la canzone su YouTube, usa noTube, scarica, poi scegli il file qui sotto"
    ]));
    gruppo.appendChild(piu);
    nuovoBottone(gruppo, "Apri i miei file", () => scegliFilePer(item),
      "btn-mini-file", "Scegli l'mp3 che hai gia' scaricato a mano");
    el.guida = true;
  }

  function toggleUrlInput(item) {
    const el = item.el;
    if (el.url) {
      el.url.remove();
      if (el.go) el.go.remove();
      el.url = null;
      el.go = null;
      return;
    }
    const input = document.createElement("input");
    input.className = "imp-url";
    input.type = "url";
    input.placeholder = "https://... file audio che puoi scaricare";
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startUrlDownload(item);
    });
    const go = document.createElement("button");
    go.className = "btn-mini go";
    go.textContent = "Scarica";
    go.addEventListener("click", () => startUrlDownload(item));
    el.actions.appendChild(input);
    el.actions.appendChild(go);
    el.url = input;
    el.go = go;
  }

  // Un link YouTube (o un'altra pagina video) non e' un file audio: scaricarlo
  // darebbe solo la pagina del video. Meglio spiegare che cosa fare davvero.
  function eLinkVideo(url) {
    return /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com\/watch|instagram\.com\/reel)/i.test(url);
  }

  async function startUrlDownload(item) {
    const url = item.el.url ? item.el.url.value.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      toast("Indirizzo non valido");
      return;
    }
    if (eLinkVideo(url)) {
      item.el.url.value = "";
      if (item.el.go) item.el.go.disabled = false;
      toast("Questo e' il link di un video: convertilo prima in mp3 (tasto mp3), poi scegli il file scaricato");
      elGuide(item);
      return;
    }
    item.state = "downloading";
    item.el.prog.hidden = false;
    if (item.el.url) item.el.url.disabled = true;
    if (item.el.go) item.el.go.disabled = true;
    item.el.fill.classList.remove("err");
    try {
      const blob = await downloadDirect(url, (ratio, got) => {
        item.el.fill.style.width = Math.round(ratio * 100) + "%";
        item.el.bytes.textContent = fmtBytes(got);
      });
      item.meta = Object.assign({}, item.meta || {}, {
        title: item.title,
        artist: item.artist,
        album: item.album || "",
        license: (item.meta && item.meta.license) || "fonte esterna",
        url
      });
      await finishImport(item, blob, "link diretto");
    } catch (e) {
      item.state = "error";
      item.el.fill.classList.add("err");
      item.el.bytes.textContent = e.message;
      toast("Download fallito: " + e.message);
      paintImport(item);
    }
  }

  async function finishImport(item, blob, source) {
    if (item.el) {
      item.el.fill.classList.add("ok");
      item.el.fill.style.width = "100%";
    }
    const meta = item.meta || { title: item.title, artist: item.artist, album: "" };
    const rec = await saveImported(meta, blob, source);
    for (const k of trackKeys(meta)) libKeys.add(k);
    item.savedId = rec.id;
    item.state = "done";
    paintImport(item);
    toast(meta.title + " importato");
    await loadAll();
  }

  async function removeImportItem(item) {
    if (item.state === "downloading") return;
    const yes = await askConfirm("Togliere dalla ricerca?", "«" + item.title + "» sparisce da questo elenco. Se era in download, si ferma.", "Togli");
    if (!yes) return;
    item.removed = true;
    if (item.controller) {
      try { item.controller.abort(); } catch (e) { /* noop */ }
    }
    const idx = importList.indexOf(item);
    if (idx >= 0) importList.splice(idx, 1);
    if (item.el && item.el.row) item.el.row.remove();
  }

  /* Crea un tasto nella lista del brano.
     Sta FUORI da paintImport perche' serve anche ad altre funzioni
     (aggiungiPonte): dentro, non era visibile e crashava con
     "btn is not defined", bloccando ogni brano. */
  function nuovoBottone(azioni, testo, fn, classe, titolo, disabilitato) {
    const b = document.createElement("button");
    b.className = "btn-mini" + (classe ? " " + classe : "");
    b.textContent = testo;
    b.disabled = !!disabilitato;
    if (titolo) b.title = titolo;
    if (fn) b.addEventListener("click", fn);
    azioni.appendChild(b);
    return b;
  }

  /* Un gruppo di tasti con scritto sopra cosa serve. I tasti erano tutti
     sciolti nella stessa riga e non si capiva piu' niente. */
  function nuovoGruppo(el, etichetta) {
    const g = document.createElement("div");
    g.className = "imp-gruppo-azioni";
    if (etichetta) {
      const t = document.createElement("span");
      t.className = "imp-gruppo-etichetta";
      t.textContent = etichetta;
      g.appendChild(t);
    }
    el.actions.appendChild(g);
    return g;
  }

  function paintImport(item) {
    const el = item.el;
    if (!el) return;
    el.tags.innerHTML = "";
    el.actions.innerHTML = "";
    el.url = null;
    el.go = null;
    el.guida = false;   // la guida si puo' riedisegnare al prossimo paintImport
    el.ponte = null;    // idem per il controllo del ponte sul PC
    el.ytUrl = null;
    el.ytGo = null;
    // da qui in poi i tasti finiscono nel gruppo indicato: cosi' restano
    // separati per invece di finire tutti sciolti nella stessa riga
    let gruppo = nuovoGruppo(el, "");
    const tag = (text, cls) => {
      const s = document.createElement("span");
      s.className = "imp-tag" + (cls ? " " + cls : "");
      s.textContent = text;
      el.tags.appendChild(s);
    };
    const btn = (text, fn, disabled) => nuovoBottone(gruppo, text, fn, "", "", disabled);

    if (item.state === "dupe") {
      tag("già nella libreria", "dup");
    } else if (item.state === "missing") {
      tag(item.tagMancato || "non disponibile", "miss");
      if (item.tagMancato) {
        // la ricerca e' andata in timeout: rifacila toccando qui
        btn("Riprova", () => {
          item.state = "searching";
          item.tagMancato = "";
          paintImport(item);
          cercaItemSingolo(item);
        });
      }
    } else if (item.state === "done") {
      tag("importato", "ok");
      if (item.savedId) btn("Riproduci", () => playById(item.savedId));
    } else if (item.state === "searching") {
      tag("cerco...", "");
    } else if (item.state === "downloading") {
      tag("scarico", "");
    } else if (item.state === "error") {
      tag("errore", "miss");
      if (el.prog) el.prog.hidden = false;
    } else if (item.state === "choose") {
      tag("scegli quella giusta", "");
    } else if (item.state === "found") {
      tag(item.tagTrovato || "trovato", "ok");
      // Prima di importare: ascoltalo, se c'e' qualcosa da sentire.
      const bInfo = bottoneAnteprima(item.meta);
      if (bInfo.src) {
        const nota = notaAnteprima(item.meta);
        const b = btn(bInfo.etichetta, () => {
          const b2 = bottoneAnteprima(item.meta);
          ascoltaPrima({ src: b2.src, etichetta: b2.etichetta, el: b }, (err) => {
            if (err) toast("Anteprima non disponibile per questo brano.");
          });
        });
        b.title = nota || "Ascolta prima di importare";
        if (nota) {
          // solo 30 secondi: dice il perche' e i passi da seguire
          const sp = document.createElement("span");
          sp.className = "imp-nota-anteprima";
          sp.textContent = nota;
          el.actions.appendChild(sp);
          elGuide(item);
        }
      }
      btn("Importa", () => {
        fermaAnteprima();
        item.state = "ready";
        importItem(item);
      });
    } else if (item.state === "ready") {
      tag("trovato", "ok");
      // anche quando ha trovato subito il brano completo: ascoltalo prima
      const bInfoR = bottoneAnteprima(item.meta);
      if (bInfoR.src) {
        const bR = btn(bInfoR.etichetta, () => {
          const b2 = bottoneAnteprima(item.meta);
          ascoltaPrima({ src: b2.src, etichetta: b2.etichetta, el: bR }, (err) => {
            if (err) toast("Anteprima non disponibile per questo brano.");
          });
        });
        bR.title = notaAnteprima(item.meta) || "Ascolta prima di importare";
      }
    }

    if (item.state === "choose" && item.candidates.length) {
      for (const cand of item.candidates) {
        // ogni versione si puo' ascoltare prima di sceglierla
        const bInfo = bottoneAnteprima(cand);
        if (bInfo.src) {
          const b = btn("▶ " + bInfo.etichetta, () => {
            const b2 = bottoneAnteprima(cand);
            ascoltaPrima({ src: b2.src, etichetta: "▶ " + b2.etichetta, el: b }, (err) => {
              if (err) toast("Anteprima non disponibile per questa versione.");
            });
          });
          b.title = notaAnteprima(cand) || "Ascolta prima di scegliere";
        }
        const nota = notaAnteprima(cand);
        btn((cand.title + (cand.artist ? " — " + cand.artist : "") + (cand.album ? " [" + cand.album + "]" : "")), () => {
          fermaAnteprima();
          item.meta = cand;
          item.state = "ready";
          paintImport(item);
          importItem(item);
        });
        if (nota) {
          // anche fra le versioni alternative: solo anteprima = yt + convertitore
          const yt = linkYouTube(cand.artist, cand.title, item.secs);
          if (yt) el.actions.appendChild(yt);
          el.actions.appendChild(linkConvertitore());
          const sp = document.createElement("span");
          sp.className = "imp-nota-anteprima";
          sp.textContent = nota;
          el.actions.appendChild(sp);
        }
      }
      // qui il tasto che scarica da solo col PC mancava: senza, chi ha piu'
      // versioni non trovava mai la strada automatica
      if (item.candidates.some((c) => notaAnteprima(c))) {
        el.actions.appendChild(guidaPassi([
          "se ti serve tutta la canzone: sul PC tocca il tasto verde e incolla il link di YouTube"
        ]));
        aggiungiPonte(item);
      }
    }

    if (item.meta && item.state !== "done" && item.state !== "choose") {
      if (item.candidates && item.candidates.length > 1) {
        btn(el.showAlts ? "Meno versioni" : "Altre versioni (" + item.candidates.length + ")", () => {
          el.showAlts = !el.showAlts;
          paintImport(item);
        });
      }
      btn("Scarica da link", () => toggleUrlInput(item));
      btn("Importa file", () => scegliFilePer(item));
      if (el.showAlts && item.candidates.length > 1) {
        for (const cand of item.candidates) {
          if (cand === item.meta) continue;
          btn("Prova: " + cand.title, () => {
            item.meta = cand;
            item.state = "ready";
            paintImport(item);
            importItem(item);
          });
        }
      }
    }

    /* Link e tasti per trovare il brano: valgono per OGNI stato, non solo per
       le anteprime. Prima "yt" e "noTube" comparivano solo quando c'era
       l'anteprima di 30s, e sui brani "non disponibile" mancavano proprio i
       link che servono di piu'.
       Stanno in fondo, in gruppi separati: cosi' la riga si legge a blocchi. */
    if (item.state !== "downloading" && item.state !== "done" && item.state !== "searching") {
      const web = nuovoGruppo(el, "Cercalo su internet");
      const nomeBrano = (item.meta && item.meta.title) || item.title;
      const nomeArtista = (item.meta && item.meta.artist) || item.artist;
      const yt = linkYouTube(nomeArtista, nomeBrano, item.secs);
      if (yt) web.appendChild(yt);
      web.appendChild(linkConvertitore());
      aggiungiPonte(item);
    }
  }

  /* Ordine di priorita' nella lista delle canzoni trovate: prima quelle con
     il brano COMPLETO (pronti da importare), poi le altre, e in fondo quelle
     che hanno solo l'anteprima di 30 secondi. I gruppi ("Canzoni di ...")
     restano attaccati: non si mescola un gruppo con gli altri. */
  function prioritaImport(x) {
    const solo30 = !!(x.meta && x.meta.license === "solo 30 secondi");
    if (x.state === "ready") return 0;            // brano completo
    if (x.state === "done") return 1;
    if (solo30) return 9;                          // solo anteprima: in fondo
    if (x.state === "found") return 0;            // trovato completo
    if (x.state === "choose") return 2;
    return 3;
  }
  function ordinaImport(lista) {
    // blocchi: un brano sciolto, oppure un gruppo intero di canzoni
    const blocchi = [];
    let attuale = null;
    for (const x of lista) {
      if (x.gruppo) {
        if (!attuale || attuale.gruppo !== x.gruppo) {
          attuale = { gruppo: x.gruppo, voci: [] };
          blocchi.push(attuale);
        }
        attuale.voci.push(x);
      } else {
        attuale = null;
        blocchi.push({ gruppo: "", voci: [x] });
      }
    }
    for (const b of blocchi) {
      b.voci.forEach((v, i) => { v._ord = i; });
      b.voci.sort((a, c) => (prioritaImport(a) - prioritaImport(c)) || (a._ord - c._ord));
      // il blocco vale quanto il suo brano migliore
      b.prio = Math.min.apply(null, b.voci.map(prioritaImport));
    }
    const ordine = blocchi.map((b, i) => ({ b: b, i: i }));
    ordine.sort((a, c) => (a.b.prio - c.b.prio) || (a.i - c.i));
    const fuori = [];
    for (const o of ordine) for (const v of o.b.voci) fuori.push(v);
    return fuori;
  }

  function renderImports() {
    const box = $("importResults");
    box.innerHTML = "";
    $("importStep3").hidden = false;
    // mentre cerca non riordino niente, se no' le righe saltano sotto gli occhi
    const inCorso = importList.some((x) => x.state === "searching" || x.state === "downloading");
    const daMostrare = inCorso ? importList.slice() : ordinaImport(importList);
    let gruppoCorrente = null;
    for (const item of daMostrare) {
      if (item.gruppo && item.gruppo !== gruppoCorrente) {
        gruppoCorrente = item.gruppo;
        const testata = document.createElement("div");
        testata.className = "imp-gruppo";
        const nome = document.createElement("span");
        nome.className = "imp-gruppo-nome";
        nome.textContent = gruppoCorrente;
        testata.appendChild(nome);
        const tutte = document.createElement("button");
        tutte.className = "btn-mini";
        const conta = () => importList.filter((x) => x.gruppo === gruppoCorrente && x.state === "found").length;
        const aggiornaTutte = () => {
          tutte.textContent = conta() ? "Importa tutte (" + conta() + ")" : "Niente da importare";
          tutte.disabled = !conta();
        };
        aggiornaTutte();
        tutte.addEventListener("click", async () => {
          for (const x of importList) {
            if (x.gruppo !== gruppoCorrente || x.state !== "found") continue;
            x.state = "ready";
            paintImport(x);
          }
          aggiornaTutte();
          await autoImportAll();
          aggiornaTutte();
        });
        testata.appendChild(tutte);
        box.appendChild(testata);
      }
      const row = document.createElement("div");
      row.className = "imp";

      const cover = document.createElement("img");
      cover.className = "imp-cover";
      cover.alt = "";
      cover.src = (item.meta && item.meta.cover) || item.copertina || TRANSPARENT_PIXEL;

      const main = document.createElement("div");
      main.className = "imp-main";

      const title = document.createElement("p");
      title.className = "imp-title";
      title.textContent = item.title + (item.artist ? " — " + item.artist : "");
      main.appendChild(title);

      const sub = document.createElement("p");
      sub.className = "imp-sub";
      const bits = [];
      const album = (item.meta && item.meta.album) || item.album;
      if (album) bits.push(album);
      if (item.secs) bits.push(fmtTime(item.secs));
      if (item.meta && item.meta.source) bits.push(item.meta.source);
      if (item.meta && item.meta.license) bits.push(item.meta.license);
      sub.textContent = bits.join(" · ");
      main.appendChild(sub);

      const tags = document.createElement("p");
      tags.className = "imp-tags";
      main.appendChild(tags);

      const actions = document.createElement("div");
      actions.className = "imp-actions";
      main.appendChild(actions);

      const prog = document.createElement("div");
      prog.className = "imp-progress";
      prog.hidden = true;
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("span");
      fill.className = "bar-fill";
      bar.appendChild(fill);
      const bytes = document.createElement("span");
      bytes.className = "imp-bytes";
      prog.appendChild(bar);
      prog.appendChild(bytes);
      main.appendChild(prog);

      row.appendChild(cover);
      row.appendChild(main);

      const rem = document.createElement("button");
      rem.className = "imp-remove";
      rem.setAttribute("aria-label", "Togli dalla lista");
      rem.textContent = "×";
      rem.addEventListener("click", () => removeImportItem(item));
      row.appendChild(rem);

      box.appendChild(row);

      item.el = { row, tags, actions, prog, fill, bytes, url: null, go: null, showAlts: false };
      paintImport(item);
    }
  }

  const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  let searching = false;

  async function runSearch() {
    $("importTarget").textContent = "Sta scaricando nella libreria di " + profile + ".";
    if (searching) return;
    collectKnownArtists();
    const parsed = parseImportText($("importText").value);
    if (!parsed.length) {
      toast("Non riconosco nessun brano: controlla il testo");
      return;
    }
    searching = true;
    $("btnFind").disabled = true;
    libKeys = libraryKeys();
    importList = [];
    const daCercare = [];
    const gruppi = [];
    // Righe tipo "Post Malone": sembrano un titolo, ma se iTunes conferma
    // che sono un artista le trattiamo come "tutte le canzoni di quell'artista".
    // Controllo 4 righe alla volta: prima facevo una richiesta per riga.
    const daControllare = parsed.filter((p) => {
      if (p.artistOnly || p.artist) return false;
      const forzato = /^artista\s*:/i.test(String(p.title || "").trim());
      return forzato || /\s/.test(p.title || "");
    });
    for (let i = 0; i < daControllare.length; i += 4) {
      const lotto = daControllare.slice(i, i + 4);
      await Promise.allSettled(lotto.map(async (p) => {
        let nome = "";
        try {
          nome = await conScadenza(iTunesQuestoEArtista(p.title), 12000, "scaduto");
        } catch (e) { nome = ""; }
        if (nome) {
          p.artistOnly = true;
          p.title = nome;
        }
      }));
    }
    for (const p of parsed) {
      if (p.artistOnly) {
        const segnaposto = {
          gruppo: "Canzoni di " + p.title,
          title: p.title,
          artist: "",
          state: "searching",
          meta: null,
          candidates: []
        };
        importList.push(segnaposto);
        gruppi.push({ nome: p.title, segnaposto });
      } else {
        const item = { title: p.title, artist: p.artist, state: "searching", meta: null, candidates: [] };
        importList.push(item);
        daCercare.push(item);
      }
    }
    renderImports();

    const bar = $("searchBar");
    const fill = $("searchFill");
    const status = $("searchStatus");
    bar.hidden = false;
    status.hidden = false;
    fill.style.width = "0%";

    let fatti = 0;
    let sconosciuti = 0;
    const avanta = (testo) => {
      fatti++;
      status.textContent = testo;
      const totale = daCercare.length + gruppi.length;
      fill.style.width = (totale ? Math.min(100, Math.round((fatti / totale) * 100)) : 100) + "%";
    };

    for (const g of gruppi) {
      avanta("Cerco le canzoni di " + g.nome + "...");
      let trovate = [];
      try {
        trovate = await itunesArtistTracks(g.nome);
      } catch (e) {
        trovate = [];
      }
      if (!trovate.length) {
        // di quell'artista non c'e' niente: lo lascio scritto come artista
        // e basta. Prima lo trasformavo in un titolo di brano, e finivo
        // per proporre una canzone qualsiasi che non c'entra niente.
        const segnaposto = importList.indexOf(g.segnaposto);
        if (segnaposto >= 0) importList.splice(segnaposto, 1);
        const item = {
          gruppo: "",
          title: g.nome,
          artist: "",
          state: "missing",
          tagMancato: "nessun brano di quest'artista",
          meta: null,
          candidates: []
        };
        importList.push(item);
        renderImports();
        continue;
      }
      const gruppo = "Canzoni di " + g.nome + " (" + trovate.length + ")";
      const nuovi = [];
      for (const s of trovate) {
        if (importList.length + nuovi.length >= IMPORT_LIMIT) break;
        const item = {
          gruppo,
          title: s.title,
          artist: s.artist,
          album: s.album,
          secs: s.secs,
          copertina: s.cover,
          anteprima: s.preview ? previewCandidate(s) : null,
          state: "searching",
          meta: null,
          candidates: []
        };
        nuovi.push(item);
        daCercare.push(item);
      }
      const idx = importList.indexOf(g.segnaposto);
      if (idx >= 0) importList.splice(idx, 1, ...nuovi);
      else importList.push(...nuovi);
      renderImports();
    }

    /* Prima cercavo un brano alla volta: con un artista da 30 canzoni si
       poteva stare "cerco..." per minuti. Adesso ne cerco 5 in contemporanea.
       Ogni brano e' protetto da try/catch e uso allSettled: se uno solo
       fallisce, gli altri devono continuare lo stesso. */
    const QUANTI_INSIEME = 5;
    const rimasti = daCercare.filter((x) => !x.removed);
    for (let i = 0; i < rimasti.length; i += QUANTI_INSIEME) {
      const lotto = rimasti.slice(i, i + QUANTI_INSIEME);
      avanta("Cerco " + Math.min(i + 1, rimasti.length) + "-" + Math.min(i + lotto.length, rimasti.length) +
        "/" + rimasti.length + "...");
      await Promise.allSettled(lotto.map(async (item) => {
        try {
          if (item.removed) return;
          /* senza artista scritto: 2-6 parole, e non piu' di 15 righe cosi' per
             batch, altrimenti la ricerca si allunga troppo */
          if (!item.artist && !item.anteprima && item.title &&
              item.title.indexOf(" ") > 0 && item.title.split(/\s+/).length <= 6 && sconosciuti < 15) {
            sconosciuti++;
            try {
              const indovinato = await conScadenza(itunesGuess(item.title), 12000, "scaduto");
              if (indovinato && indovinato.artist) {
                item.artist = indovinato.artist;
                if (titleMatch(item.title, indovinato.title).score < 90) item.title = indovinato.title;
                if (!item.album) item.album = indovinato.album;
                if (!item.copertina) item.copertina = indovinato.cover;
                if (!item.secs) item.secs = indovinato.secs;
                if (!item.anteprima) item.anteprima = previewCandidate(indovinato);
              }
            } catch (e) { /* nessun artista: vado avanti col titolo cosi' com'e' */ }
          }
          let dup = false;
          for (const k of trackKeys(item)) if (libKeys.has(k)) dup = true;
          if (dup) {
            item.state = "dupe";
            paintImport(item);
          } else {
            await cercaItemSingolo(item);
          }
        } catch (e) {
          // un brano che va in errore non deve bloccare gli altri: lo metto
          // "non disponibile" cosi' non resta fermo su "cerco..."
          item.state = "missing";
          item.tagMancato = "non riesco a cercarlo";
          try { paintImport(item); } catch (e2) { /* se anche questo fallisce, pazienza */ }
          // e lo scrivo nel registro del PC, cosi' gli errori si possono
          // leggere davvero invece di sparire
          segnalaErrore("ricerca fallita su \"" + (item.title || "?") + "\": " +
            ((e && (e.message || e)) || "errore sconosciuto"));
        }
      }));
      await new Promise((r) => setTimeout(r, 80));
    }

    /* Rete di sicurezza: se per qualunque motivo qualche brano e' rimasto
       su "cerco...", lo chiudo qui. Cosi' la lista non mostra mai righe
       ferme, e l'utente puo' riprovare con il tasto Riprova. */
    for (const it of importList) {
      if (it.state === "searching" && !it.removed) {
        it.state = "missing";
        it.tagMancato = "ricerca interrotta";
        try { paintImport(it); } catch (e) { /* noop */ }
      }
    }

    const auto = importList.filter((x) => x.state === "ready").length;
    if (auto) status.textContent = "Scarico " + auto + " brani trovati...";
    await autoImportAll();

    const done = importList.filter((x) => x.state === "done").length;
    const dupes = importList.filter((x) => x.state === "dupe").length;
    const miss = importList.filter((x) => x.state === "missing").length;
    const choose = importList.filter((x) => x.state === "choose").length;
    const errs = importList.filter((x) => x.state === "error").length;
    const daImportare = importList.filter((x) => x.state === "found").length;
    status.textContent = "Importati " + done + " · da scegliere " + choose + " · già presenti " + dupes +
      " · non disponibili " + miss + (errs ? " · errori " + errs : "") +
      (daImportare ? " · " + daImportare + " canzoni pronte da importare" : "");
    searching = false;
    $("btnFind").disabled = false;
  }

  async function doOcr(file) {
    const bar = $("ocrBar");
    const fill = $("ocrFill");
    const status = $("ocrStatus");
    bar.hidden = false;
    status.hidden = false;
    fill.classList.remove("err");
    fill.style.width = "0%";
    status.textContent = "Preparo il riconoscimento...";
    $("btnOcr").disabled = true;
    try {
      status.textContent = "Preparo l'immagine...";
      const prepared = await preprocessImage(file);
      status.textContent = "Leggo lo screenshot...";
      const text = await runOcr(prepared, (label, p) => {
        fill.style.width = Math.round(p * 100) + "%";
        status.textContent = label + " " + Math.round(p * 100) + "%";
      });
      $("importText").value = text.trim();
      const n = parseImportText(text).length;
      status.textContent = n
        ? "Riconosciute " + n + " righe: correggi quelle sbagliate, poi cerca."
        : "Non ho capito il testo: scrivi i brani a mano qui sotto.";
    } catch (e) {
      status.textContent = "OCR non disponibile (" + e.message + "): puoi scrivere i titoli a mano.";
    }
    $("btnOcr").disabled = false;
  }

  function openImport() {
    $("importTarget").textContent = "Sta scaricando nella libreria di " + profile + ".";
    $("importPanel").hidden = false;
    document.body.classList.add("no-scroll");
  }

function closeImport() {
    fermaAnteprima();                 // l'anteprima non continua a suonare a schermo chiuso
    $("importPanel").hidden = true;
    document.body.classList.remove("no-scroll");
}

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------- Eventi UI ---------- */
  $("btnPlay").addEventListener("click", togglePlay);
  $("btnNext").addEventListener("click", () => playNext());
  $("btnPrev").addEventListener("click", () => {
    if (totalDuration() > 3 && audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      playById(idBranoA(prevIndex()));
    }
  });

  $("btnShuffle").addEventListener("click", () => {
    shuffle = !shuffle;
    LS.set("mb.shuffle", shuffle);
    $("btnShuffle").classList.toggle("on", shuffle);
  });
  $("btnQueue").addEventListener("click", openQueue);
  $("queueClose").addEventListener("click", closeQueue);
  $("queuePanel").addEventListener("click", (e) => {
    if (e.target === $("queuePanel")) closeQueue();
  });
  $("btnRepeat").addEventListener("click", () => {
    repeat = !repeat;
    LS.set("mb.repeat", repeat);
    $("btnRepeat").classList.toggle("on", repeat);
  });

  $("btnLyrics").addEventListener("click", openLyrics);
  $("lyricsClose").addEventListener("click", closeLyrics);
  $("lyricsPanel").addEventListener("click", (e) => {
    if (e.target === $("lyricsPanel")) closeLyrics();
  });
  $("lyricsBody").addEventListener("pointerdown", () => {
    lyricsUserScrollAt = Date.now();
  });
  $("lyricsBody").addEventListener("wheel", () => {
    lyricsUserScrollAt = Date.now();
  });
  $("quickPanel").addEventListener("click", (e) => {
    if (e.target === $("quickPanel")) closeQuick();
  });

  const progressBar = $("playerProgress");
  function ratioFromX(clientX) {
    const rect = progressBar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }
  function scrubTo(clientX) {
    if (!audio || !isFinite(audio.duration)) return;
    const r = ratioFromX(clientX);
    const t = r * audio.duration;
    const fill = progressBar.querySelector(".fill");
    if (fill) fill.style.width = r * 100 + "%";
    progressBar.querySelector(".knob").style.left = r * 100 + "%";
    $("curTime").textContent = fmtTime(t);
    pendingSeek = t;
  }
  function endScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    progressBar.classList.remove("scrubbing");
    if (pendingSeek != null && audio) audio.currentTime = pendingSeek;
    pendingSeek = null;
    savePos();
  }
  progressBar.addEventListener("pointerdown", (e) => {
    if (!audio || !isFinite(audio.duration)) return;
    scrubbing = true;
    progressBar.classList.add("scrubbing");
    try { progressBar.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    scrubTo(e.clientX);
    e.preventDefault();
  });
  progressBar.addEventListener("pointermove", (e) => {
    if (scrubbing) scrubTo(e.clientX);
  });
  progressBar.addEventListener("pointerup", endScrub);
  progressBar.addEventListener("pointercancel", endScrub);

  $("btnSeekBack").addEventListener("click", () => seekBy(-15));
  $("btnSeekFor").addEventListener("click", () => seekBy(15));

$("btnFavFilter").addEventListener("click", () => {
    favOnly = !favOnly;
    $("btnFavFilter").classList.toggle("on", favOnly);
    render();
    });
  $("btnMaiAscoltati").addEventListener("click", () => {
    soloMaiAscoltati = !soloMaiAscoltati;
    $("btnMaiAscoltati").classList.toggle("on", soloMaiAscoltati);
    render();
    });
  $("btnFalliti").addEventListener("click", () => _stampaFalliti());
  $("fallitiClose").addEventListener("click", _chiudiPannelloFalliti);
  $("fallitiPanel").addEventListener("click", (e) => {
    if (e.target === $("fallitiPanel")) _chiudiPannelloFalliti();
  });
  $("fallitiCorpo").addEventListener("click", async (e) => {
    const t = e.target;
    if (!t) return;
    if (t.id === "btnRiprovaTutti") { _riprovaTutti(); return; }
    if (t.id === "btnDimenticaFalliti") {
      _salvaFalliti([]);
      _aggiornaBadgeFalliti();
      _stampaFalliti("Ho dimenticato la lista. Non riprovo piu' nulla.");
      return;
    }
    const riga = t.closest ? t.closest(".falliti-riga") : null;
    if (!riga) return;
    const url = decodeURIComponent(riga.getAttribute("data-url") || "");
    const voce = _falliti().find((x) => x.url === url);
    if (!voce) { _stampaFalliti(); return; }
    if (t.getAttribute("data-azione") === "togli") {
      _togliFallito(url);
      _stampaFalliti();
      return;
    }
    if (t.getAttribute("data-azione") === "riprova") {
      t.disabled = true;
      _stampaFalliti("Sto riprovando: " + (voce.titolo || voce.artista || "senza nome"));
      const ok = await _riprovaFallito(voce);
      _stampaFalliti(ok ? "Riuscito: " + (voce.titolo || voce.artista) : "Non ancora: riprova fra qualche minuto");
    }
  });

  $("btnImport").addEventListener("click", openImport);
  $("importClose").addEventListener("click", closeImport);
  $("importPanel").addEventListener("click", (e) => {
    if (e.target === $("importPanel")) closeImport();
  });
  $("btnPickImage").addEventListener("click", () => $("importImageInput").click());
  $("importImageInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const img = $("importPreview");
    img.src = URL.createObjectURL(file);
    img.hidden = false;
    const btn = $("btnOcr");
    btn.hidden = false;
    btn.onclick = () => doOcr(file);
  });
  $("btnFind").addEventListener("click", runSearch);
  $("importAudioInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const item = importActive;
    e.target.value = "";
    if (!file || !item) return;
    item.state = "downloading";
    paintImport(item);
    if (item.el) item.el.prog.hidden = false;
    try {
      const blob = await readFileWithProgress(file, (ratio, got) => {
        if (!item.el) return;
        item.el.fill.classList.remove("err");
        item.el.fill.style.width = Math.round(ratio * 100) + "%";
        item.el.bytes.textContent = fmtBytes(got);
      });
      item.meta = Object.assign({}, item.meta || {}, {
        title: item.title,
        artist: item.artist,
        album: item.album || "",
        license: (item.meta && item.meta.license) || "",
        source: "file locale"
      });
      await finishImport(item, blob, "file locale");
    } catch (err) {
      item.state = "error";
      if (item.el) item.el.bytes.textContent = err.message;
      paintImport(item);
    }
  });

  $("fab").addEventListener("click", () => fileInput.click());
  /* Cambio ordinamento: il brano di un artista gia' presente finisce subito
     nel suo gruppo, senza dover rifare niente. */
  const btOrdina = $("btnOrdina");
  if (btOrdina) {
    btOrdina.addEventListener("click", () => {
      const i = ORDINAMENTI.findIndex((o) => o.id === ordinamento);
      const prossimo = ORDINAMENTI[(i + 1) % ORDINAMENTI.length];
      ordinamento = prossimo.id;
      LS.set("mb.ordine", ordinamento);
      segnalaErrore("ordine cambiato: " + prossimo.nome);
      render();
    });
    ordinamento = LS.get("mb.ordine", "artista");
  }
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = "";
  });

  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim();
    render();
  });

  $("btnRefresh").addEventListener("click", async () => {
    toast("Aggiorno...");
    try {
      if (swReg) await swReg.update();
    } catch (e) { /* noop */ }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* noop */ }
    setTimeout(() => window.location.reload(), 400);
  });

  let offlineBusy = false;
  let offlineAbort = null;

  async function appCache() {
    if (!("caches" in window)) return null;
    try {
      const keys = await caches.keys();
      if (!keys.length) return null;
      for (const k of keys) {
        const c = await caches.open(k);
        const hit = await c.match("app.js");
        if (hit) return c;
      }
      const recenti = keys.slice().sort();
      return await caches.open(recenti[recenti.length - 1]);
    } catch (e) {
      return null;
    }
  }

  function renderOfflineRows(rows) {
    const box = $("offlineList");
    box.innerHTML = "";
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "off-row";
      const name = document.createElement("div");
      name.className = "off-name";
      name.textContent = r.title;
      const bar = document.createElement("div");
      bar.className = "off-bar";
      const fill = document.createElement("span");
      bar.appendChild(fill);
      const state = document.createElement("div");
      state.className = "off-state" + (r.state === "ok" ? " ok" : r.state === "run" ? " run" : r.state === "err" ? " err" : "");
      state.textContent = r.label;
      row.appendChild(name);
      row.appendChild(bar);
      row.appendChild(state);
      box.appendChild(row);
      r.el = { fill, state, bar };
    }
  }

  async function scanOffline() {
    const cache = await appCache();
    if (!cache) {
      $("offlineSub").textContent = "Non riesco a preparare le canzoni offline su questo browser";
      return [];
    }
    const rows = [];
    for (const t of tracks) {
      if (!t.builtin) {
        rows.push({ title: t.title, state: "ok", label: "sul telefono", el: null, track: t });
        continue;
      }
      let cached = false;
      try { cached = !!(await cache.match(t.url)); } catch (e) { cached = false; }
      rows.push({
        title: t.title,
        state: cached ? "ok" : "todo",
        label: cached ? "pronta" : "da scaricare",
        el: null,
        track: t
      });
    }
    renderOfflineRows(rows);
    const mancanti = rows.filter((r) => r.state === "todo").length;
    $("offlineSub").textContent = mancanti
      ? mancanti + (mancanti === 1 ? " canzone da scaricare" : " canzoni da scaricare")
      : "Tutte le canzoni sono gia' pronte per offline";
    return rows;
  }

  async function cacheTrack(row, cache) {
    const url = row.track.url;
    row.state = "run";
    row.label = "0%";
    if (row.el) {
      row.el.state.className = "off-state run";
      row.el.state.textContent = "0%";
    }
    try {
      const res = await fetch(url, { signal: offlineAbort.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const total = Number(res.headers.get("content-length") || 0);
      let blob;
      if (res.body) {
        const reader = res.body.getReader();
        const chunks = [];
        let got = 0;
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          chunks.push(part.value);
          got += part.value.byteLength;
          const pct = total ? Math.min(99, Math.round((got / total) * 100)) : 0;
          if (row.el) {
            row.el.fill.style.width = pct + "%";
            row.el.state.textContent = total ? pct + "%" : fmtBytes(got);
          }
        }
        blob = new Blob(chunks, { type: res.headers.get("content-type") || "audio/mpeg" });
      } else {
        blob = await res.blob();
      }
      await cache.put(url, new Response(blob, {
        status: 200,
        headers: { "Content-Type": blob.type || "audio/mpeg", "Content-Length": String(blob.size) }
      }));
      row.state = "ok";
      row.label = "pronta";
      if (row.el) {
        row.el.fill.style.width = "100%";
        row.el.state.className = "off-state ok";
        row.el.state.textContent = "pronta";
      }
    } catch (e) {
      if (e && e.name === "AbortError") {
        row.state = "todo";
        row.label = "da scaricare";
        if (row.el) {
          row.el.fill.style.width = "0%";
          row.el.state.className = "off-state";
          row.el.state.textContent = "da scaricare";
        }
        return;
      }
      row.state = "err";
      row.label = "errore";
      if (row.el) {
        row.el.state.className = "off-state err";
        row.el.state.textContent = "errore";
      }
    }
  }

  async function downloadAllOffline() {
    if (offlineBusy) {
      if (offlineAbort) offlineAbort.abort();
      offlineBusy = false;
      $("btnOfflineAll").textContent = "Scarica tutte";
      toast("Scaricamento fermato");
      return;
    }
    const cache = await appCache();
    if (!cache) {
      toast("Offline non disponibile qui");
      return;
    }
    const rows = (await scanOffline()).filter((r) => r.state === "todo");
    if (!rows.length) {
      toast("Sono gia' tutte pronte");
      return;
    }
    offlineBusy = true;
    offlineAbort = new AbortController();
    $("btnOfflineAll").textContent = "Ferma";
    let idx = 0;
    let fatto = 0;
    const worker = async () => {
      for (;;) {
        const i = idx++;
        if (i >= rows.length) return;
        await cacheTrack(rows[i], cache);
        fatto++;
        const rimaste = rows.length - fatto;
        $("offlineSub").textContent = "Scarico " + fatto + "/" + rows.length + (rimaste ? " (restano " + rimaste + ")" : "");
      }
    };
    const n = Math.min(2, rows.length);
    const runners = [];
    for (let k = 0; k < n; k++) runners.push(worker());
    await Promise.all(runners);
    offlineBusy = false;
    offlineAbort = null;
    $("btnOfflineAll").textContent = "Scarica tutte";
    const errori = rows.filter((r) => r.state === "err").length;
    toast(errori ? "Fatto con " + errori + " errori" : "Fatto: canzoni pronte offline");
    await scanOffline();
  }

  async function offlineSpaceInfo() {
    let txt = "";
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (est && est.usage) {
          txt = "Spazio usato dall'app: " + fmtBytes(est.usage) +
            (est.quota ? " (ne puoi usare " + fmtBytes(est.quota) + ")" : "");
        }
      }
    } catch (e) { /* noop */ }
    if (!txt) txt = "Le canzoni offline occupano memoria sul telefono (circa 60 MB per tutte).";
    $("offlineSpace").textContent = txt;
  }

  async function freeOffline() {
    const cache = await appCache();
    if (!cache) {
      toast("Offline non disponibile qui");
      return;
    }
    let tolti = 0;
    try {
      const reqs = await cache.keys();
      for (const r of reqs) {
        let pathname = "";
        try { pathname = new URL(r.url).pathname; } catch (e) { pathname = r.url; }
        if (/\.mp3$/i.test(pathname)) {
          await cache.delete(r);
          tolti++;
        }
      }
    } catch (e) { /* noop */ }
    await scanOffline();
    await offlineSpaceInfo();
    toast(tolti ? tolti + " canzoni liberate" : "Non c'era niente da liberare");
  }

  let cachedSongs = new Set();
  let cloudBusy = false;

  function absUrl(u) {
    try { return new URL(u, location.href).href; } catch (e) { return u; }
  }

  async function refreshCachedSongs() {
    const cache = await appCache();
    if (!cache) return;
    const set = new Set();
    try {
      const reqs = await cache.keys();
      for (const r of reqs) {
        let pathname = "";
        try { pathname = new URL(r.url).pathname; } catch (e) { pathname = r.url; }
        if (/\.mp3$/i.test(pathname)) set.add(r.url);
      }
    } catch (e) { /* noop */ }
    cachedSongs = set;
    render();
  }

  function isCached(t) {
    if (!t) return true;
    if (!t.builtin) return true;
    return cachedSongs.has(absUrl(t.url));
  }

  async function fetchToCache(url, cache, onProgress) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const total = Number(res.headers.get("content-length") || 0);
    let blob;
    if (res.body) {
      const reader = res.body.getReader();
      const chunks = [];
      let got = 0;
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        chunks.push(part.value);
        got += part.value.byteLength;
        if (onProgress) onProgress(total ? got / total : 0, got);
      }
      blob = new Blob(chunks, { type: res.headers.get("content-type") || "audio/mpeg" });
    } else {
      blob = await res.blob();
    }
    await cache.put(url, new Response(blob, {
      status: 200,
      headers: { "Content-Type": blob.type || "audio/mpeg", "Content-Length": String(blob.size) }
    }));
    return blob.size;
  }

  async function cacheOneTrack(t, el) {
    if (cloudBusy || !t || !t.builtin) return;
    cloudBusy = true;
    if (el) {
      el.classList.add("run");
      el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z"/></svg>';
    }
    try {
      const cache = await appCache();
      if (!cache) {
        throw new Error("il browser non ha piu' spazio per le canzoni offline: libera memoria o tocca piu' tardi");
      }
      await fetchToCache(t.url, cache, (ratio) => {
        if (el) el.style.background = ratio ? "var(--accent2)" : "";
      });
      if (el) {
        el.classList.remove("run");
        el.classList.add("ok");
        el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.6 16.6 5 12l1.4-1.4 3.2 3.2 8-8L19 7.2l-9.4 9.4Z"/></svg>';
      }
      toast(t.title + " pronta per offline");
    } catch (e) {
      if (el) {
        el.classList.remove("run");
        el.classList.add("err");
      }
      toast("Download non riuscito: " + e.message);
    } finally {
      cloudBusy = false;
      await refreshCachedSongs();
    }
  }

  let checkingSongs = false;
  const BUILTIN_RE = /\{\s*title:\s*"((?:[^"\\]|\\.)*)",\s*file:\s*"(songs\/track-\d+\.mp3)",\s*artist:\s*"((?:[^"\\]|\\.)*)"(?:,\s*profile:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;

  function parseBuiltinFrom(text) {
    const start = text.indexOf("const BUILTIN = [");
    if (start < 0) return null;
    const end = text.indexOf("];", start);
    if (end < 0) return null;
    const block = text.slice(start, end);
    const out = [];
    const re = new RegExp(BUILTIN_RE.source, "g");
    let m;
    while ((m = re.exec(block))) {
      out.push({
        title: JSON.parse('"' + m[1] + '"'),
        file: m[2],
        artist: JSON.parse('"' + m[3] + '"'),
        profile: m[4] ? JSON.parse('"' + m[4] + '"') : DEFAULT_PROFILE
      });
    }
    return out;
  }

  async function checkForNewSongs() {
    if (checkingSongs) return;
    checkingSongs = true;
    try {
      const res = await fetch("app.js", { cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      const parsed = parseBuiltinFrom(text);
      if (!parsed || !parsed.length) return;
      const mine = parsed.filter((b) => (b.profile || DEFAULT_PROFILE) === profile);
      const remoteFiles = mine.map((b) => b.file);
      const localBuiltin = tracks.filter((t) => t.builtin);
      const localFiles = localBuiltin.map((t) => t.url);
      const aggiunte = mine.filter((b) => localFiles.indexOf(b.file) < 0);
      const tolte = localFiles.filter((f) => remoteFiles.indexOf(f) < 0);

      // Una canzone che manca al sito puo' sparire solo a meta' di un aggiornamento:
      // la tolgo solo se la vedo assente DUE controlli di fila (piu' o meno 2 minuti),
      // cosi' un aggiornamento o una copia vecchia non cancella mai brani validi.
      const viste = LS.get("mb.senza", []);
      const confermate = tolte.filter((f) => viste.indexOf(f) >= 0);
      if (tolte.length) LS.set("mb.senza", tolte);
      else LS.remove("mb.senza");

      if (confermate.indexOf(audio && audio.src ? audio.src.replace(location.href, "") : "") >= 0) return;

      if (!aggiunte.length && !confermate.length) return;

      BUILTIN.length = 0;
      for (const b of parsed) {
        BUILTIN.push({ title: b.title, file: b.file, artist: b.artist, profile: b.profile });
      }
      for (const t of localBuiltin) {
        if (remoteFiles.indexOf(t.url) < 0 && confermate.indexOf(t.url) < 0) {
          BUILTIN.push({ title: t.title, file: t.url, artist: t.artist, profile: profile });
        }
      }
      await loadCovers();
      await loadAll();
      refreshCachedSongs();
      if (aggiunte.length) {
        toast((aggiunte.length === 1 ? "Nuova canzone: " : "Nuove canzoni: ") + aggiunte.map((b) => b.title).join(", ").slice(0, 60));
      }
      if (confermate.length) {
        toast(confermate.length === 1 ? "Una canzone non c'e' piu'" : confermate.length + " canzoni non ci sono piu'");
      }
    } catch (e) { /* noop */ } finally {
      checkingSongs = false;
    }
  }

  async function openOffline() {
    $("offlinePanel").hidden = false;
    syncNoScroll();
    $("offlineList").innerHTML = "";
    await scanOffline();
    await offlineSpaceInfo();
  }

  function closeOffline() {
    if (offlineBusy && offlineAbort) {
      offlineAbort.abort();
      offlineBusy = false;
    }
    $("offlinePanel").hidden = true;
    syncNoScroll();
  }

  $("btnOffline").addEventListener("click", openOffline);
    $("btnStatistiche").addEventListener("click", apriStatistiche);
    $("statsClose").addEventListener("click", chiudiStatistiche);
      $("statsPanel").addEventListener("click", (e) => {
      if (e.target === $("statsPanel")) chiudiStatistiche();
      });
      $("btnCopertine").addEventListener("click", cercaTutteLeCopertine);
      $("coverClose").addEventListener("click", _chiudiPannelloCopertine);
      $("coverPanel").addEventListener("click", (e) => {
      if (e.target === $("coverPanel")) _chiudiPannelloCopertine();
      });
  $("offlineClose").addEventListener("click", closeOffline);
  $("offlinePanel").addEventListener("click", (e) => {
    if (e.target === $("offlinePanel")) closeOffline();
  });
  $("btnOfflineAll").addEventListener("click", downloadAllOffline);
  $("btnOfflineFree").addEventListener("click", freeOffline);
  $("btnProfile").addEventListener("click", openProfile);
  $("profileClose").addEventListener("click", closeProfile);
  $("profilePanel").addEventListener("click", (e) => {
    if (e.target === $("profilePanel")) closeProfile();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (audio) {
        syncPlayUI();
        updateMediaSession();
      }
      if (swReg) swReg.update().catch(() => {});
      checkForNewSongs();
    }
    savePos();
  });
  setInterval(() => {
    if (!document.hidden) checkForNewSongs();
  }, 60000);
  window.addEventListener("pagehide", savePos);
  window.addEventListener("resize", updatePlayerHeight);
  window.addEventListener("orientationchange", updatePlayerHeight);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", updatePlayerHeight);
  setInterval(() => {
    if (swReg) swReg.update().catch(() => {});
  }, 180000);

  /* ---------- Volume ---------- */
  let volumePct = LS.get("mb.vol", 100);
  let volumeBeforeMute = 100;
  function updateVolumeUI() {
    const s = $("volSlider");
    if (s) s.value = String(volumePct);
    const b = $("btnVolIcon");
    if (b) b.classList.toggle("muted", volumePct === 0);
  }
  function setVolume(v) {
    volumePct = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    if (volumePct > 0) volumeBeforeMute = volumePct;
    if (audio) audio.volume = volumePct / 100;
    LS.set("mb.vol", volumePct);
    updateVolumeUI();
  }
  $("volSlider").addEventListener("input", (e) => setVolume(e.target.value));
  $("btnVolIcon").addEventListener("click", () => {
    if (volumePct > 0) setVolume(0);
    else setVolume(volumeBeforeMute || 100);
  });

  /* ---------- Avvio ---------- */
  (async function init() {
    audio = createAudio();
    audio.volume = volumePct / 100;
    updateVolumeUI();
    setPlaybackState("none");
    profile = LS.get("mb.profile", DEFAULT_PROFILE) || DEFAULT_PROFILE;
    if (profile === "Fratello") profile = OTHER_PROFILE;
    profiles = LS.get("mb.profiles", [DEFAULT_PROFILE]);
    queue = (LS.get("mb.queue", []) || []).filter((x) => typeof x === "string");
    if (profiles.indexOf("Fratello") >= 0) {
      profiles = profiles.map((p) => (p === "Fratello" ? OTHER_PROFILE : p));
    }
    if (profiles.indexOf(profile) < 0) profiles.push(profile);
    const migrated = profileState(profile);
    if (!allState()[profile] && LS.get("mb.hidden", null)) {
      migrated.hidden = LS.get("mb.hidden", []);
      migrated.favs = LS.get("mb.favs", []);
      migrated.last = LS.get("mb.last", null);
      migrated.time = LS.get("mb.pos." + migrated.last, 0);
      writeProfileState(profile, migrated);
    }
    const st =     loadProfileState();
    updateProfileButton();
    $("appVer").textContent = "v" + APP_VERSION;
  // Scrivo la versione anche nella schermata di ricerca: se la pagina e' vecchia
  // la vedi subito, senza dover andare a cercare la versione nel menu'.
  try {
    const vp = $("versionePagina");
    if (vp) vp.textContent = "pagina v" + APP_VERSION;
  } catch (e) { /* noop */ }
    try {
      db = await openDB();
    } catch (e) {
      console.warn("DB offline su questo browser", e);
      db = null;
    }
    await loadLyrics();
    await loadCovers();
    if (db) await loadLocalLyrics();
  await loadAll();
  recuperaCopertineMancanti();
  refreshCachedSongs();
  /* Appena aperta la pagina, condivido da solo i brani che esistono solo qui:
     non serve ricordarsi di fare niente. Se il PC non c'e' riprovo al prossimo
     avvio, e intanto i brani restano al sicuro qui. */
setTimeout(() => { condividiBraniLocali(); }, 1200);
  _avviaStatistiche();
  /* Il numero della versione sempre visibile in alto: e' successo piu' volte
     che il browser restava su una versione vecchia e sembrava che gli
     aggiornamenti non funzionassero. Con questo numero lo vedo subito. */
  try {
    const vf = $("verBadge");
    if (vf) {
      vf.textContent = String(APP_VERSION).replace(/^6\.(\d+).*$/, "6.$1");
      vf.title = "Versione in uso: " + APP_VERSION + " (tocca per ricaricare)";
      vf.onclick = () => window.location.reload(true);
    }
  } catch (e) { /* noop */ }
  /* niente: la finestra dei nascosti e' stata tolta */
    updatePlayerHeight();
    setTimeout(updatePlayerHeight, 300);

    shuffle = LS.get("mb.shuffle", false);
    repeat = LS.get("mb.repeat", false);
    $("btnShuffle").classList.toggle("on", shuffle);
    $("btnRepeat").classList.toggle("on", repeat);

    const lastTrack = st.last ? tracks.find((t) => t.id === st.last) : null;
    if (lastTrack) {
      currentId = lastTrack.id;
      // anche riaprendo la app il brano riparte da capo, non da meta'
      const restorePos = 0;
      audio.src = lastTrack.url;
      audio.addEventListener("loadedmetadata", () => {
        if (restorePos > 0 && isFinite(audio.duration)) {
          try { audio.currentTime = Math.min(restorePos, Math.max(0, audio.duration - 1)); } catch (e) { /* noop */ }
        }
        updateProgressUI(audio.currentTime || 0, audio.duration || 0);
      }, { once: true });
      setHud();
      updateProgressUI(restorePos || 0, 0);
    }

    updateMediaSession();

    if ("serviceWorker" in navigator) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        toast("Aggiornamento pronto");
        setTimeout(() => window.location.reload(), 500);
      });
navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
      swReg = reg;
      /* Controllo gli aggiornamenti OGNI volta che apri la pagina, non solo
         se non c'e' un controller: prima l'aggiornamento partiva a caso e il
         browser restava su una versione vecchia anche per giorni. */
      try { reg.update(); } catch (e) { /* noop */ }
      /* e ogni 10 minuti, se la pagina resta aperta */
      setInterval(() => { try { reg.update(); } catch (e) { /* noop */ } }, 600000);
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast("Aggiornamento disponibile");
            }
          });
        }
      });
    }).catch((err) => console.warn("SW fallito", err));
    }

    /* Controllo periodico: la pagina aperta sul telefono o sul PC deve
       accorgersi da sola dei brani nuovi che arrivano dagli altri
       dispositivi. Prima controllavo solo quando aprivi la pagina, quindi se
       la lasciavi aperta non si aggiornava mai. Ora ogni 60 secondi guardo
       online se ci sono piu' brani, e se ci sono ricarico da solo.
       Non ricarico pero' mentre stai scaricando o suonando: in quel caso ti
       mostro un avviso e aggiorno quando sei fermo. */
    let _stoControllando = false;
    function branoInCorso() {
      try {
        if (importList && importList.some((x) => x && x.state === "downloading")) return true;
      } catch (e) { /* noop */ }
      try { if (offlineBusy) return true; } catch (e2) { /* noop */ }
      try { if (anteprimaAudio && !anteprimaAudio.paused) return true; } catch (e3) { /* noop */ }
      return false;
    }
    function numeroBraniOnline(testo) {
      return (String(testo || "").match(/file:\s*"songs\/track-/g) || []).length;
    }
    function avvisoAggiornamento(testo) {
      let avviso = document.getElementById("avviso-vecchia");
      if (!avviso) {
        avviso = document.createElement("div");
        avviso.id = "avviso-vecchia";
        avviso.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:99;" +
          "background:#132a1f;border:1px solid #37e6a6;color:#c8ffe6;padding:10px 12px;" +
          "border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.5)";
        document.body.appendChild(avviso);
      }
      avviso.textContent = testo;
      avviso.onclick = () => {
        avviso.textContent = "Aggiorno...";
        if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((r) => r && r.update());
        setTimeout(() => window.location.reload(true), 900);
      };
    }
    function controllaAggiornamenti() {
      if (_stoControllando) return;
      if (document.hidden) return;              // non aggiorno la pagina che non guardi
      if (!navigator.onLine) return;
      _stoControllando = true;
      let miei = 0;
      try { miei = (typeof BUILTIN !== "undefined" && BUILTIN.length) ? BUILTIN.length : 0; } catch (e) { miei = 0; }
      fetch("app.js?t=" + Date.now(), { cache: "no-store" })
        .then((r) => r.ok ? r.text() : "")
        .then((txt) => {
          _stoControllando = false;
          if (!txt) return;
          const suoi = numeroBraniOnline(txt);
          const m = /APP_VERSION\s*=\s*"([\d.]+)"/.exec(txt);
          const versioneNuova = !!(m && m[1] !== String(APP_VERSION));
          const braniNuovi = suoi > miei;
          if (!braniNuovi && !versioneNuova) return;
          const che = [];
          if (braniNuovi) che.push((suoi - miei) + (suoi - miei === 1 ? " brano nuovo" : " brani nuovi"));
          if (versioneNuova) che.push("versione " + (m ? m[1] : "?"));
          segnalaErrore("aggiornamento disponibile: " + che.join(" e ") +
            " (qui " + miei + " brani, online " + suoi + ")");
          if (branoInCorso()) {
            avvisoAggiornamento("C'è " + che.join(" e ") + ": aggiorno quando finisci.");
            return;
          }
          if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistration().then((r) => r && r.update());
          }
          setTimeout(() => window.location.reload(true), 1200);
        })
        .catch(() => { _stoControllando = false; });
    }
    setInterval(controllaAggiornamenti, 60000);
    setTimeout(controllaAggiornamenti, 8000);

  })();
})();
