const CACHE = "spotifynonavraiimieisoldi-v668";
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
  "./songs/track-1.mp3",
  "./songs/track-2.mp3",
  "./songs/track-3.mp3",
  "./songs/track-4.mp3",
  "./songs/track-5.mp3",
  "./songs/track-6.mp3",
  "./songs/track-7.mp3",
  "./songs/track-8.mp3",
  "./songs/track-9.mp3",
  "./songs/track-10.mp3",
  "./songs/track-11.mp3",
  "./songs/track-12.mp3",
  "./songs/track-13.mp3",
  "./songs/track-14.mp3",
  "./songs/track-15.mp3",
  "./songs/track-16.mp3",
  "./songs/track-17.mp3",
  "./songs/track-18.mp3",
  "./songs/track-19.mp3",
  "./songs/track-20.mp3",
  "./songs/track-23.mp3",
  "./songs/track-24.mp3",
  "./songs/track-25.mp3",
  "./songs/track-26.mp3",
  "./songs/track-27.mp3",
  "./songs/track-28.mp3",
  "./songs/track-29.mp3",
  "./songs/track-30.mp3",
  "./songs/track-31.mp3",
  "./songs/track-32.mp3",
  "./songs/track-33.mp3",
  "./songs/track-34.mp3",
  "./songs/track-35.mp3",
  "./songs/track-36.mp3",
  "./songs/track-37.mp3",
  "./songs/track-38.mp3",
  "./songs/track-39.mp3",
  "./songs/track-40.mp3",
  "./songs/track-41.mp3",
  "./songs/track-42.mp3",
  "./songs/track-43.mp3",
  "./songs/track-44.mp3",
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

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const CORE_EXT = [".html", ".css", ".js", ".json", ".png"];

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
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
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
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
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
