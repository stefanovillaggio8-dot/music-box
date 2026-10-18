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

/* Ste: "se premo importa da spotify non apre nulla".
   Prima il bottone era collegato dentro app.js, dentro un try/catch che
   si mangiava ogni errore: se qualcosa andava storto non succedeva
   niente e non si capiva perche'. Ora il collegamento sta qui, vicino al
   resto di Spotify, e se un errore capita lo dice a voce invece di
   fallire in silenzio. */
/* Ste: "se premo importa da spotify non apre nulla" e poi, anche dopo la
   correzione: "non mi dice niente e non apre niente".

   Il fatto che non dicesse NULLA era l'indizio: se il codice di errore fosse
   partito, avrebbe scritto qualcosa. Non partiva niente, quindi il tap non
   arrivava al bottone, oppure il pannello restava nascosto e la scritta di
   errore finiva su un pannello che non si vedeva.

   Per questo adesso il pannello si rende VISIBILE al primo tocco, prima di
   fare qualsiasi altra cosa. Se poi qualcosa va storto, la scritta di
   errore resta dentro il pannello, dove la si vede, e non solo in un avviso
   che passa via. */
function _spotifySicuro(s) {
  return String(s).replace(/[&<>]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
  });
}

let _ultimoTapSpotify = 0;

function _spotifyApri() {
  /* il bottone puo' ricevere due eventi per un tocco (listener + onclick):
     se arriva subito un secondo evento lo lascio passare, non rifaccio
     tutto un'altra volta */
  const ora = Date.now();
  if (ora - _ultimoTapSpotify < 800) return;
  _ultimoTapSpotify = ora;

  let p = null;
  try { p = $("spotifyPanel"); } catch (e) { p = null; }

  /* passo 1: mostrare qualcosa, subito */
  try {
    if (!p) throw new Error("il pannello di Spotify non c'e' nella pagina");
    p.hidden = false;
    $("spotifyTitolo").textContent = "Spotify";
    $("spotifySotto").textContent = "un attimo...";
    $("spotifyCorpo").innerHTML = '<p class="step-hint">Sto aprendo...</p>';
    document.body.classList.add("no-scroll");
  } catch (errore) {
    try { toast("Spotify non si apre: " + (errore && errore.message ? errore.message : String(errore)), 8000); } catch (e) {}
    return;
  }

  /* passo 2: chiudere il menu Altro e aprire il contenuto vero */
  try { if (typeof _chiudiAltro === "function") _chiudiAltro(); } catch (e) { /* noop */ }
  try {
    _spotifyMenu();
  } catch (errore) {
    const che = (errore && errore.message) ? errore.message : String(errore);
    try {
      p.hidden = false;
      $("spotifyTitolo").textContent = "Spotify non si apre";
      $("spotifySotto").textContent = "";
      $("spotifyCorpo").innerHTML =
        '<p class="step-hint">' + _spotifySicuro(che) + "</p>";
    } catch (e) { /* noop */ }
    try { toast("Spotify non si apre: " + che, 8000); } catch (e) {}
  }
}
if (typeof window !== "undefined") { try { window._spotifyApri = _spotifyApri; } catch (e) {} }

function _spotifyAggancia() {
  const bs = $("btnSpotify");
  if (bs && !bs._collegatoSpotify) {
    bs._collegatoSpotify = true;
    bs.addEventListener("click", _spotifyApri);
  }
  const sc = $("spotifyChiudi");
  if (sc && !sc._collegatoSpotify) {
    sc._collegatoSpotify = true;
    sc.addEventListener("click", _spotifyChiudi);
  }
  const p = $("spotifyPanel");
  if (p && !p._collegatoSpotify) {
    p._collegatoSpotify = true;
    p.addEventListener("click", (e) => { if (e.target === p) _spotifyChiudi(); });
  }
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _spotifyAggancia);
  } else {
    _spotifyAggancia();
  }
}