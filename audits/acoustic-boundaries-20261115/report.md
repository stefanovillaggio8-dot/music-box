# Ripresa da d737a27f — confini vocali e karaoke senza inferenza sul telefono

Checkpoint iniziale verificato: `d737a27fbc381a16972badf277d1d51ea61dd9e0`. Implementazione karaoke: `a8284d71`; correzioni applicative della disponibilità nativa: fino a `11576f5e7e8f97110c6992daf92e4f1d327f90fe`; diagnostica successiva in CI con originali SHA-verificati. Gli SHA dei sorgenti verificati sono in `source-manifest.json`. Verifiche proseguite il 16 novembre. PR #59 in bozza; main, MP3, librerie e versione pubblica non modificati. Questo checkpoint **non risolve la scarsa copertura dei beatmatch completi** e non dimostra equivalenza a Spotify Mixa.

## Risultati misurati

| Misura | Prima | Dopo |
|---|---:|---:|
| Beatmatch completi | 11 | 11 |
| Raccordi ritmici parziali | 8 | 8 |
| Completi Ste / Diego / Emanuele / Gym | 0 / 2 / 7 / 0 | invariati |
| Parziali Ste / Diego / Emanuele / Gym | 2 / 0 / 5 / 1 | invariati |
| Karaoke principale | 168/590, 28,47% | 182/590, 30,85% |
| Errore mediano inizio / fine | 53,85 / 65,77 ms | 52,87 / 60,38 ms |
| Errore p95 inizio / fine | 200,21 / 228,39 ms | 199,61 / 216,25 ms |
| Campione di trasferimento | 24/243 | 25/243 |
| Secondo campione di validazione | 25/166 | 26/166 |
| Holdout precedente | 14/150 | 14/150 |
| Due nuovi brani, selezionati prima dell'inferenza | 32/110 | 33/110 |
| Nuovo holdout finale, algoritmo congelato prima della selezione | 9/96 | 9/96 |

Nessuna parola precedentemente accettata viene rimossa o spostata nei sei confronti. I p95 dei campioni aggiuntivi non peggiorano. La mediana di inizio nel campione da 166 parole passa però da 65,93 a 67,17 ms: l'ampliamento non migliora ogni statistica. Rimangono errori elevati: massimo di fine nel campione principale 904,57 ms, invariato; p95 di fine 384,89 e 462,68 ms nei campioni da 166 e 110 parole. Il karaoke non è perfetto.

I risultati dei campioni di trasferimento/validazione erano stati osservati durante lo sviluppo: non sono una prova finale cieca. È stato quindi congelato l'hash di helper, allineatore e motore parole prima di scegliere i primi due brani inglesi mai usati, in ordine alfabetico nel dataset: LUNABLIND, «Vision (Radio Edit)», e Lower Loveday, «Is It Right». La selezione e gli hash sono in `karaoke-blind-selection.json`; non sono seguite regolazioni karaoke. Il replay reale accetta **9/96 parole sia prima sia dopo**, con mediane di inizio/fine 71,59/71,59 ms e p95 193,91/304,94 ms invariati. Questo campione **non dimostra un aumento della generalizzazione**. Comprende pop e indie inglese, non un nuovo campione rap o italiano.

I rapporti `karaoke-*.json` conservano denominatori, errori per indice di parola, hash dei sorgenti e confronto degli intervalli già accettati. I riferimenti umani servono a valutare, non forniscono timestamp di parola al riconoscitore. Come nel benchmark precedente, sono disponibili gli ancoraggi delle frasi: questi numeri non certificano una LRC arbitrariamente sfasata.

## Cosa è stato implementato

L'allineamento CTC non può usare l'ultimo picco di un carattere come fine della parola: una vocale può proseguire dopo quel picco. Il nuovo produttore offline cerca il separatore di parola effettivamente osservato dal modello e confronta la parola liberamente decodificata tra i separatori. Non accetta una sottostringa forzata, per esempio «in» all'interno di un'altra parola. L'assenza del separatore non viene compensata con un tempo inventato.

Ogni nuova parola CTC deve anche corrispondere a una parola effettivamente riconosciuta dall'ASR indipendente, entro 150 ms all'inizio e 200 ms alla fine. Restano i controlli su confidenza, durata, ordine, LRC e almeno quattro parole per una riga parziale. Un'osservazione ASR ambigua non può essere riutilizzata per due occorrenze vicine. I passaggi ASR originali terminano prima di aggiungere le nuove osservazioni: anticiparle poteva occupare parole che un passaggio successivo avrebbe riconosciuto meglio.

Una prova più permissiva, basata sul solo CTC molto fiducioso, raggiungeva 43/243 ma portava i p95 a circa 968 ms e 881 ms. È stata scartata. Anche i numeri preliminari 192/590 e 29/243 non rappresentano il risultato finale adottato: includevano parole senza la corroborazione indipendente ora obbligatoria. Il riepilogo è `rejected-ctc-alone.json`.

Il lettore usa lo stesso verificatore del benchmark, `karaoke-acoustic-proof.js`. Le prove sono legate sia allo SHA-256 degli MP3 realmente letti sia all'intero testo con gli ancoraggi LRC originali. Il file JSON ha a sua volta hash e limite di dimensione. Cambiare profilo, traccia, registrazione o testo invalida l'applicazione. I tempi salvati passano dall'effettiva funzione `_salvaParoleDallAudio`, preservando gli intervalli già verificati e i percorsi normale/Immersive.

## Risultato concreto sulle registrazioni delle librerie

La nuova architettura può caricare tempi ASR già calcolati offline, senza avviare un decoder o un modello sul telefono. Sono state selezionate prima dell'inferenza le prime tre registrazioni Ste con ID numerico e LRC inglese, più le vere versioni Gym potenziate di 51 e 53. Nessuna modifica alle appartenenze delle librerie.

| Registrazione | Parole acusticamente riconosciute disponibili subito, senza inferenza locale |
|---|---:|
| Ste, track-7 | 107 |
| Ste, track-46 | 9 |
| Ste, track-47 | 67 |
| Gym potenziata, track-51 | 31 |
| Gym potenziata, track-53 | 0, esclusa dall'indice |
| Totale | 214 |

Questo confronto parte da LRC prive di tempi di parola verificati, con eventuale colorazione stimata esclusa dal conteggio. **Non significa 214 parole più precise di quelle che lo stesso ASR avrebbe trovato dopo tutta l'inferenza locale**: sono gli stessi risultati già disponibili senza quel lavoro sul dispositivo. Nel replay completo dei cinque MP3 il CTC non aggiunge ulteriori parole oltre al percorso ASR esistente. Il vantaggio reale di questo campione è la disponibilità immediata dei tempi, anche senza GPU; l'aumento di precisione è misurato soltanto sui benchmark con riferimenti.

Il percorso applicativo verificato recupera queste righe con zero inferenze e zero decodifiche audio locali. Legge comunque gli MP3 per verificarne l'identità; il maggiore del campione è 5.481.452 byte. Non sono misure di CPU, RAM o latenza su iPhone fisico. Dati temporali dei quattro brani: 41.815 byte, indice: 1.613 byte. I modelli Spleeter e wav2vec2 restano offline e non vengono installati sul telefono.

Il percorso senza GPU controlla prima se il brano è indicizzato; le richieste sono limitate, annullabili e non vengono ripetute per lo stesso brano/testo nella sessione. Le prove già in cache possono funzionare offline; una prova assente lascia il karaoke esistente. Non sono precaricati tutti i file del catalogo e non si avvia analisi pesante in background.

## Perché Smart Mix non è aumentato

Il funnel precedente resta pertinente: in Ste 29.598/51.292 coppie non dispongono di battute finali coerenti, 8.034 sono fermate dall'introduzione e 10.825 dal BPM alla fase raggiunta. In Gym sono rispettivamente 299/552, 33 e 191. Le categorie sono sequenziali, non incompatibilità musicali certificate.

Sono stati provati: continuità metrica locale; possibili downbeat in pausa; osservazioni percussive in tre bande su 48 registrazioni fissate in anticipo (24 Ste e tutte le 24 Gym); finestre più brevi; accompagnamento Spleeter; viste a tempo modificato soltanto per l'analisi; un secondo rilevatore RNN madmom con ipotesi di tempo automatico, metà, doppio e BPM globale; infine decodifica sequenziale DBN 3/4 e 4/4 sull'intersezione fissa di sette registrazioni con attivazioni già calcolate. Nessuna nuova coppia completa utilizzabile supera i controlli PCM invariati.

I dati del modello RNN e i funnel sono allegati. La decodifica DBN è una prova offline con 24 stati di tempo, non una nuova certificazione musicale. La diversa scala probabilistica del modello è distinta da Beat This; nessuna sua ipotesi è stata spacciata per un downbeat annotato da un musicista. I rilevatori alternativi non sono installati nel lettore perché non migliorano il risultato.

Un altro esperimento trovava quattro possibili completi Ste anticipando la fine all'ultimo indice di energia grossolano. I segmenti omessi avevano ancora picchi PCM fra 0,0097 e 0,1311: non erano silenzio. I tagli restano esclusi. Non vengono promossi gli otto parziali a completi. I checkpoint alternativi Beat This final1/final2 non sono stati verificabili per indisponibilità HTTP degli endpoint provati.

Il risultato indica che sostituire il rilevatore o aggiungere più ipotesi, mantenendo questo tipo di finestre e la registrazione integra, non basta. Non dimostra che tutte le altre coppie siano musicalmente impossibili. Mancano ancora riferimenti indipendenti su downbeat, sezioni e conclusioni dei brani problematici; non è giustificato rimuovere le protezioni per compensare questa incertezza.

L'indice delle transizioni e gli asset audio già certificati non sono cambiati. È cambiata la gestione della disponibilità del lettore nativo, descritta sotto. La funzione pura estratta dall'audit musicale mantiene lo stesso SHA-256 `4606d389…`, e l'indice conserva `f2f112cc…`: `exhaustive-audit-reuse.json` documenta il confronto. Si riutilizzano quindi le classificazioni dell'audit precedente di 1.381.800 coppie, **senza dichiarare un nuovo audit completo**. Non sono stati prodotti nuovi rendering certificabili dopo gli esperimenti senza esito positivo. Il controllo browser decodifica nuovamente gli asset esistenti a 44,1/48 kHz; non costituisce una nuova misura del loro errore ritmico sul PCM renderizzato.

## Difetto nativo riprodotto e correzione della richiesta di seek

Nel test reale della coppia parziale Ste «Sono Ok» → «Gilgamesh», WebKit ha annunciato una durata di circa 0–1 ms per l'originale `track-4.mp3`, SHA Git `004e594c10688869197f21e31e748c1dd82901b4`. I byte completi sono 3.045.085 e la durata PCM è circa 126,877 secondi. Un caricamento nativo indipendente tramite HTTP con intervalli o Blob annuncia inizialmente zero, poi 126,876708 secondi dopo il gesto Play. Sono prove di WebKit desktop, non di un iPhone fisico.

Il codice precedente poteva limitare un seek richiesto a quel falso fine file. Ora il seek iniziale aspetta un evento nativo con durata utilizzabile; conserva la posizione richiesta, annulla i listener quando cambia traccia o arriva un seek manuale e non introduce polling. Fine naturale, ripresa e preparazione DJ distinguono una durata provvisoria mentre il seek iniziale è pendente. La ripresa richiesta continua a invocare Play, necessario anche per affinare i metadati. Il correttore del passaggio dal buffer comune al lettore nativo aspetta che il seek iniziale abbia concluso il proprio lavoro. Le protezioni contro picchi e disallineamento non sono ridotte.

È stata studiata anche una cornice MP3 aggiuntiva di metadati, verificando PCM identico a entrambe le frequenze. **Non è installata nel lettore** e non riscrive originali, download o cache. Le prove relative sono diagnostiche, non una migrazione del catalogo.

La correzione della richiesta di seek supera i test specifici, ma non basta da sola a eliminare il blocco osservato nella fixture intercettata: alcune esecuzioni WebKit/Ste restano a circa 1 ms senza avanzare. La fixture rispetta Range, Content-Length e CORS, come il server GitHub interrogato con richiesta di due byte; anche con questi header una ripetizione ha fallito.

La diagnostica separata confronta HTTP diretto, server locale e intercettazione, anche assegnando nuovamente la stessa sorgente. Per entrambi gli originali, GitHub diretto e server Range permettono in entrambi i browser di riaprire e raggiungere il punto richiesto. Il percorso intercettato aveva invece errori NotSupported su alcuni primi caricamenti; in Chromium alcuni percorsi senza Range ripartivano da zero ignorando il seek iniziale. Queste differenze non dimostrano la causa del blocco nel lettore completo. Il successivo bypass per gli URL GitHub non influiva sulla sorgente effettiva del caso problematico, che usa `/songs/track-4.mp3` sul server locale della prova. La matrice ha continuato a fallire quel caso (`43765534000`). Anche richiedendo il primo seek realmente concluso prima della successiva prova, il secondo avvio restava bloccato (`43767133467`); la verifica più forte è conservata.

I confronti isolati successivi provano anche intercettazione globale, avvio nel gesto prima dei metadati, audio non silenziato, AudioContext concorrente, seek positivo su sorgente nuova e secondo decoder con il vecchio conservato oppure rilasciato (`43787556143`). Non identificano una causa unica del blocco completo: non è quindi installata alcuna modifica speculativa al rilascio dei decoder. Rilevano però un difetto riproducibile della disponibilità: in una prova WebKit il valore della durata diventa corretto dopo gli eventi di avvio ma il seek rimane inapplicato. La nuova attesa ascolta anche `progress` e `timeupdate`, eventi nativi già presenti, e viene rimossa dopo il seek. Nessun timer o ciclo aggiuntivo. Il test unitario simula esplicitamente l'aggiornamento della durata senza nuovi eventi di metadati. L'esito del test completo resta distinto da questo difetto isolato.

## Stabilità, spazio e verifiche

Suite completa CI sul codice applicativo `11576f5e`: **692/692**, suite DJ **629/629**. Prove specifiche karaoke: 12; prove specifiche seek iniziale: 11; Python rieseguiti: struttura 8, core CTC 3, coda PCM 3, rendering 1, tutti superati. Il core di produzione riproduce numericamente le osservazioni su 19 finestre di riferimento. Un primo test di cache ha richiesto di correggere la fixture dopo l'introduzione della cache in memoria; un test asincrono è stato reso deterministico aspettando l'effettivo avvio della richiesta invece di un numero arbitrario di giri dell'event loop.

Le verifiche browser native vengono eseguite in GitHub CI, non in raffica sul PC. [WebKit generale](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43788040387), [Chromium generale](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43788043769), karaoke, DJ, volume, integrità e metadati superano i rispettivi workflow sul codice applicativo. La [matrice PCM Linux](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43788037210) ha **6/7 job superati e un fallimento WebKit/Ste** anche dopo la correzione sugli eventi; non è assimilata alla suite generale verde. Due esecuzioni precedenti avevano superato tutti e sette i job (`43761030932`, `43761822820`), quindi il passaggio non è ancora affidabile tra le ripetizioni.

Sono state aggiunte la chiusura completa della sessione standalone prima di aprire l'app e una traccia delle scritture native di currentTime, senza cambiare il lettore. Anche questa ripetizione Linux (`43788780959`) fallisce WebKit/Ste, stavolta già al primo seek a due secondi, con durata nativa 0,001000919: la sola presenza di decoder della prova precedente non spiega il problema.

La [stessa matrice con WebKit macOS](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43789096589), conservando Chromium su Linux e le identiche soglie di durata/picco/clock, passa **7/7 job**. È stato poi rieseguito soltanto il caso WebKit/Ste: **superato anche il secondo tentativo**, con un handoff, lettore in riproduzione, identità della sorgente corretta e selezione casuale di un parziale, non di un completo. Sono prove di piattaforme diverse, non la soluzione dichiarata del fallimento Linux: [Playwright raccomanda macOS per avvicinarsi a Safari nelle prove multimediali](https://playwright.dev/docs/browsers). La causa precisa del blocco Linux non è certificata. Gli esiti e la ripetizione sono raccolti in `verification.json` e `browser-playback-macos*.json`.

| Verifica | Esito |
|---|---|
| Suite completa WebKit Linux sul codice applicativo | 692/692 |
| Suite DJ | 629/629, sottoinsieme della suite completa |
| Chromium generale, karaoke, volume, integrità, metadati | Superati |
| Matrice PCM con WebKit Linux | 6/7 job; WebKit/Ste fallito |
| Matrice PCM con WebKit macOS | 7/7 job |
| Ripetizione del caso WebKit/Ste macOS | Superata |
| iPhone fisico e rallentamento generale del telefono | Non verificati; rallentamento non confermato |

In entrambi i browser passano WebCrypto/fetch/JSON/DOM del karaoke su una fixture sintetica di sei parole, con prove di rifiuto del testo e dell'identità audio sbagliati. Questo test di integrazione non misura il riconoscimento vocale degli originali: i confronti sui quattro MP3 sono i replay applicativi separati. Le 15 risorse dei raccordi ritmici vengono misurate a due frequenze per piattaforma: picco massimo WebKit Linux 0,998753786, Chromium Linux 0,999118388 e WebKit macOS 0,999149323, tutti sotto il limite invariato 0,9992. Sono picchi campionati dei decoder; non una misura di true peak analogico. Tutti i 121 descrittori di cue esistenti vengono decodificati a 48 e 44,1 kHz senza rifiuti; **non sono 121 beatmatch completi**.

Download, cache MP3, database personali, preferiti e playlist non vengono cancellati o migrati. Le dimensioni Safari del telefono di Diego restano non attribuibili a Music Box senza l'inventario locale: i circa 957 MB di originali del suo catalogo non provano duplicazioni nei 3,9 GB dei domini condivisi. La funzione esistente «Rapporto spazio» inventaria soltanto lo storage accessibile all'origine Music Box, separando cache, blob IndexedDB e dimensioni note/sconosciute. Va eseguita nel profilo Diego separatamente da Safari e dalla PWA: le partizioni possono differire. Non può attribuire o eliminare i dati di altri siti sullo stesso dominio.

Il test reale di inventario usa un profilo browser temporaneo isolato: zero richieste di rete, stessi nomi delle cache, MP3 byte-identico, testi e preferiti intatti, riconoscimento di una copia della stessa richiesta e annullamento verificati. Non apre lo storage dell'utente. Non abbiamo l'inventario del telefono di Diego e non dichiariamo un risparmio reale in GB. Il rallentamento iPhone resta non confermato; nessuna correzione speculativa di AudioContext o Service Worker audio è stata introdotta. Rimangono necessari un iPhone fisico, ascolto umano delle transizioni e riferimenti vocali italiani affidabili.

La PR segnala ancora conflitti con main. Non sono stati risolti mediante merge o sovrascrittura del catalogo.


## Simulazioni nuovamente eseguite

Venti sessioni fresche, seed e registrazioni potenziate invariati. Tutte le 14 combinazioni profilo/modalità riproducono gli stessi totali del checkpoint d737a27f.

| Ascolto casuale | Cambi | Completi prima → dopo | Parziali prima → dopo | Crossfade | Normali | Postlude | Underlay |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ste | 800 | 0 → 0 | 18 → 18 | 31 | 337 | 110 | 304 |
| Diego | 800 | 21 → 21 | 0 → 0 | 47 | 245 | 107 | 380 |
| Emanuele | 800 | 79 → 79 | 23 → 23 | 53 | 209 | 73 | 363 |
| Gym | 460 | 0 → 0 | 20 → 20 | 16 | 283 | 20 | 121 |

Postlude e underlay restano classi separate, mai conteggiati come completi. Le durate medie dei completi sono 7,29 secondi Diego e 9,24 Emanuele; quelle dei parziali 7,78 Ste, 10,68 Emanuele e 14,15 Gym. Nessun aumento rispetto al checkpoint. Le massime sequenze senza completo sono rispettivamente 40/40/30/23 cambi entro le sessioni simulate, non un limite garantito per l'ascolto reale.

Nelle riproduzioni ordinate e nelle code manuali simulate risultano zero completi; la scelta manuale non viene alterata. Anche il sottoinsieme offline sintetico al 50%, senza buffer PCM comuni precaricati, dà zero completi: non è una misura dei download sul telefono. Contenuto saltato e uscite che troncano il file: zero. Avvii di sovrapposizione prima della fine: 21/64/237/31; non sono uscite che eliminano il finale (queste restano zero). Durate degli overlap, raccordi normali e massime sequenze senza ritmo verificato sono conservati separatamente per ogni modalità in `listening-comparison.json`. Il replay del selettore non modella il decoder nativo che può restare sui metadati provvisori: la matrice browser serve proprio a verificare quel limite separato.


## Riproducibilità del precomputo

Il produttore Node `tools/precompute-karaoke-rows.mjs` esegue i contesti 28/14/7 secondi sul PCM originale, usa la protezione anti-fase del lettore e salva attraverso le funzioni effettive dell'app. Non esporta righe stimate. Una prova nuova sul primo brano Ste, finestre prefissate 0 e 24 secondi, produce 48 parole osservate in sette righe senza ricevere timestamp umani di parola. Il percorso completo e gli ambienti sono descritti in `tools/README-karaoke-acoustic.md`.

Le prove più permissive, i modelli sperimentali e gli originali non vengono aggiunti agli asset del telefono. I risultati senza miglioramenti rimangono documentati per evitare di ripetere gli stessi esperimenti o presentare ipotesi di modello come sezioni annotate.
