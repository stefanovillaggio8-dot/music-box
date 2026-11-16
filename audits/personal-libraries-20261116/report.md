# Librerie personali: primo completo Ste, verifica acustica e limiti ancora aperti

Aggiornamento successivo alla baseline `c0cac345`: [sviluppo mirato Ste, isolamento account e simulazione continua](../ste-focus-20261116/report.md). Questo rapporto conserva il confronto storico del primo completo Ste.

Baseline richiesta e verificata: `d1c848945bcece0dd448c1e3f28809a1550e8d33`. Implementazione prodotto verificata: `72907e26018a92022d7d23431b21c175bc1a936b`. Include il recupero dei metadati WebKit/Linux e le protezioni del clock nel lettore; nessun MP3 originale viene riscritto. PR #59 in bozza; nessun merge o pubblicazione.

Il risultato è **un completo realmente riprodotto in Ste**, ottenuto sulla coppia già disponibile come raccordo parziale. Non è ancora il salto di copertura richiesto: nelle simulazioni cambia la qualità di quei passaggi, mentre il numero totale di raccordi ritmici non aumenta. Diego ed Emanuele mantengono i risultati precedenti. Nessuna equivalenza a Spotify Mixa è dimostrata.

## Appartenenze e disponibilità reali

Solo librerie personali, senza modificare appartenenze o impostazioni. La playlist esclusa dall'utente non viene ottimizzata né inclusa nei confronti. Il selettore dell'app, le copie pubblicate e le registrazioni originali determinano il campione: Ste 227, Diego 212, Emanuele 621 titoli, di cui 620 analizzabili e uno senza analisi.

| Libreria | Completi prima | Completi dopo | Parziali selezionati prima | Parziali selezionati dopo |
|---|---:|---:|---:|---:|
| Ste | 0 | **1** | 2 | 1 |
| Diego | 2 | 2 | 0 | 0 |
| Emanuele | 7 | 7 | 5 | 5 |

La coppia **Djo, End of Beginning → Gianluca Grignani, la mia storia tra le dita** appartiene già alla libreria personale Ste. La copia Djo mantiene nel catalogo il profilo d'origine Emanuele: non è stata aggiunta ora. Il vecchio test browser confondeva quel campo con l'appartenenza attiva e scartava la coppia prima di provarla. Ora verifica `MusicBoxBridge.playable()`, come la libreria effettivamente visibile; il caso storico Ste resta esplicitamente vincolato alla sua coppia originale.

Il parziale precedente Djo → Grignani rimane nel catalogo e supera ancora il suo validatore. Il selettore preferisce il nuovo completo: per questo i parziali selezionati Ste passano da due a uno. Non si contano due volte completo e sua alternativa parziale. Gli undici completi precedenti restano completi nel test di regressione; l'audit integrale di 1.381.800 coppie è stato eseguito nuovamente, non riutilizzato.

Dati: [disponibilità personali](personal-availability.json), [confronto delle simulazioni](personal-listening-comparison.json).

## Cause e interventi strutturali

Il produttore è stato rieseguito sulle tre librerie prima e dopo. Sono esclusioni per primo ostacolo incontrato, non incompatibilità musicali annotate da una persona. I conteggi delle finestre sono separati e non vanno sommati a quelli delle coppie.

| Primo ostacolo nel produttore | Ste | Diego | Emanuele |
|---|---:|---:|---:|
| Coppie ordinate considerate | 51.292 | 44.732 | 383.772 |
| Nessuna battuta finale coerente | 29.598 | 19.201 | 117.606 |
| Nessuna battuta iniziale coerente | 8.034 | 8.555 | 91.887 |
| Metrica, tempo o estensione non compatibili | 12.180 | 15.312 | 155.032 |
| Voce o LRC in ingresso | 1.163 | 1.454 | 16.319 |
| Armonia locale | 305 | 207 | 2.839 |
| Fit indipendente dei colpi fallito, dopo gli altri filtri | 10 | 1 | 71 |

Per Ste il gruppo metrica/tempo comprende 10.825 rifiuti BPM, 967 metrica/estensione, 193 durata, 57 downbeat osservato e 138 fit dei downbeat. Non sono 12.180 rifiuti esclusivamente BPM. La mancanza di battute terminali può derivare sia da finali effettivamente privi di batteria o variabili sia da limiti del modello: questi dati non consentono di dichiarare tutti quei casi falsi negativi.

Tre interventi generalizzabili, senza eccezioni basate su titolo o artista:

1. **Separazione tra segnale ritmico e suffisso esattamente nullo.** Djo termina con circa 0,853 secondi di zero numerico in entrambi i canali originali a 44,1 e 48 kHz. Contare i beat della nuova canzone contro quel segnale assente produceva un falso negativo. Il nuovo percorso verifica tutti i colpi udibili e controlla separatamente lo zero esatto, legato agli hash MP3/PCM e alle due frequenze. Non viene tagliato il file. Un decadimento debole ma non nullo continua a essere parziale. Il renderer ricontrolla gli originali senza applicare il guadagno alla prova di silenzio; un valore non nullo anche minuscolo viene rifiutato.
2. **Budget delle finestre di rendering.** Quattro candidati parziali con RMS leggermente migliore potevano occupare tutti gli slot, eliminando il candidato completo già verificato sul PCM. Lo shortlist conserva ora il migliore completo prima delle altre alternative. Questo non certifica il rendering e non trasforma un parziale in completo.
3. **Profilo SoundTouch esplicito e limitato.** Il profilo automatico falliva la verifica temporale della chitarra entrante: correlazione 0,437 sotto il limite 0,45. Tra quattro profili provati, viene conservato il meno aggressivo profilo esplicito 60/12/8 ms, con risultato 0,542. È vincolato a cue, worker e cache; l'automatico precedente resta il default. La prova offline può tentare soltanto default e questo secondo profilo, per ingressi interamente strumentali già verificati, ripetendo tutti i controlli. Non vengono ridotte le soglie o cambiati pitch/rate per simulare il tempo.

Il campione esteso include 62 originali in uscita che raggiungevano il controllo dei colpi nelle tre librerie: 19 hanno un suffisso esattamente nullo entro i limiti, 43 no. Applicando la stessa strategia a tutti, rimane **una sola nuova coppia completa da renderizzare**, Ste; nessuna nuova coppia Diego/Emanuele. Il risultato negativo è conservato, senza adattare i criteri ai due profili.

Le prove di livelli metrici dimezzati/raddoppiati su 417 quasi-corrispondenze BPM Ste e di curve di tempo variabile vincolate non hanno prodotto nuovi candidati sicuri. Non sono installate nel lettore. Non è giustificato allargare i limiti soltanto per aumentare i contatori. Una prova successiva Ste porta il limite di ricerca iniziale da 8 a 16 secondi: i rifiuti per assenza di battute iniziali scendono da 8.034 a 4.500, ma non nasce nessuna nuova coppia dopo gli altri controlli. Anche ammettendo candidati di due battute sotto 4,5 secondi, mantenendo otto colpi reali e i limiti di precisione, nessuna delle tre librerie produce nuove coppie. Queste modifiche alla geometria dei candidati non sono installate. [Prototipi senza guadagno utile](additional-rejected-prototypes.json). [Funnel completi](personal-rejection-funnels.json).

## Rendering, qualità e contenuto

| Misura della nuova transizione Ste | Risultato |
|---|---:|
| Inizio nel brano uscente | 148,524 s |
| Sovrapposizione fino al suo EOF | 10,777 s |
| Entrata del nuovo originale | 0 s |
| Tempo entrante | 1,01672, pitch preservato |
| Colpi reali associati | 12 su 13, 92,31% |
| RMS dei colpi dopo SoundTouch | **16,50 ms** |
| RMS dei downbeat dopo rendering | **5,80 ms**, due battute |
| Picco campionato del mix a 48 kHz | 0,984617 |
| True peak offline sovracampionato 4× | 0,997996 |
| Peggior picco nativo del nuovo asset, due frequenze/piattaforme | 0,986614 |
| Peggior picco nativo nell'overlap | 0,959291 |
| Attenuazione condivisa massima / media nell'overlap | 1,770 / 0,249 dB |
| Variazione RMS attorno all'EOF, finestre da 0,5 s | −0,533 dB |

Il primo prototipo lasciava il nuovo brano al 33% sino all'EOF e produceva +5,36 dB nella stessa misura RMS. La versione accettata usa il passaggio in primo piano già supportato, dopo il confine vocale controllato a 8,626 s nell'overlap; ricontrolla l'armonia al guadagno effettivo. Il brano uscente resta integro, a guadagno relativo unitario, dentro il controllo comune contro i picchi. Nessuna strofa o conclusione viene rimossa per ottenere il risultato.

L'analisi armonica locale indica 10B per entrambi, confidenza 0,735, con i limiti locali di dissonanza rispettati. È evidenza automatica, non un giudizio umano sulla gradevolezza. Battute, downbeat, frase conclusiva e voce sono ipotesi dei modelli corroborate acusticamente: non sezioni certificate manualmente. Non si dichiara dimostrata la potenza percepita del basso.

Il renderer verifica il segnale a 48 kHz e il risultato riscampionato a 44,1; i decoder Chromium e WebKit Linux/macOS sono misurati separatamente alle due frequenze. La prova nativa copre 16 asset per due frequenze, non 32 nuovi beatmatch. Le soglie dei picchi e la protezione del clipping rimangono quelle precedenti.

È disponibile un campione riproducibile con otto secondi dell'originale, segnale comune e ripresa dell'originale entrante. La sola anteprima è abbassata uniformemente di 1,099 dB: l'originale MP3 prima del mix mostra già un picco floating point 1,0992, mentre il mix resta entro i propri limiti. Questa attenuazione dell'anteprima non è un nuovo guadagno installato nel motore. Lo scarto nominale campione al passaggio nativo è 0,0084; il campione non simula il jitter del seek nativo fisico e non dimostra uno splice inaudibile. Ascolto umano necessario. [Prova anteprima](audio-preview-proof.json), [render accettato e tentativo automatico rifiutato](new-original-render.json).

## Ascolto quotidiano e code

Venti sessioni fresche di 40 cambi, stessi seed e codice realmente utilizzato dall'app, nessuna aggiunta ai profili. Il replay è una simulazione logica, distinta dalle prove browser dei decoder.

| Libreria, 800 cambi | Completi prima → dopo | Parziali prima → dopo | Crossfade prima → dopo | Normali prima → dopo | Altri raccordi prudenti prima → dopo |
|---|---:|---:|---:|---:|---:|
| Ste | 0 → **18** | 18 → 0 | 31 → 32 | 337 → 336 | 414 → 414 |
| Diego | 21 → 21 | 0 → 0 | 47 → 47 | 245 → 245 | 487 → 487 |
| Emanuele | 79 → 79 | 23 → 23 | 53 → 53 | 209 → 209 | 436 → 436 |

Gli altri raccordi sono postlude e underlay, non completi o crossfade. Durata media dei completi: Ste 10,777 s, Diego 7,291, Emanuele 9,241. Inizio dell'overlap prima della fine musicale stimata: Ste 21 → 39, Diego 64 invariato, Emanuele 237 invariato; questo comprende altre classi e **non** significa che venga eliminato il finale. Uscite anticipate che saltano il contenuto restante: zero. Ingresso omesso: zero.

La massima serie senza completo resta 40/40/30 cambi Ste/Diego/Emanuele entro queste sessioni: il problema della scarsa frequenza rimane. Nei percorsi ordinati e nelle code manuali simulati i completi restano zero; la coda manuale non viene modificata per migliorarli. Anche il sottoinsieme offline sintetico al 50%, senza i buffer comuni precaricati, resta a zero completi: non misura i download sul telefono degli utenti. Le dodici combinazioni profilo/modalità, durate e serie massime sono nel JSON del confronto.

## Karaoke: nuovo percorso offline, generalizzazione insufficiente

Whisper Base viene usato **solo offline e solo per corroborare separatori CTC già osservati**, dopo tutti i passaggi Tiny precedenti. Non fornisce direttamente tempi al lettore e non viene caricato sul telefono. Revisione, dtype e identità audio sono espliciti; il caricatore rifiuta prove con un corroboratore diverso. Il produttore ricarica gli intervalli già esportati anche fuori dalle finestre nuove e rifiuta l'esportazione se un intervallo accettato viene perso o spostato.

| Benchmark | Prima | Dopo |
|---|---:|---:|
| Principale, percorso offline valutato | 182/590 | **192/590** |
| Mediana inizio / fine, ms | 52,87 / 60,38 | 47,81 / 60,21 |
| p95 inizio / fine, ms | 199,61 / 216,25 | invariati |
| Massimo errore di fine principale | 904,57 ms | invariato |
| Precedente holdout finale | 9/96 | 9/96 |
| Trasferimento fresco già osservato | 33/110 | 33/110 |
| Due canzoni nuove, selezione congelata prima dell'inferenza | 0/78 | 0/78 |

Tutti gli intervalli già accettati nei confronti sono identici. Le dieci parole nuove sono rap; il loro massimo errore osservato di fine è 165,56 ms. Questo non risolve l'errore massimo precedente né dimostra generalizzazione. Per i nuovi brani con zero parole accettate l'errore è **non misurabile**, non zero millisecondi.

Le due registrazioni mai usate prima sono le prime inglesi residue in ordine alfabetico, Pure Mids e Moon I Mean, a selezione congelata prima delle inferenze. Nel dataset vincolato non sono presenti riferimenti italiani: non si dichiara una verifica italiana. Delle 78 parole, 55 non hanno nemmeno una corrispondenza lessicale vicina nei tre contesti Tiny; solo sette hanno almeno un'osservazione con entrambi i confini entro 100 ms. Due accordi fra contesti hanno comunque errori oltre 250 ms. È una diagnostica generosa con riferimenti umani, non un nuovo criterio di accettazione. [Selezione congelata](frozen-unseen-selection.json), [diagnostica indipendente](unseen-observation-diagnosis.json).

Il precomputo è stato eseguito anche sui tre originali personali Ste già selezionati, con 5/8/3 finestre. Conserva 107/9/67 parole, **nessuna nuova parola su quei tre MP3**: non vengono riscritti gli asset karaoke installati per presentare un guadagno inesistente. Il risultato 192/590 riguarda il benchmark del nuovo produttore offline, non dieci nuove parole certificate nelle canzoni personali dell'app. Una riesecuzione limitata alle prime due finestre Ste conserva ora tutte le 107 parole già esportate, comprese quelle esterne alla richiesta: prima una ricostruzione isolata di quelle finestre restituiva soltanto 48 parole. È protezione del precomputo, non nuova precisione vocale.

ASR sui vocali separati e ricomposizione di contrazioni osservate non hanno aggiunto parole attraverso i controlli esistenti; quei prototipi non sono installati. Una ulteriore prova CTC direttamente sul PCM originale, al posto della sola voce separata, arriva a 193/590 nel laboratorio e lascia il nuovo campione a 0/78; sui tre originali Ste recupera soltanto due osservazioni ulteriori nel primo brano. Il prototipo rimane fuori dal prodotto: non viene incluso nel totale accettato 192 né presentato come miglioramento generalizzato. Servono osservazioni vocali migliori, non timestamp interpolati o soglie più basse. [Confronto e preservazione](karaoke-comparison.json).

## Browser, dati e limiti

Il vecchio caso Ste parziale ha mostrato una durata nativa di circa 0,001–0,002 s con `readyState=4`, seek bloccato e mix non avviato. Il log GStreamer documenta sia un dispositivo audio Linux non disponibile sia interrogazioni della durata fallite. L'originale interessato manca dell'indice di conteggio dei frame; la sola disponibilità di un dispositivo virtuale non basta: il controllo ripetuto prima del recupero resta a 6/7. Sono problemi del percorso nativo e del runner, non un rifiuto musicale della coppia. Il metodo di raccolta usa le [variabili di debug documentate da GStreamer](https://gstreamer.freedesktop.org/documentation/gstreamer/running.html), con log separati per processo. [Diagnostica backend](linux-backend-diagnostics.json), [controllo ripetuto precedente](linux-repeated-before-recovery.json).

Il lettore ora rifiuta di pianificare o consumare la coda quando quel clock provvisorio sembra indicare l'EOF, conservando la gestione degli errori reali. Solo su Linux WebKit, dopo 600 ms di metadati ancora inutilizzabili, può costruire una rappresentazione MP3 in memoria con conteggio dei frame. Il percorso è generico; l'indice attuale abilita soltanto l'originale verificato. Controlla hash dell'intero originale e della rappresentazione, dimensioni e prove PCM. Il compilatore abilita una voce solo dopo identità campione per campione in Chromium e WebKit a entrambe le frequenze: **differenza massima zero in quattro confronti**, non una tolleranza acustica. [Ricevuta Chromium](native-metadata-chromium.json), [ricevuta WebKit](native-metadata-webkit.json), [procedura riproducibile](../../tools/README-native-metadata.md).

Il recupero è disattivato su iPhone, macOS, Android e Chromium. Il test della piattaforma considera anche `navigator.platform`: WebKit Linux espone uno user agent compatibile con Safari macOS. Nessuna analisi PCM o modello viene avviato nel browser. Una sola lettura aggiuntiva, al massimo 16 MiB e 12 s, è consentita per il tentativo sul brano problematico. Cambio sorgente e seek annullano il lavoro pendente; il background interrompe il lavoro facoltativo. Il Blob del brano corrente è rilasciato al cambio sorgente. Intento play/pausa, mute, volume, sorgente canonica e seek richiesto restano controllati dai normali handler. Nessuna scrittura in IndexedDB o Cache Storage e nessuna cancellazione di download.

La matrice Linux normale ora passa **7/7**, con ciascuna delle quattro prove lettore/browser/profilo ripetuta tre volte. In queste sessioni i metadati diventano validi e il recupero Blob è applicato **zero volte**: non si attribuisce il successo alla sua attivazione. Il nuovo completo Ste passa separatamente nella matrice Linux **7/7** e macOS **7/7**. I controlli mantengono sorgente originale, soglie, seek, shuffle e riconoscimento della coppia; nessuna opzione diagnostica cambia le fixture. [Linux ripetuto](browser-normal-legacy-linux-repeated.json), [completo Linux](browser-normal-complete-linux.json), [completo macOS](browser-normal-complete-macos.json).

Il ramo di recupero è verificato separatamente con il guasto dei metadati riprodotto esplicitamente nel test, mantenendo gli stessi byte HTTP originali. Il workflow ristretto passa **4/4** e registra **due recuperi effettivi**, sorgente canonica corretta, handoff e shuffle riusciti. Questo test dimostra l'esecuzione del recupero, non è una sessione normale né sostituisce la matrice 7/7. [Guasto riprodotto e recupero](browser-injected-metadata-fault.json). I vecchi controlli falliti, inclusa l'ipotesi dell'URL riutilizzato, restano documentati: [controllo negativo](url-reuse-negative-control.json). Non si dichiara eliminata ogni possibile intermittenza del backend.

Suite completa CI: **709/709**, suite DJ **646/646**, Python selezionati **15/15** (4 rendering, 3 CTC, 8 struttura). I dieci test del nuovo recupero comprendono annullamento, piattaforma, identità, limiti, rilascio dell'URL e rifiuto di ricevute incomplete o alterate. Lo smoke Chromium, quello WebKit, karaoke, volume e integrità sono verifiche separate; URL, commit ed esiti sono nel [registro](verification.json). Il programma logico del selettore, catalogo e appartenenze usati nelle simulazioni sono rimasti identici dopo le correzioni native; il playback è verificato separatamente: [confronto esatto](logical-listening-equivalence.json). I test WebKit desktop non sono una verifica di Safari/PWA su iPhone fisico.

L'app e la cache della shell includono il nuovo recupero e le protezioni del clock. Playlist, stato utenti, testi, versione pubblica e asset karaoke precedenti restano identici alla baseline; nessun MP3 originale è riscritto. I test reali dello storage verificano l'inventario in sola lettura. Non si cancellano cache o download. I circa 957 MB del catalogo Diego non spiegano automaticamente i 3,9 GB dei domini Safari: attribuzione, copie e spazio effettivo richiedono l'inventario sul suo dispositivo, separatamente da Safari e PWA. Non è stato misurato spazio risparmiato.

Il rallentamento generale iPhone resta non confermato. I test di cancellazione, background, seek, ripresa, clock e download continuano a passare; nessuna nuova diagnosi CPU/RAM del telefono viene dichiarata. Rimangono richiesti ascolto umano del mix, prova fisica iPhone, migliore riconoscimento su brani nuovi e ulteriori osservazioni per quantificare l'intermittenza nativa Linux fuori da questi test. La copertura musicale resta insufficiente: il singolo completo Ste e il benchmark karaoke non dimostrano il raggiungimento dell'obiettivo finale. Il conflitto con main resta aperto, senza merge o sovrascritture distruttive.
