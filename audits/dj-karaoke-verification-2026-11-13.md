# Music Box · Smart Mix e karaoke — verifica del 13 novembre 2026

**Verdetto: equivalenza a Spotify Mixa NON certificata.** Questo documento
contiene misure riproducibili e distingue la simulazione dei metadati dalla
prova acustica e da quella su un iPhone fisico.

## Copertura delle transizioni

- Catalogo nell'indice: 1.176 brani analizzabili.
- Coppie ordinate possibili: 1.381.800.
- Coppie dichiarate *ritmicamente compatibili* dall'audit esaustivo
  dell'indice alla base di questo ramo: **2 su 1.381.800**.
- Le due coppie sono snap inferiori a circa 1,2 secondi, non mix musicali
  completi di diverse battute. Il conteggio dell'indice non certifica
  l'ascolto, l'assenza di artefatti o il comportamento su Safari.

## MP3 originali: due migliori candidate

`tools/dj-pair-waveform-audit.py` scarica i file originali, li decodifica con
FFmpeg, applica una *approssimazione* della variazione di tempo e confronta
gli onset e la cromia. Da questa verifica usa l'effettivo istante di avvio
previsto, **dopo il preroll di circa 140 ms**. Nelle precedenti misure quel
preroll non veniva applicato e gli onset di clip lunghe erano confrontati
tra estremi non simultanei.

| Coppia | Avvio ritardato | Correlazione ritmica allo stesso istante | Migliore correlazione (lag) | Similarità cromatica |
| --- | ---: | ---: | ---: | ---: |
| 892 → 1096 | 140 ms | −0,088 | 0,409 (−174 ms) | 0,938 |
| 770 → 874 | 136 ms | −0,122 | 0,245 (+151 ms) | 0,879 |

Le armonie risultano relativamente affini, ma queste finestre **non
dimostrano una sovrapposizione delle percussioni convincente al tempo zero**.
Un coefficiente basso non prova da solo che un essere umano percepirà un
passaggio sbagliato: sono finestre molto brevi e i timbri dei colpi sono
diversi. Di conseguenza è scorretto sia certificarle sia bocciarle solo
in base al coefficiente. Occorrono ascolto comparativo e analisi di più
beat originali, non solo dei BPM memorizzati.

Riproduzione:

```sh
node tools/dj-equivalence-audit.cjs --pair-from=audio/songs/track-892.mp3 --pair-to=audio/songs/track-1096.mp3
python tools/dj-pair-waveform-audit.py --only current_verified_snap_1 --only current_verified_snap_2 --output=results/dj-pcm-candidates.json
```

Il secondo comando richiede FFmpeg, NumPy e Librosa 0.11.0. La GitHub Action
`dj-real-audio-audit.yml` esegue tutte le 12 coppie di controllo e conserva
il rapporto JSON come artifact `musicbox-dj-real-pcm-spotcheck`.

## Correzione karaoke verificabile

- Le finestre vocali stereo quasi in controfase usano il canale originale
  più leggibile quando la somma L+R cancellerebbe quasi tutto il canto.
- Timestamp Whisper nulli, mancanti o vuoti non diventano falsi tempi `0`.
- Il numero di versione interna delle finestre audio passa a 4 per poter
  ritentare clip precedentemente scartate con il vecchio preprocessore.
- Non vengono inventati allineamenti: parole di un testo diverso e
  timestamp non verificati rimangono esclusi.

## Test e limiti

- Suite CI DJ: **519/519 passati**, compresi i tre test aggiunti sul segnale
  stereo, i timestamp e l'istante reale di pianificazione del beat.
- Suite mirata karaoke/DJ: **9/9 passati**.
- La suite generica `tests/*.test.cjs` include tre test fuori dalla
  pipeline DJ che falliscono già sulla base precedente: uno richiede
  Playwright qui assente, uno cerca l'antica cache `v6624` e uno cerca
  una firma di funzione senza i parametri oggi presenti.
- Nessuna prova di sincronizzazione parola per parola su tutto il catalogo.
- Nessuna prova automatizzata su iPhone fisico e nessun confronto d'ascolto
  controllato con Spotify Mixa. **Non pubblicare come certificato**.
