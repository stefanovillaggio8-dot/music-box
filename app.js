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
    { title: "Sogni Appesi", file: "songs/track-15.mp3", artist: "", profile: "Ste" },
];

  const PALETTE = [
    "linear-gradient(135deg,#b06bff,#4fc3ff)",
    "linear-gradient(135deg,#ff7a9e,#ffb86b)",
    "linear-gradient(135deg,#37e6a6,#4fc3ff)",
    "linear-gradient(135deg,#ffb02e,#ff5c7a)"
  ];

  const $ = (id) => document.getElementById(id);
  const APP_NAME = "spotifynonavraiimieisoldi";
  const APP_VERSION = "6.1";

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
  let hiddenTracks = new Set();
  let scrubbing = false;
  let pendingSeek = null;
  let lastSave = 0;
  let resumeAt = 0;
  let queue = [];
  let suppressClick = false;
  let swReg = null;

  const DEFAULT_PROFILE = "Ste";
  let profile = DEFAULT_PROFILE;
  let profiles = [DEFAULT_PROFILE];

  function allState() {
    return LS.get("mb.state", {});
  }

  function saveAllState(next) {
    LS.set("mb.state", next);
  }

  function profileState(name) {
    const all = allState();
    return all[name] || { hidden: [], favs: [], last: null, time: 0 };
  }

  function writeProfileState(name, patch) {
    const all = allState();
    all[name] = Object.assign(profileState(name), patch);
    saveAllState(all);
  }

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
  const DB_VERSION = 3;

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

  /* ---------- Caricamento tracce ---------- */
  async function loadAll() {
    const builtin = BUILTIN
      .filter((b) => (b.profile || DEFAULT_PROFILE) === profile)
      .map((b, i) => {
        const info = coverInfo(b.artist, b.title);
        return {
          id: "builtin-" + BUILTIN.indexOf(b),
          title: b.title,
          artist: b.artist || "",
          album: info && info.album ? info.album : "",
          cover: info && info.cover ? info.cover : "",
          url: b.file,
          builtin: true,
          gradient: PALETTE[i % PALETTE.length],
          size: null
        };
      });

    let added = [];
    try {
      const records = (await dbAll()).filter((r) => r && r.id && r.blob);
      added = records
        .filter((r) => (r.profile || DEFAULT_PROFILE) === profile)
        .map((r) => ({
        id: r.id,
        title: r.title,
        artist: r.artist || "",
        album: r.album || "",
        cover: r.cover || null,
        source: r.source || "file",
        url: URL.createObjectURL(r.blob),
        builtin: false,
        gradient: PALETTE[(builtin.length + Math.abs(hashId(r.id))) % PALETTE.length],
        size: r.size
      }));
    } catch (e) {
      console.warn("IndexedDB non disponibile", e);
    }

    tracks = builtin.concat(added);
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

  async function loadCovers() {
    try {
      const res = await fetch("covers.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      coversData = await res.json();
    } catch (e) {
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

  function coverInfo(artist, title) {
    const k1 = coverKey(artist, title);
    if (coversData[k1]) return coversData[k1];
    const k2 = normKey((artist || "") + " " + (title || ""));
    return coversData[k2] || null;
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

  function visibleTracks() {
    let list = tracks.filter((t) => !hiddenTracks.has(t.id));
    if (favOnly) list = list.filter((t) => favorites.has(t.id));
    if (!query) return list;
    const scored = [];
    for (const t of list) {
      const s = matchScore(query, t);
      if (s >= 0) scored.push({ t, s });
    }
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
    updateRestoreButton();
    toast("Brano tolto dalla lista");
  }

  function restoreHidden() {
    hiddenTracks = new Set();
    saveCurrentState();
    render();
    updateRestoreButton();
    toast("Brani ripristinati");
  }

  function updateRestoreButton() {
    $("btnRestore").hidden = hiddenTracks.size === 0;
  }

  function render() {
    const list = visibleTracks();
    playlistEl.innerHTML = "";

    const visibleAll = tracks.filter((t) => !hiddenTracks.has(t.id));
    const total = visibleAll.length;
    const mine = visibleAll.filter((t) => !t.builtin && !t.preview).length;
    const n = list.length;
    let label = profile + " · " + total + (total === 1 ? " brano" : " brani");
    if (mine) label += " (" + mine + " solo " + (mine === 1 ? "tuo" : "tuoi") + ")";
    if (favOnly || query) label = n + " di " + total + (total === 1 ? " brano" : " brani");
    $("trackCount").textContent = label;

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
      renderQueueCount();
      playById(next);
      return;
    }
    if (repeat) {
      audio.currentTime = 0;
      doPlay();
    } else {
      playById(tracks[nextIndex()].id);
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
    rebuildAudio(true);
  }

  function createAudio() {
    const a = new Audio();
    a.preload = "metadata";
    a.addEventListener("play", () => {
      syncPlayUI();
      updateMediaSession();
    });
    a.addEventListener("pause", () => {
      syncPlayUI();
      updateMediaSession();
      savePos();
    });
    a.addEventListener("ended", handleEnded);
    a.addEventListener("timeupdate", handleTime);
    a.addEventListener("loadedmetadata", handleMetadata);
    a.addEventListener("error", handleError);
    return a;
  }

  function rebuildAudio(autoplay) {
    const t = current();
    if (!t) return;
    const time = (audio && isFinite(audio.currentTime) && audio.currentTime) || 0;
    audio = createAudio();
    audio.src = t.url;
    audio.volume = 1;
    try { if (time) audio.currentTime = time; } catch (e) { /* noop */ }
    if (autoplay) doPlay();
  }

  async function doPlay() {
    if (!audio) audio = createAudio();
    try {
      audio.volume = 1;
      setPlaybackState("playing");
      await audio.play();
    } catch (e) {
      console.warn("Play bloccato, ricreo l'audio", e);
      rebuildAudio(true);
    }
  }

  /* ---------- Menu rapido (pressione lunga) ---------- */
  function renderQueueCount() {
    const el = $("quickCount");
    if (!el) return;
    el.hidden = !queue.length;
    el.textContent = queue.length ? queue.length + (queue.length === 1 ? " brano in coda" : " brani in coda") : "";
  }

  function queueTrack(id, front) {
    if (front) queue.unshift(id);
    else queue.push(id);
    renderQueueCount();
    toast(front ? "Lo suono dopo questo" : "Aggiunto in coda");
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
  const ICON_NEXT = "M6 5l9 7-9 7V5Zm10 0h2v14h-2V5Z";
  const ICON_HIDE = "M3.3 2 2 3.3l2.4 2.4C2.5 7 1.4 8.7 1 9c1.1 2.3 4 5 7 6l2 2 1.3-1.3 15.4 15.4 1.3-1.3L3.3 2ZM12 5c4.4 0 8 4 8 4-.5 1-1.6 2.4-3.1 3.5l-1.5-1.5c1-.9 1.6-1.9 1.9-2.6-.6-.8-2.6-2.4-5.3-2.4-.4 0-.8 0-1.2.1L9.6 4.9c.8-.1 1.6-.1 2.4-.1Z";
  const ICON_SHARE = "M18 16a3 3 0 0 0-2.4 1.2l-6.9-4a3 3 0 0 0 0-1.4l7-4.1A3 3 0 1 0 15 6c0 .2 0 .4.1.6l-7 4.1a3 3 0 1 0 0 6.6l6.9 4A3 3 0 1 0 18 16Z";
  const ICON_OFFLINE = "M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z";

  function openQuickMenu(t) {
    if (!t) return;
    $("quickTitle").textContent = t.title;
    const box = $("quickActions");
    box.innerHTML = "";
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
    renderQueueCount();
    $("quickPanel").hidden = false;
    syncNoScroll();
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
    if (id !== currentId) resumeAt = LS.get("mb.pos." + id, 0);
    currentId = id;
    writeProfileState(profile, { last: id, time: 0 });
    if (!audio) audio = createAudio();
    audio.src = t.url;
    audio.volume = 1;
    setHud();
    updateProgressUI(0, 0);
    const activeEl = playlistEl.querySelector(".track.active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    updateMediaSession();
    if (autoplay) await doPlay();
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
      renderQueueCount();
      playById(next);
      return;
    }
    playById(tracks[nextIndex()].id);
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
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const t = current();
    const bi = t && t.builtin ? BUILTIN[Number(t.id.replace("builtin-", ""))] : null;
    const meta = new MediaMetadata({
      title: t ? t.title : APP_NAME,
      artist: bi ? (bi.artist || APP_NAME) : (t && t.artist) || APP_NAME,
      album: APP_NAME,
      artwork: [{ src: "icon-512.png", sizes: "512x512", type: "image/png" }]
    });
    navigator.mediaSession.metadata = meta;
    const setHandler = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* noop */ }
    };
    setHandler("play", () => doPlay());
    setHandler("pause", () => { if (audio) audio.pause(); });
    setHandler("nexttrack", () => playNext());
    setHandler("previoustrack", () => playById(tracks[prevIndex()].id));
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
    return [profile, profile === DEFAULT_PROFILE ? OTHER_PROFILE : DEFAULT_PROFILE];
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
      updateRestoreButton();
      setHud();
      const last = st.last ? tracks.find((t) => t.id === st.last) : null;
      if (last) {
        currentId = last.id;
        audio.src = last.url;
        const pos = st.time || 0;
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
      !$("quickPanel").hidden;
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

  async function removeTrack(id) {
    const t = tracks.find((x) => x.id === id);
    const yes = await askConfirm("Eliminare il brano?", "«" + (t ? t.title : "") + "» verrà cancellato da questo telefono e non si potrà più recuperare.", "Elimina");
    if (!yes) return;
    try { await dbDel(id); } catch (e) { console.warn(e); }
    try { await dbDelImport(id); } catch (e) { /* noop */ }
    if (currentId === id) {
      audio.pause();
      closeLyrics();
      rebuildAudio(false);
      currentId = null;
      setHud();
    }
    await loadAll();
    toast("Brano eliminato");
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
    const term = (artist ? artist + " " : "") + stripVariants(title);
    try {
      const r = await fetch("https://itunes.apple.com/search?term=" + encodeURIComponent(term) + "&entity=song&limit=8");
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

  function parseImportText(text) {
    const out = [];
    const seen = new Set();
    const lines = String(text || "").split(/\r?\n/);
    for (const raw of lines) {
      const line = cleanLine(raw);
      if (!line || line.length < 2) continue;
      let artist = "";
      let title = line;
      const m = /^(.+?)\s+-\s+(.+)$/.exec(line);
      if (m) {
        artist = m[1].trim();
        title = m[2].trim();
      } else {
        const m2 = /^(.+?)\s{2,}(.+)$/.exec(line);
        if (m2) {
          artist = m2[1].trim();
          title = m2[2].trim();
        }
      }
      title = title.replace(/\s+/g, " ").trim();
      artist = artist.replace(/\s+/g, " ").trim();
      if (!title) continue;
      const key = normKey(artist + title);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ artist, title });
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

  async function iaQuery(query) {
    const url = IA_SEARCH + "?q=" + encodeURIComponent(query) +
      "&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=licenseurl" +
      "&rows=12&page=1&output=json";
    const res = await fetch(url);
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
    const res = await fetch(url);
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

  async function findDownload(item) {
    const cands = [];
    try {
      const a = await searchArchive(item);
      if (a) cands.push(...a);
    } catch (e) { /* noop */ }
    try {
      const c = await searchCommons(item);
      if (c) cands.push(...c);
    } catch (e) { /* noop */ }
    cands.sort((a, b) => b.score - a.score);
    const list = cands.slice(0, 5);
    return { best: list.length ? list[0] : null, list };
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

  async function startUrlDownload(item) {
    const url = item.el.url ? item.el.url.value.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      toast("Indirizzo non valido");
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

  function paintImport(item) {
    const el = item.el;
    if (!el) return;
    el.tags.innerHTML = "";
    el.actions.innerHTML = "";
    el.url = null;
    el.go = null;
    const tag = (text, cls) => {
      const s = document.createElement("span");
      s.className = "imp-tag" + (cls ? " " + cls : "");
      s.textContent = text;
      el.tags.appendChild(s);
    };
    const btn = (text, fn, disabled) => {
      const b = document.createElement("button");
      b.className = "btn-mini";
      b.textContent = text;
      b.disabled = !!disabled;
      b.addEventListener("click", fn);
      el.actions.appendChild(b);
      return b;
    };

    if (item.state === "dupe") {
      tag("già nella libreria", "dup");
    } else if (item.state === "missing") {
      tag("non disponibile", "miss");
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
    } else if (item.state === "ready") {
      tag("trovato", "ok");
    }

    if (item.state === "choose" && item.candidates.length) {
      for (const cand of item.candidates) {
        btn(cand.title + (cand.artist ? " — " + cand.artist : "") + (cand.album ? " [" + cand.album + "]" : ""), () => {
          item.meta = cand;
          item.state = "ready";
          paintImport(item);
          importItem(item);
        });
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
      btn("Importa file", () => {
        importActive = item;
        const inp = $("importAudioInput");
        inp.value = "";
        inp.click();
      });
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
  }

  function renderImports() {
    const box = $("importResults");
    box.innerHTML = "";
    $("importStep3").hidden = false;
    for (const item of importList) {
      const row = document.createElement("div");
      row.className = "imp";

      const cover = document.createElement("img");
      cover.className = "imp-cover";
      cover.alt = "";
      cover.src = (item.meta && item.meta.cover) || TRANSPARENT_PIXEL;

      const main = document.createElement("div");
      main.className = "imp-main";

      const title = document.createElement("p");
      title.className = "imp-title";
      title.textContent = item.title + (item.artist ? " — " + item.artist : "");
      main.appendChild(title);

      const sub = document.createElement("p");
      sub.className = "imp-sub";
      const bits = [];
      if (item.meta && item.meta.album) bits.push(item.meta.album);
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
    const parsed = parseImportText($("importText").value);
    if (!parsed.length) {
      toast("Non riconosco nessun brano: controlla il testo");
      return;
    }
    searching = true;
    $("btnFind").disabled = true;
    importList = parsed.map((p) => ({ title: p.title, artist: p.artist, state: "searching", meta: null, candidates: [] }));
    libKeys = libraryKeys();
    renderImports();

    const bar = $("searchBar");
    const fill = $("searchFill");
    const status = $("searchStatus");
    bar.hidden = false;
    status.hidden = false;
    fill.style.width = "0%";

    for (let i = 0; i < importList.length; i++) {
      const item = importList[i];
      if (item.removed) continue;
      status.textContent = "Cerco " + (i + 1) + "/" + importList.length + ": " + item.title;
      fill.style.width = Math.round(((i + 1) / importList.length) * 100) + "%";
      let dup = false;
      for (const k of trackKeys(item)) if (libKeys.has(k)) dup = true;
      if (dup) {
        item.state = "dupe";
      } else {
        let found = null;
        try {
          found = await findDownload(item);
        } catch (e) {
          found = null;
        }
        item.candidates = (found && found.list) || [];
        const best = found && found.best;
        if (!best) {
          item.state = "missing";
        } else if (best.strong) {
          item.state = "ready";
          item.meta = best;
        } else {
          item.state = "choose";
        }
      }
      paintImport(item);
      await new Promise((r) => setTimeout(r, 120));
    }

    const auto = importList.filter((x) => x.state === "ready").length;
    if (auto) status.textContent = "Scarico " + auto + " brani trovati...";
    await autoImportAll();

    const done = importList.filter((x) => x.state === "done").length;
    const dupes = importList.filter((x) => x.state === "dupe").length;
    const miss = importList.filter((x) => x.state === "missing").length;
    const choose = importList.filter((x) => x.state === "choose").length;
    const errs = importList.filter((x) => x.state === "error").length;
    status.textContent = "Importati " + done + " · da scegliere " + choose + " · già presenti " + dupes +
      " · non disponibili " + miss + (errs ? " · errori " + errs : "");
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
      playById(tracks[prevIndex()].id);
    }
  });

  $("btnShuffle").addEventListener("click", () => {
    shuffle = !shuffle;
    LS.set("mb.shuffle", shuffle);
    $("btnShuffle").classList.toggle("on", shuffle);
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
      const localFiles = tracks.filter((t) => t.builtin).map((t) => t.url);
      const aggiunte = mine.filter((b) => localFiles.indexOf(b.file) < 0);
      const tolte = localFiles.filter((f) => remoteFiles.indexOf(f) < 0);
      if (!aggiunte.length && !tolte.length) return;
      if (tolte.length && tolte.indexOf(audio && audio.src ? audio.src.replace(location.href, "") : "") >= 0) return;
      BUILTIN.length = 0;
      for (const b of parsed) {
        BUILTIN.push({ title: b.title, file: b.file, artist: b.artist, profile: b.profile });
      }
      await loadCovers();
      await loadAll();
      refreshCachedSongs();
      if (aggiunte.length) {
        toast((aggiunte.length === 1 ? "Nuova canzone: " : "Nuove canzoni: ") + aggiunte.map((b) => b.title).join(", ").slice(0, 60));
      }
      if (tolte.length) {
        toast(tolte.length === 1 ? "Una canzone non c'e' piu'" : tolte.length + " canzoni non ci sono piu'");
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

  $("btnRestore").addEventListener("click", restoreHidden);

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

  /* ---------- Avvio ---------- */
  (async function init() {
    audio = createAudio();
    setPlaybackState("none");
    profile = LS.get("mb.profile", DEFAULT_PROFILE) || DEFAULT_PROFILE;
    if (profile === "Fratello") profile = OTHER_PROFILE;
    profiles = LS.get("mb.profiles", [DEFAULT_PROFILE]);
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
    refreshCachedSongs();
    updateRestoreButton();
    updatePlayerHeight();
    setTimeout(updatePlayerHeight, 300);

    shuffle = LS.get("mb.shuffle", false);
    repeat = LS.get("mb.repeat", false);
    $("btnShuffle").classList.toggle("on", shuffle);
    $("btnRepeat").classList.toggle("on", repeat);

    const lastTrack = st.last ? tracks.find((t) => t.id === st.last) : null;
    if (lastTrack) {
      currentId = lastTrack.id;
      const restorePos = st.time || 0;
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
        if (!navigator.serviceWorker.controller) {
          reg.update();
        }
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
  })();
})();