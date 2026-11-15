'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c={};c.window=c;vm.createContext(c);for(const f of ['word-karaoke.js','audio-lyrics-align.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
const api=c.MusicBoxAudioAlign,rows=[{t:1,text:'we watch heavy engines closely tonight'},{t:7,text:'another verse follows'}];
const raw=()=>rows[0].text.split(' ').map((text,i)=>({text,timestamp:[1+i*.5,1+i*.5+.4]}));
const sets=()=>[{key:'1|28',words:api.recognizedWords(raw())},{key:'1|16',words:api.recognizedWords(raw())}];
test('two distinct contexts corroborate exact short runs without synthesizing intervals',()=>{
 const result=api.alignConsensusSpans(rows,sets());assert.equal(result.length,1);
 assert.equal(result[0].acousticSpans.length,5,'a long two-letter interval needs a third context');
 assert.equal(result[0].acousticSpans[0].wordIndex,1);
 for(const w of result[0].acousticSpans){const original=raw()[w.wordIndex];assert.equal(w.t,original.timestamp[0]);assert.equal(w.end,original.timestamp[1]);}
 const more=sets();more.push({key:'2|11',words:api.recognizedWords(raw())});
 assert.equal(api.alignConsensusSpans(rows,more)[0].acousticSpans.length,6);
});
test('replayed contexts and disagreeing boundaries cannot create a quorum',()=>{
 const repeated=sets();repeated[1].key=repeated[0].key;assert.equal(api.alignConsensusSpans(rows,repeated).length,0);
 const conflict=sets();for(const w of conflict[1].words){w.t+=.09;w.end+=.09;}assert.equal(api.alignConsensusSpans(rows,conflict).length,0);
 assert.equal(api.alignConsensusSpans([{t:1,text:'heavy engines closely'}],sets()).length,0,'unchanged four-word partial-row requirement');
});
test('observations are bounded, source-specific and explicitly releasable',()=>{
 const history=api.createObservationHistory();for(let i=0;i<30;i++)history.observe('sha-a',{at:i,seconds:28},raw());
 assert.equal(history.size(),12);history.observe('sha-b',{at:0,seconds:28},raw());assert.equal(history.size(),1);
 history.observe('sha-b',{at:0,seconds:28},raw());assert.equal(history.size(),1);history.clear();assert.equal(history.size(),0);
});
