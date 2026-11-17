"use strict";
/* Offline build: conservatively join already-synced lyrics to the exact
 * SHA/duration of its measured MP3. No model downloads or online scraping.
 * LRC timestamps are NOT a sound/vocal absence certificate.
 */
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const LRC=/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
const VOCAL_WORD=/[\p{L}]{2,}/u;
const LABEL=/^(?:\[.*\]|\(.*\)|instrumental|music|solo|interlude|intro|outro|applause|beat|break|silence)$/i;
function timestamps(lrc){
 if(typeof lrc!=="string"||lrc.length>30000)return [];
 const lines=[];
 for(const line of lrc.split(/\r?\n/)){
  const m=LRC.exec(line.trim());if(!m)continue;
  const t=Number(m[1])*60+Number(m[2])+
    Number(m[3]?m[3].padEnd(3,"0"):"0")/1000;
  const words=m[4].trim();
  if(!Number.isFinite(t)||t<0||t>900||
     !VOCAL_WORD.test(words)||LABEL.test(words))continue;
  lines.push({t,words});
 }
 const sorted=lines.slice().sort((a,b)=>a.t-b.t);
 if(lines.length<4||sorted.at(-1).t-sorted[0].t<22||
    sorted.some((x,i)=>i&&x.t-sorted[i-1].t<-.0001))return [];
 return sorted;
}
function build(index,lyrics,karaoke){
 if(!index||!index.entries||typeof index.entries!=="object"||
    !lyrics||typeof lyrics!=="object")throw Error("Missing DJ or lyric catalog");
 const entries={},stats={lyrics:0,synced:0,mapped:0,rejectedDuration:0,
  rejectedStamp:0,rejectedSha:0,duplicates:0};
 for(const [id,record] of Object.entries(lyrics)){
  if(!/^b-track-[0-9]+$/.test(id))continue;
  stats.lyrics++;
  const lines=timestamps(record?.synced);
  if(lines.length<4){stats.rejectedStamp++;continue}
  stats.synced++;
  const number=id.slice("b-track-".length),catalog=karaoke?.[id];
  for(const origin of ["audio","app"]){
   const key=origin+"/songs/track-"+number+".mp3";
   const audio=index.entries[key];
   if(!audio||audio.status!=="ok")continue;
   const sha=String(audio.sha||"").toLowerCase();
   if(!/^[0-9a-f]{40}$/.test(sha)){stats.rejectedSha++;continue}
   const duration=Number(audio.duration);
   const rawFirst=lines[0].t,rawLast=lines.at(-1).t;
   if(!Number.isFinite(duration)||duration<26||
      rawFirst>duration-20||rawLast>duration+1.0||
      rawLast<Math.min(25,duration*.25)||
      (Number.isFinite(catalog?.duration)&&catalog.duration>0&&
       Math.abs(Number(catalog.duration)-duration)>2.3)){
    stats.rejectedDuration++;continue;
   }
   // A synced last lyric timestamp is only the START of the last line.
   // Extend it by a deliberately conservative 6s; never store lastVoiceAt.
   // Similarly, vocals might start before the first timestamp.
   const item={sha,sourceKey:key,duration:Math.round(duration*1000)/1000,
    firstLyricAt:Math.max(0,Math.round((rawFirst-2.8)*1000)/1000),
    lastLyricAt:Math.min(duration,Math.round((rawLast+6)*1000)/1000),
    firstLrcAt:Math.round(rawFirst*1000)/1000,
    lastLrcAt:Math.round(rawLast*1000)/1000,
    lineCount:lines.length,starts:lines.map(row=>row.t).filter(t=>t<=duration+.1),
    provenance:"existing-synced-lrc-not-vocal-model"};
   if(entries[sha]){stats.duplicates++;continue;}
   entries[sha]=item;stats.mapped++;
  }
 }
 return {version:1,description:"Synced LRC with +6s last-line guard, not voice proof",
  entries,stats};
}
function main(){
 const index=JSON.parse(fs.readFileSync(path.join(ROOT,"dj-deep-analysis.json"),"utf8"));
 const lyrics=JSON.parse(fs.readFileSync(path.join(ROOT,"lyrics.json"),"utf8"));
 const karaoke=JSON.parse(fs.readFileSync(path.join(ROOT,"karaoke-index.json"),"utf8"));
 const result=build(index,lyrics,karaoke);
 const dest=path.join(ROOT,"dj-lyric-boundaries.json");
 fs.writeFileSync(dest,JSON.stringify(result,null,1)+"\n","utf8");
 console.info("[DJ SYNCED LRC COVERAGE]",JSON.stringify(result.stats));
 if(result.stats.mapped<50)throw Error("Catalog join too sparse; audit track/source IDs");
}
module.exports={timestamps,build};
if(require.main===module)main();
