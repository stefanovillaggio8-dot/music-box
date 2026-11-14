# Music Box — continuazione verificata dal checkpoint 7ddd2521

Codice verificato: `e7e9c4c07f1487df1125d026c2d6b29a928e2068`. PR #59 in bozza, branch `audit-karaoke-beatmatch-20261113`. Nessun merge, modifica di main o pubblicazione. Gli aggiornamenti precedenti sono conservati.

**Esito e limite principale.** Sono stati implementati una finestra musicale più corta realmente selezionata dal lettore, una scelta casuale che considera la precisione del rendering, ulteriori recuperi karaoke, un inventario offline in sola lettura e la cancellazione delle analisi opzionali quando la pagina è nascosta. **Non è stato ottenuto un aumento sostanziale della disponibilità dei beatmatch: restano nove coppie di catalogo, corrispondenti a sette coppie distinte di registrazioni.** La copertura quotidiana rimane insufficiente e non dimostra equivalenza a Spotify Mixa.

| Misura | Checkpoint | Dopo |
|---|---:|---:|
| Registrazioni indicizzate | 1.176 | 1.176 |
| Coppie ordinate auditate | 1.381.800 | 1.381.800 |
| Completi con contenuto preservato | 9 | 9 |
| Coppie distinte di registrazioni | 7 | 7 |
| Completi disponibili nei controlli Safari con buffer comune | 9 | 9 |
| Ste / Diego / Emanuele, coppie disponibili | 0 / 2 / 5 | 0 / 2 / 5 |
| Gym, versioni effettivamente potenziate | 0 | 0 |
| Raccordi metrici parziali nel catalogo | 0 | 0 |
| Stacchi snap brevi, separati dai completi | 1 | 1 |
| Uscite strutturali prima dell’EOF | 0 | 0 |
| Completi il cui overlap comincia almeno 8 s prima dell’EOF | 2 | 2 |
| Durata media dei completi, coppie del catalogo | 7.940 s | 7.514 s |

Le tre destinazioni che condividono lo stesso SHA restano identità di libreria distinte: non sono state aggiunte o fuse canzoni per cambiare i contatori. `verifiedBeat=10` comprende uno snap e non significa dieci completi.

**Sessioni realmente simulate.** Stessi snapshot di libreria e seed 20261114; venti sessioni indipendenti da quaranta cambi, Gym venti da ventitré cambi. Ogni sessione riparte con cronologia vuota. Il codice del pianificatore e del selettore dell’app viene eseguito; non si tratta della cronologia o dei download del telefono.

| Profilo | Completi prima → dopo / cambi | Parziali dopo | Crossfade dopo | Normali dopo | Postlude dopo | Underlay dopo | Max consecutivi senza completo |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ste | 0 → 0 / 800 | 0 | 2 | 611 | 109 | 78 | 40 |
| Diego | 9 → 9 / 800 | 0 | 0 | 599 | 109 | 83 | 40 |
| Emanuele | 40 → 40 / 800 | 0 | 0 | 444 | 84 | 232 | 36 |
| Gym originali | 0 → 0 / 460 | 0 | 0 | 408 | 49 | 3 | 23 |

Gym con il vero selettore URL dell’app e il manifesto dei bassi vincolato a SHA: 24/24 brani potenziati, 0/460 completi, 428 normali, 31 postlude e un underlay. Non è stata sostituita con una playlist più favorevole.

**Ciclo continuo senza ripetizioni.** Questo confronto evita di presentare venti riavvii di sessione come un ascolto lungo:

| Profilo | Completi prima → dopo / cambi | Massimo senza completo prima → dopo |
|---|---:|---:|
| Ste | 0 → 0 / 226 | 226 → 226 |
| Diego | 1 → 1 / 211 | 182 → 182 |
| Emanuele | 2 → 2 / 620 | 614 → 614 |

I due brani uscenti di Diego e i tre di Emanuele restano il limite fondamentale. Migliorare l’ordine non può creare nuovi punti di uscita certificati. Le librerie, i preferiti e le playlist non sono stati modificati.

Nei quattordici scenari dopo la modifica: 6.460 cambi, zero omissioni iniziali e zero secondi udibili saltati secondo l’indice. La coda manuale e l’ordine non vengono riscritti per produrre un mix. Nei percorsi ordinati e nei quaranta cambi della coda manuale per profilo non compaiono completi; ciò descrive quei percorsi, non un divieto di mixare una coppia compatibile scelta dall’utente. L’offline a cache fredda, con il manifesto sintetico fisso e senza buffer comuni già decodificati, resta a zero completi: la persistenza dei mix comuni è ancora un limite. Gli MP3 scaricati rimangono protetti.

**Finestra più corta, applicata al lettore.** Safe And Sound → Con il nastro rosa preserva entrambi i file e quattro battute, cambiando il momento della sovrapposizione:

| Misura | Prima | Dopo |
|---|---:|---:|
| Sovrapposizione | 13.78930 s | 9.95445 s |
| Inizio sul file uscente | 126.72670 s | 130.56155 s |
| Ingresso del brano successivo | 0 s | 0 s |
| Battute controllate | 4 | 4 |
| RMS degli attacchi dopo il rendering, 48 kHz | 12.98 ms | 13.48 ms |
| Rapporto di time-stretch | 1.044271 | 1.041076 |

La nuova intro parte 3.835 s più tardi, con un overlap ridotto del 27.81%. Il miglioramento è nella durata e nel contenuto meno a lungo sovrapposto; **non si dichiara un miglioramento del RMS di questa coppia**, che cresce di circa 0,50 ms restando nella stessa fascia di precisione. La graduatoria preferisce il raccordo più corto entro una fascia di 5 ms, dopo i controlli e la preferenza per la velocità nativa. Non è stata abbassata nessuna soglia di certificazione. Il vecchio asset è conservato.

Sono state misurate più geometrie mantenendo quattro slot di rendering: una finestra corta, una precisa, una nativa se disponibile e una con maggiore supporto. La sola quantità di attacchi non può più occupare tutti gli slot con sovrapposizioni lunghe simili. Le stime affini robuste aggiungono ipotesi, ma ogni ipotesi deve ancora superare tutti i controlli sugli attacchi, le battute, le voci, l’armonia e il segnale renderizzato.

La versione installata supera il rendering a 48 e 44,1 kHz. Una diversa variante con RMS migliore solo a 48 kHz è stata respinta al controllo a 44,1 kHz e non installata. I test browser verificano anche l’effettivo pianificatore, il nuovo buffer e il ritorno alla traccia nativa, con time-stretch e seek. Le prove riguardano gli engine automatici, non un iPhone fisico.

**Scelta casuale.** Tra completi già certificati e con punteggio musicale entro il 3% dal migliore, il selettore considera velocità nativa, verifica dei downbeat e precisione misurata sul rendering. Può superare la precedente isteresi numerica solo con queste prove. Il test usa tre brani realmente presenti nella libreria e verifica che il candidato migliore venga promosso; se è consumato o escluso dal pool non viene reinserito. Non è una nuova libreria utente né un nuovo beatmatch.

Nel seed delle quattordici simulazioni, il nuovo asset è stato utilizzato **0 volte**. Quindi il caso funzionale e la prova diretta nel browser non vengono presentati come un beneficio già diffuso nelle sessioni quotidiane. Il JSON registra ora l’uso effettivo di ogni asset e le promozioni motivate dalla qualità del rendering.

**Perché la disponibilità resta bassa.** Conteggio del primo rifiuto nel generatore sui file attribuiti ai profili, comprese le versioni con bassi. Non equivale al numero di canzoni o alla prova di impossibilità musicale:

| Profilo | Coppie | Finale metrico insufficiente | Intro metrica insufficiente | Metro/tempo/allineamento | Voce/testo | Armonia locale | Fit indipendente | Candidati completi |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ste | 75292 | 43257 | 10615 | 19598 | 1443 | 364 | 15 | 0 |
| Diego | 47294 | 20177 | 9205 | 16237 | 1513 | 159 | 1 | 2 |
| Emanuele | 383772 | 117606 | 91887 | 155499 | 16547 | 2168 | 60 | 5 |

Le ipotesi di Beat This e Spleeter restano evidenze automatiche, non verità certificate su strofe, ritornelli o assoli. Il confronto SHA sui tre alberi Git recuperati trova corrispondenza per 1.176/1.176 sorgenti; non è una nuova decodifica integrale di tutti i file. Le analisi PCM e vocali già presenti sono state riutilizzate, non rigenerate inutilmente.

Le nuove stime robuste producono 26 geometrie per sette coppie interne, non nuove coppie. Venti varianti nuove sono state renderizzate a 48 kHz: dieci superano i controlli. Delle dieci riprovate a 44,1 kHz, otto superano il controllo. La selezione diversificata recupera cinque ulteriori geometrie, tutte valide a 48 kHz; viene installata una sola alternativa, verificata anche a 44,1 kHz. Le varianti non vengono sommate come beatmatch.

Il tentativo di un raccordo metrico parziale preservato produce quattro varianti per una coppia, ma il rendering finale le respinge: nessun parziale nuovo viene autorizzato. È stato corretto anche un rifiuto numerico spurio: un picco attenuato risultava 0,9990000000000001 contro il limite 0,999. Il calcolo riserva ora un margine leggermente più prudente, 0,998999, mantenendo la guardia finale. Dopo questa correzione restano comunque i rifiuti ritmici. Un’altra coppia fra profili supera il rendering a 48 kHz ma fallisce a 44,1 kHz: non viene installata o usata per alzare i contatori.

**Contenuto e sicurezza acustica.** Il nuovo cue legge l’uscente fino all’EOF e l’entrante dal campione iniziale, con tonalità preservata. Nessun nuovo taglio di strofa, ritornello o conclusione è autorizzato. L’audit storico continua a respingere 39/46 uscite, incluse quelle che omettevano 92,52 e 128,48 s; le sette uscite ammesse da quel singolo controllo richiedono ancora tutti gli altri certificati. I completi selezionati restano nell’intervallo circa 10–26,44 ms RMS ritmico. Massimo picco ricostruito a 4×: circa 0,971334. I limiti su picchi, dissonanza e sovrapposizione vocale non sono stati rimossi.

Non viene attestata soggettivamente la potenza del basso o la naturalezza di ogni incastro: serve ascolto umano, soprattutto per gli overlap più lunghi. Gli estratti A/B hanno lo stesso tratto originale iniziale e lo stesso guadagno uniforme nella sola copia MP3; i FLAC allegati sono gli esatti buffer del lettore. Il confronto non simula una normalizzazione del volume dell’app.

**Karaoke: copertura e precisione separate.** Dopo il passaggio originale e quelli da 14 s, una vista karaoke aperta può riprovare zone ancora irrisolte con nuclei da 7 s e contesto da 2 s. Stesso Whisper Tiny, nessun modello più pesante; parole realmente osservate, stessi matcher esatti e salvataggio dell’app. Le 160 parole già accettate mantengono esattamente i tempi precedenti.

| Benchmark fisso | Prima | Dopo |
|---|---:|---:|
| Parole accettate / 590 | 160 (27,12%) | 168 (28,47%) |
| Mediana errore inizio | 55,19 ms | 53,85 ms |
| Mediana errore fine | 65,77 ms | 65,77 ms |
| p95 errore inizio | 201,30 ms | 200,21 ms |
| p95 errore fine | 216,25 ms | 228,39 ms |
| Benchmark indipendente | 10/150 | 10/150 |
| Passaggi ASR nel protocollo per finestra | 3 | 7 |

Il guadagno di otto parole richiede osservazioni aggiuntive: non è un confronto a costo computazionale uguale. Il solo contesto da 7 s otteneva 113/590 e non sostituisce i passaggi precedenti. La sessione normale su telefono mantiene il limite di tre finestre; i recuperi fini appartengono alle visite successive con karaoke aperto e rispettano il limite già esistente della vista. Una sola inferenza per richiesta su telefono. Le statistiche riguardano le parole accettate: non misurano l’errore su tutte le 590 parole. Il p95 dei finali peggiora sul gruppo ampliato e non viene nascosto; sui 160 tempi già accettati non c’è regressione.

Il controllo indipendente resta disgiunto: Avercage – Embers e Confession – Quesabe. I dieci tempi accettati provengono dal rap francese, non dal canto inglese: è stata corretta l’etichetta sbagliata nel rapporto precedente, lasciando invariati dati e denominatori. Il metadato manuale fissato contiene 79 registrazioni: 20 inglesi, 20 tedesche, 20 spagnole, 19 francesi e nessuna italiana. Non viene quindi dichiarata precisione misurata sull’italiano. Le contrazioni italiane restano testate funzionalmente; rap, canto rapido e frasi ripetute richiedono ancora miglioramenti. Gli ancoraggi umani di frase isolano l’errore delle parole: non certificano l’offset globale dei testi reali o il comportamento WebGPU su iPhone.

**Spazio sul telefono di Diego.** Le cifre comunicate, 4,1 GB totali, 2,8 GB github.io e 1,1 GB githubusercontent.com, si riferiscono a Diego e non a Ste. Non sono attribuite automaticamente a Music Box. Una copia dei 212 MP3 originali della libreria di Diego contiene **957.041.024 byte**, circa 957 MB decimali: è il payload del catalogo sui due repository, non il contenuto misurato sul suo telefono e non le possibili versioni alternative.

Il nuovo pulsante “Rapporto spazio” nel pannello offline legge le cache di Music Box e il database già aperto, senza eliminare file, creare migrazioni o scaricare audio. Distingue MP3, analisi musicali, copertine/immagini, testi e metadati; separa cache salvate, streaming, prefetch e versioni tramite i nomi delle cache. Conta i Blob IndexedDB e i metadati UTF-8; per CacheStorage usa le dimensioni dichiarate, indicando esplicitamente le voci senza misura. Non legge in massa i corpi dei GB di MP3 e non crea decoder o worker.

Le copie con stessa URL sono segnalate come **identità dei byte non verificata**, non come spazio eliminabile. Non vengono fuse versioni con bassi, master differenti o appartenenze a profili diversi. Modelli e cache fuori dal prefisso dell’app rimangono non attribuiti; una quantità ignota non viene rappresentata come zero. Non si classificano come orfane le vecchie cache soltanto in base al nome. La pulizia temporanea già esistente nel Service Worker non viene ampliata; i download manuali e il database restano protetti.

La stima del browser è approssimativa e riferita all’origine; può risentire di compressione, deduplicazione e protezioni del browser. L’HTTP cache è un sistema distinto dalle API di archiviazione. Non si può ricostruire la schermata di Safari sommando semplicemente i byte leggibili dall’app. [StorageManager.estimate](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate), [politica di archiviazione WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/).

Spreco dimostrato e corretto: il preloader opzionale poteva riscaricare una URL già salvata e far partire richieste concorrenti prima del blocco. Il confronto delle funzioni vere, con cinque richieste contemporanee e cache controllate, misura 5→0 trasferimenti per un MP3 già presente e 5→1 a cache fredda. Nessun file preesistente viene cancellato. **Questo preloader è già disabilitato nel percorso nativo iPhone:** la correzione non spiega da sola i GB di Diego e non dimostra spazio liberato sul suo telefono. È stata anche rimossa la vecchia cifra di ripiego “circa 60 MB”, priva di misura.

**Prestazioni: episodio generale non confermato.** Non viene diagnosticata Music Box come causa del rallentamento dell’intero telefono. È stata verificata una lacuna specifica nel ciclo di vita: un’inferenza già avviata non veniva annullata quando la pagina diventava nascosta. La modifica termina il worker opzionale e annulla il fetch su visibilitychange nascosto e pagehide, senza fermare l’audio nativo.

Con lo stesso worker simulato in attesa, il modulo del checkpoint conserva un worker dopo il passaggio in background; quello nuovo passa da uno a zero. Cinque cicli hide/show verificano cinque terminazioni, chiusura dei decoder opzionali, nessuna richiesta pendente o continuazione residua, musica non messa in pausa e nessun cooldown di errore per il lavoro annullato. L’apertura del modulo senza richiesta non crea worker. Sono contatori di proprietà JavaScript, non misure di CPU, GPU o RAM del dispositivo.

Il rapporto include lo stato istantaneo del karaoke, del prefetch e dei download, modalità standalone e visibilità. CPU e RAM fisiche restano non misurate. Non sono stati aggiunti monitoraggi continui o analisi PCM in background. Gli altri timer e la gestione della sessione audio non sono stati modificati speculativamente.

**Verifiche.** Suite completa 627→642 test superati (locale e remota WebKit); suite DJ 565→579 superati; Python 8/8 invariati; zero fallimenti nelle suite finali; audit 1.381.800 coppie. Chromium e WebKit decodificano 104 buffer a 48 kHz e 104 a 44,1 kHz, compresi asset storici che non equivalgono a coppie autorizzate. Verificati il nuovo mix dal pianificatore reale, handoff nativo, mute/unmute, seek, scelta casuale e rispetto del pool. I test in browser con profilo persistente verificano conservazione byte per byte degli MP3 di prova, Blob importato, testi, preferiti, nomi delle cache e zero richieste di rete durante l’inventario.

Due test locali iniziali avevano asserzioni obsolete sulle revisioni URL e sul nome del profilo catturato dal prefetch: sono stati aggiornati insieme ai test funzionali. Il nuovo test di storage WebKit falliva durante la creazione iniziale di un Blob in un profilo effimero Linux, prima dell’esecuzione dell’inventario. Il profilo persistente isolato passa conservando tutte le verifiche; questo non certifica le modalità private o ogni versione fisica di Safari. I rifiuti delle varianti audio sperimentali sono separati dai fallimenti della suite e non vengono nascosti come successi.

**Verifica fisica ancora necessaria.** La build non è pubblicata. In una build privata della PR su iPhone: selezionare Diego, attendere la fine degli eventuali download e aprire Altro → Gestisci spazio offline → Rapporto spazio. Copiare il rapporto separatamente in Safari e PWA, senza usare “Libera spazio” o cancellare i dati del sito. I campi di disponibilità e le voci di dimensione ignota devono restare nel rapporto.

Provare separatamente apertura senza musica, riproduzione normale, Smart Mix e karaoke; portare l’app in background per 30 s, tornare e ripetere cinque volte. Verificare assenza di restart, seek, play/pausa e ripresa. Dopo che la coda dei download è terminata, provare un brano già salvato senza rete. I contatori al ritorno vanno distinti da una nuova analisi consentita in primo piano; CPU/RAM globali richiedono un profiler sul dispositivo. La sincronizzazione e il comportamento a schermo bloccato non sono certificati da questi test automatici.

**Limiti rimasti.** Servono più finali e intro verificabili, soprattutto per Ste e Gym; il numero di gateway è ancora troppo basso. Restano il recupero durevole dei buffer comuni per l’offline freddo, l’allineamento italiano con riferimenti affidabili, gran parte delle parole non riconosciute e l’ascolto umano di basso, timbro, dissonanze residue, voce e durata. Il quadro non autorizza una dichiarazione di equivalenza a Spotify Mixa.

**Riproducibilità e commit.** I JSON allegati contengono prima/dopo, inventari, SHA, prove di rendering, rifiuti e workflow con l’HEAD realmente verificato. I log riportano gli esiti, non misure di un iPhone fisico. Comandi principali:

```powershell
node --test tests/*.test.cjs
python tools/test-dj-whole-structure.py
node tools/simulate-library-listening.cjs --output=listening.json
node tools/dj-equivalence-audit.cjs --output=pairs.json
node tools/build-preserved-tail-plans.cjs --structure=whole --pcm=pcm --edges=edges --output=plans.json
node tools/build-preserved-tail-plans.cjs --metrical=true --structure=whole --pcm=pcm --edges=edges --output=partial-candidates.json
python tools/build-composite-assets.py --plans=plans.json --assets=assets --cache=original-mp3 --report=render.json --rate=48000 --gain-mode=lookahead
```

I percorsi whole/pcm/edges rappresentano gli artefatti SHA già recuperati; non sono dati da caricare sul telefono. Per il karaoke, il replay confronta le osservazioni a 28 e 14 s e aggiunge facoltativamente il report a 7 s, conservando le stesse registrazioni e i denominatori.

**Workflow controllati:**
- [Music Box - exhaustive Mixa pair audit](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638019443): success, commit `e7e9c4c0`.
- [Immersive Mode Chromium layout and controls](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638016833): success, commit `e7e9c4c0`.
- [Desktop DJ Chromium playback smoke](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638014134): success, commit `e7e9c4c0`.
- [iPhone DJ WebKit foreground smoke](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638010886): success, commit `e7e9c4c0`.
- [Volume precision tests](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638008118): success, commit `e7e9c4c0`.
- [Karaoke and DJ regression checks](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638008135): success, commit `e7e9c4c0`.
- [DJ Mix regression tests](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638008176): success, commit `e7e9c4c0`.
- [Music Box DJ independent raw-audio audit](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638008160): success, commit `e7e9c4c0`.
- [Common PCM mix Chromium and WebKit playback](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43638008133): success, commit `e7e9c4c0`.
- [Music Box title display and original metadata regression](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43631815741): success, commit `9335e22c`.
- [Internal musical windows and common PCM rendering](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43560889412): success, commit `365318dc`.
- [Full transition PCM feature extraction](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43533181201): success, commit `564489a7`.
- [Music Box - Audit indipendente audio reale DJ](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43533177128): success, commit `564489a7`.

Il confronto non distruttivo con main conferma un conflitto preesistente in `dj-deep-analysis.json`, registrato in `conflicts-main-readonly.txt`; nessun merge o risoluzione per sovrascrittura è stato eseguito. La PR rimane in bozza e non è pronta al merge.

**Buffer originali del confronto:**

- [Prima](../../dj-mixes/244126aad52154dc707b4c5815cc3241cfc7d9645770192a29cefd8b11d7a048.flac)
- [Dopo](../../dj-mixes/44e0a9c61d07ab3799b5e0c358ead56b016a67b9f9d530109c6135db12e9f7a1.flac)
