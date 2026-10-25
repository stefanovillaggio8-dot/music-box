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

  /* Le fiamme AI CONFINI DEL TELEFONO (Ste: "il fuoco nel testo fallo
     che si vede ai confini del telefono"). Vanno lungo il bordo dello
     schermo e non coprono mai il testo, che sta sopra. */
  function fiammeAiConfini(box, lato, quante) {
    var contenitore = box.querySelector(".mb-fiamme");
    if (!contenitore) return;
    if (contenitore.childNodes.length) return;
    var h = "";
    for (var i = 0; i < quante; i++) {
      /* giro lungo il bordo: destra, basso, sinistra, alto */
      var f = i / quante;
      var x, y;
      if (f < 0.25) { x = 100; y = (f / 0.25) * 100; }
      else if (f < 0.5) { x = (1 - (f - 0.25) / 0.25) * 100; y = 100; }
      else if (f < 0.75) { x = 0; y = (1 - (f - 0.5) / 0.25) * 100; }
      else { x = ((f - 0.75) / 0.25) * 100; y = 0; }
      /* tutte le fiamme puntano in SU, come il fuoco vero: ruotate di
         lato sembravano petali sfocati (Ste: "non sembrano manco
         fiamme") */
      var alt = lato * (0.13 + (i % 4) * 0.035);
      h += '<div class="mb-fiamma" style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) +
        "%;width:" + (alt * (0.38 + (i % 3) * 0.045)).toFixed(1) + "px;height:" + alt.toFixed(1) +
        "px;animation-delay:-" + ((i * 0.37) % 2).toFixed(2) +
        's;transform:translate(-50%,-88%) rotate(0deg)">' +
        fiammaSVG() + "</div>";
    }
    contenitore.innerHTML = h;
  }

  /* Lo sfondo della schermata dei testi: stessa copertina, stesso
     bruciato. */
  function aggiornaTesti(a, prog) {
    try {
      var pannello = document.getElementById("lyricsPanel");
      var sfondo = document.getElementById("lyricsSfondo");
      if (!pannello || !sfondo) return;
      if (pannello.hidden) {
        if (stato.boxTesti) { stato.boxTesti.remove(); stato.boxTesti = null; }
        return;
      }
      if (!stato.boxTesti) {
        stato.boxTesti = montaTesti(sfondo);
        stato.progTesti = -1;
      }
      var r = sfondo.getBoundingClientRect();
      var lato = Math.max(r.width, r.height);
      /* le fiamme sullo sfondo grande sono piu' piccole: la schermata e'
         molto piu' grande del disco del player */
      var latoFiamme = lato * 0.27;
      if (stato.progTesti !== prog) {
        disegnaChar(stato.boxTesti, a, "");
        var caloreTesti = stato.boxTesti.querySelector(".mb-calore");
        if (caloreTesti) caloreTesti.remove();
        /* le fiamme stanno ai CONFINI dello schermo, non al centro:
           il testo (che sta sopra) non deve essere coperto */
        fiammeAiConfini(stato.boxTesti, Math.min(window.innerWidth || r.width, 430), 44);
        mostraFumo(stato.boxTesti, prog);
        spostaFiamme(stato.boxTesti, a);
        stato.progTesti = prog;
      }
      if (!stato.boxTesti.querySelector(".mb-bragia").childNodes.length) {
        /* le bragia restano piccole: sullo sfondo grande altrimenti
           sembrano macchie enormi */
        stato.boxTesti.querySelector(".mb-bragia").innerHTML = stratoBragia(lato, 3);
      }
    } catch (e) { /* noop */ }
  }

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
    /* il fuoco dentro la schermata dei testi: non e' "fixed", sta li' */
    ".mb-fuoco-dentro{position:absolute;inset:0;z-index:0}",
    ".mb-fuoco .mb-strato-char{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}",
    ".mb-fuoco .mb-strato-char svg{width:100%;height:100%;display:block}",
    ".mb-fuoco .mb-calore{position:absolute;pointer-events:none;z-index:3;border-radius:50%;",
    "  background:radial-gradient(circle,rgba(255,120,10,.45) 0%,rgba(255,60,0,.22) 52%,rgba(255,40,0,0) 74%)}",
    ".mb-fuoco .mb-brasa{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;opacity:.9}",
    ".mb-fuoco .mb-fiamme{position:absolute;inset:0;pointer-events:none;z-index:5}",
    ".mb-fuoco .mb-fiamma{position:absolute;pointer-events:none;transform-origin:50% 100%;filter:drop-shadow(0 0 5px rgba(255,180,35,.95)) drop-shadow(0 0 13px rgba(255,85,8,.72)) drop-shadow(0 0 24px rgba(255,55,0,.38));}",
    ".mb-fuoco .mb-fiamma svg{width:100%;height:100%;display:block;overflow:visible;transform-origin:50% 100%;animation:mbVento 1.05s ease-in-out infinite alternate;}",
    ".mb-fuoco .mb-fiamma .mb-aura-fiamma{transform-origin:50% 100%;animation:none!important;}",
    ".mb-fuoco .mb-fiamma .mb-fiamma-esterna{transform-origin:30px 148px;animation:none!important;}",
    ".mb-fuoco .mb-fiamma .mb-fiamma-interna{transform-origin:30px 148px;animation:none!important;}",
    ".mb-fuoco .mb-fiamma .mb-fiamma-cuore{transform-origin:30px 148px;animation:none!important;}",
    ".mb-fuoco .mb-fiamma .mb-fiamma-lampo{transform-origin:30px 148px;animation:none!important;}",
    /* Movimento da convezione: solo inclinazione laterale, mai pulsazioni di scala o luminosita. */
    "@keyframes mbVento{from{transform:rotate(-7deg) skewX(-3deg)}to{transform:rotate(7deg) skewX(3deg)}}",
    ".mb-fuoco .mb-bragia{position:absolute;inset:0;pointer-events:none;z-index:5}",
    /* il fumo: alla fine, quando la copertina e' bruciata, quello che
       resta e' fumo che sale e si disperde */
    ".mb-fuoco .mb-fumo{position:absolute;inset:0;pointer-events:none;z-index:6;opacity:0;",
    "  transition:opacity 1.2s ease}",
    ".mb-fuoco .mb-fumo.on{opacity:1}",
    ".mb-fuoco .mb-fumo i{position:absolute;bottom:-20%;width:52%;height:52%;border-radius:50%;",
    "  background:radial-gradient(circle,rgba(210,208,216,.6) 0%,rgba(160,160,170,0) 70%);",
    "  animation:mbSaleFumo 3.6s linear infinite}",
    "@keyframes mbSaleFumo{0%{transform:translateY(18%) scale(.45);opacity:0}",
    "  14%{opacity:.95}70%{opacity:.55}100%{transform:translateY(-300%) scale(1.7);opacity:0}",
    "  }",
    "  /* l'aria calda che esce dalla linea di bruciatura */",
    "  .mb-fuoco .mb-fumo::after{content:'';position:absolute;left:-12%;right:-12%;bottom:-8%;height:38%;",
    "    background:radial-gradient(ellipse at 50% 100%,rgba(200,198,206,.5) 0%,rgba(150,150,160,0) 72%);",
    "    filter:blur(6px)}",
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

  /* I filtri e i gradienti del nuovo fuoco stratificato. */
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

  /* Ogni lingua di fuoco ha una sagoma diversa: niente piu' stampini
     identici. Le tre forme si sovrappongono e si deformano a ritmi diversi. */
  var _mbFiammaIndice = 0;
  var PERCORSI_FIAMME = [
    "M29 2 C34 17 22 25 18 42 C12 60 9 79 15 104 C18 122 25 139 30 148 C36 137 43 121 45 101 C49 80 45 59 40 42 C36 27 24 19 29 2 Z",
    "M32 4 C42 19 29 32 24 46 C17 64 17 80 20 96 C22 117 26 135 30 148 C38 132 48 119 47 96 C48 75 38 61 42 44 C45 28 34 20 32 4 Z",
    "M27 3 C24 20 12 29 14 48 C7 67 13 87 16 105 C19 124 24 138 30 148 C32 133 40 121 42 101 C48 80 44 65 36 47 C31 34 35 19 27 3 Z",
    "M31 2 C35 20 17 29 20 47 C10 66 13 89 19 108 C22 126 27 139 30 148 C35 137 47 122 44 99 C43 80 51 62 39 43 C34 29 26 18 31 2 Z"
  ];
  function fiammaSVG() {
    var n = _mbFiammaIndice++ % PERCORSI_FIAMME.length;
    var id = "mbFiammaReal" + n + "_" + Math.floor(Math.random() * 1000000);
    /* Fiamme organiche: base luminosa, corpo arancio e punte sottili.
       Palette da fuoco reale, senza viola/rosa e senza sagome simmetriche. */
    var outer = [
      "M30 151 C24 140 17 132 18 116 C10 101 14 87 19 74 C20 61 16 50 23 36 C25 53 33 57 30 74 C38 63 36 48 40 34 C49 52 43 68 46 82 C54 101 46 121 39 135 C36 143 34 148 30 151 Z",
      "M30 151 C20 137 17 126 21 111 C13 96 19 80 23 66 C26 53 21 43 28 27 C30 46 38 54 34 71 C43 59 42 43 46 37 C52 56 43 70 47 89 C52 108 42 132 30 151 Z",
      "M30 151 C25 139 15 128 19 111 C11 95 16 82 22 70 C26 56 23 45 27 32 C34 49 31 61 34 74 C42 62 39 49 45 40 C49 60 43 76 47 91 C49 113 39 137 30 151 Z",
      "M30 151 C21 140 19 129 17 117 C12 99 20 84 22 71 C24 58 19 48 26 35 C32 52 35 63 31 77 C40 67 41 53 43 42 C51 61 44 78 48 94 C50 114 40 137 30 151 Z"
    ];
    var inner = [
      "M30 149 C24 136 23 124 27 113 C21 101 27 88 29 77 C32 90 37 96 34 108 C40 120 35 138 30 149 Z",
      "M30 149 C25 137 27 124 30 114 C25 103 31 91 33 82 C39 96 35 106 38 116 C39 130 34 141 30 149 Z",
      "M30 149 C25 137 25 126 29 115 C24 105 29 93 31 84 C36 99 34 109 36 120 C36 133 33 142 30 149 Z",
      "M30 149 C24 137 25 125 28 114 C24 102 30 91 32 80 C38 98 34 109 37 119 C37 133 33 143 30 149 Z"
    ];
    return '<svg viewBox="0 0 60 160" preserveAspectRatio="xMidYMax meet">' +
      '<defs>' +
      '<linearGradient id="' + id + 'outer" x1="0" y1="1" x2=".12" y2="0">' +
      '<stop offset="0" stop-color="#fff8dc"/><stop offset=".12" stop-color="#fff0a0"/>' +
      '<stop offset=".30" stop-color="#ffc12c"/><stop offset=".52" stop-color="#ff7916"/>' +
      '<stop offset=".76" stop-color="#ed3b08"/><stop offset="1" stop-color="#b51b00" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + 'inner" x1="0" y1="1" x2=".1" y2="0">' +
      '<stop offset="0" stop-color="#fffef2"/><stop offset=".35" stop-color="#fff0a0"/>' +
      '<stop offset=".7" stop-color="#ffc02b"/><stop offset="1" stop-color="#ff6a12" stop-opacity="0"/></linearGradient>' +
      '<filter id="' + id + 'warp" x="-35%" y="-25%" width="170%" height="155%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".025 .055" numOctaves="2" seed="' + (n + 21) + '" result="noise"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>' +
      '</defs>' +
      '<path class="mb-fiamma-esterna" d="' + outer[n] + '" fill="url(#' + id + 'outer)" filter="url(#' + id + 'warp)"/>' +
      '<path class="mb-fiamma-interna" d="' + inner[n] + '" fill="url(#' + id + 'inner)" opacity=".96"/>' +
      '<path class="mb-fiamma-cuore" d="M29 149 C27 141 30 133 29 125 C28 117 31 111 32 105 C36 119 32 128 34 137 C33 143 31 147 29 149 Z" fill="#fffdf0" opacity=".94"/>' +
      '<path class="mb-fiamma-lampo" d="M30 149 C28 143 31 139 30 134 C33 140 32 145 30 149 Z" fill="#ffffff"/>' +
      '</svg>';
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
    var ogni = Math.max(1, Math.round(N / 24));
    for (var i = 0; i < N; i += ogni) {
      /* Il fuoco visibile sul player: lingue molto piu' alte e irregolari.
         Questa e' la funzione usata dalla copertina principale (non quella
         dei bordi della schermata testi). */
      var alt = lato * (0.15 + r() * 0.17) + lato * 0.065 * a.prog;
      if (r() < 0.24) alt = alt * (1.25 + r() * 0.38);
      /* il ritardo e' distribuito col numero d'oro: le fiamme non si
         muovono a gruppi */
      var k = out.length;
      out.push({ i: i, alt: alt, larg: alt * (0.34 + r() * 0.22), attesa: ((k * 0.6180339887) % 1) * 0.9 });
    }
    return out;
  }

  function stratoBragia(lato, misura) {
    var h = "";
    var d = misura || Math.max(2, lato * 0.075);
    for (var i = 0; i < 15; i++) {
      var dx = (i % 2 === 0 ? 1 : -1) * (6 + (i * 7) % 16);
      h += '<i style="left:' + (4 + (i * 13) % 92).toFixed(0) + "%;top:" + (14 + (i * 17) % 76).toFixed(0) +
        "%;width:" + d.toFixed(1) + "px;height:" + d.toFixed(1) + "px;--mbdx:" + dx +
        "px;animation-duration:" + (2.6 + (i % 6) * 0.35).toFixed(2) + "s;animation-delay:" +
        (((i * 0.6180339887) % 1) * 3.4).toFixed(2) + 's"></i>';
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
        '<div class="mb-fumo"></div>' +
      '</div>';
    /* l'overlay sta FUORI dal disco: il disco gira (e' un vinile) e
       dentro un elemento che gira il position:fixed dei figli vale come
       "absolute": il fuoco finiva nel posto sbagliato e girava con lui */
    document.body.appendChild(box);
    return box;
  }

  /* Lo stesso disegno, ma dentro la schermata dei testi: lo sfondo
     grande con la copertina sfocata che brucia insieme al disco.
     Ste: "la copertina brucia anche nella schermata dei testi". */
  function montaTesti(sfondo) {
    var box = document.createElement("div");
    box.className = "mb-fuoco mb-fuoco-dentro";
    box.innerHTML =
      '<div class="mb-dentro">' +
        '<div class="mb-strato-char"></div>' +
        '<div class="mb-calore"></div>' +
        '<svg class="mb-brasa" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>' +
        '<div class="mb-fiamme"></div>' +
        '<div class="mb-bragia"></div>' +
        '<div class="mb-fumo"></div>' +
      '</div>';
    try { sfondo.parentNode.insertBefore(box, sfondo.nextSibling); }
    catch (e) { document.body.appendChild(box); }
    return box;
  }

  /* Il disco del player gira quando suona (e' un vinile). Il fuoco non
     sta piu' dentro il disco, ma e' un overlay a parte: cosi' il disco
     gira libero e il fuoco resta fermo e dritto, senza contro-giri e
     senza che il telefono scatti.

     Il marchesino dice alla pagina che il contro-giro non le serve
     (finche' l'app non si aggiorna, e' lei a farlo). */
  window.__mbControGiro = "fatto";

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
    var suonante = null;
    for (var i = catalogAudio.length - 1; i >= 0; i--) {
      var a = catalogAudio[i];
      if (!a || a._mbSilenzio) continue;
      var t, d, suona;
      try {
        if (!a.src) continue;
        t = a.currentTime;
        d = a.duration;
        suona = !a.paused && !a.ended;
        if (!isFinite(d) || d <= 0) continue;
      } catch (e) { continue; }
      var diff = Math.abs(t - tDom);
      /* quello che sta suonando davvero ha la precedenza: e' il brano
         principale, non l'anteprima */
      if (suona && diff < 6 && !suonante) suonante = a;
      if (diff < diffMin) { diffMin = diff; migliore = a; }
    }
    return suonante || migliore;
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
    tipoArtwork: "",
    suonaOra: false,
    audio: null,
    boxTesti: null,
    progTesti: -1,
    tPrecedente: 0,
    seme: 7,
    fiamme: [],         /* le fiamme vive: non le ricreo piu' */
    ultimoArtwork: ""
  };

  /* La crosta (il nero che morde la copertina) */
  function disegnaChar(box, a, raggio) {
    var sc = box.querySelector(".mb-strato-char");
    sc.innerHTML = stratoChar(a);
    /* il nero deve avere la stessa forma della copertina (rotonda quando
       suona il disco, quadrata quando no) */
    if (raggio) {
      try { sc.style.borderRadius = raggio; } catch (e) { /* noop */ }
    }

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
  }

  /* Le fiamme: si creano una volta sola e poi si spostano. Se le
     ricreassi a ogni fotogramma l'animazione ripartireebbe da capo e il
     fuoco sembrerebbe battere (e Ste l'ha visto: "fa tipo a impulsi"). */
  function preparaFiamme(box, a, lato) {
    var fiamme = fiammeAttorno(a, lato);
    box._fiamme = fiamme;
    var contenitore = box.querySelector(".mb-fiamme");
    contenitore.innerHTML = "";
    for (var k = 0; k < fiamme.length; k++) {
      var f = fiamme[k];
      var el = document.createElement("div");
      el.className = "mb-fiamma";
      el.innerHTML = fiammaSVG();
      el.style.animationDelay = "-" + f.attesa.toFixed(2) + "s";
      contenitore.appendChild(el);
      f.el = el;
    }
  }

  /* Le macchie di fumo: le creo una volta sola e poi le faccio salire
     col CSS. */
  function preparaFumo(box) {
    var contenitore = box.querySelector(".mb-fumo");
    if (!contenitore) return;
    if (contenitore.childNodes.length) return;
    var h = "";
    for (var i = 0; i < 10; i++) {
      var sinistra = 4 + ((i * 23) % 92);
      var durata = 3 + ((i * 7) % 5) * 0.45;
      h += '<i style="left:' + sinistra + '%;animation-duration:' + durata.toFixed(2) +
        's;animation-delay:-' + ((i * 0.83) % 4).toFixed(2) + 's"></i>';
    }
    contenitore.innerHTML = h;
  }

  function mostraFumo(box, prog) {
    if (!box) return;
    var contenitore = box.querySelector(".mb-fumo");
    if (!contenitore) return;
    if (prog > 0.5) {
      preparaFumo(box);
      if (!contenitore.classList.contains("on")) contenitore.classList.add("on");
    } else if (contenitore.classList.contains("on")) {
      contenitore.classList.remove("on");
    }
  }

  function spostaFiamme(box, a) {
    var elenco = box._fiamme || [];
    for (var k = 0; k < elenco.length; k++) {
      var f = elenco[k];
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

      var titoloOra = titolo ? titolo.textContent : "";
      var tDom = secondi(cur.textContent);
      var dur = secondi(tot.textContent);
      var audio = scegliAudio(tDom);
      if (audio) stato.audio = audio;
      var sorgenteOra = audio ? String(audio.currentSrc || audio.src || "") : "";
      var chiaveBrano = titoloOra + "|" + sorgenteOra;
      if (chiaveBrano !== stato.ultimoTitolo) {
        stato.ultimoTitolo = chiaveBrano;
        stato.progVisto = 0;
        stato.progChar = -1;
        stato.progFiamme = -1;
        stato.progNotifica = -1;
        stato.tPrecedente = 0;
        if (stato.box) { stato.box.remove(); stato.box = null; }
        stato.fiamme = [];
        stato.seme = (stato.seme * 7 + 13) % 997;
      }

      var suona = audio ? (!audio.paused && !audio.ended) : art.classList.contains("playing");
      var t = tDom;
      if (audio && isFinite(audio.currentTime)) t = audio.currentTime;

      /* il tempo e' tornato indietro: brano nuovo o riavvolto */
      if (t < stato.tPrecedente - 1.5) { stato.progVisto = -1; stato.progChar = -1; }
      stato.tPrecedente = t;

      var prog = stato.progVisto;
      if (audio && audio.ended) prog = 1;
      else if (suona && dur > 0) prog = Math.max(0, Math.min(1, t / dur));
      else if (prog < 0) prog = 0;

      /* lo sfondo grande della schermata dei testi brucia insieme: lo
         chiamo PRIMA di qualsiasi ritorno, cosi' la schermata dei testi
         ha il fuoco anche quando non sta suonando niente */
      aggiornaTesti(arte(prog, stato.seme), prog);
      /* quando i testi sono aperti il disco in basso a sinistro NON deve
         mostrare il cerchio infuocato: ci sono gia' le fiamme ai
         confini dello schermo (Ste) */
      var pannelloAperto = false;
      try {
        var pnl = document.getElementById("lyricsPanel");
        pannelloAperto = !!(pnl && !pnl.hidden);
      } catch (e) { }
      if (stato.box) {
        stato.box.style.opacity = pannelloAperto ? "0" : "";
        stato.box.style.pointerEvents = pannelloAperto ? "none" : "";
      }

      if (prog !== stato.progVisto) stato.progVisto = prog;
      /* Fine combustione: scompare la copertina e il brano successivo riparte pulito. */
      if (prog >= 0.999 || (audio && audio.ended)) {
        if (stato.box) { stato.box.remove(); stato.box = null; stato.fiamme = []; }
        stato.progVisto = 0; stato.progChar = -1; stato.progFiamme = -1;
        aggiornaNotifica(1, false);
        requestAnimationFrame(ciclo);
        return;
      }
      if (prog <= 0.001 && !suona) {
        if (stato.box) { stato.box.remove(); stato.box = null; stato.fiamme = []; }
        requestAnimationFrame(ciclo);
        return;
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
      var raggio = "";
      try { raggio = getComputedStyle(art).borderRadius; } catch (e) { /* noop */ }
      /* Il fuoco NON si sposta a ogni fotogramma. Le fiamme hanno un
         filtro di sfocatura: muoverle 60 volte al secondo fa scattare il
         telefono e il fuoco sembra battere (Ste: "il fuoco pulsa come se
         battesse"). Le muovo solo quando il bruciato e' cambiato un po':
         i passi sono troppo piccoli per vedersi, l'animazione gira
         liscia. */
      var cambiato = Math.abs(prog - stato.progChar) > 0.02;
      if (cambiato) disegnaChar(stato.box, a, raggio);
      if (!stato.box._fiamme || !stato.box._fiamme.length) preparaFiamme(stato.box, a, r.width);
      mostraFumo(stato.box, prog);
      if (cambiato || stato.progFiamme < 0) {
        spostaFiamme(stato.box, a);
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
  /* all'inizio le particelle sono poche e tenui: appaiono piano piano
     mentre la carta si consuma (Ste: "troppe particelle all'inizio") */
  var opacitaBragia = quasiFinita ? "1" : Math.min(1, prog * 2.5).toFixed(2);
  if (bragia.style.opacity !== opacitaBragia) bragia.style.opacity = opacitaBragia;

      /* la copertina che brucia anche nelle notifiche del telefono */
      stato.suonaOra = suona;
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

  /* Il fuoco deve MUOVERSI: ogni disegno e' un po' diverso dal
     precedente, altrimenti nella notifica del telefono si vede sempre la
     stessa immagine e sembra ferma. */
  function rnd(seme) {
    var x = Math.sin(seme * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function copertinaCheBrucia(prog) {
    if (!imgCopertina || !ctxTela) return "";
    var t = Date.now() / 1000;
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
      var n = 0;
      for (var i = 0; i < a.punti.length; i += ogni) {
        var p = a.punti[i];
        var ux = p.x - a.cx, uy = p.y - a.cy;
        var lun = Math.sqrt(ux * ux + uy * uy) || 1;
        ux /= lun; uy /= lun;
        var vx = ux * 0.38, vy = uy * 0.38 - 1.0;
        var ang = Math.atan2(vx, -vy) * 180 / Math.PI;
        /* Ogni fiamma ondeggia in modo CONTINUO (una sinusoide): se il
           disegno cambia a caso, fra un'immagine e l'altra il fuoco
           salta e nella notifica si vede "a scatti" (Ste, 20/10/2026). */
        var f = n * 1.7;
        var sballo = 0.5 + 0.5 * Math.sin(t * 1.15 + f);
        ang += Math.sin(t * 0.85 + f * 1.3) * 9;
        var alt = L * (0.12 + 0.07 * sballo) + L * 0.05 * a.prog;
        fiammaCanvas(p.x / 100 * L, p.y / 100 * L, alt, ang);
        n++;
      }
      /* Il fumo: quando la carta e' quasi finita, quello che resta non
         e' piu' nero ma fumo che sale e si disperde. */
      if (prog > 0.55) {
        var quanto = Math.min(1, (prog - 0.55) / 0.4);
        for (var f2 = 0; f2 < 9; f2++) {
          var q1 = rnd(f2 * 5.3 + 1.1);
          var q2 = rnd(f2 * 5.3 + 2.7);
          var sale = (q1 * 100 + t * 11) % 100;
          var fx = (12 + q2 * 76) / 100 * L;
          var fy = (78 - sale * 0.62) / 100 * L;
          var fr = L * (0.05 + q1 * 0.10) * (1 + quanto * 0.5);
          var gr = ctxTela.createRadialGradient(fx, fy, 0, fx, fy, fr);
          var al = (0.05 + 0.10 * quanto) * (1 - sale / 100);
          gr.addColorStop(0, "rgba(196,194,200," + al.toFixed(3) + ")");
          gr.addColorStop(1, "rgba(170,170,178,0)");
          ctxTela.fillStyle = gr;
          ctxTela.beginPath();
          ctxTela.arc(fx, fy, fr, 0, Math.PI * 2);
          ctxTela.fill();
        }
      }

      /* qualche bragia che sale: poche, e con un movimento continuo */
      for (var e = 0; e < 5; e++) {
        var s1 = rnd(e * 3.1);
        var s2 = rnd(e * 3.1 + 5.5);
        var scorrere = (s1 * 100 + t * 9) % 100;
        var ex = (14 + s2 * 72) / 100 * L;
        var ey = (72 - scorrere * 0.55) / 100 * L;
        var er = L * 0.011 * (0.6 + s1 * 0.8);
        var chiaro = 0.25 + 0.55 * (1 - scorrere / 100);
        ctxTela.fillStyle = "rgba(255," + Math.round(150 + s2 * 90) + ",60," + chiaro.toFixed(2) + ")";
        ctxTela.beginPath();
        ctxTela.arc(ex, ey, er, 0, Math.PI * 2);
        ctxTela.fill();
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
      /* ogni volta cambio anche il "tipo" dichiarato: su iPhone serve a
         far ricaricare davvero l'immagine (l'indirizzo cambia gia', ma
         cosi' e' certo) */
      var tipo = src.indexOf("data:") === 0 ? "image/jpeg" : "image/png";
      if (stato.tipoArtwork === tipo) tipo = tipo === "image/png" ? "image/jpeg" : "image/png";
      stato.tipoArtwork = tipo;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title || "",
        artist: meta.artist || "",
        album: meta.album || "",
        artwork: [{ src: src, sizes: "256x256", type: tipo }]
      });
      stato.ultimoArtwork = src;
    } catch (e) { /* il browser non accetta l'artwork: lascio com'e' */ }
  }

  /* Il telefono prende il Music Box da internet (github.io), quindi la
     copertina bruciata va chesta al computer di casa: e' l'unico modo
     che ha il telefono per arrivare al file. Gli indirizzi sono gli
     stessi che usa l'app per scaricare i brani. */
  var INDIRIZZI_PONTE = [
    /* l'indirizzo della pagina stessa: se l'app e' aperta dal computer di
       casa (la versione normale) il disegno ci arriva subito e senza
       problemi di rete mista */
    "",
    "http://192.168.1.40:8788",
    "http://192.168.1.2:8788",
    "http://100.106.211.2:8788",
    "http://127.0.0.1:8788"
  ];
  var ponteFuoco = null;   /* l'indirizzo che ha funzionato */
  var giriPonte = 0;

  function percorsoPonte(indirizzo) {
    return indirizzo + "/app/fuoco-notifica.png";
  }

  /* Provo gli indirizzi uno dopo l'altro. Se uno funziona lo ricordo, ma
     se smette di funzionare riprovo tutti (il telefono cambia rete). */
  function mandaAlPonte(blob, finito) {
    /* NB: "finito(null)" vuol dire "non e' arrivato a nessun indirizzo".
       L'indirizzo vuoto (la pagina stessa) e' un successo, non un
       fallimento: se lo tratto come fallimento la notifica resta ferma. */
    if (ponteFuoco !== null) {
      inviaAlPonte(ponteFuoco, blob, function (ok) {
        if (ok) { finito(ponteFuoco); return; }
        ponteFuoco = null;
        mandaAlPonte(blob, finito);
      });
      return;
    }
    if (giriPonte >= INDIRIZZI_PONTE.length) { giriPonte = 0; finito(null); return; }
    var a = INDIRIZZI_PONTE[giriPonte++];
    inviaAlPonte(a, blob, function (ok) {
      if (ok) { ponteFuoco = a; giriPonte = 0; finito(a); return; }
      mandaAlPonte(blob, finito);
    });
  }

  function inviaAlPonte(indirizzo, blob, finito) {
    try {
      fetch(percorsoPonte(indirizzo), { method: "POST", body: blob, cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
        .then(function () { finito(true); })
        .catch(function () { finito(false); });
    } catch (e) { finito(false); }
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
            if (indirizzo === null) { mettiArtwork(bruciata); return; }
            /* la notifica prende l'indirizzo del computer di casa; il
               "?v=" cambia ogni volta, cosi' il telefono va a prendere
               il disegno nuovo invece di tenere quello vecchio */
            mettiArtwork(percorsoPonte(indirizzo) + "?v=" + Date.now());
          });
        }, "image/png");
        return;
      }
    } catch (e) { /* noop */ }
    mettiArtwork(bruciata);
  }

  var _battito = null;
  var _progNotifica = 0;

  function aggiornaNotifica(prog, suona) {
    /* il progresso reale, ricalcolato dal tempo del brano */
    try {
      var tDom2 = secondi((document.getElementById("curTime") || {}).textContent);
      var dur2 = secondi((document.getElementById("totTime") || {}).textContent);
      if (suona && dur2 > 0) _progNotifica = Math.max(0, Math.min(1, tDom2 / dur2));
      else if (prog > _progNotifica) _progNotifica = prog;
    } catch (e) { /* noop */ }
    prog = _progNotifica;
    if (!("mediaSession" in navigator)) return;
    var meta = navigator.mediaSession.metadata;
    if (!meta) return;
    var cop = "";
    try { cop = meta.artwork && meta.artwork[0] ? String(meta.artwork[0].src || "") : ""; } catch (e) { /* noop */ }
    if (!cop) return;
    /* Se e' l'icona dell'app (succede quando un brano non ha una
       copertina) non la tocco: se no, nella notifica compare il logo
       del Music Box al posto della copertina (Ste, 20/10/2026). */
    if (/icon-\d+\.png$/i.test(cop)) return;
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
    if (adesso - (stato.ultimaNotifica || 0) < 600) return;
    stato.ultimaNotifica = adesso;
    preparaTela();
    pubblicaNotifica(prog);
  }

  /* Il ciclo principale gira con requestAnimationFrame, ma quando la
     pagina e' in secondo piano (il telefono in tasca) quelli non girano.
     Per la notifica aggiungo un battito con setInterval, che invece
     continua: cosi' la copertina che brucia si muove anche a schermo
     spento. */
  function parti() {
    mettiStile();
    requestAnimationFrame(ciclo);
    if (!_battito) {
      _battito = setInterval(function () {
        aggiornaNotifica(stato.progVisto, stato.suonaOra);
      }, 600);
    }
  }

  /* Ste: "se tocco una parte di testo mi porta la canzone in avanti nel
     punto in cui ho toccato". L'audio sta dentro l'app (non si vede nel
     DOM), quindi espongo un modo per spostare la canzone: la pagina
     chiama questa funzione. */
  window.__mbVaiA = function (sec) {
    try {
      var a = stato.audio;
      if (!a) return false;
      if (!isFinite(sec) || sec < 0) return false;
      a.currentTime = sec;
      try { if (a.paused) a.play(); } catch (e) { /* noop */ }
      /* Ste: "quando premo il testo va poi in ritardo rispetto alla
         canzone". Dopo il salto dico all'app che il tempo e' cambiato:
         senza questo la barra (e la riga evidenziata) restano indietro
         fino al prossimo aggiornamento. */
      try { a.dispatchEvent(new Event("timeupdate")); } catch (e) { /* noop */ }
      return true;
    } catch (e) { return false; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", parti);
  } else {
    parti();
  }
})();
