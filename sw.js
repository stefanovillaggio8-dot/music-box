const CACHE = "spotifynonavraiimieisoldi-v6204";
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./lyrics.json",
  /* File minuscolo col numero di versione e di brani: serve al controllo
     veloce (il telefono lo legge ogni 20 secondi invece di scaricare 400 KB). */
  "./versione.json",
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
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-73.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-74.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-75.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-77.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-78.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-79.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-80.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-81.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-87.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-88.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-89.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-90.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-91.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-92.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-93.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-94.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-95.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-96.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-97.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-98.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-99.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-100.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-101.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-102.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-103.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-105.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-106.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-107.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-108.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-109.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-110.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-111.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-112.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-113.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-114.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-115.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-116.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-117.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-118.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-119.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-120.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-121.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-122.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-123.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-124.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-125.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-126.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-127.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-128.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-129.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-130.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-131.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-133.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-134.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-135.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-136.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-138.mp3",
];

/* PRIMA, a ogni aggiornamento, scaricavo TUTTE le canzoni (161 MB) sul
   telefono. Il telefono restavaoccupato a scaricare musica e la libreria non
   si aggiornava piu'. Ora all'aggiornamento scarico solo i file piccoli del
   sito: le canzoni restano li' e si scaricano solo quando le ascolti o
   quando premi tu "scarica per offline". */
async function cacheSongs(cache) {
  return 0;
}

/* Ste: "se tocco la versione non fa niente, non si aggiorna".
   Prima non si aggiornava perche' avevo tolto il "skipWaiting": il worker
   nuovo aspettava che l'app venisse chiusa del tutto, quindi ricaricando la
   pagina si continuava a usare la versione vecchia, e con lei i nomi dei
   brani tornavano come prima.

   Adesso e' cosi': il worker aspetta (non ti interrompe mentre usi l'app),
   ma quando TOCCI il numero della versione gli dico "attivati adesso" e la
   pagina si ricarica con tutto nuovo. */
self.addEventListener("message", (event) => {
  const tipo = (event && event.data && event.data.type) || "";
  if (tipo === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const results = await Promise.allSettled(CORE.map((url) => cache.add(url)));
      const failed = results
        .map((r, i) => (r.status === "rejected" ? CORE[i] : null))
        .filter(Boolean);
      if (failed.length) console.warn("Non memorizzate:", failed.join(", "));
      cacheSongs(cache);
      /* Ste: "l'app si aggiorna continuamente e ogni volta toglie le
         canzoni". Prima facevo "skipWaiting": la nuova versione si
         impadroniva subito della pagina aperta, anche mentre stavi usando
         l'app (e la ricaricava). Adesso l'aggiornamento aspetta: entra
         quando riapri l'app, senza mezze sorprese. */
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

const CORE_EXT = [".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".webp"];

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
      fetch(new Request(event.request.url, { cache: "reload", credentials: "same-origin" }))
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
