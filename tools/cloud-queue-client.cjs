#!/usr/bin/env node
"use strict";
// Github runner obtains an OIDC token valid only for this repository's workflow.
// No PAT, service-role key or personal Github login is stored in Music Box.
const fs = require("node:fs");
const path = require("node:path");

const ENDPOINT = "https://adnteitlhopehllutlua.supabase.co/functions/v1/musicbox-import-queue";
const audience = "musicbox-import-queue-v1";
const jobPath = path.join(process.env.RUNNER_TEMP || process.cwd(),"musicbox-cloud-job.json");
async function oidc() {
  if(!process.env.ACTIONS_ID_TOKEN_REQUEST_URL||!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)
    throw Error("GitHub Actions OIDC unavailable");
  const r=await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL+"&audience="+encodeURIComponent(audience),
    {headers:{authorization:"bearer "+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});
  if(!r.ok)throw Error("GitHub OIDC HTTP "+r.status);
  const j=await r.json();
  if(!j.value)throw Error("No signed GitHub OIDC token");
  return j.value;
}
async function api(token, payload) {
  const r=await fetch(ENDPOINT,{method:"POST",headers:{"content-type":"application/json",
    authorization:"Bearer "+token},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  const j=await r.json();
  if(!r.ok||!j.ok)throw Error("Cloud queue API HTTP "+r.status+": "+String(j.error||""));
  return j;
}
async function main() {
  const mode=process.argv[2];
  if(!["claim","finish"].includes(mode))throw Error("usage: node cloud-queue-client.cjs claim|finish");
  const token=await oidc();
  if(mode==="claim") {
    const response=await api(token,{action:"claim"});
    if(response.job) {
      fs.writeFileSync(jobPath,JSON.stringify(response.job));
      if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,"has_job=true\n");
      console.log("Cloud job claimed",response.job.id,"profile",response.job.profile);
    } else {
      if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,"has_job=false\n");
      console.log("No pending mobile imports");
    }
    return;
  }
  if(!fs.existsSync(jobPath)){console.log("No claimed job to finish");return;}
  const job=JSON.parse(fs.readFileSync(jobPath,"utf8"));
  const success=process.argv[3]==="success";
  const result=await api(token,{action:"finish",id:job.id,status:success?"completed":"failed",
    file:success?"songs/youtube-"+job.video_id+".mp3":"",
    error:success?"":"Conversione o pubblicazione non riuscita. Riprova con un video consentito."});
  console.log("Cloud job completed",job.id,result.ok,success);
}
main().catch(e=>{console.error(String(e&&e.message||e));process.exitCode=1;});
