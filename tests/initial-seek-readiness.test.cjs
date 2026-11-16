'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const start=app.indexOf('    if (!_adottaDj && startAt > 0 && Number.isFinite(startAt)) {');
const end=app.indexOf('    // Start play() from the original tap',start);
assert.ok(start>0&&end>start);
function fixture(duration=.001,readyState=4){
 const listeners=new Map(),timers=new Map(),writes=[];let timerId=0;
 const player={duration,readyState,addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},
  removeEventListener:(name,fn)=>listeners.get(name)?.delete(fn),get currentTime(){return writes.at(-1)||0},set currentTime(value){writes.push(value)}};
 const clock={setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};
 const api=new Function('player','clock',`let audio=player,currentId='source';const id='source',startAt=110.626717314,_adottaDj=false;
  const {setTimeout,clearTimeout}=clock;${app.slice(start,end)}
  return {replace:(value,id)=>{audio=value;currentId=id}};`)(player,clock);
 return {player,writes,timers,api,emit:name=>{for(const fn of [...(listeners.get(name)||[])])fn()},listeners:()=>[...listeners.values()].reduce((s,x)=>s+x.size,0)};
}
test('provisional WebKit millisecond duration cannot clamp an initial seek to false EOF',()=>{
 const f=fixture();f.emit('loadedmetadata');assert.equal(f.writes.length,0);
 f.player.duration=126.876708333;f.emit('durationchange');assert.deepEqual(f.writes,[110.626717314]);
 f.emit('canplay');f.emit('playing');assert.equal(f.writes.length,1);assert.equal(f.listeners(),0);assert.equal(f.timers.size,0);
});

test('native duration can refine after playing without another metadata event',()=>{
 for(const event of ['progress','timeupdate']){
  const f=fixture();f.emit('loadedmetadata');f.emit('playing');assert.equal(f.writes.length,0);
  f.player.duration=126.876708333;f.emit(event);
  assert.deepEqual(f.writes,[110.626717314]);assert.equal(f.listeners(),0);assert.equal(f.timers.size,0);
 }
});
test('ordinary valid metadata retains immediate initial seeking and genuine EOF bounds',()=>{
 const f=fixture(126.877);assert.deepEqual(f.writes,[110.626717314]);assert.equal(f.timers.size,0);
 const short=fixture(5);assert.deepEqual(short.writes,[4.5]);
});
test('a superseded track and a manual seek release the pending initial seek',()=>{
 const f=fixture();f.api.replace({},'different');f.player.duration=126;f.emit('durationchange');assert.equal(f.writes.length,0);assert.equal(f.timers.size,0);
 const manual=fixture();manual.player._mbInitialSeekCleanup();manual.player.currentTime=30;
 manual.player.duration=126;manual.emit('durationchange');assert.deepEqual(manual.writes,[30]);assert.equal(manual.listeners(),0);
 assert.match(app.slice(app.indexOf('a.addEventListener("seeking"'),app.indexOf('a.addEventListener("seeking"')+200),/_mbInitialSeekCleanup/);
});
test('unresolved metadata is event-driven and released with its owning player',()=>{
 const f=fixture();assert.equal(f.timers.size,0);f.player._mbInitialSeekCleanup();f.player.duration=126;f.emit('playing');
 assert.equal(f.writes.length,0);assert.equal(f.timers.size,0);assert.equal(f.listeners(),0);
});
test('metadata becoming ready while paused changes position without restarting playback',()=>{
 const f=fixture();f.player.paused=true;f.player.play=()=>{throw Error('Initial seek must never play')};
 f.player.duration=126;f.emit('durationchange');assert.equal(f.player.currentTime,110.626717314);assert.equal(f.player.paused,true);
});
test('slow network metadata does not lose the requested start to an arbitrary timeout',()=>{
 const f=fixture(NaN,0);assert.equal(f.writes.length,0);assert.equal(f.timers.size,0);
 f.player.readyState=4;f.player.duration=126;f.emit('loadedmetadata');assert.deepEqual(f.writes,[110.626717314]);
});
test('resume cannot infer song completion from the provisional millisecond duration',()=>{
 const from=app.indexOf('  function _riprendiSeInAttesa() {'),to=app.indexOf('        if (!audio.paused)',from);
 const check=new Function('audio','next',`const _iosInstallataComeApp=()=>false,document={hidden:false},window={},_vuoleSuonare=true,currentId='source';
  const toast=()=>{},_finitoSenzaAvanti=next;${app.slice(from,to)}return 'ready';}return _riprendiSeInAttesa();`);
 let next=0;const provisional={duration:.001,currentTime:.001,ended:false,_mbInitialSeekCleanup:()=>{}};
 check(provisional,()=>next++);assert.equal(next,0);
 delete provisional._mbInitialSeekCleanup;check(provisional,()=>next++);assert.equal(next,0);
 check({duration:126,currentTime:126,ended:true},()=>next++);assert.equal(next,1);
});
test('native end dispatch waits for a pending initial seek only while metadata is provisional',()=>{
 const from=app.indexOf('  function handleEnded() {'),to=app.indexOf('    try {',from);
 const check=new Function('audio',`${app.slice(from,to)}return 'forward';}return handleEnded();`);
 assert.equal(check({duration:.001,_mbInitialSeekCleanup:()=>{}}),undefined);
 assert.equal(check({duration:126,_mbInitialSeekCleanup:()=>{}}),'forward');
 assert.equal(check({duration:.001}),'forward');
});
test('DJ preparation does not run before the requested native initial position is ready',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../mix-intelligente.js'),'utf8'),from=code.indexOf('function tick(){'),to=code.indexOf(' const next=app?.mixNext();',from);
 const check=new Function('player','prepare',`const window={},document={hidden:false},isIOS=false,enabled=true,seekRecoveryUntil=0,
  mobileActive=null,active=null,prepared=null,mobileFading=false;
  const bridge=()=>({audio:()=>player,currentId:()=> 'source'});${code.slice(from,to)}prepare();}return tick();`);
 let calls=0;const player={paused:false,seeking:false,readyState:4,duration:126,_mbInitialSeekCleanup:()=>{}};
 check(player,()=>calls++);assert.equal(calls,0);delete player._mbInitialSeekCleanup;check(player,()=>calls++);assert.equal(calls,1);
 assert.match(app,/id !== currentId \|\| Number\.isFinite\(startAt\)&&startAt>0\) resumeAt = 0/);
});
test('a wanted native resume can still play while metadata and its initial seek are pending',()=>{
 const from=app.indexOf('  function _riprendiSeInAttesa() {'),to=app.indexOf('  ["visibilitychange", "focus", "pageshow"]',from);
 assert.ok(to>from);let advances=0,plays=0;
 const audio={duration:.001,currentTime:.001,ended:true,paused:true,_mbInitialSeekCleanup:()=>{},play:()=>{plays++;return Promise.resolve()}};
 new Function('audio','advance',`const _iosInstallataComeApp=()=>false,document={hidden:false},window={},_vuoleSuonare=true,currentId='source';
  let _ultimoScorrimento=0;const toast=()=>{},_finitoSenzaAvanti=advance,_controllaCheSuoni=()=>{},_riprovaPiuTardi=()=>{};
  ${app.slice(from,to)}_riprendiSeInAttesa();`)(audio,()=>advances++);
 assert.equal(advances,0);assert.equal(plays,1);
});
