"use strict";

(function () {
  const BUILTIN = [
    { title: "BLANCO - SOTTOGONNA", file: "songs/track-1.mp3" },
    { title: "Madame - QUANTO FORTE TI PENSAVO", file: "songs/track-2.mp3" },
    { title: "Poter scegliere - Nayt (Live)", file: "songs/track-3.mp3" },
    { title: "Sono Ok", file: "songs/track-4.mp3" }
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

  const audio = new Audio();
  audio.preload = "metadata";

  let tracks = [];      // [{ id, title, url, builtin, gradient, blob? }]
  let currentId = null;
  let shuffle = false;
  let repeat = false;
  let query = "";

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

  function hashId(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  /* ---------- Rendering ---------- */
  function fmtSize(bytes) {
    if (!bytes) return "";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function filterText(t) {
    return t.toLowerCase();
  }

  function visibleTracks() {
    if (!query) return tracks;
    const q = filterText(query);
    return tracks.filter((t) => filterText(t.title).includes(q));
  }

  function render() {
    const list = visibleTracks();
    playlistEl.innerHTML = "";

    if (!list.length) {
      emptyEl.hidden = false;
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
      meta.textContent = t.builtin ? fmtSize(t.size) : "aggiunta";
      info.appendChild(meta);

      li.appendChild(art);
      li.appendChild(info);

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
    $("hudSub").textContent = t ? (t.builtin ? "Brano incluso" : "Brano aggiunto") : "Aggiungi musica per iniziare";
    render();
  }

  async function playById(id, autoplay = true) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    currentId = id;
    audio.src = t.url;
    setHud();
    if (autoplay) {
      try { await audio.play(); } catch (e) { console.warn("Play bloccato", e); }
    }
  }

  function nextIndex() {
    if (shuffle && tracks.length > 1) {
      let n = Math.floor(Math.random() * tracks.length);
      const cur = tracks.findIndex((x) => x.id === currentId);
      if (cur >= 0 && tracks.length > 1) {
        while (n === cur) n = Math.floor(Math.random() * tracks.length);
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

  function togglePlay() {
    if (!currentId && tracks.length) playById(tracks[0].id);
    if (audio.paused) audio.play();
    else audio.pause();
  }

  function syncPlayUI() {
    $("iconPlay").hidden = !audio.paused;
    $("iconPause").hidden = audio.paused;
  }

  function clampProgress(e) {
    const bar = $("playerProgress");
    const rect = bar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.touches ? e.touches[0].clientX : e.clientX) - rect.left) / rect.width);
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const t = current();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t ? t.title : "MusicBox",
      artist: "MusicBox",
      album: ""
    });
    const setHandler = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* noop */ }
    };
    setHandler("play", () => audio.play());
    setHandler("pause", () => audio.pause());
    setHandler("nexttrack", () => playById(tracks[nextIndex()].id));
    setHandler("previoustrack", () => playById(tracks[prevIndex()].id));
    setHandler("seekto", (d) => { if (d.seekTime != null) audio.currentTime = d.seekTime; });
  }

  /* ---------- Aggiunta / rimozione ---------- */
  async function addFiles(fileList) {
    let ok = 0;
    const errors = [];
    for (const file of Array.from(fileList)) {
      const blob = file;
      const rec = {
        id: "u-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        title: file.name.replace(/\.[^.]+$/, ""),
        blob,
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
      audio.removeAttribute("src");
      audio.load();
      currentId = null;
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

  /* ---------- Eventi ---------- */
  audio.addEventListener("play", syncPlayUI);
  audio.addEventListener("pause", syncPlayUI);

  audio.addEventListener("ended", () => {
    if (repeat) {
      audio.currentTime = 0;
      audio.play();
    } else {
      playById(tracks[nextIndex()].id);
    }
  });

  audio.addEventListener("timeupdate", () => {
    const t = audio.currentTime;
    const d = audio.duration || 0;
    const fill = $("playerProgress").querySelector(".fill");
    fill.style.width = (d ? (t / d) * 100 : 0) + "%";
    if (!audio.paused) {
      $("curTime").textContent = fmtTime(t);
      $("totTime").textContent = d ? fmtTime(d) : "0:00";
    }
    syncPlayUI();
  });

  audio.addEventListener("loadedmetadata", () => {
    $("totTime").textContent = fmtTime(audio.duration || 0);
  });

  function fmtTime(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  }

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
    $("btnShuffle").classList.toggle("on", shuffle);
  });
  $("btnRepeat").addEventListener("click", () => {
    repeat = !repeat;
    $("btnRepeat").classList.toggle("on", repeat);
  });

  $("playerProgress").addEventListener("click", (e) => {
    if (!audio.duration) return;
    audio.currentTime = clampProgress(e) * audio.duration;
  });
  $("playerProgress").addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

  $("fab").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = "";
  });

  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim();
    render();
  });

  /* ---------- Avvio ---------- */
  (async function init() {
    try {
      db = await openDB();
    } catch (e) {
      console.warn("DB offline su questo browser", e);
      db = null;
    }
    await loadAll();
    updateMediaSession();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").then((reg) => {
        console.log("SW registrato", reg);
      }).catch((err) => console.warn("SW fallito", err));
    }
  })();
})();