#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
async function main(){
  const {nextRetry,MAX_IMPORT_ATTEMPTS}=await import("../cloud/musicbox-import-queue/retry-policy.mjs");
  const t=Date.parse("2026-10-31T18:00:00.000Z");
  assert.equal(MAX_IMPORT_ATTEMPTS,3);
  assert.deepEqual(nextRetry(1,"YouTube richiede verifica/login al server cloud",t),
    {retryAfter:"2026-10-31T18:30:00.000Z",nextAttempt:2,maxAttempts:3,minutes:30});
  assert.deepEqual(nextRetry(2,"Cobalt HTTP 400 (error.api.youtube.login)",t),
    {retryAfter:"2026-10-31T21:00:00.000Z",nextAttempt:3,maxAttempts:3,minutes:180});
  assert.equal(nextRetry(3,"login_required",t),null);
  assert.equal(nextRetry(0,"login_required",t),null);
  assert.equal(nextRetry(1,"Video non disponibile o soggetto a restrizioni",t),null);
  assert.equal(nextRetry(1,"Video non disponibile per diritti",t),null);
  assert.equal(nextRetry(1,"Servizio audio temporaneamente non raggiungibile",t)?.minutes,30);
  const edge=fs.readFileSync("cloud/musicbox-import-queue/index.ts","utf8");
  assert(edge.includes('from "./retry-policy.mjs"'));
  assert(edge.includes("retry_after"));
  assert(edge.includes("nextRetry("));
  assert(edge.includes("retry_after.is.null"));
  console.log("OK: massimo tre tentativi server-only, attesa reale, nessun retry per video permanentemente non disponibile");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
