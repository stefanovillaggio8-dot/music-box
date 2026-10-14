const CACHE = "spotifynonavraiimieisoldi-v6167";
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./lyrics.json",
  "./covers.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];
const SONGS = [
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-2.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-4.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-5.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-6.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-7.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-8.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-9.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-10.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-11.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-12.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-13.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-14.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-15.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-16.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-17.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-18.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-19.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-20.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-23.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-24.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-25.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-26.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-27.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-28.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-29.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-30.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-31.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-32.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-33.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-34.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-35.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-36.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-37.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-38.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-39.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-40.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-41.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-42.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-43.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-44.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-45.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-46.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-47.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-48.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-49.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-50.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-51.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-52.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-53.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-54.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-55.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-56.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-57.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-58.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-59.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-60.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-61.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-62.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-63.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-64.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-65.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-66.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-67.mp3",
];

/* PRIMA, a ogni aggiornamento, scaricavo TUTTE le canzoni (161 MB) sul
   telefono. Il telefono restavaoccupato a scaricare musica e la libreria non
   si aggiornava piu'. Ora all'aggiornamento scarico solo i file piccoli del
   sito: le canzoni restano li' e si scaricano solo quando le ascolti o
   quando premi tu "scarica per offline". */
async function cacheSongs(cache) {
  return 0;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const results = await Promise.allSettled(CORE.map((url) => cache.add(url)));
      const failed = results
        .map((r, i) => (r.status === "rejected" ? CORE[i] : null))
        .filter(Boolean);
      if (failed.length) console.warn("Non memorizzate:", failed.join(", "));
      cacheSongs(cache);
      await self.skipWaiting();
    })
  );
});

function isMusicBoxSong(url) {
  return url.hostname === "raw.githubusercontent.com" &&
    url.pathname.startsWith("/stefanovillaggio8-dot/music-box-brani/main/songs/") &&
    /\.mp3$/i.test(url.pathname);
}

async function migrateOfflineSongsAndCleanup() {
  const keys = await caches.keys();
  const oldKeys = keys.filter((key) => key !== CACHE);
  const activeCache = await caches.open(CACHE);

  /* Prima di eliminare vecchie cache, controllo che la versione nuova contenga
     tutti i file essenziali. Se l'installazione e' incompleta, non elimino nulla. */
  const coreReady = await Promise.all(CORE.map(async (file) => {
    try {
      return !!(await activeCache.match(new URL(file, self.registration.scope).href));
    } catch (_) {
      return false;
    }
  }));
  if (!coreReady.every(Boolean)) {
    console.warn("Cache nuova incompleta: conservo le cache precedenti.");
    return;
  }

  const removable = [];
  for (const key of oldKeys) {
    const oldCache = await caches.open(key);
    let safeToDelete = true;
    const requests = await oldCache.keys();

    for (const request of requests) {
      let url;
      try { url = new URL(request.url); } catch (_) { continue; }
      if (!isMusicBoxSong(url)) continue;

      const cacheKey = new Request(url.href);
      if (await activeCache.match(cacheKey)) continue;

      const response = await oldCache.match(request);
      if (!response) continue;
      try {
        await activeCache.put(cacheKey, response.clone());
        if (!(await activeCache.match(cacheKey))) safeToDelete = false;
      } catch (error) {
        console.warn("Non riesco a migrare una canzone offline; conservo la vecchia cache.", error);
        safeToDelete = false;
      }
    }

    if (safeToDelete) removable.push(key);
  }

  await Promise.all(removable.map((key) => caches.delete(key)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    migrateOfflineSongsAndCleanup().catch((error) => {
      /* In caso di problema, meglio conservare i dati delle versioni precedenti. */
      console.warn("Migrazione cache non completata; conservo le cache precedenti.", error);
    }).then(() => self.clients.claim())
  );
});

const CORE_EXT = [".html", ".css", ".js", ".json", ".png"];

async function findCachedMusic(url) {
  const keys = (await caches.keys()).slice().reverse();
  for (const key of keys) {
    try {
      const cache = await caches.open(key);
      const response = await cache.match(new Request(url));
      if (response) return response;
    } catch (_) { /* provo la cache successiva */ }
  }
  return null;
}

async function cachedMusicResponse(event) {
  try {
    const response = await fetch(event.request);
    /* Memorizzo solo risposte complete (200), mai un frammento audio 206. */
    if (response && response.status === 200 && !event.request.headers.has("range") && response.type !== "opaque") {
      event.waitUntil(
        caches.open(CACHE).then((cache) => cache.put(new Request(event.request.url), response.clone()))
          .catch(() => {})
      );
    }
    return response;
  } catch (error) {
    const cached = await findCachedMusic(event.request.url);
    if (!cached) {
      return new Response("Brano non disponibile offline", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const range = event.request.headers.get("range");
    if (!range) return cached;

    /* Safari/WKWebView puo' chiedere solo una parte del file (Range). La cache
       contiene il brano intero: ricostruisco una risposta 206 valida per iOS. */
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if (!match || (!match[1] && !match[2])) return cached;
    const blob = await cached.blob();
    const size = blob.size;
    let start;
    let end;
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      start = Math.max(0, size - suffixLength);
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || end < start) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": "bytes */" + size }
      });
    }
    const part = blob.slice(start, end + 1, blob.type || "audio/mpeg");
    return new Response(part, {
      status: 206,
      headers: {
        "Content-Type": blob.type || "audio/mpeg",
        "Content-Length": String(part.size),
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Accept-Ranges": "bytes"
      }
    });
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  /* Le canzoni sono ospitate su raw.githubusercontent.com, fuori dall'origine
     della pagina: prima venivano escluse e quindi le copie offline non suonavano. */
  if (isMusicBoxSong(url)) {
    event.respondWith(cachedMusicResponse(event));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {})
            );
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  const isCore = CORE_EXT.some((ext) => url.pathname.endsWith(ext));

  if (isCore) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {})
            );
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {})
            );
          }
          return response;
        });
      })
    );
  }
});
