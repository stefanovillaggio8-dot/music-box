**Music Box — pipeline corretta e copertura verificata, 14 novembre 2026**

Confronto con il commit richiesto `564489a713a417c3cb0a19d4c409272236b232ca`. Le modifiche successive sono preservate e salvate sulla PR #59. Il codice di riproduzione verificato è nel commit `2f236a1e`.

`build-musical-content.py` ora crea ricorsivamente la directory di destinazione prima di scrivere. La prova locale parte da una directory annidata inesistente e produce 1.176 record completi, legati alle SHA originali. Il workflow [43550766829](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43550766829) è terminato con successo: otto preparazioni, compilazione e rendering a 16 e 48 kHz. Delle 153 finestre candidate, 77 superano i controlli a 16 kHz e 73 a 48 kHz. Gli scarti rimangono scarti.

I risultati di produzione a 48 kHz sono **integrati nel motore**, con 84 segnali comuni attivi. Lo stesso rapporto può essere riapplicato senza cambiare un byte dell'indice: una diversa codifica dello stesso intervallo non genera duplicati. Nessuna finestra installata viola il controllo sull'intero contenuto del brano.

| Misura | Prima | Dopo |
|---|---:|---:|
| Registrazioni analizzate | 1.176 | 1.176 |
| Coppie ordinate analizzate | 1.381.800 | 1.381.800 |
| Coppie strutturali eleggibili prima del rendering | 190 | 190 |
| Beatmatch completi autorizzati | 33 | **51** |
| Completi utilizzabili con i controlli Safari | 27 | **45** |
| Anticipi strutturali di almeno 8 s rispetto al file | 14 | **23** |
| Raccordi metrici parziali, separati dai completi | 0 | **3** |
| Raccordi ritmici brevi, snap | 2 | 2 |
| Piani crossfade | 59.833 | 59.833 |
| Passaggi normali | 1.233.966 | 1.233.947 |
| Raccordi dopo il suono conclusivo | 85.579 | 85.578 |
| Sottofondi protetti | 2.358 | 2.357 |
| Sovrapposizione media dei completi | 9,98 s | 9,78 s |
| Completi entro lo stesso profilo, incluse varianti bassi | 15 | **15** |
| Parole accettate nel benchmark acustico | 135/590 | **135/590** |

Gli anticipi sono un sottoinsieme delle transizioni, non una categoria da sommare ai completi. Il totale globale cresce del 54,5% con ulteriori rendering verificati; **la disponibilità nelle librerie attuali non cresce**: Ste 7, Diego 1, Emanuele 7. Senza le varianti bassi i valori restano 6/1/7. Non sono stati copiati brani fra profili per aumentare questi numeri.

Le simulazioni usano gli stessi algoritmi reali, cataloghi, copie esplicite, cancellazioni e seed. In 6.460 cambi per versione: shuffle Ste 17 completi su 800, Gym shuffle 2 su 460, Diego ed Emanuele zero su 800 ciascuno, come prima. Le code manuali e l'ordine scelto sono rispettati. La copertura quotidiana rimane insufficiente per tutti i profili. Offline è simulato un manifesto dichiarato del 50% degli MP3, senza segnali comuni predecodificati: nessun beatmatch completo viene inventato da metadati privi dell'asset disponibile.

**Protezione musicale e qualità misurata.** Restano esclusi i 39 dei 46 vecchi tagli che saltavano contenuto non accettabile, compresi i casi da 128,48 e 92,52 secondi. Il controllo dell'intero brano verifica voce futura, testo disponibile, possibili cambi strutturali, energia residua e limiti di durata/proporzione. Il residuo udibile saltato dai 38 raccordi strutturali selezionati è mediamente 4,26 s, massimo 11,96 s. Le etichette di strofa, ritornello, solo e build non sono annotate umanamente: non vengono dichiarate certificate.

Sui rendering selezionati, errore ritmico RMS dei completi strutturali: media 20,08 ms, p95/massimo 34,05 ms. Per i tre metrici parziali: media 14,66 ms, massimo 16,27 ms. Picco massimo sovracampionato 0,99804; picco massimo della sovrapposizione 0,96000003. Il guadagno condiviso minimo resta 0,6623, circa −3,58 dB: può essere percepibile e non equivale a normalizzazione LUFS. Le 28 ulteriori prove con una rampa di ingresso da 0,6 s non recuperano altri rendering; le soglie non sono state abbassate. Non sono stati alterati gli MP3 originali o introdotti boost del basso che violino i limiti di picco.

**Riproduzione effettiva.** La diagnostica locale ha rilevato 85 ms di differenza nel clock del lettore nativo dopo il mute, con entrambi i lettori ancora in esecuzione. Quel clock silenziato annullava impropriamente un rendering comune già sincronizzato. Durante il segnale comune ora il tempo segue l'unico AudioContext che produce entrambe le tracce. L'avvio deve ancora rispettare il limite temporale; seek, pausa, cambio sorgente/velocità, sospensione e cambio coda annullano il passaggio. Il clock nativo entrante deve ancora coincidere con quello del rendering prima della riattivazione. I controlli di ritmo, clipping e contenuto restano invariati.

**Karaoke.** Il riconoscimento parziale ora gestisce una contrazione scritta come una parola quando l'ASR la divide in due token adiacenti: usa l'inizio e la fine realmente osservati, controlla la continuità e rifiuta occorrenze ripetute ambigue. Non divide un intervallo acustico fra parole mancanti. La correzione è integrata nel lettore e nella versione della cache; i tempi già accettati sono preservati. Sei test dedicati coprono prove parziali, contrazioni, pause, ripetizioni e parole senza tempo.

Il corpus corrente resta a 135/590, mediana assoluta inizio/fine 57,71/67,90 ms e p95 202,77/228,39 ms. Il tentativo con segmenti più brevi non risolve affidabilmente le due finestre Wordsmith. Un esperimento locale con [Whisper base timestamped](https://huggingface.co/onnx-community/whisper-base_timestamped), revisione fissata, riconosce 185 parole ma peggiora il p95 a 281,33/319,10 ms: **non è stato installato nel lettore né imposto ai telefoni**. Il corpus è inglese e usato durante lo sviluppo; non certifica accuratezza italiana o generalizzazione a tutto il catalogo.

**Verifiche.** Il workflow WebKit [43553094713](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43553094713) supera **614/614 test** sul codice aggiornato. [43553075739](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43553075739) verifica in Chromium e WebKit tutti gli 84 segnali a 48 e 44,1 kHz, passaggio reale tra tracce, mute, annullamento dopo seek e scelta automatica di un completo dal pool del profilo senza modificare la coda manuale. Dodici test mirati verificano anche il clock comune e l'annullamento dopo cambio velocità. L'audit locale completo e quello CI coincidono su tutte le coppie approvate, con zero errori di pianificazione.

Una prova locale molto concorrente aveva un falso fallimento nel test del worker bloccato: presumeva che decodifica e callback iniziali partissero entro 70 ms. Il test ora attende, entro un limite, l'esito osservabile della scadenza e mantiene tutte le verifiche su terminazione, rilascio delle risorse e backoff. Il timeout di produzione non cambia. Il caso mirato passa; la suite completa in CI passa.

File allegati: `music-box-confronto-pipeline-v3.json`, `music-box-audit-coppie-v3.json`, `music-box-simulazioni-v3.json`, `music-box-browser-v3.json`, `music-box-karaoke-v3.json` e `music-box-workflow-v3.json`. I dati comprendono limiti e risultati negativi.

Restano aperti: scarsità di uscite sufficientemente verificate nei profili, copertura karaoke bassa sul rap più difficile, mancanza di annotazioni semantiche e giudizi umani di ascolto, prove fisiche iPhone/PWA in background. La PR resta draft e presenta conflitti con main. Non sono stati effettuati merge, modifiche a main o pubblicazioni pubbliche; nessuna equivalenza a Spotify è dichiarata.
