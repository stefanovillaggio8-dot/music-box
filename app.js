"use strict";

(function () {
  const BUILTIN = [
      { title: "SOTTOGONNA", file: "songs/track-1.mp3", artist: "BLANCO", profile: "Ste" },
      { title: "QUANTO FORTE TI PENSAVO", file: "songs/track-2.mp3", artist: "Madame", profile: "Ste" },
      { title: "Sono Ok", file: "songs/track-4.mp3", artist: "XCarme", profile: "Ste" },
      { title: "SWAG MUSIC", file: "songs/track-5.mp3", artist: "Artie 5ive", profile: "Ste" },
      { title: "Kid Yugi x Lil Peep MASHUP", file: "songs/track-6.mp3", artist: "Kid Yugi / Lil Peep", profile: "Ste" },
      { title: "Star Shopping", file: "songs/track-7.mp3", artist: "Lil Peep", profile: "Ste" },
      { title: "Malpensa", file: "songs/track-8.mp3", artist: "G.Mineiro, Flatpearl, Succo", profile: "Ste" },
      { title: "LA CITTÀ", file: "songs/track-9.mp3", artist: "MOSTRO", profile: "Ste" },
      { title: "CIGNO NERO RMX (Nayt, Frah Quintale, Tony Boy)", file: "songs/track-10.mp3", artist: "Nayt / Frah Quintale / Tony Boy", profile: "Ste" },
      { title: "Romantici Terroni", file: "songs/track-11.mp3", artist: "SAITTA", profile: "Ste" },
      { title: "s!r!", file: "songs/track-12.mp3", artist: "thasup", profile: "Ste" },
      { title: "Victoria", file: "songs/track-13.mp3", artist: "Tony Boy", profile: "Ste" },
      { title: "Un mondo a parte (Visual)", file: "songs/track-14.mp3", artist: "Jovanotti", profile: "Ste" },
      { title: "Sogni Appesi", file: "songs/track-15.mp3", artist: "Ultimo", profile: "Ste" },
      { title: "Exit", file: "songs/track-16.mp3", artist: "nayt", profile: "Ste" },
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
      { title: "sailor song", file: "songs/track-46.mp3", artist: "gigi perez", profile: "Ste" },
      { title: "nuts", file: "songs/track-47.mp3", artist: "Lil Peep", profile: "Ste" },
      { title: "NEON", file: "songs/track-48.mp3", artist: "Sfera Ebbasta & Shiva", profile: "Ste" },
    { title: "Mostro (Visual)", file: "songs/track-49.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "la mia storia tra le dita", file: "songs/track-50.mp3", artist: "gianluca grignani", profile: "Ste" },
    { title: "Animal I Have Become", file: "songs/track-51.mp3", artist: "Three Days Grace", profile: "Ste" },
    { title: "Somewhere I Belong", file: "songs/track-52.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "What I've Done", file: "songs/track-53.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Smells Like Teen Spirit", file: "songs/track-54.mp3", artist: "Nirvana", profile: "Ste" },
    { title: "Faint", file: "songs/track-55.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Numb", file: "songs/track-56.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Monster", file: "songs/track-57.mp3", artist: "Skillet", profile: "Ste" },
    { title: "Bring Me To Life", file: "songs/track-58.mp3", artist: "Evanescence", profile: "Ste" },
    { title: "Sweet Child O' Mine", file: "songs/track-59.mp3", artist: "Guns N' Roses", profile: "Ste" },
    { title: "Crawling", file: "songs/track-60.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "All I Wanted", file: "songs/track-61.mp3", artist: "Paramore", profile: "Ste" },
    { title: "In the End", file: "songs/track-62.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Runaway", file: "songs/track-63.mp3", artist: "Linkin Park", profile: "Ste" },
          { title: "Albachiara", file: "songs/track-69.mp3", artist: "Vasco Rossi", profile: "Ste" },
          { title: "Wonderwall", file: "songs/track-76.mp3", artist: "Oasis", profile: "Ste" },
          { title: "La Mia Storia Tra Le Dita (Feat. Annalisa)", file: "songs/track-71.mp3", artist: "Gianluca Grignani", profile: "Ste" },
          { title: "HO SBAGLIATO ANCORA", file: "songs/track-72.mp3", artist: "Chiello", profile: "Ste" },
          { title: "siLLy cUp", file: "songs/track-68.mp3", artist: "thasup", profile: "Ste" },
    { title: "dimmi che ce'", file: "songs/track-64.mp3", artist: "thasup", profile: "Ste" },
    { title: "In the End", file: "songs/track-65.mp3", artist: "Linkin Park", profile: "Ste" },
    /* Ste: qui sotto c'era anche { title: "thasup dimmi che c'", file:
   "songs/track-66.mp3" }. Era lo STESSO mp3 di "dimmi che ce'" (track-64),
   byte per byte: la stessa canzone due volte in libreria. Tolta. */
    { title: "carusi do sud", file: "songs/track-67.mp3", artist: "l'elfo", profile: "Ste" },
    { title: "nei treni la notte", file: "songs/track-73.mp3", artist: "frah quintale", profile: "Ste" },
    { title: "Dimmi Che C''", file: "songs/track-74.mp3", artist: "thasup", profile: "Ste" },
    { title: "stupido", file: "songs/track-75.mp3", artist: "massimo pericolo", profile: "Ste" },
    { title: "Spettri", file: "songs/track-77.mp3", artist: "nayt, 3D" },
    { title: "Memoria di uno sconfitto, pt. 2", file: "songs/track-78.mp3", artist: "Mostro" },
    { title: "G&V", file: "songs/track-79.mp3", artist: "ivanBì" },
    { title: "Da zero", file: "songs/track-80.mp3", artist: "nayt" },
    { title: "Gli occhi della tigre", file: "songs/track-81.mp3", artist: "nayt" },
    { title: "Bullet Ballet (feat. Artie 5ive)", file: "songs/track-87.mp3", artist: "Kid Yugi, Artie 5ive" },
    { title: "SOGNO AMERICANO", file: "songs/track-88.mp3", artist: "Artie 5ive" },
    { title: "Niente Canzoni D'Amore", file: "songs/track-89.mp3", artist: "Elodie" },
    { title: "Odi et Amo", file: "songs/track-90.mp3", artist: "Blake el Diablo" },
    { title: "uNa DiReZioNe giùSta", file: "songs/track-91.mp3", artist: "yungest Moonstar, Neffa, thasup" },
    { title: "Scale (con Luchè)", file: "songs/track-92.mp3", artist: "Night Skinny, Luchè" },
    { title: "oh 9od - feat. Nayt", file: "songs/track-93.mp3", artist: "thasup, nayt" },
    { title: "Doom", file: "songs/track-94.mp3", artist: "nayt, 3D" },
    { title: "Ballon d'Or (feat. Nayt)", file: "songs/track-95.mp3", artist: "Gemitaiz, nayt" },
    { title: "un'idea", file: "songs/track-96.mp3", artist: "nayt, 3D" },
    { title: "guerra dentro", file: "songs/track-97.mp3", artist: "nayt, 3D" },
    { title: "Cigno nero", file: "songs/track-98.mp3", artist: "Fedez, Francesca Michelini" },
    { title: "Se Piovesse Il Tuo Nome - con Calcutta", file: "songs/track-99.mp3", artist: "Elisa, Calcutta" },
    { title: "Chic", file: "songs/track-100.mp3", artist: "Izi" },
    { title: "molecole (interlude)", file: "songs/track-101.mp3", artist: "thasup" },
    { title: "Il Tuo Sorriso", file: "songs/track-102.mp3", artist: "Medy" },
    { title: "AIRFORCE (feat. Madame)", file: "songs/track-103.mp3", artist: "Massimo Pericolo, Crookers, Madame" },
    { title: "Striscia", file: "songs/track-105.mp3", artist: "TonyPitony" },
    { title: "MI PIACCIONO LE NERE", file: "songs/track-106.mp3", artist: "TonyPitony" },
    { title: "CULO", file: "songs/track-107.mp3", artist: "TonyPitony" },
    { title: "BALÙ - Acoustic Version", file: "songs/track-108.mp3", artist: "TonyPitony" },
    { title: "OCCHI MEI", file: "songs/track-109.mp3", artist: "thasup, Mara Sattei" },
    { title: "Non Abbiamo Età", file: "songs/track-110.mp3", artist: "Luchè" },
    { title: "Voodoo", file: "songs/track-111.mp3", artist: "Guè" },
    { title: "Concedimi", file: "songs/track-112.mp3", artist: "Matteo Romano" },
    { title: "INTRO (La Bella Vita)", file: "songs/track-113.mp3", artist: "Artie 5ive" },
    { title: "GIOVANNI", file: "songs/track-114.mp3", artist: "TonyPitony" },
    { title: "15 Piani", file: "songs/track-115.mp3", artist: "Sfera Ebbasta, Marracash" },
    { title: "Labirinto", file: "songs/track-116.mp3", artist: "Luchè" },
    { title: "Nessuna", file: "songs/track-117.mp3", artist: "Luchè" },
    { title: "Babydoll", file: "songs/track-118.mp3", artist: "Dominic Fike" },
    { title: "Baby Mama", file: "songs/track-119.mp3", artist: "Don Pero" },
    { title: "Lo So Che", file: "songs/track-120.mp3", artist: "Capo Plaza" },
    { title: "Scrivendo", file: "songs/track-121.mp3", artist: "nayt" },
    { title: "Vibe", file: "songs/track-122.mp3", artist: "Guè" },
    { title: "Distrutto", file: "songs/track-123.mp3", artist: "Carla Morrison" },
    { title: "marte", file: "songs/track-124.mp3", artist: "thasup" },
    { title: "mi @mio è f@ke", file: "songs/track-125.mp3", artist: "thasup" },
    { title: "slrl (feat. Lazza & Sfera Ebbasta)", file: "songs/track-126.mp3", artist: "thasup, Lazza, Sfera Ebbasta" },
    { title: "Hey There Delilah", file: "songs/track-127.mp3", artist: "Plain White T's" },
    { title: "STANOTTE (feat. Coez, Massimo Pericolo)", file: "songs/track-128.mp3", artist: "TY1, Coez, Massimo Pericolo" },
    { title: "CRUDELIA - Inervi", file: "songs/track-129.mp3", artist: "Marracash" },
    { title: "ADRENALINA", file: "songs/track-130.mp3", artist: "Samurai Jay, Vito Salamarca" },
    { title: "romantici", file: "songs/track-131.mp3", artist: "Tommaso Paradiso" },
    { title: "RUGGINE (con Chiello, Coez)", file: "songs/track-133.mp3", artist: "MACE, chiello, Coez" },
    { title: "TUTTO FUORI CONTROLLO (con Franco 126, Kid Yugi, IzI)", file: "songs/track-134.mp3", artist: "MACE, Kid Yugi, IzI, Franco126" },
    { title: "DAVVERODAVVERO", file: "songs/track-135.mp3", artist: "Artie 5ive", profile: "Ste" },
    { title: "Frosinone", file: "songs/track-136.mp3", artist: "Calcutta", profile: "Ste" },
    { title: "Ex Angelo", file: "songs/track-138.mp3", artist: "Kid Yugi, Sfera Ebbasta, Shablo" },
];

  const PALETTE = [
    "linear-gradient(135deg,#b06bff,#4fc3ff)",
    "linear-gradient(135deg,#ff7a9e,#ffb86b)",
    "linear-gradient(135deg,#37e6a6,#4fc3ff)",
    "linear-gradient(135deg,#ffb02e,#ff5c7a)"
  ];

  const $ = (id) => document.getElementById(id);
  const APP_NAME = "spotifynonavraiimieisoldi";
  const APP_VERSION = "6.204";

  let recovering = false;
  /* Questa "riparazione" non serve piu' e fa solo danni.
     Ste: il telefono perde i dati a ogni riavvio, e ho scoperto perche':
     questa funzione, ogni volta che si apriva l'app, cancellava TUTTE le
     cache (compresi i brani scaricati) e ricaricava la pagina. Non
     aggiustava niente di rotto: si limitava a distruggere. Gli aggiornamenti
     li fa gia' il service worker, quindi la lascio stare. */
  async function selfHeal() {
    return;
    /* eslint-disable-next-line no-unreachable */
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

  /* Non cancellare le cache offline a causa di un errore JavaScript generico:
     potrebbero contenere le canzoni scaricate dall'utente. Gli aggiornamenti
     vengono gestiti dal service worker e gli errori restano nella console. */
  const startedAt = Date.now();
  window.addEventListener("error", (event) => {
    if (Date.now() - startedAt < 8000) {
      console.warn("Errore durante l'avvio di Music Box; le cache offline sono state conservate.",
        event && event.message ? event.message : "");
    }
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
/* Le playlist vivono qui con gli altri dati dello schermo, NON piu' in
   basso: prima erano dichiarate dopo le funzioni che le usano, e se una
   di quelle veniva chiamata presto l'app partiva a meta' e la libreria
   risultava vuota (l'ho visto succedere dal telefono). */
let playlists = [];
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
      { nome: "Ari", cartella: "ari" },
      { nome: "Diego", cartella: "diego" }
    ];
  const DEFAULT_PROFILE = PROFILI[0].nome;
  /* Il tasto semplice "Scarica l'mp3 col PC" adesso salva anche una copia
     nella cartella del profilo: cosi' il brano finisce nella libreria
     condivisa e si vede anche dagli altri dispositivi. Prima restava solo in
     questo browser, e per questo si vedevano numeri diversi su PC e telefono. */
  const CARTELLA_PREDEFINITA = PROFILI[0].cartella;
  let profile = DEFAULT_PROFILE;
  /* ---------- Dove stanno i file mp3 ----------
     I brani NON stanno piu' dentro il sito: ci stanno in un deposito
     separato (music-box-brani). Motivo: dentro il sito facevano 200 MB e
     GitHub non riusciva piu' a costruire la pagina (ci ho messo due ore e
     poi falliva). Fuori dal sito la pagina pesa mezzo megabyte e si
     aggiorna in un minuto.

     La pagina che apri dal computer (quella locale) invece continua a
     leggere i brani dal disco, perche' li ha gia' li'. */
  const BRANI_ONLINE = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/";
  function _doveStaIlBrano(file) {
    const nome = String(file || "");
    if (!nome) return "";
    /* pagina locale: i brani sono sul disco, nessun bisogno di andare online */
    const qui = location.hostname;
    const inLocale = qui === "localhost" || qui === "127.0.0.1" || qui === "::1" ||
      qui.endsWith(".local") || /^100\./.test(qui) || qui.endsWith(".ts.net");
    if (inLocale) return nome;
    /* online: prendo il brano dal deposito della musica.
       ATTENZIONE: qui il nome va tenuto COME E', con la cartella
       "songs/". Prima facevo .replace(/^.*\//, "") che si mangiava la
       cartella, e l'app chiedeva "track-1.mp3" invece di
       "songs/track-1.mp3": il brano non partiva (404) e sembrava che
       l'app fosse rotta. */
    return BRANI_ONLINE + nome.replace(/^\/+/, "");
  }

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
    /* Le playlist stanno qui con il resto. Se il dato non e' un elenco
       (perche' viene da una versione vecchia), parto da vuoto invece di
       farmi fermare. */
    playlists = Array.isArray(st.playlists) ? st.playlists : [];
    return st;
  }

  function saveCurrentState() {
    writeProfileState(profile, {
      hidden: Array.from(hiddenTracks),
      favs: Array.from(favorites),
      playlists: Array.isArray(playlists) ? playlists : []
    });
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
  /* I nomi dei brani che Ste ha cambiato.
     Ste: "se cambio l'artista e riavvio il sito torna di prima". Con la
     finestra Diagnostica si e' visto che sul suo telefono la memoria del
     browser si svuota da sola al riavvio: il nome c'era subito dopo averlo
     cambiato, al riavvio era sparito. Percio' i nomi li tengo qui, dentro il
     database dei brani, che ha gia' tenuto le copertine e i testi senza
     perderne nessuno.

     NOTA importante: NON ho creato un magazzino nuovo e NON ho cambiato la
     versione del database. Prima l'avevo fatto (un "rinomini" nuovo, versione
     da 4 a 5) ed e' stato un errore: se sul telefono e' rimasta aperta la
     vecchia pagina, quella blocca l'aggiornamento del database, la nuova
     connessione resta appesa e i nomi non vengono scritti mai. Per questo il
     nome lo metto in un magazzino che esiste gia', senza toccare nulla. */
  const _ID_RINOMI = "__rinomini__";
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
    /* Ste: "se cambio l'artista e riavvio torna come prima".
       Prima, quando il brano NON aveva una rinomina, la funzione usciva
       subito e lasciava il nome com'era: pero' il nome era gia' stato
       cambiato in quel momento della sessione, quindi togliere una rinomina
       non faceva tornare indietro nulla fino al riavvio. Ora, se non c'e' una
       rinomina, ripristino il nome vero del brano, come fa la versione che
       lavora su tutta la lista. */
    if (!r || (!r.title && !r.artist)) {
      const orig = _originaleDi(t.id);
      if (orig) {
        if (orig.title) t.title = orig.title;
        if (orig.artist) t.artist = orig.artist;
      }
      return t;
    }
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

  /* Il posto dove i nomi vengono tenuti davvero.
     Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
     Sul suo telefono la memoria del browser (localStorage) non sopravvive: il
     nome sparisce e al riavvio il brano torna col nome vero. Perche' succede?
     Perche' il telefono non riesce a salvare niente da nessuna parte: il
     computer non e' raggiungibile (l'app non vede piu' la rete di casa) e
     l'altro servizio richiede una chiave che non e' stata messa.

     Per questo tengo i nomi anche in IndexedDB, che sul telefono e' molto piu'
     resistente della memoria del browser, e li rileggo da li' all'avvio.
     In pratica il nome non dipende piu' dalla rete. */
  /* Ste: "se cambio l'artista e riavvio il sito torna di prima". Con la
     finestra Diagnostica si e' visto che sul suo telefono la memoria del
     browser si svuota da sola al riavvio: il nome c'era subito dopo averlo
     cambiato, al riavvio era sparito. Quindi non mi fido piu' di lei.

     I nomi li tengo nel database dei brani, lo stesso dove gia' stanno le
     copertine e i testi: e' un posto che ha gia' tenuto i dati di Ste senza
     perdere niente, quindi regge anche lui. */
  async function _salvaRinomineSulDisco(mappa) {
    try {
      const d = db || await openDB();
      if (!d) return false;
      db = d;
      return await new Promise((fatto) => {
        try {
          /* Uso il magazzino dei testi, che esiste gia': non creo niente di
             nuovo e non cambio la versione del database, cosi' niente puo'
             bloccarsi. L'id e' un nome riservato, nessun brano puo' chiamarsi
             cosi', quindi non si confonde con niente. */
          const tx = d.transaction(DB_LYRICS, "readwrite");
          tx.objectStore(DB_LYRICS).put({ id: _ID_RINOMI, mappa: JSON.parse(JSON.stringify(mappa)) });
          tx.oncomplete = () => fatto(true);
          tx.onerror = () => fatto(false);
        } catch (e) { fatto(false); }
      });
    } catch (e) { return false; }
  }
  async function _leggiRinomineDalDisco() {
    try {
      const d = db || await openDB();
      if (!d) return null;
      db = d;
      return await new Promise((fatto) => {
        try {
          const tx = d.transaction(DB_LYRICS, "readonly");
          const chiedi = tx.objectStore(DB_LYRICS).get(_ID_RINOMI);
          chiedi.onsuccess = () => fatto((chiedi.result && chiedi.result.mappa) || null);
          chiedi.onerror = () => fatto(null);
        } catch (e) { fatto(null); }
      });
    } catch (e) { return null; }
  }
  /* Se la memoria del browser e' vuota ma sul disco ci sono dei nomi, li
     rimetto: e' il salvataggio che finora non c'era. */
  async function _ripristinaRinomini() {
    /* Ste: "se cambio l'artista e riavvio il sito torna di prima".
       Nella memoria del browser i nomi spariscono, quindi vanno cercati nel
       database. Se per un motivo non rispondono al primo tentativo (il
       telefono all'avvio e' lento e il database si apre dopo), riprovo qualche
       volta prima di darmi per perso: il nome rientra nella libreria senza che
       Ste debba toccare nulla. */
    for (let tentativo = 0; tentativo < 4; tentativo++) {
      try {
        const dalDisco = await _leggiRinomineDalDisco();
        if (dalDisco && typeof dalDisco === "object") {
          const mappa = nomiRinomati();
          let rimessi = 0;
          for (const k of Object.keys(dalDisco)) {
            const r = dalDisco[k];
            if (!r || (!r.title && !r.artist)) continue;
            const mia = mappa[k];
            if (!mia || mia.title !== (r.title || "") || mia.artist !== (r.artist || "")) {
              mappa[k] = { title: String(r.title || ""), artist: String(r.artist || "") };
              rimessi++;
            }
          }
          if (rimessi) { LS.set("mb.rinomini", mappa); return rimessi; }
          /* Niente da rimettere puo' voler dire due cose: che i nomi ci
             sono gia' (e va bene) oppure che il database e' ancora vuoto. In
             questo caso riprovo piu' tardi, perche' al primo colpo la pagina
             appena aperta spesso non trova niente. */
          if (tentativo === 0) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          return 0;
        }
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    return 0;
  }

  /* La diagnostica.
     Ste: "se cambio l'artista e riavvio il sito torna di prima". Per un pezzo
     non si capiva se il nome si perdeva nel telefono, sul sito o nel computer,
     e ogni volta che provavo a correggere tiravo fuori una supposizione.
     Questa finestra non indovina nulla: guarda davvero dove sono i dati e te
     li mostra. */
  async function _rigaDiagnostica(b) {
    let classe = "diag-ok", testo = "no";
    try {
      const v = await b();
      if (v && v.ok) { testo = v.s; classe = v.no ? "diag-no" : "diag-ok"; }
      else { testo = (v && v.s) || "no"; classe = "diag-no"; }
    } catch (e) { testo = "errore"; classe = "diag-no"; }
    return '<div class="diag-riga"><b>' + b.nome + '</b><span class="' + classe + '">' + testo + "</span></div>";
  }
  async function _apriDiagnostica() {
    const corpo = $("diagBody");
    const sopra = $("diagOverlay");
    if (!corpo || !sopra) return;
    sopra.hidden = false;
    corpo.innerHTML = "<p>Sto guardando...</p>";
    const qs = [];
    qs.push('<div class="diag-sep">versione</div>');
    qs.push('<div class="diag-riga"><b>in uso</b><span class="diag-ok">' + APP_VERSION + "</span></div>");
    const schermo = $("verBadge");
    if (schermo) qs.push('<div class="diag-riga"><b>numero in alto</b><span>' + (schermo.textContent || "?") + "</span></div>");

    qs.push('<div class="diag-sep">i nomi che ho cambiato</div>');
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const m = nomiRinomati();
      return { ok: true, s: Object.keys(m).length + " in memoria" };
    }, { nome: "nella memoria del browser" })));
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const d = await _leggiRinomineDalDisco();
      const n = d && typeof d === "object" ? Object.keys(d).length : 0;
      return { ok: n > 0, no: n === 0, s: n + " sul database del telefono" };
    }, { nome: "sul database del telefono" })));
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      try {
        const r = await fetch("./stato.json", { cache: "no-store" });
        const j = await r.json();
        const n = j && j.rinomini ? Object.keys(j.rinomini).length : 0;
        return { ok: n > 0, no: n === 0, s: n + " sul sito" };
      } catch (e) { return { ok: false, s: "sito non raggiungibile" }; }
    }, { nome: "sul sito" })));

    qs.push('<div class="diag-sep">col computer</div>');
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const base = await cercaPonte();
      return { ok: !!base, no: !base, s: base ? "risponde: " + base : "non raggiungibile" };
    }, { nome: "raggiungo il PC" })));
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const k = LS.get("mb.chiave", "");
      return { ok: !!k, no: !k, s: k ? "chiave presente" : "chiave mancante" };
    }, { nome: "servizio (funziona a PC spento)" })));

    qs.push('<div class="diag-sep">rete</div>');
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const onLine = navigator.onLine ? "collegato" : "senza rete";
      return { ok: navigator.onLine, no: !navigator.onLine, s: onLine };
    }, { nome: "telefono" })));
    corpo.innerHTML = qs.join("");
  }

  /* Ste: "ogni volta che riavvio devo rimettere la chiave" e "il nome torna
     come prima".
     La causa vera era una, e non era un difetto dell'app: Ste stava
     aprendo il sito nella navigazione PRIVATA di Safari. In privata Safari
     BUTTA TUTTA la memoria del sito quando chiudi la scheda: nomi dei brani,
     preferiti, e anche la chiave del servizio. E' esattamente quello che
     vedevamo: dopo il riavvio tutto spariva.

     Qui l'app lo scopre da sola e lo dice, cosi' non si perdono ore a
     cercare un bug che non c'e'. */
  function _scopriSeSeiInPrivata() {
    try {
      const segreto = "prova-" + Date.now();
      LS.set("mb.prova-memoria", segreto);
      setTimeout(() => {
        let sopravvive = false;
        try { sopravvive = LS.get("mb.prova-memoria", "") === segreto; } catch (e) { sopravvive = false; }
        try { LS.remove("mb.prova-memoria"); } catch (e) { /* noop */ }
        if (sopravvive) return;
        _mostraAvvisoPrivata();
      }, 2500);
    } catch (e) { /* noop */ }
  }
  function _mostraAvvisoPrivata() {
    try {
      if (document.getElementById("avviso-privata")) return;
      const b = document.createElement("div");
      b.id = "avviso-privata";
      b.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:130;" +
        "background:#3a2a10;border:1px solid #ffb347;color:#ffe9c9;padding:12px 14px;" +
        "border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.5)";
      b.textContent = "Stai usando la finestra PRIVATA di Safari: qui i dati non restano, " +
        "quindi i nomi che cambi e le preferenze si perdono. Apri l'app NON in privata " +
        "(solo dal collegamento normale) e tutto si salva da solo.";
      document.body.appendChild(b);
    } catch (e) { /* noop */ }
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
    /* Oltre che nella memoria del browser, che sul telefono spesso si perde,
       scrivo il nome nel database del telefono: li' resta anche se il
       browser dimentica, e al riavvio lo ritroviamo. */
    try { _salvaRinomineSulDisco(mappa); } catch (e) { /* noop */ }
    /* Lo metto anche sul sito: cosi' se il telefono dimentica (e capita),
       al riavvio il nome torna comunque, e vale anche sull'altro dispositivo. */
    try { _salvaStatoCondiviso(); } catch (e) { /* noop */ }
    applicaRinomine();
    render();
    /* Ste: "se cambio l'artista e riavvio il sito torna di prima".
       Prima scrivevo "Nome cambiato" e basta: sembrava tutto a posto, ma il
       nome restava solo sul telefono, e sul telefono quei dati spariscono
       (e' successo: e' sparita anche la chiave del servizio, che aveva messo
       lui prima). Adesso invece dico la verita': se non riesco a portare il
       nome fuori dal telefono, dico subito che deve stare sul Wi-Fi di casa,
       e intanto l'app continua a riprovare da sola. */
    try {
      if (typeof _statoCondivisoOk !== "undefined" && _statoCondivisoOk) {
        toast("Nome cambiato e salvato");
      } else {
        toast("Nome cambiato, MA non è ancora al sicuro: su questo telefono i\n" +
          "dati spariscono al riavvio. Collega il Wi-Fi di casa (o lascia il PC\n" +
          "acceso): l'app lo salva da sola appena può.", 9000);
      }
    } catch (e) { /* noop */ }
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

  /* ---------- Le mie librerie, e quelle degli altri ----------

   Ogni nome ha la sua libreria. Non e' una password e non e' un account: e'
   solo un nome, e serve a tenere separati i brani che hai aggiunto tu.
   E' quello che vuole Stefano: le canzoni sue restano sue.

   Due cose permettono di sentire anche qualche canzone degli altri, senza che
   all'altro sparisca niente:
   - l'interruttore "vedi anche le canzoni degli altri": le mostra tutte;
   - "Porta nella mia libreria" dalla pressione lunga: quel brano entra anche
     nella mia, e resta dov'e'.

   La lista dei brani "miei anche se non li ho aggiunti io" la tengo anche sul
   sito (stato.json), cosi' vale su ogni dispositivo.

   STANNO QUI, e non dentro loadAll: le usa anche l'interruttore nel pannello
   dei nomi, che sta fuori da li'. Prima erano dentro loadAll e quando lui
   premeva l'interruttore saltava un errore che bloccava l'app intera: spariva
   la libreria, l'interruttore non faceva niente e la X non chiudeva. */

const LS_MIEI = "mb.miei";
const LS_VEDI = "mb.vediTutti";

function _mieiCopiati() {
  try {
    const v = JSON.parse(LS.get(LS_MIEI, "{}"));
    const miei = (v && typeof v === "object") ? v : {};
    const lista = Array.isArray(miei[profile]) ? miei[profile] : [];
    return new Set(lista.map((x) => String(x || "")).filter(Boolean));
  } catch (e) { return new Set(); }
}

function _salvaMieiCopiati(lista) {
  try {
    const v = JSON.parse(LS.get(LS_MIEI, "{}"));
    const miei = (v && typeof v === "object") ? v : {};
    miei[profile] = [...new Set((lista || []).map((x) => String(x || "")).filter(Boolean))].sort();
    LS.set(LS_MIEI, JSON.stringify(miei));
  } catch (e) { /* noop */ }
}

function _vedoTutti() {
  try { return LS.get(LS_VEDI, "") === "si"; } catch (e) { return false; }
}

/* "Vedere" e "far suonare" sono due cose diverse.

   Se accendo "vedi anche le canzoni degli altri" me le fa SOLO vedere: quando
   poi una canzone finisce, proseguo con le mie (e con quelle delle playlist).
   Se invece voglio che suonino anche le loro, lo dico con l'interruttore
   "fai suonare anche le canzoni degli altri". */
const LS_SUONA = "mb.suonaTutti";

function _suonaTutti() {
  try { return LS.get(LS_SUONA, "") === "si"; } catch (e) { return false; }
}

/* Chiamato per ogni brano mentre carico la libreria. */
function _devoVedereBrano(eMio, b) {
  if (eMio) return true;
  if (_vedoTutti()) return true;
  /* l'id del brano e' b-track-<numero>, come lo chiama tutto il resto */
  const m = /songs\/track-(\d+)\.mp3$/.exec(String((b && b.file) || ""));
  if (!m) return false;
  return _mieiCopiati().has("b-track-" + m[1]);
}

  async function loadAll() {
  _diag("loadAll");
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

/* Ognuno vede la sua libreria, non quella degli altri: le canzoni di Ste
     sono sue. Per sentire qualche canzone degli altri si puo' accendere
     l'interruttore "vedi anche le canzoni degli altri", oppure tenere premuto
     una canzone altrui e scegliere "Porta nella mia libreria": quella la copia
     e basta, all'altro resta esattamente com'e'. */
    const builtin = BUILTIN
          .filter((b) => _devoVedereBrano((b.profile || DEFAULT_PROFILE) === profile, b))
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
        url: _doveStaIlBrano(b.file),
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


  /* Stesso brano due volte? Ne tengo uno solo.
     Prima confrontavo "artista|titolo" alla lettera, ma la libreria ripulisce
     i nomi (toglie l'artista dal titolo se e' ripetuto: "BLANCO - SOTTOGONNA"
     si vede come "SOTTOGONNA"). Quindi lo stesso brano, arrivato dal telefono
     col titolo gia' pulito, non veniva riconosciuto e finiva in lista due
     volte. Adesso uso stessoBrano(), che e' la funzione gia' pensata per
     questo e che sa anche tirare l'artista fuori dal titolo. */
    const visti = [];
    const senzaDuplicati = [];
    for (const t of (added || [])) {
      let doppio = -1;
      for (let k = 0; k < senzaDuplicati.length; k++) {
        const g = senzaDuplicati[k];
        if (stessoBrano(t, g) || (normKey(t.artist) + "|" + normKey(t.title) === normKey(g.artist) + "|" + normKey(g.title))) {
          doppio = k; break;
        }
      }
      if (doppio < 0) { senzaDuplicati.push(t); visti.push(t); continue; }
      /* tengo il brano piu' pesante: di solito e' quello intero */
      if ((t.size || 0) > (senzaDuplicati[doppio].size || 0)) senzaDuplicati[doppio] = t;
    }
  tracks = builtin.concat(senzaDuplicati);
    /* I nomi li applico PRIMA di controllare i doppioni. Prima era il
       contrario: il controllo guardava il nome greudo del file ("Linkin Park -
       In the End") mentre la libreria mostra quello ripulito ("In the End"),
       quindi non li riconosceva come lo stesso brano e i duplicati
       restavano. */
    try { applicaRinomine(); } catch (e) { /* noop */ }
    /* Ultimo giro di controllo sulla lista COMPLETA (quella qui sopra
       guardava solo i brani del telefono, quindi due brani uguali arrivati
       da due posti diversi restavano entrambi). Uso stessoBrano(), la funzione
       gia' pensata per questo nel progetto. */
    tracks = _unisciDuplicatiLocali(tracks);
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
        /* Questo record non e' un testo: qui ci tengo anche i nomi dei brani
           che Ste ha cambiato (vedi _salvaRinomineSulDisco), e non devono
           finire fra i testi. */
        if (!r || r.id === _ID_RINOMI) continue;
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
      /* I brani di cui proprio non so l'artista vanno in cima: finendo col
         gruppo "zzz" erano in fondo alla lista e sembravano spariti (e'
         successo con un file messo dal telefono). Gli altri artisti restano
         in ordine alfabetico come prima. */
      const sa = ga === "zzz";
      const sb = gb === "zzz";
      if (sa !== sb) return sa ? -1 : 1;
      if (ga !== gb) return ga < gb ? -1 : 1;
      const ta = titoloOrdinato(a), tb = titoloOrdinato(b);
      if (ta !== tb) return ta < tb ? -1 : 1;
      return String(a.title || "") < String(b.title || "") ? -1 : 1;
    });
  }
  /* I brani che l'utente ha deciso di tenere FUORI dalla libreria ma dentro
     una playlist. Non somigliano ai brani nascosti col menu "Togliere dalla
     lista": quelli spariscono davvero, questi restano suonabili e si vedono
     solo quando apri la playlist che li contiene.

     Motivo (l'ha chiesto Stefano): voleva le canzoni della playlist gym
     non mischiate con le altre, ma senza perderle. */
  const LS_PLA = "mb.braniInPlaylist";
  function _braniSoloInPlaylist() {
    try {
      const v = LS.get(LS_PLA, "");
      return new Set(String(v || "").split(",").map((x) => x.trim()).filter(Boolean));
    } catch (e) { return new Set(); }
  }
  /* Non perdo le scelte gia' fatte su questo telefono: le unisco a quelle
     che arrivano dalle playlist condivise. */
  let _soloInPlaylist = _ricalcolaSoloInPlaylist();

  function _salvaSoloInPlaylist() {
    try { LS.set(LS_PLA, [..._soloInPlaylist].join(",")); } catch (e) { /* noop */ }
  }

  /* I brani nascosti si decidono una volta sola e valgono OVUNQUE.

     Prima la scelta stava solo nella memoria di quel telefono: aperto il sito
     nel browser (che ha una memoria tutta sua), la libreria mostrava di nuovo
     i 13 brani di gym e poteva partire una canzone della playlist mentre Ste
     stava ascoltando la libreria. Adesso la scelta viaggia insieme alla
     playlist, quindi browser e telefono la vedono uguale. */
  function _nascostiDallePlaylist() {
    const fuori = new Set();
    for (const pl of (playlists || [])) {
      if (!pl || pl.nascosta !== true) continue;
      for (const id of (pl.tracks || [])) fuori.add(id);
    }
    return fuori;
  }

  /* Ricalcola i nascosti: ci metto dentro sia quelli decisi qui sia quelli
     arrivati con le playlist dagli altri dispositivi.
     Restituisce la lista nuova invece di assegnarla: questa funzione viene
     chiamata anche mentre _soloInPlaylist si sta inizializzando, e se
     assegnasse qui il browser si fermerebbe con "Cannot access before
     initialization". */
  function _ricalcolaSoloInPlaylist() {
    return new Set([..._braniSoloInPlaylist(), ..._nascostiDallePlaylist()]);
  }

  /* Mette un brano "solo nella playlist": sparisce dalla libreria ma
     continua a esistere e a suonare dentro la sua playlist. */
  function _mettiSoloInPlaylist(id) {
    if (!id) return false;
    _soloInPlaylist.add(id);
    _salvaSoloInPlaylist();
    return true;
  }
  function _togliSoloInPlaylist(id) {
    if (!id) return false;
    if (!_soloInPlaylist.delete(id)) return false;
    _salvaSoloInPlaylist();
    return true;
  }

function visibleTracks(perSuono) {
      /* "perSuono" = sto cercando la canzone che viene DOPO (non sto solo
         sfogliando la lista). Valgono le stesse regole del resto, con una
         differenza: le canzoni degli altri NON entrano, a meno che non
         abbia premuto "fai suonare anche le canzoni degli altri".

         Ste ha chiarito: se sto ascoltando dalla libreria, in coda vanno solo
         canzoni della libreria. E se sto dentro una playlist, in coda vanno
         solo canzoni di quella playlist (com'e' gia', perche' sotto il filtro
         della playlist non ci sono le altre).

         Le canzoni che ho copiato nella mia libreria invece sono ormai mie e
         suonano, anche se le ha aggiunte qualcun altro. */
      const perLaCoda = Boolean(perSuono);
      /* I brani "solo in playlist" escono dalla libreria, tranne quando sto
         guardando proprio una playlist: li' devono comparire. */
      const inPlaylist = _soloInPlaylist;
      let list = tracks.filter((t) => !hiddenTracks.has(t.id) &&
        (!inPlaylist.has(t.id) || Boolean(_playlistAttiva)));
      /* Per la coda: niente canzoni degli altri, se non me l'ha chiesto. */
      if (perLaCoda && !_suonaTutti()) {
        const miei = _mieiCopiati();
        list = list.filter((t) => (t.profile || DEFAULT_PROFILE) === profile || miei.has(t.id));
      }
    if (favOnly) list = list.filter((t) => favorites.has(t.id));
    if (soloMaiAscoltati) list = list.filter((t) => _ascoltoDi(t).s <= 0);
    /* Se ho scelto una playlist, vedo solo i suoi brani. Funziona insieme
       alla ricerca e all'ordinamento, non al posto loro: e' quello che
       chiedeva Stefano ("come la libreria, ma solo le canzoni di
       quella playlist"). */
    if (_playlistAttiva) {
      const pl = _playlistCercata(_playlistAttiva);
      const id = pl ? pl.id : null;
      if (id) list = list.filter((t) => (pl.tracks || []).includes(t.id));
      else if (_playlistAttiva) list = [];
    }
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


  /* Se un brano e' stato tolto dalla lista DEVE esserci un modo per rimetterlo:
     prima la funzione c'era ma non era collegata a nessun tasto, quindi un brano
     nascosto spariva per sempre (e' capitato: la lista sembrava avesse un brano
     in meno e non si capiva il perche'). */
  function _riportaIndietroSeNascosti() {
    try {
      const n = hiddenTracks.size;
      let avviso = document.getElementById("avviso-nascosti");
      /* Ste: questa riga stava fisso sopra il player e gli dava fastidio per
         che restava li' tutto il tempo. Ora vive DENTRO il menu "Altro": non
         si vede piu' passeggiando nell'app, e c'e' comunque ogni volta che
         serve rimettere qualcosa. Per questo non nascondo piu' la riga quando
         i brani nascosti sono molti: dentro il menu non occupa spazio. */
      if (!n) {
        if (avviso && avviso.parentNode) avviso.parentNode.removeChild(avviso);
        return;
      }
      if (!avviso) {
        /* Uso le stesse regole del progetto invece di inventarmi uno stile:
           lo stesso colore di attenzione degli altri avvisi. */
        avviso = document.createElement("div");
        avviso.id = "avviso-nascosti";
        avviso.className = "avviso-nascosti";
        /* Dentro il menu "Altro"; se per qualche motivo il menu non c'e',
           almeno non lo lascio sparire del tutto. Lo metto in cima al menu:
           e' la cosa piu' urgente e il menu non si scorre. */
        const menu = document.getElementById("menuAltro");
        if (menu && menu.firstChild) menu.insertBefore(avviso, menu.firstChild);
        else (menu || document.body).appendChild(avviso);
      }
      /* Il testo lo metto una volta sola: prima lo riscrivevo a ogni
         ridisegno della lista, e quello fa saltare gli schermi. */
      if (!avviso.firstChild) {
        const riga = document.createElement("div");
        riga.className = "avviso-nascosti-riga";
        const testo = document.createElement("span");
        testo.className = "avviso-nascosti-testo";
        const bottone = document.createElement("button");
        bottone.type = "button";
        bottone.className = "avviso-nascosti-bottone";
        bottone.textContent = "Scegli quali rimettere";
        /* Ste: prima questo bottone rimetteva TUTTI i brani tolti insieme.
           Ora apre la lista: si rimette anche uno solo. */
        bottone.addEventListener("click", () => {
          const p = $("nascostiPanel");
          if (p) p.hidden = false;
          _apriNascosti();
          syncNoScroll();
        });
        riga.appendChild(testo);
        riga.appendChild(bottone);
        avviso.appendChild(riga);
        /* elenchi i brani nascosti, cosi' si capisce QUALI sono e non sembra
           un conto magico */
        avviso._testo = testo;
      }
      /* Testo breve: Ste, prima c'era anche l'elenco di quali brani erano
         nascosti e la riga occupava mezza schermata, ferma per sempre. */
      avviso._testo.textContent = n === 1
        ? "Un brano tolto dalla lista"
        : n + " brani tolti dalla lista";
    } catch (e) { /* noop */ }
  }

function restoreHidden() {
    hiddenTracks = new Set();
    saveCurrentState();
    render();
    toast("Brani ripristinati: sono di nuovo tutti visibili");
  }

  /* ---------- I brani tolti dalla lista, uno alla volta ----------
     Ste: il bottone rimetteva TUTTI i brani tolti insieme, e a lui serviva
     poterne rimettere anche uno solo. Qui ogni brano ha il suo bottone. */

  /* Il brano nascosto con questo id (null se non esiste piu'). */
  function _trovaNascosto(id) {
    try {
      return (Array.isArray(tracks) ? tracks : []).find((t) => t && t.id === id) || null;
    } catch (e) { return null; }
  }

  function _apriNascosti() {
    const corpo = $("nascostiCorpo");
    if (!corpo) return;
    corpo.innerHTML = "";
    const idList = Array.from(hiddenTracks);
    if (!idList.length) {
      _stampaNascosti();
      return;
    }
    /* I pezzi sfuggiti non si possono rimettere (il file non c'e' piu' da
       nessuna parte): non li mostro, cosi' la lista dice solo la verita'. */
    for (const id of idList) {
      const t = _trovaNascosto(id);
      if (!t) continue;
      const riga = document.createElement("div");
      riga.className = "falliti-riga";
      riga.setAttribute("data-id", id);
      const nome = document.createElement("div");
      nome.className = "falliti-info";
      nome.textContent = String(t.title || t.artist || "Senza nome") +
        (t.artist && t.title ? " · " + t.artist : "");
      const btn = document.createElement("button");
      btn.className = "menu-altro-voce nascosti-rimetti";
      btn.setAttribute("data-azione", "rimetti");
      btn.textContent = "Rimetti in lista";
      riga.appendChild(nome);
      riga.appendChild(btn);
      corpo.appendChild(riga);
    }
    /* In fondo il bottone per tutti, che era quello di prima. */
    if (idList.length > 1) {
      const tutti = document.createElement("button");
      tutti.className = "menu-altro-voce nascosti-rimetti";
      tutti.setAttribute("data-azione", "tutti");
      tutti.textContent = "Rimetti tutti (" + idList.length + ")";
      corpo.appendChild(tutti);
    }
    _stampaNascosti();
  }

  function _chiudiNascosti() {
    const p = $("nascostiPanel");
    if (p) p.hidden = true;
    syncNoScroll();
  }

  /* Riscrive il pannello con quello che c'e' adesso (dopo aver rimesso un
     brano la lista si accorcia, e devo dirlo). */
  function _stampaNascosti(messaggio) {
    const corpo = $("nascostiCorpo");
    const sub = $("nascostiSub");
    if (!corpo) return;
    const quanti = hiddenTracks.size;
    if (sub) {
      sub.textContent = messaggio ||
        (quanti ? "Rimettine uno alla volta, o tutti insieme" : "Non c'e' piu' niente da rimettere");
    }
    if (!quanti) {
      corpo.innerHTML = "";
      const fatto = document.createElement("p");
      fatto.className = "step-hint";
      fatto.textContent = "Tutti i brani sono di nuovo nella lista.";
      corpo.appendChild(fatto);
    } else {
      _apriNascosti();
    }
    _riportaIndietroSeNascosti();
  }

  /* Rimette in lista UN brano solo. */
  function _rimettiNascosto(id) {
    if (!id || !hiddenTracks.has(id)) return;
    hiddenTracks.delete(id);
    saveCurrentState();
    render();
    const t = _trovaNascosto(id);
    _stampaNascosti("Rimesso: " + String((t && t.title) || "brano"));
  }

  /* Rende pubblici i brani che esistono solo su questo dispositivo, e lo fa
     DA SOLO: non c'e' un tasto da premere. Ogni brano importato a mano resta
     nel browser da cui l'hai importato, quindi senza questo non lo vedresti
     dagli altri dispositivi. Chiamo questa funzione all'avvio e ogni volta
     che finisce un import, cosi' non ci resta niente da fare a mano.

     I brani senza file (per esempio solo un'anteprima o un link) non si
     possono condividere: non c'e' niente da mandare. */
  let _ultimaCondivisione = 0;
let _condivisioneHaCambiato = false;
let condivisioneInCorso = false;
  /* Segna che sto condividendo un brano appena aggiunto dalla pagina: serve per
   dire "e' rimasto solo qui" se il computer non risponde. */
let _recentementeAggiunto = false;

async function condividiBraniLocali(forzato) {
    _diag("condividiBraniLocali");
    /* Ste: "si continua ad aggiornare". Misurando ho visto che questa funzione
       veniva richiamata ogni 9-10 secondi e ogni volta ridisegnava tutta la
       libreria: la lista si riordinava, lo scorrimento tornava su e la musica
       ripartiva. Nessun timer da 10 secondi esiste, quindi era una catena di
       tentativi che non finiva. Con questo blocco due cose smettono:
       non parte piu' di una volta ogni 15 secondi, e la lista si ridisegna
       solo se c'era davvero qualcosa da condividere. */
    if (!forzato) {
      if (Date.now() - _ultimaCondivisione < 15000) return;
    }
    _ultimaCondivisione = Date.now();
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
            _condivisioneHaCambiato = true;
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
        /* Se pero' ho appena aggiunto un brano adesso, dico dove sta: prima
           l'utente lo cercava nella libreria (sul computer) e non lo
           trovava, perche' intanto era rimasto solo qui. */
        if (daMandare.length && _recentementeAggiunto) {
          _recentementeAggiunto = false;
          toast("Brano aggiunto solo a questo telefono: il computer non risponde, quindi non e' andato nella libreria");
        }
        return;
      }
      _recentementeAggiunto = false;
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
          _condivisioneHaCambiato = true;
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
      /* Prima qui c'era render() SEMPRE, anche quando non era successo niente:
         e' quello che faceva saltare la lista ogni 10 secondi. Ora ridisegno
         solo se ho davvero condiviso o cambiato qualcosa. */
      if (_condivisioneHaCambiato) {
        _condivisioneHaCambiato = false;
        _salvaPuntoLibreria();
        render();
        _ripristinaPuntoLibreria();
      }
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
  /* Sono lo stesso titolo? Uguale, oppure uno dentro l'altro MA solo se sono
   davvero vicini: "In The End" dentro "Something In The End" non vuol dire
   che sono la stessa canzone, e "Voglio bene a te" dentro "Voglio bene a te
   anche" due volte tanto. */
function quasiUguali(x, y) {
  if (x === y) return true;
  if (!x || !y) return false;
  const corto = Math.min(x.length, y.length);
  const lungo = Math.max(x.length, y.length);
  if (corto / lungo < 0.8) return false;
  return x.indexOf(y) >= 0 || y.indexOf(x) >= 0;
}

  function stessoBrano(a, b) {
    if (!a || !b) return false;

    /* Se da una parte non c'e' l'artista, provo a tirarlo fuori dal titolo.
       Il file che aggiungi dal telefono si chiama "artista - brano.mp3": senza
       questo, l'app non lo riconosceva come il brano che c'e' gia' in
       libreria e lo mostrava due volte (45 brani diventavano 88). */
    let ta = normKey(a.title), tb = normKey(b.title);
    let aa = a.artist, ab = b.artist;
    if (!normKey(aa) && normKey(ab)) aa = _artistaDalTitolo(a.title);
    if (!normKey(ab) && normKey(aa)) ab = _artistaDalTitolo(b.title);
    if (!ta || !tb) return false;
    /* parlo anche del titolo ripulito dal nome dell'artista */
const taSenza = normKey(_titoloSenzaArtista(a.title, aa));
      const tbSenza = normKey(_titoloSenzaArtista(b.title, ab));
const titoliUguali = quasiUguali(ta, tb) ||
        (taSenza.length >= 6 && tbSenza.length >= 6 && quasiUguali(taSenza, tbSenza));
    if (titoliUguali) {
      if (normKey(aa) || normKey(ab)) return stessoArtista(aa, ab);
      /* Senza artista non si puo' dire con certezza, quindi non confondo. */
      return ta.length >= 8;
    }
    /* Ste: il file che arriva dal telefono spesso NON porta l'artista
       ("linkin park in the end"), mentre quello del sito lo porta
       ("Linkin Park - In the End"). Sono la stessa canzone, ma i titoli sono
       troppo diversi per quasiUguali. Allora guardo se il titolo senza
       artista COMINIA per il nome dell'artista che conosco e subito dopo
       c'e' esattamente l'altro titolo.
       Attenzione: normKey() butta via anche gli spazi, quindi qui confronto
       parole attaccate ("linkinparkintheend"), non con gli spazi. */
    const nomeArtista = normKey(aa) || normKey(ab);
    if (nomeArtista.length >= 3) {
      /* Se so i due artisti e sono DIVERSI, non e' la stessa canzone:
         "Kid Yugi - Donna" e "Donna" di Marco restano due brani. */
      if (normKey(aa) && normKey(ab) && !stessoArtista(aa, ab)) return false;
      const colArtista = normKey(aa) ? ta : tb;
      const senzaArtista = normKey(aa) ? tb : ta;
      /* Provo entrambi i lati: non so da quale dei due titoli sia stato
         tirato fuori l'artista (se manca, lo prendo dal titolo stesso). */
      if (senzaArtista.indexOf(nomeArtista) === 0 &&
          senzaArtista.slice(nomeArtista.length) === colArtista) return true;
      if (colArtista.indexOf(nomeArtista) === 0 &&
          colArtista.slice(nomeArtista.length) === senzaArtista) return true;
    }
    return false;
  }
  /* "gigi perez - sailor song" -> "gigi perez" */
  function _artistaDalTitolo(titolo) {
    const m = /^([^-]{2,40})\s+-\s+(.+)$/.exec(String(titolo || "").trim());
    return m ? m[1].trim() : "";
  }
  /* "gigi perez - sailor song" -> "sailor song" (se l'artista combacia) */
  function _titoloSenzaArtista(titolo, artista) {
    const t = String(titolo || "");
    if (!normKey(artista)) return t;
    const m = /^([^-]{2,40})\s+-\s+(.+)$/.exec(t.trim());
    if (!m) return t;
    if (!stessoArtista(m[1], artista)) return t;
    return m[2].trim();
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

  /* Ste: alcune canzoni si duplicavano piu' volte. Il motivo e' che due brani
   identici salvati sul telefono hanno due id diversi (l'id nasce da data e
   caso), e l'app li mostrava entrambi: controllavo che non fossero gia' nella
   libreria condivisa, ma NON controllavo fra loro.

   Qui li unisco per nome+artista e tengo il primo. Gli id delle copie "in
   piu'" li metto da parte (non cancello niente: se un domani tornassero utili
   sono ancora li'), cosi' non ricompaiono a ogni avvio. */
function _unisciDuplicatiLocali(elenco) {
  try {
    const giaNascosti = new Set(_duplicatiLocali());
    const nuoviDaRicordare = [];
    const tenuti = [];
    for (const t of elenco) {
      if (!t) continue;
      /* Un id nella lista dei "da non mostrare" resta nascosto. */
      if (giaNascosti.has(t.id)) continue;
      /* Cerco il gemello confrontando con stessoBrano() (il confronto giusto
         del progetto) e NON con una chiave esatta: con la chiave "Linkin
         Park|In the End" e "|linkin park in the end" non si trovavano mai,
         perche' le due righe hanno nomi diversi ma sono lo stesso brano. */
      let p = -1;
      for (let n = 0; n < tenuti.length; n++) {
        if (stessoBrano(t, tenuti[n])) { p = n; break; }
      }
      if (p >= 0) {
        /* Ste: un brano con il nome cambiato deve restare quello. Se il
           gemello che sto scartando ha una rinomina e quello che tengo no,
           tengo quello con la rinomina: altrimenti il nome scelto da lui
           sparisce al riavvio. */
        if (!_haRinomina(tenuti[p].id) && _haRinomina(t.id)) {
          _spostaRinomina(t.id, tenuti[p].id);
          tenuti[p] = t;
        }
        /* I brani condivisi non li nascondo per sempre: la lista condivisa
           puo' cambiare, e un brano che adesso e' doppio domani potrebbe non
           esserlo piu' (o viceversa). Me li ricordo solo per questa sessione. */
        if (!t.builtin) nuoviDaRicordare.push(t.id);
        continue;
      }
      tenuti.push(t);
    }
    if (nuoviDaRicordare.length) {
      /* Ste: "ogni volta toglie le canzoni". Non tengo memoria dei doppioni
         scartati: ogni volta riparto da capo e ricalcolo tutto, quindi un
         errore di una volta non puo' nascondere un brano per sempre (e se
         un brano sparisce, cancello il ricordo e torna con il riavvio). */
      writeProfileState(profile, { duplicati: [] });
      segnalaErrore("libreria: nascosti " + nuoviDaRicordare.length +
        " doppioni (stesso brano salvato due volte sul telefono)");
    }
    return tenuti;
  } catch (e) {
    return elenco;
  }
}

function _duplicatiLocali() {
  try {
    const st = profileState(profile);
    return Array.isArray(st.duplicati) ? st.duplicati : [];
  } catch (e) { return []; }
}

/* Questo brano ha un nome cambiato dall'utente? */
function _haRinomina(id) {
  try {
    const r = nomiRinomati()[id];
    return !!(r && (r.title || r.artist));
  } catch (e) { return false; }
}

/* Porta una rinomina da un id a un altro (quando un brano viene sostituito
   dalla sua copia gemella, il nome scelto dall'utente deve restare). */
function _spostaRinomina(daId, aId) {
  try {
    const mappa = nomiRinomati();
    const r = mappa[daId];
    if (!r) return;
    if (!mappa[aId]) mappa[aId] = { title: r.title || "", artist: r.artist || "" };
    delete mappa[daId];
    LS.set("mb.rinomini", mappa);
  } catch (e) { /* noop */ }
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
    _diag("render");
    const list = visibleTracks();
    playlistEl.innerHTML = "";
    /* Se ci sono brani tolti dalla lista, la riga per rimetterli e' gia' qui:
       senza, un brano nascosto spariva per sempre e il conto sembrava
       sbagliato senza che si capisse perche'. */
    try { _riportaIndietroSeNascosti(); } catch (e) { /* noop */ }

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
      if (t.builtin) meta.textContent = bits.join(" ");
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
          _salvaStatoCondiviso();
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
    /* Se sto scegliendo piu' canzioni, il tocco sceglie e non suona. */
    if (_alternaSelezione(t.id)) return;
    playById(t.id);
    });
    /* Il segno di spunta sui brani scelti. */
    if (_inSelezione && _scelti.has(t.id)) li.classList.add("selezionato");
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
    /* Se sto ascoltando una playlist, il brano dopo e' il SUO, non quello
       dopo nella libreria: altrimenti la playlist si fermerebbe al primo. */
    const idDiPlaylist = _avantiInPlaylist();
    if (idDiPlaylist) { playById(idDiPlaylist); return; }
    /* Il brano e' finito e sto partendo col successivo: da qui in avanti
       se il telefono rifiuta di suonare, insisto (vedi _riprovaPiuTardi) */
    _cominciaBranoNuovo();
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
    /* Segno che l'audio sta DAVVERO scorrendo. Sul telefono con lo schermo
       spento Safari dice "e' partito" ma il brano resta muto e fermo: e'
       successo, e l'app ci credeva e non riprovava piu'. Qui guardo il tempo
       che passa davvero, e se non passa riparo. */
    _ultimoScorrimento = Date.now();
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

  /* Bridge opzionale per il wrapper iOS nativo: il sito continua a funzionare
     normalmente in Safari. Nel wrapper invia titolo, artista e posizione al
     player di sistema, che gestisce i controlli della schermata di blocco. */
  let _ultimoInvioStatoNativo = 0;
  function _notificaStatoNativo(forza = false) {
    try {
      const bridge = window.webkit && window.webkit.messageHandlers &&
        window.webkit.messageHandlers.musicBox;
      if (!bridge) return;
      const ora = Date.now();
      if (!forza && ora - _ultimoInvioStatoNativo < 1000) return;
      _ultimoInvioStatoNativo = ora;
      const t = current();
      bridge.postMessage({
        type: "state",
        title: t ? t.title : APP_NAME,
        artist: t ? (t.artist || APP_NAME) : APP_NAME,
        album: APP_NAME,
        playing: !!(audio && !audio.paused),
        currentTime: audio && isFinite(audio.currentTime) ? audio.currentTime : 0,
        duration: audio && isFinite(audio.duration) ? audio.duration : 0
      });
    } catch (e) { /* bridge assente o non ancora pronto: Safari resta invariato */ }
  }

  // Punto d'ingresso invocato dal wrapper nativo dopo il caricamento della pagina.
  window.__musicBoxNativeReady = () => _notificaStatoNativo(true);

  function createAudio() {
    const a = new Audio();
    a.preload = "metadata";
    a.addEventListener("play", () => {
    // Un play reale conferma che il cambio sorgente e' terminato.
    a._mbCambioBrano = false;
    syncPlayUI();
    updateMediaSession();
    _iniziaAscolto();
    _notificaStatoNativo(true);
    });
a.addEventListener("pause", () => {
    /*
      Safari/iOS puo' mettere in pausa l'elemento audio senza passare dal
      gestore MediaSession. Se la musica doveva continuare, ricordiamo questa
      pausa come volontaria, evitando che i timer di recupero la riavviino.
      Non interveniamo durante il cambio di brano o alla fine naturale.
    */
    if (a === audio && _vuoleSuonare && !a.ended && !a._mbCambioBrano) {
      _pausaVolontaria();
    }
    syncPlayUI();
    updateMediaSession();
    savePos();
    _chiudiAscolto(false);
    _notificaStatoNativo(true);
  });
    a.addEventListener("ended", handleEnded);
    a.addEventListener("timeupdate", handleTime);
    a.addEventListener("timeupdate", () => _notificaStatoNativo(false));
    /* Il conteggio del tempo ascoltato: qui si conta davvero, perche' questo
       evento scatta finche' la musica suona, su computer e su telefono. */
    a.addEventListener("timeupdate", _contaAlMuoversi);
    a.addEventListener("loadedmetadata", handleMetadata);
    a.addEventListener("loadedmetadata", () => _notificaStatoNativo(true));
    a.addEventListener("error", handleError);
    return a;
  }

/* Ricreo il lettore audio. Fermo quello vecchio: se e' ancora vivo
     continuerebbe a suonare da solo. */
function rebuildAudio(autoplay) {
  _diag("rebuildAudio");
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

  /* Prima di play(): se il brano non e' ancora pronto, aspetto che sia pronto.
     Sui telefoni chiedere play() mentre il file sta ancora arrivando viene
     rifiutato, e il brano non parte: e' una delle ragioni per cui col
     telefono spento la musica si fermava al brano dopo. */
  function _prontaARiprodurre() {
    return new Promise((risolvi) => {
      if (!audio || audio.readyState >= 2) { risolvi(); return; }
      let fatto = false;
      const va = () => { if (!fatto) { fatto = true; risolvi(); } };
      try {
        audio.addEventListener("loadeddata", va, { once: true });
        audio.addEventListener("canplay", va, { once: true });
      } catch (e) { /* noop */ }
      /* non aspetto all'infinito: dopo 4 secondi parto comunque */
      setTimeout(va, 4000);
    });
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
      await _prontaARiprodurre();
      await audio.play();
      /* NON azzero l'intento di sentire qui: con lo schermo spento il
         telefono risponde "partito" ma l'audio resta muto. Se dicessi
         "ha suonato", l'app smetterebbe di insistere e resterebbe muta
         per sempre (e riaprendo l'app non ripartiva piu'). */
      _ultimoScorrimento = Date.now();
      _nascondiSeRiparte();
      /* Se l'app crede di suonare ma il volume e' a zero, la musica parte
         e non si sente niente: e' successo. Meglio dirlo. */
      _controllaVolume();
      return true;
    } catch (e) {
      const nome = String((e && e.name) || "");
      console.warn("Play bloccato" + (hoGiaRiprovato ? " (anche dopo aver ricreato il lettore)" : ""), e);
      /* Se il telefono rifiuta perche' non c'e' stata una pressione (il caso
         dello schermo spento), ricreare il lettore e' la cosa PEGGIORE: un
         lettore nuovo e' come un brano nuovo, quindi il telefono lo blocca
         di nuovo. In quel caso mi tengo lo stesso lettore e insisto sullo
         stesso brano. Ricrearlo resta giusto se il lettore e' rotto. */
      const rifiutoDelTelefono = /NotAllowedError/i.test(nome);
      if (!hoGiaRiprovato && !rifiutoDelTelefono) {
        rebuildAudio(false);
        return doPlay(true);
      }
      /* ancora bloccato (telefono in standby): riprovo con calma */
      _riprovaPiuTardi();
      return false;
    }
  }

  /* ---------- Se l'iPhone non fa partire il brano da solo ----------
     A volte il sistema proprio non concede il permesso, e nessuna insistenza
     serve. In quel caso non ti lascio fermo: appare una riga in basso con un
     bottone grande, e basta un tocco per continuare. */
  let _aiutoBox = null;
  function _mostraAiuto(testo) {
    try {
      if (!_aiutoBox) {
        _aiutoBox = document.createElement("div");
        _aiutoBox.className = "aiuto-riparto";
        _aiutoBox.innerHTML = '<span class="aiuto-testo"></span><button type="button" class="aiuto-pulsante">Continua</button>';
        document.body.appendChild(_aiutoBox);
        _aiutoBox.querySelector(".aiuto-pulsante").addEventListener("click", () => {
          _nascondiAiuto();
          /* La canzone e' gia' cambiata: qui non devo saltare al brano dopo,
             devo solo suonare quello che c'e' adesso. E soprattutto: questo
             tocco e' un "permesso" dell'utente, quindi stavolta l'iPhone
             lascia passare play(). */
          _vuoleSuonare = true;
          if (audio && !audio.paused) { _vuoleSuonare = false; return; }
          doPlay().then((va) => { if (va) _nascondiAiuto(); });
        });
      }
      _aiutoBox.querySelector(".aiuto-testo").textContent = testo;
      _aiutoBox.classList.add("visibile");
    } catch (e) { /* noop */ }
  }
  function _nascondiAiuto() {
    try { if (_aiutoBox) _aiutoBox.classList.remove("visibile"); } catch (e) { /* noop */ }
  }
  /* Se riparte (perche' ha insisto o perche' hai toccato), l'aiuto sparisce */
  function _nascondiSeRiparte() {
    try {
      if (audio && !audio.paused) _nascondiAiuto();
    } catch (e) { /* noop */ }
  }

  /* Volume a zero: l'app parte ma dal telefono non esce niente e sembra
     che sia tutto rotto. In quel caso te lo dico con parole chiare. */
  function _controllaVolume() {
    try {
      if (volumePct > 0) return;
      _mostraAiuto("Il volume e' a zero: alzalo con il cursore");
    } catch (e) { /* noop */ }
  }
  /* Tenere pronto il brano che viene dopo, cosi' quando l'altro finisce
     parte SUBITO e non deve aspettare che il file si scarichi dal internet.
     E' un lettore nascosto e muto: non si sente, serve solo a scaldare il
     file in memoria. */
  let _preparato = null;
  let _preparatoId = "";
  /* Il telefono mi dice se sta risparmiando i dati o se la rete e' lenta:
     in quel caso scaricare un brano intero prima ancora di ascoltarlo
     (4-5 MB) e' una cattiva idea. Lo carico solo "abbastanza". */
  function _meglioNonScaricareTutto() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return false;
    if (c.saveData) return true;
    return /^(slow-)?2g$|^3g$/.test(String(c.effectiveType || ""));
  }
  function _preparaIlSuccessivo(id) {
    const t = tracks.find((x) => x.id === id);
    if (!t || !t.url || _preparatoId === id) return;
    try {
      if (!_preparato) {
        _preparato = new Audio();
        _preparato.muted = true;
      }
      /* col risparmio dati mi basta sapere che il brano esiste: non scarico
         i suoi 4-5 MB prima di ascoltarlo */
      _preparato.preload = _meglioNonScaricareTutto() ? "metadata" : "auto";
      _preparato.src = t.url;
      /* se il brano e' gia' in mano la si riusa, altrimenti lo si scorda */
      try { _preparato.load(); } catch (e) { /* noop */ }
      _preparatoId = id;
    } catch (e) { _preparato = null; _preparatoId = ""; }
  }

  let _timerRiprove = null;
  let _timerAiuto = null;
  /* --- "voglio sentire" e "sto sentendo" ---
     _vuoleSuonare: l'utente (o il cambio brano automatico) vuole la musica.
       Si spegne SOLO quando l'utente mette in pausa di proposito.
     _ultimoScorrimento: l'ultima volta che il tempo del brano e' davvero
       andato avanti. Se la musica e' "partita" ma il tempo resta fermo,
       l'audio e' muto: e li' devo intervenire. */
  let _vuoleSuonare = false;
  let _ultimoScorrimento = 0;

  /* Controllo ogni 3 secondi: la musica deve camminare.
     Sta pero' VOLUTAMENTE cauto: se la rete arranca e il brano sta ancora
     caricando, il tempo non avanza e non e' che sia muto. In quel caso non
     tocco niente, altrimenti si sentirebe uno scatto proprio mentre
     ascolti. Prima cosa provo a riavviare la riproduzione; solo se non
     basta, e due volte di fila, ricostruisco il lettore. */
  let _silenziDiFila = 0;
  function _controllaCheSuoni() {
    try {
      if (!_vuoleSuonare || !audio || !currentId) return;
      /* Il brano e' finito ma l'evento non e' arrivato: lo recupero qui.
         Questo giro ogni 3 secondi SEMPRE, quindi copre anche il caso in cui
         il brano e' finito mentre l'app era in primo piano. */
      if (audio.ended) { _finitoSenzaAvanti(); return; }
      if (audio.paused) { _silenziDiFila = 0; _riprovaPiuTardi(); return; }
      if (Date.now() - _ultimoScorrimento < 10000) return;
      /* sta ancora scaricando: non e' un silenzio, e' la rete */
      if (audio.readyState < 3) { _ultimoScorrimento = Date.now(); return; }
      _nascondiAiuto();
      _ultimoScorrimento = Date.now();
      _silenziDiFila++;
      const t = current();
      if (!t) return;
      if (_silenziDiFila < 3) {
        /* prima prova: riparto sullo stesso brano, dal punto in cui e' */
        audio.play().catch(() => { /* il controllo riprova fra poco */ });
        return;
      }
      /* il brano e' "partito" ma e' zittito da 30 secondi: lo rifaccio */
      _silenziDiFila = 0;
      rebuildAudio(true);
      _riprovaPiuTardi();
    } catch (e) { /* noop */ }
  }
  /* Quando il brano e' finito e parte il successivo, il telefono spesso
     rifiuta di riprodurre per un po': con lo schermo spento e' proprio
     normale. Prima mollavo dopo 10 secondi e la musica restava muta.
     Adesso insisto per qualche minuto: e' l'unica cosa che posso fare da
     solo, senza che Ste debba toccare il telefono. */
  function _riprovaPiuTardi() {
    if (_timerRiprove) clearTimeout(_timerRiprove);
    const attesa = [1500, 3000, 5000, 8000, 12000, 20000, 30000, 45000];
    let i = 0;
    const riprova = () => {
      if (i >= attesa.length) return;
      const quando = attesa[i++];
      _timerRiprove = setTimeout(() => {
        try {
          /* riprovo SOLO se la musica deve davvero suonare e il brano non e'
             gia' partito: altrimenti lo disturberei */
          if (_vuoleSuonare && currentId && audio && audio.paused) {
            _ultimoScorrimento = Date.now();
            audio.play().catch(() => riprova());
            return;
          }
          if (_vuoleSuonare && currentId && audio && !audio.paused) {
            /* "partito" ma forse muto: lo nota _controllaCheSuoni */
            _controllaCheSuoni();
            return;
          }
          if (!_vuoleSuonare && audio && !audio.paused) return;
        } catch (e) { /* noop */ }
        riprova();
      }, quando);
    };
    riprova();
    /* Se proprio non va, non insisto all'infinito: dopo 3 secondi mostro
       un bottone grande. Meglio un tocco tu che restare fermo in silenzio.
       Prima aspettavo 12 secondi, ma l'utente vede subito che la musica
       e' partita a meta' e non sa che c'e' un bottone. */
    clearTimeout(_timerAiuto);
    _timerAiuto = setTimeout(() => {
      if (_vuoleSuonare && currentId && audio && audio.paused) {
        _mostraAiuto("La musica non e' partita: tocca Continua");
      }
    }, 3000);
  }

  /* L'intestazione esce quando scorro in giu' e torna quando scrivo in su.

     Motivo: con l'app aperta dentro Safari (non come web app) l'iPhone mostra
     la sua barra in alto, e lo spazio per l'elenco dei brani si stringe.
     Cosi' quando sto scegliendo cosa ascoltare l'intestazione non c'intralcia,
     ma il menu resta a portata di dito: basta scrivere un po' in su. */
  (function topbarCheScorre() {
    try {
      const barra = document.querySelector(".topbar");
      if (!barra) return;
      let ultimo = window.scrollY || 0;
      let fermo = 0;
      window.addEventListener("scroll", () => {
        const ora = window.scrollY || 0;
        const giù = ora > ultimo + 6;
        const su = ora < ultimo - 6;
        /* vicino a cima e in fondo la lascio stare: li' non ci guadagniamo niente */
        if (ora < 70) { barra.classList.remove("scorrendo-giu"); ultimo = ora; return; }
        if (Math.abs(ora - ultimo) < 6) return;
        ultimo = ora;
        if (giù) barra.classList.add("scorrendo-giu");
        else if (su) barra.classList.remove("scorrendo-giu");
        /* se l'utente smette di muoversi, dopo un po' la riporto: non deve
           restare nascosta per sempre se poi non tocca piu' niente */
        clearTimeout(fermo);
        fermo = setTimeout(() => { barra.classList.remove("scorrendo-giu"); }, 2600);
      }, { passive: true });
    } catch (e) { /* noop */ }
  })();

  /* Se Ste apre l'app dall'icona della Home Screen, iPhone la chiude prima,
     anche mentre la musica suona: il brano corrente va avanti, ma quando
     finisce il successivo non parte. ApertA dentro Safari invece funziona
     anche a schermo spento.

     Glielo dico una volta sola, con il link gia' pronto da incollare, cosi'
     non resta il dubbio di quale delle due usare. */
  let _avvisoIconaBox = null;

  function _avvisoIcona() {
    try {
      const apertaDaIcona =
        (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
        window.navigator.standalone === true;
      if (!apertaDaIcona) return;
      if (LS.get("mb.avviso-icona", "") === "si") return;
      LS.set("mb.avviso-icona", "si");
      if (_avvisoIconaBox || !document.body) return;

      const box = document.createElement("div");
      box.className = "avviso-nascosti";

      const testo = document.createElement("div");
      testo.className = "avviso-nascosti-testo";
      testo.textContent = "La modalità app web sulla schermata Home può impedire il passaggio automatico al brano successivo in background su iPhone. Per usare l'icona e continuare con Safari: elimina questa icona, apri il sito in Safari, scegli Condividi > Aggiungi alla schermata Home e disattiva 'Apri come app web' se compare.";

      const riga = document.createElement("div");
      riga.className = "avviso-nascosti-riga riga-piu";

      const copia = document.createElement("button");
      copia.type = "button";
      copia.className = "avviso-nascosti-bottone";
      copia.textContent = "Copia il link";
      copia.addEventListener("click", async () => {
        const link = String(location.href).split("#")[0];
        try {
          await navigator.clipboard.writeText(link);
          copia.textContent = "Copiato: apri Safari e incolla";
        } catch (e) {
          copia.textContent = link;
        }
      });

      const chiudi = document.createElement("button");
      chiudi.type = "button";
      chiudi.className = "avviso-nascosti-bottone torna";
      chiudi.textContent = "Ho capito";
      chiudi.addEventListener("click", () => {
        box.remove();
        _avvisoIconaBox = null;
      });

      riga.appendChild(copia);
      riga.appendChild(chiudi);
      box.appendChild(testo);
      box.appendChild(riga);
      document.body.appendChild(box);
      _avvisoIconaBox = box;
      /* se non lo chiude, sparisce da solo: non deve restare li' per sempre */
      setTimeout(() => { if (_avvisoIconaBox === box) { box.remove(); _avvisoIconaBox = null; } }, 30000);
    } catch (e) { /* meglio non mostrare nulla che sbagliare */ }
  }

  /* Se riprovare non e' servito e il telefono torna in primo piano o Ste
     tocca qualcosa, riprendo: e' il momento in cui il browser permette
     di nuovo la riproduzione. */
  function _riprendiSeInAttesa() {
        /* Torno in primo piano o l'utente tocca: se la musica DOVE suonare,
           riprovo. Prima guardavo solo l'intento vecchio, ma il telefono con lo
           schermo spento l'aveva già azzerato: quindi riaprendo l'app non
           ripartiva niente. Adesso guardo l'intento vero. */
        if (!_vuoleSuonare || !currentId || !audio) return;
        /* Il brano e' finito mentre l'app era in secondo piano? Allora NON
           riprovo a suonarlo (un brano finito non riparte, e l'utente resta
           fermo): vado al successivo. Anche qui non riscrivo la scelta del
           brano, chiamo _finitoSenzaAvanti(), che usa handleEnded(). */
        try {
          const finito = audio.ended ||
            (isFinite(audio.duration) && audio.duration > 0 &&
              audio.currentTime >= audio.duration - 0.4);
          if (finito) {
            toast("La canzone era finita: e' partita la successiva");
            _finitoSenzaAvanti();
            return;
          }
        } catch (e) { /* se non riesco a valutarlo, riprovo sotto */ }
        if (!audio.paused) {
          /* gia' "in play": ma e' muto? lo dice _controllaCheSuoni */
          _controllaCheSuoni();
          return;
        }
        _ultimoScorrimento = Date.now();
        audio.play().then(() => { _ultimoScorrimento = Date.now(); }).catch(() => { _riprovaPiuTardi(); });
      }
  ["visibilitychange", "focus", "pageshow"].forEach((ev) => {
    document.addEventListener(ev, _riprendiSeInAttesa);
  });
  ["pointerdown", "touchstart", "keydown"].forEach((ev) => {
    window.addEventListener(ev, _riprendiSeInAttesa, { passive: true });
  });

  function _cominciaBranoNuovo() {
    /* sto cambiando brano: azzero il conto delle riprove */
    if (_timerRiprove) { clearTimeout(_timerRiprove); _timerRiprove = null; }
    if (_timerAiuto) { clearTimeout(_timerAiuto); _timerAiuto = null; }
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
    /* Chiudere il menu azzera anche il "fermo" dei tocchi: prima restava
       attaccato e il tocco successivo su un brano veniva ignorato, quindi
       premere su una canzone non faceva niente. */
    suppressClick = false;
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

  const ICON_PLAYLIST = "M3 6h12v2H3V6Zm0 5h12v2H3v-2Zm0 5h12v2H3v-2ZM17 9v3h-2v3h-2v-3h-3V9h3V6h2v3h2Z";
  const ICON_QUEUE = "M3 6h18v2H3V6Zm0 5h11v2H3v-2Zm0 5h11v2H3v-2Zm13-6 4 3-4 3v-6Z";
  /* Libreria: la usano i comandi "solo nella playlist" / "torna in
     libreria", cosi' si distinguono da quelli delle playlist. */
  const ICON_LIBRARY = "M4 4h4v16H4V4Zm6 0h4v16h-4V4Zm7.2.4 1.4 14.4-4.2 1.4-14.4Z";
const ICON_EDIT = "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z";
  const ICON_NEXT = "M6 5l9 7-9 7V5Zm10 0h2v14h-2V5Z";
  const ICON_HIDE = "M3.3 2 2 3.3l2.4 2.4C2.5 7 1.4 8.7 1 9c1.1 2.3 4 5 7 6l2 2 1.3-1.3 15.4 15.4 1.3-1.3L3.3 2ZM12 5c4.4 0 8 4 8 4-.5 1-1.6 2.4-3.1 3.5l-1.5-1.5c1-.9 1.6-1.9 1.9-2.6-.6-.8-2.6-2.4-5.3-2.4-.4 0-.8 0-1.2.1L9.6 4.9c.8-.1 1.6-.1 2.4-.1Z";
  const ICON_SHARE = "M18 16a3 3 0 0 0-2.4 1.2l-6.9-4a3 3 0 0 0 0-1.4l7-4.1A3 3 0 1 0 15 6c0 .2 0 .4.1.6l-7 4.1a3 3 0 1 0 0 6.6l6.9 4A3 3 0 1 0 18 16Z";
  const ICON_OFFLINE = "M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z";

  /* Porto un brano nella mia libreria.

     NON e' uno spostamento: la canzone resta dov'e', e semplicemente entra
     anche nella mia. E' quello che chiedeva Stefano: "voglio che si duplichi,
     non che si sposti dalla mia alla sua eliminandosi dalla mia".

     Non si copia nemmeno il file audio (sarebbe sprecato: il brano e' gia'
     online e lo sentiamo entrambi dallo stesso indirizzo). Metto il brano
     nella mia lista, che salvo anche sul sito cosi' vale su ogni dispositivo. */
  async function _portaNellaMiaLibreria(t) {
    if (!t) return;
    const numero = (/^track-(\d+)\.mp3$/.exec(String(t.url || "").replace(/^.*\//, "")) || [])[1];
    if (!numero) {
      toast("Non posso copiare questo brano: non so qual e' il suo numero");
      return;
    }
    const id = "b-track-" + numero;
    const gia = _mieiCopiati();
    if (gia.has(id)) {
      toast('"' + t.title + '" e\' gia\' nella tua libreria');
      return;
    }
    /* Prima sul telefono, cosi' si vede subito anche se non ho rete. */
    _salvaMieiCopiati([...gia, id]);
    try { await loadAll(); } catch (e) { /* noop */ }
    render();
    toast('"' + t.title + '" ora e\' anche nella tua libreria (a ' + t.profile + ' resta)');
    /* Poi sul sito, cosi' la ritrovo su questo e sull'altro dispositivo. */
    _salvaStatoCondiviso();
  }

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
      /* La playlist e' una mia scelta, quindi la scelgo da qui: tengo questa
         voce nel menu del brano per decidere in che playlist metterlo. */
      box.appendChild(quickAction("Aggiungi alla playlist", ICON_PLAYLIST, () => aggiungiAPlaylist(t.id)));

  /* "Solo nella playlist": sparisce dalla libreria ma resta suonabile
     dentro la playlist. Serve a chi ha brani da usare in un momento
     preciso (allenamento) e non li vuole mischiati con gli altri. */
  if (_soloInPlaylist.has(t.id)) {
    box.appendChild(quickAction("Torna in libreria", ICON_LIBRARY, () => {
      _togliSoloInPlaylist(t.id);
      _disegnaLinguettePlaylist();
      render();
      toast('"' + t.title + '" e\' di nuovo nella libreria');
    }));
  } else {
    const inChePlaylist = _playlistCheContengono(t.id);
    if (inChePlaylist.length) {
      box.appendChild(quickAction("Solo nella playlist", ICON_LIBRARY, async () => {
        const si = await askConfirm(
          "Solo nella playlist?",
          '"' + t.title + '" sparisce dalla libreria, ma resta suonabile dentro\n"' +
            inChePlaylist.join('", "') + '".\n\n' +
            "Per rivederlo: apri quella playlist. Per riportarlo in libreria: " +
            "tieni premuto e scegli 'Torna in libreria'.",
          "Sposta"
        );
        if (!si) return;
        _mettiSoloInPlaylist(t.id);
        _playlistAttiva = inChePlaylist[0];
        _disegnaLinguettePlaylist();
        render();
        toast('"' + t.title + '" ora si vede solo dentro "' + inChePlaylist[0] + '"');
      }));
    }
  }
    /* Se una canzone e' di un altro nome, posso averla anche io. Stefano lo
     vuole cosi': che si DUPLICA nella mia libreria, e all'altro resta com'e'. */
  if (t.builtin && t.profile && t.profile !== profile) {
    box.appendChild(quickAction("Porta nella mia libreria", ICON_LIBRARY, async () => {
      const si = await askConfirm(
        "Copiare questa canzone nella tua libreria?",
        '"' + t.title + '" e\' di ' + t.profile + '.\n\n' +
          "Copia e basta: a " + t.profile + " resta esattamente come adesso,\n" +
          "non perde niente e non gli sparisce niente.",
        "Copia"
      );
      if (!si) return;
      await _portaNellaMiaLibreria(t);
    }));
  }
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
    if (autoplay) {
      _cominciaBranoNuovo();
      /* sto cambiando brano da solo: da qui la musica DEVE suonare */
      _vuoleSuonare = true;
      _ultimoScorrimento = Date.now();
    }
    // La pausa generata dal cambio di sorgente non e' una pausa dell'utente.
    audio._mbCambioBrano = true;
    audio.src = t.url;
    audio.volume = volumePct / 100;
    setHud();
    updateProgressUI(0, 0);
    const activeEl = playlistEl.querySelector(".track.active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    updateMediaSession();
    if (autoplay) await doPlay();
    /* tengo pronto il brano dopo, cosi' quando questo finisce parte subito */
    if (autoplay) _preparaIlSuccessivo(queue.length ? queue[0] : idBranoA(nextIndex()));
  }

  /* Il brano in una certa posizione, ma SENZA far esplodere niente.
     Prima scrivevo direttamente tracks[indice].id: se la libreria e' vuota
     (un computer nuovo, o un profilo senza brani, o tutti brani nascosti)
     tracks[0] non esiste e la pagina si fermava con un errore. */
  function idBranoA(indice) {
      if (indice === null || indice === undefined || indice < 0) return "";
      /* Leggo dalla stessa lista usata da nextIndex/prevIndex, altrimenti
         l'indice punta a un brano diverso (e' successo: avanti suonava un
         brano nascosto perche' gli indici venivano da due liste diverse). */
      const lista = _listaPerIlSeguito();
      const t = (lista && lista[indice]) ? lista[indice] : tracks[indice];
      return (t && t.id) ? t.id : "";
    }

  /* Avanti/Indietro devono seguire la lista che sto GUARDANDO, non tutti i
     brani. Prima usavano "tracks" (tutti), quindi passando da un brano al
     successivo si sentivano anche quelli nascosti e quelli rimasti solo
     dentro una playlist: esattamente quello che non voleva Stefano.

     Se sono dentro una playlist, il seguito e' quello della playlist; se
     sto filtrando (preferiti, mai ascoltati, ricerca) vedo quello che
     vedo. */
  /* La lista per capire quale canzone viene dopo. "true" = sto per far
     suonare qualcosa, non solo sfogliare: cambia il comportamento (vedi
     visibleTracks). */
  function _listaPerIlSeguito() {
    try { return visibleTracks(true); } catch (e) { return tracks; }
  }

  /* Canzoni gia' suonate nella riproduzione casuale.

   Ste vuole che in casuale non si senta due volte la stessa canzone: quando
   non ne rimangono di fresche, ricomincio da capo (e quindi ricominciano anche
   le ripetizioni, altrimenti la musica resterebbe ferma). */
let _casualeFresche = null;

function _azzeraCasuale() { _casualeFresche = null; }

function _prossimaCasuale(lista) {
  if (!_casualeFresche || _casualeFresche.size === 0) {
    _casualeFresche = new Set(lista.map((t) => t.id));
  }
  /* Se sono finite le fresche, ricomincio il giro. */
  if (_casualeFresche.size >= lista.length) {
    _casualeFresche = new Set(lista.map((t) => t.id));
  }
  /* La canzone che sta suonando non e' piu' "fresca". */
  if (currentId) _casualeFresche.delete(currentId);
  const rimaste = lista.filter((t) => _casualeFresche.has(t.id));
  if (!rimaste.length) {
    _casualeFresche = new Set(lista.map((t) => t.id));
    return Math.floor(Math.random() * lista.length);
  }
  return lista.findIndex((t) => t.id === rimaste[Math.floor(Math.random() * rimaste.length)].id);
}

  function nextIndex() {
    const lista = _listaPerIlSeguito();
    if (!lista.length) return -1;
    if (shuffle && lista.length > 1) {
      const n = _prossimaCasuale(lista);
      return n >= 0 ? n : 0;
    }
    const idx = lista.findIndex((x) => x.id === currentId);
    /* Se il brano che sto ascoltando non e' nella lista (l'ho appena tolto,
       o ero dentro una playlist e ora sono fuori), parto dall'inizio
       invece di dare un indice a caso. */
    if (idx < 0) return 0;
    return (idx + 1) % lista.length;
  }

  function prevIndex() {
    const lista = _listaPerIlSeguito();
    if (!lista.length) return -1;
    const idx = lista.findIndex((x) => x.id === currentId);
    if (idx < 0) return 0;
    return (idx - 1 + lista.length) % lista.length;
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

  /* Mettere in pausa o far ripartire, per scelta.

     Stanno QUI e non dentro i singoli tasti, perche' prima ogni tasto si
     fermava da solo e il risultato era che quello del blocco schermo fermava
     l'audio senza dire niente all'app: entro tre secondi l'app credeva che
     avessi dimenticato di mettere play e la musica ripartiva da sola.

     Ora: il tasto play, il tasto pausa del telefono e quello del blocco
     schermo passano tutti di qui, quindi non possono piu' discordare. */
  function _pausaVolontaria() {
    /* "adesso il silenzio e' voluto": lo dico subito a tutto il resto,
       altrimenti chi aspetta di riavviare la musica mi riaccende. */
    _vuoleSuonare = false;
    _silenziDiFila = 0;
    if (_timerRiprove) { clearTimeout(_timerRiprove); _timerRiprove = null; }
    if (_timerAiuto) { clearTimeout(_timerAiuto); _timerAiuto = null; }
    if (audio) { try { audio.pause(); } catch (e) { /* noop */ } }
    _nascondiAiuto();
    syncPlayUI();
  }

  function _riproduciVolontaria() {
    _vuoleSuonare = true;
    _ultimoScorrimento = Date.now();
    _silenziDiFila = 0;
    if (_timerRiprove) { clearTimeout(_timerRiprove); _timerRiprove = null; }
    if (_timerAiuto) { clearTimeout(_timerAiuto); _timerAiuto = null; }
    return doPlay();
  }

  async function togglePlay() {
    if (!currentId && tracks.length) await playById(tracks[0].id);
    /* l'utente preme play quando e' fermo, e pause quando sta suonando */
    if (audio.paused) _riproduciVolontaria();
    else _pausaVolontaria();
  }

  /* Comandi ricevuti dal player nativo iOS (solo quando il bridge esiste). */
  window.addEventListener("musicbox-native-control", (event) => {
    const detail = (event && event.detail) || {};
    try {
      switch (detail.action) {
        case "play":
          _riproduciVolontaria();
          break;
        case "pause":
          _pausaVolontaria();
          break;
        case "toggle":
          if (audio && !audio.paused) _pausaVolontaria();
          else _riproduciVolontaria();
          break;
        case "next":
          playNext();
          break;
        case "previous": {
          const id = idBranoA(prevIndex());
          if (id) playById(id);
          break;
        }
        case "seek":
          if (audio && isFinite(Number(detail.time)) && isFinite(audio.duration)) {
            audio.currentTime = Math.max(0, Math.min(Number(detail.time), audio.duration));
            updateProgressUI(audio.currentTime, audio.duration);
            _notificaStatoNativo(true);
          }
          break;
      }
    } catch (e) { /* controllo remoto non disponibile: nessun effetto su Safari */ }
  });

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
      album: APP_NAME,
      artwork: cop ? [{ src: cop, sizes: "512x512" }] : [{ src: "icon-512.png", sizes: "512x512", type: "image/png" }]
    });
    navigator.mediaSession.metadata = meta;
    _aggiornaPosizioneSchermo();
    const setHandler = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* noop */ }
    };
    /* Tasti del blocco schermo: passano dagli stessi due posti del tasto
       play/pausa dell'app, altrimenti potrebbero dimenticarsi di dire
       "l'utente ha messo pausa" e la musica ripartirebbe da sola. */
    setHandler("play", () => { _riproduciVolontaria(); });
    setHandler("pause", () => { _pausaVolontaria(); });
    setHandler("nexttrack", () => playNext());
    setHandler("previoustrack", () => playById(idBranoA(prevIndex())));
    setHandler("seekto", (d) => {
      if (d.seekTime != null && audio && isFinite(audio.duration)) {
        audio.currentTime = Math.max(0, Math.min(d.seekTime, audio.duration));
        updateProgressUI(audio.currentTime, audio.duration);
      }
    });
    /* NON registro "avanti/indietro di 15 secondi".
       Ste li aveva: con questi due comandi attivi, l'iPhone si metteva
       "salta 10 secondi" ai lati della pausa invece di "canzone
       precedente" e "canzone successiva", che e' quello che voleva lui.
       Gli advancedi e i rientri di 15 secondi restano comunque disponibili
       dentro l'app, sulla barra sopra al play. */
    setHandler("stop", () => { _pausaVolontaria(); });
    setPlaybackState(audio && !audio.paused ? "playing" : "paused");
    _notificaStatoNativo(true);
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
        /* Per i brani della libreria NON passo da un file creato in memoria:
           su iPhone un "scarica" cosi' finisce in un posto dove poi non lo
           trovi piu'. Usando il collegamento diretto, il telefono lo mette
           nelle Download (cartella File) e da li' lo puoi ascoltare anche con
           lo schermo spento, perche' li e' l'app File, che e' un programma
           vero e non una pagina web. */
        const nomeFile = (t.artist ? t.artist + " - " : "") + t.title.replace(/[\\/:*?"<>|]/g, "") + ".mp3";
        const a2 = document.createElement("a");
        a2.href = t.url;
        a2.download = nomeFile;
        a2.rel = "noopener";
        document.body.appendChild(a2);
        a2.click();
        a2.remove();
        toast("Salvo nelle Download del telefono. Da li' lo apri con File e lo suoni anche a schermo spento.");
        return;
      }
      {
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

  /* I profili che sono nati su questo telefono (gli amici). I tre di sistema
     stanno nel codice; gli altri se li crea qui chi usa l'app, cosi' non
     devo rifare il sito ogni volta che si aggiunge qualcuno. */
  function profiliLocali() {
    try {
      const v = JSON.parse(LS.get("mb.profili", "[]"));
      if (!Array.isArray(v)) return [];
      return v.filter((n) => typeof n === "string" && n.trim() && n.trim().length <= 24);
    } catch (e) { return []; }
  }

  function _aggiungiProfiloLocale(nome) {
    const n = String(nome || "").trim().slice(0, 24);
    if (!n) return "";
    const gia = profiliLocali();
    const tutti = PROFILI.map((p) => p.nome);
    if (tutti.some((x) => x.toLowerCase() === n.toLowerCase())) return n;
    gia.push(n);
    try { LS.set("mb.profili", JSON.stringify(gia)); } catch (e) { /* noop */ }
    return n;
  }

  function profileList() {
    // il profilo aperto per primo, poi tutti gli altri
    const base = PROFILI.map((p) => p.nome);
    const nomi = base.concat(profiliLocali().filter((n) => !base.includes(n)));
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
  /* Dopo aver aggiunto un file: lo metto online?
   Ste: questa scelta era sparita e i brani restavano solo sul telefono senza
   saperlo. Prima prova col computer (veloce, e' la strada normale); se il
   computer non risponde uso il servizio, che funziona anche a PC spento. */
async function _chiediDoveMandare(fresh) {
    const ids = (fresh || []).filter((t) => !eGiaCondiviso(t)).map((t) => t.id);
    if (!ids.length) {
      /* Ste: "non lo chiede". Prima, se il brano era gia' in libreria la
         domanda semplicemente non compariva e sembrava che l'app si fosse
         dimenticata. Ora lo dico: e' gia' online, non lo aggiungo due volte. */
      toast("Questa canzone e' gia' in libreria: non la aggiungo due volte", 5000);
      return;
    }
  const uno = ids.length === 1;
  const si = await askConfirm(
    (uno ? "1 brano aggiunto" : ids.length + " brani aggiunti") + ": lo metto online?",
    "Adesso sono solo su questo telefono.\n\n" +
      "Provo prima col computer. Se il computer e' spento o non risponde,\n" +
      "uso il servizio, che funziona anche senza PC acceso.\n\n" +
      "Se non lo vuoi online, lascialo qui: resta solo su questo telefono.",
    "Metto online"
  );
  if (!si) {
    toast("Ok: resta solo su questo telefono");
    return;
  }

  /* Strada 1: il computer. */
  try {
    _recentementeAggiunto = true;
    await condividiBraniLocali(true);
  } catch (e) { /* il computer non c'e': vado col servizio */ }

  /* Strada 2: il servizio, per quello che il computer non ha preso. */
  const rimasti = [];
  for (const id of ids) {
    const r = await dbGet(id);
    if (r && !r.condiviso) rimasti.push(r);
  }
  if (!rimasti.length) {
    toast(ids.length === 1 ? "Messo online: lo sentono tutti" : ids.length + " brani online");
    return;
  }
  if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) {
    toast("Il computer non ha preso i brani e il servizio non e' attivo: restano qui. Riprova dal menu Altro.", 7000);
    return;
  }
  const fatti = [];
  for (const r of rimasti) {
    try { await _pubblicaSulSito(r); fatti.push(r); } catch (e) { /* ne riparo dopo */ }
  }
  if (fatti.length) {
    toast(fatti.length === 1 ? "Messo online col servizio" : fatti.length + " brani online col servizio");
    await loadAll();
    render();
    return;
  }
  toast("Non sono riuscito a metterli online. Riprova dal menu Altro.", 6000);
}

async function addFiles(fileList) {
    let ok = 0;
    let giaInLista = 0;
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
      await loadAll();
      const fresh = tracks.filter((t) => !t.builtin).slice(-ok);
      /* Se il brano era gia' nella libreria condivisa non lo metto due volte
         (la riga condivisa basta). Ma allora lo dico: prima non diceva niente
         e sembrava che il file si fosse perso. */
      for (const t of fresh) {
        if (eGiaCondiviso({ title: t.title, artist: t.artist })) giaInLista++;
      }
      const parti = [];
      const nuovi = ok - giaInLista;
      if (nuovi > 0) parti.push(nuovi === 1 ? "1 brano aggiunto" : nuovi + " brani aggiunti");
      if (giaInLista > 0) {
        parti.push(giaInLista === 1
          ? "1 era gia nella libreria, non l'ho ripetuto"
          : giaInLista + " erano gia nella libreria, non li ho ripetuti");
      }
      toast(parti.join(" e ") + ": solo per " + profile);
      /* vado subito al brano nuovo, cosi lo vede: prima finiva in fondo alla
         lista e sembrava non comparire. */
      const daMostrare = fresh.find((t) => !eGiaCondiviso({ title: t.title, artist: t.artist }));
      if (daMostrare) {
        setTimeout(() => {
          try {
            const righe = Array.from(playlistEl.children);
            const li = righe.find((x) => (x.getAttribute("data-id") || "") === daMostrare.id);
            if (li) {
              li.scrollIntoView({ block: "center" });
              li.classList.add("appena-aggiunto");
              setTimeout(() => li.classList.remove("appena-aggiunto"), 2800);
            }
          } catch (e) { /* pazienza */ }
        }, 300);
      }
for (const t of fresh) enrichTrack(t.id);
      /* Segno che sto condividendo un brano appena aggiunto: se il computer
         non risponde l'app lo dice, altrimenti l'utente cerca il brano nella
         libreria (che e' sul computer) e non lo trova mai. */
try { _recentementeAggiunto = true; condividiBraniLocali(true); } catch (e) { /* non blocca l'aggiunta */ }
        /* Ste: dopo aver aggiunto un file non compariva piu' la scelta
           "manda al computer / manda al servizio", e restava con la musica
           solo sul telefono senza saperlo. Gliela chiedo, con tre uscite:
           col computer, col servizio (funziona anche a PC spento), o lasciare
           qui e basta. */
        _chiediDoveMandare(fresh);
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
    /* Se il brano e' anche in una playlist, chiedo dove toglierlo: solo
       dalla libreria (l'bagno per davvero rimane nelle playlist? no: allora
       niente), solo dalle playlist, o da entrambe. */
    const nellePlaylist = _playlistCheContengono(id);
    if (nellePlaylist.length) {
      const scelta = await _scegliCosaTogliere(id, t.title || "", true);
      if (!scelta) return;
      if (scelta === "playlist") {
        for (const nome of nellePlaylist) {
          const pl = _playlistCercata(nome);
          if (pl) pl.tracks = (pl.tracks || []).filter((x) => x !== id);
        }
        saveCurrentState();
        _salvaPlaylistCondivise();
        renderPlaylist();
        _aggiornaBadgePlaylist();
        toast("Tolto dalle playlist, ma resta nella libreria e sul sito");
        return;
      }
      /* sia "libreria" che "entrambe": le playlist si svuotano comunque,
         altrimenti resterebbero con un brano che non esiste piu' */
      for (const nome of nellePlaylist) {
        const pl = _playlistCercata(nome);
        if (pl) pl.tracks = (pl.tracks || []).filter((x) => x !== id);
      }
      saveCurrentState();
      _salvaPlaylistCondivise();
    }
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
      /* Anche "rimettili in lista" va sul sito, altrimenti dall'altra
         scorciatoia il brano resterebbe nascosto. */
      _salvaStatoCondiviso();
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
    /* Ste: "velocizza il tempo in cui ci mette a inserire le canzoni". Ho appena
       dato la canzone al computer: non mi metto in attesa i secondi che seguono,
       guardo subito se e' gia' arrivata in libreria (il computer ci mette poco). */
    try { _ultimoControllo = 0; } catch (e) { /* noop */ }
    /* Ogni brano nuovo lo condivido subito con gli altri dispositivi, senza
       aspettare che venga ricaricata la pagina. */
    condividiBraniLocali(true);
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
  /* Gli indirizzi dove provo a trovare il programma sul computer, in
     ordine. Il primo che risponde vince e viene usato per tutto il resto.

     - 127.0.0.1: quando la pagina e' aperta sul computer stesso
     - 192.168.1.2: il computer sulla rete di casa, cioe' quello che
       interessa quando l'apro dal telefono collegato al Wi-Fi di casa
     - 100.106.211.2: quello di Tailscale, per quando si usa la rete privata

     Prima mancava quello di casa: dal telefono non riuscivo a trovare il
     programma del computer e i brani non venivano condivisi. */
  /* Ste: "il telefono non trova piu' il computer". Il computer aveva cambiato
     indirizzo sulla rete (ora e' 192.168.1.40, prima era 192.168.1.2) e
     nell'elenco c'era solo il vecchio: il telefono provava, non rispondeva
     niente e ogni salvataggio finiva a terra. Metto dentro anche quello
     nuovo, cosi' va bene con tutti e due. */
  const INDIRIZZI_PONTE = [
    "http://127.0.0.1:8788",
    "http://192.168.1.40:8788",
    "http://192.168.1.2:8788",
    "http://100.106.211.2:8788"
  ];
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

  /* Ste: "si continua ad aggiornare", "la lista si riordina", "la musica si
     interrompe e riparte". Ho provato a indovinare il motivo e non ci sono
     arrivato, quindi adesso lo REGISTRO: ogni volta che la libreria si
     ricostruisce o la musica riparte, me lo segno e poi leggo cosa e'
     successo davvero (e con che tempi). Non cambia niente nel
     comportamento: e' solo un appunto. */
  let _diagUltimo = 0;
  function _diag(testo) {
    try {
      const ora = Date.now();
      if (ora - _diagUltimo < 1200) return;
      _diagUltimo = ora;
      const el = $("playlist");
      const scorrimento = el ? Math.round(el.scrollTop) : -1;
      const quante = Array.isArray(tracks) ? tracks.length : -1;
      /* Mi serve anche CHI mi sta chiamando: senza questo non si capiva
         nulla. Prendo solo i nomi delle funzioni, senza file e numeri di
         riga (cambiano a ogni versione e renderebbero il messaggio illeggibile). */
      let chiama = "";
      try {
        const st = String(new Error().stack || "");
        chiama = st.split("\n").slice(2, 7).map((riga) => {
          const m = /at\s+([A-Za-z_$][\w$.<>]*)\s*\(/.exec(riga);
          return m ? m[1] : "?";
        }).filter((x) => x && x !== "?").join(" > ");
      } catch (e) { /* noop */ }
      segnalaErrore("DIAG " + testo + " | " + (chiama || "nessun chiamante") +
        " | scorrimento=" + scorrimento + " | brani=" + quante + " | profilo=" + profile);
    } catch (e) { /* noop */ }
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
        /* Artisti e titolo LI MANIO SEPARATI: il PC li mette insieme nel nome
           del file nell'ordine giusto. Prima gli mandavo "artista - titolo"
           già attaccato e se il brano aveva i nomi scambiati restavano
           scambiati per sempre. */
        artista: (item.artist || ""),
        titolo: (item.title || "")
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
      /* Ste: riscaricavo lo stesso brano piu' volte e in libreria finivano due
         copie. Ora il PC se ne accorge e non crea il secondo file: te lo dico
         perche' cosi' non pensi che sia andato storto qualcosa. */
      if (copia === "gia-presente") toast("Questo brano ce l'hai gia': non ho creato un secondo file", 5000);
      /* Ste: "ci sono canzoni con un mp3 diverso dal titolo". Il computer ora
         controlla il titolo VERO del video scaricato: se non e' quello che
         avevo chiesto me lo dice qui, invece di lasciare un brano sbagliato in
         libreria senza che se ne accorga nessuno. */
      let attenzione = r.headers.get("X-Attenzione") || "";
      if (attenzione) { try { attenzione = decodeURIComponent(attenzione); } catch (e) { } }
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
      /* Se il computer mi ha detto che il video non era quello che avevo
         chiesto, lo dico subito e adesso: cosi' vedi subito che quel brano
         e' sbagliato e lo cambi, invece di ritrovartelo fra giorni. */
      if (attenzione) {
        toast(attenzione.replace(/^ATTENZIONE:\s*/i, ""), 9000);
        segnalaErrore(attenzione.slice(0, 160));
      }
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
      /* Aggiungere da YouTube direttamente da qui: il nome lo so gia' (e' il
         brano che sto cercando), quindi non devo riscriverlo. */
      nuovoBottone(gruppo, "Aggiungi da YouTube", () => {
        $("quickPanel").hidden = true;
        _aggiungiDaYouTube([(item.artista || ""), (item.titolo || "")].join(" - ")
          .replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim());
      }, "btn-mini-auto",
        "Prendo il link dagli appunti e aggiungo questo brano: col PC acceso subito, col PC spento in coda");
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

  /* Questo brano e' gia' nella libreria? Lo controllo PRIMA di salvare,
     perche' una volta salvare e poi nascondere funzionava, ma lasciava
     tracce e non diceva niente all'utente: lui vedeva la canzone che
     riappariva e pensava che il brano si fosse perso.

     Uso stessoBrano() perche' confronta artista e titolo come li vede
     l'utente (ripuliti, senza "(Remastered)" ecc.). */
  function giaInLibreria(meta) {
    if (!meta || !meta.title) return null;
    /* un brano gia' importato in precedenza su questo dispositivo */
    for (const t of tracks || []) {
      if (stessoBrano(meta, t)) return t;
    }
    /* uno scaricato dal sito (non e' in tracks se e' nascosto) */
    for (const b of BUILTIN || []) {
      if (stessoBrano(meta, b)) return { title: stripArtistPrefix(b.artist, b.title) || b.title, artist: b.artist, builtin: true };
    }
    return null;
  }

  async function finishImport(item, blob, source) {
      if (item.el) {
        item.el.fill.classList.add("ok");
        item.el.fill.style.width = "100%";
      }
      const meta = item.meta || { title: item.title, artist: item.artist, album: "" };
      /* Se e' gia' presente non lo aggiungo e lo dico: meglio cosi' che
         lasciare due copie dello stesso brano. */
      const gia = giaInLibreria(meta);
      if (gia) {
        item.state = "done";
        item.duplicato = true;
        paintImport(item);
        toast("\"" + meta.title + "\" era gia' nella libreria: non l'ho aggiunto due volte", 5000);
        segnalaErrore("import saltato (gia' in libreria): " +
          String((meta.artist || "") + " " + meta.title).slice(0, 80));
        return null;
      }
      const rec = await saveImported(meta, blob, source);
      for (const k of trackKeys(meta)) libKeys.add(k);
      item.savedId = rec.id;
      item.state = "done";
      paintImport(item);
      toast(meta.title + " importato");
      await loadAll();
      return rec;
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
      /* Brano gia' presente in libreria: lo dico subito nella riga, cosi'
         anche senza guardare l'avviso in fondo si capisce perche' non e'
         stato aggiunto. */
      if (item.duplicato) {
        el.tags.innerHTML = "";
        el.actions.innerHTML = "";
        const s = document.createElement("span");
        s.className = "imp-tag dup";
        s.textContent = "Gia' nella libreria";
        el.tags.appendChild(s);
        if (el.bytes) el.bytes.textContent = "Non l'ho aggiunto due volte";
        if (el.fill) { el.fill.style.width = "100%"; el.fill.classList.add("ok"); }
        return;
      }
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
function toast(msg, durata) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  /* Ste: i messaggi lunghi si devono poter chiudere subito toccandoli,
     altrimenti restano li' a coprire la libreria. */
  el.classList.add("toccabile");
  el.onclick = () => { el.classList.remove("show"); el.classList.remove("toccabile"); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    el.classList.remove("toccabile");
  }, durata || 2200);
}

  /* ---------- Il menu "altro" ----------
     In alto c'erano dieci tasti in fila: sul telefono si doveva scorrere in
     lato per vederli, e non si capiva piu' niente. Adesso restano solo
     statistiche, profilo e questo menu; tutto il resto sta dentro. */
  function _chiudiAltro() {
    const m = $("menuAltro");
    if (m) m.hidden = true;
    /* Anche la guida si chiude insieme al menu: se no resterebbe aperta
       sopra tutto quando torni a un'altra schermata dal menu. */
    try { _chiudiAiuto(); } catch (e) { /* non c'e' ancora: va bene */ }
    const v = document.getElementById("menu-altro-velo");
    if (v && v.parentNode) v.parentNode.removeChild(v);
    const b = $("btnAltro");
    if (b) {
      b.setAttribute("aria-expanded", "false");
      b.classList.remove("on");
    }
  }
  function _apriAltro() {
    const m = $("menuAltro");
    if (!m) return;
    m.hidden = false;
    let v = document.getElementById("menu-altro-velo");
    if (!v) {
      v = document.createElement("div");
      v.id = "menu-altro-velo";
      v.className = "menu-altro-velo";
      document.body.appendChild(v);
      v.addEventListener("click", _chiudiAltro);
    }
    const b = $("btnAltro");
    if (b) { b.setAttribute("aria-expanded", "true"); b.classList.add("on"); }
  }
  /* Toccando una voce del menu il menu si chiude: altrimenti resta aperto
     sopra la pagina e sembra rotto. */
  document.addEventListener("click", (e) => {
    const m = $("menuAltro");
    if (!m || m.hidden) return;
    if (m.contains(e.target)) {
      if (e.target.closest && e.target.closest("button")) _chiudiAltro();
    }
  });

  document.addEventListener("keydown", (e) => {
    const m = $("menuAltro");
    if (!m || m.hidden) return;
    if (e.key === "Escape" || e.key === "Esc") _chiudiAltro();
  });
  window.addEventListener("resize", () => { _chiudiAltro(); });

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

  /* Pulsante "Riproduzione casuale", nel menu "Altro".

   Ste lo chiede cosi': se lo premo dalla libreria, le canzoni NON seguono
   l'ordine in cui sono messe ma suonano a caso; e NON si infilano in mezzo
   le canzoni delle playlist. Viceversa, se lo premo dentro una playlist,
   suonano a caso solo le canzoni di quella playlist.

   Il resto lo fa gia' nextIndex(), che mescola la lista "per suono": dentro
   la libreria quella lista e' la libreria, dentro una playlist e' la playlist. */

function _accendiCasuale(accendi) {
  shuffle = Boolean(accendi);
  /* Giro nuovo: se riaccendo il casuale non devo ricordarmi le canzoni
     dell'ultima volta. */
  _azzeraCasuale();
  LS.set("mb.shuffle", shuffle);
  try { $("btnShuffle").classList.toggle("on", shuffle); } catch (e) { /* noop */ }
  try { const b = $("btnCasuale"); if (b) b.classList.toggle("on", shuffle); } catch (e) { /* noop */ }
  return shuffle;
}

function _toggleCasuale() {
  const acceso = _accendiCasuale(!shuffle);
  if (!acceso) {
    toast("Torni in ordine: le canzoni si susseguono come sono nella lista");
    return;
  }
  /* Appena acceso, salto subito a una canzone a caso: cosi' si sente subito
     che non sta andando piu' in ordine. */
  const lista = _listaPerIlSeguito();
  if (lista.length > 1) {
    const id = lista[Math.floor(Math.random() * lista.length)].id;
    if (id && id !== currentId) playById(id);
  }
  if (_playlistAttiva) {
    toast('Casuale: suonano solo le canzoni di "' + _playlistAttiva + '", in ordine sparso');
  } else {
    toast("Casuale: suonano solo le canzoni della libreria, in ordine sparso");
  }
}

$("btnCasuale").addEventListener("click", () => { _chiudiAltro(); _toggleCasuale(); });

$("btnShuffle").addEventListener("click", () => {
  _accendiCasuale(!shuffle);
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
  /* Il bottone "Canzoni con lo stesso nome" e il suo pannello. */
  $("btnSimili").addEventListener("click", () => { _chiudiAltro(); _stampaSimili(); });
  $("similiClose").addEventListener("click", _chiudiPannelloSimili);
  $("similiPanel").addEventListener("click", (e) => {
    if (e.target === $("similiPanel")) _chiudiPannelloSimili();
  });
  $("fallitiClose").addEventListener("click", _chiudiPannelloFalliti);

  /* Pannello dei brani tolti dalla lista: chiudi, e dentro si sceglie
     brano per brano (Ste non vuole rimetterli per forza tutti insieme). */
  $("nascostiClose").addEventListener("click", _chiudiNascosti);
  $("nascostiPanel").addEventListener("click", (e) => {
    if (e.target === $("nascostiPanel")) _chiudiNascosti();
  });
  $("nascostiCorpo").addEventListener("click", (e) => {
    const t = e.target;
    if (!t) return;
    const azione = t.getAttribute("data-azione");
    if (azione === "tutti") {
      if (!confirm("Vuoi rimettere nella lista tutti i brani tolti?")) return;
      restoreHidden();
      _stampaNascosti();
      return;
    }
    if (azione === "rimetti") {
      const riga = t.closest ? t.closest(".falliti-riga") : null;
      if (!riga) return;
      _rimettiNascosto(riga.getAttribute("data-id"));
    }
  });
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

  /* Ste: "se premo il tasto + non spunta importa musica". Prima questo tasto
   apriva direttamente i file, senza mostrare niente, quindi non si capiva
   cosa fosse e "Importa musica" si trovava solo nel menu in alto. Adesso il
   + apre le scelte, e "Importa musica" c'e' con quel nome. */
function _chiudiFabMenu() {
  const m = $("fabMenu");
  if (m) m.hidden = true;
  syncNoScroll();
}
function _apriFabMenu() {
  const m = $("fabMenu");
  if (!m) { fileInput.click(); return; }
  m.hidden = false;
  syncNoScroll();
}
$("fab").addEventListener("click", _apriFabMenu);
$("fabChiudi").addEventListener("click", _chiudiFabMenu);
$("fabImporta").addEventListener("click", () => {
  _chiudiFabMenu();
  fileInput.click();
});
$("fabCercaTitolo").addEventListener("click", () => {
  /* Lo dice lui: vuole scrivere il titolo e fare "cerca brani". Gli metto il
     cursore nella casella di ricerca con il telefono aperto per la tastiera. */
  _chiudiFabMenu();
  try {
    if (searchEl) {
      searchEl.focus();
      if (searchEl.scrollIntoView) searchEl.scrollIntoView({ block: "center" });
    }
  } catch (e) { /* noop */ }
  toast("Scrivi il titolo sopra e guarda i brani che trovi", 5000);
});
$("fabYouTube").addEventListener("click", () => {
  _chiudiFabMenu();
  try { _aggiungiDaYouTube(); } catch (e) { /* noop */ }
});
$("fabMenu").addEventListener("click", (e) => {
  if (e.target === $("fabMenu")) _chiudiFabMenu();
});
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

  /* Bottone diagnostica nel menu "Altro": serve a me, non agli utenti, ma lo
   metto lo stesso perche' e' l'unico modo di sapere dove finiscono i dati. */
  try {
    const bd = document.getElementById("btnDiagnostica");
    if (bd) bd.addEventListener("click", () => { _apriDiagnostica(); });
    const dc = document.getElementById("diagClose");
    if (dc) dc.addEventListener("click", () => { const o = document.getElementById("diagOverlay"); if (o) o.hidden = true; });
    const ov = document.getElementById("diagOverlay");
    if (ov) ov.addEventListener("click", (e) => { if (e.target === ov) ov.hidden = true; });
  } catch (e) { /* noop */ }
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
      const versione = (k) => {
        const m = /-v(\d+)$/.exec(k);
        return m ? Number(m[1]) : -1;
      };
      const recenti = keys.slice().sort((a, b) => versione(b) - versione(a));
      for (const k of recenti) {
        const c = await caches.open(k);
        const hit = await c.match("app.js");
        if (hit) return c;
      }
      return await caches.open(recenti[0]);
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

let _firmaLibreria = "";
let _ultimoControllo = 0;

/* Ste: "si continua ad aggiornare" senza sapere cosa. Questo me lo dice:
   ogni volta che la libreria viene davvero ricostruita, il numero della
   versione mostra quando e' successo. Se resta fermo, la libreria non si
   e' mossa e quello che vedi e' un'altra cosa. */
function _aggiornaEtichettaControllo(che) {
  try {
    const vb = $("verBadge");
    if (!vb) return;
    const quando = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    vb.dataset.aggiornato = quando;
    vb.title = "Versione in uso: " + APP_VERSION +
      "\nUltimo controllo nuove canzoni: " + quando +
      "\nUltima libreria ricostruita: " + (che || vb.dataset.aggiornato || "nessuna") +
      "\n(tocca per ricaricare)";
  } catch (e) { /* noop */ }
}

async function checkForNewSongs() {
    if (checkingSongs) return;
    /* Quanti brani ho davanti in questa copia dell'app: serve per il confronto
       veloce con versione.json. */
    try { _quantiBraniOnline = (typeof BUILTIN !== "undefined" && BUILTIN.length) ? BUILTIN.length : 0; } catch (e) { /* noop */ }
    /* Ste: "puoi velocizzare il tempo in cui ci mette a inserire le canzoni".
       Prima aspettavo almeno 2 minuti prima di guardare, e poi scaricavo
       tutto app.js (400 KB) ogni volta. Ora:
         - guardo un file minuscolo (versione.json, poche decine di byte)
           ogni volta, quindi posso farlo spesso senza costare nulla;
         - scarico i 400 KB di app.js SOLO se quel file mi dice che c'e'
           qualcosa di nuovo. */
    const ora = Date.now();
    if (ora - _ultimoControllo < 20000) return;
    _ultimoControllo = ora;
    checkingSongs = true;
    try {
      /* Primo il file leggero: se la versione e' quella che ho gia', ho
         finito e non scarico nient'altro. */
      try {
        const risposta = await fetch("versione.json?t=" + ora, { cache: "no-store" });
        if (risposta.ok) {
          const piccolo = await risposta.json();
          const mia = String(typeof APP_VERSION !== "undefined" ? APP_VERSION : "");
          const suoi = String(piccolo.versione || "");
          const stessi = !!mia && !! suoi && mia.split(".").slice(0, 2).join(".") === suoi.split(".").slice(0, 2).join(".");
          /* Se la versione coincide, non scarico app.js: risparmio 400 KB
             a ogni controllo. Se invece il conteggio dei brani e' diverso,
             c'e' davvero qualcosa di nuovo e voglio accorgermene subito. */
          if (stessi && Number(piccolo.brani || 0) === _quantiBraniOnline) {
            _aggiornaEtichettaControllo();
            return;
          }
        }
      } catch (e) { /* il file non c'e': vado col metodo vecchio */ }
      const res = await fetch("app.js", { cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      const parsed = parseBuiltinFrom(text);
      if (!parsed || !parsed.length) return;
      /* Confronto col sito solo per i brani che SONO nella mia libreria (i miei piu'
         quelli che ho copiato dagli altri). Se guardassi tutti i brani del
         sito, le canzoni degli altri sembrerebbero sparite e potrei essere
         invitato a cancellarle: cosa che non voglio mai. */
      const mine = parsed.filter((b) => _devoVedereBrano((b.profile || DEFAULT_PROFILE) === profile, b));
      const remoteFiles = mine.map((b) => b.file);
      const localBuiltin = tracks.filter((t) => t.builtin);
      const localFiles = localBuiltin.map((t) => t.url);
      const aggiunte = mine.filter((b) => localFiles.indexOf(b.file) < 0);
      const tolte = localFiles.filter((f) => remoteFiles.indexOf(f) < 0);
      /* Una canzone che manca al sito puo' sparire solo a meta' di un aggiornamento:
         la tolgo solo se la vedo assente DUE controlli di fila (piu' o meno 2 minuti),
         cosi' un aggiornamento o una copia vecchia non cancella mai brani validi. */
      const viste = LS.get("mb.senza", []);
      const confermate = tolte.filter((f) => viste.indexOf(f) >= 0);
      if (tolte.length) LS.set("mb.senza", tolte);
      else LS.remove("mb.senza");
      if (confermate.indexOf(audio && audio.src ? audio.src.replace(location.href, "") : "") >= 0) return;
      if (!aggiunte.length && !confermate.length) { _quantiBraniOnline = parsed.length; _aggiornaEtichettaControllo(); return; }
      /* Firma di quello che ho davanti: se combacia, e' la stessa libreria e
         non la ridisegno (e' quello che faceva saltare gli schermi). */
      const firma = (mine.map((b) => b.file).sort().join("|") + "#" + confermate.length);
      if (firma === _firmaLibreria) { _aggiornaEtichettaControllo(); return; }
      _firmaLibreria = firma;
      _quantiBraniOnline = parsed.length;
      /* Prima di ridisegnare, mi segno dove eri: cosi' la lista non ti
         rimanda in cima mentre ti muovi. */
      _salvaPuntoLibreria();

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
      _ripristinaPuntoLibreria();
      _aggiornaEtichettaControllo();
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
  $("btnCreaPlaylist").addEventListener("click", () => { _chiudiAltro(); creaPlaylist(); });
  /* Le linguette: "Tutte" riporta alla libreria intera, il "+" crea. */
  $("plLingTutte").addEventListener("click", () => {
    _playlistAttiva = "";
    _disegnaLinguettePlaylist();
    render();
  });
  $("btnNuovaPlLing").addEventListener("click", () => {
    /* Il "+" apre le playlist: da li' crei una nuova e trovi anche i tasti
       per nasconderla o riportarla in libreria. */
    _disegnaLinguettePlaylist();
    _playlistAperta = "";
    apriPanelPlaylist();
  });
  $("btnCondividi").addEventListener("click", () => { _chiudiAltro(); _condividiAdesso(); });

  /* ---------- Aggiungere una canzone dal link di YouTube ----------
     Prima si faceva a mano: copiavo il link, aprivo un sito per convertire,
     scaricavo il file e lo importavo. Adesso:
     - copio il link su YouTube e torno qui;
     - tocco questo bottone;
     - se il computer e' acceso scarica lui e la mette in libreria;
     - se e' spento, il link resta in coda e quando si accende fa da solo. */
  function _leggiLinkDagliAppunti() {
    /* su iPhone funziona solo se lo chiedo mentre l'utente tocca il bottone,
       ed e' esattamente quello che facciamo. Se il browser lo rifiuta,
       chiedo il link a mano invece di lasciare l'utente fermo. */
    return new Promise((ok) => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) return ok("");
        const t = navigator.clipboard.readText();
        if (t && typeof t.then === "function") {
          t.then((v) => ok(String(v || "").trim()), () => ok(""));
          return;
        }
        ok(String(t || "").trim());
      } catch (e) { ok(""); }
    });
  }

function _nomePerIlBrano(link, suggerito) {
    const già = String(suggerito || "").trim();
    if (già) return già;
    let scritto = "";
    try {
      /* Propongo l'ultimo nome usato: cosi' nella maggior parte dei casi
         basta confermarlo e non riscrivere tutto da capo. */
      scritto = String(prompt("Come si chiama questo brano? Scrivi \"Artista - Titolo\"",
        String(LS.get("mb.ultimoNome", "") || "")) || "").trim();
    } catch (e) { /* noop */ }
    if (scritto) return scritto;
    return /youtu\.be\/|v=|shorts\//i.test(link) ? "brano da YouTube" : "";
  }

  /* Se arrivo da una canzone gia' cercata, il nome lo so gia': lo uso
     quello e non chiedo niente. */
  async function _aggiungiDaYouTube(suggerito) {
    let link = await _leggiLinkDagliAppunti();
    if (!/youtu\.be\/|youtube\.com\/(watch|shorts)|[?&]v=/i.test(link)) {
      try {
        const scritto = String(prompt("Incolla qui il link di YouTube", link || "") || "").trim();
        link = scritto;
      } catch (e) { /* noop */ }
    }
    if (!/youtu\.be\/|youtube\.com\/(watch|shorts)|[?&]v=/i.test(link)) {
      toast("Serve un link di YouTube: su YouTube tocca Condividi e poi Copia link");
      return;
    }
    const nome = _nomePerIlBrano(link, suggerito);
    if (!nome) { toast("Scrivi il nome del brano, altrimenti non lo metto in libreria"); return; }
    try { LS.set("mb.ultimoNome", nome); } catch (e) { /* noop */ }

    /* Cartella del computer dove mettere il brano scaricato da YouTube.

       Prima era scritta a mano: finiva sempre nella cartella di Ste (o di Ari
       o Emanuele) anche se stavi ascoltando come un altro nome. Infatti se un
       amico scaricava una canzone da YouTube, gli finiva nella libreria di
       Ste. Adesso prendo la cartella del nome aperto, e se questo nome non ha
       una cartella sul computer uso quella di Ste. */
    const cartella = cartellaDi(profile) || "ste";

    /* Se il computer e' acceso: scarica subito, e' piu' veloce. */
    if (await ponteOnline()) {
      toast("Sto scaricando " + nome + "...");
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      try {
        const r = await fetch(base + "/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link, cartella: cartella, titolo: nome })
        });
        if (!r.ok) {
          let perche = "non riesco a scaricare (" + r.status + ")";
          try { const j = await r.json(); if (j && j.errore) perche = j.errore; } catch (e) { /* noop */ }
          toast(perche, 6000);
          segnalaErrore("aggiunta da youtube fallita: " + perche);
          return;
        }
        /* il PC ha gia' messo il brano nella cartella: non serve tenere
           l'mp3 qui, occuperebbe spazio e creerebbe un doppione */
        await r.arrayBuffer();
        toast("Fatto: " + nome + " e' in libreria. Se non la vedi subito, aspetta un minuto e ricarica");
        segnalaErrore("aggiunta da youtube riuscita: " + nome);
        return;
      } catch (e) {
        /* il computer si e' spento proprio adesso: passo dalla coda */
      }
    }

    /* Computer spento: il link resta in coda e viene scaricato all'accensione. */
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) {
      _spiegaPercheNonVa();
      return;
    }
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-chiave": CHIAVE_PUBBLICA,
          "x-link": link,
          "x-nome": nome,
          "x-profilo": cartella
        }
      });
      if (!r.ok) {
        let perche = "non riesco a mettere in coda (" + r.status + ")";
        try { const j = await r.json(); if (j && j.errore) perche = j.errore; } catch (e) { /* noop */ }
        toast(perche, 6000);
        return;
      }
      toast("Messo in coda: " + nome + " entra in libreria quando il computer si accende", 6000);
      segnalaErrore("link in coda: " + nome);
    } catch (e) {
      /* Ste: diceva solo "non riesco a parlare col servizio", che non dice
         niente. Adesso distinguo i casi: senza rete, senza chiave, oppure
         il servizio che risponde male. */
      const perche = e && e.name === "TypeError"
        ? "Sembra che non ci sia rete: controlla il wifi o i dati."
        : "Il servizio non ha risposto (" + String((e && e.message) || e).slice(0, 40) + ")";
      toast("Non riesco a parlare col servizio. " + perche, 8000);
      segnalaErrore("aggiunta da youtube: " + perche);
    }
  }
  /* ---------- La guida (il "?" nel menu Altro) ----------
   Ste: "aggiungi anche nell'app una sezione nei 3 puntini con un'icona del
   '?' dove spieghi bene". Spiega come si mettono le canzoni online con il
   computer acceso e con il computer spento, e cosa fare quando qualcosa
   non funziona. */
function _apriAiuto() {
  const p = $("aiutoPanel");
  if (!p) return;
  _chiudiAltro();
  p.hidden = false;
  syncNoScroll();
  try {
    const corpo = p.querySelector(".aiuto-corpo");
    if (corpo) corpo.scrollTop = 0;
  } catch (e) { /* noop */ }
}
function _chiudiAiuto() {
  const p = $("aiutoPanel");
  if (p) p.hidden = true;
  syncNoScroll();
}
$("btnAiuto").addEventListener("click", _apriAiuto);
$("aiutoClose").addEventListener("click", _chiudiAiuto);
$("aiutoPanel").addEventListener("click", (e) => {
  if (e.target === $("aiutoPanel")) _chiudiAiuto();
});

$("btnDaYouTube").addEventListener("click", () => { _chiudiAltro(); _aggiungiDaYouTube(); });

  /* Quanti link sono in coda, cioè brani che ho mandato e che il computer
     scaricera' quando si accende. Serve a non chiedersi "ma e' arrivato?".
     Se il servizio non e' attivo su questa pagina, semplicemente non
     mostrare niente invece di dare fastidio. */
  let _codaAggiornata = 0;
  async function _aggiornaCoda() {
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) return;
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/coda", {
        headers: { "x-chiave": CHIAVE_PUBBLICA }, cache: "no-store"
      });
      if (!r.ok) return;
      const j = await r.json();
      const n = Array.isArray(j && j.voci) ? j.voci.length : 0;
      _codaAggiornata = n;
      const b = $("btnCondividi");
      const badge = $("condividiBadge");
      if (badge && b && !b.hidden) {
        const altro = _quantiNonCondivisi();
        if (n > 0) { badge.textContent = String(altro + n > 9 ? "9+" : altro + n); }
      }
      if (n > 0) {
        toast(n === 1
          ? "1 brano in coda: entra in libreria quando il computer si accende"
          : n + " brani in coda: entrano in libreria quando il computer si accende", 5000);
      }
    } catch (e) { /* senza rete non aggiorno: pazienza */ }
  }

  /* La casella per mettere la chiave del servizio. Se la chiave c'e' gia'
     non si vede: e' una cosa da fare una volta sola. */
  function _preparaCasellaServizio() {
    const box = $("casellaServizio");
    if (!box) return;
    const gia = !!CHIAVE_PUBBLICA;
    box.hidden = gia;
    const inp = $("inChiave");
    if (inp) inp.value = CHIAVE_PUBBLICA;
  }
  $("btnSalvaChiave").addEventListener("click", async () => {
    const inp = $("inChiave");
    const stato = $("statoServizio");
    const v = String((inp && inp.value) || "").trim();
    if (!v) { if (stato) stato.textContent = "Scrivi prima la chiave."; return; }
    LS.set("mb.chiave", v);
    /* riprovo subito con la chiave nuova: se il servizio non la accetta,
       lo dico subito invece di lasciare l'utente a scoprircelo dopo */
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/aggiungi", {
        method: "POST",
        headers: { "content-type": "audio/mpeg", "x-chiave": v, "x-nome": "prova" },
        body: new Uint8Array(1024)
      });
      if (r.status === 401) {
        if (stato) stato.textContent = "Chiave sbagliata: copiala di nuovo.";
        LS.set("mb.chiave", "");
        return;
      }
      if (inp) inp.value = "";
      _preparaCasellaServizio();
      toast("Servizio attivato: ora le canzoni si pubblicano anche col computer spento", 5000);
    } catch (e) {
      LS.set("mb.chiave", "");
      if (stato) stato.textContent = "Non riesco a parlare col servizio. Riprova fra poco.";
    }
  });
  /* Ste: il tasto in alto delle playlist l'ho tolto, non gli serve piu'.
     Le playlist si aprono dalle linguette sopra la libreria, col "+" per
     crearne una, e dal menu "Altro". Con lui spariva anche quel numero nel
     cerchio rosso in alto a destra, che non sapeva cosa fosse. */
  $("btnNuovaPlaylist").addEventListener("click", () => creaPlaylist());
  $("btnTornaDallePlaylist").addEventListener("click", () => chiudiPanelPlaylist());
  $("playlistPanel").addEventListener("click", (e) => { if (e.target === $("playlistPanel")) chiudiPanelPlaylist(); });
  $("btnAltro").addEventListener("click", () => {
    const m = $("menuAltro");
    if (m && m.hidden) _apriAltro(); else _chiudiAltro();
  });
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
  $("btnSeleziona").addEventListener("click", () => {
  if (_inSelezione) _chiudiSelezione();
  else _apriSelezione();
});
$("selPlaylist").addEventListener("click", () => { _selezionaAggiungiPlaylist(); });
$("selSolo").addEventListener("click", () => { _selezionaSoloInPlaylist(); });
$("selElimina").addEventListener("click", () => { _selezionaElimina(); });
$("selAnnulla").addEventListener("click", () => { _chiudiSelezione(); });

$("btnProfile").addEventListener("click", openProfile);

    /* Interruttore "vedi anche le canzoni degli altri".

       Non toglie niente a nessuno: e' solo uno sguardo. Se lo spegni torni a
       vedere solo la tua libreria, e le canzoni degli altri sono ancora
       dove sono. */
    (function collegaVediTutti() {
      const tasto = $("btnVediTutti");
      const testo = $("vediTuttiTesto");
      if (!tasto) return;
      const disegna = () => {
        const acceso = _vedoTutti();
        tasto.classList.toggle("on", acceso);
        if (testo) testo.textContent = acceso
          ? "Stai vedendo anche le canzoni degli altri"
          : "Vedi anche le canzoni degli altri";
      };
      tasto.addEventListener("click", async () => {
        try { LS.set(LS_VEDI, _vedoTutti() ? "" : "si"); } catch (e) { /* noop */ }
        disegna();
        try { await loadAll(); } catch (e) { /* noop */ }
        render();
        toast(_vedoTutti()
          ? "Ora vedi anche le canzoni degli altri. Non e' successo niente: sono ancora loro."
          : "Torni a vedere solo la tua libreria");
      });
      disegna();
    })();

    /* Secondo interruttore: "fai suonare anche le canzoni degli altri".
       Sta separato dal primo di proposito: vedere una canzone non deve
       voler dire che poi la prossima me la mette in fila. */
    (function collegaSuonaTutti() {
      const tasto = $("btnSuonaTutti");
      const testo = $("suonaTuttiTesto");
      if (!tasto) return;
      const disegna = () => {
        const acceso = _suonaTutti();
        tasto.classList.toggle("on", acceso);
        if (testo) testo.textContent = acceso
          ? "Alla fine proseguo anche con le canzoni degli altri"
          : "Fai suonare anche le canzoni degli altri";
      };
      tasto.addEventListener("click", () => {
        try { LS.set(LS_SUONA, _suonaTutti() ? "" : "si"); } catch (e) { /* noop */ }
        disegna();
        render();
        toast(_suonaTutti()
          ? "Adesso, quando una canzone finisce, posso proseguire anche con le loro"
          : "Torno a proseguire solo con le mie e con quelle delle playlist");
      });
      disegna();
    })();

    /* Creare un profilo nuovo, senza dover aspettare che io cambi il sito.
       Serve per gli amici: ognuno sul suo telefono scrive il suo nome e gli
       resta. I brani che aggiunge vengono messi sotto quel nome. */
    (function collegaCreaProfilo() {
      const campo = $("nuovoProfNome");
      const tasto = $("btnCreaProfilo");
      if (!campo || !tasto) return;
      const crea = () => {
        const nome = String(campo.value || "").trim().slice(0, 24);
        if (!nome) return;
        const eraGia = profileList().some((x) => x.toLowerCase() === nome.toLowerCase());
        const salvato = _aggiungiProfiloLocale(nome);
        campo.value = "";
        renderProfiles();
        if (!eraGia) {
          closeProfile();
          switchProfile(salvato || nome);
          toast('Fatto: ora ascolti come "' + nome + '". I brani che aggiungi sono suoi.');
        } else {
          toast('"' + nome + '" c\'era gia\'');
        }
      };
      tasto.addEventListener("click", crea);
      campo.addEventListener("keydown", (e) => { if (e.key === "Enter") crea(); });
    })();
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
  /* Ste: il worker veniva controllato ogni 3 minuti E ogni 10 (due timer
     insieme, per non so cosa). Con uno solo l'app smette di andare a
     controllare in continuazione se c'e' una versione nuova. */
  setInterval(() => {
    if (swReg) swReg.update().catch(() => {});
  }, 600000);
  /* Ogni 3 secondi guardo che la musica stia davvero camminando: il telefono
     con lo schermo spento dice "e' partito" ma poi e' muto. */
  setInterval(_controllaCheSuoni, 3000);

  /* ---------- Playlist ----------
     Le playlist sono DENTRO l'app, non un file da aprire altrove.
     Ogni playlist e' un nome con dentro i brani che ho scelto io.
     Non toccano la libreria: un brano puo' stare in tre playlist e nella
     libreria insieme, e se elimino una playlist i brani restano dove sono. */

  function _playlistCercata(nome) {
    const pulito = String(nome || "").trim().toLowerCase();
    return playlists.find((p) => String(p.name || "").trim().toLowerCase() === pulito);
  }

  /* Ritorna la playlist con quel nome; se non c'e' la crea. */
  function _playlistConNome(nome, trackId) {
    const pulito = String(nome || "").trim() || "Nuova playlist";
    let pl = _playlistCercata(pulito);
    if (!pl) {
      pl = { id: "pl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), name: pulito, tracks: [] };
      playlists.push(pl);
    }
    if (trackId && !pl.tracks.includes(trackId)) pl.tracks.push(trackId);
    saveCurrentState();
    return pl;
  }

  /* Chiede un nome all'utente. Se chiude senza scrivere, non faccio nulla:
     non creo playlist a caso. */
  function _chiediNome(messaggio) {
    try {
      const r = window.prompt(messaggio, "Nuova playlist");
      return r === null ? "" : String(r).trim();
    } catch (e) {
      return "Nuova playlist";
    }
  }

  function creaPlaylist() {
    const nome = _chiediNome("Come si chiama la playlist?");
    if (!nome) return null;
      const pl = _playlistConNome(nome, "");
      _aggiornaBadgePlaylist();
      _salvaPlaylistCondivise();
      toast('Playlist "' + pl.name + '" creata. Ora puoi aggiungerci i brani.');
      /* Adesso le playlist stanno nella libreria, con le linguette sopra:
         non apro piu' la finestra a parte, mostro la libreria con la nuova
         playlist gia' selezionata. */
      _playlistAttiva = pl.name;
      _disegnaLinguettePlaylist();
      render();
      return pl;
  }

  /* Aggiunge il brano alla playlist scelta. Usata dal menu del brano. */
  function aggiungiAPlaylist(trackId) {
    const t = tracks.find((x) => x.id === trackId);
    if (!t) return;
    const nomi = playlists.map((p) => p.name);
    const testo = 'Aggiungi "' + t.title + '" a una playlist' +
      (nomi.length
        ? "\n\nSe ne hai gia' una, scrivi il suo nome:\n  " + nomi.join("\n  ") +
          "\n\nAltrimenti scrivi un nome nuovo e la creo io."
        : "\n\nNon hai ancora playlist: scrivi il nome e la creo.");
    const nome = _chiediNome(testo);
    if (!nome) return;
    const pl = _playlistConNome(nome, trackId);
      _aggiornaBadgePlaylist();
      _salvaPlaylistCondivise();
      toast('"' + t.title + '" aggiunto a "' + pl.name + '"');
  }

  /* Toglie un brano dalla playlist. I brani NON vengono tolti da nessun
     altrove: solo da quella playlist. */
  function togliDaPlaylist(trackId, nomePlaylist) {
    const pl = _playlistCercata(nomePlaylist);
    if (!pl || !pl.tracks) return;
    const cEra = pl.tracks.includes(trackId);
    pl.tracks = pl.tracks.filter((id) => id !== trackId);
      saveCurrentState();
      _salvaPlaylistCondivise();
      if (cEra) {
      const t = tracks.find((x) => x.id === trackId);
      toast('"' + (t ? t.title : "Brano") + '" tolto da "' + pl.name + '"');
    }
  }

function _aggiornaBadgePlaylist() {
      /* Il tasto in alto delle playlist e il suo numero sono spariti (non
         servivano piu'), quindi qui resta solo l'aggiornamento delle
         linguette sopra la libreria. */
      try { _disegnaLinguettePlaylist(); } catch (e) { /* noop */ }
    }

  /* Quando suono una playlist, il brano dopo e' il suo, non quello dopo
     della libreria. */
  let _playlistSuona = [];
  let _posizionePlaylist = -1;
  function _suonaPlaylist(pl) {
    const brani = (pl.tracks || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    if (!brani.length) { toast("Playlist \"" + pl.name + "\": non c'e' nessun brano"); return; }
    _playlistSuona = brani.map((t) => t.id);
    _posizionePlaylist = 0;
    chiudiPanelPlaylist();
    playById(_playlistSuona[0]);
  }
  /* Va al brano dopo della playlist; se e' finita, torna alla libreria. */
  function _avantiInPlaylist() {
    if (_posizionePlaylist < 0 || !_playlistSuona.length) return "";
    _posizionePlaylist++;
    if (_posizionePlaylist >= _playlistSuona.length) {
      _posizionePlaylist = -1;
      _playlistSuona = [];
      return "";
    }
    return _playlistSuona[_posizionePlaylist];
  }

  function renderPlaylist() {
    const lista = $("playlistLista");
    const titolo = $("playlistTitolo");
    if (!lista) return;
    lista.innerHTML = "";

    /* Se sto guardando dentro una playlist, mostro i suoi brani. */
    if (_playlistAperta) {
      const pl = _playlistCercata(_playlistAperta);
      if (titolo) titolo.textContent = pl ? pl.name : "Playlist";
      if (!pl || !(pl.tracks || []).length) {
        const li = document.createElement("li");
        li.className = "playlist-avviso";
        li.textContent = "Questa playlist e' vuota. Tocca un brano nella libreria e scegli 'Aggiungi alla playlist'.";
        lista.appendChild(li);
      }
      for (const id of (pl ? pl.tracks : [])) {
        const t = tracks.find((x) => x.id === id);
        if (!t) continue;
        const li = document.createElement("li");
        li.className = "playlist-voce";
        const nome = document.createElement("button");
        nome.type = "button";
        nome.className = "playlist-nome";
        nome.textContent = t.title;
        nome.addEventListener("click", () => { chiudiPanelPlaylist(); playById(t.id); });
        const togli = document.createElement("button");
        togli.type = "button";
        togli.className = "playlist-togli";
        togli.textContent = "Togli";
        togli.addEventListener("click", () => { togliDaPlaylist(t.id, pl.name); renderPlaylist(); });
        li.appendChild(nome);
        li.appendChild(togli);
        lista.appendChild(li);
      }
      const indietro = document.createElement("button");
      indietro.type = "button";
      indietro.className = "confirm-no";
      indietro.textContent = "Tutte le playlist";
      indietro.addEventListener("click", () => { _playlistAperta = ""; renderPlaylist(); });
      lista.appendChild(indietro);

      /* Creare una playlist anche da qui, cosi' il "+" delle linguette e
         il menu Altro fanno la stessa cosa. */
      const nuova = document.createElement("button");
      nuova.type = "button";
      nuova.className = "confirm-no torna";
      nuova.textContent = "Crea una playlist";
      nuova.addEventListener("click", () => creaPlaylist());
      lista.appendChild(nuova);

      /* Qui decido IO quale playlist nascondere: il tasto sta dentro la
         playlist che sto guardando, quindi si vede solo quella e non
         rischio di nascondere quella sbagliata. */
      const quanti = (pl.tracks || []).length;
      if (quanti) {
        const gia = (pl.tracks || []).filter((id) => _soloInPlaylist.has(id)).length;
        if (gia < quanti) {
          const via = document.createElement("button");
          via.type = "button";
            via.className = "confirm-no pericolo";
          via.textContent = "Nascondi i brani di questa playlist dalla libreria (" + (quanti - gia) + ")";
          via.title = "Restano suonabili qui dentro, ma non li vedi piu' nella libreria. " +
            "Puoi sempre riportarli indietro da questo stesso posto.";
          via.addEventListener("click", async () => {
            const si = await askConfirm(
              "Nascondere dalla libreria?",
              "I " + (quanti - gia) + " brani di \"" + pl.name + "\" spariscono dalla libreria.\n\n" +
              "Restano suonabili qui dentro, e sul sito per gli altri. " +
              "Per riportarli: apri questa playlist e premi il tasto qui sotto.",
              "Nascondi"
            );
              if (!si) return;
              for (const id of (pl.tracks || [])) _mettiSoloInPlaylist(id);
              /* Salvo anche sulla playlist: cosi' la scelta vale anche nel
                 browser e sull'altro telefono, e non solo su questo. */
              pl.nascosta = true;
              /* Mi ricordo chi l'ha nascosta: cosi' la vedo solo io e gli altri
                 non se la ritrovano in faccia nelle loro linguette. */
              pl.nascostaDa = profile;
              _salvaPlaylistCondivise();
              _disegnaLinguettePlaylist();
              renderPlaylist();
              render();
              toast('I brani di "' + pl.name + '" si vedono solo dentro la playlist, su tutti i dispositivi');
          });
          lista.appendChild(via);
        }
        if (gia) {
          const torna = document.createElement("button");
          torna.type = "button";
          torna.className = "confirm-no torna";
          torna.textContent = "Riporta in libreria (" + gia + ")";
          torna.title = "Questi brani tornano a comparire nella libreria normale";
          torna.addEventListener("click", async () => {
            const si = await askConfirm(
              "Riportare in libreria?",
              gia + (gia === 1 ? " brano torna" : " brani tornano") + " nella libreria normale di \"" + pl.name + "\".",
              "Riporta"
            );
              if (!si) return;
              for (const id of (pl.tracks || [])) _togliSoloInPlaylist(id);
              pl.nascosta = false;
              pl.nascostaDa = "";
              _salvaPlaylistCondivise();
              _disegnaLinguettePlaylist();
              renderPlaylist();
              render();
            toast(gia + (gia === 1 ? " brano e' di nuovo" : " brani sono di nuovo") + " in libreria");
          });
          lista.appendChild(torna);
        }
      }
      return;
    }

    if (titolo) titolo.textContent = "Le tue playlist";
    if (!playlists.length) {
      const li = document.createElement("li");
      li.className = "playlist-avviso";
      li.textContent = "Non hai ancora playlist. Tocca 'Nuova playlist' qui sopra per creare la prima.";
      lista.appendChild(li);
    }
    for (const pl of playlists) {
      /* Come per le linguette: una playlist nascosta non compare agli altri. */
      if (pl.nascosta === true && pl.nascostaDa && pl.nascostaDa !== profile) continue;
      const brani = (pl.tracks || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
      const li = document.createElement("li");
      li.className = "playlist-voce";

      const nome = document.createElement("button");
      nome.type = "button";
      nome.className = "playlist-nome";
      nome.textContent = pl.name || "senza nome";
      nome.addEventListener("click", () => { _playlistAperta = pl.name; renderPlaylist(); });

      const conta = document.createElement("span");
      conta.className = "playlist-conta";
      conta.textContent = brani.length ? brani.length + (brani.length === 1 ? " brano" : " brani") : "vuota";

      const suona = document.createElement("button");
      suona.type = "button";
      suona.className = "playlist-suona";
      suona.textContent = "Ascolta";
      suona.disabled = !brani.length;
      suona.addEventListener("click", () => _suonaPlaylist(pl));

      const elimina = document.createElement("button");
      elimina.type = "button";
      elimina.className = "playlist-togli";
      elimina.textContent = "Elimina";
      elimina.addEventListener("click", async () => {
        const va = await askConfirm("Eliminare la playlist?",
          'Playlist "' + pl.name + '". I brani NON vengono tolti dalla libreria.', "Elimina");
        if (!va) return;
        playlists = playlists.filter((p) => p.id !== pl.id);
        saveCurrentState();
        _salvaPlaylistCondivise();
    /* Se sto guardando proprio questa playlist e l'ho eliminata, torno
       alla libreria intera: altrimenti la lista resterebbe vuota senza
       capire perche'. */
    if (_playlistAttiva === pl.name) _playlistAttiva = "";
    _disegnaLinguettePlaylist();
    render();
    toast('Playlist "' + pl.name + '" eliminata');
      });

      li.appendChild(nome);
      li.appendChild(conta);
      li.appendChild(suona);
      li.appendChild(elimina);
      lista.appendChild(li);
    }
    _aggiornaBadgePlaylist();
  }

  let _playlistAperta = "";

  function apriPanelPlaylist() {
    const m = $("playlistPanel");
    if (!m) return;
    m.hidden = false;
    renderPlaylist();
  }
  function chiudiPanelPlaylist() {
    const m = $("playlistPanel");
    if (m) m.hidden = true;
  }

  /* ---------- I brani che sono ancora solo su questo telefono ----------
     Un brano aggiunto a mano resta nel telefono finche' non arriva al
     computer, e da lì nella libreria che vede anche gli altri. Prima non
     lo si ritentava: il brano semplicemente non saliva e non se ne
     accorgeva nessuno. Adesso si riprova ogni 2 minuti e c'e' anche un
     bottone per farlo subito. */

  /* Conta i brani che ho qui e che il computer non ha ancora. */
  function _quantiNonCondivisi() {
    try {
      return _nonCondivisiCache;
    } catch (e) {
      return 0;
    }
  }
  let _nonCondivisiCache = 0;
  let _tempoRiprova = null;

  /* Aggiorna il contatore e il bottone. */
  async function _aggiornaNonCondivisi() {
    try {
      if (!db) return;
      const tutti = await dbAll();
      const daMandare = (tutti || []).filter((r) => r && r.blob && !r.condiviso &&
        !eGiaCondiviso({ title: r.title, artist: r.artist }));
      _nonCondivisiCache = daMandare.length;
      const b = $("btnCondividi");
      if (b) {
        b.hidden = !daMandare.length;
        const t = $("condividiBadge");
        if (t) t.textContent = daMandare.length > 9 ? "9+" : String(daMandare.length);
      }
    } catch (e) { /* pazienza */ }
  }

  /* Riprovo da sola ogni 2 minuti: se il computer e' acceso e siamo
     sulla pagina locale, i brani salgono senza che io debba fare niente.
     Non controllo prima se il computer risponde: condividiBraniLocali() lo
     fa gia' e, se non risponde, esce in silenzio senza rompere niente. */
  function _riprovaCondivisione() {
    if (_tempoRiprova) clearInterval(_tempoRiprova);
    _tempoRiprova = setInterval(() => {
      if (document.hidden) return;
      if (!_quantiNonCondivisi()) return;
      condividiBraniLocali();
    }, 120000);
  }

  /* Spiega come si fa quando il computer non risponde. Sulla pagina online
     (https) il browser non permette di chiamare il computer (http): li' il
     pulsante non riprova all'infinito, dice cosa fare davvero. */
  function _spiegaPercheNonVa() {
    const sicura = !!window.isSecureContext;
if (sicura) {
    /* Ste: questo messaggio era illeggibile (tagliato con i puntini).
       Ora va a capo e resta leggibile, ma con le stesse informazioni
       di prima: da dove aprire l'app. */
    toast("Qui non posso parlare col computer.\nApri l'app dal computer: http://192.168.1.40:8168", 7000);
  } else {
    toast("Il computer non risponde.\nSei sulla rete di casa?\nPuoi salvare a mano in: musica mp3 ste", 7000);
  }
    segnalaErrore("condivisione non riuscita: pagina " +
      (sicura ? "sicura (https: non si puo' chiamare il PC)" : "normale") +
      ", programma sul PC non raggiungibile");
  }

  /* Il bottone: manda subito tutti i brani solo di questo telefono. */
/* Il posto dove il telefono manda le canzoni quando il computer e' spento.
     Se non e' impostato (perche' la pagina e' aperta su un computer diverso,
     o il servizio non esiste ancora) la condivisione semplice funziona lo
     stesso e non succede niente di rotto. */
  const SERVIZIO_PUBBLICA = LS.get("mb.servizio", "https://musicbox-dal-telefono.stefanovillaggio8.workers.dev");
  /* Ste: "ogni volta che riavvio devo rimettere la chiave".
     Sul telefono i dati si perdono a ogni riavvio, quindi anche la chiave
     sparisce e gliela devo chiedere di nuovo. Non posso metterla dentro
     l'app perche' l'app e' pubblica e chiunque potrebbe usarla.

     Invece la chiedo al computer di casa, che la conserva lui e la consegna
     solo a chi e' sulla rete di casa. Cosi' quando sei a casa non devi
     digitare niente: la app se la prende da sola. */
  async function _prendiChiaveDalComputer() {
    try {
      if (LS.get("mb.chiave", "")) return true;
      const base = await cercaPonte();
      if (!base) return false;
      const ctl = new AbortController();
      const scad = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch(base + "/chiave", { cache: "no-store", signal: ctl.signal });
      clearTimeout(scad);
      if (!r.ok) return false;
      const j = await r.json();
      const k = String((j && j.chiave) || "").trim();
      if (!k) return false;
      LS.set("mb.chiave", k);
      segnalaErrore("chiave presa dal computer di casa");
      return true;
    } catch (e) { return false; }
  }
  const CHIAVE_PUBBLICA = LS.get("mb.chiave", "");

  /* Il brano arriva sul sito da solo, senza che il computer sia acceso.
     Restituisce l'indirizzo del brano cosi' l'app lo suona subito. */
  async function _pubblicaSulSito(r) {
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) {
      throw new Error("il servizio non e' attivo su questa pagina");
    }
    const nome = [(r.artist || ""), (r.title || "")].join(" - ")
      .replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim() || "brano";
    /* I dati vanno nelle intestazioni, non nell'indirizzo: con i parametri
       nell'indirizzo il caricamento si bloccava (provarlo e' costato una
       mezz'ora, me lo ricordo). */
    const risp = await fetch(SERVIZIO_PUBBLICA + "/aggiungi", {
      method: "POST",
      headers: {
        "content-type": "audio/mpeg",
        "x-chiave": CHIAVE_PUBBLICA,
        "x-nome": nome,
        "x-profilo": CARTELLA_PREDEFINITA === "ari" ? "Ari"
          : (CARTELLA_PREDEFINITA === "emanuela" ? "Emanuele" : "Ste")
      },
      body: r.blob
    });
    if (!risp.ok) {
      let perche = "il programma ha risposto " + risp.status;
      try { const j = await risp.json(); if (j && j.errore) perche = j.errore; } catch (e) { /* noop */ }
      throw new Error(perche);
    }
    return await risp.json();
  }

  async function _condividiAdesso() {
    const b = $("btnCondividi");
    if (b) { b.disabled = true; }
    try {
      const daMandare = await _braniDaMandare();
      if (!daMandare.length) { toast("Non ci sono brani da mandare"); return; }
      toast("Sto pubblicando " + daMandare.length + " brani...");
      /* Prima provo col computer acceso: e' piu' veloce e mantiene anche la
         copia nella cartella. Se il computer non c'e', vado sul servizio. */
      const online = await ponteOnline();
      if (online) {
        await condividiBraniLocali(true);
        setTimeout(_aggiornaNonCondivisi, 4000);
        return;
      }
      let fatti = 0;
      const problemi = [];
      for (const r of daMandare) {
        try {
          await _pubblicaSulSito(r);
          r.condiviso = true;
          try { await dbPut(r); } catch (e2) { /* va bene anche senza */ }
          fatti++;
        } catch (e) {
          problemi.push(String((e && e.message) || e).slice(0, 60));
        }
      }
      toast(fatti
        ? "Pubblicati " + fatti + (fatti === 1 ? " brano" : " brani") + ": sono sul sito e si sentono subito"
        : "Pubblicazione fallita: " + (problemi[0] || "errore sconosciuto"), problemi.length ? 7000 : 0);
      await _aggiornaNonCondivisi();
    } finally {
      if (b) { b.disabled = false; }
    }
  }

  /* I brani che ho qui e che il computer (o il sito) non hanno ancora. */
  async function _braniDaMandare() {
    if (!db) return [];
    try {
      const tutti = await dbAll();
      return (tutti || []).filter((r) => r && r.blob && r.blob.size && !r.condiviso &&
        !eGiaCondiviso({ title: r.title, artist: r.artist }));
    } catch (e) { return []; }
  }

  /* ---------- Tieni lo schermo acceso e timer di sonno ----------
   Tieni lo schermo acceso: il telefono non si blocca mentre ascolti. Non
   costa soldi (niente e' a pagamento), ma la batteria dura un po' meno.
   Timer: si ferma da solo dopo un po', cosi' di notte non continua a
   suonare. Quando finisce, spegne anche lo schermo acceso: e' quello che
   hai chiesto, non lasciare il telefono acceso tutta la notte. */

let _bloccoSchermo = null;
let _schermoVoluto = false;
let _timerFine = 0;
let _timerGiro = null;

const TIMER_SCELTE = [15, 30, 60, 0];
/* Quale dei tempi e' scelto adesso. Parte dal primo (15 minuti) e ogni tocco
   sul tasto passa al successivo, arrivando a 0 = spento. */
let _minutiTimer = TIMER_SCELTE[0];

async function _accendiSchermo() {
  try {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return false;
    if (_bloccoSchermo) return true;
    _bloccoSchermo = await navigator.wakeLock.request("screen");
    return true;
  } catch (e) { return false; }
}

async function _spegneSchermo() {
  try {
    if (_bloccoSchermo) { await _bloccoSchermo.release(); }
  } catch (e) { /* gia' spento */ }
  _bloccoSchermo = null;
}

function _disegnaTimer() {
  const b = $("btnTimer");
  const badge = $("timerBadge");
  if (!b || !badge) return;
  const resta = Math.max(0, Math.ceil((_timerFine - Date.now()) / 60000));
  const acceso = _schermoVoluto;
  if (b.classList) b.classList.toggle("on", acceso);
  if (resta > 0) {
    badge.hidden = false;
    badge.textContent = resta + "'";
    b.title = "Si ferma fra " + resta + " minuti (tocca per cambiare)";
  } else {
    badge.hidden = true;
    b.title = "Timer: si ferma dopo un po'";
  }
}

/* Quando si torna sull'app, il blocco dello schermo va richiesto di nuovo:
   il telefono lo perde da solo ogni volta che lo blocchi. */
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      /* Torno in primo piano: se volevo lo schermo acceso lo riprendo, e
         riaccendo anche il controllo che porta avanti la musica. */
      if (_schermoVoluto) { _accendiSchermo(); _accendiSonda(); }
      _disegnaTimer();
  } else if (_bloccoSchermo) {
    /* non lo tengo: il telefono e' gia' spento, e tenerlo occuperebbe
       batteria senza servire a niente */
    _bloccoSchermo = null;
  }
});

$("btnSchermo").addEventListener("click", async () => {
      if (_schermoVoluto) {
        _schermoVoluto = false;
        await _spegneSchermo();
        _spezniSonda();
        toast("Schermo normale: si blocca come sempre");
        _disegnaTimer();
        return;
      }
      const va = await _accendiSchermo();
      if (!va) {
        toast("Questo telefono non me lo lascia fare. Continua a funzionare tutto, ma lo schermo si blocca");
        return;
      }
      _schermoVoluto = true;
      _accendiSonda();
      toast("Schermo acceso mentre ascolti: puoi cambiare app, la musica va avanti. Per spegnerlo: tocca di nuovo, o usa il timer", 6000);
      _disegnaTimer();
    });

$("btnTimer").addEventListener("click", () => {
  /* Ste: i minuti devono potersi scegliere davvero. Prima il tasto partiva
     sempre da 15 e gli altri valori erano solo scritti e mai usati, quindi
     30 e 60 non esistevano. Ora ogni tocco passa al tempo successivo
     (15 -> 30 -> 60 -> spento) e parte subito col nuovo. */
  if (_timerFine) {
    /* il timer sta girando: riparto dal primo valore e azzero il conto */
    clearInterval(_timerGiro); _timerGiro = null;
    _timerFine = 0;
  }
  _minutiTimer = TIMER_SCELTE[(TIMER_SCELTE.indexOf(_minutiTimer) + 1) % TIMER_SCELTE.length];
  const minuti = _minutiTimer;
  if (minuti <= 0) {
    _timerFine = 0;
    _disegnaTimer();
    toast("Timer spento");
    return;
  }
  _timerFine = Date.now() + minuti * 60000;
  _timerGiro = setInterval(() => {
    const resta = _timerFine - Date.now();
    if (resta <= 0) {
      clearInterval(_timerGiro); _timerGiro = null;
      _timerFine = 0;
      /* fermo la musica e spengo anche lo schermo acceso. Uso le funzioni
         vere (non simulo un tocco sul bottone): cosi' l'icona resta
         coerente e il brano viene segnato come fermato davvero. */
      try {
        _vuoleSuonare = false;
        if (audio && !audio.paused) audio.pause();
        syncPlayUI();
      } catch (e) { /* la musica si ferma comunque */ }
      _schermoVoluto = false;
      _spegneSchermo();
      _spezniSonda();
      _disegnaTimer();
      toast("Timer finito: buonanotte");
    } else {
      _disegnaTimer();
    }
  }, 20000);
  _disegnaTimer();
  toast("Si ferma fra " + minuti + " minuti (tocca di nuovo per cambiare)");
});

  /* ---------- Le playlist seguono il brano su ogni dispositivo ----------
     Prima stavano solo dentro il telefono: creavi una playlist sul telefono
     e non la vedevi da nessun'altra parte. Adesso stanno in un file del sito
     (playlist.json): sono le stesse ovunque, e cambiando telefono ci sono
     ancora. Se il servizio non e' attivo su questa pagina, funziona tutto
     come prima, solo in locale. */

  /* ---------- Nascosti e preferiti: gli stessi su ogni dispositivo ----------

     Prima questi due elenchi stavano solo nella memoria di quel telefono.
     L'app aperta dall'icona e la scorciatoia che avvia Safari hanno due
     memorie diverse: quindi una canzone che nascondevi da una parte compariva
     dall'altra, e i cuoricini valevano meta'.

     Adesso stanno anche in stato.json, sul sito, che si legge anche senza
     chiave (e' pubblico, come playlist.json).

     Quando pero' tolgo un brano NON lo cancello dal sito: lo aggiunto a una
     lista di "tornano indietro", altrimenti basterebbe un tocco sbagliato per
     farlo sparire per sempre da tutti i dispositivi. */

  let _timerStatoCondiviso = null;
  let _statoCondivisoOk = false;

  let _statoDaSalvare = false;
  let _timerRiprovaStato = null;
  let _quanteRiprove = 0;
  /* Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
     Prima il nome finiva solo nella memoria del telefono e basta: se il
     computer era spento, o la rete non rispondeva, il salvataggio si perdeva
     in silenzio e il brano tornava col nome vero al riavvio.

     Adesso, se non riesco a salvare, riprovo piu' tardi da solo (fino a un
     po' di volte): appena il computer torna raggiungibile, il nome parte
     senza che tu debba fare niente. */
  function _programmaDiRiprovare() {
    if (!_statoDaSalvare) return;
    /* Riprovo a lungo: il nome deve aspettare il momento giusto (tornare sul
       Wi-Fi di casa), non dimenticarsi dopo trenta secondi. */
    if (_quanteRiprove >= 120) return;
    clearTimeout(_timerRiprovaStato);
    _timerRiprovaStato = setTimeout(() => {
      _quanteRiprove++;
      _salvaStatoCondiviso();
    }, 15000);
  }
  /* Appena la rete torna, riprovo subito invece di aspettare il giro dopo. */
  try {
    window.addEventListener("online", () => {
      if (_statoDaSalvare) { _quanteRiprove = 0; _salvaStatoCondiviso(); }
    });
  } catch (e) { /* noop */ }

  function _salvaStatoCondiviso() {
    _statoDaSalvare = true;
    _quanteRiprove = 0;
    try {
      clearTimeout(_timerStatoCondiviso);
    } catch (e) { /* noop */ }
    /*Aspetto un po': se Ste preme tre cuoricini in tre secondi, non voglio
       tre richieste al computer. */
    _timerStatoCondiviso = setTimeout(async () => {
      const corpo = JSON.stringify({
        nascosti: [...hiddenTracks],
        preferiti: [...favorites],
        /* i brani che ho copiato nella mia libreria, per ogni nome. Serve
           cosi' ritrovo la copia anche sull'altro dispositivo. */
        miei: (function () {
          try { return JSON.parse(LS.get(LS_MIEI, "{}")) || {}; } catch (e) { return {}; }
        })(),
        /* Ste: "quando modifico il nome e l'artista funziona ma quando
           riavvio l'app ritorna come prima". Il nome stava solo sul telefono
           (localStorage) e il telefono ogni tanto lo perde. Adesso lo metto
           anche qui, che e' sul sito: cosi' al riavvio torna indietro, e
          e segue anche sull'altro dispositivo. */
        rinomini: (function () {
          try {
            const m = nomiRinomati();
            const copia = {};
            for (const k of Object.keys(m)) {
              if (m[k] && (m[k].title || m[k].artist)) copia[k] = { title: m[k].title || "", artist: m[k].artist || "" };
            }
            return copia;
          } catch (e) { return {}; }
        })()
      });
      /* Prima il computer, che e' di solito acceso e risponde subito. Poi, se
         non c'e', il Worker (funziona anche col computer spento).

         Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
         Qui c'era scritto "SERVIZIO + /stato", ma SERVIZIO non e' mai stato
         definito da nessuna parte: la riga andava in errore, l'errore veniva
         buttato via e il salvataggio finiva lì. Il nome del brano restava
         solo nella memoria del telefono, che a un certo punto la perde, e al
         riavvio il brano tornava col nome vero.

         Adesso uso "trovaPonte()", che e' il metodo che il resto dell'app usa
         gia' per trovare il computer: prova gli indirizzi uno alla volta e
         restituisce quello che risponde. */
      try {
        const base = await trovaPonte();
        if (base) {
          const r = await fetch(base + "/stato", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: corpo
          });
          if (r.ok) { _statoCondivisoOk = true; _statoDaSalvare = false; return; }
        }
      } catch (e) { /* il computer non c'e': provo dall'altra parte */ }
      try {
        /* Per /stato non serve la chiave: i nomi devono potersi salvare anche
           dal sito, perche' li' il browser per regola non puo' parlare col
           computer di casa e la chiave sul telefono sparisce al riavvio. */
        const intestazioni = { "content-type": "application/json" };
        if (CHIAVE_PUBBLICA) intestazioni["x-chiave"] = CHIAVE_PUBBLICA;
        const r = await fetch(SERVIZIO_PUBBLICA + "/stato", {
          method: "POST",
          headers: intestazioni,
          body: corpo
        });
        if (r.ok) { _statoCondivisoOk = true; _statoDaSalvare = false; }
      } catch (e) { /* senza rete resta sul telefono, e va bene */ }
      _programmaDiRiprovare();
    }, 2500);
  }

  async function _caricaStatoCondiviso() {
    /* Ste: "da PC funziona ma da telefono no".
     Il nome da telefono arrivava gia' sul sito, ma al riavvio l'app rileggeva
     una copia VECCHIA di stato.json: il sito lo tiene in cache fino a dieci
     minuti, e il nome appena salvato non c'era ancora in quella copia.
     Per questo ora lo chiedo sempre fresco ("no-store"), e per sicurezza lo
     rileggo un paio di volte dopo l'avvio: cosi' se nel frattempo e' arrivato
     qualcosa dal PC o dall'altro dispositivo, l'app lo vede. */
    try {
      const r = await fetch("./stato.json", { cache: "no-store" });
      if (!r.ok) return;
const j = await r.json();
        const nasco = Array.isArray(j && j.nascosti) ? j.nascosti : [];
        const prefs = Array.isArray(j && j.preferiti) ? j.preferiti : [];
        let cambiati = 0;
        /* Unisco, non sostituisco: cosi' quello che ho scelto qui non sparisce
           e diventa solo piu' grande. */
        for (const id of nasco) if (id && !hiddenTracks.has(id)) { hiddenTracks.add(id); cambiati++; }
        for (const id of prefs) if (id && !favorites.has(id)) { favorites.add(id); cambiati++; }
        /* I brani copiati nella mia libreria: devono valere anche sull'altro
           dispositivo, quindi li metto in elenco insieme a tutto il resto. */
        if (j && j.miei && typeof j.miei === "object") {
          try {
            const miei = JSON.parse(LS.get(LS_MIEI, "{}")) || {};
            for (const nome of Object.keys(j.miei)) {
              const lista = Array.isArray(j.miei[nome]) ? j.miei[nome] : [];
              const mia = new Set(Array.isArray(miei[nome]) ? miei[nome] : []);
              for (const id of lista) {
                const s = String(id || "");
                if (s && !mia.has(s)) { mia.add(s); cambiati++; }
              }
              miei[nome] = [...mia].sort();
            }
            LS.set(LS_MIEI, JSON.stringify(miei));
          } catch (e) { /* noop */ }
        }
        /* I brani copiati nella mia libreria: devono valere anche sull'altro
dispositivo, quindi li metto in elenco insieme a tutto il resto. */
    if (j && j.rinomini && typeof j.rinomini === "object") {
      /* Ste: il nome che avevi cambiato tornava com'era al riavvio, perche'
         stava solo sul telefono. Se lo ritrovo qui, lo rimetto. */
      try {
        const mappa = nomiRinomati();
        let rimessi = 0;
        for (const k of Object.keys(j.rinomini)) {
          const r = j.rinomini[k];
          if (!r || (!r.title && !r.artist)) continue;
          const mia = mappa[k];
          if (!mia || mia.title !== (r.title || "") || mia.artist !== (r.artist || "")) {
            mappa[k] = { title: String(r.title || ""), artist: String(r.artist || "") };
            rimessi++;
          }
        }
        if (rimessi) { LS.set("mb.rinomini", mappa); cambiati++; }
      } catch (e) { /* noop */ }
    }
    if (cambiati) {
          saveCurrentState();
          /* Ricarico davvero la libreria, non la ridisegno: le canzoni appena
             copiate devono comparire SUBITO, senza dover riaprire l'app. */
          try { await loadAll(); } catch (e) { /* noop */ }
          render();
        }
      } catch (e) { /* nessuna rete: vedo quello che ho gia' */ }
    }

  /* Unisco le playlist arrivate da fuori a quelle che ho gia' qui. */
function _unisciPlaylistCondivise(arrivate) {
  /* Quelle che ho qui sono le piu' fresche: se la stessa playlist e' anche nel
     sito, tengo la mia per i brani, ma la scelta "nascondila dalla libreria"
     la rispetto sempre, altrimenti su un dispositivo nuovo i brani nascosti
     ricompaiono in libreria. */
  let nuove = 0;
  for (const p of arrivate) {
    if (!p || !p.name) continue;
    if (_playlistCercata(p.name)) {
      const gia = _playlistCercata(p.name);
      if (gia && p.nascosta === true) {
          gia.nascosta = true;
          gia.nascostaDa = String(p.nascostaDa || "");
        }
      /* Una playlist che qui e' VUOTA e' una voce rimasta a meta', non una
         scelta di Ste: senza questo la lista non si riempiva mai e gym
         restava invisibile per sempre. Se invece ha gia' dei brani la lascio
         stare, cosi' una cancellazione fatta qui non viene ricreata. */
      const suoi = Array.isArray(gia && gia.tracks) ? gia.tracks : [];
      const arrivati = (Array.isArray(p.tracks) ? p.tracks : [])
        .filter((t) => /^b-track-\d+$/.test(String(t)));
      if (!suoi.length && arrivati.length) {
        gia.tracks = arrivati;
        if (!gia.id) gia.id = String(p.id || ("pl-" + String(p.name).toLowerCase().replace(/\s+/g, "-")));
        nuove++;
      }
      continue;
    }
    playlists.push({
      id: String(p.id || ("pl-" + String(p.name).toLowerCase().replace(/\s+/g, "-"))),
      name: String(p.name).slice(0, 60),
      nascosta: p.nascosta === true,
      /* Ste: qui prima mancava, e infatti Diego vedeva la playlist "gym"
         che Ste aveva nascosto. Senza sapere DI CHI e' la playlist, la
         regola "nascondila agli altri" non poteva scattare e la vedeva
         chiunque. */
      nascostaDa: String(p.nascostaDa || ""),
      tracks: (Array.isArray(p.tracks) ? p.tracks : []).filter((t) => /^b-track-\d+$/.test(String(t)))
    });
    nuove++;
  }
  /* La lista dei nascosti dipende anche dalle playlist: la ricalcolo e, se
     qualcosa e' cambiato, aggiorno quello che si vede. */
  const prima = [..._soloInPlaylist].join(",");
  _soloInPlaylist = _ricalcolaSoloInPlaylist();
  const dopo = [..._soloInPlaylist].join(",");
  if (prima !== dopo) {
    saveCurrentState();
    _disegnaLinguettePlaylist();
    render();
  }
  if (nuove) {
    saveCurrentState();
    _aggiornaBadgePlaylist();
  }
  return nuove;
}

async function _caricaPlaylistCondivise() {
  /* Prima provo dal Worker, che e' chi le scrive e quindi ha le piu' fresche. */
  if (SERVIZIO_PUBBLICA && CHIAVE_PUBBLICA) {
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/playlist", {
        headers: { "x-chiave": CHIAVE_PUBBLICA }, cache: "no-store"
      });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j && j.playlist)) _unisciPlaylistCondivise(j.playlist);
      }
    } catch (e) { /* senza rete uso il file sul sito */ }
  }

  /* Poi leggo playlist.json direttamente dal sito.

     Serve perche' il Worker chiede la chiave, e la chiave ce l'hanno solo i
     dispositivi dove e' stata inserita. Aperto dalla scorciatoia che avvia
     Safari la memoria del telefono e' un'altra, e la playlist gym non
     compariva. Questo file e' pubblico e sta gia' sul sito: e' il posto dove
     le playlist vivono davvero, quindi lo leggo sempre. */
  try {
    const r = await fetch("./playlist.json", { cache: "no-cache" });
    if (r.ok) {
      const j = await r.json();
      const elenco = Array.isArray(j) ? j : (Array.isArray(j && j.playlist) ? j.playlist : []);
      const arrivate = _unisciPlaylistCondivise(elenco);
      if (arrivate) segnalaErrore("playlist: " + playlists.length + " in tutto, " + arrivate + " lette dal sito");
      return;
    }
  } catch (e) { /* nessuna rete: restano quelle che ho gia' */ }

  /* Se non e' andata e non ho nessuna playlist, riprovo una volta sola dopo
     qualche secondo: la prima richiesta capita mentre il telefono sta ancora
     agganciando la rete, e senza riprovare la playlist non compariva e
     non c'era modo di ripararlo senza riaprire l'app. */
  if (!playlists.length) {
    setTimeout(() => { _caricaPlaylistCondivise(); }, 5000);
  }
}

async function _salvaPlaylistCondivise() {
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) return;
    try {
      await fetch(SERVIZIO_PUBBLICA + "/playlist", {
        method: "POST",
        headers: { "content-type": "application/json", "x-chiave": CHIAVE_PUBBLICA },
        body: JSON.stringify({ playlist: playlists })
      });
    } catch (e) { /* senza rete le playlist restano pero' nel telefono */ }
  }

  /* ---------- Cosa togliere, quando il brano e' anche in una playlist ----------
     Prima: un si'/no e basta. Se nascondevi un brano che era in "gym", il
     brano restava in playlist ma spariva dalla libreria, e sotto compariva
     "rimettili in lista" senza che si capisse il nesso.
     Adesso, se il brano e' in almeno una playlist, si sceglie cosa fare. */
  function _playlistCheContengono(trackId) {
    return playlists.filter((p) => (p.tracks || []).includes(trackId)).map((p) => p.name);
  }

  let _scopeResolve = null;

  /* Restituisce "libreria", "playlist", "entrambe" oppure null se annullato. */
  function _scegliCosaTogliere(trackId, titolo, perDavvero) {
    const nomi = _playlistCheContengono(trackId);
    /* Ste: "eliminare non mi chiede piu la conferma". Prima, se il brano non
       era in nessuna playlist, la domanda veniva saltata e il brano spariva
       subito. Adesso chiedo SEMPRE, e offro solo le scelte che hanno senso. */
    $("scopeTitle").textContent = perDavvero ? "Eliminare per davvero?" : "Togliere questo brano?";
    const dove = !nomi.length
      ? "non e' dentro nessuna playlist."
      : nomi.length === 1
        ? "e' nella playlist \"" + nomi[0] + "\"."
        : "e' nelle playlist " + nomi.map((n) => "\"" + n + "\"").join(", ") + ".";
    $("scopeMsg").textContent = "'" + titolo + "' " + dove + ". Dimmi dove vuoi toglierlo.";

    const scelte = $("scopeScelte");
    scelte.innerHTML = "";
    const voci = [
      {
        id: "libreria",
        testo: "Solo dalla libreria",
        dove: perDavvero
          ? "viene eliminato dal sito: tutti gli altri lo perdono davvero"
          : "scompare dalla tua libreria, resta online e resta nelle playlist",
        pericolo: perDavvero
      },
      {
        id: "playlist",
        testo: "Solo dalle playlist",
        dove: "resta nella libreria, esce solo da " + (nomi.length === 1 ? "playlist" : "playlist"),
        pericolo: false
      },
      {
        id: "entrambe",
        testo: "Da entrambi",
        dove: perDavvero
          ? "esce dalla libreria e dalle playlist, e viene eliminato dal sito"
          : "scompare dalla libreria e da tutte le playlist",
pericolo: perDavvero
    }
    ];
    /* Se il brano non e' dentro nessuna playlist, le due scelte che
       riguardano le playlist non hanno senso: le tolgo, cosi' resta solo
       "togli dalla libreria" (piu' l'annulla che aggiungo sotto). */
    if (!nomi.length) voci.splice(1, 2);
    voci.push({
      id: "",
      testo: "Lascia tutto com'e'",
      dove: "non faccio niente",
      pericolo: false
    });
    for (const v of voci) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "scope-scelta" + (v.pericolo ? " pericolo" : "");
      b.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/></svg>' +
        "<span><b>" + v.testo + "</b><span class=\"scope-dove\">" + v.dove + "</span></span>";
      b.addEventListener("click", () => _chiudiScope(v.id || null));
      scelte.appendChild(b);
    }
    const dove2 = document.createElement("p");
    dove2.className = "scope-dove-lista";
    dove2.textContent = "Playlist interessate: " + nomi.join(", ");
    scelte.appendChild(dove2);

    $("scopePanel").hidden = false;
    syncNoScroll();
    return new Promise((r) => { _scopeResolve = r; });
  }

  function _chiudiScope(scelta) {
    $("scopePanel").hidden = true;
    const r = _scopeResolve;
    _scopeResolve = null;
    if (r) r(scelta);
  }

  $("scopeAnnulla").addEventListener("click", () => _chiudiScope(null));
  $("scopePanel").addEventListener("click", (e) => { if (e.target === $("scopePanel")) _chiudiScope(null); });

  /* Nasconde il brano, togliendolo anche dalle playlist se richiesto. */
  async function hideTrack(id, scelta) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    /* Senza scelta chiedo: solo se il brano e' in una playlist. */
    let cosa = scelta || null;
    if (!cosa) {
      cosa = await _scegliCosaTogliere(id, t.title, false);
      if (!cosa) return;
    }
    if (cosa === "playlist" || cosa === "entrambe") {
      for (const p of _playlistCheContengono(id)) {
        const pl = _playlistCercata(p);
        if (!pl) continue;
        pl.tracks = (pl.tracks || []).filter((x) => x !== id);
      }
      saveCurrentState();
      _salvaPlaylistCondivise();
    }
    /* "playlist" vuol dire: NON toccare la libreria. */
    if (cosa === "playlist") {
      render();
      renderPlaylist();
      _aggiornaBadgePlaylist();
      toast("Tolto dalle playlist, ma resta nella tua libreria");
      return;
    }
    const msg = t.builtin
      ? "'" + t.title + "' sparisce dalla tua lista, ma resta nel sito e gli altri lo vedono ancora."
      : "'" + t.title + "' sparisce dalla tua lista di questo profilo.";
      hiddenTracks.add(id);
      saveCurrentState();
      _salvaStatoCondiviso();
    const extra = cosa === "entrambe"
      ? " E' uscito anche dalle playlist."
      : " Resta nelle playlist.";
    toast(msg.slice(0, 90) + extra);
    if (currentId === id) {
      if (audio) audio.pause();
      currentId = null;
      setHud();
    }
    render();
    renderPlaylist();
    _aggiornaBadgePlaylist();
  }

  /* ---------- Le playlist nella libreria ----------
     Non sono una sezione a parte con una finestra: sono una fila di
     linguette sopra la libreria. Tocchi una e sotto vedi la lista normale
     con dentro solo i brani di quella playlist. Torni su "Tutte" e hai di
     nuovo tutta la libreria. */

  let _playlistAttiva = "";
  let _lingScrollMemoria = 0;

  /* Tenere premuto, come sui brani: se scorre col dito non succede niente,
     e su iPhone non compare il menu con "copia". */
  function _premiLungo(el, fai) {
    if (!el) return;
    let timer = null;
    let via = false;
    const ferma = () => { if (timer) { clearTimeout(timer); timer = null; } };
    el.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      via = false;
      timer = setTimeout(() => { timer = null; via = true; fai(); }, 550);
      const mosso = (ev) => {
        if (!timer) return;
        if (Math.abs((ev.clientX || 0) - (e.clientX || 0)) > 10 ||
            Math.abs((ev.clientY || 0) - (e.clientY || 0)) > 10) ferma();
      };
      const su = () => {
        ferma();
        el.removeEventListener("pointermove", mosso);
        el.removeEventListener("pointerup", su);
        el.removeEventListener("pointercancel", su);
      };
      el.addEventListener("pointermove", mosso);
      el.addEventListener("pointerup", su);
      el.addEventListener("pointercancel", su);
    });
    /* se e' stato un tocco lungo, il click normale non deve cambiare
       la playlist selezionata */
    el.addEventListener("click", (e) => {
      if (via) { via = false; e.preventDefault(); e.stopPropagation(); }
    }, true);
    /* niente menu contestuale del telefono, niente "copia" */
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /* Chiede prima di cancellare: una playlist non e' un brano, ma
     cancellarla per sbaglio fa perdere il lavoro di ordinarla. */
  async function _chiediEdEliminaPlaylist(p) {
    const n = (p.tracks || []).length;
    const si = await askConfirm(
      "Eliminare la playlist?",
      'Playlist "' + p.name + '"' + (n ? " con " + n + (n === 1 ? " brano" : " brani") : "") +
      ".\n\nLe canzoni NON vengono toccate: restano tutte nella libreria.",
      "Elimina"
    );
    if (!si) return;
    playlists = playlists.filter((x) => x.id !== p.id);
    saveCurrentState();
    _salvaPlaylistCondivise();
    if (_playlistAttiva === p.name) _playlistAttiva = "";
    _disegnaLinguettePlaylist();
    render();
    toast('Playlist "' + p.name + '" eliminata');
  }

  /* ---------- Scegliere più canzioni insieme ----------

   Ste: un tasto "Seleziona" per prendere più brani in una volta e poi:
   metterli in una playlist, toglierli dalla libreria e lasciarli solo li', o
   eliminarli. Prima si poteva fare solo un brano alla volta.

   Le azioni riusano le funzioni di sempre (una per brano), quindi non
   ripeto la logica: se un giorno cambio una, cambia anche qui. */

let _inSelezione = false;
const _scelti = new Set();

function _quantiScelti() { return _scelti.size; }

function _apriSelezione() {
  _inSelezione = true;
  _scelti.clear();
  _disegnaBarraSelezione();
  render();
}

function _chiudiSelezione() {
  _inSelezione = false;
  _scelti.clear();
  _disegnaBarraSelezione();
  render();
}

function _alternaSelezione(id) {
  if (!_inSelezione) return false;
  if (_scelti.has(id)) _scelti.delete(id);
  else _scelti.add(id);
  _disegnaBarraSelezione();
  render();
  return true;
}

function _disegnaBarraSelezione() {
  const barra = $("selezioneBarra");
  if (!barra) return;
  barra.hidden = !_inSelezione;
  const n = _quantiScelti();
  const testo = $("selezioneConto");
  if (testo) {
    testo.textContent = n === 0 ? "Tocca le canzioni da scegliere"
      : n === 1 ? "1 canzone scelta" : n + " canzioni scelte";
  }
  const b = $("btnSeleziona");
  if (b) b.classList.toggle("on", _inSelezione);
}

/* Le azioni vere: riusano le funzioni che gia' esistono per un brano. */
async function _selezionaAggiungiPlaylist() {
  const ids = [..._scelti];
  if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
  const nomi = playlists.map((p) => p.name);
  const testo = "Aggiungi " + (ids.length === 1 ? "la canzone scelta" : ids.length + " canzioni scelte") +
    " a una playlist" +
    (nomi.length ? "\n\nSe ne hai gia' una, scrivi il suo nome:\n  " + nomi.join("\n  ") +
      "\n\nAltrimenti scrivi un nome nuovo e la creo io."
      : "\n\nNon hai ancora playlist: scrivi il nome e la creo.");
  const nome = _chiediNome(testo);
  if (!nome) return;
  /* La prima crea la playlist, le altre ci finiscono dentro. */
  let pl = _playlistConNome(nome, ids[0]);
  for (let i = 1; i < ids.length; i++) {
    if (pl && Array.isArray(pl.tracks) && pl.tracks.indexOf(ids[i]) < 0) pl.tracks.push(ids[i]);
  }
  _aggiornaBadgePlaylist();
  _salvaPlaylistCondivise();
  _chiudiSelezione();
  toast(ids.length + (ids.length === 1 ? " canzone aggiunta a " : " canzioni aggiunte a ") + '"' + pl.name + '"');
}

/* Sposta le canzoni scelte "solo nella playlist".

   Prima non chiedeva in QUALE playlist: le canzoni sparivano dalla libreria
   senza essere da nessuna parte, e non le ritrovavi piu'. Ste se n'e'
   accorto e ha ragione: ora chiedo la playlist PRIMA, come si fa quando se ne
   sceglie una sola dalla pressione lunga. */
async function _selezionaSoloInPlaylist() {
  const ids = [..._scelti];
  if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
  const nomi = playlists.map((p) => p.name);
  const testo = "Metti " + (ids.length === 1 ? "la canzone scelta" : ids.length + " canzioni scelte") +
    " in una playlist, cosi' escono dalla libreria ma restano suonabili li' dentro." +
    (nomi.length
      ? "\n\nScrivi il nome della playlist:\n  " + nomi.join("\n  ") +
        "\n\nOppure un nome nuovo e la creo io."
      : "\n\nNon hai ancora playlist: scrivi il nome e la creo.");
  const nome = _chiediNome(testo);
  if (!nome) return;
  /* Prima le metto davvero nella playlist: cosi' non rischio di nasconderle
     da qualche parte dove poi non le trovo. */
  const pl = _playlistConNome(nome, ids[0]);
  for (let i = 1; i < ids.length; i++) {
    if (pl && Array.isArray(pl.tracks) && pl.tracks.indexOf(ids[i]) < 0) pl.tracks.push(ids[i]);
  }
  const si = await askConfirm(
    "Tirarle fuori dalla libreria?",
    ids.length + (ids.length === 1 ? " canzone entra in \"" : " canzioni entrano in \"") + pl.name +
      "\" e sparisce dalla libreria.\n\nRestano suonabili dentro la playlist: per rivederle,\n" +
      "apri quella playlist.",
    "Sposta"
  );
  if (!si) return;
  for (const id of ids) _mettiSoloInPlaylist(id);
  _salvaSoloInPlaylist();
  _disegnaLinguettePlaylist();
  _aggiornaBadgePlaylist();
  _salvaPlaylistCondivise();
  _chiudiSelezione();
  toast("Sono dentro \"" + pl.name + "\" e non le vedi piu' in libreria");
}

async function _selezionaElimina() {
  const ids = [..._scelti];
  if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
  const si = await askConfirm(
    "Eliminare " + ids.length + (ids.length === 1 ? " canzone?" : " canzioni?"),
    "Le canzoni scelte spariscono davvero, dal sito e da ogni dispositivo.\n\n" +
      "Questa cosa non si può annullare.",
    "Elimina"
  );
  if (!si) return;
  for (const id of ids) {
    try { await removeTrack(id); } catch (e) { /* una alla volta: se una falla le altre vanno avanti */ }
  }
  _chiudiSelezione();
  toast(ids.length + (ids.length === 1 ? " canzone eliminata" : " canzioni eliminate"));
}

  function _disegnaLinguettePlaylist() {
    const box = $("plLinguette");
    const scroll = $("plLingScroll");
    const dove = $("plDoveSono");
    if (!box || !scroll) return;
    scroll.innerHTML = "";
    const ceNeSonno = playlists.length > 0;
    box.hidden = false;   /* la riga c'e' sempre: se non ci sono playlist resta solo "Tutte" e il "+" */
for (const p of playlists) {
        /* Ste: "agli altri spunta la mia playlist anche se mettono che non
           vogliono le mie canzoni". Se segno una playlist come nascosta, agli
           altri non deve comparire NE' la playlist NE' le sue canzoni. A me
           invece la voglio vedere: per questo ricordo chi l'ha nascosta
           (nascostaDa) e la nascondo solo agli altri. */
        if (p.nascosta === true && p.nascostaDa && p.nascostaDa !== profile) continue;
        const b = document.createElement("button");
      b.type = "button";
      b.className = "pl-ling" + (_playlistAttiva === p.name ? " attiva" : "");
      const n = (p.tracks || []).length;
      b.textContent = n ? p.name + " · " + n : p.name;
      b.title = n ? p.name + ": " + n + (n === 1 ? " brano" : " brani") : p.name + ": vuota";
      b.addEventListener("click", () => {
        _playlistAttiva = (_playlistAttiva === p.name ? "" : p.name);
        _disegnaLinguettePlaylist();
        render();
      });
      /* Tenendo premuto si cancella la playlist. Uguale a come funziona
         sui brani, e non si copia il testo tenendo premuto su iPhone. */
      _premiLungo(b, async () => {
        suppressClick = true;
        try { navigator.vibrate && navigator.vibrate(8); } catch (e) { /* noop */ }
        await _chiediEdEliminaPlaylist(p);
      });
      scroll.appendChild(b);
    }
    $("plLingTutte").classList.toggle("attiva", !_playlistAttiva);
    if (dove) {
      if (_playlistAttiva) {
        const pl = _playlistCercata(_playlistAttiva);
        const n = pl ? (pl.tracks || []).length : 0;
        dove.innerHTML = "Stai vedendo <b>" + _playlistAttiva + "</b> · " + n +
          (n === 1 ? " brano" : " brani") + ". <span class=\"pl-torna\">Torna a tutta la libreria</span>";
        const torna = dove.querySelector(".pl-torna");
        if (torna) torna.addEventListener("click", () => {
          _playlistAttiva = "";
          _disegnaLinguettePlaylist();
          render();
        });
        dove.hidden = false;
      } else {
        dove.hidden = true;
      }
    }
    if (!_lingScrollMemoria && scroll.scrollWidth > 0) {
      scroll.scrollLeft = _lingScrollMemoria;
    }
    /* Se la playlist scelta e' sparita (l'ho eliminata altrove) torno su Tutte */
    if (_playlistAttiva && !_playlistCercata(_playlistAttiva)) {
      _playlistAttiva = "";
      render();
    }
    return ceNeSonno;
  }

  /* ---------- Canzoni con lo stesso nome ----------
   Stefano l'ha chiesto perche' temeva doppioni. Serve a vedere le canzoni
   che si somigliano, cosi' capisci se quella che stai cercando e' quella
   giusta o un'altra con identico nome. Non sono errori: sono brani diversi
   con nomi vicini (per esempio lo stesso titolo di due artisti). */
  function _gruppiSimili() {
    const perTitolo = new Map();
    for (const t of tracks) {
      if (hiddenTracks.has(t.id)) continue;
      const titolo = stripArtistPrefix(t.artist, t.title) || t.title || "";
      const k = normKey(titolo);
      if (!k || k.length < 3) continue;
      if (!perTitolo.has(k)) perTitolo.set(k, []);
      perTitolo.get(k).push(t);
    }
    /* Solo i gruppi con piu' di un brano, e in ordine di quante copie ne
       hanno: cosi' in cima ci sono le cose che pesano di piu'. */
    const gruppi = [...perTitolo.values()].filter((g) => g.length > 1);
    gruppi.sort((a, b) => b.length - a.length ||
      String(a[0].title).localeCompare(String(b[0].title)));
    return gruppi;
  }

  function _stampaSimili() {
    const pannello = $("similiPanel");
    const corpo = $("similiCorpo");
    if (!pannello || !corpo) return;
    const gruppi = _gruppiSimili();
    const nCopie = gruppi.reduce((s, g) => s + g.length, 0);
    if ($("similiSub")) {
      $("similiSub").textContent = gruppi.length
        ? gruppi.length + (gruppi.length === 1 ? " nome si ripete" : " nomi si ripetono") +
          " fra le tue canzoni (" + nCopie + " brani)"
        : "Nessuna canzone con lo stesso nome: la libreria e' pulita";
    }
    if (!gruppi.length) {
      corpo.innerHTML = '<div class="stat-lista"><div class="stat-item"><span>Nomi che si ripetono</span><b>0</b></div></div>' +
        '<p class="nota" style="margin:8px 2px 0">Nella tua libreria non ci sono due canzoni con lo stesso nome. Tutto in ordine.</p>';
    } else {
      let html = "";
      for (const g of gruppi) {
        html += '<div class="simili-gruppo"><div class="simili-titolo">' +
          String(g[0].title).replace(/[<>]/g, "") +
          (g.length > 2 ? " <span class='simili-conto'>x" + g.length + "</span>" : "") + "</div>";
        for (const t of g) {
          html += '<div class="simili-riga" data-id="' + String(t.id).replace(/[<>]/g, "") + '">' +
            '<span class="simili-artista">' + String(t.artist || "senza artista").replace(/[<>]/g, "") + "</span>" +
            '<span class="simili-dove">' + (t.builtin ? "dalla libreria" : "aggiunta da te") + "</span>" +
            "</div>";
        }
        html += "</div>";
      }
      corpo.innerHTML = html;
    }
    pannello.hidden = false;
    syncNoScroll();
    _aggiornaBadgeSimili();
  }

  function _chiudiPannelloSimili() {
    const m = $("similiPanel");
    if (m) m.hidden = true;
  }

  function _aggiornaBadgeSimili() {
    const b = $("similiBadge");
    if (!b) return;
    const gruppi = _gruppiSimili();
    const n = gruppi.reduce((s, g) => s + g.length, 0);
    b.hidden = !n;
    b.textContent = n > 9 ? "9+" : String(n);
    const voce = $("btnSimili");
    if (voce) voce.classList.toggle("has-falliti", n > 0);
  }

  /* Recupero: il brano e' finito ma nessuno e' andato avanti.

     Prima qui avevo riscritto la scelta del brano successivo (playlist, coda,
     ripeti...). Era una SBAGLIATURA: due copie di quella logica possono
     scattare insieme e farti saltare una canzone, o partire due brani insieme.
     L'unica che sa come funzionano playlist, coda e ripetizione e'
     handleEnded(): quindi gli passo il problema e non lo risolvo qui. */
  let _stoRecuperando = false;

  function _finitoSenzaAvanti() {
    try {
      if (_stoRecuperando) return;
      if (!_vuoleSuonare || !currentId || !audio) return;
      if (!audio.ended) return;
      /* Non e' davvero finito: siamo ancora agli ultimi secondi */
      if (isFinite(audio.duration) && audio.duration > 0 &&
          audio.currentTime < audio.duration - 0.6) return;
      _stoRecuperando = true;
      try {
        handleEnded();
      } finally {
        setTimeout(() => { _stoRecuperando = false; }, 1500);
      }
    } catch (e) { _stoRecuperando = false; }
  }

  /* Controllo continuo mentre lo schermo e' acceso.

     Lo accendo SOLO con lo schermo acceso: a schermo spento il telefono
     sospende la pagina e il controllo non girerebbe comunque, quindi
     sarebbe solo fatica e batteria sprecata. */
  let _sondaAvanti = null;

  function _accendiSonda() {
    if (_sondaAvanti) clearInterval(_sondaAvanti);
    _sondaAvanti = setInterval(_finitoSenzaAvanti, 5000);
  }

  function _spezniSonda() {
    if (_sondaAvanti) { clearInterval(_sondaAvanti); _sondaAvanti = null; }
  }

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
  /* Ste: "continua a ricaricarsi". Serve distinguere due cose diverse:
     - la PAGINA si ricarica davvero (e' un problema del browser/worker)
     - oppure la pagina resta aperta ma continua a ricostruire la libreria
     Questa riga mi dice quale delle due e': se compare piu' di una volta
     senza che io abbia toccato niente, e' un ricaricamento vero. */
  try {
    const _volte = Number(sessionStorage.getItem("mb.avvii") || "0") + 1;
    sessionStorage.setItem("mb.avvii", String(_volte));
    segnalaErrore("DIAG avvio pagina numero " + _volte +
      " | aperta da " + Math.round(performance.now() / 1000) + " secondi");
  } catch (e) { /* noop */ }
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
    /* Ste: "mentre scorro mi fa riascire su". Riprendo la lista esattamente
       dove l'avevo lasciata. */
    _ripristinaPuntoLibreria();
    recuperaCopertineMancanti();
  refreshCachedSongs();
  /* Appena aperta la pagina, condivido da solo i brani che esistono solo qui:
     non serve ricordarsi di fare niente. Se il PC non c'e' riprovo al prossimo
     avvio, e intanto i brani restano al sicuro qui. */
  setTimeout(() => { condividiBraniLocali(); }, 1200);
  /* Quando sono a casa prendo la chiave dal computer invece di chiederla. */
  setTimeout(() => { _prendiChiaveDalComputer(); }, 2500);
  /* Controllo se questa scheda e' in navigazione privata: e' la causa numero
     uno di "ho cambiato il nome e non e' rimasto". */
  _scopriSeSeiInPrivata();
  /* Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
     La memoria del browser sul telefono non sempre regge, quindi i nomi li
     tengo anche nel database del telefono. Prima di tutto il resto recupero
     quelli da li': devono essere nella libreria gia' dalla prima schermata,
     altrimenti per un attimo i brani si vedono col nome vecchio. */
  _ripristinaRinomini().then((n) => {
    if (n) {
      try { loadAll(); } catch (e) { /* noop */ }
    }
  });
  /* Controllo anche quanti brani sono ancora solo qui (cosi' il bottone
     "Manda al computer" compare) e accendo il ritento automatico. */
      setTimeout(() => { _aggiornaNonCondivisi(); _riprovaCondivisione(); _preparaCasellaServizio(); _aggiornaCoda(); _caricaPlaylistCondivise(); _caricaStatoCondiviso(); _disegnaLinguettePlaylist(); _avvisoIcona(); }, 1600);
  /* Ogni tanto guardo se il computer ha scaricato quello che era in coda:
     cosi' l'utente vede che il brano e' entrato e non deve chiedere. */
  setInterval(() => { _aggiornaCoda(); }, 120000);
  /* Rileggo lo stato condiviso un paio di volte dopo l'avvio: il sito puo'
     essere indietro di qualche minuto, e un nome salvato adesso sul PC o sul
     telefono deve comparire senza aspettare il riavvio. */
  setTimeout(() => { _caricaStatoCondiviso(); }, 5000);
  setTimeout(() => { _caricaStatoCondiviso(); }, 15000);
  _avviaStatistiche();
  /* Ste: "mentre scorro mi fa riascire su". Salvo dove si trova' la lista e
   qual e' il brano che stai ascoltando, cosi' dopo un aggiornamento o un
   ricaricamento torni esattamente dove eri. */
function _salvaPuntoLibreria() {
  try {
    const el = $("playlist");
    if (!el) return;
    LS.set("mb.punto", {
      scorrimento: el.scrollTop,
      brano: (current && current.id) || "",
      profilo: profile
    });
  } catch (e) { /* noop */ }
}

/* Rimette la lista al punto in cui l'avevi lasciata. */
function _ripristinaPuntoLibreria() {
  try {
    const p = LS.get("mb.punto", null);
    if (!p || !p.scorrimento) return;
    if (p.profilo && p.profilo !== profile) return;
    const el = $("playlist");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = p.scorrimento;
      /* Se il brano che stavi ascoltando e' ancora in lista, lo metto in
         evidenza: cosi' lo ritrovi subito senza doverlo cercare. */
      if (p.brano) {
        try {
          const riga = el.querySelector('[data-id="' + p.brano + '"]');
          if (riga) riga.classList.add("punto-ripreso");
        } catch (e) { /* noop */ }
      }
    });
  } catch (e) { /* noop */ }
}

  /* Il numero della versione sempre visibile in alto: e' successo piu' volte
     che il browser restava su una versione vecchia e sembrava che gli
     aggiornamenti non funzionassero. Con questo numero lo vedo subito. */
  try {
    const vf = $("verBadge");
    if (vf) {
      vf.textContent = String(APP_VERSION).replace(/^6\.(\d+).*$/, "6.$1");
      vf.title = "Versione in uso: " + APP_VERSION + "\nTocca per aggiornare subito";
      /* Ste: "se tocco la versione non fa niente". Ricaricare da solo non
         bastava: il worker vecchio continuava a servire il vecchio app.js.
         Ora se c'e' un aggiornamento in attesa gli dico di attivarsi subito,
         e quando e' attivo ricarico davvero. */
      vf.onclick = () => {
        try {
          /* Ste: "la versione non si aggiorna". Con il solo ricaricamento non
             bastava: il telefono teneva la copia vecchia. Adesso il numero
             apre direttamente una pagina "nuova" (indirizzo mai visto, quindi
             niente copia vecchia) e da li' in poi l'app si aggiorna da sola. */
          const nuovoIndirizzo = "./index.html?forza=" + Date.now();
          window.location.replace(nuovoIndirizzo);
        } catch (e) {
          window.location.reload(true);
        }
      };
    }
  } catch (e) { /* noop */ }

  /* La posizione nella lista la ricordo mentre scorro, non solo quando parte
     un aggiornamento: cosi' un ricaricamento qualsiasi non mi butta in cima.
     Ste: "mentre scorro mi fa riascire su". */
  try {
    const el = $("playlist");
    if (el) {
      let _salvoPunto = null;
      el.addEventListener("scroll", () => {
        if (_salvoPunto) clearTimeout(_salvoPunto);
        _salvoPunto = setTimeout(_salvaPuntoLibreria, 600);
      }, { passive: true });
      el.addEventListener("click", () => _salvaPuntoLibreria(), true);
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
      /* Ste: "l'app si aggiorna continuamente e ogni volta toglie le
         canzoni, mentre scorro mi fa riascire su".
         Prima, quando il worker si aggiornava, ricaricavo la pagina DA SOLO
         dopo mezzo secondo. Con gli aggiornamenti frequenti succedeva di
         continuo: la pagina si ricaricava mentre stavi usando l'app (e
         quindi brani che sparivano e lista che tornava in cima).

         Adesso NON ricarico piu' da solo: l'aggiornamento aspetta che
         decidi tu. Se serve subito, tocchi il numero della versione in alto
         (e li ho lasciato anche la posizione della lista, cosi' non perdi
         il punto). */
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        _salvaPuntoLibreria();
        try {
          const vb = $("verBadge");
          if (vb) {
            vb.classList.add("ha-aggiornamento");
            vb.title = "C'è un aggiornamento: tocca qui per prenderlo";
          }
        } catch (e) { /* noop */ }
        toast("Aggiornamento pronto: tocca la versione in alto quando vuoi", 6000);
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
              /* Ste: "ancora si aggiorna". La nuova versione ASPETTA che
                 chiuda del tutto l'app (adesso non si impone piu' mentre
                 stai usando: era quello che faceva sparire i brani e ti
                 rimandava la lista in cima). Quindi qui devo dirti cosa
                 fare davvero, altrimenti resta in attesa per sempre. */
              const vb = $("verBadge");
              if (vb) vb.classList.add("ha-aggiornamento");
              toast("Aggiornamento pronto: chiudi del tutto l'app e la riapri", 7000);
              segnalaErrore("aggiornamento pronto: chiudere del tutto l'app per prenderlo");
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
    let _quantiBraniOnline = 0;
function numeroBraniOnline(testo) {
      return (String(testo || "").match(/file:\s*"songs\/track-/g) || []).length;
    }
let _timerBarraAggiornamento = null;
let _barraAggiornamentoMostrata = false;
function _nascondiBarraAggiornamento() {
    /* Ste: "la barra in verde spunta ancora sempre, continuamente anche se non
       c'e' nessun brano nuovo". Prima la barra, una volta comparsa, restava
       lì per sempre. Adesso quando il controllo dice che non c'e' niente di
       nuovo sparisce, e sparisce anche da sola dopo un po' se nessuno la
       tocca. */
    try {
      const a = document.getElementById("avviso-vecchia");
      if (a && a.parentNode) a.parentNode.removeChild(a);
    } catch (e) { /* noop */ }
    _chiudiBarraVersione();
}
/* Il numero della versione in alto diventa giallo quando c'e' qualcosa da
   aggiornare: cosi' sai che e' lui il posto da toccare. */
function _chiudiBarraVersione() {
    try {
      const vb = $("verBadge");
      if (vb) vb.classList.remove("ha-aggiornamento");
    } catch (e) { /* noop */ }
}
function _segnalaBarraVersione() {
    try {
      const vb = $("verBadge");
      if (vb) {
        vb.classList.add("ha-aggiornamento");
        vb.title = "C'è un aggiornamento: tocca qui per prenderlo subito";
      }
    } catch (e) { /* noop */ }
}
/* Ste: "non è cambiato niente".
   Dopo giorni di tentativi si è capito il motivo vero: il sito online era
   gia' giusto, ma il telefono continuava a usare una copia vecchia dei file
   salvati nel browser, quindi ricaricando non cambiava nulla e la pagina
   non si aggiornava da sola.

   Adesso l'app controlla da sola qual e' la versione sul sito e, se il
   telefono e' rimasto indietro, lo dice con una barra e con un collegamento
   che porta a una pagina "nuova": un indirizzo diverso non puo' usare la
   copia vecchia, quindi l'aggiornamento riesce al primo tocco. */
function _controllaSeSonoVecchio() {
    try {
      fetch("./versione.json", { cache: "no-store" })
        .then((r) => (r && r.ok ? r.json() : null))
        .then((d) => {
          if (!d || !d.versione) return;
          const mia = String(APP_VERSION).replace(/\s.*$/, "");
          const loro = String(d.versione).replace(/\s.*$/, "");
          if (mia === loro) {
            _chiudiBarraVecchio();
            return;
          }
          _mostraBarraVecchio(mia, loro);
        })
        .catch(() => { /* niente rete: lascio stare, tanto i brani funzionano lo stesso */ });
    } catch (e) { /* noop */ }
}
function _chiudiBarraVecchio() {
    try {
      const b = document.getElementById("avviso-vecchio-app");
      if (b && b.parentNode) b.parentNode.removeChild(b);
    } catch (e) { /* noop */ }
}
function _mostraBarraVecchio(mia, loro) {
    try {
      _chiudiBarraVecchio();
      const b = document.createElement("div");
      b.id = "avviso-vecchio-app";
      b.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:120;" +
        "background:#3a1414;border:1px solid #ff6b6b;color:#ffe2e2;padding:12px 14px;" +
        "border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.5)";
      /* Il collegamento porta a "?forza=<momento>", un indirizzo mai visto
         prima: il browser non ha niente da riprendere e prende i file nuovi. */
      const a = document.createElement("a");
      a.href = "./index.html?forza=" + Date.now();
      a.textContent = "Aggiorna ora";
      a.style.cssText = "display:inline-block;margin-top:8px;background:#ff6b6b;color:#3a1414;" +
        "font-weight:800;padding:9px 16px;border-radius:8px;text-decoration:none";
      const t = document.createElement("div");
      t.textContent = "Questo telefono sta ancora sulla versione " + mia +
        " (ora c'è la " + loro + "). Tocca per aggiornare.";
      b.appendChild(t);
      b.appendChild(a);
      document.body.appendChild(b);
    } catch (e) { /* noop */ }
}
function avvisoAggiornamento(testo) {
    /* Ste: "la barra in verde spunta ancora sempre". Oltre a toglierla quando
       non c'e' niente, adesso sparisce anche da sola dopo 30 secondi se nessuno
       la tocca: cosi' non resta piu' appesa li' a disturbare la libreria.
       E il numero della versione in alto diventa giallo, cosi' sai che il
       posto da toccare per aggiornare e' quello. */
    _segnalaBarraVersione();
    try {
      /* Ste: "la barra verde resta per troppo tempo". Prima il timer veniva
         riacceso a ogni controllo (ogni minuto), quindi la barra non spariva
         mai finche' la condizione restava vera: era un avviso che non
         ascoltava nessuno. Adesso, se la barra e' gia' stata mostrata e
         Ste non l'ha toccata, non la riaccendo piu': sparisce e basta. */
      if (!_barraAggiornamentoMostrata) {
        _barraAggiornamentoMostrata = true;
        clearTimeout(_timerBarraAggiornamento);
        _timerBarraAggiornamento = setTimeout(() => {
          _nascondiBarraAggiornamento();
        }, 20000);
      }
    } catch (e) { /* noop */ }
    let avviso = document.getElementById("avviso-vecchia");
    if (avviso) {
      /* Ste: "la barra in verde spunta sempre anche se non ho messo niente".
         Il motivo era che la barra, una volta comparsa, non se ne andava
         piu': restava li' per sempre anche quando ormai non c'era piu' nulla
         da aggiornare. Adesso quando non c'e' niente la tolgo. */
      avviso.textContent = testo + " Tocca qui per aggiornare adesso.";
      avviso.onclick = () => {
        avviso.textContent = "Aggiorno...";
        /* Se la tocca davvero, la prossima volta la barra puo' ricomparire. */
        _barraAggiornamentoMostrata = false;
        if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((r) => r && r.update());
        setTimeout(() => window.location.reload(true), 900);
      };
      return;
    }
avviso = document.createElement("div");
    avviso.id = "avviso-vecchia";
    avviso.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:99;" +
      "background:#132a1f;border:1px solid #37e6a6;color:#c8ffe6;padding:12px 14px;" +
      "border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)";
    document.body.appendChild(avviso);
    avviso.textContent = testo + " Tocca qui per aggiornare adesso.";
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
          if (!braniNuovi && !versioneNuova) {
        /* Niente di nuovo: la barra (se c'era) non deve restare appesa li'. */
        _nascondiBarraAggiornamento();
        return;
      }
const che = [];
      if (braniNuovi) che.push((suoi - miei) + (suoi - miei === 1 ? " brano nuovo" : " brani nuovi"));
          if (versioneNuova) che.push("versione " + (m ? m[1] : "?"));
          segnalaErrore("aggiornamento disponibile: " + che.join(" e ") +
            " (qui " + miei + " brani, online " + suoi + ")");

          /* Ste: "spesso spunta la barra verde 'Si puo' aggiornare: 1 brano
             nuovo' anche se non c'e' niente di nuovo, e resta per un sacco di
             tempo". Motivo: i brani nuovi NON hanno bisogno di un aggiornamento,
             entrano da soli nella libreria (e' checkForNewSongs che li porta).
             La barra li annunciava come se dovessi fare qualcosa, ma non c'era
             niente da fare: quindi adesso la barra parla SOLO delle versioni,
             cioe' di cose che devo fare davvero io (toccare per aggiornare). */
          if (!versioneNuova) {
            _nascondiBarraAggiornamento();
            return;
          }
          if (branoInCorso()) {
            /* Prima scrivevo "aggiorno quando finisci": ma se uno sta
               ascoltando per ore, l'app resta vecchia per sempre (e' capitato
               proprio per una correzione dell'audio). Ora e' una riga su cui
               si tocca e si aggiorna subito. */
            avvisoAggiornamento("C'e' " + (che.length ? "e' " : "") + che.join(" e ") + ":");
            return;
          }
          /* Ste: "continua a ricaricarsi". Questo era il colpevole: trovando
             un brano nuovo, la pagina si ricaricava DA SOLA dopo 1,2 secondi.
             E siccome scaricando una canzone dal telefono il computer la
             aggiunge subito, capitava ogni volta: ricarica, trova un brano,
             ricarica all'infinito (l'ho visto 6 volte in 45 secondi).

             Adesso NON ricarico piu' da solo: ti metto la riga sotto con
             quello che c'e' di nuovo e tocchi tu quando vuoi. E comunque i
             brani nuovi entrano da soli, senza ricaricare: li aggiorna
             checkForNewSongs. */
          avvisoAggiornamento("Si puo' aggiornare: " + che.join(" e ") + ".");
        })
        .catch(() => { _stoControllando = false; });
    }
    setInterval(controllaAggiornamenti, 60000);
    setTimeout(controllaAggiornamenti, 8000);

    /* ---------- Installare sul telefono ----------
       Il sito gia' e' un'app: ha icona, si apre a schermo intero e funziona
       anche senza rete. Quello che manca e' il tocco per metterla sulla home.
       Un'app installata e' anche piu' adatta a tenere suonando con lo
       schermo spento, perche' non e' piu' una scheda del navigatore.
       Lo chiedo solo una volta, e solo se il telefono me lo offre. */
    (function offersInstall() {
      const giaInstallata = window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      if (giaInstallata) return;
      if (localStorage.getItem("mb.install-chiesto") === "si") return;
      let evento = null;
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        evento = e;
        if (localStorage.getItem("mb.install-chiesto") === "no") return;
        try { _offriInstalla(); } catch (err) { /* noop */ }
      });
      function _offriInstalla() {
        const bar = document.createElement("div");
        bar.className = "barra-installa";
        bar.innerHTML = '<span class="barra-testo">Mettila sulla home: si apre come un\'app vera e suona anche a schermo spento</span>' +
          '<button type="button" class="barra-si">Installa</button>' +
          '<button type="button" class="barra-no" aria-label="Non ora">X</button>';
        document.body.appendChild(bar);
        requestAnimationFrame(() => bar.classList.add("visibile"));
        const chiudi = () => { bar.classList.remove("visibile"); setTimeout(() => bar.remove(), 300); };
        bar.querySelector(".barra-si").addEventListener("click", async () => {
          localStorage.setItem("mb.install-chiesto", "si");
          chiudi();
          if (evento) { evento.prompt(); try { await evento.userChoice; } catch (e) { /* noop */ } }
        });
        bar.querySelector(".barra-no").addEventListener("click", () => {
          localStorage.setItem("mb.install-chiesto", "no");
          chiudi();
        });
      }
      /* Su iPhone il navigatore non offre l'installazione: li lascio
         comunque la scorciatoia, perche' li si installa a mano. */
      const iPhone = /iPad|iPhone|iPod/.test(navigator.userAgent || "");
      if (iPhone) {
        const aspetto = setTimeout(() => {
          if (localStorage.getItem("mb.install-chiesto")) return;
          toast("Per metterla sulla home: icona di condivisione, poi 'Aggiungi alla schermata Home'");
        }, 6000);
        void aspetto;
      }
    })();
  })();
})();

