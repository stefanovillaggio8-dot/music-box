# Music Box — architettura, ascolto e karaoke, 15 novembre 2026

Codice verificato: `95c81f4dc8477e3238c2ed89eab088e42c9a00ba`. Base del confronto: `2aacc59ac998825fec04f1994ef1698380c938a2`. PR #59, branch `audit-karaoke-beatmatch-20261113`, mantenuta in bozza. Il lavoro precedente è conservato. Nessuna modifica di main, merge o pubblicazione.

**Risultato: due nuove coppie complete, realmente renderizzate e utilizzabili dal lettore; più utilizzi nelle sessioni di Emanuele e Diego. Il salto di copertura richiesto non è ancora raggiunto: Ste e Gym restano senza completi, e le sessioni lunghe conservano lunghi intervalli senza beatmatch. Non è dimostrata equivalenza a Spotify Mixa.**

## Confronto misurato

| Misura | Prima | Dopo |
|---|---:|---:|
| Registrazioni analizzabili | 1.176 | 1.176 |
| Coppie ordinate auditate | 1.381.800 | 1.381.800 |
| Beatmatch completi, file integri | 9 | 11 |
| Coppie distinte di registrazioni | 7 | 9 |
| Completi ammessi con buffer PCM comune nei controlli Safari | 9 | 11 |
| Completi Ste / Diego / Emanuele / Gym | 0 / 2 / 5 / 0 | 0 / 2 / 7 / 0 |
| Raccordi metrici parziali | 0 | 0 |
| Snap breve, contato separatamente | 1 | 1 |
| Uscite strutturali che interrompono il file prima dell’EOF | 0 | 0 |
| Completi con inizio overlap almeno 8 s prima dell’EOF | 2 | 4 |
| Durata media dei completi nel catalogo | 7.514 s | 8.396 s |

`verifiedBeat=12` include uno snap: non equivale a dodici completi. Le identità di libreria che condividono SHA rimangono distinte; nessuna canzone è stata aggiunta per migliorare i risultati. `structuralEarlyExits=0` significa che non vengono troncate le registrazioni. Le nuove sovrapposizioni iniziano rispettivamente 13,886 e 10,837 secondi prima dell’EOF, lasciando suonare tutto il file uscente e iniziando quello entrante da zero. Non sono tagli anticipati di strofe o finali.

## Simulazioni dell’algoritmo effettivo dell’app

Snapshot BUILTIN, stato e playlist invariati; seed 20261114 invariato. URL effettivi dell’app e manifesto potenziamenti vincolato a SHA. Librerie principali Ste 227, Diego 212, Emanuele 621; Gym 24 brani effettivamente disponibili, tutti potenziati. Non vengono sostituiti con originali più favorevoli. Un brano di Emanuele, Curazao (`b-track-1055`), rimane in libreria con analisi fallita: 620 registrazioni analizzabili, nessuna sostituzione automatica.

Venti sessioni indipendenti da 40 cambi (Gym 23): nessuna ripetizione entro la sessione; la cronologia si azzera fra sessioni. Questa ipotesi è esplicita e non rappresenta la cronologia reale del telefono.

| Profilo | Completi prima → dopo / cambi | Parziali | Crossfade | Normali | Postlude | Underlay | Max senza completo | Overlap medio dei completi, s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ste | 0 → 0 / 800 | 0 | 2 | 611 | 109 | 78 | 40 | 0.000 |
| Diego | 9 → 10 / 800 | 0 | 0 | 599 | 110 | 81 | 40 | 7.362 |
| Emanuele | 40 → 60 / 800 | 0 | 0 | 398 | 81 | 261 | 32 | 10.284 |
| Gym, versioni potenziate | 0 → 0 / 460 | 0 | 0 | 428 | 31 | 1 | 23 | — |

Postlude e underlay sono raccordi distinti, non beatmatch completi. I loro conteggi non vengono promossi per gonfiare la copertura.

Ciclo continuo fino a esaurimento della libreria, senza riavviare la sessione:

| Profilo | Completi prima → dopo / cambi | Massimo consecutivo senza completo prima → dopo |
|---|---:|---:|
| Ste | 0 → 0 / 226 | 226 → 226 |
| Diego | 1 → 2 / 211 | 182 → 144 |
| Emanuele | 2 → 3 / 620 | 614 → 612 |

La nuova prenotazione del partner consente di usare entrambe le coppie disponibili di Diego nel ciclo fissato e riduce il massimo intervallo da 182 a 144 cambi. Il miglioramento nelle sessioni brevi di Emanuele è 40→60, ma nel ciclo completo è soltanto 2→3: non sono risultati intercambiabili.

Quattordici scenari, 6.460 cambi: zero secondi udibili saltati e zero omissioni iniziali secondo l’indice. Questo controllo quantitativo non identifica semanticamente strofe, assoli o build-up. Nei percorsi ordinati e nelle code manuali campionate non ci sono completi; le code non vengono riscritte. Una coppia compatibile accodata manualmente è invece realmente esercitata nel browser (934→1124). I percorsi offline sintetici, con il 50% fisso degli MP3 e nessun buffer comune già preparato, restano a zero completi. Non sono misurazioni dei download di Diego.

## Cause della copertura bassa e falsi negativi

Diagnostica sulle coppie appartenenti alle librerie reali, non sull’intero catalogo mescolato. Ogni coppia è classificata al punto più avanzato raggiunto da almeno una finestra: sono esclusioni sequenziali, non una stima di tutte le incompatibilità simultanee. I conteggi delle singole finestre sono salvati separatamente nei JSON e non vanno sommati come coppie. La tabella esclude coppie della medesima registrazione con SHA identico (10 Ste, 8 Emanuele); le rispettive identità di libreria non sono eliminate.

| Profilo | Coppie | Finale senza battute coerenti | Inizio senza battute coerenti | BPM | Metro / estensione | Downbeat osservati / fit affine | Durata overlap | Voce / LRC | Armonia | Attacchi PCM indipendenti | Candidati completi |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ste | 51292 | 29598 | 8034 | 10825 | 967 | 195 | 193 | 1163 | 305 | 12 | 0 |
| Diego | 44732 | 19201 | 8555 | 14011 | 849 | 197 | 255 | 1454 | 207 | 1 | 2 |
| Emanuele | 383772 | 117606 | 91887 | 147509 | 2908 | 2109 | 2506 | 16319 | 2839 | 82 | 7 |
| Gym | 552 | 299 | 33 | 191 | 0 | 6 | 1 | 19 | 2 | 1 | 0 |

Queste diagnosi riguardano la costruzione delle finestre, non costituiscono certificazione di rendering. La necessità di preservare l’intera registrazione limita fortemente le finestre finali: il modello può trovare una battuta interna valida, ma non autorizza a eliminare 92 o 128 secondi successivi. Le protezioni rimangono attive. La scarsità dei punti finali utilizzabili è un limite dei dati e della geometria ammessa; non dimostra che ogni brano escluso sia musicalmente impossibile da mixare.

Falso negativo corretto: il vecchio assemblaggio univa ipotesi di beat diverse (intero brano e analisi del bordo), introducendo attacchi incompatibili. Ora ogni ipotesi coerente viene verificata separatamente sul PCM originale, senza togliere attacchi a posteriori per farla passare. Un altro limite era il veto vocale globale: il nuovo passaggio di voce usa solo un intervallo di uscita/ingresso realmente privo di voce nel modello separato e coerente con le indicazioni LRC disponibili. Questi interventi producono le due nuove coppie, che devono comunque superare tutte le verifiche successive.

Frasi e struttura: vengono considerate ipotesi di gruppi di battute e confini del modello. Non esiste in questo catalogo una verità annotata di strofa/ritornello/assolo; non vengono inventati conteggi di “frasi semanticamente certificate”. La verifica acustica dei downbeat non equivale alla certezza del primo movimento musicale da parte di un annotatore umano.

## Implementazione applicata al lettore

- Finestre coerenti alternative, prova vocale su PCM originale, mantenimento dell’uscente a guadagno unitario fino all’EOF decodificato e ingresso da zero.
- Ingresso progressivo in primo piano nella pausa vocale verificata, senza il calo e successivo salto di guadagno alla fine del file uscente. Nessun taglio dell’uscente per far emergere il nuovo brano.
- Lookahead sui picchi ricostruiti a 4× nel renderer offline; controlli finali sui picchi e limite massimo di attenuazione conservati. Nessuna analisi pesante aggiunta al telefono.
- Prenotazione transitoria dei partner ancora freschi nella riproduzione casuale. Il lookahead a due passi già esistente è preservato. Se il prossimo brano consumerebbe una destinazione di un futuro beatmatch certificato, si può preferire un’alternativa nello stesso livello di sicurezza entro il 3% del punteggio corrente, oppure un altro passaggio naturale quando non c’è un overlap sicuro. Non è un nuovo beatmatch nel contatore. Massimo 128 collegamenti indicizzati, nessun decoder aggiuntivo, nessun vincolo persistente e nessun brano reinserito. Verifica di coda manuale, riordino utente, pool fresco aggiornato, LRC e disponibilità offline. I controlli finali dell’app restano sovrani.
- Aggiornamento degli URL effettivamente caricati da HTML e Service Worker: Smart Mix `dj=50`, struttura `structure=7`, ASR `lang=20`. Versione pubblica invariata.

## Audio originale e risultati del rendering

1. **Body (Remix) → Gli occhi della tigre** (934→1124): 4 battute, overlap 13,886 s, rapporto tempo entrante 1,046015. RMS degli attacchi dopo il rendering a 48 kHz **17,358 ms**, RMS delle battute **18,126 ms**. Picco ricostruito **0,998009** nell’intero asset (include il pre-roll originale già molto alto), **0,878805** nell’overlap. Riduzione massima condivisa **0,201 dB**, media overlap **0 dB**.
2. **E tu… → Paradise Now** (700→521): 4 battute, overlap **10,837 s**, rapporto tempo **0,961503**. Una calibrazione di inizio di **+15 ms**, sottoposta nuovamente a tutte le verifiche, porta l’RMS a **28,004 ms** a 48 kHz e **27,674 ms** a 44,1 kHz; RMS battute rispettivamente **11,610 / 14,800 ms**. Picco ricostruito 48 kHz **0,508460**, riduzione condivisa **0 dB**.

Il controllo delle sorgenti confronta 1.176/1.176 SHA con gli alberi Git originali e non rileva discrepanze. Non è stata effettuata una nuova decodifica integrale di tutti i 1.176 MP3 in questo checkpoint: il rendering nuovo usa effettivamente gli originali delle coppie aggiunte e l’audit esaustivo esegue il pianificatore sui dati PCM già estratti, non 1.381.800 rendering.

Entrambe passano il rendering indipendente a 48 e 44,1 kHz, la verifica sul ritmo renderizzato, i confini di battuta e i picchi. SoundTouch preserva la tonalità; questo non prova l’assenza soggettiva di ogni artefatto. Le soglie di accordo degli attacchi, numero minimo per metà finestra, RMS, tempo e armonia non sono state abbassate. Le pause vocali richiedono 300 ms di margine su entrambi i lati dell’avvicendamento, con le medesime soglie di attività vocale; i risultati del separatore rimangono evidenze automatiche, non verità certificate.

Controllo del volume: confronto di due finestre da mezzo secondo prima dell’EOF e dopo il rilascio del guadagno. Il salto del controllo tecnico con ingresso fisso a 0,33 passa da **+8,615 a +0,947 dB** per 934 e da **+9,486 a −0,400 dB** per 700. È un confronto A/B delle nuove coppie, che prima non erano disponibili in produzione: non è un confronto con una transizione già presente al checkpoint iniziale. Non è una misura LUFS dell’intero catalogo né un ascolto umano. L’attenuazione storica delle altre coppie non viene rimossa indiscriminatamente. Nel pianificatore attuale, le undici coppie complete selezionate hanno una riduzione massima condivisa documentata fino a **1,628 dB** (`selected-gain-proof.json`): non si riporta −3,58 dB come se fosse ancora una misura corrente, né si attribuisce tutta la differenza a questo checkpoint. I valori statici di headroom non sono misure della curva effettivamente renderizzata.

Nella cartella di consegna sono disponibili MP3 con contesto originale e gli esatti FLAC usati dal lettore. Le anteprime MP3 hanno soltanto un’attenuazione uniforme documentata per prevenire overshoot del codec; il guadagno dei FLAC del lettore non viene modificato dalle anteprime.

## Strategie confrontate e scartate

- Griglie a ottava / metà tempo: zero nuove coppie dopo aver ripristinato tutti gli attacchi osservati; nessuna promozione tramite scelta degli attacchi favorevoli.
- Vista percussiva con gli stessi pesi su **38 MP3 originali**: ulteriori ipotesi di battuta, ma nessuna coppia aggiuntiva oltre alle due accettate dopo i controlli completi. Non avvia nuovi modelli sui telefoni.
- Tre partizioni vocali: nessuna nuova coppia completa; mantenuto soltanto il passaggio singolo verificabile.
- Tempo condiviso su entrambi i brani: quattro geometrie di una coppia Emanuele, zero Ste/Diego nel campione, non renderizzate. Non integrate: non basta a giustificare una nuova architettura del clock dell’uscente.
- Lookahead lessicografico a due passi: nessun beneficio misurato rispetto al selettore esistente; non integrato. La prenotazione del partner ha invece un beneficio misurato su Diego ed è applicata.
- Pesi alternativi `final1`: download dall’endpoint ufficiale fallito con HTTP 500. Nessun modello sostitutivo scaricato da mirror non verificati.
- Varianti di rendering non conformi a ritmo, stretch o picchi rimangono scartate; il dettaglio è negli allegati, non conteggiato come disponibilità del lettore.

## Karaoke: copertura e code degli errori

| Campione, protocollo identico prima/dopo | Parole accettate | Mediana inizio, ms | P95 inizio, ms | Mediana fine, ms | P95 fine, ms |
|---|---:|---:|---:|---:|---:|
| Sviluppo, inglese, 590 parole | 168 → 168 | 53,848 → 53,848 | 200,211 → 200,211 | 65,773 → 65,773 | 228,388 → 228,388 |
| Vecchio campione indipendente, 150 parole | 10 → 14 | 39,938 → 33,942 | 156,673 → 156,673 | 39,938 → 39,938 | 202,795 → 202,795 |
| Nuova validazione disgiunta, 166 parole | 25 → 25 | 65,935 → 65,935 | 360,912 → 360,912 | 76,913 → 76,913 | 384,893 → 384,893 |

Il vecchio campione indipendente è stato usato per sviluppare questo recupero: il progresso 10→14 non prova da solo la generalizzazione. Le quattro parole aggiunte sono nel rap francese Confession — Quesabe. I timestamp delle dieci già accettate rimangono invariati. Un prototipo accettava una quinta parola breve con errore peggiore: è stato rifiutato; non viene nascosto dentro la mediana.

La nuova validazione è stata scelta prima dell’inferenza, escludendo i sette brani precedenti: Color Out — Falling Star (canto inglese) e Der Musiker — d-music (rap tedesco). Non migliora e ha P95 elevato: il limite del riconoscitore sulle parole difficili rimane reale. Il corpus fisso disponibile ha 79 registrazioni nelle lingue en/de/es/fr e non contiene italiano; non è stata misurata la precisione sull’italiano e non vengono inventati riferimenti.

Implementazione: richiede sequenze distintive esatte di almeno tre parole in due contesti acustici diversi, con inizi e fini entro 60 ms; mantiene uno degli intervalli effettivamente riconosciuti. Parole fino a due lettere con durata oltre 250 ms richiedono un terzo contesto concorde. Non interpola parole assenti. Cronologia limitata a 12 osservazioni × 240 parole, vincolata a SHA originale, profilo, brano, URL e firma del testo; eliminata quando la pagina viene nascosta, la richiesta annullata o il contesto cambia. Nessun passaggio ASR aggiuntivo richiesto da questa regola, né modello più pesante.

I benchmark riusano lo stesso protocollo offline di sette osservazioni per finestra (28 s + due contesti da 14 s + quattro da 7 s) con ancore di frase: non sono sette inferenze sempre eseguite dal telefono e non dimostrano prestazioni fisiche iPhone. Il percorso reale di salvataggio/ricaricamento dell’app e gli hash attuali sono verificati nei tre JSON `karaoke-current-*`. Riproduzione normale e Immersive mantengono le correzioni precedenti. Durante l’overlap la UI segue ancora il brano uscente fino all’handoff: la presentazione del testo entrante prima dell’EOF rimane un limite, distinto dall’assenza di testo obsoleto dopo il cambio.

## Spazio offline di Diego: verifica senza distruzioni

I **957.041.024 byte** sono la dimensione logica di una copia dei 212 MP3 originali del catalogo di Diego, non il consumo del suo telefono. I 2,8 GB su github.io e 1,1 GB su githubusercontent.com non sono automaticamente attribuibili tutti a Music Box; la cache HTTP condivisa e altri siti non sono misurabili dall’app. Non è dimostrato che la differenza siano duplicati.

In questo checkpoint non sono cancellati download, cache o record. Il rapporto in sola lettura distingue audio, copertine, testi/metadati, analisi e cache temporanee tramite nomi e tipi. Usa Content-Length dichiarato per CacheStorage e dimensioni Blob / metadati UTF-8 per IndexedDB; dimensioni ignote e uso fisico stimato rimangono espliciti. Stessa URL non equivale a stessi byte né autorizza una pulizia. Non vengono classificati orfani soltanto i dati con un nome di versione vecchio.

Per il telefono reale, senza pubblicare la PR: usare `Audit-spazio-Diego-sola-lettura.js` sulla **stessa origine pubblica già usata da Diego**, mediante Web Inspector Safari su Mac collegato all’iPhone. Aprire il profilo Diego, attendere la fine dei download, mantenere la pagina visibile e lanciare lo script nella console della pagina corretta, separatamente Safari e PWA. Non usare una nuova origine privata per misurare i dati della vecchia origine: gli archivi sarebbero diversi. Nessuna richiesta di rete, cancellazione o invio dei dati è contenuta nello script. Il risultato rimane locale in console.

Lo script apre il database solo se già elencato da `indexedDB.databases()` e abortisce ogni `upgradeneeded` in caso di race; non crea il database per misurarlo. Se la piattaforma non consente l’inventario lo dichiara, senza migrazioni. Quattro casi simulati verificano database esistente, assente, race di creazione e profilo sbagliato. I test browser reali preservano byte offline, testi e preferiti, verificano annullamento e zero richieste di rete. Non sono stati eseguiti sul telefono di Diego. Nessun quantitativo di spazio liberato viene dichiarato.

Per abilitare l’ispezione: [documentazione ufficiale WebKit](https://webkit.org/web-inspector/enabling-web-inspector/). Il rapporto completo per decidere se una copia sia eliminabile richiede i dati effettivi del dispositivo. La deduplicazione del preloader introdotta nel checkpoint precedente resta conservata; era disabilitato nel percorso nativo iPhone e non spiega da solo i GB osservati.

## Regressioni e limiti fisici

Le prove CI sono raccolte in `workflow-reservation-final.json`; i risultati dei due browser sono allegati separatamente. Il test comune decodifica tutti i **106 asset referenziati** a 48 e 44,1 kHz, esercita l’handoff nativo, seek/rollback, muting durante overlap, pianificatore reale con coda manuale e selezione casuale. I 105 FLAC del checkpoint iniziale rimangono identici; la directory ne contiene 107 perché due sono nuovi e uno storico non era referenziato già alla base.

La suite completa è rieseguita, insieme alla suite DJ, gli otto test Python, audit esaustivo, volume, karaoke, smoke Chromium desktop, WebKit e Immersive. I conteggi finali e gli SHA sono in `verification.json`. Sono stati ispezionati anche gli ultimi stati dei 35 workflow configurati (`all-workflow-status.json`): non vengono avviati workflow di pubblicazione o importazione estranei alla verifica della PR. Eccezioni esplicite: l’ultima esecuzione di `Whole-recording musical structure evidence` è annullata e `Music Box - importa YouTube online (PC spento)` non ha esecuzioni. L’analisi strutturale completata e già acquisita viene conservata; non si afferma che ogni ultima esecuzione di tutti i workflow sia verde. Le nove verifiche pertinenti a questo codice sono passate. In precedenza alcune esecuzioni browser sono fallite per la ricerca asincrona della fixture (filtro di 160 ms e titoli/punteggiatura) o l’assunzione dell’inviluppo precedente. Sono state corrette le attese e la fixture; nessuna soglia musicale è stata abbassata. Due test sintetici della nuova prenotazione hanno inoltre richiesto lo stub `indexedFullBeatBridge` mancante nella vecchia fixture: errore riprodotto e corretto, suite DJ 597/597 e completa 655/655 rieseguite in CI. I run successivi sono le prove valide, senza nascondere lo storico dei fallimenti.

Non è riprodotto né dimostrato un rallentamento globale dell’iPhone. Nessuna modifica speculativa alla memoria, AudioContext o Service Worker. I test automatici non misurano CPU/RAM di un iPhone fisico. Il mix comune conserva il comportamento protetto esistente quando la pagina viene nascosta, con ripristino dell’uscente nativo: la continuità percettiva della voce entrante già udibile durante questa cancellazione richiede prova su dispositivo. Non viene promessa equivalenza fra Playwright WebKit e Safari/PWA su iPhone 13.

Il conflitto preesistente con main in `dj-deep-analysis.json` è controllato in sola lettura tramite `git merge-tree`, senza merge o sovrascritture distruttive. Rimane da risolvere con confronto dei dati prima di un eventuale merge autorizzato.

## Interventi ancora necessari

1. Aumentare davvero le uscite musicali verificabili di Ste e delle versioni Gym senza tagliare file: attualmente zero completi. Servono evidenze più affidabili delle battute finali, non altre variazioni dei contatori.
2. Valutare con ascolto umano gli MP3 allegati: groove, basso, energia, voce e artefatti. Le misure acustiche sono riproducibili ma non sostituiscono un giudizio musicale.
3. Risolvere la copertura molto bassa e gli errori estremi del nuovo campione karaoke; ottenere riferimenti italiani verificati prima di dichiararne la precisione.
4. Misurare lo spazio sulla vera origine del telefono di Diego. Non autorizzare cancellazioni basandosi soltanto sui totali dei domini.
5. Provare Safari/PWA fisici: background ripetuto, seek, pause/ripresa, download, cambio coda e cancellazione mentre è udibile la nuova voce; verificare anche la UI karaoke durante l’overlap.

Le prove si trovano nella stessa directory di questo rapporto nel repository e nella sottocartella `prove` della consegna locale. Le prove e i campioni sono consegnati; l’obiettivo finale rimane aperto. Non si dichiara Spotify Mixa raggiunto, nessuna pubblicazione è stata eseguita e la PR resta in bozza.
