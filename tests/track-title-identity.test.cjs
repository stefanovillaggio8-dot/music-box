'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const corrected=[[124,"mar+e"],[125,"mi @mi o è f@ke"],[126,"s!r! (feat. Lazza & Sfera Ebbasta)"],[211,"m8nstar"],[400,"come fa1"],[403,"occh1 purpl3 (feat. Marracash)"],[438,"c!ao (feat. Rondodasosa)"],[74,"Dimmi che c'è"]];
const rows=[...code.matchAll(/\{[^\n]*\btitle:\s*"([^"]*)"[^\n]*\bfile:\s*"songs\/track-(\d+)\.mp3"[^\n]*\bartist:\s*"([^"]*)"/g)];
// Important: these are the intended artist spellings, not a generic removal of
// digits/symbols. Distinct files and user renames must remain untouched.
test('thasup verified catalog titles preserve artistic spelling',()=>{
 const map=new Map(rows.map(x=>[Number(x[2]),x[1]]));
 for(const [id,title] of corrected)assert.equal(map.get(id),title,'track-'+id);
 assert.equal(map.get(12),'s!r!');
 assert.equal(map.get(64),"dimmi che ce'");
});
test('sync button presents before/after count rather than a silent no-op',()=>{
 assert.match(code,/const changed=Number\(s\.visibleCount\|\|0\)-Number\(before\?\.visibleCount\|\|0\)/);
 assert.match(code,/\(conteggio invariato\)/);
 assert.match(code,/Sincronizzazione completata/);
});
