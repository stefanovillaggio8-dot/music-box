const CACHE = "spotifynonavraiimieisoldi-v6420";
/* Le canzoni offline stanno in una cache SEPARATA dai file dell'app.
   Motivo (Ste, 20/10/2026): "ho messo 2gb e quando diego toglie la
   connessione non gli si apre l'app". Con le canzoni e i file dell'app
   nella stessa cache, quando il telefono libera spazio si porta via
   anche l'app. Cosi' i file dell'app restano al sicuro e le canzoni
   scaricate non si devono ricopiare a ogni aggiornamento (sono GB).
   Ora ogni profilo ha le sue cache: brani-<profilo>, stream-<profilo>. */
const CACHE_PREFIX = "spotifynonavraiimieisoldi";
const CACHE_BRANI = CACHE_PREFIX + "-brani";  /* deprecato: usato per migrazione vecchie cache */
function cacheBraniName(p) { return CACHE_PREFIX + "-brani-" + p; }
function cacheStreamName(p) { return CACHE_PREFIX + "-stream-" + p; }
function cachePrefetchName(p) { return CACHE_PREFIX + "-prefetch-" + p; }
function cacheInfoName() { return CACHE_PREFIX + "-info"; }

/* I brani che l'app scarica in anticipo (per far partire le canzoni subito)
   stanno in una cache a parte per profilo: non devono riempire la cache dei brani e non
   devono far fuori le download degli utenti. */
/* I brani che si suonano "al volo" stanno in una cache separata per profilo da quelli che
   l'utente ha scaricato apposta. Motivo: quando il telefono e' pieno il browser
   butta via le voci piu' vecchie, e se le due cose fossero mescolate a
   buttare via sarebbero state proprio le download dell'utente ("i download che
   faccio vengono resettati"). */

let activeProfile = "Ste";  /* profilo di default, l'app lo sovrascrive via message */
/* Ogni scheda mantiene il proprio profilo anche quando un'altra cambia account. */
const clientProfiles = new Map();
async function profileForEvent(event) {
  const id = event.clientId || (event.source && event.source.id);
  if (!id) return String((event.data && event.data.profile) || activeProfile);
  if (clientProfiles.has(id)) return clientProfiles.get(id);
  try {
    const cache = await caches.open(cacheInfoName());
    const response = await cache.match(new URL("./__profile__/" + encodeURIComponent(id), self.registration.scope).href);
    if (response) {
      const name = await response.text();
      clientProfiles.set(id, name);
      return name;
    }
  } catch (_) { }
  /* Un worker riavviato non assegna una scheda sconosciuta all'ultimo account. */
  return "";
}
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
  /* La pista silenziosa che tiene viva la sessione audio: e' un file
     vero, cosi' continua a suonare anche con la pagina congelata. */
  "./silenzio.mp3",
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
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-68.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-69.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-71.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-72.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-76.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-139.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-140.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-141.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-143.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-144.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-146.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-147.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-148.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-149.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-150.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-152.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-153.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-154.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-155.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-157.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-158.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-159.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-160.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-161.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-162.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-163.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-164.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-165.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-166.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-168.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-169.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-170.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-171.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-173.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-174.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-175.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-176.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-178.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-179.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-180.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-181.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-182.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-183.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-184.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-185.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-187.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-188.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-189.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-190.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-191.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-192.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-193.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-194.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-195.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-196.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-198.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-200.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-201.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-203.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-205.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-206.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-207.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-208.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-209.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-210.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-211.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-212.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-213.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-215.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-216.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-217.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-218.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-219.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-220.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-221.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-222.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-224.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-225.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-226.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-227.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-228.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-229.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-230.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-231.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-232.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-233.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-234.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-236.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-237.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-239.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-240.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-241.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-242.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-243.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-244.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-246.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-247.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-248.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-245.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-249.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-250.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-251.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-252.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-253.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-254.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-255.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-256.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-257.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-258.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-259.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-260.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-261.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-263.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-264.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-265.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-262.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-266.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-280.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-268.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-269.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-270.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-281.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-272.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-273.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-274.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-275.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-276.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-294.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-278.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-279.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-283.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-284.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-285.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-286.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-287.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-288.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-295.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-290.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-291.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-292.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-293.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-296.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-297.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-298.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-308.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-300.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-301.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-302.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-303.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-304.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-305.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-306.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-307.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-309.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-310.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-311.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-312.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-313.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-314.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-315.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-316.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-317.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-318.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-319.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-320.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-321.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-322.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-323.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-324.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-325.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-326.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-327.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-328.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-329.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-330.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-331.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-332.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-333.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-334.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-335.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-336.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-337.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-338.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-339.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-340.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-341.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-342.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-349.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-344.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-345.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-346.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-347.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-348.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-350.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-351.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-352.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-353.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-363.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-355.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-356.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-357.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-358.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-359.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-360.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-361.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-362.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-377.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-365.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-378.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-367.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-368.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-369.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-370.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-379.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-390.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-372.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-373.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-374.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-375.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-376.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-380.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-381.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-382.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-383.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-384.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-391.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-386.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-387.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-388.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-389.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-392.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-393.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-394.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-395.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-396.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-397.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-398.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-399.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-400.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-401.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-402.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-403.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-404.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-405.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-406.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-423.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-415.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-426.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-438.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-428.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-430.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-432.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-433.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-434.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-435.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-436.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-437.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-424.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-440.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-425.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-443.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-444.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-446.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-448.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-449.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-450.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-451.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-452.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-453.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-454.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-455.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-456.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-457.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-458.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-459.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-460.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-461.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-462.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-463.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-464.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-466.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-467.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-468.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-469.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-470.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-472.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-473.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-474.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-475.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-477.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-480.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-478.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-479.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-482.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-483.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-484.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-485.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-486.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-487.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-488.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-489.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-490.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-491.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-492.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-493.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-494.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-495.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-496.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-497.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-498.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-499.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-500.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-501.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-502.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-503.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-504.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-505.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-506.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-507.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-508.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-509.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-510.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-511.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-512.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-513.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-514.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-515.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-516.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-517.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-518.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-520.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-521.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-522.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-523.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-524.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-525.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-526.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-527.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-528.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-529.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-530.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-531.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-532.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-533.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-534.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-535.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-536.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-537.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-538.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-539.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-540.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-541.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-542.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-543.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-544.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-545.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-546.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-547.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-548.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-549.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-550.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-551.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-553.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-555.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-556.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-557.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-558.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-559.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-560.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-561.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-562.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-563.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-564.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-565.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-566.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-567.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-568.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-569.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-570.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-571.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-572.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-573.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-574.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-575.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-576.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-577.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-578.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-579.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-580.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-581.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-582.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-584.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-586.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-587.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-588.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-589.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-591.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-593.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-594.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-595.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-596.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-598.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-599.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-600.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-601.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-602.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-603.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-604.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-605.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-606.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-607.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-608.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-609.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-610.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-611.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-612.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-613.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-614.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-615.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-616.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-617.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-618.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-619.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-620.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-622.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-625.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-626.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-627.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-628.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-629.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-630.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-631.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-632.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-633.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-634.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-635.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-636.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-637.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-638.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-639.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-640.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-641.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-642.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-643.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-644.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-645.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-646.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-647.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-648.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-650.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-651.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-652.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-653.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-654.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-655.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-656.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-657.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-658.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-659.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-660.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-661.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-662.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-663.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-664.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-665.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-666.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-668.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-669.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-670.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-671.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-672.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-673.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-674.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-675.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-676.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-677.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-679.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-680.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-681.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-682.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-683.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-684.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-685.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-686.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-687.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-688.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-689.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-690.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-691.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-692.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-693.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-694.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-695.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-696.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-697.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-698.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-699.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-700.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-701.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-702.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-703.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-704.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-705.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-706.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-707.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-709.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-710.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-711.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-712.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-713.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-719.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-720.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-721.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-722.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-723.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-724.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-725.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-726.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-731.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-732.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-733.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-734.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-735.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-736.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-737.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-738.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-739.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-740.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-741.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-742.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-743.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-744.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-745.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-746.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-747.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-748.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-749.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-750.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-751.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-752.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-753.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-754.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-755.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-756.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-757.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-758.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-759.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-760.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-761.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-762.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-765.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-766.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-767.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-768.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-769.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-770.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-771.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-772.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-773.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-774.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-775.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-776.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-777.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-778.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-779.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-780.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-781.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-782.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-783.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-784.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-785.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-786.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-787.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-794.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-795.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-796.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-797.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-798.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-802.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-803.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-804.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-805.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-806.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-807.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-808.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-809.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-810.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-811.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-812.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-813.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-814.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-815.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-817.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-818.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-819.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-820.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-821.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-822.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-823.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-824.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-825.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-826.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-827.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-828.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-829.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-830.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-831.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-832.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-833.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-834.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-836.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-837.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-838.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-839.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-840.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-841.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-842.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-843.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-844.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-845.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-846.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-847.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-848.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-849.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-850.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-851.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-852.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-853.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-854.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-855.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-856.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-857.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-858.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-859.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-860.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-861.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-862.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-863.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-864.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-865.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-866.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-867.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-868.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-869.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-870.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-871.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-872.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-873.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-874.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-875.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-876.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-877.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-878.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-879.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-880.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-881.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-882.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-883.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-884.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-885.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-886.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-887.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-888.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-889.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-890.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-891.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-892.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-893.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-894.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-895.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-896.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-901.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-902.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-903.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-904.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-905.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-906.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-907.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-908.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-909.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-910.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-911.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-912.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-913.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-914.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-915.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-916.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-917.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-918.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-919.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-920.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-921.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-922.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-925.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-926.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-927.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-928.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-929.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-930.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-931.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-932.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-933.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-934.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-935.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-936.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-937.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-938.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-939.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-940.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-941.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-942.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-943.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-944.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-945.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-946.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-947.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-948.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-949.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-950.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-951.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-952.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-953.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-954.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-955.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-956.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-957.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-958.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-959.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-960.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-961.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-962.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-963.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-964.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-965.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-966.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-967.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-968.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-969.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-970.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-973.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-974.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-975.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-977.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-979.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-980.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-981.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-982.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-983.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-984.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-985.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-986.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-987.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-988.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-989.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-990.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-991.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-992.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-993.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-994.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-995.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-996.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-997.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-998.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1003.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1004.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1005.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1006.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1007.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1008.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1009.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1010.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1011.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1012.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1013.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1014.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1015.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1016.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1017.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1018.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1019.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1020.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1021.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1022.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1023.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1024.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1025.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1026.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1027.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1028.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1029.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1030.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1031.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1032.mp3",
  "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-1033.mp3",
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
  const data = (event && event.data) || {};
  const tipo = data.type || "";
  if (tipo === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (tipo === "SET_PROFILE" && data.profile) {
    activeProfile = String(data.profile);
    if (event.source && event.source.id) {
      const id = event.source.id;
      const name = activeProfile;
      clientProfiles.set(id, name);
      event.waitUntil(caches.open(cacheInfoName()).then((cache) =>
        cache.put(new URL("./__profile__/" + encodeURIComponent(id), self.registration.scope).href, new Response(name))
      ).catch(() => {}));
    }
    return;
  }
  /* Ste: "fai in modo che i download partono anche in background".
     Il worker del servizio vive un po' piu' a lungo della pagina, quindi
     e' lui che puo' portare avanti lo scaricamento anche se l'app viene
     sospesa (schermo spento). */
  if (tipo === "SCARICA" && Array.isArray(data.url)) {
    event.waitUntil(profileForEvent(event).then((name) => {
      if (name) return scaricaPerContoMio(data.url, cacheBraniName(name));
    }));
  }
});

/* Scarica una lista di brani e li mette in cache. */
async function scaricaPerContoMio(url, nomeCache) {
  try {
    const cache = await caches.open(nomeCache);
    for (const u of url) {
      try {
        const richiesta = new Request(u);
        if (await cache.match(richiesta)) continue;
        const r = await fetch(richiesta);
        if (r && r.status === 200) await cache.put(richiesta, r.clone());
      } catch (e) { /* un brano che non va non ferma gli altri */ }
    }
  } catch (e) { /* noop */ }
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
  /* Non toccare le cache per profilo: brani-<profilo>, stream-<profilo>, prefetch-<profilo>
     e la cache info. Cancelliamo solo le vecchie cache condivise (senza suffisso profilo). */
  const profileCachePattern = new RegExp("^" + CACHE_PREFIX + "-(brani|stream|prefetch)-.+$");
  const oldKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX + "-") && key !== CACHE &&
    key !== CACHE_BRANI &&
    key !== cacheInfoName() &&
    !profileCachePattern.test(key));
  const activeCache = await caches.open(CACHE);
  /* Migriamo dalla vecchia cache condivisa CACHE_BRANI verso il profilo di default "Ste" */
  const cacheBraniDefault = await caches.open(cacheBraniName("Ste"));

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
      /* Ste: "diego aveva scaricato le canzoni, ha chiuso l'app e una
         volta riaperta doveva di nuovo scaricarle".

         Motivo: qui migravo solo i brani con l'indirizzo di
         raw.githubusercontent. Ma dal computer e da tailscale i brani hanno
         un indirizzo LOCALE (http://100.x:8788/app/songs/...), e quelli
         non venivano migrati: all'aggiornamento la cache vecchia veniva
         cancellata e le canzoni scaricate andavano perse.

         Adesso migro QUALSIASI file audio, da qualunque indirizzo. */
      const eBrano = /\.mp3$/i.test(url.pathname) || isMusicBoxSong(url);
      if (!eBrano) continue;

      const cacheKey = new Request(url.href);
      if (await cacheBraniDefault.match(cacheKey)) continue;

      const response = await oldCache.match(request);
      if (!response) continue;
      try {
        /* le canzoni migrate vanno nella cache delle canzoni del profilo di default */
        await cacheBraniDefault.put(cacheKey, response.clone());
        if (!(await cacheBraniDefault.match(cacheKey))) safeToDelete = false;
      } catch (error) {
        console.warn("Non riesco a migrare una canzone offline; conservo la vecchia cache.", error);
        safeToDelete = false;
      }
    }

    if (safeToDelete) removable.push(key);
  }

  await Promise.all(removable.map((key) => caches.delete(key)));
}

/* Ste: quando l'app si aggiorna, le canzoni che ha in cache possono essere
   vecchie (per esempio la versione potenziata precedente). L'app chiede
   allora di svuotarle, cosi' la prossima canzone arriva nuova. */
self.addEventListener("message", (event) => {
  const dati = event && event.data ? event.data : null;
  if (!dati || dati.type !== "SVUOTA-CANZONI") return;
  event.waitUntil(
    profileForEvent(event).then((name) => name ? Promise.all([
      caches.delete(cacheStreamName(name)),
      caches.delete(cachePrefetchName(name))
    ]) : undefined).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  /* I brani scaricati in anticipo stanno in una cache a parte per profilo e non devono
     accumularsi: a ogni nuova versione la svuoto (cosi' il telefono non si
     riempie e non si scarica 100 MB di file in una volta). */
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith(CACHE_PREFIX + "-prefetch-")).map(k => caches.delete(k))
    ).catch(() => {}))
  );
  event.waitUntil(
    migrateOfflineSongsAndCleanup().catch((error) => {
      /* In caso di problema, meglio conservare i dati delle versioni precedenti. */
      console.warn("Migrazione cache non completata; conservo le cache precedenti.", error);
    }).then(() => self.clients.claim())
  );
});

const CORE_EXT = [".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".webp"];

/* Ste: "quando diego toglie la connessione non gli si apre l'app".
   Se il telefono e' offline e i file dell'app non sono piu' in cache
   (il telefono ha liberato spazio), invece della pagina di errore del
   browser ne mostro una che spiega cosa fare. */
const PAGINA_SENZA_RETE = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Music Box - senza connessione</title><style>
body{background:#0f0f14;color:#e8e8f0;font:16px/1.5 system-ui,-apple-system,sans-serif;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center}
div{max-width:420px}h1{font-size:20px;margin:0 0 10px}p{color:#a9b0c0;margin:0 0 18px}
button{background:#3a2410;border:1px solid #7a4a1c;color:#ffcf9f;padding:12px 20px;border-radius:10px;
font:inherit;font-size:15px;cursor:pointer}
</style></head><body><div>
<h1>Sei senza connessione</h1>
<p>L'app non era ancora stata salvata su questo telefono, quindi adesso
non si puo' aprire. Collegati a una rete e riapri: dopo si aprira' anche
senza connessione.</p>
<button onclick="location.reload()">Riprova</button>
</div></body></html>`;

async function findCachedMusic(url, profile) {
  const allowed = new Set([CACHE_BRANI, CACHE]);
  if (profile) {
    allowed.add(cacheBraniName(profile));
    allowed.add(cacheStreamName(profile));
    allowed.add(cachePrefetchName(profile));
  }
  const keys = (await caches.keys()).filter((key) => allowed.has(key)).slice().reverse();
  for (const key of keys) {
    try {
      const cache = await caches.open(key);
      const response = await cache.match(new Request(url));
      if (response && response.status === 200) return response;
    } catch (_) { /* provo la cache successiva */ }
  }
  return null;
}

/* Se il brano e' gia' salvato, lo uso subito: e' quello che rende
     istantaneo lo spostamento dentro la canzone. */
async function rispostaDallaCache(cached, range) {
  if (!range) return cached;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return cached;
  const blob = await cached.blob();
  const size = blob.size;
  let start;
  let end;
  if (!match[1]) {
    start = Math.max(0, size - Number(match[2]));
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

let _ultimaRivalidazione = 0;
const _CHIAVE_RIVALIDAZIONE = "ultima-rivalidazione";
async function _leggiUltimaRivalidazione() {
  try {
    const c = await caches.open("spotifynonavraiimieisoldi-info");
    const r = await c.match(_CHIAVE_RIVALIDAZIONE);
    if (!r) return 0;
    return Number(await r.text()) || 0;
  } catch (e) { return 0; }
}
async function _rivalidaBrano(url, profile) {
  /* Prendo la versione nuova del file e la metto in cache. Lo faccio al massimo
     una volta all'ora: sono file di qualche MB e non voglio scaricarli a ogni
     ascolto. */
  try {
    const ora = Date.now();
    if (ora - _ultimaRivalidazione < 300000) return;
    _ultimaRivalidazione = ora;
    try {
      const c = await caches.open(cacheInfoName());
      await c.put(_CHIAVE_RIVALIDAZIONE, new Response(String(ora)));
    } catch (e) { }
    const res = await fetch(url, { cache: "no-store" });
    if (!res || res.status !== 200) return;
    if (!profile) return;
    const cache = await caches.open(cacheStreamName(profile));
    await cache.put(new Request(url), res.clone());
  } catch (e) { /* pazienza: la prossima volta si riprova */ }
}

async function cachedMusicResponse(event) {
  const profile = await profileForEvent(event);
  const range = event.request.headers.get("range");
  const gia = await findCachedMusic(event.request.url, profile);
  /* Brano gia' in mano: lo uso subito, senza aspettare la rete. */
  if (gia) {
    try {
      /* Lo servo subito (cosi' parte all'istante) e intanto vado a prendere
         la versione nuova del file: e' cosi' che le canzoni potenziate si
         aggiornano (Ste: "sembra che non sia cambiato niente coi boost").
         Solo i file potenziati si controllano, e non piu' di una volta
         all'ora: gli altri non cambiano mai. */
      if (!range && /\/bassi\//.test(event.request.url)) {
        try { event.waitUntil(_rivalidaBrano(event.request.url, profile)); } catch (e) { }
      }
      return await rispostaDallaCache(gia, range);
    } catch (e) { /* se non riesco, vado in rete */ }
  }
  try {
    const response = await fetch(event.request);
    /* Salvo solo risposte complete (200), mai un pezzo audio (206). */
    if (profile && response && response.status === 200 && !range && response.type !== "opaque") {
      event.waitUntil(
        caches.open(cacheStreamName(profile)).then((cache) => cache.put(new Request(event.request.url), response.clone()))
          .catch(() => {})
      );
    }
    return response;
  } catch (error) {
    if (!gia) {
      return new Response("Brano non disponibile offline", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return await rispostaDallaCache(gia, range);
  }
}


self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  /* Le canzoni sono ospitate su raw.githubusercontent.com, fuori dall'origine
     della pagina: prima venivano escluse e quindi le copie offline non suonavano. */
  /* Ste: "si scaricano ma non partono senza connessione".
     Prima il worker metteva in cache (e serviva da li') solo le canzoni che
     arrivano da GitHub. Ma dal link di casa e da tailscale i brani arrivano
     dal computer di casa, e quelli non finivano mai in cache: scaricati si',
     ma senza rete non suonavano.
     Adesso vale per ogni canzone (.mp3), da qualunque origine. */
  if (isMusicBoxSong(url) || (url.origin === self.location.origin && /\.mp3$/i.test(url.pathname))) {
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
        .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html"))
          .then((r) => r || new Response(PAGINA_SENZA_RETE, {
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
          })))
    );
    return;
  }

  const isCore = CORE_EXT.some((ext) => url.pathname.endsWith(ext));

  /* Due file devono restare SEMPRE freschi:
     - versione.json: con questo l'app controlla se c'e' una versione
       nuova. Servito dalla cache, l'app non vedrebbe mai l'aggiornamento.
     - stato.json: e' il fallback quando il worker non risponde, e deve
       dire le eliminazioni e le playlist giuste. */
  const sempreFresco = /versione\.json$|stato\.json$/.test(url.pathname);

  if (isCore && !sempreFresco) {
    /* Ste: "ci sta un sacco di tempo a caricare".
       Prima questi file (app.js 622 KB, lyrics.json 1,7 MB, copertine 130 KB)
       venivano presi PRIMA dalla rete: quasi 2,5 MB a ogni avvio, e l'app
       restava ad aspettare. Adesso si servono dalla CACHE (l'app parte
       subito) e in secondo piano si aggiornano: la copia nuova arriva la
       volta dopo, senza far aspettare nessuno.
       L'aggiornamento dell'app resta garantito dal controllo della versione
       che c'e' dentro l'app (versione.json). */
    /* IMPORTANTISSIMO: event.waitUntil() si puo' chiamare SOLO mentre
       l'evento e' ancora aperto. Prima stava dentro la catena di
       promise (quindi dopo che l'evento era finito): Chrome lo rifiuta e
       la richiesta muore. Per le copertine voleva dire "immagine rotta"
       (Ste, 20/10/2026: "sono scomparse tutte le copertine").
       E la catena non deve mai rigettare: altrimenti il browser riceve
       un errore di rete invece della risposta. */
    const cache = caches.open(CACHE);
    /* NB: "c" (la cache) resta dentro la sua catena, altrimenti non e'
       definito e la promise rigetta (e ogni file diventa un 504). */
    const lavoro = cache.then((c) => c.match(event.request).then((cached) => {
      if (cached) {
        /* Se il file in cache e' ROTTO (un download interrotto), non lo uso:
           l'app non partirebbe (schermata vuota, pulsanti senza icona).
           Ste: ha mandato la foto dell'app vuota e pensava che la libreria
           fosse sparita. */
        let intero = true;
        try {
          if (cached.status !== 200 || !cached.ok) intero = false;
          else {
            const lung = Number(cached.headers.get("content-length") || 0);
            if (lung && lung < 200) intero = false;
          }
        } catch (e) { intero = false; }
        if (!intero) {
          try { c.delete(event.request).catch(() => { }); } catch (e) { }
          /* e vado a prenderlo dalla rete */
          return fetch(new Request(event.request.url, { cache: "reload", credentials: "same-origin" }))
            .then((response) => {
              if (response && response.status === 200) {
                const clone = response.clone();
                c.put(event.request, clone).catch(() => {});
              }
              return response;
            })
            .catch((e) => new Response("", { status: 504 }));
        }
        /* in secondo piano: controllo se online c'e' qualcosa di nuovo */
        fetch(new Request(event.request.url, { cache: "reload", credentials: "same-origin" }))
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              return c.put(event.request, clone).catch(() => {});
            }
          })
          .catch(() => { /* niente rete: tengo quella che ho */ });
        return cached;
      }
      /* non l'ho mai preso: vado a prenderlo dalla rete */
      return fetch(new Request(event.request.url, { cache: "reload", credentials: "same-origin" }))
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            c.put(event.request, clone).catch(() => {});
          }
          return response;
        })
        .catch((e) => caches.match(event.request).then((r) => r || new Response("", { status: 504 })));
    }));
    event.respondWith(lavoro);
    event.waitUntil(lavoro.catch(() => { }));
    return;
  } else if (isCore) {
    /* versione.json e stato.json: sempre dalla rete, e la copia la
       metto in cache per dopo. */
    const cache2 = caches.open(CACHE);
    const lavoro2 = fetch(new Request(event.request.url, { cache: "reload", credentials: "same-origin" }))
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          cache2.then((c) => c.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch((e) => caches.match(event.request).then((r) => r || new Response("ERRORE SW: " + (e && (e.message || e)), { status: 504 })));
    event.respondWith(lavoro2);
    event.waitUntil(lavoro2.catch(() => { }));
    return;
  } else {
    const lavoro3 = caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => new Response("", { status: 504 }));
    });
    event.respondWith(lavoro3);
    event.waitUntil(lavoro3.catch(() => { }));
    return;
  }
});
