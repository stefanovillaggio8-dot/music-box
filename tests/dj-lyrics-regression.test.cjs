"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const dj=fs.readFileSync(path.join(__dirname,"..","mix-intelligente.js"),"utf8");
test("LRCLIB search uses first artist and never exact-get after successful empty search",()=>{
 const from=app.indexOf('const endpoint = "https://lrclib.net"'),to=app.indexOf("if (options.syncedOnly) return null;",from);
 const block=app.slice(from,to);
 assert.match(block,/const searches=\[makeSearch\(firstArtist\)\]/);
 assert.match(block,/if\(!searchWorked&&Date\.now\(\)>=_lrclibNonPrimaDi\)/);
 assert.match(block,/\/api\/search\?track_name=/);
 assert.match(block,/fullArtist\.split\(/);
 assert.match(app,/remix\|rmx\|visual\|visualizer/);
});
test("unchanged DJ index refresh retains planned desktop transition",()=>{
 const from=dj.indexOf("function loadDeepIndex("),to=dj.indexOf("function canSaveAnalysis(",from);
 const code=dj.slice(from,to);
 assert.match(code,/if\(enabled&&!mixing&&changed\)/);
 assert.match(code,/JSON\.stringify\(beforeNow\)/);
 assert.match(code,/JSON\.stringify\(beforeNext\)/);
});
test("normal handoff is clearly distinguished from real beat mix",()=>{
 assert.match(dj,/Passaggio naturale: nessun beat compatibile certificato/);
 assert.match(dj,/audio\.duration-audio\.currentTime<=45&&/);
 assert.match(dj,/musicBoxVersion:"6\.688"/);
});


test("redundant featuring credits are cleaned only for lyric provider search",()=>{
 const from=app.indexOf("function _titoloPulitoPerTesti(");
 const end=app.indexOf("async function findLyrics(",from);
 assert.ok(from>0&&end>from);
 const normalize=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 const fn=new Function("stripVariants","normKey",app.slice(from,end)+
  "return _titoloPulitoPerTesti;")(s=>String(s).trim(),normalize);
 assert.equal(fn("Nayt, 3D","senza armi ft nayt"),"senza armi");
 assert.equal(fn("Nayt, 3D","senza armi ft altri"),"senza armi ft altri");
 assert.equal(fn("Nayt","senza armi"),"senza armi");
});
test("unreachable lyric services enter independent provider cooldown",()=>{
 assert.match(app,/mb\.lyricsOvhAttesaFino/);
 assert.match(app,/_attendiLyricsOvh\(300000\)/);
 assert.match(app,/_segnaLyricsOvhMancante\(chiaveLyricsOvh\)/);
 assert.match(app,/!\/\[,\/&\]\/\.test\(artistaCompleto\)/);
});
