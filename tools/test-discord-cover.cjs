"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const code=fs.readFileSync(path.join(__dirname,"..","discord-presence.js"),"utf8")
  .replace("function trackInfo(){","globalThis.__testArtwork={publicArtwork,coverFromPlayer};\nfunction trackInfo(){");
const art={style:{backgroundImage:""}},dom={
  readyState:"loading",baseURI:"https://stefanovillaggio8-dot.github.io/music-box/",
  addEventListener(){},getElementById(id){return id==="playerArt"?art:null}
};
const ctx={document:dom,navigator:{userAgent:"Windows"},window:{},
 URL,getComputedStyle:(el)=>el.style,localStorage:{getItem:()=>null},setInterval(){},setTimeout(){}};
vm.runInNewContext(code,ctx);
const {publicArtwork,coverFromPlayer}=ctx.__testArtwork;
const g="https://stefanovillaggio8-dot.github.io/music-box/copertine/sogno-americano.jpg";
const dz="https://cdn-images.dzcdn.net/images/cover/example/300x300.jpg";
const spotify="https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02abc";
assert.equal(publicArtwork(dz),dz,"Deezer is no longer filtered");
assert.equal(publicArtwork(spotify),spotify,"Spotify image CDN allowed");
assert.equal(publicArtwork("copertine/sogno-americano.jpg"),g,"relative album art must become public HTTPS");
assert.equal(publicArtwork("http://127.0.0.1/x"),"");
assert.equal(publicArtwork("blob:https://musicbox/a"),"");
assert.equal(publicArtwork("data:image/png;base64,aGVsbG8="),"");
art.style.backgroundImage='url("'+dz+'")';
assert.equal(coverFromPlayer({title:"A",cover:""}),dz,"read real player cover");
assert.equal(coverFromPlayer({title:"A",cover:"copertine/sogno-americano.jpg"}),g,"track cover has priority");
assert.equal(coverFromPlayer({title:"A",cover:"blob:https://site/abc"}),dz,"fallback to displayed cover");
console.log("PASS: real cover from Deezer, Spotify, player and relative paths; private URLs rejected.");
