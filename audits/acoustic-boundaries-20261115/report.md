# Ripresa da d737a27f — confini vocali e karaoke senza inferenza sul telefono

HEAD locale e remoto verificati: `d737a27fbc381a16972badf277d1d51ea61dd9e0`, PR #59 in bozza. Main, MP3, librerie e versione pubblica non modificati. Questo checkpoint **non risolve la scarsa copertura dei beatmatch completi** e non dimostra equivalenza a Spotify Mixa.

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
| Campione indipendente di trasferimento | 24/243 | 25/243 |
| Secondo campione indipendente | 25/166 | 26/166 |
| Holdout precedente | 14/150 | 14/150 |
| Due nuovi brani, selezionati prima dell'inferenza | 32/110 | 33/110 |

Nessuna parola precedentemente accettata viene rimossa o spostata nei cinque confronti. I p95 dei quattro campioni indipendenti non peggiorano. La mediana di inizio nel campione da 166 parole passa però da 65,93 a 67,17 ms: l'ampliamento non migliora ogni statistica. Rimangono errori elevati, in particolare p95 di fine di 384,89 e 462,68 ms nei campioni da 166 e 110 parole. Il karaoke non è perfetto.

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

Il motore, l'indice delle transizioni e gli asset audio già certificati non sono cambiati. Non sono stati prodotti nuovi rendering certificabili né ripetuto l'audit costoso di 1.381.800 coppie dopo questi esperimenti senza esito positivo. Si mantengono le prove di rendering originali a 44,1/48 kHz del checkpoint precedente; non si dichiarano nuovi risultati acustici del mix.

## Stabilità, spazio e verifiche

Suite locale: 679/679; nuovi test del percorso delle prove: 11/11; regressioni karaoke/DJ mirate: 9/9; Python struttura: 8/8; nuovo core CTC: 3/3. Il core di produzione riproduce numericamente le osservazioni su 19 finestre di riferimento. Un primo test di cache ha richiesto di correggere la fixture dopo l'introduzione della cache in memoria; un test asincrono è stato reso deterministico aspettando l'effettivo avvio della richiesta invece di un numero arbitrario di giri dell'event loop.

Le verifiche browser native vengono eseguite in GitHub CI, non in raffica sul PC. Risultati finali e SHA del checkpoint saranno aggiunti dopo il completamento dei workflow.

Download, cache MP3, database personali, preferiti e playlist non vengono cancellati o migrati. Le dimensioni Safari del telefono di Diego restano non attribuibili a Music Box senza l'inventario locale: i circa 957 MB di originali del suo catalogo non provano duplicazioni nei 3,9 GB dei domini condivisi. Il rallentamento iPhone resta non confermato; nessuna correzione speculativa di AudioContext o Service Worker audio è stata introdotta. Rimangono necessari un iPhone fisico, ascolto umano delle transizioni e riferimenti vocali italiani affidabili.

La PR segnala ancora conflitti con main. Non sono stati risolti mediante merge o sovrascrittura del catalogo.


## Simulazioni nuovamente eseguite

Venti sessioni fresche, seed e registrazioni potenziate invariati. Tutte le 14 combinazioni profilo/modalità riproducono gli stessi totali del checkpoint d737a27f.

| Ascolto casuale | Cambi | Completi prima → dopo | Parziali prima → dopo | Crossfade | Normali |
|---|---:|---:|---:|---:|---:|
| Ste | 800 | 0 → 0 | 18 → 18 | 31 | 337 |
| Diego | 800 | 21 → 21 | 0 → 0 | 47 | 245 |
| Emanuele | 800 | 79 → 79 | 23 → 23 | 53 | 209 |
| Gym | 460 | 0 → 0 | 20 → 20 | 16 | 283 |

Postlude e underlay restano classi separate nei JSON. Nelle riproduzioni ordinate e nelle code manuali simulate risultano zero completi; la scelta manuale non viene alterata. Anche il sottoinsieme offline sintetico al 50%, senza buffer PCM comuni precaricati, dà zero completi: non è una misura dei download sul telefono. Contenuto saltato e uscite che troncano il file: zero. Durate degli overlap, raccordi normali e massime sequenze senza ritmo verificato sono conservati separatamente per ogni modalità in `listening-comparison.json`.
