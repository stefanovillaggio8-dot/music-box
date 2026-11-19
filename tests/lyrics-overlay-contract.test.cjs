"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const release = JSON.parse(fs.readFileSync(path.join(root, "versione.json"), "utf8")).versione;

const enforcedLayer = [...style.matchAll(/\.lyrics-overlay\s*\{[^}]*z-index:\s*(\d+)\s*!important/g)]
  .map(match => Number(match[1])).at(-1);
assert.ok(enforcedLayer > 21000,
  "Lyrics dialog must stack above the Immersive Mode layer (21000)");
const confirmLayer = Number(style.match(/\.confirm-overlay\s*\{[^}]*z-index:\s*(\d+)/)?.[1]);
assert.ok(confirmLayer > enforcedLayer,
  "Confirmation dialogs must remain above the lyrics reader");

const reader = /\.lyrics-full-view \.lyrics-body\.lyrics-plain\s*\{([^}]+)\}/g;
const readerRules = [...style.matchAll(reader)].map(match => match[1]).join("\n");
assert.match(readerRules, /(?:^|;)\s*mask-image:\s*none\s*;/,
  "Full reader must disable the lyric karaoke fade mask");
assert.match(readerRules, /-webkit-mask-image:\s*none\s*;/,
  "Safari must also disable the lyric karaoke fade mask");

assert.match(html, /id="lyricsViewToggle"/);
assert.match(app, /classList\.toggle\("lyrics-full-view",!useSynced\)/,
  "The view toggle must apply the full-reader class to the dialog");
assert.match(app, /classList\.toggle\("lyrics-plain",!useSynced\)/,
  "The view toggle must apply the reading layout to the lyrics body");

assert.ok(app.includes(`const APP_VERSION = "${release}"`));
assert.ok(serviceWorker.includes(`const CACHE = "spotifynonavraiimieisoldi-v${release.replace(/\./g, "")}"`));
for (const asset of ["style.css", "app.js", "mix-intelligente.js",
  "karaoke-acoustic-proof.js", "audio-lyrics-align.js"]) {
  const match = html.match(new RegExp(`(?:href|src)="(${asset.replaceAll(".", "\\.")}\\?[^\"]+)"`));
  assert.ok(match, `${asset} must be versioned in HTML`);
  const requested = match[1].replaceAll("&amp;", "&");
  assert.ok(serviceWorker.includes(`"./${requested}"`),
    `Offline service worker must cache the actual ${asset} URL`);
}
console.log("Lyrics overlay CSS contract: OK");
