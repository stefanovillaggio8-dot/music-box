# Ste: una nuova coppia ritmica distinta, librerie isolate e verifiche audio

Baseline: `c0cac34523c904693a2e4adeb783fa9a8c8e878f`. Il nuovo percorso metrico nasce in `4aa68042`; il ritorno alla fase originale viene corretto in `f8cbb833`, il clock MP3 in `06154797`. Le ricevute native definitive Linux/macOS sono installate in `4428b63c`. Commit e workflow definitivi sono nel [registro](verification.json). PR #59 in bozza; nessun merge, modifica a main o pubblicazione.

**È disponibile un nuovo raccordo parziale Ste: Modà, Passione maledetta → Non ti dimentico.** Le coppie ritmiche distinte selezionabili passano da due a tre: un completo e due parziali. I completi Ste rimangono uno. Questo aggiunge un'opportunità diversa da Djo → Grignani; il salto di copertura richiesto rimane ancora insufficiente. Nessuna equivalenza a Spotify Mixa è dimostrata.

## Appartenenze e isolamento

Il campione resta quello dei 227 titoli personali Ste, con gli stessi ID prima e dopo. La playlist esclusa dall'utente non entra in ottimizzazione o confronti e non è modificata. Le copie già aggiunte esplicitamente restano appartenenti alla libreria anche se il catalogo conserva il profilo del caricamento originale. I due Modà sono effettivi membri Ste.

Sono corretti due errori riproducibili: il fallback al catalogo caricato quando `visibleTracks(true)` falliva e il mancato ricontrollo del pool per una scelta DJ già nell'anteprima dopo un'analisi asincrona. Ora il primo restituisce una lista vuota e ogni promozione verifica di nuovo il pool corrente. Un indice scaduto non può ripiegare su `tracks[indice]`.

I test eseguono le vere funzioni dell'app per Ste, Diego ed Emanuele, copie esplicite, brani esclusivamente altrui, sorgenti di stanza, filtro scaricati, preferiti, ricerca e non ascoltati. Code manuali e stanze conservano i propri percorsi; il DJ personale non le riordina. Sono riproduzioni delle condizioni errate, non la prova che sul telefono sia già stata ascoltata una canzone estranea. Ogni tentativo delle simulazioni controlla entrambi gli ID contro il pool: **zero tentativi esterni**. [Impronte e protezione dei dati](source-proof.json).

## Disponibilità reale e simulazioni

| Libreria personale | Completi prima → dopo | Parziali selezionati prima → dopo | Coppie ritmiche distinte prima → dopo |
|---|---:|---:|---:|
| Ste | **1 → 1** | **1 → 2** | **2 → 3** |
| Diego | 2 → 2 | 0 → 0 | 2 → 2 |
| Emanuele | 7 → 7 | 5 → 5 | 12 → 12 |

L'alternativa parziale precedente di Djo → Grignani resta conservata e valida, ma non si conta due volte la stessa coppia quando il selettore preferisce il completo. Nessuna canzone viene aggiunta o spostata. [Inventario verificato](personal-availability.json).

| Ste, stesso seed e stesso scenario prima/dopo | Completi | Parziali | Crossfade | Normali | Postlude | Underlay |
|---|---:|---:|---:|---:|---:|---:|
| 20 sessioni da 40 cambi, prima | 18 | 0 | 32 | 336 | 108 | 306 |
| 20 sessioni da 40 cambi, dopo | 18 | **20** | 46 | 314 | 131 | 271 |
| Una sessione continua da 800 cambi, prima | 4 | 3 | 26 | 548 | 105 | 114 |
| Una sessione continua da 800 cambi, dopo | 4 | **7** | 28 | 548 | 108 | 105 |

La nuova coppia viene utilizzata venti volte nello scenario breve e quattro in quello continuo. Non è soltanto un candidato nell'audit: questi conteggi provengono dal selettore e dal planner reali, con le condizioni Safari per i buffer comuni.

**18/800 e 4/800 misurano scenari differenti.** Il primo ricomincia ogni sessione con un pool fresco; il nuovo `--continuous-shuffle=true` mantiene la storia per 800 cambi e rinnova il ciclo soltanto dopo aver esaurito la libreria, come l'app. Nessuno dei due ricostruisce la storia effettiva del telefono prima dell'inizio della prova. La baseline continua è stata rieseguita anche con l'indice originale esplicito.

Nel continuo la frequenza ritmica complessiva passa da 7/800 a **11/800**: completi invariati allo 0,50%, parziali dallo 0,375% allo 0,875%. La massima sequenza senza completo o parziale scende da **210 a 206**; senza completo rimane 229. Nelle sessioni brevi scende da 40 a 37, mentre quella senza completo resta 40. La scarsa frequenza nell'ascolto lungo rimane evidente.

Durata media dei completi continua 10,777 s; dei parziali 7,250 → 8,815 s. Il nuovo raccordo dura 9,988 s: il suo ingresso metrico compare nella parte finale, dopo circa sei secondi di introduzione originale conservata. Inizi dell'overlap almeno otto secondi prima dell'EOF: 39 → 65 nel breve, 25 → 28 nel continuo; comprendono altre classi e non certificano un taglio strutturale anticipato. Uscite che eliminano contenuto restante e secondi omessi in ingresso: zero.

Ordine normale: zero completi su 226 cambi; coda manuale: zero su 40; shuffle offline sintetico: zero su 800, tutti invariati. Lo scenario offline usa un manifesto MP3 al 50%, senza buffer comuni preparati: non misura i download sul telefono. Non si alterano le code per migliorare i numeri. [Tutte le modalità, ID ammessi, coppie distinte e confronti](listening-comparison.json).


Diego ed Emanuele conservano esattamente i risultati con stessi ID, seed e modalità: nel breve Diego 21 completi / 0 parziali, Emanuele 79 / 23; nel continuo Diego 8 / 0, Emanuele 9 / 4. Questi scenari partono da storia vuota e sono diversi dalle simulazioni dei checkpoint più vecchi. Il JSON confronta anche crossfade, passaggi normali, sequenze senza mix e sovrapposizioni per entrambe le librerie.

## Causa del falso negativo e modifica generalizzabile

Il validatore metrico controllava le ancore rispetto ai tempi di fase del modello, anche dopo che il produttore aveva già trovato e confrontato i corrispondenti attacchi nel PCM originale. Nel nuovo caso uno scarto di circa 60 ms dal riferimento del modello faceva perdere la prova; i colpi delle due registrazioni erano invece molto più vicini fra loro.

Il nuovo `observedBarMetricalFit` conserva separatamente i tempi del modello e usa le ancore già osservate, entro il limite di ricerca esistente di 75 ms. Restano obbligatori: confidenza di fase almeno 0,8; griglia del modello RMS ≤25 ms e massimo ≤50 ms; almeno **otto attacchi reali condivisi**, almeno due per battuta, RMS condivisa ≤20 ms; downbeat osservati fra le due registrazioni RMS ≤25 ms e massimo ≤50 ms; attacchi forti nel PCM. Non vengono interpolati colpi assenti.

Il produttore può considerare una prima frase metrica più tarda mantenendo **tutta l'introduzione dall'istante zero**. La classe resta parziale: nell'intero overlap si associano otto colpi su venti uscenti e nove entranti, con i colpi comuni concentrati nella parte finale. Il 40% globale non diventa un beatmatch completo. Le soglie dei completi, compreso l'accordo ≥90%, restano invariate. La logica non contiene eccezioni per Ste, titolo o artista.

Il nuovo percorso richiede anche ricevute native di entrambi i browser e frequenze, controllo del FLAC riscampionato, protezioni vocali e armoniche sull'intero overlap e continuità RMS all'EOF entro 3 dB. Senza quelle prove il lettore rifiuta il piano. Non viene distribuito un modello nuovo sul telefono.

## Audio originale e qualità misurata

| Nuovo parziale Ste | Risultato |
|---|---:|
| Uscente, inizio → EOF | 219,018733 → 229,007 s |
| Sovrapposizione / ingresso del nuovo originale | 9,988267 s / 0 s |
| Tempo entrante con SoundTouch | 1,041237, pitch preservato |
| Colpi condivisi / per battuta | 8 / 4 e 4 |
| RMS dei colpi dopo rendering | **10,26 ms** |
| RMS / massimo downbeat dopo rendering | **8,21 / 11,61 ms** |
| Picco campionato / true peak 4× a 48 kHz | 0,997158 / **0,998009** |
| True peak dell'overlap a 48 / 44,1 kHz | 0,949060 / 0,953343 |
| Attenuazione condivisa massima / media | 1,567 / 0,430 dB |
| Variazione RMS attorno all'EOF, finestre da 0,5 s | **−0,528 dB** |

Il primo rendering lasciava salire l'entrante da 0,33 a 1 in circa 0,55 s dopo l'EOF e mostrava +3,9 dB nella misura di continuità. La nuova classe usa una rivelazione graduale di 1,5 s, completata prima dell'adozione nativa. Il finale uscente rimane a guadagno relativo unitario attraverso l'ultimo campione decodificato; soltanto il controllo comune contro i picchi interessa entrambe le sorgenti. I vecchi inviluppi mantengono il comportamento precedente.

La prima prova a 44,1 kHz superava il limite dell'overlap (0,963378 contro 0,961). Il limite non è stato alzato: è stato abbassato da 0,96 a 0,95 l'obiettivo di rendering, ripetendo le verifiche. Il FLAC finale passa a 48 kHz e nel ricampionamento effettivo a 44,1; i decoder nativi Chromium/WebKit vengono controllati separatamente su Linux e macOS. Il ricampionamento non è un secondo rendering SoundTouch.

L'intero ingresso risulta strumentale nell'evidenza Spleeter, con picco RMS vocale 0,000553 e rapporto 0,003739; il primo riferimento LRC è a 11,85 s dell'entrante. L'armonia locale indica 10A → 10B con confidenza 0,830 e i limiti di dissonanza rispettati. Sono evidenze automatiche, non certificazioni umane di voce, tonalità o sezioni. Potenza percepita del basso e gradevolezza richiedono ascolto. [Rendering accettato, tentativi e ricevute](accepted-partial.json).


### Ritorno al PCM originale e clock MP3

La prima versione conservava una differenza di fase WSOLA prima del ritorno nativo: nella preview ricostruita il salto campionato arrivava a circa 0,629. Ripristinare l'originale con 350 ms di crossfade eliminava quel salto ma provocava cancellazioni fino a −7,08 dB. Quel prototipo resta scartato.

La versione finale sceglie offline un raccordo **di 20 ms**, fra EOF+0,85 e EOF+1,10, soltanto dopo il ritorno al tempo nativo. Confronta i campioni simultanei reali in una finestra circostante di 100 ms: rapporto di energia 0,926730, equivalente a −0,330 dB rispetto alla potenza dei componenti indipendenti nello stesso inviluppo. Questo misura la cancellazione aggiuntiva, non la sonorità musicale assoluta. Il limite è 0,85, senza aumento di guadagno. Il segmento finale di 100 ms riproduce l'originale entro 1,18×10⁻⁷ dopo la codifica. La misura vocale copre anche l'intera possibile regione del raccordo con 300 ms di margine: fino a 11,817680 s, prima del primo LRC a 11,85 s.

È emersa inoltre una differenza reale del decoder Linux: WebKit esponeva 209,664 s, conservando i 1.105 campioni iniziali e 1.096 finali di padding dichiarati nell'MP3 a 48 kHz; il PCM senza padding dura 209,618146 s. Il confronto allo stesso numero di secondi produceva una correlazione di circa 0,68. La ricerca diagnostica di un lag non viene accettata per certificare il mix.

Il nuovo percorso converte invece il clock nativo usando **solo SHA, priming/padding del contenitore e durata effettiva**. Con durata senza padding usa offset zero; con quella completa usa 1.105/48.000 s; con durata sconosciuta o ambigua rifiuta il mix. La stessa conversione guida l'inizio del buffer e il seek del successore, prima di renderlo udibile. Le soglie restano correlazione ≥0,99 ed errore RMS relativo ≤0,10. Dopo la correzione, il minimo fra i decoder e le piattaforme è 0,999710 a 44,1 kHz (errore relativo massimo 0,024085); a 48 kHz è 0,999999999 (0,000046). Sono confronti di PCM decodificato e clock nativo verificato, non una certificazione del jitter del seek fisico.

Il FLAC finale è `dj-mixes/6b4c71156b309b4322f251c87186b549c741f7b1bd54658ce70fc42d3d6de9cc.flac`, 2.543.862 byte. Una nuova esecuzione completa del produttore e del renderer riproduce la stessa impronta e gli stessi metadati. Due prototipi introdotti in questa PR non pubblicata sono archiviati fuori dal prodotto; nessun MP3 o download utente viene rimosso. La preview locale include otto secondi del finale precedente e sei del successivo: usa −1,159 dB uniformi soltanto per l'ascolto, poiché il master originale del preambolo supera già uno. Non rappresenta un'attenuazione aggiunta dal lettore. [Diagnosi del clock](mp3-clock-diagnosis.json), [preview e limiti](audio-preview-proof.json).

## Esperimenti scartati e riferimenti di ascolto

Sono conservate anche le strategie precedenti senza nuove coppie: silenzi iniziali misurati sui 227 originali stereo; tempo ripartito su due brani entro ±5% ciascuno; tempo locale dagli attacchi; secondo Beat This `final1` su 48 brani congelati prima dell'inferenza e consenso fra modelli; suddivisioni osservate; combinazioni di finestre metriche e code preservate; finale percussivo simmetrico all'intro percussiva. Il secondo modello porta le finestre che raggiungono il controllo dei colpi da 291 a 644 senza nuove transizioni e resta fuori dal prodotto. [Campione](model-sample.json), [risultati negativi e nuova strategia separata](experiments-summary.json), [riproduzione](reproduction.md).

Quattro proposte complete scartate sono state renderizzate per ascolto locale. Restano rifiutate come complete: accordo globale degli attacchi fra 38% e 68%, oppure precisione insufficiente. Il vecchio campione Passione maledetta → Non ti dimentico usava riferimenti di battuta del modello e mostrava anche oltre 82 ms di errore; la successiva prova usa le ancore osservate e viene accettata esclusivamente come parziale. Le due prove non certificano la stessa classe o lo stesso insieme di riferimenti. [Scarti originali](rejected-render-proof.json), [diagnostica](partial-diagnosis.json).

Nel funnel personale di 51.292 coppie, il primo rifiuto è assenza di battute terminali coerenti in 29.598 casi, intro in 8.034, metro/tempo in 13.618, voce in 32, armonia in 8 e fit indipendente in uno. L'ordine dei controlli influenza questi conteggi: non sono 29.598 incompatibilità musicali dimostrate. La diagnostica aggiuntiva distingue 12.647 rifiuti BPM e 967 di metro/durata; i controlli sulle finestre sono non esclusivi. Il collo di bottiglia generale resta: molte registrazioni non forniscono battute terminali/inziali sufficientemente affidabili, introduzioni ritmiche compatibili o abbastanza colpi condivisi. Non si possono considerare automaticamente tutte queste esclusioni falsi negativi. L'audit di regressione completo è stato rieseguito dopo il nuovo percorso su **1.381.800 coppie**, conservando tutti i completi precedenti; i confronti di miglioramento restano personali. [Regressione](pair-regression.json), [funnel personale e condizioni](personal-candidate-funnel.json).

## Karaoke, regressioni e limiti

Karaoke preservato: precedente benchmark offline **192/590**, holdout **9/96**, campione nuovo congelato **0/78**. Nessuna nuova precisione acustica viene dichiarata o rieseguita per un codice di allineamento rimasto identico. Resta irrisolta la generalizzazione e il massimo errore precedente; le regressioni su testo, seek e cambio brano continuano a essere verificate.

Suite completa aggiornata **723/723**, DJ **659/659**. Le matrici reali del nuovo parziale su Linux e macOS Intel passano entrambe **7/7**, compresi lettore e shuffle Ste in entrambi i browser. Passano inoltre struttura Python 8/8, protezione code 4/4, finestre MP3 1/1 e confini karaoke 3/3; il registro mantiene i numeri effettivi e i controlli finali Chromium/integrità. Il precedente tentativo macOS ARM ha due job annullati per mancata assegnazione del runner, con annotazioni di capacità GitHub: non viene presentato come test dell'app fallito o come 7/7. Il runner Intel è una scelta esplicita del workflow, con le stesse asserzioni. [Registro e stato esatto](verification.json), [lettore/shuffle Linux](browser-new-partial-linux.json), [lettore/shuffle macOS](browser-new-partial-macos.json).

Download, playlist, preferiti, dati personali, originali MP3 e versione pubblica sono preservati. Nessuna misura di spazio risparmiato sul telefono di Diego; nessun rallentamento generale iPhone confermato. Rimangono necessari ascolto umano e Safari/PWA su iPhone fisico. Il conflitto con main resta aperto senza merge. Il progresso è una nuova coppia parziale concretamente utilizzata; i completi Ste e la varietà complessiva restano lontani dall'obiettivo finale.
