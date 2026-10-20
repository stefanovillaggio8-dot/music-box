/* ============================================================================
   FUOCO - la copertina che brucia, dentro il Music Box.

   Ste (20/10/2026): "vai mettilo su musicbox. mi piace come e' in questa
   ultimo link".

   Questo file sta APPARTE a parte perche' la cartella music-box e' un
   clone git che si aggiorna da solo: app.js e sw.js vengono ripristinati
   con "git checkout", quindi ogni modifica li' sparisce. Qui dentro non
   c'e' niente che l'aggiornamento tocchi.

   Va caricato PRIMA di app.js (per agganciare l'elemento audio che l'app
   crea con new Audio()).

   L'effetto e' quello della prova (cartella musica-prova):
   - la copertina si carbonizza dai bordi, il confine e' ONDULATO;
   - le fiamme sono appoggiate sulla linea di bruciatura e salgono in alto;
   - le bragia saltano;
   - a fine brano non resta piu' niente della copertina.

   E poi (20/10/2026, Ste): "il fuoco fa tipo a impulsi come se battesse,
   togli sta cosa. si puo' fare che si vede il fuoco che si muove pure
   quando vedo dalle notifiche la canzone in corso?"

   - gli impulsi: venivano dal fatto che le fiamme venivano ricreate da
     zero (innerHTML) a ogni aggiornamento: l'animazione ripartiva e
     sembrava un battito. Adesso le fiamme restano le stesse e si spostano
     solo.
   - le notifiche: la copertina che brucia viene disegnata su un canvas e
     pubblicata come artwork della media session, cosi' la si vede anche
     nel pannello delle notifiche / blocco schermo del telefono.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1. L'elemento audio
     L'app lo crea con "new Audio()" e lo tiene in una variabile interna
     (non si vede nel DOM). Per sapere a che punto e' il brano aggancio il
     costruttore Audio PRIMA che l'app lo usi.
     -------------------------------------------------------------------------- */
  var catalogAudio = [];
  try {
    var AudioOriginale = window.Audio;
    function AudioAgganciato(src) {
      var a = new AudioOriginale(src);
      catalogAudio.push(a);
      if (catalogAudio.length > 10) catalogAudio.shift();
      return a;
    }
    AudioAgganciato.prototype = AudioOriginale.prototype;
    window.Audio = AudioAgganciato;
  } catch (e) { /* uso i tempi scritti a schermo */ }

  /* --------------------------------------------------------------------------
     2. Lo stile
     -------------------------------------------------------------------------- */
  var CSS = [
    ".mb-fuoco{position:fixed;left:0;top:0;z-index:60;pointer-events:none;overflow:visible}",
    ".mb-fuoco .mb-dentro{position:absolute;inset:0;pointer-events:none;overflow:visible}",
    ".mb-fuoco .mb-strato-char{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}",
    ".mb-fuoco .mb-strato-char svg{width:100%;height:100%;display:block}",
    ".mb-fuoco .mb-calore{position:absolute;pointer-events:none;z-index:3;border-radius:50%;",
    "  background:radial-gradient(circle,rgba(255,120,10,.45) 0%,rgba(255,60,0,.22) 52%,rgba(255,40,0,0) 74%)}",
    ".mb-fuoco .mb-brasa{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;opacity:.9}",
    ".mb-fuoco .mb-fiamme{position:absolute;inset:0;pointer-events:none;z-index:5}",
    ".mb-fuoco .mb-fiamma{position:absolute;pointer-events:none;transform-origin:50% 100%}",
    ".mb-fuoco .mb-fiamma svg{width:100%;height:100%;display:block;overflow:visible;",
    "  animation:mbSfarfalla .34s linear infinite alternate}",
    "@keyframes mbSfarfalla{0%{transform:scale(1,1) rotate(-3deg)}",
    "  50%{transform:scale(.94,1.10) rotate(2deg)}",
    "  100%{transform:scale(1.04,.96) rotate(-1.5deg)}}",
    ".mb-fuoco .mb-bragia{position:absolute;inset:0;pointer-events:none;z-index:5}",
    ".mb-fuoco .mb-bragia i{position:absolute;border-radius:50%;",
    "  background:radial-gradient(circle,#ffe6a0 0%,#ff7a10 50%,rgba(255,80,0,0) 100%);",
    "  animation:mbBragiaSale 3.4s linear infinite}",
    "@keyframes mbBragiaSale{0%{transform:translate(0,0) scale(1);opacity:0}",
    "  12%{opacity:.95}72%{opacity:.7}",
    "  100%{transform:translate(var(--mbdx,8px),-42px) scale(.15);opacity:0}}",
    ".mb-fuoco-defs{position:absolute;width:0;height:0;overflow:hidden}"
  ].join("\n");

  function mettiStile() {
    if (document.getElementById("mb-fuoco-stile")) return;
    var st = document.createElement("style");
    st.id = "mb-fuoco-stile";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* I filtri e i gradienti del fuoco (identici a quelli della prova). */
  var DEFS = '<svg class="mb-fuoco-defs" aria-hidden="true"><defs>' +
    '<filter id="mbGrana" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" seed="9" result="n"/>' +
      '<feColorMatrix in="n" type="saturate" values="0" result="ng"/>' +
      '<feComposite in="ng" in2="SourceGraphic" operator="in" result="txt"/>' +
      '<feBlend in="SourceGraphic" in2="txt" mode="multiply"/>' +
    '</filter>' +
    '<filter id="mbBagliore" x="-80%" y="-40%" width="260%" height="200%">' +
      '<feGaussianBlur stdDeviation="6" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    '</filter>' +
    '<filter id="mbCenere" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feGaussianBlur stdDeviation="1.1"/>' +
    '</filter>' +
    '<filter id="mbCalore" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="3"/>' +
    '</filter>' +
    '<linearGradient id="mbFiamma" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0%" stop-color="#fffdf2"/><stop offset="16%" stop-color="#ffe98c"/>' +
      '<stop offset="42%" stop-color="#ffa617"/><stop offset="72%" stop-color="#f45300"/>' +
      '<stop offset="90%" stop-color="rgba(205,38,0,.5)"/>' +
      '<stop offset="100%" stop-color="rgba(160,15,0,0)"/>' +
    '</linearGradient>' +
    '<linearGradient id="mbCuore" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#fff6cf"/>' +
      '<stop offset="75%" stop-color="#ffd061"/><stop offset="100%" stop-color="rgba(255,180,40,0)"/>' +
    '</linearGradient>' +
  '</defs></svg>';

  /* Il disegno di una fiamma, in un quadrato 60x160: la base e' in basso
     (y = 147) e la punta in alto (y = 2). Serve sia all'SVG (nella pagina)
     sia al canvas (per la notifica). */
  var PERCORSO_FIAMMA = "M27 2 C 33 18 21 27 17 43 C 11 64 11 88 17 112 C 21 129 27 141 30 147 " +
                        "C 34 140 39 127 42 109 C 46 86 45 62 40 42 C 37 27 24 20 27 2 Z";
  var PERCORSO_CUORE = "M29.4 60 C 30.6 70 27.6 76 27 85 C 26.4 94 28.4 102 30 106 " +
                       "C 31.6 102 33.6 94 33 85 C 32.4 76 29.4 70 29.4 60 Z";

  /* --------------------------------------------------------------------------
     3. Il disegno (uguale alla prova)
     -------------------------------------------------------------------------- */
  function arte(prog, seme) {
    var R = 45 * Math.pow(Math.max(0, 1 - prog), 1.15);
    var cx = 50 + Math.sin(prog * 3.1) * 1.2;
    var cy = 50 + Math.cos(prog * 2.3) * 1.2;
    var N = 120;
    var punti = [];
    var testo = "";
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2;
      var ca = Math.cos(a), sa = Math.sin(a);
      /* il confine e' ondulato come la carta bruciata: onde basse e
         morbide. Il rumore e' proporzionale a R, cosi' la forma resta
         uguale mentre la copertina si restringe (il bordo non vibra). */
      var rum = 0.55 * Math.sin(3 * a + seme)
              + 0.38 * Math.sin(5 * a + seme * 1.7)
              + 0.24 * Math.sin(8 * a + seme * 0.6)
              + 0.12 * Math.sin(13 * a + seme * 2.1);
      var t = R * 0.17 * rum;
      var x = cx + Math.sign(ca) * R * Math.pow(Math.abs(ca), 0.35) + t * ca;
      var y = cy + Math.sign(sa) * R * Math.pow(Math.abs(sa), 0.35) + t * sa;
      x = Math.max(0.5, Math.min(99.5, x));
      y = Math.max(0.5, Math.min(99.5, y));
      punti.push({ x: x, y: y });
      testo += x.toFixed(1) + "," + y.toFixed(1) + " ";
    }
    return { path: "M" + testo + "Z", punti: punti, R: R, cx: cx, cy: cy, seme: seme, prog: prog };
  }

  function stratoChar(a) {
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<path fill-rule="evenodd" d="M0 0 H100 V100 H0 Z ' + a.path + '" fill="#1b1611" filter="url(#mbGrana)"/>' +
      '<path fill-rule="evenodd" d="M0 0 H100 V100 H0 Z ' + a.path + '" fill="#080707" opacity=".72"/>' +
      '<path d="' + a.path + '" fill="none" stroke="#6b5847" stroke-width="3.4"' +
        ' stroke-linejoin="round" filter="url(#mbCenere)" opacity=".55"/>' +
      '<path d="' + a.path + '" fill="none" stroke="#191411" stroke-width="1.1"' +
        ' stroke-linejoin="round" opacity=".8"/>' +
    "</svg>";
  }

  function fiammaSVG() {
    return '<svg viewBox="0 0 60 160" preserveAspectRatio="xMidYMax meet">' +
      '<g filter="url(#mbBagliore)">' +
      '<path d="' + PERCORSO_FIAMMA + '" fill="url(#mbFiamma)"/>' +
      '<path d="' + PERCORSO_CUORE + '" fill="url(#mbCuore)"/>' +
      "</g></svg>";
  }

  function stratoCalore(a) {
    var lato = (a.R * 2 + 16).toFixed(1);
    return '<div class="mb-calore" style="width:' + lato + "%;height:" + lato + "%;left:" +
      (a.cx - lato / 2).toFixed(1) + "%;top:" + (a.cy - lato / 2).toFixed(1) +
      '%;opacity:' + (0.14 + 0.22 * Math.min(1, a.prog * 1.4)).toFixed(2) + '"></div>' +
      '<svg class="mb-brasa" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<path d="' + a.path + '" fill="none" stroke="#a8470a" stroke-width="3.5"' +
        ' stroke-linejoin="round" filter="url(#mbCalore)" opacity=".45"/>' +
      '<path d="' + a.path + '" fill="none" stroke="#6b2c05" stroke-width="1.6"' +
        ' stroke-linejoin="round" opacity=".7"/></svg>';
  }

  /* Le fiamme: poche, appoggiate sulla linea di bruciatura, e salgono.
     "lato" e' la dimensione in pixel della copertina: serve per dare alle
     fiamme una misura giusta anche su una copertina piccola (52 px).
     Ogni fiamma ha i suoi numeri casuali, scelti una volta sola: se li
     ricalcolassi a ogni fotogramma le fiamme "saltellerebbero". */
  function fiammeAttorno(a, lato) {
    var r = (function (s) {
      return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    })(a.seme + 7);
    var out = [];
    var N = a.punti.length;
    var ogni = Math.max(1, Math.round(N / 13));
    for (var i = 0; i < N; i += ogni) {
      var alt = lato * (0.11 + r() * 0.13) + lato * 0.07 * a.prog;
      if (r() < 0.18) alt = alt * 1.6;
      out.push({ i: i, alt: alt, larg: alt * (0.40 + r() * 0.16), attesa: r() * 0.9 });
    }
    return out;
  }

  function stratoBragia(lato) {
    var h = "";
    var d = Math.max(2, lato * 0.075);
    for (var i = 0; i < 26; i++) {
      var dx = (i % 2 === 0 ? 1 : -1) * (6 + (i * 7) % 16);
      h += '<i style="left:' + (4 + (i * 13) % 92).toFixed(0) + "%;top:" + (14 + (i * 17) % 76).toFixed(0) +
        "%;width:" + d.toFixed(1) + "px;height:" + d.toFixed(1) + "px;--mbdx:" + dx +
        "px;animation-duration:" + (2.6 + (i % 6) * 0.35).toFixed(2) + "s;animation-delay:" +
        (i * 0.19).toFixed(2) + 's"></i>';
    }
    return h;
  }

  /* --------------------------------------------------------------------------
     4. Il montaggio sulla copertina
     L'overlay vive nel body (position:fixed) perche' la copertina ha
     overflow:hidden e le fiamme devono poter uscire fuori.
     -------------------------------------------------------------------------- */
  function monta(art) {
    var box = document.createElement("div");
    box.className = "mb-fuoco";
    box.innerHTML =
      '<div class="mb-dentro">' +
        '<div class="mb-strato-char"></div>' +
        '<div class="mb-calore"></div>' +
        '<svg class="mb-brasa" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>' +
        '<div class="mb-fiamme"></div>' +
        '<div class="mb-bragia"></div>' +
      '</div>';
    document.body.appendChild(box);
    return box;
  }

  /* Il disco del player gira quando suona (6 secondi un giro). Il fuoco
     invece sta fermo: gli oppongo lo stesso giro al contrario.
     Lo faccio con un'animazione e non con il JavaScript a ogni
     fotogramma: altrimenti il telefono scatta e il fuoco pulsa. */
  var gira = null;
  var osservaGiro = null;

  function allineaGiro(art, box) {
    if (!box) return;
    var dentro = box.querySelector(".mb-dentro");
    if (!dentro) return;
    var suona = art.classList.contains("playing");
    if (suona && !gira) {
      try {
        gira = dentro.animate(
          [{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }],
          { duration: 6000, iterations: Infinity, easing: "linear" }
        );
      } catch (e) { gira = null; }
    } else if (!suona && gira) {
      try { gira.cancel(); } catch (e) { /* noop */ }
      gira = null;
      dentro.style.transform = "";
    }
  }

  function guardaGiro(art) {
    if (osservaGiro || !art) return;
    try {
      osservaGiro = new MutationObserver(function () { allineaGiro(art, stato.box); });
      osservaGiro.observe(art, { attributes: true, attributeFilter: ["class"] });
    } catch (e) { /* noop */ }
  }

  /* Il disco del player gira quando suona: il fuoco invece sta fermo,
     quindi gli oppongo la stessa rotazione. */
  function angoloGiro(el) {
    try {
      var m = getComputedStyle(el).transform;
      if (!m || m === "none") return 0;
      if (m.indexOf("matrix") === 0) {
        var p = m.replace(/[^0-9.,\-e]+/g, ",").split(",");
        return Math.atan2(parseFloat(p[1]), parseFloat(p[0])) * 180 / Math.PI;
      }
    } catch (e) { /* noop */ }
    return 0;
  }

  function secondi(txt) {
    if (!txt) return 0;
    var p = String(txt).split(":");
    var s = 0;
    for (var i = 0; i < p.length; i++) s = s * 60 + (parseFloat(p[i]) || 0);
    return s;
  }

  /* Scelgo l'elemento audio che sta suonando davvero: quello il cui tempo
     combacia con il tempo scritto sul player (l'anteprima dei brani usa un
     audio diverso e non deve confondermi). */
  function scegliAudio(tDom) {
    var migliore = null, diffMin = 3;
    for (var i = catalogAudio.length - 1; i >= 0; i--) {
      var a = catalogAudio[i];
      if (!a) continue;
      var t, d;
      try {
        if (!a.src) continue;
        t = a.currentTime;
        d = a.duration;
        if (!isFinite(d) || d <= 0) continue;
      } catch (e) { continue; }
      var diff = Math.abs(t - tDom);
      if (diff < diffMin) { diffMin = diff; migliore = a; }
    }
    return migliore;
  }

  /* --------------------------------------------------------------------------
     5. Il ciclo
     -------------------------------------------------------------------------- */
  var stato = {
    box: null,
    ultimoTitolo: "",
    progVisto: -1,      /* l'ultimo bruciato che ho visto */
    progChar: -1,       /* l'ultimo bruciato disegnato nella crosta */
    progFiamme: -1,     /* l'ultimo bruciato a cui ho mosso le fiamme */
    x: -1, y: -1, lato: -1, altezza: -1,
    progNotifica: -1,
    tPrecedente: 0,
    seme: 7,
    fiamme: [],         /* le fiamme vive: non le ricreo piu' */
    ultimoArtwork: ""
  };

  /* La crosta (il nero che morde la copertina) */
  function disegnaChar(prog) {
    var box = stato.box;
    var a = arte(prog, stato.seme);
    var sc = box.querySelector(".mb-strato-char");
    sc.innerHTML = stratoChar(a);
    /* il nero deve avere la stessa forma della copertina (rotonda quando
       suona il disco, quadrata quando no) */
    var art = document.getElementById("playerArt");
    try { sc.style.borderRadius = getComputedStyle(art).borderRadius; } catch (e) { /* noop */ }

    var vecchioCalore = box.querySelector(".mb-calore");
    if (vecchioCalore) vecchioCalore.remove();
    var vecchiaBrasa = box.querySelector(".mb-brasa");
    if (vecchiaBrasa) vecchiaBrasa.remove();
    var temp = document.createElement("div");
    temp.innerHTML = stratoCalore(a);
    /* il calore e la brasa vanno dentro .mb-dentro, davanti alle fiamme */
    var dentro = box.querySelector(".mb-dentro") || box;
    var rif = dentro.querySelector(".mb-fiamme");
    while (temp.firstChild) dentro.insertBefore(temp.firstChild, rif);
    stato.progChar = prog;
  }

  /* Le fiamme: si creano una volta sola e poi si spostano. Se le
     ricreassi a ogni fotogramma l'animazione ripartireebbe da capo e il
     fuoco sembrerebbe battere (e Ste l'ha visto: "fa tipo a impulsi"). */
  function preparaFiamme(prog, lato) {
    var box = stato.box;
    var a = arte(prog, stato.seme);
    stato.fiamme = fiammeAttorno(a, lato);
    var contenitore = box.querySelector(".mb-fiamme");
    contenitore.innerHTML = "";
    for (var k = 0; k < stato.fiamme.length; k++) {
      var f = stato.fiamme[k];
      var el = document.createElement("div");
      el.className = "mb-fiamma";
      el.innerHTML = fiammaSVG();
      el.style.animationDelay = "-" + f.attesa.toFixed(2) + "s";
      contenitore.appendChild(el);
      f.el = el;
    }
  }

  function spostaFiamme(a, lato) {
    for (var k = 0; k < stato.fiamme.length; k++) {
      var f = stato.fiamme[k];
      if (!f.el) continue;
      var p = a.punti[f.i];
      if (!p) continue;
      var ux = p.x - a.cx, uy = p.y - a.cy;
      var lun = Math.sqrt(ux * ux + uy * uy) || 1;
      ux /= lun; uy /= lun;
      /* IL FUOCO SALE: le fiamme leccano verso l'alto, con una piccola
         inclinazione verso l'esterno. */
      var vx = ux * 0.38, vy = uy * 0.38 - 1.0;
      /* la punta della fiamma guarda verso (sin t, -cos t): per puntarla
         verso (vx, vy) serve t = atan2(vx, -vy) */
      var ang = Math.atan2(vx, -vy) * 180 / Math.PI;
      var alt = f.alt * (0.75 + 0.25 * (a.R / 45));
      f.el.style.left = p.x.toFixed(2) + "%";
      f.el.style.top = p.y.toFixed(2) + "%";
      f.el.style.height = alt.toFixed(1) + "px";
      f.el.style.width = (alt * 0.42).toFixed(1) + "px";
      f.el.style.transform = "translate(-50%,-100%) rotate(" + ang.toFixed(1) + "deg)";
    }
  }

  function ciclo() {
    try {
      var art = document.getElementById("playerArt");
      var titolo = document.getElementById("playerTitle");
      var cur = document.getElementById("curTime");
      var tot = document.getElementById("totTime");
      if (!art || !cur || !tot) { requestAnimationFrame(ciclo); return; }

      /* la copertina cambia -> il bruciato ricomincia */
      var titoloOra = titolo ? titolo.textContent : "";
      if (titoloOra !== stato.ultimoTitolo) {
        stato.ultimoTitolo = titoloOra;
        stato.progVisto = -1;
        stato.progChar = -1;
        stato.progNotifica = -1;
        stato.tPrecedente = 0;
        stato.seme = (stato.seme * 7 + 13) % 997;
      }

      var tDom = secondi(cur.textContent);
      var dur = secondi(tot.textContent);
      var audio = scegliAudio(tDom);
      var suona = audio ? (!audio.paused && !audio.ended) : art.classList.contains("playing");
      var t = tDom;
      if (audio && isFinite(audio.currentTime)) t = audio.currentTime;

      /* il tempo e' tornato indietro: brano nuovo o riavvolto */
      if (t < stato.tPrecedente - 1.5) { stato.progVisto = -1; stato.progChar = -1; }
      stato.tPrecedente = t;

      var prog = stato.progVisto;
      if (suona && dur > 0) prog = Math.max(0, Math.min(1, t / dur));
      else if (prog < 0) prog = 0;

      if (prog !== stato.progVisto) {
        stato.progVisto = prog;
        /* se e' sparito tutto, la copertina non c'e' piu': niente fuoco */
        if (prog <= 0.001) {
          if (stato.box) { stato.box.remove(); stato.box = null; stato.fiamme = []; }
          requestAnimationFrame(ciclo);
          return;
        }
      }

      if (!stato.box) {
        mettiStile();
        if (!document.querySelector(".mb-fuoco-defs")) {
          var d = document.createElement("div");
          d.innerHTML = DEFS;
          document.body.appendChild(d.firstChild);
        }
        stato.box = monta(art);
        stato.fiamme = [];
        stato.progChar = -1;
        stato.x = -1; stato.y = -1; stato.lato = -1; stato.altezza = -1;
        guardaGiro(art);
        allineaGiro(art, stato.box);
      }

      /* La posizione si mette con un transform: left/top farebbero
         layout + ridisegno a ogni fotogramma e il telefono scattava
         (il fuoco sembrava battere). */
      var r = art.getBoundingClientRect();
      if (stato.lato !== r.width || stato.altezza !== r.height) {
        stato.lato = r.width;
        stato.altezza = r.height;
        stato.box.style.width = r.width + "px";
        stato.box.style.height = r.height + "px";
      }
      if (stato.x !== r.left || stato.y !== r.top) {
        stato.x = r.left;
        stato.y = r.top;
        stato.box.style.transform = "translate(" + r.left.toFixed(1) + "px," + r.top.toFixed(1) + "px)";
      }

      var a = arte(prog, stato.seme);
      /* Il fuoco NON si sposta a ogni fotogramma. Le fiamme hanno un
         filtro di sfocatura: muoverle 60 volte al secondo fa scattare il
         telefono e il fuoco sembra battere (Ste: "il fuoco pulsa come se
         battesse"). Le muovo solo quando il bruciato e' cambiato un po':
         i passi sono troppo piccoli per vedersi, l'animazione gira
         liscia. */
      var cambiato = Math.abs(prog - stato.progChar) > 0.01;
      if (cambiato) disegnaChar(prog);
      if (!stato.fiamme.length) preparaFiamme(prog, r.width);
      if (cambiato || stato.progFiamme < 0) {
        spostaFiamme(a, r.width);
        stato.progFiamme = prog;
      }
      if (!stato.box.querySelector(".mb-bragia").childNodes.length) {
        stato.box.querySelector(".mb-bragia").innerHTML = stratoBragia(r.width);
      }

  /* Ste: "appena la musica e' praticamente finita ed e' tutto nero, togli le
  fiamme e lascia soltanto le particelle".
  Motivo: col bruciato quasi finito lo schermo diventa nero, ma le fiamme
  continuavano a ballare sopra il nero e sembrava un errore. Adesso, quando il
  bruciato e' quasi finito, le fiamme spariscono (con una sfumatura lenta,
  non di colpo) e resta solo la bragia: le particelle che salgono. */
  var quasiFinita = prog > 0.90;
  var contFiamme = stato.box.querySelector(".mb-fiamme");
  var calore = stato.box.querySelector(".mb-calore");
  var bragia = stato.box.querySelector(".mb-bragia");
  if (quasiFinita) {
  if (contFiamme.style.opacity !== "0") {
  contFiamme.style.transition = "opacity 1.1s ease";
  contFiamme.style.opacity = "0";
  }
  if (calore) {
  if (!calore.style.transition) calore.style.transition = "opacity 1.1s ease";
  if (calore.style.opacity !== "0") calore.style.opacity = "0";
  }
  } else {
  if (contFiamme.style.opacity === "0") {
  contFiamme.style.transition = "opacity .5s ease";
  contFiamme.style.opacity = "";
  }
  if (calore && calore.style.opacity === "0") calore.style.opacity = "";
  }
  /* Quando spariscono le fiamme, le particelle restano sole e un filo piu'
  luminose: e' l'unica cosa che si vede sul nero. */
  if (!bragia.style.transition) bragia.style.transition = "opacity 1.1s ease";
  if (bragia.style.opacity !== (quasiFinita ? "1" : "")) bragia.style.opacity = quasiFinita ? "1" : "";

      /* la copertina che brucia anche nelle notifiche del telefono */
      aggiornaNotifica(prog, suona);
    } catch (e) { /* il fuoco non deve mai far cadere l'app */ }
    requestAnimationFrame(ciclo);
  }

  /* --------------------------------------------------------------------------
     6. Le notifiche del telefono
     La copertina che brucia viene disegnata su un canvas e pubblicata come
     artwork della media session: cosi' si vede anche nel pannello delle
     notifiche e nella schermata di blocco.
     -------------------------------------------------------------------------- */
  var tela = null, ctxTela = null;
  var imgCopertina = null, urlCopertina = "";

  function preparaTela() {
    if (tela) return;
    try {
      tela = document.createElement("canvas");
      tela.width = 256;
      tela.height = 256;
      ctxTela = tela.getContext("2d");
    } catch (e) { /* noop */ }
  }

  function caricaCopertina(url) {
    if (!url || url === urlCopertina) return;
    urlCopertina = url;
    try {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { imgCopertina = img; };
      img.onerror = function () { imgCopertina = null; };
      img.src = url;
    } catch (e) { /* noop */ }
  }

  /* una fiamma sul canvas.
     ATTENZIONE: i gradienti si creano PRIMA delle trasformazioni della
     tela. Se li creo dopo (nello spazio trasformato) il gradiente viene
     interpretato con le coordinate sbagliate e la fiamma esce tutta
     bianca: me l'ha fatto vedere il test. */
  function fiammaCanvas(x, y, h, ang) {
    var s = h / 160;
    var rad = ang * Math.PI / 180;
    var dx = Math.sin(rad), dy = -Math.cos(rad);
    /* gradiente nella spazio della tela: dalla base alla punta */
    var g = ctxTela.createLinearGradient(x, y, x + dx * h, y + dy * h);
    g.addColorStop(0, "#fffdf2");
    g.addColorStop(0.08, "#ffe07a");
    g.addColorStop(0.25, "#ffa617");
    g.addColorStop(0.50, "#f45300");
    g.addColorStop(0.80, "rgba(205,38,0,.55)");
    g.addColorStop(1, "rgba(160,15,0,0)");
    var gc = ctxTela.createLinearGradient(x, y, x + dx * h * 0.72, y + dy * h * 0.72);
    gc.addColorStop(0, "rgba(255,252,235,.9)");
    gc.addColorStop(0.35, "rgba(255,235,170,.45)");
    gc.addColorStop(1, "rgba(255,205,90,0)");

    ctxTela.save();
    ctxTela.translate(x, y);
    ctxTela.rotate(rad);
    ctxTela.scale(s, s);
    ctxTela.translate(-30, -147);
    ctxTela.shadowColor = "rgba(255,120,20,.8)";
    ctxTela.shadowBlur = 12;
    ctxTela.fillStyle = g;
    ctxTela.fill(new Path2D(PERCORSO_FIAMMA));
    ctxTela.shadowBlur = 0;
    /* il cuore: sfumato, altrimenti sembra una macchia bianca */
    ctxTela.fillStyle = gc;
    ctxTela.fill(new Path2D(PERCORSO_CUORE));
    ctxTela.restore();
  }

  function copertinaCheBrucia(prog) {
    if (!imgCopertina || !ctxTela) return "";
    var L = tela.width;
    var a = arte(prog, stato.seme);
    try {
      ctxTela.clearRect(0, 0, L, L);
      /* la copertina */
      var w = imgCopertina.naturalWidth || L, h = imgCopertina.naturalHeight || L;
      var lato = Math.max(w, h);
      ctxTela.drawImage(imgCopertina, (L - w) / 2 - (lato - w) / 2, (L - h) / 2 - (lato - h) / 2, lato, lato);
      /* la crosta carbonizzata */
      ctxTela.save();
      ctxTela.scale(L / 100, L / 100);
      ctxTela.fillStyle = "#0a0807";
      ctxTela.fill(new Path2D("M0 0 H100 V100 H0 Z " + a.path), "evenodd");
      ctxTela.strokeStyle = "rgba(96,74,54,.75)";
      ctxTela.lineWidth = 2.4;
      ctxTela.lineJoin = "round";
      ctxTela.shadowColor = "rgba(90,68,50,.7)";
      ctxTela.shadowBlur = 4;
      ctxTela.stroke(new Path2D(a.path));
      ctxTela.shadowBlur = 0;
      ctxTela.restore();
      /* le fiamme sulla linea di bruciatura */
      var ogni = Math.max(1, Math.round(a.punti.length / 13));
      for (var i = 0; i < a.punti.length; i += ogni) {
        var p = a.punti[i];
        var ux = p.x - a.cx, uy = p.y - a.cy;
        var lun = Math.sqrt(ux * ux + uy * uy) || 1;
        ux /= lun; uy /= lun;
        var vx = ux * 0.38, vy = uy * 0.38 - 1.0;
        var ang = Math.atan2(vx, -vy) * 180 / Math.PI;
        var alt = L * (0.12 + 0.12 * ((i * 7) % 5) / 5) + L * 0.06 * a.prog;
        fiammaCanvas(p.x / 100 * L, p.y / 100 * L, alt, ang);
      }
      return tela.toDataURL("image/jpeg", 0.82);
    } catch (e) { /* il canvas non e' disegnabile: lascio com'e' */ }
    return "";
  }

  /* Il telefono vuole un indirizzo vero: iOS non accetta le immagini
     "data:" come copertina della notifica (si vede solo un quadrato
     vuoto). Quindi mando il disegno al server, che lo salva, e uso
     l'indirizzo del file. Se il server non c'e' (per esempio la versione
     su internet) uso il "data:" come riserva. */
  function mettiArtwork(src) {
    try {
      var meta = navigator.mediaSession.metadata;
      if (!meta) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title || "",
        artist: meta.artist || "",
        album: meta.album || "",
        artwork: [{ src: src, sizes: "256x256", type: src.indexOf("data:") === 0 ? "image/jpeg" : "image/png" }]
      });
      stato.ultimoArtwork = src;
    } catch (e) { /* il browser non accetta l'artwork: lascio com'e' */ }
  }

  /* Il telefono prende il Music Box da internet (github.io), quindi la
     copertina bruciata va chesta al computer di casa: e' l'unico modo
     che ha il telefono per arrivare al file. Gli indirizzi sono gli
     stessi che usa l'app per scaricare i brani. */
  var INDIRIZZI_PONTE = [
    "http://127.0.0.1:8788",
    "http://192.168.1.40:8788",
    "http://192.168.1.2:8788",
    "http://100.106.211.2:8788"
  ];
  var ponteFuoco = "";
  var giriPonte = 0;

  function mandaAlPonte(blob, finito) {
    if (ponteFuoco) { inviaAlPonte(ponteFuoco, blob, finito); return; }
    if (giriPonte >= INDIRIZZI_PONTE.length) { giriPonte = 0; finito(""); return; }
    var a = INDIRIZZI_PONTE[giriPonte++];
    try {
      fetch(a + "/app/fuoco-notifica.png", { method: "POST", body: blob, cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("http " + r.status);
          ponteFuoco = a;
          giriPonte = 0;
          inviaAlPonte(a, blob, finito);
        })
        .catch(function () { mandaAlPonte(blob, finito); });
    } catch (e) { mandaAlPonte(blob, finito); }
  }

  function inviaAlPonte(indirizzo, blob, finito) {
    try {
      fetch(indirizzo + "/app/fuoco-notifica.png", { method: "POST", body: blob, cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
        .then(function () { finito(indirizzo); })
        .catch(function () { finito(""); });
    } catch (e) { finito(""); }
  }

  function pubblicaNotifica(prog) {
    if (!imgCopertina || !ctxTela) return;
    var bruciata = copertinaCheBrucia(prog);
    if (!bruciata) return;
    try {
      if (tela.toBlob) {
        tela.toBlob(function (blob) {
          if (!blob) { mettiArtwork(bruciata); return; }
          mandaAlPonte(blob, function (indirizzo) {
            if (!indirizzo) { mettiArtwork(bruciata); return; }
            /* la notifica prende l'indirizzo del computer di casa */
            mettiArtwork(indirizzo + "/app/fuoco-notifica.png?v=" + Date.now());
          });
        }, "image/png");
        return;
      }
    } catch (e) { /* noop */ }
    mettiArtwork(bruciata);
  }

  function aggiornaNotifica(prog, suona) {
    if (!("mediaSession" in navigator)) return;
    var meta = navigator.mediaSession.metadata;
    if (!meta) return;
    var cop = "";
    try { cop = meta.artwork && meta.artwork[0] ? String(meta.artwork[0].src || "") : ""; } catch (e) { /* noop */ }
    if (!cop) return;
    /* l'app ha cambiato copertina: ricarico l'immagine */
    if (cop !== stato.ultimoArtwork && cop.indexOf("data:") !== 0) {
      stato.ultimoArtwork = cop;
      caricaCopertina(cop);
    }
    /* Se l'immagine non e' ancora pronta non pubblico niente: altrimenti
       il telefono si ferma su un quadrato vuoto (e iOS non lo cambia
       piu'). */
    if (!imgCopertina) return;
    if (!suona) return;
    /* non troppo spesso: il blocco schermo non ha bisogno di 60 fotogrammi
       al secondo, e il telefono si scalda */
    var adesso = Date.now();
    if (adesso - (stato.ultimaNotifica || 0) < 1500) return;
    stato.ultimaNotifica = adesso;
    preparaTela();
    pubblicaNotifica(prog);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mettiStile(); requestAnimationFrame(ciclo); });
  } else {
    mettiStile();
    requestAnimationFrame(ciclo);
  }
})();
