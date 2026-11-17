# Music Box — verifica Smart Mix e karaoke, 14 novembre 2026

PR #59 in bozza, branch `audit-karaoke-beatmatch-20261113`. Main non modificato, nessun merge e nessuna pubblicazione.

**Confronto con il punto esatto di ripresa `5eaaa6f6`.** Completi integri: **2→9**, cioè **2→7 coppie di registrazioni distinte**. Nelle librerie: Ste **0→0**, Diego **1→2**, Emanuele **1→5**. Nessuna libreria alterata.

**Il limite nelle sessioni lunghe resta grave.** Le venti sessioni indipendenti da quaranta cambi ripartono ogni volta con cronologia vuota e possono ritrovare gli stessi pochi brani di uscita. Non rappresentano un ciclo continuo senza ripetizioni. Il ciclo completo, con lo stesso selettore reale e seed fisso, misura:

| Profilo | Cambi senza ripetizioni | Completi checkpoint → dopo | Massimo consecutivo senza completo, checkpoint → dopo |
|---|---:|---:|---:|
| Ste | 226 | 0 → 0 | 226 → 226 |
| Diego | 211 | 1 → 1 | 176 → 182 |
| Emanuele | 620 | 0 → 2 | 620 → 614 |

Solo due brani uscenti di Diego e tre di Emanuele possiedono un completo disponibile. Persino un ordine ideale non può usare più di questi pochi punti di uscita in un ciclo senza ripetizioni. Ste resta senza completi. La copertura quotidiana è ancora insufficiente; non viene dichiarata equivalenza a Spotify Mixa.

**Protezione estesa a tutti gli ingressi.** Anche il cambio normale a EOF, il prebuffer e i fallback nativi ora usano la stessa verifica del prefisso originale: una semplice intro a bassa energia non autorizza a saltarla. Quindici vecchi ingressi positivi fino a 18 s sono stati decodificati sugli MP3 originali stereo: nessuno è silenzio digitale. L’audit separato delle uscite respinge ancora 39/46 proposte storiche, incluse quelle che omettevano 92,52 e 128,48 s. Le sette uscite non respinte da quel singolo controllo non sono autorizzazioni del lettore: restano necessari ingresso e rendering validi.

Gli hash di quattordici sorgenti effettivamente selezionate corrispondono ai blob correnti del repository degli MP3. `runtime-evidence.json`, prove dei prefissi e archivio dei vecchi cue permettono di ripetere i confronti senza reinstallare cue storici nel lettore.

**Risultato concreto e limite principale.** Le nuove transizioni preservano il file uscente fino al suo EOF decodificato e il brano entrante dal campione iniziale. Il selettore reale trova 9 beatmatch su 800 cambi casuali di Diego e 40/800 di Emanuele. Ste resta a zero. La copertura è ancora molto lontana da un DJ set continuo e non dimostra equivalenza a Spotify Mixa.

**Correzione indispensabile del confronto.** Il precedente totale di 51 completi comprendeva 50 coppie con ingresso successivo a zero, privo di prova di silenzio digitale. Una coppia usata dalla simulazione di Ste saltava 219,82 secondi del brano entrante. Le introduzioni deboli non sono silenzio. Questi conteggi non possono essere mantenuti come transizioni che preservano integralmente le canzoni.

| Misura sul catalogo | Prima, dati dichiarati da 2efb4c3e | Dopo |
|---|---:|---:|
| Registrazioni analizzate | 1.176 | 1.176 |
| Coppie ordinate analizzate | 1.381.800 | 1.381.800 |
| Beatmatch completi, criterio storico | 51 | 9 |
| Completi senza omissione iniziale non verificata | 1 | 9 |
| Coppie distinte di registrazioni complete e integre | 1 | 7 |
| Completi disponibili tramite controlli Safari | 45, con il problema sopra | 9 |
| Uscite strutturali anticipate, cioè termine prima dell’EOF | 23 | 0 |
| Sovrapposizioni complete che iniziano almeno 8 s prima dell’EOF | non confrontabile con il vecchio campo “anticipate” | 2 |
| Raccordi metrici parziali | 3 | 0 |
| Raccordi brevi snap, categoria separata dai completi | 2 | 1 |
| Crossfade nel catalogo | 59.833 | 56.385 |
| Passaggi normali nel catalogo | 1.233.947 | 1.242.134 |
| Postlude nel catalogo | 85.578 | 81.022 |
| Underlay nel catalogo | 2.357 | 2.223 |
| Candidati beat respinti nel catalogo | 29 | 26 |
| Durata media dei completi, coppie indicizzate | 9,784 s | 7,940 s |
| Errori dell’audit completo | 0 | 0 |

Le nove coppie indicizzate corrispondono a sette coppie di SHA audio: tre destinazioni già presenti nel catalogo condividono la stessa registrazione. Non sono state aggiunte canzoni, copie o appartenenze per migliorare i contatori. `verifiedBeat=10` include il raccordo breve e non significa dieci beatmatch completi.

**Disponibilità nelle vere librerie.** Il vecchio dato di 15 coppie interne classificava file di catalogo. L’inventario ripetibile qui sotto applica appartenenze, copie esplicite, cancellazioni, playlist nascoste e controlli Safari realmente usati dalla simulazione: prima 13 coppie effettivamente disponibili, ora 7. Le vecchie coppie di Ste ed Emanuele avevano il problema dell’ingresso omesso.

| Profilo | Brani della libreria immutata | Completi disponibili prima, Safari logico | Completi disponibili dopo |
|---|---:|---:|---:|
| Ste | 227 | 5 | 0 |
| Diego | 212 | 1 | 2 |
| Emanuele | 621 | 7 | 5 |

**Sessioni casuali reali.** Stessi snapshot, seed 20261114, venti sessioni di quaranta cambi; Gym venti sessioni di ventitré cambi. Il codice del selettore e del pianificatore viene eseguito, con pool fresco e cronologia. Sono simulazioni riproducibili delle capacità Safari, non misure delle preferenze o dei download presenti sul telefono.

| Libreria | Completi prima → dopo | Parziali dopo | Crossfade dopo | Normali dopo | Postlude dopo | Underlay filtrati dopo | Sovrapposizione media dopo | Max cambi senza completo, prima → dopo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ste /800 | 17 → 0 | 0 | 2 | 611 | 109 | 78 | 5.063 s | 40 → 40 |
| Diego /800 | 0 → 9 | 0 | 0 | 599 | 109 | 83 | 5.897 s | 40 → 40 |
| Emanuele /800 | 0 → 40 | 0 | 0 | 444 | 84 | 232 | 7.901 s | 40 → 36 |
| Gym /460 | 2 → 0 | 0 | 0 | 408 | 49 | 3 | 5.595 s | 23 → 23 |

I 17 completi precedenti di Ste e i due di Gym non rispettavano la nuova protezione dell’ingresso. Postlude e underlay non vengono conteggiati come completi o come raccordi metrici parziali. Il miglioramento 0→9 di Diego e 0→40 di Emanuele è utilizzabile nel selettore; la grande maggioranza dei cambi resta un raccordo diverso dal beatmatch.

Su tutti i 6.460 cambi dei quattordici scenari dopo la modifica, omissione iniziale e contenuto udibile saltato stimato dall’indice sono zero. Le sezioni musicali non sono annotate semanticamente da esseri umani: “zero secondi omessi” non certifica la bellezza dell’incastro.

La durata media delle sovrapposizioni nella tabella esclude i passaggi normali senza overlap e comprende anche postlude e underlay: non è la durata media dei soli completi. Le uscite strutturali anticipate sono zero in tutti questi scenari.

**Ordine, coda e offline.** Nei percorsi ordinati e nella coda manuale non si forza un riordino per produrre un beatmatch. Tutti gli scenari sono conservati nei JSON prima/dopo, con categorie, sovrapposizioni, tracce e omissioni iniziali.

| Profilo | In ordine: completi / cambi | Coda manuale: completi / cambi | Offline casuale a cache fredda: completi / cambi |
|---|---:|---:|---:|
| Ste | 0 / 226 | 0 / 40 | 0 / 800 |
| Diego | 0 / 211 | 0 / 40 | 0 / 800 |
| Emanuele | 0 / 620 | 0 / 40 | 0 / 800 |

L’offline assume un manifesto sintetico fisso con metà degli MP3 scaricati e nessun buffer comune già decodificato. Non rappresenta il telefono dell’utente. I download MP3 esistenti non sono stati cancellati o migrati. La disponibilità di mix completi offline dopo un riavvio resta un collo di bottiglia: il rendering comune non ha ancora una cache durevole dedicata che ne garantisca il recupero.

**Analisi e architettura attuali.** Il motore comune, SoundTouch, le protezioni del finale e la ricerca casuale a due passi erano già presenti al checkpoint e sono stati conservati. Gli avanzamenti successivi riguardano nuovi ingressi e rendering verificati, protezione estesa dei prefissi, ulteriori geometrie iniziali, karaoke con contesto e misurazioni sul codice effettivo.  Recuperati i sedici shard di bordi originali dal workflow 43560889412: 1.176 sorgenti, zero errori; 1.121 intro e 1.170 finali con almeno otto beat ipotizzati; 888 intro e 1.111 finali con almeno due battute candidate. Il checkpoint Beat This è verificato tramite SHA256, compreso il mirror identico. I posteriori non sono probabilità calibrate di correttezza musicale.

La generazione combina le catene di battute dell’analisi intera e dei bordi, recupera attacchi PCM reali entro una finestra limitata e valuta più geometrie. Conserva i requisiti completi: almeno otto attacchi indipendenti, almeno il 90% di accordo e RMS massimo 40 ms, oltre a controlli più stretti per promuovere pattern percussivi differenti. L’ipotesi metrica viene ricontrollata dopo il rendering; non viene promossa da sola.

L’uscente resta a inviluppo unitario fino all’ultimo campione decodificato, salvo il guadagno comune di sicurezza. L’entrante parte da zero. Il mix completo è ammesso solo se l’intero ingresso è acusticamente privo di voce oppure l’intero segmento uscente è strumentale secondo Spleeter, senza contraddizioni LRC note. Queste sono evidenze automatiche, non annotazioni vocali certificate.

L’ingresso conservativo lento attenuava troppo il primo attacco. Il nuovo ingresso sale a 0,33 in 8 ms, conservando l’attacco iniziale e verificando nuovamente armonia, picchi e ritmo sul segnale effettivamente udibile. SoundTouch conserva la tonalità e resta nel limite 0,95–1,05; quando la versione nativa a 1× supera i controlli viene preferita.

Il casuale usa anche una continuazione verificata di due brani quando manca un completo diretto. La ricerca è limitata al pool attuale e a raccordi già sicuri di qualità simile, senza uscire dalla playlist, alterare la coda manuale o presentare la continuazione futura come un mix già eseguito.

**Perché Ste resta scoperto.** Questa tabella è il primo motivo di rifiuto nel generatore strutturale su sorgenti di profilo, incluse versioni e bassi: non è il conteggio delle playlist visibili né una prova di incompatibilità musicale definitiva.

| Profilo | Coppie esaminate | Finale metrico non abbastanza verificato | Intro metrica non abbastanza verificata | Metro/tempo | Voce/testo | Armonia locale | Fit PCM indipendente | Coppie candidate complete |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ste | 75292 | 43257 | 10615 | 19414 | 1594 | 399 | 13 | 0 |
| Diego | 47294 | 20177 | 9205 | 16101 | 1642 | 166 | 1 | 2 |
| Emanuele | 383772 | 117606 | 91887 | 154311 | 17564 | 2349 | 50 | 5 |

Per Ste, tredici casi arrivano al confronto ritmico indipendente e non lo superano; nessuno diventa completo senza tagliare l’ingresso. Molti altri casi si fermano su battute non abbastanza verificate: è un limite dell’evidenza disponibile, non la dimostrazione che quei brani non possano essere mixati da un DJ.

**Rendering e sicurezza audio.** Diciassette varianti del nuovo ingresso: nove superano tutti i controlli a 48 kHz, otto vengono respinte (cinque per ritmo dopo il rendering, due per time-stretch, una per picco sovracampionato). A 44,1 kHz: dieci accettate e sette respinte. Il confronto precedente con ingresso lento passava 7/17 a 48 kHz. Si conservano anche versioni precedenti già verificate quando sono migliori; varianti e file FLAC non diventano coppie aggiuntive.

La ricerca PCM completa con ingresso da zero ha esaminato le 1.381.800 coppie e ha prodotto solo quattro candidati legacy: due rendering accettati, due respinti per sicurezza dei picchi. La coppia aggiuntiva fra profili 644→19 non è stata installata come nuova certificazione nel lettore.

Sui nove completi selezionati, il controllo indipendente dei componenti effettivamente udibili misura RMS ritmico tra **10,35 e 26,44 ms**. Sui nuovi strutturali, tutti i downbeat osservati richiesti devono rientrare in 25 ms RMS e 50 ms massimi. La coppia legacy conserva una certificazione di impulsi, senza attribuirle una verifica di frasi o downbeat che non possiede.

Massimo picco ricostruito a 4× sui completi selezionati: **0,971334**, inferiore a 1. Il controllo del clipping non è stato rimosso. L’armonia usa chroma e dissonanza locale del PCM, con contributi quieti limitati dal guadagno reale; non certifica soggettivamente consonanza o qualità da DJ.

Per 451→315 il guadagno comune viene limitato intorno ai picchi effettivi, con attacco/rilascio limitati e guadagno unitario ai confini nativi. Attenuazione media nell’overlap: circa **0,649→0,012 dB**; RMS misurato **0,124826→0,132811**, +0,539 dB. La massima riduzione puntuale passa da circa 0,649 a 0,707 dB: migliora la continuità media, non il minimo guadagno. Non è una correzione generalizzata di tutti i vecchi casi a −3,58 dB.

**Karaoke implementato e misurato.** A un passaggio successivo si riprovano solo zone irrisolte già analizzate, con nuclei di 14 s e 2 s di contesto. Ogni osservazione ASR appartiene a un solo nucleo; niente timestamp interpolati per le parole mancanti. I tempi già accettati si conservano tramite il vero salvataggio/ricaricamento dell’app. Stesso modello Whisper Tiny multilingue e stessi pesi: nessun modello più pesante sul telefono.

Su iPhone resta una sola inferenza per richiesta e il limite già esistente di tre finestre nella sessione normale. Il test funzionale verifica la sequenza 28 s, 16 s, 16 s e il rifiuto del quarto passaggio. In Immersive Mode resta il precedente limite specifico. Cambio traccia e annullamento conservano i controlli di generazione e l’interruzione del download.

| Benchmark fisso, 590 parole | Prima | Dopo il recupero |
|---|---:|---:|
| Parole accettate acusticamente | 135 (22,88%) | 160 (27,12%) |
| Errore mediano inizio | 57,71 ms | 55,19 ms |
| Errore mediano fine | 67,90 ms | 65,77 ms |
| Errore p95 inizio | 202,77 ms | 201,30 ms |
| Errore p95 fine | 228,39 ms | 216,25 ms |
| Rap denso | 40/215 | 62/215 |
| Frasi ripetute | 77/273 | 80/273 |
| Canto rapido | 18/69 | 18/69 |
| Canto sparso | 0/33 | 0/33 |

Il solo contesto corto perdeva copertura (122/590): non è stato sostituito al passaggio originale. Il guadagno 135→160 deriva da osservazioni aggiuntive conservate dal salvataggio reale, senza abbassare i matcher completi o parziali.

Controllo indipendente, scelto alfabeticamente prima di osservare l’ASR e disgiunto dai cinque brani di sviluppo: **Avercage – Embers** (inglese) e **Confession – Quesabe** (francese). Risultato **10/150→10/150**; rap 10/105, canto 0/45. Nessun miglioramento dimostrato su questo campione. Riferimenti e audio sono vincolati a revisione e hash; parole stimate escluse.

Sono misure CPU sul modello fissato, con ancoraggi di frase umani per isolare l’errore delle parole. Non dimostrano precisione italiana, prestazioni WebGPU identiche su iPhone o allineamento completo di testi LRC già sfasati. Le contrazioni italiane sono coperte da test funzionali, non da un nuovo benchmark italiano registrato.

**Verifiche e limitazioni.** Suite locale completa: **627/627**, zero falliti. Otto test Python dell’analisi strutturale superati. I 103 rendering indicizzati comprendono anche file storici non più autorizzati dalle nuove protezioni: il loro numero non è il numero dei mix attivi. Chromium ha decodificato 103/103 a 48 e 44,1 kHz, verificando handoff nativo, seek, mute/unmute, vero pianificatore e casuale senza coda manuale.

I primi test browser falliti chiamavano il lettore prima che il profilo fosse pronto; il test definitivo attende la vera libreria e usa ricerca e riga del brano con gesti reali. Non sono state rimosse le asserzioni sul casuale o sul mix completo.

Le prove WebKit automatizzate sono distinte da Safari/PWA su iPhone fisico. Restano da verificare sul dispositivo blocco schermo, ritorno da sospensione, gestione reale della sessione audio, pressione di memoria e continuità dei mix nelle normali sessioni lunghe. Serve ascolto umano dei campioni per valutare energia del basso, timbro del time-stretch, eventuale pompaggio e naturalezza delle sovrapposizioni, soprattutto quella di 13,789 s.

Il confronto non distruttivo con `origin/main` segnala ancora un solo conflitto: **dj-deep-analysis.json**. È stato ispezionato con `git merge-tree`; nessun merge, rebase, risoluzione per sovrascrittura o modifica di main.

**Riproducibilità.** I JSON allegati riportano scenari, inventari, sorgenti SHA, cue e prove post-rendering. Comandi principali:

```powershell
node --test tests/*.test.cjs
python tools/test-dj-whole-structure.py
node tools/dj-equivalence-audit.cjs --output=pairs.json
node tools/simulate-library-listening.cjs --output=listening.json
node tools/simulate-library-listening.cjs --inventory-audit=pairs.json --inventory-only=true --output=inventory.json
python tools/fetch-karaoke-references.py --split=holdout --output=references-holdout
```

Per l’ASR: `tools/benchmark-karaoke-acoustic.mjs` confronta `--asr-chunk-seconds=28` e `14`, mantenendo la stessa finestra di riferimento e lo stesso denominatore. `tools/benchmark-karaoke-context-replay.cjs` rigioca entrambe le osservazioni con la proprietà dei nuclei e il salvataggio vero dell’app.

**Commit e workflow.** Codice del karaoke: `27d7fd264df458a05e8f3c88c01283cf2905f79d`; integrazione finale delle prove e dei test: `3ce1003213b38e73a45b2a8ec17ee4699013dd6f` e successivi commit delle verifiche. Le verifiche remote sono registrate in `workflow-proof.json` con il commit effettivamente esaminato.

- [Karaoke and DJ regression checks](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43615742516): success, commit `e7a5d54f`.

- [Common PCM mix Chromium and WebKit playback](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43615742920): success, commit `e7a5d54f`.

- [Immersive Mode Chromium layout and controls](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612839814): success, commit `3ce10032`.

- [Desktop DJ Chromium playback smoke](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612831929): success, commit `3ce10032`.

- [Music Box - exhaustive Mixa pair audit](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612819700): success, commit `3ce10032`.

- [iPhone DJ WebKit foreground smoke](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612810977): success, commit `3ce10032`.

- [Volume precision tests](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612791257): success, commit `3ce10032`.

- [Music Box DJ independent raw-audio audit](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612791270): success, commit `3ce10032`.

- [DJ Mix regression tests](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43612791254): success, commit `3ce10032`.

- [Music Box title display and original metadata regression](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43603559168): success, commit `27d7fd26`.

- [Internal musical windows and common PCM rendering](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43560889412): success, commit `365318dc`.

- [Full transition PCM feature extraction](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43533181201): success, commit `564489a7`.

- [Music Box - Audit indipendente audio reale DJ](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43533177128): success, commit `564489a7`.

**Confronto con il checkpoint esatto di ripresa.** Rigiocando il codice e l’indice di `5eaaa6f6`: due completi e due disponibili Safari; ora nove completi (sette coppie audio distinte). Le coppie nelle librerie erano Ste 0, Diego 1, Emanuele 1; ora 0, 2, 5. Nelle sessioni casuali del checkpoint: Ste 0/800, Diego 7/800, Emanuele 0/800; ora 0/800, 9/800, 40/800. Questa distingue gli avanzamenti già contenuti nel commit di ripresa dai progressi successivi.

Il limite dei primi quattro secondi per proporre battute iniziali era una restrizione del generatore, non una certificazione musicale. È stato portato a otto secondi conservando ingresso a zero e tutti i controlli. Due nuove geometrie sono state renderizzate: una respinta per ritmo, una nuova coppia (745→694) accettata a 48 e 44,1 kHz. Non vengono sommate le varianti come coppie.

La tabella principale usa gli MP3 originali. È stata ripetuta anche la Gym con la vera funzione `_urlDelBrano` dell’app e il manifesto pubblico dei bassi vincolato a SHA: 24/24 brani effettivamente potenziati, zero analisi mancanti, 0/460 completi sia al checkpoint sia dopo. Dopo: 428 normali, 31 postlude, 1 underlay. Il limite nelle playlist reali resta quindi evidente anche considerando il file realmente scelto dall’app. Il manifesto è una fotografia verificata, non lo stato di cache del telefono.

Il workflow DJ inizialmente fallito ora supera **565/565** test. La suite completa remota in WebKit supera **627/627**, come quella locale. Il workflow audio finale `43615742920` verifica 103/103 decodifiche a 48 kHz e 103/103 a 44,1 kHz per ciascun browser, con vero handoff di una transizione preservata con time-stretch e scelta casuale completa nello stesso profilo. I run precedenti `43612798697` e `43615185359` hanno avuto complessivamente tre timeout WebKit all’avvio dalla libreria, dopo decodifica e handoff riusciti. La diagnostica conservata in `browser-start-failure.json` mostra nessun brano selezionato e nessuna sorgente assegnata: il gesto non aveva avviato il lettore. Il commit di test `e7a5d54f` attende il completamento del filtro della ricerca, che sostituisce le righe dopo 160 ms, e tocca il testo del titolo. Nessuna modifica al lettore, chiamata forzata a play o rimozione delle asserzioni; esito e ripetizione separata WebKit restano registrati nelle prove. Questa correzione della sincronizzazione del test non certifica stabilità su iPhone fisico.

I massimi di 40 cambi senza completo sono limitati alle sessioni simulate di 40 cambi: non garantiscono un limite massimo nelle sessioni più lunghe. I fallback sicuri non sono stati promossi a beatmatch per abbreviare artificialmente queste serie.

Le mediane del karaoke descrivono solo le parole accettate, e l’insieme accettato cambia fra prima e dopo: non misurano l’errore su tutte le 590 parole né un confronto appaiato della sola precisione. Il campione indipendente non mostra progressi e manca ancora un riferimento italiano registrato. Nei quattordici scenari due cambi incontrano analisi mancanti: restano fallback senza certificazione, dichiarati nel JSON.

Dopo la correzione della sincronizzazione del test, il job WebKit del run `43615742920` passa sia al primo tentativo sia nella ripetizione separata (tentativo 2). Chromium passa nello stesso workflow. I tredici tipi di workflow controllati hanno ultimo esito positivo, con commit individuali registrati in `workflow-proof.json`; non si pretende che tutti siano stati rieseguiti sul commit dei soli audit.

Per ripetere il controllo delle proposte storiche rimosse dall’indice attivo: `node tools/audit-content-cuts.cjs --archive-index=audits/profile-coverage-20261114/archived-cut-cues.json --output=content-cuts.json`. L’archivio contiene solo geometrie vincolate alle sorgenti SHA ed è esplicitamente escluso dalla riproduzione.

**Campioni da ascoltare.** I FLAC sono gli esatti buffer comuni del lettore; i campioni MP3 locali sono copie di ascolto, con picchi ricostruiti a 192 kHz inferiori a 1. L’estratto contiene circa 0,3 s di pre-roll e la transizione, non l’intera canzone.

- [Stanza → DAVVERODAVVERO](../../dj-mixes/977070a8972bdbd9dfe2a9c9da87e47f030536eb70361b70fbbb887eee294b66.flac)

- [The Real Slim Shady → NON METTERCI BECCO](../../dj-mixes/2188057c318a4c72c35ef9ea1ecea53e904efe400c7db00ae4bbf1465341098e.flac)

- [Safe And Sound → Con il nastro rosa](../../dj-mixes/244126aad52154dc707b4c5815cc3241cfc7d9645770192a29cefd8b11d7a048.flac)

- [Un nuovo bacio → OGNI AMICO MIO](../../dj-mixes/2946cdafd2b1f6b07bb825d12f387c40eea077867e23431e94c13d5421670ab0.flac)
