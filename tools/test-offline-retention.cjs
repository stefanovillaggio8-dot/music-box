"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const app=fs.readFileSync("app.js","utf8"),sw=fs.readFileSync("sw.js","utf8");
const section=(code,a,b)=>{const i=code.indexOf(a),j=code.indexOf(b,i+a.length);assert(i>=0&&j>i,"Missing "+a);return code.slice(i,j)};
const refresh=section(app,'  async function _aggiornaMusicBoxDaVersione() {','  let offlineBusy = false;');
assert(refresh.includes('$("btnRefresh").addEventListener("click", _aggiornaMusicBoxDaVersione);'),"Refresh button is not bound to updater");
assert(refresh.includes('navigator.serviceWorker.getRegistration()')&&refresh.includes('reg.update()'),"Refresh must request new service worker without blocking playback");
assert(refresh.includes('url.searchParams.set("forza"')&&refresh.includes('window.location.assign(url.href)'),"Refresh must navigate to the latest app with a fresh URL");
assert(!refresh.includes("caches.delete(")&&!refresh.includes(".unregister(")&&
 !refresh.includes("indexedDB.deleteDatabase(")&&!refresh.includes('"SVUOTA-CANZONI"'),
 "Manual refresh must not delete downloaded audio, caches or databases");
const auto=section(app,"  async function _scaricaDaSolaSeServe(brano) {","  let _avvisoTetto = false;");
assert(auto.includes("const cache = await streamCache();"),"Automatic audio must be temporary");
assert(!auto.includes("_liberaCanzoniVecchie("),"Auto may not remove manually saved MP3s");
const space=section(app,"async function _tieniSpazioSottoIlTetto() {","let _playlistInvioUltimo");
assert(!space.includes("miei.delete("),"Quota cleanup removed downloaded MP3s");
const scan=section(app,"  async function scanOffline() {","  /* Ste: \"nelle canzoni nuove",);
assert(scan.includes("cachedSongs = await _elencoOfflineDelProfilo()"),"Offline panel did not refresh cache list");
assert(scan.includes("isCached(t)"),"Offline panel and library disagree");
const match=section(app,"  function _chiaveFileOffline(url) {","  async function fetchToCache(");
const ctx={location:{href:"https://site.github.io/music-box/"},URL,Set};
vm.runInNewContext(match+"\nthis.key=_chiaveFileOffline;",ctx);
assert.equal(ctx.key("https://raw.githubusercontent.com/a/b/main/songs/track-99.mp3"),"musicbox:track-99.mp3");
assert.equal(ctx.key("http://192.168.1.40:8788/app/songs/track-99.mp3"),"musicbox:track-99.mp3");
assert.equal(ctx.key("http://a/songs/bassi/track-99.mp3"),"");
assert(match.includes("cacheBraniName(),cacheStreamName()"),"Profile cache support missing");
assert(!match.includes("cachePrefetchName()"),"Do not mark ephemeral prefetch as downloaded");
assert(sw.includes("oldSong[1].toLowerCase() === song[1].toLowerCase()"),"Worker lacks host-alias cache lookup");
const media=section(app,"  function updateMediaSession() {","  function totalDuration()");
assert(media.includes('setHandler("play", () => {')&&
 media.includes('setHandler("pause", () => { _pausaVolontaria(); });'),
 "Safari headset and lockscreen actions must reach intentional play/pause");
assert(!media.includes('setHandler("pause", null)'),
 "Do not unregister the Safari pause handler: background pauses must stick");
const events=section(app,"  function createAudio() {","/* Ricreo il lettore audio.");
assert(events.includes("_usaControlliNativiIos()")&&events.includes("_segnaIntenzioneSono(false)"),"Safari pause counted or auto-resumed");
console.log("OK: update keeps offline storage; auto cache isolation; per-profile reporting; GitHub/PC alias; Safari controls");
