# Music Box 6.735 — pubblicazione progressiva verificata

Pubblicata il 17 novembre 2026 tramite [PR #60](https://github.com/stefanovillaggio8-dot/music-box/pull/60). Commit di release `f07e9f29d552c2028207231882459aa637b018b9`; GitHub Pages completato e file pubblici confrontati byte per byte con quel commit. [App](https://stefanovillaggio8-dot.github.io/music-box/). `public-verification.json` conserva URL, impronte e risposte HTTP.

## Contenuto effettivo

È stato integrato il checkpoint verificato `1398fc71` della PR #59, più la scelta che prepara un completo futuro attraverso un postludio equivalente. Sono disponibili mix con tempo preservato, ritorno nativo verificato, protezione del contenuto originale e delle librerie personali; correzioni di seek, cancellazione e handoff; karaoke con evidenza acustica distinta dalle parole stimate, cambio traccia e Immersive Mode; inventario offline in sola lettura.

Gli esperimenti successivi sul raccordo di quattro battute e sul recupero del suo pre-roll NON sono pubblicati. La prova nominale Apple aveva fallito: quel candidato non viene contato tra le transizioni utilizzabili. La PR #59 resta aperta e in bozza, riallineata alla versione pubblicata, per continuare il lavoro.

| Misura Ste, stesso checkpoint di confronto della PR | Prima | 6.735 |
|---|---:|---:|
| Coppie complete distinte | 1 | 1 |
| Parziali distinti | 2 | 2 |
| Completi usati in 20×40 cambi | 18 | 20 |
| Parziali usati in 20×40 cambi | 20 | 20 |
| Frequenza ritmica | 4,75% | 5% |
| Completi/parziali in una sessione continua di 800 cambi | 4/7 | 4/7 |

È un confronto con il precedente checkpoint della PR, non una misura prima/dopo della vecchia app pubblica. Il piccolo aumento deriva da un migliore ordine, non da nuove coppie o ripetizioni aggiunte. Diego mantiene 2 completi/0 parziali distinti e 21 utilizzi completi nelle sessioni brevi; Emanuele mantiene 7/5 e 79/23 utilizzi. Nessuna appartenenza è modificata e nessuna ottimizzazione è rivolta alla playlist esclusa dall’utente.

Evidenza karaoke mantenuta: 192/590 parole, holdout 9/96, nuovo campione 0/78. Generalizzazione ancora insufficiente; nessun nuovo aumento di precisione è dichiarato per questa pubblicazione.

## Verifiche della release

- Suite reale WebKit e test completi: **725/725**, zero fallimenti o saltati — run `43989304350` e `43989309091`.
- DJ: **661/661**, zero fallimenti o saltati — run `43989309301`; controlli Python inclusi.
- Chromium + WebKit Linux: **7/7** — run `43989309056`; altra matrice completa `43988521434` superata.
- Chromium + WebKit macOS Intel: **7/7** — run `43988031183`. Tra quel controllo e la composizione finale non cambiano i file di runtime; cambiano fixture, test e dati correnti di main preservati.
- Ste WebKit Linux, tre ripetizioni del percorso reale: **3/3** — run `43989311485`, oltre a decoder e indice certificato.
- Chromium, Immersive Mode, karaoke, volume, integrità e audit audio indipendente superati prima della pubblicazione; controlli main avviati anche dopo il merge.
- Rendering originale 48 kHz e ricampionamento 44,1 kHz verificati. Il raccordo Modà già incluso rimane parziale: RMS 10,26 ms e true peak 0,998009. Queste misure non sono un giudizio musicale umano.

Le prime preparazioni hanno fallito due controlli corretti prima del rilascio: diagnostica versione e URL degli asset karaoke con revisioni indipendenti. È stata inoltre applicata alla fixture la gestione già verificata dei metadati nativi e del dispositivo Linux. Un tentativo Linux ha mostrato un arresto durante il cambio tra due decoder, prima dell’avvio del mix; la precondizione del test ora richiede l’avanzamento reale dopo il seek, e le tre ripetizioni successive sono superate. Non si attribuisce questo esito a una correzione dimostrata di un iPhone.

Le rigenerazioni offline ML complete ridondanti sono state annullate perché dati e asset validati erano già disponibili. Non sono test superati e non vengono usate per mascherare errori di prodotto.

## Conservazione e ripristino

Nel commit di pubblicazione `stato.json`, `playlist.json` e `karaoke-scan-state.json` sono identici al main immediatamente precedente: le modifiche concorrenti sono conservate. Il conflitto dell’indice è stato risolto per campo, mantenendo la metadata corrente di main e le registrazioni verificate. Nessun download o database personale viene riscritto dalla release.

La prova WebKit esegue installazione 6.734, aggiornamento/attivazione 6.735 e lettura del player nuovo senza rete. Verifica byte per byte brani sentinella separati Ste/Diego/Emanuele, conservazione/migrazione dell’audio nella vecchia cache, IndexedDB, localStorage e una cache estranea. Gli archivi musicali mantengono i nomi stabili; cambia la cache della sola interfaccia. L’attivazione non deve interrompere una sessione in corso.

Il tag remoto `music-box-v6.734-before-progressive-20261117` conserva il prodotto precedente. Un eventuale ripristino va preparato come **nuova versione crescente** (per esempio 6.736 con codice precedente), con nuova revisione della sola shell e test di aggiornamento. Non fare reset forzati di main, non ripristinare le statistiche del tag sopra quelle correnti e non cancellare cache musicali o database. Il revert del merge richiede comunque revisione dei conflitti e delle modifiche intervenute nel frattempo.

## Verifiche richieste sul telefono

Toccare il numero versione e verificare 6.735; provare un brano scaricato in modalità aereo, seek, pausa/ripresa, blocco schermo e cambio traccia con karaoke sia normale sia immersivo. Nessuna cancellazione dei dati Safari o riscaricamento completo è richiesta. Non sono stati effettuati test su iPhone fisico e il precedente rallentamento generale resta non confermato.

La disponibilità di veri mix nelle sessioni lunghe rimane insufficiente. L’equivalenza con Spotify Mixa non è dimostrata. La pubblicazione permette di usare i miglioramenti verificati mentre prosegue lo sviluppo su Ste.
