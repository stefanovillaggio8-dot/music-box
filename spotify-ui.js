/* ---------- La parte con cui Ste sceglie e avvia ----------

   Il flusso che aveva descritto lui:
   "premo importa le playlist di spotify, lo premo e mi dice di fare l'accesso,
    se dico sì lo fa, scelgo la playlist da importare, e se dico no non fa
    niente e l'app funziona come è ora".
   E: se il computer è spento, la lista si mette in coda e parte quando si
   accende. */
function _spotifyPnl(titolo, sotto, html) {
  const p = $("spotifyPanel");
  if (!p) return;
  $("spotifyTitolo").textContent = titolo;
  $("spotifySotto").textContent = sotto || "";
  $("spotifyCorpo").innerHTML = html || "";
  p.hidden = false;
  syncNoScroll();
}
function _spotifyChiudi() {
  const p = $("spotifyPanel");
  if (p) p.hidden = true;
  try { document.body.classList.remove("no-scroll"); } catch (e) { /* noop */ }
  syncNoScroll();
}

function _spotifyParla(variabile, testo) {
  const codice = (function () {
    try {
      const q = new URLSearchParams(window.location.search);
      return q.get(variabile) || "";
    } catch (e) { return ""; }
  })();
  return { codice: codice, testo: testo };
}

/* Il pulsante del menu. */
function _spotifyMenu() {
  if (_spotifyToken()) {
    _spotifyMostraPlaylist();
    return;
  }
  _spotifyPnl("Collegare Spotify",
    "",
    '<p class="step-hint">Per vedere le tue playlist serve l\'accesso al tuo ' +
    'account Spotify. Me lo dai una volta sola, non ti chiedo la password e ' +
    'il permesso vale solo su questo telefono.</p>' +
    '<button class="btn-main" id="spotifyAccedi">Accedi con Spotify</button>' +
    '<button class="btn-main" id="spotifySalta" style="margin-top:10px">Non ora</button>');
  $("spotifyAccedi").addEventListener("click", () => { _spotifyChiudi(); _spotifyAccedi(); });
  $("spotifySalta").addEventListener("click", () => {
    _spotifyChiudi();
    toast("Nessun problema, l'app resta come e'");
  });
}

async function _spotifyMostraPlaylist() {
  _spotifyPnl("Le tue playlist", "sto leggendo...", '<p class="step-hint">Un attimo...</p>');
  const tutte = await _spotifyPlaylist();
  if (!tutte.length) {
    _spotifyPnl("Playlist", "",
      '<p class="step-hint">Non sono riuscito a leggere le tue playlist. ' +
      'Prova a collegare Spotify di nuovo.</p>');
    return;
  }
  let html = '<p class="step-hint">Tocca la playlist da importare. Le canzoni ' +
    'che hai gia\' non vengono copiate due volte.</p><div class="spotify-lista">';
  for (const p of tutte) {
    html += '<button class="spotify-riga" data-id="' + p.id + '">' +
      '<span class="spotify-nome">' + p.nome + "</span>" +
      '<span class="spotify-quante">' + p.canzoni + " canzoni" +
      (p.privata ? " · privata" : "") + "</span></button>";
  }
  html += "</div>" +
    '<button class="btn-main" id="spotifyEsci" style="margin-top:12px">Chiudi</button>';
  _spotifyPnl("Le tue playlist", tutte.length + " playlist", html);

  for (const b of document.querySelectorAll(".spotify-riga")) {
    b.addEventListener("click", () => { _spotifyImporta(b.getAttribute("data-id")); });
  }
  $("spotifyEsci").addEventListener("click", _spotifyChiudi);
}

/* Leggo la lista e la mando al computer. */
async function _spotifyImporta(playlistId) {
  _spotifyPnl("Sto leggendo la playlist", "un attimo...", '<p class="step-hint">Prendo i titoli...</p>');
  const brani = await _spotifyBrani(playlistId);
  if (!brani.length) {
    _spotifyPnl("Playlist", "", '<p class="step-hint">Questa playlist non ha brani che posso usare.</p>');
    return;
  }
  /* Tolgo subito i doppioni interni: due brani uguali nella stessa lista non
     mi servono due volte. */
  const visti = new Set();
  const uniche = [];
  for (const b of brani) {
    const k = b.toLowerCase();
    if (visti.has(k)) continue;
    visti.add(k);
    uniche.push(b);
  }
  const profilo = profile;
  const riga = '<p class="step-hint"><b>' + uniche.length + " canzoni</b> da " +
    profilo + ".</p><p class=\"step-hint\">Se il computer e' spento non e' un " +
    "problema: restano in coda e partono quando lo accendi.</p>" +
    '<button class="btn-main" id="spotifyManda">Scarica ora</button>' +
    '<button class="btn-main" id="spotifyAnnulla" style="margin-top:10px">Annulla</button>';
  _spotifyPnl("Playlist pronta", uniche.length + " canzoni", riga);
  $("spotifyAnnulla").addEventListener("click", _spotifyChiudi);
  $("spotifyManda").addEventListener("click", () => { _spotifyMandaLista(uniche, profilo); });
}

/* Il passaggio vero: se il computer c'e' gliele mando subito, altrimenti le
   metto da parte e riprovo piu' tardi da sola. */
async function _spotifyMandaLista(lista, profilo) {
  const chiave = "mb.codaSpotify";
  const giunto = await ponteOnline();
  if (!giunto) {
    try { LS.set(chiave, { lista: lista, profilo: profilo, quando: Date.now() }); } catch (e) {}
    _spotifyChiudi();
    toast("Computer spento: le " + lista.length + " canzoni aspettano che lo accenda", 6000);
    return;
  }
  _spotifyPnl("Sto mandando al computer", lista.length + " canzoni", '<p class="step-hint">Un attimo...</p>');
  try {
    const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
    const r = await fetch(base + "/spotify-lista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilo: profilo, lista: lista })
    });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      _spotifyPnl("Non e' andata", "", '<p class="step-hint">' +
        (j && j.errore ? j.errore : "il computer non ha accettato la lista") + "</p>");
      return;
    }
    _spotifyChiudi();
    toast("Fatto: il computer scarica " + lista.length + " canzoni. Ci mette un po'.", 6000);
    _spotifyControllaLavoro(j.id, lista.length);
  } catch (e) {
    _spotifyPnl("Non e' andata", "", '<p class="step-hint">Non riesco a parlare con il computer.</p>');
  }
}

/* Se il computer era spento, quando si accende riprovo da sola. */
async function _spotifyRiprovaCoda() {
  let coda = null;
  try { coda = LS.get("mb.codaSpotify", null); } catch (e) {}
  if (!coda || !coda.lista || !coda.lista.length) return;
  if (!(await ponteOnline())) return;
  try {
    const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
    const r = await fetch(base + "/spotify-lista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilo: coda.profilo, lista: coda.lista })
    });
    if (r.ok) {
      const j = await r.json();
      LS.remove("mb.codaSpotify");
      toast("Ripresa la lista che aspettava: " + coda.lista.length + " canzoni", 6000);
      _spotifyControllaLavoro(j.id, coda.lista.length);
    }
  } catch (e) { /* noop */ }
}

/* Chiedo come sta andando, cosi' Ste non resta a pensare che sia finito. */
async function _spotifyControllaLavoro(id, totale) {
  let tentativi = 0;
  const guarda = async () => {
    if (tentativi++ > 400) return;
    let j = null;
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/spotify-stato?id=" + encodeURIComponent(id));
      if (r.ok) j = await r.json();
    } catch (e) { /* noop */ }
    if (!j) { setTimeout(guarda, 4000); return; }
    const fatto = Number(j.fatto || 0);
    if (j.stati === "fatto") {
      toast("Fatto: " + fatto + " canzoni scaricate e messe in libreria", 8000);
      return;
    }
    if (j.stati && String(j.stati).indexOf("errore") === 0) {
      toast("Il computer ha avuto un problema: " + j.stati, 8000);
      return;
    }
    if (fatto > 0) toast("Scaricate " + fatto + " di " + (totale || j.totale || "?") + "…", 2500);
    setTimeout(guarda, 5000);
  };
  setTimeout(guarda, 3000);
}

/* Se Spotify mi rimanda qui dopo il login, chiudo la finestrella e faccio
   partire tutto senza toccare niente. */
async function _spotifyRientro() {
  let q = null;
  try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
  const code = q.get("code") || "";
  const stato = q.get("state") || "";
  const errore = q.get("error") || "";
  if (!code && !errore) return;
  try {
    history.replaceState({}, document.title, window.location.pathname);
  } catch (e) { /* noop */ }
  if (errore) { toast("Non hai concesso Spotify: " + errore, 6000); return; }
  const ok = await _spotifyCompletaAccesso(code, stato);
  if (!ok) return;
  toast("Collegato a Spotify", 4000);
  _spotifyMostraPlaylist();
}