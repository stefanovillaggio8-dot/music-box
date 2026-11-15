'use strict';
const fs=require('node:fs'),path=require('node:path');
// The actual application parser, save/merge and reload functions, with only
// UI/database side effects stubbed. No alternative timing acceptance logic.
module.exports=function createFixture(context,root=path.resolve(__dirname,'..')){
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const slice=(from,to)=>{const start=app.indexOf(from),end=app.indexOf(to,start);if(start<0||end<start)throw Error('Application fixture markers changed');return app.slice(start,end);};
 const parser=slice('  function parseSynced(','  function _righeTestoConParole(');
 const getter=slice('  function _righeTestoConParole(','  const _ritardiTesti=');
 const save=slice('  async function _salvaParoleDallAudio(','  /* Recupero graduale mentre');
 return existing=>new Function('window','existing',`
  const currentId='song',lyricsData={song:existing},localLyrics={},db=null;
  const _testoLocaleVerificato=()=>localLyrics.song||existing;
  const $=()=>({hidden:true}),render=()=>{};
  const _haTempiParole=row=>window.MusicBoxWordKaraoke.hasWordTiming(row);
  ${parser}\n${getter}\n${save}
  return {save:_salvaParoleDallAudio,rows:()=>_righeTestoConParole(localLyrics.song||existing)};
 `)(context,existing);
};
