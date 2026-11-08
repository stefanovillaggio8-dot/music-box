'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','style.css'),'utf8');
const originals=[[74,"Dimmi Che C''"],[124,"marte"],[125,"mi @mio è f@ke"],[126,"slrl"],[203,"ily"],[211,"m@star"],[331,"rlva (feat. Pinguini Tattici Nucleari)"],[400,"come fal"],[403,"occrl purpl3 (feat. Marracash)"],[438,"clao (feat. Rondodasosa)"]];
const matches=[...code.matchAll(/\{[^\n]*\btitle:\s*"([^"]*)"[^\n]*\bfile:\s*"songs\/track-(\d+)\.mp3"[^\n]*\bartist:\s*"([^"]*)"/g)];
test('all mistakenly altered track names restored byte-for-byte',()=>{
 const titles=new Map(matches.map(m=>[Number(m[2]),m[1]]));
 for(const [id,title] of originals)assert.equal(titles.get(id),title,'track '+id);
});
test('render-only unicode guard strips pathological marks, never rewrites stored names',()=>{
 const match=code.match(/function _titoloPerSchermo\(value, canonical=""\) \{[\s\S]*?\n\}/);
 assert.ok(match,'display-only function');
 const show=vm.runInNewContext(match[0]+';_titoloPerSchermo;');
 assert.equal(show('m@star'),'m@star');
 assert.equal(show('marte'),'marte');
 assert.equal(show('A\u200eB'),'AB');
 assert.equal(show('A\u0301\u0300\u0301\u0300\u0301'), 'Á̀');
 assert.ok(show('A'.repeat(500)).length<260);
 assert.match(code,/testoTitolo\.textContent = _titoloPerSchermo\(t\.title,_originaleDi\(t\.id\)\?\.title\)/);
 assert.match(css,/\.track-testo \{[\s\S]*?max-width: 100%;/);
});

test('repeated mojibake in titles and album metadata is display-only',()=>{
 const match=code.match(/function _titoloPerSchermo\(value, canonical=""\) \{[\s\S]*?\n\}/);
 assert.ok(match);
 const show=vm.runInNewContext(match[0]+';_titoloPerSchermo;');
 const garbled="Ã\uFFFD".repeat(35);
 assert.equal(show("uNa DiReZioNe gi"+garbled,"uNa DiReZioNe giùSta"),"uNa DiReZioNe giùSta");
 assert.equal(show("Dimmi che c'"+garbled,"Dimmi Che C''"),"Dimmi Che C''");
 assert.equal(show("Mod"+garbled+" Il meglio dei Modà 2000"),"Mod… Il meglio dei Modà 2000");
 assert.equal(show("Dimmi che c'Ã¨"),"Dimmi che c'è");
 assert.equal(show("uNa DiReZioNe giÃ¹Sta"),"uNa DiReZioNe giùSta");
 assert.equal(show("fragile"),"fragile");
 assert.equal(show("mi @mio è f@ke"),"mi @mio è f@ke");
 assert.equal(show("s!r!"),"s!r!");
 assert.match(code,/bits\.push\(_titoloPerSchermo\(t\.album,/);
 assert.match(code,/_titoloPerSchermo\(t\.title,_originaleDi\(t\.id\)\?\.title\)/);
});