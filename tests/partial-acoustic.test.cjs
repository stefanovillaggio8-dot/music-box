'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const scope={console,setTimeout,clearTimeout,Map,Set,Float32Array,AbortController};scope.window=scope;vm.createContext(scope);
for(const file of ['word-karaoke.js','audio-lyrics-align.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),scope);
const align=scope.MusicBoxAudioAlign,words=scope.MusicBoxWordKaraoke;
const text='questa notte resta sempre qui con me mentre cambia tutto ancora';
const chunks=text.split(' ').map((text,i)=>({text,timestamp:[1+i*.2,1.18+i*.2]}));
test('one wrong recognized word cannot discard separate unique acoustic sequences or invent the missing time',()=>{
 const wrong=structuredClone(chunks);wrong[5].text='errore';
 const result=align.alignAcousticSpans([{t:1,text},{t:5,text:'nuova frase'}],wrong);
 assert.equal(result.length,1);assert.equal(words.hasWordTiming(result[0]),false);assert.equal(words.hasPartialTiming(result[0]),true);
 assert.equal(result[0].acousticSpans.some(w=>w.wordIndex===5),false);
 assert.equal(words.normalizeRows(result)[0].acousticSpans.length,result[0].acousticSpans.length);
 assert.equal(words.estimateRows(result)[0].estimated,undefined);
});
test('repeated ambiguous text, zero-length syllables and long unresolved held words remain unaligned',()=>{
 const repeated='sono qui con te sono qui con te';
 const asr=repeated.split(' ').slice(0,4).map((text,i)=>({text,timestamp:[1+i*.2,1.18+i*.2]}));
 assert.equal(align.alignAcousticSpans([{t:1,text:repeated},{t:4,text:'fine'}],asr).length,0);
 const held=structuredClone(chunks.slice(0,5));held[3].timestamp=[1.6,2.9];
 assert.equal(align.alignAcousticSpans([{t:1,text:text.split(' ').slice(0,5).join(' ')}],held).length,0);
});
test('complete verified rows reserve their real ASR occurrence against other partial rows',()=>{
 const complete={t:1,text,words:chunks.map(c=>({text:c.text+' ',t:c.timestamp[0],end:c.timestamp[1]}))};
 complete.words[complete.words.length-1].text=complete.words.at(-1).text.trim();
 assert.equal(words.hasWordTiming(complete),true);
 assert.equal(align.alignAcousticSpans([{t:.8,text},complete],chunks).length,0);
});
test('partial rendering leaves unmatched words plain and paints only observed timestamps',()=>{
 const wrong=structuredClone(chunks);wrong[5].text='errore';const row=align.alignAcousticSpans([{t:1,text}],wrong)[0];
 const doc={createElement:()=>({style:{setProperty(k,v){this[k]=v}}})},container={children:[],appendChild(x){this.children.push(x)}};
 const elements=words.spanWords(doc,row,container);assert.equal(elements.length,text.split(' ').length);
 assert.equal(elements[5].className,'karaoke-unmatched');words.paintWords(row,elements,9);
 assert.equal(elements[5].style['--karaoke-fill'],undefined);assert.equal(elements[0].style['--karaoke-fill'],'100%');
 const coverage=words.timingCoverage([row]);assert.equal(coverage.wordTimed,0);assert.equal(coverage.partial,1);
});
