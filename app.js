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
    { title: "Tony Boy - Victoria", file: "songs/track-13.mp3", artist: "Tony Boy" }
  ];

  const PALETTE = [
    "linear-gradient(135deg,#b06bff,#4fc3ff)",
    "linear-gradient(135deg,#ff7a9e,#ffb86b)",
    "linear-gradient(135deg,#37e6a6,#4fc3ff)",
    "linear-gradient(135deg,#ffb02e,#ff5c7a)"
  ];

  const $ = (id) => document.getElementById(id);
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
  let scrubbing = false;
  let pendingSeek = null;
  let lastSave = 0;
  let swReg = null;

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

  let db = null;
  const DB_NAME = "musicbox";
  const DB_STORE = "tracks";

  /* ---------- IndexedDB ---------- */
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DB_STORE)) {
          req.result.createObjectStore(DB_STORE, { keyPath: "id" });
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

  /* ---------- Caricamento tracce ---------- */
  async function loadBuiltinFile(file) {
    const res = await fetch(file);
    if (!res.ok) throw new Error("HTTP " + res.status + " " + file);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async function loadAll() {
    const builtin = [];
    for (let i = 0; i < BUILTIN.length; i++) {
      const b = BUILTIN[i];
      try {
        const url = await loadBuiltinFile(b.file);
        builtin.push({
          id: "builtin-" + i,
          title: b.title,
          artist: b.artist || "",
          url,
          builtin: true,
          gradient: PALETTE[i % PALETTE.length],
          size: null
        });
      } catch (e) {
        console.warn("Salta " + b.file, e);
      }
    }

    let added = [];
    try {
      const records = await dbAll();
      added = records.map((r) => ({
        id: r.id,
        title: r.title,
        artist: "",
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

  function hashId(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  /* ---------- Rendering ---------- */
  function filterText(t) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function visibleTracks() {
    let list = tracks;
    if (favOnly) list = list.filter((t) => favorites.has(t.id));
    if (!query) return list;
    const q = filterText(query);
    return list.filter((t) => filterText(t.title + " " + t.artist).includes(q));
  }

  function render() {
    const list = visibleTracks();
    playlistEl.innerHTML = "";

    const total = tracks.length;
    const n = list.length;
    $("trackCount").textContent = (favOnly || query)
      ? n + " di " + total + (total === 1 ? " brano" : " brani")
      : total + (total === 1 ? " brano" : " brani");

    if (!list.length) {
      emptyEl.hidden = false;
      emptyEl.textContent = !total
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

      const art = document.createElement("div");
      art.className = "track-art";
      art.style.background = t.gradient;

      const info = document.createElement("div");
      info.className = "track-info";
      const title = document.createElement("div");
      title.className = "track-title";
      title.textContent = t.title;
      if (t.builtin) {
        const badge = document.createElement("span");
        badge.className = "track-badge";
        badge.textContent = "incl";
        title.appendChild(badge);
      }
      info.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "track-meta";
      meta.textContent = t.builtin ? (t.artist || "incluso") : "aggiunta";
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
        LS.set("mb.favs", Array.from(favorites));
        render();
      });
      li.appendChild(favBtn);

      if (!t.builtin) {
        const del = document.createElement("button");
        del.className = "track-del";
        del.setAttribute("aria-label", "Elimina " + t.title);
        del.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h.3l.9 12.2A3 3 0 0 0 9.2 22h5.6a3 3 0 0 0 3-2.8L18.7 7H19a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm4 2v1h-2V5h2Zm-3.7 5.5a1 1 0 0 1 1.9.3l-.4 7a1 1 0 1 1-1.9-.3l.4-7Zm5.9.3a1 1 0 1 1 1.9-.3l-.4 7a1 1 0 1 1-1.9.3l.4-7Z"/></svg>';
        del.addEventListener("click", () => removeTrack(t.id));
        li.appendChild(del);
      }

      li.addEventListener("click", () => playById(t.id));
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
      LS.set("mb.pos." + currentId, Math.floor(audio.currentTime));
      LS.set("mb.last", currentId);
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
      const d = audio.duration || 0;
      updateProgressUI(t, d);
      maybeSavePos();
    }
    syncPlayUI();
  }

  function handleMetadata() {
    updateProgressUI(audio.currentTime || 0, audio.duration || 0);
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

  /* ---------- Player ---------- */
  function current() {
    return tracks.find((t) => t.id === currentId) || null;
  }

  function setHud() {
    const t = current();
    $("playerArt").style.background = t ? t.gradient : "linear-gradient(135deg,#333,#222)";
    $("hudArt").style.background = t ? t.gradient : "linear-gradient(135deg,#333,#222)";
    $("playerTitle").textContent = t ? t.title : "—";
    $("hudTitle").textContent = t ? t.title : "Nessuna traccia";
    $("hudSub").textContent = t ? (t.builtin && lyricsData[t.id] ? "Testo disponibile" : t.builtin ? "Brano incluso" : "Brano aggiunto") : "Aggiungi musica per iniziare";
    updateLyricsButton();
    render();
  }

  function updateLyricsButton() {
    $("btnLyrics").hidden = !currentLyrics();
  }

  function currentLyrics() {
    if (!currentId || !lyricsData[currentId] || !lyricsData[currentId].text) return null;
    return lyricsData[currentId];
  }

  async function playById(id, autoplay = true) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    currentId = id;
    LS.set("mb.last", id);
    LS.set("mb.pos." + id, 0);
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

  async function togglePlay() {
    if (!currentId && tracks.length) await playById(tracks[0].id);
    if (audio.paused) await doPlay();
    else audio.pause();
  }

  function syncPlayUI() {
    if (!audio) return;
    $("iconPlay").hidden = !audio.paused;
    $("iconPause").hidden = audio.paused;
    setPlaybackState(audio.paused ? "paused" : "playing");
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const t = current();
    const bi = t && t.builtin ? BUILTIN[Number(t.id.replace("builtin-", ""))] : null;
    const meta = new MediaMetadata({
      title: t ? t.title : "MusicBox",
      artist: bi ? (bi.artist || "MusicBox") : (t && t.artist) || "MusicBox",
      album: "MusicBox",
      artwork: [{ src: "icon-512.png", sizes: "512x512", type: "image/png" }]
    });
    navigator.mediaSession.metadata = meta;
    const setHandler = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* noop */ }
    };
    setHandler("play", () => doPlay());
    setHandler("pause", () => { if (audio) audio.pause(); });
    setHandler("nexttrack", () => playById(tracks[nextIndex()].id));
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

  function seekBy(delta) {
    if (!audio || !isFinite(audio.duration)) return;
    const t = Math.min(audio.duration, Math.max(0, (audio.currentTime || 0) + delta));
    audio.currentTime = t;
    updateProgressUI(t, audio.duration);
    savePos();
  }

  /* ---------- Testi ---------- */
  function openLyrics() {
    const l = currentLyrics();
    if (!l) return;
    $("lyricsTitle").textContent = l.title;
    $("lyricsSub").textContent = l.artist || "";
    const body = $("lyricsBody");
    body.innerHTML = "";
    l.text.split("\n").forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      const trim = line.trim();
      if (/^\[.*\]$/.test(trim)) p.className = "lyr-sec";
      else if (!trim) p.className = "lyr-gap";
      body.appendChild(p);
    });
    $("lyricsPanel").hidden = false;
    document.body.classList.add("no-scroll");
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
      toast(ok === 1 ? "1 brano aggiunto" : ok + " brani aggiunti");
      await loadAll();
    }
    if (errors.length) toast("Errore con: " + errors.slice(0, 2).join(", "));
  }

  async function removeTrack(id) {
    try { await dbDel(id); } catch (e) { console.warn(e); }
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
  $("btnNext").addEventListener("click", () => playById(tracks[nextIndex()].id));
  $("btnPrev").addEventListener("click", () => {
    if (audio.duration && audio.currentTime > 3) {
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

  $("fab").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = "";
  });

  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim();
    render();
  });

  $("btnRefresh").addEventListener("click", () => {
    toast("Aggiorno...");
    setTimeout(() => window.location.reload(), 350);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (audio) {
        syncPlayUI();
        updateMediaSession();
      }
      if (swReg) swReg.update().catch(() => {});
    }
    savePos();
  });
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
    try {
      db = await openDB();
    } catch (e) {
      console.warn("DB offline su questo browser", e);
      db = null;
    }
    await loadLyrics();
    await loadAll();
    updatePlayerHeight();
    setTimeout(updatePlayerHeight, 300);

    shuffle = LS.get("mb.shuffle", false);
    repeat = LS.get("mb.repeat", false);
    favorites = new Set(LS.get("mb.favs", []));
    $("btnShuffle").classList.toggle("on", shuffle);
    $("btnRepeat").classList.toggle("on", repeat);

    const lastId = LS.get("mb.last", null);
    const lastTrack = lastId ? tracks.find((t) => t.id === lastId) : null;
    if (lastTrack) {
      currentId = lastTrack.id;
      const restorePos = LS.get("mb.pos." + lastId, 0);
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
      navigator.serviceWorker.register("sw.js").then((reg) => {
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