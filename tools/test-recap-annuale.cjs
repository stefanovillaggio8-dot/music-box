"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const code=fs.readFileSync("app.js","utf8");
const state=JSON.parse(fs.readFileSync("stato.json","utf8"));
assert.deepEqual(state.statistiche.Emanuele,{}, "Emanuele deve essere azzerato nel file");
assert(Object.keys(state.statistiche.Ste).length>20,"Ste non deve essere modificato");
assert(Object.keys(state.statistiche.Diego).length>20,"Diego non deve essere modificato");
assert(/_resetEmanueleSeNecessario\(\);/.test(code),"Reset automatico mancante");
assert(code.includes('nome === "Emanuele" &&') && code.includes('k.startsWith(_EPOCH_EMANUELE)'),
  "Manca la protezione dai vecchi dati Emanuele");
const start=code.indexOf("  /* MUSIC BOX RECAP:"),
      end=code.indexOf("  const _RECAP_MESI",start);
assert(start>0 && end>start,"Funzioni recap non trovate");
const ctx={_EPOCH_EMANUELE:"e-reset-20261031|",Map,Array,Object,Number,Math,Date,String};
vm.runInNewContext(code.slice(start,end)+"\nthis.recap=_riepilogoAnnoDaStats;",ctx);
const calc=ctx.recap;
const raw={
  "m:2026-11|aaa":{t:"Brano A",a:"Artista X",s:300,v:2},
  "m:2026-11|bbb":{t:"Brano B",a:"Artista Y",s:120,v:1},
  "m:2026-12|aaa":{t:"Brano A",a:"Artista X",s:600,v:3},
  "m:2027-01|aaa":{t:"Brano A",a:"Artista X",s:900,v:1},
  "aaa":{t:"Brano A",a:"Artista X",s:100000,v:999}
};
const r=calc(raw,2026,"Ste");
assert.equal(r.mesi.length,12);
assert.equal(r.secondi,1020);
assert.equal(r.ascolti,6);
assert.equal(r.mesi[10].secondi,420);
assert.equal(r.mesi[11].secondi,600);
assert.equal(r.braniDistinti,2);
assert.equal(r.topBrani[0].titolo,"Brano A");
assert.equal(r.topBrani[0].secondi,900);
assert.equal(r.mesePiuAscoltato.numero,12);
assert.equal(calc(raw,2027,"Ste").secondi,900);
assert.equal(calc(raw,2025,"Ste").secondi,0);
const er=calc({
  "m:2026-11|vecchi":{t:"Vecchio",a:"A",s:9000,v:5},
  "m:2026-11|e-reset-20261031|nuovi":{t:"Nuovo",a:"B",s:30,v:1}
},2026,"Emanuele");
assert.equal(er.secondi,30);
console.log("OK: 12 mesi, totale, top annuale, isolamento anni e reset solo Emanuele");
