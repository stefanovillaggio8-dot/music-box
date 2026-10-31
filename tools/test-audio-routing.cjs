#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const app=fs.readFileSync("app.js","utf8");
const start=app.indexOf("function _doveStaIlBrano(file) {");
const end=app.indexOf("\n\n  let profiles = ",start);
if(start<0||end<0)throw Error("Cannot find audio URL resolver");
const functionSource=app.slice(start,end);
function resolve(protocol,hostname,casa) {
  const ctx={location:{protocol,hostname,origin:protocol+"//"+hostname},
    _collegamentoDiCasa:()=>casa,
    BRANI_ONLINE:"https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/"};
  return vm.runInNewContext(functionSource+";_doveStaIlBrano('songs/track-521.mp3')",ctx,{timeout:1000});
}
const online="https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/songs/track-521.mp3";
assert.equal(resolve("https:","stefanovillaggio8-dot.github.io","http://192.168.1.40:8788"),online,
  "HTTPS pages must not fetch an HTTP private-IP stream");
assert.equal(resolve("http:","other.example","http://192.168.1.40:8788"),
  "http://192.168.1.40:8788/app/songs/track-521.mp3",
  "HTTP pages may stream from the remembered home server");
assert.equal(resolve("http:","192.168.1.40",""),"songs/track-521.mp3",
  "Home pages should use same-origin relative audio");
assert.equal(resolve("https:","stefanovillaggio8-dot.github.io",""),online);
console.log("Music Box audio routing: 4/4 cases passed");
