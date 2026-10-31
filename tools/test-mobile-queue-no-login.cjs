#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const app=fs.readFileSync("app.js","utf8");
const html=fs.readFileSync("index.html","utf8");
const workflow=fs.readFileSync(".github/workflows/process-mobile-imports.yml","utf8");
const edge=fs.readFileSync("cloud/musicbox-import-queue/index.ts","utf8");
const cli=fs.readFileSync("tools/cloud-queue-client.cjs","utf8");
for(const id of ["youtubeOnlinePanel","ytOnlineClose","ytOnlineUrl","ytOnlineName","ytOnlineProfile",
  "ytOnlineRights","ytOnlineGo","ytOnlineHint"]) {
  assert.equal((html.match(new RegExp('id="'+id+'"',"g"))||[]).length,1,"Missing/duplicate input "+id);
}
assert(html.includes("Aggiungi al mio profilo"));
assert(html.includes("senza GitHub") || html.includes("senza accesso a GitHub"));
assert(app.includes('action:"create"') && app.includes('action=status&id='));
assert(app.includes('LS.set(MB_YT_PENDING,'));
assert(app.includes("_braniYouTubePubblicati()"));
assert(app.includes("musicbox-import-queue") && !app.slice(app.indexOf('async function _aggiungiDaYouTube('),
  app.indexOf('/* ---------- La guida (il')).includes("issues/new"));
assert(workflow.includes("schedule:") && workflow.includes("*/5 * * * *"));
assert(workflow.includes("id-token: write") && workflow.includes("tools/cloud-queue-client.cjs claim"));
assert(workflow.includes("tools/cloud-queue-client.cjs finish"));
assert(cli.includes("ACTIONS_ID_TOKEN_REQUEST_TOKEN"));
assert(edge.includes("crypto.subtle.verify") && edge.includes("claims.event_name"));
assert(edge.includes("client_hash") && edge.includes("origin"));
console.log("OK: all profiles, cloud queue, status, no Github login, worker OIDC and rate limits");
