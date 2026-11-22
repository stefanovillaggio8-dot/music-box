'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const start=app.indexOf('  function _decisioneSessione('),end=app.indexOf('  let queue = [];',start),source=app.slice(start,end);
const pauseStart=app.indexOf('  function _memorizzaPausaCorrente()'),pauseEnd=app.indexOf('  // Safari can show',pauseStart),pauseSource=app.slice(pauseStart,pauseEnd);
assert.ok(start>0&&end>start);
const decision=new Function(source+'return _decisioneSessione;')();
const now=1795350000000,hour=3600000;
for(const [minutes,restore,reset] of [[119,true,false],[121,false,false],[299,false,false],[301,false,true]]){
 test('reopen after '+minutes+' minutes keeps independent two-hour and five-hour rules',()=>{
  const at=now-minutes*60000,old={last:'b-ste',time:123.457,quando:at};
  const result=decision(old,{id:'b-ste',time:123.457,quando:at},null,null,now);
  assert.equal(result.id,restore?'b-ste':null);assert.equal(result.time,restore?123.457:0);assert.equal(result.resetShuffle,reset);
 });
}
test('latest profile playback wins; missing timestamps, future clocks and an expired pause cannot resurrect a selection',()=>{
 const st={last:'old',time:10,quando:now-hour},previous={id:'new',time:22.345,quando:now-1000};
 assert.equal(decision(st,previous,null,null,now).id,'new');
 assert.equal(decision(st,previous,{id:'paused',time:66,quando:now-3*hour},null,now).id,'new');
 assert.equal(decision({last:'unknown',time:30},null,null,null,now).id,null);
 assert.equal(decision(null,{id:'future',time:10,quando:now+1000},null,null,now).id,null);
 const cleared={id:null,time:0,cleared:true,quando:now-500};
 assert.equal(decision(st,cleared,null,{at:now},now).id,null,'Reopening the empty session cannot revive st.last');
});
function fixture(age=3*hour){
 const store=new Map([['mb.playback.Ste',{id:'b-ste',time:125,quando:now-age}],['mb.shuffle.cicli.v1.Ste',{context:{played:['a','b']}}],
  ['mb.shuffle.cicli.v1.Diego',{context:{played:['other']}}],['mb.downloads.Ste',['song']],['mb.favs.Ste',['favorite']],['mb.playlists.Ste',['list']]]);
 const events=[],timers=new Map();let serial=0;
 const audio={currentTime:0,readyState:0,duration:300,seeking:false,paused:true,ended:false,muted:false,
  pause(){this.paused=true;events.push('pause')},removeAttribute(x){events.push('remove-'+x)},load(){events.push('load')}};
 const api=new Function('f',`let profile='Ste',currentId='b-ste',resumeAt=0,pendingSeek=null,_pausaCheckpoint=null,
 _vuoleSuonare=false,_pausaEsplicita=true,_ultimoAvanzamentoReale=${now-age};
 const {audio,store,events,timers}=f,LS={get:(k,d)=>store.has(k)?store.get(k):d,set:(k,v)=>store.set(k,v)},
 Date={now:()=>${now}},profileState=()=>({last:'b-ste',time:125,quando:${now-age}}),window={MusicBoxMix:{cancel:()=>events.push('cancel')}},
 document={hidden:false},setTimeout=cb=>{const id=f.next();timers.set(id,cb);return id},clearTimeout=id=>timers.delete(id),
 requestAnimationFrame=cb=>{f.frame=cb;return 1},cancelAnimationFrame=()=>{},
 _azzeraCasuale=()=>events.push('reset-shuffle'),_annullaBloccoRipresaAudio=()=>{},render=()=>events.push('render'),
 updateMediaSession=()=>{},tickLyrics=()=>{},syncPlayUI=()=>{},toast=t=>events.push(t),totalDuration=()=>audio.duration,
 updateProgressUI=t=>events.push({displayTime:t});
 const _bloccoRipresaAudio=null,_pausaSalvata=()=>_pausaCheckpoint,savePos=()=>{};
 ${source}
 ${pauseSource}
 return {check:_controllaScadenzaSessione,trySeek:_tentaRipresaAvvio,arm:_proteggiPlayRipristinato,cancel:_annullaRipresaAvvio,
  savePause:_memorizzaPausaCorrente,
  pending:()=>_ripresaAvvio,id:()=>currentId,live:()=>{_ultimoAvanzamentoReale=${now};audio.paused=false;audio.readyState=4;audio.currentTime=200},
  prepare:()=>{_ripresaAvvio={id:currentId,profile,player:audio,target:125,armed:false,seekConfirmed:false}},
  hide:()=>document.hidden=true,setId:id=>currentId=id};` )({audio,store,events,timers,next:()=>++serial});
 return {api,audio,store,events,timers};
}
test('expiry clears selection at two hours but preserves shuffle, downloads, favorites, playlists and other accounts',()=>{
 const f=fixture(3*hour);f.api.check();assert.equal(f.api.id(),null);
 assert.deepEqual(f.store.get('mb.shuffle.cicli.v1.Ste'),{context:{played:['a','b']}});
 assert.equal(f.store.get('mb.playback.Ste').cleared,true);
 for(const [k,value] of [['mb.downloads.Ste',['song']],['mb.favs.Ste',['favorite']],['mb.playlists.Ste',['list']]])assert.deepEqual(f.store.get(k),value);
 assert.deepEqual(f.store.get('mb.shuffle.cicli.v1.Diego'),{context:{played:['other']}});
});
test('five hours clears only the current profile temporary shuffle history; advancing background audio remains active',()=>{
 const expired=fixture(5*hour+60000);expired.api.check();assert.deepEqual(expired.store.get('mb.shuffle.cicli.v1.Ste'),{});
 assert.deepEqual(expired.store.get('mb.shuffle.cicli.v1.Diego'),{context:{played:['other']}});
 const playing=fixture(6*hour);playing.api.live();playing.api.check();assert.equal(playing.api.id(),'b-ste');
 assert.equal(playing.events.includes('reset-shuffle'),false);assert.equal(playing.events.includes('pause'),false);
});
test('startup seek remains pending through metadata and a decoder reset at Play; only real advancement reveals audio',()=>{
 const f=fixture(hour);f.api.prepare();assert.equal(f.api.trySeek(),false);assert.equal(f.audio.currentTime,0);
 f.audio.readyState=1;f.api.trySeek();assert.equal(f.audio.currentTime,125);assert.ok(f.api.pending());
 f.audio.readyState=4;assert.equal(f.api.trySeek(),true);assert.ok(f.api.pending(),'A paused seek alone is not Play confirmation');
 f.api.arm();assert.equal(f.audio.muted,true);
 f.audio.paused=false;f.audio.currentTime=0;f.api.trySeek();assert.equal(f.audio.currentTime,125);assert.equal(f.audio.muted,true);
 f.audio.currentTime=125.05;assert.equal(f.api.trySeek(),true);assert.equal(f.api.pending(),null);assert.equal(f.audio.muted,false);
});
test('failed restoration pauses within the bounded deadline and leaves a real retry checkpoint, not an endless muted zero-time player',()=>{
 const f=fixture(hour);f.api.prepare();f.api.arm();f.audio.paused=false;
 for(const cb of [...f.timers.values()])cb();
 assert.equal(f.audio.paused,true);assert.equal(f.audio.muted,false);assert.equal(f.api.pending().target,125);
 assert.equal(f.events.some(x=>typeof x==='string'&&x.includes('Premi Play')),true);
 f.api.setId('another');f.api.trySeek();assert.equal(f.api.pending(),null);
});
test('a delayed background timeupdate confirms real progress instead of repeatedly rewinding a restored song',()=>{
 const f=fixture(hour);f.api.prepare();f.audio.readyState=4;f.api.trySeek();f.api.trySeek();
 f.api.hide();f.api.arm();f.audio.paused=false;f.audio.currentTime=125.75;
 assert.equal(f.api.trySeek(),true);assert.equal(f.audio.currentTime,125.75);
 assert.equal(f.api.pending(),null);assert.equal(f.audio.muted,false);
});
test('a deliberate pause during startup loading cancels the deadline and retains the requested real checkpoint for retry',()=>{
 const f=fixture(hour);f.api.prepare();f.audio.readyState=4;f.api.trySeek();f.api.trySeek();f.api.arm();f.audio.currentTime=.6;
 f.api.cancel(true);f.api.savePause();
 assert.equal(f.api.pending().seekConfirmed,false,'A decoder reset must not inherit the earlier paused-seek confirmation');
 assert.equal(f.store.get('mb.pausaPos.Ste').time,125);
 assert.equal(f.timers.size,0);assert.equal(f.audio.muted,false);assert.equal(f.api.pending().target,125);
 f.api.arm();assert.equal(f.api.pending().armed,true);assert.equal(f.timers.size,1);
});
