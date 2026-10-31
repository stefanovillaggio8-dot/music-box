// Shared YouTube music metadata parser for Music Box (browser + GitHub + Supabase).
// No guessed artist from arbitrary labels, no removal of actual song versions.
export function cleanTrackText(value, limit=160) {
  return String(value||"").replace(/[\u0000-\u001f\u007f]/g," ")
    .replace(/\s+/g," ").trim().slice(0,limit);
}
const metadataTag=/(?:(?:\s*[\[(]\s*(?:(?:official|original)\s+)?(?:(?:music|lyric|lyrics|official)\s+)?(?:video|visualizer|visual|audio|lyrics?|lyric\s+video|music\s+video)(?:\s*(?:video|clip|hd|hq|4k))?\s*[\])])|\s*(?:\||[-–—])\s*(?:official\s+)?(?:music\s+)?(?:video|audio|visualizer|visual|lyrics?|lyric\s+video)\s*)$/i;
function trimDecorations(value){
  let s=cleanTrackText(value).replace(/^\s*(?:official\s+)?(?:music\s+)?(?:video|audio)\s*[:|]\s*/i,"");
  for(let i=0;i<4;i++){
    const t=s.replace(metadataTag,"").trim();
    if(t===s)break;
    s=t;
  }
  return s;
}
export function parseMusicMetadata(rawTitle,rawChannel=""){
  const original=cleanTrackText(rawTitle);
  const channel=cleanTrackText(rawChannel,100);
  let text=trimDecorations(original);
  if(!text)return {artist:"",title:"",confident:false,source:"missing"};
  // Reliable explicit "Artist - Title" conventions. Preserve dashes inside names.
  const match=text.match(/^(.{2,90}?)\s+[-–—]\s+(.{1,160})$/);
  if(match){
    const artist=cleanTrackText(match[1],100);
    const title=trimDecorations(match[2]);
    if(artist&&title&&!/^(?:official|unknown|music|video|lyrics?|audio)$/i.test(artist))
      return {artist,title,confident:true,source:"video_title"};
  }
  // Topic and VEVO channels can identify the performer for title-only uploads.
  const topic=channel.match(/^(.+?)\s*-\s*Topic$/i);
  const vevo=channel.match(/^(.+?)VEVO$/i);
  const probable=cleanTrackText(topic?.[1]||vevo?.[1]||"",100);
  if(probable && !/^(?:various artists|unknown|music|topic|records|official)$/i.test(probable))
    return {artist:probable,title:text,confident:true,source:"artist_channel"};
  return {artist:"",title:text,confident:false,source:"video_title_only"};
}
export function mergeMusicMetadata(requested,videoTitle,channel=""){
  const requestedParsed=parseMusicMetadata(requested);
  const observed=parseMusicMetadata(videoTitle,channel);
  if(observed.confident) return observed;
  if(requestedParsed.confident)return requestedParsed;
  return observed.title?observed:requestedParsed;
}
