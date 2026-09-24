const CACHE = "spotifynonavraiimieisoldi-v18";
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
];

async function cacheSongs(cache) {
  for (const url of SONGS) {
    try {
      const hit = await cache.match(url);
      if (!hit) await cache.add(url);
    } catch (e) {
      /* il brano si scarica alla prima riproduzione */
    }
  }
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
