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
