# Smart Mix: analisi strutturale integrata — 13 novembre 2026

Le finestre interne sono ora usate dal pianificatore e dal lettore. Il confronto ripete tutte le **1.381.800 coppie ordinate di 1.176 sorgenti**, dal riferimento `b656c1573c3d71d023125c906864d7f0b643bbb8`. Codice e audio verificati: `50f2ce9a1fe3ad4466a4f1b8c481bf8bf5dc0692`, PR #59. Main, pubblicazione e MP3 originali non sono modificati.

| Misura del pianificatore reale | Prima | Dopo |
|---|---:|---:|
| Coppie analizzate | 1.381.800 | 1.381.800 |
| Beatmatch completi con verifica audio | 17 | **60** |
| Uscite strutturali almeno 8 s prima di EOF | 0 | **46** |
| Di cui complete / ritmiche parziali | 0 / 0 | **43 / 3** |
| Raccordi brevi, separati dai completi | 2 | 2 |
| Crossfade pianificati | 59.837 | 59.835 |
| Passaggi normali: taglio o nessun piano | 1.233.976 | 1.233.940 |
| Postludi, separati dai beatmatch | 85.581 | 85.573 |
| Underlay, separati dai beatmatch | 2.358 | 2.358 |
| Proposte ritmiche rifiutate | 29 | 29 |
| Sovrapposizione media dei completi | 9,302 s | **9,525 s** |
| Completi Safari senza attenuazione aggiuntiva | 3 | 3 |
| Completi con percorso PCM comune su Safari | 0 | **54** |

Complete/parziali/brevi/crossfade/normali/postludi/underlay/rifiutati coprono esattamente tutte le coppie. Uscite anticipate e disponibilità Safari sono sottoinsiemi; i 54 completi Safari comprendono i 3 già sicuri senza attenuazione.

**Disponibilità nei profili separati:** i completi passano da **3 a 13**: Ste 2→7, Emanuele 0→5, Diego 1→1. Emanuele ha anche 2 parziali. Dei 60 completi di catalogo, 26 attraversano profili diversi e 21 coinvolgono file fuori dall'attuale BUILTIN: non sono coppie disponibili nella singola libreria. Playlist, eliminazioni e coda possono restringere ulteriormente le scelte. Cataloghi invariati: Ste 242, Diego 209, Emanuele 621. Nessuna unione di librerie o eliminazione di versioni con ID Spotify distinti.

## Evidenze, selezione e colli di bottiglia

I 16 artefatti del [workflow sorgente 43463500768](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43463500768) coprono 1.176 brani senza errori: 68.323 battute accettate dal controllo modello/PCM su 1.168 brani, 8.375 confini di novità su 1.149 e 4.689 ipotesi di frase su 904. La ricerca iniziale aveva 5.493 ingressi su 1.109 brani e 102 uscite su 63. La ricerca integrata trova **7.679 ingressi su 1.110 brani e 250 uscite su 130**, riusando i modelli addestrati e misurando il PCM originale delle nuove finestre.

Beat This e Spleeter producono ipotesi, non annotazioni musicali certificate. I posteriori non sono probabilità calibrate di correttezza. Mancano riferimenti manuali di downbeat/frasi sull'intero catalogo; strofa, ritornello, build e drop restano sconosciuti. Si allineano stesso metro, gruppi di 4/8 battute e ancoraggi strutturali verificati sul PCM. Solo 3 delle 90 finestre finali hanno un'ipotesi delimitata di frase su entrambi i lati: non è dimostrata la correttezza di tutte le frasi musicali.

Il funnel separa **291 coppie interne eleggibili** dopo identità, finestre, metro/tempo, voce e armonia; 122 coppie candidate producono 252 finestre da renderizzare. I completi richiedono almeno 90% di corrispondenze fra attacchi PCM realmente osservati, almeno 8 attacchi e RMS ≤40 ms; il percorso a impulsi forti è più restrittivo. Le parziali restano una categoria distinta.

A 48 kHz passano inizialmente 91 finestre. Il decoder a 44,1 kHz ne esclude un'alternativa e richiede più headroom per un'altra. Sono installate **90 finestre strutturali**, per 43 nuove coppie complete e 3 parziali. Alias con lo stesso SHA possono condividere l'audio mantenendo le proprie occorrenze. A 16 kHz passano 91 finestre; 84 punti coincidono con la selezione finale a 48 kHz. I risultati alle due frequenze non sono dichiarati identici. Il lettore riproduce i FLAC a 48 kHz, verificati anche nei decoder a 44,1 kHz, non i rendering diagnostici a 16 kHz.

Il limite resta concreto: soltanto 130 brani hanno un'uscita interna sufficientemente documentata. Molte coppie non superano armonia, voce, ritmo post-render o margine di volume. La maggioranza delle coppie non ha un beatmatch; ulteriore copertura richiede evidenze migliori, non criteri più permissivi.

## Audio reale, voce e Safari

Ogni MP3 è verificato tramite Git blob SHA prima della decodifica. Ritmo e armonia sono misurati nei segmenti interni. SoundTouch conserva la tonalità con tempo entro ±5%; quando possibile si usa esattamente 1× senza elaborazione. Contesto caldo/freddo e ogni variante superano lo stesso controllo indipendente degli attacchi dopo il rendering. RMS, picchi, guadagni e scarti sono nel JSON allegato. Questa è una verifica strumentale, non ascolto umano.

La voce uscente resta a livello pieno fino agli ultimi **400 ms**, interni a **1,2 s** di evidenza vocale quieta. Si controlla ciò che viene effettivamente riprodotto fino al taglio; assenza di dati non significa silenzio. Voce simultanea, parole/LRC positivi vicino al taglio e aggiornamenti durante l'ascolto possono annullare l'uscita. Un verso futuro che non verrà riprodotto non vieta un'uscita precedente.

Su 5 brani inglesi con parole annotate manualmente, il controllo vocale trova 8 finestre falsamente quiete fra 7.044 finestre sovrapposte contenenti parole; nessuna coinvolge i 400 ms effettivi della dissolvenza. Le finestre non sono prove indipendenti; non è una certificazione del catalogo italiano. Le soglie vocali non sono abbassate.

Safari usa un unico buffer delle due registrazioni con margine di picco e rampe graduali. L'elemento nativo usa `muted`, senza affidare l'attenuazione a `volume`. Il cambio riutilizza la sessione autorizzata solo quando il buffer comune possiede l'audio; i cambi normali conservano il comportamento precedente. Sorgente, seek e clock sono verificati prima di restituire l'audio al decoder nativo.

Asset mancanti o respinti non autorizzano un overlap nativo senza headroom. Seek, pausa, coda/stanza, visibilità e download offline annullano le operazioni obsolete. Il test a 44,1 kHz ha portato a rigenerare tre asset con più margine, mantenendo invariati i limiti sui picchi, e a conservare le altre alternative della finestra esclusa.

Il guadagno del buffer segue il volume effettivamente restituito dal decoder nativo, anche se Safari ignora un valore software richiesto più basso. Il comando Muto durante il mix rimane attivo dopo annullamento e handoff; riattivare il volume durante l'overlap non rende contemporaneamente udibile la sorgente nativa. La sola preparazione di una finestra futura non imposta il muto.

Il [test 43515593554](https://github.com/stefanovillaggio8-dot/music-box/actions/runs/43515593554) passa con **96 descrittori in Chromium e WebKit**, sia a 48 sia a 44,1 kHz, zero rifiuti finali. Verifica handoff, rollback dopo seek e percorso reale fra due brani dello stesso profilo: un solo cambio, sorgente corretta, lettura attiva. Sono 92 FLAC unici. WebKit su Linux non certifica iPhone fisico, cuffie, interruzioni di sistema o PWA in background.

## Karaoke misurato

Il vecchio checkpoint `onnx-community/whisper-tiny` mancava della cross-attention necessaria e falliva l'estrazione reale dei timestamp. Il worker usa [whisper-tiny_timestamped](https://huggingface.co/onnx-community/whisper-tiny_timestamped), revisione `517244293732ee2d58139af5814231b7e6830a0d`, multilingue, encoder fp32 e decoder q4. Cache, annullamento, cambi traccia, stime esplicite, occorrenze ripetute e Immersive Mode conservano le protezioni precedenti.

Il benchmark usa 9 finestre di 5 brani di [JamendoLyrics](https://huggingface.co/datasets/jamendolyrics/jamendolyrics), revisione `de188c963fd4539bc769b3feb83582e5a9595e36`. Le parole annotate manualmente sono solo riferimenti di valutazione. Gli ancoraggi delle righe selezionano le finestre: non è misurato anche l'errore delle righe LRC. SHA audio e parametri sono salvati.

Su **590 parole**, 65 sono accettate acusticamente (**11,02%**), 61 restano stimate e 464 non hanno precisione di parola provata. Per le 65 accettate: errore assoluto mediano **58,08 ms** sull'inizio e **73,14 ms** sulla fine, p95 **201,30 / 278,70 ms**. Per le stime: mediana **329,39 / 359,23 ms**, p95 **1.536,72 / 1.747,54 ms**. Le stime non contano come allineamenti accurati. Rap, canto rapido e ripetizioni restano difficili; non c'è una misura equivalente in italiano. Il CTC inglese sperimentale non è abilitato nel lettore.

## Riproducibilità e controlli

- `refine-structure-windows.py`: riuso dei 16 artefatti, copertura/SHA e nuove finestre PCM.
- `build-structural-beat-plans.cjs`: tutte le coppie, elenco separato delle eleggibili e ipotesi strutturali.
- `build-composite-assets.py`: rendering 16/48 kHz, picco sovracampionato, attacchi post-render, `--peak-ceiling=.94` per il margine aggiuntivo.
- `apply-composite-proof.cjs`: installazione di prove legate a sorgenti e coordinate effettive.
- `dj-equivalence-audit.cjs`: pianificatore reale, `--index` e `--lyrics` per ripetere il riferimento precedente.
- `fetch-karaoke-references.py`, `benchmark-karaoke-acoustic.mjs`, `benchmark-vocal-guard.py`: corpus e misurazioni riproducibili.

Regressione locale **603/603**, più **91/91** focalizzati sul fallback; strutturali Python **6/6**. I workflow verificano anche Chromium desktop, WebKit iPhone in primo piano, Immersive Mode, volume, audio indipendente, tutte le coppie e nuova estrazione PCM. Rendering 16/48 kHz paralleli e cache vincolata a manifest, sorgenti e codice evitano di ripetere lavoro invariato. I run superati annullati non sono considerati prove riuscite. Stato puntuale dei workflow nel JSON di verifica allegato.

Nessuna equivalenza a Spotify Mixa è certificata. Nessun merge o rilascio pubblico.
