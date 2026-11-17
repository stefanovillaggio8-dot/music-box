# Music Box — finestre ritmiche, finali integri e ascolto reale

Confronto con `a6dcabb02970a23f6b8398227d5ab7caaa911bd1`, HEAD locale e remoto verificati prima di intervenire. Codice e fixture finali: `851cb422` (SHA completi e hash dei sorgenti in `source-manifest.json`). PR #59 in bozza sul branch `audit-karaoke-beatmatch-20261113`. Nessuna modifica di main, merge o pubblicazione.

**Risultato concreto: otto nuove coppie di raccordi ritmici parziali, con code originali integre, tra cui due Ste e una Gym potenziata. Il percorso casuale utilizza più completi già esistenti: Diego 10→21, Emanuele 60→79 su 800 cambi. I completi disponibili rimangono undici: il problema della loro scarsità non è risolto. Nessuna equivalenza a Spotify Mixa è certificata.**

## Numeri prima e dopo

| Misura | Prima | Dopo |
|---|---:|---:|
| Registrazioni analizzabili | 1.176 | 1.176 |
| Coppie ordinate auditate | 1.381.800 | 1.381.800 |
| Completi con contenuto preservato | 11 | 11 |
| Coppie distinte di registrazioni complete | 9 | 9 |
| Completi ammessi dai controlli Safari con PCM comune | 11 | 11 |
| Raccordi ritmici parziali | 0 | 8 |
| Snap breve, distinto da completi e parziali | 1 | 1 |
| Completi Ste / Diego / Emanuele / Gym | 0 / 2 / 7 / 0 | 0 / 2 / 7 / 0 |
| Parziali Ste / Diego / Emanuele / Gym | 0 / 0 / 0 / 0 | 2 / 0 / 5 / 1 |
| Uscite che troncano la registrazione prima dell’EOF | 0 | 0 |
| Overlap medio dei completi | 8,396 s | 8,396 s |

`verifiedBeat=20` nell’audit globale significa 11 completi + 8 parziali + 1 snap. Non significa venti completi. `earlyVerifiedBeat` è un contatore storico dell’inizio dell’overlap prima dell’ultima energia rilevata; non certifica venti uscite anticipate. `structuralEarlyExits=0` è il conteggio pertinente ai tagli del file. I 39 tagli inaccettabili del precedente audit, compresi quelli di 92 e 128 secondi, restano protetti dai controlli di contenuto.

## Causa strutturale corretta

Il motore confondeva la durata del ritmo verificabile con la durata dell’intero file da preservare. In una conclusione, la batteria può finire prima del riverbero o della coda armonica. La verifica dei beat continuava fino all’EOF, aggiungendo beat entranti senza corrispondenti attacchi uscenti e bocciando allineamenti corretti nella parte realmente ritmica.

Esempio Ste, Sono Ok → Gilgamesh: otto attacchi uscenti ed entranti effettivamente allineati; gli ultimi 1,777 secondi sono una coda molto debole. Richiedere un ulteriore beat uscente nella coda produceva un falso negativo. Gym, What I've Done → Animal I Have Become nelle vere versioni potenziate: circa 10,004 secondi di ritmo condiviso, seguiti da 4,150 secondi di coda conservata. Non sono stati sostituiti gli MP3 potenziati con versioni normali più favorevoli.

`pcm-rhythmic-tail.cjs` distingue ora due intervalli: la finestra ritmica e la restante coda integra. Cerca gli attacchi nel PCM originale, non in un segnale attenuato per farli sparire. Mantiene almeno 4,5 secondi ritmici; la coda ammessa è limitata a 0,65–8 secondi. Lo stesso controllo indipendente post-render cerca eventuali ripartenze percussive in TUTTA la coda originale e rifiuta attacchi ≥0,25 o energia RMS superiore alla metà del corpo ritmico. Soglie dei beat, downbeat, armonia, voce e clipping restano obbligatorie.

Il risultato viene classificato **parziale**: `measuredFullBeat=false`, `metricalRhythmic=true`. La presenza del flag operativo storico `nativeTailFullBeat` non lo promuove a completo. I validatori separano esplicitamente le due classi e i test impediscono la promozione tramite modifica dei flag o rimozione delle prove.

L’uscente continua a guadagno unitario prima del controllo comune di sicurezza fino al vero EOF decodificato; l’entrante parte da zero. Il nuovo inviluppo porta gradualmente in primo piano l’entrante dopo la fine della parte ritmica, evitando un ritorno improvviso dal 33% al 100% al termine del file. Non cancella strofe, parole, assoli o conclusioni per ottenere un conteggio maggiore. Le durate dei due file non vengono riscritte.

Questo è un cambiamento generico del compilatore e del lettore, non una tabella di eccezioni per otto coppie. Anche le registrazioni future possono essere sottoposte alla stessa procedura; devono comunque ottenere nuove prove PCM e rendering, non ereditano la certificazione per somiglianza.

## Cosa continua a escludere le coppie

Ogni coppia è classificata al punto più avanzato raggiunto da almeno una finestra. Sono esclusioni sequenziali: una coppia può avere altri problemi non conteggiati nella sua categoria finale. Le finestre tentate e le esclusioni per singola finestra sono salvate nei quattro `funnel-*.json`; non vanno sommate come coppie. Le identità con SHA identico rimangono nelle librerie ma non diventano opportunità musicali distinte.

| Profilo | Coppie | Finale senza battute coerenti | Inizio senza battute coerenti | BPM | Metro/estensione | Downbeat osservati/fit | Durata | Voce/LRC | Armonia | Fit attacchi PCM | Candidati completi | Candidati parziali |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ste | 51292 | 29598 | 8034 | 10825 | 967 | 195 | 193 | 1163 | 305 | 10 | 0 | 2 |
| Diego | 44732 | 19201 | 8555 | 14011 | 849 | 197 | 255 | 1454 | 207 | 1 | 2 | 0 |
| Emanuele | 383772 | 117606 | 91887 | 147509 | 2908 | 2109 | 2506 | 16319 | 2839 | 71 | 7 | 11 |
| Gym | 552 | 299 | 33 | 191 | 0 | 6 | 1 | 19 | 2 | 0 | 0 | 1 |

Le finestre finali ammesse esistono per 96/227 brani Ste, 121/212 Diego, 430/620 Emanuele e 11/24 Gym; quelle iniziali per 143/227, 141/212, 406/620 e 21/24. Sono ipotesi del modello corroborate dagli attacchi, non battute o frasi annotate da musicisti. La perdita di copertura avviene soprattutto prima del confronto armonico. Per Ste, il 57,7% delle coppie è fermato già dal finale e il 15,7% dall’inizio; il BPM ne esclude un ulteriore 21,1% alla fase raggiunta.

Il problema non è soltanto un unico BPM globale: il compilatore confronta tempi locali derivati da più ipotesi coerenti di battute, allineamenti affini e punti di inizio alternativi. Il time-stretch rimane limitato al ±5%, conserva la tonalità e deve essere ricontrollato sul rendering. Non si allarga il limite per forzare brani incompatibili. Le ipotesi in doppio/metà tempo e l’analisi percussiva del checkpoint precedente rimangono disponibili; non sono dichiarate nuove soluzioni efficaci.

Due ulteriori strategie sono state provate e scartate: contesto metrico più lungo sui posteriori esistenti di Ste/Gym, e rianalisi originale dei finali con 64 invece di 48 secondi su 16 registrazioni selezionate prima dell’inferenza per molti attacchi e finestre mancanti. Stesso checkpoint Beat This vincolato a SHA, nessuna soglia allentata: nessuna nuova coppia utilizzabile. I dati sono in `rhythmic-context-experiments.json` e `context64-selection.json`. Una terza prova porta a 64 secondi anche il contesto delle sette introduzioni selezionate con finestre mancanti. In Gym le esclusioni per ingresso assente scendono da 33 a 22 coppie, ma quelle undici coppie incontrano poi il veto BPM: nessuna nuova coppia renderizzabile. Non viene aggiunto carico al telefono per un esperimento senza vantaggi.

Non si può dedurre che tutte le esclusioni siano incompatibilità musicali reali. Mancano annotazioni indipendenti delle sezioni, dei downbeat e del groove. Molti finali possono effettivamente essere poco percussivi o concludersi su una voce; altri possono essere falsi negativi del modello. La preservazione completa vieta di usare una bella battuta interna eliminando poi il resto del brano. Una soluzione successiva deve produrre evidenza migliore sulle conclusioni, non eliminare quei veti.

## Rendering e qualità acustica

Quattordici coppie candidate, 42 geometrie: 23 geometrie/10 coppie superano il rendering a 48 kHz iniziale; soltanto 15 geometrie/8 coppie superano anche il controllo del SEGNALE COMUNE EFFETTIVAMENTE CODIFICATO ricampionato a 44,1 kHz. Le altre non sono installate. Esclusioni finali per geometria: 17 per ritmo post-render, 8 per il ricampionamento del segnale comune e 2 per discontinuità di guadagno ai bordi nativi. Le prove complete e i motivi sono in `render-outcomes.json`.

| Profilo | Coppia | Overlap intero, s | Parte ritmica, s | Errore RMS attacchi, ms | RMS downbeat, ms | Time-stretch |
|---|---|---:|---:|---:|---:|---:|
| Ste | 4 → 38 | 7.250 | 5.473 | 18.36 | 4.10 | +4.43% |
| Ste | 705 → 50 | 7.785 | 6.124 | 13.77 | 11.61 | +1.46% |
| Gym | 53 → 51 | 14.154 | 10.004 | 19.21 | 17.17 | -1.50% |
| Emanuele | 830 → 1198 | 7.426 | 5.276 | 14.64 | 4.10 | +2.04% |
| Emanuele | 636 → 603 | 12.990 | 11.000 | 30.22 | 20.93 | -4.88% |
| Emanuele | 636 → 700 | 13.392 | 11.402 | 24.18 | 16.42 | -4.39% |
| Emanuele | 1104 → 745 | 13.073 | 8.383 | 22.37 | 24.97 | +4.64% |
| Emanuele | 626 → 1195 | 6.357 | 5.107 | 18.56 | 17.41 | +0.00% |

Gli attacchi indipendenti post-render delle 15 alternative hanno RMS 13,77–30,22 ms. Il controllo mantiene almeno otto attacchi, accordo ≥90%, RMS ≤40 ms e supporto in entrambe le metà. Le battute richiedono RMS ≤25 ms e massimo ≤50 ms. La via separata per percussioni differenti conserva i requisiti più forti già esistenti; non viene usata per rietichettare una dissolvenza come completo.

Il percorso del lettore distribuisce un FLAC 48 kHz; Safari può ricampionarlo a 44,1 kHz. Il test pertinente ricampiona quel FLAC e i suoi componenti, non genera un altro WSOLA diverso a 44,1 kHz. È stato eseguito anche il secondo esperimento: alcune risintesi indipendenti a 44,1 non passano, ma non sono il segnale distribuito. Le prove pertinenti sono `resampledCommonProof`, vincolate a SHA dell’asset, oltre alle vere decodifiche dei due browser.

SoundTouch WSOLA conserva la tonalità per costruzione e viene misurato sull’audio composto; questo non dimostra assenza percettiva di artefatti su ogni strumento. Armonia locale, voce separata e indicazioni LRC disponibili vengono controllate su TUTTA la sovrapposizione, inclusa la coda. Non ci sono etichette semantiche umane di strofa/ritornello/assolo né una prova soggettiva di bellezza.

I limiti dei picchi non sono stati aumentati. Riduzione comune massima osservata sulle nuove alternative: 2,903 dB, con guadagno unitario ai punti di rientro nativo. Il precedente limite di 4,5 dB rimane un veto indipendente. I controlli native restano 0,9992 per il segnale intero e 0,962 nell’overlap; i limiti offline/ricampionamento rimangono separati.

Un primo CI ha mostrato che una stima oversampled offline non limita esattamente tutti i kernel dei decoder browser. Tre decodifiche erano entro i limiti assoluti ma oltre la precedente previsione relativa +0,001. Ora la certificazione misura realmente Chromium e WebKit a entrambe le frequenze e vincola i massimi all’hash FLAC; il lettore mantiene la tolleranza relativa di 0,001 e gli stessi limiti assoluti. Nessun filtro anti-clipping è stato rimosso. La prova decodifica browser non misura il vero picco analogico di un DAC né certifica il kernel di ogni iPhone futuro.

Otto MP3 di contesto e otto FLAC esatti del lettore sono nella consegna locale, con hash e provenienza in `audio-provenance.json`. Gli MP3 includono otto secondi del prefisso originale, il segnale comune e quattro secondi di continuazione nativa; una sola attenuazione uniforme evita clipping nell’anteprima MP3. Non è una modifica agli MP3 originali o al guadagno del lettore. La variazione RMS nelle finestre da mezzo secondo prima dell’EOF e dopo il rilascio è −1,41/+0,09 dB per Ste e −0,41 dB per Gym. Emanuele varia da −4,25 a +3,03 dB: soprattutto queste due code richiedono ascolto umano. Le variazioni includono la dinamica propria dei brani, non sono da sole una misura di salto istantaneo del controllo. Energia del basso misurata e picchi sono nel JSON; non si dichiara un basso percettivamente perfetto.

## Selezione nella riproduzione casuale

Aggiungere coppie non bastava: il vecchio percorso prenotava soltanto i successori dei completi e poteva consumare il partner di un mix in un’introduzione filtrata quasi impercettibile. La nuova selezione riconosce anche i parziali certificati nei percorsi a due brani e conserva prima i successori di completi, poi quelli di parziali. I completi/parziali immediatamente disponibili mantengono priorità.

È possibile raggiungere un predecessore fresco quando altrimenti si consumerebbe il suo successore con un cambio ordinario o con un underlay debole ≤9%. I raccordi correnti più forti non sono sacrificati a questo criterio. Nessun nuovo modello o download massivo serve per cercare le coppie; rimane il limite di 128 collegamenti indicizzati. Disponibilità offline, profilo, storia e controlli musicali sono riconfermati prima della scelta. La coda manuale, quella riordinata dall’utente e la playlist restano sovrane. Nessuna traccia viene aggiunta, sostituita o ripetuta artificialmente per creare opportunità.

Venti sessioni indipendenti ×40 cambi; Gym ×23. Seed 20261114 e snapshot invariati. Le storie si azzerano FRA sessioni: non sono 800 cambi consecutivi sul telefono. L’algoritmo è quello realmente eseguito dal lettore, compresi i fallback. Il vecchio simulatore ometteva parte dei fallback e classificava come normali alcuni crossfade/underlay: entrambi i lati sono stati ricalcolati estraendo il rispettivo codice effettivo. Queste riclassificazioni non vengono presentate come un guadagno musicale.

| Profilo | Cambi | Completi prima → dopo | Parziali prima → dopo | Crossfade prima → dopo | Normali prima → dopo | Postlude prima → dopo | Underlay prima → dopo |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ste | 800 | 0 → 0 | 0 → 18 | 31 → 31 | 327 → 337 | 109 → 110 | 333 → 304 |
| Diego | 800 | 10 → 21 | 0 → 0 | 48 → 47 | 253 → 245 | 110 → 107 | 379 → 380 |
| Emanuele | 800 | 60 → 79 | 0 → 23 | 55 → 53 | 182 → 209 | 81 → 73 | 422 → 363 |
| Gym potenziata | 460 | 0 → 0 | 0 → 20 | 15 → 16 | 274 → 283 | 31 → 20 | 140 → 121 |

Ciclo unico fino a esaurimento della libreria, nessuna ripetizione, stesso seed:

| Profilo | Cambi | Completi prima → dopo | Parziali prima → dopo | Massimo senza completo prima → dopo | Massimo senza completo O parziale prima → dopo |
|---|---:|---:|---:|---:|---:|
| Ste | 226 | 0 → 0 | 0 → 2 | 226 → 226 | 226 → 210 |
| Diego | 211 | 2 → 2 | 0 → 0 | 144 → 144 | 144 → 144 |
| Emanuele | 620 | 3 → 5 | 0 → 2 | 612 → 313 | 612 → 313 |

Le sessioni brevi migliorano, ma i cicli lunghi restano molto poveri di veri mix. Ste può ancora attraversare 210 cambi senza un raccordo ritmico, Diego 144, Emanuele 313: il problema principale è ancora aperto. La playlist Gym in ordine campionata non incontra la nuova coppia, mentre il casuale la usa 20 volte in 20 sessioni indipendenti, senza ripetizioni interne. Non significa venti coppie Gym nuove.

Quattordici scenari, 6.460 cambi: zero secondi uscenti saltati e zero ingresso omesso secondo le prove quantitative. Ordine e code manuali rimangono identici alla base; una coppia valida esplicitamente accodata è comunque esercitata nei browser. Nei percorsi offline sintetici (50% MP3 fissato, nessun common buffer preparato) rimangono zero completi e parziali: il lettore sceglie una via sicura, non presume la presenza di un FLAC mai preparato. Non è misurata la cache del telefono di Diego.

La durata media dei parziali effettivamente usati è 7,785 s Ste, 10,683 s Emanuele e 14,154 s Gym; non è tutta durata di batteria condivisa. Nei dati sono separati inizi overlap almeno 8 s prima dell’EOF, veri tagli anticipati, media di tutti gli overlap e media dei soli completi/parziali.

## Karaoke: copertura reale e validazione indipendente

**Il codice karaoke del telefono non è stato peggiorato o sostituito: resta identico ad a6dcabb0. Non è dimostrato un nuovo guadagno di copertura in questa iterazione.**

| Campione | Parole accettate prima → dopo | Mediana inizio, ms | p95 inizio, ms | Mediana fine, ms | p95 fine, ms |
|---|---:|---:|---:|---:|---:|
| Sviluppo | 168/590 → 168/590 | 53,85 | 200,21 | 65,77 | 228,39 |
| Primo campione indipendente, già usato nel checkpoint precedente | 14/150 → 14/150 | 33,94 | 156,67 | 39,94 | 202,79 |
| Secondo campione indipendente precedente | 25/166 → 25/166 | 65,93 | 360,91 | 76,91 | 384,89 |
| Terzo campione nuovo, protocollo corretto | nuovo: 24/243 | 29,11 | 227,59 | 50,25 | 203,36 |

Il valore storico 10/150 era precedente ai miglioramenti del checkpoint ripreso: la base effettiva a6dcabb0 aveva già 14/150. Non lo si conta nuovamente come progresso. Il nuovo campione è selezionato prima dell’inferenza escludendo le nove registrazioni precedenti: rap francese Mes Larmes e canto inglese Cortez, revisioni audio/annotazioni/modello fissate. Nessun riferimento italiano affidabile nuovo è disponibile in questo insieme; non si dichiarano risultati italiani per estrapolazione.

Nel nuovo campione si è scoperto un errore del benchmark: assegnare le parole per contenimento temporale duplica o associa erroneamente parole quando una sillaba sostenuta si sovrappone alla frase successiva. La correzione usa `line_end` delle annotazioni originali, verifica testo, confini e appartenenza e conserva TUTTI i tempi originali, incluse le sovrapposizioni. Il conteggio grezzo precedente era 20/284; quello corretto è 24/243. **È una correzione della misura, non un miglioramento dell’algoritmo.** I tre campioni precedenti restano numericamente identici con il protocollo corretto. La riproduzione del benchmark rifiuta anche il mescolamento di output di modelli diversi o revisioni non fissate.

Diagnosi tramite le osservazioni reali di sette contesti offline, non timestamp inventati: 202/590 parole del campione principale e 157/243 di quello nuovo non hanno nemmeno una stessa parola normalizzata osservata entro una finestra generosa di ±750 ms. Solo 184/590 e 51/243 hanno almeno UNA osservazione entro 100 ms a entrambi i bordi; non esiste però un oracolo che la distingua in produzione dalle alternative errate. Inoltre 27 parole dello sviluppo e 7 del nuovo campione hanno osservazioni concordi tra contesti entro 60 ms ma sbagliate di oltre 250 ms. Il consenso di uno stesso riconoscitore può ripetere lo stesso errore: non è una conferma indipendente della verità. Questi sono limiti superiori diagnostici, non WER o parole automaticamente certificabili. Dettagli per parole brevi e ripetute nei JSON `*-diagnosis`.

Esperimenti scartati: contrazioni a due token e parole isolate fra ancore non danno miglioramenti; una vista audio con passa-alto 120 Hz/passa-basso 6 kHz porta 168→176 parole sul campione principale ma peggiora il p95 della fine da 228,39 a 256,38 ms. Il consenso aggiuntivo più prudente conserva 168 e non guadagna nulla. Nessuno di questi esperimenti viene installato sul telefono. Non si cambia modello con uno più pesante o si abbassano i requisiti per aumentare il contatore.

La verifica usa il percorso effettivo di salvataggio e ricaricamento dell’app con ancore manuali di frase: non misura inferenza sul telefono o capacità di trovare da sola ogni frase. Tempi stimati non contano come acusticamente accettati. I testi dopo il cambio, le correzioni dei segmenti ASR parziali, il rap veloce e Immersive restano coperti dalle regressioni. Durante l’overlap la UI continua a mostrare il brano uscente fino all’handoff: presentare correttamente il testo entrante prima dell’EOF resta un limite aperto.

## Spazio offline e prestazioni iPhone

Nessuna cancellazione di download, CacheStorage, IndexedDB, preferiti, playlist o dati di sincronizzazione. I 107 FLAC preesistenti sono tutti identici; ora la directory ne contiene 122, 121 referenziati. Il file storico non referenziato non è stato eliminato senza prova di inutilità. Le 15 nuove alternative occupano 37.667.191 byte nel repository; l’indice cresce di 187.173 byte. Questo NON è lo spazio aggiunto su ogni telefono: i FLAC vengono preparati su richiesta, non tutti aggiunti alla precache del Service Worker.

I 957.041.024 byte di MP3 per Diego sono una copia logica dei 212 originali, non la misura dei suoi archivi. I 4,1 GB totali di Safari e i domini github.io/githubusercontent.com possono comprendere altre origini, cache HTTP o utilizzi. Nessuna duplicazione di Music Box è dimostrata da quella schermata e nessuno spazio liberato viene dichiarato. Rimane disponibile lo script precedente `Audit-spazio-Diego-sola-lettura.js`, da eseguire mediante Web Inspector sulla stessa origine già usata da Diego. Misurare una nuova origine di prova non misurerebbe i download esistenti. L’inventario non fa rete e non cancella; dimensioni sconosciute o fisiche stimate restano indicate come tali.

La regressione browser in storage reale verifica byte, annullamento e assenza di richieste/cancellazioni indesiderate su fixture, non sul telefono di Diego. Non si modificano politiche del Service Worker, database o componenti audio funzionanti per ipotesi. Nessun nuovo ONNX, worker, timer d’analisi o elaborazione PCM pesante è aggiunto al background del telefono.

Il rallentamento globale segnalato su iPhone 13 rimane NON CONFERMATO. Nessuna misura fisica di CPU/RAM è stata ottenuta. Le prove automatiche mantengono seek, play/pausa, cancellazioni, clock, handoff nativo, ripresa, background e rollback, ma non equivalgono a Safari/PWA su dispositivo. Durante il background il percorso comune conserva la cancellazione protetta e il ritorno all’uscente nativo già sviluppati: la continuità percettiva richiede ancora prova fisica.

## Test, fonti e limiti

Le esecuzioni e i conteggi definitivi sono in `verification.json` e `workflow-verification.json`. Suite completa 668/668; DJ 606/606; Python struttura 8/8, nuove code 3/3, decoder MP3 originale 1/1. Chromium desktop e Immersive sono passati; il segnale comune viene verificato in entrambi i browser e in entrambi i profili Ste/Emanuele, compresa la vera selezione casuale, il Gym potenziato standalone, il seek, l’handoff e il muting. Tutti e sette i processi del workflow comune finale 43713787068 sono superati. Le decodifiche controllano tutti i 121 segnali referenziati a 48 e 44,1 kHz. Non si afferma che Playwright WebKit sia un iPhone fisico.

Lo storico dei fallimenti rimane documentato: previsione relativa dei picchi superata da tre decoder, corretta con misure native senza alzare limiti; cinque assert che cercavano il vecchio testo dopo l’estrazione del pianificatore comune, aggiornati conservando i controlli; fixture WebKit che sceglieva Ste track-1 prima dell’arrivo delle cancellazioni pubblicate, corretta attendendo una sorgente ancora visibile. Nessuna di queste correzioni promuove coppie musicalmente fallite.

Le identità delle 1.176 registrazioni sono ricontrollate sui tree Git remoti correnti di music-box-brani/main, music-box/main e music-box/mobile-audio: zero discrepanze. È una verifica fresca di identità, NON un nuovo decoding integrale di tutti i 1.176 MP3. Gli originali delle nuove transizioni sono invece davvero decodificati e controllati. App, stato, playlist, karaoke, Immersive e protezioni offline precedenti restano intatti. Curazao di Emanuele conserva la sua analisi fallita e non viene sostituito per migliorare le statistiche.

Il conflitto preesistente con main in `dj-deep-analysis.json` è ancora presente ed è ispezionato con `git merge-tree` senza cambiare branch o risolverlo con sovrascritture. La PR resta in bozza. Sono stati ispezionati gli ultimi stati di tutti i 35 workflow configurati: le nove verifiche pertinenti sono superate; restano un annullamento storico dell’ultimo workflow strutturale e un workflow di importazione senza esecuzioni. Non si avviano pubblicazioni o importazioni per rendere artificialmente verde l’elenco.

Restano necessari: più evidenza attendibile sulle conclusioni per ottenere completi Ste/Gym; ascolto umano degli otto campioni per energia, fraseggio, basso e mascheramento delle code; miglioramento acustico generalizzabile del karaoke e riferimenti italiani indipendenti; verifica fisica Safari/PWA, soprattutto background durante un’entrata già udibile; inventario non distruttivo sulla vera origine di Diego. Le code conservate e i modelli non costituiscono una certificazione semantica delle sezioni. L’obiettivo finale richiesto rimane aperto.

## Riproducibilità

1. Audit completo: `node tools/dj-equivalence-audit.cjs --shard=0/12` e gli altri undici shard, tramite workflow `dj-equivalence-audit.yml`.
2. Finestre originali: `node tools/build-preserved-tail-plans.cjs --scope=<scope-SHA-vincolato.json> --structure=<artefatti-intero-brano> --edges=<artefatti-bordi> --output=<piani.json>`. I nomi, le identità e i funnel sono nei dati allegati; il metodo è generico.
3. Rendering: `python tools/build-composite-assets.py --plans=<piani.json> --rate=48000 --envelope-search --cache=<mp3-originali> --report=<rapporto.json> --assets=<directory>`; il tool verifica anche il segnale codificato ricampionato a 44,1 kHz. Consultare `--help` per l’esatta CLI. La certificazione nativa si esegue in CI con `composite-browser.yml`.
4. Simulazioni: `node tools/simulate-library-listening.cjs --boost-list=<manifesto-originale.json> --inventory-audit=<summary.json> --output=<risultati.json>`. Il manifesto di potenziamenti è già vincolato nel precedente audit; non passare il descrittore della prova al posto del manifesto. Per il confronto a6dcabb0 usare `--engine=<git-show-a6.js> --index=<indice-a6.json>`. Per il ciclo continuo aggiungere `--only-mode=shuffle --sessions=1 --steps=1000`.
5. Karaoke: scaricare i riferimenti alle revisioni fissate, mantenere le finestre dei report ASR originali e riutilizzare gli stessi output 28/14/7 s con `benchmark-karaoke-context-replay.cjs --consensus=true`. `diagnose-karaoke-observations.cjs` è solo diagnostica offline. Audio, testi integrali e pesi dei modelli non sono aggiunti a Git.
