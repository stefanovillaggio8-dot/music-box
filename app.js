"use strict";

(function () {
  /* Vero mentre l'accesso a Spotify e' in corso: blocca il ricaricamento
     automatico, che altrimenti lo cancella a meta'. Lo dichiaro con var
     in cima all'app, cosi' e' visibile da tutte le funzioni. */
  var _loginSpotifyInCorso = false;
  /* Vero solo quando l'utente ha premuto "Accedi con Spotify": serve per
     non mostrare la schermata dell'errore a ogni avvio dell'app. */
    var _spotifyTentativoInCorso = false;
    /* Ste: "la notifica in alto deve restare fino quando chiudo l'app" e
       "quando dalle cuffie premo il tasto, parte una canzone di soundcloud".
       Motivo (uno solo): i tasti delle cuffie vanno SEMPRE all'app che sta
       suonando. Se MusicBox non sta suonando niente, il telefono da' il
       comando all'ultima app che ha suonato (SoundCloud) e la notifica
       sparisce.
       Adesso l'app tiene su una PISTA SILENZIOSA (volume zero): cosi' il
       telefono sa che la sessione audio e' di MusicBox, il tasto delle
       cuffie riparte la musica di MusicBox e la notifica in alto resta
       finche' l'app e' aperta. */
    let _silenzio = null;
    function _accendiSilenzio() {
      try {
        if (_silenzio) return;
        if (!window.Audio) return;
        /* WAV di 0,1 secondi di silenzio (generato sul computer). */
        const silenzio = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
        /* Prima il file vero (silenzio.mp3, 3 minuti): continua a suonare
           anche quando iPhone congela il JavaScript dell'app in secondo
           piano, e quindi la sessione audio resta viva (e con lei la
           notifica e i tasti delle cuffie). Il peccato di 0,1 secondi
           resta come piano B, se il file non si riesce a caricare. */
        const a = new Audio("silenzio.mp3");
        a.loop = true;
        a.volume = 0.01;
        a.setAttribute("playsinline", "");
        a.addEventListener("error", function () {
          /* Il file non si e' caricato: uso il peccato di sempre. */
          try {
            const b = new Audio(silenzio);
            b.loop = true;
            b.volume = 0.01;
            b.setAttribute("playsinline", "");
            const p2 = b.play();
            if (p2 && p2.catch) p2.catch(() => { });
            _silenzio = b;
          } catch (e) { }
        });
        _silenzio = a;
        const prova = a.play();
        if (prova && prova.catch) prova.catch(() => { });
      } catch (e) { /* noop */ }
    }
  /* Vero quando l'accesso e' partito in QUESTA scheda: allora il pannello
     puo' limitarsi a "Apri Spotify" (e non ripartire da capo). */
  /* Sta nella memoria della scheda (non in una variabile): cosi' se la
     pagina si ricarica, l'app sa ancora che l'accesso e' partito da qui e
     non ripropono la scelta fra le due strade. */
  function _accessoQui() {
    try { return !!sessionStorage.getItem("mb.spotifyAccessoQui"); } catch (e) { return false; }
  }
  function _segnaAccessoQui() {
    try { sessionStorage.setItem("mb.spotifyAccessoQui", "1"); } catch (e) { /* noop */ }
  }
  /* Riferimenti conservati per revisione: nessun file o metadato viene cancellato. */
  const RECOVERY_REVIEW = {
    Emanuele: {
        "songs/track-852.mp3": "wrong-version: Il file è una versione bass boosted (audio modificato), non l'originale di BONES.",
        "songs/track-1012.mp3": "wrong-version: Il video fonte è etichettato [8D AUDIO]: audio spazializzato, non la versione originale.",
    }
  };

  const BUILTIN = [
  { title: "SOTTOGONNA", file: "songs/track-1.mp3", artist: "BLANCO", profile: "Ste" },

      { title: "QUANTO FORTE TI PENSAVO", file: "songs/track-2.mp3", artist: "Madame", profile: "Ste" },
      { title: "Sono Ok", file: "songs/track-4.mp3", artist: "XCarme", profile: "Ste" },

      { title: "Kid Yugi x Lil Peep MASHUP", file: "songs/track-6.mp3", artist: "Kid Yugi / Lil Peep", profile: "Ste" },
      { title: "Star Shopping", file: "songs/track-7.mp3", artist: "Lil Peep", profile: "Ste" },
      { title: "Malpensa", file: "songs/track-8.mp3", artist: "G.Mineiro, Flatpearl, Succo", profile: "Ste" },
      { title: "LA CITTÀ", file: "songs/track-9.mp3", artist: "MOSTRO", profile: "Ste" },
      { title: "CIGNO NERO RMX", file: "songs/track-10.mp3", artist: "Nayt / Frah Quintale / Tony Boy", profile: "Ste" },
      { title: "Romantici Terroni", file: "songs/track-11.mp3", artist: "SAITTA", profile: "Ste" },
      { title: "s!r!", file: "songs/track-12.mp3", artist: "thasup", profile: "Ste" },
      { title: "Victoria", file: "songs/track-13.mp3", artist: "Tony Boy", profile: "Ste" },
      { title: "Un mondo a parte (Visual)", file: "songs/track-14.mp3", artist: "Jovanotti", profile: "Ste" },
      { title: "Sogni Appesi", file: "songs/track-15.mp3", artist: "Ultimo", profile: "Ste" },
      { title: "Exit", file: "songs/track-16.mp3", artist: "nayt", profile: "Ste" },
      { title: "Hai visto mai", file: "songs/track-17.mp3", artist: "Frah Quintale", profile: "Ste" },
      { title: "Il Più Grande Spettacolo Dopo Il Big Bang", file: "songs/track-18.mp3", artist: "Jovanotti", profile: "Ste" },
      { title: "Stella Cadente", file: "songs/track-19.mp3", artist: "Modà", profile: "Ste" },
      { title: "Kid Yugi x Nuts - Lil Peep", file: "songs/track-20.mp3", artist: "Ferro di checov", profile: "Ste" },
      { title: "Lastronauta (Visual)", file: "songs/track-23.mp3", artist: "nayt", profile: "Ste" },
      { title: "zero rimorsi", file: "songs/track-24.mp3", artist: "il tre", profile: "Ste" },
      { title: "Poter scegliere", file: "songs/track-25.mp3", artist: "nayt", profile: "Ste" },
      { title: "NON MI RICONOSCO", file: "songs/track-26.mp3", artist: "MACE", profile: "Ste" },
      { title: "Il Filmografo", file: "songs/track-27.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "Paganini", file: "songs/track-28.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "terr1", file: "songs/track-29.mp3", artist: "kid yugi", profile: "Ste" },
      { title: "Sintetico", file: "songs/track-30.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "ROMANTICA", file: "songs/track-31.mp3", artist: "Ultimo", profile: "Ste" },
      { title: "Eroina", file: "songs/track-32.mp3", artist: "Kid Yugi & Tutti Fenomeni", profile: "Ste" },
      { title: "Lilith", file: "songs/track-33.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "Eva", file: "songs/track-34.mp3", artist: "Kid Yugi, Tedua & Junior K", profile: "Ste" },
      { title: "l'anima", file: "songs/track-35.mp3", artist: "madame", profile: "Ste" },
      { title: "IL GIORNO CHE ASPETTAVO", file: "songs/track-36.mp3", artist: "Ultimo", profile: "Ste" },
      { title: "La Violenza Necessaria", file: "songs/track-37.mp3", artist: "Kid Yugi & Shiva", profile: "Ste" },
      { title: "Gilgamesh", file: "songs/track-38.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "Tristano e Isotta", file: "songs/track-39.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "Donna", file: "songs/track-40.mp3", artist: "Kid Yugi", profile: "Ste" },
      { title: "Lucifero", file: "songs/track-41.mp3", artist: "Kid Yugi", profile: "Ste" },

      { title: "solo domande", file: "songs/track-43.mp3", artist: "nayt & 3D", profile: "Ste" },
      { title: "La canzone dellamore perduto ft. Joan Thiele [Sanremo 2026]", file: "songs/track-44.mp3", artist: "nayt", profile: "Ste" },
      { title: "Porto il Commerciale", file: "songs/track-45.mp3", artist: "Kid Yugi, Night Skinny & Artie 5ive", profile: "Ste" },
      { title: "sailor song", file: "songs/track-46.mp3", artist: "gigi perez", profile: "Ste" },
      { title: "nuts", file: "songs/track-47.mp3", artist: "Lil Peep", profile: "Ste" },
      { title: "NEON", file: "songs/track-48.mp3", artist: "Sfera Ebbasta & Shiva", profile: "Ste" },
    { title: "Mostro (Visual)", file: "songs/track-49.mp3", artist: "Kid Yugi", profile: "Ste" },
    { title: "la mia storia tra le dita", file: "songs/track-50.mp3", artist: "gianluca grignani", profile: "Ste" },
    { title: "Animal I Have Become", file: "songs/track-51.mp3", artist: "Three Days Grace", profile: "Ste" },
    { title: "Somewhere I Belong", file: "songs/track-52.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "What I've Done", file: "songs/track-53.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Smells Like Teen Spirit", file: "songs/track-54.mp3", artist: "Nirvana", profile: "Ste" },
    { title: "Faint", file: "songs/track-55.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Numb", file: "songs/track-56.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "Monster", file: "songs/track-57.mp3", artist: "Skillet", profile: "Ste" },
    { title: "Bring Me To Life", file: "songs/track-58.mp3", artist: "Evanescence", profile: "Ste" },
    { title: "Sweet Child O' Mine", file: "songs/track-59.mp3", artist: "Guns N' Roses", profile: "Ste" },
    { title: "Crawling", file: "songs/track-60.mp3", artist: "Linkin Park", profile: "Ste" },
    { title: "All I Wanted", file: "songs/track-61.mp3", artist: "Paramore", profile: "Ste" },
    { title: "Runaway", file: "songs/track-63.mp3", artist: "Linkin Park", profile: "Ste" },
          { title: "Albachiara", file: "songs/track-69.mp3", artist: "Vasco Rossi", profile: "Ste" },
          { title: "Wonderwall", file: "songs/track-76.mp3", artist: "Oasis", profile: "Ste" },
          { title: "La Mia Storia Tra Le Dita (Feat. Annalisa)", file: "songs/track-71.mp3", artist: "Gianluca Grignani", profile: "Ste" },
          { title: "HO SBAGLIATO ANCORA", file: "songs/track-72.mp3", artist: "Chiello", profile: "Ste" },
          { title: "siLLy cUp", file: "songs/track-68.mp3", artist: "thasup", profile: "Ste" },
    { title: "dimmi che ce'", file: "songs/track-64.mp3", artist: "thasup", profile: "Ste" },
    { title: "In the End", file: "songs/track-65.mp3", artist: "Linkin Park", profile: "Ste" },
    /* Ste: qui sotto c'era anche { title: "thasup dimmi che c'", file:
   "songs/track-66.mp3" }. Era lo STESSO mp3 di "dimmi che ce'" (track-64),
   byte per byte: la stessa canzone due volte in libreria. Tolta. */
    { title: "carusi do sud", file: "songs/track-67.mp3", artist: "l'elfo", profile: "Ste" },
    { title: "nei treni la notte", file: "songs/track-73.mp3", artist: "frah quintale", profile: "Ste" },
    { title: "Dimmi Che C''", file: "songs/track-74.mp3", artist: "thasup", profile: "Ste" },
    { title: "stupido", file: "songs/track-75.mp3", artist: "massimo pericolo", profile: "Ste" },
    { title: "Spettri", file: "songs/track-77.mp3", artist: "nayt, 3D" },
    { title: "Memoria di uno sconfitto, pt. 2", file: "songs/track-78.mp3", artist: "Mostro" },
    { title: "G&V", file: "songs/track-79.mp3", artist: "ivanBì" },
    { title: "Da zero", file: "songs/track-80.mp3", artist: "nayt" },
    { title: "Gli occhi della tigre", file: "songs/track-81.mp3", artist: "nayt" },
    { title: "Bullet Ballet", file: "songs/track-87.mp3", artist: "Kid Yugi, Artie 5ive" },
    { title: "SOGNO AMERICANO", file: "songs/track-88.mp3", artist: "Artie 5ive" },
    { title: "Niente Canzoni D'Amore", file: "songs/track-89.mp3", artist: "Elodie" },
    { title: "Odi et Amo", file: "songs/track-90.mp3", artist: "Blake el Diablo" },
    { title: "uNa DiReZioNe giùSta", file: "songs/track-91.mp3", artist: "yungest Moonstar, Neffa, thasup" },
    { title: "Scale", file: "songs/track-92.mp3", artist: "Night Skinny, Luchè" },
    { title: "oh 9od", file: "songs/track-93.mp3", artist: "thasup, nayt" },
    { title: "Doom", file: "songs/track-94.mp3", artist: "nayt, 3D" },
    { title: "Ballon d'Or", file: "songs/track-95.mp3", artist: "Gemitaiz, nayt" },
    { title: "un'idea", file: "songs/track-96.mp3", artist: "nayt, 3D" },
    { title: "guerra dentro", file: "songs/track-97.mp3", artist: "nayt, 3D" },
    { title: "Cigno nero", file: "songs/track-98.mp3", artist: "Fedez, Francesca Michelini" },
    { title: "Se Piovesse Il Tuo Nome - con Calcutta", file: "songs/track-99.mp3", artist: "Elisa, Calcutta" },
    { title: "Chic", file: "songs/track-100.mp3", artist: "Izi" },
    { title: "molecole (interlude)", file: "songs/track-101.mp3", artist: "thasup" },
    { title: "Il Tuo Sorriso", file: "songs/track-102.mp3", artist: "Medy" },
    { title: "AIRFORCE", file: "songs/track-103.mp3", artist: "Massimo Pericolo, Crookers, Madame" },
    { title: "Striscia", file: "songs/track-105.mp3", artist: "TonyPitony" },
    { title: "MI PIACCIONO LE NERE", file: "songs/track-106.mp3", artist: "TonyPitony" },
    { title: "CULO", file: "songs/track-107.mp3", artist: "TonyPitony" },
    { title: "BALÙ - Acoustic Version", file: "songs/track-108.mp3", artist: "TonyPitony" },
    { title: "OCCHI MEI", file: "songs/track-109.mp3", artist: "thasup, Mara Sattei" },
    { title: "Non Abbiamo Età", file: "songs/track-110.mp3", artist: "Luchè" },
    { title: "Voodoo", file: "songs/track-111.mp3", artist: "Guè" },
    { title: "Concedimi", file: "songs/track-112.mp3", artist: "Matteo Romano" },
    { title: "INTRO (La Bella Vita)", file: "songs/track-113.mp3", artist: "Artie 5ive" },
    { title: "GIOVANNI", file: "songs/track-114.mp3", artist: "TonyPitony" },
    { title: "15 Piani", file: "songs/track-115.mp3", artist: "Sfera Ebbasta, Marracash" },
    { title: "Labirinto", file: "songs/track-116.mp3", artist: "Luchè" },
    { title: "Nessuna", file: "songs/track-117.mp3", artist: "Luchè" },
    { title: "Babydoll", file: "songs/track-118.mp3", artist: "Dominic Fike" },
    { title: "Baby Mama", file: "songs/track-119.mp3", artist: "Don Pero" },
    { title: "Lo So Che", file: "songs/track-120.mp3", artist: "Capo Plaza" },
    { title: "Scrivendo", file: "songs/track-121.mp3", artist: "nayt" },
    { title: "Vibe", file: "songs/track-122.mp3", artist: "Guè" },
    { title: "Distrutto", file: "songs/track-123.mp3", artist: "Carla Morrison" },
    { title: "marte", file: "songs/track-124.mp3", artist: "thasup" },
    { title: "mi @mio è f@ke", file: "songs/track-125.mp3", artist: "thasup" },
    { title: "slrl", file: "songs/track-126.mp3", artist: "thasup, Lazza, Sfera Ebbasta" },
    { title: "Hey There Delilah", file: "songs/track-127.mp3", artist: "Plain White T's" },
    { title: "STANOTTE", file: "songs/track-128.mp3", artist: "TY1, Coez, Massimo Pericolo" },
    { title: "CRUDELIA - Inervi", file: "songs/track-129.mp3", artist: "Marracash" },
    { title: "ADRENALINA", file: "songs/track-130.mp3", artist: "Samurai Jay, Vito Salamarca" },
    { title: "romantici", file: "songs/track-131.mp3", artist: "Tommaso Paradiso" },
    { title: "RUGGINE", file: "songs/track-133.mp3", artist: "MACE, chiello, Coez" },
    { title: "TUTTO FUORI CONTROLLO", file: "songs/track-134.mp3", artist: "MACE, Kid Yugi, IzI, Franco126" },
    { title: "DAVVERODAVVERO", file: "songs/track-135.mp3", artist: "Artie 5ive", profile: "Ste" },
    { title: "Frosinone", file: "songs/track-136.mp3", artist: "Calcutta", profile: "Ste" },
    { title: "Ex Angelo", file: "songs/track-138.mp3", artist: "Kid Yugi, Sfera Ebbasta, Shablo" },
    { title: "Faccio un casino", file: "songs/track-139.mp3", artist: "Coez" },
    { title: "La musica non c'è", file: "songs/track-140.mp3", artist: "Coez" },
    { title: "Taciturno", file: "songs/track-141.mp3", artist: "Coez, Gemello" },
    { title: "La tua canzone", file: "songs/track-143.mp3", artist: "Coez" },
    { title: "E yo mamma", file: "songs/track-144.mp3", artist: "Coez" },
    { title: "Qualcosa di grande", file: "songs/track-146.mp3", artist: "Coez" },
    { title: "È sempre bello", file: "songs/track-147.mp3", artist: "Coez" },
    { title: "Domenica", file: "songs/track-148.mp3", artist: "Coez" },
    { title: "8 miliardi di persone", file: "songs/track-149.mp3", artist: "Frah Quintale" },
    { title: "Quel sorriso in volto", file: "songs/track-150.mp3", artist: "Modà" },
    { title: "Come un pittore", file: "songs/track-152.mp3", artist: "Modà" },
    { title: "Le luci della città", file: "songs/track-153.mp3", artist: "Coez" },
    { title: "Le parole più grandi", file: "songs/track-154.mp3", artist: "Coez" },
    { title: "Tappeto di fragole", file: "songs/track-155.mp3", artist: "Modà" },
    { title: "Arriverà", file: "songs/track-157.mp3", artist: "Modà" },
    { title: "Ti amo ma non posso dirlo", file: "songs/track-158.mp3", artist: "Modà, Bianca Atzei" },
    { title: "La notte", file: "songs/track-159.mp3", artist: "Modà" },
    { title: "Per una notte insieme", file: "songs/track-160.mp3", artist: "Modà" },
    { title: "E non c'è mai una fine", file: "songs/track-161.mp3", artist: "Modà" },
    { title: "Non è mai abbastanza", file: "songs/track-162.mp3", artist: "Modà" },
    { title: "Dove è sempre sole", file: "songs/track-163.mp3", artist: "Modà" },
    { title: "Se si potesse non morire", file: "songs/track-164.mp3", artist: "Modà" },
    { title: "Lasciami", file: "songs/track-165.mp3", artist: "Modà" },
    { title: "Passione maledetta", file: "songs/track-166.mp3", artist: "Modà" },
    { title: "Quelli come me", file: "songs/track-168.mp3", artist: "Modà" },
    { title: "Salvami", file: "songs/track-169.mp3", artist: "Modà" },
    { title: "Quello che non ti ho detto", file: "songs/track-170.mp3", artist: "Modà" },
    { title: "Favola", file: "songs/track-171.mp3", artist: "Modà" },
    { title: "Mi Fido Di Te", file: "songs/track-173.mp3", artist: "Jovanotti" },
    { title: "A Te", file: "songs/track-174.mp3", artist: "Jovanotti" },
    { title: "Baciami Ancora - Radio Edit", file: "songs/track-175.mp3", artist: "Jovanotti" },
    { title: "Ragazza Magica", file: "songs/track-176.mp3", artist: "Jovanotti" },
    { title: "Autoritratto", file: "songs/track-178.mp3", artist: "Charlie Charles, nayt" },
    { title: "Certe bugie", file: "songs/track-179.mp3", artist: "nayt" },
    { title: "se ne va", file: "songs/track-180.mp3", artist: "nayt, 3D" },
    { title: "Non ti dimentico", file: "songs/track-181.mp3", artist: "Modà" },
    { title: "Le Tasche Piene Di Sassi", file: "songs/track-182.mp3", artist: "Jovanotti" },

    { title: "Tuttok", file: "songs/track-184.mp3", artist: "nayt, 3D" },
    { title: "Dimenticare", file: "songs/track-185.mp3", artist: "nayt, 3D" },
    { title: "Cose che non vuoi sentirti dire", file: "songs/track-187.mp3", artist: "nayt" },
    { title: "Prima che", file: "songs/track-188.mp3", artist: "nayt" },
    { title: "Di abbattere le mura (18 Donne)", file: "songs/track-189.mp3", artist: "nayt" },
    { title: "Mortale", file: "songs/track-190.mp3", artist: "nayt, 3D" },
    { title: "Bad vibes", file: "songs/track-191.mp3", artist: "nayt" },
    { title: "Ci nasci, ci muori", file: "songs/track-192.mp3", artist: "nayt" },
    { title: "Punto d'incontro", file: "songs/track-193.mp3", artist: "nayt" },
    { title: "Forte", file: "songs/track-194.mp3", artist: "nayt" },
    { title: "Noi due", file: "songs/track-195.mp3", artist: "nayt, 3D" },
    { title: "Esistere (più di me)", file: "songs/track-196.mp3", artist: "nayt" },
    { title: "Tutti il resto è noi", file: "songs/track-198.mp3", artist: "nayt, 3D" },
    { title: "Essere noi", file: "songs/track-200.mp3", artist: "nayt" },
    { title: "Lullu - Acoustic Version", file: "songs/track-201.mp3", artist: "nayt, 3D" },
    { title: "ily", file: "songs/track-203.mp3", artist: "thasup, Coez" },
    { title: "Amelie", file: "songs/track-205.mp3", artist: "Kid Yugi" },
    { title: "Per il Sangue Versato", file: "songs/track-206.mp3", artist: "Kid Yugi" },
    { title: "Per te che Lotto", file: "songs/track-207.mp3", artist: "Kid Yugi" },
    { title: "Davide e Golia", file: "songs/track-208.mp3", artist: "Kid Yugi" },
    { title: "cosa conta davvero", file: "songs/track-209.mp3", artist: "nayt, 3D" },
    { title: "Paraguai", file: "songs/track-210.mp3", artist: "nayt, Canova" },
    { title: "m@star", file: "songs/track-211.mp3", artist: "thasup" },
    { title: "gRAZie A Dio", file: "songs/track-212.mp3", artist: "yungest Moonstar, thasup" },
    { title: "Jolly", file: "songs/track-213.mp3", artist: "Kid Yugi" },
    { title: "Il Ferro di Echov", file: "songs/track-215.mp3", artist: "Kid Yugi" },
    { title: "La guerra di Piero", file: "songs/track-216.mp3", artist: "Fabrizio De André" },
    { title: "Bocca di rosa", file: "songs/track-217.mp3", artist: "Fabrizio De André" },
    { title: "Via del campo", file: "songs/track-218.mp3", artist: "Fabrizio De André" },
    { title: "La Canzone Dell'Amore Perduto", file: "songs/track-219.mp3", artist: "Fabrizio De André" },
    { title: "Il pescatore", file: "songs/track-220.mp3", artist: "Fabrizio De André" },
    { title: "Ti Amo", file: "songs/track-221.mp3", artist: "Luchè" },
    { title: "Miami Vice", file: "songs/track-222.mp3", artist: "Luchè, Sfera Ebbasta, Simba La Rue" },
    { title: "Terri", file: "songs/track-224.mp3", artist: "Kid Yugi, Geology" },
    { title: "Star", file: "songs/track-225.mp3", artist: "Luchè" },
    { title: "Torna Da Me", file: "songs/track-226.mp3", artist: "Luchè" },
    { title: "Lo Stesso Viso", file: "songs/track-227.mp3", artist: "Luchè, Da Blonde" },
    { title: "Cosa mi manchi a fare", file: "songs/track-228.mp3", artist: "Calcutta" },
    { title: "Tutti", file: "songs/track-229.mp3", artist: "Calcutta" },
    { title: "Oroscopo", file: "songs/track-230.mp3", artist: "Calcutta, Takagi & Ketra" },
    { title: "Paracetamolo", file: "songs/track-231.mp3", artist: "Calcutta" },
    { title: "Estate", file: "songs/track-232.mp3", artist: "Negromaro" },
    { title: "Meraviglioso", file: "songs/track-233.mp3", artist: "Negromaro" },
    { title: "L'immenso", file: "songs/track-234.mp3", artist: "Negromaro" },
    { title: "Solo 3 min", file: "songs/track-236.mp3", artist: "Negromaro" },
    { title: "Solo Per Te", file: "songs/track-237.mp3", artist: "Negromaro" },
    { title: "A mano a mano", file: "songs/track-239.mp3", artist: "Rino Gaetano" },
    { title: "Ma il cielo è sempre più blu", file: "songs/track-240.mp3", artist: "Rino Gaetano" },
    { title: "Tiscatterò una foto", file: "songs/track-241.mp3", artist: "Tiziano Ferro" },
    { title: "Il Regalo Più Grande", file: "songs/track-242.mp3", artist: "Tiziano Ferro" },
    { title: "L'universo tranne noi", file: "songs/track-243.mp3", artist: "Max Pezzali" },
    { title: "FW/SS25 (Freestyle)", file: "songs/track-244.mp3", artist: "Artie 5ive" },
    { title: "Sono già solo", file: "songs/track-246.mp3", artist: "Modà" },
    { title: "Cuore e vento (feat. Tazenda)", file: "songs/track-247.mp3", artist: "Modà" },
    { title: "So solo che la vita", file: "songs/track-248.mp3", artist: "Jovanotti" },
    { title: "Mentre Tutto Score", file: "songs/track-245.mp3", artist: "Negromaro" },
    { title: "La prima volta", file: "songs/track-249.mp3", artist: "Negromaro" },
    { title: "we fell in love in october", file: "songs/track-250.mp3", artist: "girl in red" },
    { title: "Malo Tebya (Hardstyle Remix)", file: "songs/track-251.mp3", artist: "Zyzz" },
    { title: "Part Of Me (Hardstyle Remix)", file: "songs/track-252.mp3", artist: "Katy Perry" },
    { title: "Judas (Hardstyle Remix)", file: "songs/track-253.mp3", artist: "Lady Gaga" },
    { title: "I'm 20 (In Honour of We Go Jim Finale)", file: "songs/track-254.mp3", artist: "Cold Suhou" },
    { title: "Middle of the Night (Dom Livez Hardstyle Remix)", file: "songs/track-255.mp3", artist: "Kaskade" },
    { title: "I'm So Lucky (Hardstyle)", file: "songs/track-256.mp3", artist: "Lucky Twice" },
    { title: "Middle of the Night (Dom Livez Remix)", file: "songs/track-257.mp3", artist: "Elley Duhe" },
    { title: "Set Fire To The Rain (Hardstyle Remix)", file: "songs/track-258.mp3", artist: "Adele" },
    { title: "Last Friday Night (Hardstyle Remix)", file: "songs/track-259.mp3", artist: "Katy Perry, Zyzz" },
    { title: "I Kissed a Girl (Hardstyle)", file: "songs/track-260.mp3", artist: "Katy Perry" },
    { title: "I Love You So (Jumpstyle Slowed)", file: "songs/track-261.mp3", artist: "YMRTHK" },
    { title: "Black Widow (Hardstyle Remix)", file: "songs/track-263.mp3", artist: "Iggy Azalea, Rita Ora" },

    { title: "Blank Space (Hardstyle)", file: "songs/track-265.mp3", artist: "Taylor Swift" },
    { title: "TiK ToK (Hardstyle Remix)", file: "songs/track-262.mp3", artist: "Katy Perry" },

    { title: "Bruciasse Il Cielo", file: "songs/track-280.mp3", artist: "BLANCO", profile: "Diego" },
    { title: "Vite da sogno (feat. nayt)", file: "songs/track-268.mp3", artist: "3D, nayt", profile: "Diego" },
    { title: "Cratere", file: "songs/track-269.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Accattone", file: "songs/track-270.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Soldi Puliti", file: "songs/track-281.mp3", artist: "Shiva", profile: "Diego" },
    { title: "ALBV", file: "songs/track-272.mp3", artist: "Artie 5ive", profile: "Diego" },
    { title: "Sempre Me", file: "songs/track-273.mp3", artist: "Ghali", profile: "Diego" },
    { title: "Speranza (feat. Diss Gacha)", file: "songs/track-274.mp3", artist: "22simba, Timon, Diss Gacha", profile: "Diego" },
    { title: "vita adrenlina", file: "songs/track-275.mp3", artist: "traparentesi", profile: "Diego" },
    { title: "PARADISO", file: "songs/track-276.mp3", artist: "Promessa, Don Joe", profile: "Diego" },
    { title: "Gran Finale", file: "songs/track-294.mp3", artist: "Drast", profile: "Diego" },
    { title: "whereimat (feat. Artie 5ive)", file: "songs/track-278.mp3", artist: "Ddusi, Artie 5ive", profile: "Diego" },
    { title: "Stay Away (feat. Ketama126, Side Baby & Franco126)", file: "songs/track-279.mp3", artist: "Night Skinny, Ketama126, Side Baby, Franco126", profile: "Diego" },
    { title: "Mezza siga", file: "songs/track-283.mp3", artist: "NERONE", profile: "Diego" },
    { title: "Ne vale la pena (feat. Sayf)", file: "songs/track-284.mp3", artist: "22simba, Sayf", profile: "Diego" },
    { title: "Freedom", file: "songs/track-285.mp3", artist: "22simba", profile: "Diego" },
    { title: "Valle dei Re", file: "songs/track-286.mp3", artist: "22simba", profile: "Diego" },

    { title: "Arricchiti (feat. Guè)", file: "songs/track-288.mp3", artist: "22simba, Guè", profile: "Diego" },
    { title: "Sipario (feat. Promessa)", file: "songs/track-295.mp3", artist: "22simba, Promessa", profile: "Diego" },

    { title: "ALTALENE (feat. Mara Sattei & Coez)", file: "songs/track-291.mp3", artist: "BLOODY VINYL, Slait, thasup, Mara Sattei, Coez", profile: "Diego" },
    { title: "gua10 (feat. Lazza)", file: "songs/track-292.mp3", artist: "thasup, Lazza", profile: "Diego" },
    { title: "EGOISTA", file: "songs/track-293.mp3", artist: "Sayf", profile: "Diego" },
    { title: "20 Anni (feat. Silent Bob)", file: "songs/track-296.mp3", artist: "22simba, Timon, Silent Bob", profile: "Diego" },
    { title: "Provinciali", file: "songs/track-297.mp3", artist: "22simba", profile: "Diego" },
    { title: "20PAIA / FANCULO", file: "songs/track-298.mp3", artist: "Promessa, IDUA", profile: "Diego" },
    { title: "PUGNO DI FERRO (Red Bull 64 Bars)", file: "songs/track-308.mp3", artist: "Artie 5ive", profile: "Diego" },
    { title: "Morire È Niente", file: "songs/track-300.mp3", artist: "Silent Bob, Sick Budd", profile: "Diego" },
    { title: "clavar la espada", file: "songs/track-301.mp3", artist: "Shiro SAGISU", profile: "Diego" },
    { title: "ANSIA NO", file: "songs/track-302.mp3", artist: "FSK SATELLITE", profile: "Diego" },
    { title: "Massafghanistan", file: "songs/track-303.mp3", artist: "Kid Yugi, Night Skinny", profile: "Diego" },
    { title: "QUELLI CHE NON PENSANO - Il cervello", file: "songs/track-304.mp3", artist: "Marracash, Coez", profile: "Diego" },
    { title: "Mu'Ammar Gheddafi (feat. Simba La Rue)", file: "songs/track-305.mp3", artist: "Kid Yugi, Simba La Rue, FT Kings", profile: "Diego" },
    { title: "TELEPHONE (feat. Capo Plaza & Sick Luke)", file: "songs/track-306.mp3", artist: "BLOODY VINYL, Slait, thasup, Low Kidd, MILES, Capo Plaza, Sick Luke", profile: "Diego" },
    { title: "Skyfall", file: "songs/track-307.mp3", artist: "Adele", profile: "Diego" },
    { title: "Morirò da Re", file: "songs/track-309.mp3", artist: "Måneskin", profile: "Diego" },
    { title: "Happy Days", file: "songs/track-310.mp3", artist: "Ghali", profile: "Diego" },
    { title: "Correre (feat. Frah Quintale)", file: "songs/track-311.mp3", artist: "Tony Boy, Frah Quintale", profile: "Diego" },
    { title: "Chicchi di riso", file: "songs/track-312.mp3", artist: "Frah Quintale, Franco126", profile: "Diego" },
    { title: "this is what falling in love feels like", file: "songs/track-313.mp3", artist: "JVKE", profile: "Diego" },
    { title: "Lambada", file: "songs/track-314.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Futuri Possibili", file: "songs/track-315.mp3", artist: "Franco126", profile: "Diego" },
    { title: "Ancora in piedi", file: "songs/track-316.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Dende", file: "songs/track-317.mp3", artist: "Ghali", profile: "Diego" },
    { title: "Gli occhi", file: "songs/track-318.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Sì, ah", file: "songs/track-319.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Chiama me", file: "songs/track-320.mp3", artist: "Coez", profile: "Diego" },
    { title: "Nottetempo (feat. Giorgio Poi)", file: "songs/track-321.mp3", artist: "Franco126, Giorgio Poi", profile: "Diego" },
    { title: "Rock 'N' Roll Queen", file: "songs/track-322.mp3", artist: "Danien & Thee", profile: "Diego" },
    { title: "Blue Sky", file: "songs/track-323.mp3", artist: "Gemitaiz, MadMan", profile: "Diego" },
    { title: "Allucinazioni", file: "songs/track-324.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Amarena", file: "songs/track-325.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Buio di giorno", file: "songs/track-326.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Due ali", file: "songs/track-327.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Fuori fa paura", file: "songs/track-328.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Emozioni", file: "songs/track-329.mp3", artist: "Tony Boy, Finesse, Nardi", profile: "Diego" },
    { title: "Crack (feat. Salmo & Massimo Pericolo)", file: "songs/track-330.mp3", artist: "Coez, Salmo, Massimo Pericolo", profile: "Diego" },
    { title: "rlva (feat. Pinguini Tattici Nucleari)", file: "songs/track-331.mp3", artist: "thasup, Pinguini Tattici Nucleari", profile: "Diego" },
    { title: "Marymango (feat. thasup)", file: "songs/track-332.mp3", artist: "Ghali, thasup", profile: "Diego" },
    { title: "UPPER (feat. thasup & Shiva)", file: "songs/track-333.mp3", artist: "Drillionaire, thasup, Shiva", profile: "Diego" },
    { title: "Coltellata", file: "songs/track-334.mp3", artist: "Gazzelle, thasup", profile: "Diego" },
    { title: "Pioggia di vetro (feat. Sercho)", file: "songs/track-335.mp3", artist: "Mostro, Sercho", profile: "Diego" },
    { title: "Lamborghini", file: "songs/track-336.mp3", artist: "Guè, Sfera Ebbasta", profile: "Diego" },
    { title: "CHROME HEARTS (feat. Nersissima Serpe)", file: "songs/track-337.mp3", artist: "Astro, Nersissima Serpe", profile: "Diego" },
    { title: "Come fare", file: "songs/track-338.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Via da qui", file: "songs/track-339.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Una sola", file: "songs/track-340.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Fuori", file: "songs/track-341.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "golden hour", file: "songs/track-342.mp3", artist: "JVKE", profile: "Diego" },
    { title: "her", file: "songs/track-349.mp3", artist: "JVKE", profile: "Diego" },
    { title: "Una cotta per te", file: "songs/track-344.mp3", artist: "Sayf", profile: "Diego" },
    { title: "Sole a mezzanotte", file: "songs/track-345.mp3", artist: "Gio Montana", profile: "Diego" },
    { title: "Testimonial", file: "songs/track-346.mp3", artist: "Gora", profile: "Diego" },
    { title: "niente x me (feat. Glocky)", file: "songs/track-347.mp3", artist: "Sadturs, KIID, Glocky", profile: "Diego" },
    { title: "re bowser (feat. Khodi)", file: "songs/track-348.mp3", artist: "Sadturs, KIID, Khodi", profile: "Diego" },
    { title: "M' Marc (con Geolier & Sfera Ebbasta)", file: "songs/track-350.mp3", artist: "Shabolo, Geolier, Sfera Ebbasta", profile: "Diego" },
    { title: "BOP BOP", file: "songs/track-351.mp3", artist: "Artie 5ive", profile: "Diego" },
    { title: "Dentro la mia testa", file: "songs/track-352.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Stanza", file: "songs/track-353.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Maledetta primavera", file: "songs/track-363.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Come mi guardi", file: "songs/track-355.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Piumini", file: "songs/track-356.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "PANINARO (feat. Tony Boy, Artie 5ive)", file: "songs/track-357.mp3", artist: "Astro, Tony Boy, Artie 5ive", profile: "Diego" },
    { title: "Sangue di drago", file: "songs/track-358.mp3", artist: "Rancore", profile: "Diego" },
    { title: "Demoni (feat. 22simba)", file: "songs/track-359.mp3", artist: "Sgribaz, 22simba", profile: "Diego" },
    { title: "Cracovia, Pt. 3", file: "songs/track-360.mp3", artist: "Il Tre", profile: "Diego" },
    { title: "Il mese dopo Luglio", file: "songs/track-361.mp3", artist: "18K, 85Prod", profile: "Diego" },
    { title: "Occhi", file: "songs/track-362.mp3", artist: "Close Listen, G Ferrari, Tony Boy", profile: "Diego" },
    { title: "Oltre", file: "songs/track-377.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Fiori Del Male (feat. Sfera Ebbasta)", file: "songs/track-365.mp3", artist: "Dark Polo Gang, Sfera Ebbasta", profile: "Diego" },
    { title: "Storia", file: "songs/track-378.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Introverso", file: "songs/track-367.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Sogni di lean", file: "songs/track-368.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Amici", file: "songs/track-369.mp3", artist: "Massimo Pericolo, Crookers, Nic Sarno", profile: "Diego" },
    { title: "No Kizzy", file: "songs/track-370.mp3", artist: "18K, Kid Yugi", profile: "Diego" },
    { title: "Pepsi & Coca", file: "songs/track-379.mp3", artist: "Danien & Thee", profile: "Diego" },
    { title: "PUTT**A (From the Netflix Rap Show \"Nuova Scena\")", file: "songs/track-390.mp3", artist: "THYNA, Nuova Scena", profile: "Diego" },
    { title: "Homicide (feat. Eminem)", file: "songs/track-372.mp3", artist: "Logic, Eminem", profile: "Diego" },
    { title: "Look What You've Done", file: "songs/track-373.mp3", artist: "Drake", profile: "Diego" },
    { title: "PERCHÉ PIANGO (feat. Kid Yugi)", file: "songs/track-374.mp3", artist: "Sayf, Kid Yugi", profile: "Diego" },
    { title: "Treat You Better", file: "songs/track-375.mp3", artist: "Shawn Mendes", profile: "Diego" },
    { title: "Fame (feat. MadMan)", file: "songs/track-376.mp3", artist: "nayt, 3D, MadMan", profile: "Diego" },
    { title: "Tiam*", file: "songs/track-380.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Per essere vivi", file: "songs/track-381.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "La mia voce", file: "songs/track-382.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Sometimes", file: "songs/track-383.mp3", artist: "Mattyeux, Princess Chelsea, Videoclub", profile: "Diego" },
    { title: "Old Fashion (feat. Promessa e Flaco G)", file: "songs/track-384.mp3", artist: "22simba, Promessa, Flaco G", profile: "Diego" },
    { title: "A Silvia", file: "songs/track-391.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "64 BARRE IN FACCIA (Red Bull 64 Bars)", file: "songs/track-386.mp3", artist: "Artie 5ive, Ddusi, Sadturs, KIID", profile: "Diego" },
    { title: "64 BARRE DI TERROIRE (Red Bull 64 Bars)", file: "songs/track-387.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "RONALDINHO", file: "songs/track-388.mp3", artist: "Astro, Tony Boy", profile: "Diego" },
    { title: "in tilt", file: "songs/track-389.mp3", artist: "Sedici", profile: "Diego" },
    { title: "Lividi (feat. MezzoSangue)", file: "songs/track-392.mp3", artist: "nayt, 3D, Mezzosangue", profile: "Diego" },
    { title: "Il blocco dello scrittore", file: "songs/track-393.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Musica Ovunque", file: "songs/track-394.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "TUTTAPPO'", file: "songs/track-395.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Cartine Cartier", file: "songs/track-396.mp3", artist: "SCH, Sfera Ebbasta", profile: "Diego" },
    { title: "Davide (feat. Coez)", file: "songs/track-397.mp3", artist: "Gemitaiz, Coez", profile: "Diego" },
    { title: "Dancing With The Devil Pt.2", file: "songs/track-398.mp3", artist: "Gemitaiz, Neffa, Ele A", profile: "Diego" },
    { title: "Senza Di Me", file: "songs/track-399.mp3", artist: "MadMan, nayt, Johnny Marsiglia", profile: "Diego" },
    { title: "come fal", file: "songs/track-400.mp3", artist: "thasup", profile: "Diego" },
    { title: "pers0na2 (feat. Gemitaiz, MadMan)", file: "songs/track-401.mp3", artist: "thasup, Gemitaiz, MadMan", profile: "Diego" },
    { title: "ch1 5ei te", file: "songs/track-402.mp3", artist: "thasup", profile: "Diego" },
    { title: "occrl purpl3 (feat. Marracash)", file: "songs/track-403.mp3", artist: "thasup, Marracash", profile: "Diego" },
    { title: "LUMIERE = (con Izi, Ernia, Tony Boy, Digital Astro)", file: "songs/track-404.mp3", artist: "MACE, Izi, Ernia, Tony Boy, Astro", profile: "Diego" },
    { title: "Rock'n'roll", file: "songs/track-405.mp3", artist: "Tony Boy, Sick Luke", profile: "Diego" },
    { title: "CRUDELIA - I nervi", file: "songs/track-406.mp3", artist: "Marracash", profile: "Diego" },
    { title: "Fable", file: "songs/track-423.mp3", artist: "Gigi Perez", profile: "Diego" },
    { title: "Ti penso sempre", file: "songs/track-415.mp3", artist: "chiello", profile: "Diego" },
    { title: "Carusi do sud", file: "songs/track-426.mp3", artist: "Gipsy Prince", profile: "Diego" },
    { title: "clao (feat. Rondodasosa)", file: "songs/track-438.mp3", artist: "thasup, Rondodasosa", profile: "Diego" },
    { title: "Stanotte", file: "songs/track-428.mp3", artist: "Gemello, Gemitaiz", profile: "Diego" },
    { title: "ADRENALINA", file: "songs/track-430.mp3", artist: "Samurai Jay, Vito Salamanca", profile: "Diego" },
    { title: "Voglio Di Più", file: "songs/track-432.mp3", artist: "Silent Bob, Sick Budd", profile: "Diego" },
    { title: "COME SAREBBE IL MONDO SE REGNASSE L'ARTE (feat. 22simba)", file: "songs/track-433.mp3", artist: "Diss Gacha, Sala, 22simba", profile: "Diego" },
    { title: "non avere paura (feat. Astro, Papa V, Sick Luke)", file: "songs/track-434.mp3", artist: "Sadturs, KIID, Astro, Papa V, Sick Luke", profile: "Diego" },
    { title: "che disastrooo", file: "songs/track-435.mp3", artist: "traparentesi", profile: "Diego" },
    { title: "rock & rolla (feat. Rkomi)", file: "songs/track-436.mp3", artist: "thasup, Rkomi", profile: "Diego" },
    { title: "TOKYO DRIFT (feat. Low-Red)", file: "songs/track-437.mp3", artist: "Diss Gacha, Sala, Low-Red", profile: "Diego" },
    { title: "Vulcano", file: "songs/track-424.mp3", artist: "chiello", profile: "Diego" },
    { title: "Morto Mai (Piano Solo)", file: "songs/track-440.mp3", artist: "Lazza", profile: "Diego" },
    { title: "Stare qui", file: "songs/track-425.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Fenomeno", file: "songs/track-443.mp3", artist: "Fabri Fibra", profile: "Diego" },
    { title: "90MIN", file: "songs/track-444.mp3", artist: "Salmo", profile: "Diego" },
    { title: "Acqua salata", file: "songs/track-446.mp3", artist: "chiello", profile: "Diego" },
    { title: "Chicchi di caffè", file: "songs/track-448.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "DARKMONEY (feat. Sfera Ebbasta)", file: "songs/track-449.mp3", artist: "Pyrex, Sfera Ebbasta", profile: "Diego" },
    { title: "Poesia senza veli", file: "songs/track-450.mp3", artist: "Ultimo", profile: "Diego" },
    { title: "Problem Solver", file: "songs/track-451.mp3", artist: "Glocky", profile: "Diego" },
    { title: "Ok", file: "songs/track-452.mp3", artist: "Tony Boy", profile: "Diego" },
    { title: "Blu Notte", file: "songs/track-453.mp3", artist: "Silent Bob, Sick Budd", profile: "Diego" },
    { title: "Anche La Luna", file: "songs/track-454.mp3", artist: "Silent Bob, Sick Budd", profile: "Diego" },
    { title: "Vedova Nera", file: "songs/track-455.mp3", artist: "Silent Bob, Sick Budd", profile: "Diego" },
    { title: "Vendetta", file: "songs/track-456.mp3", artist: "18K", profile: "Diego" },
    { title: "Funghi in salsa rosa", file: "songs/track-457.mp3", artist: "L'Elfo, Funkymann", profile: "Diego" },
    { title: "Stanza Singola (feat. Tommaso Paradiso)", file: "songs/track-458.mp3", artist: "Franco126, Tommaso Paradiso", profile: "Diego" },
    { title: "Soldiers", file: "songs/track-459.mp3", artist: "Il Tre", profile: "Diego" },
    { title: "provare qualcosa", file: "songs/track-460.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Ieri", file: "songs/track-461.mp3", artist: "nayt", profile: "Diego" },
    { title: "La grande fuga", file: "songs/track-462.mp3", artist: "nayt", profile: "Diego" },
    { title: "Collane", file: "songs/track-463.mp3", artist: "nayt, Frenetik&Orang3", profile: "Diego" },
    { title: "BILANCINO (feat. Glocky)", file: "songs/track-464.mp3", artist: "RRARI DAL TACCO, Glocky", profile: "Diego" },
    { title: "Senza Di Me (feat. Venerus & Franco126)", file: "songs/track-466.mp3", artist: "Gemitaiz, Venerus, Franco126", profile: "Diego" },
    { title: "Ex Angelo - Original Version", file: "songs/track-467.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Ricchi x Sempre", file: "songs/track-468.mp3", artist: "Sfera Ebbasta", profile: "Diego" },
    { title: "CANCELLI DI MEZZANOTTE (con CHIELLO)", file: "songs/track-469.mp3", artist: "Rkomi, chiello", profile: "Diego" },
    { title: "Cancellare (feat. nayt)", file: "songs/track-470.mp3", artist: "TROPICO, nayt", profile: "Diego" },
    { title: "Frigobar", file: "songs/track-472.mp3", artist: "Franco126", profile: "Diego" },
    { title: "Voglio di più", file: "songs/track-473.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "PIETÀ (feat. Kid Yugi)", file: "songs/track-474.mp3", artist: "Artie 5ive, Kid Yugi", profile: "Diego" },
    { title: "Ti Dirò - Live Room Version", file: "songs/track-475.mp3", artist: "22simba", profile: "Diego" },
    { title: "Foulard (feat. Tony Boy)", file: "songs/track-477.mp3", artist: "Jerry Sampi, Tony Boy", profile: "Diego" },
    { title: "Highway", file: "songs/track-480.mp3", artist: "Diss Gacha, Sala, Nersissima Serpe, Tony Boy", profile: "Diego" },
    { title: "VENTANNI", file: "songs/track-478.mp3", artist: "Måneskin", profile: "Diego" },
    { title: "siLLy cUp rMx", file: "songs/track-479.mp3", artist: "bloodyfox", profile: "Diego" },
    { title: "CAZZO DI KILO (feat. MUERO)", file: "songs/track-482.mp3", artist: "Pepe, MUERO", profile: "Diego" },
    { title: "Addio xx", file: "songs/track-483.mp3", artist: "nayt", profile: "Diego" },
    { title: "fuck 3x", file: "songs/track-484.mp3", artist: "thasup", profile: "Diego" },
    { title: "Hai visto mai", file: "songs/track-485.mp3", artist: "Frah Quintale", profile: "Diego" },
    { title: "Il Filmografo", file: "songs/track-486.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Victoria (feat. Artie 5ive)", file: "songs/track-487.mp3", artist: "Tony Boy, Artie 5ive", profile: "Diego" },
    { title: "TUTTO FUORI CONTROLLO ∞ (con Franco 126, Kid Yugi, Izi)", file: "songs/track-488.mp3", artist: "MACE, Kid Yugi, Izi, Franco126", profile: "Diego" },
    { title: "Hey There Delilah", file: "songs/track-489.mp3", artist: "Plain White T's", profile: "Diego" },
    { title: "Star Shopping", file: "songs/track-490.mp3", artist: "Lil Peep", profile: "Diego" },
    { title: "La città", file: "songs/track-491.mp3", artist: "Mostro", profile: "Diego" },
    { title: "nuts", file: "songs/track-492.mp3", artist: "Lil Peep, rainy bear", profile: "Diego" },
    { title: "Sintetico (feat. Tony Boy)", file: "songs/track-493.mp3", artist: "Kid Yugi, Night Skinny, Tony Boy", profile: "Diego" },
    { title: "Lucifero", file: "songs/track-494.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Di abbattere le mura (18 Donne)", file: "songs/track-495.mp3", artist: "nayt", profile: "Diego" },
    { title: "Zero rimorsi", file: "songs/track-496.mp3", artist: "Il Tre", profile: "Diego" },
    { title: "Chic", file: "songs/track-497.mp3", artist: "Izi", profile: "Diego" },
    { title: "Concedimi", file: "songs/track-498.mp3", artist: "Matteo Romano", profile: "Diego" },
    { title: "Spettri", file: "songs/track-499.mp3", artist: "nayt, 3D", profile: "Diego" },
    { title: "Amelie", file: "songs/track-500.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Tristano e Isotta", file: "songs/track-501.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Per il Sangue Versato", file: "songs/track-502.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Davide e Golia", file: "songs/track-503.mp3", artist: "Kid Yugi", profile: "Diego" },
    { title: "Le luci della città", file: "songs/track-504.mp3", artist: "Coez", profile: "Diego" },
    { title: "NON MI RICONOSCO ≠ (con centomilaicarie & Salmo)", file: "songs/track-505.mp3", artist: "MACE, centomilaicarie, Salmo", profile: "Diego" },
    { title: "Punto d'incontro", file: "songs/track-506.mp3", artist: "nayt", profile: "Diego" },
    { title: "Ci nasci, ci muori", file: "songs/track-507.mp3", artist: "nayt", profile: "Diego" },
    { title: "Esistere (più di me)", file: "songs/track-508.mp3", artist: "nayt", profile: "Diego" },
    { title: "verdi nei viola", file: "songs/track-509.mp3", artist: "lazza", profile: "Ste" },
    { title: "Ne vale la pena (Version 1)", file: "songs/track-510.mp3", artist: "22simba", profile: "Diego" },

    { title: "httpswww.youtube.comwatchv=ZgvSgtRtax4&list=RDZgvSgtRtax4&start radio=1", file: "songs/track-512.mp3", artist: "", profile: "Diego" },
    { title: "mi manchi", file: "songs/track-513.mp3", artist: "paky", profile: "Ste" },
    { title: "Disfruto - Carla Morrison", file: "songs/track-514.mp3", artist: "Carla Morrison", profile: "Ste" },
    { title: "Jovanotti - A Te", file: "songs/track-515.mp3", artist: "le tasche piene di sassi", profile: "Ste" },
    { title: "non avere paura", file: "songs/track-516.mp3", artist: "tommaso paradiso", profile: "Ste" },
    { title: "Senza armi", file: "songs/youtube-tRuyFtXGNQA.mp3", artist: "nayt", profile: "Ste", cover: "copertine/senza-armi-farfalla.jpg" },
    { title: "Senza armi", file: "songs/youtube-tRuyFtXGNQA.mp3", artist: "nayt", profile: "Diego", cover: "copertine/senza-armi-farfalla.jpg" },
    { title: "KOPI LUWAK (feat. Kid Yugi)", file: "songs/youtube-kopi-luwak.mp3", artist: "TYi, Kid Yugi, Marracash", profile: "Diego", cover: "copertine/kopi-luwak.jpg" },
    { title: "UN UOMO SOLO PUÒ CA...", file: "songs/youtube-un-uomo.mp3", artist: "PRACI, 22simba", profile: "Diego", cover: "copertine/un-uomo.jpg" },
    { title: "Dimmi Chi Sei", file: "songs/youtube-dimmi-chi-sei.mp3", artist: "22simba", profile: "Diego", cover: "copertine/dimmi-chi-sei.jpg" },
    { title: "Ultimo Banco", file: "songs/youtube-ultimo-banco.mp3", artist: "22simba, Nevia", profile: "Diego", cover: "copertine/ultimo-banco.jpg" },
    { title: "Falene", file: "songs/youtube-falene.mp3", artist: "22simba, Nevia", profile: "Diego", cover: "copertine/falene.jpg" },
    { title: "Torna a casa", file: "songs/track-517.mp3", artist: "Måneskin", profile: "Ste" },
    { title: "CORALINE", file: "songs/track-518.mp3", artist: "Måneskin", profile: "Ste" },
    { title: "VENT'ANNI", file: "songs/track-478.mp3", artist: "Måneskin", profile: "Ste" },
    { title: "ZITTI E BUONI", file: "songs/track-520.mp3", artist: "Måneskin", profile: "Ste" },
    { title: "Morirò da Re", file: "songs/track-309.mp3", artist: "Måneskin", profile: "Ste" },
    { title: "Paradise Now", file: "songs/track-521.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "0zzXc6flRgi6n8uPFNMUJE", spotifyAlbum: "The Globe", spotifyDurationMs: 200000 },
    { title: "PUGNO DI FERRO (Red Bull 64 Bars)", file: "songs/track-308.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "1ZBUgZQjNcn367VktdxdAB", spotifyAlbum: "PUGNO DI FERRO (Red Bull 64 Bars)", spotifyDurationMs: 191000 },
    { title: "Kabuki", file: "songs/track-522.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "1RfsHQhszTo9j8fGHcWvGX", spotifyAlbum: "The Globe", spotifyDurationMs: 180000 },
    { title: "Parole Vuote (La Solitudine) (feat. Capo Plaza)", file: "songs/track-523.mp3", artist: "Tedua, Capo Plaza", profile: "Emanuele", spotifyId: "5pfoywYsOxTlXNjwwwHCFJ", spotifyAlbum: "La Divina Commedia (Deluxe)", spotifyDurationMs: 251000 },
    { title: "Back n' Forth (feat. Kira)", file: "songs/track-524.mp3", artist: "Kid Yugi, Kira", profile: "Emanuele", spotifyId: "4zwZzOI3HZif5LmgfvUpdl", spotifyAlbum: "The Globe", spotifyDurationMs: 145000 },
    { title: "Yung 3p 3", file: "songs/track-525.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "59GG4S5hoVOrufgOnruEcI", spotifyAlbum: "The Globe", spotifyDurationMs: 117000 },
    { title: "Denaro (feat. Simba La Rue)", file: "songs/track-526.mp3", artist: "Kid Yugi, Simba La Rue", profile: "Emanuele", spotifyId: "6eAoICZcgE2M9XTAFh8WJZ", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 143000 },
    { title: "L'Anticristo", file: "songs/track-527.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "04BlUntBERmCH6FjsfaYry", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 138000 },
    { title: "Il Ferro di Čechov", file: "songs/track-528.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "0fNKABHyuS6JHqmQyZv3fM", spotifyAlbum: "The Globe", spotifyDurationMs: 191000 },
    { title: "Tristano e Isotta", file: "songs/track-39.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "7dFfkSJrAHnUdKM5jaUOLt", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 217000 },
    { title: "Ferite", file: "songs/track-529.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "2Io79aod9PA58xWjpPrHUr", spotifyAlbum: "FERITE", spotifyDurationMs: 179000 },
    { title: "Tutta La Night", file: "songs/track-530.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "0CUNOGNzjQY5vHgliB7on6", spotifyAlbum: "FERITE", spotifyDurationMs: 167000 },
    { title: "Bene", file: "songs/track-531.mp3", artist: "Gemitaiz", profile: "Emanuele", spotifyId: "4T6EStVuHmV4ptryelTnDv", spotifyAlbum: "Nonostante Tutto", spotifyDurationMs: 237000 },
    { title: "Toradol", file: "songs/track-532.mp3", artist: "Gemitaiz", profile: "Emanuele", spotifyId: "5pxKeRwX7PrGMp5ByUh9lq", spotifyAlbum: "QVC8 (Singles)", spotifyDurationMs: 136000 },
    { title: "Fuori E Dentro", file: "songs/track-533.mp3", artist: "MadMan, Gemitaiz, tha Supreme", profile: "Emanuele", spotifyId: "0BvXGedSWzDnD64xNLl0rs", spotifyAlbum: "Scatola Nera", spotifyDurationMs: 170000 },
    { title: "Minaccia", file: "songs/track-534.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "0RbhNJIb0vOtLbFlcBN3lx", spotifyAlbum: "Minaccia", spotifyDurationMs: 161000 },
    { title: "Baghdad (feat. Kid Yugi)", file: "songs/track-535.mp3", artist: "Young Hash, Mothz, Ksub, Kid Yugi", profile: "Emanuele", spotifyId: "2Q4mwPVCB1mtFDnH0R6YqH", spotifyAlbum: "Adaver", spotifyDurationMs: 151000 },
    { title: "Djadja (feat. Maluma) - Remix", file: "songs/track-1034.mp3", artist: "Aya Nakamura, Maluma", profile: "Emanuele", spotifyId: "6ijnJfMVsQaW9Pk9Zljzn6", spotifyAlbum: "NAKAMURA (Deluxe Edition)", spotifyDurationMs: 166000 },
    { title: "Hola Señorita", file: "songs/track-537.mp3", artist: "GIMS, Maluma", profile: "Emanuele", spotifyId: "5V02xs2x8SvZKmg3WygwiZ", spotifyAlbum: "Ceinture noire (Transcendance)", spotifyDurationMs: 218000 },
    { title: "Non sei tu", file: "songs/track-1035.mp3", artist: "Gazzelle", profile: "Emanuele", spotifyId: "0Slz6GAiiaz3zTlmj538P3", spotifyAlbum: "Superbattito", spotifyDurationMs: 199000 },
    { title: "Non era vero", file: "songs/track-539.mp3", artist: "Emis Killa", profile: "Emanuele", spotifyId: "4Xd6MuMMX41dQbavX4Rq1q", spotifyAlbum: "Terza Stagione", spotifyDurationMs: 228000 },
    { title: "GRAMMELOT", file: "songs/track-540.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "0QZYznuUxIPXs7gY8CPvS4", spotifyAlbum: "The Globe", spotifyDurationMs: 96000 },
    { title: "RAY LIOTTA - goodfellas", file: "songs/track-541.mp3", artist: "Emis Killa, Capo Plaza, Jake La Furia, Baby Gang", profile: "Emanuele", spotifyId: "2ghK72VHQzKy3olZWsrwQ7", spotifyAlbum: "Effetto notte (L'alba)", spotifyDurationMs: 184000 },
    { title: "Trap Phone (feat. Capo Plaza)", file: "songs/track-542.mp3", artist: "Guè, Capo Plaza", profile: "Emanuele", spotifyId: "4dcMymOM4uDaH0NrwdktgN", spotifyAlbum: "Sinatra", spotifyDurationMs: 200000 },
    { title: "Balaclava (feat. Capo Plaza)", file: "songs/track-543.mp3", artist: "Tony Effe, Capo Plaza", profile: "Emanuele", spotifyId: "4zYatWHWblyRliSYAtpsut", spotifyAlbum: "Untouchable", spotifyDurationMs: 187000 },
    { title: "No Stress (feat. A Boogie wit da Hoodie)", file: "songs/track-544.mp3", artist: "Capo Plaza, A Boogie Wit da Hoodie", profile: "Emanuele", spotifyId: "1g2CMj45LJZWxGQYoBye0X", spotifyAlbum: "PLAZA", spotifyDurationMs: 180000 },
    { title: "Day ‘n’ Nite", file: "songs/track-545.mp3", artist: "Kid Cudi", profile: "Emanuele", spotifyId: "2P9HugRjZqZ2v3Sm9JBnIO", spotifyAlbum: "A Kid Named Cudi", spotifyDurationMs: 168000 },
    { title: "ANELLI E COLLANE (feat. ANNA)", file: "songs/track-546.mp3", artist: "Artie 5ive, ANNA", profile: "Emanuele", spotifyId: "0YI32qkEhhUjoGVMGXDm8b", spotifyAlbum: "ASPETTANDO LA BELLA VITA", spotifyDurationMs: 189000 },
    { title: "HOT", file: "songs/track-547.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "0QwWAqI4UglxEiVObWCKvh", spotifyAlbum: "LOCURA", spotifyDurationMs: 216000 },
    { title: "MEZZE VERITÀ (feat. Kid Yugi)", file: "songs/track-548.mp3", artist: "Lazza, Kid Yugi", profile: "Emanuele", spotifyId: "0zrcO7oLJv5hF5nodDbMkw", spotifyAlbum: "LOCURA", spotifyDurationMs: 203000 },
    { title: "CERTE COSE", file: "songs/track-549.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "1Oq3J5blhz3N6IiWJVZRgm", spotifyAlbum: "LOCURA", spotifyDurationMs: 218000 },
    { title: "BUIO DAVANTI", file: "songs/track-550.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "0P0P6DBCa9f5xwBEwwQxZ0", spotifyAlbum: "LOCURA", spotifyDurationMs: 189000 },
    { title: "Dormiamo Insieme", file: "songs/track-551.mp3", artist: "Luchè", profile: "Emanuele", spotifyId: "6lxx9CITx1pYMqSWcf4XmR", spotifyAlbum: "Potere", spotifyDurationMs: 277000 },
    { title: "BUIO DAVANTI", file: "songs/track-1160.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "5MJc4IVIt17xEt6angtZcq", spotifyAlbum: "LOCURA", spotifyDurationMs: 189000 },
    { title: "Vibe", file: "songs/track-122.mp3", artist: "Guè", profile: "Emanuele", spotifyId: "6cGhVnQAJRxGVsltCU06vF", spotifyAlbum: "Tropico Del Capricorno", spotifyDurationMs: 151000 },
    { title: "Male", file: "songs/track-553.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "1Dl5iWa6lWEZpkQDZNuVnO", spotifyAlbum: "Famoso", spotifyDurationMs: 161000 },
    { title: "Lilith", file: "songs/track-33.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "6YB8rH5Lr340A4ps8eV7hw", spotifyAlbum: "I Nomi del Diavolo", spotifyDurationMs: 164000 },
    { title: "PENSIERI SCOMODI (feat. Tony Boy)", file: "songs/track-555.mp3", artist: "IRBIS, Tony Boy", profile: "Emanuele", spotifyId: "0nlenaWsxZML1PawHuiEE2", spotifyAlbum: "PENSIERI SCOMODI (feat. Tony Boy)", spotifyDurationMs: 165000 },
    { title: "64 BARRE DI TERRORE (Red Bull 64 Bars)", file: "songs/track-556.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "3mBdOTUyDnayURcWfUgrXH", spotifyAlbum: "64 BARRE DI TERRORE (Red Bull 64 Bars)", spotifyDurationMs: 189000 },
    { title: "Mossa Strepitosa (feat. Kid Yugi)", file: "songs/track-557.mp3", artist: "Papa V, Night Skinny, Kid Yugi", profile: "Emanuele", spotifyId: "4IthW8rks6srjJB5YxXV7n", spotifyAlbum: "Latte in Polvere", spotifyDurationMs: 141000 },
    { title: "OLÈ (feat. Kid Yugi)", file: "songs/track-1036.mp3", artist: "Geolier, Kid Yugi", profile: "Emanuele", spotifyId: "5AfrJgP5zXuc4zKF67uOXE", spotifyAlbum: "TUTTO È POSSIBILE", spotifyDurationMs: 185000 },
    { title: "Serpenti A Sonagli", file: "songs/track-558.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "5Z0Mx6SeUAFA2rgZB9t1Nu", spotifyAlbum: "Rockstar", spotifyDurationMs: 194000 },
    { title: "Visiera A Becco", file: "songs/track-559.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "4ySxBjhmdnkeFUqhKxW3cY", spotifyAlbum: "Sfera Ebbasta", spotifyDurationMs: 187000 },
    { title: "Jump (feat. Lazza)", file: "songs/track-560.mp3", artist: "Lele Blade, Lazza", profile: "Emanuele", spotifyId: "2wqYVzWlHrIkEoI8YgkyOP", spotifyAlbum: "AMBIZIONE", spotifyDurationMs: 163000 },
    { title: "Callaita", file: "songs/track-561.mp3", artist: "Bad Bunny, Tainy", profile: "Emanuele", spotifyId: "71wFwRo8xGc4lrcyKwsvba", spotifyAlbum: "Un Verano Sin Ti", spotifyDurationMs: 250000 },
    { title: "Blue Sky", file: "songs/track-1037.mp3", artist: "Gemitaiz, MadMan", profile: "Emanuele", spotifyId: "7GVXgE7tWg7NocqdJ2KVos", spotifyAlbum: "Kepler", spotifyDurationMs: 187000 },
    { title: "EL RITMO QUE NOS UNE - feat. Selección Colombia", file: "songs/track-562.mp3", artist: "Ryan Castro, SOG", profile: "Emanuele", spotifyId: "79IBoMfFn67UI15YkP1FSp", spotifyAlbum: "EL RITMO QUE NOS UNE (feat. Selección Colombia)", spotifyDurationMs: 189000 },
    { title: "CHROME HEARTS (feat. Nerissima Serpe)", file: "songs/track-563.mp3", artist: "Astro, Nerissima Serpe", profile: "Emanuele", spotifyId: "6bOwCTgqiUIEuGNdwTDpi5", spotifyAlbum: "WAR", spotifyDurationMs: 164000 },
    { title: "Take 161", file: "songs/track-564.mp3", artist: "Bosca, Real Talk, Lazza", profile: "Emanuele", spotifyId: "4C3mJzyfd6p8qXViu4EQp7", spotifyAlbum: "REAL TALK - LAZZA (1/6 - EP)", spotifyDurationMs: 216000 },
    { title: "Mediterranea", file: "songs/track-565.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "2Up8QSKRV7WnZxZAQasEUq", spotifyAlbum: "Crepe", spotifyDurationMs: 177000 },
    { title: "Mediterranea (feat. De La Ghetto)", file: "songs/track-566.mp3", artist: "Irama, De La Ghetto", profile: "Emanuele", spotifyId: "3LX8i6D8LaqI4QkplaST9d", spotifyAlbum: "Crepe", spotifyDurationMs: 177000 },
    { title: "Giovani Re", file: "songs/track-567.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "1YxG9XcjtJgxTN6OenRh1V", spotifyAlbum: "Famoso", spotifyDurationMs: 168000 },
    { title: "DAL TACCO", file: "songs/track-568.mp3", artist: "RRARI DAL TACCO", profile: "Emanuele", spotifyId: "1zrEskyOLXViiYdZgggiUI", spotifyAlbum: "DAL TACCO", spotifyDurationMs: 147000 },
    { title: "Milionario", file: "songs/track-569.mp3", artist: "Guè, El Micha", profile: "Emanuele", spotifyId: "2JLIQ02OfpuTbkJoiLY6iO", spotifyAlbum: "Gentleman", spotifyDurationMs: 201000 },
    { title: "Goyard", file: "songs/track-570.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "2oyQBfUUcTvMb0ziJU8Z8u", spotifyAlbum: "Hustle Mixtape", spotifyDurationMs: 164000 },
    { title: "MARLBORO", file: "songs/track-571.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "26ZTzjbHlWzob52zEWTTnS", spotifyAlbum: "BIG 5", spotifyDurationMs: 163000 },
    { title: "STUPIDA (feat. Artie 5ive)", file: "songs/track-1038.mp3", artist: "Niky Savage, Blssd, Artie 5ive", profile: "Emanuele", spotifyId: "0wqZcZXczBKh5wbYUet7vV", spotifyAlbum: "RAPPER", spotifyDurationMs: 208000 },
    { title: "38 (feat. RRARI DAL TACCO, Artie 5ive)", file: "songs/track-572.mp3", artist: "Sadturs, KIID, RRARI DAL TACCO, Artie 5ive", profile: "Emanuele", spotifyId: "2KK5IaJLPoQADUmLPME9so", spotifyAlbum: "NO REGULAR MUSIC 2", spotifyDurationMs: 164000 },
    { title: "Tocco Pitocco", file: "songs/track-573.mp3", artist: "RRARI DAL TACCO", profile: "Emanuele", spotifyId: "0gYffd4envdyCft10iF45g", spotifyAlbum: "Tocco Pitocco", spotifyDurationMs: 163000 },
    { title: "A Lei", file: "songs/track-574.mp3", artist: "Papa V, Nerissima Serpe, Fritu", profile: "Emanuele", spotifyId: "50uGP4Bs22S1iPNn1hTo3R", spotifyAlbum: "Mafia Slime 2", spotifyDurationMs: 185000 },
    { title: "Tessera sanitaria (feat. Nerissima Serpe & Papa V)", file: "songs/track-575.mp3", artist: "Night Skinny, Nerissima Serpe, Papa V", profile: "Emanuele", spotifyId: "5JgTIfS7FfSE9tuebzX8HC", spotifyAlbum: "Containers", spotifyDurationMs: 204000 },
    { title: "Armato (feat. Kid Yugi)", file: "songs/track-576.mp3", artist: "Nerissima Serpe, Kid Yugi, Fritu", profile: "Emanuele", spotifyId: "6fgLw0VwPmQtjSmvfCVC6u", spotifyAlbum: "Nerissima", spotifyDurationMs: 205000 },
    { title: "Denti Da Squalo (Red Bull 64 Bars)", file: "songs/track-577.mp3", artist: "Nerissima Serpe, Fritu", profile: "Emanuele", spotifyId: "3e0P1kGICbYGsMshkGSUXK", spotifyAlbum: "Denti Da Squalo (Red Bull 64 Bars)", spotifyDurationMs: 181000 },
    { title: "MONOPOLIO (feat. Kid Yugi, Nerissima Serpe)", file: "songs/track-578.mp3", artist: "TY1, Kid Yugi, Nerissima Serpe", profile: "Emanuele", spotifyId: "7KTseTI8UdMT4WUIOmjTQC", spotifyAlbum: "DJUNGLE UNCHAINED", spotifyDurationMs: 162000 },
    { title: "Tip Tap", file: "songs/track-579.mp3", artist: "Papa V, Nerissima Serpe, Fritu", profile: "Emanuele", spotifyId: "1u9C89v58yfZkMgFe7rBS1", spotifyAlbum: "Mafia Slime 2", spotifyDurationMs: 129000 },
    { title: "Pura Purissima (feat. Nerissima Serpe)", file: "songs/track-1039.mp3", artist: "Papa V, Night Skinny, Nerissima Serpe", profile: "Emanuele", spotifyId: "6pqk8bMGRl6xWCrH9JnYeL", spotifyAlbum: "Latte in Polvere", spotifyDurationMs: 153000 },
    { title: "Wop Wop (feat. Shiva)", file: "songs/track-580.mp3", artist: "Papa V, Nerissima Serpe, Shiva, Night Skinny, Fritu", profile: "Emanuele", spotifyId: "7LjhTVncMxoH9X6KMWECgq", spotifyAlbum: "Mafia Slime 2", spotifyDurationMs: 183000 },
    { title: "PARANOIA", file: "songs/track-581.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "4reJhriuxVQ3bl1YmstMen", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 226000 },
    { title: "Polvere Rosa", file: "songs/track-582.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "0fR79MubHtwcEiGJzUw8Au", spotifyAlbum: "Vangelo", spotifyDurationMs: 215000 },
    { title: "NEON", file: "songs/track-48.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "0jkAr7eZsvWDLYiQCfaxak", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 226000 },
    { title: "Take 5", file: "songs/track-584.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "3sdvDRHwSpuKUehwVYxHcG", spotifyAlbum: "Milano Angels", spotifyDurationMs: 191000 },
    { title: "Take 6", file: "songs/track-587.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "0j4gmizuiIh5k7F62XISiF", spotifyAlbum: "Take 6", spotifyDurationMs: 164000 },
    { title: "7ELEVEN", file: "songs/track-588.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "27teXnNekA5jBFLCcsCFoq", spotifyAlbum: "BIG 5", spotifyDurationMs: 127000 },
    { title: "BIANCA (feat. Kid Yugi)", file: "songs/track-589.mp3", artist: "RRARI DAL TACCO, Kid Yugi", profile: "Emanuele", spotifyId: "420QMNPnHsbAqkkxBt2ifJ", spotifyAlbum: "BIANCA (feat. Kid Yugi)", spotifyDurationMs: 160000 },
    { title: "Porto il Commerciale (feat. Artie 5ive)", file: "songs/track-45.mp3", artist: "Kid Yugi, Night Skinny, Artie 5ive", profile: "Emanuele", spotifyId: "6MQYhSIrh9vwztmM6mwkzQ", spotifyAlbum: "Quarto di Bue", spotifyDurationMs: 144000 },
    { title: "Massafghanistan", file: "songs/track-303.mp3", artist: "Kid Yugi, Night Skinny", profile: "Emanuele", spotifyId: "2z8mWFWbz1dyBqbLWbmPWi", spotifyAlbum: "Quarto di Bue", spotifyDurationMs: 152000 },
    { title: "Ex Angelo (feat. Sfera Ebbasta)", file: "songs/track-591.mp3", artist: "Kid Yugi, Sfera Ebbasta, Shablo", profile: "Emanuele", spotifyId: "3hWOkzOabM7YUsJVa66Uvc", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 178000 },
    { title: "Terr1 (feat. Geolier)", file: "songs/track-29.mp3", artist: "Kid Yugi, Geolier", profile: "Emanuele", spotifyId: "7jTgA81ZcPWchUvhYBfXB6", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 185000 },
    { title: "Eva", file: "songs/track-34.mp3", artist: "Kid Yugi, Tedua, Junior K", profile: "Emanuele", spotifyId: "1N9cKjay4DTN4XpRqIuQTZ", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 160000 },
    { title: "Lilith", file: "songs/track-1161.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "4BNnPQTtYTa5sFDp68R2wt", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 164000 },
    { title: "Il Signore delle Mosche", file: "songs/track-593.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "5rdf1VexuwEmBo6I31ZEFP", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 193000 },
    { title: "Ex Angelo - Original Version", file: "songs/track-467.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "5Ac0RG0vnlsy3e5eeYEryB", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 203000 },
    { title: "64 BARRE DA CENSURA (Red Bull 64 Bars)", file: "songs/track-595.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "0UZOc8qRo3ZlYA2ypR8kZq", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 194000 },
    { title: "Capra a tre Teste (feat. Tony Boy, Artie 5ive)", file: "songs/track-596.mp3", artist: "Kid Yugi, Tony Boy, Artie 5ive", profile: "Emanuele", spotifyId: "4HlGLsk34YNeWVq9sKiRON", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 196000 },
    { title: "Donna", file: "songs/track-40.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "5EeDZPNPIjEtEZsHMkX1m7", spotifyAlbum: "Tutti i Nomi del Diavolo", spotifyDurationMs: 179000 },
    { title: "Push It (feat. ANNA)", file: "songs/track-598.mp3", artist: "Kid Yugi, ANNA", profile: "Emanuele", spotifyId: "3uExyCdMa9XfVuXpuYhod4", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 175000 },
    { title: "Stone Island", file: "songs/track-599.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "7aVQYjayOjDOMUq5ObfflS", spotifyAlbum: "Hustle Mixtape", spotifyDurationMs: 177000 },
    { title: "NewJeans", file: "songs/track-600.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "1C8KgGduDWKvwbFiqARcFq", spotifyAlbum: "20 (Deluxe Edition)", spotifyDurationMs: 159000 },
    { title: "Ultimo Banco", file: "songs/track-601.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "1ze5en56wmbhb7hsiJMXXa", spotifyAlbum: "PLAZA", spotifyDurationMs: 177000 },
    { title: "Billets (feat. Ninho)", file: "songs/track-602.mp3", artist: "Capo Plaza, Ninho", profile: "Emanuele", spotifyId: "2aD5ESGyEhXnXdoOsZvsR0", spotifyAlbum: "20 (Deluxe Edition)", spotifyDurationMs: 198000 },
    { title: "Coupé", file: "songs/track-603.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "0X6TgBHcxe20tNvWuwXEpn", spotifyAlbum: "20 (Deluxe Edition)", spotifyDurationMs: 176000 },
    { title: "Vabbene", file: "songs/track-604.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "5n9Ss9tXZEy5Z18BxYm8KW", spotifyAlbum: "20", spotifyDurationMs: 195000 },
    { title: "Nuovo Inizio (feat. Shiva)", file: "songs/track-605.mp3", artist: "Capo Plaza, Shiva", profile: "Emanuele", spotifyId: "3Fg8eOwcv5ctsjYYajBzFk", spotifyAlbum: "FERITE (Deluxe Edition)", spotifyDurationMs: 171000 },
    { title: "Borse Hermès", file: "songs/track-606.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "1MRDqKrcGYLw883LuVmDjy", spotifyAlbum: "Borse Hermès", spotifyDurationMs: 160000 },
    { title: "Ne è valsa la pena (feat. Ghali)", file: "songs/track-607.mp3", artist: "Capo Plaza, Ghali", profile: "Emanuele", spotifyId: "6GTCOWvhjvdk4pwlfrSjNO", spotifyAlbum: "20", spotifyDurationMs: 234000 },
    { title: "Tesla (feat. Sfera Ebbasta & DrefGold)", file: "songs/track-608.mp3", artist: "Capo Plaza, Sfera Ebbasta, DrefGold", profile: "Emanuele", spotifyId: "093RgZ7RXHZwIrxZhZYX4Q", spotifyAlbum: "20", spotifyDurationMs: 185000 },
    { title: "Capri Sun", file: "songs/track-609.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "1XpmMe95dk9jh3zuOMpeU2", spotifyAlbum: "Hustle Mixtape", spotifyDurationMs: 199000 },
    { title: "Giovane Fuoriclasse", file: "songs/track-610.mp3", artist: "Capo Plaza, AVA", profile: "Emanuele", spotifyId: "7GFCOl2gVEv9d6gwdY5Fvb", spotifyAlbum: "Giovane Fuoriclasse", spotifyDurationMs: 221000 },
    { title: "Mi Riempi Di Chiamate", file: "songs/track-611.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "2wTMDCt0LWSPp0UlXXxlWS", spotifyAlbum: "FERITE", spotifyDurationMs: 192000 },
    { title: "MAYDAY (feat. Capo Plaza)", file: "songs/track-612.mp3", artist: "Sick Luke, Capo Plaza", profile: "Emanuele", spotifyId: "7Eey0kKPfatUEQeldGmxAj", spotifyAlbum: "DOPAMINA", spotifyDurationMs: 174000 },
    { title: "SERPE (feat. Capo Plaza)", file: "songs/track-613.mp3", artist: "Emis Killa, Capo Plaza", profile: "Emanuele", spotifyId: "3RTX4i5PxUEWuXgi9n0CqO", spotifyAlbum: "Musica Triste", spotifyDurationMs: 178000 },
    { title: "Floyd Mayweather (feat. Papa V e Nerissima Serpe)", file: "songs/track-614.mp3", artist: "Capo Plaza, Papa V, Nerissima Serpe", profile: "Emanuele", spotifyId: "3xrtjStNBOWioe7CN7YMDy", spotifyAlbum: "Hustle Mixtape Vol. 2", spotifyDurationMs: 183000 },
    { title: "Larry Hoover", file: "songs/track-615.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "5GiisuLYC3uSKRWROIQGGp", spotifyAlbum: "Hustle Mixtape Vol. 2", spotifyDurationMs: 155000 },
    { title: "Grazie a Dio", file: "songs/track-616.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "2PrWyTk78yOfXaqn4u3OjU", spotifyAlbum: "Hustle Mixtape Vol. 2", spotifyDurationMs: 171000 },
    { title: "Moncler", file: "songs/track-617.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "4UIfhpUA5n6MTHWP7oBPGp", spotifyAlbum: "Hustle Mixtape Vol. 2", spotifyDurationMs: 186000 },
    { title: "Caramel", file: "songs/track-618.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "4DnymAVWXHJVtC27FQDDrq", spotifyAlbum: "Hustle Mixtape Vol. 2", spotifyDurationMs: 180000 },
    { title: "Tití Me Preguntó", file: "songs/track-619.mp3", artist: "Bad Bunny", profile: "Emanuele", spotifyId: "1IHWl5LamUGEuP4ozKQSXZ", spotifyAlbum: "Un Verano Sin Ti", spotifyDurationMs: 243000 },
    { title: "E.T.A. (feat. J Balvin & Geolier)", file: "songs/track-1040.mp3", artist: "Dani Faiv, J Balvin, Geolier, Strage", profile: "Emanuele", spotifyId: "5MM97FmbSq9I2azOWBvXAY", spotifyAlbum: "Ultimo piano", spotifyDurationMs: 175000 },
    { title: "Morto Mai", file: "songs/track-621.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "2Ri0436JKFUsd3B3xa2jCe", spotifyAlbum: "Re Mida", spotifyDurationMs: 145000 },
    { title: "Chuck Norris (feat. Papa V, RRARI DAL TACCO, Nerissima Serpe)", file: "songs/track-622.mp3", artist: "Kid Yugi, Papa V, RRARI DAL TACCO, Nerissima Serpe", profile: "Emanuele", spotifyId: "70EgvEXDIgHUQ4JD6FRhqC", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 203000 },
    { title: "La violenza Necessaria (feat. Shiva)", file: "songs/track-37.mp3", artist: "Kid Yugi, Shiva", profile: "Emanuele", spotifyId: "4gYOPsRynx7hXQm5q47o04", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 163000 },
    { title: "Gilgamesh", file: "songs/track-38.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "09wmUkefYD7B2IWpHP6v3P", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 160000 },
    { title: "Bullet Ballet (feat. Artie 5ive)", file: "songs/track-87.mp3", artist: "Kid Yugi, Artie 5ive", profile: "Emanuele", spotifyId: "1ljOXO8cgSa8qntDVlP9uu", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 211000 },
    { title: "Non Lo So (feat. chiello)", file: "songs/track-625.mp3", artist: "Guè, chiello", profile: "Emanuele", spotifyId: "5mOazYGaNJnv1zxMyNH6Rc", spotifyAlbum: "Tropico Del Capricorno", spotifyDurationMs: 174000 },
    { title: "NULLA ACCADE (feat. Capo Plaza)", file: "songs/track-626.mp3", artist: "Artie 5ive, Rondodasosa, Capo Plaza", profile: "Emanuele", spotifyId: "7aE74PfRukjvuBqte3f0hs", spotifyAlbum: "MOTIVATION 4 THE STREETZ", spotifyDurationMs: 174000 },
    { title: "SWAG MUSIC", file: "songs/track-627.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "3QGY1Tr2MePboAxYtsdbn4", spotifyAlbum: "SWAG MUSIC", spotifyDurationMs: 172000 },
    { title: "Babyface", file: "songs/track-628.mp3", artist: "Shiva, Kid Yugi", profile: "Emanuele", spotifyId: "5LN0gLSxSEaigog3VjCci3", spotifyAlbum: "Vangelo", spotifyDurationMs: 177000 },
    { title: "Dio Esiste", file: "songs/track-629.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "6ErRedGqcOC4HmUEfUneiY", spotifyAlbum: "Vangelo", spotifyDurationMs: 411000 },
    { title: "Cup", file: "songs/track-630.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "5tZLWsGOFHRBxZ96ZRe67z", spotifyAlbum: "Milano Demons", spotifyDurationMs: 167000 },
    { title: "Mogio", file: "songs/track-631.mp3", artist: "18K, 4997, Kid Yugi", profile: "Emanuele", spotifyId: "3K0FEa9zjp9kicaNEhyM1S", spotifyAlbum: "GROTTO INFERNO", spotifyDurationMs: 190000 },
    { title: "EGLI È IL RE", file: "songs/track-1041.mp3", artist: "tha Supreme, Mara Sattei", profile: "Emanuele", spotifyId: "3H2YC5rbsKV4MDmt7JmuA7", spotifyAlbum: "CASA GOSPEL", spotifyDurationMs: 177000 },
    { title: "Paranoie (BIT) [feat. Koba LaD]", file: "songs/track-632.mp3", artist: "Capo Plaza, Koba LaD", profile: "Emanuele", spotifyId: "1sliopGDRjAJDn0KrfvcdA", spotifyAlbum: "Hustle Mixtape", spotifyDurationMs: 233000 },
    { title: "Smooth Criminal - 2012 Remaster", file: "songs/track-1042.mp3", artist: "Michael Jackson", profile: "Emanuele", spotifyId: "5T7ywazdGIydr6JCW6t02j", spotifyAlbum: "Bad (Remastered)", spotifyDurationMs: 257000 },
    { title: "Bad", file: "songs/track-634.mp3", artist: "Michael Jackson", profile: "Emanuele", spotifyId: "3tS8q8SXxtrYSN8UgeQt6q", spotifyAlbum: "Number Ones", spotifyDurationMs: 247000 },
    { title: "Thriller", file: "songs/track-1185.mp3", artist: "Michael Jackson", profile: "Emanuele", spotifyId: "2LlQb7Uoj1kKyGhlkBf9aC", spotifyAlbum: "Thriller", spotifyDurationMs: 358000 },
    { title: "Billie Jean", file: "songs/track-636.mp3", artist: "Michael Jackson", profile: "Emanuele", spotifyId: "7J1uxwnxfQLu4APicE5Rnj", spotifyAlbum: "Thriller", spotifyDurationMs: 293000 },
    { title: "Beat It", file: "songs/track-637.mp3", artist: "Michael Jackson", profile: "Emanuele", spotifyId: "3BovdzfaX4jb5KFQwoPfAw", spotifyAlbum: "Thriller", spotifyDurationMs: 258000 },
    { title: "They Don't Care About Us", file: "songs/track-638.mp3", artist: "Michael Jackson", profile: "Emanuele", spotifyId: "3wuCCNCnBhJlwkIJTBZFiv", spotifyAlbum: "HIStory - PAST, PRESENT AND FUTURE - BOOK I", spotifyDurationMs: 284000 },
    { title: "Las Muñequitas", file: "songs/track-639.mp3", artist: "Mr Plata, El Americano 4KT", profile: "Emanuele", spotifyId: "3yidFe42tke37g3KP7wzZr", spotifyAlbum: "Las Muñequitas", spotifyDurationMs: 199000 },
    { title: "CERTE COSE", file: "songs/track-1162.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "6dXMNTe1ztrLn3Ej1ZR7Ha", spotifyAlbum: "LOCURA", spotifyDurationMs: 218000 },
    { title: "DONNE RICCHE - Acoustic Version", file: "songs/track-640.mp3", artist: "TonyPitony", profile: "Emanuele", spotifyId: "6gG8GZAscnEI9fqHvcu1QN", spotifyAlbum: "PECCATO PER I TESTI (Acoustic Version)", spotifyDurationMs: 172000 },
    { title: "Taki Taki (feat. Selena Gomez, Ozuna & Cardi B)", file: "songs/track-641.mp3", artist: "DJ Snake, Selena Gomez, Ozuna, Cardi B", profile: "Emanuele", spotifyId: "0KoiMHhqKLoL4xM54rcWYY", spotifyAlbum: "Carte Blanche", spotifyDurationMs: 212000 },
    { title: "Loco Contigo (feat. J. Balvin & Tyga)", file: "songs/track-642.mp3", artist: "DJ Snake, J Balvin, Tyga", profile: "Emanuele", spotifyId: "6osaMSJh9NguagEDQcZaKx", spotifyAlbum: "Carte Blanche", spotifyDurationMs: 185000 },
    { title: "Davide (feat. Coez)", file: "songs/track-397.mp3", artist: "Gemitaiz, Coez", profile: "Emanuele", spotifyId: "7eJV1g6HtmMVuAHLi6yFqe", spotifyAlbum: "Davide", spotifyDurationMs: 206000 },
    { title: "Cascare nei tuoi occhi", file: "songs/track-643.mp3", artist: "Ultimo", profile: "Emanuele", spotifyId: "2Jh2ElHIfT9Qy4OMCpccuz", spotifyAlbum: "Peter Pan", spotifyDurationMs: 226000 },
    { title: "Eye of the Tiger", file: "songs/track-644.mp3", artist: "Survivor", profile: "Emanuele", spotifyId: "2KH16WveTQWT6KOG9Rg6e2", spotifyAlbum: "Rocky IV", spotifyDurationMs: 245000 },
    { title: "$€ Freestyle", file: "songs/track-645.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "1CUmDIdhiRGCVFNWDAZ4uo", spotifyAlbum: "Famoso", spotifyDurationMs: 164000 },
    { title: "HO SOLO 64 BARRE (Red Bull 64 Bars)", file: "songs/track-646.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "5o57KIwHBjPTUUezWuYVY2", spotifyAlbum: "HO SOLO 64 BARRE (Red Bull 64 Bars)", spotifyDurationMs: 240000 },
    { title: "ZERI IN PIÙ (LOCURA) (feat. Laura Pausini)", file: "songs/track-647.mp3", artist: "Lazza, Laura Pausini", profile: "Emanuele", spotifyId: "3pU6HEylYwJhz6JmOlilRj", spotifyAlbum: "LOCURA", spotifyDurationMs: 247000 },
    { title: "ABITUDINE", file: "songs/track-648.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "31jwlUykpZwTlrwBNVX2X8", spotifyAlbum: "LOCURA", spotifyDurationMs: 189000 },
    { title: "VERDI NEI VIOLA", file: "songs/track-509.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "1tJ53CZZdkyirTLrc31NzJ", spotifyAlbum: "LOCURA", spotifyDurationMs: 183000 },
    { title: "FENTANYL (feat. Sfera Ebbasta)", file: "songs/track-650.mp3", artist: "Lazza, Sfera Ebbasta", profile: "Emanuele", spotifyId: "5lJZ4urLI5JEVGM8tKRSNj", spotifyAlbum: "LOCURA", spotifyDurationMs: 188000 },
    { title: "Baby Girl", file: "songs/track-651.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "35JHeT2zURSbrhwZW4cPry", spotifyAlbum: "FERITE", spotifyDurationMs: 137000 },
    { title: "Non Fare Così", file: "songs/track-652.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "769M2rTiAoL7x2lKDHLjRa", spotifyAlbum: "PLAZA", spotifyDurationMs: 192000 },
    { title: "Giovane fuoriclasse", file: "songs/track-653.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "60muwbD6E61lEYQSnEYlLc", spotifyAlbum: "20", spotifyDurationMs: 221000 },
    { title: "NON METTERCI BECCO", file: "songs/track-1043.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "0xruiSHt6TaFZvQuGdDlJV", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 182000 },
    { title: "COME SE NON FOSSI NEI GUAI", file: "songs/track-655.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "46w75NfLpau9juuoeiY3ZM", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 209000 },
    { title: "OVER (demo)", file: "songs/track-656.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "1OPMzw2D1v6mVqL7wwQ92t", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 209000 },
    { title: "D&G", file: "songs/track-657.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "0luviSdchM1B0rrTmb4P0A", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 232000 },
    { title: "Che Dio Mi Benedica", file: "songs/track-658.mp3", artist: "Luchè", profile: "Emanuele", spotifyId: "7ohj51SSBsOPh2phOZkn9d", spotifyAlbum: "Malammore", spotifyDurationMs: 218000 },
    { title: "64 BARRE DA CENSURA (Red Bull 64 Bars)", file: "songs/track-1163.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "1cyes3Q6UBIIZukTDA4ExV", spotifyAlbum: "I Nomi del Diavolo", spotifyDurationMs: 187000 },
    { title: "Nuovo Canada", file: "songs/track-659.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "3RnOMqo1mAh4yRbLzKx5iO", spotifyAlbum: "PLAZA (Deluxe Edition)", spotifyDurationMs: 184000 },
    { title: "Albachiara", file: "songs/track-1188.mp3", artist: "Vasco Rossi", profile: "Emanuele", spotifyId: "53MYtv4tzLYg1hbu13Qbc0", spotifyAlbum: "Albachiara", spotifyDurationMs: 245000 },
    { title: "L'Emozione Non Ha Voce (Io Non So Parlar D'Amore)", file: "songs/track-1197.mp3", artist: "Adriano Celentano", profile: "Emanuele", spotifyId: "6QDbrhZDKku58X7iv7cKKr", spotifyAlbum: "Io Non So Parlar D'Amore", spotifyDurationMs: 249000 },
    { title: "Cinque giorni", file: "songs/track-662.mp3", artist: "Michele Zarrillo", profile: "Emanuele", spotifyId: "5zB92i6HcCHvVcX5NvGFQb", spotifyAlbum: "Come Uomo Tra Gli Uomini", spotifyDurationMs: 249000 },
    { title: "Mu'Ammar Gheddafi (feat. Simba La Rue)", file: "songs/track-305.mp3", artist: "Kid Yugi, Simba La Rue, FT Kings", profile: "Emanuele", spotifyId: "6Nr1XULPuJgumCyXBEfcgx", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 149000 },
    { title: "Con il nastro rosa - Remastered", file: "songs/track-1198.mp3", artist: "Lucio Battisti", profile: "Emanuele", spotifyId: "2g3wyAWIAvmjfZ8K6Jb4Zn", spotifyAlbum: "Una giornata uggiosa", spotifyDurationMs: 321000 },
    { title: "Poetica", file: "songs/track-664.mp3", artist: "Cesare Cremonini", profile: "Emanuele", spotifyId: "07qo9gnLM488CUr0EtgIA1", spotifyAlbum: "Possibili Scenari", spotifyDurationMs: 293000 },
    { title: "UNDERDOG", file: "songs/track-665.mp3", artist: "IvanBi", profile: "Emanuele", spotifyId: "2wbYng1DQu7Rexd0CBIEoc", spotifyAlbum: "UNDERDOG", spotifyDurationMs: 194000 },
    { title: "Samsung (feat. Artie 5ive)", file: "songs/track-666.mp3", artist: "Papa V, Nerissima Serpe, Artie 5ive, Fritu", profile: "Emanuele", spotifyId: "3f1jFXeKXlRPhW1S8yEgmj", spotifyAlbum: "Mafia Slime 2", spotifyDurationMs: 195000 },
    { title: "L'astronauta", file: "songs/track-23.mp3", artist: "nayt", profile: "Emanuele", spotifyId: "5SKziDfyRfyHgqjvDFWcJ9", spotifyAlbum: "io Individuo", spotifyDurationMs: 200000 },
    { title: "Battle Royale", file: "songs/track-1044.mp3", artist: "Hell Raton, Bassi Maestro, Rasty Kilo, MadMan, En?gma, Noyz Narcos, Jack The Smoker, Salmo, Rocco Hunt, Gemitaiz", profile: "Emanuele", spotifyId: "2Dy8UvEAQSzHUivMvPR7hx", spotifyAlbum: "Machete Mixtape, Vol. 3", spotifyDurationMs: 516000 },
    { title: "00", file: "songs/track-1143.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "3Z1N6PnBejFsiMWrhorGhw", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 134000 },
    { title: "LITORALE (feat. Guè)", file: "songs/track-668.mp3", artist: "Artie 5ive, Guè", profile: "Emanuele", spotifyId: "24nrhZIVZFCjiRfmY44YKe", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 232000 },
    { title: "BETTY BOOP (feat. Artie 5ive)", file: "songs/track-669.mp3", artist: "LILCR, Artie 5ive", profile: "Emanuele", spotifyId: "2rNxRLShYAjeIUUYA89wUQ", spotifyAlbum: "PROGETTO X DELUXE", spotifyDurationMs: 150000 },
    { title: "Con Te Partirò", file: "songs/track-670.mp3", artist: "Andrea Bocelli", profile: "Emanuele", spotifyId: "7s8xAb9nzBQbB0z3QZPmKK", spotifyAlbum: "Bocelli (Remastered)", spotifyDurationMs: 250000 },
    { title: "SEI PERSA", file: "songs/track-671.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "3smgQO8B4MQK6bbBrfHEX6", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 178000 },
    { title: "Push It (feat. ANNA)", file: "songs/track-1164.mp3", artist: "Kid Yugi, ANNA", profile: "Emanuele", spotifyId: "5FLxKWv8HEFI67uKzSX27K", spotifyAlbum: "Push It (feat. ANNA)", spotifyDurationMs: 175000 },
    { title: "Stavo Pensando A Te", file: "songs/track-672.mp3", artist: "Fabri Fibra", profile: "Emanuele", spotifyId: "3UPigmZoN3ahvBgQdU9VK5", spotifyAlbum: "Fenomeno", spotifyDurationMs: 264000 },
    { title: "Tipo Nino Vs Kabrinha", file: "songs/track-673.mp3", artist: "DJ Biel Divulga, DJ Dozabri, Mc Lekão", profile: "Emanuele", spotifyId: "1jxQFCC0ukN7AaUwXWK0N8", spotifyAlbum: "Tipo Nino Vs Kabrinha", spotifyDurationMs: 201000 },
    { title: "MAYBACH", file: "songs/track-674.mp3", artist: "Sfera Ebbasta, Shiva", profile: "Emanuele", spotifyId: "6WjDjQJ5JpUqPJpDCQmHqa", spotifyAlbum: "SANTANA MONEY GANG", spotifyDurationMs: 163000 },
    { title: "Stato Di Ebbrezza", file: "songs/track-675.mp3", artist: "Silent Bob, Sick Budd", profile: "Emanuele", spotifyId: "5nMnEELMA1BMl0lQrHPtry", spotifyAlbum: "Piano B", spotifyDurationMs: 189000 },
    { title: "Leggenda", file: "songs/track-676.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "17bXwlGLFeAGCaIMBwjq5k", spotifyAlbum: "Rockstar", spotifyDurationMs: 189000 },
    { title: "Avvoltoi", file: "songs/track-677.mp3", artist: "Eddie Brock", profile: "Emanuele", spotifyId: "3ByNcS81LqRYUvJjpWhZ7T", spotifyAlbum: "Avvoltoi", spotifyDurationMs: 165000 },
    { title: "se ne va", file: "songs/track-180.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "3zWXAQuZ2cgRb2p0xqAORS", spotifyAlbum: "HABITAT", spotifyDurationMs: 163000 },
    { title: "FERRARI", file: "songs/track-679.mp3", artist: "LILCR", profile: "Emanuele", spotifyId: "2ZLKmvV33uhWyEqZ54Wb2B", spotifyAlbum: "PROGETTO X", spotifyDurationMs: 100000 },
    { title: "PAROLE (Sono solo parole) (feat. Noemi, Lazza & Tedua)", file: "songs/track-1045.mp3", artist: "Drillionaire, Noemi, Lazza, Tedua", profile: "Emanuele", spotifyId: "1mblCC44D31Yu2o3DhrvbJ", spotifyAlbum: "10", spotifyDurationMs: 256000 },
    { title: "DARKMONEY (feat. Sfera Ebbasta)", file: "songs/track-449.mp3", artist: "Pyrex, Sfera Ebbasta", profile: "Emanuele", spotifyId: "1SWUq0qtTSDRGrDtgq7POw", spotifyAlbum: "KING OF DARK", spotifyDurationMs: 166000 },
    { title: "Como Te Llamas (feat. Willy William)", file: "songs/track-681.mp3", artist: "Irama, Willy William", profile: "Emanuele", spotifyId: "0xYIPUmglTa2xlUZmOpa5e", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 165000 },
    { title: "Baila Baila Baila - Remix", file: "songs/track-682.mp3", artist: "Ozuna, Daddy Yankee, J Balvin, Farruko, Anuel AA", profile: "Emanuele", spotifyId: "7mWFF4gPADjTQjC97CgFVt", spotifyAlbum: "Baila Baila Baila (Remix) [feat. Farruko, Anuel Aa]", spotifyDurationMs: 235000 },
    { title: "Bailando - Spanish Version", file: "songs/track-1046.mp3", artist: "Enrique Iglesias, Descemer Bueno, Gente De Zona", profile: "Emanuele", spotifyId: "6PSKhwo0mVcOdjUOhVJd5p", spotifyAlbum: "SEX AND LOVE", spotifyDurationMs: 242000 },
    { title: "Me Rehúso", file: "songs/track-684.mp3", artist: "Danny Ocean", profile: "Emanuele", spotifyId: "6De0lHrwBfPfrhorm9q1Xl", spotifyAlbum: "Me Rehúso", spotifyDurationMs: 205000 },
    { title: "PHANTOM (feat. 50 Cent)", file: "songs/track-685.mp3", artist: "Geolier, 50 Cent", profile: "Emanuele", spotifyId: "435NOlfzITSEghoaUNRle3", spotifyAlbum: "PHANTOM (feat. 50 Cent)", spotifyDurationMs: 172000 },
    { title: "Fino All'Alba", file: "songs/track-686.mp3", artist: "Capo Plaza, Takagi & Ketra", profile: "Emanuele", spotifyId: "5nvVV6XRIWs4DNVAQfxElX", spotifyAlbum: "Fino All'Alba", spotifyDurationMs: 157000 },
    { title: "Soldi Arrotolati (feat. ANNA)", file: "songs/track-687.mp3", artist: "Capo Plaza, ANNA", profile: "Emanuele", spotifyId: "1zp4TEQ9zaNGXTjY6fsz1p", spotifyAlbum: "FERITE", spotifyDurationMs: 151000 },
    { title: "I Miss U (feat. Tony Boy)", file: "songs/track-688.mp3", artist: "Capo Plaza, Tony Boy", profile: "Emanuele", spotifyId: "52vA7mR6kKFJTaMzRUKMmk", spotifyAlbum: "FERITE", spotifyDurationMs: 183000 },
    { title: "Lo So Che", file: "songs/track-120.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "3w73qvCSGWPCx7w1UMIh6e", spotifyAlbum: "FERITE (Deluxe Edition)", spotifyDurationMs: 181000 },
    { title: "Oh Amore", file: "songs/track-689.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "0QEI2IrwYKZNppR1W62jXj", spotifyAlbum: "FERITE", spotifyDurationMs: 225000 },
    { title: "Busy", file: "songs/track-690.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "3WyrKzgCeGQQcUtW8ZwLMP", spotifyAlbum: "FERITE", spotifyDurationMs: 160000 },
    { title: "Non C'è Love", file: "songs/track-691.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "6SbD3zpxiqS9F4YHtaGEC1", spotifyAlbum: "FERITE", spotifyDurationMs: 167000 },
    { title: "Acqua Passata", file: "songs/track-692.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "0wTUTktrrCdXAzPVlodP72", spotifyAlbum: "FERITE", spotifyDurationMs: 189000 },
    { title: "Patek Philippe (feat. Lazza)", file: "songs/track-693.mp3", artist: "Lacrim, Lazza", profile: "Emanuele", spotifyId: "6sukW44PrvVzeko9KZlqen", spotifyAlbum: "Cipriani", spotifyDurationMs: 216000 },
    { title: "OGNI AMICO MIO", file: "songs/track-694.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "3zgyiQGgT3OyBa2gsds6UV", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 179000 },
    { title: "Warzone (feat. Artie 5ive, Capo Plaza & Nerissima Serpe)", file: "songs/track-695.mp3", artist: "Nko, Artie 5ive, Capo Plaza, Nerissima Serpe", profile: "Emanuele", spotifyId: "6iFfFjKnr615pD7aL5Z2Cx", spotifyAlbum: "Warzone (feat. Artie 5ive, Capo Plaza & Nerissima Serpe)", spotifyDurationMs: 146000 },
    { title: "Easy (feat. Fivio Foreign)", file: "songs/track-696.mp3", artist: "Sfera Ebbasta, Rvssian, Fivio Foreign", profile: "Emanuele", spotifyId: "0DpTRR4HyiDJH4Waoj9hXU", spotifyAlbum: "Italiano", spotifyDurationMs: 206000 },
    { title: "Forte e chiaro", file: "songs/track-697.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "0SHcPBePTpLy22XVvVmYqu", spotifyAlbum: "20", spotifyDurationMs: 219000 },
    { title: "Il Filmografo", file: "songs/track-27.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "5nqOdSrqurNq8ejE7Ujc9l", spotifyAlbum: "The Globe", spotifyDurationMs: 146000 },
    { title: "Amelie", file: "songs/track-205.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "0O5KcmgOeEgublW6ySQ6Vc", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 184000 },
    { title: "Jolly", file: "songs/track-213.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "6R13pKWNdELuiJKy47pWtB", spotifyAlbum: "Anche gli Eroi Muoiono", spotifyDurationMs: 173000 },
    { title: "FIGLIO UNICO (feat. Kid Yugi, Ernia)", file: "songs/track-698.mp3", artist: "Irama, Rkomi, Ernia, Kid Yugi", profile: "Emanuele", spotifyId: "096BYC8tm5zUgfM4ohTcdD", spotifyAlbum: "NO STRESS", spotifyDurationMs: 245000 },
    { title: "OLÈ (feat. Kid Yugi)", file: "songs/track-1165.mp3", artist: "Geolier, Kid Yugi", profile: "Emanuele", spotifyId: "0FZtlHn0k4BDCLd2s38PIU", spotifyAlbum: "TUTTO È POSSIBILE", spotifyDurationMs: 185000 },
    { title: "Strada facendo", file: "songs/track-699.mp3", artist: "Claudio Baglioni", profile: "Emanuele", spotifyId: "1HVMNGm6RhLKbqRl0cQa3A", spotifyAlbum: "Tutti Qui", spotifyDurationMs: 334000 },
    { title: "E tu...", file: "songs/track-700.mp3", artist: "Claudio Baglioni", profile: "Emanuele", spotifyId: "7GrkHS3TW3AlcIqpi6LSRw", spotifyAlbum: "E Tu...", spotifyDurationMs: 287000 },
    { title: "Avrai", file: "songs/track-701.mp3", artist: "Claudio Baglioni", profile: "Emanuele", spotifyId: "6Hw9oznjBKnobCRieldN4e", spotifyAlbum: "Tutti Qui", spotifyDurationMs: 320000 },
    { title: "FLIP FLOP", file: "songs/track-1153.mp3", artist: "IvanBi", profile: "Emanuele", spotifyId: "65HCij9McdqrHcBn0Z3kMP", spotifyAlbum: "FLIP FLOP", spotifyDurationMs: 148000 },
    { title: "G&V", file: "songs/track-79.mp3", artist: "IvanBi", profile: "Emanuele", spotifyId: "6poK4dgWF5wQmmB7i92mhh", spotifyAlbum: "G&V", spotifyDurationMs: 112000 },
    { title: "L'Anticristo", file: "songs/track-1166.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyId: "7CWoRDIMfhEbfYzdD9noJm", spotifyAlbum: "I Nomi del Diavolo", spotifyDurationMs: 138000 },
    { title: "Arai (feat. Capo Plaza)", file: "songs/track-703.mp3", artist: "Medy, Capo Plaza", profile: "Emanuele", spotifyId: "1la73rdzbQGNRFJyO9E71c", spotifyAlbum: "Nove Chiamate", spotifyDurationMs: 181000 },
    { title: "DEM (feat. Artie 5ive & Tony Boy)", file: "songs/track-704.mp3", artist: "Kid Yugi, Artie 5ive, Tony Boy", profile: "Emanuele", spotifyId: "1r2uK7MHJbvR8ygrTIsUrX", spotifyAlbum: "The Globe", spotifyDurationMs: 212000 },
    { title: "End of Beginning", file: "songs/track-705.mp3", artist: "Djo", profile: "Emanuele", spotifyId: "3qhlB30KknSejmIvZZLjOD", spotifyAlbum: "DECIDE", spotifyDurationMs: 159000 },
    { title: "Uber", file: "songs/track-706.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "4oZhBLWGhtIyBckervj3sb", spotifyAlbum: "Rockstar", spotifyDurationMs: 187000 },
    { title: "Dolce E Amara", file: "songs/track-707.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "04kfXkgDvjb8LApZyOfS2Y", spotifyAlbum: "FERITE (Deluxe Edition)", spotifyDurationMs: 183000 },
    { title: "Ballon d'Or (feat. Nayt)", file: "songs/track-95.mp3", artist: "Gemitaiz, nayt", profile: "Emanuele", spotifyId: "5aVUDn1F4x26UkHFVgWsiE", spotifyAlbum: "QVC 10 - Quello Che Vi Consiglio Vol. 10", spotifyDurationMs: 185000 },
    { title: "Diavolo magro", file: "songs/track-1144.mp3", artist: "Mostro", profile: "Emanuele", spotifyId: "45MKRQEdcAa8bIN9Yh4jz0", spotifyAlbum: "The Illest, Vol. 2", spotifyDurationMs: 160000 },
    { title: "Purosangue (feat. Shiva)", file: "songs/track-709.mp3", artist: "Luchè, Shiva", profile: "Emanuele", spotifyId: "5ZzDWDMYnWK8qwcOjVyoPv", spotifyAlbum: "Purosangue (feat. Shiva)", spotifyDurationMs: 170000 },
    { title: "Le Pietre Non Volano (feat. Marracash)", file: "songs/track-710.mp3", artist: "Luchè, Marracash", profile: "Emanuele", spotifyId: "5hjMhdi5EBlwpcthmhUgOD", spotifyAlbum: "Dove Volano Le Aquile", spotifyDurationMs: 299000 },
    { title: "Nessuna", file: "songs/track-117.mp3", artist: "Luchè", profile: "Emanuele", spotifyId: "5bhYjElbPmm2FyB0PxP8Wd", spotifyAlbum: "Il mio lato peggiore", spotifyDurationMs: 223000 },
    { title: "Ti Amo", file: "songs/track-221.mp3", artist: "Luchè", profile: "Emanuele", spotifyId: "1pq4fzp7UvGPLGzueOKaEf", spotifyAlbum: "Malammore", spotifyDurationMs: 265000 },
    { title: "Torna Da Me", file: "songs/track-226.mp3", artist: "Luchè", profile: "Emanuele", spotifyId: "5iSHLCuc0K3pUW16b7sSP4", spotifyAlbum: "Potere", spotifyDurationMs: 180000 },
    { title: "Iside (feat. Luchè)", file: "songs/track-711.mp3", artist: "Lazza, Luchè", profile: "Emanuele", spotifyId: "6BNMAb82xLiPv1ZngMQOBK", spotifyAlbum: "Re Mida", spotifyDurationMs: 152000 },
    { title: "DUBBI", file: "songs/track-712.mp3", artist: "Marracash", profile: "Emanuele", spotifyId: "4gxRyOZefp95AXZFaztdtO", spotifyAlbum: "NOI, LORO, GLI ALTRI", spotifyDurationMs: 234000 },
    { title: "MADAME - L'anima (feat. Madame)", file: "songs/track-713.mp3", artist: "Marracash, Madame", profile: "Emanuele", spotifyId: "3go5ZuMoFTKl5ugai8nAKi", spotifyAlbum: "Persona", spotifyDurationMs: 221000 },
    { title: "Nati Bastardi (feat. Tony Effe)", file: "songs/track-719.mp3", artist: "Capo Plaza, Tony Effe, Sick Luke", profile: "Emanuele", spotifyId: "3KjhBp5a2tFcmN9YSPR5r3", spotifyAlbum: "FERITE (Deluxe Edition)", spotifyDurationMs: 151000 },
    { title: "MONTECARLO", file: "songs/track-720.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "0V780obZeM832e7Rx5rAui", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 165000 },
    { title: "SOGNO AMERICANO", file: "songs/track-88.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "7i0zYckMTyvLyKAFxfOKIS", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 176000 },
    { title: "ARE U CRAZY? (feat. Capo Plaza)", file: "songs/track-721.mp3", artist: "Artie 5ive, Capo Plaza", profile: "Emanuele", spotifyId: "76WVRLJz4mvh7PaXkl0dW1", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 207000 },
    { title: "INTRO (La Bella Vita)", file: "songs/track-113.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "1lslS1hUsIvAScXvWVTLt2", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 211000 },
    { title: "DAVVERODAVVERO", file: "songs/track-722.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "6bdTp8Jkp3IAU15rVPWFuJ", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 165000 },
    { title: "64 BARRE IN FACCIA (Red Bull 64 Bars)", file: "songs/track-386.mp3", artist: "Artie 5ive, Ddusi, Sadturs, KIID", profile: "Emanuele", spotifyId: "1oBM9JTuD0wqfVQ8iuLjLQ", spotifyAlbum: "64 BARRE IN FACCIA (Red Bull 64 Bars)", spotifyDurationMs: 175000 },
    { title: "Angela", file: "songs/track-724.mp3", artist: "Checco Zalone, Mitili Ignoti", profile: "Emanuele", spotifyId: "4AMwEGVsLR0ApxAhtN4ZQa", spotifyAlbum: "Cado dalle nubi - world edition (Colonna sonora originale del film)", spotifyDurationMs: 194000 },
    { title: "DODGE DURANGO", file: "songs/track-725.mp3", artist: "Artie 5ive", profile: "Emanuele", spotifyId: "0M1uXmHvF2wvoICQ4LsFEK", spotifyAlbum: "LA BELLAVITA", spotifyDurationMs: 170000 },
    { title: "Funghi in salsa rosa", file: "songs/track-726.mp3", artist: "L'Elfo, Funkyman", profile: "Emanuele", spotifyId: "5aJRZw3YTPh0uiRo5MOM0e", spotifyAlbum: "Funghi in salsa rosa", spotifyDurationMs: 175000 },
    { title: "Campioni In Italia (Red Bull 64 Bars)", file: "songs/track-1047.mp3", artist: "Geolier, Dat Boi Dee, Poison Beatz", profile: "Emanuele", spotifyId: "0lmmsw2Z7uN1e5q93AHXbd", spotifyAlbum: "Campioni In Italia (Red Bull 64 Bars)", spotifyDurationMs: 234000 },
    { title: "Pura Purissima (feat. Nerissima Serpe)", file: "songs/track-1167.mp3", artist: "Papa V, Night Skinny, Nerissima Serpe", profile: "Emanuele", spotifyId: "7aED3khDoMw7bgL8wNMVy3", spotifyAlbum: "Pura Purissima (feat. Nerissima Serpe)", spotifyDurationMs: 153000 },
    { title: "CHIAMA (feat. Capo Plaza & Salmo)", file: "songs/track-1048.mp3", artist: "Drillionaire, Salmo, Capo Plaza", profile: "Emanuele", spotifyId: "2SW4aQekoeJjjVfZYsczPs", spotifyAlbum: "10", spotifyDurationMs: 170000 },
    { title: "Berserker", file: "songs/track-1049.mp3", artist: "Kid Yugi, Ill Santo, FT Kings", profile: "Emanuele", spotifyId: "0a9Gi8DA7tzR3HV46V1Ppv", spotifyAlbum: "Berserker", spotifyDurationMs: 132000 },
    { title: "Parado no Bailão", file: "songs/track-1050.mp3", artist: "MC L da Vinte, MC Gury, DJ Swat", profile: "Emanuele", spotifyId: "3Hb9kUdm4yf839Fle4RIdT", spotifyAlbum: "Parado no Bailão", spotifyDurationMs: 171000 },
    { title: "HAY LUPITA", file: "songs/track-1051.mp3", artist: "Lomiiel", profile: "Emanuele", spotifyId: "5jFA0f4ZDGLbQP4nxzL8D4", spotifyAlbum: "HAY LUPITA", spotifyDurationMs: 105000 },
    { title: "Olha A Explosão", file: "songs/track-1052.mp3", artist: "MC Kevinho", profile: "Emanuele", spotifyId: "6Q4foUefrAyCt8VxJFML56", spotifyAlbum: "Olha a Explosão", spotifyDurationMs: 162000 },
    { title: "Blah Blah Blah (with Capo Plaza, Peppe Soks & Christian Revo)", file: "songs/track-1053.mp3", artist: "Dj Klonh, Capo Plaza, Peppe Soks, Christian Revo", profile: "Emanuele", spotifyId: "6qEFjwPOr8Kwmoxz7rwApM", spotifyAlbum: "Blah Blah Blah", spotifyDurationMs: 284000 },
    { title: "DETOX / REHAB", file: "songs/track-731.mp3", artist: "Marracash", profile: "Emanuele", spotifyId: "3bQBpGIlToMHfyKtKZwOyN", spotifyAlbum: "È FINITA LA PACE", spotifyDurationMs: 236000 },
    { title: "Caramel", file: "songs/track-1168.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "1qd3VDzfheygZf4m7lygoV", spotifyAlbum: "Caramel", spotifyDurationMs: 180000 },
    { title: "MI PIACCIONO LE ARMI", file: "songs/track-732.mp3", artist: "Simba La Rue, FT Kings, Sick Luke", profile: "Emanuele", spotifyId: "3yFgWoossjlaJ919XDCG4C", spotifyAlbum: "ESCI DAL TUNNEL", spotifyDurationMs: 129000 },
    { title: "Miami Vice (feat. Sfera Ebbasta, Simba La Rue)", file: "songs/track-222.mp3", artist: "Luchè, Sfera Ebbasta, Simba La Rue", profile: "Emanuele", spotifyId: "2aJW4z2EoahGBpU3asFclE", spotifyAlbum: "Il mio lato peggiore", spotifyDurationMs: 245000 },
    { title: "Trappala", file: "songs/track-1054.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "41A3UzjnfsiDSuhZ4dhMtw", spotifyAlbum: "Hustle Mixtape Vol. 2", spotifyDurationMs: 157000 },
    { title: "Soul", file: "songs/track-733.mp3", artist: "Watsebha", profile: "Emanuele", spotifyId: "65q2KzDHo9ioFvcmlo0yEp", spotifyAlbum: "Soul", spotifyDurationMs: 156000 },
    { title: "Curazao", file: "songs/track-1055.mp3", artist: "El Alfa, Farruko", profile: "Emanuele", spotifyId: "4VO6rhOKPyH6RogCTPeQqO", spotifyAlbum: "SAGITARIO", spotifyDurationMs: 244000 },
    { title: "La coca", file: "songs/track-1056.mp3", artist: "Babaman", profile: "Emanuele", spotifyId: "4WeOhTrYpugO1d0xzDenvM", spotifyAlbum: "Raggasonico", spotifyDurationMs: 214000 },
    { title: "Mirándote", file: "songs/track-1057.mp3", artist: "Rvfv", profile: "Emanuele", spotifyId: "0gxbA4bZN8KyNHsCUfNvyr", spotifyAlbum: "Mirándote", spotifyDurationMs: 135000 },
    { title: "BRATZ", file: "songs/track-1058.mp3", artist: "Lefar", profile: "Emanuele", spotifyId: "5I3FJAEbsA6wHrCoNb5fhs", spotifyAlbum: "BRATZ", spotifyDurationMs: 132000 },
    { title: "La Morocha", file: "songs/track-738.mp3", artist: "Luck Ra, BM", profile: "Emanuele", spotifyId: "7aPsseax6rNFyipHn9A5CR", spotifyAlbum: "La Morocha", spotifyDurationMs: 134000 },
    { title: "LIFE IS LIFE (feat. Nerissima Serpe & Papa V)", file: "songs/track-739.mp3", artist: "Artie 5ive, Nerissima Serpe, Papa V", profile: "Emanuele", spotifyId: "0XvfITMZy29MKaVWjpeg9X", spotifyAlbum: "BIG 5", spotifyDurationMs: 184000 },
    { title: "Plaza", file: "songs/track-740.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "7wnKS5lo0w9V04E6yXzhxV", spotifyAlbum: "PLAZA", spotifyDurationMs: 210000 },
    { title: "Pookie (feat. Capo Plaza) - Remix", file: "songs/track-1059.mp3", artist: "Aya Nakamura, Capo Plaza", profile: "Emanuele", spotifyId: "1MtmXPxXP4ntSjfF5xnOyM", spotifyAlbum: "Pookie (feat. Capo Plaza) [Remix]", spotifyDurationMs: 188000 },
    { title: "Vidrado Em Você", file: "songs/track-742.mp3", artist: "Dj Guuga, Mc Livinho", profile: "Emanuele", spotifyId: "1HJU78CRk4vxvjE5Cs1BCt", spotifyAlbum: "Vidrado Em Você", spotifyDurationMs: 134000 },
    { title: "RATATA", file: "songs/track-743.mp3", artist: "Capo Plaza", profile: "Emanuele", spotifyId: "3QjM7blH1a157YfP8G33TA", spotifyAlbum: "20 (Deluxe Edition)", spotifyDurationMs: 214000 },
    { title: "Non mollare mai 2024 (feat. Guè, Clementino & Geolier)", file: "songs/track-744.mp3", artist: "Gigi D'Alessio, Guè, Clementino, Geolier", profile: "Emanuele", spotifyId: "5z88X065FKTZDIXFYW0cfc", spotifyAlbum: "Fra", spotifyDurationMs: 231000 },
    { title: "Hope (feat. Izi, Joshua)", file: "songs/track-1145.mp3", artist: "Shablo, Izi, Joshua", profile: "Emanuele", spotifyId: "4pbwPGtJ1nPTxzncaCmNRM", spotifyAlbum: "Hope (feat. Izi, Joshua)", spotifyDurationMs: 171000 },
    { title: "Sintetico (feat. Tony Boy)", file: "songs/track-30.mp3", artist: "Kid Yugi, Night Skinny, Tony Boy", profile: "Emanuele", spotifyId: "3NLdcu14EPntcZIn3mxSR7", spotifyAlbum: "Quarto di Bue", spotifyDurationMs: 151000 },
    { title: "Un nuovo bacio", file: "songs/track-745.mp3", artist: "Gigi D'Alessio, Anna Tatangelo", profile: "Emanuele", spotifyId: "3vjaynqkptcF4eLYpK6rnd", spotifyAlbum: "Uno Come Te", spotifyDurationMs: 256000 },
    { title: "Est-ce que tu m'aimes ? - Pilule bleue", file: "songs/track-1199.mp3", artist: "GIMS", profile: "Emanuele", spotifyId: "3a9TMd2Yrza6HXqqlfMtfy", spotifyAlbum: "Mon coeur avait raison", spotifyDurationMs: 237000 },
    { title: "Gata Only", file: "songs/track-747.mp3", artist: "FloyyMenor, Cris MJ", profile: "Emanuele", spotifyId: "2esZG2XFtuoWWA9AfDvSxy", spotifyAlbum: "EL COMIENZO", spotifyDurationMs: 222000 },
    { title: "Milano Shotta Freestyle", file: "songs/track-748.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "24l60WaetPKefjFyZbkw9d", spotifyAlbum: "Milano Angels", spotifyDurationMs: 153000 },
    { title: "Milano Angels", file: "songs/track-749.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "5kQwHYmtLVJaBwh6NqD4JW", spotifyAlbum: "Milano Angels", spotifyDurationMs: 187000 },
    { title: "Don't Cry No More (feat. Geolier)", file: "songs/track-750.mp3", artist: "Shiva, Geolier", profile: "Emanuele", spotifyId: "2vxtac8KET2UTMfT0d0awA", spotifyAlbum: "Milano Angels", spotifyDurationMs: 195000 },
    { title: "Gotham (feat. Kid Yugi)", file: "songs/track-751.mp3", artist: "Shiva, Kid Yugi", profile: "Emanuele", spotifyId: "2ceJa7d62wQ3eRBK589ALG", spotifyAlbum: "Milano Angels", spotifyDurationMs: 207000 },
    { title: "Momenti No", file: "songs/track-752.mp3", artist: "Sfera Ebbasta, Tedua", profile: "Emanuele", spotifyId: "4IxM8LopMS2014C2LTJEYu", spotifyAlbum: "X2VR", spotifyDurationMs: 192000 },
    { title: "ALTALENE (feat. Mara Sattei & Coez)", file: "songs/track-753.mp3", artist: "BLOODY VINYL, Slait, tha Supreme, Mara Sattei, Coez", profile: "Emanuele", spotifyId: "6oNJqGeekJO8rADd2Mktvi", spotifyAlbum: "BV3", spotifyDurationMs: 186000 },
    { title: "Je Nun Me Fido", file: "songs/track-1200.mp3", artist: "Priore", profile: "Emanuele", spotifyId: "4rrlvKBGESWQARCUgCs8j1", spotifyAlbum: "Je Nun Me Fido", spotifyDurationMs: 217000 },
    { title: "CVLT (feat. Kid Yugi)", file: "songs/track-755.mp3", artist: "Salmo, Noyz Narcos, Kid Yugi", profile: "Emanuele", spotifyId: "6hANXZUS2wryG1zSocof7J", spotifyAlbum: "CVLT", spotifyDurationMs: 226000 },
    { title: "Gol", file: "songs/track-1060.mp3", artist: "Sfera Ebbasta, Guè", profile: "Emanuele", spotifyId: "1F4ARcz5U9kgtcjpcYNzTH", spotifyAlbum: "X2VR", spotifyDurationMs: 217000 },
    { title: "Anche Stasera", file: "songs/track-757.mp3", artist: "Sfera Ebbasta, Elodie", profile: "Emanuele", spotifyId: "5WssaPhjCCUFBMk9PpnHYj", spotifyAlbum: "X2VR", spotifyDurationMs: 217000 },
    { title: "15 Piani", file: "songs/track-115.mp3", artist: "Sfera Ebbasta, Marracash", profile: "Emanuele", spotifyId: "05wb6MEyJeG2z1MVCIXxC8", spotifyAlbum: "X2VR", spotifyDurationMs: 206000 },
    { title: "VDLC", file: "songs/track-758.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "242NmD3BqOefyiOZQy2MT2", spotifyAlbum: "X2VR", spotifyDurationMs: 198000 },
    { title: "Se Tornerai (feat. Neffa)", file: "songs/track-759.mp3", artist: "Rocco Hunt, Neffa", profile: "Emanuele", spotifyId: "3fTvFZyr41XvhCtk4ohywa", spotifyAlbum: "Libertà", spotifyDurationMs: 221000 },
    { title: "G63", file: "songs/track-760.mp3", artist: "Sfera Ebbasta, Lazza, Shiva", profile: "Emanuele", spotifyId: "0lqGKcPzUX4RO4PYysoLes", spotifyAlbum: "X2VR", spotifyDurationMs: 229000 },
    { title: "Calcolatrici", file: "songs/track-761.mp3", artist: "Sfera Ebbasta, Geolier, Simba La Rue, Baby Gang", profile: "Emanuele", spotifyId: "6bN41HjY008ggroMFxNLaa", spotifyAlbum: "X2VR", spotifyDurationMs: 205000 },
    { title: "Lovebars", file: "songs/track-762.mp3", artist: "Coez, Frah Quintale", profile: "Emanuele", spotifyId: "6O7pAOsUm3d9R37vYdQnG5", spotifyAlbum: "Lovebars", spotifyDurationMs: 165000 },
    { title: "Mortale", file: "songs/track-190.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "4Kp2OEKh3cVUPC1WeYPAn6", spotifyAlbum: "DOOM", spotifyDurationMs: 186000 },
    { title: "guerra dentro", file: "songs/track-97.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "2aPz4c03AsOhTgbuSnfrCs", spotifyAlbum: "HABITAT", spotifyDurationMs: 178000 },
    { title: "Ultima confessione", file: "songs/track-765.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "1vcluwUZ3IZYtRwULczDTl", spotifyAlbum: "DOOM", spotifyDurationMs: 168000 },
    { title: "BLOODY BARS - DRILLUMINAZIONE (feat. Charlie KDM, Hell Raton & Lazza)", file: "songs/track-766.mp3", artist: "BLOODY VINYL, Slait, MILES, tha Supreme, Low Kidd, Charlie KDM, Hell Raton, Lazza", profile: "Emanuele", spotifyId: "0e16hLAkJH4yP5lNBMcken", spotifyAlbum: "BV3", spotifyDurationMs: 335000 },
    { title: "SENZA RUMORE", file: "songs/track-767.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "2Z7sJKCxTH94KCRxJTd4O7", spotifyAlbum: "SIRIO", spotifyDurationMs: 229000 },
    { title: "Gucci Ski Mask (feat. Guè)", file: "songs/track-768.mp3", artist: "Lazza, Guè", profile: "Emanuele", spotifyId: "1zsnUOfuMirWoprylSMuTZ", spotifyAlbum: "Re Mida", spotifyDurationMs: 205000 },
    { title: "Notti", file: "songs/track-769.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "25J3gcZhNjzBwcaDfZjQli", spotifyAlbum: "Sfera Ebbasta", spotifyDurationMs: 170000 },
    { title: "Netflix", file: "songs/track-770.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "1XiF40UZiMZstIl37DdRaC", spotifyAlbum: "Re Mida", spotifyDurationMs: 153000 },
    { title: "El Perdón (with Enrique Iglesias)", file: "songs/track-771.mp3", artist: "Nicky Jam, Enrique Iglesias", profile: "Emanuele", spotifyId: "7qCAVkHWZkF44OzOUKf8Cr", spotifyAlbum: "Fénix", spotifyDurationMs: 205000 },
    { title: "Stylist (feat. Guè)", file: "songs/track-1061.mp3", artist: "Slings, Guè", profile: "Emanuele", spotifyId: "7IGBoOaXAd5IbNZLv5rZFT", spotifyAlbum: "Stylist (feat. Guè)", spotifyDurationMs: 139000 },
    { title: "Téléphone", file: "songs/track-773.mp3", artist: "Booba, Sfera Ebbasta", profile: "Emanuele", spotifyId: "76YfUp0DTnERvtZokyU6jm", spotifyAlbum: "Téléphone", spotifyDurationMs: 212000 },
    { title: "Cella 4", file: "songs/track-774.mp3", artist: "Baby Gang, 2nd Roof", profile: "Emanuele", spotifyId: "0szf0BqOX6XXa2sHb8HtvC", spotifyAlbum: "INNOCENTE", spotifyDurationMs: 186000 },
    { title: "2 SECONDI", file: "songs/track-775.mp3", artist: "Geolier", profile: "Emanuele", spotifyId: "5EL2pGymrFM9jpVjBbsZhn", spotifyAlbum: "IL CORAGGIO DEI BAMBINI - ATTO II", spotifyDurationMs: 149000 },
    { title: "IL MALE CHE MI FAI (feat. Marracash)", file: "songs/track-776.mp3", artist: "Geolier, Marracash", profile: "Emanuele", spotifyId: "7Da5kjy5GByLHE5OPQ4tpg", spotifyAlbum: "IL CORAGGIO DEI BAMBINI - ATTO II", spotifyDurationMs: 167000 },
    { title: "SO FLY", file: "songs/track-777.mp3", artist: "Geolier", profile: "Emanuele", spotifyId: "2Xzauj0gFhELmQ8KgoYiUS", spotifyAlbum: "IL CORAGGIO DEI BAMBINI - ATTO II", spotifyDurationMs: 138000 },
    { title: "ZONDA", file: "songs/track-1062.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "28Q3CFgOA5EM2bmKaB9d53", spotifyAlbum: "ZONDA", spotifyDurationMs: 217000 },
    { title: "MONEY", file: "songs/track-779.mp3", artist: "Geolier", profile: "Emanuele", spotifyId: "1EOTrGOcrCwTG1nhUnp0dV", spotifyAlbum: "MONEY", spotifyDurationMs: 165000 },
    { title: "MARADONA", file: "songs/track-780.mp3", artist: "Geolier", profile: "Emanuele", spotifyId: "1Bf3WnU7Y6YGP0k4RbbErB", spotifyAlbum: "IL CORAGGIO DEI BAMBINI", spotifyDurationMs: 162000 },
    { title: "LET GO", file: "songs/track-781.mp3", artist: "Central Cee", profile: "Emanuele", spotifyId: "3zkyus0njMCL6phZmNNEeN", spotifyAlbum: "LET GO", spotifyDurationMs: 174000 },
    { title: "X CASO (feat. Sfera Ebbasta)", file: "songs/track-782.mp3", artist: "Geolier, Sfera Ebbasta", profile: "Emanuele", spotifyId: "2E32Pv8w20r6ZH4oFecxOf", spotifyAlbum: "IL CORAGGIO DEI BAMBINI", spotifyDurationMs: 215000 },
    { title: "Fuck the police", file: "songs/track-1063.mp3", artist: "Martz Da Marte", profile: "Emanuele", spotifyId: "1Z2XAqRcMcfI2DfwaPHEmN", spotifyAlbum: "Fuck the police", spotifyDurationMs: 156000 },
    { title: "REPLAY", file: "songs/track-783.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "66b96Q6ljSGILgrtgqvPMH", spotifyAlbum: "SIRIO", spotifyDurationMs: 191000 },
    { title: "MARYLEAN (feat. Marracash) - prod. Low Kidd", file: "songs/track-1190.mp3", artist: "MACHETE, Salmo, Nitro, Marracash", profile: "Emanuele", spotifyId: "28fRkU3vhqAJdl9i9458pQ", spotifyAlbum: "MACHETE MIXTAPE 4", spotifyDurationMs: 144000 },
    { title: "L'IMPOSTORE", file: "songs/track-785.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "3rpOUa8tpX9M5s3ZOfbJfx", spotifyAlbum: "IO NON HO PAURA", spotifyDurationMs: 203000 },
    { title: "IL MIO NOME", file: "songs/track-786.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "50BtIqilFzXVUMVC6ddTDa", spotifyAlbum: "IO NON HO PAURA", spotifyDurationMs: 198000 },
    { title: "ACQUA TONICA (feat. Geolier & Junior K)", file: "songs/track-787.mp3", artist: "Ernia, Geolier, Junior K", profile: "Emanuele", spotifyId: "3WVXxfB3B76CkG2wglKotj", spotifyAlbum: "IO NON HO PAURA", spotifyDurationMs: 182000 },
    { title: "Fenomeno", file: "songs/track-1064.mp3", artist: "Ernia, Izi, Moses Sangare", profile: "Emanuele", spotifyId: "2JmjKK6dN0ThjgcgMTEIcE", spotifyAlbum: "Fenomeno", spotifyDurationMs: 242000 },
    { title: "TUTTI HANNO PAURA (feat. Marco Mengoni)", file: "songs/track-1065.mp3", artist: "Ernia, Marco Mengoni", profile: "Emanuele", spotifyId: "2pG4kMJDVW0QekxjrQeYiZ", spotifyAlbum: "IO NON HO PAURA", spotifyDurationMs: 212000 },
    { title: "BELLA FREGATURA", file: "songs/track-1066.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "11H6R8nu1QxB1yGWHgzKl7", spotifyAlbum: "IO NON HO PAURA", spotifyDurationMs: 174000 },
    { title: "CATTIVE INTENZIONI (feat. Salmo)", file: "songs/track-1067.mp3", artist: "Ernia, Salmo", profile: "Emanuele", spotifyId: "0OmnpUgUBVcCnKdS7o9P03", spotifyAlbum: "IO NON HO PAURA", spotifyDurationMs: 168000 },
    { title: "Perdonami (feat. Neima Ezza)", file: "songs/track-1068.mp3", artist: "2nd Roof, Neima Ezza, ToTheMoon", profile: "Emanuele", spotifyId: "5FDcvMV87UABSO1cgwT3e7", spotifyAlbum: "Perdonami (feat. Neima Ezza)", spotifyDurationMs: 148000 },
    { title: "SUI MURI", file: "songs/track-1069.mp3", artist: "PSICOLOGI", profile: "Emanuele", spotifyId: "5M3SYjElWjKlD3jgONFw4w", spotifyAlbum: "SUI MURI", spotifyDurationMs: 181000 },
    { title: "Guerra E Pace", file: "songs/track-1070.mp3", artist: "PSICOLOGI", profile: "Emanuele", spotifyId: "2puGJHRifrmNO7gTAeWm0z", spotifyAlbum: "2001", spotifyDurationMs: 165000 },
    { title: "FANTASMA", file: "songs/track-1071.mp3", artist: "PSICOLOGI", profile: "Emanuele", spotifyId: "1c0XKg0gts8BOyvwYcH3wa", spotifyAlbum: "MILLENNIUM BUG", spotifyDurationMs: 167000 },
    { title: "TATUAGGI (feat. ARIETE)", file: "songs/track-794.mp3", artist: "PSICOLOGI, ARIETE", profile: "Emanuele", spotifyId: "15WIkk29b7NqOK2poTRnOU", spotifyAlbum: "MILLENNIUM BUG", spotifyDurationMs: 185000 },
    { title: "Yo Quiero Amarte", file: "songs/track-795.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "3yzEcIwGDhreQoMfO6RXB9", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 176000 },
    { title: "Una Cosa Sola (feat. Shablo)", file: "songs/track-796.mp3", artist: "Irama, Shablo", profile: "Emanuele", spotifyId: "4TNVpkVnqjkOXhGEWNigss", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 178000 },
    { title: "A L I", file: "songs/track-1072.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "2i2KQ1gfaIRoExBoYuVjiY", spotifyAlbum: "Il giorno in cui ho smesso di pensare (Deluxe Edition)", spotifyDurationMs: 188000 },
    { title: "5 Gocce (feat. Rkomi)", file: "songs/track-798.mp3", artist: "Irama, Rkomi", profile: "Emanuele", spotifyId: "3z0GeNGWyVduziP1cQ0mFN", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 160000 },
    { title: "Cose che non vuoi sentirti dire", file: "songs/track-187.mp3", artist: "nayt", profile: "Emanuele", spotifyId: "6OMnIqBYSBEOIMuXkiHT2a", spotifyAlbum: "DOOM", spotifyDurationMs: 167000 },
    { title: "Musica Ovunque", file: "songs/track-394.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "5cUwl3Zf7TJDsZypvxSrti", spotifyAlbum: "MOOD", spotifyDurationMs: 254000 },
    { title: "Mi manchi", file: "songs/track-513.mp3", artist: "Paky", profile: "Emanuele", spotifyId: "7Jgi200kgCNvAuZw2W8Nxq", spotifyAlbum: "Salvatore", spotifyDurationMs: 186000 },
    { title: "Storia di un defunto artista", file: "songs/track-802.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "1csiTxDSvzHB5Nwd2dxC3u", spotifyAlbum: "Suicidol", spotifyDurationMs: 246000 },
    { title: "Take 4", file: "songs/track-803.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "627uLUtgdlY5xVEtjJgKy6", spotifyAlbum: "Take 4", spotifyDurationMs: 170000 },
    { title: "Vorrei (feat. Lazza)", file: "songs/track-804.mp3", artist: "Shiva, Lazza", profile: "Emanuele", spotifyId: "5IbrGxWxB427KJEDrphgRN", spotifyAlbum: "Milano Demons", spotifyDurationMs: 191000 },
    { title: "PIOVE (feat. Sfera Ebbasta)", file: "songs/track-805.mp3", artist: "Lazza, Sfera Ebbasta", profile: "Emanuele", spotifyId: "6BUueuMQR4k7CuoMEsnGou", spotifyAlbum: "SIRIO", spotifyDurationMs: 155000 },
    { title: "NESSUNO (feat. Geolier)", file: "songs/track-806.mp3", artist: "Lazza, Geolier", profile: "Emanuele", spotifyId: "0HdrGJfHWYG5A0cNhiMDG4", spotifyAlbum: "SIRIO", spotifyDurationMs: 148000 },
    { title: "USCITO DI GALERA", file: "songs/track-807.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "01DXwNf1GzEJkYTbXgL0eb", spotifyAlbum: "SIRIO", spotifyDurationMs: 172000 },
    { title: "OK BOOMER (feat. Rosa Chemical) - prod. B-dope & Young Miles", file: "songs/track-1073.mp3", artist: "Nitro, Rosa Chemical", profile: "Emanuele", spotifyId: "6sjK4ubJ4EnZo8gl8906bY", spotifyAlbum: "GarbAge Evilution", spotifyDurationMs: 200000 },
    { title: "Baby Mama", file: "songs/track-119.mp3", artist: "Don Pero", profile: "Emanuele", spotifyId: "4Y60H8heDsEpQ2hin2g6V5", spotifyAlbum: "Baby Mama", spotifyDurationMs: 151000 },
    { title: "Believer", file: "songs/track-808.mp3", artist: "Imagine Dragons", profile: "Emanuele", spotifyId: "0pqnGHJpmpxLKifKRmU6WP", spotifyAlbum: "Evolve", spotifyDurationMs: 204000 },
    { title: "Obsessed With You", file: "songs/track-809.mp3", artist: "Central Cee", profile: "Emanuele", spotifyId: "4oxGI8yyghLuMV7ybRG3kg", spotifyAlbum: "23", spotifyDurationMs: 108000 },
    { title: "Vertigini", file: "songs/track-810.mp3", artist: "Tedua, Chris Nolan", profile: "Emanuele", spotifyId: "1Oou7m2VuxCDSOdqsu07TU", spotifyAlbum: "Mowgli", spotifyDurationMs: 203000 },
    { title: "Milano Demons", file: "songs/track-811.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "2OOtjHSaaYvKkcaXB2iwhc", spotifyAlbum: "Milano Demons", spotifyDurationMs: 163000 },
    { title: "Neve", file: "songs/track-1074.mp3", artist: "Ernia, neezyboy", profile: "Emanuele", spotifyId: "6cBH5hLQFzmsuyU2iOdVA2", spotifyAlbum: "No Hooks", spotifyDurationMs: 192000 },
    { title: "Quella foto di noi due", file: "songs/track-812.mp3", artist: "Emis Killa", profile: "Emanuele", spotifyId: "10hc6GvyWhe2E48PAfQrdD", spotifyAlbum: "Supereroe", spotifyDurationMs: 194000 },
    { title: "Caramba", file: "songs/track-813.mp3", artist: "Baby Gang", profile: "Emanuele", spotifyId: "0JxlMKdfoQKuB09keMmALe", spotifyAlbum: "Caramba", spotifyDurationMs: 183000 },
    { title: "SOGNI D'ORO", file: "songs/track-814.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "2tKH7kT40eTSp8SCf6VKeH", spotifyAlbum: "SIRIO", spotifyDurationMs: 157000 },
    { title: "OUV3RTURE", file: "songs/track-1075.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "7r9hUF9vWuuTPqGK3YS6Oy", spotifyAlbum: "SIRIO", spotifyDurationMs: 172000 },
    { title: "Amici", file: "songs/track-1154.mp3", artist: "Massimo Pericolo", profile: "Emanuele", spotifyId: "7aVX95NjONZszSeb8vJZF3", spotifyAlbum: "Scialla Semper", spotifyDurationMs: 180000 },
    { title: "Pose (feat. Lil Uzi Vert)", file: "songs/track-817.mp3", artist: "Yo Gotti, Lil Uzi Vert", profile: "Emanuele", spotifyId: "6e9biVAugkOfydEN8OiJpi", spotifyAlbum: "Pose (feat. Lil Uzi Vert)", spotifyDurationMs: 170000 },
    { title: "Masked friends", file: "songs/track-818.mp3", artist: "JAB32", profile: "Emanuele", spotifyId: "7lBPWaKE76eOPSaa7ZQUR9", spotifyAlbum: "Masked friends", spotifyDurationMs: 134000 },
    { title: "SUITE HOTEL", file: "songs/track-819.mp3", artist: "Simba La Rue, Bobo", profile: "Emanuele", spotifyId: "1NRnu8LjiJM3cHcPYy6rs9", spotifyAlbum: "CRIMI", spotifyDurationMs: 139000 },
    { title: "Marocchino", file: "songs/track-820.mp3", artist: "Baby Gang", profile: "Emanuele", spotifyId: "0f2wkDmAlLAo90gE5d1yPU", spotifyAlbum: "EP1", spotifyDurationMs: 133000 },
    { title: "QUATTERI #2", file: "songs/track-821.mp3", artist: "Skinny", profile: "Emanuele", spotifyId: "2mhjSMEAbReJIguSuAUP0Y", spotifyAlbum: "QUATTERI #2", spotifyDurationMs: 98000 },
    { title: "Stamm Fort (feat. Sfera Ebbasta)", file: "songs/track-822.mp3", artist: "Luchè, Sfera Ebbasta", profile: "Emanuele", spotifyId: "7iTTQvztpfrDneVSX9IGBD", spotifyAlbum: "Potere", spotifyDurationMs: 171000 },
    { title: "Pi tutti i carusi", file: "songs/track-823.mp3", artist: "L'Elfo, Funkyman", profile: "Emanuele", spotifyId: "3SYB2f8qy1IBKuVWNKwovE", spotifyAlbum: "Pi tutti i carusi", spotifyDurationMs: 293000 },
    { title: "QUATTERI FREESTYLE", file: "songs/track-824.mp3", artist: "Skinny", profile: "Emanuele", spotifyId: "2M6uR3cbNum7B1boPyDkEC", spotifyAlbum: "QUATTERI FREESTYLE", spotifyDurationMs: 90000 },
    { title: "Ferrari - Remix", file: "songs/track-825.mp3", artist: "James Hype, Miggy Dela Rosa, Lazza", profile: "Emanuele", spotifyId: "3XucsgiwXb8KPn9Csf9Zmu", spotifyAlbum: "Ferrari (Remix)", spotifyDurationMs: 172000 },
    { title: "Mrs", file: "songs/track-826.mp3", artist: "Central Cee", profile: "Emanuele", spotifyId: "0yRsHuqDYOeug4ACp38Rjt", spotifyAlbum: "23", spotifyDurationMs: 148000 },
    { title: "Obsessed With You", file: "songs/track-1169.mp3", artist: "Central Cee", profile: "Emanuele", spotifyId: "4PYfFHKfjYz6dwAtZhBy1z", spotifyAlbum: "Obsessed With You", spotifyDurationMs: 108000 },
    { title: "Loading", file: "songs/track-827.mp3", artist: "Central Cee", profile: "Emanuele", spotifyId: "4vzJrkfHbCGaodPA5RY5BV", spotifyAlbum: "Wild West", spotifyDurationMs: 173000 },
    { title: "Fendi belt", file: "songs/track-828.mp3", artist: "Shiva, Paky", profile: "Emanuele", spotifyId: "3mYQaVTYv6suVMD1MjPBlR", spotifyAlbum: "Dolce vita", spotifyDurationMs: 148000 },
    { title: "Mon Fre - feat. Emis Killa", file: "songs/track-1076.mp3", artist: "Shiva, Emis Killa", profile: "Emanuele", spotifyId: "4dDMgEj5GpBTI1lvVlYPu7", spotifyAlbum: "Mon Fre (feat. Emis Killa)", spotifyDurationMs: 224000 },
    { title: "Wild Bandana (feat. Tedua & Vaz Tè)", file: "songs/track-830.mp3", artist: "Izi, Vaz Tè, Tedua", profile: "Emanuele", spotifyId: "4I0zrlR1lT6aHYiu79MzWy", spotifyAlbum: "Pizzicato", spotifyDurationMs: 309000 },
    { title: "3 Stick Freestyle", file: "songs/track-1077.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "6YX9c3sbZbGFHylgZq5djZ", spotifyAlbum: "3 Stick Freestyle", spotifyDurationMs: 149000 },
    { title: "Oltre", file: "songs/track-832.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "1BbCOFBOYAfUlT41nQYYmC", spotifyAlbum: "ALI", spotifyDurationMs: 183000 },
    { title: "Counting Stars", file: "songs/track-833.mp3", artist: "OneRepublic", profile: "Emanuele", spotifyId: "2tpWsVSb9UEmDRxAl1zhX1", spotifyAlbum: "Native", spotifyDurationMs: 257000 },
    { title: "7 miliardi", file: "songs/track-834.mp3", artist: "Massimo Pericolo", profile: "Emanuele", spotifyId: "67vjEOTkBppbVLUUq5mEJz", spotifyAlbum: "Scialla Semper", spotifyDurationMs: 167000 },
    { title: "CAZZO CULO (feat. Salmo)", file: "songs/track-1146.mp3", artist: "Massimo Pericolo, Crookers, Salmo, Nic Sarno", profile: "Emanuele", spotifyId: "20t66ReqDDum1dvDSlpZzk", spotifyAlbum: "SOLO TUTTO", spotifyDurationMs: 233000 },
    { title: "STUPIDO", file: "songs/track-75.mp3", artist: "Massimo Pericolo, Crookers", profile: "Emanuele", spotifyId: "6HVRRlc2sBlkcKEkhlsp86", spotifyAlbum: "SOLO TUTTO", spotifyDurationMs: 187000 },
    { title: "Non è Easy", file: "songs/track-836.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "2SdYuBGvuX0L7KbWiFhLzg", spotifyAlbum: "Non è Easy", spotifyDurationMs: 164000 },
    { title: "BREBBIA 2012", file: "songs/track-837.mp3", artist: "Massimo Pericolo, Crookers, Nic Sarno", profile: "Emanuele", spotifyId: "0he7EfF5m73DQmTZ3mteJR", spotifyAlbum: "SOLO TUTTO", spotifyDurationMs: 168000 },
    { title: "PULL UP (feat. Big P)", file: "songs/track-1147.mp3", artist: "Touché, BIG P, Miller", profile: "Emanuele", spotifyId: "5rGNMvZh5oLw20vjMaf8VW", spotifyAlbum: "IL MINORENNE + BASTARDO", spotifyDurationMs: 166000 },
    { title: "PAMPAMPAMPAMPAMPAMPAMPAM", file: "songs/track-838.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "0AO2RPbzoaNRlNmnk70oRt", spotifyAlbum: "PAMPAMPAMPAMPAMPAMPAMPAM", spotifyDurationMs: 158000 },
    { title: "Lei (feat. Bené)", file: "songs/track-839.mp3", artist: "Baby Gang, Bené", profile: "Emanuele", spotifyId: "1fdL0yW2DHzcOOUF0fZFv8", spotifyAlbum: "EP2", spotifyDurationMs: 212000 },
    { title: "È Trap", file: "songs/track-840.mp3", artist: "Tony Effe", profile: "Emanuele", spotifyId: "6ndHrlHQjOEaIGaY9o6W5O", spotifyAlbum: "Untouchable", spotifyDurationMs: 149000 },
    { title: "Effe", file: "songs/track-1078.mp3", artist: "Tony Effe", profile: "Emanuele", spotifyId: "56nvQibJaC1V84wVMqA3Ck", spotifyAlbum: "Untouchable", spotifyDurationMs: 151000 },
    { title: "Niente da perdere", file: "songs/track-842.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "3HiQ6Tn1mWVgYDLgeaxjS5", spotifyAlbum: "Niente da perdere", spotifyDurationMs: 166000 },
    { title: "Paranoia", file: "songs/track-843.mp3", artist: "Baby Gang, Bobo", profile: "Emanuele", spotifyId: "4ZPmb48JaAysD1OdQEt5LL", spotifyAlbum: "Paranoia", spotifyDurationMs: 182000 },
    { title: "Chic", file: "songs/track-100.mp3", artist: "Izi", profile: "Emanuele", spotifyId: "7jUJ2RmT4PFHHq4goMWqm3", spotifyAlbum: "Fenice", spotifyDurationMs: 212000 },
    { title: "Born For This", file: "songs/track-845.mp3", artist: "The Score", profile: "Emanuele", spotifyId: "7uCBGNn991AM68fR4tSDco", spotifyAlbum: "Carry On", spotifyDurationMs: 237000 },
    { title: "The Search", file: "songs/track-1079.mp3", artist: "NF", profile: "Emanuele", spotifyId: "3oLe5ZILASG8vU5dxIMfLY", spotifyAlbum: "The Search", spotifyDurationMs: 248000 },
    { title: "SPLASH (feat. Enzo Dong)", file: "songs/track-847.mp3", artist: "MV Killa, Yung Snapp, Enzo Dong", profile: "Emanuele", spotifyId: "0CjTQ01ADXx3BMO07LxpKx", spotifyAlbum: "HOURS", spotifyDurationMs: 172000 },
    { title: "Fa' o' Brav' (feat. Emis Killa, Yung Snapp, MV Killa, Lele Blade)", file: "songs/track-848.mp3", artist: "Rocco Hunt, Emis Killa, Yung Snapp, MV Killa, Lele Blade", profile: "Emanuele", spotifyId: "209vinNF5EXSNq4S8faeIw", spotifyAlbum: "Rivoluzione", spotifyDurationMs: 227000 },
    { title: "Una Cosa Sola (feat. Shablo)", file: "songs/track-1170.mp3", artist: "Irama, Shablo", profile: "Emanuele", spotifyId: "0OkvsNAnCij983B5DDYXxO", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 178000 },
    { title: "LA CANZONE NOSTRA ⟁ (con BLANCO & Salmo)", file: "songs/track-1080.mp3", artist: "MACE, BLANCO, Salmo", profile: "Emanuele", spotifyId: "0aQi1JGO1oKWEmKGfvf8TF", spotifyAlbum: "LA CANZONE NOSTRA ⟁ (con BLANCO & Salmo)", spotifyDurationMs: 237000 },
    { title: "Estate", file: "songs/track-1155.mp3", artist: "Will", profile: "Emanuele", spotifyId: "7AKMq2HTg8FQs9LE0v9uoy", spotifyAlbum: "Estate", spotifyDurationMs: 186000 },
    { title: "Goodbye", file: "songs/track-851.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "7psOD6F6QbssQoC9U2OJCL", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 169000 },
    { title: "Oroka", file: "songs/track-1081.mp3", artist: "YTD", profile: "Emanuele", spotifyId: "2yyQvu0FFNghJJkYiF2uhL", spotifyAlbum: "TheLeavesTurnToAshesWhenTheDevilCalls", spotifyDurationMs: 106000 },
    { title: "MustBeARealDragWakingUpAndBeingYou", file: "songs/track-852.mp3", artist: "BONES", profile: "Emanuele", spotifyId: "4eaXSrScP9VdnF4G0KaeDh", spotifyAlbum: "UNRENDERED", spotifyDurationMs: 116000 },
    { title: "Eurovision (feat. Rondodasosa, Baby Gang, A2 Anti, Morad, Beny Jr, Ashe 22 & Freeze corleone)", file: "songs/track-853.mp3", artist: "Central Cee, Rondodasosa, Freeze corleone, Baby Gang, A2ANTI, Morad, Beny Jr, ASHE 22", profile: "Emanuele", spotifyId: "4f5TKGvkD4TkTjr61GKNAG", spotifyAlbum: "23", spotifyDurationMs: 243000 },
    { title: "Yo Quiero Amarte", file: "songs/track-1171.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "4jrC7qsMuRAcnxQ4iiQpb1", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 176000 },
    { title: "Ovunque Sarai", file: "songs/track-854.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "75mCCeBwjfoZtfAPE0SxwO", spotifyAlbum: "Il giorno in cui ho smesso di pensare", spotifyDurationMs: 200000 },
    { title: "Superclassico", file: "songs/track-855.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "6Ahg1hncxUdK0ICqU03BCu", spotifyAlbum: "Gemelli", spotifyDurationMs: 172000 },
    { title: "QQQ", file: "songs/track-1082.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "7nxWTXsWF0i3KHUzNZmxoB", spotifyAlbum: "68 (Till The End)", spotifyDurationMs: 186000 },
    { title: "Ferma A Guardare (feat. Pinguini Tattici Nucleari)", file: "songs/track-857.mp3", artist: "Ernia, Pinguini Tattici Nucleari", profile: "Emanuele", spotifyId: "1eDC4NiUYgQSKpKDIvXxi4", spotifyAlbum: "Gemelli", spotifyDurationMs: 213000 },
    { title: "Gotham", file: "songs/track-858.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "30qcU0IsKJFVTgKQSFcOXb", spotifyAlbum: "Come Uccidere Un Usignolo", spotifyDurationMs: 178000 },
    { title: "Jungle", file: "songs/track-1148.mp3", artist: "Rhove", profile: "Emanuele", spotifyId: "5KlQHwczFD9jrAGKxLaG4A", spotifyAlbum: "Jungle", spotifyDurationMs: 184000 },
    { title: "LAPROVINCE #1", file: "songs/track-860.mp3", artist: "Rhove", profile: "Emanuele", spotifyId: "2Z9uQAn8v8m6ZPFh4bsqY4", spotifyAlbum: "LAPROVINCE #1", spotifyDurationMs: 158000 },
    { title: "Pensando a lei", file: "songs/track-861.mp3", artist: "Shiva", profile: "Emanuele", spotifyId: "4Yi4RRhp3nfKR1FDbXlHBp", spotifyAlbum: "Pensando a lei", spotifyDurationMs: 176000 },
    { title: "BABY GODDAMN", file: "songs/track-862.mp3", artist: "Tananai", profile: "Emanuele", spotifyId: "3yWHQ4n4ARLDfYTuT2NhnN", spotifyAlbum: "BABY GODDAMN", spotifyDurationMs: 149000 },
    { title: "La genesi del tuo colore", file: "songs/track-863.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "0HyDNYQmQ3obfA81D3y9tG", spotifyAlbum: "La genesi del tuo colore", spotifyDurationMs: 228000 },
    { title: "LUNA PIENA (con IRAMA)", file: "songs/track-864.mp3", artist: "Rkomi, Irama, Shablo", profile: "Emanuele", spotifyId: "6z7tGTD6yvyloEm6K2H8EX", spotifyAlbum: "TAXI DRIVER", spotifyDurationMs: 166000 },
    { title: "Certi Giorni (feat. Nitro)", file: "songs/track-865.mp3", artist: "Ernia, Nitro", profile: "Emanuele", spotifyId: "4nvsA575k8HrEjdQ78Ymvi", spotifyAlbum: "68 (Till The End)", spotifyDurationMs: 194000 },
    { title: "Phi", file: "songs/track-866.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "0E5bmLyxyiHsmc82D5gsiY", spotifyAlbum: "68 (Till The End)", spotifyDurationMs: 174000 },
    { title: "Ma il cielo è sempre più blu", file: "songs/track-240.mp3", artist: "Rino Gaetano", profile: "Emanuele", spotifyId: "1L9m2l2lhXgQ3GwmmCx3OK", spotifyAlbum: "La Storia", spotifyDurationMs: 272000 },
    { title: "Dark Horse", file: "songs/track-867.mp3", artist: "Katy Perry, Juicy J", profile: "Emanuele", spotifyId: "5jrdCoLpJSvHHorevXBATy", spotifyAlbum: "PRISM (Deluxe)", spotifyDurationMs: 215000 },
    { title: "WALLAH", file: "songs/track-868.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "39CXkMn8AAFu3qwnZHJCNo", spotifyAlbum: "WALLAH", spotifyDurationMs: 133000 },
    { title: "Cazzo Mene", file: "songs/track-1149.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "21h2N6UKUYc5UzqSCbWJal", spotifyAlbum: "Lunga Vita a Sto", spotifyDurationMs: 222000 },
    { title: "Habibi", file: "songs/track-869.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "2dyQYsU8cJLSGpVsbOy0CO", spotifyAlbum: "Album", spotifyDurationMs: 184000 },
    { title: "Cara Italia", file: "songs/track-1191.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "3atDsUhlUgDlQQrI0XFh7I", spotifyAlbum: "Cara Italia", spotifyDurationMs: 244000 },
    { title: "Veleno 8 (feat. Gemitaiz)", file: "songs/track-1083.mp3", artist: "MadMan, Gemitaiz", profile: "Emanuele", spotifyId: "06OBAy97uVyHCZvonvgfE2", spotifyAlbum: "MM Vol. 4", spotifyDurationMs: 182000 },
    { title: "MEGLIO DEL CINEMA", file: "songs/track-1084.mp3", artist: "Fedez", profile: "Emanuele", spotifyId: "6byHOsfSzBH0R5WQ6QRv54", spotifyAlbum: "MEGLIO DEL CINEMA", spotifyDurationMs: 188000 },
    { title: "Bye Bye", file: "songs/track-1085.mp3", artist: "Samurai Jay, Dani", profile: "Emanuele", spotifyId: "0DHxikaj0fk6gKkOwd2sMo", spotifyAlbum: "Bye Bye", spotifyDurationMs: 138000 },
    { title: "IN TRAPPOLA", file: "songs/track-1086.mp3", artist: "Salmo", profile: "Emanuele", spotifyId: "25zlvKhD4wtNyjWQ91APzB", spotifyAlbum: "FLOP", spotifyDurationMs: 112000 },
    { title: "Cali", file: "songs/track-1087.mp3", artist: "Vale Pain, La Luna Nera", profile: "Emanuele", spotifyId: "2Dlll94x7rzrrw2mN0PGjE", spotifyAlbum: "2020", spotifyDurationMs: 198000 },
    { title: "That's What I Like", file: "songs/track-1088.mp3", artist: "Bruno Mars", profile: "Emanuele", spotifyId: "0KKkJNfGyhkQ5aFogxQAPU", spotifyAlbum: "24K Magic", spotifyDurationMs: 206000 },
    { title: "Ora o mai più", file: "songs/track-1089.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "6MgjsSUoBTgFEd2gY8WVbD", spotifyAlbum: "ALI - ULTIMA NOTTE", spotifyDurationMs: 153000 },
    { title: "Warzone", file: "songs/track-1090.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "7FVcxWVUtjihWtQBW0W5Pm", spotifyAlbum: "ALI - ULTIMA NOTTE", spotifyDurationMs: 193000 },
    { title: "Il tuo nome", file: "songs/track-1091.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "2RVdq0QXC4JxU0X51ZQYaH", spotifyAlbum: "ALI", spotifyDurationMs: 170000 },
    { title: "Lobalo", file: "songs/track-1092.mp3", artist: "Flaco Mamba", profile: "Emanuele", spotifyId: "0UB1ts6o3I6DpM0BK9j2BO", spotifyAlbum: "Lobalo", spotifyDurationMs: 202000 },
    { title: "MI SENTO BENE", file: "songs/track-872.mp3", artist: "Salmo", profile: "Emanuele", spotifyId: "2v4kWcQ7LWML8TEQmLDAEO", spotifyAlbum: "FLOP", spotifyDurationMs: 183000 },
    { title: "Woo Baby (feat. Chris Brown)", file: "songs/track-873.mp3", artist: "Pop Smoke, Chris Brown", profile: "Emanuele", spotifyId: "58T4yPLn4NjBYXfRxeweyM", spotifyAlbum: "Faith", spotifyDurationMs: 156000 },
    { title: "Take Me To Church", file: "songs/track-874.mp3", artist: "Hozier", profile: "Emanuele", spotifyId: "3dYD57lRAUcMHufyqn9GcI", spotifyAlbum: "Hozier", spotifyDurationMs: 241000 },
    { title: "Blue Sky", file: "songs/track-1172.mp3", artist: "Gemitaiz, MadMan", profile: "Emanuele", spotifyId: "1WOeWKKfUxx8hlH8RSRjfV", spotifyAlbum: "Kepler", spotifyDurationMs: 187000 },
    { title: "Sole a mezzanotte", file: "songs/track-345.mp3", artist: "Gio Montana", profile: "Emanuele", spotifyId: "41wB7yyQG8YR284muocSv0", spotifyAlbum: "Sole a mezzanotte", spotifyDurationMs: 134000 },
    { title: "ANTIPATICO", file: "songs/track-875.mp3", artist: "Salmo", profile: "Emanuele", spotifyId: "5mJDKaEsF02C8BOZoJ14rl", spotifyAlbum: "FLOP", spotifyDurationMs: 117000 },
    { title: "KUMITE", file: "songs/track-876.mp3", artist: "Salmo", profile: "Emanuele", spotifyId: "6yaNNYWPjkWHbh1jADEyJO", spotifyAlbum: "FLOP", spotifyDurationMs: 170000 },
    { title: "FUORI DI TESTA - feat. Par-T-One", file: "songs/track-877.mp3", artist: "Salmo, Par-T-One", profile: "Emanuele", spotifyId: "2et2A0W3In3OYaRdJrY6m9", spotifyAlbum: "FLOP", spotifyDurationMs: 185000 },
    { title: "Ipernova", file: "songs/track-878.mp3", artist: "Mr.Rain", profile: "Emanuele", spotifyId: "1TaSkLG2bXx84YuKmJvncw", spotifyAlbum: "Butterfly Effect", spotifyDurationMs: 177000 },
    { title: "I Grandi Non Piangono Mai", file: "songs/track-879.mp3", artist: "Mr.Rain", profile: "Emanuele", spotifyId: "051yIUwgzFc5v7ed3SYmTl", spotifyAlbum: "Butterfly Effect", spotifyDurationMs: 226000 },
    { title: "Chiasso", file: "songs/track-880.mp3", artist: "Random", profile: "Emanuele", spotifyId: "4UJoAdTMnqxQHKWKLLQpvK", spotifyAlbum: "Chiasso", spotifyDurationMs: 182000 },
    { title: "Sono un bravo ragazzo un po' fuori di testa", file: "songs/track-881.mp3", artist: "Random", profile: "Emanuele", spotifyId: "4fllTuc6KM95uB3ZqqiGYd", spotifyAlbum: "Sono un bravo ragazzo un po' fuori di testa", spotifyDurationMs: 170000 },
    { title: "Safe And Sound", file: "songs/track-1183.mp3", artist: "Unread, Rakan", profile: "Emanuele", spotifyId: "6e7TWYrIgtqZugZyjRbWHj", spotifyAlbum: "Safe and Sound", spotifyDurationMs: 144000 },
    { title: "DNA", file: "songs/track-1093.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "2NflMHziVSclCuF3WGcXKb", spotifyAlbum: "DNA", spotifyDurationMs: 200000 },
    { title: "Shake That", file: "songs/track-1094.mp3", artist: "Elmatadormc7, Lil Dig, INCE, Gumma Vybz", profile: "Emanuele", spotifyId: "3Jtuwv93YozzbVlL9EExWk", spotifyAlbum: "Shake That", spotifyDurationMs: 136000 },
    { title: "The Real Slim Shady", file: "songs/track-884.mp3", artist: "Eminem", profile: "Emanuele", spotifyId: "3yfqSUWxFvZELEM4PmlwIR", spotifyAlbum: "The Marshall Mathers LP", spotifyDurationMs: 284000 },
    { title: "Topless", file: "songs/track-1150.mp3", artist: "Geeno, Luchè, CoCo", profile: "Emanuele", spotifyId: "2HjM0ufsJtI0zBBeFIpEog", spotifyAlbum: "Topless", spotifyDurationMs: 180000 },
    { title: "Davide (feat. Coez)", file: "songs/track-1173.mp3", artist: "Gemitaiz, Coez", profile: "Emanuele", spotifyId: "1Lq5ApqhIWUXzlryFX2K6J", spotifyAlbum: "Davide", spotifyDurationMs: 206000 },
    { title: "Ibiza", file: "songs/track-885.mp3", artist: "Tyga", profile: "Emanuele", spotifyId: "01sApbVbtNG0WpMQKieOwm", spotifyAlbum: "Ibiza", spotifyDurationMs: 180000 },
    { title: "Il cielo si tinge di blu", file: "songs/track-886.mp3", artist: "Nessuno, Urano", profile: "Emanuele", spotifyId: "3QpmPJHkO6xLu5d0Pwz5gs", spotifyAlbum: "Il cielo si tinge di blu", spotifyDurationMs: 139000 },
    { title: "Nuovi Amici No", file: "songs/track-887.mp3", artist: "Skinny", profile: "Emanuele", spotifyId: "4DTyaDA9ZwWUUqGUh1JOlj", spotifyAlbum: "Nuovi Amici No", spotifyDurationMs: 130000 },
    { title: "I Miss You", file: "songs/track-888.mp3", artist: "GELO", profile: "Emanuele", spotifyId: "4lgfhjnm922y6kGBAqKhaU", spotifyAlbum: "I Miss You", spotifyDurationMs: 177000 },
    { title: "Oh Jesus", file: "songs/track-889.mp3", artist: "Silent Bob, Sick Budd", profile: "Emanuele", spotifyId: "5KN3FPKo2iOJlNp1wE4qZO", spotifyAlbum: "Piano B", spotifyDurationMs: 168000 },
    { title: "Hangover", file: "songs/track-890.mp3", artist: "Gemitaiz", profile: "Emanuele", spotifyId: "1PqFDUw5Wgm4IhKkKRH3I0", spotifyAlbum: "Nonostante Tutto (Inediti, Rarità, Live E Remix)", spotifyDurationMs: 250000 },
    { title: "Su Di Te", file: "songs/track-891.mp3", artist: "Simone Panetti, G.bit, Mike Lennon, Rooler", profile: "Emanuele", spotifyId: "6eCIYNIasTRya5UYBWjxSE", spotifyAlbum: "Su Di Te", spotifyDurationMs: 188000 },
    { title: "MINACCIA", file: "songs/track-892.mp3", artist: "Radical, Mothz", profile: "Emanuele", spotifyId: "6vGgYuVaajzlfPK3i7ursd", spotifyAlbum: "TRASHBIN, Vol. 3", spotifyDurationMs: 76000 },
    { title: "Replay", file: "songs/track-1095.mp3", artist: "Iyaz", profile: "Emanuele", spotifyId: "4E5P1XyAFtrjpiIxkydly4", spotifyAlbum: "Replay", spotifyDurationMs: 182000 },
    { title: "MONTERO (Call Me By Your Name)", file: "songs/track-894.mp3", artist: "Lil Nas X", profile: "Emanuele", spotifyId: "67BtfxlNbhBmCDR2L2l8qd", spotifyAlbum: "MONTERO (Call Me By Your Name)", spotifyDurationMs: 137000 },
    { title: "#THOTMILANODM", file: "songs/track-895.mp3", artist: "Radical, Thelonious B., Rosa Chemical", profile: "Emanuele", spotifyId: "4wz9be3iTHln8swogVIAwR", spotifyAlbum: "TRASHBIN, Vol. 3", spotifyDurationMs: 186000 },
    { title: "YOSHI (feat. Fabri Fibra) - prod. Strage", file: "songs/track-896.mp3", artist: "MACHETE, Dani Faiv, tha Supreme, Fabri Fibra", profile: "Emanuele", spotifyId: "3Hh0ZcGIqIkSiJVZGLcVLx", spotifyAlbum: "MACHETE MIXTAPE 4", spotifyDurationMs: 211000 },
    { title: "IL CIELO NELLA STANZA (feat. NSTASIA)", file: "songs/track-1096.mp3", artist: "Salmo, NSTASIA", profile: "Emanuele", spotifyId: "2fkVZYFv9hOejIsLzZy8ad", spotifyAlbum: "Playlist", spotifyDurationMs: 186000 },
    { title: "INDUSTRY BABY (feat. Jack Harlow)", file: "songs/track-1097.mp3", artist: "Lil Nas X, Jack Harlow", profile: "Emanuele", spotifyId: "27NovPIUIRrOZoCHxABJwK", spotifyAlbum: "INDUSTRY BABY (feat. Jack Harlow)", spotifyDurationMs: 212000 },
    { title: "Pleasantville", file: "songs/track-1098.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "4T7nI6RllPyFPXJtIAtC7l", spotifyAlbum: "Suicidol", spotifyDurationMs: 349000 },
    { title: "Baba Jaga", file: "songs/track-1099.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "7noTHZbdwMkmOazuDteqmH", spotifyAlbum: "Suicidol", spotifyDurationMs: 147000 },
    { title: "Satisfya", file: "songs/track-1100.mp3", artist: "Imran Khan", profile: "Emanuele", spotifyId: "6HGoVbCUr63SgU3TjxEVj6", spotifyAlbum: "Satisfya", spotifyDurationMs: 180000 },
    { title: "Everybody Dies In Their Nightmares", file: "songs/track-1101.mp3", artist: "XXXTENTACION", profile: "Emanuele", spotifyId: "3GVkPk8mqxz0itaAriG1L7", spotifyAlbum: "17", spotifyDurationMs: 95000 },
    { title: "Pioggia", file: "songs/track-1102.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "3D1qKYxa1vLw1JwGoDUnvG", spotifyAlbum: "ALI", spotifyDurationMs: 170000 },
    { title: "Ninna Nanna", file: "songs/track-1103.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "1bJn4Hfj4xa58Jse9bQrN1", spotifyAlbum: "Album", spotifyDurationMs: 237000 },
    { title: "Danza Kuduro", file: "songs/track-901.mp3", artist: "Don Omar, Lucenzo", profile: "Emanuele", spotifyId: "4sCSUQnWQ6HJsOMjfPicdn", spotifyAlbum: "Emigrante Del Mundo (Remastered)", spotifyDurationMs: 198000 },
    { title: "Ego - Radio Edit", file: "songs/track-1114.mp3", artist: "Willy William", profile: "Emanuele", spotifyId: "3qoXUh7xT2nq8txSrsA9rZ", spotifyAlbum: "Une seule vie", spotifyDurationMs: 207000 },
    { title: "Buonanotte Amò", file: "songs/track-1104.mp3", artist: "Rocco Hunt", profile: "Emanuele", spotifyId: "0G9rMKBc4l9Knfd1Sw1cdi", spotifyAlbum: "Libertà", spotifyDurationMs: 162000 },
    { title: "Love Me", file: "songs/track-903.mp3", artist: "Lil Tecca", profile: "Emanuele", spotifyId: "4e0FYxSROat25pH16zMTZI", spotifyAlbum: "We Love You Tecca", spotifyDurationMs: 117000 },
    { title: "Love Me Again", file: "songs/track-904.mp3", artist: "John Newman", profile: "Emanuele", spotifyId: "5TbzAWWc5eJaANpA9kfGCd", spotifyAlbum: "Tribute", spotifyDurationMs: 239000 },
    { title: "Moonlight", file: "songs/track-905.mp3", artist: "XXXTENTACION", profile: "Emanuele", spotifyId: "0JP9xo3adEtGSdUEISiszL", spotifyAlbum: "?", spotifyDurationMs: 135000 },
    { title: "Look At Me!", file: "songs/track-906.mp3", artist: "XXXTENTACION", profile: "Emanuele", spotifyId: "7floNISpH8VF4z4459Qo18", spotifyAlbum: "Look At Me!", spotifyDurationMs: 126000 },
    { title: "X 1 MEX (feat. Dani Faiv)", file: "songs/track-1105.mp3", artist: "BLOODY VINYL, Slait, tha Supreme, MILES, Dani Faiv", profile: "Emanuele", spotifyId: "5gouWBHeO3hLhCUr9gSvV5", spotifyAlbum: "BV3", spotifyDurationMs: 174000 },
    { title: "X", file: "songs/track-907.mp3", artist: "Nicky Jam, J Balvin", profile: "Emanuele", spotifyId: "5YUyW9opqNsMSEzzecZih1", spotifyAlbum: "Intimo", spotifyDurationMs: 172000 },
    { title: "Goddamn (feat. A Boogie wit da Hoodie)", file: "songs/track-908.mp3", artist: "Tyga, A Boogie Wit da Hoodie", profile: "Emanuele", spotifyId: "0Zl4G9qcdXV5hVhdOirNHG", spotifyAlbum: "Goddamn (feat. A Boogie wit da Hoodie)", spotifyDurationMs: 211000 },
    { title: "I Like It", file: "songs/track-909.mp3", artist: "Cardi B, Bad Bunny, J Balvin", profile: "Emanuele", spotifyId: "58q2HKrzhC3ozto2nDdN4z", spotifyAlbum: "Invasion of Privacy", spotifyDurationMs: 253000 },
    { title: "El Party", file: "songs/track-910.mp3", artist: "Jake La Furia, Alessio La Profunda Melodia", profile: "Emanuele", spotifyId: "19LRRuiMQ8a9jhqSf8jVip", spotifyAlbum: "El Party", spotifyDurationMs: 211000 },
    { title: "P.E.S.", file: "songs/track-1106.mp3", artist: "Club Dogo, Giuliano Palma", profile: "Emanuele", spotifyId: "4M8filny20Mwlc2gnvtcgU", spotifyAlbum: "Noi Siamo Il Club (Reloaded Edition)", spotifyDurationMs: 228000 },
    { title: "Psycho (feat. Rose Villain)", file: "songs/track-912.mp3", artist: "Emis Killa, Rose Villain", profile: "Emanuele", spotifyId: "1T0Yxsej1IIwR9Zxx676da", spotifyAlbum: "Keta Music, Vol. 3", spotifyDurationMs: 142000 },
    { title: "Piede in strada (feat. Mera)", file: "songs/track-913.mp3", artist: "Emis Killa, Mera", profile: "Emanuele", spotifyId: "58oeJn3WUNbOBwaDFLgYL3", spotifyAlbum: "Keta Music, Vol. 3", spotifyDurationMs: 159000 },
    { title: "Qualche sasso", file: "songs/track-914.mp3", artist: "Emis Killa", profile: "Emanuele", spotifyId: "0ON7cT98E4H7Rh4dzfvKCa", spotifyAlbum: "Keta Music, Vol. 3", spotifyDurationMs: 127000 },
    { title: "Notti In Bianco", file: "songs/track-915.mp3", artist: "BLANCO", profile: "Emanuele", spotifyId: "38UoVEHcZ85EGBo6k79643", spotifyAlbum: "Notti In Bianco", spotifyDurationMs: 176000 },
    { title: "Ransom (with Juice WRLD) - Remix", file: "songs/track-916.mp3", artist: "Lil Tecca, Juice WRLD", profile: "Emanuele", spotifyId: "2WsuSYJNXGKXVYkHPnq2yp", spotifyAlbum: "We Love You Tecca", spotifyDurationMs: 171000 },
    { title: "Stunting", file: "songs/track-917.mp3", artist: "DJ Kiss", profile: "Emanuele", spotifyId: "2YJEjwjMC7kLRLDMoP91qc", spotifyAlbum: "Play Money", spotifyDurationMs: 120000 },
    { title: "Heavy Metal", file: "songs/track-918.mp3", artist: "Mostro", profile: "Emanuele", spotifyId: "13XBWnwKT0rMZoHfv5l0Es", spotifyAlbum: "Ogni maledetto giorno (Deluxe Edition)", spotifyDurationMs: 84000 },
    { title: "In Da Getto", file: "songs/track-919.mp3", artist: "J Balvin, Skrillex", profile: "Emanuele", spotifyId: "63aj87TQG6F3RVO5nbG2VQ", spotifyAlbum: "In Da Getto", spotifyDurationMs: 131000 },
    { title: "Dinero", file: "songs/track-920.mp3", artist: "Trinidad Cardona", profile: "Emanuele", spotifyId: "3ggtU1ZOKO8ZNiqPNyXGcm", spotifyAlbum: "Dinero", spotifyDurationMs: 160000 },
    { title: "Senza Cura", file: "songs/track-921.mp3", artist: "Silent Bob, Sick Budd", profile: "Emanuele", spotifyId: "4ilFOAeIWe05BlCyQ3syDK", spotifyAlbum: "Senza Cura", spotifyDurationMs: 138000 },
    { title: "Angeli", file: "songs/track-922.mp3", artist: "Close Listen, Icy Subzero, Ayden Lau", profile: "Emanuele", spotifyId: "1jrOa5WRrJkQcKaHSsazuE", spotifyAlbum: "Angeli", spotifyDurationMs: 122000 },
    { title: "Tu sei", file: "songs/track-1107.mp3", artist: "Giovane Miska, 17 Bronx", profile: "Emanuele", spotifyId: "4RfRjiIatYzjaaOtFtaFUi", spotifyAlbum: "CHIAMATE PERSE", spotifyDurationMs: 129000 },
    { title: "Knock Knock", file: "songs/track-1108.mp3", artist: "SoFaygo", profile: "Emanuele", spotifyId: "6aHoPULNO7pSL2ZfUY0bU8", spotifyAlbum: "Angelic 7", spotifyDurationMs: 139000 },
    { title: "Vien cu me", file: "songs/track-1196.mp3", artist: "Christian Revo, Geolier", profile: "Emanuele", spotifyId: "3HCAGeuTGRJCCG1Dowouho", spotifyAlbum: "Talento Sprecato", spotifyDurationMs: 177000 },
    { title: "ONLYFANS (feat. MamboLosco)", file: "songs/track-1151.mp3", artist: "Slings, MamboLosco", profile: "Emanuele", spotifyId: "2RrldylvtjefqddhIONP7x", spotifyAlbum: "ONLYFANS (feat. MamboLosco)", spotifyDurationMs: 143000 },
    { title: "Hello (feat. A Boogie Wit da Hoodie)", file: "songs/track-1109.mp3", artist: "Pop Smoke, A Boogie Wit da Hoodie", profile: "Emanuele", spotifyId: "2r6OAV3WsYtXuXjvJ1lIDi", spotifyAlbum: "Shoot For The Stars Aim For The Moon (Deluxe)", spotifyDurationMs: 190000 },
    { title: "SWISH", file: "songs/track-1110.mp3", artist: "Tyga", profile: "Emanuele", spotifyId: "55GiOwtxNajXVbpjjIzMnD", spotifyAlbum: "SWISH", spotifyDurationMs: 194000 },
    { title: "Come Get Her", file: "songs/track-1111.mp3", artist: "Rae Sremmurd", profile: "Emanuele", spotifyId: "1Ser4X0TKttOvo8bgdytTP", spotifyAlbum: "SremmLife", spotifyDurationMs: 212000 },
    { title: "The Hills", file: "songs/track-1112.mp3", artist: "The Weeknd", profile: "Emanuele", spotifyId: "7fBv7CLKzipRk6EC6TWHOB", spotifyAlbum: "Beauty Behind The Madness", spotifyDurationMs: 242000 },
    { title: "Via Libetta", file: "songs/track-925.mp3", artist: "Shangai Blood, Naver, Sayanbull, Wave DB, Suburbio, Chris Bomaye", profile: "Emanuele", spotifyId: "6qVTkX2V6SaCQolLqWNBuM", spotifyAlbum: "Via Libetta", spotifyDurationMs: 230000 },
    { title: "Vida Loca", file: "songs/track-1140.mp3", artist: "Ye$hua", profile: "Emanuele", spotifyId: "3uI5JbhnAaHTuGaxMSug7m", spotifyAlbum: "Vida Loca", spotifyDurationMs: 197000 },
    { title: "Godzilla (feat. Juice WRLD)", file: "songs/track-927.mp3", artist: "Eminem, Juice WRLD", profile: "Emanuele", spotifyId: "7FIWs0pqAYbP91WWM0vlTQ", spotifyAlbum: "Music To Be Murdered By", spotifyDurationMs: 210000 },
    { title: "Just For Fun (feat. Yung Snapp)", file: "songs/track-928.mp3", artist: "Lele Blade, Yung Snapp", profile: "Emanuele", spotifyId: "6kGOv3rx5RqSI2X8pQVxsS", spotifyAlbum: "Just For Fun (feat. Yung Snapp)", spotifyDurationMs: 137000 },
    { title: "Baby Gang", file: "songs/track-929.mp3", artist: "167 Gang, Baby Gang", profile: "Emanuele", spotifyId: "4wGzKzVWDPIr13qK2i2JP0", spotifyAlbum: "Baby Gang", spotifyDurationMs: 187000 },
    { title: "Favole", file: "songs/track-930.mp3", artist: "Fraespo", profile: "Emanuele", spotifyId: "03OG1l3nH7rQgJDtM6YDb8", spotifyAlbum: "Favole", spotifyDurationMs: 102000 },
    { title: "Candy", file: "songs/track-931.mp3", artist: "VillaBanks, Vale Pain, Linch, Bovychulo", profile: "Emanuele", spotifyId: "3a3EzSxWvDno8RpTMv7Xch", spotifyAlbum: "Non Lo So", spotifyDurationMs: 142000 },
    { title: "SUPREME - L'ego (feat. thasup & Sfera Ebbasta)", file: "songs/track-932.mp3", artist: "Marracash, tha Supreme, Sfera Ebbasta", profile: "Emanuele", spotifyId: "5EpBEqf5bnKeJ3p4zA1Sod", spotifyAlbum: "Persona", spotifyDurationMs: 223000 },
    { title: "Regular Everyday Normal Motherfucker", file: "songs/track-1186.mp3", artist: "Hairy Potter", profile: "Emanuele", spotifyId: "5rKfXD2DzJLfkE0VGsKMQk", spotifyAlbum: "Regular Everyday Normal Motherfucker", spotifyDurationMs: 193000 },
    { title: "Ricordi Bui", file: "songs/track-933.mp3", artist: "Leon Faun, Duffy", profile: "Emanuele", spotifyId: "6TTJKILWeUNRT12yfxaXWH", spotifyAlbum: "C'era una volta", spotifyDurationMs: 80000 },
    { title: "Body (Remix) [feat. Capo Plaza & Rondodasosa]", file: "songs/track-934.mp3", artist: "Tion Wayne, Russ Millions, Capo Plaza, Rondodasosa", profile: "Emanuele", spotifyId: "1JAkXiY10vwLhSbcsiimrp", spotifyAlbum: "Body (Remix) [feat. Capo Plaza & Rondodasosa]", spotifyDurationMs: 205000 },
    { title: "Non Abbiamo Età", file: "songs/track-110.mp3", artist: "Luchè", profile: "Emanuele", spotifyId: "0NwuXciw6eQc4edjwSBnV3", spotifyAlbum: "Potere", spotifyDurationMs: 181000 },
    { title: "C'era una volta", file: "songs/track-936.mp3", artist: "KAYLER, DOD", profile: "Emanuele", spotifyId: "2FofcSBjpvG1VevyabKPOq", spotifyAlbum: "C'era una volta", spotifyDurationMs: 126000 },
    { title: "La follia non ha età RMX (feat. Dani Faiv)", file: "songs/track-937.mp3", artist: "Leon Faun, Duffy, Dani Faiv", profile: "Emanuele", spotifyId: "0COmugdfmCITil997mvPHd", spotifyAlbum: "C'era una volta", spotifyDurationMs: 170000 },
    { title: "C'era una volta", file: "songs/track-938.mp3", artist: "Leon Faun, Duffy", profile: "Emanuele", spotifyId: "5CVxRagSP0mygbq68883fH", spotifyAlbum: "C'era una volta", spotifyDurationMs: 177000 },
    { title: "Barking", file: "songs/track-1192.mp3", artist: "Ramz", profile: "Emanuele", spotifyId: "2U5cq89GCnsR1yixKkC8d5", spotifyAlbum: "Barking", spotifyDurationMs: 202000 },
    { title: "Jordan Manchás", file: "songs/track-940.mp3", artist: "Skinny Flex, Elpatron970", profile: "Emanuele", spotifyId: "16fcpqTCRdFkI15jyI5ePK", spotifyAlbum: "Jordan Manchás", spotifyDurationMs: 153000 },
    { title: "Faded", file: "songs/track-941.mp3", artist: "Arc North, Cour, New Beat Order, Lunis", profile: "Emanuele", spotifyId: "3d93zfyq9SPAETUMiVK3dP", spotifyAlbum: "Faded", spotifyDurationMs: 146000 },
    { title: "Cupid Shuffle", file: "songs/track-942.mp3", artist: "Cupid", profile: "Emanuele", spotifyId: "07Tx168RSsUS1HqkDIOZbH", spotifyAlbum: "Time for a Change", spotifyDurationMs: 231000 },
    { title: "Panamera", file: "songs/track-943.mp3", artist: "NDG", profile: "Emanuele", spotifyId: "0LL9AQsHR1z1PaCsFL1HOO", spotifyAlbum: "Panamera", spotifyDurationMs: 172000 },
    { title: "Sono Siciliano", file: "songs/track-944.mp3", artist: "BLACK PRINCE, L'Elfo", profile: "Emanuele", spotifyId: "16SxYzsCFy1qmiwOSCGCoh", spotifyAlbum: "Sono Siciliano", spotifyDurationMs: 183000 },
    { title: "Big Gangsta", file: "songs/track-945.mp3", artist: "Kevin Gates", profile: "Emanuele", spotifyId: "2HYvkdq6lpFXkVz9Tfqi8r", spotifyAlbum: "Only the Generals Gon Understand", spotifyDurationMs: 243000 },
    { title: "Panda", file: "songs/track-946.mp3", artist: "Desiigner", profile: "Emanuele", spotifyId: "5YEOzOojehCqxGQCcQiyR4", spotifyAlbum: "New English", spotifyDurationMs: 246000 },
    { title: "Ramenez la coupe à la maison", file: "songs/track-947.mp3", artist: "Vegedream", profile: "Emanuele", spotifyId: "1m0UFnuTktOkksvjbF9z0m", spotifyAlbum: "Marchand de sable", spotifyDurationMs: 235000 },
    { title: "Il soffitto viene giù (feat. Salmo)", file: "songs/track-948.mp3", artist: "BLOODY VINYL, MACHETE, Slait, Salmo", profile: "Emanuele", spotifyId: "1XWKkbjE6qDAWQOTkINOjN", spotifyAlbum: "BV2", spotifyDurationMs: 156000 },
    { title: "Il Rap Nel Mio Paese", file: "songs/track-949.mp3", artist: "Fabri Fibra", profile: "Emanuele", spotifyId: "2Oe5GP3iudJ0LuV03ZIT34", spotifyAlbum: "Squallor", spotifyDurationMs: 276000 },
    { title: "Malibu", file: "songs/track-950.mp3", artist: "Vegas Jones", profile: "Emanuele", spotifyId: "08AN0HMXNr3DGGDCOWsTAw", spotifyAlbum: "Bellaria", spotifyDurationMs: 211000 },
    { title: "Tokyo Drift", file: "songs/track-951.mp3", artist: "KVSH", profile: "Emanuele", spotifyId: "20WcuVfTh0QFkIsJUncdON", spotifyAlbum: "Tokyo Drift (Remix)", spotifyDurationMs: 222000 },
    { title: "Can't Hold Us - SFG Remix", file: "songs/track-952.mp3", artist: "D-Sane", profile: "Emanuele", spotifyId: "1GVENedXn5WboFUZBBXRp9", spotifyAlbum: "Can't Hold Us (SFG Remix)", spotifyDurationMs: 337000 },
    { title: "Life Is Life", file: "songs/track-953.mp3", artist: "80s Super Hits", profile: "Emanuele", spotifyId: "2nYUvkyGnWuIJUTHPdvY0O", spotifyAlbum: "Ultimate 80s Hit Songs: The Best 80s Playlist", spotifyDurationMs: 250000 },
    { title: "Diavolo magro", file: "songs/track-1174.mp3", artist: "Mostro", profile: "Emanuele", spotifyId: "2vTH6m88GfrQHkCREtcDFC", spotifyAlbum: "The Illest, Vol. 2", spotifyDurationMs: 160000 },
    { title: "Buon Viaggio (Share The Love)", file: "songs/track-954.mp3", artist: "Cesare Cremonini", profile: "Emanuele", spotifyId: "7LSBkEm5LQSkhe6yqqqBPs", spotifyAlbum: "Più Che Logico", spotifyDurationMs: 207000 },
    { title: "SCACCIACANI - feat. Massimo Pericolo - prod. Crookers & Nic Sarno", file: "songs/track-955.mp3", artist: "Ketama126, Massimo Pericolo", profile: "Emanuele", spotifyId: "2665YLaM0dLaIhkjpUHT7k", spotifyAlbum: "SCACCIACANI (feat. Massimo Pericolo - prod. Crookers & Nic Sarno)", spotifyDurationMs: 219000 },
    { title: "Bailar (feat. Elvis Crespo) - Radio Edit", file: "songs/track-1113.mp3", artist: "Deorro, Elvis Crespo", profile: "Emanuele", spotifyId: "45sGyAtAxD6efaN0bJAFgh", spotifyAlbum: "Bailar (feat. Elvis Crespo) [Radio Edit]", spotifyDurationMs: 137000 },
    { title: "Talk Dirty (feat. 2 Chainz)", file: "songs/track-956.mp3", artist: "Jason Derulo, 2 Chainz", profile: "Emanuele", spotifyId: "5l3CML2OnzfNs5RfVgbcLt", spotifyAlbum: "Talk Dirty", spotifyDurationMs: 177000 },
    { title: "Ego - Radio Edit", file: "songs/track-1175.mp3", artist: "Willy William", profile: "Emanuele", spotifyId: "1JifHg9Xly5nIU0TA5W7E7", spotifyAlbum: "Une seule vie", spotifyDurationMs: 207000 },
    { title: "No Lie", file: "songs/track-957.mp3", artist: "Sean Paul, Dua Lipa", profile: "Emanuele", spotifyId: "48QmG1dfvMuYLxMPt7KSRA", spotifyAlbum: "Mad Love The Prequel", spotifyDurationMs: 221000 },
    { title: "Take 343 (feat. Massimo Pericolo, LGND)", file: "songs/track-1115.mp3", artist: "Real Talk, Massimo Pericolo, LGND", profile: "Emanuele", spotifyId: "2V0CvYeBkrl09P6rpWXVux", spotifyAlbum: "REAL TALK - MASSIMO PERICOLO (4/2 - EP)", spotifyDurationMs: 144000 },
    { title: "Take 342 (feat. Massimo Pericolo, TwentyTwo)", file: "songs/track-1156.mp3", artist: "Real Talk, Massimo Pericolo, TwentyTwo", profile: "Emanuele", spotifyId: "7kzlCym9xPDAodtc3ztk6i", spotifyAlbum: "REAL TALK - MASSIMO PERICOLO (4/2 - EP)", spotifyDurationMs: 115000 },
    { title: "Take 341 (feat. Massimo Pericolo, Bosca)", file: "songs/track-1116.mp3", artist: "Real Talk, Massimo Pericolo, Bosca", profile: "Emanuele", spotifyId: "7cwqjYcwTVs7LAuvitiYQ6", spotifyAlbum: "REAL TALK - MASSIMO PERICOLO (4/2 - EP)", spotifyDurationMs: 219000 },
    { title: "Soldati", file: "songs/track-958.mp3", artist: "Massimo Pericolo", profile: "Emanuele", spotifyId: "4wjJAbrMPIUOafFK7VaZdC", spotifyAlbum: "Scialla Semper", spotifyDurationMs: 147000 },
    { title: "Bimbi Soldato", file: "songs/track-959.mp3", artist: "Baby Gang, Sacky", profile: "Emanuele", spotifyId: "0vIRBxBzL7ejCluhb6ec2Z", spotifyAlbum: "Bimbi Soldato", spotifyDurationMs: 149000 },
    { title: "Cella 2", file: "songs/track-1117.mp3", artist: "Baby Gang, Higashi", profile: "Emanuele", spotifyId: "2LmVlMGBKvJSjzGs0zmjEX", spotifyAlbum: "Cella 2", spotifyDurationMs: 142000 },
    { title: "Cella 1", file: "songs/track-1118.mp3", artist: "Baby Gang", profile: "Emanuele", spotifyId: "6CiB4YlbfoFZku2tRzSdRO", spotifyAlbum: "Cella 1", spotifyDurationMs: 154000 },
    { title: "F.N", file: "songs/track-1119.mp3", artist: "Lil Tjay", profile: "Emanuele", spotifyId: "0RLLvYBopDwooCyvnTwgYu", spotifyAlbum: "True 2 Myself", spotifyDurationMs: 224000 },
    { title: "Senza Pagare VS T-Pain (feat. T-Pain)", file: "songs/track-962.mp3", artist: "J-AX, Fedez, T-Pain", profile: "Emanuele", spotifyId: "1ATWiuxpIc287Cynakx59C", spotifyAlbum: "Senza Pagare VS T-Pain (feat. T-Pain)", spotifyDurationMs: 210000 },
    { title: "Occhi Lucidi", file: "songs/track-963.mp3", artist: "Leon Faun, Duffy", profile: "Emanuele", spotifyId: "7dYgzrhdIIjTQTvUjlrWxa", spotifyAlbum: "Occhi Lucidi", spotifyDurationMs: 144000 },
    { title: "Primavera", file: "songs/track-964.mp3", artist: "Leon Faun, Duffy", profile: "Emanuele", spotifyId: "5v7MZptpFvqNqIbk0T674i", spotifyAlbum: "Primavera", spotifyDurationMs: 129000 },
    { title: "Apollo 13 (feat. Vegas Jones)", file: "songs/track-965.mp3", artist: "Il Tre, Vegas Jones", profile: "Emanuele", spotifyId: "6HppxkBehKYGzBjZNPTQ4H", spotifyAlbum: "ALI", spotifyDurationMs: 223000 },
    { title: "Freestyle 21", file: "songs/track-966.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "6ImM6kLDk60tbBiRTTvwp5", spotifyAlbum: "Raptus 2", spotifyDurationMs: 111000 },
    { title: "23 coltellate", file: "songs/track-967.mp3", artist: "Highsnob, MamboLosco, Andry The Hitmaker", profile: "Emanuele", spotifyId: "5RlrdqMMNm42rKgYq64a3T", spotifyAlbum: "23 coltellate", spotifyDurationMs: 155000 },
    { title: "Payphone", file: "songs/track-968.mp3", artist: "Maroon 5, Wiz Khalifa", profile: "Emanuele", spotifyId: "1XGmzt0PVuFgQYYnV2It7A", spotifyAlbum: "Overexposed Track By Track", spotifyDurationMs: 231000 },
    { title: "Pioggia - Single Version", file: "songs/track-1176.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "3Jxv90Ey423ZApqYfqSNue", spotifyAlbum: "ALI", spotifyDurationMs: 170000 },
    { title: "Take 2102 (feat. Nayt, Bosca)", file: "songs/track-1120.mp3", artist: "Real Talk, nayt, Bosca", profile: "Emanuele", spotifyId: "7GLa2BBe6XdRsnJdrNSAzw", spotifyAlbum: "REAL TALK - NAYT (2/10 EP)", spotifyDurationMs: 119000 },
    { title: "Take 2103 (feat. Nayt, LGND)", file: "songs/track-1121.mp3", artist: "Real Talk, nayt, LGND", profile: "Emanuele", spotifyId: "6X1la01hVCfQz0gg5nw38p", spotifyAlbum: "REAL TALK - NAYT (2/10 EP)", spotifyDurationMs: 174000 },
    { title: "Non Me Ne Frega Un Cazzo (feat. Fabri Fibra)", file: "songs/track-969.mp3", artist: "Ernia, Fabri Fibra", profile: "Emanuele", spotifyId: "3QGKwtZ2jRvI9AXzIQ2AhP", spotifyAlbum: "Gemelli", spotifyDurationMs: 209000 },
    { title: "Louboutin", file: "songs/track-970.mp3", artist: "Vale Pain, Rondodasosa", profile: "Emanuele", spotifyId: "7fzaDe7qR6IX2w275uX4Th", spotifyAlbum: "Louboutin", spotifyDurationMs: 240000 },
    { title: "TUTTAPPO'", file: "songs/track-1122.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "0Jgad5naDLh5Wshmzdzyxz", spotifyAlbum: "MOOD", spotifyDurationMs: 156000 },
    { title: "Musica Ovunque", file: "songs/track-1177.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "31m7HX5tiLNouPjN4OB8ng", spotifyAlbum: "MOOD", spotifyDurationMs: 253000 },
    { title: "Fame (feat. Madman)", file: "songs/track-376.mp3", artist: "nayt, 3D, MadMan", profile: "Emanuele", spotifyId: "5Jny3m9XarSYHvxCldiYdE", spotifyAlbum: "Raptus 3", spotifyDurationMs: 222000 },
    { title: "Inferno", file: "songs/track-1123.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "0tKOZoVkaV3ZSYyp8dyaCe", spotifyAlbum: "Raptus 3", spotifyDurationMs: 181000 },
    { title: "Animal", file: "songs/track-974.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "6DuaLPP9WpaRObuVdZ8Kcs", spotifyAlbum: "Raptus 3", spotifyDurationMs: 127000 },
    { title: "Brutti sogni", file: "songs/track-975.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "3uRsF8kteU4tahegykQL73", spotifyAlbum: "Raptus 3", spotifyDurationMs: 177000 },
    { title: "La mia voce", file: "songs/track-382.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "6tgQxjeSlrP4J6jjYfjb7R", spotifyAlbum: "Raptus 3", spotifyDurationMs: 176000 },
    { title: "oh 9od - feat. Nayt", file: "songs/track-977.mp3", artist: "tha Supreme, nayt", profile: "Emanuele", spotifyId: "5Qy9jtZdxUnFXmgPp3u5VZ", spotifyAlbum: "23 6451", spotifyDurationMs: 204000 },
    { title: "Gli occhi della tigre", file: "songs/track-1124.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "5pL8J6weoydzXglhsoJ6Vw", spotifyAlbum: "Raptus 3", spotifyDurationMs: 166000 },
    { title: "Matrix (feat. Nayt)", file: "songs/track-979.mp3", artist: "Izi, nayt", profile: "Emanuele", spotifyId: "4B2INUH3nWgyrOeUIqr5Hj", spotifyAlbum: "RIOT", spotifyDurationMs: 175000 },
    { title: "Flop (feat. Leon Faun)", file: "songs/track-1157.mp3", artist: "Izi, Leon Faun", profile: "Emanuele", spotifyId: "0DCLd1GJKAsESFs6yQ3TjW", spotifyAlbum: "RIOT", spotifyDurationMs: 132000 },
    { title: "MACHETE SATELLITE (feat. Salmo & Taxi B)", file: "songs/track-981.mp3", artist: "BLOODY VINYL, Slait, MILES, Salmo, Taxi B", profile: "Emanuele", spotifyId: "3CHiuPXn9ufDJhVy1xI4Jf", spotifyAlbum: "BV3", spotifyDurationMs: 146000 },
    { title: "Amo Ma Chi T Sap (feat. MV Killa & Guè)", file: "songs/track-982.mp3", artist: "Geolier, MV Killa, Guè", profile: "Emanuele", spotifyId: "57Ae6GvuVqepP8iTqWjzep", spotifyAlbum: "Emanuele", spotifyDurationMs: 209000 },
    { title: "Soldi in Nero - feat. Sfera Ebbasta", file: "songs/track-983.mp3", artist: "Shiva, Sfera Ebbasta", profile: "Emanuele", spotifyId: "1Xm2e1vDwOMeJJioWuG1s7", spotifyAlbum: "Soldi in Nero (feat. Sfera Ebbasta)", spotifyDurationMs: 183000 },
    { title: "PAROLA - feat. Lazza, Emis Killa", file: "songs/track-984.mp3", artist: "Giaime, Lazza, Emis Killa, Andry The Hitmaker", profile: "Emanuele", spotifyId: "2tQ7vPjN88wkQl5hSNSbVF", spotifyAlbum: "MULA", spotifyDurationMs: 203000 },
    { title: "Boogieman (feat. Salmo)", file: "songs/track-985.mp3", artist: "Ghali, Salmo", profile: "Emanuele", spotifyId: "10Q5VqDAAbwExYkNha3VKH", spotifyAlbum: "DNA", spotifyDurationMs: 159000 },
    { title: "Solo", file: "songs/track-1125.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "6IvS6osbMlIlHsHtME4Ds7", spotifyAlbum: "Real Talk", spotifyDurationMs: 128000 },
    { title: "Soldiers", file: "songs/track-1184.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "3pZqdGiFPRxPVPwxZszkdx", spotifyAlbum: "Real Talk", spotifyDurationMs: 145000 },
    { title: "Skechers", file: "songs/track-988.mp3", artist: "DripReport", profile: "Emanuele", spotifyId: "2alc8VZAzDgdAsL2QMk3hu", spotifyAlbum: "Skechers", spotifyDurationMs: 106000 },
    { title: "Danger", file: "songs/track-989.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "0hNL8JT6oX3oDvkkqBw3l1", spotifyAlbum: "Danger", spotifyDurationMs: 194000 },
    { title: "Stronzo (feat. DJ MS)", file: "songs/track-990.mp3", artist: "Nitro, Dj MS", profile: "Emanuele", spotifyId: "0PeLjkHFc90ROcnoLRwA3Z", spotifyAlbum: "Suicidol", spotifyDurationMs: 200000 },
    { title: "0", file: "songs/track-1181.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "2PldrXU4dp3Og28cWt1Kwl", spotifyAlbum: "Danger", spotifyDurationMs: 134000 },
    { title: "Lucifero (prod. Yazee)", file: "songs/track-991.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "7gY3qneACKqhzMD5jBo6Zq", spotifyAlbum: "Lucifero (prod. Yazee)", spotifyDurationMs: 180000 },
    { title: "Narcos", file: "songs/track-992.mp3", artist: "Geolier", profile: "Emanuele", spotifyId: "1BdmcsFAODQR4x7eiOuRVf", spotifyAlbum: "Emanuele", spotifyDurationMs: 196000 },
    { title: "Mister (feat. Lazza & Jake La Furia)", file: "songs/track-993.mp3", artist: "Jack The Smoker, Lazza, Jake La Furia", profile: "Emanuele", spotifyId: "3TWEaGqDJ4pZn8CZG4XjQF", spotifyAlbum: "Ho Fatto Tardi", spotifyDurationMs: 283000 },
    { title: "fuck 3x", file: "songs/track-484.mp3", artist: "tha Supreme", profile: "Emanuele", spotifyId: "5YxP1CkunbhUQVvctFOHa7", spotifyAlbum: "23 6451", spotifyDurationMs: 161000 },
    { title: "2 TIRI (feat. tha Supreme)", file: "songs/track-994.mp3", artist: "Lazza, tha Supreme", profile: "Emanuele", spotifyId: "3YMG87pTNliEHwbrYfGpiL", spotifyAlbum: "J", spotifyDurationMs: 162000 },
    { title: "Cacao (feat. Pyrex)", file: "songs/track-995.mp3", artist: "Ghali, Pyrex", profile: "Emanuele", spotifyId: "6l53oE417B7CeVgT9AFBYN", spotifyAlbum: "DNA", spotifyDurationMs: 113000 },
    { title: "Cyborg (feat. Geolier)", file: "songs/track-996.mp3", artist: "Guè, Geolier", profile: "Emanuele", spotifyId: "54wRUYPMEHLttFdLImOlAt", spotifyAlbum: "Mr. Fini", spotifyDurationMs: 205000 },
    { title: "Simba", file: "songs/track-997.mp3", artist: "Ernia", profile: "Emanuele", spotifyId: "69d3X2Nv5AWHUeTktfOqpV", spotifyAlbum: "68", spotifyDurationMs: 199000 },
    { title: "0ffline (feat. bbno$)", file: "songs/track-998.mp3", artist: "tha Supreme, bbno$", profile: "Emanuele", spotifyId: "6ZWsKJdmoYu1oFJbzCmtK9", spotifyAlbum: "23 6451", spotifyDurationMs: 201000 },
    { title: "Thrift Shop (feat. Wanz)", file: "songs/track-1126.mp3", artist: "Macklemore & Ryan Lewis, Wanz", profile: "Emanuele", spotifyId: "4YMqbFcDIFiCBd02PzUBcM", spotifyAlbum: "The Heist", spotifyDurationMs: 235000 },
    { title: "Vendetta", file: "songs/track-1127.mp3", artist: "Skinny", profile: "Emanuele", spotifyId: "1TUAnO9lhKKySN8WT3vvHY", spotifyAlbum: "Vendetta", spotifyDurationMs: 171000 },
    { title: "Blue Bandana", file: "songs/track-1128.mp3", artist: "Skinny", profile: "Emanuele", spotifyId: "55Soh2lcLeN0ysLou2P7XP", spotifyAlbum: "Blue Bandana", spotifyDurationMs: 166000 },
    { title: "Te lo prometto", file: "songs/track-1129.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "72aqCNAdOo6H4nrPyAivSV", spotifyAlbum: "Te lo prometto", spotifyDurationMs: 184000 },
    { title: "CHARLES MANSON (BUON NATALE2) (feat. Lazza)", file: "songs/track-1152.mp3", artist: "Salmo, Dani Faiv, Nitro, Lazza", profile: "Emanuele", spotifyId: "4z6l90HzhLLCd0hWddzbrh", spotifyAlbum: "Playlist Live", spotifyDurationMs: 258000 },
    { title: "RAP SHIT (feat. tha Supreme & Gemitaiz) - prod. STABBER", file: "songs/track-1130.mp3", artist: "Nitro, tha Supreme, Gemitaiz", profile: "Emanuele", spotifyId: "2Fbj0y0HEUKCZkUsI71PUx", spotifyAlbum: "GarbAge", spotifyDurationMs: 212000 },
    { title: "oh 9od", file: "songs/track-93.mp3", artist: "tha Supreme, nayt", profile: "Emanuele", spotifyId: "0UuqwLM3UFmwcXSJgfFHvr", spotifyAlbum: "oh 9od", spotifyDurationMs: 205000 },
    { title: "Pregiudicati", file: "songs/track-1131.mp3", artist: "Skinny", profile: "Emanuele", spotifyId: "5PXOuBwrUgqxn8njY4xrfw", spotifyAlbum: "Pregiudicati", spotifyDurationMs: 196000 },
    { title: "blun7 a swishland", file: "songs/track-1003.mp3", artist: "tha Supreme", profile: "Emanuele", spotifyId: "7HwvPmK74MBRDhCIyMXReP", spotifyAlbum: "23 6451", spotifyDurationMs: 167000 },
    { title: "Desperado (Piano Solo)", file: "songs/track-1132.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "22yob3Jawi4xYiyfyH1VS3", spotifyAlbum: "Re Mida (Aurum)", spotifyDurationMs: 168000 },
    { title: "MAMMASTOMALE (feat. Salmo) - prod. Dade", file: "songs/track-1005.mp3", artist: "MACHETE, Gemitaiz, Izi, Salmo", profile: "Emanuele", spotifyId: "5nFX29WZIulql4m4ic0KRw", spotifyAlbum: "MACHETE MIXTAPE 4", spotifyDurationMs: 154000 },
    { title: "YOSHI (feat. tha Supreme, Fabri Fibra & Capo Plaza) - prod. Strage [Remix]", file: "songs/track-1133.mp3", artist: "MACHETE, Dani Faiv, J Balvin, tha Supreme, Fabri Fibra, Capo Plaza", profile: "Emanuele", spotifyId: "0VU34EBWTAlHVIZE3aWlZA", spotifyAlbum: "YOSHI (feat. tha Supreme, Fabri Fibra & Capo Plaza) [prod. Strage [Remix]]", spotifyDurationMs: 293000 },
    { title: "Porto Cervo", file: "songs/track-1007.mp3", artist: "Lazza", profile: "Emanuele", spotifyId: "0TAt3c8KXb1D3sWT8ENar8", spotifyAlbum: "Porto Cervo", spotifyDurationMs: 235000 },
    { title: "Rotten", file: "songs/track-1158.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "41FusdKMoGstfNPq7TXjXX", spotifyAlbum: "Suicidol", spotifyDurationMs: 238000 },
    { title: "Keanu Reeves (feat. Achille Lauro)", file: "songs/track-1009.mp3", artist: "Gemitaiz, Achille Lauro", profile: "Emanuele", spotifyId: "1MGXWglFoINJdrcp2W0U0w", spotifyAlbum: "Davide", spotifyDurationMs: 209000 },
    { title: "Il Passo (feat. Samurai Jay)", file: "songs/track-1010.mp3", artist: "MamboLosco, Nardi, Samurai Jay", profile: "Emanuele", spotifyId: "5DeyCr1ZPOLBYFwHOqn6Lv", spotifyAlbum: "Il Passo (feat. Samurai Jay)", spotifyDurationMs: 165000 },
    { title: "Nena (feat. Geolier & Andry The Hitmaker)", file: "songs/track-1011.mp3", artist: "Boro, Geolier, Andry The Hitmaker", profile: "Emanuele", spotifyId: "6TEPwGCSq4XGWu3hnZkC5m", spotifyAlbum: "Nena (feat. Geolier & Andry The Hitmaker)", spotifyDurationMs: 149000 },
    { title: "Cioilflow (feat. Salmo) - prod. Strage", file: "songs/track-1012.mp3", artist: "Dani Faiv, Salmo", profile: "Emanuele", spotifyId: "5ChFLb70vqPgcH5zRbQ6h3", spotifyAlbum: "Cioilflow (feat. Salmo) [prod. Strage]", spotifyDurationMs: 186000 },
    { title: "Twerk (con Boro)", file: "songs/track-1134.mp3", artist: "MamboLosco, Boro", profile: "Emanuele", spotifyId: "4jiCUUfjuJoG03gnw3jj1r", spotifyAlbum: "Arte", spotifyDurationMs: 152000 },
    { title: "In peggio - prod. Strage", file: "songs/track-1013.mp3", artist: "Dani Faiv", profile: "Emanuele", spotifyId: "1ebQQD5Ws1eog2GRD5Zkpg", spotifyAlbum: "In peggio (prod. Strage)", spotifyDurationMs: 164000 },
    { title: "GarbAge - prod. Strage & STABBER", file: "songs/track-1014.mp3", artist: "Nitro", profile: "Emanuele", spotifyId: "4zZ1KLUmzKY3rqlOlq68hW", spotifyAlbum: "GarbAge", spotifyDurationMs: 197000 },
    { title: "Rozzi", file: "songs/track-1135.mp3", artist: "Paky", profile: "Emanuele", spotifyId: "3Y00k9cPoW8BnJesUEFoWn", spotifyAlbum: "Rozzi", spotifyDurationMs: 163000 },
    { title: "FIGHT! (feat. Nayt)", file: "songs/track-1015.mp3", artist: "Il Tre, nayt", profile: "Emanuele", spotifyId: "3NiLpavKgcemrAlBKX275X", spotifyAlbum: "FIGHT! (feat. Nayt)", spotifyDurationMs: 168000 },
    { title: "90MIN", file: "songs/track-444.mp3", artist: "Salmo", profile: "Emanuele", spotifyId: "3Ls9yKzshQye18Tx2AvOb6", spotifyAlbum: "Playlist", spotifyDurationMs: 231000 },
    { title: "Mademoiselle", file: "songs/track-1016.mp3", artist: "Sfera Ebbasta", profile: "Emanuele", spotifyId: "2aPnpV1hT7l3eP10uSGK6c", spotifyAlbum: "Mademoiselle", spotifyDurationMs: 189000 },
    { title: "Lento", file: "songs/track-1017.mp3", artist: "Boro, Don Joe, MamboLosco", profile: "Emanuele", spotifyId: "0iRKVjfQzpr41T3WsU7shl", spotifyAlbum: "Lento", spotifyDurationMs: 162000 },
    { title: "Rollercoaster", file: "songs/track-1018.mp3", artist: "Emis Killa, Don Joe", profile: "Emanuele", spotifyId: "2Qe5XpRwGHFmMkZim0gRye", spotifyAlbum: "Rollercoaster", spotifyDurationMs: 207000 },
    { title: "Ti volevo dedicare (feat. J-AX & Boomdabash)", file: "songs/track-1019.mp3", artist: "Rocco Hunt, J-AX, Boomdabash", profile: "Emanuele", spotifyId: "00GxbkrW4m1Tac5xySEJ4M", spotifyAlbum: "Libertà", spotifyDurationMs: 208000 },
    { title: "Calipso (with Dardust) (feat. Sfera Ebbasta, Mahmood & Fabri Fibra)", file: "songs/track-1020.mp3", artist: "Charlie Charles, Sfera Ebbasta, Mahmood, Fabri Fibra", profile: "Emanuele", spotifyId: "45zJRuzK9e6AO527NOW7Fy", spotifyAlbum: "Calipso (with Dardust) (feat. Sfera Ebbasta, Mahmood & Fabri Fibra)", spotifyDurationMs: 190000 },
    { title: "Ostia Lido", file: "songs/track-1189.mp3", artist: "J-AX", profile: "Emanuele", spotifyId: "2J9TGb5CRT4omfAgnKmXn5", spotifyAlbum: "Ostia Lido", spotifyDurationMs: 172000 },
    { title: "Una volta ancora (feat. Ana Mena)", file: "songs/track-1022.mp3", artist: "Fred De Palma, Ana Mena", profile: "Emanuele", spotifyId: "6gaeewGjNiQhWOUkWRSLTa", spotifyAlbum: "Uebe", spotifyDurationMs: 174000 },
    { title: "Good Times", file: "songs/track-1023.mp3", artist: "Ghali", profile: "Emanuele", spotifyId: "6GpvHaqp0Yybx9P6YnodRD", spotifyAlbum: "DNA", spotifyDurationMs: 163000 },
    { title: "Veleno 8", file: "songs/track-1159.mp3", artist: "Canesecco", profile: "Emanuele", spotifyId: "3WX0wDniCCSSvQYkhO33fZ", spotifyAlbum: "Veleno 8", spotifyDurationMs: 176000 },
    { title: "SAD!", file: "songs/track-1136.mp3", artist: "XXXTENTACION", profile: "Emanuele", spotifyId: "3ee8Jmje8o58CHK66QrVC2", spotifyAlbum: "?", spotifyDurationMs: 166000 },
    { title: "rockstar (feat. 21 Savage)", file: "songs/track-1137.mp3", artist: "Post Malone, 21 Savage", profile: "Emanuele", spotifyId: "0e7ipj03S05BNilyu5bRzt", spotifyAlbum: "beerbongs & bentleys", spotifyDurationMs: 218000 },
    { title: "Cracovia, Pt. 3", file: "songs/track-360.mp3", artist: "Il Tre", profile: "Emanuele", spotifyId: "18dt6tNw8hpNUdthOJf0lI", spotifyAlbum: "Cracovia, Pt. 3", spotifyDurationMs: 174000 },
    { title: "Veleno 7", file: "songs/track-1138.mp3", artist: "Gemitaiz, MadMan", profile: "Emanuele", spotifyId: "2jkIbZ43eH3rM1yro2Ojzh", spotifyAlbum: "Scatola Nera", spotifyDurationMs: 173000 },
    { title: "Fuori E Dentro (feat. thasup)", file: "songs/track-1178.mp3", artist: "Gemitaiz, MadMan, tha Supreme", profile: "Emanuele", spotifyId: "34UHhwlly3SHryWuVfMOJm", spotifyAlbum: "Scatola Nera", spotifyDurationMs: 170000 },
    { title: "Bolla Papale Freestyle", file: "songs/track-1142.mp3", artist: "MadMan", profile: "Emanuele", spotifyId: "5wAArpW8e8QelgrJ8QyY3E", spotifyAlbum: "MM Vol. 2", spotifyDurationMs: 126000 },
    { title: "Gli occhi della tigre", file: "songs/track-1179.mp3", artist: "nayt, 3D", profile: "Emanuele", spotifyId: "0eczHniJguffShMNltOqMo", spotifyAlbum: "Raptus 3", spotifyDurationMs: 166000 },
    { title: "Veleno 6", file: "songs/track-1024.mp3", artist: "MadMan, Gemitaiz", profile: "Emanuele", spotifyId: "7GfXjqXD9aBvDoBdZ7EwPH", spotifyAlbum: "MM Vol. 2", spotifyDurationMs: 205000 },
    { title: "Fenomeno", file: "songs/track-1195.mp3", artist: "Fabri Fibra", profile: "Emanuele", spotifyId: "6F0xxEWmHIiC9Qnij5hVCr", spotifyAlbum: "Fenomeno", spotifyDurationMs: 199000 },
    { title: "Che Ne Sanno I 2000 (feat. Danti)", file: "songs/track-1139.mp3", artist: "Gabry Ponte, Danti", profile: "Emanuele", spotifyId: "4KxShgbINUXGOEzHORBvYA", spotifyAlbum: "Che Ne Sanno I 2000 (feat. Danti)", spotifyDurationMs: 234000 },
    { title: "Nera", file: "songs/track-1026.mp3", artist: "Irama", profile: "Emanuele", spotifyId: "6Lc0La3OwOmAouQjbID4uX", spotifyAlbum: "Plume", spotifyDurationMs: 174000 },
    { title: "Serio (feat. Capo Plaza)", file: "songs/track-1027.mp3", artist: "Emis Killa, Capo Plaza", profile: "Emanuele", spotifyId: "2Cm9pUNjLYpLo2gjIiTBPa", spotifyAlbum: "Serio", spotifyDurationMs: 218000 },
    { title: "Malibu", file: "songs/track-1180.mp3", artist: "Vegas Jones", profile: "Emanuele", spotifyId: "2uEqIGEHBfrx41k2rWnBxG", spotifyAlbum: "Malibu", spotifyDurationMs: 211000 },
    { title: "Allenamento #3", file: "songs/track-1028.mp3", artist: "Capo Plaza, AVA, Mojobeatz", profile: "Emanuele", spotifyId: "6QZqTHoe5BSdOTMllulIv1", spotifyAlbum: "Allenamento #3", spotifyDurationMs: 166000 },
    { title: "Vida Loca", file: "songs/track-926.mp3", artist: "Ye$hua", profile: "Emanuele", spotifyId: "4E5eGrcc38O3SnR9COugsX", spotifyAlbum: "Vida Loca", spotifyDurationMs: 194000 },
    { title: "Trankilo", file: "songs/track-1029.mp3", artist: "Vegas Jones, Nitro", profile: "Emanuele", spotifyId: "4hwwDxMDxwNbCyUJuI5sLa", spotifyAlbum: "Chic Nisello", spotifyDurationMs: 240000 },
    { title: "Italiana", file: "songs/track-1141.mp3", artist: "J-AX, Fedez", profile: "Emanuele", spotifyId: "0ptaq4BSl6jrXfGyLzJjYE", spotifyAlbum: "Italiana", spotifyDurationMs: 174000 },
    { title: "Cupido (feat. Quavo)", file: "songs/track-1031.mp3", artist: "Sfera Ebbasta, Quavo", profile: "Emanuele", spotifyId: "0dLToDou8YHYJpQltj3Ijy", spotifyAlbum: "Rockstar", spotifyDurationMs: 210000 },
    { title: "Sciroppo (feat. DrefGold)", file: "songs/track-1032.mp3", artist: "Sfera Ebbasta, DrefGold", profile: "Emanuele", spotifyId: "4VVG3HBGaqSNZqIpmewIA6", spotifyAlbum: "Rockstar", spotifyDurationMs: 205000 },
    { title: "Stratos", file: "songs/track-1187.mp3", artist: "Kid Yugi", profile: "Emanuele", spotifyAlbum: "Anche gli Eroi Muoiono Post Mortem" },
];

  const PALETTE = [
    "linear-gradient(135deg,#b06bff,#4fc3ff)",
    "linear-gradient(135deg,#ff7a9e,#ffb86b)",
    "linear-gradient(135deg,#37e6a6,#4fc3ff)",
    "linear-gradient(135deg,#ffb02e,#ff5c7a)"
  ];

  const $ = (id) => document.getElementById(id);
  /* L'id stabile di un brano: "b-track-12" e cosi' via.
     Ste: "quando elimino certe canzoni rimangono nella libreria".
     Il filtro dei brani eliminati guardava "b.id", ma i brani dell'app non
     hanno un campo id: l'id veniva calcolato DOPO, quando la libreria si
     costruiva. Quindi il filtro guardava "eliminati[undefined]", cioe'
     niente, e i brani eliminati tornavano sempre.

     Ora l'id si calcola in un posto solo, e lo usano sia il filtro sia la
     costruzione: cosi' le due cose non possono piu' andare storte. */
  /* ---------- SHA-256 in JavaScript puro ----------
     Serve per la sfida PKCE di Spotify quando crypto.subtle non c'e'.
     Su una pagina non sicura (http su una rete locale) il browser non
     ce lo da, e senza questo l'accesso a Spotify non parte dal computer.
     Quando invece c'e' crypto.subtle, uso quello: e' piu' veloce. */
  const _K_SHA256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function _sha256Testo( testo ) {
    /* i byte del testo, in UTF-8 */
    const messaggio = new TextEncoder().encode(String(testo || ""));
    const bit = messaggio.length * 8;
    const conCoda = new Uint8Array(((messaggio.length + 9 + 63) >> 6) << 6);
    conCoda.set(messaggio);
    conCoda[messaggio.length] = 0x80;
    const dv = new DataView(conCoda.buffer);
    dv.setUint32(conCoda.length - 4, bit >>> 0, false);
    dv.setUint32(conCoda.length - 8, Math.floor(bit / 4294967296), false);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);
    const ruota = (x, n) => (x >>> n) | (x << (32 - n));
    for (let blocco = 0; blocco < conCoda.length; blocco += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(blocco + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const s0 = ruota(w[i - 15], 7) ^ ruota(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = ruota(w[i - 2], 17) ^ ruota(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = ruota(e, 6) ^ ruota(e, 11) ^ ruota(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + _K_SHA256[i] + w[i]) >>> 0;
        const S0 = ruota(a, 2) ^ ruota(a, 13) ^ ruota(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const fuori = new Uint8Array(32);
    const dv2 = new DataView(fuori.buffer);
    for (let i = 0; i < 8; i++) dv2.setUint32(i * 4, h[i], false);
    return fuori;
  }
  /* Il codice per l'accesso a Spotify in base64-url (senza + / =) */
  function _b64url(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function _idBranoStabile(b) {
    return "b-" + String((b && b.file) || ("builtin-" + BUILTIN.indexOf(b)))
      .replace(/^.*\//, "").replace(/\.mp3$/i, "");
  }
  let _diUltimoInvio4 = 0;
  let _diUltimoInvio3 = 0;
  let _diUltimoInvio2 = 0;
  let _diUltimoInvio = 0;


  function _diCheFinale() {
    let quanti = 0;
    try { quanti = visibleTracks().length; } catch (e) { quanti = -1; }
    _diChe("FINALE: visibili " + quanti + " su " + tracks.length +
      " | nascosti " + hiddenTracks.size +
      " | soloPlaylist " + _soloInPlaylist.size +
      " | playlist " + (_playlistAttiva ? _playlistAttiva : "nessuna") +
      " | preferiti " + (favOnly ? "si" : "no") +
      " | maiascoltati " + (soloMaiAscoltati ? "si" : "no") +
      " | scaricate " + (soloScaricate ? "si" : "no") +
      " | eliminati " + (function () { try { return Object.keys(LS.get("mb.eliminati", {}) || {}).length; } catch (e) { return -1; } })() +
      " | da " + String(location.host || "?"));
  }


  function _diChe(riga) {
    try {
      const dove = String(SERVIZIO_PUBBLICA || "").trim();
      if (!dove) return;
      const ora = Date.now();
      /* Ogni tipo di riga ha il suo scomparto. Con uno solo se li
         mangiavano a vicenda: la riga "FINALE" arriva un secondo dopo
         quella della libreria e finiva sempre scartata dal limite di
         1500 millisecondi. E quella e' proprio quella che mi serve. */
      const testo = String(riga);
      /* Il limite si applica SOLO alle due righe che arrivanocontinue
         (libreria e visibili), altrimenti si mangiano a vicenda: la
         libreria gira di continuo e faceva scartare anche le righe
         sul worker, che erano proprio quelle che mi servivano. */
      if (testo.indexOf("libreria") === 0 || testo.indexOf("visibili") === 0) {
        const quale = testo.indexOf("visibili") === 0 ? 2 : 1;
        const ultima = quale === 2 ? _diUltimoInvio2 : _diUltimoInvio;
        if (ora - ultima < 1500) return;
        if (quale === 2) _diUltimoInvio2 = ora; else _diUltimoInvio = ora;
      }
      fetch(dove + "/problema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riga: testo.slice(0, 160) })
      }).catch(function () { /* senza rete pazienza */ });
    } catch (e) { /* mai bloccare l'app per una traccia */ }
  }
  const APP_NAME = "spotifynonavraiimieisoldi";
  const APP_VERSION = "6.423";

  let recovering = false;
  /* Questa "riparazione" non serve piu' e fa solo danni.
     Ste: il telefono perde i dati a ogni riavvio, e ho scoperto perche':
     questa funzione, ogni volta che si apriva l'app, cancellava TUTTE le
     cache (compresi i brani scaricati) e ricaricava la pagina. Non
     aggiustava niente di rotto: si limitava a distruggere. Gli aggiornamenti
     li fa gia' il service worker, quindi la lascio stare. */
  /* Ste: "192.168.1.40:8788/app/ non mi spunta ancora se posso solo
     ascoltare", e le tracce di Spotify non arrivavano.

     Il pulsante c'era gia' nel codice ma non nella pagina: il
     "$('btnRefresh').addEventListener" di sotto findava un pulsante che
     non esisteva, e l'errore faceva saltare TUTTO il resto del codice
     successivo. Ora il pulsante c'e' nella pagina e quel pezzo funziona.

     Quello che fa il pulsante e' scritto piu' in basso, dove era gia'. */

  async function selfHeal() {
    return;
    /* eslint-disable-next-line no-unreachable */
    if (recovering) return;
    let done = false;
    try { done = sessionStorage.getItem("mb-healed") === "1"; } catch (e) { done = false; }
    if (done) return;
    recovering = true;
    try { sessionStorage.setItem("mb-healed", "1"); } catch (e) { /* noop */ }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* noop */ }
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length) {
          await Promise.all(regs.map((r) => r.update().catch(() => {})));
        } else {
          await navigator.serviceWorker.register("sw.js");
        }
      }
    } catch (e) { /* noop */ }
    location.reload();
  }

  /* Non cancellare le cache offline a causa di un errore JavaScript generico:
     potrebbero contenere le canzoni scaricate dall'utente. Gli aggiornamenti
     vengono gestiti dal service worker e gli errori restano nella console. */
  const startedAt = Date.now();
  window.addEventListener("error", (event) => {
    if (Date.now() - startedAt < 8000) {
      console.warn("Errore durante l'avvio di Music Box; le cache offline sono state conservate.",
        event && event.message ? event.message : "");
    }
    /* Ste: "ancora non va comunque". Se un errore capita mentre il pannello
       di Spotify e' aperto, lo scrivo DENTRO il pannello: altrimenti la
       pagina resta ferma su una frase di mezzo e sembra che l'app sia
       morta, mentre io non vedo niente. */
    try {
      const p = $("spotifyPanel");
      const c = $("spotifyCorpo");
      if (p && !p.hidden && c) {
        c.textContent = "Qualcosa e' andato storto: " +
          String((event && event.message) || "errore sconosciuto");
      }
    } catch (e) { /* noop */ }
  });
  const searchEl = $("search");
  const playlistEl = $("playlist");
  const emptyEl = $("empty");
  const fileInput = $("fileInput");

  let audio = null;
/* Quando la pagina e' andata in secondo piano, e quando e' tornata visibile.
   Servono entrambe: la pausa che fa il sistema arriva mentre l'app e' in
   secondo piano, OPPURE esattamente nell'istante in cui la riapri. Bastava
   guardare solo la prima, e infatti funzionava solo se tornavi subito. */
let _nascostoIl = 0;
let _visibileIl = 0;
/* Ste: "dopo 6 ore si resetta la canzone, non riparte da quel punto".
   La posizione veniva salvata ogni 3 secondi mentre suona, ma se l'app resta
   ferma in secondo piano (o il telefono la butta via) l'ultimo salvataggio puo'
   non arrivare mai: al ritorno la posizione risulta 0 e la canzone riparte
   dall'inizio. Salvo quindi la posizione esattamente quando l'app va in
   fondo, che e' l'ultimo momento in cui sono ancora in tempo. */
try {
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    _nascostoIl = Date.now();
    try { savePos(); } catch (e) { /* noop */ }
    /* Mandare i minuti anche quando l'app va in secondo piano: se no,
       gli ultimi minuti di una sessione restano solo qui e il computer non
       li vede mai. */
    try { _salvaStatistiche(); } catch (e) { /* noop */ }
    try { _salvaStatoCondiviso(); } catch (e) { /* noop */ }
    _segna("app nel secondo piano", "salvo la posizione a " +
    Math.round((audio && audio.currentTime) || 0) + "s");
    /* Teniamo la notifica visibile anche in background. */
    try { updateMediaSession(); setPlaybackState(audio && !audio.paused ? "playing" : "paused"); } catch (e) { /* noop */ }
  } else {
    _visibileIl = Date.now();
    _segna("tornato in primo piano");
  }
});
} catch (e) { /* noop */ }
/* Su alcuni telefoni la pagina viene "congelata": arriva questo evento invece
   del visibilitychange, e senza salvare qui perdiamo la posizione. */
try {
  document.addEventListener("freeze", () => {
    try { savePos(); } catch (e) { /* noop */ }
    _segna("pagina congelata dal sistema, salvo la posizione");
  });
} catch (e) { /* noop */ }
  let tracks = [];
  let currentId = null;
  let shuffle = false;
  let repeat = false;
  let query = "";
  let favorites = new Set();
  let favOnly = false;
  /* Filtro "solo quelli che non ho ancora ascoltato": comodo per dare una
     prima ascolto a tutto quello che ho scaricato e non ho mai sentito. */
  let soloMaiAscoltati = false;
  /* Filtro "solo le canzoni scaricate": quelle che sono gia' sul telefono e
     quindi suonano anche senza rete. */
  let soloScaricate = false;
  let hiddenTracks = new Set();
/* Le playlist vivono qui con gli altri dati dello schermo, NON piu' in
   basso: prima erano dichiarate dopo le funzioni che le usano, e se una
   di quelle veniva chiamata presto l'app partiva a meta' e la libreria
   risultava vuota (l'ho visto succedere dal telefono). */
let playlists = [];
  /* Numeri della libreria, per il registro: cosi' capisco cosa manca senza
     dover chiedere uno screenshot. */
  let _numeriGiaInviati = false;
  let _ultimiDuplicati = 0;
  let _ultimiSenzaFile = 0;
  /* Come e' ordinata la libreria. Di default per artista, cosi' i brani dello
     stesso artista stanno di fila; si ricorda la scelta per ogni dispositivo. */
  let ordinamento = "artista";
  let scrubbing = false;
  let pendingSeek = null;
  let lastSave = 0;
  let resumeAt = 0;
  let queue = [];
  /* Ste: "quando c'e' la riproduzione casuale e torno indietro non mi torna
     alla canzone precedente ma ad un'altra canzone casuale".
     Il motivo: con il casuale acceso la canzone che suona e' stata scelta a
     caso, quindi "il brano prima" calcolato sull'elenco era uno qualsiasi.
     Qui tengo la cronologia di cosa ho davvero ascoltato, e "indietro" la
     percorre: e' quello che fanno tutti i riproduttori. */
  let _storico = [];
  const _STORICO_MAX = 60;
  function _ricordaBrano(id) {
    if (!id) return;
    const i = _storico.lastIndexOf(id);
    if (i >= 0) _storico.splice(i, 1);
    _storico.push(id);
    if (_storico.length > _STORICO_MAX) _storico.splice(0, _storico.length - _STORICO_MAX);
    /* Ste: "il tasto indietro col casuale mi porta ad un'altra canzone".
       La cronologia stava solo in memoria: la pagina si ricarica spesso (gli
       aggiornamenti, la chiusura del telefono) e a ogni ricarica partivamo da
       zero, quindi "indietro" non trovava niente e tornava al brano
       dell'elenco, che col casuale e' uno a caso. Ora la tengo sul telefono. */
    try { LS.set("mb.storico", _storico.slice(-_STORICO_MAX)); } catch (e) { /* noop */ }
  }
  /* Il brano da cui tornare indietro: prendo l'ultimo della cronologia che
     non sia quello che sta suonando adesso. */
  function _storicoPrecedente() {
    for (let i = _storico.length - 1; i >= 0; i--) {
      if (_storico[i] !== currentId) return _storico[i];
    }
    return "";
  }
  function _caricaStorico() {
    try {
      const v = LS.get("mb.storico", []);
      _storico = Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(-_STORICO_MAX) : [];
    } catch (e) { _storico = []; }
  }
  let suppressClick = false;
  let swReg = null;

  /* I profili: ognuno ha la sua libreria e la sua cartella di mp3 sul PC.
     Prima erano due fissi (Ste ed Emanuele); ora l'elenco e' una lista, cosi'
     aggiungere un profilo e' una riga e basta. */
const PROFILI = [
      { nome: "Ste", cartella: "ste" },
      { nome: "Emanuele", cartella: "emanuela" },
      { nome: "Ari", cartella: "ari" },
      { nome: "Diego", cartella: "diego" },
  { nome: "Francesco", cartella: "francesco" }
    ];
  const DEFAULT_PROFILE = PROFILI[0].nome;
  /* Il tasto semplice "Scarica l'mp3 col PC" adesso salva anche una copia
     nella cartella del profilo: cosi' il brano finisce nella libreria
     condivisa e si vede anche dagli altri dispositivi. Prima restava solo in
     questo browser, e per questo si vedevano numeri diversi su PC e telefono. */
  const CARTELLA_PREDEFINITA = PROFILI[0].cartella;
  let profile = DEFAULT_PROFILE;
  /* ---------- Dove stanno i file mp3 ----------
     I brani NON stanno piu' dentro il sito: ci stanno in un deposito
     separato (music-box-brani). Motivo: dentro il sito facevano 200 MB e
     GitHub non riusciva piu' a costruire la pagina (ci ho messo due ore e
     poi falliva). Fuori dal sito la pagina pesa mezzo megabyte e si
     aggiorna in un minuto.

     La pagina che apri dal computer (quella locale) invece continua a
     leggere i brani dal disco, perche' li ha gia' li'. */
  const BRANI_ONLINE = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/";
  /* Ste: i brani delle playlist "gym" suonano con i bassi gia' alzati.
     Le versioni con i bassi le prepara il computer (music-auto/prepara-bassi-gym.mjs)
     e stanno nella cartella "songs/bassi" del deposito dei brani. */
  /* I brani potenziati (bassi piu' pieni, voce avanti, volume piu' forte):
     l'elenco lo scrive il computer. */
  let _potenziati = new Set();
  let _potenziatiCaricati = false;

  function _nomeFileBrano(file) {
    return String(file || "").replace(/^.*\//, "");
  }

  function _ePotenziato(file) {
    try {
      if (!_potenziati.size) return false;
      return _potenziati.has(_nomeFileBrano(file));
    } catch (e) { return false; }
  }

  async function _caricaElencoPotenziati() {
    try {
      if (typeof BRANI_ONLINE !== "string" || !BRANI_ONLINE) return;
      const r = await fetch(BRANI_ONLINE + "songs/bassi/elenco.json", { cache: "no-cache" });
      if (!r.ok) return;
      const d = await r.json();
      const lista = d && Array.isArray(d.brani) ? d.brani : [];
      if (!lista.length) return;
      _potenziati = new Set(lista.map((x) => String(x || "")));
      _potenziatiCaricati = true;
      try { render(); } catch (e) { }
    } catch (e) { /* senza rete: niente contrassegno, ma la musica va lo stesso */ }
  }

  /* Quale file suonare per questo brano: quello potenziato se il brano sta
     in una playlist "gym" e il file potenziato c'e', altrimenti l'originale.
     Si calcola ADESSO (non quando la libreria e' stata costruita): le
     playlist arrivano dal servizio dopo, e prima l'app non sapeva ancora
     quali brani sono della gym -> usava sempre l'originale. */
  function _urlDelBrano(t) {
    try {
      if (t && t.file && _potenziatiCaricati && _branoInGym(t.id) && _ePotenziato(t.file)) {
        return _doveStaIlBranoConBassi(t.file);
      }
    } catch (e) { }
    return (t && t.url) || "";
  }

  function _branoInGym(idBrano) {
    try {
      const pl = _playlistCercata("gym");
      if (!pl || !pl.tracks || !pl.tracks.length) return false;
      return pl.tracks.indexOf(String(idBrano)) >= 0;
    } catch (e) { return false; }
  }

  function _doveStaIlBranoConBassi(file) {
    const nome = String(file || "");
    if (!nome) return "";
    const soloNome = nome.replace(/^.*\//, "");
    const qui = location.hostname;
    const inLocale = qui === "localhost" || qui === "127.0.0.1" || qui === "::1" ||
      qui.endsWith(".local") || /^100\./.test(qui) || qui.endsWith(".ts.net") ||
      /* La rete di casa: quando il telefono e' sul WiFi di casa (192.168.x)
         i brani arrivano dal computer, che e' veloce, invece che da
         internet: prima non lo riconoscevo e le canzoni ci mettevano un
         sacco ad avviarsi. */
      /^192\.168\./.test(qui) || /^10\./.test(qui) || /^172\.(1[6-9]|2\d|3[01])\./.test(qui);
    if (inLocale) return "songs/bassi/" + soloNome;
    return BRANI_ONLINE + "songs/bassi/" + soloNome;
  }

  /* Il collegamento veloce: se l'app e' stata aperta dal computer di casa,
     i brani si prendono da li' (600 MB/s) invece che da internet (2,8 MB/s).
     Ste: "e' normale che ci stanno tanto tempo per scaricarsi pure con la
     connessione di casa?". */
  function _collegamentoDiCasa() {
    try {
      const o = String(LS.get("mb.collegamentoCasa", "") || "").trim();
      if (!o) return "";
      if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[?::1\]?|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(o)) return "";
      return o;
    } catch (e) { return ""; }
  }

  /* Se l'app e' aperta su un indirizzo del computer di casa, me lo ricordo:
     cosi' anche aperta dopo dal link di GitHub i brani arrivano veloci. */
  function _ricordaCollegamentoDiCasa() {
    try {
      const o = String(location.origin || "");
      if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[?::1\]?|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(o)) return;
      if (LS.get("mb.collegamentoCasa", "") === o) return;
      LS.set("mb.collegamentoCasa", o);
      /* Adesso che so del collegamento di casa ricalcolo gli indirizzi di
         tutti i brani: prima puntavano tutti a internet. */
      try { _ricalcolaIndirizzi(); } catch (e) { }
    } catch (e) { }
  }

  /* Ricalcola l'indirizzo di ogni brano (e ridisegna). */
  function _ricalcolaIndirizzi() {
    try {
      for (const t of tracks) {
        if (t && t.file) t.url = _doveStaIlBrano(t.file);
      }
      try { render(); } catch (e) { }
    } catch (e) { }
  }

  function _doveStaIlBrano(file) {
    const nome = String(file || "");
    if (!nome) return "";
    /* pagina locale: i brani sono sul disco, nessun bisogno di andare online */
    const qui = location.hostname;
    const inLocale = qui === "localhost" || qui === "127.0.0.1" || qui === "::1" ||
      qui.endsWith(".local") || /^100\./.test(qui) || qui.endsWith(".ts.net") ||
      /* La rete di casa: quando il telefono e' sul WiFi di casa (192.168.x)
         i brani arrivano dal computer, che e' veloce, invece che da
         internet: prima non lo riconoscevo e le canzoni ci mettevano un
         sacco ad avviarsi. */
      /^192\.168\./.test(qui) || /^10\./.test(qui) || /^172\.(1[6-9]|2\d|3[01])\./.test(qui);
    if (inLocale) return nome;
    /* L'app aperta dal link di GitHub, ma il computer di casa e' vicino:
       i brani li prendo da li', che e' 220 volte piu' veloce. */
    try {
      const casa = _collegamentoDiCasa();
      if (casa && casa !== location.origin) {
        const mio = String(location.origin || "");
        const giaLocale = /^https?:\/\/(127\.0\.0\.1|localhost|\[?::1\]?|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(mio);
        if (!giaLocale && /^\d{1,3}(\.\d{1,3}){3}/.test(casa)) {
          return casa + "/app/" + nome.replace(/^\/+/, "");
        }
      }
    } catch (e) { }
    /* online: prendo il brano dal deposito della musica.
       ATTENZIONE: qui il nome va tenuto COME E', con la cartella
       "songs/". Prima facevo .replace(/^.*\//, "") che si mangiava la
       cartella, e l'app chiedeva "track-1.mp3" invece di
       "songs/track-1.mp3": il brano non partiva (404) e sembrava che
       l'app fosse rotta. */
    return BRANI_ONLINE + nome.replace(/^\/+/, "");
  }

  let profiles = [DEFAULT_PROFILE];

/* Lo stato dei profili sta in memoria finche' la pagina e' aperta.

     Prima ogni volta rileggevo localStorage e riconvertivo il JSON: a ogni
     chiamata nasceva un oggetto NUOVO. Quindi quando le statistiche
     aggiungevano un secondo, lo scrivevano su un oggetto che un attimo dopo
     spariva: i secondi non venivano mai salvati e sul telefono il numero
     restava sempre a zero. */
let _statoInMemoria = null;

function allState() {
  if (!_statoInMemoria) _statoInMemoria = LS.get("mb.state", {}) || {};
  return _statoInMemoria;
}

function saveAllState(next) {
  _statoInMemoria = next || {};
  LS.set("mb.state", _statoInMemoria);
}

function profileState(name) {
  const all = allState();
  if (!all[name] || typeof all[name] !== "object") {
    all[name] = { hidden: [], favs: [], last: null, time: 0 };
  }
  return all[name];
}

/* Quando salvo un profilo riparto sempre da quello che c'e' ADESSO sul
     disco, non da quello che avevo in memoria. Serve per quando la app e'
     aperta in due finestre: se nell'una metti un preferito e nell'altra
     un brano nascosto, prima una delle due modifiche spariva (l'ultima
     scrittura copriva l'altra). */
function writeProfileState(name, patch) {
  let fresco = {};
  try { fresco = LS.get("mb.state", {}) || {}; } catch (e) { fresco = {}; }
  /* se questo profilo non esiste ancora parto da uno vuoto pulito, non dalla
     copia in memoria: altrimenti un profilo nuovo si porterebbe dietro
     campi vecchi di un altro */
  const base = (fresco[name] && typeof fresco[name] === "object") ? fresco[name] : {};
  fresco[name] = Object.assign({}, base, patch);
  saveAllState(fresco);
}

/* Se un'altra finestra cambia qualcosa, me ne accorgo e rileggo: altrimenti
   resterei con i dati vecchi in memoria. */
window.addEventListener("storage", (e) => {
  if (e && e.key && e.key !== "mb.state") return;
  _statoInMemoria = null;
  /* puo' arrivare mentre la pagina si sta ancora montando: non deve
     interrompere niente, quindi ogni parte va protetta */
  try { loadProfileState(); } catch (x) { /* noop */ }
  try { _aggiornaBadgeFalliti(); } catch (x) { /* noop */ }
  try { render(); } catch (x) { /* noop */ }
});

  function loadProfileState() {
    const st = profileState(profile);
    /* Ste: "togli completamente sta cosa dei nascosti". Non esiste piu'
       la lista dei brani nascosti: un brano si toglie con "Elimina", che
       chiede conferma e lo cancella per sempre. Qui non carico piu'
       niente, e cosi' ogni filtro basato sui nascosti diventa inutile. */
    hiddenTracks = new Set();
    favorites = new Set(st.favs || []);
    /* Le playlist stanno qui con il resto. Se il dato non e' un elenco
       (perche' viene da una versione vecchia), parto da vuoto invece di
       farmi fermare. */
    playlists = Array.isArray(st.playlists) ? st.playlists : [];
    return st;
  }

  function saveCurrentState() {
    /* Ste: "togli completamente sta cosa dei nascosti": qui non si
       salvano piu' i brani nascosti. */
    writeProfileState(profile, {
      favs: Array.from(favorites),
      playlists: Array.isArray(playlists) ? playlists : []
    });
  }

  const LS = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* noop */ }
    },
    remove(k) {
      try { localStorage.removeItem(k); } catch (e) { /* noop */ }
    }
  };

  let lyricsData = {};
  let coversData = {};
  let spotifyCoversData = {}; /* Copertine per ID Spotify univoco. */
  let localLyrics = {};
  let lyricLines = [];
  let lyricActive = -1;
  let lyricsUserScrollAt = 0;

  let db = null;
  const DB_NAME = "musicbox";
  const DB_STORE = "tracks";
  const DB_IMPORTS = "imports";
  const DB_LYRICS = "lyrics";
  /* Le copertine che trovo dal browser le tengo qui, per brano.
     Serve per i brani della libreria condivisa: quelle copertine le puo'
     correggere solo il computer che le ha scaricate (covers.json), quindi
     se manca una copertina la cerco io e me la segno qui sul dispositivo. */
  const DB_COVERS = "copertine";
  /* I nomi dei brani che Ste ha cambiato.
     Ste: "se cambio l'artista e riavvio il sito torna di prima". Con la
     finestra Diagnostica si e' visto che sul suo telefono la memoria del
     browser si svuota da sola al riavvio: il nome c'era subito dopo averlo
     cambiato, al riavvio era sparito. Percio' i nomi li tengo qui, dentro il
     database dei brani, che ha gia' tenuto le copertine e i testi senza
     perderne nessuno.

     NOTA importante: NON ho creato un magazzino nuovo e NON ho cambiato la
     versione del database. Prima l'avevo fatto (un "rinomini" nuovo, versione
     da 4 a 5) ed e' stato un errore: se sul telefono e' rimasta aperta la
     vecchia pagina, quella blocca l'aggiornamento del database, la nuova
     connessione resta appesa e i nomi non vengono scritti mai. Per questo il
     nome lo metto in un magazzino che esiste gia', senza toccare nulla. */
  const _ID_RINOMI = "__rinomini__";
  const DB_VERSION = 4;

  /* ---------- IndexedDB ---------- */
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DB_STORE)) {
          req.result.createObjectStore(DB_STORE, { keyPath: "id" });
        }
        if (!req.result.objectStoreNames.contains(DB_IMPORTS)) {
          req.result.createObjectStore(DB_IMPORTS, { keyPath: "id" });
        }
    if (!req.result.objectStoreNames.contains(DB_LYRICS)) {
      req.result.createObjectStore(DB_LYRICS, { keyPath: "id" });
    }
    if (!req.result.objectStoreNames.contains(DB_COVERS)) {
      req.result.createObjectStore(DB_COVERS, { keyPath: "id" });
      }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbPut(rec) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(rec);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbGet(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function dbDel(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function dbSetImport(rec) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_IMPORTS, "readwrite");
      tx.objectStore(DB_IMPORTS).put(rec);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbDelImport(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_IMPORTS, "readwrite");
      tx.objectStore(DB_IMPORTS).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function dbAllLyrics() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_LYRICS, "readonly");
      const req = tx.objectStore(DB_LYRICS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function dbPutLyrics(rec) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_LYRICS, "readwrite");
    tx.objectStore(DB_LYRICS).put(rec);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  }

  /* Copertine trovate dal browser, per brano della libreria condivisa. */
  function dbAllCover() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_COVERS, "readonly");
    const req = tx.objectStore(DB_COVERS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  }

  function dbPutCover(rec) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_COVERS, "readwrite");
    tx.objectStore(DB_COVERS).put(rec);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  }

  /* ---------- Caricamento tracce ---------- */
  /* ---------- Rinominare un brano tenendo premesso ----------
     Il nome nuovo lo tengo da parte per dispositivo, senza toccare la
     libreria sul PC: e' il modo meno invasivo e funziona anche per i brani
     che vengono dal sito (che non posso modificare li'). */
  let editId = null;

  function nomiRinomati() {
    try {
      return LS.get("mb.rinomini", {}) || {};
    } catch (e) {
      return {};
    }
  }

  function applicaRinomina(t) {
    const mappa = nomiRinomati();
    const r = mappa[t.id];
    /* Ste: "se cambio l'artista e riavvio torna come prima".
       Prima, quando il brano NON aveva una rinomina, la funzione usciva
       subito e lasciava il nome com'era: pero' il nome era gia' stato
       cambiato in quel momento della sessione, quindi togliere una rinomina
       non faceva tornare indietro nulla fino al riavvio. Ora, se non c'e' una
       rinomina, ripristino il nome vero del brano, come fa la versione che
       lavora su tutta la lista. */
    if (!r || (!r.title && !r.artist)) {
      const orig = _originaleDi(t.id);
      if (orig) {
        if (orig.title) t.title = orig.title;
        if (orig.artist) t.artist = orig.artist;
      }
      return t;
    }
    if (r.title) t.title = r.title;
    if (r.artist) t.artist = r.artist;
    return t;
  }

/* Il nome vero di un brano della libreria condivisa. L'id del brano e'
     "b-" + nome del file, quindi lo riprendo da li'. Serve quando si toglie
     una rinomina: senza questo il nome restava quello cambiato fino a
     ricaricare la pagina. */
function _originaleDi(id) {
  try {
    if (typeof id !== "string" || id.indexOf("b-") !== 0) return null;
    const file = id.slice(2) + ".mp3";
    for (const b of BUILTIN) {
      if (String(b.file || "").replace(/^.*\//, "") === file) return b;
    }
  } catch (e) { /* noop */ }
  return null;
  }

  function applicaRinomine() {
  const mappa = nomiRinomati();
  for (const t of tracks) {
    const r = mappa[t.id];
    if (r && (r.title || r.artist)) {
      if (r.title) t.title = r.title;
      if (r.artist) t.artist = r.artist;
      continue;
    }
    /* nessuna rinomina attiva: torna al nome vero */
    const orig = _originaleDi(t.id);
    if (orig) {
      t.title = orig.title || t.title;
      t.artist = orig.artist || t.artist || "";
    }
  }
  }

  /* Il posto dove i nomi vengono tenuti davvero.
     Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
     Sul suo telefono la memoria del browser (localStorage) non sopravvive: il
     nome sparisce e al riavvio il brano torna col nome vero. Perche' succede?
     Perche' il telefono non riesce a salvare niente da nessuna parte: il
     computer non e' raggiungibile (l'app non vede piu' la rete di casa) e
     l'altro servizio richiede una chiave che non e' stata messa.

     Per questo tengo i nomi anche in IndexedDB, che sul telefono e' molto piu'
     resistente della memoria del browser, e li rileggo da li' all'avvio.
     In pratica il nome non dipende piu' dalla rete. */
  /* Ste: "se cambio l'artista e riavvio il sito torna di prima". Con la
     finestra Diagnostica si e' visto che sul suo telefono la memoria del
     browser si svuota da sola al riavvio: il nome c'era subito dopo averlo
     cambiato, al riavvio era sparito. Quindi non mi fido piu' di lei.

     I nomi li tengo nel database dei brani, lo stesso dove gia' stanno le
     copertine e i testi: e' un posto che ha gia' tenuto i dati di Ste senza
     perdere niente, quindi regge anche lui. */
  async function _salvaRinomineSulDisco(mappa) {
    try {
      const d = db || await openDB();
      if (!d) return false;
      db = d;
      return await new Promise((fatto) => {
        try {
          /* Uso il magazzino dei testi, che esiste gia': non creo niente di
             nuovo e non cambio la versione del database, cosi' niente puo'
             bloccarsi. L'id e' un nome riservato, nessun brano puo' chiamarsi
             cosi', quindi non si confonde con niente. */
          const tx = d.transaction(DB_LYRICS, "readwrite");
          tx.objectStore(DB_LYRICS).put({ id: _ID_RINOMI, mappa: JSON.parse(JSON.stringify(mappa)) });
          tx.oncomplete = () => fatto(true);
          tx.onerror = () => fatto(false);
        } catch (e) { fatto(false); }
      });
    } catch (e) { return false; }
  }
  async function _leggiRinomineDalDisco() {
    try {
      const d = db || await openDB();
      if (!d) return null;
      db = d;
      return await new Promise((fatto) => {
        try {
          const tx = d.transaction(DB_LYRICS, "readonly");
          const chiedi = tx.objectStore(DB_LYRICS).get(_ID_RINOMI);
          chiedi.onsuccess = () => fatto((chiedi.result && chiedi.result.mappa) || null);
          chiedi.onerror = () => fatto(null);
        } catch (e) { fatto(null); }
      });
    } catch (e) { return null; }
  }
  /* Se la memoria del browser e' vuota ma sul disco ci sono dei nomi, li
     rimetto: e' il salvataggio che finora non c'era. */
  async function _ripristinaRinomini() {
    /* Ste: "se cambio l'artista e riavvio il sito torna di prima".
       Nella memoria del browser i nomi spariscono, quindi vanno cercati nel
       database. Se per un motivo non rispondono al primo tentativo (il
       telefono all'avvio e' lento e il database si apre dopo), riprovo qualche
       volta prima di darmi per perso: il nome rientra nella libreria senza che
       Ste debba toccare nulla. */
    for (let tentativo = 0; tentativo < 4; tentativo++) {
      try {
        const dalDisco = await _leggiRinomineDalDisco();
        if (dalDisco && typeof dalDisco === "object") {
          const mappa = nomiRinomati();
          let rimessi = 0;
          for (const k of Object.keys(dalDisco)) {
            const r = dalDisco[k];
            if (!r || (!r.title && !r.artist)) continue;
            const mia = mappa[k];
            if (!mia || mia.title !== (r.title || "") || mia.artist !== (r.artist || "")) {
              mappa[k] = { title: String(r.title || ""), artist: String(r.artist || "") };
              rimessi++;
            }
          }
          if (rimessi) { LS.set("mb.rinomini", mappa); return rimessi; }
          /* Niente da rimettere puo' voler dire due cose: che i nomi ci
             sono gia' (e va bene) oppure che il database e' ancora vuoto. In
             questo caso riprovo piu' tardi, perche' al primo colpo la pagina
             appena aperta spesso non trova niente. */
          if (tentativo === 0) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          return 0;
        }
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    return 0;
  }

  /* La diagnostica.
     Ste: "se cambio l'artista e riavvio il sito torna di prima". Per un pezzo
     non si capiva se il nome si perdeva nel telefono, sul sito o nel computer,
     e ogni volta che provavo a correggere tiravo fuori una supposizione.
     Questa finestra non indovina nulla: guarda davvero dove sono i dati e te
     li mostra. */
  async function _rigaDiagnostica(b) {
    let classe = "diag-ok", testo = "no";
    try {
      const v = await b();
      if (v && v.ok) { testo = v.s; classe = v.no ? "diag-no" : "diag-ok"; }
      else { testo = (v && v.s) || "no"; classe = "diag-no"; }
    } catch (e) { testo = "errore"; classe = "diag-no"; }
    return '<div class="diag-riga"><b>' + b.nome + '</b><span class="' + classe + '">' + testo + "</span></div>";
  }
  /* ---------- Registro degli eventi ----------

   Ste: "si stoppa ancora", e ormai sono cinque tentativi a indovinare. Invece
   di tirare a indovino registro quello che SUCCEDE, con l'orario, e lo
   mostro nel pannello diagnostica cosi' si legge la verita'.

   Non e' roba che lascia traccia fuori dal telefono: resta in memoria e nel
   browser, e sparisce al prossimo avvio pulito. */
let _registro = [];
function _segna(evento, dettaglio) {
  try {
    const ora = new Date();
    const hh = String(ora.getHours()).padStart(2, "0");
    const mm = String(ora.getMinutes()).padStart(2, "0");
    const ss = String(ora.getSeconds()).padStart(2, "0");
    _registro.push(hh + ":" + mm + ":" + ss + "  " + evento + (dettaglio ? " — " + dettaglio : ""));
    if (_registro.length > 60) _registro.splice(0, _registro.length - 60);
  } catch (e) { /* noop */ }
}

async function _apriDiagnostica() {
    const corpo = $("diagBody");
    const sopra = $("diagOverlay");
    if (!corpo || !sopra) return;
    sopra.hidden = false;
    corpo.innerHTML = "<p>Sto guardando...</p>";
    const qs = [];
    /* Il registro PRIMA di tutto: e' la cosa che serve a Ste adesso. */
    qs.push('<div class="diag-sep">registro degli ultimi eventi</div>');
    if (!_registro.length) {
      qs.push('<div class="diag-riga"><b>vuoto</b><span>non e\' successo niente</span></div>');
    } else {
      for (const r of _registro) {
        qs.push('<div class="diag-riga"><b>&nbsp;</b><span>' +
          String(r).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span></div>");
      }
    }
    qs.push('<div class="diag-sep">versione</div>');
    /* Ste: "premo brani nascosti e non mi spunta nessuna canzone". Queste
       quattro righe dicono subito dove si ferma: quanti brani nascosti ha
       questo telefono, quanti sono di questo profilo, quanti brani ci sono e
       quanti si vedono davvero. */
      qs.push('<div class="diag-sep">la libreria</div>');
  try {
  const mieiId = new Set(tracks.map((t) => t.id));
  let visibili = 0;
  try { visibili = visibleTracks(false).length; } catch (e) { visibili = -1; }
      const riga = (nome, val) => '<div class="diag-riga"><b>' + nome + "</b><span>" + val + "</span></div>";
      qs.push(riga("profilo aperto", profile));
      qs.push(riga("brani in libreria", tracks.length));
      qs.push(riga("brani che si vedono", visibili));
      qs.push(riga("brani eliminati per sempre", _quantiEliminati()));
    } catch (e) {
      qs.push('<div class="diag-riga"><b>libreria</b><span>errore: ' +
        String(e && e.message ? e.message : e).slice(0, 60) + "</span></div>");
    }
    qs.push('<div class="diag-sep">versione</div>');
    qs.push('<div class="diag-riga"><b>in uso</b><span class="diag-ok">' + APP_VERSION + "</span></div>");
    const schermo = $("verBadge");
    if (schermo) qs.push('<div class="diag-riga"><b>numero in alto</b><span>' + (schermo.textContent || "?") + "</span></div>");

    qs.push('<div class="diag-sep">i nomi che ho cambiato</div>');
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const m = nomiRinomati();
      return { ok: true, s: Object.keys(m).length + " in memoria" };
    }, { nome: "nella memoria del browser" })));
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const d = await _leggiRinomineDalDisco();
      const n = d && typeof d === "object" ? Object.keys(d).length : 0;
      return { ok: n > 0, no: n === 0, s: n + " sul database del telefono" };
    }, { nome: "sul database del telefono" })));
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      try {
        const r = await fetch("./stato.json", { cache: "no-store" });
        const j = await r.json();
        const n = j && j.rinomini ? Object.keys(j.rinomini).length : 0;
        return { ok: n > 0, no: n === 0, s: n + " sul sito" };
      } catch (e) { return { ok: false, s: "sito non raggiungibile" }; }
    }, { nome: "sul sito" })));

    qs.push('<div class="diag-sep">col computer</div>');
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const base = await cercaPonte();
      return { ok: !!base, no: !base, s: base ? "risponde: " + base : "non raggiungibile" };
    }, { nome: "raggiungo il PC" })));
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const k = LS.get("mb.chiave", "");
      return { ok: !!k, no: !k, s: k ? "chiave presente" : "chiave mancante" };
    }, { nome: "servizio (funziona a PC spento)" })));

    qs.push('<div class="diag-sep">rete</div>');
    qs.push(await _rigaDiagnostica(Object.assign(async function () {
      const onLine = navigator.onLine ? "collegato" : "senza rete";
      return { ok: navigator.onLine, no: !navigator.onLine, s: onLine };
    }, { nome: "telefono" })));
    corpo.innerHTML = qs.join("");
  }

  /* Ste: "ogni volta che riavvio devo rimettere la chiave" e "il nome torna
     come prima".
     La causa vera era una, e non era un difetto dell'app: Ste stava
     aprendo il sito nella navigazione PRIVATA di Safari. In privata Safari
     BUTTA TUTTA la memoria del sito quando chiudi la scheda: nomi dei brani,
     preferiti, e anche la chiave del servizio. E' esattamente quello che
     vedevamo: dopo il riavvio tutto spariva.

     Qui l'app lo scopre da sola e lo dice, cosi' non si perdono ore a
     cercare un bug che non c'e'. */
  function _scopriSeSeiInPrivata() {
    /* Ste: "dice che sono in una finestra privata ma non e' vero".
       Motivo: la prova scriveva una chiave e dopo 2,5 secondi controllava
       se era sopravvissuta. Ma se in quei 2,5 secondi la pagina si
       ricaricava (e succede, perche' l'app si aggiorna), la lettura
       falliva e l'app dava la colpa alla finestra privata: un falso
       allarme.

       Adesso distingue i tre casi:
       - la chiave e' sopravvissuta: tutto bene, niente avviso;
       - la lettura e' fallita: la pagina si e' ricaricata, NON e' privata;
       - la scrittura e' fallita: la memoria non c'e' (privata davvero, o
         spazio pieno/bloccato): in questo caso il messaggio parla di
         quello che e' vero. */
    let scritta = false;
    try {
      const segreto = "prova-" + Date.now();
      LS.set("mb.prova-memoria", segreto);
      scritta = true;
      setTimeout(() => {
        let letta = false;
        let sopravvive = false;
        try { letta = true; sopravvive = LS.get("mb.prova-memoria", "") === segreto; } catch (e) { letta = false; }
        try { LS.remove("mb.prova-memoria"); } catch (e) { /* noop */ }
        if (sopravvive) return;
        if (!letta) {
          /* la lettura e' fallita: la pagina si e' ricaricata. Non e'
             la finestra privata, e non c'e' niente da segnalare. */
          return;
        }
        _mostraAvvisoPrivata();
      }, 2500);
    } catch (e) {
      /* la scrittura e' fallita: la memoria del sito non e' scrivibile */
      _mostraAvvisoMemoria();
    }
  }
  function _mostraAvvisoMemoria() {
    try {
      if (document.getElementById("avviso-privata")) return;
      const b = document.createElement("div");
      b.id = "avviso-privata";
      b.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:130;" +
        "background:#3a2a10;border:1px solid #ffb347;color:#ffe9c9;padding:12px 14px;" +
        "border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.5)";
      b.textContent = "Il browser non riesce a salvare i dati di questo sito (spazio pieno " +
        "o blocco dei cookie). I nomi che cambi e le preferenze potrebbero non restare. " +
        "Prova a svuotare i dati del sito dalle impostazioni del browser.";
      document.body.appendChild(b);
    } catch (e) { /* noop */ }
  }
  function _mostraAvvisoPrivata() {
    try {
      /* Ste: "mi spunta che sto usando la scheda privata anche se non e'
         vero". Motivo: era un falso allarme (la pagina si ricaricava durante
         la prova) e l'app funziona lo stesso: disturbare l'utente non
         serve a niente. L'informazione resta nella diagnostica. */
      if (LS.get("mb.avvisoPrivata", "") === "no") return;
      try { LS.set("mb.avvisoPrivata", "no"); } catch (e) { /* noop */ }
      if (document.getElementById("avviso-privata")) return;
      const b = document.createElement("div");
      b.id = "avviso-privata";
      b.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:130;" +
        "background:#3a2a10;border:1px solid #ffb347;color:#ffe9c9;padding:12px 14px;" +
        "border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.5)";
      b.textContent = "Stai usando la finestra PRIVATA di Safari: qui i dati non restano, " +
        "quindi i nomi che cambi e le preferenze si perdono. Apri l'app NON in privata " +
        "(solo dal collegamento normale) e tutto si salva da solo.";
      document.body.appendChild(b);
    } catch (e) { /* noop */ }
  }

  /* Accende la voce del menu quando il download automatico e' attivo. */
function _disegnaScaricaDaSolo() {
    try {
    const b = $("btnScaricaDaSolo");
    if (!b) return;
    const acceso = LS.get("mb.scaricaDaSolo", "si") === "si";
    b.classList.toggle("on", acceso);
    b.title = acceso
      ? "Accesa: le canzoni nuove che ascolti si scaricano da sole (con un tetto di spazio)"
      : "Spenta: le canzioni nuove non si scaricano da sole";
    } catch (e) { /* noop */ }
  }
  /* Ste: "ho scaricato tutte le canzoni ma la nuvoletta c'e' ancora".
     Il tetto di spazio era fisso a 500 MB e non si poteva cambiare. */
  function _disegnaTettoScarica() {
    try {
      const b = $("btnTettoScarica");
      if (!b) return;
      const mb = Number(LS.get("mb.tettoScarica-" + profile, "500")) || 500;
      b.title = mb >= 999999
        ? "Senza tetto: tengo offline tutto quello che entra"
        : "Tengo offline al massimo " + mb + " MB";
      const t = b.querySelector(".voce-testo");
      if (t) t.textContent = mb >= 999999
        ? "Quanto tenere offline: tutto"
        : "Quanto tenere offline: " + mb + " MB";
    } catch (e) { /* noop */ }
  }


  function apriRinomina(id) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return;
    editId = id;
    $("editTitle").value = t.title || "";
    $("editArtist").value = t.artist || "";
    const mappa = nomiRinomati();
    $("editAvviso").textContent = mappa[id]
      ? "Questo brano ha gia' un nome cambiato su questo dispositivo."
      : "Il cambio vale solo su questo telefono o computer.";
    $("editPanel").hidden = false;
    syncNoScroll();
    try { $("editTitle").focus(); } catch (e) { /* noop */ }
  }

  function chiudiRinomina(salva) {
    const id = editId;
    editId = null;
    $("editPanel").hidden = true;
    syncNoScroll();
    if (!salva || !id) return;
    const mappa = nomiRinomati();
    const t = tracks.find((x) => x.id === id);
    const titoloNuovo = String($("editTitle").value || "").trim();
    const artistaNuovo = String($("editArtist").value || "").trim();
    /* Prima di cambiare il nome, sposto via le statistiche: la chiave di un
       brano e' fatta con artista e titolo, quindi se cambio il nome senza
       spostarle il brano riparte da zero (perde "quante volte l'ho
       ascoltato" e i secondi).
       Uso i nomi come saranno DAVVERO dopo il cambio: se lascio vuoto un
       campo, il brano continua ad avere il vecchio valore, e la chiave
       deve tenerne conto. */
if (t) {
        /* se sto TOLGENDO la rinomina, tutto torna al nome vero del brano */
        const tolgo = !titoloNuovo && !artistaNuovo;
        const orig = tolgo ? _originaleDi(id) : null;
        const titoloEffettivo = titoloNuovo || (orig && orig.title) || t.title;
        const artistaEffettivo = artistaNuovo || (orig && orig.artist) || t.artist || "";
        _spostaStatistiche(t.title, t.artist, titoloEffettivo, artistaEffettivo);
      }
    mappa[id] = { title: titoloNuovo, artist: artistaNuovo };
    if (!mappa[id].title && !mappa[id].artist) delete mappa[id];
    try { LS.set("mb.rinomini", mappa); } catch (e) { /* noop */ }
    /* Segno che questo nome l'ho cambiato ADESSO io: e' l'unico che va
       mandato al sito. Tutti gli altri nomi che ho in testa possono essere
       vecchi, e mandarli farebbe tornare indietro le correzioni fatte da
       un altro telefono. */
    _rinominaDaMandareSegna(id, mappa[id]);
    /* Oltre che nella memoria del browser, che sul telefono spesso si perde,
       scrivo il nome nel database del telefono: li' resta anche se il
       browser dimentica, e al riavvio lo ritroviamo. */
    try { _salvaRinomineSulDisco(mappa); } catch (e) { /* noop */ }
    /* Lo metto anche sul sito: cosi' se il telefono dimentica (e capita),
       al riavvio il nome torna comunque, e vale anche sull'altro dispositivo. */
    try { _salvaStatoCondiviso(); } catch (e) { /* noop */ }
    applicaRinomine();
    render();
    /* Ste: "se cambio l'artista e riavvio il sito torna di prima".
       Prima scrivevo "Nome cambiato" e basta: sembrava tutto a posto, ma il
       nome restava solo sul telefono, e sul telefono quei dati spariscono
       (e' successo: e' sparita anche la chiave del servizio, che aveva messo
       lui prima). Adesso invece dico la verita': se non riesco a portare il
       nome fuori dal telefono, dico subito che deve stare sul Wi-Fi di casa,
       e intanto l'app continua a riprovare da sola. */
    try {
      if (typeof _statoCondivisoOk !== "undefined" && _statoCondivisoOk) {
        toast("Nome cambiato e salvato");
      } else {
        toast("Nome cambiato, MA non è ancora al sicuro: su questo telefono i\n" +
          "dati spariscono al riavvio. Collega il Wi-Fi di casa (o lascia il PC\n" +
          "acceso): l'app lo salva da sola appena può.", 9000);
      }
    } catch (e) { /* noop */ }
  }

  /* Sposta la scheda di ascolto da un nome all'altro quando cambio il nome
     di un brano. Se il brano torna col nome vero, il percorso e' inverso. */
  function _spostaStatistiche(titoloDa, artistaDa, titoloA, artistaA) {
    try {
      const da = _chiaveBrano({ title: titoloDa, artist: artistaDa });
      const a = _chiaveBrano({ title: titoloA, artist: artistaA });
      if (!da || !a || da === a) return;
      const st = statisticheProfilo();
      const vecchia = st[da];
      if (!vecchia) return;
      const nuova = st[a] || { v: 0, s: 0 };
      nuova.v = (nuova.v || 0) + (vecchia.v || 0);
      nuova.s = (nuova.s || 0) + (vecchia.s || 0);
      if (!nuova.t) { nuova.t = vecchia.t || ""; nuova.a = vecchia.a || ""; }
      st[a] = nuova;
      delete st[da];
      _salvaStatistiche();
    } catch (e) { /* noop */ }
  }

  $("editSave").addEventListener("click", () => chiudiRinomina(true));
  $("editCancel").addEventListener("click", () => chiudiRinomina(false));
  $("editReset").addEventListener("click", () => {
    const id = editId;
    if (!id) return;
    const mappa = nomiRinomati();
    delete mappa[id];
    try { LS.set("mb.rinomini", mappa); } catch (e) { /* noop */ }
    /* Rimettere il nome originale e' una correzione come tutte le altre:
       va mandata, e va tolta dalla lista dei "solo questi". */
    _rinominaDaMandareSegna(id, null);
    editId = null;
    $("editPanel").hidden = true;
    syncNoScroll();
    applicaRinomine();
    render();
    toast("Rimesso il nome originale");
  });
  $("editPanel").addEventListener("click", (e) => {
    if (e.target === $("editPanel")) chiudiRinomina(false);
  });

/* Tieni premesso (telefono e computer) e si apre la modifica del nome.
     Quando hai aperto la modifica, il tocco successivo NON deve suonare il
     brano: prima succedeva il contrario, e finivi per ascoltare la canzone
     mentre cercavi di rinominarla. */
  function collegaPressioneLunga(el, id) {
    let timer = null;
    let giaPartito = false;
    let apertoIl = 0;
    const apri = () => {
      giaPartito = true;
      apertoIl = Date.now();
      apriRinomina(id);
    };
    const via = (v) => { timer = setTimeout(apri, 600); };
    const pulisci = () => { if (timer) clearTimeout(timer); timer = null; };
    el.addEventListener("touchstart", () => via(), { passive: true });
    el.addEventListener("touchend", () => setTimeout(pulisci, 60), { passive: true });
    el.addEventListener("touchcancel", pulisci, { passive: true });
    /* Se il dito si muove, e' uno scorrimento: NON deve aprire la modifica
       e NON deve essere bloccato, altrimenti non riesci piu' a scorrere
       la lista passando il dito sulle canzoni. */
    el.addEventListener("touchmove", pulisci, { passive: true });
    el.addEventListener("mousedown", (e) => { via(); if (e.button === 2) pulisci(); });
    el.addEventListener("mouseup", pulisci);
    el.addEventListener("mouseleave", pulisci);
    /* il tasto destro apre la modifica: e' gia' aperta, quindi segnalo
       anche questo, cosi' il clic dopo non suona niente */
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      apri();
    });
    /* qualunque clic nei pressi dell'apertura viene ignorato */
    el.addEventListener("click", (e) => {
      if (giaPartito || (apertoIl && Date.now() - apertoIl < 1200)) {
        giaPartito = false;
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  /* Se il profilo aperto non ha brani ma un altro profilo ne ha, te lo dico:
     succede perche' le librerie sono diverse e si sembra sparito tutto. */
  function avvisaProfiloVuoto() {
    const avviso = $("avvisoProfilo");
    if (!avviso) return;
    if (tracks.length) {
      avviso.hidden = true;
      return;
    }
    const altro = PROFILI.map((p) => p.nome).find((n) => n !== profile &&
      BUILTIN.filter((b) => (b.profile || DEFAULT_PROFILE) === n).length > 0);
    if (!altro) {
      avviso.hidden = true;
      return;
    }
    const quanti = BUILTIN.filter((b) => (b.profile || DEFAULT_PROFILE) === altro).length;
    avviso.innerHTML = "";
    const p = document.createElement("div");
    p.textContent = "Nel profilo " + profile + " non ci sono brani. In " + altro + " ce ne sono " + quanti + ".";
    const b = document.createElement("button");
    b.textContent = "Vai al profilo " + altro;
    b.addEventListener("click", () => {
      avviso.hidden = true;
      switchProfile(altro);
    });
    avviso.appendChild(p);
    avviso.appendChild(b);
    avviso.hidden = false;
  }

  /* ---------- Statistiche di ascolto ----------
   Conta quante volte e quanto tempo ho ascoltato ogni brano. I dati sono
   per profilo: le statistiche di Emanuele stanno separate da quelle di Ste,
   anche se la libreria e' la stessa. */
  function statisticheProfilo(nome) {
    const st = profileState(nome || profile);
    if (!st.stats || typeof st.stats !== "object") st.stats = {};
    return st.stats;
  }

  function _chiaveStats(t) {
    return _chiaveBrano(t);
  }

  let _statsUltimoTempo = 0;
  let _statsCronometro = null;
  let _statsUltimoSalvataggio = 0;
  let _tick = 0;

  function _segnaAscolto(t, secondi, nuovo) {
    try {
      if (!t) return;
      const chiave = _chiaveStats(t);
      if (!chiave) return;
      const st = statisticheProfilo();
      const r = st[chiave] || { v: 0, s: 0 };
if (nuovo) r.v = (r.v || 0) + 1;
        /* NON arrotondo qui: i pezzi arrivano piccoli (sul telefono 0,25
           secondi alla volta) e arrotondandoli uno per uno diventerebbero
           tutti zero, e i secondi andrebbero persi. Sommo i pezzi esatti e
           arrotondo solo quando li mostro. */
        r.s = (r.s || 0) + Math.max(0, Number(secondi) || 0);
      r.t = t.title || "";
      r.a = t.artist || "";
      st[chiave] = r;
      const ora = Date.now();
      if (ora - _statsUltimoSalvataggio > 15000) {
        _statsUltimoSalvataggio = ora;
        writeProfileState(profile, { stats: st });
    try { _programmaStatCondivise(); } catch (e) { /* noop */ }
      }
    } catch (e) { /* le statistiche non devono mai fermare l'uso */ }
  }

  /* Tutte le statistiche di tutti i profili, da mettere nei dati
   condivisi: cosi' i minuti ascoltati valgono su ogni dispositivo
   e su ogni link, non solo su quello dove stai ascoltando. */
/* Le statistiche che arrivano dal sito: per ogni brano tengo il numero
   piu' alto fra il mio e quello arrivato. Non sommo, perche' altrimenti
   ascoltare lo stesso brano su telefono e computer lo conterebbe due
   volte. E non perdo niente: se un dispositivo non ha ancora salvato
   nulla, il numero dell'altro resta intatto. */
  /* Toglie dalla lista dei nascosti i brani che qualcun altro ha ripreso.
   Li tolgo davvero da tutte le mie liste, non solo da quella aperta:
   se no, riaprendo un altro profilo ritornavano nascosti lo stesso. */
function _unisciStatistiche(remote) {
    try {
      if (!remote || typeof remote !== "object") return 0;
      let cambiati = 0;
      for (const nome of Object.keys(remote)) {
        const arrivo = remote[nome];
        if (!arrivo || typeof arrivo !== "object") continue;
        /* Uso la copia del profilo e la riscrivo per nome: cosi' funziona
           anche per i profili che NON sto usando adesso (se sono su Ste,
           arrivano anche i minuti di Diego). */
        const copia = JSON.parse(JSON.stringify(profileState(nome) || {}));
        if (!copia.stats || typeof copia.stats !== "object") copia.stats = {};
        for (const k of Object.keys(arrivo)) {
          const a = arrivo[k] || {};
          const b = copia.stats[k] || { v: 0, s: 0 };
          const v = Math.max(Number(b.v) || 0, Number(a.v) || 0);
          const sec = Math.max(Number(b.s) || 0, Number(a.s) || 0);
          if (v !== (b.v || 0) || sec !== (b.s || 0)) cambiati++;
          copia.stats[k] = { v: v, s: sec, t: b.t || a.t || "", a: b.a || a.a || "" };
        }
        if (cambiati) writeProfileState(nome, { stats: copia.stats });
      }
      return cambiati;
    } catch (e) { return 0; }
  }

  function _statisticheDiTutti() {
  const fuori = {};
  try {
    const tutti = allState() || {};
    for (const nome of Object.keys(tutti)) {
      const st = tutti[nome];
      if (st && st.stats && typeof st.stats === "object" && Object.keys(st.stats).length) {
        fuori[nome] = {};
        for (const k of Object.keys(st.stats)) {
          const r = st.stats[k] || {};
          fuori[nome][k] = { v: r.v || 0, s: r.s || 0, t: r.t || "", a: r.a || "" };
        }
      }
    }
  } catch (e) { /* noop */ }
  return fuori;
}
/* I minuti devono anche PARTIRE, non solo arrivare. Prima salvavo i
   secondi solo sul telefono e non li mandavo mai: quindi gli altri
   dispositivi restavano a zero per sempre. Non lo faccio ogni 15
   secondi per non intasare il computer: ogni 3 minuti va benissimo,
   e _salvaStatoCondiviso gia' aspetta e unisce tutto. */
let _statCondiviseUltimo = 0;
function _programmaStatCondivise() {
  try {
    const ora = Date.now();
    if (ora - _statCondiviseUltimo < 180000) return;
    _statCondiviseUltimo = ora;
    _salvaStatoCondiviso();
  } catch (e) { /* noop */ }
}
function _salvaStatistiche() {
    try { writeProfileState(profile, { stats: statisticheProfilo() }); } catch (e) { /* noop */ }
  }

  /* Segue l'ascolto reale e NON conta quello che salti.
     Guardo ogni secondo quanto e' andato avanti il brano:
     - se avanza di poco (1 secondo), e' ascolto vero e lo sommo
     - se avanza tanto (perche' hai premuto avanti), NON lo sommo: la canzone
       l'hai saltata, non ascoltata.
     Prima guardavo ogni 5 secondi e accettavo solo fino a 3 secondi di
     salto: con quei numeri non contava praticamente niente. */
  /* Registro di controllo: ogni 15 secondi scrivo nel registro del PC com'e'
     il conteggio. Serve per capire PERCHE' i secondi non salgono guardando
     il suo telefono, invece di indovinare: quanta musica sta suonando, se il
     cronometro e' partito, e quanto ha contato finora. */
  function _segnalaControllo(secondiContati) {
    try {
      const t = current();
      segnalaErrore("controllo ascolto: brano=" + (t ? (t.artist || "?") + " / " + (t.title || "?") : "nessuno") +
        " | suona=" + (audio ? (audio.paused ? "no" : "si") : "nessun player") +
        " | cronometro=" + (_statsConto ? Math.round((Date.now() - _statsTic) / 1000) + "s" : "fermo") +
        " | contati ora=" + Math.round(secondiContati) + "s");
    } catch (e) { /* noop */ }
  }

  /* Conto il tempo in cui la musica STA SUONANDO, anche se esci dall'app o
   blocchi il telefono: se la canzone continua, la stai sentendo.
   Conto a "tratti": ogni volta che guardo, aggiungo il tempo passato e riparto
   da zero. Serve perche' quando la scheda non e' visibile il browser rallenta
   i controlli (una volta al minuto, o meno): aggiungendo il tempo passato
   quei secondi non si perdono. Ogni somma e' limitata a 90 secondi, cosi' se
   il telefono si e' addormentato di colpo non ti aggiunge minuti fantasma.
   Saltando i brani non si conta nulla: si conta il tempo che ci metti a
   premere "avanti", cioe' quasi niente. */
  /* CONTO QUELLO CHE LA MUSICA HA DAVVERO SUONATO.

     Prima contavo con l'orologio: passavano 2 secondi e aggiungevo 2 secondi.
     Ma sul telefono l'orologio e gli avvisi vanno a modo loro, e quei 2
     secondi arrivavano a blocchi: il numero cresceva a scatti e sembrava
     rotto.

     Adesso guardo la posizione DENTRO la canzone. Se la canzone e' al secondo
     10 e un secondo dopo e' al secondo 11, ho ascoltato esattamente 1 secondo.
     Non importa che ore siano, non importa con che' frequenza arrivano gli
     avvisi, non importa se l'app e' in primo piano: se la musica avanza, io
     conto quello che e'advance. E' il dato vero, non una stima. */
  let _statsPosVisto = 0;   /* posizione della canzone all'ultimo controllo */
  let _statsTic = 0;        /* orologio all'ultimo controllo */
  let _statsConto = false;  /* il conto e' partito? */
  const _STATI_MAX = 600;   /* saltino assurdo: non si conta */

  function _posizioneMusica() {
    try {
      const ct = audio && typeof audio.currentTime === "number" ? audio.currentTime : 0;
      return (isFinite(ct) && ct > 0) ? ct : 0;
    } catch (e) { return 0; }
  }

  function _staSuonandoOra() {
    try { return !!(audio && !audio.paused && !audio.ended); } catch (e) { return false; }
  }

  function _iniziaAscolto() {
    /* Segno da dove si parte quando parte la musica: cosi' anche il primo
       pezzetto viene contato e non si perde l'inizio della canzone. */
    _statsConto = true;
    _statsPosVisto = _posizioneMusica();
    _statsTic = Date.now();
  }

  function _chiudiAscolto(riparte) {
    if (!riparte) { _statsConto = false; _statsPosVisto = 0; _statsTic = 0; }
  }

  function _seguiAscolto(audio) {
    try {
      if (!_staSuonandoOra()) { _chiudiAscolto(false); return; }
      const adesso = Date.now();
      const pos = _posizioneMusica();
      if (pos <= 0) {
        /* ripiego per flussi dove la posizione non si legge */
        if (!_statsConto) { _statsConto = true; _statsTic = adesso; return; }
        const passati = (adesso - _statsTic) / 1000;
        if (passati >= 2) {
          _statsTic = adesso;
          _segnaAscolto(current(), passati > _STATI_MAX ? _STATI_MAX : passati, false);
        }
        return;
      }
      if (!_statsConto) _iniziaAscolto();
      const passati = (adesso - _statsTic) / 1000;
      const avanti = pos - _statsPosVisto;
      _statsPosVisto = pos;
      _statsTic = adesso;
      if (avanti < 0) return;   /* canzone cambiata o riavvolta: riparto pulito */
      /* Contiamo il PIU' PICCOLO fra il tempo passato e quanto la canzone ha
         davvero fatto avanti.
         - se il telefono si blocca, la canzone resta ferma e non conto troppo;
         - se gli avvisi arrivano radi, non perdo niente perche' la canzone
           dice esattamente quanto e' andata avanti. */
      let quanto = avanti;
      if (passati >= 0 && passati < quanto) quanto = passati;
      if (quanto <= 0) return;
      _segnaAscolto(current(), quanto > _STATI_MAX ? _STATI_MAX : quanto, false);
    } catch (e) { /* noop */ }
  }

  /* Fa partire il cronometro delle statistiche. */
  /* ---------- La finestra delle statistiche ----------
     Mostra i numeri del profilo aperto e, sotto, un confronto con gli
     altri due profili: cosi' vedi subito com'e' messa la libreria di tutti. */
  function _artistiDi(lista) {
    const set = new Set();
    for (const t of lista) {
      const k = gruppoArtista(t);
      if (k && k !== "zzz") set.add(k);
    }
    return set.size;
  }

  function _tempoTesto(secondi) {
    const s = Math.max(0, Math.round(secondi || 0));
    if (s < 60) return s + (s === 1 ? " secondo" : " secondi");
    const ore = Math.floor(s / 3600);
    const min = Math.floor((s % 3600) / 60);
    if (!ore) return min + (min === 1 ? " minuto" : " minuti");
    return ore + (ore === 1 ? " ora" : " ore") + (min ? " e " + min + (min === 1 ? " minuto" : " minuti") : "");
  }

  function _numeriProfilo(nome) {
    const lista = tracks.filter((t) => (t.profile || DEFAULT_PROFILE) === nome);
    const st = profileState(nome);
    const stats = (st && st.stats) || {};
    let volte = 0, secondi = 0;
    const perArtista = new Map();
    const perBrano = [];
    for (const k in stats) {
      const r = stats[k] || {};
      volte += r.v || 0;
      secondi += r.s || 0;
      const nomeArtista = (r.a || "").trim() || "senza artista";
      perArtista.set(nomeArtista, (perArtista.get(nomeArtista) || 0) + (r.v || 0));
      if ((r.s || 0) > 0) perBrano.push({ titolo: r.t || "", artista: r.a || "", s: r.s || 0 });
    }
    const topArtisti = [...perArtista.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topBrani = perBrano.sort((a, b) => b.s - a.s).slice(0, 5);
    return {
      nome: nome,
      brani: lista.length,
      artisti: _artistiDi(lista),
      tuoi: lista.filter((t) => !t.builtin && !t.preview && !eGiaCondiviso(t)).length,
      volte: volte,
      secondi: secondi,
      topArtisti: topArtisti,
      topBrani: topBrani
    };
  }

  function _rigaStat(numero, testo, nota) {
    return '<div class="stat-riga"><b>' + numero + "</b><span>" + testo +
      (nota ? ' <i>' + nota + "</i>" : "") + "</span></div>";
  }

  function apriStatistiche() {
    const pannello = $("statsPanel");
    if (!pannello) return;
    _ricostruisciStatistiche();
    pannello.hidden = false;
    syncNoScroll();
  }

  /* Costruisce i numeri dentro la finestra. Si richiama anche ogni 2 secondi
     mentre la finestra e' aperta, cosi' il tempo ascoltato cresce davanti
     agli occhi invece di restare fermo. */
  function _ricostruisciStatistiche() {
    const pannello = $("statsPanel");
    if (!pannello) return;
    const n = _numeriProfilo(profile);
    $("statsSub").textContent = "Profilo " + profile;
    let html = "";
    html += '<div class="stat-griglia">';
    html += _rigaStat(n.brani, n.brani === 1 ? "brano" : "brani");
    html += _rigaStat(n.artisti, n.artisti === 1 ? "artista" : "artisti");
    html += _rigaStat(_tempoTesto(n.secondi), "di musica ascoltata");
    html += _rigaStat(n.volte, n.volte === 1 ? "ascolto" : "ascolti");
    if (n.tuoi) html += _rigaStat(n.tuoi, "brani aggiunti da te");
    html += "</div>";

    if (n.topArtisti.length) {
      html += "<h4>Artisti più ascoltati</h4><div class=\"stat-lista\">";
      for (const [a, v] of n.topArtisti) {
        html += '<div class="stat-item"><span>' + a + "</span><b>" + v + "</b></div>";
      }
      html += "</div>";
    } else {
      html += '<p class="step-hint">Non hai ancora ascoltato niente con questo profilo: ascolta una canzone e i numeri si riempiono da soli.</p>';
    }
    if (n.topBrani.length) {
      html += "<h4>Brani più ascoltati</h4><div class=\"stat-lista\">";
      for (const b of n.topBrani) {
        html += '<div class="stat-item"><span>' + (b.artista ? b.artista + " — " : "") + b.titolo +
          "</span><b>" + _tempoTesto(b.s) + "</b></div>";
      }
      html += "</div>";
    }

    /* Gli altri profili: utile per capire se la libreria e' quella giusta */
    html += "<h4>Come sono gli altri profili</h4><div class=\"stat-lista\">";
    for (const pr of PROFILI) {
      const m = _numeriProfilo(pr.nome);
      const chi = pr.nome === profile ? " (sei tu)" : "";
      html += '<div class="stat-item' + (pr.nome === profile ? " io" : "") + '"><span>' + pr.nome + chi +
        "</span><b>" + m.brani + " brani · " + m.volte + " ascolti</b></div>";
    }
    html += "</div>";
    html += '<p class="step-hint">I minuti ascoltati valgono su tutti i dispositivi e su tutti i link: vengono salvati insieme al resto.</p>';

    /* Diagnostica visibile: sul telefono non posso leggere cosa succede
       (il browser vieta al sito di scrivere sul computer), quindi qui dentro
       mostriamo quello che la pagina crede di sapere. Se i secondi non
       salgono, qui si vede perche'. */
html += "<h4>Come sta andando l'ascolto</h4>";
    const suonaOra = !!(audio && !audio.paused && !audio.ended);
    const brano = current();
    const chiave = brano ? _chiaveStats(brano) : "";
    const salvati = chiave ? ((statisticheProfilo()[chiave] || {}).s || 0) : 0;
    html += '<div class="stat-lista">';
    html += '<div class="stat-item"><span>Música sta suonando</span><b>' + (suonaOra ? "sì" : "no") + "</b></div>";
    html += '<div class="stat-item"><span>Dove e\' la canzone</span><b>' + _posizioneMusica().toFixed(1) + "s</b></div>";
    html += '<div class="stat-item"><span>Secondi di questo brano</span><b>' + Math.round(salvati) + "s</b></div>";
    html += '<div class="stat-item"><span>Timer di riserva</span><b>' + (_statsCronometro ? "attivo" : "non parte") + "</b></div>";
    html += '<div class="stat-item"><span>Versione della pagina</span><b>' + APP_VERSION + "</b></div>";
    html += "</div>";

    $("statsCorpo").innerHTML = html;
    pannello.hidden = false;
    syncNoScroll();
  }

  function chiudiStatistiche() {
    const pannello = $("statsPanel");
    if (!pannello) return;
    pannello.hidden = true;
    syncNoScroll();
  }

  /* Conta anche quando la musica si muove. Prima contavo solo con un timer
     che parte all'avvio della pagina: se qualcosa in avvio va storto (e sul
     telefono capita) il timer non parte e i secondi non salgono mai.
     L'evento timeupdate scatta invece ogni volta che la musica avanza,
     quindi funziona su ogni dispositivo. */
  function _contaAlMuoversi() {
    try {
      _seguiAscolto(audio);
      /* Se la finestra delle statistiche e' aperta la aggiorno QUI, non solo
         col timer: sul telefono il timer va piano e i secondi sembravano
         saltare a blocchi di 2 secondi invece di crescere davanti agli occhi. */
      const pannello = $("statsPanel");
      if (pannello && !pannello.hidden) {
        _tick++;
        if (_tick % 8 === 0) {
          try { _ricostruisciStatistiche(); } catch (e) { /* noop */ }
        }
      }
    } catch (e) { /* noop */ }
  }

  function _avviaStatistiche() {
    try {
      if (_statsCronometro) return;
/* Ogni secondo: abbastanza per capire se stai ascoltando o saltando,
  e abbastanza leggero da non accorgertene.
  Se la finestra delle statistiche e' aperta, la aggiorno ogni 2
  secondi: senza questo i numeri restavano fermi a com'erano quando
  l'hai aperta e sembrava che il tempo non si contasse. */
  _statsCronometro = setInterval(() => {
    _seguiAscolto(audio);
    _salvaStatistiche();
    _tick++;
    const pannello = $("statsPanel");
    if (pannello && !pannello.hidden && _tick % 2 === 0) {
      try { _ricostruisciStatistiche(); } catch (e) { /* noop */ }
    }
    /* ogni 15 secondi scrivo come sta andando, cosi' lo leggo dal registro
       e non devo chiedere uno screenshot */
    if (_tick % 15 === 0) {
      let contati = 0;
      try {
        const st = statisticheProfilo();
        const t = current();
        const k = t ? _chiaveStats(t) : "";
        contati = (k && st[k] && st[k].s) || 0;
      } catch (e) { /* noop */ }
      _segnalaControllo(contati);
    }
  }, 1000);
    } catch (e) { /* noop */ }
    window.addEventListener("pagehide", () => { _chiudiAscolto(false); });
    /* Esci dall'app o blocchi il telefono? Se la musica continua a suonare la
       stai sentendo, quindi il tempo si conta lo stesso. Se invece si ferma,
       il conto si chiude e basta. */
    document.addEventListener("visibilitychange", () => {
      _chiudiAscolto(false);
    });
  }

  function _contaAscoltoNuovo(t) {
    _segnaAscolto(t, 0, true);
  }

  /* ---------- Le mie librerie, e quelle degli altri ----------

   Ogni nome ha la sua libreria. Non e' una password e non e' un account: e'
   solo un nome, e serve a tenere separati i brani che hai aggiunto tu.
   E' quello che vuole Stefano: le canzoni sue restano sue.

   Due cose permettono di sentire anche qualche canzone degli altri, senza che
   all'altro sparisca niente:
   - l'interruttore "vedi anche le canzoni degli altri": le mostra tutte;
   - "Porta nella mia libreria" dalla pressione lunga: quel brano entra anche
     nella mia, e resta dov'e'.

   La lista dei brani "miei anche se non li ho aggiunti io" la tengo anche sul
   sito (stato.json), cosi' vale su ogni dispositivo.

   STANNO QUI, e non dentro loadAll: le usa anche l'interruttore nel pannello
   dei nomi, che sta fuori da li'. Prima erano dentro loadAll e quando lui
   premeva l'interruttore saltava un errore che bloccava l'app intera: spariva
   la libreria, l'interruttore non faceva niente e la X non chiudeva. */

const LS_MIEI = "mb.miei";

/* I brani che ho copiato nella libreria di UN account qualsiasi.
   Serve quando sto trasportando canzoni: se l'account di destinazione non e'
   quello aperto, devo leggere la sua lista, non quella di chi sto guardando. */
function _mieiCopiatiDi(nome) {
  try {
    const v = JSON.parse(LS.get(LS_MIEI, "{}"));
    const miei = (v && typeof v === "object") ? v : {};
    const lista = Array.isArray(miei[nome]) ? miei[nome] : [];
    return new Set(lista.map((x) => String(x || "")).filter(Boolean));
  } catch (e) { return new Set(); }
}

function _mieiCopiati() {
  return _mieiCopiatiDi(profile);
}

function _salvaMieiCopiati(lista) {
  try {
    const v = JSON.parse(LS.get(LS_MIEI, "{}"));
    const miei = (v && typeof v === "object") ? v : {};
    miei[profile] = [...new Set((lista || "").map((x) => String(x || "")).filter(Boolean))].sort();
    LS.set(LS_MIEI, JSON.stringify(miei));
  } catch (e) { /* noop */ }
}

/* Gli interruttori "vedi anche le canzoni degli altri" e "fai suonare anche le
   canzoni degli altri" sono stati tolti (vedi _devoVedereBrano): Ste preferisce
   entrare nel profilo dell'amico e scegliere da li'. Non restano piu' ne'
   l'interruttore ne' la chiave in memoria. */

/* Chiamato per ogni brano mentre carico la libreria. */
function _devoVedereBrano(eMio, b) {
  /* Ste: "togli l'interruttore, se voglio vedere le canzoni degli altri basta
     che vado nel suo profilo". Quindi qui NON c'e' piu' nessuna via per farle
     entrare in automatico: vedo le mie, e quelle che io ho copiato nella mia
     libreria (che ormai sono mie a tutti gli effetti). */
  if (eMio) return true;
  /* l'id del brano e' b-track-<numero>, come lo chiama tutto il resto */
  const m = /songs\/track-(\d+)\.mp3$/.exec(String((b && b.file) || ""));
  if (!m) return false;
  return _mieiCopiati().has("b-track-" + m[1]);
}

  function _branoInRevisione(b) {
    const owner = (b && b.profile) || DEFAULT_PROFILE;
    return owner === profile && !!(RECOVERY_REVIEW[owner] && RECOVERY_REVIEW[owner][b.file]);
  }

  /* Blob da IndexedDB hanno bisogno di un object URL per apparire come immagini. */
  const _urlCopertineSalvate = new Map();
  async function loadAll() {
  _diag("loadAll");
  _memoCondiviso.clear();
  /* Copertine che ho cercato io dal browser per questi brani (vedi
     "Scarica tutte le copertine mancanti"): valgono solo su questo
     dispositivo, ma cosi' un brano senza copertina la vede comunque. */
  let copertineMie = {};
  try {
    const salvate = await dbAllCover();
    for (const c of salvate) {
      if (!c || !c.id || !c.cover) continue;
      let cover = c.cover;
      if (typeof Blob !== "undefined" && cover instanceof Blob) {
        if (!_urlCopertineSalvate.has(c.id)) {
          _urlCopertineSalvate.set(c.id, URL.createObjectURL(cover));
        }
        cover = _urlCopertineSalvate.get(c.id);
      }
      copertineMie[c.id] = { ...c, cover };
    }
  } catch (e) { /* noop */ }

/* Ognuno vede la sua libreria, non quella degli altri: le canzoni di Ste
     sono sue. Per sentire qualche canzone degli altri si puo' accendere
     l'interruttore "vedi anche le canzoni degli altri", oppure tenere premuto
     una canzone altrui e scegliere "Porta nella mia libreria": quella la copia
     e basta, all'altro resta esattamente com'e'. */
/* Ste: "quando nascondo e aggiorno tornano indietro". I dati sul sito
   c'erano gia' tutti (verificato), quindi il guaio e' sul telefono: o
   arrivali non vengono messi dentro, o vengono tolti subito dopo.

   Qui mi scrivo quello che vedo, e poi lo leggo dal computer invece di
   continuare a indovinare. Costa niente e non blocca niente. */
  let _diUltimoInvio = 0;
  let _diUltimoInvio2 = 0;
  let _diUltimoInvio3 = 0;
  let _diUltimoInvio4 = 0;


  /* I brani che l'utente ha eliminato per davvero con la X: non li
     carico, e non li lascio rientrare. Ste: "premo la X e invece di
     eliminarsi tornano nella libreria". Il motivo era che la libreria
     viene ricostruita da capo, e il brano eliminato era ancora nella
     libreria condivisa: tornava indietro a ogni ricarica. Adesso l'elenco
     degli eliminati viaggia col resto dei dati, quindi vale su tutti i
     telefoni. */
  let eliminati = {};
  try { eliminati = LS.get("mb.eliminati", null) || {}; } catch (e) { eliminati = {}; }

  /* La chiave di un brano eliminato porta con se' il profilo.
     Ste: "se elimino dei brani dalla mia libreria, nella libreria di Diego
     devono restare se presenti". Prima la lista era globale: quello che
     eliminavo io spariva anche a Diego. E capita anche il contrario: brani
     che spariscono a caso, perche' la lista globale si mescolava.

     Ora la chiave e' "profilo.id": io elimino "Ste.b-track-12", Diego
     elimina "Diego.b-track-30", e ognuno vede solo le proprie. */
  function _chiaveEliminato(id, profilo) {
    return String(profilo || profile || "Ste") + "." + String(id || "");
  }
  /* MB_REVIEW_VISIBLE_SAFE_20261030 */
  const builtin = BUILTIN
  .filter((b) => !eliminati[_chiaveEliminato(_idBranoStabile(b))])
  /* Ste: "cancello, spariscono e ricompaiono dopo 5 secondi".
     Metto una traccia: quante canzoni ho scartato e con che chiave, cosi'
     vedo dal computer se la chiave e' quella giusta. */
  .filter(function (b) {
    const k = _chiaveEliminato(_idBranoStabile(b));
    if (!eliminati[k]) return true;
    return false;
  })
  .filter((b) => _devoVedereBrano((b.profile || DEFAULT_PROFILE) === profile, b))
          .map((b, i) => {
      /* Il nome di parecchi file era "ARTISTA - ARTISTA - TITOLO" (per
         esempio "BLANCO - BLANCO - SOTTOGONNA"): in libreria si vedeva
         l'artista due volte. Tolgo il nome dell'artista dal titolo quando
         è ripetuto. La funzione esisteva gia', ma serviva solo per cercare
         le copertine: qui serve anche per quello che si legge. */
      const titoloPulito = stripArtistPrefix(b.artist, b.title);
      if (titoloPulito && titoloPulito !== b.title) {
      _spostaStatistiche(b.title, b.artist || "", titoloPulito, b.artist || "");
      }
      const info = _copertinaDelBuiltin(b);
      const stabile = _idBranoStabile(b);
      const mia = copertineMie[stabile];
      return {
        id: stabile,
        title: titoloPulito || b.title,
        artist: b.artist || "",
        album: (mia && mia.album) || (info && info.album) || b.spotifyAlbum || "",
        cover: (mia && mia.cover) || (info && info.cover) || b.cover || "",
        userCover: !!(mia && mia.cover),
        spotifyId: b.spotifyId || "",
        spotifyAlbum: b.spotifyAlbum || "",
        spotifyDurationMs: b.spotifyDurationMs || null,
        url: _branoInGym(stabile)
          ? _doveStaIlBranoConBassi(b.file)
          : _doveStaIlBrano(b.file),
        /* Il nome del file: serve per sapere se questo brano e' stato
           potenziato (e metterci il contrassegno). */
        file: b.file || "",
        review: _branoInRevisione(b),
        /* Ste: "nell'account di Diego il tasto avanti non va avanti".
           Qui mancava proprio questo pezzo: quando l'app costruiva il brano si
           dimenticava di segnare di chi e'. Nella coda (visibleTracks) il
           controllo e' (brano.profile || "Ste") === profilo aperto: senza questo
           campo diventava sempre "Ste", quindi nell'account di un amico TUTTI i
           brani venivano scartati, la coda restava vuota e avanti/indietro/
           fine brano non potevano funzionare. Nel profilo Ste non si notava,
           perche' il fallback tornava per caso giusto. */
        profile: b.profile || DEFAULT_PROFILE,
        builtin: true,
        gradient: PALETTE[i % PALETTE.length],
        size: null
      };
    });

  let added = [];
  let doppioni = 0;
  try {
    const records = (await dbAll()).filter((r) => r && r.id && r.blob);
    added = records
  .filter((r) => (r.profile || DEFAULT_PROFILE) === profile)
  /* Se il brano esiste gia' nella libreria condivisa non lo mostro due volte:
       la copia nel browser serve per non riscaricarlo, ma elencarla
       creava due righe identiche e i contatti non tornavano piu' con gli
       altri dispositivi. Il brano condiviso fa da riga unica. */
  .filter((r) => {
    if (eGiaCondiviso({ ...r, profile: r.profile || DEFAULT_PROFILE })) {
      doppioni++;
      /* Non mostro la riga, ma segno il brano come "gia' in lista" cosi'
         handleError puo' usare questa copia se il file online non parte. */
      _copieLocali.set(_chiaveBrano({ artist: r.artist, title: r.title }), r);
      return false;
    }
    return true;
  })
  .map((r) => ({
  id: r.id,
  title: r.title,
  artist: r.artist || "",
  album: r.album || "",
  /* Se nel file delle copertine c'e' una copertina giusta per questo brano,
     la preferisco a quella salvata nel database: quella risale al giorno in
     cui l'hai importato e conteneva anche copertine sbagliate. E se questo
     brano e' nella lista di quelli non affidabili, non uso quella salvata. */
  cover: (function (rr) {
    if (copertinaNonAffidabile(rr.artist, rr.title)) return null;
    const giusta = coverInfo(rr.artist, rr.title);
    return (giusta && giusta.cover) || rr.cover || null;
  })(r),
  source: r.source || "file",
  url: URL.createObjectURL(r.blob),
  /* Come sopra: anche le canzoni che aggiungi tu devono sapere di quale
     profilo sono, altrimenti spariscono dalla coda negli account degli amici. */
  profile: r.profile || DEFAULT_PROFILE,
  builtin: false,
  gradient: PALETTE[(builtin.length + Math.abs(hashId(r.id))) % PALETTE.length],
  size: r.size
  }));
  } catch (e) {
    console.warn("IndexedDB non disponibile", e);
  }
  if (doppioni) {
    _ultimiDuplicati = doppioni;
    /* Lo segno come condivisi cosi' non li cerco piu' da condividere e
       non li ricontrollo a ogni avvio. */
    try {
      const tutti = await dbAll();
      for (const r of tutti || []) {
        if (r && !r.condiviso && eGiaCondiviso({ ...r, profile: r.profile || DEFAULT_PROFILE })) {
          r.condiviso = true;
          try { await dbPut(r); } catch (e2) { /* pazienza */ }
        }
      }
    } catch (e3) { /* noop */ }
    segnalaErrore("libreria: nascosti " + doppioni + " doppioni (brani gia' condivisi)");
  }


  /* Stesso brano due volte? Ne tengo uno solo.
     Prima confrontavo "artista|titolo" alla lettera, ma la libreria ripulisce
     i nomi (toglie l'artista dal titolo se e' ripetuto: "BLANCO - SOTTOGONNA"
     si vede come "SOTTOGONNA"). Quindi lo stesso brano, arrivato dal telefono
     col titolo gia' pulito, non veniva riconosciuto e finiva in lista due
     volte. Adesso uso stessoBrano(), che e' la funzione gia' pensata per
     questo e che sa anche tirare l'artista fuori dal titolo. */
    const visti = [];
    const senzaDuplicati = [];
    for (const t of (added || [])) {
      let doppio = -1;
      for (let k = 0; k < senzaDuplicati.length; k++) {
        const g = senzaDuplicati[k];
        if (stessoBrano(t, g)) {
          doppio = k; break;
        }
      }
      if (doppio < 0) { senzaDuplicati.push(t); visti.push(t); continue; }
      /* tengo il brano piu' pesante: di solito e' quello intero */
      if ((t.size || 0) > (senzaDuplicati[doppio].size || 0)) senzaDuplicati[doppio] = t;
    }
  tracks = builtin.concat(senzaDuplicati);
    try {
      _diChe("libreria: " + tracks.length + " brani, scartati " +
        (BUILTIN.length - builtin.length) + " per eliminazione, profilo " + profile +
        ", chiavi eliminate " + Object.keys(eliminati).length);
    } catch (e) { /* noop */ }
    /* Ste: "la pagina di github e quella di tailscale non hanno le stesse
       canzoni". Non sapevo quale delle due avesse i brani e quale no, e
       senza questo ogni volta che lo chiedevo lui doveva contarle a mano.
       Adesso la libreria si annuncia da sola e io lo vedo sul computer. */
    try {
      _diChe("libreria: " + tracks.length + " brani, profilo " + profile +
        ", duplicati via " + senzaDuplicati.length +
        ", nascosti " + hiddenTracks.size + ", da " + String(location.host || "?"));
    } catch (e) { /* noop */ }
    /* I nomi li applico PRIMA di controllare i doppioni. Prima era il
       contrario: il controllo guardava il nome greudo del file ("Linkin Park -
       In the End") mentre la libreria mostra quello ripulito ("In the End"),
       quindi non li riconosceva come lo stesso brano e i duplicati
       restavano. */
    try { applicaRinomine(); } catch (e) { /* noop */ }
    /* Ultimo giro di controllo sulla lista COMPLETA (quella qui sopra
       guardava solo i brani del telefono, quindi due brani uguali arrivati
       da due posti diversi restavano entrambi). Uso stessoBrano(), la funzione
       gia' pensata per questo nel progetto. */
    tracks = _unisciDuplicatiLocali(tracks);
    /* I nomi che hai cambiato vanno messi DOPO che la lista e' stata
       ricostruita: prima li applicavo alla lista vecchia, che qui dentro
       veniva buttata via, e al riavvio il brano tornava col nome
       originale. */
    applicaRinomine();
    /* un brano che avevo segnato come "non scaricato" e' comparso in
       libreria: non lo riprovo piu' e lo tolgo dalla lista */
try { _pulisciFallitiRisolti(); } catch (e) { /* noop */ }
    try { _programmaRicercaCopertine(); } catch (e) { /* noop */ }
    try { _programmaTestiKaraoke(); } catch (e) { /* noop */ }
      try { _aggiornaBadgeFalliti(); } catch (e) { /* noop */ }
      /* Ste: "mi sono scomparse tutte le canzoni". Metto qui il numero vero
         dei brani caricati: se la libreria e' vuota lo vedo subito nel
         registro, senza dover dedurlo. */
      _segna("libreria pronta", tracks.length + " brani, profilo " + profile +
        ", ricerca " + (query ? '"' + query + '"' : "nessuna") +
        ", preferiti " + (favOnly ? "si" : "no") +
        ", mai ascoltati " + (soloMaiAscoltati ? "si" : "no") +
        ", playlist " + (_playlistAttiva || "nessuna"));
      render();
  }

  async function loadLyrics() {
    try {
      const res = await fetch("lyrics.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      lyricsData = await res.json();
      try { updateLyricsButton(); } catch (e) { /* noop */ }
      try { _programmaTestiKaraoke(); } catch (e) { /* noop */ }
    } catch (e) {
      console.warn("Testi non disponibili", e);
      lyricsData = {};
    }
  }

  /* Passa all'avvio su tutti i brani: chi non ha la copertina cerca di
     recuperarla da solo, e lascia traccia di quelli che restano scoperti
     (serve a me per capire quando manca qualcosa in covers.json). */
  /* ---------- "Scarica tutte le copertine mancanti" ----------
     Prima si recuperava una copertina alla volta, solo quando aprivi un brano:
     se ne mancavano 15 non te ne accorgevi e non le cercava mai.
     Adesso c'e' un bottone: cerca tutte quelle che mancano, una alla volta
     (per non fare troppe richieste in fila), e alla fine dice quante ne ha
     sistemate e quante non le ha trovate. */
  let _copertineInCorso = false;
  let _copertineAnnullate = false;

  function _elencoSenzaCopertina() {
    return tracks.filter((t) => !t || !t.cover || !String(t.cover).trim());
  }

  function _salvaCopertinaMia(t, blob, album) {
    try {
      const ora = tracks.find((x) => x.id === t.id);
      if (!ora) return;
      ora.cover = blob;
      if (album && !ora.album) ora.album = album;
      /* se il brano e' quello che sta suonando, la schermata di blocco
         del telefono deve aggiornarsi subito invece di aspettare il brano dopo */
      const oraInRiposo = current();
      if (oraInRiposo && oraInRiposo.id === t.id) updateMediaSession();
    } catch (e) { /* noop */ }
  }

  function _stampaCopertine(stato, testo, dettaglio) {
    const pannello = $("coverPanel");
    const corpo = $("coverCorpo");
    if (!pannello || !corpo) return;
    if ($("coverSub")) {
      $("coverSub").textContent = testo || "";
    }
    let html = "";
    if (stato === "lavoro") {
      html = '<div class="stat-lista"><div class="stat-item"><span>Copertine mancanti</span><b>' +
        (dettaglio && dettaglio.totale !== undefined ? dettaglio.totale : 0) + "</b></div>" +
        '<div class="stat-item"><span>Fatto</span><b>' + (dettaglio ? dettaglio.fatte : 0) + "</b></div>" +
        '<div class="stat-item"><span>Adesso sta cercando</span><b>' +
        (dettaglio && dettaglio.ora ? dettaglio.ora : "-") + "</b></div></div>";
    } else if (stato === "fine") {
      const d = dettaglio || { sistemate: 0, nonTrovate: 0, nomi: [] };
      html = '<div class="stat-lista">';
      html += '<div class="stat-item"><span>Sistemate</span><b>' + d.sistemate + "</b></div>";
      html += '<div class="stat-item"><span>Non trovate</span><b>' + d.nonTrovate + "</b></div>";
      html += "</div>";
      if (d.nomi && d.nomi.length) {
        html += '<h4>Non sono state trovate</h4><div class="stat-lista">';
        for (const n of d.nomi) html += '<div class="stat-item"><span>' + String(n).replace(/[<>]/g, "") + "</span><b>senza</b></div>";
        html += "</div>";
      }
    } else if (stato === "vuoto") {
      html = '<div class="stat-lista"><div class="stat-item"><span>Copertine mancanti</span><b>0</b></div></div>' +
        '<p class="nota" style="margin:8px 2px 0">Tutte le copertine ci sono gia.</p>';
    }
    corpo.innerHTML = html;
    pannello.hidden = false;
    syncNoScroll();
  }

  function _chiudiPannelloCopertine() {
    _copertineAnnullate = true;
    const pannello = $("coverPanel");
    if (pannello) pannello.hidden = true;
    syncNoScroll();
  }

  async function cercaTutteLeCopertine() {
    if (_copertineInCorso) return;
    const daCercare = _elencoSenzaCopertina();
    _copertineInCorso = true;
    _copertineAnnullate = false;
    try {
      if (!daCercare.length) {
        _stampaCopertine("vuoto", "Non manca nessuna copertina");
        return;
      }
      _stampaCopertine("lavoro", "Sto cercando " + daCercare.length + " copertine, non chiudere la pagina",
        { totale: daCercare.length, fatte: 0, ora: "" });
      let sistemate = 0;
      const nomi = [];
      for (let i = 0; i < daCercare.length; i++) {
        if (_copertineAnnullate) break;
        const t = daCercare[i];
        const nome = (t.artist || "?") + " - " + t.title;
        _stampaCopertine("lavoro", "Cerco " + (i + 1) + " di " + daCercare.length + "  (" + nome + ")",
          { totale: daCercare.length, fatte: sistemate, ora: nome });
        let presa = false;
        try {
          const c = await findCoverLocal(t.artist, t.title, t.spotifyId);
          if (c && c.cover) {
            const ir = await fetch(c.cover);
            if (ir.ok) {
              const blob = await ir.blob();
              _salvaCopertinaMia(t, blob, c.album);
              try { await dbPutCover({ id: t.id, cover: blob, album: c.album || "", title: t.title, artist: t.artist || "" }); } catch (e) { /* noop */ }
              presa = true;
            }
          }
        } catch (e) { /* noop */ }
        if (presa) sistemate++;
        else nomi.push(nome);
        /* ogni volta una pausa, cosi' iTunes (e i nostri programmi) non
           vengono martellati e la pagina resta reattiva */
        await new Promise((r) => setTimeout(r, 700));
      }
      render();
      _stampaCopertine("fine", "Fatto: " + sistemate + " sistemate, " + nomi.length + " non trovate",
        { sistemate: sistemate, nonTrovate: nomi.length, nomi: nomi.slice(0, 20) });
    } finally {
      _copertineInCorso = false;
    }
  }

  /* Scansione progressiva delle copertine mancanti, anche dei BUILTIN.
     Ricerca selettiva tramite iTunes/covers.json con controllo titolo/artista;
     risultati salvati su IndexedDB per questo dispositivo. */
  let _ricercaCopertineAttiva = false;
  let _ricercaCopertinePrevista = false;
  const _ricercaCopertineTentate = new Set();
  function _programmaRicercaCopertine() {
    if (_ricercaCopertineAttiva || _ricercaCopertinePrevista || !db || document.hidden) return;
    _ricercaCopertinePrevista = true;
    setTimeout(async () => {
      _ricercaCopertinePrevista = false;
      if (_ricercaCopertineAttiva || _copertineInCorso || document.hidden) return;
      _ricercaCopertineAttiva = true;
      const profiloIniziale = profile;
      let tentativi = 0, nuove = 0;
      try {
        for (const t of tracks.slice()) {
          if (profile !== profiloIniziale || document.hidden || tentativi >= 12) break;
          if (!t || t.cover || _ricercaCopertineTentate.has(t.id)) continue;
          _ricercaCopertineTentate.add(t.id);
          tentativi++;
          try {
            const c = await findCoverLocal(t.artist, t.title, t.spotifyId);
            if (!c || !String(c.cover || "").startsWith("https://")) continue;
            const target = tracks.find((x) => x.id === t.id && x.profile === t.profile);
            if (!target || target.cover) continue;
            target.cover = c.cover;
            if (!target.album) target.album = c.album || "";
            nuove++;
            try {
              await dbPutCover({ id: t.id, cover: c.cover,
                album: c.album || "", title: t.title, artist: t.artist || "" });
            } catch (e) { /* Mantiene la copertina della sessione. */ }
          } catch (e) { /* Non associare immagini se la ricerca non riesce. */ }
          await new Promise((r) => setTimeout(r, 1400));
        }
        if (nuove) render();
      } finally {
        _ricercaCopertineAttiva = false;
      }
      if (profile === profiloIniziale && !document.hidden &&
          tracks.some((t) => !t.cover && !_ricercaCopertineTentate.has(t.id))) {
        setTimeout(_programmaRicercaCopertine, 12000);
      }
    }, 5000);
  }
  try {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) _programmaRicercaCopertine();
    });
  } catch (e) { /* noop */ }

  function recuperaCopertineMancanti() {
    const senza = tracks.filter((t) => !t.cover);
    _programmaRicercaCopertine();
    if (!senza.length) return;
    for (const t of senza) {
      if (!t.builtin) {
        // ritrovo la copertina e ridisegno quando arriva, altrimenti
        // l'immagine resta vuota anche se poi e' stata trovata
        Promise.resolve(enrichTrack(t.id)).then((fatto) => {
          if (fatto) {
            const ora = tracks.find((x) => x.id === t.id);
            if (ora && !ora.cover) {
              const gia = coverInfo(ora.artist, ora.title);
              if (gia && gia.cover) {
                ora.cover = gia.cover;
                if (!ora.album) ora.album = gia.album || "";
                render();
              }
            }
          }
        }).catch(() => { /* noop */ });
      }
    }
    const dettaglio = senza.slice(0, 8).map((t) => {
      const k = normKey((t.artist || "") + " " + (t.title || ""));
      return (t.artist || "?") + " - " + t.title + " [chiave " + k + (coversData[k] ? ": c'è in covers.json" : ": ASSENTE") + "]";
    });
    segnalaErrore("senza copertina: " + senza.length + " -> " + dettaglio.join(" || "));
  }

  /* Brani per cui la copertina salvata in passato era DI UN ALTRO BRANO
     (per esempio "Eroina" di Kid Yugi aveva dentro la copertina di Alan
     Walker). La tolgo dal file delle copertine, ma il telefono e il
     computer hanno ancora dentro quella sbagliata: senza questa lista me la
     continuerebbero a mostrare. Preferisco non mostrare niente: una
     copertina assente si capisce, una sbagliata fa perdere tempo.
     Quando la copertina giusta arriva nel file, vince quella e questa lista
     non serve piu'. */
  const COPERTINE_NON_AFFIDABILI = [
    { artista: "Kid Yugi & Tutti Fenomeni", titolo: "Eroina" },
    { artista: "Kid Yugi, Tedua & Junior K", titolo: "Eva" },
    { artista: "madame", titolo: "l'anima" },
    { artista: "nayt", titolo: "Lastronauta (Visual)" },
    { artista: "Ferro di checov", titolo: "Kid Yugi x Nuts - Lil Peep" },
    { artista: "Nayt / Frah Quintale / Tony Boy", titolo: "CIGNO NERO RMX" }
  ];
  function copertinaNonAffidabile(artist, title) {
    for (const x of COPERTINE_NON_AFFIDABILI) {
      if (titoloDaProvare(artist, title).some((t) => titleMatch(t, x.titolo).score >= 60) &&
          artistaSimile(artist, x.artista)) return true;
    }
    return false;
  }

/* Ste: "le copertine non vengono aggiornate bene, e il coso che le
     aggiunge da solo non funziona". Il giro sul computer funziona (ha
     sistemato 11 copertine e 180 informazioni), ma il telefono rileggeva
     covers.json solo quando si apriva l'app: quindi le copertine nuove
     arrivavano sul sito e sul telefono restavano quelle vecchie fino alla
     prossima riapertura.

     Adesso l'app controlla ogni cinque minuti, e anche quando torni
     sull'app dopo aver fatto altro. Se il file e' cambiato ricarica la
     libreria e vedete subito le copertine nuove, senza toccare nulla. */
  let _copertineRilette = "";
  async function _ricaricaCopertineSeCambiano(motivo) {
    try {
      if (typeof loadCovers !== "function") return 0;
      const prima = _copertineRilette;
      await loadCovers();
      const dopo = JSON.stringify(coversData || {});
      if (dopo === prima) return 0;
      _copertineRilette = dopo;
      try { await loadAll(); } catch (e) { /* noop */ }
      render();
      return 1;
    } catch (e) { return 0; }
  }

  /* Cerca la copertina per ID Spotify, non per testo simile. */
  function _copertinaDelBuiltin(t) {
    if (t && t.spotifyId) {
      const exact = spotifyCoversData[t.spotifyId];
      if (exact && /^https:\/\//.test(String(exact.cover || ""))) return exact;
    }
    return coverInfo(t.artist, t.title);
  }
  async function _caricaCopertineSpotify() {
    try {
      const r = await fetch("covers-spotify.json?v=" + APP_VERSION, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      if (!j || typeof j !== "object" || Array.isArray(j)) return;
      spotifyCoversData = j;
      _applicaCopertineAlCatalogo();
    } catch (e) { /* Compatibile con le copie non ancora aggiornate. */ }
  }
  /* Aggiorna l'archivio quando rientri nell'app, senza cancellare le cache
     offline. Il primo caricamento continua ad avvenire in loadCovers(). */
  try {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) _caricaCopertineSpotify().catch(() => {});
    });
    setInterval(() => {
      if (!document.hidden) _caricaCopertineSpotify().catch(() => {});
    }, 300000);
  } catch (e) { /* Il recupero copertine e' opzionale. */ }

  /* Un'immagine scelta dall'utente rimane prioritaria; gli ID Spotify
     esatti sostituiscono solo le copertine trovate per approssimazione. */
  function _applicaCopertineAlCatalogo() {
    let n = 0;
    try {
      for (const t of tracks) {
        if (!t || t.userCover) continue;
        const sp = t.spotifyId ? spotifyCoversData[t.spotifyId] : null;
        const c = sp && sp.cover ? sp : (!t.cover ? coverInfo(t.artist, t.title) : null);
        if (!c || !c.cover || t.cover === c.cover) continue;
        t.cover = c.cover;
        if (!t.album) t.album = c.album || "";
        n++;
      }
      if (n) render();
    } catch (e) { /* Copertine opzionali. */ }
  }

  async function loadCovers() {
    try {
      /* Aggiungo il tempo alla richiesta: senza, il telefono può servire la
         copia vecchia del file e le copertine restano quelle sbagliate. */
      /* Ste: "le copertine non si caricano piu'" (e poi: "si caricano ma
         dopo tanto tempo").
         Motivo: la richiesta aveva un "?t=<ora>" dietro, e cosi' il file
         (130 KB) non era mai quello in cache: si riscaricava a ogni avvio,
         e sul telefono ci metteva un sacco di tempo.
         Adesso chiedo il file come sta (il worker del servizio lo serve
         dalla cache e in secondo piano lo aggiorna) e poi, se non basta,
         me lo prendo fresco dalla rete in secondo piano. */
      const res = await fetch("covers.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      coversData = await res.json();
      _applicaCopertineAlCatalogo();
      await _caricaCopertineSpotify();
        try { _copertineRilette = JSON.stringify(coversData); } catch (e2) { /* noop */ }
        try {
          setTimeout(async function () {
            try {
              const r2 = await fetch("covers.json?aggiornato=" + Date.now(), { cache: "no-store" });
              if (!r2.ok) return;
              const fresco = await r2.json();
              const nuovo2 = JSON.stringify(fresco);
              if (nuovo2 && nuovo2 !== _copertineRilette) {
                coversData = fresco;
                _copertineRilette = nuovo2;
                _applicaCopertineAlCatalogo();
                await _caricaCopertineSpotify();
                _segna("copertine aggiornate in secondo piano");
              }
            } catch (e3) { /* noop */ }
          }, 2500);
        } catch (e2) { /* noop */ }
    } catch (e) {
      try {
        const res = await fetch("covers.json");
        if (res.ok) {
          coversData = await res.json();
          _applicaCopertineAlCatalogo();
          await _caricaCopertineSpotify();
          try { _copertineRilette = JSON.stringify(coversData); } catch (e2) { /* noop */ }
          return;
        }
      } catch (e2) { /* noop */ }
      coversData = {};
    }
  }

  function stripArtistPrefix(artist, title) {
    const a = (artist || "").trim();
    const t = (title || "").trim();
    if (a && t.toLowerCase().startsWith(a.toLowerCase() + " - ")) return t.slice(a.length + 3).trim();
    return t;
  }

  function coverKey(artist, title) {
    return normKey((artist || "") + " " + stripArtistPrefix(artist, title));
  }

  /* Chiave "sporca", senza togliere cio' che c'e' tra parentesi: serve perche'
     il programma che scarica le copertine le chiama in un modo e io in
     un altro (per esempio "nayt - Poter scegliere - Nayt (Live)": qui
     diventa naytpotersceglierenayt, li' naytpotersceglierenaytlive).
     Se provo una sola forma, quelle copertine non le trovo mai. */
  function chiaveSemplice(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

/* Due artisti si somigliano se sono lo stesso nome scritto in modo un po'
     diverso ("Olivia Rodrigo" e "olivia rodriguo" sono lo stesso nome con un
     refuso). Confronto le lettere una a una: se sono diverse al massimo due,
     compresi i caratteri in piu' o in meno, e' lo stesso artista.
     Prima usavo un algoritmo complicato che sbagliava, e faceva scartare
     anche le copertine giuste. */
  function artistaSimile(a, b) {
    const x = normKey(a), y = normKey(b);
    if (!x || !y) return false;
    if (x === y) return true;
    if (x.indexOf(y) >= 0 || y.indexOf(x) >= 0) return true;
    const m = Math.min(x.length, y.length);
    if (m < 4) return false;
    let diversi = Math.abs(x.length - y.length);
    for (let i = 0; i < m; i++) {
      if (x.charAt(i) !== y.charAt(i)) diversi++;
      if (diversi > 2) return false;
    }
    return diversi <= 2;
  }

  /* Titoloni da provare quando cerco la copertina. In libreria i titoli sono
     messi in modo che a volte l'artista ci sta dentro ("SAITTA - Romantici
     Terroni", "Poter scegliere - Nayt (Live)"): se guardo solo il titolo
     intero non somiglia mai a quello del file delle copertine e il brano
     resta senza immagine. Provo quindi anche il titolo ripulito. */
  function titoliDaProvare(artist, title) {
    const out = [];
    const visti = [];
    /* Restituisco i titoli come sono, non gia' ridotti a una parola: il
       confronto con titleMatch ha bisogno delle parole vere. */
    const aggiungi = (v) => {
      const s = String(v || "").trim();
      const k = normKey(s);
      if (!k) return;
      for (const gia of visti) if (normKey(gia) === k) return;
      visti.push(s);
      out.push(s);
    };
    aggiungi(stripArtistPrefix(artist, title));
    aggiungi(String(title || "").replace(/\((live|visual|audio|official|remaster|explicit)[^)]*\)/gi, ""));
    const s = String(title || "");
    const i = s.lastIndexOf(" - ");
    if (i > 0) {
      aggiungi(s.slice(0, i));
      aggiungi(s.slice(i + 3));
    }
    aggiungi(title);
    return out;
  }

  function coverInfo(artist, title) {
    const senzaArtista = stripArtistPrefix(artist, title);
    /* Una voce di covers.json vale solo se parla davvero del brano che
       sto cercando. Il file a volte aveva la chiave giusta ma dentro i
       dati di un altro brano (es. la chiave di "Eroina" di Kid Yugi
       conteniva la copertina di "Eroina" di Alan Walker): senza questo
       controllo la app mostrava la copertina sbagliata senza accorgersene. */
    const buona = (c) => {
      if (!c || !c.cover) return false;
      if (normKey(artist) && !artistaSimile(artist, c.artist)) return false;
      if (normKey(title)) {
        let ok = false;
        for (const cand of titoliDaProvare(artist, title)) {
          const m = titleMatch(cand, c.title || "");
          if (m && m.score >= 60) { ok = true; break; }
        }
        if (!ok) return false;
      }
      return true;
    };
    /* Prima cerco con artista E titolo insieme: e' il modo giusto. */
    const varianti = [
      coverKey(artist, title),
      normKey((artist || "") + " " + (title || "")),
      chiaveSemplice((artist || "") + " " + (title || "")),
      chiaveSemplice((artist || "") + " " + senzaArtista)
    ];
    for (const k of varianti) {
      if (k && buona(coversData[k])) return coversData[k];
    }
    /* Poi, per il solo titolo: cosi' com'era prima, ma sempre controllando
       che l'artista sia davvero quello. */
    for (const k of [normKey(title || ""), chiaveSemplice(title || "")]) {
      if (k && buona(coversData[k])) return coversData[k];
    }
    return null;
  }

  async function loadLocalLyrics() {
    localLyrics = {};
    try {
      const rows = await dbAllLyrics();
      for (const r of rows) {
        /* Questo record non e' un testo: qui ci tengo anche i nomi dei brani
           che Ste ha cambiato (vedi _salvaRinomineSulDisco), e non devono
           finire fra i testi. */
        if (!r || r.id === _ID_RINOMI) continue;
        localLyrics[r.id] = { title: r.title, artist: r.artist || "", text: r.text, synced: r.synced || "", source: r.source || "" };
      }
    } catch (e) {
      localLyrics = {};
    }
  }

  function hashId(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  /* ---------- Rendering ---------- */
  function filterText(t) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function wordsOf(s) {
    return filterText(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  }

  function matchScore(q, t) {
    const all = wordsOf(q);
    const words = all.filter((w) => w.length >= 2);
    if (!words.length) {
      const nq = normKey(q);
      if (!nq) return 0;
      const hay = normKey(t.title + " " + t.artist);
      return hay.indexOf(nq) >= 0 ? 5 : -1;
    }
    const tw = wordsOf(t.title);
    const aw = wordsOf(t.artist);
    const hay = tw.concat(aw);
    let score = 0;
    for (const w of words) {
      if (tw.some((x) => x === w)) score += 4;
      else if (w.length >= 3 && tw.some((x) => x.length >= 3 && (x.startsWith(w) || w.startsWith(x)))) score += 3;
      else if (aw.some((x) => x === w)) score += 2;
      else if (w.length >= 3 && aw.some((x) => x.length >= 3 && (x.startsWith(w) || w.startsWith(x)))) score += 1;
      else if (w.length >= 3 && hay.some((x) => x.indexOf(w) >= 0)) score += 0.5;
      else return -1;
    }
    if (filterText(t.title) === filterText(q)) score += 12;
    if (t.artist && filterText(t.artist) === filterText(q)) score += 12;
    if (words.length === 1 && score >= 3) score += 1;
    return score;
  }

  /* Come raggruppo i brani per artista: gli accenti e la punteggiatura non
     devono creare gruppi diversi ("Kid Yugi" e "kid yugi" sono lo stesso),
     e i feat non devono spargere un brano in due gruppi. */
  function gruppoArtista(t) {
    let a = String(t.artist || "").trim();
    if (!a) {
      /* senza artista, provo a toglierlo dal titolo ("Nayt - Esce") */
      const m = /^([^-]{2,40})\s+-\s+(.+)$/.exec(String(t.title || ""));
      if (m) a = m[1];
    }
    if (!a) return "zzz";
    return normParole(a.split(/\s*(?:,|feat|ft|&|x|e)\s+/i)[0]) || "zzz";
  }
  function titoloOrdinato(t) {
    return normKey(t.title);
  }
const ORDINAMENTI = [
  { id: "artista", nome: "Per artista" },
  { id: "titolo", nome: "Per titolo" },
  { id: "aggiunti", nome: "Piu' recenti" },
  { id: "ascoltati", nome: "Piu' ascoltati" },
  { id: "maiascoltati", nome: "Meno ascoltati" }
  ];

  /* Quante volte e per quanti secondi ho ascoltato un brano: me lo dice la
     scheda di ascolto dello stesso brano. Se non c'e' scheda, il brano non
     l'ho ancora ascoltato (quindi 0). */
  function _ascoltoDi(t) {
    try {
      if (!t) return { v: 0, s: 0 };
      const c = _chiaveStats(t);
      if (!c) return { v: 0, s: 0 };
      const r = statisticheProfilo()[c];
      return { v: (r && r.v) || 0, s: (r && r.s) || 0 };
    } catch (e) { return { v: 0, s: 0 }; }
  }
  function ordinaLista(lista) {
    if (ordinamento === "titolo") {
      return lista.slice().sort((a, b) => titoloOrdinato(a) < titoloOrdinato(b) ? -1 : 1);
    }
    if (ordinamento === "aggiunti") {
      return lista.slice().sort((a, b) => (b.aggiunto || 0) - (a.aggiunto || 0));
    }
    /* Ordinamento per ascolto: nel primo i piu' sentiti in cima, nel
       secondo i meno sentiti in cima. Chi non hai ancora ascoltato va
       fuori dai due gruppi (dopo se ordini per "piu' ascoltati", prima se
       ordini per "meno ascoltati"): cosi' i mai ascoltati non si
       mescolano con gli altri e restano riconoscibili. */
    if (ordinamento === "ascoltati" || ordinamento === "maiascoltati") {
      const su = ordinamento === "ascoltati";
      const dentro = lista.filter((t) => _ascoltoDi(t).s > 0);
      const fuori = lista.filter((t) => _ascoltoDi(t).s <= 0);
      const perTempo = dentro.slice().sort((a, b) => {
        const x = _ascoltoDi(a);
        const y = _ascoltoDi(b);
        const d = y.s - x.s;
        if (d !== 0) return su ? d : -d;
        if (y.v !== x.v) return su ? (y.v - x.v) : (x.v - y.v);
        return (a.artist || "") < (b.artist || "") ? -1 : 1;
      });
      return su ? perTempo.concat(fuori) : fuori.concat(perTempo);
    }
    /* Default: tutti i brani di un artista di fila, gli artisti in ordine
       alfabetico, e dentro ogni gruppo i brani per titolo. Cosi' i 5 brani
       di Nayt stanno insieme, poi i 5 di Kid Yugi, e se aggiungo un brano
       nuovo di un artista gia' presente finisce nel suo gruppo da solo. */
    return lista.slice().sort((a, b) => {
      const ga = gruppoArtista(a), gb = gruppoArtista(b);
      /* I brani di cui proprio non so l'artista vanno in cima: finendo col
         gruppo "zzz" erano in fondo alla lista e sembravano spariti (e'
         successo con un file messo dal telefono). Gli altri artisti restano
         in ordine alfabetico come prima. */
      const sa = ga === "zzz";
      const sb = gb === "zzz";
      if (sa !== sb) return sa ? -1 : 1;
      if (ga !== gb) return ga < gb ? -1 : 1;
      const ta = titoloOrdinato(a), tb = titoloOrdinato(b);
      if (ta !== tb) return ta < tb ? -1 : 1;
      return String(a.title || "") < String(b.title || "") ? -1 : 1;
    });
  }
  /* I brani che l'utente ha deciso di tenere FUORI dalla libreria ma dentro
     una playlist. Non somigliano ai brani nascosti col menu "Togliere dalla
     lista": quelli spariscono davvero, questi restano suonabili e si vedono
     solo quando apri la playlist che li contiene.

     Motivo (l'ha chiesto Stefano): voleva le canzoni della playlist gym
     non mischiate con le altre, ma senza perderle. */
  const LS_PLA = "mb.braniInPlaylist";
  function _braniSoloInPlaylist() {
    try {
      const v = LS.get(LS_PLA, "");
      return new Set(String(v || "").split(",").map((x) => x.trim()).filter(Boolean));
    } catch (e) { return new Set(); }
  }
  /* Non perdo le scelte gia' fatte su questo telefono: le unisco a quelle
     che arrivano dalle playlist condivise. */
  let _soloInPlaylist = _ricalcolaSoloInPlaylist();

  function _salvaSoloInPlaylist() {
    try { LS.set(LS_PLA, [..._soloInPlaylist].join(",")); } catch (e) { /* noop */ }
  }

  /* I brani nascosti si decidono una volta sola e valgono OVUNQUE.

     Prima la scelta stava solo nella memoria di quel telefono: aperto il sito
     nel browser (che ha una memoria tutta sua), la libreria mostrava di nuovo
     i 13 brani di gym e poteva partire una canzone della playlist mentre Ste
     stava ascoltando la libreria. Adesso la scelta viaggia insieme alla
     playlist, quindi browser e telefono la vedono uguale. */
  function _nascostiDallePlaylist() {
    const fuori = new Set();
    for (const pl of (playlists || [])) {
      if (!pl || pl.nascosta !== true) continue;
      for (const id of (pl.tracks || [])) fuori.add(id);
    }
    return fuori;
  }

  /* Ricalcola i nascosti: ci metto dentro sia quelli decisi qui sia quelli
     arrivati con le playlist dagli altri dispositivi.
     Restituisce la lista nuova invece di assegnarla: questa funzione viene
     chiamata anche mentre _soloInPlaylist si sta inizializzando, e se
     assegnasse qui il browser si fermerebbe con "Cannot access before
     initialization". */
  function _ricalcolaSoloInPlaylist() {
    return new Set([..._braniSoloInPlaylist(), ..._nascostiDallePlaylist()]);
  }

  /* Ste: "226 da entrambe le parti, poi 227 su github a caso".
   I brani "solo nelle playlist" stanno in una lista salvata nel telefono,
   quindi ogni link ne aveva una diversa: e il numero di brani in libreria
   cambiava di uno a caso, a seconda di quale dei due link veniva aperto.

   Adesso anche questa lista viaggia col resto dei dati, come i nascosti:
   si manda quello che ho messo adesso, e i "togli" viaggiano a parte. */

function _soloInPlaylistDaMandare() {
  try {
    const v = LS.get("mb.soloInPlaylistDaMandare", null);
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function _soloInPlaylistSegna(id, via) {
  try {
    const m = _soloInPlaylistDaMandare();
    if (via && id && m.indexOf(id) < 0) m.push(id);
    LS.set("mb.soloInPlaylistDaMandare", m);
  } catch (e) { /* noop */ }
}
function _soloInPlaylistDaMandareSvuota() {
  try { LS.set("mb.soloInPlaylistDaMandare", []); } catch (e) { /* noop */ }
}
function _soloInPlaylistRimossiDaMandare() {
  try {
    const v = LS.get("mb.soloInPlaylistRimossi", null);
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function _soloInPlaylistRimossaSegna(id) {
  try {
    const m = _soloInPlaylistRimossiDaMandare();
    if (id && m.indexOf(id) < 0) m.push(id);
    LS.set("mb.soloInPlaylistRimossi", m);
  } catch (e) { /* noop */ }
}
function _soloInPlaylistRimossiSvuota() {
  try { LS.set("mb.soloInPlaylistRimossi", []); } catch (e) { /* noop */ }
}

  /* La chiave di un brano "solo in playlist" porta con se' il profilo.
     Ste: "si sono tolte 2 canzoni nell'account di diego": la lista era
     globale, e i brani che Ste tiene in una playlist sparivano anche dalla
     libreria di Diego (che contiene gli stessi brani condivisi).
     Ora ogni account vede solo le proprie scelte. */
  function _chiaveSoloInPlaylist(id, profilo) {
    return String(profilo || profile || "Ste") + "." + String(id || "");
  }

  /* Mette un brano "solo nella playlist": sparisce dalla libreria ma
     continua a esistere e a suonare dentro la sua playlist.

     Ste: "le ho fatte restare solo nella playlist gym, sono scomparse ma
     sono tornate".
     Motivo: qui il brano veniva segnato SIA fra quelli da mandare SIA fra
     quelli da togliere, e il server, quando vede un brano in entrambe le
     liste, lo toglie: quindi la lista si annullava da sola e il brano
     tornava in libreria.

     Ora: se metto un brano "solo in playlist", lo mando in quella lista e
     lo TOLGO da quella dei "da togliere". Viceversa se lo rimetto in
     libreria, lo mando fra quelli da togliere. */
  function _mettiSoloInPlaylist(id) {
    if (!id) return false;
    const chiave = _chiaveSoloInPlaylist(id);
    _soloInPlaylist.add(chiave);
    _salvaSoloInPlaylist();
    _soloInPlaylistSegna(chiave, true);
    /* non lo metto fra quelli da togliere: altrimenti si annullano. */
    try {
      const m = _soloInPlaylistRimossiDaMandare().filter(function (x) { return x !== chiave; });
      LS.set("mb.soloInPlaylistRimossi", m);
    } catch (e) { /* noop */ }
    return true;
  }
  function _togliSoloInPlaylist(id) {
    if (!id) return false;
    const chiave = _chiaveSoloInPlaylist(id);
    /* provo a toglierlo anche se c'e' con la chiave vecchia */
    _soloInPlaylist.delete(chiave);
    _soloInPlaylist.delete(id);
    _salvaSoloInPlaylist();
    _soloInPlaylistRimossaSegna(chiave);
    return true;
  }

function visibleTracks(perSuono) {
      /* "perSuono" = sto cercando la canzone che viene DOPO (non sto solo
         sfogliando la lista). Valgono le stesse regole del resto, con una
         differenza: le canzoni degli altri NON entrano, a meno che non
         abbia premuto "fai suonare anche le canzoni degli altri".

         Ste ha chiarito: se sto ascoltando dalla libreria, in coda vanno solo
         canzoni della libreria. E se sto dentro una playlist, in coda vanno
         solo canzoni di quella playlist (com'e' gia', perche' sotto il filtro
         della playlist non ci sono le altre).

         Le canzoni che ho copiato nella mia libreria invece sono ormai mie e
         suonano, anche se le ha aggiunte qualcun altro. */
      const perLaCoda = Boolean(perSuono);
      /* I brani "solo in playlist" escono dalla libreria, tranne quando sto
         guardando proprio una playlist: li' devono comparire.

         Ste: "si sono tolte 2 canzoni nell'account di diego".
         Motivo: questa lista era GLOBALE. Le canzoni che Ste tiene in una
         playlist sparivano anche dalla libreria di Diego, che contiene gli
         stessi brani condivisi.

         Ora la chiave porta con se' il profilo, come per i brani eliminati:
         ogni account vede solo le proprie scelte. */
      const inPlaylist = _soloInPlaylist;
      const inPlaylistDi = function (id) {
        return inPlaylist.has(_chiaveSoloInPlaylist(id)) ||
          /* le chiavi vecchie (senza profilo) erano globali: le metto con
             l'account principale, cosi' non toccano gli altri. */
          (inPlaylist.has(id) && !String(id).indexOf(".") && id);
      };
      /* Ste: "togli completamente sta cosa dei nascosti": non c'e' piu'
         nessun filtro sui brani nascosti. Quello che resta e' quello dei
         brani "solo nelle playlist" (una scelta diversa, che resta). */
      let list = tracks.filter((t) =>
        (!inPlaylistDi(t.id) || Boolean(_playlistAttiva)));
      /* Per la coda: niente canzoni degli altri, se non me l'ha chiesto. */
if (perLaCoda) {
      /* Per la coda contano le canzoni del profilo aperto e quelle che ho
         copiato nella mia libreria. Ste ha tolto l'interruttore "fai suonare
         anche le canzoni degli altri": non serve piu', perche' le canzoni di
         un amico le vedi e le scegli entrando nel suo profilo. */
      const miei = _mieiCopiati();
      list = list.filter((t) => (t.profile || DEFAULT_PROFILE) === profile || miei.has(t.id));
    }
    if (favOnly) list = list.filter((t) => favorites.has(t.id));
    if (soloMaiAscoltati) list = list.filter((t) => _ascoltoDi(t).s <= 0);
    /* Solo le canzoni scaricate: si guardano davvero in tutte le cache, come
       fa il worker del servizio quando serve un brano. */
    if (soloScaricate) list = list.filter((t) => isCached(t));
    /* Se ho scelto una playlist, vedo solo i suoi brani. Funziona insieme
       alla ricerca e all'ordinamento, non al posto loro: e' quello che
       chiedeva Stefano ("come la libreria, ma solo le canzoni di
       quella playlist"). */
if (_playlistAttiva) {
    const pl = _playlistCercata(_playlistAttiva);
    const id = pl ? pl.id : null;
    if (id) list = list.filter((t) => (pl.tracks || []).includes(t.id));
    else if (_playlistAttiva) list = [];
  }

  /* Ste: "su github ci sono 231 brani, su tailscale 237". I brani ci sono
     tutti e due i posti (250 e 250): cambia quello che viene MOSTRATO,
     perche' playlist attiva, "solo preferiti", "mai ascoltati" e ricerca
     sono scelte dell'istantaneo, e il browser le tiene da parte per ogni
     link. Quindi aprire un link diverso da quello che usavi prima mostra
     un altro pezzo di libreria.

     Adesso me lo dico da solo, invece di chiedertelo ogni volta. */
  if (!perLaCoda && !query) {
    try {
      _diChe("visibili " + list.length + " su " + tracks.length +
        " | nascosti " + hiddenTracks.size +
        " | playlist attiva " + (_playlistAttiva ? _playlistAttiva : "nessuna") +
        " | solo preferiti " + (favOnly ? "si" : "no") +
        " | mai ascoltati " + (soloMaiAscoltati ? "si" : "no") +
        " | da " + String(location.host || "?"));
    } catch (e) { /* noop */ }
  }
    if (!query) return ordinaLista(list);
    const scored = [];
    for (const t of list) {
      const s = matchScore(query, t);
      if (s >= 0) scored.push({ t, s });
    }
    /* durante la ricerca l'ordine piu' utile e' quanto somigliano al testo
       scritto, quindi qui non riordino per artista */
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.t);
  }


  /* Se un brano e' stato tolto dalla lista DEVE esserci un modo per rimetterlo:
     prima la funzione c'era ma non era collegata a nessun tasto, quindi un brano
     nascosto spariva per sempre (e' capitato: la lista sembrava avesse un brano
     in meno e non si capiva il perche'). */
  /* ---------- I brani tolti dalla lista, uno alla volta ----------
     Ste: il bottone rimetteva TUTTI i brani tolti insieme, e a lui serviva
     poterne rimettere anche uno solo. Qui ogni brano ha il suo bottone. */

  /* Il brano nascosto con questo id (null se non esiste piu'). */
  /* Riscrive il pannello con quello che c'e' adesso (dopo aver rimesso un
     brano la lista si accorcia, e devo dirlo). */
  /* Rimette in lista UN brano solo. */
  /* Ste: "nella lista dei brani nascosti metti una x che elimina il brano
     per sempre".Diverso dal "Rimetti in lista": quello lo riporta indietro,
     questo lo butta via. Percio' prima gli chiedo SEMPRE conferma, e gli
     dico esattamente cosa sto facendo: non cancello niente per sbaglio. */
/* Ste: "togli completamente sta cosa dei nascosti... quando elimino una
   canzone si elimini direttamente per sempre chiedendo pero' una conferma".

   Questa e' l'unica maniera di togliere un brano adesso. Prima c'era
   "Nascondi" (che lo faceva sparire e poi tornava) e la X (che valeva solo
   per i brani nascosti). Adesso c'e' solo "Elimina": chiede conferma, e
   il brano sparisce per davvero, su tutti i link.

   La lista dei brani eliminati ("mb.eliminati") viaggia col resto dei
   dati, quindi quello che elimino qui sparisce anche su github e su
   tailscale. */
async function _eliminaBrano(id) {
  if (!id) return;
  const t = tracks.find((x) => x && x.id === id);
  if (!t) return;
  const nome = String(t.title || "questo brano");
  const chi = t.artist ? String(t.artist) : "";
  const testo = chi ? nome + " di " + chi : nome;

  /* Ste: "quando mi chiede la conferma per eliminarlo deve chiedere pure
     se voglio solo toglierlo dalla libreria o anche dalla playlist se e'
     in una playlist".

     Prima la domanda sulla playlist veniva chiesta solo se il computer
     rispondeva, e comunque DOPO aver gia' fatto il lavoro. Adesso la
     chiedo per prima, e la conferma finale viene dopo. */
  const nellePlaylist = _playlistCheContengono(id);
  let ancheDallePlaylist = false;
  if (nellePlaylist.length) {
    /* Ste: "se premo 'solo dalla libreria' mi dice che lo elimina da tutto".
       Le scelte del dialogo hanno questi significati:
         - "Solo dalla libreria"  -> esce dalla libreria, RESTA nelle playlist
         - "Da entrambi"          -> esce da entrambe e viene cancellato
       Prima le contavo al contrario, e la conferma finale diceva la cosa
       sbagliata. */
    const scelta = await _scegliCosaTogliere(id, t.title || "", true, true);
    if (!scelta) return;                 /* annullato: non faccio niente */
    ancheDallePlaylist = scelta === "entrambe";
  }

  /* La conferma finale deve dire ESATTAMENTE quello che succede. */
  const cosa = ancheDallePlaylist
    ? "Il brano sparisce dalla libreria E dalle playlist, viene cancellato dal sito e non si recupera piu'."
    : (nellePlaylist.length
      ? "Il brano sparisce dalla libreria, ma RESTA nelle playlist e nel sito."
      : "Il brano sparisce dalla libreria, viene cancellato dal sito e non si recupera piu'.");
  if (!confirm("Vuoi davvero ELIMINARE:\n\n" + testo +
    "\n\n" + cosa + "\n\nVuoi continuare?")) return;

  /* Se resta nelle playlist non e' un'eliminazione: il brano esce dalla
     libreria e basta. */
  if (!ancheDallePlaylist && nellePlaylist.length) {
    try {
      _mettiSoloInPlaylist(id);
      _salvaSoloInPlaylist();
      /* Ste: "le ho fatte restare solo nella playlist gym, sono scomparse
         ma sono tornate".
         Motivo: qui chiamavo una funzione che non esisteva
         ("_salvaSoloInPlaylistDaMandare"). L'errore finiva nel catch e il
         brano non veniva messo nella lista dei "solo in playlist": quindi
         tornava in libreria.
         Quella che esiste e' _soloInPlaylistSegna, che segna il brano da
         mandare al server. */
      _soloInPlaylistSegna(id, true);
      _soloInPlaylistRimossaSegna(id);
      _salvaStatoCondiviso();
      saveCurrentState();
      render();
      toast(nome + ": tolto dalla libreria, resta nelle playlist", 5000);
    } catch (e) {
      try { toast("Non sono riuscito a toglierlo dalla libreria: " +
        String((e && e.message) || "errore"), 5000); } catch (x) {}
    }
    return;
  }

  /* Segno che e' eliminato per sempre: la libreria viene ricostruita da
     capo, e senza questo segno il brano rientrerebbe. Lo segno PRIMA di
     parlare col computer, cosi' l'eliminazione vale anche se il computer
     non risponde: e' un'informazione che viaggia col resto dei dati.

     Ste: "mi dice 'il programma sul computer non e' raggiungibile... il
     brano tornera' alla prossima apertura'". La seconda frase era FALSA:
     il brano non torna piu', perche' ora l'eliminazione viaggia sul
     server. Quello che resta sul computer e' solo il file mp3, e lo
     cancellera' il computer stesso quando si rimette in contatto. */
  try {
    const el = LS.get("mb.eliminati", null) || {};
    el[_chiaveEliminato(id)] = Date.now();
    LS.set("mb.eliminati", el);
    _eliminatiDaMandareSegna(_chiaveEliminato(id));
    _diChe("ELIMINO: " + _chiaveEliminato(id) + " (elenco ora " + Object.keys(el).length + ")");
  } catch (e) { /* noop */ }

  /* E se il computer e' acceso, provo a cancellare anche il file mp3: e' la
     cancellazione vera, non solo "non lo vedo piu'".
     Se il computer non risponde, NON e' un errore: la canzone sparisce
     lo stesso, e il file resta li' fino a che il computer si rimette in
     contatto. Prima qui usciva un avviso spaventoso e la cancellazione
     non veniva fatta. */
  let fileCancellato = false;
  let computerRaggiunto = false;
  try {
    computerRaggiunto = await ponteOnline();
  } catch (e) { computerRaggiunto = false; }
  if (computerRaggiunto) {
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const cheCartella = cartellaDi(profile) || "ste";
      const t = tracks.find((x) => x && x.id === id);
      const url = (t && t.file) ? String(t.file) : ("songs/track-" + String(id).replace(/^b-track-/, "") + ".mp3");
      const r = await fetch(base + "/elimina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: url, cartella: cheCartella, pubblica: true })
      });
      fileCancellato = !!(r && r.ok);
    } catch (e) { fileCancellato = false; }
  }
  /* Se il file non l'ho potuto cancellare adesso, lo metto in lista e lo
     riprovo quando il computer si rimette in contatto. */
  if (!fileCancellato) {
    try {
      const t = tracks.find((x) => x && x.id === id);
      const url = (t && t.file) ? String(t.file) : ("songs/track-" + String(id).replace(/^b-track-/, "") + ".mp3");
      _pendenteCancellazioneAggiungi(url, cartellaDi(profile) || "ste");
    } catch (e) { /* noop */ }
  }

  /* Tolgo il brano dalla libreria e dalle playlist. */
  try {
    const i = tracks.findIndex((x) => x && x.id === id);
    if (i >= 0) tracks.splice(i, 1);
  } catch (e) { /* noop */ }
  try {
    if (ancheDallePlaylist) {
      for (const p of nellePlaylist) {
        const pl = _playlistCercata(p);
        if (pl) pl.tracks = (pl.tracks || []).filter((x) => x !== id);
      }
    }
    saveCurrentState();
    _salvaPlaylistCondivise();
  } catch (e) { /* noop */ }

  try { saveCurrentState(); } catch (e) { /* noop */ }
  try { _salvaStatoCondiviso(); } catch (e) { /* noop */ }
  try { render(); } catch (e) { /* noop */ }
  /* Il messaggio dice quello che e' successo davvero. */
  try {
    toast(fileCancellato
      ? "Eliminato per sempre: " + nome + " (file e brano)"
      : (computerRaggiunto
        ? "Brano eliminato: " + nome + ". Il file sul computer non l'ho potuto cancellare"
        : "Brano eliminato: " + nome + ". Il computer non era raggiungibile, quindi il file mp3 resta li' ma la canzone non torna piu'"), 7000);
  } catch (e) { /* noop */ }
}

  /* Le cancellazioni che non sono riuscite perché il computer non c'era.
     Ste: "il programma sul computer non e' raggiungibile... il file mp3
     resta sul computer". Ora la canzone sparisce comunque, ma il file
     no: e' giusto aspettare che il computer si rimetta in contatto per
     cancellare anche quello. Però se non lo faccio, il file resta li' per
     sempre. Quindi lo metto in una lista e lo riprovo. */
  function _pendentiCancellazione() {
    try {
      const v = LS.get("mb.pendentiCancellazione", null);
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function _pendenteCancellazioneAggiungi(file, cartella) {
    try {
      if (!file) return;
      const m = _pendentiCancellazione();
      const gia = m.some((x) => x && x.file === file && x.cartella === cartella);
      if (!gia) m.push({ file: String(file), cartella: String(cartella || "ste"), quando: Date.now() });
      LS.set("mb.pendentiCancellazione", m);
    } catch (e) { /* noop */ }
  }
  async function _provaCancellazioniPendenti() {
    const m = _pendentiCancellazione();
    if (!m.length) return;
    let base = "";
    try { base = (await trovaPonte()) || INDIRIZZI_PONTE[0]; } catch (e) { return; }
    if (!base) return;
    const rimaste = [];
    for (const p of m) {
      let ok = false;
      try {
        const r = await fetch(base + "/elimina", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: p.file, cartella: p.cartella, pubblica: true })
        });
        ok = !!(r && r.ok);
      } catch (e) { ok = false; }
      if (!ok) rimaste.push(p);
    }
    try { LS.set("mb.pendentiCancellazione", rimaste); } catch (e) { /* noop */ }
    if (m.length !== rimaste.length) {
      try { toast("Cancellati " + (m.length - rimaste.length) + " file che erano rimasti sul computer"); } catch (e) {}
    }
  }

  /* Rende pubblici i brani che esistono solo su questo dispositivo, e lo fa
     DA SOLO: non c'e' un tasto da premere. Ogni brano importato a mano resta
     nel browser da cui l'hai importato, quindi senza questo non lo vedresti
     dagli altri dispositivi. Chiamo questa funzione all'avvio e ogni volta
     che finisce un import, cosi' non ci resta niente da fare a mano.

     I brani senza file (per esempio solo un'anteprima o un link) non si
     possono condividere: non c'e' niente da mandare. */
  let _ultimaCondivisione = 0;
let _condivisioneHaCambiato = false;
let condivisioneInCorso = false;
  /* Segna che sto condividendo un brano appena aggiunto dalla pagina: serve per
   dire "e' rimasto solo qui" se il computer non risponde. */
let _recentementeAggiunto = false;

async function condividiBraniLocali(forzato) {
    _diag("condividiBraniLocali");
    /* Ste: "si continua ad aggiornare". Misurando ho visto che questa funzione
       veniva richiamata ogni 9-10 secondi e ogni volta ridisegnava tutta la
       libreria: la lista si riordinava, lo scorrimento tornava su e la musica
       ripartiva. Nessun timer da 10 secondi esiste, quindi era una catena di
       tentativi che non finiva. Con questo blocco due cose smettono:
       non parte piu' di una volta ogni 15 secondi, e la lista si ridisegna
       solo se c'era davvero qualcosa da condividere. */
    if (!forzato) {
      if (Date.now() - _ultimaCondivisione < 15000) return;
    }
    _ultimaCondivisione = Date.now();
    if (condivisioneInCorso) return;
    if (!db) return;
    condivisioneInCorso = true;
    const ind = $("shareInd");
    const badge = $("shareBadge");
    try {
      let daMandare = [];
      let senzaFile = 0;
      let giaCondivisi = 0;
      try {
        const tutti = await dbAll();
        /* Un brano che esiste gia' nella libreria condivisa non lo rimando:
           si aggiornerebbe da solo e rischierei di crearne un secondo. */
        const utili = (tutti || []).filter((r) => r && !r.condiviso);
        for (const r of utili) {
          if (eGiaCondiviso({ ...r, profile: r.profile || DEFAULT_PROFILE })) {
            giaCondivisi++;
            _condivisioneHaCambiato = true;
            r.condiviso = true;
            try { await dbPut(r); } catch (e3) { /* non e' grave */ }
            continue;
          }
          if (r.blob && r.blob.size) daMandare.push(r);
          else senzaFile++;
        }
      } catch (e) {
        segnalaErrore("condivisione: lettura brani fallita: " + String((e && e.message) || e).slice(0, 120));
        return;
      }
      _ultimiSenzaFile = senzaFile;
      if (giaCondivisi) {
        segnalaErrore("condivisione: " + giaCondivisi + " brani erano gia' nella libreria condivisa");
      }
      if (senzaFile) {
        segnalaErrore("condivisione: " + senzaFile + " brani senza file, non condivisibili");
      }
      if (!daMandare.length) {
        if (ind) ind.hidden = true;
        return;
      }
      const online = await ponteOnline();
      if (!online) {
        /* Il PC non c'e': non e' un errore, lascio i brani qui e riprovo
           al prossimo avvio. Non disturbo l'utente con un avviso. */
        if (ind) ind.hidden = true;
        /* Se pero' ho appena aggiunto un brano adesso, dico dove sta: prima
           l'utente lo cercava nella libreria (sul computer) e non lo
           trovava, perche' intanto era rimasto solo qui. */
        if (daMandare.length && _recentementeAggiunto) {
          _recentementeAggiunto = false;
          toast("Brano aggiunto solo a questo telefono: il computer non risponde, quindi non e' andato nella libreria");
        }
        return;
      }
      _recentementeAggiunto = false;
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      if (ind) {
        ind.hidden = false;
        ind.classList.add("busy");
        ind.title = "Sto condividendo " + daMandare.length + " brani con gli altri dispositivi";
      }
      let fatti = 0;
      let falliti = 0;
      for (const r of daMandare) {
        const nome = [(r.artist || ""), (r.title || "")].join(" - ")
          .replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim() || "brano";
        try {
          const risp = await fetch(base + "/salva?nome=" + encodeURIComponent(nome) +
            "&cartella=" + encodeURIComponent(CARTELLA_PREDEFINITA), {
            method: "POST",
            headers: { "Content-Type": "audio/mpeg" },
            body: r.blob
          });
          if (!risp.ok) throw new Error("il programma ha risposto " + risp.status);
          r.condiviso = true;
          _condivisioneHaCambiato = true;
          try { await dbPut(r); } catch (e2) { /* va bene anche senza riscrivere */ }
          fatti++;
          if (badge) badge.textContent = String(daMandare.length - fatti - falliti);
        } catch (e) {
          falliti++;
          segnalaErrore("brano non condiviso (" + nome.slice(0, 40) + "): " +
            String((e && e.message) || e).slice(0, 120));
        }
      }
      if (ind) ind.classList.remove("busy");
      toast(falliti
        ? "Condivisi " + fatti + " brani, " + falliti + " non riusciti"
        : "Condivisi " + fatti + (fatti === 1 ? " brano" : " brani") + ": ora si vedono anche sugli altri dispositivi");
      segnalaErrore("condivisione finita: " + fatti + " condivisi, " + falliti + " falliti, " + senzaFile + " senza file");
    } finally {
      condivisioneInCorso = false;
      /* Prima qui c'era render() SEMPRE, anche quando non era successo niente:
         e' quello che faceva saltare la lista ogni 10 secondi. Ora ridisegno
         solo se ho davvero condiviso o cambiato qualcosa. */
      if (_condivisioneHaCambiato) {
        _condivisioneHaCambiato = false;
        _salvaPuntoLibreria();
        render();
        _ripristinaPuntoLibreria();
      }
    }
  }

  /* Aggiorna l'indicatore: dice quanti brani privati ci sono ancora da
     condividere, e sparisce quando non ne resta nessuno. */
  function aggiornaIndicatoreCondivisione() {
    const ind = $("shareInd");
    const badge = $("shareBadge");
    if (!ind) return;
    const privati = tracks.filter((t) => !t.builtin && !t.preview && !eGiaCondiviso(t)).length;
    const daCondividere = privati > 0;
    ind.hidden = !daCondividere && !condivisioneInCorso;
    if (badge) {
      badge.hidden = !daCondividere;
      badge.textContent = String(privati);
    }
    ind.title = daCondividere
      ? privati + (privati === 1 ? " brano solo su questo dispositivo: si condivide da solo" :
        " brani solo su questo dispositivo: si condividono da soli")
      : "Tutti i brani sono gia' condivisi";
  }

  /* Un brano locale e uno condiviso sono lo stesso brano: la copia nel
     browser serve solo per non scaricarlo due volte, ma elencarlo come
     "solo tuo" e' sbagliato, e non serve neppure rimandarlo al PC.
     Prima succedeva esattamente questo: dopo aver condiviso un brano, il PC
     continuava a dire "10 solo tuoi" perche' non si accorgeva che quel
     brano era gia' nella libreria di tutti. */
  /* Come normKey ma lascia gli spazi: serve per capire se un artista e'
     l'altro piu' i suoi feat (per esempio "Kid Yugi" dentro
     "Kid Yugi, Tedua & Junior K"). */
  function normParole(s) {
    return String(s || "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  /* Lo stesso artista, o uno che e' l'altro con dentro i feat. */
  function stessoArtista(a, b) {
    const x = normParole(a), y = normParole(b);
    if (!x || !y) return false;
    if (x === y) return true;
    const corto = x.length <= y.length ? x : y;
    const lungo = x.length <= y.length ? y : x;
    /* il nome corto deve finire a confine di parola, altrimenti
       "Kid Yugi" risulterebbe dentro "Kid Yugiroll" */
    return lungo.indexOf(corto) === 0 && lungo.charAt(corto.length) === " ";
  }
  /* Sono lo stesso titolo? Uguale, oppure uno dentro l'altro MA solo se sono
   davvero vicini: "In The End" dentro "Something In The End" non vuol dire
   che sono la stessa canzone, e "Voglio bene a te" dentro "Voglio bene a te
   anche" due volte tanto. */
function quasiUguali(x, y) {
  if (x === y) return true;
  if (!x || !y) return false;
  const corto = Math.min(x.length, y.length);
  const lungo = Math.max(x.length, y.length);
  if (corto / lungo < 0.8) return false;
  return x.indexOf(y) >= 0 || y.indexOf(x) >= 0;
}

  /* Identita' per importazioni e duplicati: conserva versioni, remix e crediti.
     Le chiavi permissive delle copertine/statistiche restano invariate. */
  function _normalizzaIdentita(s) {
    return String(s || "").normalize("NFKC").toLowerCase()
      .replace(/[‘’]/g, "'").replace(/[‐‑–—]/g, "-")
      .replace(/\s+/g, " ").trim();
  }

  function _identitaBrano(t) {
    if (!t) return "";
    let artist = String(t.artist || "").trim();
    let title = String(t.title || "").trim();
    if (!artist) artist = _artistaDalTitolo(title);
    if (!artist || !title) return "";
    const prefix = _normalizzaIdentita(artist) + " - ";
    if (_normalizzaIdentita(title).startsWith(prefix)) {
      title = title.slice(artist.length + 3).trim();
    }
    return JSON.stringify([_normalizzaIdentita(title), _normalizzaIdentita(artist)]);
  }

  function stessoBrano(a, b) {
    const key = _identitaBrano(a);
    return !!key && key === _identitaBrano(b);
  }
  /* "gigi perez - sailor song" -> "gigi perez" */
  function _artistaDalTitolo(titolo) {
    const m = /^([^-]{2,40})\s+-\s+(.+)$/.exec(String(titolo || "").trim());
    return m ? m[1].trim() : "";
  }
  /* "gigi perez - sailor song" -> "sailor song" (se l'artista combacia) */
  function _titoloSenzaArtista(titolo, artista) {
    const t = String(titolo || "");
    if (!normKey(artista)) return t;
    const m = /^([^-]{2,40})\s+-\s+(.+)$/.exec(t.trim());
    if (!m) return t;
    if (!stessoArtista(m[1], artista)) return t;
    return m[2].trim();
  }
  /* La lista si ridisegna spesso e il confronto coi brani condivisi gira ogni
     volta: me lo ricordo, cosi' non ripeto lo stesso lavoro. */
  const _memoCondiviso = new Map();
  /* Copie nel browser dei brani che esistono gia' nella libreria condivisa.
     Non le mostro in lista (altrimenti ci sarebbero due righe identiche),
     ma le tengo qui: se il file online non si puo' suonare, uso questa. */
  const _copieLocali = new Map();
  function _chiaveBrano(t) {
  return _identitaBrano(t);
  }

  /* Ste: alcune canzoni si duplicavano piu' volte. Il motivo e' che due brani
   identici salvati sul telefono hanno due id diversi (l'id nasce da data e
   caso), e l'app li mostrava entrambi: controllavo che non fossero gia' nella
   libreria condivisa, ma NON controllavo fra loro.

   Qui li unisco per nome+artista e tengo il primo. Gli id delle copie "in
   piu'" li metto da parte (non cancello niente: se un domani tornassero utili
   sono ancora li'), cosi' non ricompaiono a ogni avvio. */
function _unisciDuplicatiLocali(elenco) {
  try {
    const giaNascosti = new Set(_duplicatiLocali());
    const nuoviDaRicordare = [];
    const tenuti = [];
    for (const t of elenco) {
      if (!t) continue;
      /* Emanuele: ogni riga BUILTIN e' una posizione Spotify distinta.
         Titoli/artisti uguali con ID e file diversi non sono duplicati:
         il filtro generico ne nascondeva 20 (600 invece di 620).
         Questa eccezione non modifica il filtro degli altri profili,
         ne' le eliminazioni volontarie, applicate prima in loadAll(). */
      if (profile === "Emanuele" && t.builtin && t.profile === "Emanuele") {
        tenuti.push(t);
        continue;
      }
      /* Un id nella lista dei "da non mostrare" resta nascosto. */
      if (giaNascosti.has(t.id)) continue;
      /* Cerco il gemello confrontando con stessoBrano() (il confronto giusto
         del progetto) e NON con una chiave esatta: con la chiave "Linkin
         Park|In the End" e "|linkin park in the end" non si trovavano mai,
         perche' le due righe hanno nomi diversi ma sono lo stesso brano. */
      let p = -1;
      for (let n = 0; n < tenuti.length; n++) {
        if ((t.profile || DEFAULT_PROFILE) === (tenuti[n].profile || DEFAULT_PROFILE) && stessoBrano(t, tenuti[n])) { p = n; break; }
      }
      if (p >= 0) {
        /* Ste: un brano con il nome cambiato deve restare quello. Se il
           gemello che sto scartando ha una rinomina e quello che tengo no,
           tengo quello con la rinomina: altrimenti il nome scelto da lui
           sparisce al riavvio. */
        if (!_haRinomina(tenuti[p].id) && _haRinomina(t.id)) {
          _spostaRinomina(t.id, tenuti[p].id);
          tenuti[p] = t;
        }
        /* I brani condivisi non li nascondo per sempre: la lista condivisa
           puo' cambiare, e un brano che adesso e' doppio domani potrebbe non
           esserlo piu' (o viceversa). Me li ricordo solo per questa sessione. */
        if (!t.builtin) nuoviDaRicordare.push(t.id);
        continue;
      }
      tenuti.push(t);
    }
    if (nuoviDaRicordare.length) {
      /* Ste: "ogni volta toglie le canzoni". Non tengo memoria dei doppioni
         scartati: ogni volta riparto da capo e ricalcolo tutto, quindi un
         errore di una volta non puo' nascondere un brano per sempre (e se
         un brano sparisce, cancello il ricordo e torna con il riavvio). */
      writeProfileState(profile, { duplicati: [] });
      segnalaErrore("libreria: nascosti " + nuoviDaRicordare.length +
        " doppioni (stesso brano salvato due volte sul telefono)");
    }
    return tenuti;
  } catch (e) {
    return elenco;
  }
}

function _duplicatiLocali() {
  try {
    const st = profileState(profile);
    return Array.isArray(st.duplicati) ? st.duplicati : [];
  } catch (e) { return []; }
}

/* Questo brano ha un nome cambiato dall'utente? */
function _haRinomina(id) {
  try {
    const r = nomiRinomati()[id];
    return !!(r && (r.title || r.artist));
  } catch (e) { return false; }
}

/* Porta una rinomina da un id a un altro (quando un brano viene sostituito
   dalla sua copia gemella, il nome scelto dall'utente deve restare). */
function _spostaRinomina(daId, aId) {
  try {
    const mappa = nomiRinomati();
    const r = mappa[daId];
    if (!r) return;
    if (!mappa[aId]) mappa[aId] = { title: r.title || "", artist: r.artist || "" };
    delete mappa[daId];
    LS.set("mb.rinomini", mappa);
  } catch (e) { /* noop */ }
}

  /* I nomi che sto per mandare al sito.

   Ste: "modifico il titolo e l'artista, resta per un po' cosi', poi a caso
   torna come prima, e su tailscale torna indietro appena aggiorno la
   pagina".

   Motivo: l'app mandava TUTTA la sua lista di nomi cambiati, ogni volta
   che salvava qualcosa. Ma quella lista era vecchia su un telefono che non
   aveva ancora riletto gli aggiornamenti degli altri: e cosi' la rimandava
   indietro e sovrascriveva il nome nuovo con quello vecchio. Due
   dispositivi che si parlano addosso, e il nome "vibrava".

   Adesso mando SOLO i nomi che l'utente ha cambiato davvero, e appena sono
   partiti non li rimando piu': cosi' un dispositivo vecchio non puo' piu'
   rovinare un nome nuovo scritto da un altro.

   Nota: dal sito arriva tutto quello che c'e', quindi gli altri nomi
   arrivano lo stesso dalla lettura. */
function _rinominiDaMandare() {
  try {
    const v = LS.get("mb.rinominiDaMandare", null);
    return (v && typeof v === "object") ? v : {};
  } catch (e) { return {}; }
}
function _rinominaDaMandareSegna(id, valore) {
  try {
    const m = _rinominiDaMandare();
    if (valore && (valore.title || valore.artist)) m[id] = { title: valore.title || "", artist: valore.artist || "" };
    else delete m[id];
    LS.set("mb.rinominiDaMandare", m);
  } catch (e) { /* noop */ }
}
function _rinominiDaMandareSvuota() {
  try { LS.set("mb.rinominiDaMandare", {}); } catch (e) { /* noop */ }
}

/* Gli stessi due giochi, ma per i brani eliminati con la X: si mandano
   solo quelli appena eliminati, e un brano non ancora partito non viene
   rimesso dentro dalla lettura. */
function _eliminatiDaMandare() {
  try {
    const v = LS.get("mb.eliminatiDaMandare", null);
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function _eliminatiDaMandareSegna(id) {
  try {
    const m = _eliminatiDaMandare();
    if (m.indexOf(id) < 0) m.push(id);
    LS.set("mb.eliminatiDaMandare", m);
  } catch (e) { /* noop */ }
}
function _eliminatiDaMandareSvuota() {
  try { LS.set("mb.eliminatiDaMandare", []); } catch (e) { /* noop */ }
}
/* I brani che l'utente ha rimesso in lista DOPO averli eliminati: il
   server deve toglierli dall'elenco degli eliminati, altrimenti al giro
   dopo me li rimette fra le cose eliminate. */
function _eliminatiRimossiDaMandare() {
  try {
    const v = LS.get("mb.eliminatiRimossiDaMandare", null);
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function _eliminatoRimessoSegna(id) {
  try {
    const m = _eliminatiRimossiDaMandare();
    /* anche qui la chiave porta il profilo, come tutte le altre */
    const chiave = _chiaveEliminato(id);
    if (chiave && m.indexOf(chiave) < 0) m.push(chiave);
    LS.set("mb.eliminatiRimossiDaMandare", m);
  } catch (e) { /* noop */ }
  }
function _eliminatiRimossiDaMandareSvuota() {
  try { LS.set("mb.eliminatiRimossiDaMandare", []); } catch (e) { /* noop */ }
}

  function eGiaCondiviso(t) {
    if (!t) return false;
    if (t.builtin) return true;
    const owner = t.profile || profile || DEFAULT_PROFILE;
    const identity = _identitaBrano(t);
    if (!identity) return false;
    const k = JSON.stringify([owner, identity]);
    if (_memoCondiviso.has(k)) return _memoCondiviso.get(k);
    let r = false;
    for (const b of BUILTIN) {
      if ((b.profile || DEFAULT_PROFILE) !== owner) continue;
      if (stessoBrano(t, b)) { r = true; break; }
    }
    if (_memoCondiviso.size > 800) _memoCondiviso.clear();
    _memoCondiviso.set(k, r);
    return r;
  }

  function render() {
    _diag("render");
    const list = visibleTracks();
    playlistEl.innerHTML = "";
    /* Se ci sono brani tolti dalla lista, la riga per rimetterli e' gia' qui:
       senza, un brano nascosto spariva per sempre e il conto sembrava
       sbagliato senza che si capisse perche'. */
    try { /* i brani nascosti non esistono piu' */ } catch (e) { /* noop */ }

    const visibleAll = tracks.slice();
    const total = visibleAll.length;
    const mine = visibleAll.filter((t) => !t.builtin && !t.preview && !eGiaCondiviso(t)).length;
    const n = list.length;
function _quantiEliminati() {
  try {
    const el = LS.get("mb.eliminati", null) || {};
    return Object.keys(el).length;
  } catch (e) { return 0; }
}

  /* Ste: "togli completamente sta cosa dei nascosti". */
  let label = profile + ": " + total + (total === 1 ? " brano" : " brani");
  /* Tutti i profili mostrano solo il numero reale dei brani presenti. */
    /* MB_CORREZIONE_UNICA_EMANUELE_20261030: separare file con fonte ERRATA dagli audio non ancora confermati. */
    const inRevisione = visibleAll.filter((t) => t.review).length;
    const notaRevisione = (t) => profile === "Emanuele" ? String((RECOVERY_REVIEW.Emanuele || {})[t.file] || "") : "";
    const audioErrati = visibleAll.filter((t) => t.review && notaRevisione(t).startsWith("wrong-source:")).length;
    const versioniNonOriginali = visibleAll.filter((t) => t.review && notaRevisione(t).startsWith("wrong-version:")).length;
    if (audioErrati) label += ", " + audioErrati + " audio errati";
    /* Le versioni non originali restano segnalate sui rispettivi brani, non nel contatore. */
    if (inRevisione - audioErrati - versioniNonOriginali > 0) label += ", " + (inRevisione - audioErrati - versioniNonOriginali) + " da verificare (audio non confermato)";
    if (mine) label += ", " + mine + (mine === 1 ? " solo tuo" : " solo tuoi");
    if (favOnly || soloMaiAscoltati || soloScaricate || query) label = n + " di " + total + (total === 1 ? " brano" : " brani");
    $("trackCount").textContent = label;
    /* Il bottone dell'ordinamento mostra sempre la scelta attuale. */
    const bt = $("btnOrdina");
    if (bt) {
      const scelta = ORDINAMENTI.find((o) => o.id === ordinamento) || ORDINAMENTI[0];
      bt.textContent = scelta.nome;
      bt.title = "Cambia ordinamento (ora: " + scelta.nome.toLowerCase() + ")";
    }
    /* Registro dei numeri della libreria: una volta per avvio. Serve a me per
       capire cosa manca senza dover chiedere uno screenshot a Stefano. */
    if (!_numeriGiaInviati) {
      _numeriGiaInviati = true;
      try {
        const condivisi = tracks.filter((t) => t.builtin).length;
        segnalaErrore("libreria: " + tracks.length + " brani in tutto = " + condivisi + " condivisi + " +
          (tracks.length - condivisi) + " privati; visibili " + visibleAll.length +
          "; nascosti a mano " + nascosti + "; duplicati nascosti " + _ultimiDuplicati +
          "; brani senza file " + _ultimiSenzaFile);
      } catch (e) { /* noop */ }
    }
    aggiornaIndicatoreCondivisione();

    if (!list.length) {
      emptyEl.hidden = false;
emptyEl.textContent = !total
  ? (tracks.length
  ? "La libreria di " + profile + " è vuota: i brani che hai eliminato non tornano piu'. Aggiungine di nuovi."
  : "La libreria di " + profile + " è vuota. Le canzoni arrivano dal computer (cartella mus" +
  profile.toLowerCase() + ") oppure scaricale con la scheda Importa.")
        : !tracks.length
          ? "Nessun brano. Tocca + per aggiungere della musica."
          : favOnly && !query
            ? "Nessun preferito: tocca il cuore su un brano."
            : "Nessun brano trovato.";
      return;
    }
    emptyEl.hidden = true;
    avvisaProfiloVuoto();

    list.forEach((t) => {
      const li = document.createElement("li");
      li.className = "track" + (t.id === currentId ? " active" : "");

      let art;
      if (t.cover) {
        art = document.createElement("img");
        art.className = "track-art";
        art.alt = "";
        /* Ste: "le copertine si scaricano dopo molto tempo". Prima
           l'app chiedeva tutte le copertine della lista in una volta
           (200 e piu' immagini): l'app partiva lenta e il telefono
           scaricava un sacco di roba. Con "lazy" l'app parte subito e
           le copertine arrivano man mano che si scorre. */
        art.loading = "lazy";
        art.decoding = "async";
        art.src = t.cover;
      } else {
        art = document.createElement("div");
        art.className = "track-art";
        art.style.background = t.gradient;
      }

      const info = document.createElement("div");
      info.className = "track-info";
      const title = document.createElement("div");
      title.className = "track-title";
      /* Il testo va in un pezzo suo: e' quello che si tronca con i
         puntini. I contrassegni ("tutti", "bassi") stanno accanto e non
         vengono mai tagliati. */
      const testoTitolo = document.createElement("span");
      testoTitolo.className = "track-testo";
      testoTitolo.textContent = t.title;
      title.appendChild(testoTitolo);
      const contrassegni = [];
      info.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "track-meta";
      const bits = [];
      if (t.artist) bits.push(t.artist);
      if (t.album) bits.push(t.album);
      if (t.preview) bits.push("anteprima 30s");
      if (t.builtin) meta.textContent = bits.join(" ");
      else meta.textContent = bits.length ? bits.join(" · ") + " · solo tua" : "solo tua";
      /* I contrassegni stanno QUI, non nel titolo: la riga del titolo viene
         troncata con i puntini e il contrassegno spariva (Ste: "non si
         capisce se c'e' scritto bassi perche' spuntano i ..."). */
      /* Ste (21/10/2026): "togli il tutti, e' inutile". Il contrassegno
         "tutti" (le canzoni condivise con gli altri profili) e' sparito:
         diceva una cosa che si capisce gia' guardando la libreria, e
         rubava spazio al contrassegno "bassi", che invece serve. */
      /* Ste: "fai che si capisca quali sono state boostate e quali no".
         Il contrassegno "BASSI" vuol dire: questo brano suona con la versione
         potenziata (bassi piu' pieni, voce avanti, piu' forte). */
      if (t.file && _potenziatiCaricati && _branoInGym(t.id) && _ePotenziato(t.file)) {
        const badge = document.createElement("span");
        badge.className = "track-badge track-badge-bassi";
        badge.textContent = "bassi";
        badge.title = "Questo brano suona potenziato (bassi piu' pieni, voce avanti, piu' forte)";
        contrassegni.push(badge);
      }
      if (t.review) {
        const badge = document.createElement("span");
        badge.className = "track-badge";
        const motivo = profile === "Emanuele" ? String((RECOVERY_REVIEW.Emanuele || {})[t.file] || "") : "";
        const versioneDiversa = motivo.startsWith("wrong-version:");
        const errato = motivo.startsWith("wrong-source:") || versioneDiversa;
        badge.textContent = versioneDiversa ? "VERSIONE NON ORIGINALE" : (errato ? "AUDIO ERRATO" : "DA VERIFICARE");
        badge.title = motivo || "Audio da controllare: la presenza del file non conferma la corrispondenza con Spotify";
        badge.style.cssText = "display:inline-block;margin-left:6px;padding:2px 6px;border:1px solid " + (errato ? "#ef6868" : "#e7ad48") + ";border-radius:7px;color:" + (errato ? "#ef6868" : "#e7ad48") + ";font-weight:700;font-size:10px;";
        contrassegni.push(badge);
      }
      for (const b of contrassegni) meta.appendChild(b);
      info.appendChild(meta);

      li.appendChild(art);
      li.appendChild(info);
      /* Tieni premuto e si apre il menu rapido (che al primo posto ha
         "Cambia nome e artista"). Qui non metto un secondo gestore di
         pressione lunga: due insieme si confondevano e la finestra del nome
         si apriva anche con un tocco normale. */
      li.title = "Tieni premuto per le azioni sulla canzone";

      const favBtn = document.createElement("button");
      favBtn.className = "track-fav" + (favorites.has(t.id) ? " on" : "");
      favBtn.setAttribute("aria-label", "Preferito");
      favBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"/></svg>';
        favBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (favorites.has(t.id)) favorites.delete(t.id);
          else favorites.add(t.id);
          saveCurrentState();
          _salvaStatoCondiviso();
          render();
        });
      li.appendChild(favBtn);

      if (t.builtin && !isCached(t)) {
        const cloud = document.createElement("button");
        cloud.className = "track-cloud";
        cloud.setAttribute("aria-label", "Scarica " + t.title + " per offline");
        cloud.title = "Non e' ancora offline: tocca per scaricarla";
        cloud.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 19a4.5 4.5 0 0 1-.4-8.98 6 6 0 0 1 11.6 1.65A4 4 0 0 1 18.5 19h-12Z"/></svg>';
        cloud.addEventListener("click", (e) => {
          e.stopPropagation();
          cacheOneTrack(t, cloud);
        });
        li.appendChild(cloud);
      }

      if (!t.builtin && !t.preview) {
        const share = document.createElement("button");
        share.className = "track-share";
        share.setAttribute("aria-label", "Condividi " + t.title);
        share.title = "Condividi con tutti";
        share.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z"/><path fill="currentColor" d="M4 15a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a1 1 0 1 1 2 0v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2a1 1 0 0 1 1-1Z"/></svg>';
        share.addEventListener("click", (e) => {
          e.stopPropagation();
          exportTrack(t);
        });
        li.appendChild(share);
      }

      const del = document.createElement("button");
      del.className = "track-del";
      /* Ste: "togli completamente sta cosa dei nascosti... quando elimino
         una canzone si elimini direttamente per sempre chiedendo pero' una
         conferma". Prima questo bottone nascondeva i brani dell'app e
         rimuoveva gli altri: due cose diverse, e la prima non reggeva.
         Adesso fa sempre la stessa cosa, e chiede conferma. */
      del.setAttribute("aria-label", "Elimina " + t.title);
      del.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h.3l.9 12.2A3 3 0 0 0 9.2 22h5.6a3 3 0 0 0 3-2.8L18.7 7H19a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm4 2v1h-2V5h2Zm-3.7 5.5a1 1 0 0 1 1.9.3l-.4 7a1 1 0 1 1-1.9-.3l.4-7Zm5.9.3a1 1 0 1 1 1.9-.3l-.4 7a1 1 0 1 1-1.9.3l.4-7Z"/></svg>';
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        _eliminaBrano(t.id);
      });
      li.appendChild(del);

li.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    /* Se sto scegliendo piu' canzioni, il tocco sceglie e non suona. */
    if (_alternaSelezione(t.id)) return;
    playById(t.id);
    });
    /* Il segno di spunta sui brani scelti. */
    if (_inSelezione && _scelti.has(t.id)) li.classList.add("selezionato");
    bindLongPress(li, t);
    playlistEl.appendChild(li);
    });
  }

  /* ---------- Audio robusto (fix iOS lock screen) ---------- */
  function setPlaybackState(s) {
    if ("mediaSession" in navigator) {
      try { navigator.mediaSession.playbackState = s; } catch (e) { /* noop */ }
    }
  }

  function handleEnded() {
    try {
    if (currentId) LS.set("mb.pos." + currentId, 0);
    /* Se sto ascoltando una playlist, il brano dopo e' il SUO, non quello
       dopo nella libreria: altrimenti la playlist si fermerebbe al primo. */
    const idDiPlaylist = _avantiInPlaylist();
    if (idDiPlaylist) { playById(idDiPlaylist); return; }
    /* Il brano e' finito e sto partendo col successivo: da qui in avanti
       se il telefono rifiuta di suonare, insisto (vedi _riprovaPiuTardi) */
    _cominciaBranoNuovo();
    if (queue.length) {
      const next = queue.shift();
      persistQueue();
      renderQueueCount();
      playById(next);
      return;
    }
    if (repeat) {
      audio.currentTime = 0;
      doPlay();
    } else {
      playById(idBranoA(nextIndex()));
    }
    } catch (e) {
      /* Non lasciare che un errore qui fermi tutto: una volta un errore in
         questo percorso bloccava la pagina intera. */
      console.warn("fine canzone: errore nel scegliere il brano dopo", e);
    }
  }

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function updateProgressUI(t, d) {
    const fill = $("playerProgress").querySelector(".fill");
    if (fill) fill.style.width = (d ? (t / d) * 100 : 0) + "%";
    $("curTime").textContent = fmtTime(t);
    $("totTime").textContent = d ? fmtTime(d) : "0:00";
  }

  function savePos() {
    if (currentId && audio && isFinite(audio.currentTime)) {
      const sec = Math.floor(audio.currentTime);
      /* Salvo ANCHE quando l'ho ascoltata per davvero. Ste: "voglio che dopo
         6 ore si resetti". Se la posizione e' vecchia di qualche ora, al
         ritorno la canzone ricomincia dall'inizio invece di tornare a meta'
         di una canzone che hai smesso di ascoltare sei ore fa. */
      writeProfileState(profile, { last: currentId, time: sec, quando: Date.now() });
      LS.set("mb.pos." + currentId, sec);
      try { LS.set("mb.pos.quando." + currentId, Date.now()); } catch (e) { /* noop */ }
    }
  }

  function updatePlayerHeight() {
    const el = $("player");
    if (!el) return;
    const h = Math.round(el.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty("--player-h", h + "px");
  }

  function maybeSavePos() {
    const now = Date.now();
    if (now - lastSave < 3000) return;
    lastSave = now;
    savePos();
  }

function handleTime() {
    /* Segno che l'audio sta DAVVERO scorrendo. Sul telefono con lo schermo
       spento Safari dice "e' partito" ma il brano resta muto e fermo: e'
       successo, e l'app ci credeva e non riprovava piu'. Qui guardo il tempo
       che passa davvero, e se non passa riparo. */
    _ultimoScorrimento = Date.now();
    if (!scrubbing) {
    const t = audio.currentTime;
    updateProgressUI(t, totalDuration());
    maybeSavePos();
  }
  tickLyrics();
  syncPlayUI();
  /* la barra della schermata di blocco del telefono deve camminare
     insieme al brano: senza questo resta ferma */
  _aggiornaPosizioneSchermo();
  }

function handleMetadata() {
    const want = resumeAt;
    resumeAt = 0;
    if (want > 8 && audio) {
      const d = totalDuration();
      /* Ste: se la canzone era davvero agli ultimi secondi, ricomincio. Prima
         scattava con 8 secondi di margine, e su una canzone lunga con uno
         scaricamento lento poteva capitare che la posizione salvata fosse
         "quasi vicina alla fine" mentre il brano era ancora lontano: e la
         canzone ripartiva dall'inizio. Ora il margine e' di 3 secondi. */
      if (d > 0 && want >= d - 3) {
        try { audio.currentTime = 0; } catch (e) { /* noop */ }
      } else {
        try { audio.currentTime = Math.min(want, d > 20 ? d - 5 : want); } catch (e) { /* noop */ }
      }
    }
    /* Ste: "la canzone riparte da capo SOLO quando riapro l'app dall'icona".
       Quando si riapre dalla pagina gia' aperta funziona: la differenza e' che
       dall'icona il telefono crea la pagina da zero. Quindi segno dove mi
       trovo davvero dopo la ripresa: se qui torna 0, la posizione non e'
       arrivata. */
    try {
      _segna("dopo la ripresa", "posizione reale " + Math.round((audio && audio.currentTime) || 0) +
      "s su " + Math.round(totalDuration()) + "s");
    } catch (e) { /* noop */ }
updateProgressUI(audio ? audio.currentTime || 0 : 0, totalDuration());
  }

  function handleError() {
  console.warn("Errore audio, provo a recuperare");
  const t = current();
  if (t && t.builtin && !t._provatoLocale) {
    /* Il brano viene dal sito e non si vuole: uso la copia nel browser. */
    t._provatoLocale = true;
    usaCopiaLocale(t).then((blob) => {
      if (!blob) {
        segnalaErrore("brano non riproducibile e senza copia locale: " +
          String((t.artist || "") + " " + (t.title || "")).slice(0, 60));
        return;
      }
      audio = createAudio();
      audio.src = URL.createObjectURL(blob);
      _applicaAudio();
      segnalaErrore("uso la copia locale per: " +
        String((t.artist || "") + " " + (t.title || "")).slice(0, 60));
      doPlay();
    });
    return;
  }
  rebuildAudio(true);
  }

  /* Se un brano condiviso non si puo' suonare dal sito (per esempio il file
     non e' ancora stato pubblicato), provo con la copia che ho nel browser. */
  async function usaCopiaLocale(brano) {
    try {
      const k = _chiaveBrano(brano);
      let rec = _copieLocali.get(k);
      if (rec === undefined) {
        const tutti = await dbAll();
        rec = (tutti || []).find((r) => r && r.blob && _chiaveBrano({ artist: r.artist, title: r.title }) === k) || null;
        _copieLocali.set(k, rec);
      }
      return (rec && rec.blob) ? rec.blob : null;
    } catch (e) {
      return null;
    }
  }

  /* Bridge opzionale per il wrapper iOS nativo: il sito continua a funzionare
     normalmente in Safari. Nel wrapper invia titolo, artista e posizione al
     player di sistema, che gestisce i controlli della schermata di blocco. */
  let _ultimoInvioStatoNativo = 0;
  function _notificaStatoNativo(forza = false) {
    try {
      const bridge = window.webkit && window.webkit.messageHandlers &&
        window.webkit.messageHandlers.musicBox;
      if (!bridge) return;
      const ora = Date.now();
      if (!forza && ora - _ultimoInvioStatoNativo < 1000) return;
      _ultimoInvioStatoNativo = ora;
      const t = current();
      bridge.postMessage({
        type: "state",
        title: t ? t.title : APP_NAME,
        artist: t ? (t.artist || APP_NAME) : APP_NAME,
        album: APP_NAME,
        playing: !!(audio && !audio.paused),
        currentTime: audio && isFinite(audio.currentTime) ? audio.currentTime : 0,
        duration: audio && isFinite(audio.duration) ? audio.duration : 0
      });
    } catch (e) { /* bridge assente o non ancora pronto: Safari resta invariato */ }
  }

  // Punto d'ingresso invocato dal wrapper nativo dopo il caricamento della pagina.
  window.__musicBoxNativeReady = () => _notificaStatoNativo(true);

  function createAudio() {
    const a = new Audio();
    a.preload = "metadata";
    /* Se il brano con i bassi non esiste ancora (il computer non l'ha
       preparato), il brano non parte: in quel caso riprovo con il file
       normale, cosi' si sente lo stesso. */
    a.addEventListener("error", function () {
      try {
        if (a.src && a.src.indexOf("/bassi/") >= 0) {
          const normale = a.src.replace("/bassi/", "/");
          if (normale && normale !== a.src) {
            a.src = normale;
            try { a.play(); } catch (e) { }
          }
        }
      } catch (e) { }
    });
    /* Se la catena dei bassi e' accesa, l'elemento nuovo va ricollegato a
       lei: altrimenti la musica uscirebbe dalle cuffie senza i bassi (e,
       peggio, con la catena mezza staccata). */
    try {
      if (typeof bassiAccesi !== "undefined" && bassiAccesi && typeof _collegaElemento === "function") {
        setTimeout(function () { try { _collegaElemento(); } catch (e) { } }, 0);
      }
    } catch (e) { }
    a.addEventListener("play", () => {
    _segna("brano in riproduzione");
    // Un play reale conferma che il cambio sorgente e' terminato.
    a._mbCambioBrano = false;
    syncPlayUI();
    updateMediaSession();
    _iniziaAscolto();
    _notificaStatoNativo(true);
    });
a.addEventListener("pause", () => {
    /*
      Ste: "riapro l'app e si ferma la musica". Il motivo era QUI: questo
      evento scatta anche quando e' il SISTEMA a mettere in pausa (succede
      quando l'app va in secondo piano), e l'app lo scambiava per una pausa
      dell'utente: si segnava "ha fermato lui" e al ritorno non ripartiva piu'.
      Il primo tentativo (guardare se la pagina si vede) non bastava: la pausa
      del sistema arriva spesso un attimo DOPO il ritorno in primo piano.

      Adesso guardo il tempo: se la pagina e' stata nascosta fino a poco fa,
      la pausa e' del sistema e io devo ripartire al ritorno. Se invece arriva
      con la pagina ben visibile da un po', la tratto come pausa vera. */
    const dalRitorno = Date.now() - _nascostoIl;
    const daVisibile = Date.now() - _visibileIl;
    /* La pausa del sistema arriva o mentre l'app e' in secondo piano, oppure
       nell'istante esatto in cui la riapri. Per questo guardo DUE momenti: da
       quanto e' nascosta e da quanto e' visibile. Prima guardavo solo il primo,
       e percio' funzionava solo se tornavi entro pochi secondi. */
    const eDelSistema = document.hidden || dalRitorno < 4000 || (daVisibile >= 0 && daVisibile < 2500);
    _segna("evento PAUSE", "del sistema: " + (eDelSistema ? "si" : "NO (lo tratto come tua)" +
      ", nascosta da " + Math.round(dalRitorno / 1000) + "s, visibile da " + Math.round(daVisibile / 1000) + "s"));
    if (a === audio && _vuoleSuonare && !a.ended && !a._mbCambioBrano && !eDelSistema) {
      _pausaVolontaria();
      return;
    }
    /* Ste: "adesso non si riapre piu' da zero ma si blocca soltanto la canzone".
       Qui c'era una corsa: al ritorno l'app controllava se la musica stesse
       suonando (e in quel momento stava ancora suonando, perche' il telefono
       ferma l'audio un attimo DOPO), diceva "tutto bene" e smetteva di
       guardare. Poi arrivava la pausa del sistema, e nessuno riprovava a
       rimetterla su: restava ferma per sempre. */
    if (a === audio && _vuoleSuonare && !a.ended && eDelSistema) {
      try { setTimeout(() => _riprendiSeInAttesa(), 400); } catch (e) { /* noop */ }
    }
    syncPlayUI();
    updateMediaSession();
    savePos();
    _chiudiAscolto(false);
    _notificaStatoNativo(true);
  });
    a.addEventListener("ended", handleEnded);
    a.addEventListener("timeupdate", handleTime);
    a.addEventListener("timeupdate", () => _notificaStatoNativo(false));
    /* Ste: "funziona anche nella schermata di blocco, dalla notifica della
       canzone". Motivo: la barra del brano nella schermata di blocco
       restava ferma, perche' la posizione veniva aggiornata solo quando
       cambiava il brano. Ora, mentre la musica suona, il telefono sa
       sempre a che punto siamo. */
    a.addEventListener("timeupdate", () => _aggiornaPosizioneSchermo());
    /* Il conteggio del tempo ascoltato: qui si conta davvero, perche' questo
       evento scatta finche' la musica suona, su computer e su telefono. */
    a.addEventListener("timeupdate", _contaAlMuoversi);
    a.addEventListener("loadedmetadata", handleMetadata);
    a.addEventListener("loadedmetadata", () => _notificaStatoNativo(true));
    a.addEventListener("error", handleError);
    return a;
  }

/* Ricreo il lettore audio. Fermo quello vecchio: se e' ancora vivo
     continuerebbe a suonare da solo. */
function rebuildAudio(autoplay) {
  _diag("rebuildAudio");
  const t = current();
  if (!t) return;
  const time = (audio && isFinite(audio.currentTime) && audio.currentTime) || 0;
  if (audio) { try { audio.pause(); } catch (e) { /* noop */ } }
  audio = createAudio();
  audio.src = _urlDelBrano(t);
  _applicaAudio();
  try { if (time) audio.currentTime = time; } catch (e) { /* noop */ }
  if (autoplay) doPlay();
  }

  /* Prima di play(): se il brano non e' ancora pronto, aspetto che sia pronto.
     Sui telefoni chiedere play() mentre il file sta ancora arrivando viene
     rifiutato, e il brano non parte: e' una delle ragioni per cui col
     telefono spento la musica si fermava al brano dopo. */
  function _prontaARiprodurre() {
    return new Promise((risolvi) => {
      if (!audio || audio.readyState >= 2) { risolvi(); return; }
      let fatto = false;
      const va = () => { if (!fatto) { fatto = true; risolvi(); } };
      try {
        audio.addEventListener("loadeddata", va, { once: true });
        audio.addEventListener("canplay", va, { once: true });
      } catch (e) { /* noop */ }
      /* non aspetto all'infinito: dopo 4 secondi parto comunque */
      setTimeout(va, 4000);
    });
  }

  /* Faccio partire il brano.
     Prima, quando play() falliva, chiamavo rebuildAudio(true) che richiamava
     doPlay(): e se falliva di nuovo richiamava rebuildAudio... all'infinito.
     Ogni giro creava un lettore nuovo e non si sentiva NULLA, e il ciclo
     teneva occupato il browser tanto che la musica si fermava al brano dopo.
     Happenede soprattutto con lo schermo spento e con il tasto "avanti"
     dalla schermata di blocco, dove il browser blocca play(). */
  async function doPlay(hoGiaRiprovato) {
    if (!audio) audio = createAudio();
    try {
      _applicaAudio();
      setPlaybackState("playing");
      await _prontaARiprodurre();
      await audio.play();
      /* NON azzero l'intento di sentire qui: con lo schermo spento il
         telefono risponde "partito" ma l'audio resta muto. Se dicessi
         "ha suonato", l'app smetterebbe di insistere e resterebbe muta
         per sempre (e riaprendo l'app non ripartiva piu'). */
      _ultimoScorrimento = Date.now();
      _nascondiSeRiparte();
      /* Se l'app crede di suonare ma il volume e' a zero, la musica parte
         e non si sente niente: e' successo. Meglio dirlo. */
      _controllaVolume();
      return true;
    } catch (e) {
      const nome = String((e && e.name) || "");
      console.warn("Play bloccato" + (hoGiaRiprovato ? " (anche dopo aver ricreato il lettore)" : ""), e);
      /* Se il telefono rifiuta perche' non c'e' stata una pressione (il caso
         dello schermo spento), ricreare il lettore e' la cosa PEGGIORE: un
         lettore nuovo e' come un brano nuovo, quindi il telefono lo blocca
         di nuovo. In quel caso mi tengo lo stesso lettore e insisto sullo
         stesso brano. Ricrearlo resta giusto se il lettore e' rotto. */
      const rifiutoDelTelefono = /NotAllowedError/i.test(nome);
      /* Ste: "quando finisce una canzone non riparte l'altra".
         Motivo: nella modalità APP WEB (l'icona sulla schermata Home),
         iPhone sospende l'app e non lascia ripartire il brano successivo
         da solo. Adesso, quando succede, l'app lo dice e spiega come
         togliere l'opzione 'Apri come app web'. */
      if (rifiutoDelTelefono) {
        try {
          const daIcona = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
          if (daIcona) {
            _avvisoIcona();
            toast("iPhone ha bloccato il brano successivo: guarda l'avviso in basso", 6000);
          }
        } catch (e) { /* noop */ }
      }
      if (!hoGiaRiprovato && !rifiutoDelTelefono) {
        rebuildAudio(false);
        return doPlay(true);
      }
      /* ancora bloccato (telefono in standby): riprovo con calma */
      _riprovaPiuTardi();
      return false;
    }
  }

  /* ---------- Se l'iPhone non fa partire il brano da solo ----------
     A volte il sistema proprio non concede il permesso, e nessuna insistenza
     serve. In quel caso non ti lascio fermo: appare una riga in basso con un
     bottone grande, e basta un tocco per continuare. */
  let _aiutoBox = null;
  function _mostraAiuto(testo) {
    try {
      if (!_aiutoBox) {
        _aiutoBox = document.createElement("div");
        _aiutoBox.className = "aiuto-riparto";
        _aiutoBox.innerHTML = '<span class="aiuto-testo"></span><button type="button" class="aiuto-pulsante">Continua</button>';
        document.body.appendChild(_aiutoBox);
        _aiutoBox.querySelector(".aiuto-pulsante").addEventListener("click", () => {
          _nascondiAiuto();
          /* La canzone e' gia' cambiata: qui non devo saltare al brano dopo,
             devo solo suonare quello che c'e' adesso. E soprattutto: questo
             tocco e' un "permesso" dell'utente, quindi stavolta l'iPhone
             lascia passare play(). */
          _vuoleSuonare = true;
          if (audio && !audio.paused) { _vuoleSuonare = false; return; }
          doPlay().then((va) => { if (va) _nascondiAiuto(); });
        });
      }
      _aiutoBox.querySelector(".aiuto-testo").textContent = testo;
      _aiutoBox.classList.add("visibile");
    } catch (e) { /* noop */ }
  }
  function _nascondiAiuto() {
    try { if (_aiutoBox) _aiutoBox.classList.remove("visibile"); } catch (e) { /* noop */ }
  }
  /* Se riparte (perche' ha insisto o perche' hai toccato), l'aiuto sparisce */
  function _nascondiSeRiparte() {
    try {
      if (audio && !audio.paused) _nascondiAiuto();
    } catch (e) { /* noop */ }
  }

  /* Volume a zero: l'app parte ma dal telefono non esce niente e sembra
     che sia tutto rotto. In quel caso te lo dico con parole chiare. */
  function _controllaVolume() {
    try {
      if (volumePct > 0) return;
      _mostraAiuto("Il volume e' a zero: alzalo con il cursore");
    } catch (e) { /* noop */ }
  }
  /* Tenere pronto il brano che viene dopo, cosi' quando l'altro finisce
     parte SUBITO e non deve aspettare che il file si scarichi dal internet.
     E' un lettore nascosto e muto: non si sente, serve solo a scaldare il
     file in memoria. */
  let _preparato = null;
  let _preparatoId = "";
  /* Il telefono mi dice se sta risparmiando i dati o se la rete e' lenta:
     in quel caso scaricare un brano intero prima ancora di ascoltarlo
     (4-5 MB) e' una cattiva idea. Lo carico solo "abbastanza". */
  function _meglioNonScaricareTutto() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return false;
    if (c.saveData) return true;
    return /^(slow-)?2g$|^3g$/.test(String(c.effectiveType || ""));
  }
  /* Scarica un brano nella cache del telefono, in silenzio.
     Serve perche' i brani potenziati (quelli della playlist gym) sono file
     nuovi: la prima volta che ne suoni una, senza questo l'app aspetta
     che il file arrivi e la musica parte in ritardo. */
  /* La connessione del telefono: su una rete lenta (o con il risparmio
     dati) scaricare un brano da 4 MB in anticipo rallenta tutto. */
  function _reteAbbastanzaVeloce() {
    try {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!c) return true;
      if (c.saveData) return false;
      const tipo = String(c.effectiveType || c.type || "");
      if (tipo === "slow-2g" || tipo === "2g" || tipo === "3g") return false;
      if (c.downlink && Number(c.downlink) < 1.2) return false;
      return true;
    } catch (e) { return true; }
  }

  let _precaricaInCorso = false;
  async function _precaricaInCache(t) {
    try {
      if (_precaricaInCorso) return;
      if (!t || !t.url) return;
      /* Cache SEPARATA: i brani che scarico in anticipo non devono stare
         dove stanno le tue download (altrimenti, quando il telefono e'
         pieno, si portano via le tue). */
      if (!("caches" in window)) return;
      let cache = null;
      try { cache = await caches.open("spotifynonavraiimieisoldi-prefetch"); } catch (e) { cache = null; }
      if (!cache) return;
      _precaricaInCorso = true;
      try { await fetchToCache(t.url, cache, null); } catch (e) { }
      _precaricaInCorso = false;
    } catch (e) { _precaricaInCorso = false; }
  }

  function _preparaIlSuccessivo(id) {
    const t = tracks.find((x) => x.id === id);
    if (!t || !t.url || _preparatoId === id) return;
    try {
      if (!_preparato) {
        _preparato = new Audio();
        _preparato.muted = true;
      }
      /* Ste: "anche quando metto avanti ci mettono tanto a partire".
         Prima qui si scaricava solo il METADATA del brano e il file vero
         arrivava quando la canzone partiva (e l'app aspettava). Adesso il
         brano dopo lo scarico per davvero, in silenzio, e lo metto nella
         cache del telefono: cosi' "avanti" parte subito. */
      _preparato.preload = _meglioNonScaricareTutto() ? "metadata" : "auto";
      _preparato.src = _urlDelBrano(t);
      /* se il brano e' gia' in mano la si riusa, altrimenti lo si scorda */
      try { _preparato.load(); } catch (e) { /* noop */ }
      _preparatoId = id;
      /* E lo metto anche nella cache del service worker: cosi' la prossima
         volta che parte, non deve scaricare niente. */
      /* Solo se la rete e' veloce: scaricare un file da 4 MB su una rete
         lenta blocca tutto (Ste: "le canzoni ci stanno un sacco ad
         avviarsi"). */
      try {
        if (!_meglioNonScaricareTutto() && _reteAbbastanzaVeloce()) {
          _precaricaInCache(t);
        }
      } catch (e) { }
    } catch (e) { _preparato = null; _preparatoId = ""; }
  }

  let _timerRiprove = null;
  let _timerAiuto = null;
  /* --- "voglio sentire" e "sto sentendo" ---
     _vuoleSuonare: l'utente (o il cambio brano automatico) vuole la musica.
       Si spegne SOLO quando l'utente mette in pausa di proposito.
     _ultimoScorrimento: l'ultima volta che il tempo del brano e' davvero
       andato avanti. Se la musica e' "partita" ma il tempo resta fermo,
       l'audio e' muto: e li' devo intervenire. */
  let _vuoleSuonare = false;
  let _ultimoScorrimento = 0;

  /* Controllo ogni 3 secondi: la musica deve camminare.
     Sta pero' VOLUTAMENTE cauto: se la rete arranca e il brano sta ancora
     caricando, il tempo non avanza e non e' che sia muto. In quel caso non
     tocco niente, altrimenti si sentirebe uno scatto proprio mentre
     ascolti. Prima cosa provo a riavviare la riproduzione; solo se non
     basta, e due volte di fila, ricostruisco il lettore. */
  let _silenziDiFila = 0;
  function _controllaCheSuoni() {
    try {
      if (!_vuoleSuonare || !audio || !currentId) return;
      /* Il brano e' finito ma l'evento non e' arrivato: lo recupero qui.
         Questo giro ogni 3 secondi SEMPRE, quindi copre anche il caso in cui
         il brano e' finito mentre l'app era in primo piano. */
      if (audio.ended) { _finitoSenzaAvanti(); return; }
      if (audio.paused) { _silenziDiFila = 0; _riprovaPiuTardi(); return; }
      if (Date.now() - _ultimoScorrimento < 10000) return;
      /* sta ancora scaricando: non e' un silenzio, e' la rete */
      if (audio.readyState < 3) { _ultimoScorrimento = Date.now(); return; }
      _nascondiAiuto();
      _ultimoScorrimento = Date.now();
      _silenziDiFila++;
      const t = current();
      if (!t) return;
      if (_silenziDiFila < 3) {
        /* prima prova: riparto sullo stesso brano, dal punto in cui e' */
        audio.play().catch(() => { /* il controllo riprova fra poco */ });
        return;
      }
      /* il brano e' "partito" ma e' zittito da 30 secondi: lo rifaccio */
      _silenziDiFila = 0;
      rebuildAudio(true);
      _riprovaPiuTardi();
    } catch (e) { /* noop */ }
  }
  /* Quando il brano e' finito e parte il successivo, il telefono spesso
     rifiuta di riprodurre per un po': con lo schermo spento e' proprio
     normale. Prima mollavo dopo 10 secondi e la musica restava muta.
     Adesso insisto per qualche minuto: e' l'unica cosa che posso fare da
     solo, senza che Ste debba toccare il telefono. */
  function _riprovaPiuTardi() {
    if (_timerRiprove) clearTimeout(_timerRiprove);
    const attesa = [1500, 3000, 5000, 8000, 12000, 20000, 30000, 45000];
    let i = 0;
    const riprova = () => {
      if (i >= attesa.length) return;
      const quando = attesa[i++];
      _timerRiprove = setTimeout(() => {
        try {
          /* riprovo SOLO se la musica deve davvero suonare e il brano non e'
             gia' partito: altrimenti lo disturberei */
          if (_vuoleSuonare && currentId && audio && audio.paused) {
            _ultimoScorrimento = Date.now();
            audio.play().catch(() => riprova());
            return;
          }
          if (_vuoleSuonare && currentId && audio && !audio.paused) {
            /* "partito" ma forse muto: lo nota _controllaCheSuoni */
            _controllaCheSuoni();
            return;
          }
          if (!_vuoleSuonare && audio && !audio.paused) return;
        } catch (e) { /* noop */ }
        riprova();
      }, quando);
    };
    riprova();
    /* Se proprio non va, non insisto all'infinito: dopo 3 secondi mostro
       un bottone grande. Meglio un tocco tu che restare fermo in silenzio.
       Prima aspettavo 12 secondi, ma l'utente vede subito che la musica
       e' partita a meta' e non sa che c'e' un bottone. */
    clearTimeout(_timerAiuto);
    _timerAiuto = setTimeout(() => {
      if (_vuoleSuonare && currentId && audio && audio.paused) {
        _mostraAiuto("La musica non e' partita: tocca Continua");
      }
    }, 3000);
  }

  /* L'intestazione esce quando scorro in giu' e torna quando scrivo in su.

     Motivo: con l'app aperta dentro Safari (non come web app) l'iPhone mostra
     la sua barra in alto, e lo spazio per l'elenco dei brani si stringe.
     Cosi' quando sto scegliendo cosa ascoltare l'intestazione non c'intralcia,
     ma il menu resta a portata di dito: basta scrivere un po' in su. */
  (function topbarCheScorre() {
    try {
      const barra = document.querySelector(".topbar");
      if (!barra) return;
      let ultimo = window.scrollY || 0;
      let fermo = 0;
      window.addEventListener("scroll", () => {
        const ora = window.scrollY || 0;
        const giù = ora > ultimo + 6;
        const su = ora < ultimo - 6;
        /* vicino a cima e in fondo la lascio stare: li' non ci guadagniamo niente */
        if (ora < 70) { barra.classList.remove("scorrendo-giu"); ultimo = ora; return; }
        if (Math.abs(ora - ultimo) < 6) return;
        ultimo = ora;
        if (giù) barra.classList.add("scorrendo-giu");
        else if (su) barra.classList.remove("scorrendo-giu");
        /* se l'utente smette di muoversi, dopo un po' la riporto: non deve
           restare nascosta per sempre se poi non tocca piu' niente */
        clearTimeout(fermo);
        fermo = setTimeout(() => { barra.classList.remove("scorrendo-giu"); }, 2600);
      }, { passive: true });
    } catch (e) { /* noop */ }
  })();

  /* Se Ste apre l'app dall'icona della Home Screen, iPhone la chiude prima,
     anche mentre la musica suona: il brano corrente va avanti, ma quando
     finisce il successivo non parte. ApertA dentro Safari invece funziona
     anche a schermo spento.

     Glielo dico una volta sola, con il link gia' pronto da incollare, cosi'
     non resta il dubbio di quale delle due usare. */
  let _avvisoIconaBox = null;

  function _avvisoIcona() {
    try {
      const apertaDaIcona =
        (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
        window.navigator.standalone === true;
      if (!apertaDaIcona) return;
      if (LS.get("mb.avviso-icona", "") === "si") return;
      LS.set("mb.avviso-icona", "si");
      if (_avvisoIconaBox || !document.body) return;

      const box = document.createElement("div");
      box.className = "avviso-nascosti";

      const testo = document.createElement("div");
      testo.className = "avviso-nascosti-testo";
        testo.textContent = "Sei nella modalità APP WEB (l'icona sulla schermata Home). Su iPhone, in questa modalità, quando lo schermo si spegne l'app viene sospesa: la musica continua, ma il brano successivo non parte in automatico in background, e l'accesso a Spotify non torna indietro. Come si risolve: apri il sito in Safari, scegli Condividi > Aggiungi alla schermata Home e, quando compare l'opzione 'Apri come app web', TOGLILA. (Se l'opzione non compare, l'icona è già a posto.)";

      const riga = document.createElement("div");
      riga.className = "avviso-nascosti-riga riga-piu";

      const copia = document.createElement("button");
      copia.type = "button";
      copia.className = "avviso-nascosti-bottone";
      copia.textContent = "Copia il link";
      copia.addEventListener("click", async () => {
        const link = String(location.href).split("#")[0];
        try {
          await navigator.clipboard.writeText(link);
          copia.textContent = "Copiato: apri Safari e incolla";
        } catch (e) {
          copia.textContent = link;
        }
      });

      const chiudi = document.createElement("button");
      chiudi.type = "button";
      chiudi.className = "avviso-nascosti-bottone torna";
      chiudi.textContent = "Ho capito";
      chiudi.addEventListener("click", () => {
        box.remove();
        _avvisoIconaBox = null;
      });

      riga.appendChild(copia);
      riga.appendChild(chiudi);
      box.appendChild(testo);
      box.appendChild(riga);
      document.body.appendChild(box);
      _avvisoIconaBox = box;
      /* se non lo chiude, sparisce da solo: non deve restare li' per sempre */
      setTimeout(() => { if (_avvisoIconaBox === box) { box.remove(); _avvisoIconaBox = null; } }, 30000);
    } catch (e) { /* meglio non mostrare nulla che sbagliare */ }
  }

  /* Se riprovare non e' servito e il telefono torna in primo piano o Ste
     tocca qualcosa, riprendo: e' il momento in cui il browser permette
     di nuovo la riproduzione. */
  function _riprendiSeInAttesa() {
        /* Torno in primo piano o l'utente tocca: se la musica DOVE suonare,
           riprovo. Prima guardavo solo l'intento vecchio, ma il telefono con lo
           schermo spento l'aveva già azzerato: quindi riaprendo l'app non
           ripartiva niente. Adesso guardo l'intento vero. */
        if (!_vuoleSuonare || !currentId || !audio) return;
        /* Il brano e' finito mentre l'app era in secondo piano? Allora NON
           riprovo a suonarlo (un brano finito non riparte, e l'utente resta
           fermo): vado al successivo. Anche qui non riscrivo la scelta del
           brano, chiamo _finitoSenzaAvanti(), che usa handleEnded(). */
        try {
          const finito = audio.ended ||
            (isFinite(audio.duration) && audio.duration > 0 &&
              audio.currentTime >= audio.duration - 0.4);
          if (finito) {
            toast("La canzone era finita: e' partita la successiva");
            _finitoSenzaAvanti();
            return;
          }
        } catch (e) { /* se non riesco a valutarlo, riprovo sotto */ }
        if (!audio.paused) {
          /* gia' "in play": ma e' muto? lo dice _controllaCheSuoni */
          _controllaCheSuoni();
          return;
        }
        _ultimoScorrimento = Date.now();
        audio.play().then(() => { _ultimoScorrimento = Date.now(); }).catch(() => { _riprovaPiuTardi(); });
      }
  ["visibilitychange", "focus", "pageshow"].forEach((ev) => {
    document.addEventListener(ev, _riprendiSeInAttesa);
  });
  ["pointerdown", "touchstart", "keydown"].forEach((ev) => {
    window.addEventListener(ev, _riprendiSeInAttesa, { passive: true });
  });

  function _cominciaBranoNuovo() {
    /* sto cambiando brano: azzero il conto delle riprove */
    if (_timerRiprove) { clearTimeout(_timerRiprove); _timerRiprove = null; }
    if (_timerAiuto) { clearTimeout(_timerAiuto); _timerAiuto = null; }
  }

  /* ---------- Menu rapido (pressione lunga) ---------- */
  function persistQueue() {
    LS.set("mb.queue", queue);
  }

  function renderQueueCount() {
    const el = $("quickCount");
    if (el) {
      el.hidden = !queue.length;
      el.textContent = queue.length ? queue.length + (queue.length === 1 ? " brano in coda" : " brani in coda") : "";
    }
    const badge = $("queueBadge");
    if (badge) {
      badge.hidden = !queue.length;
      badge.textContent = queue.length ? (queue.length > 9 ? "9+" : queue.length) : "";
    }
  }

  function queueTrack(id, front) {
    if (front) queue.unshift(id);
    else queue.push(id);
    persistQueue();
    renderQueueCount();
    toast(front ? "Lo suono dopo questo" : "Aggiunto in coda");
  }

  function openQueue() {
    renderQueueList();
    $("queuePanel").hidden = false;
    syncNoScroll();
  }

  function closeQueue() {
    $("queuePanel").hidden = true;
    syncNoScroll();
  }

  function moveQueue(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= queue.length) return;
    const id = queue[i];
    queue[i] = queue[j];
    queue[j] = id;
    persistQueue();
    renderQueueList();
  }

  function removeQueue(i) {
    queue.splice(i, 1);
    persistQueue();
    renderQueueCount();
    renderQueueList();
    if (!queue.length) {
      $("queueHint").hidden = true;
      const body = $("queueBody");
      const e = document.createElement("p");
      e.className = "queue-empty";
      e.textContent = "Coda vuota. Tieni premuto su una canzone e scegli \u201cAscolta dopo\u201d o \u201cMetti in coda\u201d.";
      body.appendChild(e);
    }
  }

  function playFromQueue(i) {
    const id = queue.splice(i, 1)[0];
    persistQueue();
    renderQueueCount();
    closeQueue();
    playById(id);
  }

  function renderQueueList() {
    const body = $("queueBody");
    body.innerHTML = "";

    const now = tracks.find((x) => x.id === currentId);
    if (now) {
      const head = document.createElement("div");
      head.className = "queue-item queue-now";
      const hi = document.createElement("div");
      hi.className = "queue-info";
      const ht = document.createElement("div");
      ht.className = "queue-title";
      ht.textContent = now.title;
      hi.appendChild(ht);
      if (now.artist) {
        const ha = document.createElement("div");
        ha.className = "queue-artist";
        ha.textContent = now.artist;
        hi.appendChild(ha);
      }
      head.appendChild(hi);
      const tag = document.createElement("span");
      tag.className = "queue-now-tag";
      tag.textContent = "In riproduzione";
      head.appendChild(tag);
      body.appendChild(head);
    }

    if (!queue.length) {
      const e = document.createElement("p");
      e.className = "queue-empty";
      e.textContent = "Coda vuota. Tieni premuto su una canzone e scegli \u201cAscolta dopo\u201d o \u201cMetti in coda\u201d.";
      body.appendChild(e);
      $("queueHint").hidden = true;
      return;
    }
    $("queueHint").hidden = false;

    const btnUp = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 5l7 7-1.4 1.4L12 7.8 6.4 13.4 5 12l7-7Z"/></svg>';
    const btnDown = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 19l-7-7 1.4-1.4L12 16.2l5.6-5.6L19 12l-7 7Z"/></svg>';
    const btnPlayQ = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5a1 1 0 0 1 1.5-.87l11 6.5a1 1 0 0 1 0 1.74l-11 6.5A1 1 0 0 1 8 18.5v-13Z"/></svg>';
    const btnClose = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5l5 5 5-5 1.4 1.4L13.4 12l5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5Z"/></svg>';

    const mkBtn = (title, html, fn, disabled) => {
      const b = document.createElement("button");
      b.className = "qbtn";
      b.type = "button";
      b.title = title;
      b.setAttribute("aria-label", title);
      b.innerHTML = html;
      b.disabled = !!disabled;
      b.addEventListener("click", fn);
      return b;
    };

    queue.forEach((id, i) => {
      const t = tracks.find((x) => x.id === id);
      const row = document.createElement("div");
      if (!t) {
        row.className = "queue-item queue-gone";
        const g = document.createElement("div");
        g.className = "queue-info";
        const gt = document.createElement("div");
        gt.className = "queue-title";
        gt.textContent = "Brano non più disponibile";
        g.appendChild(gt);
        row.appendChild(g);
        row.appendChild(mkBtn("Rimuovi", btnClose, () => removeQueue(i)));
        body.appendChild(row);
        return;
      }

      row.className = "queue-item";
      const num = document.createElement("div");
      num.className = "queue-num";
      num.textContent = i + 1;
      row.appendChild(num);

      const info = document.createElement("div");
      info.className = "queue-info";
      info.title = "Riproduci ora";
      info.addEventListener("click", () => playFromQueue(i));
      const ti = document.createElement("div");
      ti.className = "queue-title";
      ti.textContent = t.title;
      info.appendChild(ti);
      if (t.artist) {
        const ar = document.createElement("div");
        ar.className = "queue-artist";
        ar.textContent = t.artist;
        info.appendChild(ar);
      }
      row.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "queue-actions";
      actions.appendChild(mkBtn("Riproduci", btnPlayQ, () => playFromQueue(i)));
      actions.appendChild(mkBtn("Sposta su", btnUp, () => moveQueue(i, -1), i === 0));
      actions.appendChild(mkBtn("Sposta giù", btnDown, () => moveQueue(i, 1), i === queue.length - 1));
      actions.appendChild(mkBtn("Rimuovi", btnClose, () => removeQueue(i)));
      row.appendChild(actions);
      body.appendChild(row);
    });
  }

  function closeQuick() {
    $("quickPanel").hidden = true;
    /* Chiudere il menu azzera anche il "fermo" dei tocchi: prima restava
       attaccato e il tocco successivo su un brano veniva ignorato, quindi
       premere su una canzone non faceva niente. */
    suppressClick = false;
    syncNoScroll();
  }

  function quickAction(label, iconPath, fn, danger) {
    const b = document.createElement("button");
    b.className = "quick-btn" + (danger ? " danger" : "");
    b.type = "button";
    b.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="' + iconPath + '"/></svg>';
    b.appendChild(document.createTextNode(label));
    b.addEventListener("click", () => {
      closeQuick();
      fn();
    });
    return b;
  }

  const ICON_PLAYLIST = "M3 6h12v2H3V6Zm0 5h12v2H3v-2Zm0 5h12v2H3v-2ZM17 9v3h-2v3h-2v-3h-3V9h3V6h2v3h2Z";
  const ICON_QUEUE = "M3 6h18v2H3V6Zm0 5h11v2H3v-2Zm0 5h11v2H3v-2Zm13-6 4 3-4 3v-6Z";
  /* Libreria: la usano i comandi "solo nella playlist" / "torna in
     libreria", cosi' si distinguono da quelli delle playlist. */
  const ICON_LIBRARY = "M4 4h4v16H4V4Zm6 0h4v16h-4V4Zm7.2.4 1.4 14.4-4.2 1.4-14.4Z";
const ICON_EDIT = "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z";
  const ICON_NEXT = "M6 5l9 7-9 7V5Zm10 0h2v14h-2V5Z";
  const ICON_HIDE = "M3.3 2 2 3.3l2.4 2.4C2.5 7 1.4 8.7 1 9c1.1 2.3 4 5 7 6l2 2 1.3-1.3 15.4 15.4 1.3-1.3L3.3 2ZM12 5c4.4 0 8 4 8 4-.5 1-1.6 2.4-3.1 3.5l-1.5-1.5c1-.9 1.6-1.9 1.9-2.6-.6-.8-2.6-2.4-5.3-2.4-.4 0-.8 0-1.2.1L9.6 4.9c.8-.1 1.6-.1 2.4-.1Z";
  const ICON_SHARE = "M18 16a3 3 0 0 0-2.4 1.2l-6.9-4a3 3 0 0 0 0-1.4l7-4.1A3 3 0 1 0 15 6c0 .2 0 .4.1.6l-7 4.1a3 3 0 1 0 0 6.6l6.9 4A3 3 0 1 0 18 16Z";
  const ICON_OFFLINE = "M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z";

  /* Porto un brano nella mia libreria.

     NON e' uno spostamento: la canzone resta dov'e', e semplicemente entra
     anche nella mia. E' quello che chiedeva Stefano: "voglio che si duplichi,
     non che si sposti dalla mia alla sua eliminandosi dalla mia".

     Non si copia nemmeno il file audio (sarebbe sprecato: il brano e' gia'
     online e lo sentiamo entrambi dallo stesso indirizzo). Metto il brano
     nella mia lista, che salvo anche sul sito cosi' vale su ogni dispositivo.

     Ste: "se vado nel suo profilo posso trasportare delle canzoni che
     seleziono nel mio account creando una copia". Percio' la destinazione non
     e' piu' il profilo aperto: e' SEMPRE il suo account (quello di default),
     anche mentre sto guardando la libreria di un amico. Prima, se aprivo il
     profilo di Diego e copiavo una canzone, finiva nella lista di Diego e non
     nella mia: la copia non me la ritrovavo. */
  async function _portaNellaMiaLibreria(t, profiloDestinazione) {
    if (!t) return false;
    const numero = (/^track-(\d+)\.mp3$/.exec(String(t.url || "").replace(/^.*\//, "")) || [])[1];
    if (!numero) {
      toast("Non posso copiare questo brano: non so qual e' il suo numero");
      return false;
    }
    const id = "b-track-" + numero;
    const destinazione = String(profiloDestinazione || DEFAULT_PROFILE);
    /* La lista va letta e scritta sul profilo di destinazione, non su quello
       aperto: altrimenti copierei sempre nella lista di chi sto guardando. */
    let gia = new Set();
    try {
      const v = JSON.parse(LS.get(LS_MIEI, "{}"));
      const miei = (v && typeof v === "object") ? v : {};
      gia = new Set(Array.isArray(miei[destinazione]) ? miei[destinazione] : []);
    } catch (e) { gia = new Set(); }
    if (gia.has(id)) {
      toast('"' + t.title + '" e\' gia\' nella tua libreria');
      return false;
    }
    /* Prima sul telefono, cosi' si vede subito anche se non ho rete. */
    try {
      const v = JSON.parse(LS.get(LS_MIEI, "{}"));
      const miei = (v && typeof v === "object") ? v : {};
      miei[destinazione] = [...new Set([...gia, id])].sort();
      LS.set(LS_MIEI, JSON.stringify(miei));
    } catch (e) { /* noop */ }
    try { await loadAll(); } catch (e) { /* noop */ }
    render();
    toast('"' + t.title + '" ora e\' anche nella tua libreria (a ' + (t.profile || "?") + ' resta)');
    /* Poi sul sito, cosi' la ritrovo su questo e sull'altro dispositivo. */
    _salvaStatoCondiviso();
    return true;
  }

  function openQuickMenu(t) {
    if (!t) return;
    $("quickTitle").textContent = t.title;
    const box = $("quickActions");
box.innerHTML = "";
  /* Prima cosa nel menu: cambiare il nome. Stava in una pressione lunga
     separata, ma sul telefono un semplice tocco genera anche gli eventi del
     mouse e quella finestra si apriva da sola mentre ascoltavi. Ora la
     pressione lunga apre SOLO questo menu, e qui dentro c'e' tutto. */
  box.appendChild(quickAction("Cambia nome e artista", ICON_EDIT, () => apriRinomina(t.id)));
  box.appendChild(quickAction("Ascolta dopo", ICON_NEXT, () => queueTrack(t.id, true)));
    box.appendChild(quickAction("Metti in coda", ICON_QUEUE, () => queueTrack(t.id, false)));
      /* La playlist e' una mia scelta, quindi la scelgo da qui: tengo questa
         voce nel menu del brano per decidere in che playlist metterlo. */
      box.appendChild(quickAction("Aggiungi alla playlist", ICON_PLAYLIST, () => aggiungiAPlaylist(t.id)));

  /* "Solo nella playlist": sparisce dalla libreria ma resta suonabile
     dentro la playlist. Serve a chi ha brani da usare in un momento
     preciso (allenamento) e non li vuole mischiati con gli altri. */
  if (_soloInPlaylist.has(_chiaveSoloInPlaylist(t.id)) || _soloInPlaylist.has(t.id)) {
    box.appendChild(quickAction("Torna in libreria", ICON_LIBRARY, () => {
      _togliSoloInPlaylist(t.id);
      _disegnaLinguettePlaylist();
      render();
      toast('"' + t.title + '" e\' di nuovo nella libreria');
    }));
  } else {
    const inChePlaylist = _playlistCheContengono(t.id);
    if (inChePlaylist.length) {
      box.appendChild(quickAction("Solo nella playlist", ICON_LIBRARY, async () => {
        const si = await askConfirm(
          "Solo nella playlist?",
          '"' + t.title + '" sparisce dalla libreria, ma resta suonabile dentro\n"' +
            inChePlaylist.join('", "') + '".\n\n' +
            "Per rivederlo: apri quella playlist. Per riportarlo in libreria: " +
            "tieni premuto e scegli 'Torna in libreria'.",
          "Sposta"
        );
        if (!si) return;
        _mettiSoloInPlaylist(t.id);
        _playlistAttiva = inChePlaylist[0];
        _disegnaLinguettePlaylist();
        render();
        toast('"' + t.title + '" ora si vede solo dentro "' + inChePlaylist[0] + '"');
      }));
    }
  }
    /* Se una canzone e' di un altro nome, posso averla anche io. Stefano lo
     vuole cosi': che si DUPLICA nella mia libreria, e all'altro resta com'e'. */
  if (t.builtin && t.profile && t.profile !== profile) {
    box.appendChild(quickAction("Porta nella mia libreria", ICON_LIBRARY, async () => {
      const si = await askConfirm(
        "Copiare questa canzone nella tua libreria?",
        '"' + t.title + '" e\' di ' + t.profile + '.\n\n' +
          "Copia e basta: a " + t.profile + " resta esattamente come adesso,\n" +
          "non perde niente e non gli sparisce niente.",
        "Copia"
      );
      if (!si) return;
      await _portaNellaMiaLibreria(t);
    }));
  }
  /* Ste: "diego aveva scaricato le canzoni ma non gliele faceva
     ascoltare senza connessione". Il bottone di download offline c'era
     solo per i brani "builtin" (quelli dell'app): i brani condivisi, come
     quelli di Diego, non avevano nemmeno il pulsante. Ora c'e' per tutti i
     brani che hanno un file. */
  if (t.url) {
    const el = document.createElement("button");
    el.className = "quick-btn";
    el.type = "button";
    el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="' + ICON_OFFLINE + '"/></svg>';
    const gia = isCached(t);
    el.appendChild(document.createTextNode(gia ? "Già salvata offline" : cloudBusy ? "Salvataggio..." : "Salva per offline"));
    el.disabled = gia;
    el.style.opacity = gia ? ".55" : "1";
    el.addEventListener("click", () => {
    closeQuick();
    if (!cloudBusy) cacheOneTrack(t);
    });
    box.appendChild(el);
  } else {
  box.appendChild(quickAction("Condividi file", ICON_SHARE, () => exportTrack(t)));
  }
    /* Ste: "togli completamente sta cosa dei nascosti" e "quando elimino una
       canzone si elimini direttamente per sempre chiedendo pero' una
       conferma". */
    box.appendChild(quickAction("Elimina", ICON_HIDE, () => _eliminaBrano(t.id), true));
    renderQueueCount();
    $("quickPanel").hidden = false;
    syncNoScroll();
  }

  /* Qui si rimettono i brani nascosti: la finestra con la lista di "nascosti"
     e' stata tolta (l'eliminazione chiede gia' conferma, quindi era inutile),
     ma se un brano e' stato nascosto puoi riportarlo qui, dal menu del brano
     o del profilo. */
  function bindLongPress(el, t) {

    let timer = null;
    let startX = 0;
    let startY = 0;
    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest("button")) return;
      startX = e.clientX || 0;
      startY = e.clientY || 0;
      timer = setTimeout(() => {
        timer = null;
        suppressClick = true;
        try { navigator.vibrate && navigator.vibrate(8); } catch (err) { /* noop */ }
        openQuickMenu(t);
      }, 550);
      const moved = (ev) => {
        if (!timer) return;
        const dx = Math.abs((ev.clientX || 0) - startX);
        const dy = Math.abs((ev.clientY || 0) - startY);
        if (dx > 10 || dy > 10) stop();
      };
      const up = () => {
        stop();
        el.removeEventListener("pointermove", moved);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      };
      el.addEventListener("pointermove", moved);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /* ---------- Player ---------- */
  function current() {
    return tracks.find((t) => t.id === currentId) || null;
  }

  function setArt(el, t) {
    if (!el) return;
    const cover = t && t.cover ? String(t.cover).replace(/["'()]/g, "") : "";
    if (cover) {
      el.style.backgroundImage = 'url("' + cover + '")';
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage = "";
      el.style.background = t ? t.gradient : "linear-gradient(135deg,#333,#222)";
    }
  }

  /* Vero quando la libreria e' arrivata davvero (cosi' la schermata vuota
     non fa credere che non ci sia niente mentre sta caricando). */
  var _libreriaPronta = false;
  function _segnaRigaAttiva() {
    if (tracks && tracks.length) _libreriaPronta = true;
    const t = current();
    setArt($("playerArt"), t);
    setArt($("hudArt"), t);
    /* Ste: ha mandato la foto della schermata vuota e credeva che la
       libreria fosse sparita. Era solo il momento PRIMA che arrivasse.
       Ora, mentre carica, la scritta lo dice. */
    const staCaricando = !t && !_libreriaPronta;
    $("playerTitle").textContent = t ? t.title : "—";
    $("hudTitle").textContent = t ? t.title : (staCaricando ? "Sto caricando..." : "Nessuna traccia");
    $("hudSub").textContent = t ? (currentLyrics() ? "Testo disponibile" : t.builtin ? "Brano incluso" : "Brano aggiunto")
      : (staCaricando ? "Un attimo, sto prendendo la libreria" : "Aggiungi musica per iniziare");
    updateLyricsButton();
    render();
  }

  function updateLyricsButton() {
    $("btnLyrics").hidden = !currentLyrics();
  }

  function currentLyrics() {
    if (!currentId) return null;
    const builtin = lyricsData[currentId];
    const saved = localLyrics[currentId];
    if (saved && saved.synced && parseSynced(saved.synced).length >= 3) return saved;
    if (builtin && builtin.synced && parseSynced(builtin.synced).length >= 3) return builtin;
    if (saved && saved.text) return saved;
    if (builtin && builtin.text) return builtin;
    return null;
  }

  /* Recupero graduale mentre la pagina e' aperta: testi sincronizzati
     prioritari, senza sovrascrivere i testi gia' funzionanti. */
  const _testiInRicerca = new Set();
  const _testiTentati = new Set();
  let _testiPrefetchAttivo = false;
  let _testiPrefetchPrevisto = false;

  async function _completaTestoInAscolto(t, syncedOnly = false) {
    if (!t || !t.id || !t.title || !t.artist) return;
    const preesistente = localLyrics[t.id] || lyricsData[t.id] || null;
    if (preesistente && preesistente.synced &&
        parseSynced(preesistente.synced).length >= 3) return;
    if (_testiInRicerca.has(t.id) || _testiTentati.has(t.id)) return;
    if (Date.now() < _lrclibNonPrimaDi && syncedOnly) return;
    _testiInRicerca.add(t.id);
    try {
      const risultato = await findLyrics(t.artist, t.title, {
        syncedOnly, album: t.spotifyAlbum || t.album || "",
        durationMs: t.spotifyDurationMs || 0
      });
      if (!risultato || !risultato.text) {
        if (Date.now() >= _lrclibNonPrimaDi) _testiTentati.add(t.id);
        return;
      }
      const tieneUnTesto = preesistente && preesistente.text;
      const conTempi = risultato.synced && parseSynced(risultato.synced).length >= 3;
      if (!conTempi && tieneUnTesto) {
        _testiTentati.add(t.id);
        return;
      }
      const entry = {
        id: t.id, title: t.title, artist: t.artist,
        text: risultato.text, synced: risultato.synced || "",
        source: risultato.source || ""
      };
      localLyrics[t.id] = entry;
      _testiTentati.add(t.id);
      try { if (db) await dbPutLyrics(entry); } catch (e) { /* Conservato almeno nella sessione. */ }
      if (currentId === t.id) {
        updateLyricsButton();
        const sub = $("hudSub");
        if (sub) sub.textContent = conTempi ? "Testo karaoke disponibile" : "Testo disponibile";
        if (!$("lyricsPanel").hidden) openLyrics();
      }
    } catch (e) { /* Nessuna richiesta di testo deve fermare la musica. */ }
    finally { _testiInRicerca.delete(t.id); }
  }

  function _programmaTestiKaraoke() {
    if (_testiPrefetchAttivo || _testiPrefetchPrevisto || !db || document.hidden) return;
    _testiPrefetchPrevisto = true;
    setTimeout(async () => {
      _testiPrefetchPrevisto = false;
      if (_testiPrefetchAttivo || document.hidden) return;
      if (Date.now() < _lrclibNonPrimaDi) {
        setTimeout(_programmaTestiKaraoke, 25000);
        return;
      }
      _testiPrefetchAttivo = true;
      const profiloIniziale = profile;
      let scansioni = 0;
      try {
        /* Il catalogo completo comprende anche i profili non aperti.
           I risultati si salvano per ID, senza spostare brani fra account. */
        const elencoDaCompletare = BUILTIN.map((b) => ({
          id: _idBranoStabile(b),
          title: stripArtistPrefix(b.artist, b.title),
          artist: b.artist || "",
          album: b.spotifyAlbum || "",
          spotifyAlbum: b.spotifyAlbum || "",
          spotifyDurationMs: b.spotifyDurationMs || 0,
          profile: b.profile || DEFAULT_PROFILE
        })).concat(tracks.filter((t) => !t.builtin));
        for (const t of elencoDaCompletare) {
          if (profile !== profiloIniziale || document.hidden || scansioni >= 8) break;
          if (!t || !t.id || !t.artist || _testiTentati.has(t.id) || _testiInRicerca.has(t.id)) continue;
          const attuale = localLyrics[t.id] || lyricsData[t.id];
          if (attuale && attuale.synced && parseSynced(attuale.synced).length >= 3) continue;
          if (Date.now() < _lrclibNonPrimaDi) break;
          scansioni++;
          await _completaTestoInAscolto(t, true);
          await new Promise((resolve) => setTimeout(resolve, 650));
        }
      } finally { _testiPrefetchAttivo = false; }
      if (profile === profiloIniziale && !document.hidden &&
          elencoDaCompletare.some(t => t && t.artist && !_testiTentati.has(t.id) &&
            !(localLyrics[t.id] && localLyrics[t.id].synced) &&
            !(lyricsData[t.id] && lyricsData[t.id].synced))) {
        setTimeout(_programmaTestiKaraoke, 12000);
      }
    }, 4500);
  }
  try {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) _programmaTestiKaraoke();
    });
  } catch (e) { /* noop */ }

async function playById(id, autoplay = true) {
      const t = tracks.find((x) => x.id === id);
      if (!t) return;
      /* Prima di cambiare: metto in cronologia il brano che sto lasciando,
         cosi' il tasto "indietro" torna davvero a quello. */
      if (id !== currentId) _ricordaBrano(currentId);
      if (id !== currentId) resumeAt = 0;
      currentId = id;
      setTimeout(() => { _completaTestoInAscolto(t).catch(() => {}); }, 1800);
      /* Ste: "quando cambia canzone si aggiorna in automatico il testo".
         Prima restavano i testi del brano precedente. */
      try {
        if (!$("lyricsPanel").hidden && typeof openLyrics === "function") openLyrics();
      } catch (e) { /* noop */ }
    /* Cambio brano: chiudo il conto del pezzo precedente e riparto. */
    _chiudiAscolto(false);
    if (autoplay) _contaAscoltoNuovo(t);
    _iniziaAscolto();
    writeProfileState(profile, { last: id, time: 0 });
    if (!audio) audio = createAudio();
    if (autoplay) {
      _cominciaBranoNuovo();
      /* sto cambiando brano da solo: da qui la musica DEVE suonare */
      _vuoleSuonare = true;
      _ultimoScorrimento = Date.now();
    }
    // La pausa generata dal cambio di sorgente non e' una pausa dell'utente.
    audio._mbCambioBrano = true;
    const _url = _urlDelBrano(t);
    /* Ste: "il boost sembra che non sia cambiato nulla". Metto in traccia
       l'indirizzo che uso davvero: se c'e' scritto "bassi" il brano e'
       potenziato, se c'e' "songs/" e' l'originale. */
    try { _diChe("suono: " + (String(_url).indexOf("/bassi/") >= 0 ? "POTENZIATO" : "originale") + " " + t.id); } catch (e) { }
    audio.src = _url;
    /* La tengo in mano mentre la ascolto: e' cosi' che spostare la barra
       dentro la canzone non deve aspettare la rete. Vedi la nota sopra
       _scaricaDaSolaSeServe. */
    try { _scaricaDaSolaSeServe(t); } catch (e) { /* noop */ }
    _applicaAudio();
    _segnaRigaAttiva();
    /* Se la pagina dei testi e' aperta, il play/pausa e' lo sfondo devono
       seguire il brano nuovo. */
    if (!$("lyricsPanel").hidden) { _aggiornaComandiTesti(); _aggiornaSfondoTesti(); }
    updateProgressUI(0, 0);
    const activeEl = playlistEl.querySelector(".track.active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    updateMediaSession();
    if (autoplay) await doPlay();
    /* tengo pronto il brano dopo, cosi' quando questo finisce parte subito */
    if (autoplay) _preparaIlSuccessivo(queue.length ? queue[0] : idBranoA(nextIndex()));
  }

  /* Il brano in una certa posizione, ma SENZA far esplodere niente.
     Prima scrivevo direttamente tracks[indice].id: se la libreria e' vuota
     (un computer nuovo, o un profilo senza brani, o tutti brani nascosti)
     tracks[0] non esiste e la pagina si fermava con un errore. */
  function idBranoA(indice) {
      if (indice === null || indice === undefined || indice < 0) return "";
      /* Leggo dalla stessa lista usata da nextIndex/prevIndex, altrimenti
         l'indice punta a un brano diverso (e' successo: avanti suonava un
         brano nascosto perche' gli indici venivano da due liste diverse). */
      const lista = _listaPerIlSeguito();
      const t = (lista && lista[indice]) ? lista[indice] : tracks[indice];
      return (t && t.id) ? t.id : "";
    }

  /* Avanti/Indietro devono seguire la lista che sto GUARDANDO, non tutti i
     brani. Prima usavano "tracks" (tutti), quindi passando da un brano al
     successivo si sentivano anche quelli nascosti e quelli rimasti solo
     dentro una playlist: esattamente quello che non voleva Stefano.

     Se sono dentro una playlist, il seguito e' quello della playlist; se
     sto filtrando (preferiti, mai ascoltati, ricerca) vedo quello che
     vedo. */
  /* La lista per capire quale canzone viene dopo. "true" = sto per far
     suonare qualcosa, non solo sfogliare: cambia il comportamento (vedi
     visibleTracks). */
  function _listaPerIlSeguito() {
    try { return visibleTracks(true); } catch (e) { return tracks; }
  }

  /* Canzoni gia' suonate nella riproduzione casuale.

   Ste vuole che in casuale non si senta due volte la stessa canzone: quando
   non ne rimangono di fresche, ricomincio da capo (e quindi ricominciano anche
   le ripetizioni, altrimenti la musica resterebbe ferma). */
let _casualeFresche = null;

function _azzeraCasuale() { _casualeFresche = null; }

function _prossimaCasuale(lista) {
  if (!_casualeFresche || _casualeFresche.size === 0) {
    _casualeFresche = new Set(lista.map((t) => t.id));
  }
  /* Se sono finite le fresche, ricomincio il giro. */
  if (_casualeFresche.size >= lista.length) {
    _casualeFresche = new Set(lista.map((t) => t.id));
  }
  /* La canzone che sta suonando non e' piu' "fresca". */
  if (currentId) _casualeFresche.delete(currentId);
const rimaste = lista.filter((t) => _casualeFresche.has(t.id));
    if (!rimaste.length) {
      _casualeFresche = new Set(lista.map((t) => t.id));
      return Math.floor(Math.random() * lista.length);
    }
    /* Ste: "lo shuffle funziona?". Qui c'era un difetto: il numero casuale
       stava DENTRO la ricerca, quindi veniva rilanciato a ogni canzone
       esaminata e il confronto era sempre con un candidato diverso. Quando
       non capitava nessuna uguaglianza la ricerca dava -1, e la riproduzione
       casuale ripartiva sempre dall'inizio: si sentiva la stessa canzone
       oppure sembrava che non funzionasse.

       Ora il brano lo scelgo una volta sola, e poi cerco quello. */
    const scelto = rimaste[Math.floor(Math.random() * rimaste.length)];
    return lista.findIndex((t) => t.id === scelto.id);
  }

  function nextIndex() {
    const lista = _listaPerIlSeguito();
    if (!lista.length) return -1;
    if (shuffle && lista.length > 1) {
      const n = _prossimaCasuale(lista);
      return n >= 0 ? n : 0;
    }
    const idx = lista.findIndex((x) => x.id === currentId);
    /* Se il brano che sto ascoltando non e' nella lista (l'ho appena tolto,
       o ero dentro una playlist e ora sono fuori), parto dall'inizio
       invece di dare un indice a caso. */
    if (idx < 0) return 0;
    return (idx + 1) % lista.length;
  }

  function prevIndex() {
    const lista = _listaPerIlSeguito();
    if (!lista.length) return -1;
    /* Con il casuale acceso, "indietro" deve tornare alla canzone che stavo
       davvero ascoltando prima, non a quella che sta prima nell'elenco. */
    const dallaCronologia = _storicoPrecedente();
    if (dallaCronologia) {
      const i = lista.findIndex((x) => x.id === dallaCronologia);
      if (i >= 0) return i;
    }
    const idx = lista.findIndex((x) => x.id === currentId);
    if (idx < 0) return 0;
    return (idx - 1 + lista.length) % lista.length;
  }

  /* Ste: "nell'account di Diego il tasto avanti non va avanti e quando finisce
   una canzone non parte l'altra". Sul telefono non posso aprire la console del
   browser per vedere che cosa succede, quindi qui lascio scritto come va la
   coda e lo mostro dentro la pagina (vedi il riquadro "Perche' non va avanti").
   Se una riga dice 0 brani in coda, o un brano dopo che non esiste, o un
   errore, quello e' il motivo. */
function playNext() {
    try {
      if (queue.length) {
        const next = queue.shift();
        persistQueue();
        renderQueueCount();
        playById(next);
        return;
      }
      playById(idBranoA(nextIndex()));
    } catch (e) {
      /* Non lascio che un errore qui fermi tutto. */
      console.warn("tasto avanti: errore", e);
    }
  }

  /* Mettere in pausa o far ripartire, per scelta.

     Stanno QUI e non dentro i singoli tasti, perche' prima ogni tasto si
     fermava da solo e il risultato era che quello del blocco schermo fermava
     l'audio senza dire niente all'app: entro tre secondi l'app credeva che
     avessi dimenticato di mettere play e la musica ripartiva da sola.

     Ora: il tasto play, il tasto pausa del telefono e quello del blocco
     schermo passano tutti di qui, quindi non possono piu' discordare. */
  function _pausaVolontaria() {
    _segna("pausa VOLUTARIA (premi tu o il play del telefono)");
    /* "adesso il silenzio e' voluto": lo dico subito a tutto il resto,
       altrimenti chi aspetta di riavviare la musica mi riaccende. */
    _vuoleSuonare = false;
    _segnaIntenzioneSono(false);
    _silenziDiFila = 0;
    if (_timerRiprove) { clearTimeout(_timerRiprove); _timerRiprove = null; }
    if (_timerAiuto) { clearTimeout(_timerAiuto); _timerAiuto = null; }
    if (audio) { try { audio.pause(); } catch (e) { /* noop */ } }
    _nascondiAiuto();
    syncPlayUI();
    /* Teniamo attiva la notifica anche quando la musica e' fermata,
       cosi' resta visibile finche' non chiudi l'app dal background. */
    try { updateMediaSession(); } catch (e) { /* noop */ }
  }

  /* Ste: "riapro l'app e si ferma la canzone, senza che io tocchi nulla".
     Sul telefono, quando l'app resta un po' in secondo piano, il sistema
     BUTTA VIA la pagina e alla riapertura riparte da capo. La musica si
     ferma e nessuno la riavvia, perche' la domanda "Ste stava ascoltando o no"
     stava solo nella memoria della pagina, che ho appena perso.

     Qui la domanda la metto sul telefono, e al riavvio la ritrovo. */
  function _segnaIntenzioneSono(vuole) {
    try { LS.set("mb.suonava", vuole ? "si" : "no"); } catch (e) { /* noop */ }
  }
  function _avevoIntesoDiAscoltare() {
    try { return LS.get("mb.suonava", "no") === "si"; } catch (e) { return false; }
  }

  /* Riaccende la musica dopo che la pagina e' stata ricaricata dal telefono.

     Ste: "l'app si aggiorna appena apro e per questo si blocca". Quando esce
     una versione nuova, il telefono riapre l'app con la pagina nuova e la
     musica resta ferma. Prima pero' provavo UNA volta sola, 2 secondi dopo
     l'apertura: ma la libreria in quel momento non e' ancora pronta (ci mette
     qualche secondo), e la l'avevo brani vuoti, quindi rinunciavo e non
     ripartiva piu'. Adesso insisto per un po': aspetto i brani e poi riparto. */
  let _ripresaGiaRiuscita = false;
  function _riprendiDopoRicarica() {
    if (_ripresaGiaRiuscita) return;
    if (!_avevoIntesoDiAscoltare()) return;
    let tentativi = 0;
    const prova = () => {
      if (_ripresaGiaRiuscita) return;
      if (!_avevoIntesoDiAscoltare()) return;
      /* La libreria non e' ancora pronta: non e' un errore, riprovo dopo. */
      if (!currentId || !audio || !tracks.length) {
        if (tentativi++ < 20) setTimeout(prova, 800);
        return;
      }
      if (!audio.paused) { _ripresaGiaRiuscita = true; return; }
      if (tentativi++ < 20) {
        audio.play().then(() => {
          _ripresaGiaRiuscita = true;
          _vuoleSuonare = true;
          syncPlayUI();
          updateMediaSession();
        }).catch(() => { setTimeout(prova, 1000); });
      }
    };
    setTimeout(prova, 500);
    /* Appena arriva un tocco riparto sicuramente: il telefono vieta l'avvio
       da solo, quindi se l'ha vietato aspetto che Ste tocchi qualcosa. */
    try {
      ["pointerdown", "touchstart", "keydown"].forEach((ev) => {
        window.addEventListener(ev, () => {
          if (currentId && audio && audio.paused && _avevoIntesoDiAscoltare() && !_ripresaGiaRiuscita) {
            _riproduciVolontaria();
            _ripresaGiaRiuscita = true;
          }
        }, { passive: true });
      });
    } catch (e) { /* noop */ }
  }

  function _riproduciVolontaria() {
    _segna("riproduzione VOLUTARIA");
    _vuoleSuonare = true;
    _segnaIntenzioneSono(true);
    _ultimoScorrimento = Date.now();
    _silenziDiFila = 0;
    if (_timerRiprove) { clearTimeout(_timerRiprove); _timerRiprove = null; }
    if (_timerAiuto) { clearTimeout(_timerAiuto); _timerAiuto = null; }
    return doPlay();
  }

  async function togglePlay() {
    if (!currentId && tracks.length) await playById(tracks[0].id);
    /* l'utente preme play quando e' fermo, e pause quando sta suonando */
    if (audio.paused) _riproduciVolontaria();
    else _pausaVolontaria();
  }

  /* Comandi ricevuti dal player nativo iOS (solo quando il bridge esiste). */
  window.addEventListener("musicbox-native-control", (event) => {
    const detail = (event && event.detail) || {};
    try {
      switch (detail.action) {
        case "play":
          _riproduciVolontaria();
          break;
        case "pause":
          _pausaVolontaria();
          break;
        case "toggle":
          if (audio && !audio.paused) _pausaVolontaria();
          else _riproduciVolontaria();
          break;
        case "next":
          playNext();
          break;
        case "previous": {
          const id = idBranoA(prevIndex());
          if (id) playById(id);
          break;
        }
        case "seek":
          if (audio && isFinite(Number(detail.time)) && isFinite(audio.duration)) {
            audio.currentTime = Math.max(0, Math.min(Number(detail.time), audio.duration));
            updateProgressUI(audio.currentTime, audio.duration);
            _notificaStatoNativo(true);
          }
          break;
      }
    } catch (e) { /* controllo remoto non disponibile: nessun effetto su Safari */ }
  });

  function setSvgVisible(el, visible) {
    if (visible) el.removeAttribute("hidden");
    else el.setAttribute("hidden", "");
  }

function syncPlayUI() {
  if (!audio) return;
  setSvgVisible($("iconPlay"), audio.paused);
  setSvgVisible($("iconPause"), !audio.paused);
  setPlaybackState(audio.paused ? "paused" : "playing");
  const art = $("playerArt");
  if (art) art.classList.toggle("playing", !audio.paused);
  const hud = $("hudArt");
  if (hud) hud.classList.toggle("playing", !audio.paused);
  /* se il brano si e' fermo o e' finito, anche la schermata di blocco
     del telefono deve saperlo */
  if (audio.paused || audio.ended) _aggiornaPosizioneSchermo();
  }

  /* La copertina da mostrare sulla schermata di blocco del telefono.
     La copertina puo' essere un indirizzo internet (le copertine buone
     sono in covers.json) oppure un'immagine scaricata e tenuta sul
     dispositivo (quella che ho cercato io con "Scarica tutte le copertine
     mancanti"). */
let _copertinaSchermoUrl = "";
function _copertinaPerSchermo(t) {
    const c = t && t.cover;
    try {
      if (typeof c === "string" && /^https?:\/\//i.test(c)) return c;
      /* Le copertine sono anche nel sito, nella cartella "copertine": sono
         percorsi relativi ("copertine/xxx.jpg"). Prima l'app li scartava
         (accettava solo http://) e, non trovando la copertina, metteva
         la sua icona nella notifica: si vedeva il logo del Music Box
         invece della copertina (Ste, 20/10/2026). La notifica vuole
         anche un indirizzo completo, quindi lo completo qui. */
      if (typeof c === "string" && c.trim() && !/^data:/i.test(c)) {
        try { return new URL(c, document.baseURI).href; } catch (e) { return c; }
      }
      if (c && typeof c !== "string" && typeof c.size === "number") {
        /* non tengo via gli indirizzi vecchi, altrimenti a ogni brano
           se ne crea uno nuovo e la memoria del telefono si riempie */
        if (_copertinaSchermoUrl) URL.revokeObjectURL(_copertinaSchermoUrl);
        _copertinaSchermoUrl = URL.createObjectURL(c);
        return _copertinaSchermoUrl;
      }
    } catch (e) { /* noop */ }
    return "";
  }

  /* Dov'e' la canzone nella barra: serve per la barra della schermata
     di blocco. Il telefono la disegna da solo se glielo diciamo. */
let _ultimaPosizioneSchermo = 0;
function _aggiornaPosizioneSchermo() {
  if (!("mediaSession" in navigator)) return;
  if (!navigator.mediaSession.setPositionState) return;
  /* Non lo chiamo a ogni evento della musica: sono 4-5 volte al secondo e
     non serve. Una volta ogni due secondi la barra della schermata di
     blocco scorre comunque, e il telefono respira meglio. */
  const ora = Date.now();
  if (ora - _ultimaPosizioneSchermo < 800) return;
  _ultimaPosizioneSchermo = ora;
  try {
    const d = audio && isFinite(audio.duration) ? audio.duration : 0;
    if (!d || d <= 0) return;
    const p = Math.max(0, Math.min(audio.currentTime || 0, d));
    navigator.mediaSession.setPositionState({
      duration: d,
      playbackRate: (audio.playbackRate || 1),
      position: p
    });
  } catch (e) { /* noop */ }
  }

  /* Ste: "non va ancora". Il permesso in realta' arrivava (le tracce lo
     dicono), ma non si vedeva da nessuna parte: sembrava che l'app non
     avesse fatto niente. Adesso il bottone "Spotify" dice che sei
     collegato. */
  function _mostraCollegatoSi() {
    try {
      const b = $("btnSpotify");
      if (!b) return;
      /* Ste: "spunta spotify collegato pero' mi dice che e' scaduto".
         Motivo: dicevo "collegato" appena avevo il permesso, anche se era
         scaduto. Adesso lo dico solo se il permesso e' valido davvero. */
      const _v = LS.get("mb.spotify", null);
      if (!_v || !_v.access || Number(_v.scadenza || 0) < Date.now()) {
        b.classList.remove("collegato");
        const _tt = b.querySelector(".voce-testo");
        if (_tt && _tt.textContent.indexOf("Spotify (collegato)") >= 0) _tt.textContent = "Importa una playlist da Spotify";
        return;
      }
      b.classList.add("collegato");
      const t = b.querySelector(".voce-testo");
      if (t && t.textContent.indexOf("Spotify (collegato)") < 0) {
        t.textContent = "Spotify (collegato)";
        b.title = "Sei collegato a Spotify";
      }
    } catch (e) { /* noop */ }
  }
  function _mostraCollegatoNo() {
    try {
      const b = $("btnSpotify");
      if (!b) return;
      b.classList.remove("collegato");
      const t = b.querySelector(".voce-testo");
      if (t && t.textContent.indexOf("Spotify (collegato)") >= 0) {
        t.textContent = "Importa una playlist da Spotify";
        b.title = "";
      }
    } catch (e) { /* noop */ }
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const t = current();
    const cop = _copertinaPerSchermo(t);
    const meta = new MediaMetadata({
      title: t ? t.title : APP_NAME,
      artist: t ? (t.artist || APP_NAME) : APP_NAME,
      album: APP_NAME,
      artwork: cop ? [{ src: cop, sizes: "512x512" }] : [{ src: "icon-512.png", sizes: "512x512", type: "image/png" }]
    });
    navigator.mediaSession.metadata = meta;
    _aggiornaPosizioneSchermo();
    const setHandler = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* noop */ }
    };
    /* Tasti del blocco schermo: passano dagli stessi due posti del tasto
       play/pausa dell'app, altrimenti potrebbero dimenticarsi di dire
       "l'utente ha messo pausa" e la musica ripartirebbe da sola. */
    setHandler("play", () => { _riproduciVolontaria(); });
    setHandler("pause", () => { _pausaVolontaria(); });
    setHandler("nexttrack", () => playNext());
    setHandler("previoustrack", () => playById(idBranoA(prevIndex())));
    setHandler("seekto", (d) => {
      if (d.seekTime != null && audio && isFinite(audio.duration)) {
        audio.currentTime = Math.max(0, Math.min(d.seekTime, audio.duration));
        updateProgressUI(audio.currentTime, audio.duration);
      }
    });
    /* NON registro "avanti/indietro di 15 secondi".
       Ste li aveva: con questi due comandi attivi, l'iPhone si metteva
       "salta 10 secondi" ai lati della pausa invece di "canzone
       precedente" e "canzone successiva", che e' quello che voleva lui.
       Gli advancedi e i rientri di 15 secondi restano comunque disponibili
       dentro l'app, sulla barra sopra al play. */
    setHandler("stop", () => { _pausaVolontaria(); });
    setPlaybackState(audio && !audio.paused ? "playing" : "paused");
    _notificaStatoNativo(true);
  }

  function totalDuration() {
    if (audio && isFinite(audio.duration) && audio.duration > 0) return audio.duration;
    try {
      if (audio && audio.seekable && audio.seekable.length) {
        return audio.seekable.end(audio.seekable.length - 1);
      }
    } catch (e) { /* noop */ }
    return 0;
  }

  function seekBy(delta) {
    if (!audio) return;
    const d = totalDuration();
    const attuale = audio.currentTime || 0;
    let t = attuale + delta;
    if (t < 0) t = 0;
    if (d && t > d) t = d;
    try {
      audio.currentTime = t;
    } catch (e) {
      return;
    }
    updateProgressUI(audio.currentTime, d);
    savePos();
  }

  async function exportTrack(t) {
    try {
      toast("Preparo il file...");
      let blob = null;
      if (t.builtin) {
        /* Per i brani della libreria NON passo da un file creato in memoria:
           su iPhone un "scarica" cosi' finisce in un posto dove poi non lo
           trovi piu'. Usando il collegamento diretto, il telefono lo mette
           nelle Download (cartella File) e da li' lo puoi ascoltare anche con
           lo schermo spento, perche' li e' l'app File, che e' un programma
           vero e non una pagina web. */
        const nomeFile = (t.artist ? t.artist + " - " : "") + t.title.replace(/[\\/:*?"<>|]/g, "") + ".mp3";
        const a2 = document.createElement("a");
        a2.href = t.url;
        a2.download = nomeFile;
        a2.rel = "noopener";
        document.body.appendChild(a2);
        a2.click();
        a2.remove();
        toast("Salvo nelle Download del telefono. Da li' lo apri con File e lo suoni anche a schermo spento.");
        return;
      }
      {
        const rec = await dbGet(t.id);
        if (rec && rec.blob) blob = rec.blob;
      }
      if (!blob) throw new Error("file non trovato");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (t.artist ? t.artist + " - " : "") + t.title.replace(/[\\/:*?"<>|]/g, "") + ".mp3";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 8000);
      toast("Salvalo e mettilo nella cartella musica mp3 " + profile.toLowerCase() + " sul computer: così lo vede chiunque usi quel nome");
    } catch (e) {
      toast("Esportazione non riuscita: " + e.message);
    }
  }

  const OTHER_PROFILE = "Emanuele";
  let switching = false;

  function updateProfileButton() {
    $("profInitial").textContent = (profile || "?").trim().charAt(0).toUpperCase();
    $("btnProfile").classList.add("on");
  }

  /* I profili che sono nati su questo telefono (gli amici). I tre di sistema
     stanno nel codice; gli altri se li crea qui chi usa l'app, cosi' non
     devo rifare il sito ogni volta che si aggiunge qualcuno. */
  function profiliLocali() {
    try {
      const v = JSON.parse(LS.get("mb.profili", "[]"));
      if (!Array.isArray(v)) return [];
      return v.filter((n) => typeof n === "string" && n.trim() && n.trim().length <= 24);
    } catch (e) { return []; }
  }

  function _aggiungiProfiloLocale(nome) {
    const n = String(nome || "").trim().slice(0, 24);
    if (!n) return "";
    const gia = profiliLocali();
    const tutti = PROFILI.map((p) => p.nome);
    if (tutti.some((x) => x.toLowerCase() === n.toLowerCase())) return n;
    gia.push(n);
    try { LS.set("mb.profili", JSON.stringify(gia)); } catch (e) { /* noop */ }
    return n;
  }

  function profileList() {
    // il profilo aperto per primo, poi tutti gli altri
    const base = PROFILI.map((p) => p.nome);
    const nomi = base.concat(profiliLocali().filter((n) => !base.includes(n)));
    return [profile].concat(nomi.filter((n) => n !== profile));
  }

  function cartellaDi(nome) {
    const p = PROFILI.find((x) => x.nome === nome);
    return p ? p.cartella : "";
  }

function renderProfiles() {
    const box = $("profileList");
    box.innerHTML = "";
    const sceltaCopia = !!_destinazioneCopia;
    for (const name of profileList()) {
      const row = document.createElement("div");
      row.className = "prof-row" + (name === profile && !sceltaCopia ? " active" : "");
      const ava = document.createElement("div");
      ava.className = "prof-ava";
      ava.textContent = name.charAt(0).toUpperCase();
      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.minWidth = "0";
      const nm = document.createElement("p");
      nm.className = "prof-name";
      nm.textContent = name;
      const sub = document.createElement("p");
      sub.className = "prof-sub";
      sub.textContent = sceltaCopia
        ? "tocca per portare qui le canzoni scelte"
        : (name === profile ? "stai ascoltando come " + name : "tocca per ascoltare come " + name);
      info.appendChild(nm);
      info.appendChild(sub);
      row.appendChild(ava);
      row.appendChild(info);
      const use = document.createElement("button");
      use.className = "btn-mini" + (name === profile && !sceltaCopia ? " go" : "");
      use.textContent = (name === profile && !sceltaCopia) ? "Adesso" : (sceltaCopia ? "Qui" : "Vai");
      use.addEventListener("click", (e) => {
        e.stopPropagation();
        /* In scelta-copia questo tasto NON cambia profilo: sceglie dove
           copiare. Cambiare profilo qui sarebbe una gran sorpresa. */
        if (sceltaCopia) { _trasportaInAccount(name); return; }
        switchProfile(name);
      });
      row.addEventListener("click", () => {
        if (sceltaCopia) { _trasportaInAccount(name); return; }
        if (name !== profile) switchProfile(name);
      });
      box.appendChild(row);
    }
if (!sceltaCopia) updateProfileButton();
  }

  async function switchProfile(name) {
    if (switching) return;
    if (name === profile) {
      closeProfile();
      return;
    }
    switching = true;
    try {
      saveCurrentState();
      profile = name;
      LS.set("mb.profile", name);
      /* Comunica il cambio di profilo al service worker per usare le cache giuste */
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SET_PROFILE", profile: name });
      }
      updateProfileButton();
      if (audio) {
        try { audio.pause(); } catch (e) { /* noop */ }
      }
      currentId = null;
      const st = loadProfileState();
      await loadLocalLyrics();
      await loadAll();
  /* niente: la finestra dei nascosti e' stata tolta */
      _segnaRigaAttiva();
      const last = st.last ? tracks.find((t) => t.id === st.last) : null;
      if (last) {
        currentId = last.id;
        audio.src = _urlDelBrano(last);
        // anche cambiando profilo il brano riparte dall'inizio
        const pos = 0;
        audio.addEventListener("loadedmetadata", () => {
          if (pos > 0 && isFinite(audio.duration)) {
            try { audio.currentTime = Math.min(pos, Math.max(0, audio.duration - 1)); } catch (e) { /* noop */ }
          }
        }, { once: true });
        _segnaRigaAttiva();
      }
      updateMediaSession();
      updateProfileButton();
      closeProfile();
      toast("Ora ascolti: " + name);
    } finally {
      switching = false;
    }
  }

  let confirmResolve = null;

  function syncNoScroll() {
    const open = !$("importPanel").hidden || !$("lyricsPanel").hidden ||
      !$("profilePanel").hidden || !$("confirmPanel").hidden || !$("offlinePanel").hidden ||
      !$("quickPanel").hidden || !$("queuePanel").hidden;
    document.body.classList.toggle("no-scroll", open);
  }

  function askConfirm(title, message, okLabel) {
    $("confirmTitle").textContent = title;
    $("confirmMsg").textContent = message;
    $("confirmYes").textContent = okLabel || "Elimina";
    $("confirmPanel").hidden = false;
    syncNoScroll();
    return new Promise((resolve) => { confirmResolve = resolve; });
  }

  function closeConfirm(result) {
    $("confirmPanel").hidden = true;
    const r = confirmResolve;
    confirmResolve = null;
    syncNoScroll();
    if (r) r(result);
  }

  $("confirmYes").addEventListener("click", () => closeConfirm(true));
  $("confirmNo").addEventListener("click", () => closeConfirm(false));
  $("confirmPanel").addEventListener("click", (e) => {
    if (e.target === $("confirmPanel")) closeConfirm(false);
  });

  /* Ste: "quando premo porta nel mio account deve farmi scegliere in che account".

   Quando non e' NULL, il pannello dei profili non cambia profilo: serve solo a
   scegliere DOVE mettere le canzoni che avevo selezionato. */
let _destinazioneCopia = null;

function openProfile() {
    renderProfiles();
    $("profilePanel").hidden = false;
    syncNoScroll();
  }

  function closeProfile() {
    $("profilePanel").hidden = true;
    _destinazioneCopia = null;
    syncNoScroll();
  }

  /* Apre il pannello per scegliere in che account trasportare le canzoni. */
  function _chiediAccountPerCopia(ids) {
    if (!ids || !ids.length) return;
    _destinazioneCopia = ids.slice();
    const sottotitolo = $("profileSub");
    if (sottotitolo) {
      sottotitolo.textContent = "Scegli in che account portare " +
        (ids.length === 1 ? "la canzone scelta" : "le " + ids.length + " canzioni scelte");
    }
    renderProfiles();
    $("profilePanel").hidden = false;
    syncNoScroll();
  }

  /* ---------- Testi ---------- */
  function syncedToText(synced) {
    return String(synced || "")
      .replace(/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function parseSynced(synced) {
    const out = [];
    const re = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s*([^\n]*)/g;
    const s = String(synced || "");
    let m;
    while ((m = re.exec(s))) {
      const sec = Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number("0." + m[3]) : 0);
      out.push({ t: sec, text: m[4] });
    }
    return out;
  }

  function activeLineIndex(time) {
    let idx = -1;
    for (let i = 0; i < lyricLines.length; i++) {
      if (Number(lyricLines[i].dataset.t) <= time) idx = i;
      else break;
    }
    return idx;
  }

  function tickLyrics() {
    if ($("lyricsPanel").hidden || !lyricLines.length || !audio) return;
    const idx = activeLineIndex(audio.currentTime || 0);
    if (idx === lyricActive) return;
    if (lyricActive >= 0 && lyricLines[lyricActive]) lyricLines[lyricActive].classList.remove("on");
    if (idx >= 0) {
      lyricLines[idx].classList.add("on");
      if (Date.now() - lyricsUserScrollAt >= 4000) {
        try { lyricLines[idx].scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { /* noop */ }
      }
    }
    lyricActive = idx;
  }

  function openLyrics() {
    const l = currentLyrics();
    if (!l) return;
    $("lyricsTitle").textContent = l.title;
    $("lyricsSub").textContent = l.artist || "";
    const body = $("lyricsBody");
    body.innerHTML = "";
    lyricLines = [];
    lyricActive = -1;
    lyricsUserScrollAt = 0;
    const synced = parseSynced(l.synced);
    /* Ste: "il testo va in ritardo anche senza premere niente".
       Ho confrontato i tempi con la durata vera di tutti i mp3: per 51 brani
       su 350 i tempi sono di una versione diversa (piu' corta o piu'
       lunga), e le righe arrivano con troppo ritardo (o troppo presto).
       Se l'ultima riga finisce dopo la fine del brano, ri-scalo i tempi
       sulla durata vera: e' un'approssimazione, ma toglie decine di
       secondi di scarto. */
    try {
      const dur = totalDuration();
      if (dur > 20 && synced.length) {
        const ultimo = synced[synced.length - 1].t;
        if (ultimo > dur + 5) {
          const fattore = (dur - 2) / ultimo;
          for (const riga of synced) riga.t = Math.round(riga.t * fattore * 10) / 10;
        }
      }
    } catch (e) { /* noop */ }
    if (synced.length) {
      for (const line of synced) {
        const p = document.createElement("p");
        p.className = "lyr-line";
        p.textContent = line.text;
        p.dataset.t = String(line.t);
        body.appendChild(p);
        lyricLines.push(p);
      }
    } else {
      String(l.text || "").split("\n").forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        const trim = line.trim();
        if (/^\[.*\]$/.test(trim)) p.className = "lyr-sec";
        else if (!trim) p.className = "lyr-gap";
        body.appendChild(p);
      });
    }
    $("lyricsPanel").hidden = false;
    document.body.classList.add("no-scroll");
    _aggiornaSfondoTesti();
    _aggiornaComandiTesti();
    tickLyrics();
  }

  /* Lo sfondo prende i colori della copertina, come in Liner: senza questo
     resta uno sfondo nero e la pagina sembra mezza fatta. */
  function _aggiornaSfondoTesti() {
    try {
      const sfondo = $("lyricsSfondo");
      if (!sfondo) return;
      const t = current();
      const img = t && t.cover ? t.cover : "";
      sfondo.style.backgroundImage = img ? "url(" + img + ")" : "";
      sfondo.style.opacity = img ? ".55" : "0";
    } catch (e) { /* noop */ }
  }

  /* Il tasto play/pausa deve dire quello che sta succedendo davvero. */
  function _aggiornaComandiTesti() {
    try {
      const p = $("lyricsPlay");
      if (!p) return;
      const suona = !!(audio && !audio.paused && !audio.ended);
      p.innerHTML = suona ? "&#10074;&#10074;" : "&#9654;";
      p.setAttribute("aria-label", suona ? "Pausa" : "Play");
    } catch (e) { /* noop */ }
  }

  function closeLyrics() {
    $("lyricsPanel").hidden = true;
    document.body.classList.remove("no-scroll");
  }

  /* ---------- Aggiunta / rimozione ---------- */
  /* Dopo aver aggiunto un file: lo metto online?
   Ste: questa scelta era sparita e i brani restavano solo sul telefono senza
   saperlo. Prima prova col computer (veloce, e' la strada normale); se il
   computer non risponde uso il servizio, che funziona anche a PC spento. */
async function _chiediDoveMandare(fresh) {
    const ids = (fresh || []).filter((t) => !eGiaCondiviso(t)).map((t) => t.id);
    if (!ids.length) {
      /* Ste: "non lo chiede". Prima, se il brano era gia' in libreria la
         domanda semplicemente non compariva e sembrava che l'app si fosse
         dimenticata. Ora lo dico: e' gia' online, non lo aggiungo due volte. */
      toast("Questa canzone e' gia' in libreria: non la aggiungo due volte", 5000);
      return;
    }
  const uno = ids.length === 1;
  const si = await askConfirm(
    (uno ? "1 brano aggiunto" : ids.length + " brani aggiunti") + ": lo metto online?",
    "Adesso sono solo su questo telefono.\n\n" +
      "Provo prima col computer. Se il computer e' spento o non risponde,\n" +
      "uso il servizio, che funziona anche senza PC acceso.\n\n" +
      "Se non lo vuoi online, lascialo qui: resta solo su questo telefono.",
    "Metto online"
  );
  if (!si) {
    toast("Ok: resta solo su questo telefono");
    return;
  }

  /* Strada 1: il computer. */
  try {
    _recentementeAggiunto = true;
    await condividiBraniLocali(true);
  } catch (e) { /* il computer non c'e': vado col servizio */ }

  /* Strada 2: il servizio, per quello che il computer non ha preso. */
  const rimasti = [];
  for (const id of ids) {
    const r = await dbGet(id);
    if (r && !r.condiviso) rimasti.push(r);
  }
  if (!rimasti.length) {
    toast(ids.length === 1 ? "Messo online: lo sentono tutti" : ids.length + " brani online");
    return;
  }
  if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) {
    toast("Il computer non ha preso i brani e il servizio non e' attivo: restano qui. Riprova dal menu Altro.", 7000);
    return;
  }
  const fatti = [];
  for (const r of rimasti) {
    try { await _pubblicaSulSito(r); fatti.push(r); } catch (e) { /* ne riparo dopo */ }
  }
  if (fatti.length) {
    toast(fatti.length === 1 ? "Messo online col servizio" : fatti.length + " brani online col servizio");
    await loadAll();
    render();
    return;
  }
  toast("Non sono riuscito a metterli online. Riprova dal menu Altro.", 6000);
}

async function addFiles(fileList) {
    let ok = 0;
    let giaInLista = 0;
    const errors = [];
    for (const file of Array.from(fileList)) {
      const rec = {
        id: "u-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        title: file.name.replace(/\.[^.]+$/, ""),
        artist: "",
        profile: profile,
        blob: file,
        size: file.size
      };
      try {
        await dbPut(rec);
        ok++;
      } catch (e) {
        errors.push(file.name);
      }
    }
    if (ok) {
      await loadAll();
      const fresh = tracks.filter((t) => !t.builtin).slice(-ok);
      /* Se il brano era gia' nella libreria condivisa non lo metto due volte
         (la riga condivisa basta). Ma allora lo dico: prima non diceva niente
         e sembrava che il file si fosse perso. */
      for (const t of fresh) {
        if (eGiaCondiviso({ title: t.title, artist: t.artist })) giaInLista++;
      }
      const parti = [];
      const nuovi = ok - giaInLista;
      if (nuovi > 0) parti.push(nuovi === 1 ? "1 brano aggiunto" : nuovi + " brani aggiunti");
      if (giaInLista > 0) {
        parti.push(giaInLista === 1
          ? "1 era gia nella libreria, non l'ho ripetuto"
          : giaInLista + " erano gia nella libreria, non li ho ripetuti");
      }
      toast(parti.join(" e ") + ": solo per " + profile);
      /* vado subito al brano nuovo, cosi lo vede: prima finiva in fondo alla
         lista e sembrava non comparire. */
      const daMostrare = fresh.find((t) => !eGiaCondiviso({ title: t.title, artist: t.artist }));
      if (daMostrare) {
        setTimeout(() => {
          try {
            const righe = Array.from(playlistEl.children);
            const li = righe.find((x) => (x.getAttribute("data-id") || "") === daMostrare.id);
            if (li) {
              li.scrollIntoView({ block: "center" });
              li.classList.add("appena-aggiunto");
              setTimeout(() => li.classList.remove("appena-aggiunto"), 2800);
            }
          } catch (e) { /* pazienza */ }
        }, 300);
      }
for (const t of fresh) enrichTrack(t.id);
      /* Segno che sto condividendo un brano appena aggiunto: se il computer
         non risponde l'app lo dice, altrimenti l'utente cerca il brano nella
         libreria (che e' sul computer) e non lo trova mai. */
try { _recentementeAggiunto = true; condividiBraniLocali(true); } catch (e) { /* non blocca l'aggiunta */ }
        /* Ste: dopo aver aggiunto un file non compariva piu' la scelta
           "manda al computer / manda al servizio", e restava con la musica
           solo sul telefono senza saperlo. Gliela chiedo, con tre uscite:
           col computer, col servizio (funziona anche a PC spento), o lasciare
           qui e basta. */
        _chiediDoveMandare(fresh);
      }
    if (errors.length) toast("Errore con: " + errors.slice(0, 2).join(", "));
  }


/* Toglie dalla memoria del telefono tutto quello che riguarda un brano:
     il file audio, l'import, i testi, la copertina che avevo cercato, la
     coda. Serve dopo aver eliminato un brano, cosi' non resta niente. */
async function _dimenticaBranoOvunque(id) {
  const uri = "songs/track-" + String(id).replace(/^b-track-/, "") + ".mp3";
  try { await dbDel(id); } catch (e) { /* noop */ }
  try { await dbDelImport(id); } catch (e) { /* noop */ }
  try {
    const tx = db.transaction(DB_LYRICS, "readwrite");
    tx.objectStore(DB_LYRICS).delete(id);
  } catch (e) { /* noop */ }
  try {
    const tx = db.transaction(DB_COVERS, "readwrite");
    tx.objectStore(DB_COVERS).delete(id);
  } catch (e) { /* noop */ }
  delete localLyrics[id];
  const i = queue.indexOf(id);
  if (i >= 0) queue.splice(i, 1);
  /* e dalla copia che il telefono tiene per quando non c'e' rete */
  try {
    const chiavi = await caches.keys();
    for (const k of chiavi) {
      const c = await caches.open(k);
      await c.delete(new URL(uri, location.href).href);
      await c.delete(location.origin + "/" + uri);
      await c.delete(location.origin + "/music-box/" + uri);
    }
  } catch (e) { /* noop */ }
}

async function removeTrack(id) {
  const t = tracks.find((x) => x.id === id);
  if (!t) return;
  const cheCartella = cartellaDi(profile);
  /* Prima provo a farlo davvero sul computer: cancellare il file e
     toglierlo dal sito. Se il computer non e' raggiungibile non fingono
     niente: dico che il file resta e lascio decidere a te. */
  let fattoSulPc = false;
  let motivo = "";
  const collegato = await ponteOnline();
  if (collegato && cheCartella && t.url && /^songs\/track-\d+\.mp3$/.test(t.url)) {
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/elimina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: t.url, cartella: cheCartella, pubblica: true })
      });
      const j = await r.json().catch(() => ({}));
if (r.ok && j && j.ok) {
          fattoSulPc = true;
          /* Il computer puo' aver tolto il brano dal sito ma non quello
             nella cartella (se non ha trovato un file sicuramente identico).
             In quel caso l'utente deve saperlo, altrimenti crede che
             l'eliminazione sia a posto e il brano ricompare. */
          if (j.avviso) motivo = String(j.avviso);
        } else motivo = String((j && j.errore) || "non sono riuscito");
    } catch (e) {
      motivo = "il computer non ha risposto";
    }
  } else if (!collegato) {
    motivo = "il computer non e' raggiungibile";
  }

  if (!fattoSulPc) {
    const si = await askConfirm(
      "Non posso cancellare il file",
      "Il programma sul computer " + (motivo || "non e' raggiungibile") + ".\n\n" +
      "Posso togliere il brano dalla libreria di questo telefono, ma il file mp3 resta sul computer.\n\n" +
      "La canzone pero' NON tornera': l'ho segnata come eliminata, e questa segnalazione va su tutti i link.\n\n" +
      "Vuoi toglierlo comunque?",
      "Togli comunque"
    );
    /* Ste: "se premo annulla lo elimina lo stesso".
       Prima questo "return" non diceva niente a chi aveva chiamato, che
       continuava a toglierlo. Ora dico chiaramente: non ho fatto niente. */
    if (!si) return false;
  } else {
    /* Se il brano e' anche in una playlist, chiedo dove toglierlo: solo
       dalla libreria (l'bagno per davvero rimane nelle playlist? no: allora
       niente), solo dalle playlist, o da entrambe. */
    const nellePlaylist = _playlistCheContengono(id);
    if (nellePlaylist.length) {
      const scelta = await _scegliCosaTogliere(id, t.title || "", true);
      if (!scelta) return;
      if (scelta === "playlist") {
        for (const nome of nellePlaylist) {
          const pl = _playlistCercata(nome);
          if (pl) pl.tracks = (pl.tracks || []).filter((x) => x !== id);
        }
        saveCurrentState();
        _salvaPlaylistCondivise();
        renderPlaylist();
        _aggiornaBadgePlaylist();
        toast("Tolto dalle playlist, ma resta nella libreria e sul sito");
        return true;
      }
      /* sia "libreria" che "entrambe": le playlist si svuotano comunque,
         altrimenti resterebbero con un brano che non esiste piu' */
      for (const nome of nellePlaylist) {
        const pl = _playlistCercata(nome);
        if (pl) pl.tracks = (pl.tracks || []).filter((x) => x !== id);
      }
      saveCurrentState();
      _salvaPlaylistCondivise();
    }
    const si = await askConfirm(
      "Eliminare per sempre?",
      "\"" + (t.title || "") + "\" verra' cancellato:\n" +
      "- il file mp3 dal computer\n" +
      "- il brano dalla libreria di questo computer\n" +
      "- il brano dal sito, quindi sparisce anche dagli altri dispositivi\n\n" +
      "Non si puo' piu' recuperare. Il testo e la copertina spariscono con lui.",
      "Elimina per sempre"
    );
    if (!si) return false;
  }

  if (currentId === id) {
    try { audio.pause(); } catch (e) { /* noop */ }
    closeLyrics();
    currentId = null;
    _segnaRigaAttiva();
  }
  await _dimenticaBranoOvunque(id);
  /* anche dai preferiti, dai nascosti e dalle statistiche */
  try {
    const st = profileState(profile);
    const patch = {};
    if (Array.isArray(st.favs)) patch.favs = st.favs.filter((x) => x !== id);
    if (Array.isArray(st.hidden)) patch.hidden = st.hidden.filter((x) => x !== id);
      try { favorites.delete(id); } catch (e) { /* noop */ }
      try { hiddenTracks.delete(id); } catch (e) { /* noop */ }
      writeProfileState(profile, patch);
      /* Anche "rimettili in lista" va sul sito, altrimenti dall'altra
         scorciatoia il brano resterebbe nascosto. */
      _salvaStatoCondiviso();
    const st2 = statisticheProfilo();
    const c = _chiaveStats(t);
    if (c && st2[c]) {
      delete st2[c];
      _salvaStatistiche();
    }
  } catch (e) { /* noop */ }
  await loadAll();
  render();
  toast(fattoSulPc ? "Brano eliminato per sempre" : "Brano tolto da questo telefono");
  return true;
}

  function stripVariants(s) {
    return normText(s)
      .replace(/\b(live|remastered|remaster|explicit|version|edit|remix|cover|instrumental|acoustic|medley|karaoke|strumentale)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenOverlap(want, got) {
    const w = titleTokens(want);
    if (!w.length) {
      const nq = normKey(want);
      if (!nq) return 1;
      return normKey(got).indexOf(nq) >= 0 ? 1 : 0;
    }
    const g = new Set(titleTokens(got));
    if (!g.size) return 0;
    let hit = 0;
    for (const t of w) if (g.has(t)) hit++;
    return hit / w.length;
  }

  function titleCompatible(want, got) {
    const a = tokenOverlap(stripVariants(want), got);
    const b = tokenOverlap(stripVariants(got), want);
    return Math.max(a, b) >= 0.7;
  }

  /* LRCLIB: i testi LRC con timestamp hanno precedenza sui testi normali.
     Endpoint aperto con CORS; non si inventano mai parole o timestamp. */
  let _lrclibNonPrimaDi = 0;
  async function findLyrics(artist, title, options = {}) {
    const name = stripVariants(title);
    const duration = Number(options.durationMs || 0) / 1000;
    const validate = (j) => {
      if (!j || j.instrumental || !j.trackName || !titleCompatible(name, j.trackName)) return false;
      if (artist && j.artistName &&
          tokenOverlap(artist, j.artistName) < 0.38 &&
          !artistaSimile(artist, j.artistName)) return false;
      if (duration > 0 && Number(j.duration) > 0 &&
          Math.abs(Number(j.duration) - duration) > 16) return false;
      return !!(j.syncedLyrics || j.plainLyrics);
    };
    const choose = (arr) => {
      const matched = arr.filter(validate);
      const timed = matched.find(j => j.syncedLyrics && parseSynced(j.syncedLyrics).length >= 3);
      return timed || (!options.syncedOnly ? matched.find(j => j.plainLyrics) : null);
    };
    if (Date.now() >= _lrclibNonPrimaDi) {
      const endpoint = "https://lrclib.net";
      const queries = [
        endpoint + "/api/get?track_name=" + encodeURIComponent(name) +
          "&artist_name=" + encodeURIComponent(artist || "") +
          (options.album ? "&album_name=" + encodeURIComponent(options.album) : "") +
          (duration >= 1 && duration <= 3600 ? "&duration=" + Math.round(duration) : ""),
        endpoint + "/api/search?track_name=" + encodeURIComponent(name) +
          "&artist_name=" + encodeURIComponent(artist || "")
      ];
      const header = { "Lrclib-Client": "MusicBox/6.421 (https://github.com/stefanovillaggio8-dot/music-box)" };
      for (const url of queries) {
        if (Date.now() < _lrclibNonPrimaDi) break;
        try {
          const r = await fetchConScadenza(url, 12000, { headers: header });
          if (r.status === 429) {
            const retry = Math.max(5, Math.min(300, Number(r.headers.get("Retry-After")) || 30));
            _lrclibNonPrimaDi = Date.now() + retry * 1000;
            break;
          }
          if (!r.ok) continue;
          const j = await r.json();
          const selected = choose(Array.isArray(j) ? j : [j]);
          if (selected) {
            const sync = selected.syncedLyrics || "";
            const plain = selected.plainLyrics || syncedToText(sync);
            return { text: String(plain || "").trim(), synced: sync,
              source: sync ? "LRCLIB (karaoke sincronizzato)" : "LRCLIB" };
          }
        } catch (e) { /* Provider temporaneamente non raggiungibile. */ }
      }
    }
    if (options.syncedOnly) return null;
    /* Un testo non sincronizzato e' utile solo se non esiste gia'
       una versione karaoke affidabile. */
    try {
      const url = "https://api.lyrics.ovh/v1/" +
        encodeURIComponent(artist || "Unknown") + "/" + encodeURIComponent(name);
      const r = await fetchConScadenza(url, 12000);
      if (r.ok) {
        const j = await r.json();
        if (j && typeof j.lyrics === "string" && j.lyrics.length > 120 &&
            (!j.title || titleCompatible(name, j.title))) {
          return { text: j.lyrics.replace(/\r/g, "").trim(), synced: "", source: "lyrics.ovh" };
        }
      }
    } catch (e) { /* Nessun testo trovato. */ }
    return null;
  }

  async function findCoverLocal(artist, title, spotifyId) {
    if (spotifyId && /^[A-Za-z0-9]{22}$/.test(spotifyId)) {
      const stored = spotifyCoversData[spotifyId];
      if (stored && stored.cover) return stored;
      try {
        const url = "https://open.spotify.com/oembed?url=" +
          encodeURIComponent("https://open.spotify.com/track/" + spotifyId);
        const r = await fetchConScadenza(url, 14000);
        if (r.ok) {
          const j = await r.json();
          if (j && j.provider_name === "Spotify" &&
              String(j.thumbnail_url || "").startsWith("https://")) {
            const exact = { cover: j.thumbnail_url, title, artist, source: "Spotify oEmbed" };
            spotifyCoversData[spotifyId] = exact;
            return exact;
          }
        }
      } catch (e) { /* Fallback all'archivio locale / iTunes. */ }
    }
    /* Prima guardo covers.json: e' il posto dove le copertine sono gia'
       controllate e funzionanti (per esempio quelle prese da Deezer).
       Prima chiedevo solo a iTunes, e cosi' quei brani restavano senza
       immagine perche' iTunes non aveva (o non restituiva) il disegno. */
    try {
      const gia = coverInfo(artist, title);
      if (gia && gia.cover) {
        return { cover: gia.cover, album: gia.album || "" };
      }
    } catch (e) { /* noop */ }
    const term = (artist ? artist + " " : "") + stripVariants(title);
    try {
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(term) + "&entity=song&limit=8", 12000);
      if (!r.ok) return null;
      const j = await r.json();
      for (const res of (j.results || [])) {
        if (!titleCompatible(title, res.trackName || "")) continue;
        if (artist && tokenOverlap(artist, res.artistName || "") < 0.5) continue;
        const url = (res.artworkUrl100 || "").replace("100x100", "600x600");
        if (url) return { cover: url, album: res.collectionName || "" };
      }
    } catch (e) { /* noop */ }
    return null;
  }

  async function enrichTrack(id) {
    if (!id) return;
    try {
      const rec = await dbGet(id);
      if (!rec || !rec.blob) return;
      const patch = {};
      let changed = false;
      if (!rec.cover) {
        const c = await findCoverLocal(rec.artist, rec.title);
        if (c) {
          patch.album = c.album || rec.album || "";
          patch.coverUrl = c.cover;
          try {
            const ir = await fetch(c.cover);
            if (ir.ok) patch.cover = await ir.blob();
          } catch (e) {
            patch.cover = null;
          }
          changed = true;
        }
      }
      if (changed) await dbPut(Object.assign({}, rec, patch));
      if (!localLyrics[rec.id]) {
        const l = await findLyrics(rec.artist, rec.title);
        if (l) {
          localLyrics[rec.id] = { title: rec.title, artist: rec.artist || "", text: l.text, synced: l.synced || "", source: l.source };
          await dbPutLyrics({ id: rec.id, title: rec.title, artist: rec.artist || "", text: l.text, synced: l.synced || "", source: l.source });
        }
      }
      await loadAll();
      if (currentId === rec.id) _segnaRigaAttiva();
    } catch (e) {
      console.warn("Completamento automatico fallito", e);
    }
  }

  /* ---------- Importazione: OCR + metadati + download ---------- */
  const IMPORT_LIMIT = 60;
  const MAX_DOWNLOAD = 40 * 1024 * 1024;
  const IA_SEARCH = "https://archive.org/advancedsearch.php";
  const IA_META = "https://archive.org/metadata/";
  const IA_THUMB = "https://archive.org/services/img/";
  const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
  const OCR_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  let ocrWorker = null;
  let importList = [];
  let importActive = null;
  let libKeys = new Set();

  function normKey(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\((live|remaster(ed)?|explicit|bonus track)[^)]*\)/g, " ")
      .replace(/\[(live|remaster(ed)?|explicit)[^\]]*\]/g, " ")
      .replace(/[^a-z0-9]+/g, "");
  }

  function trackKeys(t) {
    const key = _identitaBrano(t);
    return new Set(key ? [key] : []);
  }

  function libraryKeys() {
    const keys = new Set();
    for (const t of tracks) {
      if ((t.profile || DEFAULT_PROFILE) !== profile && !_mieiCopiati().has(t.id)) continue;
      for (const k of trackKeys(t)) keys.add(k);
    }
    return keys;
  }

  const NOISE_PATTERNS = [
    /\(?\b\d{1,2}[:.]\d{2}\b\)?/g,
    /\b\d{1,4}\s?(kb|mb|gb|kbps|mbps)\b/gi,
    /\b(19|20)\d{2}\b/g,
    /\b(official|video|audio|visual|visualizer|lyrics?|lyric video|mv|hd|hq|4k|remastered|remaster|explicit|full album|prod|produced|stereo)\b/gi,
    /\b(play|ascolta|riproduci|scarica|download|condividi|share|aggiungi|add|like|cuore|piu opzioni|more options|ordina per|sort by|qualita|offline|preferito|playlist|album|artista|artist|brani|tracks|canzoni|libreria|ora in riproduzione|shuffle|repeat)\b/gi
  ];

  const CREDITS = [
    /\([^)]*\b(prod|produced|by|con|feat|ft|featuring)\b[^)]*\)/gi,
    /\[[^\]]*\b(prod|produced|by|con|feat|ft|featuring)\b[^\]]*\]/gi,
    /\s+(ft|feat|featuring)\.?\s+[^-|]+$/i
  ];

  const STOPWORDS = /^(la|le|il|lo|i|gli|del|della|delle|di|da|a|al|alla|alle|con|per|tra|e|che|mia|mio|tua|tuo|suo|sua|mia|libreria|playlist|brani|canzoni|album|musica|ascolta|riproduci|ascolto|ascoltando|coda|queue|tutto|tutti|ora|in|ora in riproduzione|piu|opzioni|scarica|condividi|aggiungi|preferito|offline|qualita|random|shuffle|repeat|1|2|3|4|5|6|7|8|9|10)$/i;

  function cleanLine(raw) {
    let line = String(raw || "")
      .replace(/[\u2018\u2019\u201B]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014\u2212]/g, "-")
      .replace(/[\u00A0\u2007\u202F]/g, " ")
      .replace(/[^\p{L}\p{N}\s\-:,'&!?().]/gu, " ")
      .trim();
    for (const re of CREDITS) line = line.replace(re, " ");
    for (const re of NOISE_PATTERNS) line = line.replace(re, " ");
    for (let i = 0; i < 4; i++) {
      const before = line;
      line = line.replace(/^\d{1,3}\s*[.)\]:-]\s*/, "");
      line = line.replace(/^(play|ascolta|riproduci|scarica|download|condividi|share|aggiungi|add|like|cuore)\b\s*/i, "");
      line = line.trim();
      if (line === before) break;
    }
    line = line.replace(/\(\s*\)|\[\s*\]|\s+[.,;]\s*$/g, " ");
    line = line.replace(/[ \t]{2,}/g, (m) => (m.length > 2 ? "  " : m));
    line = line.replace(/^[\s\-:,.'&]+/, "").replace(/[\s\-:,.'&]+$/, "");
    const words = line.split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const useful = words.filter((w) => !STOPWORDS.test(w));
    if (!useful.length) return "";
    const letters = (line.match(/\p{L}/gu) || []).length;
    if (letters < 3) return "";
    if (/^\d+$/.test(line)) return "";
    if (line.length > 120) return "";
    return line;
  }

  /* Scrive solo il nome di un artista (es. "nayt") e vuoi tutte le sue
     canzoni: funziona se la riga e' una parola sola, oppure se e' un
     artista che gia' conosciamo (in libreria o nelle copertine). */
  const KNOWN_ARTISTS = new Set();

  function collectKnownArtists() {
    KNOWN_ARTISTS.clear();
    for (const t of tracks) if (t.artist) KNOWN_ARTISTS.add(t.artist);
    for (const k of Object.keys(coversData || {})) {
      const c = coversData[k];
      if (c && c.artist) KNOWN_ARTISTS.add(c.artist);
    }
  }

  function looksLikeArtist(line) {
    const t = String(line || "").trim();
    if (!t) return false;
    if (!/\s/.test(t)) return true;
    const k = normKey(t);
    if (!k) return false;
    for (const a of KNOWN_ARTISTS) if (normKey(a) === k) return true;
    return false;
  }

  /* Un artista con lo spazio (es. "Post Malone", "Tyler, The Creator") non e'
     ancora in libreria non viene riconosciuto, perche' la riga sembra un titolo.
     Qui si chiede a iTunes se quella frase e' un artista.
     Attenzione pero': certi titoli sono anche nomi di artisti ("Blinding Lights",
     "Mamma Mia"), quindi se la frase e' anche un brano la lasciamo com'e' e non
     la trasformiamo in "tutte le canzoni dell'artista".
     Con "artista: nome" invece si forza la scelta. */
  async function iTunesQuestoEArtista(nome) {
    const grezzo = String(nome || "").trim();
    const forzato = /^artista\s*:/i.test(grezzo);
    const t = grezzo.replace(/^artista\s*:\s*/i, "");
    if (!t) return "";
    const parole = t.split(/\s+/).filter(Boolean);
    if (parole.length > 5) return "";
    if (!forzato && parole.length < 2) return "";
    const mio = normKey(t);
    if (!mio) return "";
    try {
      // Se l'utente ha scritto "artista:" usa la ricerca artisti dedicata,
      // che e' precisa. Altrimenti cerco fra i brani: cosi' con una sola
      // richiesta vedo sia il nome dell'artista sia il titolo del brano.
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(t) +
        (forzato ? "&entity=musicArtist&limit=8" : "&entity=song&limit=30") + "&country=IT", 12000);
      if (!r.ok) return "";
      const d = await r.json();
      const risultati = (d && d.results) || [];
      // 1) e' anche un brano? allora non tocchiamo niente (salvo "artista:")
      //    ATTENZIONE: se quel titolo lo hanno pochi artisti, e' quasi certamente
      //    una coincidenza: per "kid yugi" esiste un solo brano omonimo di un
      //    artista sconosciuto, ma "Kid Yugi" e' un nome d'arte. Se invece il
      //    titolo e' in mano a molti (Blinding Lights, Mamma Mia...) allora
      //    e' davvero un brano e lo lasciamo brano.
      if (!forzato) {
        const omonimi = risultati.filter((s) => s && s.trackName && normKey(s.trackName) === mio);
        const artistiDiversi = new Set(omonimi.map((s) => String(s.artistName || "")));
        if (omonimi.length >= 4 && artistiDiversi.size >= 3) return "";
      }
      // 2) e' un artista esatto
      for (const s of risultati) {
        if (s && s.artistName && normKey(s.artistName) === mio) return String(s.artistName);
      }
      // 3) nome molto simile (typo, accenti, virgole)
      let migliore = "", punteggio = 0;
      for (const s of risultati) {
        if (!s || !s.artistName) continue;
        const p = titleMatch(mio, normKey(s.artistName)).score;
        if (p > punteggio) { punteggio = p; migliore = String(s.artistName); }
      }
      if (punteggio >= 88) return migliore;
      // 4) Ultimo tentativo: chiedo l'elenco degli artisti.
      //    Nei risultati dei brani il nome e' spesso "Kid Yugi, Night Skinny &
      //    Artie 5ive", quindi non coincide mai e senza questo passaggio un
      //    artista come "kid yugi" finiva trattato come titolo di un brano.
      if (!forzato) {
        try {
          const r2 = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(t) +
            "&entity=musicArtist&limit=8&country=IT", 12000);
          if (r2.ok) {
            const d2 = await r2.json();
            const artisti = (d2 && d2.results) || [];
            for (const a of artisti) {
              if (a && a.artistName && normKey(a.artistName) === mio) return String(a.artistName);
            }
            let m2 = "", p2 = 0;
            for (const a of artisti) {
              if (!a || !a.artistName) continue;
              const p = titleMatch(mio, normKey(a.artistName)).score;
              if (p > p2) { p2 = p; m2 = String(a.artistName); }
            }
            if (p2 >= 90) return m2;
          }
        } catch (e) { /* noop */ }
      }
      return "";
    } catch (e) { return ""; }
  }

  /* Scrive anche "artista e nome" senza trattino (es. "nayt tropico"):
     se la riga parte con un artista che gia' conosciamo, tutto quello
     che viene dopo e' il brano. Provo l'artista piu' lungo per primo,
     cosi' "the beatles yesterday" non diventa "the" + "beatles yesterday". */
  function splitKnownArtist(line) {
    const t = String(line || "").trim();
    if (!t) return null;
    const low = t.toLowerCase();
    const nomi = [];
    for (const a of KNOWN_ARTISTS) {
      const s = String(a || "").trim();
      if (s) nomi.push(s);
    }
    nomi.sort((a, b) => b.length - a.length);
    for (const a of nomi) {
      const al = a.toLowerCase();
      if (t.length <= a.length || !low.startsWith(al)) continue;
      const dopo = t.slice(a.length).replace(/^[\s\-:,|]+/, "").trim();
      if (dopo) return { artist: a, title: dopo };
    }
    /* Caso inverso: il nome dell'artista arriva in fondo ("tropico nayt"). */
    for (const a of nomi) {
      const al = a.toLowerCase();
      if (t.length <= a.length + 1) continue;
      if (!low.endsWith(al)) continue;
      const prima = t.slice(0, t.length - a.length).replace(/[\s\-:,|]+$/, "").trim();
      if (prima) return { artist: a, title: prima };
    }
    return null;
  }

  function parseImportText(text) {
    const out = [];
    const seen = new Set();
    const lines = String(text || "").split(/\r?\n/);
    for (const raw of lines) {
      const line = cleanLine(raw);
      if (!line || line.length < 2) continue;
      let artist = "";
      let title = line;
      let artistOnly = false;
      const m = /^(.+?)\s+-\s+(.+)$/.exec(line);
      if (m) {
        artist = m[1].trim();
        title = m[2].trim();
      } else {
        const m2 = /^(.+?)\s{2,}(.+)$/.exec(line);
        if (m2) {
          artist = m2[1].trim();
          title = m2[2].trim();
        } else {
          const m3 = splitKnownArtist(line);
          if (m3) {
            artist = m3.artist;
            title = m3.title;
          } else if (looksLikeArtist(line)) {
            artistOnly = true;
          }
        }
      }
      title = title.replace(/\s+/g, " ").trim();
      artist = artist.replace(/\s+/g, " ").trim();
      if (!title) continue;
      const key = normKey(artist + title);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ artist, title, artistOnly });
      if (out.length >= IMPORT_LIMIT) break;
    }
    return out;
  }

  function ocrLabel(status) {
    const map = {
      "loading tesseract core": "Carico il motore OCR",
      "initializing tesseract": "Preparo il motore OCR",
      "loading language traineddata": "Scarico la lingua italiana",
      "initializing api": "Preparo il riconoscimento",
      "recognizing text": "Leggo lo screenshot"
    };
    return map[status] || status;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("OCR non scaricabile, serve la connessione"));
      document.head.appendChild(s);
    });
  }

  async function loadImage(file) {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("immagine non leggibile"));
        img.src = url;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function preprocessImage(file) {
    const img = await loadImage(file);
    const scale = Math.min(3, Math.max(1, 1800 / Math.max(1, img.width)));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    let data;
    try {
      data = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      return file;
    }
    const px = data.data;
    let min = 255;
    let max = 0;
    const gray = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
      gray[p] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const range = Math.max(1, max - min);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const v = ((gray[p] - min) * 255 / range) | 0;
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
      px[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/png"));
  }

  async function getOcrWorker(onProgress) {
    if (ocrWorker) return ocrWorker;
    if (!window.Tesseract) await loadScript(OCR_SRC);
    ocrWorker = await window.Tesseract.createWorker(["ita", "eng"], 1, {
      logger: (m) => {
        if (m && m.status && typeof m.progress === "number") onProgress(ocrLabel(m.status), m.progress);
      }
    });
    try {
      await ocrWorker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    } catch (e) { /* noop */ }
    return ocrWorker;
  }

  async function runOcr(file, onProgress) {
    const worker = await getOcrWorker(onProgress);
    const res = await worker.recognize(file);
    return (res && res.data && res.data.text) || "";
  }

  function archiveUrl(identifier, name) {
    return "https://archive.org/download/" + encodeURIComponent(identifier) + "/" +
      encodeURIComponent(name).replace(/%2F/g, "/");
  }

  function pickAudioFile(files) {
    const audio = (files || []).filter((f) => {
      const n = (f.name || "").toLowerCase();
      return /\.(mp3|m4a|aac|mp4)$/.test(n) && f.size && Number(f.size) < MAX_DOWNLOAD;
    });
    audio.sort((a, b) => Number(a.size) - Number(b.size));
    return audio[0] || null;
  }

  function normText(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\((live|remaster(ed)?|explicit|bonus track)[^)]*\)/g, " ")
      .replace(/\[(live|remaster(ed)?|explicit)[^\]]*\]/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function titleTokens(s) {
    return normText(s).split(" ").filter((t) => t.length >= 3);
  }

  function titleMatch(query, candidate) {
    const qt = titleTokens(query);
    if (!qt.length) {
      const q = normKey(query);
      const c = normKey(candidate);
      if (q && c && (c === q || c.includes(q))) return { score: 70, strong: true };
      return { score: 0, strong: false };
    }
    const ct = new Set(titleTokens(candidate));
    if (!ct.size) return { score: 0, strong: false };
    let hit = 0;
    for (const t of qt) if (ct.has(t)) hit++;
    const frac = hit / qt.length;
    const extra = ct.size - hit;
    if (frac === 1 && extra <= 1) return { score: 90, strong: true };
    if (frac === 1) return { score: 75, strong: true };
    if (frac >= 0.85 && extra <= 2) return { score: 60, strong: true };
    if (frac >= 0.6) return { score: 35, strong: false };
    return { score: 0, strong: false };
  }

  const VARIANT_WORDS = /(live|remix|remaster|cover|karaoke|medley|instrumental|acoustic|version|edit|mix|strumentale|dj|rework)/;

  function artistMatch(want, got) {
    const w = titleTokens(want);
    if (!w.length) return true;
    if (!got) return false;
    const g = new Set(titleTokens(got));
    if (!g.size) return false;
    let hit = 0;
    for (const t of w) if (g.has(t)) hit++;
    return hit / w.length >= 0.6;
  }

  function hasVariantWords(s) {
    const raw = (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return VARIANT_WORDS.test(raw);
  }

  function candidateScore(item, candTitle, candArtist) {
    const m = titleMatch(item.title, candTitle);
    if (m.score <= 0) return { score: 0, strong: false };
    let score = m.score;
    let strong = m.strong;
    if (item.artist) {
      if (artistMatch(item.artist, candArtist)) score += 10;
      else {
        score = Math.max(1, score - 45);
        strong = false;
      }
    } else {
      if (m.score < 90) strong = false;
    }
    if (hasVariantWords(candTitle) && !hasVariantWords(item.title)) {
      score = Math.max(1, score - 15);
      strong = false;
    }
    return { score, strong };
  }

  /* Una richiesta che non risponde non deve bloccare la ricerca: senza questo
     un solo sito lento lasciava tutti i brani successivi fermi su "cerco...".
     Dopo i secondi indicati mollo tutto e vado avanti col brano seguente. */
  function conScadenza(promessa, ms, messaggio) {
    return new Promise((ok, ko) => {
      const t = setTimeout(() => ko(new Error(messaggio || "troppo lento")), ms);
      if (promessa && typeof promessa.then === "function") {
        promessa.then(
          (v) => { clearTimeout(t); ok(v); },
          (e) => { clearTimeout(t); ko(e); }
        );
      } else {
        clearTimeout(t);
        ok(promessa);
      }
    });
  }

  // fetch con tempo massimo: se il sito non risponde, siamo salvi
  function fetchConScadenza(url, ms, opzioni) {
    const ctl = new AbortController();
    const scad = setTimeout(() => ctl.abort(), ms || 12000);
    const fatto = fetch(url, Object.assign({}, opzioni || {}, { signal: ctl.signal }));
    return conScadenza(fatto, (ms || 12000) + 1500, "richiesta scaduta")
      .finally(() => clearTimeout(scad));
  }

  async function iaQuery(query, rows) {
    const url = IA_SEARCH + "?q=" + encodeURIComponent(query) +
      "&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=licenseurl" +
      "&rows=" + (rows || 12) + "&page=1&output=json";
    const res = await fetchConScadenza(url, 12000);
    if (!res.ok) throw new Error("archive non raggiungibile");
    const json = await res.json();
    return (json.response && json.response.docs) || [];
  }

  function iaSearchPhrase(title) {
    const core = normText(title)
      .replace(/\b(live|remastered|remaster|explicit|version|edit|remix|cover|instrumental|acoustic|medley|karaoke|strumentale)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return core || normText(title);
  }

  async function searchArchive(item) {
    const phrase = iaSearchPhrase(item.title);
    let docs = [];
    try {
      docs = await iaQuery('title:("' + phrase + '") AND mediatype:(audio)');
    } catch (e) { /* noop */ }
    if (!docs.length) {
      try {
        docs = await iaQuery('"' + phrase + '" AND mediatype:(audio)');
      } catch (e) { /* noop */ }
    }
    if (!docs.length) return [];

    const out = [];
    for (const doc of docs.slice(0, 5)) {
      if (!doc.identifier) continue;
      let meta;
      try {
        const mres = await fetch(IA_META + encodeURIComponent(doc.identifier));
        if (!mres.ok) continue;
        meta = await mres.json();
      } catch (e) {
        continue;
      }
      const docArtist = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;
      const files = (meta.files || []).filter((f) => {
        return /\.(mp3|m4a|aac|mp4)$/i.test(f.name || "") && f.size && Number(f.size) < MAX_DOWNLOAD;
      });
      for (const f of files) {
        const candTitle = (f.title || String(f.name).replace(/\.[^.]+$/, "")).toString().slice(0, 120);
        const candArtist = (f.artist || docArtist || "").toString().slice(0, 80);
        const c = candidateScore(item, candTitle, candArtist);
        if (c.score <= 0) continue;
        let score = c.score;
        let strong = c.strong;
        if (hasVariantWords(String(f.name) + " " + (doc.title || "")) && !hasVariantWords(item.title)) {
          score = Math.max(1, score - 15);
          strong = false;
        }
        out.push({
          score,
          strong,
          title: candTitle,
          artist: candArtist,
          album: (doc.title || "").toString().slice(0, 80),
          license: doc.licenseurl ? doc.licenseurl.toString().slice(0, 80) : "vedi fonte",
          source: "Internet Archive",
          url: archiveUrl(doc.identifier, f.name),
          cover: IA_THUMB + encodeURIComponent(doc.identifier)
        });
      }
      out.sort((a, b) => b.score - a.score);
      if (out.length > 12) out.length = 12;
      if (out.length && out[0].score >= 100 && out[0].strong) break;
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 3);
  }

  async function searchCommons(item) {
    const term = item.title + (item.artist ? " " + item.artist : "");
    const url = COMMONS_API + "?action=query&format=json&generator=search&gsrsearch=" +
      encodeURIComponent(term + " filetype:audio") +
      "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url%7Cextmetadata&iiextmetadatafilter=LicenseShortName";
  const res = await fetchConScadenza(url, 12000);
  if (!res.ok) throw new Error("wikimedia non raggiungibile");
    const json = await res.json();
    const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
    const out = [];
    for (const p of pages) {
      const info = (p.imageinfo || [])[0];
      if (!info || !info.url) continue;
      if (!/\.(mp3|m4a|aac|mp4)$/i.test(info.url)) continue;
      const name = String(p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "");
      const c = candidateScore(item, name, "");
      if (c.score <= 0) continue;
      const lic = info.extmetadata && info.extmetadata.LicenseShortName ? info.extmetadata.LicenseShortName.value : "Wikimedia Commons";
      out.push({
        score: Math.max(1, c.score - 5),
        strong: c.strong,
        title: name.slice(0, 120),
        artist: item.artist || "",
        album: "",
        license: String(lic).slice(0, 80),
        source: "Wikimedia Commons",
        url: String(info.url).split("?")[0],
        cover: ""
      });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 3);
  }

  /* Scrivevo solo "nayt": invece di un brano, cerco TUTTE le canzoni
     di quell'artista. L'elenco esce dal catalogo pubblico di iTunes,
     poi ogni canzone la cerco anche dove si scarica per davvero. */
  // Prima fermava a 20 brani per artista, e con artisti grandi (Nayt ne ha
  // 69 su iTunes) ne mostrava pochissimi. Ora tiene il passo con la lista.
  const ARTIST_TRACK_LIMIT = 60;

  function itunesArtwork(url) {
    return String(url || "").replace("100x100", "600x600");
  }

  /* Nell'elenco di un artista voglio i pezzi suoi, non le compilation dove
     c'e' solo come feat: quindi l'artista deve essere il nome principale. */
  function artistaCatalogo(want, got) {
    if (!artistMatch(want, got)) return false;
    const w = normKey(want);
    const g = normKey(got);
    if (!w || !g) return false;
    return g.startsWith(w) && g.length <= w.length + 22;
  }

  /* L'id dell'artista su iTunes: serve per aprirne il catalogo completo. */
  async function itunesArtistId(name) {
    const mio = normKey(name);
    if (!mio) return 0;
    try {
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(name) +
        "&entity=musicArtist&limit=8&country=IT", 12000);
      if (!r.ok) return 0;
      const d = await r.json();
      for (const a of ((d && d.results) || [])) {
        if (a && a.artistId && normKey(a.artistName) === mio) return a.artistId;
      }
    } catch (e) { /* noop */ }
    return 0;
  }

  async function itunesArtistTracks(name) {
    const out = [];
    const vistati = new Set();
    const aggiungi = (s) => {
      if (out.length >= ARTIST_TRACK_LIMIT) return;
      if (!s || !s.trackName || !s.artistName) return;
      if (!artistaCatalogo(name, s.artistName)) return;
      const key = normKey(s.artistName + " " + s.trackName);
      if (vistati.has(key)) return;
      vistati.add(key);
      out.push({
        artist: s.artistName,
        title: s.trackName,
        album: s.collectionName || "",
        cover: itunesArtwork(s.artworkUrl100),
        secs: Math.round((s.trackTimeMillis || 0) / 1000),
        preview: s.previewUrl || ""
      });
    };
    // 1) ricerca normale, che trova subito i pezzi piu' noti
    for (const term of [name, name + " canzoni"]) {
      let data = null;
      try {
        const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(term) +
          "&entity=song&limit=200&country=IT", 12000);
        if (!r.ok) continue;
        data = await r.json();
      } catch (e) {
        continue;
      }
      for (const s of (data.results || [])) aggiungi(s);
      if (out.length >= 3) break;
    }
    // 2) catalogo dell'artista: la ricerca normale ne trova solo una parte.
    //    Per "kid yugi" dava 5 brani, cosi' invece arrivano tutti.
    if (out.length < ARTIST_TRACK_LIMIT) {
      const id = await itunesArtistId(name);
      if (id) {
        try {
          const r = await fetchConScadenza("https://itunes.apple.com/lookup?id=" + id +
            "&entity=song&limit=200&country=IT", 15000);
          if (r.ok) {
            const d = await r.json();
            for (const s of ((d && d.results) || [])) aggiungi(s);
          }
        } catch (e) { /* noop */ }
      }
    }
    return out;
  }

  /* Riga scritta senza artista ("ayl popolare"): se non so di chi si tratta,
     chiedo a iTunes chi e' l'artista e qual e' il titolo esatto. Cosi' la ricerca
     del download parte con una scia giusta invece di indovinare. */
  async function itunesGuess(testo) {
    if (!testo) return null;
    let data = null;
    try {
      const r = await fetchConScadenza("https://itunes.apple.com/search?term=" + encodeURIComponent(testo) +
        "&entity=song&limit=25&country=IT", 12000);
      if (!r.ok) return null;
      data = await r.json();
    } catch (e) {
      return null;
    }
    let best = null;
    for (const s of (data.results || [])) {
      if (!s || !s.trackName) continue;
      const m = titleMatch(testo, s.trackName);
      if (m.score < 70) continue;
      const score = m.score + (artistMatch(testo, s.artistName) ? 8 : 0);
      if (best && score <= best.score) continue;
      best = {
        score: score,
        artist: s.artistName || "",
        title: s.trackName,
        album: s.collectionName || "",
        cover: itunesArtwork(s.artworkUrl100),
        secs: Math.round((s.trackTimeMillis || 0) / 1000),
        preview: s.previewUrl || ""
      };
    }
    return best;
  }

  function previewCandidate(s) {
    return {
      score: 20,
      strong: false,
      title: s.title,
      artist: s.artist,
      album: s.album,
      license: "solo 30 secondi",
      source: "anteprima 30s",
      url: s.preview,
      cover: s.cover
    };
  }

  // ---- Ascoltare PRIMA di importare ------------------------------------
  // Un solo player per tutta la schermata: se ne avvii un altro, il primo si ferma.
  let anteprimaAudio = null, anteprimaBtn = null;
  function fermaAnteprima() {
    if (anteprimaAudio) {
      try { anteprimaAudio.pause(); } catch (e) {}
      anteprimaAudio.src = "";
      anteprimaAudio = null;
    }
    if (anteprimaBtn) {
      anteprimaBtn.textContent = anteprimaBtn.dataset.label || "Ascolta";
      anteprimaBtn.classList.remove("btn-mini-on");
      anteprimaBtn = null;
    }
  }
  // cand: il risultato della ricerca. Se ha l'anteprima di 30s si sente quella,
  // altrimenti si sente il brano vero. Il bottone dice sempre di cosa si tratta.
  function bottoneAnteprima(cand, testo) {
    const solo30 = !!(cand && cand.license === "solo 30 secondi");
    const src = (cand && (cand.preview || cand.url)) || "";
    const etichetta = testo || (solo30 ? "Anteprima 30s" : (cand && cand.url ? "Ascolta" : ""));
    return { etichetta: etichetta, solo30: solo30, src: src, cand: cand };
  }
  function ascoltaPrima(b, fn) {
    if (!b || !b.src) return;
    if (anteprimaAudio && anteprimaAudio.src === b.src && !anteprimaAudio.paused) { fermaAnteprima(); return; }
    fermaAnteprima();
    try {
      anteprimaAudio = new Audio();
      anteprimaAudio.preload = "none";
      anteprimaAudio.src = b.src;
      anteprimaAudio.addEventListener("ended", fermaAnteprima);
      anteprimaAudio.addEventListener("error", () => {
        fermaAnteprima();
        if (fn) fn(new Error("non e' stato possibile suonare l'anteprima"));
      });
      anteprimaBtn = b.el;
      b.el.dataset.label = b.etichetta;
      b.el.textContent = "Ferma";
      b.el.classList.add("btn-mini-on");
      anteprimaAudio.play();
      if (fn) fn(null);
    } catch (e) {
      fermaAnteprima();
      if (fn) fn(e);
    }
  }
  // Dice SEMPRE perche' un brano e' solo 30 secondi: cosi' non si crede
  // di poter ascoltarlo tutto prima di importarlo.
  function notaAnteprima(cand) {
    if (cand && cand.license === "solo 30 secondi") {
      return "Solo 30 secondi di anteprima: il brano completo non e' liberamente scaricabile.";
    }
    return "";
  }

  /* Link esterni (aperti in una scheda nuova, senza dare il link alla pagina).
     linkEsterno fa il bottone, poi ne faccio due: la ricerca su YouTube per
     sentire il brano, e il convertitore che mi ha chiesto Stefano. */
  const LINK_CONVERTITORE = "https://notube.link/it/youtube-app-429";

  function linkEsterno(testo, href, titolo, classe) {
    const a = document.createElement("a");
    a.className = "btn-mini" + (classe ? " " + classe : "");
    a.textContent = testo;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = titolo || "";
    return a;
  }

  /* Copia negli appunti. Su https e su 127.0.0.1 funziona l'API moderna;
     su una pagina http normale (per esempio il telefono aperto con
     l'indirizzo della rete) il browser la blocca, e uso il metodo vecchio. */
  async function copiaNegliAppunti(testo) {
    const t = String(testo || "");
    if (!t) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(t);
        return true;
      }
    } catch (e) { /* provo con il metodo vecchio */ }
    try {
      const area = document.createElement("textarea");
      area.value = t;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, t.length);
      const ok = document.execCommand("copy");
      area.remove();
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  /* Quando del brano c'e' solo l'anteprima di 30 secondi, offro la strada per
     ascoltarlo intero: cerco la canzone su YouTube. Uso la pagina di ricerca
     e non un link a caso, perche' cosi' porta sempre alla canzone giusta
     anche se l'artista ha un nome con lo spazio o dei caratteri strani.
     Premendo copio anche il link negli appunti, cosi' non serve ricordarselo. */
  // Chiede al programma sul PC di trovare il video ORIGINALE del brano.
  // Non serve nessuna chiave: usa lo stesso motore che scarica l'mp3.
  /* Se una richiesta al programma del PC fallisce, vuol dire che il PC e'
     spento o l'indirizzo non va piu': lo dimentico, cosi' alla prossima
     ricerca lo cerco di nuovo invece di insistere su un indirizzo morto. */
  function dimenticaPonte() {
    ponteCheRisponde = "";
    ponteCache = null;
  }

  async function cercaVideoEsatto(artista, titolo, secondi) {
    try {
      const ctl = new AbortController();
      const scad = setTimeout(() => ctl.abort(), 20000);
      const q = "?artista=" + encodeURIComponent(artista || "") +
        "&titolo=" + encodeURIComponent(titolo || "") +
        "&sec=" + encodeURIComponent(String(Math.round(secondi || 0) || 0));
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/cerca" + q, { cache: "no-store", signal: ctl.signal });
      clearTimeout(scad);
      if (!r.ok) return "";
      const j = await r.json();
      return (j && j.trovato && j.video && j.video.url) ? String(j.video.url) : "";
    } catch (e) {
      dimenticaPonte();
      return "";
    }
  }

  /* Tasto YouTube. Premendolo:
     1) se il PC e' collegato cerca il video ORIGINALE del brano, lo copia
        negli appunti e lo apre;
     2) se il brano non si trova, o se non c'e' il PC, apre la ricerca con
        artista e titolo, cosi' la trovi comunque.
     Il link di ricerca resta negli appunti in ogni caso. */
  function linkYouTube(artista, titolo, secondi) {
    const q = [artista, titolo].map((s) => String(s || "").trim()).filter(Boolean).join(" ");
    if (!q) return null;
    const ricerca = "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
    const a = linkEsterno("yt", ricerca,
      "Cerca il video originale su YouTube e copia il link negli appunti", "btn-yt");
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      segnalaErrore("yt premuto: " + q.slice(0, 60));
      // Apro subito una scheda (durante il clic, altrimenti il browser la
      // blocca) ma con un avviso dentro: se lascio about:blank sembra rotto,
      // e se apro direttamente la ricerca di YouTube sembra che non abbia
      // trovato niente. La ricerca del video esatto puo' mettere 10 secondi.
      let scheda = null;
      try { scheda = window.open("about:blank", "_blank"); } catch (e) { scheda = null; }
      if (!scheda) {
        segnalaErrore("yt: il browser ha bloccato la nuova scheda");
        copiaNegliAppunti(ricerca);
        toast("Il browser ha bloccato la nuova scheda: link di ricerca copiato negli appunti");
        return;
      }
      try {
        scheda.document.open();
        scheda.document.write(
          "<!doctype html><html><head><meta charset='utf-8'><title>Cerco il video</title></head>" +
          "<body style='background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif;" +
          "display:flex;height:100vh;align-items:center;justify-content:center;text-align:center'>" +
          "<div><div style='font-size:34px'>&#127916;</div>" +
          "<p style='font-size:18px'>Sto cercando il video originale di</p>" +
          "<p style='font-size:22px;font-weight:700'>" + String(q).replace(/[<>&]/g, " ") + "</p>" +
          "<p style='color:#8b949e;font-size:15px'>Ci metto qualche secondo. Non chiudere questa scheda.</p></div>" +
          "</body></html>");
        scheda.document.close();
      } catch (e) { /* la scheda non si lascia scrivere: pazienza */ }
      const testoVecchio = a.textContent;
      a.textContent = "...";
      cercaVideoEsatto(artista, titolo, secondi).then((esatto) => {
        if (a.isConnected) a.textContent = testoVecchio;
        if (!esatto) {
          // niente video esatto: allora si va alla ricerca, che almeno la
          // vedi e la cerchi tu
          try { scheda.location.replace(ricerca); } catch (e) {
            try { scheda.location.href = ricerca; } catch (e2) { /* noop */ }
          }
          copiaNegliAppunti(ricerca);
          toast("Non ho trovato il video esatto: ti ho aperto la ricerca");
          segnalaErrore("video esatto non trovato per: " + q.slice(0, 60));
          return;
        }
        try { scheda.location.replace(esatto); } catch (e) {
          try { scheda.location.href = esatto; } catch (e2) { /* noop */ }
        }
        segnalaErrore("video esatto: " + esatto);
        copiaNegliAppunti(esatto).then((ok) => {
          toast(ok ? "Video originale trovato e link copiato negli appunti"
            : "Video originale trovato, ma non sono riuscito a copiare il link");
        });
      });
    });
    return a;
  }

  // Il convertitore e' un sito esterno: apro la pagina, non un brano a caso.
  // Chiamato "noTube" e non "mp3" perche' il nome dice che e' un sito.
  function linkConvertitore() {
    return linkEsterno("noTube", LINK_CONVERTITORE,
      "Sito esterno: apri la pagina, incolla il link del video e scarica tu", "btn-mp3");
  }

  async function findDownload(item) {
    const cands = [];
    /* Le due ricerche andavano una dopo l'altra: se un sito ci metteva 8
       secondi e l'altro 6, la riga restava su "cerco..." per 14 secondi.
       Adesso partono insieme e ognuno ha un tetto di 9 secondi: al massimo
       si aspetta il sito piu' lento, non la somma. */
    const esiti = await Promise.allSettled([
      conScadenza(searchArchive(item), 9000, "sito lento"),
      conScadenza(searchCommons(item), 9000, "sito lento")
    ]);
    for (const e of esiti) {
      if (e.status === "fulfilled" && e.value) cands.push(...e.value);
    }
    cands.sort((a, b) => b.score - a.score);
    const list = cands.slice(0, 5);
    return { best: list.length ? list[0] : null, list };
  }

  /* Cerca un brano e gli assegna lo stato trovato (trovato / scegli /
     solo anteprima / non disponibile). La usa sia il ciclo principale sia il
     tasto "Riprova", cosi' la logica e' sempre la stessa.
     Massimo 14 secondi: adesso i due siti si cercano insieme e ognuno ha un
     tetto proprio, quindi non serve stare 35 secondi aspettando. */
  async function cercaItemSingolo(item) {
    let found = null;
    let scaduto = false;
    try {
      found = await conScadenza(findDownload(item), 14000, "ricerca scaduta");
    } catch (e) {
      found = null;
      scaduto = /scadut|lent/i.test(String((e && e.message) || ""));
    }
    item.candidates = (found && found.list) || [];
    item.tagMancato = "";
    const best = found && found.best;
    if (best && best.strong) {
      item.state = "ready";
      item.meta = best;
    } else if (item.anteprima) {
      // il brano intero non e' in nessun archivio: resta l'anteprima
      item.candidates = item.candidates.concat([item.anteprima]);
      item.meta = item.anteprima;
      item.state = "found";
      item.tagTrovato = "anteprima 30s";
    } else if (best) {
      item.state = "choose";
    } else {
      item.state = "missing";
      item.tagMancato = scaduto ? "ricerca scaduta" : "";
    }
    paintImport(item);
  }

  function sync32(n) {
    return new Uint8Array([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
  }

  function concatBytes(list) {
    let total = 0;
    for (const b of list) total += b.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const b of list) {
      out.set(b, off);
      off += b.length;
    }
    return out;
  }

  function id3Frame(id, payload) {
    return concatBytes([new TextEncoder().encode(id), sync32(payload.length), new Uint8Array([0, 0]), payload]);
  }

  function id3Text(id, value) {
    if (!value) return null;
    const bytes = new TextEncoder().encode(String(value));
    const payload = new Uint8Array(1 + bytes.length);
    payload[0] = 3;
    payload.set(bytes, 1);
    return id3Frame(id, payload);
  }

  function id3Cover(cover) {
    if (!cover || !cover.data || !cover.data.length) return null;
    const mime = cover.mime || "image/jpeg";
    return id3Frame("APIC", concatBytes([
      new Uint8Array([0]),
      new TextEncoder().encode(mime),
      new Uint8Array([0, 3, 0]),
      cover.data
    ]));
  }

  function stripExistingTag(blob, head) {
    if (!(head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33)) return blob;
    const major = head[3];
    if (major === 2 && head.length >= 8) {
      const size = (head[5] << 16) | (head[6] << 8) | head[7];
      if (size > 0 && 6 + size <= blob.size) return blob.slice(6 + size);
      return blob;
    }
    if (head.length >= 10) {
      const size = ((head[6] & 0x7f) << 21) | ((head[7] & 0x7f) << 14) | ((head[8] & 0x7f) << 7) | (head[9] & 0x7f);
      if (size > 0 && 10 + size <= blob.size) return blob.slice(10 + size);
    }
    return blob;
  }

  async function tagMp3(blob, meta, cover) {
    try {
      if (blob.size > MAX_DOWNLOAD) return blob;
      const head = new Uint8Array(await blob.slice(0, 10).arrayBuffer());
      const audio = stripExistingTag(blob, head);
      const frames = [
        id3Text("TIT2", meta.title),
        id3Text("TPE1", meta.artist),
        id3Text("TALB", meta.album),
        id3Text("TCOP", meta.license),
        id3Text("TSRC", meta.source),
        id3Cover(cover)
      ].filter(Boolean);
      const body = concatBytes(frames);
      const header = concatBytes([
        new TextEncoder().encode("ID3"),
        new Uint8Array([3, 0, 0]),
        sync32(body.length)
      ]);
      return new Blob([header, body, audio], { type: blob.type || "audio/mpeg" });
    } catch (e) {
      return blob;
    }
  }

  async function fetchCoverBlob(url) {
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch (e) {
      return null;
    }
  }

  function fmtBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  async function downloadDirect(url, onProgress, signal) {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const type = (res.headers.get("content-type") || "").toLowerCase();
    if (type && type.indexOf("audio/") < 0 && type.indexOf("application/octet-stream") < 0) {
      throw new Error("il link non punta a un file audio");
    }
    const total = Number(res.headers.get("content-length") || 0);
    if (total && total > MAX_DOWNLOAD) throw new Error("file troppo grande (max 40 MB)");
    if (!res.body) return await res.blob();
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      chunks.push(part.value);
      got += part.value.byteLength;
      if (got > MAX_DOWNLOAD) {
        try { await reader.cancel(); } catch (e) { /* noop */ }
        throw new Error("file troppo grande (max 40 MB)");
      }
      onProgress(total ? got / total : 0, got);
    }
    return new Blob(chunks, { type: type || "audio/mpeg" });
  }

  function readFileWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total, e.loaded);
      };
      fr.onload = () => resolve(new Blob([fr.result], { type: file.type || "audio/mpeg" }));
      fr.onerror = () => reject(new Error("lettura file fallita"));
      fr.readAsArrayBuffer(file);
    });
  }

  async function saveImported(meta, blob, source) {
    const id = "i-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const coverBlob = await fetchCoverBlob(meta.cover);
    const isMp3 = /mpeg/i.test(blob.type || "") || /\.(mp3|mpeg)$/i.test(meta.url || "");
    const audio = isMp3 ? await tagMp3(blob, meta, coverBlob) : blob;
    const rec = {
      id,
      title: meta.title,
      artist: meta.artist || "",
      album: meta.album || "",
      blob: audio,
      size: audio.size,
      source: source || "import",
      profile: profile,
      license: meta.license || "",
      pageUrl: meta.url || "",
      cover: coverBlob || meta.cover || "",
      date: new Date().toISOString()
    };
    await dbPut(rec);
    await dbSetImport({ id, title: rec.title, artist: rec.artist, album: rec.album, status: "ok", date: rec.date });
    /* Ste: "velocizza il tempo in cui ci mette a inserire le canzoni". Ho appena
       dato la canzone al computer: non mi metto in attesa i secondi che seguono,
       guardo subito se e' gia' arrivata in libreria (il computer ci mette poco). */
    try { _ultimoControllo = 0; } catch (e) { /* noop */ }
    /* Ogni brano nuovo lo condivido subito con gli altri dispositivi, senza
       aspettare che venga ricaricata la pagina. */
    condividiBraniLocali(true);
    enrichTrack(id);
    return rec;
  }

  async function importItem(item) {
    const meta = item.meta;
    if (!meta || !meta.url) return;
    for (const k of trackKeys(meta)) if (libKeys.has(k)) {
      item.state = "dupe";
      paintImport(item);
      return;
    }
    item.state = "downloading";
    item.controller = new AbortController();
    paintImport(item);
    if (item.el) item.el.prog.hidden = false;
    try {
      const blob = await downloadDirect(meta.url, (ratio, got) => {
        if (!item.el) return;
        item.el.fill.style.width = Math.round(ratio * 100) + "%";
        item.el.bytes.textContent = fmtBytes(got);
      }, item.controller.signal);
      await finishImport(item, blob, meta.source);
    } catch (e) {
      if (e && e.name === "AbortError") return;
      item.state = "error";
      if (item.el) {
        item.el.fill.classList.add("err");
        item.el.bytes.textContent = e.message;
      }
      paintImport(item);
    }
  }

  async function autoImportAll() {
    const todo = importList.filter((x) => x.state === "ready");
    let idx = 0;
    const worker = async () => {
      for (;;) {
        const i = idx++;
        if (i >= todo.length) return;
        await importItem(todo[i]);
      }
    };
    const n = Math.min(2, todo.length);
    const runners = [];
    for (let k = 0; k < n; k++) runners.push(worker());
    await Promise.all(runners);
  }

  /* Apre il selettore file per agganciare un brano a questo pezzo della lista.
     Serve dopo aver scaricato l'mp3 da qualche parte a mano. */
  function scegliFilePer(item) {
    importActive = item;
    const inp = $("importAudioInput");
    inp.value = "";
    inp.click();
  }

  // Numeri da seguire, uno per riga: si legge meglio di un paragrafo.
  function guidaPassi(testi) {
    const ol = document.createElement("ol");
    ol.className = "imp-guida";
    for (const t of testi) {
      const li = document.createElement("li");
      li.textContent = t;
      ol.appendChild(li);
    }
    return ol;
  }

  /* Ponte YouTube sul PC: un piccolo programma (strumenti-youtube) che gira
     solo sulla mia macchina e ascolta su 127.0.0.1. Se e' acceso, posso
     scaricare e convertire da solo. Funziona SOLO aprendo la app sul PC:
     dal telefono il browser blocca la richiesta, e va bene cosi'. */
  /* Il programma che scarica puo' stare sul computer stesso (127.0.0.1) oppure
     nella rete privata di casa (Tailscale, indirizzo 100.x): dal telefono
     127.0.0.1 sarebbe il telefono stesso, quindi provo piu' indirizzi.
     Resto solo su 127.0.0.1 e sull'indirizzo privato: mai su 0.0.0.0, che
     aprirebbe il programma a chiunque sia sul Wi-Fi. */
  /* Gli indirizzi dove provo a trovare il programma sul computer, in
     ordine. Il primo che risponde vince e viene usato per tutto il resto.

     - 127.0.0.1: quando la pagina e' aperta sul computer stesso
     - 192.168.1.2: il computer sulla rete di casa, cioe' quello che
       interessa quando l'apro dal telefono collegato al Wi-Fi di casa
     - 100.106.211.2: quello di Tailscale, per quando si usa la rete privata

     Prima mancava quello di casa: dal telefono non riuscivo a trovare il
     programma del computer e i brani non venivano condivisi. */
  /* Ste: "il telefono non trova piu' il computer". Il computer aveva cambiato
     indirizzo sulla rete (ora e' 192.168.1.40, prima era 192.168.1.2) e
     nell'elenco c'era solo il vecchio: il telefono provava, non rispondeva
     niente e ogni salvataggio finiva a terra. Metto dentro anche quello
     nuovo, cosi' va bene con tutti e due. */
  const INDIRIZZI_PONTE = [
    "http://127.0.0.1:8788",
    "http://192.168.1.40:8788",
    "http://192.168.1.2:8788",
    "http://100.106.211.2:8788"
  ];
  let ponteCheRisponde = "";
  let ponteCache = null;
  let segnalatoIndirizzo = "";

  // Manda un errore al registro del programma sul PC, se e' acceso.
  // Serve a me per capire cosa si rompe senza dover chiedere ogni volta.

  /* Provo gli indirizzi uno alla volta finche' uno risponde.
     Sul computer risponde 127.0.0.1, dal telefono risponde l'indirizzo
     della rete privata. Uso quello che ha risposto per tutte le richieste
     successive, cosi' non rifaccio la prova ogni volta.
     Se piu' righe premono i pulsanti insieme condividono la stessa prova:
     prima ognuna faceva la sua e si avevano 20 richieste in contemporanea,
     tutte lentissime, e la scritta "controllo il PC..." restava ferma. */
  let ponteInCorso = null;
  async function cercaPonte() {
    if (ponteCheRisponde) return ponteCheRisponde;
    /* Ste: "il programma sul computer non e' raggiungibile" (dal PC, dalla
       pagina sulla porta 8167). Da li' la pagina e' su una porta diversa
       dal programma, e il browser la blocca. Provo quindi anche:
         - lo STESSO indirizzo della pagina, ma sulla porta giusta
           (stessa famiglia di rete: il browser lo accetta);
         - l'indirizzo della pagina con la porta del programma, se la
           pagina e' gia' sulla porta giusta (e' il caso normale).
       Sono tentativi in piu', e non rompono niente. */
    const porte = [8788];
    const host = String(location.hostname || "");
    const portaPagina = Number(String(location.port || "")) || 0;
    if (host && portaPagina && portaPagina !== 8788) porte.unshift(portaPagina);
    const candidati = [];
    for (const p of porte) {
      if (host) candidati.push("http://" + host + ":" + p);
    }
    for (const base of INDIRIZZI_PONTE) candidati.push(base);

    for (const base of candidati) {
      try {
        const ctl = new AbortController();
        const scad = setTimeout(() => ctl.abort(), 1800);
        const r = await fetch(base + "/ping", { cache: "no-store", signal: ctl.signal });
        clearTimeout(scad);
        if (r.ok) {
          ponteCheRisponde = base;
          /* Il computer e' di nuovo raggiungibile: riprovo a cancellare i
             file che erano rimasti in lista (quando l'ho eliminato un
             brano col computer spento). */
          try { setTimeout(function () { _provaCancellazioniPendenti(); }, 1500); } catch (e) { /* noop */ }
          return base;
        }
      } catch (e) { /* questo indirizzo non va bene, provo il prossimo */ }
    }
    return "";
  }
  function trovaPonte() {
    if (ponteCheRisponde) return Promise.resolve(ponteCheRisponde);
    if (!ponteInCorso) {
      ponteInCorso = cercaPonte().then((r) => { ponteInCorso = null; return r; });
    }
    return ponteInCorso;
  }

  /* Ste: "si continua ad aggiornare", "la lista si riordina", "la musica si
     interrompe e riparte". Ho provato a indovinare il motivo e non ci sono
     arrivato, quindi adesso lo REGISTRO: ogni volta che la libreria si
     ricostruisce o la musica riparte, me lo segno e poi leggo cosa e'
     successo davvero (e con che tempi). Non cambia niente nel
     comportamento: e' solo un appunto. */
  let _diagUltimo = 0;
  function _diag(testo) {
    try {
      const ora = Date.now();
      if (ora - _diagUltimo < 1200) return;
      _diagUltimo = ora;
      const el = $("playlist");
      const scorrimento = el ? Math.round(el.scrollTop) : -1;
      const quante = Array.isArray(tracks) ? tracks.length : -1;
      /* Mi serve anche CHI mi sta chiamando: senza questo non si capiva
         nulla. Prendo solo i nomi delle funzioni, senza file e numeri di
         riga (cambiano a ogni versione e renderebbero il messaggio illeggibile). */
      let chiama = "";
      try {
        const st = String(new Error().stack || "");
        chiama = st.split("\n").slice(2, 7).map((riga) => {
          const m = /at\s+([A-Za-z_$][\w$.<>]*)\s*\(/.exec(riga);
          return m ? m[1] : "?";
        }).filter((x) => x && x !== "?").join(" > ");
      } catch (e) { /* noop */ }
      segnalaErrore("DIAG " + testo + " | " + (chiama || "nessun chiamante") +
        " | scorrimento=" + scorrimento + " | brani=" + quante + " | profilo=" + profile);
    } catch (e) { /* noop */ }
  }

  function segnalaErrore(testo) {
    const msg = "v" + APP_VERSION + " | " + String(testo || "").slice(0, 300);
    try {
      const base = ponteCheRisponde || INDIRIZZI_PONTE[0];
      const ctl = new AbortController();
      const scad = setTimeout(() => ctl.abort(), 3000);
      fetch(base + "/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testo: msg }),
        signal: ctl.signal
      }).catch(() => {}).then(() => clearTimeout(scad));
    } catch (e) { /* noop */ }
  }

  /* Questa funzione non deve mai rompersi: se le succede qualcosa di inatteso
     la scritta del brano resta ferma su "controllo il PC..." e sembra che il
     programma sia occupato. Quindi ogni errore diventa una risposta
     "programma spento", che e' la verita' quando qualcosa non funziona. */
  async function ponteOnline() {
    try {
      if (ponteCache && Date.now() - ponteCache.t < 30000) return ponteCache.ok;
      /* Se l'indirizzo giusto e' gia' noto mi fido: ha gia' risposto una
         volta, non rifaccio la richiesta. */
      if (ponteCheRisponde) {
        ponteCache = { ok: true, t: Date.now() };
        return true;
      }
      const base = await trovaPonte();
      const ok = !!base;
      const perche = ok ? "" : "nessun indirizzo risponde (" + INDIRIZZI_PONTE.join(", ") + ")";
      ponteCache = { ok: ok, t: Date.now() };
        /* e lo dico a schermo, cosi' non devi indovinare se questa
           pagina puo' scaricare oppure no */
        try { _mostraAvvisoCollegamento(ok, base); } catch (e) { /* noop */ }
      if (segnalatoIndirizzo !== window.location.href) {
        segnalatoIndirizzo = window.location.href;
        segnalaErrore("pagina aperta su " + window.location.href +
          (window.isSecureContext ? " (sicura)" : " (non sicura)") +
          " -> programma sul PC " + (ok ? "raggiungibile su " + base : "NON raggiungibile: " + perche));
      }
      return ok;
    } catch (e) {
      ponteCache = { ok: false, t: Date.now() };
      segnalaErrore("controllo del PC fallito: " + String((e && (e.message || e)) || "errore").slice(0, 160));
      return false;
    }
  }

  // Campo dove incollare il link di YouTube, col tasto per convertirlo.
  // cartella: "" (solo libreria), "ste" o "emanuela" (salva anche la copia).
  // Prima di mostrare il campo controllo che il programma sul PC sia vivo:
  // se e' spento te lo dico, invece di lasciare un campo che non serve.
  /* La riga del brano esiste ancora? item.el e' un oggetto mio, non un
     elemento della pagina: per sapere se e' ancora attaccata devo guardare
     l'elemento vero, cioe' la riga o il contenitore dei tasti.
     Prima usavo el.isConnected, che su un oggetto e' sempre undefined:
     la funzione usciva subito e non creava niente. */
  function rigaViva(el) {
    if (!el) return false;
    const nodo = el.row || el.actions;
    return !!(nodo && nodo.isConnected);
  }

  /* Un solo pulsante e non devi incollare piu' niente a mano:
     cerco io il video giusto, te lo apro, te lo metto negli appunti e parto
     subito con la conversione. Prima dovevi aprire YouTube, copiare il link,
     tornare indietro e incollarlo: erano 4 passaggi e sembrava che non
     funzionasse. Il campo dove incollare resta, per quando sbaglio video. */
  /* Se il brano e' gia' nella libreria non lo riscarico da YouTube: e' una
     richiesta inutile che fa salire il conto delle richieste e, prima o poi,
     porta a un blocco. Meglio dirti "ce l'hai gia'" e farti sentire quello
     che hai. */
  function giaInLibreria(t) {
    try {
      for (const x of tracks) {
        if (!x || !x.url) continue;
            if (stessoBrano({ title: t.title, artist: t.artist }, { title: x.title, artist: x.artist })) {
          return x;
        }
      }
    } catch (e) { /* noop */ }
    return null;
  }

  async function campoLinkYouTube(item, cartella, stato) {
    const scrivi = (testo) => scriviStatoPonte(stato, testo);
    item.cartella = cartella || "";
    segnalaErrore("premuto: " + (cartella ? "salva in " + cartella : "solo libreria"));
    scrivi("controllo il PC...");
    const online = await ponteOnline();
    /* Non esco piu' se la riga e' sparita: lavoro con gli elementi nuovi,
       cosi' la scritta non resta ferma su "controllo il PC..." per sempre. */
    const el = item.el;
    if (!el) { scrivi("programma sul PC: spento"); return; }
    scrivi("programma sul PC: acceso");
    /* Prima di tutto: e' gia' nella libreria? allora non scarico niente,
       non solo per risparmiare, ma per non chiedere a YouTube. */
    const gia = giaInLibreria(item);
    if (gia && gia.url) {
      scrivi("brano gia' in libreria");
      toast("Questo brano ce l'hai gia': non lo riscarico");
      segnalaErrore("brano gia' presente, non riscaricato: " +
        String((item.artist || "") + " " + (item.title || "")).slice(0, 60));
      return;
    }
    if (!online) {
      scrivi("programma sul PC: spento");
      toast("Il programma sul PC non e' acceso: apri la Music Box dal link 'Sul PC' della dashboard");
      return;
    }
    if (el.ytUrl) {
      el.ytUrl.focus();
      return;
    }
    /* Apro la scheda SUBITO, durante il clic: se aspetto la ricerca il
       browser la blocca, e senza scheda non posso mostrarti il video. */
    let scheda = null;
    try { scheda = window.open("about:blank", "_blank"); } catch (e) { scheda = null; }
    scrivi("cerco il video giusto su YouTube...");
    const esatto = await cercaVideoEsatto(item.artist, item.title, item.secs);
    const dopo = item.el;
    if (!dopo) return;
    if (!esatto) {
      // non ho trovato il brano: apro la ricerca cosi' la vedi e scegli tu
      const ricerca = "https://www.youtube.com/results?search_query=" +
        encodeURIComponent([item.artist, item.title].filter(Boolean).join(" "));
      if (scheda) { try { scheda.location.replace(ricerca); } catch (e) {} }
      copiaNegliAppunti(ricerca);
      toast("Non ho trovato il video esatto: ti ho aperto la ricerca e ho copiato il link");
      segnalaErrore("video esatto non trovato: apro la ricerca");
      scrivi("aperta la ricerca su YouTube");
      campoLinkManuale(item);
      return;
    }
    if (scheda) { try { scheda.location.replace(esatto); } catch (e) {} }
    copiaNegliAppunti(esatto);
    segnalaErrore("video esatto: " + esatto);
    toast("Video giusto trovato e link copiato: sto scaricando");
    scrivi("sto scaricando l'mp3...");
    await convertiDaYouTube(item, esatto);
  }

  /* Il campo da incollare, per quando serve scegliere il video a mano. */
  function campoLinkManuale(item) {
    const el = item.el;
    if (!el || el.ytUrl) return;
    const invio = document.createElement("span");
    invio.className = "imp-nota-anteprima";
    invio.textContent = "incolla qui il link di YouTube (quello che finisce con watch?v=...)";
    el.actions.appendChild(invio);
    const inp = document.createElement("input");
    inp.className = "imp-url";
    inp.type = "url";
    inp.placeholder = "https://www.youtube.com/watch?v=...";
    const go = document.createElement("button");
    go.className = "btn-mini go";
    go.textContent = "Scarica";
    go.addEventListener("click", () => convertiDaYouTube(item));
    el.actions.appendChild(inp);
    el.actions.appendChild(go);
    el.ytUrl = inp;
    el.ytGo = go;
    segnalaErrore("campo pronto per incollare il link");
    try { inp.focus(); } catch (e) {}
  }

  // Scarica l'mp3 dal PC e lo mette subito in libreria, agganciandolo a questo
  // brano. Mostra l'avanzamento mentre arrivano i byte.
  // urlPronto: quando l'ho gia' trovato io, non aspetto che lo incolli.
  /* ---------- Brani che non sono riuscito a scaricare ----------
     Prima, quando un download falliva, spariva tutto: spariva il link,
     spariva l'errore, e dopo un ricaricamento della pagina non sapevo
     piu' cosa avevo provato a scaricare.
     Adesso me li segno (per profilo, quindi restano anche dopo aver
     chiuso la pagina) e ci metto un bottone per riprovare: magari nel
     frattempo YouTube ha smesso di bloccarmi. */
  function _falliti() {
    try {
      const st = profileState(profile);
      return Array.isArray(st.falliti) ? st.falliti : [];
    } catch (e) { return []; }
  }

  function _salvaFalliti(lista) {
    try { writeProfileState(profile, { falliti: lista.slice(0, 60) }); } catch (e) { /* noop */ }
  }

  function _aggiornaBadgeFalliti() {
    const n = _falliti().length;
    const b = $("fallitiBadge");
    if (b) { b.textContent = String(n); b.hidden = n === 0; }
    const btn = $("btnFalliti");
    if (btn) btn.classList.toggle("has-falliti", n > 0);
    return n;
  }

  function _notaFallito(url, artista, titolo, cartella, errore) {
    if (!url) return;
    const voce = {
      url: String(url),
      artista: String(artista || ""),
      titolo: String(titolo || ""),
      cartella: String(cartella || ""),
      errore: String(errore || "").slice(0, 160),
      quando: Date.now()
    };
    const lista = _falliti().filter((x) => x.url !== voce.url);
    lista.unshift(voce);
    _salvaFalliti(lista);
    _aggiornaBadgeFalliti();
  }

  function _togliFallito(url) {
    _salvaFalliti(_falliti().filter((x) => x.url !== url));
    _aggiornaBadgeFalliti();
  }

  /* Se un brano che avevo segnato come fallito e' comparso in libreria
     (perche' l'hai aggiunto tu a mano), non lo riprovo piu': e' inutile. */
  function _pulisciFallitiRisolti() {
    const lista = _falliti();
    if (!lista.length) return;
    let tolta = false;
    const resta = lista.filter((f) => {
      const gia = tracks.some((t) => stessoBrano(t, { artist: f.artista, title: f.titolo }));
      if (gia) tolta = true;
      return !gia;
    });
    if (tolta) { _salvaFalliti(resta); _aggiornaBadgeFalliti(); }
  }

  let _riprovaInCorso = false;

  async function _riprovaFallito(f) {
    if (_riprovaInCorso) return false;
    _riprovaInCorso = true;
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: f.url,
          cartella: f.cartella || "",
          titolo: [f.artista, f.titolo].join(" - ").replace(/^\s*-\s*/, "").trim()
        })
      });
      if (!r.ok) {
        let msg = "non riuscito";
        try { const j = await r.json(); if (j && j.errore) msg = String(j.errore); } catch (e) { }
        /* se YouTube ha bloccato, la pausa la gestisce il programma: non
           insisto e lascio la voce nella lista */
        _notaFallito(f.url, f.artista, f.titolo, f.cartella, msg);
        toast("Non ancora: " + msg.slice(0, 60));
        return false;
      }
      const blob = await r.blob();
      const meta = {
        title: f.titolo || (blob && blob.name) || "brano",
        artist: f.artista || "",
        album: "",
        license: "",
        source: "youtube (convertito sul PC)"
      };
await saveImported(meta, blob, meta.source);
        for (const k of trackKeys(meta)) libKeys.add(k);
        _togliFallito(f.url);
        await loadAll();
        _portaAlBranoScaricato(meta);
        return true;
    } catch (e) {
      _notaFallito(f.url, f.artista, f.titolo, f.cartella, (e && e.message) || "errore");
      return false;
    } finally {
      _riprovaInCorso = false;
    }
  }

  async function _riprovaTutti() {
    if (_riprovaInCorso) return;
    const lista = _falliti();
    for (let i = 0; i < lista.length; i++) {
      const f = lista[i];
      _stampaFalliti("Sto riprovando " + (i + 1) + " di " + lista.length + ": " + (f.titolo || f.artista || "senza nome"));
      const ok = await _riprovaFallito(f);
      if (!ok) {
        /* se e' bloccato mi fermo: gli altri fallirebbero uguale e
           farei solo danno */
        _stampaFalliti("Mi fermo: YouTube sta bloccando. Riprova fra qualche minuto.");
        return;
      }
      /* una pausa fra una prova e l'altra, come fa il programma sul PC */
      await new Promise((r) => setTimeout(r, 2500));
    }
    _stampaFalliti("Fatto: ho riprovato tutti.");
  }

  function _stampaFalliti(sottotitolo) {
    const pannello = $("fallitiPanel");
    const corpo = $("fallitiCorpo");
    if (!pannello || !corpo) return;
    const lista = _falliti();
    if ($("fallitiSub")) $("fallitiSub").textContent = sottotitolo || (lista.length ? "Qui puoi riprovare quando vuoi" : "Non c'e' niente da riprovare");
    let html = "";
    if (!lista.length) {
      html = '<div class="stat-lista"><div class="stat-item"><span>Brani non scaricati</span><b>0</b></div></div>' +
        '<p class="nota" style="margin:8px 2px 0">Non c\'e\' nessun brano scaricato a meta\'.</p>';
    } else {
      html = '<div class="profile-actions" style="margin-bottom:10px"><button class="btn-main" id="btnRiprovaTutti">Riprova tutti</button>' +
        '<button class="btn-ghost" id="btnDimenticaFalliti">Dimentica tutti</button></div>';
      for (const f of lista) {
        const nome = [f.artista, f.titolo].filter(Boolean).join(" - ") || "senza nome";
        const quando = f.quando ? new Date(f.quando) : null;
        const quandoTxt = quando ? quando.toLocaleDateString("it-IT") + " " + String(quando.getHours()).padStart(2, "0") + ":" + String(quando.getMinutes()).padStart(2, "0") : "";
        html += '<div class="falliti-riga" data-url="' + encodeURIComponent(f.url) + '">' +
          '<div class="falliti-info"><div class="falliti-nome">' + String(nome).replace(/[<>]/g, "") + "</div>" +
          '<div class="falliti-dome">' + String(f.errore || "").replace(/[<>]/g, "") + (quandoTxt ? " - " + quandoTxt : "") + "</div></div>" +
          '<div class="falliti-btns"><button data-azione="riprova">Riprova</button>' +
          '<button data-azione="togli">Togli</button></div></div>';
      }
    }
    corpo.innerHTML = html;
    pannello.hidden = false;
    syncNoScroll();
  }

  function _chiudiPannelloFalliti() {
    const pannello = $("fallitiPanel");
    if (pannello) pannello.hidden = true;
    syncNoScroll();
  }

  async function convertiDaYouTube(item, urlPronto) {
    const el = item.el;
    const url = urlPronto || (el.ytUrl ? el.ytUrl.value.trim() : "");
    if (!url) {
      toast("Prima incolla il link di YouTube");
      segnalaErrore("Scarica premuto ma il campo era vuoto");
      return;
    }
    segnalaErrore("converto: " + url.slice(0, 60) + " cartella=" + (el.cartella || "nessuna"));
    if (el.ytGo) el.ytGo.disabled = true;
    if (el.ytUrl) el.ytUrl.disabled = true;
    item.state = "downloading";
    el.prog.hidden = false;
    el.fill.classList.remove("err");
    el.fill.style.width = "3%";
    el.bytes.textContent = "converto col PC...";
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
    const r = await fetch(base + "/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
        url: url,
        cartella: (el.cartella || ""),
        /* Artisti e titolo LI MANIO SEPARATI: il PC li mette insieme nel nome
           del file nell'ordine giusto. Prima gli mandavo "artista - titolo"
           già attaccato e se il brano aveva i nomi scambiati restavano
           scambiati per sempre. */
        artista: (item.artist || ""),
        titolo: (item.title || "")
        })
      });
      if (!r.ok) {
        let msg = "conversione non riuscita";
        try {
          const j = await r.json();
          if (j && j.errore) msg = String(j.errore);
        } catch (e) {}
        throw new Error(msg);
      }
      // se avevo chiesto una copia su disco, te dico se e' andata bene
      const copia = r.headers.get("X-Cartella") || "";
      if (copia === "non salvata") toast("Ho l'mp3, ma non sono riuscito a salvarlo in cartella");
      /* Ste: riscaricavo lo stesso brano piu' volte e in libreria finivano due
         copie. Ora il PC se ne accorge e non crea il secondo file: te lo dico
         perche' cosi' non pensi che sia andato storto qualcosa. */
      if (copia === "gia-presente") toast("Questo brano ce l'hai gia': non ho creato un secondo file", 5000);
      /* Ste: "ci sono canzoni con un mp3 diverso dal titolo". Il computer ora
         controlla il titolo VERO del video scaricato: se non e' quello che
         avevo chiesto me lo dice qui, invece di lasciare un brano sbagliato in
         libreria senza che se ne accorga nessuno. */
      let attenzione = r.headers.get("X-Attenzione") || "";
      if (attenzione) { try { attenzione = decodeURIComponent(attenzione); } catch (e) { } }
      // leggo a pezzetti cosi' si vede l'avanzamento
      const lettore = r.body && r.body.getReader ? r.body.getReader() : null;
      let parti = [];
      let totale = 0;
      if (lettore) {
        for (;;) {
          const passo = await lettore.read();
          if (passo.done) break;
          parti.push(passo.value);
          totale += passo.value.length;
          el.fill.style.width = Math.min(95, 10 + Math.round(totale / 90000)) + "%";
          el.bytes.textContent = fmtBytes(totale);
        }
      } else {
        parti = [await r.arrayBuffer()];
        totale = parti[0].byteLength;
      }
      const blob = new Blob(parti, { type: "audio/mpeg" });
      segnalaErrore("mp3 ricevuto: " + blob.size + " byte, lo metto in libreria");
      el.fill.style.width = "100%";
      el.bytes.textContent = fmtBytes(blob.size);
      item.meta = Object.assign({}, item.meta || {}, {
        title: item.title,
        artist: item.artist,
        album: item.album || "",
        license: (item.meta && item.meta.license) || "",
        source: "youtube (convertito sul PC)"
      });
      await finishImport(item, blob, "youtube (convertito sul PC)");
      /* Se il computer mi ha detto che il video non era quello che avevo
         chiesto, lo dico subito e adesso: cosi' vedi subito che quel brano
         e' sbagliato e lo cambi, invece di ritrovartelo fra giorni. */
      if (attenzione) {
        toast(attenzione.replace(/^ATTENZIONE:\s*/i, ""), 9000);
        segnalaErrore(attenzione.slice(0, 160));
      }
    } catch (err) {
      // non lo porto in "errore": puo' essere un link sbagliato, e serve
      // riprovare senza perdere il brano
      dimenticaPonte();
      el.fill.classList.add("err");
      el.bytes.textContent = String((err && err.message) || err);
segnalaErrore("conversione fallita: " + String((err && err.message) || err).slice(0, 160));
    /* me lo segno, cosi' posso riprovare dopo senza cercare di nuovo il link */
    _notaFallito(url, item.artist, item.title, (el && el.cartella) || "", (err && err.message) || err);
    item.state = "found";
      if (el.ytGo) el.ytGo.disabled = false;
      if (el.ytUrl) el.ytUrl.disabled = false;
    }
  }

  // Riga che dice se il programma sul PC e' acceso. Prima non si vedeva nulla
  // e non si capiva perche': ora lo stato e' sempre scritto.
  // Riga che dice se il programma sul PC e' acceso. Prima si aspettava
  // l'oggetto del brano e faceva el.actions.appendChild: ma ora i tasti
  // stanno in gruppi, e li passo direttamente il contenitore.
  function statoPonte(contenitore) {
    const s = document.createElement("span");
    s.className = "imp-stato-ponte";
    contenitore.appendChild(s);
    return s;
  }

  function scriviStatoPonte(s, testo) {
    if (!s) return;
    s.textContent = testo;
    s.classList.remove("imp-stato-ok", "imp-stato-no");
    if (testo.indexOf("controllo") === 0) return;   // ancora in prova: resta grigio
    s.classList.add(testo.indexOf("acceso") >= 0 ? "imp-stato-ok" : "imp-stato-no");
  }

  /* I tasti per il PC sono SEMPRE visibili, anche se il programma e' spento.
     Prima comparivano solo quando una richiesta riusciva: se falliva non
     vedevi niente e restavi a indovinare. Meglio un tasto che spiega. */
  function aggiungiPonte(item) {
    const el = item.el;
    if (!el || el.ponte) return;
    el.ponte = true;
    const gruppo = nuovoGruppo(el, "Sul PC (scarica e converti da solo)");
    // dichiaro lo stato PRIMA dei tasti: i tasti lo richiamano al click
    const stato = statoPonte(gruppo);
    scriviStatoPonte(stato, "controllo il PC...");
nuovoBottone(gruppo, "Scarica l'mp3 col PC", () => campoLinkYouTube(item, CARTELLA_PREDEFINITA, stato),
        "btn-mini-auto", "Scarico e converto io col PC: il brano va in libreria e resta su tutti i dispositivi");
      /* Aggiungere da YouTube direttamente da qui: il nome lo so gia' (e' il
         brano che sto cercando), quindi non devo riscriverlo. */
      nuovoBottone(gruppo, "Aggiungi da YouTube", () => {
        $("quickPanel").hidden = true;
        _aggiungiDaYouTube([(item.artista || ""), (item.titolo || "")].join(" - ")
          .replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim());
      }, "btn-mini-auto",
        "Prendo il link dagli appunti e aggiungo questo brano: col PC acceso subito, col PC spento in coda");
    // un tasto per ogni profilo: oltre che in libreria salvo una copia nella
    // sua cartella mp3 sul PC. Prima erano due scritti a mano.
    for (const p of PROFILI) {
      if (!p.cartella) continue;
      nuovoBottone(gruppo, "Salva in mp3 " + p.nome, () => campoLinkYouTube(item, p.cartella, stato),
        "btn-mini-cartella", "Oltre che in libreria, salvo una copia in musica mp3 " + p.cartella);
    }
    /* Aggiorno lo stato SENZA controllare se la riga e' ancora a schermo:
       se nel frattempo la lista si e' ridisegnata, questa riga e' vecchia e
       non la vede piu' nessuno, e la riga nuova fa il controllo per conto
       suo. Prima invece uscivo subito e la scritta "controllo il PC..."
       restava lì per sempre, e sembrava che il programma fosse occupato. */
    ponteOnline().then((online) => {
      scriviStatoPonte(stato, online
        ? "programma sul PC: acceso"
        : "programma sul PC: spento");
    });
    /* Rete di sicurezza: dopo 5 secondi la scritta non deve piu' dire
       "controllo il PC...", altrimenti sembra tutto bloccato. */
    setTimeout(() => {
      if (stato && stato.textContent && stato.textContent.indexOf("controllo") === 0) {
        scriviStatoPonte(stato, "programma sul PC: ?");
      }
    }, 5000);
  }

  // Mostra i passi da seguire sotto un brano che ha solo l'anteprima.
  function elGuide(item) {
    const el = item.el;
    if (!el || el.guida) return;
    const gruppo = nuovoGruppo(el, "A mano (senza PC)");
    const piu = document.createElement("details");
    piu.className = "hint-more imp-altro";
    const somma = document.createElement("summary");
    somma.textContent = "Come si fa senza il PC";
    piu.appendChild(somma);
    piu.appendChild(guidaPassi([
      "apri la canzone su YouTube, usa noTube, scarica, poi scegli il file qui sotto"
    ]));
    gruppo.appendChild(piu);
    nuovoBottone(gruppo, "Apri i miei file", () => scegliFilePer(item),
      "btn-mini-file", "Scegli l'mp3 che hai gia' scaricato a mano");
    el.guida = true;
  }

  function toggleUrlInput(item) {
    const el = item.el;
    if (el.url) {
      el.url.remove();
      if (el.go) el.go.remove();
      el.url = null;
      el.go = null;
      return;
    }
    const input = document.createElement("input");
    input.className = "imp-url";
    input.type = "url";
    input.placeholder = "https://... file audio che puoi scaricare";
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startUrlDownload(item);
    });
    const go = document.createElement("button");
    go.className = "btn-mini go";
    go.textContent = "Scarica";
    go.addEventListener("click", () => startUrlDownload(item));
    el.actions.appendChild(input);
    el.actions.appendChild(go);
    el.url = input;
    el.go = go;
  }

  // Un link YouTube (o un'altra pagina video) non e' un file audio: scaricarlo
  // darebbe solo la pagina del video. Meglio spiegare che cosa fare davvero.
  function eLinkVideo(url) {
    return /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com\/watch|instagram\.com\/reel)/i.test(url);
  }

  async function startUrlDownload(item) {
    const url = item.el.url ? item.el.url.value.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      toast("Indirizzo non valido");
      return;
    }
    if (eLinkVideo(url)) {
      item.el.url.value = "";
      if (item.el.go) item.el.go.disabled = false;
      toast("Questo e' il link di un video: convertilo prima in mp3 (tasto mp3), poi scegli il file scaricato");
      elGuide(item);
      return;
    }
    item.state = "downloading";
    item.el.prog.hidden = false;
    if (item.el.url) item.el.url.disabled = true;
    if (item.el.go) item.el.go.disabled = true;
    item.el.fill.classList.remove("err");
    try {
      const blob = await downloadDirect(url, (ratio, got) => {
        item.el.fill.style.width = Math.round(ratio * 100) + "%";
        item.el.bytes.textContent = fmtBytes(got);
      });
      item.meta = Object.assign({}, item.meta || {}, {
        title: item.title,
        artist: item.artist,
        album: item.album || "",
        license: (item.meta && item.meta.license) || "fonte esterna",
        url
      });
      await finishImport(item, blob, "link diretto");
    } catch (e) {
      item.state = "error";
      item.el.fill.classList.add("err");
      item.el.bytes.textContent = e.message;
      toast("Download fallito: " + e.message);
      paintImport(item);
    }
  }

  /* Questo brano e' gia' nella libreria? Lo controllo PRIMA di salvare,
     perche' una volta salvare e poi nascondere funzionava, ma lasciava
     tracce e non diceva niente all'utente: lui vedeva la canzone che
     riappariva e pensava che il brano si fosse perso.

     Uso stessoBrano() perche' confronta artista e titolo come li vede
     l'utente (ripuliti, senza "(Remastered)" ecc.). */
  function giaInLibreria(meta) {
    if (!meta || !meta.title) return null;
    /* un brano gia' importato in precedenza su questo dispositivo */
    for (const t of tracks || []) {
      if (stessoBrano(meta, t)) return t;
    }
    /* uno scaricato dal sito (non e' in tracks se e' nascosto) */
    for (const b of BUILTIN || []) {
      if (stessoBrano(meta, b)) return { title: stripArtistPrefix(b.artist, b.title) || b.title, artist: b.artist, builtin: true };
    }
    return null;
  }

  async function finishImport(item, blob, source) {
      if (item.el) {
        item.el.fill.classList.add("ok");
        item.el.fill.style.width = "100%";
      }
      const meta = item.meta || { title: item.title, artist: item.artist, album: "" };
      /* Se e' gia' presente non lo aggiungo e lo dico: meglio cosi' che
         lasciare due copie dello stesso brano. */
      const gia = giaInLibreria(meta);
      if (gia) {
        item.state = "done";
        item.duplicato = true;
        paintImport(item);
        toast("\"" + meta.title + "\" era gia' nella libreria: non l'ho aggiunto due volte", 5000);
        segnalaErrore("import saltato (gia' in libreria): " +
          String((meta.artist || "") + " " + meta.title).slice(0, 80));
        return null;
      }
      const rec = await saveImported(meta, blob, source);
      for (const k of trackKeys(meta)) libKeys.add(k);
      item.savedId = rec.id;
      item.state = "done";
      paintImport(item);
      toast(meta.title + " importato");
      await loadAll();
      return rec;
    }

  async function removeImportItem(item) {
    if (item.state === "downloading") return;
    const yes = await askConfirm("Togliere dalla ricerca?", "«" + item.title + "» sparisce da questo elenco. Se era in download, si ferma.", "Togli");
    if (!yes) return;
    item.removed = true;
    if (item.controller) {
      try { item.controller.abort(); } catch (e) { /* noop */ }
    }
    const idx = importList.indexOf(item);
    if (idx >= 0) importList.splice(idx, 1);
    if (item.el && item.el.row) item.el.row.remove();
  }

  /* Crea un tasto nella lista del brano.
     Sta FUORI da paintImport perche' serve anche ad altre funzioni
     (aggiungiPonte): dentro, non era visibile e crashava con
     "btn is not defined", bloccando ogni brano. */
  function nuovoBottone(azioni, testo, fn, classe, titolo, disabilitato) {
    const b = document.createElement("button");
    b.className = "btn-mini" + (classe ? " " + classe : "");
    b.textContent = testo;
    b.disabled = !!disabilitato;
    if (titolo) b.title = titolo;
    if (fn) b.addEventListener("click", fn);
    azioni.appendChild(b);
    return b;
  }

  /* Un gruppo di tasti con scritto sopra cosa serve. I tasti erano tutti
     sciolti nella stessa riga e non si capiva piu' niente. */
  function nuovoGruppo(el, etichetta) {
    const g = document.createElement("div");
    g.className = "imp-gruppo-azioni";
    if (etichetta) {
      const t = document.createElement("span");
      t.className = "imp-gruppo-etichetta";
      t.textContent = etichetta;
      g.appendChild(t);
    }
    el.actions.appendChild(g);
    return g;
  }

  function paintImport(item) {
      const el = item.el;
      if (!el) return;
      /* Brano gia' presente in libreria: lo dico subito nella riga, cosi'
         anche senza guardare l'avviso in fondo si capisce perche' non e'
         stato aggiunto. */
      if (item.duplicato) {
        el.tags.innerHTML = "";
        el.actions.innerHTML = "";
        const s = document.createElement("span");
        s.className = "imp-tag dup";
        s.textContent = "Gia' nella libreria";
        el.tags.appendChild(s);
        if (el.bytes) el.bytes.textContent = "Non l'ho aggiunto due volte";
        if (el.fill) { el.fill.style.width = "100%"; el.fill.classList.add("ok"); }
        return;
      }
      el.tags.innerHTML = "";
    el.actions.innerHTML = "";
    el.url = null;
    el.go = null;
    el.guida = false;   // la guida si puo' riedisegnare al prossimo paintImport
    el.ponte = null;    // idem per il controllo del ponte sul PC
    el.ytUrl = null;
    el.ytGo = null;
    // da qui in poi i tasti finiscono nel gruppo indicato: cosi' restano
    // separati per invece di finire tutti sciolti nella stessa riga
    let gruppo = nuovoGruppo(el, "");
    const tag = (text, cls) => {
      const s = document.createElement("span");
      s.className = "imp-tag" + (cls ? " " + cls : "");
      s.textContent = text;
      el.tags.appendChild(s);
    };
    const btn = (text, fn, disabled) => nuovoBottone(gruppo, text, fn, "", "", disabled);

    if (item.state === "dupe") {
      tag("già nella libreria", "dup");
    } else if (item.state === "missing") {
      tag(item.tagMancato || "non disponibile", "miss");
      if (item.tagMancato) {
        // la ricerca e' andata in timeout: rifacila toccando qui
        btn("Riprova", () => {
          item.state = "searching";
          item.tagMancato = "";
          paintImport(item);
          cercaItemSingolo(item);
        });
      }
    } else if (item.state === "done") {
      tag("importato", "ok");
      if (item.savedId) btn("Riproduci", () => playById(item.savedId));
    } else if (item.state === "searching") {
      tag("cerco...", "");
    } else if (item.state === "downloading") {
      tag("scarico", "");
    } else if (item.state === "error") {
      tag("errore", "miss");
      if (el.prog) el.prog.hidden = false;
    } else if (item.state === "choose") {
      tag("scegli quella giusta", "");
    } else if (item.state === "found") {
      tag(item.tagTrovato || "trovato", "ok");
      // Prima di importare: ascoltalo, se c'e' qualcosa da sentire.
      const bInfo = bottoneAnteprima(item.meta);
      if (bInfo.src) {
        const nota = notaAnteprima(item.meta);
        const b = btn(bInfo.etichetta, () => {
          const b2 = bottoneAnteprima(item.meta);
          ascoltaPrima({ src: b2.src, etichetta: b2.etichetta, el: b }, (err) => {
            if (err) toast("Anteprima non disponibile per questo brano.");
          });
        });
        b.title = nota || "Ascolta prima di importare";
        if (nota) {
          // solo 30 secondi: dice il perche' e i passi da seguire
          const sp = document.createElement("span");
          sp.className = "imp-nota-anteprima";
          sp.textContent = nota;
          el.actions.appendChild(sp);
          elGuide(item);
        }
      }
      btn("Importa", () => {
        fermaAnteprima();
        item.state = "ready";
        importItem(item);
      });
    } else if (item.state === "ready") {
      tag("trovato", "ok");
      // anche quando ha trovato subito il brano completo: ascoltalo prima
      const bInfoR = bottoneAnteprima(item.meta);
      if (bInfoR.src) {
        const bR = btn(bInfoR.etichetta, () => {
          const b2 = bottoneAnteprima(item.meta);
          ascoltaPrima({ src: b2.src, etichetta: b2.etichetta, el: bR }, (err) => {
            if (err) toast("Anteprima non disponibile per questo brano.");
          });
        });
        bR.title = notaAnteprima(item.meta) || "Ascolta prima di importare";
      }
    }

    if (item.state === "choose" && item.candidates.length) {
      for (const cand of item.candidates) {
        // ogni versione si puo' ascoltare prima di sceglierla
        const bInfo = bottoneAnteprima(cand);
        if (bInfo.src) {
          const b = btn("▶ " + bInfo.etichetta, () => {
            const b2 = bottoneAnteprima(cand);
            ascoltaPrima({ src: b2.src, etichetta: "▶ " + b2.etichetta, el: b }, (err) => {
              if (err) toast("Anteprima non disponibile per questa versione.");
            });
          });
          b.title = notaAnteprima(cand) || "Ascolta prima di scegliere";
        }
        const nota = notaAnteprima(cand);
        btn((cand.title + (cand.artist ? " — " + cand.artist : "") + (cand.album ? " [" + cand.album + "]" : "")), () => {
          fermaAnteprima();
          item.meta = cand;
          item.state = "ready";
          paintImport(item);
          importItem(item);
        });
        if (nota) {
          // anche fra le versioni alternative: solo anteprima = yt + convertitore
          const yt = linkYouTube(cand.artist, cand.title, item.secs);
          if (yt) el.actions.appendChild(yt);
          el.actions.appendChild(linkConvertitore());
          const sp = document.createElement("span");
          sp.className = "imp-nota-anteprima";
          sp.textContent = nota;
          el.actions.appendChild(sp);
        }
      }
      // qui il tasto che scarica da solo col PC mancava: senza, chi ha piu'
      // versioni non trovava mai la strada automatica
      if (item.candidates.some((c) => notaAnteprima(c))) {
        el.actions.appendChild(guidaPassi([
          "se ti serve tutta la canzone: sul PC tocca il tasto verde e incolla il link di YouTube"
        ]));
        aggiungiPonte(item);
      }
    }

    if (item.meta && item.state !== "done" && item.state !== "choose") {
      if (item.candidates && item.candidates.length > 1) {
        btn(el.showAlts ? "Meno versioni" : "Altre versioni (" + item.candidates.length + ")", () => {
          el.showAlts = !el.showAlts;
          paintImport(item);
        });
      }
      btn("Scarica da link", () => toggleUrlInput(item));
      btn("Importa file", () => scegliFilePer(item));
      if (el.showAlts && item.candidates.length > 1) {
        for (const cand of item.candidates) {
          if (cand === item.meta) continue;
          btn("Prova: " + cand.title, () => {
            item.meta = cand;
            item.state = "ready";
            paintImport(item);
            importItem(item);
          });
        }
      }
    }

    /* Link e tasti per trovare il brano: valgono per OGNI stato, non solo per
       le anteprime. Prima "yt" e "noTube" comparivano solo quando c'era
       l'anteprima di 30s, e sui brani "non disponibile" mancavano proprio i
       link che servono di piu'.
       Stanno in fondo, in gruppi separati: cosi' la riga si legge a blocchi. */
    if (item.state !== "downloading" && item.state !== "done" && item.state !== "searching") {
      const web = nuovoGruppo(el, "Cercalo su internet");
      const nomeBrano = (item.meta && item.meta.title) || item.title;
      const nomeArtista = (item.meta && item.meta.artist) || item.artist;
      const yt = linkYouTube(nomeArtista, nomeBrano, item.secs);
      if (yt) web.appendChild(yt);
      web.appendChild(linkConvertitore());
      aggiungiPonte(item);
    }
  }

  /* Ordine di priorita' nella lista delle canzoni trovate: prima quelle con
     il brano COMPLETO (pronti da importare), poi le altre, e in fondo quelle
     che hanno solo l'anteprima di 30 secondi. I gruppi ("Canzoni di ...")
     restano attaccati: non si mescola un gruppo con gli altri. */
  function prioritaImport(x) {
    const solo30 = !!(x.meta && x.meta.license === "solo 30 secondi");
    if (x.state === "ready") return 0;            // brano completo
    if (x.state === "done") return 1;
    if (solo30) return 9;                          // solo anteprima: in fondo
    if (x.state === "found") return 0;            // trovato completo
    if (x.state === "choose") return 2;
    return 3;
  }
  function ordinaImport(lista) {
    // blocchi: un brano sciolto, oppure un gruppo intero di canzoni
    const blocchi = [];
    let attuale = null;
    for (const x of lista) {
      if (x.gruppo) {
        if (!attuale || attuale.gruppo !== x.gruppo) {
          attuale = { gruppo: x.gruppo, voci: [] };
          blocchi.push(attuale);
        }
        attuale.voci.push(x);
      } else {
        attuale = null;
        blocchi.push({ gruppo: "", voci: [x] });
      }
    }
    for (const b of blocchi) {
      b.voci.forEach((v, i) => { v._ord = i; });
      b.voci.sort((a, c) => (prioritaImport(a) - prioritaImport(c)) || (a._ord - c._ord));
      // il blocco vale quanto il suo brano migliore
      b.prio = Math.min.apply(null, b.voci.map(prioritaImport));
    }
    const ordine = blocchi.map((b, i) => ({ b: b, i: i }));
    ordine.sort((a, c) => (a.b.prio - c.b.prio) || (a.i - c.i));
    const fuori = [];
    for (const o of ordine) for (const v of o.b.voci) fuori.push(v);
    return fuori;
  }

  function renderImports() {
    const box = $("importResults");
    box.innerHTML = "";
    $("importStep3").hidden = false;
    // mentre cerca non riordino niente, se no' le righe saltano sotto gli occhi
    const inCorso = importList.some((x) => x.state === "searching" || x.state === "downloading");
    const daMostrare = inCorso ? importList.slice() : ordinaImport(importList);
    let gruppoCorrente = null;
    for (const item of daMostrare) {
      if (item.gruppo && item.gruppo !== gruppoCorrente) {
        gruppoCorrente = item.gruppo;
        const testata = document.createElement("div");
        testata.className = "imp-gruppo";
        const nome = document.createElement("span");
        nome.className = "imp-gruppo-nome";
        nome.textContent = gruppoCorrente;
        testata.appendChild(nome);
        const tutte = document.createElement("button");
        tutte.className = "btn-mini";
        const conta = () => importList.filter((x) => x.gruppo === gruppoCorrente && x.state === "found").length;
        const aggiornaTutte = () => {
          tutte.textContent = conta() ? "Importa tutte (" + conta() + ")" : "Niente da importare";
          tutte.disabled = !conta();
        };
        aggiornaTutte();
        tutte.addEventListener("click", async () => {
          for (const x of importList) {
            if (x.gruppo !== gruppoCorrente || x.state !== "found") continue;
            x.state = "ready";
            paintImport(x);
          }
          aggiornaTutte();
          await autoImportAll();
          aggiornaTutte();
        });
        testata.appendChild(tutte);
        box.appendChild(testata);
      }
      const row = document.createElement("div");
      row.className = "imp";

      const cover = document.createElement("img");
      cover.className = "imp-cover";
      cover.alt = "";
      cover.src = (item.meta && item.meta.cover) || item.copertina || TRANSPARENT_PIXEL;

      const main = document.createElement("div");
      main.className = "imp-main";

      const title = document.createElement("p");
      title.className = "imp-title";
      title.textContent = item.title + (item.artist ? " — " + item.artist : "");
      main.appendChild(title);

      const sub = document.createElement("p");
      sub.className = "imp-sub";
      const bits = [];
      const album = (item.meta && item.meta.album) || item.album;
      if (album) bits.push(album);
      if (item.secs) bits.push(fmtTime(item.secs));
      if (item.meta && item.meta.source) bits.push(item.meta.source);
      if (item.meta && item.meta.license) bits.push(item.meta.license);
      sub.textContent = bits.join(" · ");
      main.appendChild(sub);

      const tags = document.createElement("p");
      tags.className = "imp-tags";
      main.appendChild(tags);

      const actions = document.createElement("div");
      actions.className = "imp-actions";
      main.appendChild(actions);

      const prog = document.createElement("div");
      prog.className = "imp-progress";
      prog.hidden = true;
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("span");
      fill.className = "bar-fill";
      bar.appendChild(fill);
      const bytes = document.createElement("span");
      bytes.className = "imp-bytes";
      prog.appendChild(bar);
      prog.appendChild(bytes);
      main.appendChild(prog);

      row.appendChild(cover);
      row.appendChild(main);

      const rem = document.createElement("button");
      rem.className = "imp-remove";
      rem.setAttribute("aria-label", "Togli dalla lista");
      rem.textContent = "×";
      rem.addEventListener("click", () => removeImportItem(item));
      row.appendChild(rem);

      box.appendChild(row);

      item.el = { row, tags, actions, prog, fill, bytes, url: null, go: null, showAlts: false };
      paintImport(item);
    }
  }

  const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  let searching = false;

  async function runSearch() {
    $("importTarget").textContent = "Sta scaricando nella libreria di " + profile + ".";
    if (searching) return;
    collectKnownArtists();
    const parsed = parseImportText($("importText").value);
    if (!parsed.length) {
      toast("Non riconosco nessun brano: controlla il testo");
      return;
    }
    searching = true;
    $("btnFind").disabled = true;
    libKeys = libraryKeys();
    importList = [];
    const daCercare = [];
    const gruppi = [];
    // Righe tipo "Post Malone": sembrano un titolo, ma se iTunes conferma
    // che sono un artista le trattiamo come "tutte le canzoni di quell'artista".
    // Controllo 4 righe alla volta: prima facevo una richiesta per riga.
    const daControllare = parsed.filter((p) => {
      if (p.artistOnly || p.artist) return false;
      const forzato = /^artista\s*:/i.test(String(p.title || "").trim());
      return forzato || /\s/.test(p.title || "");
    });
    for (let i = 0; i < daControllare.length; i += 4) {
      const lotto = daControllare.slice(i, i + 4);
      await Promise.allSettled(lotto.map(async (p) => {
        let nome = "";
        try {
          nome = await conScadenza(iTunesQuestoEArtista(p.title), 12000, "scaduto");
        } catch (e) { nome = ""; }
        if (nome) {
          p.artistOnly = true;
          p.title = nome;
        }
      }));
    }
    for (const p of parsed) {
      if (p.artistOnly) {
        const segnaposto = {
          gruppo: "Canzoni di " + p.title,
          title: p.title,
          artist: "",
          state: "searching",
          meta: null,
          candidates: []
        };
        importList.push(segnaposto);
        gruppi.push({ nome: p.title, segnaposto });
      } else {
        const item = { title: p.title, artist: p.artist, state: "searching", meta: null, candidates: [] };
        importList.push(item);
        daCercare.push(item);
      }
    }
    renderImports();

    const bar = $("searchBar");
    const fill = $("searchFill");
    const status = $("searchStatus");
    bar.hidden = false;
    status.hidden = false;
    fill.style.width = "0%";

    let fatti = 0;
    let sconosciuti = 0;
    const avanta = (testo) => {
      fatti++;
      status.textContent = testo;
      const totale = daCercare.length + gruppi.length;
      fill.style.width = (totale ? Math.min(100, Math.round((fatti / totale) * 100)) : 100) + "%";
    };

    for (const g of gruppi) {
      avanta("Cerco le canzoni di " + g.nome + "...");
      let trovate = [];
      try {
        trovate = await itunesArtistTracks(g.nome);
      } catch (e) {
        trovate = [];
      }
      if (!trovate.length) {
        // di quell'artista non c'e' niente: lo lascio scritto come artista
        // e basta. Prima lo trasformavo in un titolo di brano, e finivo
        // per proporre una canzone qualsiasi che non c'entra niente.
        const segnaposto = importList.indexOf(g.segnaposto);
        if (segnaposto >= 0) importList.splice(segnaposto, 1);
        const item = {
          gruppo: "",
          title: g.nome,
          artist: "",
          state: "missing",
          tagMancato: "nessun brano di quest'artista",
          meta: null,
          candidates: []
        };
        importList.push(item);
        renderImports();
        continue;
      }
      const gruppo = "Canzoni di " + g.nome + " (" + trovate.length + ")";
      const nuovi = [];
      for (const s of trovate) {
        if (importList.length + nuovi.length >= IMPORT_LIMIT) break;
        const item = {
          gruppo,
          title: s.title,
          artist: s.artist,
          album: s.album,
          secs: s.secs,
          copertina: s.cover,
          anteprima: s.preview ? previewCandidate(s) : null,
          state: "searching",
          meta: null,
          candidates: []
        };
        nuovi.push(item);
        daCercare.push(item);
      }
      const idx = importList.indexOf(g.segnaposto);
      if (idx >= 0) importList.splice(idx, 1, ...nuovi);
      else importList.push(...nuovi);
      renderImports();
    }

    /* Prima cercavo un brano alla volta: con un artista da 30 canzoni si
       poteva stare "cerco..." per minuti. Adesso ne cerco 5 in contemporanea.
       Ogni brano e' protetto da try/catch e uso allSettled: se uno solo
       fallisce, gli altri devono continuare lo stesso. */
    const QUANTI_INSIEME = 5;
    const rimasti = daCercare.filter((x) => !x.removed);
    for (let i = 0; i < rimasti.length; i += QUANTI_INSIEME) {
      const lotto = rimasti.slice(i, i + QUANTI_INSIEME);
      avanta("Cerco " + Math.min(i + 1, rimasti.length) + "-" + Math.min(i + lotto.length, rimasti.length) +
        "/" + rimasti.length + "...");
      await Promise.allSettled(lotto.map(async (item) => {
        try {
          if (item.removed) return;
          /* senza artista scritto: 2-6 parole, e non piu' di 15 righe cosi' per
             batch, altrimenti la ricerca si allunga troppo */
          if (!item.artist && !item.anteprima && item.title &&
              item.title.indexOf(" ") > 0 && item.title.split(/\s+/).length <= 6 && sconosciuti < 15) {
            sconosciuti++;
            try {
              const indovinato = await conScadenza(itunesGuess(item.title), 12000, "scaduto");
              if (indovinato && indovinato.artist) {
                item.artist = indovinato.artist;
                if (titleMatch(item.title, indovinato.title).score < 90) item.title = indovinato.title;
                if (!item.album) item.album = indovinato.album;
                if (!item.copertina) item.copertina = indovinato.cover;
                if (!item.secs) item.secs = indovinato.secs;
                if (!item.anteprima) item.anteprima = previewCandidate(indovinato);
              }
            } catch (e) { /* nessun artista: vado avanti col titolo cosi' com'e' */ }
          }
          let dup = false;
          for (const k of trackKeys(item)) if (libKeys.has(k)) dup = true;
          if (dup) {
            item.state = "dupe";
            paintImport(item);
          } else {
            await cercaItemSingolo(item);
          }
        } catch (e) {
          // un brano che va in errore non deve bloccare gli altri: lo metto
          // "non disponibile" cosi' non resta fermo su "cerco..."
          item.state = "missing";
          item.tagMancato = "non riesco a cercarlo";
          try { paintImport(item); } catch (e2) { /* se anche questo fallisce, pazienza */ }
          // e lo scrivo nel registro del PC, cosi' gli errori si possono
          // leggere davvero invece di sparire
          segnalaErrore("ricerca fallita su \"" + (item.title || "?") + "\": " +
            ((e && (e.message || e)) || "errore sconosciuto"));
        }
      }));
      await new Promise((r) => setTimeout(r, 80));
    }

    /* Rete di sicurezza: se per qualunque motivo qualche brano e' rimasto
       su "cerco...", lo chiudo qui. Cosi' la lista non mostra mai righe
       ferme, e l'utente puo' riprovare con il tasto Riprova. */
    for (const it of importList) {
      if (it.state === "searching" && !it.removed) {
        it.state = "missing";
        it.tagMancato = "ricerca interrotta";
        try { paintImport(it); } catch (e) { /* noop */ }
      }
    }

    const auto = importList.filter((x) => x.state === "ready").length;
    if (auto) status.textContent = "Scarico " + auto + " brani trovati...";
    await autoImportAll();

    const done = importList.filter((x) => x.state === "done").length;
    const dupes = importList.filter((x) => x.state === "dupe").length;
    const miss = importList.filter((x) => x.state === "missing").length;
    const choose = importList.filter((x) => x.state === "choose").length;
    const errs = importList.filter((x) => x.state === "error").length;
    const daImportare = importList.filter((x) => x.state === "found").length;
    status.textContent = "Importati " + done + " · da scegliere " + choose + " · già presenti " + dupes +
      " · non disponibili " + miss + (errs ? " · errori " + errs : "") +
      (daImportare ? " · " + daImportare + " canzoni pronte da importare" : "");
    searching = false;
    $("btnFind").disabled = false;
  }

  async function doOcr(file) {
    const bar = $("ocrBar");
    const fill = $("ocrFill");
    const status = $("ocrStatus");
    bar.hidden = false;
    status.hidden = false;
    fill.classList.remove("err");
    fill.style.width = "0%";
    status.textContent = "Preparo il riconoscimento...";
    $("btnOcr").disabled = true;
    try {
      status.textContent = "Preparo l'immagine...";
      const prepared = await preprocessImage(file);
      status.textContent = "Leggo lo screenshot...";
      const text = await runOcr(prepared, (label, p) => {
        fill.style.width = Math.round(p * 100) + "%";
        status.textContent = label + " " + Math.round(p * 100) + "%";
      });
      $("importText").value = text.trim();
      const n = parseImportText(text).length;
      status.textContent = n
        ? "Riconosciute " + n + " righe: correggi quelle sbagliate, poi cerca."
        : "Non ho capito il testo: scrivi i brani a mano qui sotto.";
    } catch (e) {
      status.textContent = "OCR non disponibile (" + e.message + "): puoi scrivere i titoli a mano.";
    }
    $("btnOcr").disabled = false;
  }

  function openImport() {
    $("importTarget").textContent = "Sta scaricando nella libreria di " + profile + ".";
    $("importPanel").hidden = false;
    document.body.classList.add("no-scroll");
  }

function closeImport() {
    fermaAnteprima();                 // l'anteprima non continua a suonare a schermo chiuso
    $("importPanel").hidden = true;
    document.body.classList.remove("no-scroll");
}

  /* ---------- Toast ---------- */
  let toastTimer = null;
/* Ste: "dice fatto ma non spunta nella libreria". Il messaggio diceva solo
   "scaricato" e poi bisognava cercare il brano a mano: in una libreria di
   duecento pezzi, in ordine alfabetico, era una caccia. Adesso il messaggio
   dice DOVE e' finita ("in Diego, 34") e toccandolo ti porta dritto li',
   cambiando profilo se serve.

   Ricordo di oggi: brano scaricato, messaggio "fatto", e poi venti minuti
   a chiedersi dove fosse finito. */
function _portaAlBranoScaricato(meta) {
  try {
    const titolo = String((meta && meta.title) || "").trim();
    if (!titolo) { toast("Scaricato"); return; }
    let scelto = null;
    for (const t of tracks) {
      if (String(t.title || "").trim() === titolo) { scelto = t; break; }
    }
    if (!scelto) { toast(titolo + " scaricato"); return; }
    const diChi = scelto.profile || DEFAULT_PROFILE;
    const posto = tracks.filter((t) => (t.profile || DEFAULT_PROFILE) === diChi)
      .findIndex((t) => t.id === scelto.id) + 1;
    const el = $("toast");
    if (!el) { toast(titolo + " scaricato"); return; }
    el.textContent = titolo + " \u2014 in " + diChi + ", numero " + posto + ". Tocca per andare";
    el.classList.add("show");
    el.classList.add("toccabile");
    el.onclick = () => {
      el.classList.remove("show");
      el.classList.remove("toccabile");
      /* se il brano e' di un altro profilo, ci vado: qui non si vedrebbe */
      try {
        if (diChi !== profile && typeof switchProfile === "function") switchProfile(diChi);
      } catch (e) { /* noop */ }
      try { playById(scelto.id, false); } catch (e) { /* noop */ }
      try {
        const riga = playlistEl && playlistEl.querySelector('[data-id="' + scelto.id + '"]');
        if (riga && riga.scrollIntoView) riga.scrollIntoView({ block: "center" });
      } catch (e) { /* noop */ }
    };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("show");
      el.classList.remove("toccabile");
    }, 9000);
  } catch (e) { /* se non riesco non cambio niente */ }
}

/* Ste: "sia quando apro 192.168.1.40:8788/app/ e sia quando apro l'altro di
   github, non spunta 'qui puoi solo ascoltare'".

   L'avevo messo per capire da quale link si puo' scaricare, ma faceva due
   danni:
     - diceva il falso, perche' restava fermo dopo il primo controllo: se
       quel controllo falliva una volta la scritta non veniva piu'
       aggiornata, e cosi' diceva "solo ascoltare" anche col computer
       collegato e funzionante;
     - era una frase che spaventava senza motivo.

   Adesso non compare piu' niente. Se serve sapere se il computer risponde,
   me lo dice il canale delle tracce, non uno sbarrone a schermo. */
function _mostraAvvisoCollegamento(ok, base) {
  try {
    const el = $("avvisoCollegamento");
    if (el) { el.hidden = true; el.textContent = ""; el.innerHTML = ""; }
  } catch (e) { /* noop */ }
}
function toast(msg, durata) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  /* Ste: i messaggi lunghi si devono poter chiudere subito toccandoli,
     altrimenti restano li' a coprire la libreria. */
  el.classList.add("toccabile");
  el.onclick = () => { el.classList.remove("show"); el.classList.remove("toccabile"); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    el.classList.remove("toccabile");
  }, durata || 2200);
}

  /* ---------- Il menu "altro" ----------
     In alto c'erano dieci tasti in fila: sul telefono si doveva scorrere in
     lato per vederli, e non si capiva piu' niente. Adesso restano solo
     statistiche, profilo e questo menu; tutto il resto sta dentro. */
  function _chiudiAltro() {
    const m = $("menuAltro");
    if (m) m.hidden = true;
    /* Anche la guida si chiude insieme al menu: se no resterebbe aperta
       sopra tutto quando torni a un'altra schermata dal menu. */
    try { _chiudiAiuto(); } catch (e) { /* non c'e' ancora: va bene */ }
    const v = document.getElementById("menu-altro-velo");
    if (v && v.parentNode) v.parentNode.removeChild(v);
    const b = $("btnAltro");
    if (b) {
      b.setAttribute("aria-expanded", "false");
      b.classList.remove("on");
    }
  }
  function _apriAltro() {
    const m = $("menuAltro");
    if (!m) return;
    m.hidden = false;
    let v = document.getElementById("menu-altro-velo");
    if (!v) {
      v = document.createElement("div");
      v.id = "menu-altro-velo";
      v.className = "menu-altro-velo";
      document.body.appendChild(v);
      v.addEventListener("click", _chiudiAltro);
    }
    const b = $("btnAltro");
    if (b) { b.setAttribute("aria-expanded", "true"); b.classList.add("on"); }
  }
  /* Toccando una voce del menu il menu si chiude: altrimenti resta aperto
     sopra la pagina e sembra rotto. */
  document.addEventListener("click", (e) => {
    const m = $("menuAltro");
    if (!m || m.hidden) return;
    if (m.contains(e.target)) {
      if (e.target.closest && e.target.closest("button")) _chiudiAltro();
    }
  });

  document.addEventListener("keydown", (e) => {
    const m = $("menuAltro");
    if (!m || m.hidden) return;
    if (e.key === "Escape" || e.key === "Esc") _chiudiAltro();
  });
  window.addEventListener("resize", () => { _chiudiAltro(); });

  /* ---------- Eventi UI ---------- */
  $("btnPlay").addEventListener("click", togglePlay);
  $("btnNext").addEventListener("click", () => playNext());
$("btnPrev").addEventListener("click", () => {
      /* Ste: "il tasto indietro col casuale mi porta ad un'altra canzone".
         Prima c'era la regola dei primi 3 secondi: se la canzone era gia'
         partita, il tasto non tornava indietro ma ricominciava la stessa, e
         cosi' sembrava non funzionare. Adesso "indietro" va SEMPRE alla
         canzone di prima (e se e' la prima di tutte, torna alla prima
         dell'elenco). Per riascoltare da capo una canzone basta tornare indietro
         nella barra, col dito. */
      playById(idBranoA(prevIndex()));
    });

  /* Pulsante "Riproduzione casuale", nel menu "Altro".

   Ste lo chiede cosi': se lo premo dalla libreria, le canzoni NON seguono
   l'ordine in cui sono messe ma suonano a caso; e NON si infilano in mezzo
   le canzoni delle playlist. Viceversa, se lo premo dentro una playlist,
   suonano a caso solo le canzoni di quella playlist.

   Il resto lo fa gia' nextIndex(), che mescola la lista "per suono": dentro
   la libreria quella lista e' la libreria, dentro una playlist e' la playlist. */

function _accendiCasuale(accendi) {
  shuffle = Boolean(accendi);
  /* Giro nuovo: se riaccendo il casuale non devo ricordarmi le canzoni
     dell'ultima volta. */
  _azzeraCasuale();
  LS.set("mb.shuffle", shuffle);
  try { $("btnShuffle").classList.toggle("on", shuffle); } catch (e) { /* noop */ }
  try { const b = $("btnCasuale"); if (b) b.classList.toggle("on", shuffle); } catch (e) { /* noop */ }
  return shuffle;
}

function _toggleCasuale() {
  const acceso = _accendiCasuale(!shuffle);
  if (!acceso) {
    toast("Torni in ordine: le canzoni si susseguono come sono nella lista");
    return;
  }
  /* Appena acceso, salto subito a una canzone a caso: cosi' si sente subito
     che non sta andando piu' in ordine. */
  const lista = _listaPerIlSeguito();
  if (lista.length > 1) {
    const id = lista[Math.floor(Math.random() * lista.length)].id;
    if (id && id !== currentId) playById(id);
  }
  if (_playlistAttiva) {
    toast('Casuale: suonano solo le canzoni di "' + _playlistAttiva + '", in ordine sparso');
  } else {
    toast("Casuale: suonano solo le canzoni della libreria, in ordine sparso");
  }
}

$("btnCasuale").addEventListener("click", () => { _chiudiAltro(); _toggleCasuale(); });

/* Ste: "non ho capito ma cos'e'? e la riproduzione casuale non e' la stessa
     cosa?". Sono la STESSA cosa, e prima c'erano due tasti che la accendevano
     senza dirlo: quello del menu e quello nella barra del player. Il tasto
     della barra non mostrava nessun avviso, quindi toccandolo non si capiva
     niente. Adesso usa la stessa funzione del menu, che accende il tasto e
     scrive a schermo cosa sta succedendo. */
  $("btnShuffle").addEventListener("click", () => {
    _toggleCasuale();
  });
  $("btnQueue").addEventListener("click", openQueue);
  $("queueClose").addEventListener("click", closeQueue);
  $("queuePanel").addEventListener("click", (e) => {
    if (e.target === $("queuePanel")) closeQueue();
  });
  $("btnRepeat").addEventListener("click", () => {
    repeat = !repeat;
    LS.set("mb.repeat", repeat);
    $("btnRepeat").classList.toggle("on", repeat);
  });

  $("btnLyrics").addEventListener("click", openLyrics);
  /* I tre comandi dentro i testi a tutto schermo: riusano le funzioni vere
     del player, cosi' non possono andare discordi con quelli del basso. */
  $("lyricsPlay").addEventListener("click", () => { togglePlay(); _aggiornaComandiTesti(); });
  $("lyricsNext").addEventListener("click", () => { playNext(); });
  $("lyricsPrev").addEventListener("click", () => {
    /* Come il tasto "indietro" del player: ora va SEMPRE al brano precedente,
       senza la regola dei primi 3 secondi che sembrava un tasto rotto. */
    playById(idBranoA(prevIndex()));
  });
  /* Ste: "se premo nel testo della canzone si vede in quel modo", guardando
     un'altra app dove la pagina dei testi si apre toccando il titolo. Qui si
     poteva aprire solo con il bottone piccolo, e molti non lo vedono proprio.
     Ora toccare il titolo (o l'artista) apre i testi a tutto schermo. */
  try {
    const info = document.querySelector(".hud-info");
    if (info) {
      info.classList.add("si-puoi-toccare");
      info.addEventListener("click", () => {
        /* Se non ci sono testi non apro niente: meglio non far credere che
           funzioni, e il bottone resta l'unico modo di accorgersene. */
        if (!currentLyrics()) { toast("Questa canzone non ha ancora i testi"); return; }
        if ($("lyricsPanel").hidden) openLyrics(); else closeLyrics();
      });
    }
  } catch (e) { /* noop */ }
  $("lyricsClose").addEventListener("click", closeLyrics);
  $("lyricsPanel").addEventListener("click", (e) => {
    if (e.target === $("lyricsPanel")) closeLyrics();
  });
  $("lyricsBody").addEventListener("pointerdown", () => {
    lyricsUserScrollAt = Date.now();
  });
  $("lyricsBody").addEventListener("wheel", () => {
    lyricsUserScrollAt = Date.now();
  });
  $("quickPanel").addEventListener("click", (e) => {
    if (e.target === $("quickPanel")) closeQuick();
  });

  const progressBar = $("playerProgress");
  function ratioFromX(clientX) {
    const rect = progressBar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }
  function scrubTo(clientX) {
    if (!audio || !isFinite(audio.duration)) return;
    const r = ratioFromX(clientX);
    const t = r * audio.duration;
    const fill = progressBar.querySelector(".fill");
    if (fill) fill.style.width = r * 100 + "%";
    progressBar.querySelector(".knob").style.left = r * 100 + "%";
    $("curTime").textContent = fmtTime(t);
    pendingSeek = t;
  }
  function endScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    progressBar.classList.remove("scrubbing");
    if (pendingSeek != null && audio) audio.currentTime = pendingSeek;
    pendingSeek = null;
    savePos();
  }
  progressBar.addEventListener("pointerdown", (e) => {
    if (!audio || !isFinite(audio.duration)) return;
    scrubbing = true;
    progressBar.classList.add("scrubbing");
    try { progressBar.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    scrubTo(e.clientX);
    e.preventDefault();
  });
  progressBar.addEventListener("pointermove", (e) => {
    if (scrubbing) scrubTo(e.clientX);
  });
  progressBar.addEventListener("pointerup", endScrub);
  progressBar.addEventListener("pointercancel", endScrub);

  $("btnSeekBack").addEventListener("click", () => seekBy(-15));
  $("btnSeekFor").addEventListener("click", () => seekBy(15));

$("btnFavFilter").addEventListener("click", () => {
    favOnly = !favOnly;
    $("btnFavFilter").classList.toggle("on", favOnly);
    render();
    });
  $("btnMaiAscoltati").addEventListener("click", () => {
    soloMaiAscoltati = !soloMaiAscoltati;
    $("btnMaiAscoltati").classList.toggle("on", soloMaiAscoltati);
    render();
    });
  /* Ste: "aggiungi anche un filtro 'canzoni scaricate'". */
  $("btnScaricate").addEventListener("click", () => {
    soloScaricate = !soloScaricate;
    $("btnScaricate").classList.toggle("on", soloScaricate);
    _diChe("filtro canzoni scaricate: " + (soloScaricate ? "si" : "no"));
    render();
    });
  $("btnFalliti").addEventListener("click", () => _stampaFalliti());
  /* Il bottone "Canzoni con lo stesso nome" e il suo pannello. */
  $("btnSimili").addEventListener("click", () => { _chiudiAltro(); _stampaSimili(); });
  $("similiClose").addEventListener("click", _chiudiPannelloSimili);
  $("similiPanel").addEventListener("click", (e) => {
    if (e.target === $("similiPanel")) _chiudiPannelloSimili();
  });
  $("fallitiClose").addEventListener("click", _chiudiPannelloFalliti);

  /* Ste: "togli completamente sta cosa dei nascosti". Il pannello dei brani
     tolti dalla lista non esiste piu', e con lui i pulsanti "Rimetti in
     lista". Ora l'unico modo per togliere un brano e' Elimina, che chiede
     conferma e lo cancella per sempre. */

  $("fallitiPanel").addEventListener("click", (e) => {
    if (e.target === $("fallitiPanel")) _chiudiPannelloFalliti();
  });
  $("fallitiCorpo").addEventListener("click", async (e) => {
    const t = e.target;
    if (!t) return;
    if (t.id === "btnRiprovaTutti") { _riprovaTutti(); return; }
    if (t.id === "btnDimenticaFalliti") {
      _salvaFalliti([]);
      _aggiornaBadgeFalliti();
      _stampaFalliti("Ho dimenticato la lista. Non riprovo piu' nulla.");
      return;
    }
    const riga = t.closest ? t.closest(".falliti-riga") : null;
    if (!riga) return;
    const url = decodeURIComponent(riga.getAttribute("data-url") || "");
    const voce = _falliti().find((x) => x.url === url);
    if (!voce) { _stampaFalliti(); return; }
    if (t.getAttribute("data-azione") === "togli") {
      _togliFallito(url);
      _stampaFalliti();
      return;
    }
    if (t.getAttribute("data-azione") === "riprova") {
      t.disabled = true;
      _stampaFalliti("Sto riprovando: " + (voce.titolo || voce.artista || "senza nome"));
      const ok = await _riprovaFallito(voce);
      _stampaFalliti(ok ? "Riuscito: " + (voce.titolo || voce.artista) : "Non ancora: riprova fra qualche minuto");
    }
  });

  $("btnImport").addEventListener("click", openImport);
  $("importClose").addEventListener("click", closeImport);
  $("importPanel").addEventListener("click", (e) => {
    if (e.target === $("importPanel")) closeImport();
  });
  $("btnPickImage").addEventListener("click", () => $("importImageInput").click());
  $("importImageInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const img = $("importPreview");
    img.src = URL.createObjectURL(file);
    img.hidden = false;
    const btn = $("btnOcr");
    btn.hidden = false;
    btn.onclick = () => doOcr(file);
  });
  $("btnFind").addEventListener("click", runSearch);
  $("importAudioInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const item = importActive;
    e.target.value = "";
    if (!file || !item) return;
    item.state = "downloading";
    paintImport(item);
    if (item.el) item.el.prog.hidden = false;
    try {
      const blob = await readFileWithProgress(file, (ratio, got) => {
        if (!item.el) return;
        item.el.fill.classList.remove("err");
        item.el.fill.style.width = Math.round(ratio * 100) + "%";
        item.el.bytes.textContent = fmtBytes(got);
      });
      item.meta = Object.assign({}, item.meta || {}, {
        title: item.title,
        artist: item.artist,
        album: item.album || "",
        license: (item.meta && item.meta.license) || "",
        source: "file locale"
      });
      await finishImport(item, blob, "file locale");
    } catch (err) {
      item.state = "error";
      if (item.el) item.el.bytes.textContent = err.message;
      paintImport(item);
    }
  });

  /* Ste: "se premo il tasto + non spunta importa musica". Prima questo tasto
   apriva direttamente i file, senza mostrare niente, quindi non si capiva
   cosa fosse e "Importa musica" si trovava solo nel menu in alto. Adesso il
   + apre le scelte, e "Importa musica" c'e' con quel nome. */
function _chiudiFabMenu() {
  const m = $("fabMenu");
  if (m) m.hidden = true;
  syncNoScroll();
}
function _apriFabMenu() {
  const m = $("fabMenu");
  if (!m) { fileInput.click(); return; }
  m.hidden = false;
  syncNoScroll();
}
$("fab").addEventListener("click", _apriFabMenu);
$("fabChiudi").addEventListener("click", _chiudiFabMenu);
$("fabImporta").addEventListener("click", () => {
  _chiudiFabMenu();
  fileInput.click();
});
$("fabCercaTitolo").addEventListener("click", () => {
  /* Lo dice lui: vuole scrivere il titolo e fare "cerca brani". Gli metto il
     cursore nella casella di ricerca con il telefono aperto per la tastiera. */
  _chiudiFabMenu();
  try {
    if (searchEl) {
      searchEl.focus();
      if (searchEl.scrollIntoView) searchEl.scrollIntoView({ block: "center" });
    }
  } catch (e) { /* noop */ }
  toast("Scrivi il titolo sopra e guarda i brani che trovi", 5000);
});
$("fabYouTube").addEventListener("click", () => {
  _chiudiFabMenu();
  try { _aggiungiDaYouTube(); } catch (e) { /* noop */ }
});
$("fabMenu").addEventListener("click", (e) => {
  if (e.target === $("fabMenu")) _chiudiFabMenu();
});
  /* Cambio ordinamento: il brano di un artista gia' presente finisce subito
     nel suo gruppo, senza dover rifare niente. */
  const btOrdina = $("btnOrdina");
  if (btOrdina) {
    btOrdina.addEventListener("click", () => {
      const i = ORDINAMENTI.findIndex((o) => o.id === ordinamento);
      const prossimo = ORDINAMENTI[(i + 1) % ORDINAMENTI.length];
      ordinamento = prossimo.id;
      LS.set("mb.ordine", ordinamento);
      segnalaErrore("ordine cambiato: " + prossimo.nome);
      render();
    });
    ordinamento = LS.get("mb.ordine", "artista");
  }
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = "";
  });

  /* Ste: "la barra di ricerca delle canzoni non funziona piu".
     Qui il testo veniva salvato ma la lista non veniva ridisegnata: scrivevo
     la parola cercata e non facevo accorgere niente a nessuno, quindi la
     ricerca sembrava morta. Mancava una sola riga: il ridisegno.
     Con un piccolo ritardo, altrimenti ridisegnerebbe a ogni lettera. */
  let _ricercaScaduta = null;
  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim();
      try { LS.set("mb.ricerca", query); } catch (e) { /* noop */ }
    try { if (_ricercaScaduta) clearTimeout(_ricercaScaduta); } catch (e) {}
    _ricercaScaduta = setTimeout(function () {
      _ricercaScaduta = null;
      try { render(); } catch (e) { /* noop */ }
    }, 160);
  });

  /* Ste: "una x tutto a sinistra che cancella quello che c'e' scritto e
     riporta alla libreria". */
  try {
    const sx = document.getElementById("searchX");
    if (sx && searchEl) {
      sx.addEventListener("click", () => {
        searchEl.value = "";
        query = "";
        try { LS.set("mb.ricerca", ""); } catch (e) { /* noop */ }
        try { if (_ricercaScaduta) { clearTimeout(_ricercaScaduta); _ricercaScaduta = null; } } catch (e) { }
        try { render(); } catch (e) { /* noop */ }
        /* chiudo la tastiera: si torna alla libreria */
        try { searchEl.blur(); } catch (e) { /* noop */ }
      });
    }
  } catch (e) { /* noop */ }

  /* Bottone diagnostica nel menu "Altro": serve a me, non agli utenti, ma lo
   metto lo stesso perche' e' l'unico modo di sapere dove finiscono i dati. */
  try {
    const bd = document.getElementById("btnDiagnostica");
    if (bd) bd.addEventListener("click", () => { _apriDiagnostica(); });
    const dc = document.getElementById("diagClose");
    if (dc) dc.addEventListener("click", () => { const o = document.getElementById("diagOverlay"); if (o) o.hidden = true; });
    const ov = document.getElementById("diagOverlay");
    if (ov) ov.addEventListener("click", (e) => { if (e.target === ov) ov.hidden = true; });
  } catch (e) { /* noop */ }
  /* Ste: "192.168.1.40:8788/app/ non mi spunta ancora se posso solo
     ascoltare". Il pulsante chiude anche i service worker: senza, il
     worker vecchio torna su al prossimo riavvio e siamo al punto di
     prima. Prima non c'era, ed e' per questo che l'app sembrava
     "incastrata" su una versione vecchia. */
  $("btnRefresh").addEventListener("click", async () => {
    toast("Aggiorno l'app, aspetta un secondo...");
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
      }
    } catch (e) { /* noop */ }
    try {
      if (swReg) await swReg.update();
    } catch (e) { /* noop */ }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* noop */ }
    setTimeout(() => window.location.reload(), 400);
  });

  let offlineBusy = false;
  let offlineAbort = null;

  /* Le canzoni offline stanno in una cache SEPARATA dai file dell'app.
     Motivo (Ste, 20/10/2026): "ho messo 2gb e quando diego toglie la
     connessione non gli si apre l'app". Se le canzoni e i file dell'app
     stanno nella stessa cache, quando il telefono libera spazio si porta
     via anche l'app, e allora non si apre piu' offline.
     Ora ogni profilo ha le sue cache separate: brani-<profilo> e stream-<profilo>. */
  const CACHE_PREFIX = "spotifynonavraiimieisoldi";
  function cacheBraniName(p) { return CACHE_PREFIX + "-brani-" + (p || profile); }
  function cacheStreamName(p) { return CACHE_PREFIX + "-stream-" + (p || profile); }
  function cachePrefetchName() { return CACHE_PREFIX + "-prefetch"; }
  function cacheInfoName() { return CACHE_PREFIX + "-info"; }

  async function appCache(p) {
    if (!("caches" in window)) return null;
    try {
      return await caches.open(cacheBraniName(p));
    } catch (e) {
      return null;
    }
  }

  async function streamCache(p) {
    if (!("caches" in window)) return null;
    try {
      return await caches.open(cacheStreamName(p));
    } catch (e) {
      return null;
    }
  }

  function renderOfflineRows(rows) {
    const box = $("offlineList");
    box.innerHTML = "";
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "off-row";
      const name = document.createElement("div");
      name.className = "off-name";
      name.textContent = r.title;
      const bar = document.createElement("div");
      bar.className = "off-bar";
      const fill = document.createElement("span");
      bar.appendChild(fill);
      const state = document.createElement("div");
      state.className = "off-state" + (r.state === "ok" ? " ok" : r.state === "run" ? " run" : r.state === "err" ? " err" : "");
      state.textContent = r.label;
      row.appendChild(name);
      row.appendChild(bar);
      row.appendChild(state);
      box.appendChild(row);
      r.el = { fill, state, bar };
    }
  }

  async function scanOffline() {
    const cache = await appCache();
    if (!cache) {
      $("offlineSub").textContent = "Non riesco a preparare le canzoni offline su questo browser";
      return [];
    }
    const rows = [];
  for (const t of tracks) {
    /* Ste: "diego aveva scaricato le canzoni ma non gliele faceva
       ascoltare senza connessione". Prima, per un brano che non era
       "builtin", scrivevo "sul telefono" e lo davo per gia' scaricato:
       ma non era mai stato scaricato, e senza rete non si sentiva niente.
       Ora guardo davvero in cache, per tutti i brani. */
    if (!t.url) {
      rows.push({ title: t.title, state: "ok", label: "non scaricabile", el: null, track: t });
      continue;
    }
    let cached = false;
    try { cached = !!(await cache.match(t.url)) || !!(await cache.match(absUrl(t.url))); } catch (e) { cached = false; }
    rows.push({
      title: t.title,
      state: cached ? "ok" : "todo",
      label: cached ? "pronta" : "da scaricare",
      el: null,
      track: t
    });
  }
    renderOfflineRows(rows);
    const mancanti = rows.filter((r) => r.state === "todo").length;
    $("offlineSub").textContent = mancanti
      ? mancanti + (mancanti === 1 ? " canzone da scaricare" : " canzoni da scaricare")
      : "Tutte le canzoni sono gia' pronte per offline";
    return rows;
  }

  /* Ste: "nelle canzoni nuove non mi fa skippare avanti: la canzone si sente e
   va avanti, ma non mi lascia spostarmi dentro, e dopo un po si sistema".
   Il motivo e' che quelle canzoni le sento in arrivo dalla rete: per spostare
   la barra dentro il brano aspetto il pezzo che deve arrivare, e si sente un
   ritardo.

   Con il worker adesso va gia' meglio quando il brano e' gia' scaricato. Ma
   le canzoni NUOVE non lo sono mai, quindi qui le scarico da sole mentre le
   ascolto: e' quello che fa la funzione "Scarica" che ho aggiunto, ma senza
   che tu debba toccare niente. Dalla seconda volta che la senti, lo
   spostamento e' immediato. */
  async function _scaricaDaSolaSeServe(brano) {
    try {
      if (!brano || !brano.url || !("caches" in window)) return;
      if (offlineBusy) return;
      /* Ste: "ma cosi' non occupa spazio nel telefono?". Si', e per questo
         adesso si puo' spegnere del tutto, e comunque non si passa oltre un
         tetto: ogni canzone e' circa 4-5 MB, e con il tetto sotto si ferma
         prima di riempire il telefono. I dati del telefono non li spendo
         quando sono sui dati mobili (se il browser lo sa dirlo). */
      if (LS.get("mb.scaricaDaSolo", "si") !== "si") return;
      const connessione = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const tipo = connessione && connessione.effectiveType ? connessione.type || connessione.effectiveType : "";
      const suiDati = /^(cellular|2g|3g|4g)$/i.test(String(tipo)) ||
        (connessione && connessione.saveData === true);
      if (suiDati) return;
      const cache = await appCache();
      if (!cache) return;
      const gia = await cache.match(brano.url);
      if (gia) return;
      /* Non supero il tetto di spazio. */
      const tetto = Number(LS.get("mb.tettoScarica-" + profile, "500")) || 500;
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const stima = await navigator.storage.estimate();
          const usato = Number((stima && stima.usage) || 0) / (1024 * 1024);
          if (usato >= tetto) {
            /* Ste: "i download dopo un po' si liberano e devo reinstallarli".
               Prima l'app smetteva di scaricare e basta: ma il telefono
               restava pieno, e allora iOS liberava lo spazio come gli
               pareva (e si portava via anche le canzoni appena scaricate).
               Adesso libero io le canzoni PIU' VECCHIE e poi continuo a
               scaricare: il telefono resta sotto il tetto e non si
               libera piu' niente all'improvviso. */
            const liberato = await _liberaCanzoniVecchie(cache, usato - tetto * 0.9);
            if (liberato > 0) {
              if (!_avvisoTetto) {
                _avvisoTetto = true;
                toast("Ho liberato " + Math.round(liberato) + " MB di canzoni vecchie " +
                  "per restare sotto il tetto di " + Math.round(tetto) + " MB.", 6000);
              }
            } else if (!_avvisoTetto) {
              _avvisoTetto = true;
              toast("Lo spazio e' arrivato a " + Math.round(usato) + " MB: ho smesso di " +
                "scaricare da solo. Puoi cambiare il tetto o liberare spazio " +
                "dal menu Altro.", 8000);
              return;
            }
          }
        }
      } catch (e) { /* il browser non dice: vado avanti */ }
      const mio = offlineAbort;
      const controller = new AbortController();
      offlineAbort = controller;
      try {
        await cacheTrack({ track: { url: brano.url }, state: "todo", label: "0%", el: null }, cache);
      } finally {
        offlineAbort = mio;
      }
    } catch (e) { /* se non si scarica, pazienza: la canzone suona lo stesso */ }
  }
  let _avvisoTetto = false;

  /* Libero le canzoni offline piu' vecchie (le piu' grandi non le
     tocco: liberare 3 MB con una canzone da 30 MB e' inutile).
     Ogni canzone sa quando e' stata scaricata (header X-Scaricato). */
  async function _liberaCanzoniVecchie(cache, quantoMB) {
    try {
      const richieste = await cache.keys();
      const voci = [];
      for (const r of richieste) {
        try {
          const res = await cache.match(r);
          if (!res) continue;
          const size = Number(res.headers.get("Content-Length") || 0);
          if (!size) continue;
          voci.push({ r: r, size: size, quando: Number(res.headers.get("X-Scaricato") || 0) });
        } catch (e) { /* questa non la guardo */ }
      }
      if (!voci.length) return 0;
      /* le piu' vecchie prima; a parita' di eta', le piu' piccole */
      voci.sort((a, b) => (a.quando - b.quando) || (a.size - b.size));
      let liberato = 0;
      const obiettivo = Math.max(1, quantoMB) * 1024 * 1024;
      for (const v of voci) {
        if (liberato >= obiettivo) break;
        try {
          await cache.delete(v.r);
          liberato += v.size;
        } catch (e) { /* non sono riuscito a liberarla: vado avanti */ }
      }
      return liberato / (1024 * 1024);
    } catch (e) { return 0; }
  }

  async function cacheTrack(row, cache) {
    const url = row.track.url;
    row.state = "run";
    row.label = "0%";
    if (row.el) {
      row.el.state.className = "off-state run";
      row.el.state.textContent = "0%";
    }
    try {
      const res = await fetch(url, { signal: offlineAbort.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const total = Number(res.headers.get("content-length") || 0);
      let blob;
      if (res.body) {
        const reader = res.body.getReader();
        const chunks = [];
        let got = 0;
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          chunks.push(part.value);
          got += part.value.byteLength;
          const pct = total ? Math.min(99, Math.round((got / total) * 100)) : 0;
          if (row.el) {
            row.el.fill.style.width = pct + "%";
            row.el.state.textContent = total ? pct + "%" : fmtBytes(got);
          }
        }
        blob = new Blob(chunks, { type: res.headers.get("content-type") || "audio/mpeg" });
      } else {
        blob = await res.blob();
      }
      await cache.put(url, new Response(blob, {
        status: 200,
        headers: {
          "Content-Type": blob.type || "audio/mpeg",
          "Content-Length": String(blob.size),
          /* l'ora del download: serve per liberare le piu' vecchie */
          "X-Scaricato": String(Date.now())
        }
      }));
      row.state = "ok";
      row.label = "pronta";
      if (row.el) {
        row.el.fill.style.width = "100%";
        row.el.state.className = "off-state ok";
        row.el.state.textContent = "pronta";
      }
    } catch (e) {
      if (e && e.name === "AbortError") {
        row.state = "todo";
        row.label = "da scaricare";
        if (row.el) {
          row.el.fill.style.width = "0%";
          row.el.state.className = "off-state";
          row.el.state.textContent = "da scaricare";
        }
        return;
      }
      row.state = "err";
      row.label = "errore";
      /* Ste: "se premo mi dice impossibile scaricare". Prima l'errore
         veniva buttato via e la riga diceva solo "errore": non si capiva
         il motivo (spazio finito, rete, file che non c'e'...). */
      row.motivo = String((e && e.message) || "errore");
      if (row.el) {
        row.el.state.className = "off-state err";
        row.el.state.textContent = "errore";
        row.el.state.title = row.motivo;
      }
    }
  }

  /* Ste: "quando premo seleziona spunta anche scarica".
   Nella barra di selezione c'era "Aggiungi a playlist", "Solo nella
   playlist" ed "Elimina", ma non c'era "Scarica": e cosi' per tenere offline
   un gruppo di canzoni dovevi scaricarle una alla volta. Ora c'e' anche
   questo, e scarica SOLO quelle che hai scelto. */
  async function _scaricaSelezionati() {
    if (!_inSelezione || !_quantiScelti()) return;
    const cache = await appCache();
    if (!cache) { toast("Offline non disponibile qui"); return; }
    const scelte = [..._scelti];
    const righe = (await scanOffline()).filter((r) => scelte.indexOf(r.id) >= 0 && r.state !== "pronto");
    if (!righe.length) { toast("Le canzoni che hai scelto sono gia' pronte offline"); return; }
    if (offlineBusy) { if (offlineAbort) offlineAbort.abort(); offlineBusy = false; }
    offlineBusy = true;
    offlineAbort = new AbortController();
    toast("Scarico " + righe.length + (righe.length === 1 ? " canzone" : " canzoni") + "…", 4000);
    let fatto = 0;
    let idx = 0;
    const worker = async () => {
      for (;;) {
        const i = idx++;
        if (i >= righe.length) return;
        await cacheTrack(righe[i], cache);
        fatto++;
        _aggiornaBadgeFalliti();
      }
    };
    const n = Math.min(2, righe.length);
    const runners = [];
    for (let k = 0; k < n; k++) runners.push(worker());
    await Promise.all(runners);
    offlineBusy = false;
    offlineAbort = null;
    const errori = righe.filter((r) => r.state === "err").length;
    toast(errori ? "Fatto con " + errori + " errori" : "Fatto: " + fatto + " canzoni pronte offline");
    render();
  }
  /* Porto nella mia libreria tutte le canzoni che ho scelto.

   Ste: "quando premo porta nel mio account deve farmi scegliere in che account,
   e se e' duplicata deve dirmelo e non metterla".

   Quindi: apro il pannetto dei profili e gli faccio scegliere la destinazione
   (prima finiva a caso nel suo account di default). Poi controllo una per una
   se la canzone c'e' gia' in quella lista: se c'e' la salto e glielo dico,
   senza toccare niente. */
  function _selezionaPortaNellaMia() {
    if (!_inSelezione || !_quantiScelti()) { toast("Prima scegli almeno una canzone"); return; }
    /* Non apro la finestra di sistema del browser: gli mostro il pannello dei
       profili, che e' quello che usa gia' per scegliere con chi ascoltare. */
    _chiediAccountPerCopia([..._scelti]);
  }

  /* La copia vera: una canzone alla volta, con il controllo dei duplicati. */
  async function _trasportaInAccount(nome, ids) {
    const scelte = (ids && ids.length) ? ids.slice() : (_destinazioneCopia ? _destinazioneCopia.slice() : [..._scelti]);
    _destinazioneCopia = null;
    const panelChiuso = $("profilePanel") && !$("profilePanel").hidden;
    if (panelChiuso) { $("profilePanel").hidden = true; syncNoScroll(); }
    if (!scelte.length) { toast("Non hai scelto nessuna canzone"); return; }
    const destinazione = String(nome || DEFAULT_PROFILE);

    let copiate = 0;
    const giaPresenti = [];
    const nonCopiabili = [];
    /* Ste: "non mi dice quando e' duplicato o no". Prima guardavo SOLO la lista
       delle copie fatte col pulsante: ma una canzone che ho gia' per conto mio
       non e' in quella lista, e me la copiava lo stesso. Adesso guardo tutto
       quello che l'account di destinazione ha gia': sia le copie, sia le
       canzoni che sono sue, e confronto anche per nome (non solo per id).
       Due brani diversi possono avere lo stesso file, e due nomi diversi
       possono essere la stessa canzone. */
    const idGia = new Set(_mieiCopiatiDi(destinazione));
    const chiaviGia = new Set();
    for (const b of BUILTIN) {
      if ((b.profile || DEFAULT_PROFILE) !== destinazione) continue;
      if (b.file) idGia.add("b-" + String(b.file).replace(/^.*\//, "").replace(/\.mp3$/i, ""));
      if (_identitaBrano(b)) chiaviGia.add(_identitaBrano(b));
    }
    for (const id of scelte) {
      const t = tracks.find((x) => x.id === id);
      if (!t) { nonCopiabili.push(id); continue; }
      const numero = (/^track-(\d+)\.mp3$/.exec(String(t.url || "").replace(/^.*\//, "")) || [])[1];
      if (!numero) { nonCopiabili.push(t.title); continue; }
      if (idGia.has("b-track-" + numero) ||
          (_identitaBrano(t) && chiaviGia.has(_identitaBrano(t)))) {
        giaPresenti.push(t.title);
        continue;
      }
      const ok = await _portaNellaMiaLibreria(t, destinazione);
      if (ok) { copiate++; if (_identitaBrano(t)) chiaviGia.add(_identitaBrano(t)); }
      else giaPresenti.push(t.title);
    }

    /* Adesso riaccendo il pannello come prima, con il suo sottotitolo. */
    const sottotitolo = $("profileSub");
    if (sottotitolo) sottotitolo.textContent = "Scegli il tuo nome";
    try { _chiudiSelezione(); } catch (e) { /* noop */ }

    /* Il conto finale: Ste vuole sapere cosa e' successo, canzone per canzone. */
    const parti = [];
    if (copiate) parti.push(copiate + (copiate === 1 ? " canzone portata" : " canzoni portate") + " in " + destinazione);
    if (giaPresenti.length) {
      /* Nomi scomodi dentro una riga sola sul telefono: se sono in molti dico
         il numero, se sono in pochi li scrivo, cosi' Ste sa WHICH canzoni ha
         gia' e non deve andare a cercarle. */
      const nomi = giaPresenti.slice(0, 4).join(", ");
      const resto = giaPresenti.length > 4 ? " e altre " + (giaPresenti.length - 4) : "";
      parti.push((giaPresenti.length === 1
        ? '"' + nomi + '"'
        : nomi + resto) + (destinazione === profile
          ? " le avevi gia' tu, non l'ho rimessa"
          : " le avevi gia' in " + destinazione + ", non l'ho rimessa"));
    }
    if (nonCopiabili.length) parti.push(nonCopiabili.length + " non trasportabili");
    if (!parti.length) parti.push("Non ho copiato niente");
    toast(parti.join(". "), giaPresenti.length ? 7000 : 4000);
    try { renderProfiles(); } catch (e) { /* noop */ }
  }

  /* Ste: "se eliminarlo solo dalla playlist o solo dalla libreria no?"

     Questa e' l'azione che mancava: toglie le canzoni scelte dalle playlist e
     le fa tornare visibili in libreria. E' il contrario esatto di
     "Togli dalla libreria", che invece le nasconde e le lascia suonare solo li'
     dentro. */
  function _selezionaTogliDallaPlaylist() {
    const ids = [..._scelti];
    if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
    let tolte = 0;
    const nomi = new Set();
    for (const id of ids) {
      for (const pl of (playlists || [])) {
        if (Array.isArray(pl.tracks) && pl.tracks.indexOf(id) >= 0) {
          pl.tracks = pl.tracks.filter((x) => x !== id);
          nomi.add(pl.name);
          tolte++;
        }
      }
      /* Smette anche di essere "solo in playlist": torna in libreria. */
      _togliSoloInPlaylist(id);
    }
    _salvaSoloInPlaylist();
    _salvaPlaylistCondivise();
    _disegnaLinguettePlaylist();
    _aggiornaBadgePlaylist();
    _chiudiSelezione();
    toast(tolte
      ? "Tolte da " + [...nomi].join(", ") + ": ora le vedi di nuovo in libreria"
      : "Queste canzoni non erano in nessuna playlist");
  }

  async function downloadAllOffline() {
    if (offlineBusy) {
      if (offlineAbort) offlineAbort.abort();
      offlineBusy = false;
      $("btnOfflineAll").textContent = "Scarica tutte";
      toast("Scaricamento fermato");
      return;
    }
    const cache = await appCache();
    if (!cache) {
      toast("Offline non disponibile qui");
      return;
    }
    const rows = (await scanOffline()).filter((r) => r.state === "todo");
    if (!rows.length) {
      toast("Sono gia' tutte pronte");
      return;
    }
    offlineBusy = true;
    offlineAbort = new AbortController();
    $("btnOfflineAll").textContent = "Ferma";
    let idx = 0;
    let fatto = 0;
    const worker = async () => {
      for (;;) {
        const i = idx++;
        if (i >= rows.length) return;
        await cacheTrack(rows[i], cache);
        fatto++;
        const rimaste = rows.length - fatto;
        $("offlineSub").textContent = "Scarico " + fatto + "/" + rows.length + (rimaste ? " (restano " + rimaste + ")" : "");
      }
    };
    /* Salvo la lista di quello che resta da scaricare: se il telefono
       sospende l'app (schermo spento) la coda non si perde, e quando
       riapro l'app riprende da dove si era fermata. */
    try {
      LS.set("mb.codaOffline", JSON.stringify({
        quando: Date.now(),
        brani: rows.filter((r) => r.state === "todo").map((r) => ({ url: r.url, titolo: r.title }))
      }));
    } catch (e) { /* noop */ }
    /* Chiedo al worker del servizio di scaricare per conto suo: lui vive un
       po' piu' a lungo della pagina, quindi lo scaricamento va avanti
       anche se l'app viene sospesa. */
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const daScaricare = rows.filter((r) => r.state === "todo").map((r) => r.url).filter(Boolean);
        if (daScaricare.length) {
          navigator.serviceWorker.controller.postMessage({ type: "SCARICA", url: daScaricare, cache: cacheBraniName() });
          _diChe("chiedo al worker di scaricare " + daScaricare.length + " brani");
        }
      }
    } catch (e) { /* noop */ }
    const n = Math.min(2, rows.length);
    const runners = [];
    for (let k = 0; k < n; k++) runners.push(worker());
    await Promise.all(runners);
    offlineBusy = false;
    offlineAbort = null;
    $("btnOfflineAll").textContent = "Scarica tutte";
    const errori = rows.filter((r) => r.state === "err");
    if (errori.length) {
      const primi = errori.slice(0, 2).map((r) => (r.title || "canzone") + " (" + (r.motivo || "errore") + ")");
      toast("Fatto con " + errori.length + " errori: " + primi.join(", "), 9000);
    } else {
      toast("Fatto: " + fatto + " canzoni pronte offline");
    }
    await scanOffline();
  }

  async function offlineSpaceInfo() {
    let txt = "";
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (est && est.usage) {
          txt = "Spazio usato dall'app: " + fmtBytes(est.usage) +
            (est.quota ? " (ne puoi usare " + fmtBytes(est.quota) + ")" : "");
        }
      }
    } catch (e) { /* noop */ }
    /* Aggiunge info cache canzoni + avviso soglia */
    try {
      if ("caches" in window) {
        const tettoMb = Number(LS.get("mb.tettoScarica-" + profile, "500")) || 500;
        if (tettoMb < 999999) {
          const tetto = tettoMb * 1024 * 1024;
          const stream = await caches.open(cacheStreamName());
          const miei = await caches.open(cacheBraniName());
          const dimensione = async (cache) => {
            let totale = 0;
            try {
              for (const req of await cache.keys()) {
                const r = await cache.match(req);
                if (!r) continue;
                totale += Number(r.headers.get("content-length") || 0) || 0;
              }
            } catch (e) { }
            return totale;
          };
          const tot = await dimensione(stream);
          const mie = await dimensione(miei);
          const usato = tot + mie;
          const perc = tetto > 0 ? Math.round((usato / tetto) * 100) : 0;
          const avviso = perc >= 80 ? " ⚠️" : "";
          txt += "\nCanzoni offline: " + fmtBytes(usato) + " / " + tettoMb + " MB (" + perc + "%)" + avviso;
        }
      }
    } catch (e) { }
    if (!txt) txt = "Le canzoni offline occupano memoria sul telefono (circa 60 MB per tutte).";
    $("offlineSpace").textContent = txt;
  }

  async function freeOffline() {
    /* Svuoto TUTTE le cache, non solo quella di un momento: dopo un
       aggiornamento i brani scaricati finiscono nella cache nuova (il worker
       del servizio li migra li'), e svuotando solo la vecchia non si
liberava davvero niente. Cancello solo i brani del profilo corrente: i file dell'app
        restano, cosi' l'app si apre anche senza rete. */
    if (!("caches" in window)) {
      toast("Offline non disponibile qui");
      return;
    }
    let tolti = 0;
    try {
      const chiavi = await caches.keys();
      for (const chiave of chiavi) {
        /* Cancella solo le cache del profilo corrente (brani e stream) */
        if (!chiave.includes("-" + profile + "-") && !chiave.endsWith("-" + profile)) continue;
        let cache = null;
        try { cache = await caches.open(chiave); } catch (e) { continue; }
        let reqs = [];
        try { reqs = await cache.keys(); } catch (e) { continue; }
        for (const r of reqs) {
          let pathname = "";
          try { pathname = new URL(r.url).pathname; } catch (e) { pathname = r.url; }
          if (/\.mp3$/i.test(pathname)) {
            try { await cache.delete(r); tolti++; } catch (e) { /* noop */ }
          }
        }
      }
    } catch (e) { /* noop */ }
    await scanOffline();
    await offlineSpaceInfo();
    toast(tolti ? tolti + " canzoni liberate" : "Non c'era niente da liberare");
  }

  let cachedSongs = new Set();
  let cloudBusy = false;

  function absUrl(u) {
    try { return new URL(u, location.href).href; } catch (e) { return u; }
  }

  async function refreshCachedSongs() {
    /* Ste: "diego aveva scaricato le canzoni, ha chiuso l'app e una volta
       riaperta doveva di nuovo scaricarle".

       Motivo: qui guardavo solo la cache della versione corrente. Ma le
       canzoni scaricate possono stare in una cache vecchia (per esempio
       se l'aggiornamento e' appena successo e il service worker non ha
       ancora migrato i brani), e allora l'app non le vedeva e le
       ridownloadava.

       Adesso guardo TUTTE le cache, come fa il service worker quando
       serve un brano. */
    const set = new Set();
    try {
      const chiavi = await caches.keys();
      for (const chiave of chiavi) {
        let cache = null;
        try { cache = await caches.open(chiave); } catch (e) { continue; }
        let reqs = [];
        try { reqs = await cache.keys(); } catch (e) { continue; }
        for (const r of reqs) {
          let nome = "";
          try { nome = new URL(r.url).pathname; } catch (e) { nome = r.url; }
          if (/\.mp3$/i.test(nome)) set.add(r.url);
        }
      }
    } catch (e) { /* niente cache: pazienza */ }
    cachedSongs = set;
    render();
  }

  function isCached(t) {
    if (!t) return true;
    /* Ste: "diego aveva scaricato le canzoni ma non gliele faceva ascoltare
       senza connessione". Prima qui, per un brano che non era "builtin"
       (quello di Diego e' condiviso, non e' dell'app), rispondevo sempre
       "gia' salvata": cosi' l'app credeva che fosse tutto pronto e non
       scaricava mai niente. Ora guardo davvero in cache, come per gli altri. */
    return cachedSongs.has(absUrl(t.url)) || cachedSongs.has(t.url);
  }

  async function fetchToCache(url, cache, onProgress) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const total = Number(res.headers.get("content-length") || 0);
    let blob;
    if (res.body) {
      const reader = res.body.getReader();
      const chunks = [];
      let got = 0;
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        chunks.push(part.value);
        got += part.value.byteLength;
        if (onProgress) onProgress(total ? got / total : 0, got);
      }
      blob = new Blob(chunks, { type: res.headers.get("content-type") || "audio/mpeg" });
    } else {
      blob = await res.blob();
    }
    await cache.put(url, new Response(blob, {
      status: 200,
      headers: { "Content-Type": blob.type || "audio/mpeg", "Content-Length": String(blob.size) }
    }));
    return blob.size;
  }

  async function _controllaSpazioAvviso() {
    try {
      if (!("caches" in window)) return false;
      const tettoMb = Number(LS.get("mb.tettoScarica-" + profile, "500")) || 500;
      if (tettoMb >= 999999) return false;
      const tetto = tettoMb * 1024 * 1024;
      const stream = await caches.open(cacheStreamName());
      const miei = await caches.open(cacheBraniName());
      const dimensione = async (cache) => {
        let totale = 0;
        try {
          for (const req of await cache.keys()) {
            const r = await cache.match(req);
            if (!r) continue;
            totale += Number(r.headers.get("content-length") || 0) || 0;
          }
        } catch (e) { }
        return totale;
      };
      const tot = await dimensione(stream);
      const mie = await dimensione(miei);
      const usato = tot + mie;
      const perc = tetto > 0 ? (usato / tetto) * 100 : 0;
      if (perc >= 80) {
        toast("Attenzione: spazio offline al " + Math.round(perc) + "% (" +
          Math.round(usato / 1024 / 1024) + " MB su " + tettoMb + " MB). " +
          "Le canzoni più vecchie verranno rimosse automaticamente.", 8000);
        /* Pulizia automatica proattiva */
        await _tieniSpazioSottoIlTetto();
        return true;
      }
    } catch (e) { }
    return false;
  }

  async function cacheOneTrack(t, el) {
    /* Ste: "diego aveva scaricato le canzoni ma non gliele faceva
       ascoltare senza connessione". Prima qui fermavo tutto se il brano
       non era "builtin": i brani condivisi (quelli di Diego, degli amici)
       non si potevano proprio scaricare. Ora va bene QUALSIASI brano che
       abbia un indirizzo. */
    if (cloudBusy || !t || !t.url) return;
    await _controllaSpazioAvviso();
    cloudBusy = true;
    if (el) {
      el.classList.add("run");
      el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Z"/></svg>';
    }
    try {
      const cache = await appCache();
      if (!cache) {
        throw new Error("il browser non ha piu' spazio per le canzoni offline: libera memoria o tocca piu' tardi");
      }
      /* L'indirizzo va ricalcolato adesso: quello del brano puo' essere
         vecchio (calcolato all'avvio, prima che l'app sapesse del
         collegamento di casa) e manderebbe il download su internet. */
      const dove = (typeof _urlDelBrano === "function") ? _urlDelBrano(t) : t.url;
      await fetchToCache(dove || t.url, cache, (ratio) => {
        if (el) el.style.background = ratio ? "var(--accent2)" : "";
      });
      if (el) {
        el.classList.remove("run");
        el.classList.add("ok");
        el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.6 16.6 5 12l1.4-1.4 3.2 3.2 8-8L19 7.2l-9.4 9.4Z"/></svg>';
      }
      toast(t.title + " pronta per offline");
    } catch (e) {
      if (el) {
        el.classList.remove("run");
        el.classList.add("err");
      }
      /* Ste: "se premo mi dice impossibile scaricare".
         Il motivo vero e' quasi sempre lo SPAZIO: il telefono non ha
         piu' posto per un'altra canzone. E' un messaggio che spaventa e
         non dice niente, quindi qui lo spiego e dico cosa fare. */
      const che = String((e && e.message) || "errore");
      const troppoPieno = /quota|spazio|Quota/i.test(che) ||
        (e && (e.name === "QuotaExceededError"));
      toast(troppoPieno
        ? "Non c'e' piu' spazio sul telefono per questa canzone. " +
          "Liberane un po' (menu Altro > Quanto tenere offline) e riprova."
        : "Download non riuscito: " + che, 8000);
    } finally {
      cloudBusy = false;
      await refreshCachedSongs();
    }
  }

  let checkingSongs = false;
  const BUILTIN_RE = /\{\s*title:\s*"((?:[^"\\]|\\.)*)",\s*file:\s*"(songs\/track-\d+\.mp3)",\s*artist:\s*"((?:[^"\\]|\\.)*)"(?:,\s*profile:\s*"((?:[^"\\]|\\.)*)")?(?:,\s*spotifyId:\s*"((?:[^"\\]|\\.)*)",\s*spotifyAlbum:\s*(null|"(?:[^"\\]|\\.)*"),\s*spotifyDurationMs:\s*(null|\d+),\s*spotifyAddedAt:\s*(null|"(?:[^"\\]|\\.)*"),\s*spotifyAddedDisplay:\s*(null|"(?:[^"\\]|\\.)*"))?\s*\}/g;

  function parseBuiltinFrom(text) {
    const start = text.indexOf("const BUILTIN = [");
    if (start < 0) return null;
    const end = text.indexOf("];", start);
    if (end < 0) return null;
    const block = text.slice(start, end);
    const out = [];
    const re = new RegExp(BUILTIN_RE.source, "g");
    let m;
    while ((m = re.exec(block))) {
      const item = {
        title: JSON.parse('"' + m[1] + '"'),
        file: m[2],
        artist: JSON.parse('"' + m[3] + '"'),
        profile: m[4] ? JSON.parse('"' + m[4] + '"') : DEFAULT_PROFILE
      };
      if (m[5]) {
        item.spotifyId = JSON.parse('"' + m[5] + '"');
        item.spotifyAlbum = JSON.parse(m[6]);
        item.spotifyDurationMs = JSON.parse(m[7]);
        item.spotifyAddedAt = JSON.parse(m[8]);
        item.spotifyAddedDisplay = JSON.parse(m[9]);
      }
      out.push(item);
    }
    return out;
  }

let _firmaLibreria = "";
let _ultimoControllo = 0;
let _ultimoControlloPesante = 0;  /* guardia: max 2 minuti tra controlli pesanti di nuove canzoni */

/* Ste: "si continua ad aggiornare" senza sapere cosa. Questo me lo dice:
   ogni volta che la libreria viene davvero ricostruita, il numero della
   versione mostra quando e' successo. Se resta fermo, la libreria non si
   e' mossa e quello che vedi e' un'altra cosa. */
function _aggiornaEtichettaControllo(che) {
  try {
    const vb = $("verBadge");
    if (!vb) return;
    const quando = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    vb.dataset.aggiornato = quando;
    vb.title = "Versione in uso: " + APP_VERSION +
      "\nUltimo controllo nuove canzoni: " + quando +
      "\nUltima libreria ricostruita: " + (che || vb.dataset.aggiornato || "nessuna") +
      "\n(tocca per ricaricare)";
  } catch (e) { /* noop */ }
}

async function checkForNewSongs() {
    if (checkingSongs) return;
    /* Quanti brani ho davanti in questa copia dell'app: serve per il confronto
       veloce con versione.json. */
    try { _quantiBraniOnline = (typeof BUILTIN !== "undefined" && BUILTIN.length) ? BUILTIN.length : 0; } catch (e) { /* noop */ }
    /* Ste: "puoi velocizzare il tempo in cui ci mette a inserire le canzoni".
       Prima aspettavo almeno 2 minuti prima di guardare, e poi scaricavo
       tutto app.js (400 KB) ogni volta. Ora:
         - guardo un file minuscolo (versione.json, poche decine di byte)
           ogni volta, quindi posso farlo spesso senza costare nulla;
         - scarico i 400 KB di app.js SOLO se quel file mi dice che c'e'
           qualcosa di nuovo. */
    const ora = Date.now();
    if (ora - _ultimoControllo < 20000) return;
    _ultimoControllo = ora;
    checkingSongs = true;
    try {
      /* Primo il file leggero: se la versione e' quella che ho gia', ho
         finito e non scarico nient'altro. */
      try {
        const risposta = await fetch("versione.json?t=" + ora, { cache: "no-store" });
        if (risposta.ok) {
          const piccolo = await risposta.json();
          const mia = String(typeof APP_VERSION !== "undefined" ? APP_VERSION : "");
          const suoi = String(piccolo.versione || "");
          const stessi = !!mia && !! suoi && mia.split(".").slice(0, 2).join(".") === suoi.split(".").slice(0, 2).join(".");
          /* Se la versione coincide, non scarico app.js: risparmio 400 KB
             a ogni controllo. Se invece il conteggio dei brani e' diverso,
             c'e' davvero qualcosa di nuovo e voglio accorgermene subito. */
          if (stessi && Number(piccolo.brani || 0) === _quantiBraniOnline) {
            _aggiornaEtichettaControllo();
            return;
          }
        }
      } catch (e) { /* il file non c'e': vado col metodo vecchio */ }
      const oraPesante = Date.now();
      if (oraPesante - _ultimoControlloPesante < 120000) return;
      _ultimoControlloPesante = oraPesante;
      const res = await fetch("app.js", { cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      const parsed = parseBuiltinFrom(text);
      if (!parsed || !parsed.length) return;
      /* Confronto col sito solo per i brani che SONO nella mia libreria (i miei piu'
         quelli che ho copiato dagli altri). Se guardassi tutti i brani del
         sito, le canzoni degli altri sembrerebbero sparite e potrei essere
         invitato a cancellarle: cosa che non voglio mai. */
      const mine = parsed.filter((b) => _devoVedereBrano((b.profile || DEFAULT_PROFILE) === profile, b));
      const remoteFiles = mine.map((b) => b.file);
      const localBuiltin = tracks.filter((t) => t.builtin);
      const localFiles = localBuiltin.map((t) => t.file || t.url);
      const aggiunte = mine.filter((b) => localFiles.indexOf(b.file) < 0);
      const tolte = localFiles.filter((f) => remoteFiles.indexOf(f) < 0);
      /* Una canzone che manca al sito puo' sparire solo a meta' di un aggiornamento:
         la tolgo solo se la vedo assente DUE controlli di fila (piu' o meno 2 minuti),
         cosi' un aggiornamento o una copia vecchia non cancella mai brani validi. */
      const missingKey = "mb.senza." + profile;
      const viste = LS.get(missingKey, []);
      const confermate = tolte.filter((f) => viste.indexOf(f) >= 0);
      if (tolte.length) LS.set(missingKey, tolte);
      else LS.remove(missingKey);
      const playing = current();
      if (playing && confermate.includes(playing.file || playing.url)) return;
      if (!aggiunte.length && !confermate.length) { _quantiBraniOnline = parsed.length; _aggiornaEtichettaControllo(); return; }
      /* Firma di quello che ho davanti: se combacia, e' la stessa libreria e
         non la ridisegno (e' quello che faceva saltare gli schermi). */
      const firma = profile + "#" + (mine.map((b) => JSON.stringify([b.file, b.profile || DEFAULT_PROFILE, b.title, b.artist])).sort().join("|") + "#" + confermate.length);
      if (firma === _firmaLibreria) { _aggiornaEtichettaControllo(); return; }
      _firmaLibreria = firma;
      _quantiBraniOnline = parsed.length;
      /* Prima di ridisegnare, mi segno dove eri: cosi' la lista non ti
         rimanda in cima mentre ti muovi. */
      _salvaPuntoLibreria();

      BUILTIN.length = 0;
      for (const b of parsed) {
        BUILTIN.push({ title: b.title, file: b.file, artist: b.artist, profile: b.profile });
      }
      for (const t of localBuiltin) {
        const file = t.file || t.url;
        if (remoteFiles.indexOf(file) < 0 && confermate.indexOf(file) < 0) {
          BUILTIN.push({ title: t.title, file, artist: t.artist, profile: t.profile || DEFAULT_PROFILE });
        }
      }
      await loadCovers();
      await loadAll();
      _ripristinaPuntoLibreria();
      _aggiornaEtichettaControllo();
      if (aggiunte.length) {
        toast((aggiunte.length === 1 ? "Nuova canzone: " : "Nuove canzoni: ") + aggiunte.map((b) => b.title).join(", ").slice(0, 60));
      }
      if (confermate.length) {
        toast(confermate.length === 1 ? "Una canzone non c'e' piu'" : confermate.length + " canzoni non ci sono piu'");
      }
    } catch (e) { /* noop */ } finally {
      checkingSongs = false;
    }
  }

  async function openOffline() {
    $("offlinePanel").hidden = false;
    syncNoScroll();
    $("offlineList").innerHTML = "";
    await scanOffline();
    await offlineSpaceInfo();
  }

  function closeOffline() {
    if (offlineBusy && offlineAbort) {
      offlineAbort.abort();
      offlineBusy = false;
    }
    $("offlinePanel").hidden = true;
    syncNoScroll();
  }

  $("btnOffline").addEventListener("click", openOffline);
    $("btnStatistiche").addEventListener("click", apriStatistiche);
  $("btnCreaPlaylist").addEventListener("click", () => { _chiudiAltro(); creaPlaylist(); });
  /* Le linguette: "Tutte" riporta alla libreria intera, il "+" crea. */
  $("plLingTutte").addEventListener("click", () => {
    _playlistAttiva = "";
    _disegnaLinguettePlaylist();
    render();
  });
  $("btnNuovaPlLing").addEventListener("click", () => {
    /* Il "+" apre le playlist: da li' crei una nuova e trovi anche i tasti
       per nasconderla o riportarla in libreria. */
    _disegnaLinguettePlaylist();
    _playlistAperta = "";
    apriPanelPlaylist();
  });
  $("btnCondividi").addEventListener("click", () => { _chiudiAltro(); _condividiAdesso(); });

  /* ---------- Aggiungere una canzone dal link di YouTube ----------
     Prima si faceva a mano: copiavo il link, aprivo un sito per convertire,
     scaricavo il file e lo importavo. Adesso:
     - copio il link su YouTube e torno qui;
     - tocco questo bottone;
     - se il computer e' acceso scarica lui e la mette in libreria;
     - se e' spento, il link resta in coda e quando si accende fa da solo. */
  function _leggiLinkDagliAppunti() {
    /* su iPhone funziona solo se lo chiedo mentre l'utente tocca il bottone,
       ed e' esattamente quello che facciamo. Se il browser lo rifiuta,
       chiedo il link a mano invece di lasciare l'utente fermo. */
    return new Promise((ok) => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) return ok("");
        const t = navigator.clipboard.readText();
        if (t && typeof t.then === "function") {
          t.then((v) => ok(String(v || "").trim()), () => ok(""));
          return;
        }
        ok(String(t || "").trim());
      } catch (e) { ok(""); }
    });
  }

function _nomePerIlBrano(link, suggerito) {
    const già = String(suggerito || "").trim();
    if (già) return già;
    let scritto = "";
    try {
      /* Propongo l'ultimo nome usato: cosi' nella maggior parte dei casi
         basta confermarlo e non riscrivere tutto da capo. */
      scritto = String(prompt("Come si chiama questo brano? Scrivi \"Artista - Titolo\"",
        String(LS.get("mb.ultimoNome", "") || "")) || "").trim();
    } catch (e) { /* noop */ }
    if (scritto) return scritto;
    return /youtu\.be\/|v=|shorts\//i.test(link) ? "brano da YouTube" : "";
  }

  /* Se arrivo da una canzone gia' cercata, il nome lo so gia': lo uso
     quello e non chiedo niente. */
  /* I titoli di YouTube vengono sporchi: "Ne vale la pena (Version 1)
     [ESCLUSIVA VINILE]", "Official Video", "Audio", "Lyrics"... Se lascio
     cosi' il brano si chiama con quella robaccia dentro e poi non
     corrisponde piu' a nessun brano dell'altro utente.
     Tolgo solo le parentesi "parole" (quelle che dicono che tipo di file
     e'), e solo se stanno in fondo. "Live", "Remastered" e "Version 1"
     invece li lascio: quelli dicono il brano, non il formato del file. */
  function _titoloMenoSpazzatura(t) {
    let s = String(t || "").trim();
    const robaccia = /(official|video|audio|lyric|lyrics|visualizer|testo|con testo|clip|full album|album|exclusiva|esclusiva|streaming|hd|hq|4k|\bmv\b|\bm\/v\b|1080p|720p|visual)/i;
    for (let giri = 0; giri < 4; giri++) {
      const m = /\s*[\[\(\{]([^\]\)\}]*)[\]\)\}]\s*$/.exec(s);
      if (!m) break;
      if (!robaccia.test(m[1])) break;
      s = s.slice(0, m.index).trim();
    }
    return s.replace(/\s{2,}/g, " ").trim();
  }
  async function _aggiungiDaYouTube(suggerito) {
    let link = await _leggiLinkDagliAppunti();
    if (!/youtu\.be\/|youtube\.com\/(watch|shorts)|[?&]v=/i.test(link)) {
      try {
        const scritto = String(prompt("Incolla qui il link di YouTube", link || "") || "").trim();
        link = scritto;
      } catch (e) { /* noop */ }
    }
    if (!/youtu\.be\/|youtube\.com\/(watch|shorts)|[?&]v=/i.test(link)) {
      toast("Serve un link di YouTube: su YouTube tocca Condividi e poi Copia link");
      return;
    }
    /* Ste: "diego ha messo una canzone incollando il link di yt ma spunta
     il link di yt, non il titolo e artista". Prima l'app chiedeva il nome a
     mano e proponeva l'ultimo nome usato: se non veniva riscritto restava
     il link (o "brano da YouTube"). Ora chiedo al computer come si chiama
     davvero quel video e lo propongo gia' scritto: si preme "ok" e via.
     Se il computer non c'e' o YouTube non risponde, si comporta come prima. */
  let proposto = suggerito;
  if (!proposto && (await ponteOnline())) {
    try {
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      const r = await fetch(base + "/titolo?url=" + encodeURIComponent(link));
      if (r.ok) {
        const d = await r.json();
        if (d && d.titolo) {
          proposto = _titoloMenoSpazzatura(d.titolo);
          /* "Artista - Titolo" e' gia' la forma giusta. Se il titolo del
             video NON ha il trattino allora l'artista non c'e' dentro, e
             metto il canale. Se pero' il canale e' una sigla tipo "UC123"
             o un nome generico, meglio lasciare il titolo come e': meglio
             un titolo imperfetto che un artista sbagliato. */
          const canale = String(d.canale || "").trim();
          const canaleSenzaSenso = /^UC[A-Za-z0-9_-]+$/.test(canale) ||
            /^(VEVO|Topic|Audio|Videos?|Records|Official)$/i.test(canale);
          if (proposto.indexOf(" - ") < 0 && canale && !canaleSenzaSenso) {
            proposto = canale + " - " + proposto;
          }
        }
      }
    } catch (e) { /* nessun problema: si chiede a mano come prima */ }
  }
  const nome = _nomePerIlBrano(link, proposto);
    if (!nome) { toast("Scrivi il nome del brano, altrimenti non lo metto in libreria"); return; }
    try { LS.set("mb.ultimoNome", nome); } catch (e) { /* noop */ }

    /* Cartella del computer dove mettere il brano scaricato da YouTube.

       Prima era scritta a mano: finiva sempre nella cartella di Ste (o di Ari
       o Emanuele) anche se stavi ascoltando come un altro nome. Infatti se un
       amico scaricava una canzone da YouTube, gli finiva nella libreria di
       Ste. Adesso prendo la cartella del nome aperto, e se questo nome non ha
       una cartella sul computer uso quella di Ste. */
    const cartella = cartellaDi(profile) || "ste";

    /* Se il computer e' acceso: scarica subito, e' piu' veloce. */
    if (await ponteOnline()) {
      toast("Sto scaricando " + nome + "...");
      const base = (await trovaPonte()) || INDIRIZZI_PONTE[0];
      try {
        const r = await fetch(base + "/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link, cartella: cartella, titolo: nome })
        });
        if (!r.ok) {
          let perche = "non riesco a scaricare (" + r.status + ")";
          try { const j = await r.json(); if (j && j.errore) perche = j.errore; } catch (e) { /* noop */ }
          toast(perche, 6000);
          segnalaErrore("aggiunta da youtube fallita: " + perche);
          return;
        }
        /* il PC ha gia' messo il brano nella cartella: non serve tenere
           l'mp3 qui, occuperebbe spazio e creerebbe un doppione */
        await r.arrayBuffer();
        toast("Fatto: " + nome + " e' in libreria. Se non la vedi subito, aspetta un minuto e ricarica");
        segnalaErrore("aggiunta da youtube riuscita: " + nome);
        return;
      } catch (e) {
        /* il computer si e' spento proprio adesso: passo dalla coda */
      }
    }

    /* Computer spento: il link resta in coda e viene scaricato all'accensione. */
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) {
      _spiegaPercheNonVa();
      return;
    }
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-chiave": CHIAVE_PUBBLICA,
          "x-link": link,
          "x-nome": nome,
          "x-profilo": cartella
        }
      });
      if (!r.ok) {
        let perche = "non riesco a mettere in coda (" + r.status + ")";
        try { const j = await r.json(); if (j && j.errore) perche = j.errore; } catch (e) { /* noop */ }
        toast(perche, 6000);
        return;
      }
      toast("Messo in coda: " + nome + " entra in libreria quando il computer si accende", 6000);
      segnalaErrore("link in coda: " + nome);
    } catch (e) {
      /* Ste: diceva solo "non riesco a parlare col servizio", che non dice
         niente. Adesso distinguo i casi: senza rete, senza chiave, oppure
         il servizio che risponde male. */
      const perche = e && e.name === "TypeError"
        ? "Sembra che non ci sia rete: controlla il wifi o i dati."
        : "Il servizio non ha risposto (" + String((e && e.message) || e).slice(0, 40) + ")";
      toast("Non riesco a parlare col servizio. " + perche, 8000);
      segnalaErrore("aggiunta da youtube: " + perche);
    }
  }
  /* ---------- La guida (il "?" nel menu Altro) ----------
   Ste: "aggiungi anche nell'app una sezione nei 3 puntini con un'icona del
   '?' dove spieghi bene". Spiega come si mettono le canzoni online con il
   computer acceso e con il computer spento, e cosa fare quando qualcosa
   non funziona. */
function _apriAiuto() {
  const p = $("aiutoPanel");
  if (!p) return;
  _chiudiAltro();
  p.hidden = false;
  syncNoScroll();
  try {
    const corpo = p.querySelector(".aiuto-corpo");
    if (corpo) corpo.scrollTop = 0;
  } catch (e) { /* noop */ }
}
function _chiudiAiuto() {
  const p = $("aiutoPanel");
  if (p) p.hidden = true;
  syncNoScroll();
}
$("btnAiuto").addEventListener("click", _apriAiuto);
$("aiutoClose").addEventListener("click", _chiudiAiuto);
$("aiutoPanel").addEventListener("click", (e) => {
  if (e.target === $("aiutoPanel")) _chiudiAiuto();
});

$("btnDaYouTube").addEventListener("click", () => { _chiudiAltro(); _aggiungiDaYouTube(); });
  /* Ste: "premo importa da spotify e non spunta niente". Finora il
     pulsone lo collegava solo spotify.js, e va a dire che quel
     collegamento non partiva. Qui lo collego anche da app.js, dove so
     che il codice gira: due tentativi non fanno danno, e _spotifyApri
     si accorge da se' di non rifare il lavoro due volte. */
  try {
    window._spotifyCollegaQui = function () {
      const b = $("btnSpotify");
      if (!b || b._collegatoQui) return;
      b._collegatoQui = true;
      b.addEventListener("click", function () {
        try { if (typeof _spotifyApri === "function") _spotifyApri(); } catch (e) { /* noop */ }
      });
    };
    window._spotifyCollegaQui();
  } catch (e) { /* noop */ }
  /* Ste: "posso mettere il link della mia playlist di spotify e in automatico
     importa le canzoni?". Il pulsante sta nel menu Altro, e se dice di no
     l'app resta esattamente com'era.
     Il pulsante lo collega spotify-ui.js, perche' prima stava qui dentro
     un try/catch che si mangiava gli errori: se qualcosa andava storto
     semplicemente non apriva niente (Ste: "premo importa da spotify e
     non apre nulla"). Qui non lo collego piu' per non legarlo due volte,
     ma se il file non c'e' lo dico. */
  try {
    if (!$("btnSpotify") && $("spotifyPanel")) {
      toast("Spotify non si e' caricato bene", 5000);
    }
  } catch (e) { /* noop */ }

  /* Quanti link sono in coda, cioè brani che ho mandato e che il computer
     scaricera' quando si accende. Serve a non chiedersi "ma e' arrivato?".
     Se il servizio non e' attivo su questa pagina, semplicemente non
     mostrare niente invece di dare fastidio. */
  let _codaAggiornata = 0;
  async function _aggiornaCoda() {
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) return;
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/coda", {
        headers: { "x-chiave": CHIAVE_PUBBLICA }, cache: "no-store"
      });
      if (!r.ok) return;
      const j = await r.json();
      const n = Array.isArray(j && j.voci) ? j.voci.length : 0;
      _codaAggiornata = n;
      const b = $("btnCondividi");
      const badge = $("condividiBadge");
      if (badge && b && !b.hidden) {
        const altro = _quantiNonCondivisi();
        if (n > 0) { badge.textContent = String(altro + n > 9 ? "9+" : altro + n); }
      }
      if (n > 0) {
        toast(n === 1
          ? "1 brano in coda: entra in libreria quando il computer si accende"
          : n + " brani in coda: entrano in libreria quando il computer si accende", 5000);
      }
    } catch (e) { /* senza rete non aggiorno: pazienza */ }
  }

  /* La casella per mettere la chiave del servizio. Se la chiave c'e' gia'
     non si vede: e' una cosa da fare una volta sola. */
  function _preparaCasellaServizio() {
    const box = $("casellaServizio");
    if (!box) return;
    const gia = !!CHIAVE_PUBBLICA;
    box.hidden = gia;
    const inp = $("inChiave");
    if (inp) inp.value = CHIAVE_PUBBLICA;
  }
  $("btnSalvaChiave").addEventListener("click", async () => {
    const inp = $("inChiave");
    const stato = $("statoServizio");
    const v = String((inp && inp.value) || "").trim();
    if (!v) { if (stato) stato.textContent = "Scrivi prima la chiave."; return; }
    LS.set("mb.chiave", v);
    /* riprovo subito con la chiave nuova: se il servizio non la accetta,
       lo dico subito invece di lasciare l'utente a scoprircelo dopo */
    try {
      const r = await fetch(SERVIZIO_PUBBLICA + "/aggiungi", {
        method: "POST",
        headers: { "content-type": "audio/mpeg", "x-chiave": v, "x-nome": "prova" },
        body: new Uint8Array(1024)
      });
      if (r.status === 401) {
        if (stato) stato.textContent = "Chiave sbagliata: copiala di nuovo.";
        LS.set("mb.chiave", "");
        return;
      }
      if (inp) inp.value = "";
      _preparaCasellaServizio();
      toast("Servizio attivato: ora le canzoni si pubblicano anche col computer spento", 5000);
    } catch (e) {
      LS.set("mb.chiave", "");
      if (stato) stato.textContent = "Non riesco a parlare col servizio. Riprova fra poco.";
    }
  });
  /* Ste: il tasto in alto delle playlist l'ho tolto, non gli serve piu'.
     Le playlist si aprono dalle linguette sopra la libreria, col "+" per
     crearne una, e dal menu "Altro". Con lui spariva anche quel numero nel
     cerchio rosso in alto a destra, che non sapeva cosa fosse. */
  $("btnNuovaPlaylist").addEventListener("click", () => creaPlaylist());
  $("btnTornaDallePlaylist").addEventListener("click", () => chiudiPanelPlaylist());
  $("playlistPanel").addEventListener("click", (e) => { if (e.target === $("playlistPanel")) chiudiPanelPlaylist(); });
  $("btnAltro").addEventListener("click", () => {
    const m = $("menuAltro");
    if (m && m.hidden) _apriAltro(); else _chiudiAltro();
  });
    $("statsClose").addEventListener("click", chiudiStatistiche);
      $("statsPanel").addEventListener("click", (e) => {
      if (e.target === $("statsPanel")) chiudiStatistiche();
      });
      $("btnCopertine").addEventListener("click", cercaTutteLeCopertine);
      $("coverClose").addEventListener("click", _chiudiPannelloCopertine);
      $("coverPanel").addEventListener("click", (e) => {
      if (e.target === $("coverPanel")) _chiudiPannelloCopertine();
      });
  $("offlineClose").addEventListener("click", closeOffline);
  $("offlinePanel").addEventListener("click", (e) => {
    if (e.target === $("offlinePanel")) closeOffline();
  });
  $("btnOfflineAll").addEventListener("click", downloadAllOffline);
  $("btnOfflineFree").addEventListener("click", freeOffline);
  $("btnSeleziona").addEventListener("click", () => {
  if (_inSelezione) _chiudiSelezione();
  else _apriSelezione();
});
$("selPlaylist").addEventListener("click", () => { _chiudiMenuSelezione(); _selezionaAggiungiPlaylist(); });
$("selSolo").addEventListener("click", () => { _chiudiMenuSelezione(); _selezionaSoloInPlaylist(); });
$("selFuoriPl").addEventListener("click", () => { _chiudiMenuSelezione(); _selezionaTogliDallaPlaylist(); });
$("selElimina").addEventListener("click", () => { _chiudiMenuSelezione(); _selezionaElimina(); });
   $("selScarica").addEventListener("click", () => { _chiudiMenuSelezione(); _scaricaSelezionati(); });
$("selPorta").addEventListener("click", () => { _chiudiMenuSelezione(); _selezionaPortaNellaMia(); });
$("selMenuBtn").addEventListener("click", () => {
    const menu = $("selMenu");
    if (!menu) return;
    if (menu.hidden) _apriMenuSelezione();
    else _chiudiMenuSelezione();
  });
  /* Ste: "ma cosi' non occupa spazio nel telefono?". Interruttore per
     accendere e spegnere il download automatico delle canzoni nuove, e la
     riga si accende come le altre del menu quando e' attivo. */
  try {
    $("btnScaricaDaSolo").addEventListener("click", () => {
      _chiudiAltro();
      const acceso = LS.get("mb.scaricaDaSolo", "si") === "si";
      LS.set("mb.scaricaDaSolo", acceso ? "no" : "si");
      toast(acceso
        ? "Ora non scarico piu' da sole le canzoni nuove"
        : "Ora scarico da sola le canzoni nuove (con un tetto di spazio)");
    });
    _disegnaScaricaDaSolo();
  } catch (e) { /* noop */ }

  /* Ste: "in teoria io ho scaricato tutte le canzoni del mio account, ma
     accanto alla canzone mi spunta ancora la nuvoletta".

     Motivo: lo scaricamento automatico aveva un tetto di 500 MB, e la
     libreria sono oltre 400 canzoni: quindi la maggior parte non era
     mai stata scaricata, e la nuvoletta tornava SEMPRE. Il tetto non
     era regolabile da nessuna parte.

     Ora c'e' una voce che chiede quanto vuoi tenere offline, e con
     "tutto" non c'e' tetto (fino a quando il telefono ha spazio). */
  try {
    $("btnTettoScarica").addEventListener("click", async () => {
      _chiudiAltro();
      const ora = Number(LS.get("mb.tettoScarica-" + profile, "500")) || 500;
      const scelte = [
        { mb: "200", testo: "200 MB (poco)" },
        { mb: "500", testo: "500 MB (quanto basta)" },
        { mb: "2000", testo: "2 GB" },
        { mb: "10000", testo: "10 GB" },
        { mb: "999999", testo: "Tutto quello che entra (senza tetto)" }
      ];
      const chiedi = await _scegliTettoScarica(ora, scelte);
      if (chiedi) {
        LS.set("mb.tettoScarica-" + profile, String(chiedi));
        toast("Tetto di scaricamento: " + (chiedi === "999999" ? "senza tetto" : chiedi + " MB"));
      }
    });
    _disegnaTettoScarica();
  } catch (e) { /* noop */ }
$("selAnnulla").addEventListener("click", () => { _chiudiSelezione(); });

$("btnProfile").addEventListener("click", openProfile);

    /* Interruttore "vedi anche le canzoni degli altri".

       Non toglie niente a nessuno: e' solo uno sguardo. Se lo spegni torni a
       vedere solo la tua libreria, e le canzoni degli altri sono ancora
       dove sono. */
    /* Ste: "togli questa cosa dell'interruttore, se voglio vedere le canzoni
       degli altri basta che vado nel suo profilo". I due interruttori ("vedi
       anche le canzoni degli altri" e "fai suonare anche le canzoni degli
       altri") non servono piu': sono spariti dal menu dei profili e dai
       filtri. Ora le canzoni di un amico le vedi entrando nel suo profilo, e
       per averne qualcuna nella tua la selezioni e la sposti. */

    /* Creare un profilo nuovo, senza dover aspettare che io cambi il sito.
       Serve per gli amici: ognuno sul suo telefono scrive il suo nome e gli
       resta. I brani che aggiunge vengono messi sotto quel nome. */
    (function collegaCreaProfilo() {
      const campo = $("nuovoProfNome");
      const tasto = $("btnCreaProfilo");
      if (!campo || !tasto) return;
      const crea = () => {
        const nome = String(campo.value || "").trim().slice(0, 24);
        if (!nome) return;
        const eraGia = profileList().some((x) => x.toLowerCase() === nome.toLowerCase());
        const salvato = _aggiungiProfiloLocale(nome);
        campo.value = "";
        renderProfiles();
        if (!eraGia) {
          closeProfile();
          switchProfile(salvato || nome);
          toast('Fatto: ora ascolti come "' + nome + '". I brani che aggiungi sono suoi.');
        } else {
          toast('"' + nome + '" c\'era gia\'');
        }
      };
      tasto.addEventListener("click", crea);
      campo.addEventListener("keydown", (e) => { if (e.key === "Enter") crea(); });
    })();
  $("profileClose").addEventListener("click", closeProfile);
  $("profilePanel").addEventListener("click", (e) => {
    if (e.target === $("profilePanel")) closeProfile();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (audio) {
        syncPlayUI();
        updateMediaSession();
      }
      if (swReg) swReg.update().catch(() => {});
      checkForNewSongs();
    }
    savePos();
  });
  setInterval(() => {
    if (!document.hidden) checkForNewSongs();
  }, 60000);
  window.addEventListener("pagehide", savePos);
  window.addEventListener("resize", updatePlayerHeight);
  window.addEventListener("orientationchange", updatePlayerHeight);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", updatePlayerHeight);
  /* Ste: il worker veniva controllato ogni 3 minuti E ogni 10 (due timer
     insieme, per non so cosa). Con uno solo l'app smette di andare a
     controllare in continuazione se c'e' una versione nuova. */
  setInterval(() => {
    if (swReg) swReg.update().catch(() => {});
  }, 600000);
  /* Ogni 3 secondi guardo che la musica stia davvero camminando: il telefono
     con lo schermo spento dice "e' partito" ma poi e' muto. */
  setInterval(_controllaCheSuoni, 3000);

  /* ---------- Playlist ----------
     Le playlist sono DENTRO l'app, non un file da aprire altrove.
     Ogni playlist e' un nome con dentro i brani che ho scelto io.
     Non toccano la libreria: un brano puo' stare in tre playlist e nella
     libreria insieme, e se elimino una playlist i brani restano dove sono. */

  function _playlistCercata(nome) {
    const pulito = String(nome || "").trim().toLowerCase();
    return playlists.find((p) => String(p.name || "").trim().toLowerCase() === pulito);
  }

  /* Ritorna la playlist con quel nome; se non c'e' la crea. */
  function _playlistConNome(nome, trackId) {
    const pulito = String(nome || "").trim() || "Nuova playlist";
    let pl = _playlistCercata(pulito);
    if (!pl) {
      pl = { id: "pl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), name: pulito, tracks: [] };
      playlists.push(pl);
    }
    if (trackId && !pl.tracks.includes(trackId)) pl.tracks.push(trackId);
    saveCurrentState();
    return pl;
  }

  /* Chiede un nome all'utente. Se chiude senza scrivere, non faccio nulla:
     non creo playlist a caso. */
  function _chiediNome(messaggio, valoreIniziale) {
    try {
      const r = window.prompt(messaggio, valoreIniziale == null ? "Nuova playlist" : valoreIniziale);
      return r === null ? "" : String(r).trim();
    } catch (e) {
      return valoreIniziale == null ? "Nuova playlist" : valoreIniziale;
    }
  }

  function creaPlaylist() {
    const nome = _chiediNome("Come si chiama la playlist?");
    if (!nome) return null;
      const pl = _playlistConNome(nome, "");
      _aggiornaBadgePlaylist();
      _salvaPlaylistCondivise();
      toast('Playlist "' + pl.name + '" creata. Ora puoi aggiungerci i brani.');
      /* Adesso le playlist stanno nella libreria, con le linguette sopra:
         non apro piu' la finestra a parte, mostro la libreria con la nuova
         playlist gia' selezionata. */
      _playlistAttiva = pl.name;
      _disegnaLinguettePlaylist();
      render();
      return pl;
  }

  /* Aggiunge il brano alla playlist scelta. Usata dal menu del brano. */
  function aggiungiAPlaylist(trackId) {
    const t = tracks.find((x) => x.id === trackId);
    if (!t) return;
    const nomi = playlists.map((p) => p.name);
    const testo = 'Aggiungi "' + t.title + '" a una playlist' +
      (nomi.length
        ? "\n\nSe ne hai gia' una, scrivi il suo nome:\n  " + nomi.join("\n  ") +
          "\n\nAltrimenti scrivi un nome nuovo e la creo io."
        : "\n\nNon hai ancora playlist: scrivi il nome e la creo.");
    const nome = _chiediNome(testo);
    if (!nome) return;
    const pl = _playlistConNome(nome, trackId);
      _aggiornaBadgePlaylist();
      _salvaPlaylistCondivise();
      toast('"' + t.title + '" aggiunto a "' + pl.name + '"');
  }

  /* Toglie un brano dalla playlist. I brani NON vengono tolti da nessun
     altrove: solo da quella playlist. */
  function togliDaPlaylist(trackId, nomePlaylist) {
    const pl = _playlistCercata(nomePlaylist);
    if (!pl || !pl.tracks) return;
    const cEra = pl.tracks.includes(trackId);
    pl.tracks = pl.tracks.filter((id) => id !== trackId);
      saveCurrentState();
      _salvaPlaylistCondivise();
      if (cEra) {
      const t = tracks.find((x) => x.id === trackId);
      toast('"' + (t ? t.title : "Brano") + '" tolto da "' + pl.name + '"');
    }
  }

function _aggiornaBadgePlaylist() {
      /* Il tasto in alto delle playlist e il suo numero sono spariti (non
         servivano piu'), quindi qui resta solo l'aggiornamento delle
         linguette sopra la libreria. */
      try { _disegnaLinguettePlaylist(); } catch (e) { /* noop */ }
    }

  /* Quando suono una playlist, il brano dopo e' il suo, non quello dopo
     della libreria. */
  let _playlistSuona = [];
  let _posizionePlaylist = -1;
  function _suonaPlaylist(pl) {
    const brani = (pl.tracks || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    if (!brani.length) { toast("Playlist \"" + pl.name + "\": non c'e' nessun brano"); return; }
    _playlistSuona = brani.map((t) => t.id);
    _posizionePlaylist = 0;
    chiudiPanelPlaylist();
    playById(_playlistSuona[0]);
  }
  /* Va al brano dopo della playlist; se e' finita, torna alla libreria. */
  function _avantiInPlaylist() {
    if (_posizionePlaylist < 0 || !_playlistSuona.length) return "";
    _posizionePlaylist++;
    if (_posizionePlaylist >= _playlistSuona.length) {
      _posizionePlaylist = -1;
      _playlistSuona = [];
      return "";
    }
    return _playlistSuona[_posizionePlaylist];
  }

  function renderPlaylist() {
    const lista = $("playlistLista");
    const titolo = $("playlistTitolo");
    if (!lista) return;
    lista.innerHTML = "";

    /* Se sto guardando dentro una playlist, mostro i suoi brani. */
    if (_playlistAperta) {
      const pl = _playlistCercata(_playlistAperta);
      if (titolo) titolo.textContent = pl ? pl.name : "Playlist";
      if (!pl || !(pl.tracks || []).length) {
        const li = document.createElement("li");
        li.className = "playlist-avviso";
        li.textContent = "Questa playlist e' vuota. Tocca un brano nella libreria e scegli 'Aggiungi alla playlist'.";
        lista.appendChild(li);
      }
      for (const id of (pl ? pl.tracks : [])) {
        const t = tracks.find((x) => x.id === id);
        if (!t) continue;
        const li = document.createElement("li");
        li.className = "playlist-voce";
        const nome = document.createElement("button");
        nome.type = "button";
        nome.className = "playlist-nome";
        nome.textContent = t.title;
        nome.addEventListener("click", () => { chiudiPanelPlaylist(); playById(t.id); });
        const togli = document.createElement("button");
        togli.type = "button";
        togli.className = "playlist-togli";
        togli.textContent = "Togli";
        togli.addEventListener("click", () => { togliDaPlaylist(t.id, pl.name); renderPlaylist(); });
        li.appendChild(nome);
        li.appendChild(togli);
        lista.appendChild(li);
      }
      const indietro = document.createElement("button");
      indietro.type = "button";
      indietro.className = "confirm-no";
      indietro.textContent = "Tutte le playlist";
      indietro.addEventListener("click", () => { _playlistAperta = ""; renderPlaylist(); });
      lista.appendChild(indietro);

      /* Creare una playlist anche da qui, cosi' il "+" delle linguette e
         il menu Altro fanno la stessa cosa. */
      const nuova = document.createElement("button");
      nuova.type = "button";
      nuova.className = "confirm-no torna";
      nuova.textContent = "Crea una playlist";
      nuova.addEventListener("click", () => creaPlaylist());
      lista.appendChild(nuova);

      /* Qui decido IO quale playlist nascondere: il tasto sta dentro la
         playlist che sto guardando, quindi si vede solo quella e non
         rischio di nascondere quella sbagliata. */
      const quanti = (pl.tracks || []).length;
      if (quanti) {
        const gia = (pl.tracks || []).filter((id) => _soloInPlaylist.has(_chiaveSoloInPlaylist(id)) || _soloInPlaylist.has(id)).length;
        if (gia < quanti) {
          const via = document.createElement("button");
          via.type = "button";
            via.className = "confirm-no pericolo";
            via.textContent = "Sposta i brani di questa playlist fuori dalla libreria (" + (quanti - gia) + ")";
            via.title = "Restano suonabili qui dentro, ma non li vedi piu' nella libreria. " +
              "Puoi sempre riportarli indietro da questo stesso posto.";
            via.addEventListener("click", async () => {
              const si = await askConfirm(
                "Spostare i brani fuori dalla libreria?",
                "I " + (quanti - gia) + " brani di \"" + pl.name + "\" spariscono dalla libreria.\n\n" +
                "Restano suonabili qui dentro, e sul sito per gli altri. " +
                "Per riportarli: apri questa playlist e premi il tasto qui sotto.",
                "Sposta"
              );
              if (!si) return;
              for (const id of (pl.tracks || [])) _mettiSoloInPlaylist(id);
              /* Salvo anche sulla playlist: cosi' la scelta vale anche nel
                 browser e sull'altro telefono, e non solo su questo. */
              pl.nascosta = true;
              /* Mi ricordo chi l'ha nascosta: cosi' la vedo solo io e gli altri
                 non se la ritrovano in faccia nelle loro linguette. */
              pl.nascostaDa = profile;
              _salvaPlaylistCondivise();
              _disegnaLinguettePlaylist();
              renderPlaylist();
              render();
              toast('I brani di "' + pl.name + '" si vedono solo dentro la playlist, su tutti i dispositivi');
          });
          lista.appendChild(via);
        }
        if (gia) {
          const torna = document.createElement("button");
          torna.type = "button";
          torna.className = "confirm-no torna";
          torna.textContent = "Riporta in libreria (" + gia + ")";
          torna.title = "Questi brani tornano a comparire nella libreria normale";
          torna.addEventListener("click", async () => {
            const si = await askConfirm(
              "Riportare in libreria?",
              gia + (gia === 1 ? " brano torna" : " brani tornano") + " nella libreria normale di \"" + pl.name + "\".",
              "Riporta"
            );
              if (!si) return;
              for (const id of (pl.tracks || [])) _togliSoloInPlaylist(id);
              pl.nascosta = false;
              pl.nascostaDa = "";
              _salvaPlaylistCondivise();
              _disegnaLinguettePlaylist();
              renderPlaylist();
              render();
            toast(gia + (gia === 1 ? " brano e' di nuovo" : " brani sono di nuovo") + " in libreria");
          });
          lista.appendChild(torna);
        }
      }
      return;
    }

    if (titolo) titolo.textContent = "Le tue playlist";
    if (!playlists.length) {
      const li = document.createElement("li");
      li.className = "playlist-avviso";
      li.textContent = "Non hai ancora playlist. Tocca 'Nuova playlist' qui sopra per creare la prima.";
      lista.appendChild(li);
    }
    for (const pl of playlists) {
      /* Come per le linguette: una playlist nascosta non compare agli altri. */
      if (pl.nascosta === true && pl.nascostaDa && pl.nascostaDa !== profile) continue;
      const brani = (pl.tracks || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
      const li = document.createElement("li");
      li.className = "playlist-voce";

      const nome = document.createElement("button");
      nome.type = "button";
      nome.className = "playlist-nome";
      nome.textContent = pl.name || "senza nome";
      nome.addEventListener("click", () => { _playlistAperta = pl.name; renderPlaylist(); });

      const conta = document.createElement("span");
      conta.className = "playlist-conta";
      conta.textContent = brani.length ? brani.length + (brani.length === 1 ? " brano" : " brani") : "vuota";

      const suona = document.createElement("button");
      suona.type = "button";
      suona.className = "playlist-suona";
      suona.textContent = "Ascolta";
      suona.disabled = !brani.length;
      suona.addEventListener("click", () => _suonaPlaylist(pl));

      const elimina = document.createElement("button");
      elimina.type = "button";
      elimina.className = "playlist-togli";
      elimina.textContent = "Elimina";
      elimina.addEventListener("click", async () => {
        const va = await askConfirm("Eliminare la playlist?",
          'Playlist "' + pl.name + '". I brani NON vengono tolti dalla libreria.', "Elimina");
        if (!va) return;
        playlists = playlists.filter((p) => p.id !== pl.id);
        saveCurrentState();
        _salvaPlaylistCondivise();
    /* Se sto guardando proprio questa playlist e l'ho eliminata, torno
       alla libreria intera: altrimenti la lista resterebbe vuota senza
       capire perche'. */
    if (_playlistAttiva === pl.name) _playlistAttiva = "";
    _disegnaLinguettePlaylist();
    render();
    toast('Playlist "' + pl.name + '" eliminata');
      });

      li.appendChild(nome);
      li.appendChild(conta);
      li.appendChild(suona);
      li.appendChild(elimina);
      lista.appendChild(li);
    }
    _aggiornaBadgePlaylist();
  }

  let _playlistAperta = "";

  function apriPanelPlaylist() {
    const m = $("playlistPanel");
    if (!m) return;
    m.hidden = false;
    renderPlaylist();
  }
  function chiudiPanelPlaylist() {
    const m = $("playlistPanel");
    if (m) m.hidden = true;
  }

  /* ---------- I brani che sono ancora solo su questo telefono ----------
     Un brano aggiunto a mano resta nel telefono finche' non arriva al
     computer, e da lì nella libreria che vede anche gli altri. Prima non
     lo si ritentava: il brano semplicemente non saliva e non se ne
     accorgeva nessuno. Adesso si riprova ogni 2 minuti e c'e' anche un
     bottone per farlo subito. */

  /* Conta i brani che ho qui e che il computer non ha ancora. */
  function _quantiNonCondivisi() {
    try {
      return _nonCondivisiCache;
    } catch (e) {
      return 0;
    }
  }
  let _nonCondivisiCache = 0;
  let _tempoRiprova = null;

  /* Aggiorna il contatore e il bottone. */
  async function _aggiornaNonCondivisi() {
    try {
      if (!db) return;
      const tutti = await dbAll();
      const daMandare = (tutti || []).filter((r) => r && r.blob && !r.condiviso &&
        !eGiaCondiviso({ ...r, profile: r.profile || DEFAULT_PROFILE }));
      _nonCondivisiCache = daMandare.length;
      const b = $("btnCondividi");
      if (b) {
        b.hidden = !daMandare.length;
        const t = $("condividiBadge");
        if (t) t.textContent = daMandare.length > 9 ? "9+" : String(daMandare.length);
      }
    } catch (e) { /* pazienza */ }
  }

  /* Riprovo da sola ogni 2 minuti: se il computer e' acceso e siamo
     sulla pagina locale, i brani salgono senza che io debba fare niente.
     Non controllo prima se il computer risponde: condividiBraniLocali() lo
     fa gia' e, se non risponde, esce in silenzio senza rompere niente. */
  function _riprovaCondivisione() {
    if (_tempoRiprova) clearInterval(_tempoRiprova);
    _tempoRiprova = setInterval(() => {
      if (document.hidden) return;
      if (!_quantiNonCondivisi()) return;
      condividiBraniLocali();
    }, 120000);
  }

  /* Spiega come si fa quando il computer non risponde. Sulla pagina online
     (https) il browser non permette di chiamare il computer (http): li' il
     pulsante non riprova all'infinito, dice cosa fare davvero. */
  function _spiegaPercheNonVa() {
    const sicura = !!window.isSecureContext;
if (sicura) {
    /* Ste: questo messaggio era illeggibile (tagliato con i puntini).
       Ora va a capo e resta leggibile, ma con le stesse informazioni
       di prima: da dove aprire l'app. */
    toast("Qui non posso parlare col computer, perche' questa pagina e' aperta da internet e il browser non mi fa chiamare la rete di casa.\nApri l'app da qui: http://192.168.1.40:8788/app/", 9000);
  } else {
    toast("Il computer non risponde.\nSei sulla rete di casa?\nPuoi salvare a mano in: musica mp3 ste", 7000);
  }
    segnalaErrore("condivisione non riuscita: pagina " +
      (sicura ? "sicura (https: non si puo' chiamare il PC)" : "normale") +
      ", programma sul PC non raggiungibile");
  }

  /* Il bottone: manda subito tutti i brani solo di questo telefono. */
/* Il posto dove il telefono manda le canzoni quando il computer e' spento.
     Se non e' impostato (perche' la pagina e' aperta su un computer diverso,
     o il servizio non esiste ancora) la condivisione semplice funziona lo
     stesso e non succede niente di rotto. */
  const SERVIZIO_PUBBLICA = LS.get("mb.servizio", "https://musicbox-dal-telefono.stefanovillaggio8.workers.dev");
  /* Ste: "ogni volta che riavvio devo rimettere la chiave".
     Sul telefono i dati si perdono a ogni riavvio, quindi anche la chiave
     sparisce e gliela devo chiedere di nuovo. Non posso metterla dentro
     l'app perche' l'app e' pubblica e chiunque potrebbe usarla.

     Invece la chiedo al computer di casa, che la conserva lui e la consegna
     solo a chi e' sulla rete di casa. Cosi' quando sei a casa non devi
     digitare niente: la app se la prende da sola. */
  async function _prendiChiaveDalComputer() {
    try {
      if (LS.get("mb.chiave", "")) return true;
      const base = await cercaPonte();
      if (!base) return false;
      const ctl = new AbortController();
      const scad = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch(base + "/chiave", { cache: "no-store", signal: ctl.signal });
      clearTimeout(scad);
      if (!r.ok) return false;
      const j = await r.json();
      const k = String((j && j.chiave) || "").trim();
      if (!k) return false;
      LS.set("mb.chiave", k);
      segnalaErrore("chiave presa dal computer di casa");
      return true;
    } catch (e) { return false; }
  }
  const CHIAVE_PUBBLICA = LS.get("mb.chiave", "");

  /* Il brano arriva sul sito da solo, senza che il computer sia acceso.
     Restituisce l'indirizzo del brano cosi' l'app lo suona subito. */
  async function _pubblicaSulSito(r) {
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) {
      throw new Error("il servizio non e' attivo su questa pagina");
    }
    const nome = [(r.artist || ""), (r.title || "")].join(" - ")
      .replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim() || "brano";
    /* I dati vanno nelle intestazioni, non nell'indirizzo: con i parametri
       nell'indirizzo il caricamento si bloccava (provarlo e' costato una
       mezz'ora, me lo ricordo). */
    const risp = await fetch(SERVIZIO_PUBBLICA + "/aggiungi", {
      method: "POST",
      headers: {
        "content-type": "audio/mpeg",
        "x-chiave": CHIAVE_PUBBLICA,
        "x-nome": nome,
        "x-profilo": CARTELLA_PREDEFINITA === "ari" ? "Ari"
          : (CARTELLA_PREDEFINITA === "emanuela" ? "Emanuele" : "Ste")
      },
      body: r.blob
    });
    if (!risp.ok) {
      let perche = "il programma ha risposto " + risp.status;
      try { const j = await risp.json(); if (j && j.errore) perche = j.errore; } catch (e) { /* noop */ }
      throw new Error(perche);
    }
    return await risp.json();
  }

  async function _condividiAdesso() {
    const b = $("btnCondividi");
    if (b) { b.disabled = true; }
    try {
      const daMandare = await _braniDaMandare();
      if (!daMandare.length) { toast("Non ci sono brani da mandare"); return; }
      toast("Sto pubblicando " + daMandare.length + " brani...");
      /* Prima provo col computer acceso: e' piu' veloce e mantiene anche la
         copia nella cartella. Se il computer non c'e', vado sul servizio. */
      const online = await ponteOnline();
      if (online) {
        await condividiBraniLocali(true);
        setTimeout(_aggiornaNonCondivisi, 4000);
        return;
      }
      let fatti = 0;
      const problemi = [];
      for (const r of daMandare) {
        try {
          await _pubblicaSulSito(r);
          r.condiviso = true;
          try { await dbPut(r); } catch (e2) { /* va bene anche senza */ }
          fatti++;
        } catch (e) {
          problemi.push(String((e && e.message) || e).slice(0, 60));
        }
      }
      toast(fatti
        ? "Pubblicati " + fatti + (fatti === 1 ? " brano" : " brani") + ": sono sul sito e si sentono subito"
        : "Pubblicazione fallita: " + (problemi[0] || "errore sconosciuto"), problemi.length ? 7000 : 0);
      await _aggiornaNonCondivisi();
    } finally {
      if (b) { b.disabled = false; }
    }
  }

  /* I brani che ho qui e che il computer (o il sito) non hanno ancora. */
  async function _braniDaMandare() {
    if (!db) return [];
    try {
      const tutti = await dbAll();
      return (tutti || []).filter((r) => r && r.blob && r.blob.size && !r.condiviso &&
        !eGiaCondiviso({ ...r, profile: r.profile || DEFAULT_PROFILE }));
    } catch (e) { return []; }
  }

  /* ---------- Tieni lo schermo acceso e timer di sonno ----------
   Tieni lo schermo acceso: il telefono non si blocca mentre ascolti. Non
   costa soldi (niente e' a pagamento), ma la batteria dura un po' meno.
   Timer: si ferma da solo dopo un po', cosi' di notte non continua a
   suonare. Quando finisce, spegne anche lo schermo acceso: e' quello che
   hai chiesto, non lasciare il telefono acceso tutta la notte. */

let _bloccoSchermo = null;
let _schermoVoluto = false;
let _timerFine = 0;
let _timerGiro = null;

const TIMER_SCELTE = [15, 30, 60, 0];
/* Quale dei tempi e' scelto adesso. Parte dal primo (15 minuti) e ogni tocco
   sul tasto passa al successivo, arrivando a 0 = spento. */
let _minutiTimer = TIMER_SCELTE[0];

async function _accendiSchermo() {
  try {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return false;
    if (_bloccoSchermo) return true;
    _bloccoSchermo = await navigator.wakeLock.request("screen");
    return true;
  } catch (e) { return false; }
}

async function _spegneSchermo() {
  try {
    if (_bloccoSchermo) { await _bloccoSchermo.release(); }
  } catch (e) { /* gia' spento */ }
  _bloccoSchermo = null;
}

function _disegnaTimer() {
  const b = $("btnTimer");
  const badge = $("timerBadge");
  if (!b || !badge) return;
  const resta = Math.max(0, Math.ceil((_timerFine - Date.now()) / 60000));
  const acceso = _schermoVoluto;
  if (b.classList) b.classList.toggle("on", acceso);
  if (resta > 0) {
    badge.hidden = false;
    badge.textContent = resta + "'";
    b.title = "Si ferma fra " + resta + " minuti (tocca per cambiare)";
  } else {
    badge.hidden = true;
    b.title = "Timer: si ferma dopo un po'";
  }
}

/* Quando si torna sull'app, il blocco dello schermo va richiesto di nuovo:
   il telefono lo perde da solo ogni volta che lo blocchi. */
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      /* Torno in primo piano: se volevo lo schermo acceso lo riprendo, e
         riaccendo anche il controllo che porta avanti la musica. */
      if (_schermoVoluto) { _accendiSchermo(); _accendiSonda(); }
      /* Ste: "i tasti delle cuffie devono ripartire la musica di musicbox".
         Riprendo anche la sessione audio: se nel frattempo l'ha presa
         un'altra app, io la riprendo. */
      try { if (current()) { updateMediaSession(); _accendiSilenzio(); setPlaybackState("playing"); } } catch (e) { /* noop */ }
      _disegnaTimer();
    } else if (_bloccoSchermo) {
    /* non lo tengo: il telefono e' gia' spento, e tenerlo occuperebbe
       batteria senza servire a niente */
    _bloccoSchermo = null;
  } else {
    /* Ste: "la notifica in alto deve restare fino quando chiudo l'app".
       Motivo: andando in secondo piano l'app diceva al telefono "non sto
       suonando niente", e allora la notifica della musica spariva (e i
       tasti delle cuffie tornavano a un'altra app). Qui la sessione resta
       la nostra: la notifica resta finche' l'app e' aperta e sparisce
       solo quando chiudi l'app del tutto. */
    try {
      if (current()) {
        updateMediaSession();
        setPlaybackState(audio && !audio.paused ? "playing" : "paused");
      }
    } catch (e) { /* noop */ }
  }
});

$("btnSchermo").addEventListener("click", async () => {
      if (_schermoVoluto) {
        _schermoVoluto = false;
        await _spegneSchermo();
        _spezniSonda();
        toast("Schermo normale: si blocca come sempre");
        _disegnaTimer();
        return;
      }
      const va = await _accendiSchermo();
      if (!va) {
        toast("Questo telefono non me lo lascia fare. Continua a funzionare tutto, ma lo schermo si blocca");
        return;
      }
      _schermoVoluto = true;
      _accendiSonda();
      toast("Schermo acceso mentre ascolti: puoi cambiare app, la musica va avanti. Per spegnerlo: tocca di nuovo, o usa il timer", 6000);
      _disegnaTimer();
    });

$("btnTimer").addEventListener("click", () => {
  /* Ste: i minuti devono potersi scegliere davvero. Prima il tasto partiva
     sempre da 15 e gli altri valori erano solo scritti e mai usati, quindi
     30 e 60 non esistevano. Ora ogni tocco passa al tempo successivo
     (15 -> 30 -> 60 -> spento) e parte subito col nuovo. */
  if (_timerFine) {
    /* il timer sta girando: riparto dal primo valore e azzero il conto */
    clearInterval(_timerGiro); _timerGiro = null;
    _timerFine = 0;
  }
  _minutiTimer = TIMER_SCELTE[(TIMER_SCELTE.indexOf(_minutiTimer) + 1) % TIMER_SCELTE.length];
  const minuti = _minutiTimer;
  if (minuti <= 0) {
    _timerFine = 0;
    _disegnaTimer();
    toast("Timer spento");
    return;
  }
  _timerFine = Date.now() + minuti * 60000;
  _timerGiro = setInterval(() => {
    const resta = _timerFine - Date.now();
    if (resta <= 0) {
      clearInterval(_timerGiro); _timerGiro = null;
      _timerFine = 0;
      /* fermo la musica e spengo anche lo schermo acceso. Uso le funzioni
         vere (non simulo un tocco sul bottone): cosi' l'icona resta
         coerente e il brano viene segnato come fermato davvero. */
      try {
        _vuoleSuonare = false;
        if (audio && !audio.paused) audio.pause();
        syncPlayUI();
      } catch (e) { /* la musica si ferma comunque */ }
      _schermoVoluto = false;
      _spegneSchermo();
      _spezniSonda();
      _disegnaTimer();
      toast("Timer finito: buonanotte");
    } else {
      _disegnaTimer();
    }
  }, 20000);
  _disegnaTimer();
  toast("Si ferma fra " + minuti + " minuti (tocca di nuovo per cambiare)");
});

  /* ---------- Le playlist seguono il brano su ogni dispositivo ----------
     Prima stavano solo dentro il telefono: creavi una playlist sul telefono
     e non la vedevi da nessun'altra parte. Adesso stanno in un file del sito
     (playlist.json): sono le stesse ovunque, e cambiando telefono ci sono
     ancora. Se il servizio non e' attivo su questa pagina, funziona tutto
     come prima, solo in locale. */

  /* ---------- Nascosti e preferiti: gli stessi su ogni dispositivo ----------

     Prima questi due elenchi stavano solo nella memoria di quel telefono.
     L'app aperta dall'icona e la scorciatoia che avvia Safari hanno due
     memorie diverse: quindi una canzone che nascondevi da una parte compariva
     dall'altra, e i cuoricini valevano meta'.

     Adesso stanno anche in stato.json, sul sito, che si legge anche senza
     chiave (e' pubblico, come playlist.json).

     Quando pero' tolgo un brano NON lo cancello dal sito: lo aggiunto a una
     lista di "tornano indietro", altrimenti basterebbe un tocco sbagliato per
     farlo sparire per sempre da tutti i dispositivi. */

  let _timerStatoCondiviso = null;
  let _statoCondivisoOk = false;

  let _statoDaSalvare = false;
  let _timerRiprovaStato = null;
  let _quanteRiprove = 0;
  /* Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
     Prima il nome finiva solo nella memoria del telefono e basta: se il
     computer era spento, o la rete non rispondeva, il salvataggio si perdeva
     in silenzio e il brano tornava col nome vero al riavvio.

     Adesso, se non riesco a salvare, riprovo piu' tardi da solo (fino a un
     po' di volte): appena il computer torna raggiungibile, il nome parte
     senza che tu debba fare niente. */
  function _programmaDiRiprovare() {
    if (!_statoDaSalvare) return;
    /* Riprovo a lungo: il nome deve aspettare il momento giusto (tornare sul
       Wi-Fi di casa), non dimenticarsi dopo trenta secondi. */
    if (_quanteRiprove >= 120) return;
    clearTimeout(_timerRiprovaStato);
    _timerRiprovaStato = setTimeout(() => {
      _quanteRiprove++;
      _salvaStatoCondiviso();
    }, 15000);
  }
  /* Appena la rete torna, riprovo subito invece di aspettare il giro dopo. */
  try {
    window.addEventListener("online", () => {
      if (_statoDaSalvare) { _quanteRiprove = 0; _salvaStatoCondiviso(); }
    });
  } catch (e) { /* noop */ }

  /* === La tomba dei brani rimessi in lista ===

   Ste: "le rimetto e funzionano, ma quando riavvio l'app si tolgono di
   nuovo". Il motivo era questo: all'avvio l'app rilegge stato.json dal
   sito e UNISCE i brani nascosti a quelli che ha gia' nella testa. Un
   brano che avevo appena rimesso in lista tornava cosi' nascosto, e
   sembrava che il rimettere non fosse servito a niente.

   Il sito pero' si aggiorna con qualche secondo di ritardo, e finche'
   non si aggiorna il file vecchio continua a mandare indietro quei
   brani. Serve un segno che dica "quuesto l'ho rimesso io, non
   rimetterlo".

   Il segno e' una lista di nomi rimossi, tenuta sul telefono. Quando
   invece nascondi un brano di nuovo, il segno sparisce: la scelta piu'
   recente vince sempre. */
  function _salvaStatoCondiviso() {
    _statoDaSalvare = true;
    _quanteRiprove = 0;
    try {
      clearTimeout(_timerStatoCondiviso);
    } catch (e) { /* noop */ }
    /*Aspetto un po': se Ste preme tre cuoricini in tre secondi, non voglio
       tre richieste al computer. */
    _timerStatoCondiviso = setTimeout(async () => {
      const corpo = JSON.stringify({
        /* Ste: "togli completamente sta cosa dei nascosti": qui non ci
           sono piu' i campi dei brani nascosti. Quello che resta e' la
           lista dei brani ELIMINATI per sempre (piu' sotto), che e' la
           cosa che fa avere la stessa libreria a tutti i link. */
        preferiti: [...favorites],
  /* Ste: "le statistiche non funzionano bene, i minuti ascoltati a Diego
     non spuntano". Le statistiche stavano solo nella memoria di questo
     dispositivo, quindi sull'altro link (che per il browser e' un posto
     diverso) e sugli altri apparevano a zero. Ora viaggiano anche nei dati
     condivisi, e quando arrivano tengo il numero piu' alto: cosi' due
     dispositivi non si azzerano a vicenda e i secondi non si perdono. */
  statistiche: _statisticheDiTutti(),
        /* i brani che ho copiato nella mia libreria, per ogni nome. Serve
           cosi' ritrovo la copia anche sull'altro dispositivo. */
        miei: (function () {
          try { return JSON.parse(LS.get(LS_MIEI, "{}")) || {}; } catch (e) { return {}; }
        })(),
        /* Ste: "quando modifico il nome e l'artista funziona ma quando
           riavvio l'app ritorna come prima". Il nome stava solo sul telefono
           (localStorage) e il telefono ogni tanto lo perde. Adesso lo metto
           anche qui, che e' sul sito: cosi' al riavvio torna indietro, e
          e segue anche sull'altro dispositivo. */
rinomini: (function () {
      /* Solo i nomi cambiati ADESSO su questo dispositivo, non tutta la
         lista: altrimenti un telefono con la lista vecchia sovrascrive
         i nomi nuovi messi da un altro e il nome "vibra" (vedi le tre
         funzioni spiegate piu' su, _rinominiDaMandare). */
      try {
        return _rinominiDaMandare();
      } catch (e) { return {}; }
    })(),
    /* Idem per i brani eliminati con la X: solo quelli appena eliminati,
       altrimenti un dispositivo vecchio li rimetterebbe dentro. */
    eliminati: (function () {
      try { return _eliminatiDaMandare(); } catch (e) { return []; }
    })(),
    /* E i brani che ho rimesso in lista DOPO averli eliminati: il server
       deve tirarli fuori dall'elenco degli eliminati. */
    eliminatiRimossi: (function () {
      try { return _eliminatiRimossiDaMandare(); } catch (e) { return []; }
    })(),
    /* E i brani "solo nelle playlist": anche questi stavano solo nel
       telefono, e ogni link ne aveva una diversa. */
    soloInPlaylist: (function () {
      try { return _soloInPlaylistDaMandare(); } catch (e) { return []; }
    })(),
    soloInPlaylistRimossi: (function () {
      try { return _soloInPlaylistRimossiDaMandare(); } catch (e) { return []; }
    })()
  });
      /* Adesso scrivo SOLO sul Worker. Prima scrivevo prima sul computer e,
         se andava, non scrivevo piu' da nessuna parte: ma il computer salva
         con "git push" e riscrive stato.json usando solo cinque chiavi,
         senza "eliminati". Ogni salvataggio passato di li' cancellava gli
         eliminati che il Worker aveva messo, e i due litigavano sullo
         stesso file.

         Ste: "ho nascosto delle cose ma dopo che aggiorno tornano".
         Erano due scrittori che si disfacevano a vicenda il lavoro.

         Un posto solo che scrive = nessuna gara. */
      try {
        /* Per /stato non serve la chiave: i nomi devono potersi salvare anche
           dal sito, perche' li' il browser per regola non puo' parlare col
           computer di casa e la chiave sul telefono sparisce al riavvio. */
        const intestazioni = { "content-type": "application/json" };
        if (CHIAVE_PUBBLICA) intestazioni["x-chiave"] = CHIAVE_PUBBLICA;
        const r = await fetch(SERVIZIO_PUBBLICA + "/stato", {
          method: "POST",
          headers: intestazioni,
          body: corpo
        });
        if (r.ok) { _statoCondivisoOk = true; _statoDaSalvare = false; _rinominiDaMandareSvuota(); _eliminatiDaMandareSvuota(); _eliminatiRimossiDaMandareSvuota(); _soloInPlaylistDaMandareSvuota(); _soloInPlaylistRimossiSvuota(); }
      } catch (e) { /* senza rete resta sul telefono, e va bene */ }
      _programmaDiRiprovare();
    }, 2500);
  }

  async function _caricaStatoCondiviso() {
    /* Ste: "da PC funziona ma da telefono no".
     Il nome da telefono arrivava gia' sul sito, ma al riavvio l'app rileggeva
     una copia VECCHIA di stato.json: il sito lo tiene in cache fino a dieci
     minuti, e il nome appena salvato non c'era ancora in quella copia.
     Per questo ora lo chiedo sempre fresco ("no-store"), e per sicurezza lo
     rileggo un paio di volte dopo l'avvio: cosi' se nel frattempo e' arrivato
     qualcosa dal PC o dall'altro dispositivo, l'app lo vede.

     Ste: "il titolo e l'artista li posso cambiare solo nell'app di github".
     Motivo: "./stato.json" aperto dal computer e' una COPIA sul disco, non
     il posto vero dove stanno i dati, e quella copia non cambia da sola.
     Adesso chiedo prima al Worker, che e' chi scrive, e uso il file solo se
     il Worker non risponde. */
try {
  if (SERVIZIO_PUBBLICA) {
  const rw = await fetch(SERVIZIO_PUBBLICA + "/stato", { cache: "no-store" });
  _diChe("worker /stato: " + (rw && rw.ok ? "risponde" : "non risponde"));
  if (rw.ok) {
  const jw = await rw.json();
  if (jw && jw.stato) {
  if (await _applicaStatoCondiviso(jw.stato)) return;
  }
  }
  }
  } catch (e) {
  /* Se qui dentro scappa un errore, la funzione finisce e non applica
     niente: me lo segno, altrimenti non si capisce perche'. */
  try { _diChe("worker /stato KO: " + String((e && e.message) || e).slice(0, 80)); } catch (x) {}
  }

    try {
      const r = await fetch("./stato.json", { cache: "no-store" });
      if (!r.ok) return;
const j = await r.json();
      await _applicaStatoCondiviso(j);
    } catch (e) { /* nessuna rete: vedo quello che ho gia' */ }
  }

  /* Mette dentro quello che arriva dal Worker o dal sito. Ritorna true se
     ha fatto qualcosa, cosi' il chiamante sa che puo' fermarsi. */
  async function _applicaStatoCondiviso(j) {
    /* La prima riga dice che siamo entrati. Prima la traccia veniva
       dopo il ciclo dei nascosti: se li' saltava qualcosa, il catch
       se lo mangiava in silenzio e io non vedevo niente. */
    try { _diChe("ENTRO: stato dal sito, nascosti " + (Array.isArray(j && j.nascosti) ? j.nascosti.length : -1)); } catch (e) { /* noop */ }
    try {
        const nasco = Array.isArray(j && j.nascosti) ? j.nascosti : [];

      /* PRIMA di tutto: la lista dei brani rimessi la prendo dal Worker.
         GitHub e il computer sono due posti diversi per il browser, e
         ognuno aveva la sua. Quello che ne aveva di piu' toglieva dai
         nascosti brani che sull'altro erano ancora nascosti: e cosi' uno
         dei due link mostrava 10 nascosti e l'altro 15, con la libreria
         identica. Il posto vero e' il Worker, quindi prendo il suo.
         Se il Worker non ha niente, non tocco niente: meglio tenere la
         lista locale che azzerarla. */
      /* Ste: "togli completamente sta cosa dei nascosti". La lista dei
         "brani ripresi" non serve piu': non esistono piu' i nascosti. */

      /* I brani che l'utente ha ELIMINATO davvero con la X valgono anche
         qui: Ste ha premuto la X dal computer, e quei brani devono stare
         eliminati anche su questo telefono.

         Ma solo quelli del PROFILO aperto: la chiave e' "profilo.id", e
         cosi' quello che ho eliminato io non sparisce dalla libreria di
         Diego. */
      if (Array.isArray(j && j.eliminati) && j.eliminati.length) {
        try {
          const el = LS.get("mb.eliminati", null) || {};
          let nuovi = 0;
          for (const id of j.eliminati) {
            /* Le chiavi vecchie (senza profilo) erano eliminazioni globali,
               e falsavano la libreria degli altri. Le metto col profilo
               principale, cosi' il brano che avevo eliminato resta
               eliminato per me e non tocca la libreria di Diego. */
            const chiave = (id && String(id).indexOf(".") < 0)
              ? DEFAULT_PROFILE + "." + String(id)
              : String(id || "");
            if (!chiave || chiave.indexOf(profile + ".") !== 0) continue;
            if (!el[chiave]) { el[chiave] = 0; nuovi++; }
          }
          if (nuovi) LS.set("mb.eliminati", el);
        } catch (e) { /* noop */ }
      }

      /* E quelli che QUALCUNO ha rimesso in lista dopo averli eliminati:
         tolgo la chiave dalla mia lista, cosi' il brano torna davvero.
         Prima questo passaggio non esisteva, e il brano restava
         "eliminato" su questo telefono anche se l'avevo rimesso. */
      if (Array.isArray(j && j.eliminatiRimossi) && j.eliminatiRimossi.length) {
        try {
          const el = LS.get("mb.eliminati", null) || {};
          let tolti = 0;
          for (const chiave of j.eliminatiRimossi) {
            if (!chiave || String(chiave).indexOf(profile + ".") !== 0) continue;
            if (el[chiave]) { delete el[chiave]; tolti++; }
          }
          if (tolti) { LS.set("mb.eliminati", el); cambiati++; }
        } catch (e) { /* noop */ }
      }
        const prefs = Array.isArray(j && j.preferiti) ? j.preferiti : [];
        let cambiati = 0;
        /* Unisco, non sostituisco: cosi' quello che ho scelto qui non sparisce
           e diventa solo piu' grande. */
for (const id of prefs) if (id && !favorites.has(id)) { favorites.add(id); cambiati++; }

        /* Ste: "alcune volte mi vengono nascoste canzoni a caso".
         Lo stato condiviso arriva da altri dispositivi e da altri
         momenti. Se contiene un id che in questa libreria non esiste,
         non lo aggiungo: un id che non c'e' non nasconde nulla, ma
         resta li' eauhccando i contatori, e se domani torna fuori quel
un brano lo troverebbe gia' "nascosto" senza che nessuno l'avesse
          nascosto. */
        /* Ste: "alcune volte mi vengono nascoste canzoni a caso".
           Avevo messo un filtro che scartava gli id "che non esistono in
           questa libreria". Ma qui la libreria NON e' ancora stata
           caricata: tracks e' vuoto, quindi il filtro scartava TUTTO
           quello che arrivava dal sito e i brani nascosti tornavano
           visibili. Ste: "ho nascosto delle cose, aggiorno, e tornano".
           Era un mio filtro a fare il danno.

           Adesso metto dentro tutto, e l'eventuale id in piu' lo segno
           DOPO, quando la libreria c'e' gia'. Un id che non corrisponde a
           nulla non fa sparire niente: al massimo un contatore che non
           torna. */
        /* Ste: "togli completamente sta cosa dei nascosti". Non c'e' piu'
           nessuna lista di brani nascosti: quello che arriva dal server
           con questo nome viene ignorato. I brani che vuoi togliere si
           eliminano con "Elimina", che chiede conferma e cancella per
           sempre (e quello viaggia su tutti i link). */
  /* Anche i minuti ascoltati arrivano da qui: senza questo, sull'altro
     dispositivo le statistiche erano tutte a zero. */
  if (j && j.statistiche) cambiati += _unisciStatistiche(j.statistiche);
  /* Ste: "togli completamente sta cosa dei nascosti": qui non c'e' piu'
     niente da togliere, i "brani ripresi" non esistono piu'. */
        /* I brani copiati nella mia libreria: devono valere anche sull'altro
           dispositivo, quindi li metto in elenco insieme a tutto il resto. */
        if (j && j.miei && typeof j.miei === "object") {
          try {
            const miei = JSON.parse(LS.get(LS_MIEI, "{}")) || {};
            for (const nome of Object.keys(j.miei)) {
              const lista = Array.isArray(j.miei[nome]) ? j.miei[nome] : [];
              const mia = new Set(Array.isArray(miei[nome]) ? miei[nome] : []);
              for (const id of lista) {
                const s = String(id || "");
                if (s && !mia.has(s)) { mia.add(s); cambiati++; }
              }
              miei[nome] = [...mia].sort();
            }
            LS.set(LS_MIEI, JSON.stringify(miei));
          } catch (e) { /* noop */ }
        }
        /* I brani copiati nella mia libreria: devono valere anche sull'altro
dispositivo, quindi li metto in elenco insieme a tutto il resto. */
    if (j && j.rinomini && typeof j.rinomini === "object") {
      /* Ste: il nome che avevi cambiato tornava com'era al riavvio, perche'
         stava solo sul telefono. Se lo ritrovo qui, lo rimetto. */
      try {
        const mappa = nomiRinomati();
        let rimessi = 0;
for (const k of Object.keys(j.rinomini)) {
      const r = j.rinomini[k];
      if (!r || (!r.title && !r.artist)) continue;
      /* Se questo nome l'ho cambiato adesso e non e' ancora partito, il
         sito ha ancora il vecchio: non lo prendo, altrimenti il nome torna
         indietro mentre sto cercando di salvarlo. */
      try {
        const inAttesa = _rinominiDaMandare();
        if (inAttesa[k]) continue;
      } catch (e) { /* noop */ }
      const mia = mappa[k];
          if (!mia || mia.title !== (r.title || "") || mia.artist !== (r.artist || "")) {
            mappa[k] = { title: String(r.title || ""), artist: String(r.artist || "") };
            rimessi++;
          }
        }
        if (rimessi) { LS.set("mb.rinomini", mappa); cambiati++; }
      } catch (e) { /* noop */ }
    }
/* Ste: "226 da entrambe, poi 227 su github a caso". I brani "solo nelle
  playlist" stavano salvati nel telefono, e ogni link ne aveva una diversa.

  Qui prendo quella lista dal Worker, come faccio per i nascosti: se il
  Worker risponde, e' lui la verita'. */
  if (Array.isArray(j && j.soloInPlaylist)) {
    try {
      const fuori = new Set(Array.isArray(j.soloInPlaylistRimossi) ? j.soloInPlaylistRimossi : []);
      /* Le chiavi vecchie (senza profilo) erano globali: riguardavano
         anche la libreria degli altri. Ste: "si sono tolte 2 canzoni
         nell'account di diego". Le metto con il profilo principale, cosi'
         non toccano piu' gli altri account. */
      const giusto = j.soloInPlaylist
        .filter(function (id) { return id && !fuori.has(id); })
        .map(function (id) {
          return String(id).indexOf(".") >= 0 ? String(id) : DEFAULT_PROFILE + "." + String(id);
        });
      const stessi = giusto.length === _soloInPlaylist.size &&
        giusto.every(function (id) { return _soloInPlaylist.has(id); });
      if (!stessi) {
        _soloInPlaylist = new Set(giusto);
        _salvaSoloInPlaylist();
        cambiati++;
      }
    } catch (e) { /* noop */ }
  }

  /* Ste: "la libreria che ho su github e' diversa da quella su tailscale".
     La chiamo DOPO che ho applicato tutto (nascosti, nomi, eliminati) e
     DOPO che la libreria e' stata ricaricata: cosi' conta davvero e non
     un numero di mezzo lavoro. */

  /* La chiamo SEMPRE, non solo quando qualcosa e' cambiato: altrimenti
     se non cambia niente non mi arriva mai la riga, e io resto al buio
     proprio quando i due link coincidono. */
  try { setTimeout(_diCheFinale, 1200); } catch (e) { /* noop */ }

  if (cambiati) {
    saveCurrentState();
    /* Ricarico davvero la libreria, non la ridisegno: le canzoni appena
       copiate devono comparire SUBITO, senza dover riaprire l'app. */
    try { await loadAll(); } catch (e) { /* noop */ }
    render();
    return true;
    }
    return false;
    } catch (e) { /* nessuna rete: vedo quello che ho gia' */ }
    return false;
  }

  /* Unisco le playlist arrivate da fuori a quelle che ho gia' qui. */
function _unisciPlaylistCondivise(arrivate) {
  /* Quelle che ho qui sono le piu' fresche: se la stessa playlist e' anche nel
     sito, tengo la mia per i brani, ma la scelta "nascondila dalla libreria"
     la rispetto sempre, altrimenti su un dispositivo nuovo i brani nascosti
     ricompaiono in libreria. */
  let nuove = 0;
  for (const p of arrivate) {
    if (!p || !p.name) continue;
    if (_playlistCercata(p.name)) {
      const gia = _playlistCercata(p.name);
      if (gia && p.nascosta === true) {
          gia.nascosta = true;
          gia.nascostaDa = String(p.nascostaDa || "");
        }
      const nomeP = String((gia && gia.name) || (p && p.name) || "").trim().toLowerCase();
      /* Ste: "non accorciare mai la gym". Se arriva dal server più corta della
         nostra, teniamo la nostra e la rimandiamo. Se arriva più lunga, invece
         aggiorniamo (per coprire il caso in cui è stata aggiunta altrove). */
      if (nomeP === "gym") {
        const suoiGym = Array.isArray(gia && gia.tracks) ? gia.tracks : [];
        const arrivatiGym = (Array.isArray(p.tracks) ? p.tracks : [])
          .filter((t) => /^b-track-\d+$/.test(String(t)));
        if (arrivatiGym.length > suoiGym.length) {
          gia.tracks = arrivatiGym;
          if (!gia.id) gia.id = String(p.id || "pl-gym");
          nuove++;
        }
        /* Se arrivatiGym.length <= suoiGym.length: ignoriamo, non accorciamo. */
        continue;
      }
      /* Una playlist che qui e' VUOTA e' una voce rimasta a meta', non una
         scelta di Ste: senza questo la lista non si riempiva mai e gym
         restava invisibile per sempre. Se invece ha gia' dei brani la lascio
         stare, cosi' una cancellazione fatta qui non viene ricreata. */
      const suoi = Array.isArray(gia && gia.tracks) ? gia.tracks : [];
      const arrivati = (Array.isArray(p.tracks) ? p.tracks : [])
        .filter((t) => /^b-track-\d+$/.test(String(t)));
      if (!suoi.length && arrivati.length) {
        gia.tracks = arrivati;
        if (!gia.id) gia.id = String(p.id || ("pl-" + String(p.name).toLowerCase().replace(/\s+/g, "-")));
        nuove++;
      }
      continue;
    }
    playlists.push({
      id: String(p.id || ("pl-" + String(p.name).toLowerCase().replace(/\s+/g, "-"))),
      name: String(p.name).slice(0, 60),
      nascosta: p.nascosta === true,
      /* Ste: qui prima mancava, e infatti Diego vedeva la playlist "gym"
         che Ste aveva nascosto. Senza sapere DI CHI e' la playlist, la
         regola "nascondila agli altri" non poteva scattare e la vedeva
         chiunque. */
      nascostaDa: String(p.nascostaDa || ""),
      tracks: (Array.isArray(p.tracks) ? p.tracks : []).filter((t) => /^b-track-\d+$/.test(String(t)))
    });
    nuove++;
  }
  /* La lista dei nascosti dipende anche dalle playlist: la ricalcolo e, se
     qualcosa e' cambiato, aggiorno quello che si vede. */
  const prima = [..._soloInPlaylist].join(",");
  _soloInPlaylist = _ricalcolaSoloInPlaylist();
  const dopo = [..._soloInPlaylist].join(",");
  if (prima !== dopo) {
    saveCurrentState();
    _disegnaLinguettePlaylist();
    render();
  }
  if (nuove) {
    saveCurrentState();
    _aggiornaBadgePlaylist();
  }
  return nuove;
}

async function _caricaPlaylistCondivise() {
  /* Prima provo dal Worker, che e' chi le scrive e quindi ha le piu' fresche.

     Ste: "posso modificare il titolo e l'artista solo nell'app di github, e
     nel link di tailscale mancano delle canzoni". Prima chiedevo la chiave
     segreta per LEGGERE, e chi non ce l'aveva ripiegava su playlist.json:
     sul computer quella e' una copia vecchia sul disco, quindi nomi
     indietro e canzoni mancanti. Ora la lettura e' aperta (vedi il
     worker): e' roba gia' pubblica. Scrivere continua a volere la chiave. */
if (SERVIZIO_PUBBLICA) {
  try {
    const r = await fetch(SERVIZIO_PUBBLICA + "/playlist", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j && j.playlist)) {
        const arrivate = _unisciPlaylistCondivise(j.playlist);
        if (arrivate) {
          try { segnalaErrore("playlist dal worker: " + playlists.length + " in tutto"); } catch (e) {}
        }
      }
    }
  } catch (e) { /* senza rete uso il file sul sito */ }
  }
  /* ATTENZIONE: qui NON si torna indietro. Prima, dopo aver letto il
     Worker, uscivo subito e playlist.json non veniva letto affatto.
     Ste: "alcune canzoni vengono eliminate". I due posti non contengono
     esattamente la stessa cosa: uscendo al primo, prendevo solo quello
     che aveva meno canzoni e perdevi le altre. Adesso leggo entrambi e
     li unisco. */

  /* Se il Worker non c'e', leggo playlist.json dal sito.

     Serve perche' il Worker chiede la chiave, e la chiave ce l'hanno solo i
     dispositivi dove e' stata inserita. Aperto dalla scorciatoia che avvia
     Safari la memoria del telefono e' un'altra, e la playlist gym non
     compariva. Questo file e' pubblico e sta gia' sul sito: e' il posto dove
     le playlist vivono davvero, quindi lo leggo sempre. */
  try {
    const r = await fetch("./playlist.json", { cache: "no-cache" });
    if (r.ok) {
      const j = await r.json();
      const elenco = Array.isArray(j) ? j : (Array.isArray(j && j.playlist) ? j.playlist : []);
      const arrivate = _unisciPlaylistCondivise(elenco);
      if (arrivate) segnalaErrore("playlist: " + playlists.length + " in tutto, " + arrivate + " lette dal sito");
      return;
    }
  } catch (e) { /* nessuna rete: restano quelle che ho gia' */ }

  /* Se non e' andata e non ho nessuna playlist, riprovo una volta sola dopo
     qualche secondo: la prima richiesta capita mentre il telefono sta ancora
     agganciando la rete, e senza riprovare la playlist non compariva e
     non c'era modo di ripararlo senza riaprire l'app. */
  if (!playlists.length) {
    setTimeout(() => {
    _caricaPlaylistCondivise().then(function () {
      /* Le playlist sono arrivate: ridisegno, cosi' i brani della gym
         prendono il contrassegno "bassi" (se sono potenziati). */
      try { render(); } catch (e) { }

    });
  }, 5000);
  }
}

async function _mandaGymAlServizio() {
  /* Manda al servizio i brani della playlist "gym": il computer li prepara
     potenziati (bassi, voce avanti, volume piu' forte).
     Non serve la chiave segreta: qui si scrive solo quella lista. */
  try {
    if (!SERVIZIO_PUBBLICA) return;
    const gym = [];
    for (const p of (playlists || [])) {
      if (String(p.name || "").trim().toLowerCase() !== "gym") continue;
      for (const t of (p.tracks || [])) gym.push(String(t));
    }
    if (!gym.length) return;
    let r = null;
    for (let tentativo = 1; tentativo <= 2; tentativo++) {
      try {
        const resp = await fetch(SERVIZIO_PUBBLICA + "/gym", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tracks: gym })
        });
        r = resp;
        break;
      } catch (e) { /* rete incasinata: secondo tentativo */ }
    }
    try {
      if (r && r.ok) segnalaErrore("gym: " + gym.length + " brani mandati al computer");
      else segnalaErrore("gym: il servizio non ha accettato la lista (" + (r ? r.status : "?") + ")");
    } catch (e) { }
  } catch (e) { /* senza rete: la lista arriva al prossimo giro */ }
}

/* Tiene sotto il tetto ("Quanto tenere offline") lo spazio delle canzoni.
   Prima non c'era nessun tetto: quando il telefono era pieno, il browser
   buttava via le voci piu' vecchie delle cache, e se ne buttava via anche
   le download di Ste ("i download che faccio vengono resettati").
   Adesso: si svuota prima la cache delle canzoni che si sono solo
   ascoltate, e solo se serve si tocca la cache delle download (e in quel
   caso le piu' vecchie, che sono le meno usate). */
async function _tieniSpazioSottoIlTetto() {
  try {
    if (!("caches" in window)) return;
    const tettoMb = Number(LS.get("mb.tettoScarica-" + profile, "500")) || 500;
    if (tettoMb >= 999999) return;   /* senza tetto: non toccare niente */
    const tetto = tettoMb * 1024 * 1024;
    const stream = await caches.open(cacheStreamName());
    const miei = await caches.open(cacheBraniName());
    const dimensione = async (cache) => {
      let totale = 0;
      try {
        for (const req of await cache.keys()) {
          const r = await cache.match(req);
          if (!r) continue;
          totale += Number(r.headers.get("content-length") || 0) || 0;
        }
      } catch (e) { }
      return totale;
    };
    let tot = await dimensione(stream);
    let mie = await dimensione(miei);
    if (tot + mie <= tetto) return;
    /* Prima le canzoni solo ascoltate, dalla piu' vecchia */
    for (const req of await stream.keys()) {
      if (tot + mie <= tetto) break;
      try {
        const r = await stream.match(req);
        const sz = r ? (Number(r.headers.get("content-length") || 0) || 0) : 0;
        await stream.delete(req);
        tot -= sz;
      } catch (e) { }
    }
    /* Poi, se serve davvero, le download del profilo: le piu' vecchie */
    if (tot + mie > tetto) {
      for (const req of await miei.keys()) {
        if (tot + mie <= tetto) break;
        try {
          const r = await miei.match(req);
          const sz = r ? (Number(r.headers.get("content-length") || 0) || 0) : 0;
          await miei.delete(req);
          mie -= sz;
        } catch (e) { }
      }
    }
  } catch (e) { /* pazienza */ }
}

async function _salvaPlaylistCondivise() {
    if (!SERVIZIO_PUBBLICA || !CHIAVE_PUBBLICA) return;
    try {
      await fetch(SERVIZIO_PUBBLICA + "/playlist", {
        method: "POST",
        headers: { "content-type": "application/json", "x-chiave": CHIAVE_PUBBLICA },
        body: JSON.stringify({ playlist: playlists })
      });
    } catch (e) { /* senza rete le playlist restano pero' nel telefono */ }
  }

  /* ---------- Cosa togliere, quando il brano e' anche in una playlist ----------
     Prima: un si'/no e basta. Se nascondevi un brano che era in "gym", il
     brano restava in playlist ma spariva dalla libreria, e sotto compariva
     "rimettili in lista" senza che si capisse il nesso.
     Adesso, se il brano e' in almeno una playlist, si sceglie cosa fare. */
  function _playlistCheContengono(trackId) {
    return playlists.filter((p) => (p.tracks || []).includes(trackId)).map((p) => p.name);
  }

  let _scopeResolve = null;

  /* Chiede quanto tenere offline. Uso lo stesso dialogo delle scelte che
     c'e' gia' ("togli questo brano"), cosi' non ne invento un altro e
     funziona anche su schermi piccoli. */
  function _scegliTettoScarica(ora, scelte) {
    try {
      const tit = $("scopeTitle");
      const msg = $("scopeMsg");
      const box = $("scopeScelte");
      if (!tit || !msg || !box) return Promise.resolve(null);
      tit.textContent = "Quanto tenere offline?";
      msg.textContent = "Le canzoni offline occupano spazio sul telefono. " +
        "Ora ne tieni " + (ora >= 999999 ? "tutte quante" : ora + " MB") + ".";
      box.innerHTML = "";
      for (const s of scelte) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "scope-scelta";
        b.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/></svg>' +
          "<span><b>" + s.testo + "</b></span>";
        b.addEventListener("click", () => _chiudiScope(s.mb));
        box.appendChild(b);
      }
      const lascia = document.createElement("button");
      lascia.type = "button";
      lascia.className = "scope-scelta";
      lascia.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4Z"/></svg>' +
        "<span><b>Lascia com'e'</b></span>";
      lascia.addEventListener("click", () => _chiudiScope(null));
      box.appendChild(lascia);
      const p = document.createElement("p");
      p.className = "scope-dove-lista";
      p.textContent = "Fuori dal tetto le canzoni non si scaricano da sole, ma " +
        "le puoi sempre scaricare a mano con la nuvoletta.";
      box.appendChild(p);
      /* il dialogo risolve con una promessa: mi aggancio come fa l'altro */
      return new Promise((resolve) => {
        _scopeResolve = resolve;
        $("scopePanel").hidden = false;
      });
    } catch (e) { return Promise.resolve(null); }
  }

  /* Restituisce "libreria", "playlist", "entrambe" oppure null se annullato. */
  function _scegliCosaTogliere(trackId, titolo, perDavvero, perEliminazione) {
    const nomi = _playlistCheContengono(trackId);
    /* Ste: "eliminare non mi chiede piu la conferma". Prima, se il brano non
       era in nessuna playlist, la domanda veniva saltata e il brano spariva
       subito. Adesso chiedo SEMPRE, e offro solo le scelte che hanno senso. */
    $("scopeTitle").textContent = perDavvero ? "Eliminare per davvero?" : "Togliere questo brano?";
    const dove = !nomi.length
      ? "non e' dentro nessuna playlist."
      : nomi.length === 1
        ? "e' nella playlist \"" + nomi[0] + "\"."
        : "e' nelle playlist " + nomi.map((n) => "\"" + n + "\"").join(", ") + ".";
    $("scopeMsg").textContent = "'" + titolo + "' " + dove + ". Dimmi dove vuoi toglierlo.";

    const scelte = $("scopeScelte");
    scelte.innerHTML = "";
    const voci = [
      {
        id: "libreria",
        testo: "Solo dalla libreria",
        dove: perDavvero
          ? "viene eliminato dal sito: tutti gli altri lo perdono davvero"
          : "scompare dalla tua libreria, resta online e resta nelle playlist",
        pericolo: perDavvero
      },
      {
        id: "playlist",
        testo: "Solo dalle playlist",
        dove: "resta nella libreria, esce solo da " + (nomi.length === 1 ? "playlist" : "playlist"),
        pericolo: false
      },
      {
        id: "entrambe",
        testo: "Da entrambi",
        dove: perDavvero
          ? "esce dalla libreria e dalle playlist, e viene eliminato dal sito"
          : "scompare dalla libreria e da tutte le playlist",
pericolo: perDavvero
    }
    ];
    /* Se il brano non e' dentro nessuna playlist, le due scelte che
       riguardano le playlist non hanno senso: le tolgo, cosi' resta solo
       "togli dalla libreria" (piu' l'annulla che aggiungo sotto). */
    if (!nomi.length) voci.splice(1, 2);
    /* Ste: "se premo 'solo dalla libreria' mi dice che lo elimina da
       tutto, dal sito e dalle playlist". Quel pulsante vuol dire una cosa
       sola: il brano esce dalla LIBRERIA e resta nelle playlist (e nel
       sito, per gli altri). Eliminare davvero e' un'altra scelta.
       Percio' quando si sta eliminando, mostro solo le due scelte vere. */
    if (perEliminazione) {
      const utili = voci.filter((v) => v.id === "libreria" || v.id === "entrambe");
      if (utili.length) {
        utili[0].dove = "esce dalla libreria, ma resta nelle playlist e nel sito";
        utili[0].pericolo = false;
        utili[1].dove = "esce dalla libreria E dalle playlist, e viene cancellato per sempre";
        utili[1].pericolo = true;
        voci.length = 0;
        for (const v of utili) voci.push(v);
      }
    }
    voci.push({
      id: "",
      testo: "Lascia tutto com'e'",
      dove: "non faccio niente",
      pericolo: false
    });
    for (const v of voci) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "scope-scelta" + (v.pericolo ? " pericolo" : "");
      b.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/></svg>' +
        "<span><b>" + v.testo + "</b><span class=\"scope-dove\">" + v.dove + "</span></span>";
      b.addEventListener("click", () => _chiudiScope(v.id || null));
      scelte.appendChild(b);
    }
    const dove2 = document.createElement("p");
    dove2.className = "scope-dove-lista";
    dove2.textContent = "Playlist interessate: " + nomi.join(", ");
    scelte.appendChild(dove2);

    $("scopePanel").hidden = false;
    syncNoScroll();
    return new Promise((r) => { _scopeResolve = r; });
  }

  function _chiudiScope(scelta) {
    $("scopePanel").hidden = true;
    const r = _scopeResolve;
    _scopeResolve = null;
    if (r) r(scelta);
  }

  $("scopeAnnulla").addEventListener("click", () => _chiudiScope(null));
  $("scopePanel").addEventListener("click", (e) => { if (e.target === $("scopePanel")) _chiudiScope(null); });

  /* Nasconde il brano, togliendolo anche dalle playlist se richiesto. */
  /* ---------- Le playlist nella libreria ----------
     Non sono una sezione a parte con una finestra: sono una fila di
     linguette sopra la libreria. Tocchi una e sotto vedi la lista normale
     con dentro solo i brani di quella playlist. Torni su "Tutte" e hai di
     nuovo tutta la libreria. */

  let _playlistAttiva = "";
  let _lingScrollMemoria = 0;

  /* Tenere premuto, come sui brani: se scorre col dito non succede niente,
     e su iPhone non compare il menu con "copia". */
  function _premiLungo(el, fai) {
    if (!el) return;
    let timer = null;
    let via = false;
    const ferma = () => { if (timer) { clearTimeout(timer); timer = null; } };
    el.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      via = false;
      timer = setTimeout(() => { timer = null; via = true; fai(); }, 550);
      const mosso = (ev) => {
        if (!timer) return;
        if (Math.abs((ev.clientX || 0) - (e.clientX || 0)) > 10 ||
            Math.abs((ev.clientY || 0) - (e.clientY || 0)) > 10) ferma();
      };
      const su = () => {
        ferma();
        el.removeEventListener("pointermove", mosso);
        el.removeEventListener("pointerup", su);
        el.removeEventListener("pointercancel", su);
      };
      el.addEventListener("pointermove", mosso);
      el.addEventListener("pointerup", su);
      el.addEventListener("pointercancel", su);
    });
    /* se e' stato un tocco lungo, il click normale non deve cambiare
       la playlist selezionata */
    el.addEventListener("click", (e) => {
      if (via) { via = false; e.preventDefault(); e.stopPropagation(); }
    }, true);
    /* niente menu contestuale del telefono, niente "copia" */
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /* Chiede prima di cancellare: una playlist non e' un brano, ma
     cancellarla per sbaglio fa perdere il lavoro di ordinarla. */
  async function _chiediEdEliminaPlaylist(p) {
    const n = (p.tracks || []).length;
    const si = await askConfirm(
      "Eliminare la playlist?",
      'Playlist "' + p.name + '"' + (n ? " con " + n + (n === 1 ? " brano" : " brani") : "") +
      ".\n\nLe canzoni NON vengono toccate: restano tutte nella libreria.",
      "Elimina"
    );
    if (!si) return;
    playlists = playlists.filter((x) => x.id !== p.id);
    saveCurrentState();
    _salvaPlaylistCondivise();
    if (_playlistAttiva === p.name) _playlistAttiva = "";
    _disegnaLinguettePlaylist();
    render();
    toast('Playlist "' + p.name + '" eliminata');
  }

  /* ---------- Scegliere più canzioni insieme ----------

   Ste: un tasto "Seleziona" per prendere più brani in una volta e poi:
   metterli in una playlist, toglierli dalla libreria e lasciarli solo li', o
   eliminarli. Prima si poteva fare solo un brano alla volta.

   Le azioni riusano le funzioni di sempre (una per brano), quindi non
   ripeto la logica: se un giorno cambio una, cambia anche qui. */

let _inSelezione = false;
const _scelti = new Set();

function _quantiScelti() { return _scelti.size; }

function _apriSelezione() {
  _inSelezione = true;
  _scelti.clear();
  _disegnaBarraSelezione();
  render();
}

function _chiudiSelezione() {
  _inSelezione = false;
  _scelti.clear();
  _disegnaBarraSelezione();
  render();
}

function _alternaSelezione(id) {
  if (!_inSelezione) return false;
  if (_scelti.has(id)) _scelti.delete(id);
  else _scelti.add(id);
  _disegnaBarraSelezione();
  render();
  return true;
}

function _disegnaBarraSelezione() {
  const barra = $("selezioneBarra");
  if (!barra) return;
  barra.hidden = !_inSelezione;
  const n = _quantiScelti();
  const testo = $("selezioneConto");
  if (testo) {
    testo.textContent = n === 0 ? "Tocca le canzioni da scegliere"
      : n === 1 ? "1 canzone scelta" : n + " canzioni scelte";
  }
  const b = $("btnSeleziona");
  if (b) b.classList.toggle("on", _inSelezione);
  if (!_inSelezione) _chiudiMenuSelezione();
}

/* Ste: "metti una sola opzione, piccola in basso a destra, che se la premo
   appaiono le scelte da fare". Le scelte sono nascoste finche' non preme
   "Opzioni", cosi' la barra resta piccola. */
function _apriMenuSelezione() {
  const menu = $("selMenu");
  const tasto = $("selMenuBtn");
  if (!menu) return;
  menu.hidden = false;
  if (tasto) tasto.setAttribute("aria-expanded", "true");
}
function _chiudiMenuSelezione() {
  const menu = $("selMenu");
  const tasto = $("selMenuBtn");
  if (menu) menu.hidden = true;
  if (tasto) tasto.setAttribute("aria-expanded", "false");
}

/* Le azioni vere: riusano le funzioni che gia' esistono per un brano. */
async function _selezionaAggiungiPlaylist() {
  const ids = [..._scelti];
  if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
  const nomi = playlists.map((p) => p.name);
  const testo = "Aggiungi " + (ids.length === 1 ? "la canzone scelta" : ids.length + " canzioni scelte") +
    " a una playlist" +
    (nomi.length ? "\n\nSe ne hai gia' una, scrivi il suo nome:\n  " + nomi.join("\n  ") +
      "\n\nAltrimenti scrivi un nome nuovo e la creo io."
      : "\n\nNon hai ancora playlist: scrivi il nome e la creo.");
  const nome = _chiediNome(testo);
  if (!nome) return;
  /* La prima crea la playlist, le altre ci finiscono dentro. */
  let pl = _playlistConNome(nome, ids[0]);
  for (let i = 1; i < ids.length; i++) {
    if (pl && Array.isArray(pl.tracks) && pl.tracks.indexOf(ids[i]) < 0) pl.tracks.push(ids[i]);
  }
  _aggiornaBadgePlaylist();
  _salvaPlaylistCondivise();
  _chiudiSelezione();
  toast(ids.length + (ids.length === 1 ? " canzone aggiunta a " : " canzioni aggiunte a ") + '"' + pl.name + '"');
}

/* Sposta le canzoni scelte "solo nella playlist".

   Prima non chiedeva in QUALE playlist: le canzoni sparivano dalla libreria
   senza essere da nessuna parte, e non le ritrovavi piu'. Ste se n'e'
   accorto e ha ragione: ora chiedo la playlist PRIMA, come si fa quando se ne
   sceglie una sola dalla pressione lunga. */
async function _selezionaSoloInPlaylist() {
  const ids = [..._scelti];
  if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
  const nomi = playlists.map((p) => p.name);
  const testo = "Nascondile dalla libreria e mettile in una playlist: escono dalla libreria ma restano suonabili li' dentro." +
    (nomi.length
      ? "\n\nScrivi il nome della playlist:\n  " + nomi.join("\n  ") +
        "\n\nOppure un nome nuovo e la creo io."
      : "\n\nNon hai ancora playlist: scrivi il nome e la creo.");
  const nome = _chiediNome(testo);
  if (!nome) return;
  /* Cerco (o creo) la playlist, ma NON ci metto dentro niente ancora:
     prima chiedo e poi, se va bene, ci metto le canzoni. Prima le scrivevo
     subito, e se poi annullavi la conferma erano lo' lo stesso. */
  const pl = _playlistConNome(nome, "");
  /* Ste: "se faccio 'togli dalla libreria' e me la sposta in una playlist
     dove c'e' gia' quella canzone, quella canzone viene scartata ma viene
     solamente eliminata dalla libreria, mentre le altre (quelle che non
     sono gia' presenti) vengono eliminate dalla libreria e spostate nella
     playlist".

     Quindi: le canzoni che ci sono gia' nella playlist NON la rimetto (sarebbe
     un doppione) e la tolgo solo dalla libreria. Le altre la metto davvero
     nella playlist e la tolgo dalla libreria. */
  const giaPresenti = [];
  const daSpostare = [];
  for (const id of ids) {
    if (pl && Array.isArray(pl.tracks) && pl.tracks.indexOf(id) >= 0) giaPresenti.push(id);
    else daSpostare.push(id);
  }
  const righe = [];
  if (giaPresenti.length) {
    righe.push(giaPresenti.length + (giaPresenti.length === 1 ? " canzone e' gia' in \"" : " canzoni sono gia' in \"") +
      pl.name + "\": la tolgo solo dalla libreria.");
  }
  if (daSpostare.length) {
    righe.push(daSpostare.length + (daSpostare.length === 1 ? " canzone entra in \"" : " canzoni entrano in \"") +
      pl.name + "\" e sparisce dalla libreria.");
  }
  const si = await askConfirm(
    "Tirarle fuori dalla libreria?",
    righe.join("\n") +
      "\n\nRestano suonabili dentro la playlist: per rivederle,\n" +
      "apri quella playlist.",
    "Sposta"
  );
  if (!si) return;
  /* Ora metto davvero le nuove nella playlist (quelle che c'erano gia' non le
     rimetto: sarebbe un doppione). */
  for (const id of daSpostare) {
    if (pl && Array.isArray(pl.tracks) && pl.tracks.indexOf(id) < 0) pl.tracks.push(id);
  }
  /* E le tolgo TUTTE dalla libreria: sia quelle appena spostate sia quelle
     che erano gia' nella playlist. */
  for (const id of ids) _mettiSoloInPlaylist(id);
  _salvaSoloInPlaylist();
  _disegnaLinguettePlaylist();
  _aggiornaBadgePlaylist();
  _salvaPlaylistCondivise();
  _chiudiSelezione();
  toast("Tolte dalla libreria: le senti solo dentro \"" + pl.name + "\"" +
    (giaPresenti.length ? " (" + giaPresenti.length + " erano gia' li')" : ""));
}

async function _selezionaElimina() {
  const ids = [..._scelti];
  if (!ids.length) { toast("Prima scegli almeno una canzone"); return; }
  const si = await askConfirm(
    "Eliminare " + ids.length + (ids.length === 1 ? " canzone?" : " canzoni?"),
    "Le canzoni scelte spariscono davvero, dal sito e da ogni dispositivo.\n\n" +
      "Se le vuoi tenere ma solo toglierle dalla libreria, usa\n" +
      "\"Togli dalla libreria\" invece di questo.\n\n" +
      "Questa cosa non si può annullare.",
    "Elimina per sempre"
  );
  if (!si) return;
  /* Ste: "ho cancellato una canzone su tailscale e su github non si e'
     cancellata".
     Motivo: qui si chiamava removeTrack, che toglie il brano da questo
     telefono ma NON segna l'eliminazione nei dati condivisi: quindi
     l'altro link non ne sapeva niente e il brano restava li'.

     Ora si passa da _eliminaBrano, che segna l'eliminazione (e la manda
     a tutti i link) e chiede la conferma. */
  for (const id of ids) {
    try { await _eliminaBrano(id); } catch (e) { /* una alla volta: se una falla le altre vanno avanti */ }
  }
  _chiudiSelezione();
  toast(ids.length + (ids.length === 1 ? " canzone eliminata" : " canzioni eliminate"));
}

  function _disegnaLinguettePlaylist() {
    const box = $("plLinguette");
    const scroll = $("plLingScroll");
    const dove = $("plDoveSono");
    if (!box || !scroll) return;
    scroll.innerHTML = "";
    const ceNeSonno = playlists.length > 0;
    box.hidden = false;   /* la riga c'e' sempre: se non ci sono playlist resta solo "Tutte" e il "+" */
for (const p of playlists) {
        /* Ste: "agli altri spunta la mia playlist anche se mettono che non
           vogliono le mie canzoni". Se segno una playlist come nascosta, agli
           altri non deve comparire NE' la playlist NE' le sue canzoni. A me
           invece la voglio vedere: per questo ricordo chi l'ha nascosta
           (nascostaDa) e la nascondo solo agli altri. */
        if (p.nascosta === true && p.nascostaDa && p.nascostaDa !== profile) continue;
        const b = document.createElement("button");
      b.type = "button";
      b.className = "pl-ling" + (_playlistAttiva === p.name ? " attiva" : "");
      const n = (p.tracks || []).length;
      b.textContent = n ? p.name + " · " + n : p.name;
      b.title = n ? p.name + ": " + n + (n === 1 ? " brano" : " brani") : p.name + ": vuota";
      b.addEventListener("click", () => {
        _playlistAttiva = (_playlistAttiva === p.name ? "" : p.name);
        _disegnaLinguettePlaylist();
        render();
      });
      /* Tenendo premuto si cancella la playlist. Uguale a come funziona
         sui brani, e non si copia il testo tenendo premuto su iPhone. */
      _premiLungo(b, async () => {
        suppressClick = true;
        try { navigator.vibrate && navigator.vibrate(8); } catch (e) { /* noop */ }
        await _chiediEdEliminaPlaylist(p);
      });
      scroll.appendChild(b);
    }
    $("plLingTutte").classList.toggle("attiva", !_playlistAttiva);
    if (dove) {
      if (_playlistAttiva) {
        const pl = _playlistCercata(_playlistAttiva);
        const n = pl ? (pl.tracks || []).length : 0;
        dove.innerHTML = "Stai vedendo <b>" + _playlistAttiva + "</b> · " + n +
          (n === 1 ? " brano" : " brani") + ". <span class=\"pl-torna\">Torna a tutta la libreria</span>";
        const torna = dove.querySelector(".pl-torna");
        if (torna) torna.addEventListener("click", () => {
          _playlistAttiva = "";
          _disegnaLinguettePlaylist();
          render();
        });
        dove.hidden = false;
      } else {
        dove.hidden = true;
      }
    }
    if (!_lingScrollMemoria && scroll.scrollWidth > 0) {
      scroll.scrollLeft = _lingScrollMemoria;
    }
    /* Se la playlist scelta e' sparita (l'ho eliminata altrove) torno su Tutte */
    if (_playlistAttiva && !_playlistCercata(_playlistAttiva)) {
      _playlistAttiva = "";
      render();
    }
    return ceNeSonno;
  }

  /* ---------- Canzoni con lo stesso nome ----------
   Stefano l'ha chiesto perche' temeva doppioni. Serve a vedere le canzoni
   che si somigliano, cosi' capisci se quella che stai cercando e' quella
   giusta o un'altra con identico nome. Non sono errori: sono brani diversi
   con nomi vicini (per esempio lo stesso titolo di due artisti). */
  function _gruppiSimili() {
    const perTitolo = new Map();
    for (const t of tracks) {
        const titolo = stripArtistPrefix(t.artist, t.title) || t.title || "";
      const k = normKey(titolo);
      if (!k || k.length < 3) continue;
      if (!perTitolo.has(k)) perTitolo.set(k, []);
      perTitolo.get(k).push(t);
    }
    /* Solo i gruppi con piu' di un brano, e in ordine di quante copie ne
       hanno: cosi' in cima ci sono le cose che pesano di piu'. */
    const gruppi = [...perTitolo.values()].filter((g) => g.length > 1);
    gruppi.sort((a, b) => b.length - a.length ||
      String(a[0].title).localeCompare(String(b[0].title)));
    return gruppi;
  }

  function _stampaSimili() {
    const pannello = $("similiPanel");
    const corpo = $("similiCorpo");
    if (!pannello || !corpo) return;
    const gruppi = _gruppiSimili();
    const nCopie = gruppi.reduce((s, g) => s + g.length, 0);
    if ($("similiSub")) {
      $("similiSub").textContent = gruppi.length
        ? gruppi.length + (gruppi.length === 1 ? " nome si ripete" : " nomi si ripetono") +
          " fra le tue canzoni (" + nCopie + " brani)"
        : "Nessuna canzone con lo stesso nome: la libreria e' pulita";
    }
    if (!gruppi.length) {
      corpo.innerHTML = '<div class="stat-lista"><div class="stat-item"><span>Nomi che si ripetono</span><b>0</b></div></div>' +
        '<p class="nota" style="margin:8px 2px 0">Nella tua libreria non ci sono due canzoni con lo stesso nome. Tutto in ordine.</p>';
    } else {
      let html = "";
      for (const g of gruppi) {
        html += '<div class="simili-gruppo"><div class="simili-titolo">' +
          String(g[0].title).replace(/[<>]/g, "") +
          (g.length > 2 ? " <span class='simili-conto'>x" + g.length + "</span>" : "") + "</div>";
        for (const t of g) {
          html += '<div class="simili-riga" data-id="' + String(t.id).replace(/[<>]/g, "") + '">' +
            '<span class="simili-artista">' + String(t.artist || "senza artista").replace(/[<>]/g, "") + "</span>" +
            '<span class="simili-dove">' + (t.builtin ? "dalla libreria" : "aggiunta da te") + "</span>" +
            "</div>";
        }
        html += "</div>";
      }
      corpo.innerHTML = html;
    }
    pannello.hidden = false;
    syncNoScroll();
    _aggiornaBadgeSimili();
  }

  function _chiudiPannelloSimili() {
    const m = $("similiPanel");
    if (m) m.hidden = true;
  }

  function _aggiornaBadgeSimili() {
    const b = $("similiBadge");
    if (!b) return;
    const gruppi = _gruppiSimili();
    const n = gruppi.reduce((s, g) => s + g.length, 0);
    b.hidden = !n;
    b.textContent = n > 9 ? "9+" : String(n);
    const voce = $("btnSimili");
    if (voce) voce.classList.toggle("has-falliti", n > 0);
  }

  /* Recupero: il brano e' finito ma nessuno e' andato avanti.

     Prima qui avevo riscritto la scelta del brano successivo (playlist, coda,
     ripeti...). Era una SBAGLIATURA: due copie di quella logica possono
     scattare insieme e farti saltare una canzone, o partire due brani insieme.
     L'unica che sa come funzionano playlist, coda e ripetizione e'
     handleEnded(): quindi gli passo il problema e non lo risolvo qui. */
  let _stoRecuperando = false;

  function _finitoSenzaAvanti() {
    try {
      if (_stoRecuperando) return;
      if (!_vuoleSuonare || !currentId || !audio) return;
      if (!audio.ended) return;
      /* Non e' davvero finito: siamo ancora agli ultimi secondi */
      if (isFinite(audio.duration) && audio.duration > 0 &&
          audio.currentTime < audio.duration - 0.6) return;
      _stoRecuperando = true;
      try {
        handleEnded();
      } finally {
        setTimeout(() => { _stoRecuperando = false; }, 1500);
      }
    } catch (e) { _stoRecuperando = false; }
  }

  /* Controllo continuo mentre lo schermo e' acceso.

     Lo accendo SOLO con lo schermo acceso: a schermo spento il telefono
     sospende la pagina e il controllo non girerebbe comunque, quindi
     sarebbe solo fatica e batteria sprecata. */
  let _sondaAvanti = null;

  function _accendiSonda() {
    if (_sondaAvanti) clearInterval(_sondaAvanti);
    _sondaAvanti = setInterval(_finitoSenzaAvanti, 5000);
  }

  function _spezniSonda() {
    if (_sondaAvanti) { clearInterval(_sondaAvanti); _sondaAvanti = null; }
  }

  /* ---------- Volume ---------- */
  let volumePct = Number(LS.get("mb.vol", 100)) || 100;
  /* All'avrio la catena dei bassi non e' accesa (per accenderla serve un
     tocco: vedi la nota sopra). Quindi il volume parte dal massimo 100%:
     se nell'ultima sessione era oltre, torna al 100% invece di far partire
     una catena che lascerebbe l'audio in silenzio. */
  if (volumePct > 100) { volumePct = 100; LS.set("mb.vol", 100); }
  /* I bassi e il volume oltre il 100% non si possono fare dal browser su
     iPhone: per quello ci sono i file con i bassi gia' alzati. */
  let volumeBeforeMute = 100;

  /* ---------- Bassi e volume extra (oltre il 100%) ----------
     Ste: "posso aumentare ancora di piu' i bassi e il volume della musica".
     I bassi si alzano con un filtro (Web Audio) e il volume con un
     amplificatore: l'elemento audio del browser arriva al 100% e basta, per
     andare oltre serve appunto l'amplificatore. */
  let bassiPct = Number(LS.get("mb.bassi", 0)) || 0;
  let bassiAccesi = false;      /* la catena e' viva? */
  let _ctx = null, _fonte = null, _filtroBassi = null, _gain = null, _audioCollegato = null;
  let _catenaRifiutata = false;  /* questo telefono non lascia accendere la catena */

  /* Ste, 21/10/2026: "le canzoni non si sentono piu'". Motivo trovato: la
     catena Web Audio (filtro bassi + amplificatore) si accendeva DA SOLA,
     perche' bastava che il volume fosse rimasto oltre il 100% dalla volta
     prima. Ma il browser permette di partire l'audio solo dopo un tocco
     dell'utente: la catena quindi restava "sospesa" e la musica, che ci
     passava dentro, non usciva piu' dalle cuffie. Silenzio totale.
     Adesso la catena si accende SOLO dall'interruttore del pannello
     (quello e' un tocco, quindi il browser la lascia partire) e se non
     parte si ricostruisce l'elemento audio: l'uscita torna diretta. */
  /* Ste, 21/10/2026: i bassi non si accendevano sull'iPhone.
     Il browser lascia svegliare l'audio SOLO entro un tocco dell'utente, e
     se lo sveglio quando preme "Accendi i bassi" a volte il tocco e' gia'
     invecchiato e non parte (la musica sparisce).
     Cosi' preparo il motore audio al PRIMO tocco che fa in assoluto: da
     li' in poi l'audio e' sveglio e i bassi si accendono subito. */
  let _audioProno = false;
  function _preparaAudio() {
    if (_audioProno) return;
    _audioProno = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!_ctx) _ctx = new AC();
      if (_ctx.state === "suspended") { try { _ctx.resume(); } catch (e) { } }
    } catch (e) { }
  }
  try {
    ["pointerdown", "touchstart", "click", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, _preparaAudio, { once: true, passive: true });
    });
  } catch (e) { }
  function _collegaElemento() {
    try {
      if (!_ctx || !audio) return false;
      if (_audioCollegato === audio) return true;
      try { if (_fonte) _fonte.disconnect(); } catch (e) { }
      _fonte = _ctx.createMediaElementSource(audio);
      _filtroBassi = _ctx.createBiquadFilter();
      _filtroBassi.type = "lowshelf";
      _filtroBassi.frequency.value = 180;
      _gain = _ctx.createGain();
      _fonte.connect(_filtroBassi);
      _filtroBassi.connect(_gain);
      _gain.connect(_ctx.destination);
      _audioCollegato = audio;
      return true;
    } catch (e) { return false; }
  }

  function _dimenticaCatena() {
    _ctx = null; _fonte = null; _filtroBassi = null; _gain = null; _audioCollegato = null;
    bassiAccesi = false;
  }

  /* Ricostruisce l'elemento audio: una volta collegato a una catena Web
     Audio non puo' piu' tornare diretto alle cuffie, quindi va rifatto
     da capo. */
  function _ricostruisciAudio() {
    try {
      if (typeof rebuildAudio === "function") { rebuildAudio(true); return true; }
    } catch (e) { }
    return false;
  }

  function _accendiCatena() {
    /* Accende la catena dei bassi.
       VA CHIAMATA DIRETTAMENTE DAL TOCCO dell'utente: la ripresa del
       contesto audio (resume) va chiesta subito, senza attese, perche' il
       browser permette di partire l'audio solo se la richiesta nasce dal
       tocco. Dopo un await il tocco e' perso, il contesto resta
       "sospeso" e la musica (che passa dentro la catena) non esce piu'.
       Per questo l'elemento audio viene collegato alla catena SOLO se il
       contesto e' davvero sveglio: cosi' non puo' restare intrappolato,
       e se non parte l'elemento viene rifatto e la musica torna. */
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !audio) return Promise.resolve(false);
      if (!_ctx) _ctx = new AC();
      /* qui, senza attese: il tocco e' ancora valido */
      if (_ctx.state === "suspended") { try { _ctx.resume(); } catch (e) { } }
      /* se e' gia' sveglio (l'ho preparato al primo tocco) siamo a posto:
         colleghiamo subito, senza aspettare */
      if (_ctx.state === "running") {
        if (_collegaElemento()) {
          _catenaRifiutata = false;
          bassiAccesi = true;
          return Promise.resolve(true);
        }
      }
      return new Promise(function (risolvi) {
        setTimeout(function () {
          try {
            if (_ctx && _ctx.state === "running" && _collegaElemento()) {
              _catenaRifiutata = false;
              bassiAccesi = true;
              risolvi(true);
              return;
            }
          } catch (e) { }
          /* il contesto non si e' svegliato: l'elemento audio e' intrappolato
             nella catena e da li' non esce piu' niente. Lo rifaccio: l'uscita
             torna diretta e la musica si sente. */
          _dimenticaCatena();
          _ricostruisciAudio();
          _catenaRifiutata = true;
          risolvi(false);
        }, 900);
      });
    } catch (e) {
      _dimenticaCatena();
      _ricostruisciAudio();
      return Promise.resolve(false);
    }
  }

  function _applicaAudio() {
    /* Sempre e solo la strada diretta: l'elemento audio va dritto alle
       cuffie. La catena Web Audio (filtro bassi + amplificatore) su iPhone
       e' instabile: quando si attiva, l'audio sparisce e non torna. */
    try {
      const v = Number(volumePct) || 0;
      if (audio) audio.volume = Math.min(1, Math.max(0, v / 100));
      if (_gain) _gain.gain.value = 1;
      if (_filtroBassi) _filtroBassi.gain.value = 0;
      return true;
    } catch (e) { return false; }
  }
  function updateVolumeUI() {
    const s = $("volSlider");
    if (s) s.value = String(volumePct);
    const b = $("btnVolIcon");
    if (b) b.classList.toggle("muted", volumePct === 0);
  }
  function setVolume(v) {
    /* Il massimo e' il 100%: oltre serve la catena Web Audio, che su
       iPhone fa sparire l'audio (vedi la nota sopra). */
    volumePct = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    if (volumePct > 0) volumeBeforeMute = volumePct;
    LS.set("mb.vol", volumePct);
    updateVolumeUI();
    _applicaAudio();
  }
  $("volSlider").addEventListener("input", (e) => setVolume(e.target.value));
  try { $("btnBassiVolume").addEventListener("click", apriBassiVolume); } catch (e) { /* noop */ }
  $("btnVolIcon").addEventListener("click", () => {
    if (volumePct > 0) setVolume(0);
    else setVolume(volumeBeforeMute || 100);
  });

  /* Ste: "nella playlist gym metti l'opzione che posso aumentare ancora di
     piu' i bassi e il volume della musica". */
  function apriBassiVolume() {
    try { _chiudiAltro(); } catch (e) { /* noop */ }
    let box = document.getElementById("bassiVolumePanel");
    if (!box) {
      box = document.createElement("div");
      box.id = "bassiVolumePanel";
      box.className = "import-overlay";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.innerHTML =
        '<div class="import-box">' +
        '<div class="import-head"><span class="import-title">Bassi e volume</span>' +
        '<button class="import-close" id="bassiVolumeChiudi" aria-label="Chiudi">&times;</button></div>' +
        '<div class="import-body">' +
        "<p class=\"step-hint\"><b>Volume del brano:</b> si regola qui (fino al 100%). Per sentire piu' forte alza anche il volume del telefono.</p>" +
        '<label class="step-hint" for="volExtraSlider">Volume: <span id="volExtraValore">' + Number(volumePct) + '%</span></label>' +
        '<input type="range" id="volExtraSlider" min="0" max="100" step="1" value="' + Number(volumePct) + '" />' +
        '<button class="bassi-pulsante" id="bassiRipristina" type="button">Ripristina audio</button>' +
        "<p class=\"step-hint\"><b>I bassi.</b> Sul telefono il browser non permette di aggiungere bassi all'audio mentre suona (e' una cosa che fa impazzire il suono, non l'ho lasciata attiva). Percio' i bassi veri li preparo io nei file stessi delle canzoni: quando sono pronti l'app te lo dice. Intanto, sul telefono: Impostazioni &gt; Accessibilita' &gt; Audio e video &gt; <b>Regolazioni cuffie</b> (entra dentro) e attiva <b>Amplifica</b> e alza <b>Boost audio</b>. Funziona solo con AirPods, AirPods Pro, EarPods e alcune Beats.</p>" +
        '</div></div>';
      document.body.appendChild(box);
      const vs = box.querySelector("#volExtraSlider");
      const bRipristina = box.querySelector("#bassiRipristina");
      if (bRipristina) {
        bRipristina.addEventListener("click", function () {
          /* Ste, 21/10/2026: "funziona di nuovo solo se faccio ripristina
             volume". Questo bottone rifa l'elemento audio, cosi' l'uscita
             torna diretta alle cuffie. */
          _dimenticaCatena();
          _ricostruisciAudio();
          _applicaAudio();
          toast("Audio ripristinato");
        });
      }
      vs.addEventListener("input", function () {
        setVolume(vs.value);
        box.querySelector("#volExtraValore").textContent = Number(volumePct) + "%";
      });
      box.querySelector("#bassiVolumeChiudi").addEventListener("click", function () {
        box.hidden = true;
      });
      box.addEventListener("click", function (e) { if (e.target === box) box.hidden = true; });
    }
    box.hidden = false;
    const bs = box.querySelector("#bassiSlider");
    const vs = box.querySelector("#volExtraSlider");
    if (bs) bs.value = String(bassiPct);
    if (vs) vs.value = String(volumePct);

    const vv = box.querySelector("#volExtraValore");
    if (vv) vv.textContent = Number(volumePct) + "%";
    syncNoScroll();
  }

  /* ---------- Avvio ---------- */
  (async function init() {
  /* Ste: "continua a ricaricarsi". Serve distinguere due cose diverse:
     - la PAGINA si ricarica davvero (e' un problema del browser/worker)
     - oppure la pagina resta aperta ma continua a ricostruire la libreria
     Questa riga mi dice quale delle due e': se compare piu' di una volta
     senza che io abbia toccato niente, e' un ricaricamento vero. */
  try {
    const _volte = Number(sessionStorage.getItem("mb.avvii") || "0") + 1;
    sessionStorage.setItem("mb.avvii", String(_volte));
    segnalaErrore("DIAG avvio pagina numero " + _volte +
      " | aperta da " + Math.round(performance.now() / 1000) + " secondi");
  } catch (e) { /* noop */ }
    audio = createAudio();
    _applicaAudio();
    updateVolumeUI();
    /* Ste: "quando dalle cuffie premo il tasto, parte una canzone di
       soundcloud" e "la notifica in alto deve restare fino quando chiudo
       l'app".
       Motivo: qui l'app diceva al telefono "non sto suonando niente", e
       allora il telefono dava i comandi a chi aveva suonato prima (e la
       notifica spariva). Adesso, se c'e' una canzone, l'app si prende la
       sessione subito: i tasti delle cuffie tornano a MusicBox e la
       notifica resta finche' l'app e' aperta. */
    setPlaybackState("none");
    try {
      /* Ste: "quando dalle cuffie premo il tasto, parte una canzone di
         soundcloud" e "la notifica deve restare fino quando chiudo l'app".
         La pista silenziosa parte SEMPRE, appena apri l'app: cosi' il
         telefono sa che la sessione audio e' di MusicBox, e i tasti
         delle cuffie tornano a me anche con la musica ferma.
         (Con l'app chiusa del tutto, invece, la sessione non esiste piu' e
         iOS da' il comando all'ultima app che ha suonato: quello lo
         decide il sistema, non l'app.) */
      updateMediaSession();
      _accendiSilenzio();
      setPlaybackState("playing");
      _diChe("prendo la sessione audio (i tasti delle cuffie tornano a me)");
    } catch (e) { /* noop */ }
    profile = LS.get("mb.profile", DEFAULT_PROFILE) || DEFAULT_PROFILE;
    if (profile === "Fratello") profile = OTHER_PROFILE;
    profiles = LS.get("mb.profiles", [DEFAULT_PROFILE]);
    _caricaStorico();
    queue = (LS.get("mb.queue", []) || []).filter((x) => typeof x === "string");
    if (profiles.indexOf("Fratello") >= 0) {
      profiles = profiles.map((p) => (p === "Fratello" ? OTHER_PROFILE : p));
    }
    if (profiles.indexOf(profile) < 0) profiles.push(profile);
    const migrated = profileState(profile);
    if (!allState()[profile] && LS.get("mb.hidden", null)) {
      migrated.hidden = LS.get("mb.hidden", []);
      migrated.favs = LS.get("mb.favs", []);
      migrated.last = LS.get("mb.last", null);
      migrated.time = LS.get("mb.pos." + migrated.last, 0);
      writeProfileState(profile, migrated);
    }
    const st =     loadProfileState();
    updateProfileButton();
    /* Imposta il profilo attivo nel service worker per le cache per profilo */
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SET_PROFILE", profile: profile });
    }
    $("appVer").textContent = "v" + APP_VERSION;
  // Scrivo la versione anche nella schermata di ricerca: se la pagina e' vecchia
  // la vedi subito, senza dover andare a cercare la versione nel menu'.
  try {
    const vp = $("versionePagina");
    if (vp) vp.textContent = "pagina v" + APP_VERSION;
    // Ste: "non funziona e non mi dice niente". Ora la guida dice se
    // Spotify e' pronto o no: se qui dice "non caricato", il problema non
    // e' nel resto dell'app e non serve continuare a cercare.
    const vg = $("versioneApp");
    if (vg) vg.textContent = "v" + APP_VERSION;
const st = $("statoSpotify");
  if (st) {
  /* Prima qui guardavo un segnalino che poteva essere vero mentre la
     funzione non esisteva: la guida diceva "pronto" e intanto il pulsante
     non aveva niente da chiamare. Ora guardo la funzione per davvero. */
  const che = (typeof window !== "undefined") ? typeof window._spotifyApri : "no window";
  st.textContent = (che === "function") ? "pronto" : "NON caricato (" + che + ")";
  }
  } catch (e) { /* noop */ }
    try {
      db = await openDB();
    } catch (e) {
      console.warn("DB offline su questo browser", e);
      db = null;
    }
    /* Ste: "ci sta un sacco di tempo a caricare".
       I testi delle canzoni sono 1,7 MB e le copertine 130 KB: aspettarli
       bloccava l'app per secondi. Adesso si caricano in secondo piano:
       l'app si usa subito, e i testi arrivano dopo. */
    try { loadLyrics(); } catch (e) { /* i testi non sono indispensabili */ }
    try { loadCovers(); } catch (e) { /* neanche le copertine */ }
    if (db) await loadLocalLyrics();
await loadAll();
    /* Ste: "mentre scorro mi fa riascire su". Riprendo la lista esattamente
       dove l'avevo lasciata. */
    _ripristinaPuntoLibreria();
    recuperaCopertineMancanti();
  refreshCachedSongs();
  /* Controllo anche le copertine nuove: ogni cinque minuti, e subito quando
     torni sull'app. Vedi la nota sopra _ricaricaCopertineSeCambiano. */
  setInterval(() => { _ricaricaCopertineSeCambiano("tempo"); }, 300000);
  try {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) _ricaricaCopertineSeCambiano("ritorno");
    });
    window.addEventListener("focus", () => { _ricaricaCopertineSeCambiano("ritorno"); });
  } catch (e) { /* noop */ }

  /* Appena aperta la pagina, condivido da solo i brani che esistono solo qui:
     non serve ricordarsi di fare niente. Se il PC non c'e' riprovo al prossimo
     avvio, e intanto i brani restano al sicuro qui. */
  setTimeout(() => { condividiBraniLocali(); }, 1200);
  /* Quando sono a casa prendo la chiave dal computer invece di chiederla. */
  setTimeout(() => { _prendiChiaveDalComputer(); }, 2500);
  /* Se il telefono aveva buttato via la pagina, e Ste stava ascoltando,
     provo a rimettere su la musica da solo. */
  _segna("PAGINA APERTA, versione " + APP_VERSION);
  try { setTimeout(() => { _riprendiDopoRicarica(); }, 2000); } catch (e) { /* noop */ }
  /* Spotify: se il telefono e' appena tornato dall'accesso, la finestra si
     apre da sola. E se Ste aveva lasciato una lista in coda aspettando che il
     computer si accendesse, la mando appena il computer c'e'. */
    /* (lo scambio del permesso parte piu' in basso, appena la pagina si apre:
       non deve aspettare la libreria, o quando la rete e' lenta non parte
       mai e l'app ti rimanda a "Accedi con Spotify".) */
  try { setTimeout(() => { _spotifyRiprovaCoda(); }, 7000); } catch (e) { /* noop */ }
  try {
    window.addEventListener("online", () => { _spotifyRiprovaCoda(); });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) _spotifyRiprovaCoda();
    });
  } catch (e) { /* noop */ }
  /* Controllo se questa scheda e' in navigazione privata: e' la causa numero
     uno di "ho cambiato il nome e non e' rimasto". */
  _scopriSeSeiInPrivata();
  /* Ste: "se cambio l'artista e riavvio il sito torna di nuovo come prima".
     La memoria del browser sul telefono non sempre regge, quindi i nomi li
     tengo anche nel database del telefono. Prima di tutto il resto recupero
     quelli da li': devono essere nella libreria gia' dalla prima schermata,
     altrimenti per un attimo i brani si vedono col nome vecchio. */
  _ripristinaRinomini().then((n) => {
    if (n) {
      try { loadAll(); } catch (e) { /* noop */ }
    }
  });
  /* Controllo anche quanti brani sono ancora solo qui (cosi' il bottone
     "Manda al computer" compare) e accendo il ritento automatico. */
      setTimeout(() => { _aggiornaNonCondivisi(); _riprovaCondivisione(); _preparaCasellaServizio(); _aggiornaCoda(); _caricaPlaylistCondivise(); _caricaStatoCondiviso(); _disegnaLinguettePlaylist(); _avvisoIcona(); }, 1600);
  /* Ogni tanto guardo se il computer ha scaricato quello che era in coda:
     cosi' l'utente vede che il brano e' entrato e non deve chiedere. */
  setInterval(() => { _aggiornaCoda(); }, 120000);
  /* Rileggo lo stato condiviso un paio di volte dopo l'avvio: il sito puo'
     essere indietro di qualche minuto, e un nome salvato adesso sul PC o sul
     telefono deve comparire senza aspettare il riavvio. */
  /* Ste: "ho rimesso dei brani nascosti, sono tornati in libreria e
     dopo che si aggiorna l'app sono spariti di nuovo". Se il worker
     non risponde al primo giro i dati non arrivano, e resta tutto
     com'era. Provo piu' volte nei primi due minuti: cosi' un momento
     di rete scarsa non lascia l'app con una copia vecchia. */
  setTimeout(() => { _caricaStatoCondiviso(); }, 5000);
  setTimeout(() => { _caricaStatoCondiviso(); }, 15000);
  setTimeout(() => { _caricaStatoCondiviso(); }, 30000);
  setTimeout(() => { _caricaStatoCondiviso(); }, 60000);
  setTimeout(() => { _caricaStatoCondiviso(); }, 120000);
  _avviaStatistiche();
  /* Ste: "mentre scorro mi fa riascire su". Salvo dove si trova' la lista e
   qual e' il brano che stai ascoltando, cosi' dopo un aggiornamento o un
   ricaricamento torni esattamente dove eri. */
function _salvaPuntoLibreria() {
  try {
    const el = $("playlist");
    if (!el) return;
    LS.set("mb.punto", {
      scorrimento: el.scrollTop,
      brano: (current && current.id) || "",
      profilo: profile
    });
  } catch (e) { /* noop */ }
}

/* Rimette la lista al punto in cui l'avevi lasciata. */
function _ripristinaPuntoLibreria() {
  try {
    const p = LS.get("mb.punto", null);
    if (!p || !p.scorrimento) return;
    if (p.profilo && p.profilo !== profile) return;
    const el = $("playlist");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = p.scorrimento;
      /* Se il brano che stavi ascoltando e' ancora in lista, lo metto in
         evidenza: cosi' lo ritrovi subito senza doverlo cercare. */
      if (p.brano) {
        try {
          const riga = el.querySelector('[data-id="' + p.brano + '"]');
          if (riga) riga.classList.add("punto-ripreso");
        } catch (e) { /* noop */ }
      }
    });
  } catch (e) { /* noop */ }
}

  /* Il numero della versione sempre visibile in alto: e' successo piu' volte
     che il browser restava su una versione vecchia e sembrava che gli
     aggiornamenti non funzionassero. Con questo numero lo vedo subito. */
  try {
    const vf = $("verBadge");
    if (vf) {
      vf.textContent = String(APP_VERSION).replace(/^6\.(\d+).*$/, "6.$1");
      vf.title = "Versione in uso: " + APP_VERSION + "\nTocca per aggiornare subito";
      /* Ste: "se tocco la versione non fa niente". Ricaricare da solo non
         bastava: il worker vecchio continuava a servire il vecchio app.js.
         Ora se c'e' un aggiornamento in attesa gli dico di attivarsi subito,
         e quando e' attivo ricarico davvero. */
      vf.onclick = () => {
        try {
          /* Ste: "la versione non si aggiorna". Con il solo ricaricamento non
             bastava: il telefono teneva la copia vecchia. Adesso il numero
             apre direttamente una pagina "nuova" (indirizzo mai visto, quindi
             niente copia vecchia) e da li' in poi l'app si aggiorna da sola. */
          const nuovoIndirizzo = "./index.html?forza=" + Date.now();
          window.location.replace(nuovoIndirizzo);
        } catch (e) {
          window.location.reload(true);
        }
      };
    }
  } catch (e) { /* noop */ }

  /* La posizione nella lista la ricordo mentre scorro, non solo quando parte
     un aggiornamento: cosi' un ricaricamento qualsiasi non mi butta in cima.
     Ste: "mentre scorro mi fa riascire su". */
  try {
    const el = $("playlist");
    if (el) {
      let _salvoPunto = null;
      el.addEventListener("scroll", () => {
        if (_salvoPunto) clearTimeout(_salvoPunto);
        _salvoPunto = setTimeout(_salvaPuntoLibreria, 600);
      }, { passive: true });
      el.addEventListener("click", () => _salvaPuntoLibreria(), true);
    }
  } catch (e) { /* noop */ }

  /* niente: la finestra dei nascosti e' stata tolta */
    updatePlayerHeight();
    setTimeout(updatePlayerHeight, 300);

    shuffle = LS.get("mb.shuffle", false);
    repeat = LS.get("mb.repeat", false);
    $("btnShuffle").classList.toggle("on", shuffle);
    $("btnRepeat").classList.toggle("on", repeat);

const lastTrack = st.last ? tracks.find((t) => t.id === st.last) : null;
      if (lastTrack) {
        currentId = lastTrack.id;
        /* Ste: "se la riapro mi riparte da zero la canzone". Qui la posizione
           era fissata a 0 di proposito, quindi riaprendo l'app la canzone
           ricominciava SEMPRE dall'inizio. Adesso riprendo davvero da dove
           era rimasta. Se pero' era ferma nei primi secondi, o se il brano e'
           gia' finito, meglio partire dall'inizio. */
        let salvato = Number(st.time != null ? st.time : 0) || 0;
        if (!salvato) salvato = Number(LS.get("mb.pos." + lastTrack.id, 0)) || 0;
        /* Ste: "voglio che dopo 6 ore si resetti". Se l'ultima volta che ho
           ascoltato questa canzone e' piu' vecchia di SEI ORE, non ti rimetto
           a meta' di una canzone che hai lasciato sei ore fa: ricomincio
           dall'inizio. Prima non c'era nessun orario, quindi la posizione
           vecchia sembrava sempre appena salvata. */
        const LIMITE_VECCHIA = 6 * 60 * 60 * 1000;
        let quando = Number(st.quando || 0) || 0;
        if (!quando) quando = Number(LS.get("mb.pos.quando." + lastTrack.id, 0)) || 0;
        const passate = quando ? (Date.now() - quando) : 0;
        const troppoVecchia = quando > 0 && passate > LIMITE_VECCHIA;
        if (troppoVecchia) salvato = 0;
        /* Uso resumeAt, che e' il meccanismo GIA' fatto per questo: se ne'
           accorgono handleMetadata, collegata all'elemento audio. Prima avevo
           aggiunto qui un listener mio che metteva la posizione a mano, e
           quello fermava la canzone quando si riapriva l'app. */
        resumeAt = salvato > 5 ? salvato : 0;
        _segna("ripresa all'avvio", "brano " + lastTrack.id +
          ", posizione salvata " + Math.round(salvato) + "s, riparto da " + resumeAt + "s" +
          (troppoVecchia ? " (ERA VECCHIA di " + Math.round(passate / 60000) + " minuti: ricomincio)" :
            (quando ? ", ascoltata " + Math.round(passate / 60000) + " minuti fa" : "")));
        audio.src = _urlDelBrano(lastTrack);
        _segnaRigaAttiva();
        updateProgressUI(0, 0);
      }

    updateMediaSession();

    if ("serviceWorker" in navigator) {
      let refreshing = false;
      /* Ste: "l'app si aggiorna continuamente e ogni volta toglie le
         canzoni, mentre scorro mi fa riascire su".
         Prima, quando il worker si aggiornava, ricaricavo la pagina DA SOLO
         dopo mezzo secondo. Con gli aggiornamenti frequenti succedeva di
         continuo: la pagina si ricaricava mentre stavi usando l'app (e
         quindi brani che sparivano e lista che tornava in cima).

         Adesso NON ricarico piu' da solo: l'aggiornamento aspetta che
         decidi tu. Se serve subito, tocchi il numero della versione in alto
         (e li ho lasciato anche la posizione della lista, cosi' non perdi
         il punto). */
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: "SET_PROFILE", profile });
        if (refreshing) return;
        refreshing = true;
        _salvaPuntoLibreria();
        try {
          const vb = $("verBadge");
          if (vb) {
            vb.classList.add("ha-aggiornamento");
            vb.title = "C'è un aggiornamento: tocca qui per prenderlo";
          }
        } catch (e) { /* noop */ }
          toast("Aggiornamento pronto: tocca la versione in alto quando vuoi", 6000);
          /* Ste: "l'app non parte e i file restano vecchi".
             Motivo: quando il worker del servizio prende il posto di quello
             vecchio, la pagina restava con i file vecchi e non si
             ricaricava: l'app non si aggiornava mai da sola. Adesso, quando
             il worker cambia, la pagina si ricarica e prende i file nuovi. */
          _segna("il worker del servizio e' cambiato: ricarico per prendere i file nuovi");
          _spotifyTraccia("ricarico: il worker del servizio e' cambiato");
          try { setTimeout(function () { window.location.reload(); }, 400); } catch (e) { /* noop */ }
        });
navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
      swReg = reg;
      /* Controllo gli aggiornamenti OGNI volta che apri la pagina, non solo
         se non c'e' un controller: prima l'aggiornamento partiva a caso e il
         browser restava su una versione vecchia anche per giorni. */
      try { reg.update(); } catch (e) { /* noop */ }
      /* e ogni 10 minuti, se la pagina resta aperta */
      setInterval(() => { try { reg.update(); } catch (e) { /* noop */ } }, 600000);
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              /* Ste: "ancora si aggiorna". La nuova versione ASPETTA che
                 chiuda del tutto l'app (adesso non si impone piu' mentre
                 stai usando: era quello che faceva sparire i brani e ti
                 rimandava la lista in cima). Quindi qui devo dirti cosa
                 fare davvero, altrimenti resta in attesa per sempre. */
              const vb = $("verBadge");
              if (vb) vb.classList.add("ha-aggiornamento");
              toast("Aggiornamento pronto: chiudi del tutto l'app e la riapri", 7000);
              segnalaErrore("aggiornamento pronto: chiudere del tutto l'app per prenderlo");
            }
          });
        }
      });
    }).catch((err) => console.warn("SW fallito", err));
    }

    /* Controllo periodico: la pagina aperta sul telefono o sul PC deve
       accorgersi da sola dei brani nuovi che arrivano dagli altri
       dispositivi. Prima controllavo solo quando aprivi la pagina, quindi se
       la lasciavi aperta non si aggiornava mai. Ora ogni 60 secondi guardo
       online se ci sono piu' brani, e se ci sono ricarico da solo.
       Non ricarico pero' mentre stai scaricando o suonando: in quel caso ti
       mostro un avviso e aggiorno quando sei fermo. */
    let _stoControllando = false;
    function branoInCorso() {
      try {
        if (importList && importList.some((x) => x && x.state === "downloading")) return true;
      } catch (e) { /* noop */ }
      try { if (offlineBusy) return true; } catch (e2) { /* noop */ }
      try { if (anteprimaAudio && !anteprimaAudio.paused) return true; } catch (e3) { /* noop */ }
      return false;
    }
    let _quantiBraniOnline = 0;
function numeroBraniOnline(testo) {
      return (String(testo || "").match(/file:\s*"songs\/track-/g) || []).length;
    }
let _timerBarraAggiornamento = null;
let _barraAggiornamentoMostrata = false;
function _nascondiBarraAggiornamento() {
    /* Ste: "la barra in verde spunta ancora sempre, continuamente anche se non
       c'e' nessun brano nuovo". Prima la barra, una volta comparsa, restava
       lì per sempre. Adesso quando il controllo dice che non c'e' niente di
       nuovo sparisce, e sparisce anche da sola dopo un po' se nessuno la
       tocca. */
    try {
      const a = document.getElementById("avviso-vecchia");
      if (a && a.parentNode) a.parentNode.removeChild(a);
    } catch (e) { /* noop */ }
    _chiudiBarraVersione();
}
/* Il numero della versione in alto diventa giallo quando c'e' qualcosa da
   aggiornare: cosi' sai che e' lui il posto da toccare. */
function _chiudiBarraVersione() {
    try {
      const vb = $("verBadge");
      if (vb) vb.classList.remove("ha-aggiornamento");
    } catch (e) { /* noop */ }
}
function _segnalaBarraVersione() {
    try {
      const vb = $("verBadge");
      if (vb) {
        vb.classList.add("ha-aggiornamento");
        vb.title = "C'è un aggiornamento: tocca qui per prenderlo subito";
      }
    } catch (e) { /* noop */ }
}
/* Ste: "non è cambiato niente".
   Dopo giorni di tentativi si è capito il motivo vero: il sito online era
   gia' giusto, ma il telefono continuava a usare una copia vecchia dei file
   salvati nel browser, quindi ricaricando non cambiava nulla e la pagina
   non si aggiornava da sola.

   Adesso l'app controlla da sola qual e' la versione sul sito e, se il
   telefono e' rimasto indietro, lo dice con una barra e con un collegamento
   che porta a una pagina "nuova": un indirizzo diverso non puo' usare la
   copia vecchia, quindi l'aggiornamento riesce al primo tocco. */
function _controllaSeSonoVecchio() {
    try {
      fetch("./versione.json", { cache: "no-store" })
        .then((r) => (r && r.ok ? r.json() : null))
        .then((d) => {
          if (!d || !d.versione) return;
          const mia = String(APP_VERSION).replace(/\s.*$/, "");
          const loro = String(d.versione).replace(/\s.*$/, "");
          if (mia === loro) {
            _chiudiBarraVecchio();
            return;
          }
          _mostraBarraVecchio(mia, loro);
        })
        .catch(() => { /* niente rete: lascio stare, tanto i brani funzionano lo stesso */ });
    } catch (e) { /* noop */ }
}
function _chiudiBarraVecchio() {
    try {
      const b = document.getElementById("avviso-vecchio-app");
      if (b && b.parentNode) b.parentNode.removeChild(b);
    } catch (e) { /* noop */ }
}
function _mostraBarraVecchio(mia, loro) {
    try {
      _chiudiBarraVecchio();
      const b = document.createElement("div");
      b.id = "avviso-vecchio-app";
      b.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:120;" +
        "background:#3a1414;border:1px solid #ff6b6b;color:#ffe2e2;padding:12px 14px;" +
        "border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.5)";
      /* Il collegamento porta a "?forza=<momento>", un indirizzo mai visto
         prima: il browser non ha niente da riprendere e prende i file nuovi. */
      const a = document.createElement("a");
      a.href = "./index.html?forza=" + Date.now();
      a.textContent = "Aggiorna ora";
      a.style.cssText = "display:inline-block;margin-top:8px;background:#ff6b6b;color:#3a1414;" +
        "font-weight:800;padding:9px 16px;border-radius:8px;text-decoration:none";
      const t = document.createElement("div");
      t.textContent = "Questo telefono sta ancora sulla versione " + mia +
        " (ora c'è la " + loro + "). Tocca per aggiornare.";
      b.appendChild(t);
      b.appendChild(a);
      document.body.appendChild(b);
    } catch (e) { /* noop */ }
}
function avvisoAggiornamento(testo) {
    /* Ste: "la barra in verde spunta ancora sempre". Oltre a toglierla quando
       non c'e' niente, adesso sparisce anche da sola dopo 30 secondi se nessuno
       la tocca: cosi' non resta piu' appesa li' a disturbare la libreria.
       E il numero della versione in alto diventa giallo, cosi' sai che il
       posto da toccare per aggiornare e' quello. */
    _segnalaBarraVersione();
    try {
      /* Ste: "la barra verde resta per troppo tempo". Prima il timer veniva
         riacceso a ogni controllo (ogni minuto), quindi la barra non spariva
         mai finche' la condizione restava vera: era un avviso che non
         ascoltava nessuno. Adesso, se la barra e' gia' stata mostrata e
         Ste non l'ha toccata, non la riaccendo piu': sparisce e basta. */
      if (!_barraAggiornamentoMostrata) {
        _barraAggiornamentoMostrata = true;
        clearTimeout(_timerBarraAggiornamento);
        _timerBarraAggiornamento = setTimeout(() => {
          _nascondiBarraAggiornamento();
        }, 20000);
      }
    } catch (e) { /* noop */ }
    let avviso = document.getElementById("avviso-vecchia");
    if (avviso) {
      /* Ste: "la barra in verde spunta sempre anche se non ho messo niente".
         Il motivo era che la barra, una volta comparsa, non se ne andava
         piu': restava li' per sempre anche quando ormai non c'era piu' nulla
         da aggiornare. Adesso quando non c'e' niente la tolgo. */
      avviso.textContent = testo + " Tocca qui per aggiornare adesso.";
      avviso.onclick = () => {
        avviso.textContent = "Aggiorno...";
        /* Se la tocca davvero, la prossima volta la barra puo' ricomparire. */
        _barraAggiornamentoMostrata = false;
        if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((r) => r && r.update());
        setTimeout(() => window.location.reload(true), 900);
      };
      return;
    }
avviso = document.createElement("div");
    avviso.id = "avviso-vecchia";
    avviso.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:99;" +
      "background:#132a1f;border:1px solid #37e6a6;color:#c8ffe6;padding:12px 14px;" +
      "border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)";
    document.body.appendChild(avviso);
    avviso.textContent = testo + " Tocca qui per aggiornare adesso.";
    avviso.onclick = () => {
      avviso.textContent = "Aggiorno...";
      if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((r) => r && r.update());
      setTimeout(() => window.location.reload(true), 900);
    };
  }
    function controllaAggiornamenti() {
      if (_stoControllando) return;
      if (document.hidden) return;              // non aggiorno la pagina che non guardi
      if (!navigator.onLine) return;
      _stoControllando = true;
      let miei = 0;
      try { miei = (typeof BUILTIN !== "undefined" && BUILTIN.length) ? BUILTIN.length : 0; } catch (e) { miei = 0; }
      fetch("app.js?t=" + Date.now(), { cache: "no-store" })
        .then((r) => r.ok ? r.text() : "")
        .then((txt) => {
          _stoControllando = false;
          if (!txt) return;
          const suoi = numeroBraniOnline(txt);
          const m = /APP_VERSION\s*=\s*"([\d.]+)"/.exec(txt);
          const versioneNuova = !!(m && m[1] !== String(APP_VERSION));
          const braniNuovi = suoi > miei;
          if (!braniNuovi && !versioneNuova) {
        /* Niente di nuovo: la barra (se c'era) non deve restare appesa li'. */
        _nascondiBarraAggiornamento();
        return;
      }
const che = [];
      if (braniNuovi) che.push((suoi - miei) + (suoi - miei === 1 ? " brano nuovo" : " brani nuovi"));
          if (versioneNuova) che.push("versione " + (m ? m[1] : "?"));
          segnalaErrore("aggiornamento disponibile: " + che.join(" e ") +
            " (qui " + miei + " brani, online " + suoi + ")");

          /* Ste: "spesso spunta la barra verde 'Si puo' aggiornare: 1 brano
             nuovo' anche se non c'e' niente di nuovo, e resta per un sacco di
             tempo". Motivo: i brani nuovi NON hanno bisogno di un aggiornamento,
             entrano da soli nella libreria (e' checkForNewSongs che li porta).
             La barra li annunciava come se dovessi fare qualcosa, ma non c'era
             niente da fare: quindi adesso la barra parla SOLO delle versioni,
             cioe' di cose che devo fare davvero io (toccare per aggiornare). */
          if (!versioneNuova) {
            _nascondiBarraAggiornamento();
            return;
          }
          if (branoInCorso()) {
            /* Sta suonando qualcosa: non lo interrompo. Appena finisce il
               brano riprovo e mi aggiorno da solo. */
            avvisoAggiornamento("C'e' " + (che.length ? "e' " : "") + che.join(" e ") + ":");
            return;
          }
          /* Ste: per sei volte di fila ha provato correzioni che il telefono
             non aveva MAI prese, perche' l'aggiornamento era solo una riga da
             toccare e non lo toccava. E io intanto corregevo e corregevo una
             versione che nessuno stava usando: la piu' inutile delle cose.
             Prima l'aggiornamento automatico c'era, ma entrava in un ciclo
             di ricariche quando compariva un brano nuovo (l'ho visto sei
             volte in 45 secondi). Percio' lo riporto SOLO per le versioni,
             che sono rare, e con un segno che ricorda di non farlo due
             volte per la stessa versione: il ciclo non puo' tornare. */
          const _versioneDaPrendere = m ? String(m[1]) : "";

          /* Ste: "col volume basso non cambia nulla". Motivo: il telefono aveva

             in cache il brano potenziato VECCHIO (quasi uguale all'originale)

             e la rivalidazione aspettava un'ora. Ora, quando c'e' una versione

             nuova, dico al service worker di svuotare le cache dei brani: la

             prima canzone dopo arriva nuova. */

          try {

            if (navigator.serviceWorker && navigator.serviceWorker.controller) {

              navigator.serviceWorker.controller.postMessage({ type: "SVUOTA-CANZONI", profile });

            }

          } catch (e) { /* noop */ }
          /* l'ultimo momento in cui Ste ha toccato lo schermo: serve per non
   ricaricare l'app mentre la sta usando */
let _ultimoTocco = Date.now();
          let _giaRicaricata = false;
          try { _giaRicaricata = sessionStorage.getItem("mb.aggiornatoA") === _versioneDaPrendere; } catch (e) { }
          /* Ste: "se scorro mentre cerco una canzone e si aggiorna mi ritorna
     all'inizio no?". Aspetto che il dito stia fermo: se mi tocca
     ancora, rimetto tutto e riprovo al prossimo giro. Ricaricare
     mentre sta usando lo schermo e' sempre scomodo. */
  const _toccatoPiuFa = () => {
    try { return Date.now() - _ultimoTocco < 6000; } catch (e) { return false; }
  };
/* Ste: "premo accedi con spotify, mi spunta per un attimo 'apri spotify'
   ma poi e' come se si aggiornasse la pagina e si toglie".

   Motivo: quando c'e' una versione nuova, l'app si ricarica da sola dopo
   un secondo e mezzo. E siccome io pubblico spesso, succedeva a caso: se
   il pannello di Spotify era aperto, il ricaricamento lo chiudeva mentre
   cercavo il link.

   Ora, se c'e' un pannello aperto (o un accesso a Spotify in corso), il
   ricaricamento ASPETTA: si fa quando non stai usando niente. */
function _pannelloAperto() {
  try {
    /* un accesso a Spotify in corso: se mi ricarico, perdo tutto */
    if (_loginSpotifyInCorso) return true;
    const p = $("spotifyPanel");
    if (p && !p.hidden) return true;
    /* un accesso a Spotify in corso: se mi ricarico, perdo il codice */
    if (LS.get("mb.spotifyStato", "")) return true;
    /* Ste: "premo apri spotify, la pagina si ricarica e mi spunta di nuovo accedi
       con spotify". Motivo: il ricaricamento automatico (quando c'e' una versione
       nuova) partiva proprio mentre tornavo da Spotify, e il codice che Spotify
       aveva messo nell'indirimento andava perso. Adesso, se c'e' un rientro in
       corso, l'app NON si ricarica e aspetta. */
    try {
      const cerca = String(window.location.search || "");
      if (cerca.indexOf("code=") >= 0 || cerca.indexOf("error=") >= 0) return true;
      if (sessionStorage.getItem("mb.spotifyRitorno")) return true;
    } catch (e) { /* noop */ }
    const q = $("scopePanel");
    if (q && !q.hidden) return true;
  } catch (e) { /* noop */ }
  return false;
}
function _ricaricaQuandoLibero() {
  try {
    _spotifyTraccia("sto per ricaricare la pagina (aggiornamento)");
    if (_pannelloAperto()) {
    setTimeout(function () { _ricaricaQuandoLibero(); }, 6000);
    return;
    }
    /* Ricarico da un indirizzo mai visto (con "?forza="): cosi' non prendo
       la copia VECCHIA dalla cache del browser. Era anche per questo che
       l'app restava ferma alla versione precedente e non si aggiornava
       piu'. */
    try {
    window.location.replace("./index.html?forza=" + Date.now());
    } catch (e) {
    window.location.reload();
    }
  } catch (e) { /* noop */ }
}
  if (!_giaRicaricata && _versioneDaPrendere) {
              try { sessionStorage.setItem("mb.aggiornatoA", _versioneDaPrendere); } catch (e) { }
              /* Ste: l'app resta bloccata su una versione vecchia e non
                 riprova piu'. Motivo: il segnale "ho gia' preso questa
                 versione" veniva messo PRIMA del ricaricamento, ma il
                 ricaricamento poteva prendere ancora il file vecchio (il
                 worker del servizio non era ancora pronto): l'app si
                 credeva aggiornata e non riprovava piu'. Adesso, se dopo
                 il ricaricamento la versione che gira e' ancora diversa,
                 il segnale viene tolto e l'app riprova. */
              try {
                if (String(APP_VERSION) !== String(_versioneDaPrendere)) {
                  sessionStorage.removeItem("mb.aggiornatoA");
                }
              } catch (e) { /* noop */ }
              /* Ste: "l'app non parte e i file restano vecchi".
                 Motivo: il worker del servizio aspettava che l'app venisse
                 chiusa del tutto per prendere il posto di quello vecchio, e
                 l'app non glielo chiedeva MAI: quindi i file che serviva
                 dalla cache erano sempre quelli vecchi (e se uno era
                 finito rotto, l'app non partiva proprio: schermata vuota e
                 pulsanti senza icona). Adesso glielo dico: "attivati subito". */
              try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
                  _segna("chiedo al worker del servizio di attivarsi subito");
                }
              } catch (e) { /* noop */ }
              toast("C'e' la versione " + _versioneDaPrendere + ": aggiorno e riparto", 4000);
            setTimeout(function () {
              try {
                /* Ste: "se scorro mentre cerco una canzone e si aggiorna mi
                   ritorna all'inizio no?". Aspetto che il dito stia fermo:
                   se mi tocca ancora, rimetto tutto e riprovo dopo. Lo
                   scorrimento della libreria viene gia' ricordato, ma non
                   voglio nemmeno ricaricargli la schiena sotto gli occhi. */
                if (_toccatoPiuFa()) {
                  setTimeout(function () { controllaAggiornamenti(); }, 12000);
                  return;
                }
                _ricaricaQuandoLibero();
              } catch (e) { }
            }, 1500);
            return;
          }
          /* Ste: "continua a ricaricarsi". Questo era il colpevole: trovando
             un brano nuovo, la pagina si ricaricava DA SOLA dopo 1,2 secondi.
             E siccome scaricando una canzone dal telefono il computer la
             aggiunge subito, capitava ogni volta: ricarica, trova un brano,
             ricarica all'infinito (l'ho visto 6 volte in 45 secondi).

             Adesso NON ricarico piu' da solo: ti metto la riga sotto con
             quello che c'e' di nuovo e tocchi tu quando vuoi. E comunque i
             brani nuovi entrano da soli, senza ricaricare: li aggiorna
             checkForNewSongs. */
          avvisoAggiornamento("Si puo' aggiornare: " + che.join(" e ") + ".");
        })
        .catch(() => { _stoControllando = false; });
    }
    setInterval(controllaAggiornamenti, 60000);
    setTimeout(controllaAggiornamenti, 8000);

    /* ---------- Installare sul telefono ----------
       Il sito gia' e' un'app: ha icona, si apre a schermo intero e funziona
       anche senza rete. Quello che manca e' il tocco per metterla sulla home.
       Un'app installata e' anche piu' adatta a tenere suonando con lo
       schermo spento, perche' non e' piu' una scheda del navigatore.
       Lo chiedo solo una volta, e solo se il telefono me lo offre. */
    (function offersInstall() {
      const giaInstallata = window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      if (giaInstallata) return;
      if (localStorage.getItem("mb.install-chiesto") === "si") return;
      let evento = null;
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        evento = e;
        if (localStorage.getItem("mb.install-chiesto") === "no") return;
        try { _offriInstalla(); } catch (err) { /* noop */ }
      });
      function _offriInstalla() {
        const bar = document.createElement("div");
        bar.className = "barra-installa";
        bar.innerHTML = '<span class="barra-testo">Mettila sulla home: si apre come un\'app vera e suona anche a schermo spento</span>' +
          '<button type="button" class="barra-si">Installa</button>' +
          '<button type="button" class="barra-no" aria-label="Non ora">X</button>';
        document.body.appendChild(bar);
        requestAnimationFrame(() => bar.classList.add("visibile"));
        const chiudi = () => { bar.classList.remove("visibile"); setTimeout(() => bar.remove(), 300); };
        bar.querySelector(".barra-si").addEventListener("click", async () => {
          localStorage.setItem("mb.install-chiesto", "si");
          chiudi();
          if (evento) { evento.prompt(); try { await evento.userChoice; } catch (e) { /* noop */ } }
        });
        bar.querySelector(".barra-no").addEventListener("click", () => {
          localStorage.setItem("mb.install-chiesto", "no");
          chiudi();
        });
      }
      /* Su iPhone il navigatore non offre l'installazione: li lascio
         comunque la scorciatoia, perche' li si installa a mano. */
      const iPhone = /iPad|iPhone|iPod/.test(navigator.userAgent || "");
      if (iPhone) {
        const aspetto = setTimeout(() => {
          if (localStorage.getItem("mb.install-chiesto")) return;
          toast("Per metterla sulla home: icona di condivisione, poi 'Aggiungi alla schermata Home'");
        }, 6000);
        void aspetto;
      }
    })();
  })();


/* ============================================================
   Da qui in poi c'era il file spotify.js, ora dentro app.js.

   Ste: sette versioni di correzioni e il pulsante non partiva mai.
   La finestrella si apriva, ma il codice no. Non si sa perche' il file
   non venisse eseguito: e' online identico e senza errori. Dopo sette
   tentativi smetto di cercare il fantasma e toglio il problema: se
   app.js funziona sempre, anche Spotify deve stare qui dentro.
   ============================================================ */

/* ---------- Importa una playlist di Spotify ----------

   Ste: "posso mettere il link della mia playlist di spotify e in automatico
   importa le canzoni?".

   Come funziona, e cosa NON fa:
   - Spotify non si puo' scaricare (ha una protezione, vale per tutti), quindi
     l'audio non viene da Spotify: viene da YouTube, come sempre.
   - Da Spotify prendiamo solo l'ELENCO delle canzoni, e serve l'accesso con
     l'account di Ste perche' le sue playlist sono private. Le playlist
     pubbliche si vedrebbero anche senza, ma il login serve per le sue.
   - L'accesso e' col metodo "authorization code con PKCE": non c'e' nessuna
     password e nessun segreto, e il permesso vale solo per questa app sul
     telefono di Ste.

   Il Client ID e' pubblico (non e' una password): puo' stare nel codice.
   Comunque lo teniamo in un posto solo cosi' e' facile cambiarlo. */
const SPOTIFY_CLIENT_ID = "97b894cf504b412fa96e5a7ced1880c4";
const SPOTIFY_REDIRECT = "https://stefanovillaggio8-dot.github.io/music-box/";
  /* Ste: "da Spotify: 0 playlist (errore 403)".
     Il 403 vuol dire "accesso non sufficiente": il token c'e' ma manca un
     permesso. Chiedo quindi il pacchetto completo di quelli che servono
     per leggere le playlist (private, collaborative e il profilo), cosi'
     non dipende da cosa era stato concesso tanto tempo fa. */
  const SPOTIFY_SCOPI = "playlist-read-private playlist-read-collaborative user-read-private user-read-email";

let _spotifyAccess = null;
/* All'avvio l'app controlla se il permesso di Spotify e' valido, ma non deve
   aprire niente: il pannello di Spotify si apre solo se lo chiede Ste. */
let _spotifySilenzioso = true;
let _spotifyChiave = null;   /* la "code_verifier" dell'accesso in corso */

function _spotifySalvaToken(t) {
  const valore = {
    access: t.access_token,
    scadenza: Date.now() + (Number(t.expires_in || 3600) - 60) * 1000
  };
  /* Ste: "appena premo apri spotify mi spunta di dare il consenso, poi si
     apre music box ma c'e' scritto che l'accesso e' scaduto".
     Motivo: l'app teneva un permesso VECCHIO e scartava quello appena
     scambiato (che era quello buono): cosi' Spotify rispondeva 403 e
     l'app diceva "accesso scaduto".
     Adesso la regola e' semplice: l'ULTIMO permesso che arriva vince,
     perche' e' il piu' nuovo. E sul 403 (permesso senza i permessi
     giusti) il permesso viene buttato via, cosi' la volta dopo se ne
     chiede uno nuovo. */
  /* Il "refresh token" e' il permesso che dura: con quello Spotify mi

     rinnova il permesso corto senza che Ste debba riautorizzare. */
  if (t && t.refresh_token) valore.refresh = String(t.refresh_token);
  let salvato = false;
  try { LS.set("mb.spotify", valore); salvato = true; } catch (e) { /* noop */ }
  /* Ste: "stai usando la finestra PRIVATA di Safari". In privata la memoria
     non sopravvive: il token sparisce e l'app ti chiede l'accesso ogni
     volta. Salvo anche in sessionStorage, che regge per la sessione
     anche in privata: cosi' almeno finche' non chiudi la scheda
     l'accesso resta. */
  try { sessionStorage.setItem("mb.spotify", JSON.stringify(valore)); } catch (e) { /* noop */ }
  /* Se questa scheda e' stata aperta da un'altra (l'app di casa che ha lanciato
     l'accesso), le mando il permesso: cosi' anche li' funziona. */
  try {
    if (window.opener && !window.opener.closed && window.opener.postMessage) {
      window.opener.postMessage({ musicbox: "spotify-token", token: valore }, "*");
    }
  } catch (e) { /* noop */ }
  return salvato;
  }
  function _spotifyToken() {
  try {
    let v = LS.get("mb.spotify", null);
    if (!v || !v.access) {
      /* provo la copia di sessione (serve in privata) */
      try { v = JSON.parse(sessionStorage.getItem("mb.spotify") || "null"); } catch (e) { v = null; }
    }
    if (!v || !v.access) return "";
    if (Number(v.scadenza || 0) < Date.now()) return "";
    return String(v.access);
    } catch (e) { return ""; }
  }

/* Il codice di verifica per PKCE: una stringa casuale, e il suo "impronta"
   SHA-256 che Spotify pretende di vedere al posto della password. */
async function _spotifyPkce() {
  const byte = new Uint8Array(48);
  crypto.getRandomValues(byte);
  const verifier = _b64url(byte);
  /* Ste: "dal PC mi dice 'il telefono non mi fa fare le operazioni sicure'".
     Motivo: crypto.subtle esiste solo in una pagina sicura (https, oppure
     localhost). Sul computer l'app sta su http://100.x, e li' non c'e'.
     Per questo uso lo SHA-256 scritto a mano quando manca quello del
     browser: e' piu' lento, ma funziona anche senza HTTPS. */
  let somma = null;
  try {
    if (crypto && crypto.subtle && typeof crypto.subtle.digest === "function") {
      somma = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    }
  } catch (e) { somma = null; }
  if (!somma) somma = _sha256Testo(verifier);
  return { verifier: verifier, sfida: _b64url(new Uint8Array(somma)) };
}

/* Step 1: butto Ste su Spotify per l'accesso. */
async function _spotifyAccedi(soloAutomatico) {
  /* Ste, 21/10/2026: "all'avvio dell'app si apre spotify".
     Se l'accesso parte DA SOLO (soloAutomatico) e l'app e' aperta come app
     (dall'icona sulla schermata), non lo faccio: l'accesso automatico parte
     solo quando arrivi da un link. Se invece lo preme lui, passo sempre. */
  try {
    const daIcona = (window.navigator && window.navigator.standalone === true) ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    if (soloAutomatico && daIcona) {
      _spotifyTraccia("accesso automatico fermato: l'app e' aperta come app");
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("spotify");
        window.history.replaceState({}, "", u.toString());
      } catch (e) { }
      return;
    }
  } catch (e) { /* noop */ }
  /* Ste: "l'accesso funziona, ma poi su questo link non c'e' piu' niente".
     Spotify rimanda sempre al link sicuro, e il permesso vale solo per il
     sito in cui e' nato. Se sono su una pagina "http" (quella di casa o
     quella di tailscale), allora l'accesso lo faccio sul link sicuro, che e'
     l'unico dove Spotify puo' rimandare. */
  try {
    const dove = String(window.location.origin || "");
    const sicuro = "https://stefanovillaggio8-dot.github.io";
    if (dove && dove !== sicuro && !/127\.0\.0\.1|localhost/.test(dove)) {
      _spotifyTraccia("accesso da un link http: lo faccio sul link sicuro");
      toast("Ti apro l'app su internet per il permesso di Spotify", 4000);
      window.open(sicuro + "/music-box/?spotify=accedi", "_blank");
      return;
    }
  } catch (e) { /* noop */ }
  /* Ste: "se premo accedi con spotify si ricarica la pagina e spunta di
     nuovo accedi con spotify".

     Motivo: il pulsante chiudeva il pannello e poi partiva l'accesso. Ma
     chiudendo il pannello, il controllo "c'e' un pannello aperto?" diceva
     no, e il ricaricamento automatico (che parte quando c'e' una versione
     nuova) scattava proprio mentre l'accesso era in mezzo: la pagina si
     ricaricava e l'accesso andava perso.

     Adesso: il pannello resta aperto (deve, cosi' si vede il link
     "Apri Spotify") e un segnale dedicated dice che l'accesso e' in
     corso, cosi' il ricaricamento aspetta. */
  _loginSpotifyInCorso = true;
  /* Segnalo che l'accesso e' partito QUI: sta nella memoria della scheda,
     cosi' se la pagina si ricarica l'app lo sa e non ripropono la scelta
     fra le due strade (che era il giro a vuoto). */
  try { _segnaAccessoQui(); } catch (e) { /* noop */ }
  /* Un accesso nuovo cancella l'errore del tentativo vecchio: altrimenti
     quello resta scritto e l'app sembra ancora rotta. */
  try { LS.remove("mb.spotifyErrore"); LS.remove("mb.spotifyErroreQuando"); } catch (e) { /* noop */ }
  if (!SPOTIFY_CLIENT_ID) { toast("Manca il Client ID di Spotify"); _loginSpotifyInCorso = false; return; }
  let pk;
  try { pk = await _spotifyPkce(); } catch (e) {
  toast("Il telefono non mi fa fare le operazioni sicure: usa Safari aggiornato");
  _loginSpotifyInCorso = false;
  return;
  }
  /* ATTENZIONE: la chiave DEVE sopravvivere al salto su Spotify. Se resta
     solo in una variabile, la pagina si ricarica e la variabile sparisce:
     al ritorno non c'e' niente da scambiare e il login finisce con
     "Accesso scaduto". Percio' la metto via insieme al suo stato. */
  _spotifyChiave = pk.verifier;
  /* "base" qui non esisteva: era un aiutante definito dentro _spotifyPkce,
  e quindi non era in vista qui. Ogni tocco su "Accedi con Spotify"
  moriva con un ReferenceError, e l'errore finiva in un cassetto
  (vedi il gestore degli errori in cima all'app) senza che si vedesse
  niente. Ora uso l'aiutante vero, _b64url. */
  /* Ste: "dice accesso non valido, riprova".
     Motivo: la chiave (verifier) la tenevo nella memoria del telefono, e
     se l'accesso partiva da un link (tailscale) e tornava su un altro
     (github.io), la chiave restava sull'altra origine e al ritorno non
     c'era: "accesso non valido".

     Adesso la chiave viaggia dentro il "state", che Spotify rimanda
     indietro identico. Cosi' funziona da qualunque link, senza dover
     stare attenti a dove e' cominciato. */
  const stato = _b64url(new TextEncoder().encode(String(Date.now()))) + "." + pk.verifier;
  try {
    LS.set("mb.spotifyStato", stato);
    LS.set("mb.spotifyChiave", pk.verifier);
  } catch (e) { /* noop */ }
  const q = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT,
    scope: SPOTIFY_SCOPI,
      code_challenge: pk.sfida,
      code_challenge_method: "S256",
      /* "offline" chiede a Spotify anche il permesso lunghissimo: senza,
         dopo un'ora l'app chiede l'accesso di nuovo. */
      access_type: "offline",
      state: stato
    });
  const url = "https://accounts.spotify.com/authorize?" + q.toString();

  /* Ste: "sto aprendo spotify ma non si apre", e poi "non compare manco il
     pulsante". Prima scrivevo una riga e saltavo, e se il salto non
     partiva compariva un link DOPO due secondi e mezzo: ma proprio
     mentre succedeva il salto portava l'app in secondo piano, il codice
     vedeva la pagina nascosta e non mostrava niente. Il link spariva
     proprio quando serviva.
     Adesso il link compare SUBITO e resta li'. Un tocco su un link vero
     funziona sempre: lo gestisce il telefono, non il nostro codice. */
  /* Ste: "si apre una pagina nera senza indirizzo e ritorna a musicbox".
     Motivo: con l'app installata sulla schermata Home, aprire una finestra
     nuova su iPhone fa una schermata NERA (la web app non puo' uscire dal
     suo indirizzo). Per questo, se l'app e' aperta dalla schermata Home non
     apro nessuna finestra: lascio il link e lo gestisce il telefono. */
  let daIcona = false;
  try {
    daIcona = !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  } catch (e) { daIcona = false; }
  if (daIcona) {
    /* Ste: "faccio apri spotify e mi riporta a music box".
       Motivo: quando Spotify rimanda all'app, iPhone apre la "web app"
       installata sulla home, e la riapre DALLA SUA ICONA: l'indirimento
       riparte pulito e il codice che Spotify aveva messo sparisce. Quindi
       dall'icona l'accesso non puo' funzionare.
       Adesso il pulsante apre l'app sul link sicuro: quella si apre nel
       BROWSER (iPhone apre le schede nuove di una web app nel browser), e
       li' il ritorno torna col codice e lo scambio avviene. */
    _spotifyTraccia("sono nella web app: l'accesso parte nel browser");
    const dove2 = "https://stefanovillaggio8-dot.github.io/music-box/?spotify=accedi";
    try {
      _spotifyPnl("Accedi a Spotify", "si apre nel browser",
        "<p class=\"step-hint\">Su iPhone, l'app sulla schermata Home e il browser hanno due memorie separate, e quando torni da Spotify il sistema riapre l'app dall'iccola: l'indirimento riparte pulito e l'accesso si perde. Per questo il pulsante qui sotto apre l'app nel BROWSER: li' l'accesso funziona.</p>" +
        '<a class="btn-main" style="display:block;text-align:center;margin-top:10px" href="' +
        String(dove2).replace(/&/g, "&amp;") + '" target="_blank" rel="noopener">Accedi con Spotify (nel browser)</a>');
    } catch (e) { /* noop */ }
    return;
  }
  try {
    /* Ste: "premo accedi con spotify dal browser e mi si apre una pagina e
       subito dopo mi porta di nuovo a scegliere".
       Motivo: il pannello offriva SEMPRE le due strade, e premendo quella
       del browser si apriva una scheda nuova dove ricominciava tutto da capo
       (un giro a vuoto).
       Adesso: la strada del browser la offro SOLO quando l'accesso non e'
       gia' partito in questa scheda. Quando e' partito qui, il pannello
       dice una cosa sola: "tocca Apri Spotify". */
    const sicuro = "https://stefanovillaggio8-dot.github.io/music-box/?spotify=accedi";
    if (_accessoQui()) {
      _spotifyPnl("Accedi a Spotify", "manca solo il via libera a Spotify",
        '<p class="step-hint">Tocca il pulsante qui sotto: si apre Spotify, li dai il permesso e poi torni qui. Me lo dai una volta sola e non ti chiedo la password.</p>' +
        '<a class="btn-main" style="display:block;text-align:center;margin-top:10px" id="spotifyApriLink" href="' +
        String(url).replace(/&/g, "&amp;") + '" target="_blank" rel="noopener">Apri Spotify</a>');
    } else {
      _spotifyPnl("Accedi a Spotify", "un tocco e si apre",
        '<p class="step-hint">Tocca il pulsante qui sotto: si apre l\'app su internet, e l\'accesso a Spotify si fa li\' (funziona sia dall\'app della schermata Home sia dal browser). Me lo dai una volta sola e non ti chiedo la password.</p>' +
        '<a class="btn-main" style="display:block;text-align:center;margin-top:10px" href="' +
        String(sicuro).replace(/&/g, "&amp;") + '" target="_blank" rel="noopener">Accedi con Spotify (nel browser)</a>' +
        '<p class="step-hint" style="margin-top:14px">Se sei gia\' nel browser e preferisci fare tutto qui, c\'e\' anche questa strada:</p>' +
        '<a class="btn-main" style="display:block;text-align:center;margin-top:10px" id="spotifyApriLink" href="' +
        String(url).replace(/&/g, "&amp;") + '" target="_blank" rel="noopener">Apri Spotify</a>');
    }
    /* Ste: "non va ancora". Motivo: del pannello dell'accesso non arrivava
       nessuna traccia, e cosi' non sapevo quale pulsante avesse premuto.
       Adesso ogni tocco lascia un segno. */
    try {
      const legame = $("spotifyApriLink");
      if (legame) legame.addEventListener("click", function () {
        _spotifyTraccia("premo il link 'Apri Spotify' (sto andando su Spotify)");
      });
    } catch (e) { /* noop */ }
  } catch (e) { /* noop */ }
  _spotifyTraccia("accesso: sto per aprire Spotify");
  let aperta = false;
  if (daIcona) {
    /* Nella web app non apro finestre: su iPhone fanno una schermata nera.
       Il link qui sopra basta, e si apre nel browser. */
    _spotifyTraccia("sono nella web app: niente finestra nuova, devi toccare il link");
    return;
  }
  try {
  /* il tocco e' suo: e' l'unico modo che iOS lascia passare quando
  l'app e' installata sulla schermata Home */
  const f = window.open(url, "_blank");
  aperta = !!(f && !f.closed);
  _spotifyTraccia("finestra nuova: " + (aperta ? "aperta" : "bloccata"));
  } catch (e) { _spotifyTraccia("finestra nuova: bloccata"); }
  /* Ste: "se premo accedi con spotify si ricarica la pagina".
  Prima, se la finestra nuova non si apriva, l'app SALTA via di sua sponda
  (location.href = url): la pagina spariva e tornava, e sembrava un
  ricaricamento a caso. Inoltre l'accesso a meta' perdevi.
  Non lo faccio piu': il link qui sotto c'e' SEMPRE, e un tocco su un link
  vero lo gestisce il telefono, non il nostro codice. */
  if (!aperta) {
  try { _spotifyTraccia("salto diretto: non lo faccio, resta il link"); }
  catch (e) { /* noop */ }
  }
}

/* Step 2: Spotify rimanda qui con ?code=... e io scambio il codice per il
   permesso vero. */
/* Ste: "non funziona ancora a spotify".
   Motivo: lo scambio lo faceva il telefono, e li' la richiesta restava
   appesa (iPhone sospende la scheda quando non la guardi) o moriva con la
   pagina (quando l'app si aggiorna e si ricarica). Sul server non succede
   niente di tutto questo: la richiesta a Spotify parte, va e torna.
   Adesso: il telefono manda il codice al worker, il worker fa lo scambio e
   da' indietro un "biglietto"; il telefono poi chiede se il permesso e'
   pronto (il biglietto va e basta una volta). */
/* Il worker tiene il permesso per qualche minuto e lo dà a chi ha il
   biglietto giusto. Il biglietto va e basta una volta. */
  /* Ste: "dice accesso scaduto".
     Il permesso di Spotify dura un'ora sola, ma ce n'e' uno lungo che
     permette di rinnovarlo: adesso l'app lo rinnova da sola, in silenzio,
     e non costringe a riautorizzare ogni ora. */
  async function _spotifyRinnovaSeScaduto() {
    try {
      const v = LS.get("mb.spotify", null);
      if (!v || !v.access) return false;
      if (!v.refresh) return false;
      if (Number(v.scadenza || 0) > Date.now() + 60000) return true;  /* ancora buono */
      _spotifyTraccia("il permesso e' scaduto: lo rinovo");
      const r = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: v.refresh })
      });
      const j = await r.json();
      if (!j || !j.ok || !j.permesso || !j.permesso.access_token) {
        _spotifyTraccia("non sono riuscito a rinnovare il permesso");
        try { _mostraCollegatoNo(); } catch (e) { /* noop */ }
        return false;
      }
      _spotifySalvaToken(j.permesso);
      try { _mostraCollegatoSi(); } catch (e) { /* noop */ }
      _spotifyTraccia("permesso rinnovato");
      return true;
    } catch (e) {
      return false;
    }
  }

  async function _spotifyPrendiPermesso(biglietto) {
    if (!biglietto) return false;
    try { _mostraCollegatoNo(); } catch (e) { /* noop */ }
  try {
    for (let giro = 0; giro < 60; giro++) {
      const r = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify?biglietto=" + encodeURIComponent(biglietto), { cache: "no-store" });
      const j = await r.json();
      if (j && j.ok && j.permesso) {
        _spotifySalvaToken(j.permesso);
        try { _mostraCollegatoSi(); } catch (e) { /* noop */ }
        try { sessionStorage.removeItem("mb.spotifyBiglietto"); } catch (e) { /* noop */ }
        return true;
      }
      await new Promise(function (r2) { setTimeout(r2, 500); });
    }
    _spotifyTraccia("il permesso non e' arrivato in tempo");
    return false;
  } catch (e) {
    _spotifyTraccia("errore nel prendere il permesso: " + String((e && e.message) || e));
    return false;
  }
}
async function _spotifyCompletaAccesso(code, stato) {
  if (!code || !stato) return false;
  /* La chiave (verifier) la prendo PRIMA dal "state", che viaggia
     nell'indirimento di ritorno: cosi' funziona anche se l'accesso e'
     cominciato su un link e torna su un altro (tailscale -> github.io). */
  let verifier = "";
  const parti = String(stato).split(".");
  if (parti.length >= 2) verifier = parti.slice(1).join(".");
  if (!verifier) {
    try { verifier = String(LS.get("mb.spotifyChiave", "")); } catch (e) {}
  }
  if (!verifier) verifier = _spotifyChiave || "";
  if (!verifier) {
    _spotifyTraccia("NON TROVO LA CHIAVE: state lungo " + String(stato || "").length + ", parti " + parti.length + ", memoria " + String(LS.get("mb.spotifyChiave", "") || "").length);
    toast("Accesso scaduto, riprova");
    return false;
  }
  _spotifyTraccia("chiave trovata (lunga " + verifier.length + ")");
  /* Controllo che lo "state" torni quello giusto, quando l'ho trovato
     nella memoria di questo telefono. Se invece e' arrivato con la chiave
     dentro, il controllo ce l'ha gia' fatto Spotify. */
  let salvato = "";
  try { salvato = String(LS.get("mb.spotifyStato", "")); } catch (e) {}
  if (salvato && salvato !== stato && parti.length < 2) {
    toast("Accesso non valido, riprova");
    return false;
  }
  let r;
  try {
    _spotifyTraccia("chiedo al worker di scambiare il codice");
    const _ctl = new AbortController();
    const _scad = setTimeout(function () { try { _ctl.abort(); } catch (e) { } }, 20000);
    r = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, verifier: verifier }),
      signal: _ctl.signal
    });
    try { clearTimeout(_scad); } catch (e) { }
  } catch (e) {
    _spotifyTraccia("non riesco a parlare col worker: " + String((e && e.message) || e));
    try { LS.set("mb.spotifyErrore", "Non riesco a parlare con il computer: " + String((e && e.message) || e)); } catch (x) { /* noop */ }
    toast("Non riesco a parlare con il computer");
    _loginSpotifyInCorso = false;
    return false;
  }
  let j = null;
  try { j = await r.json(); } catch (e) { }
  if (!j || !j.ok) {
    const perche = String((j && j.errore) || ("il worker ha risposto " + r.status));
    /* Ste: "dice invalid authorization code".
       Il codice di Spotify si usa una volta sola: se lo dice, vuol dire che
       lo scambio lo ha gia' fatto qualcun'altro (la pagina, che parte
       prima). Non e' un errore: l'app aspetta semplicemente il permesso. */
    if (/invalid authorization code|invalid_grant/i.test(perche)) {
      _spotifyTraccia("il codice e' gia' stato usato: aspetto il permesso");
      try { sessionStorage.setItem("mb.spotifyScambio", "in corso"); } catch (e) { /* noop */ }
      for (let giro = 0; giro < 60; giro++) {
        if (_spotifyToken()) {
          _spotifyTraccia("permesso arrivato");
          toast("Collegato a Spotify", 4000);
          try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
          _loginSpotifyInCorso = false;
          return true;
        }
        const b3 = String(sessionStorage.getItem("mb.spotifyBiglietto") || "");
        if (b3) {
          const preso3 = await _spotifyPrendiPermesso(b3);
          if (preso3) {
            _spotifyTraccia("permesso preso col biglietto");
            toast("Collegato a Spotify", 4000);
            try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
            _loginSpotifyInCorso = false;
            return true;
          }
        }
        await new Promise(function (r) { setTimeout(r, 500); });
      }
    }
    _spotifyTraccia("il worker ha rifiutato lo scambio: " + perche);
    try { LS.set("mb.spotifyErrore", perche); LS.set("mb.spotifyErroreQuando", String(Date.now())); } catch (e) { /* noop */ }
    _loginSpotifyInCorso = false;
    toast(perche, 9000);
    try { _spotifyPnl("Accesso non riuscito", "", '<p class="step-hint">' + _spotifySicuro(perche) + "</p>"); } catch (e) { /* noop */ }
    return false;
  }
  _spotifyTraccia("il worker ha fatto lo scambio: aspetto il permesso");
  try { sessionStorage.setItem("mb.spotifyBiglietto", String(j.biglietto || "")); } catch (e) { /* noop */ }
  const preso = await _spotifyPrendiPermesso(String(j.biglietto || ""));
  if (!preso) return false;
  _spotifyTraccia("permesso preso, salvo");
  try { LS.remove("mb.spotifyErrore"); } catch (e) { /* noop */ }
  _spotifyChiave = null;
  try { LS.remove("mb.spotifyStato"); LS.remove("mb.spotifyChiave"); } catch (e) { /* noop */ }
  _loginSpotifyInCorso = false;
  return true;
}

  /* Rinnovo il permesso con il refresh token: serve quando il permesso
     corto e' scaduto ma quello lungo c'e' ancora. */
  async function _spotifyRinnova() {
    try {
      let v = LS.get("mb.spotify", null);
      if (!v || !v.refresh) {
        try { v = JSON.parse(sessionStorage.getItem("mb.spotify") || "null"); } catch (e) { v = null; }
      }
      if (!v || !v.refresh) return false;
      /* Anche il rinnovo passa dal worker: dal telefono la richiesta
         restava appesa (iPhone sospende la scheda). */
      const r = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: v.refresh })
      });
      const j = await r.json();
      if (!j || !j.ok) { _spotifyTraccia("rinnovo del permesso fallito: " + String((j && j.errore) || r.status)); return false; }
      const preso = await _spotifyPrendiPermesso(String(j.biglietto || ""));
      if (!preso) return false;
      _spotifyTraccia("permesso rinnovato senza riautorizzare");
      return true;
    } catch (e) { return false; }
  }
  async function _spotifyApi(percorso) {
      let token = _spotifyToken();
      if (!token) {
        /* Il permesso e' scaduto, ma quello lungo c'e': me lo rinnova e
           riprovo, cosi' Ste non deve riautorizzare ogni ora. */
        const rinnovato = await _spotifyRinnova();
        if (!rinnovato) return null;
        token = _spotifyToken();
        if (!token) return null;
      }
    try {
      const r = await fetch("https://api.spotify.com/v1" + percorso, {
        headers: { Authorization: "Bearer " + token }
      });
      if (r.status === 401 || r.status === 403) {
        /* Ste: "non sono riuscito a leggere le tue playlist" e non
           compariva piu' "Accedi con Spotify".
           Motivo: il token era scaduto, OPPURE era stato concesso con i
           permessi di una versione vecchia dell'app (allora Spotify
           risponde 403 e non 401).

           Ste: "appena ho premuto apri spotify mi ha detto accesso scaduto".
           Motivo: sul 403 buttavo via il token, ma il 403 vuol dire che il
           token e' valido e mancano solo i permessi: buttarlo non serve a
           niente e faceva perdere l'accesso. Ora il token resta; sul 401
           (li' il token e' davvero scaduto) viene buttato, come prima.

           E Spotify spiega PERCHE': con un 403 di solito vuol dire che
           manca un permesso ("Insufficient client scope"). Me lo segno. */
    try {
    /* Leggo la risposta come testo e poi ci leggo dentro: se Spotify
       risponde in un modo che non e' JSON, la parola la vedo lo stesso
       (e prima non la vedevo per niente: diceva solo "non riesco a
       leggere la spiegazione"). */
    const testoErrore = await r.clone().text();
    let messaggio = "";
    try {
    const corpoErrore = JSON.parse(testoErrore || "{}");
    messaggio = String((corpoErrore && corpoErrore.error && (corpoErrore.error.message || corpoErrore.error.reason || corpoErrore.error.status)) || "");
    } catch (e) {
    messaggio = String(testoErrore || "").slice(0, 120);
    }
    _spotifyTraccia("Spotify ha risposto " + r.status + ": " + (messaggio || "(senza spiegazione)"));
    /* La parola esatta di Spotify la voglio vedere ANCHE io, non solo
    nella traccia: se non va, l'app deve dire che cosa manca. */
    if (messaggio) _spotifyMotivo = messaggio;
    /* Ste: "ancora mi dice accesso scaduto". In realta' Spotify ha
       risposto che per le playlist vuole che l'account che ha registrato
       l'app sia Premium. Non e' un permesso scaduto: e' una regola di
       Spotify. */
    if (/premium subscription|required for the owner/i.test(messaggio)) {
      _spotifyMotivo = "per leggere le playlist Spotify chiede che l'account con cui e' stata registrata l'app abbia l'abbonamento Premium";
      _spotifyErrore = 403;
    }
    } catch (e) {
    _spotifyTraccia("Spotify ha risposto " + r.status + " (non riesco a leggere la spiegazione)");
        }
        if (r.status === 401) {
          try { LS.remove("mb.spotify"); } catch (e) { /* noop */ }
          try { sessionStorage.removeItem("mb.spotify"); } catch (e) { /* noop */ }
        } else if (r.status === 403) {
          /* Ste: "Spotify ha risposto 403", e non va avanti.
             Il 403 vuol dire "accesso non sufficiente": il token c'e' ma non
             ha i permessi giusti. E il permesso LUNGO (quello che serve per
             rinnovare) porta con se' gli stessi permessi vecchi: quindi
             rinnovarlo non risolve niente e si resta sempre fermi li'.
             Per questo, sul 403 butto via ANCHE il permesso lungo: l'app
             chiede un accesso NUOVO, con i permessi giusti, e l'utente
             approva una volta sola. */
          try { LS.remove("mb.spotify"); } catch (e) { /* noop */ }
          try { sessionStorage.removeItem("mb.spotify"); } catch (e) { /* noop */ }
          _spotifyTraccia("permesso senza i permessi giusti: lo butto via, serve un accesso nuovo");
        }
        _spotifyErrore = r.status;
        return null;
      }
      if (!r.ok) { _spotifyErrore = r.status; return null; }
      _spotifyErrore = 0;
      return await r.json();
    } catch (e) { _spotifyErrore = -1; return null; }
  }

/* Le playlist, anche le private: per queste serve l'accesso. */
  async function _spotifyPlaylist() {
    const tutte = [];
    /* Prima la strada del sito di Spotify: le API normali chiedono
       l'abbonamento Premium, il sito no. Se il server risponde, uso la sua
       lista; se no, provo con le API (per chi ha Premium). */
    try {
      const r = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify/playlist", { cache: "no-store" });
      const j = await r.json();
      if (j && j.ok && j.voci && j.voci.length) {
        _spotifyTraccia("le playlist sono arrivate dal sito di Spotify (" + j.voci.length + ")");
        for (const p of j.voci) {
          const info = p || {};
          tutte.push({
            id: String(info.id || info.uri || "").split(":").pop(),
            nome: String(info.name || ""),
            privata: info.public === false || /private/i.test(String(info.privacy || "")),
            canzoni: Number((info.tracks && info.tracks.total) || (info.trackCount || 0) || 0)
          });
        }
        return tutte;
      }
    } catch (e) { /* il server non risponde: uso le API */ }
    let url = "/me/playlists?limit=50";
  for (let pagina = 0; pagina < 4 && url; pagina++) {
    const j = await _spotifyApi(url);
    if (!j) break;
    for (const p of (j.items || [])) {
      tutte.push({
        id: p.id,
        nome: p.name,
        privata: p.public === false,
        canzoni: Number((p.tracks && p.tracks.total) || 0)
      });
    }
    url = j.next ? j.next.replace("https://api.spotify.com/v1", "") : "";
  }
  return tutte;
}

/* I titoli veri della playlist: qui Spotify dà i nomi, che è quello che
   mi serve (l'audio poi lo cerco su YouTube). */
  async function _spotifyBrani(playlistId) {
    const brani = [];
    /* Prima la strada del sito (senza Premium). */
    try {
      const r = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify/brani?id=" + encodeURIComponent(playlistId), { cache: "no-store" });
      const j = await r.json();
      if (j && j.ok && !j.incompletoPossibile && j.brani && j.brani.length) {
        _spotifyTraccia("i brani sono arrivati dal sito di Spotify (" + j.brani.length + ")");
        for (const b of j.brani) {
          const nome = String((b && b.titolo) || "").replace(/\s+/g, " ").trim();
          const chi = String((b && b.artista) || "").replace(/\s+/g, " ").trim();
          if (!nome || !chi) continue;
          brani.push({ spotifyId: String((b && b.spotifyId) || ""), title: nome, artist: chi,
            artists: (b && b.artisti) || [], album: (b && b.album) || null,
            durationMs: Number((b && b.durataMs) || 0), addedAt: (b && b.aggiuntoIl) || null });
        }
        if (brani.length) return brani;
      }
    } catch (e) { /* il server non risponde: uso le API */ }
    let url = "/playlists/" + playlistId + "/tracks?limit=100";
  for (let pagina = 0; pagina < 12 && url; pagina++) {
    const j = await _spotifyApi(url);
    if (!j) break;
    for (const it of (j.items || [])) {
      const t = it.track;
      if (!t || !t.name || t.is_local) continue;
      const chi = (t.artists || []).map((a) => a.name).filter(Boolean).join(", ");
      if (!chi) continue;
      brani.push({ spotifyId: String(t.id || ""), title: t.name.replace(/\s+/g, " ").trim(),
        artist: chi.replace(/\s+/g, " ").trim(),
        artists: (t.artists || []).map(a => ({ id: a.id || null, name: a.name || "" })),
        album: { id: (t.album || {}).id || null, name: (t.album || {}).name || "" },
        durationMs: Number(t.duration_ms) || 0, addedAt: it.added_at || null });
    }
    url = j.next ? j.next.replace("https://api.spotify.com/v1", "") : "";
  }
  return brani;
}

/* ============================================================
   Da qui in poi c'era il file spotify-ui.js, ora dentro questo.
   Ste: due file separati e uno solo dei due non partiva, e non si
   accorgeva di niente. Ora viaggiano insieme.
   ============================================================ */

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
  /* Se l'app sta solo controllando se il permesso e' valido, il pannello
     resta chiuso: si apre solo quando lo chiede lui. */
  if (typeof _spotifySilenzioso !== "undefined" && _spotifySilenzioso) return;
  p.hidden = false;
  syncNoScroll();
}
/* === La traccia ===

   Ste: "non funziona, non dice niente, la X non chiude". Ho cambiato
   questo codice tante volte e ogni volta pensavo di aver capito: non
   avevo. Il problema e' che ogni tentativo finiva con lo stesso
   "non funziona", senza nessun indizio.

   Adesso ogni passo lascia un segno scritto dentro il pannello, uno
   sotto l'altro. Si vede esattamente dove si ferma, senza dover
   indovinare. E' roba mia di diagnostica: quando funziona si puo'
   togliere. */
  function _spotifyTraccia(testo) {
    /* Prima di tutto mando: se il pannello non c'e' o il disegno va storto,
    la riga deve uscire lo stesso. */
    _spotifyTracciaManda(testo);
    try {
      /* Ste: "appena apro spotify spunta questo" (il riquadro con le righe
         blu). Era la mia diagnostica: mi serviva per capire dove si
         fermava, ma non ha senso stare in mezzo all'app.

         Ora il riquadro compare SOLO se metti ?traccia nell'indirizzo.
         Le righe continuano ad andare al computer di lavoro (quelle le
         leggo io), ma non si vedono piu' sul telefono. */
      let mostrare = false;
      try { mostrare = /[?&]traccia\b/.test(String(location.search || "")); } catch (e) { mostrare = false; }
      if (!mostrare) return;
      let box = document.getElementById("spotifyTraccia");
      if (!box) {
        box = document.createElement("div");
        box.id = "spotifyTraccia";
        box.style.cssText = "position:fixed;top:6px;left:6px;right:6px;z-index:999;" +
          "max-height:34vh;overflow:auto;margin:0;padding:8px 10px;border-radius:12px;" +
          "background:rgba(127,215,255,.08);border:1px solid rgba(127,215,255,.25);" +
          "font:600 12px/1.6 ui-monospace,Consolas,monospace;color:#7fd7ff;" +
          "word-break:break-word;pointer-events:none";
        document.body.appendChild(box);
      }
      const riga = document.createElement("div");
      riga.textContent = "- " + testo;
      box.appendChild(riga);
    } catch (e) { /* la traccia non deve mai bloccare niente */ }
  }

  /* Ste: "ancora spotify non apre nulla", e io ogni volta avevo indovinato
     una causa diversa. Il problema e' che vedevo solo quello che diceva
     lui, non quello che sapeva il telefono.

     Adesso ogni riga di traccia viene anche mandata al computer di lavoro
     (il worker), e li' la leggo io: cosi' vedo se il pulsante e' arrivato,
     se la funzione c'e', cosa ha risposto il salto a Spotify e se e'
     comparso un errore. Basta un tocco e mi arriva la verita'.

     Ogni invio e' una scrittura, quindi non ne faccio troppi: al massimo
     8 per sessione e non piu' di uno ogni 4 secondi. */
  let _tracciaInviate = 0;
  let _tracciaUltimo = 0;
  let _tracciaSpotifyInviate = 0;
  let _tracciaSpotifyUltimo = 0;
  function _spotifyTracciaManda(testo) {
    try {
      if (_tracciaSpotifyInviate >= 60) return;
      const ora = Date.now();
      if (ora - _tracciaSpotifyUltimo < 120) return;
      _tracciaSpotifyUltimo = ora;
      _tracciaSpotifyInviate++;
      const dove = String(SERVIZIO_PUBBLICA || "").trim();
      if (!dove) return;
      var corpoTraccia = JSON.stringify({ riga: "SPOTIFY: [v" + (typeof APP_VERSION !== "undefined" ? APP_VERSION : "?") + "] " + String(testo).slice(0, 120) });
      /* Niente sendBeacon: su iPhone quella con un Blob JSON viene rifiutata
         (non puo' fare la preflight del CORS) e la traccia non parte:
         stavo lavorando al buio. */
      fetch(dove + "/problema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: corpoTraccia
      }).catch(function () { /* nessuna rete? pazienza */ });
      /* Se la pagina si ricarica subito, la traccia si perde: ne mando una
         seconda copia un istante dopo (se sono ancora vivo). */
      try {
        setTimeout(function () {
          fetch(dove + "/problema", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: corpoTraccia
          }).catch(function () { });
        }, 900);
      } catch (e) { /* noop */ }
    } catch (e) { /* mai bloccare l'app per una traccia */ }
  }
if (typeof window !== "undefined") { try { window._spotifyTraccia = _spotifyTraccia; } catch (e) {} }

/* Ste: "la X per chiudere non funziona". Anche qui lascio un segno,
   cosi' si distingue "non arriva il tocco" da "arriva ma non funziona". */
function _spotifyChiudi() {
  _spotifyTraccia("X premuta");
  const p = $("spotifyPanel");
  if (p) p.hidden = true;
  const box = document.getElementById("spotifyTraccia");
  if (box && box.parentNode) box.parentNode.removeChild(box);
try { document.body.classList.remove("no-scroll"); } catch (e) { /* noop */ }
    try {
      const box = document.getElementById("spotifyTraccia");
      if (box && box.parentNode) box.parentNode.removeChild(box);
    } catch (e) { /* noop */ }
  try { syncNoScroll(); } catch (e) { /* noop */ }
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
/* La schermata di accesso. Sta in una funzione sua perche' la devono
   chiamare due posti: il menu (quando non c'e' un accesso valido) e la
   lettura delle playlist (quando il token era scaduto, o i permessi
   erano stati concessi con una versione vecchia dell'app).

   Ste: "non mi spunta piu' accedi con spotify e l'autorizzazione perche'
   gia' l'ho fatta prima penso". Motivo: il token c'era ma l'API
   rispondeva 403 e il codice lo cancellava solo sul 401: l'app credeva
   di essere gia' collegata e non offriva piu' il pulsante. */
  let _spotifyErrore = 0;
  /* La parola esatta che dice Spotify (per es. "Insufficient client scope"):
     la voglio vedere anche nella schermata, non solo nelle tracce. */
  let _spotifyMotivo = "";
  function _spotifyChiediAccesso(perche) {
  const extra = perche ? '<p class="step-hint">' + perche + '</p>' : '';
  /* Ste: "ogni volta devo fare un sacco di foto delle playlist e mandartele
     dal pc, e un casino ci sto tanto tempo".
     Con il link della playlist non serve fare niente: l'app lo legge da
     sola. Serve solo che la playlist sia PUBBLICA (in Spotify si cambia con
     un tocco), e non serve l'abbonamento Premium. */
  _spotifyPnl("Importare da Spotify",
    "",
    extra +
    '<p class="step-hint"><b>Il modo piu\' semplice:</b> in Spotify apri la playlist, ' +
    'tocca Condividi, copia il link, e incollalo qui sotto. L\'app legge i titoli ' +
    'da sola e li scarica. Serve che la playlist sia pubblica.</p>' +
    '<input id="spotifyLinkCampo" class="spotify-link-campo" type="url" ' +
    'inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" ' +
    'placeholder="https://open.spotify.com/playlist/...">' +
    '<button class="btn-main" id="spotifyLinkVai" style="margin-top:10px">Importa questa playlist</button>' +
    '<p class="step-hint" style="margin-top:16px"><b>Oppure</b> collega il tuo account: ' +
    'serve solo se vuoi vedere l\'elenco delle tue playlist. Me lo dai una volta sola, ' +
    'non ti chiedo la password e il permesso vale solo su questo telefono.</p>' +
    '<button class="btn-main" id="spotifyAccedi">Accedi con Spotify</button>' +
    '<button class="btn-main" id="spotifySalta" style="margin-top:10px">Non ora</button>');
    try {
      $("spotifyLinkVai").addEventListener("click", async function () {
        const testo = String(($("spotifyLinkCampo") || {}).value || "").trim();
        if (!testo) { toast("Incolla prima il link della playlist"); return; }
        const m = /playlist\/([A-Za-z0-9]+)/.exec(testo);
        if (!m) { toast("Quel link non sembra il link di una playlist"); return; }
        _spotifyTraccia("importo la playlist dal link: " + m[1]);
        _spotifyImporta(m[1]);
      });
      $("spotifyAccedi").addEventListener("click", () => {
        _spotifyTraccia("premo il pulsante 'Accedi con Spotify' del pannello");
        _spotifyAccedi();
      });
      $("spotifySalta").addEventListener("click", () => {
        _spotifyChiudi();
        toast("Nessun problema, l'app resta come e'");
      });
    } catch (e) { /* noop */ }
  }
  function _spotifyMenu() {
    _spotifyTraccia("sono dentro _spotifyMenu");
    if (_spotifyToken()) {
      _spotifyMostraPlaylist(true);
      return;
    }
    /* Il permesso e' scaduto? Provo a rinnovarlo in silenzio prima di
       chiedere l'accesso di nuovo (il permesso dura un'ora, ma si puo'
       rinnovare). */
    try {
      _spotifyRinnovaSeScaduto().then(function (ok) { if (ok) _spotifyMostraPlaylist(true); });
    } catch (e) { /* noop */ }
    /* Il pannello si apre SUBITO (non voglio aspettare la rete per
       mostrargli qualcosa). */
    _spotifyChiediAccesso("");
    /* Ste: "non va ancora". Motivo: se il permesso arriva mentre l'app e'
       aperta (per eso' l'ha fatto nella scheda del browser), il bottone
       Spotify non lo andava a chiedere al server: mostrava subito "Accedi
       con Spotify" e sembrava che tutto fosse rifatto da capo.
       Adesso, in parallelo, l'app chiede al server se c'e' un permesso
       pronto: se c'e', il pannello si riempie di playlist. */
      try { _spotifyPrendiSePronto(); } catch (e) { /* noop */ }
    }
  async function _spotifyPrendiSePronto() {
  try {
  const rr = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify?pronto=1", { cache: "no-store" });
  const jj = await rr.json();
  if (jj && jj.ok && jj.permesso && jj.permesso.access_token) {
  /* Ste: "appena premo apri spotify mi spunta di dare il consenso, poi si
     apre music box ma c'e' scritto che l'accesso e' scaduto".
     Motivo: questo permesso e' quello che il SERVER tiene, e il server lo
     ha fatto scambiare la pagina un secondo fa (quindi e' il PIU' NUOVO e
     ha i permessi giusti). Prima lo scartavo se l'app aveva gia' un
     permesso in tasca: e quello era il VECCHIO, senza i permessi giusti,
     quindi Spotify rispondeva 403 e l'app diceva "accesso scaduto".
     Adesso il permesso del server vince SEMPRE (e' il piu' nuovo), e la
     funzione dice se l'ha preso, cosi' chi chiama puo' riprovare. */
  _spotifyTraccia("il server aveva il permesso: lo prendo");
  _spotifySalvaToken(jj.permesso);
  try { _mostraCollegatoSi(); } catch (e) { /* noop */ }
  return true;
  }
  } catch (e) { /* il server non risponde: pazienza */ }
  return false;
  }


  async function _spotifyMostraPlaylist(chiediAccesso) {
    /* Ste: "non mi spunta piu' accedi con spotify e l'autorizzazione
       perche' gia' l'ho fatta prima penso".
       Motivo: il token c'era (l'avevi concesso prima, quindi Spotify non
       chiede piu'), ma l'API rispondeva 403: i permessi erano stati
       concessi con una versione vecchia dell'app. Il codice cancellava il
       token solo sul 401, quindi l'app credeva di essere collegata e non
       offriva piu' il pulsante.

       Ora sul 401 E sul 403 il token viene via, e qui si torna al
       collegamento: l'app deve offrirti "Accedi con Spotify" per farmi
       riconsentire i permessi. */
    if (!_spotifyToken()) {
      /* Ste: "ogni tanto si apre da solo la pagina collegare spotify".
         Motivo: questa funzione la chiama anche l'app all'avvio, e se il
         permesso non c'era apriva la schermata di accesso DA SOLA. Ora la
         schermata si apre solo se l'ho chiesta io (quando premi il
         bottone Spotify); altrimenti l'app dice che il permesso non
         vale e basta. */
      if (chiediAccesso) {
        _spotifyChiediAccesso("L'accesso che avevi dato non vale piu' (o i permessi sono cambiati). " +
          "Accetta di nuovo e ci riprovo.");
      } else {
        _spotifyTraccia("il permesso non c'e' piu': lo dico, ma non apro nulla");
        try {
          _spotifyPnl("Spotify", "non sei piu' collegato",
            "<p class=\"step-hint\">L'accesso che avevi dato non vale piu' (Spotify lo tiene un'ora sola, poi scade). Se ti serve, premi il bottone Spotify e concedi l'accesso di nuovo.</p>");
        } catch (e) { /* noop */ }
      }
      return;
    }
    _spotifyPnl("Le tue playlist", "sto leggendo...", '<p class="step-hint">Un attimo...</p>');
    _spotifyTraccia("sto chiedendo a Spotify le tue playlist");
    const tutte = await _spotifyPlaylist();
    _spotifyTraccia("da Spotify: " + tutte.length + " playlist (errore " + _spotifyErrore + ")");
    if (!tutte.length) {
      /* Se mentre leggevo il token e' sparito (401 o 403), torno al
         collegamento invece di dare un avviso che non aiuta. */
      if (!_spotifyToken()) {
        if (chiediAccesso) {
          _spotifyChiediAccesso("L'accesso che avevi dato non vale piu'. Accetta di nuovo.");
        } else {
          _spotifyTraccia("il permesso e' scaduto durante la lettura: lo dico, ma non apro nulla");
          try {
            _spotifyPnl("Spotify", "non sei piu' collegato",
              "<p class=\"step-hint\">L'accesso e' scaduto. Se ti serve, premi il bottone Spotify e concedi l'accesso di nuovo.</p>");
          } catch (e) { /* noop */ }
        }
        return;
      }
      /* Se la lettura fallisce, il collegamento non serve a niente: il
         bottone non deve fare finta di essere collegato. */
      if (_spotifyErrore) { try { _mostraCollegatoNo(); } catch (e) { } }
      const perche = _spotifyErrore === -1
        ? "Non riesco a parlare con Spotify: controlla la rete."
        : (_spotifyErrore === 403
          ? "Spotify ha risposto 403: l'accesso non basta per leggere le playlist. (E' il caso in cui l'account che ha registrato l'app non ha Spotify Premium: per le playlist si puo' usare il link, che si incolla sotto.)"
          : (_spotifyErrore ? ("Spotify ha risposto " + _spotifyErrore + "." + (_spotifyMotivo ? " (" + _spotifyMotivo + ")" : "")) : ""));
      /* Ste: "appena premo apri spotify mi spunta di dare il consenso, poi si
         apre music box ma c'e' scritto che l'accesso e' scaduto".
         Motivo: l'app aveva in tasca un permesso VECCHIO (senza i permessi
         giusti) e provava subito a leggere le playlist con quello: Spotify
         rispondeva 403, l'app buttava via il permesso e diceva "accesso
         scaduto", senza chiedere al server se nel frattempo ce n'era stato
         uno nuovo (che c'era: l'aveva appena scambiato la pagina).
         Adesso: se la lettura fallisce, l'app chiede al server un permesso
         e, se c'e', riprova. */
      try {
        const pronto = await _spotifyPrendiSePronto();
        if (pronto) {
          _spotifyTraccia("il server aveva un permesso buono: riprovo le playlist");
          const altre = await _spotifyPlaylist();
          if (altre.length) {
            _spotifyPnl("Le tue playlist", altre.length + " playlist",
              '<p class="step-hint">Tocca la playlist da importare.</p>');
            return;
          }
        }
      } catch (e) { /* il server non risponde: pazienza */ }
      const servePremium = /Premium/.test(_spotifyMotivo || "");
      _spotifyPnl("Playlist", "",
        '<p class="step-hint">' +
        (servePremium
          ? "Per leggere le playlist, Spotify chiede che l'account con cui e' stata registrata questa app (il tuo) abbia l'abbonamento Premium. Non e' un permesso scaduto: e' una regola di Spotify. Con l'abbonamento attivo funziona tutto senza rifare niente."
          : ("Non sono riuscito a leggere le tue playlist. " + perche + " Prova a collegare Spotify di nuovo.")) +
        '</p>');
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
    '<button class="btn-main" id="spotifyEsci" style="margin-top:12px">Chiudi</button>' +
    '<p class="step-hint" style="margin-top:14px">Se Spotify continua a dire che l\'accesso non basta, stacca l\'app: ' +
    '<button class="btn-link" id="spotifyStacca" type="button">stacca Spotify da questo telefono</button>' +
    ' (e poi su Spotify: Account &gt; Privacy e sicurezza &gt; App &gt; MusicBox &gt; Rimuovi accesso).</p>';
  _spotifyPnl("Le tue playlist", tutte.length + " playlist", html);

  for (const b of document.querySelectorAll(".spotify-riga")) {
    b.addEventListener("click", () => { _spotifyImporta(b.getAttribute("data-id")); });
  }
  $("spotifyEsci").addEventListener("click", _spotifyChiudi);
  /* Ste: "non trovo app" (per togliere l'accesso a Spotify).
     Il pulsante "stacca" fa la parte che puo' fare l'app: dimenticarsi il
     permesso. Poi su Spotify va tolto a mano (e li' gli dico dove). */
  try {
    const stacca = $("spotifyStacca");
    if (stacca) {
      stacca.addEventListener("click", function () {
        _spotifyTraccia("stacco Spotify da questo telefono");
        try { LS.remove("mb.spotify"); } catch (e) { /* noop */ }
        try { sessionStorage.removeItem("mb.spotify"); } catch (e) { /* noop */ }
        try { LS.remove("mb.spotifyErrore"); LS.remove("mb.spotifyErroreQuando"); } catch (e) { /* noop */ }
        try { _mostraCollegatoNo(); } catch (e) { /* noop */ }
        toast("Permesso dimenticato. Ora su Spotify togli l'accesso a MusicBox e riprova.");
        _spotifyChiudi();
      });
    }
  } catch (e) { /* noop */ }
}

/* Leggo la lista e la mando al computer. */
async function _spotifyImporta(playlistId) {
  _spotifyPnl("Sto leggendo la playlist", "un attimo...", '<p class="step-hint">Prendo i titoli...</p>');
  const brani = await _spotifyBrani(playlistId);
  if (!brani.length) {
    _spotifyPnl("Playlist", "", '<p class="step-hint">Questa playlist non ha brani che posso usare.</p>');
    return;
  }
  /* Solo lo stesso Spotify Track ID e' una duplicazione certa. Titolo e
     artista uguali possono indicare versioni, album o master differenti. */
  const visti = new Set();
  const uniche = [];
  for (const b of brani) {
    const k = String((b && b.spotifyId) || "");
    if (k && visti.has(k)) continue;
    if (k) visti.add(k);
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
  try { q = new URLSearchParams(window.location.search); } catch (e) { q = null; }
  let code = q ? (q.get("code") || "") : "";
  let stato = q ? (q.get("state") || "") : "";
  let errore = q ? (q.get("error") || "") : "";
  /* Ste: "ho fatto l'accesso con Spotify e mi e' tornato su musicbox e mi e' spuntato
     di nuovo accedi con Spotify".
     Motivo: se la pagina si ricarica proprio mentre torno da Spotify, il codice
     nell'indirimento sparisce e lo scambio muore a meta'. Per questo il codice
     viene messo da parte nella pagina PRIMA che l'app si avvii (vedi index.html) e
     qui lo recupero: cosi' lo scambio va avanti anche dopo un ricaricamento. */
  if ((!code && !errore) || !stato) {
    try {
      const salvato = JSON.parse(sessionStorage.getItem("mb.spotifyRitorno") || "null");
      if (salvato) {
        if (!code) code = String(salvato.c || "");
        if (!stato) stato = String(salvato.s || "");
        if (!errore) errore = String(salvato.e || "");
      }
    } catch (e) { /* noop */ }
  }
    if (!code && !errore) {
    _spotifyTraccia("ritorno: nessun codice (indirimento: [" + String((window.location && window.location.search) || "").slice(0, 70) + "], memoria: [" + String(sessionStorage.getItem("mb.spotifyRitorno") || "").slice(0, 40) + "])");
    /* Ste: "appena premo apri spotify mi spunta di dare il consenso, poi si
       apre music box ma c'e' scritto che l'accesso e' scaduto".
       Motivo: l'app aveva in tasca un permesso VECCHIO (senza i permessi
       giusti) e provava subito a leggere le playlist con quello: Spotify
       rispondeva 403, l'app buttava via il permesso e diceva "accesso
       scaduto", senza chiedere al server se nel frattempo ce n'era stato
       uno nuovo (che c'era: l'aveva appena scambiato la pagina).
       Adesso, quando non c'e' un permesso in tasca, l'app chiede al server
       se ne ha uno pronto. */
    try {
      if (!_spotifyToken()) {
        _spotifyPrendiSePronto().then(function (preso) { if (preso) _spotifyMostraPlaylist(true); });
      }
    } catch (e) { /* noop */ }
    /* Ste: "non va ancora, porta sempre ad accedi con spotify".
       Se lo scambio l'ha gia' iniziato la pagina (e' lei che lo fa, perche'
       e' l'unica che puo' finire prima che il telefono cambi scheda), l'app
       aspetta il permesso invece di rifare lo scambio da capo. */
    try {
      /* Ste: "non va ancora". Motivo: su iPhone l'app si riapre dalla sua
         iccola e l'indirimento riparte pulito: il codice che Spotify aveva
         messo sparisce. Adesso l'app chiede al worker se c'e' un permesso
         pronto (il worker l'ha fatto lo scambio, e lo tiene): cosi' non
         importa in che scheda o in che app siamo. */
      try {
        const rr = await fetch(String(SERVIZIO_PUBBLICA || "") + "/spotify?pronto=1", { cache: "no-store" });
        const jj = await rr.json();
        if (jj && jj.ok && jj.permesso && jj.permesso.access_token) {
          _spotifyTraccia("il worker aveva il permesso pronto: lo prendo");
          /* L'ultimo permesso che arriva vince: e' il piu' nuovo. */
          _spotifySalvaToken(jj.permesso);
          try { _mostraCollegatoSi(); } catch (e) { /* noop */ }
          toast("Collegato a Spotify", 4000);
          try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
          return;
        }
      } catch (e) { /* il worker non risponde: pazienza */ }
      const bigliettoPronto = String(sessionStorage.getItem("mb.spotifyBiglietto") || "");
      if (bigliettoPronto) {
        _spotifyTraccia("c'e' un biglietto: prendo il permesso");
        const preso = await _spotifyPrendiPermesso(bigliettoPronto);
        if (preso) {
          _spotifyTraccia("permesso preso (dal biglietto)");
          toast("Collegato a Spotify", 4000);
          try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
          return;
        }
      }
      /* Ste: "ogni volta che apro musicbox mi si apre la pagina accedi con
         spotify". Motivo: il segnale "lo scambio e' in corso" non veniva
         mai cancellato, quindi a ogni avvio l'app aspettava 30 secondi che
         arrivasse un permesso che non sarebbe mai arrivato, e poi mostrava
         la schermata dell'errore. Adesso il segnale ha un orario: se e'
         vecchio lo cancello e l'app non aspetta niente. */
      const scambioQuando = Number(sessionStorage.getItem("mb.spotifyScambioQuando", 0) || 0);
      if (scambioQuando && (Date.now() - scambioQuando) > 90000) {
        _spotifyTraccia("il segnale dello scambio era vecchio: lo cancello");
        try {
          sessionStorage.removeItem("mb.spotifyScambio");
          sessionStorage.removeItem("mb.spotifyScambioQuando");
        } catch (e) { /* noop */ }
      }
      if (sessionStorage.getItem("mb.spotifyScambio")) {
        _spotifyTraccia("lo scambio e' gia' partito: aspetto il permesso");
        for (let giro = 0; giro < 12; giro++) {
          if (_spotifyToken()) {
            _spotifyTraccia("permesso arrivato: collegato");
            toast("Collegato a Spotify", 4000);
            try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
            return;
          }
          await new Promise(function (r) { setTimeout(r, 500); });
        }
        /* All'avvio non deve comparire NESSUNA schermata di errore: si vede
           solo quando l'utente ha premuto "Accedi con Spotify" e il
           tentativo e' fallito (e li' la mostra l'app stessa). */
        try {
          sessionStorage.removeItem("mb.spotifyScambio");
          sessionStorage.removeItem("mb.spotifyScambioQuando");
        } catch (e) { /* noop */ }
        if (_spotifyTentativoInCorso) {
          try {
            const perche = String(LS.get("mb.spotifyErrore", "") || "");
            let extra = "";
            try {
              const daIcona = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
              if (daIcona) {
                extra = "<p class=\"step-hint\">Sei nell'app della schermata Home: su iPhone l'app e il browser hanno due memorie separate, e quando torni da Spotify il sistema passa alla schermata Home. Per Spotify usa il BROWSER (Safari).</p>";
              }
            } catch (e) { /* noop */ }
            if (perche) _spotifyPnl("Accesso non riuscito", "l'ultimo tentativo e' fallito", '<p class="step-hint">' + _spotifySicuro(perche) + "</p>" + extra);
          } catch (e) { /* noop */ }
        }
        /* Ste: "ogni tanto si apre da solo la pagina collegare spotify".
           Motivo: il segnale "sto provando" restava acceso e al riavvio
           successivo la schermata compariva da sola. Qui lo spengo: la
           schermata dell'errore si vede solo quando e' appena successo
           qualcosa. */
        _spotifyTentativoInCorso = false;
        return;
      }
    } catch (e) { /* noop */ }
    /* Se prima lo scambio e' fallito, la parola dell'errore resta qui: se
       non la vedessi, Ste penserebbe che non e' successo niente. */
    try {
      const vecchio = String(LS.get("mb.spotifyErrore", "") || "");
      /* Ste: "appena apro musicbox mi spunta codice non autorizzato".
         Motivo: l'errore del tentativo di ieri era ancora scritto e veniva
         mostrato all'avvio, sembrando un errore di adesso. Adesso l'errore
         ha un orario: se e' vecchio non viene mostrato. */
      const quando = Number(LS.get("mb.spotifyErroreQuando", 0) || 0);
      const fresco = quando && (Date.now() - quando) < 15 * 60 * 1000;
      if (vecchio && fresco) {
        _spotifyPnl("Accesso non riuscito", "l'ultimo tentativo e' fallito",
          '<p class="step-hint">' + _spotifySicuro(vecchio) + "</p>" +
          '<button class="btn-main" id="spotifyRiprova" style="display:block;text-align:center;margin-top:10px">Riprova</button>');
        try {
          const b = $("spotifyRiprova");
          if (b) b.addEventListener("click", function () { _spotifyAccedi(); });
        } catch (e) { /* noop */ }
      }
    } catch (e) { /* noop */ }
    return;
  }
  _spotifyTraccia("ritorno: codice trovato (dal " + (q && q.get("code") ? "indirimento" : "ricordo della pagina") + ") indirimento: [" + String((window.location && window.location.search) || "").slice(0, 70) + "]");
  /* Ste: "dice invalid authorization code".
     Motivo: il codice si usa una volta sola, e lo usavano due: la pagina
     (che parte subito) e l'app (che parte dopo qualche secondo). Il primo
     lo faceva bene, il secondo trovava il codice gia' bruciato.
     Adesso: se la pagina ha gia' iniziato lo scambio, l'app NON lo rifa e
     aspetta solo il permesso. */
  try {
    if (sessionStorage.getItem("mb.spotifyScambio")) {
      _spotifyTraccia("la pagina sta gia' facendo lo scambio: non lo rifo, aspetto");
      for (let giro = 0; giro < 60; giro++) {
        if (_spotifyToken()) {
          _spotifyTraccia("permesso arrivato");
          toast("Collegato a Spotify", 4000);
          try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
          return;
        }
        const b2 = String(sessionStorage.getItem("mb.spotifyBiglietto") || "");
        if (b2) {
          const preso2 = await _spotifyPrendiPermesso(b2);
          if (preso2) {
            _spotifyTraccia("permesso preso col biglietto");
            toast("Collegato a Spotify", 4000);
            try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
            return;
          }
        }
        await new Promise(function (r) { setTimeout(r, 500); });
      }
    }
  } catch (e) { /* noop */ }
  /* Il codice resta da parte finche' lo scambio non e' finito: se la pagina
     si ricarica durante lo scambio, il codice c'e' ancora e si puo'
     riprovare. (Spotify lo accetta una volta sola: se lo scambio e' andato
     bene, non si riprova.) */
  /* Ste: "premo apri spotify e mi si aggiorna la pagina e mi si riapre
     accedi con spotify". Lo scambio del codice col permesso avviene qui,
     e se nel frattempo l'app si ricarica, lo scambio muore a meta' e
     sembra che non sia successo niente. */
  _loginSpotifyInCorso = true;
  /* L'indirimento si pulisce DOPO lo scambio: se la pagina si ricarica
     prima, il codice deve restare visibile nell'indirimento. */
  if (errore) {
    _loginSpotifyInCorso = false;
    toast("Non hai concesso Spotify: " + errore, 6000);
    return;
  }
  /* Se la pagina ha gia' iniziato lo scambio, gli do un po' di tempo:
     il codice si usa una volta sola, e due scambi insieme non funzionano. */
  try {
    if (sessionStorage.getItem("mb.spotifyScambio")) {
      _spotifyTraccia("aspetto che la pagina finisca lo scambio");
      for (let giro = 0; giro < 12; giro++) {
        if (_spotifyToken()) {
          _spotifyTraccia("permesso arrivato dalla pagina");
          toast("Collegato a Spotify", 4000);
          try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
          return;
        }
        await new Promise(function (r) { setTimeout(r, 250); });
      }
    }
  } catch (e) { /* noop */ }
  _spotifyTraccia("ritorno: scambio il codice col permesso");
  const ok = await _spotifyCompletaAccesso(code, stato);
  /* Se lo scambio e' fallito ma il permesso c'e' lo stesso (perche' l'ha
     preso la pagina), va bene: non e' un errore. */
  if (!ok && _spotifyToken()) {
    _spotifyTraccia("il permesso c'era gia': lo scambio non serve piu'");
    toast("Collegato a Spotify", 4000);
    try { _spotifyMostraPlaylist(); } catch (e) { /* noop */ }
    return;
  }
  try { sessionStorage.removeItem("mb.spotifyRitorno"); } catch (e) { /* noop */ }
  _spotifyTraccia(ok ? "ritorno: permesso ottenuto" : "ritorno: lo scambio e' fallito");
  if (!ok) {
    /* Se non e' andata, adesso la schermata dice PERCHE'. Prima spariva
       tutto in silenzio e tornava "Accedi con Spotify", senza spiegare
       niente. */
    _loginSpotifyInCorso = false;
    return;
  }
  try {
    history.replaceState({}, document.title, window.location.pathname);
  } catch (e) { /* noop */ }
  _loginSpotifyInCorso = false;
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
  /* Ste lo ha chiesto lui: da qui in poi il pannello si apre normalmente. */
  try { _spotifySilenzioso = false; } catch (e) { }
  /* Ste: "ancora spotify non apre nulla". Per cinque volte ho provato a
     indovinare guardando il pulsante. Il problema vero e' che qui dentro
     c'erano DUE strade per lo stesso tocco: il collegamento scritto nella
     pagina e quello che mettevo a mano da JavaScript. Si pestavano, e
     partiva una a caso, sapendo solo una delle due.

     Adesso c'e' una strada sola e ogni passo e' protetto: se qualcosa
     non va, lo scrivo a schermo invece di lasciare tutto a meta'. */
  try { _spotifyTraccia("bottone toccato"); } catch (e) { /* la traccia non blocca niente */ }
  try {
    const ora = Date.now();
    if (ora - _ultimoTapSpotify < 800) return;
    _ultimoTapSpotify = ora;

    let p = null;
    try { p = $("spotifyPanel"); } catch (e) { p = null; }

    /* passo 1: mostrare qualcosa, subito */
    if (!p) throw new Error("il pannello di Spotify non c'e' nella pagina");
    p.hidden = false;
    $("spotifyTitolo").textContent = "Spotify";
    $("spotifySotto").textContent = "un attimo...";
    $("spotifyCorpo").innerHTML = '<p class="step-hint">Sto aprendo...</p>';
    try { document.body.classList.add("no-scroll"); } catch (e) {}

    _spotifyTraccia("pannello aperto");
    /* passo 2: chiudere il menu Altro e aprire il contenuto vero */
    try { if (typeof _chiudiAltro === "function") _chiudiAltro(); } catch (e) { /* noop */ }
    _spotifyTraccia("menu chiuso");
    _spotifyMenu();
  } catch (errore) {
    const che = (errore && errore.message) ? errore.message : String(errore);
    try { _spotifyTraccia("ERRORE: " + che); } catch (e) {}
    try {
      _spotifyPnl("Spotify non si apre", "", '<p class="step-hint">' +
        String(che) + "</p>");
    } catch (e) { /* noop */ }
    try { toast("Spotify non si apre: " + che, 8000); } catch (e) {}
  }
}
if (typeof window !== "undefined") {
  try { window._spotifyApri = _spotifyApri; } catch (e) {}
  /* Ste: "non funziona e non mi dice niente". Ora la guida dice se
     Spotify e' pronto o no: se qui c'e' scritto "non caricato", il file
     non e' arrivato e il problema non e' nel resto. */
  try { window._spotifyPronto = true; } catch (e) {}
}

function _spotifyAggancia() {
const bs = $("btnSpotify");
      if (bs && !bs._collegatoSpotify) {
      bs._collegatoSpotify = true;
      /* PRIMA riscrivevo l'"onclick" scritto nella pagina con un altro
         codice. Risultato: due strade diverse per lo stesso tocco, che si
         pestavano, e non sapevo quale fosse partita. Per fare un colpo
         solo. Adesso non tocco piu' la pagina: mi collego e basta.
         L'"onclick" della pagina resta quello, ed e' gia' protetto. */
      bs.addEventListener("click", _spotifyApri);
    }
    const sc = $("spotifyChiudi");
    if (sc && !sc._collegatoSpotify) {
      sc._collegatoSpotify = true;
      try { sc.setAttribute("onclick", "document.getElementById('spotifyPanel').hidden=true;window._spotifyChiudi && window._spotifyChiudi()"); } catch (e) {}
      sc.addEventListener("click", _spotifyChiudi);
    }
    const p = $("spotifyPanel");
    if (p && !p._collegatoSpotify) {
      p._collegatoSpotify = true;
      p.addEventListener("click", (e) => { if (e.target === p) _spotifyChiudi(); });
    }
  }
  /* Se un'altra scheda mi ha mandato il permesso di Spotify, lo prendo. */
try {
  window.addEventListener("message", function (e) {
    try {
      const d = e && e.data;
      if (!d || d.musicbox !== "spotify-token" || !d.token || !d.token.access) return;
      LS.set("mb.spotify", d.token);
      try { sessionStorage.setItem("mb.spotify", JSON.stringify(d.token)); } catch (x) { /* noop */ }
      _spotifyTraccia("permesso ricevuto da un'altra scheda");
      toast("Collegato a Spotify", 3000);
      try { _spotifyMostraPlaylist(); } catch (x) { /* noop */ }
    } catch (x) { /* noop */ }
  });
} catch (e) { /* noop */ }
if (typeof document !== "undefined") {
    /* Ste: "non funziona e non mi dice niente" per sei versioni di fila.
       Proviamo due volte: subito e quando la pagina e' pronta. Il
       collegamento non parte due volte perche' il contrassegno lo
       blocca, quindi e' innocuo. */
    try { _spotifyAggancia(); } catch (e) { /* noop */ }
      /* Se l'app e' aperta sul computer di casa, me lo ricordo: cosi' i
         brani arrivano veloci anche quando poi apri l'app dal link di
         GitHub (Ste: "ci stanno tanto tempo per scaricarsi pure con la
         connessione di casa"). */
      try { setTimeout(function () { _ricordaCollegamentoDiCasa(); }, 300); } catch (e) { /* noop */ }
      /* L'elenco dei brani potenziati: serve per il contrassegno e per
         scegliere la versione giusta da suonare. */
      try { setTimeout(function () { _caricaElencoPotenziati(); }, 800); } catch (e) { /* noop */ }
      /* Ste: "io ho 25 brani nella playlist gym non 13". Le playlist le
         tiene l'app: le mando al servizio ogni volta che l'app parte, cosi'
         il computer vede la lista vera e prepara i brani con i bassi. */
      try {
        let tentativi = 0;
        const manda = function () {
          tentativi++;
          try {
            if (typeof _mandaGymAlServizio === "function") _mandaGymAlServizio();
            if (typeof _salvaPlaylistCondivise === "function") _salvaPlaylistCondivise();
          } catch (e) { /* noop */ }
          if (tentativi < 8) setTimeout(manda, 20000);
        };
        setTimeout(manda, 1500);
      } catch (e) { /* noop */ }
      /* Ste: "ho fatto l'accesso con spotify, mi e' tornato su musicbox e mi e' spuntato
         di nuovo accedi con spotify".
         Motivo: lo scambio del permesso aspettava che la libreria fosse pronta, e
         quando la rete e' lenta (o l'app si sta aggiornando) non partiva mai: la
         pagina ti mostrava di nuovo "Accedi con Spotify" come se niente fosse.
         Adesso parte appena la pagina si apre, e senza aspettare la libreria. */
      try { setTimeout(function () { _spotifyRientro(); }, 60); } catch (e) { /* noop */ }
      /* Ste: "l'accesso parte dal link di casa e non funziona".
         Adesso l'app di casa apre questa pagina con "?spotify=accedi": qui, sul
         link sicuro, l'accesso parte da solo e il permesso nasce dove Spotify
         puo' rimandare. */
      try {
        if (/[?&]spotify=accedi\b/.test(String(window.location.search || ""))) {
          /* L'app aperta come app (dall'icona sulla schermata) ha in
             memoria un parametro rimasto da un collegamento vecchio: non
             devo aprire Spotify da solo. */
          let daIcona = false;
          try {
            daIcona = (window.navigator && window.navigator.standalone === true) ||
              (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
          } catch (e) { }
          if (daIcona) {
            try {
              const u = new URL(window.location.href);
              u.searchParams.delete("spotify");
              window.history.replaceState({}, "", u.toString());
            } catch (e) { }
            try { sessionStorage.setItem("mb.spotifyRitorno", ""); } catch (e) { }
            try { _spotifyTraccia("parte da sola (icona): non apro Spotify"); } catch (e) { }
          } else {
            /* arrivo da un link (l'app di casa): l'accesso parte, ma una
               volta sola per sessione, cosi' non si apre a ogni ricarica */
            let giaPartito = false;
            try { giaPartito = !!sessionStorage.getItem("mb.spotifyPartito"); } catch (e) { }
            if (!giaPartito) {
              try { sessionStorage.setItem("mb.spotifyPartito", "1"); } catch (e) { }
              setTimeout(function () { _spotifyAccedi(true); }, 400);
            }
          }
        }
      } catch (e) { /* noop */ }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", _spotifyAggancia);
    }
  }

})();
