#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {classifyImportFailure}=require("./youtube-import-errors.cjs");
const check=(sample,expected)=>assert.match(classifyImportFailure(sample),expected);
check("Cobalt HTTP 400 (error.api.youtube.login)",/verifica\/login/);
check("ERROR: Sign in to confirm you're not a bot",/verifica\/login/);
check("ERROR: HTTP Error 403",/403\/token/);
check("PO Token generation failed",/403\/token/);
check("Video unavailable",/restrizioni/);
check("request timed out",/temporaneamente/);
check("ffmpeg not found",/Convertitore/);
check("unknown source problem",/Nessun MP3 ottenuto/);
const mobile=fs.readFileSync(".github/workflows/process-mobile-imports.yml","utf8");
const issue=fs.readFileSync(".github/workflows/import-youtube-online.yml","utf8");
const importer=fs.readFileSync("tools/import-youtube-online.cjs","utf8");
for(const workflow of [mobile,issue]){
  assert.match(workflow,/bgutil-ytdlp-pot-provider==2\.0\.2/);
  assert.match(workflow,/brainicism\/bgutil-ytdlp-pot-provider:2\.0\.2/);
  assert.match(workflow,/127\.0\.0\.1:4416:4416/);
  assert.match(workflow,/MB_POT_READY=true/);
  assert.match(workflow,/docker rm -f musicbox-bgutil/);
}
assert.match(importer,/MB_POT_READY === "true"/);
assert.match(importer,/player_client=mweb/);
assert.match(importer,/player_client=android_vr/);
console.log("OK: errori distinti, provider confinato, mweb e fallback");
