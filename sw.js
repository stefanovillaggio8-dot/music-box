const CACHE = "musicbox-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./lyrics.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
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
  "./songs/track-13.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
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